import { supabase } from '../lib/supabase';

type EventType =
  | 'page_view'
  | 'login'
  | 'signup'
  | 'logout'
  | 'ai_render_start'
  | 'ai_render_complete'
  | 'ai_render_error'
  | 'upload'
  | 'email_submit'
  | 'quote_request'
  | 'share'
  | 'download'
  | 'style_selection'
  | 'room_selection'
  | 'time_spent';

type EventCategory = 'engagement' | 'conversion' | 'technical' | 'navigation';

export class AnalyticsService {
  private static sessionId: string | null = null;

  private static getSessionId(): string {
    if (!this.sessionId) {
      this.sessionId = sessionStorage.getItem('analytics_session_id');
      if (!this.sessionId) {
        this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        sessionStorage.setItem('analytics_session_id', this.sessionId);
      }
    }
    return this.sessionId;
  }

  private static getEventCategory(eventType: EventType): EventCategory {
    const categoryMap: Record<EventType, EventCategory> = {
      page_view: 'navigation',
      login: 'engagement',
      signup: 'conversion',
      logout: 'engagement',
      ai_render_start: 'engagement',
      ai_render_complete: 'conversion',
      ai_render_error: 'technical',
      upload: 'engagement',
      email_submit: 'conversion',
      quote_request: 'conversion',
      share: 'engagement',
      download: 'engagement',
      style_selection: 'engagement',
      room_selection: 'engagement',
      time_spent: 'engagement'
    };
    return categoryMap[eventType];
  }

  static async trackEvent(
    eventType: EventType,
    metadata?: Record<string, any>
  ): Promise<void> {
    if (!supabase) {
      console.warn('Supabase not configured - analytics disabled');
      return;
    }

    try {
      const sessionId = this.getSessionId();
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || null;

      const eventCategory = this.getEventCategory(eventType);

      if (userId) {
        if (eventType === 'login') {
          await supabase.rpc('increment_login_count', {
            user_uuid: userId,
            user_email: user.email || ''
          });
        }

        if (eventType === 'ai_render_complete') {
          await supabase.rpc('increment_ai_rendering_count', {
            user_uuid: userId
          });
        }

        if (eventType === 'time_spent' && metadata?.time_spent_ms) {
          await supabase.rpc('add_time_on_site', {
            user_uuid: userId,
            time_spent_ms: metadata.time_spent_ms
          });
        }
      }

      const { error } = await supabase
        .from('user_events')
        .insert({
          user_id: userId,
          session_id: sessionId,
          event_type: eventType,
          event_category: eventCategory,
          metadata: metadata || {},
          user_agent: navigator.userAgent
        });

      if (userId || sessionId) {
        await supabase.rpc('update_session_activity', {
          p_session_id: sessionId,
          p_user_id: userId
        });
      }

      if (error) {
        console.error('Failed to track event:', error);
      }
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  }

  static async trackPageView(page: string, additionalData?: Record<string, any>): Promise<void> {
    await this.trackEvent('page_view', {
      page,
      referrer: document.referrer,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      ...additionalData
    });
  }

  static async trackAIRenderStart(roomType: string, style: string): Promise<void> {
    await this.trackEvent('ai_render_start', {
      room_type: roomType,
      style,
      timestamp: new Date().toISOString()
    });
  }

  static async trackAIRenderComplete(
    roomType: string,
    style: string,
    processingTime: number
  ): Promise<void> {
    await this.trackEvent('ai_render_complete', {
      room_type: roomType,
      style,
      processing_time_ms: processingTime,
      timestamp: new Date().toISOString()
    });
  }

  static async trackAIRenderError(
    roomType: string,
    style: string,
    errorMessage: string
  ): Promise<void> {
    await this.trackEvent('ai_render_error', {
      room_type: roomType,
      style,
      error: errorMessage,
      timestamp: new Date().toISOString()
    });
  }

  static async trackUpload(fileSize: number, fileType: string): Promise<void> {
    await this.trackEvent('upload', {
      file_size: fileSize,
      file_type: fileType,
      timestamp: new Date().toISOString()
    });
  }

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

  static async trackQuoteRequest(details: Record<string, any>): Promise<void> {
    await this.trackEvent('quote_request', {
      ...details,
      timestamp: new Date().toISOString()
    });
  }

  static async trackStyleSelection(style: string): Promise<void> {
    await this.trackEvent('style_selection', {
      style,
      timestamp: new Date().toISOString()
    });
  }

  static async trackRoomSelection(roomType: string): Promise<void> {
    await this.trackEvent('room_selection', {
      room_type: roomType,
      timestamp: new Date().toISOString()
    });
  }

  static trackTimeSpent(page: string, startTime: number): void {
    const endTime = Date.now();
    const timeSpent = endTime - startTime;

    if (timeSpent > 10000) {
      this.trackEvent('time_spent', {
        page,
        time_spent_ms: timeSpent,
        duration_seconds: Math.floor(timeSpent / 1000),
        timestamp: new Date().toISOString()
      });
    }
  }

  static async getRealtimeActivity() {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase.rpc('get_realtime_activity');

      if (error) {
        console.error('Failed to fetch realtime activity:', error);
        return null;
      }

      return data?.[0] || null;
    } catch (error) {
      console.error('Realtime activity fetch error:', error);
      return null;
    }
  }

  static async getDailyAnalytics(days: number = 30, startDate?: string, endDate?: string) {
    if (!supabase) return null;

    try {
      let query = supabase
        .from('daily_analytics_summary')
        .select('*');

      if (startDate && endDate) {
        query = query.gte('date', startDate).lte('date', endDate);
      } else if (startDate) {
        query = query.gte('date', startDate);
      } else if (endDate) {
        query = query.lte('date', endDate);
      } else {
        const calculatedStartDate = new Date();
        calculatedStartDate.setDate(calculatedStartDate.getDate() - days);
        query = query.gte('date', calculatedStartDate.toISOString().split('T')[0]);
      }

      const { data, error } = await query.order('date', { ascending: false });

      if (error) {
        console.error('Failed to fetch daily analytics:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Daily analytics fetch error:', error);
      return null;
    }
  }

  static async getRecentEvents(limit: number = 50, startDate?: string, endDate?: string) {
    if (!supabase) return null;

    try {
      let query = supabase
        .from('user_events')
        .select('*');

      if (startDate && endDate) {
        const startDateTime = new Date(startDate).toISOString();
        const endDateTime = new Date(endDate + 'T23:59:59.999Z').toISOString();
        query = query.gte('created_at', startDateTime).lte('created_at', endDateTime);
      } else if (startDate) {
        query = query.gte('created_at', new Date(startDate).toISOString());
      } else if (endDate) {
        query = query.lte('created_at', new Date(endDate + 'T23:59:59.999Z').toISOString());
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Failed to fetch recent events:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Recent events fetch error:', error);
      return null;
    }
  }

  static async getEventsByType(eventType: EventType, limit: number = 100) {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('user_events')
        .select('*')
        .eq('event_type', eventType)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Failed to fetch events by type:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Events by type fetch error:', error);
      return null;
    }
  }

  static async refreshDailyAnalytics(date?: string) {
    if (!supabase) return;

    try {
      const targetDate = date || new Date().toISOString().split('T')[0];
      await supabase.rpc('refresh_daily_analytics', {
        summary_date: targetDate
      });
    } catch (error) {
      console.error('Failed to refresh daily analytics:', error);
    }
  }

  static async getActiveSessions() {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('active_sessions')
        .select('*')
        .eq('is_active', true)
        .order('last_activity_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch active sessions:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Active sessions fetch error:', error);
      return null;
    }
  }
}