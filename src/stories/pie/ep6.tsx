import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, lerp, smooth} from '../../lib/motion';
import {MotionBlurWhen} from '../../lib/shots';
import {
  Arm, Beanie, C, COUR, CrayonSprite, CrayonLine, Defs, Far, Gloss, HAND, ANTON, Mouth, NapkinPaper, Person, Phone, Pose, Strip, WIPE_DUR, WipeClip, WipeRim,
  ClockSign, textW, Fork, PieCase, Counter, Mug,
} from './world';
import spec from '../../../specs/stories/pie-ep6.json';

// Pie for Two, part 6 = FINALE "One napkin". Silent. Opener = the sidewalk outside the night diner at 12:00 AM, her brother's headlights at the kerb,
// both phones lit mid-swipe, the last napkin "your turn." in his hand. Take 1 (B, I'LL SAVE YOU A SLICE.): she smiles politely, gets in the car, it
// leaves; the pie case is SOLD OUT; no name, no number, no pie. Counter-clockwise slice wipe (rewind). Take 2 (A, WES. YOURS?): she writes rosa. and
// "same stool / next year?", honk, she taps the car window and waves, he holds the napkin up to the neon, the waitress flips the sign back to OPEN and
// deadpans a thumbs-up. End card with the soft "link in bio" line.

export const PIE6_FPS = 60;
export const PIE6_FRAMES = Math.round(spec.duration * PIE6_FPS);
export type Hook = 'a' | 'b';
const B = spec.beats;
const REWIND_AT = B.rewind;

type KF = number[];
const kf = (keys: KF[], t: number): number[] => {
  if (t <= keys[0][0]) return keys[0].slice(1);
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) { const a = keys[i - 1], b = keys[i], k = smooth(t, a[0], b[0]); return a.slice(1).map((v, j) => lerp(v, b[j + 1], k)); }
  }
  return keys[keys.length - 1].slice(1);
};
const keyAt = <T,>(list: [number, T][], t: number): T => { let v = list[0][1]; for (const [a, b] of list) if (t >= a) v = b; return v; };
const wp = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const pulse = (t: number, a: number, b: number) => Math.sin(wp(t, a, b) * Math.PI);
type Pt = {x: number; y: number};

const Exclaim: React.FC<{x: number; y: number; k: number}> = ({x, y, k}) => {
  const sp = k <= 0 ? 0 : 1 + Math.sin(clamp(k) * Math.PI * 1.5) * Math.exp(-clamp(k) * 4.2) * 0.45;
  const pts = Array.from({length: 16}, (_, i) => { const a = (i / 16) * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 46 : 78; return `${Math.cos(a) * r},${Math.sin(a) * r}`; }).join(' ');
  return <g transform={`translate(${x} ${y}) scale(${sp}) rotate(8)`}>
    <polygon points={pts} fill={C.ink} transform="translate(5 7)" opacity={0.35} /><polygon points={pts} fill={C.pumpkin} stroke={C.ink} strokeWidth={7} strokeLinejoin="round" />
    <text x={0} y={34} textAnchor="middle" fontFamily={`"Anton", sans-serif`} fontSize={92} fill={C.ink}>!</text>
  </g>;
};

const InsertBG: React.FC<{t: number}> = ({t}) => <g>
  <g filter="url(#blurSoft)"><Far t={t} /><rect x={-200} y={1010} width={1500} height={900} fill="#79B8A4" /></g>
  <rect x={-100} y={-100} width={1300} height={2200} fill={C.ink} opacity={0.45} />
</g>;
const fitW = (txt: string, size: number, maxW: number) => Math.min(size, (size * maxW) / textW(txt, `700 ${size}px ${HAND}`));

// the clockwise wedge polygon without its own <clipPath> wrapper, so the rewind can mirror it (counter-clockwise)
const WipeClipPoly: React.FC<{k: number; tf: string}> = ({k, tf}) => {
  const a1 = -90 + 360 * smooth(k, 0, 1);
  const n = Math.max(2, Math.ceil((a1 + 90) / 8));
  const pts = ['540,960'];
  for (let i = 0; i <= n; i++) { const a = ((-90 + ((a1 + 90) * i) / n) * Math.PI) / 180; pts.push(`${540 + Math.cos(a) * 1800},${960 + Math.sin(a) * 1800}`); }
  return <polygon points={pts.join(' ')} transform={tf} />;
};

const Waitress: React.FC<{up: number; look: [number, number]}> = ({up, look}) => {
  if (up < 0.01) return null;
  const y = 930 + (1 - up) * 500;
  const SK = '#E3B38F', HR = '#7A6A5A';
  const eye = (sd: number) => <g key={sd} transform={`translate(${sd * 38} -192)`}>
    <ellipse cx={0} cy={0} rx={21} ry={22} fill="#fff" stroke={C.ink} strokeWidth={5} />
    <circle cx={look[0] * 7} cy={look[1] * 6 + 3} r={9} fill={C.ink} />
    <path d="M -24 -2 L 24 -2 L 24 -26 L -24 -26 Z" fill={SK} /><path d="M -23 -2 L 23 -2" stroke={C.ink} strokeWidth={6} strokeLinecap="round" />
    <path d="M -24 -34 Q 0 -40 24 -34" fill="none" stroke="#5A4A3C" strokeWidth={5} strokeLinecap="round" />
    <circle cx={0} cy={6} r={32} fill="none" stroke={C.ink} strokeWidth={5} opacity={0.9} />
    <path d={`M ${sd * 30} 8 l ${sd * 14} 4 M ${sd * 30} 20 l ${sd * 14} 8`} stroke="#B98E6E" strokeWidth={3} strokeLinecap="round" />
  </g>;
  return <g transform={`translate(540 ${y}) scale(1.15)`}>
    <path d="M -210 400 L -210 120 Q -206 -6 -104 -30 L 104 -30 Q 206 -6 210 120 L 210 400 Z" fill={C.mintUni} stroke={C.ink} strokeWidth={9} strokeLinejoin="round" />
    <path d="M -86 -26 L 86 -26 L 106 400 L -106 400 Z" fill={C.cream} stroke={C.ink} strokeWidth={8} strokeLinejoin="round" />
    <path d="M -78 -28 L 0 52 L 78 -28" fill="#fff" stroke={C.ink} strokeWidth={7} strokeLinejoin="round" />
    <rect x={92} y={52} width={56} height={34} rx={7} fill={C.napkin} stroke={C.ink} strokeWidth={5} transform="rotate(8 120 70)" />
    <rect x={-38} y={-96} width={76} height={78} fill={SK} stroke={C.ink} strokeWidth={7} />
    <path d="M -38 -60 L 38 -60" stroke="#B98E6E" strokeWidth={4} />
    {/* hair: back bun, grey streaks */}
    <circle cx={-90} cy={-300} r={36} fill={HR} stroke={C.ink} strokeWidth={8} />
    <path d="M -108 -304 Q -90 -322 -72 -304" fill="none" stroke="#D8D2CA" strokeWidth={5} strokeLinecap="round" />
    <ellipse cx={0} cy={-196} rx={92} ry={118} fill={SK} stroke={C.ink} strokeWidth={9} />
    <path d="M -98 -190 C -108 -318 -30 -330 0 -326 C 34 -330 108 -312 98 -190 C 76 -250 36 -262 0 -258 C -40 -262 -78 -250 -98 -190 Z" fill={HR} stroke={C.ink} strokeWidth={9} strokeLinejoin="round" />
    <path d="M -70 -262 Q -40 -290 -6 -296 M 20 -296 Q 56 -284 80 -258" fill="none" stroke="#D8D2CA" strokeWidth={7} strokeLinecap="round" />
    <path d="M -90 -200 Q -96 -150 -80 -120 M 90 -200 Q 96 -150 80 -120" fill="none" stroke={C.ink} strokeWidth={0} />
    {[-1, 1].map(eye)}
    <path d="M -40 -148 Q -34 -118 -38 -104 M 40 -148 Q 34 -118 38 -104" fill="none" stroke="#B98E6E" strokeWidth={4} strokeLinecap="round" />
    <path d="M -8 -158 Q 0 -140 10 -154" fill="none" stroke={C.ink} strokeWidth={5} strokeLinecap="round" opacity={0.7} />
    <path d="M -24 -100 L 24 -100" stroke={C.ink} strokeWidth={6} strokeLinecap="round" />
    <path d="M -24 -100 q -6 2 -8 8 M 24 -100 q 6 2 8 8" fill="none" stroke="#B98E6E" strokeWidth={3} strokeLinecap="round" />
  </g>;
};

const blinkAt = (t: number, seed: number) => { const ph = (t + seed) % 3.7; return ph < 0.14 ? Math.sin((ph / 0.14) * Math.PI) : 0; };
const mkPose = (o: Partial<Pose>): Pose => ({look: [0, 0.5], brow: 0.1, worry: 0, mouth: 'soft', happy: false, sweat: 0, gulp: 0, tilt: 0, bob: 0, sq: 1, blink: 0, flush: 0.3, ...o});

const Breath: React.FC<{x: number; y: number; t: number; seed: number; dir: number}> = ({x, y, t, seed, dir}) => {
  const per = 1.7, ph = ((t + seed) % per) / per;
  if (ph > 0.65) return null;
  const k = ph / 0.65;
  return <g opacity={Math.min(1, (1 - k) * 1.1)} filter="url(#blurSh)">
    {[0, 1, 2].map((i) => <circle key={i} cx={x + dir * (24 + 70 * k + i * 26 * k)} cy={y - 10 * k - i * 8 * k + (i - 1) * 6} r={22 + 44 * k - i * 3} fill="#EAF6FF" />)}
  </g>;
};

// ------------------------------------------------------------------------------------------ napkins
type NLine = {txt: string; y: number; size: number; who: 'him' | 'her'; a: number; b: number};
const HIMW = {color: C.pumpkin, sleeve: C.rust, skin: C.skinHim}, HERW = {color: C.cran, sleeve: C.cran, skin: C.skinHer};
const NK: Record<'YT' | 'N1' | 'N2', {w: number; h: number; lines: NLine[]}> = {
  YT: {w: 390, h: 230, lines: [{txt: 'your turn.', y: 30, size: 84, who: 'her', a: -9, b: -8}]},
  N1: {w: 840, h: 560, lines: [{txt: "I'LL SAVE", y: -62, size: 190, who: 'him', a: 6.85, b: 7.6}, {txt: 'YOU A SLICE.', y: 112, size: 170, who: 'him', a: 7.7, b: 8.6}]},
  N2: {w: 840, h: 760, lines: [
    {txt: 'WES.', y: -235, size: 140, who: 'him', a: 17.7, b: 18.3}, {txt: 'YOURS?', y: -95, size: 140, who: 'him', a: 18.4, b: 19.1},
    {txt: 'rosa.', y: 55, size: 140, who: 'her', a: 20.0, b: 20.6},
    {txt: 'same stool', y: 185, size: 100, who: 'her', a: 21.0, b: 21.8}, {txt: 'next year?', y: 300, size: 100, who: 'her', a: 21.9, b: 22.7},
  ]},
};
/** Napkin with its lines drawn up to time t (t = Infinity: finished). Used both as the whole-frame insert and as the held prop. */
const NapkinFace: React.FC<{kind: 'YT' | 'N1' | 'N2'; t: number; x: number; y: number; rot?: number; s?: number; glow?: number; sprites?: boolean}> = ({kind, t, x, y, rot = 0, s = 1, glow = 0.9, sprites = false}) => {
  const K = NK[kind];
  return <NapkinPaper w={K.w} h={K.h} x={x} y={y} rot={rot} scale={s} id={kind.toLowerCase()} glowA={glow}>
    {K.lines.map((L, i) => {
      const sz = Math.min(L.size, (L.size * (K.w - 110)) / textW(L.txt, `700 ${L.size}px ${HAND}`));
      const p = wp(t, L.a, L.b), w = textW(L.txt, `700 ${sz}px ${HAND}`), W = L.who === 'him' ? HIMW : HERW;
      return <g key={i}>
        <CrayonLine txt={L.txt} x={0} y={L.y} size={sz} color={W.color} p={p} />
        {sprites && p > 0 && p < 1 && <CrayonSprite x={-w / 2 + w * p + 6} y={L.y - 10} color={W.color} skin={W.skin} sleeve={W.sleeve} />}
      </g>;
    })}
  </NapkinPaper>;
};
const NapkinInsert: React.FC<{t: number; kind: 'N1' | 'N2'}> = ({t, kind}) => {
  const t0 = kind === 'N1' ? B.n1 : B.n2;
  const k = smooth(t, t0, t0 + 0.25);
  return <g>
    <InsertBG t={t} />
    <NapkinFace kind={kind} t={t} x={lerp(1500, 540, k)} y={kind === 'N1' ? 790 : 800} rot={lerp(12, -2, k)} sprites />
  </g>;
};

// ------------------------------------------------------------------------------------------ the sidewalk
const HX = 190, RX = 880, PY = 1130, SS = 0.8, WY = 1190;
const HIM_TICKS = [-0.1, ...spec.audio.swipeTicks];
const HER_TICKS = [-0.18, 0.33, 0.62, 0.93, 1.22];
const phoneSwipe = (ticks: number[], t: number, until: number) => {
  let idx = -1;
  for (let i = 0; i < ticks.length; i++) if (ticks[i] <= t && ticks[i] < until) idx = i;
  if (idx < 0) return {p: 0, dir: 1, on: false};
  const p = (t - ticks[idx]) / 0.26;
  if (p > 1) return {p: 0, dir: 1, on: false};
  return {p: clamp(p), dir: idx % 2 ? -1 : 1, on: true};
};
const isT1 = (t: number) => t >= B.n1End && t < B.caseAt;
const isT2 = (t: number) => t >= B.rewind;
// her position: she walks to the car (sinks behind the wall) at the end of each take
const herOff = (t: number): number => {
  if (isT1(t)) return smooth(t, B.leave1, B.leave1 + 0.55);
  if (t >= B.leave2) return smooth(t, B.leave2, B.leave2 + 0.5);
  return 0;
};
// the car: waits between them behind the wall, drives off right at the end of each take
const carX = (t: number): number => {
  if (isT1(t)) return lerp(0, 1100, smooth(t, B.carOff1, B.caseAt - 0.05));
  if (t >= B.carOff2) return lerp(0, 1100, smooth(t, B.carOff2, B.carOff2 + 0.8));
  return 0;
};

type NapS = {face: 'YT' | 'N1' | 'N2'; x: number; y: number; rot: number; s: number; hold: 'him' | 'her' | 'up'; behind: boolean; show: boolean};
const napState = (t: number): NapS => {
  if (t < B.n1End) return {face: 'YT', x: 545, y: 975, rot: -5 + Math.sin(t * 1.3) * 1, s: 1, hold: 'him', behind: false, show: true};
  if (isT1(t)) {
    const g = smooth(t, B.give, B.give + 0.4);
    const sink = smooth(t, B.leave1, B.leave1 + 0.55);
    return {face: 'N1', x: lerp(545, 665, g), y: lerp(975, 1075, g) + sink * 480, rot: lerp(-5, 3, g), s: lerp(0.46, 0.36, g), hold: g > 0.9 ? 'her' : 'him', behind: sink > 0.01, show: true};
  }
  if (t < B.n2End) return {face: 'YT', x: 545, y: 975, rot: -5 + Math.sin(t * 1.3), s: 1, hold: 'him', behind: false, show: true};
  if (t < B.side3) {
    const g = smooth(t, B.n2End + 0.1, B.n2End + 0.5);
    return {face: 'N2', x: lerp(720, 440, g), y: lerp(1030, 1020, g), rot: lerp(3, -4, g), s: 0.42, hold: g > 0.5 ? 'him' : 'her', behind: false, show: true};
  }
  const up = smooth(t, B.side3, B.side3 + 0.6) * (1 - smooth(t, B.napDown, B.napDown + 0.6));
  return {face: 'N2', x: lerp(470, 490, up), y: lerp(1000, 800, up), rot: lerp(-4, -3, up), s: lerp(0.42, 0.55, up), hold: 'up', behind: false, show: true};
};

const himPhone = (t: number, hook: Hook) => {
  const sw = phoneSwipe(HIM_TICKS, t, hook === 'a' ? 0.95 : 0.6);
  const out = hook === 'a' ? smooth(t, 0.95, 1.35) : smooth(t, 0.7, 1.05);
  const jerk = hook === 'b' ? Math.sin(wp(t, 0.6, 0.85) * Math.PI) * 24 : 0;
  return {x: 135, y: lerp(1070, 1340, out) - jerk, rot: -3 + out * 20, s: 0.7, lit: 1 - out * 0.5, p: sw.p, dir: sw.dir, thumb: sw.on ? 1 : 0, vis: t < 1.6};
};
const herPhone = (t: number, hook: Hook) => {
  const sw = phoneSwipe(HER_TICKS, t, hook === 'b' ? 0.3 : 0.95);
  const out = hook === 'a' ? smooth(t, 1.0, 1.4) : smooth(t, 1.2, 1.6);
  const dip = hook === 'b' ? 110 * smooth(t, 0.3, 0.6) * (1 - out) : 0;
  return {x: 925, y: lerp(1070, 1340, out) + dip, rot: 6 - out * 18, s: 0.7, lit: 1 - out * 0.5, p: sw.p, dir: sw.dir, thumb: sw.on ? 1 : 0, vis: t < 1.9};
};

const himPoseS = (t: number, hook: Hook): Pose => {
  let look: number[] = [0.7, 0.3], mouth: Mouth = 'soft', brow = 0.2, sweat = 0, flush = 0.45, bob = 0, tilt = Math.sin(t * 0.9) * 1, happy = false, gulp = 0, sq = 1 + 0.014 * Math.sin(t * 2.3);
  if (t < 3.2) {
    if (hook === 'a') {
      look = kf([[0, 0.05, 0.85], [0.8, 0.05, 0.85], [1.3, 0.7, 0.3], [2.4, 0.7, 0.3], [2.8, 0.2, 0.9], [3.2, 0.2, 0.9]], t);
      mouth = t < 1.0 ? 'flat' : 'soft'; brow = 0.1 + 0.4 * smooth(t, 1.0, 1.4);
    } else {
      look = kf([[0, 0.05, 0.85], [0.55, 0.05, 0.85], [0.7, 0.95, 0.1], [1.9, 0.95, 0.1], [2.4, 0.3, 0.9], [3.2, 0.3, 0.9]], t);
      mouth = t < 0.6 ? 'soft' : t < 2.1 ? 'o' : 'grit'; bob = -22 * pulse(t, 0.6, 0.95); sq += 0.07 * pulse(t, 0.6, 0.85);
      sweat = smooth(t, 0.7, 1.0) * 0.95; flush = 0.3 + smooth(t, 0.6, 1.1) * 0.55; brow = 0.1 + 0.9 * pulse(t, 0.6, 1.4);
      if (t > 2.3 && t < 3.0) gulp = Math.sin(wp(t, 2.3, 3.0) * Math.PI);
    }
  } else if (t < B.n1) {
    look = [0.9, 0.3]; brow = 0.35;
    if (t >= B.honk1 && t < B.honk1 + 0.5) { mouth = 'o'; brow = 0.8; }
  } else if (isT1(t)) {
    look = kf([[9.4, 0.7, 0.8], [10.0, 0.9, 0.5], [11.0, 0.9, 0.4], [11.5, 0.2, 0.2]], t);
    mouth = t < 10.9 ? 'soft' : 'gulp'; brow = 0.5 + 0.3 * smooth(t, 10.9, 11.5); sweat = smooth(t, 11.1, 11.8) * 0.8; bob = 14 * smooth(t, 11.0, 11.9);
  } else if (isT2(t) && t < B.side3) {
    look = [0.9, 0.35]; mouth = t < B.n2End ? 'soft' : 'smile'; brow = 0.35;
    if (t >= B.honk2) { look = [0.9, 0.6]; mouth = 'smile'; }
  } else if (t >= B.side3) {
    const up = t < B.napDown + 0.6;
    look = up ? [0.55, -0.4] : [0.8, -0.2]; mouth = 'smile'; happy = true; brow = 0.3; flush = 0.6; tilt = 3;
    if (t >= B.thumbs - 0.2) { look = [0.9, -0.3]; mouth = 'smile'; }
  }
  return mkPose({look: [look[0], look[1]], brow, worry: sweat * 0.8, mouth, sweat, gulp, tilt, bob, sq, blink: blinkAt(t, 0.4), flush, happy});
};
const herPoseS = (t: number, hook: Hook): Pose => {
  let look: number[] = [-0.7, 0.2], mouth: Mouth = 'soft', brow = 0.1, tilt = Math.sin(t * 0.8 + 2) * 1.2, bob = 0;
  if (t < 3.2) {
    if (hook === 'a') {
      look = kf([[0, -0.1, 0.8], [0.9, -0.1, 0.8], [1.4, -0.8, 0.3], [3.2, -0.8, 0.3]], t); mouth = t < 1.2 ? 'flat' : 'soft';
    } else {
      look = kf([[0, -0.1, 0.8], [0.25, -0.1, 0.8], [0.4, -1.0, 0.85], [1.6, -1.0, 0.85], [2.0, -0.7, 0.2], [3.2, -0.7, 0.2]], t);
      mouth = t < 0.4 ? 'flat' : t < 1.6 ? 'o' : 'smirk'; brow = 0.1 + 0.85 * pulse(t, 0.4, 1.4);
    }
  } else if (t < B.n1) {
    look = [-0.8, 0.2]; mouth = 'soft';
    if (t >= B.honk1 && t < B.honk1 + 0.6) { look = [-0.2, 0.8]; mouth = 'o'; }
  } else if (isT1(t)) {
    look = kf([[9.4, -0.8, 0.2], [10.1, -0.2, 0.9], [10.8, -0.2, 0.9], [11.0, -0.9, 0.2]], t);
    mouth = t < 10.1 ? 'soft' : 'smile'; brow = 0.15; tilt = 4 * smooth(t, 10.2, 10.6);
  } else if (isT2(t) && t < B.n2End) {
    look = t < B.n2 ? [-0.8, 0.2] : kf([[17.4, -0.8, 0.2], [19.9, -0.2, 0.9], [20.0, -0.2, 0.95]], t);
    mouth = t >= 20.6 ? 'smile' : 'soft'; if (t >= 21.9) mouth = 'smile';
  } else {
    look = t >= B.honk2 ? [0.2, 0.8] : [-0.8, 0.2]; mouth = 'smile'; tilt = -3;
  }
  return mkPose({look: [look[0], look[1]], brow, mouth, tilt, bob, sq: 1 + 0.014 * Math.sin(t * 2 + 1.3), blink: blinkAt(t, 1.9), flush: 0, happy: t >= 22.7 && t < B.side3});
};

/** the facade: lit window with neon, the clock, a low brick wall; people stand in front of the car */
const SideScene: React.FC<{t: number; hook: Hook}> = ({t, hook}) => {
  // neon: OPEN -> CLOSED in the opener; back to OPEN at the very end
  const f1 = wp(t, 1.4, 1.75), f2 = wp(t, B.neonFlip2, B.neonFlip2 + 0.35);
  const word = t < B.neonFlip2 ? (f1 >= 0.5 ? 'CLOSED' : 'OPEN') : (f2 >= 0.5 ? 'OPEN' : 'CLOSED');
  const flipping = (f1 > 0 && f1 < 1) || (f2 > 0 && f2 < 1);
  const fp = f1 > 0 && f1 < 1 ? f1 : f2 > 0 && f2 < 1 ? f2 : 0;
  const sy = flipping ? Math.max(0.04, Math.abs(1 - 2 * fp)) : 1;
  const zap = flipping ? (Math.sin(t * 60) > 0.2 ? 1 : 0.35) : 1;
  const glow = '#FF3B4E';
  const him = himPoseS(t, hook), her = herPoseS(t, hook);
  const hp = himPhone(t, hook), rp = herPhone(t, hook);
  const hoff = herOff(t);
  const cx = carX(t);
  const hon = (t >= B.honk1 && t < B.honk1 + 0.22) || (t >= B.honk1 + 0.25 && t < B.honk1 + 0.47) || (t >= B.honk2 && t < B.honk2 + 0.22) || (t >= B.honk2 + 0.25 && t < B.honk2 + 0.47);
  const bump = hon ? -7 : 0;
  const nap = napState(t);
  const lightsOn = 1;
  const mouthY = PY - 92 * SS;
  // waitress behind the glass
  const wUp = smooth(t, B.neonFlip2 - 0.5, B.neonFlip2 - 0.1);
  const reach = smooth(t, B.neonFlip2 - 0.2, B.neonFlip2 + 0.1) * (1 - smooth(t, B.neonFlip2 + 0.35, B.neonFlip2 + 0.7));
  const thumb = smooth(t, B.thumbs, B.thumbs + 0.25);
  const napEl = nap.show && <NapkinFace kind={nap.face} t={Infinity} x={nap.x} y={nap.y} rot={nap.rot} s={nap.s} glow={nap.hold === 'up' ? 1.0 : 0.9} />;
  const himHoldArm = nap.hold === 'him' || nap.hold === 'up';
  const nHandHim: Pt = nap.hold === 'up' ? {x: nap.x - 40, y: nap.y + 235} : {x: nap.x - 190 * nap.s - 10, y: nap.y + 100};
  const nHandHer: Pt = {x: nap.x + 190 * nap.s + 10, y: nap.y + 40};
  const him2 = nap.hold === 'up' ? {...him} : him;
  return <g>
    <rect x={-100} y={-100} width={1300} height={WY + 130} fill="#12403F" />
    {Array.from({length: 12}, (_, i) => <path key={i} d={`M -100 ${180 + i * 95} L 1200 ${180 + i * 95}`} stroke={C.ink} strokeWidth={4} opacity={0.18} />)}
    <rect x={-100} y={-100} width={1300} height={WY + 130} fill={C.navy} opacity={0.32} />
    <ellipse cx={540} cy={880} rx={640} ry={420} fill="url(#haloWarm)" opacity={0.35} />
    <rect x={60} y={520} width={960} height={380} rx={26} fill={C.chrome} stroke={C.ink} strokeWidth={9} />
    <rect x={88} y={548} width={904} height={324} rx={14} fill="#F6B25A" stroke={C.ink} strokeWidth={7} />
    <rect x={88} y={548} width={904} height={324} rx={14} fill="url(#haloWarm)" opacity={0.7} />
    <rect x={88} y={760} width={904} height={112} fill="#5D3A2A" opacity={0.55} />
    {[170, 330, 750, 910].map((x, i) => <g key={i}><ellipse cx={x} cy={800} rx={44} ry={14} fill="#8B1830" stroke={C.ink} strokeWidth={5} /><rect x={x - 6} y={808} width={12} height={60} fill="#B8C6CB" stroke={C.ink} strokeWidth={4} /></g>)}
    <clipPath id="winClip"><rect x={88} y={548} width={904} height={324} rx={14} /></clipPath>
    {wUp > 0.01 && <g clipPath="url(#winClip)">
      <g transform={`translate(890 ${830 - 110 * wUp}) scale(0.38) translate(-540 -930)`}><Waitress up={1} look={[-0.6, 0.2]} /></g>
      {/* reaching arm to the switch, then the deadpan thumbs-up */}
      <g>
        {reach > 0.01 && <g><path d={`M 860 840 Q ${860 - 60 * reach} ${800} ${830 - 110 * reach} ${790}`} stroke={C.ink} strokeWidth={46} strokeLinecap="round" fill="none" /><path d={`M 860 840 Q ${860 - 60 * reach} ${800} ${830 - 110 * reach} ${790}`} stroke={C.mintUni} strokeWidth={34} strokeLinecap="round" fill="none" /><circle cx={830 - 110 * reach} cy={790} r={22} fill="#E3B38F" stroke={C.ink} strokeWidth={6} /></g>}
        {thumb > 0.01 && <g transform={`translate(${790} ${800 - 6 * (1 - thumb)}) scale(${thumb})`}>
          <path d="M 70 70 Q 40 60 8 40" stroke={C.ink} strokeWidth={46} strokeLinecap="round" fill="none" /><path d="M 70 70 Q 40 60 8 40" stroke={C.mintUni} strokeWidth={34} strokeLinecap="round" fill="none" />
          <rect x={-24} y={14} width={50} height={44} rx={16} fill="#E3B38F" stroke={C.ink} strokeWidth={6} />
          <rect x={-8} y={-30} width={22} height={50} rx={10} fill="#E3B38F" stroke={C.ink} strokeWidth={6} />
        </g>}
      </g>
    </g>}
    <Gloss x={88} y={548} w={904} h={324} a={0.16} id="sidewin" r={14} />
    <g transform={`translate(540 762) scale(1 ${sy})`} opacity={zap}>
      <text x={0} y={0} textAnchor="middle" fontFamily={ANTON} fontSize={160} fill={glow} opacity={0.7} filter="url(#blurGlow)" stroke={glow} strokeWidth={12} letterSpacing={6}>{word}</text>
      <text x={0} y={0} textAnchor="middle" fontFamily={ANTON} fontSize={160} fill="none" stroke={glow} strokeWidth={10} strokeLinejoin="round" letterSpacing={6}>{word}</text>
      <text x={0} y={0} textAnchor="middle" fontFamily={ANTON} fontSize={160} fill="none" stroke="#FFD9D6" strokeWidth={3.5} strokeLinejoin="round" letterSpacing={6}>{word}</text>
    </g>
    <ClockSign x={540} y={553} text={spec.cards.clock} />
    {/* the car waiting at the kerb, between them, behind the wall: roof, hood, two big headlights */}
    {cx < 1000 && <g transform={`translate(${cx} ${bump})`}>
      {[421, 669].map((x, i) => <polygon key={i} points={`${x},1125 ${x - 260 + i * 0},760 ${x + 60 + i * 0},700`} fill="#FFF6D8" opacity={0.26 * lightsOn} filter="url(#blurSoft)" />)}
      <path d="M 366 1100 L 410 1000 Q 418 990 436 990 L 654 990 Q 672 990 680 1000 L 724 1100 Z" fill="#1B3440" stroke={C.ink} strokeWidth={8} strokeLinejoin="round" />
      <path d="M 430 1090 L 458 1008 L 490 1008 L 462 1090 Z" fill="#fff" opacity={0.2} />
      <path d="M 340 1210 L 340 1128 Q 350 1084 400 1078 L 690 1078 Q 740 1084 750 1128 L 750 1210 Z" fill={C.gold} stroke={C.ink} strokeWidth={8} strokeLinejoin="round" />
      <rect x={480} y={1130} width={130} height={36} rx={10} fill="#26302E" stroke={C.ink} strokeWidth={6} />
      {[421, 669].map((x, i) => <g key={i}><circle cx={x} cy={1122} r={80} fill="url(#haloWhite)" opacity={lightsOn} /><circle cx={x} cy={1122} r={34} fill="#FFFBE6" stroke={C.ink} strokeWidth={7} /><circle cx={x} cy={1122} r={19} fill="#fff" /></g>)}
      {hon && <g fill="none" stroke={C.ink} strokeWidth={8} strokeLinecap="round">{[40, 70, 100].map((r, i) => <path key={i} d={`M ${545 - r} ${1060 - r * 0.2} Q 545 ${1060 - r * 1.2} ${545 + r} ${1060 - r * 0.2}`} opacity={1 - i * 0.25} />)}</g>}
    </g>}
    {/* the two of them */}
    <Person who="him" x={HX} y={PY} s={SS} pose={him2} />
    <g opacity={hoff > 0.99 ? 0 : 1}>
      <Person who="her" x={RX + hoff * -250} y={PY + hoff * 560} s={SS} pose={her} />
      <g transform={`translate(${RX + hoff * -250} ${PY + hoff * 560 + her.bob}) scale(${SS}) rotate(${her.tilt} 0 -40)`}><g transform="translate(0 -318) scale(1.95)"><Beanie x={0} y={0} /></g></g>
    </g>
    <Breath x={HX} y={mouthY} t={t} seed={0} dir={-1} />{hoff < 0.1 && <Breath x={RX} y={mouthY} t={t} seed={0.85} dir={1} />}
    {/* phones (lit, generic glow), held in front of the chest, pocketed within about a second */}
    {hp.vis && <g><Phone id="him" x={hp.x} y={hp.y} rot={hp.rot} scale={hp.s} lit={hp.lit} p={hp.p} dir={hp.dir} thumb={hp.thumb} skin={C.skinHim} /><Arm who="him" sx={-70} sy={1120} hx={hp.x - 28} hy={hp.y + 104 * hp.s} /></g>}
    {rp.vis && <g><Phone id="her" x={rp.x} y={rp.y} rot={rp.rot} scale={rp.s} lit={rp.lit} p={rp.p} dir={rp.dir} thumb={rp.thumb} caseColor={C.pink} skin={C.skinHer} /><Arm who="her" sx={1150} sy={1120} hx={rp.x + 26} hy={rp.y + 96 * rp.s} /></g>}
    {nap.behind && napEl}
    {hook === 'b' && t >= 0.55 && t < 2.0 && <g opacity={1 - smooth(t, 1.8, 2.0)}><g transform="translate(925 690) scale(1.15) translate(-925 -690)"><Exclaim x={925} y={690} k={wp(t, 0.55, 0.95)} /></g></g>}
    {/* low brick wall */}
    <rect x={-100} y={WY} width={1300} height={34} fill="url(#chromeG)" stroke={C.ink} strokeWidth={8} />
    <rect x={-100} y={WY + 34} width={1300} height={190} fill="#7A2E2A" stroke={C.ink} strokeWidth={8} />
    {Array.from({length: 3}, (_, r) => Array.from({length: 9}, (_, i) => <rect key={`${r}-${i}`} x={-60 + i * 150 + (r % 2) * 75} y={WY + 46 + r * 64} width={140} height={52} rx={5} fill="#9A3E36" stroke={C.ink} strokeWidth={4} opacity={0.8} />))}
    <rect x={-100} y={WY + 224} width={1300} height={900} fill="#0E242C" stroke={C.ink} strokeWidth={8} />
    {/* arms + the napkin in front of the wall */}
    {!nap.behind && napEl}
    {nap.show && !nap.behind && himHoldArm && <Arm who="him" sx={-60} sy={nap.hold === 'up' ? 1250 : 1300} hx={nHandHim.x} hy={nHandHim.y} w={78} />}
    {nap.show && nap.hold === 'her' && hoff < 0.2 && <Arm who="her" sx={1180} sy={1300} hx={nHandHer.x} hy={nHandHer.y} w={78} />}
    {hon && null}
    <rect x={-100} y={-100} width={1300} height={2200} fill="#FFE9A8" opacity={0.08} />
  </g>;
};

// ------------------------------------------------------------------------------------------ the pie case, empty
const CaseShot: React.FC<{t: number}> = ({t}) => {
  const z = 1.3 + 0.04 * clamp((t - B.caseAt) / 1.6);
  return <g>
    <Far t={t} />
    <rect x={-100} y={-100} width={1300} height={2200} fill={C.ink} opacity={0.5} />
    <g transform={`translate(540 800) scale(${z}) translate(-540 -800)`}>
      <PieCase open={0} slice={false} t={t} sign={spec.cards.case_sign} />
    </g>
    <rect x={-100} y={1010} width={1300} height={110} fill="url(#counterTop)" stroke={C.ink} strokeWidth={9} />
    <rect x={-100} y={1120} width={1300} height={900} fill={C.tealLite} stroke={C.ink} strokeWidth={9} />
    <Counter stools={[{x: 540}]} />
  </g>;
};

// ------------------------------------------------------------------------------------------ him, alone, slumping
const SlumpShot: React.FC<{t: number}> = ({t}) => {
  const k = smooth(t, B.slump + 0.3, B.slump + 1.5);
  const him = mkPose({look: [0.1, 0.95], mouth: t < B.slump + 0.5 ? 'flat' : 'gulp', brow: 0.9, worry: 0.9, sweat: 0.4, flush: 0.3, bob: 70 * k, tilt: 6 * k, sq: 1 - 0.07 * k, blink: blinkAt(t, 0.4),
    gulp: t > 14.3 && t < 14.9 ? Math.sin(wp(t, 14.3, 14.9) * Math.PI) : 0});
  return <g>
    <Far t={t} />
    <rect x={-100} y={-100} width={1300} height={2200} fill={C.ink} opacity={0.42} />
    <ClockSign x={540} y={500} text="11:41 AM" />
    <Person who="him" x={540} y={1010} s={1.1} pose={him} />
    <rect x={-100} y={1030} width={1300} height={120} fill="url(#counterTop)" stroke={C.ink} strokeWidth={9} />
    <rect x={-100} y={1150} width={1300} height={900} fill={C.tealLite} stroke={C.ink} strokeWidth={9} />
    <Mug x={860} y={1060} />
    <Arm who="him" sx={-60} sy={1300} hx={400 + 40 * k} hy={1080} w={100} />
    <Arm who="her" sx={1150} sy={1300} hx={9999} hy={9999} w={1} />
  </g>;
};

// ------------------------------------------------------------------------------------------ her, in the car: she taps the glass and waves
const CarWave: React.FC<{t: number}> = ({t}) => {
  const lt = t - B.carwave;
  const tapOn = lt >= 0.35 && lt < 0.95;
  const taps = [0.35, 0.5, 0.65].map((a) => Math.sin(clamp((lt - a) / 0.12) * Math.PI));
  const tapHit = Math.max(...taps);
  const wave = smooth(lt, 0.95, 1.1);
  const hand: Pt = wave > 0 ? {x: 780 + Math.sin(lt * 18) * 40 * wave, y: 900 - 10 * Math.abs(Math.sin(lt * 18)) * wave} : {x: 730 - 24 * tapHit, y: 1010 + 20 * (1 - tapHit)};
  const her = mkPose({look: [-0.4, 0.15], mouth: 'smile', happy: true, brow: 0.2, tilt: -3 + Math.sin(lt * 4) * 1.5, blink: blinkAt(t, 1.9), flush: 0.15});
  return <g>
    <InsertBG t={t} />
    <rect x={-100} y={-100} width={1300} height={2200} fill="#0A1A22" opacity={0.5} />
    {/* car door */}
    <path d="M -100 1700 L -100 700 Q -100 600 0 600 L 1080 600 Q 1180 600 1180 700 L 1180 1700 Z" fill={C.gold} stroke={C.ink} strokeWidth={10} />
    <path d="M -60 1360 L 1140 1340" stroke="#fff" strokeWidth={8} opacity={0.35} />
    <rect x={820} y={1230} width={170} height={36} rx={16} fill="url(#chromeG)" stroke={C.ink} strokeWidth={7} />
    {/* window */}
    <rect x={120} y={690} width={840} height={520} rx={40} fill="#1E2F36" stroke={C.ink} strokeWidth={12} />
    <clipPath id="carWin"><rect x={124} y={694} width={832} height={512} rx={36} /></clipPath>
    <g clipPath="url(#carWin)">
      <rect x={124} y={694} width={832} height={512} fill="#F6B25A" opacity={0.55} />
      <rect x={124} y={694} width={832} height={512} fill="url(#haloWarm)" opacity={0.6} />
      <Person who="her" x={500} y={1210} s={0.95} pose={her} />
      <g transform={`translate(500 1210) scale(0.95) rotate(${her.tilt} 0 -40)`}><g transform="translate(0 -318) scale(1.95)"><Beanie x={0} y={0} /></g></g>
      <Arm who="her" sx={1000} sy={1300} hx={hand.x} hy={hand.y} w={92} />
      {tapOn && tapHit > 0.5 && <g stroke={C.ink} strokeWidth={8} strokeLinecap="round"><path d="M 690 960 l -36 -26 M 700 1040 l -42 6 M 690 1100 l -36 28" /></g>}
    </g>
    <polygon points="170,690 420,690 250,1210 120,1210" fill="#fff" opacity={0.16} />
    <polygon points="520,690 600,690 430,1210 350,1210" fill="#fff" opacity={0.1} />
    <rect x={120} y={690} width={840} height={520} rx={40} fill="none" stroke="#DDE6E9" strokeWidth={5} opacity={0.5} />
  </g>;
};

// ------------------------------------------------------------------------------------------ end card (soft "link in bio" line)
const EndCard6: React.FC<{a: number; t: number}> = ({a, t}) => {
  const pp = (d: number) => { const k = clamp((a - d) / 0.3); return k <= 0 ? 0 : 1 + Math.sin(k * Math.PI * 1.5) * Math.exp(-k * 4.2) * 0.4 - Math.exp(-k * 9) * (1 - k); };
  const flick = 0.85 + 0.15 * Math.sin(t * 29) * Math.sin(t * 5.1);
  const pillT = spec.cards.end_pill;
  const pfs = 74, pw = textW(pillT, `700 ${pfs}px ${COUR}`) + 120;
  const l1 = 'tired of swiping?', l2 = 'noswipe.app · link in bio';
  const lw = Math.max(textW(l1, `700 38px ${COUR}`), textW(l2, `700 38px ${COUR}`)) + 80;
  return <g>
    <Far t={t} />
    <rect x={-200} y={1000} width={1480} height={1000} fill={C.tealLite} />
    <Counter />
    <g transform={`translate(540 600) scale(${pp(0)})`}><text x={0} y={0} textAnchor="middle" fontFamily={COUR} fontWeight={700} fontSize={52} fill={C.custard} stroke={C.ink} strokeWidth={9} paintOrder="stroke" letterSpacing={1}>{spec.cards.end_kicker}</text></g>
    <g transform={`translate(540 815) scale(${pp(0)})`} opacity={flick}>
      <text x={0} y={0} textAnchor="middle" fontFamily={ANTON} fontSize={190} fill={C.pumpkin} stroke={C.pumpkin} strokeWidth={30} opacity={0.6} filter="url(#blurGlow)" letterSpacing={4}>pie for two</text>
      <text x={0} y={0} textAnchor="middle" fontFamily={ANTON} fontSize={190} fill="#1A0D08" stroke={C.pumpkin} strokeWidth={11} strokeLinejoin="round" letterSpacing={4}>pie for two</text>
      <text x={0} y={0} textAnchor="middle" fontFamily={ANTON} fontSize={190} fill="none" stroke="#FFE2B8" strokeWidth={3} strokeLinejoin="round" letterSpacing={4}>pie for two</text>
    </g>
    <g transform={`translate(540 935) scale(${0.85 * pp(0.15)})`}>
      <ellipse cx={0} cy={26} rx={300} ry={64} fill={C.ink} opacity={0.3} filter="url(#blurSh)" />
      <ellipse cx={0} cy={0} rx={290} ry={76} fill={C.napkin} stroke={C.ink} strokeWidth={8} />
      <path d="M -230 -4 Q -230 -76 0 -80 Q 230 -76 230 -4 Q 230 34 0 38 Q -230 34 -230 -4 Z" fill={C.crust} stroke={C.ink} strokeWidth={8} />
      <ellipse cx={0} cy={-22} rx={196} ry={44} fill={C.pie} stroke={C.ink} strokeWidth={6} />
      <path d="M 0 -22 L 150 18 L 196 -22 Z" fill="#E7EEF0" stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
      <circle cx={-60} cy={-26} r={22} fill={C.cream} stroke={C.ink} strokeWidth={5} />
      <Fork x={-150} y={20} rot={-62} s={0.6} /><Fork x={150} y={26} rot={62} s={0.6} />
    </g>
    <g transform={`translate(540 1068) scale(${pp(0.4)})`}>
      <rect x={-pw / 2 + 9} y={-60 + 12} width={pw} height={116} rx={14} fill={C.ink} opacity={0.4} />
      <rect x={-pw / 2} y={-60} width={pw} height={116} rx={14} fill={C.custard} stroke={C.ink} strokeWidth={6} />
      <text x={0} y={18} textAnchor="middle" fontFamily={COUR} fontWeight={700} fontSize={pfs} fill={C.ink}>{pillT}</text>
    </g>
    <g transform={`translate(540 1180) scale(${pp(spec.cards.link_from - B.endcard)})`}>
      <rect x={-lw / 2 + 6} y={-48 + 8} width={lw} height={100} rx={12} fill={C.ink} opacity={0.35} />
      <rect x={-lw / 2} y={-48} width={lw} height={100} rx={12} fill={C.custard} stroke={C.ink} strokeWidth={5} opacity={0.96} />
      <text x={0} y={-6} textAnchor="middle" fontFamily={COUR} fontWeight={700} fontSize={38} fill={C.ink} opacity={0.82}>{l1}</text>
      <text x={0} y={34} textAnchor="middle" fontFamily={COUR} fontWeight={700} fontSize={38} fill={C.cran}>{l2}</text>
    </g>
  </g>;
};

// ------------------------------------------------------------------------------------------ shots
type ShotId = 'S' | 'N1' | 'N2' | 'CA' | 'SL' | 'CW' | 'end';
const SHOTS: [number, ShotId][] = [[0, 'S'], [B.n1, 'N1'], [B.n1End, 'S'], [B.caseAt, 'CA'], [B.slump, 'SL'], [B.rewind, 'S'], [B.n2, 'N2'], [B.n2End, 'S'], [B.carwave, 'CW'], [B.side3, 'S'], [B.endcard, 'end']];
const shotAt = (t: number): ShotId => keyAt(SHOTS, t);

const renderShot = (t: number, hook: Hook, id: ShotId = shotAt(t)): React.ReactNode => {
  if (id === 'N1' || id === 'N2') return <NapkinInsert t={t} kind={id} />;
  if (id === 'CA') return <CaseShot t={t} />;
  if (id === 'SL') return <SlumpShot t={t} />;
  if (id === 'CW') return <CarWave t={t} />;
  if (id === 'end') {
    const e = t - B.endcard;
    return <g transform={`translate(540 960) scale(${1 + 0.03 * clamp(e / 3)}) translate(-540 -960)`}><EndCard6 a={e} t={t} /></g>;
  }
  const z = 1 + 0.03 * clamp(t / 3.2);
  return <g transform={`translate(540 1000) scale(${t < 3.2 ? z : 1.03}) translate(-540 -1000)`}><SideScene t={t} hook={hook} /></g>;
};

const Scene: React.FC<{hook: Hook}> = ({hook}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const inWipe = t >= REWIND_AT && t < REWIND_AT + WIPE_DUR;
  const k = inWipe ? (t - REWIND_AT) / WIPE_DUR : 0;
  const mirror = 'translate(1080 0) scale(-1 1)';
  return <>
    <MotionBlurWhen fast={inWipe} samples={5} shutter={220}>
      <AbsoluteFill>
        <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, background: C.teal}}>
          <Defs />
          {inWipe ? <>
            {renderShot(REWIND_AT - 0.01, hook, 'SL')}
            <defs><clipPath id="sliceNew"><WipeClipPoly k={k} tf={mirror} /></clipPath></defs>
            <g clipPath="url(#sliceNew)">{renderShot(t, hook, 'S')}</g>
            <g transform={mirror}><WipeRim k={k} /></g>
          </> : renderShot(t, hook)}
        </svg>
      </AbsoluteFill>
    </MotionBlurWhen>
    <AbsoluteFill>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        <Defs />
        {t >= REWIND_AT && t < REWIND_AT + 0.9 && <g transform="translate(540 585) rotate(-4)" opacity={smooth(t, REWIND_AT + 0.1, REWIND_AT + 0.3) * (1 - smooth(t, REWIND_AT + 0.6, REWIND_AT + 0.9))}>
          <rect x={-250} y={-64} width={500} height={128} rx={20} fill={C.ink} opacity={0.35} transform="translate(8 10)" />
          <rect x={-250} y={-64} width={500} height={128} rx={20} fill={C.pumpkin} stroke={C.ink} strokeWidth={8} />
          <polygon points="-196,0 -150,-30 -150,30" fill={C.ink} /><polygon points="-150,0 -104,-30 -104,30" fill={C.ink} />
          <text x={70} y={32} textAnchor="middle" fontFamily={ANTON} fontSize={96} fill={C.ink} letterSpacing={3}>{spec.cards.rewind_badge}</text>
        </g>}
        {spec.strips.map((s, i) => {
          const isHook = (s as {hook?: boolean}).hook;
          if (isHook && (s as {hookProp?: string}).hookProp !== hook) return null;
          if (t >= s.to || t < s.from) return null;
          return <Strip key={i} text={s.text} y={s.y} age={t - s.from + (isHook ? 1 : 0.06)} out={isHook ? smooth(t, 3.0, 3.2) : smooth(t, s.to - 0.12, s.to)} size={(s as {size?: number}).size ?? 56} maxW={1000} />;
        })}
      </svg>
    </AbsoluteFill>
  </>;
};

export const Pie6: React.FC<{hook?: Hook}> = ({hook = 'a'}) => (
  <AbsoluteFill style={{background: C.teal}}>
    <Audio src={staticFile('audio/pie-ep6.wav')} volume={0.9} />
    <Scene hook={hook} />
  </AbsoluteFill>
);
