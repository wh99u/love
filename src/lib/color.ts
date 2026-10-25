const rgb = (hex: string) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/** Mix a #rrggbb with white (amt > 0) or black (amt < 0). */
export function shade(hex: string, amt: number) {
  const ch = rgb(hex).map((c) => Math.round(amt >= 0 ? c + (255 - c) * amt : c * (1 + amt)));
  return `#${ch.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

export const alpha = (hex: string, a: number) => `rgba(${rgb(hex).join(',')},${a})`;

/** Light behind purchases without a photo: shades of the app's red. */
const PALETTE = ['#ff2b45', '#ff5a36', '#e0245e', '#ff3d7f', '#c81d3a', '#ff6b4a'];

export const paletteFor = (title: string) => PALETTE[[...title].reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTE.length];

/** Relative brightness 0..1 of a #rrggbb. */
export const luminance = (hex: string) => {
  const [r, g, b] = rgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
};

/** A colour that still glows on the dark cards: very dark tints fall back to the app's red. */
export const glowColor = (hex: string) => (luminance(hex) < 0.18 ? '#ff2b45' : hex);
