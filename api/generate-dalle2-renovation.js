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
    const { imageData, roomType, selectedStyle, customPrompt } = req.body;

    console.log('🎨 DALL-E 2 Image Editing Request:');
    console.log('🏠 Room type:', roomType);
    console.log('🎨 Selected style:', selectedStyle?.name);
    console.log('📸 Has image data:', !!imageData);

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
      console.log('⚠️ No OpenAI API key found - using demo image');
      return res.status(200).json({
        success: true,
        generatedImageUrl: getDemoImage(roomType),
        message: 'Demo mode - OpenAI API key not configured',
        appliedStyle: selectedStyle?.name,
        roomType: roomType,
        method: 'demo-no-api-key'
      });
    }

    console.log('✅ OpenAI API key found');

    // Import OpenAI
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

    // Convert base64 to buffer for DALL-E 2 editing
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

    // Create renovation prompt for DALL-E 2
    const renovationPrompt = createDALLE2RenovationPrompt(selectedStyle, roomType, customPrompt);
    console.log('🎨 DALL-E 2 renovation prompt:', renovationPrompt);

    // Try DALL-E 2 image editing
    try {
      console.log('🎨 Calling DALL-E 2 for image editing...');
      
      const editResponse = await openai.images.edit({
        image: imageBuffer,
        prompt: renovationPrompt,
        n: 1,
        size: "1024x1024"
      });
      
      console.log('✅ DALL-E 2 image editing completed');
      
      const generatedImageUrl = editResponse.data[0]?.url;
      
      if (!generatedImageUrl) {
        throw new Error('No image URL returned from DALL-E 2');
      }
      
      console.log('✅ DALL-E 2 renovation successful');
      
      return res.status(200).json({
        success: true,
        generatedImageUrl: generatedImageUrl,
        message: `DALL-E 2 renovation with ${selectedStyle?.name || 'custom'} style`,
        appliedStyle: selectedStyle?.name,
        roomType: roomType,
        method: 'dalle-2-image-editing',
        prompt: renovationPrompt
      });
      
    } catch (editError) {
      console.error('❌ DALL-E 2 image editing failed:', editError);
      
      // Fallback to demo image
      return res.status(200).json({
        success: true,
        generatedImageUrl: getDemoImage(roomType),
        message: `DALL-E 2 failed, using demo image: ${editError.message}`,
        appliedStyle: selectedStyle?.name,
        roomType: roomType,
        method: 'demo-fallback',
        error: editError.message
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error in DALL-E 2 renovation:', error);
    
    return res.status(500).json({
      success: false,
      message: `Unexpected error: ${error.message}`,
      error: error.message,
      method: 'error'
    });
  }
}

// Create DALL-E 2 renovation prompt (concise and focused)
function createDALLE2RenovationPrompt(selectedStyle, roomType, customPrompt) {
  // DALL-E 2 works best with shorter, focused prompts
  const basePrompt = `Renovate this ${roomType} keeping the same layout and room structure.`;

  const stylePrompts = {
    'modern-minimalist': 'Modern minimalist style with white cabinets, clean lines, and minimal hardware.',
    'farmhouse-chic': 'Farmhouse style with white shaker cabinets, rustic elements, and vintage fixtures.',
    'transitional': 'Transitional style blending classic and contemporary elements with neutral colors.',
    'coastal-new-england': 'Coastal style with light colors, white cabinets, and nautical touches.',
    'contemporary-luxe': 'Contemporary luxury with high-end materials and sophisticated finishes.',
    'eclectic-bohemian': 'Eclectic bohemian style with rich colors and mixed textures.'
  };

  const styleDescription = stylePrompts[selectedStyle?.id] || 'Modern renovation with updated finishes.';
  
  let finalPrompt = `${basePrompt} ${styleDescription}`;
  
  if (customPrompt) {
    finalPrompt += ` ${customPrompt}`;
  }
  
  // Keep it under 400 characters for DALL-E 2
  if (finalPrompt.length > 400) {
    finalPrompt = finalPrompt.substring(0, 397) + '...';
  }
  
  return finalPrompt;
}

// Demo images for fallback
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