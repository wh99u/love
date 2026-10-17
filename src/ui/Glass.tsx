import type { CSSProperties, HTMLAttributes } from 'react';
import { cx } from './cx';

interface GlassProps extends HTMLAttributes<HTMLDivElement> {
  radius?: number;
  strong?: boolean;
  flat?: boolean;
  lens?: boolean;
}

export function Glass({ radius, strong, flat, lens, className, style, ...rest }: GlassProps) {
  const s = radius === undefined ? style : ({ ...style, '--glass-r': `${radius}px` } as CSSProperties);
  return <div className={cx('glass', strong && 'glass--strong', flat && 'glass--flat', lens && 'glass--lens', className)} style={s} {...rest} />;
}
