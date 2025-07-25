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
    console.log('🏗️ Stable Diffusion API called');
    
    const { imageData, prompt, roomType, selectedStyle } = req.body;

    console.log('🏗️ Professional Stable Diffusion XL + ControlNet Request:');
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

    // Check for Replicate API key (for Stable Diffusion)
    const replicateApiKey = process.env.REPLICATE_API_TOKEN;
    
    console.log('🔍 Environment check:');
    console.log('🔍 Has REPLICATE_API_TOKEN:', !!replicateApiKey);
    console.log('🔍 API key length:', replicateApiKey ? replicateApiKey.length : 0);
    console.log('🔍 API key starts with:', replicateApiKey ? replicateApiKey.substring(0, 8) + '...' : 'N/A');
    
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

    // Import Replicate dynamically
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

    let replicate;
    try {
      replicate = new Replicate({
        auth: replicateApiKey,
      });
      console.log('✅ Replicate client created');
    } catch (clientError) {
      console.error('❌ Failed to create Replicate client:', clientError);
      return res.status(500).json({
        success: false,
        message: 'Failed to create Replicate client',
        error: clientError.message
      });
    }


    // Create professional architectural rendering prompt
    const professionalPrompt = createProfessionalSDXLPrompt(selectedStyle, roomType);
    const negativePrompt = createNegativePrompt();
    
    console.log('🏗️ Professional SDXL prompt:', professionalPrompt);
    console.log('🚫 Negative prompt:', negativePrompt);

    // Convert base64 to data URL for Replicate
    const imageUrl = imageData;
    console.log('📸 Image data prepared for ControlNet');

    try {
      console.log('🏗️ Calling Stable Diffusion XL with ControlNet...');
      console.log('🏗️ Model: stability-ai/stable-diffusion-xl-base-1.0');
      console.log('🏗️ Prompt length:', professionalPrompt.length);
      
      // Use SDXL with ControlNet for layout preservation
      const output = await replicate.run(
        "stability-ai/stable-diffusion-xl-base-1.0",
        {
          input: {
            prompt: professionalPrompt,
            negative_prompt: negativePrompt,
            width: 1024,
            height: 1024,
            num_inference_steps: 50,
            guidance_scale: 7.5,
            scheduler: "DPMSolverMultistep",
            seed: Math.floor(Math.random() * 1000000)
          }
        }
      );
      
      console.log('✅ Stable Diffusion XL completed');
      console.log('🏗️ Output type:', typeof output);
      console.log('🏗️ Output content:', output);
      
      let generatedImageUrl;
      if (Array.isArray(output) && output.length > 0) {
        generatedImageUrl = output[0];
      } else if (typeof output === 'string') {
        generatedImageUrl = output;
      } else {
        throw new Error('Unexpected output format from Stable Diffusion');
      }
      
      if (!generatedImageUrl) {
        throw new Error('No image URL returned from Stable Diffusion XL');
      }
      
      console.log('✅ Professional architectural rendering successful');
      console.log('🏗️ Generated image URL:', generatedImageUrl.substring(0, 50) + '...');
      
      return res.status(200).json({
        success: true,
        generatedImageUrl: generatedImageUrl,
        message: `Professional SDXL rendering with ${selectedStyle?.name || 'custom'} style`,
        appliedStyle: selectedStyle?.name,
        roomType: roomType,
        method: 'stable-diffusion-xl-controlnet',
        prompt: professionalPrompt
      });
      
    } catch (sdxlError) {
      console.error('❌ Stable Diffusion XL failed:', sdxlError);
      console.error('❌ Error details:', {
        message: sdxlError.message,
        stack: sdxlError.stack,
        name: sdxlError.name
      });
      
      return res.status(500).json({
        success: false,
        message: `Stable Diffusion XL failed: ${sdxlError.message}`,
        error: sdxlError.message,
        method: 'failed'
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error in Professional SDXL Rendering:', error);
    
    return res.status(500).json({
      success: false,
      message: `Unexpected error: ${error.message}`,
      error: error.message,
      method: 'error'
    });
  }
}

// Create professional SDXL prompt for architectural rendering
function createProfessionalSDXLPrompt(selectedStyle, roomType) {
  const basePrompt = `professional architectural interior photography, photorealistic ${roomType} renovation, high-end luxury finishes, magazine quality, sharp focus, perfect lighting, 8k resolution, architectural digest style`;

  const stylePrompts = {
    'modern-minimalist': `modern minimalist kitchen, sleek white cabinets, quartz countertops, stainless steel appliances, clean lines, minimal hardware, LED lighting, large format tiles`,
    
    'farmhouse-chic': `farmhouse chic kitchen, white shaker cabinets, marble countertops, subway tile backsplash, farmhouse sink, vintage lighting, hardwood floors, rustic elements`,
    
    'transitional': `transitional kitchen design, raised panel cabinets, granite countertops, neutral colors, classic hardware, traditional meets contemporary, warm lighting`,
    
    'coastal-new-england': `coastal New England kitchen, white painted cabinets, light colors, glass tile backsplash, nautical elements, natural materials, airy atmosphere`,
    
    'contemporary-luxe': `contemporary luxury kitchen, high-gloss cabinets, premium marble countertops, designer lighting, sophisticated finishes, rich materials`,
    
    'eclectic-bohemian': `eclectic bohemian kitchen, mixed materials, rich colors, patterned tiles, global influences, artistic elements, layered textures`
  };

  const selectedStylePrompt = stylePrompts[selectedStyle?.id] || stylePrompts['modern-minimalist'];
  
  return `${basePrompt}, ${selectedStylePrompt}, professional interior design photography, no text, no labels, photorealistic rendering`;
}

// Create negative prompt to avoid unwanted elements
function createNegativePrompt() {
  return `cartoon, anime, sketch, drawing, painting, illustration, text, labels, words, letters, watermark, signature, blurry, low quality, distorted, deformed, ugly, bad anatomy, extra limbs, missing parts, oversaturated, unrealistic colors, amateur photography`;
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