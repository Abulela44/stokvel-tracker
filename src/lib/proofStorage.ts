/**
 * IndexedDB-backed storage for payment proof files.
 * Stores file blobs outside localStorage (which has a 5MB cap) and
 * keeps a lightweight metadata index in localStorage for quick access.
 */

const DB_NAME = "stokvel-proofs";
const STORE_NAME = "files";
const META_KEY = "proofMeta";
const MAX_STORAGE = 50 * 1024 * 1024; // 50MB

export type ProofMeta = {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  isImage: boolean;
  uploadedAt: number;
  messageId: string;
  memberName: string;
  amount: number;
  reviewStatus: "pending" | "approved" | "rejected";
};

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveFile(
  id: string,
  blob: Blob,
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(blob, id);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function getFile(id: string): Promise<Blob | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(id);
    req.onsuccess = () => {
      db.close();
      resolve((req.result as Blob) ?? null);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function deleteFile(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAllFileIds(): Promise<string[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).getAllKeys();
    req.onsuccess = () => {
      db.close();
      resolve((req.result as string[]) ?? []);
    };
    req.onerror = () => reject(req.error);
  });
}

export function loadProofMeta(): ProofMeta[] {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ProofMeta[];
  } catch {
    return [];
  }
}

export function saveProofMeta(meta: ProofMeta[]): void {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch {
    /* storage unavailable */
  }
}

export function addProofMeta(meta: ProofMeta): void {
  const all = loadProofMeta();
  all.push(meta);
  saveProofMeta(all);
}

export function updateProofMeta(
  id: string,
  patch: Partial<ProofMeta>,
): ProofMeta[] {
  const all = loadProofMeta();
  const updated = all.map((m) => (m.id === id ? { ...m, ...patch } : m));
  saveProofMeta(updated);
  return updated;
}

export function removeProofMeta(id: string): ProofMeta[] {
  const all = loadProofMeta().filter((m) => m.id !== id);
  saveProofMeta(all);
  return all;
}

export function getStorageUsed(): number {
  return loadProofMeta().reduce((sum, m) => sum + m.fileSize, 0);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export function storageLabel(): string {
  const used = getStorageUsed();
  return `${formatBytes(used)} / ${formatBytes(MAX_STORAGE)} used`;
}

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB before compression

/** Compress an image file to fit under MAX_FILE_SIZE by reducing quality/size. */
export async function compressImage(
  file: File,
  maxBytes = MAX_FILE_SIZE,
): Promise<Blob> {
  if (file.type === "application/pdf") return file;
  if (!file.type.startsWith("image/")) return file;

  const bitmap = await createImageBitmap(file);
  let { width, height } = bitmap;
  const maxDim = 1280;
  if (width > maxDim || height > maxDim) {
    const ratio = Math.min(maxDim / width, maxDim / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);

  let quality = 0.8;
  let blob: Blob = await canvasToBlob(canvas, "image/jpeg", quality);
  while (blob.size > maxBytes && quality > 0.3) {
    quality -= 0.15;
    blob = await canvasToBlob(canvas, "image/jpeg", quality);
  }
  bitmap.close?.();
  return blob;
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve) => {
    canvas.toBlob(
      (b) => resolve(b ?? new Blob()),
      type,
      quality,
    );
  });
}

/** Trigger a browser download of a blob with the given filename. */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
