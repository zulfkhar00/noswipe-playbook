import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, lerp, smooth} from '../../lib/motion';
import {MotionBlurWhen} from '../../lib/shots';
import {
  ANTON, Backdrop, C, Cam, CamKey, ChipCard, Defs, FanClip, FanRim, Mouth, Person, PhoneUnit, Pose,
  Strip, VoteBg, WIPE_DUR, camAt, planeT, textW, COUR, INTER,
} from './world';
import spec from '../../../specs/stories/whites-ep6.json';

// Fifty Whites, part 6 "One chip" (finale). Silent, no vote, no phones after 3 s. One street shot: the closed store (shutter
// down) on the left, a CAFE across the street between the two big faces. Frame 1 fully composed (hook strip, his lit phone
// mid-swipe, her chip "so, what's / your name?"). Hook b adds the catch (her eyes drop to his lit screen, one raised brow, "!",
// he flinches). Take 1 LADDER GUY fails on him; rewind (fan snaps shut); take 2 THEO; she writes "june. / hi, theo."; payoff:
// SAME taped to POPPY; they cross to the cafe; end card.

export const WHITES6_FPS = 60;
export const WHITES6_FRAMES = Math.round(spec.duration * WHITES6_FPS);
export type Hook = 'a' | 'b';
const B = spec.beats;
const TAKE2 = B.take2;

const HIM = {x: 210, y: 700}, HER = {x: 870, y: 720};
const DOOR = {him: {x: 650, y: 1190}, her: {x: 735, y: 1190}};

type KF = number[];
const kf = (keys: KF[], t: number): number[] => {
  if (t <= keys[0][0]) return keys[0].slice(1);
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const a = keys[i - 1], b = keys[i], k = smooth(t, a[0], b[0]);
      return a.slice(1).map((v, j) => lerp(v, b[j + 1], k));
    }
  }
  return keys[keys.length - 1].slice(1);
};
const keyAt = <T,>(list: [number, T][], t: number): T => { let v = list[0][1]; for (const [a, b] of list) if (t >= a) v = b; return v; };
const wp = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const stateTime = (t: number) => (t < B.rewind ? t : t < B.open ? B.rewind : t < TAKE2 ? TAKE2 : t);
const rad = (d: number) => (d * Math.PI) / 180;
const rot2 = (a: number, x: number, y: number): [number, number] => [x * Math.cos(rad(a)) - y * Math.sin(rad(a)), x * Math.sin(rad(a)) + y * Math.cos(rad(a))];
const blinkAt = (t: number, seed: number) => { const ph = (t + seed) % 3.7; return ph < 0.14 ? Math.sin((ph / 0.14) * Math.PI) : 0; };

// ------------------------------------------------------------------------------------------ faces
const HIM_LOOK: KF[] = [[0, 0.2, 0.85], [2.9, 0.2, 0.85], [3.1, 0.9, 0.35], [5.3, 0.6, 0.6], [5.7, -0.2, 0.7], [6.5, -0.2, 0.7], [6.8, 0.9, 0.35], [8.0, 0.9, 0.35], [10.0, 0.9, 0.25], [10.6, 0.95, 0.2],
  [11.3, 0.7, 0.5], [12.7, 0.9, 0.3], [13.0, -0.2, 0.8], [13.8, -0.2, 0.8], [14.1, 0.9, 0.4], [15.5, 0.9, 0.4], [17.4, 0.9, 0.3], [18.8, 0.9, 0.2], [19.4, 0.5, 0.6], [20.4, 0.3, 0.7], [21.5, 0.9, 0.3], [23.5, 0.9, 0.2]];
const HER_LOOK_A: KF[] = [[0, -0.9, 0.35], [2.5, -0.9, 0.35]];
const HER_LOOK_B: KF[] = [[0, -0.9, 0.35], [0.5, -0.9, 0.35], [0.8, -0.65, 0.95], [2.0, -0.65, 0.95], [2.5, -0.9, 0.35]];
const HER_LOOK: KF[] = [[3.0, -0.9, 0.3], [7.0, -0.9, 0.3], [7.3, -0.4, 0.95], [7.9, -0.3, 0.95], [8.2, -0.4, 0.9], [9.7, -0.4, 0.9], [10.0, 0.7, 0.2], [11.2, 0.9, 0.1], [12.7, -0.9, 0.3],
  [14.4, -0.3, 0.95], [15.2, -0.3, 0.95], [15.6, -0.4, 0.9], [17.3, -0.4, 0.9], [17.6, -0.9, 0.3], [18.8, -0.7, 0.6], [20.4, -0.5, 0.9], [21.6, -0.9, 0.3], [23.5, -0.9, 0.3], [26.0, 0.9, 0.2]];
const HIM_MOUTH: [number, Mouth][] = [[0, 'gulp'], [3.1, 'o'], [3.6, 'flat'], [5.5, 'smirk'], [6.9, 'gulp'], [9.9, 'o'], [10.4, 'gulp'], [12.7, 'gulp'], [13.0, 'flat'], [14.1, 'gulp'], [14.5, 'o'],
  [15.4, 'smile'], [17.4, 'smile'], [19.4, 'o'], [20.8, 'smile'], [23.5, 'smile']];
const HER_MOUTH: [number, Mouth][] = [[0, 'smirk'], [3.0, 'smirk'], [7.2, 'flat'], [8.2, 'flat'], [9.8, 'flat'], [12.7, 'smirk'], [14.4, 'flat'], [15.0, 'smile'], [17.6, 'laugh'], [18.6, 'smile'], [23.5, 'smile']];
const GULPS = [3.1, 7.2, 10.4, 12.8, 14.45];
const herLaugh = (t: number) => t >= B.laugh && t < B.laugh + 1.0;
const himLaugh = (t: number) => t >= B.laugh + 0.2 && t < B.laugh + 1.1;
const imp = (s: number, a: number, d: number) => (s < a ? 0 : Math.exp(-(s - a) * d) * Math.cos((s - a) * 26));

const himPose = (s: number, hook: Hook): Pose => {
  const [lx0, ly0] = kf(HIM_LOOK, s);
  const catchK = hook === 'b' && s < 3.0 ? smooth(s, 0.9, 1.0) * (1 - smooth(s, 2.0, 2.3)) : 0;
  const lx = lerp(lx0, 0.9, catchK), ly = lerp(ly0, 0.35, catchK);
  const g = Math.max(...GULPS.map((a) => Math.sin(wp(s, a, a + 0.42) * Math.PI)));
  const L = himLaugh(s);
  const sweat = Math.max(catchK * 0.7, s > 10.0 && s < 12.0 ? smooth(s, 10.0, 10.8) * 0.7 : 0, s > 19.0 && s < 21 ? 0.0 : 0);
  const worry = Math.max(0.5 * (1 - smooth(s, 2.9, 3.4)), catchK * 0.9, s > 10.0 && s < 12.0 ? smooth(s, 10, 10.6) * 0.8 : 0);
  const raise = 0.15 + sweat * 0.3 + catchK * 0.5;
  const jolt = hook === 'b' && s < 3.0 ? imp(s, 0.95, 5) : 0;
  const mouth: Mouth = catchK > 0.3 ? 'o' : keyAt(HIM_MOUTH, s);
  return {look: [lx, ly], browL: raise, browR: raise, worry, mouth, happy: L, sweat, gulp: g,
    tilt: L ? Math.sin(s * 22) * 3 : Math.sin(s * 0.9) * 1.1 + jolt * 9, bob: L ? -Math.abs(Math.sin(s * 22)) * 9 : jolt * -22 * (jolt > 0 ? 1 : 0), blink: blinkAt(s, 0.4)};
};
const herPose = (s: number, hook: Hook): Pose => {
  const [lx, ly] = s < 3.0 ? kf(hook === 'b' ? HER_LOOK_B : HER_LOOK_A, s) : kf(HER_LOOK, s);
  const L = herLaugh(s);
  const bBrow = hook === 'b' && s < 3.0 ? smooth(s, 0.75, 0.95) * (1 - smooth(s, 2.1, 2.4)) : 0;
  const read = smooth(s, 14.9, 15.1) * 0.0;
  void read;
  const mouth: Mouth = bBrow > 0.3 ? 'flat' : keyAt(HER_MOUTH, s);
  return {look: [lx, ly], browL: bBrow * 0.95, browR: bBrow > 0 ? -0.1 : 0, worry: 0, mouth, happy: L, sweat: 0, gulp: 0,
    tilt: L ? Math.sin(s * 21 + 1) * 3 : Math.sin(s * 0.8 + 2) * 1.2 + bBrow * 3, bob: L ? -Math.abs(Math.sin(s * 21 + 1)) * 9 : 0, blink: blinkAt(s, 1.9)};
};

const CAMK: CamKey[] = [
  {t: 0, x: 540, y: 975, z: 1.0}, {t: 3.0, x: 540, y: 985, z: 1.03}, {t: 6.7, x: 540, y: 990, z: 1.04}, {t: 11.0, x: 540, y: 980, z: 1.03}, {t: 12.7, x: 540, y: 975, z: 1.0},
  {t: 13.9, x: 530, y: 1000, z: 1.05}, {t: 17.0, x: 560, y: 1000, z: 1.06}, {t: 18.6, x: 545, y: 985, z: 1.03}, {t: 20.5, x: 540, y: 990, z: 1.05}, {t: 23.3, x: 540, y: 980, z: 1.03},
  {t: 26.5, x: 560, y: 1050, z: 1.05}, {t: 29.8, x: 560, y: 1040, z: 1.07},
];

// ------------------------------------------------------------------------------------------ hands (short near-vertical arms, short side thumb)
const Hand5: React.FC<{who: 'him' | 'her'; hx: number; hy: number; rot?: number; opacity?: number; reach?: number}> = ({who, hx, hy, rot = 0, opacity = 1, reach = 560}) => {
  if (opacity < 0.02) return null;
  const him = who === 'him';
  const skin = him ? C.skinHim : C.skinHer;
  const sleeve = him ? C.hoodie : C.knit;
  const bx = hx + (him ? -70 : 70), by = hy + reach;
  const d = `M ${bx} ${by} Q ${hx + (him ? -20 : 20)} ${(hy + by) / 2} ${hx} ${hy + 40}`;
  return <g opacity={clamp(opacity * 1.5)}>
    <path d={d} fill="none" stroke="#fff" strokeWidth={132} strokeLinecap="round" />
    <path d={d} fill="none" stroke={sleeve} strokeWidth={100} strokeLinecap="round" />
    <g transform={`translate(${hx} ${hy}) rotate(${rot})`}>
      <rect x={-56} y={36} width={112} height={32} rx={12} fill={him ? C.hoodieDeep : C.knitDeep} />
      {!him && [[-32, 52, C.poppy], [8, 46, C.cobalt], [34, 56, C.mint]].map(([x, y, c], i) => <circle key={i} cx={x as number} cy={y as number} r={6} fill={c as string} />)}
      <rect x={-50} y={-44} width={100} height={92} rx={36} fill={skin} stroke="#00000033" strokeWidth={3} />
      {[-24, 0, 24].map((x) => <line key={x} x1={x} y1={-40} x2={x} y2={-14} stroke="#00000033" strokeWidth={3} />)}
      <ellipse cx={-48} cy={14} rx={17} ry={28} transform="rotate(14 -48 14)" fill={skin} stroke="#00000033" strokeWidth={3} />
    </g>
  </g>;
};

// ------------------------------------------------------------------------------------------ chips (note chips with pencil)
type L = {txt: string; fs: number; y: number; wr: [number, number]};
const NW = 640, NH = 400;
const fontOf = (fs: number) => `700 ${fs}px "Courier Prime"`;
const T1F: L[] = [{txt: spec.cards.t1front[0], fs: 84, y: 62, wr: [5.7, 6.5]}];
const T1B: L[] = [[-50, 8.3, 8.75], [42, 8.8, 9.15], [134, 9.2, 9.65]].map(([y, a, b], i) => ({txt: spec.cards.t1back[i], fs: 68, y, wr: [a, b] as [number, number]}));
const T2F: L[] = [{txt: spec.cards.t2front[0], fs: 150, y: 64, wr: [13.1, 13.8]}];
const T2B: L[] = [[10, 15.9, 16.4], [120, 16.5, 17.2]].map(([y, a, b], i) => ({txt: spec.cards.t2back[i], fs: 84, y, wr: [a, b] as [number, number]}));
type SetT = {front: L[]; back: L[]; flip: number; vis: [number, number]};
const SETS: SetT[] = [{front: T1F, back: T1B, flip: B.flip1, vis: [B.pick1 - 0.05, 10.6]}, {front: T2F, back: T2B, flip: B.flip3, vis: [B.pick3 - 0.05, 18.4]}];
const setOf = (s: number) => (s < TAKE2 ? SETS[0] : SETS[1]);

const HIMC = {x: 385, y: 1085, sc: 0.9, r: -3}, HERC = {x: 745, y: 1085, sc: 0.9, r: 3};
const CL = {x: 515, y: 1110, sc: 1.3, r: 0}, CR = {x: 565, y: 1110, sc: 1.3, r: 0};
const mixXf = (a: typeof HIMC, b: typeof HIMC, k: number, arc = 0) => ({x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k) - arc * Math.sin(k * Math.PI), sc: lerp(a.sc, b.sc, k), r: lerp(a.r, b.r, k)});
const chipXf = (s: number) => {
  if (s < TAKE2) {
    if (s < B.slide1) { const c = {...HIMC}; c.y += 140 * (1 - smooth(s, B.pick1 - 0.05, B.pick1 + 0.2)); return c; }
    if (s < B.read1) return mixXf(HIMC, HERC, smooth(s, B.slide1, B.read1 - 0.05), 70);
    const c = {...HERC}; c.y += 420 * smooth(s, B.leave0, B.leave0 + 0.5); return c;
  }
  if (s < B.slide3) { const c = {...CL}; c.y += 160 * (1 - smooth(s, B.pick3 - 0.05, B.pick3 + 0.2)); return c; }
  if (s < B.read3) return mixXf(CL, CR, smooth(s, B.slide3, B.read3 - 0.05), 30);
  const c = mixXf(CR, HERC, smooth(s, B.chipOut, B.chipOut + 0.5)); c.y += 520 * smooth(s, B.chipOut + 0.3, B.chipOut + 0.8); return c;
};
const chipPt = (s: number, x: number, y: number): [number, number] => {
  const c = chipXf(s);
  const [rx, ry] = rot2(c.r, x * c.sc, y * c.sc);
  return [c.x + rx, c.y + ry];
};
const chipVis = (s: number) => { const v = setOf(s).vis; return clamp((s - v[0]) / 0.15) * (1 - clamp((s - (v[1] - 0.15)) / 0.15)); };

const NoteLines: React.FC<{lines: L[]; s: number; idp: string}> = ({lines, s, idp}) => <g>
  {lines.map((l, k) => {
    const tw = textW(l.txt, fontOf(l.fs));
    const p = wp(s, l.wr[0], l.wr[1]);
    return <g key={k}><clipPath id={`${idp}${k}`}><rect x={-NW / 2 + 24} y={l.y - l.fs * 1.1} width={tw * p + 30} height={l.fs * 1.6} /></clipPath>
      <text x={-NW / 2 + 40} y={l.y} fontFamily={COUR} fontWeight={700} fontSize={l.fs} fill="#2E3548" clipPath={`url(#${idp}${k})`}>{l.txt}</text></g>;
  })}
</g>;
const Rules: React.FC<{ys: number[]}> = ({ys}) => <g>{ys.map((y, k) => <line key={k} x1={-NW / 2 + 30} x2={NW / 2 - 30} y1={y + 16} y2={y + 16} stroke="#C9D2E6" strokeWidth={3} />)}</g>;
const NoteChip: React.FC<{s: number}> = ({s}) => {
  const st = setOf(s);
  const vis = chipVis(s);
  if (vis <= 0.01) return null;
  const c = chipXf(s);
  const fk = wp(s, st.flip, st.flip + 0.3);
  const sx = Math.max(0.04, Math.abs(1 - 2 * fk));
  const back = s >= st.flip + 0.15;
  const lines = back ? st.back : st.front;
  return <g opacity={vis} transform={`translate(${c.x} ${c.y}) rotate(${c.r}) scale(${c.sc * sx} ${c.sc})`}>
    <rect x={-NW / 2 + 14} y={-NH / 2 + 18} width={NW} height={NH} rx={26} fill={C.navy} opacity={0.25} />
    <rect x={-NW / 2} y={-NH / 2} width={NW} height={NH} rx={26} fill="#F6F1E5" stroke={C.navy} strokeWidth={8} />
    <rect x={-NW / 2 + 16} y={-NH / 2 + 16} width={NW - 32} height={56} rx={12} fill={back ? C.mint : C.poppy} stroke={C.navy} strokeWidth={3} />
    <Rules ys={lines.map((l) => l.y)} />
    <NoteLines lines={lines} s={s} idp={back ? 'nb' : 'nf'} />
  </g>;
};
// frame 1: her chip "so, what's / your name?" (mint back), held up big
const CLIFF = {x: 700, y: 1100, sc: 1.0, r: 2};
const CliffChip: React.FC<{s: number}> = ({s}) => {
  const drop = smooth(s, B.chipDrop, B.chipDrop + 0.6);
  if (drop >= 0.99) return null;
  const y = CLIFF.y + 520 * drop;
  const lines = spec.cards.cliff;
  return <g>
    <g transform={`translate(${CLIFF.x} ${y}) rotate(${CLIFF.r}) scale(${CLIFF.sc})`}>
      <rect x={-NW / 2 + 14} y={-NH / 2 + 18} width={NW} height={NH} rx={26} fill={C.navy} opacity={0.3} />
      <rect x={-NW / 2} y={-NH / 2} width={NW} height={NH} rx={26} fill="#F6F1E5" stroke={C.navy} strokeWidth={8} />
      <rect x={-NW / 2 + 16} y={-NH / 2 + 16} width={NW - 32} height={56} rx={12} fill={C.mint} stroke={C.navy} strokeWidth={3} />
      <Rules ys={[-10, 100]} />
      {lines.map((l, k) => <text key={k} x={0} y={k === 0 ? 14 : 124} textAnchor="middle" fontFamily={COUR} fontWeight={700} fontSize={90} fill="#2E3548">{l}</text>)}
    </g>
    <Hand5 who="her" hx={CLIFF.x + 150} hy={y + 205} reach={500} opacity={1 - drop} />
  </g>;
};

// pencil (rests flat on the ledge)
const PEN = 190, REST_TOP: [number, number] = [360, 1318];
type Job = {pick: number; ret: number; rho: number; who: 'him' | 'her'; lines: L[]};
const JOBS: Job[] = [
  {pick: B.pick1, ret: B.ret1, rho: 72, who: 'him', lines: T1F}, {pick: B.pick2, ret: B.ret2, rho: 72, who: 'her', lines: T1B},
  {pick: B.pick3, ret: B.ret3, rho: 72, who: 'him', lines: T2F}, {pick: B.pick4, ret: B.ret4, rho: 72, who: 'her', lines: T2B},
];
const jobTip = (j: Job, s: number): [number, number] => {
  const x0 = -NW / 2 + 40;
  const ls = j.lines;
  for (let k = 0; k < ls.length; k++) {
    const [a, b] = ls[k].wr;
    if (s >= a && s < b) { const tw = textW(ls[k].txt, fontOf(ls[k].fs)); return chipPt(s, x0 + tw * wp(s, a, b) + 4, ls[k].y + 6 + Math.sin(s * 40) * 2); }
    if (k + 1 < ls.length && s >= b && s < ls[k + 1].wr[0]) {
      const p = smooth(s, b, ls[k + 1].wr[0]);
      const e = chipPt(s, x0 + textW(ls[k].txt, fontOf(ls[k].fs)), ls[k].y + 6), n = chipPt(s, x0, ls[k + 1].y + 6);
      return [lerp(e[0], n[0], p), lerp(e[1], n[1], p)];
    }
  }
  const last = ls[ls.length - 1];
  return chipPt(s, x0 + textW(last.txt, fontOf(last.fs)), last.y + 6);
};
const finish = (tip: [number, number], rho: number, j: Job | null) => ({tip, rho, top: [tip[0] + PEN * Math.sin(rad(rho)), tip[1] - PEN * Math.cos(rad(rho))] as [number, number], job: j});
const penPose = (s: number) => {
  const restTip: [number, number] = [REST_TOP[0] + PEN * 0.998, REST_TOP[1] + 8];
  for (const j of JOBS) {
    if (s >= j.pick && s < j.ret) {
      const w0 = j.lines[0].wr[0], w1 = j.lines[j.lines.length - 1].wr[1];
      if (s < w0) { const hold = smooth(s, j.pick, w0); const w = jobTip(j, w0); return finish([lerp(restTip[0], w[0], hold), lerp(restTip[1], w[1], hold) - 70 * Math.sin(hold * Math.PI)], lerp(-88, j.rho, hold), j); }
      if (s < w1) return finish(jobTip(j, s), j.rho, j);
      const hold = 1 - smooth(s, w1, j.ret); const w = jobTip(j, w1 - 0.001);
      return finish([lerp(restTip[0], w[0], hold), lerp(restTip[1], w[1], hold) - 70 * Math.sin(hold * Math.PI)], lerp(-88, j.rho, hold), j);
    }
  }
  return finish(restTip, -88, null);
};
const Pencil: React.FC<{s: number}> = ({s}) => {
  const p = penPose(s);
  return <g transform={`translate(${p.tip[0]} ${p.tip[1]}) rotate(${p.rho})`}>
    <rect x={-20} y={-PEN} width={40} height={PEN - 36} rx={5} fill={C.sun} stroke={C.navy} strokeWidth={5} />
    <rect x={-20} y={-PEN} width={40} height={30} rx={5} fill={C.poppy} stroke={C.navy} strokeWidth={5} />
    <rect x={-20} y={-PEN + 30} width={40} height={14} fill="#B9C0CC" stroke={C.navy} strokeWidth={3} />
    <path d="M -20 -36 L 0 0 L 20 -36 Z" fill="#E8C79A" stroke={C.navy} strokeWidth={5} strokeLinejoin="round" /><path d="M -7 -12 L 0 0 L 7 -12 Z" fill="#2E3548" />
  </g>;
};

// ------------------------------------------------------------------------------------------ payoff: POPPY + SAME taped together
const PW = 430, PH = 330, PY = 1090;
const PairUp: React.FC<{s: number}> = ({s}) => {
  if (s < B.pairA || s >= B.pairOut + 0.6) return null;
  const out = smooth(s, B.pairOut, B.pairOut + 0.5);
  const ka = smooth(s, B.pairA, B.pairA + 0.35), kb = smooth(s, B.pairB, B.pairB + 0.4);
  const t1 = smooth(s, B.tape1, B.tape1 + 0.15), t2 = smooth(s, B.tape2, B.tape2 + 0.15);
  const pop = s > B.tape2 + 0.1 ? 1 + 0.06 * Math.sin(clamp((s - B.tape2 - 0.1) / 0.3) * Math.PI) : 1;
  const hd = smooth(s, B.handsDrop, B.handsDrop + 0.3);
  const ya = PY + 500 * (1 - ka) + 520 * out, yb = PY + 500 * (1 - kb) + 520 * out;
  const lx = 290, rx = 790;
  return <g transform={`translate(540 ${PY}) scale(${pop}) translate(-540 ${-PY})`}>
    <g transform={`translate(${lx} ${ya}) rotate(-2)`}><ChipCard w={PW} h={PH} swatch={C.poppy} label={spec.cards.pair[0]} m={1} vlabel={false} id="pa" /></g>
    <g transform={`translate(${rx} ${yb}) rotate(2)`}><ChipCard w={PW} h={PH} swatch={C.w2} label={spec.cards.pair[1]} m={1} vlabel={false} id="pb" /></g>
    <g transform={`translate(540 ${PY + 520 * out})`}>
      {t1 > 0 && <g transform={`scale(${t1} 1) rotate(-3)`}><rect x={-150} y={-34} width={300} height={68} rx={8} fill="#F2E3B0" stroke={C.navy} strokeWidth={5} opacity={0.96} />
        <rect x={-150} y={-34} width={300} height={68} rx={8} fill="none" stroke="#fff" strokeWidth={2} opacity={0.5} strokeDasharray="10 10" /></g>}
      {t2 > 0 && <g transform={`scale(1 ${t2}) rotate(-3)`}><rect x={-34} y={-150} width={68} height={300} rx={8} fill="#F2E3B0" stroke={C.navy} strokeWidth={5} opacity={0.96} />
        <rect x={-150} y={-34} width={300} height={68} rx={8} fill="#F2E3B0" opacity={0.96} /><rect x={-150} y={-34} width={300} height={68} rx={8} fill="none" stroke={C.navy} strokeWidth={5} /></g>}
    </g>
    <Hand5 who="her" hx={lx} hy={ya + 215} reach={420} opacity={(1 - hd) * (1 - out) * ka} />
    <Hand5 who="her" hx={rx} hy={yb + 215} reach={420} opacity={(1 - hd) * (1 - out) * kb} />
  </g>;
};

// ------------------------------------------------------------------------------------------ the street
const Cafe: React.FC<{s: number; t: number}> = ({s, t}) => {
  const steam = (i: number) => Math.sin(t * 3 + i * 2) * 8;
  const open = smooth(s, B.enter, B.enter + 0.3);
  const sil = smooth(s, B.window, B.window + 0.35);
  return <g>
    <rect x={280} y={620} width={520} height={760} fill="#BFF3E0" stroke={C.navy} strokeWidth={7} />
    <rect x={320} y={880} width={250} height={270} rx={10} fill="#FFE9A8" stroke={C.navy} strokeWidth={6} />
    {/* warm window with two silhouettes and two cups */}
    <g opacity={sil}>
      <circle cx={445} cy={1010} r={170} fill="url(#glowWarm)" />
      {[[390, 1020], [500, 1020]].map(([x, y], i) => <g key={i}><circle cx={x} cy={y - 18} r={32} fill={C.navy} /><path d={`M ${x - 52} ${y + 70} Q ${x - 50} ${y + 12} ${x} ${y + 12} Q ${x + 50} ${y + 12} ${x + 52} ${y + 70} Z`} fill={C.navy} /></g>)}
      <rect x={330} y={1100} width={230} height={14} rx={6} fill="#8A5A3B" stroke={C.navy} strokeWidth={4} />
      {[420, 470].map((x, i) => <g key={x}><path d={`M ${x - 16} 1070 L ${x - 12} 1100 L ${x + 12} 1100 L ${x + 16} 1070 Z`} fill="#fff" stroke={C.navy} strokeWidth={4} />
        <path d={`M ${x + steam(i)} 1060 q 8 -10 0 -18 q -8 -8 0 -16`} fill="none" stroke="#fff" strokeWidth={5} strokeLinecap="round" /></g>)}
    </g>
    <rect x={610} y={940} width={150} height={250} rx={8} fill={open > 0.5 ? '#FFE9A8' : '#7FD9B8'} stroke={C.navy} strokeWidth={6} />
    <circle cx={735} cy={1075} r={9} fill={C.navy} />
    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => <path key={i} d={`M ${290 + i * 52} 790 L ${342 + i * 52} 790 L ${342 + i * 52} 840 Q ${316 + i * 52} 870 ${290 + i * 52} 840 Z`} fill={i % 2 ? '#fff' : C.poppy} stroke={C.navy} strokeWidth={4} />)}
    <rect x={280} y={760} width={540} height={34} fill={C.navy} />
    <g transform="translate(540 540)">
      <rect x={-110} y={-48} width={220} height={78} rx={14} fill={C.w1} stroke={C.navy} strokeWidth={6} />
      <text x={0} y={14} textAnchor="middle" fontFamily={INTER} fontWeight={800} fontSize={60} fill={C.navy}>CAFE</text>
      {[-1, 0, 1].map((i) => <path key={i} d={`M ${i * 24 + steam(i)} -60 q 10 -14 0 -26 q -10 -12 0 -24`} fill="none" stroke="#fff" strokeWidth={7} strokeLinecap="round" opacity={0.85} />)}
    </g>
  </g>;
};

const Bang: React.FC<{s: number}> = ({s}) => {
  const a = smooth(s, 0.8, 0.95) * (1 - smooth(s, 2.2, 2.5));
  if (a <= 0.01) return null;
  const pop = 1 + 0.18 * Math.sin(clamp((s - 0.8) / 0.35) * Math.PI);
  return <g opacity={a} transform={`translate(700 600) rotate(${Math.sin(s * 14) * 4}) scale(${pop})`}>
    <circle r={72} cx={7} cy={9} fill={C.navy} />
    <circle r={72} fill={C.poppy} stroke={C.navy} strokeWidth={7} />
    <text x={0} y={52} textAnchor="middle" fontFamily={ANTON} fontSize={150} fill="#fff">!</text>
  </g>;
};

const walkU = (who: 'him' | 'her', s: number) => {
  const fin = s >= B.walk ? smooth(s, B.walk, B.walkEnd) : 0;
  const t1 = who === 'her' && s < TAKE2 ? 0.62 * smooth(s, B.leave0, B.leave1) : 0;
  return Math.max(fin, t1);
};
const WalkPerson: React.FC<{who: 'him' | 'her'; s: number; t: number; hook: Hook}> = ({who, s, t, hook}) => {
  const u = walkU(who, s);
  const p0 = who === 'him' ? HIM : HER, pd = DOOR[who];
  const k = lerp(1, 0.3, u);
  const bob = u > 0 && u < 0.999 ? -Math.abs(Math.sin(t * 10)) * 14 * k : 0;
  const fade = 1 - wp(s, B.enter, B.enter + 0.35);
  const sc = k * (1 - 0.2 * wp(s, B.enter, B.enter + 0.35));
  const pose = who === 'him' ? himPose(s, hook) : herPose(s, hook);
  return <g opacity={fade} transform={`translate(${lerp(p0.x, pd.x, u)} ${lerp(p0.y, pd.y, u) + bob}) scale(${sc})`}>
    <Person who={who} x={0} y={0} t={t} pose={pose} seed={who === 'him' ? 0.4 : 1.9} />
  </g>;
};

const swipeOf = (ticks: number[], t: number) => {
  let idx = -1;
  for (let i = 0; i < ticks.length; i++) if (ticks[i] <= t) idx = i;
  if (idx < 0) return {p: 0, dir: 1};
  return {p: clamp((t - ticks[idx]) / 0.26), dir: idx % 2 ? -1 : 1};
};
const HIM_TICKS = [-0.1, 0.2, 0.5, 0.8, 1.1, 1.4, 1.7, 2.0, 2.3, 2.6, 2.9];

const Street: React.FC<{s: number; t: number; hook: Hook}> = ({s, t, hook}) => {
  const cam: Cam = camAt(CAMK, s);
  const w = {...cam, x: cam.x + Math.sin(t * 0.8) * 3, y: cam.y + Math.sin(t * 1.1) * 2};
  const hs = swipeOf(HIM_TICKS, s);
  const phoneOn = s < B.phoneGone + 0.1;
  const catchK = hook === 'b' && s < 3.0 ? imp(s, 0.95, 5) : 0;
  const phY = lerp(1110, 1780, smooth(s, B.phoneOff + 0.25, B.phoneGone)) - catchK * 36;
  const phLit = 1 - smooth(s, B.phoneOff, B.phoneOff + 0.2);
  const hands: React.ReactNode[] = [];
  if (s >= B.pick1 - 0.1) {
    const st = setOf(s);
    const vis = chipVis(s);
    const hold = (who: 'him' | 'her', lx: number, op: number) => {
      const [hx, hy] = chipPt(s, lx, NH / 2 - 6);
      hands.push(<Hand5 key={'h' + who + lx} who={who} hx={hx} hy={hy + 24} reach={520} opacity={op * vis} />);
    };
    if (s < TAKE2) {
      hold('him', -140, wp(s, B.pick1, B.pick1 + 0.2) * (1 - wp(s, B.read1 - 0.1, B.read1 + 0.15)));
      hold('her', 140, wp(s, B.read1 - 0.2, B.read1 + 0.05));
    } else {
      hold('him', -140, wp(s, B.pick3, B.pick3 + 0.2) * (1 - wp(s, B.read3 - 0.1, B.read3 + 0.15)));
      hold('her', 140, wp(s, B.read3 - 0.2, B.read3 + 0.05));
    }
    void st;
    const p = penPose(s);
    if (p.job) {
      const vis2 = wp(s, p.job.pick, p.job.pick + 0.2) * (1 - wp(s, p.job.ret - 0.12, p.job.ret));
      hands.push(<Hand5 key="hpen" who={p.job.who} hx={lerp(p.tip[0], p.top[0], 0.82) + 22} hy={lerp(p.tip[1], p.top[1], 0.82) + 20} rot={-24} reach={540} opacity={vis2} />);
    }
  }
  return <g>
    <g transform={planeT(w, 0.2)}>
      <rect x={-200} y={-200} width={1480} height={2400} fill="url(#dusk)" />
      <circle cx={880} cy={560} r={300} fill={C.sun} opacity={0.12} />
    </g>
    <g transform={planeT(w, 0.5)}>
      <rect x={830} y={560} width={420} height={820} fill="#D7E1FA" stroke={C.navy} strokeWidth={6} />
      {[0, 1, 2].map((r) => [0, 1].map((c) => <rect key={r * 2 + c} x={870 + c * 170} y={640 + r * 190} width={120} height={130} rx={8} fill="#F4F7FF" stroke={C.navy} strokeWidth={5} />))}
    </g>
    <g transform={planeT(w, 0.45)}><Cafe s={s} t={t} /></g>
    <g transform={planeT(w, 0.7)}>
      <rect x={-100} y={1190} width={1300} height={300} fill="#4A5A8C" />
      <rect x={-100} y={1190} width={1300} height={12} fill={C.navy} />
      {Array.from({length: 8}, (_, i) => <rect key={i} x={-40 + i * 170} y={1290} width={90} height={14} rx={7} fill="#E4E8EA" />)}
    </g>
    <g transform={planeT(w, 0.75)}>
      <rect x={-160} y={400} width={500} height={900} fill={C.w3} stroke={C.navy} strokeWidth={8} />
      <rect x={-140} y={452} width={460} height={84} fill={C.sun} stroke={C.navy} strokeWidth={6} />
      <text x={30} y={516} textAnchor="start" fontFamily={ANTON} fontSize={60} fill={C.navy}>PAINT</text>
      <rect x={-140} y={530} width={440} height={760} rx={6} fill="#B9C0CC" stroke={C.navy} strokeWidth={6} />
      {Array.from({length: 20}, (_, i) => <line key={i} x1={-140} x2={300} y1={556 + i * 36} y2={556 + i * 36} stroke={C.navy} strokeWidth={5} opacity={0.5} />)}
      <rect x={-140} y={1262} width={440} height={28} fill="#8D96A8" stroke={C.navy} strokeWidth={6} />
      <rect x={120} y={1250} width={60} height={14} rx={7} fill={C.navy} />
    </g>
    <g transform={planeT(w, 0.9)}>
      <WalkPerson who="him" s={s} t={t} hook={hook} />
      <WalkPerson who="her" s={s} t={t} hook={hook} />
      {hook === 'b' && <Bang s={s} />}
    </g>
    <g transform={planeT(w, 1.05)}>
      <rect x={-100} y={1330} width={1300} height={700} fill="#3A4A78" stroke={C.navy} strokeWidth={7} />
      <rect x={-100} y={1330} width={1300} height={14} fill="#8DA0D8" />
    </g>
    <g transform={planeT(w, 1.04)}>
      {phoneOn && <PhoneUnit rich scale={1.5} who="him" x={200} y={phY} rot={8 + catchK * 10} lit={phLit} p={s < 2.9 ? hs.p : 0} dir={hs.dir} down={0} thumbOn={s < 2.9 ? 1 : 0} />}
    </g>
    <g transform={planeT(w, 1.05)}>
      <CliffChip s={s} />
      <NoteChip s={s} />
      <PairUp s={s} />
      {s < B.pairA + 0.5 && <Pencil s={s} />}
      {hands}
    </g>
  </g>;
};

// ------------------------------------------------------------------------------------------ end card + edit
const EndFinale: React.FC<{a: number; t: number}> = ({a, t}) => {
  const pop = (d: number) => smooth(a, d, d + 0.2) * (1 + 0.06 * Math.sin(clamp((a - d) / 0.4) * Math.PI));
  const open = smooth(a, 0, 0.7);
  const E = spec.cards.end;
  const font = `800 56px Inter`;
  const tw = textW(E[2], font) + 90;
  return <g>
    <rect x={-100} y={-100} width={1280} height={2200} fill={C.cobalt} />
    <rect x={-100} y={-100} width={1280} height={2200} fill="url(#pegc)" />
    <g transform={`translate(540 1640) rotate(${Math.sin(t * 0.8) * 1.2})`}>
      {Array.from({length: 8}, (_, i) => <g key={i} transform={`rotate(${(-34 + i * (68 / 7)) * open})`}><rect x={-75} y={-640} width={150} height={640} rx={16} fill={[C.w1, C.w2, C.w3, C.w4][i % 4]} stroke={C.navy} strokeWidth={6} /></g>)}
      <circle r={24} fill={C.navy} />
    </g>
    <g transform={`translate(540 640) scale(${pop(0.15)}) translate(-540 -640)`}>
      <text x={546} y={662} textAnchor="middle" fontFamily={ANTON} fontSize={210} fill={C.navy}>{E[0]}</text>
      <text x={540} y={650} textAnchor="middle" fontFamily={ANTON} fontSize={210} fill="#fff">{E[0]}</text>
    </g>
    <g transform={`translate(540 830) scale(${pop(0.45)}) translate(-540 -830)`}>
      <text x={546} y={856} textAnchor="middle" fontFamily={ANTON} fontSize={150} fill={C.navy}>{E[1]}</text>
      <text x={540} y={844} textAnchor="middle" fontFamily={ANTON} fontSize={150} fill={C.sun}>{E[1]}</text>
    </g>
    <g transform={`translate(540 1030) scale(${pop(0.8)}) translate(-540 -1030)`}>
      <rect x={540 - tw / 2 + 10} y={1030 - 56 + 12} width={tw} height={112} rx={20} fill={C.navy} />
      <rect x={540 - tw / 2} y={1030 - 56} width={tw} height={112} rx={20} fill="#fff" stroke={C.navy} strokeWidth={6} />
      <text x={540} y={1030 + 20} textAnchor="middle" fontFamily={INTER} fontWeight={800} fontSize={56} fill={C.navy}>{E[2]}</text>
    </g>
  </g>;
};

const RewindGlyph: React.FC<{a: number}> = ({a}) => <g transform={`translate(540 700) scale(${0.9 + 0.2 * Math.sin(a * 3)})`} opacity={smooth(a, 0, 0.1) * (1 - smooth(a, 0.7, 0.9))}>
  {[-1, 1].map((i) => <path key={i} transform={`translate(${i * 78} 0)`} d="M 70 -80 L -70 0 L 70 80 Z" fill={C.sun} stroke={C.navy} strokeWidth={14} strokeLinejoin="round" />)}
</g>;

const BigText: React.FC<{t: number}> = ({t}) => {
  const a = wp(t, B.bigText, B.bigText + 0.2) * (1 - wp(t, TAKE2 - 0.25, TAKE2));
  if (a <= 0.01) return null;
  const pop = 1 + 0.08 * Math.sin(clamp((t - B.bigText) / 0.4) * Math.PI);
  return <g opacity={a} transform={`translate(540 1000) scale(${pop})`}>
    {['rewind.', 'take 2.'].map((l, i) => <g key={l}>
      <text x={8} y={i * 190 + 14} textAnchor="middle" fontFamily={INTER} fontWeight={800} fontSize={190} fill={C.navy}>{l}</text>
      <text x={0} y={i * 190} textAnchor="middle" fontFamily={INTER} fontWeight={800} fontSize={190} fill={i ? C.sun : '#fff'} stroke={C.navy} strokeWidth={10} paintOrder="stroke">{l}</text>
    </g>)}
  </g>;
};

type Shot = 'main' | 'end';
type Mode = {kind: 'plain'; shot: Shot} | {kind: 'wipe'; k: number; under: Shot | 'none'; over: Shot; sOver?: number};
const modeAt = (t: number): Mode => {
  if (t < B.rewind) return {kind: 'plain', shot: 'main'};
  if (t < B.rewind + 0.5) { const e = smooth(t, B.rewind, B.rewind + 0.5); return {kind: 'wipe', k: 1 - e, under: 'none', over: 'main', sOver: B.rewind}; }
  if (t < B.open) return {kind: 'wipe', k: 0, under: 'none', over: 'main', sOver: TAKE2};
  if (t < B.open + WIPE_DUR) return {kind: 'wipe', k: (t - B.open) / WIPE_DUR, under: 'none', over: 'main', sOver: TAKE2};
  if (t < B.endWipe) return {kind: 'plain', shot: 'main'};
  if (t < B.endWipe + WIPE_DUR) return {kind: 'wipe', k: (t - B.endWipe) / WIPE_DUR, under: 'main', over: 'end'};
  return {kind: 'plain', shot: 'end'};
};
const FAST: [number, number][] = [[2.2, 2.7], [3.0, 3.5], [B.slide1, B.slide1 + 0.45], [B.slide3, B.slide3 + 0.4], [B.chipOut, B.chipOut + 0.8], [B.pairA, B.pairA + 0.35], [B.pairB, B.pairB + 0.4], [B.pairOut, B.pairOut + 0.5]];

const renderShot = (id: string, t: number, hook: Hook, s?: number): React.ReactNode => {
  switch (id) {
    case 'main': return <Street s={s ?? stateTime(t)} t={t} hook={hook} />;
    case 'end': return <EndFinale a={t - B.endcard} t={t} />;
    default: return null;
  }
};

const Scene: React.FC<{hook: Hook}> = ({hook}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const mode = modeAt(t);
  const rewinding = t >= B.rewind && t < B.open + WIPE_DUR;
  const fast = mode.kind === 'wipe' || FAST.some(([a, b]) => t >= a && t < b);
  return <>
    <MotionBlurWhen fast={fast} samples={5} shutter={mode.kind === 'wipe' ? 220 : 150}>
      <AbsoluteFill>
        <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, background: C.wall}}>
          <Defs />
          <defs>
            <linearGradient id="dusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3B56B8" /><stop offset="0.6" stopColor="#8FA6F5" /><stop offset="1" stopColor="#C9D6FF" /></linearGradient>
            <radialGradient id="glowWarm"><stop offset="0" stopColor="#FFD878" stopOpacity={0.9} /><stop offset="1" stopColor="#FFD878" stopOpacity={0} /></radialGradient>
          </defs>
          {mode.kind === 'plain' ? renderShot(mode.shot, t, hook) : <>
            {mode.under === 'none' ? <VoteBg t={t} /> : renderShot(mode.under, t, hook)}
            <defs><FanClip k={mode.k} /></defs>
            <g clipPath="url(#fanclip)">{renderShot(mode.over, t, hook, mode.sOver)}</g>
            <FanRim k={mode.k} />
          </>}
          {rewinding && <RewindGlyph a={t - (B.rewind + 0.1)} />}
        </svg>
      </AbsoluteFill>
    </MotionBlurWhen>
    <AbsoluteFill>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        <BigText t={t} />
        {spec.strips.map((st, i) => {
          const isHook = (st as {hook?: boolean}).hook;
          const text = isHook ? (spec.hooks as Record<string, string>)[hook] : st.text;
          if (t >= st.to || t < st.from) return null;
          return <Strip key={i} text={text} y={st.y} age={t - st.from + (isHook ? 1 : 0.06)} out={isHook ? smooth(t, 2.85, 3.0) : smooth(t, st.to - 0.12, st.to)} size={isHook ? 58 : 60} rot={isHook ? 0 : i % 2 ? 0.6 : -0.6} />;
        })}
      </svg>
    </AbsoluteFill>
  </>;
};

export const Whites6: React.FC<{hook?: Hook}> = ({hook = 'a'}) => (
  <AbsoluteFill style={{background: C.wall}}>
    <Audio src={staticFile('audio/whites-ep6.wav')} volume={0.9} />
    <Scene hook={hook} />
  </AbsoluteFill>
);
