import { useEffect, useState } from 'react';
import { getImageUrl } from '../lib/images';

/** Object URL for an image stored in IndexedDB, or null while loading / missing. */
export function useImage(id?: string): string | null {
  const [url, setUrl] = useState<{ id?: string; url: string | null }>({ url: null });
  useEffect(() => {
    if (!id) return;
    let alive = true;
    getImageUrl(id)
      .then((u) => alive && setUrl({ id, url: u }))
      .catch(() => alive && setUrl({ id, url: null }));
    return () => {
      alive = false;
    };
  }, [id]);
  return id && url.id === id ? url.url : null;
}
