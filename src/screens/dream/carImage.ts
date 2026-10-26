import { actions, appStore } from '../../lib/appStore';
import { carFromName } from '../../lib/cars';
import { cutOutCar } from '../../lib/carCutout';
import { findCarPhoto, findTopView } from '../../lib/carPhoto';
import { deleteImage, putImage } from '../../lib/images';

const tried = new Set<string>();

async function download(url: string): Promise<Blob | null> {
  try {
    const r = await fetch(url);
    const blob = r.ok ? await r.blob() : null;
    return blob?.type.startsWith('image/') ? blob : null;
  } catch {
    return null;
  }
}

/**
 * Finds a photo of the dream car when its name changed, as in the reference:
 * a view from above if Commons has one, else the Wikipedia photo, cut out of its
 * background so it stands on white. The user's own photo is never replaced.
 * The result goes into the phone's storage (offline, and to the partner).
 */
export async function ensureCarPhoto(): Promise<'found' | 'none' | 'skip'> {
  const car = appStore.get().shared.car;
  const want = car.name.trim();
  // an automatic photo from before the cut-outs (photoCut unset) is redone once
  if (!want || (car.imgId && !car.photoFor) || (car.photoFor === want && car.photoCut !== undefined) || tried.has(want)) return 'skip';
  tried.add(want);
  const pick = carFromName(want);
  const make = car.make ?? pick?.make ?? '';
  const model = car.model ?? pick?.model ?? want;

  const urls = [
    await findTopView(make, model).catch(() => null),
    await findCarPhoto(pick?.wiki ?? want, model).catch(() => null),
  ].filter((u): u is string => !!u);
  if (!urls.length) return 'none';

  let found: { blob: Blob; cut: boolean } | null = null;
  let firstUrl: string | null = null;
  for (const url of urls) {
    const blob = await download(url);
    if (!blob) continue;
    firstUrl ??= url;
    const cut = await cutOutCar(blob).catch(() => null);
    if (cut) {
      found = { blob: cut, cut: true };
      break;
    }
    found ??= { blob, cut: false };
  }

  const imgId = found ? await putImage(found.blob).catch(() => undefined) : undefined;
  const now = appStore.get().shared.car;
  if (now.name.trim() !== want || (now.imgId && !now.photoFor)) {
    if (imgId) void deleteImage(imgId).catch(() => {});
    return 'skip';
  }
  if (!imgId && !urls[0]) return 'none';
  if (now.imgId) void deleteImage(now.imgId).catch(() => {});
  actions.setCar({ imgId, photoUrl: imgId ? undefined : (firstUrl ?? urls[0]), photoFor: want, photoCut: imgId ? found?.cut : false });
  return 'found';
}

/** Lets a renamed car try again in the same session. */
export const forgetCarPhotoTry = (name: string) => tried.delete(name.trim());
