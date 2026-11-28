import React from 'react';
import {clamp, lerp, smooth} from '../../lib/motion';
import {OPEN} from '../../lib/fonts';
import {textW, mixc} from '../whites/world';

export {camAt, planeT, textW} from '../whites/world';
export type {Cam, CamKey} from '../whites/world';

// REASON FOR RETURN (season 13): a bright department-store returns line. Flat vector, thick navy outlines, hard offset shadows on
// cards, soft ink-tinted shadows between planes. Far plane: cream wall, shelves of boxes, RETURNS sign, checker floor. Mid plane:
// figures behind the line rail + clipboard. Near plane: blurred hanger rack. Strips are white price-gun stickers with a red border.
// Slips: Courier Prime 700 print, Caveat 700 pen (his navy ALL CAPS, hers teal lowercase). Transition: the scanner beam.

export const C = {
  ink: '#14213D', teal: '#0E8A8F', tealDeep: '#0A6468', tagRed: '#E8333C', slip: '#FFE45C', slipDeep: '#F2C92E', cream: '#FFF8E7', mint: '#8FE3C0', mintDeep: '#5CC49B',
  lav: '#B9A7FF', lavDeep: '#8E79E6', parka: '#2F7A4A', parkaDeep: '#1F5A34', char: '#3A4152', charLite: '#566074', coral: '#FF7A6B', skinHim: '#F3BC94', skinHer: '#B97B56',
  skinClerk: '#D9A27C', hairHim: '#5B3A22', hairHer: '#2A1812', floorA: '#F4EEFF', floorB: '#DCD2FF', glow: '#E7DEFF', flush: '#F2655A', wall: '#FFF3D6', steel: '#C9D3DC', white: '#FFFFFF',
};
export const COUR = OPEN.typewriter;
export const PEN = OPEN.handwriting;
export const ANTON = OPEN.poster;
export const SANS = OPEN.humanist;
export const SW = 8;

export const Defs: React.FC = () => <defs>
  <filter id="blurNear" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="12" /></filter>
  <filter id="blurSoft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="14" /></filter>
  <filter id="blurSh" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="10" /></filter>
  <filter id="blurGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="12" /></filter>
  <radialGradient id="haloPhone"><stop offset="0" stopColor="#FFFFFF" stopOpacity={0.95} /><stop offset="0.35" stopColor="#E3D9FF" stopOpacity={0.6} /><stop offset="1" stopColor="#B9A7FF" stopOpacity={0} /></radialGradient>
  <radialGradient id="haloSlip"><stop offset="0" stopColor="#FFFBD0" stopOpacity={0.95} /><stop offset="0.5" stopColor="#FFE45C" stopOpacity={0.5} /><stop offset="1" stopColor="#FFE45C" stopOpacity={0} /></radialGradient>
  <linearGradient id="scr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFFFFF" /><stop offset="1" stopColor="#CFC0FF" /></linearGradient>
  <linearGradient id="wallg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFF9E8" /><stop offset="1" stopColor="#FFEFC9" /></linearGradient>
  <linearGradient id="floorFade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#14213D" stopOpacity={0.25} /><stop offset="1" stopColor="#14213D" stopOpacity={0} /></linearGradient>
  <linearGradient id="beamG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#E8333C" stopOpacity={0} /><stop offset="0.8" stopColor="#E8333C" stopOpacity={0.55} /><stop offset="1" stopColor="#FF8A8F" stopOpacity={0.9} /></linearGradient>
</defs>;

// ---------------------------------------------------------------------------------------- store (far plane)
const BOXES: [number, number, number, number, string][] = [
  [20, 0, 120, 100, C.mint], [150, 20, 90, 80, C.lav], [250, 0, 130, 100, C.slip], [390, 10, 100, 90, C.coral], [500, 0, 120, 100, C.mint],
  [630, 25, 90, 75, C.lav], [730, 0, 130, 100, C.slip], [870, 12, 100, 88, C.coral], [980, 0, 110, 100, C.mint],
];
const Shelf: React.FC<{y: number; k?: number}> = ({y, k = 0}) => <g transform={`translate(0 ${y})`}>
  {BOXES.map(([x, dy, w, h, f], i) => <g key={i} transform={`translate(${(x + k * 70) % 1180 - 50} ${-h + 100 - dy * 0 })`}>
    <rect x={0} y={0} width={w} height={h} rx={6} fill={f} stroke={C.ink} strokeWidth={5} />
    <rect x={0} y={h * 0.34} width={w} height={h * 0.14} fill={C.white} opacity={0.5} />
  </g>)}
  <rect x={-60} y={100} width={1260} height={20} fill={C.teal} stroke={C.ink} strokeWidth={6} />
</g>;

export const Far: React.FC<{t: number; pan?: number; dim?: number}> = ({t, pan = 0, dim = 0}) => <g>
  <rect x={-300} y={-100} width={1680} height={1500} fill="url(#wallg)" />
  {/* ceiling band + lights */}
  <rect x={-300} y={-100} width={1680} height={360} fill="#EAF6F5" stroke={C.ink} strokeWidth={0} />
  {[120, 540, 960].map((x, i) => <g key={i} transform={`translate(${x + pan * 0.3} 190)`}><rect x={-150} y={-22} width={300} height={44} rx={10} fill="#fff" stroke={C.ink} strokeWidth={6} /><rect x={-150} y={22} width={300} height={34} fill="#FFFFFF" opacity={0.25} filter="url(#blurSh)" /></g>)}
  <path d="M -300 262 L 1380 262" stroke={C.ink} strokeWidth={8} />
  {/* shelves of returned boxes */}
  <g transform={`translate(${pan * 0.6} 0)`}>
    <Shelf y={760} k={0.2} />
    <Shelf y={1000} k={0.6} />
  </g>
  {/* wainscot + floor */}
  <rect x={-300} y={1010} width={1680} height={380} fill={C.teal} stroke={C.ink} strokeWidth={8} />
  <rect x={-300} y={1010} width={1680} height={26} fill={C.tealDeep} />
  <g transform={`translate(${pan} 0)`}>
    {Array.from({length: 14}, (_, i) => <rect key={i} x={-260 + i * 120} y={1100} width={20} height={300} fill={C.tealDeep} opacity={0.55} />)}
  </g>
  <rect x={-300} y={1380} width={1680} height={700} fill={C.floorA} />
  {Array.from({length: 9}, (_, r) => Array.from({length: 18}, (_, c) => ((r + c) % 2 ? <rect key={`${r}-${c}`} x={-300 + c * 100 - r * 0 + (pan * (1 + r * 0.3)) % 200} y={1380 + r * 90} width={100} height={90} fill={C.floorB} opacity={0.7} /> : null)))}
  <rect x={-300} y={1380} width={1680} height={8} fill={C.ink} />
  {dim > 0 && <rect x={-300} y={-100} width={1680} height={2200} fill={C.cream} opacity={dim} />}
</g>;

export const ReturnsSign: React.FC<{x?: number; y?: number; s?: number}> = ({x = 540, y = 540, s = 1}) => <g transform={`translate(${x} ${y}) scale(${s})`}>
  <path d="M -230 -50 L -230 -300 M 230 -50 L 230 -300" stroke={C.ink} strokeWidth={8} />
  <rect x={-326} y={-44} width={660} height={108} rx={16} fill={C.ink} opacity={0.3} />
  <rect x={-330} y={-50} width={660} height={108} rx={16} fill={C.teal} stroke={C.ink} strokeWidth={8} />
  <rect x={-316} y={-38} width={632} height={14} rx={7} fill="#fff" opacity={0.28} />
  <text x={0} y={30} textAnchor="middle" fontFamily={SANS} fontWeight={900} fontSize={84} fill="#fff" stroke={C.ink} strokeWidth={9} paintOrder="stroke" letterSpacing={6}>RETURNS</text>
</g>;

/** the line rail: steel bar on two navy posts, with a red belt. */
export const Rail: React.FC<{y?: number; belt?: boolean}> = ({y = 1290, belt = true}) => <g>
  <rect x={-40} y={y - 6} width={1160} height={42} rx={20} fill={C.ink} opacity={0.28} filter="url(#blurSh)" transform="translate(0 16)" />
  <rect x={-40} y={y - 10} width={1160} height={46} rx={22} fill={C.steel} stroke={C.ink} strokeWidth={8} />
  <rect x={-20} y={y - 2} width={1120} height={9} rx={4} fill="#fff" opacity={0.7} />
  {[60, 1020].map((x) => <g key={x}><rect x={x - 22} y={y + 30} width={44} height={330} fill={C.ink} /><ellipse cx={x} cy={y + 360} rx={80} ry={22} fill={C.ink} /><circle cx={x} cy={y - 22} r={30} fill={C.tagRed} stroke={C.ink} strokeWidth={7} /></g>)}
  {belt && <path d={`M 60 ${y + 80} Q 540 ${y + 150} 1020 ${y + 80}`} stroke={C.ink} strokeWidth={46} fill="none" strokeLinecap="round" />}
  {belt && <path d={`M 60 ${y + 80} Q 540 ${y + 150} 1020 ${y + 80}`} stroke={C.tagRed} strokeWidth={32} fill="none" strokeLinecap="round" />}
</g>;

/** near plane: blurred hanger rack silhouettes */
export const NearRack: React.FC<{x: number; y?: number}> = ({x, y = 1500}) => <g transform={`translate(${x} ${y})`} filter="url(#blurNear)" opacity={0.55}>
  <rect x={-14} y={-700} width={28} height={820} fill={C.ink} />
  {[-150, -60, 40, 130].map((dx, i) => <path key={i} d={`M ${dx} -560 l 40 70 l 40 -70 l 0 330 l -80 0 Z`} fill={[C.coral, C.lav, C.mint, C.slip][i]} stroke={C.ink} strokeWidth={6} />)}
</g>;

// ---------------------------------------------------------------------------------------- people
export type Mouth = 'flat' | 'smirk' | 'o' | 'laugh' | 'smile' | 'gulp' | 'grit' | 'soft';
export type Pose = {look: [number, number]; brow: number; worry: number; mouth: Mouth; happy: boolean; sweat: number; gulp: number; tilt: number; bob: number; sq: number; blink: number; flush: number; cover?: number};

const MouthShape: React.FC<{m: Mouth}> = ({m}) => {
  const st = {fill: 'none', stroke: C.ink, strokeWidth: 7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
  switch (m) {
    case 'flat': return <path d="M -24 0 L 24 0" {...st} />;
    case 'smirk': return <path d="M -26 6 Q 6 10 32 -12" {...st} />;
    case 'o': return <ellipse cx={0} cy={6} rx={15} ry={20} fill="#5A1E14" stroke={C.ink} strokeWidth={6} />;
    case 'smile': return <path d="M -36 -4 Q 0 34 36 -4" {...st} />;
    case 'soft': return <path d="M -22 2 Q 0 14 22 2" {...st} />;
    case 'gulp': return <path d="M -26 6 Q -13 -8 0 6 Q 13 20 26 6" {...st} />;
    case 'grit': return <g><rect x={-32} y={-10} width={64} height={26} rx={8} fill="#fff" stroke={C.ink} strokeWidth={6} /><path d="M -10 -10 L -10 16 M 10 -10 L 10 16" stroke={C.ink} strokeWidth={3} /></g>;
    case 'laugh': return <g><path d="M -44 -8 Q 0 -10 44 -8 Q 38 46 0 46 Q -38 46 -44 -8 Z" fill="#5A1E14" stroke={C.ink} strokeWidth={6} strokeLinejoin="round" /><ellipse cx={0} cy={34} rx={20} ry={11} fill="#F27B7B" /></g>;
  }
};

export const Person: React.FC<{who: 'him' | 'her' | 'clerk'; x: number; y: number; s?: number; pose: Pose; part?: 'all' | 'body' | 'head'}> = ({who, x, y, s = 1, pose, part = 'all'}) => {
  const showBody = part !== 'head', showHead = part !== 'body';
  const him = who === 'him', clerk = who === 'clerk';
  const skin = him ? C.skinHim : clerk ? C.skinClerk : C.skinHer;
  const earC = him ? mixc(skin, C.flush, pose.flush) : skin;
  const [lx, ly] = pose.look;
  return <g transform={`translate(${x} ${y + pose.bob}) scale(${s / Math.sqrt(pose.sq)} ${s * pose.sq})`}>
    {/* torso */}
    {showBody && him && <g>
      <path d="M -240 270 L -240 120 Q -236 -10 -100 -34 L 100 -34 Q 236 -10 240 120 L 240 270 Z" fill={C.parka} stroke={C.ink} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M 0 -20 L 0 270" stroke={C.parkaDeep} strokeWidth={8} />
      {[-150, -80, 80, 150].map((xx, i) => <path key={i} d={`M ${xx - 40} 60 Q ${xx} 76 ${xx + 40} 60`} fill="none" stroke={C.parkaDeep} strokeWidth={6} strokeLinecap="round" />)}
      <ellipse cx={0} cy={-26} rx={130} ry={46} fill={C.parkaDeep} stroke={C.ink} strokeWidth={SW} />
      <path d="M -116 -30 Q 0 20 116 -30" fill="none" stroke={C.cream} strokeWidth={14} strokeLinecap="round" opacity={0.9} />
    </g>}
    {showBody && !him && !clerk && <g>
      <path d="M -230 270 L -230 120 Q -226 -8 -96 -32 L 96 -32 Q 226 -8 230 120 L 230 270 Z" fill={C.char} stroke={C.ink} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M -10 -20 L -90 60 L -20 130 M 10 -20 L 90 60 L 20 130" fill={C.charLite} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
      <ellipse cx={0} cy={-28} rx={112} ry={42} fill={C.lav} stroke={C.ink} strokeWidth={SW} />
      <path d="M -80 -30 Q 0 -6 80 -30" fill="none" stroke={C.lavDeep} strokeWidth={6} />
      <path d="M -50 -4 L -76 150 L -20 160 L -10 0 Z" fill={C.lav} stroke={C.ink} strokeWidth={7} strokeLinejoin="round" />
      <path d="M -66 70 L -18 76 M -70 100 L -16 108" stroke={C.lavDeep} strokeWidth={7} />
    </g>}
    {showBody && clerk && <g>
      <path d="M -220 270 L -220 120 Q -216 -8 -94 -32 L 94 -32 Q 216 -8 220 120 L 220 270 Z" fill="#fff" stroke={C.ink} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M -8 -26 L -190 -8 L -214 270 L -8 270 Z M 8 -26 L 190 -8 L 214 270 L 8 270 Z" fill={C.ink} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
      <path d="M -70 -28 L 0 70 L 70 -28" fill="none" stroke={C.tagRed} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />
      <rect x={-44} y={60} width={88} height={64} rx={8} fill="#fff" stroke={C.ink} strokeWidth={6} /><rect x={-30} y={72} width={60} height={12} fill={C.tagRed} /><rect x={-30} y={96} width={40} height={8} fill={C.ink} opacity={0.5} />
    </g>}
    {showHead && <g transform={`rotate(${pose.tilt} 0 -40)`}>
      {!him && !clerk && <g>
        <ellipse cx={0} cy={-205} rx={140} ry={150} fill={C.hairHer} stroke={C.ink} strokeWidth={SW} />
      </g>}
      <rect x={-42} y={-80} width={84} height={64} fill={skin} stroke={C.ink} strokeWidth={7} />
      <ellipse cx={0} cy={-34 + pose.gulp * 14} rx={20} ry={10 + pose.gulp * 8} fill={mixc(skin, '#000000', 0.12)} opacity={0.35 + pose.gulp * 0.5} />
      {[-1, 1].map((sd) => <g key={sd}>
        <ellipse cx={sd * 126} cy={-166} rx={24} ry={36} fill={earC} stroke={C.ink} strokeWidth={7} />
        {pose.flush > 0.3 && him && <ellipse cx={sd * 126} cy={-166} rx={11} ry={20} fill={C.flush} opacity={pose.flush * 0.7} />}
      </g>)}
      <ellipse cx={0} cy={-178} rx={126} ry={140} fill={skin} stroke={C.ink} strokeWidth={SW} />
      <ellipse cx={-64} cy={-120} rx={26} ry={18} fill={C.flush} opacity={pose.flush * 0.55 + 0.1} />
      <ellipse cx={64} cy={-120} rx={26} ry={18} fill={C.flush} opacity={pose.flush * 0.55 + 0.1} />
      {/* hair */}
      {him && <g>
        <path d="M -128 -196 L -150 -262 L -110 -246 L -108 -330 L -60 -280 L -40 -366 L 0 -296 L 40 -372 L 60 -300 L 110 -340 L 112 -262 L 150 -270 L 128 -196 C 110 -250 40 -266 -10 -258 C -62 -262 -110 -246 -128 -196 Z" fill={C.hairHim} stroke={C.ink} strokeWidth={SW} strokeLinejoin="round" />
        <path d="M 30 -300 L 70 -400 L 84 -290" fill={C.hairHim} stroke={C.ink} strokeWidth={7} strokeLinejoin="round" />
      </g>}
      {!him && !clerk && <g>
        <circle cx={0} cy={-352} r={62} fill={C.hairHer} stroke={C.ink} strokeWidth={SW} />
        <path d="M -52 -304 Q 0 -280 52 -304 L 48 -322 Q 0 -300 -48 -322 Z" fill={C.lav} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
        <path d="M -128 -180 C -140 -300 -50 -318 0 -310 C 50 -318 140 -300 128 -180 C 100 -240 50 -250 0 -246 C -50 -250 -100 -240 -128 -180 Z" fill={C.hairHer} stroke={C.ink} strokeWidth={SW} strokeLinejoin="round" />
        <path d="M -40 -330 Q 0 -350 40 -330" fill="none" stroke="#5A3A30" strokeWidth={5} strokeLinecap="round" />
      </g>}
      {clerk && <g>
        <path d="M -124 -196 C -134 -300 -50 -318 0 -314 C 50 -318 134 -300 124 -196 C 100 -250 50 -262 0 -260 C -50 -262 -100 -250 -124 -196 Z" fill="#8E93A3" stroke={C.ink} strokeWidth={SW} strokeLinejoin="round" />
      </g>}
      {/* eyes */}
      {[-1, 1].map((sd) => <g key={sd} transform={`translate(${sd * 50} -176)`}>
        {pose.happy ? <path d="M -28 8 Q 0 -28 28 8" fill="none" stroke={C.ink} strokeWidth={9} strokeLinecap="round" /> : <g transform={`scale(1 ${1 - pose.blink * 0.92})`}>
          <ellipse cx={0} cy={0} rx={30} ry={37} fill="#fff" stroke={C.ink} strokeWidth={6} />
          <circle cx={lx * 12} cy={ly * 13} r={16} fill={C.ink} />
          <circle cx={lx * 12 + 5} cy={ly * 13 - 6} r={5} fill="#fff" />
          {clerk && <path d="M -32 -42 L 32 -42 L 32 -6 L -32 -6 Z" fill={skin} stroke={C.ink} strokeWidth={5} />}
        </g>}
        <path d={`M -30 ${-58 - pose.brow * 16 + sd * pose.worry * 10} L 30 ${-58 - pose.brow * 16 - sd * pose.worry * 10}`} fill="none" stroke={C.ink} strokeWidth={him ? 13 : 10} strokeLinecap="round" />
      </g>)}
      <path d="M -8 -150 Q 0 -132 12 -146" fill="none" stroke={C.ink} strokeWidth={6} strokeLinecap="round" opacity={0.7} />
      {clerk && <g><path d="M -52 -108 Q -26 -124 0 -112 Q 26 -124 52 -108 Q 26 -100 0 -102 Q -26 -100 -52 -108 Z" fill="#6E7384" stroke={C.ink} strokeWidth={5} /><path d="M -90 -150 q 10 20 0 40 M 90 -150 q -10 20 0 40" stroke={C.ink} strokeWidth={4} fill="none" opacity={0.5} /></g>}
      <g transform={`translate(0 ${clerk ? -66 : -92})`}><MouthShape m={pose.mouth} /></g>
      {pose.sweat > 0.02 && <g transform={`translate(${him ? 118 : -118} ${-290 + pose.sweat * 70}) scale(${0.5 + pose.sweat * 0.6})`} opacity={clamp(pose.sweat * 2)}>
        <path d="M 0 -34 Q 26 8 0 26 Q -26 8 0 -34 Z" fill="#9FDCF7" stroke={C.ink} strokeWidth={6} /><path d="M -6 -4 Q -10 8 -2 14" stroke="#fff" strokeWidth={4} fill="none" strokeLinecap="round" />
      </g>}
    </g>}
  </g>;
};

/** Sleeve + hand. */
export const Arm: React.FC<{who: 'him' | 'her' | 'clerk'; sx: number; sy: number; hx: number; hy: number; w?: number}> = ({who, sx, sy, hx, hy, w = 96}) => {
  const skin = who === 'him' ? C.skinHim : who === 'her' ? C.skinHer : C.skinClerk;
  const sleeve = who === 'him' ? C.parka : who === 'her' ? C.char : C.ink;
  const mx = (sx + hx) / 2 + (hx > sx ? 24 : -24), my = (sy + hy) / 2 + 30;
  const d = `M ${sx} ${sy} Q ${mx} ${my} ${hx} ${hy}`;
  return <g>
    <path d={d} fill="none" stroke={C.ink} strokeWidth={w + 16} strokeLinecap="round" />
    <path d={d} fill="none" stroke={sleeve} strokeWidth={w} strokeLinecap="round" />
    <circle cx={hx} cy={hy} r={46} fill={skin} stroke={C.ink} strokeWidth={7} />
    {[-16, 0, 16].map((xx, i) => <path key={i} d={`M ${hx + xx} ${hy - 14} q 4 -22 0 -30`} fill="none" stroke={C.ink} strokeWidth={4} opacity={0.45} strokeLinecap="round" />)}
  </g>;
};

// ---------------------------------------------------------------------------------------- phone (generic glowing card, no UI)
export const Phone: React.FC<{x: number; y: number; rot?: number; scale?: number; lit?: number; p?: number; dir?: number; thumb?: number; caseColor?: string; id: string; skin?: string}> = ({x, y, rot = 0, scale = 1, lit = 1, p = 0, dir = 1, thumb = 1, caseColor = '#222B45', id, skin = C.skinHim}) => {
  const off = dir * p * 130, rr = dir * p * 18;
  return <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale})`}>
    <ellipse cx={0} cy={0} rx={400} ry={400} fill="url(#haloPhone)" opacity={lit} />
    <rect x={-80} y={-146} width={160} height={292} rx={30} fill={caseColor} stroke={C.ink} strokeWidth={8} />
    <clipPath id={`scr${id}`}><rect x={-66} y={-132} width={132} height={264} rx={20} /></clipPath>
    <g clipPath={`url(#scr${id})`}>
      <rect x={-66} y={-132} width={132} height={264} fill={lit > 0.3 ? 'url(#scr)' : '#3A4466'} opacity={0.4 + 0.6 * lit} />
      <g transform={`scale(${0.92 + 0.08 * p})`}><rect x={-48} y={-88} width={96} height={176} rx={14} fill="#F3EEFF" stroke="#C9BBFF" strokeWidth={3} /><circle cx={0} cy={-38} r={28} fill="#C9BBFF" /><rect x={-34} y={14} width={68} height={10} rx={5} fill="#D9CFFF" /><rect x={-34} y={34} width={44} height={10} rx={5} fill="#E6DFFF" /></g>
      <g transform={`translate(${off} ${p * -10}) rotate(${rr} 0 90)`} opacity={1 - p * 0.5}>
        <rect x={-48} y={-90} width={96} height={176} rx={14} fill="#fff" stroke="#B7A4FF" strokeWidth={3} />
        <circle cx={0} cy={-40} r={30} fill="#B9A7FF" /><circle cx={0} cy={-48} r={11} fill="#fff" /><path d="M -22 -24 Q 0 -6 22 -24" fill="#fff" />
        <rect x={-34} y={12} width={68} height={10} rx={5} fill="#C9BBFF" /><rect x={-34} y={32} width={46} height={10} rx={5} fill="#DDD3FF" /><rect x={-34} y={52} width={56} height={10} rx={5} fill="#DDD3FF" />
      </g>
    </g>
    <rect x={-66} y={-132} width={132} height={264} rx={20} fill="none" stroke={C.ink} strokeWidth={4} />
    <path d="M 36 -118 L 36 80" stroke="#fff" strokeWidth={7} opacity={0.25 * lit} strokeLinecap="round" />
    {thumb > 0.01 && <g transform={`translate(${off * 0.5 + 6} ${52 + p * -10})`} opacity={thumb}><ellipse cx={0} cy={0} rx={22} ry={34} fill={skin} stroke={C.ink} strokeWidth={6} transform="rotate(-14)" /></g>}
  </g>;
};

// ---------------------------------------------------------------------------------------- slips, pens, tags
export const Slip: React.FC<{w: number; h: number; rot?: number; glow?: number; children?: React.ReactNode; id?: string}> = ({w, h, rot = 0, glow = 0, children}) => <g transform={`rotate(${rot})`}>
  {glow > 0 && <ellipse cx={0} cy={0} rx={w * 0.85} ry={h * 0.85} fill="url(#haloSlip)" opacity={glow} />}
  <rect x={-w / 2 + 10} y={-h / 2 + 20} width={w} height={h} fill={C.ink} opacity={0.3} filter="url(#blurSh)" />
  <rect x={-w / 2 + 14} y={-h / 2 + 14} width={w} height={h} rx={10} fill={C.ink} />
  <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={10} fill={C.slip} stroke={C.ink} strokeWidth={8} />
  <path d={`M ${-w / 2 + 20} ${-h / 2 + h * 0.07} L ${w / 2 - 20} ${-h / 2 + h * 0.07}`} stroke={C.slipDeep} strokeWidth={5} strokeDasharray="14 10" />
  {Array.from({length: 22}, (_, i) => <rect key={i} x={-w / 2 + 28 + i * ((w - 56) / 22)} y={h / 2 - h * 0.1} width={i % 3 === 0 ? 7 : 4} height={h * 0.06} fill={C.ink} opacity={0.75} />)}
  {children}
</g>;

/** pen (tip at origin, body goes down-right to a hand + sleeve). */
export const PenSprite: React.FC<{color: string; sleeve: string; skin: string; jit?: number; tilt?: number; hand?: boolean; len?: number}> = ({color, sleeve, skin, jit = 0, tilt = -24, hand = true, len = 270}) => <g transform={`translate(${jit} 0) rotate(${tilt})`}>
  {hand && <path d={`M 0 ${len - 20} L 0 ${len + 420}`} stroke={C.ink} strokeWidth={118} strokeLinecap="butt" />}
  {hand && <path d={`M 0 ${len - 20} L 0 ${len + 420}`} stroke={sleeve} strokeWidth={102} strokeLinecap="butt" />}
  <rect x={-13} y={30} width={26} height={len} rx={10} fill={color} stroke={C.ink} strokeWidth={6} />
  <rect x={-6} y={46} width={7} height={len * 0.55} rx={3} fill="#fff" opacity={0.35} />
  <path d="M -13 30 L 0 0 L 13 30 Z" fill="#E8EEF3" stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
  <path d="M 0 0 L 0 -3" stroke={C.ink} strokeWidth={6} strokeLinecap="round" />
  {hand && <circle cx={0} cy={len - 34} r={50} fill={skin} stroke={C.ink} strokeWidth={7} />}
  {hand && <path d={`M -34 ${len - 52} q 16 -16 36 -6`} stroke={C.ink} strokeWidth={4} fill="none" opacity={0.4} />}
</g>;

/** pen-drawn text (reveals left to right with the pen riding the edge). */
export const PenText: React.FC<{txt: string; x: number; y: number; size: number; color: string; p: number; id: string; rot?: number; sleeve: string; skin: string; jit?: number}> = ({txt, x, y, size, color, p, id, rot = 0, sleeve, skin, jit = 0}) => {
  const w = textW(txt, `700 ${size}px ${PEN}`);
  const q = clamp(p);
  if (q <= 0) return null;
  const tx = -w / 2 + w * q;
  return <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    <clipPath id={`pt${id}`}><rect x={-w / 2 - 20} y={-size * 1.1} width={(w + 40) * q} height={size * 1.8} /></clipPath>
    <text x={-w / 2} y={0} fontFamily={PEN} fontWeight={700} fontSize={size} fill={color} clipPath={`url(#pt${id})`}>{txt}</text>
    {q < 1 && <g transform={`translate(${tx + 6} ${-size * 0.12 + Math.sin(q * 60) * 3})`}><PenSprite color={color} sleeve={sleeve} skin={skin} jit={jit} /></g>}
  </g>;
};

export const Tag: React.FC<{x: number; y: number; rot?: number; s?: number}> = ({x, y, rot = 0, s = 1}) => <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
  <path d="M 0 -80 L 0 -30" stroke={C.ink} strokeWidth={5} />
  <path d="M -48 -30 L 48 -30 L 48 110 L -48 110 Z" fill={C.tagRed} stroke={C.ink} strokeWidth={7} strokeLinejoin="round" />
  <circle cx={0} cy={-8} r={9} fill={C.cream} stroke={C.ink} strokeWidth={4} />
  <rect x={-32} y={20} width={64} height={52} fill="#fff" />
  {Array.from({length: 10}, (_, i) => <rect key={i} x={-28 + i * 6} y={26} width={i % 3 === 0 ? 4 : 2} height={40} fill={C.ink} />)}
  <rect x={-30} y={80} width={60} height={9} fill="#fff" opacity={0.8} />
</g>;

export const ShirtBag: React.FC<{x: number; y: number; s?: number; swing?: number; tags?: boolean}> = ({x, y, s = 1, swing = 0, tags = true}) => <g transform={`translate(${x} ${y}) rotate(${swing}) scale(${s})`}>
  <path d="M 0 -250 L 0 -210 M -26 -226 Q 0 -262 26 -226" stroke={C.ink} strokeWidth={8} fill="none" strokeLinecap="round" />
  <path d="M -130 -200 Q 0 -230 130 -200 L 150 330 L -150 330 Z" fill="#DFF6FF" opacity={0.75} stroke={C.ink} strokeWidth={8} strokeLinejoin="round" />
  {/* mint shirt */}
  <path d="M -92 -176 L -40 -196 Q 0 -160 40 -196 L 92 -176 L 132 -70 L 84 -48 L 70 -92 L 76 250 L -76 250 L -70 -92 L -84 -48 L -132 -70 Z" fill={C.mint} stroke={C.ink} strokeWidth={7} strokeLinejoin="round" />
  <path d="M -40 -196 L 0 -130 L 40 -196" fill="none" stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
  {[-90, -40, 10, 60].map((yy, i) => <circle key={i} cx={0} cy={yy} r={7} fill="#fff" stroke={C.ink} strokeWidth={3} />)}
  <path d="M -112 -200 L -112 280" stroke="#fff" strokeWidth={14} opacity={0.5} strokeLinecap="round" />
  {tags && <g><Tag x={-60} y={-176} rot={14 + swing * 2} s={0.9} /><Tag x={30} y={-176} rot={-10 + swing * 2} s={0.8} /></g>}
</g>;

// ---------------------------------------------------------------------------------------- strips
export const Strip: React.FC<{text: string; y: number; age: number; out?: number; size?: number; maxW?: number; hot?: boolean}> = ({text, y, age, out = 0, size = 56, maxW = 1000, hot = false}) => {
  const font = (s: number) => `900 ${s}px ${SANS}`;
  const inner = maxW - 80;
  const width = (ls: string[], s: number) => Math.max(...ls.map((l) => textW(l, font(s))));
  let lines = [text];
  let s = size;
  if (width(lines, s) > inner) {
    const ws = text.split(' ');
    let best = Infinity;
    for (let i = 1; i < ws.length; i++) {
      const ls = [ws.slice(0, i).join(' '), ws.slice(i).join(' ')];
      const w = width(ls, s);
      if (w < best) { best = w; lines = ls; }
    }
    while (s > 34 && width(lines, s) > inner) s -= 2;
  }
  const lh = s * 1.16, h = lines.length * lh + 44, w = Math.min(maxW, width(lines, s) + 80);
  if (y < 600) y = Math.max(y, 290 + h / 2);
  const pop = smooth(age, 0, 0.1) * (1 + 0.05 * Math.sin(clamp(age / 0.32) * Math.PI));
  const x0 = 540 - w / 2, y0 = y - h / 2;
  return <g opacity={1 - out} transform={`translate(540 ${y - out * 14}) scale(${pop}) translate(-540 ${-y})`}>
    <rect x={x0 + 8} y={y0 + 12} width={w} height={h} rx={14} fill={C.ink} opacity={0.4} />
    <rect x={x0} y={y0} width={w} height={h} rx={14} fill={hot ? C.tagRed : '#fff'} stroke={hot ? C.ink : C.tagRed} strokeWidth={hot ? 6 : 7} />
    {!hot && <rect x={x0 + 9} y={y0 + 9} width={w - 18} height={h - 18} rx={8} fill="none" stroke={C.ink} strokeWidth={2} opacity={0.18} />}
    {lines.map((l, i) => <text key={i} x={540} y={y0 + 22 + lh * (i + 0.78)} textAnchor="middle" fontFamily={SANS} fontWeight={900} fontSize={s} fill={hot ? '#fff' : C.ink}>{l}</text>)}
  </g>;
};

// ---------------------------------------------------------------------------------------- scanner beam
export const BEAM_DUR = 0.5;
export const Beam: React.FC<{k: number}> = ({k}) => {
  const x = lerp(-30, 1110, smooth(k, 0, 1));
  return <g>
    <rect x={x - 220} y={-50} width={220} height={2020} fill="url(#beamG)" />
    <rect x={x - 14} y={-50} width={28} height={2020} fill={C.tagRed} opacity={0.5} filter="url(#blurGlow)" />
    <rect x={x - 5} y={-50} width={10} height={2020} fill={C.tagRed} />
    <rect x={x - 2} y={-50} width={4} height={2020} fill="#fff" opacity={0.9} />
  </g>;
};

// ---------------------------------------------------------------------------------------- vote cards + end card
export const VoteSlip: React.FC<{letter: string; l1: string; l2: string; y: number; age: number; rot: number; id: string}> = ({letter, l1, l2, y, age, rot, id}) => {
  if (age < 0) return null;
  const k = clamp(age / 0.35);
  const sp = Math.max(0.01, 1 + Math.sin(k * Math.PI * 1.5) * Math.exp(-k * 4.2) * 0.4 - Math.exp(-k * 9) * (1 - k));
  const x = 580 + (1 - Math.min(1, k * 1.4)) * 800;
  return <g transform={`translate(${x} ${y}) scale(${sp})`}>
    <Slip w={800} h={210} rot={rot}>
      <g transform="translate(40 0)">
        <PenText txt={l1} x={0} y={l2 ? -4 : 24} size={84} color={C.ink} p={(age - 0.05) / 0.2} id={`${id}1`} sleeve={C.parka} skin={C.skinHim} />
        {l2 && <PenText txt={l2} x={0} y={78} size={84} color={C.ink} p={(age - 0.15) / 0.2} id={`${id}2`} sleeve={C.parka} skin={C.skinHim} />}
      </g>
    </Slip>
    <g transform={`translate(${-410} -6) rotate(${rot})`}>
      <circle r={72} fill={C.ink} transform="translate(7 9)" /><circle r={72} fill={C.tagRed} stroke={C.ink} strokeWidth={8} />
      <text x={0} y={36} textAnchor="middle" fontFamily={ANTON} fontSize={104} fill="#fff">{letter}</text>
    </g>
  </g>;
};

export const EndCard: React.FC<{a: number; t: number; soft: number}> = ({a, t, soft}) => {
  const pop = (d: number) => { const k = clamp((a - d) / 0.3); return k <= 0 ? 0 : 1 + Math.sin(k * Math.PI * 1.5) * Math.exp(-k * 4.2) * 0.4 - Math.exp(-k * 9) * (1 - k); };
  const pillT = 'part 2 · A or B';
  const pw = textW(pillT, `900 62px ${SANS}`) + 90;
  const softT = 'tired of swiping? noswipe.app · link in bio';
  const sfs = Math.min(36, Math.floor((900 / textW(softT, `800 36px ${SANS}`)) * 36));
  const sw = textW(softT, `800 ${sfs}px ${SANS}`) + 70;
  return <g>
    <Far t={t} dim={0.1} />
    <g transform={`translate(540 640) scale(${pop(0)})`}>
      <Slip w={900} h={420} rot={-1.5} glow={0.6}>
        <text x={0} y={-30} textAnchor="middle" fontFamily={ANTON} fontSize={150} fill={C.ink} letterSpacing={3}>REASON FOR</text>
        <text x={0} y={120} textAnchor="middle" fontFamily={ANTON} fontSize={150} fill={C.tagRed} letterSpacing={3}>RETURN</text>
      </Slip>
    </g>
    <g transform={`translate(540 925) scale(${pop(0.2)})`}>
      <rect x={-pw / 2 + 8} y={-52 + 10} width={pw} height={104} rx={16} fill={C.ink} opacity={0.4} />
      <rect x={-pw / 2} y={-52} width={pw} height={104} rx={16} fill="#fff" stroke={C.tagRed} strokeWidth={8} />
      <text x={0} y={22} textAnchor="middle" fontFamily={SANS} fontWeight={900} fontSize={62} fill={C.ink}>{pillT}</text>
    </g>
    <g transform={`translate(540 1075)`} opacity={soft}>
      <rect x={-sw / 2} y={-34} width={sw} height={68} rx={34} fill={C.ink} opacity={0.5} />
      <text x={0} y={sfs * 0.36} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={sfs} fill={C.cream}>{softT}</text>
    </g>
  </g>;
};

/** the low line barrier the people lean on (cream top, teal front, red stripe). */
export const Barrier: React.FC<{y?: number}> = ({y = 1190}) => <g>
  <rect x={-40} y={y - 14} width={1160} height={30} fill={C.ink} opacity={0.25} filter="url(#blurSh)" />
  <rect x={-40} y={y} width={1160} height={64} fill={C.cream} stroke={C.ink} strokeWidth={8} />
  <rect x={-40} y={y + 64} width={1160} height={190} fill={C.tealDeep} stroke={C.ink} strokeWidth={8} />
  <rect x={-40} y={y + 120} width={1160} height={26} fill={C.tagRed} />
  <rect x={-40} y={y + 150} width={1160} height={8} fill="#fff" opacity={0.7} />
  <rect x={-20} y={y + 8} width={1120} height={9} rx={4} fill="#fff" opacity={0.8} />
</g>;

export const Chain: React.FC<{x1: number; y1: number; x2: number; y2: number; sag?: number; jit?: number}> = ({x1, y1, x2, y2, sag = 60, jit = 0}) => {
  const n = 14;
  const pts = Array.from({length: n + 1}, (_, i) => {
    const u = i / n;
    return [lerp(x1, x2, u) + Math.sin(u * 9 + jit * 40) * jit * 18, lerp(y1, y2, u) + Math.sin(u * Math.PI) * sag + Math.cos(u * 7 + jit * 30) * jit * 10] as [number, number];
  });
  return <g>{pts.map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx={9} ry={6} fill={C.steel} stroke={C.ink} strokeWidth={3} transform={`rotate(${i % 2 ? 40 : -40} ${x} ${y})`} />)}</g>;
};

export const Burst: React.FC<{x: number; y: number; k: number}> = ({x, y, k}) => {
  const sp = k <= 0 ? 0 : 1 + Math.sin(clamp(k) * Math.PI * 1.5) * Math.exp(-clamp(k) * 4.2) * 0.45;
  const pts = Array.from({length: 16}, (_, i) => { const a = (i / 16) * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 46 : 78; return `${Math.cos(a) * r},${Math.sin(a) * r}`; }).join(' ');
  return <g transform={`translate(${x} ${y}) scale(${sp}) rotate(8)`}>
    <polygon points={pts} fill={C.ink} transform="translate(5 7)" opacity={0.35} /><polygon points={pts} fill={C.coral} stroke={C.ink} strokeWidth={7} strokeLinejoin="round" />
    <text x={0} y={34} textAnchor="middle" fontFamily={ANTON} fontSize={92} fill="#fff" stroke={C.ink} strokeWidth={5} paintOrder="stroke">!</text>
  </g>;
};
