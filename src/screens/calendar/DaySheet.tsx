import { AnimatePresence, motion } from 'motion/react';
import { actions, useStore } from '../../lib/appStore';
import { fmtWeekday } from '../../lib/dates';
import { rub } from '../../lib/money';
import { visible } from '../../lib/records';
import { Icon } from '../../ui/Icon';
import { Pressable } from '../../ui/Pressable';
import { openSheet } from '../../ui/sheets';
import { openShiftForm, openTaskForm } from './forms';
import { TaskCard } from './TaskCard';

function DaySheet({ day }: { day: string }) {
  const shifts = useStore((s) => visible(s.personal.shifts).filter((x) => x.date === day));
  const tasks = useStore((s) => visible(s.personal.tasks).filter((t) => t.due === day));

  return (
    <div>
      <h2 className="sheet-title day-title">{fmtWeekday(day)}</h2>
      <AnimatePresence initial={false}>
        {shifts.map((s) => (
          <motion.div key={s.id} layout exit={{ opacity: 0, x: -60 }} className={`shift-row shift-row--${s.type}`}>
            <span className="shift-ico">
              <Icon name={s.type === 'd' ? 'sun' : 'moon'} size={26} />
            </span>
            <span className="shift-text">
              <b>{s.type === 'd' ? 'Дневная смена' : 'Ночная смена'}</b>
              <span className="t-cap">{s.h ? `${s.h} ч` : 'Часы не указаны'}</span>
            </span>
            <b className="money shift-pay">{rub(s.pay)}</b>
            <Pressable className="icon-btn" aria-label="Удалить смену" feedback="medium" onPress={() => actions.deleteShift(s.id)}>
              <Icon name="trash" size={18} />
            </Pressable>
          </motion.div>
        ))}
      </AnimatePresence>

      <div className="day-tasks">
        <AnimatePresence initial={false}>
          {tasks.map((t) => (
            <TaskCard key={t.id} task={t} />
          ))}
        </AnimatePresence>
      </div>
      {!shifts.length && !tasks.length && <p className="empty">На этот день ничего нет.</p>}

      <div className="day-actions">
        <Pressable className="btn btn--primary" onPress={() => openTaskForm(day)}>
          <Icon name="plus" size={20} stroke={2.4} />
          Задача
        </Pressable>
        <Pressable className="btn btn--ghost" onPress={() => openShiftForm(day)}>
          <Icon name="sun" size={20} />
          Смена
        </Pressable>
      </div>
    </div>
  );
}

export const openDay = (day: string, onClose?: () => void) => openSheet(() => <DaySheet day={day} />, { onClose });
