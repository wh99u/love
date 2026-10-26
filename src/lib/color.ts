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

/** Light behind purchases without a photo: whites and cool greys. */
const PALETTE = ['#ffffff', '#e4e4ea', '#cfd2dc', '#f1ede6', '#d9dde6', '#c8c8cf'];

export const paletteFor = (title: string) => PALETTE[[...title].reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTE.length];

/** Relative brightness 0..1 of a #rrggbb. */
export const luminance = (hex: string) => {
  const [r, g, b] = rgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
};

/** The light behind a product: always a grey, from silver for dark products to white for bright ones. */
export function glowColor(hex: string) {
  const l = Math.round(255 * (0.72 + 0.28 * Math.min(1, luminance(hex) * 1.6)));
  const c = l.toString(16).padStart(2, '0');
  return `#${c}${c}${c}`;
}
