import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, hold, lerp, smooth} from '../../lib/motion';
import {Alley, Buildings, Bulbs, C, Defs, Far, HERS, HIS, HeldPhone, Jo, Person, Pose, Rain, Sign, Strip, Window, camAt, planeT} from './world';
import spec from '../../../specs/stories/alley-ep6.json';

// Across the Alley, episode 6 (the finale): "Downstairs". Recap: her window is empty. For the first
// time the camera tilts down to the street: 10:00 am. Jo sits on her stoop and her phone lights up
// with a NoSwipe notification (its second mention: Jo's thing, never what brings Theo and Mira
// together). Theo comes out of his door with two coffees; Jo: "she moved out last night." Then Mira
// walks up with her sketchbook: "you said 10am." Coffee, names in person, "it's 2 hours by train."
// "worth it." "same time next week?" "same." The camera rises to the bulbs between their windows.

export const ALLEY6_FPS = 60;
export const ALLEY6_FRAMES = Math.ceil(spec.duration * ALLEY6_FPS);
const B = spec.beats;
type SignSpec = {who: string; text: string; write: number; up: number; down: number};
const SIGNS = spec.signs as SignSpec[];

// The street: the sidewalk at y 2200, his door on the left facade, hers (with a stoop) on the right.
const GROUND_Y = 2200, SC = 0.85;
const HIS_DOOR = 250, HER_DOOR = 880;
const JO_SPOT = {x: 880, y: 2105};

const CAM: [number, number, number, number][] = [
  [0, 540, 930, 1.06], [3.3, 540, 930, 1.08], [3.65, 540, 1960, 1.2], [4.4, 560, 1960, 1.24], [4.9, JO_SPOT.x - 60, 1960, 1.8], [6.4, JO_SPOT.x - 60, 1960, 1.85],
  [6.9, 560, 1960, 1.2], [14.6, 560, 1960, 1.24], [15.2, 540, 1900, 1.55], [34.0, 540, 1900, 1.62], [35.4, 540, 930, 1.04], [41.0, 540, 930, 1.0],
];

const signOf = (who: string, t: number) => SIGNS.find((s) => s.who === who && t >= s.write - 0.1 && t < s.down + 0.5);
const recap = (t: number) => t < B.next;
const THEO_X = (t: number) => lerp(HIS_DOOR, 410, smooth(t, B.out, B.out + 1.4));
const MIRA_X = (t: number) => lerp(1240, 680, smooth(t, B.miraIn, B.miraIn + 1.8));
const walking = (t: number, a: number, b: number) => t > a && t < b ? Math.sin((t - a) * 9) : 0;

const poseOf = (who: 'him' | 'her', t: number): Pose => {
  const sign = signOf(who, t);
  let hands: Pose['hands'] = 'none', look = who === 'him' ? -0.4 : -1, tilt = 0, bob = 0;
  if (sign) hands = t < sign.up - 0.3 ? 'write' : t < sign.down ? 'sign' : 'none';
  if (hands === 'write') { look = 0; tilt = who === 'him' ? 10 : -10; }
  if (who === 'him') {
    if (t > B.out + 1.4) look = 1;
    const slump = hold(t, B.sinks, B.sinks + 0.5, B.hisTurn - 0.3, B.hisTurn);
    bob += 18 * slump; tilt += 12 * slump; if (slump > 0.5) look = 0.2;
    if (t >= B.hisTurn) look = 1;
  } else {
    bob += Math.abs(walking(t, B.miraIn, B.miraIn + 1.8)) * -6;
  }
  return {look, hands, bob, tilt};
};

const SignFor: React.FC<{who: string; t: number}> = ({who, t}) => {
  const sign = signOf(who, t);
  if (!sign) return null;
  const lift = smooth(t, sign.up - 0.4, sign.up), drop = smooth(t, sign.down, sign.down + 0.4);
  const sy = lerp(lerp(170, 115, lift), 330, drop);
  const k = clamp((t - sign.write) / Math.max(0.3, sign.up - 0.4 - sign.write));
  return <Sign x={0} y={sy} text={sign.text} k={k} who={who === 'him' ? 'him' : 'her'} s={lerp(0.92, 1, lift)} rot={lerp(-6, who === 'him' ? 2 : -2, lift)} />;
};

/** A paper cup of coffee with a lid and a sleeve. */
const Cup: React.FC<{x: number; y: number; k?: number}> = ({x, y, k = 1}) => k <= 0 ? null : <g opacity={k} filter="url(#paper)">
  <path d={`M ${x - 22} ${y - 34} L ${x + 22} ${y - 34} L ${x + 17} ${y + 30} L ${x - 17} ${y + 30} Z`} fill={C.paper} />
  <rect x={x - 25} y={y - 42} width={50} height={10} rx={4} fill="#2b2140" />
  <path d={`M ${x - 20} ${y - 8} L ${x + 20} ${y - 8} L ${x + 18} ${y + 12} L ${x - 18} ${y + 12} Z`} fill={C.card} />
</g>;

/** A whole standing figure on the sidewalk: the window silhouette plus legs; `step` swings the legs. */
const Walker: React.FC<{x: number; who: 'him' | 'her'; p: Pose; t: number; step: number; id: string; children?: React.ReactNode}> = ({x, who, p, t, step, id, children}) =>
  <g transform={`translate(${x} ${GROUND_Y}) scale(${SC}) translate(0 -600)`}>
    <g filter="url(#paper)">
      <path d={`M -64 290 L ${-46 + 30 * step} 600 L ${-8 + 30 * step} 600 L 0 330 Z`} fill={C.ink} />
      <path d={`M 64 290 L ${46 - 30 * step} 600 L ${8 - 30 * step} 600 L 0 330 Z`} fill={C.ink} />
    </g>
    <Person x={0} y={0} who={who} p={p} t={t} glow={0} id={id} />
    {children}
  </g>;

/** A door in a facade: frame, panel (swings open to show warm light), a lit pane, a stoop. */
const Door: React.FC<{x: number; open: number; tone: string; stoop?: boolean}> = ({x, open, tone, stoop}) => <g filter="url(#paper)">
  <rect x={x - 95} y={GROUND_Y - 330} width={190} height={330} fill={C.trim} />
  <rect x={x - 75} y={GROUND_Y - 312} width={150} height={312} fill="#ffcf8a" />
  <rect x={x - 75} y={GROUND_Y - 312} width={150 * (1 - 0.8 * open)} height={312} fill={tone} />
  {open < 0.5 && <rect x={x - 45} y={GROUND_Y - 280} width={90} height={70} fill="#ffcf8a" opacity={0.55} />}
  {stoop && [0, 1, 2].map((i) => <rect key={i} x={x - 130 + i * 15} y={GROUND_Y - 30 * (i + 1)} width={260 - i * 30} height={30} fill={i % 2 ? C.brick : '#30366a'} />)}
</g>;

/** Street level: the sidewalk, the kerb, puddles catching the bulbs' light, and the two doors. */
const Street: React.FC<{t: number}> = ({t}) => <g>
  <rect x={-600} y={GROUND_Y} width={2400} height={600} fill="#191b3d" />
  <rect x={-600} y={GROUND_Y} width={2400} height={14} fill="#2a2e5e" />
  <rect x={-600} y={GROUND_Y + 170} width={2400} height={10} fill="#2a2e5e" />
  {[[200, 2290, 120], [690, 2330, 160], [1000, 2280, 90]].map(([x, y, w], i) =>
    <ellipse key={i} cx={x} cy={y} rx={w} ry={14} fill="#3a3f78" opacity={0.6 + 0.1 * Math.sin(t * 2 + i)} />)}
  <Door x={HIS_DOOR} open={smooth(t, B.door, B.door + 0.5)} tone="#3c3e6e" />
  <Door x={HER_DOOR} open={0} tone="#5b3f6c" stoop />
</g>;

const Scene: React.FC<{t: number}> = ({t}) => {
  const cam = camAt(CAM, t);
  const next = camAt(CAM, t + 1 / 60);
  const blur = Math.min(36, (Math.abs(next.cx - cam.cx) * 60 * cam.s) / 110);
  const dips = hold(t, B.next - 0.4, B.next - 0.15, B.next + 0.05, B.next + 0.35);
  const street = !recap(t);
  const theoCup = t < B.give + 0.3;
  const giveU = smooth(t, B.give, B.give + 0.6);
  const himSign = !!signOf('him', t), herSign = !!signOf('her', t);
  return <svg width={1080} height={1920}>
    <Defs blur={blur} />
    <g filter={blur > 0.5 ? 'url(#whip)' : undefined}>
      <g transform={planeT(cam, 0.35)}><Far /></g>
      <g transform={planeT(cam, 0.7)}><Rain t={t} n={40} o={street ? 0.1 : 0.18} seed={7} /></g>
      <g transform={planeT(cam, 1)}>
        <Alley t={t} herLamp={1} />
        <Buildings t={t} />
        {/* Upstairs: his window lit and empty (he's downstairs), hers bare. */}
        <Window x={HIS.x} y={HIS.y} id="his" lamp={1} tone="his" t={t}>{recap(t) && <Person x={HIS.x} y={HIS.y} who="him" p={{look: 1, hands: 'none', bob: 20, tilt: 14}} t={t} glow={0} id="him-up" />}</Window>
        <Window x={HERS.x} y={HERS.y} id="hers" lamp={0.12} tone="hers" t={t} bare={1} />
        <Bulbs t={t} herLamp={1} flash={hold(t, B.flash, B.flash + 0.3, B.flash + 1.2, B.flash + 2.0) + 0.6 * hold(t, B.same, B.same + 0.3, B.same + 0.9, B.same + 1.4)} />
        {street && <>
          <Street t={t} />
          {/* Jo on her stoop, phone in hand; the NoSwipe notification lights it up. */}
          <g transform={`translate(${JO_SPOT.x} ${JO_SPOT.y}) scale(${SC})`}>
            {/* A little fist pump at her notification. */}
            <Jo x={0} y={-240} hood={1} k={1} t={t} waveAt={B.same + 0.4} point={hold(t, B.buzz + 0.6, B.buzz + 0.9, B.buzz + 1.6, B.buzz + 1.9)} px={70 + 10 * Math.sin(t * 14)} py={-330} />
            {!signOf('jo', t) && <HeldPhone x={0} y={-120} glow={t < B.joSees ? 1 : 0.4} flick={0} notif={hold(t, B.buzz + 0.1, B.buzz + 0.35, B.door - 0.2, B.door + 0.2)} notifText="NoSwipe · your date: fri 8pm ♥" />}
            <g transform="translate(-30 -240) scale(0.82)"><SignFor who="jo" t={t} /></g>
          </g>
          <rect x={JO_SPOT.x - 130} y={GROUND_Y - 30} width={260} height={30} fill="#30366a" filter="url(#paper)" />
          {t > B.out - 0.2 && <Walker x={THEO_X(t)} who="him" p={poseOf('him', t)} t={t} step={walking(t, B.out, B.out + 1.4)} id="him">
            {!himSign && <Cup x={90} y={225} />}
            {!himSign && theoCup && <Cup x={lerp(-90, -90 + (MIRA_X(t) - THEO_X(t)) / SC - 90, giveU)} y={225} />}
            <SignFor who="him" t={t} />
          </Walker>}
          {t > B.miraIn && <Walker x={MIRA_X(t)} who="her" p={poseOf('her', t)} t={t} step={walking(t, B.miraIn, B.miraIn + 1.8)} id="her">
            {!herSign && t > B.give + 0.6 && <Cup x={-90} y={225} />}
            <SignFor who="her" t={t} />
          </Walker>}
        </>}
      </g>
      <g transform={planeT(cam, 1.3)}><Rain t={t} n={70} o={street ? 0.14 : 0.32} seed={4} /></g>
    </g>
    {/* Morning at street level: a pale wash over the night palette. */}
    <rect width={1080} height={1920} fill="#9fb2ee" opacity={0.24 * (recap(t) ? 0 : 1 - smooth(t, B.rise, B.rise + 1.2))} style={{mixBlendMode: 'screen'}} />
    <rect width={1080} height={1920} fill="#05061a" opacity={dips} />
    {spec.strips.map((s, i) => <Strip key={i} text={s.text} y={s.y} k={hold(t, s.from, s.from + 0.35, s.to - 0.3, s.to)} rot={i % 2 ? 1.2 : -1.5} size={54} />)}
    <rect width={1080} height={1920} fill="#05061a" opacity={0.6 * smooth(t, B.endcard, B.endcard + 0.6)} />
    <Strip text="Across the Alley" y={800} k={smooth(t, B.endcard + 0.3, B.endcard + 0.8)} size={82} rot={-2} />
    <Strip text="the end." y={960} k={smooth(t, B.endcard + 0.8, B.endcard + 1.3)} size={62} rot={1.5} />
  </svg>;
};

export const Alley6: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  return <AbsoluteFill style={{background: C.sky0}}>
    <Audio src={staticFile('audio/alley-ep6-rain.wav')} volume={0.35} />
    <Audio src={staticFile('audio/alley-ep6-music.wav')} volume={0.8} />
    <Audio src={staticFile('audio/alley-ep6-sfx.wav')} volume={0.9} />
    <Scene t={t} />
  </AbsoluteFill>;
};
