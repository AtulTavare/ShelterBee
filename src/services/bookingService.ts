import { createClient } from '@supabase/supabase-js';
import { supabase } from '../supabase';

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
    const payload: any = {
      property_id: bookingData.propertyId,
      visitor_id: bookingData.visitorId,
      owner_id: bookingData.ownerId,
      visitor_name: bookingData.visitorName,
      visitor_contact: bookingData.visitorContact,
      is_whatsapp: bookingData.isWhatsapp,
      whatsapp_number: bookingData.whatsappNumber || null,
      check_in: bookingData.checkIn,
      check_out: bookingData.checkOut,
      nights: bookingData.nights,
      estimated_cost: bookingData.estimatedCost,
      platform_fee: Math.round(bookingData.estimatedCost * 0.25),
      status: bookingData.status,
      created_at: new Date(),
      updated_at: new Date()
    };
    const { data, error } = await supabase.from('bookings').insert([payload]).select('id').single();
    if (error) throw error;
    return (data && data.id) as string;
  },

  async getBookingsByVisitor(visitorId: string) {
    const { data, error } = await supabase.from('bookings').select('*').eq('visitor_id', visitorId);
    if (error) throw error;
    return (data || []) as Booking[];
  },

  async getBookingsByOwner(ownerId: string) {
    const { data, error } = await supabase.from('bookings').select('*').eq('owner_id', ownerId);
    if (error) throw error;
    return (data || []) as Booking[];
  },

  async getAllBookings() {
    const { data, error } = await supabase.from('bookings').select('*');
    if (error) throw error;
    return (data || []) as Booking[];
  },

  async updateBookingStatus(bookingId: string, status: Booking['status']) {
    const { error } = await supabase.from('bookings').update({ status, updated_at: new Date() }).eq('id', bookingId);
    if (error) throw error;
  }
};
