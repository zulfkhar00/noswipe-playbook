import React from 'react';
import {C, F, outline} from './world';

// Card people: a circle head and a bean body with a 6 px off-white outline, no face, one warm prop each.

export type Accessory = 'carabiner' | 'leash' | 'pan' | 'book' | 'cup' | 'plant' | 'guitar';

const Prop: React.FC<{kind: Accessory}> = ({kind}) => {
  switch (kind) {
    case 'carabiner': // a D-shaped clip on the hip with a rope loop
      return <g transform="translate(95 55)">
        <path d="M-6 -30 C-6 -30 -6 40 -6 40 L18 40 C34 40 34 -30 18 -30 Z" fill="none" stroke={C.ink} strokeWidth={15} strokeLinejoin="round" />
        <path d="M-6 -30 L-6 40 L18 40 C34 40 34 -30 18 -30 Z" fill="none" stroke={C.cyan} strokeWidth={8} strokeLinejoin="round" />
        <path d="M-8 -10 C-40 20 -30 70 -10 80" fill="none" stroke={C.ink} strokeWidth={14} strokeLinecap="round" />
        <path d="M-8 -10 C-40 20 -30 70 -10 80" fill="none" stroke={C.paper} strokeWidth={7} strokeLinecap="round" />
      </g>;
    case 'leash':
      return <g transform="translate(80 40)">
        <path d="M0 0 C40 60 90 40 140 70" fill="none" stroke={C.ink} strokeWidth={10} strokeLinecap="round" />
        <path d="M0 0 C40 60 90 40 140 70" fill="none" stroke={C.coral} strokeWidth={5} strokeLinecap="round" />
        <g transform="translate(168 62)">
          <ellipse cx={0} cy={0} rx={34} ry={20} fill={C.paper} {...outline(C.ink, 5)} />
          <circle cx={-34} cy={-14} r={17} fill={C.paper} {...outline(C.ink, 5)} />
          <path d="M-44 -34 L-52 -10 L-36 -22 Z" fill={C.ink} />
          {[-18, -6, 14, 26].map((x) => <line key={x} x1={x} y1={14} x2={x} y2={36} stroke={C.ink} strokeWidth={8} strokeLinecap="round" />)}
          <path d="M34 -6 C50 -22 52 -30 44 -34" fill="none" stroke={C.ink} strokeWidth={7} strokeLinecap="round" />
        </g>
      </g>;
    case 'pan':
      return <g transform="translate(95 50)">
        <rect x={26} y={-6} width={74} height={14} rx={7} fill={C.ink} stroke={C.paper} strokeWidth={4} />
        <circle r={40} fill={C.ink} stroke={C.paper} strokeWidth={6} />
        <circle r={26} fill="#2B3148" />
        <path d="M-12 -62 C-20 -76 -2 -80 -8 -96 M12 -62 C4 -76 22 -80 16 -96" fill="none" stroke="#AEB4C6" strokeWidth={6} strokeLinecap="round" />
      </g>;
    case 'book':
      return <g transform="translate(95 40)">
        <rect x={-34} y={-44} width={72} height={90} rx={6} fill={C.cyan} stroke={C.ink} strokeWidth={6} />
        <rect x={-22} y={-44} width={60} height={90} rx={4} fill={C.paper} stroke={C.ink} strokeWidth={4} />
        <line x1={-12} y1={-18} x2={28} y2={-18} stroke={C.ink} strokeWidth={5} />
        <line x1={-12} y1={0} x2={28} y2={0} stroke={C.ink} strokeWidth={5} />
        <line x1={-12} y1={18} x2={14} y2={18} stroke={C.ink} strokeWidth={5} />
      </g>;
    case 'cup':
      return <g transform="translate(98 40)">
        <path d="M-34 -36 L34 -36 L26 44 L-26 44 Z" fill={C.paper} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
        <path d="M-31 -8 L31 -8 L28 22 L-28 22 Z" fill={C.coral} stroke={C.ink} strokeWidth={4} />
        <rect x={-38} y={-48} width={76} height={14} rx={7} fill={C.ink} />
        <path d="M-12 -62 C-22 -78 -2 -84 -10 -100 M12 -62 C2 -78 22 -84 14 -100" fill="none" stroke="#AEB4C6" strokeWidth={6} strokeLinecap="round" />
      </g>;
    case 'plant':
      return <g transform="translate(95 44)">
        <path d="M-30 -10 L30 -10 L22 44 L-22 44 Z" fill={C.coral} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
        <path d="M0 -10 C-10 -50 -40 -50 -42 -72 C-20 -74 -2 -50 0 -10 M0 -10 C10 -50 40 -50 42 -72 C20 -74 2 -50 0 -10" fill={C.cyan} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
      </g>;
    case 'guitar':
      return <g transform="translate(95 40) rotate(20)">
        <rect x={-6} y={-90} width={12} height={70} fill={C.ink} />
        <ellipse cx={0} cy={0} rx={30} ry={26} fill={C.coral} stroke={C.ink} strokeWidth={6} />
        <ellipse cx={0} cy={28} rx={36} ry={30} fill={C.coral} stroke={C.ink} strokeWidth={6} />
        <circle cx={0} cy={18} r={9} fill={C.ink} />
      </g>;
  }
};

/** One card person on a card: head + bean body + warm prop. Local origin = figure centre (head centre at 0,0). */
export const CardFigure: React.FC<{body: string; accessory: Accessory; scale?: number; hero?: boolean}> = ({body, accessory, scale = 1, hero = false}) =>
  <g transform={`scale(${scale})`}>
    <rect x={-58} y={52} width={116} height={128} rx={58} fill={body} {...outline()} />
    <circle cx={0} cy={0} r={54} fill={C.paper} {...outline(C.paper)} />
    <circle cx={0} cy={0} r={54} fill={body === C.paper ? C.cyan : '#F6E2D0'} stroke={C.ink} strokeWidth={0} />
    {hero && <circle cx={0} cy={-68} r={26} fill={C.hair} {...outline()} />}
    <path d="M-54 -4 A54 54 0 0 1 54 -4 C30 -26 -30 -26 -54 -4 Z" fill={hero ? C.hair : C.ink} />
    <circle cx={0} cy={0} r={54} fill="none" {...outline()} />
    <g transform="translate(0 70)"><Prop kind={accessory} /></g>
    <circle cx={60} cy={110} r={17} fill="#F6E2D0" {...outline()} />
  </g>;

export type CardSpec = {fill: string; body: string; accessory: Accessory; name?: string; bio: string[]; bars?: boolean; hero?: boolean};

export const CARD_W = 580;
export const CARD_H = 470;

/** A generic profile card (ours, nothing to do with any app): figure on top, name + bio below. Origin = top-left. */
export const CardFace: React.FC<{card: CardSpec; reveal?: number}> = ({card, reveal = 1}) => {
  const lines = card.bio;
  const y0 = card.name ? 372 : 352;
  const shown = (i: number) => {
    // typed reveal over the lines, character by character
    const total = lines.reduce((a, l) => a + l.length, 0);
    const before = lines.slice(0, i).reduce((a, l) => a + l.length, 0);
    const n = Math.max(0, Math.min(lines[i].length, Math.round(reveal * total) - before));
    return lines[i].slice(0, n);
  };
  return <g>
    <rect x={10} y={12} width={CARD_W} height={CARD_H} rx={40} fill={C.ink} />
    <rect x={0} y={0} width={CARD_W} height={CARD_H} rx={40} fill={card.fill} stroke={C.ink} strokeWidth={6} />
    <g transform="translate(300 100)"><CardFigure body={card.body} accessory={card.accessory} hero={card.hero} /></g>
    {card.name && <text x={40} y={322} fontFamily={F.inter} fontWeight={700} fontSize={36} fill={C.ink} opacity={0.65} letterSpacing={1}>{card.name.toUpperCase()}</text>}
    {card.bars
      ? lines.map((l, i) => <rect key={i} x={40} y={y0 + i * 52 - 26} width={i === 0 ? 470 : 330} height={26} rx={13} fill={C.ink} opacity={0.16} />)
      : lines.map((l, i) => <text key={i} x={40} y={y0 + i * 52} fontFamily={F.inter} fontWeight={600} fontSize={42} fill={C.ink}>{shown(i)}</text>)}
  </g>;
};

// ----------------------------------------------------------------------------------------- POV hand

export const PHONE = {x: 180, y: 580, w: 720, h: 980};
export const SCREEN = {x: 208, y: 608, w: 664, h: 924};
export const CARD_POS = {x: 250, y: 640};
export const THUMB_ANCHOR = {x: 930, y: 1640};

/** The phone seen from above (our own design), without any content. Cards are drawn inside the screen by the caller. */
export const PhoneBody: React.FC<{children?: React.ReactNode}> = ({children}) => <g>
  <rect x={PHONE.x + 12} y={PHONE.y + 14} width={PHONE.w} height={PHONE.h} rx={84} fill="#06070B" />
  <rect x={PHONE.x} y={PHONE.y} width={PHONE.w} height={PHONE.h} rx={84} fill={C.phone} stroke={C.paper} strokeWidth={6} />
  <clipPath id="screenClip"><rect x={SCREEN.x} y={SCREEN.y} width={SCREEN.w} height={SCREEN.h} rx={58} /></clipPath>
  <rect x={SCREEN.x} y={SCREEN.y} width={SCREEN.w} height={SCREEN.h} rx={58} fill={C.screen} />
  <g clipPath="url(#screenClip)">{children}</g>
</g>;

/** The thumb: a skin capsule from the palm up to the tip, with a nail, knuckle creases and a cyan cuff. */
export const Thumb: React.FC<{tip: {x: number; y: number}; press?: number; sweat?: {a: number; b: number; t: number}}> = ({tip, press = 0, sweat}) => {
  const vx = THUMB_ANCHOR.x - tip.x, vy = THUMB_ANCHOR.y - tip.y;
  const L = Math.hypot(vx, vy);
  const ang = (Math.atan2(-vx, vy) * 180) / Math.PI;
  const wd = 140 + press * 8;
  return <g>
    {/* sleeve + cuff */}
    <path d="M760 1920 L760 1700 Q900 1640 1110 1700 L1110 1920 Z" fill="#1D2438" stroke={C.paper} strokeWidth={6} strokeLinejoin="round" />
    <path d="M760 1740 Q930 1690 1110 1745 L1110 1810 Q930 1760 760 1810 Z" fill={C.cyan} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
    {/* palm */}
    <ellipse cx={THUMB_ANCHOR.x - 30} cy={THUMB_ANCHOR.y + 10} rx={200} ry={150} fill={C.skin} stroke={C.ink} strokeWidth={6} />
    <g transform={`translate(${tip.x} ${tip.y}) rotate(${ang})`}>
      <line x1={0} y1={0} x2={0} y2={L} stroke={C.ink} strokeWidth={wd + 12} strokeLinecap="round" />
      <line x1={0} y1={0} x2={0} y2={L} stroke={C.skin} strokeWidth={wd} strokeLinecap="round" />
      {/* nail */}
      <rect x={-40} y={18} width={80} height={96} rx={34} fill={C.nail} stroke={C.ink} strokeWidth={5} />
      <path d="M-22 40 Q-4 28 14 36" fill="none" stroke="#fff" strokeWidth={5} strokeLinecap="round" opacity={0.8} />
      {/* knuckle creases */}
      <path d="M-44 232 Q0 252 44 232 M-36 262 Q0 278 36 262" fill="none" stroke={C.skinDk} strokeWidth={7} strokeLinecap="round" />
      {sweat && <Sweat {...sweat} />}
    </g>
  </g>;
};

const Drop: React.FC<{x: number; y: number; s?: number; o?: number}> = ({x, y, s = 1, o = 1}) =>
  <path transform={`translate(${x} ${y}) scale(${s})`} opacity={o} d="M0 -30 C20 -4 24 16 0 22 C-24 16 -20 -4 0 -30 Z" fill={C.cyan} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />;

/** Sweat on the thumb (local coords: y along the thumb away from the tip). Sliding drops + a few flung off. */
const Sweat: React.FC<{a: number; b: number; t: number}> = ({a, b, t}) => {
  if (t < a || t > b + 0.4) return null;
  const k = Math.min(1, (t - a) / 0.2) * (1 - Math.max(0, (t - b) / 0.4));
  const drops = [[-38, 90, 0.0], [34, 150, 0.35], [-20, 210, 0.7], [44, 70, 0.55], [8, 130, 0.15]];
  return <g opacity={k}>
    {drops.map(([x, y, ph], i) => {
      const u = ((t - a) * 1.4 + ph) % 1;
      return <Drop key={i} x={x} y={y + u * 90} s={0.9 - 0.3 * u} o={1 - 0.6 * u} />;
    })}
    {[[-100, 20, -0.4], [100, 10, 0.4], [-120, 90, -0.6]].map(([x, y, dir], i) => {
      const u = ((t - a) * 2 + i * 0.3) % 1;
      return <Drop key={`f${i}`} x={x + dir * 60 * u} y={y + 70 * u} s={0.8} o={1 - u} />;
    })}
  </g>;
};
