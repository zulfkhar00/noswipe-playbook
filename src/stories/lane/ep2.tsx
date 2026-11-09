import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, lerp, smooth} from '../../lib/motion';
import {MotionBlurWhen} from '../../lib/shots';
import {
  BAR, C, Ball, Carpet, Cell, Cam, CamKey, Figure, Keypad, LanesBg, Memphis, Monitor, NameCells, NUN, Phone, Pin, Pose, ReturnHump, Strip,
  Wall, WIPE_DUR, WipeBall, KEYP, camAt, keyAt, planeT, track, wipeGeom, Mouth,
} from './world';
import {BackFigure} from './ep1';
import spec from '../../../specs/stories/lane-ep2.json';

// Lane 8, part 2 "Game on". Frame 1 is bright, ONE strip, two big scoreboards and two big faces. Take 1: he types ONE SEC,
// looks at his phone, his frame timer runs out, her box says OK and she turns back to her lane; freeze, the ball rolls back
// up the lane (rewind). Take 2: GAME ON, phone off, spare, her strike, his first strike, an air high-five, her bet.

export const LANE2_FPS = 60;
export const LANE2_FRAMES = Math.round(spec.duration * LANE2_FPS);
const B = spec.beats;
export type Hook = 'a' | 'b';

// ------------------------------------------------------------------------------------------ name boxes
type State = {t0: number; text: string; stagger?: number; instant?: boolean};
const cellsFor = (states: State[], t: number, color: string): Cell[] => {
  let i = 0;
  while (i + 1 < states.length && t >= states[i + 1].t0) i++;
  const cur = states[i], prev = states[Math.max(0, i - 1)];
  return Array.from({length: 9}, (_, n) => ({
    ch: cur.text[n] ?? ' ', prev: i === 0 ? (cur.text[n] ?? ' ') : (prev.text[n] ?? ' '),
    flipAt: i === 0 ? -1e9 : cur.t0 + n * (cur.stagger ?? 0.12), color, instant: cur.instant,
  }));
};
const HERS: State[] = [
  {t0: -1e9, text: 'BEAT ME?'}, {t0: B.herOk, text: 'OK', stagger: 0.08}, {t0: 7.6, text: 'BEAT ME?', stagger: 0.06},
  {t0: B.nice, text: 'NICE!', stagger: 0.1}, {t0: B.yourMove, text: 'YOUR MOVE', stagger: 0.06}, {t0: B.okWow, text: 'OK. WOW.', stagger: 0.05},
  {t0: B.loser, text: 'LOSER', stagger: 0.04}, {t0: B.buys, text: 'BUYS', stagger: 0.04}, {t0: B.fries, text: 'FRIES?', stagger: 0.04},
];
const HIS: State[] = [
  {t0: -1e9, text: ''}, {t0: B.type1, text: 'ONE SEC', stagger: 0.14, instant: true}, {t0: 7.6, text: '', stagger: 0, instant: true},
  {t0: B.type2, text: 'GAME ON', stagger: 0.14, instant: true},
];
const boards = (t: number) => {
  const blink = Math.floor(t * 4) % 2 === 0;
  const oneSecBlink = t >= 5.0 && t < 7.6 && !blink;
  const his = cellsFor(HIS, t, oneSecBlink ? C.cream : C.orange);
  const hers = cellsFor(HERS, t, C.mint);
  const hisScore = t < B.hit1 ? '1' : '/';
  const hisX = smooth(t, B.hit2, B.hit2 + 0.15);
  const hisPop = t >= B.hit1 && t < B.hit1 + 0.5 ? Math.sin((t - B.hit1) / 0.5 * Math.PI) : t >= B.hit2 && t < B.hit2 + 0.6 ? Math.sin((t - B.hit2) / 0.6 * Math.PI) : 0;
  const herPop = t >= B.herHit && t < B.herHit + 0.5 ? Math.sin((t - B.herHit) / 0.5 * Math.PI) : 0;
  const ring = t >= B.ringStart && t < B.wipe3 ? clamp(1 - (t - B.ringStart) / 2.0) : null;
  return {his, hers, hisScore, hisX, hisPop, herPop, ring};
};

// ------------------------------------------------------------------------------------------ the cast
const k = (lx: number, ly: number, brow: number, tilt: number, dy: number, a1: [number, number], a2: [number, number], blush = 0, thumb = 0) =>
  [lx, ly, brow, tilt, dy, a1[0], a1[1], a2[0], a2[1], blush, thumb];
const fig = (v: number[], mouth: Mouth): Pose => ({lx: v[0], ly: v[1], brow: v[2], tilt: v[3], dy: v[4], a1: [v[5], v[6]], a2: [v[7], v[8]], blush: v[9], thumb: v[10], mouth});
const HR1: [number, number] = [-100, -128], HR2: [number, number] = [78, -58], R1: [number, number] = [-70, -52], R2: [number, number] = [76, -52];
const himKeys: [number, number[]][] = [
  [0, k(1, 0.2, 0.4, 4, 0, HR1, HR2, 0.1)], [3.55, k(1, 0.2, 0.4, 4, 0, HR1, HR2, 0.1)], [4.7, k(0.4, 0.6, 0.3, 0, 0, HR1, HR2, 0.2)],
  [4.9, k(0, 1, 0.9, -4, 2, [-92, -150], HR2, 0.4)], [6.0, k(0, 1, 0.9, -4, 2, [-92, -150], HR2, 0.4)],
  [8.0, k(1, 0.2, 0.4, 4, 0, HR1, HR2, 0.1)], [8.8, k(0.4, 0.7, 0.2, 0, 0, HR1, HR2, 0.2)], [9.95, k(0.4, 0.7, 0.2, 0, 0, HR1, HR2, 0.2)],
  [10.35, k(1, 0.4, 0.2, 3, 0, [-8, -118], R2, 0.2)], [10.65, k(1, 0.5, 0.2, 3, 0, [-8, -96], R2, 0.2)],
  [12.15, k(1, 0.3, 0.2, 3, 0, R1, R2, 0.3)], [13.95, k(1, -0.1, 0.6, 0, 0, R1, R2, 0.2)], [14.4, k(1, -0.1, 0.6, 0, 0, R1, R2, 0.2)],
  [16.35, k(0, -0.4, 1, -5, 0, [-92, -330], [92, -330], 0.8)], [16.7, k(0, -0.4, 1, -5, 0, [-92, -330], [92, -330], 0.8)],
  [17.12, k(0, -0.5, 1, -3, 0, R1, [232, -310], 0.8)], [17.5, k(0, -0.5, 1, -3, 0, R1, [232, -310], 0.8)], [18.2, k(1, 0, 0.7, 2, 0, R1, R2, 0.6)],
];
const himMouth = (t: number): Mouth => keyAt<Mouth>(t, [[0, 'flat'], [4.9, 'flat'], [10.65, 'smile'], [13.95, 'flat'], [16.35, 'o'], [17.1, 'smile'], [18.0, 'smile'], [18.9, 'wince']]);
const HRR = k(-0.7, 0.1, 0.1, -2, 0, [-68, -50], [76, -66]);
const herKeys: [number, number[]][] = [
  [0, HRR], [5.6, HRR], [5.95, k(0.1, -1, 0.1, 4, 0, [-68, -50], [76, -66])], [6.0, k(0.1, -1, 0.1, 4, 0, [-68, -50], [76, -66])],
  [8.0, HRR], [12.15, k(-0.8, -0.2, 0.7, 0, 0, [-68, -50], [76, -66])], [12.7, k(-0.8, -0.2, 0.7, 0, 0, [-68, -50], [76, -66])],
  [13.95, k(-1, -0.1, 0.7, 0, 0, [-190, -195], R2)], [16.3, k(-1, -0.1, 0.7, 0, 0, [-190, -195], R2)], [16.4, k(-1, -0.3, 1, 0, 0, [-68, -50], R2)],
  [16.75, k(-1, -0.3, 1, 0, 0, [-68, -50], R2)], [17.12, k(-1, -0.2, 0.8, 3, -3, [-233, -310], R2)], [17.6, k(-1, -0.2, 0.8, 3, -3, [-233, -310], R2)],
  [18.2, k(-1, -0.1, 0.4, 3, 0, [-68, -50], R2)],
];
const herMouth = (t: number): Mouth => keyAt<Mouth>(t, [[0, 'smile'], [5.95, 'flat'], [8.0, 'smile'], [12.15, 'smile'], [13.95, 'smile'], [16.35, 'o'], [17.1, 'smile'], [18.0, 'amused']]);

const SEQ1 = [4, 7, 2, 0, 5, 2, 8], CH1 = 'ONE SEC';
const SEQ2 = [1, 3, 6, 8, 0, 5, 2], CH2 = 'GAME ON';
const typeAt = (t: number, t0: number): number => (t < t0 || t >= t0 + 7 * 0.14 + 0.1 ? -1 : Math.min(6, Math.floor((t - t0) / 0.14)));
const himPose = (t: number): Pose => {
  const v = [...track(himKeys, t)];
  for (const [t0, seq] of [[B.type1, SEQ1], [B.type2, SEQ2]] as [number, number[]][]) {
    const i = typeAt(t, t0);
    if (t > t0 - 0.12 && t < t0 + 1.08) {
      const w = smooth(t, t0 - 0.12, t0 - 0.02) * (1 - smooth(t, t0 + 0.92, t0 + 1.08)), ph = ((t - t0) % 0.14) / 0.14;
      const [kx, ky] = KEYP(seq[Math.max(0, Math.min(6, i < 0 ? 6 : i))]);
      v[7] = lerp(v[7], kx - HIM_X, w); v[8] = lerp(v[8], ky - FEET + Math.sin(ph * Math.PI) * 9, w);
      v[1] = lerp(v[1], 0.5, w);
    }
  }
  return fig(v, himMouth(t));
};
const herPose = (t: number): Pose => {
  const v = [...track(herKeys, t)];
  if (t > B.nice && t < B.nice + 0.5) { const s = Math.sin((t - B.nice) / 0.25 * Math.PI * 2); v[4] = s * 4; v[3] = 3 + s * 3; }
  return fig(v, herMouth(t));
};
const HIM_X = 310, HER_X = 775, FEET = 1210, MON_Y = 470;

// ------------------------------------------------------------------------------------------ cameras
const CAM: CamKey[] = [
  {t: 0, x: 540, y: 950, z: 1.0}, {t: 6.0, x: 540, y: 950, z: 1.02},
  {t: 8.0, x: 540, y: 950, z: 1.0, cut: true}, {t: 10.4, x: 540, y: 950, z: 1.02},
  {t: 12.15, x: 540, y: 950, z: 1.0, cut: true}, {t: 12.8, x: 540, y: 950, z: 1.02},
  {t: 13.95, x: 540, y: 950, z: 1.0, cut: true}, {t: 14.5, x: 540, y: 950, z: 1.02},
  {t: 16.35, x: 540, y: 930, z: 1.0, cut: true}, {t: 19.4, x: 540, y: 930, z: 1.02},
];
const rnd = (i: number) => { const x = Math.sin(i * 91.7 + 17.3) * 43758.5453; return x - Math.floor(x); };

const Confetti: React.FC<{age: number; n?: number}> = ({age, n = 46}) => age < 0 || age > 2.4 ? null : <g>
  {Array.from({length: n}, (_, i) => {
    const x = rnd(i) * 1080 + Math.sin(age * 3 + i) * 24, y = -60 + rnd(i + 0.5) * 520 + age * (360 + rnd(i + 0.7) * 380), r = rnd(i + 0.9) * 360 + age * (200 + i * 6);
    const c = [C.teal, C.orange, C.lemon, C.violet, C.cream][i % 5];
    return <g key={i} transform={`translate(${x} ${y}) rotate(${r})`} opacity={1 - smooth(age, 1.8, 2.4)}>
      {i % 3 === 0 ? <circle r={9} fill={c} stroke={C.ink} strokeWidth={3} /> : <rect x={-9} y={-15} width={18} height={30} rx={3} fill={c} stroke={C.ink} strokeWidth={3} />}
    </g>;
  })}
</g>;

const StarPop: React.FC<{age: number; x: number; y: number}> = ({age, x, y}) => age < 0 || age > 0.7 ? null : <g transform={`translate(${x} ${y}) scale(${0.4 + 0.9 * (1 - Math.pow(1 - clamp(age / 0.25), 3))}) rotate(${age * 40})`} opacity={1 - smooth(age, 0.4, 0.7)}>
  <path d={Array.from({length: 16}, (_, i) => { const a = i / 16 * Math.PI * 2, r = i % 2 ? 50 : 96; return `${i ? 'L' : 'M'} ${Math.cos(a) * r} ${Math.sin(a) * r}`; }).join(' ') + ' Z'} fill={C.lemon} stroke={C.ink} strokeWidth={7} strokeLinejoin="round" />
  <circle r={26} fill={C.cream} stroke={C.ink} strokeWidth={6} />
</g>;

// ------------------------------------------------------------------------------------------ hook: bright, two boards, two faces
const HookShot: React.FC<{t: number}> = ({t}) => {
  const b = boards(t);
  const zoom = 1 + 0.03 * smooth(t, 0, 3);
  const buzzOn = (t * 2.2) % 1 < 0.62;
  const sh = buzzOn ? Math.sin(t * 120) * 5 : 0;
  const curOn = Math.floor(t * 3) % 2 === 0;
  const hp = fig(k(1, 0.35, 0.6, 3, 0, [-120, -190], [48, -68], 0.1), 'flat');
  const wp = fig(k(-1, 0.1, 0.1, -2, 0, [-52, -78], [100, -140], 0.35), 'smile');
  const FT = 1470, HX = 305, WX = 800;
  const bx = (cx: number, top: number, ch: React.ReactNode) => ch;
  return <g transform={`translate(540 960) scale(${zoom}) translate(-540 -960)`}>
    <rect x={-100} y={-100} width={1280} height={1260} fill="#6A55DE" />
    <circle cx={540} cy={900} r={800} fill={C.cream} opacity={0.12} />
    <circle cx={540} cy={900} r={520} fill={C.cream} opacity={0.1} />
    <Memphis x0={-50} y0={150} x1={1130} y1={1120} n={36} seed={31} op={0.8} t={t} />
    <rect x={-100} y={1150} width={1280} height={900} fill={C.lane} />
    <rect x={-100} y={1150} width={1280} height={16} fill={C.ink} /><rect x={-100} y={1166} width={1280} height={10} fill={C.lemon} />
    {[0, 1, 2, 3, 4, 5].map((i) => <path key={i} d={`M ${540 + (i - 2.5) * 120} 1176 L ${540 + (i - 2.5) * 420} 1920`} stroke={C.laneLine} strokeWidth={6} />)}
    <Monitor x={275} y={480} lane={7} cells={b.his} t={t} score="1" />
    <Monitor x={805} y={480} lane={8} cells={b.hers} t={t} score="1" xMark={1} />
    {/* his blinking cursor: block in the first cell */}
    <rect x={275 - 260 + 28 + 9} y={480 + 64 + 14} width={30} height={60} rx={4} fill={C.orange} opacity={curOn ? 0.95 : 0} />
    <Figure kind="her" x={WX} y={FT} p={wp} t={t} scale={1.5} items={<Ball x={104} y={-160} r={36} color={C.violet} spin={t * 0} shadow={false} />} />
    <Figure kind="him" x={HX} y={FT} p={hp} t={t} scale={1.5} pocket={false} items={<g transform={`translate(${-120 + sh * 0.5} ${-262 + sh * 0.3}) rotate(${-8 + sh})`}>
      <Phone x={0} y={0} t={t} flick={false} glow={buzzOn ? 1.6 : 0.8} />
    </g>} />
    {/* buzz lines around the phone (global) */}
    {[0, 1, 2].map((i) => <g key={i} stroke={C.cream} strokeWidth={9} strokeLinecap="round" fill="none" opacity={buzzOn ? 0.95 - i * 0.2 : 0}>
      <path d={`M ${52 - i * 30} 1030 q -26 50 0 100`} /><path d={`M ${250 + i * 30} 1030 q 26 50 0 100`} />
    </g>)}
    <rect x={-100} y={1150} width={1280} height={0} />
  </g>;
};

// ------------------------------------------------------------------------------------------ the bay
const Bay: React.FC<{t: number}> = ({t}) => {
  const tp = t >= B.freeze && t < B.wipe3 ? B.freeze : t;
  const cam = camAt(CAM, tp);
  const hp = himPose(tp), wp = herPose(tp);
  const b = boards(t);
  const monCells = {his: b.his, hers: b.hers};
  const pins7 = Array.from({length: 10}, () => !(t >= B.hit2) || t < B.bay4 ? true : false).map((_, i) => !(t >= B.bay4 && t >= B.hit2) );
  const pins8 = Array.from({length: 10}, () => t < B.herHit || t < B.wipe3 ? true : false).map(() => !(t >= B.herHit));
  // phone: flicks in take 1 once he looks down; powers off in take 2
  const off = t >= B.phoneOff;
  const p1 = smooth(t, B.phoneOff, B.phoneOff + 0.3), p2 = smooth(t, B.phoneOff + 0.3, B.phoneOff + 0.6);
  const phoneX = lerp(hp.a1[0] + lerp(0, 14, p1), 0, p2), phoneY = lerp(hp.a1[1] - lerp(98, 55, p1), 80, p2);
  const phoneVis = tp < B.phoneOff + 0.62 || t >= 99;
  const flick = tp >= 4.95 && tp < 8.0;
  const him = <g>
    {phoneVis && <g clipPath={t > B.phoneOff + 0.1 ? 'url(#pocketClip2)' : undefined}>
      <g transform={`translate(${phoneX} ${phoneY}) rotate(${lerp(-8, 0, p1)}) scale(1.35)`}>
        <Phone x={0} y={0} t={t} flick={flick} glow={off ? 0 : 1} />
        {off && <rect x={-46} y={-86} width={92} height={172} rx={15} fill="#0A0914" opacity={smooth(t, B.phoneOff, B.phoneOff + 0.1)} />}
      </g>
    </g>}
    {off && t < B.phoneOff + 0.8 && (() => { const a = t - B.phoneOff, s = a < 0.15 ? 0.6 + 2 * a : 0.9; return <g transform={`translate(-185 -300) scale(${s}) rotate(-6)`} opacity={1 - smooth(a, 0.6, 0.8)}>
      <rect x={-72} y={-34} width={144} height={68} rx={16} fill={C.ink} stroke={C.lemon} strokeWidth={6} />
      <text x={0} y={22} textAnchor="middle" fontFamily={BAR} fontWeight={800} fontSize={58} letterSpacing={3} fill={C.cream}>OFF</text>
    </g>; })()}
  </g>;
  const herItems = t >= B.herSwing ? null : <Ball x={80} y={-88} r={36} color={C.violet} spin={0} shadow={false} />;
  const typing1 = typeAt(t, B.type1), typing2 = typeAt(t, B.type2);
  const ty = typing1 >= 0 ? typing1 : typing2, tseq = typing1 >= 0 ? SEQ1 : SEQ2, tch = typing1 >= 0 ? CH1 : CH2;
  // block cursor in his box while it is empty / being typed
  const cursorN = t < B.type1 ? 0 : t < B.type1 + 1.0 ? Math.min(7, Math.floor((t - B.type1) / 0.14) + 1) : t >= 8.0 && t < B.type2 ? 0 : t >= B.type2 && t < B.type2 + 1.0 ? Math.min(7, Math.floor((t - B.type2) / 0.14) + 1) : -1;
  const curOn = Math.floor(t * 3) % 2 === 0;
  const hi5 = t >= B.contact ? t - B.contact : -1;
  return <>
    <g transform={planeT(cam, 0.8)}><Wall t={t} /><rect x={-500} y={-500} width={2080} height={1320} fill="#B9A8FF" opacity={0.22} /></g>
    <g transform={planeT(cam, 0.9)}>
      <Monitor x={280} y={MON_Y} lane={7} cells={monCells.his} t={t} ring={b.ring} score={b.hisScore} scorePop={b.hisPop} xMark={b.hisX} />
      <Monitor x={800} y={MON_Y} lane={8} cells={monCells.hers} t={t} score="1" xMark={1} scorePop={b.herPop} />
      {cursorN >= 0 && cursorN < 7 + (t < 8 ? 0 : 0) && <rect x={280 - 260 + 28 + 9 + cursorN * 52} y={MON_Y + 64 + 14} width={30} height={60} rx={4} fill={C.orange} opacity={curOn ? 0.95 : 0} />}
    </g>
    <g transform={planeT(cam, 1)}>
      <defs><clipPath id="pocketClip2"><rect x={-300} y={-500} width={600} height={392} /></clipPath></defs>
      <Carpet t={t} /><rect x={-500} y={780} width={2080} height={1500} fill="#8D7BE0" opacity={0.25} />
      <LanesBg t={t} pins7={pins7} pins8={pins8} />
      <Keypad x={470} y={1000} lit={ty >= 0 ? tseq[ty] : -1} />
            <ReturnHump lemon={1} violet={t >= B.herHit ? 1 : 0} />
      <StarPop age={hi5} x={542} y={890} />
      <Figure kind="him" x={HIM_X} y={FEET} p={hp} t={tp} items={him} />
      <Figure kind="her" x={HER_X} y={FEET} p={wp} t={tp} items={herItems} />
    </g>
    {t >= B.bay4 && t < 19.5 && <Confetti age={t - B.hit2} />}
  </>;
};

// ------------------------------------------------------------------------------------------ down-the-lane shots
const LVP = 700, hwAt = (y: number) => 430 * (y - LVP) / 550, sAt = (y: number) => (y - LVP) / 550;
const LROWS: [number, number[]][] = [[880, [-0.87, -0.29, 0.29, 0.87]], [905, [-0.58, 0, 0.58]], [930, [-0.29, 0.29]], [955, [0]]];
const lx = (y: number, v: number) => 540 + v * hwAt(y);
const lPoly = (y0: number, y1: number, v0: number, v1: number) => `M ${lx(y0, v0)} ${y0} L ${lx(y0, v1)} ${y0} L ${lx(y1, v1)} ${y1} L ${lx(y1, v0)} ${y1} Z`;

type LM = {who: 'him' | 'her'; color: string; swing: [number, number, number, number]; roll: [number, number]; vAt: (u: number) => number; slow?: boolean; hit?: {at: number; kind: 'spare' | 'strike' | 'her'}; rewind?: boolean; zoom: [number, number]};
const MODES: Record<string, LM> = {
  rew: {who: 'him', color: C.lemon, swing: [99, 99, 99, 99], roll: [B.rewind, 8.0], vAt: (u) => -0.3 * u, zoom: [99, 100], rewind: true},
  spare: {who: 'him', color: C.lemon, swing: [B.bowl1, B.bowl1 + 0.1, B.bowl1 + 0.25, 10.75], roll: [10.75, B.hit1], vAt: (u) => -0.35 + 0.35 * smooth(u, 0.2, 0.9), zoom: [10.9, 11.4], hit: {at: B.hit1, kind: 'spare'}},
  her: {who: 'her', color: C.violet, swing: [B.herSwing, B.herSwing + 0.1, B.herSwing + 0.22, 13.05], roll: [13.05, B.herHit], vAt: (u) => -0.3 + 0.3 * smooth(u, 0.1, 0.8), zoom: [13.2, 13.5], hit: {at: B.herHit, kind: 'her'}},
  strike: {who: 'him', color: C.lemon, swing: [B.hisSwing, B.hisSwing + 0.1, B.hisSwing + 0.22, 14.75], roll: [14.75, B.hit2], vAt: (u) => -0.3 + 0.3 * smooth(u, 0.1, 0.9), slow: true, zoom: [14.95, 15.7], hit: {at: B.hit2, kind: 'strike'}},
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
  const rolling = md.rewind ? t >= md.roll[0] && t < md.roll[1] : t >= rel && !(md.hit && hit > 0.05);
  const pins = LROWS.flatMap(([y, vs]) => vs.map((v) => ({y, x: lx(y, v)})));
  const hand = t < s1 ? track([[s0, [78, -66]], [s1, [120, -30]]], t) : track([[s1, [120, -30]], [s2, [92, -112]]], t);
  const ballInHand = md.rewind ? t >= md.roll[1] - 0.02 : t < rel;
  const trail = rolling ? Array.from({length: 7}, (_, i) => { const tu = md.rewind ? clamp(u + i * 0.05) : clamp(u - i * 0.05); if (tu <= 0 || tu >= 1.001) return null; const y2 = lerp(1330, 905, P(tu)); return {x: lx(y2, md.vAt(tu)), y: y2, r: 80 * sAt(y2), i}; }) : [];
  const stance: Pose = {lx: 0, ly: 0, brow: 0, tilt: 0, dy: 0, a1: [-70, -52], a2: [hand[0], hand[1]], mouth: 'flat'};
  const strikeOn = md.hit && hit > 0.03;
  const kind = md.hit?.kind;
  const shake = md.hit && hit > 0 && hit < 0.4 && kind !== 'her' ? Math.sin(t * 90) * 9 * (1 - hit / 0.4) : 0;
  const lane = md.who === 'him' ? 7 : 8;
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
        const delayed = kind === 'spare' && (i === 0 || i === 3);
        if (md.rewind) {
          const tau = 0.36 * (1 - smooth(raw, 0.05, 0.9)), vx = ((i * 97) % 11 - 5) * 70, vy = -160 - ((i * 53) % 7) * 70;
          return <g key={i}><Pin x={p.x + vx * tau} y={p.y + 6 - 60 * (tau > 0 ? 1 : 0) * (tau / 0.36) + vy * tau + 900 * tau * tau} s={sAt(p.y) * 1.2} rot={tau * (i % 2 ? 900 : -800)} /></g>;
        }
        if (!md.hit || hit <= 0.03) return <Pin key={i} x={p.x} y={p.y + 6} s={sAt(p.y) * 1.2} />;
        if (delayed) {
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
      <Monitor x={540} y={MON_Y} lane={lane} cells={md.who === 'him' ? b.his : b.hers} t={t} ring={md.who === 'him' && !md.hit ? b.ring : null}
        score={md.who === 'him' ? b.hisScore : '1'} scorePop={md.who === 'him' ? b.hisPop : b.herPop} xMark={md.who === 'him' ? b.hisX : 1} />
    </g>
    {md.rewind && t > md.roll[0] && t < md.roll[1] && <g stroke={C.cream} strokeWidth={5} strokeLinecap="round" opacity={0.35}>
      {Array.from({length: 12}, (_, i) => { const a = (i / 12) * Math.PI * 2, kk = 1 - ((t * 5 + i * 0.37) % 1); return <path key={i} d={`M ${540 + Math.cos(a) * (240 + kk * 600)} ${1000 + Math.sin(a) * (240 + kk * 600)} L ${540 + Math.cos(a) * (330 + kk * 700)} ${1000 + Math.sin(a) * (330 + kk * 700)}`} />; })}
    </g>}
    {kind === 'strike' && hit > 0 && hit < 0.12 && <rect x={0} y={0} width={1080} height={1920} fill="#fff" opacity={0.55 * (1 - hit / 0.12)} />}
    {strikeOn && (kind === 'strike' || kind === 'spare') && <g transform={`translate(540 1130) rotate(-7) scale(${(kind === 'strike' ? 0.3 : 0.25) + (kind === 'strike' ? 0.7 : 0.6) * smooth(hit, 0.03, 0.15)})`}>
      <path d={Array.from({length: 24}, (_, i) => { const a = i / 24 * Math.PI * 2, r = i % 2 ? 175 : 235; return `${i ? 'L' : 'M'} ${Math.cos(a) * r * 1.35} ${Math.sin(a) * r * 0.62}`; }).join(' ') + ' Z'} fill={kind === 'strike' ? C.lemon : C.mint} stroke={C.ink} strokeWidth={8} strokeLinejoin="round" />
      <text x={0} y={kind === 'strike' ? 34 : 30} textAnchor="middle" fontFamily={NUN} fontWeight={900} fontSize={kind === 'strike' ? 104 : 92} fill={kind === 'strike' ? C.orange : C.violet} stroke={C.ink} strokeWidth={9} paintOrder="stroke">{kind === 'strike' ? 'STRIKE!' : 'SPARE!'}</text>
    </g>}
    {kind === 'strike' && <Confetti age={hit} />}
  </g>;
};

// ------------------------------------------------------------------------------------------ the vote
const Card: React.FC<{k: 'A' | 'B'; text: string; y: number; age: number; tint: string; pulse: number}> = ({k: kk, text, y, age, tint, pulse}) => {
  if (age < 0) return null;
  const pop = age < 0.28 ? 1 + 0.12 * Math.sin(Math.min(1, age / 0.28) * Math.PI) - 0.25 * (1 - smooth(age, 0, 0.12)) : 1;
  const cells: Cell[] = Array.from({length: 11}, (_, i) => ({ch: text[i] ?? ' ', prev: ' ', flipAt: -1e9, color: C.cream, instant: true}));
  return <g transform={`translate(540 ${y + 85}) scale(${pop + pulse * 0.025}) translate(-540 ${-(y + 85)})`}>
    <rect x={50} y={y + 12} width={980} height={170} rx={28} fill={C.ink} />
    <rect x={40} y={y} width={980} height={170} rx={28} fill={C.violet} stroke={C.ink} strokeWidth={6} />
    <circle cx={112} cy={y + 85} r={52} fill={tint} stroke={C.ink} strokeWidth={6} />
    <text x={112} y={y + 85 + 26} textAnchor="middle" fontFamily={NUN} fontWeight={900} fontSize={76} fill={C.ink}>{kk}</text>
    <g transform={`translate(190 ${y + 22})`}><NameCells cells={cells} t={age} w={62} h={126} gap={5} font={104} bg="#0E0C1C" /></g>
  </g>;
};
const KeysScene: React.FC<{t: number}> = ({t}) => {
  const cur = Math.floor(t * 2) % 2 === 0;
  const tap = t - B.tap;
  const pulse = (a: number) => Math.max(0, 1 - Math.abs(t - a) / 0.25);
  const thumb = {x: 800 + Math.sin(t * 1.4) * 22, y: 1180 + Math.sin(t * 2.1) * 10 - 6 * smooth(tap, 0, 0.1) * (tap > 0 ? 1 : 0)};
  const emptyCells: Cell[] = Array.from({length: 9}, () => ({ch: ' ', prev: ' ', flipAt: -1e9, color: C.orange}));
  return <g>
    <rect x={0} y={0} width={1080} height={1920} fill="#4B3E9C" />
    <Memphis x0={-50} y0={200} x1={1130} y1={1500} n={40} seed={12} op={0.7} t={t} />
    <g>
      <rect x={36} y={600} width={1008} height={176} rx={30} fill={C.ink} transform="translate(10 12)" />
      <rect x={36} y={600} width={1008} height={176} rx={30} fill={C.violet} stroke={C.ink} strokeWidth={6} />
      <rect x={52} y={614} width={976} height={148} rx={20} fill="#0A0818" />
      <g transform="translate(62 627)"><NameCells cells={emptyCells} t={t} w={100} h={124} gap={8} font={112} bg="#201B48" /></g>
      <rect x={62 + 28} y={627 + 22} width={44} height={80} rx={6} fill={C.orange} opacity={cur ? 0.9 : 0} />
    </g>
    <Card k="A" text={spec.choices.A.l1} y={795} age={t - B.cardA} tint={C.orange} pulse={pulse(B.tap) + pulse(B.tap + 1)} />
    <Card k="B" text={spec.choices.B.l1} y={985} age={t - B.cardB} tint={C.teal} pulse={pulse(B.tap + 0.5) + pulse(B.tap + 1.5)} />
    <g>
      {Array.from({length: 5}, (_, i) => <g key={i} transform={`translate(${400 + i * 110} 1205)`}><circle r={36} fill={C.ink} /><circle r={30} fill={i === 2 && tap > 0 && tap < 0.15 ? C.orange : C.cream} stroke={C.ink} strokeWidth={4} /></g>)}
      <g transform={`translate(${thumb.x} ${thumb.y}) rotate(-24)`}><rect x={-34} y={-70} width={68} height={190} rx={34} fill={C.skinHim} stroke={C.ink} strokeWidth={7} /><ellipse cx={0} cy={-42} rx={20} ry={14} fill="#fff" opacity={0.35} /></g>
    </g>
  </g>;
};

const EndCard: React.FC<{t: number}> = ({t}) => {
  const a = t - B.endcard;
  const kk = smooth(a, 0, 0.25);
  const pop = a < 0.3 ? 1 + 0.15 * (1 - a / 0.3) : 1;
  const mk = (txt: string, y: number, big = true) => <g transform={`translate(540 ${y}) scale(${pop}) translate(-540 ${-y})`}>
    <rect x={64} y={y - 100} width={960} height={190} rx={34} fill={C.ink} transform="translate(12 14)" />
    <rect x={64} y={y - 100} width={960} height={190} rx={34} fill={big ? C.lemon : C.cream} stroke={C.ink} strokeWidth={7} />
    <text x={544} y={y + 50} textAnchor="middle" fontFamily={NUN} fontWeight={900} fontSize={big ? 130 : 120} fill={C.ink}>{txt}</text>
  </g>;
  return <g opacity={kk}>
    <rect x={0} y={0} width={1080} height={1920} fill={C.cream} />
    <Memphis x0={-50} y0={150} x1={1130} y1={1700} n={46} seed={21} op={0.9} t={t} />
    {mk('lane 8 · part 3', 480)}
    {mk('A or B', 740, false)}
    <text x={540} y={885} textAnchor="middle" fontFamily={NUN} fontWeight={900} fontSize={62} fill={C.ink}>loser buys fries</text>
    <g transform="translate(0 20)">
      {[['A', 'LET YOU WIN', C.orange, 920], ['B', 'DEAL', C.teal, 1100]].map(([ky, tx, col, y]) => <g key={ky as string} opacity={smooth(a, 0.3, 0.55)}>
        <rect x={110} y={(y as number) - 10} width={870} height={150} rx={26} fill={C.ink} transform="translate(8 10)" />
        <rect x={110} y={(y as number) - 10} width={870} height={150} rx={26} fill={C.violet} stroke={C.ink} strokeWidth={6} />
        <circle cx={185} cy={(y as number) + 65} r={44} fill={col as string} stroke={C.ink} strokeWidth={6} />
        <text x={185} y={(y as number) + 90} textAnchor="middle" fontFamily={NUN} fontWeight={900} fontSize={64} fill={C.ink}>{ky}</text>
        <text x={260} y={(y as number) + 98} fontFamily={BAR} fontWeight={800} fontSize={104} letterSpacing={6} fill={C.cream}>{tx}</text>
      </g>)}
    </g>
  </g>;
};

// ------------------------------------------------------------------------------------------ the edit
const WIPES = [B.wipe1, B.wipe2, B.wipe3, B.wipe4];
type Shot = 'hook' | 'bay' | 'rew' | 'spare' | 'her' | 'strike' | 'keys' | 'end';
const shotAt = (t: number): Shot => {
  if (t < B.wipe1) return 'hook';
  if (t < B.wipe2) return 'bay';
  if (t < B.wipe3) return 'rew';
  if (t < B.bowl1) return 'bay';
  if (t < B.bay2) return 'spare';
  if (t < B.herSwing) return 'bay';
  if (t < B.bay3) return 'her';
  if (t < B.hisSwing) return 'bay';
  if (t < B.bay4) return 'strike';
  if (t < B.wipe4) return 'bay';
  if (t < B.endcard) return 'keys';
  return 'end';
};
const renderShot = (s: Shot, t: number): React.ReactNode => {
  switch (s) {
    case 'hook': return <HookShot t={t} />;
    case 'bay': return <Bay t={t} />;
    case 'rew': return <LaneShot t={t} m="rew" />;
    case 'spare': return <LaneShot t={t} m="spare" />;
    case 'her': return <LaneShot t={t} m="her" />;
    case 'strike': return <LaneShot t={t} m="strike" />;
    case 'keys': return <KeysScene t={t} />;
    default: return <EndCard t={t} />;
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
        {t < B.wipe1 && <Strip text={(spec.hooks as Record<string, string>)[hook]} y={345} age={t + 1} out={smooth(t, 2.85, 3.0)} size={56} maxW={960} />}
        {t >= 7.0 && t < 8.2 && <g opacity={smooth(t, 7.0, 7.1) * (1 - smooth(t, 8.08, 8.2))}>
          {[0, 1].map((i) => <path key={i} d={`M ${322 - i * 62} 345 L ${322 - i * 62 + 56} 306 L ${322 - i * 62 + 56} 384 Z`} fill={C.lemon} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />)}
        </g>}
        {spec.strips.map((s, i) => {
          if (t < s.from || t >= s.to) return null;
          const comment = s.text.startsWith('comment');
          return <Strip key={i} text={s.text} y={comment ? 520 : 345} age={t - s.from + 0.06} out={smooth(t, s.to - 0.12, s.to)} size={comment ? 80 : 58} rot={i % 2 ? 0.8 : -0.8} hue={(s as {tag?: boolean}).tag ? 'ink' : 'lemon'} />;
        })}
      </svg>
    </AbsoluteFill>
  </>;
};

export const Lane2: React.FC<{hook?: Hook}> = ({hook = 'a'}) => (
  <AbsoluteFill style={{background: C.wall}}>
    <Audio src={staticFile('audio/lane-ep2-room.wav')} volume={0.5} />
    <Audio src={staticFile('audio/lane-ep2-music.wav')} volume={0.75} />
    <Audio src={staticFile('audio/lane-ep2-sfx.wav')} volume={0.9} />
    <Scene hook={hook} />
  </AbsoluteFill>
);
