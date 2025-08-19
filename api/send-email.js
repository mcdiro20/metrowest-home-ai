import { createClient } from '@supabase/supabase-js';
import { calculateAdvancedScores } from './utils/scoringLogic.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { 
      email, 
      name, 
      phone, 
      selectedStyle, 
      roomType, 
      subscribe, 
      zipCode, 
      beforeImage, 
      afterImage,
      userId
    } = req.body || {};

    // Basic validation
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    // Save lead data to Supabase (server-side)
    try {
      const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        // Fetch existing lead and profile data for scoring
        let existingLead = null;
        let profileData = null;

        if (userId) {
          // Get profile data for scoring
          const { data: profile } = await supabase
            .from('profiles')
            .select('login_count, total_time_on_site_ms, ai_renderings_count')
            .eq('id', userId)
            .single();
          profileData = profile;

          // Check for existing lead from this user
          const { data: userLead } = await supabase
            .from('leads')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          existingLead = userLead;
        } else if (email) {
          // Check for existing lead by email
          const { data: emailLead } = await supabase
            .from('leads')
            .select('*')
            .eq('email', email)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          existingLead = emailLead;
        }
        
        // Prepare data for scoring calculations
        const leadDataForScoring = {
          email: email,
          phone: phone,
          name: name,
          zip: zipCode,
          room_type: roomType,
          style: selectedStyle,
          render_count: (existingLead?.render_count || 0) + 1,
          wants_quote: subscribe || false,
          social_engaged: existingLead?.social_engaged || false,
          is_repeat_visitor: !!existingLead,
          status: existingLead?.status || 'new',
          created_at: existingLead?.created_at || new Date().toISOString()
        };

        const profileDataForScoring = profileData || {
          login_count: 0,
          total_time_on_site_ms: 0,
          ai_renderings_count: 0
        };

        // Calculate advanced scores using the scoring logic
        const scores = calculateAdvancedScores(profileDataForScoring, leadDataForScoring);
        console.log('📊 Calculated scores:', scores);

        const leadData = {
          user_id: userId || null,
          name: name || null,
          email: email,
          phone: phone || null,
          zip: zipCode,
          room_type: roomType,
          style: selectedStyle,
          image_url: beforeImage,
          ai_url: afterImage,
          render_count: leadDataForScoring.render_count,
          wants_quote: subscribe || false,
          social_engaged: leadDataForScoring.social_engaged,
          is_repeat_visitor: leadDataForScoring.is_repeat_visitor,
          lead_score: scores.overall_score, // Keep legacy score for compatibility
          // Add new intelligence scores
          engagement_score: scores.engagement_score,
          intent_score: scores.intent_score,
          lead_quality_score: scores.lead_quality_score,
          probability_to_close_score: scores.probability_to_close_score
        };
        
        let leadResult;
        if (existingLead) {
          // Update existing lead
          const { data, error: updateError } = await supabase
            .from('leads')
            .update(leadData)
            .eq('id', existingLead.id)
            .select()
            .single();
          if (updateError) {
            console.error('Failed to update existing lead:', updateError);
          } else {
            leadResult = data;
            console.log('✅ Updated existing lead with new scores');
          }
        } else {
          // Insert new lead
          const { data, error: insertError } = await supabase
            .from('leads')
            .insert(leadData)
            .select()
            .single();
          if (insertError) {
            console.error('Failed to insert new lead:', insertError);
          } else {
            leadResult = data;
            console.log('✅ Created new lead with calculated scores');
          }
        }
        
        console.log('📊 Lead scores:', {
          engagement: scores.engagement_score,
          intent: scores.intent_score,
          quality: scores.lead_quality_score,
          probability: scores.probability_to_close_score,
          overall: scores.overall_score
        });
      }
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Continue with email sending even if DB fails
    }

    // Check for Resend API key
    const resendApiKey = process.env.RESEND_API_KEY;
    
    if (!resendApiKey) {
      return res.status(200).json({
        success: true,
        message: 'Email simulated (no API key)',
        emailId: `sim_${Date.now()}`
      });
    }

    // Send minimal email
    const { Resend } = await import('resend');
    const resend = new Resend(resendApiKey);

    // Prepare attachments if images are provided
    const attachments = [];
    
    if (beforeImage && beforeImage.startsWith('data:image/')) {
      // Convert base64 to buffer for attachment
      const base64Data = beforeImage.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      
      attachments.push({
        filename: 'before.jpg',
        content: buffer,
        contentType: 'image/jpeg'
      });
    }
    
    // For after image, we need to fetch it if it's a URL
    if (afterImage && afterImage.startsWith('http')) {
      try {
        const imageResponse = await fetch(afterImage);
        const imageBuffer = await imageResponse.arrayBuffer();
        
        attachments.push({
          filename: 'after.jpg',
          content: Buffer.from(imageBuffer),
          contentType: 'image/jpeg'
        });
      } catch (fetchError) {
        console.log('Could not fetch after image for attachment');
      }
    }
    const emailResult = await resend.emails.send({
      from: 'MetroWest Home AI <onboarding@resend.dev>',
      to: [email],
      subject: 'Your AI Design is Ready!',
      attachments: attachments.length > 0 ? attachments : undefined,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin-bottom: 10px;">Your AI Design is Ready! 🎉</h1>
            <p style="color: #666; font-size: 18px;">Your ${roomType || 'space'} transformation with ${selectedStyle || 'custom'} style is complete!</p>
          </div>
          
          ${attachments.length > 0 ? `
          <div style="margin: 30px 0;">
            <h2 style="color: #333; text-align: center;">Your Before & After Images</h2>
            <p style="color: #666; text-align: center;">See the attached high-resolution images of your transformation!</p>
          </div>
          ` : ''}
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">What's Next?</h3>
            <ul style="color: #666; line-height: 1.6;">
              <li>Review your attached before/after images</li>
              <li>Share your transformation with friends and family</li>
              <li>Ready to make it real? Connect with local MetroWest contractors</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #666;">Thanks for using MetroWest Home AI!</p>
            <p style="color: #999; font-size: 14px;">Exclusively serving MetroWest Massachusetts homeowners</p>
          </div>
        </div>
      `
    });

    return res.status(200).json({
      success: true,
      message: 'Email sent successfully!',
      emailId: emailResult.data?.id || 'sent'
    });

  } catch (error) {
    return res.status(200).json({
      success: true,
      message: 'Email processed (fallback mode)',
      emailId: `fallback_${Date.now()}`
    });
  }
}