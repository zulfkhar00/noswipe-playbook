import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, lerp, smooth} from '../../lib/motion';
import {MotionBlurWhen} from '../../lib/shots';
import {
  C, CARD_W, CamKey, Centerpiece, Defs, Extras, GEL, Hand, Bokeh, Line, MARK, Marker, Mouth, NUN, NearPlane, Person, PersonPose, PhoneBody,
  SUSAN, SoftEllipse, SoftRect, SusanRing, Strip, Table, TentCard, Thumb, WIPE_DUR, Wall, camAt, fitSize, keyAt, mkPose, planeT, textW, tipOf, track, wipeR,
} from './world';
import spec from '../../../specs/stories/table-ep6.json';

// Table Nine, part 6 (finale) "One card". Silent, no phones after 1.5 s. Frame 1 = ONE strip, his phone lit mid-swipe, the last blank
// tent in front of him, house lights up, aunt with car keys. Take 1 (same table next wedding?) fails on him: the aunt RSVPs for herself.
// Lazy Susan back. Take 2 (ollie. yours?): she writes (noor.), tent turns to OLLIE · NOOR, music drops. Payoff: empty table, she wrote back.

export const TABLE6_FPS = 60;
export const TABLE6_FRAMES = Math.round(spec.duration * TABLE6_FPS);
const B = spec.beats;
export type Hook6 = 'a' | 'b';

const HIM = {x: 255, y: 655}, HER = {x: 825, y: 655};
const DOWN0 = B.phoneDown, DOWN1 = B.phoneDown + 0.15;
const GREEN = '#3C6B52';
const INK = C.aubergine;
const SKIN_AUNT = '#E6B795';
const AUNT_COL = '#9C86B8';
const wp = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const WIPE1 = B.wipe1;
const PP: React.FC<{who: 'him' | 'her'; x: number; y: number; s: number; t: number; pose: PersonPose; seed: number}> = ({who, x, y, s, t, pose, seed}) =>
  <g transform={`translate(${x} ${y}) scale(${s})`}><Person who={who} x={0} y={0} t={t} pose={pose} seed={seed} /></g>;

// ------------------------------------------------------------------------------------------ table poses (hook, take 1 writing, take 2 writing)
const P0 = [0.9, 0.8, 1.0, 0.3, 3, 0.55, 0, 0];
const W1 = [0.5, 0.9, 0.2, 0, 2, 0.3, 0, 0.05];
const HIM_KEYS: [number, number[]][] = [
  [0, P0], [B.phoneDown - 0.1, P0], [B.phoneDown + 0.05, [0.2, 0.5, 0.9, 0, 0, 0.2, 0, 0]],
  [1.9, [0.8, 0.9, 1.0, 0, 2, 0.4, 0, 0]], [2.5, [0.8, 0.9, 1.0, 0, 2, 0.4, 0, 0]],
  [3.1, W1], [4.8, W1], [4.95, [1, 0.1, 0.4, 0, -2, 0.5, 0, 0.1]], [5.2, [1, 0.1, 0.4, 0, -2, 0.5, 0, 0.1]],
  [WIPE1 + 0.1, [0.5, 0.9, 0.4, 0, 0, 0.3, 0, 0.05]], [13.4, W1], [15.2, W1], [15.3, [1, 0.1, 0.5, 0, -2, 0.5, 0, 0.05]], [16, [1, 0.1, 0.5, 0, -2, 0.5, 0, 0.05]],
];
const HIM_MOUTH: [number, Mouth][] = [[0, 'gulp'], [B.phoneDown + 0.05, 'o'], [1.9, 'flat'], [3.1, 'flat'], [4.95, 'smirk'], [WIPE1 + 0.1, 'flat'], [15.3, 'smile']];
const Q0 = [1, 0.1, 0.5, 0, -3, 0.15, 0, 0.1];     // she looks toward the door
const HER_KEYS: [number, number[]][] = [
  [0, Q0], [1.7, Q0], [2.0, [-0.8, 0.8, 0.3, 0, -2, 0.2, 0, 0.05]], [2.9, [-0.8, 0.8, 0.3, 0, -2, 0.2, 0, 0.05]],
  [3.3, [-0.5, 0.9, 0.2, 0, -2, 0.2, 0, 0.1]], [4.9, [-0.5, 0.9, 0.2, 0, -2, 0.2, 0, 0.1]],
  [WIPE1 + 0.1, Q0], [13.6, [-0.5, 0.9, 0.3, 0, -2, 0.2, 0, 0.1]], [15.4, [-0.5, 0.9, 0.3, 0, -2, 0.2, 0, 0.1]],
];
const HER_MOUTH: [number, Mouth][] = [[0, 'flat'], [2.0, 'smirk'], [3.3, 'smirk'], [WIPE1 + 0.1, 'flat'], [13.6, 'smirk']];
const himPose = (t: number): PersonPose => mkPose(track(HIM_KEYS, t), keyAt(t, HIM_MOUTH), 1 - smooth(t, DOWN0, DOWN1),
  {sweat: t < 1.4 ? 0.45 : t > 2.3 && t < 3.2 ? wp(t, 2.3, 3.2) : 0});
const herPose = (t: number): PersonPose => mkPose(track(HER_KEYS, t), keyAt(t, HER_MOUTH), 0);

const A0 = {x: 540, y: 900}, BB = {x: 540, y: 890};
const CAM: CamKey[] = [
  {t: 0, ...A0, z: 1.0}, {t: 3.0, ...A0, z: 1.03},
  {t: 3.05, ...BB, z: 1.08, wob: 0.6, cut: true}, {t: 4.9, ...BB, z: 1.1, wob: 0.6},
  {t: 4.9, ...A0, z: 1.0, cut: true}, {t: 5.2, ...A0, z: 1.01},
  {t: WIPE1, ...A0, z: 1.0, cut: true}, {t: 13.3, ...A0, z: 1.03},
  {t: 13.35, ...BB, z: 1.08, wob: 0.6, cut: true}, {t: 15.5, ...BB, z: 1.1, wob: 0.6},
];

// ------------------------------------------------------------------------------------------ phones and arms (as part 3)
const HIM_TICKS = [-0.1, ...Array.from({length: 5}, (_, i) => 0.2 + i * 0.3)];
const swipe = (t: number) => {
  let idx = 0;
  for (let i = 0; i < HIM_TICKS.length; i++) if (HIM_TICKS[i] <= t) idx = i;
  return {p: clamp((t - HIM_TICKS[idx]) / 0.26), dir: idx % 2 ? 1 : -1};
};
const PhoneUnit: React.FC<{who: 'him' | 'her'; t: number}> = ({who, t}) => {
  const him = who === 'him';
  const k = him ? smooth(t, DOWN0, DOWN1) : 1;
  const x = lerp(him ? 200 : 962, him ? 140 : 940, k);
  const y = lerp(him ? 1120 : 1150, 1214, k) - 46 * Math.sin(k * Math.PI);
  const ang = lerp(him ? 8 : -8, him ? 90 : -90, k);
  const sy = lerp(1, 0.5, k);
  const {p, dir} = swipe(t);
  const big = him ? lerp(1.8, 1, k) : 1;
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
type LDef = {text: string; y: number; rot: number; col: string; size: number};
const mkLine = (d: LDef, prog: number): Line => {
  const s = fitSize(d.text, HAND, d.size, 640);
  return {text: d.text, x0: -textW(d.text, HAND(s)) / 2, y: d.y, size: s, rot: d.rot, color: d.col, prog};
};
const TERRA = '#5A1F0C', PURPLE = '#4A2B73', DKGREEN = '#1F4A36';
const D_H1: LDef[] = [{text: '(same table', y: 4, rot: 1.5, col: TERRA, size: 66}, {text: 'next wedding?)', y: 84, rot: 1.5, col: TERRA, size: 66}];
const D_H2: LDef[] = [{text: spec.cards.his_2, y: 36, rot: 1.5, col: TERRA, size: 90}];
const D_AUNT: LDef[] = [{text: "(it's a date!", y: 40, rot: -2, col: PURPLE, size: 66}, {text: '-auntie)', y: 108, rot: -2, col: PURPLE, size: 66}];
const D_NOOR: LDef[] = [{text: spec.cards.her_name, y: 66, rot: -2, col: DKGREEN, size: 120}];
const D_END: LDef[] = [{text: '(same table', y: 52, rot: -1.5, col: INK, size: 64}, {text: 'next wedding.)', y: 116, rot: -1.5, col: INK, size: 64}];
const linesAt = (defs: LDef[], p: number): Line[] => defs.map((d, i) => mkLine(d, clamp(p * defs.length - i)));
const tipAtP = (defs: LDef[], p: number): [number, number] => {
  const i = Math.min(defs.length - 1, Math.max(0, Math.floor(p * defs.length - 1e-6)));
  return tipOf(mkLine(defs[i], clamp(p * defs.length - i)));
};
const CS = 0.8;
const mainCard = (t: number) => {
  const sl = t < WIPE1 ? smooth(t, 4.95, 5.2) : smooth(t, 15.2, 15.5);
  return {x: 330 + 140 * sl, y: 965, s: CS, rot: 3 * sl};
};
const ROW = 1236;
type Held = {x: number; y: number; rot: number; capped: boolean; holder: 'him' | null};
const SEGS = [
  {defs: D_H1, pick: 2.85, a: B.write1, b: 4.55, putTo: 4.8, restB: 400, restA: 470},
  {defs: D_H2, pick: 13.2, a: 13.6, b: 14.8, putTo: 15.0, restB: 470, restA: 480},
];
const markerAt = (t: number): Held => {
  const capped = t < WIPE1 ? t < B.uncap : t < B.uncap2;
  let idx = -1;
  SEGS.forEach((s, i) => { if (t >= s.pick) idx = i; });
  if (idx < 0) return {x: 400, y: ROW, rot: -6, capped, holder: null};
  const s = SEGS[idx], cs = mainCard(t);
  const tipAt = (p: number): [number, number] => { const [a, b] = tipAtP(s.defs, p); return [cs.x + cs.s * a, cs.y + cs.s * b + 4]; };
  const rot = -35, r = rot * Math.PI / 180;
  const place = (tip: [number, number]) => ({x: tip[0] + 16 - Math.cos(r) * 76, y: tip[1] + 44 - Math.sin(r) * 76});
  const blend = (tip: [number, number], restX: number, k: number): Held => {
    if (k <= 0) return {x: restX, y: ROW, rot: -6, capped, holder: null};
    const p = place(tip);
    return {x: lerp(restX, p.x, smooth(k, 0, 1)), y: lerp(ROW, p.y, smooth(k, 0, 1)), rot: lerp(-6, rot, smooth(k, 0, 1)), capped: capped && k < 1, holder: 'him'};
  };
  if (t < s.a) return blend(tipAt(0), s.restB, wp(t, s.pick, s.pick + 0.4));
  if (t <= s.b) return blend(tipAt(wp(t, s.a, s.b)), s.restB, 1);
  if (t < s.putTo) return blend(tipAt(1), s.restA, 1 - wp(t, s.b, s.putTo));
  return {x: s.restA, y: ROW, rot: -6, capped: false, holder: null};
};

const TableProps: React.FC<{t: number}> = ({t}) => {
  const mc = mainCard(t), m = markerAt(t);
  const take1 = t < WIPE1;
  const U = take1 ? B.uncap : B.uncap2;
  const capU = clamp((t - U) / 0.75);
  const capX = lerp(450, 640, capU), capY = ROW - 4 - 320 * Math.sin(capU * Math.PI);
  const push = take1 ? wp(t, 4.85, 5.0) * (1 - wp(t, 5.1, 5.2)) : wp(t, 15.15, 15.3) * (1 - wp(t, 15.4, 15.5));
  const lines = linesAt(take1 ? D_H1 : D_H2, take1 ? wp(t, B.write1, 4.55) : wp(t, 13.6, 14.8));
  return <g>
    <g transform={`translate(${mc.x} ${mc.y}) rotate(${mc.rot}) scale(${mc.s})`}><TentCard face="back" lines={lines} scaleX={1} /></g>
    {t >= U && (take1 || t >= U) && <g transform={`translate(${capU < 1 ? capX : 640} ${capU < 1 ? capY : ROW + 6}) rotate(${capU < 1 ? capU * 540 : 14})`}><rect x={-31} y={-15} width={62} height={30} rx={13} fill="#3A3140" /></g>}
    {m.holder === null && <Marker x={m.x} y={m.y} rot={m.rot} capped={m.capped} />}
    {m.holder === 'him' && <SleeveHand who="him" x={m.x - 70 * Math.cos(35 * Math.PI / 180) - 40} y={m.y + 52} show={1} />}
    {m.holder !== null && <Marker x={m.x} y={m.y} rot={m.rot} capped={m.capped} />}
    {push > 0 && <SleeveHand who="him" x={mc.x - CARD_W * CS / 2 - 10} y={1090} show={push} />}
  </g>;
};

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

// ------------------------------------------------------------------------------------------ shot: the table (hook, take 1 writing, take 2 writing)
const HouseLights: React.FC<{k: number}> = ({k}) => <g opacity={k}>
  {[200, 540, 880].map((x) => <g key={x}><path d={`M ${x - 60} 270 L ${x - 220} 760 L ${x + 220} 760 L ${x + 60} 270 Z`} fill="#fff" opacity={0.45} /><rect x={x - 80} y={262} width={160} height={22} rx={10} fill="#fff" /></g>)}
</g>;
const TableScene: React.FC<{t: number}> = ({t}) => {
  const cam = camAt(CAM, t);
  const hook = t < 12;
  return <g>
    <g transform={planeT(cam, 0.2)}><Wall t={t} /><HouseLights k={hook ? 1 : 0.55} /></g>
    <g transform={planeT(cam, 0.3)}><Extras /></g>
    <g transform={planeT(cam, 0.6)}><Aunt x={560} y={650} s={0.74} t={0} keys={hook ? 1 : 0.0} wob={Math.sin(t * 14) * 7} /></g>
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
    {t >= 3 && <g transform={planeT(cam, 1.7)}><NearPlane t={t} /></g>}
  </g>;
};

// ------------------------------------------------------------------------------------------ shot: take 1, the aunt intercepts (5.2-12.0)
const Glass: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => <g transform={`translate(${x} ${y}) scale(${s})`}>
  <ellipse cx={0} cy={4} rx={70} ry={12} fill={INK} opacity={0.22} />
  <path d="M -22 -170 L 22 -170 Q 30 -80 6 -60 L -6 -60 Q -30 -80 -22 -170 Z" fill="#FFF8E0" fillOpacity={0.75} stroke="#CDB985" strokeWidth={5} />
  <path d="M -20 -120 L 20 -120 Q 24 -90 8 -66 L -8 -66 Q -24 -90 -20 -120 Z" fill="#F2D98A" opacity={0.8} />
  <rect x={-4} y={-62} width={8} height={54} fill="#E9E0C4" stroke="#CDB985" strokeWidth={3} />
  <ellipse cx={0} cy={-4} rx={44} ry={9} fill="#FFF8E0" stroke="#CDB985" strokeWidth={5} />
</g>;
const Doorway: React.FC<{x: number; y: number; w: number; h: number}> = ({x, y, w, h}) => <g>
  <rect x={x - 10} y={y - 10} width={w + 20} height={h + 10} rx={20} fill="#CDB985" />
  <rect x={x} y={y} width={w} height={h} rx={14} fill="#FFF3CC" />
  <rect x={x} y={y} width={w} height={h} rx={14} fill="url(#glow)" />
</g>;
const AuntScene: React.FC<{t: number}> = ({t}) => {
  const ax = lerp(1400, 650, smooth(t, 5.2, 5.9));
  const reading = t >= 6.2 && t < 6.9;
  const beam = t >= 6.9;
  const joy = beam && t < 12 ? t : 0;
  // card: on table -> aunt's hands -> flipped -> back on table
  const lift = smooth(t, 5.9, 6.3) * (1 - smooth(t, 7.4, 7.75));
  const held = lift > 0.01;
  const flipK = wp(t, 6.95, 7.35);
  const sx = Math.cos(flipK * Math.PI);
  const face: 'front' | 'back' = flipK > 0.5 ? 'front' : 'back';
  const big = smooth(t, 9.05, 9.3) * (1 - smooth(t, 10.2, 10.5));
  const cx = lerp(lerp(470, 660, lift), 540, big), cy = lerp(lerp(970, 930, lift), 1000, big), cs = lerp(lerp(0.8, 0.52, lift), 1.35, big);
  const reach = smooth(t, 5.85, 6.15) * (1 - smooth(t, 7.2, 7.5));
  const writeP = wp(t, 7.9, 9.0);
  const cardLines = face === 'back' ? linesAt(D_H1, 1) : linesAt(D_AUNT, writeP);
  const tipRel = tipAtP(D_AUNT, writeP);
  const tip: [number, number] = [cx + cs * tipRel[0], cy + cs * tipRel[1] + 4];
  const writing = t >= 7.6 && t < 9.05;
  const pinch = smooth(t, 10.5, 10.75) * (1 - smooth(t, 11.55, 11.8));
  const pinchOn = t >= 10.75 && t < 11.55;
  const him = mkPose([0.9, 0.5, pinch > 0.5 ? 0.2 : 0.9, 0, 2, 0.9 * (beam ? 1 : 0.4), 0, 0.1 * pinch], t < 10.5 ? (t < 6.9 ? 'gulp' : 'flat') : 'o', 0, {sweat: wp(t, 6.2, 8) * 0.6});
  const hx = 250, hy = 740;
  const her = mkPose([0.4 + 0.3 * Math.sin(t * 2), 0.2, 0.6, 0, -4 + 3 * Math.sin(t * 22) * 0.4, 0.5, 0.8, 0.2], 'laugh', 0, {happy: true});
  const herK = wp(t, 5.5, 11.5);
  const herX = lerp(880, 975, smooth(herK, 0, 1)), herY = 690 + 8 * Math.sin(t * 20);
  return <g>
    <Wall t={t} />
    <HouseLights k={0.7} />
    <Doorway x={870} y={400} w={230} h={520} />
    <g opacity={0.9}>
      <PP who="her" x={herX} y={herY} s={0.52} t={t} pose={her} seed={1.9} />
      {/* a relative tugging her sleeve toward the door */}
      <path d={`M 1260 ${860} Q 1130 ${880} ${herX + 70} ${herY + 150}`} fill="none" stroke="#E7E2EA" strokeWidth={44} strokeLinecap="round" />
      <Hand x={herX + 66} y={herY + 152} rot={-70} skin="#D9A07C" />
    </g>
    <Aunt x={ax} y={640} s={1.15} t={joy} wide={reading ? 0.3 : 0} smile={beam ? 1 : 0} />
    <g transform={`translate(${hx} ${hy}) scale(${1 + 0.05 * pinch} ${1 - 0.06 * pinch})`}>
      <g transform={`translate(${-hx} ${-hy})`}><PP who="him" x={hx} y={hy} s={0.85} t={t} pose={him} seed={0.4} /></g>
    </g>
    <Table t={t} dessert={false} />
    <Glass x={820} y={1190} s={0.9} />
    <g transform={`translate(${cx} ${cy}) rotate(${lerp(0, -4, lift)}) scale(${cs})`}><TentCard face={face} lines={cardLines} scaleX={Math.abs(sx) < 0.04 ? 0.04 : Math.abs(sx)} /></g>
    {reach > 0.01 && <g opacity={clamp(reach * 4)}>
      <path d={`M 30 1180 Q 200 1150 ${cx - cs * 350 - 50} ${cy + 50}`} fill="none" stroke="#4A2A52" strokeWidth={84} strokeLinecap="round" />
      <Hand x={cx - cs * 350 - 30} y={cy + 40} rot={-70} skin={C.skinHim} />
    </g>}
    {held && <g>
      <circle cx={cx - 200 * cs * 1.2 - 4} cy={cy + 120 * cs} r={28} fill={SKIN_AUNT} stroke={INK} strokeWidth={3} />
      <circle cx={cx + 200 * cs * 1.2 + 4} cy={cy + 120 * cs} r={28} fill={SKIN_AUNT} stroke={INK} strokeWidth={3} />
    </g>}
    {writing && <g>
      <Marker x={tip[0] + 16 - 62} y={tip[1] + 44 + 44} rot={-35} capped={false} />
      <path d={`M 1260 1500 Q ${tip[0] + 330} 1330 ${tip[0] + 70} ${tip[1] + 130}`} fill="none" stroke={AUNT_COL} strokeWidth={80} strokeLinecap="round" />
      <Hand x={tip[0] + 44} y={tip[1] + 118} rot={50} flip skin={SKIN_AUNT} />
    </g>}
    {(pinch > 0 || pinchOn) && <g>
      <path d={`M ${ax - 90} 800 Q ${(ax + 380) / 2 - 40} ${690 - 20 * pinch} 412 ${795}`} fill="none" stroke={AUNT_COL} strokeWidth={84} strokeLinecap="round" opacity={pinch} />
      <ellipse cx={392} cy={800} rx={30 + 14 * pinch} ry={22} fill={C.skinHim} stroke={INK} strokeWidth={4} opacity={pinch} />
      <circle cx={414} cy={796} r={30} fill={SKIN_AUNT} stroke={INK} strokeWidth={4} opacity={pinch} />
      <path d="M 404 780 L 440 786 M 404 812 L 440 806" stroke={INK} strokeWidth={6} strokeLinecap="round" opacity={pinch} />
      {pinchOn && [0, 1, 2].map((i) => <path key={i} d={`M ${340 + i * 24} ${740 - i * 8} l ${-18 + i * 4} -30`} stroke={INK} strokeWidth={7} strokeLinecap="round" />)}
    </g>}
  </g>;
};

// ------------------------------------------------------------------------------------------ shot: take 2, she answers on the back of the card (15.5-18.2)
const ReplyScene: React.FC<{t: number}> = ({t}) => {
  const cam = camAt([{t: B.reply, ...A0, z: 1.0}, {t: B.reveal, ...A0, z: 1.04}], t);
  const flipK = wp(t, 15.8, 16.4);
  const face: 'front' | 'back' = flipK > 0.5 ? 'front' : 'back';
  const sx = Math.max(0.04, Math.abs(Math.cos(flipK * Math.PI)));
  const writeP = wp(t, 16.7, 17.5);
  const herIn = smooth(t, 15.5, 16.2);
  const CX = 540, CY = 1010;
  const tipRel = tipAtP(D_NOOR, writeP);
  const tip: [number, number] = [CX + tipRel[0], CY + tipRel[1] + 2];
  const writing = t > 16.5 && t < 17.6;
  const him = mkPose([0.9, 0.5, 1.0, 0, 3, 0.7, 0, 0.05], t < 17.8 ? 'o' : 'smile', 0, {sweat: 0.3});
  const her = mkPose([-0.8, 0.9, 0.4, 0, -4, 0.4, 0, 0.1], t < 17.8 ? 'smirk' : 'smile', 0, {});
  return <g>
    <g transform={planeT(cam, 0.2)}><Wall t={t} /><HouseLights k={0.55} /></g>
    <g transform={planeT(cam, 0.3)}><Extras /></g>
    <g transform={planeT(cam, 0.92)}>
      <PP who="him" x={265} y={690} s={0.62} t={t} pose={him} seed={0.4} />
      <PP who="her" x={lerp(1250, 815, herIn)} y={690} s={0.62} t={t} pose={her} seed={1.9} />
    </g>
    <g transform={planeT(cam, 1.0)}>
      <Table t={t} dessert={false} />
      <g transform={`translate(${CX} ${CY}) rotate(-1.5)`}>
        <TentCard face={face} lines={face === 'back' ? linesAt(D_H2, 1) : linesAt(D_NOOR, writeP)} scaleX={sx} />
      </g>
      {writing && <g>
        <Marker x={tip[0] + 16 - 62} y={tip[1] + 44 + 44} rot={-35} capped={false} />
        <path d={`M 1130 1500 Q ${tip[0] + 300} 1330 ${tip[0] + 60} ${tip[1] + 130}`} fill="none" stroke={C.eucDeep} strokeWidth={70} strokeLinecap="round" />
        <Hand x={tip[0] + 40} y={tip[1] + 120} rot={50} flip skin={C.skinHer} />
      </g>}
    </g>
  </g>;
};

// ------------------------------------------------------------------------------------------ shot: the reveal, the tent turns (18.2-22.0)
const RevealScene: React.FC<{t: number}> = ({t}) => {
  const turn = smooth(wp(t, 18.7, 20.9), 0, 1);
  const th = turn * Math.PI;
  const sx = Math.max(0.03, Math.abs(Math.cos(th)));
  const back = th > Math.PI / 2;
  const z = lerp(1.2, 1.32, wp(t, 18.2, 22.0));
  const pop = back ? 1 + 0.06 * Math.sin(clamp((th - Math.PI / 2) / 0.5) * Math.PI) : 1;
  const him = mkPose([0.4, 0.5, 0.8, 0, 2, 0.6, 0, 0], 'smile', 0, {});
  const her = mkPose([-0.4, 0.5, 0.5, 0, -3, 0.3, 0, 0], 'smile', 0, {});
  return <g>
    <Wall t={t} />
    <ellipse cx={540} cy={1010} rx={620} ry={420} fill="url(#glow)" opacity={0.7} />
    <PP who="him" x={230} y={700} s={0.58} t={t} pose={him} seed={0.4} />
    <PP who="her" x={850} y={700} s={0.58} t={t} pose={her} seed={1.9} />
    <Table t={t} dessert={false} />
    <g transform={`translate(540 1020) scale(${z * pop}) skewY(${Math.sin(th) * 5})`}>
      <g transform="rotate(-1.5)"><TentCard face={back ? 'front' : 'front'} lines={back ? [] : linesAt(D_NOOR, 1)} scaleX={sx} printed={back ? 'OLLIE · NOOR' : 'OLLIE · TABLE 9'} /></g>
    </g>
  </g>;
};

// ------------------------------------------------------------------------------------------ shot: she tucks the card under his glass, waves from the door (22.0-26.0)
const BuzzPocket: React.FC<{x: number; y: number; t: number}> = ({x, y, t}) => {
  const on = [B.buzz1, B.buzz2].some((a) => t >= a && t < a + 0.28);
  const jx = on ? Math.sin(t * 90) * 5 : 0;
  return <g transform={`translate(${x + jx} ${y})`}>
    <path d="M -78 -30 L 78 -30 L 72 70 Q 0 92 -72 70 Z" fill="#3A2042" stroke={INK} strokeWidth={5} />
    <path d="M -78 -30 L 78 -30" stroke="#6A4A72" strokeWidth={7} strokeLinecap="round" />
    {on && [-1, 1].map((q) => [0, 1, 2].map((i) => <path key={q + '-' + i} d={`M ${q * (92 + i * 26)} ${-70 + i * 14} Q ${q * (112 + i * 26)} ${-20 + i * 14} ${q * (92 + i * 26)} ${30 + i * 14}`} fill="none" stroke={INK} strokeWidth={8} strokeLinecap="round" opacity={1 - i * 0.25} />))}
  </g>;
};
const LeaveScene: React.FC<{t: number}> = ({t}) => {
  const tuck = smooth(t, 22.5, 23.0);
  const handK = wp(t, 22.2, 23.0) * (1 - wp(t, 23.0, 23.35));
  const up = smooth(t, 23.3, 23.8);                                    // she stands and is gone from the seat
  const wave = t > 24.2 ? Math.sin((t - 24.2) * 11) * 22 : 0;
  const keys = smooth(t, 23.9, 24.2);
  const him = mkPose([0.9, 0.2, 0.6, 0, 3, 0.6, 0, 0], t < 23.4 ? 'smirk' : 'smile', 0, {});
  const her = mkPose([-0.8, 0.5, 0.5, 0, -3, 0.3, 0, 0], 'smile', 0, {});
  const door = mkPose([-1, 0.1, 0.5, 0, -4, 0.3, 0.2, 0], 'smile', 0, {happy: true});
  const cardX = lerp(470, 560, tuck), cardY = lerp(1020, 1052, tuck);
  return <g>
    <Wall t={t} />
    <HouseLights k={1} />
    <Doorway x={820} y={400} w={250} h={520} />
    {up > 0.5 && <g opacity={smooth(up, 0.5, 1)}>
      <PP who="her" x={945} y={640} s={0.42} t={t} pose={door} seed={1.9} />
      <g transform={`translate(1048 ${700}) rotate(${wave})`}><Hand x={0} y={-30} rot={0} flip skin={C.skinHer} />
        <path d="M 0 60 L 0 -10" stroke={C.eucDeep} strokeWidth={34} strokeLinecap="round" /></g>
    </g>}
    <Aunt x={780} y={630} s={0.55} t={0} keys={keys} wob={Math.sin(t * 16) * 12} flip />
    {up > 0.5 && <g opacity={smooth(up, 0.5, 1)}>
      <path d="M 842 842 Q 836 770 945 758 Q 1058 770 1052 842 L 1060 940 L 836 940 Z" fill="#B8865A" stroke={INK} strokeWidth={5} />
      <path d="M 905 762 L 945 840 L 985 762" fill="#F2E7CF" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      {[0, 1].map((i) => <circle key={i} cx={945} cy={870 + i * 40} r={7} fill={INK} />)}
      <path d="M 748 748 Q 800 740 868 800" fill="none" stroke={AUNT_COL} strokeWidth={40} strokeLinecap="round" />
      <circle cx={872} cy={804} r={22} fill={SKIN_AUNT} stroke={INK} strokeWidth={3} />
    </g>}
    <PP who="him" x={255} y={730} s={0.82} t={t} pose={him} seed={0.4} />
    {up <= 0.5 && <PP who="her" x={lerp(815, 905, up * 2)} y={730} s={0.82} t={t} pose={her} seed={1.9} />}
    <Table t={t} dessert={false} />
    <g transform={`translate(${cardX} ${cardY}) rotate(${-3 * tuck}) scale(0.8)`}><TentCard face="front" lines={[]} scaleX={1} printed="OLLIE · NOOR" /></g>
    <Glass x={lerp(900, 770, tuck)} y={1170} s={0.9} />
    {handK > 0 && <g opacity={clamp(handK * 5)}>
      <path d={`M 1260 1480 Q ${lerp(1100, 860, handK)} 1330 ${lerp(930, 830, tuck)} 1150`} fill="none" stroke={C.eucDeep} strokeWidth={78} strokeLinecap="round" />
      <Hand x={lerp(930, 830, tuck)} y={1140} rot={30} flip skin={C.skinHer} />
    </g>}
    <BuzzPocket x={150} y={1010} t={t} />
  </g>;
};

// ------------------------------------------------------------------------------------------ shot: the empty table, she wrote back (26.0-31.0)
const EmptyScene: React.FC<{t: number}> = ({t}) => {
  const z = lerp(1.12, 1.32, wp(t, 26, 31));
  const p = wp(t, B.writeEnd0, B.writeEnd1);
  const writing = p > 0 && p < 1;
  return <g transform={`translate(540 1000) scale(${z}) translate(-540 -1000)`}>
    <Wall t={t} />
    <rect x={-100} y={-100} width={1280} height={2100} fill={INK} opacity={0.06} />
    <Bokeh t={t} n={12} y0={480} y1={900} seed={4} />
    <Centerpiece t={t} />
    <Table t={t} dessert={false} />
    <Marker x={620} y={1250} rot={-6} capped={false} />
    <Glass x={210} y={1190} s={0.95} />
    <g transform={`translate(540 1010) rotate(-1.5) scale(1.0)`}>
      <TentCard face="front" lines={linesAt(D_END, p)} scaleX={1} printed="OLLIE · NOOR" />
    </g>
    {writing && <ellipse cx={540} cy={1010} rx={420} ry={190} fill="url(#glow)" opacity={0.35} />}
  </g>;
};

// ------------------------------------------------------------------------------------------ end card
const EndCard6: React.FC<{t: number; a: number}> = ({t, a}) => {
  const pop = a < 0.35 ? 1 + 0.12 * (1 - a / 0.35) : 1;
  const mk = (txt: string, y: number, size: number, fill: string, wd: number) => <g transform={`translate(540 ${y}) scale(${pop}) translate(-540 ${-y})`}>
    <rect x={540 - wd / 2 + 12} y={y - size * 0.8 + 14} width={wd} height={size * 1.5} rx={36} fill={INK} opacity={0.88} />
    <rect x={540 - wd / 2} y={y - size * 0.8} width={wd} height={size * 1.5} rx={36} fill={fill} stroke={INK} strokeWidth={7} />
    <text x={540} y={y + size * 0.36} textAnchor="middle" fontFamily={NUN} fontWeight={800} fontSize={size} fill={INK}>{txt}</text>
  </g>;
  return <g>
    <rect x={-100} y={-100} width={1280} height={2100} fill="url(#wall)" />
    <Bokeh t={t} n={22} y0={250} y1={1300} seed={7} />
    <Wall t={t} />
    <rect x={-100} y={-100} width={1280} height={2100} fill={C.ivory} opacity={0.82} />
    <Bokeh t={t} n={16} y0={280} y1={1250} seed={9} />
    {mk('table nine', 700, 150, C.cloth, 900)}
    {mk('the end', 920, 110, C.eucalyptus, 560)}
    {mk('follow for the next story', 1150, 64, C.marigold, 940)}
  </g>;
};

// ------------------------------------------------------------------------------------------ the edit
type Shot = 'tbl' | 'aunt' | 'reply' | 'reveal' | 'leave' | 'empty' | 'end';
const WIPES: {t: number; dir: 1 | -1; d: number}[] = [{t: WIPE1, dir: -1, d: 1.0}];
const shotAt = (t: number): Shot => (t < B.aunt ? 'tbl' : t < B.wipe1 ? 'aunt' : t < B.reply ? 'tbl' : t < B.reveal ? 'reply' : t < B.leave ? 'reveal'
  : t < B.empty ? 'leave' : t < B.endcard ? 'empty' : 'end');
const renderShot = (s: Shot, t: number): React.ReactNode => {
  switch (s) {
    case 'tbl': return <TableScene t={t} />;
    case 'aunt': return <AuntScene t={t} />;
    case 'reply': return <ReplyScene t={t} />;
    case 'reveal': return <RevealScene t={t} />;
    case 'leave': return <LeaveScene t={t} />;
    case 'empty': return <EmptyScene t={t} />;
    default: return <EndCard6 t={t} a={t - B.endcard} />;
  }
};

const Scene: React.FC<{hook: Hook6}> = ({hook}) => {
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
          return <Strip key={i} text={s.text} y={s.y} age={t - s.from + 0.06} out={smooth(t, s.to - 0.12, s.to)} size={(s as {big?: boolean}).big ? 92 : (s as {small?: boolean}).small ? 48 : 60} rot={i % 2 ? 0.6 : -0.6} />;
        })}
        {t > B.wipe1 && t < B.wipe1 + 1.15 && <g opacity={smooth(t, B.wipe1 + 0.02, B.wipe1 + 0.15) * (1 - smooth(t, B.wipe1 + 0.8, B.wipe1 + 1.15))} transform="translate(540 1000)">
          {[-1, 1].map((k) => <path key={k} d={`M ${k * 130 + 90} -110 L ${k * 130 - 90} 0 L ${k * 130 + 90} 110 Z`} fill={C.marigold} stroke={INK} strokeWidth={10} strokeLinejoin="round" />)}
        </g>}
      </svg>
    </AbsoluteFill>
  </>;
};

export const Table6: React.FC<{hook?: Hook6}> = ({hook = 'a'}) => (
  <AbsoluteFill style={{background: C.ivory}}>
    <Audio src={staticFile('audio/table-ep6.wav')} volume={0.9} />
    <Scene hook={hook} />
  </AbsoluteFill>
);
