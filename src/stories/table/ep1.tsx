import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, lerp, smooth} from '../../lib/motion';
import {MotionBlurWhen} from '../../lib/shots';
import {
  C, CARD_H, CARD_W, Cam, CamKey, Centerpiece, Defs, EndCard, Extras, Hand, Line, Marker, Mouth, NearPlane, PersonPose, Person, PhoneBody,
  SUSAN, SusanRing, Strip, Table, TentCard, Thumb, VoteBoard, VoteCard, WIPE_DUR, Wall, camAt, keyAt, mkPose, planeT, tipOf, track, wipeR, writeLine,
} from './world';
import spec from '../../../specs/stories/table-ep1.json';

// Table Nine, part 1 "Still swiping?". Silent. Frame 1 is fully composed: ONE strip, two big faces, both thumbs swiping,
// the tent card centre. Payoff: she out-swipes him on the card ("since the bread"), both laugh, both phones go face down on
// the same beat (12.9). Then she asks "(why table 9?)" and the vote (A or B) is fully up by 21.0.

export const TABLE1_FPS = 60;
export const TABLE1_FRAMES = Math.round(spec.duration * TABLE1_FPS);
const B = spec.beats;
export type Hook = 'a' | 'b';

const HIM = {x: 255, y: 655}, HER = {x: 825, y: 655};
const DOWN0 = 12.76, DOWN1 = 12.9;

// ------------------------------------------------------------------------------------------ poses
const PH_HIM = [-0.6, 0.9, 0.1, 0, 3, 0.15, 0, 0.25];
const HIM_KEYS: [number, number[]][] = [
  [0, PH_HIM], [2.9, PH_HIM], [3.05, [0.2, 0.4, 0.95, 0, 0, 0.2, 0, 0]], [3.4, [0.6, 0.9, 0.8, 0, 2, 0.3, 0, 0.05]], [4.7, [0.6, 0.9, 0.8, 0, 2, 0.3, 0, 0.05]],
  [4.9, [1, 0, 0.5, 0, -3, 0.5, 0, 0.05]], [5.9, [1, 0, 0.5, 0, -3, 0.5, 0, 0.05]], [6.2, [-0.2, 0.9, 0.3, 0, 0, 0.5, 0, 0.1]],
  [6.8, [0.5, 0.85, 0.2, 0, 2, 0.4, 0, 0.05]], [8.3, [0.5, 0.85, 0.2, 0, 2, 0.4, 0, 0.05]], [8.5, [1, 0, 0.4, 0, -2, 0.6, 0, 0]],
  [9.6, [1, 0, 0.4, 0, -2, 0.6, 0, 0]], [9.8, [0.5, 0.85, 0.3, 0, 0, 0.4, 0, 0.05]], [11.7, [0.5, 0.85, 0.4, 0, 0, 0.4, 0, 0]],
  [11.9, [0.6, 0.8, 0.8, 0, -6, 0.6, 1, 0]], [13.4, [0.6, 0.8, 0.8, 0, -6, 0.6, 1, 0]], [13.9, [1, 0, 0.2, 0, 2, 0.4, 0.05, 0.05]],
  [15.0, [1, 0, 0.2, 0, 2, 0.4, 0.05, 0.05]], [15.3, [0.5, 0.9, 0.2, 0, 2, 0.3, 0, 0.05]], [17.2, [0.5, 0.9, 0.2, 0, 2, 0.3, 0, 0.05]],
  [17.6, [0.5, 0.8, 0.7, 0, 0, 0.5, 0, 0]], [18.0, [0.4, 0.8, 1, 0, 0, 0.9, 0, 0]], [18.45, [-0.6, 1, 0.9, 0, 2, 0.9, 0, 0]],
  [19.3, [0.2, 0, 0.7, 0, 0, 0.9, 0, 0]], [19.9, [0.2, 0, 0.7, 0, 0, 0.9, 0, 0]],
];
const HIM_MOUTH: [number, Mouth][] = [[0, 'flat'], [3.0, 'o'], [3.6, 'flat'], [7.0, 'smirk'], [8.5, 'flat'], [11.9, 'laugh'], [13.5, 'smile'], [15.3, 'flat'], [17.6, 'o'], [18.05, 'gulp'], [19.3, 'flat']];
const PH_HER = [0.7, 0.9, 0, 0, -3, 0.1, 0, 0.3];
const HER_KEYS: [number, number[]][] = [
  [0, PH_HER], [4.7, PH_HER], [4.9, [0.7, 0.9, 0, 0, -3, 0.35, 0, 0.3]], [8.3, [0.7, 0.9, 0, 0, -3, 0.35, 0, 0.3]], [8.45, [-0.6, 0.85, 0.3, 0, -2, 0.5, 0.35, 0.1]],
  [9.5, [-0.6, 0.85, 0.3, 0, -2, 0.5, 0.35, 0.1]], [9.7, [-0.5, 0.9, 0, 0, 0, 0.3, 0, 0.1]], [11.7, [-0.5, 0.9, 0, 0, 0, 0.3, 0, 0.1]],
  [11.9, [-1, 0, 0.7, 0, 6, 0.6, 1, 0]], [13.4, [-1, 0, 0.7, 0, 6, 0.6, 1, 0]], [13.9, [-1, 0, 0.3, 0, -2, 0.5, 0.05, 0.05]], [15.0, [-1, 0, 0.3, 0, -2, 0.5, 0.05, 0.05]],
  [15.3, [-0.5, 0.9, 0.1, 0, 0, 0.4, 0, 0.1]], [17.0, [-0.5, 0.9, 0.1, 0, 0, 0.4, 0, 0.1]], [17.25, [-1, 0, 0.5, 0, -2, 0.4, 0, 0]], [18.2, [-1, 0, 0.5, 0, -2, 0.4, 0, 0]],
  [18.5, [-1, 0, 0.2, 1.3, -3, 0.4, 0, 0.1]], [19.9, [-1, 0, 0.2, 1.3, -3, 0.4, 0, 0.1]],
];
const HER_MOUTH: [number, Mouth][] = [[0, 'flat'], [3.0, 'smirk'], [11.9, 'laugh'], [13.5, 'smile'], [15.3, 'smirk'], [18.5, 'smile']];

const himPose = (t: number): PersonPose => {
  const v = track(HIM_KEYS, t);
  const laughing = t >= 11.95 && t < 13.5;
  const g = Math.sin(clamp((t - 18.1) / 0.45) * Math.PI);
  const glow = (1 - smooth(t, DOWN0, DOWN1)) * (t < 3.0 ? 1 : 0.3);
  return mkPose(v, keyAt(t, HIM_MOUTH), glow, {happy: laughing, gulp: t >= 18.1 && t < 18.55 ? g : 0, sweat: t >= 18.0 && t < 19.8 ? (t - 18.0) / 1.8 : 0});
};
const herPose = (t: number): PersonPose => {
  const v = track(HER_KEYS, t);
  const glow = (1 - smooth(t, DOWN0, DOWN1)) * (t < 5.95 ? 1 : 0.3);
  return mkPose(v, keyAt(t, HER_MOUTH), glow, {happy: t >= 11.95 && t < 13.5});
};

// ------------------------------------------------------------------------------------------ cameras
const A0 = {x: 540, y: 900}, B0 = {x: 540, y: 890};
const CAM: CamKey[] = [
  {t: 0, ...A0, z: 1.0}, {t: 3.4, ...A0, z: 1.03},
  {t: 3.4, x: 540, y: 890, z: 1.16, wob: 0.6, cut: true}, {t: 4.8, x: 540, y: 890, z: 1.22, wob: 0.6},
  {t: 4.8, ...A0, z: 1.0, cut: true}, {t: 6.6, ...A0, z: 1.03},
  {t: 6.6, ...B0, z: 1.16, wob: 0.6, cut: true}, {t: 8.4, ...B0, z: 1.22, wob: 0.6},
  {t: 8.4, ...A0, z: 1.0, cut: true}, {t: 9.6, ...A0, z: 1.03},
  {t: 9.6, ...B0, z: 1.16, wob: 0.6, cut: true}, {t: 11.8, ...B0, z: 1.22, wob: 0.6},
  {t: 11.8, ...A0, z: 1.0, cut: true}, {t: 15.2, ...A0, z: 1.035},
  {t: 15.2, x: 540, y: 890, z: 1.16, wob: 0.6, cut: true}, {t: 17.2, x: 540, y: 890, z: 1.22, wob: 0.6},
  {t: 17.2, ...A0, z: 1.0, cut: true}, {t: 20.0, ...A0, z: 1.035},
];

// ------------------------------------------------------------------------------------------ props: phones, card, marker
const wp = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const HIM_TICKS = [-0.1, ...Array.from({length: 10}, (_, i) => 0.2 + i * 0.3)];
const HER_TICKS = [-0.12, ...Array.from({length: 10}, (_, i) => 0.32 + i * 0.3), 3.3, 3.9, 4.5, 5.1, 5.7];
const swipe = (ticks: number[], t: number) => {
  let idx = -1;
  for (let i = 0; i < ticks.length; i++) if (ticks[i] <= t) idx = i;
  return {p: clamp((t - ticks[Math.max(0, idx)]) / 0.26), dir: idx % 2 ? 1 : -1};
};

const PhoneUnit: React.FC<{who: 'him' | 'her'; t: number}> = ({who, t}) => {
  const him = who === 'him';
  const k = smooth(t, DOWN0, DOWN1);
  const x = lerp(him ? 118 : 962, him ? 140 : 940, k);
  const y = lerp(1150, 1214, k) - 46 * Math.sin(k * Math.PI);
  const ang = lerp(him ? 8 : -8, him ? 90 : -90, k);
  const sy = lerp(1, 0.5, k);
  const stopped = him && t >= 3.0;
  const {p, dir} = stopped ? {p: 0, dir: -1} : swipe(him ? HIM_TICKS : HER_TICKS, t);
  const skin = him ? C.skinHim : C.skinHer;
  const thumbX = stopped ? 0 : dir * (-26 + 62 * smooth(p, 0, 0.35));
  const thumbOp = stopped ? 1 : smooth(p, 0, 0.04) * (1 - smooth(p, 0.62, 0.85));
  return <g transform={`translate(${x} ${y}) scale(1 ${sy}) rotate(${ang})`}>
    <PhoneBody who={who} t={t} cardPhase={stopped ? 0 : p} k={k} swipeDir={dir} showCard />
    {k < 0.5 && <g opacity={thumbOp}><Thumb x={thumbX} y={52} rot={dir * 8} skin={skin} /></g>}
  </g>;
};

const Arm: React.FC<{who: 'him' | 'her'; t: number}> = ({who, t}) => {
  const him = who === 'him';
  const k = smooth(t, DOWN0, DOWN1);
  const sh: [number, number] = him ? [62, 930] : [1018, 930];
  const hx = lerp(him ? 118 : 962, him ? 312 : 768, k), hy = lerp(1226, 1208, k);
  const col = him ? '#4A2A52' : C.eucDeep;
  const skin = him ? C.skinHim : C.skinHer;
  const bow = him ? -34 : 34;
  return <g>
    <path d={`M ${sh[0]} ${sh[1]} Q ${(sh[0] + hx) / 2 + bow} ${(sh[1] + hy) / 2 + 40} ${hx} ${hy}`} fill="none" stroke={col} strokeWidth={76} strokeLinecap="round" />
    <Hand x={hx} y={hy - 12} rot={him ? 90 : -90} flip={!him} skin={skin} />
  </g>;
};

// the card
const CARD0 = {x: 540, y: 1005};
const cardLines = (t: number): {front: Line[]; back: Line[]} => ({
  front: [writeLine('(still swiping?)', 36, -2.5, '#3C6B52', 0.875 + 0.125 * wp(t, 0.3, 1.6), 58), writeLine('(since the salad.)', 118, 1.5, C.terraDeep, wp(t, 6.9, 8.2), 58)],
  back: [writeLine('(since the bread.)', 0, -2, '#3C6B52', wp(t, 10.0, 11.7), 58), writeLine('(why table 9?)', 96, 1.5, '#3C6B52', wp(t, 15.2, 16.8), 58)],
});
const cardXf = (t: number) => {
  const sl = smooth(t, 17.2, 17.9);
  const f = wp(t, 9.6, 9.96);
  const sx = f < 0.5 ? Math.cos(f * Math.PI) : Math.abs(Math.cos(f * Math.PI)) ;
  return {x: CARD0.x - 110 * sl, y: CARD0.y - 18 * Math.sin(f * Math.PI), rot: -4 * sl + 2 * Math.sin(f * Math.PI), sx: Math.max(0.02, sx), back: f >= 0.5};
};

const ROW = 1236;
type Held = {x: number; y: number; rot: number; capped: boolean; holder: 'him' | 'her' | null; tipX: number; tipY: number};
const markerAt = (t: number): Held => {
  const cx = cardXf(t), L = cardLines(t);
  const wtip = (l: Line, prog: number) => { const [a, b] = tipOf({...l, prog}); return [cx.x + a, cx.y + b + 4] as [number, number]; };
  const himRot = -35, herRot = 215;
  const place = (tip: [number, number], rot: number) => { const r = rot * Math.PI / 180; return {x: tip[0] - Math.cos(r) * 76, y: tip[1] - Math.sin(r) * 76, tipX: tip[0], tipY: tip[1]}; };
  const rest = (x: number) => ({x, y: ROW, rot: -6});
  const mix = (a: {x: number; y: number; rot: number}, b: {x: number; y: number; rot: number}, k: number) => ({x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), rot: lerp(a.rot, b.rot, k)});
  const w1 = wtip(L.front[1], L.front[1].prog), w2 = wtip(L.back[0], L.back[0].prog), w3 = wtip(L.back[1], L.back[1].prog);
  const s1 = wtip(L.front[1], 0), s2 = wtip(L.back[0], 0), s3 = wtip(L.back[1], 0);
  const held = (tip: [number, number], rot: number, who: 'him' | 'her', capped = false): Held => { const p = place(tip, rot); return {x: p.x, y: p.y, rot, capped, holder: who, tipX: p.tipX, tipY: p.tipY}; };
  const free = (o: {x: number; y: number; rot: number}, capped: boolean): Held => ({...o, capped, holder: null, tipX: 0, tipY: 0});
  const hp = (tip: [number, number], rot: number, from: {x: number; y: number; rot: number}, k: number, who: 'him' | 'her', capped: boolean): Held => {
    const p = place(tip, rot); const m = mix(from, {x: p.x, y: p.y, rot}, smooth(k, 0, 1));
    return {...m, capped, holder: who, tipX: lerp(from.x + 76, p.tipX, k), tipY: lerp(from.y, p.tipY, k)};
  };
  if (t < 1.65) return held(wtip(L.front[0], L.front[0].prog), herRot, 'her');
  if (t < 2.05) return hp(wtip(L.front[0], 1), herRot, rest(790), 1 - wp(t, 1.65, 2.05), 'her', false);
  if (t < 5.85) return free(rest(790), true);
  if (t < 6.55) return free(rest(lerp(790, 400, smooth(t, 5.85, 6.55))), true);
  if (t < 6.6) return free(rest(400), true);
  if (t < 6.9) return hp(s1, himRot, rest(400), wp(t, 6.6, 6.9), 'him', false);
  if (t < 8.2) return held(w1, himRot, 'him');
  if (t < 8.45) { const k = wp(t, 8.2, 8.45); const h = hp(w1, himRot, rest(470), 1 - k, 'him', false); return k >= 1 ? free(rest(470), false) : h; }
  if (t < 9.7) return free(rest(470), false);
  if (t < 10.0) return hp(s2, herRot, rest(470), wp(t, 9.7, 10.0), 'her', false);
  if (t < 11.7) return held(w2, herRot, 'her');
  if (t < 11.95) { const k = wp(t, 11.7, 11.95); return hp(w2, herRot, rest(610), 1 - k, 'her', false); }
  if (t < 15.0) return free(rest(610), false);
  if (t < 15.2) return hp(s3, herRot, rest(610), wp(t, 15.0, 15.2), 'her', false);
  if (t < 16.8) return held(w3, herRot, 'her');
  if (t < 17.05) { const k = wp(t, 16.8, 17.05); return hp(w3, herRot, rest(610), 1 - k, 'her', false); }
  return free(rest(610), false);
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

const TableProps: React.FC<{t: number}> = ({t}) => {
  const cx = cardXf(t), L = cardLines(t), m = markerAt(t);
  const lines = cx.back ? L.back : L.front;
  const capAge = t - 6.6;
  const capU = clamp(capAge / 0.75);
  const holdShow = m.holder ? 1 : 0;
  const twitch = t > 18.3 && t < 19.5 ? Math.max(0, Math.sin((t - 18.3) * 10.5)) * (t < 19.2 ? 1 : 0.4) : 0.0;
  // cap flies after the uncap, then lies on the table
  const capX = capAge < 0 ? 0 : lerp(450, 640, capU) + Math.sin(capU * Math.PI) * 0, capY = ROW - 4 - 320 * Math.sin(capU * Math.PI) * (capU < 1 ? 1 : 0);
  const pushShow = Math.max(wp(t, 17.0, 17.25) * (1 - wp(t, 17.8, 18.1)), wp(t, 9.4, 9.6) * (1 - wp(t, 9.9, 10.1)));
  const flipHand = t > 9.4 && t < 10.1;
  return <g>
    {/* the card */}
    <g transform={`translate(${cx.x} ${cx.y}) rotate(${cx.rot})`}><TentCard face={cx.back ? 'back' : 'front'} lines={lines} scaleX={cx.sx} /></g>
    {capAge >= 0 && <g transform={`translate(${capX} ${capU < 1 ? capY : ROW + 6}) rotate(${capU < 1 ? capU * 540 : 14})`}><rect x={-31} y={-15} width={62} height={30} rx={13} fill="#3A3140" /></g>}
    <g transform={`translate(${m.x} ${m.y}) rotate(${m.rot})`} />
    <Marker x={m.x} y={m.y} rot={m.rot} capped={m.capped} />
    {/* her hand sliding the marker */}
    {t > 5.6 && t < 6.8 && <SleeveHand who="her" x={m.x + 110} y={m.y - 6} show={wp(t, 5.6, 5.8) * (1 - wp(t, 6.55, 6.8))} />}
    {m.holder === 'him' && <SleeveHand who="him" x={m.x - 70 * Math.cos(35 * Math.PI / 180) - 40} y={m.y + 52} show={1} />}
    {m.holder === 'her' && <SleeveHand who="her" x={m.x + 70 * Math.cos(35 * Math.PI / 180) + 40} y={m.y + 52} show={1} />}
    {holdShow ? <Marker x={m.x} y={m.y} rot={m.rot} capped={m.capped} /> : null}
    {t >= 18.2 && <g transform={`translate(${312 - 56 - twitch * 40} 1200) rotate(90) scale(1.35)`}><rect x={-17} y={-34} width={34} height={92} rx={17} fill={C.skinHim} stroke="#00000033" strokeWidth={3} /><ellipse cx={0} cy={-12} rx={8} ry={6} fill="#fff" opacity={0.3} /></g>}
    {(pushShow > 0 && !m.holder) && <SleeveHand who="her" x={flipHand ? cx.x + CARD_W / 2 + 10 : cx.x + CARD_W / 2 + 40} y={flipHand ? 930 : 1090} show={pushShow} />}
  </g>;
};

const Dust: React.FC<{t: number}> = ({t}) => {
  const a = t - DOWN1;
  if (a < 0 || a > 0.45) return null;
  const k = a / 0.45;
  return <g opacity={1 - k} fill="none" stroke={C.aubergine} strokeWidth={6} strokeLinecap="round">
    {[140, 940].map((x) => <g key={x}>
      <ellipse cx={x} cy={1216} rx={90 + k * 80} ry={22 + k * 20} />
      {[-1, 1].map((s) => <path key={s} d={`M ${x + s * (120 + k * 70)} ${1190 - k * 20} l ${s * 26} -18`} />)}
    </g>)}
  </g>;
};

// ------------------------------------------------------------------------------------------ the table scene
const TableScene: React.FC<{t: number; dessert: boolean}> = ({t, dessert}) => {
  const cam = camAt(CAM, Math.min(t, 19.99));
  return <g>
    <g transform={planeT(cam, 0.2)}><Wall t={t} /></g>
    <g transform={planeT(cam, 0.3)}><Extras /></g>
    <g transform={planeT(cam, 0.85)}><Centerpiece t={t} /></g>
    <g transform={planeT(cam, 0.92)}>
      <Person who="him" x={HIM.x} y={HIM.y} t={t} pose={himPose(t)} seed={0.4} />
      <Person who="her" x={HER.x} y={HER.y} t={t} pose={herPose(t)} seed={1.9} />
    </g>
    <g transform={planeT(cam, 1.0)}>
      <Table t={t} dessert={dessert} />
      <Arm who="him" t={t} /><Arm who="her" t={t} />
      <TableProps t={t} />
      <Dust t={t} />
    </g>
    <g transform={planeT(cam, 1.04)}><PhoneUnit who="him" t={t} /><PhoneUnit who="her" t={t} /></g>
    <g transform={planeT(cam, 1.7)}><NearPlane t={t} /></g>
  </g>;
};

const VoteScene: React.FC<{t: number}> = ({t}) => {
  const z = 1 + 0.03 * clamp((t - 19.8) / 8);
  const a = t - 20.8;
  const cyc = a > 0 ? 0.5 - 0.5 * Math.cos(a / 4.4 * Math.PI * 2) : 0;
  const tap = t > 22.9 && t < 23.25 ? Math.sin((t - 22.9) / 0.35 * Math.PI) : 0;
  const penY = lerp(640, 960, cyc) + tap * 30 + Math.sin(t * 3) * 5;
  return <g transform={`translate(540 960) scale(${z}) translate(-540 -960)`}>
    <VoteBoard t={t} />
    <VoteCard letter="A" l1="I’M GREAT" l2="AT WEDDINGS." y={470} age={t - B.cardA} col={C.terracotta} rot={-2} lift={tap * 10} />
    <VoteCard letter="B" l1="I’M NOT." l2="HENCE TABLE 9." y={800} age={t - B.cardB} col={C.eucalyptus} rot={2} />
    {a > -0.2 && <g opacity={smooth(a, -0.2, 0.2)} transform={`translate(0 ${penY - 800})`}>
      <path d="M 1250 1250 Q 1080 900 990 800" fill="none" stroke="#4A2A52" strokeWidth={80} strokeLinecap="round" />
      <Marker x={985} y={800} rot={-128} capped={false} />
      <Hand x={1066} y={840} rot={-30} skin={C.skinHim} />
    </g>}
  </g>;
};

// ------------------------------------------------------------------------------------------ the edit
type Shot = 'tbl' | 'dess' | 'vote' | 'end';
const WIPES = [B.wipe1, B.wipe2];
const shotAt = (t: number): Shot => (t < B.wipe1 ? 'tbl' : t < B.wipe2 ? 'dess' : t < B.endcard ? 'vote' : 'end');
const renderShot = (s: Shot, t: number): React.ReactNode => {
  switch (s) {
    case 'tbl': return <TableScene t={t} dessert={false} />;
    case 'dess': return <TableScene t={t} dessert />;
    case 'vote': return <VoteScene t={t} />;
    default: return <EndCard t={t} a={t - B.endcard} />;
  }
};

const Scene: React.FC<{hook: Hook}> = ({hook}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const w = WIPES.find((x) => t >= x && t < x + WIPE_DUR);
  const cur = shotAt(t);
  const prev = w !== undefined ? shotAt(w - 0.001) : null;
  const k = w !== undefined ? (t - w) / WIPE_DUR : 0;
  const rotIn = (1 - smooth(k, 0, 1)) * -22;
  return <>
    <MotionBlurWhen fast={w !== undefined} samples={5} shutter={220}>
      <AbsoluteFill>
        <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, background: C.ivory}}>
          <Defs />
          {w !== undefined ? <>
            {renderShot(prev as Shot, t)}
            <defs><clipPath id="susan"><circle cx={SUSAN.cx} cy={SUSAN.cy} r={wipeR(k)} /></clipPath></defs>
            <g clipPath="url(#susan)"><g transform={`rotate(${rotIn} ${SUSAN.cx} ${SUSAN.cy})`}>{renderShot(cur, t)}</g></g>
            <SusanRing k={k} />
          </> : renderShot(cur, t)}
        </svg>
      </AbsoluteFill>
    </MotionBlurWhen>
    <AbsoluteFill>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        {t < 3.0 && <Strip text={(spec.hooks as Record<string, string>)[hook]} y={345} age={t + 1} out={smooth(t, 2.85, 3.0)} size={52} maxW={960} />}
        {spec.strips.map((s, i) => {
          if (t >= s.to) return null;
          if (t < s.from && !s.text.startsWith('comment')) return null;
          const comment = s.text.startsWith('comment');
          const from = comment ? 21.0 : s.from;
          if (t < from) return null;
          return <Strip key={i} text={s.text} y={s.y} age={t - (comment ? 21.0 : s.from) + 0.06} out={smooth(t, s.to - 0.12, s.to)} size={comment ? 76 : 60} rot={comment ? 0 : i % 2 ? 0.6 : -0.6} />;
        })}
      </svg>
    </AbsoluteFill>
  </>;
};

export const Table1: React.FC<{hook?: Hook}> = ({hook = 'a'}) => (
  <AbsoluteFill style={{background: C.ivory}}>
    <Audio src={staticFile('audio/table-ep1.wav')} volume={0.9} />
    <Scene hook={hook} />
  </AbsoluteFill>
);
