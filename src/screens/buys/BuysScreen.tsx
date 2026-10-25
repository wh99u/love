import { AnimatePresence, motion } from 'motion/react';
import { useRef, useState } from 'react';
import { actions, useStore } from '../../lib/appStore';
import { deleteImage } from '../../lib/images';
import { rub } from '../../lib/money';
import { visible } from '../../lib/records';
import { haptic, openLink } from '../../lib/telegram';
import type { Buy } from '../../lib/types';
import { AnimatedNumber } from '../../ui/AnimatedNumber';
import { cx } from '../../ui/cx';
import { Icon } from '../../ui/Icon';
import { springs } from '../../ui/motion';
import { Pressable } from '../../ui/Pressable';
import { ProductIcon } from '../../ui/ProductIcon';
import { rise } from '../../ui/rise';
import { openSheet } from '../../ui/sheets';
import { toast } from '../../ui/Toast';
import { BuyCard } from './BuyCard';
import { openBuyForm } from './BuyForm';
import { openListForm } from './ListForm';
import './buys.css';

const ALL = 'all';
/** The open tab survives switching screens. */
let lastList = ALL;

function remove(b: Buy) {
  actions.deleteBuy(b.id);
  if (b.imgId) void deleteImage(b.imgId).catch(() => {});
  toast(`«${b.title}» удалено`);
}

function openMenu(b: Buy) {
  openSheet((close) => (
    <div>
      <h2 className="sheet-title">{b.title}</h2>
      <Pressable
        className="btn btn--ghost"
        onPress={() => {
          close();
          openBuyForm(b.id);
        }}
      >
        <Icon name="edit" size={20} />
        Изменить
      </Pressable>
      {b.url && (
        <Pressable className="btn btn--ghost" onPress={() => openLink(b.url)}>
          <Icon name="link" size={20} />
          Открыть ссылку
        </Pressable>
      )}
      <Pressable
        className="btn btn--danger"
        feedback="warning"
        onPress={() => {
          close();
          remove(b);
        }}
      >
        <Icon name="trash" size={20} />
        Удалить
      </Pressable>
    </div>
  ));
}

/** Tabs of the purchases: tap to filter, hold to rename or remove. */
function ListTabs({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const lists = useStore((s) => visible(s.shared.buyLists).sort((a, b) => a.order - b.order));
  const counts = useStore((s) => {
    const m = new Map<string, number>();
    for (const b of visible(s.shared.buys)) if (b.listId) m.set(b.listId, (m.get(b.listId) ?? 0) + 1);
    return m;
  });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const held = useRef(false);
  const hold = (id: string) => () => {
    held.current = false;
    if (id === ALL) return;
    timer.current = setTimeout(() => {
      held.current = true;
      haptic('medium');
      openListForm(id);
    }, 450);
  };
  const release = () => timer.current && clearTimeout(timer.current);

  const tabs = [{ id: ALL, name: 'Все' }, ...lists];
  return (
    <div className="chips list-tabs" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={t.id === value}
          className={cx('chip list-tab', t.id === value && 'list-tab--on')}
          onPointerDown={hold(t.id)}
          onPointerUp={release}
          onPointerLeave={release}
          onContextMenu={(e) => e.preventDefault()}
          onClick={() => {
            if (held.current) return;
            if (t.id !== value) haptic('selection');
            onChange(t.id);
          }}
        >
          {t.id === value && <motion.i className="list-tab-drop" layoutId="list-tab" transition={springs.snappy} />}
          <span>{t.name}</span>
          {t.id !== ALL && counts.get(t.id) ? <em>{counts.get(t.id)}</em> : null}
        </button>
      ))}
      <button type="button" className="chip list-add" aria-label="Новая вкладка" onClick={() => openListForm(undefined, onChange)}>
        <Icon name="plus" size={16} stroke={2.4} />
      </button>
    </div>
  );
}

export function BuysScreen() {
  const all = useStore((s) => visible(s.shared.buys));
  const lists = useStore((s) => visible(s.shared.buyLists));
  const total = useStore((s) => visible(s.shared.banks).reduce((t, b) => t + b.sum, 0));
  const [list, setListState] = useState(() => (lastList === ALL || lists.some((l) => l.id === lastList) ? lastList : ALL));
  const setList = (id: string) => {
    lastList = id;
    setListState(id);
  };
  const current = list === ALL || lists.some((l) => l.id === list) ? list : ALL;
  const buys = current === ALL ? all : all.filter((b) => b.listId === current);
  const spent = buys.reduce((t, b) => t + b.price, 0);
  const after = total - spent;
  const listName = lists.find((l) => l.id === current)?.name;

  return (
    <div className="screen buys">
      <header className="buys-head rise">
        <span className="pill">
          <Icon name="bag" size={15} fill />
          {listName ?? 'Все покупки'} · {buys.length}
        </span>
        <AnimatedNumber value={spent} format={rub} className="buys-sum t-hero" />
        <span className="buys-after">
          {after < 0 ? (
            <span className="tag">не хватает {rub(-after)}</span>
          ) : (
            <>
              После них на картах останется <b className="money">{rub(after)}</b>
            </>
          )}
        </span>
      </header>

      <div className="rise" style={rise(1)}>
        <ListTabs value={current} onChange={setList} />
      </div>

      {buys.length === 0 ? (
        <Pressable className="buys-empty surface surface--lit rise" style={rise(2)} onPress={() => openBuyForm(undefined, current === ALL ? undefined : current)}>
          <span className="buys-empty-art">
            <span className="buy-flare" aria-hidden="true" />
            <ProductIcon name={current === ALL ? 'bag' : 'gift'} size={104} />
          </span>
          <span className="t-h2">{current === ALL ? 'Что хотите купить?' : `Во вкладке «${listName}» пусто`}</span>
          <span className="t-sub">Добавьте вещь с ценой и фото — увидите, сколько останется на картах. Или пришлите мне ссылку на товар, я вырежу его с фото и добавлю сюда.</span>
          <span className="btn btn--primary buys-empty-btn">
            <Icon name="plus" size={18} stroke={2.4} />
            Добавить покупку
          </span>
        </Pressable>
      ) : (
        <div className="buys-grid">
          <AnimatePresence mode="popLayout">
            {buys.map((b, i) => (
              <BuyCard key={b.id} buy={b} index={i} onOpen={(x) => (x.url ? openLink(x.url) : openBuyForm(x.id))} onMenu={openMenu} />
            ))}
          </AnimatePresence>
        </div>
      )}
      {buys.length > 0 && <p className="t-cap buys-hint">Нажмите, чтобы открыть ссылку. Удерживайте, чтобы изменить или удалить.</p>}
    </div>
  );
}
