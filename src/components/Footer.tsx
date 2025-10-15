import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin, Users } from 'lucide-react';
import { towns } from '../data/towns';
import { ContractorSignupSection } from './ContractorSignupSection';

const Footer: React.FC = () => {
  return (
    <>
      {/* Exclusive Contractor Signup Section - Above Footer */}
      <div className="bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <ContractorSignupSection />
        </div>
      </div>

      <footer className="bg-gray-900 text-white border-t border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold mb-4">MetroWest Home AI</h3>
            <p className="text-gray-400 mb-6 max-w-md">
              Exclusively for homeowners in MetroWest Massachusetts. Transform your space with AI technology 
              and connect with local contractors to bring your vision to life.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><a href="#about" className="text-gray-400 hover:text-white transition-colors">About Us</a></li>
              <li><a href="#how-it-works" className="text-gray-400 hover:text-white transition-colors">How It Works</a></li>
              <li><a href="#inspiration-feed" className="text-gray-400 hover:text-white transition-colors">Inspiration Gallery</a></li>
              <li><a href="#contact" className="text-gray-400 hover:text-white transition-colors">Contact</a></li>
              <li><Link to="/feedback" className="text-gray-400 hover:text-white transition-colors">Feedback</Link></li>
            </ul>
          </div>

          {/* MetroWest Towns Served */}
          <div>
            <h4 className="text-lg font-semibold mb-4">MetroWest Towns Served</h4>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-gray-400 text-sm">
              {towns.map((town) => (
                <li key={town.slug}>
                  <Link
                    to={`/${town.slug}-ma-ai-home-renovations`}
                    className="hover:text-white transition-colors"
                  >
                    {town.name}, {town.state}
                  </Link>
                </li>
              ))}
              <li><a href="#" className="hover:text-white transition-colors">Acton, MA</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Ashland, MA</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Bedford, MA</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Bellingham, MA</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Berlin, MA</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Bolton, MA</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Boxborough, MA</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Concord, MA</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Dover, MA</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Franklin, MA</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Holliston, MA</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Hopkinton, MA</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Hudson, MA</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Lincoln, MA</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Maynard, MA</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Marlborough, MA</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Medfield, MA</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Medway, MA</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Milford, MA</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Millis, MA</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Needham, MA</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Newton, MA</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Sherborn, MA</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Southborough, MA</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Stow, MA</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Sudbury, MA</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Waltham, MA</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Weston, MA</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Westborough, MA</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Wayland, MA</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-gray-400">hello@metrowesthome.ai</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-gray-400">(508) 555-0123</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-gray-400">MetroWest, MA</span>
              </div>
            </div>
          </div>
        </div>

        {/* Newsletter Signup */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h4 className="text-lg font-semibold mb-2">Stay Updated</h4>
              <p className="text-gray-400">Get weekly design inspiration and tips delivered to your inbox.</p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 md:w-64 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none text-white"
              />
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-sm">
            © 2024 MetroWest Home AI. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#terms" className="text-gray-400 hover:text-white text-sm transition-colors">Terms of Service</a>
            <a href="#privacy" className="text-gray-400 hover:text-white text-sm transition-colors">Privacy Policy</a>
            <a href="#cookies" className="text-gray-400 hover:text-white text-sm transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
    </>
  );
};

export default Footer;