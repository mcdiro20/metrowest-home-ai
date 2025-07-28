export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { imageData, roomType, selectedStyle, customPrompt } = req.body;

    console.log('📸 Photorealistic Kitchen Renovation:', { roomType, selectedStyle, hasImage: !!imageData });

    if (!imageData || !roomType || !selectedStyle) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const replicateToken = process.env.REPLICATE_API_TOKEN;
    if (!replicateToken) {
      console.log('⚠️ No Replicate API token found - using photorealistic demo image');
      return res.status(200).json({
        success: true,
        generatedImageUrl: getDemoImage(roomType),
        message: 'Demo mode - Photorealistic renovation simulation',
        provider: 'demo'
      });
    }

    const { default: Replicate } = await import('replicate');
    const replicate = new Replicate({ auth: replicateToken });

    // PHOTOREALISTIC PHOTOGRAPHY-FOCUSED PROMPTS
    const stylePrompts = {
      'Modern Minimalist': 'professional real estate photography of modern minimalist kitchen renovation, Canon 5D Mark IV, natural lighting, white handleless cabinets, quartz waterfall countertops, stainless appliances, architectural photography, Better Homes and Gardens magazine quality',

      'Farmhouse Chic': 'interior design photography of farmhouse chic kitchen, DSLR camera shot, natural window lighting, white shaker cabinets, butcher block counters, subway tile, brass hardware, architectural digest style, real photograph not CGI',

      'Contemporary Luxe': 'luxury kitchen renovation photography, professional photographer lighting, navy cabinets, dramatic quartz countertops, gold hardware, geometric pendants, magazine quality interior design, photojournalism style',

      'Industrial Loft': 'architectural photography of industrial loft kitchen, Canon DSLR, natural lighting, steel cabinets, concrete counters, exposed brick, Edison bulbs, urban renovation photography, real estate portfolio quality',

      'Transitional': 'professional interior photography, transitional kitchen renovation, raised panel cabinets, granite counters, subway tile, nickel hardware, traditional lighting, architectural photography, home magazine quality'
    };

    const selectedStylePrompt = stylePrompts[selectedStyle] || stylePrompts['Modern Minimalist'];

    // HYPER-FOCUSED PHOTOREALISM PROMPT
    const fullPrompt = `${selectedStylePrompt}${customPrompt ? `, ${customPrompt}` : ''}, professional real estate photography, luxury kitchen renovation, photorealistic, Canon 5D Mark IV, architectural photography, natural lighting, Better Homes and Gardens magazine, interior design portfolio, real photo not rendered, actual kitchen, high-end renovation, realistic materials and textures`;

    // ANTI-CARTOON/3D RENDER NEGATIVE PROMPT
    const negativePrompt = '3d render, cartoon, animated, cgi, computer graphics, fake, artificial, plastic, toy-like, game engine, unreal engine, blender render, 3d model, synthetic, digital art, illustration, drawing, sketch, unrealistic lighting, oversaturated, neon, glowing, video game, anime, rendered, not real, virtual, yellow cabinets, bright colors, fluorescent';


    console.log('📸 Using Realistic Vision v5 for photorealistic renovation...');

    let generationResponse;
    
    try {
      // PRIMARY: Realistic Vision v5 for photorealistic results
      generationResponse = await replicate.run(
        "lucataco/realistic-vision-v5:ac732df83cea7fff18b63c9068be49e3b78b2f6e7344b0b2fb8b87c6b2db43de",
        {
          input: {
            image: imageData,
            prompt: fullPrompt,
            negative_prompt: negativePrompt,
            strength: 0.6, // Higher for dramatic change from yellow
            guidance_scale: 7.0,
            scheduler: "K_EULER_ANCESTRAL"
          }
        }
      );
      console.log('✅ Realistic Vision photorealistic renovation successful');
      
    } catch (realisticError) {
      console.log('⚠️ Realistic Vision failed, trying Stable Diffusion backup...');
      
      try {
        // BACKUP: Stable Diffusion with photorealistic focus
        generationResponse = await replicate.run(
          "stability-ai/stable-diffusion:27b93a2413e7f36cd83da926f3656280b2931564ff050bf9575f1fdf9bcd7478",
          {
            input: {
              image: imageData,
              prompt: `interior design photography, professional kitchen renovation, shot with DSLR camera, natural window lighting, architectural digest magazine quality, real photograph not CGI, luxury home renovation, photojournalism style, realistic materials, actual kitchen space, ${selectedStylePrompt}`,
              negative_prompt: negativePrompt,
              strength: 0.65, // Moderate strength for backup
              guidance_scale: 7.5,
              num_inference_steps: 75,
              scheduler: "DPMSolverMultistep"
            }
          }
        );
        console.log('✅ Stable Diffusion photorealistic backup successful');
      } catch (backupError) {
        console.log('⚠️ All photorealistic models failed, using demo image');
        throw backupError;
      }
    }

    const generatedImageUrl = Array.isArray(generationResponse) ? generationResponse[0] : generationResponse;
    
    if (!generatedImageUrl) {
      throw new Error('No image generated');
    }

    console.log('✅ Photorealistic kitchen renovation complete');

    return res.status(200).json({
      success: true,
      generatedImageUrl: generatedImageUrl,
      renovationDetails: {
        style: selectedStyle,
        estimatedCost: getEstimatedCost(selectedStyle),
        timeline: '8-12 weeks',
        roomType: roomType
      },
      message: `Photorealistic ${selectedStyle} kitchen renovation complete`,
      provider: 'replicate-realistic-vision-v5'
    });

  } catch (error) {
    console.error('❌ Photorealistic renovation failed:', error);
    
    // Fallback to photorealistic demo image
    return res.status(200).json({
      success: true,
      generatedImageUrl: getDemoImage(req.body.roomType || 'kitchen'),
      message: `Photorealistic demo mode - ${error.message}`,
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