import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, lerp, smooth} from '../../lib/motion';
import {MotionBlurWhen} from '../../lib/shots';
import {
  Arm, Beanie, C, COUR, Cam, Counter, CrayonCup, CrayonLine, CrayonSprite, Defs, Dispenser, EndCard, Far, Gloss, HAND, ANTON, Mouth, Mug, NapkinPaper, Person, Phone, PieCase,
  Pose, Steam, Strip, Sugar, VoteCard, WIPE_DUR, WipeClip, WipeRim, ClockSign, planeT, textW,
} from './world';
import spec from '../../../specs/stories/pie-ep4.json';

// Pie for Two, part 4 "Last call". Silent. Opener = ONE strip, two big faces, both phones lit mid-swipe, the jukebox lit behind them, the coin in his
// hand. Take 1 (B, SOMETHING DUMB): coin in, kazoo/tuba polka, neon flicker, waitress stare, coffee jumps onto his jacket, she covers her face. Counter-
// clockwise slice wipe (rewind). Take 2 (A, SOMETHING SLOW): slow ballad, stools turn, sway, chin on hand, napkins; the phones-buzz-then-mug gag; the
// waitress slaps the check "1 PIE . 2 FORKS", both reach; vote board; 3 s end card.

export const PIE4_FPS = 60;
export const PIE4_FRAMES = Math.round(spec.duration * PIE4_FPS);
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

const Waitress: React.FC<{up: number; look: [number, number]}> = ({up, look}) => {
  if (up < 0.01) return null;
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
type ShotId = 'D' | 'N0' | 'N1' | 'N2' | 'J1' | 'J2' | 'PG' | 'CK' | 'vote' | 'end';
const SHOTS: [number, ShotId][] = [[0, 'D'], [B.napkin0, 'N0'], [B.take1, 'J1'], [B.chaos, 'D'], [B.take2, 'J2'], [B.slow, 'D'], [B.napkin1, 'N1'], [B.napkin2, 'N2'], [B.quiet, 'D'],
  [B.gag, 'PG'], [B.check, 'D'], [B.checkIns, 'CK'], [B.reach, 'D'], [VOTE_AT, 'vote'], [B.endcard, 'end']];
const shotAt = (t: number): ShotId => keyAt(SHOTS, t);

type Seg = [number, number, [number, number, number], [number, number, number]];
const CAM_SEGS: Seg[] = [
  [0, 3.2, [540, 960, 1.0], [540, 975, 1.035]], [B.chaos, B.rewind, [540, 960, 1.0], [520, 950, 1.07]], [B.rewind, B.take2, [540, 975, 1.0], [540, 975, 1.04]],
  [B.slow, B.napkin1, [540, 985, 1.0], [540, 960, 1.07]], [B.quiet, B.gag, [540, 955, 1.05], [540, 900, 1.16]], [B.check, B.reach, [540, 985, 1.0], [540, 990, 1.05]],
  [B.reach, B.voteWipe, [540, 990, 1.05], [540, 985, 1.1]],
];
const camOf = (t: number): Cam => {
  let seg = CAM_SEGS[0];
  for (const s of CAM_SEGS) if (t >= s[0]) seg = s;
  const k = clamp((t - seg[0]) / (seg[1] - seg[0]));
  const shake = t >= B.chaos && t < B.splash + 0.5 ? Math.sin(t * 73) * 3.2 * clamp((t - B.chaos) / 0.6) : 0;
  return {x: lerp(seg[2][0], seg[3][0], k) + shake, y: lerp(seg[2][1], seg[3][1], k) + shake * 0.6, z: lerp(seg[2][2], seg[3][2], k)};
};

// ------------------------------------------------------------------------------------------ faces
const HIM = {x: 270, y: 895}, HER = {x: 810, y: 895};
const TURN_X = 90;
const blinkAt = (t: number, seed: number) => { const ph = (t + seed) % 3.7; return ph < 0.14 ? Math.sin((ph / 0.14) * Math.PI) : 0; };
const BEAT = 60 / spec.audio.polkaBpm;
const polkaBob = (t: number, amp: number) => (t >= B.chaos && t < B.splash ? -Math.abs(Math.sin((Math.PI * (t - B.chaos)) / BEAT)) * amp : 0);
// stool turn (face each other) 12.95-13.75, turn back 22.3-22.9
const turnK = (t: number) => (t < B.check ? smooth(t, B.turn, B.turn + 0.8) : 1 - smooth(t, 22.3, 22.9));
const turnBlend = (t: number) => (t < B.check ? Math.sin(wp(t, B.turn, B.turn + 0.8) * Math.PI) : Math.sin(wp(t, 22.3, 22.9) * Math.PI));

const HL: KF[] = [[3.2, 0.5, 0.95], [6.3, 0.5, 0.95], [6.5, 0.3, -0.2], [7.6, 0.3, -0.2], [7.9, 0.5, 0.9], [8.5, 0.3, 1.0], [9.4, 0.3, 1.0], [9.8, 0.9, 0.2], [10.2, 0.9, 0.2], [10.6, 0.5, 0.95], [11.5, 0.5, 0.95],
  [12.7, 0.4, -0.1], [13.0, 0.8, 0.0], [13.8, 0.7, 0.1], [22.2, 0.7, 0.1], [22.9, 0.3, 0.95], [25.0, 0.3, 0.95], [25.4, 0.9, 0.15]];
const RL: KF[] = [[3.2, -0.9, 0.2], [6.3, -0.9, 0.2], [6.5, -0.4, -0.2], [7.6, -0.5, -0.2], [7.9, -0.9, 0.3], [10.2, -0.9, 0.1], [12.7, -0.5, -0.1], [13.0, -0.8, 0.0], [13.8, -0.7, 0.1], [22.2, -0.7, 0.1],
  [22.9, -0.3, 0.95], [25.0, -0.3, 0.95], [25.4, -0.9, 0.15]];
const HM: [number, Mouth][] = [[3.2, 'grit'], [6.3, 'o'], [8.5, 'flat'], [9.4, 'gulp'], [10.2, 'soft'], [12.7, 'soft'], [15.0, 'soft'], [18.5, 'soft'], [22.9, 'gulp'], [25.0, 'grit'], [25.4, 'o']];
const RM: [number, Mouth][] = [[3.2, 'smile'], [6.3, 'o'], [7.9, 'flat'], [8.6, 'o'], [10.2, 'smile'], [12.7, 'soft'], [18.5, 'soft'], [22.9, 'smirk'], [25.0, 'grit'], [25.4, 'o']];

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
    look = kf(HL, t); mouth = keyAt(HM, t); flush = 0.45;
    if (t >= B.chaos && t < B.rewind) {
      bob = polkaBob(t, 9);
      brow = t < B.splash ? 0.8 : 0.5;
      if (t >= B.splash) { flush = 0.9; sweat = smooth(t, B.splash + 0.3, B.splash + 0.8) * 0.9; tilt = 3 + Math.sin(t * 30) * (t < B.splash + 0.5 ? 3 : 0); }
      if (t > 9.4 && t < 9.9) gulp = Math.sin(wp(t, 9.4, 9.9) * Math.PI);
    } else if (t >= B.rewind && t < B.take2) { flush = 0.4; brow = 0.3; }
    else if (t >= B.slow && t < B.check) {
      const sw = Math.sin((t - B.turn) * ((2 * Math.PI) / 3.16));
      flush = 0.3 + 0.35 * smooth(t, 13.8, 15);
      tilt = (4 + sw * 2.4) * turnK(t) + Math.sin(t * 0.9) * 0.6;
      bob = sw * 3 * turnK(t);
      if (t >= B.napkin2 && t < B.quiet) mouth = 'smile';
    } else if (t >= B.check) {
      sweat = t >= B.check + 0.4 && t < B.reach + 0.5 ? 0.45 : 0; flush = 0.6; brow = t >= B.reach ? 0.8 : 0.3; tilt = t >= B.reach ? 4 * smooth(t, B.reach, B.reach + 0.3) : 0;
      bob = t >= B.reach ? 18 * smooth(t, B.reach, B.reach + 0.3) : 0;
    }
  }
  return {look: [look[0], look[1]], brow, worry: sweat * 0.8, mouth, happy, sweat, gulp, tilt, bob, sq, blink: happy ? 0 : blinkAt(t, 0.4), flush};
};
const herPose = (t: number, hook: Hook): Pose => {
  let look: number[]; let mouth: Mouth; let brow = 0.1; const happy = false; let bob = 0; let tilt = Math.sin(t * 0.8 + 2) * 1.2;
  if (t < B.napkin0) {
    const keys: KF[] = hook === 'a' ? [[0, -0.1, 0.75], [0.5, -0.1, 0.75], [0.8, -0.9, 0.25], [1.2, -0.9, 0.25], [3.2, -0.9, 0.2]]
      : [[0, -0.1, 0.75], [0.25, -0.1, 0.75], [0.4, -1.0, 0.85], [1.5, -1.0, 0.85], [1.8, -0.9, 0.2], [3.2, -0.9, 0.2]];
    look = kf(keys, t);
    mouth = hook === 'a' ? (t < 0.6 ? 'flat' : 'smirk') : (t < 0.4 ? 'flat' : t < 1.5 ? 'o' : 'smirk');
    brow = 0.1 + (hook === 'b' ? 0.8 * pulse(t, 0.4, 1.3) : 0.3);
  } else {
    look = kf(RL, t); mouth = keyAt(RM, t);
    if (t >= B.chaos && t < B.rewind) {
      bob = polkaBob(t, 4);
      brow = t < 7.9 ? 0.8 : 0.2;
      if (t >= B.faceCover) { tilt = 3 + Math.sin(t * 24) * 1.6; bob = Math.sin(t * 24) * 3; }
    } else if (t >= B.slow && t < B.check) {
      const sw = Math.sin((t - B.turn) * ((2 * Math.PI) / 3.16) + Math.PI);
      tilt = (-4 + sw * 2.4) * turnK(t) + Math.sin(t * 0.8 + 2) * 0.6;
      bob = sw * 3 * turnK(t);
      if (t >= B.chin) { tilt = -7 * smooth(t, B.chin, B.chin + 0.4) * turnK(t); mouth = t >= B.napkin1 ? 'smile' : 'soft'; }
    } else if (t >= B.check) {
      brow = t >= B.reach ? 0.8 : 0.3; tilt = t >= B.reach ? -4 * smooth(t, B.reach, B.reach + 0.3) : 0; bob = t >= B.reach ? 18 * smooth(t, B.reach, B.reach + 0.3) : 0;
    }
  }
  return {look: [look[0], look[1]], brow, worry: 0, mouth, happy, sweat: 0, gulp: 0, tilt, bob, sq: 1 + 0.014 * Math.sin(t * 2 + 1.3), blink: blinkAt(t, 1.9), flush: 0};
};

// ------------------------------------------------------------------------------------------ phones, mugs, cups, coin
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
type PhoneState = {x: number; y: number; rot: number; s: number; flat: number; lit: number; p: number; dir: number; thumb: number; flip: number};
const himPhone = (t: number, hook: Hook): PhoneState => {
  if (t >= B.napkin0) return {x: HIM_FLAT.x, y: HIM_FLAT.y, rot: 0, s: HIM_FLAT.s, flat: 1, lit: 0.5, p: 0, dir: 1, thumb: 0, flip: 0};
  const sw = phoneSwipe(HIM_TICKS, t, hook === 'a' ? 1.45 : 0.6);
  let pos = {x: 250, y: 930, rot: -3, s: 0.8, lit: 1};
  let flat = 0, flip = 0;
  if (hook === 'b' && t > 0.6) {
    const k = smooth(t, 0.6, 0.95);
    pos = {x: lerp(250, 205, k), y: lerp(930, 1010, k), rot: lerp(-3, 30, k), s: lerp(0.8, 0.72, k), lit: 1};
    flip = smooth(t, 0.65, 0.95);
    const k3 = smooth(t, 1.0, 1.6);
    pos = {x: lerp(pos.x, HIM_FLAT.x, k3), y: lerp(pos.y, HIM_FLAT.y, k3), rot: lerp(pos.rot, 0, k3), s: lerp(pos.s, HIM_FLAT.s, k3), lit: 1};
    flat = k3;
  }
  const k2 = smooth(t, LOW0, LOW1);
  if (hook === 'a') return {x: lerp(pos.x, HIM_FLAT.x, k2), y: lerp(pos.y, HIM_FLAT.y, k2), rot: lerp(pos.rot, 0, k2), s: lerp(pos.s, HIM_FLAT.s, k2), flat: k2, lit: t < LOW0 ? pos.lit : lerp(pos.lit, 0.5, k2), p: sw.p, dir: sw.dir, thumb: sw.on ? 1 : 0, flip: 0};
  return {...pos, flat, lit: 1, p: sw.p, dir: sw.dir, thumb: sw.on ? 1 : 0, flip};
};
const herPhone = (t: number, hook: Hook): PhoneState => {
  const sw = phoneSwipe(HER_TICKS, t, hook === 'b' ? 0.3 : 1.45);
  const k2 = t >= B.napkin0 ? 1 : hook === 'b' ? smooth(t, 0.25, 0.7) : smooth(t, LOW0, LOW1);
  return {x: lerp(705, HER_FLAT.x, k2), y: lerp(910, HER_FLAT.y, k2), rot: lerp(6, 0, k2), s: lerp(0.74, HER_FLAT.s, k2), flat: k2, lit: lerp(1, 0.5, k2), p: sw.p, dir: sw.dir, thumb: sw.on ? 1 : 0, flip: 0};
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

const Spark: React.FC<{x: number; y: number; k: number}> = ({x, y, k}) => {
  if (k <= 0 || k >= 1) return null;
  const s = 0.6 + k * 1.1;
  const pts = Array.from({length: 16}, (_, i) => { const a = (i / 16) * Math.PI * 2, r = i % 2 ? 16 : 46; return `${Math.cos(a) * r},${Math.sin(a) * r}`; }).join(' ');
  return <g transform={`translate(${x} ${y}) scale(${s}) rotate(${k * 40})`} opacity={1 - k * k}>
    <polygon points={pts} fill="#fff" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <polygon points={pts} fill="#FFF3B0" transform="scale(0.55)" />
  </g>;
};

const PhoneBack: React.FC<{caseColor: string; glow: number}> = ({caseColor, glow}) => <g>
  <ellipse cx={0} cy={0} rx={330} ry={330} fill="url(#haloCool)" opacity={glow} />
  <rect x={-82} y={-148} width={164} height={296} rx={30} fill="none" stroke="#DFF7FF" strokeWidth={14} opacity={glow} />
  <rect x={-80} y={-146} width={160} height={292} rx={30} fill={caseColor} stroke={C.ink} strokeWidth={8} />
  <rect x={-62} y={-128} width={62} height={62} rx={16} fill="#00000033" stroke={C.ink} strokeWidth={5} />
  <circle cx={-44} cy={-110} r={11} fill="#111" stroke={C.ink} strokeWidth={3} /><circle cx={-18} cy={-84} r={11} fill="#111" stroke={C.ink} strokeWidth={3} />
  <path d="M 38 -110 L 38 100" stroke="#fff" strokeWidth={7} opacity={0.3} strokeLinecap="round" />

</g>;

const Coin: React.FC<{x: number; y: number; t: number; r?: number}> = ({x, y, t, r = 36}) => {
  const cs = Math.cos(t * 7);
  return <g transform={`translate(${x} ${y}) scale(${Math.abs(cs) * 0.9 + 0.1} 1)`}>
    <circle r={r + 14} fill="#FFF3B0" opacity={0.35} />
    <circle r={r} fill={C.gold} stroke={C.ink} strokeWidth={7} /><circle r={r * 0.69} fill="none" stroke="#B88414" strokeWidth={4} />
    <path d={`M ${-r * 0.45} ${-r * 0.33} L ${-r * 0.1} ${-r * 0.55}`} stroke="#fff" strokeWidth={6} strokeLinecap="round" opacity={0.9} />
  </g>;
};

// ------------------------------------------------------------------------------------------ jukebox + notes
const Jukebox: React.FC<{x: number; y: number; t: number; on: number; s?: number; rate?: number; spin?: number}> = ({x, y, t, on, s = 1, rate = 9, spin = 220}) => {
  const cols = [C.pumpkin, '#FF3B4E', '#FFE9B0', '#7FE0C8'];
  const arc = Array.from({length: 11}, (_, i) => { const a = Math.PI + (i / 10) * Math.PI; return {x: Math.cos(a) * 118, y: -258 + Math.sin(a) * 118, i}; });
  const lamp = (i: number) => 0.18 + on * 0.82 * (Math.sin(t * rate - i * 0.9) > -0.2 ? 1 : 0.25);
  return <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx={0} cy={-190} rx={330} ry={290} fill="url(#haloWarm)" opacity={on * 0.95} />
    <ellipse cx={0} cy={6} rx={170} ry={22} fill={C.ink} opacity={0.35} filter="url(#blurSh)" />
    <path d="M -150 0 L -150 -260 Q -150 -390 0 -390 Q 150 -390 150 -260 L 150 0 Z" fill="#8B1830" stroke={C.ink} strokeWidth={9} strokeLinejoin="round" />
    <path d="M -126 -12 L -126 -262 Q -126 -362 0 -362 Q 126 -362 126 -262 L 126 -12 Z" fill="none" stroke="url(#chromeG)" strokeWidth={14} strokeLinejoin="round" />
    <path d="M -108 -150 L -108 -262 Q -108 -340 0 -340 Q 108 -340 108 -262 L 108 -150 Z" fill="#1A0D08" stroke={C.ink} strokeWidth={6} />
    <g transform="translate(0 -236)">
      <g transform={`rotate(${(t * spin) % 360})`}>
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

const Note: React.FC<{x: number; y: number; k: number; s?: number}> = ({x, y, k, s = 1}) => k <= 0 || k >= 1 ? null : <g transform={`translate(${x} ${y}) scale(${s})`} opacity={Math.sin(k * Math.PI)}>
  <ellipse cx={0} cy={0} rx={15} ry={11} fill={C.custard} stroke={C.ink} strokeWidth={5} transform="rotate(-20)" />
  <path d="M 13 -4 L 13 -50 Q 34 -42 32 -26" fill="none" stroke={C.ink} strokeWidth={6} strokeLinecap="round" />
</g>;
const Notes: React.FC<{t: number; x: number; y: number; n: number; rate: number; spread: number; s?: number}> = ({t, x, y, n, rate, spread, s = 1}) => <g>
  {Array.from({length: n}, (_, i) => { const ph = (t * rate + i / n) % 1; return <Note key={i} x={x + Math.sin(t * 2 + i * 1.7) * spread + (i - n / 2) * spread * 0.5} y={y - ph * 230} k={ph} s={s} />; })}
</g>;

// ------------------------------------------------------------------------------------------ guest check
const fitC = (txt: string, size: number, maxW: number) => Math.min(size, (size * maxW) / textW(txt, `700 ${size}px ${COUR}`));
const CheckSlip: React.FC<{w?: number; h?: number}> = ({w = 860, h = 560}) => {
  const x0 = -w / 2, y0 = -h / 2, nz = Math.round(w / 30);
  const top: string[] = [], bot: string[] = [];
  for (let i = 0; i <= nz; i++) { top.push(`${x0 + (w * i) / nz},${y0 + (i % 2 ? 12 : 0)}`); bot.push(`${x0 + w - (w * i) / nz},${y0 + h - (i % 2 ? 12 : 0)}`); }
  const pts = [...top, ...bot].join(' ');
  const main = spec.check.line;
  const ms = fitC(main, 100, w - 90);
  return <g>
    <polygon points={pts} fill={C.ink} opacity={0.35} transform="translate(12 16)" />
    <polygon points={pts} fill={C.custard} stroke={C.ink} strokeWidth={7} strokeLinejoin="round" />
    <text x={0} y={y0 + 98} textAnchor="middle" fontFamily={COUR} fontWeight={700} fontSize={54} fill={C.cran} letterSpacing={6}>{spec.check.title}</text>
    <path d={`M ${x0 + 50} ${y0 + 132} L ${x0 + w - 50} ${y0 + 132}`} stroke={C.ink} strokeWidth={4} strokeDasharray="4 14" strokeLinecap="round" opacity={0.6} />
    <text x={x0 + 54} y={y0 + 196} fontFamily={COUR} fontWeight={700} fontSize={40} fill={C.ink} opacity={0.75}>{spec.check.tbl}</text>
    <text x={x0 + w - 54} y={y0 + 196} textAnchor="end" fontFamily={COUR} fontWeight={700} fontSize={40} fill={C.ink} opacity={0.75}>{spec.check.time}</text>
    <text x={0} y={y0 + 346} textAnchor="middle" fontFamily={COUR} fontWeight={700} fontSize={ms} fill={C.ink}>{main}</text>
    <path d={`M ${x0 + 50} ${y0 + 400} L ${x0 + w - 50} ${y0 + 400}`} stroke={C.ink} strokeWidth={4} strokeDasharray="4 14" strokeLinecap="round" opacity={0.6} />
    <rect x={x0 + 54} y={y0 + h - 100} width={w - 108} height={5} fill={C.cran} opacity={0.45} />
  </g>;
};

// ------------------------------------------------------------------------------------------ the counter scene
const rolling = (t: number, t0: number, t1: number) => wp(t, t0, t1);
const COIN_HAND: Pt = {x: 345, y: 1118};
const Diner: React.FC<{t: number; hook: Hook}> = ({t, hook}) => {
  const cam = camOf(t);
  const him = himPose(t, hook), her = herPose(t, hook);
  const hp = himPhone(t, hook), rp = herPhone(t, hook);
  const inHook = t < B.napkin0;
  const chaos = t >= B.chaos && t < B.rewind;
  const calm = t >= B.rewind && t < B.take2;
  const tk = turnK(t), tb = turnBlend(t);
  const ox = TURN_X * tk;
  const hx = HIM.x + ox, rx = HER.x - ox;
  const sxs = 1 - 0.16 * tb;
  const underHers = t >= B.landHers, underHis = t >= B.landHis;

  // arms
  const hold = t < LOW1 + 0.3;
  const hisHold: Pt = {x: hp.x - 30 * (1 - hp.flat), y: hp.y + 104 * hp.s * (1 - hp.flat * 0.5)};
  const herHold: Pt = {x: rp.x + 24, y: rp.y + 96 * rp.s * (1 - rp.flat * 0.4)};
  const HIS_REST: Pt = {x: 215, y: 1236}, HER_REST: Pt = {x: 870, y: 1236};
  const coinUp = inHook ? (hook === 'a' ? 1 : smooth(t, 1.4, 1.9)) : calm ? smooth(t, B.rewind, B.rewind + 0.3) : 0;
  let hisA: Pt = {x: lerp(HIS_REST.x, COIN_HAND.x, coinUp), y: lerp(HIS_REST.y, COIN_HAND.y, coinUp)};
  let herA: Pt = HER_REST;
  const chinK = t >= B.chin && t < B.check ? smooth(t, B.chin, B.chin + 0.5) : 0;
  if (chinK > 0) herA = {x: lerp(HER_REST.x, rx + 6, chinK), y: lerp(HER_REST.y, HER.y + 6 + her.bob, chinK)};
  const coverK = chaos ? smooth(t, B.faceCover, B.faceCover + 0.25) : 0;
  if (coverK > 0) herA = {x: lerp(HER_REST.x, HER.x + 120, coverK), y: lerp(HER_REST.y, HER.y - 150, coverK)};
  const rk = t >= B.reach ? smooth(t, B.reach, B.reach + 0.4) : 0;
  const CHK: Pt = {x: 540, y: 1148};
  if (rk > 0) {
    hisA = {x: lerp(HIS_REST.x, CHK.x - 70, rk), y: lerp(HIS_REST.y, CHK.y, rk) + Math.sin(t * 40) * 3 * smooth(t, B.reach + 0.4, B.reach + 0.5)};
    herA = {x: lerp(HER_REST.x, CHK.x + 70, rk), y: lerp(HER_REST.y, CHK.y, rk) - Math.sin(t * 40) * 3 * smooth(t, B.reach + 0.4, B.reach + 0.5)};
  }

  // cups: his coffee shakes under the polka, then jumps onto his jacket
  const shakeA = chaos ? 4.5 * wp(t, B.chaos, B.splash) : 0;
  const jump = t >= B.splash - 0.12 && t < B.splash + 0.45 ? Math.sin(wp(t, B.splash - 0.12, B.splash + 0.45) * Math.PI) * 70 : 0;
  const cupHis = {x: 480 + Math.sin(t * 95) * shakeA, y: 1125 - jump, rot: Math.sin(t * 61) * shakeA * 0.9 + (jump > 0 ? -14 * Math.sin(wp(t, B.splash - 0.12, B.splash + 0.45) * Math.PI) : 0)};
  const cupHer = {x: 610 + Math.sin(t * 90 + 1) * shakeA * 0.5, y: 1125, rot: Math.sin(t * 57) * shakeA * 0.4};

  // waitress
  const up = t < B.rewind ? smooth(t, B.waitressUp, B.waitressUp + 0.35) : smooth(t, B.check, B.check + 0.35);
  const wOn = t >= B.check + 0.1 && t < B.checkIns;
  const wk = smooth(t, 22.85, B.slap), wBack = smooth(t, B.slap + 0.12, B.slap + 0.45);
  const wHand: Pt = {x: lerp(470, CHK.x, wk) - wBack * 60, y: lerp(930, CHK.y - 10, wk) - wBack * 170};
  const checkOn = t >= B.slap;
  const chkAt: Pt = t < B.slap + 0.12 ? wHand : CHK;
  const flick = t >= 7.2 && t < 8.3 ? (Math.sin(t * 46) > 0.15 ? 0.7 : 0) : 0;
  const jOn = inHook ? (hook === 'a' ? 0.85 : 0.5 + 0.5 * smooth(t, 1.55, 1.8)) : chaos ? 1 : 0.75;
  const jPulse = chaos ? 1 + 0.05 * Math.abs(Math.sin((Math.PI * (t - B.chaos)) / BEAT)) : 1;
  const stoolSw = 1 - 0.45 * tb;
  const showBadge = t >= B.rewind && t < B.take2;

  const splashK = wp(t, B.splash, B.splash + 0.45);
  const stainK = smooth(t, B.splash + 0.4, B.splash + 1.1);
  const wLook: [number, number] = [0, 0.15];
  return <g>
    <g transform={planeT(cam, 0.3)}><Far t={t} />{flick > 0 && <rect x={-400} y={-400} width={1900} height={1500} fill={C.ink} opacity={flick} />}</g>
    <g transform={planeT(cam, 0.55)}>
      <ClockSign x={540} y={522} text={t >= B.check - 0.01 ? spec.cards.clock2 : spec.cards.clock1} />
    </g>
    <g transform={planeT(cam, 0.9)}>
      <Beanie x={1018} y={990} />
      <Jukebox x={540} y={1012} t={t} on={jOn} s={1.1 * jPulse} rate={chaos ? 16 : 7} spin={chaos ? 520 : 150} />
      <Waitress up={up} look={wLook} />
      <g transform={`translate(${hx} 0) scale(${sxs} 1) translate(${-hx} 0)`}><Person who="him" x={hx} y={HIM.y} pose={him} /></g>
      {t >= B.splash + 0.3 && t < B.rewind && stainK > 0 && <g transform={`translate(${hx + 40} ${him.bob + 975}) scale(1.35)`} opacity={0.97}>
        <ellipse cx={0} cy={0} rx={70 * stainK} ry={34 * stainK} fill="#3E2012" stroke="#FFE7A8" strokeWidth={5} />
        <ellipse cx={-34 * stainK} cy={18 * stainK} rx={22 * stainK} ry={14 * stainK} fill="#5A3322" />
        {[[-30, 20, 40], [12, 22, 56], [38, 14, 30]].map(([dx, dy, h], i) => <path key={i} d={`M ${dx * stainK} ${dy * stainK} l 0 ${h * stainK * 0.6}`} stroke="#5A3322" strokeWidth={9} strokeLinecap="round" />)}
        <path d="M -30 -14 q 24 -12 56 -4" stroke="#8A5A3A" strokeWidth={6} strokeLinecap="round" fill="none" opacity={0.7} />
      </g>}
      <g transform={`translate(${rx} 0) scale(${sxs} 1) translate(${-rx} 0)`}><Person who="her" x={rx} y={HER.y} pose={her} /></g>
      <Counter stools={[{x: hx, sw: stoolSw}, {x: rx, sw: stoolSw}]} />
      <CrayonCup x={385} y={1078} />
      <Dispenser x={752} y={1070} />
      {!underHis && <Mug x={MUG_HIS_UP.x} y={MUG_HIS_UP.y} />}
      {!underHers && <Mug x={MUG_HERS_UP.x} y={MUG_HERS_UP.y} />}
      {underHis && <Mug x={MUG_LAND_HIS.x} y={MUG_LAND_HIS.y} rot={180} />}
      {underHers && <Mug x={MUG_LAND_HERS.x} y={MUG_LAND_HERS.y} rot={180} />}
      <CoffeeCup x={cupHis.x} y={cupHis.y} rot={cupHis.rot} t={t} flip />
      <CoffeeCup x={cupHer.x} y={cupHer.y} rot={cupHer.rot} t={t} seed={2} />
      {checkOn && t < B.voteWipe && <g transform={`translate(${chkAt.x} ${chkAt.y}) rotate(-5) scale(0.3)`}><CheckSlip /></g>}
      {/* phones lying flat (lit, generic glow) until the mugs cover them */}
      {!underHis && (hook === 'b' && hp.flip > 0.001 && inHook
        ? <g transform={`translate(${hp.x} ${hp.y}) rotate(${hp.rot}) scale(${Math.abs(Math.cos(hp.flip * Math.PI)) * hp.s + 0.001} ${hp.s * lerp(1, 0.46, hp.flat)})`}>
          {hp.flip < 0.5 ? <Phone id="him" x={0} y={0} lit={1} p={0} thumb={0} skin={C.skinHim} /> : <PhoneBack caseColor="#2C2C36" glow={0} />}
        </g>
        : <Phone id="him" x={hp.x} y={hp.y} rot={hp.rot} scale={hp.s} lit={hp.lit} p={hp.p} dir={hp.dir} thumb={hp.thumb} flat={hp.flat} skin={C.skinHim} />)}
      {!underHers && <Phone id="her" x={rp.x} y={rp.y} rot={rp.rot} scale={rp.s} lit={rp.lit} p={rp.p} dir={rp.dir} thumb={rp.thumb} flat={rp.flat} caseColor={C.pink} skin={C.skinHer} />}
      {hold && t < (hook === 'b' ? 0.3 : LOW1 + 0.2) && <Arm who="her" sx={690} sy={1020} hx={herHold.x} hy={herHold.y} />}
      {hold && <Arm who="him" sx={-70} sy={1100} hx={hisHold.x} hy={hisHold.y} />}
      <Arm who="him" sx={-70} sy={1235} hx={hisA.x} hy={hisA.y} />
      <Arm who="her" sx={1150} sy={1235} hx={herA.x} hy={herA.y} />
      {coinUp > 0.3 && <Coin x={hisA.x + 34} y={hisA.y - 60} t={t} r={46} />}
      {coverK > 0.3 && <g transform={`translate(${HER.x + 6} ${HER.y + her.bob - 178}) rotate(${her.tilt})`}>
        <ellipse cx={0} cy={0} rx={104} ry={58} fill={C.skinHer} stroke={C.ink} strokeWidth={8} />
        {[-60, -20, 20, 60].map((xx, i) => <path key={i} d={`M ${xx} -50 L ${xx} -4`} stroke={C.ink} strokeWidth={5} opacity={0.5} strokeLinecap="round" />)}
      </g>}
      {/* polka notes burst from the jukebox */}
      {chaos && <Notes t={t} x={540} y={770} n={7} rate={1.3} spread={90} s={1.25} />}
      {t >= B.slow && t < B.check && t < B.gag && <Notes t={t} x={540} y={770} n={3} rate={0.3} spread={40} />}
      {/* coffee jumps out of his cup onto his jacket */}
      {splashK > 0 && splashK < 1 && [0, 1, 2, 3].map((i) => {
        const k = clamp(splashK * 1.1 - i * 0.04), x = lerp(cupHis.x - 10 + i * 8, hx + 40 + i * 12, k), y = lerp(1060, 990, k) - (300 - i * 36) * Math.sin(k * Math.PI);
        return <ellipse key={i} cx={x} cy={y} rx={22 - i * 3} ry={30 - i * 4} fill="#5A3322" stroke={C.ink} strokeWidth={5} transform={`rotate(${(k - 0.5) * 120} ${x} ${y})`} />;
      })}
      {/* waitress arm slides the check in */}
      {wOn && (() => {
        const S0: Pt = {x: 452, y: 905};
        const mid = {x: (S0.x + wHand.x) / 2, y: (S0.y + wHand.y) / 2};
        const E0 = {x: mid.x + 78, y: mid.y + 46};
        const ux = wHand.x - E0.x, uy = wHand.y - E0.y, ul = Math.hypot(ux, uy) || 1;
        const W0 = {x: wHand.x - (ux / ul) * 56, y: wHand.y - (uy / ul) * 56};
        return <BentArm S={S0} E={E0} W={W0} H={wHand} sleeve={C.mintUni} skin="#E3B38F" w={64} />;
      })()}
      {t >= B.slap && t < B.slap + 0.4 && <g stroke={C.ink} strokeWidth={9} strokeLinecap="round" opacity={1 - wp(t, B.slap, B.slap + 0.4)}><path d="M 380 1110 l -50 -20 M 700 1110 l 50 -20 M 400 1190 l -46 24 M 680 1190 l 46 24" /></g>}
      {hook === 'b' && t >= 0.35 && t < 1.9 && <g opacity={smooth(t, 0.35, 0.5) * (1 - smooth(t, 1.7, 1.9))}>
        <path d={`M 800 760 L ${hp.x + 20} ${hp.y - 70}`} fill="none" stroke={C.ink} strokeWidth={28} strokeLinecap="round" strokeDasharray="1 40" />
        <path d={`M 800 760 L ${hp.x + 20} ${hp.y - 70}`} fill="none" stroke="#fff" strokeWidth={17} strokeLinecap="round" strokeDasharray="1 40" />
      </g>}
      {hook === 'b' && t >= 0.6 && t < 1.9 && <g transform="translate(925 585) scale(1.6) translate(-925 -585)"><Exclaim x={925} y={585} k={wp(t, 0.6, 1.0)} /></g>}
      {hook === 'b' && t >= 1.55 && t < 2.2 && <rect x={-100} y={-100} width={1300} height={2200} fill="#FFF3C8" opacity={0.4 * (1 - wp(t, 1.55, 2.2))} />}
      {t >= B.celesta && t < B.celesta + 0.9 && <g>
        <ellipse cx={540} cy={820} rx={360} ry={280} fill="url(#haloWarm)" opacity={0.55 * Math.sin(wp(t, B.celesta, B.celesta + 0.9) * Math.PI)} />
        <Spark x={540} y={760} k={wp(t, B.celesta, B.celesta + 0.7)} />
      </g>}
      {showBadge && <g transform="translate(540 585) rotate(-4)" opacity={smooth(t, B.rewind + 0.1, B.rewind + 0.3) * (1 - smooth(t, B.take2 - 0.2, B.take2))}>
        <rect x={-250} y={-64} width={500} height={128} rx={20} fill={C.ink} opacity={0.35} transform="translate(8 10)" />
        <rect x={-250} y={-64} width={500} height={128} rx={20} fill={C.pumpkin} stroke={C.ink} strokeWidth={8} />
        <polygon points="-196,0 -150,-30 -150,30" fill={C.ink} /><polygon points="-150,0 -104,-30 -104,30" fill={C.ink} />
        <text x={70} y={32} textAnchor="middle" fontFamily={ANTON} fontSize={96} fill={C.ink} letterSpacing={3}>{spec.cards.rewind_badge}</text>
      </g>}
    </g>
    <g transform={planeT(cam, 1.35)}>
      <Sugar x={-70} y={1360} s={0.8} />
      <Steam x={1040} y={1290} t={t} />
    </g>
    {flick > 0 && <rect x={-100} y={-100} width={1300} height={2200} fill={C.navy} opacity={0.3} />}
  </g>;
};

// ------------------------------------------------------------------------------------------ whole-frame napkins, jukebox, check
type NL = {txt: string; color: string; sleeve: string; skin: string; a: number; b: number};
const HIMW = {color: C.pumpkin, sleeve: C.rust, skin: C.skinHim}, HERW = {color: C.cran, sleeve: C.cran, skin: C.skinHer};
const INS: Record<string, {t0: number; id: string; lines: NL[]; sizes: number[]}> = {
  N0: {t0: B.napkin0, id: 'n0', sizes: [200], lines: [{txt: 'pick a song.', ...HERW, a: 3.4, b: 4.1}]},
  N1: {t0: B.napkin1, id: 'n1', sizes: [190], lines: [{txt: 'ok. good pick.', ...HERW, a: 15.4, b: 16.1}]},
  N2: {t0: B.napkin2, id: 'n2', sizes: [150, 190], lines: [{txt: 'FIRST GOOD CALL', ...HIMW, a: 16.95, b: 17.5}, {txt: 'ALL YEAR.', ...HIMW, a: 17.55, b: 18.0}]},
};
const NapkinInsert: React.FC<{t: number; kind: 'N0' | 'N1' | 'N2'}> = ({t, kind}) => {
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
const CheckInsert: React.FC<{t: number}> = ({t}) => {
  const k = smooth(t, B.checkIns, B.checkIns + 0.22);
  return <g>
    <InsertBG t={t} />
    <g transform={`translate(${lerp(1500, 540, k)} 800) rotate(${lerp(10, -2, k)})`}><CheckSlip /></g>
  </g>;
};
/** whole-frame jukebox: his hand slides the coin into the slot. dumb = strobing lamps + a shake, slow = warm and gentle. */
const JukeShot: React.FC<{t: number; t0: number; coinAt: number; dumb: boolean}> = ({t, t0, coinAt, dumb}) => {
  const JX = 540, JY = 1090, JS = 1.4;
  const SLOT: Pt = {x: JX, y: JY - 30 * JS};
  const arrive = smooth(t, t0 + 0.05, t0 + 0.35), leave = smooth(t, coinAt + 0.2, coinAt + 0.55);
  const hand: Pt = {x: lerp(lerp(-60, 400, arrive), -60, leave), y: lerp(1010, 1030, arrive)};
  const kc = wp(t, t0 + 0.3, coinAt);
  const coinP: Pt = {x: lerp(hand.x + 34, SLOT.x, kc), y: lerp(hand.y - 50, SLOT.y - 6, kc) - 60 * Math.sin(kc * Math.PI)};
  const into = wp(t, coinAt - 0.08, coinAt + 0.08);
  const after = t >= coinAt;
  const shake = dumb && after ? Math.sin(t * 70) * 5 * Math.exp(-(t - coinAt) * 1.2) : 0;
  const on = after ? 1 : 0.55;
  return <g>
    <InsertBG t={t} />
    <g transform={`translate(${shake} 0)`}><Jukebox x={JX} y={JY} s={JS} t={t} on={on} rate={dumb ? 22 : 5} spin={dumb ? 600 : 120} /></g>
    {t < coinAt + 0.6 && <Arm who="him" sx={-120} sy={1330} hx={hand.x} hy={hand.y} />}
    {into < 1 && <g transform={`translate(${coinP.x} ${coinP.y}) scale(1 ${1 - into})`}><Coin x={0} y={0} t={t} r={40} /></g>}
    {after && t < coinAt + 0.5 && <Spark x={SLOT.x} y={SLOT.y - 20} k={wp(t, coinAt, coinAt + 0.5)} />}
    {after && <Notes t={t} x={JX} y={JY - 420 * JS * 0.55} n={dumb ? 6 : 3} rate={dumb ? 1.4 : 0.35} spread={dumb ? 130 : 70} s={1.5} />}
  </g>;
};

// ------------------------------------------------------------------------------------------ the phone gag: phones buzz face up, a mug goes over, the glow dies
const MugDrop: React.FC<{x: number; land: number; fall: number; t: number; arm: 'him' | 'her'}> = ({x, land, fall: fallT, t, arm}) => {
  const S = 1.95, RESTY = 1037, sg = arm === 'him' ? 1 : -1;
  const k = wp(t, land - fallT, land);
  const fall = t < land ? RESTY - 330 * (1 - k * k) : RESTY;
  const sq = t >= land ? 1 - 0.1 * Math.sin(wp(t, land, land + 0.2) * Math.PI) * (1 - wp(t, land, land + 0.2)) * 2 : 1;
  const hide = t < land - fallT;
  const up = smooth(t, land + 0.25, land + 0.7);
  const S0: Pt = {x: arm === 'him' ? -140 : 1220, y: 1520};
  const Hh0: Pt = {x: x - sg * 30, y: fall - 165};
  const H: Pt = {x: lerp(Hh0.x, S0.x, up * 0.8), y: lerp(Hh0.y, S0.y, up * 0.8)};
  const Wr: Pt = {x: H.x - sg * 70, y: H.y - 82};
  const mid = {x: (S0.x + Wr.x) / 2, y: (S0.y + Wr.y) / 2};
  const E: Pt = {x: mid.x + sg * 0.8 * 120, y: mid.y + 0.6 * 120};
  const hit = wp(t, land, land + 0.4);
  return <g>
    {t >= land && t < land + 0.4 && <g stroke={C.ink} strokeWidth={9} strokeLinecap="round" opacity={1 - hit}><path d={`M ${x - 230} 1130 l -50 10 M ${x + 230} 1130 l 50 10 M ${x - 190} 1190 l -44 30 M ${x + 190} 1190 l 44 30`} /></g>}
    {!hide && <BentArm S={S0} E={E} W={Wr} H={H} sleeve={arm === 'him' ? C.rust : C.cran} skin={arm === 'him' ? C.skinHim : C.skinHer} w={96} />}
    {!hide && <g transform={`translate(${x} ${fall + 93 * (1 - sq)}) scale(${S} ${S * sq}) rotate(180)`}><Mug x={0} y={0} /></g>}
    {!hide && <g><circle cx={H.x} cy={H.y} r={50} fill={arm === 'him' ? C.skinHim : C.skinHer} stroke={C.ink} strokeWidth={7} />
      <path d={`M ${H.x - sg * 6} ${H.y + 6} q ${-sg * 4} 12 ${-sg * 18} 14 M ${H.x - sg * 22} ${H.y - 6} q ${-sg * 4} 12 ${-sg * 18} 14`} fill="none" stroke={C.ink} strokeWidth={4} opacity={0.5} strokeLinecap="round" /></g>}
  </g>;
};
const PhoneGag: React.FC<{t: number}> = ({t}) => {
  const HX = 290, RX = 790, PY = 1037;
  const buzzAt = (starts: number[], until: number) => { let a = 0; for (const s of starts) if (t >= s && t < s + 0.17 && t < until) a = 1; return a; };
  const bh = buzzAt([20.2, 20.42, 20.64, 20.86], B.landHers), bm = buzzAt([20.3, 20.52, 20.74, 20.96, 21.18, 21.4, 21.62], B.landHis);
  const Ph: React.FC<{cx: number; b: number; land: number; id: string; caseColor: string; skin: string}> = ({cx, b, land, id, caseColor, skin}) => {
    const lit = (1 - smooth(t, land, land + 0.3)) * (0.78 + 0.22 * b);
    const dx = Math.sin(t * 150) * 9 * b;
    return <g>
      {b > 0 && <g stroke={C.ink} strokeWidth={9} strokeLinecap="round" fill="none"><path d={`M ${cx - 140} ${PY - 70} q -26 70 0 140 M ${cx - 178} ${PY - 100} q -36 100 0 200 M ${cx + 140} ${PY - 70} q 26 70 0 140 M ${cx + 178} ${PY - 100} q 36 100 0 200`} /></g>}
      <Phone id={id} x={cx + dx} y={PY} scale={1.0} lit={lit} p={0} thumb={0} caseColor={caseColor} skin={skin} />
    </g>;
  };
  return <g>
    <CloseBG t={t} />
    <rect x={-100} y={-100} width={1300} height={2200} fill={C.navy} opacity={0.42} />
    <Ph cx={HX} b={bm} land={B.landHis} id="pgh" caseColor="#2C2C36" skin={C.skinHim} />
    <Ph cx={RX} b={bh} land={B.landHers} id="pgr" caseColor={C.pink} skin={C.skinHer} />
    <MugDrop x={RX} land={B.landHers} fall={0.85} t={t} arm="her" />
    <MugDrop x={HX} land={B.landHis} fall={0.85} t={t} arm="him" />
  </g>;
};

// ------------------------------------------------------------------------------------------ the cliff: both reach for the check + vote
const VoteScene: React.FC<{t: number}> = ({t}) => {
  const z = 1 + 0.02 * clamp((t - VOTE_AT) / 6);
  const tug = Math.sin(t * 5) * 6;
  const hisP: Pose = {look: [0.5, 0.6], brow: 0.7, worry: 0, mouth: 'grit', happy: false, sweat: 0.4, gulp: 0, tilt: 4 + Math.sin(t * 5) * 1.5, bob: Math.sin(t * 2.2) * 3, sq: 1, blink: blinkAt(t, 0.4), flush: 0.6};
  const herP: Pose = {look: [-0.5, 0.6], brow: 0.7, worry: 0, mouth: 'grit', happy: false, sweat: 0, gulp: 0, tilt: -4 - Math.sin(t * 5) * 1.5, bob: Math.sin(t * 2.2 + 1) * 3, sq: 1, blink: blinkAt(t, 1.9), flush: 0};
  const CH = (id: string) => (spec.choices as unknown as Record<string, {l1: string; l2: string}>)[id];
  return <g transform={`translate(540 960) scale(${z}) translate(-540 -960)`}>
    <Far t={t} />
    <rect x={-100} y={-100} width={1300} height={2200} fill={C.ink} opacity={0.4} />
    <ClockSign x={540} y={525} text={spec.cards.clock2} />
    <Person who="him" x={250} y={800} s={0.62} pose={hisP} />
    <Person who="her" x={830} y={800} s={0.62} pose={herP} />
    <rect x={-100} y={905} width={1300} height={130} fill="url(#counterTop)" stroke={C.ink} strokeWidth={8} />
    <Counter />
    <g transform={`translate(540 ${705 + Math.sin(t * 2) * 3}) rotate(${-4 + tug * 0.3}) scale(0.37)`}><CheckSlip /></g>
    <Arm who="him" sx={-140} sy={800} hx={392 + tug} hy={790} w={74} />
    <Arm who="her" sx={1220} sy={800} hx={688 - tug} hy={790} w={74} />
    {[['A', 895, -1.2, 'va', B.cardA], ['B', 1048, 1.2, 'vb', B.cardB]].map(([L, y, rot, id, at], i) => {
      const ph = Math.max(0, t - VOTE_AT - 0.3) / 1.4 % 2;
      const hl = t < VOTE_AT + 0.3 ? 0 : i === 0 ? (ph < 1 ? Math.sin(ph * Math.PI) : 0) : (ph >= 1 ? Math.sin((ph - 1) * Math.PI) : 0);
      const yy = y as number; const SC = 0.72;
      return <g key={id as string} transform={`translate(540 ${yy}) scale(${SC * (1 + 0.045 * hl)}) translate(-540 ${-yy})`}>
        <rect x={50} y={yy - 132} width={980} height={264} rx={18} fill={C.pumpkin} opacity={0.5 * hl} filter="url(#blurSh)" />
        <VoteCard letter={L as string} l1={CH(L as string).l1} l2={CH(L as string).l2} y={yy} age={t - (at as number)} rot={rot as number} id={id as string} />
      </g>;
    })}
  </g>;
};

const renderShot = (t: number, hook: Hook, id: ShotId = shotAt(t)): React.ReactNode => {
  if (id === 'N0' || id === 'N1' || id === 'N2') return <NapkinInsert t={t} kind={id} />;
  if (id === 'J1') return <JukeShot t={t} t0={B.take1} coinAt={B.coinIn1} dumb />;
  if (id === 'J2') return <JukeShot t={t} t0={B.take2} coinAt={B.coinIn2} dumb={false} />;
  if (id === 'PG') return <PhoneGag t={t} />;
  if (id === 'CK') return <CheckInsert t={t} />;
  if (id === 'vote') return <VoteScene t={t} />;
  if (id === 'end') {
    const e = t - B.endcard;
    return <g transform={`translate(540 960) scale(${1 + 0.035 * clamp(e / 3)}) translate(-540 -960)`}><EndCard a={e} t={t} pill={spec.cards.end_pill} kicker={spec.cards.end_kicker} /></g>;
  }
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
            <g clipPath="url(#sliceNew)">{wipe1 ? <Diner t={t} hook={hook} /> : <VoteScene t={t} />}</g>
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

export const Pie4: React.FC<{hook?: Hook}> = ({hook = 'a'}) => (
  <AbsoluteFill style={{background: C.teal}}>
    <Audio src={staticFile('audio/pie-ep4.wav')} volume={0.9} />
    <Sequence from={Math.round(spec.audio.hookSlide[hook] * PIE4_FPS)}><Audio src={staticFile('audio/pie-ep4-slide.wav')} volume={0.8} /></Sequence>
    <Scene hook={hook} />
  </AbsoluteFill>
);
