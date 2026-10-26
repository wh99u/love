import { describe, expect, test } from 'vitest';
import { cover, fluteAt, hash, makeFlutes, sourceX, type Field } from './glass';

const still: Field = { t: 0, refract: 1, melt: 0 };
const flutes = makeFlutes(400, 7);

test('hash repeats for the same seed only', () => {
  expect(hash(12, 5)).toBe(hash(12, 5));
  expect(hash(12, 5)).not.toBe(hash(12, 6));
});

describe('ribs', () => {
  test('cover the width without gaps, 14–34 px each', () => {
    for (let i = 1; i < flutes.length; i++) expect(flutes[i].x0).toBeCloseTo(flutes[i - 1].x0 + flutes[i - 1].w);
    expect(flutes.at(-1)!.x0 + flutes.at(-1)!.w).toBeGreaterThanOrEqual(400);
    expect(flutes.every((r) => r.w >= 14 && r.w <= 34)).toBe(true);
  });
  test('fluteAt finds the rib under a column', () => {
    for (const x of [0, 13.5, 99, 250, 399]) {
      const r = fluteAt(x, flutes);
      expect(x).toBeGreaterThanOrEqual(r.x0);
      expect(x).toBeLessThan(r.x0 + r.w);
    }
  });
});

describe('sourceX', () => {
  const plain = { ...still, refract: 0 };
  test('a rib squeezes a wider strip of the picture into itself', () => {
    const r = fluteAt(200, flutes);
    const a = sourceX(r.x0 + r.w * 0.3, flutes, still);
    const b = sourceX(r.x0 + r.w * 0.7, flutes, still);
    expect(b - a).toBeGreaterThan(r.w * 0.4);
  });
  test('the edges of a rib reach far to the side', () => {
    const r = fluteAt(200, flutes);
    const edge = sourceX(r.x0 + r.w - 0.2, flutes, still) - sourceX(r.x0 + r.w / 2, flutes, still);
    expect(edge).toBeGreaterThan(r.w / 2 + 10);
  });
  test('without refraction only a few pixels of wobble remain', () => {
    for (let x = 0; x < 400; x += 7) expect(Math.abs(sourceX(x, flutes, plain) - x)).toBeLessThan(4);
  });
  test('scrolling stirs the liquid harder', () => {
    const drift = (melt: number) => Array.from({ length: 60 }, (_, i) => Math.abs(sourceX(i * 6, flutes, { ...plain, melt }) - i * 6)).reduce((t, v) => t + v, 0);
    expect(drift(1)).toBeGreaterThan(drift(0) * 2);
  });
});

test('cover crops the long side and keeps the focus near the top', () => {
  expect(cover(1000, 2000, 500, 500)).toEqual({ sx: 0, sy: 350, sw: 1000, sh: 1000 });
  expect(cover(2000, 1000, 500, 500)).toEqual({ sx: 500, sy: 0, sw: 1000, sh: 1000 });
});
