// @vitest-environment node
import { describe, expect, test } from 'vitest';
import { averageColor, removeFlatBackground, trimTransparent, type Pixels } from './cutout';

function canvas(w: number, h: number, fill: (x: number, y: number) => [number, number, number, number]): Pixels {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) data.set(fill(x, y), (y * w + x) * 4);
  return { width: w, height: h, data };
}
const alphaAt = (p: Pixels, x: number, y: number) => p.data[(y * p.width + x) * 4 + 3];
const redSquare = (x: number, y: number): [number, number, number, number] =>
  x >= 6 && x < 14 && y >= 6 && y < 14 ? [255, 0, 0, 255] : [255, 255, 255, 255];

describe('removeFlatBackground', () => {
  test('white product background is removed', () => {
    const img = canvas(20, 20, redSquare);
    const r = removeFlatBackground(img);
    expect(r.removed).toBe(true);
    expect(alphaAt(img, 0, 0)).toBe(0);
    expect(alphaAt(img, 19, 19)).toBe(0);
    expect(alphaAt(img, 10, 10)).toBe(255);
    expect(r.tint).toBe('#ff0000');
  });

  test('edge pixels are softened, not cut', () => {
    const img = canvas(20, 20, redSquare);
    removeFlatBackground(img);
    expect(alphaAt(img, 6, 10)).toBe(160);
  });

  test('busy photo keeps its background', () => {
    let seed = 7;
    const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) % 256;
    const img = canvas(20, 20, () => [rnd(), rnd(), rnd(), 255]);
    const r = removeFlatBackground(img);
    expect(r.removed).toBe(false);
    expect([...img.data].filter((_, i) => i % 4 === 3).every((a) => a === 255)).toBe(true);
  });

  test('already transparent png counts as cut out', () => {
    const img = canvas(10, 10, (x, y) => (x > 2 && x < 7 && y > 2 && y < 7 ? [0, 0, 255, 255] : [0, 0, 0, 0]));
    expect(removeFlatBackground(img)).toEqual({ removed: true, tint: '#0000ff' });
  });
});

describe('trimTransparent', () => {
  test('crops to the visible object', () => {
    const img = canvas(20, 20, redSquare);
    removeFlatBackground(img);
    const t = trimTransparent(img);
    expect([t.width, t.height]).toEqual([8, 8]);
    expect(alphaAt(t, 4, 4)).toBe(255);
  });
  test('fully transparent image stays 1×1', () => {
    const t = trimTransparent(canvas(4, 4, () => [0, 0, 0, 0]));
    expect([t.width, t.height]).toEqual([1, 1]);
  });
});

describe('averageColor', () => {
  test('ignores transparent pixels', () => {
    const img = canvas(2, 1, (x) => (x === 0 ? [0, 128, 0, 255] : [255, 255, 255, 0]));
    expect(averageColor(img)).toBe('#008000');
  });
});
