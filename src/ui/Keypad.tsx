import { useRef } from 'react';
import { Icon } from './Icon';
import { keypadReduce } from './keypadLogic';
import { Pressable } from './Pressable';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', '⌫'];

interface KeypadProps {
  value: string;
  onChange: (v: string) => void;
}

/** Big glass number pad; amounts are typed without the system keyboard covering the sheet. */
export function Keypad({ value, onChange }: KeypadProps) {
  // Fast double taps land before React re-renders, so keep the latest value here.
  const latest = useRef(value);
  latest.current = value;
  const press = (k: string) => {
    latest.current = keypadReduce(latest.current, k);
    onChange(latest.current);
  };
  return (
    <div className="keypad">
      {KEYS.map((k) => (
        <Pressable
          key={k}
          className="keypad-key glass glass--flat"
          feedback="selection"
          scale={0.9}
          aria-label={k === '⌫' ? 'Стереть' : k}
          onPress={() => press(k)}
        >
          {k === '⌫' ? <Icon name="back" size={26} /> : k}
        </Pressable>
      ))}
    </div>
  );
}
