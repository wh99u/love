import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { actions, useStore } from '../../lib/appStore';
import { addMonths, fmtMonth, monthName, ymKey } from '../../lib/dates';
import { budgetSummary, rub } from '../../lib/money';
import { visible } from '../../lib/records';
import { haptic } from '../../lib/telegram';
import { AnimatedNumber } from '../../ui/AnimatedNumber';
import { Donut } from '../../ui/Donut';
import { Surface } from '../../ui/Surface';
import { Glow } from '../../ui/Glow';
import { rise } from '../../ui/rise';
import { Icon } from '../../ui/Icon';
import { springs } from '../../ui/motion';
import { Page } from '../../ui/Page';
import { Progress } from '../../ui/Progress';
import { Pressable } from '../../ui/Pressable';
import { openCategory } from './CategorySheet';
import { openCategoryForm, openIncomeForm, openSpendForm } from './forms';
import './planner.css';

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function PlannerPage({ onBack }: { onBack: () => void }) {
  const [ym, setYm] = useState(() => ymKey(new Date()));
  const [dir, setDir] = useState(1);
  const budgets = useStore((s) => visible(s.shared.budgets));
  const spends = useStore((s) => s.shared.spends);
  const month = budgets.find((b) => b.ym === ym);
  const prev = budgets.find((b) => b.ym === addMonths(ym, -1));
  const s = budgetSummary(month, spends, new Date());
  const hasCats = s.cats.length > 0;
  const isCurrent = ym === ymKey(new Date());

  const shift = (n: number) => {
    haptic('selection');
    setDir(n);
    setYm((v) => addMonths(v, n));
  };

  const startFromTemplate = () => {
    const go = () => {
      actions.applyTemplate(ym);
      haptic('success');
    };
    if (!month?.income) openIncomeForm(ym, go);
    else go();
  };

  return (
    <Page
      title="Планировщик"
      onBack={onBack}
      overlay={
        <>
          <Glow spot={{ x: 50, y: 26, size: 100, strength: 1 }} />
          {hasCats && (
            <Pressable className="fab" feedback="medium" scale={0.92} onPress={() => openSpendForm(ym, undefined, hasCats)}>
              <Icon name="plus" size={22} stroke={2.6} />
              Трата
            </Pressable>
          )}
        </>
      }
    >
      <div className="month-switch rise">
        <Pressable className="icon-btn surface" aria-label="Предыдущий месяц" onPress={() => shift(-1)}>
          <Icon name="back" size={20} stroke={2.2} />
        </Pressable>
        <AnimatePresence mode="popLayout" initial={false} custom={dir}>
          <motion.h2
            key={ym}
            className="t-h2 month-name"
            custom={dir}
            initial={{ opacity: 0, x: dir * 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -30 }}
            transition={springs.snappy}
          >
            {capital(fmtMonth(ym))}
          </motion.h2>
        </AnimatePresence>
        <Pressable className="icon-btn surface" aria-label="Следующий месяц" onPress={() => shift(1)}>
          <Icon name="chevron" size={20} stroke={2.2} />
        </Pressable>
      </div>

      {!hasCats ? (
        <Surface className="plan-empty surface--lit rise" style={rise(1)}>
          <span className="plan-empty-icon">
            <Icon name="pie" size={30} fill />
          </span>
          <p className="t-h2">Распишите {monthName(ym)}</p>
          <p className="t-sub">Укажите доход и разделите его по категориям: сколько на жильё, еду, транспорт и мечту.</p>
          {prev && prev.cats.length > 0 && (
            <Pressable className="btn btn--primary" onPress={() => actions.copyBudget(prev.ym, ym)}>
              <Icon name="copy" size={20} />
              Скопировать план за {monthName(prev.ym)}
            </Pressable>
          )}
          <Pressable className={`btn ${prev?.cats.length ? 'btn--ghost' : 'btn--primary'}`} onPress={startFromTemplate}>
            Начать с шаблона
          </Pressable>
          <Pressable className="btn btn--ghost" onPress={() => openCategoryForm(ym)}>
            Создать свою категорию
          </Pressable>
        </Surface>
      ) : (
        <>
          <div className="plan-hero rise" style={rise(1)}>
            <Donut segments={s.cats.map((c) => ({ id: c.cat.id, value: c.cat.limit, fill: c.cat.limit ? c.spent / c.cat.limit : 0, color: c.over ? '#FF453A' : c.cat.color }))}>
              <span className="donut-text">
                <span className="t-cap">{s.left < 0 ? 'Перерасход' : 'Осталось'}</span>
                <AnimatedNumber value={Math.abs(s.left)} format={rub} className={`donut-sum money ${s.left < 0 ? 'neg' : 't-display'}`} />
                <span className="t-cap">из {rub(s.allocated)}</span>
              </span>
            </Donut>
            {isCurrent && s.perDay !== null && (
              <p className="per-day pill">
                Можно тратить <b className="money">~{rub(s.perDay)}</b> в день, до конца месяца {s.daysLeft} дн.
              </p>
            )}
          </div>

          <Pressable className="income-card surface surface--lit rise" style={rise(2)} scale={0.98} onPress={() => openIncomeForm(ym)}>
            <span className="income-row">
              <span className="t-sub">Доход на месяц</span>
              <b className="money income-sum">{rub(s.income)}</b>
            </span>
            <Progress value={s.income > 0 ? (s.allocated / s.income) * 100 : 0} color={s.free < 0 ? 'var(--red)' : 'var(--accent)'} glow />
            <span className="income-row t-cap">
              <span>Распределено {rub(s.allocated)}</span>
              <span className={s.free < 0 ? 'neg' : ''}>{s.free < 0 ? `Больше дохода на ${rub(-s.free)}` : `Свободно ${rub(s.free)}`}</span>
            </span>
          </Pressable>

          <div className="cats rise" style={rise(3)}>
            {s.cats.map((c, i) => (
              <motion.div key={c.cat.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 * i }}>
                <Pressable className="cat-row surface" scale={0.98} onPress={() => openCategory(ym, c.cat.id)}>
                  <span className="cat-icon" style={{ background: `${c.cat.color}26`, color: c.cat.color }}>
                    <Icon name={c.cat.icon} size={22} fill />
                  </span>
                  <span className="cat-main">
                    <span className="cat-top">
                      <span className="cat-name">{c.cat.name}</span>
                      <span className={`cat-sum money ${c.over ? 'neg' : ''}`}>
                        {rub(c.spent)} <span className="hint">/ {rub(c.cat.limit)}</span>
                      </span>
                    </span>
                    <Progress value={Math.min(100, c.pct)} color={c.over ? 'var(--red)' : c.cat.color} height={8} />
                  </span>
                </Pressable>
              </motion.div>
            ))}
            <Pressable className="btn btn--ghost" onPress={() => openCategoryForm(ym)}>
              <Icon name="plus" size={20} />
              Категория
            </Pressable>
          </div>
        </>
      )}

    </Page>
  );
}
