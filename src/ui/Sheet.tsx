import { motion, useDragControls, useMotionValue, useTransform, type PanInfo } from 'motion/react';
import { useEffect, useRef, type ReactNode } from 'react';
import { backButton } from '../lib/telegram';
import { springs } from './motion';

interface SheetProps {
  children: ReactNode;
  onClose: () => void;
  depth: number;
}

const DISMISS_SHARE = 0.25;
const DISMISS_SPEED = 600;

/** Bottom sheet: pull the handle down to close, tap the dimmed backdrop to close. */
export function Sheet({ children, onClose, depth }: SheetProps) {
  const controls = useDragControls();
  const y = useMotionValue(0);
  const panel = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => backButton.push(() => close.current()), []);
  const dim = useTransform(y, (v) => Math.max(0, 1 - v / Math.max(1, (panel.current?.offsetHeight ?? 600) * 1.2)));

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const h = panel.current?.offsetHeight ?? 600;
    if (info.offset.y > h * DISMISS_SHARE || info.velocity.y > DISMISS_SPEED) onClose();
  };

  return (
    <div className="sheet-layer" style={{ zIndex: 40 - depth }}>
      <motion.div className="sheet-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
        <motion.div className="sheet-backdrop-fill" style={{ opacity: dim }} />
      </motion.div>
      <motion.div
        ref={panel}
        role="dialog"
        aria-modal="true"
        className="sheet edge-glow"
        initial={{ y: '100%' }}
        animate={{ y: 0, scale: depth ? 0.94 : 1 }}
        exit={{ y: '100%' }}
        transition={springs.snappy}
        drag="y"
        dragListener={false}
        dragControls={controls}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.04, bottom: 0.7 }}
        onDragEnd={onDragEnd}
        style={{ y }}
      >
        <div className="sheet-grip" onPointerDown={(e) => controls.start(e)}>
          <span />
        </div>
        <div className="sheet-body">{children}</div>
      </motion.div>
    </div>
  );
}
