// Device storage for offline documents (IndexedDB). Client-only; docs/specs/offline-documents/.
// public/sw.js and public/offline.html read the same database, so keep the names in sync.

export const DB_NAME = "tb-offline";
export const STORE = "files";
/** Total bytes kept on one device. */
export const MAX_TOTAL_BYTES = 50 * 1024 * 1024;

export type StoredFile = {
  id: number;
  fileName: string;
  contentType: string;
  slotName: string;
  blob: Blob;
};

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function run<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise<T>((resolve, reject) => {
    const request = fn(db.transaction(STORE, mode).objectStore(STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  }).finally(() => db.close());
}

export const putStoredFile = (file: StoredFile) => run("readwrite", (s) => s.put(file));
export const deleteStoredFile = (id: number) => run("readwrite", (s) => s.delete(id));
export const listStoredFiles = () => run<StoredFile[]>("readonly", (s) => s.getAll());
export const clearStoredFiles = () => run("readwrite", (s) => s.clear());

/** Removes everything saved on this device (called when signing out). */
export async function clearOfflineFiles(): Promise<void> {
  try {
    await clearStoredFiles();
    window.dispatchEvent(new Event("tb-offline-updated"));
  } catch {
    // Storage may be unavailable (private window); nothing to clear then.
  }
}
