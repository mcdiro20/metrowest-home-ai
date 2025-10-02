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

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    console.log('🔄 Applying feedback table migration...');

    // Create feedback table
    const migrationSQL = `
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
        TO anon, authenticated
        WITH CHECK (true);

      DROP POLICY IF EXISTS "Admins can read all feedback" ON feedback;
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

      DROP POLICY IF EXISTS "Users can read feedback for their leads" ON feedback;
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
    `;

    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      console.error('❌ Migration failed:', error);
      return res.status(500).json({
        success: false,
        error: error.message,
        details: error.details,
        hint: error.hint,
        message: 'Migration failed - you may need to run this SQL manually in Supabase Dashboard SQL Editor'
      });
    }

    console.log('✅ Feedback table migration completed successfully');

    return res.status(200).json({
      success: true,
      message: 'Feedback table created successfully',
      data
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      hint: 'You may need to run the migration SQL manually in Supabase Dashboard'
    });
  }
}
