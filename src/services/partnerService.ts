import { db } from '../firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc,
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';

class PartnerService {
  async createPartnerProfile(uid: string, data: any) {
    await setDoc(doc(db, 'partners', uid), {
      uid,
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }

  async getPartnerProfile(uid: string) {
    const docSnap = await getDoc(doc(db, 'partners', uid));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  }

  async getAllPartners() {
    const snapshot = await getDocs(collection(db, 'partners'));
    return snapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data(),
    } as any));
  }

  async approvePartner(uid: string) {
    await updateDoc(doc(db, 'users', uid), {
      partnerStatus: 'approved',
      role: 'partner',
      updatedAt: Timestamp.now(),
    });
    await updateDoc(doc(db, 'partners', uid), {
      status: 'approved',
      updatedAt: Timestamp.now(),
    });
  }

  async rejectPartner(uid: string) {
    await updateDoc(doc(db, 'users', uid), {
      partnerStatus: 'rejected',
      updatedAt: Timestamp.now(),
    });
    await updateDoc(doc(db, 'partners', uid), {
      status: 'rejected',
      updatedAt: Timestamp.now(),
    });
  }

  async getPartnerStats(uid: string) {
    const commissionsQuery = query(
      collection(db, 'partnerCommissions'),
      where('partnerId', '==', uid)
    );
    const snapshot = await getDocs(commissionsQuery);
    const commissions = snapshot.docs.map(d => d.data());

    return {
      totalReferrals: commissions.length,
      completedBookings: commissions.filter(c => c.status === 'completed').length,
      totalCommission: commissions.filter(c => c.status === 'completed').reduce((sum, c) => sum + (c.amount || 0), 0),
      pendingCommission: commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + (c.amount || 0), 0),
    };
  }

  async recordCommission(data: {
    partnerId: string;
    bookingId: string;
    amount: number;
    status: 'pending' | 'completed' | 'cancelled';
  }) {
    const ref = doc(collection(db, 'partnerCommissions'));
    await setDoc(ref, {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return ref.id;
  }
}

export const partnerService = new PartnerService();
