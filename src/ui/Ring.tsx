import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { springs } from './motion';

interface RingProps {
  value: number;
  size?: number;
  thickness?: number;
  color?: string;
  /** soft light around the filled arc */
  glow?: boolean;
  children?: ReactNode;
}

/** Circular progress, 0–100. */
export function Ring({ value, size = 56, thickness = 6, color = 'var(--accent)', glow, children }: RingProps) {
  const r = (size - thickness) / 2;
  const v = Math.max(0, Math.min(100, value)) / 100;
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,235,235,.08)" strokeWidth={thickness} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={glow ? { filter: `drop-shadow(0 0 4px ${color})` } : undefined}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: v, opacity: v > 0 ? 1 : 0 }}
          transition={springs.soft}
        />
      </svg>
      {children !== undefined && <div className="ring-label">{children}</div>}
    </div>
  );
}
