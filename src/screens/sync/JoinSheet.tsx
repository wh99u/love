import { useEffect, useState } from 'react';
import { sync } from '../../lib/sync/controller';
import type { Member } from '../../lib/sync/transport';
import { haptic } from '../../lib/telegram';
import { Icon } from '../../ui/Icon';
import { Pressable } from '../../ui/Pressable';
import { openSheet } from '../../ui/sheets';
import { toast } from '../../ui/Toast';

type Peek = { state: 'loading' } | { state: 'found'; members: Member[] } | { state: 'missing' } | { state: 'error' };

function JoinSheet({ space, close, onJoined }: { space: string; close: () => void; onJoined?: () => void }) {
  const [peek, setPeek] = useState<Peek>({ state: 'loading' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    sync
      .peek(space)
      .then((m) => alive && setPeek(m ? { state: 'found', members: Object.values(m) } : { state: 'missing' }))
      .catch(() => alive && setPeek({ state: 'error' }));
    return () => {
      alive = false;
    };
  }, [space]);

  const join = async (mode: 'merge' | 'theirs') => {
    setBusy(true);
    try {
      await sync.join(space, mode);
      haptic('success');
      toast('Готово: план теперь общий', 'success');
      close();
      onJoined?.();
    } catch {
      toast('Не получилось подключиться. Проверьте интернет', 'error');
    } finally {
      setBusy(false);
    }
  };

  const host = peek.state === 'found' ? peek.members.sort((a, b) => a.seen - b.seen)[0] : undefined;

  return (
    <div className="join">
      <span className="sync-badge">
        <Icon name="users" size={30} fill />
      </span>
      <h2 className="sheet-title join-title">{host ? `${host.name} приглашает в общий план` : 'Приглашение в общий план'}</h2>
      {peek.state === 'loading' && <p className="t-sub join-text">Проверяем приглашение…</p>}
      {peek.state === 'missing' && <p className="t-sub join-text">Такого плана нет. Попросите прислать ссылку ещё раз.</p>}
      {peek.state === 'error' && <p className="t-sub join-text">Не удалось проверить приглашение. Нужен интернет.</p>}
      {peek.state === 'found' && (
        <>
          <p className="t-sub join-text">Карты, пополнения, покупки, бюджет и мечта станут общими и будут обновляться у обоих. Смены и задачи останутся вашими.</p>
          <Pressable className="btn btn--primary" disabled={busy} onPress={() => join('merge')}>
            <Icon name="users" size={20} />
            Объединить с моими данными
          </Pressable>
          <Pressable className="btn btn--ghost" disabled={busy} onPress={() => join('theirs')}>
            Взять только общие данные
          </Pressable>
          <p className="t-cap join-note">Во втором случае ваши карты и покупки не попадут в общий план; копия останется в памяти телефона.</p>
        </>
      )}
      <Pressable className="btn btn--ghost" onPress={close}>
        Не сейчас
      </Pressable>
    </div>
  );
}

export function openJoin(space: string, onJoined?: () => void) {
  const s = sync.get();
  if (s.spaceId === space) {
    toast('Вы уже в этом общем плане');
    return;
  }
  if (!s.configured) {
    toast('Синхронизация ещё не настроена. Откройте «Вместе»', 'error');
    onJoined?.();
    return;
  }
  openSheet((close) => <JoinSheet space={space} close={close} onJoined={onJoined} />);
}
