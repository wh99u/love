import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { springs } from './motion';

export interface DonutSegment {
  id: string;
  value: number;
  fill: number; // 0..1 of this segment already used
  color: string;
}

interface DonutProps {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
  gap?: number;
  children?: ReactNode;
}

/**
 * Ring split by planned limits; each slice shows its limit dimmed and the spent
 * share at full strength on top.
 */
export function Donut({ segments, size = 240, thickness = 22, gap = 3, children }: DonutProps) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const total = segments.reduce((t, s) => t + Math.max(0, s.value), 0);
  const half = size / 2;
  let start = 0;
  return (
    <div className="donut" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={half} cy={half} r={r} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth={thickness} />
        <g transform={`rotate(-90 ${half} ${half})`}>
          {total > 0 &&
            segments.map((s) => {
              const len = (Math.max(0, s.value) / total) * c;
              const offset = start;
              start += len;
              const visibleLen = Math.max(0, len - gap);
              const used = visibleLen * Math.max(0, Math.min(1, s.fill));
              return (
                <g key={s.id}>
                  <motion.circle
                    cx={half}
                    cy={half}
                    r={r}
                    fill="none"
                    stroke={s.color}
                    strokeOpacity={0.3}
                    strokeWidth={thickness}
                    initial={{ strokeDasharray: `0 ${c}`, strokeDashoffset: -offset }}
                    animate={{ strokeDasharray: `${visibleLen} ${c}`, strokeDashoffset: -offset }}
                    transition={springs.soft}
                  />
                  <motion.circle
                    cx={half}
                    cy={half}
                    r={r}
                    fill="none"
                    stroke={s.color}
                    strokeWidth={thickness}
                    initial={{ strokeDasharray: `0 ${c}`, strokeDashoffset: -offset }}
                    animate={{ strokeDasharray: `${used} ${c}`, strokeDashoffset: -offset }}
                    transition={{ ...springs.soft, delay: 0.15 }}
                  />
                </g>
              );
            })}
        </g>
      </svg>
      <div className="donut-center">{children}</div>
    </div>
  );
}
