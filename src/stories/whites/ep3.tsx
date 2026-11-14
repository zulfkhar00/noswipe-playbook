import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, lerp, smooth} from '../../lib/motion';
import {MotionBlurWhen} from '../../lib/shots';
import {
  Backdrop, C, Cam, CamKey, ChipCard, Defs, EndCard, FanClip, FanRim, FreeHand, Mouth, Person, PhoneUnit, Pose,
  Rack, Strip, VoteBg, VoteCard, WIPE_DUR, camAt, planeT, textW, COUR, INTER,
} from './world';
import spec from '../../../specs/stories/whites-ep3.json';

// Fifty Whites, part 3 "Mixing". Silent. One bench at the mixing counter: sign MIXING / 10 MIN WAIT, paint shaker rattling
// behind (her POPPY-lidded can in it), a basket with a brush across it, a sample board at the right. Frame 1 is fully
// composed (hook strip, two big faces, his phone lit mid-swipe). Take 1: he scrolls his matches (seen 3 wks ago), she pats
// his shoulder. Rewind. Take 2: phone into the basket, pencil-on-chain chips, shared laugh (shaker stops, bossa drops out),
// clerk slides two cans (both lids POPPY), she dabs a test square and holds out the brush. Vote 23.0, end card 30.5.

export const WHITES3_FPS = 60;
export const WHITES3_FRAMES = Math.round(spec.duration * WHITES3_FPS);
export type Hook = 'a' | 'b';
const B = spec.beats;

const HIM = {x: 240, y: 790}, HER = {x: 760, y: 810};

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

const stateTime = (t: number) => (t < 8.2 ? t : t < 8.85 ? 8.2 : t < 9.5 ? 9.5 : t);

// ------------------------------------------------------------------------------------------ poses
const HIM_LOOK: KF[] = [[0, 0.1, 0.9], [1.6, 0.1, 0.9], [1.8, 0.9, 0.3], [2.4, 0.9, 0.3], [2.7, 0.2, 0.8], [3.0, 0.2, 0.8], [3.4, 0.5, 0.5], [4.2, 0.2, 0.9], [5.9, 0.15, 0.9], [6.2, 0.9, 0.3], [6.6, 0.3, 0.7], [7.9, 0.2, 0.8], [8.2, 0.6, 0.4],
  [9.5, 0.2, 0.9], [10.3, 0.2, 0.8], [10.6, 0.5, 0.8], [11.0, 0.3, 0.9], [11.4, 0.2, 0.9], [12.3, 0.9, 0.4], [14.6, 0.9, 0.3], [14.9, 0.3, 0.9], [15.4, 0.2, 0.9], [16.1, 0.9, 0.2], [20.0, 0.9, 0.2], [20.6, 0.6, 0.8], [23.0, 0.6, 0.8]];
const HER_LOOK: KF[] = [[0, -0.8, 0.3], [1.5, -0.8, 0.3], [1.7, -0.55, 0.95], [2.3, -0.55, 0.95], [2.6, -0.9, 0.3], [4.3, -0.9, 0.3], [4.6, -0.5, 0.9], [6.3, -0.5, 0.9], [6.6, -0.9, 0.3], [8.2, -0.9, 0.3],
  [9.5, -0.9, 0.3], [11.3, -0.5, 0.9], [12.4, -0.9, 0.3], [12.8, -0.5, 0.9], [13.4, -0.2, 0.9], [14.6, -0.9, 0.3], [15.2, -0.9, 0.3], [16.4, -0.5, 0.9], [16.9, -0.9, 0.2], [20.0, -0.4, 0.8], [20.6, -0.8, 0.3], [21.4, -0.9, 0.2], [23.0, -0.9, 0.2]];
const HIM_MOUTH: [number, Mouth][] = [[0, 'gulp'], [1.9, 'o'], [2.5, 'gulp'], [3.2, 'flat'], [5.0, 'gulp'], [6.5, 'flat'], [8.0, 'o'],
  [9.5, 'gulp'], [10.9, 'smirk'], [12.3, 'smile'], [14.9, 'smirk'], [15.5, 'smile'], [16.95, 'laugh'], [18.0, 'smile'], [20.5, 'gulp'], [21.5, 'grit']];
const HER_MOUTH: [number, Mouth][] = [[0, 'smirk'], [1.7, 'o'], [2.3, 'smirk'], [5.0, 'grit'], [6.4, 'flat'], [7.9, 'smirk'],
  [9.5, 'smirk'], [12.6, 'smirk'], [13.0, 'smile'], [14.7, 'smirk'], [16.4, 'smile'], [16.95, 'laugh'], [18.0, 'smile'], [20.0, 'smirk'], [21.3, 'smile']];

const blinkAt = (t: number, seed: number) => { const ph = (t + seed) % 3.7; return ph < 0.14 ? Math.sin((ph / 0.14) * Math.PI) : 0; };
const laugh = (t: number) => t >= 16.97 && t < 18.0;
const GULPS = [1.9, 5.0, 9.6, 21.6];

const himPose = (s: number): Pose => {
  const [lx, ly] = kf(HIM_LOOK, s);
  const g = Math.max(...GULPS.map((a) => Math.sin(wp(s, a, a + 0.42) * Math.PI)));
  const L = laugh(s);
  const sweat = s > 20 ? smooth(s, 21.2, 22.8) * 0.8 : 0;
  const worry = Math.max(0.5 * (1 - smooth(s, 1.5, 2.0)), smooth(s, 5.0, 5.6) * (1 - smooth(s, 8.0, 8.1)) * 0.8, smooth(s, 20.5, 21.3) * 0.7 * (s > 20 ? 1 : 0));
  const raise = 0.15 + sweat * 0.3 + (s > 1.8 && s < 2.5 ? 0.5 : 0);
  return {look: [lx, ly], browL: raise, browR: raise, worry, mouth: keyAt(HIM_MOUTH, s), happy: L, sweat, gulp: g,
    tilt: L ? Math.sin(s * 22) * 3 : Math.sin(s * 0.9) * 1.1, bob: L ? -Math.abs(Math.sin(s * 22)) * 9 : 0, blink: blinkAt(s, 0.4)};
};
const herPose = (s: number): Pose => {
  const [lx, ly] = kf(HER_LOOK, s);
  const L = laugh(s);
  const wince = smooth(s, 5.0, 5.3) * (1 - smooth(s, 6.5, 6.8));
  const brow = Math.max(smooth(s, 1.7, 1.9) * (1 - smooth(s, 2.4, 2.6)) * 0.7, wince * 0.5, smooth(s, 13.3, 13.5) * (1 - smooth(s, 13.8, 14.0)) * 0.4);
  return {look: [lx, ly], browL: brow, browR: 0.1, worry: wince * 0.95, mouth: keyAt(HER_MOUTH, s), happy: L, sweat: 0, gulp: 0,
    tilt: L ? Math.sin(s * 21 + 1) * 3 : -wince * 3 + Math.sin(s * 0.8 + 2) * 1.2, bob: L ? -Math.abs(Math.sin(s * 21 + 1)) * 9 : 0, blink: blinkAt(s, 1.9)};
};

// ------------------------------------------------------------------------------------------ cameras
const CAMK: CamKey[] = [
  {t: 0, x: 540, y: 960, z: 1.0}, {t: 3.0, x: 530, y: 960, z: 1.02}, {t: 5.5, x: 550, y: 980, z: 1.04}, {t: 8.2, x: 540, y: 960, z: 1.03},
  {t: 9.5, x: 540, y: 960, z: 1.0}, {t: 12.0, x: 540, y: 970, z: 1.035}, {t: 16.9, x: 540, y: 960, z: 1.05}, {t: 20.5, x: 580, y: 975, z: 1.05}, {t: 23.0, x: 560, y: 970, z: 1.06},
];

// ------------------------------------------------------------------------------------------ props
const BT = 1350;   // bench seat top
const Bench: React.FC = () => <g>
  {[360, 960].map((x) => <g key={x}>
    <rect x={x - 18} y={BT + 40} width={36} height={250} fill="#9B6A3A" stroke={C.navy} strokeWidth={6} />
    <rect x={x - 40} y={BT + 280} width={80} height={16} rx={6} fill={C.navy} />
  </g>)}
  <rect x={-40} y={BT} width={1160} height={74} rx={14} fill="#D9A55B" stroke={C.navy} strokeWidth={7} />
  {[BT + 26, BT + 50].map((y) => <line key={y} x1={-36} x2={1116} y1={y} y2={y} stroke="#A9772F" strokeWidth={4} />)}
  <rect x={-28} y={BT + 6} width={1136} height={12} rx={6} fill="#FFD790" />
  <rect x={-40} y={BT + 74} width={1160} height={40} rx={8} fill="#B57F48" stroke={C.navy} strokeWidth={6} />
</g>;

const Sign: React.FC<{t: number}> = ({t}) => <g transform="translate(540 530)">
  <rect x={-370} y={-46} width={760} height={110} rx={20} fill={C.navy} opacity={0.2} />
  <rect x={-380} y={-56} width={760} height={110} rx={20} fill="#fff" stroke={C.navy} strokeWidth={8} />
  <rect x={-362} y={-40} width={724} height={78} rx={12} fill="#0E1630" />
  <text x={8} y={20} textAnchor="middle" fontFamily={COUR} fontWeight={700} fontSize={50} fill={C.sun} letterSpacing={1}>MIXING · 10 MIN WAIT</text>
  <circle cx={-340} cy={-22} r={8} fill={C.poppy} opacity={0.5 + 0.5 * Math.sin(t * 6)} />
</g>;

// her can (POPPY chip taped on the lid): in the shaker until the clerk takes it
const ShakerCan: React.FC = () => <g>
  <path d="M -56 -20 L -56 118 Q -56 134 -40 134 L 40 134 Q 56 134 56 118 L 56 -20 Z" fill="#C9D2E6" stroke="#fff" strokeWidth={4} />
  <rect x={-54} y={20} width={108} height={70} fill={C.w1} /><circle cx={-24} cy={55} r={17} fill={C.poppy} /><rect x={2} y={44} width={44} height={9} rx={4} fill={C.navy} opacity={0.5} />
  <ellipse cx={0} cy={-20} rx={58} ry={20} fill="#DCE3F2" stroke="#fff" strokeWidth={4} />
  <g transform="translate(0 -26) rotate(-8)">
    <rect x={-46} y={-30} width={92} height={46} rx={5} fill={C.poppy} stroke={C.navy} strokeWidth={3} />
    <text y={4} x={0} textAnchor="middle" fontFamily={INTER} fontWeight={800} fontSize={20} fill={C.navy}>POPPY</text>
    <rect x={-54} y={-32} width={30} height={12} fill="#FFE9A0" opacity={0.9} transform="rotate(-24 -40 -26)" /><rect x={24} y={-32} width={30} height={12} fill="#FFE9A0" opacity={0.9} transform="rotate(22 40 -26)" />
  </g>
</g>;

const Machine: React.FC<{t: number; rattling: boolean; canIn: boolean; stopK: number}> = ({t, rattling, canIn, stopK}) => {
  const sh = rattling ? 1 : stopK > 0 ? Math.exp(-stopK * 14) : 0;
  const jx = Math.sin(t * 95) * 7 * sh, jy = Math.sin(t * 83) * 5 * sh;
  return <g transform={`translate(${Math.sin(t * 71) * 2.5 * sh} 0)`}>
    <rect x={396} y={600} width={228} height={900} rx={20} fill={C.cobalt} stroke={C.navy} strokeWidth={8} />
    <rect x={416} y={618} width={188} height={26} rx={8} fill={C.w1} opacity={0.8} />
    <rect x={424} y={652} width={172} height={286} rx={14} fill="#0E1630" stroke={C.navy} strokeWidth={5} />
    {canIn && <g transform={`translate(${510 + jx} ${748 + jy})`}><ShakerCan /></g>}
    {sh > 0.05 && [-1, 1].map((d) => <g key={d} opacity={0.8 * sh}>
      {[0, 1].map((i) => <path key={i} d={`M ${510 + d * (112 + i * 16)} 700 Q ${510 + d * (126 + i * 16)} 760 ${510 + d * (112 + i * 16)} 820`} fill="none" stroke="#fff" strokeWidth={5} strokeLinecap="round" />)}
    </g>)}
  </g>;
};

const Board: React.FC = () => <g>
  <rect x={930} y={592} width={150} height={450} rx={10} fill="#E8D5B0" stroke={C.navy} strokeWidth={7} />
  <text x={1008} y={640} textAnchor="middle" fontFamily={COUR} fontWeight={700} fontSize={30} fill={C.navy}>TEST</text>
  {[C.w2, C.w3, C.w4].map((c, i) => <rect key={i} x={952} y={654 + i * 92} width={104} height={82} rx={8} fill={c} stroke={C.navy} strokeWidth={4} />)}
  <rect x={952} y={930} width={104} height={82} rx={8} fill="#F7F1E4" stroke={C.navy} strokeWidth={4} strokeDasharray="12 8" />
</g>;
const PaintedSquare: React.FC<{k: number}> = ({k}) => k > 0.01 ? <g transform={`translate(1004 971) scale(${0.35 + 0.65 * k})`}>
  <rect x={-52} y={-41} width={104} height={82} rx={8} fill={C.poppy} stroke={C.navy} strokeWidth={4} />
  <rect x={-40} y={-30} width={30} height={12} rx={6} fill="#fff" opacity={0.35} />
</g> : null;

// basket on the bench between them (the phone goes in here)
const Basket: React.FC<{part: 'back' | 'front'}> = ({part}) => <g transform="translate(-250 -22)">{part === 'back'
  ? <path d="M 650 1186 Q 650 1060 790 1060 Q 930 1060 930 1186" fill="none" stroke={C.navy} strokeWidth={22} strokeLinecap="round" opacity={0.0} />
  : <g>
    <rect x={606} y={1196} width={368} height={176} rx={26} fill="#D9A55B" stroke={C.navy} strokeWidth={6} />
    {Array.from({length: 7}, (_, i) => <line key={i} x1={606} x2={974} y1={1226 + i * 24} y2={1226 + i * 24} stroke="#A9772F" strokeWidth={4} />)}
    {Array.from({length: 9}, (_, i) => <line key={i} y1={1196} y2={1372} x1={650 + i * 40} x2={650 + i * 40} stroke="#A9772F" strokeWidth={3} opacity={0.6} />)}
    <rect x={596} y={1186} width={388} height={24} rx={12} fill="#C98F3E" stroke={C.navy} strokeWidth={6} />
  </g>}</g>;

// brush: handle toward -x, bristles (poppy-tipped) toward +x, grip at 0
const Brush: React.FC<{wet?: number}> = ({wet = 1}) => <g>
  <rect x={-230} y={-14} width={240} height={28} rx={14} fill="#D9A55B" stroke={C.navy} strokeWidth={5} />
  <circle cx={-212} cy={0} r={5} fill={C.navy} opacity={0.5} />
  <rect x={4} y={-24} width={50} height={48} rx={6} fill="#B9C0CC" stroke={C.navy} strokeWidth={5} />
  <path d="M 54 -22 L 120 -28 Q 138 0 120 28 L 54 22 Z" fill={wet > 0.5 ? C.poppy : C.w2} stroke={C.navy} strokeWidth={5} strokeLinejoin="round" />
  <path d="M 70 -12 L 112 -14 M 70 0 L 124 0 M 70 12 L 112 14" stroke={C.navy} strokeWidth={2.5} opacity={0.4} />
</g>;

// ------------------------------------------------------------------------------------------ matches phone
const Bust: React.FC<{i: number}> = ({i}) => {
  const bg = ['#CFE0FF', '#FFE3C9', '#D8F3E6', '#E7DAFF'][i % 4];
  const fg = ['#7C8DB8', '#B98F73', '#6FA58D', '#9A86B8'][i % 4];
  return <g><rect x={-62} y={-52} width={64} height={104} rx={10} fill={bg} /><circle cx={-30} cy={-14} r={17} fill={fg} /><path d="M -56 40 Q -56 8 -30 8 Q -4 8 -4 40 Z" fill={fg} /></g>;
};
const MatchPhone: React.FC<{x: number; y: number; scale: number; rot: number; scroll: number; t: number}> = ({x, y, scale, rot, scroll, t}) => {
  const tiles = [0, 1, 2, 3, 4];
  return <g transform={`translate(${x} ${y}) scale(${scale}) rotate(${rot})`}>
    <circle r={250} fill="url(#glow)" opacity={0.9} />
    <path d="M -10 150 L -70 760" stroke="#fff" strokeWidth={146} strokeLinecap="round" /><path d="M -10 150 L -70 760" stroke={C.hoodie} strokeWidth={112} strokeLinecap="round" />
    <rect x={-92} y={-162} width={184} height={324} rx={34} fill="#fff" stroke="#fff" strokeWidth={14} />
    <rect x={-92} y={-162} width={184} height={324} rx={34} fill="#0E1630" />
    <clipPath id="mscr"><rect x={-80} y={-150} width={160} height={300} rx={26} /></clipPath>
    <rect x={-80} y={-150} width={160} height={300} rx={26} fill="url(#scr)" />
    <g clipPath="url(#mscr)">
      {tiles.map((i) => {
        const cy = -10 + i * 142 - scroll;
        const pk = smooth(cy, 118, 70);
        return <g key={i} transform={`translate(0 ${cy})`}>
          <rect x={-72} y={-62} width={144} height={124} rx={14} fill="#fff" />
          <g transform="translate(-6 0)"><Bust i={i} /></g>
          <rect x={20} y={-40} width={44} height={11} rx={5} fill="#4A5A8A" /><rect x={20} y={-22} width={30} height={9} rx={4} fill="#CFD6E6" />
          <path transform="translate(54 -48) scale(0.7)" d="M 0 10 C -16 -6 -24 -20 -11 -26 C -4 -29 0 -23 0 -21 C 0 -23 4 -29 11 -26 C 24 -20 16 -6 0 10 Z" fill={C.poppy} stroke="#fff" strokeWidth={3} />
          <g transform={`translate(2 14) rotate(-8) scale(${pk * (1 + 0.08 * Math.sin(clamp((118 - cy) / 40) * Math.PI))})`} opacity={clamp(pk * 2)}>
            <rect x={-66} y={-34} width={132} height={70} rx={8} fill="#fff" fillOpacity={0.92} stroke="#D6245E" strokeWidth={5} />
            <text x={0} y={-6} textAnchor="middle" fontFamily={COUR} fontWeight={700} fontSize={19} fill="#D6245E" letterSpacing={-0.5}>{spec.cards.stamp[0]}</text>
            <text x={0} y={22} textAnchor="middle" fontFamily={COUR} fontWeight={700} fontSize={19} fill="#D6245E" letterSpacing={-0.5}>{spec.cards.stamp[1]}</text>
          </g>
        </g>;
      })}
    </g>
    <ellipse cx={98} cy={20} rx={20} ry={34} fill={C.skinHim} stroke="#00000033" strokeWidth={3} />
    <ellipse cx={98} cy={74} rx={20} ry={30} fill={C.skinHim} stroke="#00000033" strokeWidth={3} />
  </g>;
};
const SimplePhone: React.FC<{lit: number; t: number}> = ({lit, t}) => <g>
  {lit > 0.01 && <circle r={230} fill="url(#glow)" opacity={lit * (0.75 + 0.25 * Math.sin(t * 40))} />}
  <rect x={-92} y={-162} width={184} height={324} rx={34} fill="#fff" stroke="#fff" strokeWidth={14} />
  <rect x={-92} y={-162} width={184} height={324} rx={34} fill="#0E1630" />
  <rect x={-80} y={-150} width={160} height={300} rx={26} fill={lit > 0.3 ? 'url(#scr)' : '#1A2442'} />
</g>;

// ------------------------------------------------------------------------------------------ write chips + pencil
const CW = 420, CHH = 310, CY = 1110;
const LH = 56;
const FONT_C = `700 ${LH}px "Courier Prime"`;
type ChipDef = {who: 'him' | 'her'; x0: number; x1: number; tin: number; writes: number[][]; slide: number[]; tout: number; lines: string[]; pre?: boolean; swatch: string};
const CHIPS: ChipDef[] = [
  {who: 'him', x0: 440, x1: 650, tin: B.w1, writes: [[11.4, 11.85], [11.9, 12.35]], slide: [12.5, 12.8], tout: B.w2, lines: spec.cards.chips[0], swatch: C.w3},
  {who: 'her', x0: 650, x1: 440, tin: B.w2, writes: [[13.3, 13.75], [13.8, 14.35]], slide: [14.5, 14.8], tout: B.w3, lines: spec.cards.chips[1], swatch: C.w4},
  {who: 'him', x0: 440, x1: 650, tin: B.w3, writes: [[15.4, 15.95]], slide: [16.1, 16.4], tout: 17.7, lines: spec.cards.chips[2], swatch: C.w2},
  {who: 'her', x0: 690, x1: 690, tin: B.chipC, writes: [], slide: [99, 99], tout: 23.0, lines: spec.cards.chips[3], pre: true, swatch: C.poppy},
];
const chipX = (c: ChipDef, t: number) => lerp(c.x0, c.x1, smooth(t, c.slide[0], c.slide[1]));
const chipY = (c: ChipDef, t: number) => (c === CHIPS[3] ? 1170 : CY) - 36 * Math.sin(wp(t, c.slide[0], c.slide[1]) * Math.PI);
const textStart = (c: ChipDef) => c.x0 - CW / 2 + 36;
const baseY = (c: ChipDef, k: number) => (c === CHIPS[3] ? 1170 : CY) + (k === 0 ? -5 : 85);

const WriteChip: React.FC<{c: ChipDef; t: number}> = ({c, t}) => {
  if (t < c.tin || t >= c.tout + 0.3) return null;
  const pin = smooth(t, c.tin, c.tin + 0.18) * (1 + 0.08 * Math.sin(clamp((t - c.tin) / 0.3) * Math.PI));
  const pout = smooth(t, c.tout, c.tout + 0.25);
  const x = chipX(c, t), y = chipY(c, t) + pout * 140;
  const rot = (c.who === 'him' ? -3 : 3) * (1 - wp(t, c.slide[0], c.slide[1]) * 2 * (c.x0 === c.x1 ? 0 : 1));
  const prog = (k: number) => (c.pre ? clamp((t - c.tin - 0.15) / 0.35) : c.writes[k] ? wp(t, c.writes[k][0], c.writes[k][1]) : 0);
  return <g opacity={1 - pout} transform={`translate(${x} ${y}) rotate(${rot}) scale(${pin})`}>
    <rect x={-CW / 2 + 12} y={-CHH / 2 + 16} width={CW} height={CHH} rx={20} fill={C.navy} opacity={0.22} />
    <rect x={-CW / 2 + 6} y={-CHH / 2 + 8} width={CW} height={CHH} rx={20} fill={C.navy} opacity={0.18} />
    <rect x={-CW / 2} y={-CHH / 2} width={CW} height={CHH} rx={20} fill="#F6F1E5" stroke={C.navy} strokeWidth={6} />
    <rect x={-CW / 2 + 14} y={-CHH / 2 + 14} width={CW - 28} height={58} rx={10} fill={c.swatch} stroke={C.navy} strokeWidth={2.5} opacity={0.9} />
    {[0, 1].map((k) => c.lines[k] ? <g key={k}>
      <line x1={-CW / 2 + 28} x2={CW / 2 - 28} y1={baseY(c, k) - CY + 8 + (c === CHIPS[3] ? CY - 1170 : 0)} y2={baseY(c, k) - CY + 8 + (c === CHIPS[3] ? CY - 1170 : 0)} stroke="#C9D2E6" strokeWidth={3} />
    </g> : null)}
    {[0, 1].map((k) => {
      if (!c.lines[k]) return null;
      const tw = textW(c.lines[k], FONT_C);
      const by = (k === 0 ? -5 : 85);
      return <g key={k}><clipPath id={`wc${CHIPS.indexOf(c)}-${k}`}><rect x={-CW / 2 + 30} y={by - 60} width={tw * prog(k) + 4} height={100} /></clipPath>
        <text x={-CW / 2 + 36} y={by} fontFamily={COUR} fontWeight={700} fontSize={LH} fill="#2E3548" clipPath={`url(#wc${CHIPS.indexOf(c)}-${k})`}>{c.lines[k]}</text></g>;
    })}
  </g>;
};

const HOOKP = {x: 1050, y: 1240}, CHAIN = 980, PEN = 280;
const topOf = (T: {x: number; y: number}, rho: number) => ({x: T.x + PEN * Math.sin((rho * Math.PI) / 180), y: T.y - PEN * Math.cos((rho * Math.PI) / 180)});
const mk = (top: {x: number; y: number}, rho: number) => ({top, rho, tip: {x: top.x - PEN * Math.sin((rho * Math.PI) / 180), y: top.y + PEN * Math.cos((rho * Math.PI) / 180)}});
const REST = mk({x: 1010, y: 1322}, 84);
const penPose = (t: number) => {
  for (const c of CHIPS) {
    if (!c.writes.length) continue;
    const rho = c.who === 'him' ? -72 : 72;
    const x0 = textStart(c);
    const L = c.lines.map((l, k) => ({x: x0 + 4, y: baseY(c, k) + 4, tw: textW(l, FONT_C)}));
    const tPick = c.writes[0][0] - 0.3, lastEnd = c.writes[c.writes.length - 1][1], tRet = lastEnd + 0.45;
    if (t < tPick || t >= tRet) continue;
    const tipAt = (): {x: number; y: number} => {
      for (let k = 0; k < c.writes.length; k++) {
        const [a, b] = c.writes[k];
        if (t >= a && t < b) { const p = wp(t, a, b); return {x: L[k].x + L[k].tw * p, y: L[k].y + Math.sin(t * 40) * 3}; }
        if (k + 1 < c.writes.length && t >= b && t < c.writes[k + 1][0]) { const p = smooth(t, b, c.writes[k + 1][0]); return {x: lerp(L[k].x + L[k].tw, L[k + 1].x, p), y: lerp(L[k].y, L[k + 1].y, p)}; }
      }
      return {x: 0, y: 0};
    };
    const restTop = REST.top;
    let tip: {x: number; y: number}, held: number, r = rho, top: {x: number; y: number};
    if (t < c.writes[0][0]) {
      const k = smooth(t, tPick, c.writes[0][0]);
      const hp = topOf({x: L[0].x, y: L[0].y}, rho);
      top = {x: lerp(restTop.x, hp.x, k), y: lerp(restTop.y, hp.y, k) - 60 * Math.sin(k * Math.PI)};
      r = lerp(REST.rho, rho, k); held = k;
      return {...mk(top, r), held};
    }
    if (t < lastEnd) { tip = tipAt(); return {...mk(topOf(tip, rho), rho), held: 1}; }
    const k = smooth(t, lastEnd, tRet);
    const endTip = {x: L[c.writes.length - 1].x + L[c.writes.length - 1].tw, y: L[c.writes.length - 1].y};
    const hp = topOf(endTip, rho);
    top = {x: lerp(hp.x, restTop.x, k), y: lerp(hp.y, restTop.y, k) - 60 * Math.sin(k * Math.PI)};
    r = lerp(rho, REST.rho, k);
    return {...mk(top, r), held: 1 - k};
  }
  return {...REST, held: 0};
};
const PenLayer: React.FC<{t: number}> = ({t}) => {
  const p = penPose(t);
  const dx = p.top.x - HOOKP.x, dy = p.top.y - HOOKP.y, dist = Math.hypot(dx, dy);
  const sag = Math.min(110, Math.max(0, CHAIN - dist) * 0.8);
  const d = `M ${HOOKP.x} ${HOOKP.y} Q ${(HOOKP.x + p.top.x) / 2} ${(HOOKP.y + p.top.y) / 2 + sag} ${p.top.x} ${p.top.y}`;
  const him = p.rho < 0;
  return <g>
    <path d={d} fill="none" stroke={C.navy} strokeWidth={11} strokeLinecap="round" />
    <path d={d} fill="none" stroke="#C9D2E6" strokeWidth={6} strokeDasharray="14 7" strokeLinecap="round" />
    <circle cx={HOOKP.x} cy={HOOKP.y} r={18} fill={C.navy} />
    <g transform={`translate(${p.tip.x} ${p.tip.y}) rotate(${p.rho})`}>
      <rect x={-20} y={-PEN} width={40} height={PEN - 36} rx={5} fill={C.sun} stroke={C.navy} strokeWidth={5} />
      <rect x={-20} y={-PEN} width={40} height={30} rx={5} fill={C.poppy} stroke={C.navy} strokeWidth={5} />
      <rect x={-20} y={-PEN + 30} width={40} height={14} fill="#B9C0CC" stroke={C.navy} strokeWidth={3} />
      <path d="M -20 -36 L 0 0 L 20 -36 Z" fill="#E8C79A" stroke={C.navy} strokeWidth={5} strokeLinejoin="round" /><path d="M -7 -12 L 0 0 L 7 -12 Z" fill="#2E3548" />
    </g>
    {p.held > 0.7 && (() => {
      const k = 0.9;
      const hx = p.tip.x + k * (p.top.x - p.tip.x) + (him ? -10 : 24), hy = p.tip.y + k * (p.top.y - p.tip.y) + 40;
      return <FreeHand who={him ? 'him' : 'her'} hx={hx} hy={hy} rot={him ? 24 : -24} thumb={0.5} base={him ? [-420, 1400] : [1500, 1400]} opacity={smooth(p.held, 0.7, 1)} />;
    })()}
  </g>;
};

// ------------------------------------------------------------------------------------------ cans insert
const Can: React.FC = () => <g>
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
const ClerkHand: React.FC<{x: number; y: number}> = ({x, y}) => <g>
  <path d={`M ${x + 900} ${y + 120} Q ${x + 450} ${y + 90} ${x} ${y}`} fill="none" stroke="#fff" strokeWidth={150} strokeLinecap="round" />
  <path d={`M ${x + 900} ${y + 120} Q ${x + 450} ${y + 90} ${x} ${y}`} fill="none" stroke={C.cobalt} strokeWidth={116} strokeLinecap="round" />
  <rect x={x - 28} y={y - 62} width={34} height={124} rx={16} fill="#fff" stroke={C.navy} strokeWidth={4} />
  <rect x={x - 100} y={y - 56} width={92} height={112} rx={38} fill="#E2AE86" stroke="#00000033" strokeWidth={3} />
  {[-30, -6, 18].map((dy) => <line key={dy} x1={x - 96} x2={x - 60} y1={y + dy} y2={y + dy} stroke="#00000033" strokeWidth={3} />)}
</g>;
const Cans: React.FC<{t: number}> = ({t}) => {
  const op = wp(t, 17.95, 18.1) * (1 - wp(t, 20.0, 20.15));
  if (op <= 0.01) return null;
  const A = {k: smooth(t, 18.05, 18.45), r: smooth(t, 18.45, 18.7)}, Bk = {k: smooth(t, 18.5, 18.9), r: smooth(t, 18.9, 19.15)};
  const ax = 320 + 900 * (1 - A.k), bx = 760 + 900 * (1 - Bk.k);
  const bob = Math.sin(t * 3) * 3;
  const settle = (k: number) => 1 + 0.04 * Math.sin(clamp((k - 0.85) / 0.15) * Math.PI);
  return <g opacity={op}>
    <rect x={-50} y={-50} width={1180} height={2100} fill="url(#wallg)" /><rect x={-50} y={-50} width={1180} height={2100} fill="url(#peg)" />
    <rect x={-50} y={1020} width={1180} height={260} fill={C.sun} /><rect x={-50} y={1020} width={1180} height={26} fill="#FFE27A" /><rect x={-50} y={1046} width={1180} height={8} fill={C.navy} />
    <rect x={-50} y={1280} width={1180} height={120} fill="#E2A800" /><rect x={-50} y={1274} width={1180} height={10} fill={C.navy} />
    {A.k > 0.01 && A.r < 1 && <ClerkHand x={ax + 230 + A.r * 800} y={930} />}
    {Bk.k > 0.01 && Bk.r < 1 && <ClerkHand x={bx + 230 + Bk.r * 800} y={930} />}
    <g transform={`translate(${ax} ${795 + bob * (A.k > 0.99 ? 1 : 0)}) scale(${1.0 * settle(A.k)})`}><Can /></g>
    <g transform={`translate(${bx} ${795 + bob * (Bk.k > 0.99 ? 1 : 0)}) scale(${1.0 * settle(Bk.k)})`}><Can /></g>
  </g>;
};

// ------------------------------------------------------------------------------------------ main scene
const hand = (who: 'him' | 'her', hx: number, hy: number, rot: number, thumb: number, base: [number, number], op: number, style: 'fist' | 'palm' = 'fist', wiggle = 0) =>
  op > 0.02 ? <FreeHand who={who} hx={hx} hy={hy} rot={rot} thumb={thumb} style={style} wiggle={wiggle} base={base} opacity={clamp(op * 1.5)} /> : null;

const swipeOf = (ticks: number[], t: number) => {
  let idx = -1;
  for (let i = 0; i < ticks.length; i++) if (ticks[i] <= t) idx = i;
  if (idx < 0) return {p: 0, dir: 1};
  return {p: clamp((t - ticks[idx]) / 0.26), dir: idx % 2 ? -1 : 1};
};
const HIM_TICKS = [-0.1, 0.2, 0.5, 0.8, 1.1, 1.4];

const ChoiceChip: React.FC<{lines: string[]; swatch: string; age: number; out: number; rot: number}> = ({lines, swatch, age, out, rot}) => {
  const pop = smooth(age, 0, 0.18) * (1 + 0.07 * Math.sin(clamp(age / 0.35) * Math.PI));
  const font = (s: number) => `800 ${s}px Inter`;
  let fs = 84;
  while (fs > 30 && Math.max(...lines.map((l) => textW(l, font(fs)))) > 520) fs -= 2;
  const w = 720, h = 290;
  return <g opacity={1 - out} transform={`translate(540 ${1040 + out * 160}) rotate(${rot}) scale(${pop})`}>
    <rect x={-w / 2 + 14} y={-h / 2 + 18} width={w} height={h} rx={22} fill={C.navy} opacity={0.3} />
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={22} fill={C.w1} stroke={C.navy} strokeWidth={7} />
    <rect x={-w / 2 + 14} y={-h / 2 + 14} width={120} height={h - 28} rx={12} fill={swatch} stroke={C.navy} strokeWidth={3} />
    {lines.map((l, i) => <text key={i} x={70} y={-4 + (i - (lines.length - 1) / 2) * fs * 1.12 + fs * 0.36} textAnchor="middle" fontFamily={INTER} fontWeight={800} fontSize={fs} fill={C.navy}>{l}</text>)}
  </g>;
};

const MainScene: React.FC<{s: number; t: number}> = ({s, t}) => {
  const cam: Cam = camAt(CAMK, Math.min(s, 23));
  const w = {...cam, x: cam.x + Math.sin(t * 0.8) * 3, y: cam.y + Math.sin(t * 1.1) * 2};
  const hs = swipeOf(HIM_TICKS, s);
  const rattling = s < 16.9;
  const stopK = s >= 16.9 ? s - 16.9 : 0;
  const canIn = s < 17.95;
  // hook phone (his, lit, big) and its trip into the basket in take 2
  const hookPhoneOn = s < 2.6 || (s >= 9.5 && s < 11.0);
  const lowerK = smooth(s, B.phoneDown, 2.5);
  const ph = s < 5 ? {x: 205, y: lerp(1190, 1750, lowerK), sc: 1.5, rot: 8} : (() => {
    const a = smooth(s, 10.5, 10.8), d = smooth(s, 10.8, 11.0);
    return {x: lerp(205, 540, a), y: lerp(lerp(1190, 1080, a), 1235, d), sc: lerp(1.5, 1.2, a) - 0.35 * d, rot: lerp(8, 0, a) - 10 * d};
  })();
  // matches phone
  const mUp = smooth(s, 4.0, 4.4) * (1 - smooth(s, 6.0, 6.5));
  const mPh = {x: lerp(330, 540, smooth(s, 4.0, 4.4)), y: lerp(1900, 1130, mUp), sc: 1.7};
  const scroll = clamp((s - 4.4) * 172, 0, 330);
  // pat
  const patOp = wp(s, 6.3, 6.6) * (1 - wp(s, 7.9, 8.15));
  const pk = Math.abs(Math.sin(Math.PI * 1.7 * (s - 6.6)));
  // basket phone glow
  const buzzing = s >= 11.0 && s < 11.8;
  const inBasketLit = buzzing ? 1 : 0;
  const brushRest = s < 20.0;
  // brush in her hand
  const grab = wp(s, 20.0, 20.25);
  const brushPos = (() => {
    if (s < 20.0) return null;
    const dabK = wp(s, 20.2, 20.45);
    const dabs = s >= 20.45 && s < 21.0 ? Math.sin(wp(s, 20.45, 21.0) * Math.PI * 4) * 12 : 0;
    const toOffer = smooth(s, 21.0, 21.35);
    const hx = lerp(lerp(600, 840, smooth(dabK, 0, 1)), 640, toOffer) + (s < 21.0 ? dabs : 0);
    const hy = lerp(lerp(1158, 985, smooth(dabK, 0, 1)), 965, toOffer) + (s >= 21.35 ? Math.sin(s * 2.4) * 5 : 0);
    const rot = lerp(lerp(-6, -4, dabK), -3, toOffer);
    return {hx, hy, rot};
  })();
  const paintK = smooth(s, 20.55, 20.95);
  const hit = s >= 8.2 ? 0 : 0;
  void hit;
  return <g>
    <g transform={planeT(w, 0.2)}><Backdrop /></g>
    <g transform={planeT(w, 0.3)}><Rack t={t} ding={0} showSpk={0} /></g>
    <g transform={planeT(w, 0.5)}><Machine t={t} rattling={rattling} canIn={canIn} stopK={stopK} /><Sign t={t} /></g>
    <g transform={planeT(w, 0.8)}><Board /><PaintedSquare k={paintK} /></g>
    <g transform={planeT(w, 0.9)}>
      <Person who="him" x={HIM.x} y={HIM.y} t={t} pose={himPose(s)} seed={0.4} />
      <Person who="her" x={HER.x} y={HER.y} t={t} pose={herPose(s)} seed={1.9} />
    </g>
    <g transform={planeT(w, 1.05)}><Bench /></g>
    <g transform={planeT(w, 1.1)}>
      <Basket part="back" />
      {buzzing && <circle cx={540} cy={1200} r={190} fill="url(#glow)" opacity={0.6 + 0.4 * Math.sin(s * 40)} />}
      {s >= 11.0 && <g clipPath="url(#bkclip)"><clipPath id="bkclip"><rect x={0} y={900} width={1080} height={450} /></clipPath><g transform="translate(540 1235) scale(0.85)"><SimplePhone lit={inBasketLit} t={t} /></g></g>}
      {brushRest && <g transform="translate(600 1146) rotate(-5)"><Brush /></g>}
      <Basket part="front" />
      {CHIPS.slice(0, 3).map((c, i) => <WriteChip key={i} c={c} t={s} />)}
      {/* receiving hands during slides */}
      {hand('her', chipX(CHIPS[0], s) + CW / 2 + 12, chipY(CHIPS[0], s) + 110, 12, 0.6, [1150, 2100], wp(s, 12.4, 12.55) * (1 - wp(s, 13.0, 13.3)))}
      {hand('him', chipX(CHIPS[1], s) - CW / 2 - 12, chipY(CHIPS[1], s) + 110, -14, 0.5, [-70, 2100], wp(s, 14.4, 14.55) * (1 - wp(s, 15.1, 15.4)))}
      {hand('her', chipX(CHIPS[2], s) + CW / 2 + 12, chipY(CHIPS[2], s) + 110, 12, 0.6, [1150, 2100], wp(s, 16.0, 16.15) * (1 - wp(s, 17.2, 17.6)))}
      {mUp > 0.02 && <MatchPhone x={mPh.x} y={mPh.y} scale={mPh.sc} rot={-4} scroll={scroll} t={t} />}
      {patOp > 0.02 && <g opacity={clamp(patOp * 1.5)}><FreeHand who="her" hx={450} hy={985 - 28 * pk} rot={-5 + 4 * pk} thumb={0} style="palm" wiggle={0} base={[830, 1130]} /><circle cx={830} cy={1130} r={68} fill={C.knit} /></g>}
      {brushPos && s < 23 && <>
        {hand('her', brushPos.hx, brushPos.hy, 0, 0.5, [1200, 1750], 1)}
        <g transform={`translate(${brushPos.hx} ${brushPos.hy}) rotate(${brushPos.rot})`}><g transform="translate(18 -8)"><Brush /></g></g>
      </>}
      <WriteChip c={CHIPS[3]} t={s} />
    </g>
    <g transform={planeT(w, 1.12)}><PenLayer t={s} /></g>
    <g transform={planeT(w, 1.04)}>
      {hookPhoneOn && <PhoneUnit rich scale={ph.sc} who="him" x={ph.x} y={ph.y} rot={ph.rot} lit={1} p={s < 1.7 ? hs.p : 0} dir={hs.dir} down={0} thumbOn={s < 1.7 ? 1 : 0} />}
    </g>
    <Cans t={s} />
    {/* choice chips */}
    {s >= 3.0 && s < 4.4 && <ChoiceChip lines={spec.cards.chip_take1} swatch={C.sun} age={s - 3.0} out={smooth(s, 4.0, 4.35)} rot={-3} />}
    {s >= 10.0 && s < 10.9 && <ChoiceChip lines={spec.cards.chip_take2} swatch={C.mint} age={s - 10.0} out={smooth(s, 10.55, 10.85)} rot={3} />}
  </g>;
};

// ------------------------------------------------------------------------------------------ vote + edit
const VoteScene: React.FC<{t: number}> = ({t}) => {
  const z = 1 + 0.025 * clamp((t - 23.5) / 7);
  return <g transform={`translate(540 960) scale(${z}) translate(-540 -960)`}>
    <VoteBg t={t} />
    <VoteCard letter="A" l1={spec.choices.A.l1} l2={spec.choices.A.l2} y={640} age={t - B.cardA} swatch={C.mint} rot={-1.5} t={t} />
    <VoteCard letter="B" l1={spec.choices.B.l1} l2={spec.choices.B.l2} y={940} age={t - B.cardB} swatch={C.sun} rot={1.5} t={t} />
  </g>;
};

const RewindGlyph: React.FC<{a: number}> = ({a}) => <g transform={`translate(540 700) scale(${0.9 + 0.2 * Math.sin(a * 3)})`} opacity={smooth(a, 0, 0.1) * (1 - smooth(a, 0.7, 0.9))}>
  {[-1, 1].map((i) => <path key={i} transform={`translate(${i * 78} 0)`} d="M 70 -80 L -70 0 L 70 80 Z" fill={C.sun} stroke={C.navy} strokeWidth={14} strokeLinejoin="round" />)}
</g>;

const BigText: React.FC<{t: number}> = ({t}) => {
  const a = wp(t, B.bigText, B.bigText + 0.2) * (1 - wp(t, 9.7, 9.9));
  if (a <= 0.01) return null;
  const pop = 1 + 0.08 * Math.sin(clamp((t - B.bigText) / 0.4) * Math.PI);
  return <g opacity={a} transform={`translate(540 1000) scale(${pop})`}>
    {['rewind.', 'take 2.'].map((l, i) => <g key={l}>
      <text x={8} y={i * 190 + 14} textAnchor="middle" fontFamily={INTER} fontWeight={800} fontSize={190} fill={C.navy}>{l}</text>
      <text x={0} y={i * 190} textAnchor="middle" fontFamily={INTER} fontWeight={800} fontSize={190} fill={i ? C.sun : '#fff'} stroke={C.navy} strokeWidth={10} paintOrder="stroke">{l}</text>
    </g>)}
  </g>;
};

type Mode = {kind: 'plain'; shot: 'main' | 'vote' | 'end'} | {kind: 'wipe'; k: number; under: 'main' | 'none'; over: 'main' | 'vote'; sOver?: number};
const modeAt = (t: number): Mode => {
  if (t < 8.2) return {kind: 'plain', shot: 'main'};
  if (t < 8.7) { const e = smooth(t, 8.2, 8.7); return {kind: 'wipe', k: 1 - e, under: 'none', over: 'main', sOver: 8.2}; }
  if (t < 8.85) return {kind: 'wipe', k: 0, under: 'none', over: 'main', sOver: 9.5};
  if (t < 9.55) return {kind: 'wipe', k: (t - 8.85) / WIPE_DUR, under: 'none', over: 'main', sOver: 9.5};
  if (t < B.voteWipe) return {kind: 'plain', shot: 'main'};
  if (t < B.voteWipe + WIPE_DUR) return {kind: 'wipe', k: (t - B.voteWipe) / WIPE_DUR, under: 'main', over: 'vote'};
  return {kind: 'plain', shot: t < B.endcard ? 'vote' : 'end'};
};
const FAST: [number, number][] = [[3.9, 4.45], [6.0, 6.5], [10.5, 11.0], [12.45, 12.85], [14.45, 14.85], [16.05, 16.45], [20.0, 20.3], [21.0, 21.4]];

const renderShot = (id: string, t: number, s?: number): React.ReactNode => {
  switch (id) {
    case 'main': return <MainScene s={s ?? stateTime(t)} t={t} />;
    case 'vote': return <VoteScene t={t} />;
    case 'end': return <EndCard a={t - B.endcard} t={t} part={4} />;
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
            {mode.under === 'none' ? <VoteBg t={t} /> : renderShot(mode.under, t)}
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
        <BigText t={t} />
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

export const Whites3: React.FC<{hook?: Hook}> = ({hook = 'a'}) => (
  <AbsoluteFill style={{background: C.wall}}>
    <Audio src={staticFile('audio/whites-ep3.wav')} volume={0.9} />
    <Scene hook={hook} />
  </AbsoluteFill>
);
