import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, hold, lerp, smooth} from '../../lib/motion';
import {Alley, Buildings, Bulbs, C, Defs, Far, HERS, HIS, HeldPhone, Person, Pose, Rain, Sign, Strip, Window, camAt, planeT} from './world';
import spec from '../../../specs/stories/alley-ep1.json';

// Across the Alley, episode 1: "same". Theo can't stop swiping at 2 AM; neither can Mira, across the
// alley. His phone slips, they see each other, and they start talking with signs held to the glass.
// She asks his name; he starts writing; a match buzzes, he looks down, and her window goes dark.

export const ALLEY1_FPS = 60;
export const ALLEY1_FRAMES = Math.ceil(spec.duration * ALLEY1_FPS);
const B = spec.beats;
type SignSpec = {who: string; text: string; write: number; up: number; down: number; stop?: number};
const SIGNS = spec.signs as SignSpec[];

// Camera keys: [t, cx, cy, zoom]. Close on him, whip to her, pull back wide, settle on the two windows
// for the signs, push to her for the name, whip to him, pull back to her dark window.
const CAM: [number, number, number, number][] = [
  [0, 540, 900, 0.86], [2.6, 540, 920, 0.95], [3.6, HIS.x, 930, 2.0], [4.9, HIS.x, 930, 2.06], [5.35, HERS.x, 930, 2.06], [6.35, HERS.x, 930, 2.12],
  [7.3, 540, 960, 1.0], [9.0, 540, 950, 1.0], [11.9, 540, 930, 1.06], [29.6, 540, 930, 1.08],
  [30.4, HERS.x, 930, 1.95], [33.1, HERS.x, 930, 2.02], [33.5, HIS.x, 930, 1.95], [35.1, HIS.x, 960, 2.05], [35.55, HIS.x + 45, 1020, 4.2], [36.8, HIS.x + 45, 1025, 4.3],
  [37.4, 540, 930, 1.06], [41.2, 540, 930, 1.1], [45, 540, 930, 1.12],
];

/** Which sign a person is handling at t, and its state. */
const signOf = (who: string, t: number) => SIGNS.find((s) => s.who === who && t >= s.write - 0.1 && t < s.down + 0.5);

const swipeFlick = (t: number, off: number) => smooth(((t + off) % 1.15) / 1.15, 0.55, 0.85);

const personState = (who: 'him' | 'her', t: number) => {
  const sign = signOf(who, t);
  const hidden = t >= B.hide;
  const towards = who === 'him' ? 1 : -1;
  const sees = t >= (who === 'him' ? B.hisLook : B.herLook);
  let hands: Pose['hands'] = !hidden ? 'phone' : t < B.hide + 4 ? 'hide' : 'none';
  if (sign) hands = t < sign.up - 0.3 ? 'write' : t < sign.down ? 'sign' : 'none';
  let look = sees ? towards : 0, tilt = sees ? 0 : 12 * towards * -0.6;
  if (sign && hands === 'write') { look = 0; tilt = 10; }
  if (who === 'him' && t >= B.lookDown && t < B.lookUp) { look = 0.2; tilt = 14; }
  if (who === 'her' && t >= B.herSees) { look = lerp(-1, -0.2, smooth(t, B.herSees + 0.3, B.herSees + 0.6)); tilt = lerp(0, 10, smooth(t, B.herSees + 0.3, B.herSees + 0.6)); }
  const laugh = t > B.laugh && t < B.laughEnd ? Math.abs(Math.sin((t - B.laugh) * 13)) * 7 * (1 - smooth(t, B.laughEnd - 0.4, B.laughEnd)) : 0;
  const startle = who === 'her' ? hold(t, B.herLook - 0.05, B.herLook + 0.1, B.herLook + 0.4, B.herLook + 0.7) : hold(t, B.hisLook - 0.05, B.hisLook + 0.1, B.hisLook + 0.4, B.hisLook + 0.7);
  return {sign, hands, p: {look, hands, bob: -laugh - 12 * startle, tilt} as Pose};
};

const Room: React.FC<{who: 'him' | 'her'; t: number}> = ({who, t}) => {
  const W = who === 'him' ? HIS : HERS;
  const {sign, p, hands} = personState(who, t);
  const gone = who === 'her' && t >= B.dark;
  const phoneOn = t < B.hide ? 1 : 0;
  // The slip: his phone jumps out of his hands, spins, and its glow sweeps the ceiling.
  const u = clamp((t - B.drop) / 0.7);
  const slip = who === 'him' && u > 0 && u < 1;
  let sx = 0, sy = 0, sk = 0, sRot = 0;
  if (sign) {
    const lift = sign.stop && t > sign.stop && t < sign.up ? 0 : smooth(t, sign.up - 0.4, sign.up);
    const drop = smooth(t, sign.down, sign.down + 0.4);
    sx = W.x; sy = lerp(lerp(W.y + 170, W.y + 115, lift), W.y + 330, drop);
    sk = sign.stop ? clamp((t - sign.write) / (sign.stop - sign.write)) : clamp((t - sign.write) / Math.max(0.3, sign.up - 0.4 - sign.write));
    sRot = lerp(-6, who === 'him' ? 2 : -2, lift);
  }
  // His phone, lying on the bed after he hid it, lights up with the match.
  const buzz = who === 'him' ? smooth(t, B.buzz, B.buzz + 0.1) * (1 - smooth(t, B.lookUp - 0.1, B.lookUp + 0.3)) : 0;
  return <g opacity={gone ? 0 : 1}>
    {slip && <ellipse cx={W.x + 40 * Math.sin(u * 6)} cy={W.y - 190} rx={140} ry={40} fill={C.glow} opacity={0.5 * Math.sin(Math.PI * u)} />}
    <Person x={W.x} y={W.y} who={who} p={p} t={t} glow={phoneOn} id={who} />
    {hands === 'phone' && <HeldPhone x={W.x + (slip ? 30 * Math.sin(u * 3) : 0)} y={W.y + 125 - (slip ? 170 * Math.sin(Math.PI * u) : 0)} rot={slip ? 540 * u : 0}
      glow={1} flick={swipeFlick(t, who === 'him' ? 0 : 0.4)} />}
    {sign && <Sign x={sx} y={sy} text={sign.text} k={sk} who={who} s={lerp(0.92, 1, smooth(t, sign.up - 0.4, sign.up))} rot={sRot} />}
    {/* The match: his phone buzzes on the bed, he picks it up in front of his half-written sign. */}
    {buzz > 0 && <HeldPhone x={lerp(W.x + 120, W.x + 45, smooth(t, B.lookDown, B.lookDown + 0.3)) + 3 * Math.sin(t * 90) * (t < B.buzz + 0.9 ? 1 : 0)}
      y={lerp(W.y + 200, W.y + 135, smooth(t, B.lookDown, B.lookDown + 0.3))} glow={buzz}
      flick={0} rot={lerp(-80, 0, smooth(t, B.lookDown, B.lookDown + 0.3))} notif={smooth(t, B.buzz + 0.1, B.buzz + 0.35)} />}
  </g>;
};

const Scene: React.FC<{t: number}> = ({t}) => {
  const cam = camAt(CAM, t);
  const next = camAt(CAM, t + 1 / 60);
  const speed = Math.abs(next.cx - cam.cx) * 60 * cam.s;
  const blur = Math.min(36, speed / 110);
  const herLamp = 1 - smooth(t, B.dark, B.dark + 0.12);
  return <svg width={1080} height={1920}>
    <Defs blur={blur} />
    <g filter={blur > 0.5 ? 'url(#whip)' : undefined}>
      <g transform={planeT(cam, 0.35)}><Far /></g>
      <g transform={planeT(cam, 0.7)}><Rain t={t} n={60} o={0.18} seed={3} /></g>
      <g transform={planeT(cam, 1)}>
        <Alley t={t} herLamp={herLamp} />
        <Buildings t={t} />
        <Window x={HIS.x} y={HIS.y} id="his" lamp={1} tone="his" t={t}><Room who="him" t={t} /></Window>
        <Window x={HERS.x} y={HERS.y} id="hers" lamp={herLamp} tone="hers" t={t} shut={smooth(t, B.shut, B.shut + 0.6)}><Room who="her" t={t} /></Window>
        <Bulbs t={t} herLamp={herLamp} />
      </g>
      <g transform={planeT(cam, 1.3)}><Rain t={t} n={110} o={0.32} /></g>
    </g>
    {spec.strips.map((s, i) => <Strip key={i} text={s.text} y={s.y} k={hold(t, s.from, s.from + 0.35, s.to - 0.3, s.to)} rot={i % 2 ? 1.2 : -1.5} size={i ? 50 : 60} />)}
    {/* End card. */}
    <rect width={1080} height={1920} fill="#05061a" opacity={0.72 * smooth(t, B.endcard, B.endcard + 0.6)} />
    <Strip text="Across the Alley" y={800} k={smooth(t, B.endcard + 0.3, B.endcard + 0.8)} size={82} rot={-2} />
    <Strip text="part 1" y={960} k={smooth(t, B.endcard + 0.6, B.endcard + 1.1)} size={58} rot={1.5} />
    <Strip text="part 2 tomorrow" y={1090} k={smooth(t, B.endcard + 1.1, B.endcard + 1.6)} size={50} rot={-1} />
  </svg>;
};

export const Alley1: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  return <AbsoluteFill style={{background: C.sky0}}>
    <Audio src={staticFile('audio/alley-ep1-rain.wav')} volume={0.5} />
    <Audio src={staticFile('audio/alley-ep1-music.wav')} volume={0.8} />
    <Audio src={staticFile('audio/alley-ep1-sfx.wav')} volume={0.9} />
    <Scene t={t} />
  </AbsoluteFill>;
};
