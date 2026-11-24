import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, lerp, smooth} from '../../lib/motion';
import {MotionBlurWhen} from '../../lib/shots';
import {
  Bag, BARLOW, C, CAVEAT, Cam, Defs, EndCard, FarBelt, Floor, FlapRim, HallWall, Flowers, Hand, JOST, KraftTag, NearBelt, NearRail, Pen, Person, Phone, Pose, Mouth,
  Strip, TagLine, WIPE_DUR, flapEdge, planeT, tagGeom,
} from './world';
import spec from '../../../specs/stories/bag-ep6.json';

// Same Bag, part 6 "Two tags" (FINALE). Silent. Opener (hook a / b): BELT 4, her grey bag, board RIDE / ARRIVED, a window with her car at PICK-UP,
// his phone lit mid-swipe. 3-5.5 context insert (three earlier tags). Take 1 (vote B): he waves bigger and bigger, she walks to her car, his bag
// rolls off without him, blank tag. Rewind. Take 2 (A): phone off, tag at the car door, (wait. I'm Miles.), (finally. Anya.), MILES / ANYA tags
// on one handle. Epilogue: horn, (coffee? you're buying.), tiny wave, buzz ignored, walks off with his bag. End card, no vote.

export const BAG6_FPS = 60;
export const BAG6_FRAMES = Math.round(spec.duration * BAG6_FPS);
export type Hook = 'a' | 'b';
const B = spec.beats;
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
type ShotId = 'H' | 'CTX' | 'K1' | 'BL' | 'K2' | 'T6' | 'K3' | 'T7' | 'N' | 'E1' | 'T8' | 'E2' | 'end';
const SHOTS: [number, ShotId][] = [[0, 'H'], [B.insert, 'CTX'], [B.take1, 'K1'], [B.blank, 'BL'], [RW1, 'H'], [B.k2, 'K2'], [B.t6, 'T6'], [B.k3, 'K3'], [B.t7, 'T7'],
  [B.names, 'N'], [B.e1, 'E1'], [B.t8, 'T8'], [B.e2, 'E2'], [B.endcard, 'end']];
const shotAt = (t: number): ShotId => keyAt(SHOTS, t);
const shotStart = (t: number) => { let s = 0; for (const [a] of SHOTS) if (t >= a) s = a; return s; };

const blinkAt = (t: number, seed: number) => { const ph = (t + seed) % 3.7; return ph < 0.14 ? Math.sin((ph / 0.14) * Math.PI) : 0; };
const base = (t: number, seed: number, o: Partial<Pose>): Pose => ({look: [0.5, 0.2], brow: 0.1, worry: 0, mouth: 'flat' as Mouth, happy: false, sweat: 0, gulp: 0,
  tilt: Math.sin(t * 0.9 + seed) * 1.1, bob: 0, blink: blinkAt(t, seed), sway: 1, flush: 0, ...o});
const himP = (t: number, o: Partial<Pose> = {}) => base(t, 0.4, o);
const herP = (t: number, o: Partial<Pose> = {}) => base(t, 1.9, {tilt: Math.sin(t * 0.8 + 2) * 1.2, ...o});

// ------------------------------------------------------------------------------------------ arms
const Arm: React.FC<{who: 'him' | 'her'; sh: [number, number]; el: [number, number]; x: number; y: number; rot?: number; style?: 'fist' | 'open' | 'point'; scale?: number; opacity?: number}> = ({who, sh, el, x, y, rot = 0, style = 'fist', scale = 1, opacity = 1}) => (
  <g opacity={opacity}>
    <line x1={sh[0]} y1={sh[1]} x2={el[0]} y2={el[1]} stroke={C.ink} strokeOpacity={0.12} strokeWidth={96 * scale} strokeLinecap="round" transform="translate(10 14)" />
    <line x1={sh[0]} y1={sh[1]} x2={el[0]} y2={el[1]} stroke={who === 'him' ? C.olive : C.camel} strokeWidth={94 * scale} strokeLinecap="round" />
    <Hand who={who} x={x} y={y} rot={rot} base={el} style={style} scale={scale} />
  </g>
);

// ------------------------------------------------------------------------------------------ opener (hall) poses
const HIM_LOOK_A: KF[] = [[0, -0.6, 0.8], [0.45, -0.6, 0.8], [0.62, 0.9, 0.2], [1.05, 0.9, 0.2], [1.2, -0.6, 0.8], [2.3, -0.6, 0.8], [2.5, 0.9, 0.3]];
const HIM_LOOK_B: KF[] = [[0, -0.6, 0.8], [0.62, -0.6, 0.8], [0.8, 0.9, 0.2], [2.9, 0.9, 0.3]];
const HER_LOOK_A: KF[] = [[0, -0.5, 0.2], [0.3, -0.8, 0.1], [1.7, -0.8, 0.1], [2.0, -0.6, 0.3], [3.0, -0.7, 0.2]];
const HER_LOOK_B: KF[] = [[0, -0.5, 0.2], [0.55, -0.6, 0.2], [0.7, -0.95, 0.5], [2.0, -0.95, 0.4], [2.4, -0.5, 0.2], [3.0, -0.5, 0.2]];
const HIM_MOUTH_A: [number, Mouth][] = [[0, 'flat'], [1.2, 'gulp'], [2.5, 'soft']];
const HIM_MOUTH_B: [number, Mouth][] = [[0, 'flat'], [0.8, 'o'], [1.8, 'gulp'], [2.6, 'soft']];

const himHall = (t: number, hook: Hook): Pose => {
  if (t < B.hookEnd) {
    const [lx, ly] = kf(hook === 'b' ? HIM_LOOK_B : HIM_LOOK_A, t);
    const flinch = hook === 'b' ? Math.sin(wp(t, 0.62, 1.0) * Math.PI) * (1 - smooth(t, 1.0, 1.1)) : 0;
    const flush = hook === 'b' ? smooth(t, 0.9, 1.4) : 0;
    const jolt = hook === 'a' ? Math.sin(wp(t, 0.95, 1.35) * Math.PI) : 0;
    return himP(t, {look: [lx, ly], mouth: keyAt(hook === 'b' ? HIM_MOUTH_B : HIM_MOUTH_A, t), brow: 0.1 + flinch * 0.7 + jolt * 0.8, worry: flinch * 0.6, sweat: flinch * 0.4, tilt: Math.sin(t * 0.9) * 1.1 - flinch * 8 + jolt * 7, bob: -jolt * 14, flush});
  }
  // take 2: phone off, pocketed, he glances at her
  const [lx, ly] = kf([[11.75, -0.6, 0.8], [12.8, -0.6, 0.8], [13.0, 0.9, 0.2]], t);
  return himP(t, {look: [lx, ly], mouth: t < 12.3 ? 'flat' : t < 13.0 ? 'soft' : 'smile', brow: 0.1 + (t >= 12.2 && t < 12.5 ? 0.5 : 0), flush: 0.3});
};
const herHall = (t: number, hook: Hook): Pose => {
  if (t < B.hookEnd) {
    const [lx, ly] = kf(hook === 'b' ? HER_LOOK_B : HER_LOOK_A, t);
    const catchK = hook === 'b' ? smooth(t, 0.62, 0.8) * (1 - smooth(t, 1.5, 2.0)) : 0;
    const catchTilt = hook === 'b' ? -7 * smooth(t, 0.62, 0.85) * (1 - smooth(t, 2.0, 2.5)) : 0;
    let mouth: Mouth = 'flat';
    if (hook === 'b' && t >= 0.7 && t < 2.4) mouth = t < 1.6 ? 'o' : 'smirk';
    if (hook === 'a' && t >= 1.0) mouth = 'soft';
    return herP(t, {look: [lx, ly], brow: 0.1 + catchK * 0.9, browR: 0.1 + catchK * 0.9, mouth, tilt: catchTilt + Math.sin(t * 0.8 + 2) * 1.2});
  }
  const [lx, ly] = kf([[11.75, -0.8, 0.1], [12.4, -0.8, 0.1], [12.6, -0.95, 0.5]], t);
  return herP(t, {look: [lx, ly], mouth: t < 12.6 ? 'flat' : 'smile', happy: t >= 12.9});
};

// ------------------------------------------------------------------------------------------ cars
/** Side view, faces left. head = her head in the rear window; driver = older man at the wheel (face detail when `big`). */
const CarSide: React.FC<{x: number; y: number; s: number; id: string; head?: boolean; driver?: boolean; big?: boolean; hop?: number; tail?: number}> = ({x, y, s, id, head = false, driver = true, big = false, hop = 0, tail = 0}) => (
  <g transform={`translate(${x} ${y - hop}) scale(${s})`}>
    <defs>
      <clipPath id={`${id}rw`}><path d="M 64 -22 L 64 -96 L 118 -96 L 168 -22 Z" /></clipPath>
      <clipPath id={`${id}fw`}><path d="M -84 -22 L -56 -112 L 44 -112 L 44 -22 Z" /></clipPath>
    </defs>
    <ellipse cx={0} cy={118} rx={270} ry={20} fill={C.ink} opacity={0.3} />
    <path d="M -260 90 L -260 20 Q -258 0 -230 -6 L -150 -20 L -96 -100 Q -86 -116 -62 -116 L 120 -116 Q 150 -116 166 -96 L 216 -20 L 246 -10 Q 266 -4 266 20 L 266 90 Z" fill="#2F7F86" stroke={C.carbon} strokeWidth={8} strokeLinejoin="round" />
    <path d="M -80 -22 L -52 -96 L 40 -96 L 40 -22 Z M 64 -22 L 64 -96 L 118 -96 L 168 -22 Z" fill="#CFE9F6" stroke={C.carbon} strokeWidth={6} strokeLinejoin="round" />
    {driver && <g clipPath={`url(#${id}fw)`}>
      <circle cx={-8} cy={-58} r={big ? 31 : 28} fill="#D9A27C" />
      <path d="M -38 -66 Q -40 -48 -30 -36 L -34 -64 Z M 22 -66 Q 24 -48 14 -36 L 18 -64 Z" fill="#CFCFCF" />
      <path d="M -40 -70 Q -10 -112 24 -72 L 26 -66 Q -8 -78 -40 -64 Z" fill="#7A6A58" stroke={C.carbon} strokeWidth={3} strokeLinejoin="round" />
      {big && <g>
        <ellipse cx={-20} cy={-62} rx={7} ry={6} fill="#fff" stroke={C.ink} strokeWidth={2} /><ellipse cx={5} cy={-62} rx={7} ry={6} fill="#fff" stroke={C.ink} strokeWidth={2} />
        <circle cx={-19} cy={-61} r={3} fill={C.ink} /><circle cx={6} cy={-61} r={3} fill={C.ink} />
        <path d="M -29 -70 L -12 -68 M 14 -70 L -3 -68" stroke="#9A9A9A" strokeWidth={3.4} strokeLinecap="round" fill="none" />
        <path d="M -26 -44 Q -8 -52 12 -44 Q -2 -38 -8 -40 Q -14 -38 -26 -44 Z" fill="#B8B8B8" />
      </g>}
      {!big && <g><circle cx={-18} cy={-60} r={2.6} fill={C.ink} /><circle cx={3} cy={-60} r={2.6} fill={C.ink} /><path d="M -22 -44 Q -8 -50 8 -44" stroke="#AAA" strokeWidth={5} fill="none" /></g>}
    </g>}
    {head && <g clipPath={`url(#${id}rw)`}>
      <circle cx={96} cy={-56} r={26} fill="#4A2A1C" /><circle cx={96} cy={-54} r={19} fill={C.skinHer} />
      <circle cx={89} cy={-56} r={8} fill="none" stroke={C.carbon} strokeWidth={2.5} /><circle cx={103} cy={-56} r={8} fill="none" stroke={C.carbon} strokeWidth={2.5} />
    </g>}
    <rect x={-262} y={26} width={40} height={26} rx={10} fill="#FFF3B0" stroke={C.carbon} strokeWidth={5} />
    <rect x={236} y={22} width={28} height={26} rx={8} fill={tail > 0 ? '#FF6A5A' : '#E5483B'} stroke={C.carbon} strokeWidth={5} />
    <circle cx={-150} cy={92} r={46} fill={C.carbon} /><circle cx={-150} cy={92} r={20} fill="#B9BFC8" />
    <circle cx={150} cy={92} r={46} fill={C.carbon} /><circle cx={150} cy={92} r={20} fill="#B9BFC8" />
  </g>
);

const SkyBg: React.FC<{x0: number; x1: number; y0: number; y1: number; id: string}> = ({x0, x1, y0, y1, id}) => {
  const w = x1 - x0;
  return <g>
    <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8EC9FF" /><stop offset="1" stopColor="#DCEEFF" /></linearGradient></defs>
    <rect x={x0} y={y0} width={w} height={y1 - y0} fill={`url(#${id})`} />
  </g>;
};

// ------------------------------------------------------------------------------------------ board + window + plate (opener)
const CarIcon: React.FC<{x: number}> = ({x}) => <g transform={`translate(${x} 4)`}>
  <path d="M -46 18 L -46 -2 Q -46 -10 -36 -12 L -26 -30 Q -22 -36 -14 -36 L 18 -36 Q 26 -36 30 -30 L 40 -12 Q 48 -10 48 -2 L 48 18 Z" fill={C.amber} stroke="#000" strokeWidth={3} />
  <path d="M -22 -12 L -14 -28 L 0 -28 L 0 -12 Z M 8 -12 L 8 -28 L 18 -28 L 30 -12 Z" fill="#2A2A2F" />
  <circle cx={-26} cy={20} r={11} fill="#111" stroke="#fff" strokeWidth={3} /><circle cx={28} cy={20} r={11} fill="#111" stroke="#fff" strokeWidth={3} />
</g>;
const Board6: React.FC<{y: number; t: number}> = ({y, t}) => {
  const glow = 0.5 + 0.5 * Math.sin(t * 5);
  const cell = (x: number, w: number, txt: string, col: string, car = false) => <g transform={`translate(${x} ${y})`}>
    <rect x={-w / 2} y={-44} width={w} height={88} rx={10} fill="#2A2A2F" stroke="#000" strokeWidth={3} />
    {car && <CarIcon x={-w / 2 + 72} />}
    <text x={car ? 52 : 0} y={22} textAnchor="middle" fontFamily={BARLOW} fontWeight={700} fontSize={66} letterSpacing={3} fill={col}>{txt}</text>
    <line x1={-w / 2} x2={w / 2} y1={0} y2={0} stroke="#000" strokeWidth={3} opacity={0.5} />
  </g>;
  return <g>
    <ellipse cx={540} cy={y} rx={470} ry={110} fill={C.hiVis} opacity={0.18 + 0.1 * glow} filter="url(#blurSoft)" />
    <rect x={150} y={y - 66} width={780} height={132} rx={20} fill={C.carbon} />
    <rect x={150} y={y - 66} width={780} height={12} rx={6} fill="#4A4A52" />
    {cell(330, 280, 'RIDE', C.amber, true)}{cell(690, 440, 'ARRIVED', C.hiVis)}
    <rect x={250} y={y - 110} width={10} height={44} fill={C.carbon} /><rect x={820} y={y - 110} width={10} height={44} fill={C.carbon} />
  </g>;
};
const PickWindow: React.FC<{t: number}> = ({t}) => {
  const k = smooth(t, 0.15, 1.0);
  const cx = lerp(800, 555, k);
  const brake = t > 0.95 && t < 3.0 ? 1 : 0;
  const flash = t > 0.9 && t < 2.2 && Math.sin((t - 0.9) * 22) > 0 ? 1 : 0;
  return <g>
    <rect x={382} y={662} width={316} height={296} rx={14} fill={C.carbon} />
    <defs><clipPath id="pkw"><rect x={392} y={672} width={296} height={276} rx={8} /></clipPath></defs>
    <g clipPath="url(#pkw)">
      <SkyBg x0={392} x1={688} y0={672} y1={948} id="pkSky" />
      <rect x={400} y={780} width={50} height={110} fill="#B6C7D6" /><rect x={460} y={820} width={44} height={70} fill="#C3D2DF" />
      <rect x={392} y={880} width={296} height={22} fill="url(#hazard)" />
      <rect x={392} y={902} width={296} height={50} fill="#2C2C32" />
      <rect x={414} y={706} width={160} height={44} rx={8} fill={C.hiVis} stroke={C.carbon} strokeWidth={5} />
      <text x={494} y={739} textAnchor="middle" fontFamily={JOST} fontWeight={800} fontSize={32} letterSpacing={1} fill={C.carbon}>PICK-UP</text>
      {flash > 0 && <g><circle cx={cx - 130} cy={871} r={46} fill="#FFF3B0" opacity={0.85} /><circle cx={cx + 135} cy={845} r={30} fill="#FF6A5A" opacity={0.8} /></g>}
      <CarSide x={cx} y={852} s={0.5} id="pk" driver tail={brake ? 1 : 0} hop={brake && Math.sin(t * 8) > 0.8 ? 1 : 0} />
    </g>
    <rect x={382} y={662} width={316} height={296} rx={14} fill="none" stroke={C.carbon} strokeWidth={10} />
    <path d="M 430 672 L 480 672 L 410 800 L 390 800 Z" fill="#fff" opacity={0.3} />
  </g>;
};
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
const Bench: React.FC = () => <g>
  <rect x={50} y={1236} width={1000} height={70} rx={14} fill={C.ink} opacity={0.2} />
  <rect x={40} y={1180} width={1000} height={50} rx={14} fill="#A9AFB8" stroke={C.carbon} strokeWidth={5} />
  <rect x={40} y={1222} width={1000} height={70} rx={14} fill={C.suitcaseDeep} stroke={C.carbon} strokeWidth={5} />
  <rect x={44} y={1222} width={992} height={12} fill={C.hiVis} opacity={0.9} />
  {[160, 330, 500, 670, 840].map((x) => <line key={x} x1={x} x2={x} y1={1190} y2={1224} stroke={C.carbon} strokeWidth={3} opacity={0.3} />)}
</g>;

const swipeOf = (ticks: number[], t: number) => {
  let idx = -1;
  for (let i = 0; i < ticks.length; i++) if (ticks[i] <= t) idx = i;
  if (idx < 0) return {p: 0, dir: 1};
  return {p: clamp((t - ticks[idx]) / 0.26), dir: idx % 2 ? -1 : 1};
};
const HIM_TICKS = [-0.1, ...spec.audio.swipeTicks];

const FLOOR_Y = 1592;
const HIS_BAG = {x: 150, y: FLOOR_Y}, HERS_BAG = {x: 640, y: FLOOR_Y};
const HALL_HIM = {x: 235, y: 830, s: 0.88}, HALL_HER = {x: 845, y: 830, s: 0.88};

const Hall: React.FC<{t: number; hook: Hook}> = ({t, hook}) => {
  const h2 = t >= RW1;
  const lt = t - shotStart(t);
  const cam: Cam = {x: 540 + Math.sin(t * 0.7) * 4 + lt * 2, y: 960 + Math.sin(t * 1.0) * 3, z: 1 + 0.012 * Math.min(1, lt / 2.5)};
  const him = himHall(t, hook), her = herHall(t, hook);
  const hs = swipeOf(HIM_TICKS, t);
  const out = h2 ? smooth(t, 13.05, 13.5) : 0;
  const herX = HALL_HER.x + 520 * out;
  const mid: React.ReactNode[] = [];
  if (!h2 || t < 13.5) {
    const mv = h2 ? smooth(t, 12.9, 13.4) : hook === 'b' ? smooth(t, 1.7, 2.2) : smooth(t, 2.4, 2.9);
    const px = 200, py = 1125 + 440 * mv, pr = -6 + 8 * mv;
    const off = h2 && t >= B.power;
    const swiping = h2 ? t < B.power - 0.15 : mv < 0.02 && t < 2.4;
    mid.push(<Phone key="ph" who="him" x={px} y={py} rot={pr} scale={1.3} p={swiping ? hs.p : 0} dir={hs.dir} thumb={swiping ? 1 : 0} lit={off ? 0 : 1} base={[250, 2150]} />);
    if (off) {
      const a = smooth(t, B.power, B.power + 0.12);
      mid.push(<g key="pw" transform={`translate(${px} ${py}) scale(1.3) rotate(${pr})`} opacity={a}>
        <circle r={46} fill="none" stroke="#E6EEF8" strokeWidth={11} strokeDasharray="205 84" strokeLinecap="round" transform="rotate(-62)" />
        <line x1={0} y1={-62} x2={0} y2={-10} stroke="#E6EEF8" strokeWidth={11} strokeLinecap="round" />
      </g>);
    }
    if (h2 && t >= B.power - 0.1 && t < B.power + 0.35) mid.push(<g key="clk" transform={`translate(${px} ${py}) scale(1.3) rotate(${pr})`} stroke={C.amber} strokeWidth={8} strokeLinecap="round">
      <line x1={112} y1={-70} x2={142} y2={-84} /><line x1={116} y1={-46} x2={152} y2={-46} /><line x1={112} y1={-22} x2={142} y2={-8} />
    </g>);
  }
  return <g>
    <g transform={planeT(cam, 0.2)}><HallWall /></g>
    <g transform={planeT(cam, 0.45)}><FarBelt t={t} pos={-t * 40} empty keyBag={null} /></g>
    <g transform={planeT(cam, 0.25)}>
      <Board6 y={585} t={t} />
      <PickWindow t={h2 ? 5 : t} />
    </g>
    <g transform={planeT(cam, 0.9)}>
      <Person who="him" x={HALL_HIM.x} y={HALL_HIM.y} s={HALL_HIM.s} t={t} pose={him} seed={0.4} />
      <Person who="her" x={herX} y={HALL_HER.y} s={HALL_HER.s} t={t} pose={her} seed={1.9} />
      {hook === 'b' && t >= 0.6 && t < 2.0 && <Exclaim x={1000} y={655} k={wp(t, 0.62, 1.0)} />}
      <Bench />
      {mid}
    </g>
    <g transform={planeT(cam, 1.0)}>
      <NearBelt pos={t * 40} />
      <Floor />
      <g transform="translate(905 1425)">
        <rect x={-130} y={-46} width={260} height={92} rx={12} fill={C.carbon} stroke="#000" strokeWidth={4} />
        <rect x={-130} y={-46} width={260} height={14} rx={7} fill={C.amber} />
        <text x={0} y={26} textAnchor="middle" fontFamily={BARLOW} fontWeight={700} fontSize={70} letterSpacing={4} fill="#fff">BELT 4</text>
      </g>
      <Bag x={HIS_BAG.x} y={HIS_BAG.y} loop={false} tag ribbon={1} ribbonColor={C.amber} pouch />
      <Bag x={HERS_BAG.x + 520 * out} y={HERS_BAG.y - (hook === 'a' && t < 3 ? Math.sin(wp(t, 1.0, 1.5) * Math.PI) * 26 : 0)} loop tag={false} rot={hook === 'a' && t < 3 ? Math.sin(wp(t, 1.0, 1.5) * Math.PI) * -4 : 0} />
    </g>
    <g transform={planeT(cam, 1.3)}><NearRail t={t} /></g>
  </g>;
};

// ------------------------------------------------------------------------------------------ whole-frame tag inserts
type InsLine = [string, number, number];
type Ins = {t0: number; t1: number; who: 'him' | 'her'; lines: InsLine[]; H: number; size: number; slideIn?: boolean};
const INS: Record<string, Ins> = {
  T6: {t0: B.t6, t1: B.k3, who: 'him', lines: [['(wait.', 15.1, 15.5], ["I'm Miles.)", 15.5, 15.9]], H: 540, size: 170},
  T7: {t0: B.t7, t1: B.names, who: 'her', lines: [['(finally.', 18.7, 19.1], ['Anya.)', 19.1, 19.5]], H: 540, size: 170},
  T8: {t0: B.t8, t1: B.e2, who: 'her', lines: [['(coffee?', 0, 0.01], ["you're buying.)", 0, 0.01]], H: 540, size: 170, slideIn: true},
};
const INSERT_BG = (t: number) => <g>
  <g filter="url(#blurSoft)"><HallWall /><NearBelt pos={t * 120} /><Floor /></g>
  <rect x={-100} y={-100} width={1300} height={2200} fill={C.concrete} opacity={0.72} />
</g>;

const TagInsert: React.FC<{t: number; id: keyof typeof INS}> = ({t, id}) => {
  const c = INS[id];
  const age = t - c.t0;
  const pop = c.slideIn ? 1 : 0.92 + 0.08 * (1 - Math.pow(1 - clamp(age / 0.2), 3));
  const W = 920;
  const lines: TagLine[] = c.lines.map(([txt, a, b]) => ({txt, p: c.slideIn ? 1 : wp(t, a, b)}));
  const g = tagGeom(W, c.H, lines.length, lines.map((l) => l.txt), c.size);
  let li = 0;
  c.lines.forEach(([, a], i) => { if (t >= a - 0.02) li = i; });
  let pen: React.ReactNode = null;
  if (!c.slideIn) {
    const w0 = c.lines[0][1] - 0.25, w1 = c.lines[c.lines.length - 1][2] + 0.35;
    const px = g.x0 + g.widths[li] * lines[li].p, py = g.ys[li] + 4 + Math.sin(t * 40) * 3;
    const approach = 1 - smooth(t, w0, w0 + 0.25), leave = smooth(t, w1 - 0.35, w1);
    const off = Math.max(approach, leave) * 400;
    const tx = px + off, ty = py + off * 0.8;
    if (t >= w0 && t < w1) pen = <g>
      <Pen x={tx} y={ty} rot={50} />
      <Arm who={c.who} sh={[tx + 600, ty + 560]} el={[tx + 400, ty + 130]} x={tx + 140} y={ty - 120} rot={20} scale={1.0} />
    </g>;
  }
  const sl = c.slideIn ? smooth(age, 0, 0.4) : 1;
  const sx = c.slideIn ? 1300 * (1 - sl) * (1 - sl) : 0;
  const armA = c.slideIn ? 1 - smooth(age, 0.45, 0.75) : 0;
  return <g>
    {INSERT_BG(t)}
    <g transform={`translate(${540 + sx} 780) rotate(-2) scale(${pop})`}>
      <KraftTag w={W} h={c.H} lines={lines} size={c.size} id={`ti${id}`} string={false} />
      {pen}
      {c.slideIn && armA > 0 && <g opacity={armA} transform={`translate(${(1 - sl) * 0} 0)`}>
        <Arm who="her" sh={[W / 2 + 900, 700]} el={[W / 2 + 420, 330]} x={W / 2 + 120} y={60} rot={-70} style="open" scale={1.0} />
      </g>}
    </g>
  </g>;
};

/** 3-5.9: why he is here (drooping flowers), then the two earlier tags, labelled her / me. */
const CTX: {txt: string; who: 'him' | 'her'; label: string; y: number; rot: number; d: number}[] = [
  {txt: '(rough trip?)', who: 'her', label: 'her', y: 780, rot: -2, d: 0.0},
  {txt: '(it flopped.)', who: 'him', label: 'me', y: 1100, rot: 2, d: 0.35},
];
const ContextInsert: React.FC<{t: number}> = ({t}) => {
  const age = t - B.insert;
  const fl = 1 - smooth(age, 1.25, 1.45);
  return <g>
    {INSERT_BG(t)}
    {fl > 0 && <g opacity={fl} transform={`translate(0 ${smooth(age, 1.25, 1.45) * 60})`}>
      <Flowers droop={smooth(age, 0.35, 0.95)} t={t} fall={age > 0.9 ? age - 0.9 : -1} scale={2.7} x={540} y={1330} />
    </g>}
    {CTX.map((c, i) => {
      const k = clamp((age - 1.4 - c.d) / 0.3);
      const sp = k <= 0 ? 0 : 1 + Math.sin(k * Math.PI * 1.5) * Math.exp(-k * 4.2) * 0.25 - Math.exp(-k * 9) * (1 - k);
      return <g key={i}>
        <KraftTag w={900} h={290} lines={[{txt: c.txt, p: 1}]} size={150} x={600} y={c.y} rot={c.rot} scale={Math.max(0.01, sp)} id={`ctx${i}`} string stringColor={c.who === 'her' ? C.hiVis : C.amber} />
        <g opacity={sp > 0.9 ? 1 : 0}><text x={170} y={c.y - 168} fontFamily={CAVEAT} fontWeight={700} fontSize={100} fill={C.carbon} stroke="#fff" strokeWidth={14} strokeLinejoin="round" paintOrder="stroke">{c.label}</text></g>
      </g>;
    })}
  </g>;
};

/** Take 1 end: a big blank tag hangs from his hand, NAME: ____ printed on it. No pen. */
const BlankTag: React.FC<{t: number}> = ({t}) => {
  const age = t - B.blank;
  const pop = 0.92 + 0.08 * (1 - Math.pow(1 - clamp(age / 0.2), 3));
  const sw = Math.sin(t * 2.6) * 2.2 * Math.exp(-age * 0.5);
  return <g>
    {INSERT_BG(t)}
    <g transform={`translate(560 930) rotate(${-3 + sw}) scale(${pop})`}>
      <KraftTag w={900} h={460} lines={[{txt: '', p: 0}]} size={150} id="blank" string={false} />
      <text x={-300} y={36} fontFamily={BARLOW} fontWeight={700} fontSize={130} letterSpacing={4} fill={C.carbon}>NAME: ______</text>
      <path d="M -388 0 Q -430 -120 -400 -250" fill="none" stroke={C.carbon} strokeWidth={9} strokeLinecap="round" />
      <Arm who="him" sh={[-640, -520]} el={[-520, -330]} x={-398} y={-290} rot={0} style="fist" scale={1.0} />
    </g>
  </g>;
};

// ------------------------------------------------------------------------------------------ MILES / ANYA on one handle (payoff)
const TagP: React.FC<{x: number; y: number; rot: number; txt: string; p: number; stringCol: string; id: string}> = ({x, y, rot, txt, p, stringCol, id}) => {
  const w = 470, h = 460, cut = 90;
  const d = `M ${-w / 2 + cut} ${-h / 2} L ${w / 2 - cut} ${-h / 2} L ${w / 2} ${-h / 2 + cut} L ${w / 2} ${h / 2 - 18} Q ${w / 2} ${h / 2} ${w / 2 - 18} ${h / 2} L ${-w / 2 + 18} ${h / 2} Q ${-w / 2} ${h / 2} ${-w / 2} ${h / 2 - 18} L ${-w / 2} ${-h / 2 + cut} Z`;
  return <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    <path d={d} transform="translate(22 28)" fill={C.carbon} opacity={0.22} /><path d={d} transform="translate(11 14)" fill={C.ink} opacity={0.14} />
    <path d={d} fill={C.kraft} stroke={C.kraftDeep} strokeWidth={8} strokeLinejoin="round" />
    <path d={d} fill="#F0D4A8" opacity={0.35} transform="scale(0.94 0.92) translate(0 6)" />
    <circle cx={0} cy={-h / 2 + 62} r={32} fill="#F1DDB8" stroke={C.kraftDeep} strokeWidth={5} /><circle cx={0} cy={-h / 2 + 62} r={18} fill={C.concrete} stroke={C.kraftDeep} strokeWidth={4} />
    <path d={`M 0 ${-h / 2 + 62} Q -10 ${-h / 2 - 20} 0 ${-h / 2 - 110}`} fill="none" stroke={C.carbon} strokeWidth={15} strokeLinecap="round" />
    <path d={`M 0 ${-h / 2 + 62} Q -10 ${-h / 2 - 20} 0 ${-h / 2 - 110}`} fill="none" stroke={stringCol} strokeWidth={8} strokeLinecap="round" />
    <defs><clipPath id={`${id}c`}><rect x={-w / 2} y={-80} width={w * clamp(p)} height={260} /></clipPath></defs>
    <text x={0} y={70} textAnchor="middle" fontFamily={CAVEAT} fontWeight={700} fontSize={150} fill={C.ink} clipPath={`url(#${id}c)`}>{txt}</text>
    <line x1={-w / 2 + 50} x2={w / 2 - 50} y1={150} y2={150} stroke={C.kraftDeep} strokeWidth={3} strokeDasharray="14 10" opacity={0.5} />
    <line x1={-w / 2 + 50} x2={w / 2 - 50} y1={-110} y2={-110} stroke={C.kraftDeep} strokeWidth={3} strokeDasharray="14 10" opacity={0.5} />
  </g>;
};
const NamesInsert: React.FC<{t: number}> = ({t}) => {
  const age = t - B.names;
  const drop = (d: number) => { const k = clamp((age - d) / 0.45); return k <= 0 ? 0 : 1 + Math.sin(k * Math.PI * 1.5) * Math.exp(-k * 4) * 0.25 - Math.exp(-k * 8) * (1 - k); };
  const swing = (d: number, ph: number) => Math.sin(Math.max(0, age - d) * 7 + ph) * 7 * Math.exp(-Math.max(0, age - d) * 1.6);
  const hands = 1 - smooth(age, 0.9, 1.3);
  const HY = 585;
  return <g>
    {INSERT_BG(t)}
    {/* the one handle with both loops: chartreuse strap (hers) and the amber bow (his) */}
    <rect x={-40} y={HY + 40} width={1160} height={120} rx={30} fill={C.suitcase} stroke={C.carbon} strokeWidth={6} opacity={drop(0) > 0 ? 1 : 0} />
    <path d={`M 60 ${HY + 60} L 60 ${HY - 40} Q 60 ${HY - 100} 120 ${HY - 100} L 960 ${HY - 100} Q 1020 ${HY - 100} 1020 ${HY - 40} L 1020 ${HY + 60}`} fill="none" stroke={C.carbon} strokeWidth={34} strokeLinecap="round" strokeLinejoin="round" />
    <path d={`M 150 ${HY - 130} Q 205 ${HY - 120} 192 ${HY - 80} L 192 ${HY + 20} L 160 ${HY + 20} L 170 ${HY - 80} Q 172 ${HY - 100} 150 ${HY - 100} Z`} fill={C.hiVis} stroke={C.carbon} strokeWidth={6} strokeLinejoin="round" transform="translate(40 0) scale(1.4) translate(-80 -90)" />
    <g transform={`translate(860 ${HY - 100}) scale(2)`}>
      <path d="M 0 4 L -18 70 L -2 62 L 6 74 L 12 8 Z" fill={C.amber} stroke={C.carbon} strokeWidth={4} strokeLinejoin="round" />
      <path d="M 0 0 Q -44 -36 -50 2 Q -44 30 0 0 Z" fill={C.amber} stroke={C.carbon} strokeWidth={4} strokeLinejoin="round" />
      <path d="M 0 0 Q 44 -36 50 2 Q 44 30 0 0 Z" fill={C.amber} stroke={C.carbon} strokeWidth={4} strokeLinejoin="round" />
      <circle r={9} fill={C.amber} stroke={C.carbon} strokeWidth={4} />
    </g>
    <g transform={`translate(300 ${HY + 160}) scale(${drop(0.05)}) translate(-300 ${-(HY + 160)})`}>
      <g transform={`rotate(${swing(0.05, 0)} 300 ${HY + 160})`}><TagP x={300} y={HY + 160 + 270} rot={0} txt="MILES" p={1} stringCol={C.amber} id="tm" /></g>
    </g>
    <g transform={`translate(780 ${HY + 160}) scale(${drop(0.3)}) translate(-780 ${-(HY + 160)})`}>
      <g transform={`rotate(${swing(0.3, 1.5)} 780 ${HY + 160})`}><TagP x={780} y={HY + 160 + 270} rot={0} txt="ANYA" p={1} stringCol={C.hiVis} id="ta" /></g>
    </g>
    {hands > 0 && <g opacity={hands}>
      <Arm who="him" sh={[-300, 1000]} el={[-30 + 60 * (1 - hands), 800]} x={80 + 60 * (1 - hands)} y={HY + 150} rot={80} style="open" scale={1.0} />
      <Arm who="her" sh={[1380, 1000]} el={[1110 - 60 * (1 - hands), 800]} x={1000 - 60 * (1 - hands)} y={HY + 150} rot={-80} style="open" scale={1.0} />
    </g>}
  </g>;
};

// ------------------------------------------------------------------------------------------ kerb (glass doors onto the pick-up lane)
const OP = {x0: 190, x1: 890, y0: 540, y1: 1530};
const CAR_X = 745, CAR_Y = 1140, CAR_S = 0.52;
const GROUND = 1290;
const him0 = {x: 340, y: 1000, s: 0.66};

const HeldTag: React.FC<{x: number; y: number; rot: number; scribble?: boolean; scale?: number}> = ({x, y, rot, scribble = false, scale = 2.4}) => <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale})`}>
  <path d="M 0 -50 L 0 0" stroke={C.carbon} strokeWidth={2.5} />
  <rect x={-26} y={0} width={52} height={74} rx={7} fill={C.kraft} stroke={C.kraftDeep} strokeWidth={3} />
  <circle cx={0} cy={11} r={5} fill={C.concrete} stroke={C.kraftDeep} strokeWidth={2} />
  {scribble && [32, 46, 60].map((yy, i) => <path key={yy} d={`M -17 ${yy} q 6 -7 11 0 t 11 0 t ${10 - i * 4} 0`} fill="none" stroke={C.ink} strokeWidth={2.6} strokeLinecap="round" />)}
</g>;

const cutId = 'cutFloor';

const Kerb: React.FC<{t: number; id: 'K1' | 'K2' | 'K3' | 'E2'}> = ({t, id}) => {
  const lt = t - shotStart(t);
  const wob = Math.sin(t * 0.7) * 4;
  // ---- doors
  let open = 1;
  if (id === 'K1') open = smooth(t, B.doorsOpen, B.doorsOpen + 0.6) * (1 - smooth(t, 8.7, 9.3));
  const gap = 170;
  const lx = OP.x0 - open * gap, rx = 540 + open * gap;
  const panelW = 350;
  const pane = (x: number, key: string) => <g key={key}>
    <rect x={x} y={OP.y0} width={panelW} height={OP.y1 - OP.y0} fill="#EAF4FB" opacity={0.22} />
    <rect x={x} y={OP.y0} width={panelW} height={OP.y1 - OP.y0} fill="none" stroke={C.carbon} strokeWidth={10} />
    <path d={`M ${x + 60} ${OP.y0} L ${x + 150} ${OP.y0} L ${x + 20} ${OP.y0 + 420} L ${x - 20} ${OP.y0 + 420} Z`} fill="#fff" opacity={0.45} />
    <path d={`M ${x + 190} ${OP.y0} L ${x + 230} ${OP.y0} L ${x + 100} ${OP.y0 + 420} L ${x + 80} ${OP.y0 + 420} Z`} fill="#fff" opacity={0.3} />
    <rect x={x + (key === 'l' ? panelW - 34 : 20)} y={900} width={14} height={260} rx={7} fill={C.carbon} />
  </g>;

  // ---- car
  let carX = CAR_X, hop = 0, headIn = false, tail = 0;
  if (id === 'K1') {
    headIn = t >= B.inCar;
    carX = CAR_X - 1500 * Math.pow(clamp((t - B.carGo1) / 1.1), 2);
    tail = t >= B.inCar && t < B.carGo1 + 0.3 ? 1 : 0;
  }
  if (id === 'E2') {
    headIn = t >= 27.65;
    carX = CAR_X - 1500 * Math.pow(clamp((t - 28.0) / 1.1), 2);
    tail = t >= 27.65 && t < 28.3 ? 1 : 0;
    hop = [27.7].some((h) => t >= h && t < h + 0.1) ? 8 : 0;
  }

  // ---- her
  let herN: React.ReactNode = null, herBefore = false;
  const herBag = (x: number, y: number, s: number) => <Bag x={x} y={y} loop tag={false} scale={s} />;
  if (id === 'K1' || id === 'E2') {
    const t0 = id === 'K1' ? B.walk0 : 26.7, t1 = id === 'K1' ? 7.7 : 27.6;
    const wk = smooth(t, t0, t1);
    const s = lerp(0.62, 0.32, wk), x = lerp(600, 700, wk), gnd = lerp(1580, GROUND + 8, wk), y = gnd - 900 * s;
    const vis = id === 'K1' ? 1 - smooth(t, 7.75, 7.9) : 1 - smooth(t, 27.6, 27.75);
    const walking = wk > 0 && wk < 1;
    const look: [number, number] = id === 'K1' ? (t < 5.95 ? [-0.9, 0.2] : [0.9, 0.1]) : (t < 26.7 ? [-0.9, 0.2] : [0.9, 0.1]);
    const pose = herP(t, {look, mouth: 'smile', happy: false, bob: walking ? -Math.abs(Math.sin(t * 9)) * 8 : 0});
    const bagY = gnd - 191 * 0.99 * s;
    if (vis > 0) herN = <g opacity={vis}>
      <g clipPath={`url(#${cutId})`}><Person who="her" x={x} y={y - (walking ? Math.abs(Math.sin(t * 9)) * 6 * s : 0)} s={s} t={t} pose={pose} seed={1.9} /></g>
      {herBag(x + 330 * s, bagY, 0.9 * s * 1.1)}
    </g>;
    herBefore = wk > 0.55;
  }
  if (id === 'K2') {
    const turn = smooth(t, 14.1, 14.35);
    const s = 0.32, x = 705, y = GROUND + 8 - 900 * s;
    const pose = herP(t, {look: [lerp(0.9, -0.9, turn), 0.1], brow: 0.1 + turn * 0.7, browR: 0.1 + turn * 0.7, mouth: turn > 0.5 ? 'o' : 'flat'});
    herN = <g>
      <g clipPath={`url(#${cutId})`}><Person who="her" x={x} y={y} s={s} t={t} pose={pose} seed={1.9} /></g>
      <Arm who="her" sh={[x + 242 * s, y + 306 * s]} el={[x + 330 * s, y + 560 * s]} x={CAR_X - 22} y={CAR_Y + 28} scale={s} rot={0} />
      {herBag(x - 300 * s, GROUND + 8 - 191 * 0.9 * s, 0.9 * s * 1.1)}
    </g>;
    herBefore = true;
  }

  // ---- him
  let hx = him0.x, hs = him0.s, hy = him0.y;
  let himPoseV: Pose = himP(t), flip = false;
  let rightArm: {el: [number, number]; hand: [number, number]; rot: number; style: 'open' | 'fist'} = {el: [363, 468], hand: [423, 532], rot: 0, style: 'fist'};
  let leftArm: {el: [number, number]; hand: [number, number]; rot: number; style: 'open' | 'fist'} = {el: [-363, 468], hand: [-423, 532], rot: 0, style: 'fist'};
  let bagOn: {x: number; y: number; rot: number} | null = null;
  let heldTag: {x: number; y: number; rot: number} | null = null;
  let extra: React.ReactNode = null;
  const bagRest = (x: number, y: number) => ({x: x - 423 * hs, y: y + 532 * hs + 112 * 0.6 / 0.6 * hs * 0.6 + 20, rot: 0});

  if (id === 'K1') {
    const sw = Math.sin(t * 12.5);
    const kA = smooth(t, 6.1, 6.6) * 0.2 + smooth(t, 6.9, 8.7) * 0.8;
    const kL = smooth(t, B.release, B.release + 0.7);
    const jump = Math.abs(Math.sin(t * 6.25)) * kA * 26;
    hy = him0.y - jump;
    rightArm = {el: [lerp(363, 440, kA), lerp(468, -40, kA)], hand: [lerp(423, 470, kA) + sw * (24 + 190 * kA), lerp(532, -190, kA)], rot: sw * (10 + 30 * kA), style: kA > 0.05 ? 'open' : 'fist'};
    leftArm = {el: [-363, 468], hand: [-423 - 20 * kL, 532], rot: 0, style: kL > 0.5 ? 'open' : 'fist'};
    const rolled = Math.max(0, t - B.release);
    const bx = hx - 423 * hs - Math.pow(rolled, 1.7) * 420;
    const gone = t >= 9.0;
    himPoseV = himP(t, {look: gone ? [-0.9, 0.3] : t < 7.2 ? [0.9, 0.2] : [0.9, 0.1], mouth: gone ? 'o' : 'smile', brow: gone ? 0.9 : 0.3 + kA * 0.5, worry: gone ? 0.8 : 0, sweat: gone ? 0.5 : 0, happy: false,
      tilt: gone ? Math.sin(t * 0.9) : sw * kA * 6, flush: 0.3 + kA * 0.5, bob: -jump * 0.1});
    bagOn = {x: bx, y: hy + 532 * hs + 112 * hs, rot: rolled > 0 ? -rolled * 90 : 0};
    if (kA > 0.35 && !gone) {
      const hxp = hx + rightArm.hand[0] * hs, hyp = hy + rightArm.hand[1] * hs, dir = Math.cos(t * 12.5) > 0 ? 1 : -1;
      extra = <g transform={`translate(${hxp} ${hyp - 20})`} opacity={Math.min(1, (kA - 0.35) * 2.5)} fill="none" stroke={C.carbon} strokeWidth={9} strokeLinecap="round">
        {[0, 1].map((i) => <path key={i} d={`M ${-dir * (80 + i * 34)} ${-50 + i * 6} Q ${-dir * (118 + i * 34)} 0 ${-dir * (80 + i * 34)} ${50 - i * 6}`} />)}
      </g>;
    }
    if (gone) { rightArm = {el: [363, 468], hand: [423, 532], rot: 0, style: 'fist'}; leftArm = {el: [-363, 468], hand: [-423, 532], rot: 0, style: 'fist'}; bagOn = null; hy = him0.y; }
  }
  if (id === 'K2') {
    const raise = smooth(t, 13.6, 14.0);
    rightArm = {el: [lerp(363, 440, raise), lerp(468, 20, raise)], hand: [lerp(423, 470, raise) + Math.sin(t * 11) * 14 * raise, lerp(532, -240, raise)], rot: Math.sin(t * 11) * 10 * raise, style: 'fist'};
    heldTag = {x: hx + rightArm.hand[0] * hs, y: hy + rightArm.hand[1] * hs - 60, rot: 8 + Math.sin(t * 11) * 8};
    himPoseV = himP(t, {look: [0.9, 0.2], mouth: t > 13.9 ? 'o' : 'soft', brow: 0.4 + raise * 0.4, flush: 0.5, tilt: 0});
    bagOn = {x: hx - 423 * hs, y: hy + 532 * hs + 112 * hs, rot: 0};
    extra = <Exclaim x={hx - 250} y={hy - 175} k={wp(t, 13.95, 14.25)} />;
  }
  if (id === 'K3') {
    hx = 270; hy = 905; hs = 0.8;
    const read = smooth(t, 17.4, 17.7);
    himPoseV = himP(t, {look: [0.9, 0.2], mouth: t < 17.7 ? 'soft' : 'smile', brow: 0.4, flush: 0.5, happy: t >= 18.0});
    rightArm = {el: [350, 330], hand: [470, 150], rot: 0, style: 'fist'};
    heldTag = {x: hx + 470 * hs + 10, y: hy + 150 * hs - 70, rot: 6};
    bagOn = null;
    leftArm = {el: [-363, 468], hand: [-423, 532], rot: 0, style: 'fist'};
    void read;
  }
  if (id === 'E2') {
    const nod = smooth(t, 26.45, 26.55) * (1 - smooth(t, 26.85, 26.95)) * Math.abs(Math.sin(t * 18));
    const down = smooth(t, 28.55, 28.8);
    const tinyWave = smooth(t, 27.95, 28.05) * (1 - smooth(t, 28.45, 28.55)) * Math.sin(t * 20);
    const walkOff = smooth(t, 30.6, 31.8);
    hx = him0.x + Math.pow(walkOff, 1.6) * 1100;
    hy = him0.y - (walkOff > 0 ? Math.abs(Math.sin(t * 11)) * 12 * Math.min(1, walkOff * 6) : 0);
    flip = walkOff > 0;
    const buzz = (t >= 29.0 && t < 29.2) || (t >= 29.25 && t < 29.45);
    himPoseV = himP(t, {look: down > 0.5 ? [0.2, 0.9] : t < 28.0 ? [0.9, 0.1] : [0.9, 0.1], mouth: 'smile', happy: false, brow: 0.2, flush: 0.35, tilt: nod * 6 + down * 4 * (1 - walkOff), bob: -nod * 8});
    const tg: [number, number] = [lerp(330, 150, down) + tinyWave * 16, lerp(40, 330, down)];
    rightArm = {el: [lerp(420, 340, down), lerp(240, 430, down)], hand: tg, rot: tinyWave * 14, style: 'fist'};
    heldTag = {x: hx + tg[0] * hs, y: hy + tg[1] * hs - 40, rot: 6 + tinyWave * 10 - down * 6};
    leftArm = {el: [-363, 468], hand: [-423, 532], rot: 0, style: 'fist'};
    bagOn = {x: hx - 423 * hs, y: hy + 532 * hs + 112 * hs, rot: 0};
    if (buzz) extra = <g transform={`translate(${hx} ${hy}) scale(${hs})`}>
      <circle cx={210} cy={560} r={150} fill="url(#glowSky)" opacity={0.85} />
      <rect x={168} y={500} width={84} height={130} rx={16} fill="url(#scr)" stroke="#fff" strokeWidth={5} transform={`rotate(${Math.sin(t * 90) * 6} 210 560)`} />
      {[-1, 1].map((sd) => <path key={sd} d={`M ${210 + sd * 70} 510 Q ${210 + sd * 90} 565 ${210 + sd * 70} 620`} fill="none" stroke={C.sky} strokeWidth={8} strokeLinecap="round" />)}
    </g>;
  }

  const walkBob = id === 'E2' && flip ? 0 : 0;
  void walkBob;
  const himGroup = <g transform={flip ? `translate(${hx * 2} 0) scale(-1 1)` : undefined}>
    <g clipPath={`url(#${cutId})`}><Person who="him" x={hx} y={hy} s={hs} t={t} pose={himPoseV} seed={0.4} /></g>
    {id === 'K3'
      ? <Arm who="him" sh={[hx + 242 * hs, hy + 306 * hs]} el={[hx + rightArm.el[0] * hs, hy + rightArm.el[1] * hs + 150]} x={hx + rightArm.hand[0] * hs} y={hy + rightArm.hand[1] * hs + 20} scale={hs} />
      : <Arm who="him" sh={[hx + 242 * hs, hy + 306 * hs]} el={[hx + rightArm.el[0] * hs, hy + rightArm.el[1] * hs]} x={hx + rightArm.hand[0] * hs} y={hy + rightArm.hand[1] * hs} rot={rightArm.rot} style={rightArm.style} scale={hs} />}
    {id !== 'K3' && (id !== 'K1' || t < 9.0) && <Arm who="him" sh={[hx - 242 * hs, hy + 306 * hs]} el={[hx + leftArm.el[0] * hs, hy + leftArm.el[1] * hs]} x={hx + leftArm.hand[0] * hs} y={hy + leftArm.hand[1] * hs} rot={leftArm.rot} style={leftArm.style} scale={hs} />}
    {bagOn && <Bag x={bagOn.x} y={bagOn.y} loop={false} tag ribbon={1} ribbonColor={C.amber} scale={0.6} rot={bagOn.rot} />}
    {heldTag && <HeldTag x={heldTag.x} y={heldTag.y} rot={heldTag.rot} scribble={id !== 'K2' || false} scale={id === 'K3' ? 1.7 : 1.5} />}
    {extra}
  </g>;
  // her inside (two-shot) in K3: she walks back in from the car
  let herK3: React.ReactNode = null;
  if (id === 'K3') {
    const k = smooth(t, 16.9, 17.5);
    const x = lerp(705, 820, k), s = lerp(0.32, 0.8, k), y = lerp(GROUND + 8 - 900 * 0.32, 905, k);
    const smile = t >= 17.75;
    const pose = herP(t, {look: [lerp(-0.9, -0.8, k), 0.3], mouth: smile ? 'smile' : 'soft', happy: t >= 18.0, brow: 0.2});
    const penK = smooth(t, 17.85, 18.1);
    herK3 = <g>
      <g clipPath={`url(#${cutId})`}><Person who="her" x={x} y={y} s={s} t={t} pose={pose} seed={1.9} /></g>
      {k > 0.95 && penK > 0 && <g opacity={penK}>
        <Arm who="her" sh={[x - 242 * s, y + 306 * s]} el={[x - 330 * s, y + 600 * s]} x={x - 140 * s} y={y + 420 * s - 50 * penK} scale={s} style="fist" rot={-10} />
        <Pen x={x - 140 * s} y={y + 400 * s - 50 * penK} rot={-25} />
      </g>}
    </g>;
  }

  return <g>
    <g transform={planeT({x: 540 + wob, y: 960, z: 1}, 0.2)}><HallWall /></g>
    <defs><clipPath id="opening"><rect x={OP.x0} y={OP.y0} width={OP.x1 - OP.x0} height={OP.y1 - OP.y0} /></clipPath>
      <clipPath id={cutId}><rect x={-1500} y={0} width={4000} height={1530} /></clipPath></defs>
    <rect x={150} y={420} width={780} height={1130} rx={16} fill={C.carbon} />
    <rect x={330} y={436} width={420} height={92} rx={14} fill={C.hiVis} stroke="#000" strokeWidth={4} />
    <text x={540} y={506} textAnchor="middle" fontFamily={JOST} fontWeight={800} fontSize={72} letterSpacing={8} fill={C.carbon}>EXIT</text>
    <g clipPath="url(#opening)">
      <SkyBg x0={OP.x0} x1={OP.x1} y0={OP.y0} y1={1100} id="kSky" />
      <rect x={200} y={880} width={90} height={190} fill="#B6C7D6" /><rect x={300} y={930} width={70} height={140} fill="#C3D2DF" /><rect x={830} y={900} width={60} height={170} fill="#B6C7D6" />
      <rect x={OP.x0} y={1040} width={700} height={44} fill="url(#hazard)" />
      <rect x={OP.x0} y={1084} width={700} height={450} fill="#2C2C32" />
      <line x1={OP.x0} x2={OP.x1} y1={1400} y2={1400} stroke="#fff" strokeWidth={8} strokeDasharray="60 50" opacity={0.7} />
      <rect x={512} y={730} width={16} height={330} fill={C.carbon} />
      <rect x={380} y={650} width={280} height={110} rx={14} fill={C.hiVis} stroke={C.carbon} strokeWidth={7} />
      <text x={520} y={725} textAnchor="middle" fontFamily={JOST} fontWeight={800} fontSize={56} fill={C.carbon}>PICK-UP</text>
      <CarSide x={carX} y={CAR_Y} s={CAR_S} id="kc" head={headIn} driver tail={tail} hop={hop} />
      {herBefore && herN}
    </g>
    {pane(lx, 'l')}{pane(rx, 'r')}
    <rect x={-100} y={1530} width={1300} height={500} fill="#C9C5BA" />
    <rect x={-100} y={1530} width={1300} height={14} fill={C.carbon} opacity={0.18} />
    {!herBefore && herN}
    {herK3}
    {himGroup}
  </g>;
};

// ------------------------------------------------------------------------------------------ driver close-up (epilogue gag)
const DriverClose: React.FC<{t: number}> = ({t}) => {
  const age = t - B.e1;
  const beep = (a: number) => wp(age, a, a + 0.22) * (1 - wp(age, a + 0.22, a + 0.4));
  const b1 = beep(0.7), b2 = beep(1.15);
  const hop = (b1 > 0 || b2 > 0 ? 7 : 0);
  const arcs = Math.max(b1, b2);
  const fx = 640 + Math.sin(t * 0.7) * 3;
  return <g>
    <g transform={planeT({x: 540 + Math.sin(t * 0.7) * 4, y: 960, z: 1}, 0.2)}><HallWall /></g>
    <SkyBg x0={-100} x1={1180} y0={480} y1={1300} id="dSky" />
    <rect x={-100} y={560} width={150} height={380} fill="#B6C7D6" /><rect x={70} y={680} width={110} height={260} fill="#C3D2DF" /><rect x={960} y={620} width={160} height={320} fill="#B6C7D6" />
    <rect x={-100} y={930} width={1300} height={44} fill="url(#hazard)" />
    <rect x={-100} y={974} width={1300} height={700} fill="#2C2C32" />
    <rect x={-100} y={1560} width={1300} height={400} fill="#25252A" />
    <g transform="translate(0 20)">
      <CarSide x={fx} y={1050} s={1.85} id="dc" driver big head={false} hop={hop} />
    </g>
    {arcs > 0 && <g transform="translate(150 1050)" opacity={arcs} fill="none" stroke={C.carbon} strokeWidth={12} strokeLinecap="round">
      {[0, 1, 2].map((i) => <path key={i} d={`M ${-30 - i * 42} ${-40 - i * 20} Q ${-50 - i * 42} 0 ${-30 - i * 42} ${40 + i * 20}`} />)}
    </g>}
    {arcs > 0 && <text x={160} y={850} textAnchor="middle" fontFamily={CAVEAT} fontWeight={700} fontSize={110} fill={C.carbon} stroke="#fff" strokeWidth={16} strokeLinejoin="round" paintOrder="stroke" opacity={arcs} transform="rotate(-8 160 850)">beep.</text>}
  </g>;
};

// ------------------------------------------------------------------------------------------ router
const renderShot = (t: number, hook: Hook): React.ReactNode => {
  const id = shotAt(t);
  if (id === 'T6' || id === 'T7' || id === 'T8') return <TagInsert t={t} id={id} />;
  if (id === 'CTX') return <ContextInsert t={t} />;
  if (id === 'BL') return <BlankTag t={t} />;
  if (id === 'N') return <NamesInsert t={t} />;
  if (id === 'E1') return <DriverClose t={t} />;
  if (id === 'K1' || id === 'K2' || id === 'K3' || id === 'E2') return <Kerb t={t} id={id} />;
  if (id === 'end') return <EndCard a={t - B.endcard} t={t} part={6} amberRibbon pill="the end" pillSize={92} tagline="a silent baggage-claim love story" />;
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
  const inRew = t >= RW0 && t < RW1;
  const k = inRew ? (t - RW0) / (RW1 - RW0) : 0;
  const cx = flapEdge(1 - k);
  const tH = RW0 - 1.0 * smooth(t, RW0, RW1);
  return <>
    <MotionBlurWhen fast={inRew} samples={5} shutter={220}>
      <AbsoluteFill>
        <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, background: C.concrete}}>
          <Defs />
          {inRew ? <>
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
          return <Strip key={i} text={s.text} y={s.y} age={t - s.from + (isHook ? 1 : 0.06)} out={isHook ? smooth(t, B.hookEnd - 0.15, B.hookEnd) : smooth(t, s.to - 0.12, s.to)} size={isHook ? 58 : 62} rot={isHook ? 0 : i % 2 ? 0.6 : -0.6} />;
        })}
        {t >= B.take1 && t < RW0 - 0.1 && <Pill text="take 1" age={t - B.take1} />}
        {t >= RW1 && t < B.t7 + 1.9 && <Pill text="take 2" age={t - RW1} />}
      </svg>
    </AbsoluteFill>
  </>;
};

export const Bag6: React.FC<{hook?: Hook}> = ({hook = 'a'}) => (
  <AbsoluteFill style={{background: C.concrete}}>
    <Audio src={staticFile('audio/bag-ep6.wav')} volume={0.9} />
    <Scene hook={hook} />
  </AbsoluteFill>
);
