import { addDays, dayKey, parseDay, startOfDay } from './dates';

export interface WeekRange {
  /** Monday, `YYYY-MM-DD` */
  from: string;
  /** Sunday, inclusive */
  to: string;
}

/** Monday-to-Sunday week `offset` weeks away from the one holding `today`. */
export function weekRange(today: Date, offset = 0): WeekRange {
  const d = startOfDay(today);
  const monday = addDays(d, -((d.getDay() + 6) % 7) + offset * 7);
  return { from: dayKey(monday), to: dayKey(addDays(monday, 6)) };
}

export const inWeek = (key: string, w: WeekRange) => key >= w.from && key <= w.to;

const short = (key: string) => parseDay(key).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }).replace('.', '');

/** «Эта неделя», «Прошлая неделя», «12–18 окт», «27 окт – 2 нояб». */
export function weekLabel(offset: number, w: WeekRange) {
  if (offset === 0) return 'Эта неделя';
  if (offset === -1) return 'Прошлая неделя';
  if (offset === 1) return 'Следующая неделя';
  const a = parseDay(w.from);
  const b = parseDay(w.to);
  return a.getMonth() === b.getMonth() ? `${a.getDate()}–${short(w.to)}` : `${short(w.from)} – ${short(w.to)}`;
}
