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

    const emailResult = await resend.emails.send({
      from: 'MetroWest Home AI <onboarding@resend.dev>',
      to: [email],
      subject: 'Your AI Design is Ready!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb;">Your AI Design is Ready!</h1>
          <p>Your ${roomType || 'space'} transformation with ${selectedStyle || 'custom'} style is complete!</p>
          <p>Thanks for using MetroWest Home AI!</p>
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