import React from 'react';
import {clamp, lerp, smooth} from '../../lib/motion';
import {C, F, outline} from './world';

// The coffee-shop queue, seen from behind your own position: sign COFFEE, counter, coffee machine, barista,
// rope posts, and three people in a line receding to the counter. The nearest is "her" (the person ahead of you).

export const HER = {x: 430, y: 1240, s: 1.3};
/** Her phone in world coords for raise progress p (0 = at her hip, 1 = held up at chest height). */
export const herPhone = (p: number) => {
  const lx = lerp(100, 140, p), ly = lerp(-60, -285, p);
  return {x: HER.x + lx * HER.s, y: HER.y + ly * HER.s, lx, ly};
};

const Steam: React.FC<{x: number; y: number; t: number}> = ({x, y, t}) => <g opacity={0.75}>
  {[0, 1].map((i) => {
    const u = ((t * 0.7 + i * 0.5) % 1);
    return <path key={i} transform={`translate(${x + (i ? 26 : -4)} ${y - u * 60})`} opacity={1 - u} d="M0 0 C-14 -16 14 -30 0 -46" fill="none" stroke="#C7CCDA" strokeWidth={8} strokeLinecap="round" />;
  })}
</g>;

const Back: React.FC<{x: number; y: number; s: number; body: string; hair: string; bun?: boolean; bag?: boolean; hat?: boolean; bob?: number; bow?: number}> = ({x, y, s, body, hair, bun, bag, hat, bob = 0, bow = 0}) =>
  <g transform={`translate(${x} ${y + bob}) scale(${s})`}>
    <rect x={-75} y={-190} width={150} height={190} rx={70} fill={body} {...outline()} />
    {bag && <g>
      <path d="M-50 -170 L40 -80" stroke={C.ink} strokeWidth={12} />
      <path d="M-50 -170 L40 -80" stroke={C.cyan} strokeWidth={6} />
      <rect x={20} y={-90} width={64} height={70} rx={10} fill={C.cyan} stroke={C.ink} strokeWidth={6} />
    </g>}
    {bow > 0 && <g transform="translate(-92 -120)">
      <circle cx={0} cy={0} r={46} fill={C.cyan} opacity={0.25} />
      <rect x={-17} y={-30} width={34} height={60} rx={8} fill={C.phone} stroke={C.paper} strokeWidth={4} />
      <rect x={-11} y={-23} width={22} height={46} rx={5} fill={C.cyan} />
    </g>}
    <circle cx={0} cy={-250 + 16 * bow} r={60} fill={hair} {...outline()} />
    {bun && <circle cx={0} cy={-318 + 16 * bow} r={26} fill={hair} {...outline()} />}
    {hat && <path d="M-62 -262 A62 62 0 0 1 62 -262 Z" fill={C.gold} stroke={C.ink} strokeWidth={5} />}
  </g>;

/** Her phone: our own design; the screen shows her own chip: SWIPES LEFT, a big red 1, one lit pip. */
export const HerPhone: React.FC = () => <g>
  <rect x={-67} y={-112} width={134} height={236} rx={22} fill="#06070B" opacity={0.5} transform="translate(5 6)" />
  <rect x={-65} y={-115} width={130} height={230} rx={22} fill={C.phone} stroke={C.paper} strokeWidth={4} />
  <rect x={-57} y={-107} width={114} height={214} rx={16} fill={C.ink2} stroke={C.red} strokeWidth={4} />
  <text x={0} y={-66} textAnchor="middle" fontFamily={F.cond} fontWeight={700} fontSize={21} fill={C.red} letterSpacing={1}>SWIPES LEFT</text>
  <text x={0} y={52} textAnchor="middle" fontFamily={F.anton} fontSize={140} fill={C.red}>1</text>
  {Array.from({length: 10}, (_, i) => <circle key={i} cx={-45 + i * 10} cy={86} r={3.6} fill={i === 0 ? C.red : 'none'} stroke={i === 0 ? C.ink : '#3A4260'} strokeWidth={1.5} />)}
</g>;

const Her: React.FC<{t: number; turn: number; raise: number; smile: number}> = ({t, turn, raise, smile}) => {
  const prog = clamp((t - turn) / 0.4);
  const front = prog > 0.5;
  const sx = Math.max(0.04, Math.abs(Math.cos(prog * Math.PI)));
  const bob = Math.sin(t * 2.2) * 3;
  const p = smooth(t, raise, raise + 0.35);
  const ph = herPhone(p);
  const hand = {x: ph.lx - 6, y: ph.ly + 70};
  return <g transform={`translate(${HER.x} ${HER.y + bob}) scale(${HER.s * sx} ${HER.s})`}>
    {!front ? <Back x={0} y={0} s={1} body={C.coral} hair={C.hair} bun bag bow={1} /> : <g>
      {/* hanging arm (our left) */}
      <path d="M-62 -150 Q-96 -90 -86 -40" fill="none" stroke={C.ink} strokeWidth={46} strokeLinecap="round" />
      <path d="M-62 -150 Q-96 -90 -86 -40" fill="none" stroke={C.coral} strokeWidth={34} strokeLinecap="round" />
      <rect x={-75} y={-190} width={150} height={190} rx={70} fill={C.coral} {...outline()} />
      <circle cx={0} cy={-250} r={60} fill="#F6E2D0" {...outline()} />
      <path d="M-60 -256 A60 60 0 0 1 60 -256 C36 -282 -36 -282 -60 -256 Z" fill={C.hair} />
      <circle cx={0} cy={-250} r={60} fill="none" {...outline()} />
      <circle cx={0} cy={-318} r={26} fill={C.hair} {...outline()} />
      {smile > 0 && <path d={`M-26 ${-236} Q0 ${-236 + 26 * smile} 26 ${-236}`} fill="none" stroke={C.ink} strokeWidth={8} strokeLinecap="round" />}
      {/* raised arm with her phone: her own choice to show it */}
      <path d={`M62 -150 Q${lerp(100, 160, p)} ${lerp(-110, -170, p)} ${hand.x} ${hand.y}`} fill="none" stroke={C.ink} strokeWidth={46} strokeLinecap="round" />
      <path d={`M62 -150 Q${lerp(100, 160, p)} ${lerp(-110, -170, p)} ${hand.x} ${hand.y}`} fill="none" stroke={C.coral} strokeWidth={34} strokeLinecap="round" />
      <circle cx={hand.x} cy={hand.y} r={20} fill="#F6E2D0" {...outline()} />
      <g transform={`translate(${ph.lx} ${ph.ly})`}><HerPhone /></g>
    </g>}
  </g>;
};

export const Queue: React.FC<{t: number; turn: number; raise: number; smile: number}> = ({t, turn, raise, smile}) => {
  const wave = Math.sin(t * 3) * 0.5;
  return <g>
    {/* wall and floor */}
    <rect x={-20} y={0} width={1120} height={860} fill={C.wall} />
    <rect x={-20} y={860} width={1120} height={1100} fill={C.floor} />
    <rect x={-20} y={852} width={1120} height={10} fill={C.gold} opacity={0.55} />
    {[-700, -250, 150, 540, 930, 1330, 1780].map((x, i) => <line key={i} x1={540 + (x - 540) * 0.12} y1={862} x2={x} y2={1960} stroke="#1F2740" strokeWidth={5} />)}
    {/* sign: COFFEE */}
    <g>
      <line x1={680} y1={200} x2={680} y2={310} stroke={C.paper} strokeWidth={5} />
      <line x1={950} y1={200} x2={950} y2={310} stroke={C.paper} strokeWidth={5} />
      <rect x={598} y={312} width={420} height={130} rx={22} fill={C.ink} />
      <rect x={590} y={304} width={420} height={130} rx={22} fill={C.gold} stroke={C.ink} strokeWidth={6} />
      <text x={826} y={398} textAnchor="middle" fontFamily={F.anton} fontSize={96} fill={C.ink} letterSpacing={4}>COFFEE</text>
      <g transform="translate(646 372)"><path d="M-26 -24 L26 -24 L20 28 L-20 28 Z" fill={C.paper} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" /><path d="M26 -14 Q48 -12 44 6 Q40 18 22 16" fill="none" stroke={C.ink} strokeWidth={5} /></g>
    </g>
    {/* barista (bean, no face) behind the counter */}
    <g transform={`translate(660 ${700 + wave})`}>
      <rect x={-62} y={-60} width={124} height={140} rx={56} fill={C.cyan} {...outline()} />
      <circle cx={0} cy={-100} r={46} fill="#F6E2D0" {...outline()} />
      <path d="M-46 -104 A46 46 0 0 1 46 -104 C26 -122 -26 -122 -46 -104 Z" fill={C.ink} />
      <rect x={-34} y={-30} width={68} height={70} rx={14} fill={C.paper} stroke={C.ink} strokeWidth={5} />
    </g>
    {/* counter with the coffee machine */}
    <g>
      <g transform="translate(790 610)">
        <rect x={0} y={0} width={230} height={100} rx={14} fill={C.paper} stroke={C.ink} strokeWidth={6} />
        <rect x={-6} y={-30} width={242} height={40} rx={20} fill={C.gold} stroke={C.ink} strokeWidth={6} />
        <rect x={20} y={20} width={60} height={26} rx={6} fill={C.ink} />
        <circle cx={190} cy={36} r={13} fill={C.red} stroke={C.ink} strokeWidth={4} />
        <circle cx={150} cy={36} r={13} fill={C.cyan} stroke={C.ink} strokeWidth={4} />
        <rect x={50} y={52} width={14} height={36} fill={C.ink} />
        <rect x={110} y={52} width={14} height={36} fill={C.ink} />
        <path d="M32 100 L32 114 L100 114 L100 100" fill="none" stroke={C.ink} strokeWidth={6} />
        <Steam x={57} y={50} t={t} />
      </g>
      <rect x={300} y={700} width={780} height={160} fill={C.cyan} stroke={C.ink} strokeWidth={6} />
      <rect x={284} y={690} width={810} height={30} rx={8} fill={C.coral} stroke={C.ink} strokeWidth={6} />
      <g transform="translate(400 690)"><path d="M-22 -50 L22 -50 L17 0 L-17 0 Z" fill={C.paper} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" /><Steam x={0} y={-52} t={t + 0.3} /></g>
    </g>
    {/* rope posts along the queue line */}
    {[[150, 1250, 1.2], [250, 1040, 0.95], [330, 900, 0.75]].map(([x, y, s], i, a) => <g key={i}>
      {i > 0 && <path d={`M${a[i - 1][0]} ${a[i - 1][1] - 120 * a[i - 1][2]} Q${(x + a[i - 1][0]) / 2} ${(y + a[i - 1][1]) / 2 - 80 * s + 20} ${x} ${y - 120 * s}`} fill="none" stroke={C.gold} strokeWidth={8} strokeLinecap="round" />}
      <g transform={`translate(${x} ${y}) scale(${s})`}>
        <ellipse cx={0} cy={0} rx={44} ry={12} fill={C.ink} stroke={C.paper} strokeWidth={4} />
        <rect x={-8} y={-130} width={16} height={130} fill={C.paper} stroke={C.ink} strokeWidth={4} />
        <circle cx={0} cy={-132} r={14} fill={C.gold} stroke={C.ink} strokeWidth={4} />
      </g>
    </g>)}
    {/* the line: back to front */}
    <Back x={700} y={884} s={0.6} body={C.paper} hair={C.ink} />
    <Back x={610} y={1010} s={0.82} body={C.cyan} hair="#5B3B2A" hat bob={Math.sin(t * 2 + 1) * 2} />
    <Her t={t} turn={turn} raise={raise} smile={smile} />
  </g>;
};
