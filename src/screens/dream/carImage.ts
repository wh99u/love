import { actions, appStore } from '../../lib/appStore';
import { carFromName } from '../../lib/cars';
import { findCarPhoto } from '../../lib/carPhoto';
import { deleteImage, putImage } from '../../lib/images';

const tried = new Set<string>();

/**
 * Finds a photo of the dream car when its name changed. The user's own photo
 * is never replaced. A copy goes into the phone's storage, so it works offline
 * and reaches the partner; if the browser can't keep one, the link is saved.
 */
export async function ensureCarPhoto(): Promise<'found' | 'none' | 'skip'> {
  const car = appStore.get().shared.car;
  const want = car.name.trim();
  if (!want || (car.imgId && !car.photoFor) || car.photoFor === want || tried.has(want)) return 'skip';
  tried.add(want);
  const pick = carFromName(want);
  const url = await findCarPhoto(pick?.wiki ?? want, pick?.model ?? want).catch(() => null);
  if (!url) return 'none';

  let imgId: string | undefined;
  try {
    const r = await fetch(url);
    const blob = r.ok ? await r.blob() : null;
    if (blob?.type.startsWith('image/')) imgId = await putImage(blob);
  } catch {
    /* keep the link instead */
  }
  const now = appStore.get().shared.car;
  if (now.name.trim() !== want || (now.imgId && !now.photoFor)) {
    if (imgId) void deleteImage(imgId).catch(() => {});
    return 'skip';
  }
  if (now.imgId) void deleteImage(now.imgId).catch(() => {});
  actions.setCar({ imgId, photoUrl: imgId ? undefined : url, photoFor: want });
  return 'found';
}

/** Lets a renamed car try again in the same session. */
export const forgetCarPhotoTry = (name: string) => tried.delete(name.trim());
