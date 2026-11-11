import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, lerp, smooth} from '../../lib/motion';
import {MotionBlurWhen} from '../../lib/shots';
import {
  BAR, C, Ball, Carpet, Cell, Cam, CamKey, Figure, LanesBg, Memphis, Monitor, NameCells, NUN, Phone, Pin, Pose, ReturnHump, Strip,
  Wall, WIPE_DUR, WipeBall, camAt, keyAt, planeT, track, wipeGeom, Mouth,
} from './world';
import {BackFigure} from './ep1';
import spec from '../../../specs/stories/lane-ep4.json';

// Lane 8, part 4 "Dan" (finale, stands alone). Frame 1: ONE strip, boards NAME? / PLAYER 7 (cursor), him big with a lit phone
// mid-swipe. He pockets the phone, deletes PLAYER 7 on a big keypad, types DAN; her board flips JUNE (she waves); LAST GAME,
// house lights dim row by row; ball wipe; her strike, his wobbling gutter, NICE TRY DAN, both laugh; both leave their phones in
// the shoe cubbies and walk off; fries on a bench, the two boards merge into DAN . JUNE, lights off but the board; end card.

export const LANE4_FPS = 60;
export const LANE4_FRAMES = Math.round(spec.duration * LANE4_FPS);
const B = spec.beats;
export type Hook = 'a' | 'b';

// ------------------------------------------------------------------------------------------ name boxes
type State = {t0: number; text: string; stagger?: number; instant?: boolean};
const stateAt = (states: State[], t: number) => { let i = 0; while (i + 1 < states.length && t >= states[i + 1].t0) i++; return i; };
const cellsFor = (states: State[], t: number, color: string): Cell[] => {
  const i = stateAt(states, t);
  const cur = states[i], prev = states[Math.max(0, i - 1)];
  return Array.from({length: 9}, (_, n) => {
    const ch = cur.text[n] ?? ' ', pv = i === 0 ? ch : (prev.text[n] ?? ' ');
    return {ch, prev: pv, flipAt: i === 0 || (cur.instant && ch === pv) ? -1e9 : cur.t0 + n * (cur.stagger ?? 0.12), color, instant: cur.instant};
  });
};
const PL = 'PLAYER 7';
const HERS: State[] = [
  {t0: -1e9, text: 'NAME?'}, {t0: B.june, text: 'JUNE', stagger: 0.1}, {t0: B.lastGame, text: 'LAST GAME', stagger: 0.05},
  {t0: B.wipe2 + 0.3, text: 'JUNE', stagger: 0.04}, {t0: B.nice, text: 'NICE TRY', stagger: 0.06}, {t0: B.tryDan, text: 'NICE, DAN', stagger: 0.06},
];
const HIS: State[] = [
  {t0: -1e9, text: PL},
  ...Array.from({length: 8}, (_, i) => ({t0: B.delStart + i * B.delStep, text: PL.slice(0, 7 - i), instant: true, stagger: 0})),
  {t0: B.typeD, text: 'D', instant: true, stagger: 0}, {t0: B.typeA, text: 'DA', instant: true, stagger: 0}, {t0: B.typeN, text: 'DAN', instant: true, stagger: 0},
  {t0: B.lastGame, text: 'LAST GAME', stagger: 0.05}, {t0: B.wipe2 + 0.3, text: 'DAN', stagger: 0.04},
];
const hisLen = (t: number) => HIS[stateAt(HIS, t)].text.length;
const pulse = (t: number, a: number, d = 0.5) => (t >= a && t < a + d ? Math.sin((t - a) / d * Math.PI) : 0);
const hisScore = () => '120';
const herScore = (t: number) => (t >= B.herHit ? '184' : '154');
const blinkFlash = (t: number) => (t >= B.lastGame + 0.6 && t < B.wipe2 && Math.floor(t * 4) % 2 === 0 ? 1 : 0);
const subFor = (t: number) => (t >= B.lastGame && t < B.wipe2 ? {text: 'CLOSING TIME', color: C.orange} : {text: 'FRAME 10'});
const boards = (t: number) => ({his: cellsFor(HIS, t, C.orange), hers: cellsFor(HERS, t, C.mint), herPop: pulse(t, B.herHit)});

// ------------------------------------------------------------------------------------------ the cast
const k = (lx: number, ly: number, brow: number, tilt: number, dy: number, a1: [number, number], a2: [number, number], blush = 0, thumb = 0) =>
  [lx, ly, brow, tilt, dy, a1[0], a1[1], a2[0], a2[1], blush, thumb];
const fig = (v: number[], mouth: Mouth): Pose => ({lx: v[0], ly: v[1], brow: v[2], tilt: v[3], dy: v[4], a1: [v[5], v[6]], a2: [v[7], v[8]], blush: v[9], thumb: v[10], mouth});
const R1: [number, number] = [-70, -52], R2: [number, number] = [76, -52];
const HRR = k(-0.7, 0.1, 0.1, -2, 0, [-68, -50], [76, -66]);
const HIM_X = 330, HER_X = 790, FEET = 1210, MON_Y = 470;

// the big keypad (bay console): 3x3 keys, 70 px each
const KC = 500, KY = 945, KS = 80;
const KEYS = ['D', 'A', 'N', 'J', 'U', 'E', 'DEL', '', 'OK'];
const keyXY = (i: number): [number, number] => [KC + (i % 3 - 1) * KS, KY + Math.floor(i / 3) * KS];
const PRESSES: {t: number; key: number}[] = [
  ...Array.from({length: 8}, (_, i) => ({t: B.delStart + i * B.delStep, key: 6})),
  {t: B.typeD, key: 0}, {t: B.typeA, key: 1}, {t: B.typeN, key: 2},
];
const litKey = (t: number) => { const p = PRESSES.find((x) => t >= x.t && t < x.t + 0.1); return p ? p.key : -1; };

const himKeys: [number, number[]][] = [
  [3.0, k(-0.8, 0.5, 0.3, 3, 0, [-122, -190], R2, 0.1)], [3.4, k(-0.8, 0.5, 0.3, 3, 0, [-122, -190], R2, 0.1)],
  [3.6, k(1, 0.0, 0.9, 0, 0, [-122, -190], R2, 0.2)], [3.9, k(1, 0.0, 0.9, 0, 0, [-122, -190], R2, 0.2)],
  [4.15, k(0.4, 0.6, 0.4, 0, 0, [-30, -98], R2, 0.2)], [4.4, k(0.4, 0.6, 0.3, 0, 0, R1, R2, 0.2)],
  [B.typeN + 0.3, k(0.4, 0.6, 0.3, 0, 0, R1, R2, 0.2)], [B.june - 0.1, k(1, -0.3, 0.6, -3, 0, R1, R2, 0.4)],
  [B.june + 0.4, k(1, -0.1, 0.5, 3, 0, R1, R2, 0.5)], [B.lastGame, k(1, -0.1, 0.5, 3, 0, R1, R2, 0.4)], [B.lastGame + 0.3, k(0.2, -1, 0.9, -3, 0, R1, R2, 0.1)],
];
const himMouthBay = (t: number): Mouth => keyAt<Mouth>(t, [[0, 'flat'], [B.typeN + 0.3, 'smile'], [B.lastGame + 0.3, 'o']]);
const himBay = (t: number): Pose => {
  const v = [...track(himKeys, t)];
  const first = PRESSES[0].t, last = PRESSES[PRESSES.length - 1].t;
  const w = smooth(t, first - 0.3, first - 0.08) * (1 - smooth(t, last + 0.15, last + 0.45));
  if (w > 0) {
    let i = 0; PRESSES.forEach((p, j) => { if (t >= p.t - 0.1) i = j; });
    const a = keyXY(PRESSES[Math.max(0, i - 1)].key), b = keyXY(PRESSES[i].key), tr = i === 0 ? 1 : smooth(t, PRESSES[i].t - 0.24, PRESSES[i].t - 0.06);
    const dip = Math.max(0, 1 - Math.abs(t - PRESSES[i].t - 0.02) / 0.07) * 12;
    v[7] = lerp(v[7], lerp(a[0], b[0], tr) - HIM_X, w); v[8] = lerp(v[8], lerp(a[1], b[1], tr) - FEET + dip - 6, w);
  }
  return fig(v, himMouthBay(t));
};
const herKeys: [number, number[]][] = [
  [3.0, HRR], [B.june - 0.2, HRR], [B.june + 0.15, k(-0.3, -0.5, 0.8, 0, 0, [-68, -50], [76, -66], 0.3)],
  [B.june + 0.6, k(-1, -0.1, 0.4, 3, 0, [-68, -50], [76, -66], 0.5)], [B.lastGame, k(-1, -0.1, 0.4, 3, 0, [-68, -50], [76, -66], 0.5)],
  [B.lastGame + 0.3, k(-0.2, -1, 0.9, 3, 0, [-68, -50], [76, -66], 0.2)],
];
const waveA = (t: number) => smooth(t, B.june + 0.6, B.june + 0.85) * (1 - smooth(t, B.lastGame - 0.35, B.lastGame - 0.1));
const herWavePos = (t: number): [number, number] => [-112 + Math.sin(t * 15) * 20, -330 + Math.cos(t * 7.5) * 6];
const herBay = (t: number): Pose => {
  const v = [...track(herKeys, t)];
  const w = waveA(t);
  if (w > 0) { const [hx, hy] = herWavePos(t); v[5] = lerp(v[5], hx, w); v[6] = lerp(v[6], hy, w); v[3] = lerp(v[3], -4, w); }
  return fig(v, keyAt<Mouth>(t, [[0, 'smile'], [B.june - 0.2, 'o'], [B.june + 0.6, 'grin'], [B.lastGame + 0.3, 'o']]));
};
const Scrunchie: React.FC<{x: number; y: number}> = ({x, y}) => <g transform={`translate(${x} ${y})`}>
  <ellipse rx={30} ry={20} fill="none" stroke={C.ink} strokeWidth={22} /><ellipse rx={30} ry={20} fill="none" stroke={C.lemon} strokeWidth={14} />
  <path d="M -22 -10 Q -10 -16 0 -10 M 8 12 Q 18 8 24 0" stroke={C.ink} strokeWidth={3} fill="none" opacity={0.5} />
</g>;

// ------------------------------------------------------------------------------------------ hook: bright, two boards, two faces
const HookShot: React.FC<{t: number}> = ({t}) => {
  const b = boards(t);
  const zoom = 1 + 0.03 * smooth(t, 0, 3);
  const curOn = Math.floor(t * 3) % 2 === 0;
  const hp = fig(k(-0.9, 0.5, 0.6, 3, 0, [-108, -178], [48, -68], 0.1), 'flat');
  const wp = fig(k(-1, 0.1, 0.1, -2, 0, [-52, -78], [100, -140], 0.35), 'smile');
  const FT = 1470, HX = 355, WX = 810;
  return <g transform={`translate(540 960) scale(${zoom}) translate(-540 -960)`}>
    <rect x={-100} y={-100} width={1280} height={1260} fill="#6A55DE" />
    <circle cx={540} cy={900} r={800} fill={C.cream} opacity={0.12} />
    <circle cx={540} cy={900} r={520} fill={C.cream} opacity={0.1} />
    <Memphis x0={-50} y0={150} x1={1130} y1={1120} n={36} seed={31} op={0.8} t={t} />
    <rect x={-100} y={1150} width={1280} height={900} fill={C.lane} />
    <rect x={-100} y={1150} width={1280} height={16} fill={C.ink} /><rect x={-100} y={1166} width={1280} height={10} fill={C.lemon} />
    {[0, 1, 2, 3, 4, 5].map((i) => <path key={i} d={`M ${540 + (i - 2.5) * 120} 1176 L ${540 + (i - 2.5) * 420} 1920`} stroke={C.laneLine} strokeWidth={6} />)}
    <Monitor x={275} y={480} lane={7} cells={b.his} t={t} score={hisScore()} sub={{text: 'FRAME 10'}} />
    <Monitor x={805} y={480} lane={8} cells={b.hers} t={t} score={herScore(t)} sub={{text: 'FRAME 10'}} />
    <rect x={275 - 260 + 28 + 9 + 8 * 52} y={480 + 64 + 14} width={30} height={60} rx={4} fill={C.orange} opacity={curOn ? 0.95 : 0} />
    <Figure kind="her" x={WX} y={FT} p={wp} t={t} scale={1.5} items={<Ball x={104} y={-160} r={36} color={C.violet} spin={0} shadow={false} />} />
    <Figure kind="him" x={HX} y={FT} p={hp} t={t} scale={1.5} pocket={false} items={<Phone x={-108} y={-248} t={t} rot={-10} s={1.1} />} />
  </g>;
};

// ------------------------------------------------------------------------------------------ the bay
type CallDef = {a: number; b: number; who: 'him' | 'her'; label?: string};
const CALLS: CallDef[] = [
  {a: 4.4, b: B.june, who: 'him'}, {a: B.june, b: B.lastGame - 0.1, who: 'her'}, {a: B.lastGame + 0.05, b: B.wipe2 + 0.1, who: 'her', label: 'LANES 7 + 8'},
  {a: B.nice, b: B.wipe3 + 0.1, who: 'her'},
];
const Callout: React.FC<{t: number}> = ({t}) => {
  const c = CALLS.find((x) => t >= x.a && t < x.b);
  if (!c) return null;
  const b = boards(t), cells = c.who === 'him' ? b.his : b.hers, col = c.who === 'him' ? C.orange : C.mint;
  const age = t - c.a, pop = age < 0.18 ? 1 + 0.1 * Math.sin(age / 0.18 * Math.PI) : 1, fade = smooth(t, c.b - 0.1, c.b);
  const y = 500, fl = blinkFlash(t);
  const cur = c.who === 'him' && t < B.june ? hisLen(t) : -1;
  return <g opacity={1 - fade} transform={`translate(540 ${y + 100}) scale(${pop}) translate(-540 ${-(y + 100)})`}>
    <rect x={44} y={y + 14} width={1000} height={204} rx={30} fill={C.ink} />
    <rect x={36} y={y} width={1000} height={204} rx={30} fill={C.violet} stroke={C.ink} strokeWidth={6} />
    <rect x={50} y={y + 14} width={972} height={176} rx={20} fill="#0A0818" />
    <text x={70} y={y + 52} fontFamily={BAR} fontWeight={800} fontSize={40} letterSpacing={3} fill={C.teal}>{c.label ?? `LANE ${c.who === 'him' ? 7 : 8}`}</text>
    <g transform={`translate(${70} ${y + 62})`}><NameCells cells={cells} t={t} w={96} h={118} gap={8} font={108} bg="#201B48" flash={fl} /></g>
    {cur >= 0 && <rect x={70 + 26 + cur * 104} y={y + 62 + 18} width={44} height={80} rx={6} fill={col} opacity={Math.floor(t * 3) % 2 === 0 ? 0.9 : 0} />}
  </g>;
};

const BigKeys: React.FC<{lit: number}> = ({lit}) => <g>
  <rect x={KC - 12} y={1130} width={24} height={130} fill={C.ink} />
  <rect x={KC - 123 + 10} y={835 + 14} width={246} height={320} rx={22} fill={C.ink} opacity={0.4} />
  <rect x={KC - 123} y={835} width={246} height={320} rx={22} fill={C.ink} stroke={C.teal} strokeWidth={7} />
  <rect x={KC - 105} y={850} width={210} height={44} rx={8} fill="#0E0C1C" />
  <text x={KC - 92} y={884} fontFamily={BAR} fontWeight={800} fontSize={36} letterSpacing={3} fill={C.lemon}>NAME</text>
  {KEYS.map((lab, i) => {
    const [x, y] = keyXY(i), on = i === lit, dip = on ? 5 : 0;
    return <g key={i} transform={`translate(${x} ${y + dip})`}>
      <rect x={-35} y={-31 + (on ? 0 : -6)} width={70} height={70 + (on ? 0 : 6) - 6 * 0} rx={14} fill={C.ink} opacity={on ? 0 : 1} transform="translate(0 7)" />
      <rect x={-35} y={-35} width={70} height={70} rx={14} fill={on ? C.orange : C.cream} stroke={C.ink} strokeWidth={4} />
      {lab === 'DEL'
        ? <path d="M 18 -2 L -18 -2 M -4 -16 L -18 -2 L -4 12" stroke={C.ink} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        : <text x={0} y={17} textAnchor="middle" fontFamily={BAR} fontWeight={800} fontSize={lab === 'OK' ? 44 : 58} fill={C.ink}>{lab}</text>}
    </g>;
  })}
</g>;

type BayPhase = 'type' | 'ready' | 'laugh';
const Bay: React.FC<{t: number; phase: BayPhase}> = ({t, phase}) => {
  const CAM: CamKey[] = [
    {t: 0, x: 540, y: 950, z: 1.0}, {t: B.wipe2 - 0.01, x: 540, y: 950, z: 1.03}, {t: B.wipe2, x: 540, y: 950, z: 1.0, cut: true}, {t: B.herShot, x: 540, y: 950, z: 1.02},
    {t: B.bay3, x: 540, y: 950, z: 1.0, cut: true}, {t: B.wipe3, x: 540, y: 950, z: 1.03},
  ];
  const cam = camAt(CAM, t);
  const typ = phase === 'type', laugh = phase === 'laugh';
  let hp: Pose, wp: Pose;
  if (typ) { hp = himBay(t); wp = herBay(t); }
  else if (phase === 'ready') {
    const rk = k(1, -0.1, 0.8, 0, 0, R1, R2, 0.2);
    hp = fig(rk, 'wince'); wp = fig(k(-1, -0.1, 0.7, 0, 0, R1, R2, 0.3), 'smile');
  } else {
    const L = clamp((t - B.nice - 0.7) / 0.3), bob = (Math.abs(Math.sin((t - B.nice) * 9)) * -9) * L;
    hp = fig(k(-0.4, 0.2, 0.2, 5 * Math.sin(t * 9) * L, bob, R1, [76, -70], 0.8), 'grin');
    wp = fig(k(0.4, 0.2, 0.2, -5 * Math.sin(t * 9 + 1) * L, bob * 0.9, R1, [76, -70], 0.8), 'grin');
  }
  const b = boards(t);
  const curOn = Math.floor(t * 3) % 2 === 0;
  const showPhone = typ && t < 4.2;
  const pw = smooth(t, 3.95, 4.15);
  const dim = typ ? [smooth(t, B.dim1, B.dim1 + 0.12), smooth(t, B.dim2, B.dim2 + 0.12), smooth(t, B.dim3, B.dim3 + 0.12)] : [0, 0, 0];
  const fl = blinkFlash(t);
  const sub = subFor(t);
  const cursorIdx = hisLen(t);
  return <>
    <g transform={planeT(cam, 0.8)}><Wall t={t} /><rect x={-500} y={-500} width={2080} height={1320} fill="#B9A8FF" opacity={0.22} />
      <rect x={-500} y={-500} width={2080} height={1320} fill={C.ink} opacity={0.62 * dim[0]} /></g>
    <g transform={planeT(cam, 0.9)}>
      <Monitor x={280} y={MON_Y} lane={7} cells={b.his} t={t} score={hisScore()} cellFlash={fl} sub={sub} />
      <Monitor x={800} y={MON_Y} lane={8} cells={b.hers} t={t} score={herScore(t)} cellFlash={fl} sub={sub} />
      {typ && t >= 3 && t < B.june && <rect x={280 - 260 + 28 + 9 + cursorIdx * 52} y={MON_Y + 64 + 14} width={30} height={60} rx={4} fill={C.orange} opacity={curOn ? 0.95 : 0} />}
    </g>
    <g transform={planeT(cam, 1)}>
      <Carpet t={t} /><rect x={-500} y={780} width={2080} height={1500} fill="#8D7BE0" opacity={0.25} />
      <LanesBg t={t} pins7={Array(10).fill(true)} pins8={Array(10).fill(true)} />
      <rect x={-500} y={780} width={2080} height={1500} fill={C.ink} opacity={0.58 * dim[1]} />
      {typ ? <BigKeys lit={litKey(t)} /> : <ReturnHump lemon={1} violet={1} />}
      <Figure kind="him" x={HIM_X} y={FEET} p={hp} t={t} items={showPhone ? <Phone x={lerp(-128, -34, pw)} y={lerp(-268, -150, pw)} t={t} rot={-10} s={lerp(1.15, 0.5, pw)} glow={1 - pw} /> : null} />
      <Figure kind="her" x={HER_X} y={FEET} p={wp} t={t} items={<>
        {typ && waveA(t) > 0 && <Scrunchie x={herWavePos(t)[0] + 4} y={herWavePos(t)[1] + 6} />}
        {!laugh && t < B.june + 0.6 && false}
      </>} />
      <rect x={-500} y={1120} width={2080} height={400} fill={C.ink} opacity={0.5 * dim[2]} />
    </g>
  </>;
};

const LVP = 700, hwAt = (y: number) => 430 * (y - LVP) / 550, sAt = (y: number) => (y - LVP) / 550;
const LROWS: [number, number[]][] = [[880, [-0.87, -0.29, 0.29, 0.87]], [905, [-0.58, 0, 0.58]], [930, [-0.29, 0.29]], [955, [0]]];
const lx = (y: number, v: number) => 540 + v * hwAt(y);
const lPoly = (y0: number, y1: number, v0: number, v1: number) => `M ${lx(y0, v0)} ${y0} L ${lx(y0, v1)} ${y0} L ${lx(y1, v1)} ${y1} L ${lx(y1, v0)} ${y1} Z`;

// ------------------------------------------------------------------------------------------ down-the-lane shots
const FALL = 0.5;
type LM = {who: 'him' | 'her'; color: string; swing: [number, number, number, number]; roll: [number, number]; vAt: (u: number) => number; slow?: boolean; hit?: {at: number; kind: 'spare' | 'strike' | 'her' | 'last'}; rewind?: boolean; gutter?: boolean; zoom: [number, number]};
const MODES: Record<string, LM> = {
  herS: {who: 'her', color: C.violet, swing: [B.herShot, B.herShot + 0.1, B.herShot + 0.2, B.herRel], roll: [B.herRel, B.herHit], vAt: (u) => -0.35 + 0.35 * smooth(u, 0.2, 0.9), zoom: [B.herRel + 0.2, B.herHit], hit: {at: B.herHit, kind: 'strike'}},
  hisG: {who: 'him', color: C.lemon, swing: [B.hisShot, B.hisShot + 0.1, B.hisShot + 0.2, B.hisRel], roll: [B.hisRel, B.hisEnd],
    vAt: (u) => -0.08 + 0.1 * Math.sin(u * 36) * smooth(u, 0.05, 0.18) * (1 - smooth(u, 0.5, 0.72)) - 1.0 * smooth(u, 0.42, 0.72), zoom: [B.hisRel + 0.2, B.hisEnd], gutter: true},
};
const LaneShot: React.FC<{t: number; m: string}> = ({t, m}) => {
  const md = MODES[m], b = boards(t);
  const [s0, s1, s2, rel] = md.swing;
  const zk = smooth(t, md.zoom[0], md.zoom[1]);
  const z = lerp(1, 1.4, zk);
  const raw = clamp((t - md.roll[0]) / (md.roll[1] - md.roll[0]));
  const u = md.rewind ? 1 - raw : raw;
  const P = (x: number) => (md.slow ? 1 - Math.pow(1 - x, 1.45) : Math.pow(x, 0.82));
  const yb = lerp(1330, 905, P(u)), bv = md.vAt(u);
  const bx = lx(yb, bv), br = 80 * sAt(yb);
  const hit = md.hit ? t - md.hit.at : -1;
  const kind = md.hit?.kind;
  const rolling = md.rewind ? t >= md.roll[0] && t < md.roll[1] : t >= rel && !(md.hit && hit > 0.05);
  const pins = LROWS.flatMap(([y, vs]) => vs.map((v) => ({y, x: lx(y, v)})));
  const hand = t < s1 ? track([[s0, [78, -66]], [s1, [120, -30]]], t) : track([[s1, [120, -30]], [s2, [92, -112]]], t);
  const ballInHand = md.rewind ? t >= md.roll[1] - 0.02 : t < rel;
  const trail = rolling ? Array.from({length: 7}, (_, i) => { const tu = md.rewind ? clamp(u + i * 0.05) : clamp(u - i * 0.05); if (tu <= 0 || tu >= 1.001) return null; const y2 = lerp(1330, 905, P(tu)); return {x: lx(y2, md.vAt(tu)), y: y2, r: 80 * sAt(y2), i}; }) : [];
  const stance: Pose = {lx: 0, ly: 0, brow: 0, tilt: 0, dy: 0, a1: [-70, -52], a2: [hand[0], hand[1]], mouth: 'flat'};
  const ev = kind === 'last' ? hit - FALL : hit;               // moment of the banner (the last pin falls a second after the crash)
  const banner = (kind === 'strike' || kind === 'spare' || kind === 'last') && ev > 0.03;
  const shake = md.hit && hit > 0 && hit < 0.4 && kind !== 'her' ? Math.sin(t * 90) * 9 * (1 - hit / 0.4) : 0;
  const lane = md.who === 'him' ? 7 : 8;
  const bk = kind === 'spare' ? 'spare' : 'strike';
  return <g transform={`translate(${shake} 0)`}>
    <g transform={`translate(540 ${lerp(960, 1010, zk)}) scale(${z}) translate(-540 -${lerp(960, 945, zk)})`}>
      <rect x={-600} y={-300} width={2280} height={1200} fill="#4B3E9C" />
      <Memphis x0={-300} y0={0} x1={1400} y1={760} n={40} seed={4} op={0.85} t={t} />
      <rect x={-600} y={760} width={2280} height={100} fill={C.ink} /><rect x={-600} y={760} width={2280} height={12} fill={C.lemon} />
      <rect x={-600} y={860} width={2280} height={900} fill="#3A3077" />
      <path d={lPoly(850, 1560, -1.32, 1.32)} fill={C.ink} /><path d={lPoly(850, 1560, -1.12, 1.12)} fill={C.teal} /><path d={lPoly(850, 1560, -1.0, 1.0)} fill={C.lane} />
      {[-0.66, -0.33, 0, 0.33, 0.66].map((v, i) => <path key={i} d={`M ${lx(850, v)} 850 L ${lx(1560, v)} 1560`} stroke={C.laneLine} strokeWidth={4} />)}
      {[-0.6, -0.4, -0.2, 0, 0.2, 0.4, 0.6].map((v, i) => { const y = 1060 + (3 - Math.abs(i - 3)) * 44; const s = sAt(y); return <path key={i} d={`M ${lx(y, v) - 22 * s * 1.4} ${y + 22 * s * 1.4} L ${lx(y, v)} ${y - 34 * s * 1.4} L ${lx(y, v) + 22 * s * 1.4} ${y + 22 * s * 1.4} Z`} fill={C.orange} />; })}
      <path d={lPoly(1196, 1204, -1.32, 1.32)} fill={C.ink} />
      {pins.map((p, i) => {
        if (md.rewind) {
          const tau = 0.36 * (1 - smooth(raw, 0.05, 0.9)), vx = ((i * 97) % 11 - 5) * 70, vy = -160 - ((i * 53) % 7) * 70;
          return <g key={i}><Pin x={p.x + vx * tau} y={p.y + 6 - 60 * (tau > 0 ? 1 : 0) * (tau / 0.36) + vy * tau + 900 * tau * tau} s={sAt(p.y) * 1.2} rot={tau * (i % 2 ? 900 : -800)} /></g>;
        }
        if (!md.hit || hit <= 0.03) return <Pin key={i} x={p.x} y={p.y + 6} s={sAt(p.y) * 1.2} />;
        if (kind === 'last' && i === 5) {          // the lonely last pin: wobbles harder and harder, then falls
          if (hit < FALL) { const amp = 4 + 14 * (hit / FALL) * (hit / FALL); return <Pin key={i} x={p.x} y={p.y + 6} s={sAt(p.y) * 1.2} rot={Math.sin(hit * (22 + hit * 10)) * amp} />; }
          const tau = hit - FALL;
          return <g key={i} opacity={1 - smooth(tau, 0.1, 0.26)}><Pin x={p.x + 40 * tau} y={p.y + 6 + 300 * tau * tau} s={sAt(p.y) * 1.2} rot={14 + 520 * tau * tau} /></g>;
        }
        if (kind === 'spare' && (i === 0 || i === 3)) {
          const wob = hit < 0.3 ? Math.sin(hit * 60) * 9 * smooth(hit, 0, 0.1) : 0, tau = Math.max(0, hit - 0.3), dir = i === 0 ? -1 : 1;
          return <g key={i} opacity={1 - smooth(tau, 0.3, 0.45)}><Pin x={p.x + dir * 70 * tau} y={p.y + 6 + 300 * tau * tau} s={sAt(p.y) * 1.2} rot={wob + dir * 520 * tau * tau} /></g>;
        }
        const vx = ((i * 97) % 11 - 5) * 70, vy = -160 - ((i * 53) % 7) * 70, tau = hit, ok = 1 - smooth(tau, 0.35, 0.55);
        return <g key={i} opacity={ok}><Pin x={p.x + vx * tau} y={p.y - 60 + vy * tau + 900 * tau * tau} s={sAt(p.y) * 1.2} rot={tau * (i % 2 ? 900 : -800)} /></g>;
      })}
      {trail.map((q) => q && <circle key={q.i} cx={q.x} cy={q.y} r={q.r * 0.9} fill={C.cream} opacity={0.14 * (1 - q.i / 7)} />)}
      {rolling && <Ball x={bx} y={yb} r={br} color={md.color} spin={u * 900} />}
      <g transform="translate(340 1510) scale(1.5)">
        <BackFigure kind={md.who} p={stance} t={t} ball={ballInHand ? md.color : null} />
      </g>
    </g>
    <g transform={`translate(0 ${zk * -8})`}>
      <Monitor x={540} y={MON_Y} lane={lane} cells={md.who === 'him' ? b.his : b.hers} t={t} sub={{text: 'FRAME 10'}} cellFlash={0}
        score={md.who === 'him' ? hisScore() : herScore(t)} scorePop={md.who === 'him' ? 0 : b.herPop} />
    </g>
    {md.rewind && t > md.roll[0] && t < md.roll[1] && <g stroke={C.cream} strokeWidth={5} strokeLinecap="round" opacity={0.35}>
      {Array.from({length: 12}, (_, i) => { const a = (i / 12) * Math.PI * 2, kk = 1 - ((t * 5 + i * 0.37) % 1); return <path key={i} d={`M ${540 + Math.cos(a) * (240 + kk * 600)} ${1000 + Math.sin(a) * (240 + kk * 600)} L ${540 + Math.cos(a) * (330 + kk * 700)} ${1000 + Math.sin(a) * (330 + kk * 700)}`} />; })}
    </g>}
    {kind === 'last' && ev > 0 && ev < 0.12 && <rect x={0} y={0} width={1080} height={1920} fill="#fff" opacity={0.55 * (1 - ev / 0.12)} />}
    {banner && <g transform={`translate(540 1130) rotate(-7) scale(${(kind === 'spare' ? 0.25 : 0.3) + (kind === 'spare' ? 0.6 : 0.7) * smooth(ev, 0.03, 0.15)})`}>
      <path d={Array.from({length: 24}, (_, i) => { const a = i / 24 * Math.PI * 2, r = i % 2 ? 175 : 235; return `${i ? 'L' : 'M'} ${Math.cos(a) * r * 1.35} ${Math.sin(a) * r * 0.62}`; }).join(' ') + ' Z'} fill={bk === 'strike' ? C.lemon : C.mint} stroke={C.ink} strokeWidth={8} strokeLinejoin="round" />
      <text x={0} y={bk === 'strike' ? 34 : 30} textAnchor="middle" fontFamily={NUN} fontWeight={900} fontSize={bk === 'strike' ? 104 : 92} fill={bk === 'strike' ? C.orange : C.violet} stroke={C.ink} strokeWidth={9} paintOrder="stroke">{bk === 'strike' ? 'STRIKE!' : 'SPARE!'}</text>
    </g>}
    {md.gutter && t > md.roll[0] + 0.3 && <g transform={`translate(540 1120) rotate(-5) scale(${0.5 + 0.5 * smooth(t - md.roll[0] - 0.3, 0, 0.12)})`}>
      <rect x={-250} y={-72} width={500} height={150} rx={30} fill={C.ink} transform="translate(10 12)" />
      <rect x={-250} y={-72} width={500} height={150} rx={30} fill={C.orange} stroke={C.ink} strokeWidth={8} />
      <text x={0} y={42} textAnchor="middle" fontFamily={NUN} fontWeight={900} fontSize={104} fill={C.cream} stroke={C.ink} strokeWidth={8} paintOrder="stroke">GUTTER</text>
    </g>}
  </g>;
};

// ------------------------------------------------------------------------------------------ shoe return
const Shoes: React.FC<{x: number; y: number; rot?: number; s?: number}> = ({x, y, rot = 0, s = 1}) => <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
  {[0, 1].map((i) => <g key={i} transform={`translate(${(i - 0.5) * 84} ${i * 4})`}>
    <path d="M -36 10 L -36 -16 Q -36 -30 -22 -30 L -8 -30 Q 2 -12 22 -10 Q 42 -8 42 10 Z" fill={C.cream} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
    <path d="M -24 -8 L 20 -4" stroke={i ? C.teal : C.orange} strokeWidth={9} strokeLinecap="round" />
    <rect x={-38} y={8} width={82} height={14} rx={7} fill={C.orange} stroke={C.ink} strokeWidth={4} />
  </g>)}
</g>;
const CUBBY_Y = 590, CUBBY_H = 250, SFEET = 1250, PHONE_Y = 735;
const Cubby: React.FC<{x: number; n: string}> = ({x, n}) => <g>
  <rect x={x - 180 + 12} y={CUBBY_Y + 16} width={360} height={CUBBY_H} rx={22} fill={C.ink} opacity={0.4} />
  <rect x={x - 180} y={CUBBY_Y} width={360} height={CUBBY_H} rx={22} fill="#120F2B" stroke={C.teal} strokeWidth={12} />
  <rect x={x - 168} y={CUBBY_Y + 12} width={336} height={60} rx={14} fill="#1E1A3C" opacity={0.7} />
  <circle cx={x} cy={CUBBY_Y - 6} r={40} fill={C.lemon} stroke={C.ink} strokeWidth={6} />
  <text x={x} y={CUBBY_Y + 22} textAnchor="middle" fontFamily={NUN} fontWeight={900} fontSize={70} fill={C.ink}>{n}</text>
</g>;
const SHOE_PEOPLE: {kind: 'him' | 'her'; x: number; d: number; dir: number; n: string}[] = [
  {kind: 'him', x: 330, d: 0, dir: -1, n: '7'}, {kind: 'her', x: 750, d: 0.2, dir: 1, n: '8'},
];
const a2K: [number, number[]][] = [
  [-1, [70, -150]], [0, [70, -150]], [0.33, [0, -408]], [0.55, [0, -408]], [0.7, [40, -92]], [0.85, [72, -160]], [1.05, [72, -160]],
  [1.25, [0, -400]], [1.4, [0, -400]], [1.6, [70, -70]],
];
const ShoeShot: React.FC<{t: number}> = ({t}) => {
  const S = SHOE_PEOPLE.map((p) => {
    const u = t - B.shoe - p.d;
    const [hx, hy] = track(a2K, u);
    const walk = smooth(u, 1.6, 2.5);
    const x = p.x + p.dir * 520 * walk;
    const moving = u > 1.6 && u < 2.5;
    const v = k(u < 0.7 ? 0.3 : u < 1.25 ? 0 : u < 1.55 ? 0.2 : p.dir * 0.8, u < 0.7 ? -0.2 : u < 1.25 ? 0.6 : u < 1.55 ? 0.7 : 0, 0.3, 0, moving ? -Math.abs(Math.sin(u * 11)) * 14 : 0,
      moving ? [-70 - Math.sin(u * 11) * 16, -52] : R1, [hx, hy], 0.3);
    if (moving) { v[7] = 76 + Math.sin(u * 11) * 16; v[8] = -52; }
    const mouth: Mouth = u < 0.7 ? 'flat' : u < 1.25 ? 'smile' : u < 1.6 ? 'o' : 'grin';
    return {...p, u, pose: fig(v, mouth), x, hx, hy};
  });
  return <g>
    <rect x={-100} y={-100} width={1280} height={1000} fill="#4B3E9C" />
    <Memphis x0={-50} y0={200} x1={1130} y1={900} n={26} seed={7} op={0.7} t={t} />
    <rect x={-100} y={900} width={1280} height={1100} fill="#251F4A" />
    <Memphis x0={-50} y0={950} x1={1130} y1={1800} n={46} seed={9} op={0.9} t={0} />
    <rect x={-100} y={882} width={1280} height={22} fill={C.ink} /><rect x={-100} y={870} width={1280} height={12} fill={C.lemon} />
    <rect x={-100} y={560} width={1280} height={300} fill="#3A3077" opacity={0.0} />
    {SHOE_PEOPLE.map((p) => <Cubby key={p.n} x={p.x} n={p.n} />)}
    {S.map((p) => {
      const cx = SHOE_PEOPLE.find((q) => q.n === p.n)!.x;
      const shoeIn = p.u >= 0.33;
      const sy = shoeIn ? lerp(765, 800, smooth(p.u, 0.33, 0.5)) : 0;
      const inCubby = p.u >= 1.42, lit = p.u >= 1.3;
      const sh = lit ? Math.sin(t * 55) * 3 : 0;
      return <g key={p.n}>
        {shoeIn && <Shoes x={cx} y={sy + 22} s={1.15} rot={0} />}
        {inCubby && <g>
          <g opacity={0.75 + 0.25 * Math.sin(t * 20)}>
            <circle cx={cx} cy={PHONE_Y} r={170} fill={C.lemon} opacity={0.18} />
            {Array.from({length: 10}, (_, i) => { const a = i / 10 * Math.PI * 2; return <path key={i} d={`M ${cx + Math.cos(a) * 125} ${PHONE_Y + Math.sin(a) * 125} L ${cx + Math.cos(a) * 170} ${PHONE_Y + Math.sin(a) * 170}`} stroke={C.lemon} strokeWidth={9} strokeLinecap="round" opacity={0.9} />; })}
          </g>
          <Phone x={cx + sh} y={PHONE_Y} t={t} rot={8} s={1.1} glow={3} flick />
        </g>}
      </g>;
    })}
    {S.map((p) => <g key={p.n}>
      <Figure kind={p.kind} x={p.x} y={SFEET} p={p.pose} t={t} pocket={false} items={p.u < 0.33 ? <Shoes x={p.hx} y={p.hy + 34} s={0.9} rot={-10} /> : null} />
    </g>)}
    {S.map((p) => {
      const cx = SHOE_PEOPLE.find((q) => q.n === p.n)!.x;
      const phoneHand = p.u >= 0.7 && p.u < 1.25, fly = p.u >= 1.25 && p.u < 1.42;
      if (!phoneHand && !fly) return null;
      const pf = smooth(p.u, 1.25, 1.42), hx = p.x + p.hx, hy = SFEET + p.hy - 74;
      return <Phone key={p.n} x={phoneHand ? hx : lerp(hx, cx, pf)} y={phoneHand ? hy : lerp(hy, PHONE_Y, pf)} t={t} rot={phoneHand ? -8 : lerp(-8, 8, pf)} s={phoneHand ? 0.95 : lerp(0.95, 1.1, pf)} glow={1 + 2 * pf} />;
    })}
  </g>;
};

// ------------------------------------------------------------------------------------------ bench: fries, the boards merge
const Fries: React.FC<{x: number; y: number; n: number; s?: number}> = ({x, y, n, s = 1}) => <g transform={`translate(${x} ${y}) scale(${s})`}>
  {Array.from({length: n}, (_, i) => <g key={i} transform={`translate(${(i - (n - 1) / 2) * 15} -14) rotate(${(i - (n - 1) / 2) * 6})`}>
    <rect x={-6.5} y={-50 - (i % 2) * 7} width={13} height={56 + (i % 2) * 7} rx={4} fill={C.lemon} stroke={C.ink} strokeWidth={3.5} />
  </g>)}
  <path d="M -52 -18 L 52 -18 L 40 24 L -40 24 Z" fill={C.orange} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
  <path d="M -46 -3 L 46 -3" stroke={C.cream} strokeWidth={9} strokeLinecap="round" />
</g>;
const BS = 1.4, BFEET = 1450, BHX = 380, BWX = 700, TRAYX = 540, TRAYY = 1190, TS = 2.3;
const MERGE_TXT = 'DAN · JUNE';
const mergeColor = (n: number) => (n < 3 ? C.orange : n === 4 ? C.lemon : C.mint);
const Merged: React.FC<{t: number}> = ({t}) => {
  const age = t - B.mergeB;
  if (age < 0) return null;
  const pop = age < 0.25 ? 1 + 0.12 * Math.sin(age / 0.25 * Math.PI) : 1;
  const cells: Cell[] = Array.from({length: 10}, (_, n) => ({ch: MERGE_TXT[n] ?? ' ', prev: ' ', flipAt: B.mergeB + 0.1 + n * 0.07, color: mergeColor(n)}));
  const off = smooth(t, B.lightsOff, B.lightsOff + 0.5);
  return <g transform={`translate(540 575) scale(${pop}) translate(-540 -575)`}>
    {[44, 30, 16].map((g, i) => <rect key={i} x={40 - g} y={450 - g} width={1000 + 2 * g} height={240 + 2 * g} rx={30 + g} fill={C.lemon} opacity={0.05 + 0.1 * off} />)}
    <rect x={150} y={-70} width={14} height={526} fill={C.ink} /><rect x={916} y={-70} width={14} height={526} fill={C.ink} />
    <rect x={52} y={466} width={1000} height={240} rx={30} fill={C.ink} opacity={0.4} />
    <rect x={40} y={450} width={1000} height={240} rx={30} fill={C.violet} stroke={C.ink} strokeWidth={6} />
    <rect x={56} y={466} width={968} height={208} rx={20} fill="#0A0818" />
    <text x={86} y={510} fontFamily={BAR} fontWeight={800} fontSize={36} letterSpacing={3} fill={C.teal}>LANES 7 + 8</text>
    <g transform="translate(113 530)"><NameCells cells={cells} t={t} w={80} h={130} gap={6} font={124} bg="#201B48" /></g>
  </g>;
};
const eatHand = (t: number, off: number, side: 1 | -1): [number, number, boolean] => {
  const T = 2.2, ph = (((t - off) % T) + T) % T / T;
  const fx = side * 112, fy = -226, mx = 0, my = -262;
  if (ph < 0.3) { const s = smooth(ph, 0, 0.3); return [lerp(mx * 1, fx, s), lerp(my, fy, s), false]; }
  if (ph < 0.45) return [fx, fy, ph > 0.38];
  if (ph < 0.75) { const s = smooth(ph, 0.45, 0.75); return [lerp(fx, mx, s), lerp(fy, my, s), true]; }
  return [mx, my, ph < 0.82];
};
const BenchShot: React.FC<{t: number}> = ({t}) => {
  const mg = smooth(t, B.mergeA, B.mergeB - 0.15);
  const up = smooth(t, B.mergeA, B.mergeA + 0.2) * (1 - smooth(t, B.mergeB + 0.4, B.mergeB + 0.6));
  const look = keyAt<number>(t, [[0, 1], [B.mergeA, 0]]);
  const [h1x, h1y, f1] = eatHand(t, 0, 1), [h2x, h2y, f2] = eatHand(t, 1.0, -1);
  const lit = (kind: 'him' | 'her'): Pose => {
    const him = kind === 'him', sgn = him ? 1 : -1;
    const [ex, ey, hf] = him ? [h1x, h1y, f1] : [h2x, h2y, f2];
    void hf;
    const tray: [number, number] = [sgn * 43, -190 + Math.sin(t * 3 + (him ? 0 : 1)) * 2];
    const blush = 0.5 + 0.5 * smooth(t, B.mergeB, B.mergeB + 0.8);
    const mouth: Mouth = t < B.mergeA ? (Math.sin(t * 5 + (him ? 0 : 2)) > 0.6 ? 'o' : 'smile') : t < B.mergeB + 0.3 ? 'o' : 'grin';
    const v = k(look * sgn, -0.9 * up + (1 - up) * 0.05, 0.6 * up, sgn * 3 * (1 - up), Math.sin(t * 4 + (him ? 0 : 1)) * 2, [0, 0], [0, 0], blush);
    if (him) { v[5] = ex; v[6] = ey; v[7] = tray[0]; v[8] = tray[1]; } else { v[5] = tray[0]; v[6] = tray[1]; v[7] = ex; v[8] = ey; }
    return fig(v, mouth);
  };
  const monOp = 1 - smooth(t, B.mergeB - 0.12, B.mergeB);
  const dark = 0.6 * smooth(t, B.lightsOff, B.lightsOff + 0.5);
  const fryItem = (f: boolean) => f ? <g transform="rotate(8)"><rect x={-6} y={-40} width={13} height={50} rx={4} fill={C.lemon} stroke={C.ink} strokeWidth={3} /></g> : null;
  return <g>
    <rect x={-100} y={-100} width={1280} height={1000} fill="#3A3077" />
    <Memphis x0={-50} y0={200} x1={1130} y1={850} n={30} seed={13} op={0.75} t={t} />
    <rect x={-100} y={840} width={1280} height={1200} fill="#251F4A" />
    <Memphis x0={-50} y0={900} x1={1130} y1={1800} n={50} seed={17} op={0.9} t={0} />
    <rect x={-100} y={850} width={1280} height={150} fill={C.violet} /><rect x={-100} y={850} width={1280} height={14} fill={C.lemon} /><rect x={-100} y={864} width={1280} height={10} fill={C.ink} />
    <g opacity={monOp}>
      <Monitor x={lerp(280, 540, mg)} y={MON_Y} lane={7} cells={cellsFor([{t0: -1e9, text: 'DAN'}], t, C.orange)} t={t} score={hisScore()} sub={{text: 'GAME OVER'}} />
      <Monitor x={lerp(800, 540, mg)} y={MON_Y} lane={8} cells={cellsFor([{t0: -1e9, text: 'JUNE'}], t, C.mint)} t={t} score={herScore(99)} sub={{text: 'GAME OVER'}} />
    </g>
    <Figure kind="him" x={BHX} y={BFEET} p={lit('him')} t={t} scale={BS} pocket={false} items={fryItem(f1)} />
    <Figure kind="her" x={BWX} y={BFEET} p={lit('her')} t={t} scale={BS} items={fryItem(f2)} />
    <rect x={150} y={1340} width={780} height={64} rx={16} fill={C.ink} transform="translate(8 10)" opacity={0.5} />
    <rect x={150} y={1340} width={780} height={64} rx={16} fill={C.teal} stroke={C.ink} strokeWidth={6} />
    <Fries x={TRAYX} y={TRAYY + Math.sin(t * 3) * 2} n={7} s={TS} />
    <rect x={-100} y={-100} width={1280} height={2100} fill={C.ink} opacity={dark} />
    <Merged t={t} />
  </g>;
};

// ------------------------------------------------------------------------------------------ end card
const EndCard: React.FC<{t: number}> = ({t}) => {
  const a = t - B.endcard;
  const kk = smooth(a, 0, 0.25);
  const pop = a < 0.3 ? 1 + 0.15 * (1 - a / 0.3) : 1;
  const card = (y: number, h: number, fill: string, lines: string[], fs: number, op = 1, font = NUN) => <g opacity={op} transform={`translate(540 ${y}) scale(${pop}) translate(-540 ${-y})`}>
    <rect x={64} y={y - h / 2} width={960} height={h} rx={34} fill={C.ink} transform="translate(12 14)" />
    <rect x={64} y={y - h / 2} width={960} height={h} rx={34} fill={fill} stroke={C.ink} strokeWidth={7} />
    {lines.map((l, i) => <text key={i} x={544} y={y - ((lines.length - 1) * fs * 1.1) / 2 + i * fs * 1.1 + fs * 0.34} textAnchor="middle" fontFamily={font} fontWeight={900} fontSize={fs} fill={C.ink}>{l}</text>)}
  </g>;
  return <g opacity={kk}>
    <rect x={0} y={0} width={1080} height={1920} fill={C.cream} />
    <Memphis x0={-50} y0={150} x1={1130} y1={1700} n={46} seed={21} op={0.9} t={t} />
    {card(480, 190, C.lemon, ['lane 8 · the end'], 112)}
    <g opacity={smooth(a, 0.3, 0.55)}>
      <rect x={90} y={650} width={920} height={170} rx={28} fill={C.ink} transform="translate(8 10)" />
      <rect x={90} y={650} width={920} height={170} rx={28} fill={C.violet} stroke={C.ink} strokeWidth={6} />
      <text x={540} y={776} textAnchor="middle" fontFamily={BAR} fontWeight={800} fontSize={116} letterSpacing={6} fill={C.cream}>DAN · JUNE</text>
    </g>
    {card(1020, 270, C.cream, ["send this to someone", "you'd bowl badly with."], 66, smooth(a, 0.5, 0.8))}
  </g>;
};

// ------------------------------------------------------------------------------------------ the edit
const WIPES = [B.wipe1, B.wipe2, B.wipe3, B.wipe4];
type Shot = 'hook' | 'bayType' | 'bayReady' | 'herS' | 'hisG' | 'bayLaugh' | 'shoe' | 'bench' | 'end';
const shotAt = (t: number): Shot => {
  if (t < B.wipe1) return 'hook';
  if (t < B.wipe2) return 'bayType';
  if (t < B.herShot) return 'bayReady';
  if (t < B.hisShot) return 'herS';
  if (t < B.bay3) return 'hisG';
  if (t < B.wipe3) return 'bayLaugh';
  if (t < B.wipe4) return 'shoe';
  if (t < B.endcard) return 'bench';
  return 'end';
};
const renderShot = (s: Shot, t: number): React.ReactNode => {
  switch (s) {
    case 'hook': return <HookShot t={t} />;
    case 'bayType': return <Bay t={t} phase="type" />;
    case 'bayReady': return <Bay t={t} phase="ready" />;
    case 'bayLaugh': return <Bay t={t} phase="laugh" />;
    case 'shoe': return <ShoeShot t={t} />;
    case 'bench': return <BenchShot t={t} />;
    case 'end': return <EndCard t={t} />;
    default: return <LaneShot t={t} m={s} />;
  }
};

const Scene: React.FC<{hook: Hook}> = ({hook}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const w = WIPES.find((x) => t >= x && t < x + WIPE_DUR);
  const cur = shotAt(t);
  const prev = w !== undefined ? shotAt(w - 0.001) : null;
  const g = w !== undefined ? wipeGeom((t - w) / WIPE_DUR) : null;
  const hooks = spec.hooks as Record<string, string>;
  return <>
    <MotionBlurWhen fast={w !== undefined} samples={5} shutter={200}>
      <AbsoluteFill>
        <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, background: C.wall}}>
          {w !== undefined && g ? <>
            {renderShot(prev as Shot, t)}
            <defs><clipPath id="iris"><circle cx={g.cx} cy={g.y} r={g.rIris} /></clipPath></defs>
            <g clipPath="url(#iris)">{renderShot(cur, t)}</g>
            <WipeBall k={(t - w) / WIPE_DUR} />
          </> : renderShot(cur, t)}
        </svg>
      </AbsoluteFill>
    </MotionBlurWhen>
    <AbsoluteFill>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        {t >= B.wipe1 && t < B.endcard && t < B.wipe4 && <Callout t={t} />}
        {t < B.wipe1 && <Strip text={hooks[hook] ?? hooks.a} y={345} age={t + 1} out={smooth(t, 2.85, 3.0)} size={56} maxW={960} />}
        {spec.strips.map((s, i) => {
          if (t < s.from || t >= s.to) return null;
          return <Strip key={i} text={s.text} y={345} age={t - s.from + 0.06} out={smooth(t, s.to - 0.12, s.to)} size={58} rot={i % 2 ? 0.8 : -0.8} hue="lemon" />;
        })}
      </svg>
    </AbsoluteFill>
  </>;
};

export const Lane4: React.FC<{hook?: Hook}> = ({hook = 'a'}) => (
  <AbsoluteFill style={{background: C.wall}}>
    <Audio src={staticFile('audio/lane-ep4-room.wav')} volume={0.5} />
    <Audio src={staticFile('audio/lane-ep4-music.wav')} volume={0.75} />
    <Audio src={staticFile('audio/lane-ep4-sfx.wav')} volume={0.9} />
    <Scene hook={hook} />
  </AbsoluteFill>
);
