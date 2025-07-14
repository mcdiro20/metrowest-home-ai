import { createServerSupabaseClient } from '../src/lib/supabase.js';

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
      is_repeat_visitor = false
    } = req.body;

    console.log('🎯 Contractor notification request received');
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

    // Insert lead into Supabase
    const supabase = createServerSupabaseClient();
    let leadId = null;

    if (supabase) {
      try {
        const { data: lead, error } = await supabase
          .from('leads')
          .insert({
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
            lead_score
          })
          .select()
          .single();

        if (error) {
          console.error('❌ Supabase insert error:', error);
        } else {
          leadId = lead.id;
          console.log('✅ Lead saved to database:', leadId);
        }
      } catch (dbError) {
        console.error('❌ Database error:', dbError);
        // Continue with contractor notification even if DB fails
      }
    } else {
      console.warn('⚠️ Supabase not configured - lead not saved to database');
    }

    // Check if lead score is high enough to notify contractors
    const MINIMUM_SCORE_FOR_CONTRACTOR_NOTIFICATION = 40;
    
    if (lead_score >= MINIMUM_SCORE_FOR_CONTRACTOR_NOTIFICATION) {
      console.log('🚨 High-value lead detected! Notifying contractors...');
      
      // Here you would implement contractor notification logic
      // For now, we'll just log it
      try {
        // TODO: Implement contractor email notification
        // - Query contractors serving this ZIP code
        // - Send email with lead details
        // - Track notification sent
        
        console.log('📧 Would notify contractors for lead:', {
          leadId,
          email,
          zip,
          room_type,
          style,
          lead_score
        });
        
        // Simulate contractor notification
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (notificationError) {
        console.error('❌ Contractor notification failed:', notificationError);
      }
    } else {
      console.log('📝 Lead score too low for contractor notification');
    }

    return res.status(200).json({
      success: true,
      id: leadId,
      score: lead_score,
      notified_contractors: lead_score >= MINIMUM_SCORE_FOR_CONTRACTOR_NOTIFICATION
    });

  } catch (error) {
    console.error('💥 Contractor notification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}