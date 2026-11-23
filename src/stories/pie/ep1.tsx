import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, lerp, smooth} from '../../lib/motion';
import {MotionBlurWhen} from '../../lib/shots';
import {
  Arm, Beanie, C, COUR, Chalk, Cam, Counter, CrayonCup, CrayonLine, CrayonSprite, Defs, Dispenser, EndCard, Far, Fork, HAND, Mouth, Mug, NapkinPaper, Person, Phone, PieCase,
  Plate, Pose, Slice, Steam, Strip, Sugar, VoteCard, WIPE_DUR, WipeClip, WipeRim, ClockSign, camAt, planeT, textW,
} from './world';
import spec from '../../../specs/stories/pie-ep1.json';

// Pie for Two, part 1 "Last slice". Silent. Frame 1 is fully drawn: ONE strip (the hook), two big faces, both phones lit mid-swipe, her
// napkin "that's my slice." the brightest object, the pie case with one slice. Then: serve, the plate push-back standoff, napkin
// notes, the cream on his ear (payoff), both phones under mugs, the "best bite" macro, "split it? / who gets first bite?", his mug buzzes
// and he lets it. Slice wipe to the vote board, end card.

export const PIE1_FPS = 60;
export const PIE1_FRAMES = Math.round(spec.duration * PIE1_FPS);
export type Hook = 'a' | 'b';
const B = spec.beats;
const WIPE_AT = B.sliceWipe;
const VOTE_AT = WIPE_AT + WIPE_DUR;

type KF = number[];
const kf = (keys: KF[], t: number): number[] => {
  if (t <= keys[0][0]) return keys[0].slice(1);
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) { const a = keys[i - 1], b = keys[i], k = smooth(t, a[0], b[0]); return a.slice(1).map((v, j) => lerp(v, b[j + 1], k)); }
  }
  return keys[keys.length - 1].slice(1);
};
const keyAt = <T,>(list: [number, T][], t: number): T => { let v = list[0][1]; for (const [a, b] of list) if (t >= a) v = b; return v; };
const wp = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const pulse = (t: number, a: number, b: number) => Math.sin(wp(t, a, b) * Math.PI);

// ------------------------------------------------------------------------------------------ shots
type ShotId = 'D' | 'N1' | 'N2' | 'M' | 'P' | 'Q' | 'vote' | 'end';
const SHOTS: [number, ShotId][] = [[0, 'D'], [B.write1 - 0.5, 'N1'], [B.montage, 'D'], [B.buzzBoth, 'P'], [B.biteClose, 'M'], [B.write3 - 0.1, 'N2'], [B.read3, 'D'], [B.mugBuzz, 'Q'], [VOTE_AT, 'vote'], [B.endcard, 'end']];
const shotAt = (t: number): ShotId => keyAt(SHOTS, t);

type Seg = [number, number, [number, number, number], [number, number, number]];
const CAM_SEGS: Seg[] = [
  [0, 3.1, [540, 960, 1.0], [540, 970, 1.035]], [3.1, 5.3, [540, 985, 1.04], [540, 985, 1.0]], [5.3, 8.0, [540, 990, 1.0], [540, 990, 1.035]],
  [11.0, 13.0, [540, 1000, 1.05], [520, 1000, 1.1]], [13.0, 14.6, [540, 905, 1.2], [540, 905, 1.25]], [14.6, 17.6, [540, 1000, 1.0], [540, 1000, 1.045]],
  [B.read3, 22.0, [270, 880, 1.45], [270, 880, 1.5]],
];
const camOf = (t: number): Cam => {
  let seg = CAM_SEGS[0];
  for (const s of CAM_SEGS) if (t >= s[0]) seg = s;
  const k = clamp((t - seg[0]) / (seg[1] - seg[0]));
  return {x: lerp(seg[2][0], seg[3][0], k), y: lerp(seg[2][1], seg[3][1], k), z: lerp(seg[2][2], seg[3][2], k)};
};

// ------------------------------------------------------------------------------------------ poses
const HIM: Record<string, {x: number; y: number; s: number}> = {d: {x: 270, y: 895, s: 1}};
const HER = {x: 810, y: 895, s: 1};
const blinkAt = (t: number, seed: number) => { const ph = (t + seed) % 3.7; return ph < 0.14 ? Math.sin((ph / 0.14) * Math.PI) : 0; };

const HIM_COMMON: KF[] = [[2.1, 0.9, 0.25], [2.5, 0.45, -0.5], [3.3, 0.45, -0.5], [3.6, 0.3, -0.25], [3.95, 0.1, 0.85], [4.6, 0.85, 0.1], [5.3, 0.3, 0.85], [6.2, 0.9, 0.2], [6.9, 0.3, 0.85],
  [7.5, 0.9, 0.2], [8.0, 0.9, 0.2], [11.0, 0.3, 0.85], [12.4, 0.35, 0.85], [12.85, 0.6, -0.2], [13.2, 0.8, 0.1], [14.5, 0.5, 0.8], [14.7, 0.1, 0.9], [15.8, 0.1, 0.9], [16.4, 0.9, 0.2], [17.5, 0.9, 0.3],
  [21.0, 0.9, 0.2], [21.4, 0.2, 0.9], [22.0, 0.2, 0.9], [22.1, 0.0, 0.95], [22.45, 0.0, 0.95], [22.7, 0.95, 0.15]];
const HER_COMMON: KF[] = [[2.1, -0.9, 0.1], [2.5, -0.3, -0.5], [3.3, -0.3, -0.5], [3.6, -0.15, -0.2], [3.95, -0.1, 0.85], [4.6, -0.8, 0.1], [5.3, -0.2, 0.85], [6.2, -0.9, 0.2], [6.9, -0.3, 0.85],
  [7.5, -0.5, 0.7], [8.0, -0.9, 0.2], [11.0, -0.3, 0.85], [12.4, -0.3, 0.85], [12.85, -0.8, -0.2], [13.2, -0.9, 0.1], [14.5, -0.5, 0.8], [14.7, -0.2, 0.9], [15.8, -0.3, 0.9], [16.4, -0.9, 0.2],
  [17.5, -0.8, 0.3], [21.0, -0.9, 0.2], [22.0, -0.9, 0.1], [22.7, -0.9, 0.1]];

const himLook = (t: number, hook: Hook): [number, number] => {
  if (t < 2.1) {
    const keys: KF[] = hook === 'a' ? [[0, 0.05, 0.8], [1.55, 0.05, 0.8], [1.7, 0.9, 0.25]] : [[0, 0.05, 0.8], [0.95, 0.05, 0.8], [1.1, 0.9, 0.05], [1.7, 0.9, 0.05], [1.85, 0.9, 0.25]];
    const [a, b] = kf(keys, t); return [a, b];
  }
  const [a, b] = kf(HIM_COMMON, t); return [a, b];
};
const herLook = (t: number, hook: Hook): [number, number] => {
  if (t < 2.1) {
    const keys: KF[] = hook === 'a' ? [[0, -0.1, 0.75], [0.7, -0.1, 0.75], [0.9, -0.95, 0.1], [1.7, -0.95, 0.1], [1.95, -0.9, 0.1]]
      : [[0, -0.1, 0.75], [0.35, -0.1, 0.75], [0.5, -0.85, 0.6], [1.6, -0.85, 0.6], [1.75, -0.9, 0.1]];
    const [a, b] = kf(keys, t); return [a, b];
  }
  const [a, b] = kf(HER_COMMON, t); return [a, b];
};

const HIM_MOUTH_COMMON: [number, Mouth][] = [[2.1, 'o'], [2.9, 'flat'], [3.9, 'gulp'], [4.3, 'flat'], [5.4, 'smile'], [5.9, 'flat'], [6.4, 'o'], [7.0, 'flat'], [7.2, 'smile'], [7.7, 'o'], [8.1, 'flat'],
  [11.0, 'grit'], [12.5, 'flat'], [12.9, 'o'], [13.3, 'laugh'], [14.4, 'smile'], [14.6, 'flat'], [16.0, 'soft'], [21.3, 'flat'], [21.8, 'gulp'], [22.15, 'flat']];
const HER_MOUTH_COMMON: [number, Mouth][] = [[2.1, 'flat'], [3.6, 'smirk'], [5.4, 'flat'], [6.4, 'soft'], [7.0, 'flat'], [7.7, 'smirk'], [11.0, 'smile'], [12.9, 'o'], [13.3, 'laugh'], [14.4, 'smile'], [15.3, 'smirk'], [22.0, 'smirk']];

const himPose = (t: number, hook: Hook): Pose => {
  const [lx, ly] = himLook(t, hook);
  const breath = 1 + 0.014 * Math.sin(t * 2.3);
  // push anticipation: lean back, then lunge
  const push = (t0: number) => -0.035 * pulse(t, t0 - 0.3, t0) + 0.035 * pulse(t, t0, t0 + 0.4);
  let sq = breath + push(B.push1) + push(B.push3) + 0.03 * pulse(t, 12.6, 12.9);
  let bob = 0, tilt = Math.sin(t * 0.9) * 1.1;
  let mouth: Mouth = t < 2.1 ? (hook === 'a' ? (t >= 1.7 ? 'o' : 'flat') : t >= 1.1 && t < 1.55 ? 'grit' : t >= 1.7 ? 'o' : 'soft') : keyAt(HIM_MOUTH_COMMON, t);
  let sweat = 0, flush = 0;
  if (hook === 'b' && t < 3.0) {
    const fl = pulse(t, 1.1, 1.45);
    sq += 0.07 * Math.sin(wp(t, 1.1, 1.35) * Math.PI) - 0.05 * wp(t, 1.15, 1.3) * (1 - wp(t, 1.3, 1.6));
    bob -= 20 * fl;
    sweat = smooth(t, 1.2, 1.5) * (1 - smooth(t, 2.6, 3.0)) * 0.95;
    flush = smooth(t, 1.1, 1.6) * 0.75;
  } else if (hook === 'a' && t < 3.0) {
    flush = smooth(t, 0.95, 1.5) * 0.8;
  }
  flush = Math.max(flush, smooth(t, 2.0, 2.6) * 0.62) * (t < 3 ? 1 : 1);
  if (t >= 3) flush = 0.62 * (1 - smooth(t, 3, 6) * 0.4) * (1 - 0.35 * smooth(t, 13.6, 14.4)) + 0.2 * smooth(t, 21.3, 21.8);
  if (t >= 2.1 && t < 3) sweat = hook === 'b' ? sweat : 0;
  if (t >= 3.4 && t < 3.9) sweat = 0.3 * pulse(t, 3.4, 3.9);
  if (t >= 20 && t < 22.9) sweat = smooth(t, 21.4, 21.8) * 0.8;
  const L = t >= B.laugh && t < B.buzzBoth - 0.3;
  if (L) { bob = -Math.abs(Math.sin(t * 22)) * 9; tilt = Math.sin(t * 22) * 3; }
  const g = Math.sin(wp(t, B.gulp, B.gulp + 0.42) * Math.PI) + (t > 3.85 && t < 4.2 ? Math.sin(wp(t, 3.85, 4.2) * Math.PI) : 0);
  if (t > B.gulp - 0.1 && t < B.gulp + 0.4) sq += 0.04 * Math.sin(wp(t, B.gulp - 0.1, B.gulp + 0.4) * Math.PI);
  const splat = pulse(t, 12.9, 13.15);
  return {look: [lx, ly], brow: 0.1 + (hook === 'a' && t > 1.7 && t < 2.5 ? 0.5 : 0) + (hook === 'b' && t > 1.1 && t < 1.7 ? 0.9 : 0) + splat * 0.8, worry: sweat * 0.8, mouth, happy: L, sweat, gulp: g, tilt, bob,
    sq, blink: L ? 0 : blinkAt(t, 0.4), flush};
};
const herPose = (t: number, hook: Hook): Pose => {
  const [lx, ly] = herLook(t, hook);
  const breath = 1 + 0.014 * Math.sin(t * 2.0 + 1.3);
  const push = (t0: number) => -0.035 * pulse(t, t0 - 0.3, t0) + 0.035 * pulse(t, t0, t0 + 0.4);
  const sq = breath + push(B.push2) + 0.025 * pulse(t, B.pin, B.pin + 0.3);
  let mouth: Mouth = t < 2.1 ? (hook === 'a' ? (t >= 0.9 ? 'smirk' : 'flat') : t >= 1.5 ? 'smirk' : t >= 0.8 ? 'o' : 'flat') : keyAt(HER_MOUTH_COMMON, t);
  const L = t >= B.laugh && t < B.buzzBoth - 0.3;
  let bob = 0, tilt = Math.sin(t * 0.8 + 2) * 1.2;
  if (L) { bob = -Math.abs(Math.sin(t * 21 + 1)) * 9; tilt = Math.sin(t * 21 + 1) * 3; }
  let brow = 0.1 + (hook === 'b' ? 0.8 * pulse(t, 0.55, 1.4) : 0.3 * pulse(t, 0.85, 1.7));
  if (t >= 2.1) brow = 0.1 + (t > 3.4 && t < 4.6 ? 0.45 : 0) + 0.5 * pulse(t, 21.8, 22.3);
  return {look: [lx, ly], brow, worry: 0, mouth, happy: L, sweat: 0, gulp: 0, tilt, bob, sq, blink: L ? 0 : blinkAt(t, 1.9), flush: 0.0};
};

// ------------------------------------------------------------------------------------------ plate + hands
const X_HER = 690, X_HIM = 390, X_MID = 540, PLATE_Y = 1140;
const MONT: [number, number][] = [[11.0, X_HIM], [11.3, X_HER], [11.6, X_HIM], [11.9, X_HER], [12.2, X_HIM]];
const plateX = (t: number): number => {
  const mv = (t0: number, d: number, a: number, b: number) => lerp(a, b, smooth(t, t0, t0 + d));
  if (t < B.push1) return X_MID;
  if (t < B.push2) return mv(B.push1, 0.45, X_MID, X_HER);
  if (t < B.push3) return mv(B.push2, 0.45, X_HER, X_HIM);
  if (t < 11.0) return mv(B.push3, 0.45, X_HIM, X_HER);
  if (t < 12.2 + 0.3) { let from = X_HER; for (const [t0, to] of MONT) { if (t >= t0) { return lerp(from, to, smooth(t, t0, t0 + 0.27)); } from = to; } }
  if (t < 14.1) return X_HIM;
  return mv(14.1, 0.35, X_HIM, X_MID);
};
const FLY0 = 12.6, FLY1 = 12.9;
const EAR = {x: 270 + 126, y: 895 - 166};

const HIM_REST = {x: 300, y: 1136}, HER_REST = {x: 780, y: 1136};

type Pt = {x: number; y: number};
const hold = (t: number, who: 'him' | 'her'): number => {
  const v = (plateX(t + 0.12) - plateX(t - 0.12));
  return who === 'him' ? clamp(v / 50) : clamp(-v / 50);
};

const phoneSwipe = (ticks: number[], t: number, until: number) => {
  let idx = -1;
  for (let i = 0; i < ticks.length; i++) if (ticks[i] <= t && ticks[i] < until) idx = i;
  if (idx < 0) return {p: 0, dir: 1, on: false};
  const p = (t - ticks[idx]) / 0.26;
  if (p > 1) return {p: 0, dir: 1, on: false};
  return {p: clamp(p), dir: idx % 2 ? -1 : 1, on: true};
};
const HIM_TICKS = [-0.1, ...spec.audio.swipeTicks];
const HER_TICKS = [-0.18, 0.33, 0.62, 0.93, 1.22];
const LOW0 = 2.6, LOW1 = 3.1;
const HIM_FLAT = {x: 170, y: 1152, s: 0.9}, HER_FLAT = {x: 910, y: 1152, s: 0.9};

const himPhone = (t: number, hook: Hook) => {
  const sw = phoneSwipe(HIM_TICKS, t, hook === 'a' ? 1.7 : 1.05);
  let pos = {x: 262, y: 972, rot: -3, s: 0.9, lit: 1};
  if (hook === 'b' && t > 1.1) { const k = smooth(t, 1.1, 1.45); pos = {x: lerp(262, 292, k), y: lerp(972, 1040, k), rot: lerp(-3, 34, k), s: lerp(0.9, 0.78, k), lit: lerp(1, 0.55, k)}; }
  const k2 = smooth(t, LOW0, LOW1);
  const lit = t < LOW0 ? pos.lit : lerp(pos.lit, 0.5, k2);
  const buzz = t > B.buzzBoth && t < B.buzzBoth + 0.4;
  const jit = buzz ? Math.sin(t * 90) * 6 * (1 - wp(t, B.buzzBoth, B.buzzBoth + 0.4)) : 0;
  return {x: lerp(pos.x, HIM_FLAT.x, k2) + jit, y: lerp(pos.y, HIM_FLAT.y, k2), rot: lerp(pos.rot, 0, k2), s: lerp(pos.s, HIM_FLAT.s, k2), flat: k2, lit: buzz ? 1 : lit, p: sw.p, dir: sw.dir, thumb: sw.on ? 1 : 0};
};
const herPhone = (t: number) => {
  const sw = phoneSwipe(HER_TICKS, t, 1.45);
  const k2 = smooth(t, LOW0, LOW1);
  const buzz = (t > B.buzzBoth && t < B.buzzBoth + 0.4);
  const jit = buzz ? Math.sin(t * 90 + 2) * 6 * (1 - wp(t, B.buzzBoth, B.buzzBoth + 0.4)) : 0;
  return {x: lerp(512, HER_FLAT.x, k2) + jit, y: lerp(990, HER_FLAT.y, k2), rot: lerp(6, 0, k2), s: lerp(0.74, HER_FLAT.s, k2), flat: k2, lit: buzz ? 1 : lerp(1, 0.5, k2), p: sw.p, dir: sw.dir, thumb: sw.on ? 1 : 0};
};

// mugs fly onto the phones (landing = the clunk)
const MUG_HIS = {x: 622, y: 1022}, MUG_HERS = {x: 775, y: 1022};
const mugState = (t: number, land: number, from: Pt, to: Pt, flip: number) => {
  const k = wp(t, land - 0.4, land);
  if (t < land - 0.4) return {x: from.x, y: from.y, rot: 0, done: false};
  const e = k * k * (3 - 2 * k);
  const up = Math.sin(e * Math.PI) * 150;
  const bounce = t > land ? Math.sin(wp(t, land, land + 0.18) * Math.PI) * 6 * (1 - wp(t, land, land + 0.18)) : 0;
  return {x: lerp(from.x, to.x, e), y: lerp(from.y, to.y, e) - up - bounce, rot: 180 * e * flip, done: k >= 1};
};
const MUG_LAND_HIS: Pt = {x: HIM_FLAT.x, y: 1128}, MUG_LAND_HERS: Pt = {x: HER_FLAT.x, y: 1128};

const Waitress: React.FC<{t: number}> = ({t}) => {
  const up = smooth(t, 3.15, 3.5) * (1 - smooth(t, 4.2, 4.6));
  if (up < 0.01) return null;
  const y = 735 + (1 - up) * 430;
  const SK = '#E8B590';
  return <g transform={`translate(540 ${y}) scale(0.92)`}>
    <path d="M -200 330 L -200 110 Q -196 -14 -96 -34 L 96 -34 Q 196 -14 200 110 L 200 330 Z" fill={C.mintUni} stroke={C.ink} strokeWidth={9} strokeLinejoin="round" />
    <path d="M -84 -28 L 84 -28 L 104 330 L -104 330 Z" fill={C.cream} stroke={C.ink} strokeWidth={8} strokeLinejoin="round" />
    <path d="M -76 -30 L 0 44 L 76 -30" fill="#fff" stroke={C.ink} strokeWidth={7} strokeLinejoin="round" />
    <g transform="translate(-52 170) rotate(-6)"><rect x={-40} y={-50} width={80} height={104} rx={8} fill="#FFFDF6" stroke={C.ink} strokeWidth={6} />
      {[-26, -8, 10, 28].map((yy, i) => <line key={i} x1={-26} y1={yy} x2={26} y2={yy} stroke="#9BB" strokeWidth={4} />)}
      <rect x={-6} y={-90} width={12} height={70} rx={4} fill={C.pumpkin} stroke={C.ink} strokeWidth={5} /></g>
    <rect x={-42} y={-80} width={84} height={60} fill={SK} stroke={C.ink} strokeWidth={7} />
    <ellipse cx={0} cy={-172} rx={102} ry={126} fill={SK} stroke={C.ink} strokeWidth={9} />
    <path d="M -106 -170 C -120 -306 -30 -318 0 -312 C 40 -318 120 -296 106 -170 C 84 -228 40 -244 0 -240 C -46 -244 -88 -228 -106 -170 Z" fill="#5A4636" stroke={C.ink} strokeWidth={9} strokeLinejoin="round" />
    <circle cx={0} cy={-330} r={46} fill="#5A4636" stroke={C.ink} strokeWidth={8} />
    {[-1, 1].map((sd) => <g key={sd} transform={`translate(${sd * 40} -164)`}>
      <ellipse cx={0} cy={0} rx={24} ry={28} fill="#fff" stroke={C.ink} strokeWidth={6} />
      <circle cx={sd * 3} cy={8} r={12} fill={C.ink} />
      <path d="M -28 -4 L 28 -4 L 28 -32 L -28 -32 Z" fill={SK} />
      <path d="M -28 -4 L 28 -4" stroke={C.ink} strokeWidth={7} strokeLinecap="round" />
      <path d="M -28 -40 L 28 -42" stroke={C.ink} strokeWidth={9} strokeLinecap="round" />
    </g>)}
    <path d="M -20 -90 L 20 -90" stroke={C.ink} strokeWidth={7} strokeLinecap="round" />
  </g>;
};

const Exclaim: React.FC<{x: number; y: number; k: number}> = ({x, y, k}) => {
  const sp = k <= 0 ? 0 : 1 + Math.sin(clamp(k) * Math.PI * 1.5) * Math.exp(-clamp(k) * 4.2) * 0.45;
  const pts = Array.from({length: 16}, (_, i) => { const a = (i / 16) * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 46 : 78; return `${Math.cos(a) * r},${Math.sin(a) * r}`; }).join(' ');
  return <g transform={`translate(${x} ${y}) scale(${sp}) rotate(8)`}>
    <polygon points={pts} fill={C.ink} transform="translate(5 7)" opacity={0.35} /><polygon points={pts} fill={C.pumpkin} stroke={C.ink} strokeWidth={7} strokeLinejoin="round" />
    <text x={0} y={34} textAnchor="middle" fontFamily={'"Anton", sans-serif'} fontSize={92} fill={C.ink}>!</text>
  </g>;
};

const BuzzMarks: React.FC<{x: number; y: number; k: number}> = ({x, y, k}) => k <= 0 || k >= 1 ? null : <g transform={`translate(${x} ${y})`} opacity={1 - k} stroke={C.ink} strokeWidth={7} strokeLinecap="round" fill="none">
  {[-1, 1].map((sd) => <g key={sd}><path d={`M ${sd * 110} -70 Q ${sd * 140} -40 ${sd * 110} -10`} /><path d={`M ${sd * 140} -90 Q ${sd * 190} -40 ${sd * 140} 10`} /></g>)}
</g>;

// ------------------------------------------------------------------------------------------ the counter scene
const Diner: React.FC<{t: number; hook: Hook}> = ({t, hook}) => {
  const cam = camOf(t);
  const him = himPose(t, hook), her = herPose(t, hook);
  const hp = himPhone(t, hook), rp = herPhone(t);
  const pX = plateX(t);
  const wUp = smooth(t, 3.15, 3.5) * (1 - smooth(t, 4.2, 4.6));

  // plate carried by the waitress
  const carry = smooth(t, B.serve, B.plateDown);
  const showPlate = true;
  const land = t > B.plateDown ? Math.sin(wp(t, B.plateDown, B.plateDown + 0.2) * Math.PI) * 7 * (1 - wp(t, B.plateDown, B.plateDown + 0.2)) : 0;
  const plate = t < B.plateDown
    ? {x: 540, y: lerp(752, PLATE_Y, carry), s: lerp(0.78, 1, carry)}
    : {x: pX, y: PLATE_Y - land - 12 * pulse(t, FLY0, FLY0 + 0.2), s: 1};
  const sp = Math.abs(plateX(t + 0.03) - plateX(t - 0.03));
  const dollop = t >= FLY0 ? 0 : 1;
  const wob = t >= 12.2 && t < FLY0 ? Math.sin(t * 46) * (0.4 + (t - 12.2)) : Math.sin(t * 40) * Math.min(1, sp / 6) * 0.8;
  const fork = t >= B.pin - 0.3 && t < B.pull + 0.2;

  // hands
  const hhw = hold(t, 'him'), hrw = hold(t, 'her');
  let himHand: Pt = {x: lerp(HIM_REST.x, plate.x - 150, hhw), y: lerp(HIM_REST.y, 1138, hhw)};
  let herHand: Pt = {x: lerp(HER_REST.x, plate.x + 150, hrw), y: lerp(HER_REST.y, 1138, hrw)};
  const heldK = 1 - smooth(t, LOW0, LOW1 + 0.4);
  if (t < LOW1 + 0.4) {
    const hh: Pt = {x: hp.x - 34 * (1 - hp.flat), y: hp.y + 104 * hp.s * (1 - hp.flat * 0.5)};
    himHand = {x: lerp(himHand.x, hh.x, Math.max(heldK, t < LOW1 ? 1 : 0)), y: lerp(himHand.y, hh.y, Math.max(heldK, t < LOW1 ? 1 : 0))};
    const nap = napkinHeld(t, hook);
    const rh: Pt = {x: nap.x + 128, y: nap.y + 120};
    herHand = {x: lerp(herHand.x, rh.x, heldK), y: lerp(herHand.y, rh.y, heldK)};
  }
  // payoff: she pulls a napkin and hands it over, he takes it and wipes his ear while they laugh
  const herE = smooth(t, 13.3, 13.5) * (1 - smooth(t, 13.9, 14.1));
  const herT = {x: lerp(690, 535, smooth(t, 13.5, 13.8)), y: lerp(1050, 1005, smooth(t, 13.5, 13.8))};
  herHand = {x: lerp(herHand.x, herT.x, herE), y: lerp(herHand.y, herT.y, herE)};
  const hisE = smooth(t, 13.7, 13.9) * (1 - smooth(t, 14.4, 14.6));
  const wig = smooth(t, 14.2, 14.3) * (1 - smooth(t, 14.45, 14.55));
  const hisT = {x: lerp(470, 410, smooth(t, 14.0, 14.2)) + Math.sin(t * 34) * 14 * wig, y: lerp(1005, 770, smooth(t, 14.0, 14.2)) + Math.sin(t * 31) * 7 * wig};
  himHand = {x: lerp(himHand.x, hisT.x, hisE), y: lerp(himHand.y, hisT.y, hisE)};
  const napK = smooth(t, 13.85, 14.0);
  const napPos = {x: lerp(herT.x, hisT.x, napK), y: lerp(herT.y, hisT.y, napK)};
  // fork pin
  const forkK = smooth(t, B.pin - 0.3, B.pin);
  const forkP = {x: plate.x + 70, y: lerp(820, 1075, forkK), rot: lerp(205, 196, forkK)};
  const forkEndX = forkP.x + Math.sin(((forkP.rot - 180) * Math.PI) / 180) * 0, fx = forkP.x - Math.sin((forkP.rot * Math.PI) / 180) * 200 * 0.9, fy = forkP.y + Math.cos((forkP.rot * Math.PI) / 180) * 200 * 0.9;
  if (fork) herHand = {x: lerp(herHand.x, fx, smooth(t, B.pin - 0.4, B.pin - 0.2)), y: lerp(herHand.y, fy, smooth(t, B.pin - 0.4, B.pin - 0.2))};
  // mugs
  const mh = mugState(t, B.mugHis, MUG_HIS, MUG_LAND_HIS, 1);
  const mr = mugState(t, B.mugHers, MUG_HERS, MUG_LAND_HERS, -1);
  const mrHand = t > B.mugHers - 0.55 && t < B.mugHers + 0.35;
  if (mrHand) { const e = smooth(t, B.mugHers - 0.55, B.mugHers - 0.4) * (1 - smooth(t, B.mugHers + 0.05, B.mugHers + 0.35)); herHand = {x: lerp(herHand.x, mr.x + 60, e), y: lerp(herHand.y, mr.y - 20, e)}; }
  const mhHand = t > B.mugHis - 0.55 && t < B.mugHis + 0.35;
  if (mhHand) { const e = smooth(t, B.mugHis - 0.55, B.mugHis - 0.4) * (1 - smooth(t, B.mugHis + 0.05, B.mugHis + 0.35)); himHand = {x: lerp(himHand.x, mh.x - 60, e), y: lerp(himHand.y, mh.y - 20, e)}; }
  // mug buzz at the cliff
  const bz = (t0: number, a: number) => (t >= t0 && t < t0 + 0.2 ? Math.sin(t * 120) * a * (1 - wp(t, t0, t0 + 0.2)) : 0);
  const mugBuzzX = bz(B.mugBuzz, 7) + bz(B.mugBuzz + 0.2, 5);
  const leakHis = t >= B.mugHis ? 0.75 + 0.25 * pulse(t, B.mugBuzz, B.mugBuzz + 0.25) : 0;

  // dollop flight + cream on the ear
  const fk = wp(t, FLY0, FLY1);
  const dStart: Pt = {x: X_HIM + 38, y: PLATE_Y - 66};
  const dollopFly = t >= FLY0 && t < FLY1 ? {x: lerp(dStart.x, EAR.x + 4, fk), y: lerp(dStart.y, EAR.y + 16, fk) - Math.sin(fk * Math.PI) * 190, r: fk * 540} : null;
  const cream = t >= FLY1 ? clamp(1 - smooth(t, 14.2, 14.5)) * (1 + 0.18 * pulse(t, FLY1, FLY1 + 0.18)) : 0;

  const napH = napkinHeld(t, hook);
  const showNapHeld = t < LOW1 + 0.4;
  const steamT = t;
  const burst = hook === 'b' && t >= 0.8 && t < 1.95;
  const clunkHis = t >= B.mugHis, clunkHers = t >= B.mugHers;
  const pull = t >= 13.4 - 0.1 && t < 13.4 + 0.4 ? pulse(t, 13.4 - 0.1, 13.4 + 0.4) : 0;
  const wipeNap = t >= 13.4 && t < 14.55;

  return <g>
    <g transform={planeT(cam, 0.3)}><Far t={t} /></g>
    <g transform={planeT(cam, 0.55)}>
      <PieCase open={smooth(t, B.caseOpen, B.caseOpen + 0.3)} slice={false} t={t} />
      <ClockSign x={540} y={522} />
    </g>
    <g transform={planeT(cam, 0.9)}>
      <Beanie x={1018} y={990} />
      <Waitress t={t} />
      <Person who="him" x={HIM.d.x} y={HIM.d.y} pose={him} />
      <Person who="her" x={HER.x} y={HER.y} pose={her} />
      <Counter />
      <CrayonCup x={385} y={1078} />
      <Dispenser x={680} y={1070} pull={pull} />
      {cream > 0.01 && t < 14.4 && null}
      {mh.rot === 0 && <Mug x={mh.x} y={mh.y} />}
      {mr.rot === 0 && <Mug x={mr.x} y={mr.y} />}
      {showPlate && <Plate x={plate.x} y={plate.y} s={plate.s} dollop={dollop} wob={wob} />}
      {t >= 3.2 && t < 4.6 && <g><path d={`M ${690} ${835 + (1 - wUp) * 430} Q ${plate.x + 200} ${plate.y - 120} ${plate.x + 110} ${plate.y + 6}`} fill="none" stroke={C.ink} strokeWidth={92} strokeLinecap="round" /><path d={`M ${690} ${835 + (1 - wUp) * 430} Q ${plate.x + 200} ${plate.y - 120} ${plate.x + 110} ${plate.y + 6}`} fill="none" stroke={C.mintUni} strokeWidth={78} strokeLinecap="round" /><circle cx={plate.x + 112} cy={plate.y + 8} r={40} fill="#E8B590" stroke={C.ink} strokeWidth={7} /></g>}
      {fork && <Fork x={forkP.x} y={forkP.y} rot={forkP.rot} s={0.9} />}
      {/* phones */}
      <Phone id="him" x={hp.x} y={hp.y} rot={hp.rot} scale={hp.s} lit={hp.lit} p={hp.p} dir={hp.dir} thumb={hp.thumb} flat={hp.flat} skin={C.skinHim} />
      <Phone id="her" x={rp.x} y={rp.y} rot={rp.rot} scale={rp.s} lit={rp.lit} p={rp.p} dir={rp.dir} thumb={rp.thumb} flat={rp.flat} caseColor={C.pink} skin={C.skinHer} />
      <BuzzMarks x={hp.x} y={hp.y - 20} k={wp(t, B.buzzBoth, B.buzzBoth + 0.3)} />
      <BuzzMarks x={rp.x} y={rp.y - 20} k={wp(t, B.buzzBoth + 0.2, B.buzzBoth + 0.5)} />
      {mh.rot !== 0 && !mh.done && <Mug x={mh.x + (mh.done ? mugBuzzX : 0)} y={mh.y} rot={mh.rot} />}
      {mr.rot !== 0 && !mr.done && <Mug x={mr.x} y={mr.y} rot={mr.rot} />}
      {t >= B.mugBuzz && t < B.ignore + 0.3 && <BuzzMarks x={MUG_LAND_HIS.x} y={1110} k={wp(t, B.mugBuzz, B.mugBuzz + 0.3) % 1} />}
      {t >= B.mugBuzz + 0.2 && t < B.ignore + 0.3 && <BuzzMarks x={MUG_LAND_HIS.x} y={1110} k={wp(t, B.mugBuzz + 0.2, B.mugBuzz + 0.5)} />}
      {/* arms (over the counter) */}
      {t < LOW1 + 0.5 && <Arm who="her" sx={690} sy={1020} hx={rp.x + 28} hy={rp.y + 96 * rp.s * (1 - rp.flat * 0.4)} />}
      <Arm who="him" sx={-70} sy={1100} hx={himHand.x} hy={himHand.y} />
      <Arm who="her" sx={1150} sy={1100} hx={herHand.x} hy={herHand.y} />
      {/* light leaking from under the mug rims */}
      {clunkHis && <g opacity={leakHis}><ellipse cx={MUG_LAND_HIS.x} cy={1170} rx={200} ry={90} fill="url(#haloCool)" /><ellipse cx={MUG_LAND_HIS.x} cy={1192} rx={112} ry={14} fill="#FFFFFF" /><ellipse cx={MUG_LAND_HIS.x} cy={1212} rx={165} ry={34} fill="#E4FAFF" filter="url(#blurSh)" /><ellipse cx={MUG_LAND_HIS.x} cy={1206} rx={120} ry={14} fill="#FFFFFF" /></g>}
      {clunkHers && <g opacity={0.8}><ellipse cx={MUG_LAND_HERS.x} cy={1170} rx={200} ry={90} fill="url(#haloCool)" /><ellipse cx={MUG_LAND_HERS.x} cy={1192} rx={112} ry={14} fill="#FFFFFF" /><ellipse cx={MUG_LAND_HERS.x} cy={1212} rx={165} ry={34} fill="#E4FAFF" filter="url(#blurSh)" /><ellipse cx={MUG_LAND_HERS.x} cy={1206} rx={120} ry={14} fill="#FFFFFF" /></g>}
      {mh.done && <Mug x={mh.x + mugBuzzX} y={mh.y} rot={mh.rot} />}
      {mr.done && <Mug x={mr.x} y={mr.y} rot={mr.rot} />}
      {/* her napkin, held up */}
      {showNapHeld && <NapkinPaper w={470} h={340} x={napH.x} y={napH.y} rot={napH.rot} scale={napH.s} id="held" glowA={t < 2.5 ? 1 : 0}>
        <text x={0} y={-6} textAnchor="middle" fontFamily={HAND} fontWeight={700} fontSize={98} fill={C.cran} stroke={C.cran} strokeWidth={3} filter="url(#rough)">that's my</text>
        <text x={0} y={104} textAnchor="middle" fontFamily={HAND} fontWeight={700} fontSize={118} fill={C.cran} stroke={C.cran} strokeWidth={3} filter="url(#rough)">slice.</text>
      </NapkinPaper>}
      {t >= B.read3 && t < 22.0 && <NapkinPaper w={520} h={330} x={300} y={1030} rot={-5} scale={0.72} id="face" glowA={0.6}>
        <text x={0} y={-24} textAnchor="middle" fontFamily={HAND} fontWeight={700} fontSize={104} fill={C.cran} stroke={C.cran} strokeWidth={3} filter="url(#rough)">split it?</text>
        <text x={0} y={92} textAnchor="middle" fontFamily={HAND} fontWeight={700} fontSize={62} fill={C.cran} stroke={C.cran} strokeWidth={2} filter="url(#rough)">who gets first bite?</text>
      </NapkinPaper>}
      {/* wiped-off napkin in his hand */}
      {wipeNap && <NapkinPaper w={120} h={96} x={napPos.x + 16} y={napPos.y - 30} rot={-12} id="wipe" />}
      {/* cream */}
      {dollopFly && <g transform={`translate(${dollopFly.x} ${dollopFly.y}) rotate(${dollopFly.r})`}>
        <circle cx={-14} cy={-6} r={24} fill={C.ink} /><circle cx={16} cy={-4} r={23} fill={C.ink} /><circle cx={0} cy={-22} r={24} fill={C.ink} />
        <circle cx={-14} cy={-6} r={20} fill={C.cream} /><circle cx={16} cy={-4} r={19} fill={C.cream} /><circle cx={0} cy={-22} r={20} fill={C.cream} />
      </g>}
      {cream > 0.01 && <g transform={`translate(${EAR.x + 6} ${EAR.y + 14}) scale(${cream})`}>
        <circle cx={0} cy={0} r={34} fill={C.ink} /><circle cx={22} cy={22} r={22} fill={C.ink} /><circle cx={-6} cy={-26} r={22} fill={C.ink} />
        <circle cx={0} cy={0} r={29} fill={C.cream} /><circle cx={22} cy={22} r={17} fill={C.cream} /><circle cx={-6} cy={-26} r={17} fill={C.cream} />
        <path d="M -12 -6 Q 0 -16 12 -4" fill="none" stroke="#E4D2B0" strokeWidth={5} strokeLinecap="round" />
      </g>}
      {t >= B.laugh && t < 14.4 && <g stroke={C.ink} strokeWidth={7} strokeLinecap="round" fill="none" opacity={0.9}>
        {[-1, 1].map((sd) => <path key={sd} d={`M ${HIM.d.x + 130} ${HIM.d.y - 340 + sd * 18} l ${sd * 10} -22`} opacity={0} />)}
      </g>}
      {burst && <Exclaim x={968} y={600} k={wp(t, 0.8, 1.2)} />}
    </g>
    <g transform={planeT(cam, 1.35)}>
      <Sugar x={-70} y={1360} s={0.8} />
      <Steam x={1040} y={1290} t={steamT} />
    </g>
  </g>;
};

function napkinHeld(t: number, hook: Hook) {
  const dip = hook === 'a' ? 34 * (smooth(t, 0.85, 1.05) * (1 - smooth(t, 1.85, 2.2))) : 0;
  const k = smooth(t, 2.5, LOW1);
  return {x: lerp(832, 905, k), y: lerp(1012 + dip, 1160, k), rot: lerp(5, -8, k), s: lerp(1, 0.4, k)};
}

// ------------------------------------------------------------------------------------------ whole-frame napkins
const InsertBG: React.FC<{t: number}> = ({t}) => <g>
  <g filter="url(#blurSoft)"><Far t={t} /><rect x={-200} y={1010} width={1500} height={900} fill="#79B8A4" /></g>
  <rect x={-100} y={-100} width={1300} height={2200} fill={C.ink} opacity={0.45} />
</g>;

const fitW = (txt: string, size: number, maxW: number) => Math.min(size, size * maxW / textW(txt, `700 ${size}px ${HAND}`));

const NapkinInsert: React.FC<{t: number; kind: 'N1' | 'N2'}> = ({t, kind}) => {
  const W = kind === 'N2' ? 920 : 840;
  if (kind === 'N1') {
    const t0 = B.write1 - 0.5;
    const k = smooth(t, t0, t0 + 0.3);
    const x = lerp(1500, 540, k) + 0, rot = lerp(14, -2, k);
    const s1 = fitW('you first.', 160, 680), s2 = fitW('NO. YOU.', 150, 680);
    const p1 = wp(t, B.write1, 9.6), p2 = wp(t, B.write2, 10.8);
    const w1 = textW('you first.', `700 ${s1}px ${HAND}`), w2 = textW('NO. YOU.', `700 ${s2}px ${HAND}`);
    const pull = t < t0 + 0.4;
    return <g>
      <InsertBG t={t} />
      <NapkinPaper w={W} h={560} x={x} y={760} rot={rot} id="n1" glowA={0.9}>
        <CrayonLine txt="you first." x={0} y={-60} size={s1} color={C.cran} p={p1} />
        <CrayonLine txt="NO. YOU." x={0} y={112} size={s2} color={C.pumpkin} p={p2} />
        {p1 > 0 && p1 < 1 && <CrayonSprite x={-w1 / 2 + w1 * p1 + 6} y={-70} color={C.cran} skin={C.skinHer} sleeve={C.cran} />}
        {p2 > 0 && p2 < 1 && <CrayonSprite x={-w2 / 2 + w2 * p2 + 6} y={102} color={C.pumpkin} skin={C.skinHim} sleeve={C.rust} />}
      </NapkinPaper>
    </g>;
  }
  const t0 = B.write3 - 0.1;
  const s2 = fitW('who gets first bite?', 160, 800), s1 = s2;
  const p1 = wp(t, B.write3, 19.6), p2 = wp(t, 19.7, 20.45);
  const w1 = textW('split it?', `700 ${s1}px ${HAND}`), w2 = textW('who gets first bite?', `700 ${s2}px ${HAND}`);
  const slide = smooth(t, B.slide3, B.slide3 + 0.35);
  const k = smooth(t, t0, t0 + 0.25);
  const x = lerp(1500, 540, k) - slide * 150, rot = lerp(12, -2, k) - slide * 5;
  return <g>
    <InsertBG t={t} />
    <NapkinPaper w={W} h={560} x={x} y={760} rot={rot} id="n2" glowA={0.9}>
      <CrayonLine txt="split it?" x={0} y={-50} size={s1} color={C.cran} p={p1} />
      <CrayonLine txt="who gets first bite?" x={0} y={116} size={s2} color={C.cran} p={p2} />
      {p1 > 0 && p1 < 1 && <CrayonSprite x={-w1 / 2 + w1 * p1 + 6} y={-60} color={C.cran} skin={C.skinHer} sleeve={C.cran} />}
      {p2 > 0 && p2 < 1 && <CrayonSprite x={-w2 / 2 + w2 * p2 + 6} y={106} color={C.cran} skin={C.skinHer} sleeve={C.cran} />}
    </NapkinPaper>
  </g>;
};

// ------------------------------------------------------------------------------------------ macro: the best bite
const Macro: React.FC<{t: number}> = ({t}) => {
  const a = t - B.biteClose;
  const hover = Math.sin(t * 5) * 6;
  const tink = pulse(t, B.fork - 0.12, B.fork + 0.15);
  const fy = lerp(300, 790, smooth(t, B.biteClose, B.fork - 0.05)) + hover * (1 - tink) + tink * 20;
  const fr = lerp(-206, -196, smooth(t, B.biteClose, B.fork));
  const fx = lerp(840, 590, smooth(t, B.biteClose, B.fork - 0.05));
  const p0 = wp(t, 17.7, 17.95), p1 = wp(t, 17.9, 18.2);
  const lw = textW('best bite', `700 140px ${HAND}`);
  const ang = (fr * Math.PI) / 180;
  const hx = fx - Math.sin(ang) * 200 * 1.8, hy = fy + Math.cos(ang) * 200 * 1.8;
  return <g>
    <g filter="url(#blurSoft)"><Far t={t} /></g>
    <rect x={-100} y={-100} width={1300} height={2200} fill={C.ink} opacity={0.2} />
    <rect x={-200} y={900} width={1500} height={1100} fill="url(#counterTop)" stroke={C.ink} strokeWidth={9} />
    <Plate x={560} y={1090} s={2.55} dollop={1} />
    <g>
      <Arm who="her" sx={hx + 150} sy={-260} hx={hx + 4} hy={hy - 8} w={120} />
      <Fork x={fx} y={fy} rot={fr} s={1.8} />
    </g>
    {/* crayon label, her cranberry, with an arrow to the pointy end */}
    <g>
      <path d="M 300 705 Q 205 830 250 1010" fill="none" stroke="#fff" strokeWidth={22} strokeLinecap="round" strokeDasharray={`${p0 * 420} 600`} />
      <path d="M 232 944 L 250 1018 L 300 962" fill="none" stroke="#fff" strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" opacity={p0 > 0.9 ? 1 : 0} />
      <path d="M 300 705 Q 205 830 250 1010" fill="none" stroke={C.cran} strokeWidth={11} strokeLinecap="round" strokeDasharray={`${p0 * 420} 600`} filter="url(#rough)" />
      <path d="M 232 944 L 250 1018 L 300 962" fill="none" stroke={C.cran} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" opacity={p0 > 0.9 ? 1 : 0} />
      <clipPath id="bbClip"><rect x={300 - lw * 0.7} y={470} width={lw * 1.4 * p1 + 0.01} height={300} /></clipPath>
      <g clipPath="url(#bbClip)" filter="url(#rough)">
        <text x={300} y={640} textAnchor="middle" fontFamily={HAND} fontWeight={700} fontSize={140} fill={C.cran} stroke="#fff" strokeWidth={20} strokeLinejoin="round" paintOrder="stroke">best bite</text>
      </g>
    </g>
  </g>;
};

// ------------------------------------------------------------------------------------------ close-ups: phones into mugs, the buzz
const CloseBG: React.FC<{t: number; top?: number; bare?: boolean}> = ({t, top = 800, bare = false}) => <g>
  {!bare && <g filter="url(#blurSoft)"><Far t={t} /><rect x={-200} y={880} width={1500} height={400} fill="#6FB3A0" /></g>}
  {!bare && <rect x={-100} y={-100} width={1300} height={2200} fill={C.ink} opacity={0.3} />}
  <rect x={-200} y={top} width={1480} height={1250 - top} fill="url(#counterTop)" stroke={C.ink} strokeWidth={SW9} />
  {Array.from({length: 16}, (_, i) => <g key={i} transform={`translate(${(i * 131) % 1100} ${840 + ((i * 59) % 380)}) rotate(${(i * 37) % 80})`} opacity={0.5}><path d="M 0 0 L 26 7 L 8 20 Z" fill="#E8FFF6" /><circle cx={34} cy={5} r={3} fill={C.mintDeep} /></g>)}
  <rect x={-200} y={1250} width={1480} height={40} fill="url(#chromeG)" stroke={C.ink} strokeWidth={SW9} />
  <rect x={-200} y={1290} width={1480} height={700} fill={C.tealLite} stroke={C.ink} strokeWidth={SW9} />
</g>;
const SW9 = 9;

const PhoneBack: React.FC<{caseColor: string; glow: number}> = ({caseColor, glow}) => <g>
  <ellipse cx={0} cy={0} rx={330} ry={330} fill="url(#haloCool)" opacity={glow} />
  <rect x={-82} y={-148} width={164} height={296} rx={30} fill="none" stroke="#DFF7FF" strokeWidth={14} opacity={glow} />
  <rect x={-80} y={-146} width={160} height={292} rx={30} fill={caseColor} stroke={C.ink} strokeWidth={8} />
  <rect x={-62} y={-128} width={62} height={62} rx={16} fill="#00000033" stroke={C.ink} strokeWidth={5} />
  <circle cx={-44} cy={-110} r={11} fill="#111" stroke={C.ink} strokeWidth={3} /><circle cx={-18} cy={-84} r={11} fill="#111" stroke={C.ink} strokeWidth={3} />
  <path d="M 38 -110 L 38 100" stroke="#fff" strokeWidth={7} opacity={0.3} strokeLinecap="round" />
</g>;

const FlipPhone: React.FC<{x: number; y: number; s: number; k: number; lit: number; caseColor: string; id: string; skin: string; jx: number; glow: number}> = ({x, y, s, k, lit, caseColor, id, skin, jx, glow}) => {
  const sx = Math.cos(k * Math.PI);
  return <g transform={`translate(${x + jx} ${y}) scale(${Math.abs(sx) * s + 0.001} ${s})`}>
    {k < 0.5 ? <Phone id={id} x={0} y={0} lit={lit} p={0} thumb={0} caseColor={caseColor} skin={skin} /> : <PhoneBack caseColor={caseColor} glow={glow} />}
  </g>;
};

const MugDrop: React.FC<{x: number; land: number; t: number; arm: 'him' | 'her'; pulseA: number}> = ({x, land, t, arm, pulseA}) => {
  const S = 1.5, REST = 1037;
  const k = wp(t, land - 0.32, land);
  const fall = t < land ? REST - 560 * (1 - k * k) : REST;
  const sq = t >= land ? 1 - 0.12 * Math.sin(wp(t, land, land + 0.2) * Math.PI) * (1 - wp(t, land, land + 0.2)) * 2 : 1;
  const hide = t < land - 0.32;
  const up = smooth(t, land + 0.05, land + 0.4);
  const handY = (hide ? -300 : fall - 118) - 520 * up;
  return <g>
    {t >= land && <g>
      <ellipse cx={x} cy={1140} rx={270} ry={62} fill="#E4FAFF" opacity={0.85 * pulseA} filter="url(#blurSh)" />
      <ellipse cx={x} cy={1136} rx={190} ry={18} fill="#FFFFFF" opacity={pulseA} />
      <ellipse cx={x} cy={1100} rx={340} ry={190} fill="url(#haloCool)" opacity={0.7 * pulseA} />
    </g>}
    {!hide && <g transform={`translate(${x} ${fall + 93 * (1 - sq)}) scale(${S} ${S * sq}) rotate(180)`}><Mug x={0} y={0} /></g>}
    <Arm who={arm} sx={x} sy={-260} hx={x} hy={handY} w={110} />
  </g>;
};

const MugsClose: React.FC<{t: number}> = ({t}) => {
  const HX = 300, RX = 780, PY = 1010;
  const buzzAt = (t0: number) => t >= t0 && t < t0 + 0.2 ? Math.sin(t * 120) * 8 * (1 - wp(t, t0, t0 + 0.2)) : 0;
  const hisFlip = smooth(t, 15.5, 15.75), herFlip = smooth(t, 14.95, 15.2);
  const hisLand = B.mugHis, herLand = B.mugHers;
  const pulse1 = 0.8 + 0.2 * Math.sin(t * 4);
  const handSide = (x: number, t0: number, t1: number, dir: number) => { const e = smooth(t, t0, t0 + 0.12) * (1 - smooth(t, t1 - 0.12, t1)); return {x: lerp(dir > 0 ? 1250 : -170, x + dir * 120, e), y: PY + 30}; };
  const hh = handSide(HX, 15.45, 15.85, -1), rh = handSide(RX, 14.9, 15.3, 1);
  return <g>
    <CloseBG t={t} />
    <Plate x={540} y={905} s={0.6} dollop={1} />
    <FlipPhone x={HX} y={PY} s={1.15} k={hisFlip} lit={1} caseColor="#2C2C36" id="mh" skin={C.skinHim} jx={buzzAt(14.6) + buzzAt(14.8)} glow={0.9} />
    <FlipPhone x={RX} y={PY} s={1.15} k={herFlip} lit={1} caseColor={C.pink} id="mr" skin={C.skinHer} jx={buzzAt(14.6) + buzzAt(14.8) * 0.8} glow={0.9} />
    {t >= B.buzzBoth && t < B.buzzBoth + 0.3 && <BuzzMarks x={HX} y={PY - 150} k={wp(t, B.buzzBoth, B.buzzBoth + 0.3)} />}
    {t >= B.buzzBoth + 0.2 && t < B.buzzBoth + 0.5 && <BuzzMarks x={RX} y={PY - 150} k={wp(t, B.buzzBoth + 0.2, B.buzzBoth + 0.5)} />}
    {t < 15.4 && <Arm who="her" sx={1300} sy={1160} hx={rh.x} hy={rh.y} w={100} />}
    {t < 15.95 && <Arm who="him" sx={-300} sy={1160} hx={hh.x} hy={hh.y} w={100} />}
    <MugDrop x={RX} land={herLand} t={t} arm="her" pulseA={pulse1} />
    <MugDrop x={HX} land={hisLand} t={t} arm="him" pulseA={pulse1} />
  </g>;
};

const BuzzClose: React.FC<{t: number; hook: Hook}> = ({t, hook}) => {
  const burst = (t0: number, a: number) => t >= t0 && t < t0 + 0.28 ? Math.sin(t * 130) * a * (1 - wp(t, t0, t0 + 0.28)) : 0;
  const jx = burst(22.0, 12) + burst(22.3, 10) + burst(22.6, 8) + burst(22.9, 6);
  const near = Math.max(...[22.0, 22.3, 22.6, 22.9].map((t0) => pulse(t, t0, t0 + 0.28)));
  const pu = 0.65 + 0.35 * near;
  const him = himPose(t, hook);
  const look: [number, number] = [lerp(-0.85, 0.15, smooth(t, 22.35, 22.7)), lerp(0.75, 0.0, smooth(t, 22.35, 22.7))];
  const X = 330, MY = 1040;
  return <g>
    <g filter="url(#blurSoft)"><Far t={t} /></g>
    <rect x={-100} y={-100} width={1300} height={2200} fill={C.ink} opacity={0.3} />
    <Person who="him" x={770} y={965} s={1.1} pose={{...him, look, bob: 0}} />
    <CloseBG t={t} top={965} bare />
    <ellipse cx={X} cy={1146} rx={300} ry={66} fill="#E4FAFF" opacity={0.9 * pu} filter="url(#blurSh)" />
    <ellipse cx={X} cy={1100} rx={380} ry={220} fill="url(#haloCool)" opacity={0.85 * pu} />
    <ellipse cx={X} cy={1142} rx={215} ry={20} fill="#fff" opacity={pu} />
    <g transform={`translate(${X + jx} ${MY}) scale(1.85) rotate(180)`}><Mug x={0} y={0} /></g>
    {near > 0.02 && <g>
      <BuzzMarks x={X - 20} y={MY - 40} k={1 - near} />
      <g transform={`translate(${X} ${MY - 40}) scale(1.7)`} opacity={near} stroke={C.ink} strokeWidth={7} strokeLinecap="round" fill="none">
        {[-1, 1].map((sd) => <g key={sd}><path d={`M ${sd * 90} -50 Q ${sd * 120} -20 ${sd * 90} 10`} /><path d={`M ${sd * 118} -70 Q ${sd * 160} -20 ${sd * 118} 30`} /><path d={`M ${sd * 146} -90 Q ${sd * 200} -20 ${sd * 146} 50`} /></g>)}
      </g>
    </g>}
  </g>;
};

// ------------------------------------------------------------------------------------------ vote + shots
const VoteScene: React.FC<{t: number}> = ({t}) => {
  const z = 1 + 0.02 * clamp((t - VOTE_AT) / 6);
  return <g transform={`translate(540 960) scale(${z}) translate(-540 -960)`}>
    <Far t={t} />
    <rect x={-200} y={1000} width={1500} height={1000} fill={C.tealLite} />
    <Counter />
    <rect x={-100} y={-100} width={1300} height={2200} fill={C.ink} opacity={0.3} />
    <Chalk text="what do I write?" x={540} y={555} w={800} h={116} size={70} a={smooth(t, B.cardA - 0.1, B.cardA + 0.3)} />
    <VoteCard letter="A" l1={spec.choices.A.l1} l2={spec.choices.A.l2} y={765} age={t - B.cardA} rot={-1.5} id="va" />
    <VoteCard letter="B" l1={spec.choices.B.l1} l2={spec.choices.B.l2} y={985} age={t - B.cardB} rot={1.5} id="vb" />
  </g>;
};

const renderShot = (t: number, hook: Hook): React.ReactNode => {
  const id = shotAt(t);
  if (id === 'N1' || id === 'N2') return <NapkinInsert t={t} kind={id} />;
  if (id === 'M') return <Macro t={t} />;
  if (id === 'P') return <MugsClose t={t} />;
  if (id === 'Q') return <BuzzClose t={t} hook={hook} />;
  if (id === 'vote') return <VoteScene t={t} />;
  if (id === 'end') return <EndCard a={t - B.endcard} t={t} />;
  return <Diner t={t} hook={hook} />;
};

const Scene: React.FC<{hook: Hook}> = ({hook}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const inWipe = t >= WIPE_AT && t < VOTE_AT;
  const k = inWipe ? (t - WIPE_AT) / WIPE_DUR : 0;
  const fast = inWipe || (t >= 11.0 && t < 12.5);
  return <>
    <MotionBlurWhen fast={fast} samples={5} shutter={220}>
      <AbsoluteFill>
        <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, background: C.teal}}>
          <Defs />
          {inWipe ? <>
            <BuzzClose t={WIPE_AT - 0.01} hook={hook} />
            <defs><WipeClip k={k} /></defs>
            <g clipPath="url(#sliceNew)"><VoteScene t={t} /></g>
            <WipeRim k={k} />
          </> : renderShot(t, hook)}
        </svg>
      </AbsoluteFill>
    </MotionBlurWhen>
    <AbsoluteFill>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        <Defs />
        {spec.strips.map((s, i) => {
          const isHook = (s as {hook?: boolean}).hook;
          if (isHook && (s as {hookProp?: string}).hookProp !== hook) return null;
          if (t >= s.to || t < s.from) return null;
          const comment = s.text.startsWith('comment');
          return <Strip key={i} text={s.text} y={s.y} age={t - s.from + (isHook ? 1 : 0.06)} out={isHook ? smooth(t, 2.8, 3.0) : smooth(t, s.to - 0.12, s.to)} size={comment ? 60 : 56} hot={comment} maxW={comment ? 760 : 1000} />;
        })}
      </svg>
    </AbsoluteFill>
  </>;
};

export const Pie1: React.FC<{hook?: Hook}> = ({hook = 'a'}) => (
  <AbsoluteFill style={{background: C.teal}}>
    <Audio src={staticFile('audio/pie-ep1.wav')} volume={0.9} />
    <Scene hook={hook} />
  </AbsoluteFill>
);
