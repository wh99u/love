const clamp = (v: number) => Math.max(-1, Math.min(1, v));
const NEUTRAL_BETA = 0.7; // ~40°, how a phone is usually held
const RANGE = 0.6;

/** Radians from the gyroscope → [-1, 1] offsets for the glass highlight. */
export function tiltFromOrientation(beta: number, gamma: number) {
  return { x: clamp(gamma / RANGE) + 0, y: clamp((beta - NEUTRAL_BETA) / RANGE) + 0 };
}

function write(x: number, y: number) {
  const s = document.documentElement.style;
  s.setProperty('--tilt-x', x.toFixed(3));
  s.setProperty('--tilt-y', y.toFixed(3));
}

/** Drives --tilt-x/--tilt-y from the mouse on desktop. Phones keep a static highlight: gyroscope-driven repaints cost too many frames. */
export function startTilt(): () => void {
  if (typeof window === 'undefined' || matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};

  let frame = 0;
  const schedule = (x: number, y: number) => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => write(x, y));
  };

  const onPointer = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    schedule(clamp((e.clientX / innerWidth) * 2 - 1), clamp((e.clientY / innerHeight) * 2 - 1));
  };
  window.addEventListener('pointermove', onPointer, { passive: true });
  return () => window.removeEventListener('pointermove', onPointer);
}
