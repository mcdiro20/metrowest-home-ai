import React, { useState } from 'react';
import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import HeroSection from './components/HeroSection';
import UploadSection from './components/UploadSection';
import AIWorkflowManager from './components/AIWorkflowManager';
import InspirationFeed from './components/InspirationFeed';
import HowItWorksSection from './components/HowItWorksSection';
import WhyChooseUsSection from './components/WhyChooseUsSection';
import Footer from './components/Footer';
import TownLandingPage from './pages/TownLandingPage';
import AdminDashboard from './components/AdminDashboard';
import { supabase } from './lib/supabase';
import { AnalyticsService } from './services/analyticsService';
import type { User } from '@supabase/supabase-js';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [userZipCode, setUserZipCode] = useState<string>('');
  const [pageStartTime] = useState(Date.now());
  const aiWorkflowRef = React.useRef<any>(null);

  // Handle authentication state changes
  useEffect(() => {
    if (!supabase) return;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        AnalyticsService.trackEvent('login');
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        AnalyticsService.trackEvent('login');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Track page views and time spent
  useEffect(() => {
    AnalyticsService.trackPageView(window.location.pathname);
    
    return () => {
      AnalyticsService.trackTimeSpent(window.location.pathname, pageStartTime);
    };
  }, [pageStartTime]);
  const handleStartAIWorkflow = () => {
    if (aiWorkflowRef.current) {
      aiWorkflowRef.current.startAIWorkflow();
    }
  };
  
  const handleZipCodeApproved = (zipCode: string) => {
    setUserZipCode(zipCode);
  };
  
  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
  };

  return (
    <Router>
      <Analytics />
      <Routes>
        <Route 
          path="/admin" 
          element={<AdminDashboard />} 
        />
        <Route 
          path="/:townSlug-ma-ai-home-renovations" 
          element={
            <TownLandingPage 
              user={user}
              onSignOut={handleSignOut}
              onShowAuth={() => setShowAuthModal(true)}
          userZipCode={userZipCode}
          onZipCodeApproved={handleZipCodeApproved}
            />
          } 
        />
        <Route path="/" element={
          <div className="min-h-screen bg-white">
            <HeroSection 
              onUploadClick={handleStartAIWorkflow} 
              user={user}
              onSignOut={handleSignOut}
              onShowAuth={() => setShowAuthModal(true)}
            />
            
            <div id="upload-section">
              <UploadSection 
                onFileUpload={(file) => {
                  if (aiWorkflowRef.current) {
                    aiWorkflowRef.current.handleFileUpload(file);
                  }
                }}
                isZipCodeApproved={!!userZipCode}
              />
            </div>
            
            <div id="inspiration-feed">
              <InspirationFeed user={user} onShowAuth={() => setShowAuthModal(true)} />
            </div>
            
            <div id="how-it-works">
              <HowItWorksSection />
            </div>
            
            <div id="why-choose-us">
              <WhyChooseUsSection />
            </div>
            
            <Footer />
          </div>
        } />
      </Routes>
      
      {/* AI Workflow Manager - Global component */}
      <AIWorkflowManager
        ref={aiWorkflowRef}
        user={user}
        userZipCode={userZipCode}
        onZipCodeApproved={handleZipCodeApproved}
        onSignOut={handleSignOut}
        onShowAuth={() => setShowAuthModal(true)}
      />
    </Router>
  );
}

export default App;