import { createClient } from '@supabase/supabase-js'; // Import the Supabase client

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔍 Testing Supabase connection...');
    
    // Log all possible environment variables for debugging
    console.log('Environment Variables:');
    console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
    console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL);
    console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY);
    console.log('VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY);
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    // Check environment variables
    const supabaseUrl =
      process.env.SUPABASE_URL ||
      process.env.VITE_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseAnonKey =
      process.env.SUPABASE_ANON_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    console.log('Selected SUPABASE_URL:', supabaseUrl);
    console.log('Selected SUPABASE_ANON_KEY:', supabaseAnonKey);

    if (!supabaseUrl) {
      return res.status(500).json({
        success: false,
        error: 'SUPABASE_URL environment variable is missing',
        details: {
          checkedVars: ['SUPABASE_URL', 'VITE_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL'],
          solution: 'Add SUPABASE_URL to your environment variables'
        }
      });
    }

    if (!supabaseAnonKey) {
      return res.status(500).json({
        success: false,
        error: 'SUPABASE_ANON_KEY environment variable is missing',
        details: {
          checkedVars: ['SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'],
          solution: 'Add SUPABASE_ANON_KEY to your environment variables'
        }
      });
    }

    // Import and create Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('✅ Supabase client created successfully');

    // Test connection by fetching one row from leads table
    console.log('🔍 Attempting to fetch one row from leads table...');

    const { data: leadRow, error: fetchError } = await supabase
      .from('leads')
      .select('*')
      .limit(1);

    if (fetchError) {
      console.error('❌ Fetch error:', fetchError);

      // Provide specific error handling
      let errorMessage = fetchError.message;
      let solution = 'Check your Supabase configuration';

      if (fetchError.code === 'PGRST116') {
        errorMessage = 'The leads table does not contain any rows';
        solution = 'Add some data to the leads table in your Supabase dashboard';
      } else if (fetchError.message.includes('Invalid API key')) {
        errorMessage = 'Invalid Supabase API key';
        solution = 'Check your SUPABASE_ANON_KEY in environment variables';
      } else if (fetchError.message.includes('Project not found')) {
        errorMessage = 'Supabase project not found';
        solution = 'Check your SUPABASE_URL in environment variables';
      }

      return res.status(500).json({
        success: false,
        error: errorMessage,
        details: {
          code: fetchError.code,
          hint: fetchError.hint,
          solution: solution
        }
      });
    }

    // Handle the case where no rows are returned
    if (!leadRow || leadRow.length === 0) {
      console.log('ℹ️ No rows found in leads table, checking table structure...');

      const { data: tableInfo, error: tableError } = await supabase
        .from('leads')
        .select('count', { count: 'exact', head: true });

      if (tableError) {
        return res.status(500).json({
          success: false,
          error: 'Table exists but cannot query it',
          details: tableError
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Supabase connection successful - leads table is empty',
        data: null,
        tableInfo: {
          rowCount: tableInfo || 0,
          tableExists: true
        }
      });
    }

    // Success - return the row data
    console.log('✅ Successfully fetched row from leads table');
    
    return res.status(200).json({
      success: true,
      message: 'Supabase connection successful',
      data: leadRow[0], // Since we're not using .single(), we need to access the first element
      tableInfo: {
        hasData: true,
        sampleRowId: leadRow[0].id
      }
    });

  } catch (error) {
    console.error('💥 Unexpected error:', error);
    return res.status(500).json({
      success: false,
      error: 'Unexpected error occurred',
      details: {
        message: error.message,
        stack: error.stack
      }
    });
  }
}