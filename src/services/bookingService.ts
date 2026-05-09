import { collection, addDoc, getDocs, query, where, doc, updateDoc, serverTimestamp, getDoc, setDoc, limit, orderBy } from 'firebase/firestore';
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
  estimatedCost?: number; // Added for UI compatibility
}

export const bookingService = {
  async createBooking(bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt' | 'walletProcessed'>) {
    try {
      // NOTE: Firebase Console firestore.rules update needed manually:
      // In bookings create rule change:
      // incoming().status == 'pending_owner'
      // TO:
      // incoming().status in ['confirmed', 'pending_owner']
      const docRef = await addDoc(collection(db, 'bookings'), {
        ...bookingData,
        status: 'confirmed',
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
        console.log('Wallet processed for booking:', bookingId);
      } catch (walletError) {
        console.error('Wallet failed for booking:', bookingId, walletError);
        // Booking still created, wallet will retry
      }

      return bookingId;
    } catch (error) {
      console.error("Error creating booking:", error);
      throw error;
    }
  },

  async acceptBooking(bookingId: string) {
    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, {
        status: 'confirmed',
        acceptedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      // NO wallet change (already processed on creation)
      return true;
    } catch (error) {
      console.error("Error accepting booking:", error);
      throw error;
    }
  },

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
      } catch (walletError) {
        console.error('Rejection wallet failed:', walletError);
      }

      return true;
    } catch (error) {
      console.error("Error rejecting booking:", error);
      throw error;
    }
  },

  async cancelBooking(bookingId: string, refundPercent: number) {
    try {
      const booking = await this.getBookingById(bookingId);
      if (!booking) throw new Error("Booking not found");

      const bookingRef = doc(db, 'bookings', bookingId);
      const refundAmount = booking.totalAmount * (refundPercent / 100);

      console.log('Cancel step 1: updating status...');
      await updateDoc(bookingRef, {
        status: 'cancelled',
        refundPercentage: refundPercent,
        refundAmount: refundAmount,
        cancelledAt: serverTimestamp(),
        cancelledBy: 'visitor',
        updatedAt: serverTimestamp()
      });
      console.log('Booking cancelled successfully');

      console.log('Cancel step 2: processing wallet...');
      try {
        await walletService.processCancellationWallet(
          booking, 
          refundPercent
        );
        console.log('Wallet updated after cancellation');
      } catch (walletError) {
        console.error('Wallet update failed but booking cancelled:', walletError);
      }
      console.log('Cancel step 3: done');

      return true;
    } catch (error) {
      console.error("Error cancelling booking:", error);
      throw error;
    }
  },

  async retryFailedWalletTransactions(ownerUid: string) {
    try {
      const q = query(
        collection(db, 'bookings'),
        where('ownerId', '==', ownerUid),
        where('walletProcessed', '==', false)
      );
      const failedBookings = await getDocs(q);
      
      for (const bookingDoc of failedBookings.docs) {
        const data = bookingDoc.data();
        try {
          await walletService.processBookingWallet(
            bookingDoc.id,
            data.totalAmount,
            data.ownerId,
            data.visitorId,
            data.propertyTitle || 'Property'
          );
        } catch (err) {
          console.error('Retry failed:', bookingDoc.id, err);
        }
      }
    } catch (error) {
      console.error("Error in retryFailedWalletTransactions:", error);
    }
  },

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

  async getBookingsByProperty(propertyId: string) {
    try {
      const q = query(
        collection(db, 'bookings'), 
        where('propertyId', '==', propertyId),
        where('status', 'in', ['confirmed', 'pending_owner'])
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        checkIn: doc.data().checkIn?.toDate() || null,
        checkOut: doc.data().checkOut?.toDate() || null,
      })) as Booking[];
    } catch (error) {
      console.error("Error fetching property bookings:", error);
      throw error;
    }
  },

  async getAllBookings() {
    try {
      const q = query(
        collection(db, 'bookings'), 
        orderBy('createdAt', 'desc'), 
        limit(100)
      );
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

  async getBookingFinancials(bookingId: string) {
    const booking = await this.getBookingById(bookingId);
    if (!booking) return { ownerPayout: 0, platformCommission: 0, visitorRefund: 0 };
    
    return {
      ownerPayout: booking.totalAmount * 0.75,
      platformCommission: booking.totalAmount * 0.25,
      visitorRefund: 0 // Placeholder
    };
  },

  async updateBookingStatus(bookingId: string, status: Booking['status'], extraData?: any) {
    try {
      const booking = await this.getBookingById(bookingId);
      if (!booking) throw new Error("Booking not found");

      if (status === 'confirmed') {
        return this.acceptBooking(bookingId);
      } else if (status === 'rejected_by_owner') {
        return this.rejectBooking(bookingId, extraData?.rejectionReason);
      } else if (status === 'cancelled') {
        const refundPercent = extraData?.refundPercentage ?? 100;
        return this.cancelBooking(bookingId, refundPercent);
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
