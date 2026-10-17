import { useState } from 'react';
import { actions, useStore } from '../../lib/appStore';
import { rub } from '../../lib/money';
import { haptic } from '../../lib/telegram';
import { cx } from '../../ui/cx';
import { Field, Seg } from '../../ui/forms';
import { Icon } from '../../ui/Icon';
import { Keypad } from '../../ui/Keypad';
import { Pressable } from '../../ui/Pressable';
import { openSheet } from '../../ui/sheets';
import { toast } from '../../ui/Toast';

const HOURS = [8, 10, 11, 12, 24];

function ShiftForm({ date: initial, close }: { date: string; close: () => void }) {
  const [date, setDate] = useState(initial);
  const [type, setType] = useState<'d' | 'n'>('d');
  const [pay, setPay] = useState('');
  const [h, setH] = useState(12);
  const save = () => {
    actions.addShift({ date, type, pay: Number(pay || 0), h });
    haptic('success');
    toast(type === 'd' ? 'Дневная смена добавлена' : 'Ночная смена добавлена', 'success');
    close();
  };
  return (
    <div>
      <h2 className="sheet-title">Новая смена</h2>
      <Seg
        value={type}
        onChange={setType}
        options={[
          {
            id: 'd',
            label: (
              <span className="seg-ico">
                <Icon name="sun" size={18} /> Дневная
              </span>
            ),
          },
          {
            id: 'n',
            label: (
              <span className="seg-ico">
                <Icon name="moon" size={16} /> Ночная
              </span>
            ),
          },
        ]}
      />
      <Field label="Дата">
        <input className="input" type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
      </Field>
      <p className="t-cap amount-label">Часы</p>
      <div className="chips">
        {HOURS.map((x) => (
          <button key={x} type="button" className={cx('chip', x === h && 'chip--on')} onClick={() => setH(x)}>
            {x} ч
          </button>
        ))}
      </div>
      <p className="t-cap amount-label">Оплата</p>
      <div className="amount-big money">{rub(Number(pay || 0))}</div>
      <Keypad value={pay} onChange={setPay} />
      <Pressable className="btn btn--primary" feedback={false} onPress={save}>
        Добавить смену
      </Pressable>
    </div>
  );
}

function TaskForm({ date, close }: { date: string; close: () => void }) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [due, setDue] = useState(date);
  const save = () => {
    if (!title.trim()) {
      toast('Напишите, что нужно сделать');
      return;
    }
    actions.addTask({ title: title.trim(), desc: desc.trim(), due });
    haptic('success');
    toast('Задача добавлена', 'success');
    close();
  };
  return (
    <div>
      <h2 className="sheet-title">Новая задача</h2>
      <Field label="Что сделать">
        <input className="input" value={title} autoFocus placeholder="Например, оплатить интернет" onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <Field label="Описание">
        <textarea className="input" value={desc} rows={3} placeholder="Подробности: адрес, сумма, код" onChange={(e) => setDesc(e.target.value)} />
      </Field>
      <Field label="Срок">
        <input className="input" type="date" value={due} onChange={(e) => e.target.value && setDue(e.target.value)} />
      </Field>
      <Pressable className="btn btn--primary" feedback={false} onPress={save}>
        Добавить задачу
      </Pressable>
    </div>
  );
}

function PlanForm({ close }: { close: () => void }) {
  const plan = useStore((s) => s.personal.plan);
  const [value, setValue] = useState(String(plan || ''));
  return (
    <div>
      <h2 className="sheet-title">Смен в месяц</h2>
      <div className="amount-big money">{Number(value || 0)}</div>
      <Keypad value={value} onChange={(v) => setValue(v.slice(0, 2))} />
      <Pressable
        className="btn btn--primary"
        feedback={false}
        onPress={() => {
          actions.setPlan(Number(value || 0));
          haptic('success');
          close();
        }}
      >
        Сохранить
      </Pressable>
    </div>
  );
}

export const openShiftForm = (date: string) => openSheet((close) => <ShiftForm date={date} close={close} />);
export const openTaskForm = (date: string) => openSheet((close) => <TaskForm date={date} close={close} />);
export const openPlanForm = () => openSheet((close) => <PlanForm close={close} />);
