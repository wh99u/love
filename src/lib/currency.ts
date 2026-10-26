import { rub } from './money';
import type { Currency } from './types';

/** Roubles per dollar when there is no network and nothing cached. */
export const FALLBACK_RATE = 82;
const KEY = 'plan_usd_rate';
const FRESH_MS = 6 * 3600_000;

export interface Rate {
  /** roubles per dollar */
  value: number;
  at: number;
  live: boolean;
}

const sane = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v > 10 && v < 1000;

export function readRate(storage: Pick<Storage, 'getItem'> | null): Rate {
  try {
    const raw = storage?.getItem(KEY);
    const r = raw ? (JSON.parse(raw) as Partial<Rate>) : null;
    if (r && sane(r.value) && typeof r.at === 'number') return { value: r.value, at: r.at, live: true };
  } catch {
    /* fall back */
  }
  return { value: FALLBACK_RATE, at: 0, live: false };
}

export const rateIsFresh = (r: Rate, now: number) => r.live && now - r.at < FRESH_MS;

/** Central Bank rate (cbr-xml-daily mirror), then a free FX API; null when both fail. */
export async function fetchRate(get: typeof fetch = fetch): Promise<number | null> {
  try {
    const r = await get('https://www.cbr-xml-daily.ru/daily_json.js');
    const j = (await r.json()) as { Valute?: { USD?: { Value?: number; Nominal?: number } } };
    const usd = j.Valute?.USD;
    const v = usd?.Value && usd.Nominal ? usd.Value / usd.Nominal : null;
    if (sane(v)) return v;
  } catch {
    /* try the next source */
  }
  try {
    const r = await get('https://open.er-api.com/v6/latest/USD');
    const j = (await r.json()) as { rates?: { RUB?: number } };
    if (sane(j.rates?.RUB)) return j.rates!.RUB!;
  } catch {
    /* offline */
  }
  return null;
}

export function saveRate(storage: Pick<Storage, 'setItem'> | null, value: number, now: number): Rate {
  const r = { value, at: now, live: true };
  try {
    storage?.setItem(KEY, JSON.stringify({ value, at: now }));
  } catch {
    /* private mode */
  }
  return r;
}

/** `12 450 ₽` or `$151` — roubles are the stored unit, dollars are shown at the rate. */
export function money(n: number, cur: Currency, rate: number) {
  if (cur === 'rub') return rub(n);
  const v = Math.round(n / rate) || 0;
  const s = Math.abs(v).toLocaleString('en-US');
  return `${v < 0 ? '-' : ''}$${s}`;
}

/** `1 $ = 81,6 ₽` */
export const rateLabel = (rate: number) => `1 $ = ${rate.toFixed(1).replace('.', ',')} ₽`;
