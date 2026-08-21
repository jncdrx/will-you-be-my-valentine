const DB_NAME = 'angelflix_db';
const VIDEO_STORE = 'videos';
const VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = (e) => {
      (e.target as IDBOpenDBRequest).result.createObjectStore(VIDEO_STORE);
    };
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}

export async function saveVideoBlob(id: string, blob: Blob): Promise<void> {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(VIDEO_STORE, 'readwrite');
    tx.objectStore(VIDEO_STORE).put(blob, id);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}

export async function getVideoBlobURL(id: string): Promise<string | null> {
  const db = await openDB();
  return new Promise((res) => {
    const req = db.transaction(VIDEO_STORE).objectStore(VIDEO_STORE).get(id);
    req.onsuccess = () => {
      const result = req.result;
      if (result instanceof Blob) res(URL.createObjectURL(result));
      else res(null);
    };
    req.onerror = () => res(null);
  });
}

export async function deleteVideoBlob(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((res) => {
    const tx = db.transaction(VIDEO_STORE, 'readwrite');
    tx.objectStore(VIDEO_STORE).delete(id);
    tx.oncomplete = () => res();
    tx.onerror = () => res();
  });
}

export async function getStorageEstimateMB(): Promise<number> {
  try {
    const est = await navigator.storage.estimate();
    return Math.round(((est.usage ?? 0) / 1024 / 1024) * 10) / 10;
  } catch {
    return 0;
  }
}

export function extractVideoThumbnail(videoFile: File, seekSec = 1.5): Promise<string> {
  return new Promise((res, rej) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    const url = URL.createObjectURL(videoFile);
    video.src = url;
    video.onloadedmetadata = () => {
      video.currentTime = Math.min(seekSec, (video.duration || 2) * 0.1);
    };
    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      const aspect = video.videoWidth / (video.videoHeight || 1);
      canvas.width = 640;
      canvas.height = Math.round(640 / aspect);
      canvas.getContext('2d')!.drawImage(video, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      res(canvas.toDataURL('image/jpeg', 0.85));
    };
    video.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Cannot read video')); };
  });
}

export function getVideoDurationSec(file: File): Promise<number> {
  return new Promise((res, rej) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    const url = URL.createObjectURL(file);
    video.src = url;
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      res(Math.round(video.duration));
    };
    video.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Cannot read video')); };
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
