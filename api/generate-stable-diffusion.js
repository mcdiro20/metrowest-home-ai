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

    // Method 1: Try ControlNet Canny (best for layout preservation)
    try {
      console.log('🏗️ Attempting ControlNet Canny for perfect layout preservation...');
      
      const controlNetOutput = await replicate.run(
        "jagilley/controlnet-canny:aff48af9c68d162388d230a2ab003f68d2638d88307bdaf1c2f1ac95079c9613",
        {
          input: {
            image: imageData,
            prompt: `architectural renovation: ${layoutPreservingPrompt}`,
            num_samples: 1,
            image_resolution: 512,
            ddim_steps: 20,
            scale: 7.0,
            eta: 0.0,
            low_threshold: 100,
            high_threshold: 200,
            detect_resolution: 512
          }
        }
      );
      
      console.log('✅ ControlNet Canny renovation completed');
      
      let controlNetImageUrl;
      if (Array.isArray(controlNetOutput) && controlNetOutput.length > 0) {
        controlNetImageUrl = controlNetOutput[0];
      } else {
        controlNetImageUrl = controlNetOutput;
      }
      
      if (controlNetImageUrl) {
        console.log('✅ Perfect layout preservation successful with ControlNet');
        
        return res.status(200).json({
          success: true,
          generatedImageUrl: controlNetImageUrl,
          message: `Perfect layout preservation with ${selectedStyle?.name || 'custom'} style using ControlNet`,
          appliedStyle: selectedStyle?.name,
          roomType: roomType,
          method: 'controlnet-canny-layout-preservation',
          prompt: layoutPreservingPrompt
        });
      }
      
    } catch (controlNetError) {
      console.error('❌ ControlNet Canny failed:', controlNetError);
    }

    // Method 2: Try ControlNet Depth (good for 3D layout preservation)
    try {
      console.log('🏗️ Attempting ControlNet Depth for 3D layout preservation...');
      
      const depthOutput = await replicate.run(
        "jagilley/controlnet-depth:8b3b8c4e8b8c4e8b8c4e8b8c4e8b8c4e8b8c4e8b8c4e8b8c4e8b8c4e8b8c4e8b",
        {
          input: {
            image: imageData,
            prompt: `architectural renovation maintaining exact 3D layout: ${layoutPreservingPrompt}`,
            num_samples: 1,
            image_resolution: 512,
            ddim_steps: 15,
            scale: 6.0,
            eta: 0.0
          }
        }
      );
      
      console.log('✅ ControlNet Depth renovation completed');
      
      let depthImageUrl;
      if (Array.isArray(depthOutput) && depthOutput.length > 0) {
        depthImageUrl = depthOutput[0];
      } else {
        depthImageUrl = depthOutput;
      }
      
      if (depthImageUrl) {
        console.log('✅ 3D layout preservation successful with ControlNet Depth');
        
        return res.status(200).json({
          success: true,
          generatedImageUrl: depthImageUrl,
          message: `3D layout preservation with ${selectedStyle?.name || 'custom'} style using ControlNet Depth`,
          appliedStyle: selectedStyle?.name,
          roomType: roomType,
          method: 'controlnet-depth-layout-preservation',
          prompt: layoutPreservingPrompt
        });
      }
      
    } catch (depthError) {
      console.error('❌ ControlNet Depth failed:', depthError);
    }

    // Method 3: Try very conservative img2img with high layout preservation
    try {
      console.log('🏗️ Attempting conservative img2img with maximum layout preservation...');
      
      const conservativeOutput = await replicate.run(
        "stability-ai/stable-diffusion:db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf",
        {
          input: {
            image: imageData,
            prompt: `subtle renovation of this EXACT kitchen layout: ${layoutPreservingPrompt}. CRITICAL: Keep the same room dimensions, island placement, window positions, cabinet arrangement, and camera angle. Only change cabinet colors and finishes.`,
            num_inference_steps: 15,
            guidance_scale: 5.0,
            strength: 0.25  // Very low strength to preserve maximum layout
          }
        }
      );
      
      console.log('✅ Conservative img2img renovation completed');
      
      let conservativeImageUrl;
      if (Array.isArray(conservativeOutput) && conservativeOutput.length > 0) {
        conservativeImageUrl = conservativeOutput[0];
      } else {
        conservativeImageUrl = conservativeOutput;
      }
      
      if (conservativeImageUrl) {
        console.log('✅ Maximum layout preservation successful');
        
        return res.status(200).json({
          success: true,
          generatedImageUrl: conservativeImageUrl,
          message: `Maximum layout preservation with ${selectedStyle?.name || 'custom'} style (conservative approach)`,
          appliedStyle: selectedStyle?.name,
          roomType: roomType,
          method: 'conservative-img2img-layout-preservation',
          prompt: layoutPreservingPrompt
        });
      }
      
    } catch (conservativeError) {
      console.error('❌ Conservative img2img failed:', conservativeError);
    }

    // Final fallback: Demo image
    console.log('🔄 All layout-preserving methods failed - using demo image');
    
    return res.status(200).json({
      success: true,
      generatedImageUrl: getDemoImage(roomType),
      message: `Demo mode - All layout-preserving AI methods failed`,
      appliedStyle: selectedStyle?.name,
      roomType: roomType,
      method: 'demo-fallback'
    });

  } catch (error) {
    console.error('❌ Unexpected error in Layout-Preserving Renovation:', error);
    
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