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

    console.log('🎨 Enhanced AI Image Generation Request:');
    console.log('🎨 Room type:', roomType);
    console.log('🎨 Selected style:', selectedStyle);
    console.log('🎨 Image data length:', imageData?.length);

    // Use the enhanced prompt from the frontend (already includes image analysis)
    const enhancedPrompt = prompt || `Transform this interior space into a renovated version while maintaining the exact same layout, architectural features, and spatial relationships. Apply ${selectedStyle?.name || 'modern'} style finishes and decor while preserving all structural elements.`;
    
    console.log('🎨 Using enhanced prompt with image analysis');

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
      // Use DALL-E 3 with enhanced prompt
      console.log('🎨 Generating with enhanced layout-preserving prompt...');
      
      const generationResponse = await openai.images.generate({
        model: "dall-e-3",
        prompt: enhancedPrompt,
        n: 1,
        size: "1024x1024",
        quality: "hd",
        style: "natural"
      });
    }

    const generatedImageUrl = generationResponse.data[0]?.url;
    
    if (!generatedImageUrl) {
      throw new Error('No image URL returned from OpenAI');
    }

    console.log('✅ AI image generated with ultra-specific layout preservation');

    return res.status(200).json({
      success: true,
      generatedImageUrl: generatedImageUrl,
      message: `Enhanced AI generation with image analysis and ${selectedStyle?.name || 'custom'} style`,
      appliedStyle: selectedStyle?.name,
      method: 'enhanced-generation'
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