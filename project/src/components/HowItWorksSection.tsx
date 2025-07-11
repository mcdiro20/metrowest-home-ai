import React from 'react';
import { Upload, Zap, Mail, Users } from 'lucide-react';

const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      icon: Upload,
      title: 'Confirm Your ZIP Code',
      description: 'Make sure you\'re in MetroWest MA, then upload a photo of your kitchen or backyard.',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      icon: Zap,
      title: 'AI Magic Happens',
      description: 'Our advanced AI analyzes your space and creates a stunning reimagined design.',
      color: 'bg-emerald-100 text-emerald-600'
    },
    {
      icon: Mail,
      title: 'Get Your Design',
      description: 'Enter your email to receive high-resolution before/after images in your inbox.',
      color: 'bg-purple-100 text-purple-600'
    },
    {
      icon: Users,
      title: 'Share & Inspire',
      description: 'Browse others\' transformations and share your own to inspire the community.',
      color: 'bg-orange-100 text-orange-600'
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Transform your space in just a few simple steps with our AI-powered design technology.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              <div className="relative mb-6">
                <div className={`w-16 h-16 ${step.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <step.icon className="w-8 h-8" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {step.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 bg-white rounded-full px-6 py-3 shadow-sm border border-gray-200">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full border-2 border-white"></div>
              <div className="w-8 h-8 bg-emerald-500 rounded-full border-2 border-white"></div>
              <div className="w-8 h-8 bg-purple-500 rounded-full border-2 border-white"></div>
            </div>
            <span className="text-sm font-medium text-gray-700">
              Join 1,000+ homeowners who've transformed their spaces
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;