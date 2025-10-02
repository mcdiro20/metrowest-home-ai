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

    if (!lead_id || !rating) {
      return res.status(400).json({
        success: false,
        error: 'lead_id and rating are required'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Rating must be between 1 and 5'
      });
    }

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

    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('id')
      .eq('id', lead_id)
      .single();

    if (leadError || !lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found'
      });
    }

    const { data: feedback, error: feedbackError } = await supabase
      .from('feedback')
      .insert({
        lead_id,
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
        error: `Failed to submit feedback: ${feedbackError.message}`
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
