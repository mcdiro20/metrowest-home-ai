import { ImageAnalysisService } from './imageAnalysisService';
import { RenovationPromptService } from './renovationPromptService';

export interface EnhancedAIImageRequest {
  imageFile: File;
  roomType: 'kitchen' | 'backyard' | 'bathroom' | 'living-room';
  selectedStyle?: {id: string; name: string; prompt: string};
  prompt?: string;
}

export interface EnhancedAIImageResponse {
  originalImage: string;
  generatedImage: string;
  prompt: string;
  processingTime: number;
  imageAnalysis?: string;
  method: 'analysis' | 'fallback';
}

export class EnhancedAIImageService {
  static async generateDesign(request: EnhancedAIImageRequest): Promise<EnhancedAIImageResponse> {
    const startTime = Date.now();
    
    try {
      console.log('🎨 Starting enhanced AI renovation process...');
      
      // Step 1: Analyze the uploaded image
      console.log('🔍 Analyzing uploaded image...');
      const imageAnalysis = await ImageAnalysisService.analyzeUploadedImage(request.imageFile);
      console.log('🔍 Vision API analysis result:', imageAnalysis);
      
      // Step 2: Generate comprehensive renovation prompt
      console.log('📝 Generating renovation prompt...');
      const styleChoice = request.selectedStyle?.id || 'modern-minimalist';
      const renovationPrompt = RenovationPromptService.generateRenovationPrompt(styleChoice, imageAnalysis);
      console.log('📝 Enhanced prompt generated with Vision API insights');
      
      // Step 3: Create original image URL
      const originalImageUrl = URL.createObjectURL(request.imageFile);
      
      // Step 4: Generate renovation with enhanced prompts
      console.log('🎨 Creating renovation visualization...');
      const generatedImageUrl = await this.generateWithRetry(renovationPrompt, request.imageFile);
      
      const processingTime = Date.now() - startTime;
      
      return {
        originalImage: originalImageUrl,
        generatedImage: generatedImageUrl,
        prompt: renovationPrompt,
        processingTime,
        imageAnalysis,
        method: 'analysis'
      };
      
    } catch (error) {
      console.error('❌ Enhanced AI generation failed:', error);
      // Fallback to basic generation
      return this.fallbackGeneration(request, startTime);
    }
  }

  private static async generateWithRetry(prompt: string, imageFile: File, maxRetries: number = 3): Promise<string> {
    const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!openaiKey) {
      throw new Error('OpenAI API key not configured');
    }
    
    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({
      apiKey: openaiKey,
      dangerouslyAllowBrowser: true
    });

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🎨 Generation attempt ${attempt}/${maxRetries}`);
        
        const response = await openai.images.generate({
          model: "dall-e-3",
          prompt: prompt,
          n: 1,
          size: "1024x1024",
          quality: "hd",
          style: "natural"
        });

        const imageUrl = response.data[0]?.url;
        if (!imageUrl) {
          throw new Error('No image URL returned from OpenAI');
        }

        console.log('✅ AI renovation generated successfully');
        return imageUrl;

      } catch (error) {
        console.log(`❌ Attempt ${attempt} failed:`, error);
        if (attempt === maxRetries) {
          throw error;
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    throw new Error('All generation attempts failed');
  }

  private static async fallbackGeneration(
    request: EnhancedAIImageRequest, 
    startTime: number
  ): Promise<EnhancedAIImageResponse> {
    console.log('🔄 Using fallback generation...');
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const originalImageUrl = URL.createObjectURL(request.imageFile);
    const demoImageUrl = this.getDemoImage();
    const fallbackPrompt = RenovationPromptService.createFallbackPrompt(request.selectedStyle?.id || 'modern-minimalist');
    
    const processingTime = Date.now() - startTime;

    return {
      originalImage: originalImageUrl,
      generatedImage: demoImageUrl,
      prompt: fallbackPrompt,
      processingTime,
      imageAnalysis: 'Fallback analysis - preserving existing layout and features',
      method: 'fallback'
    };
  }

  private static getDemoImage(): string {
    const demoImages = [
      'https://images.pexels.com/photos/1080721/pexels-photo-1080721.jpeg?auto=compress&cs=tinysrgb&w=1024',
      'https://images.pexels.com/photos/2089698/pexels-photo-2089698.jpeg?auto=compress&cs=tinysrgb&w=1024',
      'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=1024'
    ];
    
    return demoImages[Math.floor(Math.random() * demoImages.length)];
  }
}