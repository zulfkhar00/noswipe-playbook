import React from 'react';
import {clamp, lerp} from '../lib/motion';

// The Pre-Game guy: shaded flat style, no ink outlines, lit like TV footage — a cool blue rim from
// the TV on his right, warm fill from the lamp, and the phone's glow from below at night.
// Origin is the base of the neck; the head sits above, the seated torso below (about 620 tall).

const C = {skin: '#C98D6A', skinLo: '#A06A4E', skinHi: '#E3AE8C', hair: '#231812', hairHi: '#4A3427', hood: '#4C5A7C', hoodLo: '#36425E', hoodHi: '#6676A0',
  eye: '#F5F2EC', iris: '#2A1C14', lip: '#8C4E3E', rim: '#7FD3FF', glow: '#BFD6FF'};

export type PTPose = {lookDown: number; asleep: number; smile: number; talk?: number; phone: 'hold' | 'down'; flick?: number; glow?: number; rim?: number; brow?: number};

export const PTGuy: React.FC<{p: PTPose; t: number}> = ({p, t}) => {
  const blink = p.asleep > 0.5 || (t * 30 + 31) % 120 < 4;
  const lid = blink ? 1 : clamp(0.25 + 0.35 * p.lookDown - 0.2 * p.smile, 0, 1);
  const breathe = Math.sin(t * (p.asleep > 0.5 ? 1.2 : 2.1)) * (p.asleep > 0.5 ? 7 : 4);
  const hy = -150 + p.lookDown * 22 + p.asleep * 26;
  const rim = p.rim ?? 1;
  const glow = p.glow ?? 0;
  const ph: [number, number] = p.phone === 'down' ? [0, 0] : [lerp(30, 10, p.asleep), lerp(300, 330, p.asleep)];
  const f = p.flick ?? 0;
  return <g transform={`translate(0 ${breathe})`}>
    {/* Torso: hoodie with shading, hood behind the neck, drawstrings. */}
    <path d="M -300 440 Q -296 170 -120 120 L 120 120 Q 296 170 300 440 Z" fill={C.hood} />
    <path d="M 120 120 Q 296 170 300 440 L 180 440 Q 190 230 100 140 Z" fill={C.hoodLo} />
    <path d="M -300 440 Q -296 170 -120 120 L -90 150 Q -230 210 -240 440 Z" fill={C.hoodHi} opacity={0.5} />
    <path d="M -130 118 Q 0 210 130 118 Q 0 160 -130 118 Z" fill={C.hoodLo} />
    {[-1, 1].map((s) => <path key={s} d={`M ${s * 36} 150 L ${s * 42} 250`} stroke={C.eye} strokeWidth={6} strokeLinecap="round" opacity={0.8} />)}
    <path d="M 296 300 Q 300 380 300 440" stroke={C.rim} strokeWidth={10} opacity={0.6 * rim} fill="none" />
    {/* Neck. */}
    <path d="M -46 40 L 46 40 L 52 140 L -52 140 Z" fill={C.skinLo} />
    {/* Head. */}
    <g transform={`translate(0 ${hy}) rotate(${p.asleep * 10 - p.lookDown * 2})`}>
      <ellipse cx={-148} cy={12} rx={24} ry={38} fill={C.skinLo} />
      <ellipse cx={148} cy={12} rx={24} ry={38} fill={C.skinLo} />
      <path d="M -150 -20 Q -152 -170 0 -178 Q 152 -170 150 -20 Q 148 110 70 160 Q 0 186 -70 160 Q -148 110 -150 -20 Z" fill={C.skin} />
      {/* Shading: the far side of the face, cheekbone and jaw. */}
      <path d="M 60 -170 Q 152 -150 150 -20 Q 148 110 70 160 Q 120 60 110 -40 Q 100 -130 60 -170 Z" fill={C.skinLo} opacity={0.55} />
      <path d="M -150 -20 Q -150 60 -110 120 Q -132 30 -120 -60 Z" fill={C.skinHi} opacity={0.5} />
      {/* TV rim light on his right cheek; phone glow from below at night. */}
      <path d="M 140 -90 Q 160 0 120 120" stroke={C.rim} strokeWidth={9} fill="none" opacity={0.7 * rim} strokeLinecap="round" />
      {glow > 0 && <path d="M -110 60 Q 0 190 110 60 Q 60 150 0 158 Q -60 150 -110 60 Z" fill={C.glow} opacity={0.12 * glow} style={{mixBlendMode: 'screen'}} />}
      {/* Hair: short, textured, with a highlight. */}
      <path d="M -156 -30 Q -170 -200 -10 -206 Q 160 -210 158 -50 Q 130 -130 60 -128 Q -10 -160 -80 -120 Q -130 -96 -156 -30 Z" fill={C.hair} />
      <path d="M -60 -190 Q 10 -200 70 -176" stroke={C.hairHi} strokeWidth={10} fill="none" strokeLinecap="round" opacity={0.8} />
      {/* Eyes, lids, brows. */}
      {[-1, 1].map((s) => <g key={s}>
        <ellipse cx={s * 58} cy={-8 + p.lookDown * 8} rx={24} ry={18} fill={C.eye} />
        <circle cx={s * 58 + 2} cy={-4 + p.lookDown * 14} r={10} fill={C.iris} />
        <path d={`M ${s * 58 - 27} ${-26 + p.lookDown * 8} L ${s * 58 + 27} ${-26 + p.lookDown * 8} L ${s * 58 + 27} ${-26 + 40 * lid + p.lookDown * 8} Q ${s * 58} ${-18 + 40 * lid + p.lookDown * 8} ${s * 58 - 27} ${-26 + 40 * lid + p.lookDown * 8} Z`} fill={C.skin} />
        <path d={`M ${s * 58 - 26} ${-26 + 40 * lid + p.lookDown * 8} Q ${s * 58} ${-18 + 40 * lid + p.lookDown * 8} ${s * 58 + 26} ${-26 + 40 * lid + p.lookDown * 8}`} stroke={C.skinLo} strokeWidth={4} fill="none" />
        <path d={`M ${s * 58 - 30} ${-58 - 8 * (p.brow ?? 0) + (s > 0 ? 4 : 0) * (1 - p.smile)} L ${s * 58 + 30} ${-56 - 8 * (p.brow ?? 0)}`} stroke={C.hair} strokeWidth={12} strokeLinecap="round" />
      </g>)}
      <path d="M 6 4 Q 20 46 -6 54" stroke={C.skinLo} strokeWidth={8} fill="none" strokeLinecap="round" />
      {(p.talk ?? 0) > 0.08
        ? <ellipse cx={0} cy={100} rx={30} ry={8 + 20 * (p.talk ?? 0)} fill="#4A1E18" />
        : p.asleep > 0.5 ? <ellipse cx={4} cy={102} rx={14} ry={10} fill="#4A1E18" opacity={0.8} />
          : <path d={`M -40 ${98 - 8 * p.smile} Q 0 ${98 + 26 * p.smile - 10 * (1 - p.smile)} 40 ${98 - 8 * p.smile}`} stroke={C.lip} strokeWidth={9} fill="none" strokeLinecap="round" />}
      {/* Zzz when asleep. */}
      {p.asleep > 0.6 && [0, 1, 2].map((i) => { const k = (t * 0.6 + i / 3) % 1;
        return <text key={i} x={150 + 60 * k} y={-160 - 140 * k} fontFamily="'Avenir Next Condensed', 'Barlow Condensed', Impact, 'Anton', sans-serif" fontWeight={900} fontSize={50 + 30 * k} fill={C.glow} opacity={(1 - k) * p.asleep}>z</text>; })}
    </g>
    {/* Arms: holding the phone at the chest, or resting on his knees. */}
    {[-1, 1].map((s) => {
      const hx = p.phone === 'down' ? s * 200 : ph[0] + s * 66, hyy = p.phone === 'down' ? 440 : ph[1] + 40;
      return <path key={s} d={`M ${s * 220} 240 Q ${s * 280} ${(240 + hyy) / 2 + 50} ${hx} ${hyy}`} stroke={s > 0 ? C.hoodLo : C.hood} strokeWidth={76} fill="none" strokeLinecap="round" />;
    })}
    {p.phone === 'hold' && <g transform={`translate(${ph[0]} ${ph[1] - 40}) rotate(${-5 + 3 * f})`}>
      <rect x={-66} y={-120} width={132} height={226} rx={22} fill="#0E1220" />
      <rect x={-58} y={-110} width={116} height={206} rx={16} fill={C.glow} opacity={0.85} />
    </g>}
    {[-1, 1].map((s) => {
      const hx = p.phone === 'down' ? s * 200 : ph[0] + s * 66 + (s > 0 ? -8 * f : 0), hyy = p.phone === 'down' ? 440 : ph[1] + 40;
      return <g key={s}><circle cx={hx} cy={hyy} r={38} fill={C.skin} /><circle cx={hx + 10 * s} cy={hyy + 8} r={26} fill={C.skinLo} opacity={0.5} /></g>;
    })}
  </g>;
};
