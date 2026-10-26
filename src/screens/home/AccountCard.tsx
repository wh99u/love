import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { BANK_NAMES, type Bank } from '../../lib/types';
import { Icon } from '../../ui/Icon';
import { springs } from '../../ui/motion';
import { Pressable } from '../../ui/Pressable';
import { useMoney } from '../../ui/useMoney';
import { BANK_THEME } from '../budget/BankCard';

interface AccountCardProps {
  banks: Bank[];
  index: number;
  onIndex: (i: number) => void;
  onOpen: () => void;
  onAdd: () => void;
}

const flip = {
  enter: (dir: number) => ({ rotateY: dir * -80, x: dir * 18, opacity: 0, scale: 0.9 }),
  center: { rotateY: 0, x: 0, opacity: 1, scale: 1 },
  exit: (dir: number) => ({ rotateY: dir * 80, x: dir * -18, opacity: 0, scale: 0.9 }),
};
const slide = {
  enter: (dir: number) => ({ y: dir * 16, opacity: 0, filter: 'blur(4px)' }),
  center: { y: 0, opacity: 1, filter: 'blur(0px)' },
  exit: (dir: number) => ({ y: dir * -16, opacity: 0, filter: 'blur(4px)' }),
};

/** «Bank Account» from the reference: the card in hand, the white button flips to the next one. */
export function AccountCard({ banks, index, onIndex, onOpen, onAdd }: AccountCardProps) {
  const m = useMoney();
  const [turns, setTurns] = useState(0);
  const bank = banks[index];

  if (!bank) {
    return (
      <Pressable className="acct surface" scale={0.98} onPress={onAdd}>
        <span className="acct-thumb acct-thumb--empty">
          <Icon name="card" size={22} />
        </span>
        <span className="acct-text">
          <b>Добавьте карту</b>
          <span>Баланс появится на главном</span>
        </span>
        <span className="acct-swap" aria-hidden="true">
          <Icon name="plus" size={22} stroke={2.2} />
        </span>
      </Pressable>
    );
  }

  const t = BANK_THEME[bank.code];
  const next = () => {
    setTurns((n) => n + 1);
    onIndex((index + 1) % banks.length);
  };

  return (
    <div className="acct surface">
      <Pressable className="acct-main" scale={0.98} onPress={onOpen} aria-label={`${BANK_NAMES[bank.code]}: открыть карты`}>
        <span className="acct-thumb">
          <AnimatePresence mode="popLayout" initial={false} custom={1}>
            <motion.span
              key={bank.id}
              className="acct-mini"
              style={{ background: t.bg, color: t.ink }}
              custom={1}
              variants={flip}
              initial="enter"
              animate="center"
              exit="exit"
              transition={springs.soft}
            >
              <b>{BANK_NAMES[bank.code]}</b>
              <i />
              <em>•••• ••••</em>
            </motion.span>
          </AnimatePresence>
        </span>
        <span className="acct-text">
          <AnimatePresence mode="popLayout" initial={false} custom={1}>
            <motion.b key={bank.id} custom={1} variants={slide} initial="enter" animate="center" exit="exit" transition={springs.soft}>
              {BANK_NAMES[bank.code]}
            </motion.b>
          </AnimatePresence>
          <AnimatePresence mode="popLayout" initial={false} custom={1}>
            <motion.span key={`${bank.id}${m.cur}`} className="money" custom={1} variants={slide} initial="enter" animate="center" exit="exit" transition={{ ...springs.soft, delay: 0.05 }}>
              <i className="acct-stars">****</i> {m.fmt(bank.sum)}
            </motion.span>
          </AnimatePresence>
        </span>
      </Pressable>
      <Pressable className="acct-swap" aria-label="Следующая карта" feedback="selection" scale={0.86} disabled={banks.length < 2} onPress={next}>
        <motion.span style={{ display: 'grid' }} animate={{ rotate: turns * 180 }} transition={springs.bouncy}>
          <Icon name="transfer" size={22} />
        </motion.span>
      </Pressable>
    </div>
  );
}
