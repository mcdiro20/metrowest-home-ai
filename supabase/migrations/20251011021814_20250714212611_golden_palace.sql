/*
  # Create leads table for customer tracking

  1. New Tables
    - `leads`
      - `id` (uuid, primary key)
      - `name` (text)
      - `email` (text)
      - `phone` (text)
      - `zip` (text)
      - `room_type` (text)
      - `style` (text)
      - `image_url` (text)
      - `ai_url` (text)
      - `render_count` (integer)
      - `image_width` (integer)
      - `image_height` (integer)
      - `wants_quote` (boolean)
      - `social_engaged` (boolean)
      - `is_repeat_visitor` (boolean)
      - `lead_score` (integer)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `leads` table
    - Add policy for service role access
*/

CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  email text,
  phone text,
  zip text,
  room_type text,
  style text,
  image_url text,
  ai_url text,
  render_count integer DEFAULT 1,
  image_width integer,
  image_height integer,
  wants_quote boolean DEFAULT false,
  social_engaged boolean DEFAULT false,
  is_repeat_visitor boolean DEFAULT false,
  lead_score integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Policy for service role access (for API endpoints)
CREATE POLICY "Service role can manage leads"
  ON leads
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy for authenticated users to read their own leads
CREATE POLICY "Users can read own leads"
  ON leads
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'email' = email);