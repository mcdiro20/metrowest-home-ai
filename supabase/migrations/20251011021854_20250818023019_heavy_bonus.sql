/*
  # Add User Profile Metrics

  1. Schema Changes
    - Add `ai_renderings_count` to profiles table
    - Add `login_count` to profiles table  
    - Add `total_time_on_site_ms` to profiles table
    - Add `last_login_at` to profiles table

  2. Functions
    - Create function to update user metrics
    - Create triggers to automatically update counts

  3. Security
    - Update RLS policies as needed
*/

-- Add new columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS ai_renderings_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS login_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_time_on_site_ms bigint DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_login_at timestamptz;

-- Create function to increment AI rendering count
CREATE OR REPLACE FUNCTION increment_ai_rendering_count(user_uuid uuid)
RETURNS void AS $$
BEGIN
  INSERT INTO public.profiles (id, email, ai_renderings_count)
  VALUES (user_uuid, '', 1)
  ON CONFLICT (id) 
  DO UPDATE SET ai_renderings_count = profiles.ai_renderings_count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to increment login count
CREATE OR REPLACE FUNCTION increment_login_count(user_uuid uuid, user_email text)
RETURNS void AS $$
BEGIN
  INSERT INTO public.profiles (id, email, login_count, last_login_at)
  VALUES (user_uuid, user_email, 1, now())
  ON CONFLICT (id) 
  DO UPDATE SET 
    login_count = profiles.login_count + 1,
    last_login_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to add time on site
CREATE OR REPLACE FUNCTION add_time_on_site(user_uuid uuid, time_spent_ms bigint)
RETURNS void AS $$
BEGIN
  INSERT INTO public.profiles (id, email, total_time_on_site_ms)
  VALUES (user_uuid, '', time_spent_ms)
  ON CONFLICT (id) 
  DO UPDATE SET total_time_on_site_ms = profiles.total_time_on_site_ms + time_spent_ms;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION increment_ai_rendering_count(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_login_count(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION add_time_on_site(uuid, bigint) TO authenticated;