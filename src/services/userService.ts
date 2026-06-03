import { collection, getDocs, doc, updateDoc, query, where, getDoc, limit, orderBy, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile } from '../contexts/AuthContext';

export const userService = {
  async getAllUsers() {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('createdAt', 'desc'), limit(100));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
  },

  async getUsersByRole(role: 'visitor' | 'owner' | 'admin') {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', role));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
  },

  async updateUserStatus(uid: string, status: 'Active' | 'Inactive') {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { status });
  },

  async getUserProfile(uid: string) {
    const userRef = doc(db, 'users', uid);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      return { uid: docSnap.id, ...docSnap.data() } as UserProfile;
    }
    return null;
  },

  async sendWarning(ownerId: string, reason: string, adminId: string) {
    const ref = await addDoc(collection(db, 'warnings'), {
      ownerId,
      reason,
      issuedBy: adminId,
      dismissed: false,
      dismissedAt: null,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  },

  async getActiveWarnings(ownerId: string) {
    const q = query(
      collection(db, 'warnings'),
      where('ownerId', '==', ownerId),
      where('dismissed', '==', false),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async dismissWarning(warningId: string) {
    await updateDoc(doc(db, 'warnings', warningId), {
      dismissed: true,
      dismissedAt: serverTimestamp(),
    });
  },

  async banUser(ownerId: string, reason: string, adminId: string) {
    const owner = await this.getUserProfile(ownerId);
    if (!owner) throw new Error('User not found');
    await addDoc(collection(db, 'bannedUsers'), {
      uid: ownerId,
      email: owner.email || '',
      mobile: (owner as any).mobile || (owner as any).phone || '',
      displayName: owner.displayName || '',
      reason,
      bannedBy: adminId,
      createdAt: serverTimestamp(),
    });
    await updateDoc(doc(db, 'users', ownerId), { status: 'Inactive' });
  },

  async checkBannedUser(email: string, mobile: string, displayName: string): Promise<boolean> {
    const snap = await getDocs(collection(db, 'bannedUsers'));
    if (snap.empty) return false;
    for (const d of snap.docs) {
      const data = d.data();
      let matchCount = 0;
      if (email && data.email && email.toLowerCase() === data.email.toLowerCase()) matchCount++;
      if (mobile && data.mobile && mobile.replace(/\D/g, '') === data.mobile.replace(/\D/g, '')) matchCount++;
      if (displayName && data.displayName) {
        const a = displayName.toLowerCase().replace(/\s/g, '');
        const b = data.displayName.toLowerCase().replace(/\s/g, '');
        if (a.includes(b) || b.includes(a)) matchCount++;
      }
      if (matchCount >= 2) return true;
    }
    return false;
  },

  async addPenalty(ownerId: string, amount: number, reason: string, bookingId: string) {
    const ref = await addDoc(collection(db, 'penalties'), {
      ownerId,
      amount,
      reason,
      bookingId,
      status: 'pending',
      appliedAt: null,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  },

  async getPendingPenalties(ownerId: string) {
    const q = query(
      collection(db, 'penalties'),
      where('ownerId', '==', ownerId),
      where('status', '==', 'pending'),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() })) as Array<{ id: string; ownerId: string; amount: number; reason: string; bookingId: string; status: string }>;
  },

  async applyPenalty(penaltyId: string) {
    await updateDoc(doc(db, 'penalties', penaltyId), {
      status: 'applied',
      appliedAt: serverTimestamp(),
    });
  },
};
