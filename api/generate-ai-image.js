export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageData, prompt, roomType, selectedStyle, customPrompt } = req.body;

    console.log('🏗️ Professional Architectural Rendering Request:');
    console.log('🏠 Room type:', roomType);
    console.log('🎨 Selected style:', selectedStyle?.name);
    console.log('📸 Has image data:', !!imageData);

    // Validate required data
    if (!imageData) {
      console.error('❌ No image data provided');
      return res.status(400).json({
        success: false,
        message: 'Image data is required',
        error: 'missing_image_data'
      });
    }

    if (!imageData.startsWith('data:image/')) {
      console.error('❌ Invalid image data format');
      return res.status(400).json({
        success: false,
        message: 'Invalid image data format',
        error: 'invalid_image_format'
      });
    }

    // Check for OpenAI API key
    const openaiKey = process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    
    if (!openaiKey) {
      console.log('⚠️ No OpenAI API key found');
      
      // Return demo image instead of failing
      const demoImages = {
        kitchen: 'https://images.pexels.com/photos/1080721/pexels-photo-1080721.jpeg?auto=compress&cs=tinysrgb&w=1024',
        bathroom: 'https://images.pexels.com/photos/2062426/pexels-photo-2062426.jpeg?auto=compress&cs=tinysrgb&w=1024',
        living_room: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=1024',
        bedroom: 'https://images.pexels.com/photos/2089698/pexels-photo-2089698.jpeg?auto=compress&cs=tinysrgb&w=1024',
        dining_room: 'https://images.pexels.com/photos/2724749/pexels-photo-2724749.jpeg?auto=compress&cs=tinysrgb&w=1024',
        home_office: 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=1024',
        other: 'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=1024'
      };
      
      const demoImageUrl = demoImages[roomType] || demoImages.kitchen;
      
      return res.status(200).json({
        success: true,
        generatedImageUrl: demoImageUrl,
        message: 'Demo mode - OpenAI API key not configured',
        appliedStyle: selectedStyle?.name,
        roomType: roomType,
        method: 'demo-no-api-key',
        prompt: professionalPrompt
      });
    }

    console.log('✅ OpenAI API key found, length:', openaiKey.length);

    // Import OpenAI dynamically
    let OpenAI;
    try {
      const openaiModule = await import('openai');
      OpenAI = openaiModule.default;
      console.log('✅ OpenAI module imported successfully');
    } catch (importError) {
      console.error('❌ Failed to import OpenAI:', importError);
      return res.status(500).json({
        success: false,
        message: 'Failed to import OpenAI module',
        error: importError.message
      });
    }

    const openai = new OpenAI({
      apiKey: openaiKey
    });

    console.log('✅ OpenAI client created');

    // Convert base64 to buffer for DALL-E 2 editing
    let imageBuffer;
    try {
      const base64Data = imageData.split(',')[1];
      if (!base64Data) {
        throw new Error('Invalid base64 data');
      }
      imageBuffer = Buffer.from(base64Data, 'base64');
      console.log('✅ Image converted to buffer, size:', imageBuffer.length, 'bytes');
    } catch (bufferError) {
      console.error('❌ Failed to convert image to buffer:', bufferError);
      return res.status(400).json({
        success: false,
        message: 'Failed to process image data',
        error: bufferError.message
      });
    }

    // Create professional architectural rendering prompt
    const professionalPrompt = createProfessionalRenderingPrompt(selectedStyle, roomType, customPrompt);
    console.log('🏗️ Professional rendering prompt:', professionalPrompt);

    // Try DALL-E 2 image editing with professional prompt
    try {
      console.log('🏗️ Calling DALL-E 2 for professional architectural rendering...');
      
      const editResponse = await openai.images.edit({
        image: imageBuffer,
        prompt: professionalPrompt,
        n: 1,
        size: "1024x1024"
      });
      
      console.log('✅ DALL-E 2 professional rendering completed');
      
      const generatedImageUrl = editResponse.data[0]?.url;
      
      if (!generatedImageUrl) {
        throw new Error('No image URL returned from DALL-E 2 professional rendering');
      }
      
      console.log('✅ Professional architectural rendering successful');
      console.log('🏗️ Generated image URL:', generatedImageUrl.substring(0, 50) + '...');
      
      return res.status(200).json({
        success: true,
        generatedImageUrl: generatedImageUrl,
        message: `Professional architectural rendering with ${selectedStyle?.name || 'custom'} style`,
        appliedStyle: selectedStyle?.name,
        roomType: roomType,
        method: 'dalle-2-professional-rendering',
        prompt: professionalPrompt
      });
      
    } catch (editError) {
      console.error('❌ DALL-E 2 professional rendering failed:', editError);
      
      // Try DALL-E 3 with ultra-professional prompt as fallback
      try {
        console.log('🏗️ Trying DALL-E 3 professional rendering as fallback...');
        
        const dalle3ProfessionalPrompt = createDALLE3ProfessionalPrompt(selectedStyle, roomType, customPrompt);
        console.log('🏗️ DALL-E 3 professional prompt:', dalle3ProfessionalPrompt);
        
        const generateResponse = await openai.images.generate({
          model: "dall-e-3",
          prompt: dalle3ProfessionalPrompt,
          n: 1,
          size: "1024x1024",
          quality: "hd",
          style: "natural"
        });
        
        const generatedImageUrl = generateResponse.data[0]?.url;
        
        if (!generatedImageUrl) {
          throw new Error('No image URL returned from DALL-E 3 professional rendering');
        }
        
        console.log('✅ DALL-E 3 professional rendering successful (fallback)');
        
        return res.status(200).json({
          success: true,
          generatedImageUrl: generatedImageUrl,
          message: `Professional rendering with DALL-E 3 (camera angle may vary)`,
          appliedStyle: selectedStyle?.name,
          roomType: roomType,
          method: 'dalle-3-professional-fallback',
          prompt: dalle3ProfessionalPrompt
        });
        
      } catch (generateError) {
        console.error('❌ DALL-E 3 professional rendering also failed:', generateError);
        
        return res.status(500).json({
          success: false,
          message: `Professional rendering failed: ${editError.message}`,
          error: editError.message,
          fallbackError: generateError.message,
          method: 'failed'
        });
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error in Professional Rendering:', error);
    
    return res.status(500).json({
      success: false,
      message: `Unexpected error: ${error.message}`,
      error: error.message,
      method: 'error'
    });
  }
}

// Create professional architectural rendering prompt for DALL-E 2 editing
function createProfessionalRenderingPrompt(selectedStyle, roomType, customPrompt) {
  const basePrompt = `My prompt has full detail so no need to add more. PROFESSIONAL ARCHITECTURAL INTERIOR RENDERING: Transform this ${roomType} into a high-end, photorealistic architectural visualization that maintains the EXACT same camera angle, perspective, lighting direction, and spatial layout. This is a $3000 professional rendering quality transformation.

CRITICAL REQUIREMENTS:
- Keep identical camera viewpoint and angle
- Preserve exact room dimensions and proportions  
- Maintain all window and door positions
- Keep same lighting direction and quality
- Preserve all architectural features and built-ins
- Only update surface finishes, materials, and fixtures

PROFESSIONAL RENDERING QUALITY:
- Photorealistic materials with proper reflections and textures
- Professional architectural photography lighting
- High-end interior design finishes
- Crisp, clean, magazine-quality appearance
- No sketchy or drawn appearance
- Sharp focus throughout
- Proper depth of field
- Professional color grading`;

  // Style-specific professional specifications
  const professionalStyleSpecs = {
    'modern-minimalist': `MODERN MINIMALIST PROFESSIONAL SPECIFICATION:
- Sleek handleless cabinetry in matte white or warm gray lacquer
- Premium quartz countertops with waterfall edges
- Integrated LED strip lighting under cabinets
- Stainless steel or integrated appliances
- Large format porcelain tile flooring
- Minimal hardware in brushed stainless or matte black
- Clean geometric lines throughout
- Professional architectural lighting design`,

    'farmhouse-chic': `FARMHOUSE CHIC PROFESSIONAL SPECIFICATION:
- Custom painted Shaker-style cabinetry in Benjamin Moore Cloud White
- Honed Carrara marble or butcher block countertops
- Subway tile backsplash with dark grout
- Farmhouse sink with bridge faucet
- Wide plank hardwood flooring
- Oil-rubbed bronze or matte black hardware
- Pendant lighting with clear glass shades
- Professional rustic-luxe finish quality`,

    'transitional': `TRANSITIONAL PROFESSIONAL SPECIFICATION:
- Raised panel cabinetry in warm neutral paint
- Natural stone countertops with eased edges
- Classic subway or natural stone backsplash
- Brushed nickel or champagne bronze hardware
- Hardwood flooring in medium tones
- Traditional pendant or chandelier lighting
- Professional blend of classic and contemporary elements
- High-end traditional craftsmanship`,

    'coastal-new-england': `COASTAL NEW ENGLAND PROFESSIONAL SPECIFICATION:
- White painted Shaker cabinetry with beadboard details
- White marble countertops with subtle veining
- Glass subway tile backsplash in soft blue or white
- Polished chrome or brushed nickel hardware
- Light oak or whitewashed hardwood flooring
- Nautical-inspired pendant lighting
- Professional coastal luxury finish quality
- Fresh, airy, high-end beach house aesthetic`,

    'contemporary-luxe': `CONTEMPORARY LUXE PROFESSIONAL SPECIFICATION:
- High-gloss lacquer or exotic wood veneer cabinetry
- Premium granite, marble, or engineered quartz countertops
- Large format natural stone or glass tile backsplash
- Brushed gold, matte black, or stainless steel hardware
- Large format porcelain or natural stone flooring
- Designer pendant or chandelier lighting
- Professional luxury finish quality throughout
- High-end contemporary sophistication`,

    'eclectic-bohemian': `ECLECTIC BOHEMIAN PROFESSIONAL SPECIFICATION:
- Mixed wood and painted cabinetry in rich, warm tones
- Natural stone countertops with character and veining
- Patterned ceramic or natural stone backsplash
- Mixed metal hardware in brass, copper, and bronze
- Hardwood flooring with rich stains
- Artisanal pendant lighting with natural materials
- Professional eclectic luxury finish quality
- Curated, sophisticated bohemian aesthetic`
  };

  const styleSpec = professionalStyleSpecs[selectedStyle?.id] || professionalStyleSpecs['modern-minimalist'];
  
  let finalPrompt = `${basePrompt}\n\n${styleSpec}`;
  
  if (customPrompt) {
    finalPrompt += `\n\nADDITIONAL CUSTOM REQUIREMENTS: ${customPrompt}`;
  }
  
  finalPrompt += `\n\nFINAL REQUIREMENTS: Create a photorealistic, professional architectural interior rendering with magazine-quality finishes. No text, labels, sketchy appearance, or drawn elements. This must look like a $3000 professional architectural visualization.`;
  
  return finalPrompt;
}

// Create DALL-E 3 professional prompt (fallback)
function createDALLE3ProfessionalPrompt(selectedStyle, roomType, customPrompt) {
  const basePrompt = `My prompt has full detail so no need to add more. Create a professional architectural interior rendering of a ${roomType} renovation. This must be photorealistic, magazine-quality, professional interior design photography.

PROFESSIONAL RENDERING REQUIREMENTS:
- Photorealistic materials and textures
- Professional architectural photography lighting
- High-end interior design finishes
- Sharp, clean, professional appearance
- Proper depth of field and focus
- Professional color grading
- No text, labels, or sketchy elements`;

  const styleDescriptions = {
    'modern-minimalist': 'Modern minimalist design with sleek white cabinetry, quartz countertops, and clean lines',
    'farmhouse-chic': 'Farmhouse chic design with white Shaker cabinets, marble countertops, and rustic elements',
    'transitional': 'Transitional design blending classic and contemporary elements with neutral tones',
    'coastal-new-england': 'Coastal New England design with white cabinetry, light colors, and nautical touches',
    'contemporary-luxe': 'Contemporary luxury design with high-end materials and sophisticated finishes',
    'eclectic-bohemian': 'Eclectic bohemian design with rich colors, mixed textures, and global influences'
  };

  const styleDesc = styleDescriptions[selectedStyle?.id] || 'modern design with high-end finishes';
  
  let finalPrompt = `${basePrompt}\n\nSTYLE: ${styleDesc}`;
  
  if (customPrompt) {
    finalPrompt += `\n\nCUSTOM REQUIREMENTS: ${customPrompt}`;
  }
  
  finalPrompt += `\n\nCreate a professional, photorealistic interior rendering that looks like a $3000 architectural visualization. No text, labels, or drawn elements.`;
  
  return finalPrompt;
}