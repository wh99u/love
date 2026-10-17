import { describe, expect, test } from 'vitest';
import { addMonths, dayKey, daysInMonth, daysLeftInMonth, fmtMonth, monthIn, monthName, ymKey } from './dates';

describe('date keys', () => {
  test('dayKey uses local calendar date with zero padding', () => {
    expect(dayKey(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(dayKey(new Date(2026, 9, 17, 23, 59))).toBe('2026-10-17');
  });
  test('ymKey', () => {
    expect(ymKey(new Date(2026, 9, 1))).toBe('2026-10');
  });
});

describe('month math', () => {
  test('daysInMonth handles February and leap years', () => {
    expect(daysInMonth('2028-02')).toBe(29);
    expect(daysInMonth('2026-02')).toBe(28);
    expect(daysInMonth('2026-10')).toBe(31);
  });
  test('daysLeftInMonth counts today', () => {
    expect(daysLeftInMonth(new Date(2026, 9, 31))).toBe(1);
    expect(daysLeftInMonth(new Date(2026, 9, 17))).toBe(15);
    expect(daysLeftInMonth(new Date(2028, 1, 1))).toBe(29);
  });
  test('addMonths crosses year boundaries', () => {
    expect(addMonths('2026-12', 1)).toBe('2027-01');
    expect(addMonths('2026-01', -1)).toBe('2025-12');
    expect(addMonths('2026-10', 0)).toBe('2026-10');
  });
  test('fmtMonth is a lowercase russian month with year', () => {
    expect(fmtMonth('2026-10')).toBe('октябрь 2026');
  });
  test('monthName and monthIn give the forms for «на …» and «в …»', () => {
    expect(monthName('2026-05')).toBe('май');
    expect(monthIn('2026-05')).toBe('мае');
    expect(monthIn('2026-10')).toBe('октябре');
  });
});
