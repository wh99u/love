export const springs = {
  snappy: { type: 'spring', stiffness: 500, damping: 42 },
  soft: { type: 'spring', stiffness: 220, damping: 30 },
  bouncy: { type: 'spring', stiffness: 420, damping: 28 },
  page: { type: 'spring', stiffness: 340, damping: 38 },
} as const;

/** Fades use a long ease-out: quick start, gentle landing. */
export const fade = { duration: 0.32, ease: [0.22, 1, 0.36, 1] } as const;
