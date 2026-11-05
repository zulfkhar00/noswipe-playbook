import React from 'react';
import {AbsoluteFill} from 'remotion';
import {OPEN} from '../../lib/fonts';
import {clamp, easeOut, lerp, smooth, springIn} from '../../lib/motion';

// "Ten Swipes Left": look = dark arcade. Ink ground, token gold, cyan, one signal red (the counter at 1 only).
// Anton for numbers and the big captions, Barlow Condensed for strips and HUD labels, Inter for card bios,
// Courier Prime for the RULE stamp. All bundled fonts. Everything is a pure function of time t (seconds).

export const C = {
  ink: '#101218', ink2: '#0B0D12', gold: '#FFC21A', cyan: '#2FD9F5', red: '#FF3B3B', paper: '#F2F2EC', coral: '#E8735A',
  wall: '#202639', floor: '#161B2A', phone: '#1B2030', screen: '#262E45', skin: '#F0B48C', skinDk: '#D99870', nail: '#F8E3D3',
  hair: '#3A2A2E',
};
export const F = {anton: OPEN.poster, cond: OPEN.condensed, inter: OPEN.grotesk, mono: OPEN.typewriter};
export const W = 1080;
export const H = 1920;

/** Off-white outline helper for figures (6 px). */
export const outline = (color = C.paper, w = 6) => ({stroke: color, strokeWidth: w, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const});

type TxtProps = {x: number; y: number; size: number; font?: string; weight?: number; fill?: string; stroke?: string; sw?: number; shadow?: number; anchor?: 'start' | 'middle' | 'end'; spacing?: number; opacity?: number; rot?: number; children: React.ReactNode};
/** SVG text with an ink stroke and a hard offset shadow (the look's signature lettering). */
export const Txt: React.FC<TxtProps> = ({x, y, size, font = F.cond, weight = 700, fill = C.paper, stroke, sw = 12, shadow = 0, anchor = 'middle', spacing = 0, opacity = 1, rot = 0, children}) => {
  const common = {x, y, fontFamily: font, fontWeight: weight, fontSize: size, textAnchor: anchor, letterSpacing: spacing, style: {paintOrder: 'stroke' as const}};
  return <g opacity={opacity} transform={rot ? `rotate(${rot} ${x} ${y})` : undefined}>
    {shadow > 0 && <text {...common} x={x + shadow} y={y + shadow} fill={C.ink} stroke={C.ink} strokeWidth={stroke ? sw : 0} strokeLinejoin="round">{children}</text>}
    <text {...common} fill={fill} stroke={stroke} strokeWidth={stroke ? sw : 0} strokeLinejoin="round">{children}</text>
  </g>;
};

/** Rough text width for Anton / Barlow Condensed, for sizing plates. */
export const tw = (s: string, size: number, k = 0.42) => s.length * size * k;

export const Svg: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) =>
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0, ...style}}>{children}</svg>;

/** Dark arcade ground: ink with a faint dot grid and a soft gold glow low in the frame. */
export const Ground: React.FC = () => <AbsoluteFill style={{background: C.ink}}>
  <Svg>
    <defs>
      <pattern id="dots" width="54" height="54" patternUnits="userSpaceOnUse"><circle cx="27" cy="27" r="3" fill="#1D2438" /></pattern>
      <radialGradient id="glow" cx="50%" cy="62%" r="60%"><stop offset="0" stopColor="#3A2F12" stopOpacity="0.55" /><stop offset="1" stopColor={C.ink} stopOpacity="0" /></radialGradient>
    </defs>
    <rect width={W} height={H} fill="url(#dots)" />
    <rect width={W} height={H} fill="url(#glow)" />
  </Svg>
</AbsoluteFill>;

// ----------------------------------------------------------------------------------------- HUD

export type CounterStep = {t: number; value: number};
export const counterAt = (counter: CounterStep[], t: number) => {
  let cur = counter[0], i = 0;
  counter.forEach((c, k) => { if (t >= c.t) { cur = c; i = k; } });
  return {value: cur.value, since: t - cur.t, index: i};
};

export const HUD = {x: 70, y: 290, w: 340, h: 180};
export const SLOT = {x: HUD.x + HUD.w, y: HUD.y + 40}; // where coins drop in

/** The counter chip: label "SWIPES LEFT", a big Anton number and ten pips that go dark one at a time. */
export const Hud: React.FC<{counter: CounterStep[]; t: number; scale?: number}> = ({counter, t, scale = 1}) => {
  const {value, since, index} = counterAt(counter, t);
  const red = value === 1;
  const col = red ? C.red : C.gold;
  const pop = index === 0 ? 1 : 1 + 0.18 * Math.max(0, 1 - since / 0.18);
  const pulse = red ? 1 + 0.05 * Math.sin(Math.max(0, since) * 11) : 1;
  const {x, y, w, h} = HUD;
  return <g transform={`translate(${x} ${y}) scale(${pulse * scale}) translate(${-x} ${-y})`}>
    <rect x={x + 8} y={y + 8} width={w} height={h} rx={26} fill={C.ink} />
    <rect x={x} y={y} width={w} height={h} rx={26} fill={C.ink2} stroke={col} strokeWidth={6} />
    <Txt x={x + 24} y={y + 50} size={36} fill={col} anchor="start" spacing={2}>SWIPES LEFT</Txt>
    <g transform={`translate(${x + 80} ${y + 150}) scale(${pop})`}>
      <Txt x={0} y={0} size={124} font={F.anton} weight={400} fill={red ? C.red : C.paper} anchor="middle">{value}</Txt>
    </g>
    {Array.from({length: 10}, (_, i) => {
      const on = i < value;
      const cx = x + 168 + (i % 5) * 34, cy = y + 94 + Math.floor(i / 5) * 40;
      return <circle key={i} cx={cx} cy={cy} r={13} fill={on ? col : 'none'} stroke={on ? C.ink : '#3A4260'} strokeWidth={4} />;
    })}
    {/* coin slot on the chip's right edge */}
    <rect x={x + w - 8} y={y + 22} width={22} height={36} rx={8} fill={C.ink} stroke={col} strokeWidth={4} />
  </g>;
};

/** A gold coin (no symbol: a ring and a shine). */
export const Coin: React.FC<{x: number; y: number; r?: number; flip?: number; opacity?: number}> = ({x, y, r = 30, flip = 1, opacity = 1}) =>
  <g transform={`translate(${x} ${y}) scale(${flip} 1)`} opacity={opacity}>
    <circle r={r} fill={C.gold} stroke={C.ink} strokeWidth={5} />
    <circle r={r * 0.68} fill="none" stroke="#C98F00" strokeWidth={4} />
    <path d={`M${-r * 0.35} ${-r * 0.1} A${r * 0.4} ${r * 0.4} 0 0 1 ${r * 0.05} ${-r * 0.4}`} fill="none" stroke="#FFF3B8" strokeWidth={4} strokeLinecap="round" />
  </g>;

/** A coin that flies from (x0,y0) into the HUD slot, shrinking as it drops in. */
export const HudCoin: React.FC<{t: number; at: number; x0: number; y0: number}> = ({t, at, x0, y0}) => {
  const u = clamp((t - at) / 0.34);
  if (u <= 0 || u >= 1) return null;
  const e = easeOut(t, at, at + 0.34);
  const x = lerp(x0, SLOT.x + 4, e), y = lerp(y0, SLOT.y + 18, e) - Math.sin(u * Math.PI) * 50;
  return <Coin x={x} y={y} r={26 * (1 - 0.45 * u)} flip={Math.cos(u * 9)} />;
};

// ----------------------------------------------------------------------------------------- strips and captions

/** A gold plate with ink text (Barlow Condensed), hard offset shadow; `age` < 0.01 is fully in (frame 0 is composed). */
export const RuleStrip: React.FC<{text: string; y: number; age: number; out?: number; size?: number; stamp?: boolean; rot?: number}> = ({text, y, age, out = 0, size = 58, stamp = false, rot = 0}) => {
  const k = stamp ? 0.6 : 0.4;
  const w = Math.min(960, tw(text, size, k) + 70), h = size + 36;
  const inn = age <= 0.001 && !stamp ? 1 : stamp ? 1 : easeOut(age, 0, 0.22);
  const sl = stamp ? Math.max(0, 1 - age / 0.12) : 0;
  const sc = (stamp ? 1 + 0.7 * sl : 1) * (0.9 + 0.1 * inn);
  const font = stamp ? F.mono : F.cond;
  return <g opacity={(1 - out) * (stamp ? clamp(age / 0.05 + 0.2) : inn)} transform={`translate(540 ${y}) rotate(${rot}) scale(${sc}) translate(${-540} ${-y})`}>
    <rect x={540 - w / 2 + 8} y={y - h / 2 + 8} width={w} height={h} rx={stamp ? 6 : 20} fill={C.ink} />
    <rect x={540 - w / 2} y={y - h / 2} width={w} height={h} rx={stamp ? 6 : 20} fill={stamp ? C.paper : C.gold} stroke={C.ink} strokeWidth={6} />
    {stamp && <rect x={540 - w / 2 + 10} y={y - h / 2 + 10} width={w - 20} height={h - 20} rx={3} fill="none" stroke={C.ink} strokeWidth={3} />}
    <text x={540} y={y + size * 0.34} textAnchor="middle" fontFamily={font} fontWeight={700} fontSize={size} fill={C.ink}>{text}</text>
  </g>;
};

/** Big centre caption: Anton, 6 px ink stroke, hard 6 px shadow; the spoken word is gold. */
export const CaptionBig: React.FC<{words: {text: string; start: number; end: number}[]; t: number; y?: number}> = ({words, t, y = 1150}) => {
  if (!words.length) return null;
  const text = words.map((w) => w.text.toUpperCase()).join(' ');
  const size = Math.min(108, 940 / (text.length * 0.46));
  const sc = 0.9 + 0.1 * easeOut(t - words[0].start, 0, 0.12);
  const by = y + size * 0.36;
  const props = {x: 540, y: by, fontFamily: F.anton, fontSize: size, textAnchor: 'middle' as const, strokeLinejoin: 'round' as const, style: {paintOrder: 'stroke' as const}};
  const spans = (colour: (i: number) => string) => words.map((w, i) => <tspan key={i} fill={colour(i)}>{w.text.toUpperCase()}{i < words.length - 1 ? ' ' : ''}</tspan>);
  const active = (i: number) => t >= words[i].start && t < words[i].end + 0.04;
  return <g transform={`translate(540 ${y}) scale(${sc}) translate(-540 ${-y})`}>
    <text {...props} x={546} y={by + 6} fill={C.ink} stroke={C.ink} strokeWidth={12}>{text}</text>
    <text {...props} stroke={C.ink} strokeWidth={12}>{spans((i) => (active(i) ? C.gold : C.paper))}</text>
  </g>;
};

// ----------------------------------------------------------------------------------------- signature transition

const R_MAX = 1340;
export const SLOT_Y = 1200;
/** Where in the wipe are we? 'old' until the disc covers the frame, then 'new'. */
export const wipePhase = (t: number, t0: number) => (t < t0 + 0.27 ? 'old' : 'new');

/** Coin-drop wipe: a gold coin falls from the top centre with spin, drops through a slot at y 1000; a gold disc
 * then grows from the slot over the old shot and shrinks away again, opening the new shot (0.35 s). */
export const CoinDrop: React.FC<{t: number; t0: number}> = ({t, t0}) => {
  const fall = 0.5;
  const f = clamp((t - (t0 - fall)) / fall);
  const grow = easeOut(t, t0, t0 + 0.25);
  const shrink = smooth(t, t0 + 0.29, t0 + 0.64);
  const r = t < t0 + 0.27 ? R_MAX * grow : R_MAX * (1 - shrink);
  const fast = f > 0 && f < 1;
  const y = 120 + (SLOT_Y - 120) * f * f;
  const spin = Math.cos((t - t0) * 22);
  return <g>
    {t > t0 - fall && t < t0 + 0.15 && <g opacity={clamp((t - (t0 - fall)) / 0.1) * (1 - clamp((t - t0) / 0.12))}>
      <rect x={400} y={SLOT_Y - 14} width={280} height={30} rx={15} fill={C.ink} stroke={C.gold} strokeWidth={6} />
    </g>}
    {fast && [3, 2, 1].map((k) => <Coin key={k} x={540} y={120 + (SLOT_Y - 120) * Math.max(0, f - k * 0.05) ** 2} r={44} flip={Math.cos((t - t0 - k * 0.02) * 22)} opacity={0.14 * (4 - k)} />)}
    {fast && <Coin x={540} y={y} r={46} flip={spin} />}
    {r > 1 && <g>
      <circle cx={540} cy={SLOT_Y} r={r} fill={C.gold} />
      <circle cx={540} cy={SLOT_Y} r={Math.max(0, r - 18)} fill="none" stroke="#C98F00" strokeWidth={6} />
      {r > 500 && <g>
        <rect x={380} y={SLOT_Y - 16} width={320} height={32} rx={16} fill={C.ink} />
        <Coin x={540} y={SLOT_Y - 150} r={110} flip={1} />
      </g>}
    </g>}
  </g>;
};

// ----------------------------------------------------------------------------------------- end card

export const EndCard: React.FC<{age: number}> = ({age}) => {
  const s1 = springIn(age, 0, 14), s2 = springIn(age, 0.25, 14), pipsOn = Math.min(10, Math.floor(age / 0.07));
  return <AbsoluteFill>
    <Ground />
    <Svg>
      <g transform={`translate(540 760) scale(${s1}) translate(-540 -760)`}>
        <Txt x={540} y={700} size={190} font={F.anton} weight={400} fill={C.gold} stroke={C.ink} sw={14} shadow={9}>TEN SWIPES</Txt>
        <Txt x={540} y={890} size={190} font={F.anton} weight={400} fill={C.paper} stroke={C.ink} sw={14} shadow={9}>LEFT</Txt>
      </g>
      <g transform={`translate(540 1040) scale(${s2}) translate(-540 -1040)`}>
        <rect x={220 + 8} y={985 + 8} width={640} height={110} rx={26} fill={C.ink} />
        <rect x={220} y={985} width={640} height={110} rx={26} fill={C.gold} stroke={C.ink} strokeWidth={6} />
        <text x={540} y={1062} textAnchor="middle" fontFamily={F.cond} fontWeight={700} fontSize={70} fill={C.ink}>PART 2 · A OR B</text>
      </g>
      {Array.from({length: 10}, (_, i) => i === 0
        ? <circle key={i} cx={540 - 4.5 * 52} cy={1180} r={16 + 3 * Math.sin(age * 8)} fill={C.red} stroke={C.ink} strokeWidth={4} />
        : <circle key={i} cx={540 - 4.5 * 52 + i * 52} cy={1180} r={16} fill="none" stroke="#3A4260" strokeWidth={4} opacity={i <= pipsOn ? 1 : 0} />)}
    </Svg>
  </AbsoluteFill>;
};
