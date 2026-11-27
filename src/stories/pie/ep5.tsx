import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, lerp, smooth} from '../../lib/motion';
import {MotionBlurWhen} from '../../lib/shots';
import {
  Arm, Beanie, C, COUR, Cam, Counter, CrayonCup, CrayonLine, CrayonSprite, Defs, Dispenser, Far, Gloss, HAND, ANTON, Mouth, Mug, NapkinPaper, Person, Phone,
  Pose, Steam, Strip, Sugar, VoteCard, WIPE_DUR, WipeClip, WipeRim, ClockSign, planeT, textW, Fork, Plate,
} from './world';
import spec from '../../../specs/stories/pie-ep5.json';

// Pie for Two, part 5 "Closing time". Silent. Opener = both at the counter, both phones lit mid-swipe, the waitress slaps the guest check
// "1 PIE . 2 FORKS" between them. Phones go face down under mugs. Take 1 (A, I'LL GET IT.): he grabs the check, napkin, wallet = a gum wrapper
// and a moth, the waitress holds out her palm, he shrinks. Counter-clockwise slice wipe (rewind). Take 2 (B, SPLIT IT. WE'RE EVEN.): napkin,
// two stacks of bills side by side, the crust in a tiny to-go box, she lets him have it. Sidewalk: neon CLOSED, 12:00 AM, breath, headlights,
// honk, the last napkin slides over. Vote board, end card with the soft "link in bio" line.

export const PIE5_FPS = 60;
export const PIE5_FRAMES = Math.round(spec.duration * PIE5_FPS);
export type Hook = 'a' | 'b';
const B = spec.beats;
const REWIND_AT = B.rewind;
const VOTE_WIPE = B.voteWipe;
const VOTE_AT = VOTE_WIPE + WIPE_DUR;
const SLAP = spec.hookSlap;


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
type Pt = {x: number; y: number};

const BentArm: React.FC<{S: Pt; E: Pt; W: Pt; H: Pt; sleeve: string; skin: string; w?: number}> = ({S, E, W, H, sleeve, skin, w = 70}) => {
  const ang = Math.atan2(W.y - E.y, W.x - E.x);
  const c0 = {x: W.x - Math.cos(ang) * 44, y: W.y - Math.sin(ang) * 44};
  const line = (a: Pt, b: Pt, sw: number, col: string, cap: 'round' | 'butt' = 'round') => <path d={`M ${a.x} ${a.y} L ${b.x} ${b.y}`} stroke={col} strokeWidth={sw} strokeLinecap={cap} fill="none" />;
  return <g>
    <path d={`M ${S.x} ${S.y} L ${E.x} ${E.y} L ${W.x} ${W.y}`} fill="none" stroke={C.ink} strokeWidth={w + 14} strokeLinecap="round" strokeLinejoin="round" />
    <path d={`M ${S.x} ${S.y} L ${E.x} ${E.y} L ${W.x} ${W.y}`} fill="none" stroke={sleeve} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
    {line(c0, W, w + 22, C.ink, 'butt')}{line(c0, W, w + 8, '#FFFFFF', 'butt')}
    {line(W, H, w * 0.6 + 12, C.ink)}{line(W, H, w * 0.6, skin)}
    <circle cx={H.x} cy={H.y} r={w * 0.52} fill={skin} stroke={C.ink} strokeWidth={7} />
    <path d={`M ${H.x + 10} ${H.y - 14} q 12 8 0 16 M ${H.x + 10} ${H.y + 6} q 12 8 0 16`} fill="none" stroke={C.ink} strokeWidth={4} opacity={0.5} strokeLinecap="round" />
  </g>;
};

const Exclaim: React.FC<{x: number; y: number; k: number}> = ({x, y, k}) => {
  const sp = k <= 0 ? 0 : 1 + Math.sin(clamp(k) * Math.PI * 1.5) * Math.exp(-clamp(k) * 4.2) * 0.45;
  const pts = Array.from({length: 16}, (_, i) => { const a = (i / 16) * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 46 : 78; return `${Math.cos(a) * r},${Math.sin(a) * r}`; }).join(' ');
  return <g transform={`translate(${x} ${y}) scale(${sp}) rotate(8)`}>
    <polygon points={pts} fill={C.ink} transform="translate(5 7)" opacity={0.35} /><polygon points={pts} fill={C.pumpkin} stroke={C.ink} strokeWidth={7} strokeLinejoin="round" />
    <text x={0} y={34} textAnchor="middle" fontFamily={`"Anton", sans-serif`} fontSize={92} fill={C.ink}>!</text>
  </g>;
};

const InsertBG: React.FC<{t: number}> = ({t}) => <g>
  <g filter="url(#blurSoft)"><Far t={t} /><rect x={-200} y={1010} width={1500} height={900} fill="#79B8A4" /></g>
  <rect x={-100} y={-100} width={1300} height={2200} fill={C.ink} opacity={0.45} />
</g>;
const fitW = (txt: string, size: number, maxW: number) => Math.min(size, (size * maxW) / textW(txt, `700 ${size}px ${HAND}`));

const CloseBG: React.FC<{t: number}> = ({t}) => <g>
  <g filter="url(#blurSoft)"><Far t={t} /><rect x={-200} y={880} width={1500} height={400} fill="#6FB3A0" /></g>
  <rect x={-100} y={-100} width={1300} height={2200} fill={C.ink} opacity={0.3} />
  <rect x={-200} y={800} width={1480} height={450} fill="url(#counterTop)" stroke={C.ink} strokeWidth={9} />
  {Array.from({length: 16}, (_, i) => <g key={i} transform={`translate(${(i * 131) % 1100} ${840 + ((i * 59) % 380)}) rotate(${(i * 37) % 80})`} opacity={0.5}><path d="M 0 0 L 26 7 L 8 20 Z" fill="#E8FFF6" /><circle cx={34} cy={5} r={3} fill={C.mintDeep} /></g>)}
  <rect x={-200} y={1250} width={1480} height={40} fill="url(#chromeG)" stroke={C.ink} strokeWidth={9} />
  <rect x={-200} y={1290} width={1480} height={700} fill={C.tealLite} stroke={C.ink} strokeWidth={9} />
</g>;

// the clockwise wedge polygon without its own <clipPath> wrapper, so the rewind can mirror it (counter-clockwise)
const WipeClipPoly: React.FC<{k: number; tf: string}> = ({k, tf}) => {
  const a1 = -90 + 360 * smooth(k, 0, 1);
  const n = Math.max(2, Math.ceil((a1 + 90) / 8));
  const pts = ['540,960'];
  for (let i = 0; i <= n; i++) { const a = ((-90 + ((a1 + 90) * i) / n) * Math.PI) / 180; pts.push(`${540 + Math.cos(a) * 1800},${960 + Math.sin(a) * 1800}`); }
  return <polygon points={pts.join(' ')} transform={tf} />;
};

const Waitress: React.FC<{up: number; look: [number, number]}> = ({up, look}) => {
  if (up < 0.01) return null;
  const y = 930 + (1 - up) * 500;
  const SK = '#E3B38F', HR = '#7A6A5A';
  const eye = (sd: number) => <g key={sd} transform={`translate(${sd * 38} -192)`}>
    <ellipse cx={0} cy={0} rx={21} ry={22} fill="#fff" stroke={C.ink} strokeWidth={5} />
    <circle cx={look[0] * 7} cy={look[1] * 6 + 3} r={9} fill={C.ink} />
    <path d="M -24 -2 L 24 -2 L 24 -26 L -24 -26 Z" fill={SK} /><path d="M -23 -2 L 23 -2" stroke={C.ink} strokeWidth={6} strokeLinecap="round" />
    <path d="M -24 -34 Q 0 -40 24 -34" fill="none" stroke="#5A4A3C" strokeWidth={5} strokeLinecap="round" />
    <circle cx={0} cy={6} r={32} fill="none" stroke={C.ink} strokeWidth={5} opacity={0.9} />
    <path d={`M ${sd * 30} 8 l ${sd * 14} 4 M ${sd * 30} 20 l ${sd * 14} 8`} stroke="#B98E6E" strokeWidth={3} strokeLinecap="round" />
  </g>;
  return <g transform={`translate(540 ${y}) scale(1.15)`}>
    <path d="M -210 400 L -210 120 Q -206 -6 -104 -30 L 104 -30 Q 206 -6 210 120 L 210 400 Z" fill={C.mintUni} stroke={C.ink} strokeWidth={9} strokeLinejoin="round" />
    <path d="M -86 -26 L 86 -26 L 106 400 L -106 400 Z" fill={C.cream} stroke={C.ink} strokeWidth={8} strokeLinejoin="round" />
    <path d="M -78 -28 L 0 52 L 78 -28" fill="#fff" stroke={C.ink} strokeWidth={7} strokeLinejoin="round" />
    <rect x={92} y={52} width={56} height={34} rx={7} fill={C.napkin} stroke={C.ink} strokeWidth={5} transform="rotate(8 120 70)" />
    <rect x={-38} y={-96} width={76} height={78} fill={SK} stroke={C.ink} strokeWidth={7} />
    <path d="M -38 -60 L 38 -60" stroke="#B98E6E" strokeWidth={4} />
    {/* hair: back bun, grey streaks */}
    <circle cx={-90} cy={-300} r={36} fill={HR} stroke={C.ink} strokeWidth={8} />
    <path d="M -108 -304 Q -90 -322 -72 -304" fill="none" stroke="#D8D2CA" strokeWidth={5} strokeLinecap="round" />
    <ellipse cx={0} cy={-196} rx={92} ry={118} fill={SK} stroke={C.ink} strokeWidth={9} />
    <path d="M -98 -190 C -108 -318 -30 -330 0 -326 C 34 -330 108 -312 98 -190 C 76 -250 36 -262 0 -258 C -40 -262 -78 -250 -98 -190 Z" fill={HR} stroke={C.ink} strokeWidth={9} strokeLinejoin="round" />
    <path d="M -70 -262 Q -40 -290 -6 -296 M 20 -296 Q 56 -284 80 -258" fill="none" stroke="#D8D2CA" strokeWidth={7} strokeLinecap="round" />
    <path d="M -90 -200 Q -96 -150 -80 -120 M 90 -200 Q 96 -150 80 -120" fill="none" stroke={C.ink} strokeWidth={0} />
    {[-1, 1].map(eye)}
    <path d="M -40 -148 Q -34 -118 -38 -104 M 40 -148 Q 34 -118 38 -104" fill="none" stroke="#B98E6E" strokeWidth={4} strokeLinecap="round" />
    <path d="M -8 -158 Q 0 -140 10 -154" fill="none" stroke={C.ink} strokeWidth={5} strokeLinecap="round" opacity={0.7} />
    <path d="M -24 -100 L 24 -100" stroke={C.ink} strokeWidth={6} strokeLinecap="round" />
    <path d="M -24 -100 q -6 2 -8 8 M 24 -100 q 6 2 8 8" fill="none" stroke="#B98E6E" strokeWidth={3} strokeLinecap="round" />
  </g>;
};

const pop = (k0: number) => { const k = clamp(k0); return k <= 0 ? 0 : 1 + Math.sin(k * Math.PI * 1.5) * Math.exp(-k * 4.2) * 0.4 - Math.exp(-k * 9) * (1 - k); };
const CoffeeCup: React.FC<{x: number; y: number; rot?: number; s?: number; t: number; seed?: number; hot?: number; flip?: boolean}> = ({x, y, rot = 0, s = 1, t, seed = 0, hot = 1, flip = false}) => <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${flip ? -s : s} ${s})`}>
  <ellipse cx={4} cy={64} rx={108} ry={20} fill={C.ink} opacity={0.25} filter="url(#blurSh)" />
  <ellipse cx={0} cy={52} rx={96} ry={21} fill={C.napkin} stroke={C.ink} strokeWidth={7} />
  <path d="M 54 -14 Q 112 -18 108 22 Q 104 54 50 44" fill="none" stroke={C.ink} strokeWidth={22} strokeLinecap="round" />
  <path d="M 54 -14 Q 112 -18 108 22 Q 104 54 50 44" fill="none" stroke={C.napkin} strokeWidth={9} strokeLinecap="round" />
  <path d="M -66 -36 L 66 -36 L 52 44 Q 50 56 38 56 L -38 56 Q -50 56 -52 44 Z" fill={C.napkin} stroke={C.ink} strokeWidth={8} strokeLinejoin="round" />
  <path d="M -62 -8 L 62 -8 L 58 14 L -58 14 Z" fill={C.cran} stroke={C.ink} strokeWidth={4} opacity={0.95} />
  <ellipse cx={0} cy={-36} rx={66} ry={15} fill="#5A3322" stroke={C.ink} strokeWidth={6} />
  <ellipse cx={-14} cy={-38} rx={30} ry={5} fill="#8A5A3A" opacity={0.7} />
  <path d="M -42 -22 L -36 40" stroke="#fff" strokeWidth={8} opacity={0.7} strokeLinecap="round" />
  <g opacity={0.55 * hot} fill="none" stroke="#fff" strokeWidth={9} strokeLinecap="round">
    {[-24, 6, 32].map((xx, i) => <path key={i} d={`M ${xx} -52 Q ${xx + Math.sin(t * 2.2 + i + seed) * 16} -84 ${xx - 4} -112 Q ${xx - Math.sin(t * 1.8 + i * 2 + seed) * 14} -134 ${xx + 2} -150`} />)}
  </g>
</g>;

const Spark: React.FC<{x: number; y: number; k: number}> = ({x, y, k}) => {
  if (k <= 0 || k >= 1) return null;
  const s = 0.6 + k * 1.1;
  const pts = Array.from({length: 16}, (_, i) => { const a = (i / 16) * Math.PI * 2, r = i % 2 ? 16 : 46; return `${Math.cos(a) * r},${Math.sin(a) * r}`; }).join(' ');
  return <g transform={`translate(${x} ${y}) scale(${s}) rotate(${k * 40})`} opacity={1 - k * k}>
    <polygon points={pts} fill="#fff" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <polygon points={pts} fill="#FFF3B0" transform="scale(0.55)" />
  </g>;
};

const PhoneBack: React.FC<{caseColor: string; glow: number}> = ({caseColor, glow}) => <g>
  <ellipse cx={0} cy={0} rx={330} ry={330} fill="url(#haloCool)" opacity={glow} />
  <rect x={-82} y={-148} width={164} height={296} rx={30} fill="none" stroke="#DFF7FF" strokeWidth={14} opacity={glow} />
  <rect x={-80} y={-146} width={160} height={292} rx={30} fill={caseColor} stroke={C.ink} strokeWidth={8} />
  <rect x={-62} y={-128} width={62} height={62} rx={16} fill="#00000033" stroke={C.ink} strokeWidth={5} />
  <circle cx={-44} cy={-110} r={11} fill="#111" stroke={C.ink} strokeWidth={3} /><circle cx={-18} cy={-84} r={11} fill="#111" stroke={C.ink} strokeWidth={3} />
  <path d="M 38 -110 L 38 100" stroke="#fff" strokeWidth={7} opacity={0.3} strokeLinecap="round" />

</g>;
// ------------------------------------------------------------------------------------------ jukebox + notes
const Jukebox: React.FC<{x: number; y: number; t: number; on: number; s?: number; rate?: number; spin?: number}> = ({x, y, t, on, s = 1, rate = 9, spin = 220}) => {
  const cols = [C.pumpkin, '#FF3B4E', '#FFE9B0', '#7FE0C8'];
  const arc = Array.from({length: 11}, (_, i) => { const a = Math.PI + (i / 10) * Math.PI; return {x: Math.cos(a) * 118, y: -258 + Math.sin(a) * 118, i}; });
  const lamp = (i: number) => 0.18 + on * 0.82 * (Math.sin(t * rate - i * 0.9) > -0.2 ? 1 : 0.25);
  return <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx={0} cy={-190} rx={330} ry={290} fill="url(#haloWarm)" opacity={on * 0.95} />
    <ellipse cx={0} cy={6} rx={170} ry={22} fill={C.ink} opacity={0.35} filter="url(#blurSh)" />
    <path d="M -150 0 L -150 -260 Q -150 -390 0 -390 Q 150 -390 150 -260 L 150 0 Z" fill="#8B1830" stroke={C.ink} strokeWidth={9} strokeLinejoin="round" />
    <path d="M -126 -12 L -126 -262 Q -126 -362 0 -362 Q 126 -362 126 -262 L 126 -12 Z" fill="none" stroke="url(#chromeG)" strokeWidth={14} strokeLinejoin="round" />
    <path d="M -108 -150 L -108 -262 Q -108 -340 0 -340 Q 108 -340 108 -262 L 108 -150 Z" fill="#1A0D08" stroke={C.ink} strokeWidth={6} />
    <g transform="translate(0 -236)">
      <g transform={`rotate(${(t * spin) % 360})`}>
        <circle r={70} fill="#15100E" stroke={C.ink} strokeWidth={5} />
        <circle r={52} fill="none" stroke="#3A322E" strokeWidth={3} /><circle r={36} fill="none" stroke="#3A322E" strokeWidth={3} />
        <circle r={24} fill={on > 0.5 ? C.pumpkin : '#6A4A2A'} stroke={C.ink} strokeWidth={4} /><rect x={-3} y={-24} width={6} height={20} fill={C.ink} /><circle r={5} fill={C.ink} />
        <path d="M 40 -34 Q 60 -14 62 8" fill="none" stroke="#fff" strokeWidth={6} opacity={0.35} strokeLinecap="round" />
      </g>
    </g>
    {arc.map((p) => <circle key={p.i} cx={p.x} cy={p.y - 10} r={9} fill={cols[p.i % 4]} stroke={C.ink} strokeWidth={3} opacity={lamp(p.i)} />)}
    <rect x={-100} y={-140} width={200} height={90} rx={10} fill="#3A0F1C" stroke={C.ink} strokeWidth={6} />
    {[-80, -56, -32, -8, 16, 40, 64].map((xx, i) => <rect key={i} x={xx} y={-130} width={10} height={70} rx={4} fill="url(#chromeG)" opacity={0.85} />)}
    <rect x={-44} y={-42} width={88} height={30} rx={8} fill={C.chrome} stroke={C.ink} strokeWidth={5} />
    <rect x={-6} y={-38} width={12} height={22} rx={3} fill={C.ink} />
    <rect x={-150} y={-28} width={300} height={28} fill="url(#chromeG)" stroke={C.ink} strokeWidth={7} />
    <Gloss x={-146} y={-380} w={120} h={360} a={0.18} id="juke" r={30} />
  </g>;
};

const Note: React.FC<{x: number; y: number; k: number; s?: number}> = ({x, y, k, s = 1}) => k <= 0 || k >= 1 ? null : <g transform={`translate(${x} ${y}) scale(${s})`} opacity={Math.sin(k * Math.PI)}>
  <ellipse cx={0} cy={0} rx={15} ry={11} fill={C.custard} stroke={C.ink} strokeWidth={5} transform="rotate(-20)" />
  <path d="M 13 -4 L 13 -50 Q 34 -42 32 -26" fill="none" stroke={C.ink} strokeWidth={6} strokeLinecap="round" />
</g>;
const Notes: React.FC<{t: number; x: number; y: number; n: number; rate: number; spread: number; s?: number}> = ({t, x, y, n, rate, spread, s = 1}) => <g>
  {Array.from({length: n}, (_, i) => { const ph = (t * rate + i / n) % 1; return <Note key={i} x={x + Math.sin(t * 2 + i * 1.7) * spread + (i - n / 2) * spread * 0.5} y={y - ph * 230} k={ph} s={s} />; })}
</g>;
// ------------------------------------------------------------------------------------------ guest check
const fitC = (txt: string, size: number, maxW: number) => Math.min(size, (size * maxW) / textW(txt, `700 ${size}px ${COUR}`));
const CheckSlip: React.FC<{w?: number; h?: number}> = ({w = 860, h = 560}) => {
  const x0 = -w / 2, y0 = -h / 2, nz = Math.round(w / 30);
  const top: string[] = [], bot: string[] = [];
  for (let i = 0; i <= nz; i++) { top.push(`${x0 + (w * i) / nz},${y0 + (i % 2 ? 12 : 0)}`); bot.push(`${x0 + w - (w * i) / nz},${y0 + h - (i % 2 ? 12 : 0)}`); }
  const pts = [...top, ...bot].join(' ');
  const main = spec.check.line;
  const ms = fitC(main, 100, w - 90);
  return <g>
    <polygon points={pts} fill={C.ink} opacity={0.35} transform="translate(12 16)" />
    <polygon points={pts} fill={C.custard} stroke={C.ink} strokeWidth={7} strokeLinejoin="round" />
    <text x={0} y={y0 + 98} textAnchor="middle" fontFamily={COUR} fontWeight={700} fontSize={54} fill={C.cran} letterSpacing={6}>{spec.check.title}</text>
    <path d={`M ${x0 + 50} ${y0 + 132} L ${x0 + w - 50} ${y0 + 132}`} stroke={C.ink} strokeWidth={4} strokeDasharray="4 14" strokeLinecap="round" opacity={0.6} />
    <text x={x0 + 54} y={y0 + 196} fontFamily={COUR} fontWeight={700} fontSize={40} fill={C.ink} opacity={0.75}>{spec.check.tbl}</text>
    <text x={x0 + w - 54} y={y0 + 196} textAnchor="end" fontFamily={COUR} fontWeight={700} fontSize={40} fill={C.ink} opacity={0.75}>{spec.check.time}</text>
    <text x={0} y={y0 + 346} textAnchor="middle" fontFamily={COUR} fontWeight={700} fontSize={ms} fill={C.ink}>{main}</text>
    <path d={`M ${x0 + 50} ${y0 + 400} L ${x0 + w - 50} ${y0 + 400}`} stroke={C.ink} strokeWidth={4} strokeDasharray="4 14" strokeLinecap="round" opacity={0.6} />
    <rect x={x0 + 54} y={y0 + h - 100} width={w - 108} height={5} fill={C.cran} opacity={0.45} />
  </g>;
};

// ------------------------------------------------------------------------------------------ shots
type ShotId = 'D' | 'PG' | 'N1' | 'N2' | 'N3' | 'WL' | 'MO' | 'BX' | 'SD' | 'vote' | 'end';
const SHOTS: [number, ShotId][] = [[0, 'D'], [B.gag, 'PG'], [B.take1, 'D'], [B.n1, 'N1'], [B.wallet, 'WL'], [B.deadpan, 'D'], [B.n2, 'N2'], [B.money, 'MO'], [B.box, 'BX'], [B.side, 'SD'],
  [B.n3, 'N3'], [VOTE_AT, 'vote'], [B.endcard, 'end']];
const shotAt = (t: number): ShotId => keyAt(SHOTS, t);

type Seg = [number, number, [number, number, number], [number, number, number]];
const CAM_SEGS: Seg[] = [
  [0, 3.2, [540, 960, 1.0], [540, 975, 1.035]], [B.take1, B.n1, [540, 975, 1.0], [505, 965, 1.06]], [B.deadpan, B.rewind, [540, 975, 1.0], [520, 950, 1.09]],
  [B.rewind, B.n2, [540, 975, 1.0], [540, 975, 1.03]],
];
const camOf = (t: number): Cam => {
  let seg = CAM_SEGS[0];
  for (const s of CAM_SEGS) if (t >= s[0]) seg = s;
  const k = clamp((t - seg[0]) / (seg[1] - seg[0]));
  return {x: lerp(seg[2][0], seg[3][0], k), y: lerp(seg[2][1], seg[3][1], k), z: lerp(seg[2][2], seg[3][2], k)};
};

const blinkAt = (t: number, seed: number) => { const ph = (t + seed) % 3.7; return ph < 0.14 ? Math.sin((ph / 0.14) * Math.PI) : 0; };
const mkPose = (o: Partial<Pose>): Pose => ({look: [0, 0.5], brow: 0.1, worry: 0, mouth: 'soft', happy: false, sweat: 0, gulp: 0, tilt: 0, bob: 0, sq: 1, blink: 0, flush: 0.3, ...o});

// ------------------------------------------------------------------------------------------ new props
const BigCheck: React.FC<{w?: number; h?: number}> = ({w = 760, h = 400}) => {
  const x0 = -w / 2, y0 = -h / 2, nz = Math.round(w / 30);
  const top: string[] = [], bot: string[] = [];
  for (let i = 0; i <= nz; i++) { top.push(`${x0 + (w * i) / nz},${y0 + (i % 2 ? 12 : 0)}`); bot.push(`${x0 + w - (w * i) / nz},${y0 + h - (i % 2 ? 12 : 0)}`); }
  const pts = [...top, ...bot].join(' ');
  const main = spec.check.line;
  const ms = fitC(main, 104, w - 70);
  return <g>
    <polygon points={pts} fill={C.ink} opacity={0.35} transform="translate(12 16)" />
    <polygon points={pts} fill={C.custard} stroke={C.ink} strokeWidth={7} strokeLinejoin="round" />
    <text x={0} y={y0 + 78} textAnchor="middle" fontFamily={COUR} fontWeight={700} fontSize={46} fill={C.cran} letterSpacing={6}>{spec.check.title}</text>
    <path d={`M ${x0 + 46} ${y0 + 106} L ${x0 + w - 46} ${y0 + 106}`} stroke={C.ink} strokeWidth={4} strokeDasharray="4 14" strokeLinecap="round" opacity={0.6} />
    <text x={x0 + 50} y={y0 + 156} fontFamily={COUR} fontWeight={700} fontSize={34} fill={C.ink} opacity={0.75}>{spec.check.tbl}</text>
    <text x={x0 + w - 50} y={y0 + 156} textAnchor="end" fontFamily={COUR} fontWeight={700} fontSize={34} fill={C.ink} opacity={0.75}>{spec.check.time}</text>
    <text x={0} y={y0 + 272} textAnchor="middle" fontFamily={COUR} fontWeight={700} fontSize={ms} fill={C.ink}>{main}</text>
    <path d={`M ${x0 + 46} ${y0 + 322} L ${x0 + w - 46} ${y0 + 322}`} stroke={C.ink} strokeWidth={4} strokeDasharray="4 14" strokeLinecap="round" opacity={0.6} />
  </g>;
};

/** A stick of gum wrapper: crinkled foil, a mint band reading GUM. Empty, flat, obviously a wrapper. */
const GumWrapper: React.FC<{x: number; y: number; rot?: number; s?: number}> = ({x, y, rot = 0, s = 1}) => <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
  <path d="M -230 -58 L -214 -70 L -198 -56 L -182 -70 L 182 -70 L 198 -56 L 214 -70 L 230 -58 L 222 -20 L 232 14 L 222 50 L 232 66 L 214 58 L 198 70 L 182 58 L -182 58 L -198 70 L -214 58 L -232 66 L -222 50 L -232 14 L -222 -20 Z" fill="url(#chromeG)" stroke={C.ink} strokeWidth={8} strokeLinejoin="round" />
  <path d="M -200 -40 L -150 20 M -170 -50 L -130 -4 M 150 -46 L 196 18 M 120 -52 L 164 6 M -60 -56 L -40 40 M 70 -58 L 56 44" stroke="#8FA0A6" strokeWidth={5} strokeLinecap="round" opacity={0.7} />
  <rect x={-112} y={-52} width={224} height={102} rx={10} fill="#7FE0C8" stroke={C.ink} strokeWidth={7} />
  <text x={0} y={30} textAnchor="middle" fontFamily={ANTON} fontSize={86} fill={C.cran} stroke={C.ink} strokeWidth={4} paintOrder="stroke" letterSpacing={6}>GUM</text>
  <path d="M -190 -58 L 190 -60" stroke="#fff" strokeWidth={7} opacity={0.6} strokeLinecap="round" />
</g>;

const Moth: React.FC<{x: number; y: number; t: number; s?: number; rot?: number}> = ({x, y, t, s = 1, rot = 0}) => {
  const fl = 0.3 + 0.7 * Math.abs(Math.sin(t * 38));
  const wing = (sd: number) => <g key={sd} transform={`scale(${sd * fl} 1)`}>
    <path d="M 8 -6 Q 70 -70 110 -26 Q 120 14 60 24 Q 24 22 8 10 Z" fill="#D6C29C" stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
    <path d="M 8 6 Q 50 30 76 62 Q 40 78 14 34 Z" fill="#BBA57B" stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
    <circle cx={74} cy={-12} r={15} fill="#F6E7C3" stroke={C.ink} strokeWidth={4} /><circle cx={74} cy={-12} r={6} fill={C.ink} />
  </g>;
  return <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    {wing(-1)}{wing(1)}
    <ellipse cx={0} cy={6} rx={16} ry={44} fill="#7A6A55" stroke={C.ink} strokeWidth={6} />
    <path d="M -6 -36 Q -34 -78 -52 -70 M 6 -36 Q 34 -78 52 -70" fill="none" stroke={C.ink} strokeWidth={5} strokeLinecap="round" />
  </g>;
};

const Bills: React.FC<{x: number; y: number; rot?: number; s?: number}> = ({x, y, rot = 0, s = 1}) => <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
  {[0, 1, 2].map((i) => <g key={i} transform={`translate(${i * -4} ${-i * 14})`}>
    <rect x={-92} y={-48} width={184} height={96} rx={8} fill={i === 2 ? '#9ED2A4' : '#82BF8C'} stroke={C.ink} strokeWidth={6} />
    {i === 2 && <g><rect x={-76} y={-34} width={152} height={68} rx={4} fill="none" stroke="#4D8A5A" strokeWidth={3} /><ellipse cx={0} cy={0} rx={28} ry={26} fill="#C9EBC9" stroke="#4D8A5A" strokeWidth={4} /><path d="M -62 -18 L -42 -18 M -62 -4 L -42 -4 M 42 14 L 62 14 M 42 28 L 62 28" stroke="#4D8A5A" strokeWidth={4} strokeLinecap="round" /></g>}
  </g>)}
  <path d="M -60 6 q 60 -26 120 0" fill="none" stroke="#fff" strokeWidth={0} />
</g>;

const Crust: React.FC<{x: number; y: number; s?: number; rot?: number}> = ({x, y, s = 1, rot = 0}) => <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
  <path d="M -92 8 Q -80 -44 -10 -50 Q 70 -54 96 -6 Q 100 22 60 26 Q 0 8 -50 28 Q -88 30 -92 8 Z" fill={C.crust} stroke={C.ink} strokeWidth={7} strokeLinejoin="round" />
  {[-62, -30, 4, 38, 70].map((xx, i) => <path key={i} d={`M ${xx} -36 q 8 12 0 26`} fill="none" stroke={C.crustDeep} strokeWidth={6} strokeLinecap="round" />)}
  <path d="M -70 -14 Q -30 -40 20 -38" fill="none" stroke="#F6C98A" strokeWidth={6} strokeLinecap="round" opacity={0.8} />
</g>;

/** Tiny to-go box. lid 0 = shut, 1 = open. */
const ToGoBox: React.FC<{x: number; y: number; s?: number; lid: number; rot?: number}> = ({x, y, s = 1, lid, rot = 0}) => <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
  <ellipse cx={4} cy={70} rx={130} ry={16} fill={C.ink} opacity={0.3} filter="url(#blurSh)" />
  <path d={`M -104 -52 L 104 -52 L ${104 - 18 * lid} ${-86 - 46 * lid} L ${-104 + 18 * lid} ${-86 - 46 * lid} Z`} fill="#FFF6E6" stroke={C.ink} strokeWidth={8} strokeLinejoin="round" />
  <path d={`M -80 ${-52 - 16 - 20 * lid} L 80 ${-52 - 16 - 20 * lid}`} stroke="#E4D2B0" strokeWidth={5} />
  <path d="M -100 -52 L -84 -84 L 96 -84 L 100 -52 Z" fill="#4A2F1E" stroke={C.ink} strokeWidth={6} strokeLinejoin="round" opacity={lid > 0.05 ? 1 : 0} />
  <path d="M -104 -52 L 104 -52 L 92 62 Q 92 70 84 70 L -84 70 Q -92 70 -92 62 Z" fill="#FFF6E6" stroke={C.ink} strokeWidth={8} strokeLinejoin="round" />
  <path d="M -86 -8 L 86 -8" stroke="#E4D2B0" strokeWidth={5} />
  <circle cx={0} cy={26} r={26} fill={C.pie} stroke={C.ink} strokeWidth={5} /><path d="M 0 26 L 26 26 A 26 26 0 0 0 18 8 Z" fill={C.custard} stroke={C.ink} strokeWidth={3} />
</g>;

// ------------------------------------------------------------------------------------------ the counter scene
const HIM = {x: 270, y: 895}, HER = {x: 810, y: 895};
const CHK: Pt = {x: 540, y: 1080};
const HIM_TICKS = [-0.1, ...spec.audio.swipeTicks];
const HER_TICKS = [-0.18, 0.33, 0.62, 0.93, 1.22];
const LOW0 = 1.3, LOW1 = 1.85;
const HIM_FLAT = {x: 140, y: 1160, s: 0.85}, HER_FLAT = {x: 950, y: 1160, s: 0.85};
const phoneSwipe = (ticks: number[], t: number, until: number) => {
  let idx = -1;
  for (let i = 0; i < ticks.length; i++) if (ticks[i] <= t && ticks[i] < until) idx = i;
  if (idx < 0) return {p: 0, dir: 1, on: false};
  const p = (t - ticks[idx]) / 0.26;
  if (p > 1) return {p: 0, dir: 1, on: false};
  return {p: clamp(p), dir: idx % 2 ? -1 : 1, on: true};
};
type PhoneState = {x: number; y: number; rot: number; s: number; flat: number; lit: number; p: number; dir: number; thumb: number; flip: number};
const himPhone = (t: number, hook: Hook): PhoneState => {
  if (t >= B.hookEnd) return {x: HIM_FLAT.x, y: HIM_FLAT.y, rot: 0, s: HIM_FLAT.s, flat: 1, lit: 0.5, p: 0, dir: 1, thumb: 0, flip: 0};
  const sw = phoneSwipe(HIM_TICKS, t, hook === 'a' ? 0.95 : 0.6);
  let pos = {x: 250, y: 930, rot: -3, s: 0.8, lit: 1};
  let flat = 0, flip = 0;
  if (hook === 'b' && t > 0.6) {
    const k = smooth(t, 0.6, 0.95);
    pos = {x: lerp(250, 205, k), y: lerp(930, 1010, k), rot: lerp(-3, 30, k), s: lerp(0.8, 0.72, k), lit: 1};
    flip = smooth(t, 0.65, 0.95);
    const k3 = smooth(t, 1.0, 1.6);
    pos = {x: lerp(pos.x, HIM_FLAT.x, k3), y: lerp(pos.y, HIM_FLAT.y, k3), rot: lerp(pos.rot, 0, k3), s: lerp(pos.s, HIM_FLAT.s, k3), lit: 1};
    flat = k3;
  }
  const k2 = smooth(t, LOW0, LOW1);
  if (hook === 'a') return {x: lerp(pos.x, HIM_FLAT.x, k2), y: lerp(pos.y, HIM_FLAT.y, k2), rot: lerp(pos.rot, 0, k2), s: lerp(pos.s, HIM_FLAT.s, k2), flat: k2, lit: t < LOW0 ? pos.lit : lerp(pos.lit, 0.5, k2), p: sw.p, dir: sw.dir, thumb: sw.on ? 1 : 0, flip: 0};
  return {...pos, flat, lit: 1, p: sw.p, dir: sw.dir, thumb: sw.on ? 1 : 0, flip};
};
const herPhone = (t: number, hook: Hook): PhoneState => {
  const sw = phoneSwipe(HER_TICKS, t, hook === 'b' ? 0.3 : 0.95);
  const k2 = t >= B.hookEnd ? 1 : hook === 'b' ? smooth(t, 0.25, 0.7) : smooth(t, LOW0, LOW1);
  return {x: lerp(705, HER_FLAT.x, k2), y: lerp(910, HER_FLAT.y, k2), rot: lerp(6, 0, k2), s: lerp(0.74, HER_FLAT.s, k2), flat: k2, lit: lerp(1, 0.5, k2), p: sw.p, dir: sw.dir, thumb: sw.on ? 1 : 0, flip: 0};
};

const himPose = (t: number, hook: Hook): Pose => {
  const slap = SLAP[hook];
  if (t < B.hookEnd) {
    const keys: KF[] = hook === 'a'
      ? [[0, 0.05, 0.8], [0.55, 0.05, 0.8], [slap + 0.1, 0.5, 0.95], [2.4, 0.5, 0.95], [2.8, 0.9, 0.3], [3.2, 0.9, 0.3]]
      : [[0, 0.05, 0.8], [0.55, 0.05, 0.8], [0.65, 0.9, 0.05], [1.4, 0.9, 0.05], [1.8, 0.5, 0.95], [2.8, 0.5, 0.95], [3.2, 0.9, 0.3]];
    const look = kf(keys, t);
    let mouth: Mouth, bob = 0, sq = 1, sweat = 0, flush = 0.3, brow = 0.1, gulp = 0;
    if (hook === 'a') {
      mouth = t < slap ? 'flat' : t < 2.0 ? 'o' : 'grit';
      sweat = smooth(t, slap + 0.2, slap + 0.9) * 0.8; flush = 0.3 + smooth(t, slap, slap + 0.7) * 0.5; brow = 0.1 + 0.6 * smooth(t, slap, slap + 0.3);
      bob = -12 * pulse(t, slap, slap + 0.3); sq = 1 + 0.05 * pulse(t, slap, slap + 0.3);
      if (t > 2.0 && t < 2.8) gulp = Math.sin(wp(t, 2.0, 2.8) * Math.PI);
    } else {
      mouth = t < 0.65 ? 'soft' : t < 2.3 ? 'o' : 'grit';
      sq += 0.07 * Math.sin(wp(t, 0.6, 0.85) * Math.PI); bob = -20 * pulse(t, 0.6, 0.95) - 8 * pulse(t, slap, slap + 0.3);
      sweat = smooth(t, 0.7, 1.0) * 0.95; flush = 0.3 + smooth(t, 0.6, 1.1) * 0.55; brow = 0.1 + 0.9 * pulse(t, 0.6, 1.3) + 0.5 * smooth(t, slap, slap + 0.3);
      if (t > 2.4 && t < 3.1) gulp = Math.sin(wp(t, 2.4, 3.1) * Math.PI);
    }
    return mkPose({look: [look[0], look[1]], brow, worry: sweat * 0.8, mouth, sweat, gulp, tilt: Math.sin(t * 0.9) * 1.1, bob, sq: sq + 0.014 * Math.sin(t * 2.3), blink: blinkAt(t, 0.4), flush});
  }
  let look: number[] = [0.5, 0.9], mouth: Mouth = 'soft', brow = 0.15, sweat = 0, flush = 0.4, bob = 0, sq = 1 + 0.014 * Math.sin(t * 2.3), tilt = Math.sin(t * 0.9) * 0.8, gulp = 0;
  if (t < B.n1) {          // take 1: the grab
    look = kf([[5.0, 0.5, 0.95], [5.2, 0.5, 0.9], [5.5, 0.85, 0.0]], t);
    if (t >= 5.2) { mouth = 'smile'; brow = 0.55; flush = 0.5; }
    const k = smooth(t, 5.2, 5.4);
    bob = -16 * k; sq = 1 + 0.045 * k; tilt = -3 * k;
  } else if (t < B.rewind) { // deadpan: he shrinks
    const k = smooth(t, B.deadpan, B.deadpan + 0.5);
    look = kf([[10.4, 0.7, 0.2], [11.0, 0.7, 0.3], [11.6, 0.2, 0.95]], t);
    mouth = t < 10.9 ? 'o' : 'gulp'; brow = 0.8; flush = 0.5 + 0.45 * k; sweat = smooth(t, 10.6, 11.2) * 0.95;
    bob = 38 * k; sq = 1 - 0.07 * k; tilt = 5 * k + Math.sin(t * 30) * 1.2 * smooth(t, 11.2, 11.6);
    if (t > 10.9 && t < 11.6) gulp = Math.sin(wp(t, 10.9, 11.6) * Math.PI);
  } else {                 // take 2 calm
    look = [0.75, 0.1]; mouth = 'soft'; flush = 0.4; brow = 0.2;
  }
  return mkPose({look: [look[0], look[1]], brow, worry: sweat * 0.8, mouth, sweat, gulp, tilt, bob, sq, blink: blinkAt(t, 0.4), flush});
};
const herPose = (t: number, hook: Hook): Pose => {
  const slap = SLAP[hook];
  if (t < B.hookEnd) {
    const keys: KF[] = hook === 'a'
      ? [[0, -0.1, 0.75], [0.5, -0.1, 0.75], [slap + 0.1, -0.5, 0.9], [2.4, -0.5, 0.9], [2.8, -0.9, 0.2], [3.2, -0.9, 0.2]]
      : [[0, -0.1, 0.75], [0.25, -0.1, 0.75], [0.4, -1.0, 0.85], [1.5, -1.0, 0.85], [1.8, -0.9, 0.2], [slap, -0.9, 0.2], [slap + 0.2, -0.5, 0.9], [2.8, -0.5, 0.9], [3.2, -0.9, 0.2]];
    const look = kf(keys, t);
    const mouth: Mouth = hook === 'a' ? (t < slap ? 'flat' : t < 2.6 ? 'o' : 'smirk') : (t < 0.4 ? 'flat' : t < 1.5 ? 'o' : t < slap ? 'smirk' : t < 2.7 ? 'o' : 'smirk');
    const brow = 0.1 + (hook === 'b' ? 0.8 * pulse(t, 0.4, 1.3) + 0.5 * pulse(t, slap, slap + 0.6) : 0.7 * pulse(t, slap, slap + 0.7));
    return mkPose({look: [look[0], look[1]], brow, mouth, tilt: Math.sin(t * 0.8 + 2) * 1.2, sq: 1 + 0.014 * Math.sin(t * 2 + 1.3), blink: blinkAt(t, 1.9), flush: 0, bob: -6 * pulse(t, slap, slap + 0.3)});
  }
  let look: number[] = [-0.5, 0.9], mouth: Mouth = 'soft', brow = 0.1;
  if (t < B.n1) {
    look = kf([[5.0, -0.5, 0.9], [5.3, -0.9, 0.15]], t); mouth = t < 5.9 ? 'o' : 'smirk'; brow = 0.1 + 0.7 * smooth(t, 5.2, 5.4);
  } else if (t < B.rewind) {
    look = kf([[10.4, -0.8, 0.2], [11.2, -0.8, 0.2], [11.6, -0.4, 0.95]], t); mouth = 'soft'; brow = 0.5;
  } else { look = [-0.75, 0.1]; mouth = 'smirk'; }
  return mkPose({look: [look[0], look[1]], brow, mouth, tilt: Math.sin(t * 0.8 + 2) * 1.2, sq: 1 + 0.014 * Math.sin(t * 2 + 1.3), blink: blinkAt(t, 1.9), flush: 0});
};

const MUG_HIS_UP: Pt = {x: 120, y: 1030}, MUG_HERS_UP: Pt = {x: 975, y: 1030};
const MUG_LAND_HIS: Pt = {x: HIM_FLAT.x, y: 1112}, MUG_LAND_HERS: Pt = {x: HER_FLAT.x, y: 1112};

const waitressArm = (hand: Pt, aw = 64) => {
  const S0: Pt = {x: 452, y: 905};
  const mid = {x: (S0.x + hand.x) / 2, y: (S0.y + hand.y) / 2};
  const E0 = {x: mid.x + 78, y: mid.y + 46};
  const ux = hand.x - E0.x, uy = hand.y - E0.y, ul = Math.hypot(ux, uy) || 1;
  const W0 = {x: hand.x - (ux / ul) * 56, y: hand.y - (uy / ul) * 56};
  return <BentArm S={S0} E={E0} W={W0} H={hand} sleeve={C.mintUni} skin="#E3B38F" w={aw} />;
};

const Diner: React.FC<{t: number; hook: Hook}> = ({t, hook}) => {
  const cam = camOf(t);
  const him = himPose(t, hook), her = herPose(t, hook);
  const hp = himPhone(t, hook), rp = herPhone(t, hook);
  const inHook = t < B.hookEnd;
  const slap = SLAP[hook];
  const underHers = t >= B.landHers, underHis = t >= B.landHis;
  const take1 = t >= B.take1 && t < B.n1;
  const dead = t >= B.deadpan && t < B.rewind;

  // arms
  const hold = t < LOW1 + 0.3;
  const hisHold: Pt = {x: hp.x - 30 * (1 - hp.flat), y: hp.y + 104 * hp.s * (1 - hp.flat * 0.5)};
  const herHold: Pt = {x: rp.x + 24, y: rp.y + 96 * rp.s * (1 - rp.flat * 0.4)};
  const HIS_REST: Pt = {x: 215, y: 1236}, HER_REST: Pt = {x: 870, y: 1236};
  let hisA: Pt = HIS_REST;
  const herA: Pt = HER_REST;

  // the check: slapped down by the waitress in the opener; grabbed by him in take 1
  const gk = take1 ? smooth(t, 5.25, 5.6) : 0;
  const chkRaised = take1 && t >= 5.12;
  const chkP: Pt = chkRaised ? {x: lerp(CHK.x, 395, gk), y: lerp(CHK.y, 985, gk)} : CHK;
  const chkS = chkRaised ? lerp(0.68, 0.76, gk) : 0.68;
  const chkRot = chkRaised ? lerp(-5, -9, gk) : -5;
  if (take1) {
    const k = smooth(t, 5.12, 5.28);
    hisA = {x: lerp(HIS_REST.x, chkP.x - 90, k), y: lerp(HIS_REST.y, chkP.y + 60, k)};
  }
  if (dead) {
    const k = smooth(t, B.deadpan, B.deadpan + 0.4);
    hisA = {x: lerp(HIS_REST.x, 330, k), y: lerp(HIS_REST.y, 1010, k)};
  }
  const onTable = !chkRaised && (t >= SLAP[hook] + 0.12) && t < B.n1 || (t >= B.deadpan);

  // waitress
  const wUp0 = slap - 0.55;
  const up = inHook ? smooth(t, wUp0, wUp0 + 0.35) * (1 - smooth(t, 3.0, 3.35)) : dead ? smooth(t, B.deadpan, B.deadpan + 0.35) : 0;
  const wk = smooth(t, slap - 0.35, slap), wBack = smooth(t, slap + 0.12, slap + 0.45);
  const wHandSlap: Pt = {x: lerp(470, CHK.x, wk) - wBack * 60, y: lerp(930, CHK.y - 10, wk) - wBack * 170};
  const tap = t >= 10.9 ? 14 * Math.abs(Math.sin(((t - 10.9) * Math.PI) / 0.4)) * (t < 12.0 ? 1 : 0) : 0;
  const wHandPalm: Pt = {x: 500, y: 1112 - tap};
  const wOn = (inHook && t >= slap - 0.4 && t < slap + 0.5) || (dead && t >= 10.6);
  const wHand = inHook ? wHandSlap : wHandPalm;
  const chkAtSlap: Pt = t < slap + 0.12 ? wHandSlap : CHK;
  const jOn = 0.8;
  const wLook: [number, number] = dead ? [-0.5, 0.35] : [0, 0.25];

  const checkEl = (p: Pt, s: number, rot: number) => <g transform={`translate(${p.x} ${p.y}) rotate(${rot}) scale(${s})`}><BigCheck /></g>;
  const cups = [{x: 255, y: 1130, f: true}, {x: 830, y: 1130, f: false}];
  return <g>
    <g transform={planeT(cam, 0.3)}><Far t={t} /></g>
    <g transform={planeT(cam, 0.55)}><ClockSign x={540} y={522} text={spec.cards.clock1} /></g>
    <g transform={planeT(cam, 0.9)}>
      <Beanie x={1018} y={990} />
      <Jukebox x={540} y={1012} t={t} on={jOn} s={1.1} rate={7} spin={150} />
      <Waitress up={up} look={wLook} />
      <Person who="him" x={HIM.x} y={HIM.y} pose={him} />
      <Person who="her" x={HER.x} y={HER.y} pose={her} />
      <Counter stools={[{x: HIM.x}, {x: HER.x}]} />
      <CrayonCup x={385} y={1078} />
      <Dispenser x={752} y={1070} />
      {!underHis && <Mug x={MUG_HIS_UP.x} y={MUG_HIS_UP.y} />}
      {!underHers && <Mug x={MUG_HERS_UP.x} y={MUG_HERS_UP.y} />}
      {underHis && <Mug x={MUG_LAND_HIS.x} y={MUG_LAND_HIS.y} rot={180} />}
      {underHers && <Mug x={MUG_LAND_HERS.x} y={MUG_LAND_HERS.y} rot={180} />}
      {cups.map((c, i) => <CoffeeCup key={i} x={c.x} y={c.y} t={t} seed={i * 2} flip={c.f} />)}
      {onTable && checkEl(CHK, 0.68, -5)}
      {t >= slap && t < slap + 0.12 && checkEl(chkAtSlap, 0.68, -5)}
      {/* phones lying flat (lit, generic glow) until the mugs cover them */}
      {!underHis && (hook === 'b' && hp.flip > 0.001 && inHook
        ? <g transform={`translate(${hp.x} ${hp.y}) rotate(${hp.rot}) scale(${Math.abs(Math.cos(hp.flip * Math.PI)) * hp.s + 0.001} ${hp.s * lerp(1, 0.46, hp.flat)})`}>
          {hp.flip < 0.5 ? <Phone id="him" x={0} y={0} lit={1} p={0} thumb={0} skin={C.skinHim} /> : <PhoneBack caseColor="#2C2C36" glow={0} />}
        </g>
        : <Phone id="him" x={hp.x} y={hp.y} rot={hp.rot} scale={hp.s} lit={hp.lit} p={hp.p} dir={hp.dir} thumb={hp.thumb} flat={hp.flat} skin={C.skinHim} />)}
      {!underHers && <Phone id="her" x={rp.x} y={rp.y} rot={rp.rot} scale={rp.s} lit={rp.lit} p={rp.p} dir={rp.dir} thumb={rp.thumb} flat={rp.flat} caseColor={C.pink} skin={C.skinHer} />}
      {hold && t < (hook === 'b' ? 0.3 : LOW1 + 0.2) && <Arm who="her" sx={690} sy={1020} hx={herHold.x} hy={herHold.y} />}
      {hold && <Arm who="him" sx={-70} sy={1100} hx={hisHold.x} hy={hisHold.y} />}
      <Arm who="him" sx={-70} sy={1235} hx={hisA.x} hy={hisA.y} />
      <Arm who="her" sx={1150} sy={1235} hx={herA.x} hy={herA.y} />
      {chkRaised && checkEl(chkP, chkS, chkRot)}
      {take1 && t >= 5.2 && t < 5.6 && <g stroke={C.ink} strokeWidth={9} strokeLinecap="round" opacity={1 - wp(t, 5.2, 5.6)}><path d="M 560 1000 l 70 -10 M 570 1060 l 80 0 M 560 1120 l 70 12" /></g>}
      {dead && t >= B.deadpan + 0.2 && <g transform={`translate(${hisA.x + 30} ${hisA.y - 70}) rotate(-12)`} opacity={smooth(t, B.deadpan + 0.2, B.deadpan + 0.5)}><GumWrapper x={0} y={0} s={0.5} /></g>}
      {wOn && waitressArm(wHand)}
      {t >= slap && t < slap + 0.4 && <g stroke={C.ink} strokeWidth={9} strokeLinecap="round" opacity={1 - wp(t, slap, slap + 0.4)}><path d="M 290 1010 l -60 -24 M 790 1010 l 60 -24 M 270 1190 l -56 30 M 810 1190 l 56 30" /></g>}
      {hook === 'b' && t >= 0.35 && t < 1.9 && <g opacity={smooth(t, 0.35, 0.5) * (1 - smooth(t, 1.7, 1.9))}>
        <path d={`M 800 760 L ${hp.x + 20} ${hp.y - 70}`} fill="none" stroke={C.ink} strokeWidth={28} strokeLinecap="round" strokeDasharray="1 40" />
        <path d={`M 800 760 L ${hp.x + 20} ${hp.y - 70}`} fill="none" stroke="#fff" strokeWidth={17} strokeLinecap="round" strokeDasharray="1 40" />
      </g>}
      {hook === 'b' && t >= 0.6 && t < 1.9 && <g transform="translate(925 585) scale(1.6) translate(-925 -585)"><Exclaim x={925} y={585} k={wp(t, 0.6, 1.0)} /></g>}
      {t >= B.rewind && t < B.rewind + 0.9 && <g transform="translate(540 585) rotate(-4)" opacity={smooth(t, B.rewind + 0.1, B.rewind + 0.3) * (1 - smooth(t, B.rewind + 0.6, B.rewind + 0.9))}>
        <rect x={-250} y={-64} width={500} height={128} rx={20} fill={C.ink} opacity={0.35} transform="translate(8 10)" />
        <rect x={-250} y={-64} width={500} height={128} rx={20} fill={C.pumpkin} stroke={C.ink} strokeWidth={8} />
        <polygon points="-196,0 -150,-30 -150,30" fill={C.ink} /><polygon points="-150,0 -104,-30 -104,30" fill={C.ink} />
        <text x={70} y={32} textAnchor="middle" fontFamily={ANTON} fontSize={96} fill={C.ink} letterSpacing={3}>{spec.cards.rewind_badge}</text>
      </g>}
    </g>
    <g transform={planeT(cam, 1.35)}>
      <Sugar x={-70} y={1360} s={0.8} />
      <Steam x={1040} y={1290} t={t} />
    </g>
  </g>;
};

// ------------------------------------------------------------------------------------------ whole-frame napkins
type NL = {txt: string; color: string; sleeve: string; skin: string; a: number; b: number};
const HIMW = {color: C.pumpkin, sleeve: C.rust, skin: C.skinHim}, HERW = {color: C.cran, sleeve: C.cran, skin: C.skinHer};
const INS: Record<string, {t0: number; id: string; lines: NL[]; sizes: number[]}> = {
  N1: {t0: B.n1, id: 'n1', sizes: [200], lines: [{txt: "I'LL GET IT.", ...HIMW, a: 7.0, b: 7.8}]},
  N2: {t0: B.n2, id: 'n2', sizes: [190, 170], lines: [{txt: 'SPLIT IT.', ...HIMW, a: 13.25, b: 13.8}, {txt: "WE'RE EVEN.", ...HIMW, a: 13.9, b: 14.6}]},
  N3: {t0: B.n3, id: 'n3', sizes: [210], lines: [{txt: 'your turn.', ...HERW, a: 25.75, b: 26.55}]},
};
const NapkinInsert: React.FC<{t: number; kind: 'N1' | 'N2' | 'N3'}> = ({t, kind}) => {
  const I = INS[kind];
  const k = smooth(t, I.t0, I.t0 + 0.25);
  const x = lerp(1500, 540, k), rot = lerp(12, -2, k);
  const two = I.lines.length === 2;
  const ys = two ? [-62, 112] : [20];
  return <g>
    <InsertBG t={t} />
    <NapkinPaper w={840} h={560} x={x} y={790} rot={rot} id={I.id} glowA={0.9}>
      {I.lines.map((L, i) => {
        const s = fitW(L.txt, I.sizes[i], 700);
        const p = wp(t, L.a, L.b), w = textW(L.txt, `700 ${s}px ${HAND}`);
        return <g key={i}>
          <CrayonLine txt={L.txt} x={0} y={ys[i]} size={s} color={L.color} p={p} />
          {p > 0 && p < 1 && <CrayonSprite x={-w / 2 + w * p + 6} y={ys[i] - 10} color={L.color} skin={L.skin} sleeve={L.sleeve} />}
        </g>;
      })}
    </NapkinPaper>
  </g>;
};

// ------------------------------------------------------------------------------------------ the phone gag: phones buzz face up, a mug goes over, the glow dies
// ------------------------------------------------------------------------------------------ the phone gag: phones buzz face up, a mug goes over, the glow dies
const MugDrop: React.FC<{x: number; land: number; fall: number; t: number; arm: 'him' | 'her'}> = ({x, land, fall: fallT, t, arm}) => {
  const S = 1.95, RESTY = 1037, sg = arm === 'him' ? 1 : -1;
  const k = wp(t, land - fallT, land);
  const fall = t < land ? RESTY - 330 * (1 - k * k) : RESTY;
  const sq = t >= land ? 1 - 0.1 * Math.sin(wp(t, land, land + 0.2) * Math.PI) * (1 - wp(t, land, land + 0.2)) * 2 : 1;
  const hide = t < land - fallT;
  const up = smooth(t, land + 0.25, land + 0.7);
  const S0: Pt = {x: arm === 'him' ? -140 : 1220, y: 1520};
  const Hh0: Pt = {x: x - sg * 30, y: fall - 165};
  const H: Pt = {x: lerp(Hh0.x, S0.x, up * 0.8), y: lerp(Hh0.y, S0.y, up * 0.8)};
  const Wr: Pt = {x: H.x - sg * 70, y: H.y - 82};
  const mid = {x: (S0.x + Wr.x) / 2, y: (S0.y + Wr.y) / 2};
  const E: Pt = {x: mid.x + sg * 0.8 * 120, y: mid.y + 0.6 * 120};
  const hit = wp(t, land, land + 0.4);
  return <g>
    {t >= land && t < land + 0.4 && <g stroke={C.ink} strokeWidth={9} strokeLinecap="round" opacity={1 - hit}><path d={`M ${x - 230} 1130 l -50 10 M ${x + 230} 1130 l 50 10 M ${x - 190} 1190 l -44 30 M ${x + 190} 1190 l 44 30`} /></g>}
    {!hide && <BentArm S={S0} E={E} W={Wr} H={H} sleeve={arm === 'him' ? C.rust : C.cran} skin={arm === 'him' ? C.skinHim : C.skinHer} w={96} />}
    {!hide && <g transform={`translate(${x} ${fall + 93 * (1 - sq)}) scale(${S} ${S * sq}) rotate(180)`}><Mug x={0} y={0} /></g>}
    {!hide && <g><circle cx={H.x} cy={H.y} r={50} fill={arm === 'him' ? C.skinHim : C.skinHer} stroke={C.ink} strokeWidth={7} />
      <path d={`M ${H.x - sg * 6} ${H.y + 6} q ${-sg * 4} 12 ${-sg * 18} 14 M ${H.x - sg * 22} ${H.y - 6} q ${-sg * 4} 12 ${-sg * 18} 14`} fill="none" stroke={C.ink} strokeWidth={4} opacity={0.5} strokeLinecap="round" /></g>}
  </g>;
};
const PhoneGag: React.FC<{t: number}> = ({t}) => {
  const HX = 290, RX = 790, PY = 1037;
  const buzzAt = (starts: number[], until: number) => { let a = 0; for (const s of starts) if (t >= s && t < s + 0.17 && t < until) a = 1; return a; };
  const bh = buzzAt([3.25, 3.47, 3.69, 3.9], B.landHers), bm = buzzAt([3.35, 3.57, 3.79, 4.0, 4.21], B.landHis);
  const Ph: React.FC<{cx: number; b: number; land: number; id: string; caseColor: string; skin: string}> = ({cx, b, land, id, caseColor, skin}) => {
    const lit = (1 - smooth(t, land, land + 0.3)) * (0.78 + 0.22 * b);
    const dx = Math.sin(t * 150) * 9 * b;
    return <g>
      {b > 0 && <g stroke={C.ink} strokeWidth={9} strokeLinecap="round" fill="none"><path d={`M ${cx - 140} ${PY - 70} q -26 70 0 140 M ${cx - 178} ${PY - 100} q -36 100 0 200 M ${cx + 140} ${PY - 70} q 26 70 0 140 M ${cx + 178} ${PY - 100} q 36 100 0 200`} /></g>}
      <Phone id={id} x={cx + dx} y={PY} scale={1.0} lit={lit} p={0} thumb={0} caseColor={caseColor} skin={skin} />
    </g>;
  };
  return <g>
    <CloseBG t={t} />
    <rect x={-100} y={-100} width={1300} height={2200} fill={C.navy} opacity={0.42} />
    <Ph cx={HX} b={bm} land={B.landHis} id="pgh" caseColor="#2C2C36" skin={C.skinHim} />
    <Ph cx={RX} b={bh} land={B.landHers} id="pgr" caseColor={C.pink} skin={C.skinHer} />
    <MugDrop x={RX} land={B.landHers} fall={0.75} t={t} arm="her" />
    <MugDrop x={HX} land={B.landHis} fall={0.75} t={t} arm="him" />
  </g>;
};

// ------------------------------------------------------------------------------------------ the wallet: nothing but a gum wrapper, and a moth
const WalletShot: React.FC<{t: number}> = ({t}) => {
  const open = smooth(t, B.walletOpen, B.walletOpen + 0.4);
  const w0 = B.wallet;
  const hand: Pt = {x: lerp(-60, 300, smooth(t, w0 + 0.0, w0 + 0.35)), y: lerp(1300, 1080, smooth(t, w0, w0 + 0.35)) + Math.sin(t * 14) * 2 * smooth(t, B.foil, B.foil + 0.3)};
  const foil = smooth(t, B.foil, B.foil + 0.4);
  const mk = wp(t, B.moth, B.moth + 0.95);
  const mothOn = t >= B.moth;
  const mx = lerp(700, 930, mk) + Math.sin(mk * 20) * 34, my = lerp(720, 470, mk) + Math.sin(mk * 27) * 26 - 120 * Math.sin(mk * Math.PI) * 0.4;
  const wob = Math.sin(t * 9) * 1.2;
  return <g>
    <InsertBG t={t} />
    <g transform={`translate(540 800) rotate(${wob})`}>
      <ellipse cx={8} cy={250} rx={380} ry={26} fill={C.ink} opacity={0.35} filter="url(#blurSh)" />
      {/* left half: card slots, empty */}
      <rect x={-372} y={-220} width={366} height={440} rx={30} fill="#8A5230" stroke={C.ink} strokeWidth={9} />
      <rect x={-352} y={-200} width={326} height={400} rx={20} fill="none" stroke={C.custard} strokeWidth={4} strokeDasharray="14 12" opacity={0.7} />
      {[0, 1, 2].map((i) => <g key={i}><rect x={-322} y={-150 + i * 100} width={270} height={64} rx={10} fill="#4F2C16" stroke={C.ink} strokeWidth={5} /><rect x={-322} y={-150 + i * 100} width={270} height={14} rx={6} fill="#A56B42" /></g>)}
      {/* right half: the bill pocket, unfolds */}
      <g transform={`translate(6 0) scale(${Math.max(0.02, open)} 1) translate(-6 0)`}>
        <rect x={6} y={-220} width={366} height={440} rx={30} fill="#9A6038" stroke={C.ink} strokeWidth={9} />
        <rect x={26} y={-200} width={326} height={400} rx={20} fill="none" stroke={C.custard} strokeWidth={4} strokeDasharray="14 12" opacity={0.7} />
        <rect x={30} y={-90} width={318} height={280} rx={14} fill="#4F2C16" stroke={C.ink} strokeWidth={6} />
        <g transform={`translate(0 ${-foil * 0})`} opacity={open}>
          {mothOn && mk < 0.08 ? null : null}
          <GumWrapper x={188} y={lerp(40, -70, foil)} rot={lerp(0, -9, foil)} s={0.78} />
        </g>
      </g>
      <rect x={-6} y={-220} width={12} height={440} fill="#6B3E22" stroke={C.ink} strokeWidth={4} opacity={open} />
    </g>
    <Arm who="him" sx={-160} sy={1380} hx={hand.x} hy={hand.y} w={110} />
    {mothOn && <g><ellipse cx={mx} cy={my + 6} rx={70} ry={50} fill="url(#haloWhite)" opacity={0.0} /><Moth x={mx} y={my} t={t} s={1.35} rot={Math.sin(t * 7) * 18} /></g>}
  </g>;
};

// ------------------------------------------------------------------------------------------ two-shot at the counter (money, box)
const toLocalW = (p: Pt): Pt => ({x: 540 + (p.x - 540) / 0.62, y: 1000 + (p.y - 1000) / 0.62});
const TwoShotBG: React.FC<{t: number; him: Pose; her: Pose; waitress?: {up: number; hand: Pt | null}}> = ({t, him, her, waitress}) => <g>
  <Far t={t} />
  <rect x={-100} y={-100} width={1300} height={2200} fill={C.ink} opacity={0.4} />
  <ClockSign x={540} y={525} text={spec.cards.clock1} />
  {waitress && waitress.up > 0.01 && <g transform="translate(540 1000) scale(0.62) translate(-540 -1000)"><Waitress up={waitress.up} look={[0, 0.4]} /></g>}
  <Person who="him" x={250} y={800} s={0.62} pose={him} />
  <Person who="her" x={830} y={800} s={0.62} pose={her} />
  <rect x={-100} y={905} width={1300} height={130} fill="url(#counterTop)" stroke={C.ink} strokeWidth={8} />
  <Counter stools={[{x: 250}, {x: 830}]} />
  <CrayonCup x={150} y={1010} /><Dispenser x={930} y={1020} />
</g>;

const MoneyShot: React.FC<{t: number}> = ({t}) => {
  const z = 1 + 0.02 * clamp((t - B.money) / 1.8);
  const k1 = smooth(t, B.money + 0.05, B.billHis), k2 = smooth(t, B.money + 0.15, B.billHer);
  const r1 = smooth(t, B.billHer + 0.1, B.billHer + 0.55);
  const hisH: Pt = {x: lerp(-80, 385, k1) - 560 * 0 + lerp(0, -465, r1), y: lerp(1140, 1010, k1) + 130 * r1};
  const herH: Pt = {x: lerp(1160, 695, k2) + lerp(0, 465, r1), y: lerp(1140, 1010, k2) + 130 * r1};
  const landed1 = t >= B.billHis, landed2 = t >= B.billHer;
  const bill1: Pt = landed1 ? {x: 440, y: 1010} : {x: hisH.x + 60, y: hisH.y - 12};
  const bill2: Pt = landed2 ? {x: 640, y: 1010} : {x: herH.x - 60, y: herH.y - 12};
  const nod = Math.sin(wp(t, B.money + 1.2, B.money + 1.8) * Math.PI);
  const him = mkPose({look: [0.1, 0.9], mouth: t < B.billHer ? 'soft' : 'smile', brow: 0.2, flush: 0.45, tilt: -2 * nod, blink: blinkAt(t, 0.4)});
  const her = mkPose({look: [-0.1, 0.9], mouth: t < B.billHer ? 'smirk' : 'smile', happy: t >= B.billHer + 0.1, brow: 0.3, tilt: 2 * nod, blink: blinkAt(t, 1.9), flush: 0.2});
  return <g transform={`translate(540 960) scale(${z}) translate(-540 -960)`}>
    <TwoShotBG t={t} him={him} her={her} />
    <g transform="translate(540 1090) rotate(-4) scale(0.5)"><BigCheck /></g>
    <Bills x={bill1.x} y={bill1.y} s={0.95} rot={-3} /><Bills x={bill2.x} y={bill2.y} s={0.95} rot={3} />
    {(landed1 && t < B.billHis + 0.35) && <g stroke={C.ink} strokeWidth={8} strokeLinecap="round" opacity={1 - wp(t, B.billHis, B.billHis + 0.35)}><path d="M 330 960 l -40 -20 M 440 920 l 0 -44 M 330 1060 l -44 14" /></g>}
    {(landed2 && t < B.billHer + 0.35) && <g stroke={C.ink} strokeWidth={8} strokeLinecap="round" opacity={1 - wp(t, B.billHer, B.billHer + 0.35)}><path d="M 750 960 l 40 -20 M 640 920 l 0 -44 M 750 1060 l 44 14" /></g>}
    <Arm who="him" sx={-80} sy={1180} hx={hisH.x} hy={hisH.y} w={80} />
    <Arm who="her" sx={1160} sy={1180} hx={herH.x} hy={herH.y} w={80} />
  </g>;
};

const BoxShot: React.FC<{t: number}> = ({t}) => {
  const z = 1 + 0.025 * clamp((t - B.box) / 3.7);
  const b0 = B.box;
  const PLATE: Pt = {x: 345, y: 1055}, BOX0: Pt = {x: 735, y: 1045};
  // waitress hand path (world)
  const wu = smooth(t, b0, b0 + 0.3);
  const toCrust = smooth(t, b0 + 0.25, B.crustUp + 0.35), carry = smooth(t, B.crustUp + 0.4, B.crustIn - 0.05), away = smooth(t, B.crustIn + 0.15, B.lid + 0.35);
  let wh: Pt = {x: lerp(540, 335, toCrust), y: lerp(930, 1005, toCrust)};
  wh = {x: lerp(wh.x, 735, carry), y: lerp(wh.y, 975, carry)};
  wh = {x: lerp(wh.x, 560, away), y: lerp(wh.y, 920, away)};
  const crustCarried = t >= B.crustUp + 0.3 && t < B.crustIn;
  const crustInBox = t >= B.crustIn;
  const crustP: Pt = crustInBox ? {x: BOX0.x, y: 1000} : crustCarried ? {x: wh.x - 10, y: wh.y + 30} : {x: PLATE.x - 8, y: PLATE.y - 22};
  const lid = 1 - smooth(t, B.lid, B.lid + 0.3);
  const slideK = smooth(t, B.boxSlide, B.boxSlide + 0.35);
  const take = smooth(t, B.takeBox, B.takeBox + 0.5);
  const boxX = lerp(lerp(BOX0.x, 548, slideK), 300, take);
  const boxP: Pt = {x: boxX, y: 1045 - 30 * take};
  const reach = smooth(t, B.reachBox, B.reachBox + 0.35);
  const herOff = smooth(t, B.letGo, B.letGo + 0.4);
  const hisH: Pt = {x: lerp(-80, boxP.x - 95, reach), y: lerp(1140, 1035, reach)};
  if (t >= B.takeBox) { hisH.x = boxP.x + 70; hisH.y = boxP.y - 26; }
  const herH: Pt = {x: lerp(1160, boxP.x + 100, reach), y: lerp(1140, 1035, reach)};
  if (herOff > 0) { herH.x = lerp(boxP.x + 100, 800, herOff); herH.y = lerp(1035, 960, herOff); }
  const hisLook: [number, number] = t < B.letGo ? [0.7, 0.9] : [0.9, 0.2];
  const her = mkPose({look: t < B.letGo ? [-0.7, 0.9] : [-0.9, 0.15], mouth: t < B.letGo ? 'smirk' : 'smile', happy: t >= B.letGo + 0.15 && t < B.takeBox + 0.7, brow: 0.2 + 0.4 * pulse(t, B.reachBox, B.reachBox + 0.6), blink: blinkAt(t, 1.9), flush: 0.2, tilt: t >= B.letGo ? -4 : 0});
  const him = mkPose({look: hisLook, mouth: t < B.reachBox ? 'soft' : t < B.takeBox + 0.3 ? 'o' : 'smile', brow: 0.5 * pulse(t, B.reachBox, B.takeBox), flush: 0.5, blink: blinkAt(t, 0.4), tilt: t >= B.takeBox ? 3 : 0});
  const hasWait = t < B.lid + 0.8;
  return <g transform={`translate(540 960) scale(${z}) translate(-540 -960)`}>
    <TwoShotBG t={t} him={him} her={her} waitress={{up: wu * (1 - smooth(t, B.lid + 0.45, B.lid + 0.8)), hand: null}} />
    {t < B.crustIn + 0.01 || true ? <Plate x={PLATE.x} y={PLATE.y} s={0.72} slice={false} /> : null}
    {t < B.lid + 0.25 && <Crust x={crustP.x} y={crustP.y} s={0.62} rot={crustCarried ? -10 : 0} />}
    {take <= 0.02 && <ToGoBox x={boxP.x} y={boxP.y} s={0.85} lid={lid} />}
    {hasWait && wu > 0.01 && <g opacity={wu}><WArm S={{x: 470, y: 960}} H={wh} /></g>}
    <Arm who="him" sx={-80} sy={1190} hx={hisH.x} hy={hisH.y} w={80} />
    <Arm who="her" sx={1160} sy={1190} hx={herH.x} hy={herH.y} w={80} />
    {take > 0.02 && <ToGoBox x={boxP.x} y={boxP.y} s={0.85} lid={0} />}
    {t >= B.takeBox + 0.45 && t < B.takeBox + 0.9 && <Spark x={boxP.x + 20} y={boxP.y - 110} k={wp(t, B.takeBox + 0.45, B.takeBox + 0.9)} />}
  </g>;
};

const WArm: React.FC<{S: Pt; H: Pt}> = ({S, H}) => {
  const c = {x: (S.x + H.x) / 2 - 10, y: Math.max(S.y, H.y) + 50};
  const d = `M ${S.x} ${S.y} Q ${c.x} ${c.y} ${H.x} ${H.y}`;
  return <g>
    <path d={d} fill="none" stroke={C.ink} strokeWidth={66} strokeLinecap="round" />
    <path d={d} fill="none" stroke={C.mintUni} strokeWidth={52} strokeLinecap="round" />
    <circle cx={H.x} cy={H.y} r={34} fill="#E3B38F" stroke={C.ink} strokeWidth={7} />
    <path d={`M ${H.x + 8} ${H.y - 10} q 10 6 0 14 M ${H.x + 8} ${H.y + 6} q 10 6 0 14`} fill="none" stroke={C.ink} strokeWidth={4} opacity={0.5} strokeLinecap="round" />
  </g>;
};

// ------------------------------------------------------------------------------------------ the sidewalk
const Breath: React.FC<{x: number; y: number; t: number; seed: number; dir: number}> = ({x, y, t, seed, dir}) => {
  const per = 1.7, ph = ((t + seed) % per) / per;
  if (ph > 0.65) return null;
  const k = ph / 0.65;
  return <g opacity={Math.min(1, (1 - k) * 1.1)} filter="url(#blurSh)">
    {[0, 1, 2].map((i) => <circle key={i} cx={x + dir * (24 + 70 * k + i * 26 * k)} cy={y - 10 * k - i * 8 * k + (i - 1) * 6} r={22 + 44 * k - i * 3} fill="#EAF6FF" />)}
  </g>;
};

const SideScene: React.FC<{t: number; vote?: boolean}> = ({t, vote = false}) => {
  const PY = vote ? 800 : 1130, S = vote ? 0.62 : 0.8, WY = vote ? 905 : 1190, HX = 270, RX = 810;
  const lt = t - B.side;
  // neon flip
  const fp = wp(t, B.neonFlip, B.neonFlip + 0.35);
  const closed = vote || fp >= 0.5;
  const sy = vote ? 1 : fp <= 0 ? 1 : Math.max(0.04, Math.abs(1 - 2 * fp));
  const zap = !vote && t >= B.neonFlip - 0.1 && t < B.neonFlip + 0.55 ? (Math.sin(t * 60) > 0.2 ? 1 : 0.35) : 1;
  const word = closed ? 'CLOSED' : 'OPEN';
  const glow = '#FF3B4E';
  // car + lights
  const lights = vote ? 0 : smooth(t, B.lights, B.lights + 0.5) * (1 - smooth(t, B.slide + 0.6, B.n3));
  const carX = lerp(820, 70, smooth(t, B.lights, B.lights + 0.55));
  const hon = (t >= B.honk1 && t < B.honk1 + 0.22) || (t >= B.honk2 && t < B.honk2 + 0.22);
  const bump = hon ? -9 : 0;
  const sweep = wp(t, B.lights, B.slide);
  const ang = lerp(222, 262, smooth(sweep, 0, 1));
  const beam = (ax: number, ay: number, w: number) => {
    const a0 = ((ang - w) * Math.PI) / 180, a1 = ((ang + w) * Math.PI) / 180, L = 1900;
    return <polygon points={`${ax},${ay} ${ax + Math.cos(a0) * L},${ay + Math.sin(a0) * L} ${ax + Math.cos(a1) * L},${ay + Math.sin(a1) * L}`} fill="#FFF6D8" opacity={0.2 * lights} filter="url(#blurSoft)" />;
  };
  // poses
  const look = (a: number, b2: number): [number, number] => [a, b2];
  const gaze = t < B.lights ? 0 : t < B.slide - 0.3 ? 1 : 2;
  const him = vote ? mkPose({look: [0.9, 0.1], mouth: 'soft', brow: 0.2, flush: 0.55, blink: blinkAt(t, 0.4), tilt: Math.sin(t * 40) * 0.6 + 3})
    : mkPose({look: gaze === 0 ? look(0.7, 0.2) : gaze === 1 ? look(0.95, 0.5) : look(kf([[B.slide - 0.3, 0.95, 0.5], [B.slide + 0.5, 0.35, 0.95], [B.slide + 1.0, 0.9, 0.1]], t)[0], kf([[B.slide - 0.3, 0.95, 0.5], [B.slide + 0.5, 0.35, 0.95], [B.slide + 1.0, 0.9, 0.1]], t)[1]),
      mouth: t >= B.honk1 && t < B.honk1 + 0.5 ? 'o' : t >= B.slide + 0.9 ? 'smile' : 'soft', brow: 0.2 + 0.5 * pulse(t, B.honk1, B.honk1 + 0.5), flush: 0.55, blink: blinkAt(t, 0.4), tilt: Math.sin(t * 40) * 0.7, bob: 0});
  const her = vote ? mkPose({look: [-0.9, 0.1], mouth: 'smirk', brow: 0.1, blink: blinkAt(t, 1.9), tilt: -3, flush: 0.3})
    : mkPose({look: gaze === 0 ? look(-0.8, 0.1) : gaze === 1 ? look(0.9, 0.35) : look(-0.9, 0.3), mouth: gaze === 0 ? 'smile' : t >= B.honk1 && t < B.honk1 + 0.6 ? 'o' : gaze === 2 ? 'smile' : 'soft', brow: 0.15, blink: blinkAt(t, 1.9), tilt: Math.sin(t * 40 + 1) * 0.7, flush: 0.3});
  const mouthY = PY - 92 * S;
  // napkin slide
  const nk = smooth(t, B.slide, B.slide + 0.8), nOut = smooth(t, B.slide + 0.9, B.n3);
  const napX = lerp(820, 425, nk), napY = WY - 26;
  const herHand: Pt = {x: napX + 150 + lerp(0, 60, nOut), y: WY - 18};
  const boxHand: Pt = {x: 335, y: PY + 20};
  return <g>
    {/* facade + lit window */}
    <rect x={-100} y={-100} width={1300} height={WY + 130} fill="#12403F" />
    {Array.from({length: 12}, (_, i) => <path key={i} d={`M -100 ${180 + i * 95} L 1200 ${180 + i * 95}`} stroke={C.ink} strokeWidth={4} opacity={0.18} />)}
    <rect x={-100} y={-100} width={1300} height={WY + 130} fill={C.navy} opacity={0.32} />
    <ellipse cx={540} cy={880} rx={640} ry={420} fill="url(#haloWarm)" opacity={0.35} />
    <rect x={60} y={520} width={960} height={380} rx={26} fill={C.chrome} stroke={C.ink} strokeWidth={9} />
    <rect x={88} y={548} width={904} height={324} rx={14} fill="#F6B25A" stroke={C.ink} strokeWidth={7} />
    <rect x={88} y={548} width={904} height={324} rx={14} fill="url(#haloWarm)" opacity={0.7} />
    <rect x={88} y={760} width={904} height={112} fill="#5D3A2A" opacity={0.55} />
    {[170, 330, 750, 910].map((x, i) => <g key={i}><ellipse cx={x} cy={800} rx={44} ry={14} fill="#8B1830" stroke={C.ink} strokeWidth={5} /><rect x={x - 6} y={808} width={12} height={60} fill="#B8C6CB" stroke={C.ink} strokeWidth={4} /></g>)}
    <Gloss x={88} y={548} w={904} h={324} a={0.16} id="sidewin" r={14} />
    {/* neon */}
    <g transform={`translate(540 705) scale(1 ${sy})`} opacity={zap}>
      <text x={0} y={0} textAnchor="middle" fontFamily={ANTON} fontSize={160} fill={glow} opacity={0.7} filter="url(#blurGlow)" stroke={glow} strokeWidth={12} letterSpacing={6}>{word}</text>
      <text x={0} y={0} textAnchor="middle" fontFamily={ANTON} fontSize={160} fill="none" stroke={glow} strokeWidth={10} strokeLinejoin="round" letterSpacing={6}>{word}</text>
      <text x={0} y={0} textAnchor="middle" fontFamily={ANTON} fontSize={160} fill="none" stroke="#FFD9D6" strokeWidth={3.5} strokeLinejoin="round" letterSpacing={6}>{word}</text>
    </g>
    <ClockSign x={540} y={470} text={spec.cards.clock2} />
    {/* the two of them */}
    <Person who="him" x={HX} y={PY} s={S} pose={him} />
    <Person who="her" x={RX} y={PY} s={S} pose={her} />
    <g transform={`translate(${RX} ${PY + her.bob}) scale(${S}) rotate(${her.tilt} 0 -40)`}><g transform="translate(0 -318) scale(1.95)"><Beanie x={0} y={0} /></g></g>
    <Breath x={HX} y={mouthY} t={t} seed={0} dir={-1} /><Breath x={RX} y={mouthY} t={t} seed={0.85} dir={1} />
    {/* low brick wall */}
    <rect x={-100} y={WY} width={1300} height={34} fill="url(#chromeG)" stroke={C.ink} strokeWidth={8} />
    <rect x={-100} y={WY + 34} width={1300} height={vote ? 700 : 190} fill="#7A2E2A" stroke={C.ink} strokeWidth={8} />
    {Array.from({length: vote ? 8 : 3}, (_, r) => Array.from({length: 9}, (_, i) => <rect key={`${r}-${i}`} x={-60 + i * 150 + (r % 2) * 75} y={WY + 46 + r * 64} width={140} height={52} rx={5} fill="#9A3E36" stroke={C.ink} strokeWidth={4} opacity={0.8} />))}
    {!vote && <rect x={-100} y={WY + 224} width={1300} height={900} fill="#0E242C" stroke={C.ink} strokeWidth={8} />}
    {/* arms, box, napkin */}
    {!vote && <g>
      <Arm who="him" sx={-60} sy={1260} hx={boxHand.x} hy={boxHand.y + 20} w={92} />
      <ToGoBox x={boxHand.x + 18} y={boxHand.y - 60} s={0.5} lid={0} rot={-4} />
      {t >= B.slide - 0.1 && <g transform={`translate(${napX} ${napY}) rotate(-3)`}>
        <rect x={-92} y={-52} width={184} height={104} fill={C.napkin} stroke={C.ink} strokeWidth={6} transform="translate(6 8)" opacity={0.25} />
        <path d="M -92 -52 L 92 -50 L 90 52 L -90 50 Z" fill={C.napkin} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
        <text x={0} y={14} textAnchor="middle" fontFamily={HAND} fontWeight={700} fontSize={46} fill={C.cran}>your turn.</text>
      </g>}
      {t >= B.slide - 0.3 && <Arm who="her" sx={1180} sy={1230} hx={herHand.x} hy={herHand.y} w={92} />}
    </g>}
    {/* headlights + car (near plane, below the wall) */}
    {!vote && lights > 0.01 && <g>
      {beam(700 + carX, 1330, 13)}{beam(1070 + carX, 1320, 13)}
      <g transform={`translate(${carX} ${bump})`}>
        <path d="M 600 1262 L 690 1150 Q 700 1140 720 1140 L 1090 1140 Q 1110 1140 1120 1152 L 1190 1262 Z" fill="#1B3440" stroke={C.ink} strokeWidth={9} strokeLinejoin="round" />
        <path d="M 700 1250 L 760 1165 L 810 1165 L 750 1250 Z M 860 1250 L 900 1165 L 930 1165 L 900 1250 Z" fill="#fff" opacity={0.22} />
        <path d="M 520 1500 L 520 1380 Q 540 1290 660 1262 L 1010 1252 Q 1150 1262 1190 1340 L 1190 1500 Z" fill={C.gold} stroke={C.ink} strokeWidth={9} strokeLinejoin="round" />
        <path d="M 560 1296 Q 640 1272 720 1270" stroke="#fff" strokeWidth={8} opacity={0.5} strokeLinecap="round" fill="none" />
        <path d="M 600 1262 L 560 1226 Q 536 1218 520 1236 L 532 1274 Z" fill={C.gold} stroke={C.ink} strokeWidth={8} strokeLinejoin="round" />
        <circle cx={620} cy={1500} r={92} fill="#14181A" stroke={C.ink} strokeWidth={9} /><circle cx={620} cy={1500} r={42} fill="url(#chromeG)" stroke={C.ink} strokeWidth={7} />
        <rect x={760} y={1380} width={250} height={70} rx={14} fill="#26302E" stroke={C.ink} strokeWidth={7} />
        {[700, 1070].map((x, i) => <g key={i}><circle cx={x} cy={1330} r={110} fill="url(#haloWhite)" opacity={lights} /><circle cx={x} cy={1330} r={46} fill="#FFFBE6" stroke={C.ink} strokeWidth={8} /><circle cx={x} cy={1330} r={26} fill="#fff" /></g>)}
        {hon && <g fill="none" stroke={C.ink} strokeWidth={9} strokeLinecap="round">{[70, 112, 154].map((r, i) => <path key={i} d={`M ${1020 - r * 0.9} ${1262 - r * 0.2} Q 1020 ${1262 - r * 1.15} ${1020 + r * 0.9} ${1262 - r * 0.2}`} opacity={1 - i * 0.25} />)}</g>}
      </g>
    </g>}
    <rect x={-100} y={-100} width={1300} height={2200} fill="#FFE9A8" opacity={0.12 * lights} />
  </g>;
};

// ------------------------------------------------------------------------------------------ the vote board
const VoteScene: React.FC<{t: number}> = ({t}) => {
  const CH = (id: string) => (spec.choices as unknown as Record<string, {l1: string; l2: string}>)[id];
  return <g>
    <SideScene t={t} vote />
    {[['A', 895, -1.2, 'va', B.cardA], ['B', 1048, 1.2, 'vb', B.cardB]].map(([L, y, rot, id, at], i) => {
      const ph = Math.max(0, t - VOTE_AT - 0.3) / 1.4 % 2;
      const hl = t < VOTE_AT + 0.3 ? 0 : i === 0 ? (ph < 1 ? Math.sin(ph * Math.PI) : 0) : (ph >= 1 ? Math.sin((ph - 1) * Math.PI) : 0);
      const yy = y as number; const SC = 0.72;
      return <g key={id as string} transform={`translate(540 ${yy}) scale(${SC * (1 + 0.045 * hl)}) translate(-540 ${-yy})`}>
        <rect x={50} y={yy - 132} width={980} height={264} rx={18} fill={C.pumpkin} opacity={0.5 * hl} filter="url(#blurSh)" />
        <VoteCard letter={L as string} l1={CH(L as string).l1} l2={CH(L as string).l2} y={yy} age={t - (at as number)} rot={rot as number} id={id as string} />
      </g>;
    })}
  </g>;
};

// ------------------------------------------------------------------------------------------ end card (soft "link in bio" under the main text)
const EndCard5: React.FC<{a: number; t: number}> = ({a, t}) => {
  const pp = (d: number) => { const k = clamp((a - d) / 0.3); return k <= 0 ? 0 : 1 + Math.sin(k * Math.PI * 1.5) * Math.exp(-k * 4.2) * 0.4 - Math.exp(-k * 9) * (1 - k); };
  const flick = 0.85 + 0.15 * Math.sin(t * 29) * Math.sin(t * 5.1);
  const pillT = spec.cards.end_pill;
  const pfs = Math.min(70, Math.floor((880 / textW(pillT, `700 70px ${COUR}`)) * 70));
  const pw = textW(pillT, `700 ${pfs}px ${COUR}`) + 100;
  const l1 = 'tired of swiping?', l2 = 'noswipe.app · link in bio';
  const lw = Math.max(textW(l1, `700 38px ${COUR}`), textW(l2, `700 38px ${COUR}`)) + 80;
  return <g>
    <Far t={t} />
    <rect x={-200} y={1000} width={1480} height={1000} fill={C.tealLite} />
    <Counter />
    <g transform={`translate(540 600) scale(${pp(0)})`}><text x={0} y={0} textAnchor="middle" fontFamily={COUR} fontWeight={700} fontSize={52} fill={C.custard} stroke={C.ink} strokeWidth={9} paintOrder="stroke" letterSpacing={1}>{spec.cards.end_kicker}</text></g>
    <g transform={`translate(540 815) scale(${pp(0)})`} opacity={flick}>
      <text x={0} y={0} textAnchor="middle" fontFamily={ANTON} fontSize={190} fill={C.pumpkin} stroke={C.pumpkin} strokeWidth={30} opacity={0.6} filter="url(#blurGlow)" letterSpacing={4}>pie for two</text>
      <text x={0} y={0} textAnchor="middle" fontFamily={ANTON} fontSize={190} fill="#1A0D08" stroke={C.pumpkin} strokeWidth={11} strokeLinejoin="round" letterSpacing={4}>pie for two</text>
      <text x={0} y={0} textAnchor="middle" fontFamily={ANTON} fontSize={190} fill="none" stroke="#FFE2B8" strokeWidth={3} strokeLinejoin="round" letterSpacing={4}>pie for two</text>
    </g>
    <g transform={`translate(540 935) scale(${0.85 * pp(0.15)})`}>
      <ellipse cx={0} cy={26} rx={300} ry={64} fill={C.ink} opacity={0.3} filter="url(#blurSh)" />
      <ellipse cx={0} cy={0} rx={290} ry={76} fill={C.napkin} stroke={C.ink} strokeWidth={8} />
      <path d="M -230 -4 Q -230 -76 0 -80 Q 230 -76 230 -4 Q 230 34 0 38 Q -230 34 -230 -4 Z" fill={C.crust} stroke={C.ink} strokeWidth={8} />
      <ellipse cx={0} cy={-22} rx={196} ry={44} fill={C.pie} stroke={C.ink} strokeWidth={6} />
      <path d="M 0 -22 L 150 18 L 196 -22 Z" fill="#E7EEF0" stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
      <circle cx={-60} cy={-26} r={22} fill={C.cream} stroke={C.ink} strokeWidth={5} />
      <Fork x={-150} y={20} rot={-62} s={0.6} /><Fork x={150} y={26} rot={62} s={0.6} />
    </g>
    <g transform={`translate(540 1068) scale(${pp(0.4)})`}>
      <rect x={-pw / 2 + 9} y={-60 + 12} width={pw} height={116} rx={14} fill={C.ink} opacity={0.4} />
      <rect x={-pw / 2} y={-60} width={pw} height={116} rx={14} fill={C.custard} stroke={C.ink} strokeWidth={6} />
      <text x={0} y={18} textAnchor="middle" fontFamily={COUR} fontWeight={700} fontSize={pfs} fill={C.ink}>{pillT}</text>
    </g>
    <g transform={`translate(540 1180) scale(${pp(0.55)})`}>
      <rect x={-lw / 2 + 6} y={-48 + 8} width={lw} height={100} rx={12} fill={C.ink} opacity={0.35} />
      <rect x={-lw / 2} y={-48} width={lw} height={100} rx={12} fill={C.custard} stroke={C.ink} strokeWidth={5} opacity={0.96} />
      <text x={0} y={-6} textAnchor="middle" fontFamily={COUR} fontWeight={700} fontSize={38} fill={C.ink} opacity={0.82}>{l1}</text>
      <text x={0} y={34} textAnchor="middle" fontFamily={COUR} fontWeight={700} fontSize={38} fill={C.cran}>{l2}</text>
    </g>
  </g>;
};

const renderShot = (t: number, hook: Hook, id: ShotId = shotAt(t)): React.ReactNode => {
  if (id === 'N1' || id === 'N2' || id === 'N3') return <NapkinInsert t={t} kind={id} />;
  if (id === 'PG') return <PhoneGag t={t} />;
  if (id === 'WL') return <WalletShot t={t} />;
  if (id === 'MO') return <MoneyShot t={t} />;
  if (id === 'BX') return <BoxShot t={t} />;
  if (id === 'SD') return <SideScene t={t} />;
  if (id === 'vote') return <VoteScene t={t} />;
  if (id === 'end') {
    const e = t - B.endcard;
    return <g transform={`translate(540 960) scale(${1 + 0.03 * clamp(e / 3)}) translate(-540 -960)`}><EndCard5 a={e} t={t} /></g>;
  }
  return <Diner t={t} hook={hook} />;
};

const Scene: React.FC<{hook: Hook}> = ({hook}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const wipe1 = t >= REWIND_AT && t < REWIND_AT + WIPE_DUR;
  const wipe2 = t >= VOTE_WIPE && t < VOTE_AT;
  const inWipe = wipe1 || wipe2;
  const k = wipe1 ? (t - REWIND_AT) / WIPE_DUR : wipe2 ? (t - VOTE_WIPE) / WIPE_DUR : 0;
  const mirror = 'translate(1080 0) scale(-1 1)';
  return <>
    <MotionBlurWhen fast={inWipe} samples={5} shutter={220}>
      <AbsoluteFill>
        <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, background: C.teal}}>
          <Defs />
          {inWipe ? <>
            {renderShot(wipe1 ? REWIND_AT - 0.01 : VOTE_WIPE - 0.01, hook, wipe1 ? 'D' : 'N3')}
            <defs>{wipe1 ? <clipPath id="sliceNew"><WipeClipPoly k={k} tf={mirror} /></clipPath> : <WipeClip k={k} />}</defs>
            <g clipPath="url(#sliceNew)">{wipe1 ? <Diner t={t} hook={hook} /> : <VoteScene t={t} />}</g>
            {wipe1 ? <g transform={mirror}><WipeRim k={k} /></g> : <WipeRim k={k} />}
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
          return <Strip key={i} text={s.text} y={s.y} age={t - s.from + (isHook ? 1 : 0.06)} out={isHook ? smooth(t, 3.0, 3.2) : smooth(t, s.to - 0.12, s.to)} size={(s as {size?: number}).size ?? (comment ? 60 : 56)} hot={comment} maxW={(s as {maxW?: number}).maxW ?? (comment ? 760 : 1000)} />;
        })}
      </svg>
    </AbsoluteFill>
  </>;
};

export const Pie5: React.FC<{hook?: Hook}> = ({hook = 'a'}) => (
  <AbsoluteFill style={{background: C.teal}}>
    <Audio src={staticFile('audio/pie-ep5.wav')} volume={0.9} />
    <Sequence from={Math.round(spec.hookSlap[hook] * PIE5_FPS)}><Audio src={staticFile('audio/pie-ep5-slap.wav')} volume={0.9} /></Sequence>
    <Scene hook={hook} />
  </AbsoluteFill>
);
