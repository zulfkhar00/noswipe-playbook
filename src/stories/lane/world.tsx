import React from 'react';
import {clamp, lerp, smooth} from '../../lib/motion';
import {OPEN} from '../../lib/fonts';

// LANE 8 (season 7): 80s Memphis carpet pop in a bowling alley. Flat planes in depth, ink-tinted soft shadows
// (stacked translucent shapes, no filters), hard offset shadows on cards, bean figures with dot eyes.
// Reusable by parts 2-6: palette, planes/camera, monitors with 9-cell name boxes, figures, lanes, strips, ball wipe.

export const C = {
  ink: '#1D1A2F', cream: '#FFF7E6', teal: '#12A8A0', orange: '#FF6B2C', lemon: '#FFD93D', violet: '#7C4DFF', mint: '#8BF5CF',
  wall: '#2A2352', orangeDeep: '#D9501A', skinHim: '#F2B48C', skinHer: '#B9774E', lane: '#F6E4BE', laneLine: '#E3CB98', approach: '#E9D3A6',
};
export const JOST = OPEN.geometric;     // strips
export const NUN = OPEN.rounded;        // cards + end card
export const BAR = OPEN.condensed;      // scoreboard letters

// ---------------------------------------------------------------------------------------- camera
export type Cam = {x: number; y: number; z: number};
export type CamKey = {t: number; x: number; y: number; z: number; cut?: boolean};
const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const camAt = (keys: CamKey[], t: number): Cam => {
  let i = 0;
  while (i + 1 < keys.length && t >= keys[i + 1].t) i++;
  const a = keys[i], b = keys[i + 1];
  let c: Cam = {x: a.x, y: a.y, z: a.z};
  if (b && !b.cut) {
    const k = ease(clamp((t - a.t) / (b.t - a.t)));
    c = {x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z: lerp(a.z, b.z, k)};
  }
  return {x: c.x + 2 * Math.sin(t * 1.3), y: c.y + 2.4 * Math.sin(t * 1.9 + 1), z: c.z};
};
export const planeT = (c: Cam, d: number) => {
  const s = 1 + (c.z - 1) * d;
  const cx = 540 + (c.x - 540) * d, cy = 960 + (c.y - 960) * d;
  return `translate(540 960) scale(${s.toFixed(4)}) translate(${(-cx).toFixed(2)} ${(-cy).toFixed(2)})`;
};

/** keyframed numbers with smoothstep between keys */
export const track = (keys: [number, number[]][], t: number): number[] => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i + 1 < keys.length; i++) {
    const [a, va] = keys[i], [b, vb] = keys[i + 1];
    if (t < b) { const k = smooth(t, a, b); return va.map((v, j) => lerp(v, vb[j], k)); }
  }
  return keys[keys.length - 1][1];
};
export const keyAt = <T,>(t: number, ks: [number, T][]): T => { let v = ks[0][1]; for (const [a, b] of ks) if (t >= a) v = b; return v; };

// ---------------------------------------------------------------------------------------- shared bits
export const Shadow: React.FC<{x: number; y: number; w: number; h: number; op?: number}> = ({x, y, w, h, op = 0.3}) => <g>
  {[1.5, 1.25, 1].map((k, i) => <ellipse key={i} cx={x} cy={y} rx={w * k / 2} ry={h * k / 2} fill={C.ink} opacity={op / 3} />)}
</g>;
const SoftRect: React.FC<{x: number; y: number; w: number; h: number; r?: number; dx?: number; dy?: number; op?: number}> = ({x, y, w, h, r = 24, dx = 14, dy = 26, op = 0.34}) => <g>
  {[24, 14, 6].map((g, i) => <rect key={i} x={x + dx - g} y={y + dy - g} width={w + 2 * g} height={h + 2 * g} rx={r + g} fill={C.ink} opacity={op / 3} />)}
</g>;

// deterministic Memphis confetti
const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const PAL = [C.teal, C.orange, C.lemon, C.violet];
export const Memphis: React.FC<{x0: number; y0: number; x1: number; y1: number; n: number; seed?: number; op?: number; t?: number}> = ({x0, y0, x1, y1, n, seed = 0, op = 1, t = 0}) => <g opacity={op}>
  {Array.from({length: n}, (_, i) => {
    const k = i + seed * 100;
    const x = lerp(x0, x1, rnd(k)), y = lerp(y0, y1, rnd(k + 0.3)), r = rnd(k + 0.6) * 360, c = PAL[Math.floor(rnd(k + 0.9) * 4)], kind = Math.floor(rnd(k + 1.2) * 4);
    const bob = Math.sin(t * 0.8 + i) * 3;
    return <g key={i} transform={`translate(${x} ${y + bob}) rotate(${r})`} fill="none" stroke={c} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round">
      {kind === 0 && <path d="M -30 0 Q -15 -22 0 0 T 30 0" />}
      {kind === 1 && <path d="M -22 18 L 0 -22 L 22 18 Z" />}
      {kind === 2 && <circle r={11} fill={c} stroke="none" />}
      {kind === 3 && <path d="M -22 -10 L 22 -10 M -22 10 L 22 10" />}
    </g>;
  })}
</g>;

// ---------------------------------------------------------------------------------------- lane geometry (bay)
export const VPY = 620, NEARY = 1250;
export const lsc = (y: number) => (y - VPY) / (NEARY - VPY);
export const laneCx = (lane: 0 | 1, y: number) => 540 + ((lane ? 790 : 290) - 540) * lsc(y);
export const lanePt = (lane: 0 | 1, y: number, v: number): [number, number] => [laneCx(lane, y) + v * 220 * lsc(y), y];

export const Pin: React.FC<{x: number; y: number; s: number; rot?: number}> = ({x, y, s, rot = 0}) => <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
  <ellipse cx={0} cy={0} rx={22} ry={7} fill={C.ink} opacity={0.22} />
  <path d="M -9 -118 C -12 -100 -10 -90 -17 -66 C -30 -34 -22 -2 0 -2 C 22 -2 30 -34 17 -66 C 10 -90 12 -100 9 -118 C 9 -128 -9 -128 -9 -118 Z" fill={C.cream} stroke={C.ink} strokeWidth={4 / Math.max(0.3, s) * 0.5} />
  <path d="M -11 -96 L 11 -96 L 13 -86 L -13 -86 Z" fill={C.orange} />
</g>;

const PIN_ROWS: [number, number[]][] = [[806, [-0.6, -0.2, 0.2, 0.6]], [818, [-0.4, 0, 0.4]], [830, [-0.2, 0.2]], [842, [0]]];

const Lane: React.FC<{lane: 0 | 1; pins: boolean[]; t: number}> = ({lane, pins, t}) => {
  const P = (y: number, v: number) => lanePt(lane, y, v).join(' ');
  const Y0 = 796;
  const poly = (y0: number, y1: number, v0: number, v1: number) => `M ${P(y0, v0)} L ${P(y0, v1)} L ${P(y1, v1)} L ${P(y1, v0)} Z`;
  let pi = 0;
  return <g>
    <path d={poly(Y0, 1400, -1.2, 1.2)} fill={C.ink} />
    <path d={poly(Y0, 1400, -1.02, 1.02)} fill={C.teal} />
    <path d={poly(Y0, 1400, -0.9, 0.9)} fill={C.lane} />
    {[-0.6, -0.3, 0, 0.3, 0.6].map((v, i) => <path key={i} d={`M ${P(Y0, v)} L ${P(1400, v)}`} stroke={C.laneLine} strokeWidth={3} />)}
    {[-0.5, -0.25, 0, 0.25, 0.5].map((v, i) => { const y = 1010 + Math.abs(v) * 80; const [x, yy] = lanePt(lane, y, v); const s = lsc(y); return <path key={i} d={`M ${x - 14 * s * 1.6} ${yy + 14 * s * 1.6} L ${x} ${yy - 22 * s * 1.6} L ${x + 14 * s * 1.6} ${yy + 14 * s * 1.6} Z`} fill={C.orange} />; })}
    <path d={poly(1168, 1176, -1.2, 1.2)} fill={C.ink} />
    <path d={poly(1176, 1400, -1.2, 1.2)} fill={C.approach} />
    {[-0.8, -0.4, 0, 0.4, 0.8].map((v, i) => <circle key={i} cx={lanePt(lane, 1200, v)[0]} cy={1200} r={5} fill={C.laneLine} />)}
    {/* pins */}
    {PIN_ROWS.map(([y, vs]) => vs.map((v) => { const ok = pins[pi++]; const [x, yy] = lanePt(lane, y, v); return ok ? <Pin key={pi} x={x} y={yy + 8} s={lsc(y) * 0.95} /> : null; }))}
  </g>;
};

export const Ball: React.FC<{x: number; y: number; r: number; color: string; spin?: number; shadow?: boolean}> = ({x, y, r, color, spin = 0, shadow = true}) => <g transform={`translate(${x} ${y})`}>
  {shadow && <ellipse cx={4} cy={r * 0.95} rx={r * 0.95} ry={r * 0.22} fill={C.ink} opacity={0.25} />}
  <circle r={r} fill={color} stroke={C.ink} strokeWidth={Math.max(3, r * 0.1)} />
  <g transform={`rotate(${spin})`}>
    <circle cx={-r * 0.22} cy={-r * 0.38} r={r * 0.11} fill={C.ink} /><circle cx={r * 0.06} cy={-r * 0.46} r={r * 0.11} fill={C.ink} /><circle cx={-r * 0.06} cy={-r * 0.2} r={r * 0.08} fill={C.ink} />
    <path d={`M ${-r * 0.62} ${r * 0.1} Q ${-r * 0.4} ${r * 0.55} ${r * 0.1} ${r * 0.62}`} fill="none" stroke={C.cream} strokeWidth={r * 0.1} strokeLinecap="round" opacity={0.7} />
  </g>
</g>;

// ---------------------------------------------------------------------------------------- the scoreboard monitor
export type Cell = {ch: string; prev: string; flipAt: number; color: string; instant?: boolean};
const CW = 48, CG = 4, CH = 88;

export const NameCells: React.FC<{cells: Cell[]; t: number; w?: number; h?: number; gap?: number; font?: number; bg?: string; flash?: number}> = ({cells, t, w = CW, h = CH, gap = CG, font = 84, bg = '#0E0C1C', flash = 0}) => <g>
  {cells.map((c, i) => {
    const x = i * (w + gap);
    const u = clamp((t - c.flipAt) / 0.11);
    let ch = c.ch, sy = 1;
    if (!c.instant && c.flipAt < 1e8 && t >= c.flipAt && u < 1) { sy = Math.abs(1 - 2 * u); ch = u < 0.5 ? c.prev : c.ch; }
    else if (!c.instant && t < c.flipAt) ch = c.prev;
    if (c.instant && t < c.flipAt) ch = c.prev;
    const pop = c.instant && t >= c.flipAt && t < c.flipAt + 0.12 ? 1 + 0.25 * (1 - (t - c.flipAt) / 0.12) : 1;
    return <g key={i} transform={`translate(${x} 0)`}>
      <rect width={w} height={h} rx={6} fill={flash > 0 ? C.orangeDeep : bg} />
      <g transform={`translate(${w / 2} ${h / 2}) scale(${pop} ${sy * pop}) translate(${-w / 2} ${-h / 2})`}>
        <text x={w / 2} y={h * 0.5 + font * 0.34} textAnchor="middle" fontFamily={BAR} fontWeight={800} fontSize={font} fill={c.color}>{ch === ' ' ? '' : ch}</text>
      </g>
      <rect x={0} y={h / 2 - 1.5} width={w} height={3} fill="#000" opacity={0.55} />
    </g>;
  })}
</g>;

export const Ring: React.FC<{r: number; k: number; urgent?: number}> = ({r, k, urgent = 0}) => {
  const L = 2 * Math.PI * r;
  return <g transform="rotate(-90)">
    <circle r={r} fill="none" stroke="#3A3560" strokeWidth={13} />
    <circle r={r} fill="none" stroke={urgent > 0 ? C.orange : C.lemon} strokeWidth={13} strokeLinecap="round" strokeDasharray={`${L * clamp(k)} ${L}`} />
  </g>;
};

export type MonitorProps = {
  x: number; y: number; lane: number; cells: Cell[]; t: number; cellFlash?: number;
  ring?: number | null; banner?: {text: string; age: number} | null; score: string; scorePop?: number; xMark?: number; shake?: number; dim?: boolean; sub?: {text: string; color?: string; size?: number};
};
export const Monitor: React.FC<MonitorProps> = ({x, y, lane, cells, t, cellFlash = 0, ring = null, banner = null, score, scorePop = 0, xMark = 0, shake = 0, sub}) => {
  const W = 520, H = 300;
  const sx = shake * Math.sin(t * 90) * 7;
  return <g transform={`translate(${x - W / 2 + sx} ${y})`}>
    <SoftRect x={0} y={0} w={W} h={H} r={30} dx={16} dy={34} op={0.4} />
    <rect x={-6} y={-520} width={12} height={526} fill={C.ink} transform="translate(60 0)" />
    <rect x={-6} y={-520} width={12} height={526} fill={C.ink} transform="translate(460 0)" />
    <rect width={W} height={H} rx={30} fill={C.violet} stroke={C.ink} strokeWidth={6} />
    <rect x={14} y={14} width={W - 28} height={H - 28} rx={20} fill="#0A0818" />
    <text x={28} y={50} fontFamily={BAR} fontWeight={800} fontSize={34} letterSpacing={3} fill={C.teal}>LANE {lane}</text>
    <circle cx={W - 38} cy={37} r={8} fill={C.mint} opacity={0.6 + 0.4 * Math.sin(t * 5)} />
    <g transform="translate(28 64)">
      <NameCells cells={cells} t={t} flash={cellFlash} />
    </g>
    {banner && (() => {
      const a = banner.age, k = a < 0.14 ? 1 + 1.2 * (1 - a / 0.14) : 1;
      return <g transform={`translate(${W / 2} 108) scale(${k}) translate(${-W / 2} -108)`}>
        <rect x={22} y={62} width={W - 44} height={96} rx={10} fill={C.orange} stroke={C.ink} strokeWidth={5} />
        <text x={W / 2} y={132} textAnchor="middle" fontFamily={BAR} fontWeight={800} fontSize={78} letterSpacing={2} fill={C.ink}>TURN SKIPPED</text>
      </g>;
    })()}
    <g transform="translate(0 168)">
      {ring !== null
        ? <g><g transform="translate(86 52)"><Ring r={36} k={ring} urgent={ring < 0.3 ? 1 : 0} /></g><text x={140} y={64} fontFamily={BAR} fontWeight={800} fontSize={38} letterSpacing={2} fill={C.cream}>{ring < 0.12 ? 'TIME!' : 'TIME LEFT'}</text></g>
        : <text x={36} y={68} fontFamily={BAR} fontWeight={800} fontSize={sub?.size ?? 40} letterSpacing={2} fill={sub?.color ?? '#8A84B8'}>{sub?.text ?? 'FRAME 1'}</text>}
      <rect x={W - 160} y={4} width={124} height={92} rx={10} fill="#1E1A3C" stroke={C.lemon} strokeWidth={4} />
      <text x={W - 98} y={30} textAnchor="middle" fontFamily={BAR} fontWeight={800} fontSize={22} letterSpacing={2} fill="#8A84B8">SCORE</text>
      <g transform={`translate(${W - 98} 74) scale(${1 + scorePop * 0.5}) translate(${-(W - 98)} -74)`}>
        <text x={W - 98} y={84} textAnchor="middle" fontFamily={BAR} fontWeight={800} fontSize={72} fill={C.lemon} opacity={1 - xMark}>{score}</text>
      </g>
      {xMark > 0 && <text x={W - 98} y={86} textAnchor="middle" fontFamily={BAR} fontWeight={800} fontSize={86} fill={C.orange} opacity={xMark}>X</text>}
    </g>
  </g>;
};

// ---------------------------------------------------------------------------------------- bean figures
export type Mouth = 'flat' | 'smile' | 'o' | 'grin' | 'wince' | 'sad' | 'amused';
export type Pose = {lx: number; ly: number; brow: number; mouth: Mouth; tilt: number; dy: number; a1: [number, number]; a2: [number, number]; thumb?: number; squash?: number; blush?: number};
const SH1: [number, number] = [-58, -208], SH2: [number, number] = [58, -208];
const SEG = 108;

const Limb: React.FC<{s: [number, number]; h: [number, number]; side: 1 | -1; sleeve: string; skin: string; thumb?: number}> = ({s, h, side, sleeve, skin, thumb = 0}) => {
  let dx = h[0] - s[0], dy = h[1] - s[1];
  let d = Math.hypot(dx, dy);
  const maxd = 2 * SEG - 2;
  if (d > maxd) { dx *= maxd / d; dy *= maxd / d; d = maxd; }
  const hx = s[0] + dx, hy = s[1] + dy;
  const m = [s[0] + dx / 2, s[1] + dy / 2];
  const hh = Math.sqrt(Math.max(0, SEG * SEG - (d / 2) ** 2));
  let px = -dy / d, py = dx / d;                       // perpendicular
  const pref = [side * 0.45, 0.9];
  if (px * pref[0] + py * pref[1] < 0) { px = -px; py = -py; }
  const e = [m[0] + px * hh, m[1] + py * hh];
  const path = `M ${s[0]} ${s[1]} L ${e[0]} ${e[1]} L ${hx} ${hy}`;
  return <g strokeLinecap="round" strokeLinejoin="round" fill="none">
    <path d={path} stroke={C.ink} strokeWidth={46} />
    <path d={path} stroke={sleeve} strokeWidth={36} />
    <circle cx={hx} cy={hy} r={24} fill={C.ink} stroke="none" />
    <circle cx={hx} cy={hy} r={19} fill={skin} stroke="none" />
    {thumb > 0 && <g transform={`translate(${hx} ${hy - 14}) rotate(${-8})`}>
      <rect x={-8} y={-34 * thumb} width={16} height={36 * thumb} rx={8} fill={skin} stroke={C.ink} strokeWidth={4} />
    </g>}
  </g>;
};

export const mouthPath = (m: Mouth): React.ReactNode => {
  switch (m) {
    case 'flat': return <path d="M -14 0 L 14 0" stroke={C.ink} strokeWidth={6} strokeLinecap="round" />;
    case 'smile': return <path d="M -18 -3 Q 0 20 18 -3" stroke={C.ink} strokeWidth={6} strokeLinecap="round" fill="none" />;
    case 'amused': return <path d="M -16 2 Q 4 14 20 -8" stroke={C.ink} strokeWidth={6} strokeLinecap="round" fill="none" />;
    case 'o': return <ellipse rx={10} ry={13} fill={C.ink} />;
    case 'grin': return <path d="M -24 -4 Q 0 6 24 -4 Q 20 28 0 28 Q -20 28 -24 -4 Z" fill={C.ink} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />;
    case 'wince': return <path d="M -18 4 Q -9 -6 0 4 T 18 4" stroke={C.ink} strokeWidth={6} strokeLinecap="round" fill="none" />;
    case 'sad': return <path d="M -16 8 Q 0 -10 16 8" stroke={C.ink} strokeWidth={6} strokeLinecap="round" fill="none" />;
  }
};

export const Face: React.FC<{p: Pose; kind: 'him' | 'her'; eyeR?: number}> = ({p, kind, eyeR = 9}) => <g>
  {(p.blush ?? 0) > 0 && <g opacity={p.blush}><ellipse cx={-36} cy={-286} rx={13} ry={8} fill={C.orange} opacity={0.5} /><ellipse cx={36} cy={-286} rx={13} ry={8} fill={C.orange} opacity={0.5} /></g>}
  <circle cx={-22 + p.lx * 6} cy={-294 + p.ly * 6} r={eyeR} fill={C.ink} />
  <circle cx={22 + p.lx * 6} cy={-294 + p.ly * 6} r={eyeR} fill={C.ink} />
  <g stroke={C.ink} strokeWidth={5.5} strokeLinecap="round">
    <path d={`M -34 ${-322 - p.brow * 8} L -10 ${-322 - p.brow * 11}`} />
    <path d={`M 10 ${-322 - p.brow * 11} L 34 ${-322 - p.brow * 8}`} />
  </g>
  <g transform={`translate(${p.lx * 3} -262)`}>{mouthPath(p.mouth)}</g>
</g>;

export const Figure: React.FC<{kind: 'him' | 'her'; x: number; y: number; p: Pose; t: number; flip?: boolean; scale?: number; items?: React.ReactNode; pocket?: boolean}> = ({kind, x, y, p, t, flip = false, scale = 1, items, pocket}) => {
  const him = kind === 'him';
  const body = him ? C.orange : C.violet, skin = him ? C.skinHim : C.skinHer;
  const sq = p.squash ?? 0;
  return <g transform={`translate(${x} ${y}) scale(${(flip ? -1 : 1) * scale * (1 + sq * 0.05)} ${scale * (1 - sq * 0.06)})`}>
    <Shadow x={0} y={4} w={190} h={34} op={0.34} />
    <g transform={`translate(0 ${p.dy})`}>
      {/* legs */}
      <g stroke={C.ink} strokeWidth={5}>
        <rect x={-40} y={-52} width={30} height={50} rx={10} fill={him ? C.ink : C.teal} />
        <rect x={10} y={-52} width={30} height={50} rx={10} fill={him ? C.ink : C.teal} />
        <rect x={-48} y={-14} width={42} height={18} rx={9} fill={him ? C.cream : C.lemon} />
        <rect x={6} y={-14} width={42} height={18} rx={9} fill={him ? C.cream : C.lemon} />
      </g>
      {/* hood / ponytail behind */}
      {him && <ellipse cx={0} cy={-236} rx={64} ry={26} fill={C.orangeDeep} stroke={C.ink} strokeWidth={5} />}
      {!him && <g stroke={C.ink} strokeLinecap="round" fill="none"><path d={`M 24 -362 Q ${86 + Math.sin(t * 3) * 6} -440 ${110} ${-360 + Math.sin(t * 3) * 8}`} strokeWidth={42} /><path d={`M 24 -362 Q ${86 + Math.sin(t * 3) * 6} -440 ${110} ${-360 + Math.sin(t * 3) * 8}`} stroke={C.ink} strokeWidth={30} /></g>}
      {/* torso */}
      <path d="M -66 -40 C -76 -120 -70 -196 -42 -232 L 42 -232 C 70 -196 76 -120 66 -40 Z" fill={body} stroke={C.ink} strokeWidth={5.5} strokeLinejoin="round" />
      {!him && <path d="M 0 -232 L 0 -42" stroke={C.lemon} strokeWidth={7} />}
      {!him && <path d="M -30 -232 L 0 -200 L 30 -232" fill={C.teal} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />}
      {him && <g stroke={C.ink} strokeWidth={5} strokeLinecap="round"><path d="M -14 -228 L -16 -184" /><path d="M 14 -228 L 16 -184" /></g>}
      {/* arms */}
      <Limb s={SH1} h={p.a1} side={-1} sleeve={body} skin={skin} thumb={p.thumb} />
      <Limb s={SH2} h={p.a2} side={1} sleeve={body} skin={skin} />
      {items}
      {him && pocket !== false && <path d="M -46 -112 L 46 -112 L 52 -58 L -52 -58 Z" fill={C.orangeDeep} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />}
      {/* head */}
      <g transform={`rotate(${p.tilt} 0 -250)`}>
        <circle cx={0} cy={-300} r={62} fill={skin} stroke={C.ink} strokeWidth={5.5} />
        <circle cx={-64} cy={-296} r={11} fill={skin} stroke={C.ink} strokeWidth={4.5} /><circle cx={64} cy={-296} r={11} fill={skin} stroke={C.ink} strokeWidth={4.5} />
        <Face p={p} kind={kind} />
        {him && <g>
          <path d="M -62 -322 C -64 -396 64 -396 62 -322 Z" fill={C.ink} />
          <path d="M -70 -324 Q 0 -312 74 -324 L 70 -338 Q 0 -327 -66 -338 Z" fill={C.ink} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
          <circle cx={0} cy={-360} r={9} fill={C.lemon} />
        </g>}
        {!him && <g>
          <path d="M -64 -296 C -72 -392 70 -392 64 -296 C 56 -334 30 -346 0 -346 C -30 -346 -56 -334 -64 -296 Z" fill={C.ink} />
          <ellipse cx={26} cy={-366} rx={19} ry={14} fill={C.lemon} stroke={C.ink} strokeWidth={4.5} />
        </g>}
      </g>
    </g>
  </g>;
};

export const Phone: React.FC<{x: number; y: number; t: number; rot?: number; glow?: number; flick?: boolean; s?: number}> = ({x, y, t, rot = 0, glow = 1, flick = true, s = 1}) => {
  const per = 0.35, ph = ((t - 0.3 + 100 * per) % per) / per, idx = Math.floor((t - 0.3 + 100 * per) / per);
  const cols = [C.teal, C.lemon, C.orange, C.violet, C.mint];
  const cardAt = (k: number) => { const c = cols[((k % 5) + 5) % 5]; return <g>
    <rect x={-40} y={-66} width={80} height={132} rx={12} fill={c} stroke={C.ink} strokeWidth={3} />
    <circle cx={0} cy={-18} r={22} fill={C.cream} opacity={0.85} /><rect x={-26} y={20} width={52} height={10} rx={5} fill={C.ink} opacity={0.7} /><rect x={-26} y={38} width={34} height={9} rx={4.5} fill={C.ink} opacity={0.45} />
  </g>; };
  const f = flick ? clamp((ph - 0.05) / 0.55) : 0;
  const sw = f * f * (3 - 2 * f);
  return <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <circle r={128} fill={C.lemon} opacity={0.1 * glow} /><circle r={100} fill={C.lemon} opacity={0.12 * glow} />
    <rect x={-52} y={-92} width={104} height={184} rx={20} fill={C.ink} />
    <rect x={-46} y={-86} width={92} height={172} rx={15} fill="#171335" />
    <g transform="translate(0 0)">
      <g transform="translate(0 4) scale(0.94)" opacity={0.7}>{cardAt(idx + 1)}</g>
      <g transform={`translate(${sw * 130} ${sw * -10}) rotate(${sw * 22})`} opacity={1 - sw * 0.9}>{cardAt(idx)}</g>
    </g>
    {flick && <ellipse cx={22 + sw * 20} cy={46} rx={11} ry={15} fill={C.skinHim} stroke={C.ink} strokeWidth={3.5} transform={`rotate(-20 ${22 + sw * 20} 46)`} />}
  </g>;
};

// ---------------------------------------------------------------------------------------- keypad (bay console)
export const KEYP = (i: number, x = 470, y = 1000): [number, number] => [x + (-26 + (i % 3) * 26) * 1.5, y + (-14 + Math.floor(i / 3) * 24) * 1.5];
export const Keypad: React.FC<{x: number; y: number; lit?: number; t?: number}> = ({x, y, lit = -1}) => <g transform={`translate(${x} ${y}) scale(1.5)`}>
  <rect x={-10} y={30} width={20} height={90} fill={C.ink} />
  <rect x={-46} y={-92} width={92} height={28} rx={8} fill={C.lemon} stroke={C.ink} strokeWidth={4} />
  <text x={0} y={-71} textAnchor="middle" fontFamily={BAR} fontWeight={800} fontSize={24} letterSpacing={2} fill={C.ink}>NAME</text>
  <rect x={-50} y={-62} width={100} height={106} rx={14} fill={C.ink} stroke={C.teal} strokeWidth={5} />
  <rect x={-38} y={-52} width={76} height={18} rx={4} fill="#0E0C1C" />
  <rect x={-30} y={-46} width={22} height={6} rx={3} fill={C.orange} />
  {Array.from({length: 9}, (_, i) => <circle key={i} cx={-26 + (i % 3) * 26} cy={-14 + Math.floor(i / 3) * 24} r={9} fill={i === lit ? C.orange : C.cream} />)}
</g>;

// ---------------------------------------------------------------------------------------- strips
const wrap = (text: string, max: number) => {
  const words = text.split(' '), lines: string[] = [];
  let cur = '';
  for (const w of words) { if (cur && (cur + ' ' + w).length > max) { lines.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w; }
  if (cur) lines.push(cur);
  return lines;
};
export const Strip: React.FC<{text: string; y: number; age: number; out?: number; size?: number; rot?: number; hue?: 'lemon' | 'ink' | 'orange'; maxW?: number}> = ({text, y, age, out = 0, size = 56, rot = 0, hue = 'lemon', maxW = 940}) => {
  const f = 0.5;
  const max = Math.floor((maxW - 70) / (size * f));
  let lines = wrap(text, max);
  if (lines.length === 2) { const ws = text.split(' '); let best = lines, bw = 1e9; for (let k = 1; k < ws.length; k++) { const a = ws.slice(0, k).join(' '), b = ws.slice(k).join(' '); const m = Math.max(a.length, b.length); if (m < bw && m <= max) { bw = m; best = [a, b]; } } lines = best; }
  const lh = size * 1.1;
  const w = Math.min(maxW, Math.max(...lines.map((l) => l.length)) * size * f + 70);
  const h = lines.length * lh + 26;
  const top = Math.max(y - h / 2, 284);
  const pop = age < 0.16 ? 1 + 0.2 * (1 - age / 0.16) : 1;
  const bg = hue === 'lemon' ? C.lemon : hue === 'orange' ? C.orange : C.ink;
  const fg = hue === 'ink' ? C.lemon : C.ink;
  return <g opacity={clamp(1 - out) * clamp(age / 0.05 + 0.2)} transform={`translate(540 ${top + h / 2}) rotate(${rot}) scale(${pop}) translate(-540 ${-(top + h / 2)})`}>
    <rect x={540 - w / 2 + 9} y={top + 9} width={w} height={h} rx={16} fill={hue === 'ink' ? C.violet : C.ink} />
    <rect x={540 - w / 2} y={top} width={w} height={h} rx={16} fill={bg} stroke={C.ink} strokeWidth={5} />
    {lines.map((l, i) => <text key={i} x={540} y={top + 13 + size * 0.84 + i * lh} textAnchor="middle" fontFamily={JOST} fontWeight={800} fontSize={size} fill={fg}>{l}</text>)}
  </g>;
};

// ---------------------------------------------------------------------------------------- ball wipe
/** A violet ball rolls left to right across the foreground; the next shot opens as an iris in its wake. */
export const WIPE_DUR = 0.7;
export const wipeGeom = (k: number) => {
  const x = lerp(-260, 1340, smooth(k, 0, 1) * 0.35 + k * 0.65);
  const rIris = k < 0.12 ? 0 : (k - 0.12) / 0.88 * 1500;
  return {x, y: 1010, rIris, cx: x - 150};
};
export const WipeBall: React.FC<{k: number}> = ({k}) => {
  const g = wipeGeom(k);
  return <g>
    <ellipse cx={g.x + 10} cy={g.y + 215} rx={210} ry={30} fill={C.ink} opacity={0.3} />
    <Ball x={g.x} y={g.y} r={220} color={C.violet} spin={g.x * 0.4} shadow={false} />
    <circle cx={g.x - 60} cy={g.y - 100} r={34} fill={C.cream} opacity={0.35} />
  </g>;
};

// ---------------------------------------------------------------------------------------- the set (bay)
export const Wall: React.FC<{t: number}> = ({t}) => <g>
  <rect x={-500} y={-500} width={2080} height={1320} fill={C.wall} />
  <Memphis x0={-300} y0={-200} x1={1380} y1={680} n={56} seed={1} op={0.85} t={t} />
  <rect x={-500} y={690} width={2080} height={112} fill={C.ink} />
  <rect x={-500} y={690} width={2080} height={12} fill={C.lemon} />
  {Array.from({length: 14}, (_, i) => <rect key={i} x={-300 + i * 150} y={730} width={70} height={40} rx={8} fill="#0E0C1C" />)}
</g>;

export const Carpet: React.FC<{t: number}> = ({t}) => <g>
  <rect x={-500} y={780} width={2080} height={1500} fill="#251F4A" />
  <Memphis x0={-300} y0={810} x1={1380} y1={2200} n={90} seed={2} op={0.9} t={0} />
</g>;

export const LanesBg: React.FC<{t: number; pins7: boolean[]; pins8: boolean[]}> = ({t, pins7, pins8}) => <g>
  <Lane lane={0} pins={pins7} t={t} />
  <Lane lane={1} pins={pins8} t={t} />
</g>;

export const ReturnHump: React.FC<{lemon?: number; violet?: number; lemonY?: number}> = ({lemon = 1, violet = 0, lemonY = 0}) => <g>
  <path d="M 478 1210 L 482 1118 Q 540 1070 598 1118 L 602 1210 Z" fill={C.ink} />
  <path d="M 490 1210 L 494 1124 Q 540 1086 586 1124 L 590 1210 Z" fill={C.teal} />
  <rect x={512} y={1150} width={56} height={14} rx={7} fill={C.ink} opacity={0.5} />
  {lemon > 0 && <Ball x={523} y={1090 + lemonY} r={31} color={C.lemon} spin={20} />}
  {violet > 0 && <Ball x={557} y={1090} r={31} color={C.violet} spin={-20} />}
</g>;
