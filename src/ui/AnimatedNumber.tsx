import { motion } from 'motion/react';
import type { CSSProperties } from 'react';
import { cx } from './cx';
import { springs } from './motion';

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

interface AnimatedNumberProps {
  value: number;
  format: (n: number) => string;
  className?: string;
  style?: CSSProperties;
}

/** Odometer: every digit is a vertical tape that rolls to its new value. */
export function AnimatedNumber({ value, format, className, style }: AnimatedNumberProps) {
  const text = format(value);
  const chars = [...text];
  return (
    <span className={cx('odo', className)} style={style} aria-label={text} role="text">
      {chars.map((ch, i) => {
        const fromRight = chars.length - i;
        if (!/\d/.test(ch)) {
          return (
            <span key={`s${fromRight}`} className="odo-static" aria-hidden="true">
              {ch}
            </span>
          );
        }
        return (
          <span key={`d${fromRight}`} className="odo-col" aria-hidden="true">
            <motion.span className="odo-tape" initial={false} animate={{ y: `${-Number(ch) * 10}%` }} transition={springs.soft}>
              {DIGITS.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </motion.span>
            <span className="odo-sizer">{ch}</span>
          </span>
        );
      })}
    </span>
  );
}
