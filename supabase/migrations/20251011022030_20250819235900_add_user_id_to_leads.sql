/*
  # Add user_id to leads table

  1. New Columns
    - `user_id` (uuid, foreign key to auth.users) - Links lead to registered user who created it

  2. Notes
    - This column can be NULL since leads can be created by anonymous users
    - When a user is signed in, this links the lead to their profile
*/

-- Add user_id column to leads table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE leads ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);