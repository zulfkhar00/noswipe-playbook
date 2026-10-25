import React from 'react';
import {wrap} from '../lib/speech';
import {DISPLAY, SANS} from '../lib/fonts';

export {DISPLAY, SANS};

// NoSwipe's brand system, lifted from noswipe.app's CSS so the ad and the landing page match:
// cream paper, grape ink and outlines, coral / lime / lilac accents, Bagel Fat One + Figtree,
// chunky rounded cards with a hard offset shadow.


export const K = {
  paper: '#FFF8F0', grape: '#22104A', grape2: '#4A3B6B', grape3: '#7A6C93',
  coral: '#FF5A47', lime: '#C9F24D', lilac: '#DCD0FF', blush: '#FFE3DB', sky: '#CFEFFF', card: '#FFFFFF',
};
/** Soft 2.5D shadows are tinted with the brand ink rather than black. */
export const INK_TINT: [number, number, number] = [0.13, 0.06, 0.29];

export const STROKE = 7;
export const HARD: [number, number] = [14, 18];

/** The site's card: rounded, grape outline, hard offset shadow. x/y is the top-left corner. */
export const Card: React.FC<{x: number; y: number; w: number; h: number; fill?: string; r?: number; rot?: number; shadow?: boolean; children?: React.ReactNode}> =
  ({x, y, w, h, fill = K.card, r = 50, rot = 0, shadow = true, children}) =>
    <g transform={`translate(${x} ${y}) rotate(${rot} ${w / 2} ${h / 2})`}>
      {shadow && <rect x={HARD[0]} y={HARD[1]} width={w} height={h} rx={r} fill={K.grape} />}
      <rect width={w} height={h} rx={r} fill={fill} stroke={K.grape} strokeWidth={STROKE} />
      {children}
    </g>;

/** A pill (chip, sticker or button). Centered on x/y. */
export const Pill: React.FC<{x: number; y: number; text: string; size?: number; fill?: string; color?: string; rot?: number; font?: 'sans' | 'display'; shadow?: boolean; weight?: number; scale?: number}> =
  ({x, y, text, size = 34, fill = K.card, color = K.grape, rot = 0, font = 'sans', shadow = false, weight = 700, scale = 1}) => {
    const w = text.length * size * (font === 'display' ? 0.62 : 0.55) + size * 1.4;
    const h = size * 1.9;
    return <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale})`}>
      {shadow && <rect x={-w / 2 + 6} y={-h / 2 + 8} width={w} height={h} rx={h / 2} fill={K.grape} />}
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill={fill} stroke={K.grape} strokeWidth={5} />
      <text x={0} y={size * 0.36} textAnchor="middle" fontFamily={font === 'display' ? DISPLAY : SANS} fontWeight={weight} fontSize={size} fill={color}>{text}</text>
    </g>;
  };

export const Lines: React.FC<{x: number; y: number; text: string; max: number; size: number; lh?: number; fill?: string; weight?: number; font?: 'sans' | 'display'; anchor?: 'start' | 'middle'}> =
  ({x, y, text, max, size, lh = 1.3, fill = K.grape, weight = 400, font = 'sans', anchor = 'start'}) =>
    <>{wrap(text, max).map((l, i) => <text key={i} x={x} y={y + i * size * lh} textAnchor={anchor} fontFamily={font === 'display' ? DISPLAY : SANS} fontWeight={weight} fontSize={size} fill={fill}>{l}</text>)}</>;

/** The NoSwipe smiley: lime face, one eye winking. */
export const Logo: React.FC<{x: number; y: number; r: number; word?: boolean}> = ({x, y, r, word = false}) => <g transform={`translate(${x} ${y})`}>
  <circle r={r} fill={K.lime} stroke={K.grape} strokeWidth={r * 0.12} />
  <path d={`M ${-r * 0.5} ${-r * 0.12} Q ${-r * 0.3} ${-r * 0.3} ${-r * 0.1} ${-r * 0.12}`} fill="none" stroke={K.grape} strokeWidth={r * 0.13} strokeLinecap="round" />
  <path d={`M ${r * 0.12} ${-r * 0.18} L ${r * 0.5} ${-r * 0.18}`} stroke={K.grape} strokeWidth={r * 0.13} strokeLinecap="round" />
  <path d={`M ${-r * 0.45} ${r * 0.2} Q ${0} ${r * 0.62} ${r * 0.45} ${r * 0.2}`} fill="none" stroke={K.grape} strokeWidth={r * 0.13} strokeLinecap="round" />
  {word && <text x={r * 1.35} y={r * 0.38} fontFamily={DISPLAY} fontSize={r * 1.05} fill={K.grape}>NoSwipe</text>}
</g>;

/** A drawn avatar in the site's style: round frame, simple face, hair. */
export const Avatar: React.FC<{x: number; y: number; r: number; skin: string; hair: string; bg?: string; style?: 'bob' | 'long' | 'bun'}> = ({x, y, r, skin, hair, bg = K.blush, style = 'bob'}) => {
  const id = `av${Math.round(x)}${Math.round(y)}${Math.round(r)}`;
  return <g transform={`translate(${x} ${y})`}>
    <defs><clipPath id={id}><circle r={r} /></clipPath></defs>
    <circle r={r} fill={bg} />
    <g clipPath={`url(#${id})`}>
      {style === 'long' && <rect x={-r * 0.62} y={-r * 0.5} width={r * 1.24} height={r * 1.5} rx={r * 0.5} fill={hair} />}
      <path d={`M ${-r * 0.85} ${r * 1.1} Q ${-r * 0.8} ${r * 0.55} 0 ${r * 0.5} Q ${r * 0.8} ${r * 0.55} ${r * 0.85} ${r * 1.1} Z`} fill={K.coral} stroke={K.grape} strokeWidth={r * 0.06} />
      <ellipse cy={-r * 0.05} rx={r * 0.42} ry={r * 0.5} fill={skin} stroke={K.grape} strokeWidth={r * 0.06} />
      <path d={`M ${-r * 0.48} ${style === 'bob' ? r * 0.15 : -r * 0.05} Q ${-r * 0.55} ${-r * 0.7} 0 ${-r * 0.66} Q ${r * 0.55} ${-r * 0.7} ${r * 0.48} ${style === 'bob' ? r * 0.15 : -r * 0.05} Q ${r * 0.3} ${-r * 0.35} ${-r * 0.05} ${-r * 0.38} Q ${-r * 0.3} ${-r * 0.3} ${-r * 0.48} ${style === 'bob' ? r * 0.15 : -r * 0.05} Z`}
        fill={hair} stroke={K.grape} strokeWidth={r * 0.05} />
      {style === 'bun' && <circle cy={-r * 0.78} r={r * 0.2} fill={hair} stroke={K.grape} strokeWidth={r * 0.05} />}
      {[-1, 1].map((s) => <circle key={s} cx={s * r * 0.16} cy={-r * 0.03} r={r * 0.05} fill={K.grape} />)}
      <path d={`M ${-r * 0.13} ${r * 0.18} Q 0 ${r * 0.28} ${r * 0.13} ${r * 0.18}`} fill="none" stroke={K.grape} strokeWidth={r * 0.05} strokeLinecap="round" />
    </g>
    <circle r={r} fill="none" stroke={K.grape} strokeWidth={r * 0.08} />
  </g>;
};

/** Calendar glyph used on the site's date blocks. */
export const CalIcon: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => <g transform={`translate(${x} ${y}) scale(${s / 40})`} fill="none" stroke={K.grape} strokeWidth={4} strokeLinejoin="round">
  <rect x={-18} y={-14} width={36} height={32} rx={5} /><path d="M -18 -4 H 18 M -9 -20 V -9 M 9 -20 V -9 M -8 7 L -2 12 L 9 1" strokeLinecap="round" />
</g>;
/** A check that pops in, then draws its tick, with a tap ripple. `on` runs 0 → 1+ over the beat. */
export const Check: React.FC<{x: number; y: number; r: number; on?: number; ripple?: number}> = ({x, y, r, on = 1, ripple = 0}) => {
  const len = r * 1.6;
  const draw = Math.max(0, Math.min(1, on * 1.6 - 0.4));
  return <g transform={`translate(${x} ${y})`}>
    {ripple > 0 && ripple < 1 && <circle r={r * (1 + 2.2 * ripple)} fill="none" stroke={K.grape} strokeWidth={5 * (1 - ripple)} opacity={1 - ripple} />}
    <g transform={`scale(${Math.min(on, 1.15)})`}>
      <circle r={r} fill={K.grape} />
      <path d={`M ${-r * 0.45} 0 L ${-r * 0.1} ${r * 0.35} L ${r * 0.5} ${-r * 0.35}`} fill="none" stroke={K.lime} strokeWidth={r * 0.3} strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray={len} strokeDashoffset={len * (1 - draw)} />
    </g>
  </g>;
};
