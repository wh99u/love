import { describe, expect, test } from 'vitest';
import { launchKey, parseJoinParam, parseStartParam } from './startParam';

describe('parseStartParam', () => {
  test('amount with a bank', () => {
    expect(parseStartParam('inc_5000_tbank')).toEqual({ kind: 'inc', amount: 5000, bank: 'tbank' });
  });
  test('amount only', () => {
    expect(parseStartParam('inc_250')).toEqual({ kind: 'inc', amount: 250 });
  });
  test('upper bound is ten million', () => {
    expect(parseStartParam('inc_10000000')).toEqual({ kind: 'inc', amount: 10000000 });
  });
  test.each(['inc_0', 'inc_10000001', 'inc_5000_bank', 'inc_-5', 'inc_5 000', 'join_x', '', null, undefined])('rejects %s', (bad) => {
    expect(parseStartParam(bad)).toBeNull();
  });
});

describe('launchKey', () => {
  test('pairs auth date with the param', () => {
    expect(launchKey('1760000000', 'inc_5')).toBe('1760000000:inc_5');
    expect(launchKey(undefined, 'inc_5')).toBe('na:inc_5');
    expect(launchKey(null, 'inc_5')).toBe('na:inc_5');
  });
});

describe('parseJoinParam', () => {
  test('a 20-character space id', () => {
    expect(parseJoinParam('join_Ab3dEf7hJk2mNp4qRs5t')).toEqual({ kind: 'join', space: 'Ab3dEf7hJk2mNp4qRs5t' });
  });
  test.each(['join_short', 'join_Ab3dEf7hJk2mNp4qRs5t_', 'inc_500', 'join_Ab3dEf7hJk2mNp4qRs5-', null])('rejects %s', (bad) => {
    expect(parseJoinParam(bad)).toBeNull();
  });
});
