import { motion } from 'motion/react';
import { cx } from './cx';
import { springs } from './motion';

interface ProgressProps {
  value: number; // 0..100
  color?: string;
  height?: number;
  glow?: boolean;
}

/** Flat bar filled by a spring. */
export function Progress({ value, color = 'var(--accent)', height = 8, glow }: ProgressProps) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cx('progress', glow && 'progress--glow')}
      style={{ height, borderRadius: height }}
      role="progressbar"
      aria-valuenow={Math.round(v)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <motion.div className="progress-fill" style={{ background: color, borderRadius: height }} initial={{ width: '0%' }} animate={{ width: `${v}%` }} transition={springs.soft} />
    </div>
  );
}
