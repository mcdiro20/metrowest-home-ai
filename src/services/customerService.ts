import { supabase } from '../lib/supabase';
import type { Customer, DesignRequest, QuoteRequest } from '../lib/supabase';

export class CustomerService {
  // Create or get existing customer
  static async createOrGetCustomer(email: string, zipCode: string): Promise<Customer> {
    try {
      // First, try to get existing customer
      const { data: existingCustomer, error: fetchError } = await supabase
        .from('customers')
        .select('*')
        .eq('email', email)
        .single();

      if (existingCustomer && !fetchError) {
        console.log('✅ Found existing customer:', existingCustomer.email);
        return existingCustomer;
      }

      // Create new customer
      const { data: newCustomer, error: createError } = await supabase
        .from('customers')
        .insert({
          email,
          zip_code: zipCode,
          newsletter_subscribed: false,
          total_designs: 0
        })
        .select()
        .single();

      if (createError) {
        throw new Error(`Failed to create customer: ${createError.message}`);
      }

      console.log('✅ Created new customer:', newCustomer.email);
      return newCustomer;
    } catch (error) {
      console.error('❌ Customer service error:', error);
      throw error;
    }
  }

  // Update newsletter subscription
  static async updateNewsletterSubscription(customerId: string, subscribed: boolean): Promise<void> {
    try {
      const { error } = await supabase
        .from('customers')
        .update({ newsletter_subscribed: subscribed })
        .eq('id', customerId);

      if (error) {
        throw new Error(`Failed to update subscription: ${error.message}`);
      }

      console.log('✅ Updated newsletter subscription:', subscribed);
    } catch (error) {
      console.error('❌ Newsletter subscription error:', error);
      throw error;
    }
  }

  // Increment design count
  static async incrementDesignCount(customerId: string): Promise<void> {
    try {
      const { error } = await supabase
        .rpc('increment_design_count', { customer_id: customerId });

      if (error) {
        throw new Error(`Failed to increment design count: ${error.message}`);
      }

      console.log('✅ Incremented design count for customer');
    } catch (error) {
      console.error('❌ Design count increment error:', error);
      // Don't throw - this is not critical
    }
  }

  // Save design request
  static async saveDesignRequest(
    customerId: string,
    roomType: string,
    selectedStyle?: string,
    originalImageUrl?: string,
    generatedImageUrl?: string,
    aiPrompt?: string,
    processingTime?: number
  ): Promise<DesignRequest> {
    try {
      const { data: designRequest, error } = await supabase
        .from('design_requests')
        .insert({
          customer_id: customerId,
          room_type: roomType,
          selected_style: selectedStyle,
          original_image_url: originalImageUrl,
          generated_image_url: generatedImageUrl,
          ai_prompt: aiPrompt,
          processing_time: processingTime || 0
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to save design request: ${error.message}`);
      }

      console.log('✅ Saved design request:', designRequest.id);
      
      // Increment customer's design count
      await this.incrementDesignCount(customerId);
      
      return designRequest;
    } catch (error) {
      console.error('❌ Design request save error:', error);
      throw error;
    }
  }

  // Save quote request
  static async saveQuoteRequest(
    customerId: string,
    designRequestId: string | undefined,
    projectType: string,
    timeline: string,
    budgetRange: string,
    contactMethod: string,
    notes?: string
  ): Promise<QuoteRequest> {
    try {
      const { data: quoteRequest, error } = await supabase
        .from('quote_requests')
        .insert({
          customer_id: customerId,
          design_request_id: designRequestId,
          project_type: projectType,
          timeline: timeline,
          budget_range: budgetRange,
          contact_method: contactMethod,
          notes: notes,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to save quote request: ${error.message}`);
      }

      console.log('✅ Saved quote request:', quoteRequest.id);
      return quoteRequest;
    } catch (error) {
      console.error('❌ Quote request save error:', error);
      throw error;
    }
  }

  // Get newsletter subscribers
  static async getNewsletterSubscribers(): Promise<Customer[]> {
    try {
      const { data: subscribers, error } = await supabase
        .from('customers')
        .select('*')
        .eq('newsletter_subscribed', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get subscribers: ${error.message}`);
      }

      return subscribers || [];
    } catch (error) {
      console.error('❌ Get subscribers error:', error);
      throw error;
    }
  }

  // Get customer analytics
  static async getCustomerAnalytics() {
    try {
      const { data: analytics, error } = await supabase
        .rpc('get_customer_analytics');

      if (error) {
        throw new Error(`Failed to get analytics: ${error.message}`);
      }

      return analytics;
    } catch (error) {
      console.error('❌ Analytics error:', error);
      return {
        total_customers: 0,
        total_designs: 0,
        newsletter_subscribers: 0,
        recent_activity: []
      };
    }
  }
}