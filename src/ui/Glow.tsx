import type { CSSProperties } from 'react';

export interface GlowSpot {
  /** centre, % of the screen */
  x: number;
  y: number;
  /** diameter, % of the screen width */
  size: number;
  strength: number;
}

/** Red light: the lit top edge with halftone dots, plus a soft spot that drifts to its place on every screen and breathes. */
export function Glow({ spot }: { spot: GlowSpot }) {
  const style = {
    '--gx': `${spot.x}%`,
    '--gy': `${spot.y}%`,
    '--gs': spot.size,
    '--ga': spot.strength,
  } as CSSProperties;
  return (
    <div className="glow" style={style} aria-hidden="true">
      <i className="glow-top" />
      <i className="glow-dots" />
      <i className="glow-core" />
      <i className="glow-halo" />
    </div>
  );
}
