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

    // Fetch only the essential data for dashboard summary (not full records)
    const [leadsResponse, usersResponse, contractorsResponse] = await Promise.all([
      // Fetch leads summary data
      supabaseAdmin
        .from('leads')
        .select('status, probability_to_close_score'),
      
      // Fetch users summary data
      supabaseAdmin
        .from('profiles')
        .select('role'),
      
      // Fetch contractors summary data
      supabaseAdmin
        .from('contractors')
        .select('is_active_subscriber, conversion_rate')
    ]);

    if (leadsResponse.error) throw leadsResponse.error;
    if (usersResponse.error) throw usersResponse.error;
    if (contractorsResponse.error) throw contractorsResponse.error;

    const leads = leadsResponse.data || [];
    const users = usersResponse.data || [];
    const contractors = contractorsResponse.data || [];

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