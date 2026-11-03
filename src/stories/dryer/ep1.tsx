import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, hold, lerp, smooth, springIn} from '../../lib/motion';
import {Basket, Dryers, DrumDoor, Face, Floor, Guy, HER, HIM, Hands, Note, Riso, STAMP, Sock, Strip, TOP, Tee, Wall, camAt, handsAt, planeT, useInk} from './world';
import spec from '../../../specs/stories/dryer-ep1.json';

// The Dryer Notes, part 1. 11 PM at the laundromat: on top of dryer 4 he finds a pink tee, his red
// sock and a note from whoever uses dryer 5. His sock got into her wash; everything she owns is pink
// now. He laughs, takes out a pen, and the viewer votes on his reply: A or B.

export const DRYER1_FPS = 60;
export const DRYER1_FRAMES = Math.ceil(spec.duration * DRYER1_FPS);
const B = spec.beats;
const HX = 300, HY = 1520;           // where he stands, in front of dryer 3
const TOPX = 540 - HX, TOPY = TOP - 30 - HY;   // the top of dryer 4, relative to his feet

// Camera keys: [t, cx, cy, zoom]. Wide on the walk in, push to the dryer top, cut to the note,
// back on him with the tee, in close for the facepalm, tilt down to his basket, settle for the pen.
const CAM: [number, number, number, number][] = [
  [0, 340, 1040, 1.0], [3.3, 400, 1000, 1.15], [4.6, 440, 900, 1.45], [5.3, 460, 880, 1.6],
  [11.2, 360, 960, 1.35], [12.4, 330, 1010, 1.55], [14.6, 320, 980, 1.62], [15.2, 300, 930, 1.72], [16.7, 310, 930, 1.78],
  [17.3, 410, 1240, 1.22], [18.4, 320, 950, 1.7], [19.5, 320, 990, 1.42], [22.4, 330, 960, 1.6], [40, 330, 960, 1.6],
];

const relaxed: Hands = [-110, -310, 110, -310];
const HANDS: [number, Hands][] = [
  [0, [-90, -400, 90, -400]], [3.5, [-20, -230, 190, -230]], [3.95, relaxed],
  [4.3, [-110, -310, TOPX - 20, TOPY + 20]], [4.85, [-110, -310, 60, -520]], [11.2, relaxed],
  [11.55, [TOPX - 70, TOPY + 10, TOPX + 40, TOPY + 10]], [12.0, [-150, -560, 150, -560]], [14.7, [TOPX - 70, TOPY + 10, TOPX + 40, TOPY + 10]],
  [15.0, [-110, -310, 0, -690]], [B.facepalmEnd, relaxed], [B.pen, [-70, -470, 30, -640]],
];

const faceAt = (t: number): Face => {
  if (t < B.arrive) return {look: 0.6, mouth: 'flat', brows: 0, tilt: 0};
  if (t < B.pick) return {look: 1, mouth: 'o', brows: 0.8, tilt: -3};
  if (t < B.unfold) return {look: 0.3, mouth: 'flat', brows: 0.4, tilt: 8};
  if (t < B.shirtNote) return {look: 0, mouth: 'o', brows: 1, tilt: 0};
  if (t < B.facepalmEnd) return {look: 0, mouth: 'wince', brows: 1, tilt: t > B.facepalm ? 10 : 0};
  if (t < B.grin) return {look: 1, mouth: 'flat', brows: 0.3, tilt: 12};
  if (t < B.pen) return {look: 0, mouth: 'grin', brows: 0.6, tilt: -4, blush: 1};
  return {look: -0.6, mouth: t > B.pen + 1.6 ? 'smile' : 'flat', brows: 0.5, tilt: -6};
};

/** His stuff and hers: the folded pink tee, her note and the sock on top of dryer 4, then in his hands. */
const World: React.FC<{t: number}> = ({t}) => {
  const {ink} = useInk();
  const walkU = clamp(t / B.arrive);
  const x = lerp(-60, HX, walkU);
  const walking = t < B.arrive;
  const hands = handsAt(HANDS, t);
  const face = faceAt(t);
  // The basket: carried, then set down beside him.
  const setK = smooth(t, B.set - 0.2, B.set + 0.15);
  const basketCarry = <g transform={`translate(${lerp(0, 220, setK)} ${lerp(-330, 0, setK)})`}><Basket x={0} y={0} s={0.85} /></g>;
  // The tee: folded on the dryer, held open from `unfold`, back on the dryer for the facepalm.
  const teeUp = smooth(t, B.unfold, B.unfold + 0.45) * (1 - smooth(t, 14.6, 15.0));
  const teeK = smooth(t, B.unfold + 0.2, B.unfold + 0.7) * (1 - smooth(t, 14.5, 14.9));
  const teeX = lerp(TOPX - 10, 0, teeUp), teeY = lerp(TOPY + 30, -470, teeUp);
  const teeOpen = teeUp > 0.01 ? <g transform={`translate(${teeX} ${teeY + 20 * springIn(t, B.unfold + 0.45, 0.4) * 0})`}>
    <Tee k={teeK} />
    {t > B.shirtNote - 0.3 && <g transform={`translate(-10 ${lerp(20, 30, teeK)}) rotate(-6) scale(${smooth(t, B.shirtNote - 0.3, B.shirtNote)})`}>
      <rect x={-150} y={-38} width={300} height={76} fill={ink('w')} stroke={ink('b35')} strokeWidth={3} />
      <circle cx={-134} cy={-26} r={6} fill={ink('bp')} />
      <text y={14} textAnchor="middle" fontFamily={HER} fontWeight={700} fontSize={38} fill={ink('b')}>{spec.shirtNote}</text>
    </g>}
  </g> : null;
  const noteInHand = t > B.pick && t < B.closeOut;
  const noteOnTop = t <= B.pick;
  return <g>
    <Dryers t={t} spin={[2, 6]} />
    {/* On top of dryer 4: the folded tee, the note, the sock. */}
    {teeUp <= 0.01 && <g transform={`translate(${540 - 10} ${TOP - 30 + 30})`}><Tee k={0} /></g>}
    {noteOnTop && <g transform={`translate(560 ${TOP - 62}) rotate(-8)`}>
      <rect x={-70} y={-24} width={140} height={48} fill={ink('w')} stroke={ink('b35')} strokeWidth={3} />
      {[0, 1].map((k) => <rect key={k} x={-52} y={-10 + k * 16} width={k ? 70 : 100} height={5} fill={ink('b')} />)}
      <Sock x={80} y={-10} rot={-60} s={0.35} />
    </g>}
    <rect x={-700} y={1480} width={2600} height={0} fill="none" />
    {t >= B.set + 0.15 && <Basket x={HX + 220} y={HY} s={0.85} />}
    <Guy x={x} y={HY} hands={hands} face={face} walk={walking ? x / 260 : 0}
      held={teeOpen}
      front={<>
        {t < B.set + 0.15 && basketCarry}
        {noteInHand && <g transform={`translate(${hands[2]} ${hands[3] - 30}) rotate(-8)`}>
          <rect x={-70} y={-24} width={140} height={48} fill={ink('w')} stroke={ink('b35')} strokeWidth={3} />
          {[0, 1].map((k) => <rect key={k} x={-52} y={-10 + k * 16} width={k ? 70 : 100} height={5} fill={ink('b')} />)}
          <Sock x={80} y={-10} rot={-60} s={0.35} />
        </g>}
        {t > B.pen - 0.2 && <g transform={`translate(${hands[0] + 10} ${hands[1] - 40}) rotate(8)`}>
          <rect x={-60} y={-80} width={120} height={160} fill={ink('w')} stroke={ink('b35')} strokeWidth={3} />
          {[0, 1, 2, 3, 4].map((k) => <rect key={k} x={-44} y={-60 + k * 22} width={k % 2 ? 60 : 88} height={4} fill={ink('b35')} />)}
        </g>}
        {t > B.pen && <rect x={hands[2] - 6} y={hands[3] - 70} width={12} height={70} rx={4} fill={ink('bp')} transform={`rotate(-20 ${hands[2]} ${hands[3]})`} />}
      </>} />
  </g>;
};

/** Foreground: the folding table, closer to camera, with a detergent jug and a lost sock. */
const Fore: React.FC = () => {
  const {ink} = useInk();
  return <g>
    <rect x={-400} y={1790} width={1300} height={40} fill={ink('b')} />
    <rect x={-400} y={1830} width={1300} height={300} fill={ink('b20')} />
    <g transform="translate(780 1790)">
      <path d="M -60 0 L -60 -150 Q -60 -180 -30 -180 L 40 -180 Q 60 -180 60 -150 L 60 0 Z" fill={ink('p')} stroke={ink('bp')} strokeWidth={5} />
      <rect x={-40} y={-210} width={50} height={34} fill={ink('bp')} />
      <rect x={-44} y={-120} width={88} height={60} fill={ink('w')} />
      <text x={0} y={-80} textAnchor="middle" fontFamily={STAMP} fontWeight={700} fontSize={30} fill={ink('b')}>SUDS</text>
    </g>
  </g>;
};

/** Close-up: her note, big enough to read, with the sock taped on. */
const CloseNote: React.FC<{t: number}> = ({t}) => {
  const {ink} = useInk();
  const inK = smooth(t, B.closeIn, B.closeIn + 0.4), outK = smooth(t, B.closeOut - 0.35, B.closeOut);
  if (inK <= 0 || outK >= 1) return null;
  const y = lerp(1500, 0, inK) + lerp(0, 1700, outK);
  const drift = (t - B.closeIn) * 6;
  const lines = spec.note1.lines;
  return <g transform={`translate(0 ${y})`}>
    <rect x={-20} y={-20} width={1120} height={1960} fill={ink('b10')} />
    <g transform="translate(540 1500) rotate(4)"><Tee k={1} /></g>
    <g transform={`translate(540 ${960 - drift}) rotate(${-2 + drift * 0.05}) scale(${1 + drift * 0.004})`}>
      <Note t={t} lines={lines} w={980} h={660} font={HER} size={76} tape={false} />
      <g transform="translate(340 -320)"><Sock x={0} y={0} rot={24} s={1.1} /></g>
      <rect x={300} y={-370} width={170} height={50} fill={ink('p20', true)} transform="rotate(30 330 -320)" />
      <rect x={-460} y={-340} width={150} height={48} fill={ink('p20', true)} transform="rotate(-12 -340 -290)" />
    </g>
  </g>;
};

/** The vote: two notes he might leave, A and B. */
const Choice: React.FC<{t: number}> = ({t}) => {
  const {ink} = useInk();
  const inK = smooth(t, B.choice, B.choice + 0.45), outK = smooth(t, B.endcard - 0.3, B.endcard + 0.2);
  if (inK <= 0) return null;
  const card = (key: 'A' | 'B', at: number, cx: number, cy: number, rot: number) => {
    const k = springIn(t, at, 0.45);
    const c = spec.choices[key];
    const [l1, l2] = key === 'A' ? ['so sorry!', 'the bleach is on me.'] : ['I owe you a new shirt.', 'also... we match now.'];
    return <g transform={`translate(${cx} ${cy + (1 - clamp(k)) * 200}) rotate(${rot}) scale(${0.6 + 0.4 * k})`} opacity={clamp(k * 3)}>
      <rect x={-442} y={-182} width={900} height={370} fill={ink('b20', true)} />
      <rect x={-450} y={-190} width={900} height={370} fill={ink('w')} stroke={ink('b')} strokeWidth={6} />
      <circle cx={-390} cy={-130} r={54} fill={ink(key === 'A' ? 'b' : 'p')} />
      <text x={-390} y={-104} textAnchor="middle" fontFamily={STAMP} fontWeight={700} fontSize={80} fill={ink('w')}>{key}</text>
      {c.draw === 'bleach' ? <g transform="translate(-250 10) scale(0.95)">
        <path d="M -70 110 L -70 -40 Q -70 -80 -30 -90 L -20 -130 L 20 -130 L 30 -90 Q 70 -80 70 -40 L 70 110 Z" fill={ink('b')} />
        <rect x={-24} y={-150} width={48} height={26} fill={ink('bp')} />
        <rect x={-56} y={-20} width={112} height={74} fill={ink('w')} />
        <text y={28} textAnchor="middle" fontFamily={STAMP} fontWeight={700} fontSize={34} fill={ink('b')}>BLEACH</text>
      </g> : <g transform="translate(-270 20)">
        <g transform="translate(-40 0) rotate(-8) scale(0.44)"><Tee k={1} /></g>
        <g transform="translate(50 10) rotate(8) scale(0.44)"><Tee k={1} spec="p70" /></g>
        <path d="M 0 -120 c -10 -20 -40 -10 -30 12 l 30 28 l 30 -28 c 10 -22 -20 -32 -30 -12 Z" fill={ink('p')} transform="translate(0 10)" />
      </g>}
      <text x={-90} y={-10} fontFamily={HIM} fontWeight={700} fontSize={58} fill={ink('bp')}>{l1}</text>
      <text x={-90} y={70} fontFamily={HIM} fontWeight={700} fontSize={58} fill={ink('bp')}>{l2}</text>
    </g>;
  };
  return <g transform={`translate(0 ${lerp(1900, 0, inK) - 1900 * outK})`}>
    <rect x={-20} y={-20} width={1120} height={1960} fill={ink('w')} />
    <rect x={-20} y={-20} width={1120} height={1960} fill={ink('p10')} />
    <Strip text={spec.choices.question} y={330} k={smooth(t, B.choice + 0.2, B.choice + 0.55)} size={58} />
    {card('A', B.cardA, 540, 640, -2)}
    {card('B', B.cardB, 540, 1050, 2)}
    <Strip text="comment A or B" y={1320} k={smooth(t, B.comment, B.comment + 0.35)} size={64} spec="p" rot={1.5} />
  </g>;
};

/** End card: the signature dryer door, tumbling, with the season's name. */
const EndCard: React.FC<{t: number}> = ({t}) => {
  const {ink} = useInk();
  const k = smooth(t, B.endcard - 0.3, B.endcard + 0.25);
  if (k <= 0) return null;
  return <g transform={`translate(0 ${lerp(1900, 0, k)})`}>
    <rect x={-20} y={-20} width={1120} height={1960} fill={ink('w')} />
    <rect x={-20} y={-20} width={1120} height={1960} fill={ink('b10')} />
    <g transform={`translate(540 860) rotate(${(t - B.endcard) * 4})`}><DrumDoor t={t} r={190} spin={(t - B.endcard) * 240} /></g>
    <Strip text="the dryer notes" y={360} k={smooth(t, B.endcard + 0.3, B.endcard + 0.6)} size={96} spec="p" rot={-2} />
    <Strip text="part 1" y={500} k={smooth(t, B.endcard + 0.6, B.endcard + 0.9)} size={56} rot={1.5} />
    <Strip text="comment A or B" y={1200} k={smooth(t, B.endcard + 0.9, B.endcard + 1.2)} size={60} spec="p" rot={-1} />
    <Strip text="part 2: what she writes back" y={1320} k={smooth(t, B.endcard + 1.3, B.endcard + 1.6)} size={46} rot={1} />
  </g>;
};

const Scene: React.FC<{t: number}> = ({t}) => {
  const cam = camAt(CAM, t);
  return <>
    <g transform={planeT(cam, 0.85)}><Wall t={t} /></g>
    <g transform={planeT(cam, 1)}><Floor /><World t={t} /></g>
    <g transform={planeT(cam, 1.3)}><Fore /></g>
    {spec.strips.map((s, i) => <Strip key={i} text={s.text} y={s.y} k={hold(t, s.from, s.from + 0.35, s.to - 0.3, s.to)} rot={i % 2 ? 1.2 : -1.5} size={i < 2 ? 54 : 58} />)}
    <CloseNote t={t} />
    <Choice t={t} />
    <EndCard t={t} />
  </>;
};

export const Dryer1: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  return <AbsoluteFill>
    <Audio src={staticFile('audio/dryer-ep1-room.wav')} volume={0.6} />
    <Audio src={staticFile('audio/dryer-ep1-music.wav')} volume={0.8} />
    <Audio src={staticFile('audio/dryer-ep1-sfx.wav')} volume={0.9} />
    <Riso t={t}><Scene t={t} /></Riso>
  </AbsoluteFill>;
};
