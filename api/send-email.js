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
    console.log('📧 Selected style:', selectedStyle);
    console.log('📧 Room type:', roomType);

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
      const hasBeforeImage = beforeImage && (beforeImage.startsWith('data:') || beforeImage.startsWith('http'));
      const hasAfterImage = afterImage && (afterImage.startsWith('http') || afterImage.startsWith('data:'));
      
      console.log('📧 Has valid before image:', hasBeforeImage);
      console.log('📧 Has valid after image:', hasAfterImage);
      console.log('📧 Before image type:', beforeImage ? (beforeImage.startsWith('data:') ? 'base64' : 'url') : 'none');
      console.log('📧 After image type:', afterImage ? (afterImage.startsWith('data:') ? 'base64' : 'url') : 'none');

      const emailResult = await resend.emails.send({
        from: 'MetroWest Home AI <onboarding@resend.dev>',
        to: [email],
        subject: 'Your AI-Generated Design is Ready!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 10px;">
            <h1 style="color: #2563eb; font-size: 20px; margin: 10px 0;">Your AI Design is Ready!</h1>
            <p style="margin: 5px 0;">Your <strong>${roomType || 'space'}</strong> transformation in <strong>${selectedStyle || 'custom'}</strong> style is complete!</p>
            
            ${hasBeforeImage && hasAfterImage ? `
              <div style="margin: 15px 0;">
                <table style="width: 100%; border-collapse: collapse; table-layout: fixed;">
                  <tr>
                    <td style="width: 50%; padding: 5px; vertical-align: top; text-align: center;">
                      <h3 style="margin: 5px 0 10px 0; color: #374151; font-size: 14px;">Before</h3>
                      <img src="${beforeImage}" style="width: 100%; max-width: 200px; height: auto; border-radius: 6px; border: 2px solid #e5e7eb; display: block; margin: 0 auto;" />
                    </td>
                    <td style="width: 50%; padding: 5px; vertical-align: top; text-align: center;">
                      <h3 style="margin: 5px 0 10px 0; color: #059669; font-size: 14px;">After</h3>
                      <img src="${afterImage}" style="width: 100%; max-width: 200px; height: auto; border-radius: 6px; border: 2px solid #10b981; display: block; margin: 0 auto;" />
                    </td>
                  </tr>
                </table>
              </div>
            ` : hasAfterImage ? `
              <div style="text-align: center; margin: 15px 0;">
                <h3 style="margin: 5px 0 10px 0; color: #059669; font-size: 16px;">After</h3>
                <img src="${afterImage}" style="width: 100%; max-width: 400px; height: auto; border-radius: 6px; border: 2px solid #10b981; display: block; margin: 0 auto;" />
              </div>
            ` : hasBeforeImage ? `
              <div style="text-align: center; margin: 15px 0;">
                <h3 style="margin: 5px 0 10px 0; color: #374151; font-size: 16px;">Before</h3>
                <img src="${beforeImage}" style="width: 100%; max-width: 400px; height: auto; border-radius: 6px; border: 2px solid #e5e7eb; display: block; margin: 0 auto;" />
              </div>
            ` : ''}
            
            <div style="background: #f8fafc; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 3px solid #3b82f6;">
              <h4 style="color: #374151; margin: 5px 0 10px 0; font-size: 14px;">✨ Details:</h4>
              <ul style="color: #6b7280; margin: 0; padding-left: 15px; font-size: 13px;">
                <li><strong>Room Type:</strong> ${roomType || 'Kitchen'}</li>
                <li><strong>Design Style:</strong> ${selectedStyle || 'Custom'}</li>
                <li><strong>Generated:</strong> ${new Date().toLocaleDateString()}</li>
              </ul>
            </div>
            
            <p style="margin: 10px 0; font-size: 14px;">Thanks for using MetroWest Home AI!</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 15px 0;" />
            <p style="color: #9ca3af; font-size: 11px; text-align: center; margin: 5px 0;">
              MetroWest Home AI<br>
              Exclusively serving MetroWest Massachusetts homeowners
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