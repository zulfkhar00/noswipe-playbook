import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, hold, lerp, smooth} from '../../lib/motion';
import {Alley, Buildings, Bulbs, C, Defs, Far, HERS, HIS, Jo, Person, Pose, Rain, Sign, Strip, WIN, Window, camAt, planeT} from './world';
import spec from '../../../specs/stories/alley-ep3.json';

// Across the Alley, episode 3: "Rules". Recap: two shadows on her curtain. The next night the
// curtains open on Mira and the hooded figure, who drops the hood: Jo, her roommate. Theo slumps with
// relief; Jo holds up "he's cute.", Mira snatches it. Then the nights become a game of rules and one
// question each, until she shows him a sketch of his window. Night 9: "same time tomorrow?" She
// slowly writes "I'm moving in 3 weeks."

export const ALLEY3_FPS = 60;
export const ALLEY3_FRAMES = Math.ceil(spec.duration * ALLEY3_FPS);
const B = spec.beats;
type SignSpec = {who: string; text: string; write: number; up: number; down: number};
const SIGNS = spec.signs as SignSpec[];

const CAM: [number, number, number, number][] = [
  [0, 540, 930, 1.06], [3.3, 540, 930, 1.08], [3.7, 540, 930, 1.04], [4.4, 540, 930, 1.06], [5.4, HERS.x, 930, 1.85], [8.8, HERS.x, 930, 1.95],
  [9.3, HIS.x, 930, 1.85], [10.5, HIS.x, 930, 1.9], [11.0, 540, 930, 1.06], [30.8, 540, 930, 1.1], [31.8, HERS.x, 930, 1.85], [34.0, HERS.x, 930, 1.9],
  [34.6, 540, 930, 1.06], [36.2, 540, 930, 1.08], [37.4, HERS.x, 930, 1.9], [39.0, HERS.x, 930, 2.0], [39.4, HIS.x, 930, 1.9], [41.0, HIS.x, 930, 2.05],
  [44.5, HIS.x, 930, 2.1],
];

const signOf = (who: string, t: number) => SIGNS.find((s) => s.who === who && t >= s.write - 0.1 && t < s.down + 0.5);
const recap = (t: number) => t < B.next;
const joHere = (t: number) => t >= B.next && t < B.joOut + 0.8;
const MIRA_X = (t: number) => HERS.x - 75 * (1 - smooth(t, B.joOut + 0.4, B.joOut + 1.0));
const JO_X = (t: number) => HERS.x + 78 + 160 * smooth(t, B.joOut, B.joOut + 0.8);

const poseOf = (who: 'him' | 'her', t: number): Pose => {
  const sign = signOf(who, t);
  let hands: Pose['hands'] = 'none', look = who === 'him' ? 1 : -1, tilt = 0, bob = 0;
  if (sign) hands = t < sign.up - 0.3 ? 'write' : t < sign.down ? 'sign' : 'none';
  if (hands === 'write') { look = 0; tilt = who === 'him' ? 10 : -10; }
  if (who === 'him') {
    // Relief: a big exhale when the hood comes down and it's only her roommate.
    bob = 16 * hold(t, B.relief, B.relief + 0.3, B.relief + 0.8, B.relief + 1.3);
    tilt += 8 * hold(t, B.relief, B.relief + 0.3, B.relief + 0.8, B.relief + 1.3);
    if (t >= B.sinks) { bob = 26 * smooth(t, B.sinks, B.sinks + 0.8); tilt = 18 * smooth(t, B.sinks, B.sinks + 0.8); look = 0.2; }
  } else {
    if (t > B.laugh && t < B.laughEnd) bob = -Math.abs(Math.sin((t - B.laugh) * 13)) * 7;
    if (t >= B.snatch - 0.2 && t < B.snatch + 0.5) { hands = 'wave'; look = 1; }
    if (t >= B.next && t < B.hood + 0.2) look = 0;
  }
  return {look, hands, bob, tilt};
};

/** Her sketch of his window: pen lines on sketchbook paper. */
const Sketch: React.FC<{x: number; y: number; k: number; rot: number}> = ({x, y, k, rot}) => {
  const ln = (d: string, a: number) => <path d={d} stroke={C.pen} strokeWidth={4} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp((k - a) / 0.3)} />;
  return <g transform={`translate(${x} ${y}) rotate(${rot})`} filter="url(#paper)">
    <rect x={-150} y={-100} width={300} height={200} rx={2} fill={C.paper} />
    {ln('M -70 -70 L 70 -70 L 70 80 L -70 80 Z M -70 -40 L 70 -40', 0)}
    {ln('M -22 30 a 22 22 0 1 0 44 0 a 22 22 0 1 0 -44 0 M -42 80 Q -40 52 0 50 Q 40 52 42 80 M 10 22 q 14 -18 26 -6', 0.25)}
    {ln('M -140 -86 Q -110 -60 -78 -76 M 78 -76 Q 110 -60 140 -86', 0.5)}
    {[0, 1, 2].map((i) => <circle key={i} cx={-128 + i * 20} cy={-76 + (i === 1 ? 6 : 0)} r={4} fill={C.pen} opacity={clamp((k - 0.6) / 0.2)} />)}
    <text x={104} y={20} fontFamily={'"Marker Felt", "Permanent Marker", cursive'} fontSize={30} fill={C.pen} opacity={clamp((k - 0.75) / 0.2)}>you</text>
    {ln('M 100 30 L 80 46 M 80 46 L 92 44 M 80 46 L 84 34', 0.8)}
  </g>;
};

const SignFor: React.FC<{who: string; x: number; y: number; t: number; scale?: number}> = ({who, x, y, t, scale = 1}) => {
  const sign = signOf(who, t);
  if (!sign) return null;
  const lift = smooth(t, sign.up - 0.4, sign.up), drop = smooth(t, sign.down, sign.down + 0.4);
  let sx = x, sy = lerp(lerp(y + 170, y + 115, lift), y + 330, drop);
  const snatched = sign.text === "he's cute." ? smooth(t, B.snatch, B.snatch + 0.3) : 0;
  if (snatched > 0) { sx = lerp(x, MIRA_X(t), snatched); sy = lerp(y + 115, y + 330, smooth(t, B.snatch + 0.25, B.snatch + 0.6)); }
  // Writing slowly: the last sign of the night takes its time.
  const k = clamp((t - sign.write) / Math.max(0.3, sign.up - 0.4 - sign.write));
  const rot = lerp(-6, who === 'him' ? 2 : -2, lift) + 14 * snatched;
  const s = lerp(0.92, 1, lift) * scale;
  if (sign.text === '@sketch') return <Sketch x={sx} y={sy} k={smooth(t, sign.up - 0.4, sign.up + 1.2)} rot={rot} />;
  return <Sign x={sx} y={sy} text={sign.text} k={k} who={who === 'him' ? 'him' : 'her'} s={s} rot={rot} />;
};

const HerRoom: React.FC<{t: number}> = ({t}) => {
  const x = MIRA_X(t);
  return <g>
    {joHere(t) && <Jo x={JO_X(t)} y={HERS.y} hood={smooth(t, B.hood, B.hood + 0.4)} k={1 - smooth(t, B.joOut + 0.3, B.joOut + 0.8)} t={t} waveAt={B.joOut} />}
    <Person x={x} y={HERS.y} who="her" p={poseOf('her', t)} t={t} glow={0} id="her" />
  </g>;
};

/** Recap: her curtains shut, two shadows on them. */
const CurtainShadows: React.FC<{k: number}> = ({k}) => {
  const l = HERS.x - WIN.w / 2, top = HERS.y - WIN.h / 2;
  return <g opacity={0.45 * k}>
    <clipPath id="shad"><rect x={l} y={top} width={WIN.w} height={WIN.h} /></clipPath>
    <g clipPath="url(#shad)" filter="url(#soft)">
      <circle cx={HERS.x - 60} cy={HERS.y - 20} r={48} fill="#2a1630" /><rect x={HERS.x - 150} y={HERS.y + 80} width={180} height={200} rx={60} fill="#2a1630" />
      <circle cx={HERS.x + 80} cy={HERS.y - 10} r={54} fill="#2a1630" /><rect x={HERS.x - 5} y={HERS.y + 90} width={180} height={200} rx={60} fill="#2a1630" />
    </g>
  </g>;
};

const Scene: React.FC<{t: number}> = ({t}) => {
  const cam = camAt(CAM, t);
  const next = camAt(CAM, t + 1 / 60);
  const blur = Math.min(36, (Math.abs(next.cx - cam.cx) * 60 * cam.s) / 110);
  const shut = recap(t) ? 1 : 1 - smooth(t, B.open, B.open + 0.6);
  const dips = Math.max(hold(t, B.next - 0.4, B.next - 0.15, B.next + 0.05, B.next + 0.35), ...spec.dips.map((d) => hold(t, d - 0.25, d, d + 0.1, d + 0.4)));
  return <svg width={1080} height={1920}>
    <Defs blur={blur} />
    <g filter={blur > 0.5 ? 'url(#whip)' : undefined}>
      <g transform={planeT(cam, 0.35)}><Far /></g>
      <g transform={planeT(cam, 0.7)}><Rain t={t} n={60} o={0.18} seed={7} /></g>
      <g transform={planeT(cam, 1)}>
        <Alley t={t} herLamp={1} />
        <Buildings t={t} />
        <Window x={HIS.x} y={HIS.y} id="his" lamp={1} tone="his" t={t} front={<SignFor who="him" x={HIS.x} y={HIS.y} t={t} />}>
          <Person x={HIS.x} y={HIS.y} who="him" p={poseOf('him', t)} t={t} glow={0} id="him" />
        </Window>
        <Window x={HERS.x} y={HERS.y} id="hers" lamp={1} tone="hers" t={t} shut={shut}
          front={!recap(t) && <>{joHere(t) && <SignFor who="jo" x={JO_X(t) - 55} y={HERS.y} t={t} scale={0.82} />}<SignFor who="her" x={MIRA_X(t)} y={HERS.y} t={t} /></>}>
          {!recap(t) && <HerRoom t={t} />}
        </Window>
        {recap(t) && <CurtainShadows k={1} />}
        <Bulbs t={t} herLamp={1} />
      </g>
      <g transform={planeT(cam, 1.3)}><Rain t={t} n={110} o={0.32} seed={4} /></g>
    </g>
    <rect width={1080} height={1920} fill="#05061a" opacity={dips} />
    {spec.strips.map((s, i) => <Strip key={i} text={s.text} y={s.y} k={hold(t, s.from, s.from + 0.35, s.to - 0.3, s.to)} rot={i % 2 ? 1.2 : -1.5} size={s.y === 330 ? 54 : 46} />)}
    <rect width={1080} height={1920} fill="#05061a" opacity={0.72 * smooth(t, B.endcard, B.endcard + 0.6)} />
    <Strip text="Across the Alley" y={800} k={smooth(t, B.endcard + 0.3, B.endcard + 0.8)} size={82} rot={-2} />
    <Strip text="part 3" y={960} k={smooth(t, B.endcard + 0.6, B.endcard + 1.1)} size={58} rot={1.5} />
    <Strip text="part 4 tomorrow" y={1090} k={smooth(t, B.endcard + 1.1, B.endcard + 1.6)} size={50} rot={-1} />
  </svg>;
};

export const Alley3: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  return <AbsoluteFill style={{background: C.sky0}}>
    <Audio src={staticFile('audio/alley-ep3-rain.wav')} volume={0.5} />
    <Audio src={staticFile('audio/alley-ep3-music.wav')} volume={0.8} />
    <Audio src={staticFile('audio/alley-ep3-sfx.wav')} volume={0.9} />
    <Scene t={t} />
  </AbsoluteFill>;
};
