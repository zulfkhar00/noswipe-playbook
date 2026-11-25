import React from 'react';
import {clamp, lerp, smooth} from '../../lib/motion';
import {OPEN} from '../../lib/fonts';

// "Cabin Six" world: a flat, crisp ski-poster vector look. No outlines on scenery, big geometric shapes, soft ink-tinted plane
// shadows. Palette is the season's own (nothing shared with the diner/bag/dryer looks).
export const C = {
  ice: '#BCE3F5', iceDeep: '#8FC4E2', iceMid: '#A9D6EE', snow: '#F7FBFF', pine: '#1E4D46', pineLite: '#2E6B61', red: '#E4472B', redDeep: '#B9331B',
  peach: '#FFB48A', ink: '#17283B', gold: '#FFD35A', marigold: '#F5B82E', marigoldDeep: '#CF9314', hat: '#24456E', hatLite: '#31588C',
  denim: '#3C5F86', skinHim: '#E8B08A', skinHer: '#C98E68', skinHimD: '#C98E68', skinHerD: '#A87250', hair: '#1D2230',
};
export const FONT_FOG = `${OPEN.handPrint}`;
export const FONT_PLATE = `${OPEN.geometric}`;
export const FONT_POSTER = `${OPEN.poster}`;
export type Cam = {x: number; y: number; z: number};
export const planeT = (c: Cam, d: number) => {
  const s = 1 + (c.z - 1) * d;
  return `translate(540 960) scale(${s}) translate(${-(540 + (c.x - 540) * d)} ${-(960 + (c.y - 960) * d)})`;
};
export const wp = (t: number, a: number, b: number) => clamp((t - a) / (b - a));

// ---------------------------------------------------------------------------------------------------- defs
export const Defs: React.FC = () => <defs>
  <linearGradient id="skyPre" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4BA6DC" /><stop offset="0.5" stopColor="#82C6EA" /><stop offset="1" stopColor="#CBEAF8" /></linearGradient>
  <linearGradient id="skyDawn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FF7A55" /><stop offset="0.5" stopColor="#FFA94A" /><stop offset="1" stopColor="#FFE07A" /></linearGradient>
  <radialGradient id="sunGlow"><stop offset="0" stopColor="#FFF4C0" stopOpacity="0.95" /><stop offset="0.35" stopColor="#FFD35A" stopOpacity="0.55" /><stop offset="1" stopColor="#FFB48A" stopOpacity="0" /></radialGradient>
  <radialGradient id="phoneGlow"><stop offset="0" stopColor="#F2FBFF" stopOpacity="0.95" /><stop offset="0.45" stopColor="#CFF0FF" stopOpacity="0.45" /><stop offset="1" stopColor="#BCE3F5" stopOpacity="0" /></radialGradient>
  <radialGradient id="goldLight"><stop offset="0" stopColor="#FFE08A" stopOpacity="0.85" /><stop offset="0.6" stopColor="#FFC470" stopOpacity="0.3" /><stop offset="1" stopColor="#FFB48A" stopOpacity="0" /></radialGradient>
  <radialGradient id="softShadow"><stop offset="0" stopColor="#17283B" stopOpacity="0.4" /><stop offset="1" stopColor="#17283B" stopOpacity="0" /></radialGradient>
  <linearGradient id="fogTint" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFFFFF" /><stop offset="1" stopColor="#E3F3FB" /></linearGradient>
  <linearGradient id="lens" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#8FD0F0" /><stop offset="0.6" stopColor="#C9B7E8" /><stop offset="1" stopColor="#FFB48A" /></linearGradient>
  <linearGradient id="wallG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F28A6E" /><stop offset="0.5" stopColor="#EE7A5C" /><stop offset="1" stopColor="#E96C4E" /></linearGradient>
</defs>;

// ---------------------------------------------------------------------------------------------------- valley (window-local coords 700 x 940)
export const WIN_W = 700, WIN_H = 940;
const PER = 1400;
const ridgeFn = (seed: number, base: number, amp: number) => (x: number) =>
  base - amp * (0.55 * Math.sin((2 * Math.PI * 2 * x) / PER + seed) + 0.3 * Math.sin((2 * Math.PI * 5 * x) / PER + seed * 2.1) + 0.15 * Math.sin((2 * Math.PI * 11 * x) / PER + seed * 3.3));
const ridgePath = (f: (x: number) => number) => {
  let d = `M 0 ${f(0).toFixed(1)}`;
  for (let x = 28; x <= PER; x += 28) d += ` L ${x} ${f(x).toFixed(1)}`;
  return `${d} L ${PER} 1000 L 0 1000 Z`;
};
const FAR = ridgeFn(0.7, 335, 50), MIDR = ridgeFn(2.2, 430, 50), NEAR = ridgeFn(4.1, 590, 45);
const FAR_P = ridgePath(FAR), MID_P = ridgePath(MIDR), NEAR_P = ridgePath(NEAR);
const PINES: {x: number; s: number}[] = Array.from({length: 17}, (_, i) => ({x: i * 82 + ((i * 37) % 23), s: 0.8 + ((i * 53) % 10) / 14}));
const Pine: React.FC<{x: number; y: number; s: number; snow?: boolean}> = ({x, y, s, snow}) => <g transform={`translate(${x} ${y}) scale(${s})`}>
  <rect x={-5} y={-4} width={10} height={26} fill={C.ink} />
  <path d="M 0 -150 L 48 -62 L 22 -62 L 58 6 L -58 6 L -22 -62 L -48 -62 Z" fill={C.pine} />
  {snow && <path d="M 0 -150 L 22 -112 L -22 -112 Z" fill={C.snow} />}
</g>;

export const Pylon: React.FC<{x: number; w: number}> = ({x, w}) => <g transform={`translate(${x} 0)`}>
  <path d={`M ${-w} 960 L ${-w * 0.45} 70 L ${w * 0.45} 70 L ${w} 960 Z`} fill={C.ink} />
  <rect x={-w * 4.2} y={70} width={w * 8.4} height={w * 0.9} rx={w * 0.3} fill={C.ink} />
  {[-1, 1].map((s) => <circle key={s} cx={s * w * 3.2} cy={70 + w * 0.5} r={w * 0.85} fill={C.red} />)}
  {[-1, 1].map((s) => <circle key={`h${s}`} cx={s * w * 3.2} cy={70 + w * 0.5} r={w * 0.3} fill={C.snow} />)}
</g>;

const mixHex = (a: string, b: string, k: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return '#' + pa.map((v, i) => Math.round(lerp(v, pb[i], k)).toString(16).padStart(2, '0')).join('');
};
export const Valley: React.FC<{t: number; sun: number; pylons: number[]}> = ({t, sun, pylons}) => {
  const off = (sp: number) => (t * sp) % PER;
  const e = smooth(sun, 0, 1);
  const sunY = lerp(470, 238, e);
  const tile = (path: string, sp: number, fill: string, extra?: React.ReactNode) => <g>
    {[0, 1].map((k) => <g key={k} transform={`translate(${-off(sp) + k * PER} 0)`}><path d={path} fill={fill} />{extra}</g>)}
  </g>;
  return <g>
    <rect x={0} y={0} width={WIN_W} height={WIN_H} fill="url(#skyPre)" />
    <rect x={0} y={0} width={WIN_W} height={WIN_H} fill="url(#skyDawn)" opacity={e} />
    {e > 0.01 && <g transform={`translate(350 ${sunY})`} opacity={e}>
      <circle r={560} fill="url(#sunGlow)" opacity={0.9} />
      {Array.from({length: 14}, (_, i) => <path key={i} d="M 0 0 L -26 -700 L 26 -700 Z" fill="#FFE9A0" opacity={0.22} transform={`rotate(${i * (360 / 14) + t * 3})`} />)}
      <circle r={92} fill={C.gold} />
      <circle r={62} fill="#FFF1B8" />
    </g>}
    {tile(FAR_P, 14, mixHex('#6BA8D0', '#B9799A', e))}
    {tile(MID_P, 40, mixHex('#C6E1F1', '#FBD6AE', e))}
    {e > 0.01 && <rect x={0} y={300} width={WIN_W} height={400} fill={C.peach} opacity={0.2 * e} />}
    {tile(NEAR_P, 95, C.pineLite, PINES.map((p, i) => <Pine key={i} x={p.x} y={NEAR(p.x) + 30} s={p.s * 0.85} snow />))}
    {pylons.map((tp, i) => {
      const dx = (tp - t) * 1000;
      if (Math.abs(dx) > 520) return null;
      return <Pylon key={i} x={350 + dx} w={18} />;
    })}
    {/* foreground pines and snow bank, fast */}
    <g>{[0, 1].map((k) => <g key={k} transform={`translate(${-((t * 210) % PER) + k * PER} 0)`}>
      <path d="M 0 840 Q 200 800 420 830 T 840 820 T 1260 836 L 1400 836 L 1400 1000 L 0 1000 Z" fill={C.pine} />
      {PINES.filter((_, i) => i % 2 === 0).map((p, i) => <Pine key={i} x={p.x + 20} y={850} s={p.s * 1.5} snow />)}
    </g>)}</g>
    {e > 0.01 && <rect x={0} y={0} width={WIN_W} height={WIN_H} fill="#FFB48A" opacity={0.12 * e} />}
  </g>;
};

// ---------------------------------------------------------------------------------------------------- glass (fog + clear strokes with a navy edge)
export type GlassRender = (mode: 'core' | 'edge' | 'ink') => React.ReactNode;
export const GlassPanel: React.FC<{id: string; w: number; h: number; rx: number; fog?: number; holes?: React.ReactNode; ring?: {cx: number; cy: number; r: number} | null; overlay?: React.ReactNode; render: GlassRender}> = ({id, w, h, rx, fog = 0.8, holes, ring, overlay, render}) => <g>
  <defs>
    <mask id={`${id}-m1`} maskUnits="userSpaceOnUse" x={-10} y={-10} width={w + 20} height={h + 20}>
      <rect x={-10} y={-10} width={w + 20} height={h + 20} fill="#fff" />
      <g fill="#000">{holes}</g>
      <g>{render('core')}</g>
    </mask>
    <mask id={`${id}-m2`} maskUnits="userSpaceOnUse" x={-10} y={-10} width={w + 20} height={h + 20}>
      <rect x={-10} y={-10} width={w + 20} height={h + 20} fill="#000" />
      <g>{render('edge')}</g>
      {ring && <circle cx={ring.cx} cy={ring.cy} r={ring.r + 11} fill="#fff" />}
      <g>{render('core')}</g>
      <g fill="#000">{holes}</g>
    </mask>
    <clipPath id={`${id}-c`}><rect x={0} y={0} width={w} height={h} rx={rx} /></clipPath>
  </defs>
  <g clipPath={`url(#${id}-c)`}>
    <rect x={-10} y={-10} width={w + 20} height={h + 20} fill="url(#fogTint)" opacity={fog} mask={`url(#${id}-m1)`} />
    <rect x={-10} y={-10} width={w + 20} height={h + 20} fill={C.ink} opacity={0.92} mask={`url(#${id}-m2)`} />
    {overlay}
    {[[90, 120, 9], [560, 80, 7], [610, 700, 10], [70, 760, 8], [330, 900, 7], [610, 330, 6], [120, 450, 6]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill="#fff" opacity={0.5 * fog} />)}
  </g>
</g>;

export const FRAME = 34;
export const WindowFrame: React.FC<{num?: boolean}> = ({num}) => <g>
  <rect x={-FRAME - 14} y={-FRAME - 14} width={WIN_W + 2 * FRAME + 28} height={WIN_H + 2 * FRAME + 28} rx={78} fill={C.ink} opacity={0.22} transform="translate(0 16)" />
  <rect x={-FRAME} y={-FRAME} width={WIN_W + 2 * FRAME} height={WIN_H + 2 * FRAME} rx={62} fill={C.snow} />
  <rect x={-FRAME + 10} y={-FRAME + 10} width={WIN_W + 2 * FRAME - 20} height={WIN_H + 2 * FRAME - 20} rx={54} fill={C.iceMid} opacity={0.55} />
  {num && <g transform={`translate(${WIN_W / 2} ${-FRAME + 2})`}><circle r={30} fill={C.red} /><text y={14} textAnchor="middle" fontFamily={FONT_PLATE} fontWeight={800} fontSize={40} fill={C.snow}>6</text></g>}
</g>;

// ---------------------------------------------------------------------------------------------------- glass writing items
export type Item =
  | {k: 'text'; lines: {s: string; x: number; y: number; size: number}[]; a: number; b: number; out?: [number, number]; who: 'him' | 'her'; hook?: 'b'}
  | {k: 'grid'; cx: number; cy: number; cell: number; a: number; b: number; out?: [number, number]; who: 'him' | 'her'}
  | {k: 'X' | 'O'; cx: number; cy: number; a: number; b: number; out?: [number, number]; who: 'him' | 'her'}
  | {k: 'line'; x1: number; y1: number; x2: number; y2: number; a: number; b: number; out?: [number, number]; who: 'him' | 'her'}
  | {k: 'dot'; cx: number; cy: number; a: number; b: number; out?: [number, number]; who: 'him' | 'her'};
export const tw = (s: string, size: number) => s.length * size * 0.5;
const strokeP = (mode: 'core' | 'edge' | 'ink', w: number) => ({stroke: mode === 'core' ? '#000' : '#fff', strokeWidth: mode === 'core' ? w : w + 11, strokeLinecap: 'round' as const, fill: 'none'});
const Seg: React.FC<{x1: number; y1: number; x2: number; y2: number; p: number; mode: 'core' | 'edge' | 'ink'; w: number}> = ({x1, y1, x2, y2, p, mode, w}) =>
  p <= 0 ? null : <line x1={x1} y1={y1} x2={lerp(x1, x2, p)} y2={lerp(y1, y2, p)} {...strokeP(mode, w)} />;
export const cellC = (cx: number, cy: number, cell: number, i: number) => ({x: cx + (i % 3 - 1) * cell, y: cy + (Math.floor(i / 3) - 1) * cell});
const SegC: React.FC<{x1: number; y1: number; x2: number; y2: number; p: number; c: string; w: number}> = ({x1, y1, x2, y2, p, c, w}) =>
  p <= 0 ? null : <line x1={x1} y1={y1} x2={lerp(x1, x2, p)} y2={lerp(y1, y2, p)} stroke={c} strokeWidth={w} strokeLinecap="round" />;
// solid coloured marks (his marigold X with navy edge, her pine O with navy edge, thick pine strike)
export const InkMark: React.FC<{k: 'X' | 'O' | 'line'; cx?: number; cy?: number; line?: number[]; p: number; op?: number; strike?: string}> = ({k, cx = 0, cy = 0, line, p, op = 1, strike}) => {
  if (p <= 0) return null;
  let body: React.ReactNode = null;
  if (k === 'X') {
    const r = 36, q1 = clamp(p * 2), q2 = clamp(p * 2 - 1);
    body = [[C.ink, 28], [C.marigold, 17]].map(([c, w], i) => <g key={i}>
      <SegC x1={cx - r} y1={cy - r} x2={cx + r} y2={cy + r} p={q1} c={c as string} w={w as number} /><SegC x1={cx + r} y1={cy - r} x2={cx - r} y2={cy + r} p={q2} c={c as string} w={w as number} /></g>);
  } else if (k === 'O') {
    body = [[C.ink, 28], [C.pine, 17]].map(([c, w], i) => <circle key={i} cx={cx} cy={cy} r={38} pathLength={1} strokeDasharray={`${p} 2`} transform={`rotate(-90 ${cx} ${cy})`} fill="none" stroke={c as string} strokeWidth={w as number} strokeLinecap="round" />);
  } else if (line) {
    const col = strike ?? C.pine;
    body = [[C.ink, 36], [col, 24]].map(([c, w], i) => <SegC key={i} x1={line[0]} y1={line[1]} x2={line[2]} y2={line[3]} p={p} c={c as string} w={w as number} />);
  }
  return <g opacity={op}>{body}</g>;
};
export const ItemView: React.FC<{it: Item; t: number; mode: 'core' | 'edge' | 'ink'}> = ({it, t, mode}) => {
  const p = wp(t, it.a, it.b);
  if (mode === 'ink') {
    const al = it.out ? 1 - smooth(t, it.out[0], it.out[1]) : 1;
    if (it.k === 'X' || it.k === 'O') return <InkMark k={it.k} cx={it.cx} cy={it.cy} p={p} op={al} />;
    if (it.k === 'line') return <InkMark k="line" line={[it.x1, it.y1, it.x2, it.y2]} p={p} op={al} />;
    return null;
  }
  if ((['X', 'O', 'line'] as string[]).includes(it.k)) return null;
  const alive = it.out ? 1 - smooth(t, it.out[0], it.out[1]) : 1;
  if (p <= 0 || alive <= 0.01) return null;
  let body: React.ReactNode = null;
  if (it.k === 'text') {
    const total = it.lines.reduce((n, l) => n + l.s.length, 0);
    let acc = 0;
    body = it.lines.map((l, i) => {
      const share = l.s.length / total;
      const lp = clamp((p * 1 - acc) / share); acc += share;
      if (lp <= 0) return null;
      const w = tw(l.s, l.size), left = l.x - w / 2;
      const id = `clip-${it.a}-${i}`;
      return <g key={i}>
        <clipPath id={id}><rect x={left - 20} y={l.y - l.size} width={(w + 40) * lp} height={l.size * 1.4} /></clipPath>
        <text x={l.x} y={l.y} textAnchor="middle" clipPath={`url(#${id})`} fontFamily={FONT_FOG} fontSize={l.size} fill={mode === 'core' ? '#000' : '#fff'}
          stroke={mode === 'core' ? '#000' : '#fff'} strokeWidth={mode === 'core' ? 4 : 4 + 11} strokeLinejoin="round">{l.s}</text>
      </g>;
    });
  } else if (it.k === 'grid') {
    const s = it.cell, h = (s * 3) / 2 + 10;
    const q = (a: number, b: number) => clamp((p - a) / (b - a));
    body = <g>
      <Seg x1={it.cx - s / 2} y1={it.cy - h} x2={it.cx - s / 2} y2={it.cy + h} p={q(0, 0.3)} mode={mode} w={11} />
      <Seg x1={it.cx + s / 2} y1={it.cy - h} x2={it.cx + s / 2} y2={it.cy + h} p={q(0.25, 0.55)} mode={mode} w={11} />
      <Seg x1={it.cx - h} y1={it.cy - s / 2} x2={it.cx + h} y2={it.cy - s / 2} p={q(0.5, 0.78)} mode={mode} w={11} />
      <Seg x1={it.cx - h} y1={it.cy + s / 2} x2={it.cx + h} y2={it.cy + s / 2} p={q(0.72, 1)} mode={mode} w={11} />
    </g>;
  } else if (it.k === 'X') {
    const r = 36;
    body = <g><Seg x1={it.cx - r} y1={it.cy - r} x2={it.cx + r} y2={it.cy + r} p={clamp(p * 2)} mode={mode} w={15} />
      <Seg x1={it.cx + r} y1={it.cy - r} x2={it.cx - r} y2={it.cy + r} p={clamp(p * 2 - 1)} mode={mode} w={15} /></g>;
  } else if (it.k === 'O') {
    body = <circle cx={it.cx} cy={it.cy} r={38} pathLength={1} strokeDasharray={`${p} 2`} transform={`rotate(-90 ${it.cx} ${it.cy})`} {...strokeP(mode, 15)} />;
  } else if (it.k === 'line') {
    body = <Seg x1={it.x1} y1={it.y1} x2={it.x2} y2={it.y2} p={p} mode={mode} w={15} />;
  } else if (it.k === 'dot') {
    body = <circle cx={it.cx} cy={it.cy} r={26 * p} {...strokeP(mode, 8)} />;
  }
  return <g opacity={alive}>{body}</g>;
};
// where the finger tip is for an item at time t (window-local)
export const tipOf = (it: Item, t: number): {x: number; y: number} => {
  const p = wp(t, it.a, it.b);
  if (it.k === 'text') {
    const total = it.lines.reduce((n, l) => n + l.s.length, 0);
    let acc = 0;
    for (const l of it.lines) {
      const share = l.s.length / total;
      if (p <= acc + share + 1e-6) { const lp = clamp((p - acc) / share); return {x: l.x - tw(l.s, l.size) / 2 + tw(l.s, l.size) * lp, y: l.y - l.size * 0.28}; }
      acc += share;
    }
    const l = it.lines[it.lines.length - 1]; return {x: l.x + tw(l.s, l.size) / 2, y: l.y - l.size * 0.28};
  }
  if (it.k === 'grid') { const s = it.cell; return {x: it.cx + Math.sin(p * 12) * s * 0.9, y: it.cy + Math.cos(p * 9) * s * 0.9}; }
  if (it.k === 'X') return {x: it.cx + (p < 0.5 ? lerp(-36, 36, p * 2) : lerp(36, -36, (p - 0.5) * 2)), y: it.cy + (p < 0.5 ? lerp(-36, 36, p * 2) : lerp(-36, 36, (p - 0.5) * 2))};
  if (it.k === 'O') return {x: it.cx + Math.sin(p * Math.PI * 2) * 38, y: it.cy - Math.cos(p * Math.PI * 2) * 38};
  if (it.k === 'line') return {x: lerp(it.x1, it.x2, p), y: lerp(it.y1, it.y2, p)};
  return {x: it.cx, y: it.cy};
};

// ---------------------------------------------------------------------------------------------------- people
export type Mouth = 'flat' | 'smile' | 'smirk' | 'o' | 'laugh' | 'grit' | 'soft';
export type Pose = {look: [number, number]; brow: number; mouth: Mouth; blink: number; flush: number; sweat: number; tilt: number; bob: number; sq: number; gold: number; glow: number};
export const calm: Pose = {look: [0, 0], brow: 0, mouth: 'flat', blink: 0, flush: 0, sweat: 0, tilt: 0, bob: 0, sq: 1, gold: 0, glow: 0};

const FaceBits: React.FC<{who: 'him' | 'her'; pose: Pose; d: number}> = ({who, pose, d}) => {
  const [lx, ly] = pose.look;
  const dark = who === 'him' ? C.skinHimD : C.skinHerD;
  const eyeRY = 35 * (1 - pose.blink * 0.92);
  const mouthY = 104, mx = d * 10;
  const mc = '#4A1F26';
  let mouth: React.ReactNode;
  switch (pose.mouth) {
    case 'smile': mouth = <path d={`M ${mx - 38} ${mouthY - 6} Q ${mx} ${mouthY + 34} ${mx + 38} ${mouthY - 6}`} fill="none" stroke={C.ink} strokeWidth={9} strokeLinecap="round" />; break;
    case 'smirk': mouth = <path d={`M ${mx - 34} ${mouthY + 6} Q ${mx} ${mouthY + 10} ${mx + 36} ${mouthY - 10}`} fill="none" stroke={C.ink} strokeWidth={9} strokeLinecap="round" />; break;
    case 'soft': mouth = <path d={`M ${mx - 28} ${mouthY} Q ${mx} ${mouthY + 12} ${mx + 28} ${mouthY}`} fill="none" stroke={C.ink} strokeWidth={9} strokeLinecap="round" />; break;
    case 'o': mouth = <ellipse cx={mx} cy={mouthY + 6} rx={15} ry={20} fill={mc} />; break;
    case 'grit': mouth = <path d={`M ${mx - 34} ${mouthY + 6} Q ${mx} ${mouthY - 8} ${mx + 34} ${mouthY + 6}`} fill="none" stroke={C.ink} strokeWidth={10} strokeLinecap="round" />; break;
    case 'laugh': mouth = <g><path d={`M ${mx - 48} ${mouthY - 14} Q ${mx} ${mouthY - 20} ${mx + 48} ${mouthY - 14} Q ${mx + 40} ${mouthY + 50} ${mx} ${mouthY + 50} Q ${mx - 40} ${mouthY + 50} ${mx - 48} ${mouthY - 14} Z`} fill={mc} />
      <path d={`M ${mx - 46} ${mouthY - 14} Q ${mx} ${mouthY - 20} ${mx + 46} ${mouthY - 14} L ${mx + 42} ${mouthY} Q ${mx} ${mouthY - 6} ${mx - 42} ${mouthY} Z`} fill={C.snow} />
      <ellipse cx={mx} cy={mouthY + 38} rx={22} ry={11} fill="#E3706B" /></g>; break;
    default: mouth = <path d={`M ${mx - 32} ${mouthY} Q ${mx} ${mouthY + 3} ${mx + 32} ${mouthY}`} fill="none" stroke={C.ink} strokeWidth={9} strokeLinecap="round" />;
  }
  const browY = -52 - pose.brow * 18;
  const worry = pose.sweat > 0.2 ? 8 : 0;
  return <g>
    {/* cheeks */}
    <ellipse cx={d * -62} cy={62} rx={34} ry={22} fill="#E4472B" opacity={0.16 + pose.flush * 0.4} />
    <ellipse cx={d * 70} cy={62} rx={34} ry={22} fill="#E4472B" opacity={0.16 + pose.flush * 0.4} />
    {[-1, 1].map((s) => {
      const ex = s * 56 + d * 22, ey = 0;
      return <g key={s}>
        <ellipse cx={ex} cy={ey} rx={31} ry={Math.max(3, eyeRY)} fill={C.snow} />
        {eyeRY > 8 && <><circle cx={ex + lx * 13 + d * 2} cy={ey + ly * 9} r={17} fill={C.ink} /><circle cx={ex + lx * 13 + d * 2 + 6} cy={ey + ly * 9 - 7} r={5.5} fill="#fff" /></>}
        <path d={`M ${ex - 34} ${browY + 8 + (s === d ? 0 : worry)} Q ${ex} ${browY - 8} ${ex + 34} ${browY + 8 + (s === d ? worry : 0)}`} fill="none" stroke={who === 'her' ? C.hair : '#3A2A22'} strokeWidth={who === 'her' ? 10 : 13} strokeLinecap="round" />
      </g>;
    })}
    <path d={`M ${d * 10} 18 Q ${d * 34} 58 ${d * 8} 64`} fill="none" stroke={dark} strokeWidth={9} strokeLinecap="round" />
    {mouth}
    {pose.sweat > 0.05 && <path d={`M ${-d * 100} ${-70 + pose.sweat * 30} q -16 30 0 42 q 16 -12 0 -42 z`} fill="#8FD0F0" opacity={pose.sweat} />}
  </g>;
};

export const Person: React.FC<{who: 'him' | 'her'; x: number; y: number; pose: Pose; sc?: number}> = ({who, x, y, pose, sc = 1}) => {
  const him = who === 'him';
  const d = him ? 1 : -1;
  const skin = him ? C.skinHim : C.skinHer, dark = him ? C.skinHimD : C.skinHerD;
  const o = -d; // outer side
  return <g transform={`translate(${x} ${y + pose.bob}) rotate(${pose.tilt}) scale(${pose.sq * sc} ${(2 - pose.sq) * sc})`}>
    {/* ground shadow */}
    <ellipse cx={0} cy={830} rx={260} ry={34} fill="url(#softShadow)" />
    {/* legs and shoes */}
    {him ? <g>
      {[-1, 1].map((s) => <g key={s}>
        <path d={`M ${s * 100 - 76} 520 L ${s * 100 + 76} 520 L ${s * 100 + 66} 770 L ${s * 100 - 66} 770 Z`} fill={C.denim} />
        <path d={`M ${s * 100 - 70} 756 Q ${s * 100 - 76} 800 ${s * 100 - 96} 812 L ${s * 100 + 128} 812 Q ${s * 100 + 110} 760 ${s * 100 + 66} 756 Z`} fill={C.snow} />
        <rect x={s * 100 - 100} y={808} width={232} height={22} rx={11} fill="#D4E3EC" />
        <path d={`M ${s * 100 - 50} 760 L ${s * 100 + 20} 790`} stroke={C.red} strokeWidth={7} strokeLinecap="round" />
      </g>)}
    </g> : <g>
      {[-1, 1].map((s) => <g key={s}>
        <path d={`M ${s * 100 - 72} 520 L ${s * 100 + 72} 520 L ${s * 100 + 62} 720 L ${s * 100 - 62} 720 Z`} fill={C.pine} />
        <path d={`M ${s * 100 - 72} 520 L ${s * 100 - 60} 520 L ${s * 100 - 52} 720 L ${s * 100 - 62} 720 Z`} fill={C.snow} />
        <path d={`M ${s * 100 - 78} 700 L ${s * 100 + 78} 700 L ${s * 100 + 90} 810 L ${s * 100 - 130} 820 Z`} fill={C.ink} />
        <rect x={s * 100 - 66} y={720} width={132} height={14} rx={6} fill={C.red} />
        <rect x={s * 100 - 60} y={752} width={120} height={14} rx={6} fill={C.red} />
        <rect x={s * 100 - 134} y={814} width={216} height={16} rx={8} fill={C.redDeep} />
      </g>)}
    </g>}
    {/* torso */}
    {him ? <g>
      <path d="M -236 600 L -248 340 Q -236 196 -90 172 L 90 172 Q 236 196 248 340 L 236 600 Z" fill={C.marigold} />
      {[300, 390, 480].map((yy) => <path key={yy} d={`M ${-244 + (yy - 300) * 0.03} ${yy} Q 0 ${yy + 22} ${244 - (yy - 300) * 0.03} ${yy}`} fill="none" stroke={C.marigoldDeep} strokeWidth={7} opacity={0.75} />)}
      <path d={`M ${o * 248} 340 L ${o * 236} 600 L ${o * 150} 600 L ${o * 166} 250 Z`} fill={C.marigoldDeep} opacity={0.22} />
      <path d="M -128 176 Q 0 262 128 176 Q 128 140 0 136 Q -128 140 -128 176 Z" fill={C.marigoldDeep} />
      <path d="M -112 170 Q 0 240 112 170" fill="none" stroke={C.marigold} strokeWidth={14} strokeLinecap="round" />
    </g> : <g>
      <path d="M -214 600 L -224 340 Q -212 200 -86 174 L 86 174 Q 212 200 224 340 L 214 600 Z" fill={C.pine} />
      <path d="M -224 340 Q 0 366 224 340 L 224 372 Q 0 398 -224 372 Z" fill={C.red} opacity={0.95} />
      <path d={`M ${o * 224} 340 L ${o * 214} 600 L ${o * 140} 600 L ${o * 150} 250 Z`} fill={C.ink} opacity={0.2} />
      <path d="M -112 178 Q 0 236 112 178 Q 112 120 0 118 Q -112 120 -112 178 Z" fill={C.pineLite} />
      <rect x={-6} y={190} width={12} height={400} fill={C.snow} opacity={0.9} />
      <circle cx={0} cy={204} r={13} fill={C.red} />
    </g>}
    {/* neck */}
    <rect x={-46} y={96} width={92} height={90} fill={dark} />
    {/* back hair (her) */}
    {!him && <path d="M -172 -70 Q -192 -196 0 -204 Q 192 -196 172 -70 L 178 156 Q 150 196 96 176 L -96 176 Q -150 196 -178 156 Z" fill={C.hair} />}
    {/* ears (him) */}
    {him && [-1, 1].map((s) => <circle key={s} cx={s * 138} cy={14} r={30} fill={dark} />)}
    <ellipse cx={0} cy={0} rx={140} ry={166} fill={skin} />
    <path d={`M ${o * 140} 0 Q ${o * 130} 120 ${o * 40} 164 Q ${o * 100} 160 ${o * 140} 0 Z`} fill={dark} opacity={0.35} />
    {him && <path d="M -128 40 Q -108 156 0 166 Q 108 156 128 40 Q 96 112 0 114 Q -96 112 -128 40 Z" fill={C.ink} opacity={0.3} />}
    {him && <path d="M -42 84 Q 0 70 42 84 Q 0 96 -42 84 Z" fill={C.ink} opacity={0.22} />}
    <FaceBits who={who} pose={pose} d={d} />
    {/* phone light on the face and gold light */}
    <ellipse cx={d * 10} cy={116} rx={120} ry={70} fill="#E8F8FF" opacity={pose.glow * 0.0} />
    {pose.gold > 0.01 && <g>
      <ellipse cx={0} cy={0} rx={140} ry={166} fill="#FFD35A" opacity={pose.gold * 0.3} />
      <path d={`M ${d * 126} -96 Q ${d * 156} 20 ${d * 102} 138`} fill="none" stroke="#FFF0B0" strokeWidth={18} strokeLinecap="round" opacity={pose.gold * 0.9} />
    </g>}
    {/* hat or hair front */}
    {him ? <g>
      <path d="M -150 -52 C -156 -208 -76 -240 0 -240 C 76 -240 156 -208 150 -52 Z" fill={C.hat} />
      <rect x={-156} y={-122} width={312} height={74} rx={30} fill={C.hatLite} />
      {Array.from({length: 11}, (_, i) => <line key={i} x1={-130 + i * 26} y1={-112} x2={-130 + i * 26} y2={-58} stroke={C.hat} strokeWidth={5} opacity={0.6} />)}
      <circle cx={0} cy={-262} r={54} fill={C.snow} />
      <path d="M -10 -304 Q 40 -296 46 -250 Q 10 -280 -10 -304 Z" fill={C.ice} />
    </g> : <g>
      <path d="M -150 -78 Q -140 -196 0 -198 Q 140 -196 150 -78 Q 100 -128 0 -126 Q -100 -128 -150 -78 Z" fill={C.hair} />
      {[-1, 1].map((s) => <path key={s} d={`M ${s * 150} -88 Q ${s * 172} 40 ${s * 140} 158 Q ${s * 110} 130 ${s * 114} -30 Z`} fill={C.hair} />)}
      <path d="M -154 -86 Q 0 -156 154 -86" fill="none" stroke={C.snow} strokeWidth={42} strokeLinecap="round" />
      <g transform="translate(0 -164) rotate(-3)">
        <path d="M -128 8 Q -168 20 -158 62" fill="none" stroke={C.ink} strokeWidth={20} strokeLinecap="round" />
        <path d="M 128 8 Q 168 20 158 62" fill="none" stroke={C.ink} strokeWidth={20} strokeLinecap="round" />
        <rect x={-130} y={-44} width={260} height={86} rx={40} fill={C.ink} />
        <rect x={-114} y={-30} width={228} height={58} rx={30} fill="url(#lens)" />
        <path d="M -70 -26 L -30 -26 L -62 24 L -102 24 Z" fill="#fff" opacity={0.45} />
      </g>
    </g>}
  </g>;
};

// arm: shoulder side -> hand
export const Arm: React.FC<{who: 'him' | 'her'; px: number; py: number; hx: number; hy: number; hand?: number; sc?: number}> = ({who, px, py, hx, hy, hand = 1, sc = 1}) => {
  const him = who === 'him';
  const sx = px + (him ? -176 : 176) * sc, sy = py + 250 * sc;
  const ex = sx + (him ? -40 : 40), ey = (sy + hy) / 2 + 120;
  return <g>
    <path d={`M ${sx} ${sy} Q ${ex} ${ey} ${hx} ${hy}`} fill="none" stroke={him ? C.marigoldDeep : C.ink} strokeWidth={132 * sc * 0.85} strokeLinecap="round" opacity={0.55} />
    <path d={`M ${sx} ${sy} Q ${ex} ${ey} ${hx} ${hy}`} fill="none" stroke={him ? C.marigold : C.pine} strokeWidth={118 * sc * 0.85} strokeLinecap="round" />
    <path d={`M ${sx} ${sy} Q ${ex} ${ey} ${hx} ${hy}`} fill="none" stroke={him ? C.marigoldDeep : C.ink} strokeWidth={118} strokeLinecap="round" opacity={0.0} />
    {him && [0.35, 0.55, 0.75].map((u) => {
      const bx = (1 - u) * (1 - u) * sx + 2 * u * (1 - u) * ex + u * u * hx, by = (1 - u) * (1 - u) * sy + 2 * u * (1 - u) * ey + u * u * hy;
      return <path key={u} d={`M ${bx - 52} ${by - 6} Q ${bx} ${by + 14} ${bx + 52} ${by - 6}`} fill="none" stroke={C.marigoldDeep} strokeWidth={6} opacity={0.8} />;
    })}
    {hand > 0.02 && <><circle cx={hx} cy={hy} r={58 * hand * sc * 0.85} fill={him ? C.hat : C.snow} />
    <circle cx={hx} cy={hy - 14} r={52 * hand * sc * 0.85} fill={him ? C.skinHim : C.skinHer} /></>}
  </g>;
};

export const Phone: React.FC<{x: number; y: number; rot: number; lit: number; p: number; dir: number; s?: number; thumb?: boolean; who: 'him' | 'her'; glowK?: number; halo?: boolean}> = ({x, y, rot, lit, p, dir, s = 1, thumb = true, who, glowK = 1, halo = true}) => {
  const skin = who === 'him' ? C.skinHim : C.skinHer;
  return <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    {halo && lit > 0.02 && <ellipse cx={0} cy={-10} rx={330 * glowK} ry={340 * glowK} fill="url(#phoneGlow)" opacity={Math.min(0.9, lit * 0.95)} />}
    <rect x={-80} y={-150} width={160} height={300} rx={26} fill={C.ink} />
    <rect x={-70} y={-138} width={140} height={276} rx={18} fill={lit > 0.02 ? '#EAF8FF' : '#0F1B2A'} opacity={1} />
    {lit > 0.02 && <g opacity={lit}>
      <rect x={-70} y={-138} width={140} height={276} rx={18} fill="#CFEFFF" opacity={0.6} />
      <g transform={`translate(${dir * p * 140} ${p * -6}) rotate(${dir * p * 14})`} opacity={1 - p * 0.8}><rect x={-52} y={-100} width={104} height={170} rx={16} fill="#fff" /><circle cx={0} cy={-34} r={30} fill="#BCE3F5" /><rect x={-34} y={20} width={68} height={12} rx={6} fill="#BCE3F5" /></g>
    </g>}
    {thumb && <g transform={`translate(${lerp(-18, 18, p) * dir} ${60 - p * 24}) rotate(${-8 * dir})`}><rect x={-20} y={-6} width={40} height={130} rx={20} fill={skin} /></g>}
  </g>;
};

export const NoSignal: React.FC<{x: number; y: number; k: number}> = ({x, y, k}) => {
  if (k <= 0.01) return null;
  const sc = 1 + Math.sin(clamp(k) * Math.PI * 1.5) * Math.exp(-clamp(k) * 3.5) * 0.4;
  return <g transform={`translate(${x} ${y}) scale(${sc})`}>
    <circle r={78} fill={C.ink} opacity={0.25} transform="translate(5 9)" />
    <circle r={78} fill={C.snow} />
    {[0, 1, 2, 3].map((i) => <rect key={i} x={-44 + i * 24} y={30 - (i + 1) * 17} width={17} height={(i + 1) * 17} rx={4} fill={C.ink} opacity={i < 1 ? 1 : 0.35} />)}
    <path d="M -56 -52 L 56 52" stroke={C.red} strokeWidth={12} strokeLinecap="round" />
  </g>;
};

// finger + sleeve poking up from below at (x,y), pointing in direction side
export const FingerHand: React.FC<{who: 'him' | 'her'; x: number; y: number; k: number; s?: number; hover?: number; rot?: number}> = ({who, x, y, k, s = 1, hover = 0, rot}) => {
  if (k <= 0.01) return null;
  const him = who === 'him';
  const ang = rot ?? (him ? 14 : -14);
  const slide = (1 - k) * 460;
  const skin = him ? C.skinHim : C.skinHer;
  return <g transform={`translate(${x - Math.sin((ang * Math.PI) / 180) * slide} ${y + Math.cos((ang * Math.PI) / 180) * slide + hover}) rotate(${ang}) scale(${s})`}>
    <ellipse cx={20} cy={30} rx={70} ry={26} fill="url(#softShadow)" />
    <rect x={-60} y={170} width={120} height={760} rx={46} fill={him ? C.marigold : C.pine} />
    {him ? [260, 370, 480].map((yy) => <path key={yy} d={`M -60 ${yy} Q 0 ${yy + 16} 60 ${yy}`} fill="none" stroke={C.marigoldDeep} strokeWidth={6} />) : <rect x={-60} y={190} width={120} height={22} fill={C.snow} />}
    <rect x={-58} y={150} width={116} height={52} rx={22} fill={him ? C.hat : C.snow} />
    <rect x={-52} y={70} width={104} height={110} rx={44} fill={skin} />
    <rect x={-22} y={-4} width={44} height={150} rx={22} fill={skin} />
    <rect x={-16} y={-4} width={9} height={80} rx={4} fill="#fff" opacity={0.18} />
  </g>;
};

// ---------------------------------------------------------------------------------------------------- strips and cards
const wrap = (text: string, max: number): string[] => {
  const words = text.split(' '), lines: string[] = [];
  let cur = '';
  for (const w of words) { if ((cur + ' ' + w).trim().length > max && cur) { lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); }
  if (cur) lines.push(cur);
  return lines;
};
export const Strip: React.FC<{text: string; y: number; age: number; out: number; variant: 'red' | 'snow'; size?: number}> = ({text, y, age, out, variant, size = 52}) => {
  const lines = text.length <= 26 ? [text] : wrap(text, Math.min(24, Math.ceil(text.length / 2) + 3));
  const wMax = Math.max(...lines.map((l) => l.length)) * size * 0.54 + 150;
  const h = lines.length * size * 1.18 + 52;
  const inK = smooth(age, 0, 0.22), sc = 0.9 + 0.1 * inK + Math.sin(clamp(age / 0.4) * Math.PI) * 0.03;
  const red = variant === 'red';
  const fill = red ? C.red : C.snow, ink = red ? C.snow : C.ink;
  return <g transform={`translate(540 ${y}) scale(${sc})`} opacity={inK * (1 - out)}>
    <rect x={-wMax / 2 + 8} y={-h / 2 + 14} width={wMax} height={h} rx={38} fill={C.ink} opacity={0.3} />
    <rect x={-wMax / 2} y={-h / 2} width={wMax} height={h} rx={38} fill={fill} />
    <rect x={-wMax / 2 + 10} y={-h / 2 + 10} width={wMax - 20} height={h - 20} rx={30} fill="none" stroke={ink} strokeWidth={4} opacity={0.55} />
    <g transform={`translate(${-wMax / 2 + 56} 0)`}><circle r={26} fill={red ? C.snow : C.red} /><path d="M -14 12 L 0 -14 L 14 12 Z" fill={red ? C.red : C.snow} /></g>
    {lines.map((l, i) => <text key={i} x={34} y={(i - (lines.length - 1) / 2) * size * 1.18 + size * 0.34} textAnchor="middle" fontFamily={FONT_PLATE} fontWeight={800} fontSize={size} fill={ink}>{l}</text>)}
  </g>;
};

export const VoteCard: React.FC<{letter: 'A' | 'B'; l1: string; l2: string; x: number; y: number; age: number}> = ({letter, l1, l2, x, y, age}) => {
  const k = smooth(age, 0, 0.3), over = Math.sin(clamp(age / 0.5) * Math.PI) * 0.06;
  if (age < 0) return null;
  const red = letter === 'A';
  return <g transform={`translate(${x} ${y + (1 - k) * 80}) scale(${(0.85 + 0.15 * k) + over})`} opacity={k}>
    <rect x={-228} y={-84} width={468} height={188} rx={40} fill={C.ink} opacity={0.3} transform="translate(8 12)" />
    <rect x={-236} y={-92} width={472} height={188} rx={40} fill={red ? C.red : C.snow} />
    <circle cx={-168} cy={2} r={54} fill={red ? C.snow : C.ink} />
    <text x={-168} y={36} textAnchor="middle" fontFamily={FONT_POSTER} fontSize={92} fill={red ? C.red : C.snow}>{letter}</text>
    <text x={58} y={-10} textAnchor="middle" fontFamily={FONT_POSTER} fontSize={l1.length > 11 ? 50 : 60} fill={red ? C.snow : C.ink}>{l1}</text>
    <text x={58} y={54} textAnchor="middle" fontFamily={FONT_POSTER} fontSize={60} fill={red ? C.snow : C.ink}>{l2}</text>
  </g>;
};

// ---------------------------------------------------------------------------------------------------- sleeve wipe
export const WIPE_DUR = 0.45;
const PX = 540, PY = 2380;
const polar = (deg: number, r: number) => `${(PX + Math.sin((deg * Math.PI) / 180) * r).toFixed(0)},${(PY - Math.cos((deg * Math.PI) / 180) * r).toFixed(0)}`;
export const wipeAngle = (k: number, rev: boolean) => { const e = smooth(k, 0, 1); return rev ? lerp(72, -72, e) : lerp(-72, 72, e); };
export const WipeClip: React.FC<{id: string; k: number; rev?: boolean}> = ({id, k, rev}) => {
  const a = wipeAngle(k, !!rev);
  const pts: string[] = [`${PX},${PY}`];
  if (!rev) { for (let g = -110; g < a; g += 8) pts.push(polar(g, 4200)); pts.push(polar(a, 4200)); }
  else { for (let g = 110; g > a; g -= 8) pts.push(polar(g, 4200)); pts.push(polar(a, 4200)); }
  return <clipPath id={id}><polygon points={pts.join(' ')} /></clipPath>;
};
export const SleeveArm: React.FC<{k: number; rev?: boolean}> = ({k, rev}) => {
  const a = wipeAngle(k, !!rev);
  const lead = rev ? -1 : 1;
  const fog = [polar(a, 4200), polar(a + lead * 16, 4200), `${PX},${PY}`].join(' ');
  return <g>
    <polygon points={fog} fill={C.snow} opacity={0.55} />
    <g transform={`translate(${PX} ${PY}) rotate(${a})`}>
      <rect x={-142} y={-1960} width={284} height={1960} rx={90} fill={C.marigold} transform="translate(14 0)" opacity={0.0} />
      <rect x={-150} y={-1900} width={300} height={1900} rx={80} fill={C.marigold} />
      {Array.from({length: 11}, (_, i) => <path key={i} d={`M -150 ${-i * 170 - 60} Q 0 ${-i * 170 - 36} 150 ${-i * 170 - 60}`} fill="none" stroke={C.marigoldDeep} strokeWidth={9} />)}
      <rect x={-150} y={-1900} width={34} height={1900} fill={C.snow} opacity={0.18} />
      <rect x={-150} y={-1960} width={300} height={90} rx={26} fill={C.hat} />
      {[-110, -55, 0, 55, 110].map((x) => <line key={x} x1={x} y1={-1950} x2={x} y2={-1882} stroke={C.hatLite} strokeWidth={8} opacity={0.7} />)}
      <path d="M -128 -1960 L -128 -2160 Q -128 -2260 -30 -2260 Q 70 -2260 80 -2160 L 80 -1960 Z" fill={C.snow} />
      <path d="M 70 -2090 Q 190 -2110 196 -2010 Q 196 -1960 130 -1960 L 70 -1960 Z" fill={C.snow} />
      <path d="M -128 -2000 L 80 -2000" stroke={C.iceDeep} strokeWidth={8} opacity={0.6} />
    </g>
  </g>;
};
