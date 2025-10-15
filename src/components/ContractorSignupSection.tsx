import React, { useState } from 'react';
import { Star, Shield, TrendingUp, Users, CheckCircle, Award, Sparkles, Clock, DollarSign, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function ContractorSignupSection() {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    license: '',
    insurance: '',
    yearsExperience: '',
    zipCodes: '',
    specialties: [] as string[],
    referralSource: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const specialtyOptions = [
    'Kitchen Remodeling',
    'Bathroom Renovation',
    'Basement Finishing',
    'Additions & Extensions',
    'Outdoor Living Spaces',
    'Whole Home Renovations',
    'Custom Carpentry',
    'Flooring',
    'Painting & Finishing',
    'Electrical Work',
    'Plumbing',
    'HVAC'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!supabase) {
        throw new Error('Database not configured');
      }

      const { error } = await supabase.from('contractor_applications').insert({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        company_name: formData.company,
        license_number: formData.license,
        insurance_info: formData.insurance,
        years_experience: parseInt(formData.yearsExperience) || 0,
        service_zip_codes: formData.zipCodes,
        specialties: formData.specialties,
        referral_source: formData.referralSource,
        message: formData.message,
        status: 'pending'
      });

      if (error) throw error;

      setSubmitSuccess(true);
      setTimeout(() => {
        setShowModal(false);
        setSubmitSuccess(false);
        setFormData({
          name: '',
          email: '',
          phone: '',
          company: '',
          license: '',
          insurance: '',
          yearsExperience: '',
          zipCodes: '',
          specialties: [],
          referralSource: '',
          message: ''
        });
      }, 3000);
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('There was an error submitting your application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSpecialty = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }));
  };

  return (
    <>
      <div className="relative overflow-hidden border-t border-gray-800 mt-8 pt-8">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-emerald-900/20 blur-3xl"></div>

        <div className="relative bg-gradient-to-br from-blue-900/40 via-purple-900/40 to-emerald-900/40 rounded-2xl p-8 border border-blue-500/20 backdrop-blur-sm">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-yellow-400" />
            <span className="text-xs font-bold text-yellow-400 tracking-wider uppercase bg-yellow-400/10 px-3 py-1 rounded-full">
              Exclusive Partner Network
            </span>
            <Sparkles className="w-6 h-6 text-yellow-400" />
          </div>

          <h3 className="text-3xl font-bold text-center mb-3 bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
            Join MetroWest's Elite Contractor Network
          </h3>

          <p className="text-center text-gray-300 text-lg mb-6 max-w-3xl mx-auto">
            Connect with qualified homeowners who have already visualized their dream renovation using our AI technology.
            <span className="text-blue-400 font-semibold"> Pre-qualified leads delivered directly to you.</span>
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-semibold text-white mb-2">High-Intent Leads</h4>
              <p className="text-sm text-gray-300">Homeowners ready to start their projects with AI-generated designs in hand</p>
            </div>

            <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-semibold text-white mb-2">Exclusive Territory</h4>
              <p className="text-sm text-gray-300">Limited partners per zip code ensures quality over quantity</p>
            </div>

            <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Award className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-semibold text-white mb-2">Premium Positioning</h4>
              <p className="text-sm text-gray-300">Be featured as a trusted partner in the fastest-growing home renovation platform</p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-8 border border-white/20">
            <h4 className="font-semibold text-white text-lg mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              What You Get as a Partner
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-start gap-2 text-gray-200">
                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm">Qualified leads with AI-generated renovation plans</span>
              </div>
              <div className="flex items-start gap-2 text-gray-200">
                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm">Exclusive partner badge on your profile</span>
              </div>
              <div className="flex items-start gap-2 text-gray-200">
                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm">Priority placement in your service area</span>
              </div>
              <div className="flex items-start gap-2 text-gray-200">
                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm">Direct homeowner contact information</span>
              </div>
              <div className="flex items-start gap-2 text-gray-200">
                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm">Performance analytics and lead insights</span>
              </div>
              <div className="flex items-start gap-2 text-gray-200">
                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm">Marketing support and co-branding opportunities</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="flex items-center gap-2 text-yellow-400">
              <Star className="w-5 h-5 fill-yellow-400" />
              <Star className="w-5 h-5 fill-yellow-400" />
              <Star className="w-5 h-5 fill-yellow-400" />
              <Star className="w-5 h-5 fill-yellow-400" />
              <Star className="w-5 h-5 fill-yellow-400" />
            </div>
            <span className="text-gray-300 text-sm">Rated 5.0 by partner contractors</span>
          </div>

          <div className="text-center">
            <button
              onClick={() => setShowModal(true)}
              className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 hover:from-blue-500 hover:via-purple-500 hover:to-emerald-500 text-white font-bold px-8 py-4 rounded-xl transition-all duration-300 shadow-2xl hover:shadow-blue-500/50 hover:scale-105"
            >
              <Users className="w-6 h-6" />
              <span className="text-lg">Apply to Join Our Network</span>
              <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            </button>
            <p className="text-gray-400 text-sm mt-3">
              Limited spots available • Applications reviewed within 48 hours
            </p>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full my-8 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors z-10"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>

            {submitSuccess ? (
              <div className="p-12 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">Application Submitted!</h3>
                <p className="text-gray-600 text-lg mb-2">
                  Thank you for your interest in joining our exclusive contractor network.
                </p>
                <p className="text-gray-500">
                  We'll review your application and contact you within 48 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-8">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-purple-100 px-4 py-2 rounded-full mb-4">
                    <Award className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-semibold text-gray-700">Partner Application</span>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-2">Join Our Elite Network</h3>
                  <p className="text-gray-600">Tell us about your business and expertise</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="John Smith"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="john@construction.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="(508) 555-0123"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Smith Construction LLC"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      License Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.license}
                      onChange={(e) => setFormData({ ...formData, license: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="CS-123456"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Insurance Provider <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.insurance}
                      onChange={(e) => setFormData({ ...formData, insurance: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="ABC Insurance Co."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Years of Experience <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.yearsExperience}
                      onChange={(e) => setFormData({ ...formData, yearsExperience: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="10"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Service Zip Codes <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.zipCodes}
                      onChange={(e) => setFormData({ ...formData, zipCodes: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="01701, 01702, 01730"
                    />
                    <p className="text-xs text-gray-500 mt-1">Comma-separated list</p>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Specialties <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {specialtyOptions.map((specialty) => (
                      <button
                        key={specialty}
                        type="button"
                        onClick={() => toggleSpecialty(specialty)}
                        className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                          formData.specialties.includes(specialty)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                        }`}
                      >
                        {specialty}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    How did you hear about us?
                  </label>
                  <select
                    value={formData.referralSource}
                    onChange={(e) => setFormData({ ...formData, referralSource: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select one...</option>
                    <option value="google">Google Search</option>
                    <option value="referral">Referral from another contractor</option>
                    <option value="social">Social Media</option>
                    <option value="advertisement">Advertisement</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Why do you want to join our network?
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Tell us about your business goals and what makes you a great fit..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || formData.specialties.length === 0}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting Application...' : 'Submit Application'}
                </button>

                <p className="text-xs text-gray-500 text-center mt-4">
                  By submitting, you agree to our partner terms and conditions
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
