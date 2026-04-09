import { createClient } from '@supabase/supabase-js';

// Supabase client for browser (anonymous key)
const env = (import.meta as any).env || {};
const SUPABASE_URL = env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || '';

export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export default supabaseClient;
