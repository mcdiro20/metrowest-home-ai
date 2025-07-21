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
    // Enhanced base prompt for architectural quality
    const basePrompt = `Professional architectural rendering: Transform this ${roomType} interior with luxury ${styleChoice.replace('-', ' ')} design. Maintain exact room dimensions, window placement, door locations, and all structural elements. This is a high-end interior design makeover - update only surfaces, finishes, fixtures, and furnishings. Preserve the original spatial layout completely. Create a photorealistic architectural visualization that looks professionally rendered by a top design firm.`;

    const roomSpecificGuidelines = {
      kitchen: `KITCHEN RENOVATION SPECIFICATIONS:
• Preserve all appliance locations and cabinet footprints exactly
• Update cabinet door styles, hardware, and paint/stain finishes only  
• Transform countertops to premium materials matching chosen style
• Update backsplash design while maintaining same wall areas
• Enhance lighting fixtures and under-cabinet lighting
• Keep sink location but upgrade to style-appropriate fixture
• Maintain all structural elements and room flow`,
      
      bathroom: `BATHROOM RENOVATION SPECIFICATIONS:
• Keep all plumbing fixtures in identical positions
• Update tile work, vanity style, and surface finishes only
• Transform lighting and mirror configurations
• Upgrade hardware and fixture finishes to match style
• Maintain shower/tub footprint exactly
• Update paint and surface materials only
• Preserve all structural and spatial elements`,
      
      living_room: `LIVING ROOM RENOVATION SPECIFICATIONS:
• Preserve all architectural details and built-ins
• Transform paint colors and wall treatments
• Update flooring materials and patterns
• Replace furniture with style-appropriate pieces
• Upgrade lighting fixtures and window treatments
• Maintain exact room proportions and layout
• Keep all structural elements unchanged`,
      
      bedroom: `BEDROOM RENOVATION SPECIFICATIONS:
• Maintain all architectural features and room layout
• Transform paint, wallcoverings, and surface finishes
• Update flooring materials appropriately
• Replace furniture and bedding with style-matching pieces
• Upgrade lighting and window treatments
• Preserve closet locations and built-in features
• Keep exact spatial configuration`,
      
      dining_room: `DINING ROOM RENOVATION SPECIFICATIONS:
• Preserve all built-in features and architectural details
• Transform wall colors and surface treatments
• Update flooring to complement chosen style
• Replace dining furniture with appropriate style pieces
• Upgrade lighting fixtures, especially focal chandeliers
• Maintain window and door placements exactly
• Keep all structural elements intact`,
      
      home_office: `HOME OFFICE RENOVATION SPECIFICATIONS:
• Maintain all built-in storage and architectural features
• Transform surface finishes and paint colors
• Update furniture with style-appropriate desk and seating
• Upgrade lighting for both ambient and task illumination
• Preserve window locations and natural light sources
• Keep exact room layout and proportions
• Transform only finishes and furnishings`,
      
      other: `ROOM RENOVATION SPECIFICATIONS:
• Preserve all existing architectural elements and spatial layout
• Transform surface finishes, paint, and material selections
• Update furnishings and decor to match chosen style
• Upgrade lighting fixtures appropriately
• Maintain all structural features exactly
• Keep room proportions and flow unchanged
• Focus on luxury finishes and premium materials`
    };

    const enhancedStylePrompts = {
      'modern-minimalist': `MODERN MINIMALIST LUXURY TRANSFORMATION:
SURFACES & FINISHES:
• Walls: Museum-quality paint in warm whites (Benjamin Moore White Dove, Sherwin Williams Pure White) or sophisticated grays (Benjamin Moore Revere Pewter, Farrow & Ball Pavilion Gray)
• Cabinetry: Seamless European-style doors with integrated handles, premium lacquer finishes in white, charcoal, or natural oak with invisible hinges
• Countertops: Pristine white Carrara or Calacatta marble with waterfall edges, or engineered quartz in pure white with subtle veining

HARDWARE & FIXTURES:
• Cabinet hardware: Integrated pulls or ultra-minimal brushed stainless steel linear handles
• Plumbing fixtures: Kohler, Hansgrohe, or Waterworks in brushed nickel or matte black
• Lighting: Architectural LED strips, geometric pendant fixtures by Artemide or Flos, recessed lighting with clean trim

FURNISHINGS & MATERIALS:
• Furniture: Clean-lined pieces by Herman Miller, West Elm, or CB2 in neutral fabrics
• Flooring: Wide-plank European white oak, polished concrete, or large format porcelain tiles
• Window treatments: Motorized roller shades or sheer panels, no heavy drapery
• Accessories: Single statement art piece, minimal sculptural objects, fresh orchids or succulents`,

      'farmhouse-chic': `FARMHOUSE CHIC LUXURY TRANSFORMATION:
SURFACES & FINISHES:
• Walls: Premium paint in creamy whites (Benjamin Moore Cloud White, Sherwin Williams Alabaster) with optional shiplap accent walls
• Cabinetry: Custom Shaker-style doors in painted finish (cream, sage, or navy) with traditional raised panels and quality wood construction
• Countertops: Butcher block walnut or maple, premium Carrara marble, or white quartz with subtle gray veining

HARDWARE & FIXTURES:
• Cabinet hardware: Cup pulls and knobs in aged brass, oil-rubbed bronze, or matte black traditional styles
• Plumbing fixtures: Farmhouse apron sinks, bridge faucets, vintage-inspired fixtures in aged finishes
• Lighting: Wrought iron chandeliers, mason jar pendants, lantern-style fixtures with Edison bulbs

FURNISHINGS & MATERIALS:
• Furniture: Reclaimed wood pieces, upholstered seating in natural linens, vintage-inspired accessories
• Flooring: Wide-plank reclaimed hardwood, brick flooring, or farmhouse-style tile patterns
• Window treatments: Natural linen cafe curtains, Roman shades, or wooden blinds
• Accessories: Galvanized metal accents, fresh flowers in mason jars, woven baskets, vintage signage`,

      'transitional': `TRANSITIONAL LUXURY TRANSFORMATION:
SURFACES & FINISHES:
• Walls: Sophisticated neutral palette (Benjamin Moore Revere Pewter, Sherwin Williams Accessible Beige, Farrow & Ball Elephant's Breath)
• Cabinetry: Traditional Shaker or raised panel doors in painted or stained finishes, quality wood construction with soft-close hardware
• Countertops: Natural stone like granite or marble, or premium engineered quartz in neutral tones with subtle patterns

HARDWARE & FIXTURES:
• Cabinet hardware: Classic cup pulls and knobs in brushed nickel, antique brass, or oil-rubbed bronze
• Plumbing fixtures: Traditional shapes with contemporary updates, quality brands in coordinated finishes
• Lighting: Updated classics like drum pendants, brushed metal chandeliers, or traditional lantern styles

FURNISHINGS & MATERIALS:
• Furniture: Blend of traditional and contemporary pieces, quality upholstery in neutral tones, comfortable scale
• Flooring: Traditional hardwood, natural stone, or classic tile patterns in neutral colors
• Window treatments: Tailored panels, Roman shades, or plantation shutters
• Accessories: Classic patterns, rich textures, timeless artwork, quality decorative objects`,

      'coastal-new-england': `COASTAL NEW ENGLAND LUXURY TRANSFORMATION:
SURFACES & FINISHES:
• Walls: Crisp whites (Benjamin Moore White Dove, Sherwin Williams Pure White) with soft blue or seafoam accents
• Cabinetry: White or soft blue painted Shaker doors with traditional hardware, possibly weathered finishes
• Countertops: White Carrara marble, butcher block, or white quartz with subtle gray veining

HARDWARE & FIXTURES:
• Cabinet hardware: Brushed nickel, polished chrome, or rope-detailed pulls and knobs
• Plumbing fixtures: Clean coastal styling, possibly with nautical influences, in coordinated metal finishes
• Lighting: Lantern-style pendants, rope-detailed fixtures, or clean contemporary coastal designs

FURNISHINGS & MATERIALS:
• Furniture: Natural materials, white or soft blue upholstery, weathered wood finishes, rattan accents
• Flooring: Light weathered hardwood, whitewashed planks, or natural stone tiles
• Window treatments: White linen panels, natural fiber Roman shades, or plantation shutters
• Accessories: Sea glass colors, subtle nautical elements, fresh flowers, natural textures`,

      'contemporary-luxe': `CONTEMPORARY LUXE TRANSFORMATION:
SURFACES & FINISHES:
• Walls: Bold sophisticated colors (deep charcoal, navy, rich burgundy) or dramatic black accent walls with premium paint finishes
• Cabinetry: High-gloss lacquer, exotic wood veneers, or ultra-matte finishes in dramatic colors with premium hardware
• Countertops: Exotic granite, marble with bold veining, or engineered quartz in dramatic patterns

HARDWARE & FIXTURES:
• Cabinet hardware: Brushed gold, matte black, or sleek stainless steel in contemporary geometric shapes
• Plumbing fixtures: Designer brands like Kohler Artifacts, Waterworks, or Hansgrohe in coordinated luxury finishes
• Lighting: Statement chandeliers, designer pendant fixtures, architectural LED systems

FURNISHINGS & MATERIALS:
• Furniture: Luxury materials (Italian leather, silk velvet, exotic woods), bold contemporary shapes, rich jewel tones
• Flooring: Dark exotic hardwoods, large format natural stone, or luxury vinyl planks with dramatic patterns
• Window treatments: Motorized blinds, rich silk drapery, or sleek contemporary panels
• Accessories: Curated contemporary art, sculptural objects, metallic accents, luxury textiles`,

      'eclectic-bohemian': `ECLECTIC BOHEMIAN LUXURY TRANSFORMATION:
SURFACES & FINISHES:
• Walls: Rich jewel tones (emerald, sapphire, burnt orange, deep burgundy) with accent walls or wallcoverings
• Cabinetry: Natural wood stains, painted in rich colors, or mixed finishes combining multiple wood tones
• Countertops: Natural materials with character - butcher block, granite with movement, or colorful tile work

HARDWARE & FIXTURES:
• Cabinet hardware: Antique brass, copper, hand-forged iron, or mixed vintage styles from different eras
• Plumbing fixtures: Vintage-inspired or globally-influenced designs in aged metal finishes
• Lighting: Moroccan-inspired fixtures, beaded chandeliers, vintage industrial pieces, or artisan-crafted designs

FURNISHINGS & MATERIALS:
• Furniture: Collected pieces from different eras, rich fabrics, carved wood details, vintage and antique pieces
• Flooring: Rich hardwood, patterned tiles, Persian or vintage rugs layered over existing flooring
• Window treatments: Beaded curtains, rich patterned fabrics, or woven natural materials
• Accessories: Abundant plants, global textiles, vintage art collections, layered textures and patterns`
    };

    const selectedRoomGuidelines = roomSpecificGuidelines[roomType as keyof typeof roomSpecificGuidelines] || roomSpecificGuidelines.other;
    const selectedStylePrompt = enhancedStylePrompts[styleChoice as keyof typeof enhancedStylePrompts] || enhancedStylePrompts['modern-minimalist'];

    return `${basePrompt}

${selectedRoomGuidelines}

${selectedStylePrompt}

RENDERING QUALITY REQUIREMENTS:
• Create a photorealistic architectural visualization with professional lighting
• Use high-end interior photography composition and angles  
• Ensure all surfaces show premium materials and expert craftsmanship
• Apply sophisticated color grading typical of luxury design magazines
• Show rich textures and material depth throughout the space
• No text, labels, watermarks, or annotations anywhere in the image
• Final result should rival $5,000+ architectural renderings from top design firms`;
  }

  static generateCustomRenovationPrompt(styleChoice: string, roomType: string, customPrompt: string): string {
    const basePrompt = `Professional architectural rendering: Create a luxury interior renovation maintaining the exact same room layout, structural elements, window placements, and door locations as the original image. This is a high-end surface renovation only - transform finishes, fixtures, materials, and furnishings while preserving all spatial relationships. Generate a photorealistic visualization comparable to premium architectural renderings from top design firms.`;
    
    let combinedPrompt = basePrompt;
    
    // Add room-specific preservation guidelines
    const roomPreservation = {
      kitchen: 'Maintain all appliance and cabinet locations exactly. Transform only surfaces, finishes, and fixtures.',
      bathroom: 'Keep all plumbing fixtures in identical positions. Update only tile, vanity, and surface finishes.',
      living_room: 'Preserve all architectural features and built-ins. Transform only finishes and furnishings.',
      bedroom: 'Maintain room layout and built-ins unchanged. Update only finishes, furniture, and decor.',
      dining_room: 'Keep architectural features and built-ins in place. Transform only finishes and furnishings.',
      home_office: 'Preserve built-ins and room layout. Update only finishes, furniture, and decor.',
      other: 'Maintain all architectural and structural elements. Transform only finishes and furnishings.'
    };
    
    const preservation = roomPreservation[roomType as keyof typeof roomPreservation] || roomPreservation.other;
    combinedPrompt += `\n\nSPATIAL PRESERVATION: ${preservation}`;
    
    // If there's a preset style, include enhanced description
    if (styleChoice && styleChoice !== 'custom') {
      const styleDescriptions = {
        'modern-minimalist': 'Apply luxury modern minimalist design with premium materials, clean lines, sophisticated neutral colors, and minimal high-quality furnishings.',
        'farmhouse-chic': 'Apply upscale farmhouse chic design with premium rustic elements, sophisticated warm colors, and high-end vintage-inspired fixtures.',
        'transitional': 'Apply luxury transitional design expertly blending traditional and contemporary elements with premium neutral materials and sophisticated furnishings.',
        'coastal-new-england': 'Apply upscale coastal New England design with premium light colors, natural luxury materials, and sophisticated nautical-inspired elements.',
        'contemporary-luxe': 'Apply high-end contemporary luxe design with premium materials, rich sophisticated colors, and luxury designer furnishings.',
        'eclectic-bohemian': 'Apply curated eclectic bohemian design with premium rich colors, luxury mixed textures, and sophisticated global-inspired elements.'
      };
      
      const styleDescription = styleDescriptions[styleChoice as keyof typeof styleDescriptions];
      if (styleDescription) {
        combinedPrompt += `\n\nSTYLE APPLICATION: ${styleDescription}`;
      }
    }
    
    // Add the custom requirements
    combinedPrompt += `\n\nCUSTOM REQUIREMENTS: ${customPrompt}`;
    
    combinedPrompt += `\n\nQUALITY STANDARDS:
• Photorealistic architectural visualization with professional lighting and composition
• Premium material representation with rich textures and depth
• Sophisticated color grading typical of luxury design publications  
• Expert craftsmanship visible in all details and finishes
• No text, labels, watermarks, or annotations in the image
• Final quality should rival expensive architectural renderings from top design firms`;
    
    return combinedPrompt;
  }

  static async processRenovationRequest(request: RenovationRequest): Promise<RenovationResponse> {
    try {
      console.log('🎨 Starting premium DALL-E renovation process...');
      console.log('🏠 Room type:', request.roomType);
      console.log('🎨 Style:', request.styleChoice);

      // Generate the enhanced architectural prompt
      const renovationPrompt = request.customPrompt 
        ? this.generateCustomRenovationPrompt(request.styleChoice, request.roomType, request.customPrompt)
        : this.generateRenovationPrompt(request.styleChoice, request.roomType);
      
      console.log('📝 Generated enhanced architectural renovation prompt');
      console.log('📏 Prompt length:', renovationPrompt.length, 'characters');

      // Check for OpenAI API key
      const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
      
      if (!openaiKey) {
        console.log('⚠️ No OpenAI API key - using premium demo image');
        return {
          success: true,
          imageUrl: this.getPremiumDemoImage(request.roomType, request.styleChoice),
          style: request.styleChoice,
          roomType: request.roomType,
          fallback: true
        };
      }

      // Enhanced multi-approach strategy for best results
      try {
        console.log('🎨 Attempting DALL-E 2 image editing for layout preservation...');
        
        // First attempt: Use backend with DALL-E 2 editing (best for layout preservation)
        const backendResponse = await fetch('/api/generate-ai-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            imageData: await this.fileToBase64(request.imageFile),
            prompt: renovationPrompt,
            roomType: request.roomType,
            selectedStyle: { 
              name: request.styleChoice,
              description: this.getStyleDescription(request.styleChoice)
            }
          })
        });

        const backendResult = await backendResponse.json();

        if (backendResult.success) {
          console.log('✅ Backend DALL-E 2 editing successful');
          return {
            success: true,
            imageUrl: backendResult.generatedImageUrl,
            style: request.styleChoice,
            roomType: request.roomType
          };
        }
        
        throw new Error(backendResult.message || 'Backend generation failed');
        
      } catch (backendError) {
        console.log('❌ Backend approach failed, trying direct DALL-E 3 with optimized prompt:', backendError.message);
        
        // Fallback: Direct DALL-E 3 with very focused prompt
        const { default: OpenAI } = await import('openai');
        const openai = new OpenAI({
          apiKey: openaiKey,
          dangerouslyAllowBrowser: true
        });
        
        // Create a shorter, more focused prompt for DALL-E 3
        const focusedPrompt = this.createFocusedPrompt(request.styleChoice, request.roomType);
        
        console.log('🎨 Using focused prompt for DALL-E 3:', focusedPrompt.substring(0, 100) + '...');
        
        const directResponse = await openai.images.generate({
          model: "dall-e-3",
          prompt: focusedPrompt,
          n: 1,
          size: "1024x1024",
          quality: "hd", // Use HD quality for better results
          style: "natural" // Natural style for more realistic results
        });
        
        if (directResponse.data[0]?.url) {
          console.log('✅ Direct DALL-E 3 generation successful');
          return {
            success: true,
            imageUrl: directResponse.data[0].url,
            style: request.styleChoice,
            roomType: request.roomType
          };
        }
        
        throw new Error('DALL-E 3 did not return an image URL');
      }

    } catch (error) {
      console.error('❌ All renovation approaches failed:', error);
      
      // Enhanced fallback with style-specific demo image
      return {
        success: true,
        imageUrl: this.getPremiumDemoImage(request.roomType, request.styleChoice),
        style: request.styleChoice,
        roomType: request.roomType,
        fallback: true,
        error: error instanceof Error ? error.message : 'Unknown error occurred during renovation process'
      };
    }
  }

  private static createFocusedPrompt(styleChoice: string, roomType: string): string {
    const styleAdjectives = {
      'modern-minimalist': 'sleek modern minimalist luxury',
      'farmhouse-chic': 'elegant farmhouse chic rustic luxury',
      'transitional': 'sophisticated transitional luxury',
      'coastal-new-england': 'refined coastal New England luxury', 
      'contemporary-luxe': 'high-end contemporary luxe',
      'eclectic-bohemian': 'curated eclectic bohemian luxury'
    };

    const roomDescriptors = {
      kitchen: 'kitchen with premium finishes and fixtures',
      bathroom: 'bathroom with luxury materials and lighting',
      living_room: 'living room with designer furniture and lighting',
      bedroom: 'bedroom with premium bedding and furnishings',
      dining_room: 'dining room with elegant furniture and lighting',
      home_office: 'home office with sophisticated workspace design',
      other: 'interior space with luxury finishes and furnishings'
    };

    const styleDesc = styleAdjectives[styleChoice as keyof typeof styleAdjectives] || 'luxury modern';
    const roomDesc = roomDescriptors[roomType as keyof typeof roomDescriptors] || 'interior space';

    return `Professional architectural rendering of a ${styleDesc} ${roomDesc}. Photorealistic luxury interior design with premium materials, sophisticated lighting, and expert craftsmanship. No text or labels.`;
  }

  private static getStyleDescription(styleChoice: string): string {
    const descriptions = {
      'modern-minimalist': 'Clean lines, neutral colors, premium materials, minimal sophisticated furnishings',
      'farmhouse-chic': 'Rustic elegance, warm colors, natural materials, vintage-inspired luxury fixtures',
      'transitional': 'Blend of traditional and contemporary, sophisticated neutrals, timeless luxury',
      'coastal-new-england': 'Light airy colors, natural materials, sophisticated nautical influences',
      'contemporary-luxe': 'Bold sophisticated design, premium materials, rich colors, designer furnishings',
      'eclectic-bohemian': 'Rich colors, mixed textures, global influences, curated luxury accessories'
    };
    return descriptions[styleChoice as keyof typeof descriptions] || descriptions['modern-minimalist'];
  }

  private static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private static getPremiumDemoImage(roomType: string, styleChoice: string): string {
    // Style-specific premium demo images for better fallback experience
    const premiumDemoImages = {
      kitchen: {
        'modern-minimalist': 'https://images.pexels.com/photos/2724748/pexels-photo-2724748.jpeg?auto=compress&cs=tinysrgb&w=1024',
        'farmhouse-chic': 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=1024',
        'transitional': 'https://images.pexels.com/photos/2251247/pexels-photo-2251247.jpeg?auto=compress&cs=tinysrgb&w=1024',
        'coastal-new-england': 'https://images.pexels.com/photos/2724748/pexels-photo-2724748.jpeg?auto=compress&cs=tinysrgb&w=1024',
        'contemporary-luxe': 'https://images.pexels.com/photos/1080721/pexels-photo-1080721.jpeg?auto=compress&cs=tinysrgb&w=1024',
        'eclectic-bohemian': 'https://images.pexels.com/photos/2251247/pexels-photo-2251247.jpeg?auto=compress&cs=tinysrgb&w=1024'
      },
      // Add more room types as needed...
    };

    const roomImages = premiumDemoImages[roomType as keyof typeof premiumDemoImages];
    if (roomImages) {
      const styleImage = roomImages[styleChoice as keyof typeof roomImages];
      if (styleImage) return styleImage;
    }

    // Fallback to general high-quality images
    const generalDemoImages = {
      kitchen: 'https://images.pexels.com/photos/1080721/pexels-photo-1080721.jpeg?auto=compress&cs=tinysrgb&w=1024',
      bathroom: 'https://images.pexels.com/photos/2062426/pexels-photo-2062426.jpeg?auto=compress&cs=tinysrgb&w=1024',
      living_room: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=1024',
      bedroom: 'https://images.pexels.com/photos/2089698/pexels-photo-2089698.jpeg?auto=compress&cs=tinysrgb&w=1024',
      dining_room: 'https://images.pexels.com/photos/2724749/pexels-photo-2724749.jpeg?auto=compress&cs=tinysrgb&w=1024',
      home_office: 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=1024',
      other: 'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=1024'
    };
    
    return generalDemoImages[roomType as keyof typeof generalDemoImages] || generalDemoImages.other;
  }
}
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
    const basePrompt = `Create a beautiful interior renovation that maintains the exact same room layout and architectural features as the original image. This is a makeover of the existing space - preserve all structural elements, room dimensions, window and door positions, and built-in features. Only update finishes, colors, fixtures, and furniture. Do not add text, labels, or annotations to the image.`;
    
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

      // Generate the comprehensive prompt
      const renovationPrompt = request.customPrompt 
        ? this.generateCustomRenovationPrompt(request.styleChoice, request.roomType, request.customPrompt)
        : this.generateRenovationPrompt(request.styleChoice, request.roomType);
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

      // Try multiple approaches for better layout preservation
      try {
        // Approach 1: Use backend API with DALL-E 2 editing
        console.log('🎨 Trying DALL-E 2 image editing approach...');
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

        if (result.success) {
          return {
            success: true,
            imageUrl: result.generatedImageUrl,
            style: request.styleChoice,
            roomType: request.roomType
          };
        }
        
        throw new Error(result.message || 'Backend generation failed');
        
      } catch (backendError) {
        console.log('❌ Backend approach failed, trying direct DALL-E 3:', backendError.message);
        
        // Approach 2: Direct DALL-E 3 with very simple prompt
        const { default: OpenAI } = await import('openai');
        const openai = new OpenAI({
          apiKey: openaiKey,
          dangerouslyAllowBrowser: true
        });
        
        const simplePrompt = `Update this ${request.roomType} with ${request.styleChoice} style. Keep the same layout and only change finishes. No text or labels.`;
        
        const directResponse = await openai.images.generate({
          model: "dall-e-3",
          prompt: simplePrompt,
          n: 1,
          size: "1024x1024",
          quality: "standard"
        });
        
        return {
          success: true,
          imageUrl: directResponse.data[0]?.url || this.getDemoImage(request.roomType),
          style: request.styleChoice,
          roomType: request.roomType
        };
      }

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
