import { useState } from 'react';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/lib/firebase';

interface UseImageUploadResult {
  uploadImage: (file: File, path: string) => Promise<string>;
  deleteImage: (path: string) => Promise<void>;
  uploading: boolean;
  error: string | null;
}

export function useImageUpload(): UseImageUploadResult {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = async (file: File, path: string): Promise<string> => {
    setUploading(true);
    setError(null);

    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('El archivo debe ser una imagen');
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('La imagen no puede superar los 5MB');
      }

      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      return downloadURL;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al subir la imagen';
      setError(message);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (path: string): Promise<void> => {
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    } catch (err) {
      console.error('Error deleting image:', err);
    }
  };

  return { uploadImage, deleteImage, uploading, error };
}

// Helper to generate storage paths
export function getPlayerPhotoPath(teamId: string, playerId: string | number): string {
  return `player_photos/${teamId}/${playerId}`;
}

export function getTeamShieldPath(teamId: string): string {
  return `team_shields/${teamId}`;
}
