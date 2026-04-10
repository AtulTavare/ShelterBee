import { supabase } from '../supabase';
import { UserProfile } from '../contexts/AuthContext';

export const userService = {
  async getAllUsers() {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) throw error;
    return (data || []).map((u: any) => ({ uid: u.id, email: u.email, displayName: u.display_name, photoURL: u.photo_url, role: u.role, createdAt: u.created_at, phoneNumber: u.mobile, location: u.locale })) as UserProfile[];
  },

  async getUsersByRole(role: 'visitor' | 'owner' | 'admin') {
    const { data, error } = await supabase.from('profiles').select('*').eq('role', role);
    if (error) throw error;
    return (data || []).map((u: any) => ({ uid: u.id, email: u.email, displayName: u.display_name, photoURL: u.photo_url, role: u.role, createdAt: u.created_at, phoneNumber: u.mobile, location: u.locale })) as UserProfile[];
  },

  async updateUserStatus(uid: string, status: 'Active' | 'Inactive') {
    const { error } = await supabase.from('profiles').update({ status }).eq('id', uid);
    if (error) throw error;
  },

  async getUserProfile(uid: string) {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).single();
    if (error || !data) return null;
    const u = data as any;
    return { uid: u.id, email: u.email, displayName: u.display_name, photoURL: u.photo_url, role: u.role, createdAt: u.created_at, phoneNumber: u.mobile, location: u.locale } as UserProfile;
  }
};
