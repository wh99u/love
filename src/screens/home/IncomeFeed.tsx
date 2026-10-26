import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { fmtDay } from '../../lib/dates';
import { visible } from '../../lib/records';
import { BANK_NAMES, type Bank, type Income } from '../../lib/types';
import { inWeek, weekLabel, weekRange } from '../../lib/weeks';
import { Icon } from '../../ui/Icon';
import { springs } from '../../ui/motion';
import { Pressable } from '../../ui/Pressable';
import { useMoney } from '../../ui/useMoney';

const MAX_ROWS = 6;
const TICK = 42;

const pages = {
  enter: (dir: number) => ({ x: dir * 40, opacity: 0, filter: 'blur(6px)' }),
  center: { x: 0, opacity: 1, filter: 'blur(0px)', transitionEnd: { filter: 'none' } },
  exit: (dir: number) => ({ x: dir * -40, opacity: 0, filter: 'blur(6px)' }),
};

/** A strip of ruler ticks that rolls by one notch per week. */
function Ruler({ offset }: { offset: number }) {
  return <motion.i className="ruler" initial={false} animate={{ backgroundPositionX: `${offset * TICK}px` }} transition={springs.soft} aria-hidden="true" />;
}

/** «‹ Эта неделя ›» from the reference: a frosted pill with a ruler on each side of the label. */
function WeekPill({ offset, dir, onStep }: { offset: number; dir: number; onStep: (d: -1 | 1) => void }) {
  const label = weekLabel(offset, weekRange(new Date(), offset));
  return (
    <div className="weekpill glass">
      <Pressable className="weekpill-arrow" aria-label="Предыдущая неделя" feedback="selection" scale={0.8} onPress={() => onStep(-1)}>
        <Icon name="back" size={18} />
      </Pressable>
      <Ruler offset={offset} />
      <span className="weekpill-label">
        <AnimatePresence mode="popLayout" initial={false} custom={dir}>
          <motion.span key={offset} custom={dir} variants={pages} initial="enter" animate="center" exit="exit" transition={springs.soft}>
            {label}
          </motion.span>
        </AnimatePresence>
      </span>
      <Ruler offset={offset} />
      <Pressable className="weekpill-arrow" aria-label="Следующая неделя" feedback="selection" scale={0.8} disabled={offset >= 0} onPress={() => onStep(1)}>
        <Icon name="chevron" size={18} />
      </Pressable>
    </div>
  );
}

interface IncomeFeedProps {
  incomes: Income[];
  banks: Bank[];
  onAdd: () => void;
  onAll: () => void;
}

/** «Authenticated platform» from the reference, as the week's top-ups. */
export function IncomeFeed({ incomes, banks, onAdd, onAll }: IncomeFeedProps) {
  const m = useMoney();
  const [offset, setOffset] = useState(0);
  const [dir, setDir] = useState(1);
  const w = weekRange(new Date(), offset);
  const list = visible(incomes)
    .filter((x) => inWeek(x.date, w))
    .sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt - a.updatedAt);
  const sum = list.reduce((t, x) => t + x.amount, 0);

  const step = (d: -1 | 1) => {
    setDir(d);
    setOffset((o) => Math.min(0, o + d));
  };

  return (
    <div className="feed surface">
      <div className="feed-head">
        <span className="feed-head-text">
          <h2 className="feed-title">Пополнения</h2>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span key={`${offset}${sum}${m.cur}`} className="t-cap" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={springs.soft}>
              {list.length ? `+${m.fmt(sum)} · ${list.length} шт.` : 'Пока тихо'}
            </motion.span>
          </AnimatePresence>
        </span>
        <Pressable className="feed-add" aria-label="Пополнить" scale={0.86} onPress={onAdd}>
          <Icon name="plus" size={22} />
        </Pressable>
      </div>

      <div className="feed-pages">
        <AnimatePresence mode="popLayout" initial={false} custom={dir}>
          <motion.ul key={w.from} className="feed-list" custom={dir} variants={pages} initial="enter" animate="center" exit="exit" transition={springs.soft}>
            {list.length === 0 && (
              <li className="feed-empty">
                <span className="t-sub">Пополнений за неделю нет.</span>
                <span className="t-cap">Нажмите «+», чтобы зачислить сумму на карту.</span>
              </li>
            )}
            {list.slice(0, MAX_ROWS).map((x, i) => {
              const b = banks.find((bb) => bb.id === x.bankId);
              const name = b ? BANK_NAMES[b.code] : 'Карта удалена';
              return (
                <motion.li
                  key={x.id}
                  className="feed-row"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...springs.soft, delay: 0.08 + i * 0.05 }}
                >
                  <span className="feed-badge">{x.source === 'shortcut' ? <Icon name="bolt" size={18} fill /> : name.slice(0, 1)}</span>
                  <span className="feed-name">{name}</span>
                  <span className="feed-meta">{x.note || fmtDay(x.date).replace('.', '')}</span>
                  <b className="feed-sum money">+{m.fmt(x.amount)}</b>
                </motion.li>
              );
            })}
            {list.length > MAX_ROWS && (
              <li className="feed-more">
                <Pressable className="pill" onPress={onAll}>
                  Ещё {list.length - MAX_ROWS}
                  <Icon name="chevron" size={14} />
                </Pressable>
              </li>
            )}
          </motion.ul>
        </AnimatePresence>
      </div>

      <WeekPill offset={offset} dir={dir} onStep={step} />
    </div>
  );
}
