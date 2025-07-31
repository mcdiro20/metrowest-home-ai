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
    console.log('🏗️ ControlNet Layout-Preserving Renovation API called');
    
    const { imageData, prompt, roomType, selectedStyle } = req.body;

    console.log('🏗️ ControlNet Layout Preservation Request:');
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

    // Check for Replicate API key
    const replicateApiKey = process.env.REPLICATE_API_TOKEN;
    
    if (!replicateApiKey) {
      console.log('⚠️ No Replicate API key found - using demo mode');
      return res.status(200).json({
        success: true,
        generatedImageUrl: getDemoImage(roomType),
        message: 'Demo mode - Replicate API key not configured',
        method: 'demo',
        appliedStyle: selectedStyle?.name,
        roomType: roomType
      });
    }

    console.log('✅ Replicate API key found');

    // Import Replicate
    let Replicate;
    try {
      const replicateModule = await import('replicate');
      Replicate = replicateModule.default;
      console.log('✅ Replicate module imported successfully');
    } catch (importError) {
      console.error('❌ Failed to import Replicate:', importError);
      return res.status(500).json({
        success: false,
        message: 'Failed to import Replicate module',
        error: importError.message
      });
    }

    const replicate = new Replicate({
      auth: replicateApiKey,
    });

    // Create layout-preserving renovation prompt
    const layoutPreservingPrompt = createLayoutPreservingPrompt(selectedStyle, roomType);
    console.log('🏗️ Layout-preserving prompt:', layoutPreservingPrompt);

    // Use Flux Canny Pro for professional edge-guided image generation
    try {
      console.log('🏗️ Using Flux Canny Pro for professional layout preservation...');
      
      const fluxOutput = await replicate.run(
        "black-forest-labs/flux-canny-pro:b0a59442583d6a8946e4766836f11b8d3fc516fe847c22cf11309c5f0a792111",
        {
          input: {
            control_image: imageData,
            prompt: `architectural renovation: ${layoutPreservingPrompt}`,
            guidance: 7.5,
            steps: 30,
            safety_tolerance: 2
          }
        }
      );
      
      console.log('✅ Flux Canny Pro renovation completed');
      
      let fluxImageUrl;
      if (Array.isArray(fluxOutput) && fluxOutput.length > 0) {
        fluxImageUrl = fluxOutput[0];
      } else {
        fluxImageUrl = fluxOutput;
      }
      
      if (fluxImageUrl) {
        console.log('✅ Professional layout preservation successful with Flux Canny Pro');
        
        return res.status(200).json({
          success: true,
          generatedImageUrl: fluxImageUrl,
          message: `Professional layout preservation with ${selectedStyle?.name || 'custom'} style using Flux Canny Pro`,
          appliedStyle: selectedStyle?.name,
          roomType: roomType,
          method: 'flux-canny-pro-layout-preservation',
          prompt: layoutPreservingPrompt
        });
      }
      
    } catch (fluxError) {
      console.error('❌ Flux Canny Pro failed:', fluxError);
    }

    // Final fallback: Demo image
    console.log('🔄 Flux Canny Pro failed - using demo image');
    
    return res.status(200).json({
      success: true,
      generatedImageUrl: getDemoImage(roomType),
      message: `Demo mode - Flux Canny Pro failed`,
      appliedStyle: selectedStyle?.name,
      roomType: roomType,
      method: 'demo-fallback'
    });

  } catch (error) {
    console.error('❌ Unexpected error in Flux Canny Pro Renovation:', error);
    
    return res.status(500).json({
      success: false,
      message: `Unexpected error: ${error.message}`,
      error: error.message,
      method: 'error'
    });
  }
}

// Create layout-preserving prompt focused on preserving structure
function createLayoutPreservingPrompt(selectedStyle, roomType) {
  const basePrompt = `professional architectural renovation of this exact ${roomType} maintaining identical layout, room dimensions, island placement, window positions, cabinet arrangement, and camera perspective`;

  const stylePrompts = {
    'modern-minimalist': `Transform ONLY the cabinet finishes to sleek white lacquer with handleless design, update countertops to white quartz, add LED lighting. Keep everything else identical including layout, island size, window placement, and room dimensions.`,
    
    'farmhouse-chic': `Transform ONLY the cabinet finishes to white shaker style with traditional hardware, update countertops to marble, add farmhouse sink if possible. Keep everything else identical including layout, island size, window placement, and room dimensions.`,
    
    'transitional': `Transform ONLY the cabinet finishes to warm neutral raised panels with brushed nickel hardware, update countertops to granite. Keep everything else identical including layout, island size, window placement, and room dimensions.`,
    
    'coastal-new-england': `Transform ONLY the cabinet finishes to white with beadboard details and chrome hardware, update countertops to white marble. Keep everything else identical including layout, island size, window placement, and room dimensions.`,
    
    'contemporary-luxe': `Transform ONLY the cabinet finishes to high-gloss dark lacquer with gold hardware, update countertops to dramatic marble. Keep everything else identical including layout, island size, window placement, and room dimensions.`,
    
    'eclectic-bohemian': `Transform ONLY the cabinet finishes to mixed colorful cabinets with brass hardware, add patterned backsplash. Keep everything else identical including layout, island size, window placement, and room dimensions.`
  };

  const selectedStylePrompt = stylePrompts[selectedStyle?.id] || stylePrompts['modern-minimalist'];
  
  return `${basePrompt}. ${selectedStylePrompt} CRITICAL: This must look like the same kitchen with only surface finishes changed.`;
}

// Demo images for fallback
function getDemoImage(roomType) {
  const demoImages = {
    kitchen: 'https://images.pexels.com/photos/1080721/pexels-photo-1080721.jpeg?auto=compress&cs=tinysrgb&w=1024',
    bathroom: 'https://images.pexels.com/photos/2062426/pexels-photo-2062426.jpeg?auto=compress&cs=tinysrgb&w=1024',
    living_room: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=1024',
    bedroom: 'https://images.pexels.com/photos/2089698/pexels-photo-2089698.jpeg?auto=compress&cs=tinysrgb&w=1024',
    dining_room: 'https://images.pexels.com/photos/2724749/pexels-photo-2724749.jpeg?auto=compress&cs=tinysrgb&w=1024',
    home_office: 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=1024',
    other: 'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=1024'
  };
  
  return demoImages[roomType] || demoImages.kitchen;
}
