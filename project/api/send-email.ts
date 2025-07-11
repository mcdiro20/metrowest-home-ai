import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { email, beforeImage, afterImage, selectedStyle, roomType, subscribe } = await request.json();

    // Validate required fields
    if (!email || !afterImage) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create email HTML template
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your AI-Generated Design is Ready!</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white; 
          }
          .header { 
            background: linear-gradient(135deg, #2563eb, #059669); 
            color: white; 
            padding: 40px 30px; 
            text-align: center; 
          }
          .header h1 { 
            margin: 0 0 10px 0; 
            font-size: 28px; 
            font-weight: bold; 
          }
          .content { 
            padding: 40px 30px; 
            background: #ffffff; 
          }
          .image-comparison { 
            display: flex; 
            gap: 20px; 
            margin: 30px 0; 
            justify-content: center; 
          }
          .image-box { 
            flex: 1; 
            text-align: center; 
            max-width: 250px; 
          }
          .image-box img { 
            width: 100%; 
            height: 200px; 
            object-fit: cover; 
            border-radius: 12px; 
            box-shadow: 0 8px 25px rgba(0,0,0,0.15); 
          }
          .image-label { 
            margin-top: 12px; 
            font-weight: 600; 
            font-size: 14px; 
            color: #374151; 
          }
          .cta-button { 
            display: inline-block; 
            background: linear-gradient(135deg, #2563eb, #059669); 
            color: white; 
            padding: 16px 32px; 
            text-decoration: none; 
            border-radius: 12px; 
            margin: 30px 0; 
            font-weight: 600; 
            font-size: 16px; 
          }
          .footer { 
            background: #f9fafb; 
            padding: 30px; 
            text-align: center; 
            border-top: 1px solid #e5e7eb; 
          }
          .footer p { 
            margin: 5px 0; 
            color: #6b7280; 
            font-size: 14px; 
          }
          @media (max-width: 600px) {
            .image-comparison { flex-direction: column; align-items: center; }
            .image-box { max-width: 300px; }
          }
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
            <p>Your AI-generated <strong>${roomType}</strong> transformation in <strong>${selectedStyle}</strong> style is complete!</p>
            
            <div class="image-comparison">
              ${beforeImage ? `
                <div class="image-box">
                  <img src="${beforeImage}" alt="Before" />
                  <div class="image-label">Before</div>
                </div>
              ` : ''}
              <div class="image-box">
                <img src="${afterImage}" alt="After - AI Generated" />
                <div class="image-label">After (AI Generated)</div>
              </div>
            </div>
            
            <p>Love what you see? Connect with local MetroWest contractors to bring this vision to life!</p>
            
            <div style="text-align: center;">
              <a href="https://metrowesthome.ai/contractors" class="cta-button">Get Free Quotes from Local Contractors</a>
            </div>
            
            <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280;">
              This email was sent to ${email}. The images above are AI-generated concepts based on your uploaded photo.
            </p>
          </div>
          
          <div class="footer">
            <p><strong>&copy; 2024 MetroWest Home AI</strong></p>
            <p>Exclusively for MetroWest Massachusetts</p>
            <p>Transform your space with AI technology</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: 'MetroWest Home AI <noreply@metrowesthome.ai>',
      to: [email],
      subject: `🏠 Your ${selectedStyle} ${roomType} design is ready!`,
      html: emailHtml,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to send email' },
        { status: 500 }
      );
    }

    // Handle newsletter subscription
    if (subscribe) {
      // In production, you'd save this to your database
      console.log(`Newsletter subscription: ${email}`);
    }

    // Log successful email for analytics
    console.log(`Email sent successfully to ${email}`, { 
      emailId: data?.id,
      roomType,
      selectedStyle 
    });

    return NextResponse.json({
      success: true,
      message: 'Design images sent successfully! Check your inbox.',
      emailId: data?.id
    });

  } catch (error) {
    console.error('Email API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle CORS for development
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}