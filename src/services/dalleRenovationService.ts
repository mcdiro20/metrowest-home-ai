export interface RenovationRequest {
  imageFile: File;
  styleChoice: string;
  roomType: string;
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
    // Room-specific preservation requirements
    const roomSpecificFeatures = {
      kitchen: `- Existing cabinet layout and island/peninsula positions
- Appliance locations and sizes (refrigerator, stove, dishwasher areas)
- Counter heights and configurations
- Window above sink or existing window positions
- Existing lighting fixture locations`,
      
      bathroom: `- Existing vanity size and position
- Bathtub/shower location and dimensions
- Toilet position and plumbing locations
- Window positions and mirror locations
- Existing tile or flooring patterns`,
      
      living_room: `- Existing fireplace location and mantle
- Built-in shelving or entertainment center positions
- Window arrangements and natural light sources
- Room proportions and seating area layouts
- Existing architectural details (crown molding, wainscoting)`,
      
      bedroom: `- Existing closet locations and sizes
- Window positions and natural light
- Room proportions and bed placement area
- Built-in furniture or storage locations
- Door and entrance positioning`,
      
      dining_room: `- Existing chandelier or light fixture position
- Window locations and natural light
- Built-in hutch or buffet areas
- Room proportions for dining table placement
- Connection to adjacent rooms (kitchen, living room)`,
      
      home_office: `- Existing built-in desks or shelving
- Window positions for natural light at desk
- Electrical outlet locations for equipment
- Room proportions and work area layout
- Storage and organization areas`,
      
      other: `- Existing architectural features and built-ins
- Window and door positions
- Room proportions and spatial relationships
- Natural light sources and fixture locations
- Any unique structural elements`
    };

    const basePrompt = `RENOVATION INSTRUCTION: Transform the uploaded interior image into a ${styleChoice} style renovation while preserving the EXACT SAME spatial layout.

CRITICAL PRESERVATION REQUIREMENTS:
- Maintain identical room dimensions and proportions
- Keep all windows and doors in exact same positions and sizes
- Preserve existing architectural elements (beams, columns, built-ins, moldings)
- Maintain the same camera angle and perspective
- Keep the same lighting direction and natural light sources
${roomSpecificFeatures[roomType as keyof typeof roomSpecificFeatures] || roomSpecificFeatures['other']}

RENOVATION APPROACH: This is a MAKEOVER of the existing space, not a new room. Think "same bones, new finishes." Only change: wall colors, finishes, fixtures, furniture, and decorative elements.

IMPORTANT: The renovated image must look like the same room photographed after a renovation, maintaining all structural elements while updating the aesthetic to ${styleChoice} style.`;

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

    return `${basePrompt}\n\n${selectedStylePrompt}\n\nFINAL REMINDER: This renovation must maintain the exact same room layout, architectural features, and spatial relationships as the original uploaded image. Only the finishes, colors, fixtures, and furniture should reflect the new ${styleChoice} style.`;
  }

  static async processRenovationRequest(request: RenovationRequest): Promise<RenovationResponse> {
    try {
      console.log('🎨 Starting DALL-E renovation process...');
      console.log('🏠 Room type:', request.roomType);
      console.log('🎨 Style:', request.styleChoice);

      // Generate the comprehensive prompt
      const renovationPrompt = this.generateRenovationPrompt(request.styleChoice, request.roomType);
      console.log('📝 Generated renovation prompt');

      // Check for OpenAI API key
      const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
      
      if (!openaiKey) {
        console.log('⚠️ No OpenAI API key - using demo image');
        return {
          success: true,
          imageUrl: this.getDemoImage(request.roomType),
          style: request.styleChoice,
          roomType: request.roomType,
          fallback: true
        };
      }

      // Use backend API for generation
      const response = await fetch('/api/generate-ai-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          imageData: await this.fileToBase64(request.imageFile),
          prompt: renovationPrompt,
          roomType: request.roomType,
          selectedStyle: { name: request.styleChoice }
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Generation failed');
      }

      return {
        success: true,
        imageUrl: result.generatedImageUrl,
        style: request.styleChoice,
        roomType: request.roomType
      };

    } catch (error) {
      console.error('❌ Renovation process failed:', error);
      
      // Fallback to demo image
      return {
        success: true,
        imageUrl: this.getDemoImage(request.roomType),
        style: request.styleChoice,
        roomType: request.roomType,
        fallback: true,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
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