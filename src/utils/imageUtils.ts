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
