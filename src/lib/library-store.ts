import type { LibraryItem, MaterialExtraction } from "./library-types";

const DB = "kih-library-v1";
const STORE = "items";
const DB_VERSION = 2;

export type StoredLibraryItem = LibraryItem & {
  blob?: Blob;
  extraction?: MaterialExtraction;
};

function openDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB, DB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function listLocal() {
  if (typeof indexedDB === "undefined") return [];
  const database = await openDb();
  return new Promise<LibraryItem[]>((resolve, reject) => {
    const request = database.transaction(STORE).objectStore(STORE).getAll();
    request.onsuccess = () => resolve((request.result as StoredLibraryItem[]).map(({ blob, extraction, ...item }) => item));
    request.onerror = () => reject(request.error);
  });
}

export async function getLocal(id: string) {
  if (typeof indexedDB === "undefined") return undefined;
  const database = await openDb();
  return new Promise<StoredLibraryItem | undefined>((resolve, reject) => {
    const request = database.transaction(STORE).objectStore(STORE).get(id);
    request.onsuccess = () => resolve(request.result as StoredLibraryItem | undefined);
    request.onerror = () => reject(request.error);
  });
}

export async function putLocal(item: LibraryItem, blob?: Blob, extraction?: MaterialExtraction) {
  const database = await openDb();
  const existing = await getLocal(item.id);
  return new Promise<void>((resolve, reject) => {
    const request = database.transaction(STORE, "readwrite").objectStore(STORE).put({
      ...existing,
      ...item,
      blob: blob ?? existing?.blob,
      extraction: extraction ?? existing?.extraction,
    });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function updateLocalItem(id: string, patch: Partial<LibraryItem>) {
  const existing = await getLocal(id);
  if (!existing) return undefined;
  const next: StoredLibraryItem = { ...existing, ...patch };
  const database = await openDb();
  await new Promise<void>((resolve, reject) => {
    const request = database.transaction(STORE, "readwrite").objectStore(STORE).put(next);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
  const { blob, extraction, ...item } = next;
  return item;
}

export async function putExtraction(id: string, extraction: MaterialExtraction) {
  const existing = await getLocal(id);
  if (!existing) return;
  await putLocal(existing, existing.blob, extraction);
}

export async function getExtraction(id: string) {
  return (await getLocal(id))?.extraction;
}

export async function removeLocal(id: string) {
  const database = await openDb();
  await new Promise<void>((resolve, reject) => {
    const request = database.transaction(STORE, "readwrite").objectStore(STORE).delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function clearLocalLibrary() {
  if (typeof indexedDB === "undefined") return;
  await new Promise<void>((resolve) => {
    const request = indexedDB.deleteDatabase(DB);
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    request.onblocked = () => resolve();
  });
}
