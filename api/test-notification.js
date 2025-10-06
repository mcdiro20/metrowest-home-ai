export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('🧪 Testing notification system...');

    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
    const resendApiKey = process.env.RESEND_API_KEY;

    const envStatus = {
      ADMIN_NOTIFICATION_EMAIL: {
        exists: !!adminEmail,
        value: adminEmail || 'NOT SET',
        length: adminEmail?.length || 0
      },
      RESEND_API_KEY: {
        exists: !!resendApiKey,
        value: resendApiKey ? `${resendApiKey.substring(0, 10)}...` : 'NOT SET',
        length: resendApiKey?.length || 0,
        startsWithRe: resendApiKey?.startsWith('re_') || false
      }
    };

    console.log('📋 Environment Variables:', envStatus);

    if (!adminEmail) {
      return res.status(200).json({
        success: false,
        message: 'ADMIN_NOTIFICATION_EMAIL is not set',
        envStatus
      });
    }

    if (!resendApiKey) {
      return res.status(200).json({
        success: false,
        message: 'RESEND_API_KEY is not set',
        envStatus
      });
    }

    // Try to send a test email
    console.log('📧 Attempting to send test email...');

    const { Resend } = await import('resend');
    const resend = new Resend(resendApiKey);

    const testEmailData = {
      from: 'MetroWest Home AI Notifications <onboarding@resend.dev>',
      to: [adminEmail],
      subject: '🧪 Test Notification - System Check',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb;">🧪 Notification System Test</h1>
          <p>This is a test notification to verify your admin notification system is working correctly.</p>

          <div style="background: #f0fdf4; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h2 style="color: #059669;">✅ Success!</h2>
            <p>If you're reading this, your notification system is configured correctly and working!</p>
          </div>

          <div style="background: #f8fafc; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3>Configuration Details:</h3>
            <ul>
              <li><strong>Admin Email:</strong> ${adminEmail}</li>
              <li><strong>API Key:</strong> ${resendApiKey.substring(0, 10)}...</li>
              <li><strong>Timestamp:</strong> ${new Date().toISOString()}</li>
            </ul>
          </div>

          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            This was a test email sent from your MetroWest Home AI application.
          </p>
        </div>
      `
    };

    console.log('📤 Sending to:', adminEmail);

    const result = await resend.emails.send(testEmailData);

    console.log('✅ Email sent successfully:', result);

    return res.status(200).json({
      success: true,
      message: 'Test notification sent successfully!',
      emailId: result.data?.id,
      sentTo: adminEmail,
      envStatus
    });

  } catch (error) {
    console.error('❌ Test notification error:', error);

    return res.status(500).json({
      success: false,
      message: 'Test notification failed',
      error: error.message,
      stack: error.stack,
      envStatus: {
        ADMIN_NOTIFICATION_EMAIL: !!process.env.ADMIN_NOTIFICATION_EMAIL,
        RESEND_API_KEY: !!process.env.RESEND_API_KEY
      }
    });
  }
}
