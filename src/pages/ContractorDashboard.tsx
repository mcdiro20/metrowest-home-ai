import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Star, 
  TrendingUp, 
  Clock,
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Eye,
  Download,
  Filter,
  Search,
  ArrowLeft,
  Home,
  Zap,
  Award,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Lead } from '../lib/supabase';

interface ContractorStats {
  totalLeads: number;
  highValueLeads: number;
  recentLeads: number;
  avgLeadScore: number;
}

interface ContractorInfo {
  name: string;
  assigned_zip_codes: string[];
}

interface ContractorDashboardData {
  leads: Lead[];
  contractor: ContractorInfo;
  stats: ContractorStats;
  assignedZipCodes: string[];
}

const ContractorDashboard: React.FC = () => {
  const [data, setData] = useState<ContractorDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'high-value' | 'recent'>('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  useEffect(() => {
    fetchContractorLeads();
  }, []);

  const fetchContractorLeads = async () => {
    if (!supabase) {
      setError('Supabase not configured');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Please log in to access contractor dashboard');
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/contractor/leads', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch contractor leads');
      }

      setData(result);
    } catch (err) {
      console.error('Error fetching contractor leads:', err);
      setError(err instanceof Error ? err.message : 'Failed to load contractor dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const getLeadPriorityColor = (score: number) => {
    if (score >= 70) return 'bg-red-100 text-red-800';
    if (score >= 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getLeadPriorityLabel = (score: number) => {
    if (score >= 70) return 'High Priority';
    if (score >= 50) return 'Medium Priority';
    return 'Low Priority';
  };

  const filteredLeads = data?.leads.filter(lead => {
    // Apply search filter
    const matchesSearch = !searchTerm || 
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.zip?.includes(searchTerm);

    if (!matchesSearch) return false;

    // Apply priority filter
    switch (selectedFilter) {
      case 'high-value':
        return (lead.lead_score || 0) >= 50;
      case 'recent':
        const leadDate = new Date(lead.created_at);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return leadDate >= weekAgo;
      default:
        return true;
    }
  }) || [];

  const exportLeads = () => {
    if (!data) return;
    
    const exportData = {
      contractor: data.contractor,
      leads: filteredLeads,
      stats: data.stats,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contractor-leads-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading contractor dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link 
            to="/"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">No data available</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Contractor Dashboard</h1>
              <p className="text-gray-600">
                Welcome back, {data.contractor.name} • Serving {data.assignedZipCodes.join(', ')}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={exportLeads}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Export Leads
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{data.stats.totalLeads}</h3>
                <p className="text-gray-600">Total Leads</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{data.stats.highValueLeads}</h3>
                <p className="text-gray-600">High Value Leads</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{data.stats.recentLeads}</h3>
                <p className="text-gray-600">This Week</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{data.stats.avgLeadScore}</h3>
                <p className="text-gray-600">Avg Lead Score</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
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
            <div className="flex gap-2">
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Leads</option>
                <option value="high-value">High Value</option>
                <option value="recent">Recent</option>
              </select>
            </div>
          </div>
        </div>

        {/* Leads Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Your Leads ({filteredLeads.length})
            </h3>
          </div>
          
          {filteredLeads.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No leads found</h3>
              <p className="text-gray-600">
                {searchTerm || selectedFilter !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'New leads will appear here when homeowners request quotes in your service areas'
                }
              </p>
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
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
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
                          {lead.wants_quote && (
                            <div className="text-xs text-emerald-600 font-medium">
                              Wants Quote
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLeadPriorityColor(lead.lead_score || 0)}`}>
                            {getLeadPriorityLabel(lead.lead_score || 0)}
                          </span>
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-400" />
                            <span className="text-xs text-gray-600">{lead.lead_score}</span>
                          </div>
                        </div>
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
                          View Details
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

      {/* Lead Details Modal */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-semibold">Lead Details</h3>
              <button
                onClick={() => setSelectedLead(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Contact Information */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Contact Information</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Name</label>
                      <p className="text-gray-900">{selectedLead.name || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="text-gray-900">{selectedLead.email || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone</label>
                      <p className="text-gray-900">{selectedLead.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">ZIP Code</label>
                      <p className="text-gray-900">{selectedLead.zip}</p>
                    </div>
                  </div>
                </div>

                {/* Project Information */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Project Information</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Room Type</label>
                      <p className="text-gray-900">{selectedLead.room_type}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Style</label>
                      <p className="text-gray-900">{selectedLead.style}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Lead Score</label>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-900">{selectedLead.lead_score}</span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLeadPriorityColor(selectedLead.lead_score || 0)}`}>
                          {getLeadPriorityLabel(selectedLead.lead_score || 0)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Wants Quote</label>
                      <p className="text-gray-900">{selectedLead.wants_quote ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Images */}
              {(selectedLead.image_url || selectedLead.ai_url) && (
                <div className="mt-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Project Images</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedLead.image_url && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 mb-2 block">Before</label>
                        <img 
                          src={selectedLead.image_url} 
                          alt="Before" 
                          className="w-full h-48 object-cover rounded-lg border"
                        />
                      </div>
                    )}
                    {selectedLead.ai_url && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 mb-2 block">After (AI Generated)</label>
                        <img 
                          src={selectedLead.ai_url} 
                          alt="After" 
                          className="w-full h-48 object-cover rounded-lg border"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-6 flex gap-3">
                {selectedLead.email && (
                  <a
                    href={`mailto:${selectedLead.email}?subject=Your Home Renovation Project&body=Hi ${selectedLead.name || 'there'},%0D%0A%0D%0AI saw your ${selectedLead.room_type} renovation project and would love to discuss providing a quote.`}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Send Email
                  </a>
                )}
                {selectedLead.phone && (
                  <a
                    href={`tel:${selectedLead.phone}`}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Call Now
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractorDashboard;