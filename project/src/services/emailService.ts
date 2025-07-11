export interface EmailImageRequest {
  email: string;
  beforeImage: string;
  afterImage: string;
  selectedStyle?: string;
  roomType?: string;
  subscribe?: boolean;
}

export interface EmailResponse {
  success: boolean;
  message: string;
  emailId?: string;
}

export class EmailService {
  static async sendDesignImages(request: EmailImageRequest): Promise<EmailResponse> {
    try {
      // Check if we're in development mode first
      const isDevelopment = import.meta.env.DEV;
      
      if (isDevelopment) {
        // Development mode - simulate email sending without any fetch calls
        const emailId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const emailData = {
          id: emailId,
          recipient: request.email,
          sentAt: new Date().toISOString(),
          roomType: request.roomType,
          selectedStyle: request.selectedStyle,
          subscribe: request.subscribe,
          beforeImageUrl: request.beforeImage,
          afterImageUrl: request.afterImage
        };
        
        console.log('📧 Development Mode: Simulating email send with data:', emailData);
        
        // Store email data locally for testing
        const sentEmails = JSON.parse(localStorage.getItem('sentEmails') || '[]');
        const emailRecord = {
          ...emailData,
          id: Date.now().toString(),
          sentAt: new Date().toISOString(),
          status: 'sent'
        };
        sentEmails.push(emailRecord);
        localStorage.setItem('sentEmails', JSON.stringify(sentEmails));
        
        // Simulate realistic network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return {
          success: true,
          message: 'Design images sent successfully! (Development Mode)',
          emailId: emailRecord.id
        };
      } else {
        // Production mode - use actual API endpoint
        const response = await fetch('/api/send-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(request)
        });
        return await response.json();
      }
    } catch (error) {
      console.error('Email Service Error:', error);
      return {
        success: false,
        message: 'Failed to send email. Please try again.',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private static addToNewsletter(email: string) {
    const subscribers = JSON.parse(localStorage.getItem('newsletterSubscribers') || '[]');
    if (!subscribers.includes(email)) {
      subscribers.push(email);
      localStorage.setItem('newsletterSubscribers', JSON.stringify(subscribers));
    }
  }

  // Method to get sent emails (for admin/demo purposes)
  static getSentEmails(): any[] {
    return JSON.parse(localStorage.getItem('sentEmails') || '[]');
  }

  // Method to simulate backend email template
  static generateEmailHTML(request: EmailImageRequest): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your AI-Generated Design is Ready!</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
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
            <p>Your AI-generated ${request.roomType} transformation in <strong>${request.selectedStyle}</strong> style is complete!</p>
            
            <div class="image-comparison">
              <div class="image-box">
                <img src="${request.beforeImage}" alt="Before" />
                <div class="image-label">Before</div>
              </div>
              <div class="image-box">
                <img src="${request.afterImage}" alt="After - AI Generated" />
                <div class="image-label">After (AI Generated)</div>
              </div>
            </div>
            
            <p>Love what you see? Connect with local MetroWest contractors to bring this vision to life!</p>
            
            <a href="#" class="cta-button">Get Free Quotes from Local Contractors</a>
            
            <p><small>This email was sent to ${request.email}. The images above are AI-generated concepts based on your uploaded photo.</small></p>
          </div>
          
          <div class="footer">
            <p>&copy; 2024 MetroWest Home AI | Exclusively for MetroWest Massachusetts</p>
            <p>Transform your space with AI technology</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}