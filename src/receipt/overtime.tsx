import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, easeOut, hold, lerp, smooth} from '../lib/motion';
import {Cam3, Plane, Space, cam3At} from '../lib/space';
import {Line, chunksOf, speechOf, wordsOf, wrap} from '../lib/speech';
import {MotionBlurWhen, Shot, SwipeCuts, inCut} from '../lib/shots';
import {DISPLAY, K, Logo, SANS} from '../brand/brand';
import {Guy} from '../brand/characters';
import {Backdrop, BrandPhone, Captions, DateCard, EndCard, Grain, PROFILES, ProfileCard, SoftCta, SoftShadow, pop} from '../brand/scenes';
import spec from '../../specs/overtime.json';
import tlJson from './overtime.timeline.json';

// "Overtime": the first scene-led receipt (Receipt v2). The gym tells the story: a 90-second rest
// timer runs out and keeps counting while he swipes, his buddy gives up, the gym empties, the
// lights go off, the cleaner mops around him. Only then does the receipt print, as the punchline.
//
// The whole gym is one world (GymWorld) whose state is a function of time; each shot is just a
// camera on it. Everything is authored in screen coordinates as seen from the resting camera
// (At wraps a plane so that's true at any depth), which keeps layout predictable.

export const OVERTIME_FPS = 60;
const tl = tlJson as unknown as {lines: Line[]; beats: Record<string, number>; duration: number};
const B = tl.beats;
export const OVERTIME_FRAMES = Math.ceil(tl.duration * OVERTIME_FPS);

const SKIN = '#D9A27C';
const WET = '#FFD23F';
const NIGHT = '#1C1040';

/** A plane authored in screen coordinates for the resting camera (x 540, y 960, z 0). */
const At: React.FC<{z: number; noBlur?: boolean; children: React.ReactNode}> = ({z, noBlur, children}) =>
  <Plane z={z} noBlur={noBlur}><g transform={`translate(540 960) scale(${z / 1000}) translate(-540 -960)`}>{children}</g></Plane>;

/** Flat text that ignores the camera (scale 1), for on-screen context inside the safe band. */
const Hud: React.FC<{cam: Cam3; children: React.ReactNode}> = ({cam, children}) => <Plane z={1000 + cam.z} noBlur>{children}</Plane>;

const Headline: React.FC<{text: string; k: number; y?: number; size?: number; color?: string}> = ({text, k, y = 340, size = 70, color = K.grape}) => k <= 0.01 ? null :
  <g opacity={k} transform={`translate(0 ${(1 - k) * 16})`}>
    {wrap(text, 20).map((l, i, all) => <text key={i} x={540} y={y + i * (size + 8) - (all.length - 1) * (size + 8) / 2} textAnchor="middle" fontFamily={DISPLAY} fontSize={size}
      fill={color} stroke={color === K.grape ? K.paper : NIGHT} strokeWidth={14} paintOrder="stroke">{l}</text>)}
  </g>;

// ---------------------------------------------------------------------------------------------
// Time → story state.

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const fmtLong = (s: number) => `+${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/** The wall timer: counts 1:30 down (fast) to zero, flashes REST OVER, then counts up as overtime. */
const timerAt = (t: number): {label: string; value: string; over: boolean; flash: number} => {
  if (t >= B.payoff - 0.1) {
    const left = 90 - (t - B.payoff + 0.1) * 45;
    return left > 0 ? {label: 'REST', value: fmt(left), over: false, flash: 0} : {label: 'REST', value: 'GO', over: false, flash: 0};
  }
  if (t < B.timerout) return {label: 'REST', value: fmt(lerp(90, 0, clamp((t - B.setone) / (B.timerout - B.setone)))), over: false, flash: 0};
  const flash = 1 - smooth(t, B.timerout + 0.9, B.timerout + 1.3);
  // Overtime: slow at first, then a time-lapse spin from "set two" to the mop: +2:14:07.
  const slow = (Math.min(t, B.settwo) - B.timerout) * 6;
  const spin = Math.pow(smooth(t, B.settwo, B.mop), 1.6) * (8047 - slow);
  return {label: flash > 0.5 ? 'REST' : 'OVER', value: flash > 0.5 && Math.sin(t * 18) > -0.2 ? '0:00' : fmtLong(slow + spin), over: true, flash};
};

type Pose = {phone: number; lift: number; lookUp: number; relief: number};

const poseAt = (t: number): Pose => {
  if (t >= B.payoff - 0.1) return {phone: 0, lift: 0.6 + 0.4 * Math.abs(Math.sin((t - B.payoff) * 2.6)), lookUp: 1, relief: 0.8};
  if (t >= B.or - 0.05) return {phone: 0, lift: 0, lookUp: 1, relief: smooth(t, B.swipesself, B.booked)};
  if (t >= B.receipt - 0.1) return {phone: 1, lift: 0, lookUp: smooth(t, B.receipt + 0.4, B.receipt + 0.9), relief: 0};
  // Set two: one half rep, then straight back to the phone.
  const rep = hold(t, B.settwo - 0.3, B.settwo, B.settwo + 0.5, B.settwo + 0.9);
  const phone = smooth(t, B.rest + 0.3, B.rest + 0.9) * (1 - rep);
  return {phone, lift: rep * 0.45, lookUp: 1 - smooth(t, B.rest + 0.6, B.rest + 1.0) + rep * 0.5, relief: 0};
};

// ---------------------------------------------------------------------------------------------
// Pieces of the gym.

/** A flat gym-goer. pose: press (bar overhead), curl, stand (hands on hips), walk. */
const Person: React.FC<{x: number; y: number; s?: number; t: number; pose: 'press' | 'curl' | 'stand' | 'walk' | 'tap' | 'mop'; top?: string; skin?: string; phase?: number; face?: boolean; cap?: boolean}> =
  ({x, y, s = 1, t, pose, top = K.grape2, skin = '#B9825F', phase = 0, face = false, cap = false}) => {
    const c = Math.sin(t * 3.2 + phase);
    const arm = (sx: number, hx: number, hy: number) => <path d={`M ${sx * 70} -170 Q ${sx * 92} ${(-170 + hy) / 2} ${hx} ${hy}`} fill="none" stroke={K.grape} strokeWidth={34} strokeLinecap="round" />;
    let hands: [number, number, number, number] = [-110, -40, 110, -40];
    if (pose === 'press') { const up = 0.5 + 0.5 * c; hands = [-95, lerp(-260, -420, up), 95, lerp(-260, -420, up)]; }
    if (pose === 'curl') { const up = 0.5 + 0.5 * c; hands = [-80, lerp(-30, -170, up), 80, lerp(-30, -170, up)]; }
    if (pose === 'stand') hands = [-80, -60, 80, -60];
    if (pose === 'tap') { const tap = Math.max(0, Math.sin(t * 9)); hands = [-40, -130, 60 - 10 * tap, -140 + 8 * tap]; }
    if (pose === 'walk') hands = [-90 + 30 * c, -20, 90 - 30 * c, -20];
    if (pose === 'mop') hands = [40 + 30 * c, -110, 80 + 30 * c, -40];
    const legSwing = pose === 'walk' ? 26 * c : 0;
    return <g transform={`translate(${x} ${y + (pose === 'walk' ? Math.abs(c) * -8 : 0)}) scale(${s})`}>
      <ellipse cx={0} cy={6} rx={120} ry={18} fill={K.grape} opacity={0.18} />
      <path d={`M -36 -60 L ${-40 - legSwing} 0 M 36 -60 L ${40 + legSwing} 0`} stroke={K.grape} strokeWidth={42} strokeLinecap="round" />
      <rect x={-78} y={-250} width={156} height={200} rx={50} fill={top} stroke={K.grape} strokeWidth={7} />
      {arm(-1, hands[0], hands[1])}{arm(1, hands[2], hands[3])}
      {(pose === 'press' || pose === 'curl') && <g>
        {pose === 'press'
          ? <><rect x={-200} y={hands[1] - 7} width={400} height={14} rx={6} fill={K.grape} />
              {[-1, 1].map((d) => <rect key={d} x={d * 175 - 14} y={hands[1] - 44} width={28} height={88} rx={8} fill={K.coral} stroke={K.grape} strokeWidth={5} />)}</>
          : [-1, 1].map((d) => <rect key={d} x={hands[d < 0 ? 0 : 2] - 34} y={hands[d < 0 ? 1 : 3] - 14} width={68} height={28} rx={10} fill={K.lilac} stroke={K.grape} strokeWidth={5} />)}
      </g>}
      {pose === 'mop' && <g><path d={`M ${hands[0]} ${hands[1]} L ${hands[2] + 90} 10`} stroke={K.grape} strokeWidth={10} strokeLinecap="round" />
        <rect x={hands[2] + 40} y={0} width={110} height={26} rx={10} fill="#EDE6F7" stroke={K.grape} strokeWidth={5} /></g>}
      <circle cx={0} cy={-310} r={58} fill={skin} stroke={K.grape} strokeWidth={7} />
      {cap && <path d="M -60 -322 Q -50 -380 10 -380 Q 62 -376 62 -322 L 110 -318 L 60 -308 Z" fill={K.sky} stroke={K.grape} strokeWidth={6} strokeLinejoin="round" />}
      {face && <g>{[-1, 1].map((d) => <circle key={d} cx={d * 20} cy={-312} r={6} fill={K.grape} />)}
        <path d="M -16 -282 L 16 -284" stroke={K.grape} strokeWidth={6} strokeLinecap="round" /></g>}
    </g>;
  };

/** His arms (in Guy's local coordinates, origin at the neck) and what's in his hands. */
const Arms: React.FC<{t: number; p: Pose}> = ({t, p}) => {
  const down: [number, number] = [185, 430];
  const phone: [number, number] = [62, 330];
  const up: [number, number] = [230, -430];
  const hand = (sx: number): [number, number] => {
    const a: [number, number] = [lerp(down[0], phone[0], p.phone) * sx, lerp(down[1], phone[1], p.phone)];
    return [lerp(a[0], up[0] * sx, p.lift), lerp(a[1], up[1], p.lift)];
  };
  const flick = p.phone > 0.5 ? Math.max(0, Math.sin(t * 12.5)) : 0;
  return <g>
    {[-1, 1].map((sx) => {
      const [hx, hy] = hand(sx);
      const d = `M ${sx * 215} 230 Q ${sx * lerp(250, 290, Math.max(p.phone, p.lift))} ${(230 + hy) / 2 + 40} ${hx} ${hy}`;
      return <g key={sx}><path d={d} fill="none" stroke={K.grape} strokeWidth={84} strokeLinecap="round" /><path d={d} fill="none" stroke={K.lilac} strokeWidth={68} strokeLinecap="round" /></g>;
    })}
    {p.lift > 0.05 && <g transform={`translate(0 ${hand(1)[1]})`}>
      <rect x={-380} y={-12} width={760} height={24} rx={10} fill={K.grape} />
      {[-1, 1].map((d) => <g key={d}><rect x={d * 330 - 26} y={-90} width={52} height={180} rx={14} fill={K.coral} stroke={K.grape} strokeWidth={7} />
        <rect x={d * 280 - 18} y={-66} width={36} height={132} rx={10} fill={K.lilac} stroke={K.grape} strokeWidth={6} /></g>)}
    </g>}
    {p.phone > 0.4 && p.lift < 0.2 && <g transform={`translate(0 ${phone[1] - 40}) rotate(${-4 + 3 * flick})`} opacity={clamp((p.phone - 0.4) * 4)}>
      <rect x={-70} y={-120} width={140} height={230} rx={24} fill={K.grape} />
      <rect x={-56} y={-104} width={30} height={30} rx={10} fill={K.grape2} />
    </g>}
    {[-1, 1].map((sx) => { const [hx, hy] = hand(sx); return <circle key={sx} cx={hx + (p.phone > 0.5 && sx > 0 ? -6 * flick : 0)} cy={hy} r={40} fill={SKIN} stroke={K.grape} strokeWidth={8} />; })}
  </g>;
};

const RestTimer: React.FC<{t: number; dark: number}> = ({t, dark}) => {
  const s = timerAt(t);
  const red = s.over ? (s.flash > 0 ? (Math.sin(t * 18) > 0 ? 1 : 0.4) : 1) : 0;
  return <g transform="translate(540 470)">
    <rect x={-250} y={-105} width={500} height={210} rx={36} fill={K.grape} transform="translate(14 16)" />
    <rect x={-250} y={-105} width={500} height={210} rx={36} fill={NIGHT} stroke={K.grape} strokeWidth={9} />
    <rect x={-230} y={-85} width={460} height={170} rx={24} fill={s.over ? '#3A0F1F' : '#13241A'} />
    <text x={0} y={-36} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={38} letterSpacing={6} fill={s.over ? K.coral : K.lime} opacity={0.85}>{s.label}</text>
    <text x={0} y={60} textAnchor="middle" fontFamily={DISPLAY} fontSize={s.value.length > 6 ? 80 : 104} fill={s.over ? K.coral : K.lime} opacity={s.over ? 0.55 + 0.45 * red : 1}>{s.value}</text>
    {s.over && s.flash > 0.3 && <rect x={-250} y={-105} width={500} height={210} rx={36} fill="none" stroke={K.coral} strokeWidth={12} opacity={red} />}
    <rect x={-250} y={-105} width={500} height={210} rx={36} fill={NIGHT} opacity={dark * 0.15} />
  </g>;
};

const Plate: React.FC<{x: number; y: number; r: number; fill: string}> = ({x, y, r, fill}) =>
  <g><circle cx={x} cy={y} r={r} fill={fill} stroke={K.grape} strokeWidth={7} /><circle cx={x} cy={y} r={r * 0.25} fill={K.grape} /></g>;

/** The whole gym at time t; `payoff` resets it to a busy, lit gym for the last shot. */
const GymWorld: React.FC<{t: number; payoff?: boolean}> = ({t, payoff = false}) => {
  // Night falls and the place empties from "set two" to the mop.
  const dusk = payoff ? 0 : smooth(t, B.longer - 1.5, B.home + 0.5);
  const lights = payoff ? [1, 1, 1] : [0, 1, 2].map((i) => (t < B.home + 0.5 + i * 0.35 ? 1 : 0));
  const off = (3 - lights.reduce((a, b) => a + b, 0)) / 3;
  const leave = (i: number) => (payoff ? 0 : easeOut(t, B.longer - 1.2 + i * 0.7, B.longer - 0.2 + i * 0.7));
  const buddyIn = payoff ? 0 : easeOut(t, B.ago - 0.4, B.ago + 0.4);
  const buddyOut = payoff ? 1 : easeOut(t, B.patiently + 0.5, B.patiently + 1.5);
  const cleaner = payoff ? 0 : easeOut(t, B.mop - 1.2, B.mop - 0.1);
  const p = poseAt(t);
  const sky = dusk < 0.5 ? K.sky : '#3B2E7A';
  return <>
    {/* Back wall, window and the ceiling lights. */}
    <At z={2600}>
      <rect x={-2600} y={-2600} width={6300} height={7000} fill={dusk > 0.5 ? '#4A3B7A' : '#F3EADF'} />
      <rect x={-420} y={60} width={560} height={420} rx={24} fill={sky} stroke={K.grape} strokeWidth={14} />
      <circle cx={-140} cy={dusk > 0.5 ? 230 : 330} r={110} fill={dusk > 0.5 ? '#FFF8F0' : K.lilac} opacity={0.9} />
      <rect x={-150} y={60} width={14} height={420} fill={K.grape} />
      {[0, 1, 2].map((i) => <g key={i}>
        <rect x={-560 + i * 760} y={-210} width={560} height={46} rx={22} fill={lights[i] ? '#FFFBE6' : K.grape2} stroke={K.grape} strokeWidth={8} />
        {lights[i] > 0 && <ellipse cx={-280 + i * 760} cy={-140} rx={360} ry={90} fill="#FFFBE6" opacity={0.25} />}
      </g>)}
      {/* The mirror wall. */}
      <rect x={260} y={200} width={2200} height={760} fill={dusk > 0.5 ? '#2D2560' : '#DDEFF6'} stroke={K.grape} strokeWidth={12} />
      {[0, 1, 2, 3].map((i) => <path key={i} d={`M ${400 + i * 520} 960 L ${640 + i * 520} 200`} stroke="#FFFFFF" strokeWidth={60} opacity={dusk > 0.5 ? 0.05 : 0.35} />)}
      <rect x={-2600} y={960} width={6300} height={2400} fill={dusk > 0.5 ? '#2B2150' : '#E5D8C6'} />
    </At>
    {/* Background lifters (they head home one by one). */}
    <At z={1900}>
      <>
        <g transform={`translate(${-1300 * leave(0)} 0)`}><Person x={170} y={1010} s={0.95} t={t} pose={leave(0) > 0.02 && !payoff ? 'walk' : 'press'} top={K.coral} /></g>
        <g transform={`translate(${1500 * leave(1)} 0)`}><Person x={1010} y={1000} s={0.9} t={t} pose={leave(1) > 0.02 && !payoff ? 'walk' : 'curl'} top={K.grape2} phase={1.4} skin="#8A5A3C" /></g>
        <g transform={`translate(${1400 * leave(2)} 0)`}><Person x={1290} y={1020} s={0.95} t={t} pose={leave(2) > 0.02 && !payoff ? 'walk' : 'press'} top={K.lilac} phase={2.2} skin="#F1C7A6" /></g>
      </>
    </At>
    {/* Squat rack with plates, right; a plate tree, left. */}
    <At z={1500}>
      <g transform="translate(980 640)">
        <rect x={-190} y={-40} width={30} height={560} fill={K.grape} /><rect x={160} y={-40} width={30} height={560} fill={K.grape} />
        <rect x={-260} y={110} width={520} height={22} rx={10} fill={K.grape2} stroke={K.grape} strokeWidth={5} />
        <Plate x={-215} y={121} r={70} fill={K.coral} /><Plate x={215} y={121} r={70} fill={K.coral} />
        <Plate x={-120} y={420} r={90} fill={K.lilac} /><Plate x={60} y={440} r={70} fill={K.lime} />
      </g>
      <g transform="translate(-40 780)">
        <rect x={-12} y={-160} width={24} height={460} fill={K.grape} />
        <Plate x={0} y={-90} r={80} fill={K.lime} /><Plate x={0} y={90} r={96} fill={K.coral} /><Plate x={0} y={260} r={70} fill={K.lilac} />
      </g>
    </At>
    {/* The rest timer, high on the wall but inside the safe band. */}
    <At z={1300}><RestTimer t={t} dark={off} /></At>
    {/* Lights-off: everything behind him goes dark. */}
    {off > 0 && <At z={1240} noBlur><rect x={-3000} y={-3000} width={7000} height={8000} fill={NIGHT} opacity={0.55 * off} /></At>}
    {/* His buddy, near right: arrives, taps his wrist, gives up and leaves. */}
    {buddyIn > 0 && buddyOut < 1 && <At z={1080}>
      <g transform={`translate(${(1 - buddyIn) * 600 + buddyOut * 700} 0)`}>
        <Person x={930} y={1250} s={1.25} t={t} pose={buddyIn < 1 || buddyOut > 0.02 ? 'walk' : t > B.buddy ? 'tap' : 'stand'} top={K.coral} skin="#A8744F" face />
      </g>
    </At>}
    {/* Him, on the bench. */}
    <At z={1150}>
      <rect x={250} y={1110} width={580} height={70} rx={30} fill={K.coral} stroke={K.grape} strokeWidth={8} />
      <g transform="translate(540 870) scale(0.78)">
        <Guy t={t} relief={p.relief} lookDown={1 - p.lookUp} />
        <path d="M -230 170 Q -160 120 -120 190 L -150 330 Q -220 300 -230 170 Z" fill="#FFFFFF" stroke={K.grape} strokeWidth={7} />
        <Arms t={t} p={p} />
      </g>
      {/* Phone glow on his face in the dark. */}
      <defs><radialGradient id="ot-glow"><stop offset="0" stopColor={K.lilac} stopOpacity={0.45} /><stop offset="1" stopColor={K.lilac} stopOpacity={0} /></radialGradient></defs>
      {off > 0 && p.phone > 0.5 && <ellipse cx={540} cy={860} rx={300} ry={320} fill="url(#ot-glow)" opacity={off} />}
      {off > 0 && <rect x={200} y={500} width={680} height={800} fill={NIGHT} opacity={0.25 * off} />}
    </At>
    {/* Floor: rubber mat seams, a dumbbell pair and his water bottle (decorative, bottom band). */}
    <At z={950}>
      {[0, 1, 2, 3].map((i) => <line key={i} x1={-400} x2={1480} y1={1330 + i * 150} y2={1330 + i * 150} stroke={K.grape} strokeWidth={4} opacity={0.12} />)}
      <g transform="translate(150 1360)"><rect x={-90} y={-10} width={180} height={20} rx={8} fill={K.grape} />
        {[-1, 1].map((d) => <rect key={d} x={d * 70 - 22} y={-50} width={44} height={100} rx={14} fill={K.coral} stroke={K.grape} strokeWidth={7} />)}</g>
      <g transform="translate(930 1330)"><rect x={-40} y={-120} width={80} height={170} rx={26} fill={K.sky} stroke={K.grape} strokeWidth={7} />
        <rect x={-26} y={-150} width={52} height={36} rx={10} fill={K.lime} stroke={K.grape} strokeWidth={6} /></g>
      {off > 0 && <rect x={-1000} y={1150} width={3000} height={1200} fill={NIGHT} opacity={0.5 * off} />}
    </At>
    {/* The cleaner (with the wet-floor sign) mops right around him. */}
    {cleaner > 0 && <At z={1020}>
      <g transform={`translate(${(1 - cleaner) * -700} 0)`}>
        <Person x={170} y={1260} s={1.15} t={t * 1.4} pose="mop" top={K.sky} skin="#C98F6A" cap face />
      </g>
      <g transform={`translate(780 1235) scale(${pop(t, B.mop - 0.2, 8)})`}>
        <path d="M -70 0 L 0 -200 L 70 0 Z" fill={WET} stroke={K.grape} strokeWidth={8} strokeLinejoin="round" />
        <text x={0} y={-40} textAnchor="middle" fontFamily={DISPLAY} fontSize={44} fill={K.grape}>!</text>
      </g>
    </At>}
  </>;
};

// ---------------------------------------------------------------------------------------------
// Shots.

const key = (t: number, x: number, y: number, z: number, rot = 0, focus = 1150, aperture = 5) => ({t, x, y, z, rot, focus, aperture});

const GymShot: React.FC<{t: number; keys: ReturnType<typeof key>[]; payoff?: boolean; text?: string; textK?: number; dark?: boolean; children?: (cam: Cam3) => React.ReactNode}> =
  ({t, keys, payoff, text, textK = 0, dark, children}) => {
    const cam = cam3At(keys, t);
    return <Space cam={cam} id="ot-gym" bg="#F3EADF">
      <GymWorld t={t} payoff={payoff} />
      {children?.(cam)}
      {text && <Hud cam={cam}><Headline text={text} k={textK} color={dark ? K.paper : K.grape} /></Hud>}
    </Space>;
  };

/** A big close phone in his hand, cards flicking under his thumb. */
const PhoneInsert: React.FC<{t: number; from: number; self?: boolean}> = ({t, from, self = false}) => {
  const loop = self ? 0.32 : 0.5;
  const el = Math.max(0, t - from), i = Math.floor(el / loop), ph = (el / loop) % 1;
  const k = Math.pow(clamp((ph - 0.5) / 0.45), 2);
  const dir = self ? 1 : -1;
  return <g>
    <BrandPhone x={300} y={500} w={480} h={760} />
    <clipPath id="pi-clip"><rect x={322} y={522} width={436} height={716} rx={54} /></clipPath>
    <g clipPath="url(#pi-clip)">
      <g transform="translate(540 880) scale(0.72) translate(-540 -695)"><ProfileCard p={PROFILES[(i + 1) % PROFILES.length]} /></g>
      <g transform={`translate(${dir * 520 * k} ${-30 * k}) rotate(${dir * 18 * k} 540 900)`}>
        <g transform="translate(540 880) scale(0.72) translate(-540 -695)"><ProfileCard p={PROFILES[i % PROFILES.length]} /></g>
      </g>
    </g>
    {!self && <g transform={`translate(${700 - 60 * Math.max(0, Math.sin(el / loop * Math.PI * 2))} 1080)`}>
      <ellipse rx={58} ry={110} fill={SKIN} stroke={K.grape} strokeWidth={8} transform="rotate(-30)" />
    </g>}
  </g>;
};

const ReceiptBurst: React.FC<{t: number}> = ({t}) => {
  const r = spec.receipt;
  const rows: {at: number; h: number; node: (y: number, k: number) => React.ReactNode}[] = [
    {at: B.receipt, h: 120, node: (y) => <>
      <text x={740} y={y + 62} textAnchor="middle" fontFamily={DISPLAY} fontSize={40} fill={K.grape}>{r.header}</text>
      <text x={740} y={y + 100} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={26} fill={K.grape3}>2026 · thank you for swiping</text></>},
    ...r.items.map((it, i) => ({at: B.receipt + 0.18 + i * 0.16, h: 84, node: (y: number) => <>
      <text x={500} y={y + 54} fontFamily={SANS} fontWeight={700} fontSize={34} fill={K.grape}>{it.label}</text>
      <text x={980} y={y + 58} textAnchor="end" fontFamily={DISPLAY} fontSize={56} fill={K.coral}>{it.value}</text>
      <line x1={496} x2={984} y1={y + 80} y2={y + 80} stroke={K.grape3} strokeWidth={2} strokeDasharray="6 8" opacity={0.5} /></>})),
    {at: B.total, h: 170, node: (y, k) => <>
      <line x1={490} x2={990} y1={y + 10} y2={y + 10} stroke={K.grape} strokeWidth={5} />
      <text x={500} y={y + 58} fontFamily={SANS} fontWeight={800} fontSize={32} fill={K.grape}>{r.total.label}</text>
      <g transform={`translate(740 ${y + 146}) scale(${1 + 0.5 * Math.max(0, 1 - k * 1.4)})`}><text textAnchor="middle" fontFamily={DISPLAY} fontSize={100} fill={K.coral}>{r.total.value}</text></g></>},
    {at: B.workouts, h: 100, node: (y) => <>
      <text x={740} y={y + 52} textAnchor="middle" fontFamily={DISPLAY} fontSize={44} fill={K.grape}>{r.equivalent.text}</text>
      <text x={740} y={y + 88} textAnchor="middle" fontFamily={SANS} fontWeight={600} fontSize={26} fill={K.grape3}>({r.equivalent.math})</text></>},
  ];
  const SLOT = 1110;
  const prog = (a: number) => easeOut(t, a - 0.1, a + 0.2);
  let y = SLOT - 10;
  const placed = rows.filter((row) => prog(row.at) > 0).reverse().map((row) => { y -= row.h * prog(row.at); return {row, y}; }).reverse();
  const top = placed.length ? placed[0].y - 18 : SLOT;
  const zig = Array.from({length: 22}, (_, i) => `L ${470 + (i + 0.5) * 540 / 21} ${top + (i % 2 ? 0 : 14)}`).join(' ');
  return <g>
    <clipPath id="rb-slot"><rect x={420} y={-2000} width={640} height={2000 + SLOT} /></clipPath>
    <g clipPath="url(#rb-slot)">
      <path d={`M 470 ${SLOT} L 470 ${top + 14} ${zig} L 1010 ${top + 14} L 1010 ${SLOT} Z`} fill="#FFFEF7" stroke={K.grape} strokeWidth={4} />
      {placed.map(({row, y: ry}, i) => <React.Fragment key={i}>{row.node(ry, prog(row.at))}</React.Fragment>)}
    </g>
    {/* The phone it prints out of, held low in his hand. */}
    <rect x={455} y={SLOT - 8} width={570} height={500} rx={60} fill={K.grape2} stroke={K.grape} strokeWidth={9} />
    <rect x={480} y={SLOT - 14} width={520} height={14} rx={7} fill={K.grape} />
    <circle cx={466} cy={SLOT + 60} r={56} fill={SKIN} stroke={K.grape} strokeWidth={8} />
  </g>;
};

const TurnShot: React.FC<{t: number; from: number; to: number}> = ({t, from, to}) => {
  const cam = cam3At([key(from, 540, 960, 30, -0.4, 980), key(to, 545, 950, 110, 0.4, 900)], t);
  const confirm = pop(t, B.booked, 9);
  const slide = easeOut(t, B.card - 0.3, B.card + 0.25);
  const bubbles = [0, 1, 2].map((i) => pop(t, B.swipesself + 0.5 + i * 0.22, 8));
  return <Space cam={cam} id="ot-turn" bg={K.paper}>
    <Backdrop t={t} />
    {/* Him, relaxed, hands off the phone. */}
    <At z={1500}><g transform="translate(250 1080) scale(0.75)"><Guy t={t} relief={poseAt(t).relief} lookDown={0} /></g></At>
    <SoftShadow z={1000} dz={200}><rect x={300} y={500} width={480} height={760} rx={72} /></SoftShadow>
    <Plane z={1000}>
      <PhoneInsert t={t} from={B.swipesself} self />
      {t < B.swipesself && <g><rect x={322} y={522} width={436} height={716} rx={54} fill="#FBF9FF" /><Logo x={540} y={860} r={90 * pop(t, B.noswipe - 0.2, 9)} /></g>}
      {bubbles.map((k, i) => k > 0 && <g key={i} transform={`translate(${i % 2 ? 640 : 440} ${640 + i * 120}) scale(${k})`}>
        <rect x={-110} y={-42} width={220} height={84} rx={36} fill={i % 2 ? K.lilac : K.lime} stroke={K.grape} strokeWidth={6} />
        {[0, 1, 2].map((d) => <circle key={d} cx={-40 + d * 40} cy={0} r={10} fill={K.grape} />)}
      </g>)}
      {confirm > 0 && <g transform={`translate(540 1080) scale(${confirm})`}>
        <rect x={-300} y={-58} width={600} height={116} rx={40} fill={K.grape} transform="translate(10 12)" />
        <rect x={-300} y={-58} width={600} height={116} rx={40} fill={K.lime} stroke={K.grape} strokeWidth={8} />
        <text x={0} y={20} textAnchor="middle" fontFamily={DISPLAY} fontSize={56} fill={K.grape}>Date confirmed</text>
      </g>}
    </Plane>
    {slide > 0 && <><SoftShadow z={940} dz={100}><g transform={`translate(0 ${(1 - slide) * 900})`}><DateCard who="priya" y={470} /></g></SoftShadow>
      <Plane z={940}><g transform={`translate(0 ${(1 - slide) * 900})`}><DateCard who="priya" y={470} /></g></Plane></>}
    <Hud cam={cam}><Headline text="NoSwipe swipes. You don't." k={hold(t, B.noswipe, B.noswipe + 0.3, B.card - 0.5, B.card - 0.2)} y={360} size={64} /></Hud>
  </Space>;
};

// ---------------------------------------------------------------------------------------------

const LINES = tl.lines;
const WORDS = wordsOf(LINES);
const CHUNKS = chunksOf(LINES, WORDS);
const speech = speechOf(LINES);
const cut = (name: string, lead = 0.05) => B[name] - lead;

const shots: Shot[] = [
  // 1. Wide: a busy gym, he puts the dumbbell down and gets his phone out.
  {from: 0, render: (t) => <GymShot t={t} keys={[key(0, 540, 960, -420, -0.6, 1300), key(cut('swiping'), 540, 940, -150, 0.3, 1150)]}
    text={spec.context} textK={1 - smooth(t, 3.0, 3.4)} />},
  // 2. Close: the timer ticking down above him, the phone big in the foreground.
  {from: cut('swiping'), render: (t) => <GymShot t={t} keys={[key(cut('swiping'), 540, 900, 120, 0.5, 1050), key(cut('timerout', 0.15), 540, 880, 210, -0.3, 1000)]}>
    {(cam) => <Plane z={900 + cam.z}><g transform="translate(560 420) scale(0.5)"><PhoneInsert t={t} from={B.swiping} /></g></Plane>}
  </GymShot>},
  // 3. The timer runs out and keeps going; his buddy waits, then leaves.
  {from: cut('timerout', 0.15), render: (t) => <GymShot t={t} keys={[key(cut('timerout', 0.15), 540, 930, -60, -0.4, 1150), key(cut('settwo'), 560, 940, -140, 0.4, 1100)]}
/>},
  // 4. Time-lapse to closing time: everyone goes home, lights off, the cleaner mops around him.
  {from: cut('settwo'), render: (t) => <GymShot t={t} keys={[key(cut('settwo'), 540, 950, -120, 0, 1150), key(cut('receipt', 0.1), 540, 930, -430, 0, 1200)]}
    text="Closing time." textK={hold(t, B.home - 0.1, B.home + 0.2, B.mop - 0.3, B.mop)} dark={t > B.home} />},
  // 5. Dim and close: the receipt prints out of his phone; he looks up, caught.
  {from: cut('receipt', 0.1), render: (t) => <GymShot t={t} keys={[key(cut('receipt', 0.1), 740, 930, 60, 0.4, 1000), key(cut('or'), 750, 920, 150, -0.3, 950)]}>
    {(cam) => <Plane z={950 + cam.z}><g transform={`translate(${cam.x - 540} ${cam.y - 960})`}><ReceiptBurst t={t} /></g></Plane>}
  </GymShot>},
  // 6. The turn: NoSwipe swipes, chats and books Priya.
  {from: cut('or'), render: (t) => <TurnShot t={t} from={cut('or')} to={cut('payoff', 0.1)} />},
  // 7. Payoff: same gym, full again; he lifts, the timer works, Priya's date pings.
  {from: cut('payoff', 0.1), render: (t) => <GymShot t={t} payoff keys={[key(cut('payoff', 0.1), 540, 940, -80, 0.4, 1150), key(cut('endcard', 0.1), 540, 960, -380, -0.2, 1250)]}>
    {(cam) => <Hud cam={cam}>{pop(t, B.payoff + 0.9, 9) > 0 && <g transform={`translate(780 640) scale(${pop(t, B.payoff + 0.9, 9)})`}>
      <rect x={-210} y={-50} width={420} height={100} rx={40} fill={K.grape} transform="translate(8 10)" />
      <rect x={-210} y={-50} width={420} height={100} rx={40} fill={K.lime} stroke={K.grape} strokeWidth={7} />
      <text x={0} y={16} textAnchor="middle" fontFamily={DISPLAY} fontSize={42} fill={K.grape}>Priya · Sun 4 PM</text>
    </g>}</Hud>}
  </GymShot>},
  {from: cut('endcard', 0.1), render: (t) => <EndCard t={t} start={cut('endcard', 0.1)} end={B.end} />},
];

const fast: [number, number][] = [[B.total - 0.05, B.total + 0.4], [B.card - 0.3, B.card + 0.25], [B.receipt, B.receipt + 0.8]];
const isFast = (t: number) => inCut(t, shots) || fast.some(([a, b]) => t >= a && t < b);

const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <AbsoluteFill style={{background: K.paper}}><SwipeCuts t={frame / fps} shots={shots} edge={K.grape} /></AbsoluteFill>;
};

export const Overtime: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const musicVol = (f: number) => lerp(0.55, 0.28, speech(f / fps));
  return <AbsoluteFill style={{background: K.paper}}>
    <Audio src={staticFile('audio/overtime-music.wav')} volume={musicVol} />
    <Audio src={staticFile('audio/overtime-sfx.wav')} volume={0.65} />
    {LINES.map((l, i) => <Sequence key={i} from={Math.round(l.start * fps)}><Audio src={staticFile(l.file)} /></Sequence>)}
    <MotionBlurWhen fast={isFast(t)}><Scene /></MotionBlurWhen>
    <Grain />
    <SoftCta t={t} from={B.card} to={cut('payoff', 0.1)} />
    <Captions t={t} chunks={CHUNKS} hideFrom={cut('endcard', 0.1)} />
  </AbsoluteFill>;
};
