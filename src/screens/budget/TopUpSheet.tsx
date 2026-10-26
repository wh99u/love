import { useState } from 'react';
import { actions, appStore } from '../../lib/appStore';
import { rub } from '../../lib/money';
import { cardTotal } from '../../lib/store';
import { haptic } from '../../lib/telegram';
import { AnimatedNumber } from '../../ui/AnimatedNumber';
import { Seg } from '../../ui/forms';
import { Keypad } from '../../ui/Keypad';
import { Pressable } from '../../ui/Pressable';
import { openSheet } from '../../ui/sheets';
import { toast } from '../../ui/Toast';

type Source = 'manual' | 'shortcut' | 'test';
type Mode = 'in' | 'out';

function MoneySheet({ mode: first, amount, source, close }: { mode: Mode; amount?: number; source: Source; close: () => void }) {
  const [mode, setMode] = useState<Mode>(first);
  const [value, setValue] = useState(amount ? String(amount) : '');
  const n = Number(value || 0);
  const fromNotification = source !== 'manual';

  const confirm = () => {
    if (source === 'test') {
      toast('Проверка прошла: так будет выглядеть пополнение', 'success');
      close();
      return;
    }
    if (n <= 0) return;
    haptic('success');
    if (mode === 'in') {
      const income = actions.cardTopUp(n, source);
      toast(`+${rub(n)} на карту`, 'success', { label: 'Отменить', run: () => actions.revertTopUp(income.id) });
    } else {
      actions.cardSpend(n);
      toast(`−${rub(n)} с карты · осталось ${rub(cardTotal(appStore.get()))}`, 'success', { label: 'Отменить', run: () => actions.cardSpend(-n) });
    }
    close();
  };

  return (
    <div>
      <h2 className="sheet-title">{source === 'test' ? 'Проверка автопополнения' : fromNotification ? 'Пополнение из уведомления' : 'Деньги на карте'}</h2>
      {fromNotification ? (
        <p className="t-sub sheet-lead">Проверьте сумму и зачислите.</p>
      ) : (
        <Seg
          value={mode}
          onChange={setMode}
          options={[
            { id: 'in', label: 'Пополнение' },
            { id: 'out', label: 'Списание' },
          ]}
        />
      )}
      <div className="amount-big">
        <AnimatedNumber value={n} format={(v) => `${mode === 'in' ? '+' : '−'}${rub(v)}`} className={`money ${mode === 'in' ? 'pos' : ''}`} />
      </div>
      <Keypad value={value} onChange={setValue} />
      <Pressable className="btn btn--primary" feedback={false} disabled={n <= 0} onPress={confirm}>
        {source === 'test' ? 'Понятно' : mode === 'in' ? 'Зачислить' : 'Списать'}
      </Pressable>
    </div>
  );
}

/** Money in or out of the card. */
export const openMoney = (mode: Mode = 'in') => openSheet((close) => <MoneySheet mode={mode} source="manual" close={close} />);

/** A prefilled top-up: from the iOS shortcut, or a dry run of it. */
export const openTopUp = (amount?: number, source: Source = 'manual') =>
  openSheet((close) => <MoneySheet mode="in" amount={amount} source={source} close={close} />);
