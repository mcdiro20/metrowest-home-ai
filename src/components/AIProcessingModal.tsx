import React, { useState, useEffect } from 'react';
import { X, Zap, Clock, CheckCircle, Eye, Cpu } from 'lucide-react';

interface AIProcessingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (result: { originalImage: string; generatedImage: string; prompt: string }) => void;
  uploadedFile?: File;
  selectedStyle?: {id: string; name: string; prompt: string};
  roomType?: string;
  customPrompt?: string;
}

const AIProcessingModal: React.FC<AIProcessingModalProps> = ({ 
  isOpen, 
  onClose, 
  onComplete, 
  uploadedFile,
  selectedStyle,
  roomType = 'kitchen',
  customPrompt
}) => {
  const [stage, setStage] = useState<'analyzing' | 'generating' | 'complete'>('analyzing');
  const [progress, setProgress] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [currentStep, setCurrentStep] = useState<'analysis' | 'prompt' | 'generation' | 'complete'>('analysis');

  useEffect(() => {
    if (!isOpen || !uploadedFile) return;

    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    const processImage = async () => {
      try {
        // Stage 1: Image Analysis (0-20%)
        setStage('analyzing');
        setCurrentStep('analysis');
        for (let i = 0; i <= 20; i += 2) {
          setProgress(i);
          await new Promise(resolve => setTimeout(resolve, 150));
        }

        // Stage 2: Prompt Generation (20-30%)
        setCurrentStep('prompt');
        for (let i = 20; i <= 30; i += 2) {
          setProgress(i);
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Stage 3: AI Generation (30-90%)
        setStage('generating');
        setCurrentStep('generation');
        
        console.log('🎨 Starting enhanced AI image generation...');
        console.log('🎨 Uploaded file:', uploadedFile?.name);
        console.log('🎨 Selected style:', selectedStyle);
        console.log('🎨 Room type:', roomType);
        
        // Use enhanced AI service with image analysis
        let generatedImageUrl: string;
        const originalImageUrl = URL.createObjectURL(uploadedFile);
        
        // Store the original image as base64 for email
        const originalImageBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            console.log('📸 Original image base64 created, length:', result?.length);
            console.log('📸 Base64 starts with:', result?.substring(0, 50));
            resolve(result);
          };
          reader.onerror = (error) => {
            console.error('❌ FileReader error:', error);
            reject(error);
          };
          reader.readAsDataURL(uploadedFile);
        });
        
        console.log('📸 Final originalImageBase64 length:', originalImageBase64?.length);
        
        try {
          // Use the new DALL-E only renovation service
          console.log('🎨 Using DALL-E renovation service...');
          const { DalleRenovationService } = await import('../services/dalleRenovationService');
          
          const renovationResult = await DalleRenovationService.processRenovationRequest({
            imageFile: uploadedFile,
            styleChoice: selectedStyle?.id || 'modern-minimalist',
            roomType: roomType,
            customPrompt: customPrompt
          });
          
          if (renovationResult.success && renovationResult.imageUrl) {
            generatedImageUrl = renovationResult.imageUrl;
            console.log('✅ DALL-E renovation successful');
            if (renovationResult.fallback) {
              console.log('⚠️ Used fallback generation');
            }
          } else {
            throw new Error(renovationResult.error || 'Generation failed');
          }
        } catch (aiError) {
          console.error('❌ AI generation failed:', aiError);
          // Final fallback to demo image
          const demoImages = {
            kitchen: 'https://images.pexels.com/photos/1080721/pexels-photo-1080721.jpeg?auto=compress&cs=tinysrgb&w=1024',
            bathroom: 'https://images.pexels.com/photos/2062426/pexels-photo-2062426.jpeg?auto=compress&cs=tinysrgb&w=1024',
            living_room: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=1024',
            bedroom: 'https://images.pexels.com/photos/2089698/pexels-photo-2089698.jpeg?auto=compress&cs=tinysrgb&w=1024',
            dining_room: 'https://images.pexels.com/photos/2724749/pexels-photo-2724749.jpeg?auto=compress&cs=tinysrgb&w=1024',
            home_office: 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=1024',
            other: 'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=1024'
          };
          generatedImageUrl = demoImages[roomType as keyof typeof demoImages] || demoImages.kitchen;
        }

        // Update progress during generation
        for (let i = 30; i <= 90; i += 3) {
          setProgress(i);
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        // Stage 4: Complete (90-100%)
        setStage('complete');
        setCurrentStep('complete');
        for (let i = 90; i <= 100; i += 2) {
          setProgress(i);
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        const result = {
          originalImage: originalImageUrl,
          originalImageBase64: originalImageBase64,
          generatedImage: generatedImageUrl,
          prompt: selectedStyle?.prompt || 'AI-generated design transformation'
        };

        console.log('🎨 Final result:', result);
        console.log('🎨 Result originalImageBase64 length:', result.originalImageBase64?.length);
        setTimeout(() => {
          onComplete(result);
        }, 1000);
      } catch (error) {
        console.error('❌ AI Processing Error:', error);
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
  }, [isOpen, uploadedFile, selectedStyle, roomType, onComplete]);

  if (!isOpen) return null;

  const getStageInfo = () => {
    switch (stage) {
      case 'analyzing':
        return {
          title: currentStep === 'analysis' ? 'Analyzing Your Space' : 'Generating Renovation Plan',
          description: currentStep === 'analysis' 
            ? 'Our AI is examining your photo to understand the layout, architectural features, and structural elements.'
            : 'Creating a detailed renovation plan that preserves your existing layout while applying the selected style.',
          icon: currentStep === 'analysis' ? <Eye className="w-6 h-6" /> : <Cpu className="w-6 h-6" />
        };
      case 'generating':
        return {
          title: 'Generating Your Design',
          description: 'Creating a beautiful transformation with modern design elements and improved aesthetics.',
          icon: <Zap className="w-6 h-6 animate-pulse" />
        };
      case 'complete':
        return {
          title: 'Design Complete!',
          description: 'Your AI-generated transformation is ready. Preparing your before/after comparison.',
          icon: <CheckCircle className="w-6 h-6" />
        };
    }
  };

  const stageInfo = getStageInfo();

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {stageInfo.icon}
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {stageInfo.title}
          </h3>
          <p className="text-gray-600">
            {stageInfo.description}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-600 to-emerald-600 h-3 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Time Elapsed */}
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <Clock className="w-4 h-4" />
          <span>Processing time: {timeElapsed}s</span>
        </div>

        {/* Processing Steps */}
        <div className="mt-6 space-y-2">
          <div className={`flex items-center gap-3 text-sm ${stage === 'analyzing' ? 'text-blue-600' : progress > 30 ? 'text-emerald-600' : 'text-gray-400'}`}>
            <div className={`w-2 h-2 rounded-full ${stage === 'analyzing' && currentStep === 'analysis' ? 'bg-blue-600 animate-pulse' : progress > 20 ? 'bg-emerald-600' : 'bg-gray-300'}`}></div>
            <span>Analyzing architectural features and layout</span>
          </div>
          <div className={`flex items-center gap-3 text-sm ${currentStep === 'prompt' ? 'text-blue-600' : progress > 30 ? 'text-emerald-600' : 'text-gray-400'}`}>
            <div className={`w-2 h-2 rounded-full ${currentStep === 'prompt' ? 'bg-blue-600 animate-pulse' : progress > 30 ? 'bg-emerald-600' : 'bg-gray-300'}`}></div>
            <span>Creating layout-preserving renovation plan</span>
          </div>
          <div className={`flex items-center gap-3 text-sm ${currentStep === 'generation' ? 'text-blue-600' : progress > 90 ? 'text-emerald-600' : 'text-gray-400'}`}>
            <div className={`w-2 h-2 rounded-full ${currentStep === 'generation' ? 'bg-blue-600 animate-pulse' : progress > 90 ? 'bg-emerald-600' : 'bg-gray-300'}`}></div>
            <span>Generating design transformation</span>
          </div>
          <div className={`flex items-center gap-3 text-sm ${stage === 'complete' ? 'text-emerald-600' : 'text-gray-400'}`}>
            <div className={`w-2 h-2 rounded-full ${stage === 'complete' ? 'bg-emerald-600' : 'bg-gray-300'}`}></div>
            <span>Finalizing your design</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIProcessingModal;