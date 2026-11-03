import React, {createContext, useContext} from 'react';
import {Img, staticFile} from 'remotion';
import {clamp, lerp, smooth} from '../../lib/motion';

// "The Dryer Notes", the story account's fourth season: a silent romance told in notes left on two
// dryers in a night laundromat. The look is a two-colour risograph print: fluorescent pink and medium
// blue on cream paper, halftone dots for tints, purple where the inks overprint, and the pink plate
// slightly out of register (it shifts a little a few times a second, like a hand-fed print).
//
// Everything is drawn twice, once per ink plate. Shapes say which ink they use with a spec string:
// 'b' blue, 'p' pink, 'bp' both (purple), 'w' paper (no ink: knocks out what's behind), and a number
// for a halftone tint, e.g. 'p35' or 'b10'. `useInk()` turns a spec into the fill for the current plate.

export const INK = {b: '#2f54a8', p: '#ff4fa3'};
export const PAPER = '#f4ecdc';
export const STAMP = '"DIN Condensed", "Barlow Condensed", "Futura", "Jost", sans-serif';
export const HER = '"Bradley Hand", "Caveat", cursive';
export const HIM = '"Noteworthy", "Patrick Hand", "Chalkboard SE", sans-serif';

type Plate = 'b' | 'p';
const PlateCtx = createContext<Plate>('b');
const TINTS = [10, 20, 35, 50, 70];

/** `ink(spec)` → fill for this plate; `ink(spec, true)` leaves other plates untouched (for overlays). */
export const useInk = () => {
  const plate = useContext(PlateCtx);
  const ink = (spec: string, over = false) => {
    if (spec !== 'w' && spec.replace(/\d+/g, '').includes(plate)) {
      const tint = parseInt(spec.replace(/\D+/g, '') || '100', 10);
      return tint >= 100 ? INK[plate] : `url(#ht${over ? 'o' : ''}-${plate}-${TINTS.reduce((a, c) => (Math.abs(c - tint) < Math.abs(a - tint) ? c : a))})`;
    }
    return over ? 'none' : '#fff';
  };
  return {ink, plate, id: (name: string) => `${name}-${plate}`};
};

const Halftones: React.FC = () => <defs>
  {(['b', 'p'] as Plate[]).flatMap((pl) => TINTS.flatMap((tint) => [false, true].map((over) => {
    const s = 10, r = s * Math.sqrt(tint / 100 / Math.PI);
    return <pattern key={`${pl}${tint}${over}`} id={`ht${over ? 'o' : ''}-${pl}-${tint}`} width={s} height={s} patternUnits="userSpaceOnUse" patternTransform={`rotate(${pl === 'b' ? 15 : 75})`}>
      {!over && <rect width={s} height={s} fill="#fff" />}
      <circle cx={s / 2} cy={s / 2} r={r} fill={INK[pl]} />
    </pattern>;
  })))}
</defs>;

/** The print: paper, the blue plate, the pink plate slightly off register, paper grain on top. */
export const Riso: React.FC<{t: number; jolt?: number; children: React.ReactNode}> = ({t, jolt = 0, children}) => {
  const step = Math.floor(t * (8 + 16 * jolt));
  const dx = 3 + (2 + 12 * jolt) * Math.sin(step * 1.7), dy = -2 + (1.5 + 8 * jolt) * Math.cos(step * 2.3);
  return <>
    <svg width={1080} height={1920} style={{position: 'absolute', background: PAPER}}>
      <Halftones />
      <g style={{mixBlendMode: 'multiply', isolation: 'isolate'}}><PlateCtx.Provider value="b">{children}</PlateCtx.Provider></g>
      <g style={{mixBlendMode: 'multiply', isolation: 'isolate'}} transform={`translate(${dx} ${dy})`}><PlateCtx.Provider value="p">{children}</PlateCtx.Provider></g>
    </svg>
    <Img src={staticFile('dryer/paper.png')} style={{position: 'absolute', width: 1080, height: 1920, mixBlendMode: 'multiply', opacity: 0.9}} />
  </>;
};

/** Camera: world point (cx, cy) at frame centre, zoom s; planes with factor f move less. */
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

export const MACHINES = [-180, 60, 300, 540, 780, 1020, 1260];
export const TOP = 820, FLOOR = 1300;

/** Back wall: pink halftone, a blue wainscot, tube lights, the pockets sign, the clock, a night window. */
export const Wall: React.FC<{t: number; hm?: [number, number]}> = ({t, hm}) => {
  const {ink} = useInk();
  const hour = hm ? hm[0] : 11, min = hm ? hm[1] : 38 + t / 20;
  return <g>
    <rect x={-700} y={-400} width={2600} height={FLOOR + 400} fill={ink('p10')} />
    <rect x={-700} y={1120} width={2600} height={FLOOR - 1120} fill={ink('b20')} />
    <rect x={-700} y={1112} width={2600} height={10} fill={ink('b')} />
    {[-300, 300, 900, 1500].map((x) => <g key={x}>
      <rect x={x - 170} y={150} width={340} height={26} rx={13} fill={ink('w')} stroke={ink('b')} strokeWidth={5} />
      <path d={`M ${x - 220} 176 L ${x + 220} 176 L ${x + 320} 600 L ${x - 320} 600 Z`} fill={ink('b10', true)} opacity={0.5} />
    </g>)}
    {/* The sign every laundromat has. */}
    <g transform="translate(540 230) rotate(-1.5)">
      <rect x={-300} y={-60} width={600} height={120} fill={ink('w')} stroke={ink('b')} strokeWidth={6} />
      <text y={-8} textAnchor="middle" fontFamily={STAMP} fontWeight={700} fontSize={50} letterSpacing={3} fill={ink('b')}>PLEASE CHECK</text>
      <text y={44} textAnchor="middle" fontFamily={STAMP} fontWeight={700} fontSize={50} letterSpacing={3} fill={ink('p')}>YOUR POCKETS</text>
    </g>
    {/* Clock: 11:38 and creeping, unless `hm` sets it. */}
    <g transform="translate(1150 260)">
      <circle r={74} fill={ink('w')} stroke={ink('bp')} strokeWidth={8} />
      {Array.from({length: 12}, (_, k) => <rect key={k} x={-3} y={-64} width={6} height={12} fill={ink('b')} transform={`rotate(${k * 30})`} />)}
      <rect x={-5} y={-40} width={10} height={44} rx={5} fill={ink('bp')} transform={`rotate(${(hour + min / 60) * 30})`} />
      <rect x={-3.5} y={-58} width={7} height={62} rx={3.5} fill={ink('bp')} transform={`rotate(${min * 6})`} />
    </g>
    {/* A night window by the door. */}
    <g transform="translate(-470 380)">
      <rect x={-150} y={0} width={300} height={560} fill={ink('bp70')} stroke={ink('b')} strokeWidth={10} />
      <rect x={-150} y={270} width={300} height={10} fill={ink('b')} />
      <circle cx={70} cy={120} r={16} fill={ink('w')} />
      <circle cx={70} cy={120} r={50} fill={ink('p20', true)} />
    </g>
  </g>;
};

/** A row of dryers. `spin` lists the dryers that are running (clothes tumbling behind the glass). */
export const Dryers: React.FC<{t: number; spin: number[]; spinRate?: number}> = ({t, spin, spinRate = 1}) => {
  const {ink, id} = useInk();
  return <g>
    {MACHINES.map((x, k) => {
      const n = k + 1, on = spin.includes(n);
      const a = t * 260 * spinRate + n * 40;
      return <g key={n}>
        <rect x={x - 112} y={TOP} width={224} height={FLOOR - TOP} fill={ink('w')} stroke={ink('b')} strokeWidth={6} />
        <rect x={x - 112} y={TOP} width={224} height={96} fill={ink('b20')} stroke={ink('b')} strokeWidth={6} />
        <circle cx={x - 62} cy={TOP + 48} r={30} fill={ink(n === 4 || n === 5 ? 'bp' : 'b')} />
        <text x={x - 62} y={TOP + 64} textAnchor="middle" fontFamily={STAMP} fontWeight={700} fontSize={46} fill={ink('w')}>{n}</text>
        <rect x={x + 10} y={TOP + 30} width={60} height={14} rx={4} fill={ink('b')} />
        <circle cx={x + 82} cy={TOP + 66} r={9} fill={ink(on ? 'p' : 'b35')} />
        <circle cx={x} cy={TOP + 240} r={138} fill={ink('b35')} stroke={ink('b')} strokeWidth={6} />
        <clipPath id={id(`drum${n}`)}><circle cx={x} cy={TOP + 240} r={104} /></clipPath>
        <circle cx={x} cy={TOP + 240} r={104} fill={ink(on ? 'b20' : 'b10')} stroke={ink('b')} strokeWidth={5} />
        {on && <g clipPath={`url(#${id(`drum${n}`)})`}>
          {[0, 1, 2, 3].map((j) => {
            const ang = (a + j * 92) * Math.PI / 180;
            return <ellipse key={j} cx={x + 56 * Math.cos(ang)} cy={TOP + 270 + 50 * Math.sin(ang)} rx={52} ry={30} transform={`rotate(${a + j * 40} ${x + 56 * Math.cos(ang)} ${TOP + 270 + 50 * Math.sin(ang)})`}
              fill={ink(j % 2 ? 'p' : 'b50')} />;
          })}
        </g>}
        <path d={`M ${x - 70} ${TOP + 180} q 30 -40 70 -46`} stroke={ink('w')} strokeWidth={10} strokeLinecap="round" fill="none" />
        <rect x={x - 112} y={FLOOR - 60} width={224} height={60} fill={ink('b10')} stroke={ink('b')} strokeWidth={6} />
      </g>;
    })}
  </g>;
};

export const Floor: React.FC = () => {
  const {ink} = useInk();
  return <g>
    <rect x={-700} y={FLOOR} width={2600} height={1300} fill={ink('w')} />
    {Array.from({length: 26 * 12}, (_, k) => { const i = k % 26, j = Math.floor(k / 26);
      return (i + j) % 2 ? <rect key={k} x={-700 + i * 100} y={FLOOR + j * 100} width={100} height={100} fill={ink('b10')} /> : null; })}
    <rect x={-700} y={FLOOR} width={2600} height={8} fill={ink('b')} />
  </g>;
};

/** A plastic laundry basket. `fill` is what's in it: his white tees (and one pair of jeans). */
export const Basket: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => {
  const {ink} = useInk();
  return <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -120 -150 q 30 -60 80 -30 q 40 -50 90 -10 q 40 -30 70 20 Z" fill={ink('w')} stroke={ink('b')} strokeWidth={5} />
    <path d="M -40 -170 q 20 -30 60 -20 l -10 40 Z" fill={ink('b70')} />
    <path d="M -150 -150 L 150 -150 L 125 0 L -125 0 Z" fill={ink('b')} />
    {[0, 1, 2].map((r) => [0, 1, 2, 3, 4, 5].map((c) => <rect key={`${r}${c}`} x={-118 + c * 40 + r * 2} y={-128 + r * 42} width={22} height={24} rx={6} fill={ink('w')} />))}
  </g>;
};

/** A pink tee: folded (k = 0) or held open (k = 1). */
export const Tee: React.FC<{k: number; spec?: string}> = ({k, spec = 'p'}) => {
  const {ink} = useInk();
  const w = lerp(150, 260, k), h = lerp(70, 300, k), sl = lerp(0, 80, k);
  return <g>
    <path d={`M ${-w / 2} ${-h / 2} L ${-w / 2 - sl} ${-h / 2 + sl * 0.5} L ${-w / 2 - sl * 0.6} ${-h / 2 + sl * 1.1} L ${-w / 2} ${-h / 2 + sl * 0.8} L ${-w / 2} ${h / 2} L ${w / 2} ${h / 2} L ${w / 2} ${-h / 2 + sl * 0.8} L ${w / 2 + sl * 0.6} ${-h / 2 + sl * 1.1} L ${w / 2 + sl} ${-h / 2 + sl * 0.5} L ${w / 2} ${-h / 2} L 30 ${-h / 2} Q 0 ${-h / 2 + 30 * k} -30 ${-h / 2} Z`}
      fill={ink(spec)} stroke={ink('bp')} strokeWidth={5} strokeLinejoin="round" />
    {k < 0.5 && [0.3, 0.65].map((u) => <path key={u} d={`M ${-w / 2 + 8} ${-h / 2 + h * u} L ${w / 2 - 8} ${-h / 2 + h * u}`} stroke={ink('bp')} strokeWidth={3} opacity={1 - 2 * k} />)}
  </g>;
};

/** The red sock that started it (pink is as red as a riso print gets). */
export const Sock: React.FC<{x: number; y: number; rot?: number; s?: number}> = ({x, y, rot = 0, s = 1}) => {
  const {ink} = useInk();
  return <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <path d="M -30 -110 L 30 -110 L 30 20 Q 30 60 70 66 Q 110 72 108 104 Q 104 134 60 132 L -6 130 Q -40 128 -36 90 Z" fill={ink('p')} stroke={ink('bp')} strokeWidth={5} strokeLinejoin="round" />
    <rect x={-32} y={-112} width={64} height={30} fill={ink('bp50')} />
    <path d="M 64 132 Q 112 128 104 96" fill={ink('bp50')} />
  </g>;
};

/** A handwritten note on paper. `lines` reveal one by one from their `at` times. */
export const Note: React.FC<{t: number; lines: {text: string; at: number; sign?: boolean}[]; w: number; h: number; font: string; size: number; tape?: boolean}> = ({t, lines, w, h, font, size, tape = true}) => {
  const {ink} = useInk();
  return <g>
    <rect x={-w / 2 + 10} y={-h / 2 + 14} width={w} height={h} fill={ink('b20', true)} />
    <rect x={-w / 2} y={-h / 2} width={w} height={h} fill={ink('w')} stroke={ink('b35')} strokeWidth={3} />
    {Array.from({length: Math.floor(h / (size * 1.25)) - 1}, (_, k) => <rect key={k} x={-w / 2 + 30} y={-h / 2 + size * 1.25 * (k + 1) + 16} width={w - 60} height={2.5} fill={ink('b20')} />)}
    {tape && <rect x={-70} y={-h / 2 - 22} width={140} height={44} fill={ink('p20', true)} transform={`rotate(-4 0 ${-h / 2})`} />}
    {lines.map((ln, i) => {
      const k = smooth(t, ln.at, ln.at + 0.5);
      const shown = Math.ceil(ln.text.length * clamp((t - ln.at) / Math.max(0.35, ln.text.length * 0.035)));
      return <text key={i} x={ln.sign ? w / 2 - 50 : -w / 2 + 40} y={-h / 2 + size * 1.25 * (i + 1) + 2 + (ln.sign ? size * 0.5 : 0)} textAnchor={ln.sign ? 'end' : 'start'}
        fontFamily={font} fontWeight={700} fontSize={size} fill={ink(ln.sign ? 'p' : 'b')} opacity={k > 0 ? 1 : 0}>
        <tspan>{ln.text.slice(0, shown)}</tspan><tspan opacity={0}>{ln.text.slice(shown)}</tspan>
      </text>;
    })}
  </g>;
};

/** A stamped strip: blue label, paper letters. The season's narration cards. */
export const Strip: React.FC<{text: string; y: number; k: number; rot?: number; size?: number; spec?: string}> = ({text, y, k, rot = -1.5, size = 56, spec = 'b'}) => {
  const {ink} = useInk();
  if (k <= 0) return null;
  const w = text.length * size * 0.44 + 70;
  const pop = 1 + 0.12 * Math.sin(Math.PI * clamp(k)) * (k < 1 ? 1 : 0);
  return <g transform={`translate(540 ${y}) rotate(${rot}) scale(${pop})`} opacity={clamp(k * 2)}>
    <rect x={-w / 2} y={-size * 0.78} width={w} height={size * 1.42} fill={ink(spec)} />
    <text x={0} y={size * 0.34} textAnchor="middle" fontFamily={STAMP} fontWeight={700} fontSize={size} letterSpacing={2} fill={ink('w')}>{text.toUpperCase()}</text>
  </g>;
};

export type Hands = [number, number, number, number];
export type Face = {look: number; mouth: 'flat' | 'o' | 'grin' | 'wince' | 'smile'; brows: number; tilt: number; blush?: number};

/** Him: front-facing riso figure, feet at (x, y). `hands` are hand positions relative to the feet. */
export const Guy: React.FC<{x: number; y: number; hands: Hands; face: Face; walk?: number; bob?: number; held?: React.ReactNode; front?: React.ReactNode; tee?: boolean}> = ({x, y, hands, face, walk = 0, bob = 0, held, front, tee = false}) => {
  const {ink} = useInk();
  const sw = Math.sin(walk * Math.PI * 2);
  const by = -Math.abs(Math.cos(walk * Math.PI * 2)) * 10 * (walk ? 1 : 0) + bob;
  const hx = face.look * 10, hy = -700 + by;
  const arm = (side: number, ex: number, ey: number) => {
    const sx = side * 98, sy = -575 + by;
    return `M ${sx} ${sy} Q ${sx + side * 40} ${(sy + ey) / 2 + 40} ${ex} ${ey}`;
  };
  const mouth = {
    flat: <path d={`M ${hx - 18} ${hy + 34} L ${hx + 18} ${hy + 34}`} stroke={ink('bp')} strokeWidth={6} strokeLinecap="round" />,
    o: <ellipse cx={hx} cy={hy + 36} rx={10} ry={14} fill={ink('bp')} />,
    grin: <path d={`M ${hx - 30} ${hy + 26} Q ${hx} ${hy + 64} ${hx + 30} ${hy + 26} Z`} fill={ink('bp')} />,
    smile: <path d={`M ${hx - 24} ${hy + 30} Q ${hx} ${hy + 48} ${hx + 24} ${hy + 30}`} stroke={ink('bp')} strokeWidth={6} strokeLinecap="round" fill="none" />,
    wince: <><rect x={hx - 26} y={hy + 26} width={52} height={20} rx={6} fill={ink('w')} stroke={ink('bp')} strokeWidth={5} /><path d={`M ${hx - 9} ${hy + 26} v 20 M ${hx + 9} ${hy + 26} v 20`} stroke={ink('bp')} strokeWidth={3} /></>,
  }[face.mouth];
  return <g transform={`translate(${x} ${y})`}>
    <ellipse cx={0} cy={6} rx={150} ry={22} fill={ink('b35', true)} />
    {/* Legs and shoes. */}
    {[-1, 1].map((s) => <g key={s}>
      <path d={`M ${s * 38} ${-330 + by} L ${s * 44 + s * sw * 26} -40`} stroke={ink('b70')} strokeWidth={66} strokeLinecap="round" />
      <ellipse cx={s * 50 + s * sw * 26} cy={-16} rx={46} ry={22} fill={ink('bp')} />
    </g>)}
    {/* Hoodie. */}
    <path d={`M -96 ${-300 + by} L -108 ${-560 + by} Q -100 ${-610 + by} -50 ${-620 + by} L 50 ${-620 + by} Q 100 ${-610 + by} 108 ${-560 + by} L 96 ${-300 + by} Z`} fill={ink('b')} />
    {tee ? <>
      {/* Hoodie open over the pink tee he dyed on purpose. */}
      <path d={`M -48 ${-612 + by} L 48 ${-612 + by} L 54 ${-300 + by} L -54 ${-300 + by} Z`} fill={ink('p')} />
      <path d={`M -48 ${-612 + by} L -54 ${-300 + by} M 48 ${-612 + by} L 54 ${-300 + by}`} stroke={ink('bp')} strokeWidth={5} />
      <path d={`M -26 ${-612 + by} Q 0 ${-585 + by} 26 ${-612 + by}`} stroke={ink('bp')} strokeWidth={4} fill="none" />
    </> : <path d={`M -60 ${-400 + by} L 60 ${-400 + by} L 70 ${-320 + by} L -70 ${-320 + by} Z`} fill="none" stroke={ink('w')} strokeWidth={5} />}
    {!tee && <path d={`M -26 ${-610 + by} L -20 ${-520 + by} M 26 ${-610 + by} L 20 ${-520 + by}`} stroke={ink('w')} strokeWidth={5} strokeLinecap="round" />}
    <path d={`M -70 ${-622 + by} Q 0 ${-580 + by} 70 ${-622 + by} Q 40 ${-650 + by} 0 ${-648 + by} Q -40 ${-650 + by} -70 ${-622 + by} Z`} fill={ink('b70')} />
    <rect x={-22} y={hy + 50} width={44} height={40} fill={ink('p35')} />
    {/* Head, tilting. */}
    <g transform={`rotate(${face.tilt} ${hx} ${hy + 60})`}>
      <circle cx={hx - 70} cy={hy + 6} r={16} fill={ink('p35')} stroke={ink('bp')} strokeWidth={4} />
      <circle cx={hx + 70} cy={hy + 6} r={16} fill={ink('p35')} stroke={ink('bp')} strokeWidth={4} />
      <circle cx={hx} cy={hy} r={72} fill={ink('p35')} stroke={ink('bp')} strokeWidth={5} />
      <path d={`M ${hx - 76} ${hy - 6} Q ${hx - 84} ${hy - 90} ${hx - 10} ${hy - 92} Q ${hx + 40} ${hy - 110} ${hx + 70} ${hy - 70} Q ${hx + 92} ${hy - 40} ${hx + 74} ${hy - 6} Q ${hx + 60} ${hy - 40} ${hx + 30} ${hy - 44} Q ${hx + 34} ${hy - 30} ${hx + 14} ${hy - 26} Q ${hx + 4} ${hy - 50} ${hx - 30} ${hy - 44} Q ${hx - 60} ${hy - 40} ${hx - 76} ${hy - 6} Z`} fill={ink('bp')} />
      {[-1, 1].map((s) => <g key={s}>
        <ellipse cx={hx + s * 26 + face.look * 10} cy={hy + 2} rx={8} ry={face.mouth === 'grin' ? 5 : 10} fill={ink('bp')} />
        <path d={`M ${hx + s * 26 - 14} ${hy - 22 - face.brows * 12 + (s > 0 ? 0 : face.brows * 0)} L ${hx + s * 26 + 14} ${hy - 24 - face.brows * 12 - s * face.brows * 4}`} stroke={ink('bp')} strokeWidth={6} strokeLinecap="round" />
      </g>)}
      {(face.blush ?? 0) > 0 && [-1, 1].map((s) => <ellipse key={s} cx={hx + s * 44} cy={hy + 22} rx={18} ry={10} fill={ink('p70', true)} opacity={face.blush} />)}
      {mouth}
    </g>
    {held}
    {/* Arms and hands. */}
    <path d={arm(-1, hands[0], hands[1])} stroke={ink('b')} strokeWidth={48} strokeLinecap="round" fill="none" />
    <path d={arm(1, hands[2], hands[3])} stroke={ink('b')} strokeWidth={48} strokeLinecap="round" fill="none" />
    {front}
    <circle cx={hands[0]} cy={hands[1]} r={26} fill={ink('p35')} stroke={ink('bp')} strokeWidth={4} />
    <circle cx={hands[2]} cy={hands[3]} r={26} fill={ink('p35')} stroke={ink('bp')} strokeWidth={4} />
  </g>;
};

/** Blend between hand poses keyed in time: [t, pose][], 0.35 s blends. */
export const handsAt = (keys: [number, Hands][], t: number, blend = 0.35): Hands => {
  let i = 0;
  while (i < keys.length - 1 && t >= keys[i + 1][0]) i++;
  const [, cur] = keys[i];
  const prev = i > 0 ? keys[i - 1][1] : cur;
  const u = smooth(t, keys[i][0], keys[i][0] + blend);
  return cur.map((v, k) => lerp(prev[k], v, u)) as Hands;
};

/** The signature: a dryer door, big, with the drum tumbling (forward, or backward for a rewind). */
export const DrumDoor: React.FC<{t: number; r: number; spin: number}> = ({t, r, spin}) => {
  const {ink, id} = useInk();
  return <g>
    <circle r={r * 1.32} fill={ink('b35')} stroke={ink('b')} strokeWidth={12} />
    <clipPath id={id('bigdrum')}><circle r={r} /></clipPath>
    <circle r={r} fill={ink('b10')} stroke={ink('b')} strokeWidth={10} />
    <g clipPath={`url(#${id('bigdrum')})`}>
      {[0, 1, 2, 3, 4, 5].map((j) => {
        const a = (spin + j * 60) * Math.PI / 180, cx = r * 0.5 * Math.cos(a), cy = r * 0.25 + r * 0.45 * Math.sin(a);
        return <ellipse key={j} cx={cx} cy={cy} rx={r * 0.5} ry={r * 0.28} transform={`rotate(${spin * 0.8 + j * 50} ${cx} ${cy})`} fill={ink(['p', 'b50', 'p35', 'b', 'bp50', 'p70'][j])} />;
      })}
    </g>
    <path d={`M ${-r * 0.65} ${-r * 0.35} q ${r * 0.25} ${-r * 0.4} ${r * 0.6} ${-r * 0.42}`} stroke={ink('w')} strokeWidth={r * 0.08} strokeLinecap="round" fill="none" opacity={0.9 + 0 * t} />
  </g>;
};
