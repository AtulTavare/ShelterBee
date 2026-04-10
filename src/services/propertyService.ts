import { supabase } from '../supabase';

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
    const payload = {
      owner_id: propertyData.ownerId,
      title: propertyData.title,
      type: propertyData.type,
      area: propertyData.area,
      address: propertyData.address,
      price_per_day: propertyData.pricePerDay,
      photos: propertyData.photos,
      amenities: propertyData.amenities,
      description: propertyData.description,
      status: 'Pending',
      created_at: new Date(),
    };
    const { data, error } = await supabase.from('properties').insert([payload]).select('id').single();
    if (error) throw error;
    return data?.id as string;
  },

  async getApprovedProperties() {
    const { data, error } = await supabase.from('properties').select('*').eq('status', 'Approved');
    if (error) throw error;
    return (data || []).map((p: any) => ({ id: p.id, ...p, createdAt: p.created_at })) as Property[];
  },

  async getAllProperties() {
    const { data, error } = await supabase.from('properties').select('*');
    if (error) throw error;
    return (data || []).map((p: any) => ({ id: p.id, ...p, createdAt: p.created_at })) as Property[];
  },

  async getPropertiesByOwner(ownerId: string) {
    const { data, error } = await supabase.from('properties').select('*').eq('owner_id', ownerId);
    if (error) throw error;
    return (data || []).map((p: any) => ({ id: p.id, ...p, createdAt: p.created_at })) as Property[];
  },

  async getPropertyById(id: string) {
    const { data, error } = await supabase.from('properties').select('*').eq('id', id).single();
    if (error || !data) return null;
    const p = data as any;
    return { id: p.id, ownerId: p.owner_id, ...p, createdAt: p.created_at } as Property;
  },

  async updatePropertyStatus(id: string, status: 'Pending' | 'Approved' | 'Rejected') {
    await supabase.from('properties').update({ status }).eq('id', id);
  },

  async updateProperty(id: string, data: Partial<Property>) {
    const updatePayload: any = { ...data };
    delete updatePayload.id;
    await supabase.from('properties').update(updatePayload).eq('id', id);
  },

  async deleteProperty(id: string) {
    await supabase.from('properties').delete().eq('id', id);
  }
};
