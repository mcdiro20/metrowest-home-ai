export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📊 Admin get all feedback request received');

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authorization token required'
      });
    }

    const token = authHeader.split(' ')[1];

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      return res.status(500).json({
        success: false,
        error: 'Supabase configuration missing'
      });
    }

    const { createClient } = await import('@supabase/supabase-js');

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid authentication token'
      });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    console.log('✅ Admin verification passed');

    const { dateRange, startDate, endDate } = req.query;
    let dateFilter = null;

    if (dateRange && dateRange !== 'all') {
      const now = new Date();
      const daysAgo = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 0;
      if (daysAgo > 0) {
        const filterDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
        dateFilter = filterDate.toISOString();
      }
    } else if (startDate || endDate) {
      // Custom date range filtering will be applied after fetching
    }

    let query = supabaseAdmin
      .from('feedback')
      .select(`
        *,
        leads:lead_id (
          id,
          name,
          email,
          phone,
          zip,
          room_type,
          style,
          status,
          probability_to_close_score,
          created_at
        )
      `);

    if (dateFilter) {
      query = query.gte('created_at', dateFilter);
    }

    query = query.order('created_at', { ascending: false });

    const { data: feedbackData, error: feedbackError } = await query;

    if (feedbackError) {
      console.error('❌ Failed to fetch feedback:', feedbackError);
      return res.status(500).json({
        success: false,
        error: `Failed to fetch feedback: ${feedbackError.message}`
      });
    }

    let feedback = feedbackData || [];
    if (startDate || endDate) {
      feedback = feedback.filter(item => {
        const itemDate = new Date(item.created_at);
        if (startDate && itemDate < new Date(startDate)) return false;
        if (endDate && itemDate > new Date(endDate + 'T23:59:59')) return false;
        return true;
      });
    }

    const stats = {
      totalFeedback: feedback.length,
      avgRating: feedback.length ?
        (feedback.reduce((sum, item) => sum + item.rating, 0) / feedback.length).toFixed(2) : 0,
      ratings: {
        5: feedback.filter(item => item.rating === 5).length,
        4: feedback.filter(item => item.rating === 4).length,
        3: feedback.filter(item => item.rating === 3).length,
        2: feedback.filter(item => item.rating === 2).length,
        1: feedback.filter(item => item.rating === 1).length,
      },
      withComments: feedback.filter(item => item.comment).length,
      bySoure: feedback.reduce((acc, item) => {
        acc[item.source] = (acc[item.source] || 0) + 1;
        return acc;
      }, {}),
    };

    console.log('✅ Feedback fetched successfully:', feedback.length);

    return res.status(200).json({
      success: true,
      feedback,
      stats
    });

  } catch (error) {
    console.error('💥 Get all feedback error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
}
