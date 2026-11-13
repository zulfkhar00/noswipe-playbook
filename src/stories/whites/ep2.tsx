import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, lerp, smooth} from '../../lib/motion';
import {MotionBlurWhen} from '../../lib/shots';
import {
  Backdrop, C, Cam, CamKey, ChipCard, Counter, Defs, EndCard, FAN, FanClip, FanRim, FreeHand, Mouth, Person, PhoneUnit, Pose,
  Rack, Strip, Card, VoteBg, VoteCard, WIPE_DUR, camAt, planeT, slotAngle, slotXf, COUR, INTER,
} from './world';
import spec from '../../../specs/stories/whites-ep2.json';

// Fifty Whites, part 2 "Poppy". Silent. Frame 1 is fully composed (hook strip, two big faces, his phone lit mid-swipe,
// her big chip "which white / are you?", the fan between them). Take 1: EGGSHELL, he fades into the beige test wall.
// Rewind (fan snaps shut and opens). Take 2: POPPY, she laughs, lifts out a can with a POPPY chip taped to the lid.
// Mixing counter: MIXING / 10 MIN WAIT, one bench, his pocket buzzes. Vote at 22.0, end card 29.5.

export const WHITES2_FPS = 60;
export const WHITES2_FRAMES = Math.round(spec.duration * WHITES2_FPS);
export type Hook = 'a' | 'b';
const B = spec.beats;

const HIM = {x: 240, y: 650}, HER = {x: 840, y: 650};
const MIX_HIM_Y = 800;

type KF = number[];
const kf = (keys: KF[], t: number): number[] => {
  if (t <= keys[0][0]) return keys[0].slice(1);
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const a = keys[i - 1], b = keys[i], k = smooth(t, a[0], b[0]);
      return a.slice(1).map((v, j) => lerp(v, b[j + 1], k));
    }
  }
  return keys[keys.length - 1].slice(1);
};
const keyAt = <T,>(list: [number, T][], t: number): T => { let v = list[0][1]; for (const [a, b] of list) if (t >= a) v = b; return v; };
const wp = (t: number, a: number, b: number) => clamp((t - a) / (b - a));

// state time: the rewind freezes take 1 at its end, and take 2 starts from a clean reset
const stateTime = (t: number) => (t < 8.2 ? t : t < 8.85 ? 8.2 : t < 9.5 ? 9.5 : t);

// ------------------------------------------------------------------------------------------ poses
const HIM_LOOK: KF[] = [[0, 0.95, 0.35], [1.5, 0.95, 0.35], [1.75, 0.3, 0.8], [2.2, 0.3, 0.8], [2.4, 0.9, 0.2], [3.0, 0.9, 0.2], [3.2, 0.5, 0.85], [3.5, 0.4, 0.9], [4.1, 0.9, 0.2],
  [5.4, 0.8, 0.2], [5.9, 0.95, 0.05], [6.6, 0.95, 0.0], [7.3, 0.6, 0.5], [8.0, 0.95, 0.2],
  [9.5, 0.9, 0.2], [9.7, 0.5, 0.85], [10.0, 0.4, 0.9], [10.4, 0.9, 0.2], [13.0, 0.9, 0.1], [13.4, 0.9, 0.0], [14.5, 0.9, 0.0], [14.8, 0.7, 0.3], [15.6, 0.9, 0.2],
  [16.0, 0.9, 0.1], [17.0, 0.7, 0.6], [17.6, 0.9, 0.2], [18.7, 0.9, 0.2], [19.0, -0.55, 0.95], [19.9, -0.55, 0.95], [20.4, 0.9, 0.2], [22.0, 0.9, 0.2]];
const HER_LOOK: KF[] = [[0, -0.9, 0.3], [3.0, -0.9, 0.3], [3.4, -0.5, 0.8], [4.0, -0.9, 0.5], [4.6, -0.5, 0.7], [5.1, -0.4, 0.8], [5.4, -0.9, 0.0], [5.7, -0.9, -0.3], [6.0, 0.7, -0.2],
  [6.3, 0.0, -0.9], [6.6, -0.9, 0.2], [6.95, -0.2, 0.2], [7.2, -0.8, 0.3], [8.2, -0.8, 0.3],
  [9.5, -0.9, 0.3], [9.8, -0.5, 0.8], [10.4, -0.9, 0.4], [10.9, -0.5, 0.7], [11.2, -0.9, 0.3], [12.5, -0.9, 0.3], [12.8, -0.4, 0.9], [13.4, -0.5, 0.8], [13.9, -0.9, 0.2], [15.6, -0.9, 0.2],
  [16.0, -0.9, 0.2], [18.6, -0.9, 0.1], [22.0, -0.9, 0.1]];
const HIM_MOUTH: [number, Mouth][] = [[0, 'gulp'], [1.8, 'o'], [2.4, 'gulp'], [3.4, 'flat'], [4.1, 'smirk'], [5.0, 'gulp'], [8.0, 'o'],
  [9.5, 'gulp'], [10.0, 'flat'], [10.9, 'smirk'], [11.35, 'smile'], [13.4, 'o'], [14.7, 'laugh'], [15.9, 'smile'],
  [16.0, 'smile'], [17.5, 'smirk'], [19.0, 'gulp'], [20.4, 'grit']];
const HER_MOUTH: [number, Mouth][] = [[0, 'smirk'], [4.5, 'smile'], [5.4, 'o'], [6.4, 'flat'], [7.0, 'smirk'],
  [9.5, 'smirk'], [10.9, 'o'], [11.35, 'laugh'], [12.5, 'smile'], [13.0, 'smirk'], [14.7, 'laugh'], [15.9, 'smile'],
  [16.0, 'smile'], [17.0, 'smirk'], [18.6, 'smile'], [20.0, 'smirk']];

const blinkAt = (t: number, seed: number) => { const ph = (t + seed) % 3.7; return ph < 0.14 ? Math.sin((ph / 0.14) * Math.PI) : 0; };
const laugh = (t: number) => (t >= 11.37 && t < 12.45) || (t >= 14.72 && t < 15.9);
const GULPS = [1.9, 3.3, 9.6, 19.0];
const WALL_BLINKS = [5.9, 6.5, 7.1, 7.7];
const camoOf = (s: number) => (s < 9 ? smooth(s, 4.4, 6.0) : 0);

const himPose = (s: number): Pose => {
  const [lx, ly] = kf(HIM_LOOK, s);
  const g = Math.max(...GULPS.map((a) => Math.sin(wp(s, a, a + 0.42) * Math.PI)));
  const L = laugh(s);
  const sweat = smooth(s, 19.3, 21.8) * 0.9;
  const wallBlink = WALL_BLINKS.reduce((m, b) => Math.max(m, Math.sin(clamp((s - b) / 0.2) * Math.PI)), 0);
  const worry = Math.max(0.55 * (1 - smooth(s, 1.5, 2.0)), smooth(s, 5.0, 5.6) * (1 - smooth(s, 8.0, 8.1)) * 0.7, smooth(s, 18.8, 19.4) * (s > 18 ? 0.9 : 0));
  const raise = 0.15 + sweat * 0.3 + (s > 13.4 && s < 14.0 ? 0.6 : 0) + (s > 6.6 && s < 7.8 ? 0.4 : 0);
  return {look: [lx, ly], browL: raise, browR: raise, worry, mouth: keyAt(HIM_MOUTH, s), happy: L, sweat, gulp: g,
    tilt: L ? Math.sin(s * 22) * 3 : Math.sin(s * 0.9) * 1.1, bob: L ? -Math.abs(Math.sin(s * 22)) * 9 : 0, blink: Math.max(blinkAt(s, 0.4), wallBlink)};
};
const herPose = (s: number): Pose => {
  const [lx, ly] = kf(HER_LOOK, s);
  const L = laugh(s);
  const brow = Math.max(smooth(s, 5.1, 5.3) * (1 - smooth(s, 6.8, 7.0)) * 0.8, smooth(s, 10.85, 11.0) * (1 - smooth(s, 11.4, 11.5)) * 0.7, smooth(s, 17.4, 17.6) * (1 - smooth(s, 18.6, 18.8)) * 0.5);
  const search = s > 5.3 && s < 6.9 ? Math.sin((s - 5.3) * 6) * 5 : 0;
  const shrug = Math.sin(wp(s, 6.7, 7.25) * Math.PI);
  const walking = s > 7.15 && s < 8.3;
  return {look: [lx, ly], browL: brow, browR: 0.1, worry: 0, mouth: keyAt(HER_MOUTH, s), happy: L, sweat: 0, gulp: 0,
    tilt: L ? Math.sin(s * 21 + 1) * 3 : search || Math.sin(s * 0.8 + 2) * 1.2, bob: L ? -Math.abs(Math.sin(s * 21 + 1)) * 9 : -shrug * 16 - (walking ? Math.abs(Math.sin(s * 11)) * 8 : 0), blink: blinkAt(s, 1.9)};
};

// ------------------------------------------------------------------------------------------ cameras
const CAMK: CamKey[] = [
  {t: 0, x: 540, y: 960, z: 1.0}, {t: 3.0, x: 520, y: 950, z: 1.035}, {t: 4.6, x: 560, y: 980, z: 1.05}, {t: 5.8, x: 490, y: 950, z: 1.06},
  {t: 7.0, x: 500, y: 950, z: 1.06}, {t: 8.2, x: 540, y: 950, z: 1.04},
  {t: 9.5, x: 540, y: 960, z: 1.0}, {t: 11.0, x: 570, y: 980, z: 1.06}, {t: 13.2, x: 580, y: 1000, z: 1.05}, {t: 14.7, x: 540, y: 960, z: 1.07}, {t: 15.6, x: 540, y: 960, z: 1.05},
];
const CAMK2: CamKey[] = [{t: 15.6, x: 540, y: 960, z: 1.03}, {t: 18.0, x: 520, y: 990, z: 1.06}, {t: 22.0, x: 540, y: 960, z: 1.09}];

// ------------------------------------------------------------------------------------------ chips
const WHITES = [C.w1, C.w2, C.w3, C.w4, '#F6F0E4', '#EFE9DC', C.w3, C.poppy];
const NAMES = ['FOG', 'OAT MILK', 'PORRIDGE', 'ALMOST TUESDAY', 'TIRED CREAM', 'QUIET', 'EGGSHELL', 'POPPY'];
type Xf = {x: number; y: number; rot: number; m: number; sc: number; flip: number};
const xfOf = (K: KF[], t: number): Xf => { const [x, y, rot, m, sc, flip] = kf(K, t); return {x, y, rot, m, sc, flip}; };
const BIG_W = 460, BIG_H = 690, CH_W = 380, CH_H = 560;
const S6 = slotXf(6), S7 = slotXf(7);
const BIG_K: KF[] = [[0, 760, 1110, 5, 1, 0.9, 1], [3.0, 760, 1110, 5, 1, 0.9, 1], [3.5, 310, 1370, -10, 1, 0.46, 1], [8.4, 310, 1370, -10, 1, 0.46, 1], [9.4, 760, 1110, 5, 1, 0.9, 1],
  [9.8, 760, 1110, 5, 1, 0.9, 1], [10.2, 310, 1370, -10, 1, 0.46, 1]];
const EGG_K: KF[] = [[3.4, S6.x, S6.y, S6.rot, 0, 1, 0], [4.0, 560, 1040, -3, 1, 1, 0], [4.55, 560, 1040, -3, 1, 1, 0], [5.05, 770, 1110, 4, 1, 1, 0], [6.9, 770, 1110, 4, 1, 1, 0], [7.35, 700, 1250, 4, 1, 0.25, 0]];
const POP_K: KF[] = [[9.9, S7.x, S7.y, S7.rot, 0, 1, 0], [10.5, 560, 1040, -3, 1, 1, 0], [10.85, 560, 1040, -3, 1, 1, 0], [11.3, 770, 1110, 4, 1, 1, 0], [11.5, 770, 1100, 5, 1, 1.05, 0],
  [12.5, 770, 1100, 5, 1, 1.05, 0], [13.1, 470, 1380, -6, 1, 0.46, 0]];

const FlipChip: React.FC<{xf: Xf; w: number; h: number; swatch: string; label: string; opacity?: number; id: string}> = ({xf, w, h, swatch, label, opacity = 1, id}) => {
  const fl = Math.cos(xf.flip * Math.PI);
  const back = xf.flip > 0.5;
  const sx = Math.max(0.02, Math.abs(fl));
  const cw = lerp(FAN.w, w, xf.m), ch = lerp(FAN.len, h, xf.m);
  const lines = [{txt: spec.cards.chip_back_l1, y: -70, p: 1}, {txt: spec.cards.chip_back_l2, y: 30, p: 1}];
  return <g opacity={opacity} transform={`translate(${xf.x} ${xf.y}) rotate(${xf.rot}) scale(${xf.sc * sx} ${xf.sc})`}>
    <ChipCard w={cw} h={ch} swatch={swatch} label={label} m={xf.m} face={back ? 'back' : 'front'} lines={back ? lines : []} id={id} />
  </g>;
};

const FanDeck: React.FC<{s: number; t: number}> = ({s, t}) => {
  const sway = Math.sin(t * 1.3) * 0.5;
  const present = (i: number) => (s < 3.4 ? i !== 7 : s < 9.5 ? i !== 7 && i !== 6 : s < 9.9 ? true : i !== 7);
  return <g transform={`rotate(${sway} ${FAN.px} ${FAN.py})`}>
    {Array.from({length: 8}, (_, i) => present(i) ? <g key={i} transform={`translate(${FAN.px} ${FAN.py}) rotate(${slotAngle(i, 8, 1)}) translate(0 ${-FAN.len / 2})`}>
      <ChipCard w={FAN.w} h={FAN.len} swatch={WHITES[i]} label={NAMES[i]} m={0} id={`f${i}`} />
    </g> : null)}
    <circle cx={FAN.px} cy={FAN.py - 40} r={16} fill={C.navy} />
  </g>;
};

// ------------------------------------------------------------------------------------------ basket + can
const Basket: React.FC<{part: 'back' | 'front'}> = ({part}) => part === 'back'
  ? <path d="M 640 1200 Q 640 1010 790 1010 Q 940 1010 940 1200" fill="none" stroke={C.navy} strokeWidth={26} strokeLinecap="round" />
  : <g>
    <rect x={606} y={1196} width={368} height={176} rx={26} fill="#D9A55B" stroke={C.navy} strokeWidth={6} />
    {Array.from({length: 7}, (_, i) => <line key={i} x1={606} x2={974} y1={1226 + i * 24} y2={1226 + i * 24} stroke="#A9772F" strokeWidth={4} />)}
    {Array.from({length: 9}, (_, i) => <line key={i} y1={1196} y2={1372} x1={650 + i * 40} x2={650 + i * 40} stroke="#A9772F" strokeWidth={3} opacity={0.6} />)}
    <rect x={596} y={1186} width={388} height={24} rx={12} fill="#C98F3E" stroke={C.navy} strokeWidth={6} />
  </g>;

const CAN_UP = {x: 790, y: 930};
const PaintCan: React.FC<{poppy: boolean}> = () => <g>
  <path d="M -150 0 L -150 220 Q -150 250 -120 250 L 120 250 Q 150 250 150 220 L 150 0 Z" fill="#C9D2E6" stroke={C.navy} strokeWidth={6} />
  <rect x={-146} y={70} width={292} height={110} fill={C.w1} stroke={C.navy} strokeWidth={4} />
  <circle cx={-80} cy={125} r={30} fill={C.poppy} stroke={C.navy} strokeWidth={4} />
  <rect x={-30} y={104} width={150} height={14} rx={7} fill={C.navy} opacity={0.5} /><rect x={-30} y={132} width={100} height={14} rx={7} fill={C.navy} opacity={0.35} />
  <ellipse cx={0} cy={0} rx={160} ry={104} fill="#DCE3F2" stroke={C.navy} strokeWidth={6} />
  <ellipse cx={0} cy={0} rx={136} ry={82} fill="#B6C0D6" stroke={C.navy} strokeWidth={4} />
  <g transform="rotate(-9) scale(1 0.8)">
    <ChipCard w={236} h={200} swatch={C.poppy} label="POPPY" m={1} id="canchip" />
    <rect x={-132} y={-120} width={78} height={30} fill="#FFE9A0" opacity={0.9} stroke="#00000022" strokeWidth={2} transform="rotate(-24 -90 -105)" />
    <rect x={56} y={-118} width={78} height={30} fill="#FFE9A0" opacity={0.9} stroke="#00000022" strokeWidth={2} transform="rotate(22 96 -103)" />
  </g>
</g>;
const canRise = (s: number) => smooth(s, 13.2, 13.7);

// ------------------------------------------------------------------------------------------ phones
const swipeOf = (ticks: number[], t: number) => {
  let idx = -1;
  for (let i = 0; i < ticks.length; i++) if (ticks[i] <= t) idx = i;
  if (idx < 0) return {p: 0, dir: 1};
  return {p: clamp((t - ticks[idx]) / 0.26), dir: idx % 2 ? -1 : 1};
};
const HIM_TICKS = [-0.1, 0.2, 0.5, 0.8, 1.1, 1.4];

// the part's own payoff: her can lid with the POPPY chip taped on, next to his POPPY chip, big and centered
const CloseUp: React.FC<{s: number; t: number}> = ({s, t}) => {
  const op = wp(s, 13.65, 13.8) * (1 - wp(s, 14.55, 14.7));
  if (op <= 0.01) return null;
  const k = 1 + 0.06 * Math.sin(clamp((s - 13.7) / 0.5) * Math.PI) - 0.06 * smooth(s, 13.8, 14.6);
  const bob = Math.sin(t * 3) * 4;
  return <g opacity={op}>
    <rect x={-50} y={-50} width={1180} height={2100} fill="url(#wallg)" />
    <rect x={-50} y={-50} width={1180} height={2100} fill="url(#peg)" />
    <g transform={`translate(290 ${700 + bob}) scale(${1.32 * k})`}><PaintCan poppy /></g>
    <g transform={`translate(770 ${790 - bob}) scale(${1.12 * k})`}><ChipCard w={CH_W} h={CH_H} swatch={C.poppy} label="POPPY" m={1} id="cu" /></g>
    {[{x: 290, l: 'HER CAN'}, {x: 770, l: 'MY CHIP'}].map(({x, l}) => <g key={l} transform={`translate(${x} 470)`}>
      <rect x={-150} y={-58} width={300} height={84} rx={18} fill="#FFFFFF" stroke={C.navy} strokeWidth={7} />
      <text y={6} textAnchor="middle" fontFamily={INTER} fontWeight={800} fontSize={52} fill={C.navy}>{l}</text>
      <path d="M -18 34 L 0 62 L 18 34 Z" fill={C.navy} />
    </g>)}
    <g transform="translate(540 1250)"><text textAnchor="middle" fontFamily={INTER} fontWeight={800} fontSize={86} fill={C.poppy} stroke={C.navy} strokeWidth={3}>same pink.</text></g>
  </g>;
};

// ------------------------------------------------------------------------------------------ main scene
const hand = (who: 'him' | 'her', hx: number, hy: number, rot: number, thumb: number, base: [number, number], op: number) =>
  op > 0.02 ? <FreeHand who={who} hx={hx} hy={hy} rot={rot} thumb={thumb} base={base} opacity={clamp(op * 1.5)} /> : null;

const MainScene: React.FC<{s: number; t: number}> = ({s, t}) => {
  const cam: Cam = camAt(CAMK, s);
  const w = {...cam, x: cam.x + Math.sin(t * 0.8) * 3, y: cam.y + Math.sin(t * 1.1) * 2};
  const camo = camoOf(s);
  const big = xfOf(BIG_K, s), egg = xfOf(EGG_K, s), pop = xfOf(POP_K, s);
  const walkDx = s < 9 ? -130 * smooth(s, 7.15, 8.0) : 0;
  const hs = swipeOf(HIM_TICKS, s);
  const phoneY = lerp(1050, 1900, smooth(s, 1.8, 2.3));
  const rise = canRise(s);
  const eggOn = s >= 3.4 && s < 9, popOn = s >= 9.9;
  const bigHand = s < 3.4 ? 1 - wp(s, 3.0, 3.4) : s >= 9.4 && s < 10.2 ? 1 - wp(s, 9.8, 10.2) : 0;
  const eggHim = wp(s, 3.7, 3.9) * (1 - wp(s, 4.6, 4.9));
  const eggHer = wp(s, 4.6, 4.8) * (1 - wp(s, 6.9, 7.2));
  const popHim = wp(s, 10.1, 10.3) * (1 - wp(s, 10.9, 11.15));
  const popHer = wp(s, 10.85, 11.0) * (1 - wp(s, 12.5, 12.8));
  const canHand = wp(s, 13.2, 13.4) * (1 - wp(s, 13.65, 13.8));
  return <g>
    <g transform={planeT(w, 0.2)}><Backdrop /></g>
    <g transform={planeT(w, 0.3)}><Rack t={t} ding={0} showSpk={0} /></g>
    <g transform={planeT(w, 0.9)}>
      {/* the beige test wall behind him */}
      <g>
        <rect x={-250} y={330} width={900} height={1000} fill={C.w3} stroke={C.navy} strokeWidth={8} />
        <rect x={-250} y={330} width={900} height={70} fill="#D8CCAF" />
        {[-190, -20, 150, 320].map((x, i) => <rect key={x} x={x} y={346} width={120} height={38} rx={6} fill={[C.w2, C.w4, C.w1, '#E3D5B6'][i]} stroke={C.navy} strokeWidth={3} />)}
        {[-210, 600].map((x) => <rect key={x} x={x} y={322} width={70} height={24} fill="#FFE9A0" opacity={0.85} />)}
      </g>
      <Person who="him" x={HIM.x} y={HIM.y} t={t} pose={himPose(s)} seed={0.4} camo={camo} />
      <Person who="her" x={HER.x + walkDx} y={HER.y} t={t} pose={herPose(s)} seed={1.9} />
    </g>
    <g transform={planeT(w, 1.0)}>
      <FanDeck s={s} t={t} />
      <Counter />
    </g>
    <g transform={planeT(w, 1.1)}>
      <PhoneUnit who="her" x={820} y={1480} rot={-8} lit={0} p={0} dir={1} down={1} thumbOn={0} />
      <Basket part="back" />
      <g clipPath="url(#canclip)">
        <clipPath id="canclip"><rect x={500} y={300} width={600} height={900} /></clipPath>
        {s >= 13.2 && s < 13.9 && <g transform={`translate(${CAN_UP.x} ${CAN_UP.y + (1 - rise) * 380}) rotate(${(1 - rise) * 6})`}><PaintCan poppy /></g>}
      </g>
      <Basket part="front" />
      <FlipChip xf={big} w={BIG_W} h={BIG_H} swatch={C.w2} label="" id="big" />
      {eggOn && <FlipChip xf={egg} w={CH_W} h={CH_H} swatch={C.w3} label={spec.cards.chip_A} opacity={wp(s, 3.4, 3.47) * (1 - wp(s, 7.2, 7.4))} id="egg" />}
      {popOn && <FlipChip xf={pop} w={CH_W} h={CH_H} swatch={C.poppy} label={spec.cards.chip_B} opacity={wp(s, 9.9, 9.96)} id="pop" />}
      {hand('her', big.x + big.sc * 195, big.y + big.sc * 330, 12, 0.6, [1100, 2100], bigHand)}
      {hand('him', egg.x - egg.sc * 190, egg.y + egg.sc * 240, -14, 0.5, [120, 2100], eggHim)}
      {hand('her', egg.x + egg.sc * 190, egg.y + egg.sc * 240, 12, 0.6, [1100, 2100], eggHer)}
      {hand('him', pop.x - pop.sc * 190, pop.y + pop.sc * 240, -14, 0.5, [120, 2100], popHim)}
      {hand('her', pop.x + pop.sc * 190, pop.y + pop.sc * 240, 12, 0.6, [1100, 2100], popHer)}
      {hand('her', CAN_UP.x + 190, CAN_UP.y + 190 + (1 - rise) * 380, 8, 0.7, [1100, 2100], canHand * 1)}
    </g>
    <CloseUp s={s} t={t} />
    <g transform={planeT(w, 1.04)}>
      {s < 2.5 && <PhoneUnit rich scale={1.5} who="him" x={175} y={phoneY - 20} rot={8} lit={1} p={s < 1.7 ? hs.p : 0} dir={hs.dir} down={0} thumbOn={s < 1.7 ? 1 : 0} />}
    </g>
  </g>;
};

// ------------------------------------------------------------------------------------------ mixing counter
const Bench: React.FC = () => <g>
  {[360, 960].map((x) => <g key={x}>
    <rect x={x - 18} y={1340} width={36} height={250} fill="#9B6A3A" stroke={C.navy} strokeWidth={6} />
    <rect x={x - 40} y={1580} width={80} height={16} rx={6} fill={C.navy} />
  </g>)}
  <rect x={300} y={1230} width={26} height={110} rx={10} fill="#9B6A3A" stroke={C.navy} strokeWidth={6} />
  <rect x={994} y={1230} width={26} height={110} rx={10} fill="#9B6A3A" stroke={C.navy} strokeWidth={6} />
  <rect x={290} y={1214} width={52} height={26} rx={12} fill="#B57F48" stroke={C.navy} strokeWidth={6} />
  <rect x={978} y={1214} width={52} height={26} rx={12} fill="#B57F48" stroke={C.navy} strokeWidth={6} />
  <rect x={300} y={1290} width={720} height={74} rx={14} fill="#D9A55B" stroke={C.navy} strokeWidth={7} />
  {[1316, 1340].map((y) => <line key={y} x1={304} x2={1016} y1={y} y2={y} stroke="#A9772F" strokeWidth={4} />)}
  <rect x={312} y={1296} width={696} height={12} rx={6} fill="#FFD790" />
  <rect x={300} y={1364} width={720} height={40} rx={8} fill="#B57F48" stroke={C.navy} strokeWidth={6} />
  <text x={830} y={1394} textAnchor="middle" fontFamily={INTER} fontWeight={800} fontSize={28} fill={C.navy} letterSpacing={6}>WAIT HERE</text>
</g>;

const Sign: React.FC<{t: number}> = ({t}) => <g transform="translate(540 500)">
  <line x1={-380} y1={-96} x2={-380} y2={-190} stroke={C.navy} strokeWidth={8} /><line x1={380} y1={-96} x2={380} y2={-190} stroke={C.navy} strokeWidth={8} />
  <rect x={-452} y={-84} width={904} height={190} rx={22} fill={C.navy} opacity={0.2} transform="translate(12 16)" />
  <rect x={-452} y={-96} width={904} height={190} rx={22} fill="#fff" stroke={C.navy} strokeWidth={8} />
  <rect x={-432} y={-76} width={864} height={150} rx={14} fill="#0E1630" />
  <text x={0} y={-10} textAnchor="middle" fontFamily={COUR} fontWeight={700} fontSize={74} fill={C.sun}>MIXING</text>
  <text x={0} y={60} textAnchor="middle" fontFamily={COUR} fontWeight={700} fontSize={64} fill={C.sun}>10 MIN WAIT</text>
  <circle cx={-398} cy={-52} r={10} fill={C.poppy} opacity={0.5 + 0.5 * Math.sin(t * 6)} />
</g>;

const Machine: React.FC<{t: number}> = ({t}) => <g>
  <rect x={400} y={640} width={220} height={640} rx={20} fill={C.cobalt} stroke={C.navy} strokeWidth={8} />
  <rect x={420} y={680} width={180} height={40} rx={8} fill={C.w1} opacity={0.8} />
  <rect x={426} y={770} width={168} height={290} rx={14} fill="#0E1630" stroke={C.navy} strokeWidth={5} />
  <g transform={`translate(${510 + Math.sin(t * 45) * 6} ${910 + Math.sin(t * 38) * 4})`}>
    <rect x={-56} y={-90} width={112} height={170} rx={12} fill="#C9D2E6" stroke="#fff" strokeWidth={4} /><rect x={-56} y={-40} width={112} height={50} fill={C.poppy} />
  </g>
</g>;

const MixScene: React.FC<{t: number}> = ({t}) => {
  const cam = camAt(CAMK2, t);
  const w = {...cam, x: cam.x + Math.sin(t * 0.8) * 3, y: cam.y + Math.sin(t * 1.1) * 2};
  const sit = smooth(t, 16.4, 16.95) * (1 + 0.06 * Math.sin(wp(t, 16.8, 17.2) * Math.PI));
  const herY = MIX_HIM_Y + 100 * sit;
  const up = smooth(t, 18.8, 19.15);
  const buzz = t >= 18.8 ? 1 : 0;
  const shake = buzz ? Math.sin(t * 90) * 3 * (0.5 + 0.5 * Math.sin(t * 9) ** 2) : 0;
  const patK = t >= 17.5 && t < 18.7 ? Math.abs(Math.sin((t - 17.5) * 6.6)) : 0;
  const patOp = wp(t, 17.3, 17.5) * (1 - wp(t, 18.6, 18.9));
  const hx = 520, hy = 1305 - 34 * patK;
  return <g>
    <g transform={planeT(w, 0.2)}><Backdrop /></g>
    <g transform={planeT(w, 0.3)}><Rack t={t} ding={0} showSpk={0} /></g>
    <g transform={planeT(w, 0.5)}><g transform="translate(0 60)"><Machine t={t} /></g><Sign t={t} /></g>
    <g transform={planeT(w, 0.9)}>
      <Person who="him" x={HIM.x} y={MIX_HIM_Y} t={t} pose={himPose(t)} seed={0.4} />
      <Person who="her" x={760} y={herY} t={t} pose={herPose(t)} seed={1.9} />
      {up > 0.01 && <circle cx={170} cy={1180} r={420} fill="url(#glow)" opacity={up * (0.75 + 0.25 * Math.sin(t * 14))} />}
      {up > 0.01 && <g transform={`translate(${170 + shake} ${1322 + (1 - up) * 190}) rotate(-12) scale(1.7)`}>
        <rect x={-60} y={-190} width={120} height={200} rx={16} fill="#fff" />
        <rect x={-50} y={-180} width={100} height={180} rx={10} fill={up > 0.3 ? 'url(#scr)' : '#1A2442'} />
        {up > 0.3 && <g transform="translate(0 -92) scale(0.74)"><Card rich /></g>}
      </g>}
      <path d="M -10 1322 Q 140 1350 290 1322 L 300 1480 L -20 1480 Z" fill={C.hoodieDeep} stroke={C.hoodieDeep} strokeWidth={4} />
    </g>
    <g transform={planeT(w, 1.05)}><g transform="translate(0 60)"><Bench /></g></g>
    <g transform={planeT(w, 1.1)}>
      <PhoneUnit who="her" x={1000} y={1470} rot={-8} lit={0} p={0} dir={1} down={1} thumbOn={0} />
      {patOp > 0.02 && <g opacity={clamp(patOp * 1.5)}><FreeHand who="her" hx={hx} hy={hy} rot={4} thumb={0} style="palm" wiggle={0} base={[760, 1420]} /></g>}
    </g>
  </g>;
};

// ------------------------------------------------------------------------------------------ vote + edit
const VoteScene: React.FC<{t: number}> = ({t}) => {
  const z = 1 + 0.025 * clamp((t - 22.5) / 7);
  return <g transform={`translate(540 960) scale(${z}) translate(-540 -960)`}>
    <VoteBg t={t} />
    <VoteCard letter="A" l1={spec.choices.A.l1} l2={spec.choices.A.l2} y={640} age={t - B.cardA} swatch={C.mint} rot={-1.5} t={t} />
    <VoteCard letter="B" l1={spec.choices.B.l1} l2={spec.choices.B.l2} y={940} age={t - B.cardB} swatch={C.sun} rot={1.5} t={t} />
  </g>;
};

const RewindGlyph: React.FC<{a: number}> = ({a}) => <g transform={`translate(540 960) scale(${0.9 + 0.2 * Math.sin(a * 3)})`} opacity={smooth(a, 0, 0.1) * (1 - smooth(a, 0.7, 0.9))}>
  {[-1, 1].map((i) => <path key={i} transform={`translate(${i * 78} 0)`} d="M 70 -80 L -70 0 L 70 80 Z" fill={C.sun} stroke={C.navy} strokeWidth={14} strokeLinejoin="round" />)}
</g>;

type Mode = {kind: 'plain'; shot: 'main' | 'mix' | 'vote' | 'end'} | {kind: 'wipe'; k: number; under: 'main' | 'mix' | 'rew' | 'none'; over: 'main' | 'mix' | 'vote'; sUnder?: number; sOver?: number};
const modeAt = (t: number): Mode => {
  if (t < 8.2) return {kind: 'plain', shot: 'main'};
  if (t < 8.7) { const e = smooth(t, 8.2, 8.7); return {kind: 'wipe', k: 1 - e, under: 'none', over: 'main', sOver: 8.2}; }
  if (t < 8.85) return {kind: 'wipe', k: 0, under: 'none', over: 'main', sOver: 9.5};
  if (t < 9.55) return {kind: 'wipe', k: (t - 8.85) / WIPE_DUR, under: 'none', over: 'main', sOver: 9.5};
  if (t < B.mixWipe) return {kind: 'plain', shot: 'main'};
  if (t < B.mixWipe + WIPE_DUR) return {kind: 'wipe', k: (t - B.mixWipe) / WIPE_DUR, under: 'main', over: 'mix', sUnder: B.mixWipe};
  if (t < B.voteWipe) return {kind: 'plain', shot: 'mix'};
  if (t < B.voteWipe + WIPE_DUR) return {kind: 'wipe', k: (t - B.voteWipe) / WIPE_DUR, under: 'mix', over: 'vote'};
  return {kind: 'plain', shot: t < B.endcard ? 'vote' : 'end'};
};
const FAST: [number, number][] = [[3.35, 3.95], [4.45, 5.1], [7.1, 8.2], [9.85, 10.5], [10.75, 11.4], [13.1, 13.95]];

const renderShot = (id: string, t: number, s?: number): React.ReactNode => {
  switch (id) {
    case 'main': return <MainScene s={s ?? stateTime(t)} t={t} />;
    case 'mix': return <MixScene t={t} />;
    case 'vote': return <VoteScene t={t} />;
    case 'end': return <EndCard a={t - B.endcard} t={t} part={3} />;
    default: return null;
  }
};

const Scene: React.FC<{hook: Hook}> = ({hook}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const mode = modeAt(t);
  const rewinding = t >= 8.2 && t < 9.55;
  const fast = mode.kind === 'wipe' || FAST.some(([a, b]) => t >= a && t < b);
  return <>
    <MotionBlurWhen fast={fast} samples={5} shutter={mode.kind === 'wipe' ? 220 : 150}>
      <AbsoluteFill>
        <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, background: C.wall}}>
          <Defs />
          {mode.kind === 'plain' ? renderShot(mode.shot, t) : <>
            {mode.under === 'none' ? <VoteBg t={t} /> : renderShot(mode.under, t, mode.sUnder)}
            <defs><FanClip k={mode.k} /></defs>
            <g clipPath="url(#fanclip)">{renderShot(mode.over, t, mode.sOver)}</g>
            <FanRim k={mode.k} />
          </>}
          {rewinding && <RewindGlyph a={t - 8.3} />}
        </svg>
      </AbsoluteFill>
    </MotionBlurWhen>
    <AbsoluteFill>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        {spec.strips.map((st, i) => {
          const isHook = (st as {hook?: boolean}).hook;
          const text = isHook ? (spec.hooks as Record<string, string>)[hook] : st.text;
          if (t >= st.to || t < st.from) return null;
          const comment = st.text.startsWith('comment');
          return <Strip key={i} text={text} y={st.y} age={t - st.from + (isHook ? 1 : 0.06)} out={isHook ? smooth(t, 2.85, 3.0) : smooth(t, st.to - 0.12, st.to)} size={isHook ? 56 : comment ? 76 : 60} hot={comment} rot={comment || isHook ? 0 : i % 2 ? 0.6 : -0.6} />;
        })}
      </svg>
    </AbsoluteFill>
  </>;
};

export const Whites2: React.FC<{hook?: Hook}> = ({hook = 'a'}) => (
  <AbsoluteFill style={{background: C.wall}}>
    <Audio src={staticFile('audio/whites-ep2.wav')} volume={0.9} />
    <Scene hook={hook} />
  </AbsoluteFill>
);
