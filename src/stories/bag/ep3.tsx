import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, lerp, smooth} from '../../lib/motion';
import {MotionBlurWhen} from '../../lib/shots';
import {
  Bag, BARLOW, C, Cam, Defs, EndCard, FarBelt, Floor, FlapRim, HallWall, Hand, KraftTag, Label, Mouth, NearBelt, NearRail, Pen, Person, Phone, Pose,
  Strip, TagLine, VoteBg, VoteCard, WIPE_DUR, flapEdge, planeT, tagGeom, textW,
} from './world';
import spec from '../../../specs/stories/bag-ep3.json';

// Same Bag, part 3 "Stuck zip". Silent. Frame 1 fully drawn: ONE strip (the hook), his phone lit mid-swipe, her suitcase with the
// front zip jammed and her phone half stuck in it. Take 1: he yanks, the tab pops off, he trips over his bag and rides the belt.
// Rewind (reversed belt-flap wipe). Take 2: he asks on a tag, works the zip slowly while his pocket buzzes (he lets it), phone
// pops free, she writes back, he switches his phone off. Cliff: the board flips, her ride is delayed. Vote board, end card.

export const BAG3_FPS = 60;
export const BAG3_FRAMES = Math.round(spec.duration * BAG3_FPS);
export type Hook = 'a' | 'b';
const B = spec.beats;
const WIPE_AT = B.voteWipe;
const VOTE_AT = WIPE_AT + WIPE_DUR;
const RW0 = B.rewind, RW1 = B.take2;

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
const JOSTF = '"Jost", sans-serif';

// ------------------------------------------------------------------------------------------ shots
type ShotId = 'A' | 'B' | 'Y' | 'tag1' | 'N' | 'Z' | 'tag2' | 'T' | 'C' | 'vote' | 'end';
const SHOTS: [number, ShotId][] = [[0, 'A'], [3.0, 'B'], [5.3, 'Y'], [RW1, 'tag1'], [12.5, 'N'], [14.4, 'Z'], [17.4, 'tag2'], [19.7, 'T'], [21.8, 'C'], [VOTE_AT, 'vote'], [B.endcard, 'end']];
const shotAt = (t: number): ShotId => keyAt(SHOTS, t);
const shotStart = (t: number) => { let s = 0; for (const [a] of SHOTS) if (t >= a) s = a; return s; };

type Fig = {x: number; y: number; s: number};
const PY = 815;
const LAYOUT: Record<string, {him: Fig; her: Fig; cam: Cam}> = {
  A: {him: {x: 290, y: PY, s: 1}, her: {x: 920, y: PY, s: 1}, cam: {x: 540, y: 960, z: 1.0}},
  B: {him: {x: 250, y: PY, s: 1.05}, her: {x: 880, y: PY, s: 1}, cam: {x: 540, y: 960, z: 1.0}},
  Y: {him: {x: 290, y: PY, s: 1}, her: {x: 930, y: PY, s: 1}, cam: {x: 540, y: 1080, z: 1.0}},
  N: {him: {x: 290, y: PY, s: 1}, her: {x: 880, y: PY, s: 1}, cam: {x: 540, y: 960, z: 1.0}},
  Z: {him: {x: 300, y: PY, s: 1}, her: {x: 880, y: PY, s: 1}, cam: {x: 530, y: 1040, z: 1.14}},
  T: {him: {x: 300, y: PY + 20, s: 1.1}, her: {x: 860, y: PY + 20, s: 1.1}, cam: {x: 540, y: 960, z: 1.02}},
  C: {him: {x: 290, y: PY + 70, s: 1}, her: {x: 860, y: PY + 70, s: 1}, cam: {x: 540, y: 960, z: 1.0}},
};
const layoutOf = (t: number) => LAYOUT[shotAt(t)] ?? LAYOUT.A;

// ------------------------------------------------------------------------------------------ events
const POP = B.pop;            // tab pops off
const LAND = B.land;
const TIP = B.tipOver;
const FREE = B.free;
const HB_Y = {x: 680, y: 1125, s: 1.3};
const hbOf = (id: string) => id === 'A' ? {x: 600, y: 1100, s: 1.5} : id === 'Y' ? HB_Y : {x: 620, y: 1125, s: 1.3};   // her held bag
const HB = HB_Y;
const TAB0 = {x: HB.x + 60 * HB.s, y: HB.y + 44 * HB.s};
const PINK = '#F0567A';   // her phone case
/** Arm with an elbow: upper arm shoulder -> elbow, then a hand (forearm) elbow -> hand. */
const Arm: React.FC<{who: 'him' | 'her'; sh: [number, number]; el: [number, number]; x: number; y: number; rot?: number; style?: 'fist' | 'open' | 'point'; scale?: number; opacity?: number}> = ({who, sh, el, x, y, rot = 0, style = 'fist', scale = 1, opacity = 1}) => (
  <g opacity={opacity}>
    <line x1={sh[0]} y1={sh[1]} x2={el[0]} y2={el[1]} stroke={C.ink} strokeOpacity={0.12} strokeWidth={96 * scale} strokeLinecap="round" transform="translate(10 14)" />
    <line x1={sh[0]} y1={sh[1]} x2={el[0]} y2={el[1]} stroke={who === 'him' ? C.olive : C.camel} strokeWidth={94 * scale} strokeLinecap="round" />
    <Hand who={who} x={x} y={y} rot={rot} base={el} style={style} scale={scale} />
  </g>
);

// ------------------------------------------------------------------------------------------ poses
const HIM_LOOK: KF[] = [[0, -0.6, 0.8], [1.5, -0.6, 0.8], [1.75, 0.95, 0.2], [2.8, 0.9, 0.3], [3.2, 0, 0.1], [5.2, 0, 0.1], [5.4, 0.8, 0.7], [6.3, 0.8, 0.7], [6.5, 0, -0.5],
  [7.5, 0.9, 0.4], [9.6, 0.9, 0.3], [10.6, 0.9, 0.3], [12.5, 0.9, 0.3], [12.9, 0.9, 0.3], [13.05, -0.8, 0.9], [13.5, -0.8, 0.9], [13.7, 0.6, 0.6], [15.4, 0.6, 0.7], [15.5, 0.6, 0.7],
  [16.6, 0.6, 0.7], [16.8, 0.9, 0.2], [19.7, 0.9, 0.3], [20.2, -0.5, 0.9], [20.9, -0.5, 0.9], [21.2, 0.9, 0.2], [21.8, 0, -0.9], [22.5, 0.2, -0.9]];
const HER_LOOK: KF[] = [[0, -0.5, 0.9], [1.5, -0.5, 0.9], [1.8, -0.9, 0.3], [2.6, -0.5, 0.8], [5.3, -0.9, 0.3], [6.4, -0.9, 0.5], [7.4, -0.9, 0.4], [9.6, -0.9, 0.3], [12.2, 0, 0.9], [12.5, 0, 0.9], [13.0, -0.7, 0.4],
  [14.4, -0.4, 0.8], [16.6, -0.4, 0.8], [16.9, -0.9, 0.3], [19.7, -0.6, 0.3], [20.4, -0.6, 0.5], [21.5, -0.9, 0.3], [21.8, 0, -0.9]];
const HIM_MOUTH: [number, Mouth][] = [[0, 'flat'], [1.7, 'o'], [2.6, 'flat'], [3.2, 'smirk'], [5.4, 'grit'], [6.3, 'o'], [7.4, 'gulp'], [8.2, 'soft'], [9.2, 'smile'], [10.6, 'flat'], [12.6, 'soft'], [13.1, 'grit'], [13.7, 'flat'],
  [16.6, 'o'], [16.9, 'smile'], [19.7, 'flat'], [20.9, 'soft'], [21.4, 'smile'], [21.8, 'flat'], [22.5, 'o']];
const HER_MOUTH: [number, Mouth][] = [[0, 'soft'], [1.7, 'o'], [2.6, 'soft'], [3.2, 'smirk'], [6.3, 'o'], [6.9, 'smile'], [9.6, 'soft'], [10.6, 'smirk'], [12.5, 'soft'], [14.4, 'soft'], [16.6, 'o'], [16.9, 'smile'], [19.7, 'smile'], [21.8, 'soft'], [22.6, 'o']];
const blinkAt = (t: number, seed: number) => { const ph = (t + seed) % 3.7; return ph < 0.14 ? Math.sin((ph / 0.14) * Math.PI) : 0; };

const himPose = (t: number): Pose => {
  const [lx, ly] = kf(HIM_LOOK, t);
  const frozen = t >= B.freeze && t < 2.4;
  const pomp = smooth(t, 3.2, 3.5) * (1 - smooth(t, 5.2, 5.4));
  const strain = smooth(t, 5.4, 5.7) * (1 - smooth(t, POP, POP + 0.05));
  const shock = smooth(t, POP, POP + 0.1) * (1 - smooth(t, 9.4, 9.6));
  const glad = t >= 16.9 && t < 19.7 || t >= 21.4 && t < 21.8;
  const sweat = 0.7 * Math.max(strain, shock * 0.6) * (1 - smooth(t, 9.0, 9.6));
  const flush = Math.max(smooth(t, 1.7, 2.4) * (1 - smooth(t, 3.4, 4.0)), strain, shock * 0.8, smooth(t, 16.9, 17.2) * 0.4);
  return {look: [lx, ly], brow: 0.15 + (frozen ? 0.6 : 0) + pomp * 0.5 + strain * 0.5 + shock * 0.9 + (t > 22 ? 0.7 : 0), worry: strain * 0.4 + shock * 0.5,
    mouth: keyAt(HIM_MOUTH, t), happy: glad, sweat, gulp: 0, tilt: glad ? Math.sin(t * 12) * 2 : pomp ? -5 * pomp + Math.sin(t * 3) * 1.5 : strain ? Math.sin(t * 40) * 3 : frozen ? 0 : Math.sin(t * 0.9) * 1.1,
    bob: glad ? -Math.abs(Math.sin(t * 12)) * 5 : 0, blink: frozen || pomp > 0.5 ? 0 : blinkAt(t, 0.4), sway: frozen ? 0 : 1, flush};
};
const herPose = (t: number): Pose => {
  const [lx, ly] = kf(HER_LOOK, t);
  const amused = t >= 6.9 && t < 9.6;
  const glad = t >= 16.9 && t < 19.7 || t >= 19.7 && t < 21.8;
  const nod = t >= 12.6 && t < 13.1 ? Math.sin(wp(t, 12.6, 13.1) * Math.PI * 2) * 4 : 0;
  const huh = t < 1.7 ? 0 : 0;
  return {look: [lx, ly], brow: (t < 1.7 ? 0.35 : 0.1) + (t >= POP && t < 6.9 ? 0.7 : 0) + (t >= 22.5 ? 0.6 : 0) + huh, browR: 0.1, worry: 0, mouth: keyAt(HER_MOUTH, t), happy: amused || (t >= 17 && t < 19.7), sweat: 0, gulp: 0,
    tilt: amused ? Math.sin(t * 17) * 3 : glad ? Math.sin(t * 9 + 1) * 2 : Math.sin(t * 0.8 + 2) * 1.2 + nod + (t < 3 ? 4 : 0), bob: amused ? -Math.abs(Math.sin(t * 17)) * 5 : 0, blink: blinkAt(t, 1.9), sway: 1, flush: 0};
};

// ------------------------------------------------------------------------------------------ belt (slows while he rides)
const BELT_SPEED = 300;
const beltPos = (t: number) => BELT_SPEED * t - 150 * (clamp(t, 6.8, 9.6) - 6.8);
const FLOOR_Y = 1592;
const HIS_FLOOR = {x: 150, y: FLOOR_Y}, HERS_FLOOR = {x: 940, y: FLOOR_Y};

const swipeOf = (ticks: number[], t: number) => {
  let idx = -1;
  for (let i = 0; i < ticks.length; i++) if (ticks[i] <= t) idx = i;
  if (idx < 0) return {p: 0, dir: 1};
  return {p: clamp((t - ticks[idx]) / 0.26), dir: idx % 2 ? -1 : 1};
};
const HIM_TICKS = [-0.1, ...spec.audio.swipeTicks];

// ------------------------------------------------------------------------------------------ whole-frame tag inserts
type InsLine = [string, number, number];
type Ins = {t0: number; t1: number; who: 'him' | 'her'; lines: InsLine[]; H: number; size: number; slide: number};
const INS: Record<string, Ins> = {
  tag1: {t0: RW1, t1: 12.5, who: 'him', lines: [['(can I try?)', 10.8, 11.8]], H: 460, size: 150, slide: 12.2},
  tag2: {t0: 17.4, t1: 19.7, who: 'her', lines: [['(can I try?)', 0, 0], ['(my hero.', 17.7, 18.3], ['mildly.)', 18.3, 18.9]], H: 640, size: 150, slide: 0},
};
const INSERT_BG = (t: number) => <g>
  <g filter="url(#blurSoft)"><HallWall /><NearBelt pos={beltPos(t)} /><Floor /></g>
  <rect x={-100} y={-100} width={1300} height={2200} fill={C.concrete} opacity={0.72} />
</g>;

const TagInsert: React.FC<{t: number; id: keyof typeof INS}> = ({t, id}) => {
  const c = INS[id];
  const age = t - c.t0;
  const pop = 0.92 + 0.08 * (1 - Math.pow(1 - clamp(age / 0.2), 3));
  const W = 920;
  const lines: TagLine[] = c.lines.map(([txt, a, b]) => ({txt, p: a === 0 ? 1 : wp(t, a, b)}));
  const g = tagGeom(W, c.H, lines.length, lines.map((l) => l.txt), c.size);
  const written = c.lines.map(([, a, b], i) => (a > 0 ? {i, a, b} : null)).filter(Boolean) as {i: number; a: number; b: number}[];
  const w0 = written[0].a - 0.25, w1 = written[written.length - 1].b + 0.35;
  let li = written[0].i;
  for (const w of written) if (t >= w.a - 0.02) li = w.i;
  const p = lines[li].p;
  const px = g.x0 + g.widths[li] * p, py = g.ys[li] + 4 + Math.sin(t * 40) * 3;
  const penOn = t >= w0 && t < w1;
  const approach = 1 - smooth(t, w0, w0 + 0.25), leave = smooth(t, w1 - 0.35, w1);
  const off = Math.max(approach, leave) * 400;
  const tx = px + off, ty = py + off * 0.8;
  const sl = c.slide ? smooth(t, Math.abs(c.slide), Math.abs(c.slide) + 0.25) : 0;
  const sx = Math.sign(c.slide || 1) * 1200 * sl * sl;
  return <g>
    {INSERT_BG(t)}
    <g transform={`translate(${540 + sx} ${c.H > 550 ? 780 : 760}) rotate(-2) scale(${pop})`}>
      <KraftTag w={W} h={c.H} lines={lines} size={c.size} id={`ti${id}`} string={false} />
      {penOn && <g>
        <Pen x={tx} y={ty} rot={50} cap={t < spec.audio.penCaps[0] + 0.4 && id === 'tag1'} />
        <Arm who={c.who} sh={[tx + 600, ty + 560]} el={[tx + 400, ty + 130]} x={tx + 140} y={ty - 120} rot={20} scale={1.0} />
      </g>}
    </g>
  </g>;
};

// ------------------------------------------------------------------------------------------ small parts
/** Board with the take-1 look and a flipped state: RIDE / DELAYED 40 MIN. */
const Board3: React.FC<{flip: number; y: number}> = ({flip, y}) => {
  const states = [
    [{txt: 'ARRIVALS', x: 390, w: 330, col: C.amber}, {txt: 'BELT 4', x: 700, w: 280, col: '#fff'}],
    [{txt: 'RIDE', x: 290, w: 200, col: '#fff'}, {txt: 'DELAYED 40 MIN', x: 670, w: 470, col: C.amber}],
  ];
  const half = flip > 0.5 ? 1 : 0;
  const sy = Math.max(0.04, Math.abs(Math.cos(flip * Math.PI)));
  return <g>
    <rect x={150} y={y - 66} width={780} height={132} rx={20} fill={C.carbon} />
    <rect x={150} y={y - 66} width={780} height={12} rx={6} fill="#4A4A52" />
    {states[half].map((c, i) => <g key={i} transform={`translate(${c.x} ${y}) scale(1 ${sy})`}>
      <rect x={-c.w / 2} y={-44} width={c.w} height={88} rx={10} fill="#2A2A2F" stroke="#000" strokeWidth={3} />
      <text x={0} y={22} textAnchor="middle" fontFamily={BARLOW} fontWeight={700} fontSize={textW(c.txt, `700 66px ${BARLOW}`) + 3 * c.txt.length > c.w - 30 ? 54 : 66} letterSpacing={3} fill={c.col}>{c.txt}</text>
      <line x1={-c.w / 2} x2={c.w / 2} y1={0} y2={0} stroke="#000" strokeWidth={3} opacity={0.5} />
    </g>)}
    <rect x={250} y={y - 110} width={10} height={44} fill={C.carbon} /><rect x={820} y={y - 110} width={10} height={44} fill={C.carbon} />
  </g>;
};

/** The amber zip pull-tab as a flying object. */
const FlyTab: React.FC<{x: number; y: number; rot: number; s?: number}> = ({x, y, rot, s = 1}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <rect x={-22} y={-24} width={44} height={48} rx={14} fill={C.carbon} transform="translate(5 7)" opacity={0.25} />
    <rect x={-22} y={-24} width={44} height={48} rx={14} fill={C.amber} stroke={C.carbon} strokeWidth={5} />
    <circle cx={0} cy={-8} r={7} fill={C.concrete} stroke={C.carbon} strokeWidth={3} />
  </g>
);

/** His phone peeking out of the jacket pocket, buzzing. */
const PocketPhone: React.FC<{x: number; y: number; buzz: boolean; t: number}> = ({x, y, buzz, t}) => {
  const j = buzz ? Math.sin(t * 90) * 4 : 0;
  return <g transform={`translate(${x + j} ${y})`}>
    {buzz && <circle cy={-40} r={150} fill="url(#glowSky)" opacity={0.7} />}
    <rect x={-52} y={-110} width={104} height={150} rx={18} fill={C.carbon} />
    <rect x={-42} y={-102} width={84} height={120} rx={12} fill="url(#scr)" />
    <rect x={-26} y={-86} width={52} height={62} rx={8} fill="#fff" opacity={0.7} />
    <path d="M -82 -6 L 82 -6 L 76 120 L -76 120 Z" fill={C.oliveDeep} stroke={C.carbon} strokeWidth={5} strokeLinejoin="round" />
    <line x1={-70} y1={14} x2={70} y2={14} stroke={C.carbon} strokeWidth={4} strokeDasharray="8 6" />
    {buzz && [-1, 1].map((sd) => [0, 1].map((k) => <path key={`${sd}${k}`} d={`M ${sd * (84 + k * 24)} -80 q ${sd * 14} 36 0 72`} fill="none" stroke={C.sky} strokeWidth={8} strokeLinecap="round" opacity={0.9 - k * 0.3} />))}
  </g>;
};

/** Him lying on his back on the belt, legs up. Origin at the head centre; the body runs along +x after rot -90. */
const Lying: React.FC<{x: number; y: number; rot: number; s: number; t: number; pose: Pose; kick: number}> = ({x, y, rot, s, t, pose, kick}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <Person who="him" x={0} y={0} s={1} t={t} pose={pose} seed={0.4} />
    {[-1, 1].map((sd) => <g key={sd} transform={`translate(${sd * 120} 880) rotate(${-100 + sd * 14 + sd * kick})`}>
      <rect x={-85} y={0} width={170} height={420} rx={40} fill="#3B4256" stroke={C.carbon} strokeWidth={6} />
      <rect x={-96} y={380} width={192} height={70} rx={30} fill="#fff" stroke={C.carbon} strokeWidth={6} />
      <rect x={-96} y={430} width={192} height={40} rx={18} fill={C.carbon} />
    </g>)}
  </g>
);

const Poof: React.FC<{x: number; y: number; k: number}> = ({x, y, k}) => {
  if (k <= 0 || k >= 1) return null;
  return <g transform={`translate(${x} ${y})`} opacity={1 - k}>
    {[0, 1, 2, 3, 4, 5].map((i) => {
      const a = (i / 6) * Math.PI - Math.PI, r = 40 + k * 130;
      return <circle key={i} cx={Math.cos(a) * r} cy={Math.sin(a) * r * 0.6} r={34 + 30 * k - i * 2} fill="#F7F4EC" stroke={C.carbon} strokeWidth={5} />;
    })}
    {[0, 1, 2, 3, 4].map((i) => <path key={`s${i}`} d={`M 0 ${-60 - k * 40} L 0 ${-100 - k * 70}`} stroke={C.amber} strokeWidth={9} strokeLinecap="round" transform={`rotate(${-80 + i * 40})`} />)}
  </g>;
};

// ------------------------------------------------------------------------------------------ hall (main scene)
const Hall: React.FC<{t: number}> = ({t}) => {
  const id = shotAt(t);
  const L0 = layoutOf(t);
  const L = {...L0, him: {...L0.him}};
  const lt = t - shotStart(t);
  const cam: Cam = {x: L.cam.x + Math.sin(t * 0.7) * 4 + lt * 3, y: L.cam.y + Math.sin(t * 1.0) * 3, z: L.cam.z * (1 + 0.012 * Math.min(1, lt / 2.5))};
  const pos = beltPos(t);
  const him = himPose(t), her = herPose(t);
  const hs = swipeOf(HIM_TICKS, t);
  const mid: React.ReactNode[] = [];     // plane 0.9: hands, phones
  const front: React.ReactNode[] = [];   // plane 1.0 after the floor bags
  const lateFront: React.ReactNode[] = [];

  const heldShot = id === 'A' || id === 'B' || id === 'Y' || id === 'N' || id === 'Z';
  const pastTake1 = t >= RW1;
  const tabOff = !pastTake1 && id === 'Y' && t >= POP;            // tab lost during take 1
  let zipX = 60, jam = 1, tug = 0, phoneFree = false;
  let hisUp = true;                                              // upright him drawn

  // ---- her held bag (A, B, Y, N, Z)
  if (id === 'A') tug = Math.sin(t * 20) * Math.max(0, Math.sin(t * 2.4 - 0.6)) * 1.0;
  if (id === 'B') tug = Math.sin(t * 18) * Math.max(0, Math.sin(t * 2 + 1)) * 0.5;
  if (id === 'Z') {
    const w = smooth(t, 14.7, 14.9) * (1 - smooth(t, 16.4, 16.6));
    const slideOut = smooth(t, 16.4, 16.65);
    const close = smooth(t, 16.85, 17.2);
    zipX = lerp(60 + Math.sin((t - 14.7) * 4.2) * 9 * w, -52, slideOut);
    zipX = lerp(zipX, 60, close);
    jam = t < 16.6 ? 1 : 0;
    phoneFree = t >= 16.6;
    tug = t < 14.9 ? 0 : Math.sin(t * 9) * 0.25 * w;
  }
  if (id === 'N') tug = 0;

  const HBc = hbOf(id);
  const sc = HBc.s;
  const pocketBuzz = (t >= 13.0 && t < 13.5) || (t >= 15.5 && t < 15.95) || (t >= 19.85 && t < 20.25);

  // ---- A: his phone, lit mid-swipe
  if (id === 'A') {
    const moveDown = smooth(t, 2.2, 2.55);
    const lit = 1 - 0.7 * moveDown;
    mid.push(<Phone key="ph" who="him" x={215} y={1125 + 440 * moveDown} rot={-6 + 8 * moveDown} scale={1.3} p={t < B.freeze ? hs.p : 0} dir={hs.dir} thumb={t < B.freeze ? 1 : 0} lit={lit} base={[250, 2150]} />);
  }

  // ---- B: he flexes
  if (id === 'B') {
    const up = smooth(t, 3.3, 3.6) * (1 - smooth(t, 5.1, 5.3));
    const sh = Math.sin(t * 22) * 4 * up;
    const hx = L.him.x;
    [-1, 1].map((sd) => front.push(<g key={`fx${sd}`}>
      <Arm who="him" sh={[hx + sd * 240, 1020]} el={[hx + sd * 400, 1200 - up * 60]} x={hx + sd * 300 + sh * sd} y={lerp(1330, 950, up)} rot={sd * -14} scale={0.95} />
      {up > 0.6 && <g stroke={C.amber} strokeWidth={9} strokeLinecap="round">{[0, 1, 2].map((i) => <line key={i} x1={hx + sd * (370 + i * 12)} y1={930 - i * 40} x2={hx + sd * (410 + i * 22)} y2={900 - i * 56} />)}</g>}
    </g>));
  }

  // ---- Y: yank, pop, trip, belt ride
  let lying: React.ReactNode = null;
  let flyTab: React.ReactNode = null;
  let hisBagRot = 0, hisBagX = HIS_FLOOR.x, hisBagY = HIS_FLOOR.y;
  let tiltRot = 0;
  let poof: React.ReactNode = null;
  if (id === 'Y') {
    const wind = smooth(t, 5.4, 5.8), pull = smooth(t, 5.8, POP);
    const jerk = t >= 5.4 && t < POP ? Math.sin(t * 34) * 5 * (0.4 + pull) : 0;
    const fistX = t < POP ? TAB0.x - 14 - 70 * wind - 60 * pull + jerk : lerp(TAB0.x - 150, 330, smooth(t, POP, POP + 0.25));
    const fistY = t < POP ? TAB0.y + 6 : lerp(TAB0.y, 980, smooth(t, POP, POP + 0.25));
    tug = t < POP ? -(wind * 8 + pull * 16) + jerk * 0.5 : 0;
    // her bag follows the pull until the pop
    if (t < 6.75) front.push(<g key="yk">
      {t < POP && <g stroke={C.carbon} strokeWidth={8} strokeLinecap="round" opacity={0.7}>{[0, 1, 2].map((i) => <line key={i} x1={fistX - 50 - i * 30} y1={fistY - 40 + i * 30} x2={fistX - 90 - i * 30} y2={fistY - 40 + i * 30} />)}</g>}
      <Arm who="him" sh={[470, 1020]} el={[lerp(430, 380, smooth(t, POP, POP + 0.25)), lerp(1250, 1130, smooth(t, POP, POP + 0.25))]} x={fistX} y={fistY} rot={t < POP ? 0 : -20} style={t < POP ? 'fist' : 'open'} scale={0.9} />
    </g>);
    // tab flight
    if (t >= POP) {
      const dt = t - POP;
      const g = 2600, vx = 170, vy = -950;
      let x = TAB0.x + vx * dt, y = TAB0.y + vy * dt + 0.5 * g * dt * dt;
      const landY = 1250;       // belt top (plane space)
      let rot = dt * 900;
      const tl = (-vy + Math.sqrt(vy * vy - 2 * g * (TAB0.y - landY))) / g;
      if (dt > tl) { x = TAB0.x + vx * tl + 40 * (t - POP - tl); y = landY; rot = tl * 900; }
      else { x = TAB0.x + vx * dt; y = TAB0.y + vy * dt + 0.5 * g * dt * dt; }
      flyTab = dt > tl + 0.35 ? null : <g key="ft" opacity={dt > tl ? 1 - (dt - tl) / 0.35 : 1}><FlyTab x={x} y={y} rot={rot} s={1.25} />
        {dt < 0.5 && [0, 1, 2, 3, 4, 5].map((i) => <path key={i} d={`M 0 ${-70 - dt * 80} L 0 ${-110 - dt * 130}`} stroke={i % 2 ? C.amber : '#fff'} strokeWidth={9} strokeLinecap="round" transform={`translate(${TAB0.x} ${TAB0.y}) rotate(${i * 60})`} opacity={1 - dt * 2} />)}
      </g>;
    }
    // tip: upright him leans back about the belt lip, then the lying him tumbles onto the belt
    if (t >= POP + 0.05 && t < 6.75) tiltRot = -42 * smooth(t, POP + 0.05, 6.75);
    if (t >= 6.75) {
      hisUp = false;
      const k = smooth(t, 6.75, LAND);
      const bounce = t >= LAND ? Math.exp(-(t - LAND) * 9) * Math.abs(Math.sin((t - LAND) * 22)) * 26 : 0;
      const ride = t >= LAND ? 50 * (t - LAND) : 0;
      const lx = lerp(90, 190, k) - ride;
      const ly = lerp(930, 1360, k * k) - bounce - (t < LAND ? 90 * Math.sin(k * Math.PI) : 0);
      const lrot = lerp(-40, -92, k) + (t < LAND ? 0 : 0);
      lying = <Lying x={lx} y={ly} rot={lrot} s={0.36} t={t} pose={him} kick={t < LAND ? Math.sin(t * 30) * 14 : Math.sin(t * 7) * 6} />;
      poof = <Poof x={lx + 60} y={1320} k={wp(t, LAND, LAND + 0.5)} />;
      // her hand over her smile
      front.push(<Arm key="hm" who="her" sh={[L.her.x + 230, 1020]} el={[L.her.x + 120, 1230]} x={L.her.x - 20} y={PY + 120} scale={0.8} />);
      // the lost tab keeps riding on the belt
    }
    // his bag: tipped by the trip
    const tipK = smooth(t, TIP, TIP + 0.3);
    hisBagRot = -78 * tipK;
    hisBagX = lerp(HIS_FLOOR.x, 130, tipK);
    hisBagY = lerp(HIS_FLOOR.y, FLOOR_Y + 70, tipK);
    // sits behind the held bag shift
  }

  // ---- N: she reads his tag and nods
  const herTag = (x: number, y: number, s: number, rot: number, lines: TagLine[], key: string) => (
    <g key={key}>
      <KraftTag w={920} h={460} lines={lines} size={150} x={x} y={y} rot={rot} scale={s} id={`h${key}`} string={false} />
      <Arm who="her" sh={[L.her.x + 230, 1020]} el={[L.her.x + 240, 1250]} x={x + 30} y={y + 95} rot={0} scale={0.8} />
    </g>);
  if (id === 'N') front.push(herTag(885, 1040, 0.38, -5 + Math.sin(t * 2) * 1, [{txt: '(can I try?)', p: 1}], 'n'));

  // ---- Z: slow work on the tab
  if (id === 'Z') {
    const bagX = HBc.x + tug * 4, bagY = HBc.y;
    const tabX = bagX + zipX * sc;
    const tabY = bagY + 44 * sc;
    const pinch = t < 16.55 ? 1 : 1 - smooth(t, 16.6, 16.85);
    front.push(<g key="zh">
      <Arm who="him" sh={[150, 1020]} el={[260, 1320]} x={bagX - 100 * sc} y={bagY + 110 * sc} rot={10} scale={0.8} opacity={pinch} />
      <Arm who="him" sh={[430, 1020]} el={[400, 1290]} x={tabX - 150} y={tabY + 14} rot={90} style="point" scale={0.85} opacity={pinch} />
    </g>);
    if (phoneFree) {
      const k = smooth(t, 16.6, 16.95);
      const px = lerp(bagX - 30 * sc, bagX - 90, k), py = lerp(bagY - 20, bagY - 330, k) - Math.sin(k * Math.PI) * 40;
      front.push(<g key="pf">
        <Phone who="her" x={px} y={py} rot={lerp(5, -10, k)} scale={0.66} lit={1} p={0} thumb={0} arm={false} caseColor={PINK} />
        {t < 17.05 && [0, 1, 2, 3, 4].map((i) => <path key={i} d={`M 0 ${-130 - k * 10} L 0 ${-170 - k * 20}`} stroke={i % 2 ? C.amber : '#fff'} strokeWidth={9} strokeLinecap="round" transform={`translate(${px} ${py}) rotate(${-80 + i * 40})`} opacity={1 - smooth(t, 16.8, 17.05)} />)}
        <Arm who="her" sh={[L.her.x + 200, 1020]} el={[L.her.x + 60, 1230]} x={px + 60} y={py + 160} scale={0.75} />
      </g>);
    }
  }

  // ---- T: the phone thread pays off: he switches it off
  if (id === 'T') {
    const up = smooth(t, 20.2, 20.5) * (1 - smooth(t, 21.55, 21.8));
    const lit = t < 20.85 ? 1 : 0;
    const press = t >= 20.75 && t < 20.95 ? 1 : 0;
    if (up > 0.01) mid.push(<Phone key="ph" who="him" x={L.him.x + 40} y={lerp(1700, 1130, up)} rot={-6} scale={1.3} p={0} thumb={press ? 0 : 0.0} lit={lit} base={[L.him.x + 90, 1560]} />);
    if (up > 0.5 && t >= 20.85) mid.push(<g key="pw" transform={`translate(${L.him.x + 40 - 4} ${lerp(1700, 1130, up) + 4}) scale(${Math.min(1.3, 0.9 + (t - 20.85) * 6)})`}>
      <circle r={34} fill="none" stroke="#fff" strokeWidth={9} strokeDasharray="170 60" strokeLinecap="round" transform="rotate(-62)" opacity={0.85} /><line x1={0} y1={-46} x2={0} y2={-8} stroke="#fff" strokeWidth={9} strokeLinecap="round" opacity={0.85} />
    </g>);
  }

  // ---- C: the board flips
  const flip = id === 'C' ? wp(t, B.boardFlip, B.boardFlip + 0.35) : 0;

  const bagX = HBc.x + tug * 4, bagY = HBc.y;
  // ---- bags
  const hersOnFloor = !heldShot;
  const hisBagShown = id !== 'tag1';
  const jamMarks = jam;

  return <g>
    <g transform={planeT(cam, 0.2)}><HallWall /></g>
    <g transform={planeT(cam, 0.45)}><FarBelt t={t} pos={-pos * 0.9} empty={false} keyBag={null} keyRibbon /></g>
    <g transform={planeT(cam, 0.25)}>{id === 'C' ? <g transform="translate(540 585) scale(1.2) translate(-540 -585)"><Board3 flip={flip} y={585} /></g> : <Board3 flip={0} y={585} />}</g>
    <g transform={planeT(cam, 0.9)}>
      {hisUp && <g transform={tiltRot ? `rotate(${tiltRot} ${L.him.x} 1420)` : undefined}>
        <Person who="him" x={L.him.x} y={L.him.y} s={L.him.s * (1 + 0.07 * (id === 'B' ? smooth(t, 3.3, 3.6) * (1 - smooth(t, 5.1, 5.3)) : 0))} t={t} pose={him} seed={0.4} />
      </g>}
      <Person who="her" x={L.her.x} y={L.her.y} s={L.her.s} t={t} pose={her} seed={1.9} />
      {(id === 'N' || id === 'Z' || (id === 'T' && (t < 20.2 || t >= 21.7))) && <PocketPhone x={L.him.x - 170} y={1230} buzz={pocketBuzz} t={t} />}
      {mid}
    </g>
    <g transform={planeT(cam, 1.0)}>
      <NearBelt pos={pos} />
      <Floor />
      {hersOnFloor && <Bag x={HERS_FLOOR.x} y={HERS_FLOOR.y} loop tag={false} />}
      {hisBagShown && <Bag x={hisBagX} y={hisBagY} rot={hisBagRot} loop={false} tag ribbon={1} ribbonColor={C.amber} pouch />}
      {lying}
      {poof}
      {flyTab}
      {heldShot && <g key="held">
        <Arm who="her" sh={[L.her.x - 230, 1020]} el={[L.her.x - 260, 1170]} x={bagX} y={bagY - 217 * sc + 20} scale={0.8} />
        <Bag x={bagX} y={bagY} rot={tug * 1.5 + 2} scale={sc} loop tag={false} zipX={zipX} zipRot={jam ? 16 : 0} jam={jamMarks} noTab={tabOff}>
          {jam > 0 && <g>
            <clipPath id="zc"><rect x={-300} y={-500} width={600} height={544} /></clipPath>
            <g clipPath="url(#zc)"><Phone who="her" x={-30} y={40} rot={5} scale={0.8} lit={1} p={0} thumb={0} arm={false} caseColor={PINK} /></g>
          </g>}
        </Bag>
        {jam > 0 && (id === 'A' || id === 'B' || (id === 'Y' && t < 6.75)) && <Arm who="her" sh={[L.her.x + 230, 1020]} el={[L.her.x + 120, 1290]} x={bagX + 60 * sc + 22} y={bagY + 44 * sc + 14} scale={0.7} />}
      </g>}
      {front}
    </g>
    <g transform={planeT(cam, 1.3)}><NearRail t={t} /></g>
    {id === 'A' && <g opacity={1 - smooth(t, 2.6, 2.9)}><Label x={850} y={1215} text="her phone" tx={650} ty={1070} size={78} /></g>}
  </g>;
};

const VoteScene: React.FC<{t: number}> = ({t}) => {
  const z = 1 + 0.02 * clamp((t - VOTE_AT) / 6);
  return <g transform={`translate(540 960) scale(${z}) translate(-540 -960)`}>
    <VoteBg t={t} />
    <VoteCard letter="A" l1={spec.choices.A.l1} l2={spec.choices.A.l2} y={640} age={t - B.cardA} rot={-1.5} id="va" />
    <VoteCard letter="B" l1={spec.choices.B.l1} l2={spec.choices.B.l2} y={885} age={t - B.cardB} rot={1.5} id="vb" />
  </g>;
};

const renderShot = (t: number): React.ReactNode => {
  const id = shotAt(t);
  if (id === 'tag1' || id === 'tag2') return <TagInsert t={t} id={id} />;
  if (id === 'vote') return <VoteScene t={t} />;
  if (id === 'end') return <EndCard a={t - B.endcard} t={t} part={4} amberRibbon prefix="next: " />;
  return <Hall t={t} />;
};

const Scene: React.FC<{hook: Hook}> = ({hook}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const inWipe = t >= WIPE_AT && t < VOTE_AT;
  const inRew = t >= RW0 && t < RW1;
  const k = inWipe ? (t - WIPE_AT) / WIPE_DUR : inRew ? (t - RW0) / (RW1 - RW0) : 0;
  const cx = inRew ? flapEdge(1 - k) : flapEdge(k);
  // rewind: the hall plays backwards under reversed flaps that carry the take-2 tag in from the left
  const tH = RW0 - 3.9 * smooth(t, RW0, RW1);
  return <>
    <MotionBlurWhen fast={inWipe || inRew} samples={5} shutter={220}>
      <AbsoluteFill>
        <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, background: C.concrete}}>
          <Defs />
          {inWipe ? <>
            <Hall t={Math.min(t, WIPE_AT - 0.01)} />
            <defs><clipPath id="newShot"><rect x={cx} y={-10} width={1400} height={2000} /></clipPath></defs>
            <g clipPath="url(#newShot)"><VoteScene t={t} /></g>
            <FlapRim k={k} />
          </> : inRew ? <>
            <Hall t={tH} />
            <defs><clipPath id="newShot"><rect x={-400} y={-10} width={cx + 400} height={2000} /></clipPath></defs>
            <g clipPath="url(#newShot)"><TagInsert t={RW1 - 0.001} id="tag1" /></g>
            <FlapRim k={1 - k} />
          </> : renderShot(t)}
        </svg>
      </AbsoluteFill>
    </MotionBlurWhen>
    <AbsoluteFill>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        {spec.strips.map((s, i) => {
          const isHook = (s as {hook?: boolean}).hook;
          if (isHook && (s as {hookProp?: string}).hookProp !== hook) return null;
          if (t >= s.to || t < s.from) return null;
          const comment = s.text.startsWith('comment');
          return <Strip key={i} text={s.text} y={s.y} age={t - s.from + (isHook ? 1 : 0.06)} out={isHook ? smooth(t, 2.85, 3.0) : smooth(t, s.to - 0.12, s.to)} size={isHook ? 58 : comment ? 76 : 62} hot={comment} rot={comment || isHook ? 0 : i % 2 ? 0.6 : -0.6} />;
        })}
      </svg>
    </AbsoluteFill>
  </>;
};

export const Bag3: React.FC<{hook?: Hook}> = ({hook = 'a'}) => (
  <AbsoluteFill style={{background: C.concrete}}>
    <Audio src={staticFile('audio/bag-ep3.wav')} volume={0.9} />
    <Scene hook={hook} />
  </AbsoluteFill>
);
