export default async function handler(req, res) {
  // Set CORS headers
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
    const { 
      name, 
      email, 
      assignedZipCodes, 
      servesAllZipcodes, 
      pricePerLead, 
      monthlySubscriptionFee,
      isActiveSubscriber,
      subscriptionTier 
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name and email are required' 
      });
    }

    console.log('🏗️ Admin add contractor request:', { name, email, servesAllZipcodes });

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

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({
        success: false,
        error: 'Supabase configuration missing'
      });
    }

    // Import Supabase
    const { createClient } = await import('@supabase/supabase-js');
    
    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Create regular client to verify the requesting user
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
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

    console.log('✅ Admin verification passed, proceeding with contractor creation');

    // Create the contractor
    const contractorData = {
      name,
      email,
      assigned_zip_codes: assignedZipCodes || [],
      serves_all_zipcodes: servesAllZipcodes || false,
      price_per_lead: pricePerLead || 25.00,
      monthly_subscription_fee: monthlySubscriptionFee || 99.00,
      is_active_subscriber: isActiveSubscriber || false,
      subscription_tier: subscriptionTier || 'basic'
    };

    const { data: newContractor, error: createError } = await supabaseAdmin
      .from('contractors')
      .insert(contractorData)
      .select()
      .single();

    if (createError) {
      console.error('❌ Failed to create contractor:', createError);
      return res.status(500).json({
        success: false,
        error: `Failed to create contractor: ${createError.message}`
      });
    }

    console.log('✅ Contractor created successfully:', newContractor.id);

    return res.status(200).json({
      success: true,
      message: 'Contractor created successfully',
      contractor: newContractor
    });

  } catch (error) {
    console.error('💥 Add contractor error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
}