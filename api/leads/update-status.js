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
    const { leadId, newStatus, contractorNotes, conversionValue } = req.body;

    if (!leadId || !newStatus) {
      return res.status(400).json({ 
        success: false, 
        error: 'Lead ID and new status are required' 
      });
    }

    // Validate status
    const validStatuses = ['new', 'assigned', 'contacted', 'quoted', 'converted', 'dead', 'unqualified'];
    if (!validStatuses.includes(newStatus)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      });
    }

    console.log('📊 Lead status update request:', { leadId, newStatus, contractorNotes });

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

    // Get user's profile to check role
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

    // Get the lead to check assignment
    const { data: lead, error: leadError } = await supabaseAdmin
      .from('leads')
      .select('assigned_contractor_id, status')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      return res.status(404).json({ 
        success: false, 
        error: 'Lead not found' 
      });
    }

    // Authorization check
    let isAuthorized = false;

    if (profile.role === 'admin') {
      // Admins can update any lead
      isAuthorized = true;
      console.log('✅ Admin access granted');
    } else if (profile.role === 'contractor') {
      // Contractors can only update leads assigned to them
      const { data: contractor, error: contractorError } = await supabaseAdmin
        .from('contractors')
        .select('id')
        .eq('email', profile.email)
        .single();

      if (contractor && lead.assigned_contractor_id === contractor.id) {
        isAuthorized = true;
        console.log('✅ Contractor access granted for assigned lead');
      } else {
        console.log('❌ Contractor not authorized for this lead');
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({ 
        success: false, 
        error: 'Not authorized to update this lead' 
      });
    }

    // Prepare update data
    const updateData = {
      status: newStatus,
      last_contacted_at: ['contacted', 'quoted', 'converted'].includes(newStatus) ? new Date().toISOString() : undefined
    };

    if (contractorNotes !== undefined) {
      updateData.contractor_notes = contractorNotes;
    }

    if (conversionValue !== undefined && newStatus === 'converted') {
      updateData.conversion_value = conversionValue;
    }

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    // Update the lead
    const { data: updatedLead, error: updateError } = await supabaseAdmin
      .from('leads')
      .update(updateData)
      .eq('id', leadId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Failed to update lead:', updateError);
      return res.status(500).json({
        success: false,
        error: `Failed to update lead: ${updateError.message}`
      });
    }

    // Update lead assignment record if contractor is updating
    if (profile.role === 'contractor') {
      const { data: contractor } = await supabaseAdmin
        .from('contractors')
        .select('id')
        .eq('email', profile.email)
        .single();

      if (contractor) {
        const assignmentUpdate = {
          contractor_responded: true,
          response_time_hours: lead.status === 'new' || lead.status === 'assigned' ? 
            Math.round((new Date().getTime() - new Date(lead.sent_at || lead.created_at).getTime()) / (1000 * 60 * 60)) : 
            undefined
        };

        // Remove undefined values
        Object.keys(assignmentUpdate).forEach(key => {
          if (assignmentUpdate[key] === undefined) {
            delete assignmentUpdate[key];
          }
        });

        await supabaseAdmin
          .from('lead_assignments')
          .update(assignmentUpdate)
          .eq('lead_id', leadId)
          .eq('contractor_id', contractor.id);
      }
    }

    console.log('✅ Lead status updated successfully:', { leadId, newStatus });

    return res.status(200).json({
      success: true,
      message: 'Lead status updated successfully',
      updatedLead: updatedLead,
      previousStatus: lead.status
    });

  } catch (error) {
    console.error('💥 Update lead status error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
}