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

    // Create style-specific prompt based on selected style
    let stylePrompt = '';
    if (selectedStyle && selectedStyle.prompt) {
      stylePrompt = selectedStyle.prompt;
      console.log('🎨 Using style-specific prompt:', stylePrompt);
    } else {
      // Fallback generic prompts by room type
      const genericPrompts = {
        kitchen: 'modern kitchen with updated cabinets, countertops, and appliances',
        backyard: 'beautiful landscaped outdoor space with modern features',
        bathroom: 'modern spa-like bathroom with updated fixtures',
        'living-room': 'contemporary living room with modern furniture and decor'
      };
      stylePrompt = genericPrompts[roomType] || genericPrompts.kitchen;
      console.log('🎨 Using generic prompt for room type:', stylePrompt);
    }

    // Enhanced prompt that emphasizes the selected style
    const enhancedPrompt = `Transform this exact room image into a ${selectedStyle?.name || 'renovated'} style space. 

STYLE REQUIREMENTS:
${stylePrompt}

CRITICAL LAYOUT REQUIREMENTS:
- Keep the EXACT same room layout, dimensions, and architectural features
- Keep windows, doors, and structural elements in the same positions  
- Keep the same room proportions and ceiling height
- Only change: cabinets, countertops, appliances, flooring, paint, lighting, fixtures, furniture
- Result must look like a professional renovation of THIS SPECIFIC room

QUALITY REQUIREMENTS:
- Photorealistic, high-quality interior design photography
- Professional lighting and composition
- ${selectedStyle?.name ? `Strong emphasis on ${selectedStyle.name} design elements` : 'Modern design elements'}
- The transformation should be dramatic but architecturally accurate to the original space

The final result should clearly show the ${selectedStyle?.name || 'renovated'} style while maintaining the exact layout of the original room.`;

    console.log('🎨 Final enhanced prompt:', enhancedPrompt);

    // Generate image using DALL-E 3
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: enhancedPrompt,
      n: 1,
      size: "1024x1024",
      quality: "hd",
      style: "natural"
    });

    const generatedImageUrl = response.data[0]?.url;
    
    if (!generatedImageUrl) {
      throw new Error('No image URL returned from OpenAI');
    }

    console.log('✅ AI image generated successfully with style:', selectedStyle?.name);

    return res.status(200).json({
      success: true,
      generatedImageUrl: generatedImageUrl,
      message: `AI image generated successfully with ${selectedStyle?.name || 'custom'} style`,
      appliedStyle: selectedStyle?.name,
      stylePrompt: stylePrompt
    });

  } catch (error) {
    console.error('❌ AI Image Generation Error:', error);
    
    // Fallback to demo image if AI fails
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