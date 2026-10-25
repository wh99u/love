import { motion } from 'motion/react';
import { useRef, type CSSProperties } from 'react';
import { alpha, glowColor, paletteFor } from '../../lib/color';
import { rub } from '../../lib/money';
import { haptic } from '../../lib/telegram';
import type { Buy } from '../../lib/types';
import { Icon } from '../../ui/Icon';
import { springs } from '../../ui/motion';
import { ProductIcon } from '../../ui/ProductIcon';
import { productIconFor } from '../../ui/productIcons';
import { useBuyImage } from '../../ui/useBuyImage';

const LONG_PRESS = 450;

interface BuyCardProps {
  buy: Buy;
  index: number;
  onOpen: (b: Buy) => void;
  onMenu: (b: Buy) => void;
}

/** Card with the product (cut-out photo or a big solid picture) taking its upper half and popping over the edge. */
export function BuyCard({ buy, index, onOpen, onMenu }: BuyCardProps) {
  const photo = useBuyImage(buy);
  const tint = glowColor(buy.tint ?? paletteFor(buy.title));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const long = useRef(false);
  const delay = Math.min(index, 8) * 0.05;

  const down = () => {
    long.current = false;
    timer.current = setTimeout(() => {
      long.current = true;
      haptic('medium');
      onMenu(buy);
    }, LONG_PRESS);
  };
  const up = () => {
    if (timer.current) clearTimeout(timer.current);
  };

  const style = { '--tint': tint, '--tint-a': alpha(tint, 0.3), '--tint-b': alpha(tint, 0.55) } as CSSProperties;

  return (
    <motion.button
      layout
      className="buy"
      style={style}
      initial={{ opacity: 0, y: 26 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ ...springs.soft, delay }}
      whileTap={{ scale: 0.97 }}
      onPointerDown={down}
      onPointerUp={up}
      onPointerLeave={up}
      onPointerCancel={up}
      onContextMenu={(e) => e.preventDefault()}
      onClick={() => {
        if (long.current) return;
        haptic('light');
        onOpen(buy);
      }}
    >
      <span className="buy-light" aria-hidden="true" />
      <span className="buy-n">{String(index + 1).padStart(2, '0')}</span>
      <motion.span
        className="buy-art"
        initial={{ y: 22, scale: 0.86, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        transition={{ ...springs.bouncy, delay: 0.08 + delay }}
      >
        <span className="buy-flare" aria-hidden="true" />
        {photo ? <img src={photo} alt="" draggable={false} /> : <ProductIcon name={productIconFor(buy.title)} className="buy-icon" />}
      </motion.span>
      <span className="buy-title">{buy.title}</span>
      <span className="buy-foot">
        <span className="buy-price money">{rub(buy.price)}</span>
        {buy.url && (
          <span className="buy-link" aria-hidden="true">
            <Icon name="link" size={13} stroke={2.4} />
          </span>
        )}
      </span>
    </motion.button>
  );
}
