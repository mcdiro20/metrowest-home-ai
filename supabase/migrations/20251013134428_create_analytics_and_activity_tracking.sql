/*
  # Analytics and Activity Tracking System

  ## Overview
  Comprehensive activity tracking system to monitor user behavior, site visits, logins, 
  AI renderings, and other key events for the admin dashboard.

  ## 1. New Tables
  
  ### `user_events` - Main event tracking table
  - `id` (uuid, primary key) - Unique event identifier
  - `user_id` (uuid, nullable) - Reference to auth.users for authenticated events
  - `session_id` (text) - Browser session identifier for anonymous tracking
  - `event_type` (text) - Type of event (login, page_view, ai_render, etc.)
  - `event_category` (text) - Category grouping (engagement, conversion, technical)
  - `metadata` (jsonb) - Flexible storage for event-specific data
  - `ip_address` (text) - User IP for location tracking
  - `user_agent` (text) - Browser/device information
  - `created_at` (timestamptz) - Event timestamp
  
  ### `daily_analytics_summary` - Aggregated daily metrics
  - `id` (uuid, primary key)
  - `date` (date) - The date for this summary
  - `total_visits` (integer) - Total page visits
  - `unique_visitors` (integer) - Unique users/sessions
  - `total_logins` (integer) - Login events
  - `total_signups` (integer) - New user registrations
  - `total_ai_renders` (integer) - AI generation requests
  - `successful_renders` (integer) - Successful AI generations
  - `failed_renders` (integer) - Failed AI generations
  - `total_quote_requests` (integer) - Quote requests submitted
  - `total_email_submits` (integer) - Email form submissions
  - `avg_session_duration_seconds` (integer) - Average time on site
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `active_sessions` - Real-time session tracking
  - `id` (uuid, primary key)
  - `user_id` (uuid, nullable)
  - `session_id` (text) - Browser session ID
  - `started_at` (timestamptz) - Session start time
  - `last_activity_at` (timestamptz) - Most recent activity
  - `page_views` (integer) - Pages viewed in session
  - `events_count` (integer) - Total events in session
  - `is_active` (boolean) - Whether session is currently active

  ## 2. Analytics Functions
  
  ### RPC Functions for profiles table
  - `increment_login_count` - Track user logins
  - `increment_ai_rendering_count` - Track AI render completions
  - `add_time_on_site` - Accumulate time spent on site
  
  ### Analytics aggregation functions
  - `refresh_daily_analytics` - Compute daily summary statistics
  - `get_realtime_activity` - Get current active users and recent events
  
  ## 3. Indexes
  - Event type and timestamp indexes for fast querying
  - User and session indexes for analytics aggregation
  - Date indexes for daily summary lookups
  
  ## 4. Security
  - Enable RLS on all tables
  - Admins can read all analytics data
  - Users can only see their own events
  - Public write access for anonymous event tracking
  
  ## 5. Event Types Tracked
  - `page_view` - Page navigation
  - `login` - User authentication
  - `signup` - New user registration
  - `logout` - User logout
  - `ai_render_start` - AI generation initiated
  - `ai_render_complete` - AI generation completed
  - `ai_render_error` - AI generation failed
  - `upload` - Image upload
  - `email_submit` - Email form submission
  - `quote_request` - Quote request submission
  - `share` - Content sharing
  - `download` - Image download
  - `style_selection` - Style selected
  - `room_selection` - Room type selected
*/

-- Create user_events table
CREATE TABLE IF NOT EXISTS user_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text NOT NULL,
  event_type text NOT NULL,
  event_category text DEFAULT 'engagement',
  metadata jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Create daily_analytics_summary table
CREATE TABLE IF NOT EXISTS daily_analytics_summary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date UNIQUE NOT NULL,
  total_visits integer DEFAULT 0,
  unique_visitors integer DEFAULT 0,
  total_logins integer DEFAULT 0,
  total_signups integer DEFAULT 0,
  total_ai_renders integer DEFAULT 0,
  successful_renders integer DEFAULT 0,
  failed_renders integer DEFAULT 0,
  total_quote_requests integer DEFAULT 0,
  total_email_submits integer DEFAULT 0,
  avg_session_duration_seconds integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create active_sessions table
CREATE TABLE IF NOT EXISTS active_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text UNIQUE NOT NULL,
  started_at timestamptz DEFAULT now(),
  last_activity_at timestamptz DEFAULT now(),
  page_views integer DEFAULT 0,
  events_count integer DEFAULT 0,
  is_active boolean DEFAULT true
);

-- Enable RLS
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_analytics_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_events
CREATE POLICY "Admins can view all events"
  ON user_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can view their own events"
  ON user_events FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Anyone can insert events"
  ON user_events FOR INSERT
  WITH CHECK (true);

-- RLS Policies for daily_analytics_summary
CREATE POLICY "Admins can view analytics summary"
  ON daily_analytics_summary FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage analytics summary"
  ON daily_analytics_summary FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- RLS Policies for active_sessions
CREATE POLICY "Admins can view all sessions"
  ON active_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Anyone can manage sessions"
  ON active_sessions FOR ALL
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_events_user_id ON user_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_events_session_id ON user_events(session_id);
CREATE INDEX IF NOT EXISTS idx_user_events_event_type ON user_events(event_type);
CREATE INDEX IF NOT EXISTS idx_user_events_created_at ON user_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_events_category ON user_events(event_category);
CREATE INDEX IF NOT EXISTS idx_daily_analytics_date ON daily_analytics_summary(date DESC);
CREATE INDEX IF NOT EXISTS idx_active_sessions_user_id ON active_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_last_activity ON active_sessions(last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_active_sessions_is_active ON active_sessions(is_active);

-- Function to increment login count in profiles
CREATE OR REPLACE FUNCTION increment_login_count(user_uuid uuid, user_email text)
RETURNS void AS $$
BEGIN
  INSERT INTO profiles (id, email, login_count, last_login)
  VALUES (user_uuid, user_email, 1, now())
  ON CONFLICT (id) DO UPDATE
  SET 
    login_count = COALESCE(profiles.login_count, 0) + 1,
    last_login = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment AI rendering count
CREATE OR REPLACE FUNCTION increment_ai_rendering_count(user_uuid uuid)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET ai_renderings_count = COALESCE(ai_renderings_count, 0) + 1
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add time on site
CREATE OR REPLACE FUNCTION add_time_on_site(user_uuid uuid, time_spent_ms integer)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET total_time_on_site_ms = COALESCE(total_time_on_site_ms, 0) + time_spent_ms
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to refresh daily analytics summary
CREATE OR REPLACE FUNCTION refresh_daily_analytics(summary_date date DEFAULT CURRENT_DATE)
RETURNS void AS $$
DECLARE
  start_time timestamptz;
  end_time timestamptz;
BEGIN
  start_time := summary_date::timestamptz;
  end_time := (summary_date + INTERVAL '1 day')::timestamptz;
  
  INSERT INTO daily_analytics_summary (
    date,
    total_visits,
    unique_visitors,
    total_logins,
    total_signups,
    total_ai_renders,
    successful_renders,
    failed_renders,
    total_quote_requests,
    total_email_submits,
    avg_session_duration_seconds,
    updated_at
  )
  SELECT
    summary_date,
    COUNT(*) FILTER (WHERE event_type = 'page_view'),
    COUNT(DISTINCT COALESCE(user_id::text, session_id)),
    COUNT(*) FILTER (WHERE event_type = 'login'),
    COUNT(*) FILTER (WHERE event_type = 'signup'),
    COUNT(*) FILTER (WHERE event_type IN ('ai_render_start', 'ai_render_complete', 'ai_render_error')),
    COUNT(*) FILTER (WHERE event_type = 'ai_render_complete'),
    COUNT(*) FILTER (WHERE event_type = 'ai_render_error'),
    COUNT(*) FILTER (WHERE event_type = 'quote_request'),
    COUNT(*) FILTER (WHERE event_type = 'email_submit'),
    COALESCE(AVG((metadata->>'duration_seconds')::integer) FILTER (WHERE metadata->>'duration_seconds' IS NOT NULL), 0)::integer,
    now()
  FROM user_events
  WHERE created_at >= start_time AND created_at < end_time
  ON CONFLICT (date) DO UPDATE
  SET
    total_visits = EXCLUDED.total_visits,
    unique_visitors = EXCLUDED.unique_visitors,
    total_logins = EXCLUDED.total_logins,
    total_signups = EXCLUDED.total_signups,
    total_ai_renders = EXCLUDED.total_ai_renders,
    successful_renders = EXCLUDED.successful_renders,
    failed_renders = EXCLUDED.failed_renders,
    total_quote_requests = EXCLUDED.total_quote_requests,
    total_email_submits = EXCLUDED.total_email_submits,
    avg_session_duration_seconds = EXCLUDED.avg_session_duration_seconds,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get realtime activity
CREATE OR REPLACE FUNCTION get_realtime_activity()
RETURNS TABLE (
  active_users_count bigint,
  active_sessions_count bigint,
  events_last_hour bigint,
  recent_events jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL)::bigint,
    COUNT(DISTINCT session_id)::bigint,
    COUNT(*)::bigint,
    jsonb_agg(
      jsonb_build_object(
        'event_type', event_type,
        'created_at', created_at,
        'user_id', user_id,
        'metadata', metadata
      ) ORDER BY created_at DESC
    ) FILTER (WHERE created_at >= now() - INTERVAL '10 minutes')
  FROM user_events
  WHERE created_at >= now() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update session activity
CREATE OR REPLACE FUNCTION update_session_activity(p_session_id text, p_user_id uuid DEFAULT NULL)
RETURNS void AS $$
BEGIN
  INSERT INTO active_sessions (session_id, user_id, last_activity_at, page_views, events_count)
  VALUES (p_session_id, p_user_id, now(), 1, 1)
  ON CONFLICT (session_id) DO UPDATE
  SET
    last_activity_at = now(),
    page_views = active_sessions.page_views + 1,
    events_count = active_sessions.events_count + 1,
    user_id = COALESCE(active_sessions.user_id, p_user_id),
    is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark inactive sessions
CREATE OR REPLACE FUNCTION mark_inactive_sessions()
RETURNS void AS $$
BEGIN
  UPDATE active_sessions
  SET is_active = false
  WHERE last_activity_at < now() - INTERVAL '30 minutes'
  AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;