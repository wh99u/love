import { expect, test, vi } from 'vitest';
import { findCarPhoto, findTopView } from './carPhoto';

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

test('a view from above must name the car and say it is from above', async () => {
  const get = vi.fn(() =>
    reply([
      { title: 'File:Porsche Panamera side.jpg', index: 1, imageinfo: [{ url: 'u1', thumburl: 't1', mime: 'image/jpeg' }] },
      { title: 'File:BMW X5 top view.jpg', index: 2, imageinfo: [{ url: 'u2', thumburl: 't2', mime: 'image/jpeg' }] },
      { title: 'File:Porsche Panamera top view diagram.svg', index: 3, imageinfo: [{ url: 'u3', mime: 'image/svg+xml' }] },
      { title: 'File:2017 Porsche Panamera 4S from above.jpg', index: 4, imageinfo: [{ url: 'u4', thumburl: 't4', mime: 'image/jpeg' }] },
    ]),
  );
  expect(await findTopView('Porsche', 'Panamera', get as unknown as typeof fetch)).toBe('t4');
  const url = new URL((get.mock.calls[0] as unknown as [string])[0]);
  expect(url.host).toBe('commons.wikimedia.org');
  expect(url.searchParams.get('gsrnamespace')).toBe('6');
});

test('no view from above gives null', async () => {
  const get = vi.fn(() => reply([{ title: 'File:Kia Rio 2017.jpg', imageinfo: [{ url: 'u', mime: 'image/jpeg' }] }]));
  expect(await findTopView('Kia', 'Rio', get as unknown as typeof fetch)).toBeNull();
});
