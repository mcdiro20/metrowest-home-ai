export default async function handler(req, res) {
  // Set CORS headers FIRST
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed',
      message: 'Only POST requests are allowed'
    });
  }

  try {
    console.log('📧 Email API endpoint called');
    console.log('📧 Request method:', req.method);
    console.log('📧 Request headers:', req.headers);

    // Validate request body exists
    if (!req.body) {
      console.error('❌ No request body provided');
      return res.status(400).json({
        success: false,
        error: 'Request body is missing',
        message: 'Please provide email and image data'
      });
    }

    console.log('📧 Request body keys:', Object.keys(req.body));

    const { email, beforeImage, afterImage, selectedStyle, roomType, subscribe } = req.body;

    console.log('📧 Email request received for:', email);
    console.log('📧 Before image exists:', !!beforeImage);
    console.log('📧 Before image type:', beforeImage ? (beforeImage.startsWith('data:') ? 'base64' : 'url') : 'missing');
    console.log('📧 Before image length:', beforeImage?.length || 0);
    console.log('📧 After image exists:', !!afterImage);
    console.log('📧 After image type:', afterImage ? (afterImage.startsWith('data:') ? 'base64' : 'url') : 'missing');

    // Basic validation
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email is required',
        message: 'Please provide a valid email address'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
        message: 'Please provide a valid email address'
      });
    }

    // Check environment variables
    console.log('🔍 Checking environment variables...');
    const resendApiKey = process.env.RESEND_API_KEY;
    const openaiApiKey = process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    
    console.log('🔍 RESEND_API_KEY exists:', !!resendApiKey);
    console.log('🔍 OPENAI_API_KEY exists:', !!openaiApiKey);

    // If no Resend API key, simulate email sending
    if (!resendApiKey) {
      console.log('⚠️ No Resend API key found - simulating email send');
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return res.status(200).json({
        success: true,
        message: 'Email simulated successfully (no API key configured)',
        emailId: `sim_${Date.now()}`,
        details: {
          mode: 'development',
          recipient: email,
          style: selectedStyle,
          roomType: roomType
        }
      });
    }

    // Try to send real email
    console.log('📤 Attempting to send real email with Resend...');
    
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(resendApiKey);

      // Validate images
      const hasBeforeImage = beforeImage && beforeImage.length > 100 && beforeImage.startsWith('data:image/');
      const hasAfterImage = afterImage && afterImage.length > 10 && (afterImage.startsWith('http') || afterImage.startsWith('data:'));
      
      console.log('📧 Image validation:');
      console.log('📧 - Before image valid:', hasBeforeImage);
      console.log('📧 - After image valid:', hasAfterImage);
      console.log('📧 - Before starts with data:image:', beforeImage?.startsWith('data:image/'));
      console.log('📧 - After starts with http:', afterImage?.startsWith('http'));

      const emailResult = await resend.emails.send({
        from: 'MetroWest Home AI <onboarding@resend.dev>',
        to: [email],
        subject: 'Your AI-Generated Design is Ready!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 320px; margin: 0 auto; padding: 4px;">
            <h1 style="color: #2563eb; font-size: 16px; margin: 4px 0;">Your AI Design is Ready!</h1>
            <p style="margin: 2px 0; font-size: 12px;">Your <strong>${roomType || 'space'}</strong> transformation is complete!</p>
            
            <div style="margin: 6px 0;">
              <div style="margin: 6px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                  <td style="width: 50%; padding: 2px; text-align: center; vertical-align: top;">
                    <div style="margin: 2px 0 4px 0; color: #374151; font-size: 11px; font-weight: bold;">Before</div>
                    ${hasBeforeImage ? `
                      <img src="${beforeImage}" style="width: 100%; max-width: 140px; height: auto; border-radius: 4px; display: block; margin: 0 auto;" />
                    ` : `
                      <div style="width: 140px; height: 100px; background: #f3f4f6; border-radius: 4px; margin: 0 auto; display: flex; align-items: center; justify-content: center; color: #9ca3af; font-size: 10px;">Original Photo</div>
                    `}
                    </td>
                  <td style="width: 50%; padding: 2px; text-align: center; vertical-align: top;">
                    <div style="margin: 2px 0 4px 0; color: #059669; font-size: 11px; font-weight: bold;">After</div>
                    ${hasAfterImage ? `
                      <img src="${afterImage}" style="width: 100%; max-width: 140px; height: auto; border-radius: 4px; display: block; margin: 0 auto;" />
                    ` : `
                      <div style="width: 140px; height: 100px; background: #f3f4f6; border-radius: 4px; margin: 0 auto; display: flex; align-items: center; justify-content: center; color: #9ca3af; font-size: 10px;">AI Design</div>
                    `}
                    </td>
                  </tr>
                </table>
            </div>
            
            <p style="margin: 4px 0; font-size: 10px; text-align: center;">Thanks for using MetroWest Home AI!</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 4px 0;" />
            <p style="color: #9ca3af; font-size: 8px; text-align: center; margin: 2px 0;">
              MetroWest Home AI<br>
              MetroWest Massachusetts
            </p>
          </div>
        `,
      });

      console.log('✅ Email sent successfully! ID:', emailResult.data?.id);

      return res.status(200).json({
        success: true,
        message: 'Email sent successfully!',
        emailId: emailResult.data?.id || 'sent',
        details: {
          mode: 'production',
          recipient: email
        }
      });

    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError);
      
      // Return error but still as JSON
      return res.status(500).json({
        success: false,
        error: 'Email sending failed',
        message: emailError.message || 'Failed to send email',
        details: {
          mode: 'error',
          originalError: emailError.message
        }
      });
    }

  } catch (error) {
    console.error('💥 Function error:', error);
    console.error('💥 Error stack:', error.stack);
    
    // ALWAYS return JSON, even on unexpected errors
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred while processing your request',
      details: {
        error: error.message,
        timestamp: new Date().toISOString(),
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    });
  }
}