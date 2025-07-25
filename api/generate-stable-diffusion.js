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
    console.log('📸 Image data prepared for img2img');

    try {
      console.log('🏗️ Calling Stable Diffusion img2img for layout-preserving renovation...');
      console.log('🏗️ Model: stability-ai/stable-diffusion-img2img');
      console.log('🏗️ Prompt length:', professionalPrompt.length);
      
      // Use single img2img model with conservative strength for layout preservation
      const output = await replicate.run(
        "stability-ai/stable-diffusion-img2img:15a3689ee13b0d2616e98820eca31d4c3abcd36672df6afce5cb6feb1d66087d",
        {
          input: {
            image: imageUrl,
            prompt: professionalPrompt,
            negative_prompt: negativePrompt,
            num_inference_steps: 20,
            guidance_scale: 7.5,
            strength: 0.5  // Conservative strength to preserve layout
          }
        }
      );
      
      console.log('✅ Img2img renovation completed');
      console.log('🏗️ Output type:', typeof output);
      console.log('🏗️ Output content:', output);
      
      let generatedImageUrl;
      if (Array.isArray(output) && output.length > 0 && output[0]) {
        // Handle both URL strings and file objects
        generatedImageUrl = typeof output[0] === 'string' ? output[0] : output[0].url();
      } else if (typeof output === 'string') {
        generatedImageUrl = output;
      } else if (output && typeof output.url === 'function') {
        generatedImageUrl = output.url();
      } else {
        throw new Error('Unexpected output format from Stable Diffusion');
      }
      
      if (!generatedImageUrl) {
        throw new Error('No image URL returned from Stable Diffusion XL');
      }
      
      console.log('✅ Professional architectural rendering successful');
      console.log('🏗️ Generated image URL:', typeof generatedImageUrl === 'string' ? generatedImageUrl.substring(0, 50) + '...' : generatedImageUrl);
      
      return res.status(200).json({
        success: true,
        generatedImageUrl: generatedImageUrl,
        message: `Layout-preserving renovation with ${selectedStyle?.name || 'custom'} style`,
        appliedStyle: selectedStyle?.name,
        roomType: roomType,
        method: 'single-img2img-layout-preserving',
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
  const basePrompt = `award-winning interior design photography, luxury ${roomType} renovation, professional real estate photography, magazine cover quality, perfect natural lighting, seamless composition, high-end materials, flawless execution, architectural digest style, sharp focus throughout, professional color grading`;

  const stylePrompts = {
    'modern-minimalist': `stunning modern minimalist kitchen with flawless white slab-door cabinets, seamless handleless design, pristine white quartz waterfall countertops, fully integrated premium appliances, perfect under-cabinet LED lighting, large format light gray porcelain tiles, brushed stainless steel accents, clean architectural lines, abundant natural light, magazine-worthy styling`,
    
    'farmhouse-chic': `breathtaking farmhouse kitchen with custom white shaker cabinets, beautiful raised panel doors, gorgeous honed Carrara marble countertops, classic white subway tile with charcoal grout, stunning white farmhouse apron sink, elegant oil-rubbed bronze cup pulls and knobs, rich wide-plank hardwood flooring, beautiful pendant lights with clear glass shades, warm natural wood beam accents`,
    
    'transitional': `elegant transitional kitchen featuring warm gray raised panel cabinetry, beautiful natural granite countertops in warm earth tones, sophisticated neutral stone backsplash, polished brushed nickel hardware, rich medium-tone hardwood flooring, classic pendant lighting fixtures, perfect blend of traditional craftsmanship and contemporary style, warm inviting atmosphere`,
    
    'coastal-new-england': `gorgeous coastal New England kitchen with crisp white shaker cabinets featuring beadboard panel inserts, pristine white Carrara marble countertops, beautiful sea glass blue subway tile backsplash, polished chrome cup pulls and knobs, light natural oak hardwood floors, charming nautical-inspired pendant lights, bright airy atmosphere with abundant natural light, fresh coastal elegance`,
    
    'contemporary-luxe': `spectacular contemporary luxury kitchen with high-gloss charcoal lacquer cabinets, dramatic Calacatta Gold marble countertops with stunning veining, large format book-matched marble backsplash, elegant brushed gold hardware, rich dark hardwood flooring, stunning crystal pendant lighting, premium materials throughout, sophisticated modern luxury, impeccable craftsmanship`,
    
    'eclectic-bohemian': `stunning eclectic bohemian kitchen with beautiful mixed cabinetry in rich emerald green paint and natural walnut wood, gorgeous natural stone countertops with unique character, exquisite handcrafted Moroccan patterned tile backsplash, curated mixed metal hardware in antique brass and copper, rich walnut hardwood floors, beautiful artisanal pendant lights with natural materials, sophisticated global-inspired design, rich layered textures and warm inviting colors`
  };

  const selectedStylePrompt = stylePrompts[selectedStyle?.id] || stylePrompts['modern-minimalist'];
  
  return `${basePrompt}, ${selectedStylePrompt}, shot with professional camera, perfect composition, seamless design, flawless execution, natural lighting, realistic materials and textures, no artificial effects, no text, no labels, no watermarks, magazine-quality interior photography`;
}

// Create negative prompt to avoid unwanted elements
function createNegativePrompt() {
  return `cartoon, anime, sketch, drawing, painting, illustration, text, labels, words, letters, watermark, signature, blurry, low quality, distorted, deformed, ugly, bad anatomy, extra limbs, missing parts, oversaturated, unrealistic colors, amateur photography, artificial looking, plastic appearance, overly processed, fake materials, CGI, rendered look, synthetic textures, fragmented, split image, multiple exposures, collage, patchwork, seams, visible joints, mismatched lighting, inconsistent perspective, choppy composition, layered images, composite look`;
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