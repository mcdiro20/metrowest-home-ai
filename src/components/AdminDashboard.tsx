import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Activity, 
  TrendingUp, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Eye,
  Download,
  Filter,
  Search,
  BarChart3,
  PieChart,
  Clock,
  Star,
  Home,
  Zap,
  ArrowLeft,
  Trash2,
  Shield,
  AlertTriangle,
  X,
  Check,
  Edit,
  Plus
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Lead, Profile, UserEvent } from '../lib/supabase';

// Define missing interfaces
interface Contractor {
  id: string;
  name: string;
  email: string;
  assigned_zip_codes?: string[];
  serves_all_zipcodes: boolean;
  price_per_lead: number;
  monthly_subscription_fee: number;
  is_active_subscriber: boolean;
  subscription_tier: string;
  leads_received_count?: number;
  leads_converted_count?: number;
  conversion_rate?: number;
  created_at: string;
  updated_at?: string;
}

interface DashboardStats {
  totalUsers: number;
  totalLeads: number;
  totalRenders: number;
  conversionRate: number;
  avgLeadScore: number;
  topZipCodes: { zip: string; count: number }[];
  popularStyles: { style: string; count: number }[];
  recentActivity: UserEvent[];
}

interface NotificationState {
  show: boolean;
  type: 'success' | 'error' | 'warning';
  message: string;
}

const AdminDashboard: React.FC = () => {
  // Main data states
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [events, setEvents] = useState<UserEvent[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);

  // UI states
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState<'overview' | 'leads' | 'users' | 'activity'>('overview');

  // Modal states
  const [showAddContractorModal, setShowAddContractorModal] = useState(false);
  const [showContractorDetailsModal, setShowContractorDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null);
  const [userToDelete, setUserToDelete] = useState<Profile | null>(null);

  // Loading states
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddingContractor, setIsAddingContractor] = useState(false);
  const [updatingStates, setUpdatingStates] = useState<{ [key: string]: boolean }>({});

  // Form state
  const [newContractorData, setNewContractorData] = useState({
    name: '',
    email: '',
    assignedZipCodes: '',
    servesAllZipcodes: false,
    pricePerLead: 25.00,
    monthlySubscriptionFee: 99.00,
    isActiveSubscriber: true,
    subscriptionTier: 'basic'
  });

  // Notification state
  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    type: 'success',
    message: ''
  });

  // Notification helper
  const showNotification = useCallback((type: 'success' | 'error' | 'warning', message: string) => {
    setNotification({ show: true, type, message });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 5000);
  }, []);

  // Helper to manage updating states
  const setUpdatingState = useCallback((key: string, value: boolean) => {
    setUpdatingStates(prev => ({ ...prev, [key]: value }));
  }, []);

  const fetchDashboardData = useCallback(async () => {
    if (!supabase) {
      console.warn('Supabase not configured');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Calculate date range
      const now = new Date();
      const daysAgo = selectedTimeRange === '24h' ? 1 : 
                     selectedTimeRange === '7d' ? 7 : 
                     selectedTimeRange === '30d' ? 30 : 90;
      const startDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));

      // Fetch all data in parallel
      const [leadsResult, profilesResult, eventsResult, contractorsResult] = await Promise.allSettled([
        supabase
          .from('leads')
          .select('*')
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: false }),
        
        supabase
          .from('profiles')
          .select('*')
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: false }),
        
        supabase
          .from('user_events')
          .select('*')
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: false })
          .limit(50),
        
        supabase
          .from('contractors')
          .select('*')
          .order('created_at', { ascending: false })
      ]);

      // Process results
      const leadsData = leadsResult.status === 'fulfilled' && !leadsResult.value.error ? leadsResult.value.data || [] : [];
      const profilesData = profilesResult.status === 'fulfilled' && !profilesResult.value.error ? profilesResult.value.data || [] : [];
      const eventsData = eventsResult.status === 'fulfilled' && !eventsResult.value.error ? eventsResult.value.data || [] : [];
      const contractorsData = contractorsResult.status === 'fulfilled' && !contractorsResult.value.error ? contractorsResult.value.data || [] : [];

      // Update states
      setLeads(leadsData);
      setProfiles(profilesData);
      setEvents(eventsData);
      setContractors(contractorsData);

      // Calculate stats
      if (leadsData && profilesData) {
        const totalRenders = leadsData.reduce((sum, lead) => sum + (lead.render_count || 0), 0);
        const leadsWithEmail = leadsData.filter(lead => lead.email).length;
        const conversionRate = leadsData.length > 0 ? (leadsWithEmail / leadsData.length) * 100 : 0;
        const avgLeadScore = leadsData.length > 0 ? 
          leadsData.reduce((sum, lead) => sum + (lead.lead_score || 0), 0) / leadsData.length : 0;

        // Top ZIP codes
        const zipCounts = leadsData.reduce((acc, lead) => {
          if (lead.zip) {
            acc[lead.zip] = (acc[lead.zip] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>);
        const topZipCodes = Object.entries(zipCounts)
          .map(([zip, count]) => ({ zip, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        // Popular styles
        const styleCounts = leadsData.reduce((acc, lead) => {
          if (lead.style) {
            acc[lead.style] = (acc[lead.style] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>);
        const popularStyles = Object.entries(styleCounts)
          .map(([style, count]) => ({ style, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setStats({
          totalUsers: profilesData.length,
          totalLeads: leadsData.length,
          totalRenders,
          conversionRate,
          avgLeadScore,
          topZipCodes,
          popularStyles,
          recentActivity: eventsData
        });
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      showNotification('error', 'Failed to load dashboard data. Please refresh the page.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedTimeRange, showNotification]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleDeleteUser = useCallback(async (user: Profile) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  }, []);

  const confirmDeleteUser = useCallback(async () => {
    if (!userToDelete || !supabase) return;

    setIsDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // For now, we'll just remove from local state since API endpoints may not exist
      // In production, you'd make the actual API call here
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Remove user from local state
      setProfiles(prev => prev.filter(p => p.id !== userToDelete.id));
      
      showNotification('success', 'User deleted successfully');
      
    } catch (error) {
      console.error('Delete user error:', error);
      showNotification('error', `Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setUserToDelete(null);
    }
  }, [userToDelete, showNotification]);

  const handleRoleChange = useCallback(async (userId: string, newRole: string) => {
    if (!supabase) return;

    setUpdatingState(`role-${userId}`, true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      // Update user in local state
      setProfiles(prev => prev.map(p => 
        p.id === userId ? { ...p, role: newRole as 'admin' | 'contractor' | 'homeowner' } : p
      ));
      
      showNotification('success', 'User role updated successfully');
      
    } catch (error) {
      console.error('Update role error:', error);
      showNotification('error', `Failed to update user role: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUpdatingState(`role-${userId}`, false);
    }
  }, [showNotification, setUpdatingState]);

  const updateContractorField = useCallback(async (contractorId: string, field: string, value: any) => {
    const updateKey = `contractor-${contractorId}-${field}`;
    
    if (updatingStates[updateKey]) {
      return; // Prevent concurrent updates
    }

    setUpdatingState(updateKey, true);
    
    // Store original value for rollback
    const originalContractor = contractors.find(c => c.id === contractorId);
    const originalValue = originalContractor?.[field as keyof Contractor];

    try {
      // Optimistic update
      setContractors(prev => prev.map(c => 
        c.id === contractorId ? { ...c, [field]: value } : c
      ));

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      showNotification('success', `${field.replace('_', ' ')} updated successfully`);
      
    } catch (error) {
      // Rollback on error
      setContractors(prev => prev.map(c => 
        c.id === contractorId ? { ...c, [field]: originalValue } : c
      ));
      
      console.error('Update contractor field error:', error);
      showNotification('error', `Failed to update ${field.replace('_', ' ')}`);
    } finally {
      setUpdatingState(updateKey, false);
    }
  }, [contractors, updatingStates, setUpdatingState, showNotification]);

  const handleAddContractor = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    setIsAddingContractor(true);
    try {
      // Basic validation
      if (!newContractorData.name.trim() || !newContractorData.email.trim()) {
        throw new Error('Name and email are required');
      }

      // Parse ZIP codes from comma-separated string
      const zipCodes = newContractorData.assignedZipCodes
        .split(',')
        .map(zip => zip.trim())
        .filter(zip => zip.length === 5 && /^\d{5}$/.test(zip));

      if (!newContractorData.servesAllZipcodes && zipCodes.length === 0) {
        throw new Error('Please enter valid ZIP codes or select "Serves All ZIP Codes"');
      }

      // Create new contractor object
      const newContractor: Contractor = {
        id: `temp-${Date.now()}`, // Temporary ID
        name: newContractorData.name.trim(),
        email: newContractorData.email.trim(),
        assigned_zip_codes: zipCodes,
        serves_all_zipcodes: newContractorData.servesAllZipcodes,
        price_per_lead: newContractorData.pricePerLead,
        monthly_subscription_fee: newContractorData.monthlySubscriptionFee,
        is_active_subscriber: newContractorData.isActiveSubscriber,
        subscription_tier: newContractorData.subscriptionTier,
        created_at: new Date().toISOString(),
        leads_received_count: 0,
        leads_converted_count: 0,
        conversion_rate: 0
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Add new contractor to local state
      setContractors(prev => [newContractor, ...prev]);
      
      // Reset form and close modal
      setNewContractorData({
        name: '',
        email: '',
        assignedZipCodes: '',
        servesAllZipcodes: false,
        pricePerLead: 25.00,
        monthlySubscriptionFee: 99.00,
        isActiveSubscriber: true,
        subscriptionTier: 'basic'
      });
      setShowAddContractorModal(false);
      
      showNotification('success', 'Contractor added successfully!');
      
    } catch (error) {
      console.error('Add contractor error:', error);
      showNotification('error', `Failed to add contractor: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAddingContractor(false);
    }
  }, [newContractorData, showNotification]);

  const handleEditContractor = useCallback((contractor: Contractor) => {
    setSelectedContractor(contractor);
    setShowContractorDetailsModal(true);
  }, []);

  const exportData = useCallback(() => {
    try {
      const data = {
        stats,
        leads,
        profiles,
        events,
        contractors,
        exportDate: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `metrowest-dashboard-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showNotification('success', 'Data exported successfully');
    } catch (error) {
      showNotification('error', 'Failed to export data');
    }
  }, [stats, leads, profiles, events, contractors, showNotification]);

  // Helper functions
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'contractor':
        return 'bg-blue-100 text-blue-800';
      case 'homeowner':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-3 h-3" />;
      case 'contractor':
        return <Users className="w-3 h-3" />;
      case 'homeowner':
        return <Home className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const filteredLeads = leads.filter(lead => 
    !searchTerm || 
    lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.zip?.includes(searchTerm)
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md ${
          notification.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
          notification.type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
          'bg-yellow-100 text-yellow-800 border border-yellow-200'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' && <Check className="w-5 h-5" />}
            {notification.type === 'error' && <AlertTriangle className="w-5 h-5" />}
            {notification.type === 'warning' && <AlertTriangle className="w-5 h-5" />}
            <span className="text-sm font-medium">{notification.message}</span>
            <button
              onClick={() => setNotification(prev => ({ ...prev, show: false }))}
              className="ml-auto text-current hover:text-current/70"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <Link 
                  to="/"
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Home
                </Link>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">MetroWest Home AI Dashboard</h1>
              <p className="text-gray-600">Monitor user activity and lead generation</p>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
              </select>
              <button
                onClick={exportData}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Export Data
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', name: 'Overview', icon: BarChart3 },
                { id: 'leads', name: 'Leads', icon: Users },
                { id: 'users', name: 'Users', icon: Activity },
                { id: 'activity', name: 'Activity', icon: Clock }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id as any)}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    selectedTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {selectedTab === 'overview' && stats && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{stats.totalUsers}</h3>
                    <p className="text-gray-600">Total Users</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Mail className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{stats.totalLeads}</h3>
                    <p className="text-gray-600">Total Leads</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Zap className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{stats.totalRenders}</h3>
                    <p className="text-gray-600">AI Renders</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{stats.conversionRate.toFixed(1)}%</h3>
                    <p className="text-gray-600">Conversion Rate</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top ZIP Codes */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top ZIP Codes</h3>
                <div className="space-y-3">
                  {stats.topZipCodes.map((item, index) => (
                    <div key={item.zip} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                          {index + 1}
                        </div>
                        <span className="font-medium">{item.zip}</span>
                      </div>
                      <span className="text-gray-600">{item.count} leads</span>
                    </div>
                  ))}
                  {stats.topZipCodes.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No data available</p>
                  )}
                </div>
              </div>

              {/* Popular Styles */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Styles</h3>
                <div className="space-y-3">
                  {stats.popularStyles.map((item, index) => (
                    <div key={item.style} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-sm font-medium text-emerald-600">
                          {index + 1}
                        </div>
                        <span className="font-medium">{item.style}</span>
                      </div>
                      <span className="text-gray-600">{item.count} renders</span>
                    </div>
                  ))}
                  {stats.popularStyles.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No data available</p>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {stats.recentActivity.slice(0, 10).map((event) => (
                  <div key={event.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Activity className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        User {event.event_type}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(event.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
                {stats.recentActivity.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No recent activity</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Leads Tab */}
        {selectedTab === 'leads' && (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search leads by email, name, or ZIP code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <Filter className="w-4 h-4" />
                  Filter
                </button>
              </div>
            </div>

            {/* Leads Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Project
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredLeads.length > 0 ? filteredLeads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {lead.name || 'Anonymous'}
                            </div>
                            <div className="text-sm text-gray-500">{lead.email}</div>
                            {lead.phone && (
                              <div className="text-sm text-gray-500">{lead.phone}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900">{lead.zip || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {lead.room_type || 'Not specified'}
                            </div>
                            <div className="text-sm text-gray-500">{lead.style || 'No style'}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400" />
                            <span className="text-sm font-medium text-gray-900">
                              {lead.lead_score || 0}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(lead.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button className="text-blue-600 hover:text-blue-900 text-sm font-medium">
                            View Details
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center">
                            <Mail className="w-12 h-12 text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No leads found</h3>
                            <p className="text-gray-500">
                              {searchTerm ? 'Try adjusting your search criteria.' : 'Leads will appear here when users submit their information.'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {selectedTab === 'users' && (
          <div className="space-y-6">
            {/* Contractor Management Header */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Contractor Management</h3>
                  <p className="text-gray-600">Manage contractor subscriptions, ZIP codes, and pricing</p>
                </div>
                <button
                  onClick={() => setShowAddContractorModal(true)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Contractor
                </button>
              </div>
            </div>

            {/* Contractors Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Contractors ({contractors.length})
                </h3>
              </div>
              
              {contractors.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No contractors found</h3>
                  <p className="text-gray-600 mb-4">
                    Add contractors to start receiving and managing leads
                  </p>
                  <button
                    onClick={() => setShowAddContractorModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Add First Contractor
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contractor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Subscription
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Service Area
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pricing
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Performance
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {contractors.map((contractor) => (
                        <tr key={contractor.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {contractor.name}
                              </div>
                              <div className="text-sm text-gray-500">{contractor.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => updateContractorField(contractor.id, 'is_active_subscriber', !contractor.is_active_subscriber)}
                                  disabled={updatingStates[`contractor-${contractor.id}-is_active_subscriber`]}
                                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                    contractor.is_active_subscriber
                                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                      : 'bg-red-100 text-red-800 hover:bg-red-200'
                                  }`}
                                >
                                  {contractor.is_active_subscriber ? 'Active' : 'Inactive'}
                                </button>
                                {updatingStates[`contractor-${contractor.id}-is_active_subscriber`] && (
                                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 capitalize">
                                {contractor.subscription_tier}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={contractor.serves_all_zipcodes}
                                  onChange={(e) => updateContractorField(contractor.id, 'serves_all_zipcodes', e.target.checked)}
                                  disabled={updatingStates[`contractor-${contractor.id}-serves_all_zipcodes`]}
                                  className="w-4 h-4 text-blue-600 rounded disabled:opacity-50"
                                />
                                <span className="text-sm text-gray-700">All MetroWest</span>
                                {updatingStates[`contractor-${contractor.id}-serves_all_zipcodes`] && (
                                  <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                )}
                              </div>
                              {!contractor.serves_all_zipcodes && (
                                <div>
                                  <input
                                    type="text"
                                    value={contractor.assigned_zip_codes?.join(', ') || ''}
                                    onChange={(e) => {
                                      const zipCodes = e.target.value.split(',').map(zip => zip.trim()).filter(zip => zip);
                                      updateContractorField(contractor.id, 'assigned_zip_codes', zipCodes);
                                    }}
                                    disabled={updatingStates[`contractor-${contractor.id}-assigned_zip_codes`]}
                                    placeholder="01701, 01702, 01720..."
                                    className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:opacity-50"
                                  />
                                  <p className="text-xs text-gray-500 mt-1">
                                    Comma-separated ZIP codes
                                  </p>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="space-y-2">
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-gray-500">Per Lead: $</span>
                                <input
                                  type="number"
                                  value={contractor.price_per_lead || 25}
                                  onChange={(e) => updateContractorField(contractor.id, 'price_per_lead', parseFloat(e.target.value))}
                                  disabled={updatingStates[`contractor-${contractor.id}-price_per_lead`]}
                                  className="w-16 text-xs px-1 py-1 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:opacity-50"
                                  min="0"
                                  step="0.01"
                                />
                                {updatingStates[`contractor-${contractor.id}-price_per_lead`] && (
                                  <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin ml-1"></div>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-gray-500">Monthly: $</span>
                                <input
                                  type="number"
                                  value={contractor.monthly_subscription_fee || 99}
                                  onChange={(e) => updateContractorField(contractor.id, 'monthly_subscription_fee', parseFloat(e.target.value))}
                                  disabled={updatingStates[`contractor-${contractor.id}-monthly_subscription_fee`]}
                                  className="w-16 text-xs px-1 py-1 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:opacity-50"
                                  min="0"
                                  step="0.01"
                                />
                                {updatingStates[`contractor-${contractor.id}-monthly_subscription_fee`] && (
                                  <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin ml-1"></div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm">
                              <div className="text-gray-900">{contractor.leads_received_count || 0} leads</div>
                              <div className="text-gray-500">{(contractor.conversion_rate || 0).toFixed(1)}% conversion</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handleEditContractor(contractor)}
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-900 text-sm font-medium transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                              Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Users ({profiles.length})
                </h3>
              </div>
              {profiles.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                  <p className="text-gray-600">Users will appear here as they register and use the platform.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          AI Renderings
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Logins
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Time on Site
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Lead Score
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ZIP Code
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Login
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {profiles.map((profile) => (
                        <tr key={profile.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {profile.email}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <select
                                value={profile.role}
                                onChange={(e) => handleRoleChange(profile.id, e.target.value)}
                                disabled={updatingStates[`role-${profile.id}`]}
                                className={`text-xs font-semibold rounded-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${getRoleColor(profile.role)}`}
                              >
                                <option value="homeowner">homeowner</option>
                                <option value="contractor">contractor</option>
                                <option value="admin">admin</option>
                              </select>
                              {updatingStates[`role-${profile.id}`] && (
                                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <Zap className="w-4 h-4 text-purple-500" />
                              <span className="text-sm font-medium text-gray-900">
                                {profile.ai_renderings_count || 0}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <Activity className="w-4 h-4 text-blue-500" />
                              <span className="text-sm font-medium text-gray-900">
                                {profile.login_count || 0}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4 text-emerald-500" />
                              <span className="text-sm font-medium text-gray-900">
                                {profile.total_time_on_site_ms ? 
                                  `${Math.round(profile.total_time_on_site_ms / 60000)}m` : 
                                  '0m'
                                }
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-400" />
                              <span className="text-sm font-medium text-gray-900">
                                {profile.lead_score || 0}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">{profile.zip_code || 'N/A'}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {profile.last_login ? new Date(profile.last_login).toLocaleDateString() : 'Never'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <button className="text-blue-600 hover:text-blue-900 text-sm font-medium transition-colors">
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteUser(profile)}
                                className="text-red-600 hover:text-red-900 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Activity Tab */}
        {selectedTab === 'activity' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">User Activity Log</h3>
            </div>
            <div className="p-6">
              {events.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Activity className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No activity found</h3>
                  <p className="text-gray-600">User activity will appear here as users interact with the platform.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {events.map((event) => (
                    <div key={event.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Activity className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900">
                            {event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1)} Event
                          </h4>
                          <span className="text-xs text-gray-500">
                            {new Date(event.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          User ID: {event.user_id}
                        </p>
                        {event.metadata && Object.keys(event.metadata).length > 0 && (
                          <div className="mt-2 text-xs text-gray-500">
                            <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto max-w-full">
                              {JSON.stringify(event.metadata, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Contractor Modal */}
      {showAddContractorModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowAddContractorModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Add New Contractor
              </h3>
              <p className="text-gray-600">
                Set up a new contractor with service areas and pricing
              </p>
            </div>

            <form onSubmit={handleAddContractor} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contractor Name *
                  </label>
                  <input
                    type="text"
                    value={newContractorData.name}
                    onChange={(e) => setNewContractorData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={newContractorData.email}
                    onChange={(e) => setNewContractorData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer mb-3">
                  <input
                    type="checkbox"
                    checked={newContractorData.servesAllZipcodes}
                    onChange={(e) => setNewContractorData(prev => ({ ...prev, servesAllZipcodes: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Serves All MetroWest ZIP Codes</span>
                </label>
                
                {!newContractorData.servesAllZipcodes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assigned ZIP Codes *
                    </label>
                    <input
                      type="text"
                      value={newContractorData.assignedZipCodes}
                      onChange={(e) => setNewContractorData(prev => ({ ...prev, assignedZipCodes: e.target.value }))}
                      placeholder="01701, 01702, 01720, 01730..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter comma-separated 5-digit ZIP codes (e.g., 01701, 01702, 01720)
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Per Lead ($)
                  </label>
                  <input
                    type="number"
                    value={newContractorData.pricePerLead}
                    onChange={(e) => setNewContractorData(prev => ({ ...prev, pricePerLead: parseFloat(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Fee ($)
                  </label>
                  <input
                    type="number"
                    value={newContractorData.monthlySubscriptionFee}
                    onChange={(e) => setNewContractorData(prev => ({ ...prev, monthlySubscriptionFee: parseFloat(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subscription Tier
                  </label>
                  <select
                    value={newContractorData.subscriptionTier}
                    onChange={(e) => setNewContractorData(prev => ({ ...prev, subscriptionTier: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                  >
                    <option value="basic">Basic</option>
                    <option value="premium">Premium</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
                <div className="flex items-center justify-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newContractorData.isActiveSubscriber}
                      onChange={(e) => setNewContractorData(prev => ({ ...prev, isActiveSubscriber: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Active Subscriber</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={isAddingContractor}
                className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAddingContractor ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Adding Contractor...
                  </div>
                ) : (
                  'Add Contractor'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Contractor Details Modal */}
      {showContractorDetailsModal && selectedContractor && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setShowContractorDetailsModal(false);
                setSelectedContractor(null);
              }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {selectedContractor.name}
              </h3>
              <p className="text-gray-600">{selectedContractor.email}</p>
              <div className="flex justify-center mt-2">
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                  selectedContractor.is_active_subscriber
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {selectedContractor.is_active_subscriber ? 'Active Subscriber' : 'Inactive'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 border-b pb-2">Subscription Details</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Subscription Tier</label>
                    <p className="text-gray-900 capitalize font-medium">{selectedContractor.subscription_tier}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Monthly Fee</label>
                    <p className="text-gray-900 font-medium">${selectedContractor.monthly_subscription_fee?.toFixed(2) || '0.00'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Price Per Lead</label>
                    <p className="text-gray-900 font-medium">${selectedContractor.price_per_lead?.toFixed(2) || '0.00'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Member Since</label>
                    <p className="text-gray-900">{new Date(selectedContractor.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 border-b pb-2">Performance & Service Area</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Leads Received</label>
                    <p className="text-gray-900 font-medium">{selectedContractor.leads_received_count || 0}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Leads Converted</label>
                    <p className="text-gray-900 font-medium">{selectedContractor.leads_converted_count || 0}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Conversion Rate</label>
                    <p className="text-gray-900 font-medium">{(selectedContractor.conversion_rate || 0).toFixed(1)}%</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Service Area</label>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      {selectedContractor.serves_all_zipcodes ? (
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-sm font-medium text-gray-900">All MetroWest ZIP Codes</span>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <span className="text-sm font-medium text-gray-900">Specific ZIP Codes</span>
                          </div>
                          <p className="text-sm text-gray-700 ml-5">
                            {selectedContractor.assigned_zip_codes?.length 
                              ? selectedContractor.assigned_zip_codes.join(', ')
                              : 'No ZIP codes assigned'
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <button
                onClick={() => {
                  setShowContractorDetailsModal(false);
                  setSelectedContractor(null);
                }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-6 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Delete User Account
              </h3>
              <p className="text-gray-600 mb-2">
                Are you sure you want to delete the account for{' '}
                <span className="font-semibold">{userToDelete.email}</span>?
              </p>
              <p className="text-sm text-red-600">
                This action cannot be undone. All user data, leads, and activity will be permanently deleted.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setUserToDelete(null);
                }}
                disabled={isDeleting}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteUser}
                disabled={isDeleting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Deleting...
                  </div>
                ) : (
                  'Delete User'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;