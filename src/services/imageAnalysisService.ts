export interface ImageAnalysis {
  roomType: string;
  architecturalFeatures: string[];
  layout: string;
  structuralDescription: string;
}

export class ImageAnalysisService {
  static async analyzeUploadedImage(imageFile: File): Promise<string> {
    const analysisPrompt = `Analyze this interior space image and identify:
    1. Room type (kitchen, bathroom, living room, etc.)
    2. Key architectural features (windows, doors, built-ins, columns, beams)
    3. Layout and spatial arrangement
    4. Major furniture/fixture placement
    5. Lighting sources and direction
    6. Flooring type and pattern
    7. Wall configurations
    8. Any unique structural elements
    
    Provide a brief structural description focusing on elements that MUST be preserved during renovation.`;

    try {
      // Check if OpenAI API key is available
      const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
      
      if (!openaiKey) {
        console.log('⚠️ No OpenAI API key - using fallback analysis');
        return this.getFallbackAnalysis(imageFile);
      }

      // Convert file to base64
      const base64Image = await this.fileToBase64(imageFile);
      
      // Use OpenAI Vision API for analysis
      const { default: OpenAI } = await import('openai');
      const openai = new OpenAI({
        apiKey: openaiKey,
        dangerouslyAllowBrowser: true
      });

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
                  url: base64Image
                }
              }
            ]
          }
        ],
        max_tokens: 300
      });

      const analysis = response.choices[0]?.message?.content || this.getFallbackAnalysis(imageFile);
      console.log('✅ Image analysis completed:', analysis);
      return analysis;

    } catch (error) {
      console.error('❌ Image analysis failed:', error);
      return this.getFallbackAnalysis(imageFile);
    }
  }

  private static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private static getFallbackAnalysis(imageFile: File): string {
    // Basic analysis based on file name or default assumptions
    const fileName = imageFile.name.toLowerCase();
    
    if (fileName.includes('kitchen')) {
      return "Kitchen space with existing cabinetry layout, appliance placement, window positioning, and counter configuration that must be preserved during renovation.";
    } else if (fileName.includes('bathroom')) {
      return "Bathroom space with existing fixture layout, vanity placement, and spatial arrangement that must be preserved during renovation.";
    } else if (fileName.includes('living') || fileName.includes('room')) {
      return "Living space with existing furniture layout, architectural features, and spatial arrangement that must be preserved during renovation.";
    }
    
    return "Interior space with existing layout, architectural features, window and door positions, and spatial arrangement that must be preserved during renovation.";
  }
}