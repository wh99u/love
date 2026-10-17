import { expect, test } from 'vitest';
import { tiltFromOrientation } from './tilt';

test('phone held at a natural angle is neutral', () => {
  expect(tiltFromOrientation(0.7, 0)).toEqual({ x: 0, y: 0 });
});
test('strong tilt saturates at ±1', () => {
  expect(tiltFromOrientation(2, 1)).toEqual({ x: 1, y: 1 });
});
test('gamma maps linearly, beta clamps', () => {
  const t = tiltFromOrientation(0, -0.3);
  expect(t.x).toBeCloseTo(-0.5);
  expect(t.y).toBe(-1);
});
