import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useBlogImageUpload = () => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const uploadImage = async (file: File): Promise<string> => {
    if (!file.type.startsWith('image/')) {
      throw new Error('Please select an image file');
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Image size must be less than 5MB');
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `blog-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('blog-images')
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      const { data } = supabase.storage
        .from('blog-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed';
      toast({
        title: "Upload Failed",
        description: message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (url: string): Promise<void> => {
    try {
      // Extract file path from URL
      const urlParts = url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `blog-images/${fileName}`;

      const { error } = await supabase.storage
        .from('blog-images')
        .remove([filePath]);

      if (error) {
        console.error('Delete failed:', error);
      }
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  return {
    uploadImage,
    deleteImage,
    uploading,
  };
};