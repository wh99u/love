import { motion } from 'motion/react';
import { useState } from 'react';
import { actions, useStore } from '../../lib/appStore';
import { sync } from '../../lib/sync/controller';
import { builtInConfig } from '../../lib/sync/config';
import { spaceIdFrom } from '../../lib/sync/ids';
import { getUser, haptic, shareLink } from '../../lib/telegram';
import { Avatars, usePartners } from '../../ui/Avatars';
import { copyText } from '../../ui/copy';
import { Glow } from '../../ui/Glow';
import { Icon } from '../../ui/Icon';
import { Page } from '../../ui/Page';
import { Pressable } from '../../ui/Pressable';
import { rise } from '../../ui/rise';
import { Surface } from '../../ui/Surface';
import { toast } from '../../ui/Toast';
import { useSync } from '../../ui/useSync';
import { openJoin } from './JoinSheet';
import './sync.css';

const STATUS: Record<string, string> = {
  off: 'Не подключено',
  connecting: 'Подключаемся…',
  online: 'Синхронизировано',
  offline: 'Нет сети — изменения отправятся позже',
  error: 'Ошибка связи',
};

const ago = (t: number) => {
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 2) return 'только что';
  if (m < 60) return `${m} мин назад`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h} ч назад` : `${Math.round(h / 24)} дн назад`;
};

function Setup() {
  const [text, setText] = useState('');
  return (
    <Surface className="sync-card rise" style={rise(1)}>
      <span className="t-eyebrow">Один раз</span>
      <p className="t-h2">Подключите базу Firebase</p>
      <ol className="sync-steps">
        <li>
          <b>01</b>Откройте console.firebase.google.com и создайте проект (бесплатный план).
        </li>
        <li>
          <b>02</b>Build → Firestore Database → Create database. В «Rules» вставьте правила из файла firestore.rules.
        </li>
        <li>
          <b>03</b>Project settings → «Your apps» → значок «&lt;/&gt;» → скопируйте блок firebaseConfig.
        </li>
        <li>
          <b>04</b>Вставьте его сюда или пришлите мне — я встрою его в приложение, и партнёру ничего вводить не придётся.
        </li>
      </ol>
      <textarea className="input sync-config" placeholder={'const firebaseConfig = {\n  apiKey: "…",\n  projectId: "…",\n};'} value={text} onChange={(e) => setText(e.target.value)} />
      <Pressable
        className="btn btn--primary"
        disabled={!text.trim()}
        onPress={() => {
          if (sync.saveConfig(text)) {
            haptic('success');
            toast('База подключена', 'success');
          } else toast('Не вижу apiKey и projectId в тексте', 'error');
        }}
      >
        Сохранить
      </Pressable>
    </Surface>
  );
}

function NameField() {
  const saved = useStore((s) => s.personal.settings.name ?? '');
  const [name, setName] = useState(saved);
  return (
    <label className="field">
      <span>Как вас зовут</span>
      <input
        className="input"
        placeholder="Имя, которое увидит партнёр"
        value={name}
        maxLength={24}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => {
          actions.setSettings({ name: name.trim() });
          sync.touch();
        }}
      />
    </label>
  );
}

function Invite() {
  const s = useSync();
  const link = sync.inviteLink();
  const code = s.spaceId ?? '';
  const name = useStore((st) => st.personal.settings.name?.trim()) || getUser().firstName;
  return (
    <Surface className="sync-card rise" style={rise(2)}>
      <span className="t-eyebrow">Приглашение</span>
      <p className="t-sub">Отправьте ссылку партнёру. По ней сайт откроется и предложит присоединиться.</p>
      <NameField />
      {link && (
        <Pressable
          className="btn btn--primary"
          onPress={() => {
            if (!shareLink(link, `${name} приглашает вести общий план`)) copyText(link);
          }}
        >
          <Icon name="share" size={20} fill />
          Отправить приглашение
        </Pressable>
      )}
      <div className="sync-code">
        <span className="t-cap">Код</span>
        <code>{code.replace(/(.{5})(?=.)/g, '$1 ')}</code>
        <Pressable className="sync-copy" feedback={false} aria-label="Скопировать ссылку" onPress={() => copyText(link || code)}>
          <Icon name="copy" size={18} />
        </Pressable>
      </div>
    </Surface>
  );
}

function JoinByCode({ onJoined }: { onJoined: () => void }) {
  const [text, setText] = useState('');
  const id = spaceIdFrom(text);
  return (
    <Surface className="sync-card rise" style={rise(2)}>
      <span className="t-eyebrow">02 · У меня есть приглашение</span>
      <p className="t-sub">Вставьте ссылку или код из 20 символов.</p>
      <input className="input" placeholder="Код или ссылка" value={text} autoCapitalize="off" autoCorrect="off" onChange={(e) => setText(e.target.value)} />
      <Pressable className="btn btn--ghost" disabled={!id} onPress={() => id && openJoin(id, onJoined)}>
        Подключиться
      </Pressable>
    </Surface>
  );
}

export function SyncPage({ onBack }: { onBack: () => void }) {
  const s = useSync();
  const partners = usePartners();
  const [creating, setCreating] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const create = async () => {
    setCreating(true);
    try {
      await sync.create();
      haptic('success');
    } catch {
      toast('Не получилось создать план. Проверьте интернет', 'error');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Page title="Вместе" onBack={onBack} overlay={<Glow spot={{ x: 50, y: 18, size: 100, strength: 1 }} />}>
      <div className="sync-hero rise">
        {s.spaceId ? (
          <span className="sync-avatars">
            <Avatars />
          </span>
        ) : (
          <motion.span className="sync-badge" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }}>
            <Icon name="users" size={34} fill />
          </motion.span>
        )}
        <h1 className="t-title grad-text">{s.spaceId ? (partners.length ? `Вы и ${partners.map((p) => p.name).join(', ')}` : 'Общий план создан') : 'Общий план на двоих'}</h1>
        {s.spaceId ? (
          <span className={`pill sync-status sync-status--${s.status}`}>
            <i />
            {STATUS[s.status]}
          </span>
        ) : (
          <p className="t-sub sync-lead">Карты, пополнения, покупки, бюджет и мечта — общие и обновляются сразу у обоих. Смены и задачи остаются личными.</p>
        )}
      </div>

      {!s.configured ? (
        <Setup />
      ) : !s.spaceId ? (
        <>
          <Surface className="sync-card surface--lit rise" style={rise(1)}>
            <span className="t-eyebrow">01 · Начать</span>
            <p className="t-sub">Создайте общий план из ваших данных и пригласите партнёра.</p>
            <Pressable className="btn btn--primary" disabled={creating} onPress={create}>
              {creating ? 'Создаём…' : 'Создать общий план'}
            </Pressable>
          </Surface>
          <JoinByCode onJoined={() => {}} />
        </>
      ) : (
        <>
          {partners.length > 0 && (
            <Surface className="sync-card surface--lit rise" style={rise(1)}>
              <span className="t-eyebrow">Участники</span>
              {partners.map((p) => (
                <div key={p.name + p.seen} className="sync-member">
                  <span className="avatar avatar--letter sync-member-face">{p.name.slice(0, 1).toUpperCase()}</span>
                  <span className="sync-member-text">
                    <b>{p.name}</b>
                    <span className="t-cap">Последний вход: {ago(p.seen)}</span>
                  </span>
                  <span className="tag">партнёр</span>
                </div>
              ))}
            </Surface>
          )}
          <Invite />
          {s.error && <p className="t-cap sync-error">Код ошибки: {s.error}</p>}
          <Pressable
            className="btn btn--danger rise"
            style={rise(3)}
            onPress={() => {
              if (!confirmLeave) {
                haptic('warning');
                setConfirmLeave(true);
                return;
              }
              sync.leave();
              setConfirmLeave(false);
              toast('Вы вышли из общего плана. Данные остались на телефоне');
            }}
          >
            <Icon name="signOut" size={20} />
            {confirmLeave ? 'Нажмите ещё раз, чтобы выйти' : 'Выйти из общего плана'}
          </Pressable>
        </>
      )}
      {!builtInConfig() && s.configured && <p className="t-cap sync-foot">База подключена только на этом телефоне. Пришлите мне конфиг — встрою его, и партнёру не придётся его вводить.</p>}
    </Page>
  );
}
