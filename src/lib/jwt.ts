/**
 * Native Web Crypto API JWT implementation for Edge compatibility.
 * Avoids heavy node-specific libraries.
 */

export function getJwtSecret(): string {
  let secret = process.env.JWT_SECRET;
  if (!secret) {
    try {
      const sym = Symbol.for('__cloudflare-context__');
      const ctx = (globalThis as any)[sym];
      if (ctx?.env?.JWT_SECRET) {
        secret = ctx.env.JWT_SECRET;
      }
    } catch {}
  }
  if (!secret) {
    const g = globalThis as any;
    if (g?.JWT_SECRET) {
      secret = g.JWT_SECRET;
    }
  }

  if (secret && secret.trim().length > 0) {
    return secret.trim();
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('[SECURITY FATAL] JWT_SECRET environment variable is missing in production.');
  }

  return 'afinapp_dev_local_secret_must_be_set_in_production_32chars!';
}

// Helper to decode Base64URL to string
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  if (typeof window !== 'undefined' && window.atob) {
    return window.atob(base64);
  }
  return Buffer.from(base64, 'base64').toString('binary');
}

// Helper to encode string to Base64URL
function base64UrlEncode(str: string): string {
  let base64;
  if (typeof window !== 'undefined' && window.btoa) {
    base64 = window.btoa(str);
  } else {
    base64 = Buffer.from(str, 'binary').toString('base64');
  }
  return base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

// Helper to convert ArrayBuffer/Uint8Array to binary string
function arrayBufferToBinaryString(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return binary;
}

export async function signJwt(payload: any, secret: string): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encoder = new TextEncoder();
  
  const headerJson = JSON.stringify(header);
  const payloadJson = JSON.stringify(payload);
  
  // Convert JSON to binary string first (to handle UTF-8/unicode properly)
  const headerBin = base64UrlEncode(headerJson);
  const payloadBin = base64UrlEncode(payloadJson);

  const keyData = encoder.encode(secret);
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const data = encoder.encode(`${headerBin}.${payloadBin}`);
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, data);
  const signatureBin = arrayBufferToBinaryString(signatureBuffer);
  const signature = base64UrlEncode(signatureBin);

  return `${headerBin}.${payloadBin}.${signature}`;
}

export async function verifyJwt(token: string, secret: string): Promise<any | null> {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [headerB64, payloadB64, signatureB64] = parts;

  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signatureBin = base64UrlDecode(signatureB64);
    const signatureBytes = new Uint8Array(signatureBin.length);
    for (let i = 0; i < signatureBin.length; i++) {
      signatureBytes[i] = signatureBin.charCodeAt(i);
    }

    const data = encoder.encode(`${headerB64}.${payloadB64}`);
    const isValid = await crypto.subtle.verify('HMAC', key, signatureBytes, data);

    if (!isValid) return null;

    const payloadJson = base64UrlDecode(payloadB64);
    const payload = JSON.parse(payloadJson);
    
    // Check expiration
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return null;
    }
    return payload;
  } catch (e) {
    return null;
  }
}
