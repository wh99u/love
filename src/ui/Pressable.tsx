import { motion, type HTMLMotionProps } from 'motion/react';
import { haptic, type HapticKind } from '../lib/telegram';
import { springs } from './motion';

interface PressableProps extends HTMLMotionProps<'button'> {
  onPress?: () => void;
  feedback?: HapticKind | false;
  scale?: number;
}

/** Button that sinks under the finger and ticks the Taptic Engine. */
export function Pressable({ onPress, feedback = 'light', scale = 0.95, type = 'button', onClick, disabled, ...rest }: PressableProps) {
  return (
    <motion.button
      type={type}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale }}
      transition={springs.snappy}
      onClick={(e) => {
        if (feedback) haptic(feedback);
        onClick?.(e);
        onPress?.();
      }}
      {...rest}
    />
  );
}
