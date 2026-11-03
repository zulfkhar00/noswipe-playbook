import React from 'react';
import {AbsoluteFill, Audio, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {easeOut, lerp, smooth, springIn} from '../../lib/motion';
import {Line, chunksOf, speechOf, wordsOf} from '../../lib/speech';
import spec from '../../../specs/stories/ring-ep2.json';
import tlJson from '../ring-ep2.timeline.json';

// "The Ring in the Drawer", episode 2, "Act Normal". Same pipeline as episode 1 (Kling 4.0 clips
// from Nano Banana Pro frames, cut to the voice timeline); the phone moments (missed calls, Sam's
// voice note, the unknown number's message) are drawn here in code so the words stay crisp.

export const RING2_FPS = 30;
const tl = tlJson as unknown as {lines: (Line & {speaker: string})[]; beats: Record<string, number>; duration: number};
const B = tl.beats;
const LINES = tl.lines;
export const RING2_FRAMES = Math.ceil(tl.duration * RING2_FPS);
const CHUNKS = chunksOf(LINES, wordsOf(LINES));
const speech = speechOf(LINES);
const STARTS = spec.shots.map((s, i) => (i === 0 ? 0 : s.id === 's10' ? B.e10 + 0.35 : Math.max(0, LINES[s.fromLine - 1].start - 0.15)));
const shotStart = (id: string) => STARTS[spec.shots.findIndex((s) => s.id === id)];

const SERIF = "'Iowan Old Style', 'Palatino', 'Gelasio', 'Georgia', serif";
const SANS = "'Avenir Next', 'Nunito Sans', 'Helvetica Neue', 'Inter', sans-serif";
const glass: React.CSSProperties = {background: 'rgba(28,32,40,0.78)', backdropFilter: 'blur(14px)', borderRadius: 34, boxShadow: '0 12px 40px rgba(0,0,0,0.45)', color: '#fff', fontFamily: SANS};

const Captions: React.FC<{t: number}> = ({t}) => {
  const c = CHUNKS.find((x) => t >= x.start - 0.03 && t < x.end);
  if (!c) return null;
  const line = LINES.find((l) => c.start >= l.start - 0.01 && c.start <= l.start + l.duration + 0.01)!;
  const sam = line.speaker === 'SAM';
  const k = easeOut(t, c.start - 0.03, c.start + 0.12);
  return <div style={{position: 'absolute', left: 70, right: 70, top: 1130, textAlign: 'center', opacity: k}}>
    <span style={{fontFamily: sam ? SANS : SERIF, fontStyle: sam ? 'normal' : 'italic', fontWeight: sam ? 700 : 600, fontSize: sam ? 62 : 68, lineHeight: 1.2,
      color: sam ? '#FFD49A' : '#FFFFFF', textShadow: '0 2px 18px rgba(0,0,0,0.85), 0 2px 4px rgba(0,0,0,0.9)'}}>
      {sam && <span style={{fontSize: 40, opacity: 0.85, marginRight: 14}}>SAM</span>}{c.words.map((w) => w.text.replace(/["…]/g, '')).join(' ')}
    </span>
  </div>;
};

const Recap: React.FC<{t: number}> = ({t}) => {
  const k = 1 - smooth(t, B.e1 + 0.3, B.e1 + 0.7);
  if (k <= 0) return null;
  return <div style={{position: 'absolute', left: 60, right: 60, top: 300, textAlign: 'center', opacity: k}}>
    <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 30, letterSpacing: 6, color: '#BFEFF2', textShadow: '0 2px 12px rgba(0,0,0,0.9)'}}>THE RING IN THE DRAWER · PART 2</div>
    <div style={{marginTop: 14, fontFamily: SERIF, fontWeight: 700, fontSize: 56, lineHeight: 1.22, color: '#fff', textShadow: '0 2px 22px rgba(0,0,0,0.9), 0 2px 4px rgba(0,0,0,0.9)'}}>{spec.context}</div>
  </div>;
};

/** Phone moments: the missed-calls alert, Sam's voice note, the unknown number's message. */
const PhoneBits: React.FC<{t: number}> = ({t}) => {
  const missedAt = B.missed - 0.3, noteAt = shotStart('s8') + 0.2, msgAt = shotStart('s10') + 0.25;
  const missed = t >= missedAt && t < shotStart('s8') ? springIn((t - missedAt) * 30, 0, 8) : 0;
  const note = t >= noteAt && t < shotStart('s9') ? springIn((t - noteAt) * 30, 0, 8) : 0;
  const msg = t >= msgAt ? springIn((t - msgAt) * 30, 0, 8) : 0;
  const playing = t >= LINES[7].start && t < LINES[7].start + LINES[7].duration;
  return <>
    {missed > 0 && <div style={{position: 'absolute', top: 820, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${missed})`}}>
      <div style={{...glass, padding: '18px 34px', fontSize: 40, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 18}}>
        <span style={{width: 22, height: 22, borderRadius: 11, background: '#FF5A5A', display: 'inline-block'}} />3 missed calls</div></div>}
    {note > 0 && <div style={{position: 'absolute', top: 860, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${note})`}}>
      <div style={{...glass, padding: '22px 30px', display: 'flex', alignItems: 'center', gap: 22}}>
        <div style={{width: 64, height: 64, borderRadius: 32, background: '#2E8B6E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30}}>▶</div>
        <div style={{display: 'flex', alignItems: 'center', gap: 6}}>{Array.from({length: 26}, (_, i) => {
          const h = 10 + Math.abs(Math.sin(i * 1.7) * 30 + Math.sin(i * 0.6) * 12) * (playing ? 0.6 + 0.4 * Math.abs(Math.sin(t * 9 + i)) : 1);
          return <div key={i} style={{width: 6, height: h, borderRadius: 3, background: '#E8F4F0', opacity: 0.9}} />;
        })}</div>
        <div style={{fontSize: 30, fontWeight: 600, opacity: 0.85}}>Sam · 0:06</div>
      </div></div>}
    {msg > 0 && <div style={{position: 'absolute', top: 290, left: 70, right: 70, transform: `translateY(${(1 - Math.min(1, msg)) * -60}px)`, opacity: Math.min(1, msg * 1.5)}}>
      <div style={{...glass, padding: '26px 32px'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 28, fontWeight: 600, opacity: 0.75}}><span>Unknown number</span><span>now</span></div>
        <div style={{marginTop: 10, fontSize: 44, fontWeight: 700, lineHeight: 1.25}}>Did you bring it? We need it by Friday.</div>
      </div></div>}
  </>;
};

const PartCard: React.FC<{t: number}> = ({t}) => {
  const k = smooth(t, B.e11 + 0.8, B.e11 + 1.2);
  if (k <= 0) return null;
  return <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', background: `rgba(4,10,16,${0.55 * k})`}}>
    <div style={{opacity: k, transform: `translateY(${(1 - k) * 20}px)`, textAlign: 'center'}}>
      <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 56, color: '#fff'}}>What is "it"? Who is "we"?</div>
      <div style={{marginTop: 22, fontFamily: SANS, fontWeight: 700, fontSize: 36, letterSpacing: 8, color: '#9FE3E6'}}>PART 3 TOMORROW</div>
    </div>
  </AbsoluteFill>;
};

export const Ring2: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const musicVol = (f: number) => lerp(0.55, 0.3, speech(f / fps));
  return <AbsoluteFill style={{background: '#000'}}>
    <Audio src={staticFile('audio/ring-ep2-music.wav')} volume={musicVol} />
    <Audio src={staticFile('audio/ring-ep2-room.wav')} volume={0.25} />
    <Audio src={staticFile('audio/ring-ep2-sfx.wav')} volume={0.8} />
    {LINES.map((l, i) => <Sequence key={i} from={Math.round(l.start * fps)}><Audio src={staticFile(l.file)} /></Sequence>)}
    {spec.shots.map((s, i) => {
      const from = Math.round(STARTS[i] * fps);
      const to = Math.round((i + 1 < STARTS.length ? STARTS[i + 1] : tl.duration) * fps);
      return <Sequence key={s.id} from={from} durationInFrames={to - from}>
        <AbsoluteFill><OffthreadVideo src={staticFile(`ai/ring-ep2/${s.id}.mp4`)} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} /></AbsoluteFill>
      </Sequence>;
    })}
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%)'}} />
    <Recap t={t} />
    <PhoneBits t={t} />
    <Captions t={t} />
    <PartCard t={t} />
  </AbsoluteFill>;
};
