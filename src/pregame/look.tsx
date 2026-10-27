import React from 'react';
import {AbsoluteFill} from 'remotion';
import {clamp, easeOut, hold, lerp} from '../lib/motion';

// The Pre-Game look (Format 2): a prime-time sports broadcast. Deep navy, electric blue and
// scoreboard yellow; slanted bars with a glossy shine; heavy condensed italic type; yellow
// telestrator ink with a glow; a stinger wipe between shots. Only the NoSwipe turn and the end
// card use the noswipe.app brand look. Everything here is screen space, inside the ad-safe band.

export const PT = {
  navy: '#060F26', deep: '#0B1D45', blue: '#1E6BFF', cyan: '#3FD0FF', yellow: '#FFD21F', red: '#E8233A', green: '#2BD67B',
  white: '#F4F7FF', steel: '#9FB0D6', ink: '#03081A',
};
export const COND = "'Avenir Next Condensed', 'Futura Condensed ExtraBold', 'Helvetica Neue', Impact, sans-serif";

const SK = -14;   // the house slant, in degrees

/** A slanted bar with a top-to-bottom gradient and an optional shine sweep. */
export const Bar: React.FC<{x: number; y: number; w: number; h: number; from: string; to: string; shine?: number; id: string; children?: React.ReactNode}> =
  ({x, y, w, h, from, to, shine = -1, id, children}) => <g transform={`translate(${x} ${y})`}>
    <defs>
      <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={from} /><stop offset="1" stopColor={to} /></linearGradient>
      <linearGradient id={`${id}-s`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#fff" stopOpacity={0} /><stop offset="0.5" stopColor="#fff" stopOpacity={0.45} /><stop offset="1" stopColor="#fff" stopOpacity={0} /></linearGradient>
      <clipPath id={`${id}-c`}><rect width={w} height={h} transform={`skewX(${SK})`} /></clipPath>
    </defs>
    <rect width={w} height={h} fill={`url(#${id}-g)`} transform={`skewX(${SK})`} />
    <rect width={w} height={h * 0.45} fill="#fff" opacity={0.08} transform={`skewX(${SK})`} />
    {shine >= 0 && shine <= 1 && <g clipPath={`url(#${id}-c)`}><rect x={-160 + (w + 320) * shine} y={0} width={140} height={h} fill={`url(#${id}-s)`} /></g>}
    {children}
  </g>;

const Svg: React.FC<{children: React.ReactNode; opacity?: number}> = ({children, opacity = 1}) =>
  <AbsoluteFill style={{opacity, pointerEvents: 'none'}}><svg width={1080} height={1920}>{children}</svg></AbsoluteFill>;

/** Shine position for a sweep that repeats every `period` seconds. */
const sweep = (t: number, period = 5, offset = 0) => ((t + offset) % period) / 0.9;

export type ScoreState = {at: number; clock: string; values: [string, string]; bad?: boolean; good?: boolean};

/** The score bug: LIVE, two joke stats, the clock. A value that changes flashes yellow. */
export const ScoreBug: React.FC<{t: number; labels: [string, string]; states: ScoreState[]; k?: number}> = ({t, labels, states, k = 1}) => {
  if (k <= 0.01) return null;
  let i = 0;
  while (i + 1 < states.length && t >= states[i + 1].at) i++;
  const s = states[i];
  const flash = i > 0 ? 1 - clamp((t - s.at) / 0.6) : 0;
  const y = 300;
  const slideIn = easeOut(k, 0, 1);
  return <Svg opacity={k}>
    <g transform={`translate(${(1 - slideIn) * -300} 0)`}>
      <Bar x={70} y={y} w={150} h={96} from={PT.red} to="#9E0F22" id="sb-live">
        <circle cx={28} cy={48} r={10} fill={PT.white} opacity={Math.floor(t * 2) % 2 ? 1 : 0.3} />
        <text x={46} y={64} fontFamily={COND} fontWeight={900} fontStyle="italic" fontSize={46} fill={PT.white}>LIVE</text>
      </Bar>
      <Bar x={226} y={y} w={590} h={96} from={PT.deep} to={PT.navy} shine={sweep(t)} id="sb-main">
        {labels.map((l, j) => {
          const x = 20 + j * 300;
          const v = s.values[j];
          const hot = j === 0 ? (s.good ? PT.green : s.bad ? PT.red : PT.white) : PT.white;
          return <g key={j}>
            <text x={x} y={40} fontFamily={COND} fontWeight={800} fontStyle="italic" fontSize={28} letterSpacing={1} fill={PT.steel}>{l.toUpperCase()}</text>
            <rect x={x - 6} y={50} width={v.length > 3 ? 200 : 72} height={40} fill={flash > 0 && (j === 0 || v !== '0') ? PT.yellow : 'transparent'} opacity={flash} transform="skewX(-14)" />
            <text x={x} y={84} fontFamily={COND} fontWeight={900} fontStyle="italic" fontSize={v.length > 3 ? 38 : 48} fill={flash > 0.5 ? PT.ink : hot}>{v}</text>
          </g>;
        })}
      </Bar>
      <Bar x={822} y={y} w={190} h={96} from={PT.yellow} to="#E2A800" id="sb-clock">
        <text x={80} y={64} textAnchor="middle" fontFamily={COND} fontWeight={900} fontStyle="italic" fontSize={s.clock.length > 7 ? 32 : 40} fill={PT.ink}>{s.clock}</text>
      </Bar>
      <rect x={70} y={y + 98} width={940} height={6} fill={PT.blue} transform={`skewX(${SK})`} />
    </g>
  </Svg>;
};

/** Lower-third: a title bar and a small blue subline, sliding in from the left. */
export const LowerThird: React.FC<{t: number; from: number; to: number; title: string; sub?: string; tag?: string}> = ({t, from, to, title, sub, tag}) => {
  const k = hold(t, from, from + 0.25, to - 0.2, to);
  if (k <= 0.01) return null;
  const e = easeOut(t, from, from + 0.35);
  const w = title.length * 30 + 70;
  return <Svg opacity={k}>
    <g transform={`translate(${(1 - e) * -600} 0)`}>
      <Bar x={90} y={980} w={w} h={84} from={PT.white} to="#D8E0F2" shine={clamp((t - from - 0.3) / 0.6)} id={`lt-${from}`}>
        <text x={30} y={62} fontFamily={COND} fontWeight={900} fontStyle="italic" fontSize={56} fill={PT.ink}>{title}</text>
      </Bar>
      {sub && <Bar x={70} y={1068} w={sub.length * 18 + 60} h={46} from={PT.blue} to="#1450C8" id={`lts-${from}`}>
        <text x={24} y={33} fontFamily={COND} fontWeight={800} fontStyle="italic" fontSize={28} letterSpacing={1} fill={PT.white}>{sub}</text>
      </Bar>}
      {tag && <Bar x={90 + w + 6} y={980} w={tag.length * 24 + 50} h={84} from={PT.yellow} to="#E2A800" id={`ltt-${from}`}>
        <text x={24} y={58} fontFamily={COND} fontWeight={900} fontStyle="italic" fontSize={44} fill={PT.ink}>{tag}</text>
      </Bar>}
    </g>
  </Svg>;
};

/** The replay treatment: REPLAY / SLOW-MO tags, cool tint, film scan lines. */
export const ReplayFrame: React.FC<{k: number; slow?: boolean}> = ({k, slow = true}) => {
  if (k <= 0.01) return null;
  return <Svg opacity={k}>
    <rect width={1080} height={1920} fill={PT.blue} opacity={0.12} style={{mixBlendMode: 'screen'}} />
    {Array.from({length: 64}, (_, i) => <rect key={i} x={0} y={i * 30} width={1080} height={2} fill={PT.ink} opacity={0.1} />)}
    <Bar x={90} y={440} w={230} h={70} from={PT.yellow} to="#E2A800" id="rp-tag">
      <text x={24} y={52} fontFamily={COND} fontWeight={900} fontStyle="italic" fontSize={48} fill={PT.ink}>REPLAY</text>
    </Bar>
    {slow && <Bar x={326} y={440} w={190} h={70} from={PT.deep} to={PT.navy} id="rp-slow">
      <text x={24} y={50} fontFamily={COND} fontWeight={800} fontStyle="italic" fontSize={38} fill={PT.white}>SLOW-MO</text>
    </Bar>}
  </Svg>;
};

/** The stinger between shots: blue and yellow streaks sweep across with a spinning badge; the cut
 * happens behind them at `at`. `replay` puts an R in the badge. */
export const Stinger: React.FC<{t: number; at: number; replay?: boolean; dur?: number}> = ({t, at, replay = false, dur = 0.55}) => {
  const x = (t - (at - dur / 2)) / dur;
  if (x <= 0 || x >= 1) return null;
  const e = x < 0.5 ? 2 * x * x : 1 - 2 * (1 - x) * (1 - x);
  const bars = [{c: PT.blue, w: 900, d: 0}, {c: PT.deep, w: 700, d: 0.06}, {c: PT.yellow, w: 120, d: 0.12}, {c: PT.cyan, w: 60, d: 0.16}];
  const badge = hold(x, 0.25, 0.4, 0.6, 0.75);
  return <Svg>
    {bars.map((b, i) => {
      const p = clamp((e - b.d) / (1 - b.d));
      const cx = lerp(1700, -1500, p);
      return <rect key={i} x={cx} y={-200} width={b.w} height={2400} fill={b.c} transform={`skewX(${SK * 2})`} />;
    })}
    {badge > 0 && <g transform={`translate(540 860) scale(${0.6 + 0.4 * badge}) rotate(${(1 - badge) * 180})`} opacity={badge}>
      <circle r={130} fill={PT.navy} stroke={PT.yellow} strokeWidth={14} />
      <circle r={100} fill="none" stroke={PT.blue} strokeWidth={6} />
      <text y={replay ? 50 : 30} textAnchor="middle" fontFamily={COND} fontWeight={900} fontStyle="italic" fontSize={replay ? 150 : 70} fill={PT.white}>{replay ? 'R' : 'LIVE'}</text>
    </g>}
  </Svg>;
};

/** FINAL: a big slanted results bar across the middle. */
export const FinalBar: React.FC<{t: number; at: number; to: number; label: string; value: string}> = ({t, at, to, label, value}) => {
  const k = hold(t, at, at + 0.15, to - 0.25, to);
  if (k <= 0.01) return null;
  const e = easeOut(t, at, at + 0.3);
  return <Svg opacity={k}>
    <g transform={`translate(${(1 - e) * 1200} 0)`}>
      <Bar x={80} y={660} w={240} h={110} from={PT.red} to="#9E0F22" id="fin-tag">
        <text x={28} y={80} fontFamily={COND} fontWeight={900} fontStyle="italic" fontSize={74} fill={PT.white}>FINAL</text>
      </Bar>
      <Bar x={326} y={660} w={700} h={110} from={PT.deep} to={PT.navy} shine={clamp((t - at - 0.3) / 0.7)} id="fin-main">
        <text x={30} y={76} fontFamily={COND} fontWeight={800} fontStyle="italic" fontSize={50} fill={PT.steel}>{label.toUpperCase()}</text>
        <text x={600} y={92} textAnchor="end" fontFamily={COND} fontWeight={900} fontStyle="italic" fontSize={110} fill={PT.yellow}>{value}</text>
      </Bar>
    </g>
  </Svg>;
};

/** The fourth official's LED board: OUT in red, IN in green, dot-matrix glow. */
export const SubBoard: React.FC<{t: number; at: number; to: number; outText: string; inText: string}> = ({t, at, to, outText, inText}) => {
  const k = hold(t, at, at + 0.2, to - 0.25, to);
  if (k <= 0.01) return null;
  const rise = easeOut(t, at, at + 0.45);
  const flip = clamp((t - at - 0.45) / 0.25);
  const led = (text: string, c: string, y: number, on: number) => <g opacity={on}>
    <text x={0} y={y} textAnchor="middle" fontFamily={COND} fontWeight={900} fontSize={104} letterSpacing={4} fill={c} style={{filter: `drop-shadow(0 0 12px ${c})`}}>{text}</text>
    {Array.from({length: 9}, (_, i) => <line key={i} x1={-340} x2={340} y1={y - 92 + i * 12} y2={y - 92 + i * 12} stroke={PT.ink} strokeWidth={2} opacity={0.35} />)}
  </g>;
  return <Svg opacity={k}>
    <g transform={`translate(540 ${lerp(1500, 830, rise)}) rotate(${-2 + 1.5 * Math.sin(t * 2.2)})`}>
      <rect x={-380} y={-260} width={760} height={470} rx={26} fill="#11151F" stroke="#3A4050" strokeWidth={12} />
      <rect x={-30} y={210} width={60} height={420} fill="#2A2F3A" />
      <text x={-340} y={-200} fontFamily={COND} fontWeight={800} fontSize={36} fill={PT.steel}>SUBSTITUTION</text>
      <text x={-340} y={-150} fontFamily={COND} fontWeight={800} fontSize={30} fill={PT.red}>▼ OUT</text>
      {led(outText, PT.red, -50, 1)}
      <text x={-340} y={36} fontFamily={COND} fontWeight={800} fontSize={30} fill={PT.green}>▲ IN</text>
      {led(inText, PT.green, 150, flip)}
    </g>
  </Svg>;
};

/** Broadcast finish over everything before the turn: a soft vignette and a faint screen sheen. */
export const BroadcastFinish: React.FC<{k: number}> = ({k}) => k <= 0.01 ? null : <Svg opacity={k}>
  <defs><radialGradient id="vig" cx="0.5" cy="0.45" r="0.75"><stop offset="0.55" stopColor={PT.ink} stopOpacity={0} /><stop offset="1" stopColor={PT.ink} stopOpacity={0.6} /></radialGradient></defs>
  <rect width={1080} height={1920} fill="url(#vig)" />
</Svg>;

/** A small camera label, top right under the bug, like a broadcast's camera ID. */
export const CamLabel: React.FC<{text: string; k: number}> = ({text, k}) => k <= 0.01 ? null : <Svg opacity={k}>
  <Bar x={830} y={420} w={170} h={50} from={PT.navy} to={PT.ink} id={`cam-${text}`}>
    <circle cx={26} cy={25} r={8} fill={PT.red} />
    <text x={44} y={36} fontFamily={COND} fontWeight={800} fontStyle="italic" fontSize={30} fill={PT.white}>{text}</text>
  </Bar>
</Svg>;
