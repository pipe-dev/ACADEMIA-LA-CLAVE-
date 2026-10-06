// Helper para carga de avatares a ImgBB y resolucion de avatares vocales predeterminados

const DEFAULT_IMGBB_KEY = '5a440e210ca385a42095f47053e18a93'; // Clave publica de demostracion

export async function uploadAvatarToImgBB(file: File, apiKey: string = DEFAULT_IMGBB_KEY): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error(`Error al subir imagen a ImgBB: ${response.statusText}`);
  }

  const result = await response.json();
  if (result.success && result.data?.url) {
    return result.data.url;
  }

  throw new Error('No se recibio la URL publica de la imagen');
}

export function getVocalAvatarUrl(type: string): string {
  const map: Record<string, string> = {
    soprano: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    tenor: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    mezzosoprano: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
    baritono: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    contralto: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&auto=format&fit=crop&q=80'
  };
  return map[type.toLowerCase()] || map.soprano;
}
