import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, lerp, smooth} from '../../lib/motion';
import {MotionBlurWhen} from '../../lib/shots';
import {
  ANTON, Backdrop, C, Cam, CamKey, Counter, Defs, EndCard, FanClip, FanRim, Mouth, Person, PhoneUnit, Pose,
  Strip, VoteBg, VoteCard, WIPE_DUR, camAt, planeT, textW, COUR, INTER,
} from './world';
import spec from '../../../specs/stories/whites-ep5.json';

// Fifty Whites, part 5 "Closing time". Silent. Same store, closing: a register with a bored cashier, a hanging sign
// STORE / CLOSES / IN 10 MIN, an empty chip stand. Frame 1 fully composed (hook strip, two big faces, his lit phone
// mid-swipe, her holding the TEST PATCH board with the POPPY window + sunflower sun). Take 1 BUY MORE PAINT. STALL. fails on
// him (basket of rollers, tape, a ladder; she leaves her chip on the stand). Rewind. Take 2 ASK HER FOR COFFEE.: he writes
// "coffee? / before they / lock us in.", she laughs, flips the chip and writes "only if you / pick the cup." (whole-frame
// close-up). Cliff outside: shutter coming down, a cafe across the street, "so, what's / your name?". Vote at 24.3.
// Hands are drawn locally (Hand5): short near-vertical arms, a short side thumb, no thumbs-up.

export const WHITES5_FPS = 60;
export const WHITES5_FRAMES = Math.round(spec.duration * WHITES5_FPS);
export type Hook = 'a' | 'b';
const B = spec.beats;

const HIM = {x: 210, y: 700}, HER = {x: 870, y: 720};

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
const stateTime = (t: number) => (t < B.rewind ? t : t < B.open ? B.rewind : t < B.take2 ? B.take2 : t);
const rad = (d: number) => (d * Math.PI) / 180;
const rot2 = (a: number, x: number, y: number): [number, number] => [x * Math.cos(rad(a)) - y * Math.sin(rad(a)), x * Math.sin(rad(a)) + y * Math.cos(rad(a))];

// ------------------------------------------------------------------------------------------ faces
const HIM_LOOK: KF[] = [[0, 0.2, 0.85], [2.9, 0.2, 0.85], [3.1, 0.9, 0.35], [3.5, -0.2, 0.5], [5.3, -0.2, 0.5], [5.5, 0.6, -0.9], [5.9, 0.9, 0.3], [7.0, 0.9, 0.3],
  [7.4, 0.3, -0.9], [7.8, 0, 0.5], [8.0, 0, 0.5], [9.3, 0.9, 0.3], [10.1, 0.5, 0.7], [10.9, -0.4, 0.95], [11.5, 0.9, 0.3], [11.8, -0.2, 0.8], [13.3, -0.2, 0.8], [13.5, 0.9, 0.4],
  [14.4, 0.9, 0.5], [15.0, 0.9, 0.3], [16.0, 0.7, 0.6], [17.5, 0.9, 0.4], [19.0, 0.9, 0.3], [20.2, 0.7, 0.4], [21.0, 0.8, 0.2], [21.2, -0.8, -0.4], [21.8, -0.8, -0.4], [22.0, 0.9, 0.3], [22.6, 0.5, 0.8]];
const HER_LOOK: KF[] = [[0, -0.9, 0.35], [1.4, -0.9, 0.35], [1.6, -0.5, 0.95], [2.0, -0.5, 0.95], [2.3, -0.9, 0.3], [3.0, -0.6, 0.5], [5.4, -0.6, 0.5], [5.6, 0.2, -0.9], [5.9, -0.3, 0.95],
  [6.2, -0.9, 0.3], [6.4, -0.9, 0.3], [8.0, -0.9, 0.3], [9.3, -0.9, 0.3], [11.0, -0.9, 0.3], [11.6, -0.4, 0.9], [13.3, -0.4, 0.9], [13.9, -0.3, 0.95], [14.4, -0.3, 0.95], [14.9, -0.9, 0.3],
  [15.5, -0.4, 0.9], [17.7, -0.4, 0.9], [18.0, -0.9, 0.3], [20.2, -0.8, 0.4], [21.0, -0.9, 0.2], [21.2, -0.8, -0.4], [21.8, -0.8, -0.4], [22.0, -0.9, 0.3]];
const HIM_MOUTH: [number, Mouth][] = [[0, 'gulp'], [3.1, 'o'], [3.5, 'flat'], [5.5, 'o'], [5.9, 'gulp'], [7.8, 'o'], [8.0, 'gulp'], [9.3, 'gulp'], [10.0, 'flat'], [11.0, 'o'],
  [11.5, 'smirk'], [13.5, 'o'], [14.0, 'gulp'], [14.6, 'o'], [15.5, 'smile'], [17.5, 'smile'], [20.0, 'smile'], [21.0, 'smile'], [22.2, 'gulp']];
const HER_MOUTH: [number, Mouth][] = [[0, 'smirk'], [1.6, 'o'], [2.1, 'smirk'], [5.5, 'o'], [5.9, 'smile'], [8.0, 'smirk'], [9.3, 'smirk'], [14.0, 'smirk'], [14.5, 'laugh'], [15.5, 'smile'],
  [19.8, 'smile'], [21.0, 'smile'], [22.0, 'smirk']];

const blinkAt = (t: number, seed: number) => { const ph = (t + seed) % 3.7; return ph < 0.14 ? Math.sin((ph / 0.14) * Math.PI) : 0; };
const herLaugh = (t: number) => t >= B.laugh && t < B.laugh + 1.0;
const himLaugh = (t: number) => t >= B.laugh + 0.3 && t < B.laugh + 1.1;
const GULPS = [3.1, 5.6, 7.8, 9.5, 13.95, 22.8];

const himPose = (s: number): Pose => {
  const [lx, ly] = kf(HIM_LOOK, s);
  const g = Math.max(...GULPS.map((a) => Math.sin(wp(s, a, a + 0.42) * Math.PI)));
  const L = himLaugh(s);
  const sweat = s > 5.5 && s < 9.0 ? smooth(s, 7.4, 8.0) * 0.7 : s > 22.5 ? smooth(s, 22.6, 23.3) * 0.6 : 0;
  const worry = Math.max(0.5 * (1 - smooth(s, 2.9, 3.4)), s > 5.5 && s < 9.0 ? smooth(s, 5.6, 6.0) * 0.8 : 0, s > 22.5 ? smooth(s, 22.5, 23.0) * 0.7 : 0);
  const raise = 0.15 + sweat * 0.3 + (s > 3.0 && s < 3.6 ? 0.5 : 0) + (s > 5.5 && s < 6.2 ? 0.5 : 0);
  return {look: [lx, ly], browL: raise, browR: raise, worry, mouth: keyAt(HIM_MOUTH, s), happy: L, sweat, gulp: g,
    tilt: L ? Math.sin(s * 22) * 3 : Math.sin(s * 0.9) * 1.1, bob: L ? -Math.abs(Math.sin(s * 22)) * 9 : 0, blink: blinkAt(s, 0.4)};
};
const herPose = (s: number): Pose => {
  const [lx, ly] = kf(HER_LOOK, s);
  const L = herLaugh(s);
  const brow = Math.max(smooth(s, 1.6, 1.8) * (1 - smooth(s, 2.1, 2.3)) * 0.7, smooth(s, 5.5, 5.7) * (1 - smooth(s, 6.0, 6.2)) * 0.8, smooth(s, 13.9, 14.2) * (1 - smooth(s, 14.4, 14.6)) * 0.45);
  const sorry = s > 6.0 && s < 8.0 ? 0.35 : 0;
  return {look: [lx, ly], browL: brow, browR: brow * 0.7 + 0.05, worry: sorry, mouth: keyAt(HER_MOUTH, s), happy: L, sweat: 0, gulp: 0,
    tilt: L ? Math.sin(s * 21 + 1) * 3 : Math.sin(s * 0.8 + 2) * 1.2, bob: L ? -Math.abs(Math.sin(s * 21 + 1)) * 9 : 0, blink: blinkAt(s, 1.9)};
};

const CAMK: CamKey[] = [
  {t: 0, x: 540, y: 975, z: 1.0}, {t: 3.0, x: 540, y: 985, z: 1.03}, {t: 5.5, x: 535, y: 990, z: 1.05}, {t: 8.0, x: 540, y: 980, z: 1.03}, {t: 9.3, x: 540, y: 975, z: 1.0},
  {t: 11.6, x: 520, y: 1000, z: 1.06}, {t: 13.6, x: 540, y: 1000, z: 1.07}, {t: 14.4, x: 570, y: 995, z: 1.07}, {t: 17.8, x: 560, y: 1000, z: 1.09}, {t: 19.8, x: 545, y: 985, z: 1.04}, {t: 21.0, x: 540, y: 975, z: 1.02}, {t: 24.0, x: 540, y: 975, z: 1.04},
];

// ------------------------------------------------------------------------------------------ hands (clean: short near-vertical arms, short side thumb)
const Hand5: React.FC<{who: 'him' | 'her'; hx: number; hy: number; rot?: number; open?: boolean; opacity?: number; reach?: number}> = ({who, hx, hy, rot = 0, open = false, opacity = 1, reach = 560}) => {
  if (opacity < 0.02) return null;
  const him = who === 'him';
  const skin = him ? C.skinHim : C.skinHer;
  const sleeve = him ? C.hoodie : C.knit;
  const bx = hx + (him ? -70 : 70), by = hy + reach;
  const d = `M ${bx} ${by} Q ${hx + (him ? -20 : 20)} ${(hy + by) / 2} ${hx} ${hy + 40}`;
  return <g opacity={clamp(opacity * 1.5)}>
    <path d={d} fill="none" stroke="#fff" strokeWidth={132} strokeLinecap="round" />
    <path d={d} fill="none" stroke={sleeve} strokeWidth={100} strokeLinecap="round" />
    <g transform={`translate(${hx} ${hy}) rotate(${rot})`}>
      <rect x={-56} y={36} width={112} height={32} rx={12} fill={him ? C.hoodieDeep : C.knitDeep} />
      {!him && [[-32, 52, C.poppy], [8, 46, C.cobalt], [34, 56, C.mint]].map(([x, y, c], i) => <circle key={i} cx={x as number} cy={y as number} r={6} fill={c as string} />)}
      {open ? <g>
        {[[-39, 62], [-13, 76], [13, 76], [39, 62]].map(([x, h], i) => <rect key={i} x={(x as number) - 12} y={-(h as number) - 20} width={24} height={(h as number) + 40} rx={12} fill={skin} stroke="#00000033" strokeWidth={3} />)}
        <rect x={-50} y={-44} width={100} height={90} rx={30} fill={skin} stroke="#00000033" strokeWidth={3} />
        <ellipse cx={-58} cy={8} rx={19} ry={36} transform="rotate(-38 -58 8)" fill={skin} stroke="#00000033" strokeWidth={3} />
      </g> : <g>
        <rect x={-50} y={-44} width={100} height={92} rx={36} fill={skin} stroke="#00000033" strokeWidth={3} />
        {[-24, 0, 24].map((x) => <line key={x} x1={x} y1={-40} x2={x} y2={-14} stroke="#00000033" strokeWidth={3} />)}
        <ellipse cx={-48} cy={14} rx={17} ry={28} transform="rotate(14 -48 14)" fill={skin} stroke="#00000033" strokeWidth={3} />
      </g>}
    </g>
  </g>;
};

// ------------------------------------------------------------------------------------------ the sign, the horn, the cashier, the register
const SignHorn: React.FC<{s: number; t: number}> = ({s, t}) => {
  const now = s >= B.ding && s < 9.0;
  const rattle = s >= B.ding && s < B.ding + 0.5 ? Math.sin((s - B.ding) * 80) * 7 * (1 - (s - B.ding) / 0.5) : 0;
  const L = spec.cards.sign;
  const cx = 540, top = 596, w = 372, h = 318;
  const f3 = now ? 84 : 70;
  const ring = (i: number) => { const a = clamp(((s - B.ding) * 1.4) % 1.2 - i * 0.2) / 0.9; return a > 0 && a < 1 && s >= B.ding && s < B.ding + 1.5 ? a : -1; };
  return <g transform={`translate(${rattle} 0)`}>
    {/* horn */}
    <g transform="translate(540 508)">
      {[0, 1, 2].map((i) => { const a = ring(i); if (a < 0) return null; const r = 100 + a * 120; return <g key={i} opacity={1 - a}>
        {[-1, 1].map((sd) => { const d = `M ${sd * r * 0.7} ${-r * 0.55} A ${r} ${r} 0 0 ${sd > 0 ? 1 : 0} ${sd * r * 0.7} ${r * 0.55}`; return <g key={sd}><path d={d} fill="none" stroke={C.navy} strokeWidth={14} strokeLinecap="round" /><path d={d} fill="none" stroke="#fff" strokeWidth={6} strokeLinecap="round" /></g>; })}
      </g>; })}
      <rect x={-8} y={-96} width={16} height={60} fill={C.navy} />
      <path d="M -74 56 L -44 -30 L 44 -30 L 74 56 Z" fill={C.w1} stroke={C.navy} strokeWidth={8} strokeLinejoin="round" />
      <ellipse cx={0} cy={56} rx={74} ry={16} fill="#DCE3F2" stroke={C.navy} strokeWidth={8} />
      <ellipse cx={0} cy={56} rx={42} ry={8} fill={C.navy} />
    </g>
    {/* chains */}
    {[-150, 150].map((x) => <line key={x} x1={540 + x * 0.3} y1={566} x2={cx + x} y2={top + 6} stroke={C.navy} strokeWidth={8} />)}
    <g transform={`translate(${cx} ${top}) rotate(${Math.sin(t * 1.3) * 0.8})`}>
      <rect x={-w / 2 + 14} y={18} width={w} height={h} rx={24} fill={C.navy} />
      <rect x={-w / 2} y={0} width={w} height={h} rx={24} fill={C.sun} stroke={C.navy} strokeWidth={9} />
      <text x={0} y={104} textAnchor="middle" fontFamily={ANTON} fontSize={112} fill={C.navy}>{L[0]}</text>
      <text x={0} y={206} textAnchor="middle" fontFamily={ANTON} fontSize={112} fill={C.navy}>{L[1]}</text>
      <rect x={-w / 2 + 14} y={h - 108} width={w - 28} height={94} rx={14} fill={now ? C.poppy : C.navy} />
      <text x={0} y={h - 108 + 47 + f3 * 0.36} textAnchor="middle" fontFamily={ANTON} fontSize={f3} fill="#fff">{now ? spec.cards.signNow : L[2]}</text>
    </g>
  </g>;
};

const Cashier: React.FC<{s: number; t: number}> = ({s, t}) => {
  const look: [number, number] = s < 3.4 ? [Math.sin(t * 1.2) * 0.5, 0.2] : s < 8.0 ? [Math.sin(t * 5.5) * 0.9, 0.5] : s < 13.4 ? [-0.3, 0.3] : s < 14.4 ? [0.4, 0.5] : s < 16.0 ? [0.9, 0.2] : [0.1, 0.3];
  const yawn = (s > 5.0 && s < 5.4) ? 1 : 0;
  const bl = blinkAt(t, 2.6);
  const skin = '#D9A27C';
  return <g transform="translate(540 1030)">
    <path d="M -150 160 L -140 100 Q -120 66 -60 60 L 60 60 Q 120 66 140 100 L 150 160 Z" fill="#fff" stroke="#fff" strokeWidth={26} strokeLinejoin="round" />
    <path d="M -150 160 L -140 100 Q -120 66 -60 60 L 60 60 Q 120 66 140 100 L 150 160 Z" fill={C.mint} />
    <rect x={-22} y={44} width={44} height={40} fill="#B98160" />
    <circle r={90} fill="#fff" />
    <circle r={78} fill={skin} />
    <circle cx={-76} cy={8} r={16} fill={skin} /><circle cx={76} cy={8} r={16} fill={skin} />
    {/* cap */}
    <path d="M -80 -14 Q -84 -86 0 -88 Q 84 -86 80 -14 Q 40 -34 0 -32 Q -40 -34 -80 -14 Z" fill={C.cobalt} stroke="#fff" strokeWidth={6} />
    <rect x={-66} y={-30} width={132} height={14} rx={7} fill={C.navy} opacity={0.5} />
    {[-1, 1].map((sd) => <g key={sd}>
      <ellipse cx={sd * 30} cy={4} rx={19} ry={17} fill="#fff" stroke={C.navy} strokeWidth={3} />
      <circle cx={sd * 30 + look[0] * 7} cy={6 + look[1] * 4} r={8} fill={C.navy} />
      <path d={`M ${sd * 30 - 22} ${-12} L ${sd * 30 + 22} ${-12} L ${sd * 30 + 22} ${6 + bl * 8} Q ${sd * 30} ${-2 + bl * 10} ${sd * 30 - 22} ${6 + bl * 8} Z`} fill={skin} stroke={C.navy} strokeWidth={3} />
    </g>)}
    {yawn ? <ellipse cx={0} cy={48} rx={16} ry={20} fill={C.navy} /> : <path d="M -16 48 L 16 48" stroke={C.navy} strokeWidth={6} strokeLinecap="round" />}
  </g>;
};

const Register: React.FC<{items: number}> = ({items}) => <g transform="translate(554 1330) scale(1.25) translate(-554 -1330)">
  <rect x={392} y={1160} width={324} height={170} rx={22} fill="#C9D2E6" stroke={C.navy} strokeWidth={7} />
  <rect x={392} y={1160} width={324} height={30} rx={14} fill="#DCE3F2" stroke={C.navy} strokeWidth={7} />
  <rect x={414} y={1208} width={280} height={64} rx={12} fill={C.navy} stroke="#fff" strokeWidth={3} />
  <text x={554} y={1254} textAnchor="middle" fontFamily={COUR} fontWeight={700} fontSize={50} fill={C.cyan}>ITEMS {String(items).padStart(2, '0')}</text>
  {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={420 + i * 46} y={1288} width={34} height={20} rx={6} fill={[C.w1, C.sun, C.w1, C.mint, C.w1, C.poppy][i]} stroke={C.navy} strokeWidth={3} />)}
</g>;

const Receipt: React.FC<{items: number}> = ({items}) => {
  if (items < 2) return null;
  const len = items * 11;
  return <g>
    <rect x={768} y={1236} width={76} height={len} fill="#fff" stroke={C.navy} strokeWidth={4} />
    {Array.from({length: Math.floor(len / 22)}, (_, i) => <line key={i} x1={780} x2={780 + (i % 3 === 0 ? 50 : 34)} y1={1250 + i * 22} y2={1250 + i * 22} stroke="#7C8DB8" strokeWidth={5} strokeLinecap="round" />)}
  </g>;
};

const Stand: React.FC<{has: number; bounce: number}> = ({has, bounce}) => <g>
  {has > 0 && <g transform={`translate(960 ${1294 - bounce}) rotate(${-3 + bounce * 0.2}) scale(1.35)`}>
    <rect x={-44} y={-132} width={88} height={132} rx={10} fill={C.poppy} stroke={C.navy} strokeWidth={6} />
    <rect x={-44} y={-40} width={88} height={40} rx={6} fill={C.w1} stroke={C.navy} strokeWidth={5} />
    <rect x={-28} y={-26} width={56} height={8} rx={4} fill={C.navy} opacity={0.5} />
  </g>}
  <path d="M -64 -34 L 64 -34 L 74 4 L -74 4 Z" transform="translate(960 1296) scale(1.35)" fill="#D9A55B" stroke={C.navy} strokeWidth={6} strokeLinejoin="round" />
</g>;

// ------------------------------------------------------------------------------------------ board (frame 1), basket + items (take 1)
const BX = 310, BY = 880, BW = 640, BH = 360, BCX = 630, BCY = 1060;
const BoardArt: React.FC = () => <g>
  <rect x={BX + 14} y={BY + 18} width={BW} height={BH} rx={18} fill={C.navy} opacity={0.25} />
  <rect x={BX} y={BY} width={BW} height={BH} rx={18} fill="#F2E8D2" stroke={C.navy} strokeWidth={8} />
  <rect x={BX + 130} y={BY + 12} width={BW - 260} height={44} rx={8} fill={C.navy} />
  <text x={BCX} y={BY + 45} textAnchor="middle" fontFamily={COUR} fontWeight={700} fontSize={32} fill={C.sun} letterSpacing={2}>TEST PATCH</text>
  <rect x={340} y={955} width={270} height={260} rx={10} fill="#FBF8F1" stroke={C.navy} strokeWidth={5} />
  <rect x={650} y={955} width={270} height={260} rx={10} fill={C.poppy} stroke={C.navy} strokeWidth={5} />
  <path d="M 676 985 L 820 985" stroke="#fff" strokeWidth={10} strokeLinecap="round" opacity={0.4} />
  {/* his POPPY window with her sunflower sun */}
  <g fill="none" stroke={C.poppy} strokeLinecap="round" strokeLinejoin="round">
    <path d="M 364 974 L 586 974 L 586 1196 L 364 1196 Z" strokeWidth={18} /><path d="M 475 974 L 475 1196 M 364 1085 L 586 1085" strokeWidth={14} />
  </g>
  <circle cx={530} cy={1030} r={24} fill={C.sun} />
  {Array.from({length: 8}, (_, i) => { const a = rad(i * 45); return <line key={i} x1={530 + Math.cos(a) * 31} y1={1030 + Math.sin(a) * 31} x2={530 + Math.cos(a) * 45} y2={1030 + Math.sin(a) * 45} stroke={C.sun} strokeWidth={8} strokeLinecap="round" />; })}
</g>;

const item = (s: number, t0: number) => ({k: smooth(s, t0, t0 + 0.2), bounce: s > t0 + 0.2 ? Math.sin((s - t0 - 0.2) * 22) * 8 * Math.exp(-(s - t0 - 0.2) * 7) : 0});
const Roller: React.FC<{x: number; rot: number; k: number; bounce: number; col: string}> = ({x, rot, k, bounce, col}) => <g opacity={clamp(k * 3)} transform={`translate(${x} ${1214 - (1 - k) * 420 + bounce}) rotate(${rot})`}>
  <rect x={-8} y={-210} width={16} height={190} rx={8} fill="#9B6A3A" stroke={C.navy} strokeWidth={5} />
  <path d="M -8 -30 L -8 -6 L 56 -6 L 56 22" fill="none" stroke={C.navy} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
  <rect x={-58} y={-60} width={116} height={46} rx={14} fill={col} stroke={C.navy} strokeWidth={6} />
  <rect x={-46} y={-52} width={92} height={10} rx={5} fill="#fff" opacity={0.5} />
</g>;
const Tape: React.FC<{x: number; k: number; bounce: number; col: string}> = ({x, k, bounce, col}) => <g opacity={clamp(k * 3)} transform={`translate(${x} ${1196 - (1 - k) * 420 + bounce})`}>
  <circle r={40} fill={col} stroke={C.navy} strokeWidth={6} /><circle r={17} fill={C.w1} stroke={C.navy} strokeWidth={5} />
</g>;
const Ladder: React.FC<{k: number; rot: number}> = ({k, rot}) => <g opacity={clamp(k * 3)} transform={`translate(300 ${1312 - (1 - k) * 640}) rotate(${rot})`}>
  {[-46, 46].map((x) => <rect key={x} x={x - 11} y={-400} width={22} height={420} rx={8} fill="#E8C79A" stroke={C.navy} strokeWidth={6} />)}
  {Array.from({length: 5}, (_, i) => <rect key={i} x={-46} y={-360 + i * 74} width={92} height={16} rx={6} fill="#E8C79A" stroke={C.navy} strokeWidth={5} />)}
  <rect x={-60} y={-420} width={120} height={24} rx={10} fill={C.cobalt} stroke={C.navy} strokeWidth={6} />
</g>;
const Basket: React.FC = () => <g>
  <path d="M 0 1176 L 380 1176 L 352 1318 L 22 1318 Z" fill="#DCE3F2" stroke={C.navy} strokeWidth={7} strokeLinejoin="round" />
  {[1206, 1236, 1266, 1296].map((y) => <line key={y} x1={20} x2={360} y1={y} y2={y} stroke={C.navy} strokeWidth={4} opacity={0.5} />)}
  {[80, 140, 200, 260, 320].map((x) => <line key={x} x1={x} x2={x - 10} y1={1176} y2={1318} stroke={C.navy} strokeWidth={4} opacity={0.4} />)}
  <rect x={-14} y={1166} width={400} height={16} rx={8} fill="#B9C0CC" stroke={C.navy} strokeWidth={5} />
</g>;

// ------------------------------------------------------------------------------------------ note chip + pencil on a chain
const NW = 640, NH = 400, FS = 68;
const FONT_N = `700 ${FS}px "Courier Prime"`;
const NB = [-50, 42, 134];
const N = spec.cards.chips;
const W1: [number, number][] = [[B.w1a, B.w1b - 0.1], [B.w1b, B.w1c - 0.1], [B.w1c, B.ret1]];
const W2: [number, number][] = [[B.w2a, B.w2b - 0.1], [B.w2b, B.cup]];
const HIMC = {x: 385, y: 1085, sc: 0.9, r: -3}, HERC = {x: 745, y: 1085, sc: 0.9, r: 3}, CLOSE = {x: 540, y: 1100, sc: 1.25, r: 0}, BACKTO = {x: 385, y: 1100, sc: 0.9, r: -3};
const mixXf = (a: typeof HIMC, b: typeof HIMC, k: number, arc = 0) => ({x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k) - arc * Math.sin(k * Math.PI), sc: lerp(a.sc, b.sc, k), r: lerp(a.r, b.r, k)});
const chipXf = (s: number) => {
  if (s < B.slide) { const p = smooth(s, B.pick1, B.w1a); const c = {...HIMC}; c.y += 90 * (1 - p); return c; }
  if (s < B.read) return mixXf(HIMC, HERC, smooth(s, B.slide, B.read - 0.05), 70);
  if (s < B.zoom) return HERC;
  if (s < B.zoom + 0.35) return mixXf(HERC, CLOSE, smooth(s, B.zoom, B.zoom + 0.35));
  if (s < B.back) return CLOSE;
  return mixXf(CLOSE, BACKTO, smooth(s, B.back, B.back + 0.3));
};
const chipPt = (s: number, x: number, y: number): [number, number] => {
  const c = chipXf(s);
  const [rx, ry] = rot2(c.r, x * c.sc, y * c.sc);
  return [c.x + rx, c.y + ry];
};
const NoteLines: React.FC<{lines: string[]; wr: [number, number][]; s: number; idp: string}> = ({lines, wr, s, idp}) => <g>
  {lines.map((l, k) => {
    const tw = textW(l, FONT_N);
    const p = wp(s, wr[k][0], wr[k][1]);
    return <g key={k}><clipPath id={`${idp}${k}`}><rect x={-NW / 2 + 24} y={NB[k] - 80} width={tw * p + 6} height={120} /></clipPath>
      <text x={-NW / 2 + 40} y={NB[k]} fontFamily={COUR} fontWeight={700} fontSize={FS} fill="#2E3548" clipPath={`url(#${idp}${k})`}>{l}</text></g>;
  })}
</g>;
const CUP = {x: 205, y: 142};
const NoteChip: React.FC<{s: number}> = ({s}) => {
  if (s < B.pick1 || s >= 21.0) return null;
  const c = chipXf(s);
  const pin = smooth(s, B.pick1, B.pick1 + 0.15);
  const fk = wp(s, B.flip, B.flip + 0.3);
  const sx = Math.max(0.04, Math.abs(1 - 2 * fk));
  const back = s >= B.flip + 0.15;
  const cupP = wp(s, B.cup, B.cup + 0.4);
  return <g opacity={pin} transform={`translate(${c.x} ${c.y}) rotate(${c.r}) scale(${c.sc * sx} ${c.sc})`}>
    <rect x={-NW / 2 + 14} y={-NH / 2 + 18} width={NW} height={NH} rx={26} fill={C.navy} opacity={0.25} />
    <rect x={-NW / 2} y={-NH / 2} width={NW} height={NH} rx={26} fill="#F6F1E5" stroke={C.navy} strokeWidth={8} />
    <rect x={-NW / 2 + 16} y={-NH / 2 + 16} width={NW - 32} height={56} rx={12} fill={back ? C.mint : C.poppy} stroke={C.navy} strokeWidth={3} />
    {NB.map((b, k) => <line key={k} x1={-NW / 2 + 30} x2={NW / 2 - 30} y1={b + 14} y2={b + 14} stroke="#C9D2E6" strokeWidth={3} />)}
    {!back ? <NoteLines lines={N[0]} wr={W1} s={s} idp="n1" /> : <g>
      <NoteLines lines={N[1]} wr={W2} s={s} idp="n2" />
      {cupP > 0 && <g transform={`translate(${CUP.x} ${CUP.y})`} fill="none" stroke="#2E3548" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round">
        <path pathLength={1} strokeDasharray="1" strokeDashoffset={1 - clamp(cupP * 1.6)} d="M -40 -26 L -30 34 Q 0 46 30 34 L 40 -26 Z" />
        <path pathLength={1} strokeDasharray="1" strokeDashoffset={1 - clamp(cupP * 2 - 0.6)} d="M 40 -14 Q 72 -14 66 10 Q 60 30 32 24" />
        <path pathLength={1} strokeDasharray="1" strokeDashoffset={1 - clamp(cupP * 2 - 1)} d="M -14 -42 q 12 -12 0 -22 q -12 -10 0 -20 M 14 -42 q 12 -12 0 -22 q -12 -10 0 -20" />
      </g>}
    </g>}
  </g>;
};

const PEN = 190, HOOK = {x: 760, y: 1250}, CHAIN = 760;
const REST_TOP: [number, number] = [640, 1318];
type Job = {pick: number; w0: number; w1: number; ret: number; rho: number; who: 'him' | 'her'};
const JOBS: Job[] = [{pick: B.pick1, w0: B.w1a, w1: B.ret1 - 0.05, ret: B.ret1 + 0.3, rho: 72, who: 'him'}, {pick: B.pick2, w0: B.w2a, w1: B.ret2, ret: B.ret2 + 0.3, rho: 72, who: 'her'}];
const jobTip = (j: Job, s: number): [number, number] => {
  const x0 = -NW / 2 + 40;
  const lines = j.who === 'him' ? W1 : W2;
  const texts = j.who === 'him' ? N[0] : N[1];
  for (let k = 0; k < lines.length; k++) {
    const [a, b] = lines[k];
    if (s >= a && s < b) { const tw = textW(texts[k], FONT_N); return chipPt(s, x0 + tw * wp(s, a, b) + 4, NB[k] + 6 + Math.sin(s * 40) * 2); }
    if (k + 1 < lines.length && s >= b && s < lines[k + 1][0]) {
      const p = smooth(s, b, lines[k + 1][0]); const e = chipPt(s, x0 + textW(texts[k], FONT_N), NB[k] + 6), n = chipPt(s, x0, NB[k + 1] + 6);
      return [lerp(e[0], n[0], p), lerp(e[1], n[1], p)];
    }
  }
  if (j.who === 'her' && s >= B.cup && s < j.w1) return chipPt(s, CUP.x + Math.sin(s * 30) * 22, CUP.y + Math.cos(s * 24) * 14);
  const last = lines.length - 1;
  return chipPt(s, x0 + textW(texts[last], FONT_N), NB[last] + 6);
};
const penPose = (s: number) => {
  const restTip: [number, number] = [REST_TOP[0] + PEN * 0.998, REST_TOP[1] + 8];
  for (const j of JOBS) {
    if (s >= j.pick && s < j.ret) {
      let tip: [number, number], hold: number;
      if (s < j.w0) { hold = smooth(s, j.pick, j.w0); const w = jobTip(j, j.w0); tip = [lerp(restTip[0], w[0], hold), lerp(restTip[1], w[1], hold) - 70 * Math.sin(hold * Math.PI)]; return finish(tip, lerp(-88, j.rho, hold), j); }
      if (s < j.w1) return finish(jobTip(j, s), j.rho, j);
      hold = 1 - smooth(s, j.w1, j.ret); const w = jobTip(j, j.w1 - 0.001);
      tip = [lerp(restTip[0], w[0], hold), lerp(restTip[1], w[1], hold) - 70 * Math.sin(hold * Math.PI)];
      return finish(tip, lerp(-88, j.rho, hold), j);
    }
  }
  return finish(restTip, -88, null);
};
const finish = (tip: [number, number], rho: number, j: Job | null) => ({tip, rho, top: [tip[0] + PEN * Math.sin(rad(rho)), tip[1] - PEN * Math.cos(rad(rho))] as [number, number], job: j});
const ChainLayer: React.FC<{s: number}> = ({s}) => {
  const p = penPose(s);
  const dist = Math.hypot(p.top[0] - HOOK.x, p.top[1] - HOOK.y);
  const sag = Math.min(150, Math.max(0, CHAIN - dist) * 0.7);
  const d = `M ${HOOK.x} ${HOOK.y} Q ${(HOOK.x + p.top[0]) / 2} ${(HOOK.y + p.top[1]) / 2 + sag} ${p.top[0]} ${p.top[1]}`;
  return <g>
    <circle cx={HOOK.x} cy={HOOK.y} r={14} fill={C.navy} />
    <path d={d} fill="none" stroke={C.navy} strokeWidth={11} strokeLinecap="round" />
    <path d={d} fill="none" stroke="#C9D2E6" strokeWidth={6} strokeDasharray="14 7" strokeLinecap="round" />
  </g>;
};
const Pencil: React.FC<{s: number}> = ({s}) => {
  const p = penPose(s);
  return <g transform={`translate(${p.tip[0]} ${p.tip[1]}) rotate(${p.rho})`}>
    <rect x={-20} y={-PEN} width={40} height={PEN - 36} rx={5} fill={C.sun} stroke={C.navy} strokeWidth={5} />
    <rect x={-20} y={-PEN} width={40} height={30} rx={5} fill={C.poppy} stroke={C.navy} strokeWidth={5} />
    <rect x={-20} y={-PEN + 30} width={40} height={14} fill="#B9C0CC" stroke={C.navy} strokeWidth={3} />
    <path d="M -20 -36 L 0 0 L 20 -36 Z" fill="#E8C79A" stroke={C.navy} strokeWidth={5} strokeLinejoin="round" /><path d="M -7 -12 L 0 0 L 7 -12 Z" fill="#2E3548" />
  </g>;
};

// ------------------------------------------------------------------------------------------ main scene
const swipeOf = (ticks: number[], t: number) => {
  let idx = -1;
  for (let i = 0; i < ticks.length; i++) if (ticks[i] <= t) idx = i;
  if (idx < 0) return {p: 0, dir: 1};
  return {p: clamp((t - ticks[idx]) / 0.26), dir: idx % 2 ? -1 : 1};
};
const HIM_TICKS = [-0.1, 0.2, 0.5, 0.8, 1.1, 1.4, 1.7, 2.0, 2.3, 2.6, 2.9];

const ChoiceChip: React.FC<{lines: string[]; swatch: string; age: number; out: number; rot: number}> = ({lines, swatch, age, out, rot}) => {
  const pop = smooth(age, 0, 0.18) * (1 + 0.07 * Math.sin(clamp(age / 0.35) * Math.PI));
  const font = (z: number) => `800 ${z}px Inter`;
  let fs = 100;
  while (fs > 30 && Math.max(...lines.map((l) => textW(l, font(fs)))) > 700) fs -= 2;
  const w = 960, h = 330;
  return <g opacity={1 - out} transform={`translate(540 ${1100 + out * 160}) rotate(${rot}) scale(${pop})`}>
    <rect x={-w / 2 + 14} y={-h / 2 + 18} width={w} height={h} rx={22} fill={C.navy} opacity={0.3} />
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={22} fill={C.w1} stroke={C.navy} strokeWidth={7} />
    <rect x={-w / 2 + 14} y={-h / 2 + 14} width={120} height={h - 28} rx={12} fill={swatch} stroke={C.navy} strokeWidth={3} />
    {lines.map((l, i) => <text key={i} x={70} y={-4 + (i - (lines.length - 1) / 2) * fs * 1.12 + fs * 0.36} textAnchor="middle" fontFamily={INTER} fontWeight={800} fontSize={fs} fill={C.navy}>{l}</text>)}
  </g>;
};

const PocketPhone: React.FC<{s: number}> = ({s}) => {
  if (s < 3.5 || (s >= B.take1 && s < 9.0)) return null;
  const bz = (s >= B.buzz1 && s < B.buzz1 + 0.22) || (s >= B.buzz2 && s < B.buzz2 + 0.22);
  const sh = bz ? Math.sin(s * 160) * 4 : 0;
  const hk = bz ? (s < B.buzz2 ? smooth(s, B.buzz1, B.buzz1 + 0.1) : 1) : 0;
  return <g transform={`translate(${sh} 0)`}>
    {bz && <circle cx={150} cy={1200} r={110} fill="url(#glow)" />}
    <clipPath id="pkclip"><rect x={0} y={1000} width={400} height={290} /></clipPath>
    <g clipPath="url(#pkclip)"><g transform="translate(150 1252) rotate(-4)">
      <rect x={-48} y={-86} width={96} height={190} rx={16} fill="#fff" />
      <rect x={-40} y={-78} width={80} height={176} rx={12} fill={bz ? 'url(#scr)' : '#1A2442'} />
    </g></g>
    {bz && <path transform={`translate(150 ${1150 - 20 * hk}) scale(${1.3 * hk})`} d="M 0 10 C -16 -6 -24 -20 -11 -26 C -4 -29 0 -23 0 -21 C 0 -23 4 -29 11 -26 C 24 -20 16 -6 0 10 Z" fill={C.poppy} stroke="#fff" strokeWidth={3} />}
    <path d="M 40 1226 Q 150 1244 262 1226 L 270 1296 L 32 1296 Z" fill="#4A4E58" stroke="#2A2D34" strokeWidth={5} strokeLinejoin="round" />
    <path d="M 70 1226 L 60 1296 M 242 1226 L 252 1296" stroke="#2A2D34" strokeWidth={4} />
  </g>;
};

const MainScene: React.FC<{s: number; t: number}> = ({s, t}) => {
  const cam: Cam = camAt(CAMK, Math.min(s, 21));
  const w = {...cam, x: cam.x + Math.sin(t * 0.8) * 3, y: cam.y + Math.sin(t * 1.1) * 2};
  const hs = swipeOf(HIM_TICKS, s);
  const take1 = s >= B.take1 && s < 9.0;
  const items = take1 ? Math.round(48 * smooth(s, 3.5, B.countEnd)) : 0;
  const leave = s < 9.0 ? smooth(s, B.leave, B.leave + 0.9) : 0;
  const hookPhoneOn = s < 3.5;
  const phY = lerp(1110, 1760, smooth(s, B.pocket, 3.4));
  const boardDown = smooth(s, 2.5, 3.1);
  const it1 = item(s, B.item1), it2 = item(s, B.item2), it3 = item(s, B.item3), itL = item(s, B.ladder);
  const ladderRot = s < B.tip ? -2 + itL.bounce * 0.1 : -2 - 34 * smooth(s, B.tip, B.tip + 0.28) + (s > B.tip + 0.28 ? Math.sin((s - B.tip - 0.28) * 20) * 2 * Math.exp(-(s - B.tip - 0.28) * 5) : 0);
  const placeK = wp(s, B.place, B.place + 0.5);
  const hasChip = s >= B.place + 0.5 && s < 9.0 ? 1 : 0;
  const standBounce = s >= B.place + 0.5 ? Math.sin((s - B.place - 0.5) * 24) * 8 * Math.exp(-(s - B.place - 0.5) * 7) : 0;

  const hands: React.ReactNode[] = [];
  // frame 1: her hand under the board
  if (s < 3.15) hands.push(<Hand5 key="hb" who="her" hx={975} hy={1225 + 400 * boardDown} opacity={1 - wp(s, 2.9, 3.1)} />);
  // take 1: her chip to the stand, then the wave
  if (s >= B.place - 0.2 && s < B.place + 0.9) {
    const a = smooth(s, B.place - 0.2, B.place), b = smooth(s, B.place + 0.5, B.place + 0.9);
    const x = lerp(840, 960, placeK), y = lerp(1170, 1205, placeK) - 50 * Math.sin(placeK * Math.PI) + 300 * (1 - a) + 320 * b;
    hands.push(<g key="chipfly" opacity={s < B.place + 0.5 ? 1 : 0}><g transform={`translate(${x} ${y - 70}) rotate(${-10 + placeK * 8})`}>
      <rect x={-44} y={-132 + 70} width={88} height={132} rx={10} fill={C.poppy} stroke={C.navy} strokeWidth={6} /></g></g>);
    hands.push(<Hand5 key="hp" who="her" hx={x} hy={y} reach={520} opacity={1 - wp(b, 0.6, 1)} />);
  }
  if (s >= B.wave && s < B.leave + 0.6) {
    const a = smooth(s, B.wave, B.wave + 0.25), b = smooth(s, B.leave, B.leave + 0.6);
    hands.push(<Hand5 key="hw" who="her" open hx={1000 + 40 * b} hy={1010 + 380 * (1 - a) + 300 * b} rot={Math.sin((s - B.wave) * 16) * 14} reach={620} opacity={a * (1 - b)} />);
  }
  // take 2: hold hands, pencil hands
  if (s >= B.pick1) {
    const chipC = chipXf(s);
    const hold = (who: 'him' | 'her', lx: number, op: number) => {
      const [hx, hy] = chipPt(s, lx, NH / 2 - 6);
      hands.push(<Hand5 key={'h' + who + lx} who={who} hx={hx} hy={hy + 24} reach={520} opacity={op} />);
    };
    void chipC;
    hold('him', -140, wp(s, B.pick1 + 0.05, B.pick1 + 0.2) * (1 - wp(s, B.read - 0.1, B.read + 0.15)) + wp(s, B.back + 0.1, B.back + 0.3) * (1 - wp(s, B.outWipe + 0.2, B.outWipe + 0.5)));
    hold('her', 140, wp(s, B.read - 0.2, B.read + 0.05) * (1 - wp(s, B.back, B.back + 0.2)));
    const p = penPose(s);
    if (p.job) {
      const k = 0.82, hk = p.job.who;
      const vis = hk === 'him' ? wp(s, p.job.pick, p.job.pick + 0.2) * (1 - wp(s, p.job.ret - 0.2, p.job.ret)) : wp(s, p.job.pick, p.job.pick + 0.2) * (1 - wp(s, p.job.ret - 0.2, p.job.ret));
      hands.push(<Hand5 key="hpen" who={hk} hx={lerp(p.tip[0], p.top[0], k) + 22} hy={lerp(p.tip[1], p.top[1], k) + 20} rot={-24} reach={540} opacity={vis} />);
    }
  }

  return <g>
    <g transform={planeT(w, 0.2)}><Backdrop /></g>
    <g transform={planeT(w, 0.3)}>
      <rect x={-60} y={296} width={1200} height={14} fill={C.navy} opacity={0.9} />
      {Array.from({length: 16}, (_, i) => <g key={i} transform={`translate(${-20 + i * 76} 314)`}>
        {[0, 1, 2].map((j) => <rect key={j} x={0} y={j * 38} width={58} height={32} rx={5} fill={[C.poppy, C.sun, C.mint, C.cobalt, C.w2, C.w3, C.w4][(i * 3 + j * 5) % 7]} stroke={C.navy} strokeWidth={3} opacity={0.95} />)}
      </g>)}
    </g>
    <g transform={planeT(w, 0.9)}>
      <Person who="him" x={HIM.x} y={HIM.y} t={t} pose={himPose(s)} seed={0.4} />
      <Person who="her" x={HER.x + 760 * leave} y={HER.y} t={t} pose={herPose(s)} seed={1.9} />
    </g>
    <g transform={planeT(w, 0.95)}><SignHorn s={s} t={t} /></g>
    <g transform={planeT(w, 1.05)}>
      <Cashier s={s} t={t} />
      <Counter />
      <Register items={items} />
      <Receipt items={items} />
      <Stand has={hasChip} bounce={standBounce} />
      <PocketPhone s={s} />
      {take1 && <g>
        <Basket />
        <Roller x={90} rot={-9} k={it1.k} bounce={it1.bounce} col={C.cobalt} />
        <Roller x={190} rot={8} k={it3.k} bounce={it3.bounce} col={C.poppy} />
        <Tape x={270} k={it2.k} bounce={it2.bounce} col={C.sun} />
        <Ladder k={itL.k} rot={ladderRot} />
      </g>}
      {s < 3.2 && <g transform={`translate(838 ${1105 + 400 * boardDown}) rotate(-3) scale(0.8) translate(${-BCX} ${-BCY})`}><BoardArt /></g>}
      <ChainLayer s={s} />
      <NoteChip s={s} />
      <Pencil s={s} />
      {hands}
    </g>
    <g transform={planeT(w, 1.04)}>
      {hookPhoneOn && <PhoneUnit rich scale={1.5} who="him" x={200} y={phY} rot={8} lit={1} p={s < 2.9 ? hs.p : 0} dir={hs.dir} down={0} thumbOn={s < 2.9 ? 1 : 0} />}
    </g>
    {s >= 3.0 && s < 4.4 && <ChoiceChip lines={spec.cards.chip_take1} swatch={C.sun} age={s - 3.0} out={smooth(s, 4.0, 4.35)} rot={-3} />}
    {s >= B.cardT2 && s < 10.8 && <ChoiceChip lines={spec.cards.chip_take2} swatch={C.mint} age={s - B.cardT2} out={smooth(s, 10.45, 10.75)} rot={3} />}
  </g>;
};

// ------------------------------------------------------------------------------------------ outside: shutter coming down, cafe across the street
const OutScene: React.FC<{t: number}> = ({t}) => {
  const cam: Cam = camAt(CAMK, Math.min(t, 24));
  const w = {...cam, x: cam.x + Math.sin(t * 0.8) * 3, y: cam.y + Math.sin(t * 1.1) * 2};
  const sp = smooth(t, B.shutter, B.shutter + 0.95);
  const bounce = t > B.shutter + 0.95 ? Math.sin((t - B.shutter - 0.95) * 22) * 10 * Math.exp(-(t - B.shutter - 0.95) * 6) : 0;
  const shutBottom = 440 + sp * 880 + bounce;
  const age = t - B.chipOut;
  const pop = smooth(age, 0, 0.18) * (1 + 0.06 * Math.sin(clamp(age / 0.35) * Math.PI));
  const steam = (i: number) => Math.sin(t * 3 + i * 2) * 8;
  const p = (a: number) => a;
  void p;
  return <g>
    <g transform={planeT(w, 0.2)}>
      <rect x={-200} y={-200} width={1480} height={2400} fill="url(#dusk)" />
      <circle cx={880} cy={560} r={300} fill={C.sun} opacity={0.12} />
    </g>
    {/* cafe across the street (smaller, far) */}
    <g transform={planeT(w, 0.45)}>
      <rect x={640} y={640} width={520} height={800} fill="#BFF3E0" stroke={C.navy} strokeWidth={7} />
      <rect x={680} y={900} width={260} height={300} rx={10} fill="#FFE9A8" stroke={C.navy} strokeWidth={6} />
      <rect x={990} y={900} width={120} height={440} rx={8} fill="#FFE9A8" stroke={C.navy} strokeWidth={6} />
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => <path key={i} d={`M ${650 + i * 52} 800 L ${702 + i * 52} 800 L ${702 + i * 52} 850 Q ${676 + i * 52} 880 ${650 + i * 52} 850 Z`} fill={i % 2 ? '#fff' : C.poppy} stroke={C.navy} strokeWidth={4} />)}
      <rect x={640} y={770} width={540} height={34} fill={C.navy} />
      <g transform="translate(920 590)">
        <rect x={-110} y={-48} width={220} height={78} rx={14} fill={C.w1} stroke={C.navy} strokeWidth={6} />
        <text x={0} y={14} textAnchor="middle" fontFamily={INTER} fontWeight={800} fontSize={60} fill={C.navy}>CAFE</text>
        {[-1, 0, 1].map((i) => <path key={i} d={`M ${i * 24 + steam(i)} -60 q 10 -14 0 -26 q -10 -12 0 -24`} fill="none" stroke="#fff" strokeWidth={7} strokeLinecap="round" opacity={0.85} />)}
      </g>
      {[760, 850].map((x) => <g key={x} transform={`translate(${x} 1120)`}><path d="M -26 -40 L -20 0 L 20 0 L 26 -40 Z" fill="#fff" stroke={C.navy} strokeWidth={5} /><path d="M 26 -30 q 22 0 18 18 q -4 14 -24 12" fill="none" stroke={C.navy} strokeWidth={5} /></g>)}
    </g>
    {/* street */}
    <g transform={planeT(w, 0.7)}>
      <rect x={-100} y={1190} width={1300} height={300} fill="#4A5A8C" />
      <rect x={-100} y={1190} width={1300} height={12} fill={C.navy} />
      {Array.from({length: 8}, (_, i) => <rect key={i} x={-40 + i * 170} y={1290} width={90} height={14} rx={7} fill="#E4E8EA" />)}
    </g>
    {/* the store facade with the shutter */}
    <g transform={planeT(w, 0.75)}>
      <rect x={-120} y={400} width={700} height={900} fill={C.w3} stroke={C.navy} strokeWidth={8} />
      <rect x={-100} y={410} width={640} height={96} fill={C.sun} stroke={C.navy} strokeWidth={6} />
      <text x={-50} y={478} textAnchor="start" fontFamily={ANTON} fontSize={64} fill={C.navy}>HARDWARE</text>
      <rect x={-60} y={540} width={380} height={520} rx={8} fill="#CFE0FF" stroke={C.navy} strokeWidth={6} />
      <rect x={350} y={540} width={170} height={760} rx={8} fill="#CFE0FF" stroke={C.navy} strokeWidth={6} />
      {/* shutter */}
      <g>
        <clipPath id="shutclip"><rect x={-120} y={506} width={700} height={Math.max(0, shutBottom - 506)} /></clipPath>
        <g clipPath="url(#shutclip)">
          <rect x={-120} y={500} width={700} height={820} fill="#B9C0CC" />
          {Array.from({length: 24}, (_, i) => <line key={i} x1={-120} x2={580} y1={520 + i * 36} y2={520 + i * 36} stroke={C.navy} strokeWidth={5} opacity={0.65} />)}
        </g>
        {sp > 0.02 && <rect x={-120} y={shutBottom - 24} width={700} height={26} fill="#8D96A8" stroke={C.navy} strokeWidth={6} />}
        {sp > 0.02 && <rect x={190} y={shutBottom - 34} width={60} height={14} rx={7} fill={C.navy} />}
      </g>
    </g>
    <g transform={planeT(w, 0.9)}><g transform="translate(540 1300) scale(0.8) translate(-540 -1300)">
      <Person who="him" x={HIM.x} y={HIM.y} t={t} pose={himPose(t)} seed={0.4} />
      <Person who="her" x={HER.x} y={HER.y} t={t} pose={herPose(t)} seed={1.9} />
    </g></g>
    <g transform={planeT(w, 1.05)}>
      <rect x={-100} y={1330} width={1300} height={700} fill="#3A4A78" stroke={C.navy} strokeWidth={7} />
      <rect x={-100} y={1330} width={1300} height={14} fill="#8DA0D8" />
      {age > 0 && <g transform={`translate(560 1150) scale(${1.2 * pop})`}>
        <rect x={-NW / 2 + 14} y={-NH / 2 + 18} width={NW} height={NH} rx={26} fill={C.navy} opacity={0.3} />
        <rect x={-NW / 2} y={-NH / 2} width={NW} height={NH} rx={26} fill="#F6F1E5" stroke={C.navy} strokeWidth={8} />
        <rect x={-NW / 2 + 16} y={-NH / 2 + 16} width={NW - 32} height={56} rx={12} fill={C.mint} stroke={C.navy} strokeWidth={3} />
        {NB.map((b, k) => <line key={k} x1={-NW / 2 + 30} x2={NW / 2 - 30} y1={b + 14} y2={b + 14} stroke="#C9D2E6" strokeWidth={3} />)}
        {N[2].map((l, k) => <text key={k} x={-NW / 2 + 40} y={NB[k]} fontFamily={COUR} fontWeight={700} fontSize={FS} fill="#2E3548">{l}</text>)}
      </g>}
      {age > 0 && <Hand5 who="her" hx={728} hy={1383} reach={460} opacity={smooth(age, 0, 0.2)} />}
    </g>
  </g>;
};

// ------------------------------------------------------------------------------------------ vote + edit
const VoteScene: React.FC<{t: number}> = ({t}) => {
  const z = 1 + 0.025 * clamp((t - 24.5) / 7);
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
  const a = wp(t, B.bigText, B.bigText + 0.2) * (1 - wp(t, 9.45, 9.7));
  if (a <= 0.01) return null;
  const pop = 1 + 0.08 * Math.sin(clamp((t - B.bigText) / 0.4) * Math.PI);
  return <g opacity={a} transform={`translate(540 1000) scale(${pop})`}>
    {['rewind.', 'take 2.'].map((l, i) => <g key={l}>
      <text x={8} y={i * 190 + 14} textAnchor="middle" fontFamily={INTER} fontWeight={800} fontSize={190} fill={C.navy}>{l}</text>
      <text x={0} y={i * 190} textAnchor="middle" fontFamily={INTER} fontWeight={800} fontSize={190} fill={i ? C.sun : '#fff'} stroke={C.navy} strokeWidth={10} paintOrder="stroke">{l}</text>
    </g>)}
  </g>;
};

type Shot = 'main' | 'out' | 'vote' | 'end';
type Mode = {kind: 'plain'; shot: Shot} | {kind: 'wipe'; k: number; under: Shot | 'none'; over: Shot; sOver?: number};
const modeAt = (t: number): Mode => {
  if (t < B.rewind) return {kind: 'plain', shot: 'main'};
  if (t < B.rewind + 0.5) { const e = smooth(t, B.rewind, B.rewind + 0.5); return {kind: 'wipe', k: 1 - e, under: 'none', over: 'main', sOver: B.rewind}; }
  if (t < B.open) return {kind: 'wipe', k: 0, under: 'none', over: 'main', sOver: B.take2};
  if (t < B.open + WIPE_DUR) return {kind: 'wipe', k: (t - B.open) / WIPE_DUR, under: 'none', over: 'main', sOver: B.take2};
  if (t < B.outWipe) return {kind: 'plain', shot: 'main'};
  if (t < B.outWipe + WIPE_DUR) return {kind: 'wipe', k: (t - B.outWipe) / WIPE_DUR, under: 'main', over: 'out'};
  if (t < B.voteWipe) return {kind: 'plain', shot: 'out'};
  if (t < B.voteWipe + WIPE_DUR) return {kind: 'wipe', k: (t - B.voteWipe) / WIPE_DUR, under: 'out', over: 'vote'};
  return {kind: 'plain', shot: t < B.endcard ? 'vote' : 'end'};
};
const FAST: [number, number][] = [[2.2, 2.7], [3.0, 3.4], [B.slide, B.slide + 0.45], [B.pick1 - 0.1, B.w1a], [B.pick2, B.w2a], [B.zoom, B.zoom + 0.35], [B.back, B.back + 0.3], [B.leave, B.leave + 0.9], [B.tip, B.tip + 0.3]];

const renderShot = (id: string, t: number, s?: number): React.ReactNode => {
  switch (id) {
    case 'main': return <MainScene s={s ?? stateTime(t)} t={t} />;
    case 'out': return <OutScene t={t} />;
    case 'vote': return <VoteScene t={t} />;
    case 'end': return <EndCard a={t - B.endcard} t={t} part={6} />;
    default: return null;
  }
};

const Scene: React.FC<{hook: Hook}> = ({hook}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const mode = modeAt(t);
  const rewinding = t >= B.rewind && t < B.open + WIPE_DUR;
  const fast = mode.kind === 'wipe' || FAST.some(([a, b]) => t >= a && t < b);
  return <>
    <MotionBlurWhen fast={fast} samples={5} shutter={mode.kind === 'wipe' ? 220 : 150}>
      <AbsoluteFill>
        <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, background: C.wall}}>
          <Defs />
          <defs>
            <linearGradient id="dusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3B56B8" /><stop offset="0.6" stopColor="#8FA6F5" /><stop offset="1" stopColor="#C9D6FF" /></linearGradient>
          </defs>
          {mode.kind === 'plain' ? renderShot(mode.shot, t) : <>
            {mode.under === 'none' ? <VoteBg t={t} /> : renderShot(mode.under, t)}
            <defs><FanClip k={mode.k} /></defs>
            <g clipPath="url(#fanclip)">{renderShot(mode.over, t, mode.sOver)}</g>
            <FanRim k={mode.k} />
          </>}
          {rewinding && <RewindGlyph a={t - (B.rewind + 0.1)} />}
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
          return <Strip key={i} text={text} y={st.y} age={t - st.from + (isHook ? 1 : 0.06)} out={isHook ? smooth(t, 2.85, 3.0) : smooth(t, st.to - 0.12, st.to)} size={isHook ? 58 : 60} rot={isHook ? 0 : i % 2 ? 0.6 : -0.6} />;
        })}
      </svg>
    </AbsoluteFill>
  </>;
};

export const Whites5: React.FC<{hook?: Hook}> = ({hook = 'a'}) => (
  <AbsoluteFill style={{background: C.wall}}>
    <Audio src={staticFile('audio/whites-ep5.wav')} volume={0.9} />
    <Scene hook={hook} />
  </AbsoluteFill>
);
