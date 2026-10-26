import { describe, expect, test } from 'vitest';
import { AMOUNT_PATTERN, SHORTCUT_PATTERN, appLink, extractAmount, shortcutUrl } from './shortcut';

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

describe('site links', () => {
  test('the shortcut opens the site with an amount placeholder', () => {
    expect(shortcutUrl('https://me.github.io/love/')).toBe('https://me.github.io/love/?startapp=inc_');
  });
  test('invites carry the space id', () => {
    expect(appLink('join_Ab3dEf7hJk2mNp4qRs5t', 'https://me.github.io/love/')).toBe('https://me.github.io/love/?startapp=join_Ab3dEf7hJk2mNp4qRs5t');
  });
  test('no address, no link', () => {
    expect(appLink('inc_', '')).toBe('');
  });
});
