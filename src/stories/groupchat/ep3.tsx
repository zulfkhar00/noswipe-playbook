import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, easeOut, lerp, smooth, springIn} from '../../lib/motion';
import {Key3, Plane, Space, cam3At} from '../../lib/space';
import {Line, mouthOf, speechOf} from '../../lib/speech';
import {MotionBlurWhen} from '../../lib/shots';
import {BUBBLE, Board, ChatPhone, Doll, DollDefs, Expr, Msg, Note, PH, PW, S, Who} from './collage';
import tlJson from '../groupchat-ep3.timeline.json';

// "The Group Chat Is Cooking", episode 3, "The Surprise". Bo's plan for Saturday grows on the
// cork board (entrance violins, a four-page speech, a cape) and Nina stamps a red X on each. Dev
// rehearses "prepared remarks" at a paper microphone and doesn't sound like himself. Then Sana
// asks: "are you the one writing these?" Dev starts to type, then stops.
// The board is wider this episode: Bo's plan has its own corner to the right of the phone.

export const GC3_FPS = 60;
type Chat = {from: Who; thread: 'roommates' | 'sana'; text: string; at: number};
const tl = tlJson as unknown as {lines: (Line & {speaker: string})[]; beats: Record<string, number>; chat: Chat[]; duration: number};
const B = tl.beats;
const LINES = tl.lines;
export const GC3_FRAMES = Math.ceil(tl.duration * GC3_FPS);
const mouth = mouthOf(LINES);
const speech = speechOf(LINES);

const At: React.FC<{z: number; noBlur?: boolean; children: React.ReactNode}> = ({z, noBlur, children}) =>
  <Plane z={z} noBlur={noBlur}><g transform={`translate(540 960) scale(${z / 1000}) translate(-540 -960)`}>{children}</g></Plane>;

const key = (t: number, x: number, y: number, z: number, rot = 0, subject = 1000, aperture = 4): Key3 => ({t, x, y, z, rot, focus: subject - z, aperture});

const talking = (t: number, who: string) => {
  const l = LINES.find((x) => t >= x.start - 0.05 && t <= x.start + x.duration + 0.1);
  return l && l.speaker === who ? mouth(t) : 0;
};

const DEV_POS = {x: 205, y: 1250, s: 0.8}, BO_POS = {x: 1290, y: 1240, s: 0.78}, NINA_POS = {x: 1770, y: 1240, s: 0.78};
const PHONE = {x: 305, y: 330};

// Bo's plan notes, and the word each one gets vetoed on.
const PLAN = [
  {text: 'ENTRANCE MUSIC 🎻', x: 1330, y: 560, rot: -5, at: B.step1, veto: B.veto_music},
  {text: 'BIG SPEECH (4 pages)', x: 1730, y: 580, rot: 4, at: B.step2, veto: B.veto_speech},
  {text: 'CAPE', x: 1420, y: 830, rot: -3, at: B.step3, veto: B.veto_cape},
];

// ---------------------------------------------------------------------------------------------

const devExpr = (t: number): Expr => {
  const talk = talking(t, 'DEV');
  if (t >= B.type - 0.3) return {eyes: 'half', mouth: 'flat', brow: 0.7, hands: 'phone', look: 0.4};
  if (t >= B.banner - 0.2) return {eyes: 'wide', mouth: 'o', brow: 1, hands: 'phone', talk};
  if (t >= B.evenme - 0.2) return {eyes: 'half', mouth: 'frown', brow: 0.8, talk, look: -0.3};
  if (t >= B.evening - 0.3) return {eyes: 'open', mouth: 'flat', brow: -0.3, hands: 'phone', talk, tilt: 0};
  if (t >= B.cape_on - 0.1 && t < B.veto_cape + 0.3) return {eyes: 'wide', mouth: 'flat', brow: 0.5, talk};
  return {eyes: 'open', mouth: 'flat', brow: 0.5, hands: 'phone', talk, look: 0.5};
};

const boExpr = (t: number): Expr => {
  const talk = talking(t, 'BO');
  if (t >= B.voicemail - 0.2 && t < B.banner) return {mouth: 'grin', eyes: 'closed', hands: 'thumbs', talk};
  if (t < B.voicemail) return {mouth: 'grin', hands: 'point', talk, look: 0.3, tilt: 3 * Math.sin(t * 3)};
  return {mouth: 'o', eyes: 'wide', talk, look: -0.6};
};

const ninaExpr = (t: number): Expr => {
  const talk = talking(t, 'NINA');
  if (t >= B.banner - 0.2) return {eyes: 'wide', mouth: 'o', brow: 0.8, talk, look: -0.7};
  const roll = PLAN.some((p) => t > p.veto - 0.6 && t < p.veto + 0.2);
  return {eyes: roll ? 'roll' : 'half', mouth: 'flat', brow: -0.5, hands: 'cross', talk, look: -0.6};
};

const DRAFT = 'honestly, ';
const phoneState = (t: number) => {
  const sana = t >= B.banner + 0.25;
  const roommates: Msg[] = [{from: 'BO', text: 'SURPRISE PLAN 🔥🔥', at: -10}, {from: 'NINA', text: 'Oh no.', at: -10},
    ...tl.chat.filter((c) => c.thread === 'roommates').map((c) => ({from: c.from, text: c.text, at: c.at}))];
  const sanaMsgs: Msg[] = [{from: 'DEV', text: 'forgive the chaos. saturday, seven. i\'m planning a surprise.', at: -10}, {from: 'SANA', text: 'ooh, a surprise! i\'ll be there.', at: -10},
    ...tl.chat.filter((c) => c.thread === 'sana').map((c) => ({from: c.from, text: c.text, at: c.at}))];
  const sanaMsg = tl.chat.find((c) => c.from === 'SANA')!;
  let typed = '';
  if (t >= B.type + 0.1 && t < B.stops + 0.1) typed = DRAFT.slice(0, Math.ceil(DRAFT.length * clamp((t - B.type - 0.1) / 0.7)));
  else if (t >= B.stops + 0.1 && t < B.stops + 0.6) typed = DRAFT.slice(0, Math.floor(DRAFT.length * (1 - clamp((t - B.stops - 0.1) / 0.45))));
  return {
    thread: (sana ? 'sana' : 'roommates') as 'sana' | 'roommates', msgs: sana ? sanaMsgs : roommates, typed,
    banner: !sana && t > sanaMsg.at - 0.25 ? {from: 'SANA' as Who, text: sanaMsg.text, k: clamp((t - sanaMsg.at + 0.25) / 0.25)} : undefined,
    mark: {fromEnd: 0, k: easeOut(t, B.writing, B.writing + 0.6)},
  };
};

// ---------------------------------------------------------------------------------------------

const Stamp: React.FC<{k: number}> = ({k}) => k <= 0 ? null : <g transform={`scale(${1 + 1.2 * (1 - Math.min(1, k))}) rotate(-8)`} opacity={Math.min(1, k * 2)}>
  <path d="M -110 -80 L 110 80 M 110 -80 L -110 80" stroke={S.red} strokeWidth={30} strokeLinecap="round" />
</g>;

const Cape: React.FC<{k: number; off: number}> = ({k, off}) => k <= 0 ? null : <g transform={`translate(0 ${-600 * off}) rotate(${-30 * off})`} opacity={1 - off}>
  <path d={`M -150 -170 Q 0 -200 150 -170 L ${190 + 10 * Math.sin(k * 20)} 40 Q 0 70 ${-190 - 10 * Math.sin(k * 20)} 40 Z`} fill={S.red} />
  <path d="M -150 -170 Q 0 -200 150 -170 L 150 -150 Q 0 -178 -150 -150 Z" fill="#B8352B" />
</g>;

const Mic: React.FC = () => <g>
  <rect x={-6} y={-30} width={12} height={240} fill={S.ink} />
  <ellipse cx={0} cy={210} rx={70} ry={14} fill={S.ink} />
  <rect x={-30} y={-110} width={60} height={90} rx={30} fill="#C9CEDF" stroke="#fff" strokeWidth={6} />
  {[0, 1, 2].map((i) => <line key={i} x1={-22} x2={22} y1={-90 + i * 22} y2={-90 + i * 22} stroke="#8A90A8" strokeWidth={4} />)}
</g>;

const World: React.FC<{t: number}> = ({t}) => {
  const p = phoneState(t);
  const bob = (ph: number) => Math.sin(t * 2.2 + ph) * 4;
  const doll = (who: 'DEV' | 'BO' | 'NINA', pos: {x: number; y: number; s: number}, e: Expr, ph: number, tape: number) =>
    <g transform={`translate(${pos.x} ${pos.y + bob(ph)}) scale(${pos.s}) rotate(${Math.sin(t * 1.3 + ph) * 1.2})`}><Doll who={who} e={e} t={t} tape={tape} /></g>;
  const cape = smooth(t, B.cape_on - 0.05, B.cape_on + 0.15);
  const capeOff = smooth(t, B.veto_cape + 0.1, B.veto_cape + 0.5);
  const mic = smooth(t, B.evening - 0.4, B.evening - 0.1) * (1 - smooth(t, B.banner - 0.4, B.banner - 0.1));
  return <>
    <At z={1500}><Board t={t} wide /></At>
    <Plane z={1000}>
      <g transform={`translate(${PHONE.x} ${PHONE.y}) rotate(-1.5 ${PW / 2} ${PH / 2})`}>
        <ChatPhone t={t} thread={p.thread} msgs={p.msgs} typed={p.typed} banner={p.banner} mark={p.mark} />
      </g>
      {/* Bo's plan, pinned to the board, with Nina's red X stamps. */}
      <Note x={1540} y={330} text="SAT 7:00 — ???" size={48} rot={3} fill={S.butter} />
      {PLAN.map((n, i) => <g key={i}>
        <Note x={n.x} y={n.y} text={n.text} size={50} max={9} rot={n.rot} k={t >= n.at - 0.6 ? 1 : 0.9} />
        {i === 1 && t > B.pages - 0.2 && <path d={`M ${n.x - 120} ${n.y + 70} L ${n.x - 120} ${n.y + 70 + 260 * easeOut(t, B.pages - 0.2, B.pages + 0.5)} L ${n.x + 120} ${n.y + 70 + 260 * easeOut(t, B.pages - 0.2, B.pages + 0.5)} L ${n.x + 120} ${n.y + 70} Z`}
          fill={S.paper} stroke="#E6DDC8" strokeWidth={3} />}
        {i === 1 && t > B.pages - 0.2 && Array.from({length: Math.floor(9 * easeOut(t, B.pages - 0.2, B.pages + 0.5))}, (_, j) =>
          <line key={j} x1={n.x - 100} x2={n.x + 100 - (j % 3) * 30} y1={n.y + 100 + j * 26} y2={n.y + 100 + j * 26} stroke={S.inkSoft} strokeWidth={6} strokeLinecap="round" opacity={0.6} />)}
        <g transform={`translate(${n.x} ${n.y})`}><Stamp k={springIn((t - n.veto) * 30, 0, 7)} /></g>
      </g>)}
    </Plane>
    <Plane z={900}><DollDefs />
      {doll('BO', BO_POS, boExpr(t), 1, 6)}
      {doll('NINA', NINA_POS, ninaExpr(t), 2, -10)}
      <g transform={`translate(${DEV_POS.x} ${DEV_POS.y - 120})`}><Cape k={cape} off={capeOff} /></g>
      {doll('DEV', DEV_POS, devExpr(t), 0, -4)}
      {mic > 0 && <g transform={`translate(${DEV_POS.x + 210} ${DEV_POS.y - 60 + 200 * (1 - mic)})`} opacity={mic}><Mic /></g>}
    </Plane>
  </>;
};

const CAM: Key3[] = [
  key(0, 1530, 740, 0), key(B.step1 - 0.4, 1520, 740, 60),
  key(B.step1, 1360, 800, 250), key(B.violins + 0.3, 1350, 800, 270),
  key(B.no1 - 0.1, 1560, 820, 110), key(B.veto_music + 0.4, 1570, 820, 130),
  key(B.step2, 1690, 760, 260), key(B.pages + 0.5, 1690, 780, 270),
  key(B.veto_speech - 0.7, 1720, 880, 240), key(B.veto_speech + 0.4, 1720, 880, 250),
  key(B.step3, 1520, 860, 300), key(B.cape_on - 0.15, 1520, 860, 310),
  key(B.cape_on + 0.1, 230, 1160, 380), key(B.absolutely - 0.25, 235, 1160, 390),
  key(B.absolutely, 1640, 920, 220), key(B.veto_cape + 0.5, 1640, 920, 230),
  key(B.evening - 0.3, 420, 960, 230), key(B.remarks + 0.4, 420, 960, 250),
  key(B.voicemail - 0.5, 1530, 960, 140), key(B.voicemail + 0.6, 1530, 960, 150),
  key(B.evenme - 0.2, 230, 1080, 450), key(B.e10 + 0.1, 235, 1075, 470),
  key(B.banner - 0.3, 540, 760, 380), key(B.writing + 0.5, 540, 780, 400),
  key(B.writing + 0.9, 230, 1080, 470), key(B.type - 0.35, 232, 1075, 490),
  key(B.type - 0.05, 540, 950, 420), key(B.end, 540, 960, 470),
];

const CAPTION_LINES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12];
const Captions: React.FC<{t: number}> = ({t}) => {
  const i = LINES.findIndex((l, n) => CAPTION_LINES.includes(n + 1) && t >= l.start - 0.05 && t < l.start + l.duration + 0.25);
  if (i < 0) return null;
  const l = LINES[i];
  const k = easeOut(t, l.start - 0.05, l.start + 0.15);
  const who = l.speaker === 'NARRATOR' ? '' : `${l.speaker[0]}${l.speaker.slice(1).toLowerCase()}: `;
  const fill = l.speaker === 'NARRATOR' ? S.paper : BUBBLE[l.speaker as Who];
  return <AbsoluteFill><svg width={1080} height={1920}><Note x={540} y={1215} text={who + l.text} size={46} max={30} rot={i % 2 ? 1.5 : -1.5} k={k} fill={fill} /></svg></AbsoluteFill>;
};

export const GroupChat3: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  // Cold open: a flash-forward to Sana's question, then a rewind to the start.
  const cold = t < B.l1 - 0.1;
  const tw = cold ? B.writing + 1.0 : t;
  const cam = cold ? cam3At([key(0, 540, 760, 380), key(B.l1, 540, 770, 330)], t) : cam3At(CAM, t);
  const rewind = cold && t > B.l1 - 0.75;
  const musicVol = (f: number) => lerp(0.42, 0.2, speech(f / fps));
  const ctx = smooth(t, B.l1 - 0.1, B.l1 + 0.1) * (1 - smooth(t, B.e1 - 0.1, B.e1 + 0.2));
  const tbc = smooth(t, B.e12 + 0.6, B.e12 + 0.9);
  const whip = (a: number) => Math.abs(t - a) < 0.14;
  const fast = rewind || whip(B.cape_on) || whip(B.absolutely - 0.1) || whip(B.evening - 0.3);
  return <AbsoluteFill style={{background: S.wall}}>
    <Audio src={staticFile('audio/groupchat-ep3-music.wav')} volume={musicVol} />
    <Audio src={staticFile('audio/groupchat-ep3-room.wav')} volume={0.4} />
    <Audio src={staticFile('audio/groupchat-ep3-sfx.wav')} volume={0.8} />
    {LINES.map((l, i) => <Sequence key={i} from={Math.round(l.start * fps)}><Audio src={staticFile(l.file)} /></Sequence>)}
    <MotionBlurWhen fast={fast}>
      <Space cam={cam} id="gc3" bg={S.wall}><World t={tw} /></Space>
    </MotionBlurWhen>
    <AbsoluteFill><svg width={1080} height={1920}>
      <Note x={540} y={410} text="Saturday at seven. Bo's surprise keeps growing." size={56} max={22} k={ctx} rot={-2} />
      {cold && <Note x={540} y={360} text="What does Dev say to this?" size={60} max={18} k={1 - smooth(t, B.l1 - 0.6, B.l1 - 0.3)} rot={-2} fill={S.butter} />}
      {rewind && <g opacity={0.9}><rect width={1080} height={1920} fill={S.ink} opacity={0.25} />
        {Array.from({length: 12}, (_, i) => <rect key={i} x={0} y={((i * 170 + t * 4000) % 1920)} width={1080} height={10} fill="#fff" opacity={0.25} />)}
        <text x={540} y={980} textAnchor="middle" fontFamily="'Avenir Next', 'Nunito Sans', sans-serif" fontWeight={900} fontSize={120} fill="#fff">◀◀ REWIND</text></g>}
      <Note x={540} y={340} text="to be continued…" size={64} k={tbc} rot={-3} fill={S.butter} />
    </svg></AbsoluteFill>
    <Captions t={t} />
  </AbsoluteFill>;
};
