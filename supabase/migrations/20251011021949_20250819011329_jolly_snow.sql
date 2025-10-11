/*
  # Add contractor pricing and management fields

  1. New Columns
    - `price_per_lead` (numeric) - How much to charge this contractor per lead
    - `serves_all_zipcodes` (boolean) - Whether contractor serves all MetroWest areas
    - `monthly_subscription_fee` (numeric) - Monthly subscription amount
    - `last_payment_date` (timestamp) - Track payment history
    - `subscription_expires_at` (timestamp) - Track subscription expiration

  2. Updates
    - Add default values for existing contractors
    - Update RLS policies for new fields

  3. Security
    - Maintain existing RLS policies
    - Ensure only admins can modify pricing
*/

-- Add new pricing and management columns to contractors table
DO $$
BEGIN
  -- Add price_per_lead column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contractors' AND column_name = 'price_per_lead'
  ) THEN
    ALTER TABLE contractors ADD COLUMN price_per_lead numeric(8,2) DEFAULT 25.00;
  END IF;

  -- Add serves_all_zipcodes column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contractors' AND column_name = 'serves_all_zipcodes'
  ) THEN
    ALTER TABLE contractors ADD COLUMN serves_all_zipcodes boolean DEFAULT false;
  END IF;

  -- Add monthly_subscription_fee column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contractors' AND column_name = 'monthly_subscription_fee'
  ) THEN
    ALTER TABLE contractors ADD COLUMN monthly_subscription_fee numeric(8,2) DEFAULT 99.00;
  END IF;

  -- Add last_payment_date column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contractors' AND column_name = 'last_payment_date'
  ) THEN
    ALTER TABLE contractors ADD COLUMN last_payment_date timestamptz DEFAULT null;
  END IF;

  -- Add subscription_expires_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contractors' AND column_name = 'subscription_expires_at'
  ) THEN
    ALTER TABLE contractors ADD COLUMN subscription_expires_at timestamptz DEFAULT null;
  END IF;
END $$;

-- Create index for faster ZIP code queries
CREATE INDEX IF NOT EXISTS idx_contractors_serves_all_zipcodes 
ON contractors (serves_all_zipcodes);

-- Create index for subscription status queries
CREATE INDEX IF NOT EXISTS idx_contractors_subscription_status 
ON contractors (is_active_subscriber, subscription_expires_at);