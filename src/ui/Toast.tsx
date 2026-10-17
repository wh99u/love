import { AnimatePresence, motion } from 'motion/react';
import { useSyncExternalStore } from 'react';
import { haptic } from '../lib/telegram';
import { Icon } from './Icon';
import { springs } from './motion';

type Kind = 'info' | 'success' | 'error';

interface ToastItem {
  id: number;
  text: string;
  kind: Kind;
  action?: { label: string; run: () => void };
}

let items: ToastItem[] = [];
let next = 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((fn) => fn());

const dismiss = (id: number) => {
  items = items.filter((t) => t.id !== id);
  emit();
};

/** Short message at the top of the screen; with an action it stays 5 s. */
export function toast(text: string, kind: Kind = 'info', action?: ToastItem['action']) {
  const id = next++;
  items = [...items.slice(-2), { id, text, kind, action }];
  if (kind === 'error') haptic('error');
  emit();
  setTimeout(() => dismiss(id), action ? 5000 : 2600);
}

const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

const ICON: Record<Kind, string> = { info: 'bell', success: 'check', error: 'close' };

export function ToastHost() {
  const list = useSyncExternalStore(subscribe, () => items);
  return (
    <div className="toasts" aria-live="polite">
      <AnimatePresence initial={false}>
        {list.map((t) => (
          <motion.div
            key={t.id}
            layout
            className={`toast glass glass--strong toast--${t.kind}`}
            initial={{ opacity: 0, y: -24, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.95 }}
            transition={springs.bouncy}
          >
            <span className="toast-icon">
              <Icon name={ICON[t.kind]} size={16} stroke={2.4} />
            </span>
            <span className="toast-text">{t.text}</span>
            {t.action && (
              <button
                className="toast-action"
                onClick={() => {
                  t.action!.run();
                  dismiss(t.id);
                }}
              >
                {t.action.label}
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
