/** Reeded-glass maths, kept free of the DOM so it can be tested. */

/** Deterministic 0..1 value for an integer lattice point. */
export function hash(i: number, seed: number) {
  let h = Math.imul(i, 374761393) ^ Math.imul(seed, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

/** Smooth 1-D value noise, 0..1. */
export function noise(x: number, seed: number) {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return hash(i, seed) * (1 - u) + hash(i + 1, seed) * u;
}

export interface Ripple {
  x: number;
  /** seconds since it started */
  age: number;
}

export interface Field {
  seed: number;
  /** seconds */
  t: number;
  /** 0 calm … 1 melted; the page scroll and the intro push it up */
  melt: number;
  /** finger position across the picture, px, and how fresh the touch is (0..1) */
  touchX: number;
  touch: number;
  ripples: Ripple[];
}

/**
 * Vertical shift of the column at `x`, px. Broad slow waves plus narrow peaks
 * that pull the picture up or down: dark drips into the light and back, as in
 * the reference.
 */
export function shift(x: number, f: Field) {
  const broad = noise(x * 0.011 + f.t * 0.05, f.seed) - 0.5;
  const peak = noise(x * 0.11 + 31.7 + f.t * 0.018, f.seed + 1);
  const fine = noise(x * 0.4 + 5.3, f.seed + 3) - 0.5;
  const sign = noise(x * 0.03 + 77.1 - f.t * 0.035, f.seed + 2) - 0.5;
  const amp = 1 + f.melt * 2.4;
  let d = (broad * 30 + fine * 6 + peak ** 3 * sign * 2 * 130) * amp;
  if (f.touch > 0.001) {
    const k = (x - f.touchX) / 46;
    d += Math.exp(-k * k) * 80 * f.touch;
  }
  for (const r of f.ripples) {
    const dist = Math.abs(x - r.x);
    const front = r.age * 340;
    if (dist > front + 30) continue;
    d += Math.sin((dist - front) / 16) * 34 * Math.exp(-r.age * 1.5) * Math.exp(-dist / 320);
  }
  return d;
}

/** Cover-fit of a picture into a box: the source rectangle to draw. */
export function cover(iw: number, ih: number, w: number, h: number, focusY = 0.35) {
  const s = Math.max(w / iw, h / ih);
  const sw = w / s;
  const sh = h / s;
  return { sx: (iw - sw) / 2, sy: Math.max(0, Math.min(ih - sh, (ih - sh) * focusY)), sw, sh };
}
