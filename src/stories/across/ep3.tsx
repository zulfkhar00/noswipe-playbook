import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, lerp, smooth} from '../../lib/motion';
import {MotionBlurWhen} from '../../lib/shots';
import {Arm, BenchFront, Booklet, C, Cam, CamKey, Door, Face, Her, Him, JOST, PassingTrain, Paper, Pen, PosterBg, Sign, SeatBack, SheetSpec, Soft, Strip, Table, TRAIN_CUT, VoteCard, Wall, Window, PW, boxX, camAt, planeT, textW} from './world';
import spec from '../../../specs/stories/across-ep3.json';

// Seven Across, part 3 "Four boxes". Last stop, doors open, she is at the door. Take 1: he writes DUKE with his
// chin up, his phone lights up "Mum: Dave, call me back", he slaps it face down; the opposite train runs the other
// way as the rewind. Take 2: phone face down on purpose, he writes DAVE, she comes back and fills IRIS (her name)
// in green ink, sits down by her own choice, the doors close and the train rolls. New clue "Look at the (6)".
// Vote: A SCREEN or B WINDOW. As in part 2, everything in the carriage is a pure function of story time tv,
// which runs backwards during the rewind.

export const ACROSS3_FPS = 60;
export const ACROSS3_FRAMES = Math.round(spec.duration * ACROSS3_FPS);
const B = spec.beats;

export type Hook = 'a' | 'b';

const REWIND = [6.4, 7.0] as const;
const CUT_B = 7.0 + TRAIN_CUT;
const tvOf = (t: number) => (t < REWIND[0] ? t : t < REWIND[1] ? lerp(6.4, 3.0, smooth(t, REWIND[0], REWIND[1])) : t < CUT_B ? 3.0 : t);

// ------------------------------------------------------------------------------------- sheets

const PY = 1020;
const px = (t: number) => (t < 14.35 ? 660 : t < 15.8 ? 760 : lerp(760, 540, smooth(t, 15.8, 16.3)));
const INK_HIM = '#243B6B';
const CLUE1 = 'Who you are (4)';
const SHEET_1: SheetSpec = {text: CLUE1, n: 4, by: 'her', size: 52, letters: {s: 'DUKE', from: 3.2, step: 0.3, ink: INK_HIM}};
const SHEET_2: SheetSpec = {text: CLUE1, n: 4, by: 'her', size: 52, letters: {s: 'DAVE', from: 8.4, step: 0.3, ink: INK_HIM},
  row2: {n: 4, s: 'IRIS', boxesFrom: 10.4, from: 11.0, step: 0.3, ink: C.green, bw: 56, y: 74}, extra: 36};
const SHEET_3: SheetSpec = {text: 'Look at the (6)', n: 6, by: 'her', size: 52, reveal: [14.6, 15.6]};

// ------------------------------------------------------------------------------------- the phone

const PH0 = {x: 352, y: 1106};
const phoneState = (t: number, tv: number) => {
  if (t < CUT_B) {
    const u = smooth(tv, 5.78, 5.92);
    const buzz = tv > 4.7 && tv < 5.55 ? (Math.sin(tv * 2 * Math.PI * 6) > -0.2 ? 1 : 0.15) : 0;
    return {x: PH0.x, y: PH0.y + 6 * Math.sin(Math.PI * clamp((tv - 5.78) / 0.14)), lit: smooth(tv, 4.7, 4.78) * (u > 0.5 ? 0 : 1), down: u > 0.5, sq: Math.abs(Math.cos(Math.PI * u)), buzz};
  }
  const u = smooth(t, 8.0, 8.2);
  return {x: lerp(PH0.x, 312, smooth(t, 8.15, 8.45)), y: PH0.y, lit: 0, down: u > 0.5, sq: Math.abs(Math.cos(Math.PI * u)), buzz: 0};
};

const TPhone: React.FC<{x: number; y: number; lit: number; down: boolean; sq: number; buzz: number; t: number}> = ({x, y, lit, down, sq, buzz, t}) => {
  const sx = buzz ? Math.sin(t * 150) * 4 * buzz : 0, sy = buzz ? Math.cos(t * 130) * 3 * buzz : 0;
  return <g transform={`translate(${x + sx} ${y + sy}) rotate(-6) scale(${1.4 * Math.max(sq, 0.04)} 1.4)`}>
    {lit > 0.01 && <ellipse cx={0} cy={0} rx={96} ry={110} fill={C.lit} opacity={0.5 * lit} />}
    <rect x={-34} y={-58} width={68} height={116} rx={12} fill={C.ink} opacity={0.25} transform="translate(6 8)" />
    {down ? <g>
      <rect x={-34} y={-58} width={68} height={116} rx={12} fill="#3B403E" stroke={C.cream} strokeWidth={3} />
      <circle cx={-16} cy={-40} r={10} fill={C.ink} /><circle cx={-16} cy={-40} r={5} fill="#555B58" />
    </g> : <g>
      <rect x={-34} y={-58} width={68} height={116} rx={12} fill={C.ink} stroke={C.cream} strokeWidth={3} />
      <rect x={-29} y={-52} width={58} height={104} rx={8} fill={lit > 0.5 ? C.lit : '#2A302D'} />
      {lit > 0.5 ? <g><rect x={-20} y={-30} width={40} height={7} rx={3} fill={C.ink} opacity={0.5} /><rect x={-20} y={-16} width={30} height={7} rx={3} fill={C.ink} opacity={0.5} /></g>
        : <path d="M -29 -20 L 4 -52 L 20 -52 L -29 0 Z" fill={C.cream} opacity={0.1} />}
    </g>}
  </g>;
};

// ------------------------------------------------------------------------------------- hands

type Act = {who: 'him' | 'her'; a: number; b: number; tip: (t: number) => [number, number]};
const fillTip = (n: number, from: number, step: number, jit: number) => (t: number): [number, number] => {
  const i = Math.max(0, Math.min(n - 1, Math.floor((t - from) / step)));
  return [boxX(n, i) + Math.sin(t * 50) * jit, 50 + Math.cos(t * 45) * jit * 0.6];
};
const hover = (t: number): [number, number] => [boxX(4, 0) + Math.sin(t * 9) * 2, 62 + Math.sin(t * 7) * 2];
const row2x = (i: number) => -17 + i * 62;
const tipIris = (t: number): [number, number] => {
  if (t < 11.0) { const u = smooth(t, 10.4, 10.95); return [lerp(row2x(0) - 30, row2x(3) + 10, u), 104 + Math.sin(t * 40) * 4]; }
  const i = Math.max(0, Math.min(3, Math.floor((t - 11.0) / 0.3)));
  return [row2x(i) + Math.sin(t * 50) * 4, 122 + Math.cos(t * 45) * 3];
};
const tipClue = (t: number): [number, number] => {
  const w = textW('Look at the (6)') * 52 / 42 * 1.1, u = clamp((t - 14.6) / 1.0);
  return [-w / 2 + w * u, -50 + Math.sin(t * 38) * 4];
};
const ACTS: Act[] = [
  {who: 'him', a: 0, b: 4.7, tip: (t) => (t < 3.2 ? hover(t) : fillTip(4, 3.2, 0.3, 2)(t))},
  {who: 'him', a: 7.2, b: 10.0, tip: (t) => (t < 8.4 ? hover(t) : fillTip(4, 8.4, 0.3, 2)(t))},
  {who: 'her', a: 10.2, b: 12.15, tip: tipIris},
  {who: 'her', a: 14.5, b: 15.7, tip: tipClue},
  {who: 'her', a: 15.7, b: 16.4, tip: () => [262, 30]},
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

// ------------------------------------------------------------------------------------- acting

const key = <T,>(t: number, ks: [number, T][]): T => { let v = ks[0][1]; for (const [a, b] of ks) if (t >= a) v = b; return v; };
type P = {look: [number, number]; mouth: Face['mouth']; brow: number; rot: number};
const himPose = (t: number): P => key<P>(t, [
  [0, {look: [3, 12], mouth: 'flat', brow: 0, rot: 5}],
  [1.0, {look: [8, -2], mouth: 'flat', brow: 0.4, rot: 1}],
  [1.9, {look: [4, 12], mouth: 'flat', brow: 0.2, rot: 5}],
  [3.2, {look: [8, 4], mouth: 'smile', brow: 0.3, rot: -7}],    // chin up, cool smirk
  [4.4, {look: [10, -2], mouth: 'smile', brow: 0.4, rot: -8}],
  [4.7, {look: [4, 18], mouth: 'flat', brow: 0.6, rot: 4}],
  [5.2, {look: [8, 2], mouth: 'o', brow: 0.9, rot: 2}],
  [5.85, {look: [4, 14], mouth: 'wince', brow: 0.8, rot: 8}],
  [CUT_B, {look: [3, 12], mouth: 'flat', brow: 0, rot: 5}],
  [8.0, {look: [4, 16], mouth: 'flat', brow: 0.2, rot: 6}],
  [8.4, {look: [4, 13], mouth: 'flat', brow: 0.2, rot: 6}],
  [9.6, {look: [9, 0], mouth: 'flat', brow: 0.5, rot: 0}],
  [10.1, {look: [9, -4], mouth: 'smile', brow: 0.5, rot: -1}],
  [11.0, {look: [4, 10], mouth: 'smile', brow: 0.3, rot: 3}],
  [12.2, {look: [9, 0], mouth: 'grin', brow: 0.5, rot: -2}],
  [13.0, {look: [9, -2], mouth: 'smile', brow: 0.7, rot: -1}],
  [14.3, {look: [6, 8], mouth: 'smile', brow: 0.4, rot: 2}],
  [16.4, {look: [4, 13], mouth: 'flat', brow: 0.3, rot: 5}],
  [16.8, {look: [2, 20], mouth: 'flat', brow: 0.6, rot: 6}],
  [17.4, {look: [10, -10], mouth: 'o', brow: 0.9, rot: -3}],
]);
const himBlush = (t: number) => {
  if (t < CUT_B) {
    if (t < 1.0) return 0;
    if (t < 3.2) return lerp(0, 0.25, smooth(t, 1.0, 3.2));
    if (t < 4.7) return 0.3;
    if (t < 6.2) return lerp(0.3, 1, smooth(t, 4.9, 6.2));
    return 1;
  }
  if (t < 8.4) return 0.05;
  if (t < 9.7) return lerp(0.05, 0.6, smooth(t, 8.4, 9.7));
  if (t < 10.2) return lerp(0.6, 0.85, smooth(t, 9.7, 10.2));
  if (t < 16.8) return lerp(0.85, 0.5, smooth(t, 10.5, 14));
  return 0.7;
};
const herPose = (t: number): P => key<P>(t, [
  [0, {look: [8, 12], mouth: 'smile', brow: 0, rot: 0}],
  [1.0, {look: [10, 0], mouth: 'smile', brow: 0.2, rot: -1}],
  [3.2, {look: [10, 6], mouth: 'smile', brow: 0.2, rot: 0}],
  [5.2, {look: [8, 14], mouth: 'smile', brow: 0.1, rot: 1}],    // a polite glance down at the buzzing phone
  [5.6, {look: [8, -8], mouth: 'smile', brow: 0.6, rot: -2}],  // and out of the window
  [CUT_B, {look: [8, 12], mouth: 'smile', brow: 0, rot: 0}],
  [8.4, {look: [10, 4], mouth: 'smile', brow: 0.2, rot: 0}],
  [9.6, {look: [8, 14], mouth: 'smile', brow: 0.3, rot: 1}],
  [10.0, {look: [10, 2], mouth: 'smile', brow: 0.5, rot: -1}],
  [10.4, {look: [8, 16], mouth: 'smile', brow: 0.3, rot: 1}],
  [12.2, {look: [10, 2], mouth: 'smile', brow: 0.5, rot: -2}],
  [12.9, {look: [-12, 0], mouth: 'flat', brow: 0.3, rot: 3}],   // steps toward the door, glances at it
  [13.4, {look: [8, 14], mouth: 'smile', brow: 0.5, rot: 1}],   // looks back at her boxes, a warm small smile
  [13.8, {look: [10, 0], mouth: 'smile', brow: 0.6, rot: -2}],
  [14.3, {look: [8, 12], mouth: 'smile', brow: 0.5, rot: 2}],
  [15.6, {look: [4, 10], mouth: 'smile', brow: 0.3, rot: -1}],
  [16.4, {look: [10, 0], mouth: 'smile', brow: 0.4, rot: -1}],
  [17.4, {look: [4, -10], mouth: 'smile', brow: 0.4, rot: -3}],
]);
const herBlush = (t: number) => (t < CUT_B ? 0 : t < 10.0 ? 0 : t < 12.2 ? smooth(t, 10.0, 12.2) * 0.85 : t < 16.4 ? 0.85 : lerp(0.85, 0.4, smooth(t, 16.4, 18)));

// ------------------------------------------------------------------------------------- the train

/** distance the scenery has travelled: 0 while stopped at the last stop, rolls out at 14.9, eases right down by 17.9. */
const travel = (t: number) => {
  let s = 0;
  for (let u = 14.9; u < Math.min(t, 18.3); u += 0.02) {
    const v = smooth(u, 14.9, 16.4) * (1 - 0.85 * smooth(u, 17.0, 17.9));
    s += v * 0.02;
  }
  return s * 520;
};

// ------------------------------------------------------------------------------------- the camera

const CAM: CamKey[] = [
  {t: 0, x: 660, y: 1010, z: 1.0}, {t: 2.9, x: 690, y: 1020, z: 1.1}, {t: 5.8, x: 690, y: 1020, z: 1.12}, {t: 6.4, x: 690, y: 1020, z: 1.12},
  {t: CUT_B, x: 660, y: 1010, z: 1.0, cut: true}, {t: 7.75, x: 660, y: 1010, z: 1.0},
  {t: 7.97, x: 470, y: 1080, z: 1.75}, {t: 8.3, x: 470, y: 1080, z: 1.75}, {t: 8.65, x: 620, y: 1050, z: 1.28}, {t: 9.7, x: 620, y: 1050, z: 1.28},
  {t: 10.0, x: 680, y: 1010, z: 1.12}, {t: 10.5, x: 640, y: 1050, z: 1.2}, {t: 12.0, x: 640, y: 1050, z: 1.2}, {t: 12.6, x: 680, y: 1010, z: 1.08},
  {t: 15.5, x: 680, y: 1010, z: 1.08},
  {t: 15.95, x: 640, y: 1020, z: 1.18}, {t: 16.4, x: 600, y: 1030, z: 1.2}, {t: 17.9, x: 600, y: 1040, z: 1.3}, {t: 40, x: 600, y: 1040, z: 1.3},
];

// ------------------------------------------------------------------------------------- the scene

const Carriage: React.FC<{t: number; tv: number; cam: Cam}> = ({t, tv, cam}) => {
  const p = px(t);
  // sheets
  const drop = 560 * smooth(t, 14.1, 14.35), rise = 560 * (1 - smooth(t, 14.4, 14.65));
  const sheet = tv < CUT_B - 0.001 && t < CUT_B ? SHEET_1 : t < 14.37 ? SHEET_2 : SHEET_3;
  const sheetId = sheet === SHEET_1 ? 'p1' : sheet === SHEET_2 ? 'p2' : 'p3';
  const sheetY = PY + (t < 14.37 ? drop : rise);
  // him
  const ph = phoneState(t, tv);
  const kPh = t < CUT_B ? smooth(tv, 5.3, 5.78) : smooth(t, 7.82, 8.0) * (1 - smooth(t, 8.2, 8.45));
  const him = handFor('him', tv, [470, 1112]);
  const penHand: [number, number] = [lerp(470, him.pos[0] + 40, him.w), lerp(1112, him.pos[1] + 64, him.w)];
  const phHand: [number, number] = [ph.x + 4, ph.y + (t < CUT_B ? lerp(-120, -4, smooth(tv, 5.62, 5.85)) : lerp(-100, -4, smooth(t, 7.9, 8.0)))];
  const himHand: [number, number] = [lerp(penHand[0], phHand[0], kPh), lerp(penHand[1], phHand[1], kPh)];
  const himShoulder: [number, number] = [310 - 46 * kPh + clamp((himHand[0] - 540) * 0.2, 0, 24), 1072];
  const dHim = Math.hypot(himHand[0] - himShoulder[0], himHand[1] - himShoulder[1]);
  // her: at the door, walks back at 10.1, sits at 13.8
  const walk = smooth(t, 10.1, 10.4), sit = smooth(t, 13.8, 14.3);
  const step = smooth(t, 12.85, 13.2) - smooth(t, 13.45, 13.8);
  const herX = lerp(lerp(990, 905, walk) + 55 * step, 885, sit), herY = lerp(785, 840, sit);
  const her = handFor('her', t, [herX - 30, herY + 220]);
  const herPen: [number, number] = [her.pos[0] - 40, her.pos[1] + 64];
  const herShoulder: [number, number] = [herX, herY + 232];
  const dHer = Math.hypot(herPen[0] - herShoulder[0], herPen[1] - herShoulder[1]);
  const lens = (d: number) => Math.min(215, Math.max(105, 0.57 * d));
  const hFace: Face = {...himPose(tv), blush: himBlush(t < CUT_B ? tv : t), cheek: himBlush(t < CUT_B ? tv : t) * 0.6};
  const hb = herBlush(t);
  const wFace: Face = {...herPose(tv), blush: hb, cheek: 0.3 + 0.7 * hb};
  // doors, board
  const doorOpen = 1 - smooth(t, 14.4, 14.9);
  const flip = smooth(t, 14.4, 14.8);
  const boardScale = Math.abs(Math.cos(Math.PI * flip));
  const returnTrip = flip > 0.5;
  const trav = travel(t);
  const station = 1 - smooth(trav, 80, 700);
  const bookK = smooth(t, 10.1, 10.4);
  const bookX = lerp(herX - 22, herX + 62, bookK), bookY = herY + 232;
  const showPen = her.w > 0.05;

  return <>
    <g transform={planeT(cam, 0.85)}>
      <Wall /><Window t={tv} off={trav} station={station} platX={-trav * 0.9} /><Sign />
    </g>
    <g transform={planeT(cam, 0.95)}>
      <SeatBack x={150} /><SeatBack x={760} />
    </g>
    <g transform={planeT(cam, 1)}>
      <Door open={doorOpen} />
      <g transform={`translate(1000 690) scale(1 ${Math.max(boardScale, 0.03)})`}>
        {returnTrip ? <Sign x={0} y={0} w={350} h={104} text="RETURN TRIP" fill={C.green} size={40} /> : <Sign x={0} y={0} w={350} h={104} text="LAST STOP" fill={C.rust} size={50} />}
      </g>
      <Soft box={[0, 700, 1300, 700]} dx={26} dy={20} blur={16} op={0.28}>
        <rect x={150} y={790} width={250} height={640} rx={46} fill="#000" />
        <rect x={760} y={790} width={250} height={640} rx={46} fill="#000" />
      </Soft>
      <Soft box={[0, 680, 1300, 700]} dx={18} dy={14} blur={10} op={0.3}>
        <g transform="translate(275 840)"><path d="M -70 62 L 50 62 C 96 70 122 112 128 176 L 132 560 L -122 560 L -112 124 C -108 92 -96 72 -70 62 Z" fill="#000" /><circle r={64} /></g>
        <g transform={`translate(${herX} ${herY}) scale(-1 1)`}><path d="M -70 62 L 50 62 C 96 70 122 112 128 176 L 132 560 L -122 560 L -112 124 C -108 92 -96 72 -70 62 Z" fill="#000" /><circle r={64} /></g>
      </Soft>
      <Him t={tv} face={hFace} />
      <Her t={t} face={wFace} x={herX} y={herY} flutter={Math.sin(t * 2.4) * (1 - sit * 0.6)} />
      <Table />
      <Soft box={[250, 800, 800, 700]} dx={10} dy={16} blur={9} op={0.34}>
        <rect x={p - PW / 2} y={sheetY - 125} width={PW} height={250 + (sheet.extra ?? 0)} rx={10} fill="#000" />
      </Soft>
      <g transform={`translate(${p} ${sheetY})`}><Paper t={sheet === SHEET_1 ? tv : t} s={sheet} id={sheetId} /></g>
      {kPh >= 0.3 && <TPhone x={ph.x} y={ph.y} lit={ph.lit} down={ph.down} sq={ph.sq} buzz={ph.buzz} t={tv} />}
      <g>
        {him.w * (1 - kPh) > 0.02 && <g opacity={clamp(him.w * 3) * (1 - kPh)}><Pen x={him.pos[0]} y={him.pos[1]} dir={1} /></g>}
        <Arm shoulder={himShoulder} hand={himHand} coat={C.rust} skin={C.skinHim} lens={lens(dHim)} />
      </g>
      {kPh < 0.3 && <TPhone x={ph.x} y={ph.y} lit={ph.lit} down={ph.down} sq={ph.sq} buzz={ph.buzz} t={tv} />}
      <Booklet x={bookX} y={bookY} />
      <g>
        {showPen && <Pen x={her.pos[0]} y={her.pos[1]} dir={-1} />}
        <Arm shoulder={herShoulder} hand={herPen} coat={C.coatHer} skin={C.skinHer} lens={lens(dHer)} />
      </g>
      <BenchFront />
    </g>
    <g transform={planeT(cam, 1.3)}>
      <rect x={-6} y={-400} width={20} height={3000} fill={C.rust} opacity={0.9} />
    </g>
  </>;
};

/** Close-up of the notification, near his phone: a plain card, no app UI. Leaves her visible at the right. */
const MumCard: React.FC<{t: number}> = ({t}) => {
  const a = t - 4.78;
  if (a < 0 || t > 5.95) return null;
  const k = Math.min(clamp(a / 0.1), clamp((5.83 - t) / 0.12));
  const sc = 0.85 + 0.15 * smooth(a, 0, 0.12) + 0.04 * Math.max(0, 1 - a / 0.2);
  const buzz = a < 0.4 ? Math.sin(a * 150) * 4 : 0;
  return <g opacity={k}>
    <g transform={`translate(${410 + buzz} 800) scale(${sc}) rotate(-2)`}>
      <path d="M -150 150 L -90 150 L -190 240 Z" fill={C.ink} />
      <rect x={-196} y={-176} width={400} height={340} rx={26} fill={C.rust} transform="translate(10 12)" />
      <rect x={-200} y={-180} width={400} height={340} rx={26} fill={C.paper} stroke={C.ink} strokeWidth={6} />
      <path d="M -145 148 L -95 148 L -184 228 Z" fill={C.paper} />
      <rect x={-70} y={-160} width={140} height={44} rx={22} fill={C.rust} />
      <text x={0} y={-128} textAnchor="middle" fontFamily={JOST} fontWeight={600} fontSize={32} letterSpacing={3} fill={C.cream}>MUM</text>
      <text x={0} y={-52} textAnchor="middle" fontFamily={JOST} fontWeight={600} fontSize={72} fill={C.ink}>Dave,</text>
      <text x={0} y={30} textAnchor="middle" fontFamily={JOST} fontWeight={600} fontSize={72} fill={C.ink}>call me</text>
      <text x={0} y={112} textAnchor="middle" fontFamily={JOST} fontWeight={600} fontSize={72} fill={C.ink}>back</text>
    </g>
  </g>;
};

const VoteScene: React.FC<{t: number}> = ({t}) => {
  const pulse = (a: number) => Math.max(0, 1 - Math.abs(t - a) / 0.25);
  const tapAt = t - B.tap;
  const age = t - B.choice;
  const pop = age < 0.2 ? 1 + 0.12 * (1 - age / 0.2) : 1;
  return <g>
    <PosterBg t={t} />
    <g transform={`translate(540 500) rotate(-2) scale(${pop}) translate(-540 -500)`}>
      <rect x={256} y={448} width={600} height={104} rx={12} fill={C.rust} />
      <rect x={246} y={438} width={600} height={104} rx={12} fill={C.paper} stroke={C.ink} strokeWidth={5} />
      <text x={546} y={512} textAnchor="middle" fontFamily={JOST} fontWeight={600} fontSize={60} fill={C.ink}>{spec.choices.clue}</text>
    </g>
    <VoteCard k="A" word={spec.choices.A.l1} len={spec.choices.A.l2} sub={spec.choices.A.sub} subX={590} subSize={50} y={590} age={t - B.cardA} tint={C.green} pulse={pulse(B.tap) + pulse(B.tap + 1.0)} />
    <VoteCard k="B" word={spec.choices.B.l1} len={spec.choices.B.l2} sub={spec.choices.B.sub} subX={590} subSize={50} y={880} age={t - B.cardB} tint={C.rust} pulse={pulse(B.tap + 0.5) + pulse(B.tap + 1.5)} />
    {tapAt > 0 && [0, 0.5, 1.0, 1.5].map((d, i) => {
      const a = tapAt - d, cy = i % 2 ? 1070 : 780;
      return a > 0 && a < 0.5 ? <circle key={i} cx={900} cy={cy} r={20 + a * 160} fill="none" stroke={C.ink} strokeWidth={6} opacity={1 - a * 2} /> : null;
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
  const c0 = camAt(CAM, tv);
  const jolt = t > 14.9 && t < 15.6 ? Math.sin((t - 14.9) * 38) * 7 * (1 - smooth(t, 14.9, 15.6)) : 0;
  const cam = {...c0, x: c0.x + jolt};
  const inTrain = (t >= 7.0 - 0.02 && t <= 7.82) || (t >= B.train2 - 0.02 && t <= B.train2 + 0.82);
  const voteOn = t >= B.train2 + TRAIN_CUT;
  const S = (text: string, y: number, from: number, to: number, size: number, rot: number, hue: 'ink' | 'orange' | 'cream' = 'ink', fade = true) =>
    t >= from && t <= to ? <Strip text={text} y={y} age={t - from} out={fade ? smooth(t, to - 0.12, to) : 0} size={size} rot={rot} hue={hue} /> : null;
  return <MotionBlurWhen fast={inTrain} samples={5} shutter={220}>
    <AbsoluteFill>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, background: C.cream}}>
        {!voteOn && <Carriage t={t} tv={tv} cam={cam} />}
        {!voteOn && <MumCard t={t} />}
        {voteOn && <VoteScene t={t} />}
        <EndCard t={t} />
        <PassingTrain t={t} t0={7.0} dir={-1} />
        <PassingTrain t={t} t0={B.train2} dir={1} />
        {/* hook strip: the only thing that differs between variants */}
        {t < 3.0 && <Strip text={(spec.hooks as Record<string, string>)[hook]} y={330} age={1 + t} out={smooth(t, 2.7, 3.0)} size={54} rot={0} maxW={880} />}
        {S('her stop. doors close soon.', 1190, 0, 2.9, 54, -1)}
        {S('take 1: DUKE', 330, 3.0, 6.3, 84, -1.5, 'orange')}
        {S('mum disagrees.', 1190, 5.4, 6.3, 74, 1)}
        {S('rewind. the honest way.', 330, 6.4, 7.7, 76, 1, 'ink', false)}
        {S('take 2: DAVE', 330, 7.8, 14.3, 84, 1.5, 'cream')}
        {S('phone face down.', 1190, 8.1, 9.5, 70, -1)}
        {S('a name for a name.', 1190, 10.8, 12.6, 70, 1)}
        {S('doors closed. she stayed.', 1190, 14.4, 16.3, 64, -1)}
        {S('the train is slowing.', 1190, 16.8, 18.2, 66, 1)}
        {S('what should I look at?', 340, 18.3, 28.5, 62, -1, 'ink')}
        {S('comment A or B', 1190, 21.8, 28.5, 58, 1, 'ink')}
        {t >= B.endcard && <Strip text="seven across" y={380} age={t - B.endcard} out={0} size={124} rot={0} hue="orange" />}
        {t >= B.endcard + 0.15 && <Strip text="part 4 · comment A or B" y={600} age={t - B.endcard - 0.15} out={0} size={66} rot={0} hue="cream" />}
      </svg>
    </AbsoluteFill>
  </MotionBlurWhen>;
};

export const Across3: React.FC<{hook?: Hook}> = ({hook = 'a'}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  return <AbsoluteFill style={{background: C.cream}}>
    <Audio src={staticFile('audio/across-ep3-room.wav')} volume={0.55} />
    <Audio src={staticFile('audio/across-ep3-music.wav')} volume={0.8} />
    <Audio src={staticFile('audio/across-ep3-sfx.wav')} volume={0.9} />
    <Scene t={t} hook={hook} />
  </AbsoluteFill>;
};
