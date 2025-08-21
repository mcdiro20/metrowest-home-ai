import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Building, 
  Mail, 
  Download, 
  Eye, 
  Calendar,
  TrendingUp,
  Award,
  BarChart3,
  RefreshCw,
  Plus,
  Search,
  Filter,
  Star,
  MapPin,
  Phone,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';

// Mock data and utilities since we don't have actual supabase
const mockSupabase = {
  auth: {
    getSession: async () => ({
      data: { session: { access_token: 'mock-token' } }
    })
  }
};

interface AdminStats {
  totalLeads: number;
  highValueLeads: number;
  mediumValueLeads: number;
  lowValueLeads: number;
  avgProbabilityScore: number;
  avgIntentScore: number;
  avgEngagementScore: number;
  avgLeadQualityScore: number;
  recentLeads: number;
  conversionRate: number;
}

interface ContractorStats {
  totalContractors: number;
  activeSubscribers: number;
  totalZipCodes: number;
  avgConversionRate: number;
  totalLeadsReceived: number;
  totalLeadsConverted: number;
}

interface UserStats {
  totalUsers: number;
  adminUsers: number;
  contractorUsers: number;
  homeownerUsers: number;
  activeUsers: number;
  avgTimeOnSite: number;
  totalAIRenderings: number;
}

// Mock Lead Dossier Component
const LeadDossier: React.FC<any> = ({ 
  name, 
  address, 
  zipCode, 
  homeValue, 
  budget, 
  zipIncomeTier, 
  intentScore, 
  engagementScore,
  intentScoreValue,
  leadQualityScore,
  probabilityToCloseScore,
  beforeImage,
  afterImage,
  contractorNotes 
}) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900">Contact Information</h4>
        <div className="space-y-2">
          <p><span className="font-medium">Name:</span> {name}</p>
          <p><span className="font-medium">Address:</span> {address}</p>
          <p><span className="font-medium">ZIP Code:</span> {zipCode}</p>
          <p><span className="font-medium">Estimated Home Value:</span> ${homeValue?.toLocaleString()}</p>
          <p><span className="font-medium">Estimated Budget:</span> ${budget?.toLocaleString()}</p>
          <p><span className="font-medium">Income Tier:</span> {zipIncomeTier}</p>
        </div>
      </div>
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900">Intelligence Scores</h4>
        <div className="space-y-2">
          <p><span className="font-medium">Intent Score:</span> {intentScoreValue}/100 ({intentScore})</p>
          <p><span className="font-medium">Engagement Score:</span> {engagementScore}/100</p>
          <p><span className="font-medium">Lead Quality Score:</span> {leadQualityScore}/100</p>
          <p><span className="font-medium">Probability to Close:</span> {probabilityToCloseScore}/100</p>
        </div>
      </div>
    </div>
    
    {(beforeImage || afterImage) && (
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900">Project Images</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {beforeImage && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Before</p>
              <img src={beforeImage} alt="Before" className="w-full h-48 object-cover rounded-lg" />
            </div>
          )}
          {afterImage && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">AI Rendering</p>
              <img src={afterImage} alt="AI Rendering" className="w-full h-48 object-cover rounded-lg" />
            </div>
          )}
        </div>
      </div>
    )}
    
    {contractorNotes && (
      <div className="space-y-2">
        <h4 className="font-semibold text-gray-900">Contractor Notes</h4>
        <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{contractorNotes}</p>
      </div>
    )}
  </div>
);

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'leads' | 'contractors' | 'users' | 'analytics' | 'emails'>('leads');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Data states
  const [leads, setLeads] = useState<any[]>([]);
  const [contractors, setContractors] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [leadStats, setLeadStats] = useState<AdminStats | null>(null);
  const [contractorStats, setContractorStats] = useState<ContractorStats | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  
  // UI states
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'high-value' | 'medium-value' | 'low-value'>('all');
  const [sentEmails, setSentEmails] = useState<any[]>([]);
  const [subscribers, setSubscribers] = useState<string[]>([]);

  // Mock data for demonstration
  const mockLeads = [
    {
      id: '1',
      name: 'John Smith',
      email: 'john@example.com',
      phone: '(555) 123-4567',
      zip: '02458',
      room_type: 'Kitchen',
      style: 'Modern',
      wants_quote: true,
      probability_to_close_score: 85,
      intent_score: 78,
      lead_quality_score: 82,
      engagement_score: 88,
      status: 'contacted',
      created_at: '2024-01-15T10:30:00Z',
      image_url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400',
      ai_url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&auto=format&fit=crop',
      contractor_notes: 'High-value lead, very interested in premium finishes'
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      phone: '(555) 987-6543',
      zip: '01701',
      room_type: 'Bathroom',
      style: 'Traditional',
      wants_quote: false,
      probability_to_close_score: 45,
      intent_score: 52,
      lead_quality_score: 48,
      engagement_score: 41,
      status: 'new',
      created_at: '2024-01-16T14:20:00Z'
    }
  ];

  const mockContractors = [
    {
      id: '1',
      name: 'Premier Renovations',
      email: 'contact@premier.com',
      serves_all_zipcodes: false,
      assigned_zip_codes: ['02458', '02459', '02460'],
      leads_converted_count: 12,
      leads_received_count: 25,
      conversion_rate: 48,
      is_active_subscriber: true,
      subscription_tier: 'Premium',
      created_at: '2023-06-01T00:00:00Z'
    },
    {
      id: '2',
      name: 'MetroWest Builders',
      email: 'info@metrowest.com',
      serves_all_zipcodes: true,
      assigned_zip_codes: [],
      leads_converted_count: 8,
      leads_received_count: 30,
      conversion_rate: 27,
      is_active_subscriber: true,
      subscription_tier: 'Standard',
      created_at: '2023-08-15T00:00:00Z'
    }
  ];

  const mockUsers = [
    {
      id: 'user-1',
      email: 'admin@example.com',
      role: 'admin',
      login_count: 45,
      ai_renderings_count: 0,
      total_time_on_site_ms: 3600000,
      last_login_at: '2024-01-16T09:00:00Z',
      leadStats: { totalLeads: 0, avgProbabilityScore: 0, convertedLeads: 0 }
    },
    {
      id: 'user-2',
      email: 'contractor@example.com',
      role: 'contractor',
      login_count: 23,
      ai_renderings_count: 5,
      total_time_on_site_ms: 1800000,
      last_login_at: '2024-01-15T16:30:00Z',
      leadStats: { totalLeads: 25, avgProbabilityScore: 65, convertedLeads: 12 }
    }
  ];

  useEffect(() => {
    // Load mock email data
    setSentEmails([
      {
        id: '1',
        recipient: 'john@example.com',
        roomType: 'Kitchen',
        selectedStyle: 'Modern',
        sentAt: '2024-01-15T10:30:00Z',
        subscribe: true
      }
    ]);
    setSubscribers(['john@example.com', 'sarah@example.com']);
  }, []);

  useEffect(() => {
    if (activeTab === 'leads') {
      fetchLeads();
    } else if (activeTab === 'contractors') {
      fetchContractors();
    } else if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  const getAuthToken = async () => {
    try {
      const { data: { session } } = await mockSupabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');
      return session.access_token;
    } catch (error) {
      throw new Error('Authentication failed');
    }
  };

  const fetchLeads = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLeads(mockLeads);
      setLeadStats({
        totalLeads: mockLeads.length,
        highValueLeads: mockLeads.filter(l => (l.probability_to_close_score || 0) >= 70).length,
        mediumValueLeads: mockLeads.filter(l => {
          const score = l.probability_to_close_score || 0;
          return score >= 40 && score < 70;
        }).length,
        lowValueLeads: mockLeads.filter(l => (l.probability_to_close_score || 0) < 40).length,
        avgProbabilityScore: Math.round(mockLeads.reduce((sum, l) => sum + (l.probability_to_close_score || 0), 0) / mockLeads.length),
        avgIntentScore: Math.round(mockLeads.reduce((sum, l) => sum + (l.intent_score || 0), 0) / mockLeads.length),
        avgEngagementScore: Math.round(mockLeads.reduce((sum, l) => sum + (l.engagement_score || 0), 0) / mockLeads.length),
        avgLeadQualityScore: Math.round(mockLeads.reduce((sum, l) => sum + (l.lead_quality_score || 0), 0) / mockLeads.length),
        recentLeads: mockLeads.filter(l => {
          const created = new Date(l.created_at);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return created > weekAgo;
        }).length,
        conversionRate: 24.5
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch leads');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchContractors = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      setContractors(mockContractors);
      setContractorStats({
        totalContractors: mockContractors.length,
        activeSubscribers: mockContractors.filter(c => c.is_active_subscriber).length,
        totalZipCodes: 15,
        avgConversionRate: Math.round(mockContractors.reduce((sum, c) => sum + c.conversion_rate, 0) / mockContractors.length),
        totalLeadsReceived: mockContractors.reduce((sum, c) => sum + c.leads_received_count, 0),
        totalLeadsConverted: mockContractors.reduce((sum, c) => sum + c.leads_converted_count, 0)
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch contractors');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 600));
      setUsers(mockUsers);
      setUserStats({
        totalUsers: mockUsers.length,
        adminUsers: mockUsers.filter(u => u.role === 'admin').length,
        contractorUsers: mockUsers.filter(u => u.role === 'contractor').length,
        homeownerUsers: mockUsers.filter(u => u.role === 'homeowner').length,
        activeUsers: mockUsers.filter(u => {
          if (!u.last_login_at) return false;
          const lastLogin = new Date(u.last_login_at);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return lastLogin > weekAgo;
        }).length,
        avgTimeOnSite: Math.round(mockUsers.reduce((sum, u) => sum + ((u.total_time_on_site_ms || 0) / (60 * 1000)), 0) / mockUsers.length),
        totalAIRenderings: mockUsers.reduce((sum, u) => sum + (u.ai_renderings_count || 0), 0)
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  const recalculateAllScores = async () => {
    setIsLoading(true);
    try {
      await getAuthToken();
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Refresh leads data
      await fetchLeads();
      alert(`Successfully recalculated scores for ${leads.length} leads`);
    } catch (err) {
      alert(`Failed to recalculate scores: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-amber-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-100 text-emerald-800';
    if (score >= 60) return 'bg-amber-100 text-amber-800';
    if (score >= 40) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = !searchTerm || 
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.zip?.includes(searchTerm);

    if (!matchesSearch) return false;

    switch (selectedFilter) {
      case 'high-value':
        return (lead.probability_to_close_score || 0) >= 70;
      case 'medium-value':
        const score = lead.probability_to_close_score || 0;
        return score >= 40 && score < 70;
      case 'low-value':
        return (lead.probability_to_close_score || 0) < 40;
      default:
        return true;
    }
  });

  const downloadData = () => {
    const exportData = {
      leads: filteredLeads,
      contractors,
      users,
      stats: { leadStats, contractorStats, userStats },
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: 'leads', label: 'Leads', icon: Users, count: leads.length },
    { id: 'contractors', label: 'Contractors', icon: Building, count: contractors.length },
    { id: 'users', label: 'Users', icon: Users, count: users.length },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'emails', label: 'Emails', icon: Mail, count: sentEmails.length }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">MetroWest Home AI - Lead Intelligence & Management</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={recalculateAllScores}
                disabled={isLoading}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Recalculate Scores
              </button>
              <button
                onClick={downloadData}
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
        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                      activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Leads Tab */}
        {activeTab === 'leads' && (
          <div className="space-y-6">
            {/* Lead Stats Cards */}
            {leadStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{leadStats.totalLeads}</h3>
                      <p className="text-gray-600">Total Leads</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <Award className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{leadStats.highValueLeads}</h3>
                      <p className="text-gray-600">High Value (70+)</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{leadStats.avgProbabilityScore}</h3>
                      <p className="text-gray-600">Avg Close Probability</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{leadStats.conversionRate.toFixed(1)}%</h3>
                      <p className="text-gray-600">Conversion Rate</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Search and Filters */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search leads by name, email, or ZIP code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Leads</option>
                  <option value="high-value">High Value (70+)</option>
                  <option value="medium-value">Medium Value (40-69)</option>
                  <option value="low-value">Low Value (&lt;40)</option>
                </select>
              </div>
            </div>

            {/* Leads Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Leads ({filteredLeads.length})
                </h3>
              </div>
              
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading leads...</p>
                </div>
              ) : filteredLeads.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No leads found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Project
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Intelligence Scores
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
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
                              {lead.email && (
                                <div className="flex items-center gap-1 text-sm text-gray-500">
                                  <Mail className="w-3 h-3" />
                                  {lead.email}
                                </div>
                              )}
                              {lead.phone && (
                                <div className="flex items-center gap-1 text-sm text-gray-500">
                                  <Phone className="w-3 h-3" />
                                  {lead.phone}
                                </div>
                              )}
                              <div className="flex items-center gap-1 text-sm text-gray-500">
                                <MapPin className="w-3 h-3" />
                                {lead.zip}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {lead.room_type}
                              </div>
                              <div className="text-sm text-gray-500">{lead.style}</div>
                              {lead.wants_quote && (
                                <div className="text-xs text-emerald-600 font-medium">
                                  Wants Quote
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 w-16">Close:</span>
                                <span className={`text-sm font-bold ${getScoreColor(lead.probability_to_close_score || 0)}`}>
                                  {lead.probability_to_close_score || 0}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 w-16">Intent:</span>
                                <span className={`text-sm font-medium ${getScoreColor(lead.intent_score || 0)}`}>
                                  {lead.intent_score || 0}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 w-16">Quality:</span>
                                <span className={`text-sm font-medium ${getScoreColor(lead.lead_quality_score || 0)}`}>
                                  {lead.lead_quality_score || 0}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              lead.status === 'converted' ? 'bg-emerald-100 text-emerald-800' :
                              lead.status === 'quoted' ? 'bg-blue-100 text-blue-800' :
                              lead.status === 'contacted' ? 'bg-amber-100 text-amber-800' :
                              lead.status === 'assigned' ? 'bg-purple-100 text-purple-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {lead.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Calendar className="w-3 h-3" />
                              {new Date(lead.created_at).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => setSelectedLead(lead)}
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-900 text-sm font-medium"
                            >
                              <Eye className="w-3 h-3" />
                              View Dossier
                            </button>
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

        {/* Contractors Tab */}
        {activeTab === 'contractors' && (
          <div className="space-y-6">
            {/* Contractor Stats */}
            {contractorStats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Building className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{contractorStats.totalContractors}</h3>
                      <p className="text-gray-600">Total Contractors</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{contractorStats.activeSubscribers}</h3>
                      <p className="text-gray-600">Active Subscribers</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{contractorStats.avgConversionRate}%</h3>
                      <p className="text-gray-600">Avg Conversion Rate</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Contractors Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Contractors ({contractors.length})
                </h3>
              </div>
              
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading contractors...</p>
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
                          Service Areas
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Performance
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Subscription
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
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
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {contractor.serves_all_zipcodes ? (
                                <span className="text-emerald-600 font-medium">All MetroWest</span>
                              ) : (
                                <div className="flex flex-wrap gap-1">
                                  {(contractor.assigned_zip_codes || []).slice(0, 3).map((zip: string) => (
                                    <span key={zip} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                      {zip}
                                    </span>
                                  ))}
                                  {(contractor.assigned_zip_codes || []).length > 3 && (
                                    <span className="text-gray-500 text-xs">
                                      +{(contractor.assigned_zip_codes || []).length - 3} more
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="space-y-1">
                              <div className="text-sm text-gray-900">
                                {contractor.leads_converted_count || 0}/{contractor.leads_received_count || 0} converted
                              </div>
                              <div className="text-xs text-gray-500">
                                {contractor.conversion_rate || 0}% rate
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="space-y-1">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                contractor.is_active_subscriber 
                                  ? 'bg-emerald-100 text-emerald-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {contractor.is_active_subscriber ? 'Active' : 'Inactive'}
                              </span>
                              <div className="text-xs text-gray-500">
                                {contractor.subscription_tier}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {new Date(contractor.created_at).toLocaleDateString()}
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

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* User Stats */}
            {userStats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{userStats.totalUsers}</h3>
                      <p className="text-gray-600">Total Users</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{userStats.activeUsers}</h3>
                      <p className="text-gray-600">Active This Week</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{userStats.avgTimeOnSite}</h3>
                      <p className="text-gray-600">Avg Time (min)</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                      <Star className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{userStats.totalAIRenderings}</h3>
                      <p className="text-gray-600">AI Renderings</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Users ({users.length})
                </h3>
              </div>
              
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading users...</p>
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
                          Activity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Lead Performance
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Login
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {user.email}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {user.id.substring(0, 8)}...
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.role === 'admin' ? 'bg-red-100 text-red-800' :
                              user.role === 'contractor' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="space-y-1">
                              <div className="text-sm text-gray-900">
                                {user.login_count || 0} logins
                              </div>
                              <div className="text-xs text-gray-500">
                                {user.ai_renderings_count || 0} renderings
                              </div>
                              <div className="text-xs text-gray-500">
                                {Math.round((user.total_time_on_site_ms || 0) / (60 * 1000))}m on site
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="space-y-1">
                              <div className="text-sm text-gray-900">
                                {user.leadStats?.totalLeads || 0} leads
                              </div>
                              <div className="text-xs text-gray-500">
                                Avg score: {user.leadStats?.avgProbabilityScore || 0}
                              </div>
                              <div className="text-xs text-gray-500">
                                {user.leadStats?.convertedLeads || 0} converted
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {user.last_login_at ? 
                                new Date(user.last_login_at).toLocaleDateString() : 
                                'Never'
                              }
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

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Score Distribution Analysis</h3>
              {leadStats && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-3">Lead Value Distribution</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">High Value (70+)</span>
                        <span className="text-sm font-medium text-emerald-600">{leadStats.highValueLeads}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Medium Value (40-69)</span>
                        <span className="text-sm font-medium text-amber-600">{leadStats.mediumValueLeads}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Low Value (&lt;40)</span>
                        <span className="text-sm font-medium text-red-600">{leadStats.lowValueLeads}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-3">Average Scores</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Probability to Close</span>
                        <span className="text-sm font-medium">{leadStats.avgProbabilityScore}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Intent Score</span>
                        <span className="text-sm font-medium">{leadStats.avgIntentScore}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Engagement Score</span>
                        <span className="text-sm font-medium">{leadStats.avgEngagementScore}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Lead Quality Score</span>
                        <span className="text-sm font-medium">{leadStats.avgLeadQualityScore}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Emails Tab (Legacy functionality) */}
        {activeTab === 'emails' && (
          <div className="space-y-6">
            {/* Email Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Mail className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{sentEmails.length}</h3>
                    <p className="text-gray-600">Emails Sent</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{subscribers.length}</h3>
                    <p className="text-gray-600">Subscribers</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {sentEmails.filter(email => {
                        const sentDate = new Date(email.sentAt);
                        const today = new Date();
                        return sentDate.toDateString() === today.toDateString();
                      }).length}
                    </h3>
                    <p className="text-gray-600">Today's Emails</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Legacy Email Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Sent Emails (Legacy)</h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Recipient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Project
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sent At
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subscribed
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sentEmails.map((email) => (
                      <tr key={email.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {email.recipient}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm text-gray-900">{email.roomType}</div>
                            <div className="text-sm text-gray-500">{email.selectedStyle}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(email.sentAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            email.subscribe 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {email.subscribe ? 'Yes' : 'No'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lead Dossier Modal */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-semibold">Lead Intelligence Dossier</h3>
              <button
                onClick={() => setSelectedLead(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <LeadDossier
                name={selectedLead.name || 'Anonymous Lead'}
                address={`${selectedLead.zip}, MetroWest MA`}
                zipCode={selectedLead.zip}
                homeValue={selectedLead.zip?.startsWith('024') ? 850000 : 485000}
                budget={selectedLead.wants_quote ? 75000 : 45000}
                zipIncomeTier={selectedLead.zip?.startsWith('024') ? 'High' : 'Medium'}
                intentScore={selectedLead.intent_score >= 70 ? 'High' : selectedLead.intent_score >= 40 ? 'Medium' : 'Low'}
                engagementScore={selectedLead.engagement_score || 0}
                intentScoreValue={selectedLead.intent_score || 0}
                leadQualityScore={selectedLead.lead_quality_score || 0}
                probabilityToCloseScore={selectedLead.probability_to_close_score || 0}
                beforeImage={selectedLead.image_url}
                afterImage={selectedLead.ai_url}
                contractorNotes={selectedLead.contractor_notes}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;