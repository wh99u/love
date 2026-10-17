import { averageColor, removeFlatBackground, trimTransparent } from './cutout';

const MAX_SIDE = 768;

export interface CutoutResult {
  blob: Blob;
  tint: string;
  removed: boolean;
}

/** Downscale, optionally cut out a flat background, encode to WebP (PNG where WebP encoding is missing). */
export async function cutoutFromBlob(blob: Blob, opts: { removeBg: boolean }): Promise<CutoutResult> {
  const bmp = await createImageBitmap(blob);
  const k = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  const w = Math.max(1, Math.round(bmp.width * k));
  const h = Math.max(1, Math.round(bmp.height * k));
  const src = document.createElement('canvas');
  src.width = w;
  src.height = h;
  const ctx = src.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(bmp, 0, 0, w, h);
  bmp.close();
  const img = ctx.getImageData(0, 0, w, h);

  let removed = false;
  let tint = averageColor(img);
  let out: ImageData = img;
  if (opts.removeBg) {
    const r = removeFlatBackground(img);
    removed = r.removed;
    tint = r.tint;
    if (removed) {
      const t = trimTransparent(img);
      out = new ImageData(new Uint8ClampedArray(t.data), t.width, t.height);
    }
  }

  const dst = document.createElement('canvas');
  dst.width = out.width;
  dst.height = out.height;
  dst.getContext('2d')!.putImageData(out, 0, 0);
  const encoded = await new Promise<Blob | null>((res) => dst.toBlob(res, 'image/webp', 0.9));
  return { blob: encoded ?? blob, tint, removed };
}

/** Fetches a picture by URL; null when the site blocks cross-origin reads. */
export async function loadImageBlob(url: string): Promise<Blob | null> {
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) return null;
    const blob = await res.blob();
    return blob.type.startsWith('image/') ? blob : null;
  } catch {
    return null;
  }
}
