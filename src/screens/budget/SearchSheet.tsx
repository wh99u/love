import { motion } from 'motion/react';
import { useDeferredValue, useState } from 'react';
import { useStore } from '../../lib/appStore';
import { searchAll, type SearchHit } from '../../lib/search';
import { Icon } from '../../ui/Icon';
import { openSheet } from '../../ui/sheets';

const GROUPS: Record<SearchHit['group'], { label: string; icon: string }> = {
  buys: { label: 'Покупки', icon: 'bag' },
  tasks: { label: 'Задачи', icon: 'list' },
  incomes: { label: 'Пополнения', icon: 'plus' },
  categories: { label: 'Категории бюджета', icon: 'pie' },
  spends: { label: 'Траты', icon: 'coins' },
};

function SearchSheet({ onPick, close }: { onPick: (h: SearchHit) => void; close: () => void }) {
  const state = useStore((s) => s);
  const [q, setQ] = useState('');
  const deferred = useDeferredValue(q);
  const hits = searchAll(state, deferred);
  const groups = (Object.keys(GROUPS) as SearchHit['group'][]).map((g) => [g, hits.filter((h) => h.group === g)] as const).filter(([, l]) => l.length);

  return (
    <div className="search-sheet">
      <label className="search-field surface">
        <Icon name="search" size={20} />
        <input autoFocus className="search-input" placeholder="Покупки, задачи, суммы" value={q} onChange={(e) => setQ(e.target.value)} enterKeyHint="search" />
      </label>
      {deferred.trim() && hits.length === 0 && <p className="empty">Ничего не нашлось. Попробуйте другое слово или сумму.</p>}
      {groups.map(([g, list]) => (
        <section key={g} className="list-group">
          <h3 className="t-cap list-date">{GROUPS[g].label}</h3>
          {list.map((h, i) => (
            <motion.button
              key={h.id}
              className="list-row list-row--btn"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              onClick={() => {
                close();
                onPick(h);
              }}
            >
              <span className="list-icon">
                <Icon name={GROUPS[g].icon} size={18} />
              </span>
              <span className="list-text">
                <span className="list-title">{h.title}</span>
                <span className="t-cap">{h.subtitle}</span>
              </span>
              <Icon name="chevron" size={18} />
            </motion.button>
          ))}
        </section>
      ))}
    </div>
  );
}

export const openSearch = (onPick: (h: SearchHit) => void) => openSheet((close) => <SearchSheet onPick={onPick} close={close} />);
