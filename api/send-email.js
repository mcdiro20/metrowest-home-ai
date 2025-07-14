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

    // Debug environment variables extensively
    console.log('🔍 ALL Environment Variables:');
    console.log('🔍 process.env keys:', Object.keys(process.env));
    console.log('🔍 NODE_ENV:', process.env.NODE_ENV);
    console.log('🔍 VERCEL:', process.env.VERCEL);
    console.log('🔍 VERCEL_ENV:', process.env.VERCEL_ENV);
    
    // Check for different possible env var names
    console.log('🔍 RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'EXISTS' : 'MISSING');
    console.log('🔍 VITE_RESEND_API_KEY:', process.env.VITE_RESEND_API_KEY ? 'EXISTS' : 'MISSING');
    console.log('🔍 NEXT_PUBLIC_RESEND_API_KEY:', process.env.NEXT_PUBLIC_RESEND_API_KEY ? 'EXISTS' : 'MISSING');
    
    console.log('🔍 VITE_OPENAI_API_KEY:', process.env.VITE_OPENAI_API_KEY ? 'EXISTS' : 'MISSING');
    console.log('🔍 OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'EXISTS' : 'MISSING');

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
            
            <div style="display: flex; gap: 20px; margin: 20px 0; flex-wrap: wrap;">
              ${beforeImage ? `<div style="flex: 1; min-width: 250px;">
                <h3 style="margin-bottom: 10px; color: #374151;">Before:</h3>
                <img src="${beforeImage}" style="width: 100%; max-width: 300px; border-radius: 8px; border: 2px solid #e5e7eb;" alt="Before" />
              </div>` : ''}
              
              ${afterImage ? `<div style="flex: 1; min-width: 250px;">
                <h3 style="margin-bottom: 10px; color: #059669;">After (AI Generated):</h3>
                <img src="${afterImage}" style="width: 100%; max-width: 300px; border-radius: 8px; border: 2px solid #10b981;" alt="After" />
              </div>` : ''}
            </div>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Before:</h3>
              <img src="${beforeImage}" style="max-width: 300px; border-radius: 8px;" alt="Before" />
            </div>
            
            ${afterImage ? `<div style="margin: 20px 0;">
              <h3>After (AI Generated):</h3>
              <img src="${afterImage}" style="max-width: 300px; border-radius: 8px;" alt="After" />
            </div>` : ''}
              <h4 style="color: #374151; margin-bottom: 10px;">✨ Your Transformation Details:</h4>
              <ul style="color: #6b7280; margin: 0; padding-left: 20px;">
                <li><strong>Room Type:</strong> ${roomType || 'Kitchen'}</li>
                <li><strong>Design Style:</strong> ${selectedStyle || 'Custom'}</li>
                <li><strong>AI Technology:</strong> DALL-E 3 by OpenAI</li>
              </ul>
            </div>
            
            <div style="background: linear-gradient(135deg, #3b82f6, #10b981); color: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <h3 style="margin: 0 0 10px 0;">Ready to Make This Real?</h3>
              <p style="margin: 0; opacity: 0.9;">Connect with trusted MetroWest contractors to bring your AI design to life!</p>
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
        emailId: emailResult.data?.id || 'sent'
      });

    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError.message);
      console.error('❌ Full error:', emailError);
      
      // Fallback to simulation if email fails
      return res.status(200).json({
        success: true,
        message: 'Email simulated (send failed)',
        emailId: \`sim_${Date.now()}`,
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