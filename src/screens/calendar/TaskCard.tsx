import { motion } from 'motion/react';
import { useState } from 'react';
import { actions } from '../../lib/appStore';
import { haptic } from '../../lib/telegram';
import type { Task } from '../../lib/types';
import { Icon } from '../../ui/Icon';
import { springs } from '../../ui/motion';
import { Pressable } from '../../ui/Pressable';

/** Task with its description under the title; the tick draws itself when done. */
export function TaskCard({ task }: { task: Task }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div layout className={`task surface surface--raised ${task.done ? 'task--done' : ''}`} exit={{ opacity: 0, x: -60 }} transition={springs.snappy}>
      <button
        type="button"
        className="task-check"
        aria-label={task.done ? 'Вернуть в работу' : 'Отметить выполненной'}
        aria-pressed={task.done}
        onClick={() => {
          haptic(task.done ? 'light' : 'success');
          actions.toggleTask(task.id);
        }}
      >
        <motion.span className="task-check-fill" initial={false} animate={{ scale: task.done ? 1 : 0 }} transition={springs.bouncy} />
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <motion.path
            d="M5 12.5l4.5 4.5L19 7"
            fill="none"
            stroke="#fff"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={false}
            animate={{ pathLength: task.done ? 1 : 0 }}
            transition={{ duration: 0.3, delay: task.done ? 0.08 : 0 }}
          />
        </svg>
      </button>
      <motion.button layout="position" type="button" className="task-text" onClick={() => task.desc && setOpen((o) => !o)}>
        <span className="task-title">{task.title}</span>
        {task.desc && <span className={`task-desc ${open ? 'task-desc--open' : ''}`}>{task.desc}</span>}
      </motion.button>
      <Pressable className="icon-btn task-del" aria-label="Удалить задачу" feedback="medium" onPress={() => actions.deleteTask(task.id)}>
        <Icon name="trash" size={18} />
      </Pressable>
    </motion.div>
  );
}
