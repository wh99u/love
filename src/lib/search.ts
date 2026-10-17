import { fmtDay } from './dates';
import { rub } from './money';
import { visible } from './records';
import { BANK_NAMES, type StateV4 } from './types';

export interface SearchHit {
  group: 'buys' | 'tasks' | 'incomes' | 'categories' | 'spends';
  id: string;
  title: string;
  subtitle: string;
  ym?: string;
  date?: string;
}

const LIMIT = 30;
const norm = (s: string) => s.toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').trim();
const digits = (s: string) => s.replace(/\D/g, '');

/** One search box over purchases, tasks, top-ups, budget categories and spends. */
export function searchAll(s: StateV4, query: string): SearchHit[] {
  const q = norm(query);
  if (!q) return [];
  const qd = digits(q);
  const has = (...texts: (string | undefined)[]) => texts.some((t) => t && norm(t).includes(q));
  const numeric = /^[\d\s.,+₽р]+$/.test(q) && qd.length > 0;
  const hasNum = (n: number) => numeric && String(Math.round(n)).includes(qd);
  const hits: SearchHit[] = [];
  const bankName = (id: string) => {
    const b = s.shared.banks.find((x) => x.id === id);
    return b ? BANK_NAMES[b.code] : 'Карта';
  };

  for (const b of visible(s.shared.buys)) if (has(b.title) || hasNum(b.price)) hits.push({ group: 'buys', id: b.id, title: b.title, subtitle: rub(b.price) });
  for (const t of visible(s.personal.tasks))
    if (has(t.title, t.desc)) hits.push({ group: 'tasks', id: t.id, title: t.title, subtitle: t.desc || fmtDay(t.due), date: t.due });
  for (const i of visible(s.shared.incomes))
    if (has(i.note) || hasNum(i.amount)) hits.push({ group: 'incomes', id: i.id, title: `+${rub(i.amount)}`, subtitle: `${bankName(i.bankId)}, ${fmtDay(i.date)}`, date: i.date });
  for (const m of visible(s.shared.budgets))
    for (const c of m.cats) if (has(c.name)) hits.push({ group: 'categories', id: c.id, title: c.name, subtitle: `Лимит ${rub(c.limit)}`, ym: m.ym });
  for (const sp of visible(s.shared.spends)) {
    const cat = s.shared.budgets.find((m) => m.ym === sp.ym)?.cats.find((c) => c.id === sp.catId);
    if (has(sp.note) || hasNum(sp.amount))
      hits.push({ group: 'spends', id: sp.id, title: sp.note || cat?.name || 'Трата', subtitle: `${rub(sp.amount)}, ${fmtDay(sp.date)}`, ym: sp.ym, date: sp.date });
  }
  return hits.slice(0, LIMIT);
}
