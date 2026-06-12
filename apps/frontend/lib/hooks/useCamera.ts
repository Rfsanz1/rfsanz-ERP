'use client';

import { useState } from 'react';

export interface CapturedPhoto {
  dataUrl: string;   // base64 data URL
  mimeType: string;
  fileName?: string;
}

export interface UseCameraReturn {
  capture: () => Promise<CapturedPhoto | null>;
  fromGallery: () => Promise<CapturedPhoto | null>;
  uploading: boolean;
  error: string | null;
}

/**
 * useCamera — ambil foto via Capacitor Camera (native) atau file input (web).
 */
export function useCamera(): UseCameraReturn {
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const captureNative = async (source: 'CAMERA' | 'PHOTOS'): Promise<CapturedPhoto | null> => {
    setUploading(true);
    setError(null);
    try {
      const { Camera, CameraSource, CameraResultType } = await import('@capacitor/camera');
      const photo = await Camera.getPhoto({
        quality:      90,
        allowEditing: false,
        resultType:   CameraResultType.DataUrl,
        source:       source === 'CAMERA' ? CameraSource.Camera : CameraSource.Photos,
      });

      if (!photo.dataUrl) return null;
      return { dataUrl: photo.dataUrl, mimeType: `image/${photo.format}` };
    } catch (e: any) {
      if (!e?.message?.includes('cancelled') && !e?.message?.includes('cancel')) {
        setError('Gagal mengambil foto.');
      }
      return null;
    } finally {
      setUploading(false);
    }
  };

  const captureWeb = (accept = 'image/*'): Promise<CapturedPhoto | null> =>
    new Promise((resolve) => {
      const input = document.createElement('input');
      input.type   = 'file';
      input.accept = accept;
      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) { resolve(null); return; }
        const reader = new FileReader();
        reader.onload = () =>
          resolve({ dataUrl: reader.result as string, mimeType: file.type, fileName: file.name });
        reader.onerror = () => { setError('Gagal membaca file.'); resolve(null); };
        reader.readAsDataURL(file);
      };
      input.click();
    });

  const isNative = typeof window !== 'undefined' &&
    !!(window as any).Capacitor?.isNativePlatform?.();

  return {
    uploading,
    error,
    capture:     () => isNative ? captureNative('CAMERA')  : captureWeb(),
    fromGallery: () => isNative ? captureNative('PHOTOS')  : captureWeb(),
  };
}
