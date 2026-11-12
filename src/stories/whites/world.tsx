import React from 'react';
import {clamp, lerp, smooth} from '../../lib/motion';
import {OPEN} from '../../lib/fonts';

// FIFTY WHITES (season 9): a hardware-store paint aisle. Flat paper cut-out half-figures with big round heads and a white
// die-cut edge, bright periwinkle pegboard planes in depth, soft ink-tinted shadows between planes, hard offset shadows on
// the paint chips and strips. Shared by parts 1-6: palette, camera, Person, Phone, Hand, ChipCard, Fan, Strip, fan-deck
// wipe, vote cards, end card.

export const C = {
  navy: '#1B2A4A', cobalt: '#2F5BFF', poppy: '#FF4F8B', sun: '#FFC400', mint: '#5EE0B5', cyan: '#5CF0FF',
  w1: '#FAFAF7', w2: '#F3EBDD', w3: '#EADFC8', w4: '#E4E8EA',
  hoodie: '#3A3D45', hoodieDeep: '#2A2D34', knit: '#CDBB9C', knitDeep: '#AE9A78',
  skinHim: '#EDB08A', skinHer: '#C58A60', hairHim: '#241A22', hairHer: '#3A2318',
  wall: '#BCCFFF', wallDeep: '#98AEF0', clip: '#8A5A3B',
};
export const INTER = OPEN.grotesk;
export const ANTON = OPEN.poster;
export const COUR = OPEN.typewriter;

// ---------------------------------------------------------------------------------------- measuring
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
  while (s > 16 && textW(txt, font(s)) > maxW) s -= 2;
  return s;
};

// ---------------------------------------------------------------------------------------- camera
export type Cam = {x: number; y: number; z: number};
export type CamKey = Cam & {t: number};
export const camAt = (keys: CamKey[], t: number): Cam => {
  if (t <= keys[0].t) return keys[0];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i].t) {
      const a = keys[i - 1], b = keys[i], k = smooth(t, a.t, b.t);
      return {x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z: lerp(a.z, b.z, k)};
    }
  }
  return keys[keys.length - 1];
};
export const planeT = (c: Cam, d: number) => {
  const s = 1 + (c.z - 1) * d;
  return `translate(${540 - (c.x - 540) * d} ${960 - (c.y - 960) * d}) scale(${s}) translate(-540 -960)`;
};

// ---------------------------------------------------------------------------------------- defs
export const Defs: React.FC = () => <defs>
  <radialGradient id="glow"><stop offset="0" stopColor={C.cyan} stopOpacity={0.95} /><stop offset="0.45" stopColor={C.cyan} stopOpacity={0.45} /><stop offset="1" stopColor={C.cyan} stopOpacity={0} /></radialGradient>
  <linearGradient id="scr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#B5FAFF" /><stop offset="1" stopColor="#38C6FF" /></linearGradient>
  <linearGradient id="wallg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#D5E1FF" /><stop offset="1" stopColor="#A9BFFF" /></linearGradient>
  <pattern id="peg" width="64" height="64" patternUnits="userSpaceOnUse"><circle cx="32" cy="32" r="6" fill={C.wallDeep} /></pattern>
  <pattern id="pegc" width="64" height="64" patternUnits="userSpaceOnUse"><circle cx="32" cy="32" r="6" fill="#6C8CFF" /></pattern>
  <filter id="blurCan"><feGaussianBlur stdDeviation="9" /></filter>
</defs>;

// ---------------------------------------------------------------------------------------- far planes
const RACK = [C.poppy, C.sun, C.mint, C.cobalt, C.w2, C.poppy, C.w3, C.sun, C.mint, C.w1, C.cobalt, C.poppy, C.w4, C.sun, C.mint, C.cobalt];
export const Backdrop: React.FC = () => <g>
  <rect x={-200} y={-200} width={1480} height={2400} fill="url(#wallg)" />
  <rect x={-200} y={-200} width={1480} height={2400} fill="url(#peg)" />
</g>;

export const Rack: React.FC<{t: number; ding: number; showSpk: number}> = ({ding, showSpk}) => <g>
  {/* chip racks */}
  <rect x={-60} y={300} width={1200} height={14} fill={C.navy} opacity={0.9} />
  {RACK.map((c, i) => <g key={i} transform={`translate(${-20 + i * 76} 318)`}>
    {[0, 1, 2, 3].map((j) => <rect key={j} x={0} y={j * 40} width={58} height={34} rx={5} fill={RACK[(i + j * 5) % RACK.length]} stroke={C.navy} strokeWidth={3} opacity={0.95} />)}
  </g>)}
  <rect x={-60} y={486} width={1200} height={14} fill={C.navy} opacity={0.9} />
  {/* intercom speaker */}
  <g transform="translate(540 580)" opacity={showSpk}>
    {[0, 1, 2].map((i) => {
      const a = clamp(ding - i * 0.12);
      return a > 0 && a < 1 ? <circle key={i} r={46 + a * 150} fill="none" stroke={C.navy} strokeWidth={7 * (1 - a)} opacity={1 - a} /> : null;
    })}
    <circle r={50} fill={C.w1} stroke={C.navy} strokeWidth={6} />
    {[-24, -8, 8, 24].map((y) => <line key={y} x1={-28} y1={y} x2={28} y2={y} stroke={C.navy} strokeWidth={5} strokeLinecap="round" />)}
  </g>
</g>;

export const Counter: React.FC = () => <g>
  <rect x={-200} y={1290} width={1480} height={800} fill={C.sun} />
  <rect x={-200} y={1290} width={1480} height={30} fill="#FFE27A" />
  <rect x={-200} y={1320} width={1480} height={8} fill={C.navy} />
  <rect x={-200} y={1328} width={1480} height={60} fill="#1B2A4A" opacity={0.14} />
</g>;

export const PaintCan: React.FC = () => <g filter="url(#blurCan)" transform="translate(-30 220)">
  <rect x={-40} y={1380} width={250} height={280} rx={24} fill={C.cobalt} />
  <rect x={-40} y={1380} width={250} height={36} fill="#ffffff" opacity={0.6} />
  <rect x={0} y={1470} width={170} height={90} rx={10} fill={C.w1} />
</g>;

// ---------------------------------------------------------------------------------------- people
export type Mouth = 'flat' | 'smirk' | 'o' | 'laugh' | 'smile' | 'gulp' | 'grit';
export type Pose = {look: [number, number]; browL: number; browR: number; worry: number; mouth: Mouth; happy: boolean; sweat: number; gulp: number; tilt: number; bob: number; blink: number};

const Mouthy: React.FC<{m: Mouth; t: number}> = ({m, t}) => {
  const st = {fill: 'none', stroke: C.navy, strokeWidth: 8, strokeLinecap: 'round' as const};
  switch (m) {
    case 'smirk': return <path d="M -42 84 Q -5 92 22 80 Q 38 72 46 58" {...st} />;
    case 'smile': return <path d="M -50 74 Q 0 120 50 74" {...st} />;
    case 'o': return <ellipse cx={0} cy={90} rx={22} ry={28} fill={C.navy} />;
    case 'gulp': return <path d="M -34 90 Q -14 78 0 90 Q 14 102 34 90" {...st} />;
    case 'grit': {
      const w = Math.sin(t * 38) * 3;
      return <g><rect x={-46} y={74 + w * 0.2} width={92} height={36} rx={14} fill={C.w1} stroke={C.navy} strokeWidth={7} />
        <line x1={-46} y1={92} x2={46} y2={92} stroke={C.navy} strokeWidth={4} />{[-23, 0, 23].map((x) => <line key={x} x1={x} y1={76} x2={x} y2={108} stroke={C.navy} strokeWidth={4} />)}</g>;
    }
    case 'laugh': return <g><path d="M -60 66 Q 0 62 60 66 Q 56 138 0 138 Q -56 138 -60 66 Z" fill={C.navy} /><ellipse cx={0} cy={122} rx={28} ry={15} fill={C.poppy} /></g>;
    default: return <path d="M -34 88 L 34 88" {...st} />;
  }
};

export const Person: React.FC<{who: 'him' | 'her'; x: number; y: number; t: number; pose: Pose; seed: number}> = ({who, x, y, t, pose, seed}) => {
  const him = who === 'him';
  const skin = him ? C.skinHim : C.skinHer;
  const hair = him ? C.hairHim : C.hairHer;
  const ph = Math.sin(t * 2.1 + seed);
  const sc = 1 + ph * 0.007;
  const bodyD = 'M -340 780 L -326 270 Q -306 200 -200 186 Q -100 176 -54 150 L 54 150 Q 100 176 200 186 Q 306 200 326 270 L 340 780 Z';
  const [lx, ly] = pose.look;
  const eyeY = -8, ex = 58;
  const blinkK = 1 - pose.blink;
  const brow = (side: number, raise: number) => {
    const bx = side * ex, by = -66 - raise * 22;
    const inner = pose.worry * 14;
    return <path d={`M ${bx - 34} ${by + (side < 0 ? 0 : -inner)} Q ${bx} ${by - 12} ${bx + 34} ${by + (side < 0 ? -inner : 0)}`} fill="none" stroke={hair} strokeWidth={him ? 13 : 10} strokeLinecap="round" />;
  };
  const skinDeep = him ? '#D79570' : '#A97048';
  return <g transform={`translate(${x} ${y + ph * 4})`}>
    {/* soft ink-tinted shadow */}
    <path d={bodyD} transform="translate(18 24)" fill={C.navy} opacity={0.1} />
    <path d={bodyD} transform="translate(9 12)" fill={C.navy} opacity={0.1} />
    <g transform={`scale(1 ${sc})`}>
      <path d={bodyD} fill="#fff" stroke="#fff" strokeWidth={38} strokeLinejoin="round" />
      <path d={bodyD} fill={him ? C.hoodie : C.knit} />
      {him ? <g>
        <ellipse cx={0} cy={190} rx={196} ry={64} fill={C.hoodieDeep} />
        <path d="M -40 238 L -46 360" stroke="#E8E4DA" strokeWidth={8} strokeLinecap="round" /><path d="M 40 238 L 48 350" stroke="#E8E4DA" strokeWidth={8} strokeLinecap="round" />
        <rect x={-264} y={520} width={528} height={140} rx={30} fill={C.hoodieDeep} opacity={0.55} />
      </g> : <g>
        <ellipse cx={0} cy={188} rx={118} ry={44} fill={C.knitDeep} />
        {Array.from({length: 17}, (_, i) => <line key={i} x1={-304 + i * 38} y1={250} x2={-304 + i * 38 + (i - 8) * 1.5} y2={780} stroke={C.knitDeep} strokeWidth={4} opacity={0.5} />)}
      </g>}
      <rect x={-46} y={110} width={92} height={104} fill={skinDeep} />
      <ellipse cx={0} cy={186 + pose.gulp * 18} rx={13} ry={11} fill={C.navy} opacity={0.16 + pose.gulp * 0.3} />
    </g>
    <g transform={`translate(0 ${pose.bob}) rotate(${pose.tilt} 0 120)`}>
      {/* die-cut edge for head + hair */}
      <circle r={168} fill="#fff" stroke="#fff" strokeWidth={36} />
      {!him && <ellipse cx={0} cy={-170} rx={100} ry={66} fill="#fff" stroke="#fff" strokeWidth={36} />}
      {!him && <path d="M -176 0 L -184 150 Q 0 190 184 150 L 176 0 Z" fill="#fff" stroke="#fff" strokeWidth={30} />}
      {/* ears */}
      <circle cx={-166} cy={14} r={32} fill={him ? '#F59A82' : skin} /><circle cx={166} cy={14} r={32} fill={him ? '#F59A82' : skin} />
      {!him && <g>
        <path d="M -176 -10 Q -190 100 -170 160 L 170 160 Q 190 100 176 -10 Z" fill={hair} />
        <ellipse cx={0} cy={-168} rx={96} ry={62} fill={hair} />
      </g>}
      <circle r={166} fill={skin} />
      <circle cx={-92} cy={52} r={26} fill={C.poppy} opacity={him ? 0.34 : 0.25} /><circle cx={92} cy={52} r={26} fill={C.poppy} opacity={him ? 0.34 : 0.25} />
      {/* hair */}
      {him
        ? <path d="M -172 -6 Q -190 -190 0 -192 Q 190 -190 172 -6 Q 160 -92 70 -112 Q 10 -78 -60 -104 Q -140 -92 -172 -6 Z" fill={hair} />
        : <g><path d="M -170 -12 Q -184 -180 0 -184 Q 184 -180 170 -12 Q 150 -96 40 -120 Q -60 -104 -170 -12 Z" fill={hair} />
          <g transform="translate(0 -176) rotate(-8)"><rect x={-70} y={-18} width={140} height={36} rx={14} fill={C.clip} stroke={C.navy} strokeWidth={4} />
            {[-48, -24, 0, 24, 48].map((x) => <line key={x} x1={x} y1={-14} x2={x} y2={14} stroke={C.navy} strokeWidth={3} opacity={0.5} />)}</g></g>}
      {/* eyes */}
      {[-1, 1].map((s) => pose.happy
        ? <path key={s} d={`M ${s * ex - 32} ${eyeY + 10} Q ${s * ex} ${eyeY - 34} ${s * ex + 32} ${eyeY + 10}`} fill="none" stroke={C.navy} strokeWidth={9} strokeLinecap="round" />
        : <g key={s}>
          <ellipse cx={s * ex} cy={eyeY} rx={37} ry={41 * blinkK + 2} fill="#fff" stroke={C.navy} strokeWidth={4} />
          <circle cx={s * ex + lx * 15} cy={eyeY + ly * 12} r={17 * (0.4 + 0.6 * blinkK)} fill={C.navy} />
          <circle cx={s * ex + lx * 15 + 6} cy={eyeY + ly * 12 - 6} r={5 * blinkK} fill="#fff" />
        </g>)}
      {brow(-1, pose.browL)}{brow(1, pose.browR)}
      <path d="M -6 28 Q 12 46 -4 52" fill="none" stroke={skinDeep} strokeWidth={6} strokeLinecap="round" />
      <Mouthy m={pose.mouth} t={t} />
      {/* sweat */}
      {pose.sweat > 0 && [[-150, -90, 0], [152, -50, 0.4], [-132, 40, 0.7], [120, -118, 0.2]].map(([dx, dy, o], i) => {
        const k = ((t * 0.9 + o) % 1);
        const a = pose.sweat * (i < 2 ? 1 : clamp((pose.sweat - 0.4) * 2));
        return <path key={i} transform={`translate(${dx} ${dy + k * 56 * pose.sweat}) scale(${0.8 + pose.sweat * 0.5})`} d="M 0 -24 Q 18 4 0 16 Q -18 4 0 -24 Z" fill="#B8F0FF" stroke={C.navy} strokeWidth={4} opacity={a * (1 - k * 0.7)} />;
      })}
    </g>
  </g>;
};

// ---------------------------------------------------------------------------------------- phone + hands
export const Card: React.FC = () => <g>
  <rect x={-66} y={-98} width={132} height={196} rx={18} fill="#fff" />
  <rect x={-54} y={-86} width={108} height={126} rx={12} fill="#CFE0FF" />
  <circle cx={0} cy={-44} r={22} fill="#7C8DB8" />
  <path d="M -42 40 Q -42 -8 0 -8 Q 42 -8 42 40 Z" fill="#7C8DB8" />
  <rect x={-48} y={56} width={96} height={12} rx={6} fill="#CFD6E6" /><rect x={-48} y={78} width={60} height={12} rx={6} fill="#CFD6E6" />
</g>;

export const PhoneUnit: React.FC<{who: 'him' | 'her'; x: number; y: number; rot: number; scale?: number; lit: number; p: number; dir: number; down: number; thumbOn: number}> = ({who, x, y, rot, scale = 1, lit, p, dir, down, thumbOn}) => {
  const him = who === 'him';
  const skin = him ? C.skinHim : C.skinHer;
  const sleeve = him ? C.hoodie : C.knit;
  const side = him ? -1 : 1;
  const sy = lerp(1, 0.5, down);
  const ang = rot + (him ? 82 : -82) * down;
  return <g transform={`translate(${x} ${y}) scale(${scale} ${scale * sy}) rotate(${ang})`}>
    {lit > 0.01 && down < 0.9 && <circle r={260} fill="url(#glow)" opacity={lit * (1 - down)} />}
    <g opacity={1 - down}><path d={`M ${side * 10} 150 L ${side * 70} 760`} stroke="#fff" strokeWidth={146} strokeLinecap="round" /><path d={`M ${side * 10} 150 L ${side * 70} 760`} stroke={sleeve} strokeWidth={112} strokeLinecap="round" /></g>
    <rect x={-92} y={-162} width={184} height={324} rx={34} fill="#fff" stroke="#fff" strokeWidth={14} />
    <rect x={-92} y={-162} width={184} height={324} rx={34} fill={down > 0.5 ? '#2A3350' : '#0E1630'} />
    {down < 0.5 ? <g>
      <rect x={-80} y={-150} width={160} height={300} rx={26} fill={lit > 0.3 ? 'url(#scr)' : '#1A2442'} />
      {lit > 0.3 && <g>
        <g transform="translate(0 10) scale(0.92)" opacity={0.7}><Card /></g>
        <g transform={`translate(${p * dir * 210} ${-p * 14}) rotate(${p * dir * 20}) translate(0 8)`} opacity={1 - smooth(p, 0.55, 1)}><Card /></g>
      </g>}
    </g> : <g><circle cx={-48} cy={-114} r={20} fill="#0E1630" stroke="#fff" strokeWidth={3} opacity={0.6} /><circle cx={-48} cy={-114} r={9} fill="#5C6A99" /></g>}
    {down < 0.5 && <g opacity={1 - down * 2}>
      <ellipse cx={-side * 98} cy={20} rx={20} ry={34} fill={skin} stroke="#00000033" strokeWidth={3} />
      <ellipse cx={-side * 98} cy={74} rx={20} ry={30} fill={skin} stroke="#00000033" strokeWidth={3} />
      <g transform={`translate(${side * 38 + (p * dir * 20) * thumbOn} ${70 - p * 30 * thumbOn}) rotate(${side * -22})`}>
        <ellipse rx={24} ry={50} fill={skin} stroke="#00000033" strokeWidth={3} /><ellipse cx={0} cy={-26} rx={11} ry={8} fill="#fff" opacity={0.35} />
      </g>
    </g>}
  </g>;
};

export type HandStyle = 'fist' | 'palm';
export const FreeHand: React.FC<{who: 'him' | 'her'; hx: number; hy: number; rot: number; thumb: number; style?: HandStyle; base: [number, number]; wiggle?: number; opacity?: number}> = ({who, hx, hy, rot, thumb, style = 'fist', base, wiggle = 0, opacity = 1}) => {
  const him = who === 'him';
  const skin = him ? C.skinHim : C.skinHer;
  const sleeve = him ? C.hoodie : C.knit;
  const my = (hy + base[1]) / 2;
  const d = `M ${base[0]} ${base[1]} Q ${(hx + base[0]) / 2 + (him ? -50 : 50)} ${my} ${hx} ${hy + 20}`;
  return <g opacity={opacity}>
    <path d={d} fill="none" stroke="#fff" strokeWidth={132} strokeLinecap="round" />
    <path d={d} fill="none" stroke={sleeve} strokeWidth={100} strokeLinecap="round" />
    <g transform={`translate(${hx} ${hy}) rotate(${rot})`}>
      {!him && <g><rect x={-54} y={34} width={108} height={34} rx={12} fill={C.knitDeep} />{[[-30, 52, C.poppy], [10, 46, C.cobalt], [34, 58, C.mint]].map(([x, y, c], i) => <circle key={i} cx={x as number} cy={y as number} r={6} fill={c as string} />)}</g>}
      {style === 'fist' ? <g>
        <rect x={-48} y={-46} width={96} height={96} rx={38} fill={skin} stroke="#00000033" strokeWidth={3} />
        {[-20, 4, 28].map((x) => <line key={x} x1={x} y1={-40} x2={x} y2={-14} stroke="#00000033" strokeWidth={3} />)}
        <g transform={`translate(-34 -26) rotate(${-30 + thumb * -50})`}><ellipse rx={21} ry={52} cy={-28} fill={skin} stroke="#00000033" strokeWidth={3} /><ellipse cx={0} cy={-52} rx={9} ry={7} fill="#fff" opacity={0.35} /></g>
      </g> : <g>
        <rect x={-46} y={-44} width={92} height={92} rx={30} fill={skin} stroke="#00000033" strokeWidth={3} />
        {[0, 1, 2, 3].map((i) => <rect key={i} x={-140 - (i === 1 || i === 2 ? 14 : 0)} y={-50 + i * 24 + Math.sin(wiggle * 14 + i) * 3} width={100 + (i === 1 || i === 2 ? 14 : 0)} height={25} rx={12} fill={skin} stroke="#00000033" strokeWidth={3} />)}
        <ellipse cx={-14} cy={-62} rx={44} ry={19} fill={skin} stroke="#00000033" strokeWidth={3} transform="rotate(-14 -14 -62)" />
      </g>}
    </g>
  </g>;
};

// ---------------------------------------------------------------------------------------- paint chips
export type ChipLine = {txt: string; y: number; p: number};
export const ChipCard: React.FC<{w: number; h: number; swatch: string; label: string; m: number; face?: 'front' | 'back'; lines?: ChipLine[]; vlabel?: boolean; id?: string}> = ({w, h, swatch, label, m, face = 'front', lines = [], vlabel = true, id = 'c'}) => {
  const font = (s: number) => `800 ${s}px Inter`;
  const ls = fitSize(label, font, 120, w - 50);
  return <g>
    <rect x={-w / 2 + 12} y={-h / 2 + 16} width={w} height={h} rx={20} fill={C.navy} opacity={0.22} />
    <rect x={-w / 2 + 6} y={-h / 2 + 8} width={w} height={h} rx={20} fill={C.navy} opacity={0.18} />
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={20} fill={face === 'back' ? '#F6F1E5' : C.w1} stroke={C.navy} strokeWidth={6} />
    {face === 'front' ? <g>
      <rect x={-w / 2 + 14} y={-h / 2 + 14} width={w - 28} height={h * 0.63} rx={12} fill={swatch} />
      <rect x={-w / 2 + 14} y={-h / 2 + 14} width={w - 28} height={h * 0.63} rx={12} fill="none" stroke={C.navy} strokeWidth={2.5} opacity={0.35} />
      {m > 0.5 && <text x={0} y={h / 2 - (h * 0.37 - 28) / 2 + ls * 0.36} textAnchor="middle" fontFamily={INTER} fontWeight={800} fontSize={ls} fill={C.navy} opacity={smooth(m, 0.5, 0.9)}>{label}</text>}
      {vlabel && m < 0.7 && <text transform={`translate(${-w / 2 + 38} ${-h / 2 + h * 0.6}) rotate(-90)`} fontFamily={INTER} fontWeight={800} fontSize={30} fill={C.navy} opacity={0.6 * (1 - m)}>{label}</text>}
    </g> : <g>
      {[-1, 0, 1, 2].map((i) => <line key={i} x1={-w / 2 + 30} x2={w / 2 - 30} y1={-h * 0.02 + i * 96 + 40} y2={-h * 0.02 + i * 96 + 40} stroke="#C9D2E6" strokeWidth={3} />)}
      {lines.map((l, i) => {
        const fs = fitSize(l.txt, (s) => `700 ${s}px "Courier Prime"`, 68, w - 60);
        const tw = textW(l.txt, `700 ${fs}px "Courier Prime"`);
        return <g key={i}><clipPath id={`${id}-wr${i}`}><rect x={-w / 2} y={l.y - 60} width={w / 2 + (-w / 2 + 28) + tw * l.p + 2} height={110} /></clipPath>
          <text x={-w / 2 + 30} y={l.y + fs * 0.3} fontFamily={COUR} fontWeight={700} fontSize={fs} fill="#2E3548" clipPath={`url(#${id}-wr${i})`}>{l.txt}</text></g>;
      })}
    </g>}
  </g>;
};

// the fan deck
export const FAN = {px: 540, py: 1430, len: 680, w: 165, span: 27};
export const slotAngle = (i: number, n = 8, spread = 1) => (-FAN.span + (i * 2 * FAN.span) / (n - 1)) * spread;
export const slotXf = (i: number, spread = 1, n = 8) => {
  const a = slotAngle(i, n, spread), r = (a * Math.PI) / 180, c = FAN.len / 2;
  return {x: FAN.px + c * Math.sin(r), y: FAN.py - c * Math.cos(r), rot: a};
};
export const tipOf = (i: number, spread = 1) => {
  const a = (slotAngle(i, 8, spread) * Math.PI) / 180;
  return {x: FAN.px + FAN.len * Math.sin(a), y: FAN.py - FAN.len * Math.cos(a)};
};

// ---------------------------------------------------------------------------------------- strips
export const Strip: React.FC<{text: string; y: number; age: number; out?: number; size?: number; maxW?: number; hot?: boolean; rot?: number}> = ({text, y, age, out = 0, size = 56, maxW = 960, hot = false, rot = 0}) => {
  const font = (s: number) => `800 ${s}px Inter`;
  const inner = maxW - 84;
  const width = (ls: string[], s: number) => Math.max(...ls.map((l) => textW(l, font(s))));
  let lines = [text];
  if (width(lines, size) > inner && text.includes('. ')) {
    const at = text.indexOf('. ') + 1;
    lines = [text.slice(0, at), text.slice(at + 1)];
  } else if (width(lines, size) > inner) {
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
  const lh = s * 1.12, h = lines.length * lh + 44, w = Math.min(maxW, width(lines, s) + 84);
  if (y < 600) y = Math.max(y, 284 + h / 2);
  const pop = smooth(age, 0, 0.1) * (1 + 0.07 * Math.sin(clamp(age / 0.32) * Math.PI));
  const bg = hot ? C.sun : '#fff';
  return <g opacity={1 - out} transform={`translate(540 ${y - out * 14}) rotate(${rot}) scale(${pop}) translate(-540 ${-y})`}>
    <rect x={540 - w / 2 + 12} y={y - h / 2 + 14} width={w} height={h} rx={16} fill={C.navy} />
    <rect x={540 - w / 2} y={y - h / 2} width={w} height={h} rx={16} fill={bg} stroke={C.navy} strokeWidth={6} />
    <rect x={540 - w / 2 + 6} y={y - h / 2 + 6} width={w - 12} height={14} rx={6} fill={hot ? C.poppy : C.sun} opacity={hot ? 0.0 : 1} />
    {lines.map((l, i) => <text key={i} x={540} y={y - ((lines.length - 1) * lh) / 2 + i * lh + s * 0.36 + 6} textAnchor="middle" fontFamily={INTER} fontWeight={800} fontSize={s} fill={C.navy}>{l}</text>)}
  </g>;
};

// ---------------------------------------------------------------------------------------- fan-deck wipe (chips fan open from the bottom-left corner)
export const WIPE_DUR = 0.7;
const PIV = {x: -30, y: 1960};
const wedge = (deg: number, hw: number) => {
  const pt = (a: number) => `${PIV.x + 3600 * Math.cos((a * Math.PI) / 180)},${PIV.y + 3600 * Math.sin((a * Math.PI) / 180)}`;
  return `${PIV.x},${PIV.y} ${pt(deg - hw)} ${pt(deg + hw)}`;
};
const wedgeAngles = (k: number) => Array.from({length: 8}, (_, i) => {
  const e = smooth(k, i * 0.02, 0.92);
  return {i, deg: -90 + e * i * (96 / 7), hw: 9 * smooth(k, 0, 0.12) + 2};
});
export const FanClip: React.FC<{k: number}> = ({k}) => <clipPath id="fanclip">{wedgeAngles(k).map((w) => <polygon key={w.i} points={wedge(w.deg, w.hw)} />)}</clipPath>;
export const FanRim: React.FC<{k: number}> = ({k}) => <g>
  {wedgeAngles(k).map((w) => <g key={w.i}>
    <polygon points={wedge(w.deg, w.hw)} fill="none" stroke={C.navy} strokeWidth={14} strokeLinejoin="round" />
    <polygon points={wedge(w.deg, w.hw)} fill="none" stroke={[C.w1, C.w2, C.w3, C.w4][w.i % 4]} strokeWidth={6} strokeLinejoin="round" />
  </g>)}
  <circle cx={PIV.x + 60} cy={PIV.y - 60} r={26} fill={C.navy} />
</g>;

// ---------------------------------------------------------------------------------------- vote + end card
export const VoteBg: React.FC<{t: number}> = ({t}) => <g>
  <rect x={-100} y={-100} width={1280} height={2200} fill={C.cobalt} />
  <rect x={-100} y={-100} width={1280} height={2200} fill="url(#pegc)" />
  <g transform={`translate(540 1700) rotate(${Math.sin(t * 0.6) * 1.5})`} opacity={0.9}>
    {Array.from({length: 8}, (_, i) => <g key={i} transform={`rotate(${-34 + i * (68 / 7)})`}><rect x={-75} y={-760} width={150} height={760} rx={16} fill={[C.w1, C.w2, C.w3, C.w4][i % 4]} stroke={C.navy} strokeWidth={6} /></g>)}
  </g>
</g>;

export const VoteCard: React.FC<{letter: string; l1: string; l2: string; y: number; age: number; swatch: string; rot: number; t: number}> = ({letter, l1, l2, y, age, swatch, rot, t}) => {
  if (age < 0) return null;
  const k = clamp(age / 0.36);
  const sc = k < 1 ? 1 + (Math.sin(k * Math.PI * 1.1) * 0.12) * (1 - k) * 2 + (k - 1) * 0 : 1;
  const s = smooth(age, 0, 0.14) * (age < 0.36 ? 1 + Math.sin(clamp(age / 0.36) * Math.PI) * 0.1 : 1);
  const bob = Math.sin(t * 2 + (letter === 'A' ? 0 : 1.7)) * 4;
  const w = 940, h = 270;
  const fs = fitSize(l1, (z) => `800 ${z}px Inter`, 124, w - 330);
  return <g transform={`translate(540 ${y + bob}) rotate(${rot}) scale(${s})`}>
    <rect x={-w / 2 + 16} y={-h / 2 + 18} width={w} height={h} rx={26} fill={C.navy} />
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={26} fill={swatch} stroke={C.navy} strokeWidth={8} />
    <circle cx={-w / 2 + 120} cy={0} r={78} fill={C.navy} /><text x={-w / 2 + 120} y={34} textAnchor="middle" fontFamily={INTER} fontWeight={800} fontSize={104} fill="#fff">{letter}</text>
    <text x={80} y={-4} textAnchor="middle" fontFamily={INTER} fontWeight={800} fontSize={fs} fill={C.navy}>{l1}</text>
    <text x={80} y={64} textAnchor="middle" fontFamily={INTER} fontWeight={700} fontSize={50} fill={C.navy} opacity={0.8}>{l2}</text>
  </g>;
};

export const EndCard: React.FC<{a: number; t: number}> = ({a, t}) => {
  const pop = (d: number) => smooth(a, d, d + 0.2) * (1 + 0.06 * Math.sin(clamp((a - d) / 0.4) * Math.PI));
  const open = smooth(a, 0, 0.7);
  return <g>
    <rect x={-100} y={-100} width={1280} height={2200} fill={C.cobalt} />
    <rect x={-100} y={-100} width={1280} height={2200} fill="url(#pegc)" />
    <g transform={`translate(540 1640) rotate(${Math.sin(t * 0.8) * 1.2})`}>
      {Array.from({length: 8}, (_, i) => <g key={i} transform={`rotate(${(-34 + i * (68 / 7)) * open})`}><rect x={-75} y={-640} width={150} height={640} rx={16} fill={[C.w1, C.w2, C.w3, C.w4][i % 4]} stroke={C.navy} strokeWidth={6} /></g>)}
      <circle r={24} fill={C.navy} />
    </g>
    <g transform={`translate(540 640) scale(${pop(0.15)}) translate(-540 -640)`}>
      <text x={546} y={662} textAnchor="middle" fontFamily={ANTON} fontSize={210} fill={C.navy}>fifty whites</text>
      <text x={540} y={650} textAnchor="middle" fontFamily={ANTON} fontSize={210} fill="#fff">fifty whites</text>
    </g>
    <g transform={`translate(540 860) scale(${pop(0.45)}) translate(-540 -860)`}>
      <text x={546} y={886} textAnchor="middle" fontFamily={ANTON} fontSize={112} fill={C.navy}>part 2 · A or B</text>
      <text x={540} y={874} textAnchor="middle" fontFamily={ANTON} fontSize={112} fill={C.sun}>part 2 · A or B</text>
    </g>
  </g>;
};
