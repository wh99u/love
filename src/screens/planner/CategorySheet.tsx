import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { actions, useStore } from '../../lib/appStore';
import { fmtDay } from '../../lib/dates';
import { budgetSummary, rub } from '../../lib/money';
import { visible } from '../../lib/records';
import { haptic } from '../../lib/telegram';
import { Icon } from '../../ui/Icon';
import { ProgressLiquid } from '../../ui/ProgressLiquid';
import { Pressable } from '../../ui/Pressable';
import { openSheet } from '../../ui/sheets';
import { toast } from '../../ui/Toast';
import { openCategoryForm, openSpendForm } from './forms';

function CategorySheet({ ym, catId, close }: { ym: string; catId: string; close: () => void }) {
  const month = useStore((s) => visible(s.shared.budgets).find((b) => b.ym === ym));
  const spends = useStore((s) => s.shared.spends);
  const [confirm, setConfirm] = useState(false);
  const row = budgetSummary(month, spends, new Date()).cats.find((c) => c.cat.id === catId);
  if (!row) return null;
  const { cat, spent, pct, over } = row;
  const list = visible(spends)
    .filter((s) => s.ym === ym && s.catId === catId)
    .sort((a, b) => b.date.localeCompare(a.date));

  const remove = () => {
    if (!confirm) {
      haptic('warning');
      setConfirm(true);
      return;
    }
    actions.deleteCategory(ym, catId);
    toast(`Категория «${cat.name}» удалена`);
    close();
  };

  return (
    <div>
      <div className="cat-head">
        <span className="cat-icon cat-icon--big" style={{ background: `${cat.color}26`, color: cat.color }}>
          <Icon name={cat.icon} size={26} />
        </span>
        <div>
          <h2 className="sheet-title cat-title">{cat.name}</h2>
          <p className="t-sub">
            <b className={`money ${over ? 'neg' : ''}`}>{rub(spent)}</b> из {rub(cat.limit)}
          </p>
        </div>
        <Pressable className="icon-btn glass glass--flat" aria-label="Изменить категорию" onPress={() => openCategoryForm(ym, cat)}>
          <Icon name="edit" size={20} />
        </Pressable>
      </div>
      <ProgressLiquid value={Math.min(100, pct)} color={over ? 'var(--red)' : cat.color} height={12} />
      <p className="t-cap cat-left">{over ? `Перерасход ${rub(spent - cat.limit)}` : `Осталось ${rub(cat.limit - spent)}`}</p>

      <Pressable className="btn btn--primary" onPress={() => openSpendForm(ym, catId)}>
        <Icon name="plus" size={20} stroke={2.4} />
        Добавить трату
      </Pressable>

      <section className="list-group">
        <h3 className="t-cap list-date">Траты</h3>
        {list.length === 0 && <p className="empty">Трат пока нет.</p>}
        <AnimatePresence initial={false}>
          {list.map((s) => (
            <motion.div key={s.id} layout className="list-row" exit={{ opacity: 0, x: -40 }}>
              <span className="list-text">
                <span className="list-title">{s.note || cat.name}</span>
                <span className="t-cap">{fmtDay(s.date)}</span>
              </span>
              <b className="money">−{rub(s.amount)}</b>
              <Pressable className="icon-btn" aria-label="Удалить трату" feedback="medium" onPress={() => actions.deleteSpend(s.id)}>
                <Icon name="trash" size={18} />
              </Pressable>
            </motion.div>
          ))}
        </AnimatePresence>
      </section>

      <Pressable className="btn btn--danger" feedback={false} onPress={remove}>
        {confirm ? 'Нажмите ещё раз, чтобы удалить' : 'Удалить категорию'}
      </Pressable>
    </div>
  );
}

export const openCategory = (ym: string, catId: string) => openSheet((close) => <CategorySheet ym={ym} catId={catId} close={close} />);
