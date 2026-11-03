import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, easeOut, hold, lerp, smooth} from '../../lib/motion';
import {Key3, Plane, Space, cam3At} from '../../lib/space';
import {Line, mouthOf, speechOf} from '../../lib/speech';
import {MotionBlurWhen} from '../../lib/shots';
import {BUBBLE, Board, ChatPhone, Doll, DollDefs, Expr, Msg, Note, PH, PW, S, Who} from './collage';
import tlJson from '../groupchat-ep1.timeline.json';

// "The Group Chat Is Cooking", episode 1, "The Draft" (story account, season 1; STORIES.md).
// One collage world seen by a moving camera: the cork board, the phone in the middle, the three
// roommates as paper-doll cut-outs pinned around it. Dev asks the group chat for help, Bo and Nina
// argue, Sana texts first, Dev taps her chat by reflex and sends the roommates' mashup to her.
// Seen. Sana is typing.

export const GC1_FPS = 60;
type Chat = {from: Who; thread: 'roommates' | 'sana'; text: string; at: number};
const tl = tlJson as unknown as {lines: (Line & {speaker: string})[]; beats: Record<string, number>; chat: Chat[]; duration: number};
const B = tl.beats;
const LINES = tl.lines;
export const GC1_FRAMES = Math.ceil(tl.duration * GC1_FPS);
const mouth = mouthOf(LINES);
const speech = speechOf(LINES);

const At: React.FC<{z: number; noBlur?: boolean; children: React.ReactNode}> = ({z, noBlur, children}) =>
  <Plane z={z} noBlur={noBlur}><g transform={`translate(540 960) scale(${z / 1000}) translate(-540 -960)`}>{children}</g></Plane>;

const key = (t: number, x: number, y: number, z: number, rot = 0, subject = 1000, aperture = 4): Key3 => ({t, x, y, z, rot, focus: subject - z, aperture});

/** Who is speaking at t, and their mouth openness. */
const talking = (t: number, who: string) => {
  const l = LINES.find((x) => t >= x.start - 0.05 && t <= x.start + x.duration + 0.1);
  return l && l.speaker === who ? mouth(t) : 0;
};

const DEV_POS = {x: 205, y: 1250, s: 0.8}, BO_POS = {x: 880, y: 650, s: 0.74}, NINA_POS = {x: 180, y: 880, s: 0.74};
const PHONE = {x: 305, y: 330};

// ---------------------------------------------------------------------------------------------
// Time → story state.

const devExpr = (t: number): Expr => {
  const talk = talking(t, 'DEV');
  if (t >= B.ohno - 0.1) return {eyes: 'wide', mouth: 'o', brow: 1, hands: 'mouth', talk: 0};
  if (t >= B.vote) return {eyes: t > B.send - 0.2 && t < B.send + 0.6 ? 'closed' : 'open', mouth: 'flat', brow: 0.6, hands: 'phone', talk, look: 0.5};
  if (t >= B.draftHi - 0.2) return {eyes: 'open', mouth: t < B.saturday ? 'smile' : 'flat', brow: t < B.saturday ? 0 : 0.6, hands: 'phone', talk, look: 0.5, tilt: -3};
  if (t >= B.banner - 0.1) return {eyes: 'wide', mouth: 'o', brow: 1, hands: 'phone', talk};
  if (t >= B.help - 0.05 && t < B.help + 0.8) return {eyes: 'half', mouth: 'frown', brow: 0.8, hands: 'phone', talk};
  return {eyes: 'open', mouth: 'flat', brow: 0.5, hands: 'phone', talk, look: 0.5};
};

const boExpr = (t: number): Expr => {
  const talk = talking(t, 'BO');
  if (t >= B.thinks - 0.1 && t < B.ohno) return {mouth: 'grin', hands: 'thumbs', talk, look: -0.6};
  if (t >= B.say - 0.2 && t < B.e3 + 0.6) return {mouth: 'grin', hands: 'point', talk, tilt: 4 * Math.sin(t * 3)};
  if (t >= B.absolutely && t < B.e4 + 0.3) return {mouth: 'frown', brow: -0.6, talk, look: -0.8};
  return {mouth: 'smile', talk, look: -0.6};
};

const ninaExpr = (t: number): Expr => {
  const talk = talking(t, 'NINA');
  if (t >= B.draft + 0.1) return {eyes: 'wide', mouth: 'frown', brow: 1, talk, look: 0.7};
  if (t >= B.where - 0.3) return {eyes: 'open', mouth: 'flat', brow: 0.6, hands: 'phone', talk, look: 0.6};
  if (t >= B.thinks - 0.1) return {eyes: 'open', mouth: 'smile', hands: 'thumbs', talk, look: 0.6};
  if (t >= B.absolutely - 0.2 && t < B.e4 + 0.5) return {eyes: t > B.delete && t < B.delete + 0.6 ? 'roll' : 'half', mouth: 'flat', brow: -0.6, hands: 'cross', talk, tilt: -3};
  if (t >= B.say && t < B.absolutely - 0.2) return {eyes: 'half', mouth: 'flat', brow: -0.4, hands: 'cross', talk};
  return {eyes: 'open', mouth: 'smile', talk, look: 0.6};
};

const typedAt = (t: number, text: string, a: number, b: number) => (t >= a && t < b ? text.slice(0, Math.ceil(text.length * clamp((t - a) / (b - a - 0.1)))) : '');
const DRAFT = 'hi sana, ready to meet your future husband? coffee saturday?';

const phoneState = (t: number) => {
  const sana = t >= B.flip;
  const msgs: Msg[] = tl.chat.filter((c) => c.thread === (sana ? 'sana' : 'roommates')).map((c) => ({from: c.from, text: c.text, at: c.at}));
  let typed = '';
  if (!sana) {
    typed = typedAt(t, 'okay i\'m asking sana out. help', B.l2 + 0.1, B.help) || typedAt(t, 'i\'ll combine them', B.l5, B.combine);
  } else if (t < B.send) {
    typed = t >= B.e7 ? DRAFT : typedAt(t, DRAFT, B.draftHi - 0.1, B.e7);
  }
  const ninaPing = tl.chat.find((c) => c.from === 'NINA' && c.thread === 'roommates' && c.at > B.flip)!;
  const banner = !sana && t > B.banner - 0.2
    ? {from: 'SANA' as Who, text: 'hey dev! how was your day?', k: clamp((t - B.banner + 0.2) / 0.25)}
    : sana && t > ninaPing.at - 0.15 ? {from: 'NINA' as Who, text: ninaPing.text, k: hold(t, ninaPing.at - 0.15, ninaPing.at + 0.1, B.ohno + 0.9, B.ohno + 1.2)} : undefined;
  return {
    thread: (sana ? 'sana' : 'roommates') as 'sana' | 'roommates', msgs: sana ? msgs.filter((m) => m.from === 'SANA' || t >= m.at) : msgs, typed, banner,
    status: sana && t >= B.send + 0.2 ? (t >= B.draft ? 'Seen' : 'Delivered') : undefined,
    dots: sana && t >= B.dots - 0.3,
    headerMark: easeOut(t, B.thinks, B.groupchat + 0.4) * (t < B.vote + 0.3 ? 1 : 0),
  };
};

// ---------------------------------------------------------------------------------------------

const World: React.FC<{t: number}> = ({t}) => {
  const p = phoneState(t);
  const bob = (ph: number) => Math.sin(t * 2.2 + ph) * 4;
  const doll = (who: 'DEV' | 'BO' | 'NINA', pos: {x: number; y: number; s: number}, e: Expr, ph: number, tape: number) =>
    <g transform={`translate(${pos.x} ${pos.y + bob(ph)}) scale(${pos.s}) rotate(${Math.sin(t * 1.3 + ph) * 1.2})`}><Doll who={who} e={e} t={t} tape={tape} /></g>;
  return <>
    <At z={1500}><Board t={t} /></At>
    <Plane z={1000}><g transform={`translate(${PHONE.x} ${PHONE.y}) rotate(-1.5 ${PW / 2} ${PH / 2})`}>
      <ChatPhone t={t} thread={p.thread} msgs={p.msgs} typed={p.typed} banner={p.banner} status={p.status} dots={p.dots} headerMark={p.headerMark} />
    </g></Plane>
    <Plane z={900}><DollDefs />
      {doll('BO', BO_POS, boExpr(t), 1, 6)}
      {doll('NINA', NINA_POS, ninaExpr(t), 2, -10)}
      {doll('DEV', DEV_POS, devExpr(t), 0, -4)}
    </Plane>
  </>;
};

const CAM: Key3[] = [
  key(0, 540, 830, -20), key(B.l2 - 0.3, 540, 820, 40),
  key(B.l2 + 0.2, 400, 960, 200), key(B.help + 0.3, 410, 950, 220),
  key(B.say - 0.1, 800, 600, 300), key(B.e3 + 0.1, 810, 610, 320),
  key(B.absolutely - 0.2, 330, 780, 330), key(B.e4 + 0.1, 320, 790, 350),
  key(B.l5 + 0.1, 540, 820, 250),
  key(B.banner - 0.1, 540, 620, 420), key(B.flip + 0.6, 540, 640, 430),
  key(B.draftHi - 0.1, 540, 960, 400), key(B.e7, 545, 960, 420),
  key(B.thinks - 0.1, 540, 820, 130), key(B.e8, 540, 820, 110),
  key(B.vote - 0.1, 540, 900, 320), key(B.send + 0.4, 540, 880, 340),
  key(B.where - 0.2, 400, 780, 260), key(B.draft + 0.3, 420, 790, 280),
  key(B.ohno - 0.15, 230, 1080, 480), key(B.e11 + 0.1, 235, 1075, 500),
  key(B.dots - 0.25, 540, 960, 420), key(B.end, 540, 980, 480),
];

/** The send swoosh: the drafted bubble flies off the top-right corner with a trail. */
const Swoosh: React.FC<{t: number}> = ({t}) => {
  const x = clamp((t - B.send + 0.05) / 0.45);
  if (x <= 0 || x >= 1) return null;
  const e = x * x;
  return <AbsoluteFill><svg width={1080} height={1920}>
    {[0.12, 0.06, 0].map((lag, i) => { const k = clamp(e - lag);
      return <g key={i} transform={`translate(${lerp(540, 1150, k)} ${lerp(1020, 160, k)}) rotate(${-20 * k}) scale(${1 - 0.5 * k})`} opacity={i === 2 ? 1 : 0.25}>
        <rect x={-150} y={-40} width={300} height={80} rx={30} fill={BUBBLE.DEV} stroke="#fff" strokeWidth={6} /></g>; })}
  </svg></AbsoluteFill>;
};

/** Captions for spoken lines that don't land as chat bubbles (narrator, Dev thinking aloud). */
const CAPTION_LINES = [1, 8, 9, 11, 12];
const Captions: React.FC<{t: number}> = ({t}) => {
  const i = LINES.findIndex((l, n) => CAPTION_LINES.includes(n + 1) && t >= l.start - 0.05 && t < l.start + l.duration + 0.25);
  if (i < 0) return null;
  const l = LINES[i];
  const k = easeOut(t, l.start - 0.05, l.start + 0.15);
  const who = l.speaker === 'NARRATOR' ? '' : `${l.speaker[0]}${l.speaker.slice(1).toLowerCase()}: `;
  return <AbsoluteFill><svg width={1080} height={1920}><Note x={540} y={1215} text={who + l.text} size={46} max={30} rot={i % 2 ? 1.5 : -1.5} k={k}
    fill={l.speaker === 'DEV' ? BUBBLE.DEV : S.paper} /></svg></AbsoluteFill>;
};

export const GroupChat1: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  // Cold open: a flash-forward to the end (the text sent to Sana, Seen, typing), then a rewind.
  const cold = t < B.l1 - 0.1;
  const tw = cold ? B.dots + 1.2 : t;
  const cam = cold ? cam3At([key(0, 540, 900, 380), key(B.l1, 540, 880, 300)], t) : cam3At(CAM, t);
  const rewind = cold && t > B.l1 - 0.75;
  const musicVol = (f: number) => lerp(0.42, 0.2, speech(f / fps));
  const ctx = smooth(t, B.l1 - 0.1, B.l1 + 0.1) * (1 - smooth(t, B.e1 - 0.1, B.e1 + 0.2));
  const tbc = smooth(t, B.e12 + 0.5, B.e12 + 0.8);
  const fast = rewind || Math.abs(t - B.flip) < 0.12 || (t > B.send - 0.1 && t < B.send + 0.45) || Math.abs(t - (B.ohno - 0.15)) < 0.15;
  return <AbsoluteFill style={{background: S.wall}}>
    <Audio src={staticFile('audio/groupchat-ep1-music.wav')} volume={musicVol} />
    <Audio src={staticFile('audio/groupchat-ep1-room.wav')} volume={0.4} />
    <Audio src={staticFile('audio/groupchat-ep1-sfx.wav')} volume={0.8} />
    {LINES.map((l, i) => <Sequence key={i} from={Math.round(l.start * fps)}><Audio src={staticFile(l.file)} /></Sequence>)}
    <MotionBlurWhen fast={fast}>
      <Space cam={cam} id="gc1" bg={S.wall}><World t={tw} /></Space>
    </MotionBlurWhen>
    <Swoosh t={t} />
    <AbsoluteFill><svg width={1080} height={1920}>
      <Note x={540} y={420} text={'Dev texts Sana tonight. His roommates are "helping."'} size={56} max={22} k={ctx} rot={-2} />
      <Note x={540} y={440} text="to be continued…" size={72} k={tbc} rot={-3} fill={S.butter} />
      {cold && <Note x={540} y={400} text="How did THIS get sent to Sana?" size={60} max={18} k={1 - smooth(t, B.l1 - 0.6, B.l1 - 0.3)} rot={-2} fill={S.butter} />}
      {rewind && <g opacity={0.9}><rect width={1080} height={1920} fill={S.ink} opacity={0.25} />
        {Array.from({length: 12}, (_, i) => <rect key={i} x={0} y={((i * 170 + t * 4000) % 1920)} width={1080} height={10} fill="#fff" opacity={0.25} />)}
        <text x={540} y={980} textAnchor="middle" fontFamily="'Avenir Next', 'Nunito Sans', sans-serif" fontWeight={900} fontSize={120} fill="#fff">◀◀ REWIND</text></g>}
    </svg></AbsoluteFill>
    <Captions t={t} />
  </AbsoluteFill>;
};
