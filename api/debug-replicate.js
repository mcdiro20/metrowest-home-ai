export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔍 Debugging Replicate models...');
    
    // Check for Replicate API key
    const replicateApiKey = process.env.REPLICATE_API_TOKEN;
    
    if (!replicateApiKey) {
      return res.status(400).json({
        success: false,
        message: 'REPLICATE_API_TOKEN not found',
        solution: 'Add REPLICATE_API_TOKEN to your environment variables'
      });
    }

    console.log('✅ Replicate API key found');

    // Import Replicate
    const { default: Replicate } = await import('replicate');
    const replicate = new Replicate({
      auth: replicateApiKey,
    });

    console.log('✅ Replicate client created');

    // Method 1: Try to get specific stability-ai models
    console.log('🔍 Searching for stability-ai models...');
    
    try {
      // Search for models
      const searchResults = await fetch('https://api.replicate.com/v1/models?owner=stability-ai', {
        headers: {
          'Authorization': `Bearer ${replicateApiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (searchResults.ok) {
        const modelsData = await searchResults.json();
        console.log('✅ Found stability-ai models:', modelsData);
        
        const stableDiffusionModels = modelsData.results?.filter(model => 
          model.name.toLowerCase().includes('stable') || 
          model.name.toLowerCase().includes('sdxl')
        ) || [];
        
        return res.status(200).json({
          success: true,
          message: 'Found Replicate models',
          stabilityAiModels: modelsData.results || [],
          stableDiffusionModels: stableDiffusionModels,
          totalModels: modelsData.results?.length || 0
        });
      }
    } catch (searchError) {
      console.error('❌ Search failed:', searchError);
    }

    // Method 2: Try some known model patterns
    console.log('🔍 Testing known model patterns...');
    
    const testModels = [
      'stability-ai/sdxl',
      'stability-ai/stable-diffusion-xl',
      'stability-ai/stable-diffusion-xl-base-1.0',
      'lucataco/sdxl',
      'bytedance/sdxl-lightning-4step'
    ];
    
    const modelTests = [];
    
    for (const modelName of testModels) {
      try {
        console.log(`🧪 Testing model: ${modelName}`);
        
        // Try to get model info
        const modelInfo = await fetch(`https://api.replicate.com/v1/models/${modelName}`, {
          headers: {
            'Authorization': `Bearer ${replicateApiKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (modelInfo.ok) {
          const modelData = await modelInfo.json();
          modelTests.push({
            name: modelName,
            status: 'exists',
            latestVersion: modelData.latest_version?.id,
            description: modelData.description
          });
          console.log(`✅ Model ${modelName} exists`);
        } else {
          modelTests.push({
            name: modelName,
            status: 'not_found',
            error: modelInfo.status
          });
          console.log(`❌ Model ${modelName} not found (${modelInfo.status})`);
        }
      } catch (testError) {
        modelTests.push({
          name: modelName,
          status: 'error',
          error: testError.message
        });
        console.log(`❌ Error testing ${modelName}:`, testError.message);
      }
    }
    
    return res.status(200).json({
      success: true,
      message: 'Model testing completed',
      modelTests: modelTests,
      workingModels: modelTests.filter(test => test.status === 'exists'),
      recommendation: 'Use one of the working models listed above'
    });

  } catch (error) {
    console.error('💥 Debug error:', error);
    return res.status(500).json({
      success: false,
      message: `Debug failed: ${error.message}`,
      error: error.message
    });
  }
}