'use client';

import { useState } from 'react';

export interface UseDownloadPdfReturn {
  download: (url: string, fileName: string) => Promise<void>;
  downloading: boolean;
  error: string | null;
}

/**
 * useDownloadPdf — download/export file PDF.
 * Native: gunakan @capacitor/filesystem + share dialog.
 * Web: buat anchor tag dan trigger download normal.
 */
export function useDownloadPdf(): UseDownloadPdfReturn {
  const [downloading, setDownloading] = useState(false);
  const [error, setError]             = useState<string | null>(null);

  const isNative = typeof window !== 'undefined' &&
    !!(window as any).Capacitor?.isNativePlatform?.();

  const download = async (url: string, fileName: string) => {
    setDownloading(true);
    setError(null);

    try {
      if (isNative) {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const blob      = await response.blob();
        const base64    = await blobToBase64(blob);
        const dataOnly  = base64.split(',')[1];

        const { Filesystem, Directory } = await import('@capacitor/filesystem');
        const { Share }                 = await import('@capacitor/share');

        const result = await Filesystem.writeFile({
          path:      fileName,
          data:      dataOnly,
          directory: Directory.Cache,
        });

        await Share.share({
          title: fileName,
          url:   result.uri,
        });
      } else {
        const a = document.createElement('a');
        a.href     = url;
        a.download = fileName;
        a.click();
      }
    } catch (e: any) {
      setError(e?.message ?? 'Gagal mengunduh file.');
    } finally {
      setDownloading(false);
    }
  };

  return { download, downloading, error };
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
