/* The only module that touches window.Telegram. Everything degrades to no-ops in a plain browser. */

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

export function haptic(kind: HapticKind = 'light') {
  const h = isTelegram ? tg?.HapticFeedback : undefined;
  if (!h) return;
  safe(() => {
    if (kind === 'selection') h.selectionChanged();
    else if (kind === 'light' || kind === 'medium') h.impactOccurred(kind);
    else h.notificationOccurred(kind);
  });
}

let backHandler: (() => void) | null = null;
const backStack = createBackStack((top) => {
  const b = isTelegram ? tg?.BackButton : undefined;
  if (!b) return;
  safe(() => {
    if (backHandler) b.offClick(backHandler);
    backHandler = top;
    if (top) {
      b.onClick(top);
      b.show();
    } else b.hide();
  });
});

/** Telegram's Back button closes the newest sheet first, then the page. */
export const backButton = {
  available: isTelegram && !!tg?.BackButton,
  push: backStack.push,
};

export function getLaunch(): { param: string | null; authDate: string | null } {
  const u = isTelegram ? tg?.initDataUnsafe : undefined;
  const query = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('tgWebAppStartParam') : null;
  return {
    param: u?.start_param ?? query ?? null,
    authDate: u?.auth_date != null ? String(u.auth_date) : null,
  };
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
