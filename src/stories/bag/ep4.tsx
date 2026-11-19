import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, lerp, smooth} from '../../lib/motion';
import {MotionBlurWhen} from '../../lib/shots';
import {
  Bag, BARLOW, C, Cam, Defs, EndCard, FarBelt, Floor, FlapRim, HallWall, Hand, JOST, KraftTag, Mouth, NearBelt, NearRail, Pen, Person, Phone, Pose,
  Strip, TagLine, VoteBg, VoteCard, WIPE_DUR, flapEdge, planeT, tagGeom, textW,
} from './world';
import spec from '../../../specs/stories/bag-ep4.json';

// Same Bag, part 4 "Long wait". Silent. Opener: his phone lit mid-swipe, she is beside him on one bench; he switches it off (hook b: she
// catches him first). Board flips RIDE / DELAYED 40 MIN. Take 1 (B): he hoists both bags and marches to the EXIT, the doors open on an empty
// kerb, her tag "(my ride's not here yet.)". Rewind. Take 2 (A): phone face down, the rate-that-bag tag game, board ticks down, payoff tag,
// cliff: belt stops, BELT 4 COMPLETE, BAGGAGE DESK lights. Vote, end card.

export const BAG4_FPS = 60;
export const BAG4_FRAMES = Math.round(spec.duration * BAG4_FPS);
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
type ShotId = 'A' | 'F' | 'X' | 'H' | 'S' | 'G' | 'Q' | 'Cl' | 'T1' | 'T2' | 'T3' | 'T4' | 'vote' | 'end';
const SHOTS: [number, ShotId][] = [[0, 'A'], [B.take1, 'F'], [B.exit, 'X'], [B.herTag, 'H'], [RW1, 'S'], [B.t1, 'T1'], [B.g1, 'G'], [B.t2, 'T2'], [B.g2 + 0.0, 'G'], [B.t3, 'T3'], [B.g3, 'G'],
  [B.t4, 'T4'], [B.q, 'Q'], [B.cliff, 'Cl'], [VOTE_AT, 'vote'], [B.endcard, 'end']];
const shotAt = (t: number): ShotId => keyAt(SHOTS, t);
const shotStart = (t: number) => { let s = 0; for (const [a] of SHOTS) if (t >= a) s = a; return s; };

type Fig = {x: number; y: number; s: number};
const PY = 815;
const FLOOR_Y = 1592;
const HIS_BAG = {x: 170, y: FLOOR_Y}, HERS_BAG = {x: 640, y: FLOOR_Y};
const LAYOUT: Record<string, {him: Fig; her: Fig}> = {
  bench: {him: {x: 290, y: PY, s: 1}, her: {x: 850, y: PY, s: 1}},
  Cl: {him: {x: 290, y: PY + 60, s: 1}, her: {x: 850, y: PY + 60, s: 1}},
  H: {him: {x: 290, y: PY, s: 1}, her: {x: 540, y: 760, s: 1.05}},
};
const layoutOf = (id: ShotId) => LAYOUT[id === 'Cl' ? 'Cl' : id === 'H' ? 'H' : 'bench'];

/** Arm with an elbow: upper arm shoulder -> elbow, then a hand (forearm) elbow -> hand. */
const Arm: React.FC<{who: 'him' | 'her'; sh: [number, number]; el: [number, number]; x: number; y: number; rot?: number; style?: 'fist' | 'open' | 'point'; scale?: number; opacity?: number}> = ({who, sh, el, x, y, rot = 0, style = 'fist', scale = 1, opacity = 1}) => (
  <g opacity={opacity}>
    <line x1={sh[0]} y1={sh[1]} x2={el[0]} y2={el[1]} stroke={C.ink} strokeOpacity={0.12} strokeWidth={96 * scale} strokeLinecap="round" transform="translate(10 14)" />
    <line x1={sh[0]} y1={sh[1]} x2={el[0]} y2={el[1]} stroke={who === 'him' ? C.olive : C.camel} strokeWidth={94 * scale} strokeLinecap="round" />
    <Hand who={who} x={x} y={y} rot={rot} base={el} style={style} scale={scale} />
  </g>
);

// ------------------------------------------------------------------------------------------ poses
const HIM_LOOK: KF[] = [[0, -0.6, 0.8], [1.3, -0.6, 0.8], [1.45, 0.9, 0.2], [1.7, -0.3, 0.9], [2.5, -0.3, 0.9], [2.7, 0.9, 0.2], [3.0, 0.1, -0.8], [5.0, 0.1, -0.8], [5.2, 0.7, 0.1], [5.6, 0, 0.1], [7.0, 0, 0.1],
  [7.1, 0.3, -0.3], [8.8, 0.3, -0.3], [9.0, 0.5, -0.2], [9.7, 0.5, -0.2], [12.2, 0.9, 0.2], [12.8, 0.9, 0.2], [13.0, 0.5, 0.8], [13.4, 0.9, 0.2], [22.9, 0.9, 0.2], [22.95, 0.9, 1.0], [23.5, 0.9, 1.0], [23.7, 0.9, 0.1],
  [24.5, 0.9, 0.1], [25.0, 0.9, 0.3]];
const HIM_MOUTH: [number, Mouth][] = [[0, 'flat'], [1.45, 'o'], [1.7, 'flat'], [2.7, 'gulp'], [3.1, 'flat'], [4.5, 'gulp'], [5.6, 'smirk'], [6.5, 'grit'], [7.0, 'smirk'], [8.8, 'o'], [9.2, 'grit'], [12.2, 'soft'],
  [13.4, 'smile'], [22.9, 'soft'], [23.7, 'smile'], [24.5, 'soft'], [25.0, 'o']];
const HER_LOOK_COMMON: KF[] = [[3.0, 0.1, -0.8], [5.0, 0.1, -0.8], [5.6, -0.9, 0.2], [7.0, -0.9, 0.2], [9.7, 0, 0.3], [11.4, 0, 0.3], [12.2, -0.9, 0.2], [13.3, -0.9, 0.3], [14.8, -0.4, 0.8], [15.8, -0.9, 0.3], [17.3, -0.9, 0.3],
  [18.0, -0.3, 0.8], [18.7, -0.9, 0.3], [20.2, -0.5, 0.8], [21.0, -0.9, 0.3], [22.9, -0.9, 0.3], [23.7, -0.9, 0.2], [24.5, -0.9, 0.2], [24.9, 0.3, 0.9], [25.4, 0.7, 0.8]];
const HER_LOOK_A: KF[] = [[0, -0.3, 0.6], [2.7, -0.3, 0.6]];
const HER_LOOK_B: KF[] = [[0, -0.3, 0.6], [0.55, -0.3, 0.6], [0.7, -0.95, 0.5], [2.2, -0.95, 0.4], [2.7, -0.3, 0.6]];
const HER_MOUTH: [number, Mouth][] = [[0, 'soft'], [3.0, 'soft'], [5.6, 'smirk'], [7.1, 'soft'], [9.8, 'smile'], [12.2, 'soft'], [13.3, 'smile'], [22.9, 'soft'], [23.7, 'smile'], [24.5, 'soft'], [25.0, 'flat']];
const blinkAt = (t: number, seed: number) => { const ph = (t + seed) % 3.7; return ph < 0.14 ? Math.sin((ph / 0.14) * Math.PI) : 0; };

const himPose = (t: number): Pose => {
  const [lx, ly] = kf(HIM_LOOK, t);
  const frozen = t >= B.freeze && t < B.pocket;
  const pomp = smooth(t, 5.6, 5.9) * (1 - smooth(t, 6.9, 7.1));
  const strain = smooth(t, 8.85, 9.1) * (1 - smooth(t, 9.6, 9.7));
  const glad = (t >= 13.4 && t < 22.9) || (t >= 23.7 && t < 24.5);
  const sweat = 0.8 * strain;
  const flush = Math.max(smooth(t, 1.45, 2.0) * (1 - smooth(t, 3.0, 4.0)), strain, pomp * 0.4, smooth(t, 13.4, 14.0) * 0.4);
  return {look: [lx, ly], brow: 0.1 + (frozen ? 0.4 : 0) + pomp * 0.5 + strain * 0.9 + (t > 24.9 ? 0.8 : 0), worry: strain * 0.6 + (t > 24.9 ? 0.5 : 0),
    mouth: keyAt(HIM_MOUTH, t), happy: glad, sweat, gulp: 0, tilt: glad ? Math.sin(t * 9) * 2 : pomp ? -5 * pomp + Math.sin(t * 3) * 1.5 : strain ? Math.sin(t * 40) * 3 : Math.sin(t * 0.9) * 1.1,
    bob: (glad ? -Math.abs(Math.sin(t * 9)) * 4 : 0) + 12 * smooth(t, 22.95, 23.15) * (1 - smooth(t, 23.5, 23.7)), blink: frozen || pomp > 0.5 ? 0 : blinkAt(t, 0.4), sway: frozen ? 0 : 1, flush};
};
const herPose = (t: number, hook: Hook): Pose => {
  const early = t < 2.7;
  const [lx, ly] = kf(early ? (hook === 'b' ? HER_LOOK_B : HER_LOOK_A) : [...(hook === 'b' ? HER_LOOK_B : HER_LOOK_A), ...HER_LOOK_COMMON], t);
  const catchK = hook === 'b' ? smooth(t, 0.62, 0.8) * (1 - smooth(t, 1.5, 2.0)) : 0;
  const catchTilt = hook === 'b' ? -7 * smooth(t, 0.62, 0.85) * (1 - smooth(t, 2.0, 2.7)) : 0;
  const fell = t >= B.faceFalls;
  const happy = (t >= 9.8 && t < 11.4) || (t >= 13.3 && t < 22.9) || (t >= 23.7 && t < 24.9);
  let mouth = keyAt(HER_MOUTH, t);
  if (hook === 'b' && t >= 0.7 && t < 2.7) mouth = t < 1.6 ? 'o' : 'smirk';
  return {look: [lx, ly], brow: 0.1 + catchK * 0.9 + (fell ? 0.6 : 0), browR: 0.1 + catchK * 0.9 + (fell ? 0.2 : 0), worry: fell ? 1 : 0, mouth, happy, sweat: 0, gulp: 0,
    tilt: catchTilt + (fell ? 5 : happy ? Math.sin(t * 7 + 1) * 2 : Math.sin(t * 0.8 + 2) * 1.2), bob: fell ? 6 : happy && t >= 17 && t < 18.5 ? -Math.abs(Math.sin(t * 14)) * 4 : 0, blink: blinkAt(t, 1.9), sway: 1, flush: 0};
};

// ------------------------------------------------------------------------------------------ belt
const BELT_SPEED = 300;
const beltPos = (t: number) => {
  const k = clamp((t - B.cliff) / 0.5);
  return BELT_SPEED * Math.min(t, B.cliff) + BELT_SPEED * 0.25 * (1 - (1 - k) * (1 - k));
};
const swipeOf = (ticks: number[], t: number) => {
  let idx = -1;
  for (let i = 0; i < ticks.length; i++) if (ticks[i] <= t) idx = i;
  if (idx < 0) return {p: 0, dir: 1};
  return {p: clamp((t - ticks[idx]) / 0.26), dir: idx % 2 ? -1 : 1};
};
const HIM_TICKS = [-0.1, ...spec.audio.swipeTicks];
const LEO_T = B.g1, BOOT_T = 16.6;
const leoX = (t: number) => 780 - BELT_SPEED * (t - LEO_T);
const bootX = (t: number) => 1250 - BELT_SPEED * (t - BOOT_T);

// ------------------------------------------------------------------------------------------ whole-frame tag inserts
type InsLine = [string, number, number];
type Ins = {t0: number; t1: number; who: 'him' | 'her'; lines: InsLine[]; H: number; size: number; slide: number};
const INS: Record<string, Ins> = {
  T1: {t0: B.t1, t1: B.g1, who: 'her', lines: [['(rate that', 13.5, 14.0], ['bag.)', 14.0, 14.4]], H: 540, size: 160, slide: -14.55},
  T2: {t0: B.t2, t1: B.g2, who: 'him', lines: [['(7. strong', 16.0, 16.5], ['wheels.)', 16.5, 16.9]], H: 540, size: 160, slide: 17.05},
  T3: {t0: B.t3, t1: B.g3, who: 'her', lines: [['(2. lonely.)', 18.9, 19.6]], H: 400, size: 160, slide: -19.9},
  T4: {t0: B.t4, t1: B.q, who: 'her', lines: [['(best part of', 21.3, 22.0], ['my whole trip.)', 22.0, 22.6]], H: 540, size: 160, slide: 0},
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

// ------------------------------------------------------------------------------------------ props and small parts
const CELLS_L: [number, string][] = [[0, 'ARRIVALS'], [B.boardFlip, 'RIDE'], [B.flipComplete, 'BELT 4']];
const CELLS_R: [number, string][] = [[0, 'BELT 4'], [B.boardFlip, 'DELAYED 40 MIN'], [B.flip25, 'DELAYED 25 MIN'], [B.flip10, 'DELAYED 10 MIN'], [B.flipComplete, 'COMPLETE']];
const cellColor = (txt: string) => txt === 'ARRIVALS' || txt.startsWith('DELAYED') ? C.amber : txt === 'COMPLETE' ? C.hiVis : '#fff';
/** Departure board: each cell flips on its own when its text changes. */
const Board4: React.FC<{t: number; y: number}> = ({t, y}) => {
  const cell = (list: [number, string][], x: number, w: number) => {
    let i = 0;
    list.forEach(([a], j) => { if (t >= a) i = j; });
    const f = i === 0 ? 1 : wp(t, list[i][0], list[i][0] + 0.35);
    const txt = f < 0.5 ? list[Math.max(0, i - 1)][1] : list[i][1];
    const sy = f >= 1 ? 1 : Math.max(0.04, Math.abs(Math.cos(f * Math.PI)));
    const fs = textW(txt, `700 66px ${BARLOW}`) + 3 * txt.length > w - 30 ? 54 : 66;
    return <g key={x} transform={`translate(${x} ${y}) scale(1 ${sy})`}>
      <rect x={-w / 2} y={-44} width={w} height={88} rx={10} fill="#2A2A2F" stroke="#000" strokeWidth={3} />
      <text x={0} y={22} textAnchor="middle" fontFamily={BARLOW} fontWeight={700} fontSize={fs} letterSpacing={3} fill={cellColor(txt)}>{txt}</text>
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

const DeskSign: React.FC<{lit: number; t: number}> = ({lit, t}) => {
  const flick = lit > 0 && lit < 1 ? (Math.sin(t * 60) > 0 ? 1 : 0.4) : 1;
  return <g>
    {lit > 0 && <ellipse cx={540} cy={400} rx={460} ry={150} fill="url(#glowSky)" opacity={0.0} />}
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

/** His phone back-up (face down): k 0 = held upright, 1 = flat on the bench. */
const BackPhone: React.FC<{x: number; y: number; k: number}> = ({x, y, k}) => {
  const w = lerp(122, 200, k), h = lerp(216, 46, k);
  return <g transform={`translate(${x} ${y})`}>
    <rect x={-w / 2 + 8} y={-h / 2 + 12} width={w} height={h} rx={lerp(24, 12, k)} fill={C.ink} opacity={0.25} />
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={lerp(24, 12, k)} fill="#2B2B31" stroke="#55555E" strokeWidth={4} />
    <circle cx={lerp(-w / 2 + 30, -w / 2 + 28, k)} cy={lerp(-h / 2 + 30, 0, k)} r={lerp(15, 9, k)} fill="#15151A" stroke="#6A6A74" strokeWidth={3} />
    <rect x={-w / 2 + 6} y={-h / 2 + 4} width={w - 12} height={4} rx={2} fill="#fff" opacity={0.12} />
  </g>;
};

const LeoBag: React.FC<{x: number; y: number}> = ({x, y}) => <g transform={`translate(${x} ${y}) scale(0.9)`}>
  <Bag x={0} y={0} loop={false} tag={false} body="#E3A33B" deep="#B97A1E">
    {[[-64, -108], [30, -122], [-6, -50], [74, -64], [-76, -2], [66, 10], [-30, 160], [60, 148], [-78, 138]].map(([cx, cy], i) =>
      <g key={i} transform={`translate(${cx} ${cy}) rotate(${i * 37})`}><ellipse rx={23} ry={16} fill="#5A3510" /><ellipse rx={10} ry={6} fill="#E3A33B" /></g>)}
  </Bag>
</g>;

const SkiBoot: React.FC<{x: number; y: number}> = ({x, y}) => <g transform={`translate(${x} ${y}) scale(1.15)`}>
  <path d="M -80 120 L 134 120 L 134 150 L -80 150 Z" fill={C.ink} opacity={0.2} transform="translate(8 8)" />
  <path d="M -66 -120 L 44 -120 L 44 14 Q 44 44 84 58 L 116 72 Q 132 80 132 100 L 132 124 L -90 124 L -90 78 Q -66 54 -66 20 Z" fill={C.sky} stroke={C.carbon} strokeWidth={7} strokeLinejoin="round" />
  <rect x={-94} y={104} width={230} height={42} rx={16} fill={C.carbon} />
  <rect x={-94} y={104} width={230} height={10} rx={5} fill={C.hiVis} />
  <rect x={-76} y={-146} width={130} height={40} rx={14} fill="#fff" stroke={C.carbon} strokeWidth={6} />
  {[-70, -28, 14].map((yy) => <g key={yy}><rect x={24} y={yy - 9} width={34} height={20} rx={7} fill={C.amber} stroke={C.carbon} strokeWidth={4} /></g>)}
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

// ------------------------------------------------------------------------------------------ exit scene (take 1)
const ExitScene: React.FC<{t: number}> = ({t}) => {
  const open = smooth(t, B.doorsOpen, B.doorsOpen + 0.7);
  const arrive = smooth(t, B.exit, B.stop);
  const walking = t < B.stop + 0.1;
  const hx = lerp(-160, 520, arrive);
  const bob = walking ? Math.abs(Math.sin(t * 9.5)) * 14 : 0;
  const hy = 990 - bob;
  const strain = smooth(t, 8.85, 9.1);
  const shake = strain > 0 ? Math.sin(t * 46) * 5 * strain : 0;
  const sag = strain * 34;
  const pose = himPose(t);
  const swing = walking ? Math.sin(t * 9.5) * 4 : 0;
  const s = 0.62;
  const handY = hy + 330 + sag + shake;
  const bagY = handY + 112;
  const bags = [-1, 1].map((sd) => ({sd, hx: hx + sd * 262, bx: hx + sd * 262 + (walking ? swing * sd : shake * 0.5)}));
  const op = {x0: 190, x1: 890, y0: 540, y1: 1530};
  const panelW = 350;
  const lx = op.x0 - open * 340, rx = 540 + open * 340;
  const pane = (x: number, key: string) => <g key={key}>
    <rect x={x} y={op.y0} width={panelW} height={op.y1 - op.y0} fill="#EAF4FB" opacity={0.78} />
    <rect x={x} y={op.y0} width={panelW} height={op.y1 - op.y0} fill="none" stroke={C.carbon} strokeWidth={10} />
    <path d={`M ${x + 60} ${op.y0} L ${x + 150} ${op.y0} L ${x + 20} ${op.y0 + 420} L ${x - 20} ${op.y0 + 420} Z`} fill="#fff" opacity={0.55} />
    <path d={`M ${x + 190} ${op.y0} L ${x + 230} ${op.y0} L ${x + 100} ${op.y0 + 420} L ${x + 80} ${op.y0 + 420} Z`} fill="#fff" opacity={0.4} />
    <rect x={x + (key === 'l' ? panelW - 34 : 20)} y={900} width={14} height={260} rx={7} fill={C.carbon} />
    <rect x={x} y={1000} width={panelW} height={26} fill={C.hiVis} opacity={0.0} />
  </g>;
  const cupX = lerp(880, 250, wp(t, B.doorsOpen + 0.2, B.herTag + 0.2));
  return <g>
    <g transform={planeT({x: 540 + Math.sin(t * 0.7) * 4, y: 960, z: 1}, 0.2)}><HallWall /></g>
    <defs>
      <linearGradient id="skyG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8EC9FF" /><stop offset="1" stopColor="#DCEEFF" /></linearGradient>
      <clipPath id="opening"><rect x={op.x0} y={op.y0} width={op.x1 - op.x0} height={op.y1 - op.y0} /></clipPath>
    </defs>
    {/* door frame and kerb */}
    <rect x={150} y={420} width={780} height={1130} rx={16} fill={C.carbon} />
    <rect x={330} y={436} width={420} height={92} rx={14} fill={C.hiVis} stroke="#000" strokeWidth={4} />
    <text x={540} y={506} textAnchor="middle" fontFamily={JOST} fontWeight={800} fontSize={72} letterSpacing={8} fill={C.carbon}>EXIT</text>
    <g clipPath="url(#opening)">
      <rect x={op.x0} y={op.y0} width={700} height={720} fill="url(#skyG)" />
      <rect x={200} y={1080} width={90} height={190} fill="#B6C7D6" /><rect x={300} y={1130} width={70} height={140} fill="#C3D2DF" /><rect x={640} y={1100} width={110} height={170} fill="#B6C7D6" />
      <rect x={op.x0} y={1250} width={700} height={44} fill="url(#hazard)" />
      <rect x={op.x0} y={1294} width={700} height={240} fill="#2C2C32" />
      <line x1={op.x0} x2={op.x1} y1={1410} y2={1410} stroke="#fff" strokeWidth={8} strokeDasharray="60 50" opacity={0.7} />
      <rect x={712} y={760} width={16} height={500} fill={C.carbon} />
      <rect x={570} y={680} width={300} height={130} rx={14} fill={C.hiVis} stroke={C.carbon} strokeWidth={7} />
      <text x={720} y={760} textAnchor="middle" fontFamily={JOST} fontWeight={800} fontSize={58} fill={C.carbon}>PICK-UP</text>
      <g transform={`translate(${cupX} ${1346 - Math.abs(Math.sin(t * 5)) * 10}) rotate(${t * 240})`}><circle r={20} fill="#F7F4EC" stroke={C.carbon} strokeWidth={4} /><path d="M -10 -4 L 10 6 M -6 8 L 8 -8" stroke={C.carbon} strokeWidth={3} /></g>
      {open > 0.6 && [0, 1, 2].map((i) => <line key={i} x1={820 - ((t * 400 + i * 130) % 600)} x2={760 - ((t * 400 + i * 130) % 600)} y1={1180 + i * 50} y2={1180 + i * 50} stroke="#fff" strokeWidth={7} strokeLinecap="round" opacity={0.7} />)}
      <g>{pane(lx, 'l')}{pane(rx, 'r')}</g>
    </g>
    {/* him and the floor */}
    <Person who="him" x={hx} y={hy} s={s} t={t} pose={pose} seed={0.4} />
    <rect x={-100} y={1530} width={1300} height={500} fill="#C9C5BA" />
    <rect x={-100} y={1530} width={1300} height={14} fill={C.carbon} opacity={0.18} />
    {bags.map(({sd, hx: ax, bx}) => <g key={sd}>
      <Arm who="him" sh={[hx + sd * 150, hy + 190]} el={[hx + sd * 225, hy + 290 + sag * 0.4]} x={ax + shake * 0.5 * sd} y={handY} rot={0} scale={0.62} />
      <Bag x={bx} y={bagY} loop={sd === 1} tag={sd === -1} ribbon={sd === -1 ? 1 : 0} ribbonColor={C.amber} scale={0.6} rot={walking ? swing * sd * 0.8 : shake * 0.4} shake={0} />
      {strain > 0.3 && <g stroke={C.amber} strokeWidth={7} strokeLinecap="round" opacity={0.9}>{[0, 1].map((i) => <line key={i} x1={ax + sd * (70 + i * 26)} x2={ax + sd * (90 + i * 26)} y1={handY - 10 - i * 16} y2={handY - 40 - i * 16} />)}</g>}
    </g>)}
  </g>;
};

// ------------------------------------------------------------------------------------------ hall (bench scenes)
const Hall: React.FC<{t: number; hook: Hook}> = ({t, hook}) => {
  const id = shotAt(t);
  const L = layoutOf(id);
  const lt = t - shotStart(t);
  const cam: Cam = {x: 540 + Math.sin(t * 0.7) * 4 + lt * 2, y: 960 + Math.sin(t * 1.0) * 3, z: 1 + 0.012 * Math.min(1, lt / 2.5)};
  const pos = beltPos(t);
  const him = himPose(t), her = herPose(t, hook);
  const hs = swipeOf(HIM_TICKS, t);
  const mid: React.ReactNode[] = [];
  const front: React.ReactNode[] = [];
  const isH = id === 'H', isCl = id === 'Cl';
  const bs = 1 + 0.2 * smooth(t, 3.0, 3.3);
  const lit = isCl ? smooth(t, B.deskLit - 0.05, B.deskLit) : 0;

  // him: sits back down in take 2
  const himY = id === 'S' ? L.him.y - 190 * (1 - smooth(t, RW1 + 0.05, RW1 + 0.6)) + Math.exp(-(t - RW1 - 0.6) * 8) * (t > RW1 + 0.6 ? -10 * Math.abs(Math.sin((t - RW1 - 0.6) * 18)) : 0) : L.him.y;

  // ---- opener: his phone
  if (t < 2.8) {
    const moveDown = smooth(t, B.pocket, 2.6);
    const px = 215, py = 1125 + 440 * moveDown, pr = -6 + 8 * moveDown;
    const off = t >= B.powerOff;
    mid.push(<Phone key="ph" who="him" x={px} y={py} rot={pr} scale={1.3} p={t < B.freeze ? hs.p : 0} dir={hs.dir} thumb={t < B.freeze ? 1 : 0} lit={off ? 0 : 1} base={[250, 2150]} />);
    if (off) {
      const a = smooth(t, B.powerOff, B.powerOff + 0.12);
      mid.push(<g key="pw" transform={`translate(${px} ${py}) scale(1.3) rotate(${pr})`} opacity={a}>
        <circle r={46} fill="none" stroke="#E6EEF8" strokeWidth={11} strokeDasharray="205 84" strokeLinecap="round" transform="rotate(-62)" />
        <line x1={0} y1={-62} x2={0} y2={-10} stroke="#E6EEF8" strokeWidth={11} strokeLinecap="round" />
      </g>);
    }
    if (t >= B.powerOff - 0.1 && t < B.powerOff + 0.35) mid.push(<g key="clk" transform={`translate(${px} ${py}) scale(1.3) rotate(${pr})`} stroke={C.amber} strokeWidth={8} strokeLinecap="round">
      <line x1={112} y1={-70} x2={142} y2={-84} /><line x1={116} y1={-46} x2={152} y2={-46} /><line x1={112} y1={-22} x2={142} y2={-8} />
    </g>);
  }

  // ---- F: he flexes then hoists both bags
  let hisBag = {...HIS_BAG}, hersBag = {...HERS_BAG};
  const carrying = id === 'F';
  if (carrying) {
    const up = smooth(t, B.flexUp, B.flexUp + 0.3) * (1 - smooth(t, 6.3, 6.5));
    const lift = smooth(t, B.hoist, B.exit - 0.1);
    const hb = smooth(t, 6.3, 6.55);
    hisBag = {x: HIS_BAG.x, y: lerp(FLOOR_Y, 1400, lift)};
    hersBag = {x: HERS_BAG.x, y: lerp(FLOOR_Y, 1400, lift)};
    const sh = Math.sin(t * 22) * 4 * up;
    [-1, 1].forEach((sd) => {
      const tgt = sd === -1 ? hisBag : hersBag;
      const shoulder: [number, number] = [L.him.x + sd * 240, 1020];
      const fx = L.him.x + sd * 300 + sh * sd, fy = lerp(1330, 950, up);
      const hxp = lerp(fx, tgt.x, hb), hyp = lerp(fy, tgt.y - 197, hb);
      const elF: [number, number] = [L.him.x + sd * 400, 1200 - up * 60];
      const elT: [number, number] = [(shoulder[0] + hxp) / 2 + sd * 40, (shoulder[1] + hyp) / 2 + 40];
      front.push(<g key={`fx${sd}`}>
        <Arm who="him" sh={shoulder} el={[lerp(elF[0], elT[0], hb), lerp(elF[1], elT[1], hb)]} x={hxp} y={hyp} rot={sd * -14 * (1 - hb)} scale={0.95} />
        {sd === -1 && up > 0.6 && hb < 0.5 && <g stroke={C.amber} strokeWidth={9} strokeLinecap="round">{[0, 1, 2].map((i) => <line key={i} x1={L.him.x + sd * (370 + i * 12)} y1={930 - i * 40} x2={L.him.x + sd * (410 + i * 22)} y2={900 - i * 56} />)}</g>}
      </g>);
    });
  }

  // ---- S: phone goes face down on the bench; stays there
  const phoneOn = t >= RW1 + 0.3 && t < B.cliff;
  const flatX = 575, flatY = 1206;
  if (id === 'S' || phoneOn) {
    if (t >= RW1 + 0.3) {
      const k = smooth(t, RW1 + 0.4, B.phoneDown);
      const down = smooth(t, B.phoneDown - 0.3, B.phoneDown);
      const px = lerp(250, flatX, k), py = lerp(1470, flatY, k) - Math.sin(k * Math.PI) * 150;
      mid.push(<BackPhone key="bp" x={px} y={py} k={down} />);
      if (k < 1) {
        const hxp = px - 20 + 30 * down, hyp = py + 70 - 30 * down;
        front.push(<Arm key="hd" who="him" sh={[L.him.x + 200, 1020]} el={[lerp(L.him.x + 240, px - 40, k), lerp(1330, py + 120, k)]} x={hxp} y={hyp} scale={0.85} opacity={1 - smooth(t, B.phoneDown, B.phoneDown + 0.25)} />);
      }
    }
  }

  // ---- G: pointing hands at the belt items
  if (id === 'G') {
    if (t < B.t2 && t >= B.g1) {
      const k = smooth(t, B.g1 + 0.05, B.g1 + 0.35);
      const lx = leoX(t);
      front.push(<Arm key="pt" who="her" sh={[L.her.x - 230, 1020]} el={[lerp(L.her.x - 200, lx + 120, k), lerp(1290, 1000, k)]} x={lerp(L.her.x - 100, lx + 20, k)} y={930 + Math.sin(t * 11) * 8} rot={200} style="point" scale={0.85} />);
    }
    if (t >= 17.8 && t < B.t3) {
      const k = smooth(t, 17.8, 18.1), bx = bootX(t);
      front.push(<Arm key="pt2" who="him" sh={[L.him.x + 230, 1020]} el={[lerp(L.him.x + 260, bx - 140, k), lerp(1290, 1000, k)]} x={lerp(L.him.x + 300, bx - 40, k)} y={930 + Math.sin(t * 11) * 8} rot={160} style="point" scale={0.85} />);
    }
  }

  // ---- Q: his hand creeps toward the dark phone and goes back
  if (id === 'Q') {
    const k = smooth(t, 23.1, 23.4) * (1 - smooth(t, 23.7, 24.0));
    if (k > 0.02) front.push(<Arm key="cr" who="him" sh={[L.him.x + 220, 1020]} el={[L.him.x + 300 + k * 60, 1320 - k * 30]} x={lerp(L.him.x + 300, flatX - 90, k)} y={lerp(1380, 1146, k)} rot={150} style="open" scale={0.8} />);
  }

  // ---- H: her tag held up
  if (isH) {
    const ty = lerp(1560, 1085, smooth(t, B.herTag + 0.1, B.herTag + 0.45));
    const hp = [[540 + 405, ty + 150], [540 - 405, ty + 150]];
    front.push(<g key="ht">
      <Arm who="her" sh={[540 + 230, 1020]} el={[540 + 330, ty + 160]} x={hp[0][0]} y={hp[0][1]} scale={0.75} />
      <Arm who="her" sh={[540 - 230, 1020]} el={[540 - 330, ty + 160]} x={hp[1][0]} y={hp[1][1]} scale={0.75} />
      <KraftTag w={880} h={330} lines={[{txt: spec.cards.her_tag_take1[0], p: 1}, {txt: spec.cards.her_tag_take1[1], p: 1}]} size={125} x={540} y={ty} rot={-2.5 + Math.sin(t * 2) * 0.6} id="hh" string={false} />
      {hp.map(([hx, hy], i) => <Hand key={i} who="her" x={hx - 10 * (i ? -1 : 1)} y={hy + 30} base={[hx, hy]} scale={0.75} />)}
    </g>);
  }

  return <g>
    <g transform={planeT(cam, 0.2)}><HallWall /></g>
    <g transform={planeT(cam, 0.45)}><FarBelt t={t} pos={-pos * 0.9} empty={isCl} keyBag={null} keyRibbon /></g>
    <g transform={planeT(cam, 0.25)}>
      <g transform={`translate(540 585) scale(${bs}) translate(-540 -585)`}><Board4 t={t} y={585} /></g>
      {isCl && <DeskSign lit={lit} t={t} />}
    </g>
    <g transform={planeT(cam, 0.9)}>
      {!isH && <Person who="him" x={L.him.x} y={himY} s={L.him.s} t={t} pose={him} seed={0.4} />}
      <Person who="her" x={L.her.x} y={L.her.y} s={L.her.s} t={t} pose={her} seed={1.9} />
      {hook === 'b' && t >= 0.6 && t < 1.95 && <Exclaim x={965} y={545} k={wp(t, 0.62, 1.0)} />}
      <Bench />
      {mid}
    </g>
    <g transform={planeT(cam, 1.0)}>
      <NearBelt pos={pos} />
      <Floor />
      {t >= B.g1 - 2.0 && t < B.cliff && <LeoBag x={leoX(t)} y={1285 - 0.9 * (165 + 26)} />}
      {t >= BOOT_T - 0.5 && t < B.cliff && <SkiBoot x={bootX(t)} y={1285 - 1.15 * 124} />}
      {!isH && <Bag x={hisBag.x} y={hisBag.y} loop={false} tag ribbon={1} ribbonColor={C.amber} pouch />}
      {!isH && <Bag x={hersBag.x} y={hersBag.y} loop tag={false} />}
      {isCl && <g opacity={smooth(t, B.faceFalls - 0.1, B.faceFalls + 0.3)} transform="translate(930 1575)">
        <rect x={-120} y={-165} width={240} height={330} rx={34} fill="#fff" fillOpacity={0.25} stroke={C.carbon} strokeWidth={8} strokeDasharray="22 16" />
        <path d="M -56 -171 L -56 -211 Q -56 -229 -38 -229 L 38 -229 Q 56 -229 56 -211 L 56 -171" fill="none" stroke={C.carbon} strokeWidth={9} strokeDasharray="16 12" strokeLinecap="round" />
        <text x={0} y={42} textAnchor="middle" fontFamily={JOST} fontWeight={800} fontSize={190} fill={C.carbon} opacity={0.85}>?</text>
      </g>}
      {front}
    </g>
    <g transform={planeT(cam, 1.3)}><NearRail t={t} /></g>
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

const renderShot = (t: number, hook: Hook): React.ReactNode => {
  const id = shotAt(t);
  if (id === 'T1' || id === 'T2' || id === 'T3' || id === 'T4') return <TagInsert t={t} id={id} />;
  if (id === 'vote') return <VoteScene t={t} />;
  if (id === 'end') return <EndCard a={t - B.endcard} t={t} part={5} amberRibbon prefix="next: " />;
  if (id === 'X') return <ExitScene t={t} />;
  return <Hall t={t} hook={hook} />;
};

// ------------------------------------------------------------------------------------------ overlays
const Chip: React.FC<{letter: string; l1: string; l2: string; x: number; y: number; a: number}> = ({letter, l1, l2, x, y, a}) => {
  const k = clamp(a / 0.3);
  const sp = k <= 0 ? 0 : 1 + Math.sin(k * Math.PI * 1.5) * Math.exp(-k * 4.2) * 0.3;
  return <g transform={`translate(${x} ${y}) scale(${sp})`}>
    <rect x={-250 + 8} y={-62 + 10} width={500} height={124} rx={22} fill={C.carbon} />
    <rect x={-250} y={-62} width={500} height={124} rx={22} fill={C.kraft} stroke={C.carbon} strokeWidth={6} />
    <circle cx={-196} cy={0} r={38} fill={C.hiVis} stroke={C.carbon} strokeWidth={5} />
    <text x={-196} y={22} textAnchor="middle" fontFamily={JOST} fontWeight={800} fontSize={58} fill={C.carbon}>{letter}</text>
    <text x={-140} y={-6} fontFamily={JOST} fontWeight={800} fontSize={37} fill={C.carbon}>{l1}</text>
    <text x={-140} y={40} fontFamily={JOST} fontWeight={800} fontSize={37} fill={C.carbon}>{l2}</text>
  </g>;
};
const Badge: React.FC<{letter: string; age: number}> = ({letter, age}) => {
  const k = clamp(age / 0.3);
  const sp = k <= 0 ? 0 : 1 + Math.sin(k * Math.PI * 1.5) * Math.exp(-k * 4.2) * 0.35;
  return <g transform={`translate(985 440) scale(${sp})`}>
    <circle r={50} fill={C.carbon} transform="translate(6 8)" /><circle r={50} fill={C.hiVis} stroke={C.carbon} strokeWidth={6} />
    <text x={0} y={26} textAnchor="middle" fontFamily={JOST} fontWeight={800} fontSize={72} fill={C.carbon}>{letter}</text>
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
  const tH = RW0 - 2.7 * smooth(t, RW0, RW1);
  const chipA = t - B.chips, chipOut = smooth(t, 5.4, 5.55);
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
          return <Strip key={i} text={s.text} y={s.y} age={t - s.from + (isHook ? 1 : 0.06)} out={isHook ? smooth(t, 2.85, 3.0) : smooth(t, s.to - 0.12, s.to)} size={isHook ? 58 : comment ? 76 : 62} hot={comment} rot={comment || isHook ? 0 : i % 2 ? 0.6 : -0.6} />;
        })}
        {chipA > 0 && t < 5.6 && <g opacity={1 - chipOut}>
          <Chip letter="A" l1={spec.cards.recapA[0]} l2={spec.cards.recapA[1]} x={281} y={1165} a={chipA} />
          <Chip letter="B" l1={spec.cards.recapB[0]} l2={spec.cards.recapB[1]} x={799} y={1165} a={chipA - 0.15} />
        </g>}
        {t >= B.take1 && t < RW0 - 0.1 && <Badge letter="B" age={t - B.take1} />}
        {t >= RW1 && t < B.t4 && <Badge letter="A" age={t - RW1} />}
      </svg>
    </AbsoluteFill>
  </>;
};

export const Bag4: React.FC<{hook?: Hook}> = ({hook = 'a'}) => (
  <AbsoluteFill style={{background: C.concrete}}>
    <Audio src={staticFile('audio/bag-ep4.wav')} volume={0.9} />
    <Scene hook={hook} />
  </AbsoluteFill>
);
