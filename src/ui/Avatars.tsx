import { useState } from 'react';
import { useStore } from '../lib/appStore';
import { getUser } from '../lib/telegram';
import type { Member } from '../lib/sync/transport';
import { cx } from './cx';
import { useSync } from './useSync';

function Face({ name, photo, className }: { name: string; photo?: string; className?: string }) {
  const [broken, setBroken] = useState(false);
  return photo && !broken ? (
    <img className={cx('avatar', className)} src={photo} alt="" onError={() => setBroken(true)} />
  ) : (
    <span className={cx('avatar avatar--letter', className)} aria-hidden="true">
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

/** The other people in the shared plan. */
export function usePartners(): Member[] {
  const s = useSync();
  return Object.entries(s.members)
    .filter(([id]) => id !== s.deviceId)
    .map(([, m]) => m)
    .sort((a, b) => b.seen - a.seen);
}

/** Me, and the partner tucked behind when the plan is shared; the dot tells the link state. */
export function Avatars() {
  const me = getUser();
  const name = useStore((st) => st.personal.settings.name?.trim()) || me.firstName;
  const s = useSync();
  const partners = usePartners();
  const shared = !!s.spaceId;
  return (
    <span className={cx('avatars', partners.length > 0 && 'avatars--pair')}>
      <Face name={name} photo={me.photoUrl} />
      {partners.slice(0, 1).map((p) => (
        <Face key="p" name={p.name} photo={p.photo} className="avatar--partner" />
      ))}
      {shared && <i className={`avatar-dot avatar-dot--${s.status}`} />}
    </span>
  );
}
