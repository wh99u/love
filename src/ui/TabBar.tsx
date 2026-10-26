import { motion } from 'motion/react';
import type { CSSProperties } from 'react';
import { haptic } from '../lib/telegram';
import { Icon } from './Icon';
import { springs } from './motion';

export type Tab = 'home' | 'dream' | 'buys' | 'calendar';

export const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'home', label: 'Главная', icon: 'home' },
  { id: 'dream', label: 'Мечта', icon: 'car' },
  { id: 'buys', label: 'Покупки', icon: 'bag' },
  { id: 'calendar', label: 'Календарь', icon: 'calendar' },
];

interface TabBarProps {
  tab: Tab;
  onChange: (t: Tab) => void;
  /** the last button: planner, card, sync and the rest */
  onMore: () => void;
}

/** Buttons at the bottom: the sections and «Ещё». Drawn on the first frame, no entrance. */
export function TabBar({ tab, onChange, onMore }: TabBarProps) {
  return (
    <nav className="tabbar" aria-label="Разделы">
      <div className="tabbar-pill surface surface--float" role="tablist" style={{ '--tabs': TABS.length + 1 } as CSSProperties}>
        {TABS.map((t) => {
          const on = tab === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={on}
              className={`tab ${on ? 'tab--on' : ''}`}
              onClick={() => {
                if (!on) haptic('selection');
                onChange(t.id);
              }}
            >
              {on && <motion.span layoutId="tab-drop" className="tab-drop" transition={springs.bouncy} />}
              <motion.span key={on ? 'on' : 'off'} initial={on ? { scale: 0.7 } : false} animate={{ scale: 1 }} transition={springs.bouncy} className="tab-icon">
                <Icon name={t.icon} size={23} fill={on} />
              </motion.span>
              <span className="tab-label">{t.label}</span>
            </button>
          );
        })}
        <motion.button
          type="button"
          className="tab"
          aria-label="Ещё: планировщик, карта, вместе"
          whileTap={{ scale: 0.88 }}
          transition={springs.snappy}
          onClick={() => {
            haptic('light');
            onMore();
          }}
        >
          <span className="tab-icon">
            <Icon name="more" size={23} />
          </span>
          <span className="tab-label">Ещё</span>
        </motion.button>
      </div>
    </nav>
  );
}
