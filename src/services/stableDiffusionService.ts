export interface StableDiffusionRequest {
  imageFile: File;
  styleChoice: string;
  roomType: string;
  customPrompt?: string;
}

export interface StableDiffusionResponse {
  success: boolean;
  imageUrl?: string;
  style?: string;
  roomType?: string;
  method?: string;
  error?: string;
}

export class StableDiffusionService {
  static async processRenovationRequest(request: StableDiffusionRequest): Promise<StableDiffusionResponse> {
    try {
      console.log('🏗️ Starting Stable Diffusion XL + ControlNet process...');
      console.log('🏠 Room type:', request.roomType);
      console.log('🎨 Style:', request.styleChoice);
      console.log('🎨 Custom prompt:', request.customPrompt);

      // Convert file to base64 first
      const imageBase64 = await this.fileToBase64(request.imageFile);
      console.log('📸 Image converted to base64, length:', imageBase64.length);
      
      // Call backend API for Stable Diffusion
      console.log('🏗️ Calling Stable Diffusion API...');
      const response = await fetch('/api/generate-stable-diffusion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          imageData: imageBase64,
          roomType: request.roomType,
          selectedStyle: { 
            id: request.styleChoice,
            name: this.getStyleName(request.styleChoice)
          },
          customPrompt: request.customPrompt
        })
      });

      console.log('🏗️ API response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const result = await response.json();
      console.log('🏗️ API result:', result);

      if (result.success) {
        console.log('✅ Stable Diffusion generation successful via', result.method);
        return {
          success: true,
          imageUrl: result.generatedImageUrl,
          style: request.styleChoice,
          roomType: request.roomType,
          method: result.method
        };
      }
      
      console.log('⚠️ API returned success: false');
      return {
        success: false,
        error: result.message || 'Stable Diffusion generation failed',
        style: request.styleChoice,
        roomType: request.roomType,
      };

    } catch (error) {
      console.error('❌ Stable Diffusion process failed:', error);
      
      return {
        success: false,
        style: request.styleChoice,
        roomType: request.roomType,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private static getStyleName(styleId: string): string {
    const styleNames = {
      'modern-minimalist': 'Modern Minimalist',
      'farmhouse-chic': 'Farmhouse Chic',
      'transitional': 'Transitional',
      'coastal-new-england': 'Coastal New England',
      'contemporary-luxe': 'Contemporary Luxe',
      'eclectic-bohemian': 'Eclectic Bohemian'
    };
    return styleNames[styleId as keyof typeof styleNames] || 'Custom Style';
  }

  private static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Generate professional architectural prompts for SDXL
  static generateProfessionalPrompt(styleChoice: string, roomType: string): string {
    const basePrompt = `professional architectural interior photography, photorealistic ${roomType} renovation, luxury finishes, magazine quality interior design, sharp focus, perfect natural lighting, 8k resolution, architectural digest photography style`;

    const stylePrompts = {
      'modern-minimalist': `modern minimalist design, sleek handleless white cabinets, waterfall quartz countertops, integrated stainless steel appliances, clean geometric lines, minimal brushed steel hardware, LED strip lighting, large format porcelain tiles, professional architectural photography`,
      
      'farmhouse-chic': `farmhouse chic design, custom white shaker cabinets, honed Carrara marble countertops, white subway tile backsplash, professional farmhouse sink, vintage-inspired pendant lighting, wide plank hardwood floors, oil-rubbed bronze hardware, rustic luxury finishes`,
      
      'transitional': `transitional interior design, raised panel cabinetry in warm neutrals, natural granite countertops, classic subway tile, brushed nickel hardware, traditional pendant lighting, hardwood flooring, perfect blend of classic and contemporary elements`,
      
      'coastal-new-england': `coastal New England design, white painted shaker cabinets with beadboard details, white marble countertops, glass subway tile backsplash, polished chrome hardware, nautical-inspired lighting, light oak hardwood floors, fresh coastal luxury aesthetic`,
      
      'contemporary-luxe': `contemporary luxury design, high-gloss charcoal lacquer cabinets, premium Calacatta Gold marble countertops with dramatic veining, large format natural stone backsplash, brushed gold hardware, designer crystal lighting, sophisticated modern elegance`,
      
      'eclectic-bohemian': `eclectic bohemian design, mixed wood and painted cabinetry in rich emerald and walnut tones, natural stone countertops with character, handcrafted Moroccan tile backsplash, mixed metal hardware in brass and copper, artisanal lighting, rich hardwood floors`
    };

    const selectedStylePrompt = stylePrompts[styleChoice as keyof typeof stylePrompts] || stylePrompts['modern-minimalist'];
    
    return `${basePrompt}, ${selectedStylePrompt}, no text, no labels, no watermarks, photorealistic architectural rendering`;
  }

  // Generate negative prompt to avoid unwanted elements
  static generateNegativePrompt(): string {
    return `cartoon, anime, sketch, drawing, painting, illustration, text, labels, words, letters, watermark, signature, blurry, low quality, distorted, deformed, ugly, bad anatomy, extra limbs, missing parts, oversaturated, unrealistic colors, amateur photography, sketchy appearance, drawn elements`;
  }
}