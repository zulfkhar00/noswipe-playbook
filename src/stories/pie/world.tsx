import React from 'react';
import {clamp, lerp, smooth} from '../../lib/motion';
import {OPEN} from '../../lib/fonts';
import {textW, mixc} from '../whites/world';

export {camAt, planeT, textW} from '../whites/world';
export type {Cam, CamKey} from '../whites/world';

// PIE FOR TWO (season 11): a night diner. Flat vector, thick espresso outlines, diagonal gloss streaks on chrome and glass.
// Far plane: night window (red neon OPEN, paper turkey), booths, checker floor. Mid plane: figures behind a mint formica
// counter with a lit pie case, napkin dispenser, mugs, crayon cup. Near plane: blurred sugar shaker + coffee steam.
// Strips are printed guest-check slips (Courier Prime 700); napkin lines are crayon (Patrick Hand 700). Transition: slice wipe.

export const C = {
  ink: '#2A1810', teal: '#0F3B3A', tealLite: '#1B5A55', mint: '#A9DCCB', mintDeep: '#7FBFAB', pumpkin: '#F2861E', cran: '#B5233F', custard: '#FFE7A8',
  chrome: '#DDE6E9', napkin: '#FFFDF6', skinHim: '#F0B48A', skinHer: '#C98A62', hairHim: '#4B2A1B', hairHer: '#34190F', rust: '#B8501F', rustDeep: '#8E3A14',
  gold: '#E8B33A', pink: '#F7A8C4', glow: '#BDEBFF', crust: '#E3A659', crustDeep: '#B5762F', pie: '#EE8A1E', cream: '#FFF6E6', navy: '#0B1F2E', warm: '#FFD58A',
  mintUni: '#8ED1BB', flush: '#F26B5C',
};
export const COUR = OPEN.typewriter;
export const HAND = OPEN.handPrint;
export const ANTON = OPEN.poster;
export const MARKER = OPEN.marker;
export const SW = 8;

export const Defs: React.FC = () => <defs>
  <filter id="blurNear" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="11" /></filter>
  <filter id="blurSoft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="16" /></filter>
  <filter id="blurSh" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="9" /></filter>
  <filter id="blurGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14" /></filter>
  <filter id="rough" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="2" seed="3" result="n" /><feDisplacementMap in="SourceGraphic" in2="n" scale="4" /></filter>
  <radialGradient id="haloCool"><stop offset="0" stopColor="#CFF3FF" stopOpacity={0.8} /><stop offset="0.45" stopColor={C.glow} stopOpacity={0.35} /><stop offset="1" stopColor={C.glow} stopOpacity={0} /></radialGradient>
  <radialGradient id="haloWarm"><stop offset="0" stopColor="#FFE9B0" stopOpacity={0.9} /><stop offset="0.5" stopColor={C.warm} stopOpacity={0.4} /><stop offset="1" stopColor={C.warm} stopOpacity={0} /></radialGradient>
  <radialGradient id="haloWhite"><stop offset="0" stopColor="#FFFFFF" stopOpacity={0.95} /><stop offset="0.55" stopColor="#FFFDF0" stopOpacity={0.5} /><stop offset="1" stopColor="#FFFDF0" stopOpacity={0} /></radialGradient>
  <linearGradient id="scr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#CFF4FF" /><stop offset="1" stopColor="#4FB7F0" /></linearGradient>
  <linearGradient id="glassNight" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#081826" /><stop offset="1" stopColor="#12384A" /></linearGradient>
  <linearGradient id="caseGlow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFD98F" /><stop offset="1" stopColor="#FFB45E" /></linearGradient>
  <linearGradient id="counterTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8FCDB8" /><stop offset="1" stopColor="#B9E6D6" /></linearGradient>
  <linearGradient id="chromeG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#B8C6CB" /><stop offset="0.35" stopColor="#F4FAFB" /><stop offset="0.65" stopColor="#C9D6DA" /><stop offset="1" stopColor="#9BAEB4" /></linearGradient>
  <linearGradient id="floorFade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C.navy} stopOpacity={0.55} /><stop offset="1" stopColor={C.navy} stopOpacity={0} /></linearGradient>
</defs>;

/** Diagonal gloss streaks inside a rect (clipped). */
export const Gloss: React.FC<{x: number; y: number; w: number; h: number; a?: number; id: string; r?: number}> = ({x, y, w, h, a = 0.5, id, r = 0}) => <g>
  <clipPath id={`gl${id}`}><rect x={x} y={y} width={w} height={h} rx={r} /></clipPath>
  <g clipPath={`url(#gl${id})`} fill="#fff">
    <polygon points={`${x + w * 0.22},${y} ${x + w * 0.42},${y} ${x + w * 0.42 - h * 0.45},${y + h} ${x + w * 0.22 - h * 0.45},${y + h}`} opacity={a} />
    <polygon points={`${x + w * 0.5},${y} ${x + w * 0.58},${y} ${x + w * 0.58 - h * 0.45},${y + h} ${x + w * 0.5 - h * 0.45},${y + h}`} opacity={a * 0.6} />
  </g>
</g>;

// ---------------------------------------------------------------------------------------- far plane
const Turkey: React.FC = () => <g transform="translate(0 0)">
  {[-60, -30, 0, 30, 60].map((a, i) => <g key={i} transform={`rotate(${a} 0 20)`}>
    <rect x={-16} y={-92} width={32} height={94} rx={16} fill={[C.cran, C.pumpkin, C.custard, C.pumpkin, C.cran][i]} stroke={C.ink} strokeWidth={5} />
  </g>)}
  <ellipse cx={0} cy={40} rx={46} ry={54} fill="#9A5A2C" stroke={C.ink} strokeWidth={5} />
  <circle cx={-14} cy={26} r={8} fill="#fff" stroke={C.ink} strokeWidth={3} /><circle cx={14} cy={26} r={8} fill="#fff" stroke={C.ink} strokeWidth={3} />
  <circle cx={-14} cy={27} r={3.5} fill={C.ink} /><circle cx={14} cy={27} r={3.5} fill={C.ink} />
  <polygon points="0,34 -8,48 8,48" fill={C.pumpkin} stroke={C.ink} strokeWidth={3} /><path d="M 4 50 Q 10 70 0 72" fill="none" stroke={C.cran} strokeWidth={6} strokeLinecap="round" />
  <rect x={-60} y={-100} width={40} height={16} fill="#EFE3B8" opacity={0.8} transform="rotate(-20)" /><rect x={20} y={-100} width={40} height={16} fill="#EFE3B8" opacity={0.8} transform="rotate(18)" />
</g>;

export const Far: React.FC<{t: number}> = ({t}) => {
  const flick = 0.82 + 0.18 * Math.sin(t * 31) * Math.sin(t * 7.3) + (Math.sin(t * 1.9) > 0.985 ? -0.3 : 0);
  return <g>
    <rect x={-200} y={-200} width={1480} height={1300} fill={C.teal} />
    {/* wall tiles */}
    {Array.from({length: 14}, (_, i) => <rect key={i} x={i * 90 - 20} y={560} width={86} height={330} fill={i % 2 ? '#134745' : C.tealLite} opacity={0.5} />)}
    {/* window */}
    <rect x={40} y={90} width={1000} height={470} rx={30} fill={C.chrome} stroke={C.ink} strokeWidth={SW} />
    <rect x={64} y={114} width={952} height={422} rx={18} fill="url(#glassNight)" stroke={C.ink} strokeWidth={6} />
    {[[150, 400, 26, '#FFC46B'], [300, 360, 18, '#FF8E6B'], [450, 420, 22, '#FFE9B0'], [640, 380, 16, '#9FE3FF'], [940, 350, 24, '#FFC46B'], [980, 450, 14, '#FF8E6B'], [560, 480, 12, '#FFE9B0']].map(([x, y, r, c], i) =>
      <circle key={i} cx={x as number} cy={y as number} r={r as number} fill={c as string} opacity={0.5} filter="url(#blurSh)" />)}
    <rect x={64} y={440} width={952} height={96} fill="#0A1822" opacity={0.65} />
    <g transform="translate(905 215) rotate(8) scale(0.56)"><Turkey /></g>
    <line x1={540} y1={114} x2={540} y2={536} stroke={C.ink} strokeWidth={10} /><line x1={540} y1={114} x2={540} y2={536} stroke={C.chrome} strokeWidth={3} />
    <Gloss x={64} y={114} w={952} h={422} a={0.14} id="win" r={18} />
    {/* neon OPEN */}
    <g transform="translate(190 548)" opacity={flick}>
      <text x={0} y={0} textAnchor="middle" fontFamily={ANTON} fontSize={78} fill="#FF3B4E" opacity={0.7} filter="url(#blurGlow)" stroke="#FF3B4E" strokeWidth={10}>OPEN</text>
      <text x={0} y={0} textAnchor="middle" fontFamily={ANTON} fontSize={78} fill="none" stroke="#FF3B4E" strokeWidth={9} strokeLinejoin="round">OPEN</text>
      <text x={0} y={0} textAnchor="middle" fontFamily={ANTON} fontSize={78} fill="none" stroke="#FFD9D6" strokeWidth={3} strokeLinejoin="round">OPEN</text>
    </g>
    {/* booths */}
    {[40, 1040].map((x, i) => <g key={i} transform={`translate(${x} 0)`}>
      <rect x={-120} y={640} width={240} height={260} rx={50} fill={C.cran} stroke={C.ink} strokeWidth={SW} />
      {[0, 1, 2].map((k) => <circle key={k} cx={-50 + k * 50} cy={720} r={9} fill="#7B1228" stroke={C.ink} strokeWidth={4} />)}
    </g>)}
    {/* checker floor */}
    <rect x={-200} y={880} width={1480} height={160} fill={C.cream} stroke={C.ink} strokeWidth={SW} />
    {Array.from({length: 2}, (_, r) => Array.from({length: 22}, (_, i) => (i + r) % 2 === 0 && <rect key={`${r}-${i}`} x={-130 + i * 70} y={885 + r * 76} width={70} height={76} fill="#26504D" opacity={0.85} />))}
    <rect x={-200} y={880} width={1480} height={160} fill="url(#floorFade)" />
  </g>;
};

// ---------------------------------------------------------------------------------------- pie + plate
/** Pie slice seen from the side: pointy end at (0,0), crust at the right. dollop: 0 gone, 1 full. */
export const Slice: React.FC<{x: number; y: number; s?: number; dollop?: number; wob?: number; rot?: number; id?: string}> = ({x, y, s = 1, dollop = 1, wob = 0, rot = 0, id = 's'}) => <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
  <path d="M 0 0 L 200 -78 L 216 -78 Q 230 -78 230 -64 L 230 0 Q 230 10 220 10 L 12 10 Q 0 10 0 0 Z" fill={C.pie} stroke={C.ink} strokeWidth={SW} strokeLinejoin="round" />
  <path d="M 26 -9 L 200 -64 L 200 -52 L 40 0 Z" fill="#FFB04D" opacity={0.7} />
  <path d="M 10 -2 L 200 -78 L 200 -72 L 20 4 Z" fill="#C96A0E" opacity={0.55} />
  <rect x={198} y={-80} width={34} height={92} rx={14} fill={C.crust} stroke={C.ink} strokeWidth={SW} />
  {[-60, -36, -12, 10].map((yy, i) => <path key={i} d={`M 204 ${yy} Q 216 ${yy - 8} 228 ${yy}`} fill="none" stroke={C.crustDeep} strokeWidth={5} strokeLinecap="round" />)}
  <path d="M 12 0 L 196 -66" stroke="#fff" strokeWidth={6} opacity={0.35} strokeLinecap="round" transform="translate(0 -5)" />
  {dollop > 0.01 && <g transform={`translate(150 -72) scale(${dollop * (1 + wob * 0.12)} ${dollop * (1 - wob * 0.2)})`}>
    <circle cx={-18} cy={-8} r={26} fill={C.cream} stroke={C.ink} strokeWidth={6} /><circle cx={20} cy={-6} r={25} fill={C.cream} stroke={C.ink} strokeWidth={6} />
    <circle cx={0} cy={-26} r={26} fill={C.cream} stroke={C.ink} strokeWidth={6} />
    <circle cx={-18} cy={-8} r={22} fill={C.cream} /><circle cx={20} cy={-6} r={21} fill={C.cream} /><circle cx={0} cy={-26} r={22} fill={C.cream} />
    <path d="M -10 -34 Q 4 -44 12 -30" fill="none" stroke="#E4D2B0" strokeWidth={5} strokeLinecap="round" />
  </g>}
</g>;

export const Plate: React.FC<{x: number; y: number; s?: number; slice?: boolean; dollop?: number; wob?: number; id?: string}> = ({x, y, s = 1, slice = true, dollop = 1, wob = 0, id = 'pl'}) => <g transform={`translate(${x} ${y}) scale(${s})`}>
  <ellipse cx={8} cy={20} rx={160} ry={36} fill={C.ink} opacity={0.22} filter="url(#blurSh)" />
  <ellipse cx={0} cy={0} rx={156} ry={38} fill={C.napkin} stroke={C.ink} strokeWidth={SW} />
  <ellipse cx={0} cy={2} rx={106} ry={24} fill="#E7EEF0" stroke={C.ink} strokeWidth={4} opacity={0.9} />
  <path d="M -130 -14 Q -90 -30 -40 -32" fill="none" stroke="#fff" strokeWidth={6} strokeLinecap="round" opacity={0.7} />
  {slice && <Slice x={-112} y={6} dollop={dollop} wob={wob} id={id} />}
</g>;

export const Fork: React.FC<{x: number; y: number; rot: number; s?: number}> = ({x, y, rot, s = 1}) => <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
  <path d="M -22 0 L -22 -70 M -7 0 L -7 -78 M 8 0 L 8 -78 M 23 0 L 23 -70" stroke={C.ink} strokeWidth={14} strokeLinecap="round" />
  <path d="M -22 0 L -22 -70 M -7 0 L -7 -78 M 8 0 L 8 -78 M 23 0 L 23 -70" stroke="url(#chromeG)" strokeWidth={6} strokeLinecap="round" />
  <path d="M -26 0 Q -26 40 -8 44 L -8 190 Q 0 206 8 190 L 8 44 Q 26 40 26 0 Z" fill="url(#chromeG)" stroke={C.ink} strokeWidth={7} strokeLinejoin="round" />
  <path d="M -12 10 L -10 120" stroke="#fff" strokeWidth={5} opacity={0.8} strokeLinecap="round" />
</g>;

export const PieCase: React.FC<{open: number; slice: boolean; t: number}> = ({open, slice}) => <g>
  <ellipse cx={540} cy={560} rx={420} ry={420} fill="url(#haloWarm)" opacity={0.75} />
  <rect x={324} y={560} width={432} height={350} rx={22} fill={C.chrome} stroke={C.ink} strokeWidth={SW} />
  <rect x={346} y={582} width={388} height={304} rx={10} fill="url(#caseGlow)" stroke={C.ink} strokeWidth={6} />
  {/* shelves */}
  <rect x={346} y={760} width={388} height={14} fill={C.chrome} stroke={C.ink} strokeWidth={5} />
  <rect x={346} y={640} width={388} height={12} fill={C.chrome} stroke={C.ink} strokeWidth={5} opacity={0.0} />
  {[420, 660].map((px, i) => <g key={i}><ellipse cx={px} cy={866} rx={64} ry={14} fill={C.napkin} stroke={C.ink} strokeWidth={5} /></g>)}
  {slice && <g><ellipse cx={540} cy={752} rx={116} ry={18} fill={C.napkin} stroke={C.ink} strokeWidth={6} />
    <Slice x={436} y={746} s={0.96} dollop={1} id="case" /></g>}
  {/* door: hinged on the right */}
  <g transform={`translate(734 0) scale(${lerp(1, 0.1, open)} 1) translate(-734 0)`}>
    <rect x={346} y={582} width={388} height={304} fill="#DFF6FF" opacity={0.2} />
    <Gloss x={346} y={582} w={388} h={304} a={0.4} id="case" />
  </g>
  {/* top + feet */}
  <rect x={308} y={546} width={464} height={26} rx={12} fill="url(#chromeG)" stroke={C.ink} strokeWidth={SW} />
  <g transform="translate(540 628)">
    <rect x={-6} y={-70} width={12} height={16} fill={C.chrome} stroke={C.ink} strokeWidth={4} />
    <rect x={-142} y={-56} width={284} height={64} rx={10} fill={C.custard} stroke={C.ink} strokeWidth={6} transform="rotate(-1.5)" />
    <text x={0} y={-8} textAnchor="middle" fontFamily={ANTON} fontSize={46} fill={C.cran} transform="rotate(-1.5)" letterSpacing={2}>LAST SLICE</text>
  </g>
</g>;

export const ClockSign: React.FC<{x: number; y: number}> = ({x, y}) => <g transform={`translate(${x} ${y})`}>
  <rect x={-150} y={-36} width={300} height={66} rx={14} fill="#1A0D08" stroke={C.ink} strokeWidth={6} />
  <text x={0} y={16} textAnchor="middle" fontFamily={COUR} fontWeight={700} fontSize={50} fill="#FF7A3A" letterSpacing={3}>11:41 PM</text>
</g>;

// ---------------------------------------------------------------------------------------- people
export type Mouth = 'flat' | 'smirk' | 'o' | 'laugh' | 'smile' | 'gulp' | 'grit' | 'soft';
export type Pose = {look: [number, number]; brow: number; worry: number; mouth: Mouth; happy: boolean; sweat: number; gulp: number; tilt: number; bob: number; sq: number; blink: number; flush: number};

const MouthShape: React.FC<{m: Mouth}> = ({m}) => {
  const st = {fill: 'none', stroke: C.ink, strokeWidth: 7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
  switch (m) {
    case 'flat': return <path d="M -24 0 L 24 0" {...st} />;
    case 'smirk': return <path d="M -26 6 Q 6 10 32 -12" {...st} />;
    case 'o': return <ellipse cx={0} cy={6} rx={15} ry={20} fill="#5A1E14" stroke={C.ink} strokeWidth={6} />;
    case 'smile': return <path d="M -36 -4 Q 0 34 36 -4" {...st} />;
    case 'soft': return <path d="M -22 2 Q 0 14 22 2" {...st} />;
    case 'gulp': return <path d="M -26 6 Q -13 -8 0 6 Q 13 20 26 6" {...st} />;
    case 'grit': return <g><rect x={-32} y={-10} width={64} height={26} rx={8} fill="#fff" stroke={C.ink} strokeWidth={6} /><path d="M -32 3 L 32 3 M -10 -10 L -10 16 M 10 -10 L 10 16" stroke={C.ink} strokeWidth={3} /></g>;
    case 'laugh': return <g><path d="M -44 -8 Q 0 -10 44 -8 Q 38 46 0 46 Q -38 46 -44 -8 Z" fill="#5A1E14" stroke={C.ink} strokeWidth={6} strokeLinejoin="round" /><ellipse cx={0} cy={34} rx={20} ry={11} fill="#F27B7B" /></g>;
  }
};

export const Person: React.FC<{who: 'him' | 'her'; x: number; y: number; s?: number; pose: Pose; flip?: boolean}> = ({who, x, y, s = 1, pose, flip = false}) => {
  const him = who === 'him';
  const skin = him ? C.skinHim : C.skinHer;
  const earC = him ? mixc(skin, C.flush, pose.flush) : skin;
  const [lx, ly] = pose.look;
  const hair = him ? C.hairHim : C.hairHer;
  const curls: [number, number, number][] = [];
  if (!him) for (let a = -206; a <= 26; a += 20) curls.push([Math.cos((a * Math.PI) / 180) * 132, -178 + Math.sin((a * Math.PI) / 180) * 148, 40]);
  return <g transform={`translate(${x} ${y + pose.bob}) scale(${s / Math.sqrt(pose.sq)} ${s * pose.sq})`}>
    {/* torso */}
    <path d="M -230 260 L -230 120 Q -226 -8 -96 -32 L 96 -32 Q 226 -8 230 120 L 230 260 Z" fill={him ? C.rust : C.cran} stroke={C.ink} strokeWidth={SW} strokeLinejoin="round" />
    {him ? <g>
      <path d="M 0 -20 L 0 260" stroke={C.rustDeep} strokeWidth={6} />
      <path d="M -6 -34 L -112 -26 L -80 48 L -6 8 Z" fill={C.custard} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
      <path d="M 6 -34 L 112 -26 L 80 48 L 6 8 Z" fill={C.custard} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
      {[-84, -66, -48, 48, 66, 84].map((xx, i) => <path key={i} d={`M ${xx} -22 L ${xx * 0.82} 28`} stroke="#D9BC72" strokeWidth={4} opacity={0.9} />)}
    </g> : <g>
      {[-150, -100, -50, 50, 100, 150].map((xx, i) => <path key={i} d={`M ${xx} 0 Q ${xx + 14} 40 ${xx} 80 Q ${xx - 14} 120 ${xx} 160`} fill="none" stroke="#8B1830" strokeWidth={6} strokeLinecap="round" />)}
      <ellipse cx={0} cy={-26} rx={96} ry={36} fill="#C93450" stroke={C.ink} strokeWidth={7} />
      <path d="M -70 -30 Q 0 -6 70 -30" fill="none" stroke="#8B1830" strokeWidth={5} />
    </g>}
    {/* head group */}
    <g transform={`rotate(${pose.tilt} 0 -40)`}>
      {/* hair back (her) */}
      {!him && <g>
        <ellipse cx={0} cy={-120} rx={166} ry={170} fill={C.ink} />
        <ellipse cx={0} cy={-120} rx={158} ry={162} fill={hair} />
        {[[-150, -40, 36], [150, -40, 36], [-132, 0, 30], [132, 0, 30]].map(([cx, cy, r], i) => <g key={i}><circle cx={cx} cy={cy} r={r + 4} fill={C.ink} /><circle cx={cx} cy={cy} r={r} fill={hair} /></g>)}
      </g>}
      {/* neck */}
      <rect x={-42} y={-80} width={84} height={64} fill={skin} stroke={C.ink} strokeWidth={7} />
      <ellipse cx={0} cy={-34 + pose.gulp * 14} rx={20} ry={10 + pose.gulp * 8} fill={mixc(skin, '#000000', 0.12)} opacity={0.4 + pose.gulp * 0.4} />
      {/* ears */}
      {[-1, 1].map((sd) => <g key={sd}>
        <ellipse cx={sd * 126} cy={-166} rx={24} ry={36} fill={earC} stroke={C.ink} strokeWidth={7} />
        {pose.flush > 0.3 && him && <ellipse cx={sd * 126} cy={-166} rx={11} ry={20} fill={C.flush} opacity={pose.flush * 0.7} />}
        {!him && <circle cx={sd * 130} cy={-118} r={22} fill="none" stroke={C.gold} strokeWidth={7} />}
        {!him && <circle cx={sd * 130} cy={-118} r={22} fill="none" stroke={C.ink} strokeWidth={2} opacity={0.5} />}
      </g>)}
      {/* head */}
      <ellipse cx={0} cy={-178} rx={126} ry={140} fill={skin} stroke={C.ink} strokeWidth={SW} />
      <ellipse cx={-64} cy={-120} rx={26} ry={18} fill={C.flush} opacity={pose.flush * 0.55 + (him ? 0.08 : 0.12)} />
      <ellipse cx={64} cy={-120} rx={26} ry={18} fill={C.flush} opacity={pose.flush * 0.55 + (him ? 0.08 : 0.12)} />
      {/* hair front */}
      {him ? <g>
        <path d="M -128 -196 C -142 -330 -40 -352 22 -336 C 96 -350 144 -300 128 -196 C 110 -250 40 -266 -10 -258 C -62 -262 -110 -246 -128 -196 Z" fill={hair} stroke={C.ink} strokeWidth={SW} strokeLinejoin="round" />
        <path d="M 14 -336 Q 30 -388 56 -352 Q 46 -338 40 -336" fill={hair} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
        <path d="M -110 -250 Q -60 -290 -10 -276 M -118 -224 Q -70 -262 -20 -250" fill="none" stroke="#6B4030" strokeWidth={5} strokeLinecap="round" />
      </g> : <g>
        {[...curls, [0, -338, 54] as [number, number, number], [-52, -318, 40] as [number, number, number], [52, -318, 40] as [number, number, number]].map(([cx, cy, r], i) => <circle key={`o${i}`} cx={cx} cy={cy} r={r + 4} fill={C.ink} />)}
        {[...curls, [0, -338, 54] as [number, number, number], [-52, -318, 40] as [number, number, number], [52, -318, 40] as [number, number, number]].map(([cx, cy, r], i) => <circle key={`f${i}`} cx={cx} cy={cy} r={r} fill={hair} />)}
        {[...curls].map(([cx, cy], i) => <path key={`c${i}`} d={`M ${cx - 14} ${cy + 4} Q ${cx} ${cy - 16} ${cx + 14} ${cy + 2}`} fill="none" stroke="#5A3020" strokeWidth={5} strokeLinecap="round" />)}
        <path d="M -100 -230 Q -20 -270 100 -226" fill="none" stroke={C.ink} strokeWidth={0} />
      </g>}
      {/* face */}
      {[-1, 1].map((sd) => {
        const bl = pose.blink;
        return <g key={sd} transform={`translate(${sd * 50} -176)`}>
          {pose.happy ? <path d="M -28 8 Q 0 -28 28 8" fill="none" stroke={C.ink} strokeWidth={9} strokeLinecap="round" /> : <g transform={`scale(1 ${1 - bl * 0.92})`}>
            <ellipse cx={0} cy={0} rx={30} ry={37} fill="#fff" stroke={C.ink} strokeWidth={6} />
            <circle cx={lx * 12} cy={ly * 13} r={16} fill={C.ink} />
            <circle cx={lx * 12 + 5} cy={ly * 13 - 6} r={5} fill="#fff" />
          </g>}
          {!him && <path d={`M ${sd * 26} -8 L ${sd * 40} -18`} stroke={C.ink} strokeWidth={6} strokeLinecap="round" />}
          <path d={`M ${-sd * 30} ${-56 - pose.brow * 16 + (sd === -1 ? 0 : 0) - pose.worry * 0} L ${sd * 30} ${-58 - pose.brow * 18 - pose.worry * 0}`} stroke="none" />
          <path d={`M ${-30} ${-58 - pose.brow * 16 + (sd * pose.worry * 10)} L ${30} ${-58 - pose.brow * 16 - (sd * pose.worry * 10)}`} fill="none" stroke={C.ink} strokeWidth={him ? 12 : 10} strokeLinecap="round" />
        </g>;
      })}
      <path d="M -8 -150 Q 0 -132 12 -146" fill="none" stroke={C.ink} strokeWidth={6} strokeLinecap="round" opacity={0.7} />
      <g transform="translate(0 -92)"><MouthShape m={pose.mouth} /></g>
      {pose.sweat > 0.02 && <g transform={`translate(${him ? 116 : -116} ${-290 + pose.sweat * 70}) scale(${0.5 + pose.sweat * 0.6})`} opacity={clamp(pose.sweat * 2)}>
        <path d="M 0 -34 Q 26 8 0 26 Q -26 8 0 -34 Z" fill="#9FDCF7" stroke={C.ink} strokeWidth={6} /><path d="M -6 -4 Q -10 8 -2 14" stroke="#fff" strokeWidth={4} fill="none" strokeLinecap="round" />
      </g>}
    </g>
  </g>;
};

/** Sleeve + hand. (sx,sy) shoulder, (hx,hy) hand centre. */
export const Arm: React.FC<{who: 'him' | 'her'; sx: number; sy: number; hx: number; hy: number; w?: number; cover?: number}> = ({who, sx, sy, hx, hy, w = 92, cover = 0}) => {
  const skin = who === 'him' ? C.skinHim : C.skinHer;
  const sleeve = who === 'him' ? C.rust : C.cran;
  const mx = (sx + hx) / 2 + (hx > sx ? 24 : -24), my = (sy + hy) / 2 + 30;
  const d = `M ${sx} ${sy} Q ${mx} ${my} ${hx} ${hy}`;
  const ang = (Math.atan2(hy - my, hx - mx) * 180) / Math.PI;
  return <g>
    <path d={d} fill="none" stroke={C.ink} strokeWidth={w + 14} strokeLinecap="round" />
    <path d={d} fill="none" stroke={sleeve} strokeWidth={w} strokeLinecap="round" />
    <g transform={`translate(${hx} ${hy}) rotate(${ang})`}>
      <rect x={-6} y={-34} width={30} height={68} rx={12} fill={who === 'him' ? C.custard : '#E8B33A'} stroke={C.ink} strokeWidth={6} opacity={0} />
      <circle cx={26} cy={0} r={44} fill={skin} stroke={C.ink} strokeWidth={7} />
      {[-18, 0, 18].map((yy, i) => <path key={i} d={`M 40 ${yy - 4} Q 58 ${yy} 40 ${yy + 8}`} fill="none" stroke={C.ink} strokeWidth={4} opacity={0.5} strokeLinecap="round" />)}
    </g>
  </g>;
};

// ---------------------------------------------------------------------------------------- phone (generic glow card, no UI)
export const Phone: React.FC<{x: number; y: number; rot?: number; scale?: number; lit?: number; p?: number; dir?: number; thumb?: number; caseColor?: string; id: string; skin?: string; flat?: number}> = ({x, y, rot = 0, scale = 1, lit = 1, p = 0, dir = 1, thumb = 1, caseColor = '#2C2C36', id, skin = C.skinHim, flat = 0}) => {
  const off = dir * p * 120, rr = dir * p * 16;
  return <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale} ${scale * lerp(1, 0.46, flat)})`}>
    <ellipse cx={0} cy={0} rx={380} ry={380} fill="url(#haloCool)" opacity={1.0 * lit} />
    <rect x={-80} y={-146} width={160} height={292} rx={30} fill={caseColor} stroke={C.ink} strokeWidth={8} />
    <clipPath id={`scr${id}`}><rect x={-66} y={-132} width={132} height={264} rx={20} /></clipPath>
    <g clipPath={`url(#scr${id})`}>
      <rect x={-66} y={-132} width={132} height={264} fill={lit > 0.3 ? 'url(#scr)' : '#274050'} opacity={0.35 + 0.65 * lit} />
      <g transform={`scale(${0.92 + 0.08 * p})`}><rect x={-48} y={-88} width={96} height={176} rx={14} fill="#FFD2BD" stroke="#E79B7E" strokeWidth={3} /><circle cx={0} cy={-40} r={28} fill="#7FC4EE" /><rect x={-34} y={14} width={68} height={10} rx={5} fill="#F0A98E" /><rect x={-34} y={34} width={44} height={10} rx={5} fill="#F6C4AF" /></g>
      <g transform={`translate(${off} ${p * -10}) rotate(${rr} 0 90)`} opacity={1 - p * 0.6}>
        <rect x={-48} y={-90} width={96} height={176} rx={14} fill="#fff" stroke="#8CC8E8" strokeWidth={3} />
        <circle cx={0} cy={-40} r={30} fill="#F4A58A" /><circle cx={0} cy={-48} r={11} fill="#FFE0CF" /><path d="M -20 -26 Q 0 -8 20 -26" fill="#FFE0CF" />
        <rect x={-34} y={12} width={68} height={10} rx={5} fill="#9AD0EE" /><rect x={-34} y={32} width={46} height={10} rx={5} fill="#C5E3F5" /><rect x={-34} y={52} width={56} height={10} rx={5} fill="#C5E3F5" />
      </g>
    </g>
    <rect x={-66} y={-132} width={132} height={264} rx={20} fill="none" stroke={C.ink} strokeWidth={4} />
    <Gloss x={-66} y={-132} w={132} h={264} a={0.25 * lit} id={`ph${id}`} r={20} />
    {thumb > 0.01 && <g transform={`translate(${off * 0.5 + 6} ${50 + p * -10})`} opacity={thumb}><ellipse cx={0} cy={0} rx={22} ry={34} fill={skin} stroke={C.ink} strokeWidth={6} transform="rotate(-14)" /></g>}
  </g>;
};

// ---------------------------------------------------------------------------------------- props
export const Mug: React.FC<{x: number; y: number; rot?: number; steam?: number; id?: string}> = ({x, y, rot = 0, steam = 0}) => <g transform={`translate(${x} ${y}) rotate(${rot})`}>
  <path d="M 52 -26 Q 100 -26 100 8 Q 100 42 48 38" fill="none" stroke={C.ink} strokeWidth={22} strokeLinecap="round" />
  <path d="M 52 -26 Q 100 -26 100 8 Q 100 42 48 38" fill="none" stroke={C.custard} strokeWidth={10} strokeLinecap="round" />
  <path d="M -56 -62 L 56 -62 L 52 58 Q 52 64 46 64 L -46 64 Q -52 64 -52 58 Z" fill={C.custard} stroke={C.ink} strokeWidth={SW} strokeLinejoin="round" />
  <rect x={-54} y={-12} width={108} height={14} fill={C.cran} stroke={C.ink} strokeWidth={4} opacity={0.95} />
  <ellipse cx={0} cy={-62} rx={56} ry={13} fill="#4B2A1B" stroke={C.ink} strokeWidth={6} />
  <path d="M -36 -22 L -34 44" stroke="#fff" strokeWidth={8} opacity={0.7} strokeLinecap="round" />
</g>;

export const Dispenser: React.FC<{x: number; y: number; pull?: number}> = ({x, y, pull = 0}) => <g transform={`translate(${x} ${y})`}>
  <ellipse cx={0} cy={4} rx={80} ry={14} fill={C.ink} opacity={0.25} filter="url(#blurSh)" />
  {pull > 0 && <g transform={`translate(0 ${-148 - pull * 44}) rotate(${pull * 6})`}><rect x={-34} y={-30} width={68} height={70} rx={4} fill={C.napkin} stroke={C.ink} strokeWidth={5} /></g>}
  {[-24, 0, 24].map((xx, i) => <path key={i} d={`M ${xx - 20} -140 L ${xx - 14} -170 L ${xx + 14} -164 L ${xx + 20} -140 Z`} fill={C.napkin} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />)}
  <path d="M -66 0 L -60 -146 Q -60 -158 -48 -158 L 48 -158 Q 60 -158 60 -146 L 66 0 Z" fill="url(#chromeG)" stroke={C.ink} strokeWidth={SW} strokeLinejoin="round" />
  <rect x={-40} y={-70} width={80} height={26} rx={8} fill="#26302E" stroke={C.ink} strokeWidth={5} />
  <Gloss x={-62} y={-156} w={124} h={154} a={0.55} id="disp" />
</g>;

export const CrayonCup: React.FC<{x: number; y: number}> = ({x, y}) => <g transform={`translate(${x} ${y})`}>
  {[[-24, -20, C.pumpkin, -10], [-8, -34, C.cran, -3], [10, -26, C.pumpkin, 6], [26, -16, C.cran, 12], [0, -14, C.custard, 0]].map(([cx, h, col, r], i) => <g key={i} transform={`translate(${cx} 0) rotate(${r})`}>
    <rect x={-9} y={-60 + (h as number) * 0.4} width={18} height={66} rx={3} fill={col as string} stroke={C.ink} strokeWidth={5} />
    <path d={`M -9 ${-60 + (h as number) * 0.4} L 0 ${-78 + (h as number) * 0.4} L 9 ${-60 + (h as number) * 0.4} Z`} fill={col as string} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
  </g>)}
  <path d="M -42 -52 L 42 -52 L 36 0 Q 36 8 28 8 L -28 8 Q -36 8 -36 0 Z" fill={C.tealLite} stroke={C.ink} strokeWidth={SW} strokeLinejoin="round" />
  <path d="M -26 -44 L -22 0" stroke="#fff" strokeWidth={6} opacity={0.5} strokeLinecap="round" />
</g>;

export const Beanie: React.FC<{x: number; y: number}> = ({x, y}) => <g transform={`translate(${x} ${y})`}>
  <path d="M -66 30 Q -66 -70 0 -70 Q 66 -70 66 30 Z" fill={C.cream} stroke={C.ink} strokeWidth={SW} strokeLinejoin="round" />
  <rect x={-72} y={8} width={144} height={40} rx={16} fill="#EBDCB8" stroke={C.ink} strokeWidth={SW} />
  <circle cx={0} cy={-84} r={26} fill={C.cream} stroke={C.ink} strokeWidth={7} />
</g>;

export const Sugar: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => <g transform={`translate(${x} ${y}) scale(${s})`} filter="url(#blurNear)">
  <rect x={-90} y={-330} width={180} height={330} rx={44} fill="#DFF4F2" stroke={C.ink} strokeWidth={12} opacity={0.92} />
  <rect x={-76} y={-220} width={152} height={206} rx={34} fill="#fff" opacity={0.8} />
  <rect x={-98} y={-420} width={196} height={110} rx={40} fill="url(#chromeG)" stroke={C.ink} strokeWidth={12} />
  {[-50, -16, 18, 52].map((xx, i) => <circle key={i} cx={xx} cy={-366} r={9} fill={C.ink} opacity={0.7} />)}
</g>;

export const Steam: React.FC<{x: number; y: number; t: number}> = ({x, y, t}) => <g transform={`translate(${x} ${y})`} filter="url(#blurNear)" opacity={0.32}>
  {[0, 1, 2].map((i) => <path key={i} d={`M ${i * 46 - 46} 0 Q ${i * 46 - 46 + Math.sin(t * 1.6 + i) * 44} -150 ${i * 46 - 46 - Math.sin(t * 1.3 + i * 2) * 36} -300 T ${i * 46 - 46 + Math.sin(t + i) * 30} -330`} fill="none" stroke="#fff" strokeWidth={34} strokeLinecap="round" />)}
</g>;

/** Mint formica counter (top surface y 1010-1230, chrome edge, front panel). */
export const Counter: React.FC = () => <g>
  <rect x={-200} y={1010} width={1480} height={222} fill="url(#counterTop)" stroke={C.ink} strokeWidth={SW} />
  {Array.from({length: 24}, (_, i) => <g key={i} transform={`translate(${(i * 83) % 1160 - 40} ${1040 + ((i * 47) % 150)}) rotate(${(i * 37) % 80})`} opacity={0.5}>
    <path d="M 0 0 L 22 6 L 6 18 Z" fill="#E8FFF6" stroke="none" /><circle cx={30} cy={4} r={3} fill={C.mintDeep} />
  </g>)}
  <rect x={-200} y={1232} width={1480} height={34} fill="url(#chromeG)" stroke={C.ink} strokeWidth={SW} />
  <rect x={-200} y={1266} width={1480} height={700} fill={C.tealLite} stroke={C.ink} strokeWidth={SW} />
  {Array.from({length: 14}, (_, i) => <rect key={i} x={i * 100 - 60} y={1280} width={44} height={620} fill="#14504C" opacity={0.7} />)}
  <Gloss x={-200} y={1232} w={1480} h={34} a={0.5} id="edge" />
  <rect x={-200} y={1500} width={1480} height={26} fill="url(#chromeG)" stroke={C.ink} strokeWidth={SW} />
  {[150, 540, 930].map((x, i) => <g key={i}><rect x={x - 14} y={1526} width={28} height={300} fill="url(#chromeG)" stroke={C.ink} strokeWidth={SW} /><ellipse cx={x} cy={1640} rx={120} ry={34} fill={C.cran} stroke={C.ink} strokeWidth={SW} /><rect x={x - 120} y={1640} width={240} height={50} fill={C.cran} stroke={C.ink} strokeWidth={SW} /><ellipse cx={x} cy={1690} rx={120} ry={34} fill="#8B1830" stroke={C.ink} strokeWidth={SW} /><rect x={x - 118} y={1640} width={236} height={50} fill={C.cran} /></g>)}
</g>;

// ---------------------------------------------------------------------------------------- napkins + crayon
export const CrayonSprite: React.FC<{x: number; y: number; color: string; skin: string; sleeve: string}> = ({x, y, color, skin, sleeve}) => <g transform={`translate(${x} ${y}) rotate(66)`}>
  <path d="M 0 0 L -10 -20 L 10 -20 Z" fill={color} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
  <rect x={-10} y={-120} width={20} height={100} fill={color} stroke={C.ink} strokeWidth={5} />
  <rect x={-10} y={-92} width={20} height={26} fill="#fff" opacity={0.7} />
  <line x1={0} y1={-170} x2={0} y2={-520} stroke={C.ink} strokeWidth={112} strokeLinecap="butt" />
  <line x1={0} y1={-170} x2={0} y2={-520} stroke={sleeve} strokeWidth={96} strokeLinecap="butt" />
  <rect x={-42} y={-186} width={84} height={96} rx={34} fill={skin} stroke={C.ink} strokeWidth={7} />
  <rect x={-12} y={-122} width={24} height={26} rx={10} fill={color} stroke={C.ink} strokeWidth={4} opacity={0} />
  {[-22, 0, 22].map((xx, i) => <path key={i} d={`M ${xx} -130 L ${xx} -100`} stroke={C.ink} strokeWidth={4} opacity={0.5} strokeLinecap="round" />)}
  <ellipse cx={-34} cy={-116} rx={16} ry={26} fill={skin} stroke={C.ink} strokeWidth={6} transform="rotate(20 -34 -116)" />
</g>;

export const CrayonLine: React.FC<{txt: string; x: number; y: number; size: number; color: string; p: number}> = ({txt, x, y, size, color, p}) => {
  const font = `700 ${size}px ${HAND}`;
  const w = textW(txt, font);
  const id = `cl${Math.round(x)}${Math.round(y)}${txt.length}`;
  return <g>
    <clipPath id={id}><rect x={x - w / 2 - 20} y={y - size * 1.1} width={(w + 40) * clamp(p)} height={size * 1.5} /></clipPath>
    <g clipPath={`url(#${id})`} filter="url(#rough)"><text x={x} y={y} textAnchor="middle" fontFamily={HAND} fontWeight={700} fontSize={size} fill={color} stroke={color} strokeWidth={size * 0.035} strokeLinejoin="round">{txt}</text></g>
  </g>;
};

export const NapkinPaper: React.FC<{w: number; h: number; x: number; y: number; rot?: number; scale?: number; id: string; glowA?: number; children?: React.ReactNode}> = ({w, h, x, y, rot = 0, scale = 1, id, glowA = 0, children}) => <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale})`}>
  {glowA > 0 && <ellipse cx={0} cy={0} rx={w * 0.95} ry={h * 1.0} fill="url(#haloWhite)" opacity={glowA} />}
  <rect x={-w / 2 + 14} y={-h / 2 + 22} width={w} height={h} rx={8} fill={C.ink} opacity={0.3} filter="url(#blurSh)" />
  <path d={`M ${-w / 2} ${-h / 2} L ${w / 2} ${-h / 2 + 3} L ${w / 2 - 3} ${h / 2} L ${-w / 2 + 2} ${h / 2 - 4} Z`} fill={C.napkin} stroke={C.ink} strokeWidth={SW} strokeLinejoin="round" />
  <pattern id={`np${id}`} width={40} height={40} patternUnits="userSpaceOnUse"><path d="M 20 4 L 36 20 L 20 36 L 4 20 Z" fill="none" stroke="#E9E2D0" strokeWidth={2} /></pattern>
  <rect x={-w / 2 + 12} y={-h / 2 + 12} width={w - 24} height={h - 24} fill={`url(#np${id})`} opacity={0.8} />
  <path d={`M ${-w / 2 + 8} ${h * 0.04} L ${w / 2 - 8} ${h * 0.02}`} stroke="#E4DCC6" strokeWidth={3} /><path d={`M ${w * 0.03} ${-h / 2 + 8} L ${w * 0.02} ${h / 2 - 8}`} stroke="#E4DCC6" strokeWidth={3} />
  {children}
</g>;

// ---------------------------------------------------------------------------------------- strips
export const Strip: React.FC<{text: string; y: number; age: number; out?: number; size?: number; maxW?: number; hot?: boolean}> = ({text, y, age, out = 0, size = 56, maxW = 1000, hot = false}) => {
  const font = (s: number) => `700 ${s}px ${COUR}`;
  const inner = maxW - 90;
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
  const lh = s * 1.16, h = lines.length * lh + 56, w = Math.min(maxW, width(lines, s) + 90);
  if (y < 600) y = Math.max(y, 290 + h / 2);
  const pop = smooth(age, 0, 0.1) * (1 + 0.05 * Math.sin(clamp(age / 0.32) * Math.PI));
  const x0 = 540 - w / 2, y0 = y - h / 2;
  const top: string[] = [], bot: string[] = [];
  const nz = Math.round(w / 26);
  for (let i = 0; i <= nz; i++) { top.push(`${x0 + (w * i) / nz},${y0 + (i % 2 ? 9 : 0)}`); bot.push(`${x0 + w - (w * i) / nz},${y0 + h - (i % 2 ? 9 : 0)}`); }
  const pts = [...top, ...bot].join(' ');
  return <g opacity={1 - out} transform={`translate(540 ${y - out * 14}) scale(${pop}) translate(-540 ${-y})`}>
    <polygon points={pts} fill={C.ink} opacity={0.35} transform="translate(8 12)" />
    <polygon points={pts} fill={hot ? C.pumpkin : C.custard} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
    <path d={`M ${x0 + 16} ${y0 + 20} L ${x0 + w - 16} ${y0 + 20}`} stroke={C.cran} strokeWidth={2} opacity={0.0} />
    <rect x={x0 + 18} y={y0 + h - 18} width={w - 36} height={3} fill={C.cran} opacity={0.4} />
    {lines.map((l, i) => <text key={i} x={540} y={y0 + 28 + lh * (i + 0.8)} textAnchor="middle" fontFamily={COUR} fontWeight={700} fontSize={s} fill={C.ink}>{l}</text>)}
  </g>;
};

// ---------------------------------------------------------------------------------------- slice wipe
export const WIPE_DUR = 0.5;
const WC = {x: 540, y: 960};
const arcPts = (k: number, r: number) => {
  const a0 = -90, a1 = -90 + 360 * clamp(k);
  const pts = [`${WC.x},${WC.y}`];
  const n = Math.max(2, Math.ceil((a1 - a0) / 8));
  for (let i = 0; i <= n; i++) { const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180; pts.push(`${WC.x + Math.cos(a) * r},${WC.y + Math.sin(a) * r}`); }
  return pts.join(' ');
};
export const WipeClip: React.FC<{k: number}> = ({k}) => <clipPath id="sliceNew"><polygon points={arcPts(smooth(k, 0, 1), 1800)} /></clipPath>;
/** The crimped crust "clock hand" riding the wipe edge. */
export const WipeRim: React.FC<{k: number}> = ({k}) => {
  const a = -90 + 360 * smooth(k, 0, 1);
  const n = 22;
  return <g transform={`translate(${WC.x} ${WC.y}) rotate(${a})`}>
    <rect x={0} y={-6} width={1800} height={12} fill={C.ink} opacity={0.0} />
    <path d={`M 0 0 L 1800 0`} stroke={C.ink} strokeWidth={96} strokeLinecap="butt" />
    <path d={`M 0 0 L 1800 0`} stroke={C.crust} strokeWidth={78} strokeLinecap="butt" />
    <path d={`M 0 -28 L 1800 -28`} stroke="#F6C98A" strokeWidth={10} opacity={0.8} />
    {Array.from({length: n}, (_, i) => <path key={i} d={`M ${80 + i * 80} -40 Q ${80 + i * 80 + 20} 0 ${80 + i * 80} 40`} fill="none" stroke={C.crustDeep} strokeWidth={9} strokeLinecap="round" />)}
    <path d="M 0 -48 L 1800 -48" stroke={C.ink} strokeWidth={8} />
  </g>;
};

// ---------------------------------------------------------------------------------------- vote board + end card
export const VoteCard: React.FC<{letter: string; l1: string; l2: string; y: number; age: number; rot: number; id: string}> = ({letter, l1, l2, y, age, rot, id}) => {
  if (age < 0) return null;
  const k = clamp(age / 0.35);
  const sp = Math.max(0.01, 1 + Math.sin(k * Math.PI * 1.5) * Math.exp(-k * 4.2) * 0.4 - Math.exp(-k * 9) * (1 - k));
  const x = 600 + (1 - Math.min(1, k * 1.4)) * 700;
  const n = Math.min(1, (age - 0.15) / 0.5);
  return <g>
    <NapkinPaper w={840} h={230} x={x} y={y} rot={rot} scale={sp} id={id} glowA={0.0}>
      <CrayonLine txt={l1} x={30} y={-6} size={92} color={C.pumpkin} p={(age - 0.05) / 0.2} />
      <CrayonLine txt={l2} x={30} y={84} size={92} color={C.pumpkin} p={(age - 0.15) / 0.2} />
    </NapkinPaper>
    <g transform={`translate(${x - 452 * sp} ${y - 10}) scale(${sp})`}>
      <circle r={72} fill={C.ink} transform="translate(7 9)" /><circle r={72} fill={C.pumpkin} stroke={C.ink} strokeWidth={8} />
      <text x={0} y={36} textAnchor="middle" fontFamily={ANTON} fontSize={104} fill={C.ink}>{letter}</text>
    </g>
  </g>;
};

export const Chalk: React.FC<{text: string; x: number; y: number; w: number; h: number; size: number; a: number}> = ({text, x, y, w, h, size, a}) => <g transform={`translate(${x} ${y}) scale(${a})`} opacity={clamp(a * 2)}>
  <rect x={-w / 2 + 8} y={-h / 2 + 12} width={w} height={h} rx={16} fill={C.ink} opacity={0.35} />
  <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={16} fill="#8A5A3A" stroke={C.ink} strokeWidth={SW} />
  <rect x={-w / 2 + 16} y={-h / 2 + 16} width={w - 32} height={h - 32} rx={8} fill="#1D2E2B" stroke={C.ink} strokeWidth={5} />
  <text x={0} y={size * 0.34} textAnchor="middle" fontFamily={MARKER} fontSize={size} fill="#F4F1E6" opacity={0.95}>{text}</text>
</g>;

const FullPie: React.FC = () => <g>
  <ellipse cx={0} cy={26} rx={300} ry={64} fill={C.ink} opacity={0.3} filter="url(#blurSh)" />
  <ellipse cx={0} cy={0} rx={290} ry={76} fill={C.napkin} stroke={C.ink} strokeWidth={SW} />
  <path d="M -230 -4 Q -230 -76 0 -80 Q 230 -76 230 -4 Q 230 34 0 38 Q -230 34 -230 -4 Z" fill={C.crust} stroke={C.ink} strokeWidth={SW} />
  <ellipse cx={0} cy={-22} rx={196} ry={44} fill={C.pie} stroke={C.ink} strokeWidth={6} />
  <path d="M 0 -22 L 196 -22 A 196 44 0 0 1 148 8 Z" fill={C.napkin} stroke={C.ink} strokeWidth={5} opacity={0.0} />
  <path d="M 0 -22 L 150 18 L 196 -22 Z" fill="#E7EEF0" stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
  {Array.from({length: 11}, (_, i) => <path key={i} d={`M ${-210 + i * 36} -50 Q ${-194 + i * 36} -66 ${-176 + i * 36} -52`} fill="none" stroke={C.crustDeep} strokeWidth={6} strokeLinecap="round" opacity={0.0} />)}
  <circle cx={-60} cy={-26} r={22} fill={C.cream} stroke={C.ink} strokeWidth={5} />
</g>;

export const EndCard: React.FC<{a: number; t: number}> = ({a, t}) => {
  const pop = (d: number) => { const k = clamp((a - d) / 0.3); return k <= 0 ? 0 : 1 + Math.sin(k * Math.PI * 1.5) * Math.exp(-k * 4.2) * 0.4 - Math.exp(-k * 9) * (1 - k); };
  const flick = 0.85 + 0.15 * Math.sin(t * 29) * Math.sin(t * 5.1);
  const pillT = 'part 2 · A or B';
  const pw = textW(pillT, `700 74px ${COUR}`) + 100;
  return <g>
    <Far t={t} />
    <rect x={-200} y={1000} width={1480} height={1000} fill={C.tealLite} />
    <Counter />
    <g transform={`translate(540 800) scale(${pop(0)})`} opacity={flick}>
      <text x={0} y={0} textAnchor="middle" fontFamily={ANTON} fontSize={190} fill={C.pumpkin} stroke={C.pumpkin} strokeWidth={30} opacity={0.6} filter="url(#blurGlow)" letterSpacing={4}>pie for two</text>
      <text x={0} y={0} textAnchor="middle" fontFamily={ANTON} fontSize={190} fill="#1A0D08" stroke={C.pumpkin} strokeWidth={11} strokeLinejoin="round" letterSpacing={4}>pie for two</text>
      <text x={0} y={0} textAnchor="middle" fontFamily={ANTON} fontSize={190} fill="none" stroke="#FFE2B8" strokeWidth={3} strokeLinejoin="round" letterSpacing={4}>pie for two</text>
    </g>
    <g transform={`translate(540 985) scale(${pop(0.15)})`}>
      <FullPie />
      <Fork x={-150} y={20} rot={-62} s={0.6} /><Fork x={150} y={26} rot={62} s={0.6} />
    </g>
    <g transform={`translate(540 1190) scale(${pop(0.4)})`}>
      <rect x={-pw / 2 + 9} y={-60 + 12} width={pw} height={116} rx={14} fill={C.ink} opacity={0.4} />
      <rect x={-pw / 2} y={-60} width={pw} height={116} rx={14} fill={C.custard} stroke={C.ink} strokeWidth={6} />
      <text x={0} y={18} textAnchor="middle" fontFamily={COUR} fontWeight={700} fontSize={74} fill={C.ink}>{pillT}</text>
    </g>
  </g>;
};
