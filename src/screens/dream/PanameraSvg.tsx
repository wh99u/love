import { useId } from 'react';

import { shade } from '../../lib/color';

/*
 * Porsche Panamera, side view, nose to the right. Drawn at 0.15 px/mm from the
 * real car: 5050 mm long (x 20–780), 2950 mm wheelbase (wheels at x 198 / 638),
 * 1423 mm tall (roof ≈ y 50, ground y 262), 21" wheels.
 */
const BODY =
  'M42 240 L30 232 Q22 222 22 204 L24 168 Q26 140 46 132 L76 126 C120 116 168 98 214 82 C266 64 324 50 388 48 C424 47 452 50 472 58 C500 70 530 94 566 112 C606 118 660 122 708 128 C736 132 758 140 768 152 Q778 166 780 186 L780 206 Q779 222 771 230 L752 240 L703 240 A65 65 0 0 0 573 240 L263 240 A65 65 0 0 0 133 240 Z';
const GLASS = 'M556 119 L470 64 Q426 54 388 55 Q326 57 270 72 Q214 90 162 113 Z';
const WHEELS = [198, 638];

function Wheel({ cx, id }: { cx: number; id: string }) {
  const spokes = Array.from({ length: 10 }, (_, i) => (i * 36 * Math.PI) / 180);
  return (
    <g>
      <circle cx={cx} cy={206} r={56} fill="#0a0a0b" />
      <circle cx={cx} cy={206} r={52} fill="none" stroke="#1d1d20" strokeWidth={4} />
      <circle cx={cx} cy={206} r={42} fill={`url(#${id}-rim)`} />
      <circle cx={cx} cy={206} r={36} fill="#17181b" />
      <circle cx={cx} cy={206} r={30} fill="none" stroke="#2c2d31" strokeWidth={6} strokeDasharray="2 3" />
      <path d={`M${cx + 14} ${206 - 30} a33 33 0 0 1 18 22 l-9 3 a24 24 0 0 0 -13 -16z`} fill="#3a3b40" />
      {spokes.map((a) => {
        const p = (r: number, da: number) => `${(cx + r * Math.cos(a + da)).toFixed(1)} ${(206 + r * Math.sin(a + da)).toFixed(1)}`;
        return <path key={a} d={`M${p(9, -0.16)} L${p(40, -0.05)} L${p(40, 0.05)} L${p(9, 0.16)} Z`} fill={`url(#${id}-spoke)`} />;
      })}
      <circle cx={cx} cy={206} r={41} fill="none" stroke="#d8dbe0" strokeWidth={1.4} opacity={0.75} />
      <circle cx={cx} cy={206} r={9} fill="#2a2b2f" stroke="#bfc3c9" strokeWidth={1.2} />
      <circle cx={cx} cy={206} r={3.5} fill="#c9a640" />
    </g>
  );
}

export function PanameraSvg({ color = '#1c1c1e', className }: { color?: string; className?: string }) {
  const id = useId().replace(/:/g, '');
  const car = (
    <>
      <path d={BODY} fill={`url(#${id}-body)`} />
      {/* lower body and sills are darker, like a real car's shadow line */}
      <path d={BODY} fill={`url(#${id}-lower)`} />
      {/* sky reflected along the doors, and the front wing catching light */}
      <g clipPath={`url(#${id}-clip)`}>
        <rect x="60" y="148" width="700" height="40" fill={`url(#${id}-sky)`} />
      </g>
      <path d="M712 150 Q646 138 588 152" fill="none" stroke="#fff" strokeOpacity={0.14} strokeWidth={4} strokeLinecap="round" />
      {/* shoulder line, then the wide rear haunch catching light over the wheel */}
      <path d="M742 144 Q600 136 470 138 Q330 140 220 146 Q150 150 80 140" fill="none" stroke="#fff" strokeOpacity={0.3} strokeWidth={1.6} />
      <path d="M352 152 Q262 146 204 152 Q150 158 112 176" fill="none" stroke="#fff" strokeOpacity={0.16} strokeWidth={5} strokeLinecap="round" />
      <path d="M720 190 Q560 184 300 190" fill="none" stroke="#000" strokeOpacity={0.35} strokeWidth={1.2} />
      {/* windows */}
      <path d={GLASS} fill={`url(#${id}-glass)`} />
      <path d="M462 62 L406 56 L406 118 L486 118 Z" fill="#fff" opacity={0.05} />
      <path d={GLASS} fill="none" stroke="#d6d9de" strokeOpacity={0.55} strokeWidth={1.6} />
      <rect x={398} y={55} width={7} height={64} fill="#050506" />
      <path d="M268 74 L264 117" stroke="#050506" strokeWidth={6} />
      {/* trunk lid edge */}
      <path d="M46 132 Q60 130 76 126" fill="none" stroke="#fff" strokeOpacity={0.25} strokeWidth={1.2} />
      {/* door shut lines and handles */}
      <path d="M566 122 Q570 180 564 236 M402 121 L402 238 M272 120 Q270 160 274 196" fill="none" stroke="#000" strokeOpacity={0.55} strokeWidth={1.2} />
      <rect x={466} y={136} width={30} height={5} rx={2.5} fill="#000" opacity={0.5} />
      <rect x={326} y={137} width={30} height={5} rx={2.5} fill="#000" opacity={0.5} />
      {/* mirror */}
      <path d="M540 121 Q550 106 574 108 L576 118 Q562 124 540 123 Z" fill={shade(color, -0.2)} stroke="#000" strokeOpacity={0.4} />
      {/* side gill behind the front wheel */}
      <path d="M588 158 L596 158 L586 196 L579 196 Z" fill="#000" opacity={0.55} />
      {/* rear LED light bar and front headlight */}
      <path d="M24 150 Q44 145 72 138 L74 143 Q46 151 25 156 Z" fill={`url(#${id}-tail)`} />
      <path d="M744 150 Q766 152 777 168 L762 168 Q752 161 742 157 Z" fill="#eef4ff" opacity={0.92} />
      <path d="M752 156 l14 0" stroke="#9fd0ff" strokeWidth={1.4} strokeLinecap="round" />
      {/* front intake */}
      <path d="M744 206 Q764 204 778 208 L774 226 Q760 232 744 230 Z" fill="#050506" opacity={0.85} />
      {/* rear diffuser */}
      <path d="M30 222 L80 226 L84 238 L40 238 Z" fill="#050506" opacity={0.7} />
      {WHEELS.map((x) => (
        <Wheel key={x} cx={x} id={id} />
      ))}
    </>
  );

  return (
    <svg className={className} viewBox="0 0 800 300" role="img" aria-label="Porsche Panamera">
      <defs>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.12" stopColor={shade(color, 0.24)} />
          <stop offset="0.45" stopColor={color} />
          <stop offset="1" stopColor={shade(color, -0.45)} />
        </linearGradient>
        <linearGradient id={`${id}-lower`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.62" stopColor="#000" stopOpacity="0" />
          <stop offset="0.86" stopColor="#000" stopOpacity="0.45" />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <path d={BODY} />
        </clipPath>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.11" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-glass`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4a525f" />
          <stop offset="0.55" stopColor="#15181e" />
          <stop offset="1" stopColor="#07080a" />
        </linearGradient>
        <linearGradient id={`${id}-tail`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ff2d2d" />
          <stop offset="1" stopColor="#8a0b0b" />
        </linearGradient>
        <radialGradient id={`${id}-rim`} cx="0.4" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#4b4d53" />
          <stop offset="1" stopColor="#141518" />
        </radialGradient>
        <linearGradient id={`${id}-spoke`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#eef0f3" />
          <stop offset="1" stopColor="#8e9299" />
        </linearGradient>
        <filter id={`${id}-blur`} x="-10%" y="-200%" width="120%" height="500%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>
      <ellipse cx="408" cy="262" rx="370" ry="11" fill="#000" opacity="0.75" filter={`url(#${id}-blur)`} />
      {car}
    </svg>
  );
}
