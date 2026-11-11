import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, lerp, smooth} from '../../lib/motion';
import {MotionBlurWhen} from '../../lib/shots';
import {
  C, CARD_H, CARD_W, CamKey, Centerpiece, Defs, EndCard, Extras, Hand, Line, Marker, Mouth, NUN, NearPlane, Person, PersonPose, PhoneBody,
  SUSAN, SoftEllipse, SoftRect, SusanRing, Strip, Table, TentCard, Thumb, VoteBoard, VoteCard, WIPE_DUR, Wall, camAt, fitSize, keyAt, mkPose, planeT, textW, tipOf, track, wipeR,
} from './world';
import spec from '../../../specs/stories/table-ep2.json';

// Table Nine, part 2 "Why table 9". Silent. Frame 1 is fully composed (ONE strip, two big faces, his phone lit mid-swipe, the
// tent card with her "(why table 9?)"). Take 1 (I'M GREAT AT WEDDINGS) fails on him (spotlight, DJ sign, conga line, she eats
// cake); lazy Susan spins backwards = rewind; take 2 (I'M NOT. HENCE TABLE 9.) lands; two tents; best man taps his glass;
// she writes "(cake? now?)"; vote A (yes. now.) / B (after the speech.) fully up by 21.8.

export const TABLE2_FPS = 60;
export const TABLE2_FRAMES = Math.round(spec.duration * TABLE2_FPS);
const B = spec.beats;
export type Hook2 = 'a' | 'b' | 'c';

const HIM = {x: 255, y: 655}, HER = {x: 825, y: 655};
const DOWN0 = 1.7, DOWN1 = 1.85;
const GREEN = '#3C6B52';
const wp = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const FLOOR0 = B.floor, WIPE1 = B.wipe1;

// ------------------------------------------------------------------------------------------ poses
const P0 = [-0.6, 0.9, 0.1, 0, 3, 0.15, 0, 0.25];
const HIM_KEYS: [number, number[]][] = [
  [0, P0], [1.6, P0], [1.75, [0.2, 0.5, 0.9, 0, 0, 0.2, 0, 0]], [2.0, [0.7, 0.8, 0.5, 0, 2, 0.3, 0, 0.05]], [3.3, [0.7, 0.8, 0.5, 0, 2, 0.3, 0, 0.05]],
  [3.45, [0.5, 0.9, 0.2, 0, 2, 0.3, 0, 0.05]], [4.9, [0.5, 0.9, 0.2, 0, 2, 0.3, 0, 0.05]], [5.05, [1, 0.1, 0.4, 0, -2, 0.4, 0, 0.1]], [5.9, [1, 0.1, 0.4, 0, -2, 0.4, 0, 0.1]],
  [10.1, [0.5, 0.9, 0.4, 0, 0, 0.3, 0, 0.05]], [11.0, [0.5, 0.9, 0.4, 0, 0, 0.3, 0, 0.05]], [11.15, [0.4, -0.7, 0.6, 0, 2, 0.3, 0, 0]], [11.45, [0.4, -0.7, 0.6, 0, 2, 0.3, 0, 0]],
  [11.6, [0.5, 0.9, 0.2, 0, 2, 0.3, 0, 0.05]], [13.0, [0.5, 0.9, 0.2, 0, 2, 0.3, 0, 0.05]], [13.2, [1, 0.1, 0.5, 0, -2, 0.5, 0, 0.05]], [13.6, [0.9, 0.1, 0.3, 0, -3, 0.6, 0, 0.1]],
  [14.5, [0.9, 0.1, 0.3, 0, -3, 0.6, 0, 0.1]], [14.7, [0.6, 0.9, 0.2, 0, 0, 0.5, 0, 0.1]], [15.9, [0.6, 0.9, 0.2, 0, 0, 0.5, 0, 0.1]], [16.1, [0.9, 0.4, 0.2, 0, -2, 0.5, 0, 0.1]],
  [16.6, [0.6, 0.85, 0.2, 0, 0, 0.5, 0, 0.1]], [17.55, [0.6, 0.85, 0.2, 0, 0, 0.5, 0, 0.1]], [17.7, [0.8, -0.4, 0.9, 0, -3, 0.4, 0, 0]], [18.6, [0.8, -0.4, 0.9, 0, -3, 0.4, 0, 0]],
  [18.8, [0.7, 0.8, 0.3, 0, 0, 0.5, 0, 0]], [19.7, [0.7, 0.8, 0.3, 0, 0, 0.5, 0, 0]], [19.85, [0.5, 0.9, 1, 0, 0, 0.9, 0, 0]], [20.6, [0.5, 0.9, 1, 0, 0, 0.9, 0, 0]],
];
const HIM_MOUTH: [number, Mouth][] = [[0, 'flat'], [1.75, 'o'], [2.2, 'flat'], [3.6, 'smirk'], [5.05, 'flat'], [11.0, 'flat'], [13.6, 'smile'], [16.1, 'smile'], [17.7, 'o'], [18.8, 'flat'], [19.85, 'gulp']];
const Q0 = [-1, 0.1, 0.4, 0, -3, 0.15, 0, 0.1];
const HER_KEYS: [number, number[]][] = [
  [0, Q0], [3.4, Q0], [3.6, [-0.5, 0.9, 0.2, 0, -2, 0.2, 0, 0.1]], [5.1, [-0.5, 0.9, 0.2, 0, -2, 0.2, 0, 0.1]], [5.3, [-0.7, 0.9, 0.3, 0, -2, 0.3, 0, 0.1]],
  [5.7, [-1, 0.2, 0.1, 1.4, -4, 0.25, 0, 0.2]], [5.95, [-1, 0.2, 0.1, 1.4, -4, 0.25, 0, 0.2]], [10.1, [-1, 0.3, 0.3, 0, -3, 0.2, 0, 0.1]], [11.5, [-1, 0.3, 0.3, 0, -3, 0.2, 0, 0.1]],
  [11.7, [-0.5, 0.9, 0.2, 0, -2, 0.2, 0, 0.1]], [13.2, [-0.5, 0.9, 0.2, 0, -2, 0.2, 0, 0.1]], [13.4, [-0.5, 0.9, 0.3, 0, -2, 0.3, 0.4, 0.1]], [13.5, [-1, 0, 0.7, 0, 6, 0.6, 1, 0]],
  [14.5, [-1, 0, 0.7, 0, 6, 0.6, 1, 0]], [14.7, [-0.5, 0.9, 0.1, 0, 0, 0.4, 0, 0.1]], [16.9, [-0.5, 0.9, 0.1, 0, 0, 0.4, 0, 0.1]], [17.1, [-1, 0.1, 0.2, 0, -2, 0.4, 0, 0]],
  [17.55, [-1, 0.1, 0.2, 0, -2, 0.4, 0, 0]], [17.7, [-0.7, -0.3, 0.4, 0, -3, 0.3, 0, 0]], [18.6, [-0.7, -0.3, 0.4, 0, -3, 0.3, 0, 0]], [18.8, [-0.5, 0.9, 0.1, 0, 0, 0.3, 0, 0.1]],
  [19.7, [-0.5, 0.9, 0.1, 0, 0, 0.3, 0, 0.1]], [19.85, [-1, 0.1, 0.5, 0, -3, 0.3, 0, 0]], [20.6, [-1, 0.1, 0.5, 0, -3, 0.3, 0, 0]],
];
const HER_MOUTH: [number, Mouth][] = [[0, 'smirk'], [5.7, 'flat'], [10.2, 'smirk'], [13.5, 'laugh'], [14.7, 'smile'], [17.7, 'flat'], [19.85, 'smirk']];

const himPose = (t: number): PersonPose => {
  const g = Math.sin(clamp((t - 19.9) / 0.45) * Math.PI);
  return mkPose(track(HIM_KEYS, t), keyAt(t, HIM_MOUTH), 1 - smooth(t, DOWN0, DOWN1), {gulp: t >= 19.9 && t < 20.35 ? g : 0, sweat: t >= 19.85 && t < 20.5 ? (t - 19.85) / 0.65 : 0});
};
const herPose = (t: number): PersonPose => mkPose(track(HER_KEYS, t), keyAt(t, HER_MOUTH), 0, {happy: t >= 13.55 && t < 14.6});

// ------------------------------------------------------------------------------------------ cameras (A wide, B card close-up)
const A0 = {x: 540, y: 900}, BB = {x: 540, y: 890};
const CAM: CamKey[] = [
  {t: 0, ...A0, z: 1.0}, {t: 3.4, ...A0, z: 1.03},
  {t: 3.4, ...BB, z: 1.16, wob: 0.6, cut: true}, {t: 5.2, ...BB, z: 1.2, wob: 0.6},
  {t: 5.2, ...A0, z: 1.0, cut: true}, {t: 6.0, ...A0, z: 1.02},
  {t: WIPE1, ...A0, z: 1.0, cut: true}, {t: 11.5, ...A0, z: 1.03},
  {t: 11.5, ...BB, z: 1.16, wob: 0.6, cut: true}, {t: 13.2, ...BB, z: 1.2, wob: 0.6},
  {t: 13.2, ...A0, z: 1.0, cut: true}, {t: 14.6, ...A0, z: 1.03},
  {t: 14.6, ...BB, z: 1.16, wob: 0.6, cut: true}, {t: 15.9, ...BB, z: 1.2, wob: 0.6},
  {t: 15.9, ...A0, z: 1.0, cut: true}, {t: 18.6, ...A0, z: 1.035},
  {t: 18.6, x: 790, y: 930, z: 1.3, wob: 0.5, cut: true}, {t: 19.8, x: 790, y: 930, z: 1.34, wob: 0.5},
  {t: 19.8, ...A0, z: 1.0, cut: true}, {t: 20.6, ...A0, z: 1.03},
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
  const buzz = !him && t > B.buzz && t < B.buzz + 0.85 ? Math.sin(t * 150) * 5 : 0;
  const x = lerp(him ? 118 : 962, him ? 140 : 940, k) + buzz;
  const y = lerp(1150, 1214, k) - 46 * Math.sin(k * Math.PI);
  const ang = lerp(him ? 8 : -8, him ? 90 : -90, k);
  const sy = lerp(1, 0.5, k);
  const {p, dir} = swipe(t);
  return <g>
    <g transform={`translate(${x} ${y}) scale(1 ${sy}) rotate(${ang})`}>
      <PhoneBody who={who} t={t} cardPhase={him ? p : 0} k={k} swipeDir={dir} showCard />
      {him && k < 0.5 && <g opacity={smooth(p, 0, 0.04) * (1 - smooth(p, 0.62, 0.85))}><Thumb x={dir * (-26 + 62 * smooth(p, 0, 0.35))} y={52} rot={dir * 8} skin={C.skinHim} /></g>}
    </g>
    {!him && buzz !== 0 && <g fill="none" stroke={C.terraDeep} strokeWidth={7} strokeLinecap="round" opacity={0.85}>
      {[-1, 1].map((s) => <path key={s} d={`M ${940 + s * 96} 1196 l ${s * 22} -16 M ${940 + s * 106} 1226 l ${s * 26} 0 M ${940 + s * 96} 1256 l ${s * 22} 16`} />)}
    </g>}
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

// ------------------------------------------------------------------------------------------ cards and lines
const HAND = (s: number) => `400 ${s}px "Permanent Marker"`;
type LDef = {text: string; y: number; rot: number; col: string; a: number; b: number; size: number};
const L_Q: LDef = {text: '(why table 9?)', y: -2, rot: -1.5, col: GREEN, a: 0, b: 0, size: 60};
const L_H1: LDef = {text: spec.cards.his_1, y: 102, rot: 1.5, col: C.terraDeep, a: 3.6, b: 4.9, size: 58};
const L_H2: LDef = {text: spec.cards.his_2, y: 102, rot: 1.5, col: C.terraDeep, a: 11.6, b: 13.0, size: 58};
const L_RE: LDef = {text: spec.cards.her_reply, y: 74, rot: -2, col: GREEN, a: 15.0, b: 15.8, size: 62};
const L_CK: LDef = {text: spec.cards.her_cake, y: 74, rot: -2, col: GREEN, a: 18.8, b: 19.7, size: 66};
const mkLine = (d: LDef, prog: number): Line => {
  const s = fitSize(d.text, HAND, d.size, 640);
  return {text: d.text, x0: -textW(d.text, HAND(s)) / 2, y: d.y, size: s, rot: d.rot, color: d.col, prog};
};
const lineAt = (d: LDef, t: number): Line => mkLine(d, d.b === d.a ? 1 : wp(t, d.a, d.b));

type CardT = {x: number; y: number; s: number; rot: number; sx: number; face: 'front' | 'back'};
const flipSx = (f: number) => Math.max(0.02, f < 0.5 ? Math.cos(f * Math.PI) : Math.abs(Math.cos(f * Math.PI)));
const mainCard = (t: number): CardT => {
  const sl = t < WIPE1 ? smooth(t, 5.0, 5.5) : smooth(t, 13.05, 13.5) * (1 - wp(t, 14.6, 14.9));
  const f = wp(t, 14.6, 14.96);
  const g = smooth(t, 16.4, 17.1);
  return {x: lerp(540 + 60 * sl, 275, g), y: lerp(1005 - 18 * Math.sin(f * Math.PI), 1010, g), s: lerp(1, 0.68, g), rot: 3 * sl * (1 - g) + 2 * Math.sin(f * Math.PI), sx: flipSx(f), face: f >= 0.5 ? 'front' : 'back'};
};
const herCard = (t: number): CardT => {
  const k = smooth(t, 16.35, 17.0), f = wp(t, 16.4, 16.9);
  return {x: lerp(1060, 805, k), y: 1010 - 40 * Math.sin(k * Math.PI), s: 0.68, rot: (1 - k) * 8, sx: flipSx(f), face: f >= 0.5 ? 'front' : 'back'};
};
const cardT = (id: 'main' | 'her', t: number) => (id === 'main' ? mainCard(t) : herCard(t));
const mainLines = (t: number, face: 'front' | 'back'): Line[] => face === 'back' ? [lineAt(L_Q, t), lineAt(t < WIPE1 ? L_H1 : L_H2, t)] : [lineAt(L_RE, t)];

// ------------------------------------------------------------------------------------------ the marker
const ROW = 1236;
type Held = {x: number; y: number; rot: number; capped: boolean; holder: 'him' | 'her' | null};
type Seg = {who: 'him' | 'her'; card: 'main' | 'her'; line: LDef; pick: number; putTo: number; restB: number; restA: number};
const SEGS: Seg[] = [
  {who: 'him', card: 'main', line: L_H1, pick: 2.0, putTo: 5.2, restB: 400, restA: 470},
  {who: 'him', card: 'main', line: L_H2, pick: 11.2, putTo: 13.25, restB: 470, restA: 480},
  {who: 'her', card: 'main', line: L_RE, pick: 14.8, putTo: 16.05, restB: 480, restA: 610},
  {who: 'her', card: 'her', line: L_CK, pick: 18.3, putTo: 19.95, restB: 610, restA: 640},
];
const markerAt = (t: number): Held => {
  const capped = t < B.uncap;
  let idx = -1;
  SEGS.forEach((s, i) => { if (t >= s.pick) idx = i; });
  if (idx < 0) return {x: 400, y: ROW, rot: -6, capped, holder: null};
  const s = SEGS[idx], cs = cardT(s.card, t);
  const rest = {x: 0, y: ROW, rot: -6};
  const tipAt = (p: number): [number, number] => { const [a, b] = tipOf(mkLine(s.line, p)); return [cs.x + cs.s * a, cs.y + cs.s * b + 4]; };
  const rot = s.who === 'him' ? -35 : 215, r = rot * Math.PI / 180;
  const place = (tip: [number, number]) => ({x: tip[0] - Math.cos(r) * 76, y: tip[1] - Math.sin(r) * 76});
  const blend = (tip: [number, number], restX: number, k: number): Held => {
    if (k <= 0) return {x: restX, y: ROW, rot: -6, capped, holder: null};
    const p = place(tip);
    return {x: lerp(restX, p.x, smooth(k, 0, 1)), y: lerp(ROW, p.y, smooth(k, 0, 1)), rot: lerp(rest.rot, rot, smooth(k, 0, 1)), capped: capped && k < 1, holder: s.who};
  };
  if (t < s.line.a) return blend(tipAt(0), s.restB, wp(t, s.pick, s.pick + 0.4));
  if (t <= s.line.b) return blend(tipAt(wp(t, s.line.a, s.line.b)), s.restB, 1);
  if (t < s.putTo) return blend(tipAt(1), s.restA, 1 - wp(t, s.line.b, s.putTo));
  return {x: s.restA, y: ROW, rot: -6, capped: false, holder: null};
};

const TableProps: React.FC<{t: number}> = ({t}) => {
  const mc = mainCard(t), hc = herCard(t), m = markerAt(t);
  const capAge = t - B.uncap, capU = clamp(capAge / 0.75);
  const capX = lerp(450, 640, capU), capY = ROW - 4 - 320 * Math.sin(capU * Math.PI);
  const card = (c: CardT, lines: Line[], printed?: string) => <g transform={`translate(${c.x} ${c.y}) rotate(${c.rot}) scale(${c.s})`}><TentCard face={c.face} lines={lines} scaleX={c.sx} printed={printed} /></g>;
  const push = t < WIPE1 ? wp(t, 4.95, 5.15) * (1 - wp(t, 5.4, 5.6)) : wp(t, 13.0, 13.2) * (1 - wp(t, 13.4, 13.6));
  const flipH = wp(t, 14.4, 14.6) * (1 - wp(t, 14.95, 15.1));
  const placeH = wp(t, 16.3, 16.5) * (1 - wp(t, 16.95, 17.15));
  return <g>
    {t >= 16.3 && card(hc, hc.face === 'front' ? [lineAt(L_CK, t)] : [], spec.cards.her_printed)}
    {card(mc, mainLines(t, mc.face))}
    {t >= B.uncap && t < WIPE1 && <g transform={`translate(${capU < 1 ? capX : 640} ${capU < 1 ? capY : ROW + 6}) rotate(${capU < 1 ? capU * 540 : 14})`}><rect x={-31} y={-15} width={62} height={30} rx={13} fill="#3A3140" /></g>}
    {m.holder === null && <Marker x={m.x} y={m.y} rot={m.rot} capped={m.capped} />}
    {m.holder === 'him' && <SleeveHand who="him" x={m.x - 70 * Math.cos(35 * Math.PI / 180) - 40} y={m.y + 52} show={1} />}
    {m.holder === 'her' && <SleeveHand who="her" x={m.x + 70 * Math.cos(35 * Math.PI / 180) + 40} y={m.y + 52} show={1} />}
    {m.holder !== null && <Marker x={m.x} y={m.y} rot={m.rot} capped={m.capped} />}
    {push > 0 && <SleeveHand who="him" x={mc.x - CARD_W / 2 - 10} y={1090} show={push} />}
    {flipH > 0 && <SleeveHand who="her" x={mc.x + CARD_W / 2 + 10} y={930} show={flipH} />}
    {placeH > 0 && <SleeveHand who="her" x={hc.x + 230} y={1100} show={placeH} />}
  </g>;
};

// ------------------------------------------------------------------------------------------ best man (far plane, behind the flowers)
const BestMan: React.FC<{t: number}> = ({t}) => {
  const rise = smooth(t, B.tink, B.tink + 0.45);
  if (t < B.tink - 0.05) return null;
  const tink = t > B.tink && t < B.tink + 0.9 ? Math.sin((t - B.tink) * 40) : 0;
  const talk = t > B.tink + 0.6 ? Math.abs(Math.sin(t * 13)) : 0;
  const ink = C.aubergine;
  return <g transform={`translate(540 ${lerp(1060, 600, rise)}) scale(0.85)`}>
    <path d="M -135 460 L -118 170 Q -100 100 0 94 Q 100 100 118 170 L 135 460 Z" fill="#2F4A3E" stroke={ink} strokeWidth={5} />
    <path d="M -46 98 L 46 98 L 0 250 Z" fill="#fff" /><path d="M -22 130 L 22 130 L 14 164 L -14 164 Z" fill={C.marigold} stroke={ink} strokeWidth={3} />
    <circle cx={-76} cy={190} r={13} fill={C.terracotta} />
    <circle cx={0} cy={0} r={82} fill="#E6B795" stroke={ink} strokeWidth={5} />
    <path d="M -80 -16 Q -78 -88 0 -90 Q 78 -88 80 -16 Q 50 -60 0 -62 Q -50 -60 -80 -16 Z" fill="#6B5B63" />
    {[-1, 1].map((s) => <g key={s}><ellipse cx={s * 32} cy={-4} rx={17} ry={16} fill="#fff" stroke={ink} strokeWidth={3} /><circle cx={s * 32 + 3} cy={2} r={7} fill={ink} />
      <path d={`M ${s * 32 - 18} -34 Q ${s * 32} -44 ${s * 32 + 18} -32`} fill="none" stroke="#6B5B63" strokeWidth={8} strokeLinecap="round" /></g>)}
    <ellipse cx={0} cy={46} rx={15} ry={6 + talk * 12} fill="#4B1A25" />
    {/* raised glass + spoon, up beside his head (drawn over it) */}
    <path d="M -108 190 Q -170 90 -100 -100" fill="none" stroke="#2F4A3E" strokeWidth={44} strokeLinecap="round" />
    <circle cx={-96} cy={-118} r={25} fill="#E6B795" stroke={ink} strokeWidth={3} />
    <path d="M -126 -250 L -66 -250 L -74 -158 Q -96 -134 -118 -158 Z" fill="#FFF3CC" stroke={ink} strokeWidth={4} />
    <path d="M -123 -224 L -69 -224 L -75 -162 Q -96 -140 -117 -162 Z" fill={C.marigold} opacity={0.75} />
    <g transform={`translate(-30 ${-210 + tink * 6}) rotate(${40 + tink * 10})`}><ellipse cx={0} cy={0} rx={13} ry={18} fill="#D8D4DC" stroke={ink} strokeWidth={3} /><rect x={-3} y={14} width={6} height={60} fill="#D8D4DC" stroke={ink} strokeWidth={2} /></g>
    {t > B.tink && t < B.tink + 0.7 && <g stroke={C.terracotta} strokeWidth={8} strokeLinecap="round" opacity={1 - wp(t, B.tink + 0.3, B.tink + 0.7)}>
      {[0, 1, 2, 3, 4].map((i) => <path key={i} d={`M ${-60 + Math.cos(i * 1.3 + 3.6) * 60} ${-226 + Math.sin(i * 1.3 + 3.6) * 40} l ${Math.cos(i * 1.3 + 3.6) * 24} ${Math.sin(i * 1.3 + 3.6) * 24}`} />)}
    </g>}
    {/* mic on a stand */}
    <rect x={56} y={44} width={8} height={420} fill="#26202B" />
    <g transform="translate(60 30) rotate(-24)"><rect x={-13} y={-16} width={26} height={46} rx={13} fill="#26202B" /><circle cx={0} cy={-22} r={17} fill="#8E8A9C" stroke={ink} strokeWidth={3} /></g>
  </g>;
};

const Dust: React.FC<{t: number}> = ({t}) => {
  const a = t - DOWN1;
  if (a < 0 || a > 0.45) return null;
  const k = a / 0.45;
  return <g opacity={1 - k} fill="none" stroke={C.aubergine} strokeWidth={6} strokeLinecap="round">
    <ellipse cx={140} cy={1216} rx={90 + k * 80} ry={22 + k * 20} />
    {[-1, 1].map((s) => <path key={s} d={`M ${140 + s * (120 + k * 70)} ${1190 - k * 20} l ${s * 26} -18`} />)}
  </g>;
};

const TableScene: React.FC<{t: number}> = ({t}) => {
  const cam = camAt(CAM, t);
  return <g>
    <g transform={planeT(cam, 0.2)}><Wall t={t} /></g>
    <g transform={planeT(cam, 0.3)}><Extras /></g>
    <g transform={planeT(cam, 0.6)}><BestMan t={t} /></g>
    <g transform={planeT(cam, 0.85)}><Centerpiece t={t} /></g>
    <g transform={planeT(cam, 0.92)}>
      <Person who="him" x={HIM.x} y={HIM.y} t={t} pose={himPose(t)} seed={0.4} />
      <Person who="her" x={HER.x} y={HER.y} t={t} pose={herPose(t)} seed={1.9} />
    </g>
    <g transform={planeT(cam, 1.0)}>
      <Table t={t} dessert={false} />
      <Arm who="him" t={t} /><Arm who="her" t={t} />
      <TableProps t={t} />
      <Dust t={t} />
    </g>
    <g transform={planeT(cam, 1.04)}><PhoneUnit who="him" t={t} /><PhoneUnit who="her" t={t} /></g>
    <g transform={planeT(cam, 1.7)}><NearPlane t={t} /></g>
  </g>;
};

// ------------------------------------------------------------------------------------------ the dance-floor fail (6.0-10.2)
const CONGA_V = 170, SLOT = [-110, 80, 270, 460, 650];
const slotX = (i: number, t: number) => SLOT[i] - CONGA_V * (t - B.grab);
const CongaGuest: React.FC<{x: number; y: number; col: string; hair: string; t: number; i: number}> = ({x, y, col, hair, t, i}) => {
  const bob = Math.sin(t * 11 + i * 1.3) * 9;
  return <g transform={`translate(${x} ${y + bob}) rotate(${Math.sin(t * 7 + i * 1.7) * 5} 0 300)`}>
    <path d="M -90 80 Q -96 160 -100 300 L 100 300 Q 96 160 90 80 Q 40 58 0 58 Q -40 58 -90 80 Z" fill={col} stroke={C.aubergine} strokeWidth={4} />
    <circle cx={0} cy={0} r={58} fill="#E6B795" stroke={C.aubergine} strokeWidth={4} />
    <path d="M -58 -6 Q -56 -66 0 -66 Q 56 -66 58 -6 Q 30 -36 0 -36 Q -30 -36 -58 -6 Z" fill={hair} />
    <circle cx={-20} cy={4} r={7} fill={C.aubergine} /><circle cx={20} cy={4} r={7} fill={C.aubergine} />
    <path d="M -22 24 Q 0 48 22 24 Z" fill="#4B1A25" />
  </g>;
};
const FLOOR_Y = 640;
const FloorScene: React.FC<{t: number}> = ({t}) => {
  const lt = t - FLOOR0;
  const grabbed = t >= B.grab;
  const carry = Math.max(0, t - B.grab);
  const rise = smooth(t, B.grab, B.grab + 0.7);
  const himX = grabbed ? slotX(2, t) : HIM_F.x;
  const himY = lerp(HIM_F.y, 700, rise);
  const himS = lerp(0.62, 0.46, rise);
  // spotlight: swings in from the middle, overshoots, lands on him, then follows
  const swing = 270 + 380 * Math.exp(-Math.max(0, t - 6.15) * 2.4) * Math.cos(Math.max(0, t - 6.15) * 6.5);
  const tx = t < 6.15 ? 560 : grabbed ? himX : swing, ty = grabbed ? himY : HIM_F.y;
  const beamOp = smooth(t, 6.0, 6.25);
  // his face
  const him = mkPose(track([[6.0, [0.2, 0.9, 0.3, 0, 2, 0.4, 0, 0.1]], [6.7, [0.2, 0.9, 0.3, 0, 2, 0.4, 0, 0.1]], [7.0, [0.6, -0.5, 0.9, 0, -2, 0.5, 0, 0]], [7.7, [0.6, -0.5, 1, 0, -2, 0.6, 0, 0]], [8.3, [-0.8, 0, 1, 0, 6, 0.7, 0, 0]], [10, [-0.8, 0, 1, 0, 6, 0.7, 0, 0]]], t), t < 6.9 ? 'flat' : 'o', 0, {sweat: t > 7.6 ? clamp((t - 7.6) / 1.2) : 0});
  const bite = ((t - 6.5) / 1.9) % 1;
  const fk = t < 6.5 ? 0 : bite < 0.3 ? smooth(bite, 0, 0.3) : bite < 0.5 ? 1 : bite < 0.8 ? 1 - smooth(bite, 0.5, 0.8) : 0;
  const her = mkPose([-0.2, 0.7, 0, 0, -1, 0.2, 0, 0.15 + 0.1 * fk], fk > 0.9 ? 'smile' : 'flat', 0);
  const sign = fitSize(spec.cards.dj_sign, (s) => `800 ${s}px "Nunito Sans"`, 80, 820);
  const guests: {i: number; slot: number; col: string; hair: string}[] = [
    {i: 0, slot: 0, col: C.terracotta, hair: C.hairHer}, {i: 1, slot: 1, col: C.eucalyptus, hair: C.hairHim}, {i: 3, slot: 3, col: C.marigold, hair: C.hairHer}, {i: 4, slot: 4, col: C.sage, hair: C.hairHim},
  ];
  const armCol = (g: number) => [C.terracotta, C.eucalyptus, '#4A2A52', C.marigold, C.sage][g];
  const gy = FLOOR_Y;
  const grabHand = (sg: number) => ({x: (t < B.grab ? slotX(2, t) : himX) + sg * 120 * himS * 1.1, y: lerp(gy + 160, himY + 150 * himS * 1.1 * 0.9, smooth(t, 7.2, 7.7))});
  return <g>
    <Wall t={t} />
    {/* floor */}
    <rect x={-60} y={640} width={1200} height={520} fill="#EBDDB8" />
    {Array.from({length: 9}, (_, i) => <path key={i} d={`M ${-60 + i * 150} 640 L ${540 + (i - 4) * 330} 1160`} stroke="#CDB985" strokeWidth={4} opacity={0.7} />)}
    {[760, 880, 1010].map((y) => <path key={y} d={`M -60 ${y} L 1140 ${y}`} stroke="#CDB985" strokeWidth={4} opacity={0.6} />)}
    {[C.terracotta, C.eucalyptus, C.marigold].map((c, i) => <ellipse key={i} cx={200 + i * 340 + Math.sin(t * 2 + i * 2) * 90} cy={780 + i * 110} rx={190} ry={54} fill={c} opacity={0.3} />)}
    <rect x={-100} y={-100} width={1280} height={1300} fill={C.aubergine} opacity={0.32} />
    {/* DJ booth: sign, speakers, desk */}
    {[40, 1040].map((x) => <g key={x}><rect x={x - 54} y={440} width={108} height={250} rx={14} fill="#26202B" stroke={C.aubergine} strokeWidth={4} /><circle cx={x} cy={520} r={34} fill="#4A4455" /><circle cx={x} cy={620} r={26} fill="#4A4455" /></g>)}
    <rect x={150} y={612} width={780} height={64} rx={14} fill="#26202B" stroke={C.marigold} strokeWidth={5} />
    {[300, 780].map((x) => <circle key={x} cx={x} cy={640} r={22} fill="#4A4455" stroke={C.marigold} strokeWidth={3} />)}
    <g transform="translate(540 590)"><circle r={38} fill={C.skinHer} stroke={C.aubergine} strokeWidth={4} /><path d="M -44 4 Q 0 -70 44 4" fill="none" stroke="#26202B" strokeWidth={9} /><circle cx={-44} cy={8} r={14} fill="#26202B" /><circle cx={44} cy={8} r={14} fill="#26202B" /></g>
    <g>
      <rect x={96} y={424} width={888} height={124} rx={22} fill={C.aubergine} stroke={C.marigold} strokeWidth={8} />
      {Array.from({length: 17}, (_, i) => <circle key={i} cx={124 + i * 52} cy={i % 2 ? 436 : 536} r={7} fill={(i + Math.floor(t * 4)) % 2 ? C.marigold : '#FFF3CC'} />)}
      <text x={540} y={486 + sign * 0.36} textAnchor="middle" fontFamily={NUN} fontWeight={800} fontSize={sign} fill={C.marigold}>{spec.cards.dj_sign}</text>
    </g>
    {/* spotlight beam */}
    <defs><linearGradient id="beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFF6D9" stopOpacity="0.85" /><stop offset="1" stopColor="#FFF6D9" stopOpacity="0.28" /></linearGradient></defs>
    <g opacity={beamOp}>
      <path d={`M 510 600 L 570 600 L ${tx + 210} ${ty + 150} L ${tx - 210} ${ty + 150} Z`} fill="url(#beam)" />
      <ellipse cx={tx} cy={ty + 20} rx={230} ry={230} fill="url(#glow)" opacity={0.9} />
    </g>
    {/* conga line (leader left, hands on shoulders) */}
    {guests.map((g) => <CongaGuest key={g.i} x={slotX(g.slot, t)} y={gy} col={g.col} hair={g.hair} t={t} i={g.i} />)}
    {[0, 1].map((i) => <g key={i}><path d={`M ${slotX(i + 1, t) - 70} ${gy + 110} L ${slotX(i, t) + 30} ${gy + 130}`} stroke={armCol(i + 1)} strokeWidth={34} strokeLinecap="round" /><circle cx={slotX(i, t) + 36} cy={gy + 132} r={21} fill="#E6B795" /></g>)}
    {/* the arms of the guest behind him reach down to his shoulders (behind his body), hands drawn after */}
    {t > 7.1 && t < 10.2 && [-1, 1].map((s) => <path key={s} d={`M ${slotX(3, t) - 40 + s * 36} ${gy + 110} L ${grabHand(s).x} ${grabHand(s).y}`} stroke={armCol(3)} strokeWidth={36} strokeLinecap="round" opacity={smooth(t, 7.1, 7.3)} />)}
    <g transform={`translate(${himX} ${himY}) scale(${himS}) rotate(${grabbed ? Math.sin(t * 10) * 7 : 0})`}>
      <Person who="him" x={0} y={0} t={t} pose={him} seed={0.4} />
    </g>
    {t > 7.1 && t < 10.2 && [-1, 1].map((s) => <circle key={s} cx={grabHand(s).x} cy={grabHand(s).y} r={25} fill="#E6B795" stroke={C.aubergine} strokeWidth={3} opacity={smooth(t, 7.1, 7.3)} />)}
    {t > 8.2 && <g opacity={smooth(t, 8.2, 8.5)}><path d={`M ${himX - 60} ${himY + 130} L ${slotX(1, t) + 36} ${gy + 132}`} stroke="#4A2A52" strokeWidth={30} strokeLinecap="round" /><circle cx={slotX(1, t) + 36} cy={gy + 132} r={21} fill="#E6B795" /></g>}
    <path d={`M ${slotX(4, t) - 70} ${gy + 110} L ${slotX(3, t) + 30} ${gy + 130}`} stroke={armCol(4)} strokeWidth={34} strokeLinecap="round" /><circle cx={slotX(3, t) + 36} cy={gy + 132} r={21} fill="#E6B795" />
    {t > 7.3 && Array.from({length: 26}, (_, i) => {
      const a = (t - 7.3) * (0.7 + (i % 5) * 0.12) + i * 0.37, x = ((i * 211) % 1100) - 10 + Math.sin(a * 3 + i) * 30, y = 560 + ((a * 260 + i * 53) % 560);
      return <rect key={i} x={x} y={y} width={16} height={9} rx={2} fill={[C.terracotta, C.marigold, C.eucalyptus, '#fff'][i % 4]} transform={`rotate(${a * 200} ${x} ${y})`} />;
    })}
    <rect x={-60} y={1110} width={1200} height={900} fill={C.cloth} />
    <rect x={-60} y={1104} width={1200} height={14} fill={C.champagne} />
    <rect x={-60} y={1270} width={1200} height={70} fill={C.eucalyptus} opacity={0.5} />
    {/* her, calm, with cake */}
    <g transform={`translate(${HER_F.x} ${HER_F.y}) scale(0.62)`}><Person who="her" x={0} y={0} t={t} pose={her} seed={1.9} /></g>
    <SoftEllipse x={810} y={1196} w={230} h={30} op={0.28} />
    <ellipse cx={810} cy={1180} rx={110} ry={28} fill={C.cloth} stroke={C.champagne} strokeWidth={5} />
    <path d="M 764 1182 L 850 1166 L 850 1140 L 764 1156 Z" fill="#F6E7C4" stroke="#CDB985" strokeWidth={3} /><path d="M 764 1156 L 850 1140 L 834 1130 L 750 1146 Z" fill={C.terracotta} /><circle cx={820} cy={1126} r={9} fill="#B2472A" />
    {(() => {
      const fx = lerp(830, 812, fk), fy = lerp(1150, 1022, fk);
      return <g>
        <path d={`M 1130 1400 Q 980 1250 ${fx + 70} ${fy + 40}`} fill="none" stroke={C.eucDeep} strokeWidth={70} strokeLinecap="round" />
        <g transform={`translate(${fx} ${fy}) rotate(${-22 + 10 * fk})`}><rect x={-5} y={-6} width={10} height={86} rx={5} fill="#D8D4DC" stroke={C.aubergine} strokeWidth={3} />
          {[-9, 0, 9].map((d) => <rect key={d} x={d - 2.5} y={-34} width={5} height={30} rx={2.5} fill="#D8D4DC" />)}</g>
        <Hand x={fx + 70} y={fy + 52} rot={52} flip skin={C.skinHer} />
      </g>;
    })()}
    {/* his card, left on the table */}
    <g transform="translate(300 1178) scale(0.48)"><TentCard face="back" lines={[mkLine(L_Q, 1), mkLine(L_H1, 1)]} scaleX={1} /></g>
    {lt < 0 ? null : null}
  </g>;
};
const HIM_F = {x: 270, y: 955}, HER_F = {x: 810, y: 955};

// ------------------------------------------------------------------------------------------ vote board
const VoteScene: React.FC<{t: number}> = ({t}) => {
  const z = 1 + 0.03 * clamp((t - B.wipe2) / 8);
  const a = t - 22.6;
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
type Shot = 'tbl1' | 'floor' | 'tbl2' | 'vote' | 'end';
const WIPES: {t: number; dir: 1 | -1}[] = [{t: B.wipe1, dir: -1}, {t: B.wipe2, dir: 1}];
const shotAt = (t: number): Shot => (t < FLOOR0 ? 'tbl1' : t < B.wipe1 ? 'floor' : t < B.wipe2 ? 'tbl2' : t < B.endcard ? 'vote' : 'end');
const renderShot = (s: Shot, t: number): React.ReactNode => {
  switch (s) {
    case 'tbl1': return <TableScene t={t} />;
    case 'floor': return <FloorScene t={t} />;
    case 'tbl2': return <TableScene t={t} />;
    case 'vote': return <VoteScene t={t} />;
    default: return <EndCard t={t} a={t - B.endcard} part={3} />;
  }
};

const Scene: React.FC<{hook: Hook2}> = ({hook}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const w = WIPES.find((x) => t >= x.t && t < x.t + WIPE_DUR);
  const cur = shotAt(t);
  // the shot that was playing just before the wipe; frozen at the wipe start for the outgoing side
  const prev = w ? shotAt(w.t - 0.001) : null;
  const k = w ? (t - w.t) / WIPE_DUR : 0;
  const rotIn = (1 - smooth(k, 0, 1)) * -22 * (w ? w.dir : 1);
  return <>
    <MotionBlurWhen fast={w !== undefined} samples={5} shutter={220}>
      <AbsoluteFill>
        <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, background: C.ivory}}>
          <Defs />
          {w ? <>
            {renderShot(prev as Shot, prev === 'floor' ? Math.min(t, WIPE1 - 0.001) : t)}
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

export const Table2: React.FC<{hook?: Hook2}> = ({hook = 'a'}) => (
  <AbsoluteFill style={{background: C.ivory}}>
    <Audio src={staticFile('audio/table-ep2.wav')} volume={0.9} />
    <Scene hook={hook} />
  </AbsoluteFill>
);
