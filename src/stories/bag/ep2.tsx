import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, lerp, smooth} from '../../lib/motion';
import {MotionBlurWhen} from '../../lib/shots';
import {
  Bag, Board, C, Cam, Defs, EndCard, FarBelt, Floor, FlapRim, Flowers, HallWall, Hand, KraftTag, Mouth, NearBelt, NearRail, Pen, Person, Phone, Pose,
  Strip, TagLine, VoteBg, VoteCard, WIPE_DUR, flapEdge, planeT, tagGeom,
} from './world';
import spec from '../../../specs/stories/bag-ep2.json';

// Same Bag, part 2 "Rough trip". Silent. Frame 1 fully drawn: ONE strip (the hook), two big faces, his phone lit mid-swipe, her
// big kraft tag "(rough trip?)". Backstory early (limp flowers). Take 1: his cool answer, he sets his bag on the belt and it rides
// off, he chases it. Rewind (reversed belt-flap wipe). Take 2: the honest answer, she laughs with him, writes back, her own tag,
// the tags tap. Cliff: her zip jams with the phone half in. Vote board, end card.

export const BAG2_FPS = 60;
export const BAG2_FRAMES = Math.round(spec.duration * BAG2_FPS);
export type Hook = 'a' | 'b';
const B = spec.beats;
const WIPE_AT = B.voteWipe;
const VOTE_AT = WIPE_AT + WIPE_DUR;
const RW0 = B.rewind, RW1 = B.take2;

type KF = number[];
const kf = (keys: KF[], t: number): number[] => {
  if (t <= keys[0][0]) return keys[0].slice(1);
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) { const a = keys[i - 1], b = keys[i], k = smooth(t, a[0], b[0]); return a.slice(1).map((v, j) => lerp(v, b[j + 1], k)); }
  }
  return keys[keys.length - 1].slice(1);
};
const keyAt = <T,>(list: [number, T][], t: number): T => { let v = list[0][1]; for (const [a, b] of list) if (t >= a) v = b; return v; };
const wp = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const JOSTF = '"Jost", sans-serif';

// ------------------------------------------------------------------------------------------ shots
type ShotId = 'A' | 'B' | 'tag1' | 'M1' | 'M2' | 'W' | 'tag2' | 'R' | 'tag3' | 'U' | 'tag4' | 'TT' | 'P' | 'vote' | 'end';
const SHOTS: [number, ShotId][] = [[0, 'A'], [3.0, 'B'], [5.8, 'tag1'], [7.8, 'M1'], [9.4, 'M2'], [11.0, 'W'], [RW0, 'tag2'], [15.4, 'R'], [17.1, 'tag3'], [18.6, 'U'], [19.0, 'tag4'],
  [20.4, 'TT'], [21.8, 'P'], [VOTE_AT, 'vote'], [B.endcard, 'end']];
const shotAt = (t: number): ShotId => keyAt(SHOTS, t);
const shotStart = (t: number) => { let s = 0; for (const [a] of SHOTS) if (t >= a) s = a; return s; };

type Fig = {x: number; y: number; s: number};
const PY = 815;
const LAYOUT: Record<string, {him: Fig; her: Fig; cam: Cam}> = {
  A: {him: {x: 290, y: PY, s: 1}, her: {x: 790, y: PY, s: 1}, cam: {x: 540, y: 960, z: 1.0}},
  B: {him: {x: 330, y: PY + 10, s: 1.1}, her: {x: 1040, y: PY, s: 1}, cam: {x: 520, y: 960, z: 1.02}},
  M1: {him: {x: 300, y: PY, s: 1}, her: {x: 800, y: PY, s: 1}, cam: {x: 540, y: 960, z: 1.0}},
  M2: {him: {x: 300, y: PY, s: 1}, her: {x: 800, y: PY, s: 1}, cam: {x: 540, y: 960, z: 1.03}},
  W: {him: {x: 120, y: PY + 20, s: 0.88}, her: {x: 860, y: PY + 20, s: 0.88}, cam: {x: 540, y: 960, z: 0.92}},
  R: {him: {x: 270, y: PY + 40, s: 1.15}, her: {x: 800, y: PY + 40, s: 1.15}, cam: {x: 540, y: 960, z: 1.05}},
  U: {him: {x: 230, y: PY, s: 1}, her: {x: 640, y: PY + 10, s: 1.05}, cam: {x: 560, y: 960, z: 1.03}},
  TT: {him: {x: 300, y: PY + 30, s: 1.15}, her: {x: 790, y: PY + 30, s: 1.15}, cam: {x: 540, y: 960, z: 1.04}},
  P: {him: {x: 250, y: PY, s: 1}, her: {x: 640, y: PY + 20, s: 1.05}, cam: {x: 800, y: 1000, z: 1.3}},
};
const layoutOf = (t: number) => LAYOUT[shotAt(t)] ?? LAYOUT.A;

// ------------------------------------------------------------------------------------------ poses
const HIM_LOOK: KF[] = [[0, -0.6, 0.8], [1.5, -0.6, 0.8], [1.75, 0.95, 0.2], [2.4, 0.9, 0.3], [2.7, -0.2, 0.8], [3.2, -0.3, 0.85], [4.6, -0.3, 0.85], [5.0, 0, 0.9], [5.7, 0, 0.9],
  [7.8, 0.6, 0.3], [8.0, 0, -0.7], [9.4, 0, -0.6], [10.0, 0.9, 0.3], [10.35, 0.9, 0.3], [10.5, -0.8, 0.8], [11.0, -0.6, 0.6], [12.6, -0.95, 0.2], [13.6, 0.5, 0.5], [15.4, 0.9, 0.3], [16.5, 0.7, 0.5],
  [17.1, 0.9, 0.3], [18.6, 0.9, 0.3], [19.0, 0.7, 0.6], [20.4, 0.9, 0.2], [21.4, 0.5, 0.1], [21.9, 0.9, 0.3]];
const HER_LOOK: KF[] = [[0, -0.8, 0.3], [3.0, -0.9, 0.3], [5.8, -0.9, 0.3], [7.8, 0, 0.9], [8.4, 0, 0.9], [8.7, -0.8, 0.2], [10.0, -0.9, 0.4], [12.6, -0.9, 0.2], [13.6, -0.5, 0.5], [15.4, 0, 0.9], [16.1, 0, 0.9],
  [16.3, -0.9, 0.9], [16.7, -0.7, 0.3], [17.1, 0, 0.9], [18.6, 0.3, 0.8], [20.4, -0.7, 0.3], [21.8, 0.2, 0.9], [22.1, 0.5, 0.9]];
const HIM_MOUTH: [number, Mouth][] = [[0, 'flat'], [1.7, 'o'], [2.6, 'flat'], [3.9, 'soft'], [4.7, 'gulp'], [5.4, 'flat'], [7.9, 'smirk'], [10.4, 'o'], [11.0, 'grit'], [12.6, 'o'], [13.6, 'flat'],
  [15.4, 'gulp'], [16.0, 'smile'], [16.2, 'laugh'], [16.9, 'smile'], [17.1, 'flat'], [18.6, 'soft'], [20.4, 'smile'], [21.8, 'smile'], [22.0, 'o']];
const HER_MOUTH: [number, Mouth][] = [[0, 'smirk'], [4.7, 'soft'], [5.8, 'smirk'], [8.0, 'soft'], [10.0, 'smile'], [12.6, 'soft'], [13.6, 'smirk'], [15.4, 'soft'], [B.laugh, 'laugh'], [16.9, 'smile'],
  [17.1, 'smirk'], [20.4, 'smile'], [21.8, 'soft'], [22.1, 'o']];
const blinkAt = (t: number, seed: number) => { const ph = (t + seed) % 3.7; return ph < 0.14 ? Math.sin((ph / 0.14) * Math.PI) : 0; };
const laughAt = (t: number) => t >= B.laugh && t < 16.9;
const toastAt = (t: number) => t >= B.tagTap && t < 21.8;

const himPose = (t: number): Pose => {
  const [lx, ly] = kf(HIM_LOOK, t);
  const frozen = t >= B.freeze && t < 2.4;
  const pomp = smooth(t, 7.8, 8.1) * (1 - smooth(t, 9.95, 10.1));
  const startle = smooth(t, 10.4, 10.55) * (1 - smooth(t, 12.5, 12.6));
  const H = toastAt(t) || laughAt(t);
  const sweat = 0.6 * smooth(t, 10.5, 11.2) * (1 - smooth(t, 13.2, 13.6)) + 0.3 * smooth(t, 4.7, 5.0) * (1 - smooth(t, 5.7, 5.8));
  const flush = Math.max(smooth(t, 1.7, 2.4) * (1 - smooth(t, 5.8, 6.5)), smooth(t, 10.4, 10.8) * (1 - smooth(t, 13, 13.6)), smooth(t, 15.4, 15.8) * (1 - smooth(t, 16.8, 17.4)), smooth(t, 21.9, 22.2) * 0.5);
  return {look: [lx, ly], brow: 0.15 + (frozen ? 0.6 : 0) + pomp * 0.5 + startle * 0.7 + (t > 22 && t < 22.9 ? 0.6 : 0), worry: Math.max(smooth(t, 4.7, 5.0) * 0.8 * (1 - smooth(t, 5.7, 5.8)), startle * 0.8, t > 15.4 && t < 15.95 ? 0.3 : 0),
    mouth: keyAt(HIM_MOUTH, t), happy: H, sweat, gulp: 0, tilt: laughAt(t) ? Math.sin(t * 20) * 3 : H ? Math.sin(t * 14) * 2 : pomp ? -5 * pomp + Math.sin(t * 3) * 1.5 : frozen ? 0 : Math.sin(t * 0.9) * 1.1,
    bob: laughAt(t) ? -Math.abs(Math.sin(t * 20)) * 8 : H ? -Math.abs(Math.sin(t * 14)) * 6 : 0, blink: frozen || pomp > 0.5 ? 0 : blinkAt(t, 0.4), sway: frozen ? 0 : 1, flush};
};
const herPose = (t: number): Pose => {
  const [lx, ly] = kf(HER_LOOK, t);
  const L = laughAt(t), H = toastAt(t);
  const nod = t >= 7.9 && t < 8.5 ? Math.sin(wp(t, 7.9, 8.5) * Math.PI * 2) * 4 : 0;
  const huh = t >= 22.1 && t < 22.9 ? 1 : 0;
  return {look: [lx, ly], brow: (t > 4.7 && t < 5.8 ? 0.45 : 0.1) + huh * 0.7, browR: 0.1 + huh * 0.4, worry: 0, mouth: keyAt(HER_MOUTH, t), happy: L || H, sweat: 0, gulp: 0,
    tilt: L ? Math.sin(t * 21 + 1) * 3 : H ? Math.sin(t * 12) * 2 : huh ? 5 : Math.sin(t * 0.8 + 2) * 1.2 + nod, bob: L ? -Math.abs(Math.sin(t * 21 + 1)) * 9 : 0, blink: blinkAt(t, 1.9), sway: 1, flush: 0};
};

// ------------------------------------------------------------------------------------------ bags
const FLOOR_Y = 1592, BELT_Y = 1392;
const HIS_FLOOR = {x: 150, y: FLOOR_Y}, HERS_FLOOR = {x: 940, y: FLOOR_Y};
const BELT_SPEED = 300;
const beltPos = (t: number) => BELT_SPEED * t;
type BagS = {x: number; y: number; rot: number; show: boolean; lifted: number};
const hisBagAt = (t: number): BagS => {
  if (t < 8.2 || t >= RW1) return {...HIS_FLOOR, rot: 0, show: true, lifted: 0};
  if (t < 8.7) {
    const k = smooth(t, 8.2, 8.7);
    return {x: lerp(HIS_FLOOR.x, 470, k), y: lerp(FLOOR_Y, BELT_Y, k) - 110 * Math.sin(k * Math.PI), rot: -8 * Math.sin(k * Math.PI), show: true, lifted: 1 - smooth(t, 8.55, 8.7)};
  }
  const x = 470 - BELT_SPEED * (t - 8.7);
  const settle = t < 8.95 ? Math.sin(wp(t, 8.7, 8.95) * Math.PI) * 6 : 0;
  return {x, y: BELT_Y - settle * 0.4, rot: t > 9.1 ? Math.sin(t * 9) * 2 : 0, show: x > -190, lifted: 0};
};

// ------------------------------------------------------------------------------------------ phones
const swipeOf = (ticks: number[], t: number) => {
  let idx = -1;
  for (let i = 0; i < ticks.length; i++) if (ticks[i] <= t) idx = i;
  if (idx < 0) return {p: 0, dir: 1};
  return {p: clamp((t - ticks[idx]) / 0.26), dir: idx % 2 ? -1 : 1};
};
const HIM_TICKS = [-0.1, ...spec.audio.swipeTicks];

// ------------------------------------------------------------------------------------------ whole-frame tag inserts
type InsLine = [string, number, number];
type Ins = {t0: number; t1: number; who: 'him' | 'her'; lines: InsLine[]; H: number; size: number; slide: number; tagStringColor?: string; own?: boolean};
const INS: Record<string, Ins> = {
  tag1: {t0: 5.8, t1: 7.8, who: 'him', lines: [['(rough trip?)', 0, 0], ['(work.', 6.2, 6.8], ['very busy.)', 6.8, 7.4]], H: 600, size: 150, slide: 7.6},
  tag2: {t0: RW1, t1: 15.4, who: 'him', lines: [['(rough trip?)', 0, 0], ['(a date', 13.9, 14.5], ['that died.)', 14.5, 15.1]], H: 600, size: 150, slide: 15.2},
  tag3: {t0: 17.1, t1: 18.6, who: 'her', lines: [['(rough trip?)', 0, 0], ['(a date', 0, 0], ['that died.)', 0, 0], ['(their loss.)', 17.1, 17.75]], H: 700, size: 130, slide: -18.4},
  tag4: {t0: 19.0, t1: 20.4, who: 'her', lines: [['(same. layover.)', 19.1, 20.2]], H: 460, size: 150, slide: 0, tagStringColor: C.hiVis, own: true},
};
const INSERT_BG = (t: number) => <g>
  <g filter="url(#blurSoft)"><HallWall /><NearBelt pos={beltPos(t)} /><Floor /></g>
  <rect x={-100} y={-100} width={1300} height={2200} fill={C.concrete} opacity={0.72} />
</g>;

const TagInsert: React.FC<{t: number; id: keyof typeof INS}> = ({t, id}) => {
  const c = INS[id];
  const age = t - c.t0;
  const pop = 0.92 + 0.08 * (1 - Math.pow(1 - clamp(age / 0.2), 3));
  const W = 920;
  const lines: TagLine[] = c.lines.map(([txt, a, b]) => ({txt, p: a === 0 ? 1 : wp(t, a, b)}));
  const g = tagGeom(W, c.H, lines.length, lines.map((l) => l.txt), c.size);
  // current writing line
  const written = c.lines.map(([, a, b], i) => (a > 0 ? {i, a, b} : null)).filter(Boolean) as {i: number; a: number; b: number}[];
  const w0 = written[0].a - 0.25, w1 = written[written.length - 1].b + 0.35;
  let li = written[0].i;
  for (const w of written) if (t >= w.a - 0.02) li = w.i;
  const p = lines[li].p;
  const px = g.x0 + g.widths[li] * p, py = g.ys[li] + 4 + Math.sin(t * 40) * 3;
  const penOn = t >= w0 && t < w1;
  const approach = 1 - smooth(t, w0, w0 + 0.25), leave = smooth(t, w1 - 0.35, w1);
  const off = Math.max(approach, leave) * 400;
  const tx = px + off, ty = py + off * 0.8;
  const sl = c.slide ? smooth(t, Math.abs(c.slide), Math.abs(c.slide) + 0.25) : 0;
  const sx = Math.sign(c.slide || 1) * 1200 * sl * sl;
  const hold = id === 'tag4' ? smooth(t, 20.2, 20.35) : 0;
  return <g>
    {INSERT_BG(t)}
    <g transform={`translate(${540 + sx} ${(c.H > 650 ? 790 : 760) - 24 * hold}) rotate(${-2 + 2 * hold}) scale(${pop * (1 + 0.04 * hold)})`}>
      <KraftTag w={W} h={c.H} lines={lines} size={c.size} id={`ti${id}`} string={!!c.own} stringColor={c.tagStringColor} />
      {penOn && <g>
        <Pen x={tx} y={ty} rot={50} cap={t < spec.audio.penCaps[0] + 0.4 && id === 'tag1'} />
        <Hand who={c.who} x={tx + 140} y={ty - 120} rot={20} base={[tx + 700, ty + 900]} style="fist" scale={1.05} />
      </g>}
    </g>
  </g>;
};

// ------------------------------------------------------------------------------------------ hall (main scene)
const FARBAG_RIBBON = true;

const Hall: React.FC<{t: number}> = ({t}) => {
  const id = shotAt(t);
  const L0 = layoutOf(t);
  const L = {...L0, him: {...L0.him}};
  const lt = t - shotStart(t);
  const cam: Cam = {x: L.cam.x + Math.sin(t * 0.7) * 4 + lt * 3, y: L.cam.y + Math.sin(t * 1.0) * 3, z: L.cam.z * (1 + 0.012 * Math.min(1, lt / 2.5))};
  const pos = beltPos(t);
  const him = himPose(t), her = herPose(t);
  const hb = hisBagAt(t);
  const hs = swipeOf(HIM_TICKS, t);
  const puff = smooth(t, 7.9, 8.2) * (1 - smooth(t, 9.95, 10.1));
  const mid: React.ReactNode[] = [];     // plane 0.9 (figures' layer): hands, phones, tags
  const front: React.ReactNode[] = [];   // plane 1.0 after bags
  const fb = null as number | null;

  // his flowers: in hand (limp) for the take-2 shots
  const limpInHand = (key: string) => {
    const gx = 150 + Math.sin(t * 2) * 3, gy = 1150;
    mid.push(<g key={key}>
      <Flowers droop={1} x={gx} y={gy} scale={0.95} rot={8} t={t} />
      <Hand who="him" x={gx} y={gy + 6} rot={0} base={[gx - 200, 2050]} scale={0.9} />
    </g>);
  };

  // ---- A: frame 1
  if (id === 'A') {
    const moveDown = smooth(t, 2.2, 2.55);
    const lit = 1 - 0.7 * moveDown;
    mid.push(<Phone key="ph" who="him" x={215} y={1125 + 440 * moveDown} rot={-6 + 8 * moveDown} scale={1.3} p={t < B.freeze ? hs.p : 0} dir={hs.dir} thumb={t < B.freeze ? 1 : 0} lit={lit} base={[250, 2150]} />);
    const tx = 640, ty = 1100 + Math.sin(t * 1.4) * 4, tr = -4 + Math.sin(t * 0.9) * 0.8;
    mid.push(<g key="tg">
      <ellipse cx={tx} cy={ty + 30} rx={500} ry={210} fill="#FFF8E8" opacity={0.65} filter="url(#blurSoft)" />
      <KraftTag w={820} h={400} lines={[{txt: spec.cards.tag_front, p: 1}]} size={150} x={tx} y={ty} rot={tr} id="tf" string={false} />
      <Hand who="her" x={tx + 120} y={ty + 190} rot={-10} base={[tx + 300, 2000]} scale={0.95} />
    </g>);
  }

  // ---- B: flowers
  const flowerGrip = () => {
    const k = smooth(t, 3.2, 3.95);
    const gx = lerp(286, 335, k), gy = lerp(1628, 1135, k);
    const d0 = wp(t, 4.7, 5.2);
    const droop = d0 < 1 ? d0 * d0 * (3 - 2 * d0) : 1;
    return {gx, gy, k, droop, sc: lerp(0.55, 1.0, k)};
  };
  if (id === 'B') {
    const f = flowerGrip();
    if (t >= 3.3) mid.push(<g key="fl">
      <Flowers droop={f.droop} x={f.gx} y={f.gy} scale={f.sc} t={t} fall={t >= 4.8 ? t - 4.8 : -1} rot={f.k * 4} />
      {t >= 3.2 && <Hand who="him" x={f.gx} y={f.gy + 4 + (t > 4.7 && t < 4.95 ? 10 : 0)} rot={0} base={[f.gx - 150, 2050]} scale={0.9} />}
    </g>);
  }

  // ---- M1 / M2: take 1 (pompous)
  const herTag = (x: number, y: number, s: number, rot: number, lines: TagLine[], key: string, hand = true) => (
    <g key={key}>
      {hand && <Hand who="her" x={x + 90 * s * 1.6} y={y + 160 * s * 1.6} rot={-10} base={[x + 380, 2050]} scale={0.95} />}
      <KraftTag w={920} h={560} lines={lines} size={150} x={x} y={y} rot={rot} scale={s} id={`h${key}`} string={false} />
    </g>);
  if (id === 'M1' || id === 'M2') {
    const lines: TagLine[] = [{txt: '(rough trip?)', p: 1}, {txt: '(work.', p: 1}, {txt: 'very busy.)', p: 1}];
    const pointing = id === 'M2' && t >= B.point;
    mid.push(herTag(pointing ? 870 : 790, pointing ? 1190 : 1110, pointing ? 0.46 : 0.5, -6, lines, 'm1'));
    if (pointing) {
      const k = smooth(t, B.point, B.point + 0.25);
      mid.push(<Hand key="pt" who="her" x={lerp(960, 640, k)} y={lerp(1350, 1030, k)} rot={-70} base={[1060, 2050]} style="point" opacity={clamp(k * 3)} />);
    }
    // watch tap (hands free after the bag is down)
    if (t >= 8.55 && t < B.point + 0.2) {
      const a = smooth(t, 8.55, 8.8) * (1 - smooth(t, B.point, B.point + 0.2));
      const tap = Math.max(0, Math.sin(t * 16)) * 14;
      mid.push(<g key="wr" opacity={a}>
        <Hand who="him" x={400} y={1080} rot={-8} base={[560, 2050]} scale={0.95} />
        <ellipse cx={400} cy={1110} rx={48} ry={9} fill="none" stroke="#FFF" strokeOpacity={0.7} strokeWidth={5} strokeDasharray="10 8" transform="rotate(-8 400 1110)" />
        <Hand who="him" x={300 + tap} y={1030 - tap * 0.4} rot={30} base={[100, 2050]} style="point" scale={0.9} />
        {tap > 8 && [0, 1, 2].map((i) => <path key={i} d={`M ${338 + i * 16} ${1004 - i * 12} l 10 -6`} stroke={C.carbon} strokeWidth={6} strokeLinecap="round" />)}
      </g>);
    }
  }
  // his bag handle hand (lift)
  if ((id === 'M1') && hb.lifted > 0 && t >= 8.2) {
    front.push(<Hand key="hl" who="him" x={hb.x} y={hb.y - 196} rot={0} base={[hb.x - 330, hb.y + 160]} scale={0.85} opacity={smooth(t, 8.2, 8.3)} />);
  }
  if (id === 'M1' && t < 8.2) {
    front.push(<Hand key="hl0" who="him" x={HIS_FLOOR.x} y={FLOOR_Y - 196} rot={0} base={[HIS_FLOOR.x - 330, FLOOR_Y + 160]} scale={0.85} />);
  }

  // ---- W: the chase
  let speedLines: React.ReactNode = null;
  if (id === 'W') {
    const k = smooth(t, 11.0, 12.55);
    const hx = lerp(120, 640, k);
    L.him.x = hx;
    const stride = Math.sin(t * 24);
    mid.push(<g key="run">
      <Hand who="him" x={hx - 170 + stride * 26} y={1150 - Math.abs(stride) * 14} rot={0} base={[hx - 250, 1900]} scale={0.8} />
      <Hand who="him" x={hx + 170 - stride * 26} y={1150 - Math.abs(stride) * 14} rot={0} base={[hx + 250, 1900]} scale={0.8} />
    </g>);
    speedLines = <g stroke={C.carbon} strokeWidth={9} strokeLinecap="round" opacity={0.6 * (1 - smooth(t, 12.4, 12.6))}>
      {[0, 1, 2].map((i) => <line key={i} x1={hx - 250 - i * 40 - ((t * 400 + i * 90) % 120)} y1={880 + i * 90} x2={hx - 360 - i * 40 - ((t * 400 + i * 90) % 120)} y2={880 + i * 90} />)}
    </g>;
    mid.push(herTag(870, 1120, 0.45, -5, [{txt: '(rough trip?)', p: 1}], 'w', true));
    const bx = 300 + 380 * (t - 11.0);
    mid.push(<g key="fbag"><Bag x={bx} y={1070 + Math.abs(Math.sin(t * 9)) * -4} rot={Math.sin(t * 7) * 2} scale={0.72} loop={false} tag ribbon={1} ribbonColor={C.amber} pouch /></g>);
  }

  // ---- R: take 2, she laughs with him
  if (id === 'R') {
    const lines: TagLine[] = [{txt: '(rough trip?)', p: 1}, {txt: '(a date', p: 1}, {txt: 'that died.)', p: 1}];
    mid.push(herTag(800, 1135, 0.55, -4 + (laughAt(t) ? Math.sin(t * 21) * 1.5 : 0), lines, 'r'));
    limpInHand('fl');
  }
  // ---- U: she unclips her own tag
  if (id === 'U') {
    limpInHand('fl');
    const k = smooth(t, 18.65, 18.95);
    const hx = lerp(585, 650, k), hy = lerp(1500, 1215, k);
    front.push(<g key="un">
      <KraftTag w={920} h={460} lines={[]} size={150} x={hx - 10} y={hy - 70} rot={lerp(14, -6, k)} scale={0.1 + 0.2 * k} id="lt" shadow={0.4} stringColor={C.hiVis} />
      <Hand who="her" x={hx} y={hy} rot={-20} base={[hx + 260, 2050]} scale={0.95} />
    </g>);
  }
  // ---- TT: two tags tap like glasses
  let sparks: React.ReactNode = null;
  if (id === 'TT') {
    const k = smooth(t, 20.7, 21.0), after = smooth(t, 21.0, 21.12) * (1 - smooth(t, 21.12, 21.4));
    const x1 = lerp(240, 298, k) - after * 8, x2 = lerp(840, 782, k) + after * 8, ty = 1090 - after * 6;
    mid.push(<g key="tt">
      <Hand who="him" x={x1 - 60} y={ty + 120} rot={-10} base={[x1 - 120, 1900]} scale={0.85} />
      <KraftTag w={920} h={460} lines={[{txt: '(a date', p: 1}, {txt: 'that died.)', p: 1}]} size={170} x={x1} y={ty} rot={-6 * (1 - k)} scale={0.52} id="tt1" string={false} />
      <Hand who="her" x={x2 + 60} y={ty + 120} rot={10} base={[x2 + 120, 1900]} scale={0.85} />
      <KraftTag w={920} h={460} lines={[{txt: '(same. layover.)', p: 1}]} size={170} x={x2} y={ty} rot={6 * (1 - k)} scale={0.52} id="tt2" string stringColor={C.hiVis} />
    </g>);
    const sp = wp(t, 21.0, 21.35);
    if (sp > 0 && sp < 1) sparks = <g transform="translate(540 1060)" opacity={1 - sp}>
      {Array.from({length: 8}, (_, i) => <path key={`s${i}`} d={`M 0 ${-46 - sp * 60} L 0 ${-84 - sp * 90}`} stroke={i % 2 ? C.amber : '#fff'} strokeWidth={10} strokeLinecap="round" transform={`rotate(${i * 45 + 20})`} />)}
    </g>;
  }
  // ---- P: phone buzz + zip jam
  let heldBag: React.ReactNode = null;
  if (id === 'P') {
    limpInHand('fl');
    const bx = 905, by = 1060, sc = 1.1;
    const jam = t >= B.zipJam;
    const tug = jam ? Math.sin((t - B.zipJam) * 26) * Math.exp(-(t - B.zipJam) * 0.9) : 0;
    const zipX = jam ? 60 + tug * 6 : lerp(-52, 60, smooth(t, 22.0, 22.1));
    const inK = smooth(t, 22.0, B.zipJam);
    const buzzing = t >= B.phoneOut && t < 22.0;
    const jit = buzzing ? Math.sin(t * 90) * 5 : 0;
    const rise = smooth(t, B.phoneOut, B.phoneOut + 0.18);
    const phX = lerp(700, 800, smooth(t, 21.95, 22.0)), phY = lerp(1340, 1010, rise);
    const phoneChild = t >= 22.0 && <g>
      <clipPath id="zc"><rect x={-300} y={-500} width={600} height={544} /></clipPath>
      <g clipPath="url(#zc)"><Phone who="her" x={-30} y={lerp(-170, 40, inK)} rot={jam ? 5 : -4} scale={0.8} lit={1} p={0} thumb={0} arm={false} /></g>
    </g>;
    heldBag = <g>
      <Hand who="her" x={bx} y={by - 217 * sc + 20} rot={0} base={[1200, 800]} scale={0.85} />
      <Bag x={bx + (jam ? tug * 4 : 0)} y={by} rot={jam ? tug * 1.5 : 2} scale={sc} loop tag={false} zipX={zipX} zipRot={jam ? 16 : 0} jam={jam ? 1 : 0}>{phoneChild}</Bag>
      {t < 22.0 && <g>
        <Phone who="her" x={phX + jit} y={phY} rot={-8} scale={0.62} lit={1} p={0} thumb={0} arm={false} />
        {buzzing && [0, 1].map((i) => <path key={i} d={`M ${phX - 100 - i * 24} ${phY - 20} q -14 36 0 72`} stroke={C.sky} strokeWidth={8} strokeLinecap="round" fill="none" opacity={0.9 - i * 0.3} />)}
        <Hand who="her" x={phX + 40} y={phY + 130} rot={0} base={[phX + 260, 2050]} scale={0.8} />
      </g>}
      {jam && <Hand who="her" x={bx + 60 * sc + 22 + tug * 8} y={by + 44 * sc + 12} rot={0} base={[1180, 1500]} scale={0.7} />}
    </g>;
  }

  // ---- bags
  const hisBag = id === 'W' || id === 'tag1' ? null : hb;
  const showPouchFlowers = (t >= 5.8 && t < 13.6) || (t >= 3.0 && t < 3.2);
  const hisX = id === 'B' ? 130 : hb.x;
  const hersOnFloor = id !== 'P';
  const hersAt = id === 'U' ? {x: 640, y: FLOOR_Y} : id === 'W' ? {x: 1010, y: FLOOR_Y} : HERS_FLOOR;
  const hersTag = !(id === 'U' && t >= 18.75);

  return <g>
    <g transform={planeT(cam, 0.2)}><HallWall /></g>
    <g transform={planeT(cam, 0.45)}><FarBelt t={t} pos={-pos * 0.9} empty={false} keyBag={fb} keyRibbon={FARBAG_RIBBON} /></g>
    <g transform={planeT(cam, 0.25)}><Board flip={0} y={585} /></g>
    <g transform={planeT(cam, 0.9)}>
      <Person who="him" x={L.him.x} y={L.him.y} s={L.him.s * (1 + 0.07 * puff)} t={t} pose={him} seed={0.4} />
      <Person who="her" x={L.her.x} y={L.her.y} s={L.her.s} t={t} pose={her} seed={1.9} />
      {mid}
      {speedLines}
    </g>
    <g transform={planeT(cam, 1.0)}>
      <NearBelt pos={pos} />
      <Floor />
      {hersOnFloor && <Bag x={hersAt.x} y={hersAt.y} loop tag={hersTag} tagString={C.hiVis} />}
      {hisBag && hisBag.show && <Bag x={hisX} y={hisBag.y} rot={hisBag.rot} scale={t >= 8.2 && t < 13.6 ? 1.2 : 1} loop={false} tag ribbon={1} ribbonColor={C.amber} pouch>
        {showPouchFlowers && (t < 3.2
          ? <Flowers droop={0} x={120 + 14} y={38} scale={0.5} t={t} />
          : <Flowers droop={1} x={120 + 14} y={38} scale={0.55} rot={14} t={t} />)}
      </Bag>}
      {front}
      {heldBag}
      {sparks}
    </g>
    <g transform={planeT(cam, 1.3)}><NearRail t={t} /></g>
  </g>;
};

const VoteScene: React.FC<{t: number}> = ({t}) => {
  const z = 1 + 0.02 * clamp((t - VOTE_AT) / 6);
  return <g transform={`translate(540 960) scale(${z}) translate(-540 -960)`}>
    <VoteBg t={t} />
    <text x={540} y={552} textAnchor="middle" fontFamily={JOSTF} fontWeight={800} fontSize={54} fill={C.carbon}>{spec.cards.vote_header}</text>
    <VoteCard letter="A" l1={spec.choices.A.l1} l2={spec.choices.A.l2} y={728} age={t - B.cardA} rot={-1.5} id="va" />
    <VoteCard letter="B" l1={spec.choices.B.l1} l2={spec.choices.B.l2} y={988} age={t - B.cardB} rot={1.5} id="vb" />
  </g>;
};

const renderShot = (t: number): React.ReactNode => {
  const id = shotAt(t);
  if (id === 'tag1' || id === 'tag2' || id === 'tag3' || id === 'tag4') return <TagInsert t={t} id={id} />;
  if (id === 'vote') return <VoteScene t={t} />;
  if (id === 'end') return <EndCard a={t - B.endcard} t={t} part={3} amberRibbon />;
  return <Hall t={t} />;
};

const Scene: React.FC<{hook: Hook}> = ({hook}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const inWipe = t >= WIPE_AT && t < VOTE_AT;
  const inRew = t >= RW0 && t < RW1;
  const k = inWipe ? (t - WIPE_AT) / WIPE_DUR : inRew ? (t - RW0) / (RW1 - RW0) : 0;
  const cx = inRew ? flapEdge(1 - k) : flapEdge(k);
  // rewind: the hall plays backwards (fast) under reversed flaps that carry the take-2 tag in from the left
  const tH = RW0 - 3.9 * smooth(t, RW0, RW1);
  return <>
    <MotionBlurWhen fast={inWipe || inRew} samples={5} shutter={220}>
      <AbsoluteFill>
        <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, background: C.concrete}}>
          <Defs />
          {inWipe ? <>
            <Hall t={Math.min(t, WIPE_AT + 0.2)} />
            <defs><clipPath id="newShot"><rect x={cx} y={-10} width={1400} height={2000} /></clipPath></defs>
            <g clipPath="url(#newShot)"><VoteScene t={t} /></g>
            <FlapRim k={k} />
          </> : inRew ? <>
            <Hall t={tH} />
            <defs><clipPath id="newShot"><rect x={-400} y={-10} width={cx + 400} height={2000} /></clipPath></defs>
            <g clipPath="url(#newShot)"><TagInsert t={RW1 - 0.001} id="tag2" /></g>
            <FlapRim k={1 - k} />
          </> : renderShot(t)}
        </svg>
      </AbsoluteFill>
    </MotionBlurWhen>
    <AbsoluteFill>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        {spec.strips.map((s, i) => {
          const isHook = (s as {hook?: boolean}).hook;
          if (isHook && (s as {hookProp?: string}).hookProp !== hook) return null;
          if (t >= s.to || t < s.from) return null;
          const comment = s.text.startsWith('comment');
          return <Strip key={i} text={s.text} y={s.y} age={t - s.from + (isHook ? 1 : 0.06)} out={isHook ? smooth(t, 2.85, 3.0) : smooth(t, s.to - 0.12, s.to)} size={isHook ? 58 : comment ? 76 : 62} hot={comment} rot={comment || isHook ? 0 : i % 2 ? 0.6 : -0.6} />;
        })}
      </svg>
    </AbsoluteFill>
  </>;
};

export const Bag2: React.FC<{hook?: Hook}> = ({hook = 'a'}) => (
  <AbsoluteFill style={{background: C.concrete}}>
    <Audio src={staticFile('audio/bag-ep2.wav')} volume={0.9} />
    <Scene hook={hook} />
  </AbsoluteFill>
);
