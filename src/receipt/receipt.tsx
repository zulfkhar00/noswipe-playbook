import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, easeOut, hold, lerp, smooth} from '../lib/motion';
import {Plane, Space, cam3At} from '../lib/space';
import {Line, chunksOf, speechOf, wordsOf, wrap} from '../lib/speech';
import {MotionBlurWhen, Shot, SwipeCuts, inCut} from '../lib/shots';
import {DISPLAY, K, Logo, Pill, SANS} from '../brand/brand';
import {Guy} from '../brand/characters';
import {Backdrop, Captions, DateCard, DateKey, EndCard, Grain, PROFILES, ProfileCard, SoftCta, SoftShadow, Ticker, pop} from '../brand/scenes';

// "Your Dating App Receipt" (FORMATS.md, format 1). One engine for every episode: the spec in
// specs/<id>.json gives the receipt lines, cutaways and NoSwipe receipt; the audio script turns it
// into src/receipt/<id>.timeline.json (lines, exact words, mouth, beats). Each episode only picks a
// set (bedroom, train) for the printing scenes.

export const RECEIPT_FPS = 60;

type Item = {label: string; value: string; atBeat: string; bad?: boolean};
export type Spec = {
  id: string; set: 'bedroom' | 'train' | 'gym'; context: string;
  receipt: {header: string; items: Item[]; total: {label: string; value: string; atBeat: string};
    equivalent: {text: string; math: string; atBeat: string; visual: 'pillows' | 'weeks' | 'workouts'; count: number}};
  cutaways: {type: 'swipes' | 'hey' | 'stops' | 'sets'; from: string; to: string; counter?: string; total?: number; alive?: number; count?: number}[];
  noswipeReceipt: {items: Item[]; date: string};
  /** Optional gag: the printer stalls with this item half printed, from one beat to another. */
  stall?: {item: string; from: string; to: string};
};
export type Timeline = {lines: Line[]; beats: Record<string, number>; duration: number};

// ---------------------------------------------------------------------------------------------
// The receipt paper. It rises out of the phone's top edge (the "printer slot") like a thermal
// printer, so the newest line is always just above the slot and older lines move up.

const SLOT_Y = 1100;
const PAPER_X = 170, PAPER_W = 740;
type Row = {key: string; at: number; h: number; draw: (y: number, k: number) => React.ReactNode; prog?: (t: number) => number};

/** "4,000" counts up while the line prints; anything that isn't a plain number just appears. */
const rolling = (v: string, k: number) => {
  const m = /^[\d,]+$/.test(v) ? parseInt(v.replace(/,/g, ''), 10) : NaN;
  return Number.isNaN(m) ? v : Math.round(m * Math.min(1, k * 1.25)).toLocaleString('en-US');
};

const ItemRow = (it: Item): Omit<Row, 'at' | 'key'> => {
  const lines = wrap(it.label, 20);
  const h = 46 + lines.length * 44;
  return {h, draw: (y, k) => <g opacity={clamp(k * 1.5)}>
    {lines.map((l, i) => <text key={i} x={PAPER_X + 38} y={y + 56 + i * 44} fontFamily={SANS} fontWeight={700} fontSize={38} fill={K.grape}>{l}</text>)}
    <text x={PAPER_X + PAPER_W - 38} y={y + 62} textAnchor="end" fontFamily={DISPLAY} fontSize={62} fill={it.bad ? K.coral : K.grape}>{rolling(it.value, k)}</text>
    <line x1={PAPER_X + 30} x2={PAPER_X + PAPER_W - 30} y1={y + h - 6} y2={y + h - 6} stroke={K.grape3} strokeWidth={2} strokeDasharray="6 8" opacity={0.5} />
  </g>};
};

/** The beat where the first item is spoken: the earliest beat after start. */
const firstBeat = (spec: Spec) => (spec.set === 'bedroom' ? 'nights' : 'rides');

const buildRows = (spec: Spec, B: Record<string, number>, lime = false): Row[] => {
  const rows: Row[] = [];
  rows.push({key: 'header', at: -1, h: 150, draw: (y) => <g>
    <text x={PAPER_X + PAPER_W / 2} y={y + 62} textAnchor="middle" fontFamily={DISPLAY} fontSize={lime ? 56 : 44} fill={K.grape}>{lime ? 'NOSWIPE' : spec.receipt.header.split(' · ')[0]}</text>
    <text x={PAPER_X + PAPER_W / 2} y={y + 114} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={30} fill={K.grape3}>{lime ? 'we swipe · you date' : `2026 · thank you for swiping`}</text>
  </g>});
  if (lime) {
    spec.noswipeReceipt.items.forEach((it, i) => rows.push({key: `n${i}`, at: B[it.atBeat] ?? 0, ...ItemRow(it)}));
    return rows;
  }
  spec.receipt.items.forEach((it, i) => {
    const at = it.atBeat === 'start' ? B[firstBeat(spec)] : B[it.atBeat];
    const st = spec.stall?.item === it.atBeat ? spec.stall : undefined;
    // A stalled line creeps two thirds of the way out, hangs there, then finishes on the restart.
    const prog = st ? (t: number) => 0.45 * easeOut(t, at - 0.12, at + 1.6) + 0.55 * easeOut(t, B[st.to], B[st.to] + 0.3) : undefined;
    const row = ItemRow(it);
    // The stalled line's number is already fully printed; only the paper is stuck.
    rows.push({key: `i${i}`, at, prog, ...row, draw: st ? (y, k) => row.draw(y, Math.min(1, k / 0.45)) : row.draw});
  });
  const tot = spec.receipt.total;
  rows.push({key: 'total', at: B[tot.atBeat], h: 190, draw: (y, k) => {
    const slam = 1 + 0.5 * Math.max(0, 1 - k * 1.4);
    return <g opacity={clamp(k * 2)}>
      <line x1={PAPER_X + 24} x2={PAPER_X + PAPER_W - 24} y1={y + 10} y2={y + 10} stroke={K.grape} strokeWidth={5} />
      <text x={PAPER_X + 34} y={y + 62} fontFamily={SANS} fontWeight={800} fontSize={36} fill={K.grape}>{tot.label}</text>
      <g transform={`translate(${PAPER_X + PAPER_W / 2} ${y + 158}) scale(${slam})`}>
        <text x={0} y={0} textAnchor="middle" fontFamily={DISPLAY} fontSize={104} fill={K.coral}>{tot.value}</text>
      </g>
    </g>;
  }});
  const eq = spec.receipt.equivalent;
  rows.push({key: 'eq', at: B[eq.atBeat], h: 112, draw: (y, k) => <g opacity={clamp(k * 2)}>
    <text x={PAPER_X + PAPER_W / 2} y={y + 56} textAnchor="middle" fontFamily={DISPLAY} fontSize={48} fill={K.grape}>{eq.text}</text>
    <text x={PAPER_X + PAPER_W / 2} y={y + 96} textAnchor="middle" fontFamily={SANS} fontWeight={600} fontSize={28} fill={K.grape3}>({eq.math})</text>
  </g>});
  return rows;
};

/** The rising receipt. Rows print in over 0.35 s; the paper's top edge is a torn zigzag. */
const Paper: React.FC<{t: number; rows: Row[]; tint?: string; id: string}> = ({t, rows, tint = '#FFFEF7', id}) => {
  const p = (r: Row) => (r.prog ? r.prog(t) : r.at < 0 ? 1 : easeOut(t, r.at - 0.12, r.at + 0.23));
  const shown = rows.filter((r) => p(r) > 0);
  let y = SLOT_Y - 18;
  const placed = [...shown].reverse().map((r) => { y -= r.h * p(r); return {r, y}; }).reverse();
  const top = placed.length ? placed[0].y - 20 : SLOT_Y - 30;
  const zig = Array.from({length: 30}, (_, i) => `L ${PAPER_X + (i + 0.5) * PAPER_W / 29} ${top + (i % 2 ? 0 : 14)}`).join(' ');
  return <g>
    <defs><clipPath id={`${id}-slot`}><rect x={PAPER_X - 40} y={-3000} width={PAPER_W + 80} height={3000 + SLOT_Y} /></clipPath>
      <linearGradient id={`${id}-shade`} x1="0" x2="1"><stop offset="0" stopColor="#000" stopOpacity={0.06} /><stop offset="0.12" stopColor="#000" stopOpacity={0} /><stop offset="0.88" stopColor="#000" stopOpacity={0} /><stop offset="1" stopColor="#000" stopOpacity={0.08} /></linearGradient></defs>
    <g clipPath={`url(#${id}-slot)`}>
      <path d={`M ${PAPER_X} ${SLOT_Y} L ${PAPER_X} ${top + 14} ${zig} L ${PAPER_X + PAPER_W} ${top + 14} L ${PAPER_X + PAPER_W} ${SLOT_Y} Z`} fill={tint} stroke={K.grape} strokeWidth={4} />
      <rect x={PAPER_X} y={top} width={PAPER_W} height={SLOT_Y - top} fill={`url(#${id}-shade)`} />
      {placed.map(({r, y: ry}) => <React.Fragment key={r.key}>{r.draw(ry, p(r))}</React.Fragment>)}
    </g>
  </g>;
};

/** The phone standing below the paper; its top edge is the printer slot. Decorative, in the bottom band. */
const PrinterPhone: React.FC<{glow?: number; jam?: number}> = ({glow = 1, jam = 0}) => <g>
  <rect x={226} y={SLOT_Y + 14} width={660} height={800} rx={84} fill={K.grape} />
  <rect x={210} y={SLOT_Y - 6} width={660} height={800} rx={84} fill={K.card} stroke={K.grape} strokeWidth={9} />
  <rect x={234} y={SLOT_Y + 18} width={612} height={752} rx={64} fill={K.lilac} opacity={0.5 + 0.5 * glow} />
  <rect x={PAPER_X + 30} y={SLOT_Y - 12} width={PAPER_W - 60} height={16} rx={8} fill={K.grape} />
  {jam > 0 && <circle cx={810} cy={SLOT_Y + 50} r={22} fill={K.coral} stroke={K.grape} strokeWidth={5} opacity={jam} />}
</g>;

// ---------------------------------------------------------------------------------------------
// Sets for the printing scenes.

/** A plane that stays at ~1.05x whatever the camera's z, for text that must stay inside the safe band. */
const hud = (camZ: number) => 950 + camZ;

const far = (x: number, y: number, z: number): [number, number] => [540 + (x - 540) * z / 1000, 960 + (y - 960) * z / 1000];

const Bedroom: React.FC<{t: number; B: Record<string, number>}> = ({t, B}) => {
  const [mx, my] = far(860, 470, 2600);
  const minute = (t / 36) * 360;   // the clock creeps past 1:00
  const yawn = hold(t, (B.bedtime ?? 99) - 0.1, (B.bedtime ?? 99) + 0.15, (B.bedtime ?? 99) + 0.6, (B.bedtime ?? 99) + 0.9);
  return <>
    <Plane z={3000} noBlur><rect x={-2500} y={-3500} width={6100} height={9000} fill="#2A2156" /></Plane>
    <Plane z={2600}>
      <circle cx={mx} cy={my} r={260} fill={K.lime} opacity={0.9} />
      {Array.from({length: 30}, (_, i) => { const [sx, sy] = far(80 + ((i * 197) % 920), 320 + ((i * 131) % 700), 2600); return <circle key={i} cx={sx} cy={sy} r={10} fill="#FFF8F0" opacity={0.35 + 0.35 * Math.sin(t * 2 + i)} />; })}
    </Plane>
    <Plane z={1600}>
      {/* The window frame and the wall around it. */}
      <path fillRule="evenodd" d="M -1200 -1200 H 2400 V 3000 H -1200 Z M 420 250 H 1180 V 900 H 420 Z" fill="#3A2F6E" />
      <rect x={790} y={250} width={18} height={650} fill={K.grape} /><rect x={420} y={565} width={760} height={18} fill={K.grape} />
      <rect x={410} y={240} width={780} height={670} fill="none" stroke={K.grape} strokeWidth={20} />
    </Plane>
    {/* Wall clock, top left. */}
    <Plane z={1350}><g transform="translate(250 430)">
      <circle r={120} fill={K.lilac} stroke={K.grape} strokeWidth={9} />
      {Array.from({length: 12}, (_, i) => <rect key={i} x={-4} y={-104} width={8} height={18} fill={K.grape} transform={`rotate(${i * 30})`} />)}
      <rect x={-6} y={-62} width={12} height={66} rx={6} fill={K.grape} transform={`rotate(${30 + minute / 12})`} />
      <rect x={-4} y={-92} width={8} height={96} rx={4} fill={K.coral} transform={`rotate(${minute})`} />
      <circle r={10} fill={K.grape} />
      <text x={0} y={175} textAnchor="middle" fontFamily={DISPLAY} fontSize={44} fill="#FFF8F0">1:00 AM</text>
    </g></Plane>
    {/* Him, in bed at the left, lit by the phone; yawns on "bedtime". */}
    <Plane z={1150}>
      <rect x={-220} y={760} width={520} height={190} rx={70} fill="#FFF8F0" stroke={K.grape} strokeWidth={8} />
      <g transform="translate(110 900) scale(0.62) rotate(8)"><Guy t={t} relief={0} lookDown={0.6} talk={yawn} /></g>
      <rect x={-260} y={940} width={640} height={420} rx={60} fill={K.lilac} stroke={K.grape} strokeWidth={8} />
      <ellipse cx={170} cy={820} rx={160} ry={120} fill={K.lilac} opacity={0.18} />
    </Plane>
  </>;
};

const Train: React.FC<{t: number; B: Record<string, number>; blank?: number; lookUp?: number}> = ({t, B, blank = 0, lookUp = 0}) => {
  const strip = (z: number, speed: number, draw: (x: number) => React.ReactNode, n: number, span: number) =>
    <Plane z={z}>{Array.from({length: n}, (_, i) => { const x = ((i * span - t * speed) % (span * n) + span * n) % (span * n) - 600; return <React.Fragment key={i}>{draw(x)}</React.Fragment>; })}</Plane>;
  const sway = Math.sin(t * 2.6) * 4;
  return <>
    <Plane z={3200} noBlur><rect x={-2500} y={-3500} width={6100} height={9000} fill={K.sky} /></Plane>
    <g opacity={1 - blank}>
      {strip(3000, 160, (x) => <ellipse cx={x} cy={1080} rx={520} ry={260} fill={K.lime} />, 6, 900)}
      {strip(2000, 520, (x) => <g><rect x={x - 14} y={760} width={28} height={260} fill={K.grape2} /><circle cx={x} cy={720} r={110} fill={K.lilac} stroke={K.grape} strokeWidth={7} /></g>, 8, 520)}
      {strip(1450, 1400, (x) => <rect x={x} y={300} width={22} height={760} fill={K.grape} />, 6, 640)}
    </g>
    {/* The carriage: window cut-out, frame, seat backs; everything sways a little. */}
    <Plane z={1250}><g transform={`translate(0 ${sway})`}>
      <path fillRule="evenodd" d="M -1200 -1200 H 2400 V 3000 H -1200 Z M 160 330 H 1000 V 900 H 160 Z" fill={K.paper} />
      <rect x={150} y={320} width={860} height={590} rx={40} fill="none" stroke={K.grape} strokeWidth={18} />
      <rect x={-200} y={990} width={1500} height={40} fill={K.coral} stroke={K.grape} strokeWidth={6} />
    </g></Plane>
    <Plane z={1120}><g transform={`translate(0 ${sway * 1.2})`}>
      <rect x={-140} y={760} width={440} height={520} rx={60} fill={K.coral} stroke={K.grape} strokeWidth={8} />
      <g transform="translate(130 960) scale(0.62)"><Guy t={t} relief={0.3 * lookUp} lookDown={1 - lookUp} /></g>
    </g></Plane>
  </>;
};

const Dumbbell: React.FC<{x: number; y: number; s?: number; fill?: string}> = ({x, y, s = 1, fill = K.coral}) =>
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-70} y={-8} width={140} height={16} rx={6} fill={K.grape} />
    {[-1, 1].map((d) => <rect key={d} x={d * 52 - 16} y={-38} width={32} height={76} rx={10} fill={fill} stroke={K.grape} strokeWidth={6} />)}
  </g>;

const Gym: React.FC<{t: number; B: Record<string, number>; stare?: number}> = ({t, B, stare = 0}) => {
  // The rest timer on the wall counts down 3:00 over and over, a little fast.
  const left = 180 - Math.floor((t * 6) % 180);
  const timer = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
  void B;
  return <>
    <Plane z={3000} noBlur><rect x={-2500} y={-3500} width={6100} height={9000} fill={K.paper} /></Plane>
    <Plane z={2600}><circle cx={1150} cy={500} r={520} fill={K.lime} /><circle cx={-150} cy={1500} r={480} fill={K.lilac} /></Plane>
    {/* Dumbbell rack, right. */}
    <Plane z={1600}><g transform="translate(860 560)">
      <rect x={-260} y={-20} width={520} height={30} rx={10} fill={K.grape} /><rect x={-260} y={170} width={520} height={30} rx={10} fill={K.grape} />
      <rect x={-250} y={-20} width={24} height={420} fill={K.grape} /><rect x={226} y={-20} width={24} height={420} fill={K.grape} />
      {[-150, 0, 150].map((x) => <Dumbbell key={x} x={x} y={-50} s={0.9} fill={K.lilac} />)}
      {[-150, 0, 150].map((x) => <Dumbbell key={x} x={x} y={140} s={0.9} fill={K.coral} />)}
    </g></Plane>
    {/* Rest timer, top left. */}
    <Plane z={1350}><g transform="translate(250 450)">
      <rect x={-170} y={-95} width={340} height={190} rx={34} fill={K.grape} transform="translate(12 14)" />
      <rect x={-170} y={-95} width={340} height={190} rx={34} fill={K.card} stroke={K.grape} strokeWidth={8} />
      <text x={0} y={-30} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={34} fill={K.grape3}>REST</text>
      <text x={0} y={55} textAnchor="middle" fontFamily={DISPLAY} fontSize={84} fill={K.coral}>{timer}</text>
    </g></Plane>
    {/* Him on the bench, right; he looks up at us while the printer is stuck. */}
    <Plane z={1150}>
      <g transform="translate(1000 930) scale(0.62)"><Guy t={t} relief={0.2 * stare} lookDown={1 - stare} /></g>
      <rect x={-200} y={1020} width={1480} height={90} rx={40} fill={K.coral} stroke={K.grape} strokeWidth={8} />
      <rect x={120} y={1110} width={40} height={300} fill={K.grape} /><rect x={920} y={1110} width={40} height={300} fill={K.grape} />
    </Plane>
  </>;
};

// ---------------------------------------------------------------------------------------------
// Shots.

const PrintShot: React.FC<{t: number; spec: Spec; B: Record<string, number>; from: number; to: number}> = ({t, spec, B, from, to}) => {
  const slam = hold(t, B.total - 0.05, B.total + 0.05, B.total + 0.2, B.total + 0.45);
  const cam = cam3At([{t: from, x: 540, y: 960, z: 20, rot: -0.5, focus: 980, aperture: 6}, {t: to, x: 548, y: 950, z: 110, rot: 0.5, focus: 890, aperture: 6}], t);
  const shake = slam > 0 ? Math.sin(t * 90) * 10 * slam : 0;
  const rows = buildRows(spec, B);
  const ctx = 1 - smooth(t, 3.2, 3.7);
  const blank = spec.set === 'train' ? smooth(t, (B.none ?? 99) - 0.1, (B.none ?? 99) + 0.6) : 0;
  const st = spec.stall;
  const jam = st ? hold(t, B[st.from] - 0.6, B[st.from] - 0.4, B[st.to] - 0.2, B[st.to]) : 0;
  const blink = jam * (Math.sin(t * 9) > 0 ? 1 : 0.25);
  return <Space cam={{...cam, x: cam.x + shake + 50 * jam, z: cam.z + 40 * slam + 35 * jam}} id="rc-print" bg={K.paper}>
    {spec.set === 'bedroom' ? <Bedroom t={t} B={B} /> : spec.set === 'gym' ? <Gym t={t} B={B} stare={jam} /> : <Train t={t} B={B} blank={blank} />}
    <SoftShadow z={980} dz={170} offset={[30, 26]} opacity={0.3}><Paper t={t} rows={rows} id="rcsh" /></SoftShadow>
    <Plane z={1000}><PrinterPhone jam={blink} /></Plane>
    <Plane z={980}><g transform={`translate(${jam * Math.sin(t * 70) * 3} ${jam * Math.sin(t * 53) * 2})`}><Paper t={t} rows={rows} id="rcp" /></g></Plane>
    {ctx > 0.01 && <Plane z={hud(cam.z)} noBlur><g opacity={ctx}>
      {wrap(spec.context, 22).map((l, i, all) => <text key={i} x={540} y={350 + i * 76 - (all.length - 1) * 38} textAnchor="middle" fontFamily={DISPLAY} fontSize={68}
        fill={K.grape} stroke={K.paper} strokeWidth={14} paintOrder="stroke">{l}</text>)}
    </g></Plane>}
  </Space>;
};

const SwipesCut: React.FC<{t: number; B: Record<string, number>; c: Spec['cutaways'][number]; matches: string}> = ({t, B, c, matches}) => {
  const from = B[c.from];
  const cam = cam3At([{t: from, x: 540, y: 960, z: 40, rot: -0.6, focus: 960, aperture: 6}, {t: B[c.to], x: 548, y: 948, z: 120, rot: 0.4, focus: 880, aperture: 6}], t);
  const n = Math.round(lerp(0, parseInt((c.counter ?? '0').replace(/,/g, ''), 10), smooth(t, from, B[c.to] - 0.3)));
  const match = pop(t, B.matches ?? from + 1, 10);
  const CARDS = 12, gap = (B[c.to] - from - 0.5) / CARDS;
  return <Space cam={cam} id="rc-swipes" bg={K.paper}>
    <Backdrop t={t} a={[900, 600, 360]} b={[160, 1250, 320]} />
    {/* A stream of cards flicked away for the whole cut; only the top three are drawn. */}
    {Array.from({length: CARDS}, (_, i) => CARDS - 1 - i).map((i) => {
      const go = from + 0.1 + i * gap;
      const k = Math.pow(clamp((t - go) / 0.24), 2.2);
      const dir = i % 2 ? 1 : -1;
      const top = Math.max(0, Math.floor((t - from - 0.1) / gap));
      if (k >= 1 || i > top + 2) return null;
      return <Plane key={i} z={1000 + (i - top) * 45}><g transform={`translate(${dir * 980 * k} ${-80 * k}) rotate(${dir * 24 * k} 540 1060)`}><g transform="translate(540 760) scale(0.86) translate(-540 -680)"><ProfileCard p={PROFILES[i % PROFILES.length]} /></g></g></Plane>;
    })}
    <Plane z={hud(cam.z)} noBlur>
      <text x={540} y={345} textAnchor="middle" fontFamily={DISPLAY} fontSize={110} fill={K.grape}>{n.toLocaleString('en-US')}</text>
      <text x={540} y={402} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={40} fill={K.grape}>swipes</text>
      {match > 0 && <g transform={`translate(540 1060) scale(${match}) rotate(-4)`}><Pill x={0} y={0} text={`${matches} matches`} size={52} fill={K.lime} font="display" shadow weight={400} /></g>}
    </Plane>
  </Space>;
};

const HeyCut: React.FC<{t: number; B: Record<string, number>; c: Spec['cutaways'][number]; label: string}> = ({t, B, c, label}) => {
  const from = B[c.from];
  const cam = cam3At([{t: from, x: 540, y: 960, z: 30, rot: 0.5, focus: 970, aperture: 6}, {t: B[c.to], x: 535, y: 955, z: 100, rot: -0.5, focus: 900, aperture: 6}], t);
  const total = c.total ?? 6, alive = c.alive ?? 1;
  return <Space cam={cam} id="rc-hey" bg={K.paper}>
    <Backdrop t={t} a={[180, 620, 340]} b={[900, 1240, 340]} />
    {Array.from({length: total}, (_, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const x = 230 + col * 330, y = 430 + row * 200;
      const dies = i < total - alive;
      const dead = dies ? smooth(t, from + 0.25 + i * 0.12, from + 0.45 + i * 0.12) : 0;
      const k = pop(t, from + i * 0.06, 8);
      const z = 1000 + (i % 3) * 40;
      const node = <g transform={`translate(${x} ${y}) scale(${k})`} opacity={1 - 0.6 * dead}>
        <rect x={8} y={10} width={260} height={110} rx={44} fill={K.grape} />
        <rect width={260} height={110} rx={44} fill={dead > 0.5 ? '#D9D3E4' : (dies ? K.coral : K.lime)} stroke={K.grape} strokeWidth={6} />
        <text x={130} y={72} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={48} fill={K.grape}>hey</text>
        {dead > 0.5 && <text x={250} y={140} textAnchor="end" fontFamily={SANS} fontWeight={700} fontSize={24} fill={K.grape3}>seen</text>}
      </g>;
      return <React.Fragment key={i}><SoftShadow z={z} dz={1200 - z} opacity={0.22}>{node}</SoftShadow><Plane z={z}>{node}</Plane></React.Fragment>;
    })}
    <Plane z={hud(cam.z)} noBlur><Pill x={540} y={330} text={label} size={44} fill={K.card} weight={800} shadow scale={pop(t, from + 0.4, 9)} /></Plane>
  </Space>;
};

const StopsCut: React.FC<{t: number; B: Record<string, number>; c: Spec['cutaways'][number]}> = ({t, B, c}) => {
  const from = B[c.from];
  const cam = cam3At([{t: from, x: 540, y: 960, z: 30, rot: 0, focus: 1000, aperture: 6}, {t: B[c.to], x: 540, y: 955, z: 90, rot: 0, focus: 940, aperture: 6}], t);
  const count = Math.round(lerp(0, c.count ?? 38, smooth(t, from, from + 1.4)));
  return <Space cam={cam} id="rc-stops" bg={K.paper}>
    <Train t={t} B={B} />
    {[0, 1, 2, 3, 4].map((i) => {
      const k = clamp((t - from - i * 0.25) / 0.5);
      if (k <= 0 || k >= 1) return null;
      return <Plane key={i} z={1300}><g transform={`translate(${1400 - 1900 * k} 520)`}>
        <rect x={-10} y={0} width={20} height={300} fill={K.grape} />
        <rect x={-150} y={-90} width={300} height={110} rx={20} fill={K.coral} stroke={K.grape} strokeWidth={7} />
        <text x={0} y={-15} textAnchor="middle" fontFamily={DISPLAY} fontSize={64} fill={K.paper}>STOP</text>
      </g></Plane>;
    })}
    <Plane z={hud(cam.z)} noBlur>
      <g transform="translate(540 330)"><rect x={-270} y={-70} width={540} height={130} rx={65} fill={K.grape} transform="translate(10 12)" />
        <rect x={-270} y={-70} width={540} height={130} rx={65} fill={K.card} stroke={K.grape} strokeWidth={7} />
        <text x={0} y={24} textAnchor="middle" fontFamily={DISPLAY} fontSize={64} fill={K.coral}>{count} missed</text></g>
    </Plane>
  </Space>;
};

const SetsCut: React.FC<{t: number; B: Record<string, number>; c: Spec['cutaways'][number]}> = ({t, B, c}) => {
  const from = B[c.from], to = B[c.to];
  const cam = cam3At([{t: from, x: 540, y: 960, z: 30, rot: 0.5, focus: 980, aperture: 6}, {t: to, x: 540, y: 955, z: 110, rot: -0.5, focus: 900, aperture: 6}], t);
  const n = Math.round(lerp(0, parseInt((c.counter ?? '0').replace(/,/g, ''), 10), smooth(t, from, to - 0.2)));
  const loop = 0.55, el = Math.max(0, t - from), ph = (el / loop) % 1, i = Math.floor(el / loop);
  // Each loop is one rest: the ring drains and a card is flicked away inside it.
  const sweep = 1 - ph;
  const r = 250, cx = 540, cy = 740;
  const end = [cx + r * Math.sin(2 * Math.PI * sweep), cy - r * Math.cos(2 * Math.PI * sweep)];
  const k = Math.pow(clamp((ph - 0.45) / 0.4), 2);
  const dir = i % 2 ? 1 : -1;
  return <Space cam={cam} id="rc-sets" bg={K.paper}>
    <Backdrop t={t} a={[900, 560, 360]} b={[160, 1250, 320]} />
    <SoftShadow z={1000} dz={180} opacity={0.25}><circle cx={cx} cy={cy} r={r + 40} fill={K.card} /></SoftShadow>
    <Plane z={1000}>
      <circle cx={cx} cy={cy} r={r + 40} fill={K.card} stroke={K.grape} strokeWidth={9} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={K.lilac} strokeWidth={34} />
      {sweep > 0.01 && <path d={`M ${cx} ${cy - r} A ${r} ${r} 0 ${sweep > 0.5 ? 1 : 0} 1 ${end[0]} ${end[1]}`} fill="none" stroke={K.coral} strokeWidth={34} strokeLinecap="round" />}
      <text x={cx} y={cy - 150} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={34} fill={K.grape3}>REST</text>
    </Plane>
    <Plane z={960}><g transform={`translate(${dir * 700 * k} ${-60 * k}) rotate(${dir * 20 * k} ${cx} ${cy})`}>
      <g transform={`translate(${cx} ${cy + 30}) scale(0.42) translate(-540 -720)`}><ProfileCard p={PROFILES[i % PROFILES.length]} /></g>
    </g></Plane>
    <Plane z={hud(cam.z)} noBlur>
      <text x={540} y={345} textAnchor="middle" fontFamily={DISPLAY} fontSize={110} fill={K.grape}>{n}</text>
      <text x={540} y={402} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={40} fill={K.grape}>rests, all spent swiping</text>
    </Plane>
  </Space>;
};

const EquivShot: React.FC<{t: number; spec: Spec; B: Record<string, number>; from: number; to: number}> = ({t, spec, B, from, to}) => {
  const eq = spec.receipt.equivalent;
  const at = B[eq.atBeat];
  const cam = cam3At([{t: from, x: 540, y: 960, z: 20, rot: 0.4, focus: 980, aperture: 6}, {t: to, x: 540, y: 955, z: 100, rot: -0.4, focus: 900, aperture: 6}], t);
  const night = spec.set === 'bedroom';
  const items = Math.ceil(eq.count);
  return <Space cam={cam} id="rc-eq" bg={night ? '#2A2156' : K.paper}>
    {night ? <Plane z={3000} noBlur><rect x={-2500} y={-3500} width={6100} height={9000} fill="#2A2156" /></Plane> : <Backdrop t={t} a={[160, 760, 360]} b={[930, 1180, 320]} />}
    <Plane z={1000}>
      {Array.from({length: items}, (_, i) => {
        const k = pop(t, at - 0.15 + i * Math.min(0.07, 0.9 / items), 8);
        const half = i === items - 1 && eq.count % 1 !== 0;
        if (eq.visual === 'pillows') {
          const col = i % 4, row = Math.floor(i / 4);
          const x = 160 + col * 255, y = 560 + row * 165;
          return <g key={i} transform={`translate(${x} ${y}) scale(${k})`}>
            <clipPath id={`pl${i}`}><rect x={-110} y={-80} width={half ? 110 : 220} height={160} /></clipPath>
            <g clipPath={`url(#pl${i})`}><rect x={-105} y={-62} width={210} height={124} rx={50} fill="#FFF8F0" stroke={K.grape} strokeWidth={7} />
              <path d="M -60 -10 Q 0 10 60 -10" fill="none" stroke={K.grape3} strokeWidth={4} /></g>
          </g>;
        }
        if (eq.visual === 'workouts') {
          const col = i % 5, row = Math.floor(i / 5);
          return <g key={i} transform={`translate(${170 + col * 185} ${560 + row * 92}) scale(${k})`}><Dumbbell x={0} y={0} s={0.95} fill={row % 2 ? K.lilac : K.coral} /></g>;
        }
        const y = 520 + i * 118;
        return <g key={i} transform={`translate(540 ${y}) scale(${k})`}>
          <rect x={-360} y={-48} width={720} height={96} rx={20} fill={K.card} stroke={K.grape} strokeWidth={6} />
          {['M', 'T', 'W', 'T', 'F'].map((d, j) => <g key={j}><rect x={-340 + j * 136} y={-34} width={120} height={68} rx={12} fill={K.lilac} stroke={K.grape} strokeWidth={4} />
            <text x={-280 + j * 136} y={12} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={32} fill={K.grape}>{d}</text></g>)}
        </g>;
      })}
    </Plane>
    <Plane z={hud(cam.z)} noBlur>
      <text x={540} y={380} textAnchor="middle" fontFamily={DISPLAY} fontSize={72} fill={night ? K.paper : K.grape}>{eq.text.replace(/^= /, '')}</text>
      <text x={540} y={440} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={34} fill={night ? K.lilac : K.grape3}>{eq.math}</text>
    </Plane>
  </Space>;
};

const NoSwipeShot: React.FC<{t: number; spec: Spec; B: Record<string, number>; from: number; to: number}> = ({t, spec, B, from, to}) => {
  const cam = cam3At([{t: from, x: 540, y: 960, z: 20, rot: -0.4, focus: 980, aperture: 6}, {t: to, x: 545, y: 950, z: 110, rot: 0.4, focus: 890, aperture: 6}], t);
  const slide = easeOut(t, B.card - 0.3, B.card + 0.2);
  // The receipt lines would peek out from under the date card, so they clear as it slides in.
  const rows = buildRows(spec, B, true).map((r) => (r.key === 'header' ? {...r, at: B.or + 0.35}
    : {...r, draw: (y: number, k: number) => <g opacity={1 - slide}>{r.draw(y, k)}</g>}));
  const logo = hold(t, B.noswipe - 0.05, B.noswipe + 0.2, B.card - 0.4, B.card - 0.1);
  return <Space cam={cam} id="rc-ns" bg={K.paper}>
    <Backdrop t={t} />
    <SoftShadow z={980} dz={170} offset={[30, 26]} opacity={0.3}><Paper t={t} rows={rows} tint="#F4FFD9" id="rnsh" /></SoftShadow>
    <Plane z={1000}><PrinterPhone /></Plane>
    <Plane z={980}><Paper t={t} rows={rows} tint="#F4FFD9" id="rnp" /></Plane>
    {logo > 0.01 && <Plane z={hud(cam.z)} noBlur><g transform={`translate(540 340) scale(${logo}) translate(-540 -340)`}>
      <rect x={332} y={286} width={440} height={130} rx={65} fill={K.grape} />
      <rect x={320} y={272} width={440} height={130} rx={65} fill={K.card} stroke={K.grape} strokeWidth={8} />
      <Logo x={392} y={337} r={48} word />
    </g></Plane>}
    {slide > 0 && <><SoftShadow z={960} dz={100}><g transform={`translate(0 ${(1 - slide) * 900})`}><DateCard who={spec.noswipeReceipt.date.toLowerCase() as DateKey} y={480} /></g></SoftShadow>
      <Plane z={960}><g transform={`translate(0 ${(1 - slide) * 900})`}><DateCard who={spec.noswipeReceipt.date.toLowerCase() as DateKey} y={480} /></g></Plane></>}
  </Space>;
};

const CommuteShot: React.FC<{t: number; B: Record<string, number>; from: number; to: number}> = ({t, B, from, to}) => {
  const cam = cam3At([{t: from, x: 540, y: 960, z: 30, rot: 0, focus: 1000, aperture: 6}, {t: to, x: 530, y: 950, z: 110, rot: 0.5, focus: 900, aperture: 6}], t);
  return <Space cam={cam} id="rc-commute" bg={K.sky}>
    <Train t={t} B={B} lookUp={smooth(t, from, from + 0.5)} />
    <Plane z={hud(cam.z)} noBlur><Pill x={540} y={470} text="Your commute: yours again" size={44} fill={K.lime} weight={800} shadow scale={pop(t, from + 0.2, 9)} /></Plane>
  </Space>;
};

// ---------------------------------------------------------------------------------------------

export const makeReceiptEpisode = (spec: Spec, tl: Timeline) => {
  const LINES = tl.lines;
  const B = tl.beats;
  const WORDS = wordsOf(LINES);
  const CHUNKS = chunksOf(LINES, WORDS);
  const speech = speechOf(LINES);
  const cut = (name: string, lead = 0.05) => B[name] - lead;

  const shots: Shot[] = [{from: 0, render: (t) => <PrintShot t={t} spec={spec} B={B} from={0} to={cut(spec.cutaways[0].from)} />}];
  spec.cutaways.forEach((c) => {
    const label = c.type === 'hey' ? `${spec.receipt.items.find((i) => i.atBeat === 'hey')?.value ?? ''} died at "hey"` : '';
    shots.push({from: cut(c.from), render: (t) => c.type === 'swipes' ? <SwipesCut t={t} B={B} c={c} matches={spec.receipt.items.find((i) => i.atBeat === 'matches')?.value ?? ''} /> : c.type === 'hey' ? <HeyCut t={t} B={B} c={c} label={label} /> : c.type === 'sets' ? <SetsCut t={t} B={B} c={c} /> : <StopsCut t={t} B={B} c={c} />});
  });
  const back = spec.cutaways[spec.cutaways.length - 1].to;
  const eqFrom = cut(spec.receipt.equivalent.atBeat, 0.35);
  shots.push({from: cut(back, 0.1), render: (t) => <PrintShot t={t} spec={spec} B={B} from={cut(back, 0.1)} to={eqFrom} />});
  shots.push({from: eqFrom, render: (t) => <EquivShot t={t} spec={spec} B={B} from={eqFrom} to={cut('or')} />});
  const nsTo = B.commute !== undefined ? cut('commute', 0.1) : cut('endcard', 0.1);
  shots.push({from: cut('or'), render: (t) => <NoSwipeShot t={t} spec={spec} B={B} from={cut('or')} to={nsTo} />});
  if (B.commute !== undefined) shots.push({from: nsTo, render: (t) => <CommuteShot t={t} B={B} from={nsTo} to={cut('endcard', 0.1)} />});
  shots.push({from: cut('endcard', 0.1), render: (t) => <EndCard t={t} start={cut('endcard', 0.1)} end={B.end} />});

  const fast: [number, number][] = [[B.total - 0.05, B.total + 0.4], [B.card - 0.3, B.card + 0.2],
    ...spec.cutaways.filter((c) => c.type === 'swipes').map((c) => [B[c.from], B[c.from] + 1.4] as [number, number])];
  const isFast = (t: number) => inCut(t, shots) || fast.some(([a, b]) => t >= a && t < b);

  const Scene: React.FC = () => {
    const frame = useCurrentFrame();
    const {fps} = useVideoConfig();
    return <AbsoluteFill style={{background: K.paper}}><SwipeCuts t={frame / fps} shots={shots} edge={K.grape} /></AbsoluteFill>;
  };

  const Episode: React.FC = () => {
    const frame = useCurrentFrame();
    const {fps} = useVideoConfig();
    const t = frame / fps;
    const musicVol = (f: number) => lerp(0.55, 0.26, speech(f / fps));
    return <AbsoluteFill style={{background: K.paper}}>
      <Audio src={staticFile(`audio/${spec.id}-music.wav`)} volume={musicVol} />
      <Audio src={staticFile(`audio/${spec.id}-sfx.wav`)} volume={0.6} />
      {LINES.map((l, i) => <Sequence key={i} from={Math.round(l.start * fps)}><Audio src={staticFile(l.file)} /></Sequence>)}
      <MotionBlurWhen fast={isFast(t)}><Scene /></MotionBlurWhen>
      {t < cut('endcard', 0.1) && <Ticker t={t} />}
      <Grain />
      <SoftCta t={t} from={B.card} to={cut('endcard', 0.1)} />
      <Captions t={t} chunks={CHUNKS} hideFrom={cut('endcard', 0.1)} />
    </AbsoluteFill>;
  };
  return {Episode, frames: Math.ceil(tl.duration * RECEIPT_FPS)};
};
