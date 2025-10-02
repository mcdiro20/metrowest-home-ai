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
    console.log('📊 Lead assignments request received');

    // Verify authentication
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

    // Verify the requesting user's token
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

    // Fetch lead assignments with related data
    let query = supabaseAdmin
      .from('lead_assignments')
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
          lead_score,
          status,
          wants_quote,
          conversion_value,
          created_at
        ),
        contractors:contractor_id (
          id,
          name,
          email,
          subscription_tier
        )
      `);

    if (dateFilter) {
      query = query.gte('assigned_at', dateFilter);
    }

    query = query.order('assigned_at', { ascending: false });

    const { data: assignmentsData, error: assignmentsError } = await query;

    if (assignmentsError) {
      console.error('❌ Failed to fetch assignments:', assignmentsError);
      return res.status(500).json({
        success: false,
        error: `Failed to fetch assignments: ${assignmentsError.message}`
      });
    }

    // Apply custom date range filtering if specified
    let assignments = assignmentsData || [];
    if (startDate || endDate) {
      assignments = assignments.filter(assignment => {
        const assignmentDate = new Date(assignment.assigned_at);
        if (startDate && assignmentDate < new Date(startDate)) return false;
        if (endDate && assignmentDate > new Date(endDate + 'T23:59:59')) return false;
        return true;
      });
    }

    // Calculate assignment statistics
    const stats = {
      totalAssignments: assignments?.length || 0,
      emailsSent: assignments?.filter(a => a.email_sent).length || 0,
      emailsOpened: assignments?.filter(a => a.email_opened).length || 0,
      emailsClicked: assignments?.filter(a => a.email_clicked).length || 0,
      contractorResponses: assignments?.filter(a => a.contractor_responded).length || 0,
      avgResponseTimeHours: assignments?.filter(a => a.response_time_hours)
        .reduce((sum, a) => sum + a.response_time_hours, 0) / 
        (assignments?.filter(a => a.response_time_hours).length || 1),
      conversionRate: assignments?.length ? 
        (assignments.filter(a => a.leads?.status === 'converted').length / assignments.length) * 100 : 0
    };

    console.log('✅ Assignment data fetched successfully');

    return res.status(200).json({
      success: true,
      assignments: assignments || [],
      stats: stats
    });

  } catch (error) {
    console.error('💥 Get assignments error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
}