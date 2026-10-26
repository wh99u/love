import { actions, appStore } from '../../lib/appStore';
import { carFromName } from '../../lib/cars';
import { cutOutCar } from '../../lib/carCutout';
import { findCarPhoto, findTopView } from '../../lib/carPhoto';
import { renderCar } from '../../lib/carRender';
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
 * Gets the picture of the dream car when its name changed. First a neural
 * render seen from above the hood, exactly like the reference; if the service
 * fails, a real photo (a view from above on Commons, else Wikipedia) cut out of
 * its background. A render is retried on the next start until one comes; the
 * user's own photo is never replaced. The result goes into the phone's storage
 * (offline, and to the partner).
 */
export async function ensureCarPhoto(): Promise<'found' | 'none' | 'skip'> {
  const car = appStore.get().shared.car;
  const want = car.name.trim();
  if (!want || (car.imgId && !car.photoFor) || (car.photoFor === want && car.photoTop) || tried.has(want)) return 'skip';
  tried.add(want);
  const pick = carFromName(want);

  const render = await renderCar(pick?.title ?? want);
  if (render) return save(want, { blob: render, top: true, cut: false });
  // a photo for this name is already here: keep it until a render succeeds
  if (car.photoFor === want && (car.imgId || car.photoUrl)) return 'skip';

  const make = car.make ?? pick?.make ?? '';
  const model = car.model ?? pick?.model ?? want;
  const urls = [
    await findTopView(make, model).catch(() => null),
    await findCarPhoto(pick?.wiki ?? want, model).catch(() => null),
  ].filter((u): u is string => !!u);
  if (!urls.length) return 'none';

  for (const url of urls) {
    const blob = await download(url);
    if (!blob) continue;
    const cut = await cutOutCar(blob).catch(() => null);
    return save(want, cut ? { blob: cut, top: false, cut: true } : { blob, top: false, cut: false });
  }
  return save(want, null, urls[0]);
}

async function save(want: string, got: { blob: Blob; top: boolean; cut: boolean } | null, url?: string): Promise<'found' | 'skip'> {
  const imgId = got ? await putImage(got.blob).catch(() => undefined) : undefined;
  const now = appStore.get().shared.car;
  if (now.name.trim() !== want || (now.imgId && !now.photoFor)) {
    if (imgId) void deleteImage(imgId).catch(() => {});
    return 'skip';
  }
  if (now.imgId && now.imgId !== imgId) void deleteImage(now.imgId).catch(() => {});
  actions.setCar({
    imgId,
    photoUrl: imgId ? undefined : url,
    photoFor: want,
    photoCut: !!(imgId && got?.cut),
    photoTop: !!(imgId && got?.top),
  });
  return 'found';
}
/** Lets a renamed car try again in the same session. */
export const forgetCarPhotoTry = (name: string) => tried.delete(name.trim());
