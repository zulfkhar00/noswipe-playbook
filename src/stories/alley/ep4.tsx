import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, hold, lerp, smooth} from '../../lib/motion';
import {Alley, Buildings, Bulbs, C, Defs, Far, HERS, HIS, HeldPhone, Jo, Person, Pose, Rain, Sign, Strip, Window, camAt, planeT} from './world';
import spec from '../../../specs/stories/alley-ep4.json';

// Across the Alley, episode 4: "The Friend". Recap: "I move away in 3 weeks." The next night Mira is
// swiping again with Jo judging her phone; Theo gets a new match, looks across, and turns his phone
// face down. Signs: "you're still swiping?" / "my roommate says I'm hopeless." / Jo: "I don't swipe."
// "how??" "I use NoSwipe." "they swipe. I show up." / Mira: "she's unbearable." (NoSwipe's first mention:
// Jo's thing, not the answer to Theo and Mira.) A week later, his phone buzzing face down, he holds up "coffee?
// downstairs. 10am". She picks up her pen, and writes nothing.

export const ALLEY4_FPS = 60;
export const ALLEY4_FRAMES = Math.ceil(spec.duration * ALLEY4_FPS);
const B = spec.beats;
type SignSpec = {who: string; text: string; write: number; up: number; down: number};
const SIGNS = spec.signs as SignSpec[];

const CAM: [number, number, number, number][] = [
  [0, 540, 930, 1.06], [3.3, 540, 930, 1.08], [3.7, HERS.x, 930, 1.8], [5.0, HERS.x, 930, 1.88], [5.5, HIS.x, 930, 1.9], [7.9, HIS.x, 930, 2.0],
  [8.4, 540, 930, 1.06], [17.6, 540, 930, 1.1], [18.2, HERS.x + 20, 930, 1.95], [23.0, HERS.x + 20, 930, 2.0],
  [23.5, 540, 930, 1.06], [26.9, 540, 930, 1.08], [27.5, HIS.x, 930, 1.85], [31.4, HIS.x, 930, 1.95], [31.9, HERS.x, 930, 1.9],
  [34.0, HERS.x, 930, 2.0], [34.5, 540, 930, 1.04], [37.4, 540, 930, 1.0], [41.5, 540, 930, 0.98],
];

const signOf = (who: string, t: number) => SIGNS.find((s) => s.who === who && t >= s.write - 0.1 && t < s.down + 0.5);
const recap = (t: number) => t < B.next;
const joHere = (t: number) => t >= B.next && t < B.joOut + 0.8;
const MIRA_X = (t: number) => HERS.x - 75 * (1 - smooth(t, B.joOut + 0.4, B.joOut + 1.0));
const JO_X = (t: number) => HERS.x + 78 + 160 * smooth(t, B.joOut, B.joOut + 0.8);
const swiping = (t: number) => t >= B.next && t < B.herSees + 0.3;
const holdsPhone = (t: number) => t >= B.next && t < B.faceDown;

const poseOf = (who: 'him' | 'her', t: number): Pose => {
  const sign = signOf(who, t);
  let hands: Pose['hands'] = 'none', look = who === 'him' ? 1 : -1, tilt = 0, bob = 0;
  if (sign) hands = t < sign.up - 0.3 ? 'write' : t < sign.down ? 'sign' : 'none';
  if (hands === 'write') { look = 0; tilt = who === 'him' ? 10 : -10; }
  if (who === 'him') {
    if (recap(t)) { bob = 26; tilt = 18; look = 0.2; }
    // A new match: he looks down at it, then up at her window, and puts it face down.
    if (holdsPhone(t)) { hands = 'phone'; look = t < B.lookUp ? 0 : 1; tilt = t < B.lookUp ? 10 : 0; }
  } else {
    if (swiping(t)) { hands = 'phone'; look = t < B.herSees ? 0 : 1; tilt = t < B.herSees ? -10 : 0; }
    // An eye-roll at Jo's sign, then the pen over a blank page.
    if (t > B.rollEyes && t < B.rollEyes + 0.6) { tilt = -14 * Math.sin(Math.PI * (t - B.rollEyes) / 0.6); look = -1; }
    if (t >= B.herLooks && t < B.pen) look = -1;
    if (t >= B.stall && t < B.sting + 2) { hands = 'write'; look = -0.4; tilt = -6; }
  }
  return {look, hands, bob, tilt};
};

const SignFor: React.FC<{who: string; x: number; y: number; t: number; scale?: number}> = ({who, x, y, t, scale = 1}) => {
  const sign = signOf(who, t);
  if (!sign) return null;
  const lift = smooth(t, sign.up - 0.4, sign.up), drop = smooth(t, sign.down, sign.down + 0.4);
  const sy = lerp(lerp(y + 170, y + 115, lift), y + 330, drop);
  const k = clamp((t - sign.write) / Math.max(0.3, sign.up - 0.4 - sign.write));
  const rot = lerp(-6, who === 'him' ? 2 : -2, lift);
  return <Sign x={x} y={sy} text={sign.text} k={sign.text ? k : 0} who={who === 'him' ? 'him' : 'her'} s={lerp(0.92, 1, lift) * scale} rot={rot} />;
};

/** His phone, face down on the counter from `faceDown` on; it lights the counter when it buzzes. */
const FaceDown: React.FC<{t: number}> = ({t}) => {
  if (t < B.faceDown) return null;
  const x = HIS.x + 132, y = HIS.y + 150;
  const lit = Math.max(...[B.buzz2, B.buzz3].map((b) => hold(t, b, b + 0.05, b + 0.7, b + 1.1)));
  const jig = lit > 0.3 ? 2.5 * Math.sin(t * 90) : 0;
  return <g transform={`translate(${jig} 0)`}>
    <ellipse cx={x} cy={y + 8} rx={70} ry={16} fill={C.glow} opacity={0.4 * lit} />
    <rect x={x - 26} y={y - 5} width={52} height={11} rx={4} fill="#0a0b1c" stroke={C.glow} strokeOpacity={0.25 + 0.6 * lit} strokeWidth={2} />
  </g>;
};

const HisRoom: React.FC<{t: number}> = ({t}) => <g>
  <Person x={HIS.x} y={HIS.y} who="him" p={poseOf('him', t)} t={t} glow={holdsPhone(t) ? 1 : 0} id="him" />
  {holdsPhone(t) && <HeldPhone x={HIS.x} y={HIS.y + 125} glow={1} flick={0} notif={smooth(t, B.buzz + 0.1, B.buzz + 0.35)} />}
  <FaceDown t={t} />
</g>;

const HerRoom: React.FC<{t: number}> = ({t}) => {
  const x = MIRA_X(t);
  const flick = swiping(t) && t < B.herSees ? ((t - B.next) % 0.9) / 0.9 : 0;
  const point = joHere(t) ? hold(t, B.next + 0.6, B.next + 1.0, B.herSees - 0.4, B.herSees) : 0;
  return <g>
    {joHere(t) && <Jo x={JO_X(t)} y={HERS.y} hood={1} k={1 - smooth(t, B.joOut + 0.3, B.joOut + 0.8)} t={t} waveAt={B.joOut}
      point={point} px={x + 30} py={HERS.y + 110} />}
    <Person x={x} y={HERS.y} who="her" p={poseOf('her', t)} t={t} glow={swiping(t) ? 1 : 0} id="her" />
    {swiping(t) && <HeldPhone x={x} y={HERS.y + 125} glow={1 - smooth(t, B.herSees, B.herSees + 0.3)} flick={smooth(flick, 0.6, 0.9)} />}
  </g>;
};

const Scene: React.FC<{t: number}> = ({t}) => {
  const cam = camAt(CAM, t);
  const next = camAt(CAM, t + 1 / 60);
  const blur = Math.min(36, (Math.abs(next.cx - cam.cx) * 60 * cam.s) / 110);
  const dips = Math.max(hold(t, B.next - 0.4, B.next - 0.15, B.next + 0.05, B.next + 0.35), ...spec.dips.map((d) => hold(t, d - 0.25, d, d + 0.1, d + 0.4)));
  // The bulbs dim a little while she doesn't answer.
  const herLamp = 1 - 0.5 * smooth(t, B.sting, B.sting + 1.5);
  return <svg width={1080} height={1920}>
    <Defs blur={blur} />
    <g filter={blur > 0.5 ? 'url(#whip)' : undefined}>
      <g transform={planeT(cam, 0.35)}><Far /></g>
      <g transform={planeT(cam, 0.7)}><Rain t={t} n={60} o={0.18} seed={7} /></g>
      <g transform={planeT(cam, 1)}>
        <Alley t={t} herLamp={herLamp} />
        <Buildings t={t} />
        <Window x={HIS.x} y={HIS.y} id="his" lamp={1} tone="his" t={t} front={<SignFor who="him" x={HIS.x} y={HIS.y} t={t} />}>
          <HisRoom t={t} />
        </Window>
        <Window x={HERS.x} y={HERS.y} id="hers" lamp={1} tone="hers" t={t}
          front={<>{joHere(t) && <SignFor who="jo" x={JO_X(t) - 32} y={HERS.y} t={t} scale={0.82} />}<SignFor who="her" x={recap(t) ? HERS.x : Math.max(MIRA_X(t), HERS.x - 20)} y={HERS.y} t={t} /></>}>
          {recap(t) ? <Person x={HERS.x} y={HERS.y} who="her" p={{look: -1, hands: 'sign', bob: 0, tilt: 0}} t={t} glow={0} id="her" /> : <HerRoom t={t} />}
        </Window>
        <Bulbs t={t} herLamp={herLamp} />
      </g>
      <g transform={planeT(cam, 1.3)}><Rain t={t} n={110} o={0.32} seed={4} /></g>
    </g>
    <rect width={1080} height={1920} fill="#05061a" opacity={dips} />
    {spec.strips.map((s, i) => <Strip key={i} text={s.text} y={s.y} k={hold(t, s.from, s.from + 0.35, s.to - 0.3, s.to)} rot={i % 2 ? 1.2 : -1.5} size={54} />)}
    <rect width={1080} height={1920} fill="#05061a" opacity={0.72 * smooth(t, B.endcard, B.endcard + 0.6)} />
    <Strip text="Across the Alley" y={800} k={smooth(t, B.endcard + 0.3, B.endcard + 0.8)} size={82} rot={-2} />
    <Strip text="part 4" y={960} k={smooth(t, B.endcard + 0.6, B.endcard + 1.1)} size={58} rot={1.5} />
    <Strip text="part 5 tomorrow" y={1090} k={smooth(t, B.endcard + 1.1, B.endcard + 1.6)} size={50} rot={-1} />
  </svg>;
};

export const Alley4: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  return <AbsoluteFill style={{background: C.sky0}}>
    <Audio src={staticFile('audio/alley-ep4-rain.wav')} volume={0.5} />
    <Audio src={staticFile('audio/alley-ep4-music.wav')} volume={0.8} />
    <Audio src={staticFile('audio/alley-ep4-sfx.wav')} volume={0.9} />
    <Scene t={t} />
  </AbsoluteFill>;
};
