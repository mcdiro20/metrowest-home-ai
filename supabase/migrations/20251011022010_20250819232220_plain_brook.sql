/*
  # Add Lead Intelligence Scoring System

  1. New Columns
    - `engagement_score` (integer) - User platform engagement level (1-100)
    - `intent_score` (integer) - Purchase intent strength (1-100) 
    - `lead_quality_score` (integer) - Overall lead desirability (1-100)
    - `probability_to_close_score` (integer) - Conversion likelihood (1-100)

  2. Indexes
    - Add indexes for efficient score-based queries and sorting
    - Composite index for multi-score filtering

  3. Notes
    - These scores will be calculated by backend algorithms
    - Scores range from 0-100 for easy interpretation
    - Higher scores indicate better leads
*/

-- Add the new scoring columns to the leads table
DO $$
BEGIN
  -- Add engagement_score column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'engagement_score'
  ) THEN
    ALTER TABLE public.leads ADD COLUMN engagement_score INTEGER DEFAULT 0;
  END IF;

  -- Add intent_score column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'intent_score'
  ) THEN
    ALTER TABLE public.leads ADD COLUMN intent_score INTEGER DEFAULT 0;
  END IF;

  -- Add lead_quality_score column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'lead_quality_score'
  ) THEN
    ALTER TABLE public.leads ADD COLUMN lead_quality_score INTEGER DEFAULT 0;
  END IF;

  -- Add probability_to_close_score column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'probability_to_close_score'
  ) THEN
    ALTER TABLE public.leads ADD COLUMN probability_to_close_score INTEGER DEFAULT 0;
  END IF;
END $$;

-- Create indexes for efficient score-based queries
CREATE INDEX IF NOT EXISTS idx_leads_engagement_score ON public.leads USING btree (engagement_score);
CREATE INDEX IF NOT EXISTS idx_leads_intent_score ON public.leads USING btree (intent_score);
CREATE INDEX IF NOT EXISTS idx_leads_lead_quality_score ON public.leads USING btree (lead_quality_score);
CREATE INDEX IF NOT EXISTS idx_leads_probability_to_close_score ON public.leads USING btree (probability_to_close_score);

-- Create composite index for multi-score filtering and sorting
CREATE INDEX IF NOT EXISTS idx_leads_scoring_composite ON public.leads USING btree (
  probability_to_close_score DESC,
  intent_score DESC,
  lead_quality_score DESC
);

-- Add constraints to ensure scores are within valid range (0-100)
DO $$
BEGIN
  -- Add check constraints if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'leads_engagement_score_range'
  ) THEN
    ALTER TABLE public.leads ADD CONSTRAINT leads_engagement_score_range 
    CHECK (engagement_score >= 0 AND engagement_score <= 100);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'leads_intent_score_range'
  ) THEN
    ALTER TABLE public.leads ADD CONSTRAINT leads_intent_score_range 
    CHECK (intent_score >= 0 AND intent_score <= 100);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'leads_lead_quality_score_range'
  ) THEN
    ALTER TABLE public.leads ADD CONSTRAINT leads_lead_quality_score_range 
    CHECK (lead_quality_score >= 0 AND lead_quality_score <= 100);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'leads_probability_to_close_score_range'
  ) THEN
    ALTER TABLE public.leads ADD CONSTRAINT leads_probability_to_close_score_range 
    CHECK (probability_to_close_score >= 0 AND probability_to_close_score <= 100);
  END IF;
END $$;