import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, lerp, smooth} from '../../lib/motion';
import {MotionBlurWhen} from '../../lib/shots';
import {
  C, CARD_W, CamKey, Centerpiece, Defs, EndCard, Extras, GEL, Hand, Line, MARK, Marker, Mouth, NUN, NearPlane, Person, PersonPose, PhoneBody,
  SUSAN, SoftEllipse, SoftRect, SusanRing, Strip, Table, TentCard, Thumb, VoteBoard, VoteCard, WIPE_DUR, Wall, camAt, fitSize, keyAt, mkPose, planeT, textW, tipOf, track, wipeR,
} from './world';
import spec from '../../../specs/stories/table-ep5.json';

// Table Nine, part 5 "Last song". Silent. Frame 1 = ONE strip, two big faces, his phone lit mid-swipe, her big card (dance?),
// dance floor lit behind with a LAST SONG sign. Take 1 (i'll watch your bag.): the room dances, he hugs her bag. Lazy Susan back.
// Take 2 (i can't. teach me?): footprints card (stand here.), toe, pocket phone buzz ignored, sway, music drops. Cliff: car's here, last card.

export const TABLE5_FPS = 60;
export const TABLE5_FRAMES = Math.round(spec.duration * TABLE5_FPS);
const B = spec.beats;
export type Hook5 = 'a' | 'b';

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
  const x = lerp(him ? 140 : 962, him ? 140 : 940, k);
  const y = lerp(1150, 1214, k) - 46 * Math.sin(k * Math.PI);
  const ang = lerp(him ? 8 : -8, him ? 90 : -90, k);
  const sy = lerp(1, 0.5, k);
  const {p, dir} = swipe(t);
  const big = him ? lerp(1.35, 1, k) : 1;
  return <g transform={`translate(${x} ${y}) scale(${big} ${sy * big}) rotate(${ang})`}>
    <PhoneBody who={who} t={t} cardPhase={him ? p : 0} k={k} swipeDir={dir} showCard />
    {him && k < 0.5 && <g opacity={smooth(p, 0, 0.04) * (1 - smooth(p, 0.62, 0.85))}><Thumb x={dir * (-26 + 62 * smooth(p, 0, 0.35))} y={52} rot={dir * 8} skin={C.skinHim} /></g>}
  </g>;
};
const Arm: React.FC<{who: 'him' | 'her'; t: number}> = ({who, t}) => {
  const him = who === 'him';
  const k = him ? smooth(t, DOWN0, DOWN1) : 1;
  const sh: [number, number] = him ? [62, 930] : [1018, 930];
  const hx = lerp(him ? 140 : 962, him ? 312 : 768, k), hy = lerp(1226, 1208, k);
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
    <AskCard x={nc.x} y={nc.y} s={nc.s} />
    <g transform={`translate(${mc.x} ${mc.y}) rotate(${mc.rot}) scale(${mc.s})`}><TentCard face="back" lines={lines} scaleX={1} /></g>
    {t >= B.uncap && <g transform={`translate(${capU < 1 ? capX : 640} ${capU < 1 ? capY : ROW + 6}) rotate(${capU < 1 ? capU * 540 : 14})`}><rect x={-31} y={-15} width={62} height={30} rx={13} fill="#3A3140" /></g>}
    {m.holder === null && <Marker x={m.x} y={m.y} rot={m.rot} capped={m.capped} />}
    {m.holder === 'him' && <SleeveHand who="him" x={m.x - 70 * Math.cos(35 * Math.PI / 180) - 40} y={m.y + 52} show={1} />}
    {m.holder !== null && <Marker x={m.x} y={m.y} rot={m.rot} capped={m.capped} />}
    {push > 0 && <SleeveHand who="him" x={mc.x - CARD_W * CS / 2 - 10} y={1090} show={push} />}
  </g>;
};

// ------------------------------------------------------------------------------------------ the cast around them
const Aunt: React.FC<{x: number; y: number; s?: number; t: number; flip?: boolean; shrug?: number; wide?: number; smile?: number; keys?: number; wob?: number}> = ({x, y, s = 1, t, flip, shrug = 0, wide = 0, smile = 0, keys = 0, wob = 0}) => {
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
    {keys > 0 && <g opacity={keys}>
      <path d="M 80 230 L 125 -20" stroke="#9C86B8" strokeWidth={46} strokeLinecap="round" />
      <circle cx={125} cy={-50} r={30} fill={SKIN_AUNT} stroke={INK} strokeWidth={3} />
      <g transform={`translate(125 -105) rotate(${wob})`}>
        <circle cx={0} cy={0} r={22} fill="none" stroke="#8E8A9C" strokeWidth={8} />
        <rect x={-26} y={-96} width={52} height={74} rx={16} fill="#3A3140" stroke={INK} strokeWidth={4} /><circle cx={0} cy={-70} r={9} fill={C.terracotta} />
        <path d="M 0 22 L 0 70 M 0 52 L 16 52 M 0 66 L 12 66" stroke="#8E8A9C" strokeWidth={8} strokeLinecap="round" />
      </g>
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
    <g transform={planeT(cam, 0.4)}><DanceBG t={t} /></g>
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

// ------------------------------------------------------------------------------------------ shared dance-floor pieces
const SignBoard: React.FC<{x: number; y: number; w: number; s?: number; lit: number; t: number}> = ({x, y, w, s = 1, lit, t}) => <g transform={`translate(${x} ${y}) scale(${s})`}>
  <rect x={-w / 2} y={-50} width={w} height={100} rx={20} fill={INK} stroke="#CDB985" strokeWidth={7} />
  <rect x={-w / 2 + 12} y={-38} width={w - 24} height={76} rx={12} fill="#26202B" />
  {Array.from({length: 11}, (_, i) => <circle key={i} cx={-w / 2 + 24 + i * ((w - 48) / 10)} cy={i % 2 ? -43 : 43} r={6} fill={C.marigold} opacity={0.3 + 0.7 * lit * (0.6 + 0.4 * Math.sin(t * 12 + i))} />)}
  <text x={0} y={22} textAnchor="middle" fontFamily={NUN} fontWeight={800} fontSize={w > 380 ? 64 : 54} fill={C.marigold} opacity={0.25 + 0.75 * lit}>LAST SONG</text>
</g>;
const FloorTiles: React.FC<{y0: number; y1: number; t: number; op?: number}> = ({y0, y1, t, op = 0.5}) => {
  const rows = Math.ceil((y1 - y0) / 110);
  return <g opacity={op}>
    <rect x={-100} y={y0} width={1280} height={y1 - y0} fill="#FFE9AE" />
    {Array.from({length: 18}, (_, i) => Array.from({length: rows}, (_, j) => (i + j) % 2 === 0 ? <rect key={i + '-' + j} x={-100 + i * 75} y={y0 + j * 110} width={75} height={110} fill={[C.marigold, C.terracotta, C.eucalyptus][(i + j + Math.floor(t * 2)) % 3]} opacity={0.22} /> : null))}
  </g>;
};
const Beams: React.FC<{t: number; y0: number; lit?: number}> = ({t, y0, lit = 1}) => <g opacity={0.5 * lit}>
  {[0, 1, 2].map((i) => {
    const sw = Math.sin(t * 1.6 + i * 2.1) * 120, x = 200 + i * 340;
    return <path key={i} d={`M ${x} ${y0} L ${x - 130 + sw} ${y0 + 420} L ${x + 130 + sw} ${y0 + 420} Z`} fill={[C.marigold, C.pink, '#FFF3CC'][i]} />;
  })}
</g>;
const DanceBG: React.FC<{t: number}> = ({t}) => <g>
  <FloorTiles y0={640} y1={900} t={t} op={0.45} />
  <Beams t={t} y0={470} />
  <SignBoard x={565} y={500} w={350} lit={1} t={t} />
</g>;

// ------------------------------------------------------------------------------------------ her big ask card (dance?)
const AskCard: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => {
  const ps = fitSize(spec.cards.her_dance, HAND, 150, 600);
  return <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-CARD_W / 2 + 16} y={-145 + 18} width={CARD_W} height={290} rx={18} fill={INK} opacity={0.88} />
    <rect x={-CARD_W / 2} y={-145} width={CARD_W} height={290} rx={18} fill="#FFFDF6" stroke={INK} strokeWidth={6} />
    <rect x={-CARD_W / 2 + 3} y={-142} width={CARD_W - 6} height={34} rx={15} fill={C.champagne} />
    <text x={-textW(spec.cards.her_dance, HAND(ps)) / 2} y={52} fontFamily={MARK} fontSize={ps} fill={GREEN} transform="rotate(-2 0 52)">{spec.cards.her_dance}</text>
  </g>;
};

// ------------------------------------------------------------------------------------------ shot: take 1, the room goes to the floor (5.0-6.9)
const CONGA: GKind[] = ['grandma', 'uncle', 'uncle2', 'kid', 'raj', 'uncle', 'grandma', 'uncle2'];
const CongaLine: React.FC<{t: number; y: number; s: number; speed?: number}> = ({t, y, s, speed = 250}) => <g>
  {CONGA.map((kd, i) => {
    const x = ((i * 190 + t * speed) % 1600) - 260;
    return <Guest key={i} x={x} y={y - Math.abs(Math.sin(t * 7 + i * 0.9)) * 26 * s / 0.34} s={s} kind={kd} t={t} seed={i} grin={1} look={0.5} />;
  })}
</g>;
const FloorScene: React.FC<{t: number}> = ({t}) => {
  const e = smooth(wp(t, B.floor, 6.3), 0, 1);
  const herX = lerp(860, 600, e);
  const rp = mkPose([-0.6, 0.1, 0.5, 0, 4 * Math.sin(t * 7), 0.4, 0, 0], 'smile', 0, {});
  return <g>
    <Wall t={t} />
    <FloorTiles y0={620} y1={1000} t={t} op={0.55} />
    <Beams t={t} y0={380} />
    <SignBoard x={540} y={500} w={400} lit={1} t={t} />
    <g opacity={0.95}><CongaLine t={t} y={800} s={0.36} speed={260} /></g>
    <Aunt x={lerp(1250, 760, smooth(t, 5.0, 5.8))} y={lerp(700, 690, 0)} s={0.5} t={t + 1} />
    <PP who="her" x={herX} y={900 - Math.abs(Math.sin(t * 7)) * 14 * e} s={0.5} t={t} pose={rp} seed={1.9} />
    <Table t={t} dessert={false} />
    {/* his empty-ish seat edge: his hand keeps the sequined bag on the table */}
    <SeqBag x={170} y={1130} s={0.8} t={t} />
  </g>;
};
const SeqBag: React.FC<{x: number; y: number; s: number; t: number}> = ({x, y, s, t}) => <g transform={`translate(${x} ${y}) scale(${s})`}>
  <path d="M -110 -90 Q -110 -190 0 -190 Q 110 -190 110 -90" fill="none" stroke="#CDB985" strokeWidth={10} />
  <rect x={-160 + 10} y={-100 + 14} width={320} height={210} rx={34} fill={INK} opacity={0.45} />
  <rect x={-160} y={-100} width={320} height={210} rx={34} fill={C.terracotta} stroke={INK} strokeWidth={7} />
  {Array.from({length: 7}, (_, i) => Array.from({length: 4}, (_, j) => {
    const tw = 0.5 + 0.5 * Math.sin(t * 5 + i * 1.3 + j * 2.1);
    return <circle key={i + '-' + j} cx={-124 + i * 41} cy={-62 + j * 50 + (i % 2) * 14} r={14} fill={tw > 0.7 ? '#FFF3CC' : (i + j) % 2 ? C.marigold : '#F0A78F'} stroke="#B2472A" strokeWidth={2} />;
  }))}
  <rect x={-30} y={-110} width={60} height={26} rx={10} fill="#CDB985" stroke={INK} strokeWidth={4} />
</g>;

// ------------------------------------------------------------------------------------------ shot: take 1, the bag guy (6.9-9.6)
const BagScene: React.FC<{t: number}> = ({t}) => {
  const k = wp(t, B.bag, B.bag + 0.5);
  const sp = smooth(t, 7.0, 7.7);
  const spotX = lerp(1100, 540, sp);
  const him = mkPose([0.4 * Math.sin(t * 0.8), 0.7, 0.9, 0.5, 3, 0.5, 0, 0.15], 'flat', 0, {});
  return <g>
    <Wall t={t} />
    <FloorTiles y0={620} y1={1000} t={t} op={0.5} />
    <Beams t={t} y0={380} />
    <g filter="url(#blur6)" opacity={0.9}><CongaLine t={t} y={730} s={0.3} speed={300} /></g>
    <Aunt x={((t * 300 + 300) % 1500) - 250} y={640} s={0.4} t={t} />
    <rect x={-100} y={-100} width={1280} height={2100} fill={INK} opacity={0.62 * sp} />
    <path d={`M ${spotX} 250 L ${spotX - 400} 1250 L ${spotX + 400} 1250 Z`} fill="#FFF3CC" opacity={0.3 * sp} />
    <ellipse cx={spotX} cy={1200} rx={420} ry={90} fill="#FFF3CC" opacity={0.3 * sp} />
    <PP who="him" x={540} y={820} s={0.85} t={t} pose={him} seed={0.4} />
    <Table t={t} dessert={false} />
    {/* two stiff arms hugging her sequined bag */}
    {[-1, 1].map((q) => <path key={q} d={`M ${540 + q * 200} 960 Q ${540 + q * 230} 1090 ${540 + q * 150} 1110`} fill="none" stroke="#4A2A52" strokeWidth={74} strokeLinecap="round" />)}
    <SeqBag x={540} y={1110} s={1.0} t={t} />
    {[-1, 1].map((q) => <Hand key={q} x={540 + q * 168} y={1098} rot={q * -80} flip={q > 0} skin={C.skinHim} />)}
  </g>;
};

// ------------------------------------------------------------------------------------------ shot: take 2, she draws footprints (13.0-15.1)
const SOLE = 'M 0 -64 C 26 -64 32 -28 26 10 C 22 38 28 64 0 70 C -28 64 -22 38 -26 10 C -32 -28 -26 -64 0 -64 Z';
const Footprint: React.FC<{x: number; y: number; rot: number; k: number}> = ({x, y, rot, k}) => <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${0.6 + 0.4 * smooth(k, 0, 1)})`} opacity={clamp(k * 5)}>
  <path d={SOLE} fill={C.terracotta} fillOpacity={0.25} stroke={C.terraDeep} strokeWidth={8} strokeLinejoin="round" />
  {[[-17, -82, 11], [-3, -92, 12], [13, -88, 11], [26, -74, 9]].map(([cx, cy, r], i) => <circle key={i} cx={cx - 4} cy={cy + 6} r={r} fill="none" stroke={C.terraDeep} strokeWidth={7} />)}
</g>;
const FootScene: React.FC<{t: number}> = ({t}) => {
  const cam = camAt([{t: 13.0, ...A0, z: 1.0}, {t: 15.1, ...A0, z: 1.04}], t);
  const laugh = t < 13.9 ? 0.75 : 0;
  const her = mkPose([-0.9, 0.5, 0.8, 0, -5 * (t < 13.9 ? Math.sin(t * 20) * 0.2 + 0.8 : 0.3), 0.5, laugh, t < 13.9 ? 0.3 : 0.05], t < 13.9 ? 'laugh' : 'smirk', 0, {happy: t < 13.9});
  const him = mkPose([0.9, 0.5, 1.0, 0, 3, 0.7, 0, 0.05], t < 14.2 ? 'o' : 'smile', 0, {sweat: wp(t, 13.2, 14.1) * (t < 14.3 ? 1 : 0)});
  const CX = 540, CY = 1010;
  const f1 = wp(t, 13.6, 13.9), f2 = wp(t, 14.0, 14.3);
  const txt = spec.cards.her_stand;
  const ts = fitSize(txt, HAND, 78, 440);
  const txtP = wp(t, 14.35, 14.95);
  const n = Math.round(txt.length * txtP);
  const tw = textW(txt.slice(0, n), HAND(ts));
  const tx0 = 150 - textW(txt, HAND(ts)) / 2;
  const tip: [number, number] = t < 13.6 ? [-300, 0] : t < 14.0 ? [-300, 20] : t < 14.35 ? [lerp(-300, -170, smooth(t, 14.0, 14.3)), 50] : [tx0 + tw + 6, 24 - ts * 0.28];
  const tipX = CX + tip[0], tipY = CY + tip[1];
  const writing = t > 13.5 && t < 15.05;
  return <g>
    <g transform={planeT(cam, 0.2)}><Wall t={t} /></g>
    <g transform={planeT(cam, 0.3)}><Extras /></g>
    <g transform={planeT(cam, 0.92)}>
      <PP who="him" x={265} y={690} s={0.62} t={t} pose={him} seed={0.4} />
      <PP who="her" x={815} y={690} s={0.62} t={t} pose={her} seed={1.9} />
    </g>
    <g transform={planeT(cam, 1.0)}>
      <Table t={t} dessert={false} />
      <g transform={`translate(${CX} ${CY}) rotate(-1.5)`}>
        <rect x={-430 + 14} y={-170 + 18} width={860} height={340} rx={20} fill={INK} opacity={0.88} />
        <rect x={-430} y={-170} width={860} height={340} rx={20} fill="#FFFDF6" stroke={INK} strokeWidth={6} />
        <rect x={-427} y={-167} width={854} height={34} rx={17} fill={C.champagne} />
        <Footprint x={-310} y={18} rot={-8} k={f1} />
        <Footprint x={-190} y={-6} rot={8} k={f2} />
        {n > 0 && <text x={tx0} y={24} fontFamily={MARK} fontSize={ts} fill={GREEN}>{txt.slice(0, n)}</text>}
      </g>
      {writing && <g>
        <Marker x={tipX + 16 - 62} y={tipY + 44 + 44} rot={-35} capped={false} />
        <path d={`M 1130 1500 Q ${tipX + 300} 1330 ${tipX + 60} ${tipY + 130}`} fill="none" stroke={C.eucDeep} strokeWidth={70} strokeLinecap="round" />
        <Hand x={tipX + 40} y={tipY + 120} rot={50} flip skin={C.skinHer} />
      </g>}
    </g>
  </g>;
};

// ------------------------------------------------------------------------------------------ shot: the toe (15.1-16.5)
const Shoe: React.FC<{x: number; y: number; rot?: number}> = ({x, y, rot = 0}) => <g transform={`translate(${x} ${y}) rotate(${rot})`}>
  <ellipse cx={0} cy={26} rx={66} ry={14} fill={INK} opacity={0.25} />
  <path d="M -62 20 Q -64 -26 -10 -30 Q 40 -34 62 -2 Q 72 22 50 26 L -52 28 Z" fill="#1B1220" stroke={INK} strokeWidth={5} />
  <path d="M -40 -16 Q -4 -26 30 -14" fill="none" stroke="#6E6A86" strokeWidth={5} strokeLinecap="round" />
</g>;
const Sandal: React.FC<{x: number; y: number; sq: number}> = ({x, y, sq}) => <g transform={`translate(${x} ${y}) scale(${1 + 0.3 * sq} ${1 - 0.4 * sq})`}>
  <ellipse cx={0} cy={24} rx={64} ry={12} fill={INK} opacity={0.25} />
  <path d="M -56 14 Q -58 -20 0 -22 Q 56 -20 58 14 Q 50 26 0 26 Q -50 26 -56 14 Z" fill={C.skinHer} stroke="#00000033" strokeWidth={4} />
  {[-36, -14, 8, 30].map((dx, i) => <circle key={i} cx={dx} cy={-14 + (i === 0 || i === 3 ? 6 : 0)} r={9} fill="#C58B61" />)}
  <path d="M -56 6 Q 0 -6 58 6" fill="none" stroke={C.marigold} strokeWidth={9} />
</g>;
const ToeScene: React.FC<{t: number}> = ({t}) => {
  const down = smooth(wp(t, 15.3, 15.55), 0, 1);
  const hit = wp(t, 15.55, 15.62);
  const rel = smooth(wp(t, 16.0, 16.3), 0, 1);
  const sq = hit * (1 - rel) * (1 + 0.15 * Math.sin(t * 40));
  const impact = t >= 15.55 && t < 16.1;
  const lift = Math.sin(clamp((t - 15.1) / 0.45) * Math.PI) * 40;
  const fx = lerp(450, 585, down), fy = lerp(1042 - lift * 0.5, 1086, down) - (t > 16.0 ? 28 * rel : 0);
  const SX = 640, SY = 1096;
  const him = mkPose([0.9, 0.9, 1.1, 0, 2, 0.8, 0, t > 15.55 ? 0.1 : 0], t > 15.55 ? 'o' : 'smile', 0, {sweat: wp(t, 15.5, 16.2)});
  const her = mkPose([-0.9, 0.9, 1.0, 0, -3, 0.5, t > 15.55 ? 0.5 : 0, t > 15.55 ? 0.55 : 0], t > 15.55 ? 'laugh' : 'smile', 0, {});
  const BX = 380, RX = 700, BY = 520, S = 0.55;
  const torsoY = BY + 440 * 1.1 * S - 20;
  const shake = impact ? Math.sin(t * 60) * 4 : 0;
  return <g>
    <Wall t={t} />
    <FloorTiles y0={900} y1={1960} t={t} op={0.6} />
    <Beams t={t} y0={600} lit={0.7} />
    <g transform={`translate(${shake} 0)`}>
      {/* legs */}
      <path d={`M ${BX - 50} ${torsoY} L ${BX - 56} 1040`} stroke="#3A2042" strokeWidth={84} strokeLinecap="round" />
      <path d={`M ${BX + 50} ${torsoY} Q ${BX + 70} ${(torsoY + fy) / 2} ${fx - 10} ${fy - 44}`} fill="none" stroke="#3A2042" strokeWidth={84} strokeLinecap="round" />
      <path d={`M ${RX - 150} ${torsoY - 10} L ${RX + 150} ${torsoY - 10} L ${RX + 190} ${torsoY + 170} L ${RX - 190} ${torsoY + 170} Z`} fill={C.sage} stroke={C.eucDeep} strokeWidth={5} />
      <path d={`M ${RX - 50} ${torsoY + 170} L ${RX - 56} ${SY - 20} M ${RX + 50} ${torsoY + 170} L ${RX + 56} ${SY - 20}`} stroke={C.skinHer} strokeWidth={36} strokeLinecap="round" />
      <PP who="him" x={BX} y={BY} s={S} t={t} pose={him} seed={0.4} />
      <PP who="her" x={RX} y={BY} s={S} t={t} pose={her} seed={1.9} />
    </g>
    <Shoe x={BX - 56} y={1060} />
    <Sandal x={RX - 56} y={SY} sq={0} />
    <Sandal x={SX + 70} y={SY} sq={sq} />
    <Shoe x={fx} y={fy} rot={-6 * down} />
    {impact && <g stroke={C.marigold} strokeWidth={9} strokeLinecap="round" opacity={1 - wp(t, 15.8, 16.1)} transform={`translate(${SX + 10} ${SY - 40})`}>
      {Array.from({length: 8}, (_, i) => <path key={i} d={`M ${Math.cos(i * 0.785) * 60} ${Math.sin(i * 0.785) * 40 - 20} L ${Math.cos(i * 0.785) * 100} ${Math.sin(i * 0.785) * 66 - 20}`} />)}
    </g>}
  </g>;
};

// ------------------------------------------------------------------------------------------ shot: they sway, the pocket buzzes (16.5-20.0)
const BUZZ: [number, number][] = [[B.buzz1, B.buzz1 + 0.28], [B.buzz2, B.buzz2 + 0.28]];
const PocketPhone: React.FC<{x: number; y: number; t: number}> = ({x, y, t}) => {
  const on = BUZZ.some(([a, b]) => t >= a && t < b);
  const near = t >= B.buzz1 - 0.05 && t < B.buzz2 + 0.55;
  const jx = on ? Math.sin(t * 90) * 5 : 0, jy = on ? Math.cos(t * 80) * 3 : 0;
  const g = near ? 1 - 0.35 * wp(t, B.buzz2 + 0.3, B.buzz2 + 0.55) : 0;
  return <g transform={`translate(${x + jx} ${y + jy})`}>
    {g > 0 && <ellipse cx={0} cy={-40} rx={120} ry={130} fill="url(#bokeh)" opacity={g * 0.85} />}
    {g > 0 && <g>
      <rect x={-42} y={-150} width={84} height={150} rx={16} fill="#1B1220" />
      <rect x={-35} y={-143} width={70} height={136} rx={11} fill="#FFE9AE" />
      <rect x={-24} y={-122} width={48} height={70} rx={9} fill="#FFFFFF" stroke={C.marigold} strokeWidth={3} />
      <circle cx={0} cy={-98} r={14} fill="#F6E1B3" /><rect x={-16} y={-76} width={32} height={6} rx={3} fill="#F6E1B3" />
    </g>}
    {/* the pocket: dark flap over the lower part of the phone */}
    <path d="M -78 -30 L 78 -30 L 72 70 Q 0 92 -72 70 Z" fill="#3A2042" stroke={INK} strokeWidth={5} />
    <path d="M -78 -30 L 78 -30" stroke="#6A4A72" strokeWidth={7} strokeLinecap="round" />
    {on && [-1, 1].map((q) => [0, 1, 2].map((i) => <path key={q + '-' + i} d={`M ${q * (92 + i * 26)} ${-130 + i * 14} Q ${q * (112 + i * 26)} ${-80 + i * 14} ${q * (92 + i * 26)} ${-30 + i * 14}`} fill="none" stroke={INK} strokeWidth={8} strokeLinecap="round" opacity={1 - i * 0.25} />))}
  </g>;
};
const DanceScene: React.FC<{t: number}> = ({t}) => {
  const cam = camAt([{t: B.dance, x: 540, y: 960, z: 1.0}, {t: B.cliff, x: 540, y: 960, z: 1.06}], t);
  const sw = Math.sin(t * 2.0);
  const toL = 3 + 2.5 * sw;
  const him = mkPose([1.0, 0.1, 0.5, 0, 4 + 2 * sw, 0.7, 0, 0.1], 'smile', 0, {});
  const her = mkPose([-1.0, 0.1, 0.4, 0, -4 + 2 * sw, 0.3, 0, 0.05], 'smile', 0, {happy: false});
  const dim = 0.25 + 0.1 * smooth(t, 17.4, 18.2);
  return <g>
    <g transform={planeT(cam, 0.2)}>
      <Wall t={t} />
      <rect x={-100} y={-100} width={1280} height={1400} fill={INK} opacity={dim} />
      {Array.from({length: 13}, (_, i) => <circle key={i} cx={i * 85 - 10} cy={300 + Math.sin(i / 12 * Math.PI) * 55 + 12} r={52} fill="url(#bokeh)" opacity={0.85 + 0.15 * Math.sin(t * 1.3 + i)} />)}
    </g>
    <g transform={planeT(cam, 0.5)}><FloorTiles y0={820} y1={2000} t={t * 0.5} op={0.4} /></g>
    <g transform={`${planeT(cam, 0.95)} rotate(${sw * 1.6} 540 1300)`}>
      <g transform="translate(0 0)">
        <PP who="him" x={300} y={730} s={0.9} t={t} pose={him} seed={0.4} />
        <PP who="her" x={785} y={730} s={0.9} t={t} pose={her} seed={1.9} />
        <rect x={57} y={1150} width={486} height={700} fill="#4A2A52" /><rect x={542} y={1150} width={486} height={700} fill={C.sage} />
        {/* arms and joined hands */}
        <path d="M 480 920 Q 470 1030 520 1060" fill="none" stroke="#4A2A52" strokeWidth={70} strokeLinecap="round" />
        <path d="M 610 940 Q 620 1030 570 1060" fill="none" stroke={C.eucDeep} strokeWidth={66} strokeLinecap="round" />
        <Hand x={530} y={1056} rot={-70} skin={C.skinHim} /><Hand x={562} y={1060} rot={70} flip skin={C.skinHer} />
        <PocketPhone x={178} y={1040} t={t} />
      </g>
    </g>
    <defs><linearGradient id="dv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={INK} stopOpacity="0" /><stop offset="1" stopColor={INK} stopOpacity="0.85" /></linearGradient></defs>
    <rect x={-100} y={1120} width={1280} height={380} fill="url(#dv)" /><rect x={-100} y={1499} width={1280} height={600} fill={INK} opacity={0.85} />
  </g>;
};

// ------------------------------------------------------------------------------------------ shot: the cliff, house lights up (20.0-23.0)
const KeysBubble: React.FC<{x: number; y: number; k: number}> = ({x, y, k}) => {
  const p = 1 + 0.1 * Math.sin(clamp(k * 2) * Math.PI) ;
  const txt = "car's here!";
  const s = fitSize(txt, (z) => `800 ${z}px "Nunito Sans"`, 64, 400);
  return <g opacity={clamp(k * 6)} transform={`translate(${x} ${y}) scale(${p * clamp(k * 5)})`}>
    <rect x={-240} y={-62} width={480} height={124} rx={46} fill="#fff" stroke={INK} strokeWidth={6} />
    <path d="M 90 56 L 250 150 L 160 56 Z" fill="#fff" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <rect x={84} y={52} width={82} height={12} fill="#fff" />
    <text x={0} y={s * 0.34} textAnchor="middle" fontFamily={NUN} fontWeight={800} fontSize={s} fill={INK}>{txt}</text>
  </g>;
};
const CliffScene: React.FC<{t: number}> = ({t}) => {
  const lit = smooth(t, 20.03, 20.2);
  const flash = (1 - smooth(t, 20.05, 20.55)) * smooth(t, 20.0, 20.06);
  const slideK = smooth(t, 20.8, 21.3);
  const frozen = t >= 21.3;
  const g = Math.sin(clamp((t - 21.3) / 0.45) * Math.PI);
  const him = mkPose([0.9, 0.9, frozen ? 1.2 : 0.5, 0, frozen ? 0 : 2, 0.8, 0, 0], frozen ? 'gulp' : 'smile', 0, {gulp: frozen && t < 21.75 ? g : 0, sweat: t >= 21.2 ? 0.15 + 0.55 * (((t - 21.2) / 0.9) % 1) : 0});
  const her = mkPose([-1, 0.1, 0.3, 0, -3, 0.3, 0, 0.05], t < 21.3 ? 'smile' : 'smirk', 0);
  const tremor = frozen ? Math.sin(t * 70) * 1.6 : 0;
  const cx = lerp(800, 470, slideK);
  const push = wp(t, 20.75, 20.9) * (1 - wp(t, 21.3, 21.45));
  const keys = smooth(t, 20.15, 20.4);
  const wob = Math.sin(t * 14) * 7 * keys;
  return <g>
    <Wall t={t} />
    <rect x={-100} y={-100} width={1280} height={2100} fill={INK} opacity={0.4 * (1 - lit)} />
    {/* house lights: flat ceiling panels and a white wash */}
    <g opacity={lit}>{[200, 540, 880].map((x) => <g key={x}><path d={`M ${x - 60} 270 L ${x - 220} 760 L ${x + 220} 760 L ${x + 60} 270 Z`} fill="#fff" opacity={0.28} /><rect x={x - 80} y={262} width={160} height={22} rx={10} fill="#fff" /></g>)}</g>
    <Aunt x={540} y={705} s={0.8} t={0} keys={keys} wob={wob} />
    <g transform={`translate(${tremor} 0)`}><PP who="him" x={250} y={800} s={0.8} t={t} pose={him} seed={0.4} /></g>
    <PP who="her" x={830} y={800} s={0.8} t={t} pose={her} seed={1.9} />
    <Table t={t} dessert={false} />
    <g transform={`translate(${cx} 1040) rotate(${-3 * slideK})`}>
      <g transform="scale(0.8)"><TentCard face="front" lines={[]} scaleX={1} printed="" /></g>
    </g>
    {push > 0 && <SleeveHand who="her" x={cx + CARD_W * 0.8 / 2 + 10} y={1120} show={push} />}
    <KeysBubble x={330} y={520} k={wp(t, 20.3, 20.65)} />
    <rect x={-100} y={-100} width={1280} height={2100} fill="#fff" opacity={flash * 0.8} />
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
type Shot = 'tbl' | 'floor' | 'bag' | 'foot' | 'toe' | 'dance' | 'cliff' | 'vote' | 'end';
const WIPES: {t: number; dir: 1 | -1; d: number}[] = [{t: B.wipe1, dir: -1, d: 1.0}, {t: B.wipe2, dir: 1, d: 0.6}];
const shotAt = (t: number): Shot => (t < B.floor ? 'tbl' : t < B.bag ? 'floor' : t < B.wipe1 ? 'bag' : t < B.foot ? 'tbl' : t < B.toe ? 'foot' : t < B.dance ? 'toe' : t < B.cliff ? 'dance'
  : t < B.wipe2 ? 'cliff' : t < B.endcard ? 'vote' : 'end');
const renderShot = (s: Shot, t: number): React.ReactNode => {
  switch (s) {
    case 'tbl': return <TableScene t={t} />;
    case 'floor': return <FloorScene t={t} />;
    case 'bag': return <BagScene t={t} />;
    case 'foot': return <FootScene t={t} />;
    case 'toe': return <ToeScene t={t} />;
    case 'dance': return <DanceScene t={t} />;
    case 'cliff': return <CliffScene t={t} />;
    case 'vote': return <VoteScene t={t} />;
    default: return <EndCard t={t} a={t - B.endcard} part={6} />;
  }
};

const Scene: React.FC<{hook: Hook5}> = ({hook}) => {
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

export const Table5: React.FC<{hook?: Hook5}> = ({hook = 'a'}) => (
  <AbsoluteFill style={{background: C.ivory}}>
    <Audio src={staticFile('audio/table-ep5.wav')} volume={0.9} />
    <Scene hook={hook} />
  </AbsoluteFill>
);
