import { useEffect, useRef } from 'react';
import type { MotionValue } from 'motion/react';
import { cover, makeFlutes, sourceX, type Field } from './glass';

/** The picture from the reference, straightened and cleaned: it already shows the ribbed glass. */
export const DEFAULT_HERO = `${import.meta.env.BASE_URL}hero.webp`;

const SOFTEN = 5;
const MAX_COLUMNS = 820;

const make = (w: number, h: number) => {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
};

interface FlutedGlassProps {
  /** Own photo; null shows the default picture. */
  src: string | null;
  /** 0..1, grows as the page scrolls. */
  melt?: MotionValue<number>;
  className?: string;
}

/**
 * A picture behind reeded glass, redrawn column by column: every column of the
 * screen shows some column of the picture (see `sourceX`). An own photo gets the
 * full ribs; the default picture already has them and only sways like liquid.
 * Touches do nothing to it.
 */
export function FlutedGlass({ src, melt, className }: FlutedGlassProps) {
  const box = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const meltRef = useRef(melt);
  meltRef.current = melt;

  useEffect(() => {
    const el = box.current!;
    const canvas = cv.current!;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const own = !!src;
    const field: Field = { t: 0, refract: own ? 1 : 0, melt: 0 };
    let flutes = makeFlutes(1, 5);
    let img: HTMLImageElement | null = null;
    let source: HTMLCanvasElement | null = null;
    let w = 0;
    let dpr = 1;
    let raf = 0;
    let last = 0;
    let visible = true;
    let alive = true;
    const started = performance.now();

    const build = () => {
      const r = el.getBoundingClientRect();
      w = r.width;
      const h = r.height;
      if (!w || !h || !img) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      const c = cover(img.naturalWidth, img.naturalHeight, canvas.width, canvas.height, own ? 0.35 : 0);
      source = make(canvas.width, canvas.height);
      const g = source.getContext('2d')!;
      g.imageSmoothingQuality = 'high';
      if (own) {
        // a photo behind real glass looks soft: shrink and stretch back
        const small = make(canvas.width / SOFTEN, canvas.height / SOFTEN);
        const sg = small.getContext('2d')!;
        sg.imageSmoothingQuality = 'high';
        sg.drawImage(img, c.sx, c.sy, c.sw, c.sh, 0, 0, small.width, small.height);
        g.drawImage(small, 0, 0, canvas.width, canvas.height);
      } else g.drawImage(img, c.sx, c.sy, c.sw, c.sh, 0, 0, canvas.width, canvas.height);
      flutes = makeFlutes(w, 5, Math.max(1, w / 420));
      draw(performance.now());
    };

    const draw = (now: number) => {
      if (!source) return;
      const s = (now - started) / 1000;
      field.t = reduced ? 0 : s;
      field.melt = meltRef.current?.get() ?? 0;
      const cw = canvas.width;
      const ch = canvas.height;
      const step = Math.max(1, Math.ceil(cw / MAX_COLUMNS));
      for (let X = 0; X < cw; X += step) {
        const sx = sourceX((X + step / 2) / dpr, flutes, field) * dpr;
        ctx.drawImage(source, Math.max(0, Math.min(cw - step, sx)), 0, step, ch, X, 0, step, ch);
      }
    };

    const loop = (now: number) => {
      raf = 0;
      if (!alive || !visible || document.hidden) return;
      // the liquid moves slowly: 30 fps is plenty and saves the battery; scrolling gets every frame
      if (field.melt > 0.01 || now - last > 32) {
        last = now;
        draw(now);
      }
      raf = requestAnimationFrame(loop);
    };
    const kick = () => {
      if (!reduced && !raf && visible && !document.hidden) raf = requestAnimationFrame(loop);
    };

    const i = new Image();
    i.decoding = 'async';
    i.onload = () => {
      if (!alive) return;
      img = i;
      build();
      kick();
    };
    i.src = src ?? DEFAULT_HERO;

    let resizeTimer = 0;
    const ro = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(build, 120);
    });
    ro.observe(el);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      kick();
    });
    io.observe(el);
    const onVis = () => kick();
    document.addEventListener('visibilitychange', onVis);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      clearTimeout(resizeTimer);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [src]);

  return (
    <div ref={box} className={`fluted ${className ?? ''}`}>
      <canvas ref={cv} className="fluted-canvas" />
    </div>
  );
}
