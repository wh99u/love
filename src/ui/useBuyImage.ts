import type { Buy } from '../lib/types';
import { useImage } from './useImage';

/** A purchase's picture: a photo saved on the phone, or one shipped with the app (catalog). */
export function useBuyImage(buy?: Pick<Buy, 'imgId' | 'src'>): string | null {
  const stored = useImage(buy?.imgId);
  if (buy?.imgId) return stored;
  return buy?.src ? `${import.meta.env.BASE_URL}${buy.src}` : null;
}
