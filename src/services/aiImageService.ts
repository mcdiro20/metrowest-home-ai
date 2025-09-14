import OpenAI from 'openai';



export interface AIImageRequest {
  imageFile: File;
  roomType: 'kitchen' | 'backyard' | 'bathroom' | 'living-room';
  selectedStyle?: {id: string; name: string; prompt: string};
  prompt?: string;
}

export interface AIImageResponse {
  originalImage: string;
  generatedImage: string;
  prompt: string;
  processingTime: number;
}

export class AIImageService {
  private static generatePrompt(roomType: string, selectedStyle?: {id: string; name: string; prompt: string}): string {
    const basePrompts = {
      kitchen: "Transform this exact kitchen layout into a beautiful, renovated space. Keep the same room dimensions, window placements, and basic layout, but completely update the cabinets, countertops, appliances, flooring, and lighting. Make it look like a professional renovation of this specific kitchen.",
      backyard: "Transform this exact backyard space into a beautiful outdoor living area. Keep the same yard dimensions and basic layout, but add professional landscaping, seating areas, and modern outdoor features that work with this specific space.",
      bathroom: "Transform this exact bathroom into a modern, spa-like space. Keep the same room dimensions and layout, but completely update the fixtures, tiles, vanity, and lighting to create a luxurious renovation of this specific bathroom.",
      'living-room': "Transform this exact living room into a modern, stylish space. Keep the same room dimensions and layout, but completely update the furniture, lighting, paint, and decor to create a professionally designed version of this specific room."
    };

    let prompt = basePrompts[roomType as keyof typeof basePrompts] || basePrompts.kitchen;
    
    if (selectedStyle) {
      prompt = `Transform this exact ${roomType} with ${selectedStyle.prompt}. Keep the same room dimensions, layout, and architectural features, but completely renovate it with this design aesthetic. The result should look like a professional renovation of this specific space.`;
    }
    
    prompt += " IMPORTANT: Keep the exact same room layout, dimensions, window locations, and architectural features. Only change the finishes, fixtures, furniture, and design elements. The result should be photorealistic, high quality, professional interior design photography style.";
    
    return prompt;
  }

  static async generateDesign(request: AIImageRequest): Promise<AIImageResponse> {
    const startTime = Date.now();
    
    try {
      // Create original image URL
      const originalImageUrl = URL.createObjectURL(request.imageFile);
      
      // Use the backend API endpoint for AI generation
      return await this.generateViaBackend(request, originalImageUrl, startTime);
      
    } catch (error) {
      console.error('AI Image Generation Error:', error);
      // Fallback to simulation if there's any error
      const originalImageUrl = URL.createObjectURL(request.imageFile);
      return this.simulateAIProcessing(request, originalImageUrl, startTime);
    }
  }

  // Generate AI image via backend API
  private static async generateViaBackend(
    request: AIImageRequest, 
    originalImageUrl: string, 
    startTime: number
  ): Promise<AIImageResponse> {
    try {
      console.log('🎨 Sending image to backend for AI processing...');
      
      // Convert file to base64
      const base64Image = await this.fileToBase64(request.imageFile);
      
      // Generate the prompt
      const prompt = request.prompt || this.generatePrompt(request.roomType, request.selectedStyle);
      
      const response = await fetch('/api/generate-ai-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          imageData: base64Image,
          prompt: prompt,
          roomType: request.roomType,
          selectedStyle: request.selectedStyle
        })
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'AI generation failed');
      }
      
      const processingTime = Date.now() - startTime;
      
      return {
        originalImage: originalImageUrl,
        generatedImage: result.generatedImageUrl,
        prompt: prompt,
        processingTime
      };
      
    } catch (error) {
      console.error('Backend AI generation failed:', error);
      // Fallback to simulation
      return this.simulateAIProcessing(request, originalImageUrl, startTime);
    }
  }

  // Convert file to base64
  private static fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      // Check if the file is an image
      if (!file.type.startsWith('image/')) {
        reject(new Error('File must be an image'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          try {
            // Create canvas to convert image to JPEG format
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
              reject(new Error('Could not get canvas context'));
              return;
            }

            // Calculate optimal dimensions for AI processing (max 1024px on longest side)
            const maxDimension = 1024;
            let { width, height } = img;
            
            // Resize if image is too large
            if (width > maxDimension || height > maxDimension) {
              const aspectRatio = width / height;
              
              if (width > height) {
                width = maxDimension;
                height = Math.round(maxDimension / aspectRatio);
              } else {
                height = maxDimension;
                width = Math.round(maxDimension * aspectRatio);
              }
              
              console.log(`📏 Resizing image from ${img.width}x${img.height} to ${width}x${height} for AI processing`);
            }
            
            // Set canvas dimensions to optimized size
            canvas.width = width;
            canvas.height = height;

            // Draw image on canvas with optimized dimensions
            ctx.drawImage(img, 0, 0, width, height);

            // Convert to JPEG with optimized quality for AI processing
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            
            console.log('✅ Image optimized and converted to JPEG format for AI processing');
            console.log('📸 Original format:', file.type);
            console.log('📸 Original dimensions:', `${img.width}x${img.height}`);
            console.log('📸 Optimized dimensions:', `${width}x${height}`);
            console.log('📸 Optimized size:', dataUrl.length);
            
            resolve(dataUrl);
          } catch (canvasError) {
            console.error('❌ Canvas conversion failed:', canvasError);
            reject(canvasError);
          }
        };
        
        img.onerror = (imgError) => {
          console.error('❌ Image load failed:', imgError);
          reject(new Error('Failed to load image'));
        };
        
        img.src = event.target?.result as string;
      };
      
      reader.onerror = (readerError) => {
        console.error('❌ FileReader failed:', readerError);
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsDataURL(file);
    });
  }
  // Simulate AI processing with demo images
  private static async simulateAIProcessing(
    request: AIImageRequest, 
    originalImageUrl: string, 
    startTime: number
  ): Promise<AIImageResponse> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Demo images for different room types and styles
    const demoImages = {
      kitchen: {
        'modern-minimalist': 'https://images.pexels.com/photos/1080721/pexels-photo-1080721.jpeg?auto=compress&cs=tinysrgb&w=1024',
        'farmhouse-chic': 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=1024',
        'transitional': 'https://images.pexels.com/photos/2089698/pexels-photo-2089698.jpeg?auto=compress&cs=tinysrgb&w=1024',
        'coastal-new-england': 'https://images.pexels.com/photos/2724749/pexels-photo-2724749.jpeg?auto=compress&cs=tinysrgb&w=1024',
        'contemporary-luxe': 'https://images.pexels.com/photos/2062426/pexels-photo-2062426.jpeg?auto=compress&cs=tinysrgb&w=1024',
        'default': 'https://images.pexels.com/photos/1080721/pexels-photo-1080721.jpeg?auto=compress&cs=tinysrgb&w=1024'
      },
      backyard: {
        'modern-zen': 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=1024',
        'mediterranean-oasis': 'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=1024',
        'contemporary-outdoor': 'https://images.pexels.com/photos/1029599/pexels-photo-1029599.jpeg?auto=compress&cs=tinysrgb&w=1024',
        'default': 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=1024'
      }
    };
    
    const roomImages = demoImages[request.roomType as keyof typeof demoImages] || demoImages.kitchen;
    const styleId = request.selectedStyle?.id || 'default';
    const selectedImage = roomImages[styleId as keyof typeof roomImages] || roomImages.default;
    
    const prompt = this.generatePrompt(request.roomType, request.selectedStyle);
    const processingTime = Date.now() - startTime;

    return {
      originalImage: originalImageUrl,
      generatedImage: selectedImage,
      prompt,
      processingTime
    };
  }
}