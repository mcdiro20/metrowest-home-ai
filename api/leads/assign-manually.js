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
    const { leadId, contractorIds } = req.body;

    if (!leadId || !contractorIds || !Array.isArray(contractorIds) || contractorIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Lead ID and contractor IDs array are required' 
      });
    }

    console.log('👤 Manual lead assignment request:', { leadId, contractorIds });

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

    // Get lead details
    const { data: lead, error: leadError } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      return res.status(404).json({ 
        success: false, 
        error: 'Lead not found' 
      });
    }

    // Get contractor details
    const { data: contractors, error: contractorsError } = await supabaseAdmin
      .from('contractors')
      .select('id, name, email, subscription_tier')
      .in('id', contractorIds);

    if (contractorsError || !contractors || contractors.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'No valid contractors found' 
      });
    }

    console.log('✅ Found contractors for assignment:', contractors.length);

    // Create assignments for each contractor
    const assignmentPromises = contractors.map(async (contractor) => {
      try {
        // Create lead assignment record
        const { data: assignment, error: assignmentError } = await supabaseAdmin
          .from('lead_assignments')
          .insert({
            lead_id: leadId,
            contractor_id: contractor.id,
            assignment_method: 'manual',
            email_sent: false
          })
          .select()
          .single();

        if (assignmentError) {
          console.error('❌ Failed to create assignment for contractor:', contractor.name, assignmentError);
          return { contractor: contractor.name, success: false, error: assignmentError.message };
        }

        // Send email notification
        try {
          await sendContractorNotification(contractor, lead, assignment.id);
          
          // Update assignment to mark email as sent
          await supabaseAdmin
            .from('lead_assignments')
            .update({ email_sent: true })
            .eq('id', assignment.id);

          console.log('✅ Manual assignment successful for:', contractor.name);
          return { 
            contractor: contractor.name, 
            success: true, 
            assignmentId: assignment.id 
          };

        } catch (emailError) {
          console.error('❌ Email failed for contractor:', contractor.name, emailError);
          return { 
            contractor: contractor.name, 
            success: false, 
            error: 'Assignment created but email failed' 
          };
        }

      } catch (error) {
        console.error('❌ Assignment failed for contractor:', contractor.name, error);
        return { contractor: contractor.name, success: false, error: error.message };
      }
    });

    const assignmentResults = await Promise.all(assignmentPromises);
    const successfulAssignments = assignmentResults.filter(result => result.success);

    // Update lead status if any assignments were successful
    if (successfulAssignments.length > 0) {
      const primaryContractor = contractors[0]; // Use first contractor as primary
      
      await supabaseAdmin
        .from('leads')
        .update({
          status: 'assigned',
          assigned_contractor_id: primaryContractor.id,
          sent_at: new Date().toISOString()
        })
        .eq('id', leadId);
    }

    return res.status(200).json({
      success: true,
      message: `Lead assigned to ${successfulAssignments.length} contractor(s)`,
      assignmentResults: assignmentResults,
      successfulAssignments: successfulAssignments.length,
      totalAttempted: contractors.length
    });

  } catch (error) {
    console.error('💥 Manual assignment error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
}

// Reuse the email notification function
async function sendContractorNotification(contractor, lead, assignmentId) {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    
    if (!resendApiKey) {
      console.log('⚠️ No Resend API key - email notification skipped');
      return;
    }

    const { Resend } = await import('resend');
    const resend = new Resend(resendApiKey);

    // Calculate lead priority for email
    const leadPriority = lead.lead_score >= 70 ? 'HIGH PRIORITY' : 
                        lead.lead_score >= 50 ? 'MEDIUM PRIORITY' : 'STANDARD';
    
    const priorityColor = lead.lead_score >= 70 ? '#dc2626' : 
                         lead.lead_score >= 50 ? '#d97706' : '#059669';

    const emailResult = await resend.emails.send({
      from: 'MetroWest Home AI <leads@metrowesthome.ai>',
      to: [contractor.email],
      subject: `🏠 New ${leadPriority} Lead - ${lead.room_type} in ${lead.zip}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin-bottom: 10px;">New Lead Assignment 🎯</h1>
            <div style="background: ${priorityColor}; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: bold; font-size: 14px;">
              ${leadPriority} - Score: ${lead.lead_score}
            </div>
          </div>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Lead Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Name:</td>
                <td style="padding: 8px 0; color: #333;">${lead.name || 'Not provided'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Email:</td>
                <td style="padding: 8px 0; color: #333;">${lead.email || 'Not provided'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Phone:</td>
                <td style="padding: 8px 0; color: #333;">${lead.phone || 'Not provided'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">ZIP Code:</td>
                <td style="padding: 8px 0; color: #333;">${lead.zip}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Project Type:</td>
                <td style="padding: 8px 0; color: #333;">${lead.room_type}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Style:</td>
                <td style="padding: 8px 0; color: #333;">${lead.style}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Wants Quote:</td>
                <td style="padding: 8px 0; color: #333;">
                  <span style="background: ${lead.wants_quote ? '#10b981' : '#6b7280'}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px;">
                    ${lead.wants_quote ? 'YES' : 'NO'}
                  </span>
                </td>
              </tr>
            </table>
          </div>
          
          <div style="background: #e0f2fe; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Next Steps</h3>
            <ul style="color: #666; line-height: 1.6; margin: 0; padding-left: 20px;">
              <li>Contact the lead within 24 hours for best results</li>
              <li>Reference their AI design when reaching out</li>
              <li>Update lead status in your contractor dashboard</li>
              <li>Track your conversion for performance metrics</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.VERCEL_URL || 'https://metrowesthome.ai'}/contractor-dashboard" 
               style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              View in Dashboard
            </a>
          </div>
          
          <div style="text-align: center; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
            <p style="color: #666; font-size: 14px;">Assignment ID: ${assignmentId}</p>
            <p style="color: #999; font-size: 12px;">MetroWest Home AI Lead Management System</p>
          </div>
        </div>
      `
    });

    console.log('📧 Contractor notification sent to:', contractor.email);
    return emailResult;

  } catch (emailError) {
    console.error('❌ Failed to send contractor notification:', emailError);
    throw emailError;
  }
}