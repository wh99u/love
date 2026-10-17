import { describe, expect, test } from 'vitest';
import { emptyState } from './defaults';
import { bankCodeFromLegacy, migrateV3 } from './migrate';

const v3 = {
  banks: [
    { id: 1, code: 'sber', sum: 5000 },
    { id: 2, name: 'Альфа-Банк', sum: 100 },
  ],
  car: { name: 'BMW M5', price: 9000000, date: '2027-05-01', color: '#1f4fbf', img: '' },
  buys: [{ id: 3, title: 'Стол', url: '', price: 12000 }],
  shifts: [
    { id: 4, date: '2026-10-01', type: 'd', pay: 4500, h: 12 },
    { id: 5, date: '2026-10-02', type: 'n', pay: 5000 },
  ],
  tasks: [{ id: 6, title: 'Позвонить', due: '2026-10-03', done: false }],
  plan: 12,
};

describe('migrateV3', () => {
  test('carries every legacy collection over with string ids', () => {
    const s = migrateV3(v3, 1000);
    expect(s.v).toBe(4);
    expect(s.shared.banks.map((b) => [b.id, b.code, b.sum, b.order])).toEqual([
      ['1', 'sber', 5000, 0],
      ['2', 'alfa', 100, 1],
    ]);
    expect(s.shared.car).toMatchObject({ name: 'BMW M5', price: 9000000, date: '2027-05-01', color: '#1f4fbf', updatedAt: 1000 });
    expect(s.shared.buys[0]).toMatchObject({ id: '3', title: 'Стол', price: 12000, url: '' });
    expect(s.personal.shifts[0]).toMatchObject({ id: '4', date: '2026-10-01', type: 'd', pay: 4500, h: 12 });
    expect(s.personal.shifts[1].h).toBe(0);
    expect(s.personal.tasks[0]).toMatchObject({ id: '6', title: 'Позвонить', desc: '', due: '2026-10-03', done: false });
    expect(s.personal.plan).toBe(12);
    expect(s.shared.incomes).toEqual([]);
    expect(s.shared.budgets).toEqual([]);
    expect(s.shared.spends).toEqual([]);
  });

  test('does not mutate the legacy object', () => {
    const copy = JSON.parse(JSON.stringify(v3));
    migrateV3(copy, 1);
    expect(copy).toEqual(v3);
  });

  test('survives garbage and drops unusable records', () => {
    const s = migrateV3({ banks: 'x', car: null, shifts: [{}], tasks: [{ title: '' }], buys: [null] }, 1);
    expect(s.shared.banks).toEqual([]);
    expect(s.personal.shifts).toEqual([]);
    expect(s.personal.tasks).toEqual([]);
    expect(s.shared.buys).toEqual([]);
    expect(s.shared.car.name).toBe('Porsche Panamera');
  });

  test('null becomes an empty state', () => {
    expect(migrateV3(null, 1)).toMatchObject({
      v: 4,
      shared: { banks: [], buys: [], car: { name: 'Porsche Panamera', price: 0 } },
      personal: { shifts: [], tasks: [], plan: 15 },
    });
  });
});

describe('bankCodeFromLegacy', () => {
  test('follows the legacy name rules', () => {
    expect(bankCodeFromLegacy({ code: 'vtb' })).toBe('vtb');
    expect(bankCodeFromLegacy({ name: 'Сбербанк' })).toBe('sber');
    expect(bankCodeFromLegacy({ name: 'ВТБ' })).toBe('vtb');
    expect(bankCodeFromLegacy({ name: 'Ozon' })).toBe('ozon');
    expect(bankCodeFromLegacy({ name: 'Что-то' })).toBe('tbank');
    expect(bankCodeFromLegacy({ code: 'nonsense' })).toBe('tbank');
  });
});

describe('emptyState', () => {
  test('defaults', () => {
    const s = emptyState(5);
    expect(s.shared.car).toEqual({ name: 'Porsche Panamera', price: 0, date: '', color: '#1c1c1e', updatedAt: 5 });
    expect(s.personal.settings).toEqual({ botLink: '' });
    expect(s.personal.processedLaunches).toEqual([]);
  });
});
