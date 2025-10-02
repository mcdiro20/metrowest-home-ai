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
    console.log('👥 Admin get all users request received');

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

    // Parse date filtering parameters
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

    // Fetch all user profiles with related lead data
    let query = supabaseAdmin
      .from('profiles')
      .select(`
        *,
        leads:leads!user_id (
          id,
          status,
          engagement_score,
          intent_score,
          lead_quality_score,
          probability_to_close_score,
          created_at
        )
      `);

    if (dateFilter) {
      query = query.gte('created_at', dateFilter);
    }

    query = query.order('created_at', { ascending: false });

    const { data: usersData, error: usersError } = await query;

    if (usersError) {
      console.error('❌ Failed to fetch users:', usersError);
      return res.status(500).json({
        success: false,
        error: `Failed to fetch users: ${usersError.message}`
      });
    }

    // Apply custom date range filtering if specified
    let users = usersData || [];
    if (startDate || endDate) {
      users = users.filter(user => {
        const userDate = new Date(user.created_at);
        if (startDate && userDate < new Date(startDate)) return false;
        if (endDate && userDate > new Date(endDate + 'T23:59:59')) return false;
        return true;
      });
    }

    // Calculate user statistics
    const stats = {
      totalUsers: users?.length || 0,
      adminUsers: users?.filter(u => u.role === 'admin').length || 0,
      contractorUsers: users?.filter(u => u.role === 'contractor').length || 0,
      homeownerUsers: users?.filter(u => u.role === 'homeowner').length || 0,
      activeUsers: users?.filter(u => {
        const lastLogin = u.last_login_at ? new Date(u.last_login_at) : null;
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return lastLogin && lastLogin >= weekAgo;
      }).length || 0,
      avgTimeOnSite: users?.length ? 
        Math.round(users.reduce((sum, u) => sum + (u.total_time_on_site_ms || 0), 0) / users.length / (60 * 1000)) : 0, // in minutes
      totalAIRenderings: users?.reduce((sum, u) => sum + (u.ai_renderings_count || 0), 0) || 0
    };

    // Enhance user data with lead statistics
    const enhancedUsers = users?.map(user => {
      const userLeads = user.leads || [];
      const leadStats = {
        totalLeads: userLeads.length,
        avgProbabilityScore: userLeads.length ? 
          Math.round(userLeads.reduce((sum, lead) => sum + (lead.probability_to_close_score || 0), 0) / userLeads.length) : 0,
        highestProbabilityScore: userLeads.length ? 
          Math.max(...userLeads.map(lead => lead.probability_to_close_score || 0)) : 0,
        convertedLeads: userLeads.filter(lead => lead.status === 'converted').length
      };

      return {
        ...user,
        leadStats
      };
    }) || [];

    console.log('✅ Users fetched successfully:', users?.length || 0);

    return res.status(200).json({
      success: true,
      users: enhancedUsers,
      stats: stats
    });

  } catch (error) {
    console.error('💥 Get all users error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
}