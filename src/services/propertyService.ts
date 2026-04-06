import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export interface Property {
  id?: string;
  ownerId: string;
  title: string;
  type: string;
  area: string;
  address: string;
  pricePerDay: number;
  deposit: number;
  photos: string[];
  amenities: string[];
  description: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: any;
  availableFrom?: string;
  isAvailable?: boolean;
  rating?: number;
  reviewCount?: number;
  aadhaarFront?: string;
  aadhaarBack?: string;
  propertyProof?: string;
}

export const propertyService = {
  async addProperty(propertyData: Omit<Property, 'id' | 'createdAt' | 'status'>) {
    const propertiesRef = collection(db, 'properties');
    const docRef = await addDoc(propertiesRef, {
      ...propertyData,
      status: 'Pending',
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async getApprovedProperties() {
    try {
      const q = query(collection(db, 'properties'), where('status', '==', 'Approved'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || null,
      })) as Property[];
    } catch (error) {
      console.error("Error fetching approved properties:", error);
      throw error;
    }
  },

  async getAllProperties() {
    const propertiesRef = collection(db, 'properties');
    const snapshot = await getDocs(propertiesRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
  },

  async getPropertiesByOwner(ownerId: string) {
    const propertiesRef = collection(db, 'properties');
    const q = query(propertiesRef, where('ownerId', '==', ownerId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
  },

  async getPropertyById(id: string) {
    try {
      const docRef = doc(db, 'properties', id);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return { id: snapshot.id, ...snapshot.data() } as Property;
      }
      return null;
    } catch (error) {
      console.error("Error fetching property by id:", error);
      return null;
    }
  },

  async updatePropertyStatus(id: string, status: 'Pending' | 'Approved' | 'Rejected') {
    const docRef = doc(db, 'properties', id);
    await updateDoc(docRef, { status });
  },

  async updateProperty(id: string, data: Partial<Property>) {
    const docRef = doc(db, 'properties', id);
    await updateDoc(docRef, data);
  },

  async deleteProperty(id: string) {
    const docRef = doc(db, 'properties', id);
    await deleteDoc(docRef);
  }
};
