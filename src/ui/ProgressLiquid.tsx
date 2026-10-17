import { motion } from 'motion/react';
import { springs } from './motion';

interface ProgressLiquidProps {
  value: number; // 0..100
  color?: string;
  height?: number;
}

/** Bar that fills like liquid: a spring-driven level with a slowly drifting wave on its edge. */
export function ProgressLiquid({ value, color = 'var(--yellow)', height = 10 }: ProgressLiquidProps) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div
      className="liquid"
      style={{ height, borderRadius: height }}
      role="progressbar"
      aria-valuenow={Math.round(v)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <motion.div
        className="liquid-fill"
        style={{ background: color, borderRadius: height }}
        initial={{ width: '0%' }}
        animate={{ width: `${v}%` }}
        transition={springs.soft}
      >
        <svg className="liquid-wave" viewBox="0 0 40 10" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 5 Q5 1 10 5 T20 5 T30 5 T40 5 V10 H0z" fill="rgba(255,255,255,.35)" />
        </svg>
      </motion.div>
    </div>
  );
}
