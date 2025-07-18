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

      const emailResult = await resend.emails.send({
        from: 'MetroWest Home AI <onboarding@resend.dev>',
        to: [email],
        subject: 'Your AI-Generated Design is Ready!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Your AI Design is Ready!</h1>
            <p>Hello!</p>
            <p>Your AI-generated <strong>${roomType || 'space'}</strong> transformation in <strong>${selectedStyle || 'custom'}</strong> style is complete!</p>
            
            <div style="margin: 30px 0;">
              ${hasBeforeImage ? `<div style="margin-bottom: 30px;">
                <h3 style="margin-bottom: 10px; color: #374151;">Before:</h3>
                <img src="${beforeImage}" style="width: 100%; max-width: 500px; border-radius: 8px; border: 3px solid #e5e7eb; display: block;" alt="Your Original ${roomType}" />
              </div>` : ''}
              
              ${hasAfterImage ? `<div style="margin-bottom: 30px;">
                <h3 style="margin-bottom: 10px; color: #059669;">After (AI Generated):</h3>
                <img src="${afterImage}" style="width: 100%; max-width: 500px; border-radius: 8px; border: 3px solid #10b981; display: block;" alt="AI Generated ${selectedStyle || 'Renovation'}" />
              </div>` : ''}
            </div>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #3b82f6;">
              <h4 style="color: #374151; margin-bottom: 10px;">✨ Your Transformation Details:</h4>
              <ul style="color: #6b7280; margin: 0; padding-left: 20px;">
                <li><strong>Room Type:</strong> ${roomType || 'Kitchen'}</li>
                <li><strong>Design Style:</strong> ${selectedStyle || 'Custom'}</li>
                <li><strong>AI Technology:</strong> DALL-E 3 by OpenAI</li>
                <li><strong>Generated:</strong> ${new Date().toLocaleDateString()}</li>
              </ul>
            </div>
            
            <p>Thanks for using MetroWest Home AI!</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">
              This email was sent from MetroWest Home AI<br>
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