export interface ImageAnalysis {
  roomType: string;
  architecturalFeatures: string[];
  layout: string;
  structuralDescription: string;
}

export class ImageAnalysisService {
  static async analyzeUploadedImage(imageFile: File): Promise<string> {
    try {
      console.log('🔍 Starting image analysis...');
      
      // Convert file to base64
      const base64Image = await this.fileToBase64(imageFile);
      console.log('📸 Image converted to base64, length:', base64Image.length);
      
      // Call backend API for Vision analysis
      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          imageData: base64Image
        })
      });

      if (!response.ok) {
        throw new Error(`API response not ok: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Analysis failed');
      }

      console.log('✅ Image analysis completed via', result.method);
      console.log('🔍 Analysis preview:', result.analysis.substring(0, 200) + '...');
      
      return result.analysis;

    } catch (error) {
      console.error('❌ Image analysis API failed:', error);
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