import { motion } from 'motion/react';
import { useStore } from '../../lib/appStore';
import { dayKey, monthName } from '../../lib/dates';
import { dreamProgress, rub } from '../../lib/money';
import { visible } from '../../lib/records';
import { AnimatedNumber } from '../../ui/AnimatedNumber';
import { Glass } from '../../ui/Glass';
import { Icon } from '../../ui/Icon';
import { springs } from '../../ui/motion';
import { ProgressLiquid } from '../../ui/ProgressLiquid';
import { Pressable } from '../../ui/Pressable';
import { useImage } from '../../ui/useImage';
import { openDreamForm } from './DreamForm';
import { PanameraSvg } from './PanameraSvg';
import './dream.css';

const MILESTONES = [25, 50, 75, 100];

export function DreamScreen() {
  const car = useStore((s) => s.shared.car);
  const saved = useStore((s) => visible(s.shared.banks).reduce((t, b) => t + b.sum, 0));
  const shifts = useStore((s) => s.personal.shifts);
  const photo = useImage(car.imgId);
  const d = dreamProgress(car, saved, shifts, new Date());
  const reached = car.price > 0 && d.left === 0;
  const forecast = d.forecastYm ? `${monthName(d.forecastYm)} ${d.forecastYm.slice(0, 4)}` : null;

  return (
    <div className="screen dream">
      <Pressable className="dream-card" scale={0.98} onPress={openDreamForm} aria-label="Изменить мечту">
        <span className="dream-card-glow" />
        <motion.span className="dream-name" role="heading" aria-level={1} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={springs.soft}>
          {car.name}
        </motion.span>
        <span className="dream-tag glass glass--flat">
          <Icon name="sparkle" size={18} />
          Авто мечты
        </span>
        <motion.div
          className="dream-car"
          initial={{ x: 140, rotate: 1.5, opacity: 0 }}
          animate={{ x: 0, rotate: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 120, damping: 16, mass: 0.9 }}
        >
          {photo ? <img src={photo} alt={car.name} className="dream-photo" /> : <PanameraSvg color={car.color} className="dream-svg" />}
          <span className="dream-sweep" aria-hidden="true" />
        </motion.div>
      </Pressable>

      {car.price <= 0 ? (
        <Glass className="dream-cta">
          <p className="t-h2">Сколько стоит мечта?</p>
          <p className="t-sub">Укажите цену и срок. Посчитаю, сколько откладывать в день, неделю и месяц.</p>
          <Pressable className="btn btn--primary" onPress={openDreamForm}>
            Указать цену и срок
          </Pressable>
        </Glass>
      ) : (
        <>
          <Glass className="dream-progress">
            <div className="dream-progress-top">
              <span className="t-cap">{reached ? 'Денег на картах хватает' : 'Накоплено'}</span>
              <span className="dream-pct money">{Math.floor(d.pct)}%</span>
            </div>
            <div className="dream-amount">
              <AnimatedNumber value={saved} format={rub} className="money dream-saved" />
              <span className="t-sub">из {rub(car.price)}</span>
            </div>
            <ProgressLiquid value={d.pct} height={14} />
            <div className="milestones" aria-label="Вехи">
              {MILESTONES.map((m, i) => (
                <motion.span
                  key={m}
                  className={`milestone ${d.milestones[i] ? 'milestone--on' : ''}`}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ ...springs.bouncy, delay: 0.25 + i * 0.07 }}
                >
                  {d.milestones[i] ? <Icon name="check" size={14} stroke={3} /> : `${m}%`}
                </motion.span>
              ))}
            </div>
          </Glass>

          {d.perDay !== null && (
            <div className="pace">
              {[
                ['В день', d.perDay],
                ['В неделю', d.perWeek!],
                ['В месяц', d.perMonth!],
              ].map(([label, v]) => (
                <Glass key={label as string} className="pace-tile" flat>
                  <span className="t-cap">{label}</span>
                  <b className="money">{rub(v as number)}</b>
                </Glass>
              ))}
            </div>
          )}

          <div className="dream-facts">
            <Glass className="fact" flat>
              <Icon name="clock" size={22} />
              <span className="fact-text">
                <span className="t-cap">До срока</span>
                <b>
                  {d.daysToDeadline === null
                    ? 'Срок не задан'
                    : d.daysToDeadline > 0
                      ? `${d.daysToDeadline} дн.`
                      : car.date < dayKey(new Date())
                        ? 'Срок прошёл'
                        : 'Сегодня'}
                </b>
              </span>
            </Glass>
            <Glass className="fact" flat>
              <Icon name="trend" size={22} />
              <span className="fact-text">
                <span className="t-cap">При текущем темпе</span>
                <b>{reached ? 'Уже можно' : (forecast ?? 'Нужен доход со смен')}</b>
              </span>
            </Glass>
          </div>
          {d.perDay !== null && <p className="t-cap dream-note">Сумма в день — чтобы успеть к сроку. Темп считается по сменам за последние 30 дней.</p>}
        </>
      )}
    </div>
  );
}
