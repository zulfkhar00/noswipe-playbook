import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, lerp, smooth} from '../../lib/motion';
import {MotionBlurWhen} from '../../lib/shots';
import {
  Bag, BARLOW, C, CAVEAT, Cam, Defs, EndCard, FarBelt, Floor, FlapRim, HallWall, Hand, JOST, KraftTag, Label, Mouth, NearBelt, NearRail, Pen, Person, Phone, Pose,
  Strip, TagLine, VoteBg, VoteCard, WIPE_DUR, flapEdge, planeT, tagGeom, textW,
} from './world';
import spec from '../../../specs/stories/bag-ep5.json';

// Same Bag, part 5 "Lost bag". Silent. Opener: belt stopped, BELT 4 / COMPLETE, her one suitcase and a dashed ghost of the missing 2nd bag,
// his phone lit mid-swipe (hook b: she catches him). Plant: her two bags, BAGGAGE DESK lights. Take 1 (B): "(it'll turn up!)", he strides to
// the EXIT, the doors stay shut (bonk), open for a stranger, she is alone at the desk. Rewind. Take 2 (A): desk form, her "(grey. like
// everyone's.)", his "(chartreuse loop. I noticed.)", BELT 5, her bag rides out, payoff. Cliff: RIDE / ARRIVED. Vote, end card.

export const BAG5_FPS = 60;
export const BAG5_FRAMES = Math.round(spec.duration * BAG5_FPS);
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

// ------------------------------------------------------------------------------------------ shots
type ShotId = 'A' | 'P' | 'T1' | 'X' | 'D' | 'DK' | 'T2' | 'T3' | 'T4' | 'T5' | 'Car' | 'Cl' | 'vote' | 'end';
const SHOTS: [number, ShotId][] = [[0, 'A'], [B.insert, 'P'], [B.deskDark, 'A'], [B.take1, 'T1'], [B.exit, 'X'], [B.alone, 'D'], [RW1, 'DK'], [B.t2, 'T2'], [B.dk2, 'DK'], [B.t3, 'T3'],
  [B.belt5, 'A'], [B.t4, 'T4'], [B.t5, 'T5'], [B.payoff, 'A'], [B.cliff, 'Car'], [B.cl2, 'Cl'], [VOTE_AT, 'vote'], [B.endcard, 'end']];
const shotAt = (t: number): ShotId => keyAt(SHOTS, t);
const shotStart = (t: number) => { let s = 0; for (const [a] of SHOTS) if (t >= a) s = a; return s; };

type Fig = {x: number; y: number; s: number};
const PY = 815;
const FLOOR_Y = 1592;
const HIS_BAG = {x: 170, y: FLOOR_Y}, HERS_BAG = {x: 640, y: FLOOR_Y};
const GHOST = {x: 930, y: 1575};
const LAYOUT: Record<string, {him: Fig; her: Fig}> = {
  bench: {him: {x: 290, y: PY, s: 1}, her: {x: 850, y: PY, s: 1}},
  Cl: {him: {x: 290, y: PY + 60, s: 1}, her: {x: 850, y: PY + 60, s: 1}},
  D: {him: {x: 290, y: PY, s: 1}, her: {x: 540, y: PY - 20, s: 1.12}},
};
const layoutOf = (id: ShotId) => LAYOUT[id === 'Cl' ? 'Cl' : id === 'D' ? 'D' : 'bench'];

const Arm: React.FC<{who: 'him' | 'her'; sh: [number, number]; el: [number, number]; x: number; y: number; rot?: number; style?: 'fist' | 'open' | 'point'; scale?: number; opacity?: number}> = ({who, sh, el, x, y, rot = 0, style = 'fist', scale = 1, opacity = 1}) => (
  <g opacity={opacity}>
    <line x1={sh[0]} y1={sh[1]} x2={el[0]} y2={el[1]} stroke={C.ink} strokeOpacity={0.12} strokeWidth={96 * scale} strokeLinecap="round" transform="translate(10 14)" />
    <line x1={sh[0]} y1={sh[1]} x2={el[0]} y2={el[1]} stroke={who === 'him' ? C.olive : C.camel} strokeWidth={94 * scale} strokeLinecap="round" />
    <Hand who={who} x={x} y={y} rot={rot} base={el} style={style} scale={scale} />
  </g>
);

// ------------------------------------------------------------------------------------------ poses
const HIM_LOOK_A: KF[] = [[0, -0.6, 0.8], [0.45, -0.6, 0.8], [0.62, 0.9, 0.2], [1.05, 0.9, 0.2], [1.2, -0.6, 0.8], [1.95, -0.6, 0.8], [2.1, 0.9, 0.2]];
const HIM_LOOK_B: KF[] = [[0, -0.6, 0.8], [0.9, -0.6, 0.8], [1.0, 0.9, 0.2]];
const HIM_LOOK_C: KF[] = [[2.6, 0.9, 0.2], [4.8, 0.9, 0.2], [5.0, 0.2, -0.2], [8.9, 0.3, -0.3], [9.0, -0.9, 0.3], [10.2, -0.9, 0.3], [11.0, 0.9, 0.3], [16.5, 0.9, 0.3], [16.8, 0.2, -0.4],
  [17.7, 0.2, -0.4], [17.9, 0.9, 0.2], [26.0, 0.9, 0.2]];
const HIM_MOUTH_A: [number, Mouth][] = [[0, 'flat'], [2.0, 'gulp']];
const HIM_MOUTH_B: [number, Mouth][] = [[0, 'flat'], [0.9, 'o'], [1.8, 'gulp']];
const HIM_MOUTH_C: [number, Mouth][] = [[2.6, 'flat'], [4.8, 'smirk'], [7.4, 'o'], [7.9, 'grit'], [9.0, 'o'], [10.3, 'soft'], [14.7, 'smile'], [24.2, 'soft']];
const HER_LOOK_A: KF[] = [[0, -0.3, 0.7], [0.2, -0.3, 0.7], [0.4, 0.8, 0.8], [1.6, 0.8, 0.8], [1.9, -0.3, 0.7], [2.5, -0.3, 0.7]];
const HER_LOOK_B: KF[] = [[0, -0.3, 0.7], [0.55, -0.3, 0.7], [0.7, -0.95, 0.5], [1.9, -0.95, 0.4], [2.2, -0.3, 0.7], [2.5, -0.3, 0.7]];
const HER_LOOK_C: KF[] = [[2.6, -0.3, 0.7], [9.0, -0.3, 0.7], [9.2, -0.9, 0.1], [9.8, -0.9, 0.1], [10.05, -0.2, 0.8], [11.0, -0.2, 0.8], [11.5, -0.9, 0.3], [12.1, -0.2, 0.7], [13.8, -0.9, 0.3], [14.7, -0.9, 0.3],
  [16.5, -0.5, 0.2], [17.2, -0.9, 0.2], [26.0, -0.9, 0.2]];
const blinkAt = (t: number, seed: number) => { const ph = (t + seed) % 3.7; return ph < 0.14 ? Math.sin((ph / 0.14) * Math.PI) : 0; };

const himPose = (t: number, hook: Hook): Pose => {
  const [lx, ly] = kf([...(hook === 'b' ? HIM_LOOK_B : HIM_LOOK_A), ...HIM_LOOK_C], t);
  const mouth = t < 2.6 ? keyAt(hook === 'b' ? HIM_MOUTH_B : HIM_MOUTH_A, t) : keyAt(HIM_MOUTH_C, t);
  const pomp = smooth(t, 4.8, 5.1) * (1 - smooth(t, 6.1, 6.3));
  const dazed = smooth(t, B.bonk, B.bonk + 0.1) * (1 - smooth(t, B.bonk + 0.9, B.bonk + 1.2));
  const glad = (t >= 14.7 && t < 26.0);
  const hap = t >= 16.9 && t < 24.2 && !(t >= B.t4 && t < B.payoff);
  const flush = Math.max(smooth(t, 0.9, 1.4) * (hook === 'b' ? 1 : 0) * (1 - smooth(t, 3, 4)), dazed, glad ? 0.3 : 0);
  return {look: [lx, ly], brow: 0.1 + pomp * 0.4 + dazed * 0.8 + (t >= 9.0 && t < 10.3 ? 0.7 : 0), worry: dazed * 0.6 + (t >= 9.0 && t < 10.3 ? 0.8 : 0), mouth, happy: hap,
    sweat: dazed * 0.5, gulp: 0, tilt: glad ? Math.sin(t * 9) * 2 : Math.sin(t * 0.9) * 1.1 + (dazed ? -9 * dazed : 0), bob: glad ? -Math.abs(Math.sin(t * 9)) * 3 : 0, blink: blinkAt(t, 0.4), sway: 1, flush};
};
const herPose = (t: number, hook: Hook): Pose => {
  const [lx, ly] = kf([...(hook === 'b' ? HER_LOOK_B : HER_LOOK_A), ...HER_LOOK_C], t);
  const catchK = hook === 'b' ? smooth(t, 0.62, 0.8) * (1 - smooth(t, 1.5, 2.0)) : 0;
  const catchTilt = hook === 'b' ? -7 * smooth(t, 0.62, 0.85) * (1 - smooth(t, 2.0, 2.5)) : 0;
  const worry = (hook === 'a' ? 1 : smooth(t, 1.9, 2.3)) * (1 - smooth(t, 14.7, 15.4));
  const happy = t >= 16.9 && t < 24.2 && !(t >= B.t4 && t < B.payoff);
  let mouth: Mouth = t < 14.7 ? 'flat' : 'smile';
  if (hook === 'b' && t >= 0.7 && t < 2.2) mouth = t < 1.6 ? 'o' : 'smirk';
  if (t >= 24.2) mouth = 'soft';
  const alone = t >= B.alone && t < B.rewind;
  if (alone) mouth = 'flat';
  const wy = alone ? 0.75 : worry;
  return {look: [lx, ly], brow: 0.1 + catchK * 0.9 + wy * 0.5, browR: 0.1 + catchK * 0.9 + wy * 0.2, worry: wy, mouth, happy, sweat: 0, gulp: 0,
    tilt: catchTilt + (alone ? 4 : worry * 4) + (happy ? Math.sin(t * 7 + 1) * 2 : Math.sin(t * 0.8 + 2) * 1.2), bob: 0, blink: blinkAt(t, 1.9), sway: 1, flush: 0};
};

// ------------------------------------------------------------------------------------------ belt
const BELT_SPEED = 300;
const beltPos = (t: number) => BELT_SPEED * (clamp(t, B.belt5 + 0.2, B.bagStop) - (B.belt5 + 0.2)) + 0 * t;
const FOUND_X = 890;
const foundX = (t: number) => 1250 - 300 * (Math.min(t, B.bagStop) - B.bagIn);
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
  T1: {t0: B.take1, t1: B.exit, who: 'him', lines: [["(it'll turn up!)", 4.9, 5.4]], H: 400, size: 160, slide: 0},
  T2: {t0: B.t2, t1: B.dk2, who: 'her', lines: [['(grey. like', 12.2, 12.6], ["everyone's.)", 12.6, 13.0]], H: 540, size: 160, slide: 0},
  T3: {t0: B.t3, t1: B.belt5, who: 'him', lines: [['(chartreuse loop.', 14.8, 15.25], ['I noticed.)', 15.25, 15.65]], H: 540, size: 160, slide: 0},
  T4: {t0: B.t4, t1: B.t5, who: 'her', lines: [['(you noticed', 18.8, 19.2], ['that?)', 19.2, 19.5]], H: 540, size: 160, slide: 0},
  T5: {t0: B.t5, t1: B.payoff, who: 'him', lines: [['(hard not to.)', 20.5, 21.0]], H: 400, size: 160, slide: 0},
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
  const lines: TagLine[] = c.lines.map(([txt, a, b]) => ({txt, p: wp(t, a, b)}));
  const g = tagGeom(W, c.H, lines.length, lines.map((l) => l.txt), c.size);
  const w0 = c.lines[0][1] - 0.25, w1 = c.lines[c.lines.length - 1][2] + 0.35;
  let li = 0;
  c.lines.forEach(([, a], i) => { if (t >= a - 0.02) li = i; });
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
    <g transform={`translate(${540 + sx} 780) rotate(-2) scale(${pop})`}>
      <KraftTag w={W} h={c.H} lines={lines} size={c.size} id={`ti${id}`} string={false} />
      {penOn && <g>
        <Pen x={tx} y={ty} rot={50} />
        <Arm who={c.who} sh={[tx + 600, ty + 560]} el={[tx + 400, ty + 130]} x={tx + 140} y={ty - 120} rot={20} scale={1.0} />
      </g>}
    </g>
  </g>;
};

// ------------------------------------------------------------------------------------------ board
const CELLS_L: [number, string][] = [[0, 'BELT 4'], [B.belt5, 'BELT 5'], [B.cl2, 'RIDE']];
const CELLS_R: [number, string][] = [[0, 'COMPLETE'], [B.belt5, 'COMING OUT'], [B.cl2, 'ARRIVED']];
const cellColor = (txt: string) => txt === 'BELT 4' || txt === 'BELT 5' ? '#fff' : txt === 'RIDE' ? C.amber : C.hiVis;
const CarIcon: React.FC<{x: number}> = ({x}) => <g transform={`translate(${x} 4)`}>
  <path d="M -46 18 L -46 -2 Q -46 -10 -36 -12 L -26 -30 Q -22 -36 -14 -36 L 18 -36 Q 26 -36 30 -30 L 40 -12 Q 48 -10 48 -2 L 48 18 Z" fill={C.amber} stroke="#000" strokeWidth={3} />
  <path d="M -22 -12 L -14 -28 L 0 -28 L 0 -12 Z M 8 -12 L 8 -28 L 18 -28 L 30 -12 Z" fill="#2A2A2F" />
  <circle cx={-26} cy={20} r={11} fill="#111" stroke="#fff" strokeWidth={3} /><circle cx={28} cy={20} r={11} fill="#111" stroke="#fff" strokeWidth={3} />
</g>;
const Board5: React.FC<{t: number; y: number}> = ({t, y}) => {
  const cell = (list: [number, string][], x: number, w: number) => {
    let i = 0;
    list.forEach(([a], j) => { if (t >= a) i = j; });
    const f = i === 0 ? 1 : wp(t, list[i][0], list[i][0] + 0.35);
    const txt = f < 0.5 ? list[Math.max(0, i - 1)][1] : list[i][1];
    const sy = f >= 1 ? 1 : Math.max(0.04, Math.abs(Math.cos(f * Math.PI)));
    const car = txt === 'RIDE';
    const fs = textW(txt, `700 66px ${BARLOW}`) + 3 * txt.length > w - 30 ? 54 : 66;
    return <g key={x} transform={`translate(${x} ${y}) scale(1 ${sy})`}>
      <rect x={-w / 2} y={-44} width={w} height={88} rx={10} fill="#2A2A2F" stroke="#000" strokeWidth={3} />
      {car && <CarIcon x={-w / 2 + 72} />}
      <text x={car ? 52 : 0} y={22} textAnchor="middle" fontFamily={BARLOW} fontWeight={700} fontSize={fs} letterSpacing={3} fill={cellColor(txt)}>{txt}</text>
      <line x1={-w / 2} x2={w / 2} y1={0} y2={0} stroke="#000" strokeWidth={3} opacity={0.5} />
    </g>;
  };
  return <g>
    <rect x={150} y={y - 66} width={780} height={132} rx={20} fill={C.carbon} />
    <rect x={150} y={y - 66} width={780} height={12} rx={6} fill="#4A4A52" />
    {cell(CELLS_L, 330, 280)}{cell(CELLS_R, 690, 440)}
    <rect x={250} y={y - 110} width={10} height={44} fill={C.carbon} /><rect x={820} y={y - 110} width={10} height={44} fill={C.carbon} />
  </g>;
};

const DeskSign: React.FC<{lit: number; t: number; y?: number}> = ({lit, t, y = 0}) => {
  const flick = lit > 0 && lit < 1 ? (Math.sin(t * 60) > 0 ? 1 : 0.4) : 1;
  return <g transform={`translate(0 ${y})`}>
    {lit > 0 && <ellipse cx={540} cy={400} rx={430} ry={130} fill={C.amber} opacity={0.35 * lit * flick} filter="url(#blurSoft)" />}
    <rect x={250} y={340} width={10} height={40} fill={C.carbon} /><rect x={820} y={340} width={10} height={40} fill={C.carbon} />
    <rect x={160} y={372} width={760} height={130} rx={22} fill={C.carbon} stroke="#000" strokeWidth={4} />
    <rect x={176} y={388} width={728} height={98} rx={14} fill={lit > 0 ? C.amber : '#3A3A42'} opacity={lit > 0 ? 0.25 + 0.75 * flick : 1} />
    <text x={540} y={461} textAnchor="middle" fontFamily={BARLOW} fontWeight={700} fontSize={84} letterSpacing={5} fill={lit > 0 ? C.carbon : '#6A6A74'}>BAGGAGE DESK</text>
  </g>;
};

const Bench: React.FC = () => <g>
  <rect x={50} y={1236} width={1000} height={70} rx={14} fill={C.ink} opacity={0.2} />
  <rect x={40} y={1180} width={1000} height={50} rx={14} fill="#A9AFB8" stroke={C.carbon} strokeWidth={5} />
  <rect x={40} y={1222} width={1000} height={70} rx={14} fill={C.suitcaseDeep} stroke={C.carbon} strokeWidth={5} />
  <rect x={44} y={1222} width={992} height={12} fill={C.hiVis} opacity={0.9} />
  {[160, 330, 500, 670, 840].map((x) => <line key={x} x1={x} x2={x} y1={1190} y2={1224} stroke={C.carbon} strokeWidth={3} opacity={0.3} />)}
</g>;

const Exclaim: React.FC<{x: number; y: number; k: number}> = ({x, y, k}) => {
  if (k <= 0) return null;
  const s = k < 1 ? 1 + Math.sin(k * Math.PI * 1.5) * Math.exp(-k * 4) * 0.4 : 1;
  return <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -34 36 L -64 78 L -2 54 Z" fill={C.carbon} transform="translate(7 9)" /><circle r={58} fill={C.carbon} transform="translate(7 9)" />
    <path d="M -34 36 L -64 78 L -2 54 Z" fill={C.hiVis} stroke={C.carbon} strokeWidth={6} strokeLinejoin="round" />
    <circle r={58} fill={C.hiVis} stroke={C.carbon} strokeWidth={6} />
    <text x={0} y={30} textAnchor="middle" fontFamily={JOST} fontWeight={800} fontSize={92} fill={C.carbon}>!</text>
  </g>;
};

const Ghost: React.FC<{a: number; pulse?: number}> = ({a, pulse = 0}) => <g opacity={a} transform={`translate(${GHOST.x} ${GHOST.y}) scale(${1 + pulse * 0.09})`}>
  <rect x={-120} y={-165} width={240} height={330} rx={34} fill="#fff" fillOpacity={0.25} stroke={C.carbon} strokeWidth={8} strokeDasharray="22 16" />
  <path d="M -56 -171 L -56 -211 Q -56 -229 -38 -229 L 38 -229 Q 56 -229 56 -211 L 56 -171" fill="none" stroke={C.carbon} strokeWidth={9} strokeDasharray="16 12" strokeLinecap="round" />
  <text x={0} y={42} textAnchor="middle" fontFamily={JOST} fontWeight={800} fontSize={190} fill={C.carbon} opacity={0.85}>?</text>
</g>;

// ------------------------------------------------------------------------------------------ plant insert: her two bags
const TwoBags: React.FC<{t: number}> = ({t}) => {
  const age = t - B.insert;
  const drop = (d: number) => { const k = clamp((age - d) / 0.35); return k <= 0 ? 0 : 1 + Math.sin(k * Math.PI * 1.5) * Math.exp(-k * 4.2) * 0.3 - Math.exp(-k * 9) * (1 - k); };
  const one = (x: number, d: number) => <g transform={`translate(${x} 1060) scale(${drop(d) * 1.25})`}>
    <Bag x={0} y={0} loop tag={false} />
    <ellipse cx={46} cy={-140} rx={50} ry={92} fill="none" stroke={C.carbon} strokeWidth={6} strokeDasharray="14 10" />
  </g>;
  return <g>
    {INSERT_BG(t)}
    {one(300, 0)}{one(770, 0.2)}
    <Label x={310} y={640} text="her 1st bag" tx={345} ty={775} a={drop(0.05)} size={80} />
    <Label x={770} y={640} text="her 2nd bag" tx={805} ty={775} a={drop(0.3)} size={80} />
  </g>;
};

// ------------------------------------------------------------------------------------------ exit scene (take 1)
const Stranger: React.FC<{x: number; y: number; s: number; t: number}> = ({x, y, s, t}) => {
  const bob = Math.abs(Math.sin(t * 9)) * 8;
  return <g transform={`translate(${x} ${y - bob}) scale(${s})`}>
    <rect x={-120} y={110} width={240} height={420} rx={70} fill="#2F6F73" stroke={C.carbon} strokeWidth={6} />
    <rect x={-30} y={80} width={60} height={60} fill="#8A5A44" />
    <circle r={100} fill="#8A5A44" stroke={C.carbon} strokeWidth={6} />
    <path d="M -102 -14 Q -100 -118 0 -120 Q 100 -118 102 -14 Q 60 -50 0 -50 Q -60 -50 -102 -14 Z" fill="#B4472E" stroke={C.carbon} strokeWidth={6} />
    <circle cx={-36} cy={4} r={9} fill={C.ink} /><circle cx={36} cy={4} r={9} fill={C.ink} />
    <path d="M -24 50 Q 0 62 24 50" fill="none" stroke={C.ink} strokeWidth={7} strokeLinecap="round" />
    <g transform="translate(190 330) scale(0.5)"><Bag x={0} y={0} loop={false} tag={false} body={C.sky} deep="#5FA5E0" /></g>
  </g>;
};

const Burst: React.FC<{x: number; y: number; k: number}> = ({x, y, k}) => {
  if (k <= 0 || k >= 1) return null;
  const pts = Array.from({length: 16}, (_, i) => { const a = (i / 16) * Math.PI * 2, r = i % 2 ? 62 : 120; return `${Math.cos(a) * r},${Math.sin(a) * r}`; }).join(' ');
  return <g transform={`translate(${x} ${y}) scale(${0.6 + k * 0.7})`} opacity={1 - k * k}><polygon points={pts} fill={C.hiVis} stroke={C.carbon} strokeWidth={6} strokeLinejoin="round" /></g>;
};

const ExitScene: React.FC<{t: number; hook: Hook}> = ({t, hook}) => {
  const walkK = smooth(t, B.exit, B.walkEnd);
  const bonkK = smooth(t, B.bonk, B.bonk + 0.08) * (1 - smooth(t, B.bonk + 0.12, B.bonk + 0.5));
  const walking = t < B.walkEnd;
  const hx = lerp(-40, 360, walkK) + bonkK * 28 - smooth(t, B.bonk + 0.15, B.bonk + 0.7) * 34;
  const bob = walking ? Math.abs(Math.sin(t * 9.5)) * 14 : 0;
  const hy = 990 - bob;
  const pose = himPose(t, hook);
  const swing = walking ? Math.sin(t * 9.5) * 4 : 0;
  const s = 0.62 + bonkK * 0.05;
  const turn = t >= B.lookBack;
  const wave = Math.sin(t * 13) * 18;
  const waving = t < B.walkEnd + 0.1;
  const handY = hy + 330, bagY = handY + 112;
  const op = {x0: 190, x1: 890, y0: 540, y1: 1530};
  const panelW = 350;
  const open = smooth(t, B.doorsOpen, B.doorsOpen + 0.6) * (1 - smooth(t, B.doorsOpen + 1.5, B.doorsOpen + 2.0));
  const gap = 170;
  const lx = op.x0 - open * gap, rx = 540 + open * gap;
  const pane = (x: number, key: string) => <g key={key}>
    <rect x={x} y={op.y0} width={panelW} height={op.y1 - op.y0} fill="#EAF4FB" opacity={0.22} />
    <rect x={x} y={op.y0} width={panelW} height={op.y1 - op.y0} fill="none" stroke={C.carbon} strokeWidth={10} />
    <path d={`M ${x + 60} ${op.y0} L ${x + 150} ${op.y0} L ${x + 20} ${op.y0 + 420} L ${x - 20} ${op.y0 + 420} Z`} fill="#fff" opacity={0.45} />
    <path d={`M ${x + 190} ${op.y0} L ${x + 230} ${op.y0} L ${x + 100} ${op.y0 + 420} L ${x + 80} ${op.y0 + 420} Z`} fill="#fff" opacity={0.3} />
    <rect x={x + (key === 'l' ? panelW - 34 : 20)} y={900} width={14} height={260} rx={7} fill={C.carbon} />
  </g>;
  const sk = wp(t, B.stranger, B.doorsOpen + 1.2);
  const stX = sk < 0.5 ? lerp(1250, 600, smooth(sk, 0, 0.5)) : 600 - 6 * (sk - 0.5);
  const thru = smooth(t, B.doorsOpen + 0.3, B.doorsOpen + 1.3);
  const stS = lerp(0.62, 0.34, thru), stY = lerp(960, 900, thru);
  const stranger = t >= B.stranger - 0.1;
  return <g>
    <g transform={planeT({x: 540 + Math.sin(t * 0.7) * 4, y: 960, z: 1}, 0.2)}><HallWall /></g>
    <defs>
      <linearGradient id="skyG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8EC9FF" /><stop offset="1" stopColor="#DCEEFF" /></linearGradient>
      <clipPath id="opening"><rect x={op.x0} y={op.y0} width={op.x1 - op.x0} height={op.y1 - op.y0} /></clipPath>
    </defs>
    <rect x={150} y={420} width={780} height={1130} rx={16} fill={C.carbon} />
    <rect x={330} y={436} width={420} height={92} rx={14} fill={C.hiVis} stroke="#000" strokeWidth={4} />
    <text x={540} y={506} textAnchor="middle" fontFamily={JOST} fontWeight={800} fontSize={72} letterSpacing={8} fill={C.carbon}>EXIT</text>
    <g clipPath="url(#opening)">
      <rect x={op.x0} y={op.y0} width={700} height={720} fill="url(#skyG)" />
      <rect x={200} y={1080} width={90} height={190} fill="#B6C7D6" /><rect x={300} y={1130} width={70} height={140} fill="#C3D2DF" /><rect x={640} y={1100} width={110} height={170} fill="#B6C7D6" />
      <rect x={op.x0} y={1250} width={700} height={44} fill="url(#hazard)" />
      <rect x={op.x0} y={1294} width={700} height={240} fill="#2C2C32" />
      <line x1={op.x0} x2={op.x1} y1={1410} y2={1410} stroke="#fff" strokeWidth={8} strokeDasharray="60 50" opacity={0.7} />
    </g>
    {stranger && <Stranger x={stX} y={stY} s={stS} t={t} />}
    <g clipPath="url(#opening)">{pane(lx, 'l')}{pane(rx, 'r')}</g>
    <Burst x={hx + 75} y={hy - 70} k={wp(t, B.bonk, B.bonk + 0.6)} />
    <g transform={turn ? `translate(${hx * 2} 0) scale(-1 1)` : undefined}>
      <Person who="him" x={hx} y={hy} s={s} t={t} pose={pose} seed={0.4} />
    </g>
    <rect x={-100} y={1530} width={1300} height={500} fill="#C9C5BA" />
    <rect x={-100} y={1530} width={1300} height={14} fill={C.carbon} opacity={0.18} />
    {/* his arms: right waves, left carries his own bag */}
    {!turn && <g>
      <Arm who="him" sh={[hx - 150, hy + 190]} el={[hx - 225, hy + 290]} x={hx - 262} y={handY} scale={0.62} />
      <Bag x={hx - 262 - swing} y={bagY} loop={false} tag ribbon={1} ribbonColor={C.amber} scale={0.6} rot={walking ? -swing * 0.8 : 0} />
      <Arm who="him" sh={[hx + 150, hy + 190]} el={[hx + 250, hy + (waving ? 70 : 290)]} x={hx + 262 + (waving ? wave * 0.6 : 0)} y={waving ? hy - 40 : handY} rot={waving ? 12 + wave : 0} style="open" scale={0.62} />
    </g>}
  </g>;
};

const CarScene: React.FC<{t: number}> = ({t}) => {
  const age = t - B.cliff;
  const k = smooth(age, 0, 0.7);
  const cx = lerp(1250, 540, k), nod = Math.sin(clamp((age - 0.55) / 0.3) * Math.PI) * 2.5;
  const op = {x0: 190, x1: 890, y0: 540, y1: 1530};
  return <g>
    <g transform={planeT({x: 540, y: 960, z: 1}, 0.2)}><HallWall /></g>
    <defs>
      <linearGradient id="skyG2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8EC9FF" /><stop offset="1" stopColor="#DCEEFF" /></linearGradient>
      <clipPath id="opening2"><rect x={op.x0} y={op.y0} width={op.x1 - op.x0} height={op.y1 - op.y0} /></clipPath>
    </defs>
    <rect x={150} y={420} width={780} height={1130} rx={16} fill={C.carbon} />
    <rect x={330} y={436} width={420} height={92} rx={14} fill={C.hiVis} stroke="#000" strokeWidth={4} />
    <text x={540} y={506} textAnchor="middle" fontFamily={JOST} fontWeight={800} fontSize={72} letterSpacing={8} fill={C.carbon}>EXIT</text>
    <g clipPath="url(#opening2)">
      <rect x={op.x0} y={op.y0} width={700} height={720} fill="url(#skyG2)" />
      <rect x={200} y={1080} width={90} height={190} fill="#B6C7D6" /><rect x={640} y={1100} width={110} height={170} fill="#B6C7D6" />
      <rect x={op.x0} y={1250} width={700} height={44} fill="url(#hazard)" />
      <rect x={op.x0} y={1294} width={700} height={240} fill="#2C2C32" />
      <line x1={op.x0} x2={op.x1} y1={1410} y2={1410} stroke="#fff" strokeWidth={8} strokeDasharray="60 50" opacity={0.7} />
      <rect x={712} y={760} width={16} height={500} fill={C.carbon} />
      <rect x={570} y={680} width={300} height={130} rx={14} fill={C.hiVis} stroke={C.carbon} strokeWidth={7} />
      <text x={720} y={760} textAnchor="middle" fontFamily={JOST} fontWeight={800} fontSize={58} fill={C.carbon}>PICK-UP</text>
      <g transform={`translate(${cx} 1400) rotate(${nod})`}>
        <ellipse cx={0} cy={118} rx={270} ry={20} fill={C.ink} opacity={0.3} />
        <path d="M -260 90 L -260 20 Q -258 0 -230 -6 L -150 -20 L -96 -100 Q -86 -116 -62 -116 L 120 -116 Q 150 -116 166 -96 L 216 -20 L 246 -10 Q 266 -4 266 20 L 266 90 Z" fill="#2F7F86" stroke={C.carbon} strokeWidth={8} strokeLinejoin="round" />
        <path d="M -80 -22 L -52 -96 L 40 -96 L 40 -22 Z M 64 -22 L 64 -96 L 118 -96 L 168 -22 Z" fill="#CFE9F6" stroke={C.carbon} strokeWidth={6} strokeLinejoin="round" />
        <rect x={-262} y={26} width={40} height={26} rx={10} fill="#FFF3B0" stroke={C.carbon} strokeWidth={5} />
        <rect x={236} y={22} width={28} height={26} rx={8} fill="#E5483B" stroke={C.carbon} strokeWidth={5} />
        <circle cx={-150} cy={92} r={46} fill={C.carbon} /><circle cx={-150} cy={92} r={20} fill="#B9BFC8" />
        <circle cx={150} cy={92} r={46} fill={C.carbon} /><circle cx={150} cy={92} r={20} fill="#B9BFC8" />
      </g>
    </g>
    {[190, 540].map((x) => <g key={x}>
      <rect x={x} y={op.y0} width={350} height={op.y1 - op.y0} fill="#EAF4FB" opacity={0.2} />
      <rect x={x} y={op.y0} width={350} height={op.y1 - op.y0} fill="none" stroke={C.carbon} strokeWidth={10} />
      <path d={`M ${x + 60} ${op.y0} L ${x + 150} ${op.y0} L ${x + 20} ${op.y0 + 420} L ${x - 20} ${op.y0 + 420} Z`} fill="#fff" opacity={0.4} />
    </g>)}
    <rect x={-100} y={1530} width={1300} height={500} fill="#C9C5BA" />
  </g>;
};

// ------------------------------------------------------------------------------------------ desk scenes (D: she is alone; DK: take 2 form)
const DeskScene: React.FC<{t: number; hook: Hook; id: 'D' | 'DK'}> = ({t, hook, id}) => {
  const L = layoutOf(id);
  const lt = t - shotStart(t);
  const cam: Cam = {x: 540 + Math.sin(t * 0.7) * 4 + lt * 2, y: 960 + Math.sin(t * 1.0) * 3, z: 1 + 0.012 * Math.min(1, lt / 2.5)};
  const him = himPose(t, hook), her = herPose(t, hook);
  const front: React.ReactNode[] = [];
  const written = t >= B.dk2;
  if (id === 'DK' && t >= B.dk2) {
    const k = smooth(t, B.dk2 + 0.1, B.dk2 + 0.5);
    const px = lerp(900, 640, k), py = lerp(1300, 1205, k);
    front.push(<g key="pen"><Arm who="him" sh={[1330, 1380]} el={[lerp(1200, 960, k), lerp(1330, 1290, k)]} x={px} y={py + 20} rot={150} style="open" scale={0.8} />
      <Pen x={px} y={py + 10} rot={50} /></g>);
  }
  return <g>
    <g transform={planeT(cam, 0.2)}><HallWall /></g>
    <g transform={planeT(cam, 0.25)}><DeskSign lit={1} t={t} y={105} /></g>
    <g transform={planeT(cam, 0.9)}>
      {id === 'DK' && <Person who="him" x={L.him.x} y={L.him.y + 50} s={L.him.s} t={t} pose={him} seed={0.4} />}
      <Person who="her" x={L.her.x} y={L.her.y + 50} s={L.her.s} t={t} pose={her} seed={1.9} />
    </g>
    <g transform={planeT(cam, 1.0)}>
      <Floor />
      <rect x={-100} y={1040} width={1300} height={604} fill="#BDB6A8" />
      <rect x={-100} y={1040} width={1300} height={22} fill={C.carbon} />
      <rect x={-100} y={1062} width={1300} height={10} fill={C.hiVis} />
      {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={20 + i * 220} y={1330} width={8} height={300} fill="#000" opacity={0.12} />)}
      {id === 'DK' && <g transform="translate(500 1160) rotate(-1.5)">
        <rect x={-290} y={-84} width={600} height={190} rx={10} fill={C.ink} opacity={0.22} />
        <rect x={-300} y={-96} width={600} height={190} rx={10} fill="#FBF8F0" stroke={C.carbon} strokeWidth={5} />
        <rect x={-300} y={-96} width={600} height={64} rx={10} fill={C.carbon} />
        <text x={0} y={-48} textAnchor="middle" fontFamily={BARLOW} fontWeight={700} fontSize={50} letterSpacing={4} fill="#fff">DESCRIBE THE BAG</text>
        {[22, 68].map((y) => <line key={y} x1={-260} x2={260} y1={y} y2={y} stroke={C.carbon} strokeWidth={3} opacity={0.5} />)}
        {written && <text x={-250} y={14} fontFamily={CAVEAT} fontWeight={700} fontSize={54} fill={C.carbon}>grey.</text>}
      </g>}
      <Bag x={HERS_BAG.x + (id === 'D' ? 330 : 0)} y={FLOOR_Y} loop tag={false} />
      {id === 'DK' && <Bag x={HIS_BAG.x} y={FLOOR_Y} loop={false} tag ribbon={1} ribbonColor={C.amber} pouch />}
      {front}
    </g>
    <g transform={planeT(cam, 1.3)}><NearRail t={t} /></g>
  </g>;
};

// ------------------------------------------------------------------------------------------ hall (belt scenes)
const Hall: React.FC<{t: number; hook: Hook}> = ({t, hook}) => {
  const id = shotAt(t);
  const L = layoutOf(id);
  const lt = t - shotStart(t);
  const cam: Cam = {x: 540 + Math.sin(t * 0.7) * 4 + lt * 2, y: 960 + Math.sin(t * 1.0) * 3, z: 1 + 0.012 * Math.min(1, lt / 2.5)};
  const pos = beltPos(t);
  const him = himPose(t, hook), her = herPose(t, hook);
  const hs = swipeOf(HIM_TICKS, t);
  const mid: React.ReactNode[] = [];
  const front: React.ReactNode[] = [];
  const isCl = id === 'Cl';
  const early = t < B.take1;
  const lit = early ? smooth(t, B.deskLit - 0.05, B.deskLit) : 0;
  const ghostA = (hook === 'a' ? 1 : smooth(t, B.ghostB, B.ghostB + 0.3)) * (1 - smooth(t, B.bagIn, B.bagIn + 0.3));

  // ---- opener: his phone (hook a: lowered at 2.0; hook b: pocketed at 1.15 after she catches him)
  if (t < 2.55) {
    const mv = hook === 'b' ? smooth(t, 1.15, 1.65) : smooth(t, 2.0, 2.5);
    const px = 215, py = 1125 + 440 * mv, pr = -6 + 8 * mv;
    const swiping = mv < 0.02 && t < 2.0;
    mid.push(<Phone key="ph" who="him" x={px} y={py} rot={pr} scale={1.3} p={swiping ? hs.p : 0} dir={hs.dir} thumb={swiping ? 1 : 0} lit={1} base={[250, 2150]} />);
  }

  // ---- cliff: she grabs both bags
  const grab = isCl ? smooth(t, B.cl2 + 0.2, B.cl2 + 0.75) : 0;
  const found = isCl ? {x: lerp(FOUND_X, 1010, grab), y: lerp(1285 - 0.9 * 191, 1400, grab), s: lerp(0.9, 1, grab)} : {x: foundX(t), y: 1285 - 0.9 * 191, s: 0.9};
  const hers = isCl ? {x: lerp(HERS_BAG.x, 700, grab), y: lerp(FLOOR_Y, 1400, grab)} : HERS_BAG;
  if (isCl && grab > 0) {
    [[hers.x, hers.y, -1], [found.x, found.y, 1]].forEach(([bx, by, sd]) => front.push(
      <Arm key={`g${sd}`} who="her" sh={[L.her.x + sd * 150, 1080]} el={[(L.her.x + sd * 150 + bx) / 2 + sd * 30, 1250]} x={bx} y={by - 197} scale={0.8} />));
  }
  const showFound = t >= B.bagIn - 0.4;

  return <g>
    <g transform={planeT(cam, 0.2)}><HallWall /></g>
    <g transform={planeT(cam, 0.45)}><FarBelt t={t} pos={-pos * 0.9} empty keyBag={null} /></g>
    <g transform={planeT(cam, 0.25)}>
      <g transform={`translate(540 585) scale(${1 + 0.24 * smooth(t, B.cl2, B.cl2 + 0.4)}) translate(-540 -585)`}><Board5 t={t} y={585} /></g>
      {t >= B.deskDark && early && <DeskSign lit={lit} t={t} />}
    </g>
    <g transform={planeT(cam, 0.9)}>
      <Person who="him" x={L.him.x} y={L.him.y} s={L.him.s} t={t} pose={him} seed={0.4} />
      <Person who="her" x={L.her.x} y={L.her.y} s={L.her.s} t={t} pose={her} seed={1.9} />
      {hook === 'b' && t >= 0.6 && t < 1.95 && <Exclaim x={965} y={545} k={wp(t, 0.62, 1.0)} />}
      <Bench />
      {mid}
    </g>
    <g transform={planeT(cam, 1.0)}>
      <NearBelt pos={pos} />
      <Floor />
      {showFound && <Bag x={found.x} y={found.y} loop tag={false} scale={found.s} />}
      <Bag x={HIS_BAG.x} y={HIS_BAG.y} loop={false} tag ribbon={1} ribbonColor={C.amber} pouch />
      <Bag x={hers.x} y={hers.y} loop tag={false} />
      <Ghost a={ghostA} pulse={hook === 'a' && t < 2.5 ? Math.max(0, Math.sin((t - 0.2) * Math.PI / 0.7)) * (t < 0.95 ? 1 : 0) + Math.max(0, Math.sin((t - 1.4) * Math.PI / 0.7)) * (t >= 1.4 && t < 2.1 ? 0.7 : 0) : 0} />
      {front}
      {showFound && !isCl && t >= B.bagIn + 0.5 && <g>
        <ellipse cx={found.x + 40} cy={found.y - 128} rx={56} ry={92} fill="none" stroke="#fff" strokeWidth={8} strokeDasharray="16 10" />
        <Label x={500} y={1190} text="her 2nd bag" tx={found.x - 125} ty={found.y + 10} a={smooth(t, B.bagIn + 0.5, B.bagIn + 0.8)} size={84} />
      </g>}
    </g>
    <g transform={planeT(cam, 1.3)}><NearRail t={t} /></g>
  </g>;
};

const VoteScene: React.FC<{t: number}> = ({t}) => {
  const z = 1 + 0.02 * clamp((t - VOTE_AT) / 6);
  return <g transform={`translate(540 960) scale(${z}) translate(-540 -960)`}>
    <VoteBg t={t} />
    <VoteCard letter="A" l1={spec.choices.A.l1} l2={spec.choices.A.l2} y={600} age={t - B.cardA} rot={-1.5} id="va" />
    <VoteCard letter="B" l1={spec.choices.B.l1} l2={spec.choices.B.l2} y={940} age={t - B.cardB} rot={1.5} id="vb" />
  </g>;
};

const renderShot = (t: number, hook: Hook): React.ReactNode => {
  const id = shotAt(t);
  if (id === 'T1' || id === 'T2' || id === 'T3' || id === 'T4' || id === 'T5') return <TagInsert t={t} id={id} />;
  if (id === 'vote') return <VoteScene t={t} />;
  if (id === 'end') return <EndCard a={t - B.endcard} t={t} part={6} amberRibbon pill="next: part 6 (finale) · A or B" pillSize={52} tagline="a silent baggage-claim love story" />;
  if (id === 'X') return <ExitScene t={t} hook={hook} />;
  if (id === 'P') return <TwoBags t={t} />;
  if (id === 'Car') return <CarScene t={t} />;
  if (id === 'D' || id === 'DK') return <DeskScene t={t} hook={hook} id={id} />;
  return <Hall t={t} hook={hook} />;
};

// ------------------------------------------------------------------------------------------ overlays
const Pill: React.FC<{text: string; age: number}> = ({text, age}) => {
  const k = clamp(age / 0.3);
  const sp = k <= 0 ? 0 : 1 + Math.sin(k * Math.PI * 1.5) * Math.exp(-k * 4.2) * 0.35;
  return <g transform={`translate(98 455) scale(${sp})`}>
    <rect x={-80 + 6} y={-32 + 8} width={160} height={64} rx={18} fill={C.carbon} />
    <rect x={-80} y={-32} width={160} height={64} rx={18} fill={C.kraft} stroke={C.carbon} strokeWidth={5} />
    <text x={0} y={13} textAnchor="middle" fontFamily={JOST} fontWeight={800} fontSize={38} fill={C.carbon}>{text}</text>
  </g>;
};

const Scene: React.FC<{hook: Hook}> = ({hook}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const inWipe = t >= WIPE_AT && t < VOTE_AT;
  const inRew = t >= RW0 && t < RW1;
  const k = inWipe ? (t - WIPE_AT) / WIPE_DUR : inRew ? (t - RW0) / (RW1 - RW0) : 0;
  const cx = inRew ? flapEdge(1 - k) : flapEdge(k);
  const tH = RW0 - 1.0 * smooth(t, RW0, RW1);
  return <>
    <MotionBlurWhen fast={inWipe || inRew} samples={5} shutter={220}>
      <AbsoluteFill>
        <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, background: C.concrete}}>
          <Defs />
          {inWipe ? <>
            <Hall t={Math.min(t, WIPE_AT - 0.01)} hook={hook} />
            <defs><clipPath id="newShot"><rect x={cx} y={-10} width={1400} height={2000} /></clipPath></defs>
            <g clipPath="url(#newShot)"><VoteScene t={t} /></g>
            <FlapRim k={k} />
          </> : inRew ? <>
            {renderShot(tH, hook)}
            <defs><clipPath id="newShot"><rect x={-400} y={-10} width={cx + 400} height={2000} /></clipPath></defs>
            <g clipPath="url(#newShot)">{renderShot(RW1 + 0.001, hook)}</g>
            <FlapRim k={1 - k} />
          </> : renderShot(t, hook)}
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
          return <Strip key={i} text={s.text} y={s.y} age={t - s.from + (isHook ? 1 : 0.06)} out={isHook ? smooth(t, 2.35, 2.5) : smooth(t, s.to - 0.12, s.to)} size={isHook ? 58 : comment ? 76 : 62} hot={comment} rot={comment || isHook ? 0 : i % 2 ? 0.6 : -0.6} />;
        })}
        {t >= B.take1 && t < RW0 - 0.1 && <Pill text="take 1" age={t - B.take1} />}
        {t >= RW1 && t < B.payoff && !(t >= B.t4) && <Pill text="take 2" age={t - RW1} />}
      </svg>
    </AbsoluteFill>
  </>;
};

export const Bag5: React.FC<{hook?: Hook}> = ({hook = 'a'}) => (
  <AbsoluteFill style={{background: C.concrete}}>
    <Audio src={staticFile('audio/bag-ep5.wav')} volume={0.9} />
    <Scene hook={hook} />
  </AbsoluteFill>
);
