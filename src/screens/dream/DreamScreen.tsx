import { motion } from 'motion/react';
import { useStore } from '../../lib/appStore';
import { dayKey, monthName } from '../../lib/dates';
import { dreamProgress, rub } from '../../lib/money';
import { visible } from '../../lib/records';
import { AnimatedNumber } from '../../ui/AnimatedNumber';
import { Surface } from '../../ui/Surface';
import { Icon } from '../../ui/Icon';
import { springs } from '../../ui/motion';
import { Progress } from '../../ui/Progress';
import { Pressable } from '../../ui/Pressable';
import { rise } from '../../ui/rise';
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
      <Pressable className="dream-card rise" scale={0.98} onPress={openDreamForm} aria-label="Изменить мечту">
        <span className="pill dream-tag">
          <Icon name="sparkle" size={14} />
          Авто мечты
        </span>
        <motion.span className="dream-name grad-text" role="heading" aria-level={1} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={springs.soft}>
          {car.name}
        </motion.span>
        <motion.div
          className="dream-car"
          initial={{ x: 140, rotate: 1.5, opacity: 0 }}
          animate={{ x: 0, rotate: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 120, damping: 16, mass: 0.9 }}
        >
          <span className="dream-flare" aria-hidden="true">
            <i />
          </span>
          {photo ? <img src={photo} alt={car.name} className="dream-photo" /> : <PanameraSvg color={car.color} className="dream-svg" />}
        </motion.div>
        <span className="dream-floor" aria-hidden="true" />
      </Pressable>

      {car.price <= 0 ? (
        <Surface className="dream-cta surface--lit rise" style={rise(1)}>
          <p className="t-h2">Сколько стоит мечта?</p>
          <p className="t-sub">Укажите цену и срок. Посчитаю, сколько откладывать в день, неделю и месяц.</p>
          <Pressable className="btn btn--primary" onPress={openDreamForm}>
            Указать цену и срок
          </Pressable>
        </Surface>
      ) : (
        <>
          <Surface className="dream-progress surface--lit rise" style={rise(1)}>
            <div className="dream-progress-top">
              <span className="t-eyebrow">{reached ? 'Денег на карте хватает' : 'Накоплено'}</span>
              <span className="tag">{Math.floor(d.pct)}%</span>
            </div>
            <div className="dream-amount">
              <AnimatedNumber value={saved} format={rub} className="money t-display dream-saved" />
              <span className="t-sub">из {rub(car.price)}</span>
            </div>
            <Progress value={d.pct} height={6} glow />
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
          </Surface>

          {d.perDay !== null && (
            <div className="pace rise" style={rise(2)}>
              {[
                ['В день', d.perDay],
                ['В неделю', d.perWeek!],
                ['В месяц', d.perMonth!],
              ].map(([label, v]) => (
                <Surface key={label as string} className="pace-tile">
                  <span className="t-eyebrow">{label}</span>
                  <b className="money grad-text">{rub(v as number)}</b>
                </Surface>
              ))}
            </div>
          )}

          <div className="dream-facts rise" style={rise(3)}>
            <Surface className="fact">
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
            </Surface>
            <Surface className="fact">
              <Icon name="trend" size={22} />
              <span className="fact-text">
                <span className="t-cap">При текущем темпе</span>
                <b>{reached ? 'Уже можно' : (forecast ?? 'Нужен доход со смен')}</b>
              </span>
            </Surface>
          </div>
          {d.perDay !== null && <p className="t-cap dream-note">Сумма в день — чтобы успеть к сроку. Темп считается по сменам за последние 30 дней.</p>}
        </>
      )}
    </div>
  );
}
