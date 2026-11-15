import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, lerp, smooth} from '../../lib/motion';
import {MotionBlurWhen} from '../../lib/shots';
import {
  Bag, Board, C, Cam, CamKey, Defs, EndCard, FarBelt, Floor, FlapRim, HallWall, Hand, KraftTag, Mouth, NearBelt, NearRail, Pen, Person, Phone, Pose,
  Strip, TagLine, Label, VoteBg, VoteCard, WIPE_DUR, camAt, flapEdge, planeT, tagGeom,
} from './world';
import spec from '../../../specs/stories/bag-ep1.json';

// Same Bag, part 1. Silent. Frame 1 is fully drawn: ONE strip (the hook), two big faces, his phone lit mid-swipe, the huge
// kraft tag "(that one's mine.)". He grabbed her identical grey bag (chartreuse loop); his own (no loop) rides past behind
// him at 3.6. She writes where his bag is, they swap, laugh, phones go in the bags; cliff: "(rough trip?)", a match pings
// in his bag, he ignores it, the belt stops and the board flips to EMPTY. Vote board, end card.

export const BAG1_FPS = 60;
export const BAG1_FRAMES = Math.round(spec.duration * BAG1_FPS);
export type Hook = 'a' | 'b';
const B = spec.beats;
const WIPE_AT = B.beltWipe;
const VOTE_AT = WIPE_AT + WIPE_DUR;

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

// ------------------------------------------------------------------------------------------ shots
type ShotId = 'A' | 'B' | 'tagHis' | 'read' | 'tagHers' | 'C' | 'laugh' | 'pockets' | 'unclip' | 'tagQ' | 'gulp' | 'wide' | 'vote' | 'end';
const JOSTF = '"Jost", sans-serif';
const SHOTS: [number, ShotId][] = [[0, 'A'], [3.3, 'B'], [5.6, 'tagHis'], [7.9, 'read'], [8.5, 'tagHers'], [10.3, 'C'], [12.4, 'laugh'], [B.phonesDown, 'pockets'], [15.4, 'unclip'],
  [15.8, 'tagQ'], [19.2, 'gulp'], [20.4, 'wide'], [VOTE_AT, 'vote'], [B.endcard, 'end']];
const shotAt = (t: number): ShotId => keyAt(SHOTS, t);
const shotStart = (t: number) => { let s = 0; for (const [a] of SHOTS) if (t >= a) s = a; return s; };

type Fig = {x: number; y: number; s: number};
const LAYOUT: Record<string, {him: Fig; her: Fig; cam: Cam}> = {
  A: {him: {x: 290, y: 735, s: 1}, her: {x: 790, y: 735, s: 1}, cam: {x: 540, y: 960, z: 1.0}},
  B: {him: {x: 330, y: 740, s: 1.1}, her: {x: 1020, y: 730, s: 1}, cam: {x: 520, y: 960, z: 1.02}},
  read: {him: {x: -600, y: 740, s: 1}, her: {x: 540, y: 800, s: 1.35}, cam: {x: 540, y: 960, z: 1.0}},
  C: {him: {x: 290, y: 720, s: 1}, her: {x: 800, y: 720, s: 1}, cam: {x: 540, y: 960, z: 1.02}},
  laugh: {him: {x: 280, y: 770, s: 1.15}, her: {x: 800, y: 770, s: 1.15}, cam: {x: 540, y: 960, z: 1.06}},
  pockets: {him: {x: 290, y: 720, s: 1}, her: {x: 790, y: 720, s: 1}, cam: {x: 540, y: 960, z: 1.03}},
  unclip: {him: {x: 290, y: 720, s: 1}, her: {x: 740, y: 720, s: 1}, cam: {x: 520, y: 960, z: 1.05}},
  gulp: {him: {x: 540, y: 800, s: 1.35}, her: {x: 1500, y: 720, s: 1}, cam: {x: 540, y: 960, z: 1.0}},
  wide: {him: {x: 270, y: 760, s: 0.9}, her: {x: 810, y: 760, s: 0.9}, cam: {x: 540, y: 960, z: 1.0}},
};
const layoutOf = (t: number) => LAYOUT[shotAt(t) === 'tagHis' || shotAt(t) === 'tagHers' || shotAt(t) === 'tagQ' ? 'A' : shotAt(t)] ?? LAYOUT.A;

// ------------------------------------------------------------------------------------------ poses
const HIM_LOOK: KF[] = [[0, -0.6, 0.8], [1.5, -0.6, 0.8], [1.75, 0.95, 0.2], [3.2, 0.95, 0.2], [3.5, 0.4, 0.8], [4.4, 0.7, 0.4], [5.5, 0.1, 0.8], [7.0, 0.1, 0.8], [8.0, 0.9, 0.3], [10.0, 0.9, 0.2],
  [10.5, -0.9, 0.2], [11.0, -0.2, 0.9], [11.6, 0.8, 0.2], [13.4, 0.8, 0.1], [14.4, 0.4, 0.9], [15.6, 0.9, 0.3], [18.8, 0.9, 0.3], [19.2, 0.95, 0.1], [20.0, 0.95, 0.1], [20.5, 0.3, 0.8]];
const HER_LOOK: KF[] = [[0, -0.8, 0.3], [1.7, -0.9, 0.3], [3.3, -0.9, 0.4], [4.5, -0.6, 0.6], [5.5, -0.3, 0.8], [7.9, -0.3, 0.9], [8.4, -0.7, 0.5], [9.5, -0.3, 0.9], [10.5, 0.6, 0.2],
  [12.0, -0.5, 0.4], [13.6, -0.9, 0.5], [14.5, -0.6, 0.8], [15.5, -0.6, 0.8], [18.0, -0.9, 0.3]];
const HIM_MOUTH: [number, Mouth][] = [[0, 'flat'], [1.7, 'o'], [3.9, 'gulp'], [5.2, 'flat'], [7.9, 'flat'], [10.4, 'o'], [11.0, 'flat'], [12.4, 'laugh'], [B.phonesDown, 'smile'], [15.4, 'flat'], [19.2, 'gulp'], [19.55, 'soft'], [20.4, 'gulp']];
const HER_MOUTH: [number, Mouth][] = [[0, 'smirk'], [7.9, 'smirk'], [10.2, 'smile'], [12.4, 'laugh'], [B.phonesDown, 'smile'], [15.0, 'smirk']];
const blinkAt = (t: number, seed: number) => { const ph = (t + seed) % 3.7; return ph < 0.14 ? Math.sin((ph / 0.14) * Math.PI) : 0; };
const laughAt = (t: number) => t >= B.laugh && t < B.phonesDown;

const himPose = (t: number): Pose => {
  const [lx, ly] = kf(HIM_LOOK, t);
  const L = laughAt(t);
  const frozen = t >= B.freeze && t < B.freeze + 1.3;
  const g = Math.sin(wp(t, B.gulp, B.gulp + 0.42) * Math.PI);
  const startle = t > B.wrongBag && t < B.wrongBag + 0.5 ? Math.sin(wp(t, B.wrongBag, B.wrongBag + 0.5) * Math.PI) : 0;
  const sweat = smooth(t, 3.4, 4.5) * 0.4 * (1 - smooth(t, 12.3, 12.5)) + smooth(t, 20.4, 20.9) * 0.45;
  return {look: [lx, ly], brow: 0.15 + (frozen ? 0.6 : 0) + startle * 0.7, worry: Math.max(smooth(t, 3.4, 3.8) * 0.8 * (1 - smooth(t, 10, 10.5)), smooth(t, 20.4, 20.9) * 0.5), mouth: keyAt(HIM_MOUTH, t), happy: L, sweat, gulp: g,
    tilt: L ? Math.sin(t * 22) * 3 : frozen ? 0 : Math.sin(t * 0.9) * 1.1, bob: L ? -Math.abs(Math.sin(t * 22)) * 9 : 0, blink: frozen ? 0 : blinkAt(t, 0.4), sway: frozen ? 0 : 1,
    flush: smooth(t, B.freeze, 3.6) * (1 - 0.5 * smooth(t, 13, 14))};
};
const herPose = (t: number): Pose => {
  const [lx, ly] = kf(HER_LOOK, t);
  const L = laughAt(t);
  return {look: [lx, ly], brow: t > 3.4 && t < 4.6 ? 0.55 : 0.1, browR: 0.1, worry: 0, mouth: keyAt(HER_MOUTH, t), happy: L, sweat: 0, gulp: 0,
    tilt: L ? Math.sin(t * 21 + 1) * 3 : Math.sin(t * 0.8 + 2) * 1.2 + (shotAt(t) === 'unclip' ? -5 : 0), bob: L ? -Math.abs(Math.sin(t * 21 + 1)) * 9 : 0, blink: blinkAt(t, 1.9), sway: 1, flush: 0};
};

// ------------------------------------------------------------------------------------------ bags
const BAG_Y = 1392;
const HERS_X = 200, HIS_X = 290, HERS_FINAL = 830;
type BagS = {x: number; y: number; rot: number; on: boolean};
const hersBag = (t: number): BagS => {
  if (t < 3.3) return {x: 135, y: BAG_Y, rot: 0, on: true};
  if (t < 11.4) return {x: HERS_X, y: BAG_Y, rot: t < 4.0 ? Math.sin((t - 3.3) * 14) * 4 * (1 - wp(t, 3.3, 4.0)) : 0, on: true};
  const k = wp(t, 11.4, 12.1);
  return {x: lerp(HERS_X, HERS_FINAL, smooth(k, 0, 1)), y: BAG_Y - 170 * Math.sin(k * Math.PI), rot: -10 * Math.sin(k * Math.PI), on: true};
};
const hisBag = (t: number): BagS => {
  if (t < 10.3) return {x: 0, y: BAG_Y, rot: 0, on: false};
  if (t < 11.0) return {x: 520 + 450 * (11.0 - t), y: BAG_Y, rot: 0, on: true};
  if (t < 11.4) { const k = smooth(t, 11.0, 11.4); return {x: lerp(520, HIS_X + 40, k), y: BAG_Y - 110 * Math.sin(k * Math.PI), rot: 6 * Math.sin(k * Math.PI), on: true}; }
  return {x: lerp(HIS_X + 40, HIS_X, smooth(t, 11.4, 11.7)), y: BAG_Y, rot: 0, on: true};
};
const handleOf = (b: BagS) => ({x: b.x, y: b.y - 218});

// ------------------------------------------------------------------------------------------ phones + swipes
const swipeOf = (ticks: number[], t: number) => {
  let idx = -1;
  for (let i = 0; i < ticks.length; i++) if (ticks[i] <= t) idx = i;
  if (idx < 0) return {p: 0, dir: 1};
  return {p: clamp((t - ticks[idx]) / 0.26), dir: idx % 2 ? -1 : 1};
};
const HIM_TICKS = [-0.1, ...spec.audio.swipeTicks];
const HER_TICKS = [-0.2, 0.35, 0.65, 0.95, 1.25, 1.55];

const POCKET_DY = 40;
const phoneIn = (who: 'him' | 'her', t: number) => {
  const bag = who === 'him' ? {x: HIS_X, y: BAG_Y} : {x: HERS_FINAL, y: BAG_Y};
  const t0 = who === 'him' ? B.phonesDown : B.phonesDown + 0.15;
  const k = smooth(t, t0, t0 + 0.9);
  const start = who === 'him' ? {x: 190, y: 1040} : {x: 925, y: 1040};
  const ym = bag.y + POCKET_DY;
  const tap = t > t0 + 0.9 && t < t0 + 1.05 ? Math.sin(wp(t, t0 + 0.9, t0 + 1.05) * Math.PI) * 8 : 0;
  return {x: lerp(start.x, bag.x, k), y: lerp(start.y, ym + 160, k) + tap, ym, k, rot: lerp(who === 'him' ? 8 : -8, 0, k), sc: lerp(0.95, 0.7, k)};
};

// ------------------------------------------------------------------------------------------ tag
const tagA = (t: number) => {
  const K: KF[] = [[0, 690, 1010, -4, 1.0], [1.7, 690, 1010, -4, 1.0], [2.4, 740, 1120, -4, 0.8], [3.3, 740, 1120, -4, 0.8], [3.4, 790, 1130, -6, 0.62], [5.3, 790, 1130, -6, 0.62], [5.6, 400, 1190, -4, 0.62]];
  const [x, y, rot, s] = kf(K, t);
  return {x, y, rot, s};
};

const FrontTag: React.FC<{t: number}> = ({t}) => {
  const a = tagA(t);
  const first = t < 3.4;
  return <g>
    <KraftTag w={640} h={330} lines={first ? [{txt: "(that one's", p: 1}, {txt: 'mine.)', p: 1}] : [{txt: "(that one's", p: 1}, {txt: 'mine.)', p: 1}]} size={132} x={a.x} y={a.y} rot={a.rot} scale={a.s} id="tf" string={false} />
  </g>;
};

const INSERT_BG = (t: number) => <g>
  <g filter="url(#blurSoft)"><HallWall /><NearBelt pos={t * 450} /><Floor /></g>
  <rect x={-100} y={-100} width={1300} height={2200} fill={C.concrete} opacity={0.72} />
</g>;

const TagInsert: React.FC<{t: number; id: ShotId}> = ({t, id}) => {
  const t0 = id === 'tagHis' ? SHOTS[2][0] : id === 'tagHers' ? SHOTS[4][0] : SHOTS[9][0];
  const age = t - t0;
  const pop = 0.92 + 0.08 * (1 - Math.pow(1 - clamp(age / 0.2), 3));
  const W = 920, H = 560;
  let lines: TagLine[], who: 'him' | 'her', writing: [number, number] | null, size: number, sx = 0, sy = 0, rot = -2;
  if (id === 'tagHis') {
    lines = [{txt: '(oh. sorry.)', p: wp(t, B.write1, 7.0)}]; who = 'him'; writing = [B.write1, 7.0]; size = 200;
    sx = 1200 * smooth(t, B.slide2, 7.9) * smooth(t, B.slide2, 7.9);
  } else if (id === 'tagHers') {
    lines = [{txt: '(oh. sorry.)', p: 1}, {txt: '(yours: behind you.)', p: wp(t, B.write2, 9.9)}]; who = 'her'; writing = [B.write2, 9.9]; size = 150;
    sx = 900 * (1 - smooth(t, 8.5, 8.7)) + 0 * age;
  } else {
    lines = [{txt: '(rough trip?)', p: wp(t, B.write3, 17.6)}]; who = 'her'; writing = [B.write3, 17.6]; size = 190;
    const sl = smooth(t, B.slide3, B.slide3 + 0.5);
    sx = 60 * sl; sy = 50 * sl; rot = -2 + 3 * sl;
  }
  const g = tagGeom(W, H, lines.length, lines.map((l) => l.txt), size);
  const li = lines.length - 1;
  const p = lines[li].p;
  const px = g.x0 + g.widths[li] * p, py = g.ys[li] + 4 + Math.sin(t * 40) * 3;
  const penOn = writing !== null && t >= writing[0] - 0.25 && t < writing[1] + 0.35;
  const approach = 1 - smooth(t, writing![0] - 0.25, writing![0]);
  const leave = smooth(t, writing![1], writing![1] + 0.35);
  const off = Math.max(approach, leave) * 400;
  const tx = px + off, ty = py + off * 0.8;
  return <g>
    {INSERT_BG(t)}
    <g transform={`translate(${540 + sx} ${800 + sy}) rotate(${rot}) scale(${pop})`}>
      <KraftTag w={W} h={H} lines={lines} size={size} id={`ti${id}`} ruled />
      {penOn && <g>
        <Pen x={tx} y={ty} rot={50} cap={t < (id === 'tagQ' ? B.uncap + 0.4 : spec.audio.penCaps[0] + 0.4)} />
        <Hand who={who} x={tx + 140} y={ty - 120} rot={20} base={[tx + 700, ty + 900]} style="fist" scale={1.05} />
      </g>}
    </g>
  </g>;
};

// ------------------------------------------------------------------------------------------ hall (main scene)
const beltPos = (t: number) => 300 * Math.min(t, B.beltStop) + 60 * smooth(t, B.beltStop, B.beltStop + 0.4);

const Hall: React.FC<{t: number}> = ({t}) => {
  const id = shotAt(t);
  const L = layoutOf(t);
  const lt = t - shotStart(t);
  const cam: Cam = {x: L.cam.x + Math.sin(t * 0.7) * 4 + lt * 3, y: L.cam.y + Math.sin(t * 1.0) * 3, z: L.cam.z * (1 + 0.012 * Math.min(1, lt / 2.5))};
  const pos = beltPos(t);
  const keyBag = 800 - 300 * (t - B.ownBagPass);
  const him = himPose(t), her = herPose(t);
  const hb = hersBag(t), sb = hisBag(t);
  const flip = wp(t, B.beltStop, B.beltStop + 0.5);
  const hs = swipeOf(HIM_TICKS, t), rs = swipeOf(HER_TICKS, t);
  const tag = tagA(t);
  const inA = id === 'A' || id === 'B';
  const hand = (k: string, el: React.ReactNode) => <g key={k}>{el}</g>;
  const els: React.ReactNode[] = [];
  let tagHand: React.ReactNode = null;

  // hers: held by him before 3.3
  if (id === 'A') {
    const h = handleOf(hb);
    els.push(hand('hh', <Hand who="him" x={h.x} y={h.y + 20} rot={0} base={[h.x - 430, h.y + 330]} scale={0.85} />));
  }
  // frame-1 phones + tag hand
  if (id === 'A') {
    els.push(hand('ph1', <Phone who="him" x={252} y={985} rot={-6} scale={1.05} p={t < B.freeze ? hs.p : 0} dir={hs.dir} thumb={t < B.freeze ? 1 : 0} base={[330, 1980]} />));
    els.push(hand('ph2', <Phone who="her" x={1000} y={900} rot={8} scale={0.8} p={t < 1.8 ? rs.p : 0} dir={rs.dir} thumb={t < 1.8 ? 1 : 0} base={[1100, 1980]} />));
  }
  if (inA) {
    const hx = tag.x + 90 * tag.s, hy = tag.y + 175 * tag.s;
    tagHand = <Hand who="her" x={hx} y={hy} rot={-10} base={[hx + 120, 1980]} scale={0.95} />;
  }
  // let-go hands (B)
  if (id === 'B') {
    const up = Math.sin(wp(t, 3.3, 4.2) * Math.PI);
    if (up > 0.02) els.push(hand('lg', <Hand who="him" x={lerp(190, 160, up)} y={lerp(1200, 940, up)} rot={0} base={[120, 1980]} style="open" opacity={clamp(up * 3)} />));
  }
  // his hand grabbing his own bag (C)
  const gHim = (t >= 10.8 && t < 12.45);
  if (id === 'C' || id === 'laugh') {
    if (gHim) { const h = handleOf(sb); els.push(hand('gh', <Hand who="him" x={h.x} y={h.y + 20} base={[h.x - 430, h.y + 330]} scale={0.85} opacity={wp(t, 10.8, 11.0)} />)); }
    if (t >= 11.4 && t < 11.75) { const h = handleOf(hb); els.push(hand('hh2', <Hand who="him" x={h.x} y={h.y + 20} base={[h.x - 430, h.y + 330]} scale={0.85} />)); }
    if (t >= 11.75 && t < 12.6) { const h = handleOf(hb); els.push(hand('hh3', <Hand who="her" x={h.x} y={h.y + 20} base={[h.x + 430, h.y + 330]} scale={0.85} opacity={wp(t, 11.7, 11.9) * (1 - smooth(t, 12.4, 12.6))} />)); }
    if (t >= 12.3 && t < B.phonesDown) { const h = handleOf(sb); els.push(hand('gh2', <Hand who="him" x={h.x} y={h.y + 20} base={[h.x - 430, h.y + 330]} scale={0.85} />)); }
  }
  if (id === 'laugh' && t >= B.tieStart && t < B.phonesDown) {
    const h = handleOf({x: HIS_X, y: BAG_Y, rot: 0, on: true});
    const k = smooth(t, B.tieStart, B.tieStart + 0.4) * (1 - smooth(t, 13.6, 13.95));
    els.push(hand('tie', <Hand who="her" x={lerp(h.x + 420, h.x + 50, k)} y={lerp(h.y + 260, h.y + 6, k)} base={[h.x + 560, h.y + 330]} rot={-20} scale={0.85} opacity={clamp(k * 3)} />));
  }
  // she points (C)
  if (id === 'C' && t < 11.0) {
    const k = smooth(t, 10.15, 10.4);
    els.push(hand('pt', <Hand who="her" x={lerp(900, 640, k)} y={lerp(1300, 1010, k)} rot={-70} base={[1000, 1980]} style="point" opacity={clamp(k * 3)} />));
  }
  // laugh + pockets: phones
  if (id === 'laugh') {
    els.push(hand('lp1', <Phone who="him" x={190} y={1040} rot={8} scale={0.95} p={0} thumb={0} base={[120, 1980]} lit={0.8} />));
    els.push(hand('lp2', <Phone who="her" x={925} y={1040} rot={-8} scale={0.95} p={0} thumb={0} base={[1000, 1980]} lit={0.8} />));
  }
  const phones: React.ReactNode[] = [];
  if (id === 'pockets') {
    const handsOn = 1 - smooth(t, B.phonesDown, B.phonesDown + 0.3);
    (['him', 'her'] as const).forEach((who) => {
      const p = phoneIn(who, t);
      phones.push(<g key={who}>
        <clipPath id={`pc${who}`}><rect x={-300} y={-300} width={1700} height={p.ym + 300} /></clipPath>
        <g clipPath={`url(#pc${who})`}><Phone who={who} x={p.x} y={p.y} rot={p.rot} scale={p.sc} lit={1 - p.k * 0.4} p={0} thumb={0} arm={handsOn > 0.01 && p.k < 0.2} base={who === 'him' ? [60, 1980] : [1060, 1980]} /></g>
      </g>);
    });
    if (t < B.phonesDown + 0.35) {
      const h1 = handleOf({x: HIS_X, y: BAG_Y, rot: 0, on: true}), h2 = handleOf({x: HERS_FINAL, y: BAG_Y, rot: 0, on: true});
      els.push(hand('k1', <Hand who="him" x={h1.x} y={h1.y + 20} base={[h1.x - 430, h1.y + 330]} scale={0.85} opacity={1 - smooth(t, B.phonesDown + 0.2, B.phonesDown + 0.35)} />));
      els.push(hand('k2', <Hand who="her" x={h2.x} y={h2.y + 20} base={[h2.x + 430, h2.y + 330]} scale={0.85} opacity={1 - smooth(t, B.phonesDown + 0.2, B.phonesDown + 0.35)} />));
    }
  }
  // unclip: her hand takes the blank tag
  let looseTag: React.ReactNode = null;
  const tagOffK = wp(t, B.tagOff, 15.78);
  if (id === 'unclip') {
    const hh = handleOf({x: HIS_X, y: BAG_Y, rot: 0, on: true});
    const hx = lerp(hh.x + 60, 560, smooth(tagOffK, 0.4, 1)), hy = lerp(hh.y + 40, 1060, smooth(tagOffK, 0.4, 1));
    const reach = smooth(t, 15.4, 15.5);
    els.push(hand('un', <Hand who="her" x={hx + 0 * reach} y={hy} rot={-20} base={[lerp(1000, hx + 220, 0.4), 1980]} scale={0.95} />));
    looseTag = <KraftTag w={920} h={560} lines={[]} size={150} x={hx - 30} y={hy - 60} rot={lerp(14, -6, smooth(tagOffK, 0.4, 1))} scale={0.095 + 0.1 * smooth(tagOffK, 0.4, 1)} id="lt" shadow={0.4} />;
  }
  // gulp: tag in her hand at right + card pops
  let gulpTag: React.ReactNode = null;
  if (id === 'gulp') {
    gulpTag = <g>
      <Hand who="her" x={870} y={1260} rot={-12} base={[990, 1980]} scale={1.0} />
      <KraftTag w={920} h={560} lines={[{txt: '(rough trip?)', p: 1}]} size={170} x={835} y={1110} rot={-8} scale={0.5} id="gt" ruled string={false} />
    </g>;
  }
  // read: she reads the tag
  let readTag: React.ReactNode = null;
  if (id === 'read') {
    readTag = <g>
      <Hand who="him" x={60} y={1050} rot={10} base={[-120, 1980]} scale={0.95} />
      <Pen x={150} y={1205} rot={-32} />
      <Hand who="him" x={78} y={1066} rot={10} base={[-120, 1980]} scale={0.95} />
      <Hand who="her" x={640} y={1262} rot={-10} base={[780, 1980]} scale={1.0} />
      <KraftTag w={920} h={560} lines={[{txt: '(oh. sorry.)', p: 1}]} size={200} x={540} y={1105} rot={-3} scale={0.6} id="rt" ruled string={false} />
    </g>;
  }
  // wide: he holds the pen over the tag, nervous
  let waitTag: React.ReactNode = null;
  if (id === 'wide') {
    const hv = Math.sin(t * 5) * 6;
    waitTag = <g>
      <Hand who="him" x={330} y={1250} rot={-6} base={[250, 1980]} scale={0.95} />
      <KraftTag w={920} h={560} lines={[{txt: '(rough trip?)', p: 1}]} size={170} x={300} y={1085} rot={-4} scale={0.46} id="wt" ruled string={false} />
      <Pen x={352} y={1070 + hv} rot={40} />
      <Hand who="him" x={495} y={925 + hv} rot={20} base={[700, 1980]} scale={0.9} />
    </g>;
  }

  // his-bag glow + buzz (gulp, wide)
  const buzzK = (t >= B.buzz && t < B.buzz + 0.2) || (t >= B.buzz + 0.2 && t < B.buzz + 0.4) ? 1 : 0;
  const glow = id === 'gulp' && t >= B.buzz - 0.05 ? 0.65 + 0.35 * buzzK : 0;
  const bagHis = {x: id === 'gulp' ? 540 : id === 'wide' ? 130 : HIS_X, y: id === 'wide' ? 1500 : BAG_Y};
  const sbOn = id === 'C' || id === 'laugh' || id === 'pockets' || id === 'unclip' || id === 'gulp' || id === 'wide';
  const hbOn = id === 'A' || id === 'B' || id === 'C' || id === 'laugh' || id === 'pockets' || id === 'unclip' || id === 'wide';
  const sbPos = id === 'C' ? sb : {...sb, x: bagHis.x, y: bagHis.y};
  const bagGulpCard = false;

  return <g>
    <g transform={planeT(cam, 0.2)}><HallWall /></g>
    <g transform={planeT(cam, 0.25)}><Board flip={flip} y={520} /></g>
    <g transform={planeT(cam, 0.45)}><FarBelt t={t} pos={pos} empty={t >= B.beltStop + 0.4 || id === 'C'} keyBag={keyBag > -400 && keyBag < 1500 ? keyBag : null} /></g>
    <g transform={planeT(cam, 0.9)}>
      <Person who="him" x={L.him.x} y={L.him.y} s={L.him.s} t={t} pose={him} seed={0.4} />
      <Person who="her" x={L.her.x} y={L.her.y} s={L.her.s} t={t} pose={her} seed={1.9} />
      {els}
      {inA && <FrontTag t={t} />}
      {tagHand}
      {looseTag}
      {gulpTag}
      {waitTag}
      {readTag}
    </g>
    <g transform={planeT(cam, 1.0)}>
      <NearBelt pos={pos} />
      <Floor />
      {hbOn && <Bag x={id === 'wide' ? 950 : hb.x} y={id === 'wide' ? 1500 : hb.y} rot={hb.rot} loop tag={false} />}
      {sbOn && <Bag x={sbPos.x} y={sbPos.y} rot={sbPos.rot ?? 0} loop={false} ribbon={t >= B.ribbon ? Math.min(1, 1.5 * (1 - Math.pow(1 - clamp((t - B.ribbon) / 0.3), 2))) : 0} tag={!(t >= B.tagOff + 0.3 && id !== 'C' && id !== 'laugh' && id !== 'pockets')} pocketGlow={glow} shake={buzzK ? 0.4 + ((t * 5) % 1) * 0.6 : 0} />}
      {bagGulpCard && <g transform={`translate(540 ${1300 - 80 * Math.min(1, (t - B.buzz) * 3)}) scale(0.9)`} opacity={0.9}>
        <circle r={150} fill="url(#glowSky)" />
        <rect x={-58} y={-88} width={116} height={176} rx={16} fill="#fff" /><rect x={-47} y={-77} width={94} height={110} rx={11} fill="#CFE3F7" /><circle cx={0} cy={-40} r={19} fill="#7C95B8" /><path d="M -37 33 Q -37 -6 0 -6 Q 37 -6 37 33 Z" fill="#7C95B8" />
      </g>}
      {phones}
      {id === 'B' && t >= 3.4 && t < 5.2 && <Label x={330} y={1100} text="hers" tx={hb.x + 40} ty={hb.y - 215} a={smooth(t, 3.4, 3.6) * (1 - smooth(t, 5.0, 5.2))} />}
      {id === 'C' && t >= 10.7 && t < 12.4 && <g opacity={smooth(t, 10.7, 10.9) * (1 - smooth(t, 12.2, 12.4))}>
        <Label x={hb.x - 40} y={hb.y - 340} text="hers" tx={hb.x + 45} ty={hb.y - 225} />
        <Label x={sbPos.x + 150} y={sbPos.y - 330} text="mine" tx={sbPos.x + 5} ty={sbPos.y - 235} />
      </g>}
    </g>
    <g transform={planeT(cam, 0.45)}>{id === 'B' && t >= 3.4 && t < 4.7 && keyBag > 560 && <Label x={Math.max(600, keyBag - 160)} y={660} text="mine" tx={keyBag - 98} ty={740} a={smooth(t, 3.4, 3.6) * (1 - smooth(t, 4.4, 4.7))} />}</g>
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
  if (id === 'tagHis' || id === 'tagHers' || id === 'tagQ') return <TagInsert t={t} id={id} />;
  if (id === 'vote') return <VoteScene t={t} />;
  if (id === 'end') return <EndCard a={t - B.endcard} t={t} />;
  return <Hall t={t} />;
};

const Scene: React.FC<{hook: Hook}> = ({hook}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const inWipe = t >= WIPE_AT && t < VOTE_AT;
  const k = inWipe ? (t - WIPE_AT) / WIPE_DUR : 0;
  const cx = flapEdge(k);
  return <>
    <MotionBlurWhen fast={inWipe} samples={5} shutter={220}>
      <AbsoluteFill>
        <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, background: C.concrete}}>
          <Defs />
          {inWipe ? <>
            <Hall t={Math.min(t, B.beltWipe + 0.2)} />
            <defs><clipPath id="newShot"><rect x={cx} y={-10} width={1400} height={2000} /></clipPath></defs>
            <g clipPath="url(#newShot)"><VoteScene t={t} /></g>
            <FlapRim k={k} />
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
          return <Strip key={i} text={s.text} y={s.y} age={t - s.from + (isHook ? 1 : 0.06)} out={isHook ? smooth(t, 2.85, 3.0) : smooth(t, s.to - 0.12, s.to)} size={isHook ? 58 : comment ? 76 : s.y === 555 ? 50 : 62} hot={comment} rot={comment || isHook ? 0 : i % 2 ? 0.6 : -0.6} />;
        })}
      </svg>
    </AbsoluteFill>
  </>;
};

export const Bag1: React.FC<{hook?: Hook}> = ({hook = 'a'}) => (
  <AbsoluteFill style={{background: C.concrete}}>
    <Audio src={staticFile('audio/bag-ep1.wav')} volume={0.9} />
    <Scene hook={hook} />
  </AbsoluteFill>
);
