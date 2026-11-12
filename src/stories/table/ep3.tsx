import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, lerp, smooth} from '../../lib/motion';
import {MotionBlurWhen} from '../../lib/shots';
import {
  C, CARD_W, CamKey, Centerpiece, Defs, EndCard, Extras, GEL, Hand, Line, MARK, Marker, Mouth, NUN, NearPlane, Person, PersonPose, PhoneBody,
  SUSAN, SoftEllipse, SoftRect, SusanRing, Strip, Table, TentCard, Thumb, VoteBoard, VoteCard, WIPE_DUR, Wall, camAt, fitSize, keyAt, mkPose, planeT, textW, tipOf, track, wipeR,
} from './world';
import spec from '../../../specs/stories/table-ep3.json';

// Table Nine, part 3 "The speech". Silent. Frame 1 = ONE strip, two big faces, his phone lit mid-swipe, tent card "(cake? now?)",
// best man small at a mic with glass raised. Take 1 (after the speech) fails on him: endless speech, cake wheeled away, empty stand,
// her shrug. Lazy Susan back = rewind. Take 2 (yes. now.): duck, crouch-walk, forks, terrace, napkin, buzz unread. Cliff: TABLE 2 card.

export const TABLE3_FPS = 60;
export const TABLE3_FRAMES = Math.round(spec.duration * TABLE3_FPS);
const B = spec.beats;
export type Hook3 = 'a' | 'b';

const HIM = {x: 255, y: 655}, HER = {x: 825, y: 655};
const DOWN0 = 1.7, DOWN1 = 1.85;
const GREEN = '#3C6B52';
const wp = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const WIPE1 = B.wipe1, TBL1_END = B.wait;
const INK = C.aubergine;
const PP: React.FC<{who: 'him' | 'her'; x: number; y: number; s: number; t: number; pose: PersonPose; seed: number}> = ({who, x, y, s, t, pose, seed}) =>
  <g transform={`translate(${x} ${y}) scale(${s})`}><Person who={who} x={0} y={0} t={t} pose={pose} seed={seed} /></g>;

// ------------------------------------------------------------------------------------------ table poses (take 1 table, take 2 table)
const P0 = [-0.6, 0.9, 0.1, 0, 3, 0.15, 0, 0.25];
const HIM_KEYS: [number, number[]][] = [
  [0, P0], [1.6, P0], [1.75, [0.2, 0.5, 0.9, 0, 0, 0.2, 0, 0]], [2.0, [0.7, 0.8, 0.5, 0, 2, 0.3, 0, 0.05]], [3.3, [0.7, 0.8, 0.5, 0, 2, 0.3, 0, 0.05]],
  [3.45, [0.5, 0.9, 0.2, 0, 2, 0.3, 0, 0.05]], [4.9, [0.5, 0.9, 0.2, 0, 2, 0.3, 0, 0.05]], [5.05, [1, 0.1, 0.4, 0, -2, 0.4, 0, 0.1]], [10.9, [1, 0.1, 0.4, 0, -2, 0.4, 0, 0.1]],
  [11.0, [0.5, 0.9, 0.4, 0, 0, 0.3, 0, 0.05]], [11.8, [0.5, 0.9, 0.4, 0, 0, 0.3, 0, 0.05]], [11.95, [0.4, -0.7, 0.6, 0, 2, 0.3, 0, 0]], [12.2, [0.4, -0.7, 0.6, 0, 2, 0.3, 0, 0]],
  [12.35, [0.5, 0.9, 0.2, 0, 2, 0.3, 0, 0.05]], [13.5, [0.5, 0.9, 0.2, 0, 2, 0.3, 0, 0.05]], [13.7, [1, 0.1, 0.5, 0, -2, 0.5, 0, 0.05]], [14.05, [1, 0.1, 0.5, 0, -2, 0.5, 0, 0.05]],
  [14.2, [-0.3, -0.2, 0.9, 0.3, 0, 0.5, 0, 0]], [14.7, [-0.3, -0.2, 0.9, 0.3, 0, 0.5, 0, 0]],
];
const HIM_MOUTH: [number, Mouth][] = [[0, 'flat'], [1.75, 'o'], [2.2, 'flat'], [3.6, 'smirk'], [5.05, 'flat'], [11.0, 'flat'], [13.7, 'smile'], [14.2, 'o']];
const Q0 = [-1, 0.1, 0.4, 0, -3, 0.15, 0, 0.1];
const HER_KEYS: [number, number[]][] = [
  [0, Q0], [3.4, Q0], [3.6, [-0.5, 0.9, 0.2, 0, -2, 0.2, 0, 0.1]], [5.1, [-0.5, 0.9, 0.2, 0, -2, 0.2, 0, 0.1]], [5.3, [-0.7, 0.9, 0.3, 0, -2, 0.3, 0, 0.1]],
  [10.9, [-0.7, 0.9, 0.3, 0, -2, 0.3, 0, 0.1]], [11.0, [-1, 0.3, 0.3, 0, -3, 0.2, 0, 0.1]], [11.8, [-1, 0.3, 0.3, 0, -3, 0.2, 0, 0.1]],
  [12.0, [-0.5, 0.9, 0.2, 0, -2, 0.2, 0, 0.1]], [13.5, [-0.5, 0.9, 0.2, 0, -2, 0.2, 0, 0.1]], [13.7, [-1, 0.1, 0.3, 0, -4, 0.4, 0.1, 0.1]],
  [14.05, [-1, 0.1, 0.4, 1.3, -4, 0.4, 0, 0.05]], [14.2, [-0.4, -0.2, 0.9, 0, -2, 0.4, 0, 0]], [14.7, [-0.4, -0.2, 0.9, 0, -2, 0.4, 0, 0]],
];
const HER_MOUTH: [number, Mouth][] = [[0, 'smirk'], [5.3, 'flat'], [11.0, 'smirk'], [13.7, 'smile'], [14.2, 'o']];
const himPose = (t: number): PersonPose => mkPose(track(HIM_KEYS, t), keyAt(t, HIM_MOUTH), 1 - smooth(t, DOWN0, DOWN1));
const herPose = (t: number): PersonPose => mkPose(track(HER_KEYS, t), keyAt(t, HER_MOUTH), 0, {happy: t >= 13.75 && t < 14.0});

// ------------------------------------------------------------------------------------------ cameras
const A0 = {x: 540, y: 900}, BB = {x: 540, y: 890};
const CAM: CamKey[] = [
  {t: 0, ...A0, z: 1.0}, {t: 3.4, ...A0, z: 1.03},
  {t: 3.4, ...BB, z: 1.16, wob: 0.6, cut: true}, {t: 5.2, ...BB, z: 1.2, wob: 0.6},
  {t: 5.2, ...A0, z: 1.0, cut: true}, {t: 5.4, ...A0, z: 1.01},
  {t: WIPE1, ...A0, z: 1.0, cut: true}, {t: 11.8, ...A0, z: 1.03},
  {t: 11.8, ...BB, z: 1.16, wob: 0.6, cut: true}, {t: 13.55, ...BB, z: 1.2, wob: 0.6},
  {t: 13.55, ...A0, z: 1.0, cut: true}, {t: 14.7, ...A0, z: 1.035},
];

// ------------------------------------------------------------------------------------------ phones and arms
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

// ------------------------------------------------------------------------------------------ the card and the marker
const HAND = (s: number) => `400 ${s}px "Permanent Marker"`;
type LDef = {text: string; y: number; rot: number; col: string; a: number; b: number; size: number};
const L_Q: LDef = {text: spec.cards.back_her_q, y: -2, rot: -1.5, col: GREEN, a: 0, b: 0, size: 62};
const L_H1: LDef = {text: spec.cards.his_1, y: 102, rot: 1.5, col: C.terraDeep, a: B.write1, b: 4.9, size: 58};
const L_H2: LDef = {text: spec.cards.his_2, y: 102, rot: 1.5, col: C.terraDeep, a: B.write2, b: 13.5, size: 62};
const mkLine = (d: LDef, prog: number): Line => {
  const s = fitSize(d.text, HAND, d.size, 640);
  return {text: d.text, x0: -textW(d.text, HAND(s)) / 2, y: d.y, size: s, rot: d.rot, color: d.col, prog};
};
const lineAt = (d: LDef, t: number): Line => mkLine(d, d.b === d.a ? 1 : wp(t, d.a, d.b));
const flipSx = (f: number) => Math.max(0.02, f < 0.5 ? Math.cos(f * Math.PI) : Math.abs(Math.cos(f * Math.PI)));
const mainCard = (t: number) => {
  const sl = t < WIPE1 ? smooth(t, 5.0, 5.5) : smooth(t, 13.55, 13.95);
  return {x: 540 + 60 * sl, y: 1005, s: 1, rot: 3 * sl};
};
const ROW = 1236;
type Held = {x: number; y: number; rot: number; capped: boolean; holder: 'him' | null};
const SEGS = [
  {line: L_H1, pick: 2.0, putTo: 5.2, restB: 400, restA: 470},
  {line: L_H2, pick: 11.9, putTo: 13.6, restB: 470, restA: 480},
];
const markerAt = (t: number): Held => {
  const capped = t < B.uncap;
  let idx = -1;
  SEGS.forEach((s, i) => { if (t >= s.pick) idx = i; });
  if (idx < 0) return {x: 400, y: ROW, rot: -6, capped, holder: null};
  const s = SEGS[idx], cs = mainCard(t);
  const tipAt = (p: number): [number, number] => { const [a, b] = tipOf(mkLine(s.line, p)); return [cs.x + cs.s * a, cs.y + cs.s * b + 4]; };
  const rot = -35, r = rot * Math.PI / 180;
  const place = (tip: [number, number]) => ({x: tip[0] - Math.cos(r) * 76, y: tip[1] - Math.sin(r) * 76});
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
const TableProps: React.FC<{t: number}> = ({t}) => {
  const mc = mainCard(t), m = markerAt(t);
  const capU = clamp((t - B.uncap) / 0.75);
  const capX = lerp(450, 640, capU), capY = ROW - 4 - 320 * Math.sin(capU * Math.PI);
  const push = t < WIPE1 ? wp(t, 4.95, 5.15) * (1 - wp(t, 5.4, 5.6)) : wp(t, 13.5, 13.7) * (1 - wp(t, 13.9, 14.1));
  const lines = [lineAt(L_Q, t), lineAt(t < WIPE1 ? L_H1 : L_H2, t)];
  return <g>
    <g transform={`translate(${mc.x} ${mc.y}) rotate(${mc.rot}) scale(${mc.s})`}><TentCard face="back" lines={lines} scaleX={1} /></g>
    {t >= B.uncap && t < TBL1_END && <g transform={`translate(${capU < 1 ? capX : 640} ${capU < 1 ? capY : ROW + 6}) rotate(${capU < 1 ? capU * 540 : 14})`}><rect x={-31} y={-15} width={62} height={30} rx={13} fill="#3A3140" /></g>}
    {m.holder === null && <Marker x={m.x} y={m.y} rot={m.rot} capped={m.capped} />}
    {m.holder === 'him' && <SleeveHand who="him" x={m.x - 70 * Math.cos(35 * Math.PI / 180) - 40} y={m.y + 52} show={1} />}
    {m.holder !== null && <Marker x={m.x} y={m.y} rot={m.rot} capped={m.capped} />}
    {push > 0 && <SleeveHand who="him" x={mc.x - CARD_W / 2 - 10} y={1090} show={push} />}
  </g>;
};

// ------------------------------------------------------------------------------------------ the best man (glass raised, or cue cards)
const SKIN_BM = '#E6B795';
const BestMan: React.FC<{t: number; x: number; y: number; s: number; cards?: boolean}> = ({t, x, y, s, cards}) => {
  const talk = Math.abs(Math.sin(t * 13)) * (cards ? 1 : 0.6);
  const hair = '#6B5B63';
  const dy = cards ? 22 : 0;
  const fl = (t * 1.8) % 1, flI = Math.floor(t * 1.8);
  return <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -135 460 L -118 170 Q -100 100 0 94 Q 100 100 118 170 L 135 460 Z" fill="#2F4A3E" stroke={INK} strokeWidth={5} />
    <path d="M -46 98 L 46 98 L 0 250 Z" fill="#fff" /><path d="M -22 130 L 22 130 L 14 164 L -14 164 Z" fill={C.marigold} stroke={INK} strokeWidth={3} />
    <circle cx={-76} cy={190} r={13} fill={C.terracotta} />
    <circle cx={0} cy={0} r={82} fill={SKIN_BM} stroke={INK} strokeWidth={5} />
    <path d="M -80 -16 Q -78 -88 0 -90 Q 78 -88 80 -16 Q 50 -60 0 -62 Q -50 -60 -80 -16 Z" fill={hair} />
    {[-1, 1].map((k) => <g key={k}><ellipse cx={k * 32} cy={-4} rx={17} ry={16} fill="#fff" stroke={INK} strokeWidth={3} /><circle cx={k * 32 + (cards ? 0 : 3)} cy={cards ? 8 : 2} r={7} fill={INK} />
      <path d={`M ${k * 32 - 18} -34 Q ${k * 32} -44 ${k * 32 + 18} -32`} fill="none" stroke={hair} strokeWidth={8} strokeLinecap="round" /></g>)}
    <ellipse cx={0} cy={46} rx={15} ry={6 + talk * 12} fill="#4B1A25" />
    {!cards && <g>
      <path d="M -108 190 Q -170 90 -100 -100" fill="none" stroke="#2F4A3E" strokeWidth={44} strokeLinecap="round" />
      <circle cx={-96} cy={-118} r={25} fill={SKIN_BM} stroke={INK} strokeWidth={3} />
      <path d="M -126 -250 L -66 -250 L -74 -158 Q -96 -134 -118 -158 Z" fill="#FFF3CC" stroke={INK} strokeWidth={4} />
      <path d="M -123 -224 L -69 -224 L -75 -162 Q -96 -140 -117 -162 Z" fill={C.marigold} opacity={0.75} />
    </g>}
    {cards && <g transform={`translate(0 ${dy})`}>
      <path d="M -108 190 Q -190 170 -150 110" fill="none" stroke="#2F4A3E" strokeWidth={44} strokeLinecap="round" />
      {/* thick stack of cue cards */}
      {Array.from({length: 16}, (_, i) => <rect key={i} x={-250 + i * 2} y={-10 - i * 3 + 110} width={130} height={170} rx={6} fill={i % 2 ? '#FFFDF6' : '#F1E6CF'} stroke={INK} strokeWidth={3} />)}
      {[0, 1, 2, 3].map((i) => <rect key={i} x={-232} y={86 - 16 * 3 + i * 26 - 4} width={92 - (i % 2) * 24} height={7} rx={3} fill={INK} opacity={0.4} />)}
      {/* the card he just flipped, flying off */}
      <g transform={`translate(${-190 - fl * 120} ${70 - fl * 150 + fl * fl * 220}) rotate(${-fl * 140 + (flI % 2) * 30})`} opacity={1 - fl * fl}>
        <rect x={-65} y={-85} width={130} height={170} rx={6} fill="#FFFDF6" stroke={INK} strokeWidth={3} />
        <rect x={-48} y={-50} width={90} height={7} rx={3} fill={INK} opacity={0.4} /><rect x={-48} y={-26} width={70} height={7} rx={3} fill={INK} opacity={0.4} />
      </g>
      <circle cx={-150} cy={112} r={22} fill={SKIN_BM} stroke={INK} strokeWidth={3} />
    </g>}
    <rect x={56} y={44} width={8} height={420} fill="#26202B" />
    <g transform="translate(60 30) rotate(-24)"><rect x={-13} y={-16} width={26} height={46} rx={13} fill="#26202B" /><circle cx={0} cy={-22} r={17} fill="#8E8A9C" stroke={INK} strokeWidth={3} /></g>
  </g>;
};

const Dust: React.FC<{t: number}> = ({t}) => {
  const a = t - DOWN1;
  if (a < 0 || a > 0.45) return null;
  const k = a / 0.45;
  return <g opacity={1 - k} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round">
    <ellipse cx={140} cy={1216} rx={90 + k * 80} ry={22 + k * 20} />
    {[-1, 1].map((s) => <path key={s} d={`M ${140 + s * (120 + k * 70)} ${1190 - k * 20} l ${s * 26} -18`} />)}
  </g>;
};

// ------------------------------------------------------------------------------------------ shot: the table (wide / close-ups)
const TableScene: React.FC<{t: number}> = ({t}) => {
  const cam = camAt(CAM, t);
  const duck = smooth(t, B.duck, B.duck + 0.45) * 760;
  return <g>
    <g transform={planeT(cam, 0.2)}><Wall t={t} /></g>
    <g transform={planeT(cam, 0.3)}><Extras /></g>
    <g transform={planeT(cam, 0.6)}><BestMan t={t} x={540} y={640} s={0.74} /></g>
    <g transform={planeT(cam, 0.85)}><Centerpiece t={t} /></g>
    <g transform={planeT(cam, 0.92)}>
      <Person who="him" x={HIM.x} y={HIM.y + duck} t={t} pose={himPose(t)} seed={0.4} />
      <Person who="her" x={HER.x} y={HER.y + duck} t={t} pose={herPose(t)} seed={1.9} />
    </g>
    <g transform={planeT(cam, 1.0)}>
      <Table t={t} dessert={false} />
      {duck < 200 && <><Arm who="him" t={t} /><Arm who="her" t={t} /></>}
      <TableProps t={t} />
      <Dust t={t} />
    </g>
    <g transform={planeT(cam, 1.04)}><PhoneUnit who="him" t={t} /><PhoneUnit who="her" t={t} /></g>
    <g transform={planeT(cam, 1.7)}><NearPlane t={t} /></g>
  </g>;
};

// ------------------------------------------------------------------------------------------ shot: the speech goes on (5.4-8.8, 9.7-11.0)
const WS = 0.7, WH = {x: 255, y: 985}, WR = {x: 825, y: 985};
const HIM_W: [number, number[]][] = [
  [5.4, [0.6, -0.2, 0.3, 0, 0, 0.3, 0, 0.05]], [7.0, [0.6, -0.2, 0.2, 0, 1, 0.3, 0, 0.3]], [7.9, [0.6, -0.2, 0.2, 0, 1, 0.3, 0, 0.4]],
  [8.1, [0.9, 0, 0.9, 0, 0, 0.3, 0, 0]], [8.8, [-1, 0.2, 0.9, 0, -3, 0.5, 0, 0]], [9.7, [-1, 0.2, 0.7, 0, -3, 0.5, 0, 0]], [10.1, [0.9, 0.1, 0.1, 0, -5, 0.4, 0, 0.35]], [11.0, [0.9, 0.1, 0.1, 0, -5, 0.4, 0, 0.35]],
];
const HER_W: [number, number[]][] = [
  [5.4, [-0.3, -0.2, 0.2, 0, 0, 0.2, 0, 0.15]], [6.2, [-0.3, -0.2, 0.1, 0, 5, 0.2, 0, 0.35]], [6.9, [-0.3, -0.2, 0.1, 0, 5, 0.2, 0, 0.35]],
  [7.15, [0.9, 0, 0.9, 0, 3, 0.2, 0, 0]], [8.0, [0, 0, 0.9, 0, 2, 0.2, 0, 0]], [8.8, [-1, 0.1, 0.8, 0, -3, 0.2, 0, 0]], [9.7, [-1, 0.1, 0.6, 0, -3, 0.2, 0, 0]],
  [10.0, [-1, 0.1, 1.0, 0.4, 6, 0.3, 0, 0]], [11.0, [-1, 0.1, 1.0, 0.4, 6, 0.3, 0, 0]],
];
const HIM_WM: [number, Mouth][] = [[5.4, 'flat'], [8.1, 'o'], [9.7, 'flat']];
const HER_WM: [number, Mouth][] = [[5.4, 'flat'], [7.15, 'o'], [9.0, 'flat']];
const Candle: React.FC<{x: number; base: number; h: number; t: number; seed: number}> = ({x, base, h, t, seed}) => {
  const f = clamp(h / 150);
  return <g>
    <ellipse cx={x} cy={base} rx={28 + (1 - f) * 34} ry={9 + (1 - f) * 6} fill="#F1E6CF" stroke="#CDB985" strokeWidth={3} />
    <rect x={x - 13} y={base - h} width={26} height={h} rx={5} fill="#FFFDF6" stroke="#CDB985" strokeWidth={3} />
    <path d={`M ${x - 13} ${base - h + 6} q 6 ${26 * f + 8} 12 0 q 4 ${16 * f + 6} 8 0`} fill="#F1E6CF" />
    <ellipse cx={x} cy={base - h - 16 + Math.sin(t * 9 + seed) * 1.5} rx={(8 + 5 * f) + Math.sin(t * 11 + seed) * 1} ry={14 + 12 * f} fill={C.marigold} />
    <ellipse cx={x} cy={base - h - 10} rx={4 + 2 * f} ry={7 + 5 * f} fill="#FFF3CC" />
  </g>;
};
const BabySlide: React.FC<{i: number}> = ({i}) => {
  const cols = ['#F6D6C8', '#CFE3D6', '#F7E3A6', '#D9D2EE', '#F3C9A9'];
  return <g>
    <rect x={-180} y={-120} width={360} height={240} fill={cols[i % 5]} />
    <ellipse cx={0} cy={118} rx={110} ry={70} fill={['#fff', C.eucalyptus, C.terracotta, C.marigold, C.sage][i % 5]} />
    <circle cx={0} cy={10} r={78} fill="#F2C7A3" stroke={INK} strokeWidth={4} />
    <path d="M -10 -66 Q 0 -100 24 -78" fill="none" stroke={C.hairHim} strokeWidth={9} strokeLinecap="round" />
    <circle cx={-28} cy={6} r={7} fill={INK} /><circle cx={28} cy={6} r={7} fill={INK} />
    <circle cx={-48} cy={28} r={14} fill={C.pink} opacity={0.6} /><circle cx={48} cy={28} r={14} fill={C.pink} opacity={0.6} />
    <path d="M -16 38 Q 0 54 16 38" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
    {i % 5 === 0 && <path d="M -78 -4 Q -80 -86 0 -90 Q 80 -86 78 -4 Q 40 -50 0 -50 Q -40 -50 -78 -4 Z" fill={C.terracotta} />}
    {i % 5 === 1 && <g><rect x={90} y={30} width={34} height={80} rx={12} fill="#fff" stroke={INK} strokeWidth={4} /><rect x={90} y={22} width={34} height={20} rx={8} fill={C.marigold} /></g>}
    {i % 5 === 3 && <ellipse cx={-110} cy={80} rx={34} ry={26} fill={C.marigold} stroke={INK} strokeWidth={4} />}
    {i % 5 === 4 && <g><path d="M 110 -70 L 110 40" stroke={INK} strokeWidth={4} /><ellipse cx={110} cy={-90} rx={30} ry={38} fill={C.terracotta} stroke={INK} strokeWidth={4} /></g>}
  </g>;
};
const Screen: React.FC<{t: number}> = ({t}) => {
  const p = Math.max(0, (t - B.wait) / 0.9), i = Math.floor(p), ph = p - i;
  const off = (1 - smooth(ph, 0, 0.18)) * 380;
  return <g>
    <SoftRect x={30} y={450} w={400} h={290} r={20} />
    <rect x={30} y={450} width={400} height={290} rx={20} fill="#26202B" />
    <clipPath id="scr"><rect x={46} y={466} width={368} height={258} rx={10} /></clipPath>
    <g clipPath="url(#scr)">
      <rect x={46} y={466} width={368} height={258} fill="#fff" />
      <g transform={`translate(${230 - off} 595)`}><BabySlide i={i} /></g>
      {off > 1 && <g transform={`translate(${230 - off - 380} 595)`}><BabySlide i={i - 1} /></g>}
    </g>
  </g>;
};
const Clock: React.FC<{t: number}> = ({t}) => <g transform="translate(925 590)">
  <SoftEllipse x={0} y={14} w={210} h={200} op={0.3} />
  <circle r={96} fill="#FFFDF6" stroke={INK} strokeWidth={8} />
  {Array.from({length: 12}, (_, i) => <rect key={i} x={-4} y={-86} width={8} height={i % 3 ? 14 : 24} rx={3} fill={INK} transform={`rotate(${i * 30})`} />)}
  <rect x={-6} y={-58} width={12} height={62} rx={5} fill={INK} transform={`rotate(${t * 40})`} />
  <rect x={-4} y={-82} width={8} height={90} rx={4} fill={C.terraDeep} transform={`rotate(${t * 520})`} />
  <circle r={10} fill={INK} />
</g>;
const Cart: React.FC<{x: number; t: number}> = ({x, t}) => {
  const b = 1096 + Math.sin(t * 14) * 2;
  return <g transform={`translate(${x} 1096) scale(1.4) translate(0 -1096)`}>
    <rect x={-190} y={b - 22} width={380} height={22} rx={8} fill="#8E8A9C" stroke={INK} strokeWidth={4} />
    <rect x={-150} y={b - 118} width={300} height={96} rx={10} fill="#FFFDF6" stroke={INK} strokeWidth={5} />
    <rect x={-104} y={b - 214} width={208} height={96} rx={10} fill="#F6E7C4" stroke={INK} strokeWidth={5} />
    <rect x={-58} y={b - 300} width={116} height={86} rx={10} fill="#FFFDF6" stroke={INK} strokeWidth={5} />
    {[-150, -104, -58].map((_, i) => <rect key={i} x={[-150, -104, -58][i]} y={b - [76, 172, 258][i]} width={[300, 208, 116][i]} height={14} fill={C.terracotta} />)}
    {[-100, -40, 20, 80].map((dx, i) => <circle key={i} cx={dx} cy={b - 100} r={9} fill={C.marigold} />)}
    <path d={`M 0 ${b - 312} q -26 -34 -2 -46 q 14 -4 2 14 q 16 -18 2 -14 q 24 12 -2 46 z`} fill={C.terracotta} stroke={INK} strokeWidth={3} />
    {[-130, 130].map((dx, i) => <circle key={i} cx={dx} cy={b + 6} r={20} fill="#26202B" />)}
  </g>;
};
const Shrug: React.FC<{t: number}> = ({t}) => {
  const k = smooth(t, 10.0, 10.25);
  if (k <= 0) return null;
  const up = k * (1 + 0.05 * Math.sin((t - 10) * 10));
  return <g>
    {[-1, 1].map((s) => <g key={s}>
      <path d={`M ${WR.x + s * 120} 1150 Q ${WR.x + s * 190} ${1150 - 40 * up} ${WR.x + s * 200} ${1150 - 110 * up}`} fill="none" stroke={C.eucDeep} strokeWidth={54} strokeLinecap="round" />
      <Hand x={WR.x + s * 202} y={1150 - 140 * up} rot={s * 22} flip={s > 0} skin={C.skinHer} />
    </g>)}
  </g>;
};
const WaitScene: React.FC<{t: number}> = ({t}) => {
  const cartX = lerp(1320, -340, wp(t, B.cartIn, B.cartOut));
  const candleH = (a: number) => lerp(150, 22, wp(t, B.wait, 11.0)) * a;
  const chin = smooth(t, 6.0, 6.7) * (1 - smooth(t, 9.95, 10.15));
  const him = mkPose(track(HIM_W, t), keyAt(t, HIM_WM), 0, {});
  const shr = smooth(t, 10.0, 10.25);
  const her = mkPose(track(HER_W, t), keyAt(t, HER_WM), 0, {});
  const nod = Math.sin(t * 2.2) * 1.5;
  return <g>
    <Wall t={t} />
    <Screen t={t} />
    <Clock t={t} />
    <BestMan t={t} x={560} y={560} s={0.92} cards />
    <Cart x={cartX} t={t} />
    <PP who="him" x={WH.x} y={WH.y + nod * 2} s={WS} t={t} pose={him} seed={0.4} />
    <PP who="her" x={WR.x} y={WR.y - 16 * shr} s={WS} t={t} pose={her} seed={1.9} />
    <Table t={t} dessert={false} />
    <Candle x={350} base={1212} h={candleH(1)} t={t} seed={0} />
    <Candle x={745} base={1212} h={candleH(0.93)} t={t} seed={2} />
    {chin > 0 && <g transform={`translate(0 ${(1 - chin) * 160})`} opacity={clamp(chin * 4)}>
      <path d="M 1030 1290 Q 990 1180 920 1100" fill="none" stroke={C.eucDeep} strokeWidth={62} strokeLinecap="round" />
      <Hand x={905} y={1070} rot={-8} flip skin={C.skinHer} />
    </g>}
    <Shrug t={t} />
    <g transform={`translate(0 0)`}><rect x={-60} y={1250} width={1200} height={4} fill="none" /></g>
  </g>;
};

// ------------------------------------------------------------------------------------------ shot: the empty cake stand (8.8-9.7)
const StandScene: React.FC<{t: number}> = ({t}) => {
  const z = 1.25 + 0.06 * wp(t, B.stand, B.shrug);
  return <g transform={`translate(540 800) scale(${z}) translate(-540 -760)`}>
    <Wall t={t} />
    <rect x={-60} y={940} width={1200} height={500} fill={C.cloth} />
    <rect x={-60} y={934} width={1200} height={14} fill={C.champagne} />
    <path d="M -60 1250 Q 540 1290 1140 1250 L 1140 1320 L -60 1320 Z" fill={C.eucalyptus} opacity={0.5} />
    <SoftEllipse x={540} y={960} w={700} h={60} op={0.3} />
    <ellipse cx={540} cy={938} rx={170} ry={26} fill="#E9D9B0" stroke="#CDB985" strokeWidth={5} />
    <rect x={522} y={730} width={36} height={208} fill="#F4EAD0" stroke="#CDB985" strokeWidth={5} />
    <ellipse cx={540} cy={730} rx={330} ry={56} fill="#FFFDF6" stroke="#CDB985" strokeWidth={6} />
    <ellipse cx={540} cy={724} rx={290} ry={40} fill="#FBF3E0" />
    {/* what is left: smear, crumbs, a knife, a heart topper */}
    <path d="M 380 730 Q 430 700 500 722 Q 560 740 620 716 Q 680 704 700 730 Q 640 748 560 746 Q 450 752 380 730 Z" fill="#F6E7C4" />
    {[[420, 716], [470, 738], [530, 708], [600, 740], [640, 712], [690, 726], [350, 726], [570, 726]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={5 + (i % 3) * 2} fill="#EBCB8B" />)}
    <g transform="translate(470 752) rotate(-8)"><rect x={-110} y={-6} width={190} height={12} rx={5} fill="#D8D4DC" stroke={INK} strokeWidth={3} /><rect x={80} y={-9} width={60} height={18} rx={7} fill="#26202B" /></g>
    <path d="M 640 714 q -22 -30 -2 -40 q 12 -4 2 12 q 16 -16 2 -12 q 22 10 -2 40 z" fill={C.terracotta} stroke={INK} strokeWidth={3} transform="translate(0 6)" />
  </g>;
};

// ------------------------------------------------------------------------------------------ shot: crouch-walk behind the guests (14.7-16.2)
const BackGuest: React.FC<{x: number; y: number; r: number; col: string; hair: string}> = ({x, y, r, col, hair}) => <g transform={`translate(${x} ${y})`}>
  <path d={`M ${-r * 1.5} ${r * 2.4} Q ${-r * 1.5} ${r * 0.9} 0 ${r * 0.85} Q ${r * 1.5} ${r * 0.9} ${r * 1.5} ${r * 2.4} Z`} fill={col} stroke={INK} strokeWidth={3} />
  <circle r={r} fill={hair} stroke={INK} strokeWidth={3} />
  <ellipse cx={-r} cy={r * 0.1} rx={r * 0.2} ry={r * 0.26} fill={SKIN_BM} /><ellipse cx={r} cy={r * 0.1} rx={r * 0.2} ry={r * 0.26} fill={SKIN_BM} />
</g>;
const Cloth: React.FC<{x: number; w: number; top: number}> = ({x, w, top}) => <g>
  <SoftEllipse x={x} y={top + 40} w={w + 40} h={40} op={0.25} />
  <path d={`M ${x - w / 2} ${top} L ${x + w / 2} ${top} L ${x + w / 2 + 14} ${top + 300} Q ${x} ${top + 330} ${x - w / 2 - 14} ${top + 300} Z`} fill={C.cloth} stroke={C.champagne} strokeWidth={5} />
  <ellipse cx={x} cy={top} rx={w / 2} ry={30} fill="#FFFFFF" stroke={C.champagne} strokeWidth={5} />
  <path d={`M ${x - w / 2 + 10} ${top + 110} Q ${x} ${top + 140} ${x + w / 2 - 10} ${top + 110}`} fill="none" stroke={C.champagne} strokeWidth={4} opacity={0.8} />
</g>;
const GUEST_COLS = [C.terracotta, C.eucalyptus, C.marigold, C.sage, '#4A2A52', C.terracotta, C.eucalyptus];
const SneakScene: React.FC<{t: number}> = ({t}) => {
  const k = wp(t, B.sneak, B.cake);
  const herX = lerp(760, -170, k), himX = herX + 310;
  const bob = (ph: number) => Math.abs(Math.sin(t * 9 + ph)) * 16;
  const hp = mkPose([-0.3 + Math.sin(t * 7) * 0.6, -0.9, 1, 0, -3, 0.4, 0, 0], 'o', 0);
  const rp = mkPose([-1 + Math.sin(t * 6) * 0.3, -0.5, 0.6, 0.6, 4, 0.4, 0, 0], 'smirk', 0, {sweat: 0.35});
  const talk = [[70, 'A'], [250, 'B'], [470, 'C'], [640, 'D'], [840, 'E'], [1010, 'F']] as const;
  return <g>
    <Wall t={t} />
    <BestMan t={t} x={540} y={640} s={0.5} cards />
    <g filter="url(#blur6)" opacity={0.85}>
      {[0, 1, 2, 3, 4, 5, 6].map((i) => <BackGuest key={i} x={i * 170 - 20} y={820} r={46} col={GUEST_COLS[(i + 2) % 7]} hair={i % 2 ? C.hairHer : C.hairHim} />)}
    </g>
    {talk.map(([x], i) => <BackGuest key={i} x={x} y={930} r={78} col={GUEST_COLS[i]} hair={i % 3 === 1 ? '#6B5B63' : i % 2 ? C.hairHer : C.hairHim} />)}
    <PP who="her" x={herX} y={1000 - bob(0)} s={0.5} t={t} pose={rp} seed={1.9} />
    <PP who="him" x={himX} y={1000 - bob(1.2)} s={0.5} t={t} pose={hp} seed={0.4} />
    <Cloth x={150} w={330} top={1050} /><Cloth x={540} w={330} top={1050} /><Cloth x={930} w={330} top={1050} />
  </g>;
};

// ------------------------------------------------------------------------------------------ shot: the cake table and the side door (16.2-17.3)
const Fork: React.FC<{x: number; y: number; rot: number}> = ({x, y, rot}) => <g transform={`translate(${x} ${y}) rotate(${rot})`}>
  <rect x={-5} y={-10} width={10} height={110} rx={5} fill="#D8D4DC" stroke={INK} strokeWidth={3} />
  {[-10, 0, 10].map((d) => <rect key={d} x={d - 3} y={-52} width={6} height={46} rx={3} fill="#D8D4DC" stroke={INK} strokeWidth={2} />)}
</g>;
const CakeScene: React.FC<{t: number}> = ({t}) => {
  const door = smooth(t, B.door, B.door + 0.25);
  const lift1 = smooth(t, 16.3, 16.6), lift2 = smooth(t, 16.45, 16.75);
  const slide = smooth(t, 16.95, 17.3);
  const peek = (who: 'him' | 'her') => mkPose([who === 'her' ? 0.8 : 0.8, 0.2, 0.8, 0, 0, 0.4, 0, 0], who === 'her' ? 'smirk' : 'o', 0);
  return <g>
    <Wall t={t} />
    {/* side door, right */}
    <g>
      <rect x={780} y={330} width={300} height={700} fill="#3B2A4A" stroke={C.eucDeep} strokeWidth={14} />
      <rect x={796} y={346} width={268} height={684} fill="#4B3566" />
      {[0, 1, 2].map((i) => <circle key={i} cx={850 + i * 90} cy={420 + Math.sin(i * 2) * 20} r={22} fill="url(#bokeh)" />)}
      <ellipse cx={930} cy={720} rx={60 + door * 150} ry={260} fill="#FFD98A" opacity={0.3 + door * 0.55} />
      <path d={`M 780 330 L ${780 + 150 - door * 120} 360 L ${780 + 150 - door * 120} 1000 L 780 1030 Z`} fill="#A98C6A" stroke={C.eucDeep} strokeWidth={8} opacity={door} />
    </g>
    <PP who="her" x={lerp(170, 1010, slide)} y={1012 - 30 * slide} s={0.5} t={t} pose={peek('her')} seed={1.9} />
    <PP who="him" x={lerp(410, 1130, slide)} y={1018 - 30 * slide} s={0.5} t={t} pose={peek('him')} seed={0.4} />
    <rect x={-60} y={1060} width={1200} height={420} fill={C.cloth} />
    <rect x={-60} y={1054} width={1200} height={14} fill={C.champagne} />
    <path d="M -60 1280 Q 540 1320 1140 1280 L 1140 1360 L -60 1360 Z" fill={C.eucalyptus} opacity={0.5} />
    {/* the cake, one wedge already gone */}
    <g transform="translate(600 0)">
      <SoftEllipse x={0} y={1062} w={520} h={50} op={0.3} />
      <rect x={-210} y={940} width={420} height={120} rx={12} fill="#FFFDF6" stroke={INK} strokeWidth={5} /><rect x={-210} y={992} width={420} height={16} fill={C.terracotta} />
      <rect x={-150} y={830} width={300} height={110} rx={12} fill="#F6E7C4" stroke={INK} strokeWidth={5} /><rect x={-150} y={880} width={300} height={14} fill={C.marigold} />
      <rect x={-90} y={730} width={180} height={100} rx={12} fill="#FFFDF6" stroke={INK} strokeWidth={5} />
      <path d="M 0 722 q -26 -34 -2 -46 q 14 -4 2 14 q 16 -18 2 -14 q 24 12 -2 46 z" fill={C.terracotta} stroke={INK} strokeWidth={3} />
      <path d="M 60 940 L 210 940 L 210 1060 L 130 1060 Z" fill="#F4D9A8" opacity={0.0} />
    </g>
    {/* glass of forks */}
    <g transform="translate(270 0)">
      <Fork x={-12 - 28 * lift1} y={900 - 90 * lift1} rot={-8 - 8 * lift1} />
      <Fork x={14 + 28 * lift2} y={900 - 90 * lift2} rot={8 + 8 * lift2} />
      <Fork x={0} y={904} rot={0} />
      <path d="M -44 930 L 44 930 L 36 1056 Q 0 1070 -36 1056 Z" fill="#E4F0E8" opacity={0.85} stroke={INK} strokeWidth={4} />
      {[[-12 - 28 * lift1, lift1, C.skinHer, C.eucDeep], [14 + 28 * lift2, lift2, C.skinHim, '#4A2A52']].map(([dx, l, sk, sl], i) => (l as number) > 0.01 && <g key={i}>
        <path d={`M ${(dx as number) + (i ? 70 : -70)} 1130 L ${dx} ${960 - 90 * (l as number)}`} stroke={sl as string} strokeWidth={52} strokeLinecap="round" />
        <Hand x={dx as number} y={970 - 90 * (l as number)} rot={0} skin={sk as string} />
      </g>)}
    </g>
  </g>;
};

// ------------------------------------------------------------------------------------------ shot: the terrace (17.3-19.9)
const TerraceScene: React.FC<{t: number}> = ({t}) => {
  const wr = wp(t, B.napkin, 19.2);
  const text = spec.cards.napkin;
  const fs = fitSize(text, HAND, 56, 470);
  const buzzOn = t > B.buzz && t < 19.4;
  const bz = buzzOn ? Math.sin(t * 150) * 3 : 0;
  const him = mkPose([1, 0.25, 0.2, 0, -2, 0.5, 0, 0.05], 'smile', 0.5);
  const lookDown = smooth(t, 17.5, 17.9) * (1 - smooth(t, 19.15, 19.35));
  const her = mkPose([-1 + lookDown * 0.9, 0.1 + lookDown * 0.7, 0.2, 0, -3, 0.5, 0, 0.05], 'smile', 0.5, {happy: t > 19.4});
  const nx = 540, ny = 905;
  const tipX = nx - textW(text, HAND(fs)) / 2 + textW(text.slice(0, Math.round(text.length * wr)), HAND(fs));
  return <g>
    <defs><linearGradient id="dusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2F1D3F" /><stop offset="0.6" stopColor="#6B3F5C" /><stop offset="1" stopColor="#B26A5C" /></linearGradient></defs>
    <rect x={-100} y={-100} width={1280} height={2100} fill="url(#dusk)" />
    <circle cx={880} cy={430} r={52} fill="#FFF3CC" opacity={0.9} /><circle cx={904} cy={416} r={46} fill="#2F1D3F" opacity={0.0} />
    <path d="M -60 1000 Q 120 880 300 960 Q 520 860 760 950 Q 940 880 1140 980 L 1140 1200 L -60 1200 Z" fill="#2A3A3A" opacity={0.85} />
    <path d="M -20 330 Q 270 440 540 370 T 1100 330" fill="none" stroke="#FFE9AE" strokeWidth={3} opacity={0.5} />
    {Array.from({length: 13}, (_, i) => {
      const x = i * 85 - 10, y = 345 + Math.sin(i / 12 * Math.PI) * 52 + (i % 2) * 6;
      return <g key={i}><circle cx={x} cy={y + 12} r={40} fill="url(#bokeh)" opacity={0.75 + 0.25 * Math.sin(t * 1.3 + i)} /><circle cx={x} cy={y + 12} r={7} fill="#FFF1C2" /></g>;
    })}
    <ellipse cx={540} cy={780} rx={480} ry={380} fill="url(#glow)" opacity={0.25} />
    <PP who="him" x={300} y={690} s={0.8} t={t} pose={him} seed={0.4} />
    <PP who="her" x={780} y={690} s={0.8} t={t} pose={her} seed={1.9} />
    {/* his jacket pocket: phone buzzing, unread */}
    <g transform={`translate(${186 + bz} 990)`}>
      <rect x={-34} y={-30} width={68} height={50} rx={8} fill="#3A2042" stroke={INK} strokeWidth={3} />
      {buzzOn && <g><rect x={-18} y={-58} width={36} height={40} rx={7} fill="#FFE9AE" stroke={INK} strokeWidth={3} /><rect x={-12} y={-52} width={24} height={26} rx={4} fill="#FFFBEF" />
        <g stroke="#FFE9AE" strokeWidth={5} strokeLinecap="round">{[-1, 1].map((s) => <path key={s} d={`M ${s * 40} -50 l ${s * 14} -8 M ${s * 46} -34 l ${s * 16} 0 M ${s * 40} -18 l ${s * 14} 8`} />)}</g></g>}
      <path d="M -34 -30 L 34 -30 L 34 -14 L -34 -14 Z" fill="#4A2A52" stroke={INK} strokeWidth={3} />
    </g>
    {/* balustrade */}
    <rect x={-60} y={1130} width={1200} height={64} rx={14} fill="#E9D9B0" stroke="#CDB985" strokeWidth={5} />
    <rect x={-60} y={1124} width={1200} height={14} rx={7} fill="#F6EAC8" />
    {Array.from({length: 9}, (_, i) => <path key={i} d={`M ${i * 135 - 10} 1194 q 24 20 8 60 q -24 24 8 70 L ${i * 135 + 56} 1324 q 24 -46 -8 -70 q 16 -40 8 -60 Z`} fill="#D9C79B" stroke="#CDB985" strokeWidth={3} />)}
    {/* napkin, the one plate, one slice, two forks */}
    <SoftEllipse x={540} y={1190} w={440} h={40} op={0.35} />
    <ellipse cx={540} cy={1140} rx={200} ry={30} fill="#FFFDF6" stroke="#CDB985" strokeWidth={5} />
    <g transform="translate(0 4) translate(540 1130) scale(1.25) translate(-540 -1130)"><path d="M 480 1130 L 600 1112 L 600 1070 L 480 1088 Z" fill="#F6E7C4" stroke="#CDB985" strokeWidth={3} /><path d="M 480 1088 L 600 1070 L 574 1052 L 458 1072 Z" fill={C.terracotta} /><circle cx={560} cy={1048} r={9} fill="#B2472A" /></g>
    <g transform="translate(440 1100) rotate(-70)"><rect x={-4} y={-10} width={8} height={70} rx={4} fill="#D8D4DC" stroke={INK} strokeWidth={2} />{[-7, 0, 7].map((d) => <rect key={d} x={d - 2} y={-36} width={4} height={28} rx={2} fill="#D8D4DC" />)}</g>
    <g transform="translate(660 1104) rotate(70)"><rect x={-4} y={-10} width={8} height={70} rx={4} fill="#D8D4DC" stroke={INK} strokeWidth={2} />{[-7, 0, 7].map((d) => <rect key={d} x={d - 2} y={-36} width={4} height={28} rx={2} fill="#D8D4DC" />)}</g>
    <g transform={`translate(${nx} ${ny}) rotate(-3)`} opacity={smooth(t, 17.7, 17.95)}>
      <SoftRect x={-270} y={-120} w={540} h={240} r={10} dx={10} dy={16} op={0.35} />
      <rect x={-270} y={-120} width={540} height={240} rx={10} fill="#FFFDF6" stroke="#CDB985" strokeWidth={5} />
      <path d="M -270 -120 L -215 -120 L -270 -66 Z" fill="#F1E6CF" />
      {Array.from({length: 11}, (_, i) => <circle key={i} cx={-240 + i * 48} cy={-120} r={9} fill="#FFFDF6" stroke="#CDB985" strokeWidth={3} />)}
      <path d="M -250 88 Q 0 102 250 88" fill="none" stroke={C.eucalyptus} strokeWidth={4} opacity={0.5} />
      <text x={-textW(text, HAND(fs)) / 2} y={14} fontFamily={MARK} fontSize={fs} fill={GREEN}>{text.slice(0, Math.round(text.length * wr))}</text>
    </g>
    {wr > 0 && wr < 1 && <g>
      <Marker x={tipX + 30} y={ny + 5 - 20} rot={-35} capped={false} />
      <path d={`M 1130 1500 Q ${tipX + 280} ${1250} ${tipX + 120} ${ny + 60}`} fill="none" stroke={C.eucDeep} strokeWidth={70} strokeLinecap="round" />
      <Hand x={tipX + 100} y={ny + 50} rot={50} flip skin={C.skinHer} />
    </g>}
  </g>;
};

// ------------------------------------------------------------------------------------------ shot: the cliff (19.9-22.4)
const Aunt: React.FC<{x: number; y: number; t: number}> = ({x, y, t}) => {
  const bob = Math.abs(Math.sin(t * 8)) * 8;
  return <g transform={`translate(${x} ${y - bob})`}>
    <path d="M -110 460 L -96 150 Q -80 84 0 78 Q 80 84 96 150 L 110 460 Z" fill="#9C86B8" stroke={INK} strokeWidth={5} />
    <path d="M -50 90 Q 0 130 50 90" fill="none" stroke="#FFFDF6" strokeWidth={9} strokeDasharray="2 14" strokeLinecap="round" />
    <circle cx={-16} cy={-6} r={70} fill={SKIN_BM} stroke={INK} strokeWidth={5} />
    <path d="M 52 -4 q 22 10 4 24" fill={SKIN_BM} stroke={INK} strokeWidth={4} />
    <circle cx={26} cy={-14} r={8} fill={INK} /><path d="M 10 -36 Q 30 -48 50 -36" fill="none" stroke="#8C8394" strokeWidth={7} strokeLinecap="round" />
    <path d="M 14 32 Q 34 40 46 30" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
    <path d="M -86 -10 Q -80 -78 -10 -80 Q 40 -76 50 -40 Q 0 -60 -40 -30 Z" fill="#9A8F9C" /><circle cx={-82} cy={-56} r={34} fill="#9A8F9C" />
    {/* clipboard */}
    <g transform="translate(46 190) rotate(-8)">
      <rect x={-56} y={-72} width={112} height={150} rx={8} fill="#8B5E3C" stroke={INK} strokeWidth={4} />
      <rect x={-46} y={-56} width={92} height={126} fill="#FFFDF6" /><rect x={-24} y={-80} width={48} height={20} rx={6} fill="#8E8A9C" stroke={INK} strokeWidth={3} />
      {[-30, -8, 14, 36].map((yy) => <rect key={yy} x={-36} y={yy} width={72} height={6} rx={3} fill={INK} opacity={0.4} />)}
      <circle cx={-6} cy={96} r={26} fill={SKIN_BM} stroke={INK} strokeWidth={3} />
    </g>
  </g>;
};
const NewCard: React.FC<{t: number}> = ({t}) => {
  const a = t - B.cliff;
  const pop = a < 0 ? 0 : 1 + 0.12 * Math.max(0, 1 - a / 0.3);
  const ps = fitSize(spec.cards.new_print, (s) => `italic 700 ${s}px "Gelasio"`, 108, 340);
  const sm = fitSize(spec.cards.new_small, (s) => `italic 700 ${s}px "Gelasio"`, 46, 600);
  return <g transform={`translate(660 1020) scale(${0.96 * pop})`}>
    <rect x={-CARD_W / 2 + 16} y={-145 + 18} width={CARD_W} height={290} rx={18} fill={INK} opacity={0.88} />
    <rect x={-CARD_W / 2} y={-145} width={CARD_W} height={290} rx={18} fill="#FFFDF6" stroke={INK} strokeWidth={6} />
    <rect x={-CARD_W / 2 + 3} y={-142} width={CARD_W - 6} height={34} rx={15} fill={C.champagne} />
    <text x={-130} y={20} textAnchor="middle" fontFamily={GEL} fontStyle="italic" fontWeight={700} fontSize={ps} fill={INK} letterSpacing={2}>{spec.cards.new_print}</text>
    <g transform="translate(200 -10)"><path d="M -50 0 L 50 0 M 12 -42 L 62 0 L 12 42" fill="none" stroke={C.terraDeep} strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" /></g>
    <text x={0} y={102} textAnchor="middle" fontFamily={GEL} fontStyle="italic" fontWeight={700} fontSize={sm} fill={C.eucDeep}>{spec.cards.new_small}</text>
  </g>;
};
const HIM_C: [number, number[]][] = [[19.9, [1, 0.1, 0.3, 0, -2, 0.5, 0, 0.05]], [20.45, [1, 0.1, 0.3, 0, -2, 0.5, 0, 0.05]], [20.7, [0.3, 0.9, 0.9, 0, 0, 0.5, 0, 0]], [22.4, [0.3, 0.9, 0.9, 0, 0, 0.6, 0, 0]]];
const HER_C: [number, number[]][] = [[19.9, [-1, 0.1, 0.3, 0, -3, 0.5, 0, 0.05]], [20.4, [-1, 0.1, 0.3, 0, -3, 0.5, 0, 0.05]], [20.65, [0.3, 0.9, 0.6, 0, 0, 0.3, 0, 0]], [21.1, [0.3, 0.9, 0.6, 0, 0, 0.3, 0, 0]], [21.4, [1, 0, 0.9, 0, 3, 0.3, 0, 0]], [22.4, [1, 0, 0.9, 0, 3, 0.3, 0, 0]]];
const CliffScene: React.FC<{t: number}> = ({t}) => {
  const g = Math.sin(clamp((t - 21.0) / 0.45) * Math.PI);
  const him = mkPose(track(HIM_C, t), t < 20.65 ? 'smile' : t < 21.0 ? 'o' : 'gulp', 0, {gulp: t >= 21.0 && t < 21.45 ? g : 0, sweat: t >= 20.9 ? clamp((t - 20.9) / 0.9) : 0});
  const her = mkPose(track(HER_C, t), t < 20.65 ? 'smile' : t < 21.4 ? 'flat' : 'o', 0);
  const ax = lerp(560, 1330, smooth(t, 20.0, 22.2));
  return <g>
    <Wall t={t} />
    <Aunt x={ax} y={470} t={t} />
    <PP who="him" x={250} y={780} s={0.8} t={t} pose={him} seed={0.4} />
    <PP who="her" x={830} y={780} s={0.8} t={t} pose={her} seed={1.9} />
    <Table t={t} dessert={false} />
    <NewCard t={t} />
  </g>;
};

// ------------------------------------------------------------------------------------------ vote board
const VoteScene: React.FC<{t: number}> = ({t}) => {
  const z = 1 + 0.03 * clamp((t - B.wipe2) / 8);
  const a = t - 25.2;
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
type Shot = 'tbl1' | 'wait' | 'stand' | 'tbl2' | 'sneak' | 'cake' | 'terrace' | 'cliff' | 'vote' | 'end';
const WIPES: {t: number; dir: 1 | -1}[] = [{t: B.wipe1, dir: -1}, {t: B.wipe2, dir: 1}];
const shotAt = (t: number): Shot => (t < B.wait ? 'tbl1' : t < B.stand ? 'wait' : t < B.shrug ? 'stand' : t < B.wipe1 ? 'wait' : t < B.sneak ? 'tbl2' : t < B.cake ? 'sneak'
  : t < B.terrace ? 'cake' : t < B.cliff ? 'terrace' : t < B.wipe2 ? 'cliff' : t < B.endcard ? 'vote' : 'end');
const renderShot = (s: Shot, t: number): React.ReactNode => {
  switch (s) {
    case 'tbl1': case 'tbl2': return <TableScene t={t} />;
    case 'wait': return <WaitScene t={t} />;
    case 'stand': return <StandScene t={t} />;
    case 'sneak': return <SneakScene t={t} />;
    case 'cake': return <CakeScene t={t} />;
    case 'terrace': return <TerraceScene t={t} />;
    case 'cliff': return <CliffScene t={t} />;
    case 'vote': return <VoteScene t={t} />;
    default: return <EndCard t={t} a={t - B.endcard} part={4} />;
  }
};

const Scene: React.FC<{hook: Hook3}> = ({hook}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const w = WIPES.find((x) => t >= x.t && t < x.t + WIPE_DUR);
  const cur = shotAt(t);
  const prev = w ? shotAt(w.t - 0.001) : null;
  const k = w ? (t - w.t) / WIPE_DUR : 0;
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
          return <Strip key={i} text={s.text} y={s.y} age={t - s.from + 0.06} out={smooth(t, s.to - 0.12, s.to)} size={comment ? 76 : 60} rot={comment ? 0 : i % 2 ? 0.6 : -0.6} />;
        })}
      </svg>
    </AbsoluteFill>
  </>;
};

export const Table3: React.FC<{hook?: Hook3}> = ({hook = 'a'}) => (
  <AbsoluteFill style={{background: C.ivory}}>
    <Audio src={staticFile('audio/table-ep3.wav')} volume={0.9} />
    <Scene hook={hook} />
  </AbsoluteFill>
);
