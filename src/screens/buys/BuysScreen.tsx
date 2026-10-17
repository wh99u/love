import { AnimatePresence } from 'motion/react';
import { actions, useStore } from '../../lib/appStore';
import { deleteImage } from '../../lib/images';
import { rub } from '../../lib/money';
import { visible } from '../../lib/records';
import { openLink } from '../../lib/telegram';
import type { Buy } from '../../lib/types';
import { AnimatedNumber } from '../../ui/AnimatedNumber';
import { Icon } from '../../ui/Icon';
import { Pressable } from '../../ui/Pressable';
import { openSheet } from '../../ui/sheets';
import { toast } from '../../ui/Toast';
import { BuyCard } from './BuyCard';
import { openBuyForm } from './BuyForm';
import './buys.css';

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

export function BuysScreen() {
  const buys = useStore((s) => visible(s.shared.buys));
  const total = useStore((s) => visible(s.shared.banks).reduce((t, b) => t + b.sum, 0));
  const spent = buys.reduce((t, b) => t + b.price, 0);
  const after = total - spent;

  return (
    <div className="screen buys">
      <header className="buys-head">
        <span className="t-cap">Сумма покупок</span>
        <AnimatedNumber value={spent} format={rub} className="buys-sum money" />
        <span className={`buys-after glass glass--flat ${after < 0 ? 'neg' : 'pos'}`}>Останется на счетах: {rub(after)}</span>
      </header>

      {buys.length === 0 ? (
        <Pressable className="buys-empty glass" onPress={() => openBuyForm()}>
          <span className="buy-icon buys-empty-icon">
            <Icon name="bag" size={44} />
          </span>
          <span className="t-h2">Что хотите купить?</span>
          <span className="t-sub">Добавьте вещь с ценой и фото: увидите, сколько останется на картах.</span>
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
