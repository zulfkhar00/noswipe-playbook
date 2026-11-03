import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, easeOut, hold, lerp, smooth} from '../lib/motion';
import {Key3, Plane, Shadow, Space, cam3At} from '../lib/space';
import {Line, chunksOf, speechOf, wordsOf} from '../lib/speech';
import {MotionBlurWhen} from '../lib/shots';
import {DISPLAY, K, Logo, SANS} from '../brand/brand';
import {Backdrop, BrandPhone, Captions as BrandCaptions, DateCard, EndCard, PROFILES, ProfileCard, SoftCta, SoftShadow, pop} from '../brand/scenes';
import {Arrow, BeltSign, Captions, ContextTitle, HEL, NoSign, Panel, Pax, PaxPose, ROUND, SC, StatusStrip, StripState, flipStyle, mix} from './look';
import spec from '../../specs/seat-14b.json';
import tlJson from './seat-14b.timeline.json';

// "Seat 14B", the first Safety Card episode (Format 3). A flight attendant gives the dating-app
// safety briefing to the one passenger who is still swiping: he sends "hey", gets ghosted, clings
// to his phone like a flotation device and is still at it at one AM while the cabin sleeps. Then
// the plane switches to autopilot (NoSwipe), the picture switches to the noswipe.app look for the
// turn and Maya's date card, and the payoff is the same seat in the morning, phone stowed.
//
// The cabin is one world whose state is a function of time (cabinAt); shots are cameras on it.
// Planes are authored in screen coordinates for the resting camera (At). Shots are joined by a
// card flip (flipStyle), the format's signature transition.

export const SEAT14B_FPS = 60;
const tl = tlJson as unknown as {lines: Line[]; beats: Record<string, number>; duration: number};
const B = tl.beats;
export const SEAT14B_FRAMES = Math.ceil(tl.duration * SEAT14B_FPS);

const At: React.FC<{z: number; noBlur?: boolean; children: React.ReactNode}> = ({z, noBlur, children}) =>
  <Plane z={z} noBlur={noBlur}><g transform={`translate(540 960) scale(${z / 1000}) translate(-540 -960)`}>{children}</g></Plane>;

const key = (t: number, x: number, y: number, z: number, rot = 0, subject = 1250, aperture = 4): Key3 => ({t, x, y, z, rot, focus: subject - z, aperture});

// ---------------------------------------------------------------------------------------------
// Poses over time. Each key blends in over `blend` seconds from the pose before it.

type PoseKey = [number, PaxPose];
const lerpPose = (a: PaxPose, b: PaxPose, k: number): PaxPose => ({...b,
  armL: [lerp(a.armL[0], b.armL[0], k), lerp(a.armL[1], b.armL[1], k)], armR: [lerp(a.armR[0], b.armR[0], k), lerp(a.armR[1], b.armR[1], k)],
  lean: lerp(a.lean ?? 0, b.lean ?? 0, k), tilt: lerp(a.tilt ?? 0, b.tilt ?? 0, k), glow: lerp(a.glow ?? 0, b.glow ?? 0, k)});
const poseAt = (keys: PoseKey[], t: number, blend = 0.22): PaxPose => {
  let i = 0;
  while (i + 1 < keys.length && t >= keys[i + 1][0]) i++;
  if (i === 0) return keys[0][1];
  return lerpPose(keys[i - 1][1], keys[i][1], smooth(t, keys[i][0], keys[i][0] + blend));
};

const HIM = {shirt: SC.orange, shirtLo: SC.orangeLo, hair: '#4A3022', phone: 'L' as const};
const HOLD: PaxPose = {...HIM, armL: [14, 152], armR: [16, 146]};
const HIS: PoseKey[] = [
  [0, HOLD],
  [B.match - 0.05, {...HIM, armL: [-165, 10], armR: [-160, 10], lean: -2}],
  [B.calm - 0.1, HOLD],
  [B.sir1 - 0.3, {...HOLD, glow: 1, lean: 4, tilt: 6}],
  [B.down + 0.05, {...HIM, armL: [6, 30], armR: [8, 30], glow: 0.4, tilt: -4}],
  [B.down + 0.75, {...HOLD, glow: 1, lean: 5, tilt: 8}],
  [B.goodnews, {...HOLD, glow: 0.5, lean: 0, tilt: -6}],
];
const HIS_AM: PaxPose = {shirt: SC.orange, shirtLo: SC.orangeLo, hair: '#4A3022', phone: null, armL: [-150, -150], armR: [-150, -150], tilt: 8, armsBack: true};

const CREW = {shirt: SC.navy, shirtLo: SC.navyLo, hat: SC.navy, scarf: SC.orange, standing: true, phone: null};
const SHE: PoseKey[] = [
  [0, {...CREW, armL: [-20, -60], armR: [-70, -40]}],
  [B.review - 0.2, {...CREW, armL: [-150, 0], armR: [-20, 30]}],
  [B.match, {...CREW, armL: [-150, 0], armR: [-60, 20]}],
  [B.calm - 0.3, {...CREW, armL: [-45, 0], armR: [-45, 0]}],
  [B.sir1 - 0.3, {...CREW, armL: [-150, 0], armR: [-80, -20], lean: 6}],
  [B.down, {...CREW, armL: [-150, 0], armR: [-70, -70], lean: 7}],
  [B.sir2 - 0.1, {...CREW, armL: [40, 105], armR: [40, 105], lean: 0}],
  [B.goodnews, {...CREW, armL: [-140, 0], armR: [-140, 0]}],
  [B.autopilot, {...CREW, armL: [-30, 20], armR: [-172, 0]}],
];
const SHE_AM: PaxPose = {...CREW, armL: [-20, 40], armR: [-70, -70]};

// ---------------------------------------------------------------------------------------------
// Time → the state of the flight.

type Flight = {night: number; morning: number; belt: number; phoneSign: number};
const flightAt = (t: number, payoff = false): Flight => {
  if (payoff) return {night: 0, morning: 1, belt: 1 - smooth(t, B.booked - 0.05, B.booked + 0.05), phoneSign: 0};
  const dark = smooth(t, B.oneam - 0.1, B.oneam + 0.3);
  const up = smooth(t, B.goodnews - 0.1, B.autopilot);
  return {night: Math.max(smooth(t, 0, B.panel1) * 0.45, dark) * (1 - 0.7 * up), morning: 0, belt: 1, phoneSign: dark * (1 - up)};
};

const ROWS = [1250, 1650, 2100, 2650, 3250];
const SEATS_R = [470, 690, 910], SEATS_L = [20, -200];

const Seat: React.FC<{cx: number; night: number}> = ({cx, night}) => <g>
  <rect x={cx - 100} y={600} width={200} height={440} rx={44} fill={mix(SC.seat, '#141C33', night * 0.6)} />
  <rect x={cx + 30} y={600} width={70} height={440} rx={30} fill={mix(SC.seatLo, '#0E1428', night * 0.6)} opacity={0.7} />
  <rect x={cx - 80} y={616} width={160} height={72} rx={18} fill={mix(SC.stock, '#5A6276', night * 0.6)} />
</g>;

/** A far-row passenger: just head and shoulders over the seat back. Asleep with an eye mask at night. */
const Far: React.FC<{cx: number; night: number; i: number}> = ({cx, night, i}) => <g>
  <rect x={cx - 74} y={720} width={148} height={200} rx={50} fill={mix(SC.grey, '#2A3248', night * 0.6)} />
  <circle cx={cx + (night > 0.6 ? 8 : 0)} cy={660 + (night > 0.6 ? 10 : 0)} r={56} fill={mix(SC.skin, '#4A5468', night * 0.55)} />
  {i % 2 === 0 && <path d={`M ${cx - 56} 652 A 56 56 0 0 1 ${cx + 56} 652 Q ${cx} 620 ${cx - 56} 652 Z`} fill={mix('#3A2A20', '#10141E', night * 0.5)} />}
  {night > 0.6 && <rect x={cx - 46} y={652} width={92} height={24} rx={11} fill={SC.navy} />}
</g>;

const Cabin: React.FC<{t: number; payoff?: boolean}> = ({t, payoff = false}) => {
  const f = flightAt(t, payoff);
  const wall = f.morning ? '#F6F1E6' : mix(SC.wall, '#2A3350', f.night * 0.85);
  const wallLo = f.morning ? '#E2DACB' : mix(SC.wallLo, '#1E2640', f.night * 0.85);
  const bin = f.morning ? '#FFFFFF' : mix('#F7F4EE', '#38415E', f.night * 0.85);
  const carpet = mix('#3B4A6E', '#161D33', f.night * 0.7);
  const sky = f.morning ? ['#8FD0FF', '#E8F6FF'] : f.night > 0.6 ? ['#070C26', '#1A2350'] : ['#FF8A4C', '#FFD38A'];
  const light = f.morning ? 0.25 : 0.35 * (1 - f.night);
  return <>
    {/* The galley at the back. */}
    <At z={3900}>
      <rect x={-2600} y={-2600} width={6300} height={6000} fill={wallLo} />
      <rect x={300} y={420} width={480} height={760} rx={20} fill={mix(SC.navy, '#0A1230', f.night * 0.6)} />
      {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={312 + i * 78} y={430} width={40} height={740} rx={16} fill="#000" opacity={0.12} />)}
      <rect x={455} y={330} width={170} height={60} rx={10} fill="#0E3A22" /><text x={540} y={374} textAnchor="middle" fontFamily={HEL} fontWeight={800} fontSize={40} fill="#5BE08A">EXIT</text>
    </At>
    {[...ROWS].reverse().map((z, ri0) => {
      const ri = ROWS.length - 1 - ri0;
      return <At key={z} z={z}>
        {/* Ceiling, bins, side walls with a window, aisle carpet. */}
        <rect x={-2600} y={-2600} width={6300} height={2810} fill={mix(wall, '#FFFFFF', 0.2)} />
        <rect x={320} y={196} width={440} height={14} rx={7} fill={f.morning ? '#FFF6D8' : mix('#FFF0C8', '#6A6A80', f.night)} />
        <path d="M 700 210 L 2600 210 L 2600 470 L 860 470 L 700 400 Z" fill={bin} />
        <path d="M 700 400 L 860 470 L 2600 470 L 2600 486 L 852 486 L 692 412 Z" fill={wallLo} />
        <path d="M 380 210 L -2600 210 L -2600 470 L 220 470 L 380 400 Z" fill={bin} />
        <path d="M 380 400 L 220 470 L -2600 470 L -2600 486 L 228 486 L 388 412 Z" fill={wallLo} />
        <rect x={1000} y={486} width={1600} height={2600} fill={wall} />
        <rect x={-2600} y={486} width={2680} height={2600} fill={wall} />
        <defs><linearGradient id={`sky-${ri}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={sky[0]} /><stop offset="1" stopColor={sky[1]} /></linearGradient></defs>
        {[1040, -60].map((wx) => <g key={wx}>
          <rect x={wx - 8} y={552} width={116} height={186} rx={54} fill={wallLo} />
          <rect x={wx} y={560} width={100} height={170} rx={48} fill={`url(#sky-${ri})`} />
          {f.night > 0.6 && !f.morning && [0, 1, 2].map((s) => <circle key={s} cx={wx + 24 + s * 26} cy={600 + ((s * 37 + ri * 11) % 90)} r={4} fill="#FFFFFF" opacity={0.8} />)}
          {f.morning > 0 && <path d={`M ${wx} 730 L ${wx + 100} 730 L ${wx - 40} 1100 L ${wx - 260} 1100 Z`} fill="#FFFFFF" opacity={0.2} />}
        </g>)}
        <rect x={-2600} y={1150} width={6300} height={1800} fill={carpet} />
        {ri > 0 && <>
          {[...SEATS_R, ...SEATS_L].map((cx) => <Seat key={cx} cx={cx} night={f.night} />)}
          {[...SEATS_R, ...SEATS_L].map((cx, i) => (ri + i) % 3 !== 1 && <Far key={cx} cx={cx} night={payoff ? 0 : f.night} i={i + ri} />)}
          {[...SEATS_R, ...SEATS_L].map((cx) => <rect key={cx} x={cx - 110} y={960} width={220} height={120} rx={20} fill={mix(SC.seatLo, '#0E1428', f.night * 0.6)} />)}
        </>}
        {ri === 1 && f.night < 0.3 && <rect x={-2600} y={-2600} width={6300} height={5600} fill="#FFFFFF" opacity={light * 0.15} />}
      </At>;
    })}
  </>;
};

/** Row 14: three seats, him in B, two neighbours who fall asleep, the sign overhead. */
const Row14: React.FC<{t: number; payoff?: boolean}> = ({t, payoff = false}) => {
  const f = flightAt(t, payoff);
  const n = payoff ? 0 : f.night;
  const him = payoff ? HIS_AM : {...poseAt(HIS, t), dim: n * 0.6};
  const flick = !payoff && t > B.sir1 && t < B.goodnews && (t < B.down || t > B.down + 0.9) ? Math.max(0, Math.sin(t * 9)) * 6 : 0;
  const jolt = hold(t, B.match - 0.05, B.match + 0.05, B.calm - 0.2, B.calm + 0.1);
  const neighbour = (cx: number, i: number) => <g transform={`translate(${cx} 1010) scale(0.84)`}>
    <Pax t={t + i} p={n > 0.6 ? {armL: [20, 60], armR: [20, 60], mask: true, sleep: 1, tilt: i ? 12 : -12, lean: i ? 4 : -4, hair: i ? '#2A1A14' : undefined, dim: n * 0.6}
      : {armL: [10, 70], armR: [12, 60], hair: i ? '#2A1A14' : undefined, tilt: payoff ? 0 : jolt * (i ? -10 : 10)}} />
  </g>;
  return <>
    <At z={1290}>
      <BeltSign x={690} y={440} on={f.belt * (0.35 + 0.65 * (1 - n * 0.3))} phoneOff={f.phoneSign} />
      {SEATS_R.map((cx) => <Seat key={cx} cx={cx} night={n} />)}
      <Seat cx={SEATS_L[0]} night={n} />
    </At>
    <At z={1260}>
      {neighbour(910, 0)}
      {neighbour(470, 1)}
      <g transform={`translate(690 ${1010 - 30 * jolt}) scale(0.9) rotate(${flick * 0.3})`}><Pax t={t} p={him} /></g>
      {jolt > 0.05 && <g opacity={jolt} fontFamily={ROUND} fill={SC.orange} fontSize={96}>
        <text x={560} y={600} transform="rotate(-14 560 600)">!</text><text x={800} y={590} transform="rotate(12 800 590)">!</text></g>}
      {/* The match: a heart bursting off his phone. */}
      {t > B.match - 0.1 && t < B.calm + 0.4 && (() => { const k = clamp((t - B.match + 0.1) / 0.9);
        return <g transform={`translate(690 ${560 - 140 * k}) scale(${0.6 + 0.8 * Math.sin(Math.PI * Math.min(1, k * 1.3)) })`} opacity={1 - smooth(k, 0.7, 1)}>
          <path d="M 0 40 C -90 -20 -60 -90 0 -50 C 60 -90 90 -20 0 40 Z" fill={SC.red} /></g>; })()}
    </At>
    <At z={1225}>
      {[...SEATS_R, SEATS_L[0]].map((cx) => <rect key={cx} x={cx - 112} y={1000} width={224} height={110} rx={24} fill={mix(SC.seatHi, '#1A2440', n * 0.6)} />)}
      {[360, 580, 800, 1020].map((x) => <rect key={x} x={x - 14} y={930} width={28} height={130} rx={12} fill={mix('#9AA6BC', '#2A3248', n * 0.6)} />)}
      {payoff && <g transform="translate(800 1006) rotate(-4)"><rect x={-44} y={-12} width={88} height={22} rx={8} fill={SC.ink} /></g>}
    </At>
  </>;
};

/** The attendant in the aisle, with whatever card she's holding. */
const Crew: React.FC<{t: number; payoff?: boolean}> = ({t, payoff = false}) => {
  const p = payoff ? SHE_AM : poseAt(SHE, t);
  const n = payoff ? 0 : flightAt(t).night;
  const card = !payoff && t >= B.review - 0.15 && t < B.calm;
  const card3 = !payoff && t >= B.sir1 - 0.2 && t < B.sir2;
  const c3 = pop(t, B.oneam - 0.1, 9);
  return <At z={1150}>
    <g transform={`translate(215 990)`}>
      <Pax t={t} p={{...p, dim: n * 0.45}} />
      {card && <g transform="translate(-150 -560) rotate(-8)"><rect x={-70} y={-96} width={140} height={192} rx={14} fill={SC.stock} />
        <rect x={-70} y={-96} width={140} height={44} rx={14} fill={SC.navy} /><circle cx={-40} cy={-74} r={13} fill={SC.orange} />
        {[0, 1, 2, 3].map((i) => <rect key={i} x={i % 2 ? 6 : -60} y={-38 + Math.floor(i / 2) * 64} width={54} height={54} rx={8} fill={SC.stockLo} />)}</g>}
      {card3 && c3 > 0 && <g transform={`translate(10 -490) rotate(-4) scale(${0.75 * c3})`}>
        <Panel x={-190} y={-170} w={380} h={330} n={3} title="AFTER 1 AM" titleSize={38}>
          <path d="M 100 230 A 54 54 0 1 1 150 160 A 42 42 0 1 0 100 230 Z" fill={SC.navy} />
          <rect x={210} y={150} width={70} height={120} rx={14} fill={SC.ink} /><rect x={218} y={160} width={54} height={96} rx={8} fill={SC.glow} />
          <NoSign x={245} y={210} r={80} k={clamp((t - B.oneam) / 0.5)} />
        </Panel></g>}
    </g>
  </At>;
};

const CabinShot: React.FC<{t: number; keys: Key3[]; payoff?: boolean; id: string}> = ({t, keys, payoff, id}) => {
  const cam = cam3At(keys, t);
  return <Space cam={cam} id={id} bg={SC.navy}><Cabin t={t} payoff={payoff} /><Row14 t={t} payoff={payoff} /><Crew t={t} payoff={payoff} /></Space>;
};

// ---------------------------------------------------------------------------------------------
// The phone close-up: "hey", delivered, then the "no reply expected" stamp.

const PhoneShot: React.FC<{t: number; from: number; to: number}> = ({t, from, to}) => {
  const cam = cam3At([key(from, 540, 960, 40, -0.6, 1000), key(B.hey + 0.3, 560, 940, 140, 0.4, 1000), key(to, 550, 950, 110, 0, 1000)], t);
  const typed = t < B.hey - 0.05 ? 'hey'.slice(0, Math.floor(clamp((t - B.types - 0.15) / 0.5) * 3)) : '';
  const sent = pop(t, B.hey - 0.02, 8);
  const stamp = pop(t, B.noreply - 0.1, 7);
  return <Space cam={cam} id="sc-phone" bg={SC.navy}>
    <At z={2400}>
      <rect x={-2600} y={-2600} width={6300} height={7000} fill={mix(SC.seat, '#1A2440', 0.4)} />
      <rect x={-300} y={200} width={1680} height={1300} rx={140} fill={SC.seat} />
      <rect x={60} y={1150} width={960} height={70} rx={20} fill={SC.seatLo} />
      <rect x={300} y={360} width={480} height={320} rx={40} fill="#16223C" />
    </At>
    <Shadow z={1000} dz={500} offset={[40, 60]} blur={40} opacity={0.45}><rect x={290} y={400} width={500} height={920} rx={76} /></Shadow>
    <Plane z={1000}>
      <rect x={290} y={400} width={500} height={920} rx={76} fill={SC.ink} />
      <rect x={312} y={422} width={456} height={876} rx={58} fill={SC.stock} />
      <rect x={312} y={422} width={456} height={150} rx={58} fill={SC.navy} /><rect x={312} y={520} width={456} height={52} fill={SC.navy} />
      <circle cx={386} cy={510} r={38} fill={SC.grey} />
      <text x={440} y={502} fontFamily={HEL} fontWeight={800} fontSize={36} fill={SC.stock}>New match</text>
      <text x={440} y={540} fontFamily={HEL} fontWeight={600} fontSize={24} fill="#A9B8DA">matched just now</text>
      {sent > 0 && <g transform={`translate(700 860) scale(${sent})`}>
        <rect x={-150} y={-50} width={150} height={90} rx={40} fill={SC.orange} />
        <text x={-75} y={12} textAnchor="middle" fontFamily={HEL} fontWeight={800} fontSize={44} fill={SC.ink}>hey</text>
        <text x={0} y={80} textAnchor="end" fontFamily={HEL} fontWeight={600} fontSize={24} fill={SC.greyLo}>Delivered</text>
      </g>}
      <rect x={336} y={1210} width={340} height={66} rx={33} fill="#FFFFFF" />
      <text x={364} y={1255} fontFamily={HEL} fontWeight={700} fontSize={32} fill={typed ? SC.ink : SC.greyLo}>{typed || 'Message'}</text>
      <circle cx={722} cy={1243} r={32} fill={typed ? SC.orange : SC.stockLo} />
      {/* His thumbs, safety-card style. */}
      <ellipse cx={812} cy={1180} rx={60} ry={100} fill={SC.skin} transform="rotate(-24 812 1180)" />
      <ellipse cx={268} cy={1180} rx={60} ry={100} fill={SC.skinLo} transform="rotate(24 268 1180)" />
    </Plane>
    {stamp > 0 && <Plane z={940} noBlur><g transform={`translate(540 900) rotate(-9) scale(${1.6 - 0.6 * stamp})`} opacity={clamp(stamp * 2)}>
      <rect x={-260} y={-62} width={520} height={124} rx={20} fill={SC.stock} opacity={0.92} />
      <rect x={-250} y={-52} width={500} height={104} rx={14} fill="none" stroke={SC.red} strokeWidth={10} />
      <text x={0} y={18} textAnchor="middle" fontFamily={HEL} fontWeight={900} fontSize={44} fill={SC.red} letterSpacing={1}>NO REPLY EXPECTED</text>
    </g></Plane>}
  </Space>;
};

// ---------------------------------------------------------------------------------------------
// The hazard panels, full frame: a card on the seat-pocket navy.

const PanelShot: React.FC<{t: number; from: number; to: number; id: string; children: React.ReactNode; n: number; title: string}> = ({t, from, to, id, children, n, title}) => {
  const cam = cam3At([key(from, 540, 960, -30, -0.8, 1000, 3), key(to, 540, 960, 70, 0.8, 1000, 3)], t);
  return <Space cam={cam} id={id} bg={SC.navyLo}>
    <At z={2200}><rect x={-2600} y={-2600} width={6300} height={7000} fill={SC.navyLo} />
      {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={-600 + i * 380} y={-2600} width={150} height={7000} fill={SC.navy} opacity={0.35} transform="rotate(14 540 960)" />)}</At>
    <Shadow z={1000} dz={400} offset={[36, 50]} blur={36} opacity={0.5}><rect x={70} y={300} width={940} height={800} rx={34} /></Shadow>
    <Plane z={1000}><Panel x={70} y={300} w={940} h={800} n={n} title={title} titleSize={title.length > 14 ? 44 : 58}>{children}</Panel></Plane>
  </Space>;
};

const Ghosting: React.FC<{t: number}> = ({t}) => {
  const rise = easeOut(t, B.panel1 + 0.25, B.notice + 0.2);
  const q = pop(t, B.notice, 8);
  const gx = lerp(440, 760, rise), gy = lerp(500, 210, rise);
  return <g>
    <rect x={0} y={640} width={940} height={160} fill={SC.stockLo} />
    <g transform="translate(320 700) scale(0.95)"><Pax t={t} p={{...HOLD, glow: 0.3}} /></g>
    <g transform="translate(240 560)"><rect x={-60} y={-34} width={120} height={64} rx={30} fill={SC.orange} />
      <text x={0} y={12} textAnchor="middle" fontFamily={HEL} fontWeight={800} fontSize={34} fill={SC.ink}>hey</text></g>
    <Arrow d="M 380 420 Q 520 220 700 230" k={clamp((rise - 0.1) / 0.6)} head={[712, 232, 0]} />
    <g transform={`translate(${gx} ${gy + 10 * Math.sin(t * 6)})`} opacity={1 - smooth(rise, 0.75, 1) * 0.65}>
      <path d="M -70 60 L -70 -10 A 70 70 0 0 1 70 -10 L 70 60 L 46 44 L 23 60 L 0 44 L -23 60 L -46 44 Z" fill="#FFFFFF" />
      <path d="M 30 -60 A 70 70 0 0 1 70 -10 L 70 60 L 46 44 L 40 50 Q 60 0 30 -60 Z" fill={SC.stockLo} />
      <circle cx={-24} cy={-6} r={11} fill={SC.navy} /><circle cx={20} cy={-6} r={11} fill={SC.navy} />
    </g>
    {q > 0 && <text x={420} y={300} fontFamily={ROUND} fontSize={130} fill={SC.navy} transform={`translate(420 260) scale(${q}) translate(-420 -260)`}>?</text>}
  </g>;
};

const Flotation: React.FC<{t: number}> = ({t}) => {
  const no = clamp((t - B.float) / 0.55);
  const sink = smooth(t, B.float + 0.4, B.sir1);
  const bob = Math.sin(t * 3) * 10;
  const wave = (y: number, ph: number, c: string) => <path d={`M -40 ${y} ${Array.from({length: 12}, (_, i) => `Q ${i * 90 + 5} ${y - 26 * Math.sin(ph + t * 2)} ${i * 90 + 50} ${y} T ${i * 90 + 95} ${y}`).join(' ')} L 1000 800 L -40 800 Z`} fill={c} />;
  return <g>
    <rect x={0} y={118} width={940} height={682} fill="#DCEBF5" />
    <g transform={`translate(330 ${640 + bob}) scale(0.9)`}><Pax t={t} p={{...HIM, phone: null, armL: [-60, 30], armR: [-120, -20]}} /></g>
    <g transform={`translate(590 ${470 + bob + 90 * sink}) rotate(${-14 + 30 * sink})`}>
      <rect x={-90} y={-160} width={180} height={320} rx={30} fill={SC.ink} /><rect x={-74} y={-142} width={148} height={284} rx={20} fill={SC.glow} />
    </g>
    {wave(600, 0, '#3E78C8')}
    {wave(650, 1.4, SC.navy)}
    <NoSign x={590} y={460} r={170} k={no} />
  </g>;
};

// ---------------------------------------------------------------------------------------------
// The brand moment: NoSwipe at work, then Maya's date card as a boarding pass (noswipe.app look).

const BrandSwipes: React.FC<{t: number; from: number}> = ({t, from}) => {
  const el = Math.max(0, t - from), i = Math.floor(el / 0.3), ph = (el / 0.3) % 1;
  const k = Math.pow(clamp((ph - 0.45) / 0.5), 2);
  return <g>
    <BrandPhone x={300} y={430} w={480} h={800} />
    <clipPath id="sc-bs"><rect x={322} y={452} width={436} height={756} rx={54} /></clipPath>
    <g clipPath="url(#sc-bs)">
      <g transform="translate(540 850) scale(0.74) translate(-540 -695)"><ProfileCard p={PROFILES[(i + 1) % PROFILES.length]} /></g>
      <g transform={`translate(${560 * k} ${-30 * k}) rotate(${20 * k} 540 850)`}><g transform="translate(540 850) scale(0.74) translate(-540 -695)"><ProfileCard p={PROFILES[i % PROFILES.length]} /></g></g>
    </g>
  </g>;
};

const PassStub: React.FC = () => <g transform="translate(110 968)">
  <rect x={14} y={18} width={860} height={96} rx={26} fill={K.grape} />
  <rect width={860} height={96} rx={26} fill={K.lime} stroke={K.grape} strokeWidth={7} />
  {Array.from({length: 26}, (_, i) => <circle key={i} cx={30 + i * 32} cy={-8} r={6} fill={K.grape} />)}
  <text x={36} y={62} fontFamily={DISPLAY} fontSize={44} fill={K.grape}>Boarding pass</text>
  <text x={824} y={62} textAnchor="end" fontFamily={SANS} fontWeight={800} fontSize={34} fill={K.grape}>Seat 14B · Maya</text>
</g>;

const TurnShot: React.FC<{t: number; from: number; to: number}> = ({t, from, to}) => {
  const cam = cam3At([key(from, 540, 930, 30, -0.4, 1000), key(to, 545, 920, 110, 0.4, 1000)], t);
  const confirm = pop(t, B.books + 0.1, 9);
  const slide = easeOut(t, B.maya - 0.35, B.maya + 0.2);
  const bubbles = [0, 1, 2].map((i) => pop(t, B.chats + i * 0.2, 8));
  return <Space cam={cam} id="sc-turn" bg={K.paper}>
    <Backdrop t={t} />
    <SoftShadow z={1000} dz={200}><rect x={300} y={430} width={480} height={800} rx={72} /></SoftShadow>
    <Plane z={1000}>
      {t < B.swipes - 0.1 ? <g><BrandPhone x={300} y={430} w={480} h={800} />
        <Logo x={540} y={790} r={100 * pop(t, B.noswipe - 0.1, 9)} />
        <text x={540} y={990} textAnchor="middle" fontFamily={DISPLAY} fontSize={44} fill={K.grape} opacity={smooth(t, B.builds - 0.2, B.builds + 0.1)}>building profiles…</text></g>
        : <BrandSwipes t={t} from={B.swipes - 0.1} />}
      {bubbles.map((k, i) => k > 0 && <g key={i} transform={`translate(${i % 2 ? 650 : 430} ${570 + i * 130}) scale(${k})`}>
        <rect x={-120} y={-44} width={240} height={88} rx={38} fill={i % 2 ? K.lilac : K.lime} stroke={K.grape} strokeWidth={6} />
        {[0, 1, 2].map((d) => <circle key={d} cx={-40 + d * 40} cy={0} r={11} fill={K.grape} />)}
      </g>)}
      {confirm > 0 && slide < 0.3 && <g transform={`translate(540 900) scale(${confirm})`}>
        <rect x={-300} y={-58} width={600} height={116} rx={40} fill={K.grape} transform="translate(10 12)" />
        <rect x={-300} y={-58} width={600} height={116} rx={40} fill={K.lime} stroke={K.grape} strokeWidth={8} />
        <text x={0} y={20} textAnchor="middle" fontFamily={DISPLAY} fontSize={56} fill={K.grape}>Date confirmed</text>
      </g>}
    </Plane>
    {slide > 0 && <><SoftShadow z={940} dz={100}><g transform={`translate(0 ${(1 - slide) * 900})`}><DateCard who="maya" y={390} /><PassStub /></g></SoftShadow>
      <Plane z={940}><g transform={`translate(0 ${(1 - slide) * 900})`}><DateCard who="maya" y={390} /><PassStub /></g></Plane></>}
  </Space>;
};

// ---------------------------------------------------------------------------------------------
// The edit.

type Shot = {from: number; render: (t: number) => React.ReactNode};
const C = {phone: B.types - 0.35, p1: B.panel1 - 0.12, p2: B.panel2 - 0.12, night: B.sir1 - 0.3, turn: B.sub - 0.1, am: B.stowed - 0.2, end: B.endcard - 0.1};

const SHOTS: Shot[] = [
  {from: 0, render: (t) => <CabinShot t={t} id="sc-c1" keys={[key(0, 560, 890, -200, -0.5), key(B.card, 570, 870, -110, 0.3), key(C.phone, 640, 880, 40, 0.6)]} />},
  {from: C.phone, render: (t) => <PhoneShot t={t} from={C.phone} to={C.p1} />},
  {from: C.p1, render: (t) => <PanelShot t={t} from={C.p1} to={C.p2} id="sc-p1" n={1} title="GHOSTING"><Ghosting t={t} /></PanelShot>},
  {from: C.p2, render: (t) => <PanelShot t={t} from={C.p2} to={C.night} id="sc-p2" n={2} title="NOT A FLOTATION DEVICE"><Flotation t={t} /></PanelShot>},
  {from: C.night, render: (t) => <CabinShot t={t} id="sc-c2" keys={[key(C.night, 470, 880, -170, 0.4), key(B.sir2, 520, 860, -60, -0.3), key(B.plane + 0.3, 650, 830, 120, 0.5), key(C.turn, 560, 900, -200, 0)]} />},
  {from: C.turn, render: (t) => <TurnShot t={t} from={C.turn} to={C.am} />},
  {from: C.am, render: (t) => <CabinShot t={t} payoff id="sc-c3" keys={[key(C.am, 600, 880, 30, 0.4), key(C.end, 560, 900, -220, -0.4)]} />},
  {from: C.end, render: (t) => <EndCard t={t} start={C.end} end={B.end} />},
];
const CUTS = SHOTS.slice(1).map((s) => s.from);

const STATES: StripState[] = spec.status.states.map((s) => ({at: B[s.atBeat] - (s.atBeat === 'boarding' ? 10 : 0.05), clock: s.clock, values: s.values as [string, string],
  bad: 'bad' in s ? Boolean(s.bad) : false, good: 'good' in s ? Boolean(s.good) : false}));

const current = (t: number) => { let i = 0; while (i + 1 < SHOTS.length && t >= SHOTS[i + 1].from) i++; return SHOTS[i]; };
const fast: [number, number][] = [[B.maya - 0.35, B.maya + 0.2], [B.swipes - 0.1, B.books]];
const isFast = (t: number) => CUTS.some((c) => Math.abs(t - c) < 0.18) || fast.some(([a, b]) => t >= a && t < b);

export const Seat14B: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const LINES = tl.lines;
  const musicVol = (f: number) => lerp(0.55, 0.28, speechOf(LINES)(f / fps));
  const chunks = chunksOf(LINES, wordsOf(LINES));
  const strip = t < C.p1 || (t >= C.night && t < C.turn) || (t >= C.am && t < C.end);
  return <AbsoluteFill style={{background: SC.navyLo}}>
    <Audio src={staticFile('audio/seat-14b-music.wav')} volume={musicVol} />
    <Audio src={staticFile('audio/seat-14b-cabin.wav')} volume={0.4} />
    <Audio src={staticFile('audio/seat-14b-sfx.wav')} volume={0.7} />
    {LINES.map((l, i) => <Sequence key={i} from={Math.round(l.start * fps)}><Audio src={staticFile(l.file)} /></Sequence>)}
    <MotionBlurWhen fast={isFast(t)}>
      <AbsoluteFill style={flipStyle(t, CUTS)}>{current(t).render(t)}</AbsoluteFill>
    </MotionBlurWhen>
    <StatusStrip t={t} labels={spec.status.labels as [string, string]} states={STATES} k={strip ? 1 : 0} />
    <ContextTitle t={t} text="for dating apps" until={2.9} />
    <SoftCta t={t} from={B.maya} to={C.am} />
    {/* The brand turn uses the site's own captions (ink on lime), so they read on cream paper. */}
    {t >= C.turn && t < C.am ? <BrandCaptions t={t} chunks={chunks} /> : <Captions t={t} chunks={chunks} hideFrom={C.end} />}
  </AbsoluteFill>;
};
