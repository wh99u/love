import { useState } from 'react';
import { actions, appStore, useStore } from '../../lib/appStore';
import { rub } from '../../lib/money';
import { visible } from '../../lib/records';
import { haptic } from '../../lib/telegram';
import { BankChips } from '../../ui/forms';
import { Keypad } from '../../ui/Keypad';
import { Pressable } from '../../ui/Pressable';
import { openSheet } from '../../ui/sheets';
import { toast } from '../../ui/Toast';

function TransferSheet({ fromId, close }: { fromId?: string; close: () => void }) {
  const banks = useStore((s) => visible(s.shared.banks).sort((a, b) => a.order - b.order));
  const [from, setFrom] = useState(fromId ?? banks[0]?.id);
  const [to, setTo] = useState(banks.find((b) => b.id !== (fromId ?? banks[0]?.id))?.id);
  const [value, setValue] = useState('');
  const n = Number(value || 0);
  const source = banks.find((b) => b.id === from);
  const tooMuch = !!source && n > source.sum;
  const same = from === to;

  const send = () => {
    if (!from || !to || !actions.transfer(from, to, n)) return;
    haptic('success');
    toast(`Переведено ${rub(n)}`, 'success');
    close();
  };

  return (
    <div>
      <h2 className="sheet-title">Перевод между картами</h2>
      <p className="t-cap amount-label">Откуда</p>
      <BankChips banks={banks} value={from} onChange={setFrom} />
      <p className="t-cap amount-label">Куда</p>
      <BankChips banks={banks} value={to} onChange={setTo} showSum={false} />
      <div className={`amount-big money ${tooMuch ? 'neg' : ''}`}>{rub(n)}</div>
      <p className="t-cap amount-hint">{same ? 'Выберите разные карты' : tooMuch ? `На карте только ${rub(source!.sum)}` : ' '}</p>
      <Keypad value={value} onChange={setValue} />
      <Pressable className="btn btn--primary" feedback={false} disabled={n <= 0 || tooMuch || same || !to} onPress={send}>
        Перевести
      </Pressable>
    </div>
  );
}

export function openTransfer(fromId?: string) {
  if (visible(appStore.get().shared.banks).length < 2) {
    toast('Для перевода нужны хотя бы две карты');
    return;
  }
  openSheet((close) => <TransferSheet fromId={fromId} close={close} />);
}
