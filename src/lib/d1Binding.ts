// Adaptador unificado para Cloudflare D1 con deteccion de binding nativo y fallback REST

export interface D1DatabaseLike {
  prepare(query: string): {
    bind(...params: any[]): {
      all(): Promise<{ results: any[] }>;
      first<T = any>(): Promise<T | null>;
      run(): Promise<{ success: boolean; meta: any }>;
    };
    all(): Promise<{ results: any[] }>;
    first<T = any>(): Promise<T | null>;
    run(): Promise<{ success: boolean; meta: any }>;
  };
}

export function getD1EnvVar(key: string): string | undefined {
  try {
    const sym = Symbol.for('__cloudflare-context__');
    const ctx = (globalThis as any)[sym];
    if (ctx?.env && ctx.env[key]) {
      return ctx.env[key];
    }
  } catch {}

  try {
    // @ts-ignore
    const { getCloudflareContext } = require('@opennextjs/cloudflare');
    const ctx = getCloudflareContext();
    if (ctx?.env && ctx.env[key]) {
      return ctx.env[key];
    }
  } catch {}

  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }

  const g = globalThis as any;
  if (g && g[key]) {
    return g[key];
  }

  return undefined;
}

/**
 * Obtiene el binding nativo de Cloudflare D1 cuando corre dentro de Cloudflare Pages / Workers.
 * El binding nativo se comunica directamente con el motor SQLite en el Edge sin pasar por
 * la API REST HTTP administrativa, eliminando cuellos de botella de red y limites de tasa.
 */
export function getNativeD1(): D1DatabaseLike | null {
  try {
    const sym = Symbol.for('__cloudflare-context__');
    const ctx = (globalThis as any)[sym];
    if (ctx?.env?.DB && typeof ctx.env.DB.prepare === 'function') {
      return ctx.env.DB;
    }
    if (ctx?.env?.AFINAPP_DB && typeof ctx.env.AFINAPP_DB.prepare === 'function') {
      return ctx.env.AFINAPP_DB;
    }
  } catch {}

  try {
    // @ts-ignore
    const { getCloudflareContext } = require('@opennextjs/cloudflare');
    const ctx = getCloudflareContext();
    if (ctx?.env?.DB && typeof ctx.env.DB.prepare === 'function') {
      return ctx.env.DB;
    }
    if (ctx?.env?.AFINAPP_DB && typeof ctx.env.AFINAPP_DB.prepare === 'function') {
      return ctx.env.AFINAPP_DB;
    }
  } catch {}

  const g = globalThis as any;
  if (g?.DB && typeof g.DB.prepare === 'function') {
    return g.DB;
  }
  if (g?.AFINAPP_DB && typeof g.AFINAPP_DB.prepare === 'function') {
    return g.AFINAPP_DB;
  }

  const p = (typeof process !== 'undefined' ? process.env : {}) as any;
  if (p?.DB && typeof p.DB.prepare === 'function') {
    return p.DB;
  }
  if (p?.AFINAPP_DB && typeof p.AFINAPP_DB.prepare === 'function') {
    return p.AFINAPP_DB;
  }

  return null;
}

/**
 * Ejecuta una consulta SQL en D1 de forma optimizada.
 * Si esta en Cloudflare Pages / Workers, usa la conexion nativa local.
 * Si esta en desarrollo local Node.js, usa la API REST administrativa con token.
 */
export async function executeD1Query(
  sql: string,
  params: any[] = [],
  restConfig?: {
    accountId?: string;
    databaseId?: string;
    apiToken?: string;
  }
): Promise<any[]> {
  const nativeDb = getNativeD1();
  if (nativeDb) {
    const stmt = nativeDb.prepare(sql);
    const bound = params.length > 0 ? stmt.bind(...params) : stmt;
    const res = await bound.all();
    return res.results || [];
  }

  const accountId =
    restConfig?.accountId ||
    getD1EnvVar('CLOUDFLARE_D1_ACCOUNT_ID');
  const databaseId =
    restConfig?.databaseId ||
    getD1EnvVar('CLOUDFLARE_D1_DATABASE_ID');
  const apiToken =
    restConfig?.apiToken ||
    getD1EnvVar('CLOUDFLARE_D1_API_TOKEN');

  if (accountId && databaseId && apiToken) {
    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql, params }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cloudflare D1 query failed (${response.status}): ${errorText}`);
    }

    const json = await response.json();
    if (!json.success) {
      throw new Error(`Cloudflare D1 error: ${JSON.stringify(json.errors)}`);
    }
    return json.result?.[0]?.results || [];
  }

  throw new Error('No se encontro binding nativo de D1 ni credenciales REST configuradas.');
}
