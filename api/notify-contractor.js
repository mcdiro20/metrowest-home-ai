import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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
      phone,
      zip,
      room_type,
      style,
      image_url,
      ai_url,
      render_count = 1,
      image_width,
      image_height,
      wants_quote = false,
      social_engaged = false,
      is_repeat_visitor = false,
      userId
    } = req.body;

    console.log('🎯 Automated lead assignment request received');
    console.log('📊 Lead data:', { email, zip, room_type, style, wants_quote });

    // Calculate lead score
    let lead_score = 0;
    
    // Base score for completing AI render
    lead_score += 10;
    
    // Email provided
    if (email) lead_score += 15;
    
    // Phone provided (higher intent)
    if (phone) lead_score += 20;
    
    // Wants quote (highest intent)
    if (wants_quote) lead_score += 30;
    
    // Multiple renders (engaged user)
    if (render_count > 1) lead_score += (render_count - 1) * 5;
    
    // Social engagement
    if (social_engaged) lead_score += 10;
    
    // Repeat visitor
    if (is_repeat_visitor) lead_score += 15;
    
    // MetroWest ZIP codes (our target area)
    const metroWestZips = [
      '01701', '01702', '01718', '01719', '01720', '01721', '01730', '01731',
      '01740', '01741', '01742', '01746', '01747', '01748', '01749', '01752',
      '01754', '01757', '01760', '01770', '01772', '01773', '01776', '01778',
      '01784', '01801', '01803', '01890', '02030', '02032', '02052', '02054',
      '02056', '02090', '02093', '02421', '02451', '02452', '02453', '02454',
      '02458', '02459', '02460', '02461', '02462', '02464', '02465', '02466',
      '02467', '02468', '02472', '02474', '02475', '02476', '02477', '02478',
      '02479', '02481', '02482', '02492', '02493', '02494', '02495'
    ];
    
    if (zip && metroWestZips.includes(zip)) {
      lead_score += 25; // High value for target area
    }

    console.log('📊 Calculated lead score:', lead_score);

    // Get Supabase configuration
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn('⚠️ Supabase not configured - lead not saved');
      return res.status(200).json({
        success: true,
        message: 'Lead processed (Supabase not configured)',
        id: null,
        score: lead_score,
        assigned_contractors: []
      });
    }

    // Create Supabase admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    let leadId = null;
    let assignedContractors = [];

    try {
      // Step 1: Insert lead into database
      console.log('💾 Saving lead to database...');
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .insert({
          user_id: userId || null,
          name,
          email,
          phone,
          zip,
          room_type,
          style,
          image_url,
          ai_url,
          render_count,
          image_width,
          image_height,
          wants_quote,
          social_engaged,
          is_repeat_visitor,
          lead_score,
          status: 'new'
        })
        .select()
        .single();

      if (leadError) {
        console.error('❌ Failed to save lead:', leadError);
        throw new Error(`Failed to save lead: ${leadError.message}`);
      }

      leadId = lead.id;
      console.log('✅ Lead saved to database:', leadId);

      // Step 2: Find eligible contractors for this ZIP code
      console.log('🔍 Finding eligible contractors for ZIP:', zip);
      const { data: eligibleContractors, error: contractorError } = await supabase
        .from('contractors')
        .select('id, name, email, assigned_zip_codes, subscription_tier')
        .eq('is_active_subscriber', true)
        .contains('assigned_zip_codes', [zip]);

      if (contractorError) {
        console.error('❌ Error finding contractors:', contractorError);
      } else {
        console.log('✅ Found eligible contractors:', eligibleContractors?.length || 0);
      }

      // Step 3: Determine if lead should be assigned based on score and wants_quote
      const MINIMUM_SCORE_FOR_AUTO_ASSIGNMENT = wants_quote ? 30 : 50;
      const shouldAssignLead = lead_score >= MINIMUM_SCORE_FOR_AUTO_ASSIGNMENT;

      if (shouldAssignLead && eligibleContractors && eligibleContractors.length > 0) {
        console.log('🚨 High-value lead detected! Auto-assigning to contractors...');
        
        // Step 4: Assign lead to contractor(s)
        const assignmentPromises = eligibleContractors.map(async (contractor) => {
          try {
            // Create lead assignment record
            const { data: assignment, error: assignmentError } = await supabase
              .from('lead_assignments')
              .insert({
                lead_id: leadId,
                contractor_id: contractor.id,
                assignment_method: 'automatic',
                email_sent: false
              })
              .select()
              .single();

            if (assignmentError) {
              console.error('❌ Failed to create assignment:', assignmentError);
              return null;
            }

            // Update lead status to assigned
            await supabase
              .from('leads')
              .update({
                status: 'assigned',
                assigned_contractor_id: contractor.id,
                sent_at: new Date().toISOString()
              })
              .eq('id', leadId);

            // Step 5: Send email notification to contractor
            await sendContractorNotification(contractor, lead, assignment.id);

            // Update assignment to mark email as sent
            await supabase
              .from('lead_assignments')
              .update({ email_sent: true })
              .eq('id', assignment.id);

            console.log('✅ Lead assigned to contractor:', contractor.name);
            return {
              contractorId: contractor.id,
              contractorName: contractor.name,
              assignmentId: assignment.id
            };

          } catch (assignmentError) {
            console.error('❌ Assignment failed for contractor:', contractor.name, assignmentError);
            return null;
          }
        });

        // Wait for all assignments to complete
        const assignmentResults = await Promise.all(assignmentPromises);
        assignedContractors = assignmentResults.filter(result => result !== null);

        console.log('✅ Lead assignment complete. Assigned to:', assignedContractors.length, 'contractors');
      } else {
        console.log('📝 Lead score too low for auto-assignment or no eligible contractors');
      }

    } catch (dbError) {
      console.error('❌ Database error during lead processing:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Failed to process lead',
        error: dbError.message
      });
    }

    return res.status(200).json({
      success: true,
      id: leadId,
      score: lead_score,
      assigned_contractors: assignedContractors,
      assignment_count: assignedContractors.length
    });

  } catch (error) {
    console.error('💥 Lead assignment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}

// Function to send email notification to contractor
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
          
          ${lead.image_url || lead.ai_url ? `
          <div style="margin: 30px 0;">
            <h3 style="color: #333; text-align: center;">Project Images</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 15px;">
              ${lead.image_url ? `
              <div>
                <p style="text-align: center; color: #666; font-size: 14px; margin-bottom: 5px;">Before</p>
                <img src="${lead.image_url}" alt="Before" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px;" />
              </div>
              ` : ''}
              ${lead.ai_url ? `
              <div>
                <p style="text-align: center; color: #666; font-size: 14px; margin-bottom: 5px;">After (AI Generated)</p>
                <img src="${lead.ai_url}" alt="After" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px;" />
              </div>
              ` : ''}
            </div>
          </div>
          ` : ''}
          
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