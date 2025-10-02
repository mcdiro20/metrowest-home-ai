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
        error: 'Supabase configuration missing',
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseAnonKey
      });
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: tables, error: tablesError } = await supabase
      .from('feedback')
      .select('*')
      .limit(1);

    if (tablesError) {
      return res.status(200).json({
        success: false,
        message: 'Feedback table check failed',
        error: tablesError.message,
        hint: tablesError.hint,
        details: tablesError.details,
        code: tablesError.code
      });
    }

    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, email, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    return res.status(200).json({
      success: true,
      message: 'Feedback table exists and is accessible',
      feedbackTableWorks: !tablesError,
      sampleLeads: leads || [],
      leadsError: leadsError ? leadsError.message : null
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}
