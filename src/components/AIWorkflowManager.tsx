import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import RoomTypeModal from './RoomTypeModal';
import StyleSelectionModal from './StyleSelectionModal';
import AIModelSelectionModal from './AIModelSelectionModal';
import AIProcessingModal from './AIProcessingModal';
import EmailModal from './EmailModal';
import ZipCodeModal from './ZipCodeModal';
import QuoteRequestModal from './QuoteRequestModal';
import AuthModal from './AuthModal';
import type { User } from '@supabase/supabase-js';
import { resizeImageForEmail, processImageForUpload, type ProcessedImage, type ImageValidationError } from '../utils/imageUtils';
import { AnalyticsService } from '../services/analyticsService';

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
    const [showAIModelSelectionModal, setShowAIModelSelectionModal] = useState(false);
    const [showStyleSelectionModal, setShowStyleSelectionModal] = useState(false);
    const [showAIProcessingModal, setShowAIProcessingModal] = useState(false);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [showQuoteModal, setShowQuoteModal] = useState(false);
    const [isFileProcessing, setIsFileProcessing] = useState(false);
    const [fileProcessingError, setFileProcessingError] = useState<string | null>(null);
    const [processedImageData, setProcessedImageData] = useState<ProcessedImage | null>(null);
    const [uploadedImage, setUploadedImage] = useState<string | undefined>();
    const [aiResult, setAiResult] = useState<{ originalImage: string; originalImageBase64?: string; resizedOriginalImageBase64?: string; generatedImage: string; prompt: string } | undefined>();
    const [uploadedFile, setUploadedFile] = useState<File | undefined>();
    const [selectedStyle, setSelectedStyle] = useState<{ id: string; name: string; prompt: string } | undefined>();
    const [selectedAIEngine, setSelectedAIEngine] = useState<string>('structural-design-ai');
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

    const handleFileUpload = async (file: File) => {
      console.log('📱 Processing file upload for mobile optimization...');
      setIsFileProcessing(true);
      setFileProcessingError(null);
      setProcessedImageData(null);
      
      try {
        // Process the image for optimal mobile performance
        const processedImage = await processImageForUpload(file);
        
        console.log('✅ Image processing successful:', {
          originalSize: `${(processedImage.originalSize / (1024 * 1024)).toFixed(2)}MB`,
          processedSize: `${(processedImage.processedSize / (1024 * 1024)).toFixed(2)}MB`,
          compressionRatio: `${((1 - processedImage.processedSize / processedImage.originalSize) * 100).toFixed(1)}%`
        });
        
        setProcessedImageData(processedImage);
        setUploadedFile(file); // Keep original file for reference
        setIsFileProcessing(false);
        setShowRoomTypeModal(true);
        
      } catch (error) {
        console.error('❌ Image processing failed:', error);
        setIsFileProcessing(false);
        
        // Handle different types of errors with user-friendly messages
        if (error instanceof Error && 'code' in error) {
          const validationError = error as ImageValidationError;
          switch (validationError.code) {
            case 'FILE_TOO_LARGE':
              setFileProcessingError('Image file is too large. Please choose an image smaller than 5MB or try taking a new photo with lower resolution.');
              break;
            case 'INVALID_FORMAT':
              setFileProcessingError('Invalid image format. Please use JPEG, PNG, WebP, or HEIC images.');
              break;
            case 'LOAD_FAILED':
              setFileProcessingError('Failed to load image. The file may be corrupted. Please try a different image.');
              break;
            case 'PROCESSING_FAILED':
              setFileProcessingError('Image processing failed. Please try a different image or contact support.');
              break;
            default:
              setFileProcessingError('An unexpected error occurred while processing your image. Please try again.');
          }
        } else {
          setFileProcessingError('An unexpected error occurred while processing your image. Please try again.');
        }
      }
    };

    const handleMobileUpload = () => {
      fileInputRef.current?.click();
    };

    const handleQRCodeUpload = () => {
      alert('QR Code upload triggered — implement QR scan logic here.');
    };

    const handleRoomTypeSelected = (selectedRoomType: string) => {
      setRoomType(selectedRoomType);
      AnalyticsService.trackRoomSelection(selectedRoomType);
      setShowRoomTypeModal(false);
      setShowAIModelSelectionModal(true);
    };

    const handleAIModelSelected = (aiEngine: string) => {
      setSelectedAIEngine(aiEngine);
      setShowAIModelSelectionModal(false);
      setShowStyleSelectionModal(true);
    };

    const handleStyleSelected = (style: { id: string; name: string; description: string; imageUrl: string; prompt: string }) => {
      setSelectedStyle(style);
      setCustomPrompt('');
      AnalyticsService.trackStyleSelection(style.name);
      AnalyticsService.trackAIRenderStart(roomType, style.name);
      setShowStyleSelectionModal(false);
      setShowAIProcessingModal(true);
    };

    const handleCustomStyleSelected = (customPromptText: string, baseStyle?: string) => {
      setCustomPrompt(customPromptText);
      setSelectedStyle({ id: baseStyle || 'custom', name: 'Custom Style', prompt: customPromptText });
      AnalyticsService.trackStyleSelection('Custom Style');
      AnalyticsService.trackAIRenderStart(roomType, 'Custom Style');
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
      setIsFileProcessing(false);
      setFileProcessingError(null);
      setProcessedImageData(null);
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
        <AIModelSelectionModal isOpen={showAIModelSelectionModal} onClose={() => setShowAIModelSelectionModal(false)} onModelSelected={handleAIModelSelected} roomType={roomType} />
        <StyleSelectionModal isOpen={showStyleSelectionModal} onClose={() => setShowStyleSelectionModal(false)} onStyleSelected={handleStyleSelected} onCustomStyleSelected={handleCustomStyleSelected} roomType={roomType} selectedAIEngine={selectedAIEngine} />
        <AIProcessingModal 
          isOpen={showAIProcessingModal} 
          onClose={() => setShowAIProcessingModal(false)} 
          onComplete={handleAIProcessingComplete} 
          processedImageData={processedImageData}
          selectedStyle={selectedStyle} 
          selectedAIEngine={selectedAIEngine}
          roomType={roomType} 
          customPrompt={customPrompt} 
        />
        <EmailModal isOpen={showEmailModal} onClose={closeEmailModal} uploadedImage={aiResult?.generatedImage} beforeImage={aiResult?.resizedOriginalImageBase64 || aiResult?.originalImage} selectedStyle={selectedStyle?.name} roomType={roomType} zipCode={userZipCode} designRequestId={currentDesignRequestId} onEmailSubmitted={handleEmailSubmitted} user={user} />
        <QuoteRequestModal isOpen={showQuoteModal} onClose={closeQuoteModal} zipCode={userZipCode} />
      </>
    );
  }
);

export default AIWorkflowManager;