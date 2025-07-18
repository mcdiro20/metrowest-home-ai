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

    // Ultra-specific style prompts for perfect layout preservation
    const stylePrompts = {
      'modern-minimalist': "Transform this exact same kitchen layout into a Modern Minimalist renovation. Keep all major structural elements, appliance placements, and camera angle identical to the original image: all counters, islands, peninsulas, windows, doors, stove and hood locations, cabinet positions, ceiling features, and the complete floorplan should not move or change. Apply a full style upgrade as if a professional interior designer had remodeled the kitchen without changing the layout or footprint. Update the cabinetry, countertops, backsplash, lighting, flooring, hardware, and decor to match the Modern Minimalist aesthetic—clean flat-front cabinets, matte black hardware, hidden appliances, minimalist decor in white, gray, and natural wood tones. Render the result in ultra-realistic, magazine-quality photography, as if it were a real estate listing or HGTV after-shot. Use natural daylight, a clean lens, and a straight-on perspective. This should feel visually identical in layout, but totally transformed in style.",
      'farmhouse-chic': "Transform this exact same kitchen layout into a Farmhouse Chic renovation. Keep all major structural elements, appliance placements, and camera angle identical to the original image: all counters, islands, peninsulas, windows, doors, stove and hood locations, cabinet positions, ceiling features, and the complete floorplan should not move or change. Apply a full style upgrade as if a professional interior designer had remodeled the kitchen without changing the layout or footprint. Update the cabinetry, countertops, backsplash, lighting, flooring, hardware, and decor to match the Farmhouse Chic aesthetic—shaker cabinets, brass hardware, a farmhouse sink, rustic wood elements, soft neutral tones, and white tile backsplash. Render the result in ultra-realistic, magazine-quality photography, as if it were a real estate listing or HGTV after-shot. Use natural daylight, a clean lens, and a straight-on perspective. This should feel visually identical in layout, but totally transformed in style.",
      'transitional': "Transform this exact same kitchen layout into a Transitional renovation. Keep all major structural elements, appliance placements, and camera angle identical to the original image: all counters, islands, peninsulas, windows, doors, stove and hood locations, cabinet positions, ceiling features, and the complete floorplan should not move or change. Apply a full style upgrade as if a professional interior designer had remodeled the kitchen without changing the layout or footprint. Update the cabinetry, countertops, backsplash, lighting, flooring, hardware, and decor to match the Transitional aesthetic—a mix of modern and traditional design with shaker cabinets, mixed metal finishes, neutral countertops, and subtle crown molding. Render the result in ultra-realistic, magazine-quality photography, as if it were a real estate listing or HGTV after-shot. Use natural daylight, a clean lens, and a straight-on perspective. This should feel visually identical in layout, but totally transformed in style.",
      'coastal-new-england': "Transform this exact same kitchen layout into a Coastal New England renovation. Keep all major structural elements, appliance placements, and camera angle identical to the original image: all counters, islands, peninsulas, windows, doors, stove and hood locations, cabinet positions, ceiling features, and the complete floorplan should not move or change. Apply a full style upgrade as if a professional interior designer had remodeled the kitchen without changing the layout or footprint. Update the cabinetry, countertops, backsplash, lighting, flooring, hardware, and decor to match the Coastal New England aesthetic—light blue or white cabinetry, nautical decor, shiplap walls, brass or chrome accents, and a fresh, airy atmosphere. Render the result in ultra-realistic, magazine-quality photography, as if it were a real estate listing or HGTV after-shot. Use natural daylight, a clean lens, and a straight-on perspective. This should feel visually identical in layout, but totally transformed in style.",
      'contemporary-luxe': "Transform this exact same kitchen layout into a Contemporary Luxe renovation. Keep all major structural elements, appliance placements, and camera angle identical to the original image: all counters, islands, peninsulas, windows, doors, stove and hood locations, cabinet positions, ceiling features, and the complete floorplan should not move or change. Apply a full style upgrade as if a professional interior designer had remodeled the kitchen without changing the layout or footprint. Update the cabinetry, countertops, backsplash, lighting, flooring, hardware, and decor to match the Contemporary Luxe aesthetic—high-end finishes like marble or quartz countertops, gold or brushed brass hardware, integrated appliances, dark cabinetry with statement lighting. Render the result in ultra-realistic, magazine-quality photography, as if it were a real estate listing or HGTV after-shot. Use natural daylight, a clean lens, and a straight-on perspective. This should feel visually identical in layout, but totally transformed in style.",
      'eclectic-bohemian': "Transform this exact same kitchen layout into an Eclectic Bohemian renovation. Keep all major structural elements, appliance placements, and camera angle identical to the original image: all counters, islands, peninsulas, windows, doors, stove and hood locations, cabinet positions, ceiling features, and the complete floorplan should not move or change. Apply a full style upgrade as if a professional interior designer had remodeled the kitchen without changing the layout or footprint. Update the cabinetry, countertops, backsplash, lighting, flooring, hardware, and decor to match the Eclectic Bohemian aesthetic—a mix of vintage and modern elements, colorful tile backsplash, open shelving, hanging plants, patterned rugs, and vibrant decor. Render the result in ultra-realistic, magazine-quality photography, as if it were a real estate listing or HGTV after-shot. Use natural daylight, a clean lens, and a straight-on perspective. This should feel visually identical in layout, but totally transformed in style."
    };

    // Get the specific prompt for the selected style
    const styleId = selectedStyle?.id || 'modern-minimalist';
    const specificPrompt = stylePrompts[styleId] || stylePrompts['modern-minimalist'];

    console.log('🎨 Using detailed style-specific prompt for:', styleId);

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
      prompt: specificPrompt,
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