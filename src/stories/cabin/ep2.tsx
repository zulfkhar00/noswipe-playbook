import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, lerp, smooth} from '../../lib/motion';
import {MotionBlurWhen} from '../../lib/shots';
import {
  C, Defs, FONT_POSTER, GlassPanel, Item, ItemView, Person, Phone, Pose, SleeveArm, Strip, VoteCard, Valley, WIN_H, WIN_W, WIPE_DUR, WindowFrame, WipeClip, calm, cellC, planeT, wp, Cam, Mouth,
} from './world';
import spec from '../../../specs/stories/cabin-ep2.json';

// Cabin Six, part 2 "Let her win". Silent. Whole story in the wide shot: two big faces, the fogged window between them with the
// board X X _ / O O _. Take 1 (A): he wins, panics, DO YOU LIKE SNOW?. Breath re-fog = rewind. Take 2 (B): he loses on purpose, she
// spots it, the "why?" payoff, her laugh. Then a hard jolt: the gondola stops dead mid-air. Vote board and end card.

export const CABIN2_FPS = 60;
export const CABIN2_FRAMES = Math.round(spec.duration * CABIN2_FPS);
export type Hook = 'a' | 'b';
const B = spec.beats;
const PY = spec.pylons;
const T = spec.texts;
const JOLT = B.jolt;
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

// the gondola is frozen from the jolt on: valley time stops (with a small recoil), the cabin sways
const vtOf = (t: number) => t < JOLT ? t : JOLT + 0.045 * Math.sin((t - JOLT) * 11) * Math.exp(-(t - JOLT) * 2.4);
const swayOf = (t: number) => t < JOLT ? 0.7 * Math.sin(t * 1.1) : (2.6 * Math.exp(-(t - JOLT) * 0.55) * Math.sin((t - JOLT) * 2.6 + 0.2)) * smooth(t, JOLT, JOLT + 0.08) + 0.5 * Math.sin(t * 1.3);

// ------------------------------------------------------------------------------------------ glass content (window-local coords 700 x 940)
const GX = 350, GY = 560, CELL = 130;
const cc = (i: number) => cellC(GX, GY, CELL, i);
const SA = 150, SB = 245;
const OUT1: [number, number] = [B.erase, B.erase + 0.3];
const mk = (k: 'X' | 'O', cell: number, a: number, who: 'him' | 'her', out?: [number, number], dur = 0.33): Item => ({k, cx: cc(cell).x, cy: cc(cell).y, a, b: a + dur, who, out});
const txt = (lines: [string, number][], x: number, size: number, a: number, dur: number, outAt: number, who: 'him' | 'her'): Item & {nofinger?: boolean} =>
  ({k: 'text', lines: lines.map(([s, y]) => ({s, x, y, size})), a, b: a + dur, out: [outAt, outAt + 0.3], who});
const ITEMS: (Item & {nofinger?: boolean})[] = [
  {k: 'grid', cx: GX, cy: GY, cell: CELL, a: -3, b: -2, who: 'her'},
  mk('X', 0, -2, 'him'), mk('X', 1, -2, 'him'), mk('O', 3, -2, 'her'), mk('O', 4, -2, 'her'),
  txt([[T.ctx[0], SA], [T.ctx[1], SB]], 350, 84, B.ctx, 0.7, B.ctxOut, 'her'),
  mk('X', 2, B.x1, 'him', OUT1),
  txt([[T.q[0], SA], [T.q[1], SB]], 350, 84, B.q, 0.7, B.qOut, 'him'),
  txt([[T.yes, SA]], 350, 110, B.yes, 0.5, B.yesOut, 'her'),
  {...txt([[T.rw, SA]], 350, 84, B.rw, 0.5, B.rwOut, 'her'), nofinger: true},
  mk('X', 8, B.x2, 'him'), mk('O', 5, B.o2, 'her'),
  txt([[T.yl, SA]], 350, 80, B.yl, 0.6, B.ylOut, 'her'),
  txt([[T.why, SB]], 350, 110, B.why, 0.5, B.whyOut, 'her'),
  txt([[T.ans[0], SA], [T.ans[1], SB]], 350, 84, B.ans, 0.7, B.ansOut, 'him'),
  txt([[T.stuck[0], SA], [T.stuck[1], SB]], 350, 100, B.stuck, 0.7, B.stuckOut, 'her'),
];
// thick, high-contrast strikes through the winning rows
type Strike = {c0: number; c1: number; a: number; b: number; col: string; who: 'him' | 'her'; out?: [number, number]};
const STRIKES: Strike[] = [
  {c0: 0, c1: 2, a: B.strike1, b: B.strike1 + 0.65, col: C.red, who: 'him', out: OUT1},
  {c0: 3, c1: 5, a: B.strike2, b: B.strike2 + 0.65, col: C.red, who: 'her'},
];
const strikeEnds = (s: Strike) => ({x1: cc(s.c0).x - 66, y1: cc(s.c0).y, x2: cc(s.c1).x + 66, y2: cc(s.c1).y});
const StrikeView: React.FC<{s: Strike; t: number}> = ({s, t}) => {
  const p = smooth(t, s.a, s.b);
  if (p <= 0) return null;
  const al = s.out ? 1 - smooth(t, s.out[0], s.out[1]) : 1;
  const e = strikeEnds(s);
  const x2 = lerp(e.x1, e.x2, p), y2 = lerp(e.y1, e.y2, p);
  const glint = wp(t, s.b, s.b + 0.5);
  return <g opacity={al}>
    <line x1={e.x1} y1={e.y1} x2={x2} y2={y2} stroke={C.ink} strokeWidth={60} strokeLinecap="round" />
    <line x1={e.x1} y1={e.y1} x2={x2} y2={y2} stroke="#fff" strokeWidth={46} strokeLinecap="round" />
    <line x1={e.x1} y1={e.y1} x2={x2} y2={y2} stroke={s.col} strokeWidth={34} strokeLinecap="round" />
    {glint > 0 && glint < 1 && <line x1={lerp(e.x1, e.x2, glint)} y1={e.y1 - 14} x2={lerp(e.x1, e.x2, clamp(glint + 0.12))} y2={e.y1 - 14} stroke="#fff" strokeWidth={9} strokeLinecap="round" opacity={0.85 * Math.sin(glint * Math.PI)} />}
  </g>;
};
const strikeTip = (s: Strike, t: number): Pt => { const e = strikeEnds(s), p = smooth(t, s.a, s.b); return {x: lerp(e.x1, e.x2, p), y: lerp(e.y1, e.y2, p)}; };

// finger reaches: [who, start, end, tip(t) window-local]
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
  return {x: (it as {cx: number}).cx, y: (it as {cy: number}).cy};
};
const startOf = (cell: number): Pt => ({x: cc(cell).x - 36, y: cc(cell).y - 36});
const REACHES: Reach[] = [
  ...ITEMS.filter((it) => it.a > 0 && !it.nofinger).map((it) => ({who: it.who, a: it.a - 0.38, b: it.b + 0.03, tip: (t: number) => tipOfItem(it, Math.min(t, it.b))})),
  ...STRIKES.map((s) => ({who: s.who, a: s.a - 0.38, b: s.b + 0.03, tip: (t: number) => strikeTip(s, Math.min(t, s.b))})),
  // his hover over the empty top-right square (take 1), then the take-2 swerve: toward the win, glance, away to the corner
  {who: 'him' as const, a: B.hover0, b: B.x1, tip: (t: number) => {
    const s = startOf(2), w = Math.sin(t * 9) * 7;
    return {x: lerp(s.x + 40, s.x, smooth(t, B.x1 - 0.5, B.x1)) + w, y: lerp(s.y + 70, s.y, smooth(t, B.x1 - 0.5, B.x1)) + Math.cos(t * 7) * 6};
  }},
  {who: 'him' as const, a: B.rub0, b: B.rub1, tip: (t: number) => ({x: 350 + Math.cos(t * 14) * 55, y: 870 + Math.sin(t * 14) * 38})},
  {who: 'him' as const, a: B.swerve0, b: B.x2, tip: (t: number) => {
    const a = {x: cc(2).x, y: cc(2).y + 50}, b = startOf(8);
    const toWin = smooth(t, B.swerve0, B.swerve0 + 0.3), away = smooth(t, B.x2 - 0.45, B.x2);
    const hov = {x: lerp(b.x + 80, a.x, toWin) + Math.sin(t * 9) * 5, y: lerp(b.y - 200, a.y, toWin)};
    return {x: lerp(hov.x, b.x, away), y: lerp(hov.y, b.y, away)};
  }},
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
    ? [[0, 0.1, 0.85], [0.9, 0.1, 0.85], [1.1, 0.85, 0.1], [1.7, 0.85, 0.1], [2.1, 0.8, 0.2]]
    : [[0, 0.1, 0.85], [0.7, 0.1, 0.85], [0.85, 0.9, 0.1], [1.8, 0.9, 0.1], [2.2, 0.8, 0.2]], t);
  return kf([[3.0, 0.8, 0.2], [5.2, 0.8, 0.3], [6.7, 0.7, 0.4], [7.3, 0.8, 0.1], [8.0, 0.85, 0.0], [8.7, 0.3, 0.2], [9.0, 0.8, 0.2], [10.3, 0.4, 0.1], [12.3, 0.4, 0.1], [12.7, 0.1, 0.4], [14.0, 0.1, 0.5],
    [14.9, 0.8, 0.2], [15.4, 0.8, 0.3], [15.7, 0.4, 0.1], [16.1, 0.8, 0.4], [16.8, 0.85, 0.1], [17.9, 0.4, 0.1], [18.6, 0.4, 0.2], [18.9, 0.85, 0.1], [21.0, 0.8, 0.2], [21.8, 0.4, 0.1], [23.2, 0.5, 0.1],
    [JOLT - 0.05, 0.5, 0.1], [JOLT + 0.15, 0.0, 0.95], [25.4, 0.0, 0.95], [25.9, 0.3, 1.0], [29.0, 0.2, 1.0], [30, 0.0, 0.95]], t);
};
const herLook = (t: number, hook: Hook): number[] => {
  if (t < 3.0) return kf(hook === 'a'
    ? [[0, -0.1, 0.85], [0.9, -0.1, 0.85], [1.1, -0.85, 0.1], [2.1, -0.8, 0.2]]
    : [[0, -0.1, 0.85], [0.3, -0.1, 0.85], [0.45, -0.7, 0.85], [1.5, -0.8, 0.85], [1.9, -0.85, 0.1], [2.4, -0.8, 0.2]], t);
  return kf([[3.0, -0.8, 0.2], [6.8, -0.8, 0.2], [7.4, -0.4, 0.1], [9.7, -0.5, 0.0], [B.lookOut, -0.9, -0.35], [B.lookOut + 1.0, -0.9, -0.4], [B.lookBack, -0.35, 0.1], [13.2, -0.4, 0.1], [14.9, -0.8, 0.2],
    [16.6, -0.8, 0.3], [17.0, -0.5, 0.2], [17.9, -0.4, 0.05], [18.9, -0.4, 0.05], [19.1, -0.8, 0.3], [21.5, -0.5, 0.1], [JOLT, -0.5, 0.1], [JOLT + 0.2, -0.6, 0.3], [25.0, -0.4, 0.1], [25.8, -0.9, 0.4], [28.9, -0.5, 0.2], [29.0, -0.8, 0.3], [32, -0.4, 0.1]], t);
};
const HIM_M: [number, Mouth][] = [[3.0, 'flat'], [5.3, 'soft'], [6.7, 'grit'], [7.35, 'smile'], [7.95, 'o'], [9.0, 'grit'], [10.4, 'o'], [12.0, 'flat'], [12.4, 'grit'], [14.9, 'flat'], [15.4, 'soft'], [15.7, 'smirk'],
  [16.8, 'o'], [17.5, 'soft'], [18.4, 'smirk'], [18.9, 'smile'], [21.0, 'soft'], [21.7, 'smile'], [22.9, 'soft'], [JOLT, 'o'], [JOLT + 0.3, 'grit'], [27.9, 'o'], [28.4, 'grit']];
const HER_M: [number, Mouth][] = [[3.0, 'flat'], [4.7, 'soft'], [7.4, 'o'], [8.2, 'flat'], [9.8, 'soft'], [11.3, 'flat'], [12.8, 'smirk'], [14.9, 'flat'], [16.8, 'smirk'], [17.3, 'smile'], [17.9, 'smirk'], [18.4, 'smirk'],
  [19.4, 'soft'], [21.4, 'smirk'], [B.laugh, 'laugh'], [B.laugh + 1.0, 'smile'], [23.4, 'soft'], [JOLT, 'o'], [26.0, 'o'], [28.9, 'soft']];
const himPose = (t: number, hook: Hook): Pose => {
  const [lx, ly] = himLook(t, hook);
  let mouth = keyAt(HIM_M, t);
  if (t < 3.0) mouth = hook === 'a' ? (t >= 1.1 ? (t >= 1.9 ? 'flat' : 'o') : 'soft') : (t >= 0.7 ? (t >= 1.5 ? (t >= 2.3 ? 'flat' : 'grit') : 'o') : 'soft');
  let sq = 1 + 0.014 * Math.sin(t * 2.3), bob = 0, tilt = Math.sin(t * 0.9) * 0.9, sweat = 0, flush = 0.12;
  if (hook === 'b' && t < 3.2) { const fl = pulse(t, 0.65, 1.1); sq += 0.05 * fl; bob -= 14 * fl; sweat = smooth(t, 0.8, 1.1) * (1 - smooth(t, 2.5, 2.9)) * 0.95; flush = 0.6 * smooth(t, 0.75, 1.2) * (1 - smooth(t, 2.4, 3.0)); }
  if (hook === 'a' && t < 3.2) { sweat = smooth(t, 1.1, 1.4) * (1 - smooth(t, 2.4, 2.9)) * 0.7; flush = 0.4 * smooth(t, 1.0, 1.6) * (1 - smooth(t, 2.4, 3.0)); }
  let brow = 0.1;
  if (t < 3.0) brow += (hook === 'b' ? 0.8 * pulse(t, 0.65, 1.6) : 0.5 * pulse(t, 1.0, 2.0));
  brow += 0.9 * pulse(t, 7.9, 9.3) + 0.5 * pulse(t, 10.2, 12.0);
  const PAN = 8.0, SINK = B.sink, RW = B.rewind;
  if (t > PAN && t < 8.9) { bob = -12; sq = 1.02; }
  sweat = Math.max(sweat, smooth(t, PAN, PAN + 0.4) * (1 - smooth(t, RW, RW + 0.6)) * 0.95);
  flush = Math.max(flush, 0.7 * smooth(t, PAN, PAN + 0.5) * (1 - smooth(t, RW, RW + 0.7)));
  if (t > SINK && t < RW + 0.1) { bob = 40 * smooth(t, SINK, SINK + 0.4); sq = 0.95; tilt = 3; }
  if (t >= RW + 0.1 && t < RW + 0.5) { bob = 40 * (1 - smooth(t, RW + 0.1, RW + 0.5)); }
  brow += 0.5 * pulse(t, 15.3, 16.2) + 0.3 * pulse(t, 17.6, 18.6);
  const sh = pulse(t, B.shrug, B.shrug + 0.7);
  if (sh > 0) { bob -= 22 * sh; tilt += 4 * sh; }
  const L = t >= B.laugh && t < B.laugh + 1.0;
  if (L) { bob -= Math.abs(Math.sin(t * 20)) * 6; tilt = Math.sin(t * 20) * 2; }
  flush = Math.max(flush, 0.4 * smooth(t, B.laugh - 0.2, B.laugh + 0.2) * (1 - smooth(t, 23.6, 24.1)));
  if (t >= JOLT) { const j = smooth(t, JOLT, JOLT + 0.12); bob -= 16 * Math.sin(Math.min(1, (t - JOLT) / 0.25) * Math.PI); sq = 1 - 0.03 * j + 0.012 * Math.sin(t * 38) * smooth(t, JOLT + 0.4, JOLT + 0.8); sweat = Math.max(sweat, 0.95 * smooth(t, JOLT + 0.1, JOLT + 0.5)); brow += 0.9 * smooth(t, JOLT, JOLT + 0.2); tilt = Math.sin(t * 38) * 0.8 * smooth(t, JOLT + 0.4, JOLT + 0.8); }
  const lit = himPhone(t, hook).lit;
  return {look: [lx, ly], brow, mouth, blink: L || (t > PAN && t < 8.9) || t > JOLT ? 0 : blinkAt(t, 0.4), flush, sweat, tilt, bob, sq, gold: 0.18, glow: lit};
};
const herPose = (t: number, hook: Hook): Pose => {
  const [lx, ly] = herLook(t, hook);
  let mouth = keyAt(HER_M, t);
  if (t < 3.0) mouth = hook === 'a' ? (t >= 1.1 ? (t >= 1.2 ? (t >= 2.3 ? 'flat' : 'smirk') : 'o') : 'flat') : (t >= 1.0 ? (t >= 2.3 ? 'flat' : 'smirk') : t >= 0.45 ? 'o' : 'flat');
  const L = t >= B.laugh && t < B.laugh + 1.0;
  let bob = 0, tilt = Math.sin(t * 0.8 + 2) * 0.9, gb = 0, blink = blinkAt(t, 1.9);
  if (L) { const w = Math.sin((t - B.laugh) * 22); bob = -Math.abs(w) * 12; tilt = w * 3; gb = -Math.abs(Math.sin((t - B.laugh) * 22 + 0.9)) * 14; blink = 0.15; }
  let brow = 0.1;
  if (t < 3.0) brow += hook === 'b' ? 0.9 * pulse(t, 0.4, 1.5) : 0.4 * pulse(t, 1.0, 2.0);
  brow += 0.5 * pulse(t, 7.2, 8.0) + 0.4 * pulse(t, 8.0, 10.0);
  if (t > B.lookOut && t < B.lookBack) { tilt = 3; }
  const sqz = smooth(t, B.squint, B.squint + 0.25) * (1 - smooth(t, 18.6, 18.9));
  if (sqz > 0) { blink = Math.max(blink, 0.5 * sqz); brow += 0.2 * sqz; }
  brow += 0.6 * pulse(t, JOLT, JOLT + 1.0) + 0.4 * pulse(t, 25.6, 27.0);
  const pos = t >= JOLT ? Math.sin(Math.min(1, (t - JOLT) / 0.25) * Math.PI) * -12 : 0;
  return {look: [lx, ly], brow, mouth, blink, flush: 0.35 * smooth(t, B.laugh - 0.2, B.laugh + 0.2) * (1 - smooth(t, 23.6, 24.1)), sweat: 0, tilt, bob: bob + pos, sq: 1 + 0.014 * Math.sin(t * 2 + 1.3), gold: 0.18, glow: herPhone(t, hook).lit, gb};
};

// ------------------------------------------------------------------------------------------ phones (opener)
const swipeOf = (ticks: number[], t: number, until: number) => {
  let idx = -1;
  for (let i = 0; i < ticks.length; i++) if (ticks[i] <= t && ticks[i] < until) idx = i;
  if (idx < 0) return {p: 0, dir: 1};
  const p = (t - ticks[idx]) / 0.26;
  return {p: p > 1 ? 0 : clamp(p), dir: idx % 2 ? -1 : 1};
};
const himPhone = (t: number, hook: Hook) => {
  const sw = swipeOf([-0.05, 0.22, 0.5, 0.78], t, hook === 'a' ? 0.95 : 0.65);
  const pk = hook === 'a' ? smooth(t, 1.4, 2.0) : smooth(t, 0.8, 1.3);
  const x = hook === 'b' ? lerp(350, 270, smooth(t, 0.7, 1.0)) : 350;
  return {x: lerp(x, 270, pk), y: 1075 + 420 * pk, rot: lerp(10, 20, pk) + (hook === 'b' ? 40 * smooth(t, 0.7, 1.0) * (1 - pk) : 0), lit: t > 3 ? 0 : 1 - 0.4 * pk, p: sw.p, dir: sw.dir, pk, show: pk < 0.98 && t < 3};
};
const herPhone = (t: number, hook: Hook) => {
  const sw = swipeOf([-0.05, 0.22, 0.5, 0.78], t, hook === 'a' ? 0.95 : 0.4);
  const pk = hook === 'a' ? smooth(t, 1.5, 2.1) : smooth(t, 1.7, 2.3);
  return {x: lerp(730, 810, pk), y: 1075 + 420 * pk, rot: lerp(-10, -20, pk), lit: t > 3 ? 0 : 1 - 0.4 * pk, p: sw.p, dir: sw.dir, pk, show: pk < 0.98 && t < 3};
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

// one person's pair of arms for the current moment
const Arms: React.FC<{who: 'him' | 'her'; t: number; hook: Hook}> = ({who, t, hook}) => {
  const him = who === 'him', d = him ? 1 : -1;
  const S = shoulderOf(who), S2 = shoulderOf(who, false);
  const ph = him ? himPhone(t, hook) : herPhone(t, hook);
  const hold = ph.show ? 1 - ph.pk : 0;
  const rest: Pt = {x: S.x - d * 10, y: 1500};
  const holdW: Pt = {x: ph.x - d * 10, y: ph.y + 112};
  let W: Pt = {x: lerp(rest.x, holdW.x, hold), y: lerp(rest.y, holdW.y, hold)};
  const holdE: Pt = {x: S.x - d * 50, y: 1430};
  let E = elbowOf(S, rest, d);
  E = {x: S.x + d * 24, y: 1360};
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
  const g0 = him ? smooth(t, JOLT + 0.05, JOLT + 0.3) : 0;
  const g = g0 * (1 - (r && him ? r.k : 0));
  const shake = him && t > JOLT + 0.4 ? Math.sin(t * 40) * 2.2 : 0;
  const rail: Pt = {x: S.x - 60, y: 1206};
  if (g > 0) { W = {x: lerp(W.x, rail.x, g) + shake, y: lerp(W.y, rail.y, g) + shake * 0.5}; E = {x: lerp(E.x, S.x - 10, g), y: lerp(E.y, 1330, g)}; hand = g > 0.5 ? 'fist' : hand; tipW = undefined; }
  const S2W: Pt = {x: S2.x + d * 190 + shake, y: 1206};
  return <g>
    {g0 > 0.3 && <BentArm who={who} S={S2} E={{x: S2.x - d * 40, y: 1340}} W={S2W} hand="fist" />}
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
const Collar: React.FC<{k: number; x: number; y: number; pose: Pose}> = ({k, x, y, pose}) => {
  if (k <= 0.01) return null;
  const yt = lerp(210, 50, k);
  return <g transform={`translate(${x} ${y + pose.bob}) rotate(${pose.tilt}) scale(${pose.sq * PSC} ${(2 - pose.sq) * PSC})`} opacity={clamp(k * 3)}>
    <path d={`M -190 260 L -176 ${yt + 40} Q -120 ${yt + 10} 0 ${yt + 52} Q 120 ${yt + 10} 176 ${yt + 40} L 190 260 Z`} fill={C.marigoldDeep} />
    <path d={`M -170 260 L -160 ${yt + 56} Q -100 ${yt + 28} 0 ${yt + 66} Q 100 ${yt + 28} 160 ${yt + 56} L 170 260 Z`} fill={C.marigold} />
    <path d={`M -150 ${yt + 90} Q 0 ${yt + 130} 150 ${yt + 90}`} fill="none" stroke={C.marigoldDeep} strokeWidth={7} opacity={0.8} />
  </g>;
};

const Pale: React.FC<{k: number; x: number; y: number; sc: number; pose: Pose}> = ({k, x, y, sc, pose}) => k <= 0.01 ? null :
  <g transform={`translate(${x} ${y + pose.bob}) rotate(${pose.tilt}) scale(${pose.sq * sc} ${(2 - pose.sq) * sc})`}>
    <clipPath id={`pale-${Math.round(x)}-${Math.round(sc * 10)}`}><rect x={-150} y={-60} width={300} height={240} /></clipPath>
    <ellipse cx={0} cy={0} rx={138} ry={164} fill="#CFE6F2" opacity={0} clipPath={`url(#pale-${Math.round(x)}-${Math.round(sc * 10)})`} />
  </g>;

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

const Wide: React.FC<{t: number; hook: Hook}> = ({t, hook}) => {
  const cam = camW(t);
  const him = himPose(t, hook), her = herPose(t, hook);
  const hp = himPhone(t, hook), rp = herPhone(t, hook);
  const puff = (t0: number) => pulse(t, t0, t0 + 0.9);
  const haze = pulse(t, B.rewind - 0.1, B.rewind + 1.0);
  const collarK = smooth(t, B.sink, B.sink + 0.45) * (1 - smooth(t, 13.3, 13.8));
  const rArm = reachFor(t, 'him'), hArm = reachFor(t, 'her');
  void rArm; void hArm;
  const sw = swayOf(t);
  const shk = t >= JOLT ? Math.exp(-(t - JOLT) * 9) : 0;
  const bandK = 1 - smooth(t, 2.65, 2.95);
  const hr = 105 * smooth(t, B.rub0 + 0.3, B.rub1);
  const hole = <>
    {bandK > 0.02 && <rect x={50} y={790} width={600} height={140 * bandK} rx={24} />}
    {hr > 1 && <circle cx={350} cy={870} r={hr} />}
  </>;
  return <g transform={`translate(${Math.sin(t * 80) * 18 * shk} ${Math.cos(t * 67) * 14 * shk}) rotate(${sw} 540 -300)`}>
    <g transform={planeT(cam, 0.45)}><Wall /></g>
    <g transform={planeT(cam, 0.65)}>
      <g transform={`translate(${WX0} ${WY0})`}>
        <WindowFrame num />
        <g clipPath="url(#winClip)"><Valley t={vtOf(t)} sun={1} pylons={PY} /></g>
        {bandK > 0.02 && <g><clipPath id="bandClip"><rect x={50} y={790} width={600} height={140 * bandK} rx={24} /></clipPath><g clipPath="url(#bandClip)"><FarBelow t={t} /></g></g>}
        {hr > 1 && <g><clipPath id="patchClip"><circle cx={350} cy={870} r={hr} /></clipPath><g clipPath="url(#patchClip)"><FarBelow t={vtOf(t)} /></g></g>}
        <GlassPanel id="gw" w={WIN_W} h={WIN_H} rx={30} fog={0.93} holes={hole}
          overlay={<g>{STRIKES.map((s, i) => <StrikeView key={i} s={s} t={t} />)}{ITEMS.map((it, i) => <ItemView key={i} it={it} t={t} mode="ink" />)}</g>}
          render={(mode) => <>{ITEMS.map((it, i) => <ItemView key={i} it={it} t={t} mode={mode} edgeW={24} coreW={6} />)}</>} />
        {bandK > 0.02 && <rect x={50} y={790} width={600} height={140 * bandK} rx={24} fill="none" stroke={C.ink} strokeWidth={6} opacity={0.6} />}
        {hr > 1 && <circle cx={350} cy={870} r={hr} fill="none" stroke={C.ink} strokeWidth={6} opacity={0.6} />}
        {haze > 0.01 && <rect x={0} y={0} width={WIN_W} height={WIN_H} rx={30} fill="#fff" opacity={0.7 * haze} />}
        {[puff(B.rewind - 0.1)].map((k, i) => k > 0.02 ? <circle key={i} cx={350} cy={560} r={400} fill="url(#phoneGlow)" opacity={k * 0.85} /> : null)}
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
      <Collar k={collarK} x={HIM_X} y={HEAD_Y} pose={him} />
      <Pale k={smooth(t, B.rub1 - 0.4, B.face1)} x={HIM_X} y={HEAD_Y} sc={PSC} pose={him} />
      {/* the grab rail along the bench */}
      <g>
        <rect x={20} y={1226} width={1040} height={26} rx={13} fill={C.ink} opacity={0.35} transform="translate(0 8)" />
        <rect x={20} y={1220} width={1040} height={26} rx={13} fill="#D4E3EC" />
        <rect x={20} y={1220} width={1040} height={9} rx={4.5} fill="#fff" opacity={0.8} />
      </g>
      <Arms who="him" t={t} hook={hook} />
      <Arms who="her" t={t} hook={hook} />
      {hp.show && <Phone halo={false} who="him" x={hp.x} y={hp.y} rot={hp.rot} lit={hp.lit} p={hp.p} dir={hp.dir} s={0.95} thumb={false} />}
      {rp.show && <Phone halo={false} who="her" x={rp.x} y={rp.y} rot={rp.rot} lit={rp.lit} p={rp.p} dir={rp.dir} s={0.95} thumb={false} />}
    </g>
    {t < 3.0 && hook === 'b' && <Bang x={810} y={610} k={wp(t, 0.55, 1.35)} size={84} fade={1 - smooth(t, 1.9, 2.3)} />}
  </g>;
};

// ------------------------------------------------------------------------------------------ hanging cabin (vote + end card)
const HangCabin: React.FC<{x: number; y: number; s: number; t: number; ang?: number; scared?: boolean}> = ({x, y, s, t, ang, scared = true}) => {
  const sw = ang ?? swayOf(t) * 0.8;
  const him: Pose = scared ? {...calm, look: [0, 0.9], mouth: 'grit', brow: 0.9, sweat: 0.9, flush: 0.5} : {...calm, look: [0.8, 0.2], mouth: 'soft', brow: 0.1};
  const her: Pose = {...calm, look: scared ? [-0.5, 0.2] : [-0.8, 0.2], mouth: 'soft', brow: scared ? 0.4 : 0.1};
  return <g transform={`translate(${x} ${y}) rotate(${sw} 0 -80)`}>
    <rect x={-6 * s} y={-80} width={12 * s} height={80 + 30 * s} fill={C.ink} />
    <g transform={`translate(0 ${30 * s})`}>
      <rect x={-98 * s + 8} y={20} width={196 * s} height={140 * s} rx={30 * s} fill={C.ink} opacity={0.28} />
      <rect x={-98 * s} y={14} width={196 * s} height={140 * s} rx={30 * s} fill={C.red} />
      <clipPath id="hcClip"><rect x={-78 * s} y={14 + 22 * s} width={156 * s} height={72 * s} rx={16 * s} /></clipPath>
      <rect x={-78 * s} y={14 + 22 * s} width={156 * s} height={72 * s} rx={16 * s} fill={C.ice} />
      <g clipPath="url(#hcClip)">
        <g transform={`translate(${-36 * s} ${14 + 62 * s}) scale(${0.12 * s})`}><Person who="him" x={0} y={0} pose={him} /></g>
        <g transform={`translate(${36 * s} ${14 + 62 * s}) scale(${0.12 * s})`}><Person who="her" x={0} y={0} pose={her} /></g>
      </g>
      <circle cx={0} cy={14 + 118 * s} r={0} fill="none" />
      <text y={14 + 132 * s} textAnchor="middle" fontFamily={FONT_PLATE_SAFE} fontWeight={800} fontSize={30 * s} fill={C.snow}>6</text>
    </g>
  </g>;
};
const Chasm: React.FC<{t: number}> = ({t}) => <g>
  <g transform="translate(-177 0) scale(2.05)"><Valley t={vtOf(t)} sun={1} pylons={PY} /></g>
  <path d="M -50 470 Q 540 520 1130 450" fill="none" stroke={C.ink} strokeWidth={8} />
</g>;


// ------------------------------------------------------------------------------------------ exterior inserts, POV, face
const Cable: React.FC<{y: number}> = ({y}) => <g>
  <path d={`M -50 ${y - 30} Q 540 ${y + 22} 1130 ${y - 40}`} fill="none" stroke={C.ink} strokeWidth={10} />
</g>;
// the little red cabin hanging on the cable over the snowy valley, "6" on its side
const ExtRide: React.FC<{t: number}> = ({t}) => {
  const a = t - B.ext1a;
  const ang = 2.2 * Math.sin(a * 6) + 0.8;
  const z = 1 + 0.05 * wp(t, B.ext1a, B.ext1b);
  return <g transform={`translate(540 800) scale(${z}) translate(-540 -800)`}>
    <g transform="translate(-177 0) scale(2.05)"><Valley t={t} sun={1} pylons={PY} /></g>
    <Cable y={520} />
    <g transform="translate(540 520)"><rect x={-16} y={-34} width={32} height={28} rx={8} fill={C.ink} /><circle cx={0} cy={-34} r={20} fill={C.red} /><circle cx={0} cy={-34} r={7} fill={C.snow} /></g>
    <HangCabin x={540} y={600} s={3.4} t={t} ang={ang} scared={false} />
  </g>;
};
// the stop: cabin halts dead and swings, "ka-chunk" burst, pylon behind
const ExtStop: React.FC<{t: number}> = ({t}) => {
  const a = t - JOLT;
  const ang = 15 * Math.exp(-(a - 0.3) * 1.2) * Math.sin((a - 0.3) * 5.2);
  const shk = Math.exp(-(a - 0.3) * 8);
  const kb = wp(t, B.ext2a, B.ext2a + 0.35);
  const pts = Array.from({length: 18}, (_, i) => { const q = (i / 18) * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 0.62 : 1; return `${Math.cos(q) * r * 190},${Math.sin(q) * r * 140}`; }).join(' ');
  return <g transform={`translate(${Math.sin(t * 90) * 14 * shk} ${Math.cos(t * 77) * 10 * shk})`}>
    <g transform="translate(-177 0) scale(2.05)"><Valley t={vtOf(t)} sun={1} pylons={PY} /></g>
    <Cable y={520} />
    <g transform="translate(540 520)"><rect x={-16} y={-34} width={32} height={28} rx={8} fill={C.ink} /><circle cx={0} cy={-34} r={20} fill={C.red} /><circle cx={0} cy={-34} r={7} fill={C.snow} /></g>
    <HangCabin x={540} y={600} s={3.4} t={t} ang={ang} scared />
    {kb > 0 && <g transform={`translate(810 600) scale(${(0.5 + 0.5 * smooth(kb, 0, 1)) * (1 + Math.sin(kb * Math.PI) * 0.15)}) rotate(-8)`}>
      <polygon points={pts} fill={C.ink} transform="translate(8 12)" opacity={0.3} /><polygon points={pts} fill={C.gold} />
      <text y={22} textAnchor="middle" fontFamily={FONT_POSTER} fontSize={70} fill={C.ink}>KA-CHUNK</text>
    </g>}
  </g>;
};
// POV: down through the wiped patch at the tiny pines far below (vertigo zoom)
const Pov: React.FC<{t: number}> = ({t}) => {
  const a = wp(t, B.pov0, B.pov1);
  const z = 1.5 + 0.7 * smooth(a, 0, 1), rot = 5 * a;
  return <g>
    <rect width={1080} height={1920} fill={C.snow} />
    <clipPath id="povClip"><circle cx={540} cy={960} r={470} /></clipPath>
    <g clipPath="url(#povClip)"><g transform={`translate(540 960) rotate(${rot}) scale(${z}) translate(-350 -470)`}><FarBelow t={t * 0.6} /></g></g>
    <circle cx={540} cy={960} r={470} fill="none" stroke={C.ink} strokeWidth={12} opacity={0.55} />
    <circle cx={540} cy={960} r={500} fill="none" stroke="#fff" strokeWidth={50} opacity={0.8} />
    <path d="M 70 1250 Q 540 1100 1010 1260" fill="none" stroke={C.ink} strokeWidth={9} opacity={0.0} />
  </g>;
};
// close shot: he goes pale, sweats, gulps
const FaceShot: React.FC<{t: number}> = ({t}) => {
  const a = t - B.face0;
  const gulp = pulse(t, B.face0 + 0.55, B.face0 + 0.95);
  const pale = smooth(a, 0, 0.6);
  const pose: Pose = {...calm, look: [0, 1], brow: 0.9 + 0.3 * gulp, mouth: gulp > 0.2 ? 'o' : 'grit', sweat: 0.95, flush: 0, bob: 14 * gulp, sq: 1 - 0.03 * gulp + 0.01 * Math.sin(t * 40), tilt: Math.sin(t * 38) * 0.6, gold: 0.1};
  const drop = (o: number, x: number) => { const k = ((a * 1.2 + o) % 1); return <path key={o} d="M 0 -26 q -17 28 0 40 q 17 -12 0 -40 z" transform={`translate(${x} ${-40 + k * 260}) scale(0.9)`} fill="#8FD0F0" opacity={0.9 * Math.sin(k * Math.PI)} />; };
  return <g>
    <Wall />
    <g transform="translate(540 1010) scale(1.7)">
      <Person who="him" x={0} y={0} pose={pose} sc={1} />
      <clipPath id="paleF"><rect x={-150} y={-60} width={300} height={240} /></clipPath>
      <ellipse cx={0} cy={bobY(pose)} rx={138} ry={164} fill="#CFE6F2" opacity={0} clipPath="url(#paleF)" />
      <g transform={`translate(0 ${bobY(pose)})`}>{drop(0, 150)}{drop(0.4, -150)}{drop(0.75, 105)}</g>
    </g>
  </g>;
};
const bobY = (p: Pose) => p.bob;

// ------------------------------------------------------------------------------------------ vote
const Vote: React.FC<{t: number}> = ({t}) => {
  const tq = smooth(t, B.vote + 0.05, B.vote + 0.4);
  const sway = swayOf(t);
  return <g>
    <Chasm t={t} />
    <HangCabin x={540 + Math.sin(sway) * 20} y={470} s={2.2} t={t} />
    <g opacity={tq} transform={`translate(0 ${(1 - tq) * -30})`}>
      <rect x={52} y={312} width={984} height={144} rx={44} fill={C.ink} opacity={0.3} />
      <rect x={40} y={298} width={984} height={144} rx={44} fill={C.snow} />
      <text x={532} y={366} textAnchor="middle" fontFamily={FONT_POSTER} fontSize={66} fill={C.ink}>{spec.vote.question[0]}</text>
      <text x={532} y={430} textAnchor="middle" fontFamily={FONT_POSTER} fontSize={58} fill={C.red}>{spec.vote.question[1]}</text>
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
  const drift = Math.sin(t * 1.6) * 12;
  return <g>
    <Chasm t={t} />
    <HangCabin x={540 + drift} y={330} s={0.9} t={t} />
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

// ------------------------------------------------------------------------------------------ shots and wipes
type ShotId = 'W' | 'V' | 'E' | 'X1' | 'X2' | 'P' | 'F';
const INSERTS: {a: number; b: number; id: ShotId}[] = [{a: B.ext1a, b: B.ext1b, id: 'X1'}, {a: B.ext2a, b: B.ext2b, id: 'X2'}, {a: B.pov0, b: B.pov1, id: 'P'}, {a: B.face0, b: B.face1, id: 'F'}];
const WIPES: {t0: number; from: ShotId; to: ShotId}[] = [{t0: B.wipeVote, from: 'W', to: 'V'}, {t0: B.wipeEnd, from: 'V', to: 'E'}];
const baseShot = (t: number): ShotId => { let s: ShotId = 'W'; for (const w of WIPES) if (t >= w.t0 + WIPE_DUR) s = w.to; return s; };
const renderShot = (id: ShotId, t: number, hook: Hook): React.ReactNode => id === 'W' ? <Wide t={t} hook={hook} /> : id === 'V' ? <Vote t={t} /> : id === 'X1' ? <ExtRide t={t} /> : id === 'X2' ? <ExtStop t={t} /> : id === 'P' ? <Pov t={t} /> : id === 'F' ? <FaceShot t={t} /> : <End t={t} />;

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

export const Cabin2: React.FC<{hook?: Hook}> = ({hook = 'a'}) => (
  <AbsoluteFill style={{background: C.ice}}>
    <Audio src={staticFile('audio/cabin-ep2.wav')} volume={0.9} />
    <Scene hook={hook} />
  </AbsoluteFill>
);
void WIN_H;
