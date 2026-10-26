import { AnimatePresence, motion } from 'motion/react';
import { haptic } from '../../lib/telegram';
import { AnimatedNumber } from '../../ui/AnimatedNumber';
import { Icon } from '../../ui/Icon';
import { springs } from '../../ui/motion';
import { useMoney } from '../../ui/useMoney';

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
      whileTap={{ scale: 0.97 }}
    >
      <span className="note-top">
        <AnimatedNumber value={total} format={m.fmt} className="note-sum" />
        {growth >= 0.5 && (
          <motion.span className="note-delta" initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1, duration: 0.5 }}>
            +{pct}%
            <Icon name="arrowUpRight" size={11} />
          </motion.span>
        )}
      </span>
      <span className="note-cap">общий бюджет</span>
      <span className="note-x" aria-hidden="true">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span key={m.cur} initial={{ y: 12, opacity: 0, rotateX: -80 }} animate={{ y: 0, opacity: 1, rotateX: 0 }} exit={{ y: -12, opacity: 0, rotateX: 80 }} transition={springs.bouncy}>
            {m.cur === 'rub' ? '$' : '₽'}
          </motion.span>
        </AnimatePresence>
      </span>
    </motion.button>
  );
}
