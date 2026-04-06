import { collection, addDoc, getDocs, query, where, updateDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

export interface Review {
  id: string;
  propertyId: string;
  visitorId: string;
  visitorName: string;
  visitorAvatar: string;
  text: string;
  rating: number;
  date: string;
  reply?: string;
  createdAt: any;
}

export const reviewService = {
  async getReviewsByProperty(propertyId: string): Promise<Review[]> {
    const q = query(
      collection(db, 'reviews'),
      where('propertyId', '==', propertyId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
  },

  async addReview(reviewData: Omit<Review, 'id' | 'createdAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'reviews'), {
      ...reviewData,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async addReply(reviewId: string, replyText: string): Promise<void> {
    const reviewRef = doc(db, 'reviews', reviewId);
    await updateDoc(reviewRef, {
      reply: replyText,
    });
  }
};
