import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, lerp, smooth} from '../../lib/motion';
import {MotionBlurWhen} from '../../lib/shots';
import {
  Backdrop, C, Cam, CamKey, ChipCard, ChipLine, Counter, Defs, EndCard, FAN, FanClip, FanRim, FreeHand, HandStyle, Mouth, Person, PhoneUnit, Pose,
  Rack, Strip, VoteBg, VoteCard, WIPE_DUR, camAt, fitSize, planeT, slotAngle, slotXf, textW, tipOf, COUR,
} from './world';
import spec from '../../../specs/stories/whites-ep1.json';

// Fifty Whites, part 1 "Which white". Silent. Frame 1 is fully composed: ONE strip (the hook), two big faces, his phone
// lit mid-swipe, her phone lit, and the fan deck of near-identical whites as the biggest, brightest object. He flicks three
// chips off the fan like swipes, she answers with a chip printed SAME, they laugh (the part's payoff), both phones go face
// down, she writes "which white / are you?" on the back, he pulls EGGSHELL and POPPY and the vote is up by 21.8.

export const WHITES1_FPS = 60;
export const WHITES1_FRAMES = Math.round(spec.duration * WHITES1_FPS);
export type Hook = 'a' | 'b';
const B = spec.beats;
const WIPE_AT = 20.5;

const HIM = {x: 240, y: 650}, HER = {x: 840, y: 650};

// ------------------------------------------------------------------------------------------ keyframe helpers
type KF = number[];
const kf = (keys: KF[], t: number): number[] => {
  if (t <= keys[0][0]) return keys[0].slice(1);
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const a = keys[i - 1], b = keys[i], k = smooth(t, a[0], b[0]);
      return a.slice(1).map((v, j) => lerp(v, b[j + 1], k));
    }
  }
  return keys[keys.length - 1].slice(1);
};
const keyAt = <T,>(list: [number, T][], t: number): T => { let v = list[0][1]; for (const [a, b] of list) if (t >= a) v = b; return v; };
const wp = (t: number, a: number, b: number) => clamp((t - a) / (b - a));

// ------------------------------------------------------------------------------------------ poses
const HIM_LOOK: KF[] = [[0, 0.95, 0.3], [1.5, 0.95, 0.3], [2.0, 0.3, 0.8], [2.1, 0.5, 0.9], [3.4, 0.5, 0.9], [3.9, 0.9, 0.2], [4.4, 0.4, 0.8], [5.3, 0.6, 0.5], [6.4, 0.9, 0.1], [7.0, 0.2, 0.8],
  [7.9, 0.2, 0.8], [8.1, 0.9, 0.3], [9.6, 0.9, 0.2], [9.9, 0.5, 0.5], [11.0, 0.3, 0.8], [13.3, 0.3, 0.8], [14.1, 0.5, 0.5], [14.4, 0.7, 0.9], [15.6, 0.5, 0.8], [16.3, 0.3, 0.9],
  [17.6, 0.3, 0.9], [17.9, 0.95, 0.0], [19.5, 0.95, 0.0], [19.65, 0.0, -0.9], [20.1, 0.95, 0.0]];
const HER_LOOK: KF[] = [[0, -0.2, 0.8], [1.5, -0.2, 0.8], [1.7, -0.95, 0.7], [3.2, -0.9, 0.5], [3.8, -0.7, 0.1], [4.6, -0.5, 0.5], [5.2, -0.3, 0.8], [6.4, -0.9, 0.1], [7.8, -0.9, 0.1],
  [8.1, -0.7, 0.3], [9.9, -0.5, 0.3], [11.0, -0.1, 0.8], [13.0, -0.1, 0.8], [13.3, -0.9, 0.2], [14.4, -0.6, 0.4], [17.8, -0.95, 0.0], [19.5, -0.95, 0.0], [19.65, 0.0, -0.9], [20.1, -0.95, 0.0]];
const HIM_MOUTH: [number, Mouth][] = [[0, 'gulp'], [2.2, 'o'], [2.9, 'flat'], [7.2, 'smirk'], [8.8, 'laugh'], [9.6, 'smile'], [11.0, 'flat'], [14.2, 'gulp'], [14.7, 'gulp'], [16.3, 'grit'], [20.6, 'grit']];
const HER_MOUTH: [number, Mouth][] = [[0, 'smirk'], [5.4, 'smirk'], [8.8, 'laugh'], [9.8, 'smile'], [11.0, 'flat'], [13.3, 'smirk'], [15.0, 'smile'], [17.8, 'smirk']];

const blinkAt = (t: number, seed: number) => { const ph = (t + seed) % 3.7; return ph < 0.14 ? Math.sin((ph / 0.14) * Math.PI) : 0; };
const laughAt = (t: number) => t >= 8.82 && t < 9.65;

const himPose = (t: number): Pose => {
  const [lx, ly] = kf(HIM_LOOK, t);
  const g = Math.sin(wp(t, 14.2, 14.62) * Math.PI);
  const sweat = clamp((t - 14.2) / 5.8);
  const L = laughAt(t);
  return {look: [lx, ly], browL: 0.15 + sweat * 0.3 + (t > 2.15 && t < 2.6 ? 0.5 : 0), browR: 0.15 + sweat * 0.3 + (t > 2.15 && t < 2.6 ? 0.5 : 0), worry: Math.max(smooth(t, 14.1, 14.7) * 0.9, 0.55 * (1 - smooth(t, 1.5, 2.0))),
    mouth: keyAt(HIM_MOUTH, t), happy: L, sweat, gulp: g, tilt: L ? Math.sin(t * 22) * 3 : Math.sin(t * 0.9) * 1.1, bob: L ? -Math.abs(Math.sin(t * 22)) * 9 : 0, blink: blinkAt(t, 0.4)};
};
const herPose = (t: number): Pose => {
  const [lx, ly] = kf(HER_LOOK, t);
  const L = laughAt(t);
  const brow = smooth(t, 3.7, 3.9) * (1 - smooth(t, 5.0, 5.3)) + smooth(t, 17.8, 18.0) * (1 - smooth(t, 20.3, 20.5));
  return {look: [lx, ly], browL: brow, browR: 0.1, worry: 0, mouth: keyAt(HER_MOUTH, t), happy: L, sweat: 0, gulp: 0, tilt: L ? Math.sin(t * 21 + 1) * 3 : Math.sin(t * 0.8 + 2) * 1.2, bob: L ? -Math.abs(Math.sin(t * 21 + 1)) * 9 : 0, blink: blinkAt(t, 1.9)};
};

// ------------------------------------------------------------------------------------------ cameras
const CAMK: CamKey[] = [
  {t: 0, x: 540, y: 960, z: 1.0}, {t: 3.5, x: 520, y: 950, z: 1.035}, {t: 5.6, x: 560, y: 980, z: 1.04}, {t: 7.0, x: 470, y: 960, z: 1.075},
  {t: 8.6, x: 540, y: 950, z: 1.035}, {t: 10.4, x: 540, y: 960, z: 1.0}, {t: 12.0, x: 560, y: 940, z: 1.08}, {t: 13.6, x: 500, y: 960, z: 1.04},
  {t: 15.4, x: 540, y: 950, z: 1.05}, {t: 18.0, x: 540, y: 940, z: 1.09}, {t: 20.5, x: 540, y: 950, z: 1.06},
];

// ------------------------------------------------------------------------------------------ chips
const WHITES = [C.w1, C.w2, C.w3, C.w4, '#F6F0E4', '#EFE9DC', C.w3, C.w2];
const NAMES = spec.cards.fan_names_small;
const FLICK = [B.flick1, B.flick2, B.flick3];
type Xf = {x: number; y: number; rot: number; m: number; sc: number; flip: number};
const SAME_K: KF[] = [
  [5.4, 694, 1127, 27, 0, 1, 0], [5.95, 770, 1050, 8, 1, 0.9, 0], [6.4, 750, 1040, 6, 1, 0.9, 0], [7.0, 410, 1050, -4, 1, 1, 0], [7.95, 410, 1050, -4, 1, 1, 0],
  [8.6, 300, 1370, -10, 1, 0.46, 0], [10.8, 300, 1370, -10, 1, 0.46, 0], [11.3, 540, 1040, 0, 1, 1, 1], [13.1, 540, 1040, 0, 1, 1, 1], [13.8, 400, 1050, -4, 1, 1, 1],
  [14.6, 300, 1370, -10, 1, 0.46, 1],
];
const sameXf = (t: number): Xf => { const [x, y, rot, m, sc, flip] = kf(SAME_K, t); return {x, y, rot, m, sc, flip}; };
const EGG_K: KF[] = [[15.0, 652, 1109, 19.3, 0, 1, 0], [15.55, 330, 1050, -6, 1, 1, 0], [17.2, 330, 1050, -6, 1, 1, 0], [17.95, 318, 1020, -4, 1, 1.05, 0]];
const POP_K: KF[] = [[15.6, 563, 1091, 3.9, 0, 1, 0], [16.15, 760, 1050, 6, 1, 1, 0], [17.2, 760, 1050, 6, 1, 1, 0], [17.95, 772, 1020, 4, 1, 1.05, 0]];
const xfOf = (K: KF[], t: number): Xf => { const [x, y, rot, m, sc, flip] = kf(K, t); return {x, y, rot, m, sc, flip}; };
const SAME_W = 460, SAME_H = 690, CH_W = 380, CH_H = 560;

const backLines = (t: number): ChipLine[] => {
  const f1 = fitSize('which white', (s) => `700 ${s}px "Courier Prime"`, 68, SAME_W - 60);
  return [{txt: spec.cards.same_back_l1, y: -70, p: wp(t, 11.3, 12.1)}, {txt: spec.cards.same_back_l2, y: 30, p: wp(t, 12.2, 13.0)}].map((l) => ({...l, y: l.y + 0 * f1}));
};

const FlipChip: React.FC<{xf: Xf; w: number; h: number; swatch: string; label: string; t: number; opacity?: number; id: string}> = ({xf, w, h, swatch, label, t, opacity = 1, id}) => {
  const fl = Math.cos(xf.flip * Math.PI);
  const back = xf.flip > 0.5;
  const sx = Math.max(0.02, Math.abs(fl));
  const cw = lerp(FAN.w, w, xf.m), ch = lerp(FAN.len, h, xf.m);
  return <g opacity={opacity} transform={`translate(${xf.x} ${xf.y}) rotate(${xf.rot}) scale(${xf.sc * sx} ${xf.sc})`}>
    <ChipCard w={cw} h={ch} swatch={swatch} label={label} m={xf.m} face={back ? 'back' : 'front'} lines={back ? backLines(t) : []} id={id} />
  </g>;
};

const flicking = (t: number) => FLICK.some((f) => t >= f - 0.05 && t < f + 0.3) || (t >= 5.4 && t < 5.7) || (t >= 6.4 && t < 6.9) || (t >= 10.9 && t < 11.3) || (t >= 13.2 && t < 13.6) || (t >= 15.0 && t < 15.2) || (t >= 15.6 && t < 15.8) || (t >= 17.8 && t < 18.0);

// ------------------------------------------------------------------------------------------ fan
const FanDeck: React.FC<{t: number}> = ({t}) => {
  const spread = 1 + 0.14 * smooth(t, 14.75, 15.0);
  const sway = Math.sin(t * 1.3) * 0.5 + (t > 14.75 && t < 15.5 ? Math.sin((t - 14.75) * 30) * 1.2 * (1 - wp(t, 14.75, 15.5)) : 0);
  const present = (i: number) => (i < 3 ? t < FLICK[i] : i === 7 ? t < B.pluck : i === 6 ? t < B.pullA : true);
  return <g transform={`rotate(${sway} ${FAN.px} ${FAN.py})`}>
    {Array.from({length: 8}, (_, i) => present(i) ? <g key={i} transform={`translate(${FAN.px} ${FAN.py}) rotate(${slotAngle(i, 8, spread)}) translate(0 ${-FAN.len / 2})`}>
      <ChipCard w={FAN.w} h={FAN.len} swatch={WHITES[i]} label={NAMES[i]} m={0} id={`f${i}`} />
    </g> : null)}
    <circle cx={FAN.px} cy={FAN.py - 40} r={16} fill={C.navy} />
  </g>;
};

const FlyingChips: React.FC<{t: number}> = ({t}) => <g>
  {FLICK.map((tf, i) => {
    const k = (t - tf) / 0.5;
    if (k < 0 || k > 1) return null;
    const e = k * k * (3 - 2 * k);
    const s = slotXf(i);
    const xf: Xf = {x: s.x - 860 * e, y: s.y - 150 * e - 60 * Math.sin(k * Math.PI), rot: s.rot - 110 * e, m: 0, sc: 1, flip: 0};
    return <FlipChip key={i} xf={xf} w={FAN.w} h={FAN.len} swatch={WHITES[i]} label={NAMES[i]} t={t} opacity={1 - smooth(k, 0.75, 1)} id={`fl${i}`} />;
  })}
</g>;

// ------------------------------------------------------------------------------------------ hands
type HandS = {x: number; y: number; rot: number; thumb: number; show: number; style: HandStyle; wiggle: number};
const himFlickHand = (t: number): HandS => {
  const t0 = tipOf(0), t1 = tipOf(1), t2 = tipOf(2);
  const K: KF[] = [[1.85, t0.x + 95, t0.y + 90, -10, 0, 0], [2.0, t0.x + 95, t0.y + 80, -10, 0, 1], [2.1, t0.x + 95, t0.y + 80, -10, 0, 1], [2.3, t0.x - 40, t0.y + 60, -22, 1, 1],
    [2.5, t1.x + 95, t1.y + 80, -10, 0, 1], [2.6, t1.x + 95, t1.y + 80, -10, 0, 1], [2.8, t1.x - 40, t1.y + 60, -22, 1, 1],
    [3.0, t2.x + 95, t2.y + 80, -10, 0, 1], [3.1, t2.x + 95, t2.y + 80, -10, 0, 1], [3.3, t2.x - 40, t2.y + 60, -22, 1, 1], [3.7, t2.x - 40, t2.y + 90, -22, 0.4, 1], [4.1, t2.x + 60, t2.y + 220, -10, 0, 0]];
  const [x, y, rot, thumb, show] = kf(K, t);
  return {x, y, rot, thumb, show, style: 'fist', wiggle: 0};
};
const sameHand = (t: number, xf: Xf): HandS | null => {
  const T7 = tipOf(7);
  const grab = [5.3, 5.4, 6.85, 7.15];
  if (t >= 5.25 && t < 5.4) { const k = wp(t, 5.25, 5.4); return {x: T7.x + 60, y: T7.y + 80 - (1 - k) * 40, rot: 15, thumb: 0.2, show: k, style: 'fist', wiggle: 0}; }
  if (t >= grab[1] && t < grab[3]) {
    const off = (xf.sc * SAME_W) / 2 + 30, offy = (xf.sc * SAME_H) / 2 - 130;
    return {x: xf.x + off * (t < 6.4 ? 1 : 1), y: xf.y + offy, rot: 12, thumb: 0.6, show: 1 - wp(t, 6.85, 7.15), style: 'fist', wiggle: 0};
  }
  if (t >= 13.1 && t < 14.0) {
    const off = (xf.sc * SAME_W) / 2 + 30, offy = (xf.sc * SAME_H) / 2 - 130;
    return {x: xf.x + off, y: xf.y + offy, rot: 12, thumb: 0.6, show: wp(t, 13.1, 13.25) * (1 - wp(t, 13.65, 14.0)), style: 'fist', wiggle: 0};
  }
  return null;
};
const herPalm = (t: number): HandS | null => t >= 17.85 && t < 20.5 ? {x: 930, y: 1530 - 6 * Math.sin(t * 3), rot: 4, thumb: 0, show: wp(t, 17.85, 18.2), style: 'palm', wiggle: t} : null;

// pencil on a chain (anchored to the counter corner, rests lying on the counter)
const HOOK = {x: 1062, y: 1345}, CHAIN = 980, PEN = 280;
const lineStart = (i: number) => {
  const l = backLines(99)[i];
  const fs = fitSize(l.txt, (s) => `700 ${s}px "Courier Prime"`, 68, SAME_W - 60);
  return {x: 540 - SAME_W / 2 + 30, y: 1040 + l.y + fs * 0.34, tw: textW(l.txt, `700 ${fs}px "Courier Prime"`)};
};
const topOf = (T: {x: number; y: number}, rho: number) => ({x: T.x + PEN * Math.sin((rho * Math.PI) / 180), y: T.y - PEN * Math.cos((rho * Math.PI) / 180)});
const mk = (top: {x: number; y: number}, rho: number) => ({top, rho, tip: {x: top.x - PEN * Math.sin((rho * Math.PI) / 180), y: top.y + PEN * Math.cos((rho * Math.PI) / 180)}});
const REST = mk({x: 1000, y: 1395}, 84);
const penPose = (t: number) => {
  const l1 = lineStart(0), l2 = lineStart(1);
  const RHO = 80;
  const tipHeld = (() => {
    if (t < 11.3) return {x: l1.x + 34, y: l1.y + 22};
    if (t < 12.1) return {x: l1.x + 34 + l1.tw * wp(t, 11.3, 12.1), y: l1.y + 22 + Math.sin(t * 40) * 3};
    if (t < 12.2) return {x: lerp(l1.x + 34 + l1.tw, l2.x + 34, smooth(t, 12.1, 12.2)), y: lerp(l1.y + 22, l2.y + 22, smooth(t, 12.1, 12.2))};
    if (t < 13.0) return {x: l2.x + 34 + l2.tw * wp(t, 12.2, 13.0), y: l2.y + 22 + Math.sin(t * 40) * 3};
    return {x: l2.x + 34 + l2.tw, y: l2.y + 22 - 70 * smooth(t, 13.0, 13.2)};
  })();
  const held = {...mk(topOf(tipHeld, RHO), RHO), held: 1};
  if (t < 11.0) return {...REST, held: 0};
  if (t < 11.3) { const k = smooth(t, 11.0, 11.3); const hp = topOf(tipHeld, RHO); return {...mk({x: lerp(REST.top.x, hp.x, k), y: lerp(REST.top.y, hp.y, k) - 60 * Math.sin(k * Math.PI)}, lerp(REST.rho, RHO, k)), held: k}; }
  if (t < 13.2) return held;
  if (t < 13.7) { const k = smooth(t, 13.2, 13.7); return {...mk({x: lerp(held.top.x, REST.top.x, k), y: lerp(held.top.y, REST.top.y, k) - 50 * Math.sin(k * Math.PI)}, lerp(RHO, REST.rho, k)), held: 1 - k}; }
  return {...REST, held: 0};
};
const PenLayer: React.FC<{t: number}> = ({t}) => {
  const p = penPose(t);
  const dx = p.top.x - HOOK.x, dy = p.top.y - HOOK.y, dist = Math.hypot(dx, dy);
  const sag = Math.min(110, Math.max(0, CHAIN - dist) * 0.8);
  const d = `M ${HOOK.x} ${HOOK.y} Q ${(HOOK.x + p.top.x) / 2} ${(HOOK.y + p.top.y) / 2 + sag} ${p.top.x} ${p.top.y}`;
  return <g>
    <path d={d} fill="none" stroke={C.navy} strokeWidth={11} strokeLinecap="round" />
    <path d={d} fill="none" stroke="#C9D2E6" strokeWidth={6} strokeDasharray="14 7" strokeLinecap="round" />
    <circle cx={HOOK.x} cy={HOOK.y} r={18} fill={C.navy} />
    <g transform={`translate(${p.tip.x} ${p.tip.y}) rotate(${p.rho})`}>
      <rect x={-20} y={-PEN} width={40} height={PEN - 36} rx={5} fill={C.sun} stroke={C.navy} strokeWidth={5} />
      <rect x={-20} y={-PEN} width={40} height={30} rx={5} fill={C.poppy} stroke={C.navy} strokeWidth={5} />
      <rect x={-20} y={-PEN + 30} width={40} height={14} fill="#B9C0CC" stroke={C.navy} strokeWidth={3} />
      <path d="M -20 -36 L 0 0 L 20 -36 Z" fill="#E8C79A" stroke={C.navy} strokeWidth={5} strokeLinejoin="round" /><path d="M -7 -12 L 0 0 L 7 -12 Z" fill="#2E3548" />
    </g>
    {p.held > 0.7 && (() => {
      const hx = p.tip.x + 0.96 * (p.top.x - p.tip.x) + 24, hy = p.tip.y + 0.96 * (p.top.y - p.tip.y) + 40;
      return <FreeHand who="her" hx={hx} hy={hy} rot={-24} thumb={0.5} base={[1500, 1150]} opacity={smooth(p.held, 0.7, 1)} />;
    })()}
  </g>;
};

// ------------------------------------------------------------------------------------------ phones
const swipeOf = (ticks: number[], t: number) => {
  let idx = -1;
  for (let i = 0; i < ticks.length; i++) if (ticks[i] <= t) idx = i;
  if (idx < 0) return {p: 0, dir: 1, on: 0};
  const p = clamp((t - ticks[idx]) / 0.26);
  return {p, dir: idx % 2 ? -1 : 1, on: 1};
};
const HIM_TICKS = [-0.1, 0.2, 0.5, 0.8, 1.1, 1.4];
const HER_TICKS = [-0.12, 0.35, 0.65, 0.95, 1.25, 1.55, 8.2, 8.5, 8.8];

const Phones: React.FC<{t: number}> = ({t}) => {
  const down = smooth(t, 9.62, 9.88);
  const arc = -50 * Math.sin(down * Math.PI);
  const hs = swipeOf(HIM_TICKS, t);
  const rs = swipeOf(HER_TICKS, t);
  const show = smooth(t, 7.95, 8.4) * (1 - smooth(t, 9.3, 9.6));
  const hx = lerp(95, 150, down), hy = lerp(1050, 1405, down) + arc;
  const rx = lerp(lerp(962, 730, show), 925, down), ry = lerp(lerp(1050, 980, show), 1405, down) + arc;
  return <g>
    <PhoneUnit who="him" x={hx} y={hy} rot={8} lit={1} p={t < 1.7 ? hs.p : 0} dir={hs.dir} down={down} thumbOn={t < 1.7 ? 1 : 0} />
    <PhoneUnit who="her" x={rx} y={ry} rot={lerp(-8, -16, show)} scale={1 + 0.2 * show} lit={1} p={t < 1.8 || (t >= 8.1 && t < 9.5) ? rs.p : 0} dir={rs.dir} down={down} thumbOn={t < 1.8 ? 1 : 0} />
  </g>;
};

// ------------------------------------------------------------------------------------------ main scene
const MainScene: React.FC<{t: number}> = ({t}) => {
  const cam: Cam = camAt(CAMK, Math.min(t, 20.5));
  const w = {...cam, x: cam.x + Math.sin(t * 0.8) * 3, y: cam.y + Math.sin(t * 1.1) * 2};
  const same = sameXf(t), egg = xfOf(EGG_K, t), pop = xfOf(POP_K, t);
  const sameOn = t >= B.pluck, eggOn = t >= B.pullA, popOn = t >= B.pullB;
  const hh = himFlickHand(t), sh = sameHand(t, same), pm = herPalm(t);
  const twL = Math.sin(wp(t, 16.35, 16.6) * Math.PI), twR = Math.sin(wp(t, 16.75, 17.0) * Math.PI);
  const holdOn = t >= 15.6;
  const hands: React.ReactNode[] = [];
  return <g>
    <g transform={planeT(w, 0.2)}><Backdrop /></g>
    <g transform={planeT(w, 0.3)}><Rack t={t} ding={clamp((t - 19.6) / 0.8)} showSpk={smooth(t, 19.2, 19.4) * (1 - smooth(t, 20.2, 20.4))} /></g>
    <g transform={planeT(w, 0.9)}>
      <Person who="him" x={HIM.x} y={HIM.y} t={t} pose={himPose(t)} seed={0.4} />
      <Person who="her" x={HER.x} y={HER.y} t={t} pose={herPose(t)} seed={1.9} />
    </g>
    <g transform={planeT(w, 1.0)}>
      <FanDeck t={t} />
      <Counter />
    </g>
    <g transform={planeT(w, 1.1)}>
      <FlyingChips t={t} />
      {sameOn && t < 15 && <FlipChip xf={same} w={SAME_W} h={SAME_H} swatch={C.w2} label={spec.cards.same_front} t={t} id="same" />}
      {eggOn && <FlipChip xf={egg} w={CH_W} h={CH_H} swatch={C.w3} label={spec.cards.chip_A} t={t} id="egg" />}
      {popOn && <FlipChip xf={pop} w={CH_W} h={CH_H} swatch={C.poppy} label={spec.cards.chip_B} t={t} opacity={wp(t, 15.6, 15.66)} id="pop" />}
      {hh.show > 0.02 && <FreeHand who="him" hx={hh.x} hy={hh.y} rot={hh.rot} thumb={hh.thumb} base={[380, 2100]} opacity={clamp(hh.show * 1.5)} />}
      {sh && sh.show > 0.02 && <FreeHand who="her" hx={sh.x} hy={sh.y} rot={sh.rot} thumb={sh.thumb} base={[880, 2100]} opacity={clamp(sh.show * 1.5)} />}
      {holdOn && t < 20.5 && <>
        <FreeHand who="him" hx={egg.x - egg.sc * 218} hy={egg.y + egg.sc * 285} rot={-14 + twL * 10} thumb={twL} base={[120, 2100]} opacity={wp(t, 15.5, 15.7)} />
        <FreeHand who="him" hx={pop.x + pop.sc * 218} hy={pop.y + pop.sc * 285} rot={14 - twR * 10} thumb={twR} base={[960, 2100]} opacity={wp(t, 16.0, 16.2)} />
      </>}
      {pm && <FreeHand who="her" hx={pm.x} hy={pm.y} rot={pm.rot} thumb={0} style="palm" wiggle={pm.wiggle} base={[1100, 2100]} opacity={clamp(pm.show * 1.5)} />}
      {hands}
    </g>
    <g transform={planeT(w, 1.04)}><Phones t={t} /></g>
    <g transform={planeT(w, 1.12)}><PenLayer t={t} /></g>
  </g>;
};

// ------------------------------------------------------------------------------------------ vote + edit
const VoteScene: React.FC<{t: number}> = ({t}) => {
  const z = 1 + 0.025 * clamp((t - 21) / 8);
  return <g transform={`translate(540 960) scale(${z}) translate(-540 -960)`}>
    <VoteBg t={t} />
    <VoteCard letter="A" l1={spec.choices.A.l1} l2={spec.choices.A.l2} y={640} age={t - B.cardA} swatch={C.w3} rot={-1.5} t={t} />
    <VoteCard letter="B" l1={spec.choices.B.l1} l2={spec.choices.B.l2} y={940} age={t - B.cardB} swatch={C.poppy} rot={1.5} t={t} />
  </g>;
};
type ShotId = 'main' | 'vote' | 'end';
const shotAt = (t: number): ShotId => (t < WIPE_AT ? 'main' : t < B.endcard ? 'vote' : 'end');
const renderShot = (s: ShotId, t: number): React.ReactNode => s === 'main' ? <MainScene t={t} /> : s === 'vote' ? <VoteScene t={t} /> : <EndCard a={t - B.endcard} t={t} />;

const Scene: React.FC<{hook: Hook}> = ({hook}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const inWipe = t >= WIPE_AT && t < WIPE_AT + WIPE_DUR;
  const k = inWipe ? (t - WIPE_AT) / WIPE_DUR : 0;
  const fast = inWipe || flicking(t);
  return <>
    <MotionBlurWhen fast={fast} samples={5} shutter={inWipe ? 220 : 150}>
      <AbsoluteFill>
        <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, background: C.wall}}>
          <Defs />
          {inWipe ? <>
            <MainScene t={t} />
            <defs><FanClip k={k} /></defs>
            <g clipPath="url(#fanclip)">{renderShot('vote', t)}</g>
            <FanRim k={k} />
          </> : renderShot(shotAt(t), t)}
        </svg>
      </AbsoluteFill>
    </MotionBlurWhen>
    <AbsoluteFill>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        {spec.strips.map((s, i) => {
          const isHook = (s as {hook?: boolean}).hook;
          const text = isHook ? (spec.hooks as Record<string, string>)[hook] : s.text;
          if (t >= s.to || t < s.from) return null;
          const comment = s.text.startsWith('comment');
          return <Strip key={i} text={text} y={s.y} age={t - s.from + (isHook ? 1 : 0.06)} out={isHook ? smooth(t, 2.85, 3.0) : smooth(t, s.to - 0.12, s.to)} size={isHook ? 56 : comment ? 76 : 60} hot={comment} rot={comment || isHook ? 0 : i % 2 ? 0.6 : -0.6} />;
        })}
      </svg>
    </AbsoluteFill>
  </>;
};

export const Whites1: React.FC<{hook?: Hook}> = ({hook = 'a'}) => (
  <AbsoluteFill style={{background: C.wall}}>
    <Audio src={staticFile('audio/whites-ep1.wav')} volume={0.9} />
    <Scene hook={hook} />
  </AbsoluteFill>
);
