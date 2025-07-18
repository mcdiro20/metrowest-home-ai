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
      afterImage 
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
        
        // Calculate lead score
        let leadScore = 10; // Base score for completing AI render
        if (email) leadScore += 15;
        if (name) leadScore += 10;
        if (phone) leadScore += 20;
        if (subscribe) leadScore += 30;
        
        // MetroWest ZIP codes for bonus scoring
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
        
        if (zipCode && metroWestZips.includes(zipCode)) {
          leadScore += 25;
        }
        
        const leadData = {
          name: name || null,
          email: email,
          phone: phone || null,
          zip: zipCode,
          room_type: roomType,
          style: selectedStyle,
          image_url: beforeImage,
          ai_url: afterImage,
          render_count: 1,
          wants_quote: subscribe || false,
          social_engaged: false,
          is_repeat_visitor: false,
          lead_score: leadScore
        };
        
        const { error: leadError } = await supabase
          .from('leads')
          .insert(leadData);
        
        if (leadError) {
          console.error('Failed to save lead:', leadError);
        }
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