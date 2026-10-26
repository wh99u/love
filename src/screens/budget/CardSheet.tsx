import { useRef, useState } from 'react';
import { actions, appStore, useStore } from '../../lib/appStore';
import { cutoutFromBlob } from '../../lib/cutoutBrowser';
import { deleteImage, putImage } from '../../lib/images';
import { rub } from '../../lib/money';
import { cardTotal, mainCard } from '../../lib/store';
import { haptic } from '../../lib/telegram';
import { CardArt } from '../../ui/CardArt';
import { Icon } from '../../ui/Icon';
import { Keypad } from '../../ui/Keypad';
import { Pressable } from '../../ui/Pressable';
import { openSheet } from '../../ui/sheets';
import { toast } from '../../ui/Toast';
import { openAccruals } from './AccrualsSheet';

function CardSheet({ close }: { close: () => void }) {
  const total = useStore(cardTotal);
  const card = useStore(mainCard);
  const [value, setValue] = useState(String(Math.round(total)));
  const [last4, setLast4] = useState(card?.last4 ?? '');
  const [busy, setBusy] = useState(false);
  const file = useRef<HTMLInputElement>(null);

  const pick = async (f: File) => {
    setBusy(true);
    try {
      const { blob } = await cutoutFromBlob(f, { removeBg: false });
      const id = await putImage(blob);
      const old = mainCard(appStore.get())?.imgId;
      actions.setCard({ imgId: id });
      if (old) void deleteImage(old).catch(() => {});
    } catch {
      toast('Не получилось открыть картинку', 'error');
    } finally {
      setBusy(false);
    }
  };

  const save = () => {
    actions.setCard({ total: Number(value || 0), last4: last4.replace(/\D/g, '').slice(-4) });
    haptic('success');
    toast('Карта сохранена', 'success');
    close();
  };

  return (
    <div>
      <h2 className="sheet-title">Карта</h2>
      <Pressable className="card-sheet-art" scale={0.97} disabled={busy} onPress={() => file.current?.click()} aria-label="Сменить картинку карты">
        <CardArt />
        <span className="card-sheet-art-hint">
          <Icon name="photo" size={16} />
          {busy ? 'Готовим…' : card?.imgId ? 'Сменить картинку' : 'Добавить картинку карты'}
        </span>
      </Pressable>
      <input ref={file} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && void pick(e.target.files[0])} />
      <label className="field">
        <span>Последние 4 цифры</span>
        <input className="input" inputMode="numeric" maxLength={4} placeholder="2644" value={last4} onChange={(e) => setLast4(e.target.value.replace(/\D/g, ''))} />
      </label>
      <p className="t-cap amount-label">Баланс</p>
      <div className="amount-big money">{rub(Number(value || 0))}</div>
      <Keypad value={value} onChange={setValue} />
      <Pressable className="btn btn--primary" feedback={false} onPress={save}>
        Сохранить
      </Pressable>
      <Pressable className="btn btn--ghost" onPress={openAccruals}>
        <Icon name="clock" size={18} />
        История пополнений
      </Pressable>
    </div>
  );
}

export const openCard = () => openSheet((close) => <CardSheet close={close} />);
