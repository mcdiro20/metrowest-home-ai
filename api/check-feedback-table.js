export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
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

    // Try to query the feedback table
    const { data: feedbackData, error: feedbackError } = await supabase
      .from('feedback')
      .select('*')
      .limit(1);

    const feedbackTableExists = !feedbackError || feedbackError.code !== '42P01';

    // Try to insert a test record (will be rolled back if fails)
    let canInsert = false;
    if (feedbackTableExists && !feedbackError) {
      const { error: insertError } = await supabase
        .from('feedback')
        .insert({
          rating: 5,
          comment: 'Test feedback',
          source: 'api-test'
        })
        .select()
        .single();

      canInsert = !insertError;

      if (insertError) {
        console.log('Insert test error:', insertError);
      }
    }

    return res.status(200).json({
      success: true,
      feedbackTableExists,
      canInsert,
      feedbackError: feedbackError ? {
        message: feedbackError.message,
        code: feedbackError.code,
        details: feedbackError.details,
        hint: feedbackError.hint
      } : null,
      needsMigration: !feedbackTableExists || feedbackError,
      migrationFile: 'supabase/migrations/20250820000000_create_feedback_table.sql',
      instructions: feedbackTableExists && !feedbackError ?
        'Feedback table exists and is ready to use!' :
        'Please run the SQL migration in Supabase Dashboard > SQL Editor'
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
