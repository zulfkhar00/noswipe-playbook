import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, hold, lerp, smooth} from '../../lib/motion';
import {Alley, Buildings, Bulbs, C, Defs, Far, HERS, HIS, HeldPhone, Person, Pose, Rain, Sign, Strip, Window, camAt, planeT} from './world';
import spec from '../../../specs/stories/alley-ep2.json';

// Across the Alley, episode 2: "4B". Recap of last night's curtain, then the next night: her window
// stays dark. He turns his phone face down and tapes an apology to the glass, waits for hours and
// dozes off. Her lamp comes on; she tugs the bulb string to wake him. Names at last (Mira, Theo),
// rule #1, "deal." Then her door opens and someone steps in behind her; she waves and shuts the curtains.

export const ALLEY2_FPS = 60;
export const ALLEY2_FRAMES = Math.ceil(spec.duration * ALLEY2_FPS);
const B = spec.beats;
type SignSpec = {who: string; text: string; write: number; up: number; down: number; taped?: number};
const SIGNS = spec.signs as SignSpec[];

const CAM: [number, number, number, number][] = [
  [0, 540, 930, 1.06], [3.4, 540, 930, 1.08], [3.7, 540, 940, 0.98], [6.2, 540, 940, 1.0], [7.0, HIS.x, 930, 2.0], [12.8, HIS.x, 930, 2.1],
  [13.6, 540, 950, 1.0], [17.2, 540, 940, 1.04], [18.2, 540, 930, 1.06], [19.9, 540, 930, 1.06],
  [20.4, HERS.x, 930, 1.85], [23.0, HERS.x, 930, 1.9], [23.5, HIS.x, 930, 1.85], [26.5, HIS.x, 930, 1.9],
  [27.2, 540, 930, 1.06], [32.3, 540, 930, 1.1], [32.9, HERS.x, 930, 1.9], [35.6, HERS.x, 930, 2.05],
  [36.0, HIS.x, 930, 1.9], [38.8, HIS.x, 930, 2.1], [42.5, HIS.x, 930, 2.15],
];

const signOf = (who: string, t: number) => SIGNS.find((s) => s.who === who && t >= s.write - 0.1 && t < s.down + 0.5);
const recap = (t: number) => t < B.next;

type State = {p: Pose; dx: number; sign?: SignSpec; phone: number};

const him = (t: number): State => {
  const sign = signOf('him', t);
  let hands: Pose['hands'] = 'none', look = 1, tilt = 0, bob = 0, phone = 0;
  if (recap(t)) return {p: {look: 1, hands: 'sign', bob: 0, tilt: 4}, dx: 0, sign: {who: 'him', text: 'TH', write: -9, up: -9, down: 99}, phone: 0};
  if (t >= B.buzz && t < B.faceDown) { hands = 'phone'; look = 0; tilt = 10; phone = 1; }
  if (sign) hands = t < sign.up - 0.3 ? 'write' : sign.taped && t >= sign.taped ? 'none' : t < sign.down ? 'sign' : 'none';
  if (hands === 'write') { look = 0; tilt = 10; }
  if (t >= B.doze && t < B.wake) { look = 0; tilt = 16 * smooth(t, B.doze, B.doze + 1.5); bob = 18 * smooth(t, B.doze, B.doze + 1.5) + 3 * Math.sin(t * 1.6); }
  bob -= 14 * hold(t, B.wake, B.wake + 0.1, B.wake + 0.35, B.wake + 0.7);
  if (t >= B.herTurn) { tilt = 8 * smooth(t, B.sinks, B.sinks + 0.6); bob = 10 * smooth(t, B.sinks, B.sinks + 0.6); }
  return {p: {look, hands, bob, tilt}, dx: 0, sign, phone};
};

const her = (t: number): State => {
  const sign = signOf('her', t);
  let hands: Pose['hands'] = 'none', look = -1, tilt = 0;
  const dx = lerp(-230, 0, smooth(t, B.herIn, B.herIn + 0.8)) - 85 * smooth(t, B.herTurn - 0.2, B.herTurn + 0.3);
  if (t < B.herSees) { look = 0.6; tilt = -4; }
  if (t >= B.tug - 0.2 && t < B.tug + 0.5) hands = 'waveL';
  if (sign) hands = t < sign.up - 0.3 ? 'write' : t < sign.down ? 'sign' : 'none';
  if (hands === 'write') { look = 0; tilt = -10; }
  if (t >= B.herTurn) { look = 1; tilt = 0; }
  if (t >= B.wave && t < B.shut) { look = -1; hands = 'waveL'; }
  return {p: {look, hands, bob: 0, tilt}, dx, sign, phone: 0};
};

/** Someone in her doorway: a hooded silhouette, a little smaller (further back), in a spill of hall light. */
const Visitor: React.FC<{x: number; y: number; k: number}> = ({x, y, k}) => <g opacity={k} transform={`translate(${lerp(60, 0, k)} 0) translate(${x} ${y + 260}) scale(1.12) translate(${-x} ${-y - 260})`} filter="url(#paper)">
  <path d={`M ${x - 80} ${y + 260} L ${x - 66} ${y + 70} Q ${x - 60} ${y + 44} ${x - 30} ${y + 40} L ${x + 30} ${y + 40} Q ${x + 60} ${y + 44} ${x + 66} ${y + 70} L ${x + 80} ${y + 260} Z`} fill="#141634" />
  <circle cx={x} cy={y - 22} r={50} fill="#141634" />
  <path d={`M ${x - 40} ${y - 40} Q ${x} ${y - 70} ${x + 40} ${y - 40} Q ${x + 34} ${y + 8} ${x} ${y + 10} Q ${x - 34} ${y + 8} ${x - 40} ${y - 40} Z`} fill="#0a0b22" />
</g>;

const Room: React.FC<{who: 'him' | 'her'; t: number}> = ({who, t}) => {
  const W = who === 'him' ? HIS : HERS;
  const st = who === 'him' ? him(t) : her(t);
  const x = W.x + st.dx;
  const present = who === 'him' || (!recap(t) && t >= B.herIn);
  const sign = st.sign;
  let sx = 0, sy = 0, sk = 0, sRot = 0;
  if (sign) {
    const lift = smooth(t, sign.up - 0.4, sign.up), drop = smooth(t, sign.down, sign.down + 0.4);
    sx = x; sy = lerp(lerp(W.y + 170, W.y + 115, lift), W.y + 330, drop);
    sk = clamp((t - sign.write) / Math.max(0.3, sign.up - 0.4 - sign.write));
    sRot = lerp(-6, who === 'him' ? 2 : -2, lift);
  }
  const taped = sign?.taped && t >= sign.taped && t < sign.down;
  const door = who === 'her' ? smooth(t, B.door, B.door + 0.4) : 0;
  return <g>
    {door > 0 && <><rect x={W.x + 10} y={W.y - 175} width={120 * door} height={400} fill="#fff3e2" opacity={0.85} /><path d={`M ${W.x + 10} ${W.y + 225} L ${W.x + 10 + 120 * door} ${W.y + 225} L ${W.x - 40} ${W.y + 260} Z`} fill="#fff3e2" opacity={0.3} /></>}
    {who === 'her' && t >= B.visitor && <Visitor x={W.x + 70} y={W.y + 30} k={smooth(t, B.visitor, B.visitor + 0.5)} />}
    {present && <Person x={x} y={W.y} who={who} p={st.p} t={t} glow={st.phone} id={who} />}
    {st.phone > 0 && <HeldPhone x={x} y={W.y + 125} glow={1} flick={0} />}
    {sign && present && <Sign x={sx} y={sy} text={sign.text} k={sk} who={who} s={lerp(0.92, 1, smooth(t, sign.up - 0.4, sign.up))} rot={sRot} />}
    {taped && [-1, 1].map((d) => <rect key={d} x={sx + d * 135 - 26} y={sy - 112} width={52} height={22} fill="#e9dcb5" opacity={0.9} transform={`rotate(${d * 18} ${sx + d * 135} ${sy - 100})`} />)}
  </g>;
};

const Scene: React.FC<{t: number}> = ({t}) => {
  const cam = camAt(CAM, t);
  const next = camAt(CAM, t + 1 / 60);
  const blur = Math.min(36, (Math.abs(next.cx - cam.cx) * 60 * cam.s) / 110);
  const herLamp = recap(t) ? 0 : smooth(t, B.herOn, B.herOn + 0.1);
  const shut = recap(t) ? 1 : smooth(t, B.shut, B.shut + 0.6);
  const flash = hold(t, B.tug, B.tug + 0.05, B.tug + 0.5, B.tug + 0.8);
  const night = hold(t, B.next - 0.4, B.next - 0.15, B.next + 0.05, B.next + 0.35);
  return <svg width={1080} height={1920}>
    <Defs blur={blur} />
    <g filter={blur > 0.5 ? 'url(#whip)' : undefined}>
      <g transform={planeT(cam, 0.35)}><Far /></g>
      <g transform={planeT(cam, 0.7)}><Rain t={t} n={60} o={0.18} seed={5} /></g>
      <g transform={planeT(cam, 1)}>
        <Alley t={t} herLamp={herLamp} />
        <Buildings t={t} />
        <Window x={HIS.x} y={HIS.y} id="his" lamp={1} tone="his" t={t}><Room who="him" t={t} /></Window>
        <Window x={HERS.x} y={HERS.y} id="hers" lamp={herLamp} tone="hers" t={t} shut={shut}><Room who="her" t={t} /></Window>
        <Bulbs t={t} herLamp={herLamp} flash={flash} />
      </g>
      <g transform={planeT(cam, 1.3)}><Rain t={t} n={110} o={0.32} seed={2} /></g>
    </g>
    {/* Between last night and tonight: a quick dip to black. */}
    <rect width={1080} height={1920} fill="#05061a" opacity={night} />
    {spec.strips.map((s, i) => <Strip key={i} text={s.text} y={s.y} k={hold(t, s.from, s.from + 0.35, s.to - 0.3, s.to)} rot={i % 2 ? 1.2 : -1.5} size={s.y === 330 ? 54 : 46} />)}
    <rect width={1080} height={1920} fill="#05061a" opacity={0.72 * smooth(t, B.endcard, B.endcard + 0.6)} />
    <Strip text="Across the Alley" y={800} k={smooth(t, B.endcard + 0.3, B.endcard + 0.8)} size={82} rot={-2} />
    <Strip text="part 2" y={960} k={smooth(t, B.endcard + 0.6, B.endcard + 1.1)} size={58} rot={1.5} />
    <Strip text="part 3 tomorrow" y={1090} k={smooth(t, B.endcard + 1.1, B.endcard + 1.6)} size={50} rot={-1} />
  </svg>;
};

export const Alley2: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  return <AbsoluteFill style={{background: C.sky0}}>
    <Audio src={staticFile('audio/alley-ep2-rain.wav')} volume={0.5} />
    <Audio src={staticFile('audio/alley-ep2-music.wav')} volume={0.8} />
    <Audio src={staticFile('audio/alley-ep2-sfx.wav')} volume={0.9} />
    <Scene t={t} />
  </AbsoluteFill>;
};
