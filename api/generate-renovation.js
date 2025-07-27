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
      'Modern Minimalist': 'Ultra-modern kitchen interior design, handleless flat-panel cabinets in matte white or charcoal, quartz waterfall countertops, integrated premium appliances, under-cabinet LED strip lighting, large format porcelain tile backsplash, polished concrete floors, minimal hardware in brushed stainless steel, clean geometric lines, neutral color palette, professional architectural photography, award-winning interior design',
      'Farmhouse Chic': 'Elegant farmhouse kitchen design, white or sage green shaker-style cabinets, natural butcher block or marble countertops, subway tile or natural stone backsplash, vintage brass or matte black hardware, pendant lighting with Edison bulbs, hardwood floors in natural oak, farmhouse sink, open shelving with rustic wood, warm inviting atmosphere, professional interior photography',
      'Industrial Loft': 'Industrial loft kitchen design, dark steel or charcoal cabinets with metal framework, concrete or butcher block countertops, exposed brick or metal tile backsplash, black metal fixtures and hardware, Edison bulb pendant lighting, polished concrete floors, stainless steel appliances, raw steel accents, urban loft aesthetic, dramatic mood lighting, professional architectural photography',
      'Scandinavian': 'Scandinavian kitchen interior design, light wood cabinets in natural oak or birch, white or light gray countertops, white subway tile backsplash, minimalist brass hardware, simple pendant lighting, light hardwood floors, clean simple lines, bright natural lighting, neutral palette with wood accents, cozy hygge atmosphere, professional Nordic interior photography',
      'Traditional': 'Traditional kitchen interior design, raised panel cabinets in cherry or maple wood, granite or marble countertops, classic subway tile backsplash, traditional brass hardware, elegant pendant lighting, hardwood floors, warm color palette, classic crown molding, timeless design elements, professional interior photography'
    };

    const selectedStylePrompt = stylePrompts[selectedStyle] || stylePrompts['Modern Minimalist'];

    // LAYOUT PRESERVATION PROMPT (CRITICAL)
    const layoutPrompt = `Interior design transformation of this exact kitchen layout. CRITICAL: Keep all cabinets, appliances, windows, doors, and architectural elements in their exact same positions and sizes. Only transform surface finishes, colors, materials, and decorative elements.`;

    const fullPrompt = `${layoutPrompt} Transform into: ${selectedStylePrompt}. ${customPrompt ? `Additional: ${customPrompt}.` : ''} Maintain exact room proportions. Photorealistic, perfect lighting, 8K resolution.`;

    const negativePrompt = 'changing room layout, moving cabinets, moving appliances, different room structure, relocating windows or doors, adding or removing architectural elements, blurry, low quality, distorted, unrealistic, cartoon, text overlay, watermarks, amateur photography, poor lighting, cluttered, messy';

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
            num_inference_steps: 30,
            guidance_scale: 9,
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
            num_inference_steps: 35,
            guidance_scale: 8,
            strength: 0.65,
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
        estimatedCost: selectedStyle === 'Modern Minimalist' ? '$60,000 - $90,000' : '$45,000 - $75,000',
        timeline: '6-8 weeks',
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