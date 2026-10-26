import { AnimatePresence, animate, motion, useMotionValue, useTransform } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { backButton, haptic } from '../lib/telegram';
import { Icon } from './Icon';
import { springs } from './motion';
import { Pressable } from './Pressable';

export type Tab = 'home' | 'dream' | 'buys' | 'calendar';

export const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'home', label: 'Главная', icon: 'home' },
  { id: 'dream', label: 'Мечта', icon: 'car' },
  { id: 'buys', label: 'Покупки', icon: 'bag' },
  { id: 'calendar', label: 'Календарь', icon: 'calendar' },
];

export interface Tool {
  id: string;
  label: string;
  icon: string;
  run: () => void;
}

const NOTCH = 84;
const SWIPE = 36;
const ease = [0.22, 1, 0.36, 1] as const;

const labels = {
  enter: (dir: number) => ({ x: dir * 34, opacity: 0, filter: 'blur(6px)' }),
  center: { x: 0, opacity: 1, filter: 'blur(0px)', transitionEnd: { filter: 'none' } },
  exit: (dir: number) => ({ x: dir * -34, opacity: 0, filter: 'blur(6px)' }),
};

interface NavPillProps {
  tab: Tab;
  dir: number;
  onTab: (t: Tab, dir: number) => void;
  tools: Tool[];
}

/**
 * «‹ This week ›» from the reference as the navigation: arrows or a swipe step
 * through the sections, the rulers roll with them, a tap on the name opens
 * every section and tool at once.
 */
export function NavPill({ tab, dir, onTab, tools }: NavPillProps) {
  const i = TABS.findIndex((t) => t.id === tab);
  const [open, setOpen] = useState(false);
  const drag = useMotionValue(0);
  const roll = useMotionValue(-i * NOTCH);
  const ruler = useTransform([roll, drag], ([r, d]: number[]) => `${r + d * 0.8}px`);
  const start = useRef<{ x: number; id: number } | null>(null);
  const swiped = useRef(false);
  const shown = useRef(tab);

  // the rulers roll one notch per step, in the direction of travel
  useEffect(() => {
    if (shown.current === tab) return;
    shown.current = tab;
    const run = animate(roll, roll.get() - dir * NOTCH, { duration: 0.7, ease });
    return () => run.stop();
  }, [tab, dir, roll]);

  useEffect(() => (open ? backButton.push(() => setOpen(false)) : undefined), [open]);

  const step = (d: -1 | 1) => {
    if (swiped.current) return;
    haptic('selection');
    onTab(TABS[(i + d + TABS.length) % TABS.length].id, d);
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div key="scrim" className="nav-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35, ease }} onClick={() => setOpen(false)} />
        )}
      </AnimatePresence>
      <nav className="nav" aria-label="Разделы">
        <AnimatePresence>
          {open && (
            <motion.div
              key="menu"
              className="nav-menu glass"
              initial={{ opacity: 0, y: 24, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.95 }}
              transition={springs.soft}
            >
              <div className="nav-menu-tabs">
                {TABS.map((t, n) => (
                  <motion.button
                    key={t.id}
                    type="button"
                    className={`nav-menu-tab ${t.id === tab ? 'nav-menu-tab--on' : ''}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...springs.soft, delay: 0.04 + n * 0.035 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => {
                      haptic('selection');
                      setOpen(false);
                      if (t.id !== tab) onTab(t.id, n > i ? 1 : -1);
                    }}
                  >
                    <Icon name={t.icon} size={24} fill={t.id === tab} />
                    <span>{t.label}</span>
                  </motion.button>
                ))}
              </div>
              <div className="nav-menu-tools">
                {tools.map((t, n) => (
                  <motion.button
                    key={t.id}
                    type="button"
                    className="nav-menu-tool"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...springs.soft, delay: 0.12 + n * 0.035 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      haptic('light');
                      setOpen(false);
                      t.run();
                    }}
                  >
                    <span className="nav-menu-tool-icon">
                      <Icon name={t.icon} size={19} />
                    </span>
                    {t.label}
                    <Icon name="chevron" size={14} className="nav-menu-tool-go" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          className="nav-pill glass"
          initial={{ y: 90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ...springs.soft, delay: 0.15 }}
          onPointerDown={(e) => (start.current = { x: e.clientX, id: e.pointerId })}
          onPointerMove={(e) => start.current?.id === e.pointerId && drag.set(e.clientX - start.current.x)}
          onPointerUp={() => {
            const d = drag.get();
            start.current = null;
            animate(drag, 0, springs.snappy);
            if (Math.abs(d) <= SWIPE) return;
            step(d < 0 ? 1 : -1);
            // the click that ends a swipe must not also press a button
            swiped.current = true;
            setTimeout(() => (swiped.current = false), 0);
          }}
          onPointerCancel={() => {
            start.current = null;
            drag.set(0);
          }}
        >
          <Pressable className="nav-arrow" aria-label="Предыдущий раздел" feedback={false} scale={0.8} onPress={() => step(-1)}>
            <Icon name="back" size={19} />
          </Pressable>
          <motion.i className="nav-ruler" style={{ backgroundPositionX: ruler }} aria-hidden="true" />
          <button
            type="button"
            className="nav-label"
            aria-haspopup="menu"
            aria-expanded={open}
            onClick={() => {
              if (swiped.current) return;
              haptic(open ? 'light' : 'medium');
              setOpen((o) => !o);
            }}
          >
            <AnimatePresence mode="popLayout" initial={false} custom={dir}>
              <motion.span key={tab} custom={dir} variants={labels} initial="enter" animate="center" exit="exit" transition={springs.soft}>
                {TABS[i].label}
              </motion.span>
            </AnimatePresence>
          </button>
          <motion.i className="nav-ruler" style={{ backgroundPositionX: ruler }} aria-hidden="true" />
          <Pressable className="nav-arrow" aria-label="Следующий раздел" feedback={false} scale={0.8} onPress={() => step(1)}>
            <Icon name="chevron" size={19} />
          </Pressable>
        </motion.div>
      </nav>
    </>
  );
}
