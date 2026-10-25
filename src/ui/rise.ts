import type { CSSProperties } from 'react';

/** Order of a `.rise` block in its screen's entrance cascade. */
export const rise = (i: number) => ({ '--i': i }) as CSSProperties;
