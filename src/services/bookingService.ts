import { collection, addDoc, getDocs, query, where, doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

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
  estimatedCost: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: any;
  updatedAt: any;
}

export const bookingService = {
  async createBooking(bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const docRef = await addDoc(collection(db, 'bookings'), {
        ...bookingData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error("Error creating booking:", error);
      throw error;
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

  async updateBookingStatus(bookingId: string, status: Booking['status']) {
    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, {
        status,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating booking status:", error);
      throw error;
    }
  }
};
