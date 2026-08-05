export const DB_NAME = 'AfinAppDB';
export const DB_VERSION = 2;

const STORES = {
  VOCAL_HISTORY: 'vocal_history',
  KARAOKE_HISTORY: 'karaoke_history',
  KEY_VALUE: 'key_value',
} as const;

export interface VocalRecord {
  id?: number;
  date: number;
  lowestMidi: number;
  lowestName: string;
  highestMidi: number;
  highestName: string;
  passaggi: number[];
  coloratura: string | null;
}

export interface KaraokeScore {
  id?: number;
  videoId: string;
  trackName: string;
  artistName: string;
  score: number;
  stars: number;
  date: number;
}

// ─── Core IndexedDB ───

let dbInstance: IDBDatabase | null = null;

export const initDB = (): Promise<IDBDatabase> => {
  if (dbInstance) return Promise.resolve(dbInstance);
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject('No window');
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => { dbInstance = request.result; resolve(request.result); };
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORES.VOCAL_HISTORY)) {
        db.createObjectStore(STORES.VOCAL_HISTORY, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(STORES.KARAOKE_HISTORY)) {
        db.createObjectStore(STORES.KARAOKE_HISTORY, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(STORES.KEY_VALUE)) {
        db.createObjectStore(STORES.KEY_VALUE, { keyPath: 'key' });
      }
    };
  });
};

// ─── Generic Key-Value Store (replaces all localStorage usage) ───

export async function dbSave(key: string, value: unknown): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.KEY_VALUE, 'readwrite');
    const store = tx.objectStore(STORES.KEY_VALUE);
    const request = store.put({ key, value });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function dbLoad<T>(key: string): Promise<T | null> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.KEY_VALUE, 'readonly');
      const store = tx.objectStore(STORES.KEY_VALUE);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result?.value ?? null);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  }
}

export async function dbDelete(key: string): Promise<void> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.KEY_VALUE, 'readwrite');
      const store = tx.objectStore(STORES.KEY_VALUE);
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch { /* ignore */ }
}

// ─── Vocal History (auto-increment store) ───

export const saveVocalRecord = async (record: VocalRecord): Promise<number> => {
  const db = await initDB();
  return new Promise<number>((resolve, reject) => {
    const tx = db.transaction(STORES.VOCAL_HISTORY, 'readwrite');
    const store = tx.objectStore(STORES.VOCAL_HISTORY);
    const request = store.put(record);
    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject(request.error);
  });
};

export const getVocalHistory = async (): Promise<VocalRecord[]> => {
  try {
    const db = await initDB();
    return await new Promise<VocalRecord[]>((resolve, reject) => {
      const tx = db.transaction(STORES.VOCAL_HISTORY, 'readonly');
      const store = tx.objectStore(STORES.VOCAL_HISTORY);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return [];
  }
};

// ─── Karaoke History (auto-increment store) ───

export const saveKaraokeScore = async (score: KaraokeScore): Promise<number> => {
  const db = await initDB();
  return new Promise<number>((resolve, reject) => {
    const tx = db.transaction(STORES.KARAOKE_HISTORY, 'readwrite');
    const store = tx.objectStore(STORES.KARAOKE_HISTORY);
    const request = store.put(score);
    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject(request.error);
  });
};

export const getKaraokeHistory = async (): Promise<KaraokeScore[]> => {
  try {
    const db = await initDB();
    return await new Promise<KaraokeScore[]>((resolve, reject) => {
      const tx = db.transaction(STORES.KARAOKE_HISTORY, 'readonly');
      const store = tx.objectStore(STORES.KARAOKE_HISTORY);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return [];
  }
};
