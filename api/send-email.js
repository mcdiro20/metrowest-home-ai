import { createClient } from '@supabase/supabase-js';
import { calculateAdvancedScores } from './utils/scoringLogic.js';

async function uploadImageToStorage(supabase, imageUrl, userId, prefix = 'ai') {
  try {
    if (!imageUrl) return null;

    let imageBuffer;

    if (imageUrl.startsWith('data:image/')) {
      const base64Content = imageUrl.split(',')[1];
      imageBuffer = Buffer.from(base64Content, 'base64');
    } else if (imageUrl.startsWith('http')) {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        console.error('❌ Failed to fetch image from URL:', imageUrl);
        return null;
      }
      const arrayBuffer = await response.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
    } else {
      return null;
    }

    const fileName = `${prefix}-${userId}-${Date.now()}.jpg`;
    const filePath = `${userId}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('ai-images')
      .upload(filePath, imageBuffer, {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (error) {
      console.error('❌ Failed to upload image to Supabase Storage:', error);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('ai-images')
      .getPublicUrl(filePath);

    console.log('✅ Image uploaded to Supabase Storage:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('❌ Error uploading image to storage:', error);
    return null;
  }
}

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

        const userIdForStorage = userId || `guest-${Date.now()}`;

        console.log('📤 Uploading images to Supabase Storage...');
        let storedBeforeImageUrl = beforeImage;
        let storedAfterImageUrl = afterImage;

        if (beforeImage?.startsWith('data:image/')) {
          console.log('📤 Uploading before image...');
          const uploadedUrl = await uploadImageToStorage(supabase, beforeImage, userIdForStorage, 'before');
          if (uploadedUrl) {
            storedBeforeImageUrl = uploadedUrl;
            console.log('✅ Before image uploaded:', uploadedUrl);
          }
        }

        if (afterImage?.startsWith('http')) {
          console.log('📤 Uploading AI image from Replicate...');
          const uploadedUrl = await uploadImageToStorage(supabase, afterImage, userIdForStorage, 'ai');
          if (uploadedUrl) {
            storedAfterImageUrl = uploadedUrl;
            console.log('✅ AI image uploaded:', uploadedUrl);
          }
        }

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
          image_url: storedBeforeImageUrl,
          ai_url: storedAfterImageUrl,
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
            console.error('❌ Failed to update existing lead:', updateError);
          } else {
            leadResult = data;
            console.log('✅ Updated existing lead:', data.id);
          }
        } else {
          // Insert new lead
          const { data, error: insertError } = await supabase
            .from('leads')
            .insert(leadData)
            .select()
            .single();
          if (insertError) {
            console.error('❌ Failed to insert new lead:', insertError);
            console.error('   Details:', insertError.details);
            console.error('   Hint:', insertError.hint);
          } else {
            leadResult = data;
            console.log('✅ Created new lead:', data.id);
          }
        }

        // Store lead ID and result for feedback link and notifications
        if (leadResult?.id) {
          req.leadId = leadResult.id;
          req.leadResult = leadResult;
          console.log('📝 Lead ID stored for email:', req.leadId);
        } else {
          console.error('⚠️ No lead ID available - lead creation may have failed');
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

    // Send admin notification (do this regardless of whether user emails are sent)
    const sendAdminNotification = async () => {
      console.log('🚀 sendAdminNotification function called');
      try {
        const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
        const resendApiKey = process.env.RESEND_API_KEY;

        console.log('🔍 Checking environment variables:', {
          hasAdminEmail: !!adminEmail,
          adminEmail: adminEmail,
          hasResendKey: !!resendApiKey,
          resendKeyLength: resendApiKey?.length
        });

        // Resend testing mode: can only send to verified email (mattdiro@gmail.com)
        // Override to use verified email until domain is set up
        const finalAdminEmail = 'mattdiro@gmail.com';

        console.log(`📧 Using admin email: ${finalAdminEmail} (testing mode - domain not verified)`);

        if (!resendApiKey) {
          console.log('⚠️ RESEND_API_KEY not configured, skipping notification');
          return;
        }

        if (!resendApiKey) {
          console.log('⚠️ RESEND_API_KEY not configured, skipping notification');
          return;
        }

        const event_type = subscribe ? 'contractor_form' : 'ai_rendering';
        const lead_score = req.leadResult?.lead_score;

        console.log(`📬 Sending admin notification: ${event_type}`);
        console.log('📥 Importing Resend library...');

        const { Resend } = await import('resend');
        console.log('✓ Resend imported, creating instance...');

        const resend = new Resend(resendApiKey);
        console.log('✓ Resend instance created');

        let subject = '';
        let htmlContent = '';

        if (event_type === 'ai_rendering') {
          subject = `🎨 New AI Rendering - ${name || email || 'Unknown User'}`;
          htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #2563eb;">🎨 New AI Rendering Generated</h1>

              <div style="background: #f8fafc; padding: 20px; border-radius: 10px; margin: 20px 0;">
                <h2 style="color: #333; margin-top: 0;">User Details</h2>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-weight: bold;">Name:</td>
                    <td style="padding: 8px 0; color: #333;">${name || 'Not provided'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-weight: bold;">Email:</td>
                    <td style="padding: 8px 0; color: #333;">${email || 'Not provided'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-weight: bold;">Phone:</td>
                    <td style="padding: 8px 0; color: #333;">${phone || 'Not provided'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-weight: bold;">Zip Code:</td>
                    <td style="padding: 8px 0; color: #333;">${zipCode || 'Not provided'}</td>
                  </tr>
                </table>
              </div>

              <div style="background: #f0fdf4; padding: 20px; border-radius: 10px; margin: 20px 0;">
                <h2 style="color: #333; margin-top: 0;">Project Details</h2>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-weight: bold;">Room Type:</td>
                    <td style="padding: 8px 0; color: #333;">${roomType || 'Not specified'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-weight: bold;">Style:</td>
                    <td style="padding: 8px 0; color: #333;">${selectedStyle || 'Not specified'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-weight: bold;">Lead Score:</td>
                    <td style="padding: 8px 0; color: #333;">${lead_score ? `${lead_score}/100` : 'Not calculated'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-weight: bold;">Time:</td>
                    <td style="padding: 8px 0; color: #333;">${new Date().toLocaleString()}</td>
                  </tr>
                </table>
              </div>

              <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:5173'}/admin"
                   style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  View in Admin Dashboard
                </a>
              </div>
            </div>
          `;
        } else if (event_type === 'contractor_form') {
          subject = `📋 New Contractor Quote Request - ${name || email || 'Unknown User'}`;
          htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #059669;">📋 New Contractor Quote Request</h1>

              <div style="background: #fef3c7; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                <h2 style="color: #92400e; margin-top: 0;">🔥 Hot Lead!</h2>
                <p style="color: #78350f; margin: 0;">This user is actively seeking quotes from contractors.</p>
              </div>

              <div style="background: #f8fafc; padding: 20px; border-radius: 10px; margin: 20px 0;">
                <h2 style="color: #333; margin-top: 0;">Contact Information</h2>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-weight: bold;">Name:</td>
                    <td style="padding: 8px 0; color: #333;">${name || 'Not provided'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-weight: bold;">Email:</td>
                    <td style="padding: 8px 0; color: #333;">${email || 'Not provided'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-weight: bold;">Phone:</td>
                    <td style="padding: 8px 0; color: #333;">${phone || 'Not provided'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-weight: bold;">Zip Code:</td>
                    <td style="padding: 8px 0; color: #333;">${zipCode || 'Not provided'}</td>
                  </tr>
                </table>
              </div>

              <div style="background: #f0fdf4; padding: 20px; border-radius: 10px; margin: 20px 0;">
                <h2 style="color: #333; margin-top: 0;">Project Details</h2>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-weight: bold;">Room Type:</td>
                    <td style="padding: 8px 0; color: #333;">${roomType || 'Not specified'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-weight: bold;">Style:</td>
                    <td style="padding: 8px 0; color: #333;">${selectedStyle || 'Not specified'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-weight: bold;">Lead Score:</td>
                    <td style="padding: 8px 0; color: #333;">${lead_score ? `${lead_score}/100` : 'Not calculated'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-weight: bold;">Time:</td>
                    <td style="padding: 8px 0; color: #333;">${new Date().toLocaleString()}</td>
                  </tr>
                </table>
              </div>

              <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:5173'}/admin"
                   style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Assign to Contractor
                </a>
              </div>
            </div>
          `;
        }

        console.log(`📤 Attempting to send to: ${finalAdminEmail} with subject: ${subject}`);

        const emailResult = await resend.emails.send({
          from: 'MetroWest Home AI Notifications <noreply@ai.metrowesthomerenovation.com>',
          to: [finalAdminEmail],
          subject: subject,
          html: htmlContent
        });

        console.log(`📧 Resend API Response:`, {
          success: !!emailResult.data,
          hasError: !!emailResult.error,
          emailId: emailResult.data?.id,
          error: emailResult.error,
          to: finalAdminEmail,
          subject: subject,
          fullResponse: JSON.stringify(emailResult)
        });

        if (emailResult.error) {
          throw new Error(`Resend API error: ${JSON.stringify(emailResult.error)}`);
        }

        if (!emailResult.data?.id) {
          console.warn('⚠️ No email ID returned from Resend, but no error either');
        }

        console.log(`✅ Admin notification sent successfully: ${event_type}`, emailResult.data?.id);
      } catch (notifyError) {
        console.error('❌ Failed to send admin notification:', {
          error: notifyError.message,
          stack: notifyError.stack,
          name: notifyError.name,
          fullError: JSON.stringify(notifyError, Object.getOwnPropertyNames(notifyError))
        });
      }
    };

    // Send admin notification in background (don't await it)
    sendAdminNotification().catch(err => console.error('Admin notification error:', err));

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
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.BASE_URL || 'http://localhost:5173';

    const leadId = req.leadId;

    if (!leadId) {
      console.error('⚠️ WARNING: No lead ID available for email. Feedback links will not work properly!');
    }

    const emailResult = await resend.emails.send({
      from: 'MetroWest Home AI <noreply@ai.metrowesthomerenovation.com>',
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

          ${leadId ? `
          <div style="background: #fff; border: 2px solid #e5e7eb; padding: 20px; border-radius: 10px; margin: 30px 0; text-align: center;">
            <h3 style="color: #333; margin-top: 0; margin-bottom: 15px;">How was your experience?</h3>
            <p style="color: #666; margin-bottom: 20px;">Your feedback helps us improve!</p>
            <div style="display: flex; justify-content: center; gap: 10px;">
              <a href="${baseUrl}/feedback?lead_id=${leadId}&rating=5" style="text-decoration: none; font-size: 32px; padding: 8px; transition: transform 0.2s;">⭐⭐⭐⭐⭐</a>
            </div>
            <div style="display: flex; justify-content: center; gap: 10px; margin-top: 10px;">
              <a href="${baseUrl}/feedback?lead_id=${leadId}&rating=4" style="text-decoration: none; font-size: 32px; padding: 8px;">⭐⭐⭐⭐</a>
            </div>
            <div style="display: flex; justify-content: center; gap: 10px; margin-top: 10px;">
              <a href="${baseUrl}/feedback?lead_id=${leadId}&rating=3" style="text-decoration: none; font-size: 32px; padding: 8px;">⭐⭐⭐</a>
            </div>
            <div style="display: flex; justify-content: center; gap: 10px; margin-top: 10px;">
              <a href="${baseUrl}/feedback?lead_id=${leadId}&rating=2" style="text-decoration: none; font-size: 32px; padding: 8px;">⭐⭐</a>
            </div>
            <div style="display: flex; justify-content: center; gap: 10px; margin-top: 10px;">
              <a href="${baseUrl}/feedback?lead_id=${leadId}&rating=1" style="text-decoration: none; font-size: 32px; padding: 8px;">⭐</a>
            </div>
          </div>
          ` : ''}

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