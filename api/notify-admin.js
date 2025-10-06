export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const {
      event_type,
      user_email,
      user_name,
      user_phone,
      zip_code,
      room_type,
      style,
      lead_score,
      timestamp
    } = req.body;

    console.log('📬 Admin notification request received:', {
      event_type,
      user_email,
      has_name: !!user_name,
      has_phone: !!user_phone,
      zip_code
    });

    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
    const resendApiKey = process.env.RESEND_API_KEY;

    console.log('🔑 Environment check:', {
      hasAdminEmail: !!adminEmail,
      hasResendKey: !!resendApiKey,
      adminEmail: adminEmail || 'not set'
    });

    if (!adminEmail) {
      console.log('⚠️ No ADMIN_NOTIFICATION_EMAIL configured');
      return res.status(200).json({
        success: true,
        message: 'Notification skipped (no admin email configured)',
        notificationId: `skipped_${Date.now()}`
      });
    }

    if (!resendApiKey) {
      console.log('⚠️ No Resend API key - notification simulated');
      return res.status(200).json({
        success: true,
        message: 'Notification simulated (no API key configured)',
        notificationId: `sim_${Date.now()}`
      });
    }

    const { Resend } = await import('resend');
    const resend = new Resend(resendApiKey);

    let subject = '';
    let htmlContent = '';

    if (event_type === 'ai_rendering') {
      subject = `🎨 New AI Rendering - ${user_name || user_email || 'Unknown User'}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb;">🎨 New AI Rendering Generated</h1>

          <div style="background: #f8fafc; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h2 style="color: #333; margin-top: 0;">User Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Name:</td>
                <td style="padding: 8px 0; color: #333;">${user_name || 'Not provided'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Email:</td>
                <td style="padding: 8px 0; color: #333;">${user_email || 'Not provided'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Phone:</td>
                <td style="padding: 8px 0; color: #333;">${user_phone || 'Not provided'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Zip Code:</td>
                <td style="padding: 8px 0; color: #333;">${zip_code || 'Not provided'}</td>
              </tr>
            </table>
          </div>

          <div style="background: #f0fdf4; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h2 style="color: #333; margin-top: 0;">Project Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Room Type:</td>
                <td style="padding: 8px 0; color: #333;">${room_type || 'Not specified'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Style:</td>
                <td style="padding: 8px 0; color: #333;">${style || 'Not specified'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Lead Score:</td>
                <td style="padding: 8px 0; color: #333;">${lead_score ? `${lead_score}/100` : 'Not calculated'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Time:</td>
                <td style="padding: 8px 0; color: #333;">${new Date(timestamp || Date.now()).toLocaleString()}</td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:5173'}/admin"
               style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View in Admin Dashboard
            </a>
          </div>
        </div>
      `;
    } else if (event_type === 'contractor_form') {
      subject = `📋 New Contractor Quote Request - ${user_name || user_email || 'Unknown User'}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #059669;">📋 New Contractor Quote Request</h1>

          <div style="background: #fef3c7; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <h2 style="color: #92400e; margin-top: 0;">🔥 Hot Lead!</h2>
            <p style="color: #78350f; margin: 0;">This user is actively seeking quotes from contractors.</p>
          </div>

          <div style="background: #f8fafc; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h2 style="color: #333; margin-top: 0;">Contact Information</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Name:</td>
                <td style="padding: 8px 0; color: #333;">${user_name || 'Not provided'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Email:</td>
                <td style="padding: 8px 0; color: #333;">${user_email || 'Not provided'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Phone:</td>
                <td style="padding: 8px 0; color: #333;">${user_phone || 'Not provided'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Zip Code:</td>
                <td style="padding: 8px 0; color: #333;">${zip_code || 'Not provided'}</td>
              </tr>
            </table>
          </div>

          <div style="background: #f0fdf4; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h2 style="color: #333; margin-top: 0;">Project Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Room Type:</td>
                <td style="padding: 8px 0; color: #333;">${room_type || 'Not specified'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Style:</td>
                <td style="padding: 8px 0; color: #333;">${style || 'Not specified'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Lead Score:</td>
                <td style="padding: 8px 0; color: #333;">${lead_score ? `${lead_score}/100` : 'Not calculated'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Time:</td>
                <td style="padding: 8px 0; color: #333;">${new Date(timestamp || Date.now()).toLocaleString()}</td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:5173'}/admin"
               style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Assign to Contractor
            </a>
          </div>
        </div>
      `;
    }

    const emailResult = await resend.emails.send({
      from: 'MetroWest Home AI Notifications <onboarding@resend.dev>',
      to: [adminEmail],
      subject: subject,
      html: htmlContent
    });

    console.log(`✅ Admin notification sent: ${event_type}`);

    return res.status(200).json({
      success: true,
      message: 'Admin notification sent successfully',
      notificationId: emailResult.data?.id || 'sent'
    });

  } catch (error) {
    console.error('Admin notification error:', error);
    return res.status(200).json({
      success: true,
      message: 'Notification processed (fallback mode)',
      notificationId: `fallback_${Date.now()}`
    });
  }
}
