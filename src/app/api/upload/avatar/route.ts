import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '@/lib/securityService';
import { getCorsHeaders } from '@/lib/adminAuth';

const IMGBB_API_KEY = process.env.IMGBB_API_KEY || process.env.NEXT_PUBLIC_IMGBB_API_KEY;

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(),
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
          configured: false,
          error: 'IMGBB_API_KEY no está configurada en las variables de entorno del servidor (.env.local).',
        },
        { status: 400, headers: getCorsHeaders() }
      );
    }

    const contentType = request.headers.get('content-type') || '';
    const imgbbForm = new FormData();

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('image');
      if (!file) {
        return NextResponse.json(
          { error: 'No se envió ninguna imagen.' },
          { status: 400, headers: getCorsHeaders() }
        );
      }
      imgbbForm.append('image', file);
    } else {
      const body = await request.json().catch(() => ({}));
      const base64Image = body.image;
      if (!base64Image) {
        return NextResponse.json(
          { error: 'No se envió ninguna imagen en formato base64.' },
          { status: 400, headers: getCorsHeaders() }
        );
      }
      const cleanBase64 = String(base64Image).replace(/^data:image\/[a-z]+;base64,/, '');
      imgbbForm.append('image', cleanBase64);
    }

    const imgbbRes = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY.trim()}`, {
      method: 'POST',
      body: imgbbForm,
    });

    const imgbbData = await imgbbRes.json();

    if (!imgbbRes.ok || !imgbbData.success) {
      return NextResponse.json(
        {
          success: false,
          error: imgbbData.error?.message || 'Error al comunicarse con la API de ImgBB.',
        },
        { status: 502, headers: getCorsHeaders() }
      );
    }

    return NextResponse.json(
      {
        success: true,
        configured: true,
        url: imgbbData.data.url,
        displayUrl: imgbbData.data.display_url,
        thumbUrl: imgbbData.data.thumb?.url || imgbbData.data.url,
        deleteUrl: imgbbData.data.delete_url,
      },
      { headers: getCorsHeaders() }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Error interno al procesar subida de avatar.' },
      { status: 500, headers: getCorsHeaders() }
    );
  }
}
