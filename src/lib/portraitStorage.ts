import { useEffect, useState } from "react";

const DB_NAME = "skyrim-codex-portraits";
const DB_VERSION = 1;
const STORE_NAME = "renders";

function openPortraitDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function compressToPortraitWebp(
  sourceDataUrl: string,
  options: { maxWidth?: number; maxHeight?: number; quality?: number } = {}
): Promise<string> {
  const { maxWidth = 764, maxHeight = 1024, quality = 0.88 } = options;

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Failed to decode rendered image for WebP compression."));
    el.src = sourceDataUrl;
  });

  const targetRatio = maxWidth / maxHeight;
  const srcRatio = img.width / img.height;

  let sx = 0;
  let sy = 0;
  let sw = img.width;
  let sh = img.height;

  // Center-crop horizontally or top-biased vertically so horns/headgear stay intact
  if (srcRatio > targetRatio) {
    sw = Math.round(img.height * targetRatio);
    sx = Math.round((img.width - sw) / 2);
  } else if (srcRatio < targetRatio) {
    sh = Math.round(img.width / targetRatio);
    sy = Math.round((img.height - sh) * 0.15);
  }

  const canvas = document.createElement("canvas");
  canvas.width = maxWidth;
  canvas.height = maxHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return sourceDataUrl;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, maxWidth, maxHeight);

  const webp = canvas.toDataURL("image/webp", quality);
  return webp.startsWith("data:image/webp") ? webp : canvas.toDataURL("image/jpeg", 0.9);
}

export async function savePortraitRender(id: string, dataUrl: string): Promise<string> {
  const compressed = await compressToPortraitWebp(dataUrl);
  const db = await openPortraitDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put({ id, dataUrl: compressed, updatedAt: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  return compressed;
}

export async function getPortraitRender(id: string): Promise<string | null> {
  if (!id) return null;
  try {
    const db = await openPortraitDb();
    return await new Promise<string | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).get(id);
      req.onsuccess = () => resolve(req.result?.dataUrl ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function deletePortraitRender(id: string): Promise<void> {
  if (!id) return;
  try {
    const db = await openPortraitDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Ignore cleanup errors
  }
}

export function useStoredPortrait(renderId?: string, disabled?: boolean): string | null {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!renderId || disabled) {
      setDataUrl(null);
      return;
    }
    getPortraitRender(renderId).then((url) => {
      if (active) setDataUrl(url);
    });
    return () => {
      active = false;
    };
  }, [renderId, disabled]);

  return dataUrl;
}
