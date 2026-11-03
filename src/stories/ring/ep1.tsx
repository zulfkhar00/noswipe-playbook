import React from 'react';
import {AbsoluteFill, Audio, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {easeOut, lerp, smooth} from '../../lib/motion';
import {Line, chunksOf, speechOf, wordsOf} from '../../lib/speech';
import spec from '../../../specs/stories/ring-ep1.json';
import tlJson from '../ring-ep1.timeline.json';

// "The Ring in the Drawer", episode 1 (story account, season 2; STORIES.md). The first AI-visuals
// episode: each shot is a Kling 4.0 clip animated from a Nano Banana Pro start frame (ai/), cut to
// the ElevenLabs voice timeline. Everything with words (context line, captions, the part card) is
// drawn here in code, never inside the AI frames.

export const RING1_FPS = 30;
const tl = tlJson as unknown as {lines: (Line & {speaker: string})[]; beats: Record<string, number>; duration: number};
const B = tl.beats;
const LINES = tl.lines;
export const RING1_FRAMES = Math.ceil(tl.duration * RING1_FPS);
const CHUNKS = chunksOf(LINES, wordsOf(LINES));
const speech = speechOf(LINES);

// Each shot starts just before its first line and runs until the next shot.
const STARTS = spec.shots.map((s, i) => (i === 0 ? 0 : Math.max(0, LINES[s.fromLine - 1].start - 0.15)));

const SERIF = "'Iowan Old Style', 'Palatino', 'Gelasio', 'Georgia', serif";
const SANS = "'Avenir Next', 'Nunito Sans', 'Helvetica Neue', 'Inter', sans-serif";

/** Narration captions: Nora's thoughts in white italic serif, Sam's voice in warm amber sans. */
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

const Context: React.FC<{t: number}> = ({t}) => {
  const k = 1 - smooth(t, B.e1 + 0.4, B.e1 + 0.8);
  if (k <= 0) return null;
  return <div style={{position: 'absolute', left: 60, right: 60, top: 300, textAlign: 'center', opacity: k}}>
    <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 30, letterSpacing: 6, color: '#FFE2B0', textShadow: '0 2px 12px rgba(0,0,0,0.9)'}}>THE RING IN THE DRAWER · PART 1</div>
    <div style={{marginTop: 14, fontFamily: SERIF, fontWeight: 700, fontSize: 64, lineHeight: 1.2, color: '#fff', textShadow: '0 2px 22px rgba(0,0,0,0.9), 0 2px 4px rgba(0,0,0,0.9)'}}>{spec.context}</div>
  </div>;
};

const PartCard: React.FC<{t: number}> = ({t}) => {
  const k = smooth(t, B.e10 + 0.7, B.e10 + 1.1);
  if (k <= 0) return null;
  return <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', background: `rgba(4,10,16,${0.55 * k})`}}>
    <div style={{opacity: k, transform: `translateY(${(1 - k) * 20}px)`, textAlign: 'center'}}>
      <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 56, color: '#fff'}}>Who was he talking to?</div>
      <div style={{marginTop: 22, fontFamily: SANS, fontWeight: 700, fontSize: 36, letterSpacing: 8, color: '#9FE3E6'}}>PART 2 TOMORROW</div>
    </div>
  </AbsoluteFill>;
};

export const Ring1: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const musicVol = (f: number) => lerp(0.55, 0.3, speech(f / fps));
  return <AbsoluteFill style={{background: '#000'}}>
    <Audio src={staticFile('audio/ring-ep1-music.wav')} volume={musicVol} />
    <Audio src={staticFile('audio/ring-ep1-room.wav')} volume={0.25} />
    <Audio src={staticFile('audio/ring-ep1-sfx.wav')} volume={0.8} />
    {LINES.map((l, i) => <Sequence key={i} from={Math.round(l.start * fps)}><Audio src={staticFile(l.file)} /></Sequence>)}
    {spec.shots.map((s, i) => {
      const from = Math.round(STARTS[i] * fps);
      const to = Math.round((i + 1 < STARTS.length ? STARTS[i + 1] : tl.duration) * fps);
      return <Sequence key={s.id} from={from} durationInFrames={to - from}>
        <AbsoluteFill><OffthreadVideo src={staticFile(`ai/ring-ep1/${s.id}.mp4`)} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} /></AbsoluteFill>
      </Sequence>;
    })}
    {/* A soft vignette keeps overlay text readable over any frame. */}
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%)'}} />
    <Context t={t} />
    <Captions t={t} />
    <PartCard t={t} />
  </AbsoluteFill>;
};
