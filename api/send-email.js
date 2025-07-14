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
    const { email, beforeImage, afterImage, selectedStyle, roomType, subscribe } = req.body;

    console.log('📧 Email request received for:', email);
    console.log('📧 Before image length:', beforeImage?.length || 'undefined');
    console.log('📧 After image URL:', afterImage);
    console.log('📧 Selected style:', selectedStyle);
    console.log('📧 Room type:', roomType);
    console.log('📧 Subscribe:', subscribe);

    // Basic validation
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }

    // Check if we have Resend API key
    if (!process.env.RESEND_API_KEY) {
      console.log('⚠️ No Resend API key found in environment variables');
      console.log('⚠️ Available env vars:', Object.keys(process.env).filter(key => key.includes('RESEND')));
      return res.status(200).json({
        success: true,
        message: 'Email simulated (no API key configured)',
        emailId: `sim_${Date.now()}`
      });
    }

    // Try to send real email using dynamic import
    try {
      console.log('📤 Attempting to send real email with Resend...');
      console.log('📤 API key starts with:', process.env.RESEND_API_KEY?.substring(0, 10) + '...');
      
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);

      const emailResult = await resend.emails.send({
        from: 'MetroWest Home AI <onboarding@resend.dev>',
        to: [email],
        subject: 'Your AI-Generated Design is Ready!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Your AI Design is Ready!</h1>
            <p>Hello!</p>
            <p>Your AI-generated <strong>${roomType || 'space'}</strong> transformation in <strong>${selectedStyle || 'custom'}</strong> style is complete!</p>
            
            ${beforeImage ? `<div style="margin: 20px 0;">
              <h3>Before:</h3>
              <img src="${beforeImage}" style="max-width: 300px; border-radius: 8px;" alt="Before" />
            </div>` : ''}
            
            ${afterImage ? `<div style="margin: 20px 0;">
              <h3>After (AI Generated):</h3>
              <img src="${afterImage}" style="max-width: 300px; border-radius: 8px;" alt="After" />
            </div>` : ''}
            
            <p>Thanks for using MetroWest Home AI!</p>
            <p style="color: #666; font-size: 12px;">This email was sent from MetroWest Home AI</p>
          </div>
        `,
      });

      console.log('✅ Email sent successfully! ID:', emailResult.data?.id);

      return res.status(200).json({
        success: true,
        message: 'Email sent successfully!',
        emailId: emailResult.data?.id || 'sent'
      });

    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError.message);
      console.error('❌ Full error:', emailError);
      
      // Fallback to simulation if email fails
      return res.status(200).json({
        success: true,
        message: 'Email simulated (send failed)',
        emailId: `sim_${Date.now()}`,
        error: emailError.message
      });
    }

  } catch (error) {
    console.error('💥 Function error:', error.message);
    console.error('💥 Full error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}