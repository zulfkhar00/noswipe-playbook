import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, lerp, smooth} from '../../lib/motion';
import {MotionBlurWhen} from '../../lib/shots';
import {
  Arm, C, Cam, InkMark, Defs, FONT_FOG, FONT_POSTER, FingerHand, FRAME, GlassPanel, Item, ItemView, Mouth, NoSignal, Person, Phone, Pose, SleeveArm, Strip, VoteCard,
  Valley, WIN_H, WIN_W, WIPE_DUR, WindowFrame, WipeClip, calm, cellC, planeT, tipOf, wp,
} from './world';
import spec from '../../../specs/stories/cabin-ep1.json';

// Cabin Six, part 1 "Eight minutes". Silent. Ski-poster flat vector. Frame 1: ONE strip, him left / her right, both phones lit mid-swipe,
// the big bright fogged window between them. Signal dies, finger-writing on the fog, tic-tac-toe on the glass, a sleeve wipe opens a
// porthole and the sunrise bursts (hold), his distracted miss, game 2, vote board, end card.

export const CABIN1_FPS = 60;
export const CABIN1_FRAMES = Math.round(spec.duration * CABIN1_FPS);
export type Hook = 'a' | 'b';
const B = spec.beats;
const PY = spec.pylons;
const pulse = (t: number, a: number, b: number) => Math.sin(wp(t, a, b) * Math.PI);
type KF = number[];
const kf = (keys: KF[], t: number): number[] => {
  if (t <= keys[0][0]) return keys[0].slice(1);
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) { const a = keys[i - 1], b = keys[i], k = smooth(t, a[0], b[0]); return a.slice(1).map((v, j) => lerp(v, b[j + 1], k)); }
  }
  return keys[keys.length - 1].slice(1);
};
const keyAt = <T,>(list: [number, T][], t: number): T => { let v = list[0][1]; for (const [a, b] of list) if (t >= a) v = b; return v; };
const blinkAt = (t: number, seed: number) => { const ph = (t + seed) % 3.9; return ph < 0.14 ? Math.sin((ph / 0.14) * Math.PI) : 0; };

// ------------------------------------------------------------------------------------------ glass timeline (window-local coords 700 x 940)
const GX = 350, GY = 575, CELL = 118;
const cc = (i: number) => cellC(GX, GY, CELL, i);
const RE1 = B.refog1, RE2 = B.refog2;
const OUT2: [number, number] = [RE2, RE2 + 0.4];
const mk = (k: 'X' | 'O', cell: number, a: number, who: 'him' | 'her', out?: [number, number], dur = 0.33): Item => ({k, cx: cc(cell).x, cy: cc(cell).y, a, b: a + dur, who, out});
const ITEMS_ALL: Item[] = [
  {k: 'dot', cx: 450, cy: 560, a: 2.4, b: 2.7, who: 'her', out: [2.95, 3.3], hook: 'b'} as Item,
  {k: 'text', lines: [{s: spec.texts.hers[0], x: 350, y: 215, size: 130}, {s: spec.texts.hers[1], x: 350, y: 365, size: 130}], a: B.hers, b: B.hers + 0.75, out: [RE1, RE1 + 0.3], who: 'her'},
  {k: 'text', lines: [{s: spec.texts.stake[0], x: 350, y: 170, size: 88}, {s: spec.texts.stake[1], x: 350, y: 268, size: 88}], a: B.his, b: B.his + 0.7, out: [B.portholeStart + 0.05, B.portholeStart + 0.4], who: 'her'},
  {k: 'grid', cx: GX, cy: GY, cell: CELL, a: B.gridDraw, b: B.gridDraw + 0.7, out: OUT2, who: 'her'},
  mk('X', 1, B.x1, 'him', OUT2), mk('O', 4, B.o1, 'her', OUT2), mk('X', 2, B.x2, 'him', OUT2), mk('O', 0, B.o2, 'her', OUT2),
  mk('X', 3, B.x3, 'him', OUT2), mk('O', 8, B.o3, 'her', OUT2),
  {k: 'line', x1: cc(0).x - 78, y1: cc(0).y - 78, x2: cc(8).x + 78, y2: cc(8).y + 78, a: B.strike, b: B.strike + 0.45, who: 'her', out: OUT2},
  {k: 'text', lines: [{s: spec.texts.tally, x: 350, y: 335, size: 74}], a: B.tally, b: B.tally + 0.5, out: OUT2, who: 'her'},
  {k: 'text', lines: [{s: spec.texts.q[0], x: 350, y: 250, size: 100}, {s: spec.texts.q[1], x: 350, y: 380, size: 100}], a: 19.1, b: 19.8, out: [20.7, 21.0], who: 'her'},
  {k: 'text', lines: [{s: spec.texts.ans[0], x: 350, y: 250, size: 96}, {s: spec.texts.ans[1], x: 350, y: 380, size: 96}], a: 20.95, b: 21.55, who: 'him'},
];
const itemsFor = (hook: Hook) => ITEMS_ALL.filter((it) => !(it as {hook?: string}).hook || (it as {hook?: string}).hook === hook);

// finger presence per person
const fingerFor = (items: Item[], t: number, who: 'him' | 'her') => {
  let best: {k: number; x: number; y: number} | null = null;
  for (const it of items) {
    if (it.who !== who) continue;
    const k = smooth(t, it.a - 0.38, it.a - 0.05) * (1 - smooth(t, it.b + 0.1, it.b + 0.45));
    if (k > 0.01 && (!best || k >= best.k - 0.001)) { const tip = tipOf(it, Math.min(t, it.b)); best = {k, x: tip.x, y: tip.y}; }
  }
  return best;
};

// ------------------------------------------------------------------------------------------ people
const HIM_X = 160, HER_X = 920, HEAD_Y = 900, PSC = 1.35;
const himLook = (t: number, hook: Hook): number[] => {
  if (t < 3.0) return kf(hook === 'a'
    ? [[0, 0.1, 0.85], [0.55, 0.1, 0.85], [0.7, 0.85, 0.05], [2.6, 0.85, 0.05], [2.95, 0.35, 0.4]]
    : [[0, 0.1, 0.85], [0.5, 0.1, 0.85], [0.62, 0.9, 0.1], [2.2, 0.9, 0.1], [2.6, 0.5, 0.4], [2.95, 0.35, 0.5]], t);
  return kf([[3.0, 0.35, 0.5], [3.3, 0.1, 0.9], [3.8, 0.1, 0.9], [7.7, 0.4, 0.3], [8.3, 0.1, 0.9], [8.9, 0.75, 0.15], [11.7, 0.7, 0.2], [12.0, 0.6, -0.3], [12.9, 0.5, -0.55], [15.3, 0.5, -0.6],
    [15.7, 0.4, -0.5], [16.95, 0.45, -0.45], [17.15, 0.6, 0.3], [17.3, 0.3, 0.2], [18.1, 0.3, 0.2]], t);
};
const herLook = (t: number, hook: Hook): number[] => {
  if (t < 3.0) return kf(hook === 'a'
    ? [[0, -0.1, 0.85], [0.55, -0.1, 0.85], [0.7, -0.85, 0.05], [2.5, -0.85, 0.05], [2.95, -0.4, 0.3]]
    : [[0, -0.85, 0.7], [1.9, -0.85, 0.7], [2.1, -0.5, 0.1], [2.95, -0.4, 0.3]], t);
  return kf([[3.0, -0.4, 0.3], [3.3, -0.1, 0.9], [3.8, -0.1, 0.9], [7.7, -0.4, 0.3], [8.3, -0.1, 0.9], [8.9, -0.7, 0.15], [11.7, -0.7, 0.2], [12.0, -0.6, -0.3], [12.9, -0.55, -0.55], [14.0, -0.55, -0.55],
    [14.6, -0.4, -0.3], [15.9, -0.5, 0.2], [16.4, -0.5, 0.3], [17.1, -0.4, 0.35], [18.1, -0.3, 0.2]], t);
};
const HIM_M: [number, Mouth][] = [[0, 'soft'], [3.0, 'o'], [3.8, 'flat'], [8.3, 'soft'], [9.2, 'grit'], [11.7, 'soft'], [12.0, 'o'], [13.1, 'soft'], [15.5, 'soft'], [17.0, 'o'], [17.3, 'laugh'], [18.2, 'smile']];
const HER_M: [number, Mouth][] = [[0, 'flat'], [3.0, 'soft'], [3.8, 'flat'], [8.3, 'smirk'], [11.8, 'o'], [12.9, 'soft'], [13.6, 'smile'], [15.5, 'smile'], [16.2, 'smirk'], [16.6, 'smile'], [17.3, 'laugh'], [18.2, 'smile']];
const LAUGH0 = B.laugh, LAUGH1 = B.laugh + 0.85;
const goldAt = (t: number) => t < B.sunBurst ? 0 : t < B.holdTo ? smooth(t, B.sunBurst + 0.1, B.holdFrom) : 0.9 * (1 - 0.75 * smooth(t, B.holdTo, B.holdTo + 0.8)) * (t < 18.5 ? 1 : 0.5) + 0.0;
const himPose = (t: number, hook: Hook): Pose => {
  const [lx, ly] = himLook(t, hook);
  let mouth = keyAt(HIM_M, t);
  if (t < 3.0) mouth = hook === 'a' ? (t >= 0.7 ? (t >= 1.7 ? 'smile' : 'o') : 'soft') : (t >= 0.6 ? (t >= 1.2 ? (t >= 2.4 ? 'soft' : 'o') : 'grit') : 'soft');
  let sq = 1 + 0.014 * Math.sin(t * 2.3), bob = 0, tilt = Math.sin(t * 0.9) * 0.9, sweat = 0, flush = 0.12;
  if (hook === 'b' && t < 3.2) { const fl = pulse(t, 0.6, 1.05); sq += 0.05 * fl; bob -= 14 * fl; sweat = smooth(t, 0.75, 1.05) * (1 - smooth(t, 2.6, 3.0)) * 0.95; flush = 0.7 * smooth(t, 0.7, 1.2); }
  if (hook === 'a' && t < 3.2) flush = 0.5 * smooth(t, 0.9, 1.8);
  if (t >= 3.2) flush = 0.35 * smooth(t, 3.2, 3.6) + 0.35 * smooth(t, 16.9, 17.3);
  const L = t >= LAUGH0 && t < LAUGH1;
  if (L) { bob = -Math.abs(Math.sin(t * 22)) * 10; tilt = Math.sin(t * 22) * 3; }
  const brow = 0.1 + (hook === 'b' ? 0.8 * pulse(t, 0.6, 1.5) : 0.6 * pulse(t, 0.7, 1.8)) * (t < 3 ? 1 : 0) + 0.4 * pulse(t, 3.0, 3.7) + 0.6 * pulse(t, 11.9, 14.4) + 0.8 * pulse(t, 16.9, 17.5);
  const lit = himPhoneState(t, hook).lit;
  return {look: [lx, ly], brow, mouth, blink: L ? 0 : blinkAt(t, 0.4), flush, sweat, tilt, bob, sq, gold: goldAt(t), glow: lit};
};
const herPose = (t: number, hook: Hook): Pose => {
  const [lx, ly] = herLook(t, hook);
  let mouth = keyAt(HER_M, t);
  if (t < 3.0) mouth = hook === 'a' ? (t >= 0.7 ? (t >= 1.3 ? 'smirk' : 'o') : 'flat') : (t >= 0.9 ? 'smirk' : 'o');
  const L = t >= LAUGH0 + 0.1 && t < LAUGH1;
  let bob = 0, tilt = Math.sin(t * 0.8 + 2) * 0.9;
  if (L) { bob = -Math.abs(Math.sin(t * 21 + 1)) * 10; tilt = Math.sin(t * 21 + 1) * 3; }
  const brow = 0.1 + (hook === 'b' ? 0.9 * pulse(t, 0.0, 1.2) : 0.5 * pulse(t, 0.7, 1.8)) * (t < 3 ? 1 : 0) + 0.4 * pulse(t, 3.0, 3.7) + 0.5 * pulse(t, 11.9, 13.6) + 0.3 * pulse(t, 16.2, 16.8);
  const lit = herPhoneState(t, hook).lit;
  return {look: [lx, ly], brow, mouth, blink: L ? 0 : blinkAt(t, 1.9), flush: 0, sweat: 0, tilt, bob, sq: 1 + 0.014 * Math.sin(t * 2 + 1.3), gold: goldAt(t), glow: lit};
};

// ------------------------------------------------------------------------------------------ phones
const swipeOf = (ticks: number[], t: number, until: number) => {
  let idx = -1;
  for (let i = 0; i < ticks.length; i++) if (ticks[i] <= t && ticks[i] < until) idx = i;
  if (idx < 0) return {p: 0, dir: 1};
  const p = (t - ticks[idx]) / 0.26;
  return {p: p > 1 ? 0 : clamp(p), dir: idx % 2 ? -1 : 1};
};
const himPhoneState = (t: number, hook: Hook) => {
  const sw = swipeOf([-0.05, 0.22, 0.5, 0.78], t, hook === 'a' ? 0.7 : 0.6);
  let x = 410, y = 1075, rot = 10, lit = 1, glowK = 1;
  if (hook === 'b' && t > 0.6) { const k = smooth(t, 0.6, 0.95); x = lerp(410, 330, k); y = lerp(1075, 1190, k); rot = lerp(10, 50, k); lit = lerp(1, 0.5, k); }
  if (hook === 'a') glowK = 1 + 0.2 * pulse(t, 0.7, 2.2);
  if (t >= B.noSignal) lit *= 1 - smooth(t, B.noSignal, B.noSignal + 0.25);
  const pk = smooth(t, B.pocket, B.pocket + 0.6);
  return {x: lerp(x, 215, pk), y: y + 420 * pk, rot: lerp(rot, 20, pk), lit: t < 3.6 || t > 7 ? lit : 0, p: sw.p, dir: sw.dir, pk, glowK, show: !(t > B.pocket + 0.62 && t < 100)};
};
const herPhoneState = (t: number, hook: Hook) => {
  const sw = swipeOf([-0.05, 0.22, 0.5, 0.78], t, hook === 'a' ? 0.7 : 0.3);
  let lit = 1;
  const glowK = hook === 'a' ? 1 + 0.2 * pulse(t, 0.8, 2.4) : 1;
  if (t >= B.noSignal) lit *= 1 - smooth(t, B.noSignal, B.noSignal + 0.25);
  const pk = smooth(t, B.pocket + 0.2, B.pocket + 0.8);
  return {x: lerp(670, 865, pk), y: 1075 + 420 * pk, rot: lerp(-10, -20, pk), lit: t < 3.6 || t > 7 ? lit : 0, p: sw.p, dir: sw.dir, pk, glowK, show: !(t > B.pocket + 0.82)};
};

// ------------------------------------------------------------------------------------------ camera
const bumpAt = (t: number) => { let b = 0; for (const tp of PY) { const dt = t - tp; if (dt >= 0 && dt < 0.5) b += 9 * Math.exp(-dt * 9) * Math.cos(dt * 40); } return b; };
const camW = (t: number): Cam => {
  const hold = 0;
  const z = 1 + 0.03 * smooth(t, 0, 3.6) + 0.025 * smooth(t, 8.2, 12) + 0.07 * hold - 0.02 * smooth(t, 15.4, 17.8);
  return {x: 540 + Math.sin(t * 0.5) * 8, y: 960 - 140 * hold + bumpAt(t) * -1 + Math.sin(t * 0.37) * 6, z};
};

const ReachArm: React.FC<{who: 'him' | 'her'; k: number; tip: {x: number; y: number}}> = ({who, k, tip}) => {
  const him = who === 'him', d = him ? 1 : -1;
  const S = {x: (him ? HIM_X : HER_X) + d * 140 * PSC, y: HEAD_Y + 235 * PSC};
  const rest = {x: S.x - d * 30, y: 1500};
  const T = {x: lerp(rest.x, tip.x, smooth(k, 0, 1)), y: lerp(rest.y, tip.y, smooth(k, 0, 1))};
  const H = {x: T.x - d * 30, y: T.y + 80};
  const E = {x: (S.x + H.x) / 2 - d * 50, y: Math.max(S.y, (S.y + H.y) / 2) + 40};
  const skin = him ? C.skinHim : C.skinHer;
  return <g>
    <path d={`M ${S.x} ${S.y} Q ${E.x} ${E.y} ${H.x} ${H.y}`} fill="none" stroke={C.ink} strokeWidth={142} strokeLinecap="round" opacity={0.35} />
    <path d={`M ${S.x} ${S.y} Q ${E.x} ${E.y} ${H.x} ${H.y}`} fill="none" stroke={him ? C.marigold : C.pine} strokeWidth={128} strokeLinecap="round" />
    <circle cx={H.x} cy={H.y} r={66} fill={him ? C.hat : C.snow} />
    <circle cx={H.x} cy={H.y - 18} r={54} fill={skin} />
    <path d={`M ${H.x} ${H.y - 20} L ${T.x} ${T.y}`} stroke={skin} strokeWidth={44} strokeLinecap="round" />
  </g>;
};

// ------------------------------------------------------------------------------------------ wide cabin shot
const WS = 1.0, WX0 = 190, WY0 = 225;
const Wall: React.FC = () => <g>
  <rect x={-200} y={-200} width={1480} height={2400} fill="url(#wallG)" />
  <rect x={-200} y={-200} width={1480} height={430} fill="#F4977D" opacity={0.55} />
  <rect x={-200} y={1240} width={1480} height={800} fill="#F5A58C" opacity={0.35} />
  {[70, 1010].map((x) => <rect key={x} x={x} y={260} width={14} height={1000} fill={C.snow} opacity={0.14} />)}
</g>;

const Tag: React.FC<{x: number; y: number; k: number}> = ({x, y, k}) => k <= 0.01 ? null : <g transform={`translate(${x} ${y}) scale(${0.8 + 0.2 * k})`} opacity={k}>
  <rect x={-52} y={-34} width={128} height={72} rx={36} fill={C.ink} opacity={0.3} transform="translate(5 8)" />
  <rect x={-56} y={-38} width={128} height={72} rx={36} fill={C.snow} />
  <path d="M -56 -6 L -104 20 L -56 22 Z" fill={C.snow} />
  <text x={10} y={14} textAnchor="middle" fontFamily={FONT_PLATE_SAFE} fontWeight={800} fontSize={46} fill={C.ink}>me</text>
</g>;
const Bang: React.FC<{x: number; y: number; k: number; size: number; fade: number}> = ({x, y, k, size, fade}) => {
  if (k <= 0) return null;
  const sp = 1 + Math.sin(k * Math.PI * 1.5) * Math.exp(-k * 4) * 0.45;
  const pts = Array.from({length: 16}, (_, i) => { const a = (i / 16) * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 0.58 : 1; return `${Math.cos(a) * r * size},${Math.sin(a) * r * size}`; }).join(' ');
  return <g transform={`translate(${x} ${y}) scale(${sp}) rotate(8)`} opacity={fade}><polygon points={pts} fill={C.ink} transform="translate(5 8)" opacity={0.3} /><polygon points={pts} fill={C.gold} />
    <text y={size * 0.44} textAnchor="middle" fontFamily={FONT_POSTER} fontSize={size * 1.2} fill={C.ink}>!</text></g>;
};

const Wide: React.FC<{t: number; hook: Hook}> = ({t, hook}) => {
  const cam = camW(t);
  const him = himPose(t, hook), her = herPose(t, hook);
  const hp = himPhoneState(t, hook), rp = herPhoneState(t, hook);
  const items = itemsFor(hook);
  const sun = smooth(t, B.sunBurst - 0.05, B.sunBurst + 0.8);
  // the whole window clears under his sleeve, then is breathed over again
  const sweep = smooth(t, B.portholeStart, B.portholeStart + 0.7);
  const aHole = 1 - smooth(t, B.holdTo, B.holdTo + 0.5);
  const hw = WIN_W * sweep * aHole;
  const gold = goldAt(t);
  const fHim = fingerFor(items, t, 'him'), fHer = fingerFor(items, t, 'her');
  const toS = (p: {x: number; y: number}) => ({x: WX0 + p.x * WS, y: WY0 + p.y * WS});
  const armK = smooth(t, B.portholeStart - 0.2, B.portholeStart) * (1 - smooth(t, B.sunCut - 0.2, B.sunCut));
  const hand = {x: WX0 + hw + 20 - (1 - armK) * 250, y: WY0 + 470 + Math.sin(t * 17) * 280 * sweep + (1 - armK) * 500};
  const puff = (t0: number) => pulse(t, t0, t0 + 0.9);
  const fogK = 1;
  void fogK;
  const tip = (p: number) => p;
  void tip;
  return <g>
    <g transform={planeT(cam, 0.45)}><Wall /></g>
    <g transform={planeT(cam, 0.65)}>
      <g transform={`translate(${WX0} ${WY0}) scale(${WS})`}>
        <WindowFrame num />
        <g clipPath="url(#winClip)"><Valley t={t} sun={sun} pylons={PY} /></g>
        <GlassPanel id="gw" w={WIN_W} h={WIN_H} rx={30}
          holes={hw > 1 ? <rect x={-10} y={-10} width={hw + 10} height={WIN_H + 20} /> : null}
          overlay={<g><clipPath id="ovw"><rect x={hw} y={0} width={WIN_W - hw + 10} height={WIN_H} /></clipPath><g clipPath="url(#ovw)">{items.map((it, i) => <ItemView key={i} it={it} t={t} mode="ink" />)}</g></g>}
          render={(mode) => <>{items.map((it, i) => <ItemView key={i} it={it} t={t} mode={mode} />)}</>} />
        {[puff(RE1 - 0.2), puff(B.holdTo - 0.1), puff(RE2 - 0.1)].map((k, i) => k > 0.02 ? <circle key={i} cx={350} cy={620} r={330} fill="url(#phoneGlow)" opacity={k * 0.8} /> : null)}
      </g>
    </g>
    <g transform={planeT(cam, 0.8)}>
      {[0, 1].map((i) => <g key={i} transform={`translate(${1000 + i * 40} 1300) rotate(${3 - i * 4})`}>
        <path d="M -14 -1000 Q -14 -1030 0 -1050 Q 14 -1030 14 -1000 L 14 0 L -14 0 Z" fill={i ? C.snow : C.pine} />
        <rect x={-14} y={-860} width={28} height={50} fill={C.red} />
      </g>)}
    </g>
    <g transform={planeT(cam, 0.9)}>
      {[{p: hp}, {p: rp}].map(({p}, i) => p.show && p.lit > 0.02 ? <ellipse key={i} cx={p.x} cy={p.y - 10} rx={330 * p.glowK} ry={340 * p.glowK} fill="url(#phoneGlow)" opacity={Math.min(0.9, p.lit * 0.95)} /> : null)}
      {armK > 0.01 && <g>
        <path d={`M 540 1560 Q ${(540 + hand.x) / 2} ${(1560 + hand.y) / 2 + 200} ${hand.x} ${hand.y}`} fill="none" stroke={C.ink} strokeWidth={150} strokeLinecap="round" opacity={0.25 * armK} />
        <path d={`M 540 1560 Q ${(540 + hand.x) / 2} ${(1560 + hand.y) / 2 + 200} ${hand.x} ${hand.y}`} fill="none" stroke={C.marigold} strokeWidth={130} strokeLinecap="round" opacity={armK} />
        <circle cx={hand.x} cy={hand.y} r={76} fill={C.hat} opacity={armK} /><circle cx={hand.x} cy={hand.y - 6} r={58} fill={C.hatLite} opacity={armK} />
      </g>}
    </g>
    <g transform={planeT(cam, 1.0)}>
      <Person who="him" x={HIM_X} y={HEAD_Y} pose={him} sc={PSC} />
      <Person who="her" x={HER_X} y={HEAD_Y} pose={her} sc={PSC} />
      {(() => {
        const hx = lerp(hp.x - 10, 215, hp.pk), hy = lerp(hp.y + 110, 1480, hp.pk);
        const rx2 = lerp(rp.x + 10, 865, rp.pk), ry2 = lerp(rp.y + 110, 1480, rp.pk);
        return <g>
          <Arm who="him" px={HIM_X} py={HEAD_Y} hx={hx} hy={hy} sc={PSC} hand={1 - smooth(hp.pk, 0.7, 1)} />
          <Arm who="her" px={HER_X} py={HEAD_Y} hx={rx2} hy={ry2} sc={PSC} hand={1 - smooth(rp.pk, 0.7, 1)} />
        </g>;
      })()}
      {hp.show && <Phone halo={false} who="him" x={hp.x} y={hp.y} rot={hp.rot} lit={hp.lit} p={hp.p} dir={hp.dir} s={0.95} thumb={hp.pk < 0.1} glowK={hp.glowK} />}
      {rp.show && <Phone halo={false} who="her" x={rp.x} y={rp.y} rot={rp.rot} lit={rp.lit} p={rp.p} dir={rp.dir} s={0.95} thumb={rp.pk < 0.1} glowK={rp.glowK} />}
      <NoSignal x={hp.x} y={hp.y} k={wp(t, B.iconPop, B.iconPop + 0.5) * (1 - smooth(t, B.wipe1, B.wipe1 + 0.2))} />
      <NoSignal x={rp.x} y={rp.y} k={wp(t, B.iconPop + 0.1, B.iconPop + 0.6) * (1 - smooth(t, B.wipe1, B.wipe1 + 0.2))} />
    </g>
    <g transform={planeT(cam, 1.0)}>
      {fHim && armK < 0.01 && <ReachArm who="him" k={fHim.k} tip={toS(fHim)} />}
      {fHer && <ReachArm who="her" k={fHer.k} tip={toS(fHer)} />}
    </g>
    {t < 3.0 && <g>
      <Tag x={470} y={650} k={1 - smooth(t, 2.7, 3.0)} />
      {hook === 'a' ? <Bang x={400} y={580} k={wp(t, 0.7, 1.5)} size={46} fade={1 - smooth(t, 2.0, 2.4)} /> : <Bang x={790} y={560} k={1} size={92} fade={1 - smooth(t, 1.9, 2.3)} />}
    </g>}
    {gold > 0.01 && <g style={{mixBlendMode: 'screen'}}><ellipse cx={540} cy={760} rx={780} ry={980} fill="url(#goldLight)" opacity={gold * 0.5} /></g>}
  </g>;
};

// ------------------------------------------------------------------------------------------ full-frame sunrise (payoff)
const Back: React.FC<{who: 'him' | 'her'; x: number; y: number}> = ({who, x, y}) => {
  const him = who === 'him', d = him ? 1 : -1;
  const rim = '#FFF0B0';
  return <g transform={`translate(${x} ${y})`}>
    <ellipse cx={0} cy={500} rx={380} ry={50} fill="url(#softShadow)" opacity={0} />
    {him ? <g>
      <path d="M -330 600 L -320 150 Q -290 -10 -140 -30 L 140 -30 Q 290 -10 320 150 L 330 600 Z" fill={C.marigold} />
      {[110, 220, 330].map((yy) => <path key={yy} d={`M -320 ${yy} Q 0 ${yy + 26} 320 ${yy}`} fill="none" stroke={C.marigoldDeep} strokeWidth={8} opacity={0.8} />)}
      <path d="M -150 -40 Q 0 40 150 -40 L 150 -120 L -150 -120 Z" fill={C.marigoldDeep} />
      <path d="M -314 160 Q -290 10 -140 -20" fill="none" stroke={rim} strokeWidth={16} strokeLinecap="round" opacity={0.85} />
      <rect x={-60} y={-190} width={120} height={110} fill={C.skinHimD} />
      <ellipse cx={0} cy={-200} rx={160} ry={165} fill={C.skinHimD} />
      <ellipse cx={d * 140} cy={-170} rx={24} ry={46} fill={C.skinHim} />
      <path d="M -164 -150 C -170 -390 -80 -420 0 -420 C 80 -420 170 -390 164 -150 Q 100 -120 0 -120 Q -100 -120 -164 -150 Z" fill={C.hat} />
      <rect x={-170} y={-270} width={340} height={110} rx={34} fill={C.hatLite} />
      {Array.from({length: 13}, (_, i) => <line key={i} x1={-150 + i * 25} y1={-258} x2={-150 + i * 25} y2={-172} stroke={C.hat} strokeWidth={6} opacity={0.6} />)}
      <circle cx={0} cy={-448} r={58} fill={C.snow} />
      <path d="M -150 -380 Q -100 -420 0 -420 Q 100 -420 150 -380" fill="none" stroke={rim} strokeWidth={14} strokeLinecap="round" />
      <circle cx={0} cy={-448} r={58} fill="none" stroke={rim} strokeWidth={8} opacity={0.8} />
    </g> : <g>
      <path d="M -300 600 L -310 150 Q -280 -10 -130 -30 L 130 -30 Q 280 -10 310 150 L 300 600 Z" fill={C.pine} />
      <path d="M -310 250 Q 0 280 310 250 L 310 285 Q 0 315 -310 285 Z" fill={C.red} />
      <path d="M 314 160 Q 290 10 140 -20" fill="none" stroke={rim} strokeWidth={16} strokeLinecap="round" opacity={0.85} />
      <path d="M -150 -40 Q 0 40 150 -40 L 150 -120 L -150 -120 Z" fill={C.pineLite} />
      <ellipse cx={d * 150} cy={-170} rx={22} ry={52} fill={C.skinHer} />
      <path d="M -176 -190 Q -190 -390 0 -400 Q 190 -390 176 -190 L 182 -20 Q 150 20 96 0 L -96 0 Q -150 20 -182 -20 Z" fill={C.hair} />
      <path d="M -170 -250 Q 0 -300 170 -250" fill="none" stroke={C.snow} strokeWidth={44} strokeLinecap="round" />
      <path d="M -172 -300 Q 0 -350 172 -300" fill="none" stroke={C.ink} strokeWidth={22} strokeLinecap="round" />
      <path d="M -170 -330 Q -120 -396 0 -400 Q 120 -396 170 -330" fill="none" stroke={rim} strokeWidth={14} strokeLinecap="round" />
      <path d="M -176 -190 Q -190 -60 -180 -20" fill="none" stroke={rim} strokeWidth={10} strokeLinecap="round" opacity={0.7} />
    </g>}
  </g>;
};
const Sunrise: React.FC<{t: number}> = ({t}) => {
  const a = t - B.sunCut;
  const z = 1 + 0.05 * wp(t, B.sunCut, B.holdTo);
  const sunP = 0.55 + 0.45 * smooth(t, B.sunCut, B.sunCut + 0.8);
  const flash = 0.8 * (1 - smooth(a, 0, 0.35));
  const breathe = 1 + 0.012 * Math.sin(t * 2);
  return <g>
    <g transform={`translate(540 700) scale(${z}) translate(-540 -700)`}>
      <g transform="translate(-177 0) scale(2.05)"><Valley t={t} sun={sunP} pylons={[...PY, 13.9]} /></g>
      <ellipse cx={540} cy={488} rx={620} ry={620} fill="url(#sunGlow)" opacity={0.7} style={{mixBlendMode: 'screen'}} />
    </g>
    <path d="M 0 0 H 1080 V 1920 H 0 Z M 40 120 Q 40 60 100 60 H 980 Q 1040 60 1040 120 V 1800 Q 1040 1860 980 1860 H 100 Q 40 1860 40 1800 Z" fillRule="evenodd" fill={C.snow} opacity={0} />
    <g transform={`translate(0 ${(1 - smooth(a, 0, 0.5)) * 60}) scale(${breathe})`} style={{transformOrigin: '540px 1500px'}}>
      <Back who="him" x={300} y={1500} />
      <Back who="her" x={790} y={1510} />
    </g>
    <ellipse cx={540} cy={1300} rx={700} ry={500} fill="url(#goldLight)" opacity={0.35} style={{mixBlendMode: 'screen'}} />
    <rect x={0} y={0} width={1080} height={1920} fill="#fff" opacity={flash} />
  </g>;
};

// ------------------------------------------------------------------------------------------ whole-frame window insert
const IS = 1.0, IX0 = 540 - 350 * IS, IY0 = 760 - 470 * IS;
const Insert: React.FC<{t: number; hook: Hook}> = ({t, hook}) => {
  const items = itemsFor(hook);
  const sun = smooth(t, B.sunBurst - 0.05, B.sunBurst + 0.8);
  const z = 1 + 0.03 * smooth(t, 3.6, 8) + 0.025 * smooth(t, 18.2, 23);
  const bump = bumpAt(t);
  const re = 1 - smooth(t, RE2, RE2 + 0.4);
  const rad = t < RE2 ? 0 : 0; // porthole is shut again after the second breath
  const fHim = fingerFor(items, t, 'him'), fHer = fingerFor(items, t, 'her');
  const toS = (p: {x: number; y: number}) => ({x: IX0 + p.x * IS, y: IY0 + p.y * IS});
  const puff = (t0: number) => pulse(t, t0, t0 + 0.9);
  const gold = t > 12 ? 0.35 : 0;
  void re; void rad;
  return <g transform={`translate(540 960) scale(${z}) translate(-540 ${-960 + bump})`}>
    <Wall />
    <g transform={`translate(${IX0} ${IY0}) scale(${IS})`}>
      <WindowFrame num />
      <g clipPath="url(#winClip)"><Valley t={t} sun={sun} pylons={PY} /></g>
      <GlassPanel id="gi" w={WIN_W} h={WIN_H} rx={30}
        overlay={<g>{items.map((it, i) => <ItemView key={i} it={it} t={t} mode="ink" />)}</g>}
        render={(mode) => <>{items.map((it, i) => <ItemView key={i} it={it} t={t} mode={mode} />)}</>} />
      {[puff(RE1 - 0.2), puff(RE2 - 0.05), puff(20.55)].map((k, i) => k > 0.02 ? <circle key={i} cx={350} cy={560} r={400} fill="url(#phoneGlow)" opacity={k * 0.85} /> : null)}
    </g>
    {fHim && (() => { const p = toS(fHim); return <FingerHand who="him" x={p.x} y={p.y} k={fHim.k} s={1.0} />; })()}
    {fHer && (() => { const p = toS(fHer); return <FingerHand who="her" x={p.x} y={p.y} k={fHer.k} s={1.0} />; })()}
    {gold > 0 && <ellipse cx={540} cy={700} rx={700} ry={900} fill="url(#goldLight)" opacity={gold * 0.5} />}
  </g>;
};

// ------------------------------------------------------------------------------------------ close shot: she smiles, flushed, really looks at him
const Close: React.FC<{t: number}> = ({t}) => {
  const a = t - B.close;
  const k = smooth(a, 0, 0.35);
  const her: Pose = {...calm, look: [lerp(-0.2, -0.85, k), lerp(0.4, 0.05, k)], brow: 0.35 * k, mouth: a > 0.15 ? 'smile' : 'smirk', blink: blinkAt(t, 1.9), flush: 0.85 * k, gold: 0.75, glow: 0, sq: 1 + 0.012 * Math.sin(t * 2)};
  const him: Pose = {...calm, look: [0.85, 0.1], mouth: 'soft', gold: 0.75, flush: 0.5};
  return <g>
    <g transform="translate(-177 0) scale(2.05)"><Valley t={t} sun={1} pylons={PY} /></g>
    <rect x={0} y={0} width={1080} height={1920} fill="#FFB48A" opacity={0.18} />
    <g style={{mixBlendMode: 'screen'}}><ellipse cx={540} cy={800} rx={800} ry={900} fill="url(#goldLight)" opacity={0.6} /></g>
    <Person who="him" x={-120} y={1250} pose={him} sc={1.7} />
    <Person who="her" x={640} y={950} pose={her} sc={2.1} />
  </g>;
};

// ------------------------------------------------------------------------------------------ vote
const VPX = 150, VPY = 452, VPW = 780, VPH = 470, VGX = 390, VGY = 250, VCELL = 130;
const vc = (i: number) => cellC(VGX, VGY, VCELL, i);
const vmk = (k: 'X' | 'O', cell: number, a: number): Item => ({k, cx: vc(cell).x, cy: vc(cell).y, a, b: a + 0.25, who: 'her'});
const VA = B.vote - 3;
const VITEMS: Item[] = [
  {k: 'grid', cx: VGX, cy: VGY, cell: VCELL, a: VA, b: VA + 0.2, who: 'her'},
  vmk('X', 0, VA + 0.2), vmk('O', 3, VA + 0.3), vmk('X', 1, VA + 0.4), vmk('O', 4, VA + 0.5),
];
const Vote: React.FC<{t: number}> = ({t}) => {
  const bump = bumpAt(t);
  const on = smooth(t, B.cardA - 0.1, B.cardA + 0.3);
  // alternate previews: A (X wins the top row) then B (a miss, she takes the middle row), 1.2 s each
  const ph = (t - (B.cardA - 0.1)) / 1.2;
  const idx = Math.floor(ph), fr = ph - idx;
  const pk = ph < 0 ? 0 : Math.pow(Math.sin(Math.min(1, fr * 1.15) * Math.PI), 0.6);
  const aOn = ph >= 0 && idx % 2 === 0, bOn = ph >= 0 && idx % 2 === 1;
  const grow = (a: number, b: number) => clamp((fr - a) / (b - a));
  const tq = smooth(t, B.vote + 0.05, B.vote + 0.4);
  const c = (cell: number) => ({x: vc(cell).x, y: vc(cell).y});
  return <g transform={`translate(0 ${bump})`}>
    <g transform="translate(-177 0) scale(2.05)"><Valley t={t} sun={1} pylons={PY} /></g>
    <g opacity={tq} transform={`translate(0 ${(1 - tq) * -30})`}>
      <rect x={52} y={312} width={984} height={144} rx={44} fill={C.ink} opacity={0.3} />
      <rect x={40} y={298} width={984} height={144} rx={44} fill={C.snow} />
      <text x={532} y={366} textAnchor="middle" fontFamily={FONT_POSTER} fontSize={66} fill={C.ink}>{spec.vote.question[0]}</text>
      <text x={532} y={430} textAnchor="middle" fontFamily={FONT_POSTER} fontSize={58} fill={C.red}>{spec.vote.question[1]}</text>
    </g>
    <g transform={`translate(${VPX} ${VPY})`}>
      <rect x={-18} y={-12} width={VPW + 36} height={VPH + 46} rx={48} fill={C.ink} opacity={0.26} transform="translate(0 14)" />
      <rect x={-18} y={-18} width={VPW + 36} height={VPH + 36} rx={48} fill={C.snow} />
      <GlassPanel id="gv" w={VPW} h={VPH} rx={34}
        overlay={<g>{VITEMS.map((it, i) => <ItemView key={i} it={it} t={t} mode="ink" />)}</g>}
        render={(mode) => <>{VITEMS.map((it, i) => <ItemView key={i} it={it} t={t} mode={mode} />)}</>} />
      {on > 0.01 && <g opacity={on}>
        {/* A preview: ghost X top-right + ghost strike through the top row */}
        {aOn && <g opacity={pk}>
          <InkMark k="X" cx={c(2).x} cy={c(2).y} p={grow(0.1, 0.4)} op={0.6} />
          <InkMark k="line" line={[c(0).x - 60, c(0).y, c(2).x + 60, c(2).y]} p={grow(0.35, 0.7)} op={0.6} strike={C.marigold} />
        </g>}
        {/* B preview: ghost X bottom-right, then a ghost O + strike on the middle row */}
        {bOn && <g opacity={pk}>
          <InkMark k="X" cx={c(8).x} cy={c(8).y} p={grow(0.1, 0.35)} op={0.75} />
          <InkMark k="O" cx={c(5).x} cy={c(5).y} p={grow(0.35, 0.6)} op={0.8} />
          <InkMark k="line" line={[c(3).x - 62, c(3).y, c(5).x + 62, c(5).y]} p={grow(0.55, 0.85)} op={1} />
        </g>}
        {[{cell: 2, l: 'A', col: C.red, act: aOn}, {cell: 8, l: 'B', col: C.ink, act: bOn}].map((q) => <g key={q.l} transform={`translate(${c(q.cell).x} ${c(q.cell).y})`}>
          <rect x={-62} y={-62} width={124} height={124} rx={22} fill="none" stroke={q.col} strokeWidth={q.act ? 6 + 6 * pk : 5} opacity={q.act ? 1 : 0.55} />
          <g transform={`translate(52 -52) scale(${q.act ? 1 + 0.14 * pk : 1})`}><circle r={32} fill={q.col} /><text y={22} textAnchor="middle" fontFamily={FONT_POSTER} fontSize={58} fill={C.snow}>{q.l}</text></g>
        </g>)}
      </g>}
    </g>
    <VoteCard letter="A" l1={spec.choices.A.l1} l2={spec.choices.A.l2} x={285} y={1050} age={t - B.cardA} />
    <VoteCard letter="B" l1={spec.choices.B.l1} l2={spec.choices.B.l2} x={795} y={1050} age={t - B.cardB} />
    {t >= B.comment && (() => { const k = smooth(t, B.comment, B.comment + 0.3); return <g opacity={k} transform={`translate(540 ${1206 + (1 - k) * 30})`}>
      <rect x={-262} y={-52} width={532} height={86} rx={43} fill={C.ink} opacity={0.3} />
      <rect x={-270} y={-60} width={532} height={86} rx={43} fill={C.ink} />
      <text x={-4} y={4} textAnchor="middle" fontFamily={FONT_POSTER} fontSize={52} fill={C.snow}>{spec.vote.comment}</text>
    </g>; })()}
  </g>;
};

// ------------------------------------------------------------------------------------------ end card
const End: React.FC<{t: number}> = ({t}) => {
  const a = t - B.endcard;
  const pop = (a0: number) => { const k = smooth(a, a0, a0 + 0.3); return {k, s: 0.8 + 0.2 * k + Math.sin(wp(a, a0, a0 + 0.5) * Math.PI) * 0.05}; };
  const p1 = pop(0), p2 = pop(0.35), p3 = pop(0.7);
  const sway = Math.sin(t * 1.6) * 5;
  return <g transform={`translate(0 ${bumpAt(t)})`}>
    <g transform="translate(-177 0) scale(2.05)"><Valley t={t} sun={1} pylons={PY} /></g>
    {/* cable and cabin */}
    <path d="M -50 330 Q 540 372 1130 322" fill="none" stroke={C.ink} strokeWidth={7} />
    <g transform={`translate(${540 + sway * 3} 354) rotate(${sway * 0.4})`}>
      <rect x={-5} y={0} width={10} height={52} fill={C.ink} />
      <rect x={-78} y={48} width={156} height={104} rx={26} fill={C.red} />
      <rect x={-60} y={64} width={120} height={50} rx={14} fill={C.ice} />
      <text y={140} textAnchor="middle" fontFamily={FONT_PLATE_SAFE} fontWeight={800} fontSize={28} fill={C.snow}>6</text>
    </g>
    <g opacity={p1.k} transform={`translate(540 640) scale(${p1.s}) rotate(-2)`}>
      <rect x={-440} y={-120} width={880} height={250} rx={64} fill={C.ink} opacity={0.3} transform="translate(10 16)" />
      <rect x={-450} y={-130} width={900} height={250} rx={64} fill={C.red} />
      <rect x={-434} y={-114} width={868} height={218} rx={50} fill="none" stroke={C.snow} strokeWidth={5} opacity={0.6} />
      <text y={64} textAnchor="middle" fontFamily={FONT_POSTER} fontSize={206} fill={C.snow}>{spec.endCard[0]}</text>
    </g>
    <g opacity={p2.k} transform={`translate(540 880) scale(${p2.s}) rotate(1.5)`}>
      <rect x={-300} y={-84} width={600} height={170} rx={50} fill={C.ink} opacity={0.3} transform="translate(8 12)" />
      <rect x={-310} y={-92} width={600} height={170} rx={50} fill={C.snow} />
      <text x={-10} y={38} textAnchor="middle" fontFamily={FONT_POSTER} fontSize={140} fill={C.ink}>{spec.endCard[1]}</text>
    </g>
    <g opacity={p3.k} transform={`translate(540 1090) scale(${p3.s})`}>
      <rect x={-290} y={-80} width={580} height={160} rx={80} fill={C.ink} opacity={0.3} transform="translate(8 12)" />
      <rect x={-300} y={-88} width={580} height={160} rx={80} fill={C.ink} />
      <text x={-10} y={34} textAnchor="middle" fontFamily={FONT_POSTER} fontSize={118} fill={C.gold}>{spec.endCard[2]}</text>
    </g>
  </g>;
};
const FONT_PLATE_SAFE = '"Jost", sans-serif';

// ------------------------------------------------------------------------------------------ shots and wipes
type ShotId = 'W' | 'I' | 'V' | 'E' | 'S' | 'C';
const WIPES: {t0: number; from: ShotId; to: ShotId; rev?: boolean}[] = [
  {t0: B.wipe1, from: 'W', to: 'I'}, {t0: B.wipe2, from: 'I', to: 'W'}, {t0: B.wipe3, from: 'W', to: 'I'}, {t0: B.wipe4, from: 'C', to: 'V'}, {t0: B.wipe5, from: 'V', to: 'E'},
];
const baseShot = (t: number): ShotId => { if (t >= B.close && t < B.wipe4 + WIPE_DUR) return 'C'; if (t >= B.sunCut && t < B.holdTo) return 'S'; let s: ShotId = 'W'; for (const w of WIPES) if (t >= w.t0 + WIPE_DUR) s = w.to; return s; };
const renderShot = (id: ShotId, t: number, hook: Hook): React.ReactNode => id === 'W' ? <Wide t={t} hook={hook} /> : id === 'S' ? <Sunrise t={t} /> : id === 'C' ? <Close t={t} /> : id === 'I' ? <Insert t={t} hook={hook} /> : id === 'V' ? <Vote t={t} /> : <End t={t} />;

const Scene: React.FC<{hook: Hook}> = ({hook}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const w = WIPES.find((x) => t >= x.t0 && t < x.t0 + WIPE_DUR);
  const k = w ? (t - w.t0) / WIPE_DUR : 0;
  const fast = !!w;
  return <>
    <MotionBlurWhen fast={fast} samples={4} shutter={200}>
      <AbsoluteFill>
        <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, background: C.ice}}>
          <Defs />
          <defs><clipPath id="winClip"><rect x={0} y={0} width={WIN_W} height={WIN_H} rx={30} /></clipPath></defs>
          {w ? <>
            {renderShot(w.from, t, hook)}
            <defs><WipeClip id="wipeNew" k={k} rev={w.rev} /></defs>
            <g clipPath="url(#wipeNew)">{renderShot(w.to, t, hook)}</g>
            <SleeveArm k={k} rev={w.rev} />
          </> : renderShot(baseShot(t), t, hook)}
        </svg>
      </AbsoluteFill>
    </MotionBlurWhen>
    <AbsoluteFill>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        {spec.strips.map((s, i) => {
          const isHook = (s as {hook?: boolean}).hook;
          if (isHook && (s as {hookProp?: string}).hookProp !== hook) return null;
          if (t >= s.to || t < s.from) return null;
          return <Strip key={i} text={s.text} y={s.y} age={t - s.from + (isHook ? 1 : 0.02)} out={isHook ? smooth(t, 2.75, 3.0) : smooth(t, s.to - 0.25, s.to)} variant={s.variant as 'red' | 'snow'} />;
        })}
      </svg>
    </AbsoluteFill>
  </>;
};

export const Cabin1: React.FC<{hook?: Hook}> = ({hook = 'a'}) => (
  <AbsoluteFill style={{background: C.ice}}>
    <Audio src={staticFile('audio/cabin-ep1.wav')} volume={0.9} />
    <Scene hook={hook} />
  </AbsoluteFill>
);
void FONT_FOG; void FRAME; void sxUnused;
function sxUnused() { return 0; }
