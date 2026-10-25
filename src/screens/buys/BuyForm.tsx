import { useState } from 'react';
import { actions, useStore } from '../../lib/appStore';
import { deleteImage, putImage } from '../../lib/images';
import { rub } from '../../lib/money';
import { visible } from '../../lib/records';
import { haptic } from '../../lib/telegram';
import { cx } from '../../ui/cx';
import { Field } from '../../ui/forms';
import { Keypad } from '../../ui/Keypad';
import { PhotoPicker, type PickedPhoto } from '../../ui/PhotoPicker';
import { Pressable } from '../../ui/Pressable';
import { openSheet } from '../../ui/sheets';
import { toast } from '../../ui/Toast';
import { useBuyImage } from '../../ui/useBuyImage';

function BuyForm({ buyId, listId, close }: { buyId?: string; listId?: string; close: () => void }) {
  const buy = useStore((s) => s.shared.buys.find((b) => b.id === buyId));
  const lists = useStore((s) => visible(s.shared.buyLists).sort((a, b) => a.order - b.order));
  const currentUrl = useBuyImage(buy);
  const [title, setTitle] = useState(buy?.title ?? '');
  const [url, setUrl] = useState(buy?.url ?? '');
  const [price, setPrice] = useState(buy ? String(Math.round(buy.price)) : '');
  const [list, setList] = useState<string | undefined>(buy ? buy.listId : listId);
  const [photo, setPhoto] = useState<PickedPhoto | null | undefined>(undefined);

  const save = async () => {
    if (!title.trim()) {
      toast('Напишите, что хотите купить');
      return;
    }
    let imgId = buy?.imgId;
    let src = buy?.src;
    let tint = buy?.tint;
    if (photo !== undefined) {
      if (buy?.imgId) await deleteImage(buy.imgId).catch(() => {});
      imgId = photo ? await putImage(photo.blob) : undefined;
      src = undefined;
      tint = photo?.tint;
    }
    const data = { title: title.trim(), url: url.trim(), price: Number(price || 0), imgId, src, tint, listId: list };
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
        <input className="input" value={title} placeholder="Например, куртка" onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <Field label="Ссылка на товар">
        <input className="input" value={url} placeholder="Необязательно" inputMode="url" autoCapitalize="off" onChange={(e) => setUrl(e.target.value)} />
      </Field>
      {lists.length > 0 && (
        <>
          <p className="t-cap amount-label">Вкладка</p>
          <div className="chips">
            <button type="button" className={cx('chip', !list && 'chip--on')} onClick={() => setList(undefined)}>
              Без вкладки
            </button>
            {lists.map((l) => (
              <button key={l.id} type="button" className={cx('chip', list === l.id && 'chip--on')} onClick={() => setList(l.id)}>
                {l.name}
              </button>
            ))}
          </div>
        </>
      )}
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

export const openBuyForm = (buyId?: string, listId?: string) => openSheet((close) => <BuyForm buyId={buyId} listId={listId} close={close} />);
