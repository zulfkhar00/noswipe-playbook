import React from 'react';
import {clamp, lerp, smooth} from '../../lib/motion';
import {OPEN} from '../../lib/fonts';

// TABLE NINE (season 8): a wedding singles table. Flat paper cut-out half-figures with big round heads, ivory reception
// planes in depth, soft ink-tinted shadows (stacked translucent shapes, no filters on the cast), hard offset shadow on the
// tent card. Reusable by parts 2-6: palette, camera, Person, Phone, Hand, Marker, Tent card, Strip, lazy Susan wipe,
// vote cards, end card.

export const C = {
  ivory: '#FBF5E9', ivoryDeep: '#F1E6CF', cloth: '#FFFBF2', eucalyptus: '#86A38C', eucDeep: '#4F7A63', terracotta: '#D9785B', terraDeep: '#B2472A',
  marigold: '#F2B632', aubergine: '#2B1630', champagne: '#E9D9B0', skinHim: '#F0B692', skinHer: '#B97A52', pink: '#E9877A',
  hairHim: '#2C1B26', hairHer: '#3A2318', sage: '#9DB8A0', sky: '#D5E5DC',
};
export const NUN = OPEN.humanist;   // strips + end card (Nunito Sans 800)
export const GEL = OPEN.serif;      // printed place card (Gelasio italic bold, synthetic slant)
export const MARK = OPEN.marker;    // handwriting (Permanent Marker)

// ---------------------------------------------------------------------------------------- measuring (bundled fonts are loaded before any frame)
const cache = new Map<string, number>();
let ctx: CanvasRenderingContext2D | null = null;
export const textW = (txt: string, font: string): number => {
  const key = font + '|' + txt;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  let w: number;
  if (typeof document === 'undefined') w = txt.length * 30;
  else { ctx = ctx ?? document.createElement('canvas').getContext('2d'); ctx!.font = font; w = ctx!.measureText(txt).width; }
  cache.set(key, w);
  return w;
};
export const fitSize = (txt: string, font: (s: number) => string, size: number, maxW: number) => {
  let s = size;
  while (s > 20 && textW(txt, font(s)) > maxW) s -= 2;
  return s;
};

// ---------------------------------------------------------------------------------------- camera
export type Cam = {x: number; y: number; z: number; r: number};
export type CamKey = {t: number; x: number; y: number; z: number; cut?: boolean; wob?: number};
const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const camAt = (keys: CamKey[], t: number): Cam => {
  let i = 0;
  while (i + 1 < keys.length && t >= keys[i + 1].t) i++;
  const a = keys[i], b = keys[i + 1];
  let c = {x: a.x, y: a.y, z: a.z, w: a.wob ?? 0};
  if (b && !b.cut) {
    const k = ease(clamp((t - a.t) / (b.t - a.t)));
    c = {x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z: lerp(a.z, b.z, k), w: lerp(a.wob ?? 0, b.wob ?? 0, k)};
  }
  const w = c.w;
  return {x: c.x + 2 * Math.sin(t * 1.3) + w * 9 * Math.sin(t * 2.7), y: c.y + 2.4 * Math.sin(t * 1.9 + 1) + w * 7 * Math.sin(t * 3.3 + 2), z: c.z, r: w * 0.35 * Math.sin(t * 2.1)};
};
export const planeT = (c: Cam, d: number) => {
  const s = 1 + (c.z - 1) * d;
  const cx = 540 + (c.x - 540) * d, cy = 960 + (c.y - 960) * d;
  return `translate(540 960) rotate(${(c.r * d).toFixed(3)}) scale(${s.toFixed(4)}) translate(${(-cx).toFixed(2)} ${(-cy).toFixed(2)})`;
};
export const track = (keys: [number, number[]][], t: number): number[] => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i + 1 < keys.length; i++) {
    const [a, va] = keys[i], [b, vb] = keys[i + 1];
    if (t < b) { const k = smooth(t, a, b); return va.map((v, j) => lerp(v, vb[j], k)); }
  }
  return keys[keys.length - 1][1];
};
export const keyAt = <T,>(t: number, ks: [number, T][]): T => { let v = ks[0][1]; for (const [a, b] of ks) if (t >= a) v = b; return v; };
const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// ---------------------------------------------------------------------------------------- soft shadows
export const SoftRect: React.FC<{x: number; y: number; w: number; h: number; r?: number; dx?: number; dy?: number; op?: number}> = ({x, y, w, h, r = 24, dx = 12, dy = 22, op = 0.3}) => <g>
  {[26, 15, 6].map((g, i) => <rect key={i} x={x + dx - g} y={y + dy - g} width={w + 2 * g} height={h + 2 * g} rx={r + g} fill={C.aubergine} opacity={op / 3} />)}
</g>;
export const SoftEllipse: React.FC<{x: number; y: number; w: number; h: number; op?: number}> = ({x, y, w, h, op = 0.25}) => <g>
  {[1.5, 1.25, 1].map((k, i) => <ellipse key={i} cx={x} cy={y} rx={w * k / 2} ry={h * k / 2} fill={C.aubergine} opacity={op / 3} />)}
</g>;

export const Defs: React.FC = () => <defs>
  <radialGradient id="bokeh"><stop offset="0" stopColor="#FFF3CC" stopOpacity="0.95" /><stop offset="0.7" stopColor="#F7D98A" stopOpacity="0.55" /><stop offset="1" stopColor="#F2B632" stopOpacity="0" /></radialGradient>
  <radialGradient id="glow"><stop offset="0" stopColor="#FFF6D9" stopOpacity="0.85" /><stop offset="1" stopColor="#FFF6D9" stopOpacity="0" /></radialGradient>
  <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFF9EC" /><stop offset="1" stopColor="#F4E8CF" /></linearGradient>
  <linearGradient id="win" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#E4F0E8" /><stop offset="1" stopColor="#CFE1D6" /></linearGradient>
  <filter id="blur6" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="7" /></filter>
  <filter id="blur14" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="14" /></filter>
</defs>;

// ---------------------------------------------------------------------------------------- far plane: ballroom wall, arch window, bokeh
export const Bokeh: React.FC<{t: number; n?: number; y0?: number; y1?: number; seed?: number}> = ({t, n = 18, y0 = 250, y1 = 760, seed = 0}) => <g>
  {Array.from({length: n}, (_, i) => {
    const k = i + seed * 50;
    const x = -40 + rnd(k) * 1160, y = y0 + rnd(k + 0.3) * (y1 - y0), r = 24 + rnd(k + 0.6) * 44;
    const tw = 0.75 + 0.25 * Math.sin(t * (0.7 + rnd(k + 0.9)) + i * 1.7);
    return <circle key={i} cx={x} cy={y} r={r} fill="url(#bokeh)" opacity={tw} />;
  })}
</g>;
export const Wall: React.FC<{t: number}> = ({t}) => <g>
  <rect x={-200} y={-200} width={1480} height={1700} fill="url(#wall)" />
  {/* panel mouldings */}
  {[-60, 760].map((x, i) => <rect key={i} x={x} y={340} width={380} height={620} rx={14} fill="none" stroke={C.champagne} strokeWidth={6} opacity={0.7} />)}
  {/* arch window, soft light */}
  <path d="M 380 900 L 380 470 A 160 160 0 0 1 700 470 L 700 900 Z" fill="url(#win)" stroke={C.champagne} strokeWidth={12} />
  <path d="M 540 310 L 540 900 M 380 560 L 700 560" stroke={C.champagne} strokeWidth={8} />
  <ellipse cx={540} cy={560} rx={250} ry={330} fill="url(#glow)" opacity={0.6} />
  {/* string-light swag */}
  <path d="M -20 300 Q 270 400 540 330 T 1100 300" fill="none" stroke={C.aubergine} strokeWidth={3} opacity={0.35} />
  {Array.from({length: 13}, (_, i) => {
    const x = i * 85 - 10, y = 300 + Math.sin(i / 12 * Math.PI) * 55 + (i % 2) * 6;
    return <g key={i}><circle cx={x} cy={y + 12} r={34} fill="url(#bokeh)" opacity={0.7 + 0.3 * Math.sin(t * 1.3 + i)} /><circle cx={x} cy={y + 12} r={7} fill="#FFF1C2" /></g>;
  })}
  <Bokeh t={t} />
</g>;
const Guest: React.FC<{x: number; y: number; s: number; col: string; hair: string}> = ({x, y, s, col, hair}) => <g transform={`translate(${x} ${y}) scale(${s})`}>
  <path d="M -90 220 Q -90 90 0 80 Q 90 90 90 220 Z" fill={col} />
  <circle cx={0} cy={20} r={56} fill="#E6B795" /><path d="M -58 10 Q -50 -50 0 -52 Q 50 -50 58 10 Q 30 -14 0 -14 Q -30 -14 -58 10 Z" fill={hair} />
</g>;
export const Extras: React.FC = () => <g filter="url(#blur6)" opacity={0.7}>
  <Guest x={500} y={640} s={0.55} col={C.terracotta} hair={C.hairHim} />
  <Guest x={600} y={650} s={0.5} col={C.eucalyptus} hair={C.hairHer} />
  <Guest x={36} y={700} s={0.7} col={C.marigold} hair={C.hairHer} />
  <Guest x={1050} y={700} s={0.7} col={C.sage} hair={C.hairHim} />
</g>;
export const Centerpiece: React.FC<{t: number}> = ({t}) => <g>
  <SoftEllipse x={540} y={1090} w={200} h={30} op={0.3} />
  <path d="M 500 1090 Q 495 960 515 880 L 565 880 Q 585 960 580 1090 Z" fill={C.eucalyptus} stroke={C.eucDeep} strokeWidth={4} />
  {[-1, 0, 1].map((k) => <ellipse key={k} cx={540 + k * 46} cy={820 - Math.abs(k) * -20} rx={26} ry={62} fill={k ? C.sage : C.eucDeep} transform={`rotate(${k * 24 + Math.sin(t * 0.8 + k) * 2} ${540 + k * 46} 880)`} />)}
  {[-70, 65].map((dx, i) => <circle key={i} cx={540 + dx} cy={770 + i * 24} r={22} fill={i ? C.terracotta : C.marigold} />)}
  <circle cx={540} cy={742} r={18} fill={C.cloth} />
  {/* candle */}
  <rect x={527} y={706} width={26} height={40} rx={6} fill={C.cloth} opacity={0} />
</g>;

// ---------------------------------------------------------------------------------------- the table (mid plane)
export const Table: React.FC<{t: number; dessert: boolean}> = ({t, dessert}) => <g>
  <rect x={-60} y={1100} width={1200} height={1000} fill={C.cloth} />
  <rect x={-60} y={1290} width={1200} height={900} fill="#F2E7CF" />
  {[120, 330, 540, 750, 960].map((x, i) => <path key={i} d={`M ${x} 1290 Q ${x + 14} 1500 ${x} 1800`} stroke="#D9C9A0" strokeWidth={6} fill="none" opacity={0.7} />)}
  <rect x={-60} y={1094} width={1200} height={14} fill={C.champagne} />
  <rect x={-60} y={1108} width={1200} height={26} fill={C.aubergine} opacity={0.08} />
  <path d="M -60 1236 Q 540 1262 1140 1236 L 1140 1300 L -60 1300 Z" fill={C.eucalyptus} opacity={0.55} />
  <rect x={-60} y={1350} width={1200} height={64} fill={C.eucalyptus} opacity={0.55} />
  {Array.from({length: 14}, (_, i) => <circle key={i} cx={i * 86 + 20} cy={1382} r={11} fill={i % 2 ? C.marigold : C.terracotta} />)}
  {/* lazy Susan disc */}
  <SoftEllipse x={540} y={1232} w={900} h={96} op={0.22} />
  <ellipse cx={540} cy={1222} rx={430} ry={52} fill={C.champagne} stroke="#CDB985" strokeWidth={5} />
  <ellipse cx={540} cy={1218} rx={390} ry={40} fill="none" stroke="#CDB985" strokeWidth={3} opacity={0.7} />
  {!dessert ? <g>
    {/* candle + bread basket */}
    <SoftEllipse x={470} y={1222} w={90} h={16} op={0.25} />
    <rect x={448} y={1160} width={44} height={62} rx={8} fill={C.cloth} stroke={C.champagne} strokeWidth={4} />
    <ellipse cx={470} cy={1146 + Math.sin(t * 9) * 1.5} rx={9 + Math.sin(t * 11) * 1.2} ry={19} fill={C.marigold} />
    <SoftEllipse x={690} y={1226} w={170} h={20} op={0.25} />
    <path d="M 620 1196 Q 690 1250 760 1196 Z" fill={C.terracotta} /><ellipse cx={690} cy={1192} rx={70} ry={16} fill="#E9A06E" />
    <ellipse cx={668} cy={1182} rx={34} ry={13} fill="#F0C48C" /><ellipse cx={716} cy={1184} rx={30} ry={12} fill="#E7B070" />
  </g> : <g>
    {[440, 660].map((x, i) => <g key={i}>
      <SoftEllipse x={x} y={1232} w={200} h={26} op={0.28} />
      <ellipse cx={x} cy={1214} rx={92} ry={26} fill={C.cloth} stroke={C.champagne} strokeWidth={5} />
      <path d={`M ${x - 46} 1214 L ${x + 42} 1198 L ${x + 42} 1172 L ${x - 46} 1188 Z`} fill={i ? '#F0C48C' : '#F6E7C4'} stroke="#CDB985" strokeWidth={3} />
      <path d={`M ${x - 46} 1188 L ${x + 42} 1172 L ${x + 24} 1162 L ${x - 58} 1178 Z`} fill={C.terracotta} />
      <circle cx={x + 6} cy={1158} r={9} fill="#B2472A" />
    </g>)}
  </g>}
</g>;

export const NearPlane: React.FC<{t: number}> = ({t}) => <g filter="url(#blur14)" opacity={0.85}>
  {/* sprigs bottom-left, champagne flute at the bottom-right edge (below the ad-safe line) */}
  {[0, 1, 2, 3, 4].map((i) => <ellipse key={i} cx={30 + i * 55} cy={1420 - i * 14} rx={36} ry={120} fill={i % 2 ? C.eucDeep : C.eucalyptus}
    transform={`rotate(${-30 + i * 14 + Math.sin(t * 0.7 + i) * 2} ${30 + i * 55} 1520)`} />)}
  <path d="M 980 1330 L 1040 1330 L 1030 1560 Q 1010 1600 990 1560 Z" fill="#FFF3CC" opacity={0.7} />
  <rect x={1006} y={1560} width={8} height={160} fill="#FFF3CC" opacity={0.7} />
</g>;

// ---------------------------------------------------------------------------------------- the people
export type Mouth = 'flat' | 'smirk' | 'smile' | 'laugh' | 'o' | 'gulp';
export type PersonPose = {
  lookX: number; lookY: number; brow: number; browR: number; tilt: number; blush: number; laugh: number; lid: number;
  mouth: Mouth; happy?: boolean; sweat?: number; gulp?: number; glow: number;
};
export const POSE_CH = ['lookX', 'lookY', 'brow', 'browR', 'tilt', 'blush', 'laugh', 'lid'] as const;
export const mkPose = (v: number[], mouth: Mouth, glow: number, extra: Partial<PersonPose> = {}): PersonPose => ({
  lookX: v[0], lookY: v[1], brow: v[2], browR: v[3], tilt: v[4], blush: v[5], laugh: v[6], lid: v[7], mouth, glow, ...extra,
});

const Mouths: React.FC<{m: Mouth; laugh: number; t: number}> = ({m, laugh, t}) => {
  const ink = C.aubergine;
  switch (m) {
    case 'smile': return <path d="M -42 70 Q 0 108 42 70" fill="none" stroke={ink} strokeWidth={8} strokeLinecap="round" />;
    case 'smirk': return <path d="M -34 82 Q 4 86 40 60" fill="none" stroke={ink} strokeWidth={8} strokeLinecap="round" />;
    case 'flat': return <path d="M -30 80 Q 0 84 30 80" fill="none" stroke={ink} strokeWidth={8} strokeLinecap="round" />;
    case 'o': return <ellipse cx={0} cy={86} rx={16} ry={20} fill={ink} />;
    case 'gulp': return <path d="M -30 84 Q -15 74 0 84 T 30 84" fill="none" stroke={ink} strokeWidth={8} strokeLinecap="round" />;
    default: {
      const open = 46 + 10 * Math.sin(t * 24) * laugh;
      return <g>
        <path d={`M -58 62 Q 0 56 58 62 Q 50 ${62 + open} 0 ${62 + open + 6} Q -50 ${62 + open} -58 62 Z`} fill="#4B1A25" stroke={ink} strokeWidth={7} strokeLinejoin="round" />
        <path d="M -52 64 Q 0 58 52 64 L 48 80 Q 0 74 -48 80 Z" fill="#fff" />
        <ellipse cx={0} cy={62 + open - 4} rx={30} ry={14} fill={C.pink} />
      </g>;
    }
  }
};

export const Person: React.FC<{who: 'him' | 'her'; x: number; y: number; t: number; pose: PersonPose; seed: number; flip?: boolean}> = ({who, x, y, t, pose, seed, flip}) => {
  const him = who === 'him';
  const skin = him ? C.skinHim : C.skinHer;
  const skinDeep = him ? '#DC9C78' : '#9E6340';
  const id = who;
  const sx = flip ? -1 : 1;
  const bt = (t + seed) % 3.4;
  const blink = bt < 0.13 ? Math.sin((bt / 0.13) * Math.PI) : 0;
  const lid = Math.max(pose.lid, blink);
  const breathe = Math.sin(t * 1.7 + seed) * 3;
  const sway = Math.sin(t * 0.9 + seed) * 1.1;
  const L = pose.laugh;
  const shakeY = Math.sin(t * 38) * L * 5, shakeR = Math.sin(t * 29) * L * 1.8;
  const happy = !!pose.happy;
  const sc = 1.1;
  const eye = (sgn: number, brRaise: number) => {
    const ex = sgn * 58, ey = -2;
    const px = ex + pose.lookX * 11, py = ey + pose.lookY * 10;
    const cover = happy ? 1 : lid;
    return <g key={sgn}>
      <ellipse cx={ex} cy={ey} rx={34} ry={31} fill="#fff" stroke={C.aubergine} strokeWidth={4} />
      <circle cx={px} cy={py} r={16} fill={C.aubergine} /><circle cx={px + 5} cy={py - 6} r={5} fill="#fff" />
      <clipPath id={`${id}-eye${sgn}`}><ellipse cx={ex} cy={ey} rx={34} ry={31} /></clipPath>
      <g clipPath={`url(#${id}-eye${sgn})`}>
        <rect x={ex - 40} y={ey - 38} width={80} height={(cover) * 72 + 4} fill={skin} />
      </g>
      {cover > 0.05 && !happy && <path d={`M ${ex - 34} ${ey - 33 + cover * 66} Q ${ex} ${ey - 28 + cover * 66 + 10} ${ex + 34} ${ey - 33 + cover * 66}`} fill="none" stroke={C.aubergine} strokeWidth={5} strokeLinecap="round" />}
      {happy && <path d={`M ${ex - 32} ${ey + 8} Q ${ex} ${ey - 30} ${ex + 32} ${ey + 8}`} fill="none" stroke={C.aubergine} strokeWidth={8} strokeLinecap="round" />}
      {/* brow */}
      <path d={`M ${ex - 36} ${-60 - (pose.brow + brRaise) * 14 + (sgn > 0 ? 5 : -5) * 0 + 7 * sgn * -0} Q ${ex} ${-76 - (pose.brow + brRaise) * 16} ${ex + 36} ${-60 - (pose.brow + brRaise) * 14 + 4}`}
        fill="none" stroke={him ? C.hairHim : C.hairHer} strokeWidth={13} strokeLinecap="round" transform={`rotate(${sgn * 3} ${ex} -62)`} />
    </g>;
  };
  return <g transform={`translate(${x} ${y}) scale(${sx * sc} ${sc})`}>
    {/* body, behind head */}
    <g transform={`translate(0 ${shakeY * 1.2 + breathe * 0.6})`}>
      {!him && <circle cx={-96} cy={150} r={46} fill={C.hairHer} />}
      <path d="M -245 440 L -222 250 Q -205 160 -64 150 L 64 150 Q 205 160 222 250 L 245 440 Z" fill={him ? '#4A2A52' : C.sage} />
      <path d="M -245 440 L -222 250 Q -205 160 -64 150 L -40 160 Q -170 190 -190 290 L -200 440 Z" fill={C.aubergine} opacity={0.08} />
      {him ? <g>
        <path d="M -52 150 L 52 150 L 0 330 Z" fill={C.ivory} />
        <path d="M -52 150 L -20 200 L -70 230 Z M 52 150 L 20 200 L 70 230 Z" fill="#fff" stroke={C.champagne} strokeWidth={3} />
        <path d="M -52 150 L 0 330 L -80 300 L -150 190 Z" fill="#3A2042" />
        <path d="M 52 150 L 0 330 L 80 300 L 150 190 Z" fill="#3A2042" />
        {/* loosened terracotta tie */}
        <path d="M -16 196 L 18 196 L 24 224 L -12 224 Z" fill={C.terracotta} /><path d="M -10 224 L 20 224 L 36 340 L 6 366 L -14 340 Z" fill={C.terracotta} transform="rotate(-6 0 220)" />
        <path d="M -22 190 L 22 190" stroke={C.terraDeep} strokeWidth={5} />
      </g> : <g>
        <path d="M -78 150 Q 0 270 78 150 Z" fill={skin} />
        <path d="M -78 150 Q 0 270 78 150" fill="none" stroke={C.eucDeep} strokeWidth={6} />
        <path d="M -120 330 Q 0 380 120 330" fill="none" stroke={C.eucDeep} strokeWidth={5} opacity={0.5} />
      </g>}
    </g>
    {/* neck + gulp */}
    <rect x={-42} y={110} width={84} height={80} fill={skinDeep} />
    {!!pose.gulp && <ellipse cx={0} cy={158 + pose.gulp * 20} rx={16} ry={19} fill={skin} stroke={skinDeep} strokeWidth={5} />}
    {/* head */}
    <g transform={`translate(0 ${breathe + shakeY}) rotate(${sx * (pose.tilt + sway + shakeR)} 0 150)`}>
      {/* ears */}
      {[-1, 1].map((s) => <g key={s}><ellipse cx={s * 150} cy={14} rx={30} ry={38} fill={skin} />
        <ellipse cx={s * 150} cy={14} rx={17} ry={24} fill={him ? C.pink : skinDeep} opacity={him ? 0.6 + pose.blush * 0.35 : 0.5} /></g>)}
      {!him && [-1, 1].map((s) => <g key={s}><circle cx={s * 152} cy={68} r={15} fill={C.marigold} stroke="#B5801A" strokeWidth={3} /><rect x={s * 152 - 3} y={50} width={6} height={14} fill="#B5801A" /></g>)}
      <circle cx={0} cy={0} r={150} fill={skin} />
      {/* hair */}
      {him ? <g fill={C.hairHim}>
        <path d="M -152 -10 Q -165 -120 -80 -150 Q -40 -190 20 -160 Q 90 -184 130 -120 Q 170 -90 152 -10 Q 128 -70 80 -78 Q 30 -100 -20 -80 Q -90 -84 -152 -10 Z" />
        <path d="M -60 -150 L -80 -196 L -34 -158 Z M 10 -160 L 20 -210 L 52 -154 Z M 80 -140 L 118 -184 L 120 -126 Z" />
      </g> : <g fill={C.hairHer}>
        <path d="M -154 20 Q -170 -130 0 -156 Q 170 -130 154 20 Q 140 -50 70 -96 Q 0 -60 -70 -96 Q -140 -50 -154 20 Z" />
        <path d="M -154 20 Q -162 90 -120 110 Q -150 40 -128 -30 Z" />
      </g>}
      {/* cheeks */}
      {[-1, 1].map((s) => <circle key={s} cx={s * 92} cy={50} r={26} fill={C.pink} opacity={0.12 + pose.blush * 0.45} />)}
      {pose.glow > 0.01 && <ellipse cx={0} cy={70} rx={120} ry={80} fill="url(#glow)" opacity={pose.glow * 0.7} />}
      {eye(-1, 0)}{eye(1, pose.browR)}
      <path d="M -10 22 Q 0 38 14 30" fill="none" stroke={skinDeep} strokeWidth={7} strokeLinecap="round" />
      <Mouths m={pose.mouth} laugh={L} t={t} />
      {!!pose.sweat && <g transform={`translate(${-104} ${-70 + pose.sweat * 70})`} opacity={clamp(pose.sweat * 4) * (1 - clamp((pose.sweat - 0.85) * 6))}>
        <path d="M 0 -26 Q 16 4 0 16 Q -16 4 0 -26 Z" fill="#BFE3F2" stroke="#6BA6C2" strokeWidth={3} />
      </g>}
      {L > 0.6 && [-1, 1].map((s) => <g key={s} stroke={C.terracotta} strokeWidth={7} strokeLinecap="round" fill="none" opacity={0.8}>
        {[0, 1].map((k) => <path key={k} d={`M ${s * (186 + k * 16)} ${-70 + k * 36} L ${s * (216 + k * 18)} ${-92 + k * 40}`} />)}
      </g>)}
    </g>
  </g>;
};

// ---------------------------------------------------------------------------------------- hands, phones, marker
export const Hand: React.FC<{x: number; y: number; rot?: number; flip?: boolean; skin: string; thumb?: number}> = ({x, y, rot = 0, flip, skin, thumb = 0}) => <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${flip ? -1 : 1} 1)`}>
  <rect x={-44} y={-34} width={88} height={78} rx={34} fill={skin} stroke="#00000022" strokeWidth={3} />
  {[-30, -10, 10, 30].map((dx, i) => <rect key={i} x={dx - 9} y={-52 - (i === 1 || i === 2 ? 6 : 0)} width={18} height={40} rx={9} fill={skin} />)}
  <rect x={-66} y={-10 + thumb} width={34} height={22} rx={11} fill={skin} transform={`rotate(-24 -50 0)`} />
</g>;

export const Marker: React.FC<{x: number; y: number; rot: number; capped: boolean}> = ({x, y, rot, capped}) => <g transform={`translate(${x} ${y}) rotate(${rot})`}>
  <rect x={-80} y={-13} width={130} height={26} rx={13} fill="#26202B" />
  <rect x={-8} y={-13} width={26} height={26} fill={C.marigold} />
  <path d="M 50 -9 L 76 -4 L 76 4 L 50 9 Z" fill="#26202B" />
  {capped ? <rect x={46} y={-15} width={62} height={30} rx={13} fill="#3A3140" /> : <path d="M 76 -3 L 90 0 L 76 3 Z" fill="#000" />}
</g>;

export const PhoneBody: React.FC<{who: 'him' | 'her'; t: number; cardPhase: number; k: number; swipeDir: number; showCard: boolean}> = ({who, cardPhase, k, swipeDir, showCard}) => {
  // k: 0 face up in hand .. 1 lying face down
  const back = k > 0.5;
  const caseCol = who === 'him' ? '#2E2A3A' : C.marigold;
  if (back) return <g><SoftRect x={-60} y={-100} w={120} h={200} r={22} dx={8} dy={10} op={0.3} />
    <rect x={-60} y={-100} width={120} height={200} rx={22} fill={caseCol} stroke={C.aubergine} strokeWidth={4} />
    <circle cx={-30} cy={-68} r={17} fill={C.aubergine} opacity={0.75} /><circle cx={-30} cy={-68} r={8} fill="#6E6A86" /></g>;
  return <g>
    <SoftRect x={-60} y={-100} w={120} h={200} r={22} dx={10} dy={14} op={0.28} />
    <rect x={-60} y={-100} width={120} height={200} rx={22} fill="#1B1220" />
    <rect x={-52} y={-92} width={104} height={184} rx={16} fill="#FFE9AE" />
    <ellipse cx={0} cy={0} rx={70} ry={110} fill="url(#bokeh)" opacity={0.7} />
    {/* generic glowing card, nothing else on screen */}
    <rect x={-34} y={-58} width={68} height={92} rx={12} fill="#FFFBEF" opacity={0.6} transform="translate(0 6) scale(0.94)" />
    {showCard && <g transform={`translate(${swipeDir * cardPhase * 150} ${cardPhase * 10}) rotate(${swipeDir * cardPhase * 26})`} opacity={1 - clamp((cardPhase - 0.6) * 2.5)}>
      <rect x={-38} y={-70} width={76} height={110} rx={13} fill="#FFFFFF" stroke="#F2B632" strokeWidth={4} />
      <circle cx={0} cy={-26} r={20} fill="#F6E1B3" /><rect x={-24} y={12} width={48} height={8} rx={4} fill="#F6E1B3" />
    </g>}
  </g>;
};

export const Thumb: React.FC<{x: number; y: number; rot: number; skin: string}> = ({x, y, rot, skin}) =>
  <g transform={`translate(${x} ${y}) rotate(${rot})`}><rect x={-17} y={-30} width={34} height={104} rx={17} fill={skin} stroke="#00000022" strokeWidth={3} /><ellipse cx={0} cy={-14} rx={9} ry={7} fill="#fff" opacity={0.3} /></g>;

// ---------------------------------------------------------------------------------------- tent card
export const CARD_W = 700, CARD_H = 290;
const PRINT = (s: number) => `italic 700 ${s}px "Gelasio"`;
const HAND = (s: number) => `400 ${s}px "Permanent Marker"`;
export type Line = {text: string; x0: number; y: number; size: number; rot: number; color: string; prog: number};
export const writeLine = (text: string, y: number, rot: number, color: string, prog: number, size = 56): Line => {
  const s = fitSize(text, HAND, size, 600);
  return {text, x0: -textW(text, HAND(s)) / 2, y, size: s, rot, color, prog};
};
/** local tip position of the marker for a Line at progress */
export const tipOf = (l: Line): [number, number] => {
  const n = Math.round(l.text.length * clamp(l.prog));
  const w = textW(l.text.slice(0, n), HAND(l.size));
  return [l.x0 + w + 6, l.y - l.size * 0.28 + Math.sin(n * 2.1) * 3];
};

export const TentCard: React.FC<{face: 'front' | 'back'; lines: Line[]; scaleX: number; printed?: string}> = ({face, lines, scaleX, printed = 'OLLIE · TABLE 9'}) => {
  const ps = fitSize(printed, PRINT, 64, 600);
  return <g transform={`scale(${scaleX} 1)`}>
    {/* hard offset shadow */}
    <rect x={-CARD_W / 2 + 16} y={-CARD_H / 2 + 18} width={CARD_W} height={CARD_H} rx={18} fill={C.aubergine} opacity={0.88} />
    <rect x={-CARD_W / 2} y={-CARD_H / 2} width={CARD_W} height={CARD_H} rx={18} fill="#FFFDF6" stroke={C.aubergine} strokeWidth={6} />
    <rect x={-CARD_W / 2 + 3} y={-CARD_H / 2 + 3} width={CARD_W - 6} height={34} rx={15} fill={C.champagne} />
    <path d={`M ${-CARD_W / 2 + 3} ${-CARD_H / 2 + 38} L ${CARD_W / 2 - 3} ${-CARD_H / 2 + 38}`} stroke="#CDB985" strokeWidth={4} />
    <rect x={-CARD_W / 2 + 28} y={CARD_H / 2 - 30} width={CARD_W - 56} height={4} fill={C.eucalyptus} opacity={0.5} />
    {face === 'front'
      ? <text x={0} y={-48} textAnchor="middle" fontFamily={GEL} fontStyle="italic" fontWeight={700} fontSize={ps} fill={C.aubergine} letterSpacing={2}>{printed}</text>
      : <text x={0} y={-70} textAnchor="middle" fontFamily={GEL} fontStyle="italic" fontWeight={700} fontSize={44} fill={C.aubergine} letterSpacing={3}>TABLE 9 · RESERVED</text>}
    {lines.map((l, i) => {
      const n = Math.round(l.text.length * clamp(l.prog));
      return n > 0 ? <text key={i} x={l.x0} y={l.y} fontFamily={MARK} fontSize={l.size} fill={l.color} transform={`rotate(${l.rot} 0 ${l.y})`}>{l.text.slice(0, n)}</text> : null;
    })}
  </g>;
};

// ---------------------------------------------------------------------------------------- strips
export const Strip: React.FC<{text: string; y: number; age: number; out?: number; size?: number; maxW?: number; ink?: boolean; rot?: number}> = ({text, y, age, out = 0, size = 56, maxW = 960, ink = false, rot = 0}) => {
  const font = (s: number) => `800 ${s}px "Nunito Sans"`;
  const inner = maxW - 84;
  const width = (ls: string[], s: number) => Math.max(...ls.map((l) => textW(l, font(s))));
  let lines = [text];
  if (width(lines, size) > inner) {
    const ws = text.split(' ');
    let best = Infinity;
    for (let i = 1; i < ws.length; i++) {
      const ls = [ws.slice(0, i).join(' '), ws.slice(i).join(' ')];
      const w = width(ls, size);
      if (w < best) { best = w; lines = ls; }
    }
  }
  let s = size;
  while (s > 24 && width(lines, s) > inner) s -= 2;
  const lh = s * 1.12, h = lines.length * lh + 42, w = Math.min(maxW, width(lines, s) + 84);
  if (y < 600) y = Math.max(y, 284 + h / 2);
  const pop = smooth(age, 0, 0.1) * (1 + 0.07 * Math.sin(clamp(age / 0.32) * Math.PI));
  const fg = ink ? C.ivory : C.aubergine, bg = ink ? C.aubergine : C.marigold;
  return <g opacity={1 - out} transform={`translate(540 ${y - out * 14}) rotate(${rot}) scale(${pop}) translate(-540 ${-y})`}>
    <rect x={540 - w / 2 + 11} y={y - h / 2 + 13} width={w} height={h} rx={34} fill={C.aubergine} opacity={0.85} />
    <rect x={540 - w / 2} y={y - h / 2} width={w} height={h} rx={34} fill={bg} stroke={C.aubergine} strokeWidth={6} />
    {lines.map((l, i) => <text key={i} x={540} y={y - ((lines.length - 1) * lh) / 2 + i * lh + s * 0.35} textAnchor="middle" fontFamily={NUN} fontWeight={800} fontSize={s} fill={fg}>{l}</text>)}
  </g>;
};

// ---------------------------------------------------------------------------------------- lazy Susan wipe
export const WIPE_DUR = 0.6;
export const wipeK = (k: number) => k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
export const SUSAN = {cx: 540, cy: 1180};
export const wipeR = (k: number) => 1500 * wipeK(k);
export const SusanRing: React.FC<{k: number; dir?: 1 | -1}> = ({k, dir = 1}) => {
  const r = wipeR(k), ang = dir * 760 * wipeK(k);
  return <g transform={`translate(${SUSAN.cx} ${SUSAN.cy})`} opacity={1 - clamp((k - 0.9) * 10)}>
    <circle r={r + 34} fill="none" stroke={C.aubergine} strokeWidth={10} opacity={0.5} />
    <circle r={r + 8} fill="none" stroke={C.champagne} strokeWidth={64} />
    <circle r={r - 26} fill="none" stroke="#CDB985" strokeWidth={6} />
    <g transform={`rotate(${ang})`}>
      {Array.from({length: 18}, (_, i) => <g key={i} transform={`rotate(${i * 20}) translate(0 ${-(r + 8)})`}>
        <rect x={-9} y={-24} width={18} height={48} rx={8} fill={i % 3 === 0 ? C.terracotta : i % 3 === 1 ? C.eucalyptus : C.marigold} stroke={C.aubergine} strokeWidth={3} />
      </g>)}
    </g>
  </g>;
};

// ---------------------------------------------------------------------------------------- vote board + end card
const VFONT = (s: number) => `italic 700 ${s}px "Gelasio"`;
export const VoteCard: React.FC<{letter: string; l1: string; l2: string; y: number; age: number; col: string; rot: number; lift?: number}> = ({letter, l1, l2, y, age, col, rot, lift = 0}) => {
  const p = age < 0 ? 0 : 1 + Math.sin(clamp(age / 0.45) * Math.PI * 1.5) * Math.exp(-clamp(age / 0.45) * 4.2) * 0.4 - Math.exp(-clamp(age / 0.45) * 9) * (1 - clamp(age / 0.45));
  const w = 880, h = 300;
  const s = Math.min(fitSize(l1, VFONT, 70, 560), fitSize(l2, VFONT, 70, 560));
  return <g transform={`translate(540 ${y + h / 2 - lift}) rotate(${rot * p}) scale(${p}) translate(-540 ${-(y + h / 2)})`} opacity={clamp(age * 10)}>
    <rect x={540 - w / 2 + 16} y={y + 18} width={w} height={h} rx={22} fill={C.aubergine} opacity={0.88} />
    <rect x={540 - w / 2} y={y} width={w} height={h} rx={22} fill="#FFFDF6" stroke={C.aubergine} strokeWidth={6} />
    <rect x={540 - w / 2 + 3} y={y + 3} width={w - 6} height={34} rx={19} fill={C.champagne} />
    <circle cx={540 - w / 2 + 120} cy={y + h / 2 + 18} r={78} fill={col} stroke={C.aubergine} strokeWidth={6} />
    <text x={540 - w / 2 + 120} y={y + h / 2 + 58} textAnchor="middle" fontFamily={NUN} fontWeight={800} fontSize={118} fill={C.aubergine}>{letter}</text>
    <text x={540 - w / 2 + 240} y={y + h / 2 - 8} fontFamily={GEL} fontStyle="italic" fontWeight={700} fontSize={s} fill={C.aubergine}>{l1}</text>
    <text x={540 - w / 2 + 240} y={y + h / 2 + 84} fontFamily={GEL} fontStyle="italic" fontWeight={700} fontSize={s} fill={C.aubergine}>{l2}</text>
  </g>;
};

export const VoteBoard: React.FC<{t: number}> = ({t}) => <g>
  <rect x={-100} y={-100} width={1280} height={2100} fill={C.cloth} />
  <rect x={-100} y={-100} width={1280} height={500} fill="url(#wall)" />
  <Bokeh t={t} n={14} y0={150} y1={420} seed={3} />
  <SoftEllipse x={540} y={1010} w={1180} h={1180} op={0.18} />
  <g transform={`translate(540 960) rotate(${t * 6})`}>
    <circle r={620} fill={C.champagne} stroke="#CDB985" strokeWidth={8} />
    <circle r={560} fill="none" stroke="#CDB985" strokeWidth={4} opacity={0.7} />
    {Array.from({length: 12}, (_, i) => <path key={i} d={`M 0 0 L ${Math.cos(i * Math.PI / 6) * 560} ${Math.sin(i * Math.PI / 6) * 560}`} stroke="#CDB985" strokeWidth={3} opacity={0.5} />)}
    {Array.from({length: 24}, (_, i) => <circle key={i} cx={Math.cos(i * Math.PI / 12) * 596} cy={Math.sin(i * Math.PI / 12) * 596} r={9} fill={i % 2 ? C.eucalyptus : C.terracotta} />)}
  </g>
</g>;

export const EndCard: React.FC<{t: number; a: number; part?: number}> = ({t, a, part = 2}) => {
  const pop = a < 0.35 ? 1 + 0.12 * (1 - a / 0.35) : 1;
  const mk = (txt: string, y: number, size: number, fill: string, fg: string, wd: number) => <g transform={`translate(540 ${y}) scale(${pop}) translate(-540 ${-y})`}>
    <rect x={540 - wd / 2 + 12} y={y - size * 0.8 + 14} width={wd} height={size * 1.5} rx={36} fill={C.aubergine} opacity={0.88} />
    <rect x={540 - wd / 2} y={y - size * 0.8} width={wd} height={size * 1.5} rx={36} fill={fill} stroke={C.aubergine} strokeWidth={7} />
    <text x={540} y={y + size * 0.36} textAnchor="middle" fontFamily={NUN} fontWeight={800} fontSize={size} fill={fg}>{txt}</text>
  </g>;
  return <g>
    <rect x={-100} y={-100} width={1280} height={2100} fill="url(#wall)" />
    <Bokeh t={t} n={22} y0={250} y1={1300} seed={7} />
    <Wall t={t} />
    <rect x={-100} y={-100} width={1280} height={2100} fill={C.ivory} opacity={0.82} />
    <Bokeh t={t} n={16} y0={280} y1={1250} seed={9} />
    {mk('table nine', 720, 150, C.cloth, C.aubergine, 900)}
    {mk(`part ${part}`, 940, 110, C.eucalyptus, C.aubergine, 520)}
    {mk('A or B', 1160, 150, C.marigold, C.aubergine, 620)}
  </g>;
};

export {rnd, lerp, clamp, smooth};
