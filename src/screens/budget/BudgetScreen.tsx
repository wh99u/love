import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../../lib/appStore';
import { monthIn, monthName, ymKey } from '../../lib/dates';
import { budgetSummary, monthAccruals, rub } from '../../lib/money';
import { visible } from '../../lib/records';
import { getUser } from '../../lib/telegram';
import { BANK_NAMES, type Bank } from '../../lib/types';
import { AnimatedNumber } from '../../ui/AnimatedNumber';
import { Icon } from '../../ui/Icon';
import { springs } from '../../ui/motion';
import { Pressable } from '../../ui/Pressable';
import { Ring } from '../../ui/Ring';
import { ActionRow } from './ActionRow';
import { BANK_THEME } from './BankCard';
import { CardPocket } from './CardPocket';
import { OpsPanel } from './OpsPanel';
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
  onAmbient: (colors: [string, string, string]) => void;
}

function Avatar() {
  const user = getUser();
  const [broken, setBroken] = useState(false);
  return user.photoUrl && !broken ? (
    <img className="avatar" src={user.photoUrl} alt="" onError={() => setBroken(true)} />
  ) : (
    <span className="avatar avatar--letter" aria-hidden="true">
      {user.firstName.slice(0, 1).toUpperCase()}
    </span>
  );
}

/** Accrual tiles echo the bank app's stacked icons: latest records, tallest last. */
function AccrualStack({ kinds }: { kinds: { key: string; icon: string; color: string; bg: string }[] }) {
  return (
    <span className="stack" aria-hidden="true">
      {kinds.map((k, i) => (
        <span key={k.key} className="stack-tile" style={{ height: 30 + i * 14, background: k.bg, color: k.color }}>
          <Icon name={k.icon} size={18} />
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
  const [index, setIndex] = useState(0);
  const i = clampIndex(index, banks.length);
  const bank = banks[i];

  const today = new Date();
  const ym = ymKey(today);
  const total = banks.reduce((t, b) => t + b.sum, 0);
  const spentOnBuys = buys.reduce((t, b) => t + b.price, 0);
  const accrued = monthAccruals(shifts, ym);
  const month = visible(budgets).find((b) => b.ym === ym);
  const summary = budgetSummary(month, spends, today);

  const stack = useMemo(() => {
    const shiftRecs = visible(shifts).map((s) => ({ key: s.id, date: s.date, icon: s.type === 'd' ? 'sun' : 'moon', color: s.type === 'd' ? '#ffdd2d' : '#8ab4ff', bg: s.type === 'd' ? 'rgba(255,221,45,.16)' : 'rgba(138,180,255,.16)' }));
    const incomeRecs = visible(incomes).map((x) => {
      const b = banks.find((bb) => bb.id === x.bankId);
      return { key: x.id, date: x.date, icon: 'plus', color: b ? BANK_THEME[b.code].ink : '#fff', bg: b ? BANK_THEME[b.code].bg : 'rgba(255,255,255,.12)' };
    });
    return [...shiftRecs, ...incomeRecs].sort((a, b) => a.date.localeCompare(b.date)).slice(-3);
  }, [shifts, incomes, banks]);

  const { onAmbient } = h;
  useEffect(() => {
    if (bank) onAmbient(BANK_THEME[bank.code].glow);
  }, [bank, onAmbient]);

  const totalText = rub(total);
  const leftPct = summary.allocated > 0 ? (Math.max(0, summary.left) / summary.allocated) * 100 : 0;

  return (
    <div className="screen budget">
      <OpsPanel spent={spentOnBuys} total={total} />

      <div className="profile">
        <Avatar />
        <Pressable className="search glass" onPress={h.onSearch} scale={0.98}>
          <Icon name="search" size={22} />
          <span>Поиск</span>
        </Pressable>
        <Pressable className="planner-btn" aria-label="Планировщик бюджета" onPress={h.onOpenPlanner} scale={0.9}>
          <Icon name="pie" size={24} stroke={2} />
        </Pressable>
      </div>

      <div className="dots" aria-hidden="true">
        {banks.length > 1 && banks.map((b, n) => <motion.i key={b.id} animate={{ width: n === i ? 22 : 8, opacity: n === i ? 1 : 0.3 }} transition={springs.snappy} />)}
      </div>

      <div className="hero">
        <div className="bank-pill glass glass--flat">
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
                  <i style={{ background: BANK_THEME[bank.code].bg }} />
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
      </div>

      <CardPocket banks={banks} index={i} onIndex={setIndex} onCardPress={h.onEditCard} onEmptyPress={h.onNewCard} />

      <ActionRow
        actions={[
          { id: 'topup', label: 'Пополнить', icon: 'plus', run: () => h.onTopUp(bank) },
          { id: 'transfer', label: 'Перевести', icon: 'transfer', run: () => h.onTransfer(bank) },
          { id: 'plan', label: 'План', icon: 'pie', run: h.onOpenPlanner },
          { id: 'auto', label: 'Авто­пополнение', icon: 'bolt', run: h.onOpenShortcut },
          { id: 'card', label: 'Новая карта', icon: 'card', run: h.onNewCard },
        ]}
      />

      <Pressable className="row-card glass" onPress={h.onAccruals} scale={0.98}>
        <span className="row-card-text">
          <span className="t-h2">Начисления</span>
          <span className="t-sub">
            Начислено в {monthIn(ym)} <b className="money">{rub(accrued)}</b>
          </span>
        </span>
        <AccrualStack kinds={stack} />
      </Pressable>

      <Pressable className="row-card glass" onPress={h.onOpenPlanner} scale={0.98}>
        <span className="row-card-text">
          <span className="t-h2">Бюджет на {monthName(ym)}</span>
          <span className="t-sub">
            {summary.allocated > 0 ? (
              <>
                Осталось <b className={`money ${summary.left < 0 ? 'neg' : ''}`}>{rub(summary.left)}</b> из {rub(summary.allocated)}
              </>
            ) : (
              'Распределите доход по категориям'
            )}
          </span>
        </span>
        <Ring value={leftPct} size={48} thickness={5} color={summary.left < 0 ? 'var(--red)' : 'var(--green)'}>
          {summary.allocated > 0 ? `${Math.round(leftPct)}%` : <Icon name="plus" size={18} />}
        </Ring>
      </Pressable>
    </div>
  );
}
