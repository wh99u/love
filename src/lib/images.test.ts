// @vitest-environment node
import 'fake-indexeddb/auto';
import { expect, test } from 'vitest';
import { deleteImage, getImageBlob, getImageUrl, imagesAvailable, putImage } from './images';

test('images round-trip through IndexedDB', async () => {
  expect(await imagesAvailable()).toBe(true);
  const id = await putImage(new Blob([new Uint8Array([1, 2, 3])], { type: 'image/png' }));
  const back = await getImageBlob(id);
  expect(back?.type).toBe('image/png');
  expect(new Uint8Array(await back!.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]));
  expect(typeof (await getImageUrl(id))).toBe('string');
  await deleteImage(id);
  expect(await getImageBlob(id)).toBeNull();
  expect(await getImageUrl(id)).toBeNull();
});

test('unknown id is null', async () => {
  expect(await getImageBlob('nope')).toBeNull();
});
