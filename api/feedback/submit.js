export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📝 Feedback submission request received');

    const { lead_id, rating, comment, source, page_location } = req.body;

    console.log('📊 Feedback data:', { lead_id, rating, hasComment: !!comment, source });

    if (!rating) {
      return res.status(400).json({
        success: false,
        error: 'Rating is required'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Rating must be between 1 and 5'
      });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl) {
      return res.status(500).json({
        success: false,
        error: 'Supabase configuration missing'
      });
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      supabaseUrl,
      supabaseServiceKey || supabaseAnonKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    if (lead_id) {
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .select('id')
        .eq('id', lead_id)
        .maybeSingle();

      if (leadError) {
        console.error('❌ Error checking lead:', leadError);
      }

      if (!lead) {
        console.warn('⚠️ Lead not found, but allowing feedback submission anyway');
      }
    }

    const { data: feedback, error: feedbackError } = await supabase
      .from('feedback')
      .insert({
        lead_id: lead_id || null,
        rating,
        comment: comment || null,
        source: source || 'web',
        page_location: page_location || null
      })
      .select()
      .single();

    if (feedbackError) {
      console.error('❌ Failed to insert feedback:', feedbackError);
      return res.status(500).json({
        success: false,
        error: feedbackError.message || feedbackError.hint || 'Failed to submit feedback. The feedback table may not exist yet.',
        details: feedbackError.details,
        code: feedbackError.code
      });
    }

    console.log('✅ Feedback submitted successfully:', feedback.id);

    return res.status(200).json({
      success: true,
      feedback
    });

  } catch (error) {
    console.error('💥 Submit feedback error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
}
