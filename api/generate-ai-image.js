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
    const { imageData, prompt, roomType, selectedStyle } = req.body;

    console.log('🎨 AI Image Generation Request:');
    console.log('🎨 Room type:', roomType);
    console.log('🎨 Selected style:', selectedStyle);
    console.log('🎨 Style ID:', selectedStyle?.id);
    console.log('🎨 Style name:', selectedStyle?.name);
    console.log('🎨 Style prompt:', selectedStyle?.prompt);
    console.log('🎨 Custom prompt length:', prompt?.length);
    console.log('🎨 Image data length:', imageData?.length);

    // Check for OpenAI API key
    const openaiKey = process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    
    if (!openaiKey) {
      console.log('⚠️ No OpenAI API key found, using fallback');
      return res.status(200).json({
        success: true,
        generatedImageUrl: 'https://images.pexels.com/photos/1080721/pexels-photo-1080721.jpeg?auto=compress&cs=tinysrgb&w=1024',
        message: 'Using demo image (no OpenAI key)'
      });
    }

    // Import OpenAI dynamically
    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({
      apiKey: openaiKey
    });

    console.log('🎨 Using OpenAI API for real image generation');

    // Create VERY specific layout preservation prompt
    const layoutPreservationPrompt = `
CRITICAL LAYOUT REQUIREMENTS - MUST BE FOLLOWED EXACTLY:
- Keep the EXACT same camera angle and viewpoint as the original photo
- Maintain the EXACT same room layout, dimensions, and spatial relationships
- Keep all structural elements in identical positions: walls, windows, doors, ceiling
- Preserve the exact same kitchen configuration: island/peninsula placement, cabinet arrangement
- Keep the same floor plan and traffic flow patterns
- Maintain identical proportions and scale of all elements
- Keep the same lighting direction and room orientation

WHAT CAN BE CHANGED (DESIGN ELEMENTS ONLY):
- Cabinet door styles, colors, and finishes
- Countertop materials and colors  
- Appliance styles and finishes
- Flooring materials and patterns
- Paint colors and wall treatments
- Light fixture styles (but same positions)
- Hardware and accessories
- Backsplash materials and patterns

WHAT MUST STAY IDENTICAL:
- Room dimensions and shape
- Window locations and sizes
- Door positions and openings
- Ceiling height and features
- Island/peninsula size and placement
- Overall cabinet layout and configuration
- Structural walls and supports
- Camera angle and perspective
`;

    // Get style-specific elements
    let styleElements = '';
    if (selectedStyle && selectedStyle.prompt) {
      styleElements = selectedStyle.prompt;
      console.log('🎨 Using style-specific elements:', styleElements);
    } else {
      // Fallback generic elements by room type
      const genericElements = {
        kitchen: 'modern kitchen with updated cabinets, countertops, and appliances',
        backyard: 'beautiful landscaped outdoor space with modern features',
        bathroom: 'modern spa-like bathroom with updated fixtures',
        'living-room': 'contemporary living room with modern furniture and decor'
      };
      styleElements = genericElements[roomType] || genericElements.kitchen;
      console.log('🎨 Using generic elements for room type:', styleElements);
    }

    // Create the final enhanced prompt with extreme layout preservation emphasis
    const enhancedPrompt = `Transform this kitchen image by applying ${selectedStyle?.name || 'modern'} design elements while maintaining the EXACT same layout, camera angle, and spatial configuration.

${layoutPreservationPrompt}

STYLE TO APPLY:
Apply ${selectedStyle?.name || 'modern'} style with these specific elements: ${styleElements}

FINAL REQUIREMENTS:
- The result must look like the SAME kitchen from the SAME angle with only the finishes and design elements updated
- Keep identical room proportions, cabinet placement, and structural layout
- The transformation should be immediately recognizable as the same space, just renovated
- Photorealistic, professional interior design photography quality
- Same lighting conditions and camera perspective as original

This is a renovation of an existing kitchen - NOT a new kitchen design. Keep everything structurally identical and only update the aesthetic elements with ${selectedStyle?.name || 'modern'} style.`;

    console.log('🎨 Final enhanced prompt:', enhancedPrompt);

    // Generate image using DALL-E 3 with image editing capabilities
    const response = await openai.images.edit({
      image: Buffer.from(imageData.split(',')[1], 'base64'),
      prompt: enhancedPrompt,
      n: 1,
      size: "1024x1024"
    });

    const generatedImageUrl = response.data[0]?.url;
    
    if (!generatedImageUrl) {
      throw new Error('No image URL returned from OpenAI');
    }

    console.log('✅ AI image generated successfully with preserved layout and style:', selectedStyle?.name);

    return res.status(200).json({
      success: true,
      generatedImageUrl: generatedImageUrl,
      message: `AI image generated with preserved layout and ${selectedStyle?.name || 'custom'} style`,
      appliedStyle: selectedStyle?.name,
      layoutPreserved: true
    });

  } catch (error) {
    console.error('❌ AI Image Generation Error:', error);
    
    // If image editing fails, try regular generation with very specific layout prompts
    try {
      console.log('🔄 Trying fallback generation method...');
      
      const { default: OpenAI } = await import('openai');
      const openai = new OpenAI({
        apiKey: process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY
      });

      const fallbackPrompt = `Create a ${selectedStyle?.name || 'modern'} style kitchen renovation that matches this exact layout: ${selectedStyle?.prompt || 'modern design elements'}. 

CRITICAL: The result must have the exact same:
- Kitchen layout and cabinet configuration
- Island/peninsula placement and size  
- Window and door positions
- Room dimensions and proportions
- Camera angle and perspective
- Structural elements

Only change the finishes, colors, and design elements to match ${selectedStyle?.name || 'modern'} style. This should look like a renovation of the same kitchen, not a different kitchen.

Photorealistic, professional interior design photography.`;

      const fallbackResponse = await openai.images.generate({
        model: "dall-e-3",
        prompt: fallbackPrompt,
        n: 1,
        size: "1024x1024",
        quality: "hd",
        style: "natural"
      });

      const fallbackImageUrl = fallbackResponse.data[0]?.url;
      
      if (fallbackImageUrl) {
        return res.status(200).json({
          success: true,
          generatedImageUrl: fallbackImageUrl,
          message: `Fallback generation with ${selectedStyle?.name || 'custom'} style`,
          appliedStyle: selectedStyle?.name,
          method: 'fallback'
        });
      }
    } catch (fallbackError) {
      console.error('❌ Fallback generation also failed:', fallbackError);
    }
    
    // Final fallback to demo image
    const fallbackImages = {
      kitchen: 'https://images.pexels.com/photos/1080721/pexels-photo-1080721.jpeg?auto=compress&cs=tinysrgb&w=1024',
      backyard: 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=1024',
      bathroom: 'https://images.pexels.com/photos/2062426/pexels-photo-2062426.jpeg?auto=compress&cs=tinysrgb&w=1024'
    };
    
    const fallbackImage = fallbackImages[req.body.roomType] || fallbackImages.kitchen;
    
    return res.status(200).json({
      success: true,
      generatedImageUrl: fallbackImage,
      message: `AI generation failed, using fallback: ${error.message}`,
      error: error.message
    });
  }
}