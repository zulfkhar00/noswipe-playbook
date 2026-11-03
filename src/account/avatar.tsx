import React from 'react';
import {AbsoluteFill} from 'remotion';

// Profile picture options for the story account, "Tiny Love Stories". Instagram crops to a circle
// and shows it at ~110 px, so every option keeps one bold mark inside the central 70%.

const C = {ink: '#1F2550', peach: '#FFC9A8', coral: '#FF6F61', butter: '#FFE58A', wall: '#8E9BE8', paper: '#FFFDF6', mint: '#BDEBD6'};

const Dots: React.FC<{y: number}> = ({y}) => <g>
  <circle cx={-150} cy={y} r={42} fill={C.ink} />
  {/* The middle dot is a little heart. */}
  <path d={`M 0 ${y + 50} C -80 ${y - 6} -54 ${y - 70} 0 ${y - 30} C 54 ${y - 70} 80 ${y - 6} 0 ${y + 50} Z`} fill={C.coral} />
  <circle cx={150} cy={y} r={42} fill={C.ink} />
</g>;

export const Avatar: React.FC<{v: 'bubble' | 'play' | 'pair'}> = ({v}) => <AbsoluteFill style={{background: v === 'play' ? C.butter : v === 'pair' ? C.paper : C.wall}}>
  <svg width={1080} height={1080} viewBox="0 0 1080 1080">
    <g transform="translate(540 540)">
      {v === 'bubble' && <g>
        {/* A chat bubble with typing dots, the middle one a heart. */}
        <path d="M -330 -200 Q -330 -260 -270 -260 L 270 -260 Q 330 -260 330 -200 L 330 140 Q 330 200 270 200 L -90 200 L -200 300 L -180 200 L -270 200 Q -330 200 -330 140 Z" fill={C.paper} transform="translate(14 18)" opacity={0.25} />
        <path d="M -330 -200 Q -330 -260 -270 -260 L 270 -260 Q 330 -260 330 -200 L 330 140 Q 330 200 270 200 L -90 200 L -200 300 L -180 200 L -270 200 Q -330 200 -330 140 Z" fill={C.paper} />
        <Dots y={-30} />
      </g>}
      {v === 'play' && <g>
        {/* A heart with a play triangle: love, in episodes. */}
        <path d="M 0 300 C -360 60 -330 -300 0 -150 C 330 -300 360 60 0 300 Z" fill={C.coral} transform="translate(16 20)" opacity={0.3} />
        <path d="M 0 300 C -360 60 -330 -300 0 -150 C 330 -300 360 60 0 300 Z" fill={C.coral} />
        <path d="M -60 -60 L 100 30 L -60 120 Z" fill={C.paper} />
      </g>}
      {v === 'pair' && <g>
        {/* Two overlapping chat bubbles, one his and one hers, overlapping into a heart. */}
        <g transform="translate(-90 -40) rotate(-8)"><rect x={-230} y={-170} width={400} height={290} rx={90} fill={C.wall} /><path d="M -120 110 L -190 220 L -40 120 Z" fill={C.wall} /></g>
        <g transform="translate(100 60) rotate(6)"><rect x={-170} y={-150} width={400} height={290} rx={90} fill={C.peach} /><path d="M 120 130 L 190 240 L 40 140 Z" fill={C.peach} /></g>
        <path d="M 0 120 C -110 40 -80 -60 0 -10 C 80 -60 110 40 0 120 Z" fill={C.coral} />
      </g>}
    </g>
  </svg>
</AbsoluteFill>;
