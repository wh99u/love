/**
 * Real photos of a car model, looked up from the browser (Wikimedia APIs allow
 * any site with `origin=*`): a view from above on Commons when there is one,
 * otherwise the lead picture of its English Wikipedia article.
 */

const API = 'https://en.wikipedia.org/w/api.php';
const COMMONS = 'https://commons.wikimedia.org/w/api.php';
/** file names of photos taken from above */
const ABOVE = /\b(top|above|overhead|aerial|birds?|bird's|draufsicht|vogelperspektive)\b/i;
const WIDTH = 1280;

interface Page {
  title: string;
  index?: number;
  thumbnail?: { source: string };
}

async function pages(params: Record<string, string>, get: typeof fetch): Promise<Page[]> {
  const q = new URLSearchParams({
    action: 'query',
    format: 'json',
    formatversion: '2',
    origin: '*',
    redirects: '1',
    prop: 'pageimages',
    piprop: 'thumbnail',
    pithumbsize: String(WIDTH),
    ...params,
  });
  const r = await get(`${API}?${q}`);
  if (!r.ok) return [];
  const j = (await r.json()) as { query?: { pages?: Page[] } };
  return (j.query?.pages ?? []).slice().sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
}

/** Drawings and logos are SVG; a car photo is not. */
const photoOf = (p: Page | undefined) => (p?.thumbnail && !/\.svg/i.test(p.thumbnail.source) ? p.thumbnail.source : null);

const words = (s: string) =>
  s
    .toLowerCase()
    .split(/[^a-z0-9а-яё]+/)
    .filter((w) => w.length > 1);

/** URL of a photo for the article (or, failing that, the best search hit); null when there is none. */
export async function findCarPhoto(article: string, model: string, get: typeof fetch = fetch): Promise<string | null> {
  const direct = photoOf((await pages({ titles: article }, get))[0]);
  if (direct) return direct;
  const key = words(model);
  const found = await pages({ generator: 'search', gsrsearch: article, gsrlimit: '5', gsrnamespace: '0' }, get);
  for (const p of found) {
    const url = photoOf(p);
    if (url && words(p.title).some((w) => key.includes(w))) return url;
  }
  return null;
}

interface FilePage {
  title: string;
  index?: number;
  imageinfo?: { url: string; thumburl?: string; mime: string }[];
}

/** A Commons photo of the model taken from above, like the reference shot; null when there is none. */
export async function findTopView(make: string, model: string, get: typeof fetch = fetch): Promise<string | null> {
  const q = new URLSearchParams({
    action: 'query',
    format: 'json',
    formatversion: '2',
    origin: '*',
    generator: 'search',
    gsrnamespace: '6',
    gsrlimit: '30',
    gsrsearch: `${make} ${model} top view`,
    prop: 'imageinfo',
    iiprop: 'url|mime',
    iiurlwidth: String(WIDTH),
  });
  const r = await get(`${COMMONS}?${q}`);
  if (!r.ok) return null;
  const j = (await r.json()) as { query?: { pages?: FilePage[] } };
  const need = [...words(make), ...words(model)];
  const files = (j.query?.pages ?? []).slice().sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  for (const f of files) {
    const info = f.imageinfo?.[0];
    const title = f.title.toLowerCase();
    if (!info || !/jpeg|png/.test(info.mime) || !ABOVE.test(title)) continue;
    if (need.every((w) => title.includes(w))) return info.thumburl ?? info.url;
  }
  return null;
}
