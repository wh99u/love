import { AnimatePresence, animate, motion, useMotionValue, useTransform } from 'motion/react';
import { useEffect, useState } from 'react';
import { useStore } from '../../lib/appStore';
import { fmtDay, monthName } from '../../lib/dates';
import { dreamProgress, rub } from '../../lib/money';
import { cardTotal } from '../../lib/store';
import { Avatars } from '../../ui/Avatars';
import { Icon } from '../../ui/Icon';
import { springs } from '../../ui/motion';
import { Pressable } from '../../ui/Pressable';
import { openSheet } from '../../ui/sheets';
import { useImage } from '../../ui/useImage';
import { useMoney } from '../../ui/useMoney';
import { ensureCarPhoto } from './carImage';
import { openDreamForm } from './DreamForm';
import './dream.css';

const SEGMENTS = 8;
const STEPS = 6;
const ease = [0.16, 1, 0.3, 1] as const;

/** «92%»: counts up from zero when the screen opens. */
function Percent({ value }: { value: number }) {
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => `${Math.floor(v)}%`);
  useEffect(() => {
    const run = animate(mv, value, { duration: 1.6, ease, delay: 0.45 });
    return () => run.stop();
  }, [mv, value]);
  return <motion.span className="dream-pct">{text}</motion.span>;
}

/** The glowing segments of the reference: filled up to the share saved, a dotted line after. */
function Segments({ pct }: { pct: number }) {
  const filled = (Math.min(100, pct) / 100) * SEGMENTS;
  return (
    <div className="dream-bar" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      {Array.from({ length: SEGMENTS }, (_, i) => {
        const part = Math.max(0, Math.min(1, filled - i));
        return (
          <span key={i} className="dream-seg">
            {part > 0 ? (
              <>
                <motion.i
                  className="dream-seg-glow"
                  style={{ width: `${part * 100}%` }}
                  initial={{ opacity: 0, scaleY: 0.3 }}
                  animate={{ opacity: 1, scaleY: 1 }}
                  transition={{ duration: 0.8, ease, delay: 0.7 + i * 0.09 }}
                />
                <motion.i
                  className={`dream-seg-pill ${i % 2 ? 'dream-seg-pill--soft' : ''}`}
                  style={{ width: `${part * 100}%` }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.6, ease, delay: 0.75 + i * 0.09 }}
                />
              </>
            ) : (
              <motion.i className="dream-seg-dots" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 + i * 0.05 }} />
            )}
          </span>
        );
      })}
    </div>
  );
}

/** «Oil Life» chart of the reference: a staircase up to the goal, the climbed part drawn solid. */
function Stairs({ pct }: { pct: number }) {
  const done = Math.round((Math.min(100, pct) / 100) * STEPS);
  return (
    <div className="stairs" aria-hidden="true">
      {Array.from({ length: STEPS }, (_, i) => (
        <motion.span
          key={i}
          className={`stair ${i < done ? 'stair--done' : ''}`}
          style={{ height: `${28 + i * 12}%` }}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.7, ease, delay: 0.9 + i * 0.06 }}
        />
      ))}
    </div>
  );
}

/** «Battery» gauge of the reference: an arc filled to the share. */
function Arc({ pct }: { pct: number }) {
  return (
    <svg className="arc" viewBox="0 0 160 62" aria-hidden="true">
      <path d="M10 56 A 150 150 0 0 1 150 18" pathLength={1} className="arc-track" />
      <motion.path
        d="M10 56 A 150 150 0 0 1 150 18"
        pathLength={1}
        className="arc-fill"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: Math.max(0.02, Math.min(1, pct / 100)) }}
        transition={{ duration: 1.4, ease, delay: 0.9 }}
      />
    </svg>
  );
}

function Details() {
  const car = useStore((s) => s.shared.car);
  const saved = useStore(cardTotal);
  const shifts = useStore((s) => s.personal.shifts);
  const d = dreamProgress(car, saved, shifts, new Date());
  const rows: [string, string][] = [
    ['Цена', rub(car.price)],
    ['Накоплено', rub(saved)],
    ['Осталось', rub(d.left)],
    ...(d.perDay !== null
      ? ([
          ['В день', rub(d.perDay)],
          ['В неделю', rub(d.perWeek!)],
          ['В месяц', rub(d.perMonth!)],
        ] as [string, string][])
      : []),
    ['При текущем темпе', d.left === 0 ? 'уже можно' : d.forecastYm ? `${monthName(d.forecastYm)} ${d.forecastYm.slice(0, 4)}` : 'нужен доход со смен'],
  ];
  return (
    <div>
      <h2 className="sheet-title">{car.name}</h2>
      <div className="dream-details">
        {rows.map(([k, v], i) => (
          <motion.div key={k} className="dream-detail" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...springs.soft, delay: i * 0.04 }}>
            <span className="t-sub">{k}</span>
            <b className="money">{v}</b>
          </motion.div>
        ))}
      </div>
      <p className="t-cap dream-note">Сумма в день — чтобы успеть к сроку. Темп считается по сменам за последние 30 дней.</p>
    </div>
  );
}

export function DreamScreen({ onOpenSync }: { onOpenSync: () => void }) {
  const car = useStore((s) => s.shared.car);
  const saved = useStore(cardTotal);
  const shifts = useStore((s) => s.personal.shifts);
  const stored = useImage(car.imgId);
  const photo = stored ?? car.photoUrl ?? null;
  const m = useMoney();
  const [looking, setLooking] = useState(false);
  const [missing, setMissing] = useState(false);
  const d = dreamProgress(car, saved, shifts, new Date());

  useEffect(() => {
    let alive = true;
    setLooking(true);
    ensureCarPhoto().then((r) => {
      if (!alive) return;
      setLooking(false);
      setMissing(r === 'none');
    });
    return () => {
      alive = false;
    };
  }, [car.name]);

  const days = d.daysToDeadline;
  const daysText = days === null ? '—' : String(Math.max(0, days));

  return (
    <div className="screen dream">
      <div className="dream-hero">
        <motion.div
          key={photo ?? 'none'}
          className={`dream-car ${car.photoTop ? 'dream-car--top' : car.photoCut ? 'dream-car--cut' : ''}`}
          initial={{ y: '-70%', opacity: 0, scale: 1.08, filter: 'blur(14px)' }}
          animate={{ y: 0, opacity: 1, scale: 1, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }}
          transition={{ y: { type: 'spring', stiffness: 70, damping: 16, mass: 1.1 }, scale: { duration: 1.4, ease }, opacity: { duration: 0.6 }, filter: { duration: 0.9 } }}
        >
          {photo && car.photoTop ? (
            <img className="dream-car-img dream-car-img--top" src={photo} alt={car.name} />
          ) : photo && car.photoCut ? (
            <img className="dream-car-img dream-car-img--cut" src={photo} alt={car.name} />
          ) : photo ? (
            <>
              <img className="dream-car-back" src={photo} alt="" aria-hidden="true" />
              <img className="dream-car-img" src={photo} alt={car.name} />
            </>
          ) : (
            <div className={`dream-car-empty ${looking ? 'dream-car-empty--looking' : ''}`}>
              <Icon name="car" size={64} />
              <span>{looking ? 'Рисую машину сверху…' : missing ? 'Картинка не получилась — добавьте своё фото' : ''}</span>
            </div>
          )}
        </motion.div>
        <AnimatePresence>
          {looking && photo && !car.photoTop && (
            <motion.span className="dream-drawing glass" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={springs.soft}>
              <i />
              Рисую вид сверху…
            </motion.span>
          )}
        </AnimatePresence>
        <i className="dream-hero-top" />
        <i className="dream-hero-fade" />

        <motion.header className="dream-head" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ ...springs.soft, delay: 0.2 }}>
          <Pressable className="dream-brand" scale={0.97} onPress={openDreamForm} aria-label="Изменить машину">
            <span className="dream-logo">
              <Icon name="sparkle" size={15} />
            </span>
            <span className="dream-name">{car.name}</span>
          </Pressable>
          <div className="dream-head-side">
            <Pressable className="dream-edit" aria-label="Изменить мечту" feedback="medium" scale={0.88} onPress={openDreamForm}>
              <Icon name="edit" size={20} />
            </Pressable>
            <Pressable className="dream-face" aria-label="Вместе" scale={0.9} onPress={onOpenSync}>
              <Avatars />
            </Pressable>
          </div>
        </motion.header>
        <Pressable className="dream-info glass" aria-label="Подробнее" scale={0.88} onPress={() => openSheet(() => <Details />)}>
          <Icon name="list" size={18} />
        </Pressable>
      </div>

      {car.price > 0 ? (
        <>
          <section className="dream-stat">
            <motion.span className="dream-label" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.6, ease }}>
              Накоплено
            </motion.span>
            <Percent value={d.pct} />
            <Segments pct={d.pct} />
          </section>

          <div className="dream-cards">
            <motion.div className="dream-card dream-card--light" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ ...springs.soft, delay: 0.55 }}>
              <span className="dream-card-head">
                <span className="dream-card-icon">
                  <Icon name="clock" size={18} />
                </span>
                Срок
              </span>
              <span className="dream-card-value">
                <b>{daysText}</b>
                <span>{days === null ? 'не задан' : 'дней'}</span>
              </span>
              <Stairs pct={d.pct} />
              {car.date && <span className="dream-card-foot">до {fmtDay(car.date, true)}</span>}
            </motion.div>
            <motion.div className="dream-card dream-card--dark" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ ...springs.soft, delay: 0.65 }}>
              <span className="dream-card-head">
                <span className="dream-card-icon">
                  <Icon name="coins" size={18} />
                </span>
                {d.perDay !== null ? 'В день' : 'Осталось'}
              </span>
              <span className="dream-card-value">
                <b className="money">{m.fmt(d.perDay ?? d.left)}</b>
              </span>
              <span className="dream-card-sub">{d.left === 0 ? 'денег хватает' : d.perDay !== null ? 'чтобы успеть' : `из ${m.fmt(car.price)}`}</span>
              <Arc pct={d.pct} />
            </motion.div>
          </div>
        </>
      ) : (
        <motion.div className="dream-card dream-card--light dream-cta" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ ...springs.soft, delay: 0.4 }}>
          <b>Сколько стоит мечта?</b>
          <span>Укажите цену и срок — посчитаю, сколько откладывать.</span>
          <Pressable className="btn dream-cta-btn" onPress={openDreamForm}>
            Указать цену и срок
          </Pressable>
        </motion.div>
      )}
    </div>
  );
}
