export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('🔍 Debug Environment Variables');
    console.log('🔍 NODE_ENV:', process.env.NODE_ENV);
    console.log('🔍 VERCEL:', process.env.VERCEL);
    console.log('🔍 VERCEL_ENV:', process.env.VERCEL_ENV);
    
    // Get all environment variable names
    const envKeys = Object.keys(process.env);
    console.log('🔍 Total env vars:', envKeys.length);
    console.log('🔍 All env var names:', envKeys);
    
    // Check for different possible API key names
    const possibleResendKeys = [
      'RESEND_API_KEY',
      'VITE_RESEND_API_KEY', 
      'NEXT_PUBLIC_RESEND_API_KEY',
      'resend_api_key',
      'RESEND_KEY'
    ];
    
    const possibleOpenAIKeys = [
      'OPENAI_API_KEY',
      'VITE_OPENAI_API_KEY',
      'NEXT_PUBLIC_OPENAI_API_KEY',
      'openai_api_key',
      'OPENAI_KEY'
    ];
    
    const resendStatus = {};
    const openaiStatus = {};
    
    possibleResendKeys.forEach(key => {
      const value = process.env[key];
      resendStatus[key] = value ? `EXISTS (${value.substring(0, 10)}...)` : 'MISSING';
    });
    
    possibleOpenAIKeys.forEach(key => {
      const value = process.env[key];
      openaiStatus[key] = value ? `EXISTS (${value.substring(0, 10)}...)` : 'MISSING';
    });

    return res.status(200).json({
      success: true,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
        VERCEL_ENV: process.env.VERCEL_ENV
      },
      totalEnvVars: envKeys.length,
      allEnvKeys: envKeys,
      resendKeys: resendStatus,
      openaiKeys: openaiStatus
    });

  } catch (error) {
    console.error('💥 Debug error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}