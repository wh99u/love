import { describe, expect, test } from 'vitest';
import { AMOUNT_PATTERN, SHORTCUT_PATTERN, extractAmount, shortcutUrl } from './shortcut';

describe('extractAmount', () => {
  const cases: [string, number | null][] = [
    ['Т-Банк Пополнение на 5 000 ₽', 5000],
    ['Перевод от Иван И. +12 500 ₽', 12500],
    ['Зачисление зарплаты 30 000,00 ₽', 30000],
    ['СЧЁТ2202 14:05 зачисление 4500р Баланс: 12 345.67р', 4500],
    ['Альфа-Банк Поступление 7 300,00 RUR на счет *1234', 7300],
    ['ВТБ Поступление 2500.00 RUB Счет *1234 Баланс 10000.00 RUB', 2500],
    ['Озон Банк Входящий перевод 1 200 ₽ от Петр П.', 1200],
    ['Пополнение на 15 000 ₽', 15000],
    ['Покупка 350 ₽ Пятёрочка. Баланс 214 ₽', null],
    ['Списание 1 000 ₽', null],
    ['', null],
  ];
  test.each(cases)('%s → %s', (text, amount) => {
    expect(extractAmount(text)).toBe(amount);
  });
});

describe('patterns', () => {
  test('the iOS pattern is the JS pattern with an inline case flag', () => {
    expect(SHORTCUT_PATTERN).toBe(`(?i)${AMOUNT_PATTERN}`);
  });
});

describe('shortcutUrl', () => {
  test('appends startapp to a bot or app link', () => {
    expect(shortcutUrl('https://t.me/my_bot')).toBe('https://t.me/my_bot?startapp=inc_');
    expect(shortcutUrl('https://t.me/my_bot/app')).toBe('https://t.me/my_bot/app?startapp=inc_');
    expect(shortcutUrl('https://t.me/my_bot?x=1')).toBe('https://t.me/my_bot?x=1&startapp=inc_');
  });
  test('accepts a bare username', () => {
    expect(shortcutUrl('@my_bot')).toBe('https://t.me/my_bot?startapp=inc_');
    expect(shortcutUrl('t.me/my_bot')).toBe('https://t.me/my_bot?startapp=inc_');
  });
  test('empty link gives an empty url', () => {
    expect(shortcutUrl('  ')).toBe('');
  });
});
