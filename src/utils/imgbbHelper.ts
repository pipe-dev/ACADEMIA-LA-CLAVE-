// Helper para carga de avatares a ImgBB con sanitizacion binaria y fallback local
import { sanitizeImageInBrowser } from './imageSecurity';

export interface ImgBBUploadResponse {
  success: boolean;
  url: string;
  isRemote: boolean;
  error?: string;
}

export async function uploadAvatarToImgBB(file: File | string): Promise<ImgBBUploadResponse> {
  let processedFile = file;
  let fallbackDataUrl = typeof file === 'string' ? file : '';

  // 1. Sanitizar en el navegador: decodifica píxeles en Canvas para neutralizar scripts o metadatos inyectados
  if (typeof file !== 'string' && typeof window !== 'undefined') {
    try {
      const sanitized = await sanitizeImageInBrowser(file);
      processedFile = sanitized.file;
      fallbackDataUrl = sanitized.dataUrl;
    } catch (e: any) {
      console.warn('[Avatar Security] Sanitización previa:', e.message);
    }
  }

  // 2. Transmitir archivo sanitizado al endpoint del backend
  try {
    let response: Response;

    if (typeof processedFile === 'string') {
      response = await fetch('/api/upload/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: processedFile }),
      });
    } else {
      const formData = new FormData();
      formData.append('image', processedFile);
      response = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formData,
      });
    }

    if (response.ok) {
      const result = await response.json();
      if (result.success && result.url) {
        return {
          success: true,
          url: result.url,
          isRemote: true,
        };
      }
    }
  } catch (err) {
    console.warn('[Avatar] Subida remota no disponible en este momento, usando respaldo local.');
  }

  // 3. Fallback local seguro si no hay conexión o falla la red
  if (fallbackDataUrl) {
    return {
      success: true,
      url: fallbackDataUrl,
      isRemote: false,
    };
  }

  if (typeof file !== 'string') {
    const localDataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    return {
      success: true,
      url: localDataUrl,
      isRemote: false,
    };
  }

  return {
    success: true,
    url: file,
    isRemote: false,
  };
}

export function getVocalAvatarUrl(type: string): string {
  const map: Record<string, string> = {
    soprano: '/avatars/avatar-soprano.svg',
    tenor: '/avatars/avatar-tenor.svg',
    mezzosoprano: '/avatars/avatar-mezzosoprano.svg',
    baritono: '/avatars/avatar-baritono.svg',
    contralto: '/avatars/avatar-contralto.svg',
    bajo: '/avatars/avatar-bajo.svg',
    armonia: '/avatars/avatar-armonia.svg',
    acustico: '/avatars/avatar-acustico.svg',
  };
  return map[type.toLowerCase()] || map.soprano;
}
