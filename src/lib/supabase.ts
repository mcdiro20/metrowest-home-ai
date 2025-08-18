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
  user_id?: string; // Added user_id
}

// New interfaces for dashboard tables
export interface Profile {
  id: string;
  email: string;
  role: 'admin' | 'contractor' | 'homeowner';
  lead_score: number;
  primary_zip_code?: string;
  ai_renderings_count: number;
  login_count: number;
  total_time_on_site_ms: number;
  last_login_at?: string;
  created_at: string;
}

export interface Contractor {
  id: string;
  name: string;
  email: string;
  assigned_zip_codes: string[];
  created_at: string;
}

export interface UserEvent {
  id: string;
  user_id: string;
  event_type: 'login' | 'upload' | 'view' | 'share' | 'time_spent' | string; // Added string for flexibility
  metadata?: Record<string, any>;
  created_at: string;
}
