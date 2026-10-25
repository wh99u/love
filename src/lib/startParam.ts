import type { BankCode } from './types';

export interface IncomeLaunch {
  kind: 'inc';
  amount: number;
  bank?: BankCode;
}

/** Invite into a shared plan: `join_<space id>`. */
export interface JoinLaunch {
  kind: 'join';
  space: string;
}

const JOIN = /^join_([A-Za-z0-9]{20})$/;

export function parseJoinParam(p: string | null | undefined): JoinLaunch | null {
  const m = p ? JOIN.exec(p) : null;
  return m ? { kind: 'join', space: m[1] } : null;
}

const INC = /^inc_(\d{1,8})(?:_(alfa|sber|vtb|tbank|ozon))?$/;
const MAX = 10_000_000;

/** `inc_5000` or `inc_5000_tbank` from a t.me/…?startapp= link. */
export function parseStartParam(p: string | null | undefined): IncomeLaunch | null {
  const m = p ? INC.exec(p) : null;
  if (!m) return null;
  const amount = Number(m[1]);
  if (amount < 1 || amount > MAX) return null;
  return m[2] ? { kind: 'inc', amount, bank: m[2] as BankCode } : { kind: 'inc', amount };
}

/** Telegram keeps start_param across reloads of one launch; auth_date tells launches apart. */
export const launchKey = (authDate: string | number | null | undefined, param: string) => `${authDate ?? 'na'}:${param}`;
