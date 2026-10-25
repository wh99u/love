import type { CSSProperties, HTMLAttributes } from 'react';
import { cx } from './cx';

interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  radius?: number;
  raised?: boolean;
  glow?: boolean;
}

/** Matte card: flat fill, hairline edge, optional red light on top. */
export function Surface({ radius, raised, glow, className, style, ...rest }: SurfaceProps) {
  const s = radius === undefined ? style : ({ ...style, '--surface-r': `${radius}px` } as CSSProperties);
  return <div className={cx('surface', raised && 'surface--raised', glow && 'edge-glow', className)} style={s} {...rest} />;
}
