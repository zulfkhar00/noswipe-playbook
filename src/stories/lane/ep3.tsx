import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, lerp, smooth} from '../../lib/motion';
import {MotionBlurWhen} from '../../lib/shots';
import {
  BAR, C, Ball, Carpet, Cell, Cam, CamKey, Figure, Keypad, LanesBg, Memphis, Monitor, NameCells, NUN, Pin, Pose, ReturnHump, Strip,
  Wall, WIPE_DUR, WipeBall, KEYP, camAt, keyAt, planeT, track, wipeGeom, Mouth,
} from './world';
import {BackFigure} from './ep1';
import spec from '../../../specs/stories/lane-ep3.json';

// Lane 8, part 3 "Loser buys fries". Frame 1: ONE strip, two big boards (his cursor blinks, hers LOSER BUYS FRIES?), two big
// figures. Take A LET U WIN: he rolls a gutter on purpose, fake shrug, her box REALLY?, she bowls alone; rewind. Take B DEAL:
// both bowl for real, she spares, his last pin wobbles and falls (he wins 143-141), I BUY., fries slid along the ball return,
// half slid back. Cliffhanger: her box types NAME? slowly while his still says PLAYER 7. Vote A PLAYER 7 / B DAN.

export const LANE3_FPS = 60;
export const LANE3_FRAMES = Math.round(spec.duration * LANE3_FPS);
const B = spec.beats;
export type Hook = 'a' | 'b';

// ------------------------------------------------------------------------------------------ name boxes
type State = {t0: number; text: string; stagger?: number; instant?: boolean};
const cellsFor = (states: State[], t: number, color: string): Cell[] => {
  let i = 0;
  while (i + 1 < states.length && t >= states[i + 1].t0) i++;
  const cur = states[i], prev = states[Math.max(0, i - 1)];
  return Array.from({length: 9}, (_, n) => ({
    ch: cur.text[n] ?? ' ', prev: i === 0 ? (cur.text[n] ?? ' ') : (prev.text[n] ?? ' '),
    flipAt: i === 0 ? -1e9 : cur.t0 + n * (cur.stagger ?? 0.12), color, instant: cur.instant,
  }));
};
const HERS: State[] = [
  {t0: -1e9, text: 'FRIES?'}, {t0: B.herReally, text: 'REALLY?', stagger: 0.04}, {t0: B.rewind + 0.3, text: 'FRIES?', stagger: 0.04},
  {t0: B.fine, text: 'FINE.', stagger: 0.06}, {t0: B.herHitB + 0.05, text: 'SPARE!', stagger: 0.04}, {t0: B.iBuy, text: 'I BUY.', stagger: 0.06}, {t0: B.cliff, text: '', stagger: 0.03}, {t0: B.name, text: 'NAME?', stagger: 0.26},
];
const TY1 = 0.11, TY2 = 0.12;
const HIS: State[] = [
  {t0: -1e9, text: ''}, {t0: B.type1, text: 'LET U WIN', stagger: TY1, instant: true}, {t0: B.rewind + 0.3, text: '', stagger: 0, instant: true},
  {t0: B.type2, text: 'DEAL', stagger: TY2, instant: true}, {t0: B.cliff, text: 'PLAYER 7', stagger: 0.05},
];
const hisScore = (t: number) => (t >= B.fall ? '143' : '133');
const herScore = (t: number) => ((t >= B.herHitA && t < B.wipe3) || t >= B.herHitB ? '141' : '131');
const pulse = (t: number, a: number, d = 0.5) => (t >= a && t < a + d ? Math.sin((t - a) / d * Math.PI) : 0);
const boards = (t: number) => ({
  his: cellsFor(HIS, t, C.orange), hers: cellsFor(HERS, t, C.mint),
  hisPop: pulse(t, B.fall, 0.6), herPop: Math.max(pulse(t, B.herHitA), pulse(t, B.herHitB)),
});

// ------------------------------------------------------------------------------------------ the cast
const k = (lx: number, ly: number, brow: number, tilt: number, dy: number, a1: [number, number], a2: [number, number], blush = 0, thumb = 0) =>
  [lx, ly, brow, tilt, dy, a1[0], a1[1], a2[0], a2[1], blush, thumb];
const fig = (v: number[], mouth: Mouth): Pose => ({lx: v[0], ly: v[1], brow: v[2], tilt: v[3], dy: v[4], a1: [v[5], v[6]], a2: [v[7], v[8]], blush: v[9], thumb: v[10], mouth});
const HR1: [number, number] = [-100, -128], HR2: [number, number] = [78, -58], R1: [number, number] = [-70, -52], R2: [number, number] = [76, -52];
const UP1: [number, number] = [-92, -330], UP2: [number, number] = [92, -330];
const himKeys: [number, number[]][] = [
  [0, k(1, 0.2, 0.4, 4, 0, HR1, HR2, 0.1)], [3.3, k(1, 0.2, 0.4, 4, 0, HR1, HR2, 0.1)], [4.7, k(0.4, 0.6, 0.3, 0, 0, HR1, HR2, 0.2)],
  [B.gutterShot - 0.1, k(0.4, 0.6, 0.3, 0, 0, HR1, HR2, 0.2)],
  [B.bay2, k(1, 0.1, 0.5, 3, 0, HR1, HR2, 0.1)], [B.bay2 + 0.3, k(0.7, -0.3, 1, -7, 0, [-170, -196], [170, -196], 0)], [B.herTurn + 0.2, k(0.7, -0.3, 1, -7, 0, [-170, -196], [170, -196], 0)],
  [B.wipe3, k(1, 0.2, 0.4, 4, 0, HR1, HR2, 0.1)], [B.type2 + 0.7, k(0.4, 0.7, 0.2, 0, 0, HR1, HR2, 0.2)],
  [B.bay3, k(1, -0.1, 0.8, 0, 0, R1, R2, 0.2)], [B.hisShot - 0.1, k(1, -0.1, 0.8, 0, 0, R1, R2, 0.2)],
  [B.bay4, k(0, -0.4, 1, -5, 0, UP1, UP2, 0.8)], [B.bay4 + 0.9, k(0, -0.4, 1, -5, 0, UP1, UP2, 0.8)], [B.fries - 0.05, k(1, 0.4, 0.3, 3, 0, R1, R2, 0.5)],
  [B.cliff, k(0, -1, 0.9, -3, 0, R1, R2, 0.4)],
];
const himMouth = (t: number): Mouth => keyAt<Mouth>(t, [[0, 'flat'], [B.bay2, 'smile'], [B.wipe3, 'flat'], [B.bay3, 'wince'], [B.bay4, 'o'], [B.bay4 + 0.5, 'smile'], [B.cliff, 'o']]);
const HRR = k(-0.7, 0.1, 0.1, -2, 0, [-68, -50], [76, -66]);
const herKeys: [number, number[]][] = [
  [0, HRR], [B.bay2, HRR], [B.herReally + 0.05, k(-1, 0, 1, 0, 0, [-68, -50], [76, -66])], [B.herTurn - 0.1, k(-1, 0, 1, 0, 0, [-68, -50], [76, -66])],
  [B.herTurn + 0.15, k(1, -0.2, 0, 3, 0, [-68, -50], [76, -66])], [B.herTurn + 0.3, k(1, -0.2, 0, 3, 0, [-68, -50], [76, -66])],
  [B.wipe3, HRR], [B.fine, k(-1, 0, 0.5, 0, 0, [-68, -50], [76, -66])], [B.bay3, k(-1, -0.1, 0.7, 0, 0, R1, R2, 0.3)],
  [B.bay4, k(-1, 0, 0.4, 3, 0, R1, R2, 0.5)], [B.cliff, k(-1, -0.1, 0.7, 3, 0, R1, R2, 0.6)],
];
const herMouth = (t: number): Mouth => keyAt<Mouth>(t, [[0, 'smile'], [B.herReally, 'flat'], [B.wipe3, 'smile'], [B.bay4, 'smile'], [B.cliff, 'amused']]);

const SEQ_A = [1, 3, 6, 8, 0, 5, 2, 7, 4], SEQ_B = [4, 1, 7, 3];
const TYPES: {t0: number; seq: number[]; step: number}[] = [{t0: B.type1, seq: SEQ_A, step: TY1}, {t0: B.type2, seq: SEQ_B, step: TY2}];
const typeIdx = (t: number, ty: {t0: number; seq: number[]; step: number}): number => {
  const n = ty.seq.length;
  return t < ty.t0 || t >= ty.t0 + n * ty.step + 0.1 ? -1 : Math.min(n - 1, Math.floor((t - ty.t0) / ty.step));
};
// fries on the ball return (world coords)
const TRAY_Y = 1090, TX_HER = 626, TX_HIM = 478;
const trayX = (t: number) => t < B.slideIn ? TX_HER : t < B.slideIn + 0.55 ? lerp(TX_HER, TX_HIM, smooth(t, B.slideIn, B.slideIn + 0.55)) : t < B.slideBack ? TX_HIM : lerp(TX_HIM, TX_HER, smooth(t, B.slideBack, B.slideBack + 0.55));
const trayN = (t: number) => (t < B.take ? 6 : 3);
const trayOn = (t: number) => t >= B.fries && t < B.cliff;
const HIM_X = 310, HER_X = 775, FEET = 1210, MON_Y = 470;
const himPose = (t: number): Pose => {
  const v = [...track(himKeys, t)];
  for (const ty of TYPES) {
    const i = typeIdx(t, ty), t0 = ty.t0, n = ty.seq.length;
    if (t > t0 - 0.12 && t < t0 + n * ty.step + 0.4) {
      const w = smooth(t, t0 - 0.12, t0 - 0.02) * (1 - smooth(t, t0 + n * ty.step + 0.2, t0 + n * ty.step + 0.4)), ph = ((t - t0) % ty.step) / ty.step;
      const [kx, ky] = KEYP(ty.seq[Math.max(0, Math.min(n - 1, i < 0 ? n - 1 : i))]);
      v[7] = lerp(v[7], kx - HIM_X, w); v[8] = lerp(v[8], ky - FEET + Math.sin(ph * Math.PI) * 9, w);
      v[1] = lerp(v[1], 0.5, w);
    }
  }
  if (trayOn(t)) {
    const wH = smooth(t, B.fries + 0.1, B.fries + 0.25) * (1 - smooth(t, B.herTakes - 0.1, B.herTakes + 0.1));
    v[7] = lerp(v[7], trayX(t) - 58 - HIM_X, wH); v[8] = lerp(v[8], TRAY_Y - 6 - FEET, wH); v[1] = lerp(v[1], 0.6, wH);
    const wF = smooth(t, B.take, B.take + 0.2) * (1 - smooth(t, B.herTakes, B.herTakes + 0.3));
    v[5] = lerp(v[5], -96, wF); v[6] = lerp(v[6], -262, wF);
  }
  return fig(v, himMouth(t));
};
const herPose = (t: number): Pose => {
  const v = [...track(herKeys, t)];
  if (trayOn(t)) {
    const w1 = smooth(t, B.fries - 0.05, B.fries + 0.1) * (1 - smooth(t, B.slideIn + 0.5, B.slideIn + 0.75));
    const w2 = smooth(t, B.slideBack - 0.05, B.slideBack + 0.1) * (1 - smooth(t, B.herTakes + 0.35, B.herTakes + 0.6));
    const w = Math.max(w1, w2);
    v[5] = lerp(v[5], trayX(t) + 56 - HER_X, w); v[6] = lerp(v[6], TRAY_Y - 6 - FEET, w);
  }
  return fig(v, herMouth(t));
};

// ------------------------------------------------------------------------------------------ cameras
const CAM: CamKey[] = [
  {t: 0, x: 540, y: 950, z: 1.0}, {t: B.gutterShot, x: 540, y: 950, z: 1.02},
  {t: B.bay2, x: 540, y: 950, z: 1.0, cut: true}, {t: B.herShotA, x: 540, y: 950, z: 1.02},
  {t: B.wipe3, x: 540, y: 950, z: 1.0, cut: true}, {t: B.bay3 - 0.1, x: 540, y: 950, z: 1.02},
  {t: B.bay3, x: 540, y: 950, z: 1.0, cut: true}, {t: B.hisShot, x: 540, y: 950, z: 1.02},
  {t: B.bay4, x: 540, y: 930, z: 1.0, cut: true}, {t: B.fries - 0.01, x: 540, y: 930, z: 1.02},
  {t: B.fries, x: 540, y: 1000, z: 1.3, cut: true}, {t: B.cliff - 0.01, x: 540, y: 1000, z: 1.36},
  {t: B.cliff, x: 540, y: 950, z: 1.0, cut: true}, {t: B.wipe4, x: 540, y: 950, z: 1.05},
];
const rnd = (i: number) => { const x = Math.sin(i * 91.7 + 17.3) * 43758.5453; return x - Math.floor(x); };

const Confetti: React.FC<{age: number; n?: number}> = ({age, n = 46}) => age < 0 || age > 2.4 ? null : <g>
  {Array.from({length: n}, (_, i) => {
    const x = rnd(i) * 1080 + Math.sin(age * 3 + i) * 24, y = -60 + rnd(i + 0.5) * 520 + age * (360 + rnd(i + 0.7) * 380), r = rnd(i + 0.9) * 360 + age * (200 + i * 6);
    const c = [C.teal, C.orange, C.lemon, C.violet, C.cream][i % 5];
    return <g key={i} transform={`translate(${x} ${y}) rotate(${r})`} opacity={1 - smooth(age, 1.8, 2.4)}>
      {i % 3 === 0 ? <circle r={9} fill={c} stroke={C.ink} strokeWidth={3} /> : <rect x={-9} y={-15} width={18} height={30} rx={3} fill={c} stroke={C.ink} strokeWidth={3} />}
    </g>;
  })}
</g>;

const StarPop: React.FC<{age: number; x: number; y: number}> = ({age, x, y}) => age < 0 || age > 0.7 ? null : <g transform={`translate(${x} ${y}) scale(${0.4 + 0.9 * (1 - Math.pow(1 - clamp(age / 0.25), 3))}) rotate(${age * 40})`} opacity={1 - smooth(age, 0.4, 0.7)}>
  <path d={Array.from({length: 16}, (_, i) => { const a = i / 16 * Math.PI * 2, r = i % 2 ? 50 : 96; return `${i ? 'L' : 'M'} ${Math.cos(a) * r} ${Math.sin(a) * r}`; }).join(' ') + ' Z'} fill={C.lemon} stroke={C.ink} strokeWidth={7} strokeLinejoin="round" />
  <circle r={26} fill={C.cream} stroke={C.ink} strokeWidth={6} />
</g>;

const Fries: React.FC<{x: number; y: number; n: number; s?: number; tray?: boolean}> = ({x, y, n, s = 1, tray = true}) => <g transform={`translate(${x} ${y}) scale(${s})`}>
  {Array.from({length: n}, (_, i) => <g key={i} transform={`translate(${(i - (n - 1) / 2) * 14} -14) rotate(${(i - (n - 1) / 2) * 7})`}>
    <rect x={-6.5} y={-50} width={13} height={56} rx={4} fill={C.lemon} stroke={C.ink} strokeWidth={3.5} />
  </g>)}
  {tray && <path d="M -52 -18 L 52 -18 L 40 24 L -40 24 Z" fill={C.orange} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />}
  {tray && <path d="M -46 -3 L 46 -3" stroke={C.cream} strokeWidth={9} strokeLinecap="round" />}
</g>;

// ------------------------------------------------------------------------------------------ hook: bright, two boards, two faces
const HookShot: React.FC<{t: number}> = ({t}) => {
  const b = boards(t);
  const zoom = 1 + 0.03 * smooth(t, 0, 3);
  const curOn = Math.floor(t * 3) % 2 === 0;
  const hp = fig(k(1, 0.35, 0.6, 3, 0, [-100, -170], [48, -68], 0.1), 'flat');
  const wp = fig(k(-1, 0.1, 0.1, -2, 0, [-52, -78], [100, -140], 0.35), 'smile');
  const FT = 1470, HX = 305, WX = 800;
  return <g transform={`translate(540 960) scale(${zoom}) translate(-540 -960)`}>
    <rect x={-100} y={-100} width={1280} height={1260} fill="#6A55DE" />
    <circle cx={540} cy={900} r={800} fill={C.cream} opacity={0.12} />
    <circle cx={540} cy={900} r={520} fill={C.cream} opacity={0.1} />
    <Memphis x0={-50} y0={150} x1={1130} y1={1120} n={36} seed={31} op={0.8} t={t} />
    <rect x={-100} y={1150} width={1280} height={900} fill={C.lane} />
    <rect x={-100} y={1150} width={1280} height={16} fill={C.ink} /><rect x={-100} y={1166} width={1280} height={10} fill={C.lemon} />
    {[0, 1, 2, 3, 4, 5].map((i) => <path key={i} d={`M ${540 + (i - 2.5) * 120} 1176 L ${540 + (i - 2.5) * 420} 1920`} stroke={C.laneLine} strokeWidth={6} />)}
    <Monitor x={275} y={480} lane={7} cells={b.his} t={t} score="133" sub={{text: 'FRAME 10'}} />
    <Monitor x={805} y={480} lane={8} cells={[...'LOSER'].map((ch) => ({ch, prev: ch, flipAt: -1e9, color: C.mint})).concat(Array.from({length: 4}, () => ({ch: ' ', prev: ' ', flipAt: -1e9, color: C.mint})))} t={t} score="131" sub={{text: 'BUYS FRIES?', color: C.mint, size: 54}} />
    <rect x={275 - 260 + 28 + 9} y={480 + 64 + 14} width={30} height={60} rx={4} fill={C.orange} opacity={curOn ? 0.95 : 0} />
    <Figure kind="her" x={WX} y={FT} p={wp} t={t} scale={1.5} items={<Ball x={104} y={-160} r={36} color={C.violet} spin={0} shadow={false} />} />
    <Figure kind="him" x={HX} y={FT} p={hp} t={t} scale={1.5} pocket={false} items={<Ball x={-108} y={-190} r={36} color={C.lemon} spin={0} shadow={false} />} />
  </g>;
};

// ------------------------------------------------------------------------------------------ the bay
const CALLS: {a: number; b: number; who: 'him' | 'her'}[] = [
  {a: B.type1 + 0.1, b: B.gutterShot, who: 'him'}, {a: B.herReally + 0.05, b: B.herShotA, who: 'her'},
  {a: B.type2 + 0.05, b: B.fine, who: 'him'}, {a: B.fine + 0.05, b: B.herShotB, who: 'her'}, {a: B.herHitB + 0.15, b: B.bay3 + 0.4, who: 'her'},
  {a: B.iBuy + 0.05, b: B.fries, who: 'her'}, {a: B.name, b: B.wipe4 + 0.1, who: 'her'},
];
const Callout: React.FC<{t: number}> = ({t}) => {
  const c = CALLS.find((x) => t >= x.a && t < x.b);
  if (!c) return null;
  const b = boards(t), cells = c.who === 'him' ? b.his : b.hers, col = c.who === 'him' ? C.orange : C.mint;
  const age = t - c.a, pop = age < 0.18 ? 1 + 0.1 * Math.sin(age / 0.18 * Math.PI) : 1, fade = smooth(t, c.b - 0.1, c.b);
  const y = 500;
  return <g opacity={1 - fade} transform={`translate(540 ${y + 100}) scale(${pop}) translate(-540 ${-(y + 100)})`}>
    <rect x={44} y={y + 14} width={1000} height={204} rx={30} fill={C.ink} />
    <rect x={36} y={y} width={1000} height={204} rx={30} fill={C.violet} stroke={C.ink} strokeWidth={6} />
    <rect x={50} y={y + 14} width={972} height={176} rx={20} fill="#0A0818" />
    <text x={70} y={y + 52} fontFamily={BAR} fontWeight={800} fontSize={40} letterSpacing={3} fill={C.teal}>LANE {c.who === 'him' ? 7 : 8}</text>
    <g transform={`translate(${70 + 0} ${y + 62})`}><NameCells cells={cells} t={t} w={96} h={118} gap={8} font={108} bg="#201B48" /></g>
    {c.who === 'him' && cells.every((x) => x.ch === ' ') && <rect x={70 + 26} y={y + 62 + 18} width={44} height={80} rx={6} fill={col} opacity={Math.floor(t * 3) % 2 === 0 ? 0.9 : 0} />}
  </g>;
};
const Badge: React.FC<{t: number}> = ({t}) => {
  const L = t >= B.wipe1 + 0.3 && t < B.wipe2 + 0.5 ? 'A' : t >= B.wipe3 + 0.3 && t < B.cliff ? 'B' : null;
  if (!L) return null;
  return <g transform="translate(96 1190)">
    <circle r={46} cy={8} cx={7} fill={C.ink} /><circle r={46} fill={L === 'A' ? C.orange : C.teal} stroke={C.ink} strokeWidth={6} />
    <text y={26} textAnchor="middle" fontFamily={NUN} fontWeight={900} fontSize={70} fill={C.ink}>{L}</text>
  </g>;
};

const Bay: React.FC<{t: number}> = ({t}) => {
  const cam = camAt(CAM, t);
  const hp = himPose(t), wp = herPose(t);
  const b = boards(t);
  const pins7 = Array.from({length: 10}, () => !(t >= B.fall));
  const pins8 = Array.from({length: 10}, () => !(t >= B.herHitB));
  const herItems = (t >= B.herShotA && t < B.wipe3) || (t >= B.herShotB && t < B.herHitB + 1) ? null : <Ball x={80} y={-88} r={36} color={C.violet} spin={0} shadow={false} />;
  const ti = TYPES.map((ty) => ({ty, i: typeIdx(t, ty)})).find((x) => x.i >= 0);
  const lit = ti ? ti.ty.seq[ti.i] : -1;
  const cur = (() => {
    const ty = t < B.type2 ? TYPES[0] : TYPES[1], n = ty.seq.length;
    if (t >= B.cliff) return t >= B.name + 1.3 ? 8 : -1;
    if (t >= B.type2 + n * TY2 + 0.4 && t < B.cliff) return -1;
    if (t >= B.type1 + 9 * TY1 + 0.4 && t < B.rewind) return -1;
    if (t < ty.t0 || t >= B.rewind + 0.3 && t < B.type2) return 0;
    return Math.min(n, Math.floor((t - ty.t0) / ty.step) + 1);
  })();
  const curOn = Math.floor(t * 3) % 2 === 0;
  const win = t >= B.fall;
  const tx = trayX(t);
  const him = <g>
    {t >= B.take && t < B.herTakes + 0.3 && <Fries x={-96} y={-250} n={3} s={0.8} tray={false} />}
  </g>;
  return <>
    <g transform={planeT(cam, 0.8)}><Wall t={t} /><rect x={-500} y={-500} width={2080} height={1320} fill="#B9A8FF" opacity={0.22} /></g>
    <g transform={planeT(cam, 0.9)}>
      <Monitor x={280} y={MON_Y} lane={7} cells={b.his} t={t} score={hisScore(t)} scorePop={b.hisPop} sub={{text: 'FRAME 10'}} />
      <Monitor x={800} y={MON_Y} lane={8} cells={b.hers} t={t} score={herScore(t)} scorePop={b.herPop} sub={{text: 'FRAME 10'}} />
      {cur >= 0 && <rect x={280 - 260 + 28 + 9 + cur * 52} y={MON_Y + 64 + 14} width={30} height={60} rx={4} fill={C.orange} opacity={curOn ? 0.95 : 0} />}
      {win && t < B.fries && <g transform={`translate(335 ${MON_Y - 84}) rotate(-4) scale(${1 + 0.2 * (1 - smooth(t, B.fall, B.fall + 0.25))})`}>
        <rect x={-130} y={-10} width={268} height={84} rx={20} fill={C.ink} /><rect x={-138} y={-20} width={268} height={84} rx={20} fill={C.lemon} stroke={C.ink} strokeWidth={6} />
        <text x={-4} y={44} textAnchor="middle" fontFamily={NUN} fontWeight={900} fontSize={62} fill={C.ink}>WINNER</text>
      </g>}
    </g>
    <g transform={planeT(cam, 1)}>
      <Carpet t={t} /><rect x={-500} y={780} width={2080} height={1500} fill="#8D7BE0" opacity={0.25} />
      <LanesBg t={t} pins7={pins7} pins8={pins8} />
      <Keypad x={470} y={1000} lit={lit} />
      <ReturnHump lemon={trayOn(t) ? 0 : 1} violet={trayOn(t) ? 0 : t >= B.herHitB ? 1 : 0} />
      {trayOn(t) && <g>
        <rect x={420} y={1090} width={236} height={16} rx={8} fill={C.ink} /><rect x={420} y={1090} width={236} height={9} rx={5} fill={C.teal} />
        <Fries x={tx} y={TRAY_Y} n={trayN(t)} s={1.1} />
      </g>}
      <Figure kind="him" x={HIM_X} y={FEET} p={hp} t={t} items={him} />
      <Figure kind="her" x={HER_X} y={FEET} p={wp} t={t} items={herItems} />
    </g>
  </>;
};

const LVP = 700, hwAt = (y: number) => 430 * (y - LVP) / 550, sAt = (y: number) => (y - LVP) / 550;
const LROWS: [number, number[]][] = [[880, [-0.87, -0.29, 0.29, 0.87]], [905, [-0.58, 0, 0.58]], [930, [-0.29, 0.29]], [955, [0]]];
const lx = (y: number, v: number) => 540 + v * hwAt(y);
const lPoly = (y0: number, y1: number, v0: number, v1: number) => `M ${lx(y0, v0)} ${y0} L ${lx(y0, v1)} ${y0} L ${lx(y1, v1)} ${y1} L ${lx(y1, v0)} ${y1} Z`;

// ------------------------------------------------------------------------------------------ down-the-lane shots
const FALL = B.fall - B.hisHit;
type LM = {who: 'him' | 'her'; color: string; swing: [number, number, number, number]; roll: [number, number]; vAt: (u: number) => number; slow?: boolean; hit?: {at: number; kind: 'spare' | 'strike' | 'her' | 'last'}; rewind?: boolean; gutter?: boolean; zoom: [number, number]};
const MODES: Record<string, LM> = {
  gutter: {who: 'him', color: C.lemon, swing: [B.gutterShot, B.gutterShot + 0.1, B.gutterShot + 0.2, B.gutterRel], roll: [B.gutterRel, B.bay2], vAt: (u) => -0.15 - 0.93 * smooth(u, 0.05, 0.45), zoom: [99, 100], gutter: true},
  herA: {who: 'her', color: C.violet, swing: [B.herShotA, B.herShotA + 0.1, B.herShotA + 0.2, B.herRelA], roll: [B.herRelA, B.herHitA], vAt: (u) => -0.3 + 0.3 * smooth(u, 0.1, 0.8), zoom: [8.7, 9.0], hit: {at: B.herHitA, kind: 'her'}},
  rew: {who: 'him', color: C.lemon, swing: [99, 99, 99, 99], roll: [B.rewind, B.rewind + 0.9], vAt: (u) => -1.0 * smooth(u, 0.1, 0.6), zoom: [99, 100], rewind: true},
  herB: {who: 'her', color: C.violet, swing: [B.herShotB, B.herShotB + 0.1, B.herShotB + 0.2, B.herRelB], roll: [B.herRelB, B.herHitB], vAt: (u) => -0.35 + 0.35 * smooth(u, 0.2, 0.9), zoom: [B.herRelB + 0.1, B.herRelB + 0.5], hit: {at: B.herHitB, kind: 'spare'}},
  last: {who: 'him', color: C.lemon, swing: [B.hisShot, B.hisShot + 0.1, B.hisShot + 0.2, B.hisRel], roll: [B.hisRel, B.hisHit], vAt: (u) => -0.3 + 0.3 * smooth(u, 0.1, 0.9), slow: true, zoom: [B.hisRel + 0.2, B.hisHit], hit: {at: B.hisHit, kind: 'last'}},
};
const LaneShot: React.FC<{t: number; m: string}> = ({t, m}) => {
  const md = MODES[m], b = boards(t);
  const [s0, s1, s2, rel] = md.swing;
  const zk = smooth(t, md.zoom[0], md.zoom[1]);
  const z = lerp(1, 1.4, zk);
  const raw = clamp((t - md.roll[0]) / (md.roll[1] - md.roll[0]));
  const u = md.rewind ? 1 - raw : raw;
  const P = (x: number) => (md.slow ? 1 - Math.pow(1 - x, 1.45) : Math.pow(x, 0.82));
  const yb = lerp(1330, 905, P(u)), bv = md.vAt(u);
  const bx = lx(yb, bv), br = 80 * sAt(yb);
  const hit = md.hit ? t - md.hit.at : -1;
  const kind = md.hit?.kind;
  const rolling = md.rewind ? t >= md.roll[0] && t < md.roll[1] : t >= rel && !(md.hit && hit > 0.05);
  const pins = LROWS.flatMap(([y, vs]) => vs.map((v) => ({y, x: lx(y, v)})));
  const hand = t < s1 ? track([[s0, [78, -66]], [s1, [120, -30]]], t) : track([[s1, [120, -30]], [s2, [92, -112]]], t);
  const ballInHand = md.rewind ? t >= md.roll[1] - 0.02 : t < rel;
  const trail = rolling ? Array.from({length: 7}, (_, i) => { const tu = md.rewind ? clamp(u + i * 0.05) : clamp(u - i * 0.05); if (tu <= 0 || tu >= 1.001) return null; const y2 = lerp(1330, 905, P(tu)); return {x: lx(y2, md.vAt(tu)), y: y2, r: 80 * sAt(y2), i}; }) : [];
  const stance: Pose = {lx: 0, ly: 0, brow: 0, tilt: 0, dy: 0, a1: [-70, -52], a2: [hand[0], hand[1]], mouth: 'flat'};
  const ev = kind === 'last' ? hit - FALL : hit;               // moment of the banner (the last pin falls a second after the crash)
  const banner = (kind === 'strike' || kind === 'spare' || kind === 'last') && ev > 0.03;
  const shake = md.hit && hit > 0 && hit < 0.4 && kind !== 'her' ? Math.sin(t * 90) * 9 * (1 - hit / 0.4) : 0;
  const lane = md.who === 'him' ? 7 : 8;
  const bk = kind === 'spare' ? 'spare' : 'strike';
  return <g transform={`translate(${shake} 0)`}>
    <g transform={`translate(540 ${lerp(960, 1010, zk)}) scale(${z}) translate(-540 -${lerp(960, 945, zk)})`}>
      <rect x={-600} y={-300} width={2280} height={1200} fill="#4B3E9C" />
      <Memphis x0={-300} y0={0} x1={1400} y1={760} n={40} seed={4} op={0.85} t={t} />
      <rect x={-600} y={760} width={2280} height={100} fill={C.ink} /><rect x={-600} y={760} width={2280} height={12} fill={C.lemon} />
      <rect x={-600} y={860} width={2280} height={900} fill="#3A3077" />
      <path d={lPoly(850, 1560, -1.32, 1.32)} fill={C.ink} /><path d={lPoly(850, 1560, -1.12, 1.12)} fill={C.teal} /><path d={lPoly(850, 1560, -1.0, 1.0)} fill={C.lane} />
      {[-0.66, -0.33, 0, 0.33, 0.66].map((v, i) => <path key={i} d={`M ${lx(850, v)} 850 L ${lx(1560, v)} 1560`} stroke={C.laneLine} strokeWidth={4} />)}
      {[-0.6, -0.4, -0.2, 0, 0.2, 0.4, 0.6].map((v, i) => { const y = 1060 + (3 - Math.abs(i - 3)) * 44; const s = sAt(y); return <path key={i} d={`M ${lx(y, v) - 22 * s * 1.4} ${y + 22 * s * 1.4} L ${lx(y, v)} ${y - 34 * s * 1.4} L ${lx(y, v) + 22 * s * 1.4} ${y + 22 * s * 1.4} Z`} fill={C.orange} />; })}
      <path d={lPoly(1196, 1204, -1.32, 1.32)} fill={C.ink} />
      {pins.map((p, i) => {
        if (md.rewind) {
          const tau = 0.36 * (1 - smooth(raw, 0.05, 0.9)), vx = ((i * 97) % 11 - 5) * 70, vy = -160 - ((i * 53) % 7) * 70;
          return <g key={i}><Pin x={p.x + vx * tau} y={p.y + 6 - 60 * (tau > 0 ? 1 : 0) * (tau / 0.36) + vy * tau + 900 * tau * tau} s={sAt(p.y) * 1.2} rot={tau * (i % 2 ? 900 : -800)} /></g>;
        }
        if (!md.hit || hit <= 0.03) return <Pin key={i} x={p.x} y={p.y + 6} s={sAt(p.y) * 1.2} />;
        if (kind === 'last' && i === 5) {          // the lonely last pin: wobbles harder and harder, then falls
          if (hit < FALL) { const amp = 4 + 14 * (hit / FALL) * (hit / FALL); return <Pin key={i} x={p.x} y={p.y + 6} s={sAt(p.y) * 1.2} rot={Math.sin(hit * (22 + hit * 10)) * amp} />; }
          const tau = hit - FALL;
          return <g key={i} opacity={1 - smooth(tau, 0.1, 0.26)}><Pin x={p.x + 40 * tau} y={p.y + 6 + 300 * tau * tau} s={sAt(p.y) * 1.2} rot={14 + 520 * tau * tau} /></g>;
        }
        if (kind === 'spare' && (i === 0 || i === 3)) {
          const wob = hit < 0.3 ? Math.sin(hit * 60) * 9 * smooth(hit, 0, 0.1) : 0, tau = Math.max(0, hit - 0.3), dir = i === 0 ? -1 : 1;
          return <g key={i} opacity={1 - smooth(tau, 0.3, 0.45)}><Pin x={p.x + dir * 70 * tau} y={p.y + 6 + 300 * tau * tau} s={sAt(p.y) * 1.2} rot={wob + dir * 520 * tau * tau} /></g>;
        }
        const vx = ((i * 97) % 11 - 5) * 70, vy = -160 - ((i * 53) % 7) * 70, tau = hit, ok = 1 - smooth(tau, 0.35, 0.55);
        return <g key={i} opacity={ok}><Pin x={p.x + vx * tau} y={p.y - 60 + vy * tau + 900 * tau * tau} s={sAt(p.y) * 1.2} rot={tau * (i % 2 ? 900 : -800)} /></g>;
      })}
      {trail.map((q) => q && <circle key={q.i} cx={q.x} cy={q.y} r={q.r * 0.9} fill={C.cream} opacity={0.14 * (1 - q.i / 7)} />)}
      {rolling && <Ball x={bx} y={yb} r={br} color={md.color} spin={u * 900} />}
      <g transform="translate(340 1510) scale(1.5)">
        <BackFigure kind={md.who} p={stance} t={t} ball={ballInHand ? md.color : null} />
      </g>
    </g>
    {kind === 'last' && <Confetti age={ev} />}
    <g transform={`translate(0 ${zk * -8})`}>
      <Monitor x={540} y={MON_Y} lane={lane} cells={md.who === 'him' ? b.his : b.hers} t={t} sub={{text: 'FRAME 10'}}
        score={md.who === 'him' ? hisScore(t) : herScore(t)} scorePop={md.who === 'him' ? b.hisPop : b.herPop} />
    </g>
    {md.rewind && t > md.roll[0] && t < md.roll[1] && <g stroke={C.cream} strokeWidth={5} strokeLinecap="round" opacity={0.35}>
      {Array.from({length: 12}, (_, i) => { const a = (i / 12) * Math.PI * 2, kk = 1 - ((t * 5 + i * 0.37) % 1); return <path key={i} d={`M ${540 + Math.cos(a) * (240 + kk * 600)} ${1000 + Math.sin(a) * (240 + kk * 600)} L ${540 + Math.cos(a) * (330 + kk * 700)} ${1000 + Math.sin(a) * (330 + kk * 700)}`} />; })}
    </g>}
    {kind === 'last' && ev > 0 && ev < 0.12 && <rect x={0} y={0} width={1080} height={1920} fill="#fff" opacity={0.55 * (1 - ev / 0.12)} />}
    {banner && <g transform={`translate(540 1130) rotate(-7) scale(${(kind === 'spare' ? 0.25 : 0.3) + (kind === 'spare' ? 0.6 : 0.7) * smooth(ev, 0.03, 0.15)})`}>
      <path d={Array.from({length: 24}, (_, i) => { const a = i / 24 * Math.PI * 2, r = i % 2 ? 175 : 235; return `${i ? 'L' : 'M'} ${Math.cos(a) * r * 1.35} ${Math.sin(a) * r * 0.62}`; }).join(' ') + ' Z'} fill={bk === 'strike' ? C.lemon : C.mint} stroke={C.ink} strokeWidth={8} strokeLinejoin="round" />
      <text x={0} y={bk === 'strike' ? 34 : 30} textAnchor="middle" fontFamily={NUN} fontWeight={900} fontSize={bk === 'strike' ? 104 : 92} fill={bk === 'strike' ? C.orange : C.violet} stroke={C.ink} strokeWidth={9} paintOrder="stroke">{bk === 'strike' ? 'STRIKE!' : 'SPARE!'}</text>
    </g>}
    {md.gutter && t > md.roll[0] + 0.3 && <g transform={`translate(540 1120) rotate(-5) scale(${0.5 + 0.5 * smooth(t - md.roll[0] - 0.3, 0, 0.12)})`}>
      <rect x={-250} y={-72} width={500} height={150} rx={30} fill={C.ink} transform="translate(10 12)" />
      <rect x={-250} y={-72} width={500} height={150} rx={30} fill={C.orange} stroke={C.ink} strokeWidth={8} />
      <text x={0} y={42} textAnchor="middle" fontFamily={NUN} fontWeight={900} fontSize={104} fill={C.cream} stroke={C.ink} strokeWidth={8} paintOrder="stroke">GUTTER</text>
    </g>}
  </g>;
};

// ------------------------------------------------------------------------------------------ the vote
const Card: React.FC<{k: 'A' | 'B'; l1: string; l2: string; y: number; age: number; tint: string; pulse: number}> = ({k: kk, l1, l2, y, age, tint, pulse}) => {
  if (age < 0) return null;
  const H = 190;
  const pop = age < 0.28 ? 1 + 0.12 * Math.sin(Math.min(1, age / 0.28) * Math.PI) - 0.25 * (1 - smooth(age, 0, 0.12)) : 1;
  const cells: Cell[] = Array.from({length: 9}, (_, i) => ({ch: l1[i] ?? ' ', prev: ' ', flipAt: -1e9, color: C.cream, instant: true}));
  return <g transform={`translate(540 ${y + H / 2}) scale(${pop + pulse * 0.025}) translate(-540 ${-(y + H / 2)})`}>
    <rect x={50} y={y + 12} width={980} height={H} rx={28} fill={C.ink} />
    <rect x={40} y={y} width={980} height={H} rx={28} fill={C.violet} stroke={C.ink} strokeWidth={6} />
    <circle cx={112} cy={y + 80} r={52} fill={tint} stroke={C.ink} strokeWidth={6} />
    <text x={112} y={y + 80 + 26} textAnchor="middle" fontFamily={NUN} fontWeight={900} fontSize={76} fill={C.ink}>{kk}</text>
    <g transform={`translate(190 ${y + 14})`}><NameCells cells={cells} t={age} w={64} h={106} gap={6} font={90} bg="#0E0C1C" /></g>
    <text x={192} y={y + H - 18} fontFamily={NUN} fontWeight={900} fontSize={42} fill={C.cream}>{l2}</text>
  </g>;
};
const KeysScene: React.FC<{t: number}> = ({t}) => {
  const cur = Math.floor(t * 2) % 2 === 0;
  const pl = (a: number) => Math.max(0, 1 - Math.abs(t - a) / 0.25);
  const cells: Cell[] = Array.from({length: 9}, (_, i) => ({ch: 'PLAYER 7'[i] ?? ' ', prev: ' ', flipAt: -1e9, color: C.orange, instant: true}));
  return <g>
    <rect x={0} y={0} width={1080} height={1920} fill="#4B3E9C" />
    <Memphis x0={-50} y0={200} x1={1130} y1={1500} n={40} seed={12} op={0.7} t={t} />
    <g transform="translate(0 16)">
      <rect x={36} y={608} width={1008} height={176} rx={30} fill={C.ink} transform="translate(10 12)" />
      <rect x={36} y={608} width={1008} height={176} rx={30} fill={C.violet} stroke={C.ink} strokeWidth={6} />
      <rect x={52} y={622} width={976} height={148} rx={20} fill="#0A0818" />
      <g transform="translate(62 635)"><NameCells cells={cells} t={t} w={100} h={124} gap={8} font={112} bg="#201B48" /></g>
      <rect x={62 + 8 * 108 + 28} y={635 + 22} width={44} height={80} rx={6} fill={C.orange} opacity={cur ? 0.9 : 0} />
      <text x={64} y={600} fontFamily={BAR} fontWeight={800} fontSize={40} letterSpacing={3} fill={C.cream}>MY BOX (LANE 7)</text>
    </g>
    <g transform="translate(0 16)"><Card k="A" l1={spec.choices.A.l1} l2={spec.choices.A.l2} y={800} age={t - B.cardA} tint={C.orange} pulse={pl(B.cardB + 1.6) + pl(B.cardB + 3.2)} />
    <Card k="B" l1={spec.choices.B.l1} l2={spec.choices.B.l2} y={1010} age={t - B.cardB} tint={C.teal} pulse={pl(B.cardB + 2.4) + pl(B.cardB + 4.0)} /></g>
  </g>;
};

const EndCard: React.FC<{t: number}> = ({t}) => {
  const a = t - B.endcard;
  const kk = smooth(a, 0, 0.25);
  const pop = a < 0.3 ? 1 + 0.15 * (1 - a / 0.3) : 1;
  const mk = (txt: string, y: number, big = true) => <g transform={`translate(540 ${y}) scale(${pop}) translate(-540 ${-y})`}>
    <rect x={64} y={y - 100} width={960} height={190} rx={34} fill={C.ink} transform="translate(12 14)" />
    <rect x={64} y={y - 100} width={960} height={190} rx={34} fill={big ? C.lemon : C.cream} stroke={C.ink} strokeWidth={7} />
    <text x={544} y={y + 50} textAnchor="middle" fontFamily={NUN} fontWeight={900} fontSize={big ? 130 : 120} fill={C.ink}>{txt}</text>
  </g>;
  return <g opacity={kk}>
    <rect x={0} y={0} width={1080} height={1920} fill={C.cream} />
    <Memphis x0={-50} y0={150} x1={1130} y1={1700} n={46} seed={21} op={0.9} t={t} />
    {mk('lane 8 · part 4', 480)}
    {mk('A or B', 740, false)}
    <g>
      {[['A', 'PLAYER 7', C.orange, 890], ['B', 'DAN', C.teal, 1060]].map(([ky, tx, col, y]) => <g key={ky as string} opacity={smooth(a, 0.3, 0.55)}>
        <rect x={110} y={(y as number) - 10} width={870} height={150} rx={26} fill={C.ink} transform="translate(8 10)" />
        <rect x={110} y={(y as number) - 10} width={870} height={150} rx={26} fill={C.violet} stroke={C.ink} strokeWidth={6} />
        <circle cx={185} cy={(y as number) + 65} r={44} fill={col as string} stroke={C.ink} strokeWidth={6} />
        <text x={185} y={(y as number) + 90} textAnchor="middle" fontFamily={NUN} fontWeight={900} fontSize={64} fill={C.ink}>{ky}</text>
        <text x={260} y={(y as number) + 98} fontFamily={BAR} fontWeight={800} fontSize={104} letterSpacing={6} fill={C.cream}>{tx}</text>
      </g>)}
    </g>
  </g>;
};

// ------------------------------------------------------------------------------------------ the edit
const WIPES = [B.wipe1, B.wipe2, B.wipe3, B.wipe4];
type Shot = 'hook' | 'bay' | 'gutter' | 'herA' | 'rew' | 'herB' | 'last' | 'keys' | 'end';
const shotAt = (t: number): Shot => {
  if (t < B.wipe1) return 'hook';
  if (t < B.gutterShot) return 'bay';
  if (t < B.bay2) return 'gutter';
  if (t < B.herShotA) return 'bay';
  if (t < B.wipe2) return 'herA';
  if (t < B.wipe3) return 'rew';
  if (t < B.herShotB) return 'bay';
  if (t < B.bay3) return 'herB';
  if (t < B.hisShot) return 'bay';
  if (t < B.bay4) return 'last';
  if (t < B.wipe4) return 'bay';
  if (t < B.endcard) return 'keys';
  return 'end';
};
const renderShot = (s: Shot, t: number): React.ReactNode => {
  switch (s) {
    case 'hook': return <HookShot t={t} />;
    case 'bay': return <Bay t={t} />;
    case 'keys': return <KeysScene t={t} />;
    case 'end': return <EndCard t={t} />;
    default: return <LaneShot t={t} m={s} />;
  }
};

const Scene: React.FC<{hook: Hook}> = ({hook}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const w = WIPES.find((x) => t >= x && t < x + WIPE_DUR);
  const cur = shotAt(t);
  const prev = w !== undefined ? shotAt(w - 0.001) : null;
  const g = w !== undefined ? wipeGeom((t - w) / WIPE_DUR) : null;
  return <>
    <MotionBlurWhen fast={w !== undefined} samples={5} shutter={200}>
      <AbsoluteFill>
        <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, background: C.wall}}>
          {w !== undefined && g ? <>
            {renderShot(prev as Shot, t)}
            <defs><clipPath id="iris"><circle cx={g.cx} cy={g.y} r={g.rIris} /></clipPath></defs>
            <g clipPath="url(#iris)">{renderShot(cur, t)}</g>
            <WipeBall k={(t - w) / WIPE_DUR} />
          </> : renderShot(cur, t)}
        </svg>
      </AbsoluteFill>
    </MotionBlurWhen>
    <AbsoluteFill>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        {t >= B.wipe1 && t < B.endcard && <Badge t={t} />}
        {t >= B.wipe1 && t < B.endcard && t < B.wipe4 && <Callout t={t} />}
        {t < B.wipe1 && <Strip text={(spec.hooks as Record<string, string>)[hook]} y={345} age={t + 1} out={smooth(t, 2.85, 3.0)} size={56} maxW={960} />}
        {t >= B.rewind - 0.55 && t < B.wipe3 && <g opacity={smooth(t, B.rewind - 0.55, B.rewind - 0.45) * (1 - smooth(t, B.wipe3 - 0.12, B.wipe3))}>
          {[0, 1].map((i) => <path key={i} d={`M ${322 - i * 62} 345 L ${322 - i * 62 + 56} 306 L ${322 - i * 62 + 56} 384 Z`} fill={C.lemon} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />)}
        </g>}
        {spec.strips.map((s, i) => {
          if (t < s.from || t >= s.to) return null;
          const comment = s.text.startsWith('comment');
          return <Strip key={i} text={s.text} y={(s as {y?: number}).y ?? (comment ? 520 : 345)} age={t - s.from + 0.06} out={smooth(t, s.to - 0.12, s.to)} size={comment ? 80 : 58} rot={i % 2 ? 0.8 : -0.8} hue={(s as {tag?: boolean}).tag ? 'ink' : 'lemon'} />;
        })}
      </svg>
    </AbsoluteFill>
  </>;
};

export const Lane3: React.FC<{hook?: Hook}> = ({hook = 'a'}) => (
  <AbsoluteFill style={{background: C.wall}}>
    <Audio src={staticFile('audio/lane-ep3-room.wav')} volume={0.5} />
    <Audio src={staticFile('audio/lane-ep3-music.wav')} volume={0.75} />
    <Audio src={staticFile('audio/lane-ep3-sfx.wav')} volume={0.9} />
    <Scene hook={hook} />
  </AbsoluteFill>
);
