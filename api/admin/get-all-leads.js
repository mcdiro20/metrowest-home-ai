export default async function handler(req, res) {
  // Set CORS headers
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
    console.log('📊 Admin get all leads request received');

    // Verify admin authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authorization token required' 
      });
    }

    const token = authHeader.split(' ')[1];

    // Get Supabase configuration
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      return res.status(500).json({
        success: false,
        error: 'Supabase configuration missing'
      });
    }

    // Import Supabase
    const { createClient } = await import('@supabase/supabase-js');
    
    // Create clients
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

    // Verify the requesting user's token and admin status
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid authentication token' 
      });
    }

    // Check if the requesting user is an admin
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

    // Fetch all leads with related data
    const { data: leads, error: leadsError } = await supabaseAdmin
      .from('leads')
      .select(`
        *,
        profiles:user_id (
          id,
          email,
          role,
          login_count,
          total_time_on_site_ms,
          ai_renderings_count,
          last_login_at
        ),
        contractors:assigned_contractor_id (
          id,
          name,
          email
        )
      `)
      .order('probability_to_close_score', { ascending: false, nullsLast: true });

    if (leadsError) {
      console.error('❌ Failed to fetch leads:', leadsError);
      return res.status(500).json({
        success: false,
        error: `Failed to fetch leads: ${leadsError.message}`
      });
    }

    // Calculate summary statistics
    const stats = {
      totalLeads: leads?.length || 0,
      highValueLeads: leads?.filter(lead => (lead.probability_to_close_score || 0) >= 70).length || 0,
      mediumValueLeads: leads?.filter(lead => {
        const score = lead.probability_to_close_score || 0;
        return score >= 40 && score < 70;
      }).length || 0,
      lowValueLeads: leads?.filter(lead => (lead.probability_to_close_score || 0) < 40).length || 0,
      avgProbabilityScore: leads?.length ? 
        Math.round(leads.reduce((sum, lead) => sum + (lead.probability_to_close_score || 0), 0) / leads.length) : 0,
      avgIntentScore: leads?.length ? 
        Math.round(leads.reduce((sum, lead) => sum + (lead.intent_score || 0), 0) / leads.length) : 0,
      avgEngagementScore: leads?.length ? 
        Math.round(leads.reduce((sum, lead) => sum + (lead.engagement_score || 0), 0) / leads.length) : 0,
      avgLeadQualityScore: leads?.length ? 
        Math.round(leads.reduce((sum, lead) => sum + (lead.lead_quality_score || 0), 0) / leads.length) : 0,
      recentLeads: leads?.filter(lead => {
        const leadDate = new Date(lead.created_at);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return leadDate >= weekAgo;
      }).length || 0,
      conversionRate: leads?.length ? 
        (leads.filter(lead => lead.status === 'converted').length / leads.length) * 100 : 0
    };

    console.log('✅ Leads fetched successfully:', leads?.length || 0);

    return res.status(200).json({
      success: true,
      leads: leads || [],
      stats: stats
    });

  } catch (error) {
    console.error('💥 Get all leads error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
}