import React from 'react';
import {K} from './brand';

// The two characters, drawn in the site's outlined flat style.

export type ThumbMood = 'tired' | 'fed-up' | 'smug' | 'chill';

/**
 * His thumb, the narrator. Local origin is the base of the thumb; it points up, about 560 tall.
 * The face sits on the pad. `talk` opens the mouth (0–1), `squash` compresses on impact.
 */
export const Thumb: React.FC<{mood: ThumbMood; t: number; talk?: number; squash?: number; sweat?: number; shades?: number; bandage?: boolean; blink?: boolean; lean?: number; wide?: number}> =
  ({mood, t, talk = 0, squash = 0, sweat = 0, shades = 0, bandage = true, blink, lean = 0, wide = 0}) => {
    // Squash (positive) / stretch (negative) from the base, plus an always-on breathing bob and sway.
    const breathe = Math.sin(t * 2.4);
    const sy = 1 - squash * 0.12 + breathe * 0.012, sx = 1 + squash * 0.08 - breathe * 0.008;
    const sway = lean + Math.sin(t * 1.3) * 1.2;
    const lidDrop = (mood === 'tired' ? 0.55 : mood === 'fed-up' ? 0.35 : mood === 'chill' ? 0.5 : 0.2) * (1 - wide);
    const shut = blink ?? ((t * 30 + 40) % 95 < 4); // offset so frame 0 never lands on a blink
    const brow = mood === 'fed-up' ? 1 : mood === 'tired' ? -0.6 : mood === 'smug' ? 0.4 : 0;
    const mouth = mood === 'smug' || mood === 'chill' ? 'smile' : mood === 'fed-up' ? 'flat' : 'frown';
    const eyeR = 1 + 0.3 * wide;
    return <g transform={`rotate(${sway}) scale(${sx} ${sy})`}>
      {/* Body of the thumb with a knuckle crease and the pad's shading. */}
      <path d="M -130 0 L -130 -360 Q -130 -560 0 -560 Q 130 -560 130 -360 L 130 0 Z" fill="#F4C39E" stroke={K.grape} strokeWidth={9} strokeLinejoin="round" />
      <path d="M 60 -540 Q 128 -500 128 -360 L 128 0 L 80 0 L 80 -360 Q 80 -480 60 -540 Z" fill="#E4A985" />
      <path d="M -80 -150 Q 0 -128 80 -150 M -64 -118 Q 0 -100 64 -118" fill="none" stroke={K.grape} strokeWidth={6} strokeLinecap="round" opacity={0.7} />
      {/* Eyes, lids, brows. */}
      {[-1, 1].map((s) => <g key={s}>
        <ellipse cx={s * 46} cy={-370} rx={26 * eyeR} ry={shut ? 3 : 30 * eyeR} fill="#fff" stroke={K.grape} strokeWidth={6} />
        {!shut && <circle cx={s * 46 + 4} cy={-364} r={11 * (1 - 0.15 * wide)} fill={K.grape} />}
        {!shut && <path d={`M ${s * 46 - 30} ${-372 - 30 + 60 * lidDrop} Q ${s * 46} ${-404 + 60 * lidDrop} ${s * 46 + 30} ${-372 - 30 + 60 * lidDrop} L ${s * 46 + 30} -404 L ${s * 46 - 30} -404 Z`} fill="#F4C39E" stroke={K.grape} strokeWidth={6} strokeLinejoin="round" />}
        <path d={`M ${s * 46 - 28} ${-420 - 10 * brow * s * -1} L ${s * 46 + 28} ${-420 + 10 * brow * s * -1}`} stroke={K.grape} strokeWidth={9} strokeLinecap="round" />
        {mood === 'tired' && <path d={`M ${s * 46 - 22} -334 Q ${s * 46} -322 ${s * 46 + 22} -334`} fill="none" stroke={K.grape3} strokeWidth={5} strokeLinecap="round" />}
      </g>)}
      {/* Mouth. */}
      {talk > 0.08
        ? <ellipse cx={0} cy={-286} rx={30 + talk * 6} ry={8 + talk * 26} fill={K.grape} />
        : mouth === 'smile' ? <path d="M -40 -296 Q 0 -260 40 -296" fill="none" stroke={K.grape} strokeWidth={8} strokeLinecap="round" />
          : mouth === 'flat' ? <path d="M -34 -284 L 34 -284" stroke={K.grape} strokeWidth={8} strokeLinecap="round" />
            : <path d="M -36 -270 Q 0 -300 36 -270" fill="none" stroke={K.grape} strokeWidth={8} strokeLinecap="round" />}
      {/* Band-aid wrapped diagonally across the tip. */}
      {bandage && <g transform={`translate(-40 -480) rotate(${-28 + Math.sin(t * 6) * 2.5})`}>
        <rect x={-110} y={-34} width={220} height={68} rx={30} fill="#F2D8B8" stroke={K.grape} strokeWidth={7} />
        <rect x={-34} y={-24} width={68} height={48} rx={10} fill="#E8C49C" />
        {[-70, -54, 54, 70].map((x) => [-12, 10].map((y) => <circle key={`${x}${y}`} cx={x} cy={y} r={4} fill="#C99A6E" />))}
      </g>}
      {sweat > 0 && [0, 1].map((i) => {
        const k = (t * 0.9 + i * 0.5) % 1;
        return <path key={i} d={`M ${110 + i * 26} ${-470 + k * 90} q 14 22 0 32 q -14 -10 0 -32`} fill={K.sky} stroke={K.grape} strokeWidth={4} opacity={sweat * (1 - k)} />;
      })}
      {shades > 0 && <g transform={`translate(0 ${-372 - (1 - shades) * 300})`}>
        {[-1, 1].map((s) => <rect key={s} x={s * 46 - 40} y={-26} width={80} height={52} rx={18} fill={K.grape} />)}
        <rect x={-8} y={-10} width={16} height={8} fill={K.grape} />
        {[-1, 1].map((s) => <path key={`g${s}`} d={`M ${s * 46 - 22} -12 L ${s * 46 - 4} -12`} stroke={K.lime} strokeWidth={6} strokeLinecap="round" />)}
      </g>}
    </g>;
  };

/** The guy, head and shoulders, in a lilac hoodie. Origin is the base of the neck; ~620 tall. */
export const Guy: React.FC<{t: number; relief: number; talk?: number; lookDown?: number; exhale?: number}> = ({t, relief, talk = 0, lookDown = 0, exhale = 0}) => {
  const lean = -6 * relief + Math.sin(t * 1.1) * 0.8;
  const blink = exhale > 0.5 || (t * 30 + 25) % 110 < 4;
  const breathe = Math.sin(t * 2.2) * 5 + exhale * 12;
  const lid = blink ? 1 : 0.35 * (1 - relief) + 0.05;
  return <g transform={`translate(0 ${breathe}) rotate(${lean} 0 200)`}>
    <path d="M -300 420 Q -290 160 -110 120 L 110 120 Q 290 160 300 420 Z" fill={K.lilac} stroke={K.grape} strokeWidth={9} strokeLinejoin="round" />
    <path d="M -110 120 Q 0 220 110 120" fill="none" stroke={K.grape} strokeWidth={8} />
    {[-1, 1].map((s) => <path key={s} d={`M ${s * 40} 160 L ${s * 46} 260`} stroke={K.grape} strokeWidth={6} strokeLinecap="round" />)}
    <rect x={-46} y={40} width={92} height={110} fill="#C98F6A" stroke={K.grape} strokeWidth={8} />
    <g transform={`translate(0 ${-130 + lookDown * 18}) rotate(${relief * -3})`}>
      <ellipse rx={150} ry={175} fill="#D9A27C" stroke={K.grape} strokeWidth={9} />
      {/* Hair: a swoop with a little volume on top. */}
      <path d="M -152 -20 Q -170 -190 -10 -200 Q 150 -205 154 -40 Q 120 -120 40 -110 Q -40 -150 -100 -90 Q -130 -60 -152 -20 Z" fill="#3A2416" stroke={K.grape} strokeWidth={8} strokeLinejoin="round" />
      {[-1, 1].map((s) => <g key={s}>
        <ellipse cx={s * 58} cy={-4 + lookDown * 14} rx={20} ry={blink ? 3 : 24} fill="#fff" stroke={K.grape} strokeWidth={6} />
        {!blink && <circle cx={s * 58 + 2} cy={2 + lookDown * 20} r={10} fill={K.grape} />}
        {!blink && <path d={`M ${s * 58 - 22} ${-4 - 24 + 48 * lid} L ${s * 58 + 22} ${-4 - 24 + 48 * lid} L ${s * 58 + 22} -30 L ${s * 58 - 22} -30 Z`} fill="#D9A27C" />}
        <path d={`M ${s * 58 - 26} ${-48 - 6 * relief} L ${s * 58 + 26} ${-48 - 6 * relief + (relief > 0.5 ? 0 : 6) * s}`} stroke={K.grape} strokeWidth={9} strokeLinecap="round" />
      </g>)}
      <path d="M 4 10 Q 14 46 -10 52" fill="none" stroke={K.grape} strokeWidth={6} strokeLinecap="round" />
      {talk > 0.08
        ? <ellipse cy={96} rx={34} ry={10 + talk * 22} fill={K.grape} />
        : <path d={`M -44 ${92 - 10 * relief} Q 0 ${92 + 30 * relief - 14 * (1 - relief)} 44 ${92 - 10 * relief}`} fill="none" stroke={K.grape} strokeWidth={8} strokeLinecap="round" />}
      {[-1, 1].map((s) => <ellipse key={s} cx={s * 150} cy={10} rx={22} ry={36} fill="#D9A27C" stroke={K.grape} strokeWidth={8} />)}
    </g>
  </g>;
};
