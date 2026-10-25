import { describe, expect, test } from 'vitest';
import { emptyState } from '../defaults';
import type { Bank, Buy, StateV4 } from '../types';
import { applyRemote, confirm, entries, keyOf, pending, valid, type RemoteRec } from './merge';

type Shared = StateV4['shared'];

const bank = (id: string, sum: number, u: number, extra: Partial<Bank> = {}): Bank => ({ id, code: 'tbank', sum, order: 0, updatedAt: u, ...extra });
const buy = (id: string, title: string, u: number): Buy => ({ id, title, url: '', price: 100, updatedAt: u });
const shared = (patch: Partial<Shared> = {}): Shared => ({ ...emptyState(1).shared, ...patch });
const doc = (k: RemoteRec['k'], r: { id: string; updatedAt: number }): RemoteRec => ({ k, id: r.id, u: r.updatedAt, r: r as unknown as Record<string, unknown> });

describe('pending / confirm', () => {
  test('everything is pending before the first sync, nothing after confirm', () => {
    const s = shared({ banks: [bank('a', 10, 5)], buys: [buy('b', 'Стол', 6)] });
    const p = pending(s, {});
    expect(p.map((e) => keyOf(e.k, e.id))).toEqual(['banks~a', 'buys~b', 'car~car']);
    expect(pending(s, confirm({}, p))).toEqual([]);
  });

  test('a later local edit becomes pending again', () => {
    const s = shared({ banks: [bank('a', 10, 5)] });
    const base = confirm({}, pending(s, {}));
    const edited = shared({ banks: [bank('a', 20, 9)] });
    expect(pending(edited, base).map((e) => e.id)).toEqual(['a']);
  });

  test('confirm never moves the base backwards', () => {
    const base = { 'banks~a': { u: 9, sum: 20 } };
    expect(confirm(base, [doc('banks', bank('a', 10, 5))])['banks~a']).toEqual({ u: 9, sum: 20 });
  });
});

describe('applyRemote', () => {
  test('new remote records are added', () => {
    const r = applyRemote(shared(), {}, [doc('buys', buy('x', 'Куртка', 3))]);
    expect(r.changed).toBe(true);
    expect(r.shared.buys.map((b) => b.title)).toEqual(['Куртка']);
    expect(pending(r.shared, r.base).filter((e) => e.k === 'buys')).toEqual([]);
  });

  test('our own echo changes nothing', () => {
    const s = shared({ buys: [buy('x', 'Куртка', 3)] });
    const base = confirm({}, pending(s, {}));
    const r = applyRemote(s, base, [doc('buys', buy('x', 'Куртка', 3))]);
    expect(r.changed).toBe(false);
    expect(r.shared).toBe(s);
  });

  test('a newer remote edit replaces an untouched local record', () => {
    const s = shared({ buys: [buy('x', 'Куртка', 3)] });
    const base = confirm({}, pending(s, {}));
    const r = applyRemote(s, base, [doc('buys', buy('x', 'Пуховик', 7))]);
    expect(r.shared.buys[0].title).toBe('Пуховик');
    expect(pending(r.shared, r.base).filter((e) => e.k === 'buys')).toEqual([]);
  });

  test('an outdated remote copy is ignored', () => {
    const s = shared({ buys: [buy('x', 'Новое', 9)] });
    const base = { 'buys~x': { u: 9 } };
    const r = applyRemote(s, base, [doc('buys', buy('x', 'Старое', 4))]);
    expect(r.changed).toBe(false);
  });

  test('concurrent edits of a purchase: the later one wins on both sides', () => {
    const base = { 'buys~x': { u: 3 } };
    const mine = shared({ buys: [buy('x', 'Моё', 8)] });
    const theirs = buy('x', 'Их', 6);
    const r = applyRemote(mine, base, [doc('buys', theirs)]);
    expect(r.shared.buys[0].title).toBe('Моё');
    expect(pending(r.shared, r.base).map((e) => e.id)).toContain('x'); // ours goes up and wins there too

    const r2 = applyRemote(shared({ buys: [theirs] }), base, [doc('buys', buy('x', 'Моё', 8))]);
    expect(r2.shared.buys[0].title).toBe('Моё');
  });

  test('two top-ups of the same card at once both count', () => {
    const base = { 'banks~a': { u: 5, sum: 1000 } };
    const mine = shared({ banks: [bank('a', 1500, 8)] }); // +500 here
    const r = applyRemote(mine, base, [doc('banks', bank('a', 1300, 7))]); // +300 there
    expect(r.shared.banks[0].sum).toBe(1800);
    const up = pending(r.shared, r.base);
    expect(up.find((e) => e.id === 'a')?.r.sum).toBe(1800);

    // the other phone then receives the merged card and simply takes it
    const other = shared({ banks: [bank('a', 1300, 7)] });
    const r2 = applyRemote(other, { 'banks~a': { u: 7, sum: 1300 } }, up);
    expect(r2.shared.banks[0].sum).toBe(1800);
  });

  test('a card deleted there while edited here keeps the newer decision and our delta', () => {
    const base = { 'banks~a': { u: 5, sum: 1000 } };
    const mine = shared({ banks: [bank('a', 1200, 6)] });
    const r = applyRemote(mine, base, [doc('banks', bank('a', 1000, 9, { deleted: true }))]);
    expect(r.shared.banks[0]).toMatchObject({ deleted: true, sum: 1200 });
  });

  test('the car is synced as one record', () => {
    const car = { name: 'Porsche 911', price: 1, date: '', color: '#000', updatedAt: 50 };
    const r = applyRemote(shared(), {}, [{ k: 'car', id: 'car', u: 50, r: car }]);
    expect(r.shared.car.name).toBe('Porsche 911');
  });

  test('broken records are skipped', () => {
    const bad = [
      { k: 'banks', id: 'a', u: 1, r: { id: 'a', updatedAt: 1, code: 'nope', sum: 1, order: 0 } },
      { k: 'banks', id: 'b', u: 1, r: { id: 'c', updatedAt: 1, code: 'sber', sum: 1, order: 0 } },
      { k: 'users', id: 'x', u: 1, r: { id: 'x', updatedAt: 1 } },
      { k: 'buys', id: 'y', u: 1, r: null },
    ] as unknown as RemoteRec[];
    expect(bad.some(valid)).toBe(false);
    expect(applyRemote(shared(), {}, bad).changed).toBe(false);
  });

  test('tombstones are valid without the other fields', () => {
    expect(valid({ k: 'buys', id: 'z', u: 2, r: { id: 'z', updatedAt: 2, deleted: true } })).toBe(true);
  });

  test('entries cover every shared list and the car', () => {
    const s = shared({ buyLists: [{ id: 'l', name: 'Одежда', order: 0, updatedAt: 1 }] });
    expect(entries(s).map((e) => e.k)).toEqual(['buyLists', 'car']);
  });
});

describe('same millisecond', () => {
  test('two different edits with one timestamp still merge the card', () => {
    const base = { 'banks~a': { u: 5, sum: 1000 } };
    const r = applyRemote(shared({ banks: [bank('a', 1500, 8)] }), base, [doc('banks', bank('a', 1300, 8))]);
    expect(r.shared.banks[0].sum).toBe(1800);
  });

  test('both phones pick the same purchase', () => {
    const x = buy('x', 'Один', 8);
    const y = buy('x', 'Два', 8);
    const base = { 'buys~x': { u: 3 } };
    const onA = applyRemote(shared({ buys: [x] }), base, [doc('buys', y)]).shared.buys[0].title;
    const onB = applyRemote(shared({ buys: [y] }), base, [doc('buys', x)]).shared.buys[0].title;
    expect(onA).toBe(onB);
  });

  test('field order from the server does not matter', () => {
    const s = shared({ buys: [buy('x', 'Стол', 3)] });
    const reordered = { updatedAt: 3, price: 100, url: '', title: 'Стол', id: 'x' };
    expect(applyRemote(s, {}, [{ k: 'buys', id: 'x', u: 3, r: reordered }]).changed).toBe(false);
  });
});
