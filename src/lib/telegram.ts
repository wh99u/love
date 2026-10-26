/* Platform glue. The app is a website now; inside Telegram the WebApp API still takes over (Back button, haptics). */

import { createBackStack } from './backStack';

interface Inset {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

type Handler = (...args: unknown[]) => void;

export interface TgWebApp {
  initData: string;
  initDataUnsafe: {
    start_param?: string;
    auth_date?: string | number;
    user?: { first_name: string; last_name?: string; photo_url?: string };
  };
  platform: string;
  isVersionAtLeast(v: string): boolean;
  ready(): void;
  expand(): void;
  setHeaderColor(c: string): void;
  setBackgroundColor(c: string): void;
  setBottomBarColor?(c: string): void;
  disableVerticalSwipes?(): void;
  requestFullscreen?(): void;
  safeAreaInset?: Inset;
  contentSafeAreaInset?: Inset;
  onEvent(e: string, cb: Handler): void;
  offEvent(e: string, cb: Handler): void;
  HapticFeedback?: {
    impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
    notificationOccurred(type: 'error' | 'success' | 'warning'): void;
    selectionChanged(): void;
  };
  BackButton?: { show(): void; hide(): void; onClick(cb: () => void): void; offClick(cb: () => void): void };
  DeviceOrientation?: {
    start(params: { refresh_rate?: number }, cb?: (ok: boolean) => void): void;
    stop(cb?: (ok: boolean) => void): void;
    beta: number;
    gamma: number;
  };
  openLink(url: string): void;
  openTelegramLink?(url: string): void;
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TgWebApp };
  }
}

export const tg: TgWebApp | undefined = typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined;

/** The SDK script also loads in a normal browser; real launches carry initData. */
export const isTelegram = !!tg && !!tg.initData;

const at = (v: string) => !!tg && isTelegram && tg.isVersionAtLeast(v);
const safe = (fn: () => void) => {
  try {
    fn();
  } catch {
    /* older clients lack the method */
  }
};

function applyInsets() {
  if (!tg) return;
  const root = document.documentElement.style;
  const sa = tg.safeAreaInset;
  const ca = tg.contentSafeAreaInset;
  if (sa) {
    root.setProperty('--sat', `${sa.top}px`);
    root.setProperty('--sab', `${sa.bottom}px`);
  }
  if (ca) root.setProperty('--csat', `${ca.top}px`);
}

export function initTelegram() {
  if (!tg || !isTelegram) return;
  safe(() => tg.ready());
  safe(() => tg.expand());
  safe(() => tg.setHeaderColor('#000000'));
  safe(() => tg.setBackgroundColor('#000000'));
  if (at('7.10')) safe(() => tg.setBottomBarColor?.('#000000'));
  if (at('7.7')) safe(() => tg.disableVerticalSwipes?.());
  if (at('8.0') && (tg.platform === 'ios' || tg.platform === 'android')) safe(() => tg.requestFullscreen?.());
  applyInsets();
  for (const e of ['safeAreaChanged', 'contentSafeAreaChanged', 'fullscreenChanged', 'viewportChanged']) safe(() => tg.onEvent(e, applyInsets));
}

export type HapticKind = 'light' | 'medium' | 'selection' | 'success' | 'warning' | 'error';

const VIBRATE: Record<HapticKind, number | number[]> = { light: 6, medium: 12, selection: 4, success: [8, 40, 8], warning: 18, error: [16, 40, 16] };

export function haptic(kind: HapticKind = 'light') {
  const h = isTelegram ? tg?.HapticFeedback : undefined;
  if (!h) {
    // Android browsers buzz; iPhone Safari has no vibration API and stays silent
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) safe(() => navigator.vibrate(VIBRATE[kind]));
    return;
  }
  safe(() => {
    if (kind === 'selection') h.selectionChanged();
    else if (kind === 'light' || kind === 'medium') h.impactOccurred(kind);
    else h.notificationOccurred(kind);
  });
}

let backHandler: (() => void) | null = null;
const tgBack = (top: (() => void) | null) => {
  const b = tg?.BackButton;
  if (!b) return;
  safe(() => {
    if (backHandler) b.offClick(backHandler);
    backHandler = top;
    if (top) {
      b.onClick(top);
      b.show();
    } else b.hide();
  });
};

/**
 * In a browser every open sheet or page owns one history entry, so the Back
 * button and the iPhone edge swipe close the newest one instead of leaving the site.
 */
function browserBack() {
  let top: (() => void) | null = null;
  let depth = 0;
  let pushed = 0;
  let skip = 0;
  let queued = false;
  const reconcile = () => {
    queued = false;
    if (depth > pushed) {
      while (pushed < depth) history.pushState({ plan: ++pushed }, '');
    } else if (depth < pushed) {
      const n = pushed - depth;
      pushed = depth;
      skip++;
      history.go(-n);
    }
  };
  window.addEventListener('popstate', () => {
    if (skip) {
      skip--;
      return;
    }
    if (pushed === 0) return;
    pushed--;
    top?.();
  });
  return (t: (() => void) | null, n: number) => {
    top = t;
    depth = n;
    // a page that re-registers its handler shrinks and grows the stack in one tick: settle once
    if (!queued) {
      queued = true;
      queueMicrotask(reconcile);
    }
  };
}

const webBack = !isTelegram && typeof window !== 'undefined' && typeof history !== 'undefined' ? browserBack() : null;
const backStack = createBackStack((top, depth) => (isTelegram ? tgBack(top) : webBack?.(top, depth)));

/** Back closes the newest sheet first, then the page: Telegram's button or the browser's. */
export const backButton = {
  available: isTelegram && !!tg?.BackButton,
  push: backStack.push,
};

/** One page load = one launch: a site link is honoured once, then its param is dropped from the address. */
const loadedAt = Date.now();

export function getLaunch(): { param: string | null; authDate: string | null } {
  const u = isTelegram ? tg?.initDataUnsafe : undefined;
  const query = typeof location !== 'undefined' ? new URLSearchParams(location.search) : null;
  const param = u?.start_param ?? query?.get('startapp') ?? query?.get('tgWebAppStartParam') ?? null;
  return {
    param,
    authDate: u?.auth_date != null ? String(u.auth_date) : param ? `web${loadedAt}` : null,
  };
}

/** Removes `?startapp=…` so a reload or a saved bookmark doesn't repeat the launch. */
export function clearLaunch() {
  if (isTelegram || typeof location === 'undefined') return;
  const url = new URL(location.href);
  if (!url.searchParams.has('startapp')) return;
  url.searchParams.delete('startapp');
  safe(() => history.replaceState(history.state, '', url.toString()));
}

export function getUser(): { firstName: string; photoUrl?: string } {
  const u = isTelegram ? tg?.initDataUnsafe.user : undefined;
  return u ? { firstName: u.first_name, photoUrl: u.photo_url } : { firstName: 'Я' };
}

export function openLink(url: string) {
  const full = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  if (isTelegram && tg) safe(() => tg.openLink(full));
  else window.open(full, '_blank', 'noopener');
}

/** System share sheet (Telegram, WhatsApp, Messages…); false when the browser has none. */
export function shareLink(url: string, text: string): boolean {
  if (isTelegram && tg?.openTelegramLink) {
    const share = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
    safe(() => tg.openTelegramLink!(share));
    return true;
  }
  if (typeof navigator !== 'undefined' && navigator.share) {
    navigator.share({ url, text }).catch(() => {});
    return true;
  }
  return false;
}
