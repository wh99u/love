import { motion } from 'motion/react';
import { useStore } from '../../lib/appStore';
import { monthName, ymKey } from '../../lib/dates';
import { budgetSummary } from '../../lib/money';
import { visible } from '../../lib/records';
import { Icon } from '../../ui/Icon';
import { springs } from '../../ui/motion';
import { Pressable } from '../../ui/Pressable';
import { Swap } from '../../ui/Swap';
import { useMoney } from '../../ui/useMoney';
import { openCategory } from '../planner/CategorySheet';
import { openSpendForm } from '../planner/forms';

const ROWS = 4;

/** «Authenticated platform» from the reference, as this month's budget: the biggest categories and «+» for a spend. */
export function PlanCard({ onOpen }: { onOpen: () => void }) {
  const ym = ymKey(new Date());
  const month = useStore((s) => visible(s.shared.budgets).find((b) => b.ym === ym));
  const spends = useStore((s) => s.shared.spends);
  const m = useMoney();
  const sum = budgetSummary(month, spends, new Date());
  const rows = [...sum.cats].sort((a, b) => b.spent - a.spent || b.cat.limit - a.cat.limit).slice(0, ROWS);

  return (
    <div className="plan-card">
      <div className="plan-card-head">
        <Pressable className="plan-card-title" scale={0.98} onPress={onOpen} aria-label="Открыть планировщик">
          <h2>Бюджет на {monthName(ym)}</h2>
          <span className="t-cap">
            <Swap k={m.cur}>{sum.allocated > 0 ? `осталось ${m.fmt(sum.left)} из ${m.fmt(sum.allocated)}` : 'планировщик'}</Swap>
          </span>
        </Pressable>
        <Pressable className="plan-card-add" aria-label="Записать трату" scale={0.86} onPress={() => (rows.length ? openSpendForm(ym) : onOpen())}>
          <Icon name="plus" size={22} />
        </Pressable>
      </div>
      {rows.length === 0 ? (
        <Pressable className="plan-card-empty" scale={0.98} onPress={onOpen}>
          <span className="t-sub">Распределите доход по категориям — здесь появятся траты месяца.</span>
          <Icon name="chevron" size={18} />
        </Pressable>
      ) : (
        <ul className="plan-card-rows">
          {rows.map(({ cat, spent, over }, i) => (
            <motion.li key={cat.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ ...springs.soft, delay: 0.5 + i * 0.06 }}>
              <Pressable className="plan-row" scale={0.98} onPress={() => openCategory(ym, cat.id)}>
                <span className="plan-row-icon">
                  <Icon name={cat.icon} size={24} fill />
                </span>
                <span className="plan-row-name">{cat.name}</span>
                <span className="plan-row-meta">
                  <Swap k={m.cur}>из {m.fmt(cat.limit)}</Swap>
                </span>
                <b className={`plan-row-sum money ${over ? 'neg' : ''}`}>
                  <Swap k={m.cur}>{spent > 0 ? `−${m.fmt(spent)}` : m.fmt(0)}</Swap>
                </b>
              </Pressable>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}
