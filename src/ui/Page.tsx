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
}

/** Full-screen page pushed over the tabs; Telegram's own Back button closes it. */
export function Page({ title, onBack, children, action }: PageProps) {
  useEffect(() => {
    backButton.show(onBack);
    return () => backButton.hide();
  }, [onBack]);

  return (
    <motion.section
      className="page"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={springs.snappy}
      aria-label={title}
    >
      <header className="page-head">
        {!backButton.available ? (
          <Pressable className="page-back glass" aria-label="Назад" onPress={onBack}>
            <Icon name="back" size={22} stroke={2.2} />
          </Pressable>
        ) : (
          <span className="page-back-spacer" />
        )}
        <h1 className="page-title">{title}</h1>
        <div className="page-action">{action}</div>
      </header>
      <div className="page-scroll">{children}</div>
    </motion.section>
  );
}
