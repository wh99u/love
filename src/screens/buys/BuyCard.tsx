import { motion } from 'motion/react';
import { useRef } from 'react';
import { alpha, paletteFor, shade } from '../../lib/color';
import { rub } from '../../lib/money';
import { haptic } from '../../lib/telegram';
import type { Buy } from '../../lib/types';
import { Icon, iconForTitle } from '../../ui/Icon';
import { springs } from '../../ui/motion';
import { useImage } from '../../ui/useImage';

const LONG_PRESS = 450;

interface BuyCardProps {
  buy: Buy;
  index: number;
  onOpen: (b: Buy) => void;
  onMenu: (b: Buy) => void;
}

/** Card with the product cut out and popping over its top edge. */
export function BuyCard({ buy, index, onOpen, onMenu }: BuyCardProps) {
  const photo = useImage(buy.imgId);
  const tint = buy.tint ?? paletteFor(buy.title);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const long = useRef(false);

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

  return (
    <motion.button
      layout
      className="buy glass"
      style={{ background: `linear-gradient(155deg, ${alpha(shade(tint, 0.1), 0.62)}, ${alpha(shade(tint, -0.55), 0.7)})` }}
      initial={{ opacity: 0, y: 24, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ ...springs.soft, delay: Math.min(index, 8) * 0.04 }}
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
      <motion.span
        className="buy-art"
        initial={{ y: 24, scale: 0.85, rotate: -4 }}
        animate={{ y: 0, scale: 1, rotate: 0 }}
        transition={{ ...springs.bouncy, delay: 0.1 + Math.min(index, 8) * 0.05 }}
      >
        {photo ? (
          <img src={photo} alt="" draggable={false} />
        ) : (
          <span className="buy-icon" style={{ background: `radial-gradient(120% 120% at 30% 20%, ${shade(tint, 0.45)}, ${tint} 55%, ${shade(tint, -0.35)})` }}>
            <Icon name={iconForTitle(buy.title)} size={54} stroke={1.5} />
          </span>
        )}
      </motion.span>
      <span className="buy-price money">{rub(buy.price)}</span>
      <span className="buy-title">{buy.title}</span>
      {buy.url && (
        <span className="buy-link" aria-hidden="true">
          <Icon name="link" size={14} />
        </span>
      )}
    </motion.button>
  );
}
