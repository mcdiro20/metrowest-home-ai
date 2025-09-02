import React, { useState } from 'react';
import { X, Users, Check, Building, Mail, MapPin, DollarSign, Calendar, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AddContractorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddContractorModal: React.FC<AddContractorModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    assignedZipCodes: [] as string[],
    servesAllZipcodes: false,
    pricePerLead: 25.00,
    monthlySubscriptionFee: 99.00,
    isActiveSubscriber: false,
    subscriptionTier: 'basic' as 'basic' | 'premium' | 'enterprise',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const metroWestZipCodes = [
    '01701', '01702', '01718', '01719', '01720', '01721', '01730', '01731',
    '01740', '01741', '01742', '01746', '01747', '01748', '01749', '01752',
    '01754', '01757', '01760', '01770', '01772', '01773', '01776', '01778',
    '01784', '01801', '01803', '01890', '02030', '02032', '02052', '02054',
    '02056', '02090', '02093', '02421', '02451', '02452', '02453', '02454',
    '02458', '02459', '02460', '02461', '02462', '02464', '02465', '02466',
    '02467', '02468', '02472', '02474', '02475', '02476', '02477', '02478',
    '02479', '02481', '02482', '02492', '02493', '02494', '02495'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) : value
    }));
  };

  const handleZipCodeChange = (zip: string) => {
    setFormData(prev => {
      const currentZips = new Set(prev.assignedZipCodes);
      if (currentZips.has(zip)) {
        currentZips.delete(zip);
      } else {
        currentZips.add(zip);
      }
      return { ...prev, assignedZipCodes: Array.from(currentZips).sort() };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (!supabase) {
        throw new Error('Supabase not configured');
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User not authenticated.');
      }

      const response = await fetch('/api/admin/add-contractor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to add contractor.');
      }

      setIsSuccess(true);
      onSuccess();
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
        setFormData({
          name: '', email: '', assignedZipCodes: [], servesAllZipcodes: false,
          pricePerLead: 25.00, monthlySubscriptionFee: 99.00, isActiveSubscriber: false, subscriptionTier: 'basic'
        });
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
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
            Enter the details for the new contractor.
          </p>
        </div>

        {!isSuccess ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building className="w-4 h-4 inline mr-1" />
                Contractor Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-1" />
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Price Per Lead ($)
                </label>
                <input
                  type="number"
                  name="pricePerLead"
                  value={formData.pricePerLead}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Monthly Subscription Fee ($)
                </label>
                <input
                  type="number"
                  name="monthlySubscriptionFee"
                  value={formData.monthlySubscriptionFee}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Star className="w-4 h-4 inline mr-1" />
                  Subscription Tier
                </label>
                <select
                  name="subscriptionTier"
                  value={formData.subscriptionTier}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors"
                  required
                >
                  <option value="basic">Basic</option>
                  <option value="premium">Premium</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              <div className="flex items-center mt-8">
                <input
                  type="checkbox"
                  name="isActiveSubscriber"
                  checked={formData.isActiveSubscriber}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <label className="ml-2 block text-sm font-medium text-gray-700">
                  Active Subscriber
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Service Area
              </label>
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  name="servesAllZipcodes"
                  checked={formData.servesAllZipcodes}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <label className="ml-2 block text-sm font-medium text-gray-700">
                  Serves All MetroWest ZIP Codes
                </label>
              </div>
              {!formData.servesAllZipcodes && (
                <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto border p-2 rounded-lg bg-gray-50">
                  {metroWestZipCodes.map(zip => (
                    <label key={zip} className="flex items-center text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={formData.assignedZipCodes.includes(zip)}
                        onChange={() => handleZipCodeChange(zip)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="ml-1">{zip}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Adding Contractor...
                </div>
              ) : (
                'Add Contractor'
              )}
            </button>
          </form>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-emerald-600" />
            </div>
            <h4 className="text-xl font-semibold text-gray-900 mb-2">Contractor Added!</h4>
            <p className="text-gray-600">
              The new contractor has been successfully added to the system.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddContractorModal;