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
  const basePrompt = `ultra-realistic interior design photography by top architectural firm, $100,000 luxury ${roomType} renovation, shot with Canon EOS R5 85mm lens, perfect natural window lighting, zero artifacts, completely seamless renovation, museum-quality craftsmanship, Architectural Digest cover photo, crystal clear focus, professional real estate photography, no digital artifacts, pristine execution`;

  const stylePrompts = {
    'modern-minimalist': `flawless modern minimalist kitchen renovation with museum-quality white lacquer slab cabinets, invisible push-to-open hardware, seamless white Caesarstone quartz waterfall island, perfectly integrated Miele appliances, professional LED strip lighting, large format Porcelanosa gray tiles, brushed stainless steel fixtures, architectural millwork, natural daylight from windows, zero visible seams or joints, pristine white walls, professional staging`,
    
    'farmhouse-chic': `museum-quality farmhouse kitchen renovation with custom white painted shaker cabinets, perfectly crafted raised panel doors, honed Carrara marble countertops with book-matched veining, handcrafted white subway tile backsplash with dark grout, professional white porcelain farmhouse sink, authentic oil-rubbed bronze hardware, wide-plank white oak hardwood floors, artisan glass pendant lights, exposed wood ceiling beams, natural window light, flawless paint finish`,
    
    'transitional': `architectural firm quality transitional kitchen with custom warm gray raised panel cabinets, premium granite countertops with natural veining, sophisticated travertine backsplash, brushed nickel cup pulls, rich red oak hardwood floors with satin finish, classic pendant lighting with fabric shades, crown molding details, natural window lighting, museum-quality millwork, seamless paint finish`,
    
    'coastal-new-england': `top architectural firm coastal kitchen with museum-quality white shaker cabinets, beadboard panel details, pristine Carrara marble countertops, handcrafted sea glass subway tiles, polished chrome hardware, light oak hardwood floors with natural finish, nautical pendant lights, bright natural window light, professional white paint finish, zero imperfections, coastal elegance`,
    
    'contemporary-luxe': `$150,000 contemporary luxury kitchen by top architectural firm, high-gloss charcoal lacquer cabinets with invisible hardware, dramatic Calacatta Gold marble waterfall island with perfect book-matching, large format marble slab backsplash, brushed gold fixtures, ebony hardwood floors, crystal chandelier lighting, Sub-Zero and Wolf appliances, museum-quality execution, natural window lighting, zero artifacts`,
    
    'eclectic-bohemian': `architectural firm eclectic kitchen with custom emerald green painted lower cabinets, natural walnut upper cabinets, exotic granite countertops with natural character, handcrafted Moroccan cement tile backsplash, mixed antique brass and copper hardware, rich walnut hardwood floors, artisan pendant lights, natural window lighting, museum-quality paint finish, sophisticated global design, zero digital artifacts`
  };

  const selectedStylePrompt = stylePrompts[selectedStyle?.id] || stylePrompts['modern-minimalist'];
  
  return `${basePrompt}, ${selectedStylePrompt}, shot by professional architectural photographer, Canon EOS R5 with 24-70mm f/2.8 lens, natural window lighting only, zero post-processing artifacts, museum-quality renovation, pristine execution, seamless joints, perfect paint finish, no digital noise, crystal clear details, architectural photography standards`;
}

// Create negative prompt to avoid unwanted elements
function createNegativePrompt() {
  return `cartoon, anime, sketch, drawing, painting, illustration, text, labels, words, letters, watermark, signature, blurry, low quality, distorted, deformed, ugly, bad anatomy, extra limbs, missing parts, oversaturated, unrealistic colors, amateur photography, artificial looking, plastic appearance, overly processed, fake materials, CGI, rendered look, synthetic textures, fragmented, split image, multiple exposures, collage, patchwork, seams, visible joints, mismatched lighting, inconsistent perspective, choppy composition, layered images, composite look, digital artifacts, noise, grain, pixelated, compressed, jpeg artifacts, banding, color bleeding, haloing, ghosting, double exposure, overlay effects, filters, HDR artifacts, tone mapping artifacts, unnatural saturation, blown highlights, crushed blacks, color fringing, chromatic aberration, lens distortion, vignetting, motion blur, camera shake, out of focus areas, depth of field issues, lighting inconsistencies, shadow artifacts, reflection errors, material inconsistencies, texture mapping errors, 3D rendering artifacts, ray tracing errors, global illumination artifacts`;
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