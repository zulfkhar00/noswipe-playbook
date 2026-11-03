import React from 'react';
import {AbsoluteFill} from 'remotion';
import {clamp, easeOut, hold, lerp} from '../lib/motion';
import {Chunk} from '../lib/speech';

// Format 3, "Safety Card": the look of an airline safety card. Flat two-tone pictograms with no
// outlines and thick rounded limbs, numbered panels on card stock, safety orange for the subject
// and the arrows, a hazard red for the prohibition marks. Helvetica for titles, a rounded face for
// the panel numbers. Everything here belongs to this format only; the noswipe.app look appears
// only at the brand turn and the end card.

export const SC = {
  navy: '#0B3D91', navyLo: '#082C6B', orange: '#FF7A1A', orangeLo: '#D9600A', stock: '#F4EFE6', stockLo: '#E4DCCD', yellow: '#FFD400',
  ink: '#1B1B1B', red: '#D7263D', green: '#1FA36A', grey: '#A9B2C3', greyLo: '#8D97AB', skin: '#E9C9A8', skinLo: '#D2AC88',
  seat: '#2F5DA8', seatLo: '#244A87', seatHi: '#3D6EBD', wall: '#ECE7DC', wallLo: '#D6CFC0', glow: '#CFE6FF',
};
export const HEL = "'Helvetica Neue', 'Inter', Helvetica, Arial, sans-serif";
export const ROUND = "'Arial Rounded MT Bold', 'Nunito', 'Helvetica Neue', 'Inter', Arial, sans-serif";

export const mix = (a: string, b: string, k: number) => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return `#${x.map((v, i) => Math.round(lerp(v, y[i], clamp(k))).toString(16).padStart(2, '0')).join('')}`;
};

const Svg: React.FC<{children: React.ReactNode; opacity?: number}> = ({children, opacity = 1}) =>
  <AbsoluteFill style={{opacity, pointerEvents: 'none'}}><svg width={1080} height={1920}>{children}</svg></AbsoluteFill>;

// ---------------------------------------------------------------------------------------------
// The pictogram person. Origin is the hips; the head sits ~300 above. Arms are two thick rounded
// segments driven by angles (degrees, 0 = straight down, positive = towards the figure's left /
// screen right). No face, as on a real card; acting is all pose, plus small marks ("!", "z", "?").

export type Arm = [number, number];   // [shoulder angle, elbow bend]
export type PaxPose = {
  armL: Arm; armR: Arm; lean?: number; tilt?: number; standing?: boolean;
  shirt?: string; shirtLo?: string; skin?: string; skinLo?: string; hair?: string; hat?: string; scarf?: string;
  phone?: 'L' | 'R' | null; glow?: number; sleep?: number; mask?: boolean; dim?: number; armsBack?: boolean;
};

const UPPER = 108, FORE = 98, LIMB = 44;

const armPath = (sx: number, sy: number, [a, b]: Arm) => {
  const r = (d: number) => (d * Math.PI) / 180;
  const ex = sx + UPPER * Math.sin(r(a)), ey = sy + UPPER * Math.cos(r(a));
  const hx = ex + FORE * Math.sin(r(a + b)), hy = ey + FORE * Math.cos(r(a + b));
  return {d: `M ${sx} ${sy} L ${ex} ${ey} L ${hx} ${hy}`, hx, hy, ang: a + b};
};

export const Pax: React.FC<{p: PaxPose; t?: number}> = ({p, t = 0}) => {
  const dim = p.dim ?? 0;
  const shirt = mix(p.shirt ?? SC.grey, '#1A2238', dim * 0.55), shirtLo = mix(p.shirtLo ?? SC.greyLo, '#121A2E', dim * 0.55);
  const skin = mix(p.skin ?? SC.skin, '#4A5468', dim * 0.5), skinLo = mix(p.skinLo ?? SC.skinLo, '#3A4458', dim * 0.5);
  const lean = p.lean ?? 0, tilt = p.tilt ?? 0;
  const sh = -228;   // shoulder line
  const L = armPath(-92, sh + 26, p.armL), R = armPath(92, sh + 26, [-p.armR[0], -p.armR[1]]);
  const glow = p.glow ?? 0;
  const hand = p.phone === 'L' ? L : p.phone === 'R' ? R : null;
  // Arms, then hands; the phone sits in one hand, screen towards the face. Drawn behind the head
  // for poses like hands-behind-the-head.
  const arms = <>
    {[L, R].map((a, i) => <path key={i} d={a.d} stroke={i ? shirtLo : shirt} strokeWidth={LIMB} strokeLinecap="round" strokeLinejoin="round" fill="none" />)}
    {[L, R].map((a, i) => <circle key={i} cx={a.hx} cy={a.hy} r={27} fill={i ? skinLo : skin} />)}
  </>;
  return <g transform={`rotate(${lean})`}>
    {p.standing && [-1, 1].map((s) => <path key={s} d={`M ${s * 44} -10 L ${s * 50} 330`} stroke={shirtLo} strokeWidth={LIMB + 8} strokeLinecap="round" />)}
    {!p.standing && [-1, 1].map((s) => <path key={s} d={`M ${s * 52} 0 L ${s * 58} 40`} stroke={shirtLo} strokeWidth={LIMB + 10} strokeLinecap="round" />)}
    {/* Torso, with the far side a shade darker. */}
    <rect x={-96} y={sh} width={192} height={-sh + 14} rx={58} fill={shirt} />
    <path d={`M 20 ${sh} L 38 ${sh} Q 96 ${sh} 96 ${sh + 58} L 96 -44 Q 96 14 38 14 L 20 14 Z`} fill={shirtLo} opacity={0.6} />
    {p.scarf && <path d={`M -40 ${sh + 4} L 40 ${sh + 4} L 0 ${sh + 70} Z`} fill={p.scarf} />}
    {p.armsBack && arms}
    {/* Head: plain disc, hair cap or a cabin-crew hat. */}
    <g transform={`translate(0 ${sh - 76}) rotate(${tilt})`}>
      <rect x={-22} y={30} width={44} height={50} fill={skinLo} />
      <circle r={68} fill={skin} />
      <path d="M 26 -63 A 68 68 0 0 1 26 63 A 90 90 0 0 0 26 -63 Z" fill={skinLo} opacity={0.6} />
      {p.hair && <path d="M -68 -4 A 68 68 0 0 1 68 -4 Q 40 -36 -2 -34 Q -44 -32 -68 -4 Z" fill={mix(p.hair, '#10141E', dim * 0.5)} />}
      {p.hat && <g><rect x={-60} y={-86} width={120} height={36} rx={14} fill={p.hat} /><rect x={-70} y={-56} width={140} height={14} rx={7} fill={p.hat} /></g>}
      {p.mask && <rect x={-62} y={-18} width={124} height={30} rx={14} fill={SC.navy} />}
      {glow > 0 && <circle r={68} fill={SC.glow} opacity={0.35 * glow} />}
    </g>
    {!p.armsBack && arms}
    {hand && <g transform={`translate(${hand.hx} ${hand.hy - 40})`}>
      <rect x={-34} y={-58} width={68} height={112} rx={14} fill={SC.ink} />
      <rect x={-27} y={-50} width={54} height={94} rx={9} fill={glow > 0 ? SC.glow : '#5A6A88'} />
      {glow > 0 && <path d="M -27 -50 L 27 -50 L 80 -260 L -80 -260 Z" fill={SC.glow} opacity={0.12 * glow} />}
    </g>}
    {(p.sleep ?? 0) > 0.5 && [0, 1].map((i) => { const k = (t * 0.5 + i / 2) % 1;
      return <text key={i} x={60 + 40 * k} y={sh - 160 - 90 * k} fontFamily={ROUND} fontSize={44 + 20 * k} fill={SC.greyLo} opacity={1 - k}>z</text>; })}
  </g>;
};

// ---------------------------------------------------------------------------------------------
// Card pieces.

/** A numbered safety-card panel: card stock, navy title bar, orange number disc. Top-left at x/y. */
export const Panel: React.FC<{x: number; y: number; w: number; h: number; n: number; title: string; children?: React.ReactNode; titleSize?: number}> =
  ({x, y, w, h, n, title, children, titleSize = 58}) => {
    const id = `pn-${n}-${Math.round(x)}`;
    return <g transform={`translate(${x} ${y})`}>
      <rect x={10} y={14} width={w} height={h} rx={34} fill={SC.ink} opacity={0.18} />
      <rect width={w} height={h} rx={34} fill={SC.stock} />
      <clipPath id={id}><rect width={w} height={h} rx={34} /></clipPath>
      <g clipPath={`url(#${id})`}>
        {children}
        <rect width={w} height={118} fill={SC.navy} />
      </g>
      <circle cx={74} cy={59} r={40} fill={SC.orange} />
      <text x={74} y={78} textAnchor="middle" fontFamily={ROUND} fontSize={56} fill={SC.stock}>{n}</text>
      <text x={134} y={59 + titleSize * 0.36} fontFamily={HEL} fontWeight={800} fontSize={titleSize} fill={SC.stock} letterSpacing={1}>{title}</text>
      <rect x={4} y={4} width={w - 8} height={h - 8} rx={30} fill="none" stroke={SC.navy} strokeWidth={8} />
    </g>;
  };

/** The prohibition mark: red ring with a slash, drawn on with `k`. */
export const NoSign: React.FC<{x: number; y: number; r: number; k: number}> = ({x, y, r, k}) => k <= 0 ? null : <g transform={`translate(${x} ${y})`}>
  <circle r={r} fill="none" stroke={SC.red} strokeWidth={r * 0.17} strokeDasharray={2 * Math.PI * r} strokeDashoffset={2 * Math.PI * r * (1 - clamp(k * 1.6))} transform="rotate(-90)" />
  <path d={`M ${-r * 0.7} ${-r * 0.7} L ${lerp(-r * 0.7, r * 0.7, clamp(k * 2.5 - 1.5))} ${lerp(-r * 0.7, r * 0.7, clamp(k * 2.5 - 1.5))}`} stroke={SC.red} strokeWidth={r * 0.17} strokeLinecap="round" opacity={k > 0.6 ? 1 : 0} />
</g>;

/** A thick safety-orange arrow along a quadratic path, drawn on with `k`. */
export const Arrow: React.FC<{d: string; k: number; head: [number, number, number]}> = ({d, k, head}) => k <= 0 ? null : <g>
  <path d={d} fill="none" stroke={SC.orange} strokeWidth={22} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - clamp(k / 0.85)} />
  {k > 0.85 && <path d="M -34 -32 L 32 0 L -34 32 Z" fill={SC.orange} transform={`translate(${head[0]} ${head[1]}) rotate(${head[2]}) scale(${clamp((k - 0.85) / 0.15)})`} />}
</g>;

/** The seat-belt / no-phone sign over the row, lit or off. */
export const BeltSign: React.FC<{x: number; y: number; on: number; phoneOff?: number}> = ({x, y, on, phoneOff = 0}) => <g transform={`translate(${x} ${y})`}>
  <rect x={-150} y={-46} width={300} height={92} rx={22} fill={SC.ink} />
  {[-1, 1].map((s) => <g key={s} transform={`translate(${s * 70} 0)`}>
    <rect x={-56} y={-36} width={112} height={72} rx={14} fill={mix('#3A3F4A', SC.yellow, s < 0 ? on : phoneOff)} />
    {s < 0 ? <g fill="none" stroke={SC.ink} strokeWidth={8} strokeLinecap="round"><path d="M -30 -6 L 30 -6" /><rect x={-10} y={-16} width={20} height={20} rx={4} /><path d="M -22 12 L 22 12" /></g>
      : <g><rect x={-16} y={-26} width={32} height={52} rx={6} fill={SC.ink} /><path d="M -30 -26 L 30 26" stroke={SC.ink} strokeWidth={7} /></g>}
  </g>)}
</g>;

// ---------------------------------------------------------------------------------------------
// Overlays.

export type StripState = {at: number; clock: string; values: [string, string]; bad?: boolean; good?: boolean};

/** The seatback flight-status strip: clock on the left, two joke values. Sits at y ≈ 300. */
export const StatusStrip: React.FC<{t: number; labels: [string, string]; states: StripState[]; k?: number}> = ({t, labels, states, k = 1}) => {
  if (k <= 0.01) return null;
  let i = 0;
  while (i + 1 < states.length && t >= states[i + 1].at) i++;
  const s = states[i];
  const flash = 1 - clamp((t - s.at) / 0.35);
  const accent = s.bad ? SC.red : s.good ? SC.green : SC.orange;
  return <Svg opacity={k}>
    <g transform="translate(90 292)">
      <rect width={900} height={104} rx={26} fill="#0E1626" opacity={0.92} />
      <rect width={900} height={104} rx={26} fill="none" stroke={mix('#34405A', accent, flash)} strokeWidth={5} />
      <circle cx={46} cy={52} r={13} fill={accent} />
      <text x={78} y={68} fontFamily={HEL} fontWeight={800} fontSize={44} fill={mix(SC.stock, accent, flash)}>{s.clock}</text>
      {labels.map((l, j) => <g key={j} transform={`translate(${j ? 690 : 400} 0)`}>
        <text x={0} y={42} fontFamily={HEL} fontWeight={700} fontSize={28} fill="#8C98B2" letterSpacing={2}>{l.toUpperCase()}</text>
        <text x={0} y={88} fontFamily={HEL} fontWeight={800} fontSize={44} fill={j === 0 && s.bad ? SC.red : SC.stock}>{s.values[j]}</text>
      </g>)}
    </g>
  </Svg>;
};

/** The card flip that joins shots: the old shot turns away on a vertical hinge, the new one turns
 * in, like a card pulled from the seat pocket. Returns the CSS transform for a shot at `t`. */
export const flipStyle = (t: number, cuts: number[], dur = 0.36): React.CSSProperties => {
  const c = cuts.find((x) => Math.abs(t - x) < dur / 2);
  if (c === undefined) return {};
  const x = (t - c) / (dur / 2);   // -1 → 0 old turning away, 0 → 1 new turning in
  const ang = x < 0 ? lerp(0, 90, (x + 1) ** 2) : lerp(-90, 0, 1 - (1 - x) ** 2);
  return {transform: `perspective(1800px) rotateY(${ang}deg) scale(${1 - 0.08 * (1 - Math.abs(x))})`, transformOrigin: '50% 50%'};
};

/** Captions: Helvetica, stock on a dark shadow, the spoken word on a safety-orange tab. */
export const Captions: React.FC<{t: number; chunks: Chunk[]; hideFrom: number}> = ({t, chunks, hideFrom}) => {
  const c = chunks.find((x) => t >= x.start - 0.03 && t < x.end);
  if (!c || t >= hideFrom) return null;
  const k = easeOut(t, c.start - 0.03, c.start + 0.1);
  return <div style={{position: 'absolute', left: 50, right: 50, top: 1150, textAlign: 'center', opacity: k, transform: `translateY(${(1 - k) * 12}px)`}}>
    {c.words.map((w, i) => {
      const on = t >= w.start && t < w.end + 0.05;
      return <span key={i} style={{display: 'inline-block', margin: '0 6px', padding: '0 12px', borderRadius: 10, background: on ? SC.orange : 'transparent',
        fontFamily: HEL, fontWeight: 800, fontSize: 66, lineHeight: 1.25, color: on ? SC.ink : SC.stock,
        textShadow: on ? 'none' : `0 4px 0 ${SC.ink}, 0 0 16px rgba(10,16,30,0.85)`}}>{w.text.replace(/["…]/g, '').replace(/\.\.\./g, '')}</span>;
    })}
  </div>;
};

/** Frame-1 context, as the cover of a safety card. */
export const ContextTitle: React.FC<{t: number; text: string; until: number}> = ({t, text, until}) => {
  const k = 1 - hold(t, until - 0.35, until, 99, 100);
  if (k <= 0) return null;
  return <Svg opacity={k}>
    <g transform="translate(90 470)">
      <rect x={8} y={12} width={900} height={210} rx={30} fill={SC.ink} opacity={0.25} />
      <rect width={900} height={210} rx={30} fill={SC.stock} />
      <rect width={900} height={74} rx={30} fill={SC.navy} /><rect y={44} width={900} height={30} fill={SC.navy} />
      <text x={40} y={56} fontFamily={HEL} fontWeight={800} fontSize={44} fill={SC.stock} letterSpacing={5}>SAFETY BRIEFING</text>
      <circle cx={850} cy={37} r={22} fill={SC.orange} />
      <text x={450} y={168} textAnchor="middle" fontFamily={HEL} fontWeight={800} fontSize={84} fill={SC.navy}>{text}</text>
    </g>
  </Svg>;
};
