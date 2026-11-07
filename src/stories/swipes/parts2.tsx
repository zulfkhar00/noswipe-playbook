import React from 'react';
import {clamp, easeOut, lerp, smooth, springIn} from '../../lib/motion';
import {C, F, outline, Txt} from './world';
import {HerPhone, HER} from './queue';

// Part 2 pieces: her (front/back, phone, gesture arm), the table and chair, speech bubbles, clock chip,
// match card, buzz card, draft field and the coin rewind. Everything is a pure function of time.

const SKIN = '#F6E2D0';
export const S = HER.s;
/** local (her coordinates) from world */
export const loc = (wx: number, wy: number) => ({x: (wx - HER.x) / S, y: (wy - HER.y) / S});

// ---------------------------------------------------------------------------------------- furniture
export const TABLE = {x: 850, floor: 1262, top: 1136};
export const CHAIR = {x0: 698, x1: 648, seat: 1192};
/** The cafe table with her cup. */
export const Table: React.FC<{t: number; cupAt: number}> = ({t, cupAt}) => {
  const pop = t >= cupAt ? springIn(t * 60, cupAt * 60, 18) : 1;
  const u = ((t * 0.7) % 1);
  return <g>
    <ellipse cx={TABLE.x} cy={TABLE.floor} rx={64} ry={14} fill={C.ink} stroke={C.paper} strokeWidth={5} />
    <rect x={TABLE.x - 9} y={TABLE.top} width={18} height={TABLE.floor - TABLE.top} fill={C.ink2} stroke={C.paper} strokeWidth={5} />
    <rect x={TABLE.x - 100} y={TABLE.top - 18} width={200} height={26} rx={13} fill={C.paper} stroke={C.ink} strokeWidth={6} />
    <g transform={`translate(${TABLE.x + 20} ${TABLE.top - 18}) scale(${1.5 * pop})`}>
      <path d="M-24 -62 L24 -62 L18 0 L-18 0 Z" fill={C.paper} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
      <path d="M-22 -36 L22 -36 L20 -16 L-20 -16 Z" fill={C.coral} stroke={C.ink} strokeWidth={3} />
      <rect x={-27} y={-72} width={54} height={12} rx={6} fill={C.ink} />
      {[0, 1].map((i) => { const v = (u + i * 0.5) % 1; return <path key={i} transform={`translate(${i ? 12 : -10} ${-80 - v * 44})`} opacity={1 - v} d="M0 0 C-12 -14 12 -26 0 -40" fill="none" stroke="#C7CCDA" strokeWidth={7} strokeLinecap="round" />; })}
    </g>
  </g>;
};

export const Chair: React.FC<{x: number}> = ({x}) => <g transform={`translate(${x} 0)`}>
  {/* back leg and front leg, seat, backrest on the side facing her (the chair faces the table) */}
  <rect x={-40} y={CHAIR.seat} width={16} height={1262 - CHAIR.seat} rx={5} fill={C.gold} stroke={C.ink} strokeWidth={5} />
  <rect x={44} y={CHAIR.seat} width={16} height={1262 - CHAIR.seat} rx={5} fill={C.gold} stroke={C.ink} strokeWidth={5} />
  <rect x={-52} y={CHAIR.seat - 120} width={22} height={126} rx={10} fill={C.gold} stroke={C.ink} strokeWidth={6} />
  <rect x={-52} y={CHAIR.seat - 8} width={116} height={22} rx={10} fill={C.gold} stroke={C.ink} strokeWidth={6} />
</g>;

export const Bag: React.FC<{x: number; y: number; rot?: number; strap?: boolean}> = ({x, y, rot = 0}) => <g transform={`translate(${x} ${y}) rotate(${rot})`}>
  <path d="M-20 -30 C-20 -64 22 -64 22 -30" fill="none" stroke={C.ink} strokeWidth={11} />
  <path d="M-20 -30 C-20 -64 22 -64 22 -30" fill="none" stroke={C.paper} strokeWidth={5} />
  <rect x={-38} y={-34} width={76} height={68} rx={12} fill={C.cyan} stroke={C.ink} strokeWidth={6} />
  <rect x={-38} y={-14} width={76} height={8} fill={C.ink} opacity={0.25} />
</g>;

// ---------------------------------------------------------------------------------------- her
export type HerPose = {
  front: boolean; smile: number; nod: number;
  phoneP: number; flip: number;           // phone raise 0..1, flip angle 0..1 (1 = face down)
  hand?: {x: number; y: number; open: number} | null; // right-hand target in local coords (null = hanging)
  bag: number;                             // 0 = on the chair, 1 = on her hip (strap on)
  bagWorld?: {x: number; y: number} | null; // while carried
  cup?: number; // back view: cup in her hand 0..1
};

const PhoneBack: React.FC = () => <g>
  <rect x={-67} y={-112} width={134} height={236} rx={22} fill="#06070B" opacity={0.5} transform="translate(5 6)" />
  <rect x={-65} y={-115} width={130} height={230} rx={22} fill="#0E1118" stroke={C.paper} strokeWidth={4} />
  <rect x={-50} y={-100} width={42} height={42} rx={12} fill="#1B2030" stroke={C.paper} strokeWidth={3} />
  <circle cx={-29} cy={-79} r={11} fill="#06070B" stroke={C.paper} strokeWidth={3} />
</g>;

const Hand: React.FC<{x: number; y: number; open: number; ang: number}> = ({x, y, open, ang}) => <g transform={`translate(${x} ${y}) rotate(${ang})`}>
  {/* simple rounded mitt: the palm grows into an open mitt with a thumb bump */}
  <ellipse cx={0} cy={-14 * open} rx={22 + 8 * open} ry={22 + 12 * open} fill={SKIN} {...outline(C.ink, 5)} />
  {open > 0.01 && <ellipse cx={-26 * open} cy={-4 * open} rx={9 * open} ry={14 * open} fill={SKIN} {...outline(C.ink, 4)} />}
</g>;

export const HerFig: React.FC<{pose: HerPose; t: number}> = ({pose, t}) => {
  const bob = Math.sin(t * 2.2) * 3;
  const {front, smile, nod, phoneP, flip, hand, bag} = pose;
  // left (screen-left) arm holds her phone
  const ph = {x: lerp(-96, -150, phoneP), y: lerp(-75, -270, phoneP)};
  const hold = {x: ph.x + 4, y: ph.y + 70};
  const ang = flip * 180;
  const sx = Math.cos((ang * Math.PI) / 180);
  const phScale = 0.66 + 0.12 * phoneP;
  const hx = hand ? hand.x : 92, hy = hand ? hand.y : -48;
  const open = hand ? hand.open : 0;
  const mid = {x: lerp(62, hx, 0.5) + (hand ? 6 : 30), y: lerp(-150, hy, 0.5) + 26};
  const armAng = (Math.atan2(hy - -150, hx - 62) * 180) / Math.PI + 90;
  return <g transform={`translate(${HER.x} ${HER.y + bob}) scale(${S})`}>
    {!front ? <g>
      <rect x={-75} y={-190} width={150} height={190} rx={70} fill={C.coral} {...outline()} />
      <circle cx={0} cy={-250} r={60} fill={C.hair} {...outline()} />
      <circle cx={0} cy={-318} r={26} fill={C.hair} {...outline()} />
      {(pose.cup ?? 0) > 0 && <g transform={`scale(${pose.cup})`}>
        <path d="M62 -150 Q112 -150 108 -112" fill="none" stroke={C.ink} strokeWidth={46} strokeLinecap="round" />
        <path d="M62 -150 Q112 -150 108 -112" fill="none" stroke={C.coral} strokeWidth={34} strokeLinecap="round" />
        <g transform="translate(112 -128)">
          <path d="M-26 -50 L26 -50 L20 18 L-20 18 Z" fill={C.paper} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
          <path d="M-24 -26 L24 -26 L22 -6 L-22 -6 Z" fill={C.coral} stroke={C.ink} strokeWidth={3} />
          <rect x={-30} y={-60} width={60} height={12} rx={6} fill={C.ink} />
        </g>
        <circle cx={108} cy={-108} r={20} fill={SKIN} {...outline(C.ink, 5)} />
      </g>}
    </g> : <g>
      {/* phone arm */}
      <path d={`M-62 -150 Q${lerp(-96, -120, phoneP)} ${lerp(-90, -170, phoneP)} ${hold.x} ${hold.y}`} fill="none" stroke={C.ink} strokeWidth={46} strokeLinecap="round" />
      <path d={`M-62 -150 Q${lerp(-96, -120, phoneP)} ${lerp(-90, -170, phoneP)} ${hold.x} ${hold.y}`} fill="none" stroke={C.coral} strokeWidth={34} strokeLinecap="round" />
      <rect x={-75} y={-190} width={150} height={190} rx={70} fill={C.coral} {...outline()} />
      {bag > 0.99 && <g>
        <path d="M-52 -176 L80 -70" stroke={C.ink} strokeWidth={14} />
        <path d="M-52 -176 L80 -70" stroke={C.cyan} strokeWidth={7} />
        <Bag x={92} y={-48} rot={-6} />
      </g>}
      <g transform={`translate(0 ${6 * nod}) rotate(${-4 * nod} 0 -190)`}>
        <circle cx={0} cy={-250} r={60} fill={SKIN} {...outline()} />
        <path d="M-60 -256 A60 60 0 0 1 60 -256 C36 -282 -36 -282 -60 -256 Z" fill={C.hair} />
        <circle cx={0} cy={-250} r={60} fill="none" {...outline()} />
        <circle cx={0} cy={-318} r={26} fill={C.hair} {...outline()} />
        {smile > 0 && <path d={`M-24 -234 Q0 ${-234 + 34 * smile} 24 -234`} fill="none" stroke={C.ink} strokeWidth={9} strokeLinecap="round" />}
      </g>
      {/* gesture arm */}
      <path d={`M62 -150 Q${mid.x} ${mid.y} ${hx} ${hy}`} fill="none" stroke={C.ink} strokeWidth={46} strokeLinecap="round" />
      <path d={`M62 -150 Q${mid.x} ${mid.y} ${hx} ${hy}`} fill="none" stroke={C.coral} strokeWidth={34} strokeLinecap="round" />
      <Hand x={hx} y={hy} open={open} ang={armAng} />
      {/* the phone, in the other hand */}
      <g transform={`translate(${ph.x} ${ph.y}) scale(${phScale * Math.max(0.04, Math.abs(sx))} ${phScale})`}>{sx >= 0 ? <HerPhone /> : <PhoneBack />}</g>
      <circle cx={hold.x} cy={ph.y + 112 * phScale - 4} r={20} fill={SKIN} {...outline(C.ink, 5)} />
    </g>}
  </g>;
};

// ---------------------------------------------------------------------------------------- bubbles
export const Bubble: React.FC<{x: number; y: number; w: number; h: number; lines: string[]; size?: number; tail: {x: number; y: number}; label: string; labelFill: string; age: number; out?: number}> = ({x, y, w, h, lines, size = 50, tail, label, labelFill, age, out = 0}) => {
  const sc = springIn(age * 60, 0, 9);
  const tx = clamp(tail.x, x + 40, x + w - 40);
  return <g opacity={(1 - out) * clamp(age / 0.05 + 0.2)} transform={`translate(${x + w / 2} ${y + h}) scale(${sc}) translate(${-(x + w / 2)} ${-(y + h)})`}>
    <rect x={x + 8} y={y + 8} width={w} height={h} rx={34} fill={C.ink} />
    <path d={`M${tx - 26} ${y + h - 4} L${tail.x} ${tail.y} L${tx + 22} ${y + h - 4} Z`} fill={C.paper} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
    <rect x={x} y={y} width={w} height={h} rx={34} fill={C.paper} stroke={C.ink} strokeWidth={6} />
    <rect x={tx - 22} y={y + h - 10} width={44} height={14} fill={C.paper} />
    {lines.map((l, i) => <text key={i} x={x + w / 2} y={y + 24 + size * 0.92 + i * size * 1.08} textAnchor="middle" fontFamily={F.inter} fontWeight={800} fontSize={size} fill={C.ink}>{l}</text>)}
    <g transform={`translate(${x + 16} ${y - 26})`}>
      <rect x={0} y={0} width={label.length * 20 + 30} height={42} rx={14} fill={labelFill} stroke={C.ink} strokeWidth={5} />
      <text x={(label.length * 20 + 30) / 2} y={32} textAnchor="middle" fontFamily={F.cond} fontWeight={800} fontSize={34} letterSpacing={2} fill={C.ink}>{label}</text>
    </g>
  </g>;
};

// ---------------------------------------------------------------------------------------- clock chip
export const CLOCK = {x: 640, y: 335, w: 370, h: 124};
export const ClockChip: React.FC<{text: string; age: number; pulse: number}> = ({text, age, pulse}) => {
  const {x, y, w, h} = CLOCK;
  const sc = (0.6 + 0.4 * springIn(age * 60, 0, 10)) * (1 + 0.1 * pulse);
  const ang = ((text === '5:59' ? 354 : 330) * Math.PI) / 180;
  return <g opacity={clamp(age / 0.06)} transform={`translate(${x + w / 2} ${y + h / 2}) scale(${sc}) translate(${-(x + w / 2)} ${-(y + h / 2)})`}>
    <rect x={x + 8} y={y + 8} width={w} height={h} rx={26} fill={C.ink} />
    <rect x={x} y={y} width={w} height={h} rx={26} fill={C.ink2} stroke={C.red} strokeWidth={6} />
    <g transform={`translate(${x + 64} ${y + h / 2})`}>
      <circle r={42} fill={C.paper} stroke={C.red} strokeWidth={6} />
      <line x1={0} y1={0} x2={0} y2={-28} stroke={C.ink} strokeWidth={6} strokeLinecap="round" />
      <line x1={0} y1={0} x2={26 * Math.sin(ang)} y2={-26 * Math.cos(ang)} stroke={C.red} strokeWidth={6} strokeLinecap="round" />
    </g>
    <text x={x + 130} y={y + 36} fontFamily={F.cond} fontWeight={800} fontSize={30} letterSpacing={3} fill={C.paper}>NOW</text>
    <Txt x={x + 126} y={y + 108} size={70} font={F.anton} weight={400} fill={C.red} anchor="start">{text}</Txt>
  </g>;
};

// ---------------------------------------------------------------------------------------- phone cards
/** MATCH card: burst + two heads, our own design. */
export const MatchCard: React.FC<{age: number}> = ({age}) => {
  const k = springIn(age * 60, 0, 12);
  return <g>
    <rect x={10} y={12} width={580} height={470} rx={40} fill={C.ink} />
    <rect width={580} height={470} rx={40} fill={C.gold} stroke={C.ink} strokeWidth={6} />
    <g transform="translate(290 235)">
      {Array.from({length: 14}, (_, i) => <path key={i} transform={`rotate(${i * (360 / 14)})`} d={`M-16 -80 L0 ${-170 - 50 * k} L16 -80 Z`} fill="#FFE08A" />)}
      <circle r={90} fill={C.paper} stroke={C.ink} strokeWidth={6} />
      <g transform="translate(-40 -8)"><circle r={44} fill={SKIN} stroke={C.ink} strokeWidth={5} /><path d="M-44 -4 A44 44 0 0 1 44 -4 C24 -22 -24 -22 -44 -4 Z" fill={C.hair} /><circle cy={-52} r={20} fill={C.hair} stroke={C.ink} strokeWidth={4} /></g>
      <g transform="translate(40 8)"><circle r={44} fill={C.cyan} stroke={C.ink} strokeWidth={5} /></g>
    </g>
    <Txt x={290} y={452} size={110} font={F.anton} weight={400} fill={C.ink} spacing={6}>MATCH</Txt>
  </g>;
};

/** LAST SWIPE EXPIRES 6:00, big and plain. */
export const BuzzCard: React.FC<{age: number}> = ({age}) => {
  const shake = age < 0.7 ? Math.sin(age * 90) * 7 * (1 - age / 0.7) : 0;
  return <g transform={`translate(${shake} 0)`}>
    <rect x={10} y={12} width={580} height={470} rx={40} fill={C.ink} />
    <rect width={580} height={470} rx={40} fill={C.ink2} stroke={C.red} strokeWidth={10} />
    <text x={290} y={112} textAnchor="middle" fontFamily={F.anton} fontSize={92} fill={C.gold}>LAST SWIPE</text>
    <text x={290} y={190} textAnchor="middle" fontFamily={F.anton} fontSize={66} fill={C.paper} letterSpacing={3}>EXPIRES AT</text>
    <text x={290} y={410} textAnchor="middle" fontFamily={F.anton} fontSize={210} fill={C.red}>6:00</text>
  </g>;
};

/** Message field: "hey" typed one letter at a time, then deleted one letter at a time. */
export const Draft: React.FC<{t: number; type0: number; del0: number; show: number}> = ({t, type0, del0, show}) => {
  const typed = t < del0 ? clamp(Math.floor((t - type0) / 0.07) + 1, 0, 3) : 3 - clamp(Math.floor((t - del0) / 0.07) + 1, 0, 3);
  const txt = 'hey'.slice(0, typed);
  const caret = Math.floor(t * 4) % 2 === 0;
  return <g opacity={show} transform={`translate(0 ${(1 - show) * 40})`}>
    <rect x={8} y={8} width={580} height={110} rx={55} fill={C.ink} />
    <rect width={580} height={110} rx={55} fill={C.paper} stroke={C.ink} strokeWidth={6} />
    <text x={44} y={80} fontFamily={F.inter} fontWeight={800} fontSize={72} fill={C.ink}>{txt}{caret && <tspan fill={C.cyan}>|</tspan>}</text>
  </g>;
};

// ---------------------------------------------------------------------------------------- stamp
/** RULE 1 stamp: big, two lines, slams in. Never placed over a figure. */
export const StampBig: React.FC<{y: number; age: number; out?: number}> = ({y, age, out = 0}) => {
  const sl = Math.max(0, 1 - age / 0.14);
  const sc = 1 + 0.8 * sl;
  const w = 860, h = 220;
  return <g opacity={(1 - out) * clamp(age / 0.05 + 0.2)} transform={`translate(540 ${y}) rotate(-2) scale(${sc}) translate(-540 ${-y})`}>
    <rect x={540 - w / 2 + 10} y={y - h / 2 + 10} width={w} height={h} rx={10} fill={C.ink} />
    <rect x={540 - w / 2} y={y - h / 2} width={w} height={h} rx={10} fill={C.paper} stroke={C.ink} strokeWidth={8} />
    <rect x={540 - w / 2 + 14} y={y - h / 2 + 14} width={w - 28} height={h - 28} rx={5} fill="none" stroke={C.red} strokeWidth={6} />
    <text x={540} y={y - 6} textAnchor="middle" fontFamily={F.mono} fontWeight={700} fontSize={110} fill={C.red}>RULE 1</text>
    <text x={540} y={y + 70} textAnchor="middle" fontFamily={F.mono} fontWeight={700} fontSize={78} fill={C.ink}>NO GOING BACK</text>
  </g>;
};

// ---------------------------------------------------------------------------------------- coin rewind
const R_MAX = 1340;
const SLOT_Y = 1200;
/** Reverse of CoinDrop: a gold disc grows over the shot and holds (double left chevron + REWIND), coins fly back UP
 * out of the slot, then the disc shrinks away (swap under the disc at t0 + 0.5). */
export const CoinRewind: React.FC<{t: number; t0: number}> = ({t, t0}) => {
  const grow = easeOut(t, t0, t0 + 0.25);
  const shrink = smooth(t, t0 + 0.55, t0 + 0.85);
  const r = t < t0 + 0.5 ? R_MAX * grow : R_MAX * (1 - shrink);
  const coins = [150, 300, 440, 600, 760, 900, 540].map((x, i) => {
    const f = clamp((t - (t0 + 0.12 + i * 0.045)) / 0.55);
    const y = 1500 - 1750 * (1 - (1 - f) * (1 - f));
    return {x, y, f, i};
  });
  return <g>
    {r > 1 && <g>
      <circle cx={540} cy={SLOT_Y} r={r} fill={C.gold} />
      <circle cx={540} cy={SLOT_Y} r={Math.max(0, r - 18)} fill="none" stroke="#C98F00" strokeWidth={6} />
      {r > 700 && <g>
        {[0.35, 0.62].map((k) => <circle key={k} cx={540} cy={SLOT_Y} r={r * k} fill="none" stroke="#C98F00" strokeWidth={5} strokeDasharray="30 22" opacity={0.6} />)}
        <g stroke={C.ink} strokeWidth={14} strokeLinejoin="round" fill={C.ink}>
          <path d="M540 800 L720 690 L720 910 Z" /><path d="M360 800 L540 690 L540 910 Z" />
        </g>
        <text x={540} y={1130} textAnchor="middle" fontFamily={F.anton} fontSize={190} letterSpacing={6} fill={C.ink}>REWIND</text>
      </g>}
    </g>}
    {coins.map(({x, y, f, i}) => f > 0 && f < 1 && <g key={i}>
      {[3, 2, 1].map((k) => <circle key={k} cx={x} cy={y + 60 * k} r={36} fill="#FFE08A" stroke={C.ink} strokeWidth={4} opacity={0.18 * (4 - k)} />)}
      <g transform={`translate(${x} ${y}) scale(${Math.cos((t - t0) * 18 + i)} 1)`}><circle r={46} fill={C.gold} stroke={C.ink} strokeWidth={6} /><circle r={31} fill="none" stroke="#C98F00" strokeWidth={5} /></g>
    </g>)}
  </g>;
};
