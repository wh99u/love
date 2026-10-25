import { animate, motion, useMotionValue, useMotionValueEvent, useTransform, type MotionValue, type PanInfo } from 'motion/react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { haptic } from '../../lib/telegram';
import type { Bank } from '../../lib/types';
import { springs } from '../../ui/motion';
import { BankCard } from './BankCard';
import { cardPose, clampIndex, flickVelocity, rubberBand, shouldGlide, snapTarget } from './pocket';

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

  const dragging = useRef(false);
  const moved = useRef(false); // a swipe must never also count as a tap on the card
  const lastCount = useRef(count);

  // Outside index changes (deleted or added card) glide the deck; the deck's own reports do not.
  useEffect(() => {
    const target = clampIndex(index, count);
    const countChanged = lastCount.current !== count;
    lastCount.current = count;
    if (!shouldGlide({ target, shown: shown.current, dragging: dragging.current, countChanged })) return;
    shown.current = target;
    animate(pos, target, springs.snappy);
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
    moved.current = true;
    dragging.current = true;
    pos.stop();
    start.current = pos.get();
  };
  const onPan = (_: PointerEvent, info: PanInfo) => pos.set(rubberBand(start.current - info.offset.x / step, count));
  const onPanEnd = (_: PointerEvent, info: PanInfo) => {
    dragging.current = false;
    const from = clampIndex(Math.round(start.current), count);
    const target = snapTarget(from, info.offset.x / step, info.velocity.x, count);
    animate(pos, target, { ...springs.snappy, velocity: flickVelocity(info.velocity.x, step) });
  };

  return (
    <div className="pocket" ref={box}>
      <motion.div
        className="pocket-deck"
        onPointerDownCapture={() => (moved.current = false)}
        onPanStart={onPanStart}
        onPan={onPan}
        onPanEnd={onPanEnd}
      >
        {count === 0 ? (
          <motion.button className="pocket-card pocket-empty surface" style={{ width, marginLeft: -width / 2, y: -24 }} whileTap={{ scale: 0.96 }} onClick={onEmptyPress}>
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
              onTap={() => {
                if (moved.current) return;
                if (i === shown.current) onCardPress(b);
                else animate(pos, i, springs.snappy);
              }}
            />
          ))
        )}
      </motion.div>
      <svg className="pocket-front" viewBox="0 0 390 96" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="pocket-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#140a0b" />
            <stop offset="0.4" stopColor="#080405" />
            <stop offset="1" stopColor="#060304" />
          </linearGradient>
          <linearGradient id="pocket-edge" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#ff5e70" stopOpacity="0" />
            <stop offset="0.3" stopColor="#ff5e70" stopOpacity="0.22" />
            <stop offset="0.5" stopColor="#ff8a96" stopOpacity="0.55" />
            <stop offset="0.7" stopColor="#ff5e70" stopOpacity="0.22" />
            <stop offset="1" stopColor="#ff5e70" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M0 14 H72 C104 14 112 36 150 36 H240 C278 36 286 14 318 14 H390 V96 H0 Z" fill="url(#pocket-fill)" />
        <path d="M0 14 H72 C104 14 112 36 150 36 H240 C278 36 286 14 318 14 H390" fill="none" stroke="url(#pocket-edge)" strokeWidth="1.5" />
      </svg>
    </div>
  );
}
