import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, lerp, smooth} from '../../lib/motion';
import {MotionBlurWhen} from '../../lib/shots';
import {
  ANTON, Backdrop, C, Cam, CamKey, Defs, EndCard, FanClip, FanRim, FreeHand, Mouth, Person, PhoneUnit, Pose,
  Strip, VoteBg, VoteCard, WIPE_DUR, camAt, fitSize, planeT, textW, COUR, INTER,
} from './world';
import spec from '../../../specs/stories/whites-ep4.json';

// Fifty Whites, part 4 "Test patch". Silent. The test-patch end of the paint aisle: a primed sample board on an easel (her wet
// POPPY square already on it, a blank dotted square for him), her basket with the POPPY can, a pencil on a chain, a small
// SUNFLOWER pot. Frame 1 fully composed (hook strip, two big faces, his lit phone mid-swipe, her arm holding the brush out).
// Take 1: a tiny heart that drips into a tomato; she gives a kind thumbs-up. Rewind. Take 2: a window; she writes
// "it needs / a view.", paints a sun in a pane, keeps the board. Cliff: intercom, banner, aisle lights go dark. Vote 23.3.

export const WHITES4_FPS = 60;
export const WHITES4_FRAMES = Math.round(spec.duration * WHITES4_FPS);
export type Hook = 'a' | 'b';
const B = spec.beats;

const HIM = {x: 240, y: 700}, HER = {x: 760, y: 720};

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
const rad = (d: number) => (d * Math.PI) / 180;
const rot2 = (a: number, x: number, y: number): [number, number] => [x * Math.cos(rad(a)) - y * Math.sin(rad(a)), x * Math.sin(rad(a)) + y * Math.cos(rad(a))];

// ------------------------------------------------------------------------------------------ faces
const HIM_LOOK: KF[] = [[0, 0.2, 0.85], [1.5, 0.2, 0.85], [1.8, 0.9, 0.35], [2.6, 0.5, 0.8], [3.4, 0.4, 0.85], [5.0, 0.4, 0.95], [6.2, 0.9, 0.3], [7.9, 0.9, 0.3], [8.2, 0.6, 0.5],
  [9.5, 0.9, 0.3], [10.4, 0.5, 0.8], [11.2, 0.4, 0.9], [13.3, 0.4, 0.9], [13.8, 0.9, 0.3], [14.6, 0.5, 0.7], [16.4, 0.6, 0.8], [17.0, 0.5, 0.7], [18.4, 0.5, 0.8], [18.7, 0.9, 0.3], [19.3, 0.8, 0.6], [20.2, 0.7, 0.4],
  [21.4, 0.3, 0.4], [21.8, 0.4, -0.9], [22.4, 0.4, -0.9], [22.7, 0.9, 0.3]];
const HER_LOOK: KF[] = [[0, -0.9, 0.35], [1.4, -0.9, 0.35], [1.6, -0.5, 0.95], [2.0, -0.5, 0.95], [2.3, -0.9, 0.3], [3.0, -0.6, 0.8], [4.0, -0.5, 0.9], [6.1, -0.5, 0.9], [6.4, -0.9, 0.2], [8.2, -0.9, 0.2],
  [9.5, -0.9, 0.3], [11.0, -0.5, 0.9], [13.8, -0.5, 0.9], [14.2, -0.4, 0.95], [14.9, -0.5, 0.9], [16.3, -0.9, 0.3], [17.0, -0.5, 0.9], [18.5, -0.5, 0.9], [18.7, -0.9, 0.3], [20.2, -0.8, 0.4],
  [21.4, -0.9, 0.3], [21.8, 0.4, -0.9], [22.4, 0.4, -0.9], [22.7, -0.9, 0.2]];
const HIM_MOUTH: [number, Mouth][] = [[0, 'gulp'], [1.9, 'o'], [2.5, 'gulp'], [3.2, 'flat'], [4.7, 'smirk'], [5.0, 'gulp'], [5.9, 'o'], [6.4, 'gulp'], [6.8, 'smirk'], [8.0, 'o'],
  [9.5, 'gulp'], [10.9, 'flat'], [11.2, 'smirk'], [13.3, 'smile'], [14.0, 'gulp'], [14.9, 'smirk'], [16.5, 'o'], [17.4, 'smile'], [18.7, 'laugh'], [19.7, 'smile'], [21.5, 'o'], [22.0, 'gulp']];
const HER_MOUTH: [number, Mouth][] = [[0, 'smirk'], [1.6, 'o'], [2.1, 'smirk'], [5.9, 'smirk'], [7.3, 'smile'],
  [9.5, 'smirk'], [14.5, 'smile'], [16.4, 'smirk'], [17.0, 'smile'], [18.7, 'laugh'], [19.7, 'smile'], [21.5, 'o']];

const blinkAt = (t: number, seed: number) => { const ph = (t + seed) % 3.7; return ph < 0.14 ? Math.sin((ph / 0.14) * Math.PI) : 0; };
const laugh = (t: number) => t >= B.laugh && t < B.laugh + 1.0;
const GULPS = [1.9, 6.4, 9.6, 22.0];

const himPose = (s: number): Pose => {
  const [lx, ly] = kf(HIM_LOOK, s);
  const g = Math.max(...GULPS.map((a) => Math.sin(wp(s, a, a + 0.42) * Math.PI)));
  const L = laugh(s);
  const sweat = s > 21.4 ? smooth(s, 21.8, 22.8) * 0.8 : 0;
  const worry = Math.max(0.5 * (1 - smooth(s, 1.5, 2.0)), smooth(s, 5.2, 5.9) * (1 - smooth(s, 6.9, 7.2)) * 0.8, s > 21.4 ? smooth(s, 21.5, 21.9) * 0.7 : 0);
  const raise = 0.15 + sweat * 0.3 + (s > 1.8 && s < 2.5 ? 0.5 : 0) + (s > 21.4 ? smooth(s, 21.5, 21.8) * 0.5 : 0);
  return {look: [lx, ly], browL: raise, browR: raise, worry, mouth: keyAt(HIM_MOUTH, s), happy: L, sweat, gulp: g,
    tilt: L ? Math.sin(s * 22) * 3 : Math.sin(s * 0.9) * 1.1, bob: L ? -Math.abs(Math.sin(s * 22)) * 9 : 0, blink: blinkAt(s, 0.4)};
};
const herPose = (s: number): Pose => {
  const [lx, ly] = kf(HER_LOOK, s);
  const L = laugh(s);
  const tiltK = smooth(s, 6.5, 6.85) * (1 - smooth(s, 7.9, 8.1));
  const brow = Math.max(smooth(s, 1.6, 1.8) * (1 - smooth(s, 2.1, 2.3)) * 0.7, tiltK * 0.35, smooth(s, 14.0, 14.3) * (1 - smooth(s, 14.6, 14.9)) * 0.35, s > 21.4 ? smooth(s, 21.5, 21.8) * 0.8 : 0);
  return {look: [lx, ly], browL: brow, browR: brow * 0.7 + 0.05, worry: 0, mouth: keyAt(HER_MOUTH, s), happy: L, sweat: 0, gulp: 0,
    tilt: L ? Math.sin(s * 21 + 1) * 3 : -tiltK * 9 + Math.sin(s * 0.8 + 2) * 1.2, bob: L ? -Math.abs(Math.sin(s * 21 + 1)) * 9 : 0, blink: blinkAt(s, 1.9)};
};

const CAMK: CamKey[] = [
  {t: 0, x: 540, y: 975, z: 1.0}, {t: 3.0, x: 540, y: 990, z: 1.03}, {t: 4.0, x: 530, y: 1010, z: 1.08}, {t: 6.0, x: 530, y: 1010, z: 1.09}, {t: 6.8, x: 545, y: 985, z: 1.04}, {t: 8.2, x: 540, y: 975, z: 1.02},
  {t: 9.5, x: 540, y: 975, z: 1.0}, {t: 11.0, x: 530, y: 1010, z: 1.07}, {t: 13.2, x: 530, y: 1010, z: 1.09}, {t: 14.2, x: 570, y: 990, z: 1.05}, {t: 16.3, x: 560, y: 1000, z: 1.06}, {t: 17.4, x: 570, y: 1010, z: 1.1},
  {t: 18.6, x: 560, y: 985, z: 1.05}, {t: 21.3, x: 560, y: 975, z: 1.03}, {t: 22.9, x: 550, y: 975, z: 1.06},
];

// ------------------------------------------------------------------------------------------ polylines (painted strokes)
type Poly = {pts: [number, number][]; cum: number[]; len: number};
const mkPoly = (pts: [number, number][]): Poly => {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return {pts, cum, len: cum[cum.length - 1]};
};
const polyAt = (P: Poly, p: number): [number, number] => {
  const d = clamp(p) * P.len;
  for (let i = 1; i < P.pts.length; i++) if (d <= P.cum[i]) {
    const k = (d - P.cum[i - 1]) / Math.max(1e-6, P.cum[i] - P.cum[i - 1]);
    return [lerp(P.pts[i - 1][0], P.pts[i][0], k), lerp(P.pts[i - 1][1], P.pts[i][1], k)];
  }
  return P.pts[P.pts.length - 1];
};
const polyD = (P: Poly, p: number) => {
  const d = clamp(p) * P.len;
  let s = `M ${P.pts[0][0]} ${P.pts[0][1]}`;
  for (let i = 1; i < P.pts.length; i++) {
    if (d >= P.cum[i]) s += ` L ${P.pts[i][0]} ${P.pts[i][1]}`;
    else { const [x, y] = polyAt(P, p); s += ` L ${x} ${y}`; break; }
  }
  return s;
};
const cubic = (p: number[][], u: number): [number, number] => {
  const m = 1 - u;
  return [0, 1].map((k) => m * m * m * p[0][k] + 3 * m * m * u * p[1][k] + 3 * m * u * u * p[2][k] + u * u * u * p[3][k]) as [number, number];
};
const HC = {x: 475, y: 1075}, HS = 1.05;
const HEART = mkPoly((() => {
  const segs = [[[0, 70], [-95, 5], [-90, -55], [-45, -62]], [[-45, -62], [-20, -66], [-3, -50], [0, -35]], [[0, -35], [3, -50], [20, -66], [45, -62]], [[45, -62], [90, -55], [95, 5], [0, 70]]];
  const out: [number, number][] = [];
  segs.forEach((sg) => { for (let i = 0; i < 32; i++) { const [x, y] = cubic(sg, i / 32); out.push([HC.x + x * HS, HC.y + y * HS]); } });
  out.push([HC.x, HC.y + 70 * HS]);
  return out;
})());
const FRAME = mkPoly([[364, 974], [586, 974], [586, 1196], [364, 1196], [364, 974]]);
const BARV = mkPoly([[475, 974], [475, 1196]]);
const BARH = mkPoly([[364, 1085], [586, 1085]]);
const SUN = {x: 530, y: 1030};

// ------------------------------------------------------------------------------------------ board + easel + bench + basket
const BX = 310, BY = 880, BW = 640, BH = 360, BCX = 630, BCY = 1060;
const BT = 1330;   // bench top
const Easel: React.FC = () => <g>
  {[400, 860].map((x) => <rect key={x} x={x - 14} y={1236} width={28} height={BT - 1236 + 20} fill="#9B6A3A" stroke={C.navy} strokeWidth={5} />)}
  <rect x={BX - 20} y={1232} width={BW + 40} height={30} rx={8} fill="#B57F48" stroke={C.navy} strokeWidth={6} />
</g>;
const Bench: React.FC = () => <g>
  <rect x={-60} y={BT} width={1200} height={90} rx={12} fill="#D9A55B" stroke={C.navy} strokeWidth={7} />
  <rect x={-50} y={BT + 8} width={1180} height={12} rx={6} fill="#FFD790" />
  {[BT + 40, BT + 64].map((y) => <line key={y} x1={-50} x2={1130} y1={y} y2={y} stroke="#A9772F" strokeWidth={4} />)}
  <rect x={-60} y={BT + 90} width={1200} height={700} fill="#B57F48" stroke={C.navy} strokeWidth={6} />
</g>;
const Pot: React.FC<{wet: number}> = ({wet}) => <g transform="translate(672 1330)">
  <path d="M -42 -62 L -42 -6 Q -42 0 -36 0 L 36 0 Q 42 0 42 -6 L 42 -62 Z" fill="#C9D2E6" stroke={C.navy} strokeWidth={5} />
  <rect x={-40} y={-44} width={80} height={30} fill={C.w1} /><rect x={-26} y={-34} width={52} height={10} rx={5} fill={C.sun} stroke={C.navy} strokeWidth={2} />
  <ellipse cx={0} cy={-62} rx={44} ry={13} fill="#DCE3F2" stroke={C.navy} strokeWidth={5} />
  <ellipse cx={0} cy={-62} rx={34} ry={8} fill={C.sun} />
  <path d="M -30 -58 Q -28 -40 -24 -46" fill="none" stroke={C.sun} strokeWidth={6} strokeLinecap="round" opacity={wet} />
</g>;
const BasketBack: React.FC = () => <g>
  <rect x={715} y={1235} width={355} height={30} rx={10} fill="#8A5B2A" stroke={C.navy} strokeWidth={6} />
  {/* her POPPY can */}
  <g transform="translate(760 1180)">
    <path d="M -50 0 L -50 110 Q -50 124 -36 124 L 36 124 Q 50 124 50 110 L 50 0 Z" fill="#C9D2E6" stroke={C.navy} strokeWidth={5} />
    <rect x={-48} y={36} width={96} height={52} fill={C.w1} /><circle cx={-24} cy={62} r={16} fill={C.poppy} stroke={C.navy} strokeWidth={3} />
    <rect x={0} y={52} width={40} height={8} rx={4} fill={C.navy} opacity={0.5} />
    <ellipse cx={0} cy={0} rx={54} ry={17} fill="#DCE3F2" stroke={C.navy} strokeWidth={5} />
    <ellipse cx={0} cy={0} rx={40} ry={11} fill={C.poppy} />
  </g>
</g>;
const BasketFront: React.FC = () => <g>
  <rect x={705} y={1245} width={375} height={100} rx={22} fill="#D9A55B" stroke={C.navy} strokeWidth={6} />
  {Array.from({length: 4}, (_, i) => <line key={i} x1={705} x2={1080} y1={1272 + i * 20} y2={1272 + i * 20} stroke="#A9772F" strokeWidth={4} />)}
  {Array.from({length: 9}, (_, i) => <line key={i} y1={1245} y2={1345} x1={740 + i * 40} x2={740 + i * 40} stroke="#A9772F" strokeWidth={3} opacity={0.6} />)}
  <rect x={695} y={1236} width={395} height={20} rx={10} fill="#C98F3E" stroke={C.navy} strokeWidth={6} />
</g>;

const BOARD_KEYS: KF[] = [[19.2, 630, 1060, 1, 0], [19.5, 690, 1000, 0.85, -4], [20.5, 690, 990, 0.85, -3], [21.0, 915, 1190, 0.5, -5]];
const boardXf = (s: number) => { const [cx, cy, sc, r] = kf(BOARD_KEYS, s); return {cx, cy, sc, r}; };
const boardPt = (s: number, x: number, y: number): [number, number] => {
  const b = boardXf(s);
  const [rx, ry] = rot2(b.r, (x - BCX) * b.sc, (y - BCY) * b.sc);
  return [b.cx + rx, b.cy + ry];
};

const Calyx: React.FC<{k: number}> = ({k}) => <g transform={`translate(475 1066) scale(${k})`}>
  <path d="M 0 0 L 2 -44 Q 4 -54 16 -58" fill="none" stroke={C.navy} strokeWidth={22} strokeLinecap="round" />
  <path d="M 0 0 L 2 -44 Q 4 -54 16 -58" fill="none" stroke={C.mint} strokeWidth={12} strokeLinecap="round" />
  {[-82, -41, 0, 41, 82].map((a) => <path key={a} transform={`rotate(${a} 0 0)`} d="M 0 0 L -13 -40 L 0 -52 L 13 -40 Z" fill={C.mint} stroke={C.navy} strokeWidth={4} strokeLinejoin="round" />)}
  <circle r={11} fill={C.mint} stroke={C.navy} strokeWidth={4} />
</g>;

const Painting: React.FC<{s: number}> = ({s}) => {
  const els: React.ReactNode[] = [];
  // take 1: heart, drips, tomato (only until the rewind)
  if (s >= 4.0 && s < 8.4) {
    const draw = wp(s, 4.0, 4.45);
    const fillK = smooth(s, 4.45, 4.68);
    const blobK = smooth(s, 5.5, 5.85);
    els.push(<g key="heart" opacity={1 - blobK}>
      <path d={polyD(HEART, draw)} fill="none" stroke={C.poppy} strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" />
      <path d={polyD(HEART, 1) + ' Z'} fill={C.poppy} opacity={fillK} />
      <ellipse cx={HC.x - 52} cy={HC.y - 30} rx={14} ry={8} transform={`rotate(-30 ${HC.x - 52} ${HC.y - 30})`} fill="#fff" opacity={0.4 * fillK} />
    </g>);
    const drips = [[417, 1105, 95, 5.0], [455, 1132, 75, 5.1], [497, 1132, 60, 5.2], [535, 1105, 90, 5.05]];
    drips.forEach(([x, y0, L, t0], i) => {
      const g = smooth(s, t0, 5.65);
      if (g <= 0.01) return;
      els.push(<g key={'d' + i}><rect x={x - 9} y={y0} width={18} height={L * g} rx={9} fill={C.poppy} /><circle cx={x} cy={y0 + L * g} r={12 + 3 * g} fill={C.poppy} /></g>);
    });
    els.push(<g key="blob" opacity={blobK} transform={`translate(475 1110) scale(${0.85 + 0.05 * Math.sin(blobK * Math.PI)} ${0.85 - 0.05 * Math.sin(blobK * Math.PI)})`}>
      <path d="M -100 -22 C -102 -72 -42 -80 0 -58 C 42 -80 102 -72 100 -22 C 108 48 52 90 0 90 C -52 90 -108 48 -100 -22 Z" fill={C.poppy} />
      <ellipse cx={-56} cy={-30} rx={18} ry={10} transform="rotate(-30 -56 -30)" fill="#fff" opacity={0.4} />
    </g>);
    // stray mint drip falls onto the top, becomes the stem
    const fall = wp(s, 5.82, 5.92);
    if (s >= 5.82 && s < 5.92) els.push(<ellipse key="mdrop" cx={475} cy={lerp(1032, 1058, fall)} rx={9} ry={13} fill={C.mint} stroke={C.navy} strokeWidth={3} />);
    const cal = s >= 5.92 ? smooth(s, 5.92, 6.1) * (1 + 0.12 * Math.sin(wp(s, 5.92, 6.2) * Math.PI)) : 0;
    if (cal > 0.01) els.push(<Calyx key="cal" k={cal} />);
  }
  // take 2: window
  if (s >= 11.2) {
    const f = wp(s, 11.2, 12.3), v = wp(s, 12.4, 12.8), h = wp(s, 12.9, 13.2);
    const st = {fill: 'none', stroke: C.poppy, strokeWidth: 18, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
    els.push(<g key="win">
      <path d={polyD(FRAME, f)} {...st} />
      {v > 0 && <path d={polyD(BARV, v)} {...st} strokeWidth={14} />}
      {h > 0 && <path d={polyD(BARH, h)} {...st} strokeWidth={14} />}
    </g>);
  }
  if (s >= 17.4) {
    const disc = wp(s, 17.4, 18.0);
    const r = 24 * smooth(disc, 0, 1);
    els.push(<g key="sun">
      <circle cx={SUN.x} cy={SUN.y} r={r} fill={C.sun} />
      {Array.from({length: 8}, (_, i) => {
        const a = wp(s, 18.0 + i * 0.055, 18.0 + i * 0.055 + 0.055);
        if (a <= 0) return null;
        const ang = rad(i * 45);
        return <line key={i} x1={SUN.x + Math.cos(ang) * 31} y1={SUN.y + Math.sin(ang) * 31} x2={SUN.x + Math.cos(ang) * (31 + 14 * a)} y2={SUN.y + Math.sin(ang) * (31 + 14 * a)} stroke={C.sun} strokeWidth={8} strokeLinecap="round" />;
      })}
    </g>);
  }
  return <g>{els}</g>;
};

const Board: React.FC<{s: number; t: number}> = ({s, t}) => {
  const b = boardXf(s);
  return <g transform={`translate(${b.cx} ${b.cy}) rotate(${b.r}) scale(${b.sc}) translate(${-BCX} ${-BCY})`}>
    <rect x={BX + 14} y={BY + 18} width={BW} height={BH} rx={18} fill={C.navy} opacity={0.25} />
    <rect x={BX} y={BY} width={BW} height={BH} rx={18} fill="#F2E8D2" stroke={C.navy} strokeWidth={8} />
    <rect x={BX + 130} y={BY + 12} width={BW - 260} height={44} rx={8} fill={C.navy} />
    <text x={BCX} y={BY + 45} textAnchor="middle" fontFamily={COUR} fontWeight={700} fontSize={32} fill={C.sun} letterSpacing={2}>TEST PATCH</text>
    {/* his blank primed square (pencil-dotted) and her wet POPPY square */}
    <rect x={340} y={955} width={270} height={260} rx={10} fill="#FBF8F1" stroke={C.navy} strokeWidth={5} />
    <rect x={346} y={961} width={258} height={248} rx={7} fill="none" stroke="#7C8DB8" strokeWidth={3} strokeDasharray="3 11" strokeLinecap="round" />
    <rect x={650} y={955} width={270} height={260} rx={10} fill={C.poppy} stroke={C.navy} strokeWidth={5} />
    <path d="M 676 985 L 820 985" stroke="#fff" strokeWidth={10} strokeLinecap="round" opacity={0.4 + 0.1 * Math.sin(t * 2)} />
    <path d="M 676 1006 L 740 1006" stroke="#fff" strokeWidth={8} strokeLinecap="round" opacity={0.28} />
    <Painting s={s} />
  </g>;
};

// ------------------------------------------------------------------------------------------ brush
const BrushArt: React.FC<{wet: string; mint: number}> = ({wet, mint}) => <g>
  <rect x={-230} y={-14} width={240} height={28} rx={14} fill="#D9A55B" stroke={C.navy} strokeWidth={5} />
  <circle cx={-212} cy={0} r={5} fill={C.navy} opacity={0.5} />
  <rect x={4} y={-24} width={50} height={48} rx={6} fill="#B9C0CC" stroke={C.navy} strokeWidth={5} />
  <path d="M 54 -22 L 120 -28 Q 138 0 120 28 L 54 22 Z" fill={wet} stroke={C.navy} strokeWidth={5} strokeLinejoin="round" />
  {wet === C.poppy && <path d="M 82 -14 L 124 -12" stroke={C.mint} strokeWidth={8} strokeLinecap="round" />}
  <path d="M 70 -12 L 112 -14 M 70 0 L 124 0 M 70 12 L 112 14" stroke={C.navy} strokeWidth={2.5} opacity={0.35} />
  {mint > 0.02 && <ellipse cx={134} cy={10 + 4 * mint} rx={6 + 4 * mint} ry={7 + 6 * mint} fill={C.mint} stroke={C.navy} strokeWidth={3} />}
</g>;

const OFFER = {x: 810, y: 1054, a: -3}, READY = {x: 420, y: 1012, a: 10}, REST = {x: 560, y: 1262, a: -6}, POT = {x: 672, y: 1272};
type BS = {tip: [number, number]; a: number; holder: 'her' | 'him' | 'her2' | 'none'};
const brushState = (s: number): BS => {
  const K = (arr: KF[], holder: BS['holder']): BS => { const [x, y, a] = kf(arr, s); return {tip: [x, y], a, holder}; };
  const heartStart = polyAt(HEART, 0);
  if (s < 2.5) return {tip: [OFFER.x, OFFER.y + Math.sin(s * 2.2) * 2], a: OFFER.a, holder: 'her'};
  if (s < 3.95) return K([[2.5, OFFER.x, OFFER.y, OFFER.a], [3.3, READY.x, READY.y, READY.a], [3.9, READY.x, READY.y, READY.a], [3.99, heartStart[0], heartStart[1], 6]], 'him');
  if (s < 4.45) { const [x, y] = polyAt(HEART, wp(s, 4.0, 4.45)); return {tip: [x, y], a: 6, holder: 'him'}; }
  if (s < 4.7) { const k = wp(s, 4.45, 4.68); return {tip: [HC.x + Math.cos(k * 14) * 32 * (1 - k * 0.3), HC.y + Math.sin(k * 14) * 22], a: 6, holder: 'him'}; }
  if (s < 8.5) return K([[4.7, HC.x + 20, HC.y + 20, 6], [5.0, 560, 990, 8], [5.55, 560, 990, 8], [5.75, 475, 1022, 10], [6.0, 475, 1022, 10], [6.5, READY.x, READY.y, READY.a], [8.5, READY.x, READY.y, READY.a]], 'him');
  if (s < 10.9) return {tip: [OFFER.x, OFFER.y + Math.sin(s * 2.2) * 2], a: OFFER.a, holder: s < 10.8 ? 'her' : 'him'};
  if (s < 11.2) return K([[10.9, OFFER.x, OFFER.y, OFFER.a], [11.2, FRAME.pts[0][0], FRAME.pts[0][1], 4]], 'him');
  if (s < 12.3) { const [x, y] = polyAt(FRAME, wp(s, 11.2, 12.3)); return {tip: [x, y], a: 4, holder: 'him'}; }
  if (s < 13.3) {
    if (s < 12.4) { const k = smooth(s, 12.3, 12.4); return {tip: [lerp(364, 475, k), lerp(974, 974, k)], a: 4, holder: 'him'}; }
    if (s < 12.8) { const [x, y] = polyAt(BARV, wp(s, 12.4, 12.8)); return {tip: [x, y], a: 4, holder: 'him'}; }
    if (s < 12.9) { const k = smooth(s, 12.8, 12.9); return {tip: [lerp(475, 364, k), lerp(1196, 1085, k)], a: 4, holder: 'him'}; }
    const [x, y] = polyAt(BARH, wp(s, 12.9, 13.2)); return {tip: [x, y], a: 4, holder: 'him'};
  }
  if (s < 17.0) { const [x, y, a] = kf([[13.3, 586, 1085, 4], [13.9, REST.x, REST.y, REST.a]], s); return {tip: [x, y + Math.sin(s * 1.6) * 3], a, holder: 'him'}; }
  if (s < 17.4) return K([[17.0, REST.x, REST.y, REST.a], [17.2, POT.x, POT.y, 172], [17.4, SUN.x, SUN.y, 172]], 'her2');
  if (s < 18.0) return {tip: [SUN.x + Math.cos((s - 17.4) * 16) * 12, SUN.y + Math.sin((s - 17.4) * 16) * 10], a: 172, holder: 'her2'};
  if (s < 18.55) { const i = Math.min(7, Math.floor((s - 18.0) / 0.055)); const q = ((s - 18.0) / 0.055) % 1; const ang = rad(i * 45); const r = 31 + 14 * q; return {tip: [SUN.x + Math.cos(ang) * r, SUN.y + Math.sin(ang) * r], a: 172, holder: 'her2'}; }
  if (s < 19.0) return K([[18.55, SUN.x + 50, SUN.y + 20, 172], [18.95, POT.x, POT.y, 100]], 'her2');
  return {tip: [POT.x, POT.y], a: 100, holder: 'none'};
};
const brushO = (b: BS): [number, number] => { const [dx, dy] = rot2(b.a, 130, 0); return [b.tip[0] - dx, b.tip[1] - dy]; };
const gripAt = (b: BS, gx: number): [number, number] => { const [ox, oy] = brushO(b); const [dx, dy] = rot2(b.a, gx, 0); return [ox + dx, oy + dy]; };

// ------------------------------------------------------------------------------------------ note chip + pencil on a chain
const NW = 560, NH = 340;
const FONT_N = `700 92px "Courier Prime"`;
const CHIP_KEYS: KF[] = [[14.8, 880, 1360, 0.55, 10], [15.15, 735, 1130, 0.75, -3], [16.3, 735, 1130, 0.75, -3], [16.4, 735, 1130, 0.75, -3], [16.7, 540, 1070, 1.32, 0]];
const chipXf = (s: number) => {
  const [cx, cy, sc, r] = kf(CHIP_KEYS, s);
  const fall = smooth(s, 16.95, 17.3);
  return {cx, cy: cy + fall * 420, sc, r, op: 1 - fall};
};
const chipPt = (s: number, x: number, y: number): [number, number] => {
  const c = chipXf(s);
  const [rx, ry] = rot2(c.r, x * c.sc, y * c.sc);
  return [c.cx + rx, c.cy + ry];
};
const NL = [spec.cards.chips[0][0], spec.cards.chips[0][1]];
const NBASE = [18, 118];
const WR: [number, number][] = [[B.write1, 15.7], [B.write2, 16.3]];
const NoteChip: React.FC<{s: number}> = ({s}) => {
  if (s < 14.8 || s >= 17.4) return null;
  const c = chipXf(s);
  const pin = smooth(s, 14.8, 15.0);
  return <g opacity={c.op * pin} transform={`translate(${c.cx} ${c.cy}) rotate(${c.r}) scale(${c.sc})`}>
    <rect x={-NW / 2 + 14} y={-NH / 2 + 18} width={NW} height={NH} rx={24} fill={C.navy} opacity={0.25} />
    <rect x={-NW / 2} y={-NH / 2} width={NW} height={NH} rx={24} fill="#F6F1E5" stroke={C.navy} strokeWidth={8} />
    <rect x={-NW / 2 + 16} y={-NH / 2 + 16} width={NW - 32} height={56} rx={12} fill={C.poppy} stroke={C.navy} strokeWidth={3} />
    {[0, 1].map((k) => <line key={k} x1={-NW / 2 + 30} x2={NW / 2 - 30} y1={NBASE[k] + 12} y2={NBASE[k] + 12} stroke="#C9D2E6" strokeWidth={3} />)}
    {NL.map((l, k) => {
      const tw = textW(l, FONT_N);
      const p = wp(s, WR[k][0], WR[k][1]);
      return <g key={k}><clipPath id={`nc${k}`}><rect x={-NW / 2 + 30} y={NBASE[k] - 80} width={tw * p + 6} height={120} /></clipPath>
        <text x={-NW / 2 + 40} y={NBASE[k]} fontFamily={COUR} fontWeight={700} fontSize={92} fill="#2E3548" clipPath={`url(#nc${k})`}>{l}</text></g>;
    })}
  </g>;
};

const PEN = 190, HOOK = {x: 350, y: 1292}, CHAIN = 700, RHO_HER = 72;
const topOf = (T: [number, number], rho: number): [number, number] => [T[0] + PEN * Math.sin(rad(rho)), T[1] - PEN * Math.cos(rad(rho))];
const REST_TOP: [number, number] = [392, 1312];
const penTip = (s: number): [number, number] | null => {
  // tip while writing, in world coordinates (follows the chip)
  const x0 = -NW / 2 + 40;
  for (let k = 0; k < 2; k++) {
    const [a, b] = WR[k];
    if (s >= a && s < b) { const tw = textW(NL[k], FONT_N); const p = wp(s, a, b); return chipPt(s, x0 + tw * p + 4, NBASE[k] + 6 + Math.sin(s * 40) * 2); }
  }
  if (s >= WR[0][1] && s < WR[1][0]) { const p = smooth(s, WR[0][1], WR[1][0]); const a = chipPt(s, x0 + textW(NL[0], FONT_N), NBASE[0] + 6), c = chipPt(s, x0, NBASE[1] + 6); return [lerp(a[0], c[0], p), lerp(a[1], c[1], p)]; }
  return null;
};
const penPose = (s: number) => {
  const pick = smooth(s, 14.85, 15.2), ret = smooth(s, 16.3, 16.65);
  const restTip: [number, number] = [REST_TOP[0] + PEN * 0.998, REST_TOP[1] + 8];
  let tip: [number, number], rho: number;
  if (s < 15.2 || s >= 16.3) {
    const hold = s < 15.2 ? pick : 1 - ret;
    const wStart = chipPt(15.2, -NW / 2 + 44, NBASE[0] + 6), wEnd = chipPt(16.3, -NW / 2 + 40 + textW(NL[1], FONT_N), NBASE[1] + 6);
    const wt: [number, number] = s < 15.2 ? wStart : wEnd;
    tip = [lerp(restTip[0], wt[0], hold), lerp(restTip[1], wt[1], hold) - 70 * Math.sin(hold * Math.PI)];
    rho = lerp(-88, RHO_HER, hold);
  } else { tip = penTip(s) ?? [0, 0]; rho = RHO_HER; }
  const top = topOf(tip, rho);
  return {tip, rho, top, held: s >= 14.85 && s < 16.85 ? 1 : 0};
};
const PenLayer: React.FC<{s: number; t: number}> = ({s, t}) => {
  const p = penPose(s);
  const dist = Math.hypot(p.top[0] - HOOK.x, p.top[1] - HOOK.y);
  const sag = Math.min(120, Math.max(0, CHAIN - dist) * 0.8);
  const swing = s > 14.9 && s < 16.0 ? Math.sin((s - 14.9) * 18) * 14 * Math.exp(-(s - 14.9) * 1.2) : 0;
  const d = `M ${HOOK.x} ${HOOK.y} Q ${(HOOK.x + p.top[0]) / 2 + swing} ${(HOOK.y + p.top[1]) / 2 + sag} ${p.top[0]} ${p.top[1]}`;
  void t;
  return <g>
    <rect x={HOOK.x - 11} y={HOOK.y} width={22} height={BT - HOOK.y + 6} rx={8} fill={C.navy} />
    <circle cx={HOOK.x} cy={HOOK.y} r={18} fill={C.navy} />
    <path d={d} fill="none" stroke={C.navy} strokeWidth={11} strokeLinecap="round" />
    <path d={d} fill="none" stroke="#C9D2E6" strokeWidth={6} strokeDasharray="14 7" strokeLinecap="round" />
    <g transform={`translate(${p.tip[0]} ${p.tip[1]}) rotate(${p.rho})`}>
      <rect x={-20} y={-PEN} width={40} height={PEN - 36} rx={5} fill={C.sun} stroke={C.navy} strokeWidth={5} />
      <rect x={-20} y={-PEN} width={40} height={30} rx={5} fill={C.poppy} stroke={C.navy} strokeWidth={5} />
      <rect x={-20} y={-PEN + 30} width={40} height={14} fill="#B9C0CC" stroke={C.navy} strokeWidth={3} />
      <path d="M -20 -36 L 0 0 L 20 -36 Z" fill="#E8C79A" stroke={C.navy} strokeWidth={5} strokeLinejoin="round" /><path d="M -7 -12 L 0 0 L 7 -12 Z" fill="#2E3548" />
    </g>
  </g>;
};

// ------------------------------------------------------------------------------------------ far plane: racks, aisle lights, speaker
const RACKC = [C.poppy, C.sun, C.mint, C.cobalt, C.w2, C.poppy, C.w3, C.sun, C.mint, C.w1, C.cobalt, C.poppy, C.w4, C.sun, C.mint, C.cobalt];
const LROWS = [{y: 432, w: 84, h: 10, t: 21.9}, {y: 462, w: 104, h: 12, t: 22.1}, {y: 496, w: 128, h: 14, t: 22.3}, {y: 534, w: 154, h: 16, t: 22.5}];
const lightK = (s: number, t0: number) => 1 - smooth(s, t0, t0 + 0.14);
const darkness = (s: number) => LROWS.reduce((a, r) => a + (1 - lightK(s, r.t)), 0) / LROWS.length;
const FarRack: React.FC<{s: number}> = ({s}) => <g>
  <rect x={-60} y={296} width={1200} height={14} fill={C.navy} opacity={0.9} />
  {RACKC.map((c, i) => <g key={i} transform={`translate(${-20 + i * 76} 314)`}>
    {[0, 1, 2].map((j) => <rect key={j} x={0} y={j * 38} width={58} height={32} rx={5} fill={RACKC[(i + j * 5) % RACKC.length]} stroke={C.navy} strokeWidth={3} opacity={0.95} />)}
  </g>)}
  <rect x={-60} y={424 - 18} width={1200} height={10} fill={C.navy} opacity={0.0} />
  {LROWS.map((r, ri) => {
    const lk = lightK(s, r.t);
    const n = Math.ceil(1180 / (r.w * 1.7)) + 1;
    return <g key={ri}>{Array.from({length: n}, (_, i) => {
      const x = -40 + i * r.w * 1.7 + (ri % 2) * r.w * 0.8;
      return <g key={i}>
        {lk > 0.05 && <rect x={x - 10} y={r.y - 8} width={r.w + 20} height={r.h + 16} rx={10} fill="#FFF6C8" opacity={0.35 * lk} />}
        <rect x={x} y={r.y} width={r.w} height={r.h} rx={r.h / 2} fill={lk > 0.5 ? '#FFFBE0' : '#46527A'} stroke={C.navy} strokeWidth={3} />
      </g>;
    })}</g>;
  })}
</g>;

const Speaker: React.FC<{age: number}> = ({age}) => {
  if (age < 0) return null;
  const pop = smooth(age, 0, 0.14) * (1 + 0.15 * Math.sin(clamp(age / 0.3) * Math.PI));
  const cx = 945, cy = 520;
  return <g>
    <g transform={`translate(${cx} ${cy}) scale(${pop})`}>
      {[0, 1, 2].map((i) => {
        const a = clamp(((age * 1.3) % 1.1) - i * 0.18) / 0.9;
        if (!(a > 0 && a < 1)) return null;
        const r = 90 + a * 80, d = `M ${-r * 0.707} ${-r * 0.707} A ${r} ${r} 0 0 0 ${-r * 0.707} ${r * 0.707}`;
        return <g key={i} opacity={1 - a}><path d={d} fill="none" stroke={C.navy} strokeWidth={16} strokeLinecap="round" /><path d={d} fill="none" stroke="#fff" strokeWidth={8} strokeLinecap="round" /></g>;
      })}
      <line x1={0} y1={-250} x2={0} y2={-70} stroke={C.navy} strokeWidth={10} />
      <rect x={-66} y={-76} width={132} height={150} rx={22} fill={C.w1} stroke={C.navy} strokeWidth={8} />
      <circle cy={8} r={44} fill="#DCE3F2" stroke={C.navy} strokeWidth={6} /><circle cy={8} r={20} fill={C.navy} />
      <circle cx={0} cy={-52} r={8} fill={C.poppy} stroke={C.navy} strokeWidth={3} />
    </g>
  </g>;
};

const Banner: React.FC<{age: number}> = ({age}) => {
  if (age < 0) return null;
  const k = smooth(age, 0, 0.16);
  const sc = lerp(2.3, 1, k) + 0.05 * Math.sin(clamp((age - 0.16) / 0.3) * Math.PI) * (age > 0.16 ? 1 : 0);
  const shake = age > 0.14 && age < 0.45 ? Math.sin(age * 90) * 8 * (1 - (age - 0.14) / 0.31) : 0;
  const w = 960, h = 340;
  const l = spec.cards.banner;
  const f1 = fitSize(l[0], (s) => `400 ${s}px Anton`, 170, w - 100), f2 = fitSize(l[1], (s) => `400 ${s}px Anton`, 170, w - 100);
  return <g opacity={k} transform={`translate(${540 + shake} 1100) rotate(-2.5) scale(${sc})`}>
    <rect x={-w / 2 + 18} y={-h / 2 + 22} width={w} height={h} rx={26} fill={C.navy} />
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={26} fill={C.sun} stroke={C.navy} strokeWidth={10} />
    <rect x={-w / 2 + 16} y={-h / 2 + 16} width={w - 32} height={26} rx={10} fill={C.navy} opacity={0.85} />
    {Array.from({length: 20}, (_, i) => <path key={i} d={`M ${-w / 2 + 30 + i * 46} ${-h / 2 + 16} l 22 0 l -14 26 l -22 0 Z`} fill={C.sun} />)}
    <text x={0} y={-h / 2 + 62 + f1 * 0.78} textAnchor="middle" fontFamily={ANTON} fontSize={f1} fill={C.navy}>{l[0]}</text>
    <text x={0} y={-h / 2 + 62 + f1 * 0.78 + f2 * 0.98} textAnchor="middle" fontFamily={ANTON} fontSize={f2} fill="#fff" stroke={C.navy} strokeWidth={9} paintOrder="stroke">{l[1]}</text>
  </g>;
};

// ------------------------------------------------------------------------------------------ main scene
const hand = (who: 'him' | 'her', hx: number, hy: number, rot: number, thumb: number, base: [number, number], op: number, style: 'fist' | 'palm' = 'fist') =>
  op > 0.02 ? <FreeHand who={who} hx={hx} hy={hy} rot={rot} thumb={thumb} style={style} base={base} opacity={clamp(op * 1.5)} /> : null;

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
  let fs = 100;
  while (fs > 30 && Math.max(...lines.map((l) => textW(l, font(fs)))) > 700) fs -= 2;
  const w = 960, h = 330;
  return <g opacity={1 - out} transform={`translate(540 ${1010 + out * 160}) rotate(${rot}) scale(${pop})`}>
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
  const dk = darkness(s);
  const sb = smooth(s, 13.3, 13.7) * (1 - smooth(s, 14.8, 15.3));
  const lean = smooth(s, 13.9, 14.4) * (1 - smooth(s, 16.3, 16.8));
  const brush = brushState(s);
  const [bx, by] = brushO(brush);
  const wet = s >= 17.2 ? C.sun : C.poppy;
  const mint = s >= 5.6 && s < 5.82 ? smooth(s, 5.6, 5.8) : 0;
  const hookPhoneOn = s < 2.6;
  const lowerK = smooth(s, B.pocket, 2.3);
  const phY = lerp(1110, 1760, lowerK);

  // hands
  const hands: React.ReactNode[] = [];
  const offerGrip: [number, number] = [OFFER.x - 130 + 30 - 0 + 0, OFFER.y];   // her grip on the ferrule
  const og = gripAt({tip: [OFFER.x, OFFER.y], a: OFFER.a, holder: 'her'}, -34);
  void offerGrip;
  const herOffer = (s < 3.0) || (s >= 9.5 && s < 11.5);
  if (herOffer) {
    const away = s < 3.0 ? smooth(s, 2.45, 3.0) : smooth(s, 10.85, 11.4);
    const [gx, gy] = brush.holder === 'her' ? gripAt(brush, -34) : og;
    hands.push(hand('her', gx + 230 * away, gy + 330 * away, 0, 0.5, [1000, 1800], 1 - wp(away, 0.6, 1)));
  }
  if ((s >= 2.1 && s < 8.4) || (s >= 10.4 && s < 17.4)) {
    const arrive = s < 8.4 ? 1 - smooth(s, 2.1, 2.5) : 1 - smooth(s, 10.4, 10.85);
    const leave = smooth(s, 17.0, 17.3);
    const [gx, gy] = gripAt(brush.holder === 'him' || brush.holder === 'her' ? brush : {...brush, tip: brush.tip}, -150);
    const op = s < 8.4 ? wp(s, 2.1, 2.3) : wp(s, 10.4, 10.6);
    hands.push(hand('him', gx - 230 * arrive - 260 * leave, gy + 300 * arrive + 260 * leave, brush.a * 0.5, 0.4, [-420, 1500], op * (1 - leave)));
  }
  if (brush.holder === 'her2') {
    const arrive = 1 - smooth(s, 16.75, 17.05);
    const leave = smooth(s, 18.95, 19.4);
    const [gx, gy] = gripAt(brush, -60);
    hands.push(hand('her', gx + 240 * arrive + 260 * leave, gy + 300 * arrive + 300 * leave, 0, 0.3, [1180, 1800], wp(s, 16.75, 16.95) * (1 - leave)));
  }
  if (s >= 6.9 && s < 8.4) {
    const a = smooth(s, 6.9, 7.4), bounce = s > 7.4 ? Math.abs(Math.sin((s - 7.4) * 6)) * 10 * Math.exp(-(s - 7.4) * 1.2) : 0;
    hands.push(hand('her', 850 + 120 * (1 - a), 1020 + 320 * (1 - a) - bounce, 24 + 6 * Math.sin((s - 7.4) * 5) * (s > 7.4 ? 1 : 0), 0, [1180, 1800], wp(s, 6.9, 7.1)));
  }
  if (s >= 14.8 && s < 17.2) {
    const c = chipXf(s);
    const [hx, hy] = chipPt(s, 90, NH / 2 + 4);
    hands.push(hand('her', hx, hy + 6, 0, 0.5, [1250, 1900], wp(s, 14.85, 15.0) * (s < 16.5 ? 1 : 0)));
    const p = penPose(s);
    const k = 0.82;
    hands.push(hand('her', lerp(p.tip[0], p.top[0], k) + 22, lerp(p.tip[1], p.top[1], k) + 20, -24, 0.5, [1250, 1700], wp(s, 14.85, 15.1) * (s < 16.5 ? 1 : 0)));
  }
  if (s >= 18.9 && s < 21.5) {
    const [cx, cy] = boardPt(s, 780, 930);
    const away = smooth(s, 21.0, 21.4), arr = 1 - smooth(s, 18.95, 19.2);
    hands.push(hand('her', cx + 40 * away + 220 * arr + 250 * away, cy + 40 + 300 * arr + 320 * away, 8, 0.3, [1180, 1800], wp(s, 18.95, 19.1) * (1 - wp(away, 0.7, 1))));
  }

  return <g>
    <g transform={planeT(w, 0.2)}><Backdrop /></g>
    <g transform={planeT(w, 0.3)}><FarRack s={s} /></g>
    <g transform={planeT(w, 0.3)}><rect x={-200} y={-200} width={1480} height={2400} fill={C.navy} opacity={0.42 * dk} /></g>
    <g transform={planeT(w, 0.9)}>
      <Person who="him" x={HIM.x - 26 * sb} y={HIM.y + 6 * sb} t={t} pose={himPose(s)} seed={0.4} />
      <Person who="her" x={HER.x - 45 * lean} y={HER.y + 16 * lean} t={t} pose={herPose(s)} seed={1.9} />
    </g>
    <g transform={planeT(w, 1.05)}>
      <Easel />
      <Bench />
      <Pot wet={s >= 17.2 ? 1 : 0} />
      <BasketBack />
      <Board s={s} t={t} />
      <BasketFront />
      <NoteChip s={s} />
      <PenLayer s={s} t={t} />
      <g transform={`translate(${bx} ${by}) rotate(${brush.a})`}><BrushArt wet={wet} mint={mint} /></g>
      {hands}
    </g>
    <g transform={planeT(w, 1.04)}>
      {hookPhoneOn && <PhoneUnit rich scale={1.5} who="him" x={205} y={phY} rot={8} lit={1} p={s < 1.7 ? hs.p : 0} dir={hs.dir} down={0} thumbOn={s < 1.7 ? 1 : 0} />}
    </g>
    {/* warm sunflower light on both faces */}
    {(() => {
      const wk = smooth(s, B.glow, B.glow + 0.35) * (1 - smooth(s, 20.4, 21.4));
      return wk > 0.01 ? <g opacity={wk}><circle cx={640} cy={900} r={900} fill="url(#sunwash)" /></g> : null;
    })()}
    {dk > 0 && <rect x={-100} y={-100} width={1280} height={2200} fill={C.navy} opacity={0.12 * dk} />}
    {s >= 3.0 && s < 4.4 && <ChoiceChip lines={spec.cards.chip_take1} swatch={C.sun} age={s - 3.0} out={smooth(s, 4.0, 4.35)} rot={-3} />}
    {s >= 10.0 && s < 10.9 && <ChoiceChip lines={spec.cards.chip_take2} swatch={C.mint} age={s - 10.0} out={smooth(s, 10.55, 10.85)} rot={3} />}
    <Speaker age={s - B.ding} />
    {s >= B.banner && s < 22.95 && <Banner age={s - B.banner} />}
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
  const a = wp(t, B.bigText, B.bigText + 0.2) * (1 - wp(t, 9.7, 9.95));
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
const FAST: [number, number][] = [[2.2, 2.7], [3.0, 3.4], [6.9, 7.3], [10.5, 11.0], [14.8, 15.2], [16.4, 16.75], [16.95, 17.45], [19.3, 19.95]];

const renderShot = (id: string, t: number, s?: number): React.ReactNode => {
  switch (id) {
    case 'main': return <MainScene s={s ?? stateTime(t)} t={t} />;
    case 'vote': return <VoteScene t={t} />;
    case 'end': return <EndCard a={t - B.endcard} t={t} part={5} />;
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
          <defs><radialGradient id="sunwash"><stop offset="0" stopColor={C.sun} stopOpacity={0.5} /><stop offset="0.5" stopColor={C.sun} stopOpacity={0.24} /><stop offset="1" stopColor={C.sun} stopOpacity={0} /></radialGradient></defs>
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
          return <Strip key={i} text={text} y={st.y} age={t - st.from + (isHook ? 1 : 0.06)} out={isHook ? smooth(t, 2.85, 3.0) : smooth(t, st.to - 0.12, st.to)} size={isHook ? 58 : comment ? 76 : 60} hot={comment} rot={comment || isHook ? 0 : i % 2 ? 0.6 : -0.6} />;
        })}
      </svg>
    </AbsoluteFill>
  </>;
};

export const Whites4: React.FC<{hook?: Hook}> = ({hook = 'a'}) => (
  <AbsoluteFill style={{background: C.wall}}>
    <Audio src={staticFile('audio/whites-ep4.wav')} volume={0.9} />
    <Scene hook={hook} />
  </AbsoluteFill>
);
