import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, lerp, smooth} from '../../lib/motion';
import {MotionBlurWhen} from '../../lib/shots';
import {
  C, CARD_W, CamKey, Centerpiece, Defs, EndCard, Extras, GEL, Hand, Line, MARK, Marker, Mouth, NUN, NearPlane, Person, PersonPose, PhoneBody,
  SUSAN, SoftEllipse, SoftRect, SusanRing, Strip, Table, TentCard, Thumb, VoteBoard, VoteCard, WIPE_DUR, Wall, camAt, fitSize, keyAt, mkPose, planeT, textW, tipOf, track, wipeR,
} from './world';
import spec from '../../../specs/stories/table-ep4.json';

// Table Nine, part 4 "The seating chart". Silent. Frame 1 = ONE strip, two big faces, his phone lit mid-swipe, big tent card
// TABLE 2 / moved for family photos at her seat, aunt with clipboard small behind. Take 1 (take me with you) fails on him: family photo.
// Lazy Susan back = rewind. Take 2 (i'll swap our cards.): tiptoe swap, Raj at table 9, aunt double-take + shrug, (smooth.).
// Cliff: DJ booth LAST SONG, she slides (dance?), he freezes.

export const TABLE4_FPS = 60;
export const TABLE4_FRAMES = Math.round(spec.duration * TABLE4_FPS);
const B = spec.beats;
export type Hook4 = 'a' | 'b';

const HIM = {x: 255, y: 655}, HER = {x: 825, y: 655};
const DOWN0 = 1.7, DOWN1 = 1.85;
const GREEN = '#3C6B52';
const INK = C.aubergine;
const SKIN_AUNT = '#E6B795';
const wp = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const WIPE1 = B.wipe1;
const PP: React.FC<{who: 'him' | 'her'; x: number; y: number; s: number; t: number; pose: PersonPose; seed: number}> = ({who, x, y, s, t, pose, seed}) =>
  <g transform={`translate(${x} ${y}) scale(${s})`}><Person who={who} x={0} y={0} t={t} pose={pose} seed={seed} /></g>;

// ------------------------------------------------------------------------------------------ table poses
const P0 = [0.9, 0.8, 1.0, 0.3, 3, 0.55, 0, 0];
const HIM_KEYS: [number, number[]][] = [
  [0, P0], [1.6, P0], [1.75, [0.2, 0.5, 0.9, 0, 0, 0.2, 0, 0]],
  [2.0, [0.8, 0.9, 1.0, 0, 2, 0.4, 0, 0]], [2.4, [0.8, 0.9, 1.0, 0, 2, 0.4, 0, 0]],
  [2.5, [-0.2, 0, 0.3, 0, -2, 0.4, 0, 0.1]], [2.75, [-0.2, 0, 0.3, 0, -2, 0.4, 0, 0.1]],
  [2.85, [0.9, 0.9, 1.3, 0.4, 3, 0.6, 0, 0]], [3.05, [0.9, 0.9, 1.3, 0.4, 3, 0.6, 0, 0]],
  [3.2, [0.5, 0.9, 0.2, 0, 2, 0.3, 0, 0.05]], [4.4, [0.5, 0.9, 0.2, 0, 2, 0.3, 0, 0.05]], [4.55, [1, 0.1, 0.4, 0, -2, 0.5, 0, 0.1]], [9.5, [1, 0.1, 0.4, 0, -2, 0.5, 0, 0.1]],
  [9.6, [0.5, 0.9, 0.4, 0, 0, 0.3, 0, 0.05]], [11.3, [0.5, 0.9, 0.2, 0, 2, 0.3, 0, 0.05]], [12.6, [0.5, 0.9, 0.2, 0, 2, 0.3, 0, 0.05]], [12.7, [1, 0.1, 0.5, 0, -2, 0.5, 0, 0.05]], [14, [1, 0.1, 0.5, 0, -2, 0.5, 0, 0.05]],
];
const HIM_MOUTH: [number, Mouth][] = [[0, 'gulp'], [1.75, 'o'], [2.5, 'flat'], [2.85, 'o'], [3.2, 'flat'], [4.55, 'smirk'], [9.6, 'flat'], [12.7, 'smile']];
const Q0 = [-1, 0.1, 0.4, 0, -3, 0.15, 0, 0.1];
const HER_KEYS: [number, number[]][] = [
  [0, Q0], [1.9, Q0], [2.2, [-0.7, 0.8, 0.3, 0, -2, 0.2, 0, 0.05]], [2.8, [-0.7, 0.8, 0.3, 0, -2, 0.2, 0, 0.05]], [3.0, [-1, 0.2, 0.3, 0, -3, 0.2, 0, 0.1]],
  [3.3, [-0.5, 0.9, 0.2, 0, -2, 0.2, 0, 0.1]], [4.5, [-0.5, 0.9, 0.2, 0, -2, 0.2, 0, 0.1]], [4.7, [-1, 0.2, 0.4, 0, -4, 0.4, 0.1, 0.1]], [9.5, [-1, 0.2, 0.4, 0, -4, 0.4, 0.1, 0.1]],
  [9.6, [-0.5, 0.9, 0.2, 0, -2, 0.2, 0, 0.1]], [12.6, [-0.5, 0.9, 0.2, 0, -2, 0.2, 0, 0.1]], [12.8, [-1, 0.2, 0.4, 0, -4, 0.4, 0.1, 0.1]], [14, [-1, 0.2, 0.4, 0, -4, 0.4, 0.1, 0.1]],
];
const HER_MOUTH: [number, Mouth][] = [[0, 'smirk'], [2.2, 'flat'], [3.0, 'smirk'], [4.7, 'smile'], [9.6, 'smirk'], [12.8, 'smile']];
const himPose = (t: number): PersonPose => mkPose(track(HIM_KEYS, t), keyAt(t, HIM_MOUTH), 1 - smooth(t, DOWN0, DOWN1),
  {sweat: t < 1.8 ? 0.45 : t > 2.3 && t < 3.2 ? wp(t, 2.3, 3.2) : 0});
const herPose = (t: number): PersonPose => mkPose(track(HER_KEYS, t), keyAt(t, HER_MOUTH), 0);

const A0 = {x: 540, y: 900}, BB = {x: 540, y: 890};
const CAM: CamKey[] = [
  {t: 0, ...A0, z: 1.0}, {t: 3.0, ...A0, z: 1.03},
  {t: 3.05, ...BB, z: 1.08, wob: 0.6, cut: true}, {t: 4.8, ...BB, z: 1.1, wob: 0.6},
  {t: 4.8, ...A0, z: 1.0, cut: true}, {t: 5.0, ...A0, z: 1.01},
  {t: WIPE1, ...A0, z: 1.0, cut: true}, {t: 11.2, ...A0, z: 1.03},
  {t: 11.25, ...BB, z: 1.08, wob: 0.6, cut: true}, {t: 13.0, ...BB, z: 1.1, wob: 0.6},
];

// ------------------------------------------------------------------------------------------ phones and arms (as part 3)
const HIM_TICKS = [-0.1, ...Array.from({length: 6}, (_, i) => 0.2 + i * 0.3)];
const swipe = (t: number) => {
  let idx = 0;
  for (let i = 0; i < HIM_TICKS.length; i++) if (HIM_TICKS[i] <= t) idx = i;
  return {p: clamp((t - HIM_TICKS[idx]) / 0.26), dir: idx % 2 ? 1 : -1};
};
const PhoneUnit: React.FC<{who: 'him' | 'her'; t: number}> = ({who, t}) => {
  const him = who === 'him';
  const k = him ? smooth(t, DOWN0, DOWN1) : 1;
  const x = lerp(him ? 118 : 962, him ? 140 : 940, k);
  const y = lerp(1150, 1214, k) - 46 * Math.sin(k * Math.PI);
  const ang = lerp(him ? 8 : -8, him ? 90 : -90, k);
  const sy = lerp(1, 0.5, k);
  const {p, dir} = swipe(t);
  return <g transform={`translate(${x} ${y}) scale(1 ${sy}) rotate(${ang})`}>
    <PhoneBody who={who} t={t} cardPhase={him ? p : 0} k={k} swipeDir={dir} showCard />
    {him && k < 0.5 && <g opacity={smooth(p, 0, 0.04) * (1 - smooth(p, 0.62, 0.85))}><Thumb x={dir * (-26 + 62 * smooth(p, 0, 0.35))} y={52} rot={dir * 8} skin={C.skinHim} /></g>}
  </g>;
};
const Arm: React.FC<{who: 'him' | 'her'; t: number}> = ({who, t}) => {
  const him = who === 'him';
  const k = him ? smooth(t, DOWN0, DOWN1) : 1;
  const sh: [number, number] = him ? [62, 930] : [1018, 930];
  const hx = lerp(him ? 118 : 962, him ? 312 : 768, k), hy = lerp(1226, 1208, k);
  const col = him ? '#4A2A52' : C.eucDeep;
  const bow = him ? -34 : 34;
  return <g>
    <path d={`M ${sh[0]} ${sh[1]} Q ${(sh[0] + hx) / 2 + bow} ${(sh[1] + hy) / 2 + 40} ${hx} ${hy}`} fill="none" stroke={col} strokeWidth={76} strokeLinecap="round" />
    <Hand x={hx} y={hy - 12} rot={him ? 90 : -90} flip={!him} skin={him ? C.skinHim : C.skinHer} />
  </g>;
};
const SleeveHand: React.FC<{who: 'him' | 'her'; x: number; y: number; show: number}> = ({who, x, y, show}) => {
  const him = who === 'him';
  const ex = him ? -140 : 1220, ey = 1500;
  const off = 1 - smooth(show, 0, 1);
  const hx = x + (him ? -1 : 1) * 60 * off, hy = y + 60 * off;
  return <g opacity={clamp(show * 6)}>
    <path d={`M ${ex} ${ey} Q ${(ex + hx) / 2} ${hy + 150} ${hx} ${hy}`} fill="none" stroke={him ? '#4A2A52' : C.eucDeep} strokeWidth={80} strokeLinecap="round" />
    <Hand x={hx} y={hy} rot={him ? -62 : 62} flip={!him} skin={him ? C.skinHim : C.skinHer} />
  </g>;
};

// ------------------------------------------------------------------------------------------ the writing card and the marker
const HAND = (s: number) => `400 ${s}px "Permanent Marker"`;
type LDef = {text: string; y: number; rot: number; col: string; a: number; b: number; size: number};
const L_H1: LDef = {text: spec.cards.his_1, y: 30, rot: 1.5, col: C.terraDeep, a: B.write1, b: 4.4, size: 64};
const L_H2: LDef = {text: spec.cards.his_2, y: 30, rot: 1.5, col: C.terraDeep, a: B.write2, b: 12.5, size: 64};
const mkLine = (d: LDef, prog: number): Line => {
  const s = fitSize(d.text, HAND, d.size, 640);
  return {text: d.text, x0: -textW(d.text, HAND(s)) / 2, y: d.y, size: s, rot: d.rot, color: d.col, prog};
};
const lineAt = (d: LDef, t: number): Line => mkLine(d, wp(t, d.a, d.b));
const CS = 0.8;
const mainCard = (t: number) => {
  const take1 = t < WIPE1;
  const arrive = take1 ? smooth(t, 2.95, 3.25) : 1;
  const sl = take1 ? smooth(t, 4.55, 4.95) : smooth(t, 12.65, 12.95);
  return {x: lerp(-420, 330, arrive) + 140 * sl, y: 1005, s: CS, rot: 3 * sl};
};
const ROW = 1236;
type Held = {x: number; y: number; rot: number; capped: boolean; holder: 'him' | null};
const SEGS = [
  {line: L_H1, pick: 2.85, putTo: 4.7, restB: 400, restA: 470},
  {line: L_H2, pick: 11.2, putTo: 12.8, restB: 470, restA: 480},
];
const markerAt = (t: number): Held => {
  const capped = t < B.uncap;
  let idx = -1;
  SEGS.forEach((s, i) => { if (t >= s.pick) idx = i; });
  if (idx < 0) return {x: 400, y: ROW, rot: -6, capped, holder: null};
  const s = SEGS[idx], cs = mainCard(t);
  const tipAt = (p: number): [number, number] => { const [a, b] = tipOf(mkLine(s.line, p)); return [cs.x + cs.s * a, cs.y + cs.s * b + 4]; };
  const rot = -35, r = rot * Math.PI / 180;
  const place = (tip: [number, number]) => ({x: tip[0] + 16 - Math.cos(r) * 76, y: tip[1] + 44 - Math.sin(r) * 76});
  const blend = (tip: [number, number], restX: number, k: number): Held => {
    if (k <= 0) return {x: restX, y: ROW, rot: -6, capped, holder: null};
    const p = place(tip);
    return {x: lerp(restX, p.x, smooth(k, 0, 1)), y: lerp(ROW, p.y, smooth(k, 0, 1)), rot: lerp(-6, rot, smooth(k, 0, 1)), capped: capped && k < 1, holder: 'him'};
  };
  if (t < s.line.a) return blend(tipAt(0), s.restB, wp(t, s.pick, s.pick + 0.4));
  if (t <= s.line.b) return blend(tipAt(wp(t, s.line.a, s.line.b)), s.restB, 1);
  if (t < s.putTo) return blend(tipAt(1), s.restA, 1 - wp(t, s.line.b, s.putTo));
  return {x: s.restA, y: ROW, rot: -6, capped: false, holder: null};
};

// the big new tent card at her seat (printed), shrinks to a standing tent once he starts writing
const NewCard: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => {
  const ps = fitSize(spec.cards.new_print, (z) => `italic 700 ${z}px "Gelasio"`, 108, 340);
  const sm = fitSize(spec.cards.new_small, (z) => `italic 700 ${z}px "Gelasio"`, 46, 600);
  return <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-CARD_W / 2 + 16} y={-145 + 18} width={CARD_W} height={290} rx={18} fill={INK} opacity={0.88} />
    <rect x={-CARD_W / 2} y={-145} width={CARD_W} height={290} rx={18} fill="#FFFDF6" stroke={INK} strokeWidth={6} />
    <rect x={-CARD_W / 2 + 3} y={-142} width={CARD_W - 6} height={34} rx={15} fill={C.champagne} />
    <text x={-130} y={20} textAnchor="middle" fontFamily={GEL} fontStyle="italic" fontWeight={700} fontSize={ps} fill={INK} letterSpacing={2}>{spec.cards.new_print}</text>
    <g transform="translate(200 -10)"><path d="M -50 0 L 50 0 M 12 -42 L 62 0 L 12 42" fill="none" stroke={C.terraDeep} strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" /></g>
    <text x={0} y={102} textAnchor="middle" fontFamily={GEL} fontStyle="italic" fontWeight={700} fontSize={sm} fill={C.eucDeep}>{spec.cards.new_small}</text>
  </g>;
};
const newCardAt = (t: number) => {
  const k = t < WIPE1 ? smooth(t, 2.95, 3.3) : 1;
  return {x: lerp(660, 850, k), y: lerp(1010, 1030, k), s: lerp(0.92, 0.5, k)};
};
const TableProps: React.FC<{t: number}> = ({t}) => {
  const mc = mainCard(t), m = markerAt(t), nc = newCardAt(t);
  const take1 = t < WIPE1;
  const capU = clamp((t - B.uncap) / 0.75);
  const capX = lerp(450, 640, capU), capY = ROW - 4 - 320 * Math.sin(capU * Math.PI);
  const push = take1 ? wp(t, 4.4, 4.6) * (1 - wp(t, 4.8, 5.0)) : wp(t, 12.6, 12.75) * (1 - wp(t, 12.9, 13.0));
  const lines = [lineAt(take1 ? L_H1 : L_H2, t)];
  return <g>
    <NewCard x={nc.x} y={nc.y} s={nc.s} />
    <g transform={`translate(${mc.x} ${mc.y}) rotate(${mc.rot}) scale(${mc.s})`}><TentCard face="back" lines={lines} scaleX={1} /></g>
    {t >= B.uncap && <g transform={`translate(${capU < 1 ? capX : 640} ${capU < 1 ? capY : ROW + 6}) rotate(${capU < 1 ? capU * 540 : 14})`}><rect x={-31} y={-15} width={62} height={30} rx={13} fill="#3A3140" /></g>}
    {m.holder === null && <Marker x={m.x} y={m.y} rot={m.rot} capped={m.capped} />}
    {m.holder === 'him' && <SleeveHand who="him" x={m.x - 70 * Math.cos(35 * Math.PI / 180) - 40} y={m.y + 52} show={1} />}
    {m.holder !== null && <Marker x={m.x} y={m.y} rot={m.rot} capped={m.capped} />}
    {push > 0 && <SleeveHand who="him" x={mc.x - CARD_W * CS / 2 - 10} y={1090} show={push} />}
  </g>;
};

// ------------------------------------------------------------------------------------------ the cast around them
const Aunt: React.FC<{x: number; y: number; s?: number; t: number; flip?: boolean; shrug?: number; wide?: number; smile?: number}> = ({x, y, s = 1, t, flip, shrug = 0, wide = 0, smile = 0}) => {
  const bob = Math.abs(Math.sin(t * 8)) * 8;
  return <g transform={`translate(${x} ${y - bob - shrug * 14}) scale(${(flip ? -1 : 1) * s} ${s})`}>
    <path d="M -110 460 L -96 150 Q -80 84 0 78 Q 80 84 96 150 L 110 460 Z" fill="#9C86B8" stroke={INK} strokeWidth={5} />
    <path d="M -50 90 Q 0 130 50 90" fill="none" stroke="#FFFDF6" strokeWidth={9} strokeDasharray="2 14" strokeLinecap="round" />
    <circle cx={-16} cy={-6} r={70} fill={SKIN_AUNT} stroke={INK} strokeWidth={5} />
    <path d="M 52 -4 q 22 10 4 24" fill={SKIN_AUNT} stroke={INK} strokeWidth={4} />
    {wide > 0 && <ellipse cx={26} cy={-14} rx={10 + 10 * wide} ry={10 + 12 * wide} fill="#fff" stroke={INK} strokeWidth={3} />}
    <circle cx={26 + wide * 3} cy={-14} r={8} fill={INK} /><path d={`M 10 ${-36 - wide * 14} Q 30 ${-48 - wide * 16} 50 ${-36 - wide * 14}`} fill="none" stroke="#8C8394" strokeWidth={7} strokeLinecap="round" />
    {wide > 0.5 ? <ellipse cx={34} cy={36} rx={10} ry={12} fill={INK} /> : smile > 0.5 ? <path d="M 8 26 Q 30 58 52 24" fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" /> : <path d="M 14 32 Q 34 40 46 30" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />}
    <path d="M -86 -10 Q -80 -78 -10 -80 Q 40 -76 50 -40 Q 0 -60 -40 -30 Z" fill="#9A8F9C" /><circle cx={-82} cy={-56} r={34} fill="#9A8F9C" />
    {shrug > 0.01 ? <g opacity={shrug}>
      {[-1, 1].map((k) => <g key={k}>
        <path d={`M ${k * 90} 230 L ${k * 170} ${150 - shrug * 20}`} stroke="#9C86B8" strokeWidth={46} strokeLinecap="round" />
        <circle cx={k * 176} cy={130 - shrug * 20} r={30} fill={SKIN_AUNT} stroke={INK} strokeWidth={3} />
      </g>)}
    </g> : <g transform="translate(46 190) rotate(-8)">
      <rect x={-56} y={-72} width={112} height={150} rx={8} fill="#8B5E3C" stroke={INK} strokeWidth={4} />
      <rect x={-46} y={-56} width={92} height={126} fill="#FFFDF6" /><rect x={-24} y={-80} width={48} height={20} rx={6} fill="#8E8A9C" stroke={INK} strokeWidth={3} />
      {[-30, -8, 14, 36].map((yy) => <rect key={yy} x={-36} y={yy} width={72} height={6} rx={3} fill={INK} opacity={0.4} />)}
      <circle cx={-6} cy={96} r={26} fill={SKIN_AUNT} stroke={INK} strokeWidth={3} />
    </g>}
  </g>;
};

type GKind = 'grandma' | 'uncle' | 'uncle2' | 'kid' | 'raj';
const Guest: React.FC<{x: number; y: number; s: number; kind: GKind; t: number; grin?: number; look?: number; seed?: number}> = ({x, y, s, kind, t, grin = 1, look = 0, seed = 0}) => {
  const skin = {grandma: '#D9A07C', uncle: '#C98B62', uncle2: '#E6B795', kid: '#C98B62', raj: '#B97A52'}[kind];
  const col = {grandma: C.terracotta, uncle: '#3B5A6B', uncle2: C.eucDeep, kid: C.marigold, raj: C.marigold}[kind];
  const hs = kind === 'kid' ? 0.78 : 1;
  const br = Math.sin(t * 1.7 + seed) * 3;
  const blink = ((t + seed) % 3.1) < 0.12;
  return <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -245 440 L -222 250 Q -205 160 -64 150 L 64 150 Q 205 160 222 250 L 245 440 Z" fill={col} stroke={INK} strokeWidth={6} />
    {kind === 'uncle' && <path d="M -40 150 L 40 150 L 0 300 Z" fill="#fff" />}
    {kind === 'raj' && <path d="M -70 150 L 70 150 L 0 280 Z" fill="#FFF3CC" />}
    <rect x={-42} y={110} width={84} height={80} fill={skin} />
    <g transform={`translate(0 ${br + (kind === 'kid' ? 60 : 0)}) scale(${hs})`}>
      {[-1, 1].map((k) => <ellipse key={k} cx={k * 150} cy={14} rx={30} ry={38} fill={skin} stroke={INK} strokeWidth={4} />)}
      <circle cx={0} cy={0} r={150} fill={skin} stroke={INK} strokeWidth={6} />
      {kind === 'grandma' && <g>
        <circle cx={0} cy={-170} r={64} fill="#E7E2EA" stroke={INK} strokeWidth={5} />
        <path d="M -150 -10 Q -150 -150 0 -154 Q 150 -150 150 -10 Q 90 -92 0 -90 Q -90 -92 -150 -10 Z" fill="#E7E2EA" stroke={INK} strokeWidth={4} />
      </g>}
      {kind === 'uncle' && <path d="M -150 -20 Q -150 -150 0 -154 Q 150 -150 150 -20 Q 90 -100 0 -92 Q -90 -100 -150 -20 Z" fill="#26202B" />}
      {kind === 'uncle2' && <g fill="#9A8F9C"><path d="M -150 10 Q -166 -60 -120 -70 Q -140 -10 -134 40 Z" /><path d="M 150 10 Q 166 -60 120 -70 Q 140 -10 134 40 Z" /></g>}
      {kind === 'kid' && <path d="M -140 -30 Q -120 -150 0 -150 Q 120 -150 140 -30 Q 70 -100 0 -92 Q -70 -100 -140 -30 Z" fill="#2C1B26" />}
      {kind === 'raj' && <path d="M -152 -10 Q -165 -130 -70 -154 Q 0 -196 80 -156 Q 160 -120 152 -10 Q 120 -76 70 -84 Q 0 -100 -70 -84 Q -120 -76 -152 -10 Z" fill="#1F1420" />}
      {(kind === 'grandma' || kind === 'uncle') && [-1, 1].map((k) => <circle key={k} cx={k * 58} cy={-2} r={44} fill="none" stroke={kind === 'grandma' ? '#8C8394' : INK} strokeWidth={kind === 'grandma' ? 6 : 0} />)}
      {[-1, 1].map((k) => <g key={k}>
        <ellipse cx={k * 58} cy={-2} rx={30} ry={blink ? 3 : 29} fill="#fff" stroke={INK} strokeWidth={4} />
        {!blink && <circle cx={k * 58 + look * 9} cy={-2} r={13} fill={INK} />}
        <path d={`M ${k * 58 - 32} -50 Q ${k * 58} -66 ${k * 58 + 32} -50`} fill="none" stroke={kind === 'grandma' || kind === 'uncle2' ? '#8C8394' : '#26202B'} strokeWidth={12} strokeLinecap="round" />
      </g>)}
      <path d="M -10 22 Q 0 38 14 30" fill="none" stroke={INK} strokeWidth={6} opacity={0.5} strokeLinecap="round" />
      {kind === 'uncle' && <path d="M -62 62 Q -30 40 0 56 Q 30 40 62 62 Q 30 78 0 66 Q -30 78 -62 62 Z" fill="#26202B" />}
      {grin > 0.5
        ? <g><path d="M -64 66 Q 0 60 64 66 Q 52 128 0 130 Q -52 128 -64 66 Z" fill="#4B1A25" stroke={INK} strokeWidth={6} /><path d="M -56 68 Q 0 62 56 68 L 52 90 Q 0 84 -52 90 Z" fill="#fff" /></g>
        : <path d="M -40 80 Q 0 108 40 80" fill="none" stroke={INK} strokeWidth={8} strokeLinecap="round" />}
    </g>
  </g>;
};

const Banner: React.FC<{text: string; x: number; y: number; s?: number}> = ({text, x, y, s = 1}) => <g transform={`translate(${x} ${y}) scale(${s})`}>
  <rect x={-6} y={-30} width={12} height={300} fill="#8E8A9C" /><SoftRect x={-170} y={-50} w={340} h={130} r={16} dx={10} dy={14} op={0.3} />
  <rect x={-170} y={-50} width={340} height={130} rx={16} fill="#FFFDF6" stroke={INK} strokeWidth={6} />
  <rect x={-166} y={-46} width={332} height={26} rx={12} fill={C.champagne} />
  <text x={0} y={52} textAnchor="middle" fontFamily={GEL} fontStyle="italic" fontWeight={700} fontSize={64} fill={INK} letterSpacing={3}>{text}</text>
</g>;
const NameCard: React.FC<{x: number; y: number; s: number; name: string; pop?: number}> = ({x, y, s, name, pop = 1}) =>
  <g transform={`translate(${x} ${y}) scale(${s * pop})`}><TentCard face="front" lines={[]} scaleX={1} printed={name} /></g>;

// ------------------------------------------------------------------------------------------ shot: the table (hook, take 1 writing, take 2 writing)
const TableScene: React.FC<{t: number}> = ({t}) => {
  const cam = camAt(CAM, t);
  return <g>
    <g transform={planeT(cam, 0.2)}><Wall t={t} /></g>
    <g transform={planeT(cam, 0.3)}><Extras /></g>
    <g transform={planeT(cam, 0.6)}><Aunt x={545} y={690} s={0.62} t={0} /></g>
    <g transform={planeT(cam, 0.85)}><Centerpiece t={t} /></g>
    <g transform={planeT(cam, 0.92)}>
      <Person who="him" x={HIM.x} y={HIM.y} t={t} pose={himPose(t)} seed={0.4} />
      <Person who="her" x={HER.x} y={HER.y} t={t} pose={herPose(t)} seed={1.9} />
    </g>
    <g transform={planeT(cam, 1.0)}>
      <Table t={t} dessert={false} />
      <Arm who="him" t={t} /><Arm who="her" t={t} />
      <TableProps t={t} />
      {t - DOWN1 > 0 && t - DOWN1 < 0.45 && (() => {
        const k = (t - DOWN1) / 0.45;
        return <g opacity={1 - k} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round">
          <ellipse cx={140} cy={1216} rx={90 + k * 80} ry={22 + k * 20} />
          {[-1, 1].map((s) => <path key={s} d={`M ${140 + s * (120 + k * 70)} ${1190 - k * 20} l ${s * 26} -18`} />)}
        </g>;
      })()}
    </g>
    <g transform={planeT(cam, 1.04)}><PhoneUnit who="him" t={t} /><PhoneUnit who="her" t={t} /></g>
    <g transform={planeT(cam, 1.7)}><NearPlane t={t} /></g>
  </g>;
};

// ------------------------------------------------------------------------------------------ shot: he follows her, dragging his chair (5.0-6.9)
const Chair: React.FC<{x: number; y: number; rot: number}> = ({x, y, rot}) => <g transform={`translate(${x} ${y}) rotate(${rot})`}>
  <rect x={-70} y={-250} width={140} height={250} rx={20} fill="#B58A5A" stroke={INK} strokeWidth={6} />
  <rect x={-46} y={-222} width={92} height={190} rx={12} fill="#CFA574" />
  <rect x={-84} y={-6} width={168} height={34} rx={12} fill="#B58A5A" stroke={INK} strokeWidth={6} />
  <rect x={-72} y={26} width={18} height={150} rx={6} fill="#8E6A42" stroke={INK} strokeWidth={4} /><rect x={54} y={26} width={18} height={150} rx={6} fill="#8E6A42" stroke={INK} strokeWidth={4} />
</g>;
const FollowScene: React.FC<{t: number}> = ({t}) => {
  const k = wp(t, B.follow, 6.8), e = smooth(k, 0, 1);
  const herX = lerp(520, 880, e), himX = herX - 290;
  const bob = (ph: number) => Math.abs(Math.sin(t * 9 + ph)) * 14;
  const hp = mkPose([0.9, 0.2, 0.9, 0, -3, 0.5, 0, 0], 'o', 0, {sweat: wp(t, 5.4, 6.4)});
  const rp = mkPose([-1, 0.1, 0.4, 0, 4, 0.4, 0, 0], 'smirk', 0);
  return <g>
    <Wall t={t} />
    <g filter="url(#blur6)" opacity={0.8}>
      {([[300, 'uncle'], [560, 'grandma'], [760, 'uncle2'], [980, 'uncle']] as [number, GKind][]).map(([x, kd], i) => <Guest key={i} x={x} y={820} s={0.32} kind={kd} t={t} seed={i} grin={0} />)}
    </g>
    <Banner text="TABLE 9" x={170} y={470} s={0.8} />
    <Banner text="TABLE 2" x={910} y={470} s={0.8} />
    <PP who="her" x={herX} y={900 - bob(0)} s={0.58} t={t} pose={rp} seed={1.9} />
    <PP who="him" x={himX} y={900 - bob(1.2)} s={0.58} t={t} pose={hp} seed={0.4} />
    <Table t={t} dessert={false} />
    <Chair x={himX - 180} y={1000 + bob(2)} rot={-24} />
    <path d={`M ${himX - 60} 1140 Q ${himX - 90} 1100 ${himX - 110} 1100`} fill="none" stroke="#4A2A52" strokeWidth={52} strokeLinecap="round" />
    <Hand x={himX - 110} y={1084} rot={-70} skin={C.skinHim} />
  </g>;
};

// ------------------------------------------------------------------------------------------ shot: the family photo (6.9-9.6)
const Camera: React.FC<{t: number}> = ({t}) => {
  const f = Math.max(0, 1 - Math.abs(t - B.flash) / 0.12);
  return <g transform="translate(540 1135)">
    <SoftEllipse x={0} y={86} w={340} h={36} op={0.3} />
    <rect x={-130} y={-70} width={260} height={150} rx={22} fill="#3A3140" stroke={INK} strokeWidth={6} />
    <rect x={-130} y={-70} width={260} height={46} rx={22} fill="#8E8A9C" />
    <rect x={-90} y={-104} width={80} height={36} rx={8} fill={C.marigold} stroke={INK} strokeWidth={5} />
    <circle cx={30} cy={14} r={60} fill="#1B1220" stroke={INK} strokeWidth={6} /><circle cx={30} cy={14} r={38} fill="#2F4A6B" /><circle cx={16} cy={0} r={11} fill="#fff" opacity={0.8} />
    {f > 0 && <g opacity={f}>{Array.from({length: 10}, (_, i) => <path key={i} d={`M ${-50 + 0} ${-86} L ${-50 + Math.cos(i * 0.628) * 160} ${-86 + Math.sin(i * 0.628) * 160}`} stroke="#FFF3CC" strokeWidth={10} strokeLinecap="round" />)}</g>}
    {[-1, 1].map((k) => <Hand key={k} x={k * 150} y={30} rot={k * -10} flip={k > 0} skin="#E6B795" />)}
  </g>;
};
const FamScene: React.FC<{t: number}> = ({t}) => {
  const fl = wp(t, B.flash - 0.04, B.flash + 0.02) * (1 - wp(t, B.flash + 0.02, B.flash + 0.4));
  const arrive = smooth(t, 7.5, 8.3);
  const stiff = wp(t, 8.3, 8.6);
  const grinOn = t > 8.1 ? 1 : 0;
  const him = mkPose([-0.8, 0, 0.8, 0, 0, 0.7, 0, 0], grinOn ? 'smile' : 'o', 0, {sweat: wp(t, 7.9, 8.8) * (t < B.flash ? 1 : 0.6)});
  const her = mkPose([1, 0.1, 0.8, 0, 4, 0.4, 0.25 * wp(t, 8.4, 8.6), 0.1], 'smile', 0, {happy: t > 8.7});
  const frame = smooth(t, 9.0, 9.3);
  const jolt = t < 8.0 ? Math.sin(t * 20) * 3 * (t > 7.0 ? 1 : 0) : 0;
  return <g>
    <g>
      <Wall t={t} />
      <Banner text="TABLE 2" x={540} y={450} s={0.8} />
      <Guest x={105} y={740 + jolt} s={0.54} kind="grandma" t={t} seed={0.3} />
      <Guest x={295} y={740} s={0.54} kind="uncle" t={t} seed={1.1} />
      <PP who="her" x={500} y={744} s={0.56} t={t} pose={her} seed={1.9} />
      <Guest x={690} y={740} s={0.54} kind="uncle2" t={t} seed={2.2} />
      <Guest x={865 - 20 * arrive} y={760} s={0.54} kind="kid" t={t} seed={3.1} />
      <PP who="him" x={lerp(1260, 1000, arrive)} y={748 + stiff * 0} s={0.56} t={t} pose={him} seed={0.4} />
      <Table t={t} dessert={false} />
      <Camera t={t} />
    </g>
    {/* thin paper border of the photo, inside the frame edges */}
    {frame > 0 && <g opacity={frame}><rect x={18} y={18} width={1044} height={1884} rx={10} fill="none" stroke="#FFFDF6" strokeWidth={36} /><rect x={36} y={36} width={1008} height={1848} fill="none" stroke={INK} strokeWidth={3} opacity={0.3} /></g>}
    <rect x={-50} y={-50} width={1180} height={2020} fill="#fff" opacity={fl} />
  </g>;
};

// ------------------------------------------------------------------------------------------ shot: the swap at table 2 (13.0-15.5)
const SWAPCAM: CamKey[] = [{t: 13.0, x: 540, y: 960, z: 1.0}, {t: 15.5, x: 500, y: 1000, z: 1.1}];
const Chair2: React.FC<{x: number; y: number}> = ({x, y}) => <g transform={`translate(${x} ${y})`}>
  <rect x={-80} y={-60} width={160} height={280} rx={24} fill="#B58A5A" stroke={INK} strokeWidth={6} /><rect x={-54} y={-32} width={108} height={220} rx={14} fill="#CFA574" />
</g>;
const SwapScene: React.FC<{t: number}> = ({t}) => {
  const cam = camAt(SWAPCAM, t);
  const walk = smooth(wp(t, B.swapIn, 13.7), 0, 1), leave = smooth(t, 14.85, 15.5);
  const tip = t < 14.0 ? Math.abs(Math.sin(t * 6)) * 20 : 0;
  const hx = lerp(-200, 230, walk) - leave * 520;
  const hy = 840 - tip;
  const glance = t < 13.7 ? Math.sin(t * 6) : t < 14.6 ? -0.4 : 0.9;
  const him = mkPose([glance, 0.3, 0.9, 0, 2, 0.7, 0, 0], 'o', 0, {sweat: wp(t, 13.4, 14.6)});
  const her = mkPose([-1, 0.6, 0.6, 0, -4, 0.4, 0, 0], 'smirk', 0, {});
  const RX = 440, RY = 1150, HX = 800, CSZ = 0.46;
  const reach = wp(t, 13.7, 14.0), lift = smooth(wp(t, 14.0, 14.35), 0, 1);
  const place = smooth(wp(t, 14.35, 14.7), 0, 1);
  const heldX = lerp(RX, hx + 30, lift), heldY = lerp(RY, 930, lift);
  const handX = t < 14.0 ? lerp(hx + 150, RX + 120, reach) : heldX + 130, handY = t < 14.0 ? lerp(980, RY + 50, reach) : heldY + 50;
  const handShow = t > 13.65 && hx > -150;
  return <g>
    <g transform={planeT(cam, 0.2)}><Wall t={t} /></g>
    <g transform={planeT(cam, 0.55)}>
      <Banner text="TABLE 2" x={540} y={520} s={0.8} />
      <g filter="url(#blur6)" opacity={0.85}>
        <Guest x={110} y={760} s={0.4} kind="grandma" t={t} grin={0} seed={0.3} /><Guest x={990} y={770} s={0.4} kind="uncle" t={t} grin={0} seed={1.1} />
      </g>
    </g>
    <g transform={planeT(cam, 0.9)}>
      <Chair2 x={RX} y={900} />
      <PP who="her" x={880} y={780} s={0.8} t={t} pose={her} seed={1.9} />
      <PP who="him" x={hx} y={hy} s={0.8} t={t} pose={him} seed={0.4} />
    </g>
    <g transform={planeT(cam, 1.0)}>
      <Table t={t} dessert={false} />
      <NameCard x={HX} y={1150} s={CSZ} name="" />
      <text x={HX} y={1244} textAnchor="middle" fontFamily={NUN} fontWeight={800} fontSize={0} fill={INK}> </text>
      {handShow && <path d={`M ${hx + 110} 1000 Q ${(hx + handX) / 2 + 40} ${(1000 + handY) / 2} ${handX} ${handY - 20}`} fill="none" stroke="#4A2A52" strokeWidth={60} strokeLinecap="round" />}
      {t >= 14.35 && <NameCard x={RX} y={RY - 150 * (1 - place)} s={CSZ * (1 + 0.15 * (1 - place))} name="OLLIE" />}
      <NameCard x={heldX} y={heldY} s={CSZ} name="COUSIN RAJ" />
      {handShow && <Hand x={handX} y={handY} rot={0} skin={C.skinHim} />}
    </g>
  </g>;
};

// ------------------------------------------------------------------------------------------ shot: Raj gets table 9 (15.2-16.4)
const RajScene: React.FC<{t: number}> = ({t}) => {
  const e = smooth(t, B.raj, B.raj + 0.35);
  const ph = swipe(t - B.raj);
  return <g>
    <Wall t={t} />
    <Banner text="TABLE 9" x={540} y={520} s={0.8} />
    <Centerpiece t={t} />
    <Guest x={lerp(1350, 540, e)} y={770} s={0.9} kind="raj" t={t} seed={0.7} grin={1} look={0.4} />
    <Table t={t} dessert={false} />
    <NameCard x={540} y={1140} s={0.7} name="COUSIN RAJ" pop={1 + 0.12 * Math.max(0, 1 - (t - B.raj - 0.3) / 0.25) * (t > B.raj + 0.3 ? 1 : 0)} />
    <g transform={`translate(${lerp(1500, 800, e)} 990) rotate(12)`}>
      <PhoneBody who="him" t={t} cardPhase={ph.p} k={0} swipeDir={ph.dir} showCard />
      <Thumb x={ph.dir * (-26 + 62 * smooth(ph.p, 0, 0.35))} y={52} rot={ph.dir * 8} skin="#B97A52" />
    </g>
  </g>;
};

// ------------------------------------------------------------------------------------------ shot: he sits beside her, the aunt double-takes (16.4-19.7)
const L_S: LDef = {text: spec.cards.her_smooth, y: 84, rot: -1.5, col: GREEN, a: B.smooth + 0.1, b: 19.35, size: 70};
const PayScene: React.FC<{t: number}> = ({t}) => {
  const cam = camAt([{t: 16.4, ...A0, z: 1.0}, {t: 19.7, ...A0, z: 1.035}], t);
  // aunt: walks in, passes, snaps back (double-take at OLLIE), shrugs and smiles, leaves
  const walkIn = wp(t, 17.0, 17.5), back = smooth(t, 17.5, 17.72), out = smooth(t, 18.75, 19.4);
  const flipped = t >= 17.5 && t < 18.0;
  const ax = lerp(-220, 660, walkIn) - 120 * back + lerp(0, 900, out);
  const moving = t < 17.5 || t > 18.7;
  const wide = flipped ? smooth(t, 17.7, 17.85) : 0;
  const shrug = smooth(t, 18.0, 18.12) * (1 - smooth(t, 18.6, 18.72));
  const smileA = t >= 18.0 ? 1 : 0;
  const him = mkPose([0.9, 0.2, 0.3, 0, 2, 0.6, 0, 0.05], t < 19.4 ? 'smile' : 'smile', 0, {});
  const lookDown = smooth(t, 18.5, 18.7) * (1 - smooth(t, 19.4, 19.6));
  const her = mkPose([-1 + lookDown * 0.9, 0.1 + lookDown * 0.8, 0.2, 0, -3, 0.3, 0, 0.05], 'smirk', 0, {happy: t > 19.6});
  const nx = 540, ny = 1005;
  const line = mkLine(L_S, wp(t, L_S.a, L_S.b));
  const [tx, ty] = tipOf(line);
  const tipX = nx + CS * tx, tipY = ny + CS * ty + 4;
  const writing = t > B.smooth && t < 19.5;
  return <g>
    <g transform={planeT(cam, 0.2)}><Wall t={t} /></g>
    <g transform={planeT(cam, 0.3)}><Extras /></g>
    <g transform={planeT(cam, 0.5)}><Banner text="TABLE 2" x={540} y={520} s={0.8} /></g>
    <g transform={planeT(cam, 0.6)}>
    </g>
    <g transform={planeT(cam, 0.85)}><Centerpiece t={t} /></g>
    <g transform={planeT(cam, 0.92)}>
      <Person who="him" x={HIM.x} y={HIM.y} t={t} pose={him} seed={0.4} />
      <Person who="her" x={HER.x} y={HER.y} t={t} pose={her} seed={1.9} />
    </g>
    <g transform={planeT(cam, 0.95)}>
      <Aunt x={ax} y={715} s={0.9} t={moving ? t : 0} flip={flipped} shrug={shrug} wide={wide} smile={smileA} />
    </g>
    <g transform={planeT(cam, 1.0)}>
      <Table t={t} dessert={false} />
      <g transform={`translate(${nx} ${ny}) scale(${CS})`}><TentCard face="front" lines={[line]} scaleX={1} printed="OLLIE" /></g>
      <g transform="translate(250 1180) rotate(-4)"><g transform="scale(0.45)"><TentCard face="front" lines={[]} scaleX={1} printed="" /></g></g>
      {writing && <g>
        <Marker x={tipX + 16 - 62} y={tipY + 44 + 44} rot={-35} capped={false} />
        <path d={`M 1130 1500 Q ${tipX + 300} ${1330} ${tipX + 60} ${tipY + 130}`} fill="none" stroke={C.eucDeep} strokeWidth={70} strokeLinecap="round" />
        <Hand x={tipX + 40} y={tipY + 120} rot={50} flip skin={C.skinHer} />
      </g>}
    </g>
  </g>;
};

// ------------------------------------------------------------------------------------------ shot: the cliff (19.7-22.4)
const CliffScene: React.FC<{t: number}> = ({t}) => {
  const lit = smooth(t, 20.15, 20.3);
  const pulse = 0.85 + 0.15 * Math.sin(t * 14);
  const slideK = smooth(t, 20.8, 21.3);
  const frozen = t >= 21.3;
  const g = Math.sin(clamp((t - 21.3) / 0.45) * Math.PI);
  const him = mkPose([0.9, 0.9, frozen ? 1.2 : 0.5, 0, frozen ? 0 : 2, 0.8, 0, 0], frozen ? 'gulp' : 'smile', 0, {gulp: frozen && t < 21.75 ? g : 0, sweat: t >= 21.2 ? 0.15 + 0.55 * (((t - 21.2) / 0.9) % 1) : 0});
  const her = mkPose([-1, 0.1, 0.3, 0, -3, 0.3, 0, 0.05], t < 21.3 ? 'smile' : 'smirk', 0);
  const tremor = frozen ? Math.sin(t * 70) * 1.6 : 0;
  const arms = smooth(t, 21.5, 21.8);
  const cx = lerp(800, 470, slideK);
  const push = wp(t, 20.75, 20.9) * (1 - wp(t, 21.3, 21.45));
  const ps = fitSize(spec.cards.her_dance, HAND, 70, 560);
  return <g>
    <Wall t={t} />
    <rect x={-100} y={-100} width={1280} height={2100} fill={INK} opacity={0.5 * lit} />
    {/* spotlights */}
    {[-1, 1].map((k) => <path key={k} d={`M ${540 + k * 120} 520 L ${540 + k * 520} 1100 L ${540 + k * 120 + 220} 1100 Z`} fill="#FFE9AE" opacity={0.22 * lit * pulse} />)}
    {/* the DJ booth */}
    <g transform="translate(0 80)">
      <Guest x={540} y={650} s={0.5} kind="uncle2" t={t} seed={4} grin={0} look={0.5} />
      <g transform="translate(540 650)"><path d="M -86 -78 Q 0 -150 86 -78" fill="none" stroke="#26202B" strokeWidth={12} /><circle cx={-92} cy={-8} r={26} fill="#26202B" /><circle cx={92} cy={-8} r={26} fill="#26202B" /></g>
      <rect x={380} y={780} width={320} height={120} rx={14} fill="#3A3140" stroke={INK} strokeWidth={6} />
      {[-1, 1].map((k) => <g key={k}><circle cx={540 + k * 80} cy={838} r={44} fill="#1B1220" stroke={C.marigold} strokeWidth={5} /><circle cx={540 + k * 80} cy={838} r={9} fill="#8E8A9C" /></g>)}
      {/* sign */}
      <rect x={236} y={418} width={608} height={140} rx={22} fill={INK} stroke="#CDB985" strokeWidth={8} />
      <rect x={252} y={432} width={576} height={112} rx={14} fill="#26202B" />
      {Array.from({length: 14}, (_, i) => <circle key={i} cx={262 + i * 41.5} cy={i % 2 ? 442 : 534} r={7} fill={C.marigold} opacity={0.25 + 0.75 * lit * (0.6 + 0.4 * Math.sin(t * 12 + i))} />)}
      <text x={540} y={516} textAnchor="middle" fontFamily={NUN} fontWeight={800} fontSize={88} fill={C.marigold} opacity={0.2 + 0.8 * lit}>LAST SONG</text>
    </g>
    <g transform={`translate(${tremor} 0)`}><PP who="him" x={250} y={800} s={0.8} t={t} pose={him} seed={0.4} /></g>
    <PP who="her" x={830} y={800} s={0.8} t={t} pose={her} seed={1.9} />
    {/* his stiff robot arms */}
    {arms > 0 && [-1, 1].map((k) => <g key={k} transform={`translate(${tremor} 0)`}>
      <path d={`M ${250 + k * 215} 1200 L ${250 + k * 225} ${lerp(1200, 1000, arms)} L ${250 + k * 150} ${lerp(1200, 940, arms)}`} fill="none" stroke="#4A2A52" strokeWidth={58} strokeLinecap="round" strokeLinejoin="round" />
      <Hand x={250 + k * 150} y={lerp(1200, 900, arms)} rot={0} skin={C.skinHim} />
    </g>)}
    <Table t={t} dessert={false} />
    <g transform={`translate(${cx} 1040) rotate(${-3 * slideK})`}>
      <g transform="scale(0.8)"><TentCard face="front" lines={[{text: spec.cards.her_dance, x0: -textW(spec.cards.her_dance, HAND(ps)) / 2, y: 84, size: ps, rot: -1.5, color: GREEN, prog: 1}]} scaleX={1} printed="" /></g>
    </g>
    {push > 0 && <SleeveHand who="her" x={cx + CARD_W * 0.8 / 2 + 10} y={1120} show={push} />}
  </g>;
};

// ------------------------------------------------------------------------------------------ vote board
const VoteScene: React.FC<{t: number}> = ({t}) => {
  const z = 1 + 0.03 * clamp((t - B.wipe2) / 8);
  const a = t - 25.8;
  const cyc = a > 0 ? 0.5 - 0.5 * Math.cos(a / 4.4 * Math.PI * 2) : 0;
  const tap = t > B.tap && t < B.tap + 0.35 ? Math.sin((t - B.tap) / 0.35 * Math.PI) : 0;
  const penY = lerp(640, 960, cyc) + tap * 30 + Math.sin(t * 3) * 5;
  const ch = spec.choices;
  return <g transform={`translate(540 960) scale(${z}) translate(-540 -960)`}>
    <VoteBoard t={t} />
    <VoteCard letter="A" l1={ch.A.l1} l2={ch.A.l2} y={470} age={t - B.cardA} col={C.terracotta} rot={-2} lift={tap * 10} />
    <VoteCard letter="B" l1={ch.B.l1} l2={ch.B.l2} y={800} age={t - B.cardB} col={C.eucalyptus} rot={2} />
    {a > -0.2 && <g opacity={smooth(a, -0.2, 0.2)} transform={`translate(0 ${penY - 800})`}>
      <path d="M 1250 1250 Q 1080 900 990 800" fill="none" stroke="#4A2A52" strokeWidth={80} strokeLinecap="round" />
      <Marker x={985} y={800} rot={-128} capped={false} />
      <Hand x={1066} y={840} rot={-30} skin={C.skinHim} />
    </g>}
  </g>;
};

// ------------------------------------------------------------------------------------------ the edit
type Shot = 'tbl' | 'follow' | 'fam' | 'swap' | 'raj' | 'pay' | 'cliff' | 'vote' | 'end';
const WIPES: {t: number; dir: 1 | -1; d: number}[] = [{t: B.wipe1, dir: -1, d: 1.0}, {t: B.wipe2, dir: 1, d: 0.6}];
const shotAt = (t: number): Shot => (t < B.follow ? 'tbl' : t < B.family ? 'follow' : t < B.wipe1 ? 'fam' : t < B.swapIn ? 'tbl' : t < B.raj ? 'swap' : t < B.pay ? 'raj'
  : t < B.cliff ? 'pay' : t < B.wipe2 ? 'cliff' : t < B.endcard ? 'vote' : 'end');
const renderShot = (s: Shot, t: number): React.ReactNode => {
  switch (s) {
    case 'tbl': return <TableScene t={t} />;
    case 'follow': return <FollowScene t={t} />;
    case 'fam': return <FamScene t={t} />;
    case 'swap': return <SwapScene t={t} />;
    case 'raj': return <RajScene t={t} />;
    case 'pay': return <PayScene t={t} />;
    case 'cliff': return <CliffScene t={t} />;
    case 'vote': return <VoteScene t={t} />;
    default: return <EndCard t={t} a={t - B.endcard} part={5} />;
  }
};

const Scene: React.FC<{hook: Hook4}> = ({hook}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const w = WIPES.find((x) => t >= x.t && t < x.t + x.d);
  const cur = shotAt(t);
  const prev = w ? shotAt(w.t - 0.001) : null;
  const k = w ? (t - w.t) / w.d : 0;
  const rotIn = (1 - smooth(k, 0, 1)) * -22 * (w ? w.dir : 1);
  return <>
    <MotionBlurWhen fast={w !== undefined} samples={5} shutter={220}>
      <AbsoluteFill>
        <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, background: C.ivory}}>
          <Defs />
          {w ? <>
            {renderShot(prev as Shot, (w as {t: number}).t - 0.001)}
            <defs><clipPath id="susan"><circle cx={SUSAN.cx} cy={SUSAN.cy} r={wipeR(k)} /></clipPath></defs>
            <g clipPath="url(#susan)"><g transform={`rotate(${rotIn} ${SUSAN.cx} ${SUSAN.cy})`}>{renderShot(cur, t)}</g></g>
            <SusanRing k={k} dir={w.dir} />
          </> : renderShot(cur, t)}
        </svg>
      </AbsoluteFill>
    </MotionBlurWhen>
    <AbsoluteFill>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        {t < 3.0 && <Strip text={(spec.hooks as Record<string, string>)[hook]} y={345} age={t + 1} out={smooth(t, 2.85, 3.0)} size={52} maxW={960} />}
        {spec.strips.map((s, i) => {
          if (t >= s.to || t < s.from) return null;
          const comment = s.text.startsWith('comment');
          return <Strip key={i} text={s.text} y={s.y} age={t - s.from + 0.06} out={smooth(t, s.to - 0.12, s.to)} size={comment ? 76 : (s as {big?: boolean}).big ? 92 : 60} rot={comment ? 0 : i % 2 ? 0.6 : -0.6} />;
        })}
      {t > B.wipe1 && t < B.wipe1 + 1.15 && <g opacity={smooth(t, B.wipe1 + 0.02, B.wipe1 + 0.15) * (1 - smooth(t, B.wipe1 + 0.8, B.wipe1 + 1.15))} transform="translate(540 1000)">
        {[-1, 1].map((k) => <path key={k} d={`M ${k * 130 + 90} -110 L ${k * 130 - 90} 0 L ${k * 130 + 90} 110 Z`} fill={C.marigold} stroke={INK} strokeWidth={10} strokeLinejoin="round" />)}
      </g>}
      </svg>
    </AbsoluteFill>
  </>;
};

export const Table4: React.FC<{hook?: Hook4}> = ({hook = 'a'}) => (
  <AbsoluteFill style={{background: C.ivory}}>
    <Audio src={staticFile('audio/table-ep4.wav')} volume={0.9} />
    <Scene hook={hook} />
  </AbsoluteFill>
);
