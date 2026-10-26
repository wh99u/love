import { describe, expect, test } from 'vitest';
import { inWeek, weekLabel, weekRange } from './weeks';

describe('weekRange', () => {
  test('Monday to Sunday around the day', () => {
    expect(weekRange(new Date(2026, 9, 26))).toEqual({ from: '2026-10-26', to: '2026-11-01' });
    expect(weekRange(new Date(2026, 10, 1))).toEqual({ from: '2026-10-26', to: '2026-11-01' });
  });
  test('offsets walk whole weeks', () => {
    expect(weekRange(new Date(2026, 9, 28), -1)).toEqual({ from: '2026-10-19', to: '2026-10-25' });
    expect(weekRange(new Date(2026, 9, 28), 2)).toEqual({ from: '2026-11-09', to: '2026-11-15' });
  });
  test('inWeek includes both ends', () => {
    const w = weekRange(new Date(2026, 9, 28));
    expect(inWeek('2026-10-26', w)).toBe(true);
    expect(inWeek('2026-11-01', w)).toBe(true);
    expect(inWeek('2026-11-02', w)).toBe(false);
  });
});

describe('weekLabel', () => {
  const today = new Date(2026, 9, 28);
  test('near weeks have names', () => {
    expect(weekLabel(0, weekRange(today, 0))).toBe('Эта неделя');
    expect(weekLabel(-1, weekRange(today, -1))).toBe('Прошлая неделя');
  });
  test('far weeks show dates', () => {
    expect(weekLabel(-2, weekRange(today, -2))).toBe('12–18 окт');
    expect(weekLabel(-4, weekRange(today, -4))).toBe('28 сент – 4 окт');
  });
});
