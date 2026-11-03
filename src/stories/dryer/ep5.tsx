import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, hold, lerp, smooth} from '../../lib/motion';
import {Dryers, Face, Floor, Guy, Hands, Riso, STAMP, Sock, Strip, TOP, Wall, camAt, handsAt, planeT, useInk} from './world';
import {Board, Card, CloseUp, EndCard, NightCard, RewindDrum, Sheet, SlapNote} from './parts';
import spec from '../../../specs/stories/dryer-ep5.json';

// The Dryer Notes, part 5. A first: he leaves his number; she likes the notes better ("phones feel
// loud.") and he's left holding a dark phone. Rewind. B: "thursday, 9pm? I'll be at dryer 4." She says
// yes. Thursday: he's early with the sock, the wall clock runs 9:00 to 9:40, and dryer 5 stays empty.

export const DRYER5_FPS = 60;
export const DRYER5_FRAMES = Math.ceil(spec.duration * DRYER5_FPS);
const B = spec.beats;
const HX = 640, HY = 1520;                     // he stands between dryers 4 and 5
const D5 = [780 - HX, TOP - 40 - HY];          // the top of dryer 5, relative to his feet

/** During the rewind the world plays backwards from `rewind` to `aIn`. */
const worldTime = (t: number) => t >= B.rewind && t < B.drum ? lerp(B.rewind, B.aIn, smooth(t, B.rewind, B.drum)) : t;

const CAM: [number, number, number, number][] = [
  [0, 560, 1040, 1.2], [B.aIn, 560, 1040, 1.2], [B.aPlace, 700, 950, 1.5], [6.0, 680, 960, 1.45], [B.aSad, 660, 960, 1.65], [B.phone, 660, 900, 1.8],
  [B.rewind, 640, 1160, 1.1], [B.bIn, 560, 1040, 1.2], [B.bPlace, 700, 950, 1.5], [B.bShow, 650, 980, 1.7], [B.bNight, 650, 980, 1.75],
  [B.bGrin, 650, 990, 1.55], [B.pump, 650, 900, 1.75], [B.thursday, 650, 900, 1.75], [B.clock, 860, 720, 1.0], [B.empty - 0.2, 860, 720, 1.02], [B.empty + 0.8, 840, 1000, 1.9], [48, 840, 1000, 1.95],
];

const relaxed: Hands = [-110, -310, 110, -310];
const HANDS_A: [number, Hands][] = [
  [0, [-90, -340, 90, -430]], [B.aPlace - 0.3, [-90, -340, D5[0], D5[1] + 30]], [B.aPlace + 0.5, relaxed], [B.aSad - 0.2, [-110, -310, 40, -500]],
];
const HANDS_B: [number, Hands][] = [
  [0, [-90, -340, 90, -430]], [B.bPlace - 0.3, [-90, -340, D5[0], D5[1] + 30]], [B.bPlace + 0.4, relaxed], [B.bShow, [-130, -380, 20, -500]],
  [B.bShow + 1.1, relaxed], [B.bGrin - 0.2, [-110, -310, 40, -520]], [B.pump, [-110, -310, 120, -880]], [B.pump + 0.9, [-110, -310, 40, -520]],
];

const faceA = (t: number): Face => {
  if (t < B.aPlace) return {look: 0.7, mouth: 'smile', brows: 0.3, tilt: 0};
  if (t < B.aSad) return {look: 0, mouth: 'smile', brows: 0.5, tilt: -4};
  return {look: 0.15, mouth: 'wince', brows: -0.5, tilt: 8, blush: 0.8};
};
const faceB = (t: number): Face => {
  if (t < B.bShow) return {look: 0.7, mouth: 'smile', brows: 0.3, tilt: 0};
  if (t < B.bGrin) return {look: 0, mouth: 'grin', brows: 0.6, tilt: -5, blush: 0.6};
  return {look: 0, mouth: 'grin', brows: 0.8, tilt: -6, blush: 1};
};

/** A small note in the world (on a dryer top, or in his hand). */
const MiniNote: React.FC<{x: number; y: number; rot?: number; pink?: boolean}> = ({x, y, rot = -6, pink}) => {
  const {ink} = useInk();
  return <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    <rect x={-70} y={-24} width={140} height={48} fill={ink('w')} stroke={ink(pink ? 'p35' : 'b35')} strokeWidth={3} />
    {[0, 1].map((k) => <rect key={k} x={-52} y={-10 + k * 16} width={k ? 70 : 100} height={5} fill={ink(pink ? 'p' : 'b')} />)}
  </g>;
};

/** Thursday: the wall clock, in minutes after 8pm, held so each strip reads true: 8:50 early, 9:20, then 9:40. */
const CLOCK: [number, number][] = [[B.clock, 50], [28.2, 55], [28.9, 80], [30.6, 82], [31.2, 100]];
const clockAt = (t: number): [number, number] => {
  let m = CLOCK[0][1];
  for (let k = 1; k < CLOCK.length; k++) if (t > CLOCK[k - 1][0]) m = lerp(CLOCK[k - 1][1], CLOCK[k][1], clamp((t - CLOCK[k - 1][0]) / (CLOCK[k][0] - CLOCK[k - 1][0])));
  const r = Math.round(m / 5) * 5;
  return [8 + Math.floor(r / 60), r % 60];
};

/** His phone, screen dark. */
const DarkPhone: React.FC<{x: number; y: number}> = ({x, y}) => {
  const {ink} = useInk();
  return <g transform={`translate(${x} ${y}) rotate(-8)`}>
    <rect x={-44} y={-80} width={88} height={160} rx={14} fill={ink('b')} />
    <rect x={-34} y={-66} width={68} height={128} rx={6} fill={ink('bp70')} />
    <path d="M -24 -50 l 30 0" stroke={ink('w')} strokeWidth={5} strokeLinecap="round" opacity={0.6} />
  </g>;
};

const THU_HANDS: Hands = [-110, -310, 50, -440];

const World: React.FC<{t: number}> = ({t}) => {
  const thu = t >= B.thursday;
  if (thu) {
    // Thursday, early. He holds the sock and keeps checking the door; by 9:40 his shoulders drop.
    const late = smooth(t, B.empty, B.empty + 0.6);
    const glance = Math.sin(t * 1.3) > 0.4 ? -0.6 : 0.5;
    const face: Face = late > 0.5 ? {look: 0.1, mouth: 'flat', brows: -0.5, tilt: 9} : {look: glance, mouth: 'flat', brows: 0.3, tilt: 0};
    return <g>
      <Dryers t={t} spin={[]} />
      <Guy x={HX} y={HY} hands={THU_HANDS} face={face} tee bob={6 * late} front={<Sock x={THU_HANDS[2]} y={THU_HANDS[3] - 20} rot={-20} s={0.6} />} />
    </g>;
  }
  const isB = t >= B.bIn;
  const t0 = isB ? B.bIn : B.aIn;
  const x = lerp(420, HX, smooth(t, t0, t0 + 0.9));
  const walking = t < t0 + 0.9;
  const hands = handsAt(isB ? HANDS_B.map(([k, h]) => [k === 0 ? B.bIn : k, h] as [number, Hands]) : HANDS_A, t);
  const face = isB ? faceB(t) : faceA(t);
  const placeAt = isB ? B.bPlace : B.aPlace;
  const placed = t >= placeAt;
  const night = t >= (isB ? B.bNight : B.aNight);
  const phone = !isB && t >= B.phone;
  return <g>
    <Dryers t={t} spin={[2, 6]} />
    {placed && !night && <MiniNote x={790} y={TOP - 30} />}
    <Guy x={x} y={HY} hands={hands} face={face} walk={walking ? x / 260 : 0} tee
      front={<>
        {!placed && <MiniNote x={hands[2]} y={hands[3] - 34} />}
        {night && !phone && <MiniNote x={hands[2]} y={hands[3] - 34} rot={8} pink />}
        {phone && <DarkPhone x={hands[2]} y={hands[3] - 50} />}
      </>} />
  </g>;
};

const C = spec.choices;
const CARDS: Card[] = [
  {letter: 'A', l1: C.A.l1, l2: C.A.l2, draw: C.A.draw, at: B.cardA},
  {letter: 'B', l1: C.B.l1, l2: C.B.l2, draw: C.B.draw, at: B.cardB},
];
const RECAP: Card[] = [
  {letter: 'A', l1: "here's my number,", l2: 'text me sometime.', draw: 'receipt', at: -1},
  {letter: 'B', l1: 'thursday, 9pm?', l2: "I'll be at dryer 4.", draw: 'clock', at: -1},
];

const Scene: React.FC<{t: number}> = ({t}) => {
  const tw = worldTime(t);
  const cam = camAt(CAM, tw);
  const strips = spec.strips as {text: string; from: number; to: number; y: number; spec?: string; big?: boolean}[];
  const show = (s: {from: number; to: number}) => hold(tw, s.from, s.from + 0.3, s.to - 0.3, s.to);
  return <>
    <g transform={planeT(cam, 0.85)}><Wall t={tw} hm={tw >= B.thursday ? clockAt(tw) : undefined} /></g>
    <g transform={planeT(cam, 1)}><Floor /><World t={tw} /></g>
    {!(t >= B.rewind && t < B.drum) && strips.filter((s) => !s.big && s.from > 0 && s.from < B.choice && !(s.from >= B.drum && s.from < B.bIn)).map((s, i) => <Strip key={i} text={s.text} y={s.y} k={show(s)} rot={i % 2 ? 1.2 : -1.5} size={56} spec={s.spec} />)}
    <CloseUp t={tw} a={B.aNote} z={B.aSad} lines={spec.aReply} />
    {strips.filter((s) => s.big).map((s, i) => <NightCard key={i} t={tw} a={s.from} z={s.to} text={s.text} />)}
    {/* The rewind. */}
    {t >= B.rewind && t < B.drum && <Strip text="rewinding..." y={330} k={1} size={64} spec="p" rot={-2} />}
    <RewindDrum t={t} a={B.drum} z={B.bIn} />
    {strips.filter((s) => s.from >= B.drum && s.from < B.bIn).map((s, i) => <Strip key={i} text={s.text} y={s.y} k={show(s)} size={50} spec={s.spec} />)}
    <CloseUp t={t} a={B.bNote} z={B.bGrin} lines={spec.bReply}
      extra={<g transform="translate(430 -340)"><Sock x={0} y={0} rot={24} s={0.75} /></g>} />
    <Board t={t} a={B.choice} z={B.endcard} question={spec.choices.question} cards={CARDS} commentAt={B.comment} />
    {/* Recap, over everything at the start: part 1's two replies, A picked to go first. */}
    <Board t={t} a={-1} z={B.aIn} cards={RECAP} pick={{letter: 'A', at: B.recapA}} />
    {strips.filter((s) => s.from < 0).map((s, i) => <Strip key={i} text={s.text} y={s.y} k={show(s)} rot={i ? 1.2 : -1.5} size={54} spec={s.spec} />)}
    <EndCard t={t} a={B.endcard} part={5} tease="part 6: dryer 5" />
    <StampMark t={t} />
  </>;
};

/** A "FIRST" stamp on card A in the recap. */
const StampMark: React.FC<{t: number}> = ({t}) => {
  const {ink} = useInk();
  const k = smooth(t, B.recapA, B.recapA + 0.15) * (1 - smooth(t, B.aIn - 0.3, B.aIn));
  if (k <= 0) return null;
  return <g transform={`translate(860 560) rotate(-12) scale(${1.4 - 0.4 * k})`} opacity={k}>
    <rect x={-120} y={-46} width={240} height={92} fill="none" stroke={ink('p')} strokeWidth={8} />
    <text y={24} textAnchor="middle" fontFamily={STAMP} fontWeight={700} fontSize={66} fill={ink('p')}>FIRST</text>
  </g>;
};

export const Dryer5: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const jolt = t >= B.rewind && t < B.bIn ? 1 : 0;
  return <AbsoluteFill>
    <Audio src={staticFile('audio/dryer-ep5-room.wav')} volume={0.6} />
    <Audio src={staticFile('audio/dryer-ep5-music.wav')} volume={0.8} />
    <Audio src={staticFile('audio/dryer-ep5-sfx.wav')} volume={0.9} />
    <Riso t={t} jolt={jolt}><Scene t={t} /></Riso>
  </AbsoluteFill>;
};
