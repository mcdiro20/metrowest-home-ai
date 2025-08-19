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
  CheckCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import LeadDossier from './LeadDossier';

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

  useEffect(() => {
    // Load legacy email data for the emails tab
    setSentEmails(JSON.parse(localStorage.getItem('sentEmails') || '[]'));
    setSubscribers(JSON.parse(localStorage.getItem('newsletterSubscribers') || '[]'));
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
    if (!supabase) throw new Error('Supabase not configured');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');
    return session.access_token;
  };

  const fetchLeads = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await getAuthToken();
      const response = await fetch('/api/admin/get-all-leads', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      setLeads(result.leads);
      setLeadStats(result.stats);
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
      const token = await getAuthToken();
      const response = await fetch('/api/admin/get-all-contractors', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      setContractors(result.contractors);
      setContractorStats(result.stats);
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
      const token = await getAuthToken();
      const response = await fetch('/api/admin/get-all-users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      setUsers(result.users);
      setUserStats(result.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  const recalculateAllScores = async () => {
    setIsLoading(true);
    try {
      const token = await getAuthToken();
      const response = await fetch('/api/recalculate-lead-scores', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      
      // Refresh leads data
      await fetchLeads();
      alert(`Successfully recalculated scores for ${result.updatedCount} leads`);
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
                  <option value="low-value">Low Value (<40)</option>
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
                        <span className="text-sm text-gray-600">Low Value (<40)</span>
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
                homeValue={selectedLead.zip?.startsWith('024') ? 850000 : 485000} // Demo values based on ZIP
                budget={selectedLead.wants_quote ? 75000 : 45000} // Demo values
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