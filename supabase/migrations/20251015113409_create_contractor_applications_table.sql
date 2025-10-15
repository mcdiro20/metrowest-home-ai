/*
  # Contractor Applications Table

  ## Overview
  Stores applications from contractors who want to join the partner network.
  Allows admins to review and approve/reject applications.

  ## 1. New Table
  
  ### `contractor_applications` - Contractor partner applications
  - `id` (uuid, primary key) - Unique application identifier
  - `name` (text) - Contractor's full name
  - `email` (text) - Contact email
  - `phone` (text) - Contact phone number
  - `company_name` (text) - Business name
  - `license_number` (text) - Contractor license number
  - `insurance_info` (text) - Insurance provider details
  - `years_experience` (integer) - Years in business
  - `service_zip_codes` (text) - Comma-separated zip codes they serve
  - `specialties` (text[]) - Array of specialty areas
  - `referral_source` (text) - How they heard about us
  - `message` (text) - Application message/pitch
  - `status` (text) - Application status: pending, approved, rejected
  - `reviewed_by` (uuid, nullable) - Admin who reviewed application
  - `reviewed_at` (timestamptz, nullable) - Review timestamp
  - `admin_notes` (text, nullable) - Internal admin notes
  - `created_at` (timestamptz) - Application submission date
  - `updated_at` (timestamptz) - Last update timestamp

  ## 2. Security
  - Enable RLS on contractor_applications table
  - Admins can view and manage all applications
  - Public can insert (submit applications)
  - Applicants cannot view or modify after submission

  ## 3. Indexes
  - Email and status indexes for filtering
  - Created date index for sorting
*/

-- Create contractor_applications table
CREATE TABLE IF NOT EXISTS contractor_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  company_name text NOT NULL,
  license_number text NOT NULL,
  insurance_info text NOT NULL,
  years_experience integer NOT NULL DEFAULT 0,
  service_zip_codes text NOT NULL,
  specialties text[] DEFAULT '{}',
  referral_source text,
  message text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE contractor_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view all applications"
  ON contractor_applications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update applications"
  ON contractor_applications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Anyone can submit applications"
  ON contractor_applications FOR INSERT
  WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_contractor_applications_email ON contractor_applications(email);
CREATE INDEX IF NOT EXISTS idx_contractor_applications_status ON contractor_applications(status);
CREATE INDEX IF NOT EXISTS idx_contractor_applications_created_at ON contractor_applications(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_contractor_application_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_contractor_application_timestamp_trigger ON contractor_applications;
CREATE TRIGGER update_contractor_application_timestamp_trigger
  BEFORE UPDATE ON contractor_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_contractor_application_timestamp();