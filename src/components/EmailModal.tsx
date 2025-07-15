import React, { useState } from 'react';
import { X, Mail, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  uploadedImage?: string;
  beforeImage?: string;
  selectedStyle?: string;
  roomType?: string;
  zipCode?: string;
  designRequestId?: string;
  onEmailSubmitted?: () => void;
}

const EmailModal: React.FC<EmailModalProps> = ({ 
  isOpen, 
  onClose, 
  uploadedImage, 
  beforeImage, 
  selectedStyle,
  roomType,
  zipCode,
  designRequestId,
  onEmailSubmitted 
}) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [subscribe, setSubscribe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      console.log('📧 Attempting to send email to:', email);
      
      // Save lead data directly to Supabase (client-side)
      if (supabase) {
        try {
          console.log('💾 Saving lead data to Supabase...');
          
          // Calculate lead score
          let leadScore = 10; // Base score for completing AI render
          if (email) leadScore += 15;
          if (name) leadScore += 10;
          if (phone) leadScore += 20;
          if (subscribe) leadScore += 30;
          
          // MetroWest ZIP codes for bonus scoring
          const metroWestZips = [
            '01701', '01702', '01718', '01719', '01720', '01721', '01730', '01731',
            '01740', '01741', '01742', '01746', '01747', '01748', '01749', '01752',
            '01754', '01757', '01760', '01770', '01772', '01773', '01776', '01778',
            '01784', '01801', '01803', '01890', '02030', '02032', '02052', '02054',
            '02056', '02090', '02093', '02421', '02451', '02452', '02453', '02454',
            '02458', '02459', '02460', '02461', '02462', '02464', '02465', '02466',
            '02467', '02468', '02472', '02474', '02475', '02476', '02477', '02478',
            '02479', '02481', '02482', '02492', '02493', '02494', '02495'
          ];
          
          if (zipCode && metroWestZips.includes(zipCode)) {
            leadScore += 25;
          }
          
          const leadData = {
            name: name || null,
            email: email,
            phone: phone || null,
            zip: zipCode,
            room_type: roomType,
            style: selectedStyle,
            image_url: beforeImage,
            ai_url: uploadedImage,
            render_count: 1,
            wants_quote: subscribe,
            social_engaged: false,
            is_repeat_visitor: false,
            lead_score: leadScore
          };
          
          const { data: savedLead, error: leadError } = await supabase
            .from('leads')
            .insert(leadData)
            .select()
            .single();
          
          if (leadError) {
            console.error('❌ Failed to save lead to Supabase:', leadError);
          } else {
            console.log('✅ Lead saved to Supabase:', savedLead.id);
          }
        } catch (dbError) {
          console.error('❌ Database error:', dbError);
        }
      } else {
        console.warn('⚠️ Supabase not configured - lead not saved');
      }
      
      console.log('📧 Before image type:', typeof beforeImage);
      console.log('📧 Before image starts with data:', beforeImage?.startsWith?.('data:'));
      console.log('📧 Before image length:', beforeImage?.length);
      console.log('📧 After image:', uploadedImage);
      console.log('📧 Selected style:', selectedStyle);
      console.log('📧 Room type:', roomType);
      
      // Use the beforeImage directly (should already be base64)
      let beforeImageBase64 = beforeImage || '';
      
      // Validate we have both images
      if (!beforeImageBase64) {
        console.warn('⚠️ No before image available or conversion failed');
      }
      if (!uploadedImage) {
        console.warn('⚠️ No after image available');
      }
      
      // Call the actual API endpoint
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          beforeImage: beforeImageBase64,
          afterImage: uploadedImage,
          selectedStyle: selectedStyle,
          roomType: roomType,
          subscribe: subscribe,
          zipCode: zipCode
        })
      });
      
      const result = await response.json();
      console.log('📧 API Response:', result);
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to send email');
      }
      
      setIsSubmitting(false);
      setIsSuccess(true);
      
      // Call onEmailSubmitted after success
      setTimeout(() => {
        if (onEmailSubmitted) {
          onEmailSubmitted();
        } else {
          onClose();
        }
        setIsSuccess(false);
        setEmail('');
        setName('');
        setPhone('');
        setSubscribe(false);
      }, 3000);
    } catch (error) {
      console.error('❌ Email submission error:', error);
      setIsSubmitting(false);
      // Show error to user
      alert(`Email failed: ${error.message}`);
    }
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
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Your Design is Ready!
          </h3>
          <p className="text-gray-600">
            Enter your email and we'll send you the high-resolution before/after images.
          </p>
        </div>

        {/* Blurred Preview */}
        <div className="relative mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {beforeImage && (
              <div className="relative">
                <img 
                  src={beforeImage} 
                  alt="Before" 
                  className="w-full h-48 object-cover rounded-lg"
                />
                <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  Before
                </div>
              </div>
            )}
            <div className="relative">
              {uploadedImage && (
                <img 
                  src={uploadedImage} 
                  alt="AI Generated Design" 
                  className="w-full h-48 object-cover filter blur-sm rounded-lg"
                />
              )}
              <div className="absolute top-2 right-2 bg-emerald-600 text-white text-xs px-2 py-1 rounded">
                After (AI)
              </div>
            </div>
          </div>
        </div>

        {!isSuccess ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name (optional)"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors"
                required
              />
            </div>

            <div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone number (optional)"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors"
              />
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={subscribe}
                onChange={(e) => setSubscribe(e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">
                Get quotes from local contractors & weekly design tips
              </span>
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Processing...
                </div>
              ) : (
                'Send My Design'
              )}
            </button>
          </form>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-emerald-600" />
            </div>
            <h4 className="text-xl font-semibold text-gray-900 mb-2">Email Sent!</h4>
            <p className="text-gray-600">
              Check your inbox for your high-resolution design images. (Development Mode)
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailModal;