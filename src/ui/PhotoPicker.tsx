import { useEffect, useRef, useState } from 'react';
import { cutoutFromBlob, loadImageBlob, type CutoutResult } from '../lib/cutoutBrowser';
import { imagesAvailable } from '../lib/images';
import { Seg } from './forms';
import { Icon } from './Icon';
import { Pressable } from './Pressable';
import { toast } from './Toast';

export type PickedPhoto = CutoutResult;

interface PhotoPickerProps {
  /** Photo already saved for this item (object URL), shown until a new one is picked. */
  currentUrl?: string | null;
  value: PickedPhoto | null | undefined;
  /** undefined = untouched, null = remove the photo, object = new photo */
  onChange: (v: PickedPhoto | null | undefined) => void;
}

export function PhotoPicker({ currentUrl, value, onChange }: PhotoPickerProps) {
  const [ok, setOk] = useState(true);
  const [source, setSource] = useState<Blob | null>(null);
  const [removeBg, setRemoveBg] = useState(true);
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState('');
  const [showLink, setShowLink] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);

  useEffect(() => {
    imagesAvailable().then(setOk);
  }, []);

  useEffect(() => {
    if (!value) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(value.blob);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  const process = async (blob: Blob, cut: boolean) => {
    setBusy(true);
    try {
      const r = await cutoutFromBlob(blob, { removeBg: cut });
      if (cut && !r.removed) toast('Фон не однотонный, оставили как есть');
      onChange(r);
    } catch {
      toast('Не получилось открыть картинку', 'error');
    } finally {
      setBusy(false);
    }
  };

  const take = (blob: Blob) => {
    setSource(blob);
    setRemoveBg(true);
    void process(blob, true);
  };

  const fromLink = async () => {
    const blob = await loadImageBlob(link.trim());
    if (!blob) {
      toast('Сайт не отдаёт картинку. Сохраните её в галерею и выберите оттуда', 'error');
      return;
    }
    setShowLink(false);
    take(blob);
  };

  if (!ok) return <p className="t-cap photo-off">Фото недоступны: браузер не даёт хранить картинки.</p>;

  const shown = value === null ? null : (preview ?? currentUrl ?? null);

  return (
    <div className="photo">
      <div className="photo-preview">
        {shown ? <img src={shown} alt="" /> : <Icon name="photo" size={34} />}
        {busy && <span className="photo-busy">Обрабатываем…</span>}
      </div>
      <div className="photo-actions">
        <Pressable className="btn btn--ghost" onPress={() => file.current?.click()}>
          <Icon name="photo" size={20} />
          Из галереи
        </Pressable>
        <Pressable className="btn btn--ghost" onPress={() => setShowLink((v) => !v)}>
          <Icon name="link" size={20} />
          По ссылке
        </Pressable>
      </div>
      {showLink && (
        <div className="photo-link">
          <input className="input" placeholder="Ссылка на картинку" value={link} inputMode="url" autoCapitalize="off" onChange={(e) => setLink(e.target.value)} />
          <Pressable className="btn btn--primary" disabled={!link.trim()} onPress={fromLink}>
            Загрузить
          </Pressable>
        </div>
      )}
      {source && (
        <Seg
          value={removeBg ? 'cut' : 'keep'}
          onChange={(v) => {
            const cut = v === 'cut';
            setRemoveBg(cut);
            void process(source, cut);
          }}
          options={[
            { id: 'cut', label: 'Убрать фон' },
            { id: 'keep', label: 'Оставить фон' },
          ]}
        />
      )}
      {(shown || value) && (
        <button type="button" className="photo-remove t-cap" onClick={() => onChange(null)}>
          Убрать фото
        </button>
      )}
      <input
        ref={file}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) take(f);
          e.target.value = '';
        }}
      />
    </div>
  );
}
