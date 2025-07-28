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
      'Modern Minimalist': 'luxury kitchen renovation, modern minimalist design, handleless white cabinets, quartz waterfall countertops, stainless steel appliances, under-cabinet LED lighting, large format tile backsplash, hardwood floors, minimal brushed steel hardware, clean lines, professional interior photography, photorealistic, high resolution, warm lighting, detailed textures',

      'Farmhouse Chic': 'luxury kitchen renovation, modern farmhouse design, white shaker cabinets, butcher block countertops, subway tile backsplash, brass hardware, Edison bulb pendant lighting, wide plank hardwood floors, farmhouse sink, open shelving, professional interior photography, photorealistic, high resolution, warm lighting, detailed textures',

      'Contemporary Luxe': 'luxury kitchen renovation, contemporary design, navy or forest green cabinets, dramatic quartz countertops, waterfall edge, natural stone backsplash, brushed gold hardware, geometric pendant lighting, rich hardwood floors, integrated appliances, professional interior photography, photorealistic, high resolution, dramatic lighting, detailed textures',

      'Industrial Loft': 'luxury kitchen renovation, industrial loft design, dark steel cabinets, concrete countertops, exposed brick backsplash, black metal hardware, Edison bulb lighting, polished concrete floors, stainless steel appliances, urban loft aesthetic, professional interior photography, photorealistic, high resolution, dramatic lighting, detailed textures',

      'Transitional': 'luxury kitchen renovation, transitional design, raised panel cabinets, granite countertops, subway tile backsplash, brushed nickel hardware, traditional pendant lighting, hardwood floors, integrated appliances, professional interior photography, photorealistic, high resolution, warm lighting, detailed textures'
    };

    const selectedStylePrompt = stylePrompts[selectedStyle] || stylePrompts['Modern Minimalist'];

    // OPTIMIZED PROMPT FOR IMG2IMG
    const fullPrompt = `${selectedStylePrompt}${customPrompt ? `, ${customPrompt}` : ''}, interior design magazine, architectural digest style, professional photography, detailed, high quality`;

    // CRITICAL NEGATIVE PROMPT TO PREVENT SKETCHES
    const negativePrompt = 'sketch, drawing, line art, cartoon, anime, black and white, monochrome, pencil drawing, artistic interpretation, low quality, blurry, distorted, unrealistic, amateur, changing room layout, moving cabinets, moving appliances, different room structure';


    console.log('🎨 Using SDXL img2img for kitchen renovation...');

    let generationResponse;
    
    try {
      // PRIMARY: SDXL img2img with correct parameters
      generationResponse = await replicate.run(
        "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
        {
          input: {
            image: imageData,
            prompt: fullPrompt,
            negative_prompt: negativePrompt,
            strength: 0.75, // CRITICAL: 0.7-0.8 for renovations
            guidance_scale: 7.5,
            num_inference_steps: 50,
            scheduler: "DPMSolverMultistep",
            width: 1024,
            height: 1024,
            seed: Math.floor(Math.random() * 1000000)
          }
        }
      );
      console.log('✅ SDXL img2img successful');
      
    } catch (sdxlError) {
      console.log('⚠️ SDXL failed, trying backup model...');
      
      // BACKUP: Realistic Vision model
      generationResponse = await replicate.run(
        "lucataco/realistic-vision-v5:ac732df83cea7fff18b63c9068be49e3b78b2f6e7344b0b2fb8b87c6b2db43de",
        {
          input: {
            image: imageData,
            prompt: fullPrompt,
            negative_prompt: negativePrompt,
            strength: 0.8,
            guidance_scale: 7.5,
            num_inference_steps: 40,
            width: 1024,
            height: 1024,
            seed: Math.floor(Math.random() * 1000000)
          }
        }
      );
      console.log('✅ Backup model successful');
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
      generatedImageUrl: getDemoImage(roomType),
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