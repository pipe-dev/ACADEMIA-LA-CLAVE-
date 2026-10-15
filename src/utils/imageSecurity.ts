// Utilidad de seguridad y sanitizacion de imagenes para avatares y archivos multimedia

export function detectImageMagicBytes(bytes: Uint8Array): { valid: boolean; format?: 'png' | 'jpeg' | 'webp' | 'gif'; error?: string } {
  if (!bytes || bytes.length < 12) {
    return { valid: false, error: 'El archivo está dañado o no contiene datos suficientes.' };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return { valid: true, format: 'png' };
  }

  // JPEG / JPG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { valid: true, format: 'jpeg' };
  }

  // WebP: RIFF (bytes 0-3: 52 49 46 46) and WEBP (bytes 8-11: 57 45 42 50)
  if (
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return { valid: true, format: 'webp' };
  }

  // GIF: GIF8 (47 49 46 38)
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
    return { valid: true, format: 'gif' };
  }

  return { valid: false, error: 'El archivo no tiene un encabezado de imagen válido (solo se permiten JPG, PNG o WebP).' };
}

export function scanImageBufferForMaliciousPayload(bytes: Uint8Array): { safe: boolean; reason?: string } {
  const headerSlice = bytes.subarray(0, Math.min(bytes.length, 4096));
  const trailerSlice = bytes.subarray(Math.max(0, bytes.length - 4096));

  const textDecoder = new TextDecoder('latin1');
  const headerStr = textDecoder.decode(headerSlice).toLowerCase();
  const trailerStr = textDecoder.decode(trailerSlice).toLowerCase();

  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /vbscript:/i,
    /onload\s*=/i,
    /onerror\s*=/i,
    /onclick\s*=/i,
    /<\?php/i,
    /<svg/i,
    /<html/i,
    /<body/i,
    /<!entity/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(headerStr) || pattern.test(trailerStr)) {
      return { safe: false, reason: 'La imagen contiene fragmentos de código o metadatos no autorizados.' };
    }
  }

  return { safe: true };
}

export async function sanitizeImageInBrowser(file: File): Promise<{ file: File; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/') || file.type.includes('svg')) {
      return reject(new Error('Formato no permitido. Solo se aceptan fotos en formato JPG, PNG o WebP.'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer el archivo de imagen.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('La imagen parece dañada o tiene un formato no válido.'));
      img.onload = () => {
        try {
          let { width, height } = img;
          const maxDim = 512;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject(new Error('No se pudo inicializar el procesador de imagen.'));

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) return reject(new Error('No se pudo procesar la imagen sanitizada.'));
              const safeFile = new File([blob], `avatar_${Date.now()}.jpg`, { type: 'image/jpeg' });
              const safeDataUrl = canvas.toDataURL('image/jpeg', 0.92);
              resolve({ file: safeFile, dataUrl: safeDataUrl });
            },
            'image/jpeg',
            0.92
          );
        } catch (err: any) {
          reject(err);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
