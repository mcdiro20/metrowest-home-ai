export interface RenovationRequest {
  imageFile: File;
  styleChoice: string;
  roomType: string;
  customPrompt?: string;
}

export interface RenovationResponse {
  success: boolean;
  imageUrl?: string;
  style?: string;
  roomType?: string;
  fallback?: boolean;
  error?: string;
}

export class DalleRenovationService {
  static generateRenovationPrompt(styleChoice: string, roomType: string): string {
    const basePrompt = `My prompt has full detail so no need to add more. PROFESSIONAL ARCHITECTURAL INTERIOR RENDERING: Create a $3000-quality photorealistic architectural visualization that transforms this ${roomType} while maintaining the EXACT same camera angle, perspective, and spatial layout.

CRITICAL PROFESSIONAL REQUIREMENTS:
- Photorealistic materials with proper reflections, textures, and lighting
- Professional architectural photography quality
- Magazine-worthy interior design finishes
- Sharp focus throughout with proper depth of field
- Professional color grading and lighting
- High-end luxury finishes and materials
- No sketchy, drawn, or artistic interpretation
- Crisp, clean, professional appearance

LAYOUT PRESERVATION:
- Keep identical camera viewpoint and angle
- Preserve exact room dimensions and proportions
- Maintain all architectural features and built-ins
- Keep same lighting direction and quality
- Only update surface finishes, materials, and fixtures`;

    const roomSpecificFeatures = {
      kitchen: `Keep all cabinets, appliances, and counters in their current positions. Only change cabinet door styles, countertop materials, backsplash, paint colors, and hardware.`,
      
      bathroom: `Keep all fixtures (toilet, vanity, tub/shower) in their current positions. Only change tile, paint, vanity style, and fixtures.`,
      
      living_room: `Keep all built-ins and architectural features in place. Only change paint, flooring, furniture styles, and decor.`,
      
      bedroom: `Keep room layout and built-ins unchanged. Only update paint, flooring, furniture, and decor.`,
      
      dining_room: `Keep architectural features and built-ins in place. Only change paint, flooring, furniture, and lighting fixtures.`,
      
      home_office: `Keep built-ins and room layout unchanged. Only update finishes, furniture, and decor.`,
      
      other: `Keep all architectural features and room layout unchanged. Only update finishes and decor.`
    };

    const stylePrompts = {
      'modern-minimalist': `MODERN MINIMALIST PROFESSIONAL SPECIFICATION:
- Premium matte white or warm gray lacquer cabinetry with handleless design
- Waterfall edge quartz countertops in Calacatta or pure white
- Integrated LED strip lighting with professional dimming
- Stainless steel or fully integrated appliances
- Large format porcelain tile flooring (24"x48") in light gray
- Minimal hardware in brushed stainless or matte black
- Professional architectural lighting design
- Clean geometric lines with luxury finishes throughout`,

      'farmhouse-chic': `FARMHOUSE CHIC PROFESSIONAL SPECIFICATION:
- Custom painted Shaker-style cabinetry in Benjamin Moore Cloud White
- Honed Carrara marble or premium butcher block countertops
- White subway tile backsplash with charcoal grout
- Professional farmhouse sink with bridge faucet in brushed nickel
- Wide plank white oak hardwood flooring with natural finish
- Oil-rubbed bronze cup pulls and knobs
- Clear glass pendant lighting with black metal frames
- Professional rustic-luxury finish quality throughout`,

      'transitional': `TRANSITIONAL PROFESSIONAL SPECIFICATION:
- Raised panel cabinetry in Sherwin Williams Accessible Beige
- Natural granite countertops with eased edges in warm neutral tones
- Natural stone backsplash in travertine or limestone
- Brushed nickel or champagne bronze hardware
- Red oak hardwood flooring in medium honey stain
- Traditional pendant lighting with fabric shades
- Professional blend of classic and contemporary elements
- High-end traditional craftsmanship throughout`,

      'coastal-new-england': `COASTAL NEW ENGLAND PROFESSIONAL SPECIFICATION:
- White painted Shaker cabinetry with beadboard panel details
- White Carrara marble countertops with subtle gray veining
- Glass subway tile backsplash in soft seafoam or crisp white
- Polished chrome or brushed nickel hardware with rope details
- Light oak hardwood flooring with whitewash finish
- Nautical-inspired pendant lighting in polished chrome
- Professional coastal luxury finish quality
- Fresh, airy, high-end New England beach house aesthetic`,

      'contemporary-luxe': `CONTEMPORARY LUXE PROFESSIONAL SPECIFICATION:
- High-gloss charcoal lacquer or exotic walnut veneer cabinetry
- Premium Calacatta Gold marble countertops with dramatic veining
- Large format natural stone backsplash in book-matched marble
- Brushed gold or matte black luxury hardware
- Large format porcelain tile flooring in dark gray (36"x36")
- Designer crystal or geometric pendant lighting
- Professional luxury finish quality throughout
- Sophisticated contemporary elegance with premium materials`,

      'eclectic-bohemian': `ECLECTIC BOHEMIAN PROFESSIONAL SPECIFICATION:
- Mixed wood and painted cabinetry in rich emerald and warm walnut tones
- Natural stone countertops with dramatic veining and character
- Handcrafted ceramic tile backsplash in Moroccan patterns
- Mixed metal hardware in antique brass, copper, and bronze
- Rich hardwood flooring in dark walnut with hand-scraped finish
- Artisanal pendant lighting with natural materials and brass accents
- Professional eclectic luxury finish quality
- Curated, sophisticated bohemian aesthetic with high-end materials`
    };

    const selectedStylePrompt = stylePrompts[styleChoice as keyof typeof stylePrompts] || stylePrompts['modern-minimalist'];

    return `${basePrompt}\n\n${roomSpecificFeatures[roomType]}\n\n${selectedStylePrompt}\n\nFINAL REQUIREMENTS: Create a photorealistic, professional architectural interior rendering with magazine-quality finishes. No text, labels, sketchy appearance, or drawn elements. This must look like a $3000 professional architectural visualization with the exact same camera angle and perspective.`;
  }

  static generateCustomRenovationPrompt(styleChoice: string, roomType: string, customPrompt: string): string {
    const basePrompt = `My prompt has full detail so no need to add more. Create a beautiful interior renovation that maintains the exact same room layout and architectural features as the original image. This is a makeover of the existing space - preserve all structural elements, room dimensions, window and door positions, and built-in features. Only update finishes, colors, fixtures, and furniture. Do not add text, labels, or annotations to the image.`;
    
    let combinedPrompt = basePrompt;
    
    // If there's a preset style, include it
    if (styleChoice && styleChoice !== 'custom') {
      const stylePrompts = {
        'modern-minimalist': 'Apply modern minimalist design with clean lines, neutral colors, and minimal ornamentation.',
        'farmhouse-chic': 'Apply farmhouse chic design with rustic elements, warm colors, and vintage-inspired fixtures.',
        'transitional': 'Apply transitional design blending traditional and contemporary elements with warm neutrals.',
        'coastal-new-england': 'Apply coastal New England design with light colors, natural materials, and nautical touches.',
        'contemporary-luxe': 'Apply contemporary luxe design with premium materials, rich colors, and sophisticated finishes.',
        'eclectic-bohemian': 'Apply eclectic bohemian design with rich colors, mixed textures, and global-inspired elements.'
      };
      
      const styleDescription = stylePrompts[styleChoice as keyof typeof stylePrompts];
      if (styleDescription) {
        combinedPrompt += `\n\n${styleDescription}`;
      }
    }
    
    // Add the custom prompt
    combinedPrompt += `\n\nAdditional requirements: ${customPrompt}`;
    
    combinedPrompt += `\n\nCreate a photorealistic interior image without any text, labels, or annotations.`;
    
    return combinedPrompt;
  }
  static async processRenovationRequest(request: RenovationRequest): Promise<RenovationResponse> {
    try {
      console.log('🎨 Starting DALL-E renovation process...');
      console.log('🏠 Room type:', request.roomType);
      console.log('🎨 Style:', request.styleChoice);
      console.log('🎨 Custom prompt:', request.customPrompt);

      // Convert file to base64 first
      const imageBase64 = await this.fileToBase64(request.imageFile);
      console.log('📸 Image converted to base64, length:', imageBase64.length);
      
      // Call backend API
      console.log('🎨 Calling backend API for image generation...');
      const response = await fetch('/api/generate-ai-image', {
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

      console.log('🎨 API response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const result = await response.json();
      console.log('🎨 API result:', result);

      if (result.success) {
        console.log('✅ Image generation successful via', result.method);
        return {
          success: true,
          imageUrl: result.generatedImageUrl,
          style: request.styleChoice,
          roomType: request.roomType
        };
      }
      
      console.log('⚠️ API returned success: false');
      return {
        success: false,
        error: result.message || 'Layout preservation failed',
        style: request.styleChoice,
        roomType: request.roomType,
      };

    } catch (error) {
      console.error('❌ Renovation process failed:', error);
      
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

  private static getDemoImage(roomType: string): string {
    const demoImages = {
      kitchen: 'https://images.pexels.com/photos/1080721/pexels-photo-1080721.jpeg?auto=compress&cs=tinysrgb&w=1024',
      bathroom: 'https://images.pexels.com/photos/2062426/pexels-photo-2062426.jpeg?auto=compress&cs=tinysrgb&w=1024',
      living_room: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=1024',
      bedroom: 'https://images.pexels.com/photos/2089698/pexels-photo-2089698.jpeg?auto=compress&cs=tinysrgb&w=1024',
      dining_room: 'https://images.pexels.com/photos/2724749/pexels-photo-2724749.jpeg?auto=compress&cs=tinysrgb&w=1024',
      home_office: 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=1024',
      other: 'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=1024'
    };
    
    return demoImages[roomType as keyof typeof demoImages] || demoImages.other;
  }
}