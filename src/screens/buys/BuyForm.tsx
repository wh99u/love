import { useState } from 'react';
import { actions, useStore } from '../../lib/appStore';
import { deleteImage, putImage } from '../../lib/images';
import { rub } from '../../lib/money';
import { haptic } from '../../lib/telegram';
import { Field } from '../../ui/forms';
import { Keypad } from '../../ui/Keypad';
import { PhotoPicker, type PickedPhoto } from '../../ui/PhotoPicker';
import { Pressable } from '../../ui/Pressable';
import { openSheet } from '../../ui/sheets';
import { toast } from '../../ui/Toast';
import { useImage } from '../../ui/useImage';

function BuyForm({ buyId, close }: { buyId?: string; close: () => void }) {
  const buy = useStore((s) => s.shared.buys.find((b) => b.id === buyId));
  const currentUrl = useImage(buy?.imgId);
  const [title, setTitle] = useState(buy?.title ?? '');
  const [url, setUrl] = useState(buy?.url ?? '');
  const [price, setPrice] = useState(buy ? String(Math.round(buy.price)) : '');
  const [photo, setPhoto] = useState<PickedPhoto | null | undefined>(undefined);

  const save = async () => {
    if (!title.trim()) {
      toast('Напишите, что хотите купить');
      return;
    }
    let imgId = buy?.imgId;
    let tint = buy?.tint;
    if (photo !== undefined) {
      if (buy?.imgId) await deleteImage(buy.imgId).catch(() => {});
      imgId = photo ? await putImage(photo.blob) : undefined;
      tint = photo?.tint;
    }
    const data = { title: title.trim(), url: url.trim(), price: Number(price || 0), imgId, tint };
    if (buy) actions.updateBuy(buy.id, data);
    else actions.addBuy(data);
    haptic('success');
    toast(buy ? 'Сохранено' : 'Добавлено в покупки', 'success');
    close();
  };

  return (
    <div>
      <h2 className="sheet-title">{buy ? 'Покупка' : 'Новая покупка'}</h2>
      <Field label="Что купить">
        <input className="input" value={title} placeholder="Например, стол" onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <Field label="Ссылка на товар">
        <input className="input" value={url} placeholder="Необязательно" inputMode="url" autoCapitalize="off" onChange={(e) => setUrl(e.target.value)} />
      </Field>
      <p className="t-cap amount-label">Фото товара</p>
      <PhotoPicker currentUrl={currentUrl} value={photo} onChange={setPhoto} />
      <p className="t-cap amount-label">Цена</p>
      <div className="amount-big money">{rub(Number(price || 0))}</div>
      <Keypad value={price} onChange={setPrice} />
      <Pressable className="btn btn--primary" feedback={false} onPress={save}>
        Сохранить
      </Pressable>
    </div>
  );
}

export const openBuyForm = (buyId?: string) => openSheet((close) => <BuyForm buyId={buyId} close={close} />);
