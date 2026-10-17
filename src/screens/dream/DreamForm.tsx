import { useState } from 'react';
import { actions, useStore } from '../../lib/appStore';
import { deleteImage, putImage } from '../../lib/images';
import { rub } from '../../lib/money';
import { haptic } from '../../lib/telegram';
import { cx } from '../../ui/cx';
import { Field } from '../../ui/forms';
import { Keypad } from '../../ui/Keypad';
import { PhotoPicker, type PickedPhoto } from '../../ui/PhotoPicker';
import { Pressable } from '../../ui/Pressable';
import { openSheet } from '../../ui/sheets';
import { toast } from '../../ui/Toast';
import { useImage } from '../../ui/useImage';

const COLORS: [string, string][] = [
  ['#1c1c1e', 'Чёрный'],
  ['#e8e8ea', 'Белый'],
  ['#8d9097', 'Серый'],
  ['#1f4fbf', 'Синий'],
  ['#b3202a', 'Красный'],
];
const MODELS = ['Porsche Panamera', 'Porsche 911', 'BMW M5', 'Mercedes-AMG GT', 'Audi RS 7', 'Tesla Model S', 'Lada Vesta'];

function DreamForm({ close }: { close: () => void }) {
  const car = useStore((s) => s.shared.car);
  const currentUrl = useImage(car.imgId);
  const [name, setName] = useState(car.name);
  const [price, setPrice] = useState(car.price ? String(Math.round(car.price)) : '');
  const [date, setDate] = useState(car.date);
  const [color, setColor] = useState(car.color);
  const [photo, setPhoto] = useState<PickedPhoto | null | undefined>(undefined);

  const save = async () => {
    let imgId = car.imgId;
    if (photo !== undefined) {
      if (car.imgId) await deleteImage(car.imgId).catch(() => {});
      imgId = photo ? await putImage(photo.blob) : undefined;
    }
    actions.setCar({ name: name.trim() || 'Моя машина', price: Number(price || 0), date, color, imgId });
    haptic('success');
    toast('Мечта сохранена', 'success');
    close();
  };

  return (
    <div>
      <h2 className="sheet-title">Машина мечты</h2>
      <Field label="Модель">
        <input className="input" list="car-models" value={name} onChange={(e) => setName(e.target.value)} />
        <datalist id="car-models">
          {MODELS.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>
      </Field>
      <p className="t-cap amount-label">Цена</p>
      <div className="amount-big money">{rub(Number(price || 0))}</div>
      <Keypad value={price} onChange={setPrice} />
      <div className="form-gap" />
      <Field label="К какой дате">
        <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>
      <p className="t-cap amount-label">Цвет рисунка</p>
      <div className="swatches">
        {COLORS.map(([c, label]) => (
          <button key={c} type="button" aria-label={label} className={cx('swatch', c === color && 'swatch--on')} style={{ background: c }} onClick={() => setColor(c)} />
        ))}
      </div>
      <p className="t-cap amount-label">Своё фото вместо рисунка</p>
      <PhotoPicker currentUrl={currentUrl} value={photo} onChange={setPhoto} />
      <Pressable className="btn btn--primary" feedback={false} onPress={save}>
        Сохранить
      </Pressable>
    </div>
  );
}

export const openDreamForm = () => openSheet((close) => <DreamForm close={close} />);
