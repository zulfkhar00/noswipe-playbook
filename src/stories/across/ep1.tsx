import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, hold, lerp, smooth} from '../../lib/motion';
import {MotionBlurWhen} from '../../lib/shots';
import {Booklet, Arm, BenchFront, C, Cam, CamKey, Door, Face, Her, Him, Paper, PEN, Pen, Phone, PosterBg, Sign, SeatBack, SheetSpec, Soft, Strip, Table, TRAIN_CUT, VoteCard, Wall, Window, PW, JOST, boxX, camAt, planeT, scribblePos, textW, PassingTrain, STRIPF} from './world';
import spec from '../../../specs/stories/across-ep1.json';

// Seven Across, part 1. 7:42 on a quiet carriage. A stranger (mustard scarf) leaves him crossword
// clues; he answers in the boxes, blushes, looks up from his phone at the sunrise, drafts his own clue
// and lands on "What you're reading (5)". She smiles, leaves one last clue and steps off. Vote A or B.

export const ACROSS1_FPS = 60;
export const ACROSS1_FRAMES = Math.round(spec.duration * ACROSS1_FPS);
const B = spec.beats;
const CL = Object.fromEntries(spec.clues.map((c) => [c.id, c])) as Record<string, (typeof spec.clues)[number]>;
const AU = spec.audio;

export type Hook = 'a' | 'b' | 'c';

// The train slows into her station (26-26.6), stands (to 29.7) and pulls out (to 30.8).
const speedF = (t: number) => (t < 25.9 ? 1 : t < 26.6 ? 1 - smooth(t, 25.9, 26.6) : t < 29.7 ? 0 : smooth(t, 29.7, 30.8));
const OFF: number[] = [0];
for (let i = 1; i <= 2700; i++) OFF.push(OFF[i - 1] + speedF(i / 60) * 520 / 60);
const offAt = (t: number) => OFF[Math.max(0, Math.min(2700, Math.round(t * 60)))];

// ------------------------------------------------------------------------------------- the sheets

const PY = 1020;
const paperDrop = (t: number) => 560 * (smooth(t, 12.7, 13.0) * (1 - smooth(t, 15.9, 16.3)));
const paperX = (t: number) => {
  if (t < B.slideIn) return 600;
  if (t < B.slideIn + 0.6) return lerp(600, 540, smooth(t, B.slideIn, B.slideIn + 0.6));
  if (t < B.slide) return 540;
  if (t < B.slide + 0.6) return lerp(540, 610, smooth(t, B.slide, B.slide + 0.6));
  if (t < 29.0) return 610;
  return lerp(610, 540, smooth(t, 29.0, 29.6));
};

type Sheet = {from: number; to: number; s: SheetSpec};
const SHEETS: Sheet[] = [
  {from: 0, to: B.clue2, s: {text: CL.c1.text, n: 7, by: 'her', letters: {s: 'SWIPING', from: CL.c1.fillFrom!, step: 0.4, ink: C.green}}},
  {from: B.clue2, to: B.draftHey, s: {text: CL.c2.text, n: 4, by: 'her', reveal: [B.clue2, 10.9], letters: {s: 'VIEW', from: CL.c2.fillFrom!, step: 0.2, ink: C.green}}},
  {from: B.draftHey, to: B.draftDay, s: {text: CL.d1.text, n: 3, by: 'him', reveal: [B.draftHey, 17.0], scribble: [CL.d1.scribbleFrom!, CL.d1.scribbleTo!]}},
  {from: B.draftDay, to: B.clue3, s: {text: CL.d2.text, n: 7, groups: [4], by: 'him', reveal: [B.draftDay, 18.7], scribble: [CL.d2.scribbleFrom!, CL.d2.scribbleTo!]}},
  {from: B.clue3, to: B.lastClue, s: {text: CL.c3.text, n: 5, by: 'him', reveal: [B.clue3, 20.6], letters: {s: 'CLUES', from: CL.c3.fillFrom!, step: 0.25, ink: C.green}, underline: [CL.c3.underlineFrom!, CL.c3.underlineTo!]}},
  {from: B.lastClue, to: 99, s: {text: CL.c4.text, n: 7, by: 'her', reveal: [B.lastClue, 28.6]}},
];

// Writing acts: who holds the pen, when, and where the pen tip is (paper-local coordinates).
type Act = {who: 'him' | 'her'; a: number; b: number; tip: (t: number) => [number, number]};
const textTip = (text: string, a: number, b: number) => (t: number): [number, number] => {
  const w = textW(text), u = clamp((t - a) / (b - a));
  return [-w / 2 + w * u, -50 + Math.sin(t * 38) * 4];
};
const fillTip = (n: number, groups: number[] | undefined, from: number, step: number) => (t: number): [number, number] => {
  const i = Math.max(0, Math.min(n - 1, Math.floor((t - from) / step)));
  return [boxX(n, i, groups) + Math.sin(t * 50) * 8, 50 + Math.cos(t * 45) * 5];
};
const scribTip = (a: number, b: number) => (t: number) => scribblePos((t - a) / (b - a));
const ACTS: Act[] = [
  {who: 'him', a: 7.0, b: 9.8, tip: fillTip(7, undefined, 7.2, 0.4)},
  {who: 'her', a: 10.4, b: 10.9, tip: textTip(CL.c2.text, 10.4, 10.9)},
  {who: 'him', a: 11.8, b: 12.6, tip: fillTip(4, undefined, 11.8, 0.2)},
  {who: 'him', a: 16.4, b: 17.0, tip: textTip(CL.d1.text, 16.4, 17.0)},
  {who: 'him', a: 17.4, b: 17.9, tip: scribTip(17.4, 17.9)},
  {who: 'him', a: 18.2, b: 18.7, tip: textTip(CL.d2.text, 18.2, 18.7)},
  {who: 'him', a: 19.0, b: 19.5, tip: scribTip(19.0, 19.5)},
  {who: 'him', a: 19.8, b: 20.6, tip: textTip(CL.c3.text, 19.8, 20.6)},
  {who: 'her', a: 22.0, b: 23.2, tip: fillTip(5, undefined, 22.0, 0.25)},
  {who: 'her', a: 23.4, b: 23.8, tip: (t) => { const u = clamp((t - 23.4) / 0.4); return [lerp(boxX(5, 0) - 20, boxX(5, 4) + 20, u), 70]; }},
  {who: 'her', a: 27.4, b: 28.6, tip: textTip(CL.c4.text, 27.4, 28.6)},
];
const REST = {him: [430, 1110] as [number, number], her: [790, 1060] as [number, number]};

/** Where each hand is (world coords), and whether it holds the pen. */
const handFor = (who: 'him' | 'her', t: number) => {
  const px = paperX(t);
  let best: {w: number; pos: [number, number]} = {w: 0, pos: REST[who]};
  ACTS.forEach((act, i) => {
    if (act.who !== who || t < act.a - 0.35 || t > act.b + 0.35) return;
    const prev = ACTS[i - 1] && ACTS[i - 1].who === who && act.a - ACTS[i - 1].b < 0.7 ? ACTS[i - 1] : null;
    const next = ACTS[i + 1] && ACTS[i + 1].who === who && ACTS[i + 1].a - act.b < 0.7 ? ACTS[i + 1] : null;
    const wi = prev ? 1 : smooth(t, act.a - 0.35, act.a), wo = next ? 1 : 1 - smooth(t, act.b, act.b + 0.35);
    const w = wi * wo;
    let tip = act.tip(clamp(t, act.a, act.b));
    if (prev) { const p0 = prev.tip(prev.b); const k = smooth(t, act.a - 0.1, act.a + 0.1); tip = [lerp(p0[0], tip[0], k), lerp(p0[1], tip[1], k)]; }
    best = {w, pos: [px + tip[0], PY + tip[1]]};
  });
  const pos: [number, number] = [lerp(REST[who][0] + (who === 'him' ? 0 : 0), best.pos[0], best.w), lerp(REST[who][1], best.pos[1], best.w)];
  return {pos, w: best.w};
};

// ------------------------------------------------------------------------------------- the cast over time

const key = <T,>(t: number, ks: [number, T][]): T => { let v = ks[0][1]; for (const [a, b] of ks) if (t >= a) v = b; return v; };
type P = {look: [number, number]; mouth: Face['mouth']; brow: number; rot: number};
const himPose = (t: number): P => key<P>(t, [
  [0, {look: [3, 12], mouth: 'flat', brow: 0, rot: 5}],
  [3.6, {look: [8, 14], mouth: 'flat', brow: 0.3, rot: 7}],
  [B.buzz, {look: [8, 2], mouth: 'o', brow: 0.7, rot: 0}],
  [6.1, {look: [8, 14], mouth: 'flat', brow: 0.3, rot: 6}],
  [B.fillStart, {look: [4, 12], mouth: 'flat', brow: 0, rot: 6}],
  [9.6, {look: [-4, 10], mouth: 'wince', brow: 0.6, rot: 9}],
  [B.clue2, {look: [4, 10], mouth: 'flat', brow: 0.2, rot: 5}],
  [12.6, {look: [3, 0], mouth: 'o', brow: 0.6, rot: 0}],
  [B.lookUp, {look: [4, -12], mouth: 'smile', brow: 0.8, rot: -14}],
  [14.0, {look: [4, -12], mouth: 'smile', brow: 0.4, rot: -12}],
  [15.6, {look: [4, 10], mouth: 'flat', brow: 0.5, rot: 4}],
  [B.draftHey, {look: [4, 11], mouth: 'flat', brow: 0.9, rot: 6}],
  [18.0, {look: [4, 6], mouth: 'wince', brow: 0.8, rot: 4}],
  [B.clue3, {look: [4, 11], mouth: 'smile', brow: 0.2, rot: 5}],
  [B.slide + 0.4, {look: [8, 0], mouth: 'smile', brow: 0.7, rot: 1}],
  [B.cluesFill, {look: [6, 8], mouth: 'smile', brow: 0.3, rot: 3}],
  [B.smile, {look: [8, 0], mouth: 'grin', brow: 0.5, rot: 0}],
  [26.3, {look: [8, -2], mouth: 'smile', brow: 0.5, rot: 0}],
  [B.stepOff, {look: [8, 0], mouth: 'o', brow: 0.8, rot: 0}],
  [B.stare, {look: [4, 12], mouth: 'flat', brow: 0.6, rot: 5}],
]);
const himBlush = (t: number) => {
  if (t < B.blush) return t > 5.5 && t < 6.6 ? 0.15 : 0;
  if (t < B.blush + 0.35) return smooth(t, B.blush, B.blush + 0.35);
  if (t < 12.6) return 1;
  if (t < 15) return lerp(1, 0.1, smooth(t, 12.6, 15));
  if (t < B.smile) return 0.1;
  if (t < 25.4) return lerp(0.1, 0.7, smooth(t, B.smile, B.smile + 0.4));
  if (t < B.stare) return 0.5;
  return 0.7;
};
const herPose = (t: number): P => key<P>(t, [
  [0, {look: [8, 6], mouth: 'smile', brow: 0, rot: 0}],
  [B.slideIn, {look: [8, 12], mouth: 'smile', brow: 0, rot: 2}],
  [B.fillStart, {look: [10, 4], mouth: 'smile', brow: 0.3, rot: -2}],
  [10.4, {look: [8, 12], mouth: 'smile', brow: 0, rot: 3}],
  [11.0, {look: [10, 4], mouth: 'smile', brow: 0.2, rot: 0}],
  [B.lookUp, {look: [10, -2], mouth: 'smile', brow: 0.3, rot: -1}],
  [B.clue3 + 1.2, {look: [8, 12], mouth: 'smile', brow: 0.1, rot: 3}],
  [B.smile, {look: [10, -2], mouth: 'grin', brow: 0.4, rot: -2}],
  [26.0, {look: [6, 4], mouth: 'smile', brow: 0, rot: 0}],
  [B.lastClue, {look: [8, 12], mouth: 'smile', brow: 0, rot: 3}],
  [28.8, {look: [10, -2], mouth: 'grin', brow: 0.4, rot: -2}],
]);

// ------------------------------------------------------------------------------------- the camera

const PAP = 1040;
const CAM: CamKey[] = [
  {t: 0, x: 580, y: 1000, z: 1.36}, {t: 3.3, x: 585, y: 1000, z: 1.4},
  {t: 3.0 + TRAIN_CUT, x: 560, y: 980, z: 1.0, cut: true}, {t: 3.8, x: 560, y: 980, z: 1.0}, {t: B.panToThem, x: 580, y: 880, z: 1.4},
  {t: 5.4, x: 330, y: 930, z: 1.9}, {t: 6.2, x: 330, y: 940, z: 1.9}, {t: 7.0, x: 540, y: PAP, z: 2.0},
  {t: 9.3, x: 540, y: PAP, z: 2.0}, {t: 9.65, x: 450, y: 1010, z: 1.5}, {t: 10.3, x: 450, y: 1010, z: 1.5}, {t: 10.8, x: 540, y: PAP, z: 2.0},
  {t: 12.6, x: 540, y: PAP, z: 2.0}, {t: 12.95, x: 300, y: 860, z: 1.8}, {t: 13.0, x: 300, y: 860, z: 1.8}, {t: 13.7, x: 580, y: 800, z: 1.2},
  {t: 13.9, x: 580, y: 800, z: 1.2}, {t: 14.2, x: 330, y: 1050, z: 1.8}, {t: 14.7, x: 330, y: 1050, z: 1.8}, {t: 15.2, x: 580, y: 800, z: 1.2},
  {t: 15.6 + TRAIN_CUT, x: 540, y: PAP, z: 2.0, cut: true}, {t: 20.8, x: 540, y: PAP, z: 2.0}, {t: 21.6, x: 610, y: PAP, z: 2.0},
  {t: 23.85, x: 610, y: PAP, z: 2.0}, {t: 24.3, x: 880, y: 920, z: 1.9},
  {t: 25.4 + TRAIN_CUT, x: 800, y: 930, z: 1.4, cut: true}, {t: 27.0, x: 800, y: 930, z: 1.4}, {t: 27.5, x: 700, y: 1010, z: 1.5},
  {t: 28.7, x: 700, y: 1010, z: 1.5}, {t: 29.0, x: 800, y: 930, z: 1.4}, {t: 29.7, x: 800, y: 930, z: 1.4}, {t: 30.1, x: 450, y: 870, z: 1.3},
  {t: 30.9, x: 450, y: 870, z: 1.3}, {t: 31.4, x: 540, y: PAP, z: 2.0}, {t: 40, x: 540, y: PAP, z: 2.0},
];

// ------------------------------------------------------------------------------------- the scene

const Carriage: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const sheet = (() => { let s = SHEETS[0]; for (const x of SHEETS) if (t >= x.from) s = x; return s; })();
  const idx = SHEETS.indexOf(sheet);
  const prevSheet = idx > 0 && t < sheet.from + 0.25 ? SHEETS[idx - 1] : null;
  const px = paperX(t);
  const enter = smooth(t, sheet.from, sheet.from + 0.22);
  const him = handFor('him', t), her = handFor('her', t);
  const station = smooth(t, 26.0, 26.6) * (1 - smooth(t, 30.4, 31.1));
  const walkerX = 900 - 85 * (t - 29.55) - (offAt(t) - offAt(29.7)) * 0.9;
  const walkerOp = smooth(t, 29.55, 29.7) * (1 - smooth(t, 30.7, 31.1));

  // her exit
  const exitK = smooth(t, B.stepOff, B.stepOff + 0.55);
  const standK = smooth(t, 28.8, B.stepOff);
  const herX = 885 + 240 * exitK, herY = 840 - 55 * standK + Math.sin(t * 14) * 4 * exitK;
  const herOpacity = 1 - smooth(t, B.stepOff + 0.35, B.stepOff + 0.58);
  const herGone = t > B.stepOff + 0.6;

  const doorOpen = smooth(t, B.doorsOpen, B.doorsOpen + 0.5) * (1 - smooth(t, B.doorsClose, B.doorsClose + 0.35));
  const pf = himPose(t), hf = herPose(t);
  const hFace: Face = {...pf, blush: himBlush(t), cheek: himBlush(t)};
  const wFace: Face = {...hf, blush: 0, cheek: 0.5};

  // phone: swiping until the paper arrives, then held still; hidden at hidePhone
  const hide = smooth(t, B.hidePhone, B.hidePhone + 0.4);
  const swiping = t < B.slideIn;
  const cyc = (t % 0.8) / 0.8;
  const swipe = swiping ? smooth(cyc, 0.05, 0.3) * (cyc < 0.36 ? 1 : 0) : 0;
  const heartAge = swiping ? ((t % 0.8) - 0.22) / 0.62 : -1;
  const buzz1 = clamp(1 - Math.abs(t - (B.buzz + 0.25)) / 0.3) * 1.2;
  const buzz2 = clamp(1 - Math.abs(t - (B.buzz2 + 0.4)) / 0.5) * 1.2;
  const pre = smooth(t, B.slideIn, B.slideIn + 0.6);
  const phoneHand: [number, number] = [lerp(lerp(345, 295, pre), 290, hide), lerp(lerp(1082, 1160, pre), 1150, hide)];
  const phonePos: [number, number] = [lerp(lerp(352, 300, pre), 280, hide), lerp(lerp(1008, 1100, pre), 1100, hide)];

  const hands = (who: 'him' | 'her') => {
    const h = who === 'him' ? him : her;
    const dir = who === 'him' ? 1 : -1;
    const gw = who === 'her' ? 1 : h.w;
    const hand: [number, number] = [h.pos[0] + dir * 40 * gw, h.pos[1] + 64 * gw];
    const coat = who === 'him' ? C.rust : C.coatHer, skin = who === 'him' ? C.skinHim : C.skinHer;
    const shoulder: [number, number] = who === 'him' ? [285, 1072] : [885, 1072];
    return <g>
      {(h.w > 0.02 || who === 'her') && <g opacity={who === 'her' ? 1 : clamp(h.w * 3)}><Pen x={h.pos[0]} y={h.pos[1]} dir={dir as 1 | -1} /></g>}
      <Arm shoulder={shoulder} hand={h.w > 0.02 || who === 'her' ? hand : h.pos} coat={coat} skin={skin} />
    </g>;
  };

  return <>
    <g transform={planeT(cam, 0.85)}>
      <Wall /><Window t={t} off={offAt(t)} station={station} platX={-(offAt(t) - offAt(29.7))} walkerX={walkerX} walkerOp={walkerOp} /><Sign />
    </g>
    <g transform={planeT(cam, 0.95)}>
      <SeatBack x={150} /><SeatBack x={760} />
    </g>
    <g transform={planeT(cam, 1)}>
      <Door open={doorOpen} />
      <Soft box={[0, 700, 1300, 700]} dx={26} dy={20} blur={16} op={0.28}>
        <rect x={150} y={790} width={250} height={640} rx={46} fill="#000" />
        <rect x={760} y={790} width={250} height={640} rx={46} fill="#000" />
      </Soft>
      <Soft box={[0, 780, 1300, 600]} dx={18} dy={14} blur={10} op={0.3}>
        <g transform="translate(275 840)"><path d="M -70 62 L 50 62 C 96 70 122 112 128 176 L 132 560 L -122 560 L -112 124 C -108 92 -96 72 -70 62 Z" fill="#000" /><circle r={64} /></g>
        {!herGone && <g transform={`translate(${herX} ${herY}) scale(-1 1)`} opacity={herOpacity}><path d="M -70 62 L 50 62 C 96 70 122 112 128 176 L 132 560 L -122 560 L -112 124 C -108 92 -96 72 -70 62 Z" fill="#000" /><circle r={64} /></g>}
      </Soft>
      <Him t={t} face={hFace} />
      {!herGone && <g opacity={herOpacity}><Her t={t} face={wFace} x={herX} y={herY} flutter={Math.sin(t * 2.4)} /></g>}
      <Table />
      <Soft box={[300, 800, 700, 460]} dx={10} dy={16} blur={9} op={0.34}>
        <rect x={px - PW / 2} y={PY - 125 + paperDrop(t)} width={PW} height={250} rx={10} fill="#000" />
      </Soft>
      {/* the paper, propped on the table between them */}
      {prevSheet && <g transform={`translate(${px} ${PY + paperDrop(t)})`}><Paper t={t} s={prevSheet.s} id={`p${idx - 1}`} /></g>}
      <g transform={`translate(${px} ${PY + paperDrop(t) + (1 - enter) * (idx > 0 ? 56 : 0)})`} opacity={idx > 0 ? 0.2 + 0.8 * enter : 1}><Paper t={t} s={sheet.s} id={`p${idx}`} /></g>
      {/* his phone hand, behind the phone */}
      <Arm shoulder={[265, 990]} hand={phoneHand} coat={C.rust} skin={C.skinHim} />
      <g transform={`translate(${phonePos[0]} ${phonePos[1]}) rotate(${lerp(-6, 0, hide)})`}>
        <Phone t={t} shake={Math.max(buzz1, buzz2)} swipe={swipe} hearts={[heartAge]} thumb={t < B.hidePhone + 0.05} faceDown={hide > 0.5} />
        {(buzz1 > 0 || buzz2 > 0) && hide < 0.5 && <g transform="translate(34 -62)"><circle r={17} fill={C.rust} stroke={C.cream} strokeWidth={3} /><path d="M 0 8 C -14 -2 -8 -14 0 -6 C 8 -14 14 -2 0 8 Z" fill={C.cream} /></g>}
      </g>
      {hands('him')}
      {!herGone && <g opacity={herOpacity}>{hands('her')}</g>}
      {t >= B.buzz2 - 0.1 && t < 15 && <g />}
      <Booklet x={905} y={1112} />
      <BenchFront />
    </g>
    <g transform={planeT(cam, 1.3)}>
      <rect x={-6} y={-400} width={20} height={3000} fill={C.rust} opacity={0.9} />
    </g>
  </>;
};

const VoteScene: React.FC<{t: number}> = ({t}) => {
  const pulse = (a: number) => Math.max(0, 1 - Math.abs(t - a) / 0.25);
  const tapAt = (t - B.tap);
  return <g>
    <PosterBg t={t} />
    <VoteCard k="A" word={spec.choices.A.l1} len={spec.choices.A.l2} y={630} age={t - B.cardA} tint={C.green} pulse={pulse(B.tap) + pulse(B.tap + 1.0)} />
    <VoteCard k="B" word={spec.choices.B.l1} len={spec.choices.B.l2} y={950} age={t - B.cardB} tint={C.rust} pulse={pulse(B.tap + 0.5) + pulse(B.tap + 1.5)} />
    {tapAt > 0 && [0, 0.5, 1.0, 1.5].map((d, i) => {
      const a = tapAt - d, cy = i % 2 ? 1085 : 760;
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
  const cam = camAt(CAM, t);
  const inTrain = [B.train1, B.train2, B.train3, B.train4].some((a) => t >= a - 0.02 && t <= a + 0.82);
  const voteOn = t >= B.train4 + TRAIN_CUT;
  const strips = spec.strips;
  return <MotionBlurWhen fast={inTrain} samples={5} shutter={220}>
    <AbsoluteFill>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, background: C.cream}}>
        {!voteOn && <Carriage t={t} cam={cam} />}
        {voteOn && <VoteScene t={t} />}
        <EndCard t={t} />
        {[B.train1, B.train2, B.train3, B.train4].map((a) => <PassingTrain key={a} t={t} t0={a} />)}
        {/* hook strip: the only thing that differs between variants */}
        {t < B.train1 + 0.05 && <Strip text={(spec.hooks as Record<string, string>)[hook]} y={330} age={1 + t} out={smooth(t, 2.7, 3.0)} size={54} rot={0} maxW={880} />}
        {strips.map((s, i) => {
          if (t < s.from || t > s.to + 0.4) return null;
          const hold2 = s.text.startsWith('he knows') ? 0.3 : 0;
          if (t > s.to + hold2) return null;
          const out = smooth(t, s.to + hold2 - 0.12, s.to + hold2);
          const text = s.text;
          const isEnd = (s as {big?: boolean}).big;
          return <Strip key={i} text={text} y={s.y === 450 ? 530 : s.y === 1150 && s.text.startsWith('first') ? 1190 : s.y} age={t - s.from} out={isEnd ? 0 : out} size={isEnd ? 100 : s.y === 450 ? 72 : s.y === 380 ? 64 : 58} rot={isEnd ? 0 : i % 2 ? 1 : -1.2} hue={isEnd ? 'orange' : 'ink'} />;
        })}
      </svg>
    </AbsoluteFill>
  </MotionBlurWhen>;
};

export const Across1: React.FC<{hook?: Hook}> = ({hook = 'a'}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  return <AbsoluteFill style={{background: C.cream}}>
    <Audio src={staticFile('audio/across-ep1-room.wav')} volume={0.55} />
    <Audio src={staticFile('audio/across-ep1-music.wav')} volume={0.8} />
    <Audio src={staticFile('audio/across-ep1-sfx.wav')} volume={0.9} />
    <Scene t={t} hook={hook} />
  </AbsoluteFill>;
};
