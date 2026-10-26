import { AnimatePresence, animate, motion, useMotionValue } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { rateLabel } from '../../lib/currency';
import { rub } from '../../lib/money';
import { haptic } from '../../lib/telegram';
import type { Currency } from '../../lib/types';
import { Icon } from '../../ui/Icon';
import { springs } from '../../ui/motion';
import { Swap } from '../../ui/Swap';
import { useMoney } from '../../ui/useMoney';

const ease = [0.16, 1, 0.3, 1] as const;
const usd = (v: number) => `$${Math.round(v).toLocaleString('en-US')}`;
const show = (cur: Currency, v: number) => (cur === 'rub' ? rub(v) : usd(v));

/**
 * The amount counts to its new value. Switching ₽ and $ counts from roubles
 * down to dollars (or back up) in the new currency, while a light sweeps the
 * glass and the corner sign flips.
 */
function Amount({ value, cur }: { value: number; cur: Currency }) {
  const el = useRef<HTMLSpanElement>(null);
  const mv = useMotionValue(value);
  const [text, setText] = useState(() => show(cur, value));
  const last = useRef(cur);

  useEffect(() => {
    const switched = last.current !== cur;
    last.current = cur;
    const run = animate(mv, value, { duration: switched ? 1.15 : 0.8, ease, onUpdate: (v) => setText(show(cur, v)) });
    if (switched && el.current) animate(el.current, { filter: ['blur(0px)', 'blur(4px)', 'blur(0px)'], scale: [1, 0.95, 1] }, { duration: 0.7, ease, times: [0, 0.3, 1] });
    return () => run.stop();
  }, [value, cur, mv]);

  return (
    <span ref={el} className="note-sum" aria-label={show(cur, value)}>
      {text}
    </span>
  );
}

/** «$22 K +14% ↗ upcoming this week» from the reference: the total in a frosted notification; a tap switches ₽ and $. */
export function BudgetNote({ total, weekIn }: { total: number; weekIn: number }) {
  const m = useMoney();
  const before = total - weekIn;
  const growth = weekIn > 0 && before > 0 ? (weekIn / before) * 100 : 0;
  const pct = growth < 10 ? growth.toFixed(1).replace('.', ',').replace(',0', '') : String(Math.round(growth));

  return (
    <motion.button
      type="button"
      className="note"
      aria-label={m.cur === 'rub' ? 'Общий бюджет, показать в долларах' : 'Общий бюджет, показать в рублях'}
      onClick={() => {
        haptic('selection');
        m.toggle();
      }}
      initial={{ opacity: 0, y: -16, scale: 0.94, filter: 'blur(12px)' }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }}
      transition={{ ...springs.soft, delay: 0.45, filter: { duration: 0.8, delay: 0.45 } }}
    >
      <AnimatePresence initial={false}>
        <motion.i key={m.cur} className="note-sheen" initial={{ x: '-110%' }} animate={{ x: '110%' }} exit={{ opacity: 0 }} transition={{ duration: 1.1, ease }} aria-hidden="true" />
      </AnimatePresence>
      <span className="note-top">
        <Amount value={m.cur === 'rub' ? total : total / m.rate} cur={m.cur} />
        {growth >= 0.5 && (
          <motion.span className="note-delta" initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1, duration: 0.5 }}>
            +{pct}%
            <Icon name="arrowUpRight" size={11} />
          </motion.span>
        )}
      </span>
      <Swap k={m.cur} className="note-cap">
        {m.cur === 'rub' ? 'общий бюджет' : `по курсу ${rateLabel(m.rate)}`}
      </Swap>
      <span className="note-x" aria-hidden="true">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span key={m.cur} initial={{ y: 14, opacity: 0, rotateX: -90 }} animate={{ y: 0, opacity: 1, rotateX: 0 }} exit={{ y: -14, opacity: 0, rotateX: 90 }} transition={springs.bouncy}>
            {m.cur === 'rub' ? '$' : '₽'}
          </motion.span>
        </AnimatePresence>
      </span>
    </motion.button>
  );
}
