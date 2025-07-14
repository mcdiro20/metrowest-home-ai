import OpenAI from 'openai';

// Initialize OpenAI client only if API key is available
let openai: OpenAI | null = null;

if (import.meta.env.VITE_OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true // Only for development - in production, use backend API
  });
}

export interface AIImageRequest {
  imageFile: File;
  roomType: 'kitchen' | 'backyard' | 'bathroom' | 'living-room';
  selectedStyle?: {id: string; name: string; prompt: string};
  prompt?: string;
}

export interface AIImageResponse {
  originalImage: string;
  generatedImage: string;
  prompt: string;
  processingTime: number;
}

export class AIImageService {
  private static generatePrompt(roomType: string, selectedStyle?: {id: string; name: string; prompt: string}): string {
    const basePrompts = {
      kitchen: "Transform this kitchen into a beautiful, modern space with updated cabinets, countertops, and appliances. Keep the same layout but make it look completely renovated with contemporary design elements.",
      backyard: "Transform this backyard into a beautiful outdoor living space with landscaping, seating areas, and modern outdoor features. Make it look like a professionally designed outdoor oasis.",
      bathroom: "Transform this bathroom into a modern, spa-like space with updated fixtures, tiles, and lighting. Keep the same layout but make it look completely renovated.",
      'living-room': "Transform this living room into a modern, stylish space with updated furniture, lighting, and decor. Make it look professionally designed and inviting."
    };

    let prompt = basePrompts[roomType as keyof typeof basePrompts] || basePrompts.kitchen;
    
    if (selectedStyle) {
      prompt = `Transform this ${roomType} with ${selectedStyle.prompt}. Keep the same layout but completely renovate it with this design aesthetic.`;
    }
    
    prompt += " The result should be photorealistic and show a clear transformation while maintaining the room's basic structure and proportions. High quality, professional interior design, architectural photography style.";
    
    return prompt;
  }

  static async generateDesign(request: AIImageRequest): Promise<AIImageResponse> {
    const startTime = Date.now();
    
    try {
      // Create original image URL
      const originalImageUrl = URL.createObjectURL(request.imageFile);
      
      // Check if OpenAI API key is available and we're in production
      if (openai && import.meta.env.VITE_OPENAI_API_KEY && !import.meta.env.DEV) {
        try {
          // Generate the prompt
          const prompt = request.prompt || this.generatePrompt(request.roomType, request.selectedStyle);
          
          // Enhanced prompt for better results
          const enhancedPrompt = `Create a photorealistic interior design rendering: ${prompt}. Style: photorealistic, architectural photography, interior design magazine quality, professional lighting, high-end finishes.`;

          console.log('🎨 Generating AI image with prompt:', enhancedPrompt);

          const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: enhancedPrompt,
            n: 1,
            size: "1024x1024",
            quality: "hd",
            style: "natural"
          });

          const generatedImageUrl = response.data[0]?.url;
          
          if (!generatedImageUrl) {
            throw new Error('Failed to generate image');
          }

          const processingTime = Date.now() - startTime;

          return {
            originalImage: originalImageUrl,
            generatedImage: generatedImageUrl,
            prompt: enhancedPrompt,
            processingTime
          };
        } catch (apiError) {
          console.warn('OpenAI API call failed, falling back to simulation:', apiError);
          return this.simulateAIProcessing(request, originalImageUrl, startTime);
        }
      } else {
        // Development mode or no API key - use simulation
        console.log('🎨 Using AI simulation mode');
        return this.simulateAIProcessing(request, originalImageUrl, startTime);
      }
    } catch (error) {
      console.error('AI Image Generation Error:', error);
      // Fallback to simulation if there's any error
      const originalImageUrl = URL.createObjectURL(request.imageFile);
      return this.simulateAIProcessing(request, originalImageUrl, startTime);
    }
  }

  // Simulate AI processing with demo images
  private static async simulateAIProcessing(
    request: AIImageRequest, 
    originalImageUrl: string, 
    startTime: number
  ): Promise<AIImageResponse> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Demo images for different room types and styles
    const demoImages = {
      kitchen: {
        'modern-minimalist': 'https://images.pexels.com/photos/1080721/pexels-photo-1080721.jpeg?auto=compress&cs=tinysrgb&w=1024',
        'farmhouse-chic': 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=1024',
        'transitional': 'https://images.pexels.com/photos/2089698/pexels-photo-2089698.jpeg?auto=compress&cs=tinysrgb&w=1024',
        'coastal-new-england': 'https://images.pexels.com/photos/2724749/pexels-photo-2724749.jpeg?auto=compress&cs=tinysrgb&w=1024',
        'contemporary-luxe': 'https://images.pexels.com/photos/2062426/pexels-photo-2062426.jpeg?auto=compress&cs=tinysrgb&w=1024',
        'default': 'https://images.pexels.com/photos/1080721/pexels-photo-1080721.jpeg?auto=compress&cs=tinysrgb&w=1024'
      },
      backyard: {
        'modern-zen': 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=1024',
        'mediterranean-oasis': 'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=1024',
        'contemporary-outdoor': 'https://images.pexels.com/photos/1029599/pexels-photo-1029599.jpeg?auto=compress&cs=tinysrgb&w=1024',
        'default': 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=1024'
      }
    };
    
    const roomImages = demoImages[request.roomType as keyof typeof demoImages] || demoImages.kitchen;
    const styleId = request.selectedStyle?.id || 'default';
    const selectedImage = roomImages[styleId as keyof typeof roomImages] || roomImages.default;
    
    const prompt = this.generatePrompt(request.roomType, request.selectedStyle);
    const processingTime = Date.now() - startTime;

    return {
      originalImage: originalImageUrl,
      generatedImage: selectedImage,
      prompt,
      processingTime
    };
  }
}