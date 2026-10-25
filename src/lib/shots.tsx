import React from 'react';
import {AbsoluteFill} from 'remotion';
import {CameraMotionBlur} from '@remotion/motion-blur';
import {clamp} from './motion';

// Shared edit grammar for the episodes: one signature transition (the outgoing shot flicks away
// like a swiped card) and motion blur that switches on only while something moves fast, so the
// render cost stays reasonable.

export type Shot = {from: number; render: (t: number) => React.ReactNode};

/** Plays `shots` in order; each cut is a swipe: the old shot lifts and flicks off sideways as a card. */
export const SwipeCuts: React.FC<{t: number; shots: Shot[]; dur?: number; edge?: string; skip?: number[]}> = ({t, shots, dur = 0.42, edge = '#22104A', skip = []}) => {
  let i = 0;
  while (i + 1 < shots.length && t >= shots[i + 1].from) i++;
  const cur = shots[i];
  const lt = t - cur.from;
  if (i === 0 || lt >= dur || skip.includes(i)) return <AbsoluteFill>{cur.render(t)}</AbsoluteFill>;
  const x = clamp(lt / dur);
  const fling = x * x;                       // accelerates like a flick
  const lift = 1 - 0.05 * clamp(x * 5);      // picks up slightly before it flies
  const under = 0.94 + 0.06 * (1 - Math.pow(1 - x, 3));
  const dir = i % 2 ? 1 : -1;
  const prev = shots[i - 1];
  return <>
    <AbsoluteFill style={{transform: `scale(${under})`}}>{cur.render(t)}</AbsoluteFill>
    <AbsoluteFill style={{transform: `translate(${dir * 1350 * fling}px, ${-90 * fling}px) rotate(${dir * 18 * fling}deg) scale(${lift})`, transformOrigin: '50% 115%',
      borderRadius: 70 * clamp(x * 6), overflow: 'hidden', border: x > 0.02 ? `8px solid ${edge}` : undefined, boxShadow: x > 0.02 ? `16px 20px 0 ${edge}` : undefined}}>
      {prev.render(t)}
    </AbsoluteFill>
  </>;
};

/** True during any cut transition. */
export const inCut = (t: number, shots: Shot[], dur = 0.42) => shots.slice(1).some((s) => t >= s.from - 0.02 && t < s.from + dur);

/** Wrap a scene that reads the frame itself; blur only when `fast`. */
export const MotionBlurWhen: React.FC<{fast: boolean; children: React.ReactNode; samples?: number; shutter?: number}> = ({fast, children, samples = 6, shutter = 200}) =>
  fast ? <CameraMotionBlur samples={samples} shutterAngle={shutter}>{children}</CameraMotionBlur> : <AbsoluteFill>{children}</AbsoluteFill>;
