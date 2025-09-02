import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, MapPin, Home, Check, Loader2, AlertCircle, UserPlus, Shuffle, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Lead, Contractor } from '../lib/supabase';
import { LeadManagementService } from '../services/leadManagementService';

interface AssignLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  onAssignSuccess: () => void;
}

const AssignLeadModal: React.FC<AssignLeadModalProps> = ({ isOpen, onClose, lead, onAssignSuccess }) => {
  const [availableContractors, setAvailableContractors] = useState<Contractor[]>([]);
  const [eligibleContractors, setEligibleContractors] = useState<Contractor[]>([]);
  const [selectedContractorIds, setSelectedContractorIds] = useState<string[]>([]);
  const [assignmentMode, setAssignmentMode] = useState<'manual' | 'round-robin' | 'next-in-line'>('manual');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && lead) {
      fetchContractors();
      // Pre-select assigned contractor if any
      if (lead.assigned_contractor_id) {
        setSelectedContractorIds([lead.assigned_contractor_id]);
      } else {
        setSelectedContractorIds([]);
      }
      setSuccessMessage(null);
      setError(null);
    }
  }, [isOpen, lead]);

  const fetchContractors = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!supabase) {
        throw new Error('Supabase not configured');
      }
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Authentication required.');
      }

      const response = await fetch('/api/admin/get-all-contractors', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch contractors.');
      }
      
      const allContractors = result.contractors;
      setAvailableContractors(allContractors);
      
      // Filter contractors eligible for this lead's ZIP code
      const eligible = allContractors.filter((contractor: Contractor) => 
        contractor.is_active_subscriber && (
          contractor.serves_all_zipcodes || 
          contractor.assigned_zip_codes?.includes(lead?.zip || '')
        )
      );
      setEligibleContractors(eligible);
      
    } catch (err: any) {
      setError(err.message || 'Failed to load contractors.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContractorToggle = (contractorId: string) => {
    setSelectedContractorIds(prev =>
      prev.includes(contractorId)
        ? prev.filter(id => id !== contractorId)
        : [...prev, contractorId]
    );
  };

  const handleRoundRobinAssignment = () => {
    if (eligibleContractors.length === 0) {
      setError('No eligible contractors found for this ZIP code.');
      return;
    }
    
    // Simple round-robin: select the contractor with the least recent assignment
    // For demo purposes, we'll just select the first eligible contractor
    const selectedContractor = eligibleContractors[0];
    setSelectedContractorIds([selectedContractor.id]);
    setAssignmentMode('round-robin');
  };

  const handleNextInLineAssignment = () => {
    if (eligibleContractors.length === 0) {
      setError('No eligible contractors found for this ZIP code.');
      return;
    }
    
    // Next in line: select contractor with lowest leads_received_count
    const nextContractor = eligibleContractors.reduce((prev, current) => 
      (current.leads_received_count || 0) < (prev.leads_received_count || 0) ? current : prev
    );
    setSelectedContractorIds([nextContractor.id]);
    setAssignmentMode('next-in-line');
  };

  const handleAssignLead = async () => {
    if (!lead || selectedContractorIds.length === 0) {
      setError('Please select at least one contractor.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await LeadManagementService.assignLeadManually({
        leadId: lead.id,
        contractorIds: selectedContractorIds,
      });

      if (result.success) {
        setSuccessMessage(`${result.message} (${assignmentMode} assignment)`);
        onAssignSuccess(); // Notify parent to refresh data
        setTimeout(() => onClose(), 2000); // Close modal after a short delay
      } else {
        setError(result.message || 'Failed to assign lead.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during assignment.');
    } finally {
      setIsLoading(false);
    }
  };

  const getLeadPriorityColor = (score: number) => {
    if (score >= 70) return 'bg-red-100 text-red-800 border-red-200';
    if (score >= 50) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const getLeadPriorityLabel = (score: number) => {
    if (score >= 70) return 'High Priority';
    if (score >= 50) return 'Medium Priority';
    return 'Standard';
  };

  if (!isOpen || !lead) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Assign Lead to Contractors
          </h3>
          <p className="text-gray-600">
            Choose how to assign this lead to contractors in your network.
          </p>
        </div>

        <div className="space-y-6 mb-6">
          {/* Lead Details Card */}
          <div className="bg-gradient-to-r from-blue-50 to-emerald-50 p-6 rounded-xl border border-blue-100">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-800">Lead Information</h4>
              <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getLeadPriorityColor(lead.probability_to_close_score || 0)}`}>
                {getLeadPriorityLabel(lead.probability_to_close_score || 0)} • {lead.probability_to_close_score}% Close Probability
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="font-medium">{lead.name || 'Anonymous'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-500" />
                <span>{lead.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-500" />
                <span>{lead.phone || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span>{lead.zip}</span>
              </div>
              <div className="flex items-center gap-2">
                <Home className="w-4 h-4 text-gray-500" />
                <span>{lead.room_type}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 text-center">🎨</span>
                <span>{lead.style}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 text-center">💰</span>
                <span>{lead.wants_quote ? 'Wants Quote' : 'Browsing'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span>{new Date(lead.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Assignment Mode Selection */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">Assignment Method</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={() => setAssignmentMode('manual')}
                className={`p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                  assignmentMode === 'manual'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <UserPlus className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-gray-900">Manual Selection</span>
                </div>
                <p className="text-sm text-gray-600">Choose specific contractors to assign this lead to</p>
              </button>

              <button
                onClick={() => {
                  setAssignmentMode('round-robin');
                  handleRoundRobinAssignment();
                }}
                className={`p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                  assignmentMode === 'round-robin'
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Shuffle className="w-5 h-5 text-emerald-600" />
                  <span className="font-medium text-gray-900">Round Robin</span>
                </div>
                <p className="text-sm text-gray-600">Automatically rotate assignments among eligible contractors</p>
              </button>

              <button
                onClick={() => {
                  setAssignmentMode('next-in-line');
                  handleNextInLineAssignment();
                }}
                className={`p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                  assignmentMode === 'next-in-line'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-5 h-5 text-purple-600" />
                  <span className="font-medium text-gray-900">Next in Line</span>
                </div>
                <p className="text-sm text-gray-600">Assign to contractor with fewest recent leads</p>
              </button>
            </div>
          </div>

          {/* Contractor Selection (only show for manual mode) */}
          {assignmentMode === 'manual' && (
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">
                Select Contractors ({eligibleContractors.length} eligible for ZIP {lead.zip})
              </h4>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                  <span className="ml-2 text-gray-600">Loading contractors...</span>
                </div>
              ) : error && !availableContractors.length ? (
                <div className="flex items-center justify-center py-8 text-red-600">
                  <AlertCircle className="w-5 h-5 mr-2" /> {error}
                </div>
              ) : eligibleContractors.length === 0 ? (
                <div className="text-center py-8 text-gray-600">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p>No eligible contractors found for ZIP code {lead.zip}</p>
                  <p className="text-sm mt-1">Contractors must be active subscribers and serve this area</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-2">
                  {eligibleContractors.map(contractor => (
                    <label
                      key={contractor.id}
                      className={`flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                        selectedContractorIds.includes(contractor.id)
                          ? 'border-blue-500 bg-blue-50 shadow-sm'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedContractorIds.includes(contractor.id)}
                        onChange={() => handleContractorToggle(contractor.id)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 mt-0.5"
                      />
                      <div className="ml-3 flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-gray-900">{contractor.name}</p>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            contractor.subscription_tier === 'premium' ? 'bg-purple-100 text-purple-700' :
                            contractor.subscription_tier === 'enterprise' ? 'bg-gold-100 text-gold-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {contractor.subscription_tier}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{contractor.email}</p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>ZIPs: {contractor.serves_all_zipcodes ? 'All MetroWest' : contractor.assigned_zip_codes?.slice(0, 3).join(', ') + (contractor.assigned_zip_codes?.length > 3 ? '...' : '')}</span>
                          <span>Leads: {contractor.leads_received_count || 0}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                          <span>Conv Rate: {(contractor.conversion_rate || 0).toFixed(1)}%</span>
                          <span>${contractor.price_per_lead?.toFixed(0)}/lead</span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Selected Contractors Summary (for automatic modes) */}
          {assignmentMode !== 'manual' && selectedContractorIds.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-800 mb-2">
                Selected for {assignmentMode === 'round-robin' ? 'Round Robin' : 'Next in Line'} Assignment:
              </h4>
              {selectedContractorIds.map(contractorId => {
                const contractor = availableContractors.find(c => c.id === contractorId);
                return contractor ? (
                  <div key={contractorId} className="flex items-center justify-between py-2">
                    <div>
                      <span className="font-medium text-gray-900">{contractor.name}</span>
                      <span className="text-sm text-gray-500 ml-2">({contractor.email})</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {contractor.leads_received_count || 0} leads received
                    </div>
                  </div>
                ) : null;
              })}
            </div>
          )}
        </div>

        {successMessage && (
          <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm mb-4">
            <Check className="w-5 h-5" /> {successMessage}
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">
            <AlertCircle className="w-5 h-5" /> {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAssignLead}
            disabled={isLoading || selectedContractorIds.length === 0}
            className="flex-2 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Assigning Lead...
              </>
            ) : (
              `Assign to ${selectedContractorIds.length} Contractor${selectedContractorIds.length !== 1 ? 's' : ''}`
            )}
          </button>
        </div>

        {/* Assignment Info */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-xs text-blue-700">
            💡 <strong>Assignment Process:</strong> Selected contractors will receive email notifications with lead details and project images. 
            Lead status will be updated to "assigned\" and tracking metrics will begin.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AssignLeadModal;