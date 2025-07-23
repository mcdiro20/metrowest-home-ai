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

    console.log('🎨 DALL-E API Request received:');
    console.log('🎨 Room type:', roomType);
    console.log('🎨 Selected style:', selectedStyle?.name);
    console.log('🎨 Has image data:', !!imageData);
    console.log('🎨 Image data length:', imageData?.length);

    // Validate required data
    if (!imageData) {
      console.error('❌ No image data provided');
      return res.status(400).json({
        success: false,
        message: 'Image data is required',
        error: 'missing_image_data'
      });
    }

    if (!imageData.startsWith('data:image/')) {
      console.error('❌ Invalid image data format');
      return res.status(400).json({
        success: false,
        message: 'Invalid image data format',
        error: 'invalid_image_format'
      });
    }

    // Check for OpenAI API key
    const openaiKey = process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    
    if (!openaiKey) {
      console.log('⚠️ No OpenAI API key found');
      return res.status(200).json({
        success: false,
        message: 'OpenAI API key not configured',
        error: 'missing_api_key',
        method: 'no_key'
      });
    }

    console.log('✅ OpenAI API key found, length:', openaiKey.length);

    // Import OpenAI dynamically
    let OpenAI;
    try {
      const openaiModule = await import('openai');
      OpenAI = openaiModule.default;
      console.log('✅ OpenAI module imported successfully');
    } catch (importError) {
      console.error('❌ Failed to import OpenAI:', importError);
      return res.status(500).json({
        success: false,
        message: 'Failed to import OpenAI module',
        error: importError.message
      });
    }

    const openai = new OpenAI({
      apiKey: openaiKey
    });

    console.log('✅ OpenAI client created');

    // Convert base64 to buffer
    let imageBuffer;
    try {
      const base64Data = imageData.split(',')[1];
      if (!base64Data) {
        throw new Error('Invalid base64 data');
      }
      imageBuffer = Buffer.from(base64Data, 'base64');
      console.log('✅ Image converted to buffer, size:', imageBuffer.length, 'bytes');
    } catch (bufferError) {
      console.error('❌ Failed to convert image to buffer:', bufferError);
      return res.status(400).json({
        success: false,
        message: 'Failed to process image data',
        error: bufferError.message
      });
    }

    // Create ultra-simple prompt for DALL-E 2 editing
    let editPrompt = '';
    
    if (customPrompt) {
      // Custom prompt
      editPrompt = `My prompt has full detail so no need to add more. Update only the finishes in this ${roomType}: ${customPrompt}. Keep identical camera angle and room layout. No text or labels.`;
    } else {
      // Style-based prompt
      const styleMap = {
        'modern-minimalist': 'white cabinets, quartz countertops, minimal hardware',
        'farmhouse-chic': 'white shaker cabinets, wood accents, vintage fixtures',
        'transitional': 'neutral painted cabinets, classic hardware',
        'coastal-new-england': 'light blue and white finishes, nautical touches',
        'contemporary-luxe': 'dark cabinets, premium materials, gold accents',
        'eclectic-bohemian': 'colorful finishes, mixed textures'
      };
      
      const styleDescription = styleMap[selectedStyle?.id] || 'updated modern finishes';
      editPrompt = `My prompt has full detail so no need to add more. Update only the cabinet doors, countertops, and paint in this ${roomType} with ${styleDescription}. Keep identical camera angle and room layout. No text or labels.`;
    }
    
    console.log('🎨 Using DALL-E 2 image editing');
    console.log('🎨 Edit prompt:', editPrompt);

    // Try DALL-E 2 image editing
    try {
      console.log('🎨 Calling DALL-E 2 image edit API...');
      
      const editResponse = await openai.images.edit({
        image: imageBuffer,
        prompt: editPrompt,
        n: 1,
        size: "1024x1024"
      });
      
      console.log('✅ DALL-E 2 edit API call completed');
      console.log('🎨 Response data length:', editResponse.data?.length);
      
      const generatedImageUrl = editResponse.data[0]?.url;
      
      if (!generatedImageUrl) {
        throw new Error('No image URL returned from DALL-E 2 editing');
      }
      
      console.log('✅ DALL-E 2 editing successful');
      console.log('🎨 Generated image URL:', generatedImageUrl.substring(0, 50) + '...');
      
      return res.status(200).json({
        success: true,
        generatedImageUrl: generatedImageUrl,
        message: `Layout-preserving renovation with ${selectedStyle?.name || 'custom'} style`,
        appliedStyle: selectedStyle?.name,
        roomType: roomType,
        method: 'dalle-2-edit',
        prompt: editPrompt
      });
      
    } catch (editError) {
      console.error('❌ DALL-E 2 editing failed:', editError);
      console.error('❌ Error details:', {
        message: editError.message,
        code: editError.code,
        type: editError.type,
        status: editError.status
      });
      
      // Try DALL-E 3 as fallback
      console.log('🎨 Trying DALL-E 3 as fallback...');
      
      try {
        const generatePrompt = `My prompt has full detail so no need to add more. Create a ${roomType} renovation with ${selectedStyle?.name || 'modern'} style. ${customPrompt || ''}. No text, labels, or annotations.`;
        
        console.log('🎨 DALL-E 3 prompt:', generatePrompt);
        
        const generateResponse = await openai.images.generate({
          model: "dall-e-3",
          prompt: generatePrompt,
          n: 1,
          size: "1024x1024",
          quality: "standard"
        });
        
        const generatedImageUrl = generateResponse.data[0]?.url;
        
        if (!generatedImageUrl) {
          throw new Error('No image URL returned from DALL-E 3');
        }
        
        console.log('✅ DALL-E 3 generation successful (fallback)');
        
        return res.status(200).json({
          success: true,
          generatedImageUrl: generatedImageUrl,
          message: `Generated with DALL-E 3 (layout may differ)`,
          appliedStyle: selectedStyle?.name,
          roomType: roomType,
          method: 'dalle-3-fallback',
          prompt: generatePrompt
        });
        
      } catch (generateError) {
        console.error('❌ DALL-E 3 generation also failed:', generateError);
        
        return res.status(200).json({
          success: false,
          message: `Both DALL-E 2 and DALL-E 3 failed: ${editError.message}`,
          error: editError.message,
          fallbackError: generateError.message,
          method: 'failed'
        });
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error in AI Image Generation:', error);
    
    return res.status(500).json({
      success: false,
      message: `Unexpected error: ${error.message}`,
      error: error.message,
      method: 'error'
    });
  }
}