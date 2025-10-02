export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return res.status(500).json({
        success: false,
        error: 'Supabase configuration missing'
      });
    }

    console.log('🔧 Setting up feedback table...');

    // Try to insert a test record to see if table exists
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data, error } = await supabase
      .from('feedback')
      .select('id')
      .limit(1);

    if (error && error.code === '42P01') {
      // Table doesn't exist
      return res.status(200).json({
        success: false,
        tableExists: false,
        message: 'Feedback table does not exist',
        instructions: {
          step1: 'Open your Supabase Dashboard',
          step2: 'Click on "SQL Editor" in the left sidebar',
          step3: 'Copy the SQL from the response below',
          step4: 'Paste it into the SQL editor and click "Run"'
        },
        sql: `-- Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  source text DEFAULT 'web',
  page_location text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Allow anyone to submit feedback
CREATE POLICY "Anyone can submit feedback"
  ON feedback FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Allow admins to read all feedback
CREATE POLICY "Admins can read all feedback"
  ON feedback FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_feedback_lead_id ON feedback(lead_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON feedback(rating);`,
        dashboardUrl: supabaseUrl.replace('.supabase.co', '.supabase.co/project/_/sql')
      });
    }

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
        details: error.details
      });
    }

    // Table exists!
    return res.status(200).json({
      success: true,
      tableExists: true,
      message: '✅ Feedback table is set up and ready to use!',
      recordCount: data?.length || 0
    });

  } catch (error) {
    console.error('💥 Setup error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
