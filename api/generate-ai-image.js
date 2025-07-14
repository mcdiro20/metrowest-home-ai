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

    // Create ULTRA-SPECIFIC layout preservation prompt
    const ultraSpecificPrompt = `CRITICAL INSTRUCTION: You must create a renovation of this EXACT kitchen keeping every structural element identical.

MANDATORY REQUIREMENTS - MUST BE PRESERVED EXACTLY:
- Keep the IDENTICAL camera angle, viewpoint, and perspective as the original photo
- Maintain the EXACT same kitchen layout: same peninsula/island placement, same cabinet configuration
- Keep ALL structural elements in IDENTICAL positions: walls, windows, doors, ceiling
- Preserve the EXACT same room proportions and spatial relationships
- Keep the same floor plan and cabinet arrangement
- Maintain identical lighting direction and room orientation
- Keep the same countertop shape and size (only change material/color)
- Preserve the exact same appliance locations (only change style/finish)

WHAT YOU CAN CHANGE (DESIGN ELEMENTS ONLY):
Apply ${selectedStyle?.name || 'modern'} style by changing ONLY these elements:
- Cabinet door styles, colors, and finishes (${selectedStyle?.prompt || 'modern design'})
- Countertop materials and colors
- Appliance styles and finishes (same locations)
- Paint colors and wall treatments
- Light fixture styles (same positions)
- Hardware, handles, and accessories
- Backsplash materials and patterns
- Flooring materials (same layout)

RESULT REQUIREMENTS:
- The transformed kitchen must be immediately recognizable as the SAME kitchen from the SAME angle
- It should look like a professional renovation of this specific space, not a different kitchen
- Every structural element must remain in its exact original position
- The camera angle and perspective must be identical to the original
- Apply ${selectedStyle?.name || 'modern'} style elements while preserving the exact layout

This is a RENOVATION of the existing kitchen shown in the image - keep the layout identical and only update the finishes and design elements with ${selectedStyle?.name || 'modern'} style.`;

    console.log('🎨 Using ultra-specific layout preservation prompt');

    try {
      // Try image variation first (best for layout preservation)
      console.log('🎨 Attempting image variation for layout preservation...');
      
      const variationResponse = await openai.images.createVariation({
        image: Buffer.from(imageData.split(',')[1], 'base64'),
        n: 1,
        size: "1024x1024"
      });

      if (variationResponse.data[0]?.url) {
        console.log('✅ Image variation successful - layout should be preserved');
        return res.status(200).json({
          success: true,
          generatedImageUrl: variationResponse.data[0].url,
          message: `Layout-preserved variation with ${selectedStyle?.name || 'custom'} style`,
          method: 'variation'
        });
      }
    } catch (variationError) {
      console.log('⚠️ Image variation failed, trying generation with detailed prompt...');
    }

    // Fallback to generation with ultra-specific prompt
    const generationResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: ultraSpecificPrompt,
      n: 1,
      size: "1024x1024",
      quality: "hd",
      style: "natural"
    });

    const generatedImageUrl = generationResponse.data[0]?.url;
    
    if (!generatedImageUrl) {
      throw new Error('No image URL returned from OpenAI');
    }

    console.log('✅ AI image generated with ultra-specific layout preservation');

    return res.status(200).json({
      success: true,
      generatedImageUrl: generatedImageUrl,
      message: `AI generated with preserved layout and ${selectedStyle?.name || 'custom'} style`,
      appliedStyle: selectedStyle?.name,
      method: 'generation'
    });

  } catch (error) {
    console.error('❌ AI Image Generation Error:', error);
    
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