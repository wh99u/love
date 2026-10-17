import { useState } from 'react';
import { actions, appStore, useStore } from '../../lib/appStore';
import { rub } from '../../lib/money';
import { visible } from '../../lib/records';
import { haptic } from '../../lib/telegram';
import { BANK_NAMES } from '../../lib/types';
import { AnimatedNumber } from '../../ui/AnimatedNumber';
import { BankChips } from '../../ui/forms';
import { Keypad } from '../../ui/Keypad';
import { Pressable } from '../../ui/Pressable';
import { openSheet } from '../../ui/sheets';
import { toast } from '../../ui/Toast';
import { openBankForm } from './BankForm';

type Source = 'manual' | 'shortcut' | 'test';

function TopUpSheet({ bankId, amount, source, close }: { bankId?: string; amount?: number; source: Source; close: () => void }) {
  const banks = useStore((s) => visible(s.shared.banks).sort((a, b) => a.order - b.order));
  const [target, setTarget] = useState(bankId ?? banks[0]?.id);
  const [value, setValue] = useState(amount ? String(amount) : '');
  const n = Number(value || 0);
  const fromNotification = source !== 'manual';

  const confirm = () => {
    if (source === 'test') {
      toast('Проверка прошла: так будет выглядеть пополнение', 'success');
      close();
      return;
    }
    const bank = banks.find((b) => b.id === target);
    if (!bank || n <= 0) return;
    const income = actions.topUp(bank.id, n, source);
    haptic('success');
    toast(`+${rub(n)} на ${BANK_NAMES[bank.code]}`, 'success', { label: 'Отменить', run: () => actions.revertTopUp(income.id) });
    close();
  };

  return (
    <div>
      <h2 className="sheet-title">{source === 'test' ? 'Проверка автопополнения' : fromNotification ? 'Пополнение из уведомления' : 'Пополнение'}</h2>
      {fromNotification && <p className="t-sub sheet-lead">Проверьте сумму и карту, затем зачислите.</p>}
      <div className="amount-big">
        <AnimatedNumber value={n} format={(v) => `+${rub(v)}`} className="money pos" />
      </div>
      <BankChips banks={banks} value={target} onChange={setTarget} />
      <Keypad value={value} onChange={setValue} />
      <Pressable className="btn btn--primary" feedback={false} disabled={n <= 0 || !target} onPress={confirm}>
        {source === 'test' ? 'Понятно' : 'Зачислить'}
      </Pressable>
    </div>
  );
}

/** Opens the top-up sheet; without cards it asks to add one first. */
export function openTopUp(bankId?: string, amount?: number, source: Source = 'manual') {
  if (!visible(appStore.get().shared.banks).length) {
    toast('Сначала добавьте карту');
    openBankForm();
    return;
  }
  openSheet((close) => <TopUpSheet bankId={bankId} amount={amount} source={source} close={close} />);
}
