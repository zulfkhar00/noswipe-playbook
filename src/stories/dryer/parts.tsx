import React from 'react';
import {clamp, lerp, smooth, springIn} from '../../lib/motion';
import {DrumDoor, HER, HIM, Note, STAMP, Sock, Strip, Tee, useInk} from './world';

// Shared screens for The Dryer Notes from part 2 on: the A/B vote board, the note close-up, the
// "next night" sheet, the rewind drum, the end card, and the small doodles drawn on the vote cards.

export type Line = {text: string; at: number; sign?: boolean};

/** A full-frame sheet that slides up into place at `a` and away at `z`. */
export const Sheet: React.FC<{t: number; a: number; z: number; bg?: string; children?: React.ReactNode}> = ({t, a, z, bg = 'b10', children}) => {
  const {ink} = useInk();
  const inK = smooth(t, a - 0.3, a + 0.15), outK = smooth(t, z - 0.25, z + 0.1);
  if (inK <= 0 || outK >= 1) return null;
  return <g transform={`translate(0 ${lerp(1960, 0, inK) - 1960 * outK})`}>
    <rect x={-20} y={-20} width={1120} height={1960} fill={ink('w')} />
    <rect x={-20} y={-20} width={1120} height={1960} fill={ink(bg)} />
    {children}
  </g>;
};

/** Close-up of a note, big enough to read; `extra` sits on the paper (a sock, a smiley). */
export const CloseUp: React.FC<{t: number; a: number; z: number; lines: Line[]; font?: string; extra?: React.ReactNode; below?: React.ReactNode}> = ({t, a, z, lines, font = HER, extra, below}) => {
  const drift = (t - a) * 6;
  const h = (lines.length + 1) * 76 * 1.25 + 40;
  return <Sheet t={t} a={a} z={z}>
    {below}
    <g transform={`translate(540 ${900 - drift}) rotate(${-2 + drift * 0.05}) scale(${1 + drift * 0.004})`}>
      <Note t={t} lines={lines} w={980} h={h} font={font} size={76} />
      {extra}
    </g>
  </Sheet>;
};

export const Bleach: React.FC<{s?: number}> = ({s = 1}) => {
  const {ink} = useInk();
  return <g transform={`scale(${s})`}>
    <path d="M -70 110 L -70 -40 Q -70 -80 -30 -90 L -20 -130 L 20 -130 L 30 -90 Q 70 -80 70 -40 L 70 110 Z" fill={ink('b')} />
    <rect x={-24} y={-150} width={48} height={26} fill={ink('bp')} />
    <rect x={-56} y={-20} width={112} height={74} fill={ink('w')} />
    <text y={28} textAnchor="middle" fontFamily={STAMP} fontWeight={700} fontSize={34} fill={ink('b')}>BLEACH</text>
  </g>;
};

export const Phone: React.FC = () => {
  const {ink} = useInk();
  return <g>
    <rect x={-60} y={-110} width={120} height={220} rx={20} fill={ink('b')} />
    <rect x={-46} y={-86} width={92} height={160} rx={8} fill={ink('w')} />
    {[0, 1, 2].map((r) => [0, 1, 2].map((c) => <circle key={`${r}${c}`} cx={-26 + c * 26} cy={-50 + r * 32} r={9} fill={ink('b35')} />))}
    <text y={66} textAnchor="middle" fontFamily={STAMP} fontWeight={700} fontSize={30} fill={ink('p')}>???</text>
  </g>;
};

export const NameTag: React.FC = () => {
  const {ink} = useInk();
  return <g transform="rotate(-6)">
    <rect x={-110} y={-80} width={220} height={160} rx={14} fill={ink('p')} />
    <text y={-34} textAnchor="middle" fontFamily={STAMP} fontWeight={700} fontSize={40} fill={ink('w')}>HELLO</text>
    <text y={-6} textAnchor="middle" fontFamily={STAMP} fontWeight={700} fontSize={20} fill={ink('w')}>MY NAME IS</text>
    <rect x={-94} y={8} width={188} height={60} fill={ink('w')} />
    <text y={56} textAnchor="middle" fontFamily={HIM} fontWeight={700} fontSize={42} fill={ink('b')}>Leo</text>
  </g>;
};

/** A lightbulb: the bright idea nobody asked for. */
export const Bulb: React.FC = () => {
  const {ink} = useInk();
  return <g>
    {[-150, -115, -90, -65, -30].map((a) => <path key={a} d="M 0 -128 L 0 -156" stroke={ink('p')} strokeWidth={8} strokeLinecap="round" transform={`rotate(${a + 90} 0 -20)`} />)}
    <path d="M -34 50 Q -34 18 -54 -4 Q -76 -32 -72 -62 Q -64 -112 0 -116 Q 64 -112 72 -62 Q 76 -32 54 -4 Q 34 18 34 50 Z" fill={ink('w')} stroke={ink('b')} strokeWidth={7} strokeLinejoin="round" />
    <path d="M -16 46 L -16 -10 q 8 -26 16 0 q 8 26 16 0 L 16 46" fill="none" stroke={ink('p')} strokeWidth={5} />
    {[0, 1, 2].map((k) => <rect key={k} x={-36} y={52 + k * 20} width={72} height={14} rx={6} fill={ink('b')} />)}
  </g>;
};

/** Two speech bubbles, one each. */
export const Bubbles: React.FC = () => {
  const {ink} = useInk();
  return <g>
    <path d="M -110 -100 h 140 q 20 0 20 20 v 70 q 0 20 -20 20 h -90 l -36 34 l 6 -34 h -20 q -20 0 -20 -20 v -70 q 0 -20 20 -20 Z" fill={ink('w')} stroke={ink('b')} strokeWidth={7} strokeLinejoin="round" />
    <path d="M -20 0 h 140 q 20 0 20 20 v 70 q 0 20 -20 20 h -20 l 6 34 l -36 -34 h -90 q -20 0 -20 -20 v -70 q 0 -20 20 -20 Z" fill={ink('p')} stroke={ink('bp')} strokeWidth={6} strokeLinejoin="round" />
    <path d="M 0 -16 c -8 -16 -32 -8 -24 10 l 24 22 l 24 -22 c 8 -18 -16 -26 -24 -10 Z" fill={ink('w')} transform="translate(50 70)" />
  </g>;
};

/** A curling till receipt with his number scribbled on it. */
export const Receipt: React.FC = () => {
  const {ink} = useInk();
  return <g transform="rotate(-8)">
    <path d="M -70 -120 L 70 -120 L 70 100 l -14 14 l -14 -14 l -14 14 l -14 -14 l -14 14 l -14 -14 l -14 14 l -14 -14 l -14 14 l -14 -14 Z" fill={ink('w')} stroke={ink('b')} strokeWidth={6} strokeLinejoin="round" />
    {[0, 1, 2].map((k) => <rect key={k} x={-50} y={-96 + k * 22} width={k === 1 ? 60 : 100} height={7} fill={ink('b35')} />)}
    <path d="M -50 10 q 10 -24 20 0 t 20 0 t 20 0 t 20 0 t 20 0" fill="none" stroke={ink('p')} strokeWidth={7} strokeLinecap="round" />
    <path d="M -50 50 q 10 -24 20 0 t 20 0 t 20 0" fill="none" stroke={ink('p')} strokeWidth={7} strokeLinecap="round" />
  </g>;
};

/** A wall clock at `h`:`m`. */
export const ClockFace: React.FC<{h?: number; m?: number; r?: number}> = ({h = 9, m = 0, r = 100}) => {
  const {ink} = useInk();
  return <g>
    <circle r={r} fill={ink('w')} stroke={ink('bp')} strokeWidth={r * 0.1} />
    {Array.from({length: 12}, (_, k) => <rect key={k} x={-r * 0.04} y={-r * 0.86} width={r * 0.08} height={r * 0.16} fill={ink('b')} transform={`rotate(${k * 30})`} />)}
    <rect x={-r * 0.07} y={-r * 0.52} width={r * 0.14} height={r * 0.58} rx={r * 0.07} fill={ink('bp')} transform={`rotate(${(h + m / 60) * 30})`} />
    <rect x={-r * 0.05} y={-r * 0.78} width={r * 0.1} height={r * 0.84} rx={r * 0.05} fill={ink('p')} transform={`rotate(${m * 6})`} />
    <circle r={r * 0.09} fill={ink('bp')} />
  </g>;
};

/** The laundromat door with a CLOSED sign: going home. */
export const Door: React.FC = () => {
  const {ink} = useInk();
  return <g>
    <rect x={-80} y={-130} width={160} height={260} fill={ink('b35')} stroke={ink('b')} strokeWidth={6} />
    <rect x={-56} y={-104} width={112} height={120} fill={ink('bp70')} stroke={ink('b')} strokeWidth={5} />
    <circle cx={56} cy={40} r={9} fill={ink('b')} />
    <g transform="translate(0 -40) rotate(-6)">
      <rect x={-50} y={-20} width={100} height={40} fill={ink('w')} stroke={ink('b')} strokeWidth={4} />
      <text y={12} textAnchor="middle" fontFamily={STAMP} fontWeight={700} fontSize={28} fill={ink('p')}>CLOSED</text>
    </g>
  </g>;
};

/** A folded note with a pen across it: one last note. */
export const PenNote: React.FC = () => {
  const {ink} = useInk();
  return <g>
    <rect x={-90} y={-80} width={180} height={150} fill={ink('w')} stroke={ink('b35')} strokeWidth={5} transform="rotate(-6)" />
    {[0, 1, 2].map((k) => <rect key={k} x={-64} y={-50 + k * 34} width={k === 2 ? 70 : 120} height={6} fill={ink('p')} transform="rotate(-6)" />)}
    <g transform="rotate(32)">
      <rect x={-12} y={-130} width={24} height={200} rx={6} fill={ink('b')} />
      <path d="M -12 70 L 0 104 L 12 70 Z" fill={ink('bp')} />
      <rect x={-12} y={-130} width={24} height={30} fill={ink('p')} />
    </g>
  </g>;
};

export const Doodle: React.FC<{draw: string}> = ({draw}) => {
  const {ink} = useInk();
  if (draw === 'bleach') return <Bleach s={0.95} />;
  if (draw === 'phone') return <Phone />;
  if (draw === 'nametag') return <NameTag />;
  if (draw === 'bulb') return <Bulb />;
  if (draw === 'bubbles') return <Bubbles />;
  if (draw === 'receipt') return <Receipt />;
  if (draw === 'clock') return <ClockFace r={110} />;
  if (draw === 'door') return <Door />;
  if (draw === 'penNote') return <PenNote />;
  return <g transform="translate(-10 0)">
    <g transform="translate(-40 0) rotate(-8) scale(0.44)"><Tee k={1} /></g>
    <g transform="translate(50 10) rotate(8) scale(0.44)"><Tee k={1} spec="p70" /></g>
    <path d="M 0 -120 c -10 -20 -40 -10 -30 12 l 30 28 l 30 -28 c 10 -22 -20 -32 -30 -12 Z" fill={ink('p')} transform="translate(0 10)" />
  </g>;
};

export type Card = {letter: 'A' | 'B'; l1: string; l2: string; draw: string; at: number};

/** One vote card: letter stamp, doodle, his two lines. `dim` fades it (the option not being played). */
export const ChoiceCard: React.FC<{t: number; c: Card; cx: number; cy: number; rot: number; dim?: number; lift?: number}> = ({t, c, cx, cy, rot, dim = 0, lift = 0}) => {
  const {ink} = useInk();
  const k = c.at < 0 ? 1 : springIn(t, c.at, 0.45);
  return <g transform={`translate(${cx} ${cy + (1 - clamp(k)) * 200}) rotate(${rot}) scale(${(0.6 + 0.4 * k) * (1 + 0.06 * lift)})`} opacity={clamp(k * 3) * (1 - 0.6 * dim)}>
    <rect x={-442} y={-182} width={900} height={370} fill={ink('b20', true)} />
    <rect x={-450} y={-190} width={900} height={370} fill={ink('w')} stroke={ink(lift > 0.5 ? 'p' : 'b')} strokeWidth={6 + 8 * lift} />
    <circle cx={-390} cy={-130} r={54} fill={ink(c.letter === 'A' ? 'b' : 'p')} />
    <text x={-390} y={-104} textAnchor="middle" fontFamily={STAMP} fontWeight={700} fontSize={80} fill={ink('w')}>{c.letter}</text>
    <g transform="translate(-250 15)"><Doodle draw={c.draw} /></g>
    <text x={-90} y={-10} fontFamily={HIM} fontWeight={700} fontSize={58} fill={ink('bp')}>{c.l1}</text>
    <text x={-90} y={70} fontFamily={HIM} fontWeight={700} fontSize={58} fill={ink('bp')}>{c.l2}</text>
  </g>;
};

/** The vote board: question, two cards, "comment A or B". */
export const Board: React.FC<{t: number; a: number; z: number; question?: string; cards: Card[]; commentAt?: number; pick?: {letter: 'A' | 'B'; at: number}}> = ({t, a, z, question, cards, commentAt, pick}) => {
  const pk = pick ? smooth(t, pick.at, pick.at + 0.3) : 0;
  return <Sheet t={t} a={a} z={z} bg="p10">
    {question && <Strip text={question} y={330} k={smooth(t, a + 0.2, a + 0.55)} size={58} />}
    {cards.map((c, i) => <ChoiceCard key={c.letter} t={t} c={c} cx={540} cy={i ? 1050 : 640} rot={i ? 2 : -2}
      dim={pick && pick.letter !== c.letter ? pk : 0} lift={pick && pick.letter === c.letter ? pk : 0} />)}
    {commentAt !== undefined && <Strip text="comment A or B" y={1320} k={smooth(t, commentAt, commentAt + 0.35)} size={64} spec="p" rot={1.5} />}
  </Sheet>;
};

/** "next night.": a dark sheet with a moon. */
export const NightCard: React.FC<{t: number; a: number; z: number; text: string}> = ({t, a, z, text}) => {
  const {ink} = useInk();
  return <Sheet t={t} a={a} z={z} bg="bp70">
    <circle cx={760} cy={640} r={90} fill={ink('w')} />
    <circle cx={800} cy={620} r={80} fill={ink('bp70')} />
    {[[200, 500], [330, 760], [880, 980], [150, 1150], [620, 420]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={7} fill={ink('w')} />)}
    <Strip text={text} y={960} k={smooth(t, a, a + 0.2)} size={110} spec="p" rot={-2} />
  </Sheet>;
};

/** The rewind: the drum spinning backwards, the print jolting. */
export const RewindDrum: React.FC<{t: number; a: number; z: number}> = ({t, a, z}) => {
  const {ink} = useInk();
  const u = t - a;
  return <Sheet t={t} a={a} z={z} bg="b20">
    <g transform={`translate(540 860) rotate(${-u * 90})`}><DrumDoor t={t} r={220} spin={-u * 900} /></g>
    <g transform="translate(540 430)">
      <path d="M 0 -50 L -80 0 L 0 50 Z M 90 -50 L 10 0 L 90 50 Z" fill={ink('p')} transform="translate(-45 0)" />
    </g>
  </Sheet>;
};

/** A small note slapped onto a sheet, for the montage. Hers in script, his on a receipt. */
export const SlapNote: React.FC<{t: number; at: number; x: number; y: number; rot: number; who: 'him' | 'her'; text: string; doodle?: string}> = ({t, at, x, y, rot, who, text, doodle}) => {
  const {ink} = useInk();
  const k = springIn(t, at, 0.35);
  if (k <= 0) return null;
  const w = Math.max(420, text.length * 30 + 80), h = 150;
  return <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${0.5 + 0.5 * k})`} opacity={clamp(k * 3)}>
    <rect x={-w / 2 + 8} y={-h / 2 + 10} width={w} height={h} fill={ink('b20', true)} />
    <rect x={-w / 2} y={-h / 2} width={w} height={h} fill={ink('w')} stroke={ink(who === 'her' ? 'p35' : 'b35')} strokeWidth={4} />
    <rect x={-50} y={-h / 2 - 18} width={100} height={36} fill={ink(who === 'her' ? 'p20' : 'b20', true)} transform="rotate(-5)" />
    <text y={18} textAnchor="middle" fontFamily={who === 'her' ? HER : HIM} fontWeight={700} fontSize={56} fill={ink(who === 'her' ? 'b' : 'bp')}>{text}</text>
    {/* A tiny doodle in the corner: his pink tee in a hat, her drawing of the sock in a scarf. */}
    {doodle === 'tee' && <g transform={`translate(${w / 2 + 70} 10) rotate(12) scale(0.36)`}>
      <Tee k={1} />
      <path d="M -90 -150 L 90 -150 L 60 -150 L 50 -230 L -50 -230 L -60 -150 Z" fill={ink('b')} />
    </g>}
    {doodle === 'sock' && <g transform={`translate(${-w / 2 - 40} -10) rotate(-10)`}>
      <Sock x={0} y={0} s={0.5} />
      <rect x={-24} y={-48} width={48} height={18} fill={ink('b')} />
      <path d="M 18 -40 l 14 40 l -12 0 Z" fill={ink('b')} />
    </g>}
  </g>;
};

/** End card: the drum tumbling, the season's name, the vote, and a tease for the next part. */
export const EndCard: React.FC<{t: number; a: number; part: number; tease: string}> = ({t, a, part, tease}) => {
  return <Sheet t={t} a={a} z={999}>
    <g transform={`translate(540 860) rotate(${(t - a) * 4})`}><DrumDoor t={t} r={190} spin={(t - a) * 240} /></g>
    <Strip text="the dryer notes" y={360} k={smooth(t, a + 0.3, a + 0.6)} size={96} spec="p" rot={-2} />
    <Strip text={`part ${part}`} y={500} k={smooth(t, a + 0.6, a + 0.9)} size={56} rot={1.5} />
    <Strip text="comment A or B" y={1200} k={smooth(t, a + 0.9, a + 1.2)} size={60} spec="p" rot={-1} />
    <Strip text={tease} y={1320} k={smooth(t, a + 1.3, a + 1.6)} size={46} rot={1} />
  </Sheet>;
};
