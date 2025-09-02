import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { AlertCircle, ArrowLeft, Users, Briefcase, LayoutDashboard, Mail, Phone, MapPin, Calendar, DollarSign, TrendingUp, Star, Trash2, Edit, RefreshCcw, UserPlus } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { Lead, Profile, Contractor, LeadAssignment } from '../lib/supabase';
import AddContractorModal from './AddContractorModal';
import EditContractorModal from './EditContractorModal';
import AssignLeadModal from './AssignLeadModal';

const AdminPanel: React.FC = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [usersData, setUsersData] = useState<Profile[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [assignments, setAssignments] = useState<LeadAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddContractorModal, setShowAddContractorModal] = useState(false);
  const [showEditContractorModal, setShowEditContractorModal] = useState(false);
  const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null);

  // State for lead assignment modal
  const [showAssignLeadModal, setShowAssignLeadModal] = useState(false);
  const [selectedLeadForAssignment, setSelectedLeadForAssignment] = useState<Lead | null>(null);

  // State for dashboard summary data
  const [dashboardSummary, setDashboardSummary] = useState({
    leads: { totalLeads: 0, newLeads: 0, convertedLeads: 0, assignedLeads: 0, quotedLeads: 0, avgProbabilityScore: 0 },
    users: { totalUsers: 0, homeowners: 0, contractors: 0, admins: 0 },
    contractors: { totalContractors: 0, activeSubscribers: 0, avgConversionRate: 0 },
  });

  useEffect(() => {
    const fetchUser = async () => {
      if (!supabase) {
        setError('Supabase not configured.');
        setIsLoading(false);
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchData(activeTab);
    }
  }, [user, activeTab]);

  const fetchData = async (tab: string) => {
    setIsLoading(true);
    setError(null);
    try {
      if (!supabase) {
        throw new Error('Supabase not configured');
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Authentication required.');
        setIsLoading(false);
        return;
      }

      const token = session.access_token;

      let response;
      switch (tab) {
        case 'dashboard':
          // Fetch optimized summary data for dashboard
          response = await fetch('/api/admin/get-dashboard-summary', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const summaryResult = await response.json();
          if (!summaryResult.success) throw new Error(summaryResult.error);
          setDashboardSummary(summaryResult.data);
          break;
        case 'leads':
          response = await fetch('/api/admin/get-all-leads', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const leadsResult = await response.json();
          if (!leadsResult.success) throw new Error(leadsResult.error);
          setLeads(leadsResult.leads);
          break;
        case 'users':
          response = await fetch('/api/admin/get-all-users', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const usersResult = await response.json();
          if (!usersResult.success) throw new Error(usersResult.error);
          setUsersData(usersResult.users);
          break;
        case 'contractors':
          response = await fetch('/api/admin/get-all-contractors', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const contractorsResult = await response.json();
          if (!contractorsResult.success) throw new Error(contractorsResult.error);
          setContractors(contractorsResult.contractors);
          break;
        case 'assignments':
          response = await fetch('/api/leads/get-assignments', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const assignmentsResult = await response.json();
          if (!assignmentsResult.success) throw new Error(assignmentsResult.error);
          setAssignments(assignmentsResult.assignments);
          break;
        default:
          break;
      }
    } catch (err: any) {
      console.error(`Error fetching data for ${activeTab}:`, err);
      setError(err.message || `Failed to fetch data for ${activeTab}.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!confirm(`Are you sure you want to change the role of this user to ${newRole}?`)) {
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      if (!supabase) {
        throw new Error('Supabase not configured');
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Authentication required.');

      const response = await fetch('/api/admin/update-user-role', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ userId, newRole })
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      fetchData('users');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      if (!supabase) {
        throw new Error('Supabase not configured');
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Authentication required.');

      const response = await fetch('/api/admin/delete-user', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ userId })
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      fetchData('users');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecalculateScores = async () => {
    if (!confirm('Are you sure you want to recalculate all lead scores? This may take some time.')) {
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      if (!supabase) {
        throw new Error('Supabase not configured');
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Authentication required.');

      const response = await fetch('/api/recalculate-lead-scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      alert('Lead scores recalculated successfully!');
      fetchData('leads');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAssignLeadModal = (lead: Lead) => {
    setSelectedLeadForAssignment(lead);
    setShowAssignLeadModal(true);
  };

  const handleAssignLeadSuccess = () => {
    setShowAssignLeadModal(false);
    fetchData('leads'); // Refresh leads data after assignment
  };

  const renderLeadsTable = () => (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">All Leads ({leads.length})</h3>
        <button
          onClick={handleRecalculateScores}
          className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
        >
          <RefreshCcw className="w-4 h-4" />
          Recalculate Scores
        </button>
      </div>
      {isLoading ? (
        <div className="p-6 text-center">Loading leads...</div>
      ) : error ? (
        <div className="p-6 text-center text-red-600">{error}</div>
      ) : leads.length === 0 ? (
        <div className="p-6 text-center text-gray-600">No leads found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scores</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{lead.name || 'N/A'}</div>
                    <div className="text-sm text-gray-500">{lead.email}</div>
                    <div className="text-sm text-gray-500">{lead.phone || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{lead.room_type} - {lead.style}</div>
                    <div className="text-sm text-gray-500">ZIP: {lead.zip}</div>
                    <div className="text-sm text-gray-500">Wants Quote: {lead.wants_quote ? 'Yes' : 'No'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">Prob: {lead.probability_to_close_score}%</div>
                    <div className="text-sm text-gray-500">Intent: {lead.intent_score}</div>
                    <div className="text-sm text-gray-500">Quality: {lead.lead_quality_score}</div>
                    <div className="text-sm text-gray-500">Engage: {lead.engagement_score}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      lead.status === 'converted' ? 'bg-green-100 text-green-800' :
                      lead.status === 'quoted' ? 'bg-blue-100 text-blue-800' :
                      lead.status === 'assigned' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(lead as any).contractors ? (lead as any).contractors.name : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(lead.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleOpenAssignLeadModal(lead)}
                      className="text-blue-600 hover:text-blue-900 transition-colors"
                      title="Assign Lead to Contractors"
                    >
                      <UserPlus className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderUsersTable = () => (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">All Users ({usersData.length})</h3>
      </div>
      {isLoading ? (
        <div className="p-6 text-center">Loading users...</div>
      ) : error ? (
        <div className="p-6 text-center text-red-600">{error}</div>
      ) : usersData.length === 0 ? (
        <div className="p-6 text-center text-gray-600">No users found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {usersData.map((userItem) => (
                <tr key={userItem.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{userItem.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={userItem.role}
                      onChange={(e) => handleRoleChange(userItem.id, e.target.value)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                      <option value="homeowner">Homeowner</option>
                      <option value="contractor">Contractor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>Logins: {userItem.login_count}</div>
                    <div>AI Renders: {userItem.ai_renderings_count}</div>
                    <div>Time on Site: {Math.round((userItem.total_time_on_site_ms || 0) / 60000)} min</div>
                    <div>Last Login: {userItem.last_login_at ? new Date(userItem.last_login_at).toLocaleDateString() : 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(userItem.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {user?.id !== userItem.id ? (
                      <button
                        onClick={() => handleDeleteUser(userItem.id)}
                        className="text-red-600 hover:text-red-900 ml-4"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    ) : (
                      <span className="text-gray-400 ml-4" title="Cannot delete your own account">
                        <Trash2 className="w-5 h-5" />
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderContractorsTable = () => (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">All Contractors ({contractors.length})</h3>
        <button
          onClick={() => setShowAddContractorModal(true)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
        >
          <Users className="w-4 h-4" />
          Add New Contractor
        </button>
      </div>
      {isLoading ? (
        <div className="p-6 text-center">Loading contractors...</div>
      ) : error ? (
        <div className="p-6 text-center text-red-600">{error}</div>
      ) : contractors.length === 0 ? (
        <div className="p-6 text-center text-gray-600">No contractors found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name / Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Area</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pricing</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subscription</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {contractors.map((contractorItem) => (
                <tr key={contractorItem.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{contractorItem.name}</div>
                    <div className="text-sm text-gray-500">{contractorItem.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {contractorItem.serves_all_zipcodes ? (
                      <span className="text-sm text-gray-900">All MetroWest</span>
                    ) : (
                      <div className="text-sm text-gray-500 max-w-xs truncate">
                        {contractorItem.assigned_zip_codes?.join(', ') || 'N/A'}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">$/Lead: ${contractorItem.price_per_lead?.toFixed(2)}</div>
                    <div className="text-sm text-gray-500">Monthly: ${contractorItem.monthly_subscription_fee?.toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">Tier: {contractorItem.subscription_tier}</div>
                    <div className={`text-sm font-medium ${contractorItem.is_active_subscriber ? 'text-green-600' : 'text-red-600'}`}>
                      {contractorItem.is_active_subscriber ? 'Active' : 'Inactive'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>Leads Rec: {contractorItem.leads_received_count}</div>
                    <div>Leads Conv: {contractorItem.leads_converted_count}</div>
                    <div>Conv Rate: {contractorItem.conversion_rate?.toFixed(2)}%</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedContractor(contractorItem);
                        setShowEditContractorModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderAssignmentsTable = () => (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Lead Assignments ({assignments.length})</h3>
      </div>
      {isLoading ? (
        <div className="p-6 text-center">Loading assignments...</div>
      ) : error ? (
        <div className="p-6 text-center text-red-600">{error}</div>
      ) : assignments.length === 0 ? (
        <div className="p-6 text-center text-gray-600">No assignments found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contractor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned At</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contractor Responded</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {assignments.map((assignment) => (
                <tr key={assignment.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{(assignment as any).leads?.email || 'N/A'}</div>
                    <div className="text-sm text-gray-500">{(assignment as any).leads?.zip} - {(assignment as any).leads?.room_type}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{(assignment as any).contractors?.name || 'N/A'}</div>
                    <div className="text-sm text-gray-500">{(assignment as any).contractors?.email || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(assignment.assigned_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {assignment.assignment_method}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>Sent: {assignment.email_sent ? 'Yes' : 'No'}</div>
                    <div>Opened: {assignment.email_opened ? 'Yes' : 'No'}</div>
                    <div>Clicked: {assignment.email_clicked ? 'Yes' : 'No'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {assignment.contractor_responded ? 'Yes' : 'No'}
                    {assignment.response_time_hours && ` (${assignment.response_time_hours} hrs)`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderDashboard = () => {
    return (
      <div className="space-y-8">
        <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard Overview</h2>

        {isLoading ? (
          <div className="p-6 text-center">Loading dashboard data...</div>
        ) : error ? (
          <div className="p-6 text-center text-red-600">{error}</div>
        ) : (
          <>
            {/* Leads Overview */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Leads Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="border p-4 rounded-lg text-center">
                  <p className="text-3xl font-bold text-blue-600">{dashboardSummary.leads.totalLeads}</p>
                  <p className="text-gray-500">Total Leads</p>
                </div>
                <div className="border p-4 rounded-lg text-center">
                  <p className="text-3xl font-bold text-yellow-600">{dashboardSummary.leads.newLeads}</p>
                  <p className="text-gray-500">New Leads</p>
                </div>
                <div className="border p-4 rounded-lg text-center">
                  <p className="text-3xl font-bold text-green-600">{dashboardSummary.leads.convertedLeads}</p>
                  <p className="text-gray-500">Converted Leads</p>
                </div>
                <div className="border p-4 rounded-lg text-center">
                  <p className="text-3xl font-bold text-purple-600">{dashboardSummary.leads.avgProbabilityScore}%</p>
                  <p className="text-gray-500">Avg. Prob. to Close</p>
                </div>
              </div>
            </div>

            {/* Users Overview */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Users Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="border p-4 rounded-lg text-center">
                  <p className="text-3xl font-bold text-blue-600">{dashboardSummary.users.totalUsers}</p>
                  <p className="text-gray-500">Total Users</p>
                </div>
                <div className="border p-4 rounded-lg text-center">
                  <p className="text-3xl font-bold text-emerald-600">{dashboardSummary.users.homeowners}</p>
                  <p className="text-gray-500">Homeowners</p>
                </div>
                <div className="border p-4 rounded-lg text-center">
                  <p className="text-3xl font-bold text-orange-600">{dashboardSummary.users.contractors}</p>
                  <p className="text-gray-500">Contractors</p>
                </div>
                <div className="border p-4 rounded-lg text-center">
                  <p className="text-3xl font-bold text-red-600">{dashboardSummary.users.admins}</p>
                  <p className="text-gray-500">Admins</p>
                </div>
              </div>
            </div>

            {/* Contractors Overview */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Contractors Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border p-4 rounded-lg text-center">
                  <p className="text-3xl font-bold text-blue-600">{dashboardSummary.contractors.totalContractors}</p>
                  <p className="text-gray-500">Total Contractors</p>
                </div>
                <div className="border p-4 rounded-lg text-center">
                  <p className="text-3xl font-bold text-green-600">{dashboardSummary.contractors.activeSubscribers}</p>
                  <p className="text-gray-500">Active Subscribers</p>
                </div>
                <div className="border p-4 rounded-lg text-center">
                  <p className="text-3xl font-bold text-purple-600">{dashboardSummary.contractors.avgConversionRate}%</p>
                  <p className="text-gray-500">Avg. Conversion Rate</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <Link
                to="/"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm mb-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-gray-600">Manage your MetroWest Home AI platform</p>
            </div>
            <div className="flex items-center gap-4">
              {user && (
                <div className="text-gray-700 text-sm">
                  Logged in as: <span className="font-medium">{user.email}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="sm:hidden">
            <label htmlFor="tabs" className="sr-only">Select a tab</label>
            <select
              id="tabs"
              name="tabs"
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
            >
              <option value="dashboard">Dashboard</option>
              <option value="leads">Leads</option>
              <option value="users">Users</option>
              <option value="contractors">Contractors</option>
              <option value="assignments">Assignments</option>
            </select>
          </div>
          <div className="hidden sm:block">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`${
                  activeTab === 'dashboard'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
              >
                <LayoutDashboard className="w-5 h-5" />
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('leads')}
                className={`${
                  activeTab === 'leads'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
              >
                <Mail className="w-5 h-5" />
                Leads
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`${
                  activeTab === 'users'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
              >
                <Users className="w-5 h-5" />
                Users
              </button>
              <button
                onClick={() => setActiveTab('contractors')}
                className={`${
                  activeTab === 'contractors'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
              >
                <Briefcase className="w-5 h-5" />
                Contractors
              </button>
              <button
                onClick={() => setActiveTab('assignments')}
                className={`${
                  activeTab === 'assignments'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
              >
                <TrendingUp className="w-5 h-5" />
                Assignments
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'leads' && renderLeadsTable()}
        {activeTab === 'users' && renderUsersTable()}
        {activeTab === 'contractors' && renderContractorsTable()}
        {activeTab === 'assignments' && renderAssignmentsTable()}
      </div>

      <AddContractorModal
        isOpen={showAddContractorModal}
        onClose={() => setShowAddContractorModal(false)}
        onSuccess={() => fetchData('contractors')}
      />
      {selectedContractor && (
        <EditContractorModal
          isOpen={showEditContractorModal}
          onClose={() => setShowEditContractorModal(false)}
          onSuccess={() => fetchData('contractors')}
          contractor={selectedContractor}
        />
      )}
      <AssignLeadModal
        isOpen={showAssignLeadModal}
        onClose={() => setShowAssignLeadModal(false)}
        lead={selectedLeadForAssignment}
        onAssignSuccess={handleAssignLeadSuccess}
      />
    </div>
  );
};

export default AdminPanel;