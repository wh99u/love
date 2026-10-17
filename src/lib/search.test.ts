import { expect, test } from 'vitest';
import { demoState } from './demo';
import { searchAll } from './search';

const s = demoState(new Date(2026, 9, 17));

test('finds purchases regardless of case', () => {
  const hits = searchAll(s, 'СТОЛ');
  expect(hits.some((h) => h.group === 'buys' && h.title === 'Стол')).toBe(true);
});

test('finds tasks by their description', () => {
  const hits = searchAll(s, 'тест-драйв');
  expect(hits).toEqual([expect.objectContaining({ group: 'tasks', title: 'Позвонить в автосалон' })]);
});

test('finds categories and spend notes', () => {
  expect(searchAll(s, 'жильё').some((h) => h.group === 'categories')).toBe(true);
  expect(searchAll(s, 'концерт').some((h) => h.group === 'spends')).toBe(true);
});

test('finds incomes by amount', () => {
  expect(searchAll(s, '30000').some((h) => h.group === 'incomes')).toBe(true);
  expect(searchAll(s, '30 000').some((h) => h.group === 'incomes')).toBe(true);
});

test('blank query finds nothing', () => {
  expect(searchAll(s, '   ')).toEqual([]);
});

test('deleted records are not found', () => {
  const gone = { ...s, shared: { ...s.shared, buys: s.shared.buys.map((b) => (b.title === 'Стол' ? { ...b, deleted: true as const } : b)) } };
  expect(searchAll(gone, 'стол').filter((h) => h.group === 'buys')).toEqual([]);
});

test('caps results at 30', () => {
  const many = { ...s, shared: { ...s.shared, buys: Array.from({ length: 50 }, (_, i) => ({ id: `b${i}`, title: `Лампа ${i}`, url: '', price: 1, updatedAt: 0 })) } };
  expect(searchAll(many, 'лампа')).toHaveLength(30);
});
