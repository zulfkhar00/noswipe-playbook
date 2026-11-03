import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, hold, lerp, smooth} from '../../lib/motion';
import {Alley, Buildings, Bulbs, C, Defs, Far, HERS, HIS, Jo, MARKER, Person, Pose, Rain, Sign, Strip, WIN, Window, camAt, planeT} from './world';
import spec from '../../../specs/stories/alley-ep5.json';

// Across the Alley, episode 5: "Boxes". Recap: his coffee sign, her blank page. The next night her
// window is full of moving boxes and Jo is taping one shut; Mira is hiding. She comes to the glass:
// "sorry about coffee." / "didn't want to start anything." / "I can't finish." He holds up "3 weeks
// is something." and the bulbs flare. Night 18, more boxes: "what will you miss?" "this window."
// The last night: her window is bare and dark, and the bulbs go out.

export const ALLEY5_FPS = 60;
export const ALLEY5_FRAMES = Math.ceil(spec.duration * ALLEY5_FPS);
const B = spec.beats;
type SignSpec = {who: string; text: string; write: number; up: number; down: number};
const SIGNS = spec.signs as SignSpec[];

const CAM: [number, number, number, number][] = [
  [0, 540, 930, 1.06], [3.3, 540, 930, 1.08], [3.7, HERS.x, 930, 1.8], [6.8, HERS.x, 930, 1.9], [7.3, HIS.x, 930, 1.85], [8.0, HIS.x, 930, 1.9],
  [8.5, 540, 930, 1.06], [22.6, 540, 930, 1.1], [23.2, HIS.x, 930, 1.9], [24.4, HIS.x, 930, 1.95], [24.8, HERS.x, 930, 1.9], [26.6, HERS.x, 930, 1.95],
  [27.1, 540, 930, 1.06], [33.8, 540, 930, 1.08], [34.2, HERS.x, 930, 1.6], [36.0, HERS.x, 930, 1.75], [36.6, HIS.x, 930, 1.85], [38.4, HIS.x, 930, 1.95],
  [39.6, 540, 930, 1.04], [43.5, 540, 930, 1.0],
];

const signOf = (who: string, t: number) => SIGNS.find((s) => s.who === who && t >= s.write - 0.1 && t < s.down + 0.5);
const recap = (t: number) => t < B.next;
const empty = (t: number) => t >= B.last;
const joHere = (t: number) => t >= B.next && t < B.joOut + 0.8;
const miraHere = (t: number) => recap(t) || (t >= B.herIn && !empty(t));
const MIRA_X = (t: number) => recap(t) ? HERS.x : lerp(HERS.x + 230, HERS.x, smooth(t, B.herIn, B.herIn + 0.7));
const JO_X = (t: number) => HERS.x + 40 + 200 * smooth(t, B.joOut, B.joOut + 0.8);

const poseOf = (who: 'him' | 'her', t: number): Pose => {
  const sign = signOf(who, t);
  let hands: Pose['hands'] = 'none', look = who === 'him' ? 1 : -1, tilt = 0, bob = 0;
  if (sign) hands = t < sign.up - 0.3 ? 'write' : t < sign.down ? 'sign' : 'none';
  if (hands === 'write') { look = 0; tilt = who === 'him' ? 10 : -10; }
  if (who === 'him') {
    // A slump when he sees the boxes, and a longer one at the empty window.
    const slump = hold(t, B.sinks, B.sinks + 0.5, B.sinks + 0.9, B.sinks + 1.3) + smooth(t, B.sting, B.sting + 0.9);
    bob += 22 * slump; tilt += 14 * slump;
    if (t >= B.sting) look = 0.4;
  } else {
    // "3 weeks is something": she ducks her head, smiling.
    const h = hold(t, B.heart, B.heart + 0.3, B.heart + 1.2, B.heart + 1.6);
    tilt += -12 * h; bob += 8 * h;
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

/** A moving box: cardboard, a tape strip, a marker label. */
const Box: React.FC<{x: number; y: number; w: number; h: number; label: string; k: number}> = ({x, y, w, h, label, k}) => k <= 0 ? null
  : <g opacity={k} transform={`translate(0 ${-30 * (1 - k)})`} filter="url(#paper)">
    <rect x={x - w / 2} y={y - h} width={w} height={h} fill={C.card} />
    <rect x={x - w / 2} y={y - h} width={w} height={8} fill={C.card2} />
    <rect x={x - 9} y={y - h} width={18} height={h * 0.45} fill="#e9dcb5" opacity={0.8} />
    <text x={x} y={y - h * 0.3} textAnchor="middle" fontFamily={MARKER} fontWeight={700} fontSize={Math.min(30, w / label.length * 1.5)} fill={C.pen}>{label}</text>
  </g>;

/** Her room's boxes: three the first night, five by night 18, none on the last night. */
const Boxes: React.FC<{t: number}> = ({t}) => {
  if (recap(t) || empty(t)) return null;
  const late = t >= spec.dips[0];
  const base = HERS.y + 220, l = HERS.x - WIN.w / 2;
  const all = [
    {x: l + 120, y: base, w: 120, h: 90, label: 'BOOKS'}, {x: l + 240, y: base, w: 110, h: 100, label: 'KITCHEN'}, {x: l + 118, y: base - 90, w: 100, h: 70, label: 'MIRA'},
    {x: l + 182, y: base + 4, w: 74, h: 56, label: 'ART'}, {x: l + 242, y: base - 100, w: 100, h: 80, label: 'LAMP'},
  ];
  return <g>{all.slice(0, late ? 5 : 3).map((b, i) => <Box key={b.label} {...b} k={late ? 1 : smooth(t, B.next + 0.2 + i * 0.15, B.next + 0.5 + i * 0.15)} />)}</g>;
};

const HerRoom: React.FC<{t: number}> = ({t}) => <g>
  {joHere(t) && <Jo x={JO_X(t)} y={HERS.y} hood={1} k={1 - smooth(t, B.joOut + 0.3, B.joOut + 0.8)} t={t} waveAt={99}
    point={hold(t, B.joPoint, B.joPoint + 0.3, B.joOut - 0.2, B.joOut)} px={HERS.x + 200} py={HERS.y + 40} />}
  {miraHere(t) && <Person x={MIRA_X(t)} y={HERS.y} who="her" p={poseOf('her', t)} t={t} glow={0} id="her" />}
  {/* Jo taping a box shut: a strip of tape pulled across. */}
  {joHere(t) && t < B.hisSees + 1 && <rect x={HERS.x - 40} y={HERS.y + 190} width={140 * smooth(t, B.tape, B.tape + 0.5)} height={14} fill="#e9dcb5" opacity={0.9} />}
  <Boxes t={t} />
</g>;

const Scene: React.FC<{t: number}> = ({t}) => {
  const cam = camAt(CAM, t);
  const next = camAt(CAM, t + 1 / 60);
  const blur = Math.min(36, (Math.abs(next.cx - cam.cx) * 60 * cam.s) / 110);
  const dips = Math.max(hold(t, B.next - 0.4, B.next - 0.15, B.next + 0.05, B.next + 0.35), ...spec.dips.map((d) => hold(t, d - 0.25, d, d + 0.1, d + 0.4)));
  // The last night her lamp is off and the bulbs die, one flicker at a time.
  const herLamp = empty(t) ? 0.12 : 1;
  const bulbs = empty(t) ? (1 - smooth(t, B.dark, B.dark + 1.2)) * (0.6 + 0.4 * Math.sin(t * 31)) : 1;
  return <svg width={1080} height={1920}>
    <Defs blur={blur} />
    <g filter={blur > 0.5 ? 'url(#whip)' : undefined}>
      <g transform={planeT(cam, 0.35)}><Far /></g>
      <g transform={planeT(cam, 0.7)}><Rain t={t} n={60} o={0.18} seed={7} /></g>
      <g transform={planeT(cam, 1)}>
        <Alley t={t} herLamp={bulbs} />
        <Buildings t={t} />
        <Window x={HIS.x} y={HIS.y} id="his" lamp={1} tone="his" t={t} front={<SignFor who="him" x={HIS.x} y={HIS.y} t={t} />}>
          <Person x={HIS.x} y={HIS.y} who="him" p={poseOf('him', t)} t={t} glow={0} id="him" />
        </Window>
        <Window x={HERS.x} y={HERS.y} id="hers" lamp={herLamp} tone="hers" t={t} bare={empty(t) ? 1 : 0}
          front={!empty(t) && <>{joHere(t) && <SignFor who="jo" x={JO_X(t) - 20} y={HERS.y} t={t} scale={0.82} />}<SignFor who="her" x={Math.max(MIRA_X(t), HERS.x - 20)} y={HERS.y} t={t} /></>}>
          <HerRoom t={t} />
        </Window>
        <Bulbs t={t} herLamp={bulbs} flash={hold(t, B.flash, B.flash + 0.2, B.flash + 0.8, B.flash + 1.4)} />
      </g>
      <g transform={planeT(cam, 1.3)}><Rain t={t} n={110} o={0.32} seed={4} /></g>
    </g>
    <rect width={1080} height={1920} fill="#05061a" opacity={dips} />
    {spec.strips.map((s, i) => <Strip key={i} text={s.text} y={s.y} k={hold(t, s.from, s.from + 0.35, s.to - 0.3, s.to)} rot={i % 2 ? 1.2 : -1.5} size={s.y === 330 ? 54 : 46} />)}
    <rect width={1080} height={1920} fill="#05061a" opacity={0.72 * smooth(t, B.endcard, B.endcard + 0.6)} />
    <Strip text="Across the Alley" y={800} k={smooth(t, B.endcard + 0.3, B.endcard + 0.8)} size={82} rot={-2} />
    <Strip text="part 5" y={960} k={smooth(t, B.endcard + 0.6, B.endcard + 1.1)} size={58} rot={1.5} />
    <Strip text="the last part tomorrow" y={1090} k={smooth(t, B.endcard + 1.1, B.endcard + 1.6)} size={50} rot={-1} />
  </svg>;
};

export const Alley5: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  return <AbsoluteFill style={{background: C.sky0}}>
    <Audio src={staticFile('audio/alley-ep5-rain.wav')} volume={0.5} />
    <Audio src={staticFile('audio/alley-ep5-music.wav')} volume={0.8} />
    <Audio src={staticFile('audio/alley-ep5-sfx.wav')} volume={0.9} />
    <Scene t={t} />
  </AbsoluteFill>;
};
