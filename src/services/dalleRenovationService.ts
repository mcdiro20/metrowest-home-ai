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
    const basePrompt = `My prompt has full detail so no need to add more. INTERIOR MAKEOVER: Update only the finishes, colors, and materials in this existing space. Keep everything in the exact same position. This is a surface-level renovation - paint, cabinet doors, countertops, and fixtures only. Do not move walls, windows, appliances, or change the room layout. Do not add any text, words, labels, or annotations to the image. Create a clean, photorealistic interior image.`;

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
      'modern-minimalist': `MODERN MINIMALIST STYLE APPLICATION:
- Wall colors: Crisp whites, soft grays, or warm off-whites
- Cabinetry: Sleek, handleless doors or minimal bar pulls in white, gray, or natural wood
- Countertops: White quartz, marble, or concrete with clean edges
- Hardware: Brushed stainless steel, matte black, or hidden/integrated
- Lighting: LED strip lights, geometric pendants, or recessed lighting
- Furniture: Clean lines, neutral fabrics, minimal ornamentation
- Decor: Very limited - perhaps one statement piece or plant
- Flooring: Light wood, polished concrete, or large format tiles
- Window treatments: Simple roller blinds or no treatments to maximize light`,

      'farmhouse-chic': `FARMHOUSE CHIC STYLE APPLICATION:
- Wall colors: Warm whites, cream, soft sage, or light gray
- Cabinetry: White or cream painted with traditional hardware (cup pulls, knobs)
- Countertops: Butcher block, marble, or white quartz with subtle veining
- Hardware: Oil-rubbed bronze, brushed nickel, or matte black traditional styles
- Lighting: Lantern-style pendants, mason jar fixtures, or wrought iron chandeliers
- Furniture: Distressed wood, comfortable upholstered pieces, vintage-inspired
- Decor: Fresh flowers, woven baskets, vintage signs, galvanized metal accents
- Flooring: Wide plank wood, brick, or farmhouse tile patterns
- Window treatments: Cafe curtains, roman shades, or natural linen panels`,

      'transitional': `TRANSITIONAL STYLE APPLICATION:
- Wall colors: Warm neutrals (greige, mushroom, soft taupe, cream)
- Cabinetry: Shaker-style or raised panel in painted or stained wood
- Countertops: Natural stone, marble, or engineered quartz in neutral tones
- Hardware: Brushed nickel, oil-rubbed bronze, or antique brass
- Lighting: Classic shapes with modern updates, brushed metal finishes
- Furniture: Mix of traditional and contemporary pieces, comfortable scale
- Decor: Classic patterns, rich textures, timeless accessories
- Flooring: Hardwood, natural stone, or traditional tile patterns
- Window treatments: Tailored panels, roman shades, or classic drapery`,

      'coastal-new-england': `COASTAL NEW ENGLAND STYLE APPLICATION:
- Wall colors: Crisp whites, soft blues, seafoam green, or weathered gray
- Cabinetry: White or light blue painted, possibly with weathered finish
- Countertops: White marble, butcher block, or light quartz with subtle veining
- Hardware: Brushed nickel, polished chrome, or rope/nautical details
- Lighting: Lantern-style, rope details, or clean coastal-inspired fixtures
- Furniture: Natural materials, white/blue upholstery, weathered wood
- Decor: Sea glass, coastal artwork, rope accents, fresh flowers, minimal nautical touches
- Flooring: Light wood, whitewashed planks, or natural stone
- Window treatments: White linen, natural fiber shades, or light filtering panels`,

      'contemporary-luxe': `CONTEMPORARY LUXE STYLE APPLICATION:
- Wall colors: Rich grays, deep charcoal, navy, or dramatic black accents
- Cabinetry: High-gloss lacquer, rich wood veneers, or matte luxury finishes
- Countertops: Premium materials - exotic granite, marble, or engineered quartz
- Hardware: Brushed gold, matte black, or sleek stainless steel
- Lighting: Statement chandeliers, designer pendants, or architectural fixtures
- Furniture: Luxury materials (leather, velvet, silk), bold shapes, rich colors
- Decor: Curated art pieces, sculptural objects, rich textiles, metallic accents
- Flooring: Dark hardwood, large format stone, or luxury vinyl planks
- Window treatments: Motorized blinds, rich drapery, or sleek panels`,

      'eclectic-bohemian': `ECLECTIC BOHEMIAN STYLE APPLICATION:
- Wall colors: Warm earth tones, jewel colors (emerald, sapphire, burnt orange)
- Cabinetry: Natural wood stains, painted in rich colors, or mixed finishes
- Countertops: Natural materials with character - wood, stone with veining, or colorful tiles
- Hardware: Antique brass, copper, carved wood, or mixed vintage styles
- Lighting: Moroccan-inspired, beaded chandeliers, or artisanal fixtures
- Furniture: Mix of eras and styles, rich fabrics, carved wood, vintage pieces
- Decor: Abundant plants, tapestries, global textiles, vintage art, layered rugs
- Flooring: Rich wood, patterned tiles, or layered vintage rugs
- Window treatments: Beaded curtains, rich fabrics, or woven natural materials`
    };

    const selectedStylePrompt = stylePrompts[styleChoice as keyof typeof stylePrompts] || stylePrompts['modern-minimalist'];

    return `${basePrompt}\n\n${roomSpecificFeatures[roomType]}\n\n${selectedStylePrompt}\n\nIMPORTANT: No text, words, labels, or annotations on the image. Create a clean, professional interior photograph showing the same space with updated ${styleChoice} finishes only.`;
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

      // Use backend API with DALL-E 2 editing for perfect layout preservation
      console.log('🎨 Using DALL-E 2 image editing for layout preservation...');
      const response = await fetch('/api/generate-ai-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          imageData: await this.fileToBase64(request.imageFile),
          roomType: request.roomType,
          selectedStyle: { 
            id: request.styleChoice,
            name: this.getStyleName(request.styleChoice)
          },
          customPrompt: request.customPrompt
        })
      });

      const result = await response.json();

      if (result.success) {
        return {
          success: true,
          imageUrl: result.generatedImageUrl,
          style: request.styleChoice,
          roomType: request.roomType
        };
      }
      
      // If layout preservation fails, return error instead of fallback
      return {
        success: false,
        error: result.message || 'Layout preservation failed',
        imageUrl: this.getDemoImage(request.roomType),
        style: request.styleChoice,
        roomType: request.roomType,
        fallback: true
      };

    } catch (error) {
      console.error('❌ Renovation process failed:', error);
      
      // Fallback to demo image
      return {
        success: false,
        imageUrl: this.getDemoImage(request.roomType),
        style: request.styleChoice,
        roomType: request.roomType,
        fallback: true,
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