import { AnimatePresence } from 'motion/react';
import { useSyncExternalStore, type ReactNode } from 'react';
import { haptic } from '../lib/telegram';
import { Sheet } from './Sheet';

type Render = (close: () => void) => ReactNode;

interface Entry {
  id: number;
  render: Render;
  onClose?: () => void;
}

let stack: Entry[] = [];
let next = 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((fn) => fn());

/** Opens a bottom sheet above everything; returns its id. */
export function openSheet(render: Render, opts: { onClose?: () => void } = {}) {
  const id = next++;
  stack = [...stack, { id, render, onClose: opts.onClose }];
  haptic('light');
  emit();
  return id;
}

/** Closes the given sheet, or the top one. */
export function closeSheet(id?: number) {
  const target = id === undefined ? stack.at(-1) : stack.find((e) => e.id === id);
  if (!target) return;
  stack = stack.filter((e) => e !== target);
  emit();
  target.onClose?.();
}

export const closeAllSheets = () => {
  const all = stack;
  stack = [];
  emit();
  all.forEach((e) => e.onClose?.());
};

const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export function SheetHost() {
  const entries = useSyncExternalStore(subscribe, () => stack);
  return (
    <AnimatePresence>
      {entries.map((e, i) => (
        <Sheet key={e.id} depth={entries.length - 1 - i} onClose={() => closeSheet(e.id)}>
          {e.render(() => closeSheet(e.id))}
        </Sheet>
      ))}
    </AnimatePresence>
  );
}
