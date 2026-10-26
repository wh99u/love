import { expect, test } from 'vitest';
import { coverage, maskAlpha, toTensor } from './carCutout';

test('pixels become a normalised channel-first tensor', () => {
  const rgba = new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 124, 116, 104, 255]);
  const t = toTensor(rgba, 2);
  expect(t.length).toBe(12);
  expect(t[0]).toBeCloseTo((1 - 0.485) / 0.229); // red of the first pixel
  expect(t[4 + 1]).toBeCloseTo((1 - 0.456) / 0.224); // green of the second
  expect(t[8 + 3]).toBeCloseTo((104 / 255 - 0.406) / 0.225); // blue of the last
});

test('the saliency map is stretched and its soft middle tightened', () => {
  const a = maskAlpha(new Float32Array([0.1, 0.12, 0.5, 0.9]));
  expect(a[0]).toBe(0);
  expect(a[1]).toBe(0);
  expect(a[3]).toBe(255);
  expect(a[2]).toBeGreaterThan(80);
  expect(a[2]).toBeLessThan(200);
});

test('coverage is the share of solid pixels', () => {
  expect(coverage(new Uint8ClampedArray([0, 255, 255, 10]))).toBe(0.5);
});
