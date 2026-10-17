import { motion } from 'motion/react';
import { useId, type ReactNode } from 'react';
import { rub } from '../lib/money';
import { haptic } from '../lib/telegram';
import { BANK_NAMES, type Bank } from '../lib/types';
import { BANK_THEME } from '../screens/budget/BankCard';
import { cx } from './cx';
import { springs } from './motion';

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

/** Segmented control whose white pill slides between options. */
export function Seg<T extends string>({ value, options, onChange }: { value: T; options: { id: T; label: ReactNode }[]; onChange: (v: T) => void }) {
  const group = useId();
  return (
    <div className="seg" role="group">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={o.id === value}
          onClick={() => {
            if (o.id !== value) haptic('selection');
            onChange(o.id);
          }}
        >
          {o.id === value && <motion.i className="seg-drop" layoutId={`seg-${group}`} transition={springs.snappy} />}
          <span>{o.label}</span>
        </button>
      ))}
    </div>
  );
}

/** Horizontal chips to pick one of the cards. */
export function BankChips({ banks, value, onChange, showSum = true }: { banks: Bank[]; value?: string; onChange: (id: string) => void; showSum?: boolean }) {
  return (
    <div className="chips">
      {banks.map((b) => (
        <button
          key={b.id}
          type="button"
          className={cx('chip', b.id === value && 'chip--on')}
          onClick={() => {
            haptic('selection');
            onChange(b.id);
          }}
        >
          <i className="chip-swatch" style={{ background: BANK_THEME[b.code].bg }} />
          {BANK_NAMES[b.code]}
          {showSum && <span className="chip-sum">{rub(b.sum)}</span>}
        </button>
      ))}
    </div>
  );
}
