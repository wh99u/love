/* Geometry of the card pocket. `d` is a card's distance from the current position, in cards. */

const SPREAD = 0.78; // card widths between neighbours
const RAISE = -24; // px the active card rises out of the pocket
const SINK = 24; // px a neighbour sits below the active card (its top still peeks out)
const SHRINK = 0.14;
const DIM = 0.4;
const DRAG_SHARE = 0.3;
const FLICK = 400; // px/s
const RESIST = 0.35;

export function cardPose(d: number) {
  const k = Math.min(Math.abs(d), 1);
  return {
    x: d * SPREAD + 0,
    y: RAISE + k * SINK,
    scale: 1 - k * SHRINK,
    opacity: 1 - k * DIM,
    z: 100 - Math.round(Math.abs(d) * 10),
  };
}

export const clampIndex = (i: number, count: number) => (count <= 0 ? 0 : Math.max(0, Math.min(count - 1, i)));

/** dragCards < 0 means the finger moved left (towards the next card). */
export function snapTarget(current: number, dragCards: number, velocityX: number, count: number) {
  let step = 0;
  if (dragCards < -DRAG_SHARE || velocityX < -FLICK) step = 1;
  else if (dragCards > DRAG_SHARE || velocityX > FLICK) step = -1;
  return clampIndex(current + step, count);
}

/** Past the first/last card the deck follows the finger at a third of the speed. */
export function rubberBand(pos: number, count: number) {
  const max = Math.max(0, count - 1);
  if (pos < 0) return pos * RESIST;
  if (pos > max) return max + (pos - max) * RESIST;
  return pos;
}

export function balanceFontSize(text: string) {
  if (text.length <= 9) return 64;
  if (text.length <= 12) return 52;
  return 42;
}
