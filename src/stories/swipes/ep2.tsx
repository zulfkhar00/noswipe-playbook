import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {clamp, easeOut, lerp, smooth} from '../../lib/motion';
import {Line, Word, wordsOf} from '../../lib/speech';
import tlJson from '../swipes-ep2.timeline.json';
import spec from '../../../specs/stories/swipes-ep2.json';
import {C, CaptionBig, CoinDrop, CounterStep, EndCard, F, Ground, Hud, HudCoin, RuleStrip, Svg, Txt} from './world';
import {CARD_POS, CardFace, CardSpec, CARD_H, CARD_W, PhoneBody, Thumb} from './figures';
import {Queue} from './queue';
import {VoteBoard2} from './vote2';
import {Bag, Bubble, BuzzCard, Chair, CHAIR, ClockChip, CoinRewind, Draft, HerFig, HerPose, MatchCard, StampBig, Table, TABLE, loc, S} from './parts2';
import {HER} from './queue';

// Ten Swipes Left, part 2. Hook (a or b) shows the queue: your last swipe, her last swipe. Then BOTH branches of
// part 1's vote, each tagged on screen: YOU SWIPED (swipe, match, "hey" typed and deleted, NEXT, RULE 1) and, after a
// coin rewind, YOU SAID HI (her chair invitation, your phone buzzes, she turns hers face down). Vote A or B.
// Everything is a pure function of time; the two hooks have their own timelines (identical body, offset by the hook).

export const SWIPES2_FPS = 60;
export type Hook = 'a' | 'b';
const TL = tlJson as unknown as Record<Hook, {hook: Line; lines: Line[]; beats: Record<string, number>; counter: CounterStep[]; duration: number}>;
export const swipes2Frames = (hook: Hook) => Math.round(TL[hook].duration * SWIPES2_FPS);

const LAST: CardSpec = {fill: C.gold, body: C.coral, accessory: 'cup', hero: true, bio: ['Also on my last one.', 'Same. Coffee?']};
const D = 0.28; // slide length

/** Complete caption phrases: [first word, last word, hidden?] per narration line (spec line n). Hidden = on screen already. */
const PHRASES: Record<number, [number, number, boolean?][]> = {
  2: [[0, 2], [3, 5, true], [6, 8]], 3: [[0, 5], [6, 7]], 4: [[0, 4]], 5: [[0, 3], [4, 5]], 6: [[0, 2], [3, 8]], 7: [[0, 5], [6, 8]], 8: [[0, 2], [3, 6]],
};
const chunksOf = (lines: Line[], holdLast: number) => {
  const out: {words: Word[]; start: number; end: number}[] = [];
  wordsOf(lines).forEach((ws, li) => {
    const n = li + 2;
    const ph = PHRASES[n] ?? [];
    ph.forEach(([i, j, hidden], k) => {
      const lineEnd = lines[li].start + lines[li].duration + 0.12;
      const end = k + 1 < ph.length ? ws[ph[k + 1][0]].start : n === 7 ? holdLast : lineEnd;
      if (!hidden) out.push({words: ws.slice(i, j + 1), start: ws[i].start, end});
    });
  });
  return out;
};

const pts = (t: number, ks: {t: number; x: number; y: number; press: number}[]) => {
  let i = 0;
  while (i + 1 < ks.length && ks[i + 1].t <= t) i++;
  const a = ks[i], b = ks[Math.min(i + 1, ks.length - 1)];
  const u = b.t === a.t ? 0 : smooth(t, a.t, b.t);
  return {x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), press: lerp(a.press, b.press, u)};
};

// ------------------------------------------------------------------------------------------ phone scene
/** The phone is drawn smaller (0.56) and high, so the captions at y 1195 never touch it; the thumb rises out of the bottom edge. */
const PHONE_T = 'translate(540 869) scale(0.56) translate(-540 -1070)';
const PhoneScene: React.FC<{t: number; b: Record<string, number>; v: 'match' | 'buzz'}> = ({t, b, v}) => {
  const s0 = b.swiped;
  const th = pts(t, [{t: 0, x: 830, y: 1580, press: 0}, {t: s0 - 0.45, x: 830, y: 1580, press: 0}, {t: s0 - 0.2, x: 640, y: 1170, press: 0}, {t: s0 - 0.03, x: 580, y: 1090, press: 1},
    {t: s0 + 0.2, x: 860, y: 1040, press: 0.5}, {t: s0 + 0.55, x: 830, y: 1580, press: 0}, {t: 99, x: 830, y: 1580, press: 0}]);
  const u = clamp((t - (s0 - 0.03)) / 0.22);
  const buzzAge = t - (b.buzz + 0.1);
  const vib = v === 'buzz' && buzzAge > 0 && buzzAge < 0.8 ? Math.sin(buzzAge * 120) * 8 * (1 - buzzAge / 0.8) : 0;
  const card = (children: React.ReactNode, sc = 1, y = 0) => <g transform={`translate(${CARD_POS.x + CARD_W / 2} ${CARD_POS.y + y}) scale(${sc}) translate(${-CARD_W / 2} 0)`}>{children}</g>;
  return <g transform={PHONE_T}><g transform={`translate(${vib} 0)`}>
    <PhoneBody>
      {v === 'match' && <>
        {t >= s0 && card(<MatchCard age={t - s0} />, 1 - 0.28 * smooth(t, b.type0 - 0.2, b.type0 + 0.05), 0)}
        <g transform={`translate(${CARD_POS.x} ${CARD_POS.y + 345})`}><Draft t={t} type0={b.type0} del0={b.del0} show={smooth(t, b.type0 - 0.3, b.type0 - 0.05)} /></g>
        {t < s0 + 0.3 && <g transform={`translate(${CARD_POS.x + CARD_W / 2 + 900 * u * u} ${CARD_POS.y + CARD_H - 30 * u}) rotate(${14 * u}) translate(${-CARD_W / 2} ${-CARD_H})`}><CardFace card={LAST} /></g>}
      </>}
      {v === 'buzz' && card(<BuzzCard age={t - (b.buzz + 0.1)} />, 1, 0)}
    </PhoneBody>
    {v === 'match' && t > s0 - 0.5 && t < s0 + 0.6 && <g clipPath="url(#thumbClip)">
      <clipPath id="thumbClip"><rect x={0} y={0} width={1080} height={1572} /></clipPath>
      <Thumb tip={{x: th.x, y: th.y}} press={th.press} />
    </g>}
  </g></g>;
};

// ------------------------------------------------------------------------------------------ queue scene
const handWorld = (t: number, b: Record<string, number>) => {
  const M = b.maybe;
  const k = {k0: M - 0.95, k1: M - 0.65, k2: M - 0.3, g0: M - 0.2, p0: M - 0.05, p1: M + 0.25, p2: M + 0.4};
  const rest = {x: HER.x + 92 * S, y: HER.y - 48 * S};
  const bagTop = {x: CHAIR.x0 + 10, y: CHAIR.seat - 110};
  const hip = {x: HER.x + 88 * S, y: HER.y - 58 * S};
  const back0 = {x: CHAIR.x0 - 41, y: CHAIR.seat - 116};
  const m = (a: {x: number; y: number}, c: {x: number; y: number}, u: number) => ({x: lerp(a.x, c.x, u), y: lerp(a.y, c.y, u)});
  const chairX = lerp(CHAIR.x0, CHAIR.x1, smooth(t, k.p0, k.p1));
  let p: {x: number; y: number; open: number} | null;
  if (t < k.k0 || t >= b.buzz + 0.1) p = null;
  else if (t < k.k1) p = {...m(rest, bagTop, smooth(t, k.k0, k.k1)), open: 0};
  else if (t < k.k2) p = {...m(bagTop, hip, smooth(t, k.k1, k.k2)), open: 0};
  else if (t < k.p0) p = {...m(hip, {x: CHAIR.x0 - 41, y: CHAIR.seat - 116}, smooth(t, k.g0, k.p0)), open: 0};
  else if (t < k.p1) p = {x: chairX - 41, y: CHAIR.seat - 116, open: 0};
  else p = {...m({x: CHAIR.x1 - 41, y: CHAIR.seat - 116}, {x: CHAIR.x1 + 14, y: CHAIR.seat - 60}, smooth(t, k.p1, k.p2)), open: smooth(t, k.p1 + 0.05, k.p2)};
  void back0;
  return {p, chairX, k, carried: t >= k.k1 && t < k.k2, onHip: t >= k.k2};
};

const QueueScene: React.FC<{t: number; b: Record<string, number>; br: 'hook' | 'swipe' | 'hi'}> = ({t, b, br}) => {
  const hw = handWorld(t, b);
  const wu = smooth(t, b.coffeeTake + 0.1, b.left + 0.6);
  const pose: HerPose = br === 'hook' ? {front: true, smile: 0, nod: 0, phoneP: 1, flip: 0, bag: 0}
    : br === 'swipe' ? {front: false, smile: 0, nod: 0, phoneP: 1, flip: 0, bag: 0, cup: smooth(t, b.took, b.took + 0.15)}
    : {
      front: true, smile: 0.55 * smooth(t, b.tagHi, b.tagHi + 0.3) + 0.45 * smooth(t, b.flip + 0.2, b.flip + 0.5),
      nod: smooth(t, hw.k.p1, hw.k.p1 + 0.2) * (1 - smooth(t, hw.k.p1 + 0.5, hw.k.p1 + 0.8)) + smooth(t, b.neither, b.neither + 0.2) * (1 - smooth(t, b.neither + 0.7, b.neither + 1.0)),
      phoneP: t < b.flip ? lerp(1, 0.12, smooth(t, b.coffee, b.coffee + 0.4)) : lerp(0.12, 0.75, smooth(t, b.flip, b.flip + 0.2)) - 0.3 * smooth(t, b.flip + 0.5, b.flip + 0.8),
      flip: smooth(t, b.flip, b.flip + 0.25),
      hand: hw.p ? {...loc(hw.p.x, hw.p.y), open: hw.p.open} : null,
      bag: hw.onHip ? 1 : 0,
    };
  const chairX = br === 'hi' ? hw.chairX : CHAIR.x0;
  const bagOnChair = br !== 'hi' || t < hw.k.k1;
  const bagCarried = br === 'hi' && hw.carried && hw.p;
  const cz = 1.03 + 0.004 * t;
  const cup = br === 'hi' ? b.coffee : -1;
  return <g transform={`translate(0 -150) translate(540 1000) scale(${cz}) translate(-540 -1000)`}>
    <Queue t={t} turn={-10} raise={-10} smile={0} hideHer />
    <Table t={t} cupAt={br === 'hi' ? cup : -10} />
    <Chair x={chairX} />
    {bagOnChair && <Bag x={chairX + 10} y={CHAIR.seat - 42} />}
    {bagCarried && hw.p && <Bag x={hw.p.x + 6} y={hw.p.y + 46} rot={-6} />}
    <g transform={`translate(${br === 'swipe' ? -560 * wu : 0} ${br === 'swipe' && wu > 0 && wu < 1 ? -Math.abs(Math.sin(t * 10)) * 8 : 0})`}><HerFig pose={pose} t={t} /></g>
    {br === 'hi' && <g>
      {t >= b.youHi - 0.1 && t < b.coffee - 0.1 && <Bubble x={560} y={940} w={470} h={150} lines={['Hi. Also on my', 'last one.']} size={50} tail={{x: 600, y: 1130}} label="YOU" labelFill={C.cyan} age={t - (b.youHi - 0.1)} out={smooth(t, b.coffee - 0.25, b.coffee - 0.1)} />}
      {t >= b.neither - 0.05 && <Bubble x={520} y={790} w={480} h={100} lines={['Neither are you.']} size={50} tail={{x: 500, y: 925}} label="HER" labelFill={C.coral} age={t - (b.neither - 0.05)} />}
      {t >= hw.k.p1 + 0.05 && t < b.l6 - 0.05 && <Bubble x={520} y={790} w={480} h={100} lines={['Sit, if you like.']} size={50} tail={{x: 500, y: 925}} label="HER" labelFill={C.coral} age={t - (hw.k.p1 + 0.05)} />}
    </g>}
    {br === 'swipe' && <g>
      {t >= b.next && <g transform={`translate(498 686)`}>
        <path d="M-36 0 A36 30 0 0 1 36 0 Z" fill={C.gold} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
        <rect x={-44} y={0} width={88} height={12} rx={6} fill={C.gold} stroke={C.ink} strokeWidth={6} />
        <circle cy={-34} r={7} fill={C.ink} />
        {[-1, 1].map((s) => <path key={s} d={`M${s * 52} -28 L${s * 72} -40 M${s * 56} -10 L${s * 80} -12`} stroke={C.paper} strokeWidth={6} strokeLinecap="round" opacity={0.5 + 0.5 * Math.sin((t - b.next) * 40)} />)}
      </g>}
      {t >= b.next && <BubbleL x={716} y={590} w={270} h={100} text="NEXT" tail={{x: 690, y: 630}} age={t - b.next} />}
    </g>}
  </g>;
};

/** Barista bubble: tail on the left edge. */
const BubbleL: React.FC<{x: number; y: number; w: number; h: number; text: string; tail: {x: number; y: number}; age: number}> = ({x, y, w, h, text, tail, age}) => {
  const sc = 0.6 + 0.4 * Math.min(1, age / 0.12);
  return <g opacity={clamp(age / 0.05 + 0.2)} transform={`translate(${x} ${y + h / 2}) scale(${sc}) translate(${-x} ${-(y + h / 2)})`}>
    <rect x={x + 8} y={y + 8} width={w} height={h} rx={34} fill={C.ink} />
    <path d={`M${x + 4} ${y + h / 2 - 24} L${tail.x} ${tail.y} L${x + 4} ${y + h / 2 + 24} Z`} fill={C.paper} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
    <rect x={x} y={y} width={w} height={h} rx={34} fill={C.paper} stroke={C.ink} strokeWidth={6} />
    <rect x={x - 2} y={y + h / 2 - 20} width={10} height={40} fill={C.paper} />
    <text x={x + w / 2} y={y + h / 2 + 26} textAnchor="middle" fontFamily={F.anton} fontSize={78} letterSpacing={4} fill={C.ink}>{text}</text>
  </g>;
};

// ------------------------------------------------------------------------------------------ the show
export const Swipes2: React.FC<{hook?: Hook}> = ({hook = 'a'}) => {
  const frame = useCurrentFrame();
  const t = frame / SWIPES2_FPS;
  const T = TL[hook];
  const b = T.beats;
  const LINES = T.lines;
  const CH = React.useMemo(() => chunksOf(LINES, b.voteBoard + 0.2), [hook]);
  const cuts: {t: number; slide: boolean}[] = [
    {t: b.tagSwiped, slide: true}, {t: b.l3 - 0.28, slide: true}, {t: b.rewind + 0.5, slide: false},
    {t: b.l6 - 0.05, slide: true}, {t: b.l7 - 0.25, slide: true},
  ];
  const scenes: {k: 'Q' | 'P'; br?: 'hook' | 'swipe' | 'hi'; v?: 'match' | 'buzz'}[] = [
    {k: 'Q', br: 'hook'}, {k: 'P', v: 'match'}, {k: 'Q', br: 'swipe'}, {k: 'Q', br: 'hi'}, {k: 'P', v: 'buzz'}, {k: 'Q', br: 'hi'},
  ];
  const draw = (i: number, dy: number) => {
    const s = scenes[i];
    return <Svg key={i}><g transform={`translate(0 ${dy})`}>{s.k === 'Q' ? <QueueScene t={t} b={b} br={s.br!} /> : <PhoneScene t={t} b={b} v={s.v!} />}</g></Svg>;
  };
  let idx = 0, sliding = -1;
  cuts.forEach((c, j) => { if (t >= c.t + (c.slide ? D : 0)) idx = j + 1; else if (c.slide && t >= c.t && sliding < 0) sliding = j; });
  const su = sliding >= 0 ? smooth(t, cuts[sliding].t, cuts[sliding].t + D) : 0;
  const blur = Math.sin(Math.PI * su) * 7;

  const w2 = b.voteBoard;
  const inVote = t >= w2 + 0.27 && t < b.endcard;
  const inEnd = t >= b.endcard;

  const hookDur = b.bodyStart - 0.1;
  const hookWords = spec.hooks[hook].caption.split(' ').map((w, i, a) => ({text: w, start: 0.1 + (i * (hookDur - 0.1)) / a.length, end: 0.1 + ((i + 1) * (hookDur - 0.1)) / a.length}));
  const chunk = CH.find((c) => t >= c.start && t < c.end);
  const words = t < hookDur ? hookWords : chunk ? chunk.words : [];
  const M = b.maybe;
  const CAP_Y = 1195;
  const strips: {text: string; from: number; to: number; y: number}[] = [
    {text: "10 swipes a day · you're on your last", from: 0, to: hookDur, y: 520},
    {text: 'YOU SWIPED', from: b.tagSwiped, to: b.rewind + 0.2, y: 520},
    {text: 'YOU SAID HI', from: b.tagHi, to: b.coffee - 0.1, y: 520},
    {text: 'her chair · her invitation', from: M + 0.1, to: b.l6 - 0.05, y: 520},
  ];
  const clockText = t >= b.clock59 ? '5:59' : '5:58';
  const showClock = t >= b.buzz - 0.1 && t < w2 + 0.1;

  return <AbsoluteFill style={{background: C.ink}}>
    <Audio src={staticFile(`audio/swipes-ep2-${hook}-music.wav`)} volume={0.22} />
    <Audio src={staticFile(`audio/swipes-ep2-${hook}-room.wav`)} volume={0.5} />
    <Audio src={staticFile(`audio/swipes-ep2-${hook}-sfx.wav`)} volume={0.7} />
    <Sequence from={Math.round(T.hook.start * SWIPES2_FPS)}><Audio src={staticFile(T.hook.file)} /></Sequence>
    {LINES.map((l, i) => <Sequence key={i} from={Math.round(l.start * SWIPES2_FPS)}><Audio src={staticFile(l.file)} /></Sequence>)}
    {inEnd ? <EndCard age={t - b.endcard} label="PART 3 · A OR B" /> : inVote ? <>
      <Ground />
      <VoteBoard2 t={t} t0={w2 + 0.27} tA={b.cardA} tB={b.cardB} tComment={b.comment} />
      <Svg><CaptionBig words={words} t={t} y={CAP_Y} /></Svg>
    </> : <>
      <Ground />
      <AbsoluteFill style={{filter: blur > 0.5 ? `blur(${blur}px)` : undefined}}>
        {sliding >= 0 ? <>{draw(sliding, -su * 1920)}{draw(sliding + 1, (1 - su) * 1920)}</> : draw(idx, 0)}
      </AbsoluteFill>
      <Svg>
        <Hud counter={T.counter} t={t} redAtZero />
        <HudCoin t={t} at={b.swiped} x0={540} y0={880} />
        {showClock && <ClockChip text={clockText} age={t - (b.buzz - 0.1)} pulse={t >= b.clock59 ? Math.max(0, 1 - (t - b.clock59) / 0.3) : 0} />}
        {strips.map((s, i) => t >= s.from && t < s.to && <RuleStrip key={i} text={s.text} y={s.y} age={t - s.from} out={smooth(t, s.to - 0.12, s.to)} size={58} />)}
        {t >= b.ruleStamp && t < b.rewind - 0.02 && <StampBig y={1018} age={t - b.ruleStamp} out={smooth(t, b.rewind - 0.14, b.rewind - 0.02)} />}
        <CaptionBig words={words} t={t} y={CAP_Y} />
      </Svg>
    </>}
    {(t > b.rewind - 0.02 && t < b.rewind + 1.0) && <Svg><CoinRewind t={t} t0={b.rewind} /></Svg>}
    {(t > w2 - 0.52 && t < w2 + 0.7) && <Svg><CoinDrop t={t} t0={w2} /></Svg>}
  </AbsoluteFill>;
};
void easeOut; void Txt; void TABLE; void CHAIR;
