import { expect, test, vi } from 'vitest';
import { createBackStack } from './backStack';

test('the newest handler owns the back button', () => {
  const apply = vi.fn();
  const stack = createBackStack(apply);
  const page = vi.fn();
  const sheet = vi.fn();
  const popPage = stack.push(page);
  expect(apply).toHaveBeenLastCalledWith(page);
  const popSheet = stack.push(sheet);
  expect(apply).toHaveBeenLastCalledWith(sheet);
  popSheet();
  expect(apply).toHaveBeenLastCalledWith(page);
  popPage();
  expect(apply).toHaveBeenLastCalledWith(null);
});

test('popping out of order keeps the right top', () => {
  const apply = vi.fn();
  const stack = createBackStack(apply);
  const a = vi.fn();
  const b = vi.fn();
  const popA = stack.push(a);
  stack.push(b);
  popA();
  expect(apply).toHaveBeenLastCalledWith(b);
});

test('popping twice is harmless', () => {
  const apply = vi.fn();
  const stack = createBackStack(apply);
  const pop = stack.push(vi.fn());
  pop();
  pop();
  expect(apply).toHaveBeenLastCalledWith(null);
});
