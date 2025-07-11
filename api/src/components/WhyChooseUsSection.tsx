import React from 'react';
import { Zap, Heart, Shield, Users, Star, Clock } from 'lucide-react';

const WhyChooseUsSection: React.FC = () => {
  const features = [
    {
      icon: Zap,
      title: 'AI-Powered Design',
      description: 'Advanced artificial intelligence creates personalized design inspirations tailored specifically to your home and style preferences.',
      color: 'text-blue-600'
    },
    {
      icon: Clock,
      title: 'Fast & Free',
      description: 'Get your design transformation in minutes, not days. No upfront costs, no hidden fees, no commitment required.',
      color: 'text-emerald-600'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your photos and personal information are protected with enterprise-grade security. We never share your data.',
      color: 'text-purple-600'
    },
    {
      icon: Users,
      title: 'Community Inspired',
      description: 'Browse thousands of real transformations from homeowners like you. Get inspired by what\'s possible.',
      color: 'text-orange-600'
    },
    {
      icon: Heart,
      title: 'Local Expertise',
      description: 'Connect with trusted local contractors in the MetroWest area to bring your AI-generated vision to life.',
      color: 'text-red-600'
    },
    {
      icon: Star,
      title: 'Proven Results',
      description: 'Over 10,000 successful transformations and counting. Join homeowners who\'ve already reimagined their spaces.',
      color: 'text-yellow-600'
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Why Choose MetroWest Home AI?
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We're revolutionizing home design for MetroWest Massachusetts with cutting-edge AI technology and local expertise.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-gray-50 rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 rounded-lg bg-white flex items-center justify-center mb-4 ${feature.color}`}>
                <feature.icon className="w-6 h-6" />
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-2xl p-8 text-center text-white">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">
              Coming Soon: Direct Contractor Connection
            </h3>
            <p className="text-blue-100 mb-6">
              We're partnering with trusted local contractors in the MetroWest area to help you bring your AI-generated designs to life. 
              Get matched with pre-vetted professionals who understand your vision.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <span className="text-sm">Licensed & Insured</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <span className="text-sm">Verified Reviews</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <span className="text-sm">Competitive Pricing</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUsSection;