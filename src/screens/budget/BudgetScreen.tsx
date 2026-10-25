import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { useStore } from '../../lib/appStore';
import { monthIn, monthName, ymKey } from '../../lib/dates';
import { budgetSummary, monthAccruals, rub } from '../../lib/money';
import { visible } from '../../lib/records';
import { BANK_NAMES, type Bank } from '../../lib/types';
import { AnimatedNumber } from '../../ui/AnimatedNumber';
import { Avatars, usePartners } from '../../ui/Avatars';
import { Icon } from '../../ui/Icon';
import { springs } from '../../ui/motion';
import { Pressable } from '../../ui/Pressable';
import { Ring } from '../../ui/Ring';
import { rise } from '../../ui/rise';
import { ActionRow } from './ActionRow';
import { BANK_THEME } from './BankCard';
import { CardPocket } from './CardPocket';
import { balanceFontSize, clampIndex } from './pocket';
import './budget.css';

export interface BudgetHandlers {
  onTopUp: (bank?: Bank) => void;
  onTransfer: (bank?: Bank) => void;
  onNewCard: () => void;
  onEditCard: (bank: Bank) => void;
  onSearch: () => void;
  onAccruals: () => void;
  onOpenPlanner: () => void;
  onOpenShortcut: () => void;
  onOpenSync: () => void;
}

/** Accrual tiles echo the bank app's stacked icons: latest records, tallest last. */
function AccrualStack({ kinds }: { kinds: { key: string; icon: string; color: string; bg: string }[] }) {
  return (
    <span className="stack" aria-hidden="true">
      {kinds.map((k, i) => (
        <span key={k.key} className="stack-tile" style={{ height: 30 + i * 14, background: k.bg, color: k.color }}>
          <Icon name={k.icon} size={18} fill />
        </span>
      ))}
    </span>
  );
}

export function BudgetScreen(h: BudgetHandlers) {
  const banks = useStore((s) => visible(s.shared.banks).sort((a, b) => a.order - b.order));
  const buys = useStore((s) => visible(s.shared.buys));
  const shifts = useStore((s) => s.personal.shifts);
  const incomes = useStore((s) => s.shared.incomes);
  const budgets = useStore((s) => s.shared.budgets);
  const spends = useStore((s) => s.shared.spends);
  const partners = usePartners();
  const [index, setIndex] = useState(0);
  const i = clampIndex(index, banks.length);
  const bank = banks[i];

  const today = new Date();
  const ym = ymKey(today);
  const total = banks.reduce((t, b) => t + b.sum, 0);
  const spentOnBuys = buys.reduce((t, b) => t + b.price, 0);
  const after = total - spentOnBuys;
  const accrued = monthAccruals(shifts, ym);
  const month = visible(budgets).find((b) => b.ym === ym);
  const summary = budgetSummary(month, spends, today);

  const stack = useMemo(() => {
    const shiftRecs = visible(shifts).map((s) => ({
      key: s.id,
      date: s.date,
      icon: s.type === 'd' ? 'sun' : 'moon',
      color: s.type === 'd' ? 'var(--yellow)' : 'var(--blue)',
      bg: s.type === 'd' ? 'rgba(255,210,63,.13)' : 'rgba(127,168,255,.13)',
    }));
    const incomeRecs = visible(incomes).map((x) => {
      const b = banks.find((bb) => bb.id === x.bankId);
      return { key: x.id, date: x.date, icon: 'plus', color: b ? BANK_THEME[b.code].ink : '#fff', bg: b ? BANK_THEME[b.code].bg : 'rgba(255,255,255,.1)' };
    });
    return [...shiftRecs, ...incomeRecs].sort((a, b) => a.date.localeCompare(b.date)).slice(-3);
  }, [shifts, incomes, banks]);

  const totalText = rub(total);
  const leftPct = summary.allocated > 0 ? (Math.max(0, summary.left) / summary.allocated) * 100 : 0;

  return (
    <div className="screen budget">
      <div className="profile rise">
        <Pressable className="profile-me" aria-label="Общий план" onPress={h.onOpenSync} scale={0.92}>
          <Avatars />
        </Pressable>
        <Pressable className="search surface" onPress={h.onSearch} scale={0.98}>
          <Icon name="search" size={20} />
          <span>Поиск</span>
        </Pressable>
        <Pressable className="planner-btn surface" aria-label="Планировщик бюджета" onPress={h.onOpenPlanner} scale={0.9}>
          <Icon name="pie" size={22} />
        </Pressable>
      </div>

      <div className="hero rise" style={rise(1)}>
        <div className="pill bank-pill">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={bank?.id ?? 'none'}
              initial={{ y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -14, opacity: 0 }}
              transition={springs.snappy}
              className="bank-pill-in"
            >
              {bank ? (
                <>
                  <i style={{ background: BANK_THEME[bank.code].dot, boxShadow: `0 0 8px ${BANK_THEME[bank.code].dot}` }} />
                  <span>{BANK_NAMES[bank.code]}</span>
                  <b className="money">{rub(bank.sum)}</b>
                </>
              ) : (
                <span>Карт пока нет</span>
              )}
            </motion.span>
          </AnimatePresence>
        </div>
        <AnimatedNumber value={total} format={rub} className="total t-hero" style={{ fontSize: balanceFontSize(totalText) }} />
        <span className="hero-caption">
          {partners.length > 0 ? (
            <>
              Общий баланс <span className="tag">вместе с {partners[0].name}</span>
            </>
          ) : (
            'Баланс на всех картах'
          )}
        </span>
        <div className="dots" aria-hidden="true">
          {banks.length > 1 && banks.map((b, n) => <motion.i key={b.id} animate={{ width: n === i ? 18 : 6, opacity: n === i ? 1 : 0.28 }} transition={springs.snappy} />)}
        </div>
      </div>

      <div className="rise" style={rise(2)}>
        <CardPocket banks={banks} index={i} onIndex={setIndex} onCardPress={h.onEditCard} onEmptyPress={h.onNewCard} />
      </div>

      <div className="rise" style={rise(3)}>
        <ActionRow
          actions={[
            { id: 'topup', label: 'Пополнить', icon: 'plus', run: () => h.onTopUp(bank) },
            { id: 'transfer', label: 'Перевести', icon: 'transfer', run: () => h.onTransfer(bank) },
            { id: 'together', label: 'Вместе', icon: 'users', run: h.onOpenSync },
            { id: 'auto', label: 'Авто­пополнение', icon: 'bolt', run: h.onOpenShortcut },
            { id: 'card', label: 'Новая карта', icon: 'card', run: h.onNewCard },
          ]}
        />
      </div>

      <Pressable className="row-card surface surface--lit rise" style={rise(4)} onPress={h.onOpenPlanner} scale={0.98}>
        <span className="row-card-text">
          <span className="t-eyebrow">Бюджет на {monthName(ym)}</span>
          <span className="row-card-big">
            {summary.allocated > 0 ? (
              <>
                <b className={`money ${summary.left < 0 ? 'neg' : 'grad-text'}`}>{rub(summary.left)}</b>
                <span className="t-cap"> из {rub(summary.allocated)}</span>
              </>
            ) : (
              <span className="t-sub">Распределите доход по категориям</span>
            )}
          </span>
        </span>
        <Ring value={leftPct} size={52} thickness={5} color={summary.left < 0 ? 'var(--red)' : 'var(--accent)'} glow>
          {summary.allocated > 0 ? `${Math.round(leftPct)}%` : <Icon name="plus" size={18} />}
        </Ring>
      </Pressable>

      <Pressable className="row-card surface rise" style={rise(5)} onPress={h.onAccruals} scale={0.98}>
        <span className="row-card-text">
          <span className="t-eyebrow">Начисления</span>
          <span className="row-card-big">
            <b className="money grad-text">{rub(accrued)}</b>
            <span className="t-cap"> в {monthIn(ym)}</span>
          </span>
        </span>
        <AccrualStack kinds={stack} />
      </Pressable>

      {spentOnBuys > 0 && (
        <p className="after-buys rise" style={rise(6)}>
          <span className="pill">
            <Icon name="bag" size={15} />
            После всех покупок останется <b className={`money ${after < 0 ? 'neg' : ''}`}>{rub(after)}</b>
          </span>
        </p>
      )}
    </div>
  );
}
