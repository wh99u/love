import { expect, test } from 'vitest';
import { alpha, glowColor, luminance, paletteFor, shade } from './color';

test('shade mixes towards white or black', () => {
  expect(shade('#808080', 0.5)).toBe('#c0c0c0');
  expect(shade('#808080', -0.5)).toBe('#404040');
  expect(shade('#123456', 0)).toBe('#123456');
});

test('alpha turns hex into rgba', () => {
  expect(alpha('#ff0000', 0.5)).toBe('rgba(255,0,0,0.5)');
});

test('paletteFor is stable per title', () => {
  expect(paletteFor('Стол')).toEqual(paletteFor('Стол'));
  expect(paletteFor('Стол')).toMatch(/^#[0-9a-f]{6}$/i);
});

test('dark product colours glow red instead', () => {
  expect(luminance('#ffffff')).toBeCloseTo(1);
  expect(glowColor('#101b1a')).toBe('#ff2b45');
  expect(glowColor('#3d8bff')).toBe('#3d8bff');
});
