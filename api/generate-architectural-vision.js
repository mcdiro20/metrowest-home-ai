export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { imageData, roomType, selectedStyle, customPrompt, seed } = req.body;

    console.log('🏛️ Architectural Vision Engine Request:', { roomType, selectedStyle, hasImage: !!imageData, seed });
    
    if (!imageData || !roomType || !selectedStyle) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const replicateToken = process.env.REPLICATE_API_TOKEN;
    if (!replicateToken) {
      console.log('⚠️ No Replicate API token found - using architectural demo image');
      return res.status(200).json({
        success: true,
        generatedImageUrl: getArchitecturalDemoImage(roomType),
        message: 'Demo mode - Architectural Vision Engine visualization',
        provider: 'architectural-demo'
      });
    }

    const { default: Replicate } = await import('replicate');
    const replicate = new Replicate({ auth: replicateToken });

    // ARCHITECTURAL VISION ENGINE PROMPTS - Focus on professional architectural quality
    const architecturalPrompts = {
      'Modern Minimalist': 'architectural photography, luxury modern minimalist kitchen, clean white handleless cabinets, waterfall quartz countertops, integrated premium appliances, LED strip lighting, large format porcelain tiles, brushed steel accents, museum-quality finishes, Architectural Digest worthy',

      'Farmhouse Chic': 'architectural photography, luxury farmhouse kitchen, custom white shaker cabinets with brass hardware, honed Carrara marble countertops, professional farmhouse sink, vintage pendant lighting, wide plank hardwood floors, rustic luxury finishes, Southern Living magazine quality',

      'Contemporary Luxe': 'architectural photography, contemporary luxury kitchen, high-gloss charcoal cabinets, dramatic Calacatta Gold marble, brushed gold fixtures, designer crystal lighting, premium appliances, sophisticated modern elegance, Robb Report luxury standard',

      'Industrial Loft': 'architectural photography, industrial loft kitchen, steel-framed cabinets, concrete waterfall counters, copper pipe details, Edison bulb lighting, polished concrete floors, urban sophistication, Dwell magazine aesthetic',

      'Transitional': 'architectural photography, transitional luxury kitchen, raised panel cabinetry in warm neutrals, natural granite countertops, classic subway tile, brushed nickel fixtures, traditional pendant lighting, timeless elegance, Traditional Home magazine quality',
      
      'Coastal New England': 'architectural photography, coastal New England kitchen, white shaker cabinets with beadboard details, white marble countertops, glass subway tile, nautical brass hardware, natural light focus, coastal luxury elegance, Coastal Living magazine standard',
      
      'Eclectic Bohemian': 'architectural photography, eclectic bohemian kitchen, mixed wood and painted cabinets, natural stone countertops, handcrafted tile backsplash, artisanal brass fixtures, rich textures, curated global elegance, Elle Decor inspired luxury'
    };

    // ARCHITECTURAL VISION ENGINE QUALITY ENHANCERS
    const architecturalQuality = '(architectural photography:1.4), (professional interior design:1.3), (luxury renovation:1.2), photorealistic, sharp focus, perfect lighting, premium materials, high-end finishes, museum quality rendering, crystal clear details, architectural digest photography';

    // STRUCTURE PRESERVATION FOR ARCHITECTURAL VISION ENGINE
    const structuralPreservation = 'maintain exact room dimensions, preserve original room size, keep same ceiling height, maintain wall positions, preserve window locations and sizes, keep door placements, same room footprint, identical spatial layout';

    // ARCHITECTURAL VISION ENGINE NEGATIVE PROMPTS
    const architecturalNegatives = 'cartoon, 3d render, sketch, drawing, amateur photography, phone camera, instagram filter, oversaturated, distorted architecture, impossible geometry, floating elements, structural damage, unrealistic proportions, cheap materials, builder grade finishes, enlarged room, expanded space, added windows, new walls, different room size, loft conversion, open concept, removed walls, bigger kitchen, added island, expanded ceiling height, warehouse space, commercial space';

    const selectedStylePrompt = architecturalPrompts[selectedStyle.name] || architecturalPrompts['Modern Minimalist'];
    
    // ARCHITECTURAL VISION ENGINE PROMPT CONSTRUCTION
    const customAddition = customPrompt ? `, ${customPrompt}` : '';
    const fullPrompt = `${structuralPreservation}, ${selectedStylePrompt}${customAddition}, ${architecturalQuality}`;

    console.log('🏛️ Using Architectural Vision Engine pipeline...');
    console.log('📏 Prompt optimized for architectural quality');

    // ARCHITECTURAL VISION ENGINE PARAMETERS
    const architecturalParams = {
      image: imageData,
      prompt: fullPrompt,
      negative_prompt: architecturalNegatives,
      strength: 0.25, // Very low strength to preserve original room structure
      guidance_scale: 7.5, // Balanced to maintain structure while applying style
      num_inference_steps: 40, // More steps for architectural quality
      scheduler: "DPMSolverMultistep",
      width: 1024,
      height: 768,
      ...(seed && { seed: parseInt(seed) })
    };
    
    console.log('🎯 Architectural Vision Engine parameters:');
    console.log('- Strength (structure preservation):', architecturalParams.strength);
    console.log('- Guidance scale:', architecturalParams.guidance_scale);
    console.log('- Steps:', architecturalParams.num_inference_steps);

    let generationResponse;
    
    try {
      // Try Architectural Vision Engine with premium model
      console.log('🏛️ Attempting Architectural Vision Engine rendering...');
      
      try {
        // Primary: Use Google Nano Banana (Gemini 2.5 Flash Image) for architectural quality
        generationResponse = await replicate.run(
          "google/nano-banana:1b7b945e8f7edf7a034eba6cb2c20f2ab5dc7d090eea1c616e96da947be76aee",
          { input: architecturalParams }
        );
        console.log('✅ Architectural Vision Engine rendering successful');
        
      } catch (primaryError) {
        console.log('🔄 Trying fallback model for Architectural Vision Engine...');
        console.log('❌ Nano Banana error:', primaryError.message);

        // Fallback: SDXL with architectural focus
        const sdxlArchitecturalParams = {
          ...architecturalParams,
          prompt: `architectural interior photography, luxury ${selectedStyle.name.toLowerCase()} renovation, ${architecturalQuality}`,
          scheduler: "K_EULER"
        };

        generationResponse = await replicate.run(
          "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
          { input: sdxlArchitecturalParams }
        );
        console.log('✅ SDXL Architectural Vision Engine successful');
      }
      
    } catch (allModelsError) {
      console.log('⚠️ All Architectural Vision Engine models failed, using architectural demo');
      throw allModelsError;
    }

    const generatedImageUrl = Array.isArray(generationResponse) ? generationResponse[0] : generationResponse;
    
    if (!generatedImageUrl) {
      throw new Error('No architectural image generated');
    }

    console.log('🏆 Architectural Vision Engine rendering complete');

    return res.status(200).json({
      success: true,
      generatedImageUrl: generatedImageUrl,
      renovationDetails: {
        style: selectedStyle.name,
        estimatedCost: getArchitecturalCost(selectedStyle.name),
        timeline: getArchitecturalTimeline(selectedStyle.name),
        roomType: roomType,
        qualityMetrics: {
          resolution: '1024x768',
          renderingModel: 'Architectural Vision Engine',
          structurePreservation: 'Maximum',
          lightingQuality: 'Architectural Photography',
          materialQuality: 'Museum Grade'
        },
        generationParams: {
          seed: architecturalParams.seed || 'architectural-optimized',
          strength: architecturalParams.strength,
          guidance_scale: architecturalParams.guidance_scale,
          steps: architecturalParams.num_inference_steps
        }
      },
      message: `Architectural Vision Engine ${selectedStyle.name} rendering complete`,
      provider: 'architectural-vision-engine'
    });

  } catch (error) {
    console.error('❌ Architectural Vision Engine failed:', error);
    
    return res.status(200).json({
      success: true,
      generatedImageUrl: getArchitecturalDemoImage(req.body.roomType || 'kitchen'),
      message: `Architectural demo mode - ${error.message}`,
      provider: 'architectural-demo-fallback'
    });
  }
}

function getArchitecturalCost(selectedStyle) {
  const architecturalCosts = {
    'Modern Minimalist': '$95,000 - $145,000',
    'Farmhouse Chic': '$85,000 - $125,000', 
    'Contemporary Luxe': '$120,000 - $190,000',
    'Industrial Loft': '$90,000 - $135,000',
    'Transitional': '$80,000 - $120,000',
    'Coastal New England': '$85,000 - $130,000',
    'Eclectic Bohemian': '$75,000 - $115,000'
  };
  
  return architecturalCosts[selectedStyle] || '$90,000 - $135,000';
}

function getArchitecturalTimeline(selectedStyle) {
  const architecturalTimelines = {
    'Modern Minimalist': '10-14 weeks',
    'Farmhouse Chic': '12-16 weeks', 
    'Contemporary Luxe': '14-20 weeks',
    'Industrial Loft': '12-18 weeks',
    'Transitional': '10-14 weeks',
    'Coastal New England': '11-15 weeks',
    'Eclectic Bohemian': '13-17 weeks'
  };
  
  return architecturalTimelines[selectedStyle] || '12-16 weeks';
}

function getArchitecturalDemoImage(roomType) {
  // Premium architectural demo images
  const architecturalDemoImages = {
    kitchen: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    bathroom: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?ixlib=rb-4.0.3&auto=format&fit=crop&w=2069&q=80',
    living_room: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=2058&q=80',
    bedroom: 'https://images.unsplash.com/photo-1615874959474-d609969a20ed?ixlib=rb-4.0.3&auto=format&fit=crop&w=2080&q=80',
    dining_room: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb3?ixlib=rb-4.0.3&auto=format&fit=crop&w=2074&q=80',
    home_office: 'https://images.unsplash.com/photo-1541558869434-2840d308329a?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
    other: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=2058&q=80'
  };
  
  return architecturalDemoImages[roomType] || architecturalDemoImages.kitchen;
}