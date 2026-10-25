import { BANK_CODES, type Bank, type Car, type Rec, type StateV4 } from '../types';

/* Pure two-way sync of the shared half of the state. Each record travels on its own
   and the newer `updatedAt` wins, except card balances: when both people changed the
   same card since the last sync, both changes are kept (base + their Δ + our Δ). */

type Shared = StateV4['shared'];

export const LISTS = ['banks', 'incomes', 'buys', 'buyLists', 'budgets', 'spends'] as const;
export type ListName = (typeof LISTS)[number];
export type Kind = ListName | 'car';

/** A record as stored on the server. */
export interface RemoteRec {
  k: Kind;
  id: string;
  /** updatedAt of the record */
  u: number;
  r: Record<string, unknown>;
}

/** What we last agreed on with the server, per record. */
export interface Base {
  u: number;
  sum?: number;
}
export type BaseMap = Record<string, Base>;

export const keyOf = (k: Kind, id: string) => `${k}~${id}`;

const CAR_ID = 'car';

export function entries(shared: Shared): RemoteRec[] {
  const out: RemoteRec[] = [];
  for (const k of LISTS) for (const r of shared[k] as Rec[]) out.push({ k, id: r.id, u: r.updatedAt, r: r as unknown as Record<string, unknown> });
  out.push({ k: 'car', id: CAR_ID, u: shared.car.updatedAt, r: shared.car as unknown as Record<string, unknown> });
  return out;
}

const baseOf = (e: RemoteRec): Base => (e.k === 'banks' ? { u: e.u, sum: Number(e.r.sum) || 0 } : { u: e.u });

/** Local records the server has not seen yet. */
export function pending(shared: Shared, base: BaseMap): RemoteRec[] {
  return entries(shared).filter((e) => {
    const b = base[keyOf(e.k, e.id)];
    return !b || e.u > b.u;
  });
}

/** Marks records as stored on the server. */
export function confirm(base: BaseMap, sent: RemoteRec[]): BaseMap {
  const next = { ...base };
  for (const e of sent) {
    const key = keyOf(e.k, e.id);
    const b = next[key];
    if (!b || e.u >= b.u) next[key] = baseOf(e);
  }
  return next;
}

const isObj = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x);
const str = (x: unknown) => typeof x === 'string';
const num = (x: unknown) => typeof x === 'number' && Number.isFinite(x);

/** Rejects records an older or broken client could have written, so they never crash the UI. */
export function valid(d: unknown): d is RemoteRec {
  if (!isObj(d) || !str(d.id) || !num(d.u) || !isObj(d.r)) return false;
  const r = d.r;
  if (d.k === 'car') return str(r.name) && num(r.price) && num(r.updatedAt);
  if (!(LISTS as readonly string[]).includes(d.k as string) || r.id !== d.id || r.updatedAt !== d.u) return false;
  if (r.deleted) return true;
  switch (d.k as ListName) {
    case 'banks':
      return BANK_CODES.includes(r.code as Bank['code']) && num(r.sum) && num(r.order);
    case 'incomes':
      return str(r.date) && num(r.amount) && str(r.bankId);
    case 'buys':
      return str(r.title) && num(r.price);
    case 'buyLists':
      return str(r.name) && num(r.order);
    case 'budgets':
      return str(r.ym) && num(r.income) && Array.isArray(r.cats);
    case 'spends':
      return str(r.ym) && str(r.catId) && num(r.amount);
  }
}

/** JSON with sorted keys: the server may return fields in another order. */
function stable(x: unknown): string {
  return JSON.stringify(x, (_, v) => (isObj(v) ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, v[k]])) : v));
}

export interface MergeResult {
  shared: Shared;
  base: BaseMap;
  /** true when the local state changed and has to be re-rendered and saved */
  changed: boolean;
}

/** Folds server records into the local state. */
export function applyRemote(shared: Shared, base: BaseMap, docs: RemoteRec[]): MergeResult {
  const nextBase = { ...base };
  const lists = Object.fromEntries(LISTS.map((k) => [k, new Map((shared[k] as Rec[]).map((r) => [r.id, r]))])) as Record<ListName, Map<string, Rec>>;
  let car = shared.car;
  let changed = false;

  for (const doc of docs) {
    if (!valid(doc)) continue;
    const key = keyOf(doc.k, doc.id);
    const b = base[key];
    const local = doc.k === 'car' ? (car as unknown as Rec) : lists[doc.k].get(doc.id);
    const put = (r: Record<string, unknown>) => {
      changed = true;
      if (doc.k === 'car') car = r as unknown as Car;
      else lists[doc.k].set(doc.id, r as unknown as Rec);
    };

    if (!local) {
      put(doc.r);
      nextBase[key] = baseOf(doc);
      continue;
    }
    const tie = local.updatedAt === doc.u;
    if (tie && stable(local) === stable(doc.r)) {
      nextBase[key] = baseOf(doc);
      continue;
    }
    if (b && doc.u <= b.u) continue; // our own echo or an outdated copy

    // Same millisecond on two phones: both pick the same winner by content.
    const remoteNewer = doc.u > local.updatedAt || (tie && stable(doc.r) > stable(local));
    const localChanged = !b || local.updatedAt > b.u;
    if (!localChanged || !b) {
      // Nothing to protect locally (or nothing to compare with): the newer one wins.
      if (remoteNewer) put(doc.r);
      nextBase[key] = baseOf(doc);
      continue;
    }

    // Both sides changed since the last sync.
    nextBase[key] = baseOf(doc);
    if (doc.k === 'banks') {
      const mine = local as Bank;
      const sum = (Number(doc.r.sum) || 0) + mine.sum - (b.sum ?? mine.sum);
      const winner = remoteNewer ? doc.r : (mine as unknown as Record<string, unknown>);
      put({ ...winner, sum, updatedAt: Math.max(doc.u, mine.updatedAt) + 1 });
    } else if (remoteNewer) put(doc.r);
  }

  if (!changed) return { shared, base: nextBase, changed };
  const next = { ...shared, car } as Shared;
  for (const k of LISTS) (next as Record<ListName, Rec[]>)[k] = [...lists[k].values()];
  return { shared: next, base: nextBase, changed };
}
