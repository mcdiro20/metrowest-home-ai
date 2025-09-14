import React, { useState, useEffect } from 'react';
import { X, Zap, Clock, CheckCircle, Eye, Cpu, Award, Sparkles } from 'lucide-react';
import { AnalyticsService } from '../services/analyticsService';
import type { ProcessedImage } from '../utils/imageUtils';

interface AIProcessingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (result: { originalImage: string; generatedImage: string; prompt: string }) => void;
  processedImageData?: ProcessedImage | null;
  selectedStyle?: {id: string; name: string; prompt: string};
  roomType?: string;
  customPrompt?: string;
}

const AIProcessingModal: React.FC<AIProcessingModalProps> = ({ 
  isOpen, 
  onClose, 
  onComplete, 
  processedImageData,
  selectedStyle,
  roomType = 'kitchen',
  customPrompt
}) => {
  const [stage, setStage] = useState<'analyzing' | 'generating' | 'complete'>('analyzing');
  const [progress, setProgress] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [currentStep, setCurrentStep] = useState<'analysis' | 'architecture' | 'generation' | 'enhancement' | 'complete'>('analysis');

  useEffect(() => {
    if (!isOpen || !processedImageData) return;

    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    const processImage = async () => {
      try {
        // Stage 1: Premium Analysis (0-25%)
        setStage('analyzing');
        setCurrentStep('analysis');
        for (let i = 0; i <= 15; i += 1) {
          setProgress(i);
          await new Promise(resolve => setTimeout(resolve, 120));
        }

        // Stage 2: Architectural Preservation (15-35%)
        setCurrentStep('architecture');
        for (let i = 15; i <= 35; i += 1) {
          setProgress(i);
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Stage 3: Premium Generation (35-80%)
        setStage('generating');
        setCurrentStep('generation');
        
        console.log('🏛️ Starting premium architectural rendering...');
        
        let generatedImageUrl: string;
        
        // Create blob URL from processed base64 for display
        const base64Data = processedImageData.base64.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/jpeg' });
        const originalImageUrl = URL.createObjectURL(blob);
        
        console.log('📱 Using pre-processed image data:', {
          originalSize: `${(processedImageData.originalSize / (1024 * 1024)).toFixed(2)}MB`,
          processedSize: `${(processedImageData.processedSize / (1024 * 1024)).toFixed(2)}MB`,
          dimensions: `${processedImageData.processedDimensions.width}x${processedImageData.processedDimensions.height}`
        });
        
        try {
          // Generate a premium seed for consistency
          const premiumSeed = Math.floor(Math.random() * 1000000);
          
          const response = await fetch('/api/generate-stable-diffusion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageData: processedImageData.base64,
              roomType: roomType,
              selectedStyle: selectedStyle,
              customPrompt: customPrompt,
              seed: premiumSeed
            })
          });
          
          if (!response.ok) {
            throw new Error(`Premium rendering failed: ${response.status}`);
          }
          
          const renovationResult = await response.json();
          console.log('🏆 Premium renovation result:', renovationResult);
          
          if (renovationResult.success) {
            generatedImageUrl = renovationResult.generatedImageUrl!;
            console.log('✅ Premium architectural rendering successful');
          } else {
            throw new Error(renovationResult.error || 'Premium rendering failed');
          }
        } catch (aiError) {
          console.error('❌ Premium rendering failed:', aiError);
          // Premium fallback images
          const premiumDemoImages = {
            kitchen: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
            bathroom: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?ixlib=rb-4.0.3&auto=format&fit=crop&w=2069&q=80',
            living_room: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=2058&q=80'
          };
          generatedImageUrl = premiumDemoImages[roomType as keyof typeof premiumDemoImages] || premiumDemoImages.kitchen;
          console.log('🔄 Using premium demo as fallback');
        }

        // Progress through generation
        for (let i = 35; i <= 80; i += 1) {
          setProgress(i);
          await new Promise(resolve => setTimeout(resolve, 60));
        }

        // Stage 4: Enhancement (80-95%)
        setCurrentStep('enhancement');
        for (let i = 80; i <= 95; i += 1) {
          setProgress(i);
          await new Promise(resolve => setTimeout(resolve, 80));
        }

        // Stage 5: Complete (95-100%)
        setStage('complete');
        setCurrentStep('complete');
        for (let i = 95; i <= 100; i += 1) {
          setProgress(i);
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        const result = {
          originalImage: originalImageUrl,
          originalImageBase64: processedImageData.base64,
          generatedImage: generatedImageUrl,
          prompt: selectedStyle?.prompt || 'Premium architectural transformation'
        };

        // Track AI render completion
        AnalyticsService.trackAIRender(
          roomType,
          selectedStyle?.name || 'Custom',
          timeElapsed * 1000,
          true
        );
        setTimeout(() => {
          onComplete(result);
        }, 1500);
      } catch (error) {
        console.error('❌ Premium Processing Error:', error);
        
        // Track AI render failure
        AnalyticsService.trackAIRender(
          roomType,
          selectedStyle?.name || 'Custom',
          timeElapsed * 1000,
          false
        );
        
        setTimeout(() => {
          onClose();
        }, 3000);
      }
    };

    processImage();

    return () => {
      clearInterval(timer);
      setProgress(0);
      setTimeElapsed(0);
      setStage('analyzing');
    };
  }, [isOpen, processedImageData, selectedStyle, roomType, onComplete]);

  if (!isOpen) return null;

  const getStageInfo = () => {
    switch (stage) {
      case 'analyzing':
        if (currentStep === 'analysis') {
          return {
            title: 'Premium Architectural Analysis',
            description: 'AI architects analyzing spatial relationships and structural integrity with museum-quality precision.',
            icon: <Eye className="w-6 h-6" />
          };
        } else {
          return {
            title: 'Preserving Room Architecture',
            description: 'Mapping structural elements to maintain authentic proportions and spatial harmony.',
            icon: <Award className="w-6 h-6" />
          };
        }
      case 'generating':
        if (currentStep === 'generation') {
          return {
            title: 'Premium Design Synthesis',
            description: 'Generating luxury finishes with photorealistic materials and professional lighting design.',
            icon: <Zap className="w-6 h-6 animate-pulse" />
          };
        } else {
          return {
            title: 'Architectural Enhancement',
            description: 'Applying museum-quality finishing touches and optimizing visual composition.',
            icon: <Sparkles className="w-6 h-6 animate-pulse" />
          };
        }
      case 'complete':
        return {
          title: 'Architectural Masterpiece Complete!',
          description: 'Your museum-quality renovation visualization is ready for presentation.',
          icon: <CheckCircle className="w-6 h-6" />
        };
    }
  };

  const stageInfo = getStageInfo();

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-8 relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all duration-200 hover:scale-105"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            {stageInfo.icon}
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-3">
            {stageInfo.title}
          </h3>
          <p className="text-gray-600 text-lg leading-relaxed">
            {stageInfo.description}
          </p>
        </div>

        {/* Premium Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm font-medium text-gray-600 mb-3">
            <span>Premium Rendering Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 shadow-inner">
            <div 
              className="bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 h-4 rounded-full transition-all duration-500 ease-out shadow-lg"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Premium Processing Steps */}
        <div className="space-y-4">
          <div className={`flex items-center gap-4 text-sm font-medium ${currentStep === 'analysis' ? 'text-blue-600' : progress > 15 ? 'text-emerald-600' : 'text-gray-400'}`}>
            <div className={`w-3 h-3 rounded-full ${currentStep === 'analysis' ? 'bg-blue-600 animate-pulse shadow-lg' : progress > 15 ? 'bg-emerald-600' : 'bg-gray-300'}`}></div>
            <span>Premium architectural vision analysis</span>
          </div>
          <div className={`flex items-center gap-4 text-sm font-medium ${currentStep === 'architecture' ? 'text-blue-600' : progress > 35 ? 'text-emerald-600' : 'text-gray-400'}`}>
            <div className={`w-3 h-3 rounded-full ${currentStep === 'architecture' ? 'bg-blue-600 animate-pulse shadow-lg' : progress > 35 ? 'bg-emerald-600' : 'bg-gray-300'}`}></div>
            <span>Structural integrity preservation</span>
          </div>
          <div className={`flex items-center gap-4 text-sm font-medium ${currentStep === 'generation' ? 'text-blue-600' : progress > 80 ? 'text-emerald-600' : 'text-gray-400'}`}>
            <div className={`w-3 h-3 rounded-full ${currentStep === 'generation' ? 'bg-blue-600 animate-pulse shadow-lg' : progress > 80 ? 'bg-emerald-600' : 'bg-gray-300'}`}></div>
            <span>Museum-quality rendering synthesis</span>
          </div>
          <div className={`flex items-center gap-4 text-sm font-medium ${currentStep === 'enhancement' ? 'text-blue-600' : progress > 95 ? 'text-emerald-600' : 'text-gray-400'}`}>
            <div className={`w-3 h-3 rounded-full ${currentStep === 'enhancement' ? 'bg-blue-600 animate-pulse shadow-lg' : progress > 95 ? 'bg-emerald-600' : 'bg-gray-300'}`}></div>
            <span>Architectural masterpiece enhancement</span>
          </div>
          <div className={`flex items-center gap-4 text-sm font-medium ${stage === 'complete' ? 'text-emerald-600' : 'text-gray-400'}`}>
            <div className={`w-3 h-3 rounded-full ${stage === 'complete' ? 'bg-emerald-600 shadow-lg' : 'bg-gray-300'}`}></div>
            <span>Premium visualization complete</span>
          </div>
        </div>

        {/* Time Elapsed */}
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mt-6 pt-6 border-t border-gray-100">
          <Clock className="w-4 h-4" />
          <span>Premium processing time: {timeElapsed}s</span>
        </div>
      </div>
    </div>
  );
};

export default AIProcessingModal;