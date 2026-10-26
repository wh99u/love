import { motion } from 'motion/react';
import type { CSSProperties } from 'react';
import { haptic } from '../lib/telegram';
import { Icon } from './Icon';
import { springs } from './motion';
import { Pressable } from './Pressable';

export type Tab = 'home' | 'budget' | 'dream' | 'buys' | 'calendar';

export const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'home', label: 'Главная', icon: 'home' },
  { id: 'budget', label: 'Бюджет', icon: 'wallet' },
  { id: 'dream', label: 'Мечта', icon: 'car' },
  { id: 'buys', label: 'Покупки', icon: 'bag' },
  { id: 'calendar', label: 'Календарь', icon: 'calendar' },
];

interface TabBarProps {
  tab: Tab;
  onChange: (t: Tab) => void;
  onPlus: () => void;
}

export function TabBar({ tab, onChange, onPlus }: TabBarProps) {
  return (
    <nav className="tabbar" aria-label="Разделы">
      <div className="tabbar-pill surface surface--float" role="tablist" style={{ '--tabs': TABS.length } as CSSProperties}>
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
              <motion.span key={on ? 'on' : 'off'} initial={on ? { scale: 0.7 } : false} animate={{ scale: 1 }} transition={springs.bouncy} style={{ position: 'relative', zIndex: 1, display: 'grid' }}>
                <Icon name={t.icon} size={23} fill={on} />
              </motion.span>
              <span className="tab-label">{t.label}</span>
            </button>
          );
        })}
      </div>
      <Pressable className="tabbar-plus" aria-label="Добавить" feedback="medium" scale={0.88} onPress={onPlus}>
        <Icon name="plus" size={26} stroke={2.4} />
      </Pressable>
    </nav>
  );
}
