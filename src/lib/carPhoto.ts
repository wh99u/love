/**
 * A real photo of a car model: the lead picture of its English Wikipedia article,
 * looked up from the browser (the API allows any site with `origin=*`).
 */

const API = 'https://en.wikipedia.org/w/api.php';
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
