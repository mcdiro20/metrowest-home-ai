export interface EmailImageRequest {
  email: string;
  name?: string;
  phone?: string;
  beforeImage: string;
  afterImage: string;
  selectedStyle?: string;
  roomType?: string;
  subscribe?: boolean;
  zipCode?: string;
  designRequestId?: string;
}

export interface EmailResponse {
  success: boolean;
  message: string;
  emailId?: string;
}

export class EmailService {
  static async sendDesignImages(request: EmailImageRequest): Promise<EmailResponse> {
    try {
      // Check if we're in development mode
      const isDevelopment = import.meta.env.DEV;
      
      if (isDevelopment) {
        // Development mode - simulate email sending
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
        
        const result = await response.json();
        return result;
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

  // Method to get sent emails (for admin/demo purposes)
  static getSentEmails(): any[] {
    return JSON.parse(localStorage.getItem('sentEmails') || '[]');
  }
}