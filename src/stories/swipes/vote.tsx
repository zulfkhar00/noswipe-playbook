import React from 'react';
import {clamp, easeOut, springIn} from '../../lib/motion';
import {C, F, RuleStrip, Svg} from './world';


const CARD = {w: 450, h: 600, y: 500, ax: 60, bx: 570};

const Hand: React.FC = () => <g>
  {[-38, -14, 10, 32].map((a, i) => <g key={i} transform={`rotate(${a} 0 0)`}><rect x={-13} y={-86 - (i === 1 || i === 2 ? 10 : 0)} width={26} height={90} rx={13} fill={C.skin} stroke={C.ink} strokeWidth={5} /></g>)}
  <g transform="rotate(-70)"><rect x={-13} y={-62} width={26} height={70} rx={13} fill={C.skin} stroke={C.ink} strokeWidth={5} /></g>
  <circle r={40} fill={C.skin} stroke={C.ink} strokeWidth={5} />
  <path d="M60 -80 Q84 -50 60 -20 M80 -96 Q112 -50 80 -4" fill="none" stroke={C.ink} strokeWidth={6} strokeLinecap="round" />
</g>;

const DrawA: React.FC = () => <g transform="translate(225 380)">
  <circle r={112} fill={C.gold} stroke={C.ink} strokeWidth={6} />
  <circle r={112} fill="#FFE08A" stroke={C.ink} strokeWidth={6} transform="translate(0 0)" opacity={0.0} />
  <circle r={78} fill="none" stroke="#C98F00" strokeWidth={8} />
  <path d="M-40 -20 A44 44 0 0 1 8 -52" fill="none" stroke="#FFF3B8" strokeWidth={8} strokeLinecap="round" />
  {/* a thumb coming in from above pressing down on the coin */}
  <g transform="rotate(22 0 -30)">
    <line x1={0} y1={-400} x2={0} y2={-30} stroke={C.ink} strokeWidth={122} strokeLinecap="round" />
    <line x1={0} y1={-400} x2={0} y2={-30} stroke={C.skin} strokeWidth={110} strokeLinecap="round" />
    <rect x={-34} y={-76} width={68} height={72} rx={28} fill={C.nail} stroke={C.ink} strokeWidth={5} />
    <path d="M-42 -190 Q0 -174 42 -190 M-36 -160 Q0 -146 36 -160" fill="none" stroke={C.skinDk} strokeWidth={6} strokeLinecap="round" />
  </g>
</g>;

const DrawB: React.FC = () => <g transform="translate(0 -44)">
  {/* phone sliding into a pocket */}
  <g transform="translate(140 400)">
    <rect x={-52} y={-130} width={104} height={190} rx={18} fill={C.phone} stroke={C.ink} strokeWidth={6} />
    <rect x={-42} y={-120} width={84} height={150} rx={10} fill={C.screen} />
    <path d="M-86 -20 L86 -20 L86 90 Q86 150 0 160 Q-86 150 -86 90 Z" fill="#3B5BDB" stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
    <path d="M-86 -20 L86 -20" stroke={C.paper} strokeWidth={5} strokeDasharray="12 9" transform="translate(0 12)" />
    <path d="M-70 4 L70 4" stroke={C.ink} strokeWidth={6} />
    <path d="M0 -176 L0 -146 M-16 -160 L0 -142 L16 -160" fill="none" stroke={C.ink} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
  </g>
  {/* a small wave and "hi" */}
  <g transform="translate(335 400) rotate(12) scale(0.9)"><Hand /></g>
  <g transform="translate(330 250)">
    <rect x={-62} y={-42} width={124} height={80} rx={26} fill={C.paper} stroke={C.ink} strokeWidth={6} />
    <path d="M-12 38 L-26 66 L16 38 Z" fill={C.paper} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
    <rect x={-20} y={34} width={36} height={8} fill={C.paper} />
    <text x={0} y={22} textAnchor="middle" fontFamily={F.anton} fontSize={64} fill={C.ink}>hi</text>
  </g>
</g>;

const VCard: React.FC<{x: number; letter: 'A' | 'B'; at: number; hl: number; t: number; fill: string; label: string}> = ({x, letter, at, hl, t, fill, label}) => {
  const on = t >= at;
  const pop = on ? springIn(t, at, 14) : 0;
  const hit = hl > 0 && t >= hl ? Math.max(0, 1 - (t - hl) / 0.5) : 0;
  const sc = 1 + 0.05 * hit;
  return <g transform={`translate(${x + CARD.w / 2} ${CARD.y + CARD.h / 2}) scale(${sc}) translate(${-CARD.w / 2} ${-CARD.h / 2})`}>
    <rect x={10} y={12} width={CARD.w} height={CARD.h} rx={40} fill={C.ink} />
    <rect width={CARD.w} height={CARD.h} rx={40} fill={on ? fill : '#171C2E'} stroke={hit > 0 ? C.paper : on ? C.ink : '#4A5372'} strokeWidth={on ? 6 + 4 * hit : 5} strokeDasharray={on ? undefined : '16 12'} />
    <text x={44} y={150} fontFamily={F.anton} fontSize={150} fill={on ? C.ink : '#4A5372'}>{letter}</text>
    {on && <g opacity={clamp(pop)} transform={`translate(${CARD.w / 2} 360) scale(${0.6 + 0.4 * pop}) translate(${-CARD.w / 2} -360)`}>
      <g clipPath="url(#cardClip)"><clipPath id="cardClip"><rect x={0} y={0} width={CARD.w} height={CARD.h} rx={40} /></clipPath>{letter === 'A' ? <DrawA /> : <DrawB />}</g>
    </g>}
    {on && <text x={CARD.w / 2} y={CARD.h - 40} textAnchor="middle" fontFamily={F.cond} fontWeight={700} fontSize={52} fill={C.ink}>{label}</text>}
  </g>;
};

/** Vote board: the question on top, two cards (A gold, B cyan). Cards fill in as the narration names them. */
export const VoteBoard: React.FC<{t: number; t0: number; tA: number; tB: number; hlA: number; hlB: number; tComment: number}> = ({t, t0, tA, tB, hlA, hlB, tComment}) => {
  const slide = 1 - easeOut(t, t0, t0 + 0.3);
  const cm = t >= tComment ? 1 + 0.06 * Math.sin((t - tComment) * 9) * Math.max(0, 1 - (t - tComment) / 1.6) : 1;
  return <Svg>
    <g transform={`translate(0 ${slide * 120})`} opacity={1 - slide * 0.8}>
      <RuleStrip text="what do you do?" y={330} age={t - t0} size={62} />
      {t >= tComment && <g transform={`translate(540 448) scale(${cm}) translate(-540 -448)`}><RuleStrip text="comment A or B" y={448} age={t - tComment} size={60} /></g>}
      <VCard x={CARD.ax} letter="A" at={tA} hl={hlA} t={t} fill={C.gold} label="use the last swipe" />
      <VCard x={CARD.bx} letter="B" at={tB} hl={hlB} t={t} fill={C.cyan} label="phone away, say hi" />
    </g>
  </Svg>;
};
