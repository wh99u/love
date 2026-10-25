import type { CSSProperties } from 'react';
import { BOLD, FILL, REGULAR } from './icons.gen';

interface IconProps {
  name: string;
  size?: number;
  /** heavier strokes switch to the bold drawing where there is one */
  stroke?: number;
  /** solid variant (active tab, filled marks) */
  fill?: boolean;
  className?: string;
  style?: CSSProperties;
}

/** Phosphor icons (MIT) on a 256 grid, painted with currentColor. */
export function Icon({ name, size = 24, stroke = 1.8, fill, className, style }: IconProps) {
  const body = (fill && FILL[name]) || (stroke >= 2.2 && BOLD[name]) || REGULAR[name] || FILL[name] || REGULAR.gift;
  return (
    <svg
      viewBox="0 0 256 256"
      width={size}
      height={size}
      className={className}
      style={style}
      fill="currentColor"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: body }}
    />
  );
}
