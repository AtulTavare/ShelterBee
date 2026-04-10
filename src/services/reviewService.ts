import { supabase } from '../supabase';

export interface Review {
  id?: string;
  propertyId: string;
  visitorId: string;
  visitorName: string;
  visitorAvatar?: string;
  text: string;
  rating: number;
  date: string;
  reply?: string;
  createdAt?: any;
}

export const reviewService = {
  async getReviewsByProperty(propertyId: string): Promise<Review[]> {
    const { data, error } = await supabase.from('reviews').select('*').eq('property_id', propertyId).order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((r: any) => ({ id: r.id, propertyId: r.property_id, visitorId: r.visitor_id, visitorName: r.visitor_name, visitorAvatar: r.visitor_avatar, text: r.text, rating: r.rating, date: r.date, reply: r.reply, createdAt: r.created_at })) as Review[];
  },

  async addReview(reviewData: Omit<Review, 'id' | 'createdAt'>): Promise<string> {
    const payload = {
      property_id: reviewData.propertyId,
      visitor_id: reviewData.visitorId,
      visitor_name: reviewData.visitorName,
      visitor_avatar: reviewData.visitorAvatar || null,
      text: reviewData.text,
      rating: reviewData.rating,
      date: reviewData.date,
      reply: reviewData.reply || null,
      created_at: new Date()
    };
    const { data, error } = await supabase.from('reviews').insert(payload).select('id').single();
    if (error) throw error;
    return data?.id as string;
  },

  async addReply(reviewId: string, replyText: string): Promise<void> {
    await supabase.from('reviews').update({ reply: replyText }).eq('id', reviewId);
  }
};
