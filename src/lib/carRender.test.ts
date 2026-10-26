import { expect, test, vi } from 'vitest';
import { renderCar, renderPrompt, renderUrl, seedFor } from './carRender';

test('the prompt asks for the reference view of that very car', () => {
  const p = renderPrompt('Porsche Panamera');
  expect(p).toContain('silver Porsche Panamera');
  expect(p).toContain('high angle above the front');
  expect(p).toContain('hood');
});

test('one name, one seed, one picture', () => {
  expect(seedFor('Kia Rio')).toBe(seedFor('kia rio'));
  expect(seedFor('Kia Rio')).not.toBe(seedFor('Kia Ceed'));
  const u = new URL(renderUrl('Kia Rio'));
  expect(u.host).toBe('image.pollinations.ai');
  expect(u.searchParams.get('seed')).toBe(String(seedFor('Kia Rio')));
  expect(u.searchParams.get('height')).toBe('1024');
  expect(new URL(renderUrl('Kia Rio', 'pk_x')).host).toBe('gen.pollinations.ai');
});

const answer = (type: string, size: number, ok = true) => Promise.resolve({ ok, blob: () => Promise.resolve(new Blob([new Uint8Array(size)], { type })) } as Response);

test('only a real picture counts', async () => {
  expect(await renderCar('Kia Rio', vi.fn(() => answer('image/jpeg', 90_000)) as unknown as typeof fetch, '')).not.toBeNull();
  expect(await renderCar('Kia Rio', vi.fn(() => answer('application/json', 90_000)) as unknown as typeof fetch, '')).toBeNull();
  expect(await renderCar('Kia Rio', vi.fn(() => answer('image/jpeg', 500)) as unknown as typeof fetch, '')).toBeNull();
  expect(await renderCar('Kia Rio', vi.fn(() => answer('image/jpeg', 90_000, false)) as unknown as typeof fetch, '')).toBeNull();
  expect(await renderCar('Kia Rio', vi.fn(() => Promise.reject(new Error('down'))) as unknown as typeof fetch, '')).toBeNull();
});
