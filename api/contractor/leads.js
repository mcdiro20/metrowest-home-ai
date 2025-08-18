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
    console.log('🏗️ Contractor leads request received');

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

    console.log('✅ User authenticated:', user.email);

    // Check if the user is a contractor
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, email')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ 
        success: false, 
        error: 'User profile not found' 
      });
    }

    if (profile.role !== 'contractor') {
      return res.status(403).json({ 
        success: false, 
        error: 'Contractor access required' 
      });
    }

    console.log('✅ Contractor verification passed');

    // Get contractor's assigned zip codes
    const { data: contractor, error: contractorError } = await supabaseAdmin
      .from('contractors')
      .select('assigned_zip_codes, name')
      .eq('email', profile.email)
      .single();

    if (contractorError || !contractor) {
      return res.status(404).json({ 
        success: false, 
        error: 'Contractor record not found. Please contact admin to set up your contractor profile.' 
      });
    }

    const assignedZipCodes = contractor.assigned_zip_codes || [];
    console.log('🏗️ Contractor assigned zip codes:', assignedZipCodes);

    if (assignedZipCodes.length === 0) {
      return res.status(200).json({
        success: true,
        leads: [],
        contractor: contractor,
        message: 'No zip codes assigned yet. Contact admin to assign service areas.'
      });
    }

    // Fetch leads for assigned zip codes
    const { data: leads, error: leadsError } = await supabaseAdmin
      .from('leads')
      .select('*')
      .in('zip', assignedZipCodes)
      .order('created_at', { ascending: false });

    if (leadsError) {
      console.error('❌ Failed to fetch leads:', leadsError);
      return res.status(500).json({
        success: false,
        error: `Failed to fetch leads: ${leadsError.message}`
      });
    }

    console.log('✅ Leads fetched successfully:', leads?.length || 0);

    // Calculate lead statistics
    const stats = {
      totalLeads: leads?.length || 0,
      highValueLeads: leads?.filter(lead => (lead.lead_score || 0) >= 50).length || 0,
      recentLeads: leads?.filter(lead => {
        const leadDate = new Date(lead.created_at);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return leadDate >= weekAgo;
      }).length || 0,
      avgLeadScore: leads?.length ? 
        Math.round(leads.reduce((sum, lead) => sum + (lead.lead_score || 0), 0) / leads.length) : 0
    };

    return res.status(200).json({
      success: true,
      leads: leads || [],
      contractor: contractor,
      stats: stats,
      assignedZipCodes: assignedZipCodes
    });

  } catch (error) {
    console.error('💥 Contractor leads error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
}