import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables - database features will be disabled');
}

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Server-side Supabase client for API routes
export const createServerSupabaseClient = () => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('Missing server Supabase environment variables');
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceKey);
};

// Database types for leads table
export interface Lead {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  zip?: string;
  room_type?: string;
  style?: string;
  image_url?: string;
  ai_url?: string;
  render_count: number;
  image_width?: number;
  image_height?: number;
  wants_quote: boolean;
  social_engaged: boolean;
  is_repeat_visitor: boolean;
  lead_score: number;
  created_at: string;
}