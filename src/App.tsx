import React, { useState } from 'react';
import HeroSection from './components/HeroSection';
import UploadSection from './components/UploadSection';
import StyleSelectionModal from './components/StyleSelectionModal';
import AIProcessingModal from './components/AIProcessingModal';
import EmailModal from './components/EmailModal';
import ZipCodeModal from './components/ZipCodeModal';
import QuoteRequestModal from './components/QuoteRequestModal';
import InspirationFeed from './components/InspirationFeed';
import HowItWorksSection from './components/HowItWorksSection';
import WhyChooseUsSection from './components/WhyChooseUsSection';
import Footer from './components/Footer';
import DebugPanel from './components/DebugPanel';
import { CustomerService } from './services/customerService';

function App() {
  const [showZipCodeModal, setShowZipCodeModal] = useState(false);
  const [showStyleSelectionModal, setShowStyleSelectionModal] = useState(false);
  const [showAIProcessingModal, setShowAIProcessingModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | undefined>();
  const [aiResult, setAiResult] = useState<{originalImage: string; originalImageBase64?: string; generatedImage: string; prompt: string} | undefined>();
  const [uploadedFile, setUploadedFile] = useState<File | undefined>();
  const [selectedStyle, setSelectedStyle] = useState<{id: string; name: string; prompt: string} | undefined>();
  const [userZipCode, setUserZipCode] = useState<string>('');
  const [roomType, setRoomType] = useState<string>('kitchen');
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [currentCustomerId, setCurrentCustomerId] = useState<string | undefined>();
  const [currentDesignRequestId, setCurrentDesignRequestId] = useState<string | undefined>();

  const handleUploadClick = () => {
    setShowZipCodeModal(true);
  };

  const handleZipCodeApproved = (zipCode: string) => {
    setUserZipCode(zipCode);
    setShowZipCodeModal(false);
    // Scroll to upload section
    const uploadSection = document.getElementById('upload-section');
    if (uploadSection) {
      uploadSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
    // Detect room type from file name or let user specify
    // For now, we'll default to kitchen but this could be enhanced
    setShowStyleSelectionModal(true);
  };

  const handleStyleSelected = (style: {id: string; name: string; description: string; imageUrl: string; prompt: string}) => {
    setSelectedStyle(style);
    setShowStyleSelectionModal(false);
    setShowAIProcessingModal(true);
  };

  const handleAIProcessingComplete = (result: {originalImage: string; generatedImage: string; prompt: string}) => {
    // Save design request to database
    const saveDesignRequest = async () => {
      if (userZipCode) {
        try {
          // This will be called when we have customer ID from email modal
          console.log('📊 Design request will be saved after email submission');
        } catch (error) {
          console.error('❌ Failed to save design request:', error);
        }
      }
    };
    
    saveDesignRequest();
    
    setAiResult(result);
    setUploadedImage(result.generatedImage);
    setShowAIProcessingModal(false);
    
    // Show email modal after AI processing
    setTimeout(() => {
      setShowEmailModal(true);
    }, 500);
  };

  const handleEmailSubmitted = () => {
    setEmailSubmitted(true);
    setShowEmailModal(false);
    // Show quote request after a brief delay
    setTimeout(() => {
      setShowQuoteModal(true);
    }, 1000);
  };

  const closeEmailModal = () => {
    setShowEmailModal(false);
    if (aiResult?.originalImage) {
      URL.revokeObjectURL(aiResult.originalImage);
      setUploadedImage(undefined);
      setAiResult(undefined);
    }
    setUploadedFile(undefined);
    setSelectedStyle(undefined);
    setEmailSubmitted(false);
  };

  const closeQuoteModal = () => {
    setShowQuoteModal(false);
    if (aiResult?.originalImage) {
      URL.revokeObjectURL(aiResult.originalImage);
      setUploadedImage(undefined);
      setAiResult(undefined);
    }
    setUploadedFile(undefined);
    setSelectedStyle(undefined);
    setEmailSubmitted(false);
  };

  return (
    <div className="min-h-screen bg-white">
      <HeroSection onUploadClick={handleUploadClick} />
      
      <div id="upload-section">
        <UploadSection 
          onFileUpload={handleFileUpload} 
          isZipCodeApproved={!!userZipCode}
        />
      </div>
      
      <InspirationFeed />
      <HowItWorksSection />
      <WhyChooseUsSection />
      <Footer />
      
      {/* Debug Panel - Remove in production */}
      <DebugPanel />
      
      <ZipCodeModal 
        isOpen={showZipCodeModal}
        onClose={() => setShowZipCodeModal(false)}
        onZipCodeApproved={handleZipCodeApproved}
      />
      
      <StyleSelectionModal
        isOpen={showStyleSelectionModal}
        onClose={() => setShowStyleSelectionModal(false)}
        onStyleSelected={handleStyleSelected}
        roomType="kitchen"
      />
      
      <AIProcessingModal
        isOpen={showAIProcessingModal}
        onClose={() => setShowAIProcessingModal(false)}
        onComplete={handleAIProcessingComplete}
        uploadedFile={uploadedFile}
        selectedStyle={selectedStyle}
        roomType="kitchen"
      />
      
      <EmailModal 
        isOpen={showEmailModal} 
        onClose={closeEmailModal}
        uploadedImage={aiResult?.generatedImage}
        beforeImage={aiResult?.originalImageBase64 || aiResult?.originalImage}
        selectedStyle={selectedStyle?.name}
        roomType={roomType}
        zipCode={userZipCode}
        designRequestId={currentDesignRequestId}
        onEmailSubmitted={handleEmailSubmitted}
      />
      
      <QuoteRequestModal
        isOpen={showQuoteModal}
        onClose={closeQuoteModal}
        zipCode={userZipCode}
      />
    </div>
  );
}

export default App;