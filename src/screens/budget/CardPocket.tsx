import { animate, motion, useMotionValue, useMotionValueEvent, useTransform, type MotionValue, type PanInfo } from 'motion/react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { haptic } from '../../lib/telegram';
import type { Bank } from '../../lib/types';
import { springs } from '../../ui/motion';
import { BankCard } from './BankCard';
import { cardPose, clampIndex, rubberBand, snapTarget } from './pocket';

const CARD_SHARE = 0.58;
const STEP = 0.78;

interface CardPocketProps {
  banks: Bank[];
  index: number;
  onIndex: (i: number) => void;
  onCardPress: (bank: Bank) => void;
  onEmptyPress: () => void;
}

function PocketCard({ bank, i, pos, width, onTap }: { bank: Bank; i: number; pos: MotionValue<number>; width: number; onTap: () => void }) {
  const x = useTransform(pos, (p) => cardPose(i - p).x * width);
  const y = useTransform(pos, (p) => cardPose(i - p).y);
  const scale = useTransform(pos, (p) => cardPose(i - p).scale);
  const opacity = useTransform(pos, (p) => cardPose(i - p).opacity);
  const zIndex = useTransform(pos, (p) => cardPose(i - p).z);
  return (
    <motion.div
      className="pocket-card"
      style={{ x, y, scale, opacity, zIndex, width, marginLeft: -width / 2 }}
      onTap={onTap}
      role="button"
      aria-label={`Карта ${i + 1}`}
    >
      <BankCard bank={bank} />
    </motion.div>
  );
}

/** Cards tucked into a pocket: swipe sideways, the chosen card rises out. */
export function CardPocket({ banks, index, onIndex, onCardPress, onEmptyPress }: CardPocketProps) {
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(210);
  const pos = useMotionValue(index);
  const start = useRef(index);
  const shown = useRef(index);
  const count = banks.length;

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => setWidth(Math.round(el.offsetWidth * CARD_SHARE));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // External index changes (deleted card, new card) glide the deck.
  useEffect(() => {
    const target = clampIndex(index, count);
    shown.current = target;
    if (Math.abs(pos.get() - target) > 0.001) animate(pos, target, springs.snappy);
  }, [index, count, pos]);

  useMotionValueEvent(pos, 'change', (p) => {
    const nearest = clampIndex(Math.round(p), count);
    if (nearest !== shown.current) {
      shown.current = nearest;
      haptic('selection');
      onIndex(nearest);
    }
  });

  const step = width * STEP;
  const onPanStart = () => {
    pos.stop();
    start.current = pos.get();
  };
  const onPan = (_: PointerEvent, info: PanInfo) => pos.set(rubberBand(start.current - info.offset.x / step, count));
  const onPanEnd = (_: PointerEvent, info: PanInfo) => {
    const from = clampIndex(Math.round(start.current), count);
    const target = snapTarget(from, info.offset.x / step, info.velocity.x, count);
    animate(pos, target, { ...springs.snappy, velocity: -info.velocity.x / step });
  };

  return (
    <div className="pocket" ref={box}>
      <motion.div className="pocket-deck" onPanStart={onPanStart} onPan={onPan} onPanEnd={onPanEnd}>
        {count === 0 ? (
          <motion.button className="pocket-card pocket-empty glass" style={{ width, marginLeft: -width / 2, y: -24 }} whileTap={{ scale: 0.96 }} onClick={onEmptyPress}>
            Добавьте карту
          </motion.button>
        ) : (
          banks.map((b, i) => (
            <PocketCard
              key={b.id}
              bank={b}
              i={i}
              pos={pos}
              width={width}
              onTap={() => (i === shown.current ? onCardPress(b) : animate(pos, i, springs.snappy))}
            />
          ))
        )}
      </motion.div>
      <svg className="pocket-front" viewBox="0 0 390 96" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="pocket-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0d0d0f" />
            <stop offset="0.35" stopColor="#040405" />
            <stop offset="1" stopColor="#000" />
          </linearGradient>
          <linearGradient id="pocket-edge" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset="0.3" stopColor="#fff" stopOpacity="0.16" />
            <stop offset="0.5" stopColor="#fff" stopOpacity="0.28" />
            <stop offset="0.7" stopColor="#fff" stopOpacity="0.16" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M0 14 H72 C104 14 112 36 150 36 H240 C278 36 286 14 318 14 H390 V96 H0 Z" fill="url(#pocket-fill)" />
        <path d="M0 14 H72 C104 14 112 36 150 36 H240 C278 36 286 14 318 14 H390" fill="none" stroke="url(#pocket-edge)" strokeWidth="1.5" />
      </svg>
    </div>
  );
}
