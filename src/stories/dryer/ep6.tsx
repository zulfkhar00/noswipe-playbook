import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, hold, lerp, smooth, springIn} from '../../lib/motion';
import {DrumDoor, Dryers, Face, Floor, Guy, HER, HIM, Hands, Riso, STAMP, Sock, Strip, TOP, Wall, camAt, handsAt, planeT, useInk} from './world';
import {Board, Card, CloseUp, NightCard, RewindDrum, Sheet} from './parts';
import spec from '../../../specs/stories/dryer-ep6.json';

// The Dryer Notes, part 6: the season finale. A first: he goes home at 9:41 and comes back three
// Thursdays in a row without ever leaving a note (a cobweb grows on him). Rewind. B: he stays to write
// one last note, and it takes him 20 minutes, so he's still there at 10:02 when the door flies open:
// Nora, out of breath, in the pink tee. Her bus broke down; she ran. First words out loud, the sock,
// one dryer for both of them, and an end card that ends the season (no vote, no next part).
//
// Nora is seen for the first time. She is drawn here in the season's riso style (pink tee, blue hair).

export const DRYER6_FPS = 60;
export const DRYER6_FRAMES = Math.ceil(spec.duration * DRYER6_FPS);
const B = spec.beats;
const HX = 640, HY = 1520;                     // he stands between dryers 4 and 5
const NX = 330;                                // where Nora stops
const D5 = [870 - HX, TOP + 10 - HY];          // the top of dryer 5, relative to his feet

/** During the rewind the world plays backwards from `rewind` to `aIn`. */
const worldTime = (t: number) => t >= B.rewind && t < B.drum ? lerp(B.rewind, B.aIn, smooth(t, B.rewind, B.drum)) : t;

const CAM: [number, number, number, number][] = [
  [0, 560, 1040, 1.2], [B.aIn, 760, 620, 0.85], [B.aLeave, 760, 620, 0.85], [5.4, 340, 760, 0.95], [5.7, 340, 760, 0.95],
  [5.9, 690, 930, 1.6], [B.aSad, 690, 900, 1.75], [B.rewind, 690, 880, 1.85],
  [B.bIn, 760, 620, 0.85], [17.6, 760, 620, 0.85], [B.bPlace, 720, 880, 1.3], [19.0, 720, 880, 1.3],
  [20.0, 490, 980, 1.12], [B.herNote, 490, 980, 1.14], [27.6, 490, 980, 1.14], [28.4, 500, 900, 1.5], [B.together, 500, 880, 1.6], [46, 500, 880, 1.6],
];

// --- clock: minutes after 9pm ---------------------------------------------------------------
const CLOCK_A: [number, number][] = [[B.aIn, 40], [5.4, 41], [5.8, 52], [12, 56]];
const CLOCK_B: [number, number][] = [[B.bIn, 40], [B.write, 40], [17.8, 60], [B.door, 62], [46, 66]];
const clockAt = (t: number): [number, number] => {
  const keys = t >= B.bIn ? CLOCK_B : CLOCK_A;
  let m = keys[0][1];
  for (let k = 1; k < keys.length; k++) if (t > keys[k - 1][0]) m = lerp(keys[k - 1][1], keys[k][1], clamp((t - keys[k - 1][0]) / (keys[k][0] - keys[k - 1][0])));
  return [9 + Math.floor(m / 60), m % 60];
};

// --- props ----------------------------------------------------------------------------------

/** A small note in the world (on a dryer top, or in his hand). */
const MiniNote: React.FC<{x: number; y: number; rot?: number; pink?: boolean}> = ({x, y, rot = -6, pink}) => {
  const {ink} = useInk();
  return <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    <rect x={-70} y={-24} width={140} height={48} fill={ink('w')} stroke={ink(pink ? 'p35' : 'b35')} strokeWidth={3} />
    {[0, 1].map((k) => <rect key={k} x={-52} y={-10 + k * 16} width={k ? 70 : 100} height={5} fill={ink(pink ? 'p' : 'b')} />)}
  </g>;
};

/** The sock, hanging from pinched fingers by its cuff, toe down: it must never read as a gun. */
const Hang: React.FC<{x: number; y: number; t: number; droop?: boolean}> = ({x, y, t, droop}) =>
  <Sock x={x - 4} y={y + 62} rot={(droop ? 8 : 0) + 4 * Math.sin(t * 3)} s={0.55} />;

/** A crumpled draft. */
const Crumple: React.FC<{x: number; y: number; k: number; r?: number}> = ({x, y, k, r = 34}) => {
  const {ink} = useInk();
  if (k <= 0) return null;
  return <g transform={`translate(${x} ${y - (1 - clamp(k)) * 60}) scale(${k}) rotate(${x * 7})`}>
    <path d={`M ${-r} 0 Q ${-r} ${-r} 0 ${-r} Q ${r * 0.9} ${-r * 1.1} ${r} ${-r * 0.1} Q ${r * 1.1} ${r} 0 ${r} Q ${-r * 1.05} ${r * 0.9} ${-r} 0 Z`} fill={ink('w')} stroke={ink('b')} strokeWidth={4} />
    <path d={`M ${-r * 0.6} ${-r * 0.2} L ${-r * 0.1} ${r * 0.1} L ${r * 0.5} ${-r * 0.5} M ${-r * 0.2} ${r * 0.6} L ${r * 0.3} ${r * 0.1}`} stroke={ink('b35')} strokeWidth={3} fill="none" />
  </g>;
};
const DRAFTS: [number, number, number][] = [[15.5, 460, TOP - 34], [16.1, 530, TOP - 32], [16.7, 495, TOP - 88], [17.3, 430, TOP - 84], [17.8, 565, TOP - 84]];

/** Three Thursdays of waiting: a cobweb from his ear to dryer 5. */
const Cobweb: React.FC<{k: number}> = ({k}) => {
  const {ink} = useInk();
  if (k <= 0) return null;
  const cx = 800, cy = 870;
  const ends: [number, number][] = [[712, 822], [714, 900], [750, 975], [830, 985], [892, 930], [892, 840], [835, 822]];
  return <g opacity={k}>
    {ends.map(([x, y], i) => <path key={i} d={`M ${cx} ${cy} L ${x} ${y}`} stroke={ink('b')} strokeWidth={3} />)}
    {[0.35, 0.65, 0.95].map((u) => <path key={u} fill="none" stroke={ink('b')} strokeWidth={2.5}
      d={ends.map(([x, y], i) => `${i ? 'L' : 'M'} ${cx + (x - cx) * u} ${cy + (y - cy) * u}`).join(' ')} />)}
    {/* The spider: a real one, legs and all, so the web reads as time passing. */}
    <path d={`M ${cx + 40} ${cy + 30} L ${cx + 40} ${cy + 64}`} stroke={ink('bp')} strokeWidth={2.5} />
    <g transform={`translate(${cx + 40} ${cy + 78})`}>
      {[-1, 1].flatMap((sd) => [-26, -8, 10, 26].map((a) => <path key={`${sd}${a}`} d={`M 0 0 q ${sd * 14} ${a * 0.5 - 10} ${sd * 24} ${a * 0.6 + 6}`} stroke={ink('bp')} strokeWidth={3.5} fill="none" />))}
      <ellipse rx={11} ry={13} fill={ink('bp')} />
      <circle cy={-14} r={7} fill={ink('bp')} />
    </g>
  </g>;
};

/** Dust on a man who has waited three weeks. */
const Dust: React.FC<{k: number}> = ({k}) => {
  const {ink} = useInk();
  if (k <= 0) return null;
  const pts = [[-60, -620], [40, -640], [-20, -560], [70, -500], [-80, -420], [20, -380], [-40, -760], [30, -790], [0, -740]];
  return <g opacity={k}>{pts.map(([x, y], i) => <circle key={i} cx={HX + x} cy={HY + y} r={5 + (i % 3) * 2} fill={ink('b20', true)} stroke={ink('b35', true)} strokeWidth={2} />)}</g>;
};

/** A speech bubble, in the world, above whoever says it. */
const Bubble: React.FC<{x: number; y: number; text: string; font: string; k: number; tail: number; pink?: boolean}> = ({x, y, text, font, k, tail, pink}) => {
  const {ink} = useInk();
  if (k <= 0) return null;
  const w = text.length * 30 + 70, h = 110;
  return <g transform={`translate(${x} ${y}) scale(${k})`} opacity={clamp(k * 3)}>
    <rect x={-w / 2 + 8} y={-h / 2 + 10} width={w} height={h} rx={40} fill={ink('b20', true)} />
    <path d={`M ${tail - 26} ${h / 2 - 4} L ${tail + 6} ${h / 2 + 50} L ${tail + 26} ${h / 2 - 4} Z`} fill={ink('w')} stroke={ink(pink ? 'p' : 'b')} strokeWidth={6} strokeLinejoin="round" />
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={40} fill={ink('w')} stroke={ink(pink ? 'p' : 'b')} strokeWidth={6} />
    <rect x={tail - 22} y={h / 2 - 10} width={44} height={14} fill={ink('w')} />
    <text y={20} textAnchor="middle" fontFamily={font} fontWeight={700} fontSize={58} fill={ink(pink ? 'b' : 'bp')}>{text}</text>
  </g>;
};

// --- Nora -----------------------------------------------------------------------------------

type NFace = {look: number; mouth: 'o' | 'smile' | 'grin' | 'pant'; brows: number; tilt: number; blush?: number; sweat?: number};

/** Her: front-facing riso figure like his, feet at (x, y). Pink tee, blue bob with a fringe, tote bag. */
const Nora: React.FC<{x: number; y: number; hands: Hands; face: NFace; walk?: number; bob?: number; front?: React.ReactNode}> = ({x, y, hands, face, walk = 0, bob = 0, front}) => {
  const {ink} = useInk();
  const sw = Math.sin(walk * Math.PI * 2);
  const by = -Math.abs(Math.cos(walk * Math.PI * 2)) * 14 * (walk ? 1 : 0) + bob;
  const hx = face.look * 10, hy = -680 + by;
  const arm = (side: number, ex: number, ey: number) => {
    const sx = side * 88, sy = -560 + by;
    return `M ${sx} ${sy} Q ${sx + side * 34} ${(sy + ey) / 2 + 36} ${ex} ${ey}`;
  };
  const mouth = {
    o: <ellipse cx={hx} cy={hy + 36} rx={11} ry={15} fill={ink('bp')} />,
    pant: <ellipse cx={hx} cy={hy + 36} rx={13} ry={9 + 5 * Math.abs(Math.sin(bob * 0.7))} fill={ink('bp')} />,
    grin: <path d={`M ${hx - 30} ${hy + 24} Q ${hx} ${hy + 62} ${hx + 30} ${hy + 24} Z`} fill={ink('bp')} />,
    smile: <path d={`M ${hx - 24} ${hy + 28} Q ${hx} ${hy + 46} ${hx + 24} ${hy + 28}`} stroke={ink('bp')} strokeWidth={6} strokeLinecap="round" fill="none" />,
  }[face.mouth];
  return <g transform={`translate(${x} ${y})`}>
    <ellipse cx={0} cy={6} rx={140} ry={22} fill={ink('b35', true)} />
    {/* Jeans and shoes. */}
    {[-1, 1].map((s) => <g key={s}>
      <path d={`M ${s * 34} ${-320 + by} L ${s * 40 + s * sw * 30} -40`} stroke={ink('b70')} strokeWidth={60} strokeLinecap="round" />
      <ellipse cx={s * 46 + s * sw * 30} cy={-16} rx={42} ry={20} fill={ink('b')} />
    </g>)}
    {/* Hair behind the head. */}
    <g transform={`rotate(${face.tilt} ${hx} ${hy + 60})`}>
      <path d={`M ${hx - 84} ${hy + 4} Q ${hx - 96} ${hy - 96} ${hx} ${hy - 98} Q ${hx + 96} ${hy - 96} ${hx + 84} ${hy + 4} L ${hx + 92} ${hy + 92} Q ${hx + 60} ${hy + 110} ${hx + 40} ${hy + 92} L ${hx - 40} ${hy + 92} Q ${hx - 60} ${hy + 110} ${hx - 92} ${hy + 92} Z`} fill={ink('b')} />
    </g>
    {/* The pink tee (the one his sock dyed), with short sleeves. */}
    <path d={`M -86 ${-296 + by} L -94 ${-548 + by} Q -88 ${-596 + by} -44 ${-604 + by} L 44 ${-604 + by} Q 88 ${-596 + by} 94 ${-548 + by} L 86 ${-296 + by} Z`} fill={ink('p')} stroke={ink('bp')} strokeWidth={5} strokeLinejoin="round" />
    <path d={`M -24 ${-602 + by} Q 0 ${-576 + by} 24 ${-602 + by}`} stroke={ink('bp')} strokeWidth={4} fill="none" />
    {/* Tote bag on her shoulder, laundry peeking out. */}
    <path d={`M -70 ${-596 + by} L -150 ${-410 + by}`} stroke={ink('b')} strokeWidth={10} />
    <path d={`M -60 ${-596 + by} L -86 ${-410 + by}`} stroke={ink('b')} strokeWidth={10} />
    <path d={`M -190 ${-420 + by} q 30 -40 60 -10 q 30 -40 66 6 Z`} fill={ink('w')} stroke={ink('b')} strokeWidth={4} />
    <path d={`M -150 ${-430 + by} q 16 -26 40 -6 l -8 14 Z`} fill={ink('p70')} />
    <rect x={-196} y={-420 + by} width={128} height={130} rx={10} fill={ink('b35')} stroke={ink('b')} strokeWidth={5} />
    <rect x={-22} y={hy + 48} width={44} height={40} fill={ink('p35')} />
    {/* Head. */}
    <g transform={`rotate(${face.tilt} ${hx} ${hy + 60})`}>
      <circle cx={hx} cy={hy} r={68} fill={ink('p35')} stroke={ink('bp')} strokeWidth={5} />
      {/* Fringe, swept to one side. */}
      <path d={`M ${hx - 72} ${hy - 4} Q ${hx - 78} ${hy - 86} ${hx} ${hy - 84} Q ${hx + 78} ${hy - 86} ${hx + 72} ${hy - 4} Q ${hx + 60} ${hy - 46} ${hx + 24} ${hy - 42} Q ${hx - 30} ${hy - 34} ${hx - 72} ${hy - 4} Z`} fill={ink('b')} />
      {[-1, 1].map((s) => <g key={s}>
        <ellipse cx={hx + s * 25 + face.look * 9} cy={hy + 4} rx={8} ry={face.mouth === 'grin' ? 5 : 10} fill={ink('bp')} />
        <path d={`M ${hx + s * 25 - 13} ${hy - 18 - face.brows * 10} Q ${hx + s * 25} ${hy - 30 - face.brows * 12} ${hx + s * 25 + 13} ${hy - 18 - face.brows * 10}`} stroke={ink('bp')} strokeWidth={5} strokeLinecap="round" fill="none" />
      </g>)}
      {(face.blush ?? 0) > 0 && [-1, 1].map((s) => <ellipse key={s} cx={hx + s * 42} cy={hy + 24} rx={17} ry={10} fill={ink('p70', true)} opacity={face.blush} />)}
      {mouth}
      {(face.sweat ?? 0) > 0 && <g opacity={face.sweat}>
        {[[hx + 92, hy - 40, 1], [hx + 104, hy + 6, 0.8], [hx - 96, hy - 20, 0.9]].map(([sx, sy, s], i) =>
          <path key={i} d={`M ${sx} ${sy - 18 * s} Q ${sx + 12 * s} ${sy} ${sx} ${sy + 8 * s} Q ${sx - 12 * s} ${sy} ${sx} ${sy - 18 * s} Z`} fill={ink('b50')} stroke={ink('b')} strokeWidth={3} />)}
      </g>}
    </g>
    {/* Bare arms (outlined skin), sleeve caps on top. */}
    {[[-1, hands[0], hands[1]], [1, hands[2], hands[3]]].map(([s, ex, ey]) => <g key={s}>
      <path d={arm(s, ex, ey)} stroke={ink('bp')} strokeWidth={36} strokeLinecap="round" fill="none" />
      <path d={arm(s, ex, ey)} stroke={ink('p35')} strokeWidth={26} strokeLinecap="round" fill="none" />
      <circle cx={s * 84} cy={-560 + by} r={34} fill={ink('p')} stroke={ink('bp')} strokeWidth={5} />
    </g>)}
    {front}
    <circle cx={hands[0]} cy={hands[1]} r={24} fill={ink('p35')} stroke={ink('bp')} strokeWidth={4} />
    <circle cx={hands[2]} cy={hands[3]} r={24} fill={ink('p35')} stroke={ink('bp')} strokeWidth={4} />
  </g>;
};

// --- his poses ------------------------------------------------------------------------------

const relaxed: Hands = [-110, -310, 110, -310];
const SOCK_HANDS: Hands = [-110, -310, 70, -560];
const SLUMP_HANDS: Hands = [-100, -300, 60, -520];
const HANDS_B: [number, Hands][] = [
  [0, SOCK_HANDS], [B.write, [-40, -450, 40, -430]], [B.bPlace - 0.4, [-110, -310, D5[0], D5[1] + 30]], [B.bPlace + 0.4, relaxed],
  [B.door, [-150, -420, 150, -420]], [B.arrive + 0.6, relaxed], [B.herOut, [-110, -310, 60, -330]], [B.sock + 0.1, [-110, -310, 110, -560]],
];
const HER_HANDS: [number, Hands][] = [
  [0, [-120, -330, 120, -330]], [B.arrive, [-90, -420, 110, -330]], [B.herOut, [-90, -350, 60, -400]], [B.sock, [-90, -350, 120, -640]],
];

const World: React.FC<{t: number}> = ({t}) => {
  const isB = t >= B.bIn;
  if (!isB) {
    // A. Thursday 9:40: he gives up and walks out. Three Thursdays later he's still waiting, cobwebbed.
    const later = t >= B.aWeb;
    if (!later) {
      const x = lerp(HX, -300, smooth(t, B.aLeave, 5.4));
      const walking = t > B.aLeave && t < 5.4;
      const face: Face = {look: -0.7, mouth: 'flat', brows: -0.4, tilt: 6};
      return <g>
        <Dryers t={t} spin={[]} />
        <Guy x={x} y={HY} hands={SOCK_HANDS} face={face} walk={walking ? x / 260 : 0} tee
          front={<Hang x={SOCK_HANDS[2]} y={SOCK_HANDS[3]} t={t} />} />
      </g>;
    }
    const web = smooth(t, B.aWeb, B.aWeb + 1.2);
    const sad = smooth(t, B.aSad, B.aSad + 0.6);
    const face: Face = sad > 0.5 ? {look: 0.1, mouth: 'flat', brows: -0.6, tilt: 10} : {look: 0.5 * Math.sin(t * 2), mouth: 'flat', brows: -0.2, tilt: 3};
    return <g>
      <Dryers t={t} spin={t < B.buzz ? [6] : []} />
      <Guy x={HX} y={HY} hands={SLUMP_HANDS} face={face} tee bob={10 + 8 * sad}
        front={<Hang x={SLUMP_HANDS[2]} y={SLUMP_HANDS[3]} t={t} droop />} />
      <Dust k={web} />
      <Cobweb k={web} />
    </g>;
  }
  // B.
  const hands = handsAt(HANDS_B.map(([k, h]) => [k === 0 ? B.bIn : k, h] as [number, Hands]), t);
  const writing = t >= B.write && t < B.bPlace - 0.4;
  const pen = writing ? [hands[2] + 10 * Math.sin(t * 31), hands[3] + 6 * Math.cos(t * 23)] : [hands[2], hands[3]];
  const h: Hands = [hands[0], hands[1], pen[0], pen[1]];
  const placed = t >= B.bPlace;
  const taken = t >= B.herNote;              // she picked the note and the sock up (behind the close-up)
  const nora = t >= B.door;
  let face: Face;
  if (t < B.write) face = {look: 0.2, mouth: 'flat', brows: 0.2, tilt: 0};
  else if (t < B.bPlace) face = {look: -0.3, mouth: Math.sin(t * 5) > 0 ? 'flat' : 'wince', brows: -0.4, tilt: -6};
  else if (t < B.door) face = {look: 0, mouth: 'smile', brows: 0.2, tilt: -3};
  else if (t < B.herOut) face = {look: -0.9, mouth: 'o', brows: 1, tilt: 0};
  else face = {look: -0.8, mouth: 'grin', brows: 0.8, tilt: -5, blush: 1};
  const nx = lerp(-260, NX, smooth(t, B.door, B.arrive));
  const running = nora && t < B.arrive;
  const pant = clamp(1 - smooth(t, B.herOut + 1.5, B.herOut + 3));
  const nHands = handsAt(HER_HANDS.map(([k, hh]) => [k === 0 ? B.door : k, hh] as [number, Hands]), t);
  const nFace: NFace = t < B.herOut
    ? {look: 0.8, mouth: 'pant', brows: 1.2, tilt: 4, sweat: 1, blush: 0.9}
    : t < B.hi2 ? {look: 0.9, mouth: 'smile', brows: 0.5, tilt: 5, sweat: pant, blush: 0.8}
      : {look: 0.9, mouth: 'grin', brows: 0.7, tilt: 6, sweat: pant, blush: 1};
  const bub = spec.bubbles;
  return <g>
    <Dryers t={t} spin={[2]} />
    {DRAFTS.map(([at, x, y], i) => <Crumple key={i} x={x} y={y} k={springIn(t, at, 0.3)} />)}
    {placed && !taken && <>
      <MiniNote x={880} y={TOP - 28} rot={4} />
    </>}
    <Guy x={HX} y={HY} hands={h} face={face} tee bob={t < B.herOut && t >= B.door ? -8 * smooth(t, B.door, B.door + 0.2) : 0}
      front={<>
        {t < B.write && <Hang x={h[2]} y={h[3]} t={t} />}
        {writing && <>
          <MiniNote x={h[0] + 20} y={h[1] - 20} rot={-4} />
        </>}
        {t >= B.write && t < B.bPlace && !writing && <MiniNote x={h[2]} y={h[3] - 34} />}
        {t >= B.write && t < B.bPlace && <Pen x={h[2]} y={h[3]} />}
      </>} />
    {nora && <Nora x={nx} y={HY + 10} hands={nHands} face={nFace} walk={running ? nx / 200 : 0}
      bob={running ? 0 : 6 * pant * Math.sin(t * 12)}
      front={taken ? <Hang x={nHands[2]} y={nHands[3]} t={t} /> : null} />}
    <Bubble x={640} y={612} text={bub[0].text} font={HIM} k={springIn(t, bub[0].at, 0.4)} tail={30} />
    <Bubble x={330} y={738} text={bub[1].text} font={HER} k={springIn(t, bub[1].at, 0.4)} tail={-30} pink />
  </g>;
};

const Pen: React.FC<{x: number; y: number}> = ({x, y}) => {
  const {ink} = useInk();
  return <g transform={`translate(${x} ${y}) rotate(-30)`}>
    <rect x={-8} y={-96} width={16} height={86} rx={4} fill={ink('b')} />
    <rect x={-8} y={-96} width={16} height={18} fill={ink('p')} />
    <path d="M -8 -10 L 0 10 L 8 -10 Z" fill={ink('bp')} />
  </g>;
};

const R = spec.recap;
const RECAP: Card[] = [
  {letter: 'A', l1: R.A.l1, l2: R.A.l2, draw: R.A.draw, at: -1},
  {letter: 'B', l1: R.B.l1, l2: R.B.l2, draw: R.B.draw, at: -1},
];

/** The finale's last shot: one dryer, both their clothes, the sock among them. */
const Together: React.FC<{t: number; a: number; z: number}> = ({t, a, z}) => {
  const u = t - a;
  return <Sheet t={t} a={a} z={z} bg="p10">
    <g transform={`translate(540 880) rotate(${u * 6})`}>
      <DrumDoor t={t} r={230} spin={u * 260} />
      <g transform={`rotate(${u * 140}) translate(70 30)`}><Sock x={0} y={0} rot={u * 90} s={0.7} /></g>
    </g>
    <Strip text={spec.togetherText} y={330} k={smooth(t, a + 0.3, a + 0.6)} size={64} spec="p" rot={-1.5} />
    <Hearts t={t} a={a + 1.4} />
  </Sheet>;
};

const Hearts: React.FC<{t: number; a: number}> = ({t, a}) => {
  const {ink} = useInk();
  return <g>{[[250, 1260, -12], [830, 1220, 14], [540, 1330, 0]].map(([x, y, r], i) => {
    const k = springIn(t, a + i * 0.25, 0.4);
    if (k <= 0) return null;
    return <path key={i} d="M 0 -16 c -10 -22 -44 -12 -34 14 l 34 32 l 34 -32 c 10 -26 -24 -36 -34 -14 Z" fill={ink(i === 2 ? 'bp' : 'p')}
      transform={`translate(${x} ${y}) rotate(${r}) scale(${1.6 * k})`} />;
  })}</g>;
};

/** End card: the season ends. No vote, no next part. */
const FinalCard: React.FC<{t: number; a: number}> = ({t, a}) => <Sheet t={t} a={a} z={999}>
  <g transform={`translate(540 860) rotate(${(t - a) * 4})`}><DrumDoor t={t} r={190} spin={(t - a) * 120} /></g>
  <Strip text="the dryer notes" y={360} k={smooth(t, a + 0.3, a + 0.6)} size={96} spec="p" rot={-2} />
  <Strip text="the end" y={500} k={smooth(t, a + 0.6, a + 0.9)} size={64} rot={1.5} />
  <Strip text="thanks for every A and B." y={1220} k={smooth(t, a + 1.0, a + 1.3)} size={54} spec="p" rot={-1} />
</Sheet>;

const Scene: React.FC<{t: number}> = ({t}) => {
  const tw = worldTime(t);
  const cam = camAt(CAM, tw);
  const strips = spec.strips as {text: string; from: number; to: number; y: number; spec?: string; big?: boolean; size?: number}[];
  const show = (s: {from: number; to: number}) => hold(tw, s.from, s.from + 0.3, s.to - 0.3, s.to);
  const inRewind = t >= B.rewind && t < B.drum;
  return <>
    <g transform={planeT(cam, 0.85)}><Wall t={tw} hm={clockAt(tw)} /></g>
    <g transform={planeT(cam, 1)}><Floor /><World t={tw} /></g>
    {!inRewind && strips.filter((s) => !s.big && s.from > 0 && s.from < B.together && !(s.from >= B.drum && s.from < B.bIn)).map((s, i) => <Strip key={i} text={s.text} y={s.y} k={show(s)} rot={i % 2 ? 1.2 : -1.5} size={s.size ?? 56} spec={s.spec} />)}
    {strips.filter((s) => s.big).map((s, i) => <NightCard key={i} t={tw} a={s.from} z={s.to} text={s.text} />)}
    {/* The rewind. */}
    {inRewind && <Strip text="rewinding..." y={330} k={1} size={64} spec="p" rot={-2} />}
    <RewindDrum t={t} a={B.drum} z={B.bIn} />
    {strips.filter((s) => s.from >= B.drum && s.from < B.bIn).map((s, i) => <Strip key={i} text={s.text} y={s.y} k={show(s)} size={s.size ?? 50} spec={s.spec} />)}
    {/* His last note, then hers on the back of it. */}
    <CloseUp t={t} a={B.bNote} z={B.bOut} lines={spec.bReply} font={HIM} below={<Strip text="his last note, on dryer 5:" y={330} k={smooth(t, B.bNote + 0.1, B.bNote + 0.4)} size={54} />}
      extra={<g transform="translate(400 -330)"><Sock x={0} y={0} rot={24} s={0.75} /></g>} />
    <CloseUp t={t} a={B.herNote} z={B.herOut} lines={spec.herReply} below={<Strip text="she wrote back on it:" y={330} k={smooth(t, B.herNote + 0.1, B.herNote + 0.4)} size={54} spec="p" />} />
    <Together t={t} a={B.together} z={B.endcard} />
    {/* Recap, over everything at the start: part 5's vote, A picked to go first. */}
    <Board t={t} a={-1} z={B.aIn} cards={RECAP} pick={{letter: 'A', at: B.recapA}} />
    {strips.filter((s) => s.from < 0).map((s, i) => <Strip key={i} text={s.text} y={s.y} k={show(s)} rot={i ? 1.2 : -1.5} size={s.size ?? 54} spec={s.spec} />)}
    <FinalCard t={t} a={B.endcard} />
    <StampMark t={t} />
  </>;
};

/** A "FIRST" stamp on card A in the recap. */
const StampMark: React.FC<{t: number}> = ({t}) => {
  const {ink} = useInk();
  const k = smooth(t, B.recapA, B.recapA + 0.15) * (1 - smooth(t, B.aIn - 0.3, B.aIn));
  if (k <= 0) return null;
  return <g transform={`translate(760 810) rotate(-6) scale(${1.4 - 0.4 * k})`} opacity={k}>
    <rect x={-185} y={-46} width={370} height={92} fill={ink('w')} stroke={ink('p')} strokeWidth={8} />
    <text y={22} textAnchor="middle" fontFamily={STAMP} fontWeight={700} fontSize={60} fill={ink('p')}>TRY A FIRST</text>
  </g>;
};

export const Dryer6: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const jolt = t >= B.rewind && t < B.bIn ? 1 : 0;
  return <AbsoluteFill>
    <Audio src={staticFile('audio/dryer-ep6-room.wav')} volume={0.6} />
    <Audio src={staticFile('audio/dryer-ep6-music.wav')} volume={0.8} />
    <Audio src={staticFile('audio/dryer-ep6-sfx.wav')} volume={0.9} />
    <Riso t={t} jolt={jolt}><Scene t={t} /></Riso>
  </AbsoluteFill>;
};
