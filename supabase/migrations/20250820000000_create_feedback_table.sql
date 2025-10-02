/*
  # Create Feedback Table

  1. New Tables
    - `feedback`
      - `id` (uuid, primary key)
      - `lead_id` (uuid, foreign key to leads table)
      - `rating` (integer, 1-5 star rating)
      - `comment` (text, optional feedback comment)
      - `source` (text, where feedback came from: 'email', 'web', etc.)
      - `page_location` (text, optional page URL where feedback was given)
      - `created_at` (timestamptz, when feedback was submitted)

  2. Security
    - Enable RLS on `feedback` table
    - Add policy for anyone to insert feedback (public submission)
    - Add policy for admins to read all feedback
    - Add policy for users to read their own feedback

  3. Indexes
    - Index on lead_id for fast lookups
    - Index on created_at for date filtering
    - Index on rating for analytics
*/

CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  source text DEFAULT 'web',
  page_location text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit feedback" ON feedback;

CREATE POLICY "Anyone can submit feedback"
  ON feedback
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can read all feedback"
  ON feedback
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can read feedback for their leads"
  ON feedback
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM leads
      WHERE leads.id = feedback.lead_id
      AND leads.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_feedback_lead_id ON feedback(lead_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON feedback(rating);
