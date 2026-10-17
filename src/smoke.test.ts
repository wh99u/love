import { expect, test } from 'vitest';
import { springs } from './ui/motion';

test('spring presets match the spec', () => {
  expect(springs.snappy).toEqual({ type: 'spring', stiffness: 520, damping: 38 });
  expect(springs.soft).toEqual({ type: 'spring', stiffness: 260, damping: 30 });
  expect(springs.bouncy).toEqual({ type: 'spring', stiffness: 380, damping: 22 });
});
