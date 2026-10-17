/** Minimal pixel buffer; browser ImageData satisfies it. */
export interface Pixels {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

type RGB = [number, number, number];

const UNIFORM_SHARE = 0.9;
const UNIFORM_DIST = 40;
const EDGE_ALPHA = 160;

const dist = (d: Uint8ClampedArray, i: number, c: RGB) => Math.hypot(d[i] - c[0], d[i + 1] - c[1], d[i + 2] - c[2]);
const hex = (c: RGB) => `#${c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;

function borderIndices(w: number, h: number): number[] {
  const out: number[] = [];
  for (let x = 0; x < w; x++) out.push(x, (h - 1) * w + x);
  for (let y = 1; y < h - 1; y++) out.push(y * w, y * w + w - 1);
  return out;
}

const median = (vals: number[]) => {
  const s = [...vals].sort((a, b) => a - b);
  return s[s.length >> 1];
};

/** Mean colour of the visible pixels, weighted by alpha. */
export function averageColor(img: Pixels): string {
  const d = img.data;
  let r = 0, g = 0, b = 0, w = 0;
  for (let i = 0; i < d.length; i += 4) {
    const a = d[i + 3] / 255;
    r += d[i] * a; g += d[i + 1] * a; b += d[i + 2] * a; w += a;
  }
  return w ? hex([r / w, g / w, b / w]) : '#808080';
}

/**
 * Cuts out a flat (studio / marketplace) background in place: flood fill from the
 * edges through pixels close to the border's median colour, then soften the rim.
 */
export function removeFlatBackground(img: Pixels, tolerance = 32): { removed: boolean; tint: string } {
  const { width: w, height: h, data: d } = img;
  const border = borderIndices(w, h);

  if (border.filter((p) => d[p * 4 + 3] < 10).length >= border.length * UNIFORM_SHARE) {
    return { removed: true, tint: averageColor(img) };
  }

  const bg: RGB = [0, 1, 2].map((c) => median(border.map((p) => d[p * 4 + c]))) as RGB;
  const close = border.filter((p) => dist(d, p * 4, bg) < UNIFORM_DIST).length;
  if (close < border.length * UNIFORM_SHARE) return { removed: false, tint: averageColor(img) };

  const seen = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let head = 0, tail = 0;
  for (const p of border) {
    if (!seen[p] && dist(d, p * 4, bg) < tolerance) {
      seen[p] = 1;
      queue[tail++] = p;
    }
  }
  while (head < tail) {
    const p = queue[head++];
    d[p * 4 + 3] = 0;
    const x = p % w, y = (p / w) | 0;
    const next = [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1];
    for (const n of next) {
      if (n >= 0 && !seen[n] && dist(d, n * 4, bg) < tolerance) {
        seen[n] = 1;
        queue[tail++] = n;
      }
    }
  }

  const soften: number[] = [];
  for (let p = 0; p < w * h; p++) {
    if (d[p * 4 + 3] === 0) continue;
    const x = p % w, y = (p / w) | 0;
    const clear = (n: number) => d[n * 4 + 3] === 0;
    if ((x > 0 && clear(p - 1)) || (x < w - 1 && clear(p + 1)) || (y > 0 && clear(p - w)) || (y < h - 1 && clear(p + w))) soften.push(p);
  }
  for (const p of soften) d[p * 4 + 3] = Math.min(d[p * 4 + 3], EDGE_ALPHA);

  return { removed: true, tint: averageColor(img) };
}

/** Crops away fully transparent margins. */
export function trimTransparent(img: Pixels): Pixels {
  const { width: w, height: h, data: d } = img;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (d[(y * w + x) * 4 + 3] > 0) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
  if (x1 < 0) return { width: 1, height: 1, data: new Uint8ClampedArray(4) };
  const tw = x1 - x0 + 1, th = y1 - y0 + 1;
  const out = new Uint8ClampedArray(tw * th * 4);
  for (let y = 0; y < th; y++) out.set(d.subarray(((y0 + y) * w + x0) * 4, ((y0 + y) * w + x1 + 1) * 4), y * tw * 4);
  return { width: tw, height: th, data: out };
}
