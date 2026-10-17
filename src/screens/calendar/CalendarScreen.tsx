import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { useStore } from '../../lib/appStore';
import { addMonths, dayKey, fmtMonth, monthGrid, ymKey } from '../../lib/dates';
import { kf, monthAccruals } from '../../lib/money';
import { visible } from '../../lib/records';
import { haptic } from '../../lib/telegram';
import { cx } from '../../ui/cx';
import { Glass } from '../../ui/Glass';
import { Icon } from '../../ui/Icon';
import { springs } from '../../ui/motion';
import { Pressable } from '../../ui/Pressable';
import { Ring } from '../../ui/Ring';
import { openDay } from './DaySheet';
import { openPlanForm } from './forms';
import './calendar.css';

const WEEK = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function CalendarScreen({ selected, onSelect }: { selected: string; onSelect: (d: string) => void }) {
  const [ym, setYm] = useState(() => ymKey(new Date()));
  const [dir, setDir] = useState(1);
  const shifts = useStore((s) => visible(s.personal.shifts));
  const tasks = useStore((s) => visible(s.personal.tasks));
  const plan = useStore((s) => s.personal.plan);
  const today = dayKey(new Date());

  const monthShifts = shifts.filter((s) => s.date.startsWith(ym));
  const monthTasks = tasks.filter((t) => t.due.startsWith(ym));
  const done = monthTasks.filter((t) => t.done).length;

  const shift = (n: number) => {
    haptic('selection');
    setDir(n);
    setYm((v) => addMonths(v, n));
  };

  return (
    <div className="screen cal">
      <div className="rings">
        <Glass className="ring-card" flat>
          <Ring value={monthTasks.length ? (done / monthTasks.length) * 100 : 0} color="var(--yellow)">
            {done}/{monthTasks.length}
          </Ring>
          <span className="ring-text">
            <b>Выполнено</b>
            <span className="t-cap">задач</span>
          </span>
        </Glass>
        <Pressable className="ring-card glass glass--flat" scale={0.97} onPress={openPlanForm}>
          <Ring value={plan ? Math.min(100, (monthShifts.length / plan) * 100) : 0} color="var(--green)">
            {monthShifts.length}/{plan}
          </Ring>
          <span className="ring-text">
            <b>Смены</b>
            <span className="t-cap">доход {kf(monthAccruals(shifts, ym))} ₽</span>
          </span>
        </Pressable>
      </div>

      <div className="cal-head">
        <Pressable className="icon-btn glass" aria-label="Предыдущий месяц" onPress={() => shift(-1)}>
          <Icon name="back" size={20} stroke={2.2} />
        </Pressable>
        <AnimatePresence mode="popLayout" initial={false} custom={dir}>
          <motion.h2
            key={ym}
            className="t-h2"
            initial={{ opacity: 0, y: dir * 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: dir * -10 }}
            transition={springs.snappy}
          >
            {capital(fmtMonth(ym))}
          </motion.h2>
        </AnimatePresence>
        <Pressable className="icon-btn glass" aria-label="Следующий месяц" onPress={() => shift(1)}>
          <Icon name="chevron" size={20} stroke={2.2} />
        </Pressable>
      </div>

      <div className="week">
        {WEEK.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <AnimatePresence mode="popLayout" initial={false} custom={dir}>
        <motion.div
          key={ym}
          className="grid"
          initial={{ opacity: 0, x: dir * 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: dir * -40 }}
          transition={springs.snappy}
        >
          {monthGrid(ym).map((key, i) => {
            if (!key) return <i key={`b${i}`} />;
            const day = shifts.filter((s) => s.date === key);
            const hasD = day.some((s) => s.type === 'd');
            const hasN = day.some((s) => s.type === 'n');
            const dayTasks = tasks.filter((t) => t.due === key);
            const pending = dayTasks.some((t) => !t.done);
            const pay = day.reduce((t, s) => t + s.pay, 0);
            return (
              <motion.button
                key={key}
                type="button"
                className={cx('day', hasD && 'day--sun', hasN && 'day--moon', hasD && hasN && 'day--both', key === today && 'day--today', key === selected && 'day--sel')}
                whileTap={{ scale: 0.9 }}
                transition={springs.snappy}
                onClick={() => {
                  haptic('selection');
                  onSelect(key);
                  openDay(key);
                }}
                aria-label={key}
              >
                <span className="day-top">
                  {hasD && <Icon name="sun" size={13} className="day-sun" />}
                  {hasN && <Icon name="moon" size={11} className="day-moon" />}
                  {day.length > 0 && <em>{kf(pay)}</em>}
                </span>
                <span className="day-n">{Number(key.slice(8))}</span>
                <span className="day-dots">{dayTasks.length > 0 && <i className={pending ? 'dot' : 'dot dot--done'} />}</span>
              </motion.button>
            );
          })}
        </motion.div>
      </AnimatePresence>

      <div className="legend t-cap">
        <span>
          <Icon name="sun" size={14} className="day-sun" /> дневная
        </span>
        <span>
          <Icon name="moon" size={12} className="day-moon" /> ночная
        </span>
        <span>
          <i className="dot" /> есть задачи
        </span>
      </div>
    </div>
  );
}
