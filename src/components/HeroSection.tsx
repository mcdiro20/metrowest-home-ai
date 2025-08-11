import React from 'react';
import { Upload, Sparkles, User, LogOut } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface HeroSectionProps {
  onUploadClick: () => void;
  user: SupabaseUser | null;
  onSignOut: () => void;
  onShowAuth: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onUploadClick, user, onSignOut, onShowAuth }) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-emerald-900">
        <div className="absolute inset-0 bg-black/30"></div>
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://images.pexels.com/photos/1080721/pexels-photo-1080721.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop)',
            opacity: 0.4
          }}
        ></div>
      </div>
      
      {/* Auth Section */}
      <div className="absolute top-6 right-6 z-20">
        {user ? (
          <div className="flex items-center gap-4">
            <div className="text-white/90 text-sm">
              Welcome, {user.user_metadata?.name || user.email}
            </div>
            <button
              onClick={onSignOut}
              className="flex items-center gap-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-4 py-2 rounded-full transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        ) : (
          <button
            onClick={onShowAuth}
            className="flex items-center gap-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-4 py-2 rounded-full transition-colors"
          >
            <User className="w-4 h-4" />
            Sign In
          </button>
        )}
      </div>
      
      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6 text-white/90 text-sm">
          <Sparkles className="w-4 h-4" />
          <span>AI-Powered Design Technology</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
          Reimagine Your Home with the{' '}
          <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            Power of AI
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
          {user 
            ? "Upload a photo of your kitchen or backyard and see what it could become with stunning AI-generated transformations."
            : "Exclusively for MetroWest Massachusetts homeowners. Sign in to upload a photo and see what your space could become with stunning AI-generated transformations."
          }
        </p>
        
        <button
          onClick={onUploadClick}
          className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-semibold px-8 py-4 rounded-full text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl"
        >
          <Upload className="w-5 h-5" />
          {user ? 'Upload Your Space' : 'Sign In to Upload'}
        </button>
        
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <h3 className="text-white font-semibold mb-2">Before</h3>
            <div className="w-full h-32 bg-white/20 rounded-lg"></div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <h3 className="text-white font-semibold mb-2">After (AI Generated)</h3>
            <div className="w-full h-32 bg-gradient-to-br from-blue-400/30 to-emerald-400/30 rounded-lg"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;