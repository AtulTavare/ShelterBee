import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
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
  rejectionReason?: string;
  createdAt: any;
  updatedAt?: any;
  availableFrom?: string;
  isAvailable?: boolean;
  rating?: number;
  reviewCount?: number;
  aadhaarFront?: string;
  aadhaarBack?: string;
  propertyProof?: string;
  // New fields
  guests?: number;
  bedrooms?: number;
  beds?: number;
  bathrooms?: number;
  gender?: string[]; // Male, Female, Other
  checkInTime?: string;
  checkOutTime?: string;
  submissionType?: 'new listing' | 'changes approval' | 'resubmission';
  unavailabilityUntil?: any; // Date or 'permanently' or 'manual'
  availabilityStatus?: 'available' | 'unavailable';
  unavailableFrom?: string; // ISO string
  unavailableTo?: string; // ISO string
  unavailabilityOption?: 'today' | 'range' | 'manual';
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
      const now = new Date();
      
      return querySnapshot.docs
        .map(doc => {
          const data = doc.data();
          let createdAt = null;
          if (data.createdAt) {
            if (typeof data.createdAt.toDate === 'function') {
              createdAt = data.createdAt.toDate();
            } else if (typeof data.createdAt === 'string' || typeof data.createdAt === 'number') {
              createdAt = new Date(data.createdAt);
            }
          }
          return {
            id: doc.id,
            ...data,
            createdAt,
          };
        })
        .filter(prop => this.isPropertyAvailable(prop as Property, now)) as Property[];
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
    await setDoc(docRef, data, { merge: true });
  },

  async deleteProperty(id: string) {
    const docRef = doc(db, 'properties', id);
    await deleteDoc(docRef);
  },

  isPropertyAvailable(property: Property, date: Date = new Date()) {
    if (property.status !== 'Approved') return false;
    if (property.availabilityStatus === 'unavailable') {
      if (property.unavailabilityOption === 'manual') return false;
      
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);
      
      if (property.unavailableFrom && property.unavailableTo) {
        const from = new Date(property.unavailableFrom);
        const to = new Date(property.unavailableTo);
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        
        if (checkDate >= from && checkDate <= to) return false;
      }
    }
    return true;
  }
};
