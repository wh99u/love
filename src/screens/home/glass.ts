/** Reeded-glass maths, kept free of the DOM so it can be tested. */

/** Deterministic 0..1 value for an integer lattice point. */
export function hash(i: number, seed: number) {
  let h = Math.imul(i, 374761393) ^ Math.imul(seed, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

/** One vertical rib of the glass: a cylindrical lens. */
export interface Flute {
  /** left edge and width, px */
  x0: number;
  w: number;
  /** how much wider a strip of the picture the rib squeezes in (1 = none) */
  squeeze: number;
  /** how far the very edge of the rib reaches for distant pixels: the needles */
  reach: number;
  /** where the rib looks, relative to its centre, px */
  look: number;
  phase: number;
}

/** Ribs 14–34 px wide across `width`, like the glass in the reference. */
export function makeFlutes(width: number, seed: number, scale = 1): Flute[] {
  const out: Flute[] = [];
  let x = 0;
  for (let i = 0; x < width; i++) {
    const w = (14 + hash(i, seed) * 20) * scale;
    out.push({
      x0: x,
      w,
      squeeze: 1.5 + hash(i, seed + 1) * 0.9,
      reach: (14 + hash(i, seed + 2) * 40) * scale,
      look: (hash(i, seed + 3) - 0.5) * 12 * scale,
      phase: hash(i, seed + 4) * Math.PI * 2,
    });
    x += w;
  }
  return out;
}

export interface Field {
  /** seconds */
  t: number;
  /** 0 — the picture already shows the glass, only the liquid wobble moves; 1 — full ribs over a plain photo */
  refract: number;
  /** extra motion while the page scrolls, 0..1 */
  melt: number;
  /** finger position across the picture, px, and how fresh the touch is (0..1) */
  touchX: number;
  touch: number;
  ripples: { x: number; age: number }[];
}

/** The rib that covers column `x` (ribs are sorted and contiguous). */
export function fluteAt(x: number, flutes: Flute[]) {
  let lo = 0;
  let hi = flutes.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (flutes[mid].x0 <= x) lo = mid;
    else hi = mid - 1;
  }
  return flutes[lo];
}

/**
 * Which column of the picture shows through at column `x`. Inside a rib the
 * picture is squeezed; towards the rib's edge the lens reaches far to the side,
 * which draws the thin tapering needles. On top: a slow liquid wobble, a bulge
 * under the finger and ripples from taps.
 */
export function sourceX(x: number, flutes: Flute[], f: Field) {
  let sx = x;
  if (f.refract > 0) {
    const r = fluteAt(x, flutes);
    const half = r.w / 2;
    const u = Math.max(-1, Math.min(1, (x - r.x0 - half) / half));
    const breathe = 1 + Math.sin(f.t * 0.6 + r.phase) * 0.08;
    const lens = u * half * r.squeeze * breathe + Math.sign(u) * Math.abs(u) ** 6 * r.reach;
    sx = x + f.refract * (r.x0 + half + r.look + lens - x);
  }
  const wave = 1 + f.melt * 3;
  sx += (Math.sin(x * 0.045 + f.t * 0.9) * 1.4 + Math.sin(x * 0.012 - f.t * 0.4) * 2.2) * wave;
  if (f.touch > 0.001) {
    const k = (x - f.touchX) / 60;
    sx -= (x - f.touchX) * 0.45 * Math.exp(-k * k) * f.touch;
  }
  for (const r of f.ripples) {
    const dist = Math.abs(x - r.x);
    const front = r.age * 360;
    if (dist > front + 24) continue;
    sx += Math.sin((dist - front) / 12) * 9 * Math.exp(-r.age * 1.6) * Math.sign(x - r.x);
  }
  return sx;
}

/** Cover-fit of a picture into a box: the source rectangle to draw. */
export function cover(iw: number, ih: number, w: number, h: number, focusY = 0.35) {
  const s = Math.max(w / iw, h / ih);
  const sw = w / s;
  const sh = h / s;
  return { sx: (iw - sw) / 2, sy: Math.max(0, Math.min(ih - sh, (ih - sh) * focusY)), sw, sh };
}
