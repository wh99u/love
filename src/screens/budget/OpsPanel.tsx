import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { rub } from '../../lib/money';
import { haptic } from '../../lib/telegram';
import { Icon } from '../../ui/Icon';
import { springs } from '../../ui/motion';

/** Top panel: tap to see what all planned purchases cost and what would be left. */
export function OpsPanel({ spent, total }: { spent: number; total: number }) {
  const [open, setOpen] = useState(false);
  const after = total - spent;
  return (
    <motion.button
      layout
      className="ops glass glass--strong glass--blur"
      aria-expanded={open}
      onClick={() => {
        haptic('light');
        setOpen((o) => !o);
      }}
      transition={springs.snappy}
    >
      <motion.span layout="position" className="ops-head">
        <Icon name="bell" size={22} />
        Операции
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={springs.snappy} className="ops-chev">
          <Icon name="down" size={18} />
        </motion.span>
      </motion.span>
      <AnimatePresence initial={false}>
        {open && (
          <motion.span
            className="ops-body"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <span className="t-cap">Сумма всех покупок</span>
            <span className="ops-sum money">{rub(spent)}</span>
            <span className="t-cap">
              На счетах после покупок: <b className={after < 0 ? 'neg' : 'pos'}>{rub(after)}</b>
            </span>
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
