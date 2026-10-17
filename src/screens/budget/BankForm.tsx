import { motion } from 'motion/react';
import { useState } from 'react';
import { actions, useStore } from '../../lib/appStore';
import { rub } from '../../lib/money';
import { haptic } from '../../lib/telegram';
import { BANK_CODES, BANK_NAMES, type Bank, type BankCode } from '../../lib/types';
import { Keypad } from '../../ui/Keypad';
import { springs } from '../../ui/motion';
import { Pressable } from '../../ui/Pressable';
import { openSheet } from '../../ui/sheets';
import { toast } from '../../ui/Toast';
import { BANK_THEME } from './BankCard';

function BankForm({ bankId, close }: { bankId?: string; close: () => void }) {
  const bank = useStore((s) => s.shared.banks.find((b) => b.id === bankId));
  const [code, setCode] = useState<BankCode>(bank?.code ?? 'tbank');
  const [value, setValue] = useState(bank ? String(Math.round(bank.sum)) : '');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const save = () => {
    const sum = Number(value || 0);
    if (bank) {
      actions.updateBank(bank.id, { code, sum });
      toast('Карта сохранена', 'success');
    } else {
      actions.addBank(code, sum);
      toast(`${BANK_NAMES[code]} добавлен`, 'success');
    }
    haptic('success');
    close();
  };

  const remove = () => {
    if (!bank) return;
    if (!confirmDelete) {
      haptic('warning');
      setConfirmDelete(true);
      return;
    }
    actions.deleteBank(bank.id);
    toast('Карта удалена');
    close();
  };

  return (
    <div>
      <h2 className="sheet-title">{bank ? 'Карта' : 'Новая карта'}</h2>
      <div className="bank-pick" role="radiogroup" aria-label="Банк">
        {BANK_CODES.map((c) => (
          <motion.button
            key={c}
            type="button"
            role="radio"
            aria-checked={c === code}
            className="bank-pick-card"
            style={{ background: BANK_THEME[c].bg, color: BANK_THEME[c].ink }}
            animate={{ y: c === code ? -8 : 0, scale: c === code ? 1.06 : 0.94, opacity: c === code ? 1 : 0.55 }}
            transition={springs.bouncy}
            onClick={() => {
              haptic('selection');
              setCode(c);
            }}
          >
            {BANK_NAMES[c]}
            {c === code && <motion.span layoutId="bank-pick-ring" className="bank-pick-ring" transition={springs.snappy} />}
          </motion.button>
        ))}
      </div>
      <p className="t-cap amount-label">Баланс</p>
      <div className="amount-big money">{rub(Number(value || 0))}</div>
      <Keypad value={value} onChange={setValue} />
      <Pressable className="btn btn--primary" feedback={false} onPress={save}>
        Сохранить
      </Pressable>
      {bank && (
        <Pressable className="btn btn--danger" feedback={false} onPress={remove}>
          {confirmDelete ? 'Нажмите ещё раз, чтобы удалить' : 'Удалить карту'}
        </Pressable>
      )}
    </div>
  );
}

export const openBankForm = (bank?: Bank) => openSheet((close) => <BankForm bankId={bank?.id} close={close} />);
