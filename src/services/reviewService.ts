import { collection, addDoc, getDocs, query, where, updateDoc, doc, serverTimestamp, orderBy, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export interface Review {
  id: string;
  propertyId: string;
  visitorId: string;
  bookingId: string;
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

    // Update property rating and review count by fetching all reviews
    try {
      const q = query(collection(db, 'reviews'), where('propertyId', '==', reviewData.propertyId));
      const snapshot = await getDocs(q);
      const reviews = snapshot.docs.map(doc => doc.data());
      
      const totalReviews = reviews.length;
      const sumRatings = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
      const averageRating = totalReviews > 0 ? Number((sumRatings / totalReviews).toFixed(1)) : 0;
      
      const propertyRef = doc(db, 'properties', reviewData.propertyId);
      await updateDoc(propertyRef, {
        averageRating: averageRating,
        totalReviews: totalReviews,
        // Also update legacy fields for compatibility
        rating: averageRating,
        reviewCount: totalReviews
      });
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
