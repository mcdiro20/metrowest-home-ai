import React, { useState, useEffect } from 'react';
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
  AlertTriangle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Lead, Profile, UserEvent } from '../lib/supabase';

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

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [events, setEvents] = useState<UserEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState<'overview' | 'leads' | 'users' | 'activity'>('overview');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<Profile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingRole, setIsUpdatingRole] = useState<string | null>(null);
  const [contractors, setContractors] = useState<any[]>([]);
  const [showAddContractorModal, setShowAddContractorModal] = useState(false);
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
  const [selectedContractor, setSelectedContractor] = useState<any>(null);
  const [isUpdatingContractor, setIsUpdatingContractor] = useState<string | null>(null);
  const [isAddingContractor, setIsAddingContractor] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [selectedTimeRange]);

  const fetchDashboardData = async () => {
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

      // Fetch leads
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (leadsError) {
        console.error('Error fetching leads:', leadsError);
      } else {
        setLeads(leadsData || []);
      }

      // Fetch profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      } else {
        setProfiles(profilesData || []);
      }

      // Fetch user events
      const { data: eventsData, error: eventsError } = await supabase
        .from('user_events')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(50);

      if (eventsError) {
        console.error('Error fetching events:', eventsError);
      } else {
        setEvents(eventsData || []);
      }

      // Fetch contractors
      const { data: contractorsData, error: contractorsError } = await supabase
        .from('contractors')
        .select('*')
        .order('created_at', { ascending: false });

      if (contractorsError) {
        console.error('Error fetching contractors:', contractorsError);
      } else {
        setContractors(contractorsData || []);
      }

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
          recentActivity: eventsData || []
        });
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (user: Profile) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete || !supabase) return;

    setIsDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/admin/delete-user', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          userId: userToDelete.id
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete user');
      }

      // Remove user from local state
      setProfiles(prev => prev.filter(p => p.id !== userToDelete.id));
      
      // Show success message
      alert('User deleted successfully');
      
    } catch (error) {
      console.error('Delete user error:', error);
      alert(`Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setUserToDelete(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!supabase) return;

    setIsUpdatingRole(userId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/admin/update-user-role', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          userId,
          newRole
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update user role');
      }

      // Update user in local state
      setProfiles(prev => prev.map(p => 
        p.id === userId ? { ...p, role: newRole as 'admin' | 'contractor' | 'homeowner' } : p
      ));
      
      // Show success message
      alert('User role updated successfully');
      
    } catch (error) {
      console.error('Update role error:', error);
      alert(`Failed to update user role: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUpdatingRole(null);
    }
  };

  const updateContractorField = async (contractorId: string, field: string, value: any) => {
    if (!supabase) return;

    setIsUpdatingContractor(contractorId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Update local state immediately for responsive UI
      setContractors(prev => prev.map(c => 
        c.id === contractorId ? { ...c, [field]: value } : c
      ));

      const response = await fetch('/api/admin/update-contractor', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          contractorId,
          updates: { [field]: value }
        })
      });

      const result = await response.json();

      if (!result.success) {
        // Revert local state on error
        setContractors(prev => prev.map(c => 
          c.id === contractorId ? { ...c, [field]: c[field] } : c
        ));
        throw new Error(result.error || 'Failed to update contractor');
      }

      console.log('✅ Contractor field updated:', field);
      
    } catch (error) {
      console.error('Update contractor field error:', error);
      alert(`Failed to update ${field}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUpdatingContractor(null);
    }
  };

  const toggleContractorSubscription = async (contractorId: string, newStatus: boolean) => {
    await updateContractorField(contractorId, 'is_active_subscriber', newStatus);
  };

  const handleAddContractor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    setIsAddingContractor(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Parse ZIP codes from comma-separated string
      const zipCodes = newContractorData.assignedZipCodes
        .split(',')
        .map(zip => zip.trim())
        .filter(zip => zip.length === 5);

      const response = await fetch('/api/admin/add-contractor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          name: newContractorData.name,
          email: newContractorData.email,
          assignedZipCodes: zipCodes,
          servesAllZipcodes: newContractorData.servesAllZipcodes,
          pricePerLead: newContractorData.pricePerLead,
          monthlySubscriptionFee: newContractorData.monthlySubscriptionFee,
          isActiveSubscriber: newContractorData.isActiveSubscriber,
          subscriptionTier: newContractorData.subscriptionTier
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to add contractor');
      }

      // Add new contractor to local state
      setContractors(prev => [result.contractor, ...prev]);
      
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
      
      alert('Contractor added successfully!');
      
    } catch (error) {
      console.error('Add contractor error:', error);
      alert(`Failed to add contractor: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAddingContractor(false);
    }
  };

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

  const exportData = () => {
    const data = {
      stats,
      leads,
      profiles,
      events,
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
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
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
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
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
                    {filteredLeads.map((lead) => (
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
                            <span className="text-sm text-gray-900">{lead.zip}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {lead.room_type}
                            </div>
                            <div className="text-sm text-gray-500">{lead.style}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400" />
                            <span className="text-sm font-medium text-gray-900">
                              {lead.lead_score}
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
                    ))}
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
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
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
                                  onClick={() => toggleContractorSubscription(contractor.id, !contractor.is_active_subscriber)}
                                  disabled={isUpdatingContractor === contractor.id}
                                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full transition-colors ${
                                    contractor.is_active_subscriber
                                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                      : 'bg-red-100 text-red-800 hover:bg-red-200'
                                  }`}
                                >
                                  {contractor.is_active_subscriber ? 'Active' : 'Inactive'}
                                </button>
                                {isUpdatingContractor === contractor.id && (
                                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                )}
                              </div>
                              <div className="text-xs text-gray-500">
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
                                  disabled={isUpdatingContractor === contractor.id}
                                  className="w-4 h-4 text-blue-600 rounded"
                                />
                                <span className="text-sm text-gray-700">All MetroWest</span>
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
                                    disabled={isUpdatingContractor === contractor.id}
                                    placeholder="01701, 01702, 01720..."
                                    className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
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
                                  disabled={isUpdatingContractor === contractor.id}
                                  className="w-16 text-xs px-1 py-1 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                                  min="0"
                                  step="0.01"
                                />
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-gray-500">Monthly: $</span>
                                <input
                                  type="number"
                                  value={contractor.monthly_subscription_fee || 99}
                                  onChange={(e) => updateContractorField(contractor.id, 'monthly_subscription_fee', parseFloat(e.target.value))}
                                  disabled={isUpdatingContractor === contractor.id}
                                  className="w-16 text-xs px-1 py-1 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                                  min="0"
                                  step="0.01"
                                />
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
                              onClick={() => setSelectedContractor(contractor)}
                              className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                            >
                              Edit Details
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
                              disabled={isUpdatingRole === profile.id}
                              className={`text-xs font-semibold rounded-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 ${getRoleColor(profile.role)}`}
                            >
                              <option value="homeowner">homeowner</option>
                              <option value="contractor">contractor</option>
                              <option value="admin">admin</option>
                            </select>
                            {isUpdatingRole === profile.id && (
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
                            <button className="text-blue-600 hover:text-blue-900 text-sm font-medium">
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteUser(profile)}
                              className="text-red-600 hover:text-red-900 text-sm font-medium"
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
                      {event.metadata && (
                        <div className="mt-2 text-xs text-gray-500">
                          <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                            {JSON.stringify(event.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

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
              <p className="text-gray-600">
                Are you sure you want to delete the account for{' '}
                <span className="font-semibold">{userToDelete.email}</span>?
              </p>
              <p className="text-sm text-red-600 mt-2">
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