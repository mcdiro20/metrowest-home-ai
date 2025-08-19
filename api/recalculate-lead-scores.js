import { calculateAdvancedScores } from './utils/scoringLogic.js';

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
    console.log('🔄 Recalculate lead scores request received');

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

    console.log('✅ Admin verification passed, starting score recalculation');

    // Fetch all leads with related profile data
    const { data: leads, error: leadsError } = await supabaseAdmin
      .from('leads')
      .select(`
        *,
        profiles:user_id (
          id,
          login_count,
          total_time_on_site_ms,
          ai_renderings_count
        )
      `);

    if (leadsError) {
      console.error('❌ Failed to fetch leads for recalculation:', leadsError);
      return res.status(500).json({
        success: false,
        error: `Failed to fetch leads: ${leadsError.message}`
      });
    }

    console.log(`🔄 Recalculating scores for ${leads?.length || 0} leads...`);

    let updatedCount = 0;
    const batchSize = 10; // Process in batches to avoid timeouts

    if (leads && leads.length > 0) {
      // Process leads in batches
      for (let i = 0; i < leads.length; i += batchSize) {
        const batch = leads.slice(i, i + batchSize);
        
        const updatePromises = batch.map(async (lead) => {
          try {
            // Prepare data for scoring
            const profileData = lead.profiles || {
              login_count: 0,
              total_time_on_site_ms: 0,
              ai_renderings_count: 0
            };

            const leadData = {
              email: lead.email,
              phone: lead.phone,
              name: lead.name,
              zip: lead.zip,
              room_type: lead.room_type,
              style: lead.style,
              render_count: lead.render_count || 1,
              wants_quote: lead.wants_quote || false,
              social_engaged: lead.social_engaged || false,
              is_repeat_visitor: lead.is_repeat_visitor || false,
              status: lead.status || 'new',
              created_at: lead.created_at
            };

            // Calculate new scores
            const scores = calculateAdvancedScores(profileData, leadData);

            // Update the lead with new scores
            const { error: updateError } = await supabaseAdmin
              .from('leads')
              .update({
                engagement_score: scores.engagement_score,
                intent_score: scores.intent_score,
                lead_quality_score: scores.lead_quality_score,
                probability_to_close_score: scores.probability_to_close_score
              })
              .eq('id', lead.id);

            if (updateError) {
              console.error(`❌ Failed to update scores for lead ${lead.id}:`, updateError);
              return false;
            }

            console.log(`✅ Updated scores for lead ${lead.id}: Overall=${scores.overall_score}`);
            return true;

          } catch (leadError) {
            console.error(`❌ Error processing lead ${lead.id}:`, leadError);
            return false;
          }
        });

        // Wait for batch to complete
        const batchResults = await Promise.all(updatePromises);
        updatedCount += batchResults.filter(result => result === true).length;

        console.log(`🔄 Processed batch ${Math.floor(i / batchSize) + 1}, updated ${updatedCount} leads so far`);
      }
    }

    console.log(`✅ Score recalculation complete. Updated ${updatedCount} leads.`);

    return res.status(200).json({
      success: true,
      message: 'Lead scores recalculated successfully',
      updatedCount: updatedCount,
      totalLeads: leads?.length || 0,
      processingTime: Date.now()
    });

  } catch (error) {
    console.error('💥 Recalculate scores error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
}