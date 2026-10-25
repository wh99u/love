import { useState } from 'react';
import { actions, useStore } from '../../lib/appStore';
import { haptic } from '../../lib/telegram';
import { Field } from '../../ui/forms';
import { Pressable } from '../../ui/Pressable';
import { openSheet } from '../../ui/sheets';
import { toast } from '../../ui/Toast';

const IDEAS = ['Одежда', 'Для дома', 'Техника', 'Подарки', 'Красота', 'Спорт'];

function ListForm({ listId, close, onCreated }: { listId?: string; close: () => void; onCreated?: (id: string) => void }) {
  const list = useStore((s) => s.shared.buyLists.find((l) => l.id === listId));
  const [name, setName] = useState(list?.name ?? '');
  const [confirm, setConfirm] = useState(false);

  const save = () => {
    const n = name.trim();
    if (!n) return;
    if (list) actions.renameBuyList(list.id, n);
    else onCreated?.(actions.addBuyList(n).id);
    haptic('success');
    close();
  };

  return (
    <div>
      <h2 className="sheet-title">{list ? 'Вкладка' : 'Новая вкладка'}</h2>
      <Field label="Название">
        <input className="input" value={name} placeholder="Например, одежда" autoFocus={!list} onChange={(e) => setName(e.target.value)} />
      </Field>
      {!list && (
        <div className="chips">
          {IDEAS.map((i) => (
            <button key={i} type="button" className="chip" onClick={() => setName(i)}>
              {i}
            </button>
          ))}
        </div>
      )}
      <Pressable className="btn btn--primary" feedback={false} disabled={!name.trim()} onPress={save}>
        {list ? 'Сохранить' : 'Создать'}
      </Pressable>
      {list && (
        <Pressable
          className="btn btn--danger"
          feedback="warning"
          onPress={() => {
            if (!confirm) return setConfirm(true);
            actions.deleteBuyList(list.id);
            toast('Вкладка удалена, покупки остались во «Все»');
            close();
          }}
        >
          {confirm ? 'Нажмите ещё раз, чтобы удалить' : 'Удалить вкладку'}
        </Pressable>
      )}
    </div>
  );
}

export const openListForm = (listId?: string, onCreated?: (id: string) => void) =>
  openSheet((close) => <ListForm listId={listId} close={close} onCreated={onCreated} />);
