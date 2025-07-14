import { supabase } from '../lib/supabase';
import type { Contractor } from '../lib/supabase';

export class ContractorService {
  // Submit contractor application
  static async submitApplication(applicationData: {
    companyName: string;
    contactName: string;
    email: string;
    phone: string;
    specialties: string[];
    experience: string;
    licenseNumber: string;
    zipCodesServed: string[];
  }): Promise<Contractor> {
    try {
      const { data: contractor, error } = await supabase
        .from('contractors')
        .insert({
          company_name: applicationData.companyName,
          contact_name: applicationData.contactName,
          email: applicationData.email,
          phone: applicationData.phone,
          specialties: applicationData.specialties,
          license_number: applicationData.licenseNumber,
          zip_codes_served: applicationData.zipCodesServed,
          is_verified: false // Requires manual verification
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to submit application: ${error.message}`);
      }

      console.log('✅ Contractor application submitted:', contractor.company_name);
      return contractor;
    } catch (error) {
      console.error('❌ Contractor application error:', error);
      throw error;
    }
  }

  // Get verified contractors by ZIP code
  static async getContractorsByZipCode(zipCode: string): Promise<Contractor[]> {
    try {
      const { data: contractors, error } = await supabase
        .from('contractors')
        .select('*')
        .eq('is_verified', true)
        .contains('zip_codes_served', [zipCode])
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get contractors: ${error.message}`);
      }

      return contractors || [];
    } catch (error) {
      console.error('❌ Get contractors error:', error);
      return [];
    }
  }

  // Get all verified contractors
  static async getVerifiedContractors(): Promise<Contractor[]> {
    try {
      const { data: contractors, error } = await supabase
        .from('contractors')
        .select('*')
        .eq('is_verified', true)
        .order('company_name', { ascending: true });

      if (error) {
        throw new Error(`Failed to get contractors: ${error.message}`);
      }

      return contractors || [];
    } catch (error) {
      console.error('❌ Get contractors error:', error);
      return [];
    }
  }
}