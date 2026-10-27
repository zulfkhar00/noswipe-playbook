import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, easeOut, hold, lerp, smooth} from '../lib/motion';
import {Cam3, Key3, Plane, Shadow, Space, cam3At} from '../lib/space';
import {Chunk, Line, chunksOf, speechOf, wordsOf} from '../lib/speech';
import {MotionBlurWhen} from '../lib/shots';
import {DISPLAY, K, Logo} from '../brand/brand';
import {Backdrop, BrandPhone, DateCard, EndCard, Grain, PROFILES, ProfileCard, SoftCta, SoftShadow, pop} from '../brand/scenes';
import {BroadcastFinish, COND, CamLabel, FinalBar, LowerThird, PT, ReplayFrame, ScoreBug, ScoreState, Stinger, SubBoard} from './look';
import {PTGuy} from './guy';
import spec from '../../specs/friday-night-live.json';
import tlJson from './friday-night-live.timeline.json';

// "Friday Night, Live", the first Pre-Game episode (Format 2), in the format's own look: a
// prime-time sports broadcast (see look.tsx). His Friday night on the couch is called like a live
// match: a score bug that never moves, a slow-mo replay of his left swipes, a telestrator circle
// on his "hey", the room going dark around him, a FINAL bar at midnight. The substitution board
// brings on NoSwipe, and only then does the picture switch to the noswipe.app brand look (the
// phone at work, Maya's date card, the end card). Next morning the same couch has a better score.
//
// The room is one world whose state is a function of time (Room); shots are cameras on it.
// Planes are authored in screen coordinates for the resting camera (At). Shots change with hard
// cuts hidden behind a broadcast stinger.

export const FRIDAY_FPS = 60;
const tl = tlJson as unknown as {lines: Line[]; beats: Record<string, number>; duration: number};
const B = tl.beats;
export const FRIDAY_FRAMES = Math.ceil(tl.duration * FRIDAY_FPS);

const At: React.FC<{z: number; noBlur?: boolean; children: React.ReactNode}> = ({z, noBlur, children}) =>
  <Plane z={z} noBlur={noBlur}><g transform={`translate(540 960) scale(${z / 1000}) translate(-540 -960)`}>{children}</g></Plane>;

const Hud: React.FC<{cam: Cam3; children: React.ReactNode}> = ({cam, children}) => <Plane z={1000 + cam.z} noBlur>
  <g transform={`translate(${cam.x - 540} ${cam.y - 960})`}>{children}</g></Plane>;

const key = (t: number, x: number, y: number, z: number, rot = 0, subject = 1250, aperture = 5): Key3 => ({t, x, y, z, rot, focus: subject - z, aperture});

// ---------------------------------------------------------------------------------------------
// Time → the state of the evening.

type Night = {sunset: number; dark: number; morning: number; slouch: number; asleep: number; slices: number; lid: number; lamp: number};

const nightAt = (t: number, payoff = false): Night => {
  if (payoff) return {sunset: 0, dark: 0, morning: 1, slouch: 0, asleep: 0, slices: 0, lid: 1, lamp: 0};
  const dusk = smooth(t, B.nothing + 0.6, B.nine + 0.2);
  const dark = smooth(t, B.pizza + 0.6, B.midnight + 0.1);
  return {
    sunset: 1 - dusk, dark, morning: 0,
    slouch: Math.max(dusk * 0.6, dark),
    asleep: smooth(t, B.midnight + 0.2, B.midnight + 0.8),
    slices: t < B.nine - 0.2 ? 3 : t < B.midnight - 0.2 ? 1 : 0,
    lid: smooth(t, B.given - 0.05, B.given + 0.15),
    lamp: dusk > 0.5 ? 1 : 0,
  };
};

const mix = (a: string, b: string, k: number) => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return `#${x.map((v, i) => Math.round(lerp(v, y[i], clamp(k))).toString(16).padStart(2, '0')).join('')}`;
};

// ---------------------------------------------------------------------------------------------
// The room: dark apartment, TV off-screen right, a window, a lamp, the couch.

const Room: React.FC<{t: number; payoff?: boolean}> = ({t, payoff = false}) => {
  const n = nightAt(t, payoff);
  const night = 1 - n.sunset;
  const wall = n.morning ? '#C9D3E6' : mix(mix('#5A4A66', '#28304A', night), '#141A2E', n.dark);
  const floor = n.morning ? '#8E7C6E' : mix(mix('#4A3A44', '#262838', night), '#121522', n.dark);
  const sky = n.morning ? ['#9CD3FF', '#E6F4FF'] : n.dark > 0.5 ? ['#0A1030', '#1A2050'] : night > 0.5 ? ['#1B2350', '#3A3270'] : ['#FF8A5C', '#FFD08A'];
  const tv = n.morning ? 0 : night * (0.8 + 0.2 * Math.sin(t * 7) * Math.sin(t * 2.3));   // TV flicker on the right
  const couch = n.morning ? '#3E6E78' : mix('#2E5560', '#17303A', n.dark);
  const couchLo = n.morning ? '#2C545E' : mix('#1F3E48', '#0E1F28', n.dark);
  const frame = mix('#2A2030', '#0A0E1A', night);
  return <>
    <At z={2600}>
      <rect x={-2600} y={-2600} width={6300} height={4000} fill={wall} />
      {/* Window: sunset, then night with city lights, then morning. */}
      <defs><linearGradient id="pt-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={sky[0]} /><stop offset="1" stopColor={sky[1]} /></linearGradient></defs>
      <rect x={560} y={260} width={430} height={520} fill="url(#pt-sky)" />
      {!n.morning && night < 0.5 && <circle cx={760} cy={700} r={90} fill="#FFE2A0" opacity={0.85} />}
      {!n.morning && night > 0.5 && <path d="M 560 780 L 600 600 L 650 640 L 700 520 L 760 600 L 820 540 L 880 620 L 940 560 L 990 640 L 990 780 Z" fill="#0B1028" />}
      {!n.morning && night > 0.5 && Array.from({length: 22}, (_, i) => <rect key={i} x={575 + (i * 47) % 400} y={640 + (i * 31) % 120} width={10} height={14} fill="#FFD98A" opacity={0.5 + 0.4 * Math.sin(i + t)} />)}
      <rect x={548} y={248} width={454} height={544} fill="none" stroke={frame} strokeWidth={24} />
      <rect x={765} y={260} width={14} height={520} fill={frame} />
      {/* Sunset / morning light falling through the window. */}
      {(n.sunset > 0.05 || n.morning > 0) && <path d="M 560 780 L 990 780 L 760 1300 L 120 1300 Z" fill={n.morning ? '#FFFFFF' : '#FFB37A'} opacity={0.16 * Math.max(n.sunset, n.morning)} />}
      {/* A team pennant on the wall, left. */}
      <g transform="translate(200 430) rotate(-6)"><path d="M -150 -60 L 150 0 L -150 60 Z" fill={mix('#B8323C', '#5A1A24', n.dark)} />
        <text x={-120} y={12} fontFamily={COND} fontWeight={900} fontStyle="italic" fontSize={40} fill={mix('#F4E3C8', '#6A6070', n.dark)}>HOME</text></g>
      <rect x={-2600} y={1180} width={6300} height={2600} fill={floor} />
      {/* TV glow spilling onto the wall from the right. */}
      {tv > 0 && <><defs><radialGradient id="pt-tv"><stop offset="0" stopColor="#5FA8FF" stopOpacity={0.55} /><stop offset="1" stopColor="#5FA8FF" stopOpacity={0} /></radialGradient></defs>
        <ellipse cx={1150} cy={900} rx={700} ry={800} fill="url(#pt-tv)" opacity={tv} /></>}
    </At>
    {/* Floor lamp, left; warm pool once it's on. */}
    <At z={1700}>
      <g transform="translate(40 1180)"><rect x={-7} y={-660} width={14} height={660} fill="#1A1A22" /><ellipse cx={0} cy={0} rx={70} ry={14} fill="#111" />
        <path d="M -90 -660 L 90 -660 L 62 -780 L -62 -780 Z" fill={n.lamp ? '#FFE3A0' : mix('#7A6A5A', '#3A3440', night)} />
        {n.lamp > 0 && <><defs><radialGradient id="pt-lamp"><stop offset="0" stopColor="#FFD58A" stopOpacity={0.5} /><stop offset="1" stopColor="#FFD58A" stopOpacity={0} /></radialGradient></defs>
          <ellipse cx={60} cy={-520} rx={420} ry={460} fill="url(#pt-lamp)" opacity={1 - 0.5 * n.dark} /></>}</g>
    </At>
    {/* The couch back. */}
    <At z={1350}>
      <rect x={70} y={740} width={940} height={380} rx={60} fill={couch} />
      <rect x={70} y={740} width={940} height={70} rx={40} fill={mix(couch, '#FFFFFF', 0.08)} />
      {[0, 1].map((i) => <rect key={i} x={100 + i * 450} y={790} width={430} height={270} rx={44} fill={mix(couch, '#000000', 0.12)} />)}
      <rect x={960} y={760} width={40} height={340} rx={20} fill="#7FD3FF" opacity={0.25 * tv} />
    </At>
    {/* Him. */}
    <At z={1250}>
      <g transform={`translate(${430 - 30 * n.slouch} ${lerp(870, 950, n.slouch) - 20 * n.morning}) rotate(${lerp(0, -8, n.slouch)}) scale(0.9)`}>
        <PTGuy t={t} p={{lookDown: payoff ? 0 : lerp(0.75, 1, n.slouch), asleep: n.asleep, smile: payoff ? 0.9 : 0, phone: payoff ? 'down' : 'hold',
          flick: !payoff && t > B.thumb && t < B.nothing ? Math.max(0, Math.sin(t * 11)) : 0, glow: night, rim: payoff ? 0.2 : 0.4 + tv * 0.6, brow: payoff ? 0.4 : 0}} />
      </g>
    </At>
    {/* Seat cushion and arms in front of him; the pizza box on the right cushion. */}
    <At z={1200}>
      <rect x={50} y={1090} width={980} height={200} rx={44} fill={couch} />
      <rect x={50} y={1090} width={980} height={40} rx={20} fill={mix(couch, '#FFFFFF', 0.1)} />
      <rect x={10} y={880} width={140} height={410} rx={50} fill={couchLo} />
      <rect x={930} y={880} width={140} height={410} rx={50} fill={couchLo} />
      {!payoff && <g transform="translate(770 1090)">
        {/* The open lid stands behind the box, then flops shut. */}
        <g transform={`translate(0 -20) scale(1 ${lerp(1, 0.22, n.lid)})`}>
          <rect x={-160} y={-150} width={320} height={150} fill={mix('#C9A270', '#4A3E3A', n.dark)} />
          {n.lid > 0.5 && <text x={0} y={-50} textAnchor="middle" fontFamily={COND} fontWeight={900} fontStyle="italic" fontSize={72} fill="#B8323C">PIZZA</text>}
        </g>
        <rect x={-160} y={-24} width={320} height={50} fill={mix('#D8B27E', '#5A4A42', n.dark)} />
        {n.lid < 0.5 && Array.from({length: n.slices}, (_, i) => <path key={i} d={`M ${-120 + i * 85} -22 L ${-64 + i * 85} -22 L ${-92 + i * 85} 18 Z`} fill={mix('#F2A93B', '#6A4A2A', n.dark)} />)}
      </g>}
    </At>
    {/* Coffee table: a soda can, the remote; the phone face-down in the payoff. */}
    <At z={1000}>
      <rect x={140} y={1360} width={800} height={54} rx={12} fill={mix('#3A2E2A', '#14121A', n.dark)} />
      <rect x={140} y={1360} width={800} height={10} rx={5} fill="#FFFFFF" opacity={0.08} />
      <g transform="translate(300 1300)"><rect x={-30} y={-60} width={60} height={110} rx={12} fill={mix('#C8323C', '#4A1A20', n.dark)} />
        <rect x={-30} y={-40} width={60} height={20} fill="#F4F7FF" opacity={0.5} /></g>
      <rect x={520} y={1334} width={150} height={26} rx={10} fill="#111" />
      {payoff && <rect x={720} y={1330} width={150} height={30} rx={10} fill="#0E1220" transform="rotate(-5 795 1345)" />}
    </At>
  </>;
};

// ---------------------------------------------------------------------------------------------
// Phone close-ups in the broadcast look: a dark phone in his hand.

const PHOTO = ['#FF8A6A', '#6AB8FF', '#C38AFF', '#FFC86A', '#6AE0B8', '#FF6AA8'];

/** A generic profile "photo" card (not any app's design): a lit portrait silhouette and a name. */
const PhotoCard: React.FC<{i: number}> = ({i}) => {
  const p = PROFILES[i % PROFILES.length];
  return <g>
    <rect x={-210} y={-300} width={420} height={600} rx={30} fill={PHOTO[i % PHOTO.length]} />
    <defs><linearGradient id={`pc-${i}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0.5" stopColor="#000" stopOpacity={0} /><stop offset="1" stopColor="#000" stopOpacity={0.6} /></linearGradient></defs>
    <ellipse cx={0} cy={-40} rx={110} ry={130} fill={p.hair} />
    <ellipse cx={0} cy={-50} rx={84} ry={104} fill={p.skin} />
    <path d="M -180 300 Q -170 110 0 100 Q 170 110 180 300 Z" fill={mix(PHOTO[i % PHOTO.length], '#000000', 0.35)} />
    <rect x={-210} y={-300} width={420} height={600} rx={30} fill={`url(#pc-${i})`} />
    <text x={-180} y={250} fontFamily={COND} fontWeight={900} fontStyle="italic" fontSize={58} fill="#fff">{p.name}</text>
  </g>;
};

const DarkPhone: React.FC<{children: React.ReactNode; id: string}> = ({children, id}) => <g>
  <rect x={270} y={430} width={540} height={980} rx={80} fill="#05070E" />
  <rect x={290} y={450} width={500} height={940} rx={64} fill="#0E1426" />
  <clipPath id={id}><rect x={290} y={450} width={500} height={940} rx={64} /></clipPath>
  <g clipPath={`url(#${id})`}>{children}</g>
  <rect x={480} y={470} width={120} height={30} rx={15} fill="#05070E" />
  <path d="M 300 470 L 420 470 L 300 900 Z" fill="#fff" opacity={0.05} />
</g>;

const Thumb: React.FC = () => <g transform="rotate(-28)">
  <ellipse rx={64} ry={124} fill="#C98D6A" /><ellipse cx={18} rx={34} ry={110} fill="#A06A4E" opacity={0.5} />
  <ellipse cx={-6} cy={-80} rx={36} ry={30} fill="#E3B49A" opacity={0.7} />
</g>;

/** Slow-mo replay of the left swipes: the first flick stretched, then two quick ones. */
const SwipeReplay: React.FC<{t: number}> = ({t}) => {
  const flicks = [B.left1 - 0.1, B.again - 0.45, B.again + 0.05];
  const done = flicks.filter((f) => t >= f).length;
  const last = flicks[Math.max(0, done - 1)];
  const len = done === 1 ? 0.95 : 0.28;
  const ph = done > 0 ? clamp((t - last) / len) : 0;
  const k = ph * ph;
  return <DarkPhone id="pt-sw">
    <g transform="translate(540 900)"><PhotoCard i={done} /></g>
    {done > 0 && k < 1 && <g transform={`translate(${540 - 640 * k} ${900 - 30 * k}) rotate(${-22 * k})`}><PhotoCard i={done - 1} /></g>}
    {done > 0 && k < 0.6 && <text x={360} y={640} fontFamily={COND} fontWeight={900} fontStyle="italic" fontSize={110} fill={PT.red} opacity={1 - k / 0.6} transform="rotate(-14 360 640)">NOPE</text>}
    <g transform={`translate(${720 - 140 * Math.sin(Math.PI * clamp(ph * 1.15))} 1250)`}><Thumb /></g>
  </DarkPhone>;
};

/** The chat: one "hey", delivered, then nothing (a tumbleweed). Telestrator circle in yellow. */
const ChatClose: React.FC<{t: number}> = ({t}) => {
  const typed = t < B.hey - 0.05 ? 'hey'.slice(0, Math.floor(clamp((t - B.types) / 0.6) * 3)) : '';
  const sent = pop(t, B.hey - 0.05, 8);
  const circle = easeOut(t, B.hey + 0.3, B.hey + 0.9);
  const weed = clamp((t - B.nothing + 0.3) / 1.6);
  return <g>
    <DarkPhone id="pt-chat">
      <rect x={290} y={450} width={500} height={150} fill="#141C34" />
      <circle cx={370} cy={540} r={40} fill={PHOTO[2]} />
      <text x={430} y={530} fontFamily={COND} fontWeight={800} fontSize={40} fill={PT.white}>New match</text>
      <text x={430} y={566} fontFamily={COND} fontWeight={600} fontSize={28} fill={PT.steel}>matched today</text>
      {sent > 0 && <g transform={`translate(700 1010) scale(${sent})`}>
        <rect x={-120} y={-46} width={140} height={86} rx={36} fill={PT.blue} />
        <text x={-50} y={14} textAnchor="middle" fontFamily={COND} fontWeight={800} fontSize={44} fill={PT.white}>hey</text>
        <text x={20} y={80} textAnchor="end" fontFamily={COND} fontWeight={600} fontSize={26} fill={PT.steel}>Delivered</text>
      </g>}
      <rect x={310} y={1290} width={380} height={74} rx={37} fill="#1A2440" />
      <text x={340} y={1338} fontFamily={COND} fontWeight={700} fontSize={36} fill={typed ? PT.white : PT.steel}>{typed || 'Message'}</text>
      <circle cx={736} cy={1327} r={34} fill={typed ? PT.blue : '#1A2440'} />
      {weed > 0 && weed < 1 && <g transform={`translate(${lerp(250, 860, weed)} ${1190 - 34 * Math.abs(Math.sin(weed * 9))}) rotate(${weed * 720})`}>
        <circle r={46} fill="none" stroke="#B98A52" strokeWidth={8} />
        <path d="M -42 0 Q 0 -30 42 0 Q 0 30 -42 0 M 0 -42 Q 30 0 0 42 Q -30 0 0 -42" fill="none" stroke="#B98A52" strokeWidth={6} /></g>}
    </DarkPhone>
    <g style={{filter: `drop-shadow(0 0 10px ${PT.yellow})`}}>
      {circle > 0 && <ellipse cx={660} cy={1005} rx={130} ry={84} fill="none" stroke={PT.yellow} strokeWidth={12} strokeLinecap="round"
        strokeDasharray={680} strokeDashoffset={680 * (1 - circle)} transform="rotate(-8 660 1005)" />}
      {circle > 0.6 && <text x={410} y={890} fontFamily={COND} fontWeight={900} fontStyle="italic" fontSize={64} fill={PT.yellow} transform="rotate(-8 410 890)" opacity={smooth(circle, 0.6, 1)}>BOLD.</text>}
    </g>
  </g>;
};

const CloseShot: React.FC<{t: number; keys: Key3[]; id: string; children: React.ReactNode}> = ({t, keys, id, children}) => {
  const cam = cam3At(keys, t);
  return <Space cam={cam} id={id} bg={PT.navy}>
    <At z={2600}><rect x={-2600} y={-2600} width={6300} height={7000} fill="#0A1230" />
      {Array.from({length: 9}, (_, i) => <circle key={i} cx={-200 + i * 190} cy={300 + (i % 3) * 600} r={120 + (i % 4) * 30} fill={i % 2 ? '#1E3A80' : '#3A2A70'} opacity={0.5} />)}</At>
    <Shadow z={1000} dz={300} offset={[40, 60]} blur={40} opacity={0.6}><rect x={270} y={430} width={540} height={980} rx={80} /></Shadow>
    <Plane z={1000}>{children}</Plane>
  </Space>;
};

// ---------------------------------------------------------------------------------------------
// The brand moment: NoSwipe at work, then Maya's date card (noswipe.app look).

const BrandSwipes: React.FC<{t: number; from: number}> = ({t, from}) => {
  const el = Math.max(0, t - from), i = Math.floor(el / 0.3), ph = (el / 0.3) % 1;
  const k = Math.pow(clamp((ph - 0.45) / 0.5), 2);
  return <g>
    <BrandPhone x={300} y={480} w={480} h={800} />
    <clipPath id="bs-clip"><rect x={322} y={502} width={436} height={756} rx={54} /></clipPath>
    <g clipPath="url(#bs-clip)">
      <g transform="translate(540 900) scale(0.74) translate(-540 -695)"><ProfileCard p={PROFILES[(i + 1) % PROFILES.length]} /></g>
      <g transform={`translate(${560 * k} ${-30 * k}) rotate(${20 * k} 540 900)`}><g transform="translate(540 900) scale(0.74) translate(-540 -695)"><ProfileCard p={PROFILES[i % PROFILES.length]} /></g></g>
    </g>
  </g>;
};

const TurnShot: React.FC<{t: number; from: number; to: number}> = ({t, from, to}) => {
  const cam = cam3At([key(from, 540, 960, 30, -0.4, 1000), key(to, 545, 950, 110, 0.4, 1000)], t);
  const confirm = pop(t, B.books + 0.1, 9);
  const slide = easeOut(t, B.maya - 0.3, B.maya + 0.25);
  const bubbles = [0, 1, 2].map((i) => pop(t, B.chats + i * 0.2, 8));
  return <Space cam={cam} id="fn-turn" bg={K.paper}>
    <Backdrop t={t} />
    <SoftShadow z={1000} dz={200}><rect x={300} y={480} width={480} height={800} rx={72} /></SoftShadow>
    <Plane z={1000}>
      {t < B.swipes - 0.1 ? <g><BrandPhone x={300} y={480} w={480} h={800} />
        <Logo x={540} y={860} r={100 * pop(t, B.builds - 0.5, 9)} />
        <text x={540} y={1050} textAnchor="middle" fontFamily={DISPLAY} fontSize={44} fill={K.grape} opacity={smooth(t, B.builds - 0.2, B.builds + 0.1)}>building profiles…</text></g>
        : <BrandSwipes t={t} from={B.swipes - 0.1} />}
      {bubbles.map((k, i) => k > 0 && <g key={i} transform={`translate(${i % 2 ? 650 : 430} ${620 + i * 130}) scale(${k})`}>
        <rect x={-120} y={-44} width={240} height={88} rx={38} fill={i % 2 ? K.lilac : K.lime} stroke={K.grape} strokeWidth={6} />
        {[0, 1, 2].map((d) => <circle key={d} cx={-40 + d * 40} cy={0} r={11} fill={K.grape} />)}
      </g>)}
      {confirm > 0 && slide < 0.3 && <g transform={`translate(540 960) scale(${confirm})`}>
        <rect x={-300} y={-58} width={600} height={116} rx={40} fill={K.grape} transform="translate(10 12)" />
        <rect x={-300} y={-58} width={600} height={116} rx={40} fill={K.lime} stroke={K.grape} strokeWidth={8} />
        <text x={0} y={20} textAnchor="middle" fontFamily={DISPLAY} fontSize={56} fill={K.grape}>Date confirmed</text>
      </g>}
    </Plane>
    {slide > 0 && <><SoftShadow z={940} dz={100}><g transform={`translate(0 ${(1 - slide) * 900})`}><DateCard who="maya" y={470} /></g></SoftShadow>
      <Plane z={940}><g transform={`translate(0 ${(1 - slide) * 900})`}><DateCard who="maya" y={470} /></g></Plane></>}
  </Space>;
};

// ---------------------------------------------------------------------------------------------
// Shots and the edit.

const RoomShot: React.FC<{t: number; keys: Key3[]; payoff?: boolean; children?: (cam: Cam3) => React.ReactNode}> = ({t, keys, payoff, children}) => {
  const cam = cam3At(keys, t);
  return <Space cam={cam} id={payoff ? 'pt-am' : 'pt-room'} bg="#141A2E"><Room t={t} payoff={payoff} />{children?.(cam)}</Space>;
};

/** The telestrator on the 9 PM shot: he hasn't moved since seven. */
const NoMovement: React.FC<{t: number}> = ({t}) => {
  const draw = easeOut(t, B.couch, B.couch + 0.7);
  const label = pop(t, B.pizza - 0.3, 8);
  return <g style={{filter: `drop-shadow(0 0 10px ${PT.yellow})`}}>
    <ellipse cx={400} cy={880} rx={250} ry={290} fill="none" stroke={PT.yellow} strokeWidth={12} strokeDasharray={1800} strokeDashoffset={1800 * (1 - draw)} />
    <path d={`M 690 620 Q 780 540 ${lerp(690, 640, draw)} 720`} fill="none" stroke={PT.yellow} strokeWidth={10} strokeLinecap="round" opacity={draw} />
    {label > 0 && <g transform={`translate(800 600) scale(${label})`}>
      <rect x={-210} y={-56} width={420} height={112} fill={PT.navy} transform="skewX(-14)" />
      <text x={-170} y={-12} fontFamily={COND} fontWeight={800} fontStyle="italic" fontSize={30} fill={PT.steel}>DISTANCE MOVED</text>
      <text x={-170} y={40} fontFamily={COND} fontWeight={900} fontStyle="italic" fontSize={52} fill={PT.yellow}>0 INCHES</text>
    </g>}
  </g>;
};

type Shot = {from: number; render: (t: number) => React.ReactNode; replay?: boolean; plain?: boolean};
const cut = (name: string, lead = 0.1) => B[name] - lead;

const SHOTS: Shot[] = [
  {from: 0, render: (t) => <RoomShot t={t} keys={[key(0, 540, 960, -110, -0.6), key(cut('replay1'), 520, 930, 60, 0.4)]} />},
  {from: cut('replay1'), replay: true, render: (t) => <CloseShot t={t} id="pt-rep" keys={[key(cut('replay1'), 540, 960, 60, 1, 1000, 4), key(cut('opens'), 540, 950, 150, -1, 1000, 4)]}><SwipeReplay t={t} /></CloseShot>},
  {from: cut('opens'), render: (t) => <CloseShot t={t} id="pt-chat" keys={[key(cut('opens'), 540, 960, 60, -0.5, 1000, 4), key(B.hey + 0.4, 590, 1000, 230, 0.5, 1000, 4), key(cut('nine'), 560, 980, 190, 0, 1000, 4)]}><ChatClose t={t} /></CloseShot>},
  {from: cut('nine'), render: (t) => <RoomShot t={t} keys={[key(cut('nine'), 540, 960, -100, 0.4), key(cut('midnight'), 490, 930, 40, -0.2)]}>{(cam) => <Hud cam={cam}><NoMovement t={t} /></Hud>}</RoomShot>},
  {from: cut('midnight'), render: (t) => <RoomShot t={t} keys={[key(cut('midnight'), 520, 960, -110, 0), key(B.zero, 560, 980, -40, 0), key(cut('sub'), 700, 1050, 140, 1)]} />},
  {from: cut('sub'), render: (t) => <TurnShot t={t} from={cut('sub')} to={cut('same')} />},
  {from: cut('same'), render: (t) => <RoomShot t={t} payoff keys={[key(cut('same'), 540, 940, 40, 0.4), key(cut('endcard'), 540, 960, -110, -0.4)]} />},
  {from: cut('endcard'), plain: true, render: (t) => <EndCard t={t} start={cut('endcard')} end={B.end} />},
];
const STINGERS = SHOTS.slice(1).filter((s) => !s.plain);

const STATES: ScoreState[] = spec.scoreboard.states.map((s) => ({at: B[s.atBeat] - (s.atBeat === 'kickoff' ? 10 : 0.05), clock: s.clock, values: s.values as [string, string],
  bad: 'bad' in s ? Boolean(s.bad) : false, good: 'good' in s ? Boolean(s.good) : false}));

const current = (t: number) => { let i = 0; while (i + 1 < SHOTS.length && t >= SHOTS[i + 1].from) i++; return SHOTS[i]; };
const fast: [number, number][] = [[B.left1 - 0.1, B.again + 0.35], [B.maya - 0.3, B.maya + 0.25], [B.swipes - 0.1, B.books]];
const isFast = (t: number) => STINGERS.some((s) => Math.abs(t - s.from) < 0.28) || fast.some(([a, b]) => t >= a && t < b);

/** Narration captions in the broadcast type: white condensed italic, the spoken word on a yellow slash. */
const Captions: React.FC<{t: number; chunks: Chunk[]; hideFrom: number}> = ({t, chunks, hideFrom}) => {
  const c = chunks.find((x) => t >= x.start - 0.03 && t < x.end);
  if (!c || t >= hideFrom) return null;
  const k = easeOut(t, c.start - 0.03, c.start + 0.1);
  return <div style={{position: 'absolute', left: 50, right: 50, top: 1150, textAlign: 'center', opacity: k, transform: `translateX(${(1 - k) * -20}px)`}}>
    {c.words.map((w, i) => {
      const on = t >= w.start && t < w.end + 0.05;
      return <span key={i} style={{display: 'inline-block', margin: '0 8px', padding: '0 14px', background: on ? PT.yellow : 'transparent', transform: 'skewX(-12deg)',
        fontFamily: COND, fontWeight: 900, fontStyle: 'italic', fontSize: 74, lineHeight: 1.2, color: on ? PT.ink : PT.white,
        textShadow: on ? 'none' : `0 4px 0 ${PT.ink}, 0 0 18px rgba(3,8,26,0.9)`}}>{w.text.replace(/["…]/g, '').toUpperCase()}</span>;
    })}
  </div>;
};

/** The plain setup on frame 1, as a broadcast title card. */
const ContextTitle: React.FC<{t: number}> = ({t}) => {
  const k = 1 - smooth(t, 2.5, 2.9);
  return <AbsoluteFill style={{opacity: k, pointerEvents: 'none'}}><svg width={1080} height={1920}>
    <g transform="translate(0 500)">
      <rect x={90} y={0} width={940} height={140} fill={PT.navy} opacity={0.92} transform="skewX(-14)" />
      <rect x={90} y={140} width={940} height={10} fill={PT.yellow} transform="skewX(-14)" />
      <text x={540} y={98} textAnchor="middle" fontFamily={COND} fontWeight={900} fontStyle="italic" fontSize={84} fill={PT.white}>{spec.context.toUpperCase()}</text>
    </g>
  </svg></AbsoluteFill>;
};

export const FridayNightLive: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const LINES = tl.lines;
  const musicVol = (f: number) => lerp(0.5, 0.25, speechOf(LINES)(f / fps));
  const onAir = t < cut('sub') || (t >= cut('same') && t < cut('endcard'));
  const replay = hold(t, cut('replay1') + 0.15, cut('replay1') + 0.3, cut('opens') - 0.1, cut('opens'));
  const cam = t < cut('replay1') ? 'CAM 1' : t < cut('nine') ? 'CAM 4' : t < cut('midnight') ? 'CAM 1' : t < cut('sub') ? 'CAM 2' : 'CAM 1';
  return <AbsoluteFill style={{background: PT.navy}}>
    <Audio src={staticFile('audio/friday-night-live-music.wav')} volume={musicVol} />
    <Audio src={staticFile('audio/friday-night-live-crowd.wav')} volume={0.45} />
    <Audio src={staticFile('audio/friday-night-live-sfx.wav')} volume={0.7} />
    {LINES.map((l, i) => <Sequence key={i} from={Math.round(l.start * fps)}><Audio src={staticFile(l.file)} /></Sequence>)}
    <MotionBlurWhen fast={isFast(t)}>
      <AbsoluteFill>{current(t).render(t)}</AbsoluteFill>
      {STINGERS.map((s, i) => <Stinger key={i} t={t} at={s.from} replay={s.replay} />)}
    </MotionBlurWhen>
    {onAir ? <>
      <BroadcastFinish k={1} />
      <ReplayFrame k={replay} />
      <ScoreBug t={t} labels={spec.scoreboard.labels as [string, string]} states={STATES} k={1} />
      <CamLabel text={cam} k={1 - replay} />
    </> : <Grain />}
    <LowerThird t={t} from={B.plan} to={cut('replay1') - 0.1} title="FRIDAY NIGHT" sub="LIVE FROM THE COUCH" />
    <LowerThird t={t} from={B.nothing + 0.2} to={cut('nine')} title="REPLY" tag="PENDING" />
    <FinalBar t={t} at={B.zero - 0.05} to={cut('sub')} label="Date plans" value="0" />
    <SubBoard t={t} at={cut('sub') + 0.05} to={B.builds - 0.3} outText="HIS THUMB" inText="NOSWIPE" />
    {t < 2.9 && <ContextTitle t={t} />}
    <SoftCta t={t} from={B.maya} to={cut('same')} />
    <Captions t={t} chunks={chunksOf(LINES, wordsOf(LINES))} hideFrom={cut('endcard')} />
  </AbsoluteFill>;
};
