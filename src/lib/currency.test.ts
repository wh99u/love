import { describe, expect, test, vi } from 'vitest';
import { FALLBACK_RATE, fetchRate, money, rateIsFresh, rateLabel, readRate, saveRate } from './currency';

const memory = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
};

describe('money', () => {
  test('roubles as stored', () => {
    expect(money(12450, 'rub', 80)).toBe('12\u00a0450\u00a0₽');
  });
  test('dollars at the rate', () => {
    expect(money(16000, 'usd', 80)).toBe('$200');
    expect(money(8_000_000, 'usd', 80)).toBe('$100,000');
    expect(money(-800, 'usd', 80)).toBe('-$10');
  });
});

describe('rate cache', () => {
  test('falls back when nothing is saved', () => {
    expect(readRate(memory())).toEqual({ value: FALLBACK_RATE, at: 0, live: false });
  });
  test('saved rate is read back and stays fresh for hours', () => {
    const s = memory();
    saveRate(s, 81.6, 1000);
    const r = readRate(s);
    expect(r).toEqual({ value: 81.6, at: 1000, live: true });
    expect(rateIsFresh(r, 1000 + 3600_000)).toBe(true);
    expect(rateIsFresh(r, 1000 + 7 * 3600_000)).toBe(false);
  });
  test('ignores nonsense', () => {
    const s = memory();
    s.setItem('plan_usd_rate', '{"value":0.01,"at":5}');
    expect(readRate(s).live).toBe(false);
  });
  test('label', () => {
    expect(rateLabel(81.63)).toBe('1 $ = 81,6 ₽');
  });
});

describe('fetchRate', () => {
  const json = (body: unknown) => Promise.resolve({ json: () => Promise.resolve(body) } as Response);
  test('reads the Central Bank rate', async () => {
    const get = vi.fn(() => json({ Valute: { USD: { Value: 81.2, Nominal: 1 } } }));
    expect(await fetchRate(get as unknown as typeof fetch)).toBe(81.2);
  });
  test('falls through to the second source', async () => {
    const get = vi.fn().mockRejectedValueOnce(new Error('offline')).mockImplementationOnce(() => json({ rates: { RUB: 79.5 } }));
    expect(await fetchRate(get as unknown as typeof fetch)).toBe(79.5);
  });
  test('null when both fail', async () => {
    const get = vi.fn().mockRejectedValue(new Error('offline'));
    expect(await fetchRate(get as unknown as typeof fetch)).toBeNull();
  });
});
