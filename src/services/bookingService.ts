import { collection, addDoc, getDocs, query, where, doc, updateDoc, serverTimestamp, getDoc, limit, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { walletService } from './walletService';

export interface GuestDetail {
  name: string;
  age: number;
  gender: string;
  contactNo?: string;
  relation?: string;
  type: 'adult' | 'child';
}

export interface Booking {
  id?: string;
  propertyId: string;
  visitorId: string;
  ownerId: string;
  visitorName: string;
  visitorContact: string;
  isWhatsapp: boolean;
  whatsappNumber?: string;
  checkIn: Date | null;
  checkOut: Date | null;
  nights: number;
  totalAmount: number;
  status: 'pending_owner' | 'confirmed' | 'cancelled' | 'rejected_by_owner' | 'completed';
  rejectionReason?: string;
  rejectedAt?: any;
  acceptedAt?: any;
  refundPercentage?: number;
  refundAmount?: number;
  guests: GuestDetail[];
  govIdAcknowledged: boolean;
  visitTime?: string;
  propertyTitle?: string;
  createdAt: any;
  updatedAt: any;
  walletProcessed: boolean;
}

export const bookingService = {
  // 1. createBooking: call processBookingWallet()
  async createBooking(bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt' | 'walletProcessed'>) {
    try {
      const docRef = await addDoc(collection(db, 'bookings'), {
        ...bookingData,
        status: 'pending_owner',
        walletProcessed: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      const bookingId = docRef.id;

      try {
        await walletService.processBookingWallet(
          bookingId, 
          bookingData.totalAmount,
          bookingData.ownerId, 
          bookingData.visitorId, 
          bookingData.propertyTitle || 'Property'
        );
        console.log(`processBookingWallet success for booking: ${bookingId}`);
      } catch (walletError) {
        console.error('Initial processBookingWallet failed:', { bookingId, error: (walletError as any).message });
      }

      return bookingId;
    } catch (error) {
      console.error("Error creating booking:", error);
      throw error;
    }
  },

  // 2. acceptBooking: only update status, NO wallet changes
  async acceptBooking(bookingId: string) {
    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, {
        status: 'confirmed',
        acceptedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log(`acceptBooking success for: ${bookingId}`);
      return true;
    } catch (error) {
      console.error("Error accepting booking:", error);
      throw error;
    }
  },

  // 3. rejectBooking: update status and call processOwnerRejectionWallet()
  async rejectBooking(bookingId: string, rejectionReason?: string) {
    try {
      const booking = await this.getBookingById(bookingId);
      if (!booking) throw new Error("Booking not found");

      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, {
        status: 'rejected_by_owner',
        rejectionReason: rejectionReason || 'Owner rejected booking',
        rejectedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      try {
        await walletService.processOwnerRejectionWallet(
          bookingId,
          booking.totalAmount,
          booking.ownerId,
          booking.visitorId,
          booking.propertyTitle || 'Property'
        );
        console.log(`processOwnerRejectionWallet success for: ${bookingId}`);
      } catch (walletError) {
        console.error('rejectBooking wallet failed:', { bookingId, error: (walletError as any).message });
        await updateDoc(bookingRef, { walletProcessed: false });
      }

      return true;
    } catch (error) {
      console.error("Error rejecting booking:", error);
      throw error;
    }
  },

  // 4. cancelBooking: determine wasAccepted and refundPercent, call processCancellationWallet()
  async cancelBooking(bookingId: string) {
    try {
      const booking = await this.getBookingById(bookingId);
      if (!booking) throw new Error("Booking not found");

      const checkInDate = booking.checkIn ? new Date(booking.checkIn) : new Date();
      const now = new Date();
      const diffMs = checkInDate.getTime() - now.getTime();
      const hoursBeforeCheckIn = diffMs / (1000 * 60 * 60);

      let refundPercent = 100; // Default for pending
      const wasAccepted = booking.status === 'confirmed';

      if (wasAccepted) {
        if (hoursBeforeCheckIn > 24) {
          refundPercent = 75;
        } else if (hoursBeforeCheckIn > 6) {
          refundPercent = 50;
        } else {
          refundPercent = 0;
        }
      }

      const bookingRef = doc(db, 'bookings', bookingId);
      const refundAmount = booking.totalAmount * (refundPercent / 100);

      await updateDoc(bookingRef, {
        status: 'cancelled',
        refundPercentage: refundPercent,
        refundAmount: refundAmount,
        updatedAt: serverTimestamp()
      });

      try {
        await walletService.processCancellationWallet(
          booking, 
          refundPercent,
          wasAccepted
        );
        console.log(`processCancellationWallet success for: ${bookingId}, refundPercent: ${refundPercent}`);
      } catch (walletError) {
        console.error('cancelBooking wallet failed:', { bookingId, error: (walletError as any).message });
        await updateDoc(bookingRef, { walletProcessed: false });
      }

      return true;
    } catch (error) {
      console.error("Error cancelling booking:", error);
      throw error;
    }
  },

  // 5. retryFailedWalletTransactions
  async retryFailedWalletTransactions(ownerUid: string) {
    try {
      const q = query(
        collection(db, 'bookings'),
        where('ownerId', '==', ownerUid),
        where('walletProcessed', '==', false),
        where('status', '!=', 'pending_owner') // Pending ones might still be pending
      );
      const failedBookings = await getDocs(q);
      
      console.log(`Found ${failedBookings.size} failed wallet transactions for owner ${ownerUid}`);
      
      for (const bookingDoc of failedBookings.docs) {
        const booking = { id: bookingDoc.id, ...bookingDoc.data() } as any;
        try {
          if (booking.status === 'rejected_by_owner') {
            await walletService.processOwnerRejectionWallet(
              booking.id,
              booking.totalAmount,
              booking.ownerId,
              booking.visitorId,
              booking.propertyTitle || 'Property'
            );
          } else if (booking.status === 'cancelled') {
            // We assume refundPercentage was already calculated and saved
            const wasAccepted = booking.acceptedAt !== undefined && booking.acceptedAt !== null;
            await walletService.processCancellationWallet(
              booking,
              booking.refundPercentage || 0,
              wasAccepted
            );
          } else if (booking.status === 'confirmed' || booking.status === 'pending_owner') {
            // Re-run the initial credit
            await walletService.processBookingWallet(
              booking.id,
              booking.totalAmount,
              booking.ownerId,
              booking.visitorId,
              booking.propertyTitle || 'Property'
            );
          }
          console.log(`Retried and succeeded for booking: ${booking.id}`);
        } catch (err) {
          console.error(`Retry failed for booking: ${booking.id}`, err);
        }
      }
    } catch (error) {
      console.error("Error in retryFailedWalletTransactions:", error);
    }
  },

  // Helper methods
  async getBookingsByVisitor(visitorId: string) {
    try {
      const q = query(collection(db, 'bookings'), where('visitorId', '==', visitorId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        checkIn: doc.data().checkIn?.toDate() || null,
        checkOut: doc.data().checkOut?.toDate() || null,
      })) as Booking[];
    } catch (error) {
      console.error("Error fetching visitor bookings:", error);
      throw error;
    }
  },

  async getBookingsByOwner(ownerId: string) {
    try {
      const q = query(collection(db, 'bookings'), where('ownerId', '==', ownerId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        checkIn: doc.data().checkIn?.toDate() || null,
        checkOut: doc.data().checkOut?.toDate() || null,
      })) as Booking[];
    } catch (error) {
      console.error("Error fetching owner bookings:", error);
      throw error;
    }
  },

  async getBookingById(bookingId: string) {
    try {
      const docRef = doc(db, 'bookings', bookingId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          checkIn: data.checkIn?.toDate() || null,
          checkOut: data.checkOut?.toDate() || null,
        } as Booking;
      }
      return null;
    } catch (error) {
      console.error("Error fetching booking:", error);
      return null;
    }
  },

  async getAllBookings() {
    try {
      const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'), limit(100));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        checkIn: doc.data().checkIn?.toDate() || null,
        checkOut: doc.data().checkOut?.toDate() || null,
      })) as Booking[];
    } catch (error) {
      console.error("Error fetching all bookings:", error);
      throw error;
    }
  },

  async updateBookingStatus(bookingId: string, status: Booking['status'], extraData?: any) {
    try {
      if (status === 'confirmed') {
        return this.acceptBooking(bookingId);
      } else if (status === 'rejected_by_owner') {
        return this.rejectBooking(bookingId, extraData?.rejectionReason);
      } else if (status === 'cancelled') {
        return this.cancelBooking(bookingId);
      } else {
        const bookingRef = doc(db, 'bookings', bookingId);
        await updateDoc(bookingRef, {
          status,
          ...extraData,
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error("Error updating booking status:", error);
      throw error;
    }
  }
};
