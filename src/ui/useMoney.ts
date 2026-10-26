import { useSyncExternalStore } from 'react';
import { actions, useStore } from '../lib/appStore';
import { fetchRate, money, rateIsFresh, readRate, saveRate, type Rate } from '../lib/currency';

const storage = typeof localStorage !== 'undefined' ? localStorage : null;
let rate: Rate = readRate(storage);
const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

let loading = false;
/** Fetches today's dollar rate unless a fresh one is cached. */
export async function refreshRate() {
  if (loading || rateIsFresh(rate, Date.now())) return;
  loading = true;
  try {
    const v = await fetchRate();
    if (v) {
      rate = saveRate(storage, v, Date.now());
      listeners.forEach((fn) => fn());
    }
  } finally {
    loading = false;
  }
}

/** Formats roubles in the currency picked on the home screen. */
export function useMoney() {
  const cur = useStore((s) => s.personal.settings.currency ?? 'rub');
  const r = useSyncExternalStore(subscribe, () => rate);
  return {
    cur,
    rate: r.value,
    live: r.live,
    fmt: (n: number) => money(n, cur, r.value),
    toggle: () => actions.setSettings({ currency: cur === 'rub' ? 'usd' : 'rub' }),
  };
}
