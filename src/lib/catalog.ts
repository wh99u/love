import type { CatalogItem } from './store';

/**
 * Things added for you from a store link live in public/catalog/items.json with their
 * cut-out pictures next to it. Every phone imports new items into the shared list once.
 */
export async function fetchCatalog(base = import.meta.env.BASE_URL): Promise<CatalogItem[]> {
  try {
    const res = await fetch(`${base}catalog/items.json`, { cache: 'no-cache' });
    if (!res.ok) return [];
    const data = (await res.json()) as { items?: unknown };
    return Array.isArray(data.items) ? data.items.filter(isItem) : [];
  } catch {
    return [];
  }
}

function isItem(x: unknown): x is CatalogItem {
  const o = x as Record<string, unknown>;
  return !!o && typeof o.id === 'string' && /^[\w-]{1,60}$/.test(o.id) && typeof o.title === 'string' && typeof o.price === 'number';
}
