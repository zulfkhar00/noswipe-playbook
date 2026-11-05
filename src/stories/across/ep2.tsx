import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, lerp, smooth} from '../../lib/motion';
import {MotionBlurWhen} from '../../lib/shots';
import {Arm, BenchFront, Booklet, C, Cam, CamKey, Cup, Door, Face, Her, Him, JOST, PassingTrain, Paper, PEN, Pen, PosterBg, Sign, SeatBack, SheetSpec, Soft, Strip, Table, TRAIN_CUT, VoteCard, Wall, Window, PW, boxX, camAt, planeT, textW} from './world';
import spec from '../../../specs/stories/across-ep2.json';

// Seven Across, part 2 "Nervous". Same ride as part 1, seen at the clue moment. She leaves "How you feel
// right now (7)"; branch A (he writes RELAXED, shakes, spills his coffee) is rewound by the opposite train,
// branch B (NERVOUS) makes her smile and write SAME. Last stop lights, she writes "Who you are (4)", stands
// at the door. Vote: A DAVE (his real name) or B DUKE (the name he wishes he had).
// Everything in the carriage is a pure function of "story time" tv; during the rewind tv runs backwards, so
// the spill, the letters, the parallax and the camera all really play in reverse.

export const ACROSS2_FPS = 60;
export const ACROSS2_FRAMES = Math.round(spec.duration * ACROSS2_FPS);
const B = spec.beats;

export type Hook = 'a' | 'b';

const REWIND = [9.2, 10.0] as const;
const CUT_B = 10.0 + TRAIN_CUT;
/** story time: equals t, except it runs back from 8.4 to 3.0 during the rewind and holds there behind the train. */
const tvOf = (t: number) => (t < REWIND[0] ? t : t < REWIND[1] ? lerp(8.4, 3.0, smooth(t, REWIND[0], REWIND[1])) : t < CUT_B ? 3.0 : t);

// ------------------------------------------------------------------------------------- the sheets

const PY = 1020;
const PX = 540;
const pxC = (t: number) => (t < 18.4 ? 660 : lerp(660, 540, smooth(t, 18.4, 19.0)));
const px = (t: number) => (t < 16.9 ? PX : pxC(t));
const INK_HIM = '#243B6B';

const CLUE1 = 'How you feel|right now (7)';
const SHEET_A: SheetSpec = {text: CLUE1, n: 7, by: 'her', size: 48, letters: {s: 'RELAXED', from: 3.3, step: 0.3, ink: INK_HIM}, wobble: true, stain: {at: 7.4, x: -70, y: 52}};
const SHEET_B: SheetSpec = {text: CLUE1, n: 7, by: 'her', size: 48, letters: {s: 'NERVOUS', from: 11.2, step: 0.3, ink: INK_HIM},
  row2: {n: 4, s: 'SAME', boxesFrom: 14.1, from: 14.4, step: 0.3, ink: C.green}};
const SHEET_C: SheetSpec = {text: 'Who you are (4)', n: 4, by: 'her', size: 52, reveal: [17.1, 18.2]};

// ------------------------------------------------------------------------------------- hands

type Act = {who: 'him' | 'her'; a: number; b: number; tip: (t: number) => [number, number]; pxf?: (t: number) => number};
const fillTip = (n: number, from: number, step: number, jit: number) => (t: number): [number, number] => {
  const i = Math.max(0, Math.min(n - 1, Math.floor((t - from) / step)));
  return [boxX(n, i) + Math.sin(t * 50) * jit, 50 + Math.cos(t * 45) * jit * 0.6];
};
const tipA = (t: number): [number, number] => {
  if (t < 3.3) return [boxX(7, 0) + Math.sin(t * 9) * 2, 62 + Math.sin(t * 7) * 2];   // hovering just under box 1
  const k = clamp((t - 3.3) / 2.1);
  return fillTip(7, 3.3, 0.3, 3 + 12 * k)(t);                                           // the shake grows letter by letter
};
const tipB = (t: number): [number, number] => (t < 11.2 ? [boxX(7, 0) + Math.sin(t * 9) * 2, 62 + Math.sin(t * 7) * 2] : fillTip(7, 11.2, 0.3, 4)(t));
const tipHer = (t: number): [number, number] => {
  const bump = (a: number) => Math.max(0, 1 - Math.abs(t - a) / 0.1);
  return [boxX(7, 5) + 20 - 12 * Math.sin(t * 5), 4 + 40 * Math.max(bump(0), bump(0.4), bump(0.8), bump(1.2))];
};
const row2x = (i: number) => 197 - (4 * 42 + 18) + 21 + i * 48;
const tipSame = (t: number): [number, number] => {
  if (t < 14.4) { const u = smooth(t, 14.0, 14.4); return [lerp(row2x(3) + 40, row2x(0), u), 100]; }
  const i = Math.max(0, Math.min(3, Math.floor((t - 14.4) / 0.3)));
  return [row2x(i) + Math.sin(t * 50) * 4, 112 + Math.cos(t * 45) * 3];
};
const tipClueC = (t: number): [number, number] => {
  const w = textW('Who you are (4)') * 52 / 42 * 1.1, u = clamp((t - 17.1) / 1.1);
  return [-w / 2 + w * u, -50 + Math.sin(t * 38) * 4];
};
const ACTS: Act[] = [
  {who: 'him', a: 0, b: 5.4, tip: tipA},
  {who: 'him', a: 10.0, b: 13.3, tip: tipB},
  {who: 'him', a: 19.6, b: 22.6, tip: (t) => [boxX(4, 0) + Math.sin(t * 6) * 3, 6 + Math.sin(t * 5) * 4 - 6 * smooth(t, 21, 21.8)]},
  {who: 'her', a: 0, b: 1.6, tip: tipHer},
  {who: 'her', a: 14.0, b: 15.8, tip: tipSame},
  {who: 'her', a: 17.0, b: 18.3, tip: tipClueC},
  {who: 'her', a: 18.3, b: 19.1, tip: () => [262, 30]},
];

const handFor = (who: 'him' | 'her', t: number, rest: [number, number]) => {
  const p = px(t);
  let best: {w: number; pos: [number, number]} = {w: 0, pos: rest};
  ACTS.forEach((act, i) => {
    if (act.who !== who || t < act.a - 0.35 || t > act.b + 0.35) return;
    const prev = ACTS[i - 1] && ACTS[i - 1].who === who && act.a - ACTS[i - 1].b < 0.7 ? ACTS[i - 1] : null;
    const next = ACTS[i + 1] && ACTS[i + 1].who === who && ACTS[i + 1].a - act.b < 0.7 ? ACTS[i + 1] : null;
    const wi = prev ? 1 : smooth(t, act.a - 0.35, act.a), wo = next ? 1 : 1 - smooth(t, act.b, act.b + 0.35);
    let tip = act.tip(clamp(t, act.a, act.b));
    if (prev) { const p0 = prev.tip(prev.b); const k = smooth(t, act.a - 0.1, act.a + 0.1); tip = [lerp(p0[0], tip[0], k), lerp(p0[1], tip[1], k)]; }
    best = {w: wi * wo, pos: [p + tip[0], PY + tip[1]]};
  });
  return {pos: [lerp(rest[0], best.pos[0], best.w), lerp(rest[1], best.pos[1], best.w)] as [number, number], w: best.w};
};

// ------------------------------------------------------------------------------------- the coffee cup

const CUP0 = {x: 290, y: 1150};   // at the sheet's left edge, clear of all 7 boxes
const cupAt = (t: number) => {
  const lift = smooth(t, 6.4, 6.85);
  const rat = t > 6.9 && t < 7.45 ? 1 : 0;
  const amp = 0.35 + 0.65 * clamp((t - 6.9) / 0.5);        // the shake grows until the cup tips over
  const tilt = smooth(t, 7.2, 7.55) * (1 - smooth(t, 7.9, 8.2));
  const settle = smooth(t, 7.95, 8.3);                     // he sets it down again, frozen, clear of the clue
  const x = lerp(lerp(CUP0.x, 356, lift) + rat * Math.sin(t * 120) * 5 * amp + 44 * tilt, 296, settle);
  const y = lerp(lerp(CUP0.y, 1058, lift) - 8 * tilt + rat * Math.sin(t * 97) * 3 * amp, 1124, settle);
  const rot = (rat * Math.sin(t * 95) * 8 * amp + 52 * tilt) * (1 - settle);
  const pour = clamp((t - 7.4) / 0.08) * (1 - smooth(t, 7.85, 7.95));
  return {x, y, rot, hold: lift, pour, rat};
};

// ------------------------------------------------------------------------------------- acting

const key = <T,>(t: number, ks: [number, T][]): T => { let v = ks[0][1]; for (const [a, b] of ks) if (t >= a) v = b; return v; };
type P = {look: [number, number]; mouth: Face['mouth']; brow: number; rot: number};
const himPose = (t: number): P => key<P>(t, [
  [0, {look: [3, 12], mouth: 'flat', brow: 0, rot: 5}],
  [1.5, {look: [8, -4], mouth: 'flat', brow: 0.5, rot: 0}],
  [2.2, {look: [4, 12], mouth: 'flat', brow: 0.2, rot: 5}],
  [3.3, {look: [6, 14], mouth: 'flat', brow: 0.4, rot: 7}],
  [5.4, {look: [8, 0], mouth: 'smile', brow: 0.3, rot: -3}],
  [6.2, {look: [6, 12], mouth: 'flat', brow: 0.4, rot: 4}],
  [7.4, {look: [4, 16], mouth: 'o', brow: 0.9, rot: 6}],
  [8.1, {look: [4, 14], mouth: 'wince', brow: 0.8, rot: 8}],
  [10.0, {look: [3, 12], mouth: 'flat', brow: 0, rot: 5}],
  [10.9, {look: [4, 4], mouth: 'flat', brow: 0.2, rot: -2}],
  [11.15, {look: [4, 13], mouth: 'flat', brow: 0.2, rot: 6}],
  [13.3, {look: [8, 2], mouth: 'flat', brow: 0.7, rot: 2}],
  [13.8, {look: [8, -2], mouth: 'smile', brow: 0.7, rot: 0}],
  [14.3, {look: [5, 12], mouth: 'smile', brow: 0.4, rot: 3}],
  [15.6, {look: [8, 0], mouth: 'grin', brow: 0.5, rot: -2}],
  [16.6, {look: [4, 8], mouth: 'smile', brow: 0.3, rot: 2}],
  [17.4, {look: [4, 12], mouth: 'smile', brow: 0.5, rot: 4}],
  [19.0, {look: [4, 12], mouth: 'o', brow: 0.9, rot: 5}],
  [20.2, {look: [4, 12], mouth: 'wince', brow: 0.8, rot: 6}],
  [22.0, {look: [8, -10], mouth: 'o', brow: 0.9, rot: -6}],
]);
const himBlush = (t: number) => {
  if (t < 1.5) return 0;
  if (t < 3.3) return lerp(0, 0.2, smooth(t, 1.5, 3.3));
  if (t < 7.4) return lerp(0.2, 0.4, smooth(t, 3.3, 5.4));
  if (t < 8.4) return lerp(0.4, 1, smooth(t, 7.4, 8.4));
  if (t < CUT_B) return 1;
  if (t < 11.2) return 0.05;
  if (t < 13.3) return lerp(0.05, 0.9, smooth(t, 11.2, 13.3));
  if (t < 17.1) return 0.9;
  if (t < 19.0) return lerp(0.9, 0.5, smooth(t, 17.1, 18)) ;
  return lerp(0.5, 1, smooth(t, 19.0, 20.2));
};
const herPose = (t: number): P => key<P>(t, [
  [0, {look: [8, 12], mouth: 'smile', brow: 0, rot: 0}],
  [1.5, {look: [10, 0], mouth: 'smile', brow: 0.2, rot: -1}],
  [3.3, {look: [10, 6], mouth: 'smile', brow: 0.2, rot: 0}],
  [5.6, {look: [10, -1], mouth: 'smile', brow: 0.5, rot: -2}],
  [6.3, {look: [10, 4], mouth: 'flat', brow: 0.2, rot: 0}],
  [7.4, {look: [10, 6], mouth: 'flat', brow: 0.9, rot: 2}],
  [8.0, {look: [10, 6], mouth: 'flat', brow: 0.9, rot: 1}],
  [10.0, {look: [8, 12], mouth: 'smile', brow: 0, rot: 0}],
  [11.2, {look: [10, 4], mouth: 'smile', brow: 0.2, rot: 0}],
  [13.5, {look: [8, 12], mouth: 'flat', brow: 0.3, rot: 2}],
  [13.8, {look: [10, 0], mouth: 'smile', brow: 0.5, rot: -2}],
  [14.1, {look: [8, 12], mouth: 'smile', brow: 0.2, rot: 2}],
  [15.6, {look: [2, -14], mouth: 'smile', brow: 0.3, rot: -4}],
  [16.5, {look: [6, -4], mouth: 'smile', brow: 0.3, rot: -1}],
  [17.1, {look: [8, 12], mouth: 'smile', brow: 0, rot: 3}],
  [18.5, {look: [10, 0], mouth: 'smile', brow: 0.4, rot: -2}],
]);
const herBlush = (t: number) => (t < CUT_B ? 0 : t < 13.5 ? 0 : t < 15.6 ? smooth(t, 13.5, 15.6) * 0.85 : t < 17.1 ? 0.85 : lerp(0.85, 0.3, smooth(t, 17.1, 19)));

// ------------------------------------------------------------------------------------- the camera

const CAM: CamKey[] = [
  {t: 0, x: 580, y: 1000, z: 1.36}, {t: 2.9, x: 560, y: 1010, z: 1.46}, {t: 3.4, x: 520, y: 1000, z: 1.6}, {t: 5.2, x: 520, y: 1000, z: 1.6},
  {t: 5.6, x: 580, y: 960, z: 1.25}, {t: 6.3, x: 580, y: 960, z: 1.25}, {t: 6.8, x: 590, y: 1000, z: 1.45}, {t: 9.2, x: 590, y: 1000, z: 1.45},
  {t: CUT_B, x: 580, y: 1000, z: 1.36, cut: true}, {t: 10.9, x: 580, y: 1000, z: 1.36}, {t: 11.1, x: 520, y: 1000, z: 1.6}, {t: 13.3, x: 520, y: 1000, z: 1.6},
  {t: 13.7, x: 700, y: 930, z: 1.5}, {t: 14.0, x: 700, y: 930, z: 1.5}, {t: 14.2, x: 580, y: 1010, z: 1.5}, {t: 14.5, x: 560, y: 1040, z: 1.7}, {t: 15.55, x: 560, y: 1040, z: 1.7},
  {t: 15.6, x: 580, y: 960, z: 1.25, cut: true}, {t: 16.4, x: 580, y: 960, z: 1.25}, {t: 16.8, x: 840, y: 960, z: 1.2}, {t: 18.3, x: 840, y: 960, z: 1.2},
  {t: 18.7, x: 560, y: 1000, z: 1.4}, {t: 19.2, x: 655, y: 960, z: 1.05}, {t: 40, x: 655, y: 960, z: 1.05},
];

// ------------------------------------------------------------------------------------- the scene

const Carriage: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const p = px(t);
  const drop = 560 * smooth(t, 16.6, 17.0);
  const rise = 560 * (1 - smooth(t, 16.95, 17.15));
  const sheet = t < 16.95 ? (t < CUT_B - 0.001 && t < 10.2 ? SHEET_A : SHEET_B) : SHEET_C;
  const sheetY = PY + (t < 16.95 ? drop : rise);
  const him = handFor('him', t, [430, 1110]);
  const standK = smooth(t, 19.4, 19.9);
  const herX = 885 + 105 * standK, herY = 840 - 55 * standK;
  const her = handFor('her', t, [herX - 30, herY + 220]);
  const doorOpen = smooth(t, 16.9, 17.4) * (1 - smooth(t, 23.0, 23.35));
  const hFace: Face = {...himPose(t), blush: himBlush(t), cheek: himBlush(t) * 0.6};
  const hb = herBlush(t);
  const wFace: Face = {...herPose(t), blush: hb, cheek: 0.3 + 0.7 * hb};
  const cup = cupAt(t >= 10.2 ? 0 : t);   // branch B: the coffee is never spilt, the cup stays on the table
  const warm = smooth(t, 15.6, 16.2) * (1 - smooth(t, 16.4, 16.8));

  // his hand: the pen, or the cup
  const penHand: [number, number] = [lerp(430, him.pos[0] + 40, him.w), lerp(1110, him.pos[1] + 64, him.w)];
  const grip: [number, number] = [cup.x - 36, cup.y - 46];
  const hk = cup.hold;
  const himHand: [number, number] = [lerp(penHand[0], grip[0], hk), lerp(penHand[1], grip[1], hk)];
  const himShoulder: [number, number] = [310 + clamp((himHand[0] - 540) * 0.2, 0, 24), 1072];   // leans in for the far boxes: no over-long arm
  const dHim = Math.hypot(himHand[0] - himShoulder[0], himHand[1] - himShoulder[1]);
  // her hand: pen, or both hands up at the gasp
  const gk = smooth(t, 7.8, 8.2) * (t < 9 ? 1 : 0);   // she holds out a napkin
  const herPen: [number, number] = [her.pos[0] - 40, her.pos[1] + 64];
  const herHand: [number, number] = [lerp(herPen[0], 640, gk), lerp(herPen[1], 1030, gk)];
  const herShoulder: [number, number] = [herX, herY + 232];
  const dHer = Math.hypot(herHand[0] - herShoulder[0], herHand[1] - herShoulder[1]);
  const lens = (d: number) => Math.min(215, Math.max(105, 0.57 * d));

  // the pour and the drips
  const lipR = (cup.rot * Math.PI) / 180;
  const lip: [number, number] = [cup.x + 34 * Math.cos(lipR) + 112 * Math.sin(lipR), cup.y + 34 * Math.sin(lipR) - 112 * Math.cos(lipR)];
  const drip = (a: number) => { const u = (t - a) / 0.3; return u > 0 && u < 1 ? u : -1; };
  const HIMARM = (
        <g>
          {him.w * (1 - hk) > 0.02 && <g opacity={clamp(him.w * 3) * (1 - hk)}><Pen x={him.pos[0]} y={him.pos[1]} dir={1} /></g>}
          <Arm shoulder={himShoulder} hand={himHand} coat={C.rust} skin={C.skinHim} lens={lens(dHim)} flip={hk > 0.5} />
        </g>);
  const shakeLines = (x: number, y: number, k: number, key: string) => k > 0.05 && Math.floor(t * 20) % 3 !== 0 ? <g key={key} stroke={C.ink} strokeWidth={5} strokeLinecap="round" fill="none" opacity={clamp(k)}>
    <path d={`M ${x - 46} ${y - 18} q -12 14 0 28`} /><path d={`M ${x - 62} ${y - 26} q -16 22 0 44`} />
    <path d={`M ${x + 46} ${y - 18} q 12 14 0 28`} /><path d={`M ${x + 62} ${y - 26} q 16 22 0 44`} />
  </g> : null;
  const penShake = t < 10.2 && t > 3.5 && t < 5.5 ? clamp((t - 3.5) / 1.5) : 0;
  const cupShake = cup.rat * clamp((t - 6.9) / 0.3) * (1 - smooth(t, 7.35, 7.45));
  const bookX = 905 + 70 * smooth(t, 7.5, 7.9);

  return <>
    <g transform={planeT(cam, 0.85)}>
      <Wall /><Window t={t} off={t * 520} /><Sign />
    </g>
    <g transform={planeT(cam, 0.95)}>
      <SeatBack x={150} /><SeatBack x={760} />
    </g>
    <g transform={planeT(cam, 1)}>
      <Door open={doorOpen} />
      {t >= 16.5 && t < 23.4 && <g transform={`translate(1000 690) scale(${1 + 0.18 * Math.max(0, 1 - (t - 16.5) / 0.2)})`} opacity={Math.floor((t - 16.5) * 8) % 2 === 1 && t < 16.9 ? 0.55 : 1}>
        <Sign x={0} y={0} w={350} h={104} text="LAST STOP" fill={C.rust} size={50} />
      </g>}
      <Soft box={[0, 700, 1300, 700]} dx={26} dy={20} blur={16} op={0.28}>
        <rect x={150} y={790} width={250} height={640} rx={46} fill="#000" />
        <rect x={760} y={790} width={250} height={640} rx={46} fill="#000" />
      </Soft>
      <Soft box={[0, 780, 1300, 600]} dx={18} dy={14} blur={10} op={0.3}>
        <g transform="translate(275 840)"><path d="M -70 62 L 50 62 C 96 70 122 112 128 176 L 132 560 L -122 560 L -112 124 C -108 92 -96 72 -70 62 Z" fill="#000" /><circle r={64} /></g>
        <g transform={`translate(${herX} ${herY}) scale(-1 1)`}><path d="M -70 62 L 50 62 C 96 70 122 112 128 176 L 132 560 L -122 560 L -112 124 C -108 92 -96 72 -70 62 Z" fill="#000" /><circle r={64} /></g>
      </Soft>
      <Him t={t} face={hFace} />
      <Her t={t} face={wFace} x={herX} y={herY} flutter={Math.sin(t * 2.4)} />
      <Table />
      <Soft box={[250, 800, 800, 700]} dx={10} dy={16} blur={9} op={0.34}>
        <rect x={p - PW / 2} y={sheetY - 125} width={PW} height={250} rx={10} fill="#000" />
      </Soft>
      <g transform={`translate(${p} ${sheetY})`}><Paper t={t} s={sheet} id={t < 16.95 ? (sheet === SHEET_A ? 'pa' : 'pb') : 'pc'} /></g>
      {/* a drip falls off the table edge */}
      {[7.95, 8.25].map((a, i) => { const u = drip(a); return u > 0 ? <ellipse key={i} cx={470 + i * 26} cy={1150 + u * u * 60} rx={7} ry={11} fill="#4A2A18" opacity={1 - u * 0.4} /> : null; })}
      {hk < 0.3 && HIMARM}
      <Cup x={cup.x} y={cup.y} rot={cup.rot} t={t} steam={1 - clamp(cup.rot / 20)} />
      {cup.pour > 0.02 && <g opacity={cup.pour}>
        <path d={`M ${lip[0]} ${lip[1]} Q ${lip[0] + 8} ${lip[1] + 14} ${lip[0] + 10} 1030`} stroke="#4A2A18" strokeWidth={13} strokeLinecap="round" fill="none" />
        <circle cx={lip[0] + 26} cy={1022} r={7} fill="#4A2A18" /><circle cx={lip[0] - 12} cy={1020} r={5} fill="#4A2A18" /><circle cx={lip[0] + 40} cy={1034} r={4} fill="#4A2A18" />
      </g>}
      {hk >= 0.3 && HIMARM}
      {/* her arm: pen, or hand up at the gasp */}
      <g>
        {gk < 0.3 && <Pen x={her.pos[0]} y={her.pos[1]} dir={-1} />}
        {gk > 0.05 && <g transform={`translate(${herHand[0] - 14} ${herHand[1] - 22}) rotate(-6)`} opacity={clamp(gk * 3)}>
          <rect x={-120} y={8} width={124} height={112} rx={6} fill={C.ink} opacity={0.18} />
          <rect x={-126} y={0} width={124} height={112} rx={6} fill="#FFFFFF" stroke={C.ink} strokeWidth={4} />
          <path d="M -126 56 L -2 56 M -64 0 L -64 112" stroke={C.paperEdge} strokeWidth={4} />
          <path d="M -126 0 L -86 0 L -126 40 Z" fill="#E7E2D3" stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
          <path d="M -86 0 L -126 40 L -86 40 Z" fill="#FFFFFF" stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
        </g>}
        <Arm shoulder={herShoulder} hand={herHand} coat={C.coatHer} skin={C.skinHer} lens={lens(dHer)} />
      </g>
      {shakeLines(him.pos[0] + 40, him.pos[1] + 64, penShake, 'p')}
      {shakeLines(cup.x - 36, cup.y - 46, cupShake, 'c')}
      <Booklet x={bookX} y={1112} />
      <BenchFront />
    </g>
    <g transform={planeT(cam, 1.3)}>
      <rect x={-6} y={-400} width={20} height={3000} fill={C.rust} opacity={0.9} />
    </g>
    {warm > 0 && <rect x={-200} y={-200} width={1500} height={2400} fill={C.orange} opacity={0.16 * warm} />}
  </>;
};

const VoteScene: React.FC<{t: number}> = ({t}) => {
  const pulse = (a: number) => Math.max(0, 1 - Math.abs(t - a) / 0.25);
  const tapAt = t - B.tap;
  const age = t - B.choice;
  const pop = age < 0.2 ? 1 + 0.12 * (1 - age / 0.2) : 1;
  return <g>
    <PosterBg t={t} />
    <g transform={`translate(540 480) rotate(-2) scale(${pop}) translate(-540 -480)`}>
      <rect x={236} y={434} width={620} height={104} rx={12} fill={C.rust} />
      <rect x={226} y={424} width={620} height={104} rx={12} fill={C.paper} stroke={C.ink} strokeWidth={5} />
      <text x={536} y={498} textAnchor="middle" fontFamily={JOST} fontWeight={600} fontSize={60} fill={C.ink}>{spec.choices.clue}</text>
    </g>
    <VoteCard k="A" word={spec.choices.A.l1} len={spec.choices.A.l2} sub={spec.choices.A.sub} y={570} age={t - B.cardA} tint={C.green} pulse={pulse(B.tap) + pulse(B.tap + 1.0)} />
    <VoteCard k="B" word={spec.choices.B.l1} len={spec.choices.B.l2} sub={spec.choices.B.sub} y={870} age={t - B.cardB} tint={C.rust} pulse={pulse(B.tap + 0.5) + pulse(B.tap + 1.5)} />
    {tapAt > 0 && [0, 0.5, 1.0, 1.5].map((d, i) => {
      const a = tapAt - d, cy = i % 2 ? 1060 : 760;
      return a > 0 && a < 0.5 ? <circle key={i} cx={880} cy={cy} r={20 + a * 160} fill="none" stroke={C.ink} strokeWidth={6} opacity={1 - a * 2} /> : null;
    })}
  </g>;
};

const EndCard: React.FC<{t: number}> = ({t}) => {
  const k = smooth(t, B.endcard - 0.02, B.endcard + 0.22);
  if (k <= 0) return null;
  const a = t - B.endcard;
  return <g transform={`translate(0 ${(1 - k) * 1950})`}>
    <PosterBg t={t} dark />
    <rect x={150} y={820} width={780} height={150} rx={16} fill={C.cream} opacity={0.12} />
    {Array.from({length: 7}, (_, i) => <rect key={i} x={158 + i * 110} y={836} width={100} height={118} rx={8} fill={C.paper} stroke={C.ink} strokeWidth={5} opacity={clamp((a - 0.1 - i * 0.05) * 6)} />)}
  </g>;
};

const Scene: React.FC<{t: number; hook: Hook}> = ({t, hook}) => {
  const tv = tvOf(t);
  const cam = camAt(CAM, tv);
  const inTrain = (t >= 10.0 - 0.02 && t <= 10.82) || (t >= B.train2 - 0.02 && t <= B.train2 + 0.82);
  const voteOn = t >= B.train2 + TRAIN_CUT;
  const S = (text: string, y: number, from: number, to: number, size: number, rot: number, hue: 'ink' | 'orange' | 'cream' = 'ink', fade = true) =>
    t >= from && t <= to ? <Strip text={text} y={y} age={t - from} out={fade ? smooth(t, to - 0.12, to) : 0} size={size} rot={rot} hue={hue} /> : null;
  return <MotionBlurWhen fast={inTrain} samples={5} shutter={220}>
    <AbsoluteFill>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, background: C.cream}}>
        {!voteOn && <Carriage t={tv} cam={cam} />}
        {voteOn && <VoteScene t={t} />}
        <EndCard t={t} />
        <PassingTrain t={t} t0={10.0} dir={-1} />
        <PassingTrain t={t} t0={B.train2} dir={1} />
        {/* hook strip: the only thing that differs between variants */}
        {t < 3.0 && <Strip text={(spec.hooks as Record<string, string>)[hook]} y={330} age={1 + t} out={smooth(t, 2.7, 3.0)} size={54} rot={0} maxW={880} />}
        {t < 2.9 && <Strip text="she writes the clues. I fill the boxes." y={1190} age={1 + t} out={smooth(t, 2.7, 2.9)} size={50} rot={-1} />}
        {S('take 1: RELAXED', 360, 3.0, 9.0, 96, -1.5, 'orange')}
        {S('he was not relaxed.', 1190, 6.4, 8.4, 74, 1)}
        {S('rewind. the honest way.', 360, 9.2, 10.0, 84, 1, 'ink', false)}
        {S('take 2: NERVOUS', 360, 10.8, 16.4, 96, 1.5, 'cream')}
        {S('last stop. doors close soon.', 360, 16.8, 19.0, 64, -1)}
        {S("she still doesn't know my name.", 360, 19.0, 22.0, 58, 1)}
        {S('what should he write?', 340, 23.6, 33.5, 62, -1, 'ink')}
        {S('comment A or B', 1190, 28.0, 33.5, 58, 1, 'ink')}
        {t >= B.endcard && <Strip text="seven across" y={380} age={t - B.endcard} out={0} size={124} rot={0} hue="orange" />}
        {t >= B.endcard + 0.15 && <Strip text="part 3 · comment A or B" y={600} age={t - B.endcard - 0.15} out={0} size={66} rot={0} hue="cream" />}
      </svg>
    </AbsoluteFill>
  </MotionBlurWhen>;
};

export const Across2: React.FC<{hook?: Hook}> = ({hook = 'a'}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  return <AbsoluteFill style={{background: C.cream}}>
    <Audio src={staticFile('audio/across-ep2-room.wav')} volume={0.55} />
    <Audio src={staticFile('audio/across-ep2-music.wav')} volume={0.8} />
    <Audio src={staticFile('audio/across-ep2-sfx.wav')} volume={0.9} />
    <Scene t={t} hook={hook} />
  </AbsoluteFill>;
};
