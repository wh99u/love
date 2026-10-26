import { mainCard } from '../lib/store';
import { useStore } from '../lib/appStore';
import { cx } from './cx';
import { useImage } from './useImage';

/**
 * The card as a picture: the image set in the card sheet, or a plain black
 * card until there is one.
 */
export function CardArt({ className }: { className?: string }) {
  const imgId = useStore((s) => mainCard(s)?.imgId);
  const url = useImage(imgId);
  if (url) return <span className={cx('card-art', className)} style={{ backgroundImage: `url(${url})` }} role="img" aria-label="Карта Т-Банка" />;
  return (
    <span className={cx('card-art card-art--plain', className)} role="img" aria-label="Карта Т-Банка">
      <b>Т-Банк</b>
      <i />
    </span>
  );
}
