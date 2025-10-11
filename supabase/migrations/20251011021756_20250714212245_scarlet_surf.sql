/*
  # MetroWest Home AI Database Schema

  1. New Tables
    - `customers`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `zip_code` (text)
      - `created_at` (timestamp)
      - `newsletter_subscribed` (boolean)
      - `total_designs` (integer)
    
    - `design_requests`
      - `id` (uuid, primary key)
      - `customer_id` (uuid, foreign key)
      - `room_type` (text)
      - `selected_style` (text)
      - `original_image_url` (text)
      - `generated_image_url` (text)
      - `ai_prompt` (text)
      - `processing_time` (integer)
      - `created_at` (timestamp)
    
    - `contractors`
      - `id` (uuid, primary key)
      - `company_name` (text)
      - `contact_name` (text)
      - `email` (text, unique)
      - `phone` (text)
      - `specialties` (text[])
      - `license_number` (text)
      - `zip_codes_served` (text[])
      - `is_verified` (boolean)
      - `created_at` (timestamp)
    
    - `quote_requests`
      - `id` (uuid, primary key)
      - `customer_id` (uuid, foreign key)
      - `design_request_id` (uuid, foreign key)
      - `project_type` (text)
      - `timeline` (text)
      - `budget_range` (text)
      - `contact_method` (text)
      - `notes` (text)
      - `status` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated access
    - Public read access for contractors (for matching)
*/

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  zip_code text NOT NULL,
  created_at timestamptz DEFAULT now(),
  newsletter_subscribed boolean DEFAULT false,
  total_designs integer DEFAULT 0
);

-- Create design_requests table
CREATE TABLE IF NOT EXISTS design_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  room_type text NOT NULL DEFAULT 'kitchen',
  selected_style text,
  original_image_url text,
  generated_image_url text,
  ai_prompt text,
  processing_time integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create contractors table
CREATE TABLE IF NOT EXISTS contractors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  contact_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text NOT NULL,
  specialties text[] DEFAULT '{}',
  license_number text,
  zip_codes_served text[] DEFAULT '{}',
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create quote_requests table
CREATE TABLE IF NOT EXISTS quote_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  design_request_id uuid REFERENCES design_requests(id) ON DELETE SET NULL,
  project_type text NOT NULL,
  timeline text NOT NULL,
  budget_range text NOT NULL,
  contact_method text DEFAULT 'email',
  notes text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for customers
CREATE POLICY "Customers can read own data"
  ON customers
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text);

CREATE POLICY "Anyone can insert customers"
  ON customers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Create policies for design_requests
CREATE POLICY "Users can read own design requests"
  ON design_requests
  FOR SELECT
  TO authenticated
  USING (customer_id IN (SELECT id FROM customers WHERE auth.uid()::text = id::text));

CREATE POLICY "Anyone can insert design requests"
  ON design_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Create policies for contractors
CREATE POLICY "Anyone can read verified contractors"
  ON contractors
  FOR SELECT
  TO anon, authenticated
  USING (is_verified = true);

CREATE POLICY "Anyone can insert contractor applications"
  ON contractors
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Create policies for quote_requests
CREATE POLICY "Users can read own quote requests"
  ON quote_requests
  FOR SELECT
  TO authenticated
  USING (customer_id IN (SELECT id FROM customers WHERE auth.uid()::text = id::text));

CREATE POLICY "Anyone can insert quote requests"
  ON quote_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_zip_code ON customers(zip_code);
CREATE INDEX IF NOT EXISTS idx_design_requests_customer_id ON design_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_design_requests_created_at ON design_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_contractors_zip_codes ON contractors USING GIN(zip_codes_served);
CREATE INDEX IF NOT EXISTS idx_quote_requests_customer_id ON quote_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_quote_requests_status ON quote_requests(status);