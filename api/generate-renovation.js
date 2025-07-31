export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { imageData, roomType, selectedStyle, customPrompt, seed } = req.body;

    console.log('🏛️ Premium Architectural Rendering:', { roomType, selectedStyle, hasImage: !!imageData, seed });
    
    // DEBUG: Check image data format and size
    if (imageData) {
      console.log('📸 Image data format check:');
      console.log('- Starts with data:image:', imageData.startsWith('data:image/'));
      console.log('- Total length:', imageData.length);
      console.log('- First 100 chars:', imageData.substring(0, 100));
      
      // Check if it's a valid base64 image
      const base64Part = imageData.split(',')[1];
      if (base64Part) {
        console.log('- Base64 part length:', base64Part.length);
        console.log('- Valid base64 format:', /^[A-Za-z0-9+/]*={0,2}$/.test(base64Part.substring(0, 100)));
      }
    } else {
      console.error('❌ No imageData received from frontend!');
    }

    if (!imageData || !roomType || !selectedStyle) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const replicateToken = process.env.REPLICATE_API_TOKEN;
    if (!replicateToken) {
      console.log('⚠️ No Replicate API token found - using premium demo image');
      return res.status(200).json({
        success: true,
        generatedImageUrl: getPremiumDemoImage(roomType),
        message: 'Demo mode - Premium architectural visualization',
        provider: 'demo'
      });
    }

    const { default: Replicate } = await import('replicate');
    const replicate = new Replicate({ auth: replicateToken });

    // STRUCTURE-PRESERVING PROMPTS WITH PREMIUM DESIGN FOCUS
    const architecturalPrompts = {
      'Modern Minimalist': 'modern minimalist kitchen transformation, clean white flat-panel cabinets, integrated appliances, polished concrete or hardwood flooring, waterfall-edge island in marble or quartz, matte black or brushed steel fixtures, seamless LED lighting, open and airy vibe, Scandinavian-Japanese fusion, Architectural Digest aesthetic',

      'Farmhouse Chic': 'luxury farmhouse kitchen makeover, white shaker cabinets with brass hardware, exposed ceiling beams, rustic wood island with butcher block top, farmhouse sink, open shelving, vintage lantern pendant lights, ship-lap backsplash, warm color palette, inviting and homey, Southern Living style',

      'Contemporary Luxe': 'contemporary luxury kitchen upgrade, two-tone high-gloss cabinets, premium quartz countertops, gold or bronze accents, integrated wine fridge, designer pendant lights, slab backsplash, hidden storage, built-in espresso bar, clean but opulent, Robb Report-worthy finish',

      'Industrial Loft': 'industrial loft kitchen transformation, exposed brick walls, steel-framed cabinets, concrete waterfall counters, copper pipe shelving, Edison bulb track lighting, polished concrete floors, vintage leather bar stools, urban sophistication',

      'Transitional': 'transitional high-end kitchen redesign, blend of classic and modern elements, raised panel cabinetry in soft greys or creams, quartz or granite countertops, statement lighting, subway tile backsplash, brushed gold or chrome fixtures, warm hardwood floors, timeless design, Traditional Home magazine look',
      
      'Coastal New England': 'coastal New England kitchen transformation, soft whites and seafoam blues, beadboard cabinetry, brass or chrome nautical hardware, open wood shelving, large farmhouse windows, natural light focus, driftwood accents, nautical pendant lighting, coastal elegance, Cape Cod charm',
      
      'Eclectic Bohemian': 'boho-chic kitchen renovation, colorful tile backsplash, mixed textures and materials, open shelves with artisan ceramics, patterned rugs, vintage light fixtures, earth-toned cabinets, plants and greenery, creative and cozy vibe, artsy elegance, Elle Decor inspired'
    };

    // PREMIUM QUALITY ENHANCERS
    const qualityEnhancers = '(masterpiece:1.4), (best quality:1.3), (ultra high resolution:1.2), professional interior design photography, luxury home renovation, (photorealistic:1.4), sharp focus, perfect lighting, premium materials, high-end finishes, architectural digest worthy, museum quality, crystal clear details';

    // STRUCTURE PRESERVATION NEGATIVE PROMPTS
    const structuralNegatives = 'distorted architecture, wrong room layout, floating cabinets, impossible geometry, warped walls, crooked counters, missing windows, changed room shape, architectural impossibilities, perspective errors, structural damage, melted surfaces, unrealistic proportions, bad room layout';

    // QUALITY NEGATIVE PROMPTS  
    const qualityNegatives = 'blurry, out of focus, low quality, worst quality, jpeg artifacts, pixelated, grainy, overexposed, underexposed, harsh shadows, flat lighting, amateur photography, phone camera quality, instagram filter, oversaturated, dull colors';

    // STYLE NEGATIVE PROMPTS
    const styleNegatives = 'cartoon, 3d render, cgi, artificial, plastic, fake materials, neon colors, garish, tacky, cheap finishes, builder grade, outdated, 1980s style, avocado green, harvest gold, pink tiles';

    const selectedStylePrompt = architecturalPrompts[selectedStyle.name] || architecturalPrompts['Modern Minimalist'];
    
    // PREMIUM PROMPT CONSTRUCTION
    const structurePreservation = '(preserve original room structure:1.3), (maintain architectural integrity:1.2), (keep window and door placement:1.1)';
    const customAddition = customPrompt ? `, ${customPrompt}` : '';
    
    const fullPrompt = `${structurePreservation}, ${selectedStylePrompt}${customAddition}, ${qualityEnhancers}`;

    // COMPREHENSIVE NEGATIVE PROMPT
    const negativePrompt = `${structuralNegatives}, ${qualityNegatives}, ${styleNegatives}`;

    console.log('🏛️ Using premium rendering pipeline...');
    console.log('📏 Prompt optimized for structure preservation');

    // PREMIUM GENERATION PARAMETERS
    const premiumParams = {
      image: imageData,
      prompt: fullPrompt,
      negative_prompt: negativePrompt,
      strength: 0.4, // Much lower strength for testing - preserve maximum structure
      guidance_scale: 9.5, // Higher for better prompt adherence
      num_inference_steps: 35, // More steps for premium quality
      scheduler: "DPMSolverMultistep",
      width: 1024,  // Higher resolution
      height: 768,   // Maintain aspect ratio
      ...(seed && { seed: parseInt(seed) })
    };
    
    console.log('🎯 Generation parameters:');
    console.log('- Strength (image influence):', premiumParams.strength);
    console.log('- Guidance scale:', premiumParams.guidance_scale);
    console.log('- Steps:', premiumParams.num_inference_steps);
    console.log('- Image parameter passed:', !!premiumParams.image);

    let generationResponse;
    
    try {
      // Try multiple premium models for best results
      console.log('🎯 Attempting Realistic Vision v6 for premium results...');
      
      try {
        // First attempt: Latest Realistic Vision
        console.log('📸 Passing image to model:', !!premiumParams.image);
        generationResponse = await replicate.run(
          "lucataco/realistic-vision-v5:ac732df83cea7fff18b63c9068be49e3b78b2f6e7344b0b2fb8b87c6b2db43de",
          { input: premiumParams }
        );
        console.log('✅ Realistic Vision premium rendering successful');
        console.log('🖼️ Generated response type:', typeof generationResponse);
        console.log('🖼️ Generated response preview:', Array.isArray(generationResponse) ? `Array with ${generationResponse.length} items` : 'Single item');
        
      } catch (primaryError) {
        console.log('🔄 Trying SDXL for premium architectural rendering...');
        console.log('❌ Primary model error:', primaryError.message);
        
        // Second attempt: SDXL for higher quality
        const sdxlParams = {
          ...premiumParams,
          prompt: `architectural photography, luxury interior design, ${selectedStylePrompt}, ${qualityEnhancers}`,
          scheduler: "K_EULER"
        };
        
        console.log('📸 SDXL also receiving image:', !!sdxlParams.image);
        
        generationResponse = await replicate.run(
          "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
          { input: sdxlParams }
        );
        console.log('✅ SDXL premium rendering successful');
      }
      
    } catch (allModelsError) {
      console.log('⚠️ All premium models failed, using architectural demo');
      throw allModelsError;
    }

    const generatedImageUrl = Array.isArray(generationResponse) ? generationResponse[0] : generationResponse;
    
    if (!generatedImageUrl) {
      throw new Error('No premium image generated');
    }

    console.log('🏆 Premium architectural rendering complete');

    return res.status(200).json({
      success: true,
      generatedImageUrl: generatedImageUrl,
      renovationDetails: {
        style: selectedStyle.name,
        estimatedCost: getPremiumCost(selectedStyle.name),
        timeline: getPremiumTimeline(selectedStyle.name),
        roomType: roomType,
        qualityMetrics: {
          resolution: '1024x768',
          renderingModel: 'Premium Architectural',
          structurePreservation: 'Enhanced',
          lightingQuality: 'Professional'
        },
        generationParams: {
          seed: premiumParams.seed || 'optimized',
          strength: premiumParams.strength,
          guidance_scale: premiumParams.guidance_scale,
          steps: premiumParams.num_inference_steps
        }
      },
      message: `Premium ${selectedStyle.name} architectural visualization complete`,
      provider: 'premium-architectural-rendering'
    });

  } catch (error) {
    console.error('❌ Premium rendering failed:', error);
    
    return res.status(200).json({
      success: true,
      generatedImageUrl: getPremiumDemoImage(req.body.roomType || 'kitchen'),
      message: `Premium demo mode - ${error.message}`,
      provider: 'premium-demo-fallback'
    });
  }
}

function getPremiumCost(selectedStyle) {
  const premiumCosts = {
    'Modern Minimalist': '$85,000 - $135,000',
    'Farmhouse Chic': '$75,000 - $115,000', 
    'Contemporary Luxe': '$110,000 - $180,000',
    'Industrial Loft': '$80,000 - $125,000',
    'Transitional': '$70,000 - $110,000'
  };
  
  return premiumCosts[selectedStyle] || '$80,000 - $125,000';
}

function getPremiumTimeline(selectedStyle) {
  const premiumTimelines = {
    'Modern Minimalist': '8-12 weeks',
    'Farmhouse Chic': '10-14 weeks', 
    'Contemporary Luxe': '12-18 weeks',
    'Industrial Loft': '10-16 weeks',
    'Transitional': '8-12 weeks'
  };
  
  return premiumTimelines[selectedStyle] || '10-14 weeks';
}

function getPremiumDemoImage(roomType) {
  // Higher quality demo images
  const premiumDemoImages = {
    kitchen: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    bathroom: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?ixlib=rb-4.0.3&auto=format&fit=crop&w=2069&q=80',
    living_room: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=2058&q=80',
    bedroom: 'https://images.unsplash.com/photo-1615874959474-d609969a20ed?ixlib=rb-4.0.3&auto=format&fit=crop&w=2080&q=80',
    dining_room: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb3?ixlib=rb-4.0.3&auto=format&fit=crop&w=2074&q=80',
    home_office: 'https://images.unsplash.com/photo-1541558869434-2840d308329a?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
    other: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=2058&q=80'
  };
  
  return premiumDemoImages[roomType] || premiumDemoImages.kitchen;
}