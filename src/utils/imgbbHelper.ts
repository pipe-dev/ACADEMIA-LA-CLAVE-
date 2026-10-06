// Helper para carga de avatares a ImgBB y resolucion de avatares vocales predeterminados

export interface ImgBBUploadResponse {
  success: boolean;
  url: string;
  isRemote: boolean;
  error?: string;
}

export async function uploadAvatarToImgBB(file: File | string): Promise<ImgBBUploadResponse> {
  // Intentar subida a través de nuestro endpoint seguro del backend
  try {
    let response: Response;

    if (typeof file === 'string') {
      response = await fetch('/api/upload/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: file }),
      });
    } else {
      const formData = new FormData();
      formData.append('image', file);
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
    console.warn('[ImgBB] Fallo menor al subir vía servidor, aplicando fallback local:', err);
  }

  // Fallback offline / local: procesar con FileReader
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
    soprano: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    tenor: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    mezzosoprano: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
    baritono: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    contralto: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&auto=format&fit=crop&q=80',
  };
  return map[type.toLowerCase()] || map.soprano;
}
