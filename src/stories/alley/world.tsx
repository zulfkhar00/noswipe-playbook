import React from 'react';
import {clamp, lerp, smooth} from '../../lib/motion';

// "Across the Alley", the story account's third season: a silent paper-cut romance. Two neighbours
// in facing windows, both swiping at 2 AM, talk with paper signs held to the glass. Everything is
// cut paper in a rainy night (layered planes, soft drop shadows, a little edge wobble), lit only by
// the two warm windows and the cold glow of phones. No voices: signs are the dialogue.

export const C = {
  sky0: '#0e1230', sky1: '#272a5a', far: '#1b1f45', farLit: '#3b3a6a',
  wallL: '#22274f', wallR: '#262a57', trim: '#151937', brick: '#2c3262',
  his: '#ffb45e', his2: '#e07b3c', hers: '#ffab8e', hers2: '#d9677a', off: '#1a1d3e',
  ink: '#0b0e29', glow: '#d4e8ff', paper: '#f6f1e4', pen: '#23264a', card: '#c99258', card2: '#a8743f',
  moon: '#f4ecd2', heart: '#ff6b7a',
};
export const MARKER = '"Marker Felt", "Permanent Marker", "Chalkboard SE", "Patrick Hand", cursive';
export const TYPE = '"American Typewriter", "Courier Prime", "Courier New", monospace';
export const SERIF = 'Georgia, "Gelasio", "Times New Roman", serif';

export const HIS = {x: 210, y: 930};
export const HERS = {x: 870, y: 930};
export const WIN = {w: 340, h: 440};

/** Shared filters: paper drop shadow, a slight cut-paper wobble, film grain. */
export const Defs: React.FC<{blur: number}> = ({blur}) => <defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C.sky0} /><stop offset="1" stopColor={C.sky1} /></linearGradient>
  <filter id="paper" x="-10%" y="-10%" width="120%" height="120%">
    <feDropShadow dx="0" dy="7" stdDeviation="6" floodColor="#05061a" floodOpacity="0.55" />
  </filter>
  <filter id="soft"><feGaussianBlur stdDeviation="18" /></filter>
  <filter id="whip" x="-5%" y="0" width="110%" height="100%"><feGaussianBlur stdDeviation={`${blur} 0`} /></filter>
  <filter id="grain" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="7" />
    <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.07 0" />
  </filter>
  <radialGradient id="phoneglow"><stop offset="0" stopColor={C.glow} stopOpacity="0.55" /><stop offset="1" stopColor={C.glow} stopOpacity="0" /></radialGradient>
  <radialGradient id="lampHis" cx="0.3" cy="0.35" r="0.9"><stop offset="0" stopColor="#ffd59a" /><stop offset="0.55" stopColor={C.his} /><stop offset="1" stopColor={C.his2} /></radialGradient>
  <radialGradient id="lampHers" cx="0.7" cy="0.3" r="0.9"><stop offset="0" stopColor="#ffd8c2" /><stop offset="0.55" stopColor={C.hers} /><stop offset="1" stopColor={C.hers2} /></radialGradient>
</defs>;

/** Camera: world point (cx, cy) at the frame centre, zoom s. Planes with factor f move less (parallax). */
export type Cam = {cx: number; cy: number; s: number};
export const camAt = (keys: [number, number, number, number][], t: number): Cam => {
  let i = 0;
  while (i < keys.length - 2 && t >= keys[i + 1][0]) i++;
  const [t0, x0, y0, s0] = keys[i], [t1, x1, y1, s1] = keys[i + 1];
  const u = smooth(t, t0, t1);
  return {cx: lerp(x0, x1, u), cy: lerp(y0, y1, u), s: lerp(s0, s1, u)};
};
export const planeT = (cam: Cam, f: number) => {
  const s = 1 + (cam.s - 1) * f;
  return `translate(540 960) scale(${s}) translate(${-(540 + (cam.cx - 540) * f)} ${-(960 + (cam.cy - 960) * f)})`;
};

/** Far plane: sky, moon, a skyline of distant cut-paper buildings with a few lit windows. */
export const Far: React.FC = () => <g>
  <rect x={-800} y={-600} width={2700} height={3200} fill="url(#sky)" />
  <circle cx={760} cy={300} r={70} fill={C.moon} opacity={0.9} />
  <circle cx={790} cy={285} r={64} fill={C.sky0} opacity={0.18} />
  <g filter="url(#paper)">
    {[[-300, 520, 260], [-60, 430, 200], [130, 560, 240], [360, 470, 180], [560, 520, 220], [790, 450, 240], [1040, 540, 260], [1280, 480, 220]].map(([x, y, w], i) =>
      <g key={i}>
        <rect x={x} y={y} width={w} height={2000} fill={C.far} />
        {Array.from({length: 12}, (_, k) => <rect key={k} x={x + 24 + (k % 4) * (w / 4.4)} y={y + 40 + Math.floor(k / 4) * 70} width={18} height={26} fill={(i * 7 + k * 3) % 5 === 0 ? C.farLit : '#151838'} />)}
      </g>)}
  </g>
</g>;

/** One apartment window. `lamp` 0..1 is the interior light; children are drawn inside (clipped). */
export const Window: React.FC<{x: number; y: number; id: string; lamp: number; tone: 'his' | 'hers'; t: number; shut?: number; bare?: number; children?: React.ReactNode; front?: React.ReactNode}> = ({x, y, id, lamp, tone, t, shut = 0, bare = 0, children, front}) => {
  const {w, h} = WIN, l = x - w / 2, top = y - h / 2;
  const cw = lerp(55, w / 2 + 6, shut), cb = lerp(h - 120, h, shut);
  return <g>
    <clipPath id={`clip-${id}`}><rect x={l} y={top} width={w} height={h} /></clipPath>
    <g clipPath={`url(#clip-${id})`}>
      <rect x={l} y={top} width={w} height={h} fill={C.off} />
      <rect x={l} y={top} width={w} height={h} fill={`url(#${tone === 'his' ? 'lampHis' : 'lampHers'})`} opacity={lamp} />
      {/* Room details, cut paper in a darker tone of the light. */}
      <g opacity={(0.55 * lamp + 0.15) * (1 - bare)}>
        {tone === 'his' ? <>
          <rect x={l + 30} y={top + 40} width={90} height={120} fill={C.his2} opacity={0.6} />
          <rect x={l + 220} y={top + 70} width={110} height={10} fill={C.his2} />
          <rect x={l + 235} y={top + 40} width={18} height={30} fill={C.his2} /><rect x={l + 262} y={top + 30} width={14} height={40} fill={C.his2} />
          <rect x={l} y={top + h - 90} width={w} height={90} fill={C.his2} opacity={0.7} />
        </> : <>
          <path d={`M ${l} ${top + 50} Q ${x} ${top + 95} ${l + w} ${top + 45}`} stroke={C.hers2} strokeWidth={3} fill="none" />
          {Array.from({length: 9}, (_, k) => { const u = (k + 0.5) / 9; const yy = top + 50 + Math.sin(u * Math.PI) * 45 - u * 5;
            return <circle key={k} cx={l + u * w} cy={yy + 8} r={7} fill="#fff1c4" opacity={lamp * (0.7 + 0.3 * Math.sin(t * 3 + k))} />; })}
          <rect x={l + 250} y={top + 120} width={80} height={110} fill={C.hers2} opacity={0.5} />
          <rect x={l} y={top + h - 80} width={w} height={80} fill={C.hers2} opacity={0.7} />
        </>}
      </g>
      {children}
      {/* Glass: two faint reflection streaks and rain running down. */}
      <path d={`M ${l + 40} ${top} L ${l + 120} ${top} L ${l + 10} ${top + h} L ${l - 70} ${top + h} Z`} fill="#fff" opacity={0.05} />
      {Array.from({length: 7}, (_, k) => { const yy = ((t * (40 + k * 9) + k * 97) % (h + 60)) - 30;
        return <ellipse key={k} cx={l + 25 + k * 50} cy={top + yy} rx={3} ry={6} fill="#dfe8ff" opacity={0.35} />; })}
    </g>
    {/* Frame, cross bar, sill and curtains. */}
    <g filter="url(#paper)">
      <path d={`M ${l - 22} ${top - 22} h ${w + 44} v ${h + 44} h ${-w - 44} Z M ${l} ${top} v ${h} h ${w} v ${-h} Z`} fill={C.trim} fillRule="evenodd" />
      <rect x={l} y={top + 60} width={w} height={10} fill={C.trim} />
      <rect x={l - 40} y={top + h + 18} width={w + 80} height={24} fill={C.brick} />
      <g opacity={1 - bare}><path d={`M ${l} ${top} h ${cw} q ${-20 * (1 - shut)} ${h / 2} ${10 * (1 - shut)} ${cb} l ${-cw - 10 * (1 - shut)} 0 Z`} fill={tone === 'his' ? '#3c3e6e' : '#5b3f6c'} />
      <path d={`M ${l + w} ${top} h ${-cw} q ${20 * (1 - shut)} ${h / 2} ${-10 * (1 - shut)} ${cb} l ${cw + 10 * (1 - shut)} 0 Z`} fill={tone === 'his' ? '#3c3e6e' : '#5b3f6c'} /></g>
      {shut > 0 && <rect x={l} y={top} width={w} height={h} fill={C.hers} opacity={0.18 * shut * lamp} />}
      {front && <><clipPath id={`front-${id}`}><rect x={l - 14} y={top - 14} width={w + 28} height={h + 12} /></clipPath><g clipPath={`url(#front-${id})`}>{front}</g></>}
      {tone === 'hers' && <g opacity={1 - bare}><rect x={l + w + 4} y={top + h - 2} width={40} height={20} fill="#a35b48" /><path d={`M ${l + w + 24} ${top + h - 2} q -26 -34 -8 -60 q 8 26 8 60 q 4 -42 26 -52 q -8 34 -26 52`} fill="#4f8a6a" /></g>}
    </g>
  </g>;
};

/** Building facades either side of the alley, with dark neighbours' windows and a fire escape. */
export const Buildings: React.FC<{t: number}> = () => <g filter="url(#paper)">
  <rect x={-500} y={180} width={920} height={2400} fill={C.wallL} />
  <rect x={660} y={220} width={900} height={2400} fill={C.wallR} />
  {/* Rooflines and a water tank. */}
  <rect x={-500} y={170} width={920} height={22} fill={C.trim} /><rect x={660} y={210} width={900} height={22} fill={C.trim} />
  <g transform="translate(90 70)"><rect x={0} y={20} width={110} height={90} rx={10} fill={C.trim} /><path d="M -6 22 L 55 -20 L 116 22 Z" fill={C.trim} /><rect x={10} y={110} width={8} height={20} fill={C.trim} /><rect x={92} y={110} width={8} height={20} fill={C.trim} /></g>
  {/* Brick courses. */}
  {Array.from({length: 40}, (_, k) => <g key={k} opacity={0.35}>
    <rect x={-500 + (k % 2) * 40} y={260 + k * 52} width={920} height={3} fill={C.brick} />
    <rect x={660 + (k % 2) * 40} y={300 + k * 52} width={900} height={3} fill={C.brick} />
  </g>)}
  {/* Neighbours' windows: dark, one faintly lit. */}
  {[[210, 380], [210, 1500], [870, 380], [870, 1500], [-250, 930], [1330, 930]].map(([x, y], i) =>
    <g key={i}><rect x={x - 170 - 22} y={y - 220 - 22} width={384} height={484} fill={C.trim} /><rect x={x - 170} y={y - 220} width={340} height={440} fill={i === 3 ? '#3a3560' : '#14173a'} /></g>)}
  {/* Fire escape under his window. */}
  <g stroke={C.trim} strokeWidth={8} fill="none">
    <path d="M 0 1200 L 420 1200 M 0 1250 L 420 1250 M 420 1200 L 420 1250" />
    {Array.from({length: 12}, (_, k) => <path key={k} d={`M ${20 + k * 34} 1200 L ${20 + k * 34} 1250`} strokeWidth={4} />)}
    <path d="M 340 1250 L 250 1460 M 380 1250 L 290 1460" strokeWidth={6} />
  </g>
</g>;

/** The alley between: a deep gap with walls receding to a faint street glow, laundry line and a string
 * of bulbs running from his window frame to hers (it dims when her lamp goes out). */
export const Alley: React.FC<{t: number; herLamp: number}> = () => <g>
  <defs><linearGradient id="gap" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stopColor={C.sky1} /><stop offset="0.25" stopColor="#151a3e" /><stop offset="0.7" stopColor="#0b0d24" /><stop offset="1" stopColor="#4a3a4e" />
  </linearGradient>
  <radialGradient id="streetlamp" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#ffd59a" stopOpacity="0.55" /><stop offset="1" stopColor="#ffd59a" stopOpacity="0" /></radialGradient></defs>
  <rect x={400} y={-200} width={280} height={2600} fill="url(#gap)" />
  {/* The inside walls, receding: each building's side face, with tiny far windows and fire-escape rails. */}
  <path d="M 420 150 L 492 230 L 492 2400 L 420 2400 Z" fill="#191d42" />
  <path d="M 660 190 L 588 260 L 588 2400 L 660 2400 Z" fill="#151939" />
  {[0, 1, 2, 3, 4, 5].map((k) => <g key={k}>
    <rect x={440} y={430 + k * 250} width={22} height={40} fill={k === 2 ? '#5a4d6e' : '#0f1230'} />
    <rect x={618} y={450 + k * 250} width={22} height={40} fill={k === 4 ? '#5a4d6e' : '#0f1230'} />
    <path d={`M 420 ${520 + k * 250} L 492 ${520 + k * 250} M 660 ${540 + k * 250} L 588 ${540 + k * 250}`} stroke="#0a0c22" strokeWidth={5} />
  </g>)}
  {/* Far below: the street, a lamp, wet ground. */}
  <ellipse cx={540} cy={2050} rx={160} ry={220} fill="url(#streetlamp)" />
  <rect x={536} y={1830} width={6} height={260} fill="#0a0c22" />
  <circle cx={539} cy={1830} r={10} fill="#ffe2a8" />
  <path d="M 500 1320 Q 545 1350 590 1318" stroke="#2d3160" strokeWidth={2} fill="none" />
  {[0, 1].map((k) => <rect key={k} x={518 + k * 30} y={1334 + k * 3} width={18} height={26} fill={k ? '#6d5a8e' : '#4a6a8a'} />)}
</g>;

/** The bulb string that ties the two windows together, in front of the alley. */
export const Bulbs: React.FC<{t: number; herLamp: number; flash?: number}> = ({t, herLamp, flash = 0}) => {
  const n = 9, x0 = 384, x1 = 696, y0 = 700;
  return <g>
    <path d={`M ${x0} ${y0} Q 540 ${y0 + 90} ${x1} ${y0}`} stroke="#0a0c22" strokeWidth={3} fill="none" />
    {Array.from({length: n}, (_, k) => { const u = (k + 0.5) / n; const x = lerp(x0, x1, u), y = y0 + 2 * 45 * 2 * u * (1 - u);
      const on = Math.min(1.6, (0.55 + 0.45 * Math.sin(t * 2 + k)) * lerp(0.35, 1, herLamp) + flash * (0.6 + 0.4 * Math.sin(t * 40 + k * 2)));
      return <g key={k}><circle cx={x} cy={y + 10} r={16} fill="#ffe7a8" opacity={0.18 * on} /><circle cx={x} cy={y + 10} r={6.5} fill="#ffe7a8" opacity={0.4 + 0.6 * on} /></g>; })}
  </g>;
};

/** Rain in front of everything: thin slanted streaks; deterministic in t. */
export const Rain: React.FC<{t: number; n?: number; o?: number; seed?: number}> = ({t, n = 90, o = 0.35, seed = 0}) => <g opacity={o}>
  {Array.from({length: n}, (_, k) => {
    const r = Math.sin((k + 1) * 12.9898 + seed) * 43758.5453, rx = r - Math.floor(r);
    const r2 = Math.sin((k + 1) * 78.233 + seed) * 12543.12, ry = r2 - Math.floor(r2);
    const sp = 1500 + rx * 900;
    const y = ((ry * 2600 + t * sp) % 2600) - 400, x = -300 + rx * 1700 - y * 0.18;
    return <path key={k} d={`M ${x} ${y} l ${-9} ${46}`} stroke="#c9d6ff" strokeWidth={2} strokeLinecap="round" />;
  })}
</g>;

export type Pose = {look: number; hands: 'phone' | 'hide' | 'sign' | 'write' | 'wave' | 'waveL' | 'none'; bob: number; tilt: number; phoneLift?: number};

/** A cut-paper silhouette in a window: head, hair, shoulders, arms; phone glow lights the face from below. */
export const Person: React.FC<{x: number; y: number; who: 'him' | 'her'; p: Pose; t: number; glow: number; id: string}> = ({x, y, who, p, t, glow, id}) => {
  const hy = y - 20 + p.bob, sy = y + 100;
  const hx = x + p.look * 10;
  const hand = (side: number): [number, number] => {
    switch (p.hands) {
      case 'phone': return [x + side * 22, y + 135 - (p.phoneLift ?? 0) * 0];
      case 'hide': return [x + side * 120, y + 240];
      case 'sign': return [x + side * 120, y + 120];
      case 'waveL': return side < 0 ? [x - 150 - 25 * Math.sin(t * 12), y - 60] : [x + 90, y + 240];
      case 'wave': return side > 0 ? [x + 150 + 25 * Math.sin(t * 12), y - 60] : [x - 90, y + 240];
      case 'write': return side > 0 ? [x + 40 + 30 * Math.sin(t * 14), y + 200] : [x - 90, y + 215];
      default: return [x + side * 90, y + 240];
    }
  };
  const arm = (side: number) => { const [ex, ey] = hand(side); const sx = x + side * 72, sY = sy + 18;
    return `M ${sx} ${sY} Q ${sx + side * 20} ${(sY + ey) / 2 + 30} ${ex} ${ey}`; };
  return <g>
    <g filter="url(#paper)">
      <path d={`M ${x - 110} ${y + 300} L ${x - 96} ${sy + 20} Q ${x - 90} ${sy - 8} ${x - 50} ${sy - 12} L ${x + 50} ${sy - 12} Q ${x + 90} ${sy - 8} ${x + 96} ${sy + 20} L ${x + 110} ${y + 300} Z`} fill={C.ink} />
      <rect x={hx - 16} y={hy + 30} width={32} height={50} fill={C.ink} />
      <g transform={`rotate(${p.tilt} ${hx} ${hy})`}>
        <circle cx={hx} cy={hy} r={48} fill={C.ink} />
        {who === 'her' ? <circle cx={hx + 6} cy={hy - 52} r={24} fill={C.ink} />
          : <path d={`M ${hx - 44} ${hy - 18} q 10 -46 50 -40 q 30 -6 44 22 q -14 -8 -26 -2 q -6 -14 -22 -8 q -18 -6 -46 28 Z`} fill={C.ink} />}
        {/* Eyes: two small glints, so where they look reads in silhouette. */}
        <circle cx={hx - 15 + p.look * 9} cy={hy - 2} r={4.5} fill="#ffeacc" opacity={0.85} />
        <circle cx={hx + 15 + p.look * 9} cy={hy - 2} r={4.5} fill="#ffeacc" opacity={0.85} />
        {glow > 0 && <><clipPath id={`face-${id}`}><circle cx={hx} cy={hy} r={48} /></clipPath>
          <ellipse cx={hx} cy={hy + 50} rx={60} ry={50} fill={C.glow} opacity={0.22 * glow} clipPath={`url(#face-${id})`} /></>}
      </g>
      <path d={arm(-1)} stroke={C.ink} strokeWidth={30} strokeLinecap="round" fill="none" />
      <path d={arm(1)} stroke={C.ink} strokeWidth={30} strokeLinecap="round" fill="none" />
    </g>
  </g>;
};

/** A phone held in the hands: dark body, lit screen, glow on the room. `flick` animates the card swipe. */
export const HeldPhone: React.FC<{x: number; y: number; glow: number; flick: number; rot?: number; notif?: number; notifText?: string}> = ({x, y, glow, flick, rot = 0, notif = 0, notifText}) => <g transform={`translate(${x} ${y}) rotate(${rot}) scale(1.35)`}>
  {glow > 0 && <circle cx={0} cy={-30} r={160} fill="url(#phoneglow)" opacity={glow} />}
  <rect x={-22} y={-38} width={44} height={76} rx={8} fill="#0a0b1c" />
  <rect x={-18} y={-33} width={36} height={66} rx={5} fill={C.glow} opacity={0.35 + 0.65 * glow} />
  {/* A blurry profile card flicking left. */}
  <g opacity={glow} transform={`translate(${-60 * flick} 0) rotate(${-18 * flick})`}>
    <rect x={-14} y={-28} width={28} height={44} rx={4} fill="#9db0ff" />
    <circle cx={0} cy={-12} r={7} fill="#f2c7b3" />
  </g>
  {glow > 0.5 && <g opacity={glow}><circle cx={-8} cy={25} r={5} fill="#fff" /><text x={-8} y={28} textAnchor="middle" fontSize={8} fontWeight={700} fill="#8b8fb0">✕</text>
    <circle cx={8} cy={25} r={5} fill="#fff" /><text x={8} y={28} textAnchor="middle" fontSize={8} fill={C.heart}>♥</text></g>}
  {notif > 0 && <g opacity={notif} transform={`translate(0 ${-80 - 10 * (1 - notif)}) scale(0.8)`}>
    {notifText ? <>
      <rect x={-150} y={-24} width={300} height={46} rx={23} fill="#fff" />
      <text x={0} y={7} textAnchor="middle" fontFamily={'Figtree, "Helvetica Neue", "Inter", Arial, sans-serif'} fontWeight={700} fontSize={20} fill="#1d2048">{notifText}</text>
    </> : <>
      <rect x={-92} y={-24} width={184} height={46} rx={23} fill="#fff" />
      <text x={0} y={7} textAnchor="middle" fontFamily={'Figtree, "Helvetica Neue", "Inter", Arial, sans-serif'} fontWeight={700} fontSize={22} fill="#1d2048">new match <tspan fill={C.heart}>♥</tspan></text>
    </>}
  </g>}
</g>;

/** A sign: sketchbook paper (hers) or a pizza-box lid (his), written in marker. `k` reveals the letters. */
export const Sign: React.FC<{x: number; y: number; text: string; k: number; who: 'him' | 'her'; s?: number; rot?: number}> = ({x, y, text, k, who, s = 1, rot = 0}) => {
  const w = 300, h = 200;
  const lines = text.includes('|') ? text.split('|') : text.length > 11 ? (() => { const ws = text.split(' '); const a: string[] = ['']; ws.forEach((wd) => { const l = a[a.length - 1]; if ((l + ' ' + wd).trim().length <= 11 || !l) a[a.length - 1] = (l + ' ' + wd).trim(); else a.push(wd); }); return a; })() : [text];
  let left = Math.ceil(text.length * clamp(k));
  const size = lines.length > 1 ? Math.min(lines.length > 2 ? 46 : 56, 500 / Math.max(...lines.map((l) => l.length))) : Math.min(70, 520 / text.length);
  return <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} filter="url(#paper)">
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={who === 'him' ? 4 : 2} fill={who === 'him' ? '#e0b47c' : C.paper} stroke={who === 'him' ? '#5a3816' : 'none'} strokeWidth={6} />
    {who === 'him' ? <><rect x={-w / 2} y={-h / 2} width={w} height={14} fill={C.card2} /><circle cx={90} cy={50} r={22} fill={C.card2} opacity={0.35} /><circle cx={-100} cy={-40} r={14} fill={C.card2} opacity={0.3} /></>
      : <g>{[0, 1, 2, 3, 4, 5].map((i) => <circle key={i} cx={-w / 2 + 30 + i * 48} cy={-h / 2 + 10} r={5} fill="#c7c0ad" />)}</g>}
    {lines.map((ln, i) => { const n = Math.max(0, Math.min(ln.length, left)); left -= ln.length + 1;
      return <text key={i} x={0} y={(i - (lines.length - 1) / 2) * size * 1.05 + size * 0.35} textAnchor="middle" fontFamily={MARKER} fontWeight={700} fontSize={size} fill={C.pen}>
        <tspan>{ln.slice(0, n)}</tspan><tspan opacity={0}>{ln.slice(n)}</tspan></text>; })}
  </g>;
};

/** A paper strip taped to the frame, typewriter text: the season's narration cards. */
export const Strip: React.FC<{text: string; y: number; k: number; rot?: number; size?: number}> = ({text, y, k, rot = -1.5, size = 46}) => {
  if (k <= 0) return null;
  const w = text.length * size * 0.62 + 70;
  return <g transform={`translate(540 ${y + 30 * (1 - k)}) rotate(${rot})`} opacity={k} filter="url(#paper)">
    <rect x={-w / 2} y={-size * 0.9} width={w} height={size * 1.7} fill={C.paper} />
    <rect x={-w / 2 - 18} y={-size * 0.95} width={60} height={26} fill="#e9dcb5" opacity={0.85} transform={`rotate(-20 ${-w / 2} ${-size * 0.9})`} />
    <text x={0} y={size * 0.3} textAnchor="middle" fontFamily={TYPE} fontSize={size} fill={C.pen}>{text}</text>
  </g>;
};

/** Jo, Mira's roommate: hooded at first; the hood drops to show a high ponytail and round glasses.
 * `point` (0..1) reaches her left hand to (px, py); she waves on the way out from `waveAt`. */
export const Jo: React.FC<{x: number; y: number; hood: number; k: number; t: number; waveAt: number; point?: number; px?: number; py?: number}> = ({x, y, hood, k, t, waveAt, point = 0, px = 0, py = 0}) => {
  const hy = y - 18;
  return <g opacity={k} filter="url(#paper)">
    <path d={`M ${x - 92} ${y + 300} L ${x - 80} ${y + 120} Q ${x - 74} ${y + 90} ${x - 40} ${y + 86} L ${x + 40} ${y + 86} Q ${x + 74} ${y + 90} ${x + 80} ${y + 120} L ${x + 92} ${y + 300} Z`} fill="#141634" />
    <rect x={x - 15} y={hy + 30} width={30} height={50} fill="#141634" />
    <circle cx={x} cy={hy} r={46} fill="#141634" />
    {/* Ponytail and glasses, revealed as the hood drops. */}
    <g opacity={hood}>
      <path d={`M ${x + 30} ${hy - 40} q 40 -20 46 20 q 4 40 -16 70 q 6 -40 -30 -70 Z`} fill="#141634" />
      <circle cx={x - 15} cy={hy - 2} r={13} fill="none" stroke="#ffeacc" strokeWidth={3} opacity={0.8} />
      <circle cx={x + 15} cy={hy - 2} r={13} fill="none" stroke="#ffeacc" strokeWidth={3} opacity={0.8} />
      <path d={`M ${x - 2} ${hy - 2} L ${x + 2} ${hy - 2}`} stroke="#ffeacc" strokeWidth={3} />
      <circle cx={x - 15 - 4} cy={hy - 2} r={3.5} fill="#ffeacc" /><circle cx={x + 15 - 4} cy={hy - 2} r={3.5} fill="#ffeacc" />
    </g>
    <g opacity={1 - hood} transform={`translate(0 ${30 * hood})`}>
      <path d={`M ${x - 54} ${hy + 30} Q ${x - 60} ${hy - 62} ${x} ${hy - 64} Q ${x + 60} ${hy - 62} ${x + 54} ${hy + 30} Q ${x + 40} ${hy - 30} ${x} ${hy - 32} Q ${x - 40} ${hy - 30} ${x - 54} ${hy + 30} Z`} fill="#0a0b22" />
    </g>
    {/* A wave on the way out. */}
    {point > 0 && <path d={`M ${x - 60} ${y + 120} Q ${x - 70} ${y + 200} ${lerp(x - 70, px, point)} ${lerp(y + 240, py, point)}`} stroke="#141634" strokeWidth={26} strokeLinecap="round" fill="none" />}
    {t > waveAt - 0.2 && <path d={`M ${x + 60} ${y + 110} Q ${x + 110} ${y + 40} ${x + 120 + 20 * Math.sin(t * 12)} ${y - 40}`} stroke="#141634" strokeWidth={28} strokeLinecap="round" fill="none" />}
  </g>;
};
