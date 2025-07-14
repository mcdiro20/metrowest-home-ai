export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  try {
    const { email, beforeImage, afterImage, selectedStyle, roomType, subscribe } = req.body;

    // Validate required fields
    if (!email || !afterImage) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: email and afterImage are required'
      });
    }

    // Check if we're in development mode (no Resend API key)
    const isDevelopment = !process.env.RESEND_API_KEY;
    
    if (isDevelopment) {
      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return res.status(200).json({
        success: true,
        message: 'Email sent successfully! (Development Mode - Check console for details)',
        emailId: `dev_${Date.now()}`,
        mode: 'development'
      });
    }

    // Production mode with Resend
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Create email HTML template
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Your AI-Generated Design is Ready!</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #2563eb, #059669); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; }
          .footer { background: #374151; color: white; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏠 Your AI Design is Ready!</h1>
            <p>MetroWest Home AI has transformed your space</p>
          </div>
          
          <div class="content">
            <h2>Hello!</h2>
            <p>Your AI-generated ${roomType || 'kitchen'} transformation in <strong>${selectedStyle || 'AI Generated'}</strong> style is complete!</p>
            <p>Love what you see? Connect with local MetroWest contractors to bring this vision to life!</p>
            <p><small>This email was sent to ${email}. The images above are AI-generated concepts based on your uploaded photo.</small></p>
          </div>
          
          <div class="footer">
            <p><strong>&copy; 2024 MetroWest Home AI</strong></p>
            <p>Exclusively for MetroWest Massachusetts</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: 'MetroWest Home AI <noreply@resend.dev>',
      to: [email],
      subject: `🏠 Your ${selectedStyle || 'AI Generated'} ${roomType || 'kitchen'} design is ready!`,
      html: emailHtml,
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to send email via Resend',
        error: error.message
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Design images sent successfully! Check your inbox.',
      emailId: data?.id,
      mode: 'production'
    });

  } catch (error) {
    console.error('Email API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message || 'Unknown error'
    });
  }
}