import React, {useId} from 'react';
import {clamp, lerp, smooth} from '../../lib/motion';
import {OPEN} from '../../lib/fonts';

// SEVEN ACROSS (season 5): a mid-century travel-poster look. Flat shapes on cream paper, bottle-green
// seats, signal-orange sun, mustard only on her scarf. Everything here is reusable by parts 2-6:
// the carriage (wall, window, sign, seats, table, door), the cast (Him, Her, hands, phone), the paper
// with clue + boxes, the passing-train transition, the strips and the vote board.

export const C = {
  green: '#2F4A3E', greenDark: '#22392F', orange: '#FF8A3D', orangeDeep: '#E5702A', sky: '#CFE6EE', rust: '#B5452B', rustDark: '#8C3820',
  ink: '#1B1E1C', mustard: '#E3A82B', cream: '#F1E6CC', paper: '#FBF4E0', paperEdge: '#E4D5AE', skinHim: '#EDB78F', skinHer: '#C98C62',
  coatHer: '#9CC3D1', hair: '#2B1D17', lit: '#FFE7B0',
};
export const JOST = '"Jost", sans-serif';
export const PEN = OPEN.handwriting;      // Caveat
export const STRIPF = OPEN.condensed;     // Barlow Condensed

// ---------------------------------------------------------------------------------------- camera

export type Cam = {x: number; y: number; z: number};
export type CamKey = {t: number; x: number; y: number; z: number; cut?: boolean};
const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

/** Eased keyframes; a key with `cut` holds the previous framing, then jumps (hidden behind a passing train). */
export const camAt = (keys: CamKey[], t: number): Cam => {
  let i = 0;
  while (i + 1 < keys.length && t >= keys[i + 1].t) i++;
  const a = keys[i], b = keys[i + 1];
  let c: Cam = {x: a.x, y: a.y, z: a.z};
  if (b && !b.cut) {
    const k = ease(clamp((t - a.t) / (b.t - a.t)));
    c = {x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z: lerp(a.z, b.z, k)};
  }
  // a little train sway
  return {x: c.x + 2.2 * Math.sin(t * 1.9), y: c.y + 2.6 * Math.sin(t * 2.7 + 1), z: c.z * (1 + 0.003 * Math.sin(t * 1.3))};
};

/** Transform for a plane at relative depth d (1 = the cast; <1 farther, moves less; >1 nearer). */
export const planeT = (c: Cam, d: number) => {
  const s = 1 + (c.z - 1) * d;
  const cx = 540 + (c.x - 540) * d, cy = 960 + (c.y - 960) * d;
  return `translate(540 960) scale(${s.toFixed(4)}) translate(${(-cx).toFixed(2)} ${(-cy).toFixed(2)})`;
};

/** Soft ink-tinted shadow of `children` cast onto the plane behind. */
export const Soft: React.FC<{box: [number, number, number, number]; dx?: number; dy?: number; blur?: number; op?: number; children: React.ReactNode}> = ({box, dx = 14, dy = 22, blur = 10, op = 0.3, children}) => {
  const id = 'sf' + useId().replace(/[^a-z0-9]/gi, '');
  return <g>
    <defs><filter id={id} filterUnits="userSpaceOnUse" x={box[0]} y={box[1]} width={box[2]} height={box[3]}>
      <feColorMatrix type="matrix" values={`0 0 0 0 0.08  0 0 0 0 0.12  0 0 0 0 0.10  0 0 0 ${op} 0`} />
      <feGaussianBlur stdDeviation={blur} />
    </filter></defs>
    <g filter={`url(#${id})`} transform={`translate(${dx} ${dy})`}>{children}</g>
  </g>;
};

// ---------------------------------------------------------------------------------------- window

const WIN = {x: 150, y: 380, w: 860, h: 350};
const HORIZON = 650;
const SPEED = 520;
const wrapX = (off: number, period: number) => -((off % period) + period) % period;

export const hillPath = (amp: number, base: number, period: number, seed: number) => {
  const pts: string[] = [];
  for (let x = 0; x <= period * 2 + 20; x += 20) {
    const y = base - amp * (0.55 + 0.45 * Math.sin((x / period) * Math.PI * 2 + seed)) - amp * 0.3 * Math.sin((x / period) * Math.PI * 6 + seed * 2);
    pts.push(`${x} ${y.toFixed(1)}`);
  }
  return `M 0 ${base + 200} L ${pts.join(' L ')} L ${period * 2 + 20} ${base + 200} Z`;
};
const HILL1 = hillPath(70, HORIZON + 20, 900, 0.5);
const HILL2 = hillPath(46, HORIZON + 40, 700, 2.1);

const Pylon: React.FC<{x: number}> = ({x}) => <g transform={`translate(${x} 0)`}>
  <path d="M -26 692 L -6 470 L 6 470 L 26 692 Z" fill="none" stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
  <path d="M -20 640 L 20 640 M -15 590 L 15 590 M -11 540 L 11 540 M -22 665 L 8 590 M 22 665 L -8 590 M -14 615 L 12 540 M 14 615 L -12 540" stroke={C.ink} strokeWidth={3} />
  <path d="M -48 482 L 48 482 M -34 508 L 34 508" stroke={C.ink} strokeWidth={6} strokeLinecap="round" />
</g>;

const Cow: React.FC<{x: number}> = ({x}) => <g transform={`translate(${x} 690)`}>
  <rect x={-42} y={-44} width={84} height={42} rx={14} fill={C.cream} />
  <ellipse cx={-8} cy={-30} rx={13} ry={9} fill={C.rust} /><ellipse cx={20} cy={-20} rx={9} ry={7} fill={C.rust} />
  <rect x={-34} y={-6} width={8} height={26} fill={C.cream} /><rect x={22} y={-6} width={8} height={26} fill={C.cream} />
  <path d="M 36 -40 L 62 -30 L 60 -10 L 38 -14 Z" fill={C.cream} /><circle cx={54} cy={-22} r={3} fill={C.ink} />
  <path d="M 40 -42 L 44 -54 M 52 -38 L 58 -50" stroke={C.ink} strokeWidth={3} strokeLinecap="round" />
</g>;

/** A hot-air balloon for the window sky: centre of the envelope at (x, y), s = scale (1 = 200 px wide). */
export const Balloon: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => {
  const env = 'M 0 -104 C 100 -104 112 20 44 84 L 24 100 L -24 100 L -44 84 C -112 20 -100 -104 0 -104 Z';
  const cols = [C.rust, C.orangeDeep, C.rust, C.orangeDeep, C.rust];
  return <g transform={`translate(${x} ${y}) scale(${s})`}>
    <clipPath id="balloonclip"><path d={env} /></clipPath>
    <g clipPath="url(#balloonclip)">
      {cols.map((c, i) => <rect key={i} x={-110 + i * 44} y={-110} width={46} height={220} fill={c} />)}
      <path d="M -110 -20 Q 0 20 110 -20 L 110 -4 Q 0 36 -110 -4 Z" fill={C.ink} opacity={0.12} />
    </g>
    <path d={env} fill="none" stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
    <path d="M -22 100 L -16 132 M 22 100 L 16 132" stroke={C.ink} strokeWidth={4} />
    <rect x={-24} y={132} width={48} height={32} rx={6} fill={C.rustDark} stroke={C.ink} strokeWidth={4} />
  </g>;
};

const mixHex = (a: string, b: string, k: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return '#' + pa.map((v, i) => Math.round(lerp(v, pb[i], k)).toString(16).padStart(2, '0')).join('');
};

export const Window: React.FC<{t: number; off?: number; station?: number; platX?: number; walkerX?: number; walkerOp?: number; balloon?: {x: number; y: number; s?: number} | null; dusk?: number}> = ({t, off: offIn, station = 0, platX = 0, walkerX = 0, walkerOp = 0, balloon = null, dusk = 0}) => {
  const off = offIn ?? t * SPEED;
  const sunY = lerp(HORIZON + 40 - Math.min(190, 40 + t * 11), HORIZON - 30, dusk);   // the sun climbs all episode
  const rays = Array.from({length: 14}, (_, i) => i);
  return <g>
    <defs>
      <clipPath id="winclip"><rect x={WIN.x} y={WIN.y} width={WIN.w} height={WIN.h} rx={16} /></clipPath>
      <linearGradient id="skyg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={mixHex(C.sky, '#E9A06E', dusk)} /><stop offset="0.55" stopColor={mixHex('#F6DDBA', '#E5702A', dusk)} /><stop offset="1" stopColor={mixHex('#FFB070', '#B5452B', dusk)} />
      </linearGradient>
    </defs>
    <g clipPath="url(#winclip)">
      <rect x={WIN.x} y={WIN.y} width={WIN.w} height={WIN.h} fill="url(#skyg)" />
      <g transform={`translate(580 ${sunY}) rotate(${t * 2})`} opacity={0.22}>
        {rays.map((i) => <path key={i} d={`M 0 0 L ${-30} -520 L ${30} -520 Z`} transform={`rotate(${i * (360 / 14)})`} fill={C.orange} />)}
      </g>
      <circle cx={580} cy={sunY} r={118} fill={C.orange} opacity={0.3} />
      <circle cx={580} cy={sunY} r={78 + 14 * dusk} fill={mixHex(C.orange, '#E8501F', dusk)} />
      {balloon && <Balloon x={balloon.x} y={balloon.y} s={balloon.s} />}
      <g transform={`translate(${wrapX(off * 0.3, 1800)} 0)`}>
        <path d={HILL1} fill={mixHex('#9CBBA9', '#8E5646', dusk)} /><path d={HILL2} fill={mixHex('#6F9A84', '#6A3B34', dusk)} transform="translate(300 0)" />
      </g>
      <g transform={`translate(${wrapX(off * 0.7, 840)} 0)`}>
        {[0, 1, 2, 3].map((k) => <Pylon key={k} x={k * 420 + 120} />)}
        <path d={[0, 1, 2].map((k) => `M ${k * 420 + 120 - 48} 482 Q ${k * 420 + 330} 540 ${k * 420 + 420 + 120 - 48} 482`).join(' ')} fill="none" stroke={C.ink} strokeWidth={2.5} />
      </g>
      <rect x={WIN.x} y={690} width={WIN.w} height={60} fill={C.green} />
      <g transform={`translate(${wrapX(off * 1.2, 1520)} 0)`}>
        {Array.from({length: 40}, (_, k) => <rect key={k} x={k * 76} y={664} width={9} height={52} fill={C.ink} />)}
        <rect x={0} y={676} width={3100} height={6} fill={C.ink} /><rect x={0} y={698} width={3100} height={6} fill={C.ink} />
        <Cow x={300} /><Cow x={1060} /><Cow x={1820} /><Cow x={2580} />
      </g>
      {station > 0.01 && <g opacity={station}>
        <rect x={WIN.x} y={560} width={WIN.w} height={200} fill="#B9CFC4" />
        <g transform={`translate(${platX} 0)`}>
          {[0, 1, 2].map((k) => <g key={k} transform={`translate(${200 + k * 420} 0)`}>
            <rect x={-8} y={470} width={16} height={230} fill={C.ink} /><rect x={-34} y={462} width={68} height={14} rx={7} fill={C.ink} /><circle cx={0} cy={486} r={14} fill={C.lit} />
          </g>)}
          <rect x={300} y={560} width={260} height={36} fill={C.rust} opacity={0.9} /><rect x={310} y={596} width={10} height={64} fill={C.ink} /><rect x={540} y={596} width={10} height={64} fill={C.ink} />
          <rect x={820} y={640} width={150} height={12} fill={C.rustDark} /><rect x={830} y={652} width={10} height={36} fill={C.ink} /><rect x={950} y={652} width={10} height={36} fill={C.ink} />
        </g>
        <rect x={WIN.x} y={690} width={WIN.w} height={60} fill="#E9DDBA" /><rect x={WIN.x} y={690} width={WIN.w} height={8} fill={C.cream} />
        {Array.from({length: 12}, (_, k) => <rect key={k} x={WIN.x + 10 + k * 76 + platX % 76} y={716} width={44} height={6} fill={C.ink} opacity={0.35} />)}
        {walkerOp > 0.01 && <g transform={`translate(${walkerX} 700)`} opacity={walkerOp}>
          <rect x={-12} y={-74} width={11} height={72} rx={5} fill={C.ink} transform="rotate(14 -6 -74)" /><rect x={2} y={-74} width={11} height={72} rx={5} fill={C.ink} transform="rotate(-14 8 -74)" />
          <path d="M -26 -78 L 26 -78 L 22 -150 L -22 -150 Z" fill={C.coatHer} />
          <path d="M -20 -150 L 20 -150 L 24 -134 L -24 -134 Z" fill={C.mustard} />
          <circle cx={0} cy={-170} r={19} fill={C.skinHer} /><path d="M -21 -166 C -24 -196 14 -196 20 -172 C 8 -180 -4 -176 -4 -160 C -6 -150 -22 -150 -21 -166 Z" fill={C.hair} />
        </g>}
      </g>}
      <rect x={WIN.x} y={WIN.y} width={WIN.w} height={26} fill={C.ink} opacity={0.08} />
    </g>
    <rect x={WIN.x - 14} y={WIN.y - 14} width={WIN.w + 28} height={WIN.h + 28} rx={26} fill="none" stroke={C.rust} strokeWidth={28} />
    <rect x={WIN.x - 28} y={WIN.y - 28} width={WIN.w + 56} height={WIN.h + 56} rx={34} fill="none" stroke={C.ink} strokeWidth={4} />
    <rect x={WIN.x - 36} y={WIN.y + WIN.h + 12} width={WIN.w + 72} height={20} fill={C.rustDark} />
  </g>;
};

export const Wall: React.FC = () => <g>
  <rect x={-700} y={-500} width={2500} height={3200} fill={C.cream} />
  {Array.from({length: 24}, (_, i) => <rect key={i} x={-600 + i * 110} y={-500} width={3} height={3200} fill={C.paperEdge} opacity={0.6} />)}
  <rect x={-700} y={1080} width={2500} height={12} fill={C.rust} opacity={0.0} />
</g>;

export const Sign: React.FC<{x?: number; y?: number; w?: number; h?: number; text?: string; fill?: string; size?: number}> = ({x = 580, y = 772, w = 464, h = 84, text = 'QUIET CARRIAGE', fill = C.green, size = 40}) => <g transform={`translate(${x} ${y})`}>
  <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={12} fill={C.ink} opacity={0.18} transform="translate(8 10)" />
  <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={12} fill={fill} />
  <rect x={-w / 2 + 8} y={-h / 2 + 8} width={w - 16} height={h - 16} rx={8} fill="none" stroke={C.cream} strokeWidth={3} />
  <text y={size * 0.35} textAnchor="middle" fontFamily={JOST} fontWeight={600} fontSize={size} letterSpacing={4} fill={C.cream}>{text}</text>
</g>;

export const SeatBack: React.FC<{x: number}> = ({x}) => <g>
  <rect x={x} y={790} width={250} height={640} rx={46} fill={C.green} />
  <rect x={x + 20} y={810} width={210} height={40} rx={20} fill="#3A5C4D" />
</g>;

export const BenchFront: React.FC = () => <g>
  <rect x={-700} y={1292} width={2600} height={700} fill={C.greenDark} />
  <rect x={-700} y={1292} width={2600} height={10} fill={C.rust} />
</g>;

export const Table: React.FC = () => <g>
  <rect x={560} y={1200} width={44} height={100} fill={C.ink} opacity={0.5} />
  <rect x={300} y={1150} width={620} height={30} rx={6} fill={C.rustDark} />
  <rect x={300} y={1150} width={620} height={9} rx={4} fill={C.rust} />
  <rect x={330} y={1180} width={560} height={22} fill={C.ink} opacity={0.55} />
</g>;

/** Sliding doors, right side of the carriage. open 0..1. */
export const Door: React.FC<{open: number; glow?: number}> = ({open, glow = 1}) => {
  const gap = 78 * open;
  return <g>
    <rect x={1030} y={780} width={190} height={520} fill={C.ink} />
    <rect x={1044} y={794} width={162} height={500} fill={C.lit} opacity={glow} />
    <circle cx={1160} cy={900} r={34} fill={C.orange} opacity={0.5 * glow * open} />
    <rect x={1060} y={1180} width={140} height={110} fill="#E9D7A8" opacity={glow * open} />
    <rect x={1044 - gap} y={794} width={82} height={500} fill={C.green} /><rect x={1044 - gap} y={794} width={82} height={500} fill="none" stroke={C.ink} strokeWidth={4} />
    <rect x={1124 + gap} y={794} width={82} height={500} fill={C.green} /><rect x={1124 + gap} y={794} width={82} height={500} fill="none" stroke={C.ink} strokeWidth={4} />
    <rect x={1070 - gap} y={850} width={30} height={90} rx={8} fill={C.sky} opacity={0.8} /><rect x={1150 + gap} y={850} width={30} height={90} rx={8} fill={C.sky} opacity={0.8} />
  </g>;
};

// ---------------------------------------------------------------------------------------- cast

export type Face = {look: [number, number]; mouth: 'flat' | 'smile' | 'o' | 'grin' | 'wince'; brow: number; rot: number; blush: number; cheek?: number};

/** Head in profile facing right (flip with the parent). */
export const Head: React.FC<{t: number; skin: string; face: Face; hat: 'beanie' | 'hair' | 'cap'; scarf?: boolean}> = ({t, skin, face, hat}) => {
  const blink = (t % 3.9) < 0.12 ? 0.12 : 1;
  const [lx, ly] = face.look;
  const earFill = face.blush > 0 ? `rgb(${Math.round(lerp(237, 232, face.blush))},${Math.round(lerp(183, 70, face.blush))},${Math.round(lerp(143, 50, face.blush))})` : skin;
  const mouth = {
    flat: <path d="M 24 40 Q 36 43 46 39" stroke={C.ink} strokeWidth={4} strokeLinecap="round" fill="none" />,
    smile: <path d="M 22 36 Q 36 52 50 34" stroke={C.ink} strokeWidth={4} strokeLinecap="round" fill="none" />,
    grin: <path d="M 20 34 Q 36 58 52 32 Q 36 40 20 34 Z" fill={C.ink} />,
    o: <ellipse cx={37} cy={42} rx={6} ry={8} fill={C.ink} />,
    wince: <path d="M 22 44 Q 30 36 37 44 Q 44 36 52 42" stroke={C.ink} strokeWidth={4} strokeLinecap="round" fill="none" />,
  }[face.mouth];
  return <g transform={`rotate(${face.rot} -6 66)`}>
    <rect x={-18} y={40} width={42} height={44} fill={skin} />
    <path d="M -50 -20 C -50 -62 -10 -70 24 -56 C 46 -48 50 -30 54 -12 L 72 14 C 74 22 66 26 57 26 L 55 30 C 58 46 46 60 22 64 C -20 72 -52 40 -50 -20 Z" fill={skin} />
    <ellipse cx={-12} cy={10} rx={12} ry={18} fill={earFill} />
    {face.blush > 0.05 && <ellipse cx={-12} cy={10} rx={12} ry={18} fill="#FF5A3A" opacity={0.55 * face.blush} />}
    <circle cx={26} cy={26} r={15} fill="#FF7A6A" opacity={(face.cheek ?? 0) * 0.5} />
    <ellipse cx={30 + lx * 0.7} cy={-2 + ly * 0.55} rx={6.5} ry={8.5 * blink} fill={C.ink} />
    <path d={`M 18 ${-20 - face.brow * 7} L 44 ${-17 - face.brow * 7}`} stroke={C.ink} strokeWidth={4.5} strokeLinecap="round" />
    {mouth}
    {hat === 'beanie' ? <g>
      <path d="M -55 -22 C -58 -84 -10 -96 24 -82 C 48 -72 58 -50 57 -22 Z" fill={C.orange} />
      <path d="M -56 -36 L 58 -36 L 60 -8 L -54 -6 Z" fill={C.orangeDeep} />
      {[-36, -14, 8, 30, 50].map((x) => <path key={x} d={`M ${x} -34 L ${x + 1} -8`} stroke={C.orange} strokeWidth={4} />)}
      <circle cx={0} cy={-96} r={17} fill="#FFA965" />
    </g> : hat === 'cap' ? <g>
      <path d="M -54 -20 C -58 -80 -6 -92 28 -76 C 48 -66 56 -46 56 -22 Z" fill="#5C6670" />
      <path d="M 24 -40 C 56 -42 84 -34 92 -22 L 56 -20 Z" fill="#434B53" />
      <rect x={-56} y={-26} width={112} height={8} rx={4} fill="#434B53" />
    </g> : <g>
      <path d="M -54 -2 C -70 -76 0 -98 40 -70 C 56 -58 58 -42 55 -30 C 34 -50 6 -42 -4 -20 C -6 8 -4 36 -16 66 C -52 78 -66 30 -54 -2 Z" fill={C.hair} />
    </g>}
  </g>;
};

export const Torso: React.FC<{coat: string}> = ({coat}) => <path d="M -70 62 L 50 62 C 96 70 122 112 128 176 L 132 560 L -122 560 L -112 124 C -108 92 -96 72 -70 62 Z" fill={coat} />;

export const Him: React.FC<{t: number; face: Face; x?: number; y?: number}> = ({t, face, x = 275, y = 840}) => <g transform={`translate(${x} ${y})`}>
  <Torso coat={C.rust} />
  <path d="M -40 62 L 36 62 L 22 96 L -10 80 Z" fill={C.rustDark} opacity={0.5} />
  <Head t={t} skin={C.skinHim} face={face} hat="beanie" />
</g>;

export const Her: React.FC<{t: number; face: Face; x?: number; y?: number; flutter?: number}> = ({t, face, x = 885, y = 840, flutter = 0}) => <g transform={`translate(${x} ${y}) scale(-1 1)`}>
  <Torso coat={C.coatHer} />
  <Head t={t} skin={C.skinHer} face={face} hat="hair" />
  {/* mustard scarf: wrap + tails, the only mustard in the show */}
  <path d="M -34 56 C -10 82 40 80 62 56 L 70 84 C 40 110 -20 112 -44 90 Z" fill={C.mustard} />
  <path d={`M 26 96 L 74 98 L ${84 + flutter * 14} 190 L ${40 + flutter * 10} 196 Z`} fill={C.mustard} />
  <path d={`M 34 120 L 74 122`} stroke="#C58E1B" strokeWidth={5} />
  <path d={`M 40 150 L 80 152`} stroke="#C58E1B" strokeWidth={5} />
</g>;

/** Two-segment arm to a hand; the elbow bends downward. */
const armPts = (s: [number, number], h: [number, number], l1 = 215, l2 = 215, flip = false): [number, number][] => {
  const dx = h[0] - s[0], dy = h[1] - s[1];
  const d = Math.min(Math.hypot(dx, dy), l1 + l2 - 2) || 1;
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d), hh = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const ux = dx / Math.hypot(dx, dy || 1e-6), uy = dy / Math.hypot(dx, dy || 1e-6);
  let nx = -uy, ny = ux; if (ny < 0) { nx = -nx; ny = -ny; }
  if (flip) { nx = -nx; ny = -ny; }
  return [s, [s[0] + ux * a + nx * hh, s[1] + uy * a + ny * hh], [s[0] + ux * d, s[1] + uy * d]];
};

export const Arm: React.FC<{shoulder: [number, number]; hand: [number, number]; coat: string; skin: string; lens?: number; flip?: boolean}> = ({shoulder, hand, coat, skin, lens = 215, flip = false}) => {
  const [s, e, h] = armPts(shoulder, hand, lens, lens, flip);
  return <g>
    <path d={`M ${s[0]} ${s[1]} L ${e[0]} ${e[1]} L ${h[0]} ${h[1]}`} stroke={coat} strokeWidth={52} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <circle cx={h[0]} cy={h[1]} r={27} fill={skin} />
  </g>;
};

/** A clearly-a-pen ballpoint: fat barrel, clip, cap end, small tip. Tip at (0,0), leaning toward `dir`. */
export const Pen: React.FC<{x: number; y: number; dir: 1 | -1}> = ({x, y, dir}) => <g transform={`translate(${x} ${y}) scale(${dir} 1) rotate(58)`}>
  <path d="M 0 0 L 16 -7 L 16 7 Z" fill={C.ink} />
  <rect x={16} y={-9} width={70} height={18} rx={6} fill={C.cream} stroke={C.ink} strokeWidth={3} />
  <rect x={86} y={-10} width={34} height={20} rx={8} fill={C.rust} />
  <rect x={64} y={-15} width={50} height={5} rx={2.5} fill={C.ink} />
</g>;

/** A generic phone: dark body, a profile-card screen. No app UI, no logos. */
export const Phone: React.FC<{t: number; shake?: number; swipe?: number; hearts?: number[]; thumb?: boolean; faceDown?: boolean}> = ({t, shake = 0, swipe = 0, hearts = [], thumb = true, faceDown = false}) => {
  const sx = shake ? Math.sin(t * 150) * 4 * shake : 0;
  if (faceDown) return <g transform={`translate(${sx} 0)`}>
    <rect x={-38} y={-66} width={76} height={132} rx={14} fill="#2B2F2D" /><circle cx={0} cy={-34} r={9} fill="#3C413F" />
  </g>;
  const cardX = swipe * 70;
  return <g transform={`translate(${sx} 0)`}>
    <rect x={-40} y={-69} width={80} height={138} rx={15} fill={C.ink} />
    <clipPath id="scr"><rect x={-34} y={-62} width={68} height={124} rx={10} /></clipPath>
    <rect x={-34} y={-62} width={68} height={124} rx={10} fill={C.sky} />
    <g clipPath="url(#scr)">
      <g transform={`translate(${cardX} ${Math.abs(swipe) * 4}) rotate(${swipe * 12} 0 50)`} opacity={1 - clamp(Math.abs(swipe) - 0.7, 0, 1) * 2}>
        <rect x={-27} y={-52} width={54} height={80} rx={8} fill={C.cream} />
        <circle cx={0} cy={-26} r={13} fill={C.rust} /><path d="M -22 24 C -22 -2 22 -2 22 24 Z" fill={C.rust} />
        <rect x={-18} y={30 - 6} width={36} height={4} rx={2} fill={C.ink} opacity={0.4} />
      </g>
      <circle cx={-16} cy={46} r={9} fill="none" stroke={C.ink} strokeWidth={3} /><circle cx={16} cy={46} r={9} fill={C.rust} />
    </g>
    {thumb && <g transform={`translate(${12 + swipe * 26} ${24 + Math.abs(swipe) * -4}) rotate(${-14 + swipe * 8})`}>
      <rect x={-16} y={-8} width={32} height={78} rx={16} fill={C.skinHim} /><rect x={-9} y={-2} width={14} height={9} rx={4} fill="#F7D3B8" />
    </g>}
    {hearts.map((age, i) => age > 0 && age < 1 && <g key={i} transform={`translate(${24 + i * 6} ${-60 - age * 90}) scale(${0.6 + age * 0.9})`} opacity={1 - age * age}>
      <path d="M 0 10 C -26 -8 -14 -28 0 -14 C 14 -28 26 -8 0 10 Z" fill={C.rust} />
    </g>)}
  </g>;
};

// ---------------------------------------------------------------------------------------- paper

export const PW = 520, PH = 250;
export type SheetSpec = {
  text: string; n: number; groups?: number[]; by: 'her' | 'him';
  reveal?: [number, number];                // text writes in over these times
  letters?: {s: string; from: number; step: number; ink: string};
  scribble?: [number, number]; underline?: [number, number];
  highlight?: number;
  size?: number;                            // clue font size (default 42); text may hold "|" for a line break
  wobble?: boolean;                         // his letters get shakier and more uneven, letter by letter
  stain?: {at: number; x: number; y: number};   // a coffee puddle that spreads from `at` (driven by t, so it can run backwards)
  row2?: {n: number; s: string; boxesFrom: number; from: number; step: number; ink: string; bw?: number; y?: number};
  handwrite?: boolean;                      // letters are written on with a left-to-right wipe
  extra?: number;                           // extra card height below the box row  // a second row of boxes, right-aligned
};
const BOX = 50, GAP = 6;
export const boxX = (n: number, i: number, groups?: number[]) => {
  const extra = groups ? 14 : 0;
  const total = n * BOX + (n - 1) * GAP + extra;
  let x = -total / 2 + BOX / 2 + i * (BOX + GAP);
  if (groups && i >= groups[0]) x += extra;
  return x;
};
export const textW = (s: string) => s.length * 19.2;
const SCRIB = (n: number) => {
  const pts: [number, number][] = [];
  const rows = 2;
  for (let i = 0; i <= rows * 2; i++) pts.push([i % 2 ? 215 : -215, -75 + (i / (rows * 2)) * 125 + (i % 2 ? 10 : -10)]);
  return pts;
};
export const scribblePos = (u: number): [number, number] => {
  const pts = SCRIB(0), f = clamp(u) * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(f)), k = f - i;
  return [lerp(pts[i][0], pts[i + 1][0], k), lerp(pts[i][1], pts[i + 1][1], k)];
};

export const Paper: React.FC<{t: number; s: SheetSpec; id: string}> = ({t, s, id}) => {
  const rv = s.reveal ? clamp((t - s.reveal[0]) / (s.reveal[1] - s.reveal[0])) : 1;
  const fs = s.size ?? 42;
  const tLines = s.text.split('|');
  const tw = Math.max(...tLines.map(textW)) * fs / 42 * (s.size ? 1.1 : 1);
  const scr = s.scribble ? clamp((t - s.scribble[0]) / (s.scribble[1] - s.scribble[0])) : 0;
  const und = s.underline ? clamp((t - s.underline[0]) / (s.underline[1] - s.underline[0])) : 0;
  const pts = SCRIB(0);
  const sd = pts.map((p, i) => `${i ? 'L' : 'M'} ${p[0]} ${p[1]}`).join(' ');
  const textInk = s.by === 'her' ? C.ink : C.rust;
  return <g>
    <rect x={-PW / 2} y={-PH / 2} width={PW} height={PH + (s.extra ?? 0)} rx={10} fill={C.paper} stroke={C.paperEdge} strokeWidth={4} />
    <rect x={-PW / 2 + 16} y={-PH / 2 + 14} width={70} height={8} rx={4} fill={C.rust} opacity={0.8} />
    <rect x={-PW / 2 + 94} y={-PH / 2 + 14} width={30} height={8} rx={4} fill={C.green} opacity={0.8} />
    <clipPath id={`rv${id}`}><rect x={-tw / 2 - 4} y={tLines.length > 1 ? -122 : -110} width={(tw + 8) * rv} height={tLines.length > 1 ? 100 : 80} /></clipPath>
    {tLines.length === 1
      ? <text y={-50} textAnchor="middle" fontFamily={JOST} fontWeight={s.size ? 600 : 500} fontSize={fs} fill={textInk} clipPath={`url(#rv${id})`}>{s.text}</text>
      : tLines.map((l, i) => <text key={i} y={-84 + i * 50} textAnchor="middle" fontFamily={JOST} fontWeight={600} fontSize={fs} fill={textInk} clipPath={`url(#rv${id})`}>{l}</text>)}
    <g opacity={s.reveal ? clamp((t - s.reveal[1]) / 0.2) : 1}>{Array.from({length: s.n}, (_, i) => {
      const x = boxX(s.n, i, s.groups);
      const active = s.highlight === i;
      return <rect key={i} x={x - BOX / 2} y={30 - BOX / 2 - 4} width={BOX} height={BOX} rx={4} fill={C.paper} stroke={active ? C.orange : C.ink} strokeWidth={active ? 5 : 3.5} />;
    })}</g>
    {s.letters && s.letters.s.split('').map((ch, i) => {
      const a = (t - (s.letters!.from + i * s.letters!.step)) / 0.18;
      if (a <= 0) return null;
      const k = clamp(a);
      if (s.wobble) {
        const w = 0.7 + i * 0.5, j = ((i * 7) % 5) - 2, j2 = ((i * 3) % 4) - 1.5;
        const cl = (v: number, m: number) => Math.max(-m, Math.min(m, v));
        return <text key={i} x={boxX(s.n, i, s.groups) + cl(j2 * w * 0.8, 3)} y={46 + cl(j * w * 0.8, 3)} textAnchor="middle" fontFamily={PEN} fontWeight={700} fontSize={54 + cl(j2 * w * 1.6, 6)} fill={s.letters!.ink}
          transform={`translate(0 ${(1 - k) * -4}) rotate(${cl(j * w * 1.3, 8)} ${boxX(s.n, i, s.groups)} 30)`} opacity={k}>{ch}</text>;
      }
      if (s.handwrite) {
        const bx = boxX(s.n, i, s.groups), kk = clamp((t - (s.letters!.from + i * s.letters!.step)) / Math.min(0.24, s.letters!.step * 0.95));
        return <g key={i}><clipPath id={`hw${id}${i}`}><rect x={bx - 30} y={-12} width={60 * kk} height={80} /></clipPath>
          <g clipPath={`url(#hw${id}${i})`}><text x={bx} y={46} textAnchor="middle" fontFamily={PEN} fontWeight={700} fontSize={56} fill={s.letters!.ink} transform={`rotate(${(i % 3 - 1) * 2.5} ${bx} 30)`}>{ch}</text></g></g>;
      }
      return <text key={i} x={boxX(s.n, i, s.groups)} y={46} textAnchor="middle" fontFamily={PEN} fontWeight={700} fontSize={56} fill={s.letters!.ink}
        transform={`translate(0 ${(1 - k) * -10}) rotate(${(i % 3 - 1) * 2.5} ${boxX(s.n, i, s.groups)} 30)`} opacity={k}>{ch}</text>;
    })}
    {s.row2 && (() => {
      const r = s.row2, bw = r.bw ?? 42, y0 = r.y ?? 76, left = 197 - (r.n * bw + (r.n - 1) * 6), f = bw / 42;
      const cx = (i: number) => left + bw / 2 + i * (bw + 6);
      return <g>
        <text x={left - 14} y={y0 + bw * 0.86} textAnchor="end" fontFamily={JOST} fontWeight={500} fontSize={32 * f} fill={C.ink} opacity={clamp((t - r.boxesFrom) / 0.2) * 0.8}>({r.n})</text>
        {Array.from({length: r.n}, (_, i) => <rect key={i} x={cx(i) - bw / 2} y={y0} width={bw} height={bw} rx={4} fill={C.paper} stroke={C.ink} strokeWidth={3.2} opacity={clamp((t - r.boxesFrom - i * 0.06) / 0.1)} />)}
        {r.s.split('').map((ch, i) => {
          const k = clamp((t - (r.from + i * r.step)) / 0.18);
          return k > 0 ? <text key={i} x={cx(i)} y={y0 + bw * 0.81} textAnchor="middle" fontFamily={PEN} fontWeight={700} fontSize={50 * f} fill={r.ink} transform={`translate(0 ${(1 - k) * -8})`} opacity={k}>{ch}</text> : null;
        })}
      </g>;
    })()}
    {s.stain && (() => {
      const k = clamp((t - s.stain.at) / 0.9);
      if (k <= 0) return null;
      const r = Math.pow(k, 0.55), tail = clamp((k - 0.5) * 2);
      return <g transform={`translate(${s.stain.x} ${s.stain.y})`}>
        <g transform={`scale(${r} ${r * 0.72})`} opacity={0.93}>
          <path d="M -112 -8 C -122 -62 -40 -84 10 -64 C 62 -84 122 -42 100 0 C 128 42 70 80 20 68 C -20 92 -100 72 -96 32 C -122 20 -120 6 -112 -8 Z" fill="#4A2A18" />
          <path d="M -80 -6 C -78 -40 -20 -52 14 -38 C 50 -50 84 -24 72 4 C 86 30 40 52 8 42 C -26 58 -76 44 -70 22 C -88 14 -86 4 -80 -6 Z" fill="#6E4329" />
        </g>
        <path d={`M -34 30 C -32 ${42 + tail * 6} -28 ${50 + tail * 8} -28 ${54 + tail * 10} L -10 ${54 + tail * 10} C -8 ${48 + tail * 6} -6 44 0 36 Z`} fill="#4A2A18" opacity={0.93 * tail} />
      </g>;
    })()}
    {und > 0 && <path d={`M ${boxX(s.n, 0, s.groups) - 28} 70 Q -100 84 0 70 T ${boxX(s.n, s.n - 1, s.groups) + 28} 70`} stroke={C.rust} strokeWidth={7} strokeLinecap="round" fill="none"
      strokeDasharray={1} pathLength={1} strokeDashoffset={1 - und} />}
    {scr > 0 && <path d={sd} stroke={C.ink} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" fill="none" strokeDasharray={1} pathLength={1} strokeDashoffset={1 - scr} />}
  </g>;
};

// ---------------------------------------------------------------------------------------- strips

const wrap = (text: string, max: number) => {
  const sep = text.includes(' · ') ? ' · ' : ' ';
  const words = text.split(sep), lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if (cur && (cur + sep + w).length > max) { lines.push(cur); cur = w; } else cur = cur ? cur + sep + w : w;
  }
  if (cur) lines.push(cur);
  return lines;
};

/** A ticket-style strip in screen space. `age` is seconds since it appeared (stamp pop); `out` 0..1 fade. */
export const Strip: React.FC<{text: string; y: number; age: number; out: number; size?: number; rot?: number; hue?: 'ink' | 'orange' | 'cream'; maxW?: number; outline?: boolean}> = ({text, y, age, out, size = 60, rot = 0, hue = 'ink', maxW = 960, outline = false}) => {
  const f = 0.43;
  const max = Math.floor((maxW - 90) / (size * f));
  const lines = wrap(text, max);
  const lh = size * 1.12;
  const w = Math.min(maxW + 20, Math.max(...lines.map((l) => l.length)) * size * f + 90);
  const h = lines.length * lh + 30;
  const pop = age < 0.16 ? 1 + 0.22 * (1 - age / 0.16) : 1;
  const bg = hue === 'cream' ? C.cream : hue === 'orange' ? C.orange : C.ink;
  const fg = hue === 'ink' ? C.cream : C.ink;
  const top = y - size * 0.62 - 6;
  return <g opacity={clamp(1 - out) * clamp(age / 0.05 + 0.2)} transform={`translate(540 ${top + h / 2}) rotate(${rot}) scale(${pop}) translate(-540 ${-(top + h / 2)})`}>
    <rect x={540 - w / 2 + 9} y={top + 11} width={w} height={h} rx={14} fill={C.rust} />
    <rect x={540 - w / 2} y={top} width={w} height={h} rx={14} fill={bg} stroke={outline ? C.cream : C.ink} strokeWidth={outline ? 5 : hue === 'ink' ? 0 : 4} />
    <rect x={540 - w / 2} y={top} width={14} height={h} rx={7} fill={C.orange} />
    {lines.map((l, i) => <text key={i} x={540 + 6} y={top + 15 + size * 0.86 + i * lh} textAnchor="middle" fontFamily={STRIPF} fontWeight={700} fontSize={size} letterSpacing={0.8} fill={fg}>{l}</text>)}
  </g>;
};

// ---------------------------------------------------------------------------------------- train transition

const Passenger: React.FC<{x: number; y: number; kind: number}> = ({x, y, kind}) => <g transform={`translate(${x} ${y})`} fill="#3A2A22">
  <path d="M -62 120 C -62 20 62 20 62 120 Z" /><circle cx={0} cy={-6} r={36} />
  {kind === 0 && <path d="M -38 -14 C -40 -64 40 -64 38 -14 Z" fill={C.rust} />}
  {kind === 1 && <path d="M -36 -10 C -40 -52 30 -62 40 -20 C 20 -30 -10 -26 -36 -10 Z" fill="#1B1E1C" />}
</g>;

const TrainCar: React.FC<{x: number; seed: number}> = ({x, seed}) => <g transform={`translate(${x} 0)`}>
  <rect x={0} y={0} width={560} height={1920} fill="#3E6252" />
  <rect x={0} y={0} width={560} height={400} fill="#4A7461" />
  <rect x={0} y={400} width={560} height={14} fill={C.orange} />
  <rect x={0} y={1280} width={560} height={30} fill={C.cream} />
  <rect x={0} y={1310} width={560} height={26} fill={C.rust} />
  <rect x={0} y={1336} width={560} height={600} fill="#2B473B" />
  {[0, 1].map((k) => {
    const wx = 28 + k * 262, kind = (seed + k * 2) % 3;
    return <g key={k}>
      <rect x={wx} y={470} width={244} height={760} rx={30} fill="#FFC77A" />
      <rect x={wx} y={470} width={244} height={300} rx={30} fill="#FFE7B0" />
      <rect x={wx + 8} y={900} width={228} height={330} rx={16} fill="#B5452B" />
      <rect x={wx + 18} y={910} width={208} height={40} rx={14} fill="#C95A3B" />
      <Passenger x={wx + 122} y={780} kind={kind} />
      <rect x={wx - 8} y={462} width={260} height={776} rx={36} fill="none" stroke="#1B1E1C" strokeWidth={10} opacity={0.8} />
    </g>;
  })}
  <rect x={546} y={0} width={14} height={1920} fill="#16231D" />
  {Array.from({length: 7}, (_, i) => <circle key={i} cx={20 + i * 86} cy={1380} r={7} fill="#1B1E1C" opacity={0.5} />)}
</g>;

/** The opposite train sweeping through: its lit, warm windows are the cut. Cuts happen at t0 + 0.37. */
export const PassingTrain: React.FC<{t: number; t0: number; dir?: 1 | -1}> = ({t, t0, dir = 1}) => {
  const L = 2800, v = 5000, a = t - t0;
  if (a < 0 || a > 0.8) return null;
  const fx = dir === 1 ? 1080 - v * a : -L + v * a;
  const cars = Math.ceil(L / 560);
  return <g>
    <rect x={fx} y={-50} width={L} height={2100} fill="#2B473B" />
    {Array.from({length: cars}, (_, i) => <TrainCar key={i} x={fx + i * 560} seed={i + Math.round(t0)} />)}
  </g>;
};
export const TRAIN_CUT = 0.37;

// ---------------------------------------------------------------------------------------- vote

export const VoteCard: React.FC<{k: 'A' | 'B'; word: string; len: string; y: number; age: number; tint: string; pulse?: number; sub?: string; subX?: number; subSize?: number}> = ({k, word, len, y, age, tint, pulse = 0, sub, subX = 530, subSize = 56}) => {
  if (age <= 0) return null;
  const pop = age < 0.25 ? 1 + 0.16 * (1 - age / 0.25) : 1;
  const slide = (1 - clamp(age / 0.3)) * 120;
  const sc = pop * (1 + pulse * 0.05);
  return <g transform={`translate(0 ${slide}) translate(540 ${y + 130}) scale(${sc}) translate(-540 ${-(y + 130)})`} opacity={clamp(age / 0.12)}>
    <rect x={69} y={y + 12} width={950} height={270} rx={22} fill={tint} />
    <rect x={60} y={y} width={950} height={270} rx={22} fill={C.paper} stroke={C.ink} strokeWidth={5} />
    <circle cx={140} cy={y + 80} r={56} fill={tint} stroke={C.ink} strokeWidth={5} />
    <text x={140} y={y + 106} textAnchor="middle" fontFamily={STRIPF} fontWeight={800} fontSize={84} fill={C.cream}>{k}</text>
    <text x={230} y={y + 90} fontFamily={STRIPF} fontWeight={800} fontSize={100} letterSpacing={3} fill={C.ink}>{word}</text>
    {sub
      ? (() => { const w = sub.split(' '), h = Math.ceil(w.length / 2), ls = w.length > 3 ? [w.slice(0, h).join(' '), w.slice(h).join(' ')] : [sub];
        return <g>{ls.map((l, i) => <text key={i} x={subX} y={y + (ls.length > 1 ? 52 : 86) + i * 58} fontFamily={JOST} fontWeight={600} fontSize={subSize} fill={tint}>{l}</text>)}</g>; })()
      : <text x={920} y={y + 90} textAnchor="end" fontFamily={JOST} fontWeight={500} fontSize={56} fill={C.ink}>{len}</text>}
    {word.split('').map((ch, i) => {
      const bx = 230 + i * 100;
      return <g key={i}>
        <rect x={bx} y={y + 128} width={88} height={102} rx={6} fill={C.paper} stroke={C.ink} strokeWidth={4} />
        <text x={bx + 44} y={y + 208} textAnchor="middle" fontFamily={PEN} fontWeight={700} fontSize={84} fill={tint}
          transform={`rotate(${(i % 3 - 1) * 2.5} ${bx + 44} ${y + 180})`}>{ch}</text>
      </g>;
    })}
  </g>;
};

/** Sky-coloured backdrop with a sun and hills for the vote and the end card. */
export const PosterBg: React.FC<{dark?: boolean; t: number}> = ({dark, t}) => <g>
  <rect x={-20} y={-20} width={1120} height={1960} fill={dark ? C.green : C.sky} />
  <g transform={`translate(540 1180) rotate(${t * 3})`} opacity={dark ? 0.16 : 0.2}>
    {Array.from({length: 18}, (_, i) => <path key={i} d="M 0 0 L -34 -1500 L 34 -1500 Z" transform={`rotate(${i * 20})`} fill={C.orange} />)}
  </g>
  <circle cx={540} cy={1180} r={230} fill={C.orange} />
  <path d={hillPath(110, 1330, 1000, 0.3)} fill={dark ? '#3C5F50' : '#9CBBA9'} transform="translate(-200 0)" />
  <path d={hillPath(80, 1400, 800, 1.7)} fill={dark ? C.greenDark : '#6F9A84'} transform="translate(-100 0)" />
</g>;

export const smoothT = smooth;

export const Booklet: React.FC<{x: number; y: number}> = ({x, y}) => <g transform={`translate(${x} ${y}) rotate(-6)`}>
  <rect x={-46} y={-58} width={92} height={116} rx={5} fill={C.ink} opacity={0.2} transform="translate(5 6)" />
  <rect x={-46} y={-58} width={92} height={116} rx={5} fill={C.paper} stroke={C.ink} strokeWidth={3} />
  <rect x={-46} y={-58} width={12} height={116} rx={4} fill={C.orange} />
  {[0, 1, 2, 3].map((r) => [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={-24 + c * 22} y={-40 + r * 22} width={20} height={20} fill={(r + c) % 2 ? C.ink : C.paper} stroke={C.ink} strokeWidth={2} />))}
</g>;

/** A paper takeaway coffee cup, base centre at (0,0), upright; a lid, a sleeve and steam so it reads as coffee. */
export const Cup: React.FC<{x: number; y: number; rot?: number; steam?: number; t?: number}> = ({x, y, rot = 0, steam = 1, t = 0}) => <g transform={`translate(${x} ${y}) rotate(${rot})`}>
  <path d="M -30 -100 L 30 -100 L 25 0 L -25 0 Z" fill={C.paper} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
  <path d="M -27.5 -78 L 27.5 -78 L 25.6 -28 L -25.6 -28 Z" fill={C.rust} stroke={C.ink} strokeWidth={3} />
  <rect x={-18} y={-62} width={36} height={6} rx={3} fill={C.cream} /><rect x={-17} y={-48} width={34} height={6} rx={3} fill={C.cream} />
  <rect x={-35} y={-116} width={70} height={18} rx={7} fill="#3A2A22" stroke={C.ink} strokeWidth={3} />
  <path d="M -22 -116 L -18 -128 L 18 -128 L 22 -116 Z" fill="#4B372D" stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
  <rect x={-8} y={-124} width={16} height={4} rx={2} fill={C.ink} />
  {steam > 0.01 && [-12, 10].map((dx, i) => <path key={i} d={`M ${dx} -136 C ${dx - 14} -156 ${dx + 14} -170 ${dx} -192`} stroke={C.ink} strokeWidth={5} strokeLinecap="round" fill="none" opacity={0.45 * steam}
    transform={`translate(${Math.sin(t * 3 + i * 2) * 4} ${-((t * 30 + i * 14) % 18)})`} />)}
</g>;
