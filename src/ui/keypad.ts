export const KEYPAD_MAX = 1_000_000_000;

/** Pure keypad logic: digits as a string, no leading zeros, capped at a billion. */
export function keypadReduce(value: string, key: string): string {
  if (key === '⌫') return value.slice(0, -1);
  if (!/^(\d|000)$/.test(key)) return value;
  const next = (value + key).replace(/^0+/, '');
  return Number(next || 0) > KEYPAD_MAX ? value : next;
}
