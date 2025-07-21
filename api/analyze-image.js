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
    const { imageData } = req.body;

    if (!imageData) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    console.log('🔍 Vision API analysis request received');

    // Check for OpenAI API key
    const openaiKey = process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    
    if (!openaiKey) {
      console.log('⚠️ No OpenAI API key found, using fallback analysis');
      return res.status(200).json({
        success: true,
        analysis: "Interior space with existing layout, architectural features, window and door positions, and spatial arrangement that must be preserved during renovation.",
        method: 'fallback'
      });
    }

    // Import OpenAI dynamically
    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({
      apiKey: openaiKey
    });

    const analysisPrompt = `Analyze this interior space image and identify:
    1. Room type (kitchen, bathroom, living room, etc.)
    2. Key architectural features (windows, doors, built-ins, columns, beams)
    3. Layout and spatial arrangement (L-shaped, galley, U-shaped, island, etc.)
    4. Major furniture/fixture placement (cabinets, appliances, counters)
    5. Lighting sources and direction
    6. Flooring type and pattern
    7. Wall configurations
    8. Any unique structural elements
    
    Provide a brief structural description focusing on elements that MUST be preserved during renovation. Be specific about layout type and key positioning.`;

    console.log('🔍 Using OpenAI Vision API for image analysis');

    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: analysisPrompt },
            {
              type: "image_url",
              image_url: {
                url: imageData // Should be base64 data URL
              }
            }
          ]
        }
      ],
      max_tokens: 500
    });

    const analysis = response.choices[0]?.message?.content;
    
    if (!analysis) {
      throw new Error('No analysis returned from Vision API');
    }

    console.log('✅ Vision API analysis completed successfully');
    console.log('🔍 Analysis preview:', analysis.substring(0, 200) + '...');

    return res.status(200).json({
      success: true,
      analysis: analysis,
      method: 'vision-api'
    });

  } catch (error) {
    console.error('❌ Vision API analysis error:', error);
    
    // Fallback to basic analysis
    return res.status(200).json({
      success: true,
      analysis: "Interior space with existing layout, architectural features, window and door positions, and spatial arrangement that must be preserved during renovation.",
      method: 'fallback',
      error: error.message
    });
  }
}