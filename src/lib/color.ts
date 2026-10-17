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

/** Card colours for purchases without a photo (from the original app). */
const PALETTE = ['#2f7d55', '#2f5fae', '#7d3f98', '#b0662b', '#2b8088', '#9a3d52'];

export const paletteFor = (title: string) => PALETTE[[...title].reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTE.length];
