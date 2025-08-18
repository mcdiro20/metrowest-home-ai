import { supabase } from '../lib/supabase';
import type { UserEvent } from '../lib/supabase';

export class AnalyticsService {
  // Track user events
  static async trackEvent(
    eventType: 'login' | 'upload' | 'view' | 'share' | 'time_spent' | 'ai_render' | 'email_submit' | 'quote_request',
    metadata?: Record<string, any>
  ): Promise<void> {
    if (!supabase) {
      console.warn('Supabase not configured - analytics disabled');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.warn('No authenticated user - cannot track event');
        return;
      }

      // Update profile metrics for specific events
      if (eventType === 'login') {
        await supabase.rpc('increment_login_count', {
          user_uuid: user.id,
          user_email: user.email || ''
        });
      }
      
      if (eventType === 'ai_render' && metadata?.success) {
        await supabase.rpc('increment_ai_rendering_count', {
          user_uuid: user.id
        });
      }
      
      if (eventType === 'time_spent' && metadata?.time_spent_ms) {
        await supabase.rpc('add_time_on_site', {
          user_uuid: user.id,
          time_spent_ms: metadata.time_spent_ms
        });
      }
      const { error } = await supabase
        .from('user_events')
        .insert({
          user_id: user.id,
          event_type: eventType,
          metadata: metadata || {}
        });

      if (error) {
        console.error('Failed to track event:', error);
      } else {
        console.log(`✅ Tracked event: ${eventType}`);
      }
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  }

  // Track page views
  static async trackPageView(page: string, additionalData?: Record<string, any>): Promise<void> {
    await this.trackEvent('view', {
      page,
      timestamp: new Date().toISOString(),
      ...additionalData
    });
  }

  // Track AI render completion
  static async trackAIRender(
    roomType: string,
    style: string,
    processingTime: number,
    success: boolean
  ): Promise<void> {
    await this.trackEvent('ai_render', {
      room_type: roomType,
      style,
      processing_time_ms: processingTime,
      success,
      timestamp: new Date().toISOString()
    });
  }

  // Track email submissions
  static async trackEmailSubmit(
    roomType: string,
    style: string,
    zipCode: string,
    wantsQuote: boolean
  ): Promise<void> {
    await this.trackEvent('email_submit', {
      room_type: roomType,
      style,
      zip_code: zipCode,
      wants_quote: wantsQuote,
      timestamp: new Date().toISOString()
    });
  }

  // Track time spent on page
  static trackTimeSpent(page: string, startTime: number): void {
    const endTime = Date.now();
    const timeSpent = endTime - startTime;
    
    // Only track if user spent more than 10 seconds on page
    if (timeSpent > 10000) {
      this.trackEvent('time_spent', {
        page,
        time_spent_ms: timeSpent,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Get user analytics (for admin dashboard)
  static async getUserAnalytics(timeRange: '24h' | '7d' | '30d' | '90d' = '7d') {
    if (!supabase) return null;

    const now = new Date();
    const daysAgo = timeRange === '24h' ? 1 : 
                   timeRange === '7d' ? 7 : 
                   timeRange === '30d' ? 30 : 90;
    const startDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));

    try {
      const { data: events, error } = await supabase
        .from('user_events')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch analytics:', error);
        return null;
      }

      return events;
    } catch (error) {
      console.error('Analytics fetch error:', error);
      return null;
    }
  }
}