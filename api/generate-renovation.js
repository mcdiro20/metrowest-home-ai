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

    // PROFESSIONAL ARCHITECTURAL RENDERING PROMPTS
    const stylePrompts = {
      'Modern Minimalist': `IMPORTANT: You are receiving a COLOR PHOTOGRAPH of an existing kitchen. Transform this existing kitchen photograph into a stunning, luxury renovation rendering while keeping it as a FULL COLOR, PHOTOREALISTIC image.

MANDATORY: KEEP AS FULL COLOR PHOTOGRAPH - never convert to black and white or sketches. START with the existing kitchen layout and IMPROVE everything.

Transform into: Ultra-modern luxury kitchen with handleless flat-panel cabinets in matte white or charcoal, premium quartz waterfall countertops with subtle veining, integrated stainless steel appliances, under-cabinet LED strip lighting, large format porcelain tile backsplash, polished hardwood floors, minimal hardware in brushed stainless steel, clean geometric lines, warm ambient lighting (2700K), fresh flowers in ceramic vases, professional architectural photography quality, 8K resolution, cinematic lighting with natural daylight, soft shadows and realistic material reflections.

FORBIDDEN: NO black and white images, NO sketches, NO line drawings, NO removing color, NO monochrome conversion.`,

      'Farmhouse Chic': `IMPORTANT: You are receiving a COLOR PHOTOGRAPH of an existing kitchen. Transform this existing kitchen photograph into a stunning, luxury renovation rendering while keeping it as a FULL COLOR, PHOTOREALISTIC image.

MANDATORY: KEEP AS FULL COLOR PHOTOGRAPH - never convert to black and white or sketches. START with the existing kitchen layout and IMPROVE everything.

Transform into: Elegant modern farmhouse kitchen with custom white or sage green shaker-style cabinetry, natural butcher block or honed marble countertops, classic subway tile or natural stone backsplash with dark grout, vintage brass or matte black hardware, pendant lighting with Edison bulbs or lantern styles, wide plank hardwood floors in natural oak, farmhouse sink, open shelving with rustic wood, warm inviting atmosphere (2700K lighting), fresh flowers and herbs in mason jars, professional interior photography quality, 8K resolution, golden hour natural light, rich saturated colors.

FORBIDDEN: NO black and white images, NO sketches, NO line drawings, NO removing color, NO monochrome conversion.`,

      'Contemporary Luxe': `IMPORTANT: You are receiving a COLOR PHOTOGRAPH of an existing kitchen. Transform this existing kitchen photograph into a stunning, luxury renovation rendering while keeping it as a FULL COLOR, PHOTOREALISTIC image.

MANDATORY: KEEP AS FULL COLOR PHOTOGRAPH - never convert to black and white or sketches. START with the existing kitchen layout and IMPROVE everything.

Transform into: Luxury contemporary kitchen with custom cabinetry in navy, forest green, or rich walnut, premium natural stone or dramatic quartz countertops with waterfall edges, large format natural stone or glass tile backsplash, brushed gold or matte black premium hardware, statement pendant lighting with geometric designs, hardwood floors in rich contemporary tones, integrated luxury appliances, sophisticated color palette, fresh orchids in elegant vases, professional architectural photography quality, 8K resolution, dramatic cinematic lighting, perfect material textures.

FORBIDDEN: NO black and white images, NO sketches, NO line drawings, NO removing color, NO monochrome conversion.`,

      'Industrial Loft': `IMPORTANT: You are receiving a COLOR PHOTOGRAPH of an existing kitchen. Transform this existing kitchen photograph into a stunning, luxury renovation rendering while keeping it as a FULL COLOR, PHOTOREALISTIC image.

MANDATORY: KEEP AS FULL COLOR PHOTOGRAPH - never convert to black and white or sketches. START with the existing kitchen layout and IMPROVE everything.

Transform into: Industrial loft kitchen with dark steel or charcoal cabinets with metal framework, concrete or butcher block countertops, exposed brick or metal tile backsplash, black metal fixtures and hardware, Edison bulb pendant lighting, polished concrete floors, stainless steel appliances, raw steel accents, urban loft aesthetic, warm industrial lighting (2700K), curated industrial accessories, professional architectural photography quality, 8K resolution, dramatic mood lighting with rich colors.

FORBIDDEN: NO black and white images, NO sketches, NO line drawings, NO removing color, NO monochrome conversion.`,

      'Transitional': `IMPORTANT: You are receiving a COLOR PHOTOGRAPH of an existing kitchen. Transform this existing kitchen photograph into a stunning, luxury renovation rendering while keeping it as a FULL COLOR, PHOTOREALISTIC image.

MANDATORY: KEEP AS FULL COLOR PHOTOGRAPH - never convert to black and white or sketches. START with the existing kitchen layout and IMPROVE everything.

Transform into: Timeless transitional kitchen with custom raised panel or shaker cabinetry in warm neutrals, premium granite or marble countertops, classic subway tile or natural stone backsplash, brushed nickel or champagne bronze hardware, traditional pendant or chandelier lighting, hardwood floors in medium tones, seamlessly integrated appliances, warm balanced lighting (2700K), fresh flowers in elegant arrangements, professional interior photography quality, 8K resolution, natural daylight with professional color grading.

FORBIDDEN: NO black and white images, NO sketches, NO line drawings, NO removing color, NO monochrome conversion.`
    };

    const selectedStylePrompt = stylePrompts[selectedStyle] || stylePrompts['Modern Minimalist'];

    // LAYOUT PRESERVATION PROMPT (CRITICAL)
    const layoutPrompt = `CRITICAL LAYOUT PRESERVATION: Maintain exact room dimensions, window positions, door locations, and architectural elements from the original photograph. Keep all cabinets, appliances, and structural features in their exact same positions and sizes. Only transform surface finishes, colors, materials, and decorative elements. Preserve original perspective and camera angle.`;

    const fullPrompt = `${layoutPrompt} ${selectedStylePrompt} ${customPrompt ? `Additional requirements: ${customPrompt}.` : ''} Result must be a stunning full-color luxury kitchen renovation that looks like it belongs in Architectural Digest and would cost $75,000+ to execute.`;

    const negativePrompt = 'black and white, monochrome, grayscale, sketch, line drawing, pencil drawing, artistic interpretation, desaturated, removing color, converting to black and white, cartoon, unrealistic, blurry, low quality, distorted, changing room layout, moving cabinets, moving appliances, different room structure, relocating windows or doors, adding or removing architectural elements, amateur photography, poor lighting, cluttered, messy, outdated fixtures';

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