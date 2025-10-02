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
    console.log('📊 Admin get dashboard summary request received');

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

    console.log('✅ Admin verification passed, fetching dashboard summary data');

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
    }

    // Build queries with date filtering
    let leadsQuery = supabaseAdmin.from('leads').select('status, probability_to_close_score, created_at');
    let usersQuery = supabaseAdmin.from('profiles').select('role, created_at');

    if (dateFilter) {
      leadsQuery = leadsQuery.gte('created_at', dateFilter);
      usersQuery = usersQuery.gte('created_at', dateFilter);
    }

    // Fetch only the essential data for dashboard summary (not full records)
    const [leadsResponse, usersResponse, contractorsResponse] = await Promise.all([
      leadsQuery,
      usersQuery,
      supabaseAdmin.from('contractors').select('is_active_subscriber, conversion_rate')
    ]);

    if (leadsResponse.error) throw leadsResponse.error;
    if (usersResponse.error) throw usersResponse.error;
    if (contractorsResponse.error) throw contractorsResponse.error;

    let leads = leadsResponse.data || [];
    let users = usersResponse.data || [];
    const contractors = contractorsResponse.data || [];

    // Apply custom date range filtering if specified
    if (startDate || endDate) {
      leads = leads.filter(lead => {
        const leadDate = new Date(lead.created_at);
        if (startDate && leadDate < new Date(startDate)) return false;
        if (endDate && leadDate > new Date(endDate + 'T23:59:59')) return false;
        return true;
      });
      users = users.filter(user => {
        const userDate = new Date(user.created_at);
        if (startDate && userDate < new Date(startDate)) return false;
        if (endDate && userDate > new Date(endDate + 'T23:59:59')) return false;
        return true;
      });
    }

    // Calculate summary statistics
    const totalLeads = leads.length;
    const leadsByStatus = leads.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {});

    const totalUsers = users.length;
    const usersByRole = users.reduce((acc, userItem) => {
      acc[userItem.role] = (acc[userItem.role] || 0) + 1;
      return acc;
    }, {});

    const totalContractors = contractors.length;
    const activeSubscribers = contractors.filter(c => c.is_active_subscriber).length;
    const avgConversionRate = totalContractors > 0 ? 
      (contractors.reduce((sum, c) => sum + (c.conversion_rate || 0), 0) / totalContractors) : 0;

    const dashboardSummary = {
      leads: {
        totalLeads: totalLeads,
        newLeads: leadsByStatus['new'] || 0,
        convertedLeads: leadsByStatus['converted'] || 0,
        assignedLeads: leadsByStatus['assigned'] || 0,
        quotedLeads: leadsByStatus['quoted'] || 0,
        avgProbabilityScore: totalLeads > 0 ? 
          Math.round(leads.reduce((sum, l) => sum + (l.probability_to_close_score || 0), 0) / totalLeads) : 0,
      },
      users: {
        totalUsers: totalUsers,
        homeowners: usersByRole['homeowner'] || 0,
        contractors: usersByRole['contractor'] || 0,
        admins: usersByRole['admin'] || 0,
      },
      contractors: {
        totalContractors: totalContractors,
        activeSubscribers: activeSubscribers,
        avgConversionRate: parseFloat(avgConversionRate.toFixed(2)),
      }
    };

    console.log('✅ Dashboard summary data fetched successfully');

    return res.status(200).json({
      success: true,
      data: dashboardSummary
    });

  } catch (error) {
    console.error('💥 Get dashboard summary error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
}