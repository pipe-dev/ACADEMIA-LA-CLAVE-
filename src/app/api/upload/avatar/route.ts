import { NextRequest, NextResponse } from 'next/server';
import https from 'https';
import querystring from 'querystring';
import { checkRateLimit, getClientIp } from '@/lib/securityService';
import { getCorsHeaders } from '@/lib/adminAuth';
import { detectImageMagicBytes, scanImageBufferForMaliciousPayload } from '@/utils/imageSecurity';

const IMGBB_API_KEY = process.env.IMGBB_API_KEY || process.env.NEXT_PUBLIC_IMGBB_API_KEY || 'e1077d3962d4c031903fd7feca4452a3';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(),
  });
}

function uploadToImgBBViaHttps(apiKey: string, base64Data: string, safeName: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const postData = querystring.stringify({
      key: apiKey.trim(),
      image: base64Data,
      name: safeName,
    });

    const req = https.request(
      'https://api.imgbb.com/1/upload',
      {
        method: 'POST',
        rejectUnauthorized: false,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(raw);
            resolve(parsed);
          } catch (err) {
            reject(new Error('Respuesta inválida del servidor de imágenes.'));
          }
        });
      }
    );

    req.on('error', (err) => {
      reject(err);
    });

    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Tiempo de espera agotado al conectar con el servidor de imágenes.'));
    });

    req.write(postData);
    req.end();
  });
}

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request.headers);
    const rateLimit = checkRateLimit(`upload_avatar_${clientIp}`, 20, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes de subida. Intenta nuevamente en un momento.' },
        { status: 429, headers: getCorsHeaders() }
      );
    }

    if (!IMGBB_API_KEY || !IMGBB_API_KEY.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'El servicio de alojamiento de imágenes no está disponible temporalmente.',
        },
        { status: 400, headers: getCorsHeaders() }
      );
    }

    let imageBuffer: Buffer;
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('image') as File | null;
      if (!file) {
        return NextResponse.json(
          { error: 'No se seleccionó ninguna imagen.' },
          { status: 400, headers: getCorsHeaders() }
        );
      }
      const arrayBuf = await file.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuf);
    } else {
      const body = await request.json().catch(() => ({}));
      const base64Image = body.image;
      if (!base64Image) {
        return NextResponse.json(
          { error: 'No se enviaron datos de imagen válidos.' },
          { status: 400, headers: getCorsHeaders() }
        );
      }
      const cleanBase64 = String(base64Image).replace(/^data:image\/[a-z]+;base64,/, '');
      imageBuffer = Buffer.from(cleanBase64, 'base64');
    }

    // 1. Validar límite estricto de tamaño (máx 5MB)
    if (imageBuffer.length > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'La imagen excede el límite máximo permitido de 5 MB.' },
        { status: 400, headers: getCorsHeaders() }
      );
    }

    // 2. Inspección estricta de encabezados binarios (Magic Bytes)
    const magic = detectImageMagicBytes(new Uint8Array(imageBuffer));
    if (!magic.valid || !magic.format) {
      return NextResponse.json(
        { error: magic.error || 'El archivo seleccionado no es una imagen válida.' },
        { status: 400, headers: getCorsHeaders() }
      );
    }

    // 3. Escaneo de scripts maliciosos en metadatos y comentarios
    const securityCheck = scanImageBufferForMaliciousPayload(new Uint8Array(imageBuffer));
    if (!securityCheck.safe) {
      return NextResponse.json(
        { error: securityCheck.reason || 'El archivo contiene metadatos no permitidos.' },
        { status: 400, headers: getCorsHeaders() }
      );
    }

    // 4. Generar nombre de archivo aleatorio y seguro
    const safeName = `avatar_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const base64Payload = imageBuffer.toString('base64');

    // 5. Transmitir a ImgBB
    const imgbbResult = await uploadToImgBBViaHttps(IMGBB_API_KEY, base64Payload, safeName);

    if (!imgbbResult.success || !imgbbResult.data?.url) {
      return NextResponse.json(
        {
          success: false,
          error: 'No se pudo guardar la foto de perfil. Intenta nuevamente.',
        },
        { status: 502, headers: getCorsHeaders() }
      );
    }

    return NextResponse.json(
      {
        success: true,
        url: imgbbResult.data.url,
        displayUrl: imgbbResult.data.display_url,
        thumbUrl: imgbbResult.data.thumb?.url || imgbbResult.data.url,
      },
      { headers: getCorsHeaders() }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Error al procesar la imagen de perfil.' },
      { status: 500, headers: getCorsHeaders() }
    );
  }
}
