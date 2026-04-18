import { collection, addDoc, getDocs, query, where, doc, updateDoc, serverTimestamp, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

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
  status: 'pending' | 'confirmed' | 'cancelled' | 'rejected' | 'completed';
  rejectionReason?: string;
  guests: GuestDetail[];
  govIdAcknowledged: boolean;
  visitTime?: string;
  createdAt: any;
  updatedAt: any;
  // These are for UI convenience when loaded by owner/admin
  platformCommission?: number;
  receivedAmount?: number;
  estimatedCost?: number;
}

export interface BookingFinancials {
  platformCommission: number;
  receivedAmount: number;
  ownerId: string;
  visitorId: string;
}

export const bookingService = {
  async createBooking(bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt' | 'platformCommission' | 'receivedAmount'>, financials: { platformCommission: number, receivedAmount: number }) {
    try {
      const docRef = await addDoc(collection(db, 'bookings'), {
        ...bookingData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      // Store sensitive financials in a separate collection
      await setDoc(doc(db, 'bookingFinancials', docRef.id), {
        ...financials,
        ownerId: bookingData.ownerId,
        visitorId: bookingData.visitorId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return docRef.id;
    } catch (error) {
      console.error("Error creating booking:", error);
      throw error;
    }
  },

  async getBookingFinancials(bookingId: string) {
    try {
      const docRef = doc(db, 'bookingFinancials', bookingId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as BookingFinancials;
      }
      return null;
    } catch (error) {
      console.error("Error fetching financials:", error);
      return null;
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
      const q = query(collection(db, 'bookings'), where('propertyId', '==', propertyId));
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
      const querySnapshot = await getDocs(collection(db, 'bookings'));
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
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, {
        status,
        ...extraData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating booking status:", error);
      throw error;
    }
  }
};
