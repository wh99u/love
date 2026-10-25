import { useId, type CSSProperties } from 'react';
import { PRODUCT_ICONS } from './productIcons';

/** Big solid product picture: a white silhouette with its details carved out. */
export function ProductIcon({ name, size = 96, className, style }: { name: string; size?: number; className?: string; style?: CSSProperties }) {
  const mask = `pi${useId().replace(/:/g, '')}`;
  const icon = PRODUCT_ICONS[name] ?? PRODUCT_ICONS.gift;
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} style={style} aria-hidden="true">
      {icon.cut && (
        <mask id={mask} maskUnits="userSpaceOnUse" x="0" y="0" width="64" height="64">
          <rect width="64" height="64" fill="#fff" />
          <g fill="none" stroke="#000" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: icon.cut }} />
        </mask>
      )}
      <g fill="currentColor" mask={icon.cut ? `url(#${mask})` : undefined} dangerouslySetInnerHTML={{ __html: icon.d }} />
    </svg>
  );
}
