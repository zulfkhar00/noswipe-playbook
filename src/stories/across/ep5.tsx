import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, lerp, smooth} from '../../lib/motion';
import {MotionBlurWhen} from '../../lib/shots';
import {Arm, BenchFront, Booklet, C, Cam, CamKey, Cup, Door, Face, Her, Him, Head, Torso, JOST, PEN, PassingTrain, Paper, Pen, PosterBg, Sign, SeatBack, SheetSpec, Soft, Strip, Table, TRAIN_CUT, Wall, Window, boxX, camAt, hillPath, planeT} from './world';
import spec from '../../../specs/stories/across-ep5.json';

// Seven Across, part 5 "Last stop" (season finale). Silent, stands alone, no vote, no NoSwipe mention.
// Frame 1: sunrise carriage (as part 1), her seat visibly empty, him alone looking at it, ONE strip (the hook).
// Take 1 SEAT: coat and bag onto her seat, a commuter wants it, he guards it, then he plops down on her side himself and
// sits on her page (cut-in); the opposite train runs backwards. Take 2 TIME: 7:42, her page under the table clip, clue
// "Where I'll be at 6 (4,4)" = LAST STOP; sunset jump, board flips to LAST STOP; platform; Iris on a bench; "Us, tomorrow (4,4)"
// = SAME TIME; "hi." "hi."; end card. Carriage things are pure functions of story time tv (rewind = tv runs backwards).

export const ACROSS5_FPS = 60;
export const ACROSS5_FRAMES = Math.round(spec.duration * ACROSS5_FPS);
const B = spec.beats;
export type Hook = 'a' | 'b';

const T_TRAIN = 8.6;
const CUT = T_TRAIN + TRAIN_CUT;            // 8.97: hidden behind the reversed passing train
const tvOf = (t: number) => (t < 7.9 ? t : t < 8.2 ? 7.9 : t < 8.8 ? lerp(7.9, 0.5, smooth(t, 8.2, 8.8)) : t < CUT ? 0.5 : t);
const INK_HIM = '#243B6B';

const seq = (t: number, ks: [number, number, number][]): [number, number] => {
  if (t <= ks[0][0]) return [ks[0][1], ks[0][2]];
  for (let i = 0; i < ks.length - 1; i++) {
    if (t < ks[i + 1][0]) { const k = smooth(t, ks[i][0], ks[i + 1][0]); return [lerp(ks[i][1], ks[i + 1][1], k), lerp(ks[i][2], ks[i + 1][2], k)]; }
  }
  const l = ks[ks.length - 1];
  return [l[1], l[2]];
};
const key = <T,>(t: number, ks: [number, T][]): T => { let v = ks[0][1]; for (const [a, b] of ks) if (t >= a) v = b; return v; };
const lens = (d: number) => Math.min(215, Math.max(105, 0.57 * d));

type P = {look: [number, number]; mouth: Face['mouth']; brow: number; rot: number};

// ------------------------------------------------------------------------------------- sheets
const CLUE1: SheetSpec = {text: "Where I'll be|at 6 (4,4)", n: 8, groups: [4], by: 'her', size: 46, handwrite: true, letters: {s: 'LASTSTOP', from: 11.8, step: 0.25, ink: INK_HIM}};
const CLUE2: SheetSpec = {text: 'Us, tomorrow (4,4)', n: 8, groups: [4], by: 'her', size: 50, handwrite: true, letters: {s: 'SAMETIME', from: 22.5, step: 0.2, ink: INK_HIM}};
const PAGE_Y = 1020;

// ------------------------------------------------------------------------------------- seat things
const Coat: React.FC<{x: number; y: number; rot: number; sy?: number}> = ({x, y, rot, sy = 1}) => <g transform={`translate(${x} ${y}) rotate(${rot}) scale(1 ${sy})`}>
  {/* a coat laid flat: two sleeves hanging over the sides, lapels and collar, pockets */}
  <path d="M -80 -30 C -140 -10 -150 50 -140 96" stroke={C.ink} strokeWidth={56} strokeLinecap="round" fill="none" />
  <path d="M -80 -30 C -140 -10 -150 50 -140 96" stroke="#2F4A85" strokeWidth={46} strokeLinecap="round" fill="none" />
  <path d="M 80 -30 C 140 -10 150 50 140 96" stroke={C.ink} strokeWidth={56} strokeLinecap="round" fill="none" />
  <path d="M 80 -30 C 140 -10 150 50 140 96" stroke="#2F4A85" strokeWidth={46} strokeLinecap="round" fill="none" />
  <ellipse cx={-140} cy={100} rx={22} ry={9} fill="#17274B" /><ellipse cx={140} cy={100} rx={22} ry={9} fill="#17274B" />
  <rect x={-92} y={-52} width={184} height={150} rx={16} fill={INK_HIM} stroke={C.ink} strokeWidth={4} />
  <path d="M -50 -52 L -50 -70 L 50 -70 L 50 -52" fill="#3A5BA0" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
  <path d="M -50 -52 L 0 20 L -2 -52 Z M 50 -52 L 0 20 L 2 -52 Z" fill="#3A5BA0" stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
  <path d="M 0 20 L 0 98" stroke="#17274B" strokeWidth={4} />
  {[40, 70].map((yy) => <circle key={yy} cx={-12} cy={yy} r={6} fill={C.cream} />)}
  <rect x={-76} y={58} width={46} height={12} rx={4} fill="#17274B" /><rect x={30} y={58} width={46} height={12} rx={4} fill="#17274B" />
</g>;
const Bag: React.FC<{x: number; y: number; rot: number}> = ({x, y, rot}) => <g transform={`translate(${x} ${y}) rotate(${rot})`}>
  <path d="M -30 -40 C -30 -96 30 -96 30 -40" stroke={C.ink} strokeWidth={10} fill="none" strokeLinecap="round" />
  <path d="M -30 -40 C -30 -96 30 -96 30 -40" stroke="#8C6A38" strokeWidth={5} fill="none" strokeLinecap="round" />
  <path d="M -58 -44 L 58 -44 L 66 46 L -66 46 Z" fill="#C9A66B" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
  <path d="M -62 -14 L 62 -14" stroke={C.ink} strokeWidth={3} />
  <rect x={-24} y={6} width={48} height={26} rx={5} fill={C.paper} stroke={C.ink} strokeWidth={3} /><path d="M -14 19 L 14 19" stroke={C.ink} strokeWidth={3} />
</g>;

/** Her folded crossword page: cream, orange booklet spine, grid corner, a tiny balloon doodle (part 4), her mustard pen clipped on. */
const PageObj: React.FC<{x: number; y: number; rot: number; s: number}> = ({x, y, rot, s}) => <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
  <rect x={-100} y={-72} width={200} height={144} rx={8} fill={C.paper} stroke={C.ink} strokeWidth={4} />
  <rect x={-100} y={-72} width={18} height={144} rx={6} fill={C.orange} />
  {[0, 1, 2].map((r) => [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={34 + c * 20} y={-62 + r * 20} width={20} height={20} fill={(r + c) % 2 ? C.ink : C.paper} stroke={C.ink} strokeWidth={2} />))}
  <rect x={-66} y={-54} width={86} height={9} rx={4} fill={C.ink} opacity={0.7} /><rect x={-66} y={-36} width={60} height={9} rx={4} fill={C.ink} opacity={0.5} />
  {Array.from({length: 7}, (_, i) => <rect key={i} x={-66 + i * 17} y={-12} width={15} height={18} fill="none" stroke={C.ink} strokeWidth={2.5} />)}
  <g transform="translate(-52 40)"><path d="M -12 -14 C -12 -30 12 -30 12 -14 C 12 -4 4 2 0 4 C -4 2 -12 -4 -12 -14 Z" fill={C.orange} stroke={C.green} strokeWidth={3} /><rect x={-4} y={6} width={8} height={6} fill={C.rustDark} /></g>
  <text x={-26} y={58} fontFamily={PEN} fontWeight={700} fontSize={26} fill={C.ink}>– Iris</text>
  <g transform="translate(82 -80) rotate(14)"><rect x={-7} y={0} width={14} height={118} rx={6} fill={C.mustard} stroke={C.ink} strokeWidth={3} /><path d="M -7 118 L 0 138 L 7 118 Z" fill={C.ink} /><rect x={7} y={4} width={5} height={50} rx={2} fill="#C58E1B" stroke={C.ink} strokeWidth={2} /></g>
</g>;

// ------------------------------------------------------------------------------------- acting
const himPose1 = (tv: number): P => key<P>(tv, [
  [0, {look: [10, 8], mouth: 'flat', brow: 0.4, rot: 5}],
  [1.5, {look: [10, 10], mouth: 'flat', brow: 0.6, rot: 6}],
  [2.4, {look: [10, 8], mouth: 'flat', brow: 0.5, rot: 5}],
  [3.05, {look: [8, 6], mouth: 'grin', brow: 0.6, rot: 0}],
  [3.9, {look: [10, 2], mouth: 'smile', brow: 0.4, rot: 0}],
  [4.6, {look: [10, 0], mouth: 'o', brow: 0.9, rot: -2}],
  [5.0, {look: [10, 0], mouth: 'flat', brow: 0.9, rot: -3}],
  [6.2, {look: [10, 0], mouth: 'flat', brow: 0.4, rot: 0}],
  [6.5, {look: [10, 0], mouth: 'grin', brow: 0.6, rot: 0}],
  [6.75, {look: [10, 0], mouth: 'o', brow: 0.9, rot: -2}],
  [7.0, {look: [10, 2], mouth: 'smile', brow: 0.5, rot: -2}],
]);
const himPose2 = (t: number): P => key<P>(t, [
  [0, {look: [10, 2], mouth: 'flat', brow: 0.3, rot: 3}],
  [9.9, {look: [4, 18], mouth: 'flat', brow: 0.7, rot: 6}],
  [10.1, {look: [4, 20], mouth: 'o', brow: 0.9, rot: 6}],
  [10.6, {look: [4, 20], mouth: 'smile', brow: 0.6, rot: 5}],
  [11.8, {look: [4, 22], mouth: 'smile', brow: 0.5, rot: 5}],
  [13.8, {look: [8, 4], mouth: 'grin', brow: 0.5, rot: 1}],
  [14.5, {look: [10, -6], mouth: 'flat', brow: 0.3, rot: 0}],
  [18.3, {look: [10, 0], mouth: 'smile', brow: 0.6, rot: -1}],
]);

// ------------------------------------------------------------------------------------- camera
const CAM: CamKey[] = [
  {t: 0, x: 550, y: 1010, z: 1.3}, {t: 2.9, x: 555, y: 1010, z: 1.33}, {t: 3.9, x: 660, y: 1060, z: 1.04}, {t: 4.6, x: 700, y: 1050, z: 1.06},
  {t: 6.3, x: 700, y: 1050, z: 1.04}, {t: 7.0, x: 700, y: 1040, z: 1.09}, {t: 7.9, x: 680, y: 1050, z: 1.06},
  {t: CUT, x: 660, y: 1050, z: 1.0, cut: true}, {t: 9.8, x: 660, y: 1050, z: 1.0},
  {t: 10.6, x: 660, y: 1030, z: 1.08}, {t: 14.5, x: 660, y: 1040, z: 1.05}, {t: 19.0, x: 640, y: 1040, z: 1.04}, {t: 40, x: 640, y: 1040, z: 1.04},
];
const PCAM: CamKey[] = [
  {t: 0, x: 560, y: 1010, z: 1.12}, {t: 19.0, x: 560, y: 1010, z: 1.12}, {t: 20.9, x: 600, y: 1030, z: 1.12}, {t: 21.7, x: 665, y: 1050, z: 1.2}, {t: 60, x: 665, y: 1050, z: 1.2},
];

// ------------------------------------------------------------------------------------- the carriage
const BOARD: [number, string, number][] = [[0, '7:42', 0], [14.95, '5:58', 0], [16.4, 'FIELD END', 0], [17.2, 'MILL BROOK', 0], [18.0, '6:00 · LAST STOP', 0]];

const Carriage: React.FC<{t: number; tv: number; cam: Cam}> = ({t, tv, cam}) => {
  const take1 = t < CUT;
  const dusk = smooth(t, B.jump, B.dusk);
  const V = (x: number) => 1 - smooth(x, 17.3, 18.4);
  let trav = tv * 520;
  if (!take1) { let acc = 0; for (let x = CUT; x < Math.min(t, 18.5); x += 0.03) acc += V(x) * 0.03; trav = 2600 + acc * 520; }
  // ---- him
  const u = smooth(tv, 6.5, 7.0);                        // the leap to her seat
  const hx = take1 ? lerp(275, 885, u) : 275;
  const hy = take1 ? 840 - 70 * Math.sin(Math.PI * clamp(u)) + 22 * smooth(tv, 6.98, 7.1) : 840;
  const sx = take1 ? (tv < 6.75 ? 1 : -1) : 1;
  const flipped = sx < 0;
  const bump = take1 ? Math.max(0, 1 - Math.abs(tv - 7.04) / 0.14) : 0;
  const pose0 = take1 ? himPose1(tv) : himPose2(t);
  const shakeH = take1 && tv > 4.75 && tv < 5.6 ? Math.sin(tv * 20) * 6 : 0;
  const pose = {...pose0, rot: pose0.rot + shakeH};
  const blush = take1 ? 0.1 : t < 10 ? 0.1 : lerp(0.1, 0.7, smooth(t, 10.0, 10.8)) * (1 - smooth(t, 14, 15) * 0.3);
  const hFace: Face = {...pose, blush, cheek: blush * 0.6};
  // his hand
  const restHand: [number, number] = [400, 1195];
  let hand = restHand;
  if (take1) {
    hand = seq(tv, [[0, 620, 1100], [3.1, 620, 1100], [3.35, 355, 1240], [3.55, 560, 985], [3.75, 380, 1235], [4.0, 560, 985], [4.3, 400, 1195], [4.85, 400, 1195], [5.1, 740, 1100], [6.25, 740, 1100], [6.5, 420, 1190]]);
    const seat = seq(tv, [[6.5, hand[0], hand[1]], [7.0, hx - 30, 1195]]);
    hand = tv > 6.5 ? seat : hand;
  } else {
    const wr = clamp((t - 10.9) / 0.4) * (1 - smooth(t, 13.85, 14.2));
    const i = Math.max(0, Math.min(7, Math.floor((t - B.writeFrom) / 0.25)));
    const tip: [number, number] = [660 + 1.25 * boxX(8, i, [4]) + Math.sin(t * 50) * 2, PAGE_Y + 1.25 * 54 + Math.cos(t * 45) * 1.5];
    const hov: [number, number] = [660 + 1.25 * boxX(8, 0, [4]), PAGE_Y + 1.25 * 62];
    const grab = seq(t, [[10.0, 400, 1195], [10.35, 620, 1100], [10.6, 640, 1130], [10.9, 500, 1150]]);
    const pos = t < 10.9 ? grab : t < B.writeFrom ? hov : tip;
    hand = [lerp(restHand[0], pos[0], t < 10.0 ? 0 : 1), lerp(restHand[1], pos[1], t < 10.0 ? 0 : 1)];
    hand = [lerp(hand[0], restHand[0], smooth(t, 13.85, 14.3)), lerp(hand[1], restHand[1], smooth(t, 13.85, 14.3))];
    void wr;
  }
  const penOn = !take1 && t >= 10.9 && t < 14.2;
  const shoulder: [number, number] = [hx + 35 * sx - 0, 1072 + (hy - 840)];
  const dHim = Math.hypot(hand[0] - shoulder[0], hand[1] - shoulder[1]);
  const lean = take1 ? (tv > 5.0 && tv < 6.3 ? 7 * smooth(tv, 5.0, 5.2) * (1 - smooth(tv, 6.1, 6.3)) : 0) + 6 * bump : 0;
  // ---- coat and bag on her seat
  const cp = smooth(tv, 3.55, 3.98), bp = smooth(tv, 4.0, 4.4);
  const sq = 1 - 0.18 * smooth(tv, 7.0, 7.1);
  const coatPos: [number, number] = [lerp(560, 862, cp), lerp(985, 1062, cp) - 150 * Math.sin(Math.PI * cp)];
  const bagPos: [number, number] = [lerp(560, 955, bp), lerp(985, 1122, bp) - 130 * Math.sin(Math.PI * bp)];
  // ---- commuter
  const cin = smooth(tv, 3.95, 4.6), cout = smooth(tv, 5.95, 6.6);
  const cx = lerp(1250, 600, cin) + 700 * cout;
  const walking = (tv > 3.95 && tv < 4.6) || (tv > 5.95 && tv < 6.6);
  const cy = 700 + (walking ? Math.abs(Math.sin(tv * 11)) * -9 : 0);
  const cpose: P = key<P>(tv, [[0, {look: [10, 4], mouth: 'flat', brow: 0.2, rot: 0}], [4.6, {look: [10, 10], mouth: 'flat', brow: 0.5, rot: 3}], [5.75, {look: [10, 0], mouth: 'flat', brow: 0.3, rot: -3}], [6.0, {look: [10, 0], mouth: 'flat', brow: 0.2, rot: 0}]]);
  const cupHand: [number, number] = [cx + 80, 930];
  const palm = seq(tv, [[0, cx + 30, 990], [4.7, cx + 30, 990], [4.95, cx + 225, 940], [5.55, cx + 225, 940], [5.8, cx + 30, 990]]);
  const qk = smooth(tv, 4.75, 4.9) * (1 - smooth(tv, 5.4, 5.55));
  const cShoulder: [number, number] = [cx + 12, cy + 232];
  const showCommuter = take1 && tv > 3.9 && tv < 6.7;
  // ---- take 2 extras
  const pass = !take1 && t >= 9.0 ? [1 - smooth(t, 15.2, 15.6), 1 - smooth(t, 15.9, 16.3)] : [0, 0];
  const clipPage = !take1 && t < 10.5;
  const pageUp = smooth(t, 10.4, 11.1);
  const board = [...BOARD].reverse().find((b) => t >= b[0])!;
  const evs = BOARD.map((b) => b[0]).filter((x) => x > 0);
  const flipDip = evs.reduce((m, e) => Math.min(m, Math.abs(t - e) / 0.14), 1);
  const bw = board[1].length > 12 ? 600 : board[1].length > 4 ? 430 : 260;
  const doorOpen = smooth(t, B.doors, B.doors + 0.35);
  const gold = 0;
  void gold;
  return <>
    <g transform={planeT(cam, 0.85)}>
      <Wall /><Window t={tv} off={trav} dusk={dusk} /><Sign />
    </g>
    <g transform={planeT(cam, 0.95)}>
      <SeatBack x={150} /><SeatBack x={760} />
      {!take1 && [470, 650].map((px, i) => <g key={px} opacity={1}>
        <rect x={px - 95} y={930} width={190} height={290} rx={34} fill={C.greenDark} />
        <g opacity={pass[i]} transform={`translate(${px} 880) scale(0.8)`}>
          <Torso coat={i ? '#5A5F6B' : '#4A5560'} />
          <g transform="scale(-1 1)"><Head t={t + i} skin={i ? '#A57E66' : '#B88E72'} face={{look: [10, 4], mouth: 'flat', brow: 0.1, rot: 0, blush: 0}} hat="cap" /></g>
        </g>
      </g>)}
    </g>
    <g transform={planeT(cam, 1)}>
      <Door open={doorOpen} />
      {!take1 && <g transform={`translate(740 612) scale(1 ${Math.max(flipDip, 0.04)})`}>
        <Sign x={0} y={0} w={bw} h={108} text={board[1]} fill={board[1].includes('LAST') ? C.ink : C.green} size={board[1].length > 12 ? 46 : board[1].length > 4 ? 52 : 70} />
      </g>}
      <Soft box={[0, 700, 1300, 700]} dx={26} dy={20} blur={16} op={0.28}>
        <rect x={150} y={790} width={250} height={640} rx={46} fill="#000" />
        <rect x={760} y={790} width={250} height={640} rx={46} fill="#000" />
      </Soft>
      {/* her seat: coat, bag and a page corner tucked under the coat (take 1 only) */}
      {take1 && <PageObj x={lerp(760, 975, smooth(tv, 3.4, 3.95))} y={lerp(1035, 1150, smooth(tv, 3.4, 3.95))} rot={lerp(5, 22, smooth(tv, 3.4, 3.95))} s={lerp(1.6, 0.5, smooth(tv, 3.4, 3.95))} />}
      {take1 && tv >= 3.55 && <g>
        <Coat x={coatPos[0]} y={coatPos[1]} rot={lerp(-40, -4, cp)} sy={sq} />
        {tv >= 4.0 && <Bag x={bagPos[0]} y={bagPos[1]} rot={lerp(30, 6, bp)} />}
      </g>}
      {showCommuter && <g>
        <g transform={`translate(${cx} ${cy})`}>
          <Torso coat="#55606B" />
          <path d="M -40 62 L 36 62 L 22 96 L -10 80 Z" fill="#000" opacity={0.18} />
          <Head t={tv} skin="#C99B76" face={{...cpose, blush: 0}} hat="cap" />
        </g>
      </g>}
      <Soft box={[0, 680, 1300, 700]} dx={18} dy={14} blur={10} op={0.3}>
        <g transform={`translate(${hx} ${hy}) scale(${sx} 1) rotate(${lean})`}><path d="M -70 62 L 50 62 C 96 70 122 112 128 176 L 132 560 L -122 560 L -112 124 C -108 92 -96 72 -70 62 Z" fill="#000" /><circle r={64} /></g>
      </Soft>
      <g transform={`translate(${hx} 0) scale(${sx * (1 + 0.07 * bump)} ${1 - 0.09 * bump}) translate(${-hx} 0)`}>
        <g transform={`rotate(${lean} ${hx} 840)`}><Him t={tv} face={hFace} x={hx} y={hy} /></g>
      </g>
      <Table />
      {/* take 2: her page tucked under the table clip */}
      {clipPage && t >= CUT && <g>
        <PageObj x={760} y={1035} rot={5} s={1.6} />
        {t > 9.4 && t < 10.4 && <g opacity={0.5 + 0.5 * Math.sin(t * 14)} stroke={C.orange} strokeWidth={5} strokeLinecap="round"><path d="M 590 960 L 566 940 M 584 1050 L 556 1058 M 935 960 L 960 940" /></g>}
      </g>}
      {!take1 && <g>
        <Soft box={[200, 800, 1000, 700]} dx={10} dy={16} blur={9} op={0.34}>
          <rect x={lerp(760, 660, pageUp) - 325 * pageUp} y={lerp(1035, PAGE_Y, pageUp) - 156 * pageUp} width={650 * pageUp} height={312 * pageUp} rx={10} fill="#000" />
        </Soft>
        {pageUp > 0.01 && <g transform={`translate(${lerp(760, 660, pageUp)} ${lerp(1035, PAGE_Y, pageUp)}) scale(${lerp(0.64, 1.25, pageUp)})`}>
          <Paper t={t} s={CLUE1} id="c1" />
          <text x={-242} y={108} fontFamily={PEN} fontWeight={700} fontSize={34} fill={C.ink} opacity={0.8}>– Iris</text>
        </g>}
      </g>}
      <g>
        {penOn && <Pen x={hand[0]} y={hand[1]} dir={1} />}
        <Arm shoulder={shoulder} hand={penOn ? [hand[0] + 40, hand[1] + 64] : hand} coat={C.rust} skin={C.skinHim} lens={lens(dHim)} />
      </g>
      {showCommuter && <g>
        <Arm shoulder={cShoulder} hand={cupHand} coat="#55606B" skin="#C99B76" lens={lens(Math.hypot(cupHand[0] - cShoulder[0], cupHand[1] - cShoulder[1]))} />
        <Cup x={cupHand[0] + 4} y={cupHand[1] + 14} steam={1} t={tv} />
        <circle cx={cupHand[0] - 4} cy={cupHand[1] - 12} r={14} fill="#C99B76" />
      </g>}
      {showCommuter && <g>
        <Arm shoulder={[cShoulder[0] - 22, cShoulder[1]]} hand={palm} coat="#55606B" skin="#C99B76" lens={lens(Math.hypot(palm[0] - cShoulder[0], palm[1] - cShoulder[1]))} />
        <g transform={`translate(${palm[0] + 14} ${palm[1] - 10}) rotate(-70)`}>{[-18, -6, 6, 18].map((dx) => <rect key={dx} x={dx - 4} y={-46} width={9} height={30} rx={4} fill="#C99B76" />)}</g>
        {qk > 0.02 && <g transform={`translate(${cx + 150} ${cy - 90}) scale(${qk})`}>
          <circle r={50} fill={C.paper} stroke={C.ink} strokeWidth={5} /><path d="M -14 42 L 0 70 L 14 42 Z" fill={C.paper} stroke={C.ink} strokeWidth={5} /><circle r={46} fill={C.paper} />
          <text y={26} textAnchor="middle" fontFamily={PEN} fontWeight={700} fontSize={80} fill={C.ink}>?</text>
        </g>}
      </g>}
      <BenchFront />
      <rect x={-900} y={1290} width={3000} height={2400} fill={C.greenDark} />
      <rect x={-900} y={1290} width={3000} height={10} fill={C.rust} />
      <rect x={-900} y={-500} width={3000} height={3200} fill="#E5702A" opacity={0.2 * dusk} style={{mixBlendMode: 'multiply'}} />
    </g>
    <g transform={planeT(cam, 1.3)}><rect x={-6} y={-400} width={20} height={3000} fill={C.rust} opacity={0.9} /></g>
  </>;
};

// ------------------------------------------------------------------------------------- platform
const Bubble: React.FC<{x: number; y: number; text: string; age: number; tailX: number}> = ({x, y, text, age, tailX}) => {
  if (age < 0) return null;
  const pop = age < 0.2 ? 1 + 0.25 * (1 - age / 0.2) : 1;
  return <g opacity={clamp(age / 0.08)} transform={`translate(${x} ${y + 60}) scale(${pop}) translate(${-x} ${-y - 60})`}>
    <rect x={x - 86 + 8} y={y - 60 + 10} width={172} height={120} rx={26} fill={C.rust} />
    <path d={`M ${tailX - 24} ${y + 56} L ${tailX} ${y + 104} L ${tailX + 24} ${y + 56} Z`} fill={C.paper} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
    <rect x={x - 86} y={y - 60} width={172} height={120} rx={26} fill={C.paper} stroke={C.ink} strokeWidth={5} />
    <rect x={tailX - 20} y={y + 54} width={40} height={8} fill={C.paper} />
    <text x={x} y={y + 30} textAnchor="middle" fontFamily={PEN} fontWeight={700} fontSize={104} fill={C.ink}>{text}</text>
  </g>;
};

const Platform: React.FC<{t: number}> = ({t}) => {
  const cam = camAt(PCAM, t);
  // Dave
  const walk = smooth(t, 19.1, 20.5), sit = smooth(t, 20.9, 21.4);
  const moving = walk > 0.02 && walk < 0.98;
  const dx = lerp(165, 430, walk) + 90 * sit;
  const dy = 840 + (moving ? Math.abs(Math.sin(t * 13)) * -10 : 0) + 34 * sit;
  const iX = 800, iY = 840;
  const dPose: P = key<P>(t, [
    [0, {look: [10, 0], mouth: 'flat', brow: 0.4, rot: 0}],
    [19.6, {look: [10, -2], mouth: 'smile', brow: 0.6, rot: -1}],
    [21.5, {look: [4, 20], mouth: 'smile', brow: 0.4, rot: 5}],
    [24.2, {look: [10, -2], mouth: 'smile', brow: 0.6, rot: -1}],
    [25.4, {look: [10, -2], mouth: 'o', brow: 0.7, rot: -1}],
    [25.7, {look: [10, -2], mouth: 'smile', brow: 0.6, rot: -1}],
  ]);
  const iPose: P = key<P>(t, [
    [0, {look: [8, 18], mouth: 'smile', brow: 0, rot: 2}],
    [19.6, {look: [10, -4], mouth: 'smile', brow: 0.7, rot: -2}],
    [21.5, {look: [10, 10], mouth: 'smile', brow: 0.4, rot: 0}],
    [24.2, {look: [8, 16], mouth: 'smile', brow: 0.2, rot: 1}],
    [24.9, {look: [10, -2], mouth: 'smile', brow: 0.6, rot: -2}],
    [26.1, {look: [10, -2], mouth: 'o', brow: 0.7, rot: -2}],
    [26.4, {look: [10, -2], mouth: 'smile', brow: 0.6, rot: -2}],
  ]);
  const dBl = lerp(0.1, 0.7, smooth(t, 20.0, 20.8));
  const iBl = lerp(0, 0.85, smooth(t, 19.7, 20.4));
  const dFace: Face = {...dPose, blush: dBl, cheek: dBl * 0.6};
  const iFace: Face = {...iPose, blush: iBl, cheek: 0.3 + 0.7 * iBl};
  // card (the booklet's last page)
  const cardK = smooth(t, 21.3, 21.85);
  const cardPos: [number, number] = [lerp(790, 665, cardK), lerp(1085, 1070, cardK)];
  const cardS = lerp(0.22, 0.85, cardK);
  // hands
  const dRest: [number, number] = [dx + 20, 1195];
  const ii = Math.max(0, Math.min(7, Math.floor((t - 22.5) / 0.2)));
  const dTip: [number, number] = [665 + 0.85 * boxX(8, ii, [4]) + Math.sin(t * 50) * 2, 1070 + 0.85 * 54 + Math.cos(t * 45) * 1.5];
  const dHov: [number, number] = [665 + 0.85 * boxX(8, 0, [4]), 1070 + 0.85 * 64];
  const L2 = (u: [number, number], v: [number, number], k: number): [number, number] => [lerp(u[0], v[0], k), lerp(u[1], v[1], k)];
  const P0: [number, number] = [650, 1000];                  // the pen, passed across above the card
  const penTip = t < 22.1 ? P0 : t < 22.5 ? L2(P0, dHov, smooth(t, 22.1, 22.5)) : dTip;
  const dPenHand: [number, number] = [penTip[0] + 40, penTip[1] + 64];
  const dPen = t >= 21.75 && t < 24.15;
  const dHand: [number, number] = t < 21.75 ? dRest : t < 22.1 ? L2(dRest, [P0[0] + 14, P0[1] + 30], smooth(t, 21.75, 22.0)) : t < 24.15 ? L2([P0[0] + 14, P0[1] + 30], dPenHand, smooth(t, 22.1, 22.3)) : L2(dPenHand, dRest, smooth(t, 24.15, 24.5));
  const iPass = t > 21.75 && t < 22.5;
  const iPassHand: [number, number] = t < 22.1 ? seq(t, [[21.75, 800, 1110], [21.95, P0[0] + 40, P0[1] + 64]]) : seq(t, [[22.1, P0[0] + 40, P0[1] + 64], [22.15, P0[0] + 40, P0[1] + 64], [22.45, 800, 1110]]);
  const dShoulder: [number, number] = [dx + 35, 1072 + (dy - 840)];
  const iShoulder: [number, number] = [iX - 35, 1072];
  const hold: [number, number] = t < 21.3 ? [iX - 22, 1075] : seq(t, [[21.3, iX - 22, 1075], [21.8, 905, 1050]]);
  const tk: [number, number][] = [[810, 1148], [825, 1165], [862, 1126]];
  const tu = clamp((t - 24.25) / 0.3), tf = tu * 2, ti = Math.min(1, Math.floor(tf));
  const tickTip: [number, number] = [lerp(tk[ti][0], tk[ti + 1][0], tf - ti), lerp(tk[ti][1], tk[ti + 1][1], tf - ti)];
  const iPos: [number, number] = t < 23.9 ? [940, 1000] : t < 24.25 ? seq(t, [[23.9, 940, 1000], [24.25, tk[0][0], tk[0][1]]]) : t < 24.55 ? tickTip : seq(t, [[24.55, tk[2][0], tk[2][1]], [24.9, 960, 1010]]);
  const iPen = t > 23.9 && t < 24.95;
  const dDist = Math.hypot(dHand[0] - dShoulder[0], dHand[1] - dShoulder[1]);
  const iHand: [number, number] = [iPos[0] - 40, iPos[1] + 64];
  const holdDist = Math.hypot(hold[0] - iShoulder[0], hold[1] - iShoulder[1]);
  const doorGlow = 1;
  return <g>
    <g transform={planeT(cam, 0.5)}>
      <rect x={-900} y={-600} width={3000} height={3000} fill="#F0A068" />
      <rect x={-900} y={500} width={3000} height={400} fill="#E5702A" />
      <rect x={-900} y={800} width={3000} height={1200} fill="#B5452B" />
      <g transform="translate(720 900) rotate(0)" opacity={0.25}>{Array.from({length: 16}, (_, i) => <path key={i} d="M 0 0 L -36 -1300 L 36 -1300 Z" transform={`rotate(${i * 22.5 + t * 2})`} fill="#FFC24D" />)}</g>
      <circle cx={720} cy={900} r={190} fill="#E8501F" />
      <path d={hillPath(90, 1060, 1000, 0.5)} fill="#8E5646" transform="translate(-300 0)" />
      <path d={hillPath(60, 1120, 800, 2.1)} fill="#6A3B34" transform="translate(-150 0)" />
    </g>
    <g transform={planeT(cam, 0.9)}>
      {/* train side with open doors, left */}
      <rect x={-500} y={330} width={830} height={1000} fill="#3E6252" />
      <rect x={-500} y={330} width={830} height={14} fill={C.orange} />
      <rect x={-500} y={1210} width={830} height={26} fill={C.cream} /><rect x={-500} y={1236} width={830} height={20} fill={C.rust} />
      {[-330, -140].map((x) => <g key={x}><rect x={x} y={520} width={150} height={300} rx={26} fill="#FFC77A" /><rect x={x - 8} y={512} width={166} height={316} rx={32} fill="none" stroke={C.ink} strokeWidth={8} /></g>)}
      <g transform="translate(-960 0)"><Door open={1} glow={doorGlow} /></g>
      {/* lamp posts and the station sign */}
      {[470, 1010].map((x) => <g key={x}><rect x={x - 8} y={470} width={16} height={600} fill={C.ink} /><circle cx={x} cy={470} r={34} fill="#FFE7B0" /><circle cx={x} cy={470} r={90} fill="#FFC24D" opacity={0.25} /></g>)}
      <Sign x={740} y={560} w={430} h={100} text="LAST STOP" size={52} fill={C.green} />
      <rect x={560} y={610} width={14} height={470} fill={C.ink} /><rect x={904} y={610} width={14} height={470} fill={C.ink} />
    </g>
    <g transform={planeT(cam, 1)}>
      {/* bench */}
      <rect x={440} y={960} width={660} height={120} rx={14} fill={C.rustDark} />
      {[0, 1, 2].map((i) => <rect key={i} x={452} y={970 + i * 36} width={636} height={26} rx={6} fill={C.rust} />)}
      <Soft box={[300, 700, 1000, 700]} dx={16} dy={14} blur={10} op={0.3}>
        <rect x={dx - 118} y={dy - 50} width={250} height={600} rx={40} fill="#000" />
        <rect x={iX - 130} y={iY - 50} width={250} height={600} rx={40} fill="#000" />
      </Soft>
      <Her t={t} face={iFace} x={iX} y={iY} flutter={Math.sin(t * 2.4)} />
      <g transform={`translate(${dx} 0)`}><Him t={t} face={dFace} x={0} y={dy} /></g>
      {/* booklet in her hands, then the open last page */}
      {t < 21.85 && <g opacity={1 - cardK}><Booklet x={790} y={1070} /></g>}
      {iPen && <Arm shoulder={[iX - 20, 1072]} hand={iHand} coat={C.coatHer} skin={C.skinHer} lens={lens(Math.hypot(iHand[0] - iX + 20, iHand[1] - 1072))} />}
      <Arm shoulder={dShoulder} hand={dHand} coat={C.rust} skin={C.skinHim} lens={lens(dDist)} />
      <Arm shoulder={iShoulder} hand={hold} coat={C.coatHer} skin={C.skinHer} lens={lens(holdDist)} />
      {t >= 21.3 && <g>
        <Soft box={[200, 800, 1000, 700]} dx={10} dy={16} blur={9} op={0.34}>
          <rect x={cardPos[0] - 260 * cardS} y={cardPos[1] - 125 * cardS} width={520 * cardS} height={250 * cardS} rx={10} fill="#000" />
        </Soft>
        <g transform={`translate(${cardPos[0]} ${cardPos[1]}) scale(${cardS})`}>
          <Paper t={t} s={CLUE2} id="c2" />
          <text x={-242} y={108} fontFamily={PEN} fontWeight={700} fontSize={34} fill={C.ink} opacity={0.8}>– Iris</text>
          {t > 24.25 && <path d="M 170 92 L 188 112 L 232 66" stroke={C.green} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - clamp((t - 24.25) / 0.3)} />}
        </g>
      </g>}
      {iPen && <g><Pen x={iPos[0]} y={iPos[1]} dir={-1} /><circle cx={iHand[0]} cy={iHand[1]} r={27} fill={C.skinHer} /></g>}
      {dPen && <g>{iPass && <Arm shoulder={[iX - 20, 1072]} hand={iPassHand} coat={C.coatHer} skin={C.skinHer} lens={lens(Math.hypot(iPassHand[0] - iX + 20, iPassHand[1] - 1072))} />}<circle cx={dHand[0]} cy={dHand[1]} r={27} fill={C.skinHim} /><Pen x={penTip[0]} y={penTip[1]} dir={1} /></g>}
      {/* bench front and the platform edge hide the lower bodies */}
      <rect x={430} y={1186} width={690} height={110} rx={16} fill={C.rustDark} />
      <rect x={470} y={1290} width={26} height={140} fill={C.ink} /><rect x={1040} y={1290} width={26} height={140} fill={C.ink} />
      <rect x={-900} y={1296} width={3000} height={1200} fill="#5A2E26" />
      <rect x={-900} y={1296} width={3000} height={12} fill={C.cream} />
      <Bubble x={350} y={800} text="hi." age={t - B.hiHim} tailX={420} />
      <Bubble x={960} y={800} text="hi." age={t - B.hiHer} tailX={905} />
    </g>
  </g>;
};

// ------------------------------------------------------------------------------------- cut-in: the page under him
const CutIn: React.FC<{tv: number}> = ({tv}) => {
  const k = smooth(tv, 6.62, 6.78) * (1 - smooth(tv, 7.75, 7.88));
  if (k <= 0.01 || tv > 7.95) return null;
  const crum = smooth(tv, 7.0, 7.16);
  const shade = smooth(tv, 6.7, 7.0);
  const pts = [[-96, -60], [-40, -92], [20, -70], [84, -96], [110, -30], [88, 30], [112, 78], [40, 96], [-20, 70], [-84, 94], [-112, 30], [-84, -14]];
  return <g transform={`translate(318 950) rotate(-3) scale(${1.2 * (0.6 + 0.4 * k)})`} opacity={k}>
    <rect x={-210 + 10} y={-190 + 12} width={420} height={380} rx={26} fill={C.rust} />
    <clipPath id="cutclip"><rect x={-210} y={-190} width={420} height={380} rx={26} /></clipPath>
    <g clipPath="url(#cutclip)">
      <rect x={-210} y={-190} width={420} height={380} fill={C.green} />
      <rect x={-210} y={-190} width={420} height={30} fill="#3A5C4D" />
      <g opacity={1 - crum} transform={`rotate(-6) scale(${1 - 0.15 * shade})`}>
        <rect x={-150} y={-100} width={300} height={200} rx={8} fill={C.paper} stroke={C.ink} strokeWidth={4} />
        <rect x={-150} y={-100} width={20} height={200} fill={C.orange} />
        <text x={10} y={-48} textAnchor="middle" fontFamily={JOST} fontWeight={600} fontSize={34} fill={C.ink}>Where I'll be</text>
        <text x={10} y={-8} textAnchor="middle" fontFamily={JOST} fontWeight={600} fontSize={34} fill={C.ink}>at 6 (4,4)</text>
        {Array.from({length: 8}, (_, i) => <rect key={i} x={-110 + i * 30 + (i > 3 ? 12 : 0)} y={20} width={26} height={30} fill="none" stroke={C.ink} strokeWidth={3} />)}
        <text x={-124} y={84} fontFamily={PEN} fontWeight={700} fontSize={32} fill={C.ink}>– Iris</text>
      </g>
      <g opacity={crum} transform={`scale(${lerp(1.1, 1.3, crum)})`}>
        <polygon points={pts.map((p) => p.join(',')).join(' ')} fill={C.paper} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
        <path d="M -96 -60 L 10 10 L 84 -96 M -112 30 L 10 10 L 88 30 M 10 10 L 40 96 M 10 10 L -20 70 M -40 -92 L -30 -20" stroke={C.ink} strokeWidth={3} fill="none" opacity={0.55} />
        <text x={-70} y={-24} fontFamily={JOST} fontWeight={600} fontSize={26} fill={C.ink} transform="rotate(-14)">Where I'll</text>
        <text x={-30} y={64} fontFamily={PEN} fontWeight={700} fontSize={30} fill={C.ink} transform="rotate(-8)">– Iris</text>
        <rect x={-100} y={-6} width={22} height={26} fill="none" stroke={C.ink} strokeWidth={2.5} transform="rotate(-20)" />
      </g>
      <g opacity={shade * (1 - crum)} fill={C.ink}><ellipse cx={0} cy={0} rx={250} ry={190} opacity={0.22} /></g>
      {crum > 0.2 && <g stroke={C.cream} strokeWidth={7} strokeLinecap="round" opacity={1 - smooth(tv, 7.5, 7.8)}>
        {Array.from({length: 10}, (_, i) => { const a = (i / 10) * Math.PI * 2, r1 = 130 + 36 * crum, r2 = 170 + 50 * crum; return <path key={i} d={`M ${Math.cos(a) * r1} ${Math.sin(a) * r1 * 0.85} L ${Math.cos(a) * r2} ${Math.sin(a) * r2 * 0.85}`} />; })}
      </g>}
    </g>
    <rect x={-210} y={-190} width={420} height={380} rx={26} fill="none" stroke={C.ink} strokeWidth={6} />
    <text x={0} y={-124} textAnchor="middle" fontFamily={PEN} fontWeight={700} fontSize={60} fill={C.cream} stroke={C.ink} strokeWidth={8} paintOrder="stroke" opacity={crum}>crunch</text>
  </g>;
};

// ------------------------------------------------------------------------------------- end card
const EndCard: React.FC<{t: number}> = ({t}) => {
  const k = smooth(t, B.endcard - 0.02, B.endcard + 0.25);
  if (k <= 0) return null;
  const a = t - B.endcard;
  const word = 'THEEND';
  return <g transform={`translate(0 ${(1 - k) * 1950})`}>
    <PosterBg t={t} dark />
  </g>;
};

// ------------------------------------------------------------------------------------- scene
const Scene: React.FC<{t: number; hook: Hook}> = ({t, hook}) => {
  const tv = tvOf(t);
  const c0 = camAt(CAM, tv);
  const ja = t < CUT ? tv - 7.0 : -1;
  const shake = ja >= 0 && ja < 0.25 ? 1 - ja / 0.25 : 0;
  const cam = {...c0, x: c0.x + shake * Math.sin(ja * 110) * 10, y: c0.y + shake * Math.cos(ja * 95) * 8};
  const rewinding = t >= 8.2 && t <= 8.8;
  const inTrain = rewinding || (t >= T_TRAIN - 0.02 && t <= T_TRAIN + 0.82);
  const platOp = smooth(t, 18.85, 19.2);
  const S = (text: string, y: number, from: number, to: number, size: number, rot: number, hue: 'ink' | 'orange' | 'cream' = 'ink', fade = true, maxW = 1040) =>
    t >= from && t <= to ? <Strip text={text} y={y} age={t - from} out={fade ? smooth(t, to - 0.12, to) : 0} size={size} rot={rot} hue={hue} maxW={maxW} /> : null;
  const sp = spec.strips;
  const q = (s: string) => sp.find((x) => x.text === s)!;
  const bodyStrip = (s: string, size: number, rot: number) => { const e = q(s); return S(s, e.y, e.from, e.to, size, rot); };
  const endOn = t >= B.endcard;
  return <MotionBlurWhen fast={inTrain} samples={5} shutter={220}>
    <AbsoluteFill>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, background: C.cream}}>
        {platOp < 1 && <Carriage t={t} tv={tv} cam={cam} />}
        {platOp > 0 && <g opacity={platOp}><Platform t={t} /></g>}
        {t < CUT && <CutIn tv={tv} />}
        <EndCard t={t} />
        <PassingTrain t={t} t0={T_TRAIN} dir={-1} />
        {/* hook strip: the only thing that differs between variants, and the only strip on frame 1 */}
        {t < 3.0 && <Strip text={(spec.hooks as Record<string, string>)[hook]} y={330} age={1 + t} out={smooth(t, 2.8, 3.0)} size={58} rot={0} maxW={900} outline />}
        {S('take 1: SEAT', 337, 3.0, 8.0, 92, -1.5, 'orange')}
        {bodyStrip('I saved her seat.', 86, -1)}
        {bodyStrip('She didn\'t come.', 86, 1)}
        {bodyStrip('I sat on her clue.', 86, -1)}
        {S('rewind.', 345, 8.2, 9.1, 100, 1, 'orange', false)}
        {S('take 2: TIME', 337, 9.3, 15.0, 92, 1.5, 'cream')}
        {bodyStrip('no Iris on the 7:42. just her clue.', 80, -1)}
        {bodyStrip('where she\'d be at 6:', 88, 1)}
        {bodyStrip('I rode to the end of the line.', 84, 1)}
        {bodyStrip('she was there.', 88, -1)}
        {bodyStrip('her last clue for me:', 88, 1)}
        {bodyStrip('out loud, at last:', 64, -1)}
        {endOn && <Strip text="seven across" y={400} age={t - B.endcard} out={0} size={92} rot={0} hue="cream" />}
        {t >= B.endcard + 0.15 && <Strip text="the end" y={640} age={t - B.endcard - 0.15} out={0} size={200} rot={0} hue="orange" />}
        {t >= B.endcard + 0.3 && <Strip text="a new story starts next." y={930} age={t - B.endcard - 0.3} out={0} size={70} rot={0} hue="cream" />}
      </svg>
    </AbsoluteFill>
  </MotionBlurWhen>;
};

export const Across5: React.FC<{hook?: Hook}> = ({hook = 'a'}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  return <AbsoluteFill style={{background: C.cream}}>
    <Audio src={staticFile('audio/across-ep5-room.wav')} volume={0.55} />
    <Audio src={staticFile('audio/across-ep5-music.wav')} volume={0.8} />
    <Audio src={staticFile('audio/across-ep5-sfx.wav')} volume={0.9} />
    <Scene t={t} hook={hook} />
  </AbsoluteFill>;
};
