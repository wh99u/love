import { useEffect, useRef } from 'react';
import type { MotionValue } from 'motion/react';
import { cover, shift, type Field, type Ripple } from './glass';

const STRIP = 2;
const PAD = 260;
const SOFTEN = 7;
const INTRO_S = 1.8;

const make = (w: number, h: number) => {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
};

/** The default picture: a dark bust in soft light, like the reference photo behind its glass. */
function drawScene(g: CanvasRenderingContext2D, w: number, h: number) {
  const bg = g.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#f1f0f5');
  bg.addColorStop(0.5, '#dddce3');
  bg.addColorStop(1, '#b9b8c0');
  g.fillStyle = bg;
  g.fillRect(0, 0, w, h);

  const s = Math.min(w, h * 0.78);
  const cx = w / 2;
  const hy = h * 0.37;
  const blob = (x: number, y: number, rx: number, ry: number, stops: [number, string][], lx = -0.35, ly = -0.45) => {
    const gr = g.createRadialGradient(x + rx * lx, y + ry * ly, 0, x, y, Math.max(rx, ry) * 1.15);
    for (const [o, c] of stops) gr.addColorStop(o, c);
    g.fillStyle = gr;
    g.beginPath();
    g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    g.fill();
  };
  const skin: [number, string][] = [
    [0, '#c2bcc1'],
    [0.5, '#7d777c'],
    [1, '#2a282c'],
  ];
  // shoulders and neck
  blob(cx, h * 1.06, Math.min(w * 0.6, s * 0.95), h * 0.36, [
    [0, '#3a383d'],
    [0.6, '#151517'],
    [1, '#0b0b0c'],
  ]);
  blob(cx, hy + s * 0.3, s * 0.1, s * 0.2, skin, -0.2, -0.6);
  // head, hair, ears
  blob(cx - s * 0.2, hy + s * 0.02, s * 0.04, s * 0.07, skin);
  blob(cx + s * 0.2, hy + s * 0.02, s * 0.04, s * 0.07, skin);
  blob(cx, hy, s * 0.19, s * 0.25, skin);
  blob(cx, hy - s * 0.16, s * 0.2, s * 0.14, [
    [0, '#3a383e'],
    [1, '#0d0d0f'],
  ]);
  // shadows of the eyes, nose and mouth; the glass blurs them into a face
  g.fillStyle = 'rgba(20,20,22,0.7)';
  for (const dx of [-1, 1]) {
    g.beginPath();
    g.ellipse(cx + dx * s * 0.075, hy - s * 0.005, s * 0.045, s * 0.022, 0, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = 'rgba(12,12,14,0.45)';
  g.beginPath();
  g.ellipse(cx, hy + s * 0.13, s * 0.06, s * 0.016, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = 'rgba(200,196,204,0.35)';
  g.beginPath();
  g.ellipse(cx - s * 0.03, hy + s * 0.05, s * 0.02, s * 0.06, 0, 0, Math.PI * 2);
  g.fill();
}

interface FlutedGlassProps {
  /** Picture behind the glass; null draws the default bust. */
  src: string | null;
  /** 0..1, grows as the page scrolls and the picture melts. */
  melt?: MotionValue<number>;
  className?: string;
}

/**
 * A picture behind reeded glass: every 2-px column of a softened copy slides up
 * or down on a slow noise field, so dark drips run into the light. The field
 * flows by itself, follows the finger and ripples on tap.
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
    let w = 0;
    let h = 0;
    let source: HTMLCanvasElement | null = null;
    let img: HTMLImageElement | null = null;
    let raf = 0;
    let visible = true;
    let alive = true;
    const started = performance.now();
    const field: Field = { seed: 11, t: 0, melt: 1, touchX: 0, touch: 0, ripples: [] };
    let ripples: (Ripple & { born: number })[] = [];

    const build = () => {
      const r = el.getBoundingClientRect();
      w = Math.round(r.width);
      h = Math.round(r.height);
      if (!w || !h) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const scene = make(w, h);
      const sg = scene.getContext('2d')!;
      if (img) {
        const c = cover(img.naturalWidth, img.naturalHeight, w, h);
        sg.drawImage(img, c.sx, c.sy, c.sw, c.sh, 0, 0, w, h);
      } else drawScene(sg, w, h);

      // soften: shrink and stretch back, cheaper than a blur filter and the same on every browser
      const small = make(w / SOFTEN, h / SOFTEN);
      const smg = small.getContext('2d')!;
      smg.imageSmoothingQuality = 'high';
      smg.drawImage(scene, 0, 0, small.width, small.height);

      source = make(w, h + PAD * 2);
      const so = source.getContext('2d')!;
      so.imageSmoothingQuality = 'high';
      so.drawImage(small, 0, PAD, w, h);
      // the edges continue past the frame, so shifted columns never show a gap
      so.drawImage(small, 0, 0, small.width, 1, 0, 0, w, PAD);
      so.drawImage(small, 0, small.height - 1, small.width, 1, 0, PAD + h, w, PAD);
      draw(performance.now());
    };

    const draw = (now: number) => {
      if (!source) return;
      const s = (now - started) / 1000;
      const intro = reduced ? 0 : Math.max(0, 1 - s / INTRO_S);
      field.t = reduced ? 0 : s;
      field.melt = intro ** 2 * 1.6 + (meltRef.current?.get() ?? 0);
      field.touch *= 0.94;
      ripples = ripples.filter((r) => now - r.born < 2600);
      field.ripples = ripples.map((r) => ({ x: r.x, age: (now - r.born) / 1000 }));
      ctx.clearRect(0, 0, w, h);
      for (let x = 0; x < w; x += STRIP) {
        const d = shift(x + STRIP / 2, field);
        ctx.drawImage(source, x, PAD - Math.max(-PAD, Math.min(PAD, d)), STRIP, h, x, 0, STRIP, h);
      }
    };

    let last = 0;
    const loop = (now: number) => {
      raf = 0;
      if (!alive || !visible || document.hidden) return;
      // the idle flow is slow: 30 fps is enough and saves the battery; touches get every frame
      const busy = field.touch > 0.01 || ripples.length > 0 || field.melt > 0.02;
      if (busy || now - last > 30) {
        last = now;
        draw(now);
      }
      raf = requestAnimationFrame(loop);
    };
    const kick = () => {
      if (!reduced && !raf && visible && !document.hidden) raf = requestAnimationFrame(loop);
    };

    const load = () => {
      if (!src) {
        img = null;
        build();
        kick();
        return;
      }
      const i = new Image();
      i.decoding = 'async';
      i.onload = () => {
        if (!alive) return;
        img = i;
        build();
        kick();
      };
      i.onerror = () => {
        img = null;
        build();
        kick();
      };
      i.src = src;
    };
    load();

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

    const local = (e: PointerEvent) => e.clientX - el.getBoundingClientRect().left;
    const onMove = (e: PointerEvent) => {
      field.touchX = local(e);
      field.touch = Math.min(1, field.touch + 0.35);
      kick();
    };
    const onDown = (e: PointerEvent) => {
      ripples.push({ x: local(e), age: 0, born: performance.now() });
      kick();
    };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerdown', onDown);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      clearTimeout(resizeTimer);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerdown', onDown);
    };
  }, [src]);

  return (
    <div ref={box} className={`fluted ${className ?? ''}`}>
      <canvas ref={cv} className="fluted-canvas" />
      <i className="fluted-ribs" />
    </div>
  );
}
