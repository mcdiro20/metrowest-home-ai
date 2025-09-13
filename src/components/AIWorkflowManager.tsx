import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import RoomTypeModal from './RoomTypeModal';
import StyleSelectionModal from './StyleSelectionModal';
import AIProcessingModal from './AIProcessingModal';
import EmailModal from './EmailModal';
import ZipCodeModal from './ZipCodeModal';
import QuoteRequestModal from './QuoteRequestModal';
import AuthModal from './AuthModal';
import type { User } from '@supabase/supabase-js';
import { resizeImageForEmail } from '../utils/imageUtils';

interface AIWorkflowManagerProps {
  user: User | null;
  userZipCode: string;
  onZipCodeApproved: (zipCode: string) => void;
  onSignOut: () => void;
  onShowAuth: () => void;
}

export interface AIWorkflowHandle {
  startAIWorkflow: () => void;
  handleFileUpload: (file: File) => void;
}

const AIWorkflowManager = forwardRef<AIWorkflowHandle, AIWorkflowManagerProps>(
  ({ user, userZipCode, onZipCodeApproved, onSignOut, onShowAuth }, ref) => {
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showZipCodeModal, setShowZipCodeModal] = useState(false);
    const [showRoomTypeModal, setShowRoomTypeModal] = useState(false);
    const [showStyleSelectionModal, setShowStyleSelectionModal] = useState(false);
    const [showAIProcessingModal, setShowAIProcessingModal] = useState(false);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [showQuoteModal, setShowQuoteModal] = useState(false);
    const [uploadedImage, setUploadedImage] = useState<string | undefined>();
    const [aiResult, setAiResult] = useState<{ originalImage: string; originalImageBase64?: string; resizedOriginalImageBase64?: string; generatedImage: string; prompt: string } | undefined>();
    const [uploadedFile, setUploadedFile] = useState<File | undefined>();
    const [selectedStyle, setSelectedStyle] = useState<{ id: string; name: string; prompt: string } | undefined>();
    const [customPrompt, setCustomPrompt] = useState<string>('');
    const [roomType, setRoomType] = useState<string>('');
    const [emailSubmitted, setEmailSubmitted] = useState(false);
    const [currentCustomerId, setCurrentCustomerId] = useState<string | undefined>();
    const [currentDesignRequestId, setCurrentDesignRequestId] = useState<string | undefined>();

    const fileInputRef = useRef<HTMLInputElement>(null);
    const uploadSectionRef = useRef<HTMLDivElement>(null);

    const startAIWorkflow = () => {
      if (!user) {
        setShowAuthModal(true);
        return;
      }
      setShowZipCodeModal(true);
    };

    const handleZipCodeApproved = (zipCode: string) => {
      onZipCodeApproved(zipCode);
      setShowZipCodeModal(false);

      // Smooth scroll to the main upload section on the page
      setTimeout(() => {
        const uploadSection = document.getElementById('upload-section');
        if (uploadSection) {
          uploadSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 200);
    };

    const handleFileUpload = (file: File) => {
      setUploadedFile(file);
      setShowRoomTypeModal(true);
    };

    const handleMobileUpload = () => {
      fileInputRef.current?.click();
    };

    const handleQRCodeUpload = () => {
      alert('QR Code upload triggered — implement QR scan logic here.');
    };

    const handleRoomTypeSelected = (selectedRoomType: string) => {
      setRoomType(selectedRoomType);
      setShowRoomTypeModal(false);
      setShowStyleSelectionModal(true);
    };

    const handleStyleSelected = (style: { id: string; name: string; description: string; imageUrl: string; prompt: string }) => {
      setSelectedStyle(style);
      setCustomPrompt('');
      setShowStyleSelectionModal(false);
      setShowAIProcessingModal(true);
    };

    const handleCustomStyleSelected = (customPromptText: string, baseStyle?: string) => {
      setCustomPrompt(customPromptText);
      setSelectedStyle({ id: baseStyle || 'custom', name: 'Custom Style', prompt: customPromptText });
      setShowStyleSelectionModal(false);
      setShowAIProcessingModal(true);
    };

    const handleAIProcessingComplete = async (result: { originalImage: string; originalImageBase64?: string; generatedImage: string; prompt: string }) => {
      // Resize the original image for email sending to avoid payload too large errors
      let resizedOriginalImageBase64: string | undefined;
      if (result.originalImageBase64) {
        try {
          console.log('📏 Resizing original image for email to avoid 413 error...');
          resizedOriginalImageBase64 = await resizeImageForEmail(result.originalImageBase64);
          console.log('✅ Image resized successfully for email');
        } catch (error) {
          console.error('❌ Error resizing original image for email:', error);
          // If resizing fails, we'll use the original (might still cause 413 but better than nothing)
          resizedOriginalImageBase64 = result.originalImageBase64;
        }
      }
      
      setAiResult({
        ...result,
        resizedOriginalImageBase64
      });
      setUploadedImage(result.generatedImage);
      setShowAIProcessingModal(false);
      setTimeout(() => setShowEmailModal(true), 500);
    };

    const handleEmailSubmitted = () => {
      setEmailSubmitted(true);
      setShowEmailModal(false);
      setTimeout(() => setShowQuoteModal(true), 1000);
    };

    const closeEmailModal = () => {
      setShowEmailModal(false);
      resetState();
    };

    const closeQuoteModal = () => {
      setShowQuoteModal(false);
      resetState();
    };

    const resetState = () => {
      if (aiResult?.originalImage) URL.revokeObjectURL(aiResult.originalImage);
      setUploadedImage(undefined);
      setAiResult(undefined);
      setUploadedFile(undefined);
      setSelectedStyle(undefined);
      setEmailSubmitted(false);
    };

    const handleAuthSuccess = () => {
      setShowAuthModal(false);
    };

    // Expose functions to parent
    useImperativeHandle(ref, () => ({
      startAIWorkflow,
      handleFileUpload
    }));

    return (
      <>
        {/* Hidden file input */}
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files?.[0]) {
              handleFileUpload(e.target.files[0]);
            }
          }}
        />

        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onAuthSuccess={handleAuthSuccess} />
        <ZipCodeModal isOpen={showZipCodeModal} onClose={() => setShowZipCodeModal(false)} onZipCodeApproved={handleZipCodeApproved} />
        <RoomTypeModal isOpen={showRoomTypeModal} onClose={() => setShowRoomTypeModal(false)} onRoomTypeSelected={handleRoomTypeSelected} />
        <StyleSelectionModal isOpen={showStyleSelectionModal} onClose={() => setShowStyleSelectionModal(false)} onStyleSelected={handleStyleSelected} onCustomStyleSelected={handleCustomStyleSelected} roomType={roomType} />
        <AIProcessingModal isOpen={showAIProcessingModal} onClose={() => setShowAIProcessingModal(false)} onComplete={handleAIProcessingComplete} uploadedFile={uploadedFile} selectedStyle={selectedStyle} roomType={roomType} customPrompt={customPrompt} />
        <EmailModal isOpen={showEmailModal} onClose={closeEmailModal} uploadedImage={aiResult?.generatedImage} beforeImage={aiResult?.resizedOriginalImageBase64 || aiResult?.originalImage} selectedStyle={selectedStyle?.name} roomType={roomType} zipCode={userZipCode} designRequestId={currentDesignRequestId} onEmailSubmitted={handleEmailSubmitted} user={user} />
        <QuoteRequestModal isOpen={showQuoteModal} onClose={closeQuoteModal} zipCode={userZipCode} />
      </>
    );
  }
);

export default AIWorkflowManager;