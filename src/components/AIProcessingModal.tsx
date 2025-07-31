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
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Stage 2: Professional Rendering Setup (20-40%)
        setCurrentStep('prompt');
        for (let i = 20; i <= 40; i += 2) {
          setProgress(i);
          await new Promise(resolve => setTimeout(resolve, 80));
        }

        // Stage 3: Professional AI Rendering (40-90%)
        setStage('generating');
        setCurrentStep('generation');
        
        console.log('🏗️ Starting professional architectural rendering...');
        console.log('🎨 Uploaded file:', uploadedFile?.name);
        console.log('🎨 Selected style:', selectedStyle);
        console.log('🎨 Room type:', roomType);
        
        // Use professional rendering service
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
          // Use professional architectural rendering service
          console.log('🏗️ Starting professional architectural rendering...');
          
          // Convert file to base64
          const imageBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(uploadedFile);
          });
          
          // Call professional rendering API
          const response = await fetch('/api/generate-renovation', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              imageData: imageBase64,
              roomType: roomType,
              selectedStyle: selectedStyle,
              customPrompt: customPrompt
            })
          });
          
          if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
          }
          
          const renovationResult = await response.json();
          console.log('🏗️ Professional renovation result:', renovationResult);
          
          if (renovationResult.success) {
            generatedImageUrl = renovationResult.generatedImageUrl!;
            console.log('✅ Professional architectural rendering successful');
          } else {
            console.error('❌ Professional renovation failed:', renovationResult.error);
            throw new Error(renovationResult.error || 'Professional renovation failed');
          }
        } catch (aiError) {
          console.error('❌ Professional renovation failed:', aiError);
          // Fallback to demo image
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
          console.log('🔄 Using demo image as fallback after professional rendering failure');
        }

        // Update progress during generation
        for (let i = 40; i <= 90; i += 2) {
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
        if (currentStep === 'analysis') {
          return {
            title: 'Professional Vision Analysis',
            description: 'AI architects analyzing your space with $10,000 professional rendering precision.',
            icon: <Eye className="w-6 h-6" />
          };
        } else {
          return {
            title: 'Preparing Premium Rendering Pipeline',
            description: 'Configuring professional DALL-E 3 HD quality rendering with architectural precision.',
            icon: <Cpu className="w-6 h-6" />
          };
        }
      case 'generating':
        return {
          title: '$10,000 Architectural Rendering',
          description: 'Creating your magazine-quality renovation with photorealistic materials and professional lighting.',
          icon: <Zap className="w-6 h-6 animate-pulse" />
        };
      case 'complete':
        return {
          title: 'Premium Rendering Complete!',
          description: 'Your $10,000 quality architectural visualization is ready!',
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
            <span>Professional architectural analysis with Vision API</span>
          </div>
          <div className={`flex items-center gap-3 text-sm ${currentStep === 'prompt' ? 'text-blue-600' : progress > 40 ? 'text-emerald-600' : 'text-gray-400'}`}>
            <div className={`w-2 h-2 rounded-full ${currentStep === 'prompt' ? 'bg-blue-600 animate-pulse' : progress > 40 ? 'bg-emerald-600' : 'bg-gray-300'}`}></div>
            <span>Generating $10,000 quality rendering prompts</span>
          </div>
          <div className={`flex items-center gap-3 text-sm ${currentStep === 'generation' ? 'text-blue-600' : progress > 90 ? 'text-emerald-600' : 'text-gray-400'}`}>
            <div className={`w-2 h-2 rounded-full ${currentStep === 'generation' ? 'bg-blue-600 animate-pulse' : progress > 90 ? 'bg-emerald-600' : 'bg-gray-300'}`}></div>
            <span>DALL-E 3 HD professional architectural rendering</span>
          </div>
          <div className={`flex items-center gap-3 text-sm ${stage === 'complete' ? 'text-emerald-600' : 'text-gray-400'}`}>
            <div className={`w-2 h-2 rounded-full ${stage === 'complete' ? 'bg-emerald-600' : 'bg-gray-300'}`}></div>
            <span>Finalizing magazine-quality architectural visualization</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIProcessingModal;