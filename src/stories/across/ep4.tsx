import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, lerp, smooth} from '../../lib/motion';
import {MotionBlurWhen} from '../../lib/shots';
import {Arm, BenchFront, Booklet, C, Cam, CamKey, Door, Face, Her, Him, JOST, PassingTrain, Paper, Pen, PosterBg, Sign, SeatBack, SheetSpec, Soft, Strip, Table, TRAIN_CUT, VoteCard, Wall, Window, PW, boxX, camAt, planeT, textW} from './world';
import spec from '../../../specs/stories/across-ep4.json';

// Seven Across, part 4 "The delay". Silent, stands alone. Frame 1: moving carriage, her clue "Look at the (6)" on the table,
// his hand on his phone. Take 1 (SCREEN): he looks down, the train brakes and jolts, the phone slides off the table, he dives
// after it and resurfaces with a red ear while she kindly points her pen at the window (no balloon shown). The opposite train
// runs backwards as the rewind. Take 2 (WINDOW): both flip their phones face down, the halt is gentle (his palm stops his phone
// without looking), a bystander's phone lights with the chip "NoSwipe", then a hot-air balloon rises and they see it together.
// He writes WINDOW, she answers with a tick and a balloon doodle. New clue "Tomorrow, same (4)", vote A SEAT / B TIME.
// Everything in the carriage is a pure function of story time tt: tt = t in take 2, and runs backwards during the rewind.

export const ACROSS4_FPS = 60;
export const ACROSS4_FRAMES = Math.round(spec.duration * ACROSS4_FPS);
const B = spec.beats;

export type Hook = 'a' | 'b';

const CUT = 6.0 + 0.6 + TRAIN_CUT;                 // 6.97: hidden behind the reversed passing train
const tvOf = (t: number) => (t < 5.9 ? t : t < 6.2 ? 5.9 : t < 6.75 ? lerp(5.9, 0.5, smooth(t, 6.2, 6.75)) : t < CUT ? 0.5 : t);

// ------------------------------------------------------------------------------------- sheets

const PY = 1020;
const px = (t: number) => (t < 14.4 ? 660 : t < 16.3 ? 790 : lerp(790, 575, smooth(t, 16.3, 16.8)));
const INK_HIM = '#243B6B';
const CLUE1 = 'Look at the (6)';
const SHEET_1: SheetSpec = {text: CLUE1, n: 6, by: 'her', size: 52};
const SHEET_2: SheetSpec = {text: CLUE1, n: 6, by: 'her', size: 52, letters: {s: 'WINDOW', from: 10.7, step: 0.25, ink: INK_HIM}};
const SHEET_3: SheetSpec = {text: 'Tomorrow, same (4)', n: 4, by: 'her', size: 52, reveal: [15.0, 16.0]};

// ------------------------------------------------------------------------------------- phones

const T0 = {x: 380, y: 1110};           // his phone lying on the table
const R0 = {x: 372, y: 1030};           // held up
const R2 = {x: 392, y: 1010};           // held up after the dive

type PS = {x: number; y: number; rot: number; lit: number; down: boolean; sq: number};
const hisPhone = (t: number, tv: number): PS => {
  if (t < CUT) {
    const up = smooth(tv, 0.5, 0.95) * (1 - smooth(tv, 3.0, 3.3));
    let x = lerp(T0.x, R0.x, up), y = lerp(T0.y, R0.y, up) + (up > 0.9 ? Math.sin(tv * 3) * 3 : 0), rot = -6 - 8 * up;
    if (tv >= 3.95) {
      const s = smooth(tv, 3.95, 4.3), f = smooth(tv, 4.25, 4.45);
      x = T0.x - 160 * s; y = T0.y + 340 * f; rot = -6 - 70 * f;
      if (tv >= 4.5) {
        const r = smooth(tv, 4.75, 5.15);
        x = lerp(222, R2.x, r); y = lerp(1450, R2.y, r); rot = lerp(-76, -18, r);
      }
    }
    return {x, y, rot, lit: 1, down: false, sq: 1};
  }
  const up = 1 - smooth(t, 7.3, 7.5);
  const fu = smooth(t, 7.5, 7.68);
  const slide = smooth(t, 8.45, 8.7);
  return {x: lerp(T0.x, R0.x, up) - 46 * slide, y: lerp(T0.y, R0.y, up), rot: -6 - 8 * up, lit: fu > 0.5 ? 0 : 1, down: fu > 0.5, sq: Math.abs(Math.cos(Math.PI * fu))};
};

/** Phone, stylised top-down. Lit = plain lock screen (gradient + clock, no app UI, no notifications). */
const LockPhone: React.FC<{p: PS; scale: number; id: string; clock?: boolean}> = ({p, scale, id, clock = true}) => {
  const {x, y, rot, lit, down, sq} = p;
  return <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale * Math.max(sq, 0.04)} ${scale})`}>
    {lit > 0.01 && clock && <g opacity={lit}><defs><radialGradient id={id + 'g'}><stop offset="0" stopColor={C.lit} stopOpacity={0.55} /><stop offset="1" stopColor={C.lit} stopOpacity={0} /></radialGradient></defs><ellipse cx={0} cy={0} rx={84} ry={96} fill={`url(#${id}g)`} /></g>}
    <rect x={-34} y={-58} width={68} height={116} rx={12} fill={C.ink} opacity={0.25} transform="translate(6 8)" />
    {down ? <g>
      <rect x={-34} y={-58} width={68} height={116} rx={12} fill="#3B403E" stroke={C.cream} strokeWidth={3} />
      <circle cx={-16} cy={-40} r={10} fill={C.ink} /><circle cx={-16} cy={-40} r={5} fill="#555B58" />
    </g> : <g>
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2F4A3E" /><stop offset="1" stopColor="#E5702A" /></linearGradient></defs>
      <rect x={-34} y={-58} width={68} height={116} rx={12} fill={C.ink} stroke={C.cream} strokeWidth={3} />
      <rect x={-29} y={-52} width={58} height={104} rx={8} fill={clock ? `url(#${id})` : '#2A302D'} />
      {clock ? <text x={0} y={-12} textAnchor="middle" fontFamily={JOST} fontWeight={600} fontSize={28} fill={C.cream}>7:44</text>
        : <path d="M -29 -20 L 4 -52 L 20 -52 L -29 0 Z" fill={C.cream} opacity={0.1} />}
    </g>}
  </g>;
};

// her small phone, hidden under the booklet until take 2
const BK = {x: 870, y: 1108};
const herPhone = (t: number): PS => {
  const slide = smooth(t, 7.65, 7.9);
  const fu = smooth(t, 7.9, 8.05);
  return {x: lerp(886, 790, slide), y: lerp(1128, 1146, slide), rot: lerp(12, -4, slide), lit: 0, down: fu > 0.5, sq: Math.abs(Math.cos(Math.PI * fu))};
};

// ------------------------------------------------------------------------------------- hands

type Act = {a: number; b: number; tip: (t: number) => [number, number]};
const wl = (x: number, y: number): [number, number] => [x - 660, y - PY];
const handFor = (acts: Act[], t: number, rest: [number, number]) => {
  const p = px(t);
  let best: {w: number; pos: [number, number]} = {w: 0, pos: rest};
  acts.forEach((act, i) => {
    if (t < act.a - 0.35 || t > act.b + 0.35) return;
    const prev = acts[i - 1] && act.a - acts[i - 1].b < 0.7 ? acts[i - 1] : null;
    const next = acts[i + 1] && acts[i + 1].a - act.b < 0.7 ? acts[i + 1] : null;
    const wi = prev ? 1 : smooth(t, act.a - 0.35, act.a), wo = next ? 1 : 1 - smooth(t, act.b, act.b + 0.35);
    let tip = act.tip(clamp(t, act.a, act.b));
    if (prev) { const p0 = prev.tip(prev.b); const k = smooth(t, act.a - 0.1, act.a + 0.1); tip = [lerp(p0[0], tip[0], k), lerp(p0[1], tip[1], k)]; }
    best = {w: wi * wo, pos: [p + tip[0], PY + tip[1]]};
  });
  return {pos: [lerp(rest[0], best.pos[0], best.w), lerp(rest[1], best.pos[1], best.w)] as [number, number], w: best.w};
};
const sway = (t: number, f = 7, a = 2): [number, number] => [Math.sin(t * f) * a, Math.sin(t * f * 0.8) * a];
const POINT = (t: number): [number, number] => { const [sx, sy] = sway(t, 6, 3); return [-10 + sx, -296 + sy]; };   // pen tip up in the window glass
const fillTip = (n: number, from: number, step: number, jit: number) => (t: number): [number, number] => {
  const i = Math.max(0, Math.min(n - 1, Math.floor((t - from) / step)));
  return [boxX(n, i) + Math.sin(t * 50) * jit, 50 + Math.cos(t * 45) * jit * 0.6];
};
const hoverHim = (t: number): [number, number] => [boxX(6, 0) + Math.sin(t * 9) * 2, 62 + Math.sin(t * 7) * 2];
const HOVER_HER = (t: number): [number, number] => { const k = t > 0.38 && t < 0.52 ? -12 : 0; return [128 + Math.sin(t * 5) * 2, 70 + k]; };
const tipTick = (t: number): [number, number] => {
  if (t < 12.7) { const u = clamp((t - 12.4) / 0.3); const pts: [number, number][] = [[-210, 86], [-192, 108], [-146, 60]]; const f = u * 2, i = Math.min(1, Math.floor(f)); return [lerp(pts[i][0], pts[i + 1][0], f - i), lerp(pts[i][1], pts[i + 1][1], f - i)]; }
  const u = clamp((t - 12.7) / 0.6), a = u * Math.PI * 2.6;
  return [-40 + 26 * Math.cos(a - 1.2), 74 + 30 * Math.sin(a - 1.2) + 4 * u];
};
const tipClue = (t: number): [number, number] => {
  const w = textW(SHEET_3.text) * 52 / 42 * 1.1, u = clamp((t - 15.0) / 1.0);
  return [-w / 2 + w * u, -50 + Math.sin(t * 38) * 4];
};
const herPhoneTip = (t: number): [number, number] => {
  const ph = herPhone(t);
  const hx = t < 7.65 ? 922 : t < 7.9 ? ph.x + 40 : ph.x + 6, hy = t < 7.9 ? ph.y : ph.y + 4;
  return wl(hx + 40, hy - 64);
};
const ACTS_HIM2: Act[] = [{a: 10.4, b: 12.15, tip: (t) => (t < 10.7 ? hoverHim(t) : fillTip(6, 10.7, 0.25, 2)(t))}];
const ACTS_HER1: Act[] = [{a: -1, b: 4.9, tip: HOVER_HER}, {a: 5.0, b: 7, tip: POINT}];
const ACTS_HER2: Act[] = [
  {a: 6.0, b: 7.4, tip: HOVER_HER}, {a: 7.5, b: 8.4, tip: herPhoneTip}, {a: 9.6, b: 10.9, tip: POINT}, {a: 10.95, b: 12.15, tip: HOVER_HER},
  {a: 12.2, b: 13.4, tip: tipTick}, {a: 14.6, b: 16.05, tip: tipClue}, {a: 15.95, b: 16.8, tip: () => [262, 104]},
];

// ------------------------------------------------------------------------------------- acting

const key = <T,>(t: number, ks: [number, T][]): T => { let v = ks[0][1]; for (const [a, b] of ks) if (t >= a) v = b; return v; };
type P = {look: [number, number]; mouth: Face['mouth']; brow: number; rot: number};
const himPose = (t: number): P => key<P>(t, [
  [0, {look: [3, 16], mouth: 'flat', brow: 0.2, rot: 5}],
  [2.4, {look: [8, 6], mouth: 'flat', brow: 0.4, rot: 3}],
  [3.0, {look: [4, 18], mouth: 'flat', brow: 0.2, rot: 5}],
  [3.9, {look: [5, 22], mouth: 'o', brow: 0.9, rot: 2}],
  [4.1, {look: [4, 20], mouth: 'wince', brow: 0.8, rot: 8}],
  [4.8, {look: [4, 12], mouth: 'wince', brow: 0.7, rot: 14}],       // resurfaces askew
  [5.3, {look: [4, 20], mouth: 'flat', brow: 0.6, rot: 9}],
  [CUT, {look: [3, 16], mouth: 'flat', brow: 0.2, rot: 5}],
  [7.4, {look: [3, 14], mouth: 'flat', brow: 0.2, rot: 5}],
  [7.7, {look: [9, 2], mouth: 'smile', brow: 0.5, rot: 0}],          // eyes up this time
  [8.3, {look: [10, -4], mouth: 'smile', brow: 0.4, rot: -1}],
  [9.0, {look: [10, -6], mouth: 'smile', brow: 0.6, rot: -2}],
  [9.3, {look: [10, -6], mouth: 'o', brow: 0.9, rot: -2}],
  [10.4, {look: [10, -4], mouth: 'smile', brow: 0.7, rot: -1}],
  [10.7, {look: [9, -4], mouth: 'smile', brow: 0.5, rot: -1}],
  [12.2, {look: [4, 14], mouth: 'grin', brow: 0.5, rot: 3}],
  [13.0, {look: [9, 0], mouth: 'smile', brow: 0.6, rot: -1}],
  [14.3, {look: [8, 6], mouth: 'smile', brow: 0.4, rot: 1}],
  [15.0, {look: [8, 12], mouth: 'flat', brow: 0.4, rot: 2}],
  [16.3, {look: [4, 16], mouth: 'flat', brow: 0.3, rot: 5}],
  [16.9, {look: [10, -2], mouth: 'smile', brow: 0.7, rot: -2}],
  [17.4, {look: [10, -6], mouth: 'o', brow: 0.9, rot: -3}],
]);
const himBlush = (t: number, tv: number) => {
  if (t < CUT) return tv < 2.4 ? 0.1 : tv < 4.3 ? lerp(0.1, 0.3, smooth(tv, 2.4, 4.0)) : lerp(0.3, 1, smooth(tv, 4.3, 4.9));
  if (t < 9.7) return 0.08;
  if (t < 10.9) return lerp(0.08, 0.85, smooth(t, 10.2, 10.9));
  return lerp(0.85, 0.5, smooth(t, 11.5, 14));
};
const herPose = (t: number): P => key<P>(t, [
  [0, {look: [8, 14], mouth: 'smile', brow: 0, rot: 0}],
  [1.2, {look: [10, 4], mouth: 'smile', brow: 0.3, rot: -1}],        // a glance at him
  [2.0, {look: [10, -8], mouth: 'smile', brow: 0.3, rot: -2}],       // turns to the window
  [4.5, {look: [10, -2], mouth: 'smile', brow: 0.5, rot: -1}],       // a kind glance at him
  [5.2, {look: [10, -8], mouth: 'smile', brow: 0.6, rot: -3}],       // points at the window
  [CUT, {look: [8, 14], mouth: 'smile', brow: 0, rot: 0}],
  [7.6, {look: [8, 16], mouth: 'smile', brow: 0.2, rot: 1}],
  [8.2, {look: [10, -6], mouth: 'smile', brow: 0.4, rot: -2}],
  [9.2, {look: [10, -8], mouth: 'o', brow: 0.9, rot: -3}],
  [9.7, {look: [10, -8], mouth: 'smile', brow: 0.7, rot: -3}],
  [12.2, {look: [8, 14], mouth: 'smile', brow: 0.4, rot: 1}],
  [13.1, {look: [10, 2], mouth: 'smile', brow: 0.6, rot: -1}],
  [14.3, {look: [8, 10], mouth: 'smile', brow: 0.4, rot: 2}],
  [14.6, {look: [6, 16], mouth: 'smile', brow: 0.2, rot: 1}],
  [16.3, {look: [10, 2], mouth: 'smile', brow: 0.4, rot: -1}],
  [16.9, {look: [10, 0], mouth: 'smile', brow: 0.9, rot: -3}],        // glances back, unsure
]);
const herBlush = (t: number) => (t < CUT ? 0 : t < 10.0 ? 0 : t < 12.2 ? smooth(t, 10.0, 12.2) * 0.8 : t < 16.4 ? 0.8 : lerp(0.8, 0.5, smooth(t, 16.4, 18)));
const goldLight = (t: number, tv: number) => (t < CUT ? smooth(tv, 5.2, 5.6) : smooth(t, 9.4, 9.9) * (1 - smooth(t, 13.6, 14.2)));

// ------------------------------------------------------------------------------------- the train

const V1 = (v: number) => 1 - smooth(v, 3.3, 3.9);
const V2 = (t: number) => (t < 14 ? 1 - smooth(t, 8.3, 8.9) : smooth(t, 14.0, 15.4));
const travel = (t: number, tv: number) => {
  let s = 0;
  if (t < CUT) { for (let u = 0; u < tv; u += 0.03) s += V1(u) * 0.03; return s * 520; }
  for (let u = CUT; u < Math.min(t, 17.9); u += 0.03) s += V2(u) * 0.03;
  return 2600 + s * 520;
};

// ------------------------------------------------------------------------------------- the camera

const CAM: CamKey[] = [
  {t: 0, x: 660, y: 1050, z: 1.0}, {t: 2.9, x: 640, y: 1060, z: 1.06}, {t: 3.8, x: 600, y: 1100, z: 1.12}, {t: 4.7, x: 600, y: 1090, z: 1.1}, {t: 5.9, x: 660, y: 1050, z: 1.06},
  {t: CUT, x: 660, y: 1050, z: 1.0, cut: true}, {t: 8.0, x: 660, y: 1050, z: 1.0},
  {t: 8.4, x: 540, y: 1100, z: 1.4}, {t: 8.9, x: 540, y: 1100, z: 1.4},
  {t: 9.4, x: 660, y: 980, z: 1.0}, {t: 13.4, x: 660, y: 980, z: 1.0}, {t: 14.0, x: 620, y: 1040, z: 1.0},
  {t: 15.9, x: 640, y: 1040, z: 1.04}, {t: 16.5, x: 650, y: 1050, z: 1.15}, {t: 40, x: 650, y: 1050, z: 1.15},
];

// ------------------------------------------------------------------------------------- the scene

const Carriage: React.FC<{t: number; tv: number; cam: Cam}> = ({t, tv, cam}) => {
  const take1 = t < CUT;
  const tt = tv;
  const p = px(tt);
  const trav = travel(t, tv);
  // sheets
  const drop = 560 * smooth(t, 14.1, 14.35), rise = 560 * (1 - smooth(t, 14.4, 14.65));
  const sheet = take1 ? SHEET_1 : t < 14.37 ? SHEET_2 : SHEET_3;
  const sheetId = sheet === SHEET_1 ? 'p1' : sheet === SHEET_2 ? 'p2' : 'p3';
  const sheetY = PY + (t < 14.37 ? drop : rise);
  // him
  const ph = hisPhone(t, tv);
  const kd = take1 ? smooth(tv, 4.1, 4.45) * (1 - smooth(tv, 4.75, 5.15)) : 0;
  const bump = take1 ? Math.max(0, 1 - Math.abs(tv - 4.0) / 0.12) : 0;
  const dx = 75 * kd, dy = 380 * kd, lean = 25 * kd + 7 * bump;
  const kHold = take1 ? (1 - smooth(tv, 3.05, 3.3)) + smooth(tv, 4.85, 5.15) * (1 - kd * 0) : (1 - smooth(t, 7.55, 7.8));
  const kHoldC = clamp(take1 ? (tv < 4 ? 1 - smooth(tv, 3.05, 3.3) : smooth(tv, 4.85, 5.15)) : kHold);
  const kChase = take1 ? smooth(tv, 4.0, 4.25) * (1 - smooth(tv, 4.75, 5.0)) : 0;
  const kPalm = take1 ? 0 : smooth(t, 8.5, 8.75) * (1 - smooth(t, 10.2, 10.45));
  const actHim = take1 ? {pos: [330, 1200] as [number, number], w: 0} : handFor(ACTS_HIM2, t, [330, 1200]);
  const holdPos: [number, number] = [ph.x - 6 * 1 + 2, ph.y + 78];
  const palmPos: [number, number] = [ph.x + 4, ph.y + 6];
  const chase: [number, number] = [215, 1385];
  let hh: [number, number] = [lerp(actHim.pos[0], holdPos[0], kHoldC), lerp(actHim.pos[1], holdPos[1], kHoldC)];
  hh = [lerp(hh[0], palmPos[0], kPalm), lerp(hh[1], palmPos[1], kPalm)];
  hh = [lerp(hh[0], chase[0], kChase), lerp(hh[1], chase[1], kChase)];
  const himShoulder: [number, number] = [310 - 36 * kHoldC + dx, 1072 + dy];
  const dHim = Math.hypot(hh[0] - himShoulder[0], hh[1] - himShoulder[1]);
  // her
  const stand = take1 ? 0 : smooth(t, 14.5, 14.95), walk = take1 ? 0 : smooth(t, 16.5, 16.95);
  const herX = lerp(885, 930, stand) + 60 * walk, herY = lerp(840, 760, stand);
  const actHer = handFor(take1 ? ACTS_HER1 : ACTS_HER2, tt, [herX - 30, herY + 220]);
  const herPen: [number, number] = [actHer.pos[0] - 40, actHer.pos[1] + 64];
  const herShoulder: [number, number] = [herX, herY + 232];
  const dHer = Math.hypot(herPen[0] - herShoulder[0], herPen[1] - herShoulder[1]);
  const lens = (d: number) => Math.min(215, Math.max(105, 0.57 * d));
  const bl = himBlush(t, tv);
  const hFace: Face = {...himPose(tt), blush: bl, cheek: bl * 0.6};
  const hb = herBlush(t);
  const wFace: Face = {...herPose(tt), blush: hb, cheek: 0.3 + 0.7 * hb};
  const gold = goldLight(t, tv);
  // board, balloon
  const flip = smooth(t, 14.2, 14.6);
  const boardScale = t < 14.1 ? 1 - smooth(t, 8.0, 8.3) : smooth(t, 14.2, 14.5);
  const nextStop = t >= 14.1;
  const rise2 = smooth(t, 9.1, 10.0);
  const balloon = !take1 && t >= 9.09 ? {x: 730 - (t - 9.1) * 3, y: lerp(800, 562, rise2) - (t - 9.1) * 2, s: 1.0} : null;
  // booklet + her phone (carried off when she stands)
  const bookK = take1 ? 0 : smooth(t, 14.5, 14.9);
  const bookX = lerp(BK.x, herX, bookK), bookY = lerp(BK.y, herY + 330, bookK);
  const phHer = herPhone(t);
  const carryHerPhone = {...phHer, x: lerp(phHer.x, bookX, bookK), y: lerp(phHer.y, bookY + 10, bookK)};
  const bookOp = 1 - smooth(t, 14.75, 14.95);
  const pk = take1 ? smooth(tt, 4.6, 4.95) : smooth(t, 9.2, 9.5) * (1 - smooth(t, 10.9, 11.2));
  const armBehind = pk > 0.15;
  const showPen = actHer.w > 0.05 && !(!take1 && t > 7.5 && t < 8.45);
  const himPenW = actHim.w;

  return <>
    <g transform={planeT(cam, 0.85)}>
      <Wall /><Window t={tv} off={trav} balloon={balloon} /><Sign />
    </g>
    <g transform={planeT(cam, 0.95)}>
      <SeatBack x={150} /><SeatBack x={760} />
    </g>
    <g transform={planeT(cam, 1)}>
      <Door open={0} />
      <g transform={`translate(915 640) scale(1 ${Math.max(boardScale, 0.03)})`}>
        {nextStop ? <Sign x={0} y={0} w={330} h={108} text="NEXT STOP" fill={C.rust} size={52} /> : <Sign x={0} y={0} w={330} h={108} text="7:42 SERVICE" fill={C.green} size={36} />}
      </g>
      <Soft box={[0, 700, 1300, 700]} dx={26} dy={20} blur={16} op={0.28}>
        <rect x={150} y={790} width={250} height={640} rx={46} fill="#000" />
        <rect x={760} y={790} width={250} height={640} rx={46} fill="#000" />
      </Soft>
      <Soft box={[0, 680, 1300, 700]} dx={18} dy={14} blur={10} op={0.3}>
        <g transform={`translate(${275 + dx} ${840 + dy}) rotate(${lean})`}><path d="M -70 62 L 50 62 C 96 70 122 112 128 176 L 132 560 L -122 560 L -112 124 C -108 92 -96 72 -70 62 Z" fill="#000" /><circle r={64} /></g>
        <g transform={`translate(${herX} ${herY}) scale(-1 1)`}><path d="M -70 62 L 50 62 C 96 70 122 112 128 176 L 132 560 L -122 560 L -112 124 C -108 92 -96 72 -70 62 Z" fill="#000" /><circle r={64} /></g>
      </Soft>
      <g transform={`translate(${dx} ${dy}) rotate(${lean} 275 840)`}><Him t={tt} face={hFace} /></g>
      <Her t={t} face={wFace} x={herX} y={herY} flutter={Math.sin(t * 2.4) * (1 - stand * 0.6)} />
      {gold > 0.01 && <g opacity={gold}>
        <defs><radialGradient id="goldg"><stop offset="0" stopColor="#FFC24D" stopOpacity={0.95} /><stop offset="1" stopColor="#FFC24D" stopOpacity={0} /></radialGradient></defs>
        <circle cx={herX - 40} cy={herY + 6} r={135} fill="url(#goldg)" />
      </g>}
      <Table />
      {armBehind && <g>
        {showPen && <Pen x={actHer.pos[0]} y={actHer.pos[1]} dir={-1} />}
        <Arm shoulder={herShoulder} hand={herPen} coat={C.coatHer} skin={C.skinHer} lens={lens(dHer)} />
      </g>}
      <Soft box={[250, 800, 1000, 700]} dx={10} dy={16} blur={9} op={0.34}>
        <rect x={p - PW / 2} y={sheetY - 125} width={PW} height={250 + ((sheet as SheetSpec & {extra?: number}).extra ?? 0)} rx={10} fill="#000" />
      </Soft>
      <g transform={`translate(${p} ${sheetY})`}><Paper t={tt} s={sheet} id={sheetId} /></g>
      {!take1 && t >= 12.4 && t < 14.37 && <g transform={`translate(${p} ${sheetY})`}>
        <path d="M -210 86 L -192 108 L -146 60" stroke={C.green} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - clamp((t - 12.4) / 0.3)} />
        <g opacity={clamp((t - 12.7) / 0.1)}>
          <path d="M -40 48 C -72 48 -76 96 -52 104 L -28 104 C -4 96 0 48 -40 48 Z" stroke={C.green} strokeWidth={5} fill={C.orange} fillOpacity={clamp((t - 13.1) / 0.2)} strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - clamp((t - 12.7) / 0.45)} />
          <path d="M -50 104 L -46 116 L -34 116 L -30 104" stroke={C.green} strokeWidth={4} fill="none" strokeLinecap="round" opacity={clamp((t - 13.1) / 0.15)} />
        </g>
      </g>}
      {!take1 && <g opacity={1 - smooth(t, 14.5, 14.8)}><LockPhone p={carryHerPhone} scale={1.15} id="hp" clock={false} /></g>}
      {take1 && <LockPhone p={{x: 886, y: 1128, rot: 12, lit: 0, down: false, sq: 1}} scale={1.15} id="hp1" clock={false} />}
      <g opacity={bookOp}><Booklet x={bookX} y={bookY} /></g>
      {(kHoldC >= 0.5 || kPalm >= 0.5) && <LockPhone p={ph} scale={1.35} id="hl" />}
      <g>
        {himPenW > 0.05 && <Pen x={actHim.pos[0]} y={actHim.pos[1]} dir={1} />}
        <Arm shoulder={himShoulder} hand={himPenW > 0.05 ? [actHim.pos[0] + 40, actHim.pos[1] + 64] : hh} coat={C.rust} skin={C.skinHim} lens={himPenW > 0.05 && kHoldC < 0.5 && kPalm < 0.5 ? lens(dHim) : lens(dHim)} />
      </g>
      {kHoldC < 0.5 && kPalm < 0.5 && <LockPhone p={ph} scale={1.35} id="hl" />}
      {!armBehind && <g>
        {showPen && <Pen x={actHer.pos[0]} y={actHer.pos[1]} dir={-1} />}
        <Arm shoulder={herShoulder} hand={herPen} coat={C.coatHer} skin={C.skinHer} lens={lens(dHer)} />
      </g>}
      <BenchFront />
      <rect x={-900} y={1290} width={3000} height={2400} fill={C.greenDark} />
      <rect x={-900} y={1290} width={3000} height={10} fill={C.rust} />
    </g>
    {<g transform={planeT(cam, 1.3)}>
      <rect x={-6} y={-400} width={20} height={3000} fill={C.rust} opacity={0.9} />
    </g>}
  </>;
};

const VoteScene: React.FC<{t: number}> = ({t}) => {
  const pulse = (a: number) => Math.max(0, 1 - Math.abs(t - a) / 0.25);
  const tapAt = t - B.tap;
  const age = t - B.choice;
  const pop = age < 0.2 ? 1 + 0.12 * (1 - age / 0.2) : 1;
  return <g>
    <PosterBg t={t} />
    <g transform={`translate(540 500) rotate(-2) scale(${pop}) translate(-540 -500)`}>
      <rect x={256} y={448} width={600} height={104} rx={12} fill={C.rust} />
      <rect x={246} y={438} width={600} height={104} rx={12} fill={C.paper} stroke={C.ink} strokeWidth={5} />
      <text x={546} y={512} textAnchor="middle" fontFamily={JOST} fontWeight={600} fontSize={60} fill={C.ink}>{spec.choices.clue}</text>
    </g>
    <VoteCard k="A" word={spec.choices.A.l1} len={spec.choices.A.l2} sub={spec.choices.A.sub} subX={590} subSize={50} y={590} age={t - B.cardA} tint={C.green} pulse={pulse(B.tap) + pulse(B.tap + 1.0)} />
    <VoteCard k="B" word={spec.choices.B.l1} len={spec.choices.B.l2} sub={spec.choices.B.sub} subX={590} subSize={50} y={880} age={t - B.cardB} tint={C.rust} pulse={pulse(B.tap + 0.5) + pulse(B.tap + 1.5)} />
    {tapAt > 0 && [0, 0.5, 1.0, 1.5].map((d, i) => {
      const a = tapAt - d, cy = i % 2 ? 1070 : 780;
      return a > 0 && a < 0.5 ? <circle key={i} cx={900} cy={cy} r={20 + a * 160} fill="none" stroke={C.ink} strokeWidth={6} opacity={1 - a * 2} /> : null;
    })}
  </g>;
};

const EndCard: React.FC<{t: number}> = ({t}) => {
  const k = smooth(t, B.endcard - 0.02, B.endcard + 0.22);
  if (k <= 0) return null;
  const a = t - B.endcard;
  return <g transform={`translate(0 ${(1 - k) * 1950})`}>
    <PosterBg t={t} dark />
    <rect x={150} y={820} width={780} height={150} rx={16} fill={C.cream} opacity={0.12} />
    {Array.from({length: 7}, (_, i) => <rect key={i} x={158 + i * 110} y={836} width={100} height={118} rx={8} fill={C.paper} stroke={C.ink} strokeWidth={5} opacity={clamp((a - 0.1 - i * 0.05) * 6)} />)}
  </g>;
};

const Scene: React.FC<{t: number; hook: Hook}> = ({t, hook}) => {
  const tv = tvOf(t);
  const c0 = camAt(CAM, tv);
  // brakes tremble (3.3-3.9), the jolt at 3.9 (0.25 s shake); a gentle halt in take 2
  const trem = tv > 3.3 && tv < 3.9 && t < CUT ? Math.sin(tv * 90) * 2.5 * smooth(tv, 3.3, 3.6) : 0;
  const ja = t < CUT ? tv - 3.9 : -1;
  const shake = ja >= 0 && ja < 0.25 ? 1 - ja / 0.25 : 0;
  const jx = shake * Math.sin(ja * 110) * 16 + trem, jy = shake * Math.cos(ja * 95) * 11;
  const soft = t > 8.3 && t < 9.2 ? Math.sin((t - 8.3) * 7) * 3 * (1 - smooth(t, 8.9, 9.2)) : 0;
  const cam = {...c0, x: c0.x + jx, y: c0.y + jy + soft};
  const rewinding = t >= 6.2 && t <= 6.8;
  const inTrain = rewinding || (t >= 6.6 - 0.02 && t <= 6.6 + 0.82) || (t >= B.train2 - 0.02 && t <= B.train2 + 0.82);
  const voteOn = t >= B.train2 + TRAIN_CUT;
  const S = (text: string, y: number, from: number, to: number, size: number, rot: number, hue: 'ink' | 'orange' | 'cream' = 'ink', fade = true, maxW = 960) =>
    t >= from && t <= to ? <Strip text={text} y={y} age={from === 0 ? 1 + t : t - from} out={fade ? smooth(t, to - 0.12, to) : 0} size={size} rot={rot} hue={hue} maxW={maxW} /> : null;
  return <MotionBlurWhen fast={inTrain} samples={5} shutter={220}>
    <AbsoluteFill>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, background: C.cream}}>
        {!voteOn && <Carriage t={t} tv={tv} cam={cam} />}
        {voteOn && <VoteScene t={t} />}
        <EndCard t={t} />
        <PassingTrain t={t} t0={6.6} dir={-1} />
        <PassingTrain t={t} t0={B.train2} dir={1} />
        {/* hook strip: the only thing that differs between variants */}
        {t < 3.0 && <Strip text={(spec.hooks as Record<string, string>)[hook]} y={350} age={1 + t} out={smooth(t, 2.8, 3.0)} size={78} rot={0} maxW={1040} />}
        {S('her crossword clue for me. I check my phone.', 1125, 0, 2.9, 64, -0.6, 'ink', true, 1040)}
        {S('take 1: SCREEN', 337, 3.0, 6.1, 92, -1.5, 'orange')}
        {S('I looked down. she looked out.', 1190, 5.0, 6.1, 74, 1, 'ink', true, 1060)}
        {S('rewind. eyes up this time.', 345, 6.2, 7.1, 84, 1, 'ink', false, 1060)}
        {S('take 2: WINDOW', 337, 7.2, 14.0, 92, 1.5, 'cream')}
        {S('phones face down. both.', 1190, 7.5, 8.8, 88, -1)}
        {S('found it. together.', 1195, 12.4, 13.9, 88, -1)}
        {S('her stop is next.', 1190, 14.2, 16.0, 86, 1, 'ink', true, 1060)}
        {S('one more clue. four boxes.', 1190, 16.1, 17.7, 84, -1, 'ink', true, 1060)}
        {S('what should I write?', 350, 17.87, B.endcard, 86, -1, 'ink')}
        {S('comment A or B', 1190, 21.4, B.endcard, 80, 1, 'ink')}
        {t >= B.endcard && <Strip text="seven across" y={380} age={t - B.endcard} out={0} size={124} rot={0} hue="orange" />}
        {t >= B.endcard + 0.15 && <Strip text="part 5 · comment A or B" y={600} age={t - B.endcard - 0.15} out={0} size={66} rot={0} hue="cream" />}
      </svg>
    </AbsoluteFill>
  </MotionBlurWhen>;
};

export const Across4: React.FC<{hook?: Hook}> = ({hook = 'a'}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  return <AbsoluteFill style={{background: C.cream}}>
    <Audio src={staticFile('audio/across-ep4-room.wav')} volume={0.55} />
    <Audio src={staticFile('audio/across-ep4-music.wav')} volume={0.8} />
    <Audio src={staticFile('audio/across-ep4-sfx.wav')} volume={0.9} />
    <Scene t={t} hook={hook} />
  </AbsoluteFill>;
};
