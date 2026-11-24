import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, lerp, smooth} from '../../lib/motion';
import {MotionBlurWhen} from '../../lib/shots';
import {
  Arm, Beanie, C, COUR, Chalk, Cam, Counter, CrayonCup, CrayonLine, CrayonSprite, Defs, Dispenser, EndCard, Far, Fork, HAND, MARKER, ANTON, Mouth, Mug, NapkinPaper, Person, Phone, PieCase,
  Plate, Pose, Slice, Steam, Strip, Sugar, VoteCard, WIPE_DUR, WipeClip, WipeRim, ClockSign, planeT, textW,
} from './world';
import spec from '../../../specs/stories/pie-ep2.json';

// Pie for Two, part 2 "I called it". Silent. Opener = ONE strip, two big faces, both phones lit mid-swipe, the plate with the last
// slice + her napkin "first bite?" as the bright devices, forks moving in. Then take 1 (he plays noble, his stomach growls, the waitress
// brings a fork), a counter-clockwise slice wipe (rewind), take 2 (phones under mugs, fork duel, "fine. go.", the bite, half back).
// Cliff: "why are you here at midnight?" Slice wipe to the vote board, end card.

export const PIE2_FPS = 60;
export const PIE2_FRAMES = Math.round(spec.duration * PIE2_FPS);
export type Hook = 'a' | 'b';
const B = spec.beats;
const REWIND_AT = B.rewind;
const VOTE_WIPE = B.sliceWipe;
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

// ------------------------------------------------------------------------------------------ shots
type ShotId = 'D' | 'M' | 'N1' | 'N2' | 'N3' | 'N4' | 'N5' | 'R' | 'vote' | 'end';
const SHOTS: [number, ShotId][] = [[0, 'D'], [B.napkin1, 'N1'], [B.growlWatch, 'D'], [B.rewind, 'R'], [B.napkin2, 'N2'], [B.duel, 'D'], [B.napkin3, 'N3'], [B.bite, 'D'], [19.1, 'M'], [B.napkin4, 'N4'],
  [B.laugh, 'D'], [B.napkin5, 'N5'], [VOTE_AT, 'vote'], [B.endcard, 'end']];
const shotAt = (t: number): ShotId => keyAt(SHOTS, t);

type Seg = [number, number, [number, number, number], [number, number, number]];
const CAM_SEGS: Seg[] = [
  [0, 3.0, [540, 960, 1.0], [540, 970, 1.035]], [3.0, 4.5, [540, 985, 1.04], [540, 985, 1.0]], [B.growlWatch, 9.1, [540, 990, 1.0], [540, 985, 1.09]],
  [9.1, 11.0, [540, 960, 1.1], [540, 950, 1.17]], [B.duel, 16.9, [540, 1010, 1.06], [540, 1010, 1.2]], [B.bite, B.napkin4, [540, 1000, 1.05], [540, 1000, 1.12]],
  [B.laugh, B.napkin5, [540, 990, 1.0], [540, 990, 1.1]],
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
const MID = [B.growl];

const HL: KF[] = [[2.6, 0.9, 0.2], [3.0, 0.9, 0.2], [3.3, 0.6, -0.2], [4.2, 0.6, -0.2], [4.5, 0.3, 0.9], [6.5, 0.9, 0.1], [6.9, 0.9, 0.1], [7.0, 0, 0.95], [8.2, 0, 0.95], [8.45, 0.7, -0.3], [9.2, 0.7, -0.3],
  [9.5, 0.2, 0.95], [10.0, 0.2, 0.95], [10.3, 0.8, -0.2], [11, 0.8, -0.2], [13.5, 0.8, 0.2], [15.0, 0.6, 0.7], [16.9, 0.6, 0.7], [18.0, 0.9, 0.1], [18.25, 0.4, 0.85], [18.6, 0.3, 0.3], [18.9, 0.3, 0.9], [19.3, 0.9, 0.3],
  [19.5, 0.5, 0.8], [19.9, 0.9, 0.1], [21.4, 0.9, 0.1], [21.7, 0.4, 0.9], [22.3, 0.4, 0.9], [22.5, 1.0, 0.0], [23.3, 1.0, 0.0], [23.5, 0.1, 0.95], [23.9, 0.1, 0.95]];
const RL: KF[] = [[2.6, -0.9, 0.2], [3.0, -0.9, 0.2], [3.3, -0.6, -0.2], [4.2, -0.6, -0.2], [4.5, -0.3, 0.9], [6.5, -0.9, 0.1], [6.95, -0.9, 0.1], [7.1, -0.8, 0.7], [7.9, -0.8, 0.7], [8.1, -0.9, 0.1],
  [8.45, -0.6, -0.3], [9.4, -0.6, -0.3], [9.8, -0.9, 0.1], [11, -0.9, 0.1], [13.5, -0.9, 0.1], [15.0, -0.6, 0.7], [16.9, -0.6, 0.7], [18.3, -0.9, 0.2], [19.4, -0.9, 0.5], [19.9, -0.9, 0.1], [21.4, -0.9, 0.1],
  [21.85, -0.4, 0.9], [22.3, -0.4, 0.9], [22.5, -1.0, 0.0], [23.3, -1.0, 0.0], [23.5, -0.9, 0.7], [23.9, -0.9, 0.7]];
const HM: [number, Mouth][] = [[2.6, 'grit'], [3.0, 'o'], [4.5, 'flat'], [6.5, 'smile'], [7.0, 'o'], [7.5, 'grit'], [8.4, 'soft'], [9.2, 'flat'], [11, 'flat'], [13.5, 'grit'], [15.0, 'grit'], [16.4, 'smile'], [16.9, 'soft'],
  [18.0, 'flat'], [18.45, 'o'], [18.78, 'smile'], [19.15, 'gulp'], [19.4, 'soft'], [21.4, 'smile'], [22.5, 'smile'], [23.4, 'soft']];
const RM: [number, Mouth][] = [[2.6, 'smirk'], [3.0, 'o'], [4.5, 'flat'], [6.5, 'flat'], [7.0, 'o'], [7.6, 'smirk'], [11, 'smirk'], [15.0, 'smirk'], [16.4, 'smile'], [18.3, 'smirk'], [19.4, 'o'], [19.9, 'smile'],
  [21.4, 'laugh'], [21.85, 'smile'], [23.4, 'smile']];

const himPose = (t: number, hook: Hook): Pose => {
  let look: number[]; let mouth: Mouth; let brow = 0.1; let sweat = 0; let flush = 0.3; let bob = 0; let tilt = Math.sin(t * 0.9) * 1.1; let sq = 1 + 0.014 * Math.sin(t * 2.3); let happy = false; let gulp = 0;
  if (t < 2.6) {
    const keys: KF[] = hook === 'a' ? [[0, 0.05, 0.8], [0.5, 0.05, 0.8], [0.8, 0.4, 0.85], [1.1, 0.4, 0.85], [1.3, 0.9, 0.2]]
      : [[0, 0.05, 0.8], [0.55, 0.05, 0.8], [0.65, 0.9, 0.05], [1.3, 0.9, 0.05], [1.5, 0.4, 0.85], [1.75, 0.4, 0.85], [1.9, 0.9, 0.2]];
    look = kf(keys, t);
    mouth = hook === 'a' ? (t < 0.8 ? 'flat' : 'grit') : (t < 0.65 ? 'soft' : t < 1.8 ? 'o' : 'grit');
    if (hook === 'b') {
      const fl = pulse(t, 0.6, 0.95);
      sq += 0.07 * Math.sin(wp(t, 0.6, 0.85) * Math.PI);
      bob -= 20 * fl;
      sweat = smooth(t, 0.7, 1.0) * (1 - smooth(t, 2.4, 2.9)) * 0.95;
      flush = 0.3 + smooth(t, 0.6, 1.1) * 0.5;
      brow = 0.1 + 0.9 * pulse(t, 0.6, 1.3);
    } else flush = 0.3 + smooth(t, 0.8, 1.4) * 0.35;
  } else {
    look = kf(HL, t); mouth = keyAt(HM, t);
    flush = 0.5;
    if (t >= B.growl && t < 9.3) { flush = 0.85; sweat = smooth(t, 7.0, 7.4) * 0.8 * (1 - smooth(t, 8.8, 9.3)); }
    if (t >= 9.3 && t < 11) { flush = 0.7; sweat = 0.5; }
    if (t >= B.bite && t < B.push) { happy = t > 18.8 && t < 19.12; brow = 0.5; }
    if (t >= B.push && t < B.napkin4) { flush = 0.75; sweat = 0.4; }
    if (t >= B.laugh) flush = 0.35;
    if (t >= B.growl && t < 8.4) { sq += 0.05 * Math.sin(t * 40) * (1 - wp(t, 7.0, 8.4)); bob = Math.sin(t * 40) * 4; }
    if (t >= 21.4 && t < 21.75) { bob = -Math.abs(Math.sin(t * 22)) * 8; tilt = Math.sin(t * 22) * 3; happy = true; }
    if (t >= 19.1 && t < 19.3) gulp = Math.sin(wp(t, 19.1, 19.3) * Math.PI);
  }
  return {look: [look[0], look[1]], brow, worry: sweat * 0.8, mouth, happy, sweat, gulp, tilt, bob, sq, blink: happy ? 0 : blinkAt(t, 0.4), flush};
};
const herPose = (t: number, hook: Hook): Pose => {
  let look: number[]; let mouth: Mouth; let brow = 0.1; let happy = false; let bob = 0; let tilt = Math.sin(t * 0.8 + 2) * 1.2;
  if (t < 2.6) {
    const keys: KF[] = hook === 'a' ? [[0, -0.1, 0.75], [0.6, -0.1, 0.75], [0.8, -0.4, 0.85], [1.1, -0.4, 0.85], [1.3, -0.9, 0.2]]
      : [[0, -0.1, 0.75], [0.25, -0.1, 0.75], [0.4, -1.0, 0.85], [1.5, -1.0, 0.85], [1.7, -0.4, 0.85], [1.9, -0.9, 0.2]];
    look = kf(keys, t);
    mouth = hook === 'a' ? (t < 0.8 ? 'flat' : 'smirk') : (t < 0.4 ? 'flat' : t < 1.1 ? 'o' : 'smirk');
    brow = 0.1 + (hook === 'b' ? 0.8 * pulse(t, 0.4, 1.3) : 0.2);
  } else {
    look = kf(RL, t); mouth = keyAt(RM, t);
    if (t > 7.0 && t < 7.8) brow = 0.9;
    if (t >= 19.4 && t < 19.9) brow = 0.9;
    if (t >= 21.4 && t < 21.85) { bob = -Math.abs(Math.sin(t * 21 + 1)) * 8; tilt = Math.sin(t * 21 + 1) * 3; happy = true; }
  }
  return {look: [look[0], look[1]], brow, worry: 0, mouth, happy, sweat: 0, gulp: 0, tilt, bob, sq: 1 + 0.014 * Math.sin(t * 2 + 1.3), blink: happy ? 0 : blinkAt(t, 1.9), flush: 0};
};

// ------------------------------------------------------------------------------------------ phones
const HIM_TICKS = [-0.1, ...spec.audio.swipeTicks];
const HER_TICKS = [-0.18, 0.33, 0.62, 0.93, 1.22];
const LOW0 = 2.4, LOW1 = 2.9;
const HIM_FLAT = {x: 170, y: 1152, s: 0.9}, HER_FLAT = {x: 910, y: 1152, s: 0.9};
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
  let pos = {x: 262, y: 972, rot: -3, s: 0.9, lit: 1};
  if (hook === 'b' && t > 0.6) { const k = smooth(t, 0.6, 0.95); pos = {x: lerp(262, 292, k), y: lerp(972, 1040, k), rot: lerp(-3, 34, k), s: lerp(0.9, 0.78, k), lit: lerp(1, 0.6, k)}; }
  const k2 = smooth(t, LOW0, LOW1);
  return {x: lerp(pos.x, HIM_FLAT.x, k2), y: lerp(pos.y, HIM_FLAT.y, k2), rot: lerp(pos.rot, 0, k2), s: lerp(pos.s, HIM_FLAT.s, k2), flat: k2, lit: t < LOW0 ? pos.lit : lerp(pos.lit, 0.5, k2), p: sw.p, dir: sw.dir, thumb: sw.on ? 1 : 0};
};
const herPhone = (t: number, hook: Hook = 'a') => {
  const sw = phoneSwipe(HER_TICKS, t, hook === 'b' ? 0.3 : 1.45);
  const k2 = hook === 'b' ? smooth(t, 0.25, 0.6) : smooth(t, LOW0, LOW1);
  const tx = hook === 'b' ? 770 : HER_FLAT.x, ty = hook === 'b' ? 1176 : HER_FLAT.y;
  return {x: lerp(512, tx, k2), y: lerp(950, ty, k2), rot: lerp(6, 0, k2), s: lerp(0.74, HER_FLAT.s, k2), flat: k2, lit: lerp(1, 0.5, k2), p: sw.p, dir: sw.dir, thumb: sw.on ? 1 : 0};
};

// ------------------------------------------------------------------------------------------ forks and hands
const FL = 171; // fork length from grip to junction at scale 0.9
const REST: Pt = {x: 190, y: 1198};
const forkOrigin = (h: Pt, th: number): Pt => ({x: h.x + FL * Math.sin((th * Math.PI) / 180), y: h.y - FL * Math.cos((th * Math.PI) / 180)});
const mir = (p: Pt): Pt => ({x: 1080 - p.x, y: p.y});
type FS = {h: Pt; th: number; vis: boolean};
const lerpFS = (a: FS, b: FS, k: number): FS => ({h: {x: lerp(a.h.x, b.h.x, k), y: lerp(a.h.y, b.h.y, k)}, th: lerp(a.th, b.th, k), vis: k < 0.5 ? a.vis : b.vis});

const plateX = (t: number): number => {
  if (t < B.push) return 540;
  return lerp(540, 655, smooth(t, B.push + 0.1, B.push + 0.55));
};
const PLATE_Y = 1150;

/** fork state for him in his own frame; her fork is the mirror (plus overrides). */
const forkMine = (t: number, hook: Hook, who: 'him' | 'her'): FS => {
  const rest: FS = {h: REST, th: 98, vis: true};
  const hover: FS = {h: {x: 280, y: 1166 + 4 * Math.sin(t * 6 + (who === 'her' ? 1 : 0))}, th: 100, vis: true};
  const up: FS = {h: {x: 305, y: 1072}, th: 0, vis: true};
  if (t < 3.0) {
    const cross0: FS = {h: {x: 330, y: 1192}, th: 76, vis: true};
    const cl = smooth(t, 0.85, 1.08) * (1 - smooth(t, 1.2, 1.5)) + smooth(t, 1.65, 1.88) * (1 - smooth(t, 1.95, 2.3));
    if (hook === 'a') return lerpFS(lerpFS(rest, hover, smooth(t, 0.05, 0.8)), cross0, clamp(cl));
    const lift: FS = {h: {x: 250, y: 1120}, th: 62, vis: true};
    return lerpFS(lerpFS(rest, lift, smooth(t, 0.9, 1.4)), hover, smooth(t, 1.5, 1.8));
  }
  if (t < 4.5) return {...lerpFS(hover, up, smooth(t, 3.35, 3.65) * (1 - smooth(t, 4.2, 4.5))), vis: who === 'her'};
  if (t < 11.0) return {...rest, vis: who === 'her'};
  if (t < B.duel) return rest;
  if (t < B.napkin3) {
    const r = smooth(t, B.duel, B.duel + 0.2);
    const p = ((t - B.duel) % 0.45) / 0.45;
    const a = p < 0.8 ? Math.sin((Math.PI * p) / 0.8) : 0;
    const cross: FS = {h: {x: 372 - 74 * a, y: 1168 - 56 * a}, th: 50 - 26 * a, vis: true};
    if (who === 'her' && t > 16.45) return lerpFS(cross, rest, smooth(t, 16.45, 16.85));
    return lerpFS(rest, cross, r);
  }
  if (t < B.bite) return rest;
  if (who === 'her') return rest;
  // him: the bite (fork with a piece goes to his mouth)
  const plateH: FS = {h: {x: 345, y: 1164}, th: 98, vis: true};
  const mouth: FS = {h: {x: 272, y: 1040}, th: 0, vis: true};
  const after: FS = {h: {x: 330, y: 1150}, th: 98, vis: true};
  if (t < B.biteTake) return lerpFS(rest, plateH, smooth(t, B.bite, B.biteTake));
  if (t < 18.62) return lerpFS(plateH, mouth, smooth(t, B.biteTake + 0.02, 18.6));
  if (t < 18.78) return mouth;
  if (t < B.push) return lerpFS(mouth, after, smooth(t, 18.78, 18.98));
  if (t < B.laugh + 0.2) return {...rest, vis: false};
  return rest;
};

// eating after the plate comes back (21.7+)
const eatMove = (t: number, t0: number) => smooth(t, t0 - 0.22, t0) * (1 - smooth(t, t0 + 0.1, t0 + 0.34));
const HIM_BITES = [21.7, 22.12], HER_BITES = [21.85, 22.28];

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

const Waitress: React.FC<{t: number; look: [number, number]}> = ({t, look}) => {
  const up = Math.max(smooth(t, 3.0, 3.3) * (1 - smooth(t, 4.2, 4.5)), t >= B.waitressUp ? smooth(t, B.waitressUp, B.waitressUp + 0.4) : 0);
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

const Exclaim: React.FC<{x: number; y: number; k: number}> = ({x, y, k}) => {
  const sp = k <= 0 ? 0 : 1 + Math.sin(clamp(k) * Math.PI * 1.5) * Math.exp(-clamp(k) * 4.2) * 0.45;
  const pts = Array.from({length: 16}, (_, i) => { const a = (i / 16) * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 46 : 78; return `${Math.cos(a) * r},${Math.sin(a) * r}`; }).join(' ');
  return <g transform={`translate(${x} ${y}) scale(${sp}) rotate(8)`}>
    <polygon points={pts} fill={C.ink} transform="translate(5 7)" opacity={0.35} /><polygon points={pts} fill={C.pumpkin} stroke={C.ink} strokeWidth={7} strokeLinejoin="round" />
    <text x={0} y={34} textAnchor="middle" fontFamily={`"Anton", sans-serif`} fontSize={92} fill={C.ink}>!</text>
  </g>;
};

const BuzzMarks: React.FC<{x: number; y: number; k: number}> = ({x, y, k}) => k <= 0 || k >= 1 ? null : <g transform={`translate(${x} ${y})`} opacity={1 - k} stroke={C.ink} strokeWidth={7} strokeLinecap="round" fill="none">
  {[-1, 1].map((sd) => <g key={sd}><path d={`M ${sd * 110} -70 Q ${sd * 140} -40 ${sd * 110} -10`} /><path d={`M ${sd * 140} -90 Q ${sd * 190} -40 ${sd * 140} 10`} /></g>)}
</g>;

const Spark: React.FC<{x: number; y: number; k: number}> = ({x, y, k}) => {
  if (k <= 0 || k >= 1) return null;
  const s = 0.5 + k * 0.9;
  const pts = Array.from({length: 16}, (_, i) => { const a = (i / 16) * Math.PI * 2, r = i % 2 ? 16 : 46; return `${Math.cos(a) * r},${Math.sin(a) * r}`; }).join(' ');
  return <g transform={`translate(${x} ${y}) scale(${s}) rotate(${k * 40})`} opacity={1 - k * k}>
    <polygon points={pts} fill="#fff" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <polygon points={pts} fill="#FFF3B0" transform="scale(0.55)" />
  </g>;
};

// the placed fork the waitress brings: origin at (404,1198), tines toward the plate
const PLACED: Pt = {x: 404, y: 1200};

// pie pieces inside the plate (local coords)
const Pieces: React.FC<{t: number}> = ({t}) => {
  if (t < B.biteTake) return <Slice x={-112} y={6} dollop={1} id="p0" />;
  if (t < B.push) return <g clipPath="url(#biteHole)"><Slice x={-112} y={6} dollop={1} id="p1" /></g>;
  const eatS = smooth(t, 21.8, 21.95) * 0.5 + smooth(t, 22.15, 22.3) * 0.5;
  const eatB = smooth(t, 21.95, 22.1) * 0.5 + smooth(t, 22.35, 22.5) * 0.5;
  const sS = 0.42 * (1 - eatS), sB = 0.8 * (1 - eatB);
  return <g>
    {sS > 0.02 && <Slice x={-140} y={6} s={sS} dollop={sS > 0.25 ? 0.6 : 0} id="p2" />}
    {sB > 0.02 && <g clipPath="url(#biteHole2)"><Slice x={-38} y={6} s={sB} dollop={sB > 0.3 ? 1 : 0} id="p3" /></g>}
    {t >= 22.65 && <g><Fork x={-60} y={-10} rot={90} s={0.8} /><Fork x={-60} y={16} rot={90} s={0.8} /></g>}
    {t > 22.45 && <g>{[[-70, 4, 7], [-30, 12, 6], [10, 0, 8], [-100, 14, 5], [40, 10, 6], [64, 2, 5]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill={C.crust} stroke={C.ink} strokeWidth={3} />)}</g>}
  </g>;
};

// ------------------------------------------------------------------------------------------ the counter scene
const MUG_HIS = {x: 622, y: 1022}, MUG_HERS = {x: 775, y: 1022};
const MUG_LAND_HIS: Pt = {x: HIM_FLAT.x, y: 1128}, MUG_LAND_HERS: Pt = {x: HER_FLAT.x, y: 1128};

const Diner: React.FC<{t: number; hook: Hook}> = ({t, hook}) => {
  const cam = camOf(t);
  const him = himPose(t, hook), her = herPose(t, hook);
  const hp = himPhone(t, hook), rp = herPhone(t, hook);
  const px = plateX(t);
  const take2 = t >= B.rewind;
  const phonesOut = t < LOW1 + 0.3 || (!take2 && t >= LOW1);
  const growl = t >= B.growl && t < 8.45;
  const sh = growl ? Math.sin(t * 70) * 5 * (1 - wp(t, 7.0, 8.45)) : 0;
  const shY = growl ? Math.cos(t * 83) * 3 * (1 - wp(t, 7.0, 8.45)) : 0;

  // forks
  const fh = forkMine(t, hook, 'him'), fr0 = forkMine(t, hook, 'her');
  let hHand = fh.h; let rHand = mir(fr0.h);
  let hTh = fh.th; let rTh = -fr0.th;
  // eating cycle
  if (t >= B.laugh + 0.2) {
    for (const b of HIM_BITES) { const e = eatMove(t, b); hHand = {x: lerp(px - 130, 288, e), y: lerp(1166, 990, e)}; hTh = lerp(100, 0, e); }
  }
  const eatH = Math.max(...HIM_BITES.map((b) => eatMove(t, b)));
  const eatR = Math.max(...HER_BITES.map((b) => eatMove(t, b)));
  const hisEat: FS = {h: {x: lerp(px - 130, 288, eatH), y: lerp(1166, 990, eatH)}, th: lerp(100, 0, eatH), vis: t < 22.65};
  const herEat: FS = {h: {x: lerp(px + 130, 792, eatR), y: lerp(1166, 990, eatR)}, th: lerp(-100, 0, eatR), vis: t < 22.65};
  const eating = t >= B.laugh + 0.2;
  let hisF: FS = eating ? hisEat : {h: hHand, th: hTh, vis: fh.vis};
  let herF: FS = eating ? herEat : {h: rHand, th: rTh, vis: fr0.vis};
  // push: his hand pushes the plate
  const pushing = t >= B.push - 0.1 && t < B.napkin4 + 0.01;
  let hisHandOnly: Pt | null = null;
  if (pushing) { const k = smooth(t, B.push - 0.1, B.push + 0.1); hisHandOnly = {x: lerp(hisF.h.x, px - 212, k), y: lerp(hisF.h.y, 1160, k)}; hisF = {...hisF, vis: false}; }
  // phone-holding hands
  const hold = t < LOW1 + 0.3;
  const hisHold: Pt = {x: hp.x - 34 * (1 - hp.flat), y: hp.y + 104 * hp.s * (1 - hp.flat * 0.5)};
  const herHold: Pt = {x: rp.x + 28, y: rp.y + 96 * rp.s * (1 - rp.flat * 0.4)};
  const hisBase: Pt = hisHandOnly ?? hisF.h;
  const hisA: Pt = t >= 22.65 ? {x: lerp(hisBase.x, REST.x, smooth(t, 22.65, 22.95)), y: lerp(hisBase.y, REST.y, smooth(t, 22.65, 22.95))} : hisBase;
  const CUP: Pt = {x: 440, y: 1110}, WRITE: Pt = {x: 640, y: 1050};
  const ck1 = smooth(t, 22.95, 23.4), ck2 = smooth(t, 23.5, 23.85);
  let herA: Pt = herF.h;
  if (t >= 22.65) {
    const b0 = {x: lerp(herF.h.x, 1080 - REST.x, smooth(t, 22.65, 22.95)), y: lerp(herF.h.y, REST.y, smooth(t, 22.65, 22.95))};
    const c1 = {x: lerp(b0.x, CUP.x, ck1), y: lerp(b0.y, CUP.y, ck1)};
    herA = {x: lerp(c1.x, WRITE.x, ck2), y: lerp(c1.y, WRITE.y, ck2)};
  }
  const crayonUp = t >= 23.4 && t < B.napkin5;

  // waitress arm + fork drop
  const wOn = t >= B.waitressUp + 0.3 && t < B.rewind;
  const wk = smooth(t, 8.55, B.forkDown);
  const wBack = smooth(t, B.forkDown + 0.1, B.forkDown + 0.5);
  const wHand: Pt = {x: lerp(470, 232, wk) + wBack * 80, y: lerp(930, 1172, wk) - wBack * 140};
  const wForkPlaced = t >= B.forkDown;

  // mugs
  const bz = (t0: number, a: number) => (t >= t0 && t < t0 + 0.2 ? Math.sin(t * 120) * a * (1 - wp(t, t0, t0 + 0.2)) : 0);
  const hisMugBuzz = bz(B.buzz, 7) + bz(B.buzz + 0.3, 7);
  const rattle = (k: number) => growl ? Math.sin(t * 64 + k) * 7 * (1 - wp(t, 7.0, 8.45)) : 0;
  const leak = (x: number, a: number) => <g opacity={a}><ellipse cx={x} cy={1170} rx={200} ry={90} fill="url(#haloCool)" /><ellipse cx={x} cy={1192} rx={112} ry={14} fill="#FFFFFF" /><ellipse cx={x} cy={1212} rx={165} ry={34} fill="#E4FAFF" filter="url(#blurSh)" /><ellipse cx={x} cy={1206} rx={120} ry={14} fill="#FFFFFF" /></g>;

  // napkin held in the opener
  const nk = smooth(t, 2.3, LOW1);
  const nap = {x: lerp(880, 915, nk), y: lerp(985, 1170, nk), rot: lerp(5, -8, nk), s: lerp(0.88, 0.4, nk)};
  const showNap = t < LOW1 + 0.2;
  const burst = hook === 'b' && t >= 0.6 && t < 1.75;
  const pull = growl ? 0.4 + 0.4 * Math.abs(Math.sin(t * 20)) : 0;
  const clash = [15.36, 15.81, 16.26].map((c) => wp(t, c, c + 0.28));
  const raised = t >= 3.3 && t < 4.6;

  const pieceOn = t >= B.biteTake + 0.05 && t < 18.78;
  const ho = forkOrigin(hisF.h, hisF.th);
  const chew = t >= 18.8 && t < 19.35;
  const pf = Math.sin(t * 27);
  const forksEl = <g>
    {hisF.vis && <Fork x={forkOrigin(hisF.h, hisF.th).x} y={forkOrigin(hisF.h, hisF.th).y} rot={hisF.th} s={0.9} />}
      {herF.vis && <Fork x={forkOrigin(herF.h, herF.th).x} y={forkOrigin(herF.h, herF.th).y} rot={herF.th} s={0.9} />}
    {pieceOn && <g transform={`translate(${ho.x} ${ho.y}) rotate(${hisF.th})`}><path d="M -34 -22 L 34 -22 L 0 -100 Z" fill={C.pie} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" /><circle cx={0} cy={-44} r={13} fill={C.cream} stroke={C.ink} strokeWidth={4} /></g>}
  </g>;
  const plateEl = <g>
      {t < 3.0 && <ellipse cx={px} cy={PLATE_Y - 30} rx={360} ry={170} fill="url(#haloWarm)" opacity={0.85 * (1 - smooth(t, 2.4, 3.0))} />}
      <g transform={`translate(${px} ${PLATE_Y})`}>
        <Plate x={0} y={0} s={t < 3.0 ? lerp(1.3, 1.0, smooth(t, 2.0, 3.0)) : 1} slice={false} id="pl2" />
        <g transform={`scale(${t < 3.0 ? lerp(1.3, 1.0, smooth(t, 2.0, 3.0)) : 1})`}><Pieces t={t} /></g>
      </g>
  </g>;
  return <g>
    <g transform={planeT(cam, 0.3)}><Far t={t} /></g>
    <g transform={planeT(cam, 0.55)}>
      <PieCase open={0} slice={false} t={t} />
      <ClockSign x={540} y={522} />
    </g>
    <g transform={planeT(cam, 0.9)}>
      <Beanie x={1018} y={990} />
      <Waitress t={t} look={t > 9.4 ? [t > 10.3 ? 0 : -0.8, 0.1] : [t < 4 ? -0.6 : 0.2, 0]} />
      <Person who="him" x={HIM.x} y={HIM.y} pose={him} />
      {chew && <g>{[-1, 1].map((sd) => { const pp = Math.max(0, sd * pf); return pp > 0.05 ? <ellipse key={sd} cx={HIM.x + sd * 86} cy={800} rx={22 + 16 * pp} ry={20 + 12 * pp} fill={C.skinHim} stroke={C.ink} strokeWidth={6} /> : null; })}</g>}
      <Person who="her" x={HER.x} y={HER.y} pose={her} />
      <Counter />
      <g transform={`translate(${sh} ${shY})`}>
        <CrayonCup x={385} y={1078} />
        <Dispenser x={752} y={1070} pull={pull} />
      </g>
      {!take2 && <Mug x={MUG_HIS.x + rattle(0)} y={MUG_HIS.y + (growl ? Math.abs(Math.sin(t * 50)) * -6 : 0)} />}
      {!take2 && <Mug x={MUG_HERS.x + rattle(2)} y={MUG_HERS.y + (growl ? Math.abs(Math.sin(t * 46 + 1)) * -6 : 0)} />}
      {growl && [0, 1, 2, 3].map((i) => <circle key={i} cx={MUG_HIS.x + 30 + i * 40 + Math.sin(t * 30 + i) * 10} cy={MUG_HIS.y - 90 - ((t * 260 + i * 70) % 130)} r={7} fill="#5A3322" stroke={C.ink} strokeWidth={3} />)}
      {t >= 3.0 && plateEl}
      {t >= B.forkDown && t < B.rewind && <Fork x={forkOrigin(PLACED, 98).x - 0} y={forkOrigin(PLACED, 98).y} rot={98} s={0.9} />}

      {/* his and her forks */}
      {t >= 3.0 && forksEl}
      {clash.map((k, i) => <Spark key={i} x={540} y={1030} k={k} />)}
      {t >= B.duel && t < B.napkin3 && clash.map((k, i) => k > 0 && k < 0.6 ? <g key={`m${i}`} stroke={C.ink} strokeWidth={6} strokeLinecap="round" opacity={1 - k / 0.6}>
        <path d="M 470 1000 l -30 -28 M 610 1000 l 30 -28 M 540 960 l 0 -40" /></g> : null)}
      {/* phones */}
      {!take2 && <Phone id="him" x={hp.x} y={hp.y} rot={hp.rot} scale={hp.s} lit={hp.lit} p={hp.p} dir={hp.dir} thumb={hp.thumb} flat={hp.flat} skin={C.skinHim} />}
      {!take2 && !(hook === 'b' && t >= 0.45 && t < 3.0) && <Phone id="her" x={rp.x} y={rp.y} rot={rp.rot} scale={rp.s} lit={rp.lit} p={rp.p} dir={rp.dir} thumb={rp.thumb} flat={rp.flat} caseColor={C.pink} skin={C.skinHer} />}
      {hook === 'b' && t >= 0.45 && t < 3.0 && <g transform={`translate(${rp.x} ${rp.y}) scale(${rp.s} ${rp.s * 0.46})`}><PhoneBack caseColor={C.pink} glow={0} /></g>}
      {t < 3.0 && plateEl}
      {t < 3.0 && forksEl}
      {hook === 'a' && t < 3.0 && [1.08, 1.88].map((c, i) => <Spark key={i} x={540} y={1126} k={wp(t, c, c + 0.3)} />)}
      {hold && t < (hook === 'b' ? 0.65 : LOW1 + 0.2) && <Arm who="her" sx={690} sy={1020} hx={herHold.x} hy={herHold.y} />}
      {hold && <Arm who="him" sx={-70} sy={1100} hx={hisHold.x} hy={hisHold.y} />}
      {/* arms */}
      <Arm who="him" sx={-70} sy={1235} hx={hisA.x} hy={hisA.y} />
      <Arm who="her" sx={1150} sy={1235} hx={herA.x} hy={herA.y} />
      {crayonUp && <g transform={`translate(${herA.x + 18} ${herA.y - 30}) rotate(-28)`}><rect x={-9} y={-74} width={18} height={64} fill={C.cran} stroke={C.ink} strokeWidth={5} /><polygon points="-9,-74 9,-74 0,-96" fill={C.cran} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" /></g>}
      {wOn && t < B.forkDown && <Fork x={forkOrigin(wHand, 98).x} y={forkOrigin(wHand, 98).y} rot={98} s={0.9} />}
      {wOn && t < B.forkDown + 0.6 && (() => {
        const S0: Pt = {x: 452, y: 905};
        const mid = {x: (S0.x + wHand.x) / 2, y: (S0.y + wHand.y) / 2};
        const E0 = {x: mid.x + 78, y: mid.y + 46};
        const ux = wHand.x - E0.x, uy = wHand.y - E0.y, ul = Math.hypot(ux, uy) || 1;
        const W0 = {x: wHand.x - (ux / ul) * 56, y: wHand.y - (uy / ul) * 56};
        return <BentArm S={S0} E={E0} W={W0} H={wHand} sleeve={C.mintUni} skin="#E3B38F" w={64} />;
      })()}
      {/* take 2: phones under mugs */}
      {take2 && <g>
        {leak(MUG_LAND_HIS.x, 0.75 + 0.25 * pulse(t, B.buzz, B.buzz + 0.3))}
        {leak(MUG_LAND_HERS.x, 0.8)}
        <Mug x={MUG_LAND_HIS.x + hisMugBuzz} y={MUG_LAND_HIS.y} rot={180} />
        <Mug x={MUG_LAND_HERS.x} y={MUG_LAND_HERS.y} rot={180} />
        {t >= B.buzz && t < B.buzz + 0.6 && <>
          <g transform={`translate(${MUG_LAND_HIS.x} 1030) scale(1.5) translate(${-MUG_LAND_HIS.x} -1030)`}>
            <BuzzMarks x={MUG_LAND_HIS.x} y={1030} k={wp(t, B.buzz, B.buzz + 0.3)} />
            <BuzzMarks x={MUG_LAND_HIS.x} y={1030} k={wp(t, B.buzz + 0.3, B.buzz + 0.6)} />
          </g>
        </>}
      </g>}
      {/* growl: scribble arc + lettering */}
      {growl && <Growl t={t} />}
      {showNap && <NapkinPaper w={470} h={340} x={nap.x} y={nap.y} rot={nap.rot} scale={nap.s} id="held" glowA={t < 2.3 ? 1 : 0}>
        <text x={0} y={-6} textAnchor="middle" fontFamily={HAND} fontWeight={700} fontSize={118} fill={C.cran} stroke={C.cran} strokeWidth={3} filter="url(#rough)">first</text>
        <text x={0} y={112} textAnchor="middle" fontFamily={HAND} fontWeight={700} fontSize={128} fill={C.cran} stroke={C.cran} strokeWidth={3} filter="url(#rough)">bite?</text>
      </NapkinPaper>}
      {hook === 'b' && t >= 0.35 && t < 1.7 && <g opacity={smooth(t, 0.35, 0.5) * (1 - smooth(t, 1.5, 1.7))}>
        <path d={`M 775 735 L ${hp.x + 20} ${hp.y - 70}`} fill="none" stroke={C.ink} strokeWidth={20} strokeLinecap="round" strokeDasharray="1 34" />
        <path d={`M 775 735 L ${hp.x + 20} ${hp.y - 70}`} fill="none" stroke="#fff" strokeWidth={11} strokeLinecap="round" strokeDasharray="1 34" />
      </g>}
      {burst && <Exclaim x={968} y={600} k={wp(t, 0.6, 1.0)} />}
    </g>
    <g transform={planeT(cam, 1.35)}>
      <Sugar x={-70} y={1360} s={0.8} />
      <Steam x={1040} y={1290} t={t} />
    </g>
  </g>;
};

const Growl: React.FC<{t: number}> = ({t}) => {
  const k = smooth(t, 7.0, 7.35) * (1 - smooth(t, 8.15, 8.45));
  if (k < 0.01) return null;
  const wob = Math.sin(t * 36) * 5;
  const d = 'M 300 1010 C 330 930 390 860 470 880 C 540 895 560 960 600 940';
  return <g opacity={k} transform={`translate(0 ${wob})`}>
    {/* shock lines leaving his belly */}
    <g stroke={C.ink} strokeWidth={9} strokeLinecap="round" fill="none">
      <path d="M 210 1010 l -50 -26 M 260 990 l -30 -50 M 330 1000 l 14 -56" />
    </g>
    <path d={d} fill="none" stroke={C.ink} strokeWidth={30} strokeLinecap="round" strokeDasharray="1 54" />
    <path d={d} fill="none" stroke={C.ink} strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" />
    <path d={d} fill="none" stroke={C.pumpkin} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />
    <g transform="translate(545 845) rotate(-8)">
      <text x={0} y={0} textAnchor="middle" fontFamily={MARKER} fontSize={104} fill={C.pumpkin} stroke={C.ink} strokeWidth={20} strokeLinejoin="round" paintOrder="stroke" letterSpacing={2}>GRRRL</text>
    </g>
  </g>;
};

// ------------------------------------------------------------------------------------------ whole-frame napkins
const InsertBG: React.FC<{t: number}> = ({t}) => <g>
  <g filter="url(#blurSoft)"><Far t={t} /><rect x={-200} y={1010} width={1500} height={900} fill="#79B8A4" /></g>
  <rect x={-100} y={-100} width={1300} height={2200} fill={C.ink} opacity={0.45} />
</g>;
const fitW = (txt: string, size: number, maxW: number) => Math.min(size, (size * maxW) / textW(txt, `700 ${size}px ${HAND}`));

type NL = {txt: string; color: string; sleeve: string; skin: string; a: number; b: number};
const INS: Record<string, {t0: number; id: string; lines: NL[]; sizes: number[]}> = {
  N1: {t0: B.napkin1, id: 'n1', sizes: [150, 160], lines: [
    {txt: 'YOU TAKE IT.', color: C.pumpkin, sleeve: C.rust, skin: C.skinHim, a: 4.7, b: 5.05}, {txt: "I'M FULL.", color: C.pumpkin, sleeve: C.rust, skin: C.skinHim, a: 5.1, b: 5.45}]},
  N2: {t0: B.napkin2, id: 'n2', sizes: [190, 150], lines: [
    {txt: 'ME.', color: C.pumpkin, sleeve: C.rust, skin: C.skinHim, a: 13.7, b: 14.05}, {txt: 'I CALLED IT.', color: C.pumpkin, sleeve: C.rust, skin: C.skinHim, a: 14.1, b: 14.45}]},
  N3: {t0: B.napkin3, id: 'n3', sizes: [230], lines: [{txt: 'fine. go.', color: C.cran, sleeve: C.cran, skin: C.skinHer, a: 17.1, b: 17.45}]},
  N4: {t0: B.napkin4, id: 'n4', sizes: [200, 200], lines: [
    {txt: 'HALF.', color: C.pumpkin, sleeve: C.rust, skin: C.skinHim, a: 20.2, b: 20.55}, {txt: 'FAIR?', color: C.pumpkin, sleeve: C.rust, skin: C.skinHim, a: 20.6, b: 20.95}]},
  N5: {t0: B.napkin5, id: 'n5', sizes: [150, 150], lines: [
    {txt: 'why are you here', color: C.cran, sleeve: C.cran, skin: C.skinHer, a: 23.95, b: 24.3}, {txt: 'at midnight?', color: C.cran, sleeve: C.cran, skin: C.skinHer, a: 24.35, b: 24.7}]},
};
const NapkinInsert: React.FC<{t: number; kind: 'N1' | 'N2' | 'N3' | 'N4' | 'N5'}> = ({t, kind}) => {
  const I = INS[kind];
  const k = smooth(t, I.t0, I.t0 + 0.25);
  const x = lerp(1500, 540, k), rot = lerp(12, -2, k);
  const two = I.lines.length === 2;
  const ys = two ? [-62, 112] : [20];
  return <g>
    <InsertBG t={t} />
    <NapkinPaper w={840} h={560} x={x} y={760} rot={rot} id={I.id} glowA={0.9}>
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

// ------------------------------------------------------------------------------------------ rewind close-up: phones into mugs
const CloseBG: React.FC<{t: number}> = ({t}) => <g>
  <g filter="url(#blurSoft)"><Far t={t} /><rect x={-200} y={880} width={1500} height={400} fill="#6FB3A0" /></g>
  <rect x={-100} y={-100} width={1300} height={2200} fill={C.ink} opacity={0.3} />
  <rect x={-200} y={800} width={1480} height={450} fill="url(#counterTop)" stroke={C.ink} strokeWidth={9} />
  {Array.from({length: 16}, (_, i) => <g key={i} transform={`translate(${(i * 131) % 1100} ${840 + ((i * 59) % 380)}) rotate(${(i * 37) % 80})`} opacity={0.5}><path d="M 0 0 L 26 7 L 8 20 Z" fill="#E8FFF6" /><circle cx={34} cy={5} r={3} fill={C.mintDeep} /></g>)}
  <rect x={-200} y={1250} width={1480} height={40} fill="url(#chromeG)" stroke={C.ink} strokeWidth={9} />
  <rect x={-200} y={1290} width={1480} height={700} fill={C.tealLite} stroke={C.ink} strokeWidth={9} />
</g>;
const PhoneBack: React.FC<{caseColor: string; glow: number}> = ({caseColor, glow}) => <g>
  <ellipse cx={0} cy={0} rx={330} ry={330} fill="url(#haloCool)" opacity={glow} />
  <rect x={-82} y={-148} width={164} height={296} rx={30} fill="none" stroke="#DFF7FF" strokeWidth={14} opacity={glow} />
  <rect x={-80} y={-146} width={160} height={292} rx={30} fill={caseColor} stroke={C.ink} strokeWidth={8} />
  <rect x={-62} y={-128} width={62} height={62} rx={16} fill="#00000033" stroke={C.ink} strokeWidth={5} />
  <circle cx={-44} cy={-110} r={11} fill="#111" stroke={C.ink} strokeWidth={3} /><circle cx={-18} cy={-84} r={11} fill="#111" stroke={C.ink} strokeWidth={3} />
  <path d="M 38 -110 L 38 100" stroke="#fff" strokeWidth={7} opacity={0.3} strokeLinecap="round" />
</g>;
const FlipPhone: React.FC<{x: number; y: number; s: number; k: number; caseColor: string; id: string; skin: string; jx: number}> = ({x, y, s, k, caseColor, id, skin, jx}) => {
  const sx = Math.cos(k * Math.PI);
  return <g transform={`translate(${x + jx} ${y}) scale(${Math.abs(sx) * s + 0.001} ${s})`}>
    {k < 0.5 ? <Phone id={id} x={0} y={0} lit={1} p={0} thumb={0} caseColor={caseColor} skin={skin} /> : <PhoneBack caseColor={caseColor} glow={0.9} />}
  </g>;
};
const MugDrop: React.FC<{x: number; land: number; t: number; arm: 'him' | 'her'; pulseA: number}> = ({x, land, t, arm, pulseA}) => {
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
  return <g>
    {t >= land && <g>
      <ellipse cx={x} cy={1140} rx={270} ry={62} fill="#E4FAFF" opacity={0.85 * pulseA} filter="url(#blurSh)" />
      <ellipse cx={x} cy={1136} rx={190} ry={18} fill="#FFFFFF" opacity={pulseA} />
      <ellipse cx={x} cy={1100} rx={340} ry={190} fill="url(#haloCool)" opacity={0.7 * pulseA} />
    </g>}
    {!hide && <BentArm S={S0} E={E} W={Wr} H={H} sleeve={arm === 'him' ? C.rust : C.cran} skin={arm === 'him' ? C.skinHim : C.skinHer} w={96} />}
    {!hide && <g transform={`translate(${x} ${fall + 93 * (1 - sq)}) scale(${S} ${S * sq}) rotate(180)`}><Mug x={0} y={0} /></g>}
    {!hide && <g><circle cx={H.x} cy={H.y} r={50} fill={arm === 'him' ? C.skinHim : C.skinHer} stroke={C.ink} strokeWidth={7} />
      <path d={`M ${H.x - sg * 6} ${H.y + 6} q ${-sg * 4} 12 ${-sg * 18} 14 M ${H.x - sg * 22} ${H.y - 6} q ${-sg * 4} 12 ${-sg * 18} 14`} fill="none" stroke={C.ink} strokeWidth={4} opacity={0.5} strokeLinecap="round" /></g>}
  </g>;
};
const Rewind: React.FC<{t: number}> = ({t}) => {
  const HX = 300, RX = 780, PY = 1010;
  const buzzAt = (t0: number) => t >= t0 && t < t0 + 0.2 ? Math.sin(t * 120) * 8 * (1 - wp(t, t0, t0 + 0.2)) : 0;
  const hisFlip = smooth(t, B.flipHis, B.flipHis + 0.22), herFlip = smooth(t, B.flipHers, B.flipHers + 0.22);
  const pu = 0.8 + 0.2 * Math.sin(t * 4);
  const handSide = (x: number, t0: number, t1: number, dir: number) => { const e = smooth(t, t0, t0 + 0.12) * (1 - smooth(t, t1 - 0.12, t1)); return {x: lerp(dir > 0 ? 1250 : -170, x + dir * 120, e), y: PY + 30}; };
  const hh = handSide(HX, B.flipHis - 0.2, B.flipHis + 0.35, -1), rh = handSide(RX, B.flipHers - 0.2, B.flipHers + 0.35, 1);
  return <g>
    <CloseBG t={t} />
    <Plate x={540} y={905} s={0.6} dollop={1} />
    <FlipPhone x={HX} y={PY} s={1.15} k={hisFlip} caseColor="#2C2C36" id="mh" skin={C.skinHim} jx={buzzAt(11.55)} />
    <FlipPhone x={RX} y={PY} s={1.15} k={herFlip} caseColor={C.pink} id="mr" skin={C.skinHer} jx={buzzAt(11.75)} />
    {t < B.flipHis + 0.4 && <Arm who="him" sx={-300} sy={1160} hx={hh.x} hy={hh.y} w={100} />}
    {t < B.flipHers + 0.4 && <Arm who="her" sx={1300} sy={1160} hx={rh.x} hy={rh.y} w={100} />}
    <MugDrop x={RX} land={B.mugHers} t={t} arm="her" pulseA={pu} />
    <MugDrop x={HX} land={B.mugHis} t={t} arm="him" pulseA={pu} />
    {t >= 11.1 && t < 13.45 && <g transform="translate(540 600) rotate(-4)">
      <rect x={-250} y={-64} width={500} height={128} rx={20} fill={C.ink} opacity={0.35} transform="translate(8 10)" />
      <rect x={-250} y={-64} width={500} height={128} rx={20} fill={C.pumpkin} stroke={C.ink} strokeWidth={8} />
      <polygon points="-196,0 -150,-30 -150,30" fill={C.ink} /><polygon points="-150,0 -104,-30 -104,30" fill={C.ink} />
      <text x={70} y={32} textAnchor="middle" fontFamily={ANTON} fontSize={96} fill={C.ink} letterSpacing={3}>TAKE 2</text>
    </g>}
  </g>;
};


// ------------------------------------------------------------------------------------------ macro: the cut in half (top-down plate)
const Macro: React.FC<{t: number}> = ({t}) => {
  const split = smooth(t, 19.12, 19.4);
  const push = smooth(t, 19.45, 19.95);
  const bigX = push * 90;
  const Wedge: React.FC<{pts: string; id: string; nx: number; ny: number; nr: number; cream?: boolean; cx?: number; cy?: number}> = ({pts, id, nx, ny, nr, cream, cx = 0, cy = 0}) => <g>
    <polygon points={pts} fill={C.pie} stroke={C.ink} strokeWidth={9} strokeLinejoin="round" />
    <clipPath id={id}><polygon points={pts} /></clipPath>
    <circle cx={nx} cy={ny} r={nr} fill="#E7EEF0" stroke={C.ink} strokeWidth={8} clipPath={`url(#${id})`} />
    {cream && <g transform={`translate(${cx} ${cy})`}><circle cx={-16} cy={0} r={30} fill={C.cream} stroke={C.ink} strokeWidth={6} /><circle cx={18} cy={4} r={28} fill={C.cream} stroke={C.ink} strokeWidth={6} /><circle cx={0} cy={-20} r={28} fill={C.cream} stroke={C.ink} strokeWidth={6} /></g>}
  </g>;
  const bx = bigX + split * 10, by = -split * 70;
  const ox = -split * 80, oy = split * 80;
  const fox = -200 + bx - 146;
  return <g>
    <rect x={-200} y={-100} width={1480} height={1450} fill="url(#counterTop)" />
    {Array.from({length: 18}, (_, i) => <g key={i} transform={`translate(${(i * 131) % 1100} ${300 + ((i * 97) % 900)}) rotate(${(i * 37) % 80})`} opacity={0.5}><path d="M 0 0 L 26 7 L 8 20 Z" fill="#E8FFF6" /></g>)}
    <g transform="translate(540 900)">
      <ellipse cx={12} cy={22} rx={350} ry={350} fill={C.ink} opacity={0.22} filter="url(#blurSh)" />
      <circle r={340} fill={C.napkin} stroke={C.ink} strokeWidth={10} />
      <circle r={250} fill="#E7EEF0" stroke={C.ink} strokeWidth={5} opacity={0.9} />
      {/* his half (smaller), lower left, bite taken out of its tip */}
      <g transform={`translate(${ox} ${oy})`}>
        <Wedge pts="-230,70 40,40 40,170" id="mc1" nx={-212} ny={74} nr={44} />
        <rect x={30} y={34} width={36} height={142} rx={16} fill={C.crust} stroke={C.ink} strokeWidth={9} />
      </g>
      {/* her half (bigger), upper right, pushed toward her */}
      <g transform={`translate(${bx} ${by})`}>
        <Wedge pts="-210,-90 120,-190 120,10" id="mc2" nx={-186} ny={-96} nr={66} cream cx={20} cy={-110} />
        <rect x={110} y={-198} width={42} height={216} rx={18} fill={C.crust} stroke={C.ink} strokeWidth={9} />
      </g>
      {/* his fork pushing from the left, tip at the bigger half */}
      {t > 19.25 && <g>
        <Arm who="him" sx={-900} sy={150} hx={fox - 370} hy={-90 + by} w={120} />
        <Fork x={fox} y={-90 + by} rot={90} s={1.8} />
      </g>}
      {split > 0.5 && <g stroke={C.ink} strokeWidth={7} strokeLinecap="round" opacity={0.7} fill="none"><path d="M -110 -20 l 60 14 M -90 10 l 70 10" /></g>}
    </g>
  </g>;
};

// ------------------------------------------------------------------------------------------ vote
const VoteScene: React.FC<{t: number}> = ({t}) => {
  const z = 1 + 0.02 * clamp((t - VOTE_AT) / 6);
  return <g transform={`translate(540 960) scale(${z}) translate(-540 -960)`}>
    <Far t={t} />
    <rect x={-200} y={1000} width={1500} height={1000} fill={C.tealLite} />
    <Counter />
    <rect x={-100} y={-100} width={1300} height={2200} fill={C.ink} opacity={0.3} />
    <Chalk text="what do I write?" x={540} y={555} w={800} h={116} size={70} a={smooth(t, B.cardA - 0.1, B.cardA + 0.3)} />
    {[['A', 745, -1.5, 'va', B.cardA], ['B', 960, 1.5, 'vb', B.cardB]].map(([L, y, rot, id, at], i) => {
      const ph = Math.max(0, t - VOTE_AT - 0.3) / 1.4 % 2;
      const hl = t < VOTE_AT + 0.3 ? 0 : i === 0 ? (ph < 1 ? Math.sin(ph * Math.PI) : 0) : (ph >= 1 ? Math.sin((ph - 1) * Math.PI) : 0);
      const yy = y as number;
      return <g key={id as string} transform={`translate(540 ${yy}) scale(${1 + 0.045 * hl}) translate(-540 ${-yy})`}>
        <rect x={50} y={yy - 132} width={980} height={264} rx={18} fill={C.pumpkin} opacity={0.45 * hl} filter="url(#blurSh)" />
        <VoteCard letter={L as string} l1={(spec.choices as unknown as Record<string, {l1: string; l2: string}>)[L as string].l1} l2={(spec.choices as unknown as Record<string, {l1: string; l2: string}>)[L as string].l2} y={yy} age={t - (at as number)} rot={rot as number} id={id as string} />
      </g>;
    })}
  </g>;
};

const renderShot = (t: number, hook: Hook, id: ShotId = shotAt(t)): React.ReactNode => {
  if (id === 'N1' || id === 'N2' || id === 'N3' || id === 'N4' || id === 'N5') return <NapkinInsert t={t} kind={id} />;
  if (id === 'R') return <Rewind t={t} />;
  if (id === 'M') return <Macro t={t} />;
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
  const fast = inWipe;
  const mirror = 'translate(1080 0) scale(-1 1)';
  return <>
    <MotionBlurWhen fast={fast} samples={5} shutter={220}>
      <AbsoluteFill>
        <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, background: C.teal}}>
          <Defs />
          <defs><clipPath id="biteHole"><path clipRule="evenodd" d="M -400 -300 H 400 V 200 H -400 Z M -92 -12 m -58 0 a 58 58 0 1 0 116 0 a 58 58 0 1 0 -116 0" /></clipPath><clipPath id="biteHole2"><path clipRule="evenodd" d="M -400 -300 H 400 V 200 H -400 Z M -30 -2 m -26 0 a 26 26 0 1 0 52 0 a 26 26 0 1 0 -52 0" /></clipPath></defs>
          {inWipe ? <>
            {wipe1 ? renderShot(REWIND_AT - 0.01, hook, 'D') : renderShot(VOTE_WIPE - 0.01, hook, 'N5')}
            <defs>{wipe1 ? <clipPath id="sliceNew"><WipeClipPoly k={k} tf={mirror} /></clipPath> : <WipeClip k={k} />}</defs>
            <g clipPath="url(#sliceNew)">{wipe1 ? <Rewind t={t} /> : <VoteScene t={t} />}</g>
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
          return <Strip key={i} text={s.text} y={s.y} age={t - s.from + (isHook ? 1 : 0.06)} out={isHook ? smooth(t, 2.8, 3.0) : smooth(t, s.to - 0.12, s.to)} size={(s as {size?: number}).size ?? (comment ? 60 : 56)} hot={comment} maxW={(s as {maxW?: number}).maxW ?? (comment ? 760 : 1000)} />;
        })}
      </svg>
    </AbsoluteFill>
  </>;
};

// the clockwise wedge polygon without its own <clipPath> wrapper, so the rewind can mirror it (counter-clockwise)
const WipeClipPoly: React.FC<{k: number; tf: string}> = ({k, tf}) => {
  const a1 = -90 + 360 * smooth(k, 0, 1);
  const n = Math.max(2, Math.ceil((a1 + 90) / 8));
  const pts = ['540,960'];
  for (let i = 0; i <= n; i++) { const a = ((-90 + ((a1 + 90) * i) / n) * Math.PI) / 180; pts.push(`${540 + Math.cos(a) * 1800},${960 + Math.sin(a) * 1800}`); }
  return <polygon points={pts.join(' ')} transform={tf} />;
};

export const Pie2: React.FC<{hook?: Hook}> = ({hook = 'a'}) => (
  <AbsoluteFill style={{background: C.teal}}>
    <Audio src={staticFile('audio/pie-ep2.wav')} volume={0.9} />
    <Scene hook={hook} />
  </AbsoluteFill>
);
