/*
  # Lead Management System Schema Enhancements

  1. New Columns in `leads` table
    - `status` (text) - Track lead lifecycle: 'new', 'assigned', 'contacted', 'converted', 'dead'
    - `assigned_contractor_id` (uuid) - Foreign key to contractors table
    - `sent_at` (timestamp) - When lead was sent to contractor
    - `contractor_notes` (text) - Notes from contractor about lead interaction
    - `conversion_value` (decimal) - Value of conversion if lead converts to sale
    - `last_contacted_at` (timestamp) - When contractor last contacted the lead

  2. New Columns in `contractors` table
    - `is_active_subscriber` (boolean) - Whether contractor is paying for leads
    - `subscription_tier` (text) - Type of subscription (basic, premium, enterprise)
    - `leads_received_count` (integer) - Total leads received by contractor
    - `leads_converted_count` (integer) - Total leads converted by contractor
    - `conversion_rate` (decimal) - Calculated conversion rate percentage

  3. New Table: `lead_assignments`
    - Track detailed assignment history and contractor interactions

  4. Security
    - Update RLS policies for new columns
    - Add policies for lead assignment tracking
*/

-- Add new columns to leads table
DO $$
BEGIN
  -- Add status column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'status'
  ) THEN
    ALTER TABLE leads ADD COLUMN status text DEFAULT 'new';
  END IF;

  -- Add assigned_contractor_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'assigned_contractor_id'
  ) THEN
    ALTER TABLE leads ADD COLUMN assigned_contractor_id uuid;
  END IF;

  -- Add sent_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'sent_at'
  ) THEN
    ALTER TABLE leads ADD COLUMN sent_at timestamptz;
  END IF;

  -- Add contractor_notes column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'contractor_notes'
  ) THEN
    ALTER TABLE leads ADD COLUMN contractor_notes text;
  END IF;

  -- Add conversion_value column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'conversion_value'
  ) THEN
    ALTER TABLE leads ADD COLUMN conversion_value decimal(10,2);
  END IF;

  -- Add last_contacted_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'last_contacted_at'
  ) THEN
    ALTER TABLE leads ADD COLUMN last_contacted_at timestamptz;
  END IF;
END $$;

-- Add new columns to contractors table
DO $$
BEGIN
  -- Add is_active_subscriber column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contractors' AND column_name = 'is_active_subscriber'
  ) THEN
    ALTER TABLE contractors ADD COLUMN is_active_subscriber boolean DEFAULT false;
  END IF;

  -- Add subscription_tier column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contractors' AND column_name = 'subscription_tier'
  ) THEN
    ALTER TABLE contractors ADD COLUMN subscription_tier text DEFAULT 'basic';
  END IF;

  -- Add leads_received_count column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contractors' AND column_name = 'leads_received_count'
  ) THEN
    ALTER TABLE contractors ADD COLUMN leads_received_count integer DEFAULT 0;
  END IF;

  -- Add leads_converted_count column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contractors' AND column_name = 'leads_converted_count'
  ) THEN
    ALTER TABLE contractors ADD COLUMN leads_converted_count integer DEFAULT 0;
  END IF;

  -- Add conversion_rate column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contractors' AND column_name = 'conversion_rate'
  ) THEN
    ALTER TABLE contractors ADD COLUMN conversion_rate decimal(5,2) DEFAULT 0.00;
  END IF;
END $$;

-- Create lead_assignments table for detailed tracking
CREATE TABLE IF NOT EXISTS lead_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  contractor_id uuid NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  assignment_method text DEFAULT 'automatic',
  email_sent boolean DEFAULT false,
  email_opened boolean DEFAULT false,
  email_clicked boolean DEFAULT false,
  contractor_responded boolean DEFAULT false,
  response_time_hours integer,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Add foreign key constraint for assigned_contractor_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'leads_assigned_contractor_id_fkey'
  ) THEN
    ALTER TABLE leads 
    ADD CONSTRAINT leads_assigned_contractor_id_fkey 
    FOREIGN KEY (assigned_contractor_id) REFERENCES contractors(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Enable RLS on lead_assignments table
ALTER TABLE lead_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lead_assignments table
CREATE POLICY "Admins can manage all lead assignments"
  ON lead_assignments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Contractors can view their own assignments"
  ON lead_assignments
  FOR SELECT
  TO authenticated
  USING (
    contractor_id IN (
      SELECT contractors.id FROM contractors
      WHERE contractors.email = (
        SELECT profiles.email FROM profiles
        WHERE profiles.id = auth.uid()
      )
    )
  );

CREATE POLICY "Contractors can update their own assignments"
  ON lead_assignments
  FOR UPDATE
  TO authenticated
  USING (
    contractor_id IN (
      SELECT contractors.id FROM contractors
      WHERE contractors.email = (
        SELECT profiles.email FROM profiles
        WHERE profiles.id = auth.uid()
      )
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_contractor ON leads(assigned_contractor_id);
CREATE INDEX IF NOT EXISTS idx_leads_sent_at ON leads(sent_at);
CREATE INDEX IF NOT EXISTS idx_lead_assignments_lead_id ON lead_assignments(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_assignments_contractor_id ON lead_assignments(contractor_id);

-- Create function to update contractor stats
CREATE OR REPLACE FUNCTION update_contractor_stats(contractor_uuid uuid)
RETURNS void AS $$
BEGIN
  UPDATE contractors
  SET 
    leads_received_count = (
      SELECT COUNT(*) FROM leads 
      WHERE assigned_contractor_id = contractor_uuid
    ),
    leads_converted_count = (
      SELECT COUNT(*) FROM leads 
      WHERE assigned_contractor_id = contractor_uuid AND status = 'converted'
    ),
    conversion_rate = (
      CASE 
        WHEN (SELECT COUNT(*) FROM leads WHERE assigned_contractor_id = contractor_uuid) > 0
        THEN (
          SELECT COUNT(*) FROM leads 
          WHERE assigned_contractor_id = contractor_uuid AND status = 'converted'
        )::decimal / (
          SELECT COUNT(*) FROM leads 
          WHERE assigned_contractor_id = contractor_uuid
        )::decimal * 100
        ELSE 0
      END
    )
  WHERE id = contractor_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update contractor stats when lead status changes
CREATE OR REPLACE FUNCTION trigger_update_contractor_stats()
RETURNS trigger AS $$
BEGIN
  -- Update stats for the assigned contractor
  IF NEW.assigned_contractor_id IS NOT NULL THEN
    PERFORM update_contractor_stats(NEW.assigned_contractor_id);
  END IF;
  
  -- If contractor assignment changed, update old contractor stats too
  IF OLD.assigned_contractor_id IS NOT NULL AND OLD.assigned_contractor_id != NEW.assigned_contractor_id THEN
    PERFORM update_contractor_stats(OLD.assigned_contractor_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on leads table
DROP TRIGGER IF EXISTS update_contractor_stats_trigger ON leads;
CREATE TRIGGER update_contractor_stats_trigger
  AFTER UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_contractor_stats();

-- Create enum for lead status (optional but recommended for data integrity)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_status') THEN
    CREATE TYPE lead_status AS ENUM ('new', 'assigned', 'contacted', 'quoted', 'converted', 'dead', 'unqualified');
  END IF;
END $$;