import { useState } from 'react';
import { actions, useStore } from '../../lib/appStore';
import { dayKey, fmtDay, monthName } from '../../lib/dates';
import { monthAccruals, rub } from '../../lib/money';
import { visible } from '../../lib/records';
import { haptic } from '../../lib/telegram';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../../lib/template';
import type { Category } from '../../lib/types';
import { cx } from '../../ui/cx';
import { Field } from '../../ui/forms';
import { Icon } from '../../ui/Icon';
import { Keypad } from '../../ui/Keypad';
import { Pressable } from '../../ui/Pressable';
import { openSheet } from '../../ui/sheets';
import { toast } from '../../ui/Toast';

/* ---------- income ---------- */

function IncomeForm({ ym, close, then }: { ym: string; close: () => void; then?: () => void }) {
  const current = useStore((s) => visible(s.shared.budgets).find((b) => b.ym === ym)?.income ?? 0);
  const byShifts = useStore((s) => monthAccruals(s.personal.shifts, ym));
  const onCards = useStore((s) => visible(s.shared.banks).reduce((t, b) => t + b.sum, 0));
  const [value, setValue] = useState(current ? String(Math.round(current)) : '');
  const save = () => {
    actions.updateBudget(ym, { income: Number(value || 0) });
    haptic('success');
    close();
    then?.();
  };
  return (
    <div>
      <h2 className="sheet-title">Доход на {monthName(ym)}</h2>
      <div className="amount-big money">{rub(Number(value || 0))}</div>
      <div className="chips">
        {byShifts > 0 && (
          <button className="chip" onClick={() => setValue(String(Math.round(byShifts)))}>
            По сменам: {rub(byShifts)}
          </button>
        )}
        {onCards > 0 && (
          <button className="chip" onClick={() => setValue(String(Math.round(onCards)))}>
            На картах: {rub(onCards)}
          </button>
        )}
      </div>
      <Keypad value={value} onChange={setValue} />
      <Pressable className="btn btn--primary" feedback={false} onPress={save}>
        {then ? 'Дальше' : 'Сохранить'}
      </Pressable>
    </div>
  );
}

export const openIncomeForm = (ym: string, then?: () => void) => openSheet((close) => <IncomeForm ym={ym} close={close} then={then} />);

/* ---------- category ---------- */

function IconPicker({ value, color, onChange }: { value: string; color: string; onChange: (v: string) => void }) {
  return (
    <div className="pick-row">
      {CATEGORY_ICONS.map((i) => (
        <button
          key={i}
          type="button"
          aria-label={i}
          className={cx('pick-icon', i === value && 'pick-icon--on')}
          style={i === value ? { background: color, color: '#000' } : undefined}
          onClick={() => onChange(i)}
        >
          <Icon name={i} size={20} />
        </button>
      ))}
    </div>
  );
}

function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="pick-row">
      {CATEGORY_COLORS.map((c) => (
        <button key={c} type="button" aria-label={c} className={cx('pick-color', c === value && 'pick-color--on')} style={{ background: c }} onClick={() => onChange(c)} />
      ))}
    </div>
  );
}

function CategoryForm({ ym, cat, close }: { ym: string; cat?: Category; close: () => void }) {
  const [name, setName] = useState(cat?.name ?? '');
  const [icon, setIcon] = useState(cat?.icon ?? 'gift');
  const [color, setColor] = useState(cat?.color ?? CATEGORY_COLORS[7]);
  const [limit, setLimit] = useState(cat ? String(Math.round(cat.limit)) : '');
  const save = () => {
    if (!name.trim()) {
      toast('Назовите категорию');
      return;
    }
    const patch = { name: name.trim(), icon, color, limit: Number(limit || 0) };
    if (cat) actions.updateCategory(ym, cat.id, patch);
    else actions.addCategory(ym, patch);
    haptic('success');
    close();
  };
  return (
    <div>
      <h2 className="sheet-title">{cat ? 'Категория' : 'Новая категория'}</h2>
      <Field label="Название">
        <input className="input" value={name} placeholder="Например, кофе" onChange={(e) => setName(e.target.value)} />
      </Field>
      <IconPicker value={icon} color={color} onChange={setIcon} />
      <ColorPicker value={color} onChange={setColor} />
      <p className="t-cap amount-label">Лимит на месяц</p>
      <div className="amount-big money">{rub(Number(limit || 0))}</div>
      <Keypad value={limit} onChange={setLimit} />
      <Pressable className="btn btn--primary" feedback={false} onPress={save}>
        Сохранить
      </Pressable>
    </div>
  );
}

export const openCategoryForm = (ym: string, cat?: Category) => openSheet((close) => <CategoryForm ym={ym} cat={cat} close={close} />);

/* ---------- spend ---------- */

function SpendForm({ ym, catId, close }: { ym: string; catId?: string; close: () => void }) {
  const cats = useStore((s) => visible(s.shared.budgets).find((b) => b.ym === ym)?.cats ?? []);
  const [cat, setCat] = useState(catId ?? cats[0]?.id);
  const [value, setValue] = useState('');
  const [note, setNote] = useState('');
  const today = dayKey(new Date());
  const [date, setDate] = useState(today.startsWith(ym) ? today : `${ym}-01`);
  const n = Number(value || 0);
  const save = () => {
    if (!cat || n <= 0) return;
    actions.addSpend({ ym, catId: cat, amount: n, date, ...(note.trim() ? { note: note.trim() } : {}) });
    haptic('success');
    toast(`Трата ${rub(n)} записана`, 'success');
    close();
  };
  return (
    <div>
      <h2 className="sheet-title">Новая трата</h2>
      <div className="amount-big money">{rub(n)}</div>
      <div className="chips">
        {cats.map((c) => (
          <button key={c.id} className={cx('chip', c.id === cat && 'chip--on')} onClick={() => setCat(c.id)}>
            <span className="chip-dot" style={{ background: c.color }} />
            {c.name}
          </button>
        ))}
      </div>
      <Keypad value={value} onChange={setValue} />
      <div className="form-row">
        <Field label="Заметка">
          <input className="input" value={note} placeholder="Необязательно" onChange={(e) => setNote(e.target.value)} />
        </Field>
        <Field label={fmtDay(date)}>
          <input className="input" type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
        </Field>
      </div>
      <Pressable className="btn btn--primary" feedback={false} disabled={!cat || n <= 0} onPress={save}>
        Записать трату
      </Pressable>
    </div>
  );
}

export function openSpendForm(ym: string, catId?: string, hasCats = true) {
  if (!hasCats) {
    toast('Сначала добавьте категории в план');
    return;
  }
  openSheet((close) => <SpendForm ym={ym} catId={catId} close={close} />);
}
