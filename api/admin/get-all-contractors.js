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
    console.log('🏗️ Admin get all contractors request received');

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

    // Fetch all contractors with performance metrics
    const { data: contractors, error: contractorsError } = await supabaseAdmin
      .from('contractors')
      .select('*')
      .order('created_at', { ascending: false });

    if (contractorsError) {
      console.error('❌ Failed to fetch contractors:', contractorsError);
      return res.status(500).json({
        success: false,
        error: `Failed to fetch contractors: ${contractorsError.message}`
      });
    }

    // Calculate contractor statistics
    const stats = {
      totalContractors: contractors?.length || 0,
      activeSubscribers: contractors?.filter(c => c.is_active_subscriber).length || 0,
      totalZipCodes: contractors?.reduce((acc, c) => {
        const zipCodes = c.assigned_zip_codes || [];
        zipCodes.forEach(zip => acc.add(zip));
        return acc;
      }, new Set()).size || 0,
      avgConversionRate: contractors?.length ? 
        Math.round(contractors.reduce((sum, c) => sum + (c.conversion_rate || 0), 0) / contractors.length) : 0,
      totalLeadsReceived: contractors?.reduce((sum, c) => sum + (c.leads_received_count || 0), 0) || 0,
      totalLeadsConverted: contractors?.reduce((sum, c) => sum + (c.leads_converted_count || 0), 0) || 0
    };

    console.log('✅ Contractors fetched successfully:', contractors?.length || 0);

    return res.status(200).json({
      success: true,
      contractors: contractors || [],
      stats: stats
    });

  } catch (error) {
    console.error('💥 Get all contractors error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
}