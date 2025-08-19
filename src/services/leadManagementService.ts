import { supabase } from '../lib/supabase';
import type { Lead, LeadAssignment } from '../lib/supabase';

export interface LeadStatusUpdate {
  leadId: string;
  newStatus: 'new' | 'assigned' | 'contacted' | 'quoted' | 'converted' | 'dead' | 'unqualified';
  contractorNotes?: string;
  conversionValue?: number;
}

export interface ManualAssignment {
  leadId: string;
  contractorIds: string[];
}

export interface AssignmentStats {
  totalAssignments: number;
  emailsSent: number;
  emailsOpened: number;
  emailsClicked: number;
  contractorResponses: number;
  avgResponseTimeHours: number;
  conversionRate: number;
}

export class LeadManagementService {
  // Update lead status (for contractors and admins)
  static async updateLeadStatus(update: LeadStatusUpdate): Promise<{ success: boolean; message: string }> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Authentication required');
      }

      const response = await fetch('/api/leads/update-status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(update)
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update lead status');
      }

      return result;
    } catch (error) {
      console.error('Lead status update error:', error);
      throw error;
    }
  }

  // Manually assign lead to contractors (admin only)
  static async assignLeadManually(assignment: ManualAssignment): Promise<{ success: boolean; message: string; assignmentResults: any[] }> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Authentication required');
      }

      const response = await fetch('/api/leads/assign-manually', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(assignment)
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to assign lead');
      }

      return result;
    } catch (error) {
      console.error('Manual assignment error:', error);
      throw error;
    }
  }

  // Get lead assignments (admin only)
  static async getLeadAssignments(): Promise<{ assignments: any[]; stats: AssignmentStats }> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Authentication required');
      }

      const response = await fetch('/api/leads/get-assignments', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch assignments');
      }

      return {
        assignments: result.assignments,
        stats: result.stats
      };
    } catch (error) {
      console.error('Get assignments error:', error);
      throw error;
    }
  }

  // Get contractor performance metrics
  static async getContractorPerformance(contractorId?: string): Promise<any> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    try {
      let query = supabase
        .from('contractors')
        .select(`
          id,
          name,
          email,
          subscription_tier,
          leads_received_count,
          leads_converted_count,
          conversion_rate,
          assigned_zip_codes
        `)
        .eq('is_active_subscriber', true);

      if (contractorId) {
        query = query.eq('id', contractorId);
      }

      const { data: contractors, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch contractor performance: ${error.message}`);
      }

      return contractors;
    } catch (error) {
      console.error('Contractor performance error:', error);
      throw error;
    }
  }

  // Get lead conversion funnel data
  static async getConversionFunnel(timeRange: '7d' | '30d' | '90d' = '30d'): Promise<any> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    try {
      const now = new Date();
      const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));

      const { data: leads, error } = await supabase
        .from('leads')
        .select('status, lead_score, wants_quote, created_at')
        .gte('created_at', startDate.toISOString());

      if (error) {
        throw new Error(`Failed to fetch conversion data: ${error.message}`);
      }

      // Calculate funnel metrics
      const totalLeads = leads?.length || 0;
      const assignedLeads = leads?.filter(l => l.status === 'assigned').length || 0;
      const contactedLeads = leads?.filter(l => l.status === 'contacted').length || 0;
      const quotedLeads = leads?.filter(l => l.status === 'quoted').length || 0;
      const convertedLeads = leads?.filter(l => l.status === 'converted').length || 0;
      const deadLeads = leads?.filter(l => l.status === 'dead').length || 0;

      return {
        totalLeads,
        funnel: {
          new: leads?.filter(l => l.status === 'new').length || 0,
          assigned: assignedLeads,
          contacted: contactedLeads,
          quoted: quotedLeads,
          converted: convertedLeads,
          dead: deadLeads,
          unqualified: leads?.filter(l => l.status === 'unqualified').length || 0
        },
        conversionRate: totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0,
        assignmentRate: totalLeads > 0 ? (assignedLeads / totalLeads) * 100 : 0,
        responseRate: assignedLeads > 0 ? (contactedLeads / assignedLeads) * 100 : 0
      };
    } catch (error) {
      console.error('Conversion funnel error:', error);
      throw error;
    }
  }
}