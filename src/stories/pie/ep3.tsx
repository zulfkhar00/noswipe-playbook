import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, lerp, smooth} from '../../lib/motion';
import {MotionBlurWhen} from '../../lib/shots';
import {
  Arm, Beanie, C, COUR, Chalk, Cam, Counter, CrayonCup, CrayonLine, CrayonSprite, Defs, Dispenser, EndCard, Far, Gloss, HAND, MARKER, ANTON, Mouth, Mug, NapkinPaper, Person, Phone, PieCase,
  Pose, Steam, Strip, Sugar, VoteCard, WIPE_DUR, WipeClip, WipeRim, ClockSign, planeT, textW,
} from './world';
import spec from '../../../specs/stories/pie-ep3.json';

// Pie for Two, part 3 "Nowhere else". Silent. Opener = ONE strip, two big faces, both phones lit mid-swipe, one big bright napkin
// "why are you / here tonight?" on the counter. Take 1 (A): pie-critic act, bottle-cap monocle, the waitress's REVIEW card. Counter-
// clockwise slice wipe (rewind). Take 2 (B): phone face-down under an upside-down mug, NOWHERE ELSE / TO BE., napkin talk, the coffee
// clink payoff. Cliff: the jukebox lights up, she tilts her head at it holding a coin; vote cards.

export const PIE3_FPS = 60;
export const PIE3_FRAMES = Math.round(spec.duration * PIE3_FPS);
export type Hook = 'a' | 'b';
const B = spec.beats;
const REWIND_AT = B.rewind;
const VOTE_WIPE = B.voteWipe;
const VOTE_AT = VOTE_WIPE + WIPE_DUR;

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
type Pt = {x: number; y: number};

const BentArm: React.FC<{S: Pt; E: Pt; W: Pt; H: Pt; sleeve: string; skin: string; w?: number}> = ({S, E, W, H, sleeve, skin, w = 70}) => {
  const ang = Math.atan2(W.y - E.y, W.x - E.x);
  const c0 = {x: W.x - Math.cos(ang) * 44, y: W.y - Math.sin(ang) * 44};
  const line = (a: Pt, b: Pt, sw: number, col: string, cap: 'round' | 'butt' = 'round') => <path d={`M ${a.x} ${a.y} L ${b.x} ${b.y}`} stroke={col} strokeWidth={sw} strokeLinecap={cap} fill="none" />;
  return <g>
    <path d={`M ${S.x} ${S.y} L ${E.x} ${E.y} L ${W.x} ${W.y}`} fill="none" stroke={C.ink} strokeWidth={w + 14} strokeLinecap="round" strokeLinejoin="round" />
    <path d={`M ${S.x} ${S.y} L ${E.x} ${E.y} L ${W.x} ${W.y}`} fill="none" stroke={sleeve} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
    {line(c0, W, w + 22, C.ink, 'butt')}{line(c0, W, w + 8, '#FFFFFF', 'butt')}
    {line(W, H, w * 0.6 + 12, C.ink)}{line(W, H, w * 0.6, skin)}
    <circle cx={H.x} cy={H.y} r={w * 0.52} fill={skin} stroke={C.ink} strokeWidth={7} />
    <path d={`M ${H.x + 10} ${H.y - 14} q 12 8 0 16 M ${H.x + 10} ${H.y + 6} q 12 8 0 16`} fill="none" stroke={C.ink} strokeWidth={4} opacity={0.5} strokeLinecap="round" />
  </g>;
};

const Exclaim: React.FC<{x: number; y: number; k: number}> = ({x, y, k}) => {
  const sp = k <= 0 ? 0 : 1 + Math.sin(clamp(k) * Math.PI * 1.5) * Math.exp(-clamp(k) * 4.2) * 0.45;
  const pts = Array.from({length: 16}, (_, i) => { const a = (i / 16) * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 46 : 78; return `${Math.cos(a) * r},${Math.sin(a) * r}`; }).join(' ');
  return <g transform={`translate(${x} ${y}) scale(${sp}) rotate(8)`}>
    <polygon points={pts} fill={C.ink} transform="translate(5 7)" opacity={0.35} /><polygon points={pts} fill={C.pumpkin} stroke={C.ink} strokeWidth={7} strokeLinejoin="round" />
    <text x={0} y={34} textAnchor="middle" fontFamily={`"Anton", sans-serif`} fontSize={92} fill={C.ink}>!</text>
  </g>;
};

const InsertBG: React.FC<{t: number}> = ({t}) => <g>
  <g filter="url(#blurSoft)"><Far t={t} /><rect x={-200} y={1010} width={1500} height={900} fill="#79B8A4" /></g>
  <rect x={-100} y={-100} width={1300} height={2200} fill={C.ink} opacity={0.45} />
</g>;
const fitW = (txt: string, size: number, maxW: number) => Math.min(size, (size * maxW) / textW(txt, `700 ${size}px ${HAND}`));

const CloseBG: React.FC<{t: number}> = ({t}) => <g>
  <g filter="url(#blurSoft)"><Far t={t} /><rect x={-200} y={880} width={1500} height={400} fill="#6FB3A0" /></g>
  <rect x={-100} y={-100} width={1300} height={2200} fill={C.ink} opacity={0.3} />
  <rect x={-200} y={800} width={1480} height={450} fill="url(#counterTop)" stroke={C.ink} strokeWidth={9} />
  {Array.from({length: 16}, (_, i) => <g key={i} transform={`translate(${(i * 131) % 1100} ${840 + ((i * 59) % 380)}) rotate(${(i * 37) % 80})`} opacity={0.5}><path d="M 0 0 L 26 7 L 8 20 Z" fill="#E8FFF6" /><circle cx={34} cy={5} r={3} fill={C.mintDeep} /></g>)}
  <rect x={-200} y={1250} width={1480} height={40} fill="url(#chromeG)" stroke={C.ink} strokeWidth={9} />
  <rect x={-200} y={1290} width={1480} height={700} fill={C.tealLite} stroke={C.ink} strokeWidth={9} />
</g>;

// the clockwise wedge polygon without its own <clipPath> wrapper, so the rewind can mirror it (counter-clockwise)
const WipeClipPoly: React.FC<{k: number; tf: string}> = ({k, tf}) => {
  const a1 = -90 + 360 * smooth(k, 0, 1);
  const n = Math.max(2, Math.ceil((a1 + 90) / 8));
  const pts = ['540,960'];
  for (let i = 0; i <= n; i++) { const a = ((-90 + ((a1 + 90) * i) / n) * Math.PI) / 180; pts.push(`${540 + Math.cos(a) * 1800},${960 + Math.sin(a) * 1800}`); }
  return <polygon points={pts.join(' ')} transform={tf} />;
};

const Waitress: React.FC<{t: number; look: [number, number]}> = ({t, look}) => {
  const up = smooth(t, B.waitressUp, B.waitressUp + 0.35);
  if (up < 0.01 || t >= B.rewind) return null;
  const y = 930 + (1 - up) * 500;
  const SK = '#E3B38F', HR = '#7A6A5A';
  const eye = (sd: number) => <g key={sd} transform={`translate(${sd * 38} -192)`}>
    <ellipse cx={0} cy={0} rx={21} ry={22} fill="#fff" stroke={C.ink} strokeWidth={5} />
    <circle cx={look[0] * 7} cy={look[1] * 6 + 3} r={9} fill={C.ink} />
    <path d="M -24 -2 L 24 -2 L 24 -26 L -24 -26 Z" fill={SK} /><path d="M -23 -2 L 23 -2" stroke={C.ink} strokeWidth={6} strokeLinecap="round" />
    <path d="M -24 -34 Q 0 -40 24 -34" fill="none" stroke="#5A4A3C" strokeWidth={5} strokeLinecap="round" />
    <circle cx={0} cy={6} r={32} fill="none" stroke={C.ink} strokeWidth={5} opacity={0.9} />
    <path d={`M ${sd * 30} 8 l ${sd * 14} 4 M ${sd * 30} 20 l ${sd * 14} 8`} stroke="#B98E6E" strokeWidth={3} strokeLinecap="round" />
  </g>;
  return <g transform={`translate(540 ${y}) scale(1.15)`}>
    <path d="M -210 400 L -210 120 Q -206 -6 -104 -30 L 104 -30 Q 206 -6 210 120 L 210 400 Z" fill={C.mintUni} stroke={C.ink} strokeWidth={9} strokeLinejoin="round" />
    <path d="M -86 -26 L 86 -26 L 106 400 L -106 400 Z" fill={C.cream} stroke={C.ink} strokeWidth={8} strokeLinejoin="round" />
    <path d="M -78 -28 L 0 52 L 78 -28" fill="#fff" stroke={C.ink} strokeWidth={7} strokeLinejoin="round" />
    <rect x={92} y={52} width={56} height={34} rx={7} fill={C.napkin} stroke={C.ink} strokeWidth={5} transform="rotate(8 120 70)" />
    <rect x={-38} y={-96} width={76} height={78} fill={SK} stroke={C.ink} strokeWidth={7} />
    <path d="M -38 -60 L 38 -60" stroke="#B98E6E" strokeWidth={4} />
    {/* hair: back bun, grey streaks */}
    <circle cx={-90} cy={-300} r={36} fill={HR} stroke={C.ink} strokeWidth={8} />
    <path d="M -108 -304 Q -90 -322 -72 -304" fill="none" stroke="#D8D2CA" strokeWidth={5} strokeLinecap="round" />
    <ellipse cx={0} cy={-196} rx={92} ry={118} fill={SK} stroke={C.ink} strokeWidth={9} />
    <path d="M -98 -190 C -108 -318 -30 -330 0 -326 C 34 -330 108 -312 98 -190 C 76 -250 36 -262 0 -258 C -40 -262 -78 -250 -98 -190 Z" fill={HR} stroke={C.ink} strokeWidth={9} strokeLinejoin="round" />
    <path d="M -70 -262 Q -40 -290 -6 -296 M 20 -296 Q 56 -284 80 -258" fill="none" stroke="#D8D2CA" strokeWidth={7} strokeLinecap="round" />
    <path d="M -90 -200 Q -96 -150 -80 -120 M 90 -200 Q 96 -150 80 -120" fill="none" stroke={C.ink} strokeWidth={0} />
    {[-1, 1].map(eye)}
    <path d="M -40 -148 Q -34 -118 -38 -104 M 40 -148 Q 34 -118 38 -104" fill="none" stroke="#B98E6E" strokeWidth={4} strokeLinecap="round" />
    <path d="M -8 -158 Q 0 -140 10 -154" fill="none" stroke={C.ink} strokeWidth={5} strokeLinecap="round" opacity={0.7} />
    <path d="M -24 -100 L 24 -100" stroke={C.ink} strokeWidth={6} strokeLinecap="round" />
    <path d="M -24 -100 q -6 2 -8 8 M 24 -100 q 6 2 8 8" fill="none" stroke="#B98E6E" strokeWidth={3} strokeLinecap="round" />
  </g>;
};

const pop = (k0: number) => { const k = clamp(k0); return k <= 0 ? 0 : 1 + Math.sin(k * Math.PI * 1.5) * Math.exp(-k * 4.2) * 0.4 - Math.exp(-k * 9) * (1 - k); };

// ------------------------------------------------------------------------------------------ shots
type ShotId = 'D' | 'N0' | 'N1' | 'N2' | 'N3' | 'N4' | 'N5' | 'N6' | 'RV' | 'C1' | 'C2' | 'vote' | 'end';
const SHOTS: [number, ShotId][] = [[0, 'D'], [B.napkin0, 'N0'], [B.take1, 'D'], [B.napkin1, 'N1'], [B.monocle, 'D'], [B.review, 'RV'], [B.sink, 'D'], [B.rewind, 'C1'], [B.napkin2, 'N2'],
  [B.quiet, 'D'], [B.cover2, 'C2'], [B.napkin3, 'N3'], [B.napkin4, 'N4'], [B.laugh, 'D'], [B.napkin5, 'N5'], [B.napkin6, 'N6'], [B.clinkShot, 'D'], [VOTE_AT, 'vote'], [B.endcard, 'end']];
const shotAt = (t: number): ShotId => keyAt(SHOTS, t);

type Seg = [number, number, [number, number, number], [number, number, number]];
const CAM_SEGS: Seg[] = [
  [0, 3.2, [540, 960, 1.0], [540, 975, 1.035]], [B.take1, B.napkin1, [540, 985, 1.03], [540, 990, 1.07]], [B.monocle, B.review, [540, 950, 1.0], [540, 960, 1.07]],
  [B.sink, B.rewind, [420, 940, 1.05], [420, 935, 1.13]], [B.quiet, B.cover2, [540, 940, 1.0], [540, 930, 1.1]], [B.laugh, B.napkin5, [540, 970, 1.0], [540, 970, 1.06]],
  [B.clinkShot, B.voteWipe, [540, 990, 1.0], [540, 975, 1.1]],
];
const camOf = (t: number): Cam => {
  let seg = CAM_SEGS[0];
  for (const s of CAM_SEGS) if (t >= s[0]) seg = s;
  const k = clamp((t - seg[0]) / (seg[1] - seg[0]));
  return {x: lerp(seg[2][0], seg[3][0], k), y: lerp(seg[2][1], seg[3][1], k), z: lerp(seg[2][2], seg[3][2], k)};
};

// ------------------------------------------------------------------------------------------ faces
const HIM = {x: 270, y: 895}, HER = {x: 810, y: 895};
const blinkAt = (t: number, seed: number) => { const ph = (t + seed) % 3.7; return ph < 0.14 ? Math.sin((ph / 0.14) * Math.PI) : 0; };

const HL: KF[] = [[3.2, 0.9, 0.3], [5.2, 0.9, 0.3], [5.4, 0.3, 0.8], [5.9, 0.3, 0.8], [7.5, 0.9, 0.1], [8.2, 0.9, 0.1], [8.45, 0.2, 0.9], [9.0, 0.2, 0.9], [10.3, 0.5, 0.6], [10.7, 0.9, 0.0], [11.0, 0.9, 0.0],
  [14.2, 0.5, 0.85], [15.0, 0.5, 0.85], [16.0, 0.9, 0.2], [19.2, 0.9, 0.1], [23.0, 0.9, 0.1], [23.25, 0.9, 0.1]];
const RL: KF[] = [[3.2, -0.9, 0.2], [5.2, -0.9, 0.2], [7.5, -0.9, 0.1], [8.6, -0.9, 0.1], [8.8, -0.5, 0.9], [10.0, -0.5, 0.9], [10.3, -0.9, 0.1], [11.0, -0.9, 0.1], [14.2, -0.95, 0.15], [15.0, -0.95, 0.15],
  [15.3, -0.4, 0.9], [15.9, -0.4, 0.9], [16.2, -0.95, 0.1], [19.2, -0.95, 0.1], [23.25, -0.95, 0.1]];
const HM: [number, Mouth][] = [[3.2, 'grit'], [5.2, 'soft'], [5.5, 'grit'], [7.5, 'smirk'], [8.3, 'flat'], [9.0, 'o'], [10.3, 'gulp'], [10.8, 'soft'], [14.2, 'soft'], [19.2, 'laugh'], [19.65, 'smile'], [23.0, 'smile']];
const RM: [number, Mouth][] = [[3.2, 'smile'], [7.5, 'smirk'], [8.3, 'smile'], [10.3, 'smile'], [14.2, 'soft'], [16.4, 'soft'], [19.2, 'smile'], [23.0, 'smile']];

const himPose = (t: number, hook: Hook): Pose => {
  let look: number[]; let mouth: Mouth; let brow = 0.1; let sweat = 0; let flush = 0.3; let bob = 0; let tilt = Math.sin(t * 0.9) * 1.1; let sq = 1 + 0.014 * Math.sin(t * 2.3); let happy = false; let gulp = 0;
  if (t < B.napkin0) {
    const keys: KF[] = hook === 'a' ? [[0, 0.05, 0.8], [0.5, 0.05, 0.8], [0.9, 0.7, 0.75], [1.3, 0.5, 0.95], [2.3, 0.5, 0.95], [2.7, 0.9, 0.3], [3.2, 0.9, 0.3]]
      : [[0, 0.05, 0.8], [0.55, 0.05, 0.8], [0.65, 0.9, 0.05], [1.4, 0.9, 0.05], [1.8, 0.5, 0.95], [2.4, 0.5, 0.95], [2.8, 0.9, 0.3], [3.2, 0.9, 0.3]];
    look = kf(keys, t);
    if (hook === 'a') {
      mouth = t < 0.8 ? 'flat' : t < 1.8 ? 'o' : 'grit';
      sweat = smooth(t, 1.0, 1.7) * 0.85; flush = 0.3 + smooth(t, 0.9, 1.6) * 0.55; brow = 0.1 + 0.5 * smooth(t, 0.9, 1.4);
      if (t > 1.7 && t < 2.5) gulp = Math.sin(wp(t, 1.7, 2.5) * Math.PI);
    } else {
      mouth = t < 0.65 ? 'soft' : t < 1.8 ? 'o' : 'grit';
      const fl = pulse(t, 0.6, 0.95);
      sq += 0.07 * Math.sin(wp(t, 0.6, 0.85) * Math.PI);
      bob -= 20 * fl;
      sweat = smooth(t, 0.7, 1.0) * 0.95;
      flush = 0.3 + smooth(t, 0.6, 1.1) * 0.55;
      brow = 0.1 + 0.9 * pulse(t, 0.6, 1.3);
      if (t > 2.0 && t < 2.8) gulp = Math.sin(wp(t, 2.0, 2.8) * Math.PI);
    }
  } else {
    look = kf(HL, t); mouth = keyAt(HM, t);
    flush = 0.5;
    if (t >= B.monocle && t < B.review) { brow = t < 8.3 ? 0.85 : 0.1; tilt = t < 8.3 ? -4 : 1; sweat = smooth(t, 8.3, 8.9) * 0.5; }
    if (t >= B.review && t < B.rewind) { flush = 0.85; sweat = 0.85; brow = 0.1; tilt = 3; }
    if (t >= B.sink && t < B.rewind) bob = 215 * smooth(t, B.sink + 0.05, B.sink + 0.4);
    if (t >= B.quiet && t < B.laugh) { flush = 0.45; }
    if (t >= B.laugh && t < B.napkin5) { flush = 0.35; if (t < 19.65) { bob = -Math.abs(Math.sin(t * 22)) * 8; tilt = Math.sin(t * 22) * 3; happy = true; } }
    if (t >= B.clinkShot) { flush = 0.35; happy = t >= B.clink - 0.05; tilt = 5 * smooth(t, 23.0, 23.25) + Math.sin(t * 20) * (t > 23.25 && t < 23.9 ? 2.5 : 0); if (t > 23.25 && t < 23.9) { bob = -Math.abs(Math.sin(t * 19)) * 7; mouth = 'laugh'; } }
  }
  return {look: [look[0], look[1]], brow, worry: sweat * 0.8, mouth, happy, sweat, gulp, tilt, bob, sq, blink: happy ? 0 : blinkAt(t, 0.4), flush};
};
const herPose = (t: number, hook: Hook): Pose => {
  let look: number[]; let mouth: Mouth; let brow = 0.1; let happy = false; let bob = 0; let tilt = Math.sin(t * 0.8 + 2) * 1.2;
  if (t < B.napkin0) {
    const keys: KF[] = hook === 'a' ? [[0, -0.1, 0.75], [0.5, -0.1, 0.75], [0.8, -0.9, 0.25], [1.2, -0.9, 0.25], [3.2, -0.9, 0.2]]
      : [[0, -0.1, 0.75], [0.25, -0.1, 0.75], [0.4, -1.0, 0.85], [1.5, -1.0, 0.85], [1.8, -0.9, 0.2], [3.2, -0.9, 0.2]];
    look = kf(keys, t);
    mouth = hook === 'a' ? (t < 0.6 ? 'flat' : 'smirk') : (t < 0.4 ? 'flat' : t < 1.5 ? 'o' : 'smirk');
    brow = 0.1 + (hook === 'b' ? 0.8 * pulse(t, 0.4, 1.3) : 0.3);
  } else {
    look = kf(RL, t); mouth = keyAt(RM, t);
    if (t >= B.monocle && t < 8.1) brow = 0.9;
    if (t >= 10.5 && t < 10.95) { bob = -Math.abs(Math.sin(t * 17 + 1)) * 5; tilt = Math.sin(t * 17 + 1) * 2; happy = true; }
    if (t >= B.laugh && t < B.napkin5) tilt = -2;
    if (t >= B.clinkShot) { tilt = -5 * smooth(t, 23.0, 23.25) + Math.sin(t * 18 + 1) * (t > 23.25 && t < 23.9 ? 2.5 : 0); happy = t >= B.clink - 0.05; if (t > 23.25 && t < 23.9) { bob = -Math.abs(Math.sin(t * 17 + 1)) * 7; mouth = 'laugh'; } }
  }
  return {look: [look[0], look[1]], brow, worry: 0, mouth, happy, sweat: 0, gulp: 0, tilt, bob, sq: 1 + 0.014 * Math.sin(t * 2 + 1.3), blink: happy ? 0 : blinkAt(t, 1.9), flush: 0};
};

// ------------------------------------------------------------------------------------------ phones, napkin, mugs, cups
const HIM_TICKS = [-0.1, ...spec.audio.swipeTicks];
const HER_TICKS = [-0.18, 0.33, 0.62, 0.93, 1.22];
const LOW0 = 2.3, LOW1 = 2.85;
const HIM_FLAT = {x: 140, y: 1160, s: 0.85}, HER_FLAT = {x: 950, y: 1160, s: 0.85};
const phoneSwipe = (ticks: number[], t: number, until: number) => {
  let idx = -1;
  for (let i = 0; i < ticks.length; i++) if (ticks[i] <= t && ticks[i] < until) idx = i;
  if (idx < 0) return {p: 0, dir: 1, on: false};
  const p = (t - ticks[idx]) / 0.26;
  if (p > 1) return {p: 0, dir: 1, on: false};
  return {p: clamp(p), dir: idx % 2 ? -1 : 1, on: true};
};
const himPhone = (t: number, hook: Hook) => {
  const sw = phoneSwipe(HIM_TICKS, t, hook === 'a' ? 1.45 : 0.6);
  let pos = {x: 250, y: 930, rot: -3, s: 0.8, lit: 1};
  if (hook === 'b' && t > 0.6) { const k = smooth(t, 0.6, 0.95); pos = {x: lerp(250, 205, k), y: lerp(930, 1010, k), rot: lerp(-3, 30, k), s: lerp(0.8, 0.72, k), lit: lerp(1, 0.6, k)}; }
  const k2 = smooth(t, LOW0, LOW1);
  return {x: lerp(pos.x, HIM_FLAT.x, k2), y: lerp(pos.y, HIM_FLAT.y, k2), rot: lerp(pos.rot, 0, k2), s: lerp(pos.s, HIM_FLAT.s, k2), flat: k2, lit: t < LOW0 ? pos.lit : lerp(pos.lit, 0.5, k2), p: sw.p, dir: sw.dir, thumb: sw.on ? 1 : 0};
};
const herPhone = (t: number, hook: Hook) => {
  const sw = phoneSwipe(HER_TICKS, t, hook === 'b' ? 0.3 : 1.45);
  const k2 = hook === 'b' ? smooth(t, 0.25, 0.7) : smooth(t, LOW0, LOW1);
  return {x: lerp(705, HER_FLAT.x, k2), y: lerp(910, HER_FLAT.y, k2), rot: lerp(6, 0, k2), s: lerp(0.74, HER_FLAT.s, k2), flat: k2, lit: lerp(1, 0.5, k2), p: sw.p, dir: sw.dir, thumb: sw.on ? 1 : 0};
};

/** the big opener napkin on the counter. a: slides in from her side at once. b: waits, then she pushes it after the catch. */
const NAP_X0 = 700, NAP_X1 = 520, NAP_Y = 1150;
const napPush = (t: number, hook: Hook) => hook === 'a' ? smooth(t, 0.15, 0.95) : smooth(t, 1.55, 2.35);
const napHand = (t: number, hook: Hook): Pt => {
  const k = napPush(t, hook);
  const edge = lerp(NAP_X0, NAP_X1, k) + 240;
  const away = hook === 'a' ? smooth(t, 1.0, 1.5) : smooth(t, 2.35, 2.8);
  const pre = hook === 'b' ? 1 - smooth(t, 1.25, 1.55) : 0;   // b: hand waits away from the napkin until she pushes
  const x = lerp(edge, lerp(900, 1050, pre), Math.max(away, pre)), y = lerp(1170, 1215, Math.max(away, pre));
  return {x, y};
};
const OpenerNapkin: React.FC<{t: number; hook: Hook}> = ({t, hook}) => {
  const k = napPush(t, hook);
  const x = lerp(NAP_X0, NAP_X1, k), rot = lerp(4, -1.5, k);
  const l1 = 'why are you', l2 = 'here tonight?';
  const s1 = fitW(l1, 80, 330), s2 = fitW(l2, 80, 330);
  return <NapkinPaper w={410} h={235} x={x} y={NAP_Y} rot={rot} id="hookn" glowA={0.95}>
    <text x={0} y={-2} textAnchor="middle" fontFamily={HAND} fontWeight={700} fontSize={s1} fill={C.cran} stroke={C.cran} strokeWidth={2.5} filter="url(#rough)">{l1}</text>
    <text x={0} y={70} textAnchor="middle" fontFamily={HAND} fontWeight={700} fontSize={s2} fill={C.cran} stroke={C.cran} strokeWidth={2.5} filter="url(#rough)">{l2}</text>
  </NapkinPaper>;
};

const MUG_HIS_UP: Pt = {x: 120, y: 1030}, MUG_HERS_UP: Pt = {x: 975, y: 1030};
const MUG_LAND_HIS: Pt = {x: HIM_FLAT.x, y: 1112}, MUG_LAND_HERS: Pt = {x: HER_FLAT.x, y: 1112};

const CoffeeCup: React.FC<{x: number; y: number; rot?: number; s?: number; t: number; seed?: number; hot?: number; flip?: boolean}> = ({x, y, rot = 0, s = 1, t, seed = 0, hot = 1, flip = false}) => <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${flip ? -s : s} ${s})`}>
  <ellipse cx={4} cy={64} rx={108} ry={20} fill={C.ink} opacity={0.25} filter="url(#blurSh)" />
  <ellipse cx={0} cy={52} rx={96} ry={21} fill={C.napkin} stroke={C.ink} strokeWidth={7} />
  <path d="M 54 -14 Q 112 -18 108 22 Q 104 54 50 44" fill="none" stroke={C.ink} strokeWidth={22} strokeLinecap="round" />
  <path d="M 54 -14 Q 112 -18 108 22 Q 104 54 50 44" fill="none" stroke={C.napkin} strokeWidth={9} strokeLinecap="round" />
  <path d="M -66 -36 L 66 -36 L 52 44 Q 50 56 38 56 L -38 56 Q -50 56 -52 44 Z" fill={C.napkin} stroke={C.ink} strokeWidth={8} strokeLinejoin="round" />
  <path d="M -62 -8 L 62 -8 L 58 14 L -58 14 Z" fill={C.cran} stroke={C.ink} strokeWidth={4} opacity={0.95} />
  <ellipse cx={0} cy={-36} rx={66} ry={15} fill="#5A3322" stroke={C.ink} strokeWidth={6} />
  <ellipse cx={-14} cy={-38} rx={30} ry={5} fill="#8A5A3A" opacity={0.7} />
  <path d="M -42 -22 L -36 40" stroke="#fff" strokeWidth={8} opacity={0.7} strokeLinecap="round" />
  <g opacity={0.55 * hot} fill="none" stroke="#fff" strokeWidth={9} strokeLinecap="round">
    {[-24, 6, 32].map((xx, i) => <path key={i} d={`M ${xx} -52 Q ${xx + Math.sin(t * 2.2 + i + seed) * 16} -84 ${xx - 4} -112 Q ${xx - Math.sin(t * 1.8 + i * 2 + seed) * 14} -134 ${xx + 2} -150`} />)}
  </g>
</g>;

const Monocle: React.FC<{k: number}> = ({k}) => {
  const teeth = Array.from({length: 24}, (_, i) => { const a = (i / 24) * Math.PI * 2, r = i % 2 ? 50 : 58; return `${Math.cos(a) * r},${Math.sin(a) * r}`; }).join(' ');
  return <g>
    <path d="M -24 46 Q -40 120 -86 150 Q -120 170 -150 150" fill="none" stroke={C.ink} strokeWidth={11} strokeLinecap="round" />
    <path d="M -24 46 Q -40 120 -86 150 Q -120 170 -150 150" fill="none" stroke={C.gold} strokeWidth={5} strokeLinecap="round" />
    <polygon points={teeth} fill="#C9D3D8" stroke={C.ink} strokeWidth={7} strokeLinejoin="round" />
    <circle r={42} fill="#E8FBFF" fillOpacity={0.35} stroke={C.ink} strokeWidth={7} />
    <circle r={50} fill="none" stroke={C.cran} strokeWidth={5} opacity={0.9} />
    <path d="M -26 -18 L -4 -30 M -30 0 L -22 -8" stroke="#fff" strokeWidth={7} strokeLinecap="round" opacity={0.9} />
    {k > 0 && k < 1 && <g stroke={C.ink} strokeWidth={6} strokeLinecap="round" opacity={1 - k}><path d="M 70 -30 l 24 -14 M 76 0 l 30 0 M 70 30 l 24 14" /></g>}
  </g>;
};

// ------------------------------------------------------------------------------------------ the REVIEW card
const starPts = (r: number) => Array.from({length: 10}, (_, i) => { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.44 : r; return `${Math.cos(a) * rr},${Math.sin(a) * rr}`; }).join(' ');
const ReviewCard: React.FC<{t: number; t0: number; animate?: boolean}> = ({t, t0, animate = true}) => {
  const a = (d: number) => (animate ? pop((t - t0 - d) / 0.3) : 1);
  const xs = [-224, -112, 0, 112, 224];
  return <g>
    <rect x={-440 + 16} y={-320 + 24} width={880} height={640} rx={16} fill={C.ink} opacity={0.35} filter="url(#blurSh)" />
    <rect x={-440} y={-320} width={880} height={640} rx={16} fill={C.napkin} stroke={C.ink} strokeWidth={9} />
    <path d="M -440 -204 L 440 -204" stroke={C.ink} strokeWidth={0} />
    <rect x={-440} y={-320} width={880} height={116} rx={16} fill={C.cran} stroke={C.ink} strokeWidth={9} />
    <rect x={-436} y={-250} width={872} height={42} fill={C.cran} />
    <text x={0} y={-226} textAnchor="middle" fontFamily={ANTON} fontSize={88} fill={C.cream} letterSpacing={14}>{spec.review.title}</text>
    <text x={0} y={-112} textAnchor="middle" fontFamily={ANTON} fontSize={80} fill={C.ink} letterSpacing={3}>{spec.review.l1}</text>
    {xs.map((x, i) => <g key={i} transform={`translate(${x} -34) scale(${a(0.05 + i * 0.05)})`}><polygon points={starPts(50)} fill={C.pumpkin} stroke={C.ink} strokeWidth={7} strokeLinejoin="round" /></g>)}
    <path d="M -380 38 L 380 38" stroke={C.ink} strokeWidth={4} strokeDasharray="4 16" strokeLinecap="round" opacity={0.6} />
    <text x={0} y={128} textAnchor="middle" fontFamily={ANTON} fontSize={80} fill={C.cran} letterSpacing={3}>{spec.review.l2}</text>
    {xs.map((x, i) => i === 0
      ? <g key={i} transform={`translate(${x} 210) scale(${a(0.4)})`}><polygon points={starPts(50)} fill={C.pumpkin} stroke={C.ink} strokeWidth={7} strokeLinejoin="round" /></g>
      : <g key={i} transform={`translate(${x} 210) scale(${a(0.25 + i * 0.03)})`}><polygon points={starPts(50)} fill="#EFE6D2" stroke={C.ink} strokeWidth={7} strokeLinejoin="round" /></g>)}
  </g>;
};

// ------------------------------------------------------------------------------------------ the counter scene
const Diner: React.FC<{t: number; hook: Hook}> = ({t, hook}) => {
  const cam = camOf(t);
  const him = himPose(t, hook), her = herPose(t, hook);
  const hp = himPhone(t, hook), rp = herPhone(t, hook);
  const inHook = t < B.napkin0;
  const take2 = t >= B.rewind;

  // arms
  const hold = t < LOW1 + 0.3;
  const hisHold: Pt = {x: hp.x - 30 * (1 - hp.flat), y: hp.y + 104 * hp.s * (1 - hp.flat * 0.5)};
  const herHold: Pt = {x: rp.x + 24, y: rp.y + 96 * rp.s * (1 - rp.flat * 0.4)};
  const HIS_REST: Pt = {x: 215, y: 1236}, HER_REST: Pt = {x: 870, y: 1236};
  let hisA: Pt = HIS_REST; let herA: Pt = HER_REST;
  if (inHook) herA = napHand(t, hook);
  const crayonK = smooth(t, B.take1 + 0.1, B.take1 + 0.5) * (1 - smooth(t, B.napkin1 - 0.01, B.napkin1)) + (t >= B.napkin1 ? smooth(t, B.napkin1, B.napkin1 + 0.01) * (1 - smooth(t, B.monocle - 0.2, B.monocle)) : 0);
  if (t >= B.take1 && t < B.monocle) { const CUPH: Pt = {x: 345, y: 1100}; hisA = {x: lerp(HIS_REST.x, CUPH.x, crayonK), y: lerp(HIS_REST.y, CUPH.y, crayonK)}; }
  // cups
  const cupHis = {x: 480, y: 1125, rot: 0, s: 1}, cupHer = {x: 610, y: 1125, rot: 0, s: 1};
  const k1 = smooth(t, B.clinkShot, B.clinkShot + 0.15), k2 = smooth(t, B.clinkShot + 0.15, B.clink);
  const hold1 = smooth(t, B.clink + 0.05, B.clink + 0.7);
  if (t >= B.clinkShot) {
    const sway = Math.sin(t * 5) * 1.4 * hold1;
    const bump = t >= B.clink ? 1 + 0.05 * Math.sin(wp(t, B.clink, B.clink + 0.25) * Math.PI) : 1;
    const lift = 10 * hold1;
    const sc = lerp(1, 1.3, k1) * bump;
    cupHis.x = lerp(lerp(480, 385, k1), 458, k2); cupHis.y = lerp(lerp(1125, 1010, k1), 905, k2) - lift; cupHis.rot = lerp(lerp(0, -10, k1), 8, k2) + sway; cupHis.s = sc;
    cupHer.x = lerp(lerp(610, 695, k1), 622, k2); cupHer.y = lerp(lerp(1125, 1010, k1), 905, k2) - lift; cupHer.rot = lerp(lerp(0, 10, k1), -8, k2) - sway; cupHer.s = sc;
    const ak = smooth(t, B.clinkShot - 0.1, B.clinkShot + 0.12);
    hisA = {x: lerp(HIS_REST.x, cupHis.x - 118, ak), y: lerp(HIS_REST.y, cupHis.y + 40, ak)};
    herA = {x: lerp(HER_REST.x, cupHer.x + 118, ak), y: lerp(HER_REST.y, cupHer.y + 40, ak)};
  }

  // mugs
  const mk = smooth(t, B.sink, B.sink + 0.35);
  const mugHis = t < B.sink ? {x: MUG_HIS_UP.x, y: MUG_HIS_UP.y, s: 1} : {x: lerp(MUG_HIS_UP.x, 290, mk), y: lerp(MUG_HIS_UP.y, 1055, mk), s: lerp(1, 1.5, mk)};
  const hisUnder = take2, hersUnder = t >= B.landHers;

  // waitress arm + the review card
  const wOn = t >= B.cardSlide - 0.1 && t < B.cardSlide + 0.75;
  const wk = smooth(t, B.cardSlide, B.cardSlide + 0.4), wBack = smooth(t, B.cardSlide + 0.42, B.cardSlide + 0.7);
  const CARD: Pt = {x: 405, y: 1170};
  const wHand: Pt = {x: lerp(470, CARD.x, wk) + wBack * 60, y: lerp(930, CARD.y, wk) - wBack * 160};
  const cardOnCounter = t >= B.cardSlide;
  const cardAt: Pt = t < B.cardSlide + 0.42 ? wHand : CARD;

  const showHookNap = inHook;
  const hookBurst = hook === 'b' && t >= 0.6 && t < 1.9;
  return <g>
    <g transform={planeT(cam, 0.3)}><Far t={t} /></g>
    <g transform={planeT(cam, 0.55)}>
      <PieCase open={0} slice={false} t={t} sign={spec.cards.sign} />
      <ClockSign x={540} y={522} text={spec.cards.clock} />
    </g>
    <g transform={planeT(cam, 0.9)}>
      <Beanie x={1018} y={990} />
      <Waitress t={t} look={[t > 8.0 ? -0.8 : 0.2, 0.1]} />
      <Person who="him" x={HIM.x} y={HIM.y} pose={him} />
      {t >= B.monocle && t < B.rewind && (() => {
        const mk0 = wp(t, B.monocle + 0.02, B.monocle + 0.3);
        const drop = (1 - smooth(mk0, 0, 1)) * 420;
        const sc = mk0 <= 0 ? 0 : 1 + 0.12 * Math.sin(wp(t, B.monocle + 0.3, B.monocle + 0.5) * Math.PI);
        return <g transform={`translate(${HIM.x} ${HIM.y + him.bob}) rotate(${him.tilt} 0 -40)`}><g transform={`translate(52 ${-176 - drop}) rotate(${(1 - mk0) * 300}) scale(${sc})`}><Monocle k={wp(t, B.monocle + 0.28, B.monocle + 0.6)} /></g></g>;
      })()}
      <Person who="her" x={HER.x} y={HER.y} pose={her} />
      <Counter />
      <CrayonCup x={385} y={1078} />
      <Dispenser x={752} y={1070} />
      {!hisUnder && <Mug x={mugHis.x} y={mugHis.y} />}
      {!hersUnder && <Mug x={MUG_HERS_UP.x} y={MUG_HERS_UP.y} />}
      {t < B.clinkShot && <CoffeeCup x={cupHis.x} y={cupHis.y} t={t} flip />}
      {t < B.clinkShot && <CoffeeCup x={cupHer.x} y={cupHer.y} t={t} seed={2} />}
      {cardOnCounter && t < B.rewind && <g transform={`translate(${cardAt.x} ${cardAt.y}) rotate(-8) scale(0.28)`}><ReviewCard t={t} t0={0} animate={false} /></g>}
      {showHookNap && <OpenerNapkin t={t} hook={hook} />}
      {take2 && <g>
        {t < B.landHis ? null : <Mug x={MUG_LAND_HIS.x} y={MUG_LAND_HIS.y} rot={180} />}
        {hersUnder && <Mug x={MUG_LAND_HERS.x} y={MUG_LAND_HERS.y} rot={180} />}
      </g>}
      {/* phones lying flat (lit, generic glow); they vanish under the mugs in take 2 */}
      {!take2 && <Phone id="him" x={hp.x} y={hp.y} rot={hp.rot} scale={hp.s} lit={take2 ? 0 : hp.lit} p={hp.p} dir={hp.dir} thumb={hp.thumb} flat={hp.flat} skin={C.skinHim} />}
      {!hersUnder && <Phone id="her" x={rp.x} y={rp.y} rot={rp.rot} scale={rp.s} lit={rp.lit} p={rp.p} dir={rp.dir} thumb={rp.thumb} flat={rp.flat} caseColor={C.pink} skin={C.skinHer} />}
      {hold && t < (hook === 'b' ? 0.3 : LOW1 + 0.2) && <Arm who="her" sx={690} sy={1020} hx={herHold.x} hy={herHold.y} />}
      {hold && <Arm who="him" sx={-70} sy={1100} hx={hisHold.x} hy={hisHold.y} />}
      <Arm who="him" sx={-70} sy={1235} hx={hisA.x} hy={hisA.y} />
      <Arm who="her" sx={1150} sy={1235} hx={herA.x} hy={herA.y} />
      {t >= B.clinkShot && <CoffeeCup x={cupHis.x} y={cupHis.y} rot={cupHis.rot} s={cupHis.s} t={t} flip />}
      {t >= B.clinkShot && <CoffeeCup x={cupHer.x} y={cupHer.y} rot={cupHer.rot} s={cupHer.s} t={t} seed={2} />}
      {t >= B.take1 && t < B.napkin1 + 0.02 && crayonK > 0.3 && <g transform={`translate(${hisA.x + 18} ${hisA.y - 30}) rotate(28)`}><rect x={-9} y={-74} width={18} height={64} fill={C.pumpkin} stroke={C.ink} strokeWidth={5} /><polygon points="-9,-74 9,-74 0,-96" fill={C.pumpkin} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" /></g>}
      {/* waitress arm slides the review card */}
      {wOn && (() => {
        const S0: Pt = {x: 452, y: 905};
        const mid = {x: (S0.x + wHand.x) / 2, y: (S0.y + wHand.y) / 2};
        const E0 = {x: mid.x + 78, y: mid.y + 46};
        const ux = wHand.x - E0.x, uy = wHand.y - E0.y, ul = Math.hypot(ux, uy) || 1;
        const W0 = {x: wHand.x - (ux / ul) * 56, y: wHand.y - (uy / ul) * 56};
        return <BentArm S={S0} E={E0} W={W0} H={wHand} sleeve={C.mintUni} skin="#E3B38F" w={64} />;
      })()}
      {hook === 'b' && t >= 0.35 && t < 1.9 && <g opacity={smooth(t, 0.35, 0.5) * (1 - smooth(t, 1.7, 1.9))}>
        <path d={`M 800 760 L ${hp.x + 20} ${hp.y - 70}`} fill="none" stroke={C.ink} strokeWidth={28} strokeLinecap="round" strokeDasharray="1 40" />
        <path d={`M 800 760 L ${hp.x + 20} ${hp.y - 70}`} fill="none" stroke="#fff" strokeWidth={17} strokeLinecap="round" strokeDasharray="1 40" />
      </g>}
      {hookBurst && <g transform="translate(925 585) scale(1.6) translate(-925 -585)"><Exclaim x={925} y={585} k={wp(t, 0.6, 1.0)} /></g>}
      {/* the clink: warm light, sparks */}
      {t >= B.clink - 0.02 && <g>
        {(() => { const wk2 = smooth(t, B.clink, B.clink + 0.35); return <g opacity={wk2}>
          <ellipse cx={540} cy={900} rx={640} ry={520} fill="url(#haloWarm)" opacity={0.95} />
          <ellipse cx={540} cy={900} rx={300} ry={240} fill="url(#haloWhite)" opacity={0.4 + 0.08 * Math.sin(t * 7)} />
        </g>; })()}
        {[[540, 760, 0], [470, 810, 0.06], [612, 806, 0.1]].map(([x, y, d], i) => <Spark key={i} x={x} y={y} k={wp(t, B.clink + d, B.clink + d + 0.45)} />)}
      </g>}
    </g>
    <g transform={planeT(cam, 1.35)}>
      <Sugar x={-70} y={1360} s={0.8} />
      <Steam x={1040} y={1290} t={t} />
    </g>
  </g>;
};

const Spark: React.FC<{x: number; y: number; k: number}> = ({x, y, k}) => {
  if (k <= 0 || k >= 1) return null;
  const s = 0.6 + k * 1.1;
  const pts = Array.from({length: 16}, (_, i) => { const a = (i / 16) * Math.PI * 2, r = i % 2 ? 16 : 46; return `${Math.cos(a) * r},${Math.sin(a) * r}`; }).join(' ');
  return <g transform={`translate(${x} ${y}) scale(${s}) rotate(${k * 40})`} opacity={1 - k * k}>
    <polygon points={pts} fill="#fff" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <polygon points={pts} fill="#FFF3B0" transform="scale(0.55)" />
  </g>;
};

// ------------------------------------------------------------------------------------------ whole-frame napkins + review card
type NL = {txt: string; color: string; sleeve: string; skin: string; a: number; b: number};
const HIMW = {color: C.pumpkin, sleeve: C.rust, skin: C.skinHim}, HERW = {color: C.cran, sleeve: C.cran, skin: C.skinHer};
const INS: Record<string, {t0: number; id: string; lines: NL[]; sizes: number[]}> = {
  N0: {t0: B.napkin0, id: 'n0', sizes: [150, 150], lines: [{txt: 'why are you', ...HERW, a: -1, b: 0}, {txt: 'here tonight?', ...HERW, a: -1, b: 0}]},
  N1: {t0: B.napkin1, id: 'n1', sizes: [170, 190], lines: [{txt: "I'M A PIE", ...HIMW, a: 6.05, b: 6.4}, {txt: 'CRITIC.', ...HIMW, a: 6.45, b: 6.8}]},
  N2: {t0: B.napkin2, id: 'n2', sizes: [150, 190], lines: [{txt: 'NOWHERE ELSE', ...HIMW, a: 12.75, b: 13.15}, {txt: 'TO BE.', ...HIMW, a: 13.2, b: 13.5}]},
  N3: {t0: B.napkin3, id: 'n3', sizes: [150, 150], lines: [{txt: 'me too. I skipped', ...HERW, a: 16.15, b: 16.6}, {txt: 'the drive.', ...HERW, a: 16.65, b: 16.95}]},
  N4: {t0: B.napkin4, id: 'n4', sizes: [150, 150], lines: [{txt: 'family always asks', ...HERW, a: 17.75, b: 18.1}, {txt: 'about the apps.', ...HERW, a: 18.15, b: 18.5}]},
  N5: {t0: B.napkin5, id: 'n5', sizes: [170, 170], lines: [{txt: '“SO, STILL', ...HIMW, a: 20.05, b: 20.4}, {txt: 'SINGLE?”', ...HIMW, a: 20.45, b: 20.75}]},
  N6: {t0: B.napkin6, id: 'n6', sizes: [230], lines: [{txt: 'every. year.', ...HERW, a: 21.65, b: 22.1}]},
};
const NapkinInsert: React.FC<{t: number; kind: 'N0' | 'N1' | 'N2' | 'N3' | 'N4' | 'N5' | 'N6'}> = ({t, kind}) => {
  const I = INS[kind];
  const k = smooth(t, I.t0, I.t0 + 0.25);
  const x = lerp(1500, 540, k), rot = lerp(12, -2, k);
  const two = I.lines.length === 2;
  const ys = two ? [-62, 112] : [20];
  return <g>
    <InsertBG t={t} />
    <NapkinPaper w={840} h={560} x={x} y={790} rot={rot} id={I.id} glowA={0.9}>
      {I.lines.map((L, i) => {
        const s = fitW(L.txt, I.sizes[i], 700);
        const p = wp(t, L.a, L.b), w = textW(L.txt, `700 ${s}px ${HAND}`);
        return <g key={i}>
          <CrayonLine txt={L.txt} x={0} y={ys[i]} size={s} color={L.color} p={p} />
          {p > 0 && p < 1 && <CrayonSprite x={-w / 2 + w * p + 6} y={ys[i] - 10} color={L.color} skin={L.skin} sleeve={L.sleeve} />}
        </g>;
      })}
    </NapkinPaper>
  </g>;
};
const ReviewInsert: React.FC<{t: number}> = ({t}) => {
  const k = smooth(t, B.review, B.review + 0.25);
  return <g>
    <InsertBG t={t} />
    <g transform={`translate(${lerp(1500, 540, k)} 800) rotate(${lerp(10, -2, k)}) scale(1)`}><ReviewCard t={t} t0={B.review + 0.25} /></g>
  </g>;
};

// ------------------------------------------------------------------------------------------ close-ups: phone face-down, mug on top, the glow goes out
const PhoneBack: React.FC<{caseColor: string; glow: number}> = ({caseColor, glow}) => <g>
  <ellipse cx={0} cy={0} rx={330} ry={330} fill="url(#haloCool)" opacity={glow} />
  <rect x={-82} y={-148} width={164} height={296} rx={30} fill="none" stroke="#DFF7FF" strokeWidth={14} opacity={glow} />
  <rect x={-80} y={-146} width={160} height={292} rx={30} fill={caseColor} stroke={C.ink} strokeWidth={8} />
  <rect x={-62} y={-128} width={62} height={62} rx={16} fill="#00000033" stroke={C.ink} strokeWidth={5} />
  <circle cx={-44} cy={-110} r={11} fill="#111" stroke={C.ink} strokeWidth={3} /><circle cx={-18} cy={-84} r={11} fill="#111" stroke={C.ink} strokeWidth={3} />
  <path d="M 38 -110 L 38 100" stroke="#fff" strokeWidth={7} opacity={0.3} strokeLinecap="round" />
</g>;
const FlipPhone: React.FC<{x: number; y: number; s: number; k: number; caseColor: string; id: string; skin: string; glow: number}> = ({x, y, s, k, caseColor, id, skin, glow}) => {
  const sx = Math.cos(k * Math.PI);
  return <g transform={`translate(${x} ${y}) scale(${Math.abs(sx) * s + 0.001} ${s})`}>
    {k < 0.5 ? <Phone id={id} x={0} y={0} lit={1} p={0} thumb={0} caseColor={caseColor} skin={skin} /> : <PhoneBack caseColor={caseColor} glow={glow} />}
  </g>;
};
const MugDrop: React.FC<{x: number; land: number; t: number; arm: 'him' | 'her'}> = ({x, land, t, arm}) => {
  const S = 1.5, RESTY = 1037, sg = arm === 'him' ? 1 : -1;
  const k = wp(t, land - 0.5, land);
  const fall = t < land ? RESTY - 330 * (1 - k * k) : RESTY;
  const sq = t >= land ? 1 - 0.12 * Math.sin(wp(t, land, land + 0.2) * Math.PI) * (1 - wp(t, land, land + 0.2)) * 2 : 1;
  const hide = t < land - 0.5;
  const up = smooth(t, land + 0.1, land + 0.5);
  const S0: Pt = {x: arm === 'him' ? -140 : 1220, y: 1520};
  const Hh0: Pt = {x: x - sg * 20, y: fall - 118};
  const H: Pt = {x: lerp(Hh0.x, S0.x, up * 0.8), y: lerp(Hh0.y, S0.y, up * 0.8)};
  const Wr: Pt = {x: H.x - sg * 70, y: H.y - 82};
  const mid = {x: (S0.x + Wr.x) / 2, y: (S0.y + Wr.y) / 2};
  const E: Pt = {x: mid.x + sg * 0.8 * 120, y: mid.y + 0.6 * 120};
  const hit = wp(t, land, land + 0.4);
  return <g>
    {t >= land && t < land + 0.4 && <g stroke={C.ink} strokeWidth={9} strokeLinecap="round" opacity={1 - hit}><path d={`M ${x - 190} 1120 l -50 10 M ${x + 190} 1120 l 50 10 M ${x - 150} 1170 l -44 30 M ${x + 150} 1170 l 44 30`} /></g>}
    {!hide && <BentArm S={S0} E={E} W={Wr} H={H} sleeve={arm === 'him' ? C.rust : C.cran} skin={arm === 'him' ? C.skinHim : C.skinHer} w={96} />}
    {!hide && <g transform={`translate(${x} ${fall + 93 * (1 - sq)}) scale(${S} ${S * sq}) rotate(180)`}><Mug x={0} y={0} /></g>}
    {!hide && <g><circle cx={H.x} cy={H.y} r={50} fill={arm === 'him' ? C.skinHim : C.skinHer} stroke={C.ink} strokeWidth={7} />
      <path d={`M ${H.x - sg * 6} ${H.y + 6} q ${-sg * 4} 12 ${-sg * 18} 14 M ${H.x - sg * 22} ${H.y - 6} q ${-sg * 4} 12 ${-sg * 18} 14`} fill="none" stroke={C.ink} strokeWidth={4} opacity={0.5} strokeLinecap="round" /></g>}
  </g>;
};
const Cover: React.FC<{t: number; side: 'his' | 'hers'}> = ({t, side}) => {
  const HX = 300, RX = 780, PY = 1010;
  const his = side === 'his';
  const f = his ? B.flipHis : B.flipHers, land = his ? B.landHis : B.landHers;
  const k = smooth(t, f, f + 0.22);
  const glow = 0.95 * (1 - smooth(t, land, land + 0.3)) * (0.85 + 0.15 * Math.sin(t * 30));
  const handSide = (x: number, dir: number) => { const e = smooth(t, f - 0.2, f - 0.08) * (1 - smooth(t, f + 0.23, f + 0.35)); return {x: lerp(dir > 0 ? 1250 : -170, x + dir * 120, e), y: PY + 30}; };
  const fx = his ? HX : RX;
  const hh = handSide(fx, his ? -1 : 1);
  const buzz = (t0: number) => t >= t0 && t < t0 + 0.2 ? Math.sin(t * 120) * 8 * (1 - wp(t, t0, t0 + 0.2)) : 0;
  return <g>
    <CloseBG t={t} />
    <rect x={-100} y={-100} width={1300} height={2200} fill={C.navy} opacity={0.42} />
    {his
      ? <Phone id="cr" x={RX} y={PY} scale={1.15} lit={0.95} p={0} thumb={0} caseColor={C.pink} skin={C.skinHer} />
      : <g transform={`translate(${HX} 1037) scale(1.5) rotate(180)`}><Mug x={0} y={0} /></g>}
    <FlipPhone x={fx + (his ? buzz(land + 0.3) : 0)} y={PY} s={1.15} k={k} caseColor={his ? '#2C2C36' : C.pink} id="mf" skin={his ? C.skinHim : C.skinHer} glow={glow} />
    {t < f + 0.4 && <Arm who={his ? 'him' : 'her'} sx={his ? -300 : 1300} sy={1160} hx={hh.x} hy={hh.y} w={100} />}
    <MugDrop x={fx} land={land} t={t} arm={his ? 'him' : 'her'} />
    {his && t >= B.rewind + 0.1 && t < 12.55 && <g transform="translate(540 585) rotate(-4)">
      <rect x={-250} y={-64} width={500} height={128} rx={20} fill={C.ink} opacity={0.35} transform="translate(8 10)" />
      <rect x={-250} y={-64} width={500} height={128} rx={20} fill={C.pumpkin} stroke={C.ink} strokeWidth={8} />
      <polygon points="-196,0 -150,-30 -150,30" fill={C.ink} /><polygon points="-150,0 -104,-30 -104,30" fill={C.ink} />
      <text x={70} y={32} textAnchor="middle" fontFamily={ANTON} fontSize={96} fill={C.ink} letterSpacing={3}>{spec.cards.rewind_badge}</text>
    </g>}
  </g>;
};

// ------------------------------------------------------------------------------------------ the cliff: jukebox + vote
const Jukebox: React.FC<{x: number; y: number; t: number; on: number; s?: number}> = ({x, y, t, on, s = 1}) => {
  const cols = [C.pumpkin, '#FF3B4E', '#FFE9B0', '#7FE0C8'];
  const arc = Array.from({length: 11}, (_, i) => { const a = Math.PI + (i / 10) * Math.PI; return {x: Math.cos(a) * 118, y: -258 + Math.sin(a) * 118, i}; });
  const lamp = (i: number) => 0.18 + on * 0.82 * (Math.sin(t * 9 - i * 0.9) > -0.2 ? 1 : 0.25);
  return <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx={0} cy={-190} rx={330} ry={290} fill="url(#haloWarm)" opacity={on * 0.95} />
    <ellipse cx={0} cy={6} rx={170} ry={22} fill={C.ink} opacity={0.35} filter="url(#blurSh)" />
    <path d="M -150 0 L -150 -260 Q -150 -390 0 -390 Q 150 -390 150 -260 L 150 0 Z" fill="#8B1830" stroke={C.ink} strokeWidth={9} strokeLinejoin="round" />
    <path d="M -126 -12 L -126 -262 Q -126 -362 0 -362 Q 126 -362 126 -262 L 126 -12 Z" fill="none" stroke="url(#chromeG)" strokeWidth={14} strokeLinejoin="round" />
    <path d="M -108 -150 L -108 -262 Q -108 -340 0 -340 Q 108 -340 108 -262 L 108 -150 Z" fill="#1A0D08" stroke={C.ink} strokeWidth={6} />
    <g transform="translate(0 -236)">
      <g transform={`rotate(${(t * 220) % 360})`}>
        <circle r={70} fill="#15100E" stroke={C.ink} strokeWidth={5} />
        <circle r={52} fill="none" stroke="#3A322E" strokeWidth={3} /><circle r={36} fill="none" stroke="#3A322E" strokeWidth={3} />
        <circle r={24} fill={on > 0.5 ? C.pumpkin : '#6A4A2A'} stroke={C.ink} strokeWidth={4} /><rect x={-3} y={-24} width={6} height={20} fill={C.ink} /><circle r={5} fill={C.ink} />
        <path d="M 40 -34 Q 60 -14 62 8" fill="none" stroke="#fff" strokeWidth={6} opacity={0.35} strokeLinecap="round" />
      </g>
    </g>
    {arc.map((p) => <circle key={p.i} cx={p.x} cy={p.y - 10} r={9} fill={cols[p.i % 4]} stroke={C.ink} strokeWidth={3} opacity={lamp(p.i)} />)}
    <rect x={-100} y={-140} width={200} height={90} rx={10} fill="#3A0F1C" stroke={C.ink} strokeWidth={6} />
    {[-80, -56, -32, -8, 16, 40, 64].map((xx, i) => <rect key={i} x={xx} y={-130} width={10} height={70} rx={4} fill="url(#chromeG)" opacity={0.85} />)}
    <rect x={-44} y={-42} width={88} height={30} rx={8} fill={C.chrome} stroke={C.ink} strokeWidth={5} />
    <rect x={-6} y={-38} width={12} height={22} rx={3} fill={C.ink} />
    <rect x={-150} y={-28} width={300} height={28} fill="url(#chromeG)" stroke={C.ink} strokeWidth={7} />
    <Gloss x={-146} y={-380} w={120} h={360} a={0.18} id="juke" r={30} />
  </g>;
};

const Note: React.FC<{x: number; y: number; k: number}> = ({x, y, k}) => k <= 0 || k >= 1 ? null : <g transform={`translate(${x} ${y})`} opacity={Math.sin(k * Math.PI)}>
  <ellipse cx={0} cy={0} rx={15} ry={11} fill={C.custard} stroke={C.ink} strokeWidth={5} transform="rotate(-20)" />
  <path d="M 13 -4 L 13 -50 Q 34 -42 32 -26" fill="none" stroke={C.ink} strokeWidth={6} strokeLinecap="round" />
</g>;

const VoteScene: React.FC<{t: number}> = ({t}) => {
  const on = smooth(t, B.jukeOn, B.jukeOn + 0.2);
  const flash = t >= B.jukeOn && t < B.jukeOn + 0.3 ? 1 - wp(t, B.jukeOn, B.jukeOn + 0.3) : 0;
  const tiltK = smooth(t, B.jukeOn + 0.05, B.jukeOn + 0.6);
  const herP: Pose = {look: [-0.95, -0.25], brow: 0.7, worry: 0, mouth: 'smirk', happy: false, sweat: 0, gulp: 0, tilt: -13 * tiltK + Math.sin(t * 1.5) * 0.8, bob: Math.sin(t * 2.2) * 3, sq: 1 + 0.012 * Math.sin(t * 2), blink: blinkAt(t, 1.9), flush: 0};
  const z = 1 + 0.02 * clamp((t - VOTE_AT) / 6);
  const coinK = Math.cos(t * 8);
  const hand: Pt = {x: 640, y: 700 + Math.sin(t * 3) * 5};
  const CH = (id: string) => (spec.choices as unknown as Record<string, {l1: string; l2: string}>)[id];
  return <g transform={`translate(540 960) scale(${z}) translate(-540 -960)`}>
    <Far t={t} />
    <rect x={-100} y={-100} width={1300} height={2200} fill={C.ink} opacity={0.4} />
    <Jukebox x={250} y={820} t={t} on={on} s={0.82} />
    {Array.from({length: 5}, (_, i) => <Note key={i} x={330 + Math.sin(t * 2 + i * 1.7) * 30 + (i - 2) * 22} y={700 - (((t * 0.55 + i * 0.2) % 1) * 200)} k={on > 0.5 ? ((t * 0.55 + i * 0.2) % 1) : 0} />)}
    <g transform="translate(0 0)"><Person who="her" x={800} y={770} s={0.6} pose={herP} /></g>
    {/* her sleeve + hand; the coin travels from her hand to his */}
    {(() => {
      const give = smooth(t, 25.3, 26.1);
      const HIS: Pt = {x: 430, y: 735}, HERH: Pt = {x: 640, y: 700 + Math.sin(t * 3) * 4};
      const arrive = smooth(t, 25.0, 25.4);
      const hisH: Pt = {x: lerp(-60, HIS.x, arrive), y: HIS.y};
      const coinP: Pt = {x: lerp(HERH.x - 4, HIS.x + 6, give), y: lerp(HERH.y - 48, HIS.y - 48, give) - 70 * Math.sin(give * Math.PI)};
      const cs = give > 0 && give < 1 ? Math.cos(t * 22) : Math.cos(t * 6);
      return <g>
        <path d={`M 880 880 Q 790 800 ${HERH.x + 20} ${HERH.y + 30}`} fill="none" stroke={C.ink} strokeWidth={70} strokeLinecap="round" />
        <path d={`M 880 880 Q 790 800 ${HERH.x + 20} ${HERH.y + 30}`} fill="none" stroke={C.cran} strokeWidth={56} strokeLinecap="round" />
        <circle cx={HERH.x} cy={HERH.y + 22} r={36} fill={C.skinHer} stroke={C.ink} strokeWidth={6} />
        <path d={`M -80 ${hisH.y + 70} Q ${hisH.x * 0.5} ${hisH.y + 90} ${hisH.x - 30} ${hisH.y + 30}`} fill="none" stroke={C.ink} strokeWidth={74} strokeLinecap="round" />
        <path d={`M -80 ${hisH.y + 70} Q ${hisH.x * 0.5} ${hisH.y + 90} ${hisH.x - 30} ${hisH.y + 30}`} fill="none" stroke={C.rust} strokeWidth={60} strokeLinecap="round" />
        <circle cx={hisH.x} cy={hisH.y + 22} r={38} fill={C.skinHim} stroke={C.ink} strokeWidth={6} />
        <g transform={`translate(${coinP.x} ${coinP.y}) scale(${Math.abs(cs) * 1 + 0.08} 1)`}>
          <circle r={36} fill={C.gold} stroke={C.ink} strokeWidth={7} /><circle r={25} fill="none" stroke="#B88414" strokeWidth={4} />
          <path d="M -16 -12 L -4 -20" stroke="#fff" strokeWidth={6} strokeLinecap="round" opacity={0.9} />
        </g>
      </g>;
    })()}
    <rect x={-100} y={905} width={1300} height={130} fill="url(#counterTop)" stroke={C.ink} strokeWidth={8} />
    <Counter />
    {flash > 0 && <rect x={-100} y={-100} width={1300} height={2200} fill="#FFF3C8" opacity={0.45 * flash} />}
    {[['A', 880, -1.2, 'va', B.cardA], ['B', 1065, 1.2, 'vb', B.cardB]].map(([L, y, rot, id, at], i) => {
      const ph = Math.max(0, t - VOTE_AT - 0.3) / 1.4 % 2;
      const hl = t < VOTE_AT + 0.3 ? 0 : i === 0 ? (ph < 1 ? Math.sin(ph * Math.PI) : 0) : (ph >= 1 ? Math.sin((ph - 1) * Math.PI) : 0);
      const yy = y as number; const SC = 0.78;
      return <g key={id as string} transform={`translate(540 ${yy}) scale(${SC * (1 + 0.045 * hl)}) translate(-540 ${-yy})`}>
        <rect x={50} y={yy - 132} width={980} height={264} rx={18} fill={C.pumpkin} opacity={0.5 * hl} filter="url(#blurSh)" />
        <VoteCard letter={L as string} l1={CH(L as string).l1} l2={CH(L as string).l2} y={yy} age={t - (at as number)} rot={rot as number} id={id as string} />
      </g>;
    })}
  </g>;
};

const renderShot = (t: number, hook: Hook, id: ShotId = shotAt(t)): React.ReactNode => {
  if (id === 'N0' || id === 'N1' || id === 'N2' || id === 'N3' || id === 'N4' || id === 'N5' || id === 'N6') return <NapkinInsert t={t} kind={id} />;
  if (id === 'RV') return <ReviewInsert t={t} />;
  if (id === 'C1') return <Cover t={t} side="his" />;
  if (id === 'C2') return <Cover t={t} side="hers" />;
  if (id === 'vote') return <VoteScene t={t} />;
  if (id === 'end') return <EndCard a={t - B.endcard} t={t} pill={spec.cards.end_pill} kicker={spec.cards.end_kicker} />;
  return <Diner t={t} hook={hook} />;
};

const Scene: React.FC<{hook: Hook}> = ({hook}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const wipe1 = t >= REWIND_AT && t < REWIND_AT + WIPE_DUR;
  const wipe2 = t >= VOTE_WIPE && t < VOTE_AT;
  const inWipe = wipe1 || wipe2;
  const k = wipe1 ? (t - REWIND_AT) / WIPE_DUR : wipe2 ? (t - VOTE_WIPE) / WIPE_DUR : 0;
  const mirror = 'translate(1080 0) scale(-1 1)';
  return <>
    <MotionBlurWhen fast={inWipe} samples={5} shutter={220}>
      <AbsoluteFill>
        <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, background: C.teal}}>
          <Defs />
          {inWipe ? <>
            {renderShot(wipe1 ? REWIND_AT - 0.01 : VOTE_WIPE - 0.01, hook, 'D')}
            <defs>{wipe1 ? <clipPath id="sliceNew"><WipeClipPoly k={k} tf={mirror} /></clipPath> : <WipeClip k={k} />}</defs>
            <g clipPath="url(#sliceNew)">{wipe1 ? <Cover t={t} side="his" /> : <VoteScene t={t} />}</g>
            {wipe1 ? <g transform={mirror}><WipeRim k={k} /></g> : <WipeRim k={k} />}
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
          return <Strip key={i} text={s.text} y={s.y} age={t - s.from + (isHook ? 1 : 0.06)} out={isHook ? smooth(t, 3.0, 3.2) : smooth(t, s.to - 0.12, s.to)} size={(s as {size?: number}).size ?? (comment ? 60 : 56)} hot={comment} maxW={(s as {maxW?: number}).maxW ?? (comment ? 760 : 1000)} />;
        })}
      </svg>
    </AbsoluteFill>
  </>;
};

export const Pie3: React.FC<{hook?: Hook}> = ({hook = 'a'}) => (
  <AbsoluteFill style={{background: C.teal}}>
    <Audio src={staticFile('audio/pie-ep3.wav')} volume={0.9} />
    <Sequence from={Math.round(spec.audio.hookSlide[hook] * PIE3_FPS)}><Audio src={staticFile('audio/pie-ep3-slide.wav')} volume={0.8} /></Sequence>
    <Scene hook={hook} />
  </AbsoluteFill>
);
