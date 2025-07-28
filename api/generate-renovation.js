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
      console.log('⚠️ No Replicate API token found - using demo image');
      return res.status(200).json({
        success: true,
        generatedImageUrl: getDemoImage(roomType),
        message: 'Demo mode - Replicate API token not configured',
        provider: 'demo'
      });
    }

    const { default: Replicate } = await import('replicate');
    const replicate = new Replicate({ auth: replicateToken });

    // OPTIMIZED IMG2IMG PROMPTS FOR KITCHEN RENOVATION
    const stylePrompts = {
      'Modern Minimalist': 'upgrade existing cabinets to modern handleless white style, replace countertops with white quartz waterfall edge, stainless steel appliances, under-cabinet LED lighting, large format tile backsplash, hardwood floors, minimal brushed steel hardware, clean lines',

      'Farmhouse Chic': 'upgrade existing cabinets to white shaker style, replace countertops with butcher block, white subway tile backsplash, brass hardware, Edison bulb pendant lighting, wide plank hardwood floors, farmhouse sink, open shelving',

      'Contemporary Luxe': 'upgrade existing cabinets to navy or forest green style, replace countertops with dramatic quartz waterfall edge, natural stone backsplash, brushed gold hardware, geometric pendant lighting, rich hardwood floors, integrated appliances',

      'Industrial Loft': 'upgrade existing cabinets to dark steel style, replace countertops with concrete, exposed brick backsplash, black metal hardware, Edison bulb lighting, polished concrete floors, stainless steel appliances, urban loft aesthetic',

      'Transitional': 'upgrade existing cabinets to raised panel style, replace countertops with granite, subway tile backsplash, brushed nickel hardware, traditional pendant lighting, hardwood floors, integrated appliances'
    };

    const selectedStylePrompt = stylePrompts[selectedStyle] || stylePrompts['Modern Minimalist'];

    // OPTIMIZED PROMPT FOR IMG2IMG
    const fullPrompt = `luxury kitchen renovation keeping exact same layout and room shape, ${selectedStylePrompt}${customPrompt ? `, ${customPrompt}` : ''}, preserve window and door placement, same room dimensions, interior design magazine quality, photorealistic, high resolution, warm lighting`;

    // CRITICAL NEGATIVE PROMPT TO PREVENT SKETCHES
    const negativePrompt = 'sketch, drawing, line art, cartoon, anime, black and white, monochrome, pencil drawing, artistic interpretation, low quality, blurry, distorted, unrealistic, amateur, different layout, moved walls, changed room shape, relocated windows, architectural changes';


    console.log('🎨 Using SDXL img2img for kitchen renovation...');

    let generationResponse;
    
    try {
      // PRIMARY: SDXL img2img with correct model version
      generationResponse = await replicate.run(
        "stability-ai/stable-diffusion:db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf",
        {
          input: {
            image: imageData,
            prompt: fullPrompt,
            negative_prompt: negativePrompt,
            strength: 0.45,
            guidance_scale: 7.5,
            num_inference_steps: 50,
            scheduler: "DPMSolverMultistep"
          }
        }
      );
      console.log('✅ SDXL img2img successful');
      
    } catch (sdxlError) {
      console.log('⚠️ SDXL failed, trying backup model...');
      
      try {
        // BACKUP: Try a different working model
        generationResponse = await replicate.run(
          "tencentarc/photomaker:ddfc2b08d209f9fa8c1eca692712918bd449f695dabb4a958da31802a9570fe4",
          {
            input: {
              input_image: imageData,
              prompt: fullPrompt,
              negative_prompt: negativePrompt,
              num_steps: 50,
              style_strength_ratio: 20,
              num_outputs: 1
            }
          }
        );
        console.log('✅ Backup model successful');
      } catch (backupError) {
        console.log('⚠️ Backup model also failed, using demo image');
        throw backupError;
      }
    }

    const generatedImageUrl = Array.isArray(generationResponse) ? generationResponse[0] : generationResponse;
    
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
      provider: 'replicate-sdxl-img2img'
    });

  } catch (error) {
    console.error('❌ Renovation failed:', error);
    
    // Fallback to demo image
    return res.status(200).json({
      success: true,
      generatedImageUrl: getDemoImage(req.body.roomType || 'kitchen'),
      message: `Demo mode - ${error.message}`,
      provider: 'demo-fallback'
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