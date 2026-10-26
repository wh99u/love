import { motion } from 'motion/react';
import { haptic } from '../lib/telegram';
import { Icon } from './Icon';
import { springs } from './motion';
import { openSheet } from './sheets';

export interface Tool {
  id: string;
  label: string;
  icon: string;
  run: () => void;
}

function MoreSheet({ tools, close }: { tools: Tool[]; close: () => void }) {
  return (
    <div>
      <h2 className="sheet-title">Ещё</h2>
      <div className="more-list">
        {tools.map((t, n) => (
          <motion.button
            key={t.id}
            type="button"
            className="more-item"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...springs.soft, delay: 0.05 + n * 0.035 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              haptic('light');
              close();
              t.run();
            }}
          >
            <span className="more-item-icon">
              <Icon name={t.icon} size={20} />
            </span>
            {t.label}
            <Icon name="chevron" size={15} className="more-item-go" />
          </motion.button>
        ))}
      </div>
    </div>
  );
}

/** Everything that is not a section: planner, card, sync, the shortcut… */
export const openMore = (tools: Tool[]) => openSheet((close) => <MoreSheet tools={tools} close={close} />);
