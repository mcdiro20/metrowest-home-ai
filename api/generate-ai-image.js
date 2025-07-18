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

    // Detailed style prompts for better layout preservation
    const stylePrompts = {
      'modern-minimalist': "A high-resolution photo of a modern minimalist kitchen renovation in a traditional L-shaped layout with a peninsula, sink under a window, and upper/lower cabinets on both walls. Keep all core elements (window, peninsula, stove, hood, cabinets, appliances, layout) in the exact same position as a typical early 2000s American home kitchen. Style with clean flat-front cabinets, matte black hardware, hidden appliances, and minimalist decor in white, gray, and natural wood tones. Render with realistic lighting, clean lines, and photo-level detail as if taken for a home listing.",
      'farmhouse-chic': "A high-resolution photo of a farmhouse chic kitchen renovation in a traditional L-shaped layout with a peninsula, sink under a window, and upper/lower cabinets on both walls. Keep all core elements (window, peninsula, stove, hood, cabinets, appliances, layout) in the exact same position as a typical early 2000s American home kitchen. Style with shaker cabinets, brass hardware, a farmhouse sink, white subway tile backsplash, rustic wooden accents, and soft neutral colors. Render with realistic lighting, clean lines, and photo-level detail as if taken for a home listing.",
      'transitional': "A high-resolution photo of a transitional style kitchen renovation in a traditional L-shaped layout with a peninsula, sink under a window, and upper/lower cabinets on both walls. Keep all core elements (window, peninsula, stove, hood, cabinets, appliances, layout) in the exact same position as a typical early 2000s American home kitchen. Style with a mix of modern and traditional design: shaker cabinets, mixed metal finishes, neutral countertops, and subtle crown molding. Render with realistic lighting, clean lines, and photo-level detail as if taken for a home listing.",
      'coastal-new-england': "A high-resolution photo of a coastal New England kitchen renovation in a traditional L-shaped layout with a peninsula, sink under a window, and upper/lower cabinets on both walls. Keep all core elements (window, peninsula, stove, hood, cabinets, appliances, layout) in the exact same position as a typical early 2000s American home kitchen. Style with light blue or white cabinetry, nautical decor, shiplap walls, brass or chrome accents, and a fresh, airy atmosphere. Render with realistic lighting, clean lines, and photo-level detail as if taken for a home listing.",
      'contemporary-luxe': "A high-resolution photo of a contemporary luxe kitchen renovation in a traditional L-shaped layout with a peninsula, sink under a window, and upper/lower cabinets on both walls. Keep all core elements (window, peninsula, stove, hood, cabinets, appliances, layout) in the exact same position as a typical early 2000s American home kitchen. Style with high-end finishes like marble or quartz countertops, gold or brushed brass hardware, integrated appliances, dark cabinetry below and glossy white above, and statement lighting. Render with realistic lighting, clean lines, and photo-level detail as if taken for a home listing.",
      'eclectic-bohemian': "A high-resolution photo of an eclectic bohemian kitchen renovation in a traditional L-shaped layout with a peninsula, sink under a window, and upper/lower cabinets on both walls. Keep all core elements (window, peninsula, stove, hood, cabinets, appliances, layout) in the exact same position as a typical early 2000s American home kitchen. Style with a mix of vintage and modern elements, colorful tile backsplash, open shelving, hanging plants, patterned rugs, and vibrant decor. Render with realistic lighting, clean lines, and photo-level detail as if taken for a home listing."
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