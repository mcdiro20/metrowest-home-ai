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

    console.log('🎨 DALL-E Layout-Preserving Renovation Request:');
    console.log('🎨 Room type:', roomType);
    console.log('🎨 Selected style:', selectedStyle);
    console.log('🎨 Has image data:', !!imageData);

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
        message: 'Using demo image (no OpenAI key)',
        method: 'demo'
      });
    }

    // Import OpenAI dynamically
    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({
      apiKey: openaiKey
    });

    console.log('🎨 Using OpenAI API for layout-preserving renovation');

    // ONLY use DALL-E 2 image editing for layout preservation
    if (!imageData || !imageData.startsWith('data:image/')) {
      throw new Error('Valid image data required for layout preservation');
    }

    try {
      console.log('🎨 Using DALL-E 2 image editing for perfect layout preservation...');
      
      // Convert base64 to buffer
      const base64Data = imageData.split(',')[1];
      const imageBuffer = Buffer.from(base64Data, 'base64');
      
      // Create ultra-simple prompt focused only on surface changes
      let editPrompt = '';
      
      if (customPrompt) {
        // Custom prompt with style base
        if (selectedStyle?.name && selectedStyle.name !== 'Custom Style') {
          editPrompt = `My prompt has full detail so no need to add more. Update only the surface finishes in this ${roomType} to ${selectedStyle.name.toLowerCase()} style. ${customPrompt}. Keep identical camera angle, room layout, and all structural elements. No text, labels, or words.`;
        } else {
          editPrompt = `My prompt has full detail so no need to add more. Update only the surface finishes in this ${roomType}. ${customPrompt}. Keep identical camera angle, room layout, and all structural elements. No text, labels, or words.`;
        }
      } else {
        // Standard style prompt
        const styleMap = {
          'modern-minimalist': 'clean white cabinets, quartz countertops, minimal hardware',
          'farmhouse-chic': 'white shaker cabinets, wood accents, vintage fixtures',
          'transitional': 'neutral painted cabinets, classic hardware, timeless finishes',
          'coastal-new-england': 'light blue and white finishes, nautical touches',
          'contemporary-luxe': 'dark cabinets, premium materials, gold accents',
          'eclectic-bohemian': 'colorful finishes, mixed textures, artistic elements'
        };
        
        const styleDescription = styleMap[selectedStyle?.id] || 'updated modern finishes';
        editPrompt = `My prompt has full detail so no need to add more. Update only the cabinet doors, countertops, and paint colors in this ${roomType} with ${styleDescription}. Keep identical camera angle, room layout, and all structural elements. No text, labels, or words.`;
      }
      
      console.log('🎨 Edit prompt:', editPrompt);
      
      const editResponse = await openai.images.edit({
        image: imageBuffer,
        prompt: editPrompt,
        n: 1,
        size: "1024x1024"
      });
      
      const generatedImageUrl = editResponse.data[0]?.url;
      
      if (!generatedImageUrl) {
        throw new Error('No image URL returned from DALL-E 2 editing');
      }
      
      console.log('✅ DALL-E 2 editing successful - layout preserved');
      
      return res.status(200).json({
        success: true,
        generatedImageUrl: generatedImageUrl,
        message: `Layout-preserving renovation with ${selectedStyle?.name || 'custom'} style`,
        appliedStyle: selectedStyle?.name,
        roomType: roomType,
        method: 'dalle-2-edit'
      });
      
    } catch (editError) {
      console.error('❌ DALL-E 2 editing failed:', editError);
      
      // If editing fails, return error instead of fallback
      return res.status(200).json({
        success: false,
        message: `Layout preservation failed: ${editError.message}`,
        error: editError.message,
        method: 'failed'
      });
    }

  } catch (error) {
    console.error('❌ AI Image Generation Error:', error);
    
    return res.status(500).json({
      success: false,
      message: `Generation failed: ${error.message}`,
      error: error.message
    });
  }
}