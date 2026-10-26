import { describe, expect, test } from 'vitest';
import { cover, hash, noise, shift, type Field } from './glass';

const calm: Field = { seed: 7, t: 0, melt: 0, touchX: 0, touch: 0, ripples: [] };

describe('noise', () => {
  test('stays in 0..1 and repeats for the same seed', () => {
    for (let x = -50; x < 50; x += 0.37) {
      const v = noise(x, 3);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
    expect(hash(12, 5)).toBe(hash(12, 5));
    expect(hash(12, 5)).not.toBe(hash(12, 6));
  });
  test('is continuous', () => {
    expect(Math.abs(noise(4.999, 1) - noise(5.001, 1))).toBeLessThan(0.01);
  });
});

describe('shift', () => {
  test('a calm field moves columns by a bounded amount', () => {
    for (let x = 0; x < 400; x += 2) expect(Math.abs(shift(x, calm))).toBeLessThan(260);
  });
  test('melting stretches the drips', () => {
    const xs = Array.from({ length: 200 }, (_, i) => i * 2);
    const energy = (f: Field) => xs.reduce((t, x) => t + Math.abs(shift(x, f)), 0);
    expect(energy({ ...calm, melt: 1 })).toBeGreaterThan(energy(calm) * 2);
  });
  test('a touch pushes the columns under the finger down', () => {
    expect(shift(100, { ...calm, touchX: 100, touch: 1 }) - shift(100, calm)).toBeCloseTo(80);
    expect(shift(300, { ...calm, touchX: 100, touch: 1 }) - shift(300, calm)).toBeCloseTo(0);
  });
  test('a ripple only reaches as far as its front', () => {
    const r = { ...calm, ripples: [{ x: 0, age: 0.1 }] };
    expect(shift(300, r)).toBe(shift(300, calm));
  });
});

test('cover crops the long side and keeps the focus near the top', () => {
  expect(cover(1000, 2000, 500, 500)).toEqual({ sx: 0, sy: 350, sw: 1000, sh: 1000 });
  expect(cover(2000, 1000, 500, 500)).toEqual({ sx: 500, sy: 0, sw: 1000, sh: 1000 });
});
