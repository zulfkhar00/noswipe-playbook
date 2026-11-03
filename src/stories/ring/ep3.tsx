import React from 'react';
import {AbsoluteFill, Audio, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {easeOut, lerp, smooth, springIn} from '../../lib/motion';
import {Line, chunksOf, speechOf, wordsOf} from '../../lib/speech';
import spec from '../../../specs/stories/ring-ep3.json';
import tlJson from '../ring-ep3.timeline.json';

// "The Ring in the Drawer", episode 3, "The Ticket". Same pipeline as episodes 1–2. Code-drawn:
// Dani's voice note (the season's one in-story NoSwipe mention, about her own Thursday), Sam's
// note, the pawn ticket and the call to the unknown number.

export const RING3_FPS = 30;
const tl = tlJson as unknown as {lines: (Line & {speaker: string})[]; beats: Record<string, number>; duration: number};
const B = tl.beats;
const LINES = tl.lines;
export const RING3_FRAMES = Math.ceil(tl.duration * RING3_FPS);
const CHUNKS = chunksOf(LINES, wordsOf(LINES));
const speech = speechOf(LINES);
const STARTS = spec.shots.map((s, i) => (i === 0 ? 0 : s.id === 's8' ? B.e8 + 0.3 : Math.max(0, LINES[s.fromLine - 1].start - 0.15)));
const shotStart = (id: string) => STARTS[spec.shots.findIndex((s) => s.id === id)];

const SERIF = "'Iowan Old Style', 'Palatino', 'Gelasio', 'Georgia', serif";
const SANS = "'Avenir Next', 'Nunito Sans', 'Helvetica Neue', 'Inter', sans-serif";
const glass: React.CSSProperties = {background: 'rgba(28,32,40,0.78)', backdropFilter: 'blur(14px)', borderRadius: 34, boxShadow: '0 12px 40px rgba(0,0,0,0.45)', color: '#fff', fontFamily: SANS};

const Captions: React.FC<{t: number}> = ({t}) => {
  const c = CHUNKS.find((x) => t >= x.start - 0.03 && t < x.end);
  if (!c) return null;
  const line = LINES.find((l) => c.start >= l.start - 0.01 && c.start <= l.start + l.duration + 0.01)!;
  const sam = line.speaker !== 'NORA';
  const who = {SAM: ['SAM', '#FFD49A'], DANI: ['DANI', '#FFB38A'], WOMAN: ['UNKNOWN', '#BFEFF2']}[line.speaker as 'SAM'] ?? ['', '#fff'];
  const k = easeOut(t, c.start - 0.03, c.start + 0.12);
  return <div style={{position: 'absolute', left: 70, right: 70, top: 1130, textAlign: 'center', opacity: k}}>
    <span style={{fontFamily: sam ? SANS : SERIF, fontStyle: sam ? 'normal' : 'italic', fontWeight: sam ? 700 : 600, fontSize: sam ? 62 : 68, lineHeight: 1.2,
      color: sam ? who[1] : '#FFFFFF', textShadow: '0 2px 18px rgba(0,0,0,0.85), 0 2px 4px rgba(0,0,0,0.9)'}}>
      {sam && <span style={{fontSize: 40, opacity: 0.85, marginRight: 14}}>{who[0]}</span>}{c.words.map((w) => w.text.replace(/["…]/g, '')).join(' ')}
    </span>
  </div>;
};

const Recap: React.FC<{t: number}> = ({t}) => {
  const k = 1 - smooth(t, B.e1 + 0.3, B.e1 + 0.7);
  if (k <= 0) return null;
  return <div style={{position: 'absolute', left: 60, right: 60, top: 300, textAlign: 'center', opacity: k}}>
    <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 30, letterSpacing: 6, color: '#BFEFF2', textShadow: '0 2px 12px rgba(0,0,0,0.9)'}}>THE RING IN THE DRAWER · PART 3</div>
    <div style={{marginTop: 14, fontFamily: SERIF, fontWeight: 700, fontSize: 56, lineHeight: 1.22, color: '#fff', textShadow: '0 2px 22px rgba(0,0,0,0.9), 0 2px 4px rgba(0,0,0,0.9)'}}>{spec.context}</div>
  </div>;
};

const HANDWRITING = "'Bradley Hand', 'Caveat', 'Noteworthy', 'Patrick Hand', cursive";

/** Dani's voice note, Sam's note, the pawn ticket, the call. */
const PhoneBits: React.FC<{t: number}> = ({t}) => {
  const pop = (a: number, z: number) => (t >= a && t < z ? springIn((t - a) * 30, 0, 8) : 0);
  const note = pop(shotStart('s3') + 0.15, shotStart('s4')), card = pop(shotStart('s5') + 0.4, shotStart('s6'));
  const ticket = pop(shotStart('s7') + 0.35, shotStart('s8')), call = pop(shotStart('s8') + 0.1, shotStart('s9'));
  const playing = t >= LINES[3].start && t < LINES[3].start + LINES[3].duration;
  const connected = t >= LINES[8].start - 0.1;
  return <>
    {note > 0 && <div style={{position: 'absolute', top: 860, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${note})`}}>
      <div style={{...glass, padding: '22px 30px', display: 'flex', alignItems: 'center', gap: 22}}>
        <div style={{width: 64, height: 64, borderRadius: 32, background: '#C8783A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30}}>▶</div>
        <div style={{display: 'flex', alignItems: 'center', gap: 6}}>{Array.from({length: 26}, (_, i) => {
          const h = 10 + Math.abs(Math.sin(i * 1.3) * 30 + Math.sin(i * 0.7) * 12) * (playing ? 0.6 + 0.4 * Math.abs(Math.sin(t * 9 + i)) : 1);
          return <div key={i} style={{width: 6, height: h, borderRadius: 3, background: '#F4EDE4', opacity: 0.9}} />;
        })}</div>
        <div style={{fontSize: 30, fontWeight: 600, opacity: 0.85}}>Dani · 0:05</div>
      </div></div>}
    {card > 0 && <div style={{position: 'absolute', top: 800, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${card}) rotate(-3deg)`}}>
      <div style={{background: '#FFFBF1', padding: '26px 44px', borderRadius: 6, boxShadow: '0 14px 40px rgba(0,0,0,0.45)', fontFamily: HANDWRITING, color: '#2A2A3A', fontSize: 50, lineHeight: 1.3, textAlign: 'left'}}>
        {spec.overlays.note.map((l, i) => <div key={i} style={{textAlign: i === 2 ? 'right' : 'left'}}>{l}</div>)}</div></div>}
    {ticket > 0 && <div style={{position: 'absolute', top: 700, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${ticket}) rotate(2deg)`}}>
      <div style={{background: '#F3EEDC', padding: '28px 40px', width: 560, borderRadius: 4, boxShadow: '0 14px 40px rgba(0,0,0,0.5)', fontFamily: "'Courier New', 'Courier Prime', monospace", color: '#2A2620',
        borderTop: '10px dashed #C9C0A8', borderBottom: '10px dashed #C9C0A8'}}>
        <div style={{fontSize: 46, fontWeight: 700, letterSpacing: 4, textAlign: 'center'}}>{spec.overlays.ticket[0]}</div>
        {spec.overlays.ticket.slice(1).map((l, i) => <div key={i} style={{fontSize: 34, marginTop: 12, color: i === 1 ? '#B3261E' : '#2A2620', fontWeight: i === 1 ? 700 : 400}}>{l}</div>)}
      </div></div>}
    {call > 0 && <div style={{position: 'absolute', top: 300, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${call})`}}>
      <div style={{...glass, padding: '20px 40px', textAlign: 'center', minWidth: 520}}>
        <div style={{fontSize: 30, opacity: 0.75, fontWeight: 600}}>{connected ? `00:0${Math.min(9, Math.floor(t - LINES[8].start + 1))}` : 'Calling…'}</div>
        <div style={{fontSize: 46, fontWeight: 700, marginTop: 4}}>Unknown number</div>
      </div></div>}
  </>;
};

const PartCard: React.FC<{t: number}> = ({t}) => {
  const k = smooth(t, B.e10 + 1.0, B.e10 + 1.4);
  if (k <= 0) return null;
  return <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', background: `rgba(4,10,16,${0.55 * k})`}}>
    <div style={{opacity: k, transform: `translateY(${(1 - k) * 20}px)`, textAlign: 'center'}}>
      <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 56, color: '#fff'}}>Sam has one minute to explain.</div>
      <div style={{marginTop: 22, fontFamily: SANS, fontWeight: 700, fontSize: 36, letterSpacing: 8, color: '#9FE3E6'}}>PART 4 TOMORROW</div>
    </div>
  </AbsoluteFill>;
};

export const Ring3: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const musicVol = (f: number) => lerp(0.55, 0.3, speech(f / fps));
  return <AbsoluteFill style={{background: '#000'}}>
    <Audio src={staticFile('audio/ring-ep3-music.wav')} volume={musicVol} />
    <Audio src={staticFile('audio/ring-ep3-room.wav')} volume={0.25} />
    <Audio src={staticFile('audio/ring-ep3-sfx.wav')} volume={0.8} />
    {LINES.map((l, i) => <Sequence key={i} from={Math.round(l.start * fps)}><Audio src={staticFile(l.file)} /></Sequence>)}
    {spec.shots.map((s, i) => {
      const from = Math.round(STARTS[i] * fps);
      const to = Math.round((i + 1 < STARTS.length ? STARTS[i + 1] : tl.duration) * fps);
      return <Sequence key={s.id} from={from} durationInFrames={to - from}>
        <AbsoluteFill><OffthreadVideo src={staticFile(`ai/ring-ep3/${s.id}.mp4`)} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} /></AbsoluteFill>
      </Sequence>;
    })}
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%)'}} />
    <Recap t={t} />
    <PhoneBits t={t} />
    <Captions t={t} />
    <PartCard t={t} />
  </AbsoluteFill>;
};
