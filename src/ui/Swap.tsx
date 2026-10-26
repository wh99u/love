import { AnimatePresence, motion } from 'motion/react';
import type { ReactNode } from 'react';

const ease = [0.22, 1, 0.36, 1] as const;

/** Text that changes with a soft drop: the old one blurs away upwards, the new one rises in. */
export function Swap({ k, children, className }: { k: string; children: ReactNode; className?: string }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={k}
        className={className}
        style={{ display: 'inline-block' }}
        initial={{ opacity: 0, y: 9, filter: 'blur(5px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }}
        exit={{ opacity: 0, y: -9, filter: 'blur(5px)', transition: { duration: 0.16, ease } }}
        transition={{ duration: 0.42, ease }}
      >
        {children}
      </motion.span>
    </AnimatePresence>
  );
}
