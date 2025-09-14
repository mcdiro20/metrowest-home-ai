export async function resizeImageForEmail(base64Image: string, maxWidth: number = 1000, maxHeight: number = 1000): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64Image;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions while maintaining aspect ratio
      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        // Convert to JPEG with 80% quality for email
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(dataUrl);
      } else {
        reject(new Error('Could not get 2D context for canvas'));
      }
    };

    img.onerror = (err) => reject(err);
  });
}

export interface ProcessedImage {
  base64: string;
  originalSize: number;
  processedSize: number;
  originalDimensions: { width: number; height: number };
  processedDimensions: { width: number; height: number };
  format: string;
}

export interface ImageValidationError extends Error {
  code: 'FILE_TOO_LARGE' | 'INVALID_FORMAT' | 'PROCESSING_FAILED' | 'LOAD_FAILED';
}

export async function processImageForUpload(file: File): Promise<ProcessedImage> {
  console.log('📱 Starting mobile-optimized image processing...');
  console.log('📸 Original file:', {
    name: file.name,
    type: file.type,
    size: file.size,
    sizeInMB: (file.size / (1024 * 1024)).toFixed(2)
  });

  // Step 1: File validation
  const maxFileSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
  
  if (file.size > maxFileSize) {
    const error = new Error(`File size too large. Maximum allowed: 5MB, your file: ${(file.size / (1024 * 1024)).toFixed(2)}MB`) as ImageValidationError;
    error.code = 'FILE_TOO_LARGE';
    throw error;
  }
  
  if (!allowedTypes.includes(file.type.toLowerCase())) {
    const error = new Error(`Invalid file format. Supported formats: JPEG, PNG, WebP, HEIC. Your file: ${file.type}`) as ImageValidationError;
    error.code = 'INVALID_FORMAT';
    throw error;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const img = new Image();
      
      img.onload = () => {
        try {
          console.log('✅ Image loaded successfully');
          console.log('📏 Original dimensions:', `${img.width}x${img.height}`);
          
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            const error = new Error('Could not get canvas context for image processing') as ImageValidationError;
            error.code = 'PROCESSING_FAILED';
            reject(error);
            return;
          }

          // Step 2: Calculate optimal dimensions for mobile processing
          const maxDimension = 1920; // Increased from 1024 for better quality
          let { width, height } = img;
          const originalWidth = width;
          const originalHeight = height;
          
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
            
            console.log(`📏 Resizing from ${originalWidth}x${originalHeight} to ${width}x${height}`);
          }
          
          // Step 3: Handle EXIF orientation (basic correction)
          // Note: This is a simplified approach. For full EXIF support, we'd need a library
          // But this handles the most common case where portrait images appear rotated
          let finalWidth = width;
          let finalHeight = height;
          let rotation = 0;
          
          // Basic orientation detection based on file name or aspect ratio anomalies
          // This is a heuristic approach since we can't easily read EXIF without a library
          if (file.name.toLowerCase().includes('img_') && originalWidth > originalHeight && width < height) {
            // Likely a rotated iPhone image
            rotation = 90;
            finalWidth = height;
            finalHeight = width;
            console.log('🔄 Detected potential rotation, adjusting orientation');
          }
          
          // Step 4: Set canvas dimensions and draw image
          canvas.width = finalWidth;
          canvas.height = finalHeight;
          
          // Apply rotation if needed
          if (rotation !== 0) {
            ctx.translate(finalWidth / 2, finalHeight / 2);
            ctx.rotate((rotation * Math.PI) / 180);
            ctx.drawImage(img, -width / 2, -height / 2, width, height);
          } else {
            ctx.drawImage(img, 0, 0, width, height);
          }
          
          // Step 5: Convert to optimized JPEG
          const quality = 0.85; // 85% quality for good balance of size vs quality
          const processedBase64 = canvas.toDataURL('image/jpeg', quality);
          
          console.log('✅ Image processing complete');
          console.log('📊 Processing results:', {
            originalFormat: file.type,
            processedFormat: 'image/jpeg',
            originalSize: `${(file.size / (1024 * 1024)).toFixed(2)}MB`,
            processedSize: `${(processedBase64.length * 0.75 / (1024 * 1024)).toFixed(2)}MB`, // Approximate
            originalDimensions: `${originalWidth}x${originalHeight}`,
            processedDimensions: `${finalWidth}x${finalHeight}`,
            compressionRatio: `${((1 - (processedBase64.length * 0.75) / file.size) * 100).toFixed(1)}%`
          });
          
          resolve({
            base64: processedBase64,
            originalSize: file.size,
            processedSize: Math.round(processedBase64.length * 0.75), // Approximate size
            originalDimensions: { width: originalWidth, height: originalHeight },
            processedDimensions: { width: finalWidth, height: finalHeight },
            format: 'image/jpeg'
          });
          
        } catch (processingError) {
          console.error('❌ Image processing failed:', processingError);
          const error = new Error(`Image processing failed: ${processingError instanceof Error ? processingError.message : 'Unknown error'}`) as ImageValidationError;
          error.code = 'PROCESSING_FAILED';
          reject(error);
        }
      };
      
      img.onerror = (imgError) => {
        console.error('❌ Image load failed:', imgError);
        const error = new Error('Failed to load image. The file may be corrupted or in an unsupported format.') as ImageValidationError;
        error.code = 'LOAD_FAILED';
        reject(error);
      };
      
      img.src = event.target?.result as string;
    };
    
    reader.onerror = (readerError) => {
      console.error('❌ FileReader failed:', readerError);
      const error = new Error('Failed to read file') as ImageValidationError;
      error.code = 'LOAD_FAILED';
      reject(error);
    };
    
    reader.readAsDataURL(file);
  });
}

export function getFileSizeDisplay(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function getImageDimensionsDisplay(dimensions: { width: number; height: number }): string {
  return `${dimensions.width} × ${dimensions.height}`;
}