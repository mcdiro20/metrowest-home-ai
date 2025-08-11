import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Upload, Zap, Users, Star, MapPin, Phone, Mail, ChevronDown, ChevronUp } from 'lucide-react';

// Easy configuration for different towns
const TOWN_CONFIG = {
  name: 'Framingham',
  state: 'MA',
  zipCodes: ['01701', '01702'],
  population: '72,000',
  avgHomeValue: '$485,000',
  popularStyles: ['Modern Farmhouse', 'Colonial Revival', 'Contemporary']
};

const FraminghamLanding: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    roomType: '',
    agreeToConnect: false
  });
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form submitted:', formData, uploadedImage);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedImage(e.target.files[0]);
    }
  };

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const faqData = [
    {
      question: `How does AI home renovation work in ${TOWN_CONFIG.name}, ${TOWN_CONFIG.state}?`,
      answer: `Our AI technology analyzes your ${TOWN_CONFIG.name} home's photos and creates photorealistic renovation designs in minutes. Simply upload a photo of your kitchen, bathroom, or living space, choose your preferred style, and our AI generates professional-quality before/after images showing your potential renovation.`
    },
    {
      question: `Are the AI renovation designs realistic for ${TOWN_CONFIG.name} homes?`,
      answer: `Yes! Our AI is trained on thousands of real renovations and understands ${TOWN_CONFIG.name}'s architectural styles, from Colonial Revival to Modern Farmhouse. The designs respect your home's existing structure while showing achievable improvements using materials and styles popular in the ${TOWN_CONFIG.name} area.`
    },
    {
      question: `Can you connect me with contractors in ${TOWN_CONFIG.name} to make these renovations real?`,
      answer: `Absolutely! We partner with licensed, insured contractors throughout ${TOWN_CONFIG.name} and the greater MetroWest area. After you see your AI design, we can connect you with pre-vetted local professionals who can provide quotes and bring your vision to life.`
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* SEO-optimized header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-lg"></div>
            <span className="text-xl font-bold text-gray-900">MetroWest Home AI</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#how-it-works" className="text-gray-600 hover:text-blue-600 transition-colors">How It Works</a>
            <a href="#examples" className="text-gray-600 hover:text-blue-600 transition-colors">Examples</a>
            <a href="#faq" className="text-gray-600 hover:text-blue-600 transition-colors">FAQ</a>
            <button className="bg-gradient-to-r from-blue-600 to-emerald-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all">
              Try Free
            </button>
          </nav>
        </div>
      </header>

      {/* Split Hero Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Headlines and CTA */}
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
                  <MapPin className="w-4 h-4" />
                  Serving {TOWN_CONFIG.name}, {TOWN_CONFIG.state}
                </div>
                <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  AI Home Renovations for {TOWN_CONFIG.name}, {TOWN_CONFIG.state}
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  See your {TOWN_CONFIG.name} home transformed in minutes with AI-powered renovation designs. 
                  Upload a photo, get professional-quality before/after images, and connect with local contractors 
                  to make it real.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  to="/"
                  className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-semibold px-8 py-4 rounded-2xl text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl text-center"
                >
                  Try AI Renovation Free
                </Link>
                <Link 
                  to="/#inspiration-feed"
                  className="border-2 border-gray-300 hover:border-blue-500 text-gray-700 hover:text-blue-600 font-semibold px-8 py-4 rounded-2xl text-lg transition-all duration-300 text-center"
                >
                  View Examples
                </Link>
              </div>

              <div className="flex items-center gap-8 pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">2,500+</div>
                  <div className="text-sm text-gray-600">{TOWN_CONFIG.name} Homes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">4.9★</div>
                  <div className="text-sm text-gray-600">Average Rating</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">30 sec</div>
                  <div className="text-sm text-gray-600">AI Processing</div>
                </div>
              </div>
            </div>

            {/* Right side - Before/After Image */}
            <div className="relative">
              <div className="bg-white rounded-3xl shadow-2xl p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <img 
                      src="https://images.pexels.com/photos/1080721/pexels-photo-1080721.jpeg?auto=compress&cs=tinysrgb&w=600" 
                      alt="Before renovation - Framingham kitchen"
                      className="w-full h-64 object-cover rounded-2xl"
                    />
                    <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Before
                    </div>
                  </div>
                  <div className="relative">
                    <img 
                      src="https://images.pexels.com/photos/2089698/pexels-photo-2089698.jpeg?auto=compress&cs=tinysrgb&w=600" 
                      alt="After AI renovation - Framingham kitchen"
                      className="w-full h-64 object-cover rounded-2xl"
                    />
                    <div className="absolute top-3 right-3 bg-emerald-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      After AI
                    </div>
                  </div>
                </div>
                <div className="text-center mt-4">
                  <p className="text-gray-600 text-sm">Real {TOWN_CONFIG.name} kitchen transformation in 30 seconds</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Form Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Get Your Free AI Renovation Design
            </h2>
            <p className="text-xl text-gray-600">
              Upload a photo of your {TOWN_CONFIG.name} home and see it transformed in minutes
            </p>
          </div>

          <form onSubmit={handleFormSubmit} className="bg-gray-50 rounded-3xl p-8 shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors"
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors"
                  placeholder="(optional)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Room Type *
                </label>
                <select
                  required
                  value={formData.roomType}
                  onChange={(e) => setFormData({...formData, roomType: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors"
                >
                  <option value="">Select room type</option>
                  <option value="kitchen">Kitchen</option>
                  <option value="bathroom">Bathroom</option>
                  <option value="living-room">Living Room</option>
                  <option value="bedroom">Bedroom</option>
                  <option value="dining-room">Dining Room</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Photo of Your Space *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="photo-upload"
                  required
                />
                <label htmlFor="photo-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">
                    {uploadedImage ? uploadedImage.name : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-sm text-gray-500">JPG, PNG, or HEIC up to 10MB</p>
                </label>
              </div>
            </div>

            <div className="mb-6">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={formData.agreeToConnect}
                  onChange={(e) => setFormData({...formData, agreeToConnect: e.target.checked})}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 mt-0.5"
                />
                <span className="text-sm text-gray-600">
                  I agree to receive my AI renovation design and be connected with licensed contractors 
                  in {TOWN_CONFIG.name}, {TOWN_CONFIG.state} for quotes. *
                </span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-semibold py-4 px-8 rounded-xl text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
            >
              Get My Free AI Renovation Design
            </button>
          </form>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How AI Home Renovations Work in {TOWN_CONFIG.name}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Transform your {TOWN_CONFIG.name} home in three simple steps with our advanced AI technology
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Upload className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">1. Upload Your Photo</h3>
              <p className="text-gray-600 leading-relaxed">
                Take a photo of any room in your {TOWN_CONFIG.name} home - kitchen, bathroom, living room, 
                or any space you want to renovate. Our <Link to="/" className="text-blue-600 hover:text-blue-800 underline">AI works with any angle or lighting</Link>.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-emerald-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Zap className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">2. AI Creates Your Design</h3>
              <p className="text-gray-600 leading-relaxed">
                Our <Link to="/" className="text-blue-600 hover:text-blue-800 underline">AI analyzes your space</Link> and creates professional-quality renovation designs in 30 seconds. 
                Choose from styles popular in {TOWN_CONFIG.name} or describe your custom vision.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">3. Connect with Contractors</h3>
              <p className="text-gray-600 leading-relaxed">
                Love your <Link to="/" className="text-blue-600 hover:text-blue-800 underline">AI renovation design</Link>? We'll connect you with licensed, insured contractors in {TOWN_CONFIG.name} 
                who can provide quotes and bring your vision to life.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Example AI Designs Section */}
      <section id="examples" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Example AI Designs for {TOWN_CONFIG.name} Homes
            </h2>
            <p className="text-xl text-gray-600">
              See how our <Link to="/" className="text-blue-600 hover:text-blue-800 underline">AI transforms real {TOWN_CONFIG.name} homes</Link> with popular renovation styles
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                before: "https://images.pexels.com/photos/1080721/pexels-photo-1080721.jpeg?auto=compress&cs=tinysrgb&w=600",
                after: "https://images.pexels.com/photos/2089698/pexels-photo-2089698.jpeg?auto=compress&cs=tinysrgb&w=600",
                style: "Modern Farmhouse Kitchen",
                location: `${TOWN_CONFIG.name} Colonial Home`
              },
              {
                before: "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=600",
                after: "https://images.pexels.com/photos/2062426/pexels-photo-2062426.jpeg?auto=compress&cs=tinysrgb&w=600",
                style: "Contemporary Bathroom",
                location: `${TOWN_CONFIG.name} Ranch Home`
              },
              {
                before: "https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=600",
                after: "https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=600",
                style: "Transitional Living Room",
                location: `${TOWN_CONFIG.name} Cape Cod`
              }
            ].map((example, index) => (
              <div key={index} className="bg-gray-50 rounded-3xl p-6 hover:shadow-xl transition-all duration-300">
                <div className="space-y-4">
                  <div className="relative overflow-hidden rounded-2xl">
                    <img 
                      src={example.before} 
                      alt={`Before renovation - ${example.location}`}
                      className="w-full h-48 object-cover hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                      Before
                    </div>
                  </div>
                  <div className="relative overflow-hidden rounded-2xl">
                    <img 
                      src={example.after} 
                      alt={`After AI renovation - ${example.location}`}
                      className="w-full h-48 object-cover hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3 bg-emerald-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                      After AI
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-semibold text-gray-900">{example.style}</h3>
                  <p className="text-gray-600 text-sm">{example.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Local Renovation Insights Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Local Renovation Insights – {TOWN_CONFIG.name}, {TOWN_CONFIG.state}
            </h2>
            <p className="text-xl text-gray-600">
              Understanding renovation trends and costs in your {TOWN_CONFIG.name} neighborhood. <Link to="/" className="text-blue-600 hover:text-blue-800 underline">Try our AI design tool</Link> to see your home's potential.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <div className="bg-white rounded-2xl p-6 text-center shadow-lg">
              <div className="text-3xl font-bold text-blue-600 mb-2">{TOWN_CONFIG.avgHomeValue}</div>
              <div className="text-gray-600">Avg Home Value</div>
            </div>
            <div className="bg-white rounded-2xl p-6 text-center shadow-lg">
              <div className="text-3xl font-bold text-emerald-600 mb-2">$45K</div>
              <div className="text-gray-600">Avg Kitchen Reno</div>
            </div>
            <div className="bg-white rounded-2xl p-6 text-center shadow-lg">
              <div className="text-3xl font-bold text-purple-600 mb-2">$25K</div>
              <div className="text-gray-600">Avg Bathroom Reno</div>
            </div>
            <div className="bg-white rounded-2xl p-6 text-center shadow-lg">
              <div className="text-3xl font-bold text-orange-600 mb-2">85%</div>
              <div className="text-gray-600">ROI on Renovations</div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-lg">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">
              Popular Renovation Styles in {TOWN_CONFIG.name}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {TOWN_CONFIG.popularStyles.map((style, index) => (
                <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-full flex items-center justify-center">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{style}</div>
                    <div className="text-sm text-gray-600">Popular in {TOWN_CONFIG.name}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section with Schema Markup */}
      <section id="faq" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Common questions about AI home renovations in {TOWN_CONFIG.name}
            </p>
          </div>

          <div className="space-y-4">
            {faqData.map((faq, index) => (
              <div key={index} className="bg-gray-50 rounded-2xl overflow-hidden">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-6 text-left flex justify-between items-center hover:bg-gray-100 transition-colors"
                >
                  <h3 className="text-lg font-semibold text-gray-900 pr-4">{faq.question}</h3>
                  {expandedFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  )}
                </button>
                {expandedFaq === index && (
                  <div className="px-6 pb-6">
                    <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-emerald-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your {TOWN_CONFIG.name} Home?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of {TOWN_CONFIG.name} homeowners who've discovered their home's potential 
            with <Link to="/" className="text-blue-200 hover:text-white underline">AI-powered renovation designs</Link>. Get started free today.
          </p>
          <Link 
            to="/"
            className="inline-block bg-white text-blue-600 hover:bg-gray-100 font-semibold px-8 py-4 rounded-2xl text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
          >
            Try AI Renovation Free
          </Link>
          <div className="mt-8 flex justify-center items-center gap-8 text-blue-100">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5" />
              <span>4.9/5 Rating</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span>2,500+ Happy Customers</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              <span>30 Second Results</span>
            </div>
          </div>
        </div>
      </section>

      {/* SEO-Optimized Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-lg"></div>
                <span className="text-xl font-bold">MetroWest Home AI</span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                AI-powered home renovation designs for MetroWest Massachusetts. 
                Transform your space in minutes and connect with local contractors.
              </p>
              <div className="flex items-center gap-4">
                <Phone className="w-5 h-5 text-gray-400" />
                <span className="text-gray-400">(508) 555-0123</span>
              </div>
              <div className="flex items-center gap-4 mt-2">
                <Mail className="w-5 h-5 text-gray-400" />
                <span className="text-gray-400">hello@metrowesthome.ai</span>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/" className="hover:text-white transition-colors">AI Kitchen Design</Link></li>
                <li><Link to="/" className="hover:text-white transition-colors">AI Bathroom Design</Link></li>
                <li><Link to="/" className="hover:text-white transition-colors">Living Room Design</Link></li>
                <li><Link to="/" className="hover:text-white transition-colors">Contractor Matching</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">MetroWest Towns Served</h4>
              <ul className="space-y-1 text-gray-400 text-sm">
                <li>Framingham, MA</li>
                <li>Natick, MA</li>
                <li>Wellesley, MA</li>
                <li>Newton, MA</li>
                <li>Waltham, MA</li>
                <li>Wayland, MA</li>
                <li>Sudbury, MA</li>
                <li>Marlborough, MA</li>
                <li>Hudson, MA</li>
                <li>Ashland, MA</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 MetroWest Home AI. All rights reserved. | <Link to="/" className="hover:text-white transition-colors">Privacy Policy</Link> | <Link to="/" className="hover:text-white transition-colors">Terms of Service</Link></p>
          </div>
        </div>
      </footer>

      {/* Schema.org JSON-LD for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqData.map(faq => ({
              "@type": "Question",
              "name": faq.question,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer
              }
            }))
          })
        }}
      />
    </div>
  );
};

export default FraminghamLanding;