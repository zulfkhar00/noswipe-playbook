import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, lerp, smooth} from '../../lib/motion';
import {MotionBlurWhen} from '../../lib/shots';
import {
  ANTON, Arm, Barrier, BEAM_DUR, Beam, Burst, C, Chain, COUR, Defs, EndCard, Far, Mouth, NearRack, PEN, PenSprite, PenText, Person, Phone, Pose, ReturnsSign, SANS, ShirtBag,
  Slip, Strip, Tag, VoteSlip, planeT, textW,
} from './world';
import spec from '../../../specs/stories/returns-ep1.json';

// Reason for Return, part 1 "Reason". Silent. Frame 1 is fully drawn: ONE strip (the hook), two big faces, both phones lit mid-swipe,
// the big yellow return slip on a clipboard between them with his navy pen hovering over the blank box. Then: he lifts the shirt bag
// (tags on), whole-frame slips (WRONG SIZE. / tags still on?), his sweat, the calendar FRI 7 PM crossed out, "i cancelled / twice."
// (payoff laugh), phones into bags, the line shuffles, the counter (ONE LINE ONLY), scanner-beam wipe to the vote board, end card.

export const RETURNS1_FPS = 60;
export const RETURNS1_FRAMES = Math.round(spec.duration * RETURNS1_FPS);
export type Hook = 'a' | 'b';
const B = spec.beats;
const WIPE_AT = B.beamWipe;
const VOTE_AT = WIPE_AT + BEAM_DUR;

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
const pulse = (t: number, a: number, b: number) => Math.sin(wp(t, a, b) * Math.PI);
const blinkAt = (t: number, seed: number) => { const ph = (t + seed) % 3.7; return ph < 0.14 ? Math.sin((ph / 0.14) * Math.PI) : 0; };

// ------------------------------------------------------------------------------------------ shots
type ShotId = 'D' | 'B1' | 'B2' | 'S' | 'F' | 'CAL' | 'L' | 'P' | 'M' | 'C' | 'vote' | 'end';
const SHOTS: [number, ShotId][] = [[0, 'D'], [3.1, 'B1'], [4.2, 'B2'], [5.3, 'S'], [10.3, 'F'], [11.0, 'CAL'], [13.0, 'S'], [15.1, 'L'], [16.2, 'P'], [18.5, 'M'], [20.8, 'C'], [VOTE_AT, 'vote'], [B.endcard, 'end']];
const shotAt = (t: number): ShotId => keyAt(SHOTS, t);

// ------------------------------------------------------------------------------------------ poses
const HIM_X = 270, HER_X = 810, PY = 940, PS = 1.12;

const himLook = (t: number, hook: Hook): [number, number] => {
  if (t < 2.1) {
    const keys: KF[] = hook === 'a' ? [[0, 0.1, 0.85], [1.55, 0.1, 0.85], [1.7, 0.5, 0.9]] : [[0, 0.1, 0.85], [0.95, 0.1, 0.85], [1.1, 0.9, 0.15], [1.65, 0.9, 0.15], [1.8, 0.5, 0.9]];
    const [a, b] = kf(keys, t); return [a, b];
  }
  const [a, b] = kf([[2.1, 0.5, 0.9], [3.2, 0.5, 0.9], [3.5, 0.1, 0.8], [4.0, 0.7, 0.3], [4.2, 0.1, 0.9], [5.3, 0.1, 0.9], [10.3, 0.2, 0.4], [10.7, 0.9, 0.3], [11.0, 0.6, 0.8], [13.0, 0.6, 0.8], [14.6, 0.8, 0.2], [15.1, 0.9, 0.1],
    [16.2, 0.2, 0.85], [17.2, 0.2, 0.85], [17.5, 0.9, 0.1], [18.5, 0.9, 0.1], [18.8, 0.2, 0.2], [19.3, 0.9, 0.1], [19.6, 0.2, 0.2], [20.2, 0.9, 0.1], [20.8, 0.3, 0.3], [21.4, 0.5, 0.9], [22.0, 0.1, 0.8], [22.7, 0.9, 0.2]], t);
  return [a, b];
};
const herLook = (t: number, hook: Hook): [number, number] => {
  if (t < 2.1) {
    const keys: KF[] = hook === 'a' ? [[0, -0.1, 0.8], [0.7, -0.1, 0.8], [0.9, -0.85, 0.65], [1.8, -0.85, 0.65], [2.0, -0.5, 0.9]]
      : [[0, -0.1, 0.8], [0.35, -0.1, 0.8], [0.5, -0.9, 0.55], [1.6, -0.9, 0.55], [1.75, -0.5, 0.9]];
    const [a, b] = kf(keys, t); return [a, b];
  }
  const [a, b] = kf([[2.1, -0.5, 0.9], [3.3, -0.5, 0.9], [3.6, -0.8, 0.5], [4.2, -0.7, 0.6], [5.3, -0.7, 0.6], [10.3, -0.8, 0.5], [11.0, -0.4, 0.8], [13.0, -0.4, 0.8], [14.6, -0.8, 0.2], [15.1, -0.9, 0.1],
    [16.2, -0.1, 0.85], [17.2, -0.1, 0.85], [17.5, -0.9, 0.1], [18.5, -0.9, 0.1], [18.8, -0.2, 0.2], [19.3, -0.9, 0.1], [19.6, -0.2, 0.2], [20.2, -0.9, 0.1], [20.8, -0.3, 0.3], [21.4, -0.5, 0.9], [22.0, -0.9, 0.2], [22.8, -0.9, 0.1]], t);
  return [a, b];
};

const HIM_MOUTH: [number, Mouth][] = [[2.1, 'soft'], [3.1, 'flat'], [3.8, 'gulp'], [4.2, 'flat'], [10.3, 'gulp'], [10.9, 'grit'], [11.0, 'flat'], [14.6, 'o'], [15.1, 'laugh'], [16.2, 'smile'], [17.2, 'soft'], [17.5, 'smile'], [18.5, 'soft'], [19.3, 'smile'], [20.8, 'flat'],
  [21.8, 'grit'], [22.2, 'gulp'], [22.6, 'flat']];
const HER_MOUTH: [number, Mouth][] = [[2.1, 'smirk'], [4.2, 'smirk'], [10.3, 'smirk'], [11.0, 'smile'], [14.6, 'smile'], [15.1, 'laugh'], [16.2, 'smile'], [18.5, 'smile'], [20.8, 'flat'], [22.8, 'smirk']];

const himPose = (t: number, hook: Hook): Pose => {
  const breath = 1 + 0.014 * Math.sin(t * 2.3);
  let mouth: Mouth = t < 2.1 ? (hook === 'a' ? 'flat' : t >= 1.1 && t < 1.65 ? 'grit' : t >= 1.8 ? 'soft' : 'flat') : keyAt(HIM_MOUTH, t);
  let sq = breath, bob = 0, tilt = Math.sin(t * 0.9) * 1.1, sweat = 0, brow = 0.1;
  let flush = 0.2 + 0.5 * smooth(t, 0.9, 1.8);
  if (hook === 'b' && t < 3) {
    sq += 0.07 * Math.sin(wp(t, 1.1, 1.35) * Math.PI);
    bob -= 20 * pulse(t, 1.1, 1.45);
    sweat = smooth(t, 1.2, 1.5) * (1 - smooth(t, 2.6, 3.0)) * 0.95;
    brow += 0.9 * (t > 1.1 && t < 1.7 ? 1 : 0);
    flush = Math.max(flush, smooth(t, 1.1, 1.6) * 0.8);
  }
  if (hook === 'a' && t > 1.7 && t < 2.5) brow += 0.5;
  if (t >= 3) flush = 0.6;
  if (t >= 3.4 && t < 4.4) sweat = 0.5 * pulse(t, 3.4, 4.4);
  if (t >= 10.3 && t < 11.0) { sweat = smooth(t, 10.3, 10.5) * 0.95; brow += 0.5; bob -= Math.abs(Math.sin((t - 10.3) * 14)) * 12 * (t < 10.8 ? 1 : 0); }
  if (t >= 20.8 && t < 24.6) sweat = smooth(t, 21.6, 22.0) * 0.8;
  const L = t >= B.laugh && t < 16.2;
  let happy = false;
  if (L) { happy = true; bob = -Math.abs(Math.sin(t * 22)) * 9; tilt = Math.sin(t * 22) * 3; sq = 1.05 - 0.09 * smooth(t, 15.25, 15.6); flush = 0.5; }
  const g = Math.sin(wp(t, B.gulp, B.gulp + 0.42) * Math.PI) + (t > 3.85 && t < 4.2 ? Math.sin(wp(t, 3.85, 4.2) * Math.PI) : 0);
  if (t > B.gulp - 0.1 && t < B.gulp + 0.4) sq += 0.04 * Math.sin(wp(t, B.gulp - 0.1, B.gulp + 0.4) * Math.PI);
  if (t >= 18.6 && t < 20.7) bob -= 16 * Math.max(pulse(t, 18.6, 18.95), pulse(t, 19.4, 19.75), pulse(t, 20.2, 20.55));
  if (t >= 16.2 && t < 18.5 && !L) happy = false;
  return {look: himLook(t, hook), brow, worry: sweat * 0.8, mouth, happy, sweat, gulp: g, tilt, bob, sq, blink: happy ? 0 : blinkAt(t, 0.4), flush};
};
const herPose = (t: number, hook: Hook): Pose => {
  const breath = 1 + 0.014 * Math.sin(t * 2.0 + 1.3);
  const mouth: Mouth = t < 2.1 ? (hook === 'a' ? (t >= 0.9 ? 'smirk' : 'flat') : t >= 1.5 ? 'smirk' : t >= 0.8 ? 'o' : 'flat') : keyAt(HER_MOUTH, t);
  const L = t >= B.laugh && t < 16.2;
  let bob = 0, tilt = Math.sin(t * 0.8 + 2) * 1.2, sq = breath;
  if (L) { bob = -Math.abs(Math.sin(t * 21 + 1)) * 9; tilt = Math.sin(t * 21 + 1) * 3; }
  let brow = 0.1 + (hook === 'b' && t < 2.1 ? 0.8 * pulse(t, 0.55, 1.4) : 0);
  if (t >= 3.4 && t < 4.6) brow += 0.45;
  if (t >= 22.3 && t < 24.6) brow = 0.1 + 0.95 * smooth(t, 22.55, 22.8);
  if (t >= 18.6 && t < 20.7) bob -= 16 * Math.max(pulse(t, 18.6, 18.95), pulse(t, 19.4, 19.75), pulse(t, 20.2, 20.55));
  return {look: herLook(t, hook), brow, worry: 0, mouth, happy: L, sweat: 0, gulp: 0, tilt, bob, sq, blink: L ? 0 : blinkAt(t, 1.9), flush: 0.15};
};

// ------------------------------------------------------------------------------------------ phones
const phoneSwipe = (ticks: number[], t: number, until: number) => {
  let idx = -1;
  for (let i = 0; i < ticks.length; i++) if (ticks[i] <= t && ticks[i] < until) idx = i;
  if (idx < 0) return {p: 0, dir: 1, on: false};
  const p = (t - ticks[idx]) / 0.26;
  if (p > 1) return {p: 0, dir: 1, on: false};
  return {p: clamp(p), dir: idx % 2 ? -1 : 1, on: true};
};
const HIM_TICKS = [-0.1, ...spec.audio.swipeTicks];
const HER_TICKS = [-0.12, 0.33, 0.62, 0.93, 1.22];

const himPhone = (t: number, hook: Hook) => {
  const sw = phoneSwipe(HIM_TICKS, t, hook === 'a' ? 1.7 : 1.05);
  let pos = {x: 94, y: 1030, rot: -4, s: 1.0, lit: 1};
  if (hook === 'b' && t > 1.1) { const k = smooth(t, 1.1, 1.45); pos = {x: lerp(94, 235, k), y: lerp(1030, 1150, k), rot: lerp(-4, 38, k), s: lerp(1, 0.8, k), lit: lerp(1, 0.55, k)}; }
  if (hook === 'a' && t > 1.7) { const k = smooth(t, 1.7, 2.3); pos = {x: lerp(94, 130, k), y: lerp(1030, 1110, k), rot: lerp(-4, 8, k), s: 1, lit: lerp(1, 0.6, k)}; }
  const k3 = smooth(t, 2.5, 3.1);
  return {...pos, lit: t < 2.5 ? pos.lit : lerp(pos.lit, 0.45, k3), p: sw.p, dir: sw.dir, thumb: sw.on ? 1 : 0};
};
const herPhone = (t: number, hook: Hook) => {
  const sw = phoneSwipe(HER_TICKS, t, hook === 'a' ? 0.9 : 0.5);
  let pos = {x: 986, y: 1030, rot: 4, s: 1.0, lit: 1};
  if (hook === 'a' && t > 0.9) { const k = smooth(t, 0.9, 1.3); pos = {x: lerp(986, 900, k), y: lerp(1030, 1130, k), rot: lerp(4, -30, k), s: lerp(1, 0.84, k), lit: 1}; }
  const k3 = smooth(t, 2.5, 3.1);
  return {...pos, lit: t < 2.5 ? pos.lit : lerp(pos.lit, 0.45, k3), p: sw.p, dir: sw.dir, thumb: sw.on ? 1 : 0};
};

// ------------------------------------------------------------------------------------------ slip faces
const SlipHead: React.FC<{h: number; size?: number}> = ({h, size = 60}) => <text x={0} y={-h / 2 + 95} textAnchor="middle" fontFamily={COUR} fontWeight={700} fontSize={size} fill={C.ink}>REASON FOR RETURN:</text>;
const SlipBox: React.FC<{h: number; blank?: boolean; hasText?: boolean}> = ({h, blank = true, hasText = false}) => <g>
  <rect x={-350} y={-h / 2 + 150} width={700} height={160} rx={8} fill="#FFFBE0" stroke={C.ink} strokeWidth={6} />
  {blank && !hasText && <text x={0} y={-h / 2 + 258} textAnchor="middle" fontFamily={COUR} fontWeight={700} fontSize={72} fill={C.ink} opacity={0.55}>____</text>}
</g>;

const Chain2: React.FC<{t: number; w: number; h: number}> = ({t, w, h}) => {
  const j = Math.max(pulse(t, 5.6, 6.0), pulse(t, 8.5, 8.9), pulse(t, 13.1, 13.5));
  return <Chain x1={-w / 2 + 40} y1={h / 2 - 4} x2={-w / 2 + 70} y2={h / 2 + 330} sag={40} jit={j} />;
};

// ------------------------------------------------------------------------------------------ the two-shot (frame 1)
const penDrop = (t: number) => {
  const d = smooth(t, 2.0, 2.15);
  const bounce = t > 2.15 ? Math.sin(wp(t, 2.15, 2.4) * Math.PI) * 6 * (1 - wp(t, 2.15, 2.4)) : 0;
  return {y: lerp(1078, 1112, d) - bounce, tilt: lerp(-30, -18, d)};
};

const TwoShot: React.FC<{t: number; hook: Hook}> = ({t, hook}) => {
  const z = 1 + 0.03 * clamp(t / 3.1);
  const cam = {x: 540, y: 960, z};
  const him = himPose(t, hook), her = herPose(t, hook);
  const hp = himPhone(t, hook), rp = herPhone(t, hook);
  const pd = penDrop(t);
  const slipSway = Math.sin(t * 1.6) * 0.5;
  return <g>
    <g transform={planeT(cam, 0.3)}><Far t={t} /></g>
    <g transform={planeT(cam, 0.55)}><ReturnsSign x={540} y={512} s={0.7} /></g>
    <g transform={planeT(cam, 0.9)}>
      <Person who="him" x={HIM_X} y={PY} s={PS} pose={him} part="body" />
      <Person who="her" x={HER_X} y={PY} s={PS} pose={her} part="body" />
      {/* her gift box under the arm */}
      <g transform="translate(1010 1120) rotate(10)"><rect x={-96} y={-70} width={190} height={150} rx={8} fill={C.tagRed} stroke={C.ink} strokeWidth={7} /><rect x={-12} y={-70} width={24} height={150} fill={C.lav} stroke={C.ink} strokeWidth={4} /><rect x={-96} y={-12} width={190} height={24} fill={C.lav} stroke={C.ink} strokeWidth={4} /></g>
      <Barrier y={1215} />
      {/* clipboard + slip */}
      <g transform="translate(540 1100)">
        <rect x={-352} y={-210} width={704} height={470} rx={16} fill={C.ink} opacity={0.3} transform="translate(12 20)" filter="url(#blurSh)" />
        <rect x={-340} y={-200} width={680} height={470} rx={16} fill={C.tealDeep} stroke={C.ink} strokeWidth={8} />
        <rect x={-76} y={-224} width={152} height={50} rx={10} fill={C.steel} stroke={C.ink} strokeWidth={7} />
        <g transform={`translate(0 10) scale(0.775) rotate(${slipSway})`}>
          <Slip w={800} h={464} glow={0.9}>
            <SlipHead h={464} />
            <SlipBox h={464} />
          </Slip>
        </g>
      </g>
      <Person who="him" x={HIM_X} y={PY} s={PS} pose={him} part="head" />
      <Person who="her" x={HER_X} y={PY} s={PS} pose={her} part="head" />
      <Chain x1={235} y1={1280} x2={440} y2={pd.y + 150} sag={55} jit={0.02 * Math.sin(t * 5)} />
      <g transform={`translate(445 ${pd.y})`}><PenSprite color={C.ink} sleeve={C.parka} skin={C.skinHim} hand={false} tilt={pd.tilt} len={230} /></g>
      {/* arms + phones */}
      <Arm who="him" sx={-20} sy={1560} hx={hp.x + 10 + (hp.rot > 10 ? 10 : 0)} hy={hp.y + 125 * hp.s} w={80} />
      <Arm who="her" sx={1100} sy={1560} hx={rp.x - 10} hy={rp.y + 125 * rp.s} w={80} />
      <Phone id="him" x={hp.x} y={hp.y} rot={hp.rot} scale={hp.s} lit={hp.lit} p={hp.p} dir={hp.dir} thumb={hp.thumb} skin={C.skinHim} />
      <Phone id="her" x={rp.x} y={rp.y} rot={rp.rot} scale={rp.s} lit={rp.lit} p={rp.p} dir={rp.dir} thumb={rp.thumb} caseColor={C.coral} skin={C.skinHer} />
      {hook === 'b' && t >= 0.8 && t < 2.0 && <Burst x={905} y={560} k={wp(t, 0.8, 1.2)} />}
    </g>
    <g transform={planeT(cam, 1.4)}><NearRack x={-30} /><NearRack x={1110} /></g>
  </g>;
};

// ------------------------------------------------------------------------------------------ bag shots
const BagMedium: React.FC<{t: number; hook: Hook}> = ({t, hook}) => {
  const k = smooth(t, B.bagUp, B.bagUp + 0.55);
  const him = himPose(t, hook), her = herPose(t, hook);
  const sw = Math.sin(t * 5) * 4 * (1 - 0.5 * wp(t, 3.9, 4.2));
  const cam = {x: 540, y: 960, z: lerp(1.0, 1.05, wp(t, 3.1, 4.2))};
  return <g>
    <g transform={planeT(cam, 0.3)}><Far t={t} /></g>
    <g transform={planeT(cam, 0.55)}><ReturnsSign x={540} y={512} s={0.7} /></g>
    <g transform={planeT(cam, 0.9)}>
      <Person who="her" x={830} y={980} s={0.85} pose={her} />
      <Person who="him" x={330} y={990} s={1.1} pose={him} />
      <Barrier y={1230} />
      <Arm who="him" sx={-40} sy={1500} hx={380} hy={lerp(1240, 860, k)} w={80} />
      <g transform={`translate(380 ${lerp(1400, 1060, k)})`}><ShirtBag x={0} y={0} s={0.95} swing={sw} /></g>
    </g>
  </g>;
};

const TagClose: React.FC<{t: number}> = ({t}) => {
  const a = t - 4.2;
  const sw = Math.sin(a * 7) * 6 * Math.exp(-a * 0.8);
  return <g>
    <g filter="url(#blurSoft)"><Far t={t} dim={0.25} /></g>
    <g transform={`translate(560 1080) scale(${1.55 + 0.05 * wp(t, 4.2, 5.3)})`}>
      <ShirtBag x={0} y={0} s={1} swing={sw * 0.4} />
    </g>
    <g transform="translate(300 560)"><rect x={-4} y={0} width={0} height={0} /></g>
  </g>;
};

// ------------------------------------------------------------------------------------------ whole-frame slips
const SlipInsert: React.FC<{t: number}> = ({t}) => {
  const W = 800, H = 620;
  const slideIn = smooth(t, B.slipIn, B.slipIn + 0.28);
  const shiftHer = smooth(t, 8.0, 8.3) * (1 - smooth(t, 13.0, 13.1));
  const sx = t < 8.0 ? lerp(1500, 540, slideIn) : 540 - 0 * shiftHer;
  const rot = t < 8.0 ? lerp(10, -1, slideIn) : lerp(-1, 1.2, shiftHer);
  const p1 = wp(t, B.write1, 7.4), p2 = wp(t, B.write2, 9.9), p3 = wp(t, B.write3, 14.5);
  const p3b = wp(t, 13.1 + 1.0, 14.5), p3a = wp(t, 13.1, 14.0);
  const showHers1 = t >= 8.0 && t < 13.0;
  const third = t >= 13.0;
  const jitter = (a: number, b: number) => (t >= a && t < b ? Math.sin(t * 70) * 3 * (1 - wp(t, a, b)) : 0);
  const boxTop = -H / 2 + 150;
  return <g>
    <g filter="url(#blurSoft)"><Far t={t} dim={0.45} /></g>
    <rect x={-100} y={-100} width={1300} height={2200} fill={C.cream} opacity={0.2} />
    <g transform={`translate(${sx} 815)`}>
      <Slip w={W} h={H} rot={rot} glow={0.5}>
        <SlipHead h={H} />
        <SlipBox h={H} hasText={p1 > 0} />
        <PenText txt="WRONG SIZE." x={0} y={boxTop + 112} size={118} color={C.ink} p={p1} id="w1" sleeve={C.parka} skin={C.skinHim} jit={jitter(5.6, 6.0)} />
        {showHers1 && <PenText txt="tags still on?" x={20} y={boxTop + 270} size={112} color={C.teal} p={p2} id="w2" rot={-2.5} sleeve={C.char} skin={C.skinHer} jit={jitter(8.5, 8.9)} />}
        {third && <g>
          <PenText txt="i cancelled" x={10} y={boxTop + 232} size={112} color={C.teal} p={p3a} id="w3a" rot={-2} sleeve={C.char} skin={C.skinHer} jit={jitter(13.1, 13.5)} />
          <PenText txt="twice." x={-60} y={boxTop + 336} size={116} color={C.teal} p={p3b} id="w3b" rot={-1} sleeve={C.char} skin={C.skinHer} />
        </g>}
        <Chain2 t={t} w={W} h={H} />
      </Slip>
    </g>
  </g>;
};

// ------------------------------------------------------------------------------------------ his face, calendar
const FaceClose: React.FC<{t: number; hook: Hook}> = ({t, hook}) => {
  const him = himPose(t, hook);
  return <g>
    <g filter="url(#blurSoft)"><Far t={t} dim={0.3} /></g>
    <g transform={`translate(540 1090) scale(${1 + 0.02 * wp(t, 10.3, 11)}) translate(-540 -1090)`}>
      <Person who="him" x={540} y={1090} s={1.75} pose={him} />
    </g>
    <Barrier y={1360} />
  </g>;
};

const Calendar: React.FC<{t: number}> = ({t}) => {
  const slap = (() => { const k = clamp((t - 11.0) / 0.3); return k <= 0 ? 0.01 : 1 + Math.sin(k * Math.PI * 1.5) * Math.exp(-k * 4.2) * 0.3 - Math.exp(-k * 9) * (1 - k); })();
  const x1 = wp(t, 11.6, 11.85), x2 = wp(t, 11.9, 12.15);
  const shake = t > 11.6 && t < 12.2 ? Math.sin(t * 60) * 2 : 0;
  const days = ['THU', 'FRI', 'SAT'];
  return <g>
    <g filter="url(#blurSoft)"><Far t={t} dim={0.4} /></g>
    <g transform="translate(540 790)">
      <rect x={-440} y={-300} width={880} height={720} rx={20} fill={C.ink} opacity={0.3} transform="translate(14 20)" filter="url(#blurSh)" />
      <rect x={-426} y={-310} width={880} height={720} rx={20} fill={C.ink} />
      <rect x={-440} y={-324} width={880} height={720} rx={20} fill="#fff" stroke={C.ink} strokeWidth={8} />
      <rect x={-440} y={-324} width={880} height={110} rx={20} fill={C.tagRed} stroke={C.ink} strokeWidth={8} />
      {[-300, 0, 300].map((x) => <rect key={x} x={x - 14} y={-352} width={28} height={64} rx={12} fill={C.steel} stroke={C.ink} strokeWidth={6} />)}
      {days.map((d, i) => <text key={d} x={-290 + i * 290} y={-243} textAnchor="middle" fontFamily={SANS} fontWeight={900} fontSize={48} fill="#fff">{d}</text>)}
      {[0, 1].map((r) => [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={-420 + c * 290 + 4} y={-190 + r * 290} width={284} height={280} fill={(r + c) % 2 ? '#FFF8E7' : '#fff'} stroke={C.ink} strokeWidth={4} />))}
      {[0, 1, 2].map((c) => <rect key={`z${c}`} x={-410 + c * 290} y={-182} width={0} height={0} />)}
      {/* sticker on the FRI square (second row) */}
      <g transform={`translate(0 ${-190 + 290 + 140 - 10}) rotate(-4) scale(${slap})`}>
        <rect x={-228} y={-104} width={470} height={210} rx={18} fill={C.ink} opacity={0.4} transform="translate(8 12)" />
        <rect x={-236} y={-110} width={470} height={210} rx={18} fill={C.slip} stroke={C.ink} strokeWidth={8} />
        <g transform="translate(-170 -6) scale(0.34)"><ShirtBag x={0} y={0} s={0.7} tags={false} /></g>
        <text x={70} y={32} textAnchor="middle" fontFamily={SANS} fontWeight={900} fontSize={96} fill={C.ink}>FRI 7 PM</text>
        {/* his big X */}
        <path d="M -200 -80 L 200 84" stroke={C.tagRed} strokeWidth={26} strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - x1} opacity={x1 > 0 ? 1 : 0} />
        <path d="M 200 -80 L -200 84" stroke={C.tagRed} strokeWidth={26} strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - x2} opacity={x2 > 0 ? 1 : 0} />
        {x1 > 0 && x2 < 1 && (() => { const u = x1 < 1 ? x1 : x2; const sx = x1 < 1 ? lerp(-200, 200, u) : lerp(200, -200, u), sy = x1 < 1 ? lerp(-80, 84, u) : lerp(-80, 84, u); return <g transform={`translate(${sx + shake} ${sy})`}><PenSprite color={C.ink} sleeve={C.parka} skin={C.skinHim} tilt={-24} /></g>; })()}
      </g>
    </g>
  </g>;
};

// ------------------------------------------------------------------------------------------ laugh
const Laugh: React.FC<{t: number; hook: Hook}> = ({t, hook}) => {
  const him = himPose(t, hook), her = herPose(t, hook);
  const z = 1 + 0.03 * wp(t, 15.1, 16.2);
  const cam = {x: 540, y: 1000, z};
  return <g>
    <g transform={planeT(cam, 0.3)}><Far t={t} dim={0.1} /></g>
    <g transform={planeT(cam, 0.9)}>
      <Person who="him" x={255} y={1060} s={1.4} pose={him} />
      <Person who="her" x={835} y={1060} s={1.4} pose={her} />
      {/* her hand behind which she laughs */}
      <Arm who="her" sx={1180} sy={1500} hx={880 + Math.sin(t * 21) * 4} hy={928 + her.bob} w={110} />
      <Barrier y={1330} />
      {[-1, 1].map((sd) => <path key={sd} d={`M ${540 + sd * 56} 640 q ${sd * 24} -26 ${sd * 6} -52`} stroke={C.ink} strokeWidth={8} fill="none" strokeLinecap="round" opacity={0.8 * (0.5 + 0.5 * Math.sin(t * 22))} />)}
    </g>
  </g>;
};

// ------------------------------------------------------------------------------------------ phones into bags
const Bags: React.FC<{t: number; hook: Hook}> = ({t, hook}) => {
  const him = himPose(t, hook), her = herPose(t, hook);
  const dropHer = wp(t, 16.2, 16.5), dropHis = wp(t, 16.65, 16.95);
  const hHer = {x: lerp(930, 800, smooth(dropHer, 0, 0.6)), y: lerp(1010, 1060, smooth(dropHer, 0, 0.6)) + lerp(0, 150, smooth(dropHer, 0.6, 1)), vis: dropHer < 1};
  const hHis = {x: lerp(160, 290, smooth(dropHis, 0, 0.6)), y: lerp(1010, 1090, smooth(dropHis, 0, 0.6)) + lerp(0, 170, smooth(dropHis, 0.6, 1)), vis: dropHis < 1};
  const litHer = 1 - smooth(dropHer, 0.3, 1), litHis = 1 - smooth(dropHis, 0.3, 1);
  const handHer = {x: lerp(hHer.x - 10, 1150, smooth(dropHer, 0.85, 1.0) * 0 + wp(t, B.phoneHers + 0.1, B.phoneHers + 0.5)), y: lerp(hHer.y + 120, 1560, wp(t, B.phoneHers + 0.1, B.phoneHers + 0.5))};
  const handHis = {x: lerp(hHis.x + 10, -150, wp(t, B.phoneHis + 0.1, B.phoneHis + 0.5)), y: lerp(hHis.y + 120, 1560, wp(t, B.phoneHis + 0.1, B.phoneHis + 0.5))};
  const sw = Math.sin(t * 3) * 1.5;
  return <g>
    <g><Far t={t} dim={0.1} /></g>
    <Person who="him" x={300} y={880} s={0.9} pose={him} />
    <Person who="her" x={790} y={880} s={0.9} pose={her} />
    <Barrier y={1235} />
    {/* his shirt bag, pocket in front */}
    <g transform={`translate(285 1010)`}><ShirtBag x={0} y={140} s={0.85} swing={sw} /></g>
    {/* her tote back */}
    <g>
      <path d="M 700 1150 Q 700 1010 735 1010 M 900 1150 Q 900 1010 865 1010" fill="none" stroke={C.ink} strokeWidth={18} strokeLinecap="round" />
      <path d="M 700 1150 Q 700 1010 735 1010 M 900 1150 Q 900 1010 865 1010" fill="none" stroke={C.cream} strokeWidth={8} strokeLinecap="round" />
      <ellipse cx={800} cy={1118} rx={150} ry={30} fill="#1B1B2B" stroke={C.ink} strokeWidth={6} />
    </g>
    {/* phones */}
    {hHer.vis && <g><Phone id="hr" x={hHer.x} y={hHer.y} rot={lerp(8, 0, smooth(dropHer, 0, 0.6))} scale={lerp(1, 0.7, smooth(dropHer, 0, 0.8))} lit={litHer} p={0.4} thumb={0} caseColor={C.coral} skin={C.skinHer} /></g>}
    {hHis.vis && <g><Phone id="hh" x={hHis.x} y={hHis.y} rot={lerp(-6, 0, smooth(dropHis, 0, 0.6))} scale={lerp(1, 0.7, smooth(dropHis, 0, 0.8))} lit={litHis} p={0.4} thumb={0} skin={C.skinHim} /></g>}
    <Arm who="her" sx={1140} sy={1560} hx={handHer.x} hy={handHer.y} />
    <Arm who="him" sx={-60} sy={1560} hx={handHis.x} hy={handHis.y} />
    {/* tote front (covers the phone once it is in) */}
    <g>
      <path d="M 650 1130 L 950 1130 L 936 1400 L 664 1400 Z" fill={C.cream} stroke={C.ink} strokeWidth={8} strokeLinejoin="round" />
      <rect x={656} y={1250} width={288} height={36} fill={C.tagRed} />
      <path d="M 650 1130 L 950 1130" stroke={C.ink} strokeWidth={10} />
    </g>
    {/* his bag pocket */}
    <g>
      <path d="M 170 1190 L 400 1190 L 400 1400 L 170 1400 Z" fill={C.mintDeep} stroke={C.ink} strokeWidth={8} strokeLinejoin="round" />
      <path d="M 170 1190 L 400 1190" stroke={C.ink} strokeWidth={12} />
      <path d="M 190 1224 L 380 1224" stroke="#fff" strokeWidth={6} strokeDasharray="14 10" opacity={0.8} />
    </g>
  </g>;
};

// ------------------------------------------------------------------------------------------ line shuffle montage
const Shuffle: React.FC<{t: number; hook: Hook}> = ({t, hook}) => {
  const steps = [B.lineMove1, B.lineMove2, B.lineMove3];
  const st = steps.reduce((acc, s) => acc + smooth(t, s, s + 0.4), 0);
  const him = himPose(t, hook), her = herPose(t, hook);
  const pan = -st * 230;
  return <g>
    <g transform={`translate(${pan * 0.5} 0)`}><Far t={t} pan={0} /></g>
    {/* the counter ahead gets closer */}
    <g transform={`translate(${lerp(1240, 548, st / 3)} ${lerp(980, 900, st / 3)}) scale(${lerp(0.5, 0.78, st / 3)})`}>
      <rect x={-130} y={-60} width={260} height={170} fill={C.cream} stroke={C.ink} strokeWidth={8} /><rect x={-130} y={30} width={260} height={80} fill={C.teal} stroke={C.ink} strokeWidth={8} />
      <rect x={-50} y={-130} width={100} height={70} fill={C.tagRed} stroke={C.ink} strokeWidth={7} />
    </g>
    <Person who="him" x={HIM_X} y={PY} s={PS} pose={him} />
    <Person who="her" x={HER_X} y={PY} s={PS} pose={her} />
    <g transform={`translate(1000 1085) rotate(10)`}><rect x={-96} y={-70} width={190} height={150} rx={8} fill={C.tagRed} stroke={C.ink} strokeWidth={7} /><rect x={-12} y={-70} width={24} height={150} fill={C.lav} stroke={C.ink} strokeWidth={4} /></g>
    <Barrier y={1190} />
    {/* floor chevrons sliding back */}
    {[0, 1, 2, 3].map((i) => <path key={i} d={`M ${((i * 330 + pan * 1.6) % 1320 + 1320) % 1320 - 100} 1420 l 60 40 l -60 40`} fill="none" stroke={C.slip} strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" />)}
  </g>;
};

// ------------------------------------------------------------------------------------------ counter
const Counter: React.FC<{t: number; hook: Hook}> = ({t, hook}) => {
  const him = himPose(t, hook), her = herPose(t, hook);
  const clerk: Pose = {look: [0, 0.2], brow: 0, worry: 0, mouth: 'flat', happy: false, sweat: 0, gulp: 0, tilt: 0, bob: 0, sq: 1 + 0.01 * Math.sin(t * 2), blink: blinkAt(t, 0.9), flush: 0};
  const paddleUp = smooth(t, B.next - 0.05, B.next + 0.25);
  const out = smooth(t, 22.9, 23.3);
  const slipK = smooth(t, B.printer, B.printer + 0.7);
  const z = 1 + 0.04 * wp(t, 20.8, 24.6);
  const cam = {x: 540, y: 980, z};
  return <g>
    <g transform={planeT(cam, 0.3)}><Far t={t} dim={0.1} /></g>
    <g transform={planeT(cam, 0.55)}><ReturnsSign x={540} y={512} s={0.7} /></g>
    <g transform={planeT(cam, 0.8)}>
      <Person who="clerk" x={540} y={990} s={0.78} pose={clerk} />
    </g>
    <g transform={planeT(cam, 0.95)}>
      <Person who="him" x={HIM_X - 20} y={PY} s={PS} pose={him} />
      <Person who="her" x={HER_X + 20} y={PY} s={PS} pose={her} />
      {/* NEXT paddle held by the clerk */}
      <g transform={`translate(540 ${lerp(1190, 1000, paddleUp) + out * 140})`} opacity={1 - out}>
        <Arm who="clerk" sx={0} sy={260} hx={0} hy={130} w={70} />
        <rect x={-6} y={40} width={12} height={110} fill={C.steel} stroke={C.ink} strokeWidth={5} />
        <rect x={-150 + 8} y={-70 + 12} width={300} height={130} rx={14} fill={C.ink} opacity={0.4} />
        <rect x={-150} y={-70} width={300} height={130} rx={14} fill={C.tagRed} stroke={C.ink} strokeWidth={8} />
        <text x={0} y={30} textAnchor="middle" fontFamily={ANTON} fontSize={104} fill="#fff" letterSpacing={6}>NEXT</text>
      </g>
      {/* counter top */}
      <rect x={-40} y={1100} width={1160} height={60} fill={C.cream} stroke={C.ink} strokeWidth={8} />
      <rect x={-40} y={1160} width={1160} height={230} fill={C.teal} stroke={C.ink} strokeWidth={8} />
      <rect x={-40} y={1214} width={1160} height={22} fill={C.tagRed} />
      {/* ONE LINE ONLY sign */}
      <g transform="translate(258 1040)">
        <rect x={-240 + 8} y={-52 + 12} width={480} height={118} rx={12} fill={C.ink} opacity={0.4} />
        <rect x={-240} y={-52} width={480} height={118} rx={12} fill={C.slip} stroke={C.ink} strokeWidth={8} />
        <text x={0} y={32} textAnchor="middle" fontFamily={ANTON} fontSize={84} fill={C.ink} letterSpacing={3}>ONE LINE ONLY</text>
        <rect x={-30} y={64} width={60} height={34} fill={C.steel} stroke={C.ink} strokeWidth={6} />
      </g>
      {/* printer + fresh slip */}
      <g transform="translate(870 1070)">
        <rect x={-100} y={-40} width={200} height={110} rx={14} fill={C.steel} stroke={C.ink} strokeWidth={8} />
        <rect x={-70} y={-12} width={140} height={12} fill={C.ink} />
        <circle cx={70} cy={40} r={9} fill={t > B.printer && t < B.printer + 0.8 ? C.tagRed : C.mint} stroke={C.ink} strokeWidth={3} />
      </g>
      <g transform={`translate(${lerp(850, 590, slipK)} ${lerp(1060, 1146, slipK)}) rotate(${lerp(0, -4, slipK)})`}>
        {slipK > 0 && <Slip w={340} h={200} glow={0.6}>
          <text x={0} y={-30} textAnchor="middle" fontFamily={COUR} fontWeight={700} fontSize={27} fill={C.ink}>REASON FOR RETURN:</text>
          <rect x={-140} y={-10} width={280} height={64} rx={6} fill="#FFFBE0" stroke={C.ink} strokeWidth={4} />
        </Slip>}
      </g>
    </g>
  </g>;
};

// ------------------------------------------------------------------------------------------ vote board
const VoteScene: React.FC<{t: number}> = ({t}) => {
  const z = 1 + 0.02 * clamp((t - VOTE_AT) / 6);
  const a = smooth(t, B.cardA - 0.1, B.cardA + 0.3);
  return <g transform={`translate(540 960) scale(${z}) translate(-540 -960)`}>
    <Far t={t} dim={0.2} />
    <g transform={`translate(540 545) scale(${a})`} opacity={clamp(a * 2)}>
      <rect x={-380 + 10} y={-70 + 14} width={760} height={130} rx={18} fill={C.ink} opacity={0.4} />
      <rect x={-380} y={-70} width={760} height={130} rx={18} fill={C.teal} stroke={C.ink} strokeWidth={8} />
      <text x={0} y={22} textAnchor="middle" fontFamily={SANS} fontWeight={900} fontSize={76} fill="#fff" stroke={C.ink} strokeWidth={8} paintOrder="stroke">{spec.cards.vote_header}</text>
    </g>
    <VoteSlip letter="A" l1={spec.choices.A.l1} l2={spec.choices.A.l2} y={780} age={t - B.cardA} rot={-1.5} id="va" />
    <VoteSlip letter="B" l1={spec.choices.B.l1} l2={spec.choices.B.l2} y={1000} age={t - B.cardB} rot={1.5} id="vb" />
  </g>;
};

const renderShot = (t: number, hook: Hook): React.ReactNode => {
  const id = shotAt(t);
  if (id === 'B1') return <BagMedium t={t} hook={hook} />;
  if (id === 'B2') return <TagClose t={t} />;
  if (id === 'S') return <SlipInsert t={t} />;
  if (id === 'F') return <FaceClose t={t} hook={hook} />;
  if (id === 'CAL') return <Calendar t={t} />;
  if (id === 'L') return <Laugh t={t} hook={hook} />;
  if (id === 'P') return <Bags t={t} hook={hook} />;
  if (id === 'M') return <Shuffle t={t} hook={hook} />;
  if (id === 'C') return <Counter t={t} hook={hook} />;
  if (id === 'vote') return <VoteScene t={t} />;
  if (id === 'end') return <EndCard a={t - B.endcard} t={t} soft={smooth(t, B.endSoft, B.endSoft + 0.3)} />;
  return <TwoShot t={t} hook={hook} />;
};

const Scene: React.FC<{hook: Hook}> = ({hook}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const inWipe = t >= WIPE_AT && t < VOTE_AT;
  const k = inWipe ? (t - WIPE_AT) / BEAM_DUR : 0;
  const shuffleFast = (t >= 18.6 && t < 19.05) || (t >= 19.4 && t < 19.85) || (t >= 20.2 && t < 20.65);
  const fast = inWipe || shuffleFast;
  const bx = lerp(-30, 1110, smooth(k, 0, 1));
  return <>
    <MotionBlurWhen fast={fast} samples={5} shutter={220}>
      <AbsoluteFill>
        <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, background: C.cream}}>
          <Defs />
          {inWipe ? <>
            <Counter t={WIPE_AT - 0.01} hook={hook} />
            <defs><clipPath id="beamNew"><rect x={0} y={0} width={Math.max(0, bx)} height={1920} /></clipPath></defs>
            <g clipPath="url(#beamNew)"><VoteScene t={t} /></g>
            <Beam k={k} />
          </> : renderShot(t, hook)}
        </svg>
      </AbsoluteFill>
    </MotionBlurWhen>
    <AbsoluteFill>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        <Defs />
        {spec.strips.map((s, i) => {
          const isHook = (s as {hook?: boolean}).hook;
          if (isHook && (s as {hookProp?: string}).hookProp !== hook) return null;
          if (t >= s.to || t < s.from) return null;
          const comment = s.text.startsWith('comment');
          return <Strip key={i} text={s.text} y={s.y} age={t - s.from + (isHook ? 1 : 0.06)} out={isHook ? smooth(t, 2.8, 3.0) : smooth(t, s.to - 0.12, s.to)} size={comment ? 60 : 56} hot={comment} maxW={comment ? 760 : 1000} />;
        })}
      </svg>
    </AbsoluteFill>
  </>;
};

export const Returns1: React.FC<{hook?: Hook}> = ({hook = 'a'}) => (
  <AbsoluteFill style={{background: C.cream}}>
    <Audio src={staticFile('audio/returns-ep1.wav')} volume={0.9} />
    <Scene hook={hook} />
  </AbsoluteFill>
);
