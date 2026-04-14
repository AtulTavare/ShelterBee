import { collection, addDoc, getDocs, query, where, updateDoc, doc, serverTimestamp, orderBy, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export interface Review {
  id: string;
  propertyId: string;
  visitorId: string;
  visitorName: string;
  visitorAvatar: string;
  text: string;
  rating: number;
  ratings: {
    cleanliness: number;
    safety: number;
    ownerBehavior: number;
    comfort: number;
  };
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

    // Update property rating and review count
    try {
      const propertyRef = doc(db, 'properties', reviewData.propertyId);
      const propertySnap = await getDoc(propertyRef);
      if (propertySnap.exists()) {
        const propertyData = propertySnap.data();
        const currentRating = propertyData.rating || 0;
        const currentReviewCount = propertyData.reviewCount || 0;
        
        const newReviewCount = currentReviewCount + 1;
        const newRating = Number(((currentRating * currentReviewCount + reviewData.rating) / newReviewCount).toFixed(1));
        
        await updateDoc(propertyRef, {
          rating: newRating,
          reviewCount: newReviewCount
        });
      }
    } catch (error) {
      console.error("Error updating property rating:", error);
    }

    return docRef.id;
  },

  async addReply(reviewId: string, replyText: string): Promise<void> {
    const reviewRef = doc(db, 'reviews', reviewId);
    await updateDoc(reviewRef, {
      reply: replyText,
    });
  }
};
