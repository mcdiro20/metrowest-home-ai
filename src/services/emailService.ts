import { imageStorageService } from './imageStorageService';

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
  userId?: string;
}

export interface EmailResponse {
  success: boolean;
  message: string;
  emailId?: string;
}

export class EmailService {
  static async sendDesignImages(request: EmailImageRequest): Promise<EmailResponse> {
    try {
      const userId = request.userId || `guest-${Date.now()}`;

      let beforeImageUrl = request.beforeImage;
      let afterImageUrl = request.afterImage;

      if (beforeImageUrl?.startsWith('data:image/')) {
        console.log('📤 Uploading before image to Supabase Storage...');
        const uploadedBeforeUrl = await imageStorageService.uploadBase64Image(
          beforeImageUrl,
          userId,
          'before'
        );
        if (uploadedBeforeUrl) {
          beforeImageUrl = uploadedBeforeUrl;
          console.log('✅ Before image uploaded:', uploadedBeforeUrl);
        }
      }

      if (afterImageUrl?.startsWith('http')) {
        console.log('📤 Uploading AI image to Supabase Storage...');
        const uploadedAfterUrl = await imageStorageService.uploadAIImage(
          afterImageUrl,
          userId
        );
        if (uploadedAfterUrl) {
          afterImageUrl = uploadedAfterUrl;
          console.log('✅ AI image uploaded:', uploadedAfterUrl);
        }
      }

      const requestWithStorageUrls = {
        ...request,
        beforeImage: beforeImageUrl,
        afterImage: afterImageUrl
      };

      // Check if we're in development mode
      const isDevelopment = import.meta.env.DEV;
      
      if (isDevelopment) {
        // Development mode - simulate email sending
        const emailId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const emailData = {
          id: emailId,
          recipient: requestWithStorageUrls.email,
          sentAt: new Date().toISOString(),
          roomType: requestWithStorageUrls.roomType,
          selectedStyle: requestWithStorageUrls.selectedStyle,
          subscribe: requestWithStorageUrls.subscribe,
          beforeImageUrl: beforeImageUrl,
          afterImageUrl: afterImageUrl
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
          body: JSON.stringify(requestWithStorageUrls)
        });
        
        if (!response.ok) {
          throw new Error(`Email API failed with status ${response.status}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.message || 'Email sending failed');
        }
        
        return result;
      }
    } catch (error) {
      console.error('Email Service Error:', error);
      return {
        success: false,
        message: `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Method to get sent emails (for admin/demo purposes)
  static getSentEmails(): any[] {
    return JSON.parse(localStorage.getItem('sentEmails') || '[]');
  }
}