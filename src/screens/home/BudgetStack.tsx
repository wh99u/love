import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { rateLabel } from '../../lib/currency';
import { haptic } from '../../lib/telegram';
import { BANK_NAMES, type Bank } from '../../lib/types';
import { AnimatedNumber } from '../../ui/AnimatedNumber';
import { Icon } from '../../ui/Icon';
import { springs } from '../../ui/motion';
import { Pressable } from '../../ui/Pressable';
import { useMoney } from '../../ui/useMoney';

const NOTE_H = 72;
const GAP = 8;
const PEEK = 9;
const ease = [0.22, 1, 0.36, 1] as const;

/** Text that arrives word by word, each one sharpening out of a blur. */
function Words({ text, delay = 0 }: { text: string; delay?: number }) {
  return (
    <>
      {text.split(' ').map((w, i) => (
        <motion.span
          key={`${i}${w}`}
          className="word"
          initial={{ opacity: 0, y: 7, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }}
          transition={{ duration: 0.55, ease, delay: delay + i * 0.06 }}
        >
          {w}
          {' '}
        </motion.span>
      ))}
    </>
  );
}

interface Note {
  key: string;
  badge: string;
  title: string;
  text: string;
  meta?: string;
  share?: number;
}

interface BudgetStackProps {
  banks: Bank[];
  total: number;
  /** topped up during this week, roubles */
  weekIn: number;
}

/**
 * The total in a frosted notification over the picture. A tap fans the grouped
 * notifications out, one per card, and their text writes itself in.
 */
export function BudgetStack({ banks, total, weekIn }: BudgetStackProps) {
  const m = useMoney();
  const [open, setOpen] = useState(false);
  const [mainH, setMainH] = useState(118);
  const main = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = main.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setMainH(el.offsetHeight));
    ro.observe(el);
    setMainH(el.offsetHeight);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const before = total - weekIn;
  const growth = weekIn > 0 && before > 0 ? (weekIn / before) * 100 : 0;

  const notes: Note[] = banks.map((b) => ({
    key: b.id,
    badge: BANK_NAMES[b.code].slice(0, 1),
    title: BANK_NAMES[b.code],
    text: `На карте ${m.fmt(b.sum)}`,
    meta: total > 0 ? `${Math.round((b.sum / total) * 100)}%` : undefined,
    share: total > 0 ? Math.max(0, b.sum / total) : 0,
  }));
  if (!notes.length) notes.push({ key: 'none', badge: '+', title: 'Карт пока нет', text: 'Добавьте карту на вкладке «Бюджет»' });
  if (m.cur === 'usd') notes.push({ key: 'rate', badge: '$', title: 'Курс ЦБ', text: rateLabel(m.rate), meta: m.live ? 'сегодня' : 'примерный' });

  const toggle = () => {
    haptic(open ? 'light' : 'medium');
    setOpen((o) => !o);
  };

  return (
    <div className={`bstack ${open ? 'bstack--open' : ''}`}>
      <AnimatePresence>
        {open && (
          <motion.div
            key="scrim"
            className="bstack-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease }}
            onClick={toggle}
          />
        )}
      </AnimatePresence>

      <motion.div
        ref={main}
        className="bcard glass"
        role="button"
        tabIndex={0}
        aria-expanded={open}
        aria-label="Общий бюджет, нажмите, чтобы увидеть карты"
        onClick={toggle}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), toggle())}
        initial={{ opacity: 0, y: -24, scale: 0.92, filter: 'blur(14px)' }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }}
        transition={{ ...springs.soft, delay: 0.5, filter: { duration: 0.9, delay: 0.5 } }}
        whileTap={{ scale: 0.975 }}
      >
        <div className="bcard-top">
          <AnimatedNumber value={total} format={m.fmt} className="bcard-sum" />
          <AnimatePresence>
            {growth >= 0.5 && (
              <motion.span className="bcard-delta" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ delay: 1.1, duration: 0.5 }}>
                +{growth < 10 ? growth.toFixed(1).replace('.', ',') : Math.round(growth)}%
                <Icon name="arrowUpRight" size={13} />
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <span className="bcard-cap">
          общий бюджет
          {banks.length > 0 && (
            <>
              {' · '}
              {banks.length} {banks.length === 1 ? 'карта' : banks.length < 5 ? 'карты' : 'карт'}
            </>
          )}
        </span>
        <Pressable
          className="bcard-cur"
          aria-label={m.cur === 'rub' ? 'Показать в долларах' : 'Показать в рублях'}
          feedback="selection"
          scale={0.85}
          onClick={(e) => e.stopPropagation()}
          onPress={m.toggle}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={m.cur}
              initial={{ y: 16, opacity: 0, rotateX: -80 }}
              animate={{ y: 0, opacity: 1, rotateX: 0 }}
              exit={{ y: -16, opacity: 0, rotateX: 80 }}
              transition={springs.bouncy}
            >
              {m.cur === 'rub' ? '$' : '₽'}
            </motion.span>
          </AnimatePresence>
        </Pressable>
      </motion.div>

      {notes.map((n, i) => {
        const peek = i < 2;
        const target = open
          ? { y: mainH + GAP + i * (NOTE_H + GAP), scale: 1, opacity: 1 }
          : { y: mainH - NOTE_H + PEEK * (i + 1), scale: 1 - 0.05 * (i + 1), opacity: peek ? 0.85 - i * 0.3 : 0 };
        return (
          <motion.div
            key={n.key}
            className="bnote glass"
            style={{ zIndex: open ? 1 : -1 - i, height: NOTE_H, pointerEvents: open ? 'auto' : 'none' }}
            initial={{ ...target, opacity: 0 }}
            animate={target}
            transition={{ ...springs.soft, delay: open ? i * 0.06 : (notes.length - i) * 0.025 }}
            onClick={toggle}
          >
            {open && (
              <>
                <motion.span className="bnote-badge" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ ...springs.bouncy, delay: 0.1 + i * 0.06 }}>
                  {n.badge}
                </motion.span>
                <span className="bnote-text">
                  <span className="bnote-title">
                    <Words text={n.title} delay={0.12 + i * 0.06} />
                  </span>
                  <span className="bnote-line">
                    <Words text={n.text} delay={0.25 + i * 0.06} />
                  </span>
                </span>
                {n.meta && (
                  <motion.span className="bnote-meta" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 + i * 0.06 }}>
                    {n.meta}
                  </motion.span>
                )}
                {n.share !== undefined && (
                  <motion.i className="bnote-share" initial={{ scaleX: 0 }} animate={{ scaleX: n.share }} transition={{ duration: 1, ease, delay: 0.35 + i * 0.06 }} />
                )}
              </>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
