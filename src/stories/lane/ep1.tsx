import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, lerp, smooth} from '../../lib/motion';
import {MotionBlurWhen} from '../../lib/shots';
import {
  BAR, C, Ball, Carpet, Cell, Cam, CamKey, Face, Figure, Keypad, LanesBg, Memphis, Monitor, NameCells, NUN, Phone, Pin, Pose, ReturnHump, Ring, Shadow, Strip,
  Wall, WIPE_DUR, WipeBall, KEYP, camAt, keyAt, planeT, track, wipeGeom, JOST, Mouth,
} from './world';
import spec from '../../../specs/stories/lane-ep1.json';

// Lane 8, part 1. Two strangers bowl alone on lanes 7 and 8. The only chat is the 9-cell name box on the overhead
// scoreboards. He skips his turn to swipe; she renames herself YOUR TURN; he types SORRY, puts the phone away, throws a
// gutter ball, then one pin, which he celebrates like a title. She bowls a strike, modestly, and writes BEAT ME?
// His pocket buzzes: ONE SEC (phone first) or GAME ON? Vote A or B.

export const LANE1_FPS = 60;
export const LANE1_FRAMES = Math.round(spec.duration * LANE1_FPS);
const B = spec.beats;
export type Hook = 'a' | 'b';

// ------------------------------------------------------------------------------------------ name boxes
type State = {t0: number; text: string; stagger?: number; instant?: boolean};
const cellsFor = (states: State[], t: number, color: string): Cell[] => {
  let i = 0;
  while (i + 1 < states.length && t >= states[i + 1].t0) i++;
  const cur = states[i], prev = states[Math.max(0, i - 1)];
  // a flip that has not happened yet keeps the previous text; later ones are already applied
  return Array.from({length: 9}, (_, k) => ({
    ch: cur.text[k] ?? ' ', prev: i === 0 ? (cur.text[k] ?? ' ') : (prev.text[k] ?? ' '),
    flipAt: i === 0 ? -1e9 : cur.t0 + k * (cur.stagger ?? 0.12), color, instant: cur.instant,
  }));
};
const HERS: State[] = [{t0: -1e9, text: 'PLAYER 1'}, {t0: 3.4, text: 'YOUR TURN'}, {t0: 9.8, text: 'AGAIN'}, {t0: 14.1, text: 'NICE!'}, {t0: 16.4, text: 'BEAT ME?', stagger: 0.06}];
const HIS_SYS: State[] = [{t0: -1e9, text: 'YOUR TURN'}];
const HIS_ME: State[] = [{t0: -1e9, text: 'ME'}, {t0: 5.0, text: 'SORRY', stagger: 0.2, instant: true}];

// ------------------------------------------------------------------------------------------ the cast
const fig = (v: number[], mouth: Mouth): Pose => ({lx: v[0], ly: v[1], brow: v[2], tilt: v[3], dy: v[4], a1: [v[5], v[6]], a2: [v[7], v[8]], blush: v[9] ?? 0, thumb: v[10] ?? 0, mouth});
const HIM_REST = [0.4, 1, 0, 6, 0, -100, -128, 78, -58, 0];
const himKeys: [number, number[]][] = [
  [0, HIM_REST], [2.38, HIM_REST], [2.46, [0.4, 1, 0, 6, 6, -100, -128, 78, -58, 0]], [2.8, HIM_REST], [4.58, HIM_REST],
  [4.72, [1, -0.2, 1, -6, -3, -100, -128, 78, -58, 0.3]], [4.86, [1, -0.2, 0.9, -4, 0, -100, -128, 62, -338, 0.5]], [5.0, [1, 0.3, 0.4, 0, 0, -100, -128, 162, -186, 0.7]],
  [5.85, [1, 0, 0.3, -2, 0, -100, -128, 120, -130, 0.7]], [6.3, [1, 0, 0.3, -2, 0, -100, -128, 100, -118, 0.6]],
  [6.3, [1, 0.4, 0.2, 3, 0, -100, -128, 100, -118, 0.4]], [6.65, [1, 0.5, 0.2, 3, 0, -8, -118, 85, -70, 0.3]], [6.9, [1, 0.5, 0.2, 3, 0, -8, -96, 100, -100, 0.2]],
  [7.2, [1, 0.8, 0.2, 4, 0, 128, -100, 170, -128, 0.1]], [7.35, [1, 0.8, 0.2, 4, 2, 128, -100, 170, -128, 0.1]], [7.55, [1, 0.3, 0.2, 2, 0, 2, -148, 58, -148, 0]],
  [9.3, [0.2, 1, 0.5, 10, 8, -70, -52, 76, -52, 0.4]], [10.4, [0.2, 1, 0.5, 10, 8, -70, -52, 76, -52, 0.4]], [10.75, [1, 0.6, 0.3, 4, 2, -64, -106, 140, -122, 0.3]],
  [14.05, [0.6, -0.4, 0.6, 0, 0, -70, -52, 76, -52, 0.3]], [14.2, [0, -1, 1, -5, 0, -104, -392, 104, -392, 1]], [14.7, [0, -1, 1, -5, 0, -104, -392, 104, -392, 1]],
  [15.4, [1, 0, 0.2, 3, 0, -70, -52, 76, -52, 0.5]], [16.2, [1, 0, 0.6, 2, 0, -70, -52, 76, -52, 0.7]], [17.4, [1, -0.1, 0.7, 2, 0, -70, -52, 76, -52, 0.8]],
];
const himMouth = (t: number): Mouth => keyAt<Mouth>(t, [[0, 'flat'], [4.72, 'o'], [5.0, 'flat'], [5.85, 'smile'], [6.45, 'flat'], [9.3, 'sad'], [10.75, 'flat'], [14.05, 'o'], [14.2, 'grin'], [14.9, 'smile'], [16.2, 'wince']]);
const HER_REST = [-0.7, 0.1, 0.1, -2, 0, -68, -50, 76, -66, 0, 0];
const herKeys: [number, number[]][] = [
  [0, HER_REST], [3.4, [-0.3, -0.8, 0.2, -2, 0, -68, -50, 76, -66, 0, 0]], [4.3, [-0.3, -0.5, 0.2, -2, 0, -68, -50, 76, -66, 0, 0]], [4.8, [-1, 0, 0.4, 3, 0, -68, -50, 76, -66, 0, 0]],
  [6.65, [-1, 0, 0.3, 3, 0, -68, -50, 76, -66, 0, 0]], [6.95, [-1, 0, 0.3, 3, -2, -104, -232, 80, -96, 0, 1]], [7.5, [-1, 0, 0.3, 3, -2, -104, -232, 80, -96, 0, 1]], [7.85, [-1, 0, 0.3, 2, 0, -68, -50, 76, -66, 0, 0]],
  [9.3, [-1, 0.3, 0.3, 0, 0, -68, -50, 76, -66, 0, 0]], [11.0, [-1, 0.2, 0.3, 0, 0, -68, -50, 76, -66, 0, 0]],
  [14.15, [-0.8, -0.2, 0.7, 0, 0, -68, -50, 76, -66, 0, 0]], [16.2, [-0.8, -0.2, 0.6, 6, -5, -108, -172, 108, -172, 0, 0]], [16.7, [-1, -0.1, 0.5, 3, 0, -80, -204, 76, -66, 0, 0]],
];
const herMouth = (t: number): Mouth => keyAt<Mouth>(t, [[0, 'smile'], [3.4, 'amused'], [4.8, 'smile'], [14.15, 'grin'], [14.9, 'smile'], [16.4, 'amused']]);

const KEY_SEQ = [0, 5, 7, 7, 2];
const himPose = (t: number): Pose => {
  const v = [...track(himKeys, t)];
  if (t > 5.0 && t < 5.85) v[8] = v[8] + Math.sin((t - 5.0) / 0.2 * Math.PI * 2) * 8;     // key taps
  if (t > 4.98 && t < 5.95) {
    const w = smooth(t, 4.98, 5.08) * (1 - smooth(t, 5.8, 5.95)), i = Math.min(4, Math.floor((t - 4.98) / 0.2)), ph = ((t - 4.98) % 0.2) / 0.2;
    const [kx, ky] = KEYP(KEY_SEQ[i]);
    v[7] = lerp(v[7], kx - 310, w); v[8] = lerp(v[8], ky - 1210 + Math.sin(ph * Math.PI) * 9, w);
  }
  if (t > 14.2 && t < 14.85) v[4] = -Math.abs(Math.sin((t - 14.2) / 0.3 * Math.PI)) * 26;     // jumping
  return fig(v, himMouth(t));
};
const herPose = (t: number): Pose => {
  const v = [...track(herKeys, t)];
  if (t > 9.8 && t < 10.7) v[4] = Math.sin((t - 9.8) / 0.45 * Math.PI * 2) * 5, v[3] = 3 + Math.sin((t - 9.8) / 0.45 * Math.PI * 2) * 3;   // nod, nod
  if (t > 14.35 && t < 14.9) { const o = 8 + 26 * Math.abs(Math.sin((t - 14.35) / 0.4 * Math.PI)); v[5] = -o; v[6] = -190; v[7] = o; v[8] = -190; }   // soft claps
  return fig(v, herMouth(t));
};
const himX = (t: number) => lerp(310, 380, smooth(t, 6.8, 7.2));
const HER_X = 775, FEET = 1210;

// ------------------------------------------------------------------------------------------ cameras
const CAM_A: CamKey[] = [{t: 0, x: 540, y: 950, z: 1.0}, {t: 3.7, x: 540, y: 950, z: 1.03}];
const CAM_B: CamKey[] = [
  {t: 3.0, x: 540, y: 950, z: 1.03}, {t: 7.6, x: 540, y: 950, z: 1.05},
  {t: 9.3, x: 540, y: 950, z: 1.03, cut: true}, {t: 11.0, x: 540, y: 950, z: 1.04},
  {t: 14.15, x: 540, y: 950, z: 1.03, cut: true}, {t: 14.8, x: 540, y: 950, z: 1.05},
  {t: 16.2, x: 540, y: 950, z: 1.03, cut: true}, {t: 17.4, x: 540, y: 950, z: 1.05},
];

// ------------------------------------------------------------------------------------------ Bay
const Burst: React.FC<{age: number}> = ({age}) => age < 0 || age > 0.8 ? null : <g>
  {Array.from({length: 18}, (_, i) => {
    const a = i / 18 * Math.PI * 2 + 0.3, k = 1 - Math.pow(1 - clamp(age / 0.6), 3), r = 90 + 330 * k * (0.6 + 0.4 * ((i * 7) % 5) / 4);
    const c = [C.teal, C.orange, C.lemon, C.violet][i % 4], kind = i % 3;
    return <g key={i} transform={`translate(${285 + Math.cos(a) * r} ${610 + Math.sin(a) * r * 0.8}) rotate(${i * 40 + age * 300})`} opacity={1 - smooth(age, 0.5, 0.8)} fill="none" stroke={c} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round">
      {kind === 0 && <path d="M -26 0 Q -13 -20 0 0 T 26 0" />}{kind === 1 && <path d="M -18 14 L 0 -18 L 18 14 Z" />}{kind === 2 && <circle r={9} fill={c} stroke="none" />}
    </g>;
  })}
</g>;

const Bay: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const hp = himPose(t), wp = herPose(t);
  const hx = himX(t);
  const flick = t < B.timerZero;
  // monitors
  const hisCells = t < 5.0 ? cellsFor(HIS_SYS, t, C.lemon).map((c) => (t >= B.timerZero ? {...c, ch: ' ', prev: ' '} : c)) : cellsFor(HIS_ME, t, C.orange);
  const showMe = t >= 4.99;
  const cellsHis = showMe ? cellsFor(HIS_ME, t, C.orange) : hisCells;
  const flash = t < B.timerZero && Math.floor(t / 0.3) % 2 === 0 ? 1 : 0;
  const ring = t < B.timerZero ? 1 - t / B.timerZero : null;
  const banner = t >= B.timerZero && t < 5.0 ? {text: 'TURN SKIPPED', age: t - B.timerZero} : null;
  const hisShake = t >= B.timerZero && t < B.timerZero + 0.3 ? 1 - (t - B.timerZero) / 0.3 : 0;
  const score = t >= 14.2 ? '1' : '0', pop = t >= 14.2 && t < 14.7 ? Math.sin((t - 14.2) / 0.5 * Math.PI) : 0;
  const xMark = smooth(t, 16.0, 16.2);
  const pins7 = Array.from({length: 10}, (_, i) => !(i === 0 && t >= 14.0));
  const pins8 = Array.from({length: 10}, () => t < 16.0);
  // balls
  const lemonOn = t < 7.25 || (t >= 10.4 && t < 11.0) || t >= 14.4;
  const lemonY = t >= 10.4 && t < 11.0 ? Math.max(0, 1 - (t - 10.4) / 0.25) * 70 * (1 - (t - 10.4) / 0.25) : t >= 14.4 ? Math.max(0, 1 - (t - 14.4) / 0.25) * 70 * (1 - (t - 14.4) / 0.25) : 0;
  const violetOn = t >= 16.6;
  const herBall = t < 14.0 ? [80, -88] : [lerp(80, 96, smooth(t, 14.0, 14.15)), lerp(-88, -34, smooth(t, 14.0, 14.15))];
  const himBall = t >= 7.25 && t < 9.3 ? [lerp(143, 28, smooth(t, 7.25, 7.55)), lerp(-122, -162, smooth(t, 7.25, 7.55))] : null;
  const p1 = smooth(t, 6.4, 6.65), p2 = smooth(t, 6.65, 7.0);
  const phoneVis = t < 7.02;
  const phoneX = lerp(hp.a1[0] + lerp(0, 14, p1), 0, p2), phoneY = lerp(hp.a1[1] - lerp(98, 55, p1), 80, p2);
  const himItems = <g>
    {phoneVis && <g clipPath={t > 6.4 ? 'url(#pocketClip)' : undefined}><Phone x={phoneX} y={phoneY} t={t} rot={lerp(-8, 0, p1)} s={1.35} flick={flick && t < 6.4} glow={1 - p2} /></g>}
    {himBall && <Ball x={himBall[0]} y={himBall[1]} r={34} color={C.lemon} spin={30} shadow={false} />}
  </g>;
  const herItems = t >= 15.0 ? null : <Ball x={herBall[0]} y={herBall[1]} r={36} color={C.violet} spin={t * 0} shadow={t >= 14.15} />;
  return <>
    <g transform={planeT(cam, 0.8)}><Wall t={t} /></g>
    <g transform={planeT(cam, 0.88)}><Burst age={t - 14.2} /></g>
    <g transform={planeT(cam, 0.9)}>
      <Monitor x={280} y={440} lane={7} cells={cellsHis} t={t} cellFlash={flash} ring={ring} banner={banner} score={score} scorePop={pop} shake={hisShake} />
      <Monitor x={800} y={440} lane={8} cells={cellsFor(HERS, t, C.mint)} t={t} score="0" xMark={xMark} />
    </g>
    <g transform={planeT(cam, 1)}>
      <defs><clipPath id="pocketClip"><rect x={-300} y={-500} width={600} height={392} /></clipPath></defs>
      <Carpet t={t} />
      <LanesBg t={t} pins7={pins7} pins8={pins8} />
      <Keypad x={470} y={1000} lit={t >= 5.0 && t < 5.85 ? KEY_SEQ[Math.min(4, Math.floor((t - 5.0) / 0.2))] : -1} />
      <ReturnHump lemon={lemonOn ? 1 : 0} violet={violetOn ? 1 : 0} lemonY={lemonY} />
      <Figure kind="him" x={hx} y={FEET} p={hp} t={t} items={himItems} />
      <Figure kind="her" x={HER_X} y={FEET} p={wp} t={t} items={herItems} />
    </g>
  </>;
};

// ------------------------------------------------------------------------------------------ down-the-lane shots
const LVP = 700, hwAt = (y: number) => 430 * (y - LVP) / 550, sAt = (y: number) => (y - LVP) / 550;
const LROWS: [number, number[]][] = [[880, [-0.87, -0.29, 0.29, 0.87]], [905, [-0.58, 0, 0.58]], [930, [-0.29, 0.29]], [955, [0]]];
const lx = (y: number, v: number) => 540 + v * hwAt(y);
const lPoly = (y0: number, y1: number, v0: number, v1: number) => `M ${lx(y0, v0)} ${y0} L ${lx(y0, v1)} ${y0} L ${lx(y1, v1)} ${y1} L ${lx(y1, v0)} ${y1} Z`;

type LaneMode = {kind: 'him' | 'her'; color: string; swing: [number, number, number, number]; /* start, back, forward, release */ roll: [number, number]; vAt: (u: number) => number; zoom: [number, number]; wipeStreak?: [number, number]; hitAt?: number};
const MODES: Record<string, LaneMode> = {
  g1: {kind: 'him', color: C.lemon, swing: [7.6, 7.68, 7.76, 7.8], roll: [7.8, 9.0], vAt: (u) => -0.3 - 0.77 * smooth(u, 0.25, 0.88), zoom: [7.82, 8.12], wipeStreak: [7.8, 8.15]},
  g2: {kind: 'him', color: C.lemon, swing: [11.0, 11.22, 11.38, 11.4], roll: [11.4, 12.8], vAt: (u) => -0.3 - 0.45 * smooth(u, 0.2, 1), zoom: [11.5, 11.95]},
  her: {kind: 'her', color: C.violet, swing: [14.6, 14.8, 15.08, 15.1], roll: [15.1, 16.0], vAt: (u) => -0.3 + 0.3 * smooth(u, 0.1, 0.8), zoom: [15.25, 15.7], hitAt: 16.0},
};
const LaneShot: React.FC<{t: number; m: string}> = ({t, m}) => {
  const md = MODES[m];
  const [s0, s1, s2, rel] = md.swing;
  const zk = smooth(t, md.zoom[0], md.zoom[1]);
  const z = lerp(1, 1.45, zk);
  const shake = m === 'g1' && t > 9.0 && t < 9.3 ? Math.sin(t * 80) * 7 * (1 - (t - 9) / 0.3) : 0;
  const u = clamp((t - md.roll[0]) / (md.roll[1] - md.roll[0]));
  const yb = lerp(1330, 905, Math.pow(u, 0.82));
  const inGutter = smooth(u, 0.8, 0.9) * (m === 'g1' ? 1 : 0);
  const bv = md.vAt(u);
  const bx = lx(yb, bv), by = yb + inGutter * 12 * sAt(yb), br = 80 * sAt(yb);
  const rolling = t >= rel && !(md.hitAt && t > md.hitAt + 0.05) && !(m === 'g1' && t > 9.05);
  const pins = LROWS.flatMap(([y, vs]) => vs.map((v) => ({y, x: lx(y, v)})));
  // hand: stance -> backswing -> forward
  const hand = t < s1 ? track([[s0, [78, -66]], [s1, [120, -30]]], t) : track([[s1, [120, -30]], [s2, [92, -112]]], t);
  const ballInHand = t < rel;
  const trail = rolling ? Array.from({length: 8}, (_, i) => { const tu = clamp((t - i * 0.05 - md.roll[0]) / (md.roll[1] - md.roll[0])); if (tu <= 0) return null; const y2 = lerp(1330, 905, Math.pow(tu, 0.82)); const g2 = smooth(tu, 0.8, 0.9) * (m === 'g1' ? 1 : 0); return {x: lx(y2, md.vAt(tu)), y: y2 + g2 * 12 * sAt(y2), r: 80 * sAt(y2), i}; }) : [];
  const hit = md.hitAt ? t - md.hitAt : -1;
  const pitDrop = m === 'g1' && t > 9.05 ? smooth(t, 9.05, 9.25) : 0;
  const stance: Pose = {lx: 0, ly: 0, brow: 0, tilt: m === 'g1' && t > 8.2 ? 4 : 0, dy: 0, a1: [-70, -52], a2: [hand[0], hand[1]], mouth: 'flat'};
  const streak = md.wipeStreak && t >= md.wipeStreak[0] && t <= md.wipeStreak[1];
  const strikeX = md.hitAt && hit > 0.03 ? smooth(hit, 0.03, 0.12) : 0;
  return <g transform={`translate(${shake} 0)`}>
    <g transform={`translate(540 ${lerp(960, 1010, zk)}) scale(${z}) translate(-540 -${lerp(960, 945, zk)})`}>
      <rect x={-600} y={-300} width={2280} height={1200} fill={C.wall} />
      <Memphis x0={-300} y0={0} x1={1400} y1={760} n={40} seed={4} op={0.8} t={t} />
      <rect x={-600} y={760} width={2280} height={100} fill={C.ink} />
      <rect x={-600} y={760} width={2280} height={12} fill={C.lemon} />
      <rect x={-600} y={820} width={2280} height={40} fill="#000" opacity={0.35} />
      <rect x={-600} y={860} width={2280} height={900} fill="#251F4A" />
      <path d={lPoly(850, 1560, -1.32, 1.32)} fill={C.ink} />
      <path d={lPoly(850, 1560, -1.12, 1.12)} fill={C.teal} />
      <path d={lPoly(850, 1560, -1.0, 1.0)} fill={C.lane} />
      {[-0.66, -0.33, 0, 0.33, 0.66].map((v, i) => <path key={i} d={`M ${lx(850, v)} 850 L ${lx(1560, v)} 1560`} stroke={C.laneLine} strokeWidth={4} />)}
      {[-0.6, -0.4, -0.2, 0, 0.2, 0.4, 0.6].map((v, i) => { const y = 1060 + (3 - Math.abs(i - 3)) * 44; const s = sAt(y); return <path key={i} d={`M ${lx(y, v) - 22 * s * 1.4} ${y + 22 * s * 1.4} L ${lx(y, v)} ${y - 34 * s * 1.4} L ${lx(y, v) + 22 * s * 1.4} ${y + 22 * s * 1.4} Z`} fill={C.orange} />; })}
      <path d={lPoly(1196, 1204, -1.32, 1.32)} fill={C.ink} />
      {/* pins */}
      {(strikeX > 0 ? [] : pins).map((p, i) => <Pin key={i} x={p.x} y={p.y + 6} s={sAt(p.y) * 1.2} />)}
      {strikeX > 0 && pins.map((p, i) => {
        const vx = ((i * 97) % 11 - 5) * 70, vy = -160 - ((i * 53) % 7) * 70, tau = hit, ok = 1 - smooth(tau, 0.35, 0.55);
        return <g key={i} opacity={ok}><Pin x={p.x + vx * tau} y={p.y - 60 + vy * tau + 900 * tau * tau} s={sAt(p.y) * 1.2} rot={tau * (i % 2 ? 900 : -800)} /></g>;
      })}
      {trail.map((q) => q && <circle key={q.i} cx={q.x} cy={q.y} r={q.r * 0.9} fill={C.cream} opacity={0.12 * (1 - q.i / 8)} />)}
      {(rolling || (m === 'g1' && t <= 9.25 && t > rel)) && <g opacity={1 - pitDrop}><Ball x={bx} y={by + pitDrop * 20} r={br * (1 - pitDrop * 0.3)} color={md.color} spin={u * 900} /></g>}
      {m === 'g1' && t >= 9.0 && t < 9.2 && <g stroke={C.cream} strokeWidth={6} strokeLinecap="round" opacity={1 - (t - 9) / 0.2}>
        {[0, 1, 2, 3, 4, 5].map((i) => { const a = -Math.PI * (0.1 + i * 0.16), k = 28 + (t - 9) * 160; return <path key={i} d={`M ${bx + Math.cos(a) * k} ${by + Math.sin(a) * k} L ${bx + Math.cos(a) * (k + 22)} ${by + Math.sin(a) * (k + 22)}`} />; })}
      </g>}
      {/* the thrower, seen from behind (low camera) */}
      <g transform="translate(250 1510) scale(1.5)">
        <BackFigure kind={md.kind} p={stance} t={t} ball={ballInHand ? md.color : null} />
      </g>
    </g>
        <g transform={`translate(0 ${zk * -8})`}>
      <Monitor x={540} y={420} lane={m === 'her' ? 8 : 7} cells={m === 'her' ? cellsFor(HERS, t, C.mint) : cellsFor(HIS_ME, t, C.orange)} t={t} score="0" xMark={m === 'her' ? smooth(t, 16.0, 16.2) : 0} />
    </g>
    {streak && <g stroke={C.cream} strokeWidth={4} strokeLinecap="round" opacity={0.3}>
      {Array.from({length: 14}, (_, i) => { const a = (i / 14) * Math.PI * 2, k = ((t * 6 + i * 0.37) % 1); return <path key={i} d={`M ${540 + Math.cos(a) * (240 + k * 600)} ${960 + Math.sin(a) * (240 + k * 600)} L ${540 + Math.cos(a) * (330 + k * 700)} ${960 + Math.sin(a) * (330 + k * 700)}`} />; })}
    </g>}
    {md.hitAt && strikeX > 0 && <g transform={`translate(540 1130) rotate(-7) scale(${0.3 + 0.7 * smooth(hit, 0.03, 0.15)})`}>
      <path d={Array.from({length: 24}, (_, i) => { const a = i / 24 * Math.PI * 2, r = i % 2 ? 175 : 235; return `${i ? 'L' : 'M'} ${Math.cos(a) * r * 1.35} ${Math.sin(a) * r * 0.62}`; }).join(' ') + ' Z'} fill={C.lemon} stroke={C.ink} strokeWidth={8} strokeLinejoin="round" />
      <text x={0} y={34} textAnchor="middle" fontFamily={NUN} fontWeight={900} fontSize={104} fill={C.orange} stroke={C.ink} strokeWidth={9} paintOrder="stroke">STRIKE!</text>
    </g>}
  </g>;
};

/** Seen from behind, local origin = feet, drawn at scale 1.5. */
export const BackFigure: React.FC<{kind: 'him' | 'her'; p: Pose; t: number; ball: string | null}> = ({kind, p, t, ball}) => {
  const him = kind === 'him', body = him ? C.orange : C.violet, skin = him ? C.skinHim : C.skinHer;
  const sw = Math.sin(t * 2) * 2;
  const a2 = p.a2;
  const pts = (s: [number, number], h: [number, number], side: 1 | -1) => {
    let dx = h[0] - s[0], dy = h[1] - s[1], d = Math.hypot(dx, dy); const mx = 208; if (d > mx) { dx *= mx / d; dy *= mx / d; d = mx; }
    const hh = Math.sqrt(Math.max(0, 108 * 108 - (d / 2) ** 2)); let px = -dy / d, py = dx / d; if (px * side * 0.45 + py * 0.9 < 0) { px = -px; py = -py; }
    return {e: [s[0] + dx / 2 + px * hh, s[1] + dy / 2 + py * hh], h: [s[0] + dx, s[1] + dy]};
  };
  const A1 = pts([-58, -208], p.a1, -1), A2 = pts([58, -208], a2, 1);
  return <g transform={`translate(0 ${sw})`}>
    <g stroke={C.ink} strokeWidth={5}>
      <rect x={-40} y={-120} width={30} height={120} rx={10} fill={him ? C.ink : C.teal} /><rect x={10} y={-120} width={30} height={120} rx={10} fill={him ? C.ink : C.teal} />
    </g>
    <path d="M -66 -40 C -76 -120 -70 -196 -42 -232 L 42 -232 C 70 -196 76 -120 66 -40 Z" fill={body} stroke={C.ink} strokeWidth={5.5} strokeLinejoin="round" />
    {him && <path d="M -48 -226 Q 0 -190 48 -226 Q 40 -160 0 -150 Q -40 -160 -48 -226 Z" fill={C.orangeDeep} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />}
    {!him && <path d="M 0 -232 L 0 -42" stroke={C.lemon} strokeWidth={7} />}
    {[{s: [-58, -208] as [number, number], A: A1}, {s: [58, -208] as [number, number], A: A2}].map(({s, A}, i) => <g key={i} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={`M ${s[0]} ${s[1]} L ${A.e[0]} ${A.e[1]} L ${A.h[0]} ${A.h[1]}`} stroke={C.ink} strokeWidth={46} />
      <path d={`M ${s[0]} ${s[1]} L ${A.e[0]} ${A.e[1]} L ${A.h[0]} ${A.h[1]}`} stroke={body} strokeWidth={36} />
      <circle cx={A.h[0]} cy={A.h[1]} r={21} fill={skin} stroke={C.ink} strokeWidth={4} />
    </g>)}
    {ball && <Ball x={A2.h[0]} y={A2.h[1] + 14} r={34} color={ball} spin={10} shadow={false} />}
    <g transform={`rotate(${p.tilt} 0 -250)`}>
      <circle cx={0} cy={-300} r={62} fill={skin} stroke={C.ink} strokeWidth={5.5} />
      <circle cx={-64} cy={-296} r={11} fill={skin} stroke={C.ink} strokeWidth={4.5} /><circle cx={64} cy={-296} r={11} fill={skin} stroke={C.ink} strokeWidth={4.5} />
      {him ? <g><path d="M -64 -290 C -70 -394 70 -394 64 -290 Q 0 -262 -64 -290 Z" fill={C.ink} /><rect x={-14} y={-282} width={28} height={8} rx={4} fill={C.lemon} /></g>
        : <g><path d="M -64 -290 C -72 -394 72 -394 64 -290 Q 0 -236 -64 -290 Z" fill={C.ink} /><ellipse cx={0} cy={-364} rx={20} ry={14} fill={C.lemon} stroke={C.ink} strokeWidth={4.5} /></g>}
    </g>
    {!him && <path d={`M 0 -356 Q ${22 + Math.sin(t * 4) * 6} -300 ${10 + Math.sin(t * 4) * 8} -210`} stroke={C.ink} strokeWidth={30} strokeLinecap="round" fill="none" />}
  </g>;
};

// ------------------------------------------------------------------------------------------ cut-ins
const DOTS = <Memphis x0={-100} y0={300} x1={1180} y1={1100} n={26} seed={7} op={0.55} />;

const BallCut: React.FC<{t: number}> = ({t}) => {
  const k = smooth(t, 12.1, 12.6);
  const bx = lerp(220, 560, k), spin = (t - 12.1) * 160;
  return <g>
    <rect x={0} y={0} width={1080} height={1920} fill={C.violet} />
    {DOTS}
    <rect x={0} y={1130} width={1080} height={800} fill={C.lane} />
    <rect x={0} y={1120} width={1080} height={14} fill={C.ink} />
    {[0, 1, 2, 3, 4, 5, 6].map((i) => <rect key={i} x={((i * 220 - (t - 12.1) * 120) % 1540 + 1540) % 1540 - 200} y={1150} width={14} height={600} fill={C.laneLine} />)}
    <Pin x={930} y={1126} s={1.45} />
    {[0.2, 0.4, 0.6].map((d, i) => <ellipse key={i} cx={bx - 230 - i * 70} cy={1000 - i * 4} rx={80 - i * 14} ry={6} fill={C.cream} opacity={0.4 - i * 0.1} />)}
    <Ball x={bx} y={950 + Math.sin(t * 40) * 3} r={190} color={C.lemon} spin={spin} />
  </g>;
};

const PIN_BG = [[760, 0.9], [880, 0.78], [990, 0.84], [640, 0.7]] as [number, number][];
const PinCut: React.FC<{t: number}> = ({t}) => {
  const nudge = 12.8, fall = 13.85;
  const age = Math.max(0, t - nudge);
  const A = 6 + 17 * smooth(t, 12.9, 13.84);
  const wob = t < fall ? (t < nudge ? 0 : (age < 0.14 ? 9 * smooth(age, 0, 0.14) : A * Math.sin((age - 0.14) * 2 * Math.PI * 1.55 + 0.0) * 0.95 + 2)) : 0;
  const down = smooth(t, fall, 14.0);
  const bounce = t > 14.0 && t < 14.14 ? Math.sin((t - 14.0) / 0.14 * Math.PI) * 14 : 0;
  const rot = t < fall ? wob : lerp(A * 0.95, 90, down * down);
  const ballX = keyAt(t, [[0, 0]]) === 0 ? track([[12.55, [-260]], [12.8, [330]], [13.25, [1500]]], t)[0] : 0;
  const pinX = 610, floor = 1190;
  const dust = t > 14.0 ? t - 14.0 : -1;
  return <g>
    <rect x={0} y={0} width={1080} height={1920} fill={C.wall} />
    {DOTS}
    <rect x={0} y={floor - 16} width={1080} height={800} fill={C.lane} />
    <rect x={0} y={floor - 16} width={1080} height={14} fill={C.ink} />
    {PIN_BG.map(([x, s], i) => <g key={i} opacity={0.9}><Pin x={x + (i === 3 ? 0 : 0) + 120 * (i === 3 ? -0.2 : 0.4)} y={floor - 14 - i * 6 + (i === 3 ? -6 : 0)} s={s * 1.4} /></g>)}
    <g transform={`translate(${pinX} ${floor + bounce * 0.2})`}>
      <g transform={`rotate(${rot + 0} 0 0)`}><Pin x={0} y={0} s={3.1} /></g>
    </g>
    {dust > 0 && dust < 0.5 && <g opacity={1 - dust / 0.5} fill={C.cream} stroke={C.ink} strokeWidth={4}>
      {[-1, 1].map((sg) => [0, 1, 2].map((j) => <circle key={sg + '' + j} cx={pinX + 190 + sg * 60 + sg * dust * 160 * (j + 1) + 120} cy={floor - 20 - dust * 50 * j} r={18 + j * 6 + dust * 20} />))}
    </g>}
    {t >= nudge && t < nudge + 0.2 && <g stroke={C.ink} strokeWidth={9} strokeLinecap="round">
      {[-1, -0.5, 0].map((q, i) => <path key={i} d={`M ${520 + q * 30} ${900 + i * 40} l -50 ${q * 40 - 10}`} opacity={1 - (t - nudge) / 0.2} />)}
    </g>}
    {t < 13.4 && <Ball x={ballX} y={floor - 192} r={190} color={C.lemon} spin={(t - 12.5) * 200} />}
  </g>;
};

const FaceCut: React.FC<{t: number}> = ({t}) => {
  const k = t - 13.3;
  const p: Pose = {lx: 1, ly: -0.2, brow: 1, mouth: 'wince', tilt: Math.sin(k * 40) * 1.2, dy: 0, a1: [0, 0], a2: [0, 0], blush: 0.6};
  return <g>
    <rect x={0} y={0} width={1080} height={1920} fill={C.teal} />
    <Memphis x0={-100} y0={300} x1={1180} y1={1300} n={30} seed={9} op={0.5} />
    <g transform={`translate(540 ${960 + 40}) scale(${3.0 + k * 0.5}) translate(0 300)`}>
      <circle cx={0} cy={-300} r={62} fill={C.skinHim} stroke={C.ink} strokeWidth={4} />
      <circle cx={-64} cy={-296} r={11} fill={C.skinHim} stroke={C.ink} strokeWidth={3.5} /><circle cx={64} cy={-296} r={11} fill={C.skinHim} stroke={C.ink} strokeWidth={3.5} />
      <g transform={`rotate(${p.tilt} 0 -250)`}>
        <Face p={p} kind="him" eyeR={11} />
        <path d="M -62 -322 C -64 -396 64 -396 62 -322 Z" fill={C.ink} />
        <path d="M -70 -324 Q 0 -312 74 -324 L 70 -338 Q 0 -327 -66 -338 Z" fill={C.ink} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
        <circle cx={0} cy={-360} r={9} fill={C.lemon} />
        <path d="M 60 -330 Q 72 -310 60 -300 Q 48 -310 60 -330 Z" fill={C.cream} stroke={C.ink} strokeWidth={3} transform={`translate(${Math.sin(k * 20) * 2} ${k * 30})`} />
      </g>
      <g stroke={C.ink} strokeWidth={4}><circle cx={-14} cy={-236} r={23} fill={C.skinHim} /><circle cx={16} cy={-232} r={23} fill={C.skinHim} /></g>
      <path d="M -20 -250 L -6 -222 M 10 -246 L 24 -220" stroke={C.ink} strokeWidth={3.5} strokeLinecap="round" />
    </g>
  </g>;
};

const Hand: React.FC<{x: number; y: number; rot?: number}> = ({x, y, rot = 0}) => <g transform={`translate(${x} ${y}) rotate(${rot})`} stroke={C.ink} strokeWidth={7} strokeLinejoin="round">
  <path d="M -70 300 L -50 40 L 50 40 L 70 300 Z" fill={C.orange} />
  <rect x={-58} y={-56} width={116} height={110} rx={40} fill={C.skinHim} />
  {[-42, -14, 14, 42].map((fx, i) => <rect key={i} x={fx - 12} y={-130 - (i === 1 || i === 2 ? 14 : 0)} width={24} height={86} rx={12} fill={C.skinHim} />)}
  <rect x={-96} y={-40} width={44} height={22} rx={11} fill={C.skinHim} transform="rotate(-24 -74 -30)" />
</g>;

const PocketCut: React.FC<{t: number}> = ({t}) => {
  const a = t - B.buzz;
  const buzz = a > 0 ? Math.sin(t * 110) * 6 * (a < 0.15 ? a / 0.15 : Math.max(0.25, 1 - (a - 0.15) / 0.6)) : 0;
  const glow = 0.6 + 0.4 * Math.sin(t * 24);
  const hx = 740 + Math.sin((t - 17.4) * 6) * 120, hy = 780 + Math.cos((t - 17.4) * 4) * 24;
  return <g>
    <rect x={0} y={0} width={1080} height={1920} fill={C.orange} />
    <rect x={0} y={0} width={1080} height={1920} fill={C.orangeDeep} opacity={0.18} />
    <g stroke={C.ink} strokeWidth={8} strokeLinecap="round" fill="none"><path d="M 300 280 Q 330 330 300 400" opacity={0.0} /></g>
    <g transform={`translate(${buzz} ${buzz * 0.4})`}>
      <circle cx={380} cy={800} r={330 * glow} fill={C.lemon} opacity={0.22} /><circle cx={380} cy={800} r={220 * glow} fill={C.lemon} opacity={0.3} />
      <g transform="translate(380 770) rotate(-7)"><Phone x={0} y={0} t={t} flick={false} glow={0} s={1.5} /></g>
      <path d="M 120 880 Q 380 840 640 880 L 690 1190 L 70 1190 Z" fill={C.orangeDeep} stroke={C.ink} strokeWidth={9} strokeLinejoin="round" />
      <path d="M 150 905 Q 380 868 610 905" stroke={C.lemon} strokeWidth={8} strokeLinecap="round" fill="none" opacity={glow} strokeDasharray="30 18" />
    </g>
    <g transform="translate(880 1040)"><rect x={-110} y={-130} width={220} height={260} rx={26} fill={C.ink} stroke={C.teal} strokeWidth={9} />
      <rect x={-84} y={-104} width={168} height={38} rx={8} fill="#0E0C1C" />
      {Array.from({length: 9}, (_, i) => <circle key={i} cx={-56 + (i % 3) * 56} cy={-22 + Math.floor(i / 3) * 56} r={20} fill={i === 4 ? C.lemon : C.cream} />)}
    </g>
    <Hand x={hx} y={hy + 150} rot={Math.sin((t - 17.4) * 6) * 8} />
    {a > 0 && a < 0.5 && [1, 2].map((i) => <path key={i} d={`M ${120 - i * 30} ${760} q -20 40 0 80 M ${640 + i * 30} ${760} q 20 40 0 80`} stroke={C.ink} strokeWidth={8} fill="none" strokeLinecap="round" opacity={1 - a * 2} />)}
  </g>;
};

// ------------------------------------------------------------------------------------------ the vote
const Card: React.FC<{k: 'A' | 'B'; text: string; y: number; age: number; tint: string; pulse: number}> = ({k, text, y, age, tint, pulse}) => {
  if (age < 0) return null;
  const pop = age < 0.28 ? 1 + 0.12 * Math.sin(Math.min(1, age / 0.28) * Math.PI) - 0.25 * (1 - smooth(age, 0, 0.12)) : 1;
  const cells: Cell[] = Array.from({length: 9}, (_, i) => ({ch: text[i] ?? ' ', prev: ' ', flipAt: age < 0.2 ? 1e9 : 0, color: C.cream, instant: true}));
  return <g transform={`translate(540 ${y + 85}) scale(${pop + pulse * 0.025}) translate(-540 ${-(y + 85)})`}>
    <rect x={50} y={y + 12} width={980} height={170} rx={28} fill={C.ink} />
    <rect x={40} y={y} width={980} height={170} rx={28} fill={C.violet} stroke={C.ink} strokeWidth={6} />
    <circle cx={112} cy={y + 85} r={52} fill={tint} stroke={C.ink} strokeWidth={6} />
    <text x={112} y={y + 85 + 26} textAnchor="middle" fontFamily={NUN} fontWeight={900} fontSize={76} fill={C.ink}>{k}</text>
    <g transform={`translate(190 ${y + 22})`}><NameCells cells={cells.map((c) => ({...c, flipAt: -1e9}))} t={age} w={78} h={126} gap={6} font={110} bg="#0E0C1C" /></g>
  </g>;
};
const KeysScene: React.FC<{t: number}> = ({t}) => {
  const cur = Math.floor(t * 2) % 2 === 0;
  const tap = t - B.tap;
  const pulse = (a: number) => Math.max(0, 1 - Math.abs(t - a) / 0.25);
  const buzz2 = t > B.buzz2 && t < B.buzz2 + 0.8 ? Math.sin(t * 110) * 7 * (1 - (t - B.buzz2) / 0.8) : 0;
  const thumb = {x: 800 + Math.sin(t * 1.4) * 22, y: 1180 + Math.sin(t * 2.1) * 10 - 6 * smooth(tap, 0, 0.1) * (tap > 0 ? 1 : 0)};
  const emptyCells: Cell[] = Array.from({length: 9}, () => ({ch: ' ', prev: ' ', flipAt: -1e9, color: C.orange}));
  return <g>
    <rect x={0} y={0} width={1080} height={1920} fill={C.wall} />
    <Memphis x0={-50} y0={200} x1={1130} y1={1500} n={40} seed={12} op={0.6} t={t} />
    {/* his name box, big */}
    <g transform="translate(0 0)">
      <rect x={36} y={600} width={1008} height={176} rx={30} fill={C.ink} transform="translate(10 12)" />
      <rect x={36} y={600} width={1008} height={176} rx={30} fill={C.violet} stroke={C.ink} strokeWidth={6} />
      <rect x={52} y={614} width={976} height={148} rx={20} fill="#0A0818" />
      <g transform="translate(62 627)"><NameCells cells={emptyCells} t={t} w={100} h={124} gap={8} font={112} bg="#201B48" /></g>
      <rect x={62 + 28} y={627 + 22} width={44} height={80} rx={6} fill={C.orange} opacity={cur ? 0.9 : 0} />
      <text x={72} y={546} fontFamily={BAR} fontWeight={800} fontSize={34} letterSpacing={3} fill={C.teal} />
    </g>
    <Card k="A" text={spec.choices.A.l1} y={795} age={t - B.cardA} tint={C.orange} pulse={pulse(B.tap) + pulse(B.tap + 1)} />
    <Card k="B" text={spec.choices.B.l1} y={985} age={t - B.cardB} tint={C.teal} pulse={pulse(B.tap + 0.5) + pulse(B.tap + 1.5)} />
    {/* keypad row + hovering thumb */}
    <g transform="translate(0 0)">
      {Array.from({length: 5}, (_, i) => <g key={i} transform={`translate(${400 + i * 110} 1205)`}><circle r={36} fill={C.ink} /><circle r={30} fill={i === 2 && tap > 0 && tap < 0.15 ? C.orange : C.cream} stroke={C.ink} strokeWidth={4} /></g>)}
      <g transform={`translate(${thumb.x} ${thumb.y}) rotate(-24)`}><rect x={-34} y={-70} width={68} height={190} rx={34} fill={C.skinHim} stroke={C.ink} strokeWidth={7} /><ellipse cx={0} cy={-42} rx={20} ry={14} fill="#fff" opacity={0.35} /></g>
    </g>
    {/* his pocket, buzzing again */}
    <g transform={`translate(${buzz2} 50)`}>
      <path d="M -40 1130 Q 130 1090 300 1140 L 330 1260 L -40 1260 Z" fill={C.orange} stroke={C.ink} strokeWidth={7} strokeLinejoin="round" />
      {t > B.buzz2 && t < B.buzz2 + 0.9 && <><circle cx={120} cy={1100} r={50 + (t - B.buzz2) * 60} fill={C.lemon} opacity={0.35 * (1 - (t - B.buzz2) / 0.9)} />
        <path d="M 40 1085 q -26 28 0 56 M 200 1085 q 26 28 0 56" stroke={C.cream} strokeWidth={7} fill="none" strokeLinecap="round" /></>}
    </g>
  </g>;
};

const EndCard: React.FC<{t: number}> = ({t}) => {
  const a = t - B.endcard;
  const k = smooth(a, 0, 0.25);
  const pop = a < 0.3 ? 1 + 0.15 * (1 - a / 0.3) : 1;
  const mk = (txt: string, y: number, big = true) => <g transform={`translate(540 ${y}) scale(${pop}) translate(-540 ${-y})`}>
    <rect x={64} y={y - 100} width={960} height={190} rx={34} fill={C.ink} transform="translate(12 14)" />
    <rect x={64} y={y - 100} width={960} height={190} rx={34} fill={big ? C.lemon : C.cream} stroke={C.ink} strokeWidth={7} />
    <text x={544} y={y + 50} textAnchor="middle" fontFamily={NUN} fontWeight={900} fontSize={big ? 130 : 120} fill={C.ink}>{txt}</text>
  </g>;
  return <g opacity={k}>
    <rect x={0} y={0} width={1080} height={1920} fill={C.cream} />
    <Memphis x0={-50} y0={150} x1={1130} y1={1700} n={46} seed={21} op={0.9} t={t} />
    {mk('lane 8 · part 2', 480)}
    {mk('A or B', 740, false)}
    <g transform={`translate(0 20)`}>
      {[['A', 'ONE SEC', C.orange, 920], ['B', 'GAME ON', C.teal, 1100]].map(([kk, tx, col, y]) => <g key={kk as string} opacity={smooth(a, 0.3, 0.55)}>
        <rect x={110} y={(y as number) - 10} width={870} height={150} rx={26} fill={C.ink} transform="translate(8 10)" />
        <rect x={110} y={(y as number) - 10} width={870} height={150} rx={26} fill={C.violet} stroke={C.ink} strokeWidth={6} />
        <circle cx={185} cy={(y as number) + 65} r={44} fill={col as string} stroke={C.ink} strokeWidth={6} />
        <text x={185} y={(y as number) + 90} textAnchor="middle" fontFamily={NUN} fontWeight={900} fontSize={64} fill={C.ink}>{kk}</text>
        <text x={260} y={(y as number) + 98} fontFamily={BAR} fontWeight={800} fontSize={104} letterSpacing={6} fill={C.cream}>{tx}</text>
      </g>)}
    </g>
  </g>;
};

// ------------------------------------------------------------------------------------------ the edit
const WIPES = [B.ballWipe1, B.ballWipe2, B.ballWipe3];
type Shot = 'bayA' | 'bayB' | 'g1' | 'g2' | 'ball' | 'pin' | 'face' | 'her' | 'pocket' | 'keys' | 'end';
const shotAt = (t: number): Shot => {
  if (t < 3.0) return 'bayA';
  if (t < 7.6) return 'bayB';
  if (t < 9.3) return 'g1';
  if (t < 11.0) return 'bayB';
  if (t < 12.1) return 'g2';
  if (t < 12.6) return 'ball';
  if (t < 13.3) return 'pin';
  if (t < 13.65) return 'face';
  if (t < 14.15) return 'pin';
  if (t < 14.8) return 'bayB';
  if (t < 16.2) return 'her';
  if (t < 17.4) return 'bayB';
  if (t < 18.0) return 'pocket';
  if (t < 28.4) return 'keys';
  return 'end';
};
const renderShot = (s: Shot, t: number): React.ReactNode => {
  switch (s) {
    case 'bayA': return <Bay t={t} cam={camAt(CAM_A, t)} />;
    case 'bayB': return <Bay t={t} cam={camAt(CAM_B, t)} />;
    case 'g1': return <LaneShot t={t} m="g1" />;
    case 'g2': return <LaneShot t={t} m="g2" />;
    case 'her': return <LaneShot t={t} m="her" />;
    case 'ball': return <BallCut t={t} />;
    case 'pin': return <PinCut t={t} />;
    case 'face': return <FaceCut t={t} />;
    case 'pocket': return <PocketCut t={t} />;
    case 'keys': return <KeysScene t={t} />;
    default: return <EndCard t={t} />;
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
  const whip = t >= 7.8 && t <= 8.15;
  const fast = w !== undefined || whip;
  return <>
    <MotionBlurWhen fast={fast} samples={5} shutter={200}>
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
        {t < 3.0 && <Strip text={(spec.hooks as Record<string, string>)[hook]} y={345} age={t + 1} out={smooth(t, 2.8, 3.0)} size={56} maxW={960} />}
        {spec.strips.map((s, i) => {
          if (s.y === 330 && s.from < 3.0) return null;
          if (t < s.from || t >= s.to) return null;
          const end = (s as {big?: boolean}).big;
          if (end) return null;
          const y = s.text.startsWith('what should') ? 345 : s.text.startsWith('comment') ? 520 : s.text.startsWith('my pocket') ? 1110 : s.y === 1150 ? 1205 : s.y;
          const out = smooth(t, s.to - 0.12, s.to);
          return <Strip key={i} text={s.text} y={y} age={t - s.from + 0.06} out={out} size={s.text.startsWith('comment') ? 80 : s.y === 1150 ? 50 : 58} rot={i % 2 ? 0.8 : -0.8} hue={s.y === 1150 ? 'ink' : 'lemon'} />;
        })}
      </svg>
    </AbsoluteFill>
  </>;
};

export const Lane1: React.FC<{hook?: Hook}> = ({hook = 'a'}) => (
  <AbsoluteFill style={{background: C.wall}}>
    <Audio src={staticFile('audio/lane-ep1-room.wav')} volume={0.5} />
    <Audio src={staticFile('audio/lane-ep1-music.wav')} volume={0.75} />
    <Audio src={staticFile('audio/lane-ep1-sfx.wav')} volume={0.9} />
    <Scene hook={hook} />
  </AbsoluteFill>
);
