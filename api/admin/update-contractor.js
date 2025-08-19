export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { contractorId, updates } = req.body;

    if (!contractorId || !updates) {
      return res.status(400).json({ 
        success: false, 
        error: 'Contractor ID and updates are required' 
      });
    }

    console.log('🏗️ Admin update contractor request:', { contractorId, updates });

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

    console.log('✅ Admin verification passed, proceeding with contractor update');

    // Update the contractor
    const { data: updatedContractor, error: updateError } = await supabaseAdmin
      .from('contractors')
      .update(updates)
      .eq('id', contractorId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Failed to update contractor:', updateError);
      return res.status(500).json({
        success: false,
        error: `Failed to update contractor: ${updateError.message}`
      });
    }

    if (!updatedContractor) {
      return res.status(404).json({
        success: false,
        error: 'Contractor not found'
      });
    }

    console.log('✅ Contractor updated successfully:', contractorId);

    return res.status(200).json({
      success: true,
      message: 'Contractor updated successfully',
      updatedContractor: updatedContractor
    });

  } catch (error) {
    console.error('💥 Update contractor error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
}