import { collection, getDocs, doc, updateDoc, query, where, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile } from '../contexts/AuthContext';

export const userService = {
  async getAllUsers() {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
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
  }
};
