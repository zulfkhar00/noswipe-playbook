import React from 'react';
import {clamp, easeOut, springIn} from '../../lib/motion';
import {C, F, RuleStrip, Svg} from './world';

// Part 2 vote board: A = SPEND IT (thumb over a gold coin, red clock behind), B = LET IT EXPIRE (phone face down
// next to a cup, red clock). Both cards equally bold: A gold, B cyan, same size, same type.

const CARD = {w: 450, h: 600, y: 500, ax: 60, bx: 570};

const Clock: React.FC<{x: number; y: number; r: number}> = ({x, y, r}) => <g transform={`translate(${x} ${y})`}>
  <circle r={r} fill={C.paper} stroke={C.red} strokeWidth={12} />
  {Array.from({length: 12}, (_, i) => <line key={i} transform={`rotate(${i * 30})`} x1={0} y1={-r + 12} x2={0} y2={-r + (i % 3 === 0 ? 28 : 20)} stroke={C.ink} strokeWidth={4} />)}
  <line x1={0} y1={0} x2={0} y2={-r + 22} stroke={C.red} strokeWidth={8} strokeLinecap="round" />
  <line x1={0} y1={0} x2={-0.6 * r} y2={0} stroke={C.ink} strokeWidth={8} strokeLinecap="round" />
  <circle r={8} fill={C.ink} />
</g>;

const Pill: React.FC = () => <g transform="translate(180 70)"><rect x={6} y={6} width={240} height={96} rx={26} fill={C.ink} /><rect width={240} height={96} rx={26} fill={C.red} stroke={C.ink} strokeWidth={6} /><text x={120} y={74} textAnchor="middle" fontFamily={F.anton} fontSize={78} fill={C.paper}>6:00</text></g>

const DrawA: React.FC = () => <g>
  <Clock x={340} y={300} r={80} />
  <g transform="translate(150 255)">
    <rect x={6} y={8} width={170} height={210} rx={22} fill={C.ink} />
    <rect width={170} height={210} rx={22} fill={C.paper} stroke={C.ink} strokeWidth={6} />
    <circle cx={85} cy={70} r={36} fill={C.coral} stroke={C.ink} strokeWidth={5} />
    <rect x={40} y={118} width={90} height={70} rx={34} fill={C.cyan} stroke={C.ink} strokeWidth={5} />
  </g>
  <g fill="none" stroke={C.ink} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round"><path d="M350 380 L385 405 L350 430" /><path d="M392 380 L427 405 L392 430" /></g>
  <g transform="translate(170 330) rotate(18 0 -20)">
    <line x1={0} y1={-420} x2={0} y2={-20} stroke={C.ink} strokeWidth={118} strokeLinecap="round" />
    <line x1={0} y1={-420} x2={0} y2={-20} stroke={C.skin} strokeWidth={106} strokeLinecap="round" />
    <rect x={-32} y={-64} width={64} height={68} rx={26} fill={C.nail} stroke={C.ink} strokeWidth={5} />
  </g>
  <Pill />
</g>;

const DrawB: React.FC = () => <g>
  <Clock x={330} y={300} r={84} />
  {/* phone lying face down: its plain back with the camera corner */}
  <g transform="translate(120 400) rotate(-14)">
    <rect x={-62} y={-104} width={124} height={208} rx={22} fill="#06070B" opacity={0.5} transform="translate(6 7)" />
    <rect x={-62} y={-104} width={124} height={208} rx={22} fill="#0E1118" stroke={C.ink} strokeWidth={6} />
    <rect x={-48} y={-90} width={40} height={40} rx={11} fill="#1B2030" stroke={C.paper} strokeWidth={3} />
    <circle cx={-28} cy={-70} r={10} fill="#06070B" stroke={C.paper} strokeWidth={3} />
  </g>
  {/* cup */}
  <g transform="translate(330 400)">
    <path d="M-44 -70 L44 -70 L34 70 L-34 70 Z" fill={C.paper} stroke={C.ink} strokeWidth={7} strokeLinejoin="round" />
    <path d="M-40 -28 L40 -28 L36 22 L-36 22 Z" fill={C.coral} stroke={C.ink} strokeWidth={4} />
    <rect x={-50} y={-86} width={100} height={20} rx={10} fill={C.ink} />
    <path d="M-16 -104 C-30 -126 -2 -134 -14 -156 M16 -104 C2 -126 30 -134 18 -156" fill="none" stroke="#AEB4C6" strokeWidth={8} strokeLinecap="round" />
  </g>
  <Pill />
</g>;

const VCard: React.FC<{x: number; letter: 'A' | 'B'; at: number; hl: number; t: number; fill: string; label: string}> = ({x, letter, at, hl, t, fill, label}) => {
  const on = t >= at;
  const pop = on ? springIn(t * 60, at * 60, 14) : 0;
  const hit = hl > 0 && t >= hl ? Math.max(0, 1 - (t - hl) / 0.5) : 0;
  const sc = 1 + 0.05 * hit;
  const id = `vc${letter}`;
  return <g transform={`translate(${x + CARD.w / 2} ${CARD.y + CARD.h / 2}) scale(${sc}) translate(${-CARD.w / 2} ${-CARD.h / 2})`}>
    <rect x={10} y={12} width={CARD.w} height={CARD.h} rx={40} fill={C.ink} />
    <rect width={CARD.w} height={CARD.h} rx={40} fill={on ? fill : '#171C2E'} stroke={hit > 0 ? C.paper : on ? C.ink : '#4A5372'} strokeWidth={on ? 6 + 4 * hit : 5} strokeDasharray={on ? undefined : '16 12'} />
    <text x={44} y={150} fontFamily={F.anton} fontSize={150} fill={on ? C.ink : '#4A5372'}>{letter}</text>
    {on && <g opacity={clamp(pop)} transform={`translate(${CARD.w / 2} 360) scale(${0.6 + 0.4 * pop}) translate(${-CARD.w / 2} -360)`}>
      <clipPath id={id}><rect x={0} y={0} width={CARD.w} height={CARD.h} rx={40} /></clipPath>
      <g clipPath={`url(#${id})`}>{letter === 'A' ? <DrawA /> : <DrawB />}</g>
    </g>}
    {on && <text x={CARD.w / 2} y={CARD.h - 40} textAnchor="middle" fontFamily={F.cond} fontWeight={700} fontSize={56} fill={C.ink}>{label}</text>}
  </g>;
};

export const VoteBoard2: React.FC<{t: number; t0: number; tA: number; tB: number; tComment: number}> = ({t, t0, tA, tB, tComment}) => {
  const slide = 1 - easeOut(t, t0, t0 + 0.3);
  const cm = t >= tComment ? 1 + 0.06 * Math.sin((t - tComment) * 9) * Math.max(0, 1 - (t - tComment) / 1.6) : 1;
  return <Svg>
    <g transform={`translate(0 ${slide * 120})`} opacity={1 - slide * 0.8}>
      <RuleStrip text="swipe someone new, or stay and talk?" y={330} age={t - t0} size={54} />
      {t >= tComment && <g transform={`translate(540 448) scale(${cm}) translate(-540 -448)`}><RuleStrip text="comment A or B" y={448} age={t - tComment} size={60} /></g>}
      <VCard x={CARD.ax} letter="A" at={tA} hl={tA} t={t} fill={C.gold} label="SWIPE SOMEONE NEW" />
      <VCard x={CARD.bx} letter="B" at={tB} hl={tB} t={t} fill={C.cyan} label="LET IT EXPIRE" />
    </g>
  </Svg>;
};
