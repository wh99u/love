import { useMemo, useState } from 'react';
import { useStore } from '../../lib/appStore';
import { fmtDay, monthIn, ymKey } from '../../lib/dates';
import { monthAccruals, rub } from '../../lib/money';
import { visible } from '../../lib/records';
import { BANK_NAMES } from '../../lib/types';
import { Seg } from '../../ui/forms';
import { Icon } from '../../ui/Icon';
import { openSheet } from '../../ui/sheets';
import { BANK_THEME } from './BankCard';

interface Row {
  id: string;
  date: string;
  title: string;
  amount: number;
  icon: string;
  color: string;
  bg: string;
}

function group(rows: Row[]) {
  const map = new Map<string, Row[]>();
  for (const r of [...rows].sort((a, b) => b.date.localeCompare(a.date))) map.set(r.date, [...(map.get(r.date) ?? []), r]);
  return [...map.entries()];
}

function AccrualsSheet() {
  const shifts = useStore((s) => visible(s.personal.shifts));
  const incomes = useStore((s) => visible(s.shared.incomes));
  const banks = useStore((s) => s.shared.banks);
  const [tab, setTab] = useState<'shifts' | 'incomes'>('shifts');
  const ym = ymKey(new Date());

  const rows = useMemo<Row[]>(
    () =>
      tab === 'shifts'
        ? shifts.map((s) => ({
            id: s.id,
            date: s.date,
            title: `${s.type === 'd' ? 'Дневная' : 'Ночная'} смена${s.h ? `, ${s.h} ч` : ''}`,
            amount: s.pay,
            icon: s.type === 'd' ? 'sun' : 'moon',
            color: s.type === 'd' ? 'var(--yellow)' : 'var(--blue)',
            bg: s.type === 'd' ? 'rgba(255,240,200,.12)' : 'rgba(190,205,255,.12)',
          }))
        : incomes.map((x) => {
            const b = banks.find((bb) => bb.id === x.bankId);
            return {
              id: x.id,
              date: x.date,
              title: `${b ? BANK_NAMES[b.code] : 'Карта'}${x.source === 'shortcut' ? ', из уведомления' : ''}`,
              amount: x.amount,
              icon: 'plus',
              color: b ? BANK_THEME[b.code].ink : '#fff',
              bg: b ? BANK_THEME[b.code].bg : 'rgba(255,255,255,.12)',
            };
          }),
    [tab, shifts, incomes, banks],
  );

  const monthTotal = tab === 'shifts' ? monthAccruals(shifts, ym) : incomes.filter((x) => x.date.startsWith(ym)).reduce((t, x) => t + x.amount, 0);

  return (
    <div>
      <h2 className="sheet-title">Начисления</h2>
      <Seg
        value={tab}
        onChange={setTab}
        options={[
          { id: 'shifts', label: 'Смены' },
          { id: 'incomes', label: 'Пополнения' },
        ]}
      />
      <p className="t-sub list-total">
        {tab === 'shifts' ? 'Начислено' : 'Пополнено'} в {monthIn(ym)}: <b className="money">{rub(monthTotal)}</b>
      </p>
      {rows.length === 0 ? (
        <p className="empty">{tab === 'shifts' ? 'Смен пока нет. Добавьте их в календаре.' : 'Пополнений пока нет. Нажмите «Пополнить» на главном экране.'}</p>
      ) : (
        group(rows).map(([date, list]) => (
          <section key={date} className="list-group">
            <h3 className="t-cap list-date">{fmtDay(date, true)}</h3>
            {list.map((r) => (
              <div key={r.id} className="list-row">
                <span className="list-icon" style={{ background: r.bg, color: r.color }}>
                  <Icon name={r.icon} size={20} />
                </span>
                <span className="list-title">{r.title}</span>
                <b className="money pos">+{rub(r.amount)}</b>
              </div>
            ))}
          </section>
        ))
      )}
    </div>
  );
}

export const openAccruals = () => openSheet(() => <AccrualsSheet />);
