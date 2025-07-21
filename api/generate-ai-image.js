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
    const { imageData, prompt, roomType, selectedStyle, customPrompt } = req.body;

    console.log('🎨 DALL-E Renovation Request:');
    console.log('🎨 Room type:', roomType);
    console.log('🎨 Selected style:', selectedStyle);
    console.log('🎨 Custom prompt:', customPrompt);
    console.log('🎨 Image data length:', imageData?.length);

    // Use the provided prompt or create a simple one
    let renovationPrompt = prompt;
    
    if (!renovationPrompt) {
      renovationPrompt = `Create a beautiful ${roomType} renovation maintaining the exact same layout and architectural features. Only update finishes, colors, and fixtures to ${selectedStyle?.name || 'modern'} style.`;
      
      if (customPrompt) {
        renovationPrompt += ` Additional requirements: ${customPrompt}`;
      }
      
      renovationPrompt += ` Create a photorealistic image without any text or labels.`;
    }
    
    console.log('🎨 Using renovation prompt');

    // Check for OpenAI API key
    const openaiKey = process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    
    if (!openaiKey) {
      console.log('⚠️ No OpenAI API key found, using fallback');
      const demoImages = {
        kitchen: 'https://images.pexels.com/photos/1080721/pexels-photo-1080721.jpeg?auto=compress&cs=tinysrgb&w=1024',
        bathroom: 'https://images.pexels.com/photos/2062426/pexels-photo-2062426.jpeg?auto=compress&cs=tinysrgb&w=1024',
        living_room: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=1024',
        bedroom: 'https://images.pexels.com/photos/2089698/pexels-photo-2089698.jpeg?auto=compress&cs=tinysrgb&w=1024',
        dining_room: 'https://images.pexels.com/photos/2724749/pexels-photo-2724749.jpeg?auto=compress&cs=tinysrgb&w=1024',
        home_office: 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=1024',
        other: 'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=1024'
      };
      
      return res.status(200).json({
        success: true,
        generatedImageUrl: demoImages[roomType] || demoImages.kitchen,
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
      // Use DALL-E 3 with detailed renovation prompt
      console.log('🎨 Generating with detailed renovation prompt...');
      
      // Try DALL-E 2 image editing first for better layout preservation
      let generationResponse;
      
      try {
        console.log('🎨 Attempting DALL-E 2 image editing for better layout preservation...');
        
        // Convert base64 to buffer for DALL-E 2 editing
        const base64Data = imageData.split(',')[1];
        const imageBuffer = Buffer.from(base64Data, 'base64');
        
        generationResponse = await openai.images.edit({
          image: imageBuffer,
          prompt: `Renovate this kitchen with ${selectedStyle?.name || 'modern'} style finishes. Keep the exact same layout, cabinet positions, and appliance locations. Only change cabinet doors, countertops, backsplash, and colors.`,
          n: 1,
          size: "1024x1024"
        });
        
        console.log('✅ DALL-E 2 editing successful');
        
      } catch (editError) {
        console.log('❌ DALL-E 2 editing failed, trying DALL-E 3 generation:', editError.message);
        
        generationResponse = await openai.images.generate({
          model: "dall-e-3",
          prompt: renovationPrompt,
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
      console.log('✅ DALL-E renovation generated successfully');

      return res.status(200).json({
        success: true,
        generatedImageUrl: generatedImageUrl,
        message: `DALL-E renovation with ${selectedStyle?.name || 'custom'} style`,
        appliedStyle: selectedStyle?.name,
        roomType: roomType,
        method: 'dalle-renovation'
      });

    } catch (openaiError) {
      console.error('❌ OpenAI generation failed:', openaiError);
      throw openaiError;
    }

  } catch (error) {
    console.error('❌ AI Image Generation Error:', error);
    
    // Final fallback to demo image
    const fallbackImages = {
      kitchen: 'https://images.pexels.com/photos/1080721/pexels-photo-1080721.jpeg?auto=compress&cs=tinysrgb&w=1024',
      bathroom: 'https://images.pexels.com/photos/2062426/pexels-photo-2062426.jpeg?auto=compress&cs=tinysrgb&w=1024',
      living_room: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=1024',
      bedroom: 'https://images.pexels.com/photos/2089698/pexels-photo-2089698.jpeg?auto=compress&cs=tinysrgb&w=1024',
      dining_room: 'https://images.pexels.com/photos/2724749/pexels-photo-2724749.jpeg?auto=compress&cs=tinysrgb&w=1024',
      home_office: 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=1024',
      other: 'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=1024'
    };
    
    const fallbackImage = fallbackImages[roomType] || fallbackImages.kitchen;
    
    return res.status(200).json({
      success: true,
      generatedImageUrl: fallbackImage,
      message: `AI generation failed, using fallback: ${error.message}`,
      error: error.message
    });
  }
}