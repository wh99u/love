import { expect, test, vi } from 'vitest';
import { findCarPhoto } from './carPhoto';

const reply = (pages: unknown[]) => Promise.resolve({ ok: true, json: () => Promise.resolve({ query: { pages } }) } as Response);

test('the article photo comes first', async () => {
  const get = vi.fn(() => reply([{ title: 'Porsche Panamera', thumbnail: { source: 'https://upload.wikimedia.org/p/1280px-Panamera.jpg' } }]));
  expect(await findCarPhoto('Porsche Panamera', 'Panamera', get as unknown as typeof fetch)).toBe('https://upload.wikimedia.org/p/1280px-Panamera.jpg');
  const url = new URL((get.mock.calls[0] as unknown as [string])[0]);
  expect(url.searchParams.get('titles')).toBe('Porsche Panamera');
  expect(url.searchParams.get('origin')).toBe('*');
});

test('without an article photo a search hit about the model is used, never a logo', async () => {
  const get = vi
    .fn()
    .mockImplementationOnce(() => reply([{ title: 'Lada Iskra' }]))
    .mockImplementationOnce(() =>
      reply([
        { title: 'Lada', index: 2, thumbnail: { source: 'https://x/Lada_logo.svg.png' } },
        { title: 'AvtoVAZ', index: 1, thumbnail: { source: 'https://x/plant.jpg' } },
        { title: 'Lada Iskra (2024)', index: 3, thumbnail: { source: 'https://x/iskra.jpg' } },
      ]),
    );
  expect(await findCarPhoto('Lada Iskra', 'Iskra', get as unknown as typeof fetch)).toBe('https://x/iskra.jpg');
});

test('nothing found gives null', async () => {
  const get = vi.fn(() => reply([]));
  expect(await findCarPhoto('Nope', 'Nope', get as unknown as typeof fetch)).toBeNull();
});
