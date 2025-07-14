import OpenAI from 'openai';

// Note: In production, this should be handled by a backend API
// to keep the API key secure. This is for development/demo purposes.
let openai: OpenAI | null = null;

// Initialize OpenAI client only if API key is available
if (import.meta.env.VITE_OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true // Only for development
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
  private static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // Remove data:image/jpeg;base64, prefix
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

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
    
    prompt += " The result should be photorealistic and show a clear before/after transformation while maintaining the room's basic structure and proportions.";
    
    return prompt;
  }

  static async generateDesign(request: AIImageRequest): Promise<AIImageResponse> {
    const startTime = Date.now();
    
    try {
      // Check if API key is available
      if (!openai || !import.meta.env.VITE_OPENAI_API_KEY) {
        console.warn('OpenAI API key not found, using simulation mode');
        return this.simulateAIProcessing(request);
      }

      // Convert file to base64 for processing
      const originalImageUrl = URL.createObjectURL(request.imageFile);
      
      // Generate the prompt
      const prompt = request.prompt || this.generatePrompt(request.roomType, request.selectedStyle);
      
      // Enhanced prompt for better results
      const enhancedPrompt = `Create a photorealistic interior design rendering of a ${request.roomType} with ${prompt}. The image should look like a professional architectural visualization with perfect lighting, high-end finishes, and attention to detail. Style: photorealistic, architectural photography, interior design magazine quality.`;

      try {
        const response = await openai!.images.generate({
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
        return this.simulateAIProcessing(request);
      }
    } catch (error) {
      console.error('AI Image Generation Error:', error);
      // Fallback to simulation if there's any error
      return this.simulateAIProcessing(request);
    }
  }

  // Simulate AI processing with a more realistic approach
  static async simulateAIProcessing(request: AIImageRequest): Promise<AIImageResponse> {
    const startTime = Date.now();
    
    // Create original image URL
    const originalImageUrl = URL.createObjectURL(request.imageFile);
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // For demo purposes, use a high-quality kitchen image from Pexels
    // In production, this would be the actual AI-generated result
    const demoImages = {
      kitchen: [
        'https://images.pexels.com/photos/1080721/pexels-photo-1080721.jpeg?auto=compress&cs=tinysrgb&w=1024',
        'https://images.pexels.com/photos/2089698/pexels-photo-2089698.jpeg?auto=compress&cs=tinysrgb&w=1024',
        'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=1024'
      ],
      backyard: [
        'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=1024',
        'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=1024'
      ]
    };
    
    const imagePool = demoImages[request.roomType as keyof typeof demoImages] || demoImages.kitchen;
    const randomImage = imagePool[Math.floor(Math.random() * imagePool.length)];
    
    const prompt = this.generatePrompt(request.roomType, request.selectedStyle);
    const processingTime = Date.now() - startTime;

    return {
      originalImage: originalImageUrl,
      generatedImage: randomImage,
      prompt,
      processingTime
    };
  }
}