import { useEffect, useState } from 'react';
import { AnalyticsService } from '../services/analyticsService';
import { Activity, Users, TrendingUp, Zap, Eye, LogIn, Image, Mail, Calendar } from 'lucide-react';

interface RealtimeStats {
  active_users_count: number;
  active_sessions_count: number;
  events_last_hour: number;
  recent_events: Array<{
    event_type: string;
    created_at: string;
    user_id: string | null;
    metadata: Record<string, any>;
  }>;
}

interface DailyStats {
  date: string;
  total_visits: number;
  unique_visitors: number;
  total_logins: number;
  total_signups: number;
  total_ai_renders: number;
  successful_renders: number;
  failed_renders: number;
  total_quote_requests: number;
  total_email_submits: number;
  avg_session_duration_seconds: number;
}

export function ActivityDashboard() {
  const [realtimeStats, setRealtimeStats] = useState<RealtimeStats | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'custom'>('7d');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  useEffect(() => {
    loadDashboardData();

    const interval = setInterval(() => {
      loadRealtimeData();
    }, 30000);

    return () => clearInterval(interval);
  }, [dateRange, customStartDate, customEndDate]);

  const loadDashboardData = async () => {
    setLoading(true);
    await Promise.all([
      loadRealtimeData(),
      loadDailyData(),
      loadRecentEvents()
    ]);
    setLoading(false);
  };

  const loadRealtimeData = async () => {
    const data = await AnalyticsService.getRealtimeActivity();
    if (data) {
      setRealtimeStats(data);
    }
  };

  const getDaysFromRange = () => {
    if (dateRange === '7d') return 7;
    if (dateRange === '30d') return 30;
    if (dateRange === '90d') return 90;
    return 30;
  };

  const getDateFilterParams = () => {
    if (dateRange === 'custom' && (customStartDate || customEndDate)) {
      return {
        startDate: customStartDate || undefined,
        endDate: customEndDate || undefined
      };
    }
    return { days: getDaysFromRange() };
  };

  const loadDailyData = async () => {
    const params = getDateFilterParams();
    const data = await AnalyticsService.getDailyAnalytics(params.days || 30, params.startDate, params.endDate);
    if (data) {
      setDailyStats(data);
    }
  };

  const loadRecentEvents = async () => {
    const params = getDateFilterParams();
    const data = await AnalyticsService.getRecentEvents(50, params.startDate, params.endDate);
    if (data) {
      setRecentEvents(data);
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getEventIcon = (eventType: string) => {
    const iconMap: Record<string, any> = {
      page_view: Eye,
      login: LogIn,
      signup: Users,
      ai_render_start: Zap,
      ai_render_complete: Image,
      ai_render_error: Zap,
      email_submit: Mail,
      quote_request: Mail,
      upload: Image,
      style_selection: TrendingUp,
      room_selection: TrendingUp
    };
    return iconMap[eventType] || Activity;
  };

  const getEventColor = (eventType: string) => {
    if (eventType.includes('error')) return 'text-red-500';
    if (eventType.includes('complete') || eventType === 'signup') return 'text-green-500';
    if (eventType.includes('ai_render')) return 'text-purple-500';
    if (eventType === 'login') return 'text-blue-500';
    return 'text-gray-500';
  };

  const todayStats = dailyStats[0];
  const yesterdayStats = dailyStats[1];

  const calculateChange = (current: number, previous: number) => {
    if (!previous) return 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Activity Dashboard</h2>
        <button
          onClick={loadDashboardData}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Date Range:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setDateRange('7d')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                dateRange === '7d'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setDateRange('30d')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                dateRange === '30d'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setDateRange('90d')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                dateRange === '90d'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Last 90 Days
            </button>
            <button
              onClick={() => setDateRange('custom')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                dateRange === 'custom'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Custom Range
            </button>
          </div>
          {dateRange === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Start Date"
              />
              <span className="text-sm text-gray-500">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="End Date"
              />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-8 h-8 opacity-80" />
            <span className="text-sm font-medium bg-white/20 px-2 py-1 rounded">Live</span>
          </div>
          <div className="text-3xl font-bold mb-1">
            {realtimeStats?.active_users_count || 0}
          </div>
          <div className="text-sm opacity-90">Active Users</div>
          <div className="text-xs opacity-75 mt-2">
            {realtimeStats?.active_sessions_count || 0} sessions
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-8 h-8 opacity-80" />
            <span className="text-sm font-medium bg-white/20 px-2 py-1 rounded">1h</span>
          </div>
          <div className="text-3xl font-bold mb-1">
            {realtimeStats?.events_last_hour || 0}
          </div>
          <div className="text-sm opacity-90">Recent Events</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Eye className="w-8 h-8 opacity-80" />
            <span className="text-sm font-medium bg-white/20 px-2 py-1 rounded">Today</span>
          </div>
          <div className="text-3xl font-bold mb-1">
            {todayStats?.total_visits || 0}
          </div>
          <div className="text-sm opacity-90">Page Views</div>
          {yesterdayStats && (
            <div className="text-xs opacity-75 mt-2">
              {calculateChange(todayStats?.total_visits || 0, yesterdayStats?.total_visits || 0) > 0 ? '↑' : '↓'}{' '}
              {Math.abs(calculateChange(todayStats?.total_visits || 0, yesterdayStats?.total_visits || 0))}% vs yesterday
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Image className="w-8 h-8 opacity-80" />
            <span className="text-sm font-medium bg-white/20 px-2 py-1 rounded">Today</span>
          </div>
          <div className="text-3xl font-bold mb-1">
            {todayStats?.successful_renders || 0}
          </div>
          <div className="text-sm opacity-90">AI Renders</div>
          <div className="text-xs opacity-75 mt-2">
            {todayStats?.failed_renders || 0} failed
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            {dateRange === '7d' && 'Last 7 Days Overview'}
            {dateRange === '30d' && 'Last 30 Days Overview'}
            {dateRange === '90d' && 'Last 90 Days Overview'}
            {dateRange === 'custom' && 'Custom Date Range Overview'}
          </h3>
          <div className="space-y-3">
            {dailyStats.slice(0, dateRange === '7d' ? 7 : dateRange === '30d' ? 15 : 20).map((day) => (
              <div key={day.date} className="flex items-center justify-between py-2 border-b border-gray-100">
                <div>
                  <div className="font-medium text-gray-900">
                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </div>
                  <div className="text-sm text-gray-500">
                    {day.unique_visitors} unique visitors
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">{day.total_visits} views</div>
                  <div className="text-sm text-gray-500">{day.successful_renders} renders</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-600" />
            Recent Activity
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {recentEvents.map((event, index) => {
              const Icon = getEventIcon(event.event_type);
              const colorClass = getEventColor(event.event_type);

              return (
                <div key={index} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${colorClass}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 text-sm">
                        {event.event_type.replace(/_/g, ' ')}
                      </span>
                      {event.user_id && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          User
                        </span>
                      )}
                    </div>
                    {event.metadata && Object.keys(event.metadata).length > 0 && (
                      <div className="text-xs text-gray-500 mt-1 truncate">
                        {event.metadata.room_type && `${event.metadata.room_type}`}
                        {event.metadata.style && ` • ${event.metadata.style}`}
                        {event.metadata.page && ` • ${event.metadata.page}`}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {formatTimeAgo(event.created_at)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {todayStats && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Detailed Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{todayStats.total_logins}</div>
              <div className="text-sm text-gray-600">Logins</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{todayStats.total_signups}</div>
              <div className="text-sm text-gray-600">Signups</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{todayStats.total_ai_renders}</div>
              <div className="text-sm text-gray-600">AI Requests</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{todayStats.successful_renders}</div>
              <div className="text-sm text-gray-600">Successful</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{todayStats.total_quote_requests}</div>
              <div className="text-sm text-gray-600">Quotes</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{todayStats.total_email_submits}</div>
              <div className="text-sm text-gray-600">Emails</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
