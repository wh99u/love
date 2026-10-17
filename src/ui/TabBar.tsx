import { motion } from 'motion/react';
import { haptic } from '../lib/telegram';
import { Icon } from './Icon';
import { springs } from './motion';
import { Pressable } from './Pressable';

export type Tab = 'budget' | 'dream' | 'buys' | 'calendar';

export const TABS: { id: Tab; label: string; icon: string }[] = [
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
      <div className="tabbar-pill glass glass--lens" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={`tab ${tab === t.id ? 'tab--on' : ''}`}
            onClick={() => {
              if (t.id !== tab) haptic('selection');
              onChange(t.id);
            }}
          >
            {tab === t.id && <motion.span layoutId="tab-drop" className="tab-drop" transition={springs.bouncy} />}
            <Icon name={t.icon} size={24} />
            <span className="tab-label">{t.label}</span>
          </button>
        ))}
      </div>
      <Pressable className="tabbar-plus" aria-label="Добавить" feedback="medium" scale={0.88} onPress={onPlus}>
        <Icon name="plus" size={26} stroke={2.4} />
      </Pressable>
    </nav>
  );
}
