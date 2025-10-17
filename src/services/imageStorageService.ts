import { supabase } from '../lib/supabase';

export const imageStorageService = {
  async uploadAIImage(imageUrl: string, userId: string): Promise<string | null> {
    try {
      if (!imageUrl) return null;

      const response = await fetch(imageUrl);
      if (!response.ok) {
        console.error('Failed to fetch image from URL:', imageUrl);
        return null;
      }

      const blob = await response.blob();

      const fileName = `ai-${userId}-${Date.now()}.jpg`;
      const filePath = `${userId}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('ai-images')
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (error) {
        console.error('Failed to upload image to Supabase Storage:', error);
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('ai-images')
        .getPublicUrl(filePath);

      console.log('✅ Image uploaded to Supabase Storage:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('Error uploading image to storage:', error);
      return null;
    }
  },

  async uploadBase64Image(base64Data: string, userId: string, prefix: string = 'before'): Promise<string | null> {
    try {
      if (!base64Data) return null;

      const base64Content = base64Data.split(',')[1];
      const buffer = Uint8Array.from(atob(base64Content), c => c.charCodeAt(0));
      const blob = new Blob([buffer], { type: 'image/jpeg' });

      const fileName = `${prefix}-${userId}-${Date.now()}.jpg`;
      const filePath = `${userId}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('ai-images')
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (error) {
        console.error('Failed to upload base64 image to Supabase Storage:', error);
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('ai-images')
        .getPublicUrl(filePath);

      console.log('✅ Base64 image uploaded to Supabase Storage:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('Error uploading base64 image to storage:', error);
      return null;
    }
  }
};
