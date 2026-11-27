import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, lerp, smooth} from '../../lib/motion';
import {MotionBlurWhen} from '../../lib/shots';
import {
  C, Defs, FONT_POSTER, GlassPanel, Item, ItemView, Person, Phone, Pose, SleeveArm, Strip, Valley, WIN_H, WIN_W, WIPE_DUR, WindowFrame, WipeClip, calm, cellC, planeT, wp, Cam, Mouth, NoSignal, FONT_FOG, FONT_PLATE,
} from './world';
import spec from '../../../specs/stories/cabin-ep3.json';

// Cabin Six, part 3 = season finale, standalone. Silent. Stopped gondola, fog writing in the wide shot; take 1 play it cool (fails),
// breath rewind, take 2 admit (works); cable restarts at sunrise; top-station gag; empty cabin with both names; end card.

export const CABIN3_FPS = 60;
export const CABIN3_FRAMES = Math.round(spec.duration * CABIN3_FPS);
export type Hook = 'a' | 'b';
const B = spec.beats;
const PY = spec.pylons;
const R = B.restart, YELP = B.yelp, V0 = 6.0;
const T = spec.texts;
const pulse = (t: number, a: number, b: number) => Math.sin(wp(t, a, b) * Math.PI);
type KF = number[];
const kf = (keys: KF[], t: number): number[] => {
  if (t <= keys[0][0]) return keys[0].slice(1);
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) { const a = keys[i - 1], b = keys[i], k = smooth(t, a[0], b[0]); return a.slice(1).map((v, j) => lerp(v, b[j + 1], k)); }
  }
  return keys[keys.length - 1].slice(1);
};
const keyAt = <T2,>(list: [number, T2][], t: number): T2 => { let v = list[0][1]; for (const [a, b] of list) if (t >= a) v = b; return v; };
const blinkAt = (t: number, seed: number) => { const ph = (t + seed) % 3.9; return ph < 0.14 ? Math.sin((ph / 0.14) * Math.PI) : 0; };
type Pt = {x: number; y: number};
const FONT_PLATE_SAFE = '"Jost", sans-serif';

// the gondola is stopped until the cable restarts: valley time is frozen, then eases back in
const vtOf = (t: number) => { if (t < R) return V0; const x = t - R; return V0 + (x < 1 ? x * x * 0.5 : x - 0.5); };
const swayOf = (t: number) => 0.9 * Math.sin(t * 1.1)
  + (t >= YELP ? 2.8 * Math.exp(-(t - YELP) * 0.9) * Math.sin((t - YELP) * 3.0) * smooth(t, YELP, YELP + 0.08) : 0)
  + (t >= R ? 1.8 * Math.exp(-(t - R) * 1.1) * Math.sin((t - R) * 3.4) : 0);
const sunOf = (t: number) => smooth(t, R, R + 1.1);

// ------------------------------------------------------------------------------------------ glass content (window-local coords 700 x 940)
const GX = 350, GY = 610, CELL = 140;
const cc = (i: number) => cellC(GX, GY, CELL, i);
const SA = 150, SB = 245, SC = 345;
const CLR: [number, number] = [B.clear, B.clear + 0.4];
const RW: [number, number] = [B.erase, B.erase + 0.3];
const mk = (k: 'X' | 'O', cell: number, a: number, who: 'him' | 'her'): Item => ({k, cx: cc(cell).x, cy: cc(cell).y, a, b: a + 0.35, who, out: CLR});
const txt = (lines: [string, number][], x: number, size: number, a: number, dur: number, outAt: number, who: 'him' | 'her'): Item =>
  ({k: 'text', lines: lines.map(([s, y]) => ({s, x, y, size})), a, b: a + dur, out: [outAt, outAt + 0.3], who});
const ITEMS: Item[] = [
  txt([[T.stuck[0], SA], [T.stuck[1], SB]], 350, 84, B.stuck, 0.7, B.stuckOut, 'her'),
  txt([[T.tf[0], SA], [T.tf[1], SB]], 350, 84, B.tf, 0.7, B.tfOut, 'him'),
  {k: 'grid', cx: GX, cy: GY, cell: CELL, a: B.grid1, b: B.grid1 + 0.9, who: 'him', out: RW},
  txt([[T.shake, SA]], 350, 80, B.shake, 0.7, B.shakeOut, 'her'),
  txt([[T.sc[0], SA], [T.sc[1], SB]], 350, 84, B.sc, 0.8, B.scOut, 'him'),
  txt([[T.dl[0], SA], [T.dl[1], SB]], 350, 76, B.dl, 0.9, B.dlOut, 'her'),
  {k: 'grid', cx: GX, cy: GY, cell: CELL, a: B.grid2, b: B.grid2 + 0.9, who: 'her', out: CLR},
  mk('X', 4, B.m1, 'him'), mk('O', 0, B.m2, 'her'), mk('X', 7, B.m3, 'him'), mk('O', 1, B.m4, 'her'), mk('X', 3, B.m5, 'him'),
  // she starts an O on the winning square 2, pulls back, plays elsewhere
  {k: 'O', cx: cc(2).x, cy: cc(2).y, a: B.ghost, b: B.ghost + 0.5, who: 'her', out: [B.ghost + 0.3, B.ghost + 0.5]},
  mk('O', 8, B.m6, 'her'), mk('X', 5, B.m7, 'him'),
  txt([[T.nm, 130]], 350, 96, B.nm, 0.65, B.wipeSt + 0.3, 'him'),
  txt([[T.june, 245]], 350, 110, B.june, 0.5, B.wipeSt + 0.3, 'her'),
  txt([[T.owen, SC + 5]], 350, 110, B.owen, 0.5, B.wipeSt + 0.3, 'him'),
];
// his wobbly scribble-X in take 1
const SCR_A = B.scrib, SCR_B = B.scrib + 0.75;
const wob = (x1: number, y1: number, x2: number, y2: number, n: number, amp: number, ph: number): Pt[] => {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
  return Array.from({length: n + 1}, (_, i) => { const u = i / n, o = amp * (Math.sin(u * 17 + ph) + 0.6 * Math.sin(u * 41 + ph * 2)); return {x: x1 + dx * u + nx * o, y: y1 + dy * u + ny * o}; });
};
const SCR_PTS: Pt[] = [...wob(GX - 42, GY - 36, GX + 50, GY + 40, 22, 9, 0.4), ...wob(GX + 46, GY - 44, GX - 54, GY + 46, 24, 11, 2.1)];
const scrTip = (t: number): Pt => { const p = wp(t, SCR_A, SCR_B), f = p * (SCR_PTS.length - 1), i = Math.min(SCR_PTS.length - 2, Math.floor(f)); return {x: lerp(SCR_PTS[i].x, SCR_PTS[i + 1].x, f - i), y: lerp(SCR_PTS[i].y, SCR_PTS[i + 1].y, f - i)}; };
const Scribble: React.FC<{t: number}> = ({t}) => {
  const p = wp(t, SCR_A, SCR_B);
  if (p <= 0) return null;
  const al = 1 - smooth(t, RW[0], RW[1]);
  const d = SCR_PTS.map((q, i) => `${i === 0 || i === 23 ? 'M' : 'L'} ${q.x.toFixed(1)} ${q.y.toFixed(1)}`).join(' ');
  return <g opacity={al}>{[[C.ink, 28], [C.marigold, 17]].map(([c, w], i) => <path key={i} d={d} pathLength={1} strokeDasharray={`${p} 2`} fill="none" stroke={c as string} strokeWidth={w as number} strokeLinecap="round" strokeLinejoin="round" />)}</g>;
};
// thick strike through his diagonal 2-4-6
type Strike = {a: number; b: number; col: string; who: 'him' | 'her'; out: [number, number]};
const STRIKES: Strike[] = [{a: B.strike, b: B.strike + 0.6, col: C.red, who: 'him', out: CLR}];
const strikeEnds = () => ({x1: cc(3).x - 70, y1: cc(3).y, x2: cc(5).x + 70, y2: cc(5).y});
const StrikeView: React.FC<{s: Strike; t: number}> = ({s, t}) => {
  const p = smooth(t, s.a, s.b);
  if (p <= 0) return null;
  const al = 1 - smooth(t, s.out[0], s.out[1]);
  const e = strikeEnds();
  const x2 = lerp(e.x1, e.x2, p), y2 = lerp(e.y1, e.y2, p);
  return <g opacity={al}>
    <line x1={e.x1} y1={e.y1} x2={x2} y2={y2} stroke={C.marigold} strokeWidth={46} strokeLinecap="butt" opacity={0.3} />
    <line x1={e.x1} y1={e.y1} x2={x2} y2={y2} stroke={C.marigold} strokeWidth={26} strokeLinecap="butt" />
  </g>;
};

type Reach = {who: 'him' | 'her'; a: number; b: number; tip: (t: number) => Pt};
const tipOfItem = (it: Item, t: number): Pt => {
  const p = wp(t, it.a, it.b);
  const lerpPt = (a: Pt, b: Pt, k: number) => ({x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k)});
  if (it.k === 'text') {
    const total = it.lines.reduce((n, l) => n + l.s.length, 0);
    let acc = 0;
    for (const l of it.lines) {
      const share = l.s.length / total, w = l.s.length * l.size * 0.5;
      if (p <= acc + share + 1e-6) { const lp = clamp((p - acc) / share); return {x: l.x - w / 2 + w * lp, y: l.y - l.size * 0.28}; }
      acc += share;
    }
    const l = it.lines[it.lines.length - 1]; return {x: l.x + (l.s.length * l.size * 0.5) / 2, y: l.y - l.size * 0.28};
  }
  if (it.k === 'X') return p < 0.5 ? lerpPt({x: it.cx - 36, y: it.cy - 36}, {x: it.cx + 36, y: it.cy + 36}, p * 2) : lerpPt({x: it.cx + 36, y: it.cy - 36}, {x: it.cx - 36, y: it.cy + 36}, (p - 0.5) * 2);
  if (it.k === 'O') return {x: it.cx + Math.sin(p * Math.PI * 2) * 38, y: it.cy - Math.cos(p * Math.PI * 2) * 38};
  if (it.k === 'grid') { const s = it.cell, h = (s * 3) / 2 + 10, q = p * 4, seg = Math.min(3, Math.floor(q)), f = q - seg;
    const L = [[it.cx - s / 2, it.cy - h, it.cx - s / 2, it.cy + h], [it.cx + s / 2, it.cy - h, it.cx + s / 2, it.cy + h], [it.cx - h, it.cy - s / 2, it.cx + h, it.cy - s / 2], [it.cx - h, it.cy + s / 2, it.cx + h, it.cy + s / 2]][seg];
    return {x: lerp(L[0], L[2], f), y: lerp(L[1], L[3], f)}; }
  return {x: (it as {cx: number}).cx, y: (it as {cy: number}).cy};
};
const REACHES: Reach[] = [
  ...ITEMS.map((it) => ({who: it.who, a: it.a - 0.38, b: it.b + 0.03, tip: (t: number) => tipOfItem(it, Math.min(t, it.b))})),
  {who: 'him' as const, a: SCR_A - 0.38, b: SCR_B + 0.03, tip: (t: number) => { const q = scrTip(Math.min(t, SCR_B)); return {x: q.x + Math.sin(t * 50) * 4, y: q.y + Math.cos(t * 43) * 4}; }},
];
const reachFor = (t: number, who: 'him' | 'her') => {
  let best: {k: number; x: number; y: number} | null = null;
  for (const r of REACHES) {
    if (r.who !== who) continue;
    const k = smooth(t, r.a, r.a + 0.33) * (1 - smooth(t, r.b, r.b + 0.22));
    if (k > 0.01 && (!best || k >= best.k - 0.001)) { const tp = r.tip(t); best = {k, x: tp.x, y: tp.y}; }
  }
  return best;
};

// ------------------------------------------------------------------------------------------ people
const HIM_X = 100, HER_X = 980, HEAD_Y = 900, PSC = 1.35;
const WX0 = 190, WY0 = 225;
const himLook = (t: number, hook: Hook): number[] => {
  if (t < 3.0) return kf(hook === 'a'
    ? [[0, 0.1, 0.85], [1.0, 0.1, 0.85], [1.25, 0.85, 0.1], [1.9, 0.85, 0.1], [2.2, 0.1, 0.8], [3.0, 0.2, 0.7]]
    : [[0, 0.1, 0.85], [0.7, 0.1, 0.85], [0.85, 0.9, 0.1], [1.8, 0.9, 0.1], [2.2, 0.8, 0.2], [3.0, 0.2, 0.7]], t);
  return kf([[3.0, 0.2, 0.7], [4.0, 0.7, 0.2], [7.0, 0.7, 0.2], [7.3, 0.2, 0.4], [9.0, 0.1, 0.7], [YELP, 0.0, 1.0], [10.9, 0.6, 0.3], [13.0, 0.5, 0.3], [14.3, 0.3, 0.3], [17.0, 0.3, 0.5], [17.8, 0.85, 0.1],
    [19.5, 0.3, 0.35], [22.4, 0.3, 0.35], [23.4, 0.85, 0.1], [24.4, 0.8, 0.1], [26.0, 0.3, 0.4], [26.8, 0.85, 0.1], [R, 0.85, 0.1], [R + 0.8, 0.2, -0.5], [29.4, 0.2, -0.5]], t);
};
const herLook = (t: number, hook: Hook): number[] => {
  if (t < 3.0) return kf(hook === 'a'
    ? [[0, -0.1, 0.85], [1.5, -0.1, 0.85], [1.75, -0.85, 0.1], [2.4, -0.85, 0.1], [3.0, -0.8, 0.2]]
    : [[0, -0.1, 0.85], [0.3, -0.1, 0.85], [0.45, -0.7, 0.85], [1.5, -0.8, 0.85], [1.9, -0.85, 0.1], [2.4, -0.8, 0.2], [3.0, -0.8, 0.2]], t);
  return kf([[3.0, -0.8, 0.2], [4.0, -0.4, 0.3], [4.8, -0.8, 0.2], [7.1, -0.8, 0.2], [8.0, -0.85, 0.3], [9.8, -0.85, 0.3], [10.3, -0.9, 0.1], [11.4, -0.8, 0.2], [13.0, -0.8, 0.2], [14.4, -0.8, 0.2], [17.6, -0.85, 0.15],
    [18.6, -0.4, 0.3], [21.0, -0.4, 0.35], [21.7, -0.4, 0.5], [22.05, -0.9, 0.1], [22.5, -0.4, 0.35], [23.4, -0.85, 0.1], [26.0, -0.4, 0.3], [26.7, -0.85, 0.1], [R, -0.85, 0.1], [R + 0.8, -0.2, -0.5], [29.4, -0.2, -0.5]], t);
};
const HIM_M: [number, Mouth][] = [[3.0, 'grit'], [4.7, 'soft'], [7.2, 'smile'], [8.0, 'grit'], [9.9, 'o'], [10.5, 'grit'], [13.2, 'o'], [14.3, 'soft'], [15.2, 'grit'], [17.8, 'soft'], [19.8, 'soft'], [23.3, 'smile'], [24.7, 'soft'],
  [28.0, 'smile'], [R, 'o'], [R + 0.7, 'smile']];
const HER_M: [number, Mouth][] = [[3.0, 'flat'], [4.7, 'soft'], [7.9, 'flat'], [10.3, 'smirk'], [13.0, 'flat'], [15.2, 'soft'], [18.7, 'soft'], [21.3, 'soft'], [21.9, 'smirk'], [22.6, 'smile'], [R, 'smile']];
const himPhone = (t: number, hook: Hook) => {
  const sw = swipeOf([-0.05, 0.22, 0.5, 0.78, 1.06, 1.34, 1.62, 1.9, 2.18], t, hook === 'a' ? 2.3 : 0.65);
  const pk = hook === 'a' ? smooth(t, 2.5, 3.0) : smooth(t, 0.8, 1.3);
  const x = hook === 'b' ? lerp(350, 270, smooth(t, 0.7, 1.0)) : 350;
  return {x: lerp(x, 270, pk), y: 1075 + 420 * pk, rot: lerp(10, 20, pk) + (hook === 'b' ? 40 * smooth(t, 0.7, 1.0) * (1 - pk) : 0), lit: t > 3 ? 0 : 1 - 0.4 * pk, p: sw.p, dir: sw.dir, pk, show: pk < 0.98 && t < 3};
};
const herPhone = (t: number, hook: Hook) => {
  const sw = swipeOf([-0.05, 0.22, 0.5, 0.78, 1.06, 1.34, 1.62, 1.9, 2.18], t, hook === 'a' ? 2.3 : 0.4);
  const pk = hook === 'a' ? smooth(t, 2.55, 3.05) : smooth(t, 1.7, 2.3);
  return {x: lerp(730, 810, pk), y: 1075 + 420 * pk, rot: lerp(-10, -20, pk), lit: t > 3 ? 0 : 1 - 0.4 * pk, p: sw.p, dir: sw.dir, pk, show: pk < 0.98 && t < 3};
};
const himPose = (t: number, hook: Hook): Pose => {
  const [lx, ly] = himLook(t, hook);
  let mouth = keyAt(HIM_M, t);
  if (t < 3.0) mouth = hook === 'a' ? (t >= 1.2 && t < 1.9 ? 'o' : 'grit') : (t >= 0.7 ? (t >= 1.5 ? (t >= 2.3 ? 'grit' : 'grit') : 'o') : 'grit');
  let sq = 1 + 0.014 * Math.sin(t * 2.3), bob = 0, tilt = Math.sin(t * 0.9) * 0.9;
  const scared = t < 13.3 ? 1 : 1 - smooth(t, 13.3, 19.8);
  const sweat = 0.85 * scared; let flush = 0.12 + 0.2 * scared;
  if (hook === 'b' && t < 3.2) { const fl = pulse(t, 0.65, 1.1); sq += 0.05 * fl; bob -= 14 * fl; flush += 0.5 * smooth(t, 0.75, 1.2) * (1 - smooth(t, 2.4, 3.0)); }
  let brow = 0.1 + 0.7 * scared + 0.25 * pulse(t, 7.0, 8.2);
  const y = pulse(t, YELP, YELP + 0.5);
  bob -= 30 * y; sq += 0.04 * y; brow += 0.5 * y;
  if (t > 7.9 && t < 13.1) tilt = Math.sin(t * 38) * 0.9 * smooth(t, 7.9, 8.4);
  const lit = himPhone(t, hook).lit;
  return {look: [lx, ly], brow, mouth, blink: blinkAt(t, 0.4) * (t > 9.7 && t < 13.2 ? 0 : 1), flush, sweat, tilt, bob, sq, gold: 0.18 + 0.5 * sunOf(t), glow: lit};
};
const herPose = (t: number, hook: Hook): Pose => {
  const [lx, ly] = herLook(t, hook);
  let mouth = keyAt(HER_M, t);
  if (t < 3.0) mouth = hook === 'a' ? 'flat' : (t >= 1.0 ? (t >= 2.3 ? 'flat' : 'smirk') : t >= 0.45 ? 'o' : 'flat');
  let brow = 0.1;
  if (t < 3.0) brow += hook === 'b' ? 0.9 * pulse(t, 0.4, 1.5) : 0.2 * pulse(t, 1.7, 2.6);
  brow += 0.95 * pulse(t, 10.3, 12.6) + 0.35 * pulse(t, 14.5, 16.5) + 0.2 * pulse(t, 17.6, 19.0);
  const rb = pulse(t, 28.0, 29.2);
  const bob = -4 * rb - 5 * pulse(t, 22.0, 22.8);
  return {look: [lx, ly], brow, mouth, blink: blinkAt(t, 1.9), flush: 0.12 + 0.35 * smooth(t, 22.2, 23.0) * (1 - smooth(t, 24.5, 25.5)) + 0.3 * smooth(t, 28, 28.4), sweat: 0, tilt: Math.sin(t * 0.8 + 2) * 0.9, bob, sq: 1 + 0.014 * Math.sin(t * 2 + 1.3), gold: 0.18 + 0.5 * sunOf(t), glow: herPhone(t, hook).lit};
};

// ------------------------------------------------------------------------------------------ phones (opener)
const swipeOf = (ticks: number[], t: number, until: number) => {
  let idx = -1;
  for (let i = 0; i < ticks.length; i++) if (ticks[i] <= t && ticks[i] < until) idx = i;
  if (idx < 0) return {p: 0, dir: 1};
  const p = (t - ticks[idx]) / 0.26;
  return {p: p > 1 ? 0 : clamp(p), dir: idx % 2 ? -1 : 1};
};

// ------------------------------------------------------------------------------------------ arms: shoulder -> bent elbow -> hand
const shoulderOf = (who: 'him' | 'her', inner = true): Pt => { const d = who === 'him' ? 1 : -1; return {x: (who === 'him' ? HIM_X : HER_X) + d * (inner ? 1 : -1) * 240, y: 1210}; };
const elbowOf = (S: Pt, W: Pt, d: number): Pt => {
  const dx = W.x - S.x, dy = W.y - S.y, D = Math.hypot(dx, dy) || 1;
  let px = -dy / D, py = dx / D;
  if (px * d * 0.6 + py < 0) { px = -px; py = -py; }
  const h = 0.2 * D + 16;
  return {x: (S.x + W.x) / 2 + px * h, y: (S.y + W.y) / 2 + py * h};
};
const BentArm: React.FC<{who: 'him' | 'her'; S: Pt; E: Pt; W: Pt; hand: 'phone' | 'rest' | 'finger' | 'fist'; tip?: Pt; sc?: number}> = ({who, S, E, W, hand, tip, sc = 1}) => {
  const him = who === 'him', skin = him ? C.skinHim : C.skinHer;
  const path = `M ${S.x} ${S.y} L ${E.x} ${E.y} L ${W.x} ${W.y}`;
  const sleeve = him ? C.marigold : C.pine, deep = him ? C.marigoldDeep : C.ink;
  const ang = (Math.atan2(W.y - E.y, W.x - E.x) * 180) / Math.PI;
  return <g>
    <path d={path} fill="none" stroke={C.ink} strokeWidth={132 * sc} strokeLinecap="round" strokeLinejoin="round" opacity={0.3} transform="translate(6 10)" />
    <path d={path} fill="none" stroke={deep} strokeWidth={128 * sc} strokeLinecap="round" strokeLinejoin="round" />
    <path d={path} fill="none" stroke={sleeve} strokeWidth={112 * sc} strokeLinecap="round" strokeLinejoin="round" />
    <circle cx={S.x} cy={S.y} r={62 * sc} fill={sleeve} />
    {him && <path d={`M ${E.x - 40} ${E.y - 8} Q ${E.x} ${E.y + 16} ${E.x + 40} ${E.y - 8}`} fill="none" stroke={deep} strokeWidth={6} opacity={0.8} />}
    <g transform={`translate(${W.x} ${W.y}) rotate(${ang - 90})`}>
      <rect x={-56} y={-26} width={112} height={50} rx={22} fill={him ? C.hat : C.snow} />
      {hand === 'finger' && tip ? null : <circle cx={0} cy={-34} r={hand === 'fist' ? 60 : 52} fill={skin} />}
      {hand === 'fist' && <g>
        {[-30, -10, 10, 30].map((x) => <circle key={x} cx={x} cy={-72 + Math.abs(x) * 0.15} r={11} fill="#fff" opacity={0.92} />)}
        {[-20, 0, 20].map((x) => <line key={x} x1={x} y1={-60} x2={x} y2={-30} stroke={C.ink} strokeWidth={4} opacity={0.35} />)}
      </g>}
    </g>
    {hand === 'finger' && tip && <g>
      <circle cx={W.x} cy={W.y - 14} r={52} fill={skin} />
      <path d={`M ${W.x} ${W.y - 18} L ${tip.x} ${tip.y}`} stroke={skin} strokeWidth={44} strokeLinecap="round" />
    </g>}
  </g>;
};

// his outer hand holds the rail from the start until take 2; both hands grab it at the yelp
const gripOuter = (t: number) => 1 - smooth(t, 13.3, 13.7);
const gripBoth = (t: number) => smooth(t, YELP, YELP + 0.25) * (1 - smooth(t, 13.3, 13.7));
const Arms: React.FC<{who: 'him' | 'her'; t: number; hook: Hook}> = ({who, t, hook}) => {
  const him = who === 'him', d = him ? 1 : -1;
  const S = shoulderOf(who), S2 = shoulderOf(who, false);
  const ph = him ? himPhone(t, hook) : herPhone(t, hook);
  const hold = ph.show ? 1 - ph.pk : 0;
  const rest: Pt = {x: S.x - d * 10, y: 1500};
  const holdW: Pt = {x: ph.x - d * 10, y: ph.y + 112};
  let W: Pt = {x: lerp(rest.x, holdW.x, hold), y: lerp(rest.y, holdW.y, hold)};
  const holdE: Pt = {x: S.x - d * 50, y: 1430};
  let E: Pt = {x: S.x + d * 24, y: 1360};
  E = {x: lerp(E.x, holdE.x, hold), y: lerp(E.y, holdE.y, hold)};
  let hand: 'phone' | 'rest' | 'finger' | 'fist' = hold > 0.3 ? 'phone' : 'rest';
  const r = reachFor(t, who);
  let tipW: Pt | undefined;
  if (r) {
    const k = r.k;
    const tipAbs = {x: WX0 + r.x, y: WY0 + r.y};
    const tgt: Pt = {x: tipAbs.x - d * 30, y: tipAbs.y + 80};
    W = {x: lerp(W.x, tgt.x, k), y: lerp(W.y, tgt.y, k)};
    const Er = elbowOf(S, tgt, d);
    E = {x: lerp(E.x, Er.x, k), y: lerp(E.y, Er.y, k)};
    if (k > 0.05) { hand = 'finger'; tipW = {x: lerp(W.x, tipAbs.x, 1), y: lerp(W.y, tipAbs.y, 1)}; if (k < 0.99) tipW = {x: lerp(W.x, tipAbs.x, smooth(k, 0.2, 1)), y: lerp(W.y - 60, tipAbs.y, smooth(k, 0.2, 1))}; }
  }
  const g = him ? gripBoth(t) * (1 - (r ? r.k : 0)) : 0;
  const shake = him && t > 5 && t < 13.5 ? Math.sin(t * 40) * 2.4 : 0;
  const rail: Pt = {x: S.x - 60, y: 1206};
  if (g > 0) { W = {x: lerp(W.x, rail.x, g) + shake, y: lerp(W.y, rail.y, g) + shake * 0.5}; E = {x: lerp(E.x, S.x - 10, g), y: lerp(E.y, 1330, g)}; hand = g > 0.5 ? 'fist' : hand; tipW = undefined; }
  const s2k = him ? gripOuter(t) : 0;
  const S2W: Pt = {x: S2.x + d * 190 + shake, y: 1206};
  return <g>
    {s2k > 0.3 && <BentArm who={who} S={S2} E={{x: S2.x - d * 40, y: 1340}} W={S2W} hand="fist" />}
    <BentArm who={who} S={S} E={E} W={W} hand={hand} tip={tipW} />
  </g>;
};

// ------------------------------------------------------------------------------------------ wide shot
const camW = (t: number): Cam => ({x: 540 + Math.sin(t * 0.5) * 6, y: 960 + Math.sin(t * 0.37) * 5, z: 1 + 0.025 * smooth(t, 0, 28)});
const Wall: React.FC = () => <g>
  <rect x={-200} y={-300} width={1480} height={2500} fill="url(#wallG)" />
  <rect x={-200} y={-300} width={1480} height={530} fill="#F4977D" opacity={0.55} />
  <rect x={-200} y={1240} width={1480} height={800} fill="#F5A58C" opacity={0.35} />
  {[70, 1010].map((x) => <rect key={x} x={x} y={260} width={14} height={1000} fill={C.snow} opacity={0.14} />)}
</g>;
const Bang: React.FC<{x: number; y: number; k: number; size: number; fade: number}> = ({x, y, k, size, fade}) => {
  if (k <= 0) return null;
  const sp = 1 + Math.sin(k * Math.PI * 1.5) * Math.exp(-k * 4) * 0.45;
  const pts = Array.from({length: 16}, (_, i) => { const a = (i / 16) * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 0.58 : 1; return `${Math.cos(a) * r * size},${Math.sin(a) * r * size}`; }).join(' ');
  return <g transform={`translate(${x} ${y}) scale(${sp}) rotate(8)`} opacity={fade}><polygon points={pts} fill={C.ink} transform="translate(5 8)" opacity={0.3} /><polygon points={pts} fill={C.gold} />
    <text y={size * 0.44} textAnchor="middle" fontFamily={FONT_POSTER} fontSize={size * 1.2} fill={C.ink}>!</text></g>;
};
// far-below view through a patch of cleared glass: tiny pines on a snow slope, a thin cable
const FarBelow: React.FC<{t: number}> = ({t}) => {
  const pines: React.ReactNode[] = [];
  for (let r = 0; r < 24; r++) for (let c = 0; c < 17; c++) {
    const x = ((c * 44 + (r % 2) * 22 + ((r * 13 + c * 7) % 11) - t * (10 + (r % 5) * 4)) % 770 + 770) % 770 - 30, y = 40 + r * 40 + ((c * 17) % 9);
    pines.push(<path key={`${r}-${c}`} d={`M ${x} ${y - 24} L ${x + 10} ${y} L ${x - 10} ${y} Z`} fill={(r + c) % 3 ? C.pine : C.pineLite} />);
  }
  return <g>
    <rect x={-20} y={-20} width={760} height={980} fill="#EAF4FB" />
    <path d="M -20 300 Q 250 220 740 330 L 740 380 Q 250 280 -20 360 Z" fill="#CFE3F0" />
    <path d="M -20 640 Q 300 560 740 700 L 740 740 Q 300 620 -20 700 Z" fill="#CFE3F0" />
    {pines}
    <path d="M -20 880 L 740 820" stroke={C.ink} strokeWidth={12} opacity={0.85} />
  </g>;
};


// lit phone with a generic profile card that tilts sideways as if being swiped (no app UI)
const LitPhone: React.FC<{x: number; y: number; rot: number; lit: number; t: number; seed: number}> = ({x, y, rot, lit, t, seed}) => {
  const ph = t * 3.6 + seed, cyc = ph % 1, dir = Math.floor(ph) % 2 ? -1 : 1;
  const k = smooth(cyc, 0.1, 0.9), tilt = dir * (k * 26), off = dir * k * 62, al = 1 - smooth(cyc, 0.75, 1);
  const hue = ['#F6B7A3', '#B9C6F2', '#A8DCC8'][Math.floor(ph) % 3];
  return <g transform={`translate(${x} ${y}) rotate(${rot}) scale(0.95)`}>
    <rect x={-80} y={-150} width={160} height={300} rx={26} fill={C.ink} />
    <rect x={-70} y={-138} width={140} height={276} rx={18} fill="#CFEFFF" />
    <clipPath id={`lp${seed}`}><rect x={-70} y={-138} width={140} height={276} rx={18} /></clipPath>
    <g clipPath={`url(#lp${seed})`} opacity={lit}>
      <rect x={-70} y={-138} width={140} height={276} fill="#DDF3FF" />
      <g transform={`translate(${off} ${k * 6}) rotate(${tilt} 0 90)`} opacity={al}>
        <rect x={-54} y={-118} width={108} height={186} rx={14} fill="#fff" />
        <rect x={-48} y={-112} width={96} height={128} rx={10} fill={hue} />
        <circle cx={0} cy={-62} r={24} fill="#fff" opacity={0.9} />
        <path d="M -42 16 Q -40 -22 0 -26 Q 40 -22 42 16 Z" fill="#fff" opacity={0.9} />
        <rect x={-40} y={26} width={64} height={11} rx={5} fill={C.ink} opacity={0.75} />
        <rect x={-40} y={44} width={40} height={8} rx={4} fill={C.ink} opacity={0.3} />
      </g>
      <circle cx={-26} cy={100} r={17} fill="#fff" stroke="#E4472B" strokeWidth={4} />
      <path d="M -33 93 L -19 107 M -19 93 L -33 107" stroke="#E4472B" strokeWidth={5} strokeLinecap="round" />
      <circle cx={26} cy={100} r={17} fill="#fff" stroke="#2E9E6B" strokeWidth={4} />
      <path d="M 26 109 C 14 101 15 91 21 91 C 24 91 26 94 26 94 C 26 94 28 91 31 91 C 37 91 38 101 26 109 Z" fill="#2E9E6B" />
    </g>
  </g>;
};

const Wide: React.FC<{t: number; hook: Hook}> = ({t, hook}) => {
  const cam = camW(t);
  const him = himPose(t, hook), her = herPose(t, hook);
  const hp = himPhone(t, hook), rp = herPhone(t, hook);
  const haze = pulse(t, B.rewind - 0.1, B.rewind + 1.0);
  const sw = swayOf(t);
  const shk = t >= R ? Math.exp(-(t - R) * 9) : 0;
  const sun = sunOf(t);
  const bandK = 1 - smooth(t, 2.65, 2.95);
  const hole = <>{bandK > 0.02 && <rect x={50} y={790} width={600} height={140 * bandK} rx={24} />}</>;
  return <g transform={`translate(${Math.sin(t * 80) * 18 * shk} ${Math.cos(t * 67) * 14 * shk}) rotate(${sw} 540 -300)`}>
    <g transform={planeT(cam, 0.45)}><Wall /></g>
    <g transform={planeT(cam, 0.65)}>
      <g transform={`translate(${WX0} ${WY0})`}>
        <WindowFrame num />
        <g clipPath="url(#winClip)"><Valley t={vtOf(t)} sun={sun} pylons={PY} /></g>
        {bandK > 0.02 && <g><clipPath id="bandClip"><rect x={50} y={790} width={600} height={140 * bandK} rx={24} /></clipPath><g clipPath="url(#bandClip)"><FarBelow t={0} /></g></g>}
        <GlassPanel id="gw" w={WIN_W} h={WIN_H} rx={30} fog={0.93 - 0.2 * sun} holes={hole}
          overlay={<g>{STRIKES.map((s, i) => <StrikeView key={i} s={s} t={t} />)}<Scribble t={t} />{ITEMS.map((it, i) => <ItemView key={i} it={it} t={t} mode="ink" />)}</g>}
          render={(mode) => <>{ITEMS.map((it, i) => <ItemView key={i} it={it} t={t} mode={mode} edgeW={24} coreW={6} />)}</>} />
        {bandK > 0.02 && <rect x={50} y={790} width={600} height={140 * bandK} rx={24} fill="none" stroke={C.ink} strokeWidth={6} opacity={0.6} />}
        {haze > 0.01 && <rect x={0} y={0} width={WIN_W} height={WIN_H} rx={30} fill="#fff" opacity={0.7 * haze} />}
        {haze > 0.02 && <circle cx={350} cy={560} r={400} fill="url(#phoneGlow)" opacity={haze * 0.85} />}
        {sun > 0.01 && <circle cx={350} cy={400} r={760} fill="url(#goldLight)" opacity={1} />}
      </g>
    </g>
    <g transform={planeT(cam, 0.8)}>
      {[0, 1].map((i) => <g key={i} transform={`translate(${1000 + i * 40} 1300) rotate(${3 - i * 4})`}>
        <path d="M -14 -1000 Q -14 -1030 0 -1050 Q 14 -1030 14 -1000 L 14 0 L -14 0 Z" fill={i ? C.snow : C.pine} />
        <rect x={-14} y={-860} width={28} height={50} fill={C.red} />
      </g>)}
    </g>
    <g transform={planeT(cam, 0.9)}>
      {[hp, rp].map((p, i) => p.show && p.lit > 0.02 ? <ellipse key={i} cx={p.x} cy={p.y - 10} rx={330} ry={340} fill="url(#phoneGlow)" opacity={Math.min(0.9, p.lit * 0.95)} /> : null)}
    </g>
    <g transform={planeT(cam, 1.0)}>
      <Person who="him" x={HIM_X} y={HEAD_Y} pose={him} sc={PSC} />
      <Person who="her" x={HER_X} y={HEAD_Y} pose={her} sc={PSC} />
      <g>
        <rect x={20} y={1226} width={1040} height={26} rx={13} fill={C.ink} opacity={0.35} transform="translate(0 8)" />
        <rect x={20} y={1220} width={1040} height={26} rx={13} fill="#D4E3EC" />
        <rect x={20} y={1220} width={1040} height={9} rx={4.5} fill="#fff" opacity={0.8} />
      </g>
      {[hp, rp].map((p, i) => p.show ? <ellipse key={i} cx={i ? HER_X - 60 : HIM_X + 60} cy={HEAD_Y + 40} rx={300} ry={330} fill="url(#phoneGlow)" opacity={0.4 * p.lit} /> : null)}
      <Arms who="him" t={t} hook={hook} />
      <Arms who="her" t={t} hook={hook} />
      {hp.show && <LitPhone x={hp.x} y={hp.y} rot={hp.rot} lit={hp.lit} t={t} seed={0} />}
      {rp.show && <LitPhone x={rp.x} y={rp.y} rot={rp.rot} lit={rp.lit} t={t + 0.4} seed={1} />}
      {hp.show && <g transform={`translate(${hp.x + 30} ${hp.y - 215}) scale(0.78)`}><NoSignal x={0} y={0} k={1} /></g>}
      {rp.show && <g transform={`translate(${rp.x - 30} ${rp.y - 215}) scale(0.78)`}><NoSignal x={0} y={0} k={1} /></g>}
    </g>
    {t < 3.0 && hook === 'b' && <Bang x={810} y={610} k={wp(t, 0.55, 1.35)} size={84} fade={1 - smooth(t, 1.9, 2.3)} />}
    {sun > 0.01 && <rect x={-200} y={-300} width={1480} height={2500} fill="#FFC98A" opacity={0.2 * sun} />}
    {sun > 0.01 && <rect x={-200} y={-300} width={1480} height={2500} fill="#FFE9B0" opacity={0.12 * sun} />}
  </g>;
};

// ------------------------------------------------------------------------------------------ hanging cabin (exterior insert, last image, end card)
const HangCabin: React.FC<{x: number; y: number; s: number; ang: number; people?: boolean; names?: boolean}> = ({x, y, s, ang, people = true, names = false}) => {
  const him: Pose = {...calm, look: [0, 0.9], mouth: 'grit', brow: 0.9, sweat: 0.9, flush: 0.5};
  const her: Pose = {...calm, look: [-0.5, 0.2], mouth: 'soft', brow: 0.4};
  const pw = 156 * s, ph = 72 * s, px = -78 * s, py = 14 + 22 * s;
  return <g transform={`translate(${x} ${y}) rotate(${ang} 0 -80)`}>
    <rect x={-6 * s} y={-80} width={12 * s} height={80 + 30 * s} fill={C.ink} />
    <g transform={`translate(0 ${30 * s})`}>
      <rect x={-98 * s + 8} y={20} width={196 * s} height={140 * s} rx={30 * s} fill={C.ink} opacity={0.28} />
      <rect x={-98 * s} y={14} width={196 * s} height={140 * s} rx={30 * s} fill={C.red} />
      <clipPath id={`hc${Math.round(s * 10)}`}><rect x={px} y={py} width={pw} height={ph} rx={16 * s} /></clipPath>
      <rect x={px} y={py} width={pw} height={ph} rx={16 * s} fill={C.ice} />
      <g clipPath={`url(#hc${Math.round(s * 10)})`}>
        {people && <g transform={`translate(${-36 * s} ${14 + 62 * s}) scale(${0.12 * s})`}><Person who="him" x={0} y={0} pose={him} /></g>}
        {people && <g transform={`translate(${36 * s} ${14 + 62 * s}) scale(${0.12 * s})`}><Person who="her" x={0} y={0} pose={her} /></g>}
        {names && <g>
          <rect x={px} y={py} width={pw} height={ph} fill="#F2F9FD" opacity={0.95} />
          {[['OWEN', -0.5], ['june', 0.5]].map(([n, k]) => <text key={n as string} x={(k as number) * pw * 0.46} y={py + ph * 0.46} textAnchor="middle" fontFamily={FONT_FOG} fontSize={ph * 0.42} fill="#FFC48F" stroke={C.ink} strokeWidth={ph * 0.04} paintOrder="stroke" strokeLinejoin="round">{n}</text>)}
          <g transform={`translate(${-0.23 * pw} ${py + ph * 0.76})`}>{[[-1, -1, 1, 1], [1, -1, -1, 1]].map((q, i) => <line key={i} x1={q[0] * ph * 0.1} y1={q[1] * ph * 0.1} x2={q[2] * ph * 0.1} y2={q[3] * ph * 0.1} stroke={C.marigold} strokeWidth={ph * 0.04} strokeLinecap="round" />)}</g>
          <circle cx={0.23 * pw} cy={py + ph * 0.76} r={ph * 0.1} fill="none" stroke={C.pine} strokeWidth={ph * 0.04} />
        </g>}
      </g>
      <text y={14 + 132 * s} textAnchor="middle" fontFamily={FONT_PLATE_SAFE} fontWeight={800} fontSize={30 * s} fill={C.snow}>6</text>
    </g>
  </g>;
};
const Chasm: React.FC<{t: number}> = ({t}) => <g>
  <g transform="translate(-177 0) scale(2.05)"><Valley t={vtOf(t)} sun={sunOf(t)} pylons={PY} /></g>
  <path d="M -50 470 Q 540 520 1130 450" fill="none" stroke={C.ink} strokeWidth={8} />
</g>;
const Cable: React.FC<{y: number}> = ({y}) => <path d={`M -50 ${y - 30} Q 540 ${y + 22} 1130 ${y - 40}`} fill="none" stroke={C.ink} strokeWidth={10} />;
const Pulley: React.FC<{x: number; y: number}> = ({x, y}) => <g transform={`translate(${x} ${y})`}><rect x={-16} y={-34} width={32} height={28} rx={8} fill={C.ink} /><circle cx={0} cy={-34} r={20} fill={C.red} /><circle cx={0} cy={-34} r={7} fill={C.snow} /></g>;
// the cabin hangs still on the cable, tiny pines far below
const ExtHang: React.FC<{t: number}> = ({t}) => {
  const z = 1 + 0.04 * wp(t, B.ext1a, B.ext1b);
  return <g transform={`translate(540 800) scale(${z}) translate(-540 -800)`}>
    <g transform="translate(-177 0) scale(2.05)"><Valley t={V0} sun={0} pylons={PY} /></g>
    <Cable y={520} /><Pulley x={540} y={520} />
    <HangCabin x={540} y={600} s={3.4} ang={1.3 * Math.sin((t - B.ext1a) * 2.6)} />
  </g>;
};
// last image: the empty cabin swings away with the two names in the fog
const ExtFinal: React.FC<{t: number}> = ({t}) => {
  const a = t - B.fin0;
  const x = 540 + 70 * smooth(a, 0, 2.2);
  const ang = 5 * Math.exp(-a * 0.5) * Math.sin(a * 2.6 + 0.6);
  return <g>
    <g transform="translate(-177 0) scale(2.05)"><Valley t={vtOf(t)} sun={1} pylons={PY} /></g>
    <rect width={1080} height={1920} fill="#FFB48A" opacity={0.1} />
    <Cable y={520} /><Pulley x={x} y={520} />
    <HangCabin x={x} y={600} s={4.2} ang={ang} people={false} names />
  </g>;
};

// ------------------------------------------------------------------------------------------ top station
const FigArm: React.FC<{S: Pt; W: Pt; col: string; deep: string; skin: string; cuff: string}> = ({S, W, col, deep, skin, cuff}) => <g>
  <path d={`M ${S.x} ${S.y} L ${W.x} ${W.y}`} stroke={deep} strokeWidth={112} strokeLinecap="round" />
  <path d={`M ${S.x} ${S.y} L ${W.x} ${W.y}`} stroke={col} strokeWidth={98} strokeLinecap="round" />
  <circle cx={W.x} cy={W.y} r={54} fill={cuff} /><circle cx={W.x} cy={W.y + 6} r={46} fill={skin} />
</g>;
const Station: React.FC<{t: number}> = ({t}) => {
  const door = smooth(t, B.door0, B.door1);
  const herE = smooth(t, B.her0, B.her1), himE = smooth(t, B.him0, B.him1);
  const sink = smooth(t, B.sink0, B.sink1);
  const hand = smooth(t, B.hand0, B.hand1);
  const lau = t >= B.laugh;
  const hop = (e: number, a: number) => Math.abs(Math.sin(e * Math.PI * 2)) * 10 * (e > 0 && e < 1 ? 1 : 0) * a;
  const herSc = lerp(0.3, 0.44, herE), himSc = lerp(0.3, 0.44, himE);
  const herX = lerp(650, 715, herE), himX = lerp(430, 395, himE);
  const herFeet = lerp(985, 1150, herE), himFeet = lerp(985, 1145, himE) + 14 * sink;
  const herY = herFeet - 830 * herSc - hop(herE, 1), himY = himFeet - 830 * himSc - hop(himE, 1);
  const him: Pose = {...calm, look: sink > 0.3 ? [0, 1] : [0.6, 0.2], mouth: sink > 0.3 && t < 33.5 ? 'o' : t >= 33.6 ? 'smile' : 'soft', brow: 0.5 * sink * (1 - smooth(t, 33.4, 33.8)), flush: 0.3 * sink, gold: 0.4, bob: -6 * pulse(t, B.sink0, B.sink1 + 0.4), sq: 1 + 0.02 * pulse(t, B.sink0, B.sink1)};
  const lw = Math.sin((t - B.laugh) * 22);
  const her: Pose = {...calm, look: lau ? [-0.8, 0.2] : [-0.7, 0.2], mouth: lau ? 'laugh' : 'smile', brow: lau ? 0.2 : 0.1, blink: lau ? 0.4 : blinkAt(t, 1.9), gold: 0.4, flush: lau ? 0.4 : 0.2,
    bob: lau ? -Math.abs(lw) * 8 : 0, tilt: lau ? lw * 2 : 0, gb: lau ? -Math.abs(Math.sin((t - B.laugh) * 22 + 0.9)) * 14 : 0};
  const herHandY = 250, herTarget: Pt = {x: -357, y: herHandY};
  const herInner: Pt = {x: lerp(-236, herTarget.x, hand), y: lerp(520, herTarget.y, hand)};
  const himRaise = Math.max(pulse(t, B.sink0 - 0.1, B.sink1 + 0.6), 0);
  const himInner: Pt = {x: lerp(lerp(236, 330, himRaise), 381, smooth(t, B.hand1 - 0.2, B.hand1 + 0.3)), y: lerp(lerp(520, 280, himRaise), 250, smooth(t, B.hand1 - 0.2, B.hand1 + 0.3))};
  const himOuter: Pt = {x: lerp(-236, -340, himRaise), y: lerp(520, 280, himRaise)};
  const puffK = wp(t, B.sink0 + 0.15, B.sink1 + 0.9);
  const doorW = 240 * (1 - door);
  return <g>
    <g transform="scale(1.6) translate(0 -40)"><Valley t={V0 + 1.7} sun={1} pylons={[]} /></g>
    <rect width={1080} height={1920} fill="#FFB48A" opacity={0.12} />
    <g transform="translate(0 70)">
    <g transform="translate(0 -110)">
    {/* station posts and roof */}
    {[110, 970].map((x) => <rect key={x} x={x - 22} y={430} width={44} height={700} fill={C.ink} />)}
    <rect x={60} y={400} width={960} height={64} rx={24} fill={C.ink} />
    {[0, 1, 2, 3, 4, 5, 6].map((i) => <rect key={i} x={110 + i * 120} y={412} width={60} height={14} rx={7} fill={C.red} />)}
    </g>
    <g transform="translate(0 -110)">
    {/* cabin front with the open doorway */}
    <rect x={188} y={498} width={704} height={612} rx={70} fill={C.ink} opacity={0.25} transform="translate(10 14)" />
    <rect x={180} y={490} width={704} height={612} rx={70} fill={C.red} />
    <rect x={180} y={490} width={704} height={30} rx={15} fill="#fff" opacity={0.18} />
    <clipPath id="doorClip"><rect x={300} y={600} width={480} height={500} rx={30} /></clipPath>
    <rect x={300} y={600} width={480} height={500} rx={30} fill="#FFEBCB" />
    <rect x={300} y={1000} width={480} height={100} fill="#E9C9A0" />
    <g clipPath="url(#doorClip)">
      {[-1, 1].map((s) => <g key={s} transform={`translate(${s * (240 - doorW) * 1} 0)`}>
        <rect x={s < 0 ? 300 : 540} y={600} width={240} height={500} fill={C.ice} opacity={0.9} /><rect x={s < 0 ? 300 : 540} y={600} width={240} height={500} fill="none" stroke={C.snow} strokeWidth={10} />
        <rect x={s < 0 ? 330 : 570} y={640} width={60} height={300} fill="#fff" opacity={0.3} /></g>)}
    </g>
    <text x={532} y={560} textAnchor="middle" fontFamily={FONT_PLATE_SAFE} fontWeight={800} fontSize={74} fill={C.snow}>6</text>
    </g>
    {/* snow ground and platform */}
    <path d="M -20 1000 Q 540 982 1100 1000 L 1100 1960 L -20 1960 Z" fill="#E4EFF8" />
    <path d="M -20 1000 Q 540 982 1100 1000 L 1100 1034 Q 540 1016 -20 1034 Z" fill="#FFF3E4" />
    <rect x={230} y={988} width={620} height={24} rx={10} fill="#C5D6E2" />
    {sink > 0.02 && <ellipse cx={himX} cy={1136} rx={142} ry={32} fill="#B9CBDA" />}
    {/* people */}
    {door > 0.3 && <g>
      <ellipse cx={himX} cy={himFeet + 4} rx={120 * himSc * 2.2} ry={14} fill="url(#softShadow)" />
      <ellipse cx={herX} cy={herFeet + 4} rx={120 * herSc * 2.2} ry={14} fill="url(#softShadow)" />
      <g transform={`translate(${himX} ${himY}) scale(${himSc})`}>
        <FigArm S={{x: -216, y: 235}} W={himOuter} col={C.marigold} deep={C.marigoldDeep} skin={C.skinHim} cuff={C.hat} />
      </g>
      <Person who="him" x={himX} y={himY} pose={him} sc={himSc} />
      <g transform={`translate(${himX} ${himY}) scale(${himSc})`}>
        <FigArm S={{x: 216, y: 235}} W={himInner} col={C.marigold} deep={C.marigoldDeep} skin={C.skinHim} cuff={C.hat} />
      </g>
      {/* her skis over the shoulder */}
      <g transform={`translate(${herX} ${herY}) scale(${herSc})`}>
        {[0, 1].map((i) => <g key={i} transform={`rotate(${7 - i * 3} 250 300)`}><path d={`M ${232 + i * 40} -230 Q ${244 + i * 40} -300 ${256 + i * 40} -230 L ${256 + i * 40} 640 L ${232 + i * 40} 640 Z`} fill={i ? C.ink : C.red} /><rect x={232 + i * 40} y={380} width={24} height={60} fill={C.snow} opacity={0.8} /></g>)}
      </g>
      <Person who="her" x={herX} y={herY} pose={her} sc={herSc} />
      <g transform={`translate(${herX} ${herY}) scale(${herSc})`}>
        <FigArm S={{x: 216, y: 235}} W={{x: 262, y: 330}} col={C.pine} deep={C.ink} skin={C.skinHer} cuff={C.snow} />
        <FigArm S={{x: -216, y: 235}} W={herInner} col={C.pine} deep={C.ink} skin={C.skinHer} cuff={C.snow} />
      </g>
    </g>}
    {/* his sneakers sink: snow drift in front, puff */}
    {sink > 0.02 && <g>
      <path d={`M ${himX - 128} 1134 Q ${himX} ${1134 - 14 * sink} ${himX + 128} 1134 A 128 42 0 0 1 ${himX - 128} 1134 Z`} fill="#fff" />
      <path d={`M ${himX - 128} 1134 Q ${himX} ${1134 - 14 * sink} ${himX + 128} 1134`} fill="none" stroke="#B9CBDA" strokeWidth={6} strokeLinecap="round" />
      {puffK > 0 && puffK < 1 && [0, 1, 2, 3, 4, 5].map((i) => { const dir = (i - 2.5) * 38; return <circle key={i} cx={himX + dir * (0.6 + puffK)} cy={1130 - 90 * Math.sin(puffK * Math.PI * 0.8) - (i % 2) * 24} r={16 + (i % 3) * 5} fill="#fff" opacity={0.9 * (1 - puffK)} />; })}
    </g>}
    </g>
  </g>;
};

// ------------------------------------------------------------------------------------------ end card (season look, soft link in bio line)
const End: React.FC<{t: number}> = ({t}) => {
  const a = t - B.endcard;
  const pop = (a0: number) => { const k = smooth(a, a0, a0 + 0.3); return {k, s: 0.8 + 0.2 * k + Math.sin(wp(a, a0, a0 + 0.5) * Math.PI) * 0.05}; };
  const p1 = pop(0), p2 = pop(0.35), p3 = pop(0.8);
  const drift = Math.sin(t * 1.6) * 12;
  return <g>
    <Chasm t={t} />
    <HangCabin x={540 + drift} y={330} s={0.9} ang={swayOf(t) * 0.8} people={false} />
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
    <g opacity={p3.k} transform={`translate(540 1100) scale(${0.9 + 0.1 * p3.k})`}>
      <rect x={-382} y={-70} width={768} height={150} rx={56} fill={C.ink} opacity={0.3} transform="translate(6 10)" />
      <rect x={-390} y={-78} width={768} height={150} rx={56} fill={C.ink} opacity={0.9} />
      <text x={-6} y={-8} textAnchor="middle" fontFamily={FONT_POSTER} fontSize={50} fill={C.gold}>{spec.endLine[0]}</text>
      <text x={-6} y={46} textAnchor="middle" fontFamily={FONT_PLATE_SAFE} fontWeight={800} fontSize={46} fill={C.snow}>{spec.endLine[1]}</text>
    </g>
  </g>;
};

// ------------------------------------------------------------------------------------------ shots and wipes
type ShotId = 'W' | 'S' | 'F' | 'E' | 'X1';
const INSERTS: {a: number; b: number; id: ShotId}[] = [{a: B.ext1a, b: B.ext1b, id: 'X1'}];
const WIPES: {t0: number; from: ShotId; to: ShotId}[] = [{t0: B.wipeSt, from: 'W', to: 'S'}, {t0: B.wipeFin, from: 'S', to: 'F'}, {t0: B.wipeEnd, from: 'F', to: 'E'}];
const baseShot = (t: number): ShotId => { let s: ShotId = 'W'; for (const w of WIPES) if (t >= w.t0 + WIPE_DUR) s = w.to; return s; };
const renderShot = (id: ShotId, t: number, hook: Hook): React.ReactNode => id === 'W' ? <Wide t={t} hook={hook} /> : id === 'S' ? <Station t={t} /> : id === 'F' ? <ExtFinal t={t} /> : id === 'X1' ? <ExtHang t={t} /> : <End t={t} />;

const Scene: React.FC<{hook: Hook}> = ({hook}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const ins = INSERTS.find((x) => t >= x.a && t < x.b);
  const w = ins ? undefined : WIPES.find((x) => t >= x.t0 && t < x.t0 + WIPE_DUR);
  const k = w ? (t - w.t0) / WIPE_DUR : 0;
  return <>
    <MotionBlurWhen fast={!!w} samples={4} shutter={200}>
      <AbsoluteFill>
        <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, background: C.ice}}>
          <Defs />
          <defs><clipPath id="winClip"><rect x={0} y={0} width={WIN_W} height={WIN_H} rx={30} /></clipPath></defs>
          {w ? <>
            {renderShot(w.from, t, hook)}
            <defs><WipeClip id="wipeNew" k={k} /></defs>
            <g clipPath="url(#wipeNew)">{renderShot(w.to, t, hook)}</g>
            <SleeveArm k={k} />
          </> : renderShot(ins ? ins.id : baseShot(t), t, hook)}
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

export const Cabin3: React.FC<{hook?: Hook}> = ({hook = 'a'}) => (
  <AbsoluteFill style={{background: C.ice}}>
    <Audio src={staticFile('audio/cabin-ep3.wav')} volume={0.9} />
    <Scene hook={hook} />
  </AbsoluteFill>
);
