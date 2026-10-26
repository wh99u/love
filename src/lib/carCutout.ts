import { trimTransparent, type Pixels } from './cutout';

/** U²-Net (small): finds the main object of a photo; 4.6 MB, runs in the browser. */
export const MODEL_SIDE = 320;
const MEAN = [0.485, 0.456, 0.406];
const STD = [0.229, 0.224, 0.225];
const MAX_SIDE = 900;

/** RGBA pixels (already MODEL_SIDE²) → the normalised CHW tensor the model expects. */
export function toTensor(rgba: Uint8ClampedArray, side = MODEL_SIDE): Float32Array {
  const n = side * side;
  const out = new Float32Array(3 * n);
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < 3; c++) out[c * n + i] = (rgba[i * 4 + c] / 255 - MEAN[c]) / STD[c];
  }
  return out;
}

/**
 * The model's saliency map → alpha 0..255: stretched to the full range, then
 * the soft middle tightened so the car gets crisp edges and no grey halo.
 */
export function maskAlpha(sal: Float32Array): Uint8ClampedArray {
  let lo = Infinity;
  let hi = -Infinity;
  for (const v of sal) {
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  const span = hi - lo || 1;
  const out = new Uint8ClampedArray(sal.length);
  for (let i = 0; i < sal.length; i++) {
    const v = (sal[i] - lo) / span;
    const t = Math.max(0, Math.min(1, (v - 0.18) / 0.6));
    out[i] = Math.round(t * t * (3 - 2 * t) * 255);
  }
  return out;
}

/** Share of the frame the object takes; a cut-out of nothing or of everything is a failure. */
export function coverage(alpha: Uint8ClampedArray) {
  let n = 0;
  for (const a of alpha) if (a > 127) n++;
  return n / alpha.length;
}

type Ort = typeof import('onnxruntime-web/wasm');
let session: Promise<{ ort: Ort; s: import('onnxruntime-web/wasm').InferenceSession }> | null = null;

function load() {
  session ??= (async () => {
    const [ort, wasm] = await Promise.all([import('onnxruntime-web/wasm'), import('onnxruntime-web/ort-wasm-simd-threaded.wasm?url')]);
    // GitHub Pages can't enable shared memory, so one thread it is
    ort.env.wasm.numThreads = 1;
    ort.env.wasm.wasmPaths = { wasm: wasm.default };
    const s = await ort.InferenceSession.create(`${import.meta.env.BASE_URL}models/u2netp.onnx`, { executionProviders: ['wasm'] });
    return { ort, s };
  })().catch((e) => {
    session = null;
    throw e;
  });
  return session;
}

const canvas = (w: number, h: number) => {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
};

/**
 * Cuts the car out of a photo: transparent around it, trimmed to its edges,
 * at most 900 px wide. Null when the model found nothing sensible.
 */
export async function cutOutCar(blob: Blob): Promise<Blob | null> {
  const { ort, s } = await load();
  const bmp = await createImageBitmap(blob);
  const k = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * k);
  const h = Math.round(bmp.height * k);

  const small = canvas(MODEL_SIDE, MODEL_SIDE);
  const sg = small.getContext('2d', { willReadFrequently: true })!;
  sg.drawImage(bmp, 0, 0, MODEL_SIDE, MODEL_SIDE);
  const input = new ort.Tensor('float32', toTensor(sg.getImageData(0, 0, MODEL_SIDE, MODEL_SIDE).data), [1, 3, MODEL_SIDE, MODEL_SIDE]);
  const result = await s.run({ [s.inputNames[0]]: input });
  const alpha = maskAlpha(result[s.outputNames[0]].data as Float32Array);
  const share = coverage(alpha);
  if (share < 0.03 || share > 0.9) {
    bmp.close();
    return null;
  }

  const mask = canvas(MODEL_SIDE, MODEL_SIDE);
  const mg = mask.getContext('2d')!;
  const m = mg.createImageData(MODEL_SIDE, MODEL_SIDE);
  for (let i = 0; i < alpha.length; i++) m.data[i * 4 + 3] = alpha[i];
  mg.putImageData(m, 0, 0);

  const full = canvas(w, h);
  const g = full.getContext('2d', { willReadFrequently: true })!;
  g.imageSmoothingQuality = 'high';
  g.drawImage(bmp, 0, 0, w, h);
  bmp.close();
  g.globalCompositeOperation = 'destination-in';
  g.drawImage(mask, 0, 0, w, h);

  const px = g.getImageData(0, 0, w, h);
  for (let i = 3; i < px.data.length; i += 4) if (px.data[i] < 12) px.data[i] = 0;
  const t: Pixels = trimTransparent(px);
  const out = canvas(t.width, t.height);
  out.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(t.data), t.width, t.height), 0, 0);
  const webp = await new Promise<Blob | null>((res) => out.toBlob(res, 'image/webp', 0.9));
  if (webp?.type === 'image/webp') return webp;
  return new Promise((res) => out.toBlob(res, 'image/png'));
}
