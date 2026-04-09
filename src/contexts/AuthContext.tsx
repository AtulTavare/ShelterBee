import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabaseClient as supabase } from '../supabase';

export type UserRole = 'visitor' | 'owner' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  createdAt: any;
  phoneNumber?: string;
  location?: string;
}

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: (role?: UserRole) => Promise<void>;
  register: (email: string, password: string) => Promise<any>;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  updateProfileData: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    // Supabase Auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        try {
          const uid = currentUser.id;
          const { data: prof, error } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
          if (prof) {
            setProfile(prof as any);
          } else {
            // Create a minimal profile for new Supabase user
            const newProfile = {
              id: uid,
              email: currentUser.email || '',
              displayName: currentUser.user_metadata?.full_name ?? currentUser.email,
              photoURL: currentUser.user_metadata?.avatar_url ?? null,
              role: 'visitor',
              createdAt: new Date(),
            };
            const { data: created, error: ic } = await supabase.from('profiles').insert([newProfile]).select('*').single();
            if (created) setProfile(created as any);
          }
        } catch (err) {
          console.error('Error fetching user profile:', err);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
  
    return () => { authListener?.unsubscribe?.(); };
  }, []);

  const signInWithGoogle = async (role: UserRole = 'visitor') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
      if (error) throw error;
      // After sign-in, a profile will be created by backend logic when the session loads
    } catch (error: any) {
      if (error?.code !== 'auth/popup-closed-by-user' && error?.code !== 'auth/cancelled-popup-request') {
        console.error('Error signing in with Google:', error);
      }
      throw error;
    }
  };

  const register = async (email: string, password: string) => {
    // Supabase signup
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  };

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const updateProfileData = async (data: Partial<UserProfile>) => {
    if (!user) return;
    try {
      // Update in Supabase profiles table
      const { id } = user as any;
      const { data: updated, error } = await (async () => {
        const { data, error } = await (supabase.from('profiles').update(data).eq('id', id));
        return { data, error } as any;
      })();
      if (error) throw error;
      setProfile(prev => prev ? { ...prev, ...data } : null);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInWithGoogle, register, login, logout, updateProfileData }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
