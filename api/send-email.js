import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, beforeImage, afterImage, selectedStyle, roomType, subscribe } = req.body;

    if (!email || !beforeImage || !afterImage) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    // Generate email HTML
    const emailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your AI-Generated Design is Ready!</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #2563eb, #059669); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; }
          .image-comparison { display: flex; gap: 10px; margin: 20px 0; }
          .image-box { flex: 1; text-align: center; }
          .image-box img { width: 100%; max-width: 250px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .image-label { margin-top: 10px; font-weight: bold; }
          .cta-button { display: inline-block; background: linear-gradient(135deg, #2563eb, #059669); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
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
            <p>Your AI-generated ${roomType || 'space'} transformation in <strong>${selectedStyle || 'custom'}</strong> style is complete!</p>
            
            <div class="image-comparison">
              <div class="image-box">
                <img src="${beforeImage}" alt="Before" />
                <div class="image-label">Before</div>
              </div>
              <div class="image-box">
                <img src="${afterImage}" alt="After - AI Generated" />
                <div class="image-label">After (AI Generated)</div>
              </div>
            </div>
            
            <p>Love what you see? Connect with local MetroWest contractors to bring this vision to life!</p>
            
            <a href="https://your-site.vercel.app" class="cta-button">Get Free Quotes from Local Contractors</a>
            
            <p><small>This email was sent to ${email}. The images above are AI-generated concepts based on your uploaded photo.</small></p>
          </div>
          
          <div class="footer">
            <p>&copy; 2024 MetroWest Home AI | Exclusively for MetroWest Massachusetts</p>
            <p>Transform your space with AI technology</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email using Resend
    const emailResult = await resend.emails.send({
      from: 'MetroWest Home AI <noreply@yourdomain.com>',
      to: [email],
      subject: '🏠 Your AI-Generated Design is Ready!',
      html: emailHTML,
    });

    // Handle newsletter subscription
    if (subscribe) {
      // You can add newsletter subscription logic here
      console.log(`Newsletter subscription for: ${email}`);
    }

    return res.status(200).json({
      success: true,
      message: 'Design images sent successfully!',
      emailId: emailResult.data?.id || 'email_sent'
    });

  } catch (error) {
    console.error('Email sending error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send email. Please try again.',
      error: error.message
    });
  }
}