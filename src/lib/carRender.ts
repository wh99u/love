/**
 * A neural render of the car exactly as in the reference: seen from above the
 * front, looking down at the hood and headlights, on a light studio floor.
 * Pollinations (FLUX) answers right from the browser without a key; a
 * publishable key in VITE_POLLINATIONS_KEY lifts its limits.
 */

const W = 768;
const H = 1024;
const TIMEOUT = 90_000;

export function renderPrompt(title: string) {
  return [
    `studio photograph of a silver ${title}`,
    'shot from a high angle above the front of the car, looking down at the long hood, both headlights and the front bumper',
    'windshield at the top edge of the frame, perfectly symmetrical, centered, the car fills the frame',
    'seamless light grey studio background, soft diffuse light, photorealistic, sharp details, no people, no text, no watermark',
  ].join(', ');
}

/** The same car always gets the same picture: the seed comes from its name. */
export function seedFor(title: string) {
  let h = 2166136261;
  for (const c of title.toLowerCase()) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return (h >>> 0) % 1_000_000;
}

export function renderUrl(title: string, key?: string) {
  const prompt = encodeURIComponent(renderPrompt(title));
  const q = new URLSearchParams({ width: String(W), height: String(H), seed: String(seedFor(title)), model: 'flux', nologo: 'true', enhance: 'false' });
  if (key) {
    q.set('key', key);
    return `https://gen.pollinations.ai/image/${prompt}?${q}`;
  }
  return `https://image.pollinations.ai/prompt/${prompt}?${q}`;
}

/** The rendered picture, or null when the service is busy, down or answered with something else. */
export async function renderCar(title: string, get: typeof fetch = fetch, key = import.meta.env.VITE_POLLINATIONS_KEY as string | undefined): Promise<Blob | null> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT);
  try {
    const r = await get(renderUrl(title, key), { signal: ctl.signal });
    if (!r.ok) return null;
    const blob = await r.blob();
    return blob.type.startsWith('image/') && blob.size > 20_000 ? blob : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
