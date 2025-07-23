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
      console.log('🎨 Starting DALL-E generation process...');
      console.log('🎨 Prompt length:', renovationPrompt.length);
      console.log('🎨 Room type:', roomType);
      console.log('🎨 Style:', selectedStyle?.name);

      let generationResponse;
      let usedMethod = 'unknown';

      // Method 1: Try DALL-E 2 image editing (best for layout preservation)
      if (imageData && imageData.startsWith('data:image/')) {
        try {
          console.log('🎨 Method 1: Attempting DALL-E 2 image editing...');
          
          // Convert base64 to buffer
          const base64Data = imageData.split(',')[1];
          const imageBuffer = Buffer.from(base64Data, 'base64');
          
          // Simple, clear prompt for editing
          const editPrompt = `My prompt has full detail so no need to add more. Renovate this ${roomType} with ${selectedStyle?.name || 'modern'} style. Keep the exact same layout and only update finishes, colors, and materials. Create a clean interior photo without any text or labels.`;
          
          console.log('🎨 Edit prompt:', editPrompt);
          
          generationResponse = await openai.images.edit({
            image: imageBuffer,
            prompt: editPrompt,
            n: 1,
            size: "1024x1024"
          });
          
          usedMethod = 'dalle-2-edit';
          console.log('✅ DALL-E 2 editing successful');
          
        } catch (editError) {
          console.log('❌ DALL-E 2 editing failed:', editError.message);
          console.log('🔄 Falling back to DALL-E 3...');
          
          // Method 2: DALL-E 3 generation
          try {
            console.log('🎨 Method 2: Using DALL-E 3 generation...');
            
            // Add the prefix to prevent DALL-E 3 from adding elements
            const dalle3Prompt = renovationPrompt.startsWith('My prompt has full detail') 
              ? renovationPrompt 
              : `My prompt has full detail so no need to add more. ${renovationPrompt}`;
            
            generationResponse = await openai.images.generate({
              model: "dall-e-3",
              prompt: dalle3Prompt,
              n: 1,
              size: "1024x1024",
              quality: "standard",
              style: "natural"
            });
            
            usedMethod = 'dalle-3-generate';
            console.log('✅ DALL-E 3 generation successful');
            
          } catch (dalle3Error) {
            console.log('❌ DALL-E 3 generation failed:', dalle3Error.message);
            throw dalle3Error;
          }
        }
      } else {
        // Method 2: Direct DALL-E 3 if no valid image data
        console.log('🎨 Method 2: Direct DALL-E 3 (no image editing)...');
        
        // Add the prefix to prevent DALL-E 3 from adding elements
        const dalle3Prompt = renovationPrompt.startsWith('My prompt has full detail') 
          ? renovationPrompt 
          : `My prompt has full detail so no need to add more. ${renovationPrompt}`;
        
        generationResponse = await openai.images.generate({
          model: "dall-e-3",
          prompt: dalle3Prompt,
          n: 1,
          size: "1024x1024",
          quality: "standard",
          style: "natural"
        });
        
        usedMethod = 'dalle-3-direct';
        console.log('✅ DALL-E 3 direct generation successful');
      }

      const generatedImageUrl = generationResponse.data[0]?.url;
      
      if (!generatedImageUrl) {
        throw new Error('No image URL returned from OpenAI');
      }
      
      console.log('✅ Image generation completed successfully');
      console.log('🎨 Method used:', usedMethod);
      console.log('🎨 Generated URL:', generatedImageUrl.substring(0, 50) + '...');

      return res.status(200).json({
        success: true,
        generatedImageUrl: generatedImageUrl,
        message: `Generated with ${usedMethod}: ${selectedStyle?.name || 'custom'} style`,
        appliedStyle: selectedStyle?.name,
        roomType: roomType,
        method: usedMethod
      });

    } catch (openaiError) {
      console.error('❌ All OpenAI methods failed:', openaiError);
      console.error('❌ Error details:', {
        message: openaiError.message,
        code: openaiError.code,
        type: openaiError.type
      });
      
      // Don't throw - fall through to fallback
      console.log('🔄 Using fallback demo image...');
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
      message: `Using demo image (generation failed): ${error.message}`,
      error: error.message
    });
  }
}