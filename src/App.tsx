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
import DebugPanel from './components/DebugPanel';
import TownLandingPage from './pages/TownLandingPage';
import AdminPanel from './components/AdminPanel';
import AdminDashboard from './components/AdminDashboard';
import ContractorDashboard from './pages/ContractorDashboard';
import LeadDossierDemo from './components/LeadDossierDemo';
import FeedbackPage from './pages/FeedbackPage';
import AuthModal from './components/AuthModal';
import { supabase } from './lib/supabase';
import { AnalyticsService } from './services/analyticsService';
import type { User } from '@supabase/supabase-js';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [userZipCode, setUserZipCode] = useState<string>('');
  const [pageStartTime] = useState(Date.now());
  const [isAdmin, setIsAdmin] = useState(false);
  const aiWorkflowRef = React.useRef<any>(null);

  // Handle authentication state changes
  useEffect(() => {
    if (!supabase) return;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      // Only track actual sign-in events, not token refreshes or initial sessions
      if (event === 'SIGNED_IN' && session?.user) {
        AnalyticsService.trackEvent('login');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check if user is admin
  useEffect(() => {
    const checkAdminRole = async () => {
      if (!supabase || !user) {
        setIsAdmin(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      setIsAdmin(profile?.role === 'admin');
    };

    checkAdminRole();
  }, [user]);

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
          element={
            <AdminDashboard />
          } 
        />
        <Route 
          path="/contractor-dashboard" 
          element={
            <ContractorDashboard />
          } 
        />
        <Route
          path="/lead-dossier-demo"
          element={<LeadDossierDemo />}
        />
        <Route
          path="/feedback"
          element={<FeedbackPage />}
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

            {isAdmin && <DebugPanel />}

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

      {/* Auth Modal - Global component */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={() => setShowAuthModal(false)}
      />
    </Router>
  );
}

export default App;