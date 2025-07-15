export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('🔍 Debugging Supabase Connection');
    
    // Check environment variables
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('🔍 Environment Check:');
    console.log('🔍 SUPABASE_URL:', supabaseUrl ? 'EXISTS' : 'MISSING');
    console.log('🔍 SUPABASE_ANON_KEY:', supabaseAnonKey ? 'EXISTS' : 'MISSING');
    console.log('🔍 SUPABASE_SERVICE_KEY:', supabaseServiceKey ? 'EXISTS' : 'MISSING');
    
    if (supabaseUrl) {
      console.log('🔍 URL starts with https:', supabaseUrl.startsWith('https://'));
      console.log('🔍 URL ends with supabase.co:', supabaseUrl.includes('supabase.co'));
    }
    
    // Try to connect to Supabase
    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(200).json({
        success: false,
        message: 'Supabase environment variables not configured',
        details: {
          hasUrl: !!supabaseUrl,
          hasAnonKey: !!supabaseAnonKey,
          hasServiceKey: !!supabaseServiceKey
        }
      });
    }
    
    // Import Supabase and test connection
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('🔍 Testing Supabase connection...');
    
    // Test 1: Check if leads table exists
    const { data: tables, error: tablesError } = await supabase
      .from('leads')
      .select('count', { count: 'exact', head: true });
    
    if (tablesError) {
      console.error('❌ Table access error:', tablesError);
      return res.status(200).json({
        success: false,
        message: 'Cannot access leads table',
        error: tablesError.message,
        details: {
          code: tablesError.code,
          hint: tablesError.hint
        }
      });
    }
    
    console.log('✅ Leads table accessible, count:', tables);
    
    // Test 2: Try to insert a test record
    const testLead = {
      name: 'Test User',
      email: 'test@example.com',
      zip: '01701',
      room_type: 'kitchen',
      style: 'modern',
      render_count: 1,
      wants_quote: false,
      social_engaged: false,
      is_repeat_visitor: false,
      lead_score: 25
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('leads')
      .insert(testLead)
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Insert test failed:', insertError);
      return res.status(200).json({
        success: false,
        message: 'Cannot insert into leads table',
        error: insertError.message,
        details: {
          code: insertError.code,
          hint: insertError.hint
        }
      });
    }
    
    console.log('✅ Test insert successful:', insertData.id);
    
    // Test 3: Read the data back
    const { data: readData, error: readError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', insertData.id)
      .single();
    
    if (readError) {
      console.error('❌ Read test failed:', readError);
    } else {
      console.log('✅ Test read successful');
    }
    
    // Clean up test record
    await supabase
      .from('leads')
      .delete()
      .eq('id', insertData.id);
    
    return res.status(200).json({
      success: true,
      message: 'Supabase connection working perfectly!',
      testResults: {
        tableAccess: true,
        insertTest: true,
        readTest: !readError,
        testRecordId: insertData.id
      }
    });
    
  } catch (error) {
    console.error('💥 Debug error:', error);
    return res.status(500).json({
      success: false,
      message: 'Debug test failed',
      error: error.message
    });
  }
}