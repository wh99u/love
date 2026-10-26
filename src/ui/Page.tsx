import { motion } from 'motion/react';
import { useEffect, type ReactNode } from 'react';
import { backButton } from '../lib/telegram';
import { Icon } from './Icon';
import { springs } from './motion';
import { Pressable } from './Pressable';

interface PageProps {
  title: string;
  onBack: () => void;
  children: ReactNode;
  action?: ReactNode;
  /** Rendered outside the scroll area: background light, floating buttons. */
  overlay?: ReactNode;
}

/** Full-screen page pushed over the tabs; the browser's Back (or Telegram's) closes it. */
export function Page({ title, onBack, children, action, overlay }: PageProps) {
  useEffect(() => backButton.push(onBack), [onBack]);

  return (
    <motion.section
      className="page"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={springs.page}
      aria-label={title}
    >
      <header className="page-head">
        {!backButton.available ? (
          <Pressable className="page-back surface" aria-label="Назад" onPress={onBack}>
            <Icon name="back" size={22} stroke={2.2} />
          </Pressable>
        ) : (
          <span className="page-back-spacer" />
        )}
        <h1 className="page-title">{title}</h1>
        <div className="page-action">{action}</div>
      </header>
      <div className="page-scroll">{children}</div>
      {overlay}
    </motion.section>
  );
}
