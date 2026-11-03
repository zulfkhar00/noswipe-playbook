import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, easeOut, hold, lerp, smooth} from '../../lib/motion';
import {Key3, Plane, Space, cam3At} from '../../lib/space';
import {Line, mouthOf, speechOf} from '../../lib/speech';
import {MotionBlurWhen} from '../../lib/shots';
import {BUBBLE, Board, ChatPhone, Doll, DollDefs, Expr, Msg, Note, PH, PW, S, Who} from './collage';
import tlJson from '../groupchat-ep2.timeline.json';

// "The Group Chat Is Cooking", episode 2, "Seen". Sana answers the mistaken text kindly ("haha,
// who wrote this? also, yes to coffee"). Nina wants to write the reply; Bo snatches Dev's phone
// and, typing as Dev, books a "surprise" for Saturday at seven. Sana's in. Nobody has a plan.
// Same collage world and camera grammar as episode 1.

export const GC2_FPS = 60;
type Chat = {from: Who; thread: 'roommates' | 'sana'; text: string; at: number};
const tl = tlJson as unknown as {lines: (Line & {speaker: string})[]; beats: Record<string, number>; chat: Chat[]; duration: number};
const B = tl.beats;
const LINES = tl.lines;
export const GC2_FRAMES = Math.ceil(tl.duration * GC2_FPS);
const mouth = mouthOf(LINES);
const speech = speechOf(LINES);

const At: React.FC<{z: number; noBlur?: boolean; children: React.ReactNode}> = ({z, noBlur, children}) =>
  <Plane z={z} noBlur={noBlur}><g transform={`translate(540 960) scale(${z / 1000}) translate(-540 -960)`}>{children}</g></Plane>;

const key = (t: number, x: number, y: number, z: number, rot = 0, subject = 1000, aperture = 4): Key3 => ({t, x, y, z, rot, focus: subject - z, aperture});

const talking = (t: number, who: string) => {
  const l = LINES.find((x) => t >= x.start - 0.05 && t <= x.start + x.duration + 0.1);
  return l && l.speaker === who ? mouth(t) : 0;
};

const DEV_POS = {x: 205, y: 1250, s: 0.8}, BO_POS = {x: 880, y: 650, s: 0.74}, NINA_POS = {x: 180, y: 880, s: 0.74};
const PHONE = {x: 305, y: 330};
const GRAB = [B.grab - 0.05, B.grab + 0.4] as const;

// ---------------------------------------------------------------------------------------------
// Time → story state.

const devExpr = (t: number): Expr => {
  const talk = talking(t, 'DEV');
  if (t >= B.whatsurprise - 0.1) return {eyes: 'wide', mouth: 'frown', brow: 1, hands: 'point', talk, look: 0.8};
  if (t >= B.sevenwhat - 0.1) return {eyes: 'wide', mouth: 'o', brow: 1, hands: 'mouth', talk};
  if (t >= B.bono - 0.1) return {eyes: 'wide', mouth: 'o', brow: 0.8, hands: 'point', talk, look: 0.8};
  if (t >= GRAB[0]) return {eyes: 'wide', mouth: 'o', brow: 1, talk, look: 0.8};
  if (t >= B.said - 0.1) return {eyes: 'wide', mouth: 'frown', brow: 1, hands: 'mouth', talk};
  return {eyes: 'wide', mouth: 'o', brow: 0.8, hands: 'phone', talk, look: 0.5};
};

const boExpr = (t: number): Expr => {
  const talk = talking(t, 'BO');
  if (t >= B.relax - 0.1) return {mouth: 'grin', eyes: 'closed', hands: 'thumbs', talk};
  if (t >= GRAB[1]) return {mouth: 'grin', hands: 'phone', talk, look: -0.2, tilt: 3 * Math.sin(t * 4)};
  if (t >= B.tooslow - 0.3) return {mouth: 'grin', hands: 'point', talk, look: -0.6};
  if (t >= B.nobody) return {mouth: 'flat', brow: -0.5, talk, look: -0.8};
  return {mouth: 'o', eyes: 'wide', talk, look: -0.6};
};

const ninaExpr = (t: number): Expr => {
  const talk = talking(t, 'NINA');
  if (t >= B.sat7 - 0.1) return {eyes: 'roll', mouth: 'flat', brow: -0.5, hands: 'cross', talk};
  if (t >= GRAB[0]) return {eyes: 'wide', mouth: 'o', brow: 1, talk, look: 0.7};
  if (t >= B.nobody - 0.2) return {eyes: 'half', mouth: 'flat', brow: -0.4, hands: 'cross', talk, tilt: -3};
  return {eyes: 'wide', mouth: 'o', brow: 0.6, talk, look: 0.6};
};

const BOMSG = 'forgive the chaos. saturday, seven. i\'m planning a surprise.';
const typedAt = (t: number, text: string, a: number, b: number) => (t >= a && t < b ? text.slice(0, Math.ceil(text.length * clamp((t - a) / (b - a - 0.15)))) : '');

const phoneState = (t: number) => {
  const sent = tl.chat.find((c) => c.from === 'DEV')!.at;
  const msgs: Msg[] = [{from: 'SANA', text: 'hey dev! how was your day?', at: -10},
    {from: 'DEV', text: 'hi sana, ready to meet your future husband? coffee saturday?', at: -10},
    ...tl.chat.filter((c) => c.thread === 'sana').map((c) => ({from: c.from, text: c.text, at: c.at}))];
  const nina = tl.chat.find((c) => c.from === 'NINA')!, bo = tl.chat.find((c) => c.from === 'BO')!;
  const banner = t >= bo.at - 0.15 ? {from: 'BO' as Who, text: bo.text, k: hold(t, bo.at - 0.15, bo.at + 0.1, B.grab + 0.6, B.grab + 0.9)}
    : t >= nina.at - 0.15 ? {from: 'NINA' as Who, text: nina.text, k: hold(t, nina.at - 0.15, nina.at + 0.1, bo.at - 0.4, bo.at - 0.15)} : undefined;
  const afterReply = t >= B.haha;
  return {
    msgs, banner,
    typed: typedAt(t, BOMSG, B.forgive - 0.1, sent),
    status: t >= sent + 0.2 ? (t >= B.ooh - 0.3 ? 'Seen' : 'Delivered') : t < sent ? (t < B.haha ? 'Seen' : undefined) : undefined,
    dots: t < B.haha - 0.1 || (t >= B.ooh - 1.1 && t < B.ooh - 0.05),
    mark: {fromEnd: afterReply ? 1 : 0, k: 1 - smooth(t, B.yes, B.yes + 0.3)},
  };
};

// ---------------------------------------------------------------------------------------------

const World: React.FC<{t: number}> = ({t}) => {
  const p = phoneState(t);
  const bob = (ph: number) => Math.sin(t * 2.2 + ph) * 4;
  const doll = (who: 'DEV' | 'BO' | 'NINA', pos: {x: number; y: number; s: number}, e: Expr, ph: number, tape: number) =>
    <g transform={`translate(${pos.x} ${pos.y + bob(ph)}) scale(${pos.s}) rotate(${Math.sin(t * 1.3 + ph) * 1.2})`}><Doll who={who} e={e} t={t} tape={tape} /></g>;
  // The snatched phone: an arc from Dev's hands to Bo's.
  const g = clamp((t - GRAB[0]) / (GRAB[1] - GRAB[0]));
  const from = [DEV_POS.x, DEV_POS.y - 90 * DEV_POS.s], to = [BO_POS.x, BO_POS.y - 90 * BO_POS.s];
  const fx = lerp(from[0], to[0], g), fy = lerp(from[1], to[1], g) - 260 * Math.sin(Math.PI * g);
  return <>
    <At z={1500}><Board t={t} /></At>
    <Plane z={1000}><g transform={`translate(${PHONE.x} ${PHONE.y}) rotate(-1.5 ${PW / 2} ${PH / 2})`}>
      <ChatPhone t={t} thread="sana" msgs={p.msgs} typed={p.typed} typer="BO" banner={p.banner} status={p.status} dots={p.dots} mark={p.mark} />
    </g></Plane>
    <Plane z={900}><DollDefs />
      {doll('BO', BO_POS, boExpr(t), 1, 6)}
      {doll('NINA', NINA_POS, ninaExpr(t), 2, -10)}
      {doll('DEV', DEV_POS, devExpr(t), 0, -4)}
      {g > 0 && g < 1 && <g transform={`translate(${fx} ${fy}) rotate(${720 * g})`}>
        <rect x={-40} y={-65} width={80} height={130} rx={14} fill={S.ink} /><rect x={-32} y={-57} width={64} height={110} rx={8} fill="#C9D3FF" /></g>}
    </Plane>
  </>;
};

const CAM: Key3[] = [
  key(0, 540, 760, 380), key(B.haha + 0.6, 545, 780, 400),
  key(B.said - 0.3, 230, 1080, 450), key(B.e3 + 0.1, 235, 1075, 470),
  key(B.nobody - 0.3, 330, 790, 330), key(B.e4 + 0.1, 320, 800, 350),
  key(B.tooslow - 0.4, 800, 610, 300), key(B.grab - 0.15, 805, 615, 310),
  key(B.grab + 0.2, 520, 860, 60), key(B.bono + 0.8, 520, 860, 80),
  key(B.botypes - 0.4, 700, 700, 220), key(B.forgive - 0.3, 700, 700, 240),
  key(B.forgive + 0.2, 540, 960, 400), key(B.surprise + 0.7, 545, 960, 420),
  key(B.sevenwhat - 0.2, 230, 1080, 450), key(B.e9 + 0.05, 235, 1075, 470),
  key(B.relax - 0.2, 800, 610, 300), key(B.e10 + 0.1, 805, 615, 320),
  key(B.ooh - 0.6, 540, 820, 380), key(B.e11 + 0.1, 545, 820, 400),
  key(B.whatsurprise - 0.2, 540, 860, 100), key(B.sat7, 540, 840, 120),
  key(B.end, 540, 830, 180),
];

const CAPTION_LINES = [1, 3, 4, 5, 6, 7, 9, 10, 12, 13];
const Captions: React.FC<{t: number}> = ({t}) => {
  const i = LINES.findIndex((l, n) => CAPTION_LINES.includes(n + 1) && t >= l.start - 0.05 && t < l.start + l.duration + 0.25);
  if (i < 0) return null;
  const l = LINES[i];
  const k = easeOut(t, l.start - 0.05, l.start + 0.15);
  const who = l.speaker === 'NARRATOR' ? '' : `${l.speaker[0]}${l.speaker.slice(1).toLowerCase()}: `;
  const fill = l.speaker === 'NARRATOR' ? S.paper : BUBBLE[l.speaker as Who];
  return <AbsoluteFill><svg width={1080} height={1920}><Note x={540} y={1215} text={who + l.text} size={46} max={30} rot={i % 2 ? 1.5 : -1.5} k={k} fill={fill} /></svg></AbsoluteFill>;
};

/** The swoosh when Bo hits send. */
const Swoosh: React.FC<{t: number; at: number}> = ({t, at}) => {
  const x = clamp((t - at + 0.05) / 0.45);
  if (x <= 0 || x >= 1) return null;
  const e = x * x;
  return <AbsoluteFill><svg width={1080} height={1920}>
    {[0.12, 0.06, 0].map((lag, i) => { const k = clamp(e - lag);
      return <g key={i} transform={`translate(${lerp(540, 1150, k)} ${lerp(1020, 160, k)}) rotate(${-20 * k}) scale(${1 - 0.5 * k})`} opacity={i === 2 ? 1 : 0.25}>
        <rect x={-150} y={-40} width={300} height={80} rx={30} fill={BUBBLE.BO} stroke="#fff" strokeWidth={6} /></g>; })}
  </svg></AbsoluteFill>;
};

export const GroupChat2: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const cam = cam3At(CAM, t);
  const sent = tl.chat.find((c) => c.from === 'DEV')!.at;
  const musicVol = (f: number) => lerp(0.42, 0.2, speech(f / fps));
  const ctx = 1 - smooth(t, B.e1 - 0.1, B.e1 + 0.2);
  const plan = smooth(t, B.sat7, B.sat7 + 0.2);
  const ring = easeOut(t, B.plan - 0.2, B.plan + 0.4);
  const tbc = smooth(t, B.e13 + 0.6, B.e13 + 0.9);
  const fast = (t > GRAB[0] && t < GRAB[1]) || (t > sent - 0.1 && t < sent + 0.45);
  return <AbsoluteFill style={{background: S.wall}}>
    <Audio src={staticFile('audio/groupchat-ep2-music.wav')} volume={musicVol} />
    <Audio src={staticFile('audio/groupchat-ep2-room.wav')} volume={0.4} />
    <Audio src={staticFile('audio/groupchat-ep2-sfx.wav')} volume={0.8} />
    {LINES.map((l, i) => <Sequence key={i} from={Math.round(l.start * fps)}><Audio src={staticFile(l.file)} /></Sequence>)}
    <MotionBlurWhen fast={fast}>
      <Space cam={cam} id="gc2" bg={S.wall}><World t={t} /></Space>
    </MotionBlurWhen>
    <Swoosh t={t} at={sent} />
    <AbsoluteFill><svg width={1080} height={1920}>
      <Note x={540} y={410} text="Dev's text went to Sana. She just answered." size={56} max={22} k={ctx} rot={-2} />
      {plan > 0 && <g>
        <Note x={540} y={620} text="SAT 7:00 — ???" size={96} max={20} k={plan} rot={-4} fill={S.butter} />
        {ring > 0 && <ellipse cx={720} cy={630} rx={130} ry={80} fill="none" stroke={S.red} strokeWidth={10} strokeLinecap="round"
          strokeDasharray={700} strokeDashoffset={700 * (1 - ring)} transform="rotate(-6 720 630)" />}
      </g>}
      <Note x={540} y={420} text="to be continued…" size={72} k={tbc} rot={-3} fill={S.butter} />
    </svg></AbsoluteFill>
    <Captions t={t} />
  </AbsoluteFill>;
};
