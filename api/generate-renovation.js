export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { imageData, roomType, selectedStyle, customPrompt } = req.body;

    console.log('🏠 Professional Kitchen Renovation:', { roomType, selectedStyle, hasImage: !!imageData });

    if (!imageData || !roomType || !selectedStyle) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const replicateToken = process.env.REPLICATE_API_TOKEN;
    if (!replicateToken) {
      return res.status(500).json({ error: 'REPLICATE_API_TOKEN not configured' });
    }

    const { default: Replicate } = await import('replicate');
    const replicate = new Replicate({ auth: replicateToken });

    // PROFESSIONAL PROMPT ENGINEERING
    const stylePrompts = {
      'Modern Minimalist': `Transform this kitchen into a stunning, photorealistic architectural rendering of a luxury modern minimalist renovation. Create a professional interior design visualization with:

VISUAL QUALITY: Photorealistic 3D rendering quality with ray-traced lighting, professional architectural visualization style, 8K ultra-high resolution detail, perfect perspective matching original layout, cinematic lighting with natural daylight, soft shadows and realistic material reflections.

DESIGN ELEMENTS: Premium white or charcoal quartz countertops with waterfall edges, handleless flat-panel cabinetry in matte white or warm charcoal, brushed stainless steel or matte black hardware, large format porcelain tile backsplash, hardwood flooring in rich contemporary tones, geometric pendant lighting with warm LED, integrated premium appliances, fresh greenery in modern planters.

LIGHTING & ATMOSPHERE: Warm ambient lighting (2700K-3000K), layered lighting with under-cabinet LED strips, natural daylight filtering through windows, professional photographer-quality setup, golden hour lighting, subtle depth of field effects.

STYLING DETAILS: Clean uncluttered surfaces, high-end small appliances, coordinated neutral palette, luxury textiles, elegant accessories. Generate as if it were a $5,000 professional architectural rendering featured in Architectural Digest.`,

      'Farmhouse Chic': `Transform this kitchen into a breathtaking, photorealistic architectural rendering of an elegant modern farmhouse renovation. Create a professional interior design visualization with:

VISUAL QUALITY: Photorealistic 3D rendering quality with ray-traced lighting, professional architectural visualization style, 8K ultra-high resolution detail, perfect perspective matching original layout, warm cinematic lighting, soft shadows and realistic wood grain textures.

DESIGN ELEMENTS: Premium butcher block or honed marble countertops, custom white or sage green shaker-style cabinetry, vintage brass or matte black hardware, subway tile or natural stone backsplash with perfect grout lines, wide plank hardwood flooring in natural oak, pendant lighting with Edison bulbs or lantern styles, farmhouse sink, open shelving with rustic wood, fresh flowers and herbs.

LIGHTING & ATMOSPHERE: Warm inviting ambient lighting, natural daylight streaming through windows, professional interior photography lighting, golden hour warmth, cozy yet sophisticated atmosphere.

STYLING DETAILS: Fresh greenery, woven baskets, vintage-inspired accessories, coordinated warm color palette, luxury linen textiles. Generate as if it were a $5,000 professional architectural rendering featured in Better Homes & Gardens.`,

      'Contemporary Luxe': `Transform this kitchen into a stunning, photorealistic architectural rendering of a luxury contemporary renovation. Create a professional interior design visualization with:

VISUAL QUALITY: Photorealistic 3D rendering quality with ray-traced lighting, professional architectural visualization style, 8K ultra-high resolution detail, perfect perspective matching original layout, dramatic cinematic lighting, soft shadows and realistic material reflections.

DESIGN ELEMENTS: Premium natural stone or dramatic quartz countertops with waterfall edges, custom cabinetry in navy, forest green, or rich walnut, brushed gold or matte black premium hardware, natural stone or glass tile backsplash, hardwood flooring in rich contemporary tones, statement pendant lighting with geometric designs, integrated luxury appliances, fresh orchids or elegant styling.

LIGHTING & ATMOSPHERE: Sophisticated ambient lighting with warm undertones, layered lighting design, natural daylight with dramatic shadows, professional architectural photography lighting, subtle lens flares.

STYLING DETAILS: High-end accessories, designer coffee table books, luxury small appliances, coordinated sophisticated palette, premium textiles. Generate as if it were a $5,000 professional architectural rendering featured in Architectural Digest luxury edition.`,

      'Industrial Loft': `Transform this kitchen into a stunning, photorealistic architectural rendering of a luxury industrial loft renovation. Create a professional interior design visualization with:

VISUAL QUALITY: Photorealistic 3D rendering quality with ray-traced lighting, professional architectural visualization style, 8K ultra-high resolution detail, perfect perspective matching original layout, dramatic moody lighting, realistic metal and concrete textures.

DESIGN ELEMENTS: Premium concrete or butcher block countertops, custom steel-framed or charcoal cabinetry, black metal fixtures and hardware, exposed brick or metal tile backsplash, polished concrete or reclaimed wood flooring, Edison bulb pendant lighting, stainless steel appliances, raw steel accents, industrial-chic accessories.

LIGHTING & ATMOSPHERE: Dramatic mood lighting with warm industrial fixtures, natural light filtering through large windows, professional architectural photography style, urban loft aesthetic with sophisticated edge.

STYLING DETAILS: Curated industrial accessories, vintage elements, coordinated urban palette, luxury industrial textiles. Generate as if it were a $5,000 professional architectural rendering featured in a luxury loft design magazine.`,

      'Transitional': `Transform this kitchen into a stunning, photorealistic architectural rendering of a luxury transitional renovation. Create a professional interior design visualization with:

VISUAL QUALITY: Photorealistic 3D rendering quality with ray-traced lighting, professional architectural visualization style, 8K ultra-high resolution detail, perfect perspective matching original layout, balanced natural lighting, soft shadows and realistic material textures.

DESIGN ELEMENTS: Premium granite or marble countertops, custom raised panel or shaker cabinetry in warm neutrals, brushed nickel or champagne bronze hardware, classic subway tile or natural stone backsplash, hardwood flooring in medium tones, traditional pendant or chandelier lighting, seamlessly integrated appliances, fresh flowers and classic styling.

LIGHTING & ATMOSPHERE: Warm balanced lighting combining traditional and contemporary elements, natural daylight with professional interior photography quality, timeless sophisticated atmosphere.

STYLING DETAILS: Classic accessories with modern touches, coordinated neutral palette, luxury traditional textiles, elegant styling. Generate as if it were a $5,000 professional architectural rendering featured in Traditional Home magazine.`
    };

    const selectedStylePrompt = stylePrompts[selectedStyle] || stylePrompts['Modern Minimalist'];

    // LAYOUT PRESERVATION PROMPT (CRITICAL)
    const layoutPrompt = `CRITICAL LAYOUT PRESERVATION: Maintain exact room dimensions and window/door placement from original. Keep all cabinets, appliances, windows, doors, and architectural elements in their exact same positions and sizes. Only transform surface finishes, colors, materials, and decorative elements. Preserve original perspective and camera angle.`;

    const fullPrompt = `${layoutPrompt}

${selectedStylePrompt}

${customPrompt ? `ADDITIONAL CUSTOM REQUIREMENTS: ${customPrompt}` : ''}

TECHNICAL SPECIFICATIONS: Maintain exact room dimensions, professional interior design magazine quality, sharp focus on all elements, color-balanced with rich saturated natural tones, no visible flaws or imperfections.

FORBIDDEN ELEMENTS: No outdated fixtures, no cluttered surfaces, no harsh fluorescent lighting, no visible wear or damage, no amateur photography lighting, no unrealistic proportions.`;

    const negativePrompt = 'changing room layout, moving cabinets, moving appliances, different room structure, relocating windows or doors, adding or removing architectural elements, blurry, low quality, distorted, unrealistic, cartoon, text overlay, watermarks, amateur photography, poor lighting, cluttered, messy, outdated fixtures, harsh fluorescent lighting, visible wear, damage, imperfections, unrealistic proportions, sketchy, drawn, illustration';

    console.log('🎨 Using ControlNet for layout preservation...');

    let generationResponse;
    
    try {
      // PRIMARY: ControlNet Canny for layout preservation
      generationResponse = await replicate.run(
        "jagilley/controlnet-canny:aff48af9c68d162388d230a2ab003f68d2638d88307bdaf1c2f1ac95079c9613",
        {
          input: {
            image: imageData,
            prompt: fullPrompt,
            negative_prompt: negativePrompt,
            num_inference_steps: 50,
            guidance_scale: 12,
            controlnet_conditioning_scale: 0.95,
            seed: Math.floor(Math.random() * 1000000)
          }
        }
      );
      console.log('✅ ControlNet successful');
      
    } catch (controlnetError) {
      console.log('⚠️ ControlNet failed, trying backup...');
      
      // BACKUP: High-quality img2img
      generationResponse = await replicate.run(
        "stability-ai/stable-diffusion:27b93a2413e7f36cd83da926f3656280b2931564ff050bf9575f1fdf9bcd7478",
        {
          input: {
            init_image: imageData,
            prompt: fullPrompt,
            negative_prompt: negativePrompt,
            num_inference_steps: 50,
            guidance_scale: 10,
            strength: 0.75,
            seed: Math.floor(Math.random() * 1000000)
          }
        }
      );
      console.log('✅ Backup model successful');
    }

    const generatedImageUrl = generationResponse[0];
    
    if (!generatedImageUrl) {
      throw new Error('No image generated');
    }

    console.log('✅ Professional kitchen renovation complete');

    return res.status(200).json({
      success: true,
      generatedImageUrl: generatedImageUrl,
      renovationDetails: {
        style: selectedStyle,
        estimatedCost: getEstimatedCost(selectedStyle),
        timeline: '8-12 weeks',
        roomType: roomType
      },
      message: `Professional ${selectedStyle} kitchen renovation complete`,
      provider: 'replicate-controlnet'
    });

  } catch (error) {
    console.error('❌ Renovation failed:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      message: 'Professional renovation generation failed'
    });
  }
}

function getEstimatedCost(selectedStyle) {
  const costRanges = {
    'Modern Minimalist': '$75,000 - $120,000',
    'Farmhouse Chic': '$65,000 - $95,000', 
    'Contemporary Luxe': '$90,000 - $150,000',
    'Industrial Loft': '$70,000 - $110,000',
    'Transitional': '$60,000 - $90,000'
  };
  
  return costRanges[selectedStyle] || '$65,000 - $100,000';
}