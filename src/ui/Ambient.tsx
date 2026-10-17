import type { CSSProperties } from 'react';

/** Slow coloured light behind the glass: glass needs something to refract. */
export function Ambient({ colors }: { colors: [string, string, string] }) {
  const style = { '--amb-1': colors[0], '--amb-2': colors[1], '--amb-3': colors[2] } as CSSProperties;
  return (
    <div className="ambient" style={style} aria-hidden="true">
      <i className="amb amb-1" />
      <i className="amb amb-2" />
      <i className="amb amb-3" />
    </div>
  );
}
