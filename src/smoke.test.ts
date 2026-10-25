import { expect, test } from 'vitest';
import { springs } from './ui/motion';

test('spring presets: critically damped navigation, a little bounce for small things', () => {
  expect(springs.snappy).toEqual({ type: 'spring', stiffness: 500, damping: 42 });
  expect(springs.soft).toEqual({ type: 'spring', stiffness: 220, damping: 30 });
  expect(springs.bouncy).toEqual({ type: 'spring', stiffness: 420, damping: 28 });
  expect(springs.page).toEqual({ type: 'spring', stiffness: 340, damping: 38 });
});
