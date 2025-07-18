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
    // Check for different possible environment variable names
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    return res.status(200).json({
      SUPABASE_URL: supabaseUrl || null,
      SUPABASE_ANON_KEY: supabaseAnonKey ? true : false,
      SUPABASE_SERVICE_ROLE_KEY: supabaseServiceKey ? true : false
    });

  } catch (error) {
    console.error('Environment test error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}