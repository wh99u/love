import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { actions, useStore } from '../../lib/appStore';
import { norm, searchCars, type CarPick } from '../../lib/cars';
import { deleteImage, putImage } from '../../lib/images';
import { rub } from '../../lib/money';
import { haptic } from '../../lib/telegram';
import { Field } from '../../ui/forms';
import { Icon } from '../../ui/Icon';
import { Keypad } from '../../ui/Keypad';
import { springs } from '../../ui/motion';
import { PhotoPicker, type PickedPhoto } from '../../ui/PhotoPicker';
import { Pressable } from '../../ui/Pressable';
import { openSheet } from '../../ui/sheets';
import { toast } from '../../ui/Toast';
import { useImage } from '../../ui/useImage';
import { ensureCarPhoto, forgetCarPhotoTry } from './carImage';

/** One field for make and model: type «порш пан» and pick «Porsche Panamera». */
function CarPicker({ value, onChange }: { value: string; onChange: (title: string, pick: CarPick | null) => void }) {
  const [q, setQ] = useState(value);
  const [open, setOpen] = useState(false);
  const list = searchCars(q, 6);
  const exact = list.some((c) => norm(c.title) === norm(q));

  const pick = (title: string, c: CarPick | null) => {
    haptic('selection');
    setQ(title);
    setOpen(false);
    onChange(title, c);
  };

  return (
    <div className="car-picker">
      <div className="car-picker-field">
        <Icon name="search" size={18} />
        <input
          className="input"
          placeholder="Марка и модель: порш панамера"
          value={q}
          autoCapitalize="words"
          autoCorrect="off"
          enterKeyHint="done"
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            onChange(e.target.value, null);
          }}
        />
      </div>
      <AnimatePresence>
        {open && (list.length > 0 || q.trim()) && (
          <motion.ul className="car-list" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
            {list.map((c, i) => (
              <motion.li key={c.title} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ ...springs.soft, delay: i * 0.03 }}>
                <button type="button" className="car-option" onClick={() => pick(c.title, c)}>
                  <b>{c.make}</b>
                  <span>{c.model}</span>
                </button>
              </motion.li>
            ))}
            {q.trim() && !exact && (
              <li>
                <button type="button" className="car-option car-option--own" onClick={() => pick(q.trim(), null)}>
                  <span>Оставить «{q.trim()}»</span>
                </button>
              </li>
            )}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

function DreamForm({ close }: { close: () => void }) {
  const car = useStore((s) => s.shared.car);
  const own = car.imgId && !car.photoFor ? car.imgId : undefined;
  const currentUrl = useImage(own);
  const [name, setName] = useState(car.name);
  const [picked, setPicked] = useState<CarPick | null>(car.make && car.model ? { make: car.make, model: car.model, title: car.name, wiki: car.name } : null);
  const [price, setPrice] = useState(car.price ? String(Math.round(car.price)) : '');
  const [date, setDate] = useState(car.date);
  const [photo, setPhoto] = useState<PickedPhoto | null | undefined>(undefined);

  const save = async () => {
    const title = name.trim() || 'Моя машина';
    const patch: Parameters<typeof actions.setCar>[0] = {
      name: title,
      make: picked?.make,
      model: picked?.model,
      price: Number(price || 0),
      date,
    };
    if (photo !== undefined) {
      if (car.imgId) await deleteImage(car.imgId).catch(() => {});
      patch.imgId = photo ? await putImage(photo.blob) : undefined;
      patch.photoFor = undefined;
      patch.photoUrl = undefined;
      patch.photoCut = undefined;
    }
    actions.setCar(patch);
    haptic('success');
    toast('Мечта сохранена', 'success');
    close();
    forgetCarPhotoTry(title);
    void ensureCarPhoto();
  };

  return (
    <div>
      <h2 className="sheet-title">Машина мечты</h2>
      <Field label="Машина">
        <CarPicker
          value={name}
          onChange={(title, c) => {
            setName(title);
            setPicked(c);
          }}
        />
      </Field>
      <p className="t-cap amount-label">Цена</p>
      <div className="amount-big money">{rub(Number(price || 0))}</div>
      <Keypad value={price} onChange={setPrice} />
      <div className="form-gap" />
      <Field label="К какой дате">
        <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>
      <p className="t-cap amount-label">Своё фото — если не нравится найденное</p>
      <PhotoPicker currentUrl={currentUrl} value={photo} onChange={setPhoto} />
      <Pressable className="btn btn--primary" feedback={false} onPress={save}>
        Сохранить
      </Pressable>
    </div>
  );
}

export const openDreamForm = () => openSheet((close) => <DreamForm close={close} />);
