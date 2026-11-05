import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, easeOut, lerp, smooth} from '../../lib/motion';
import {Line, Word, wordsOf} from '../../lib/speech';
import tlJson from '../swipes-ep1.timeline.json';
import spec from '../../../specs/stories/swipes-ep1.json';
import {C, CaptionBig, Coin, CoinDrop, CounterStep, EndCard, F, Ground, Hud, HudCoin, RuleStrip, Svg, Txt} from './world';
import {CARD_POS, CardFace, CardSpec, CARD_H, CARD_W, PhoneBody, Thumb} from './figures';
import {Queue, herPhone} from './queue';
import {VoteBoard} from './vote';

// Ten Swipes Left, part 1. You get ten swipes a day. The counter runs down, you hit one swipe left in a coffee
// queue, the person ahead turns and shows her own screen: also one. Vote A (use it) or B (put the phone away, say hi).
// Narrated in the second person; the viewer is only a POV thumb. Beats come from real word timings (timeline.json).

export const SWIPES1_FPS = 60;
export const SWIPES1_FRAMES = Math.round(tlJson.duration * SWIPES1_FPS);
export type Hook = 'a' | 'b';

const B = tlJson.beats;
const COUNTER = tlJson.counter as CounterStep[];
const LINES = tlJson.lines as unknown as Line[];
/** Caption chunks: one per sentence (<= 3 words or <= 17 characters), longer sentences split evenly into groups of 3 or fewer. */
const CHUNKS = (() => {
  const out: {words: Word[]; start: number; end: number}[] = [];
  wordsOf(LINES).forEach((ws, li) => {
    const sentences: Word[][] = [];
    let cur: Word[] = [];
    ws.forEach((w) => { cur.push(w); if (/[.?!]$/.test(w.text)) { sentences.push(cur); cur = []; } });
    if (cur.length) sentences.push(cur);
    const groups: Word[][] = [];
    sentences.forEach((sn) => {
      const chars = sn.map((w) => w.text).join(' ').length;
      if (sn.length <= 3 || chars <= 17) { groups.push(sn); return; }
      const k = Math.ceil(sn.length / 3), per = Math.ceil(sn.length / k);
      for (let i = 0; i < sn.length; i += per) groups.push(sn.slice(i, i + per));
    });
    const lineEnd = LINES[li].start + LINES[li].duration + 0.12;
    groups.forEach((g, i) => out.push({words: g, start: g[0].start, end: i + 1 < groups.length ? groups[i + 1][0].start : lineEnd}));
  });
  return out;
})();
const EV = COUNTER.slice(1).map((c, i) => ({t: c.t, dir: i % 2 === 0 ? 1 : -1, d: i >= 4 && i <= 7 ? 0.16 : 0.24}));

const CARDS: CardSpec[] = [
  {fill: C.gold, body: C.coral, accessory: 'carabiner', name: 'Ana', bio: ['Loves climbing,', 'bad puns.']},
  {fill: C.cyan, body: C.gold, accessory: 'leash', bio: ['Dog person.']},
  {fill: C.paper, body: C.cyan, accessory: 'pan', bio: ['Cooks badly,', 'tries anyway.']},
  {fill: C.coral, body: C.gold, accessory: 'book', bio: ['Reads on trains.']},
  {fill: C.gold, body: C.cyan, accessory: 'plant', bio: ['Plant parent.']},
  {fill: C.cyan, body: C.coral, accessory: 'guitar', bio: ['Plays guitar.']},
  {fill: C.paper, body: C.gold, accessory: 'cup', bio: ['Sunday baker.']},
  {fill: C.coral, body: C.cyan, accessory: 'book', bio: ['Swims at dawn.']},
  {fill: C.gold, body: C.coral, accessory: 'leash', bio: ['Road trips.']},
];
const LAST: CardSpec = {fill: C.gold, body: C.coral, accessory: 'cup', hero: true, bio: ['Also on my last one.', 'Same. Coffee?']};

// ------------------------------------------------------------------------------------------ thumb path
const REST = {x: 790, y: 1260};
type Kf = {t: number; x: number; y: number; press: number};
const KFS: Kf[] = (() => {
  const k: Kf[] = [{t: 0, ...REST, press: 0}];
  EV.forEach((e, i) => {
    const a = e.t - 0.2, next = EV[i + 1];
    if (!EV[i - 1] || EV[i - 1].t + EV[i - 1].d + 0.3 < a - 0.3) k.push({t: a - 0.3, ...REST, press: 0});
    k.push({t: a, x: 600 - e.dir * 70, y: 1160, press: 0});
    k.push({t: e.t - 0.03, x: 560 - e.dir * 60, y: 1090, press: 1});
    k.push({t: e.t + e.d * 0.85, x: 540 + e.dir * 320, y: 1040, press: 0.5});
    if (!next || next.t - 0.2 > e.t + e.d + 0.3) k.push({t: e.t + e.d + 0.3, ...REST, press: 0});
  });
  const last = EV[EV.length - 1];
  k.push({t: B.hover - 0.4, ...REST, press: 0});
  k.push({t: B.hover, x: 770, y: 1190, press: 0});
  k.push({t: 99, x: 770, y: 1190, press: 0});
  return k.sort((a, b) => a.t - b.t).filter((x, i, arr) => i === 0 || x.t > arr[i - 1].t || (void last, false));
})();
/** Hook idle: the thumb is already moving and the card already tilting from frame 0, until the first real swipe approach. */
const IDLE = (t: number) => 1 - smooth(t, EV[0].t - 0.9, EV[0].t - 0.4);
const thumbAt = (t: number) => {
  let i = 0;
  while (i + 1 < KFS.length && KFS[i + 1].t <= t) i++;
  const a = KFS[i], b = KFS[Math.min(i + 1, KFS.length - 1)];
  const u = b.t === a.t ? 0 : smooth(t, a.t, b.t);
  const tremble = t > B.sweat - 0.6 ? 4 : 0;
  const idle = IDLE(t);
  return {x: lerp(a.x, b.x, u) + Math.sin(t * 61) * tremble - 50 * idle * (0.5 + 0.5 * Math.sin(t * 3.1 + 1)), y: lerp(a.y, b.y, u) + Math.cos(t * 53) * tremble - 70 * idle * (0.5 + 0.5 * Math.sin(t * 3.1 + 1)), press: lerp(a.press, b.press, u)};
};

// ------------------------------------------------------------------------------------------ phone scene
const CardAt: React.FC<{card: CardSpec; x?: number; y?: number; rot?: number; scale?: number; opacity?: number; reveal?: number}> = ({card, x = 0, y = 0, rot = 0, scale = 1, opacity = 1, reveal}) =>
  <g opacity={opacity} transform={`translate(${CARD_POS.x + CARD_W / 2 + x} ${CARD_POS.y + CARD_H + y}) rotate(${rot}) scale(${scale}) translate(${-CARD_W / 2} ${-CARD_H})`}>
    <CardFace card={card} reveal={reveal} />
  </g>;

const Cards: React.FC<{t: number}> = ({t}) => {
  let i = EV.findIndex((e) => t < e.t + e.d);
  if (i < 0) i = EV.length;
  const cur = i < EV.length ? CARDS[i] : LAST;
  const next = i + 1 < EV.length ? CARDS[i + 1] : i + 1 === EV.length ? LAST : null;
  const e = EV[i];
  const u = e ? clamp((t - (e.t - 0.03)) / (e.d + 0.03)) : 0;
  const mk = (card: CardSpec) => card;
  return <g>
    {next && <CardAt card={mk(next)} y={14} scale={0.94} opacity={0.9} reveal={1} />}
    {e && u > 0 && e.d < 0.2 && [0.2, 0.1].map((g) => { const ug = Math.max(0, u - g); return <CardAt key={g} card={cur} x={e.dir * 900 * ug * ug} y={-30 * ug} rot={e.dir * 14 * ug} opacity={0.28 - g} />; })}
    <CardAt card={mk(cur)} x={e ? e.dir * 900 * u * u : 0} y={e ? -30 * u : 0} rot={e ? (u > 0 ? e.dir * 14 * u : i === 0 ? 8 * IDLE(t) * Math.sin(t * 3.1 + 1) : 0) : 0} reveal={1} />
  </g>;
};

const camPhone = (t: number) => {
  const z1 = 0.28 * smooth(t, B.card1, B.card1 + 0.4) * (1 - smooth(t, B.swipe1 + 0.05, B.swipe1 + 0.45));
  const z2 = 0.45 * smooth(t, B.lastCard - 0.4, B.lastCard - 0.1);
  const z = 1 + Math.max(z1, z2);
  return {z, cy: 870 - 130 * (z - 1)};
};

const PhoneScene: React.FC<{t: number}> = ({t}) => {
  const {z, cy} = camPhone(t);
  const th = thumbAt(t);
  return <g transform={`translate(540 ${cy}) scale(${z}) translate(-540 -870)`}>
    <PhoneBody><Cards t={t} /></PhoneBody>
    <Thumb tip={{x: th.x, y: th.y}} press={th.press} sweat={{a: B.sweat, b: B.l7, t}} />
  </g>;
};

// ------------------------------------------------------------------------------------------ queue scene
const camQueue = (t: number) => {
  const p = herPhone(smooth(t, B.turn + 0.3, B.turn + 0.65));
  const close = smooth(t, B.herScreen - 0.05, B.herScreen + 0.4) * (1 - smooth(t, B.smile, B.smile + 0.5));
  const med = smooth(t, B.smile, B.smile + 0.5);
  const z = 1 + 1.6 * close + 0.7 * med;
  const fx = lerp(lerp(540, p.x, close), 520, med), fy = lerp(lerp(800, p.y, close), 960, med);
  const ay = lerp(lerp(800, 690, close), 760, med);
  const ax = lerp(lerp(540, 640, close), 650, med);
  return {z, fx, fy, ay, ax};
};
const QDY = 70;
const QueueScene: React.FC<{t: number}> = ({t}) => {
  const {z, fx, fy, ay, ax} = camQueue(t);
  return <g transform={`translate(${ax} ${ay}) scale(${z}) translate(${-fx} ${-(fy + QDY)}) translate(0 ${QDY})`}>
    <Queue t={t} turn={B.turn} raise={B.turn + 0.3} smile={smooth(t, B.smile, B.smile + 0.25)} />
  </g>;
};

const sOf = (t: number) => {
  if (t < B.pullBack + 0.27) return 1;
  if (t < B.lastCard - 0.3) return 0;
  if (t < B.lastCard) return smooth(t, B.lastCard - 0.3, B.lastCard);
  if (t < B.l7) return 1;
  if (t < B.l7 + 0.35) return 1 - smooth(t, B.l7, B.l7 + 0.35);
  return 0;
};

// ------------------------------------------------------------------------------------------ overlays
type Strip = {text: string; from: number; to: number; y: number; stamp?: boolean; rot?: number};
const STRIPS: Strip[] = [
  {text: spec.context, from: 0, to: B.bodyStart - 0.1, y: 520},
  {text: 'RULE 1 · NO GOING BACK', from: B.rule, to: B.card1 + 0.1, y: 520, stamp: true, rot: 0},
  {text: 'coffee queue', from: B.pullBack + 0.3, to: B.lastCard - 0.3, y: 520},
];

const Overlay: React.FC<{t: number; hook: Hook; showHud: boolean}> = ({t, hook, showHud}) => {
  const hookWords = (() => {
    const h = tlJson.hooks[hook];
    const ws = spec.hooks[hook].caption.split(' ');
    const dur = B.bodyStart - 0.2;
    return ws.map((w, i) => ({text: w, start: (i * dur) / ws.length, end: ((i + 1) * dur) / ws.length}));
    void h;
  })();
  const chunk = CHUNKS.find((c) => t >= c.start && t < c.end);
  const caption = t < B.bodyStart - 0.1 ? hookWords : chunk && t < B.comment ? chunk.words : [];
  const costAge = t - B.cost;
  return <Svg>
    {showHud && <Hud counter={COUNTER} t={t} scale={0.68 + 0.32 * sOf(t)} />}
    {showHud && EV.map((e, i) => <HudCoin key={i} t={t} at={e.t} x0={540 + e.dir * 40} y0={880} />)}
    {costAge > 0 && costAge < 1.3 && <g opacity={1 - smooth(costAge, 0.8, 1.3)}>
      <Txt x={440} y={450 - 10 * easeOut(costAge, 0, 1.2)} size={160} font={F.anton} weight={400} fill={C.gold} stroke={C.ink} sw={12} shadow={7} anchor="start">-1</Txt>
      <Coin x={700} y={392 - 10 * easeOut(costAge, 0, 1.2)} r={54} flip={Math.cos(costAge * 8)} />
    </g>}
    {STRIPS.map((s, i) => t >= s.from && t < s.to && <RuleStrip key={i} text={s.text} y={s.y} age={t - s.from} out={smooth(t, s.to - 0.15, s.to)} stamp={s.stamp} rot={s.rot ?? 0} size={s.stamp ? 64 : 58} />)}
    <CaptionBig words={caption} t={t} />
  </Svg>;
};

export const Swipes1: React.FC<{hook?: Hook}> = ({hook = 'a'}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const s = sOf(t);
  const w1 = B.pullBack, w2 = B.voteBoard;
  const inVote = t >= w2 + 0.27 && t < B.endcard;
  const inEnd = t >= B.endcard;
  const blur = Math.sin(Math.PI * clamp(s)) * 7;
  const hookTake = tlJson.hooks[hook];
  return <AbsoluteFill style={{background: C.ink}}>
    <Audio src={staticFile('audio/swipes-ep1-music.wav')} volume={0.22} />
    <Audio src={staticFile('audio/swipes-ep1-room.wav')} volume={0.5} />
    <Audio src={staticFile('audio/swipes-ep1-sfx.wav')} volume={0.7} />
    <Sequence from={Math.round(hookTake.start * fps)}><Audio src={staticFile(hookTake.file)} /></Sequence>
    {LINES.map((l, i) => <Sequence key={i} from={Math.round(l.start * fps)}><Audio src={staticFile(l.file)} /></Sequence>)}
    {inEnd ? <EndCard age={t - B.endcard} /> : inVote ? <>
      <Ground />
      <VoteBoard t={t} t0={w2 + 0.27} tA={B.cardA} tB={B.cardB} hlA={B.hlA} hlB={B.hlB} tComment={B.comment} />
      <Svg><CaptionBig words={t >= B.comment ? [] : (CHUNKS.find((c) => t >= c.start && t < c.end)?.words) ?? []} t={t} /></Svg>
    </> : <>
      <Ground />
      {s < 1 && <Svg style={{filter: blur > 0.5 ? `blur(${blur}px)` : undefined}}><g transform={`translate(0 ${-s * 1920})`}><QueueScene t={t} /></g></Svg>}
      {s > 0 && <Svg style={{filter: blur > 0.5 ? `blur(${blur}px)` : undefined}}><g transform={`translate(0 ${(1 - s) * 1920})`}><PhoneScene t={t} /></g></Svg>}
      <Overlay t={t} hook={hook} showHud />
    </>}
    {(t > w1 - 0.52 && t < w1 + 0.7) && <Svg><CoinDrop t={t} t0={w1} /></Svg>}
    {(t > w2 - 0.52 && t < w2 + 0.7) && <Svg><CoinDrop t={t} t0={w2} /></Svg>}
  </AbsoluteFill>;
};
