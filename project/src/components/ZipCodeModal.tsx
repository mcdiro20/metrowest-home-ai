import React, { useState } from 'react';
import { X, MapPin, AlertCircle } from 'lucide-react';

interface ZipCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onZipCodeApproved: (zipCode: string) => void;
}

const ZipCodeModal: React.FC<ZipCodeModalProps> = ({ isOpen, onClose, onZipCodeApproved }) => {
  const [zipCode, setZipCode] = useState('');
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  // MetroWest MA ZIP codes
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChecking(true);
    setError('');

    // Simulate checking delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (metroWestZipCodes.includes(zipCode)) {
      onZipCodeApproved(zipCode);
    } else {
      setError('Sorry! This service is currently only available to MetroWest MA homeowners.');
    }

    setIsChecking(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Confirm Your Location
          </h3>
          <p className="text-gray-600">
            This service is exclusively for homeowners in MetroWest Massachusetts.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ZIP Code
            </label>
            <input
              type="text"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
              placeholder="Enter your ZIP code"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors"
              required
              maxLength={5}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isChecking || zipCode.length !== 5}
            className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isChecking ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Checking...
              </div>
            ) : (
              'Continue to Upload'
            )}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Serving: Framingham, Natick, Wellesley, Newton, Waltham, and surrounding MetroWest communities
          </p>
        </div>
      </div>
    </div>
  );
};

export default ZipCodeModal;