import React from 'react';
import {clamp, easeOut, lerp} from '../../lib/motion';
import {wrap} from '../../lib/speech';

// Season 1 of the story account, "The Group Chat Is Cooking": a pastel paper collage. A periwinkle
// wall, a cork board, the roommates as paper-doll half-body cut-outs (white sticker edge, pinned
// with tape), and a phone with the group chat. Not the NoSwipe brand look.

export const S = {
  wall: '#8E9BE8', wallLo: '#7A88DB', cork: '#C99A6B', corkLo: '#B5865A', paper: '#FFFDF6', ink: '#1F2550', inkSoft: '#5A6190',
  butter: '#FFE58A', coral: '#FF8A7A', teal: '#4FC1B5', peach: '#FFC9A8', mint: '#BDEBD6', red: '#E2483B', tape: '#FFF3C4',
};
export const ROUND = "'Avenir Next Rounded', 'Arial Rounded MT Bold', 'Nunito', 'Avenir Next', 'Nunito Sans', 'Helvetica Neue', 'Inter', sans-serif";
export const HAND = "'Noteworthy', 'Patrick Hand', 'Chalkboard SE', 'Marker Felt', 'Permanent Marker', cursive";

export type Who = 'DEV' | 'BO' | 'NINA' | 'SANA';
export const BUBBLE: Record<Who, string> = {DEV: S.butter, BO: S.coral, NINA: S.teal, SANA: S.peach};
export const NAME: Record<Who, string> = {DEV: 'Dev', BO: 'Bo', NINA: 'Nina', SANA: 'Sana'};

// ---------------------------------------------------------------------------------------------
// Paper dolls.

export type Expr = {mouth?: 'smile' | 'grin' | 'flat' | 'o' | 'frown' | 'talk'; eyes?: 'open' | 'wide' | 'half' | 'closed' | 'roll'; brow?: number; talk?: number;
  hands?: 'none' | 'point' | 'cross' | 'mouth' | 'phone' | 'thumbs'; tilt?: number; look?: number};

type Look = {skin: string; skinLo: string; hair: string; top: string; topLo: string; style: 'messy' | 'fade' | 'bob'; shades?: boolean};
export const LOOKS: Record<'DEV' | 'BO' | 'NINA', Look> = {
  DEV: {skin: '#B57B55', skinLo: '#9A6444', hair: '#1E1612', top: S.butter, topLo: '#E8C860', style: 'messy'},
  BO: {skin: '#D7A07A', skinLo: '#BC8560', hair: '#2A1C14', top: S.coral, topLo: '#E86E5E', style: 'fade', shades: true},
  NINA: {skin: '#F1C9A9', skinLo: '#D9AC8A', hair: '#6A2E2A', top: S.teal, topLo: '#3BA79C', style: 'bob'},
};

/** One doll: head and torso to the waist, cut out of paper. Origin at the waist centre; ~420 tall. */
const DollBody: React.FC<{l: Look; e: Expr; t: number}> = ({l, e, t}) => {
  const blink = e.eyes === 'closed' || (t * 30 + l.skin.length * 7) % 110 < 4;
  const look = e.look ?? 0;
  const talk = e.talk ?? 0;
  const eye = (s: number) => {
    const cx = s * 30 + look * 8, cy = -268;
    if (blink) return <path key={s} d={`M ${cx - 12} ${cy} Q ${cx} ${cy + 6} ${cx + 12} ${cy}`} stroke={S.ink} strokeWidth={5} fill="none" strokeLinecap="round" />;
    const r = e.eyes === 'wide' ? 14 : 10;
    return <g key={s}>
      {e.eyes === 'wide' && <circle cx={cx} cy={cy} r={r + 6} fill="#fff" />}
      <ellipse cx={cx + (e.eyes === 'roll' ? 0 : look * 3)} cy={cy - (e.eyes === 'roll' ? 6 : 0)} rx={e.eyes === 'wide' ? 7 : 8} ry={e.eyes === 'half' ? 5 : r} fill={S.ink} />
      {e.eyes === 'half' && <path d={`M ${cx - 13} ${cy - 4} L ${cx + 13} ${cy - 4}`} stroke={l.skin} strokeWidth={8} />}
    </g>;
  };
  const brow = e.brow ?? 0;
  const my = -222;
  const mouth = talk > 0.1 ? <ellipse cx={look * 6} cy={my} rx={14} ry={4 + 12 * talk} fill="#6A2A2A" />
    : e.mouth === 'grin' ? <path d={`M -26 ${my - 4} Q 0 ${my + 26} 26 ${my - 4} Z`} fill="#fff" stroke={S.ink} strokeWidth={4} />
      : e.mouth === 'o' ? <ellipse cx={0} cy={my + 2} rx={11} ry={14} fill="#6A2A2A" />
        : e.mouth === 'frown' ? <path d={`M -18 ${my + 6} Q 0 ${my - 8} 18 ${my + 6}`} stroke={S.ink} strokeWidth={5} fill="none" strokeLinecap="round" />
          : e.mouth === 'flat' ? <path d={`M -16 ${my} L 16 ${my}`} stroke={S.ink} strokeWidth={5} strokeLinecap="round" />
            : <path d={`M -20 ${my - 3} Q 0 ${my + 12} 20 ${my - 3}`} stroke={S.ink} strokeWidth={5} fill="none" strokeLinecap="round" />;
  return <g>
    {/* Hair behind (bob). */}
    {l.style === 'bob' && <path d="M -96 -250 Q -110 -390 0 -392 Q 110 -390 96 -250 L 92 -190 L -92 -190 Z" fill={l.hair} />}
    {/* Torso to the waist. */}
    <path d="M -150 0 L -138 -110 Q -128 -160 -60 -168 L 60 -168 Q 128 -160 138 -110 L 150 0 Z" fill={l.top} />
    <path d="M 60 -168 Q 128 -160 138 -110 L 150 0 L 100 0 L 92 -120 Z" fill={l.topLo} />
    <path d="M -24 -170 L 24 -170 L 22 -150 Q 0 -138 -22 -150 Z" fill={l.skinLo} />
    {/* Head. */}
    <g transform={`rotate(${e.tilt ?? 0} 0 -190)`}>
      <ellipse cx={0} cy={-262} rx={80} ry={92} fill={l.skin} />
      <ellipse cx={-80} cy={-258} rx={14} ry={20} fill={l.skinLo} /><ellipse cx={80} cy={-258} rx={14} ry={20} fill={l.skinLo} />
      {[-1, 1].map((s) => <ellipse key={s} cx={s * 44} cy={-236} rx={14} ry={8} fill="#FF8A8A" opacity={0.35} />)}
      {l.style === 'messy' && <path d="M -86 -280 Q -96 -370 -20 -366 Q -4 -390 30 -366 Q 90 -372 88 -290 Q 70 -330 40 -326 Q 10 -346 -14 -326 Q -54 -340 -86 -280 Z" fill={l.hair} />}
      {l.style === 'fade' && <path d="M -82 -290 Q -80 -360 0 -362 Q 80 -360 82 -290 Q 60 -330 0 -332 Q -60 -330 -82 -290 Z" fill={l.hair} />}
      {l.style === 'bob' && <path d="M -88 -270 Q -90 -360 0 -364 Q 90 -360 88 -270 Q 50 -330 -10 -318 Q -60 -308 -88 -270 Z" fill={l.hair} />}
      {eye(-1)}{eye(1)}
      {[-1, 1].map((s) => <path key={`b${s}`} d={`M ${s * 30 - 16} ${-300 - 6 * brow + (s * brow > 0 ? 0 : 4 * Math.abs(brow))} L ${s * 30 + 16} ${-300 - 6 * brow}`} stroke={l.hair} strokeWidth={7} strokeLinecap="round" />)}
      <path d="M 2 -258 Q 10 -240 -2 -236" stroke={l.skinLo} strokeWidth={5} fill="none" strokeLinecap="round" />
      {mouth}
      {l.shades && <g transform="translate(0 -272)"><rect x={-58} y={-16} width={50} height={30} rx={10} fill={S.ink} /><rect x={8} y={-16} width={50} height={30} rx={10} fill={S.ink} />
        <rect x={-8} y={-8} width={16} height={6} fill={S.ink} /><path d="M -50 -10 L -30 -10" stroke="#fff" strokeWidth={4} opacity={0.6} /></g>}
    </g>
  </g>;
};

const Hands: React.FC<{l: Look; e: Expr; t: number}> = ({l, e, t}) => {
  const h = e.hands ?? 'none';
  const sleeve = (d: string) => <path d={d} stroke={l.top} strokeWidth={46} fill="none" strokeLinecap="round" />;
  const hand = (x: number, y: number) => <circle cx={x} cy={y} r={24} fill={l.skin} />;
  if (h === 'point') return <g>{sleeve(`M 120 -130 Q 190 -150 ${230 + 6 * Math.sin(t * 8)} -210`)}{hand(240 + 6 * Math.sin(t * 8), -218)}
    <path d={`M ${246 + 6 * Math.sin(t * 8)} -232 L ${268 + 6 * Math.sin(t * 8)} -262`} stroke={l.skin} strokeWidth={14} strokeLinecap="round" /></g>;
  if (h === 'cross') return <g><path d="M -120 -70 Q 0 -30 120 -90" stroke={l.topLo} strokeWidth={52} fill="none" strokeLinecap="round" />
    <path d="M 120 -70 Q 0 -40 -110 -96" stroke={l.top} strokeWidth={50} fill="none" strokeLinecap="round" />{hand(-118, -98)}{hand(122, -92)}</g>;
  if (h === 'mouth') return <g>{sleeve('M 110 -120 Q 90 -170 30 -200')}{hand(20, -214)}{sleeve('M -110 -120 Q -90 -170 -36 -206')}{hand(-28, -220)}</g>;
  if (h === 'phone') return <g>{sleeve('M 110 -110 Q 90 -60 40 -70')}{sleeve('M -110 -110 Q -90 -60 -40 -70')}
    <rect x={-40} y={-150} width={80} height={130} rx={14} fill={S.ink} /><rect x={-32} y={-142} width={64} height={110} rx={8} fill="#C9D3FF" />{hand(-40, -70)}{hand(40, -70)}</g>;
  if (h === 'thumbs') return <g>{sleeve('M 120 -120 Q 170 -150 180 -200')}{hand(184, -212)}<rect x={176} y={-262} width={18} height={44} rx={9} fill={l.skin} /></g>;
  return null;
};

/** A paper-doll cut-out: white sticker edge, a strip of tape, a soft drop shadow on the board. */
export const Doll: React.FC<{who: 'DEV' | 'BO' | 'NINA'; e: Expr; t: number; tape?: number}> = ({who, e, t, tape = -8}) => {
  const l = LOOKS[who];
  const body = <><DollBody l={l} e={e} t={t} /><Hands l={l} e={e} t={t} /></>;
  return <g>
    <g transform="translate(14 18)" opacity={0.25} style={{filter: 'blur(6px)'}}><g fill={S.ink} stroke={S.ink} strokeWidth={30} strokeLinejoin="round">{body}</g></g>
    <g stroke="#fff" strokeWidth={28} strokeLinejoin="round" strokeLinecap="round"><g style={{filter: 'url(#whiteEdge)'}}>{body}</g></g>
    {body}
    <rect x={-70} y={-410} width={140} height={44} fill={S.tape} opacity={0.85} transform={`rotate(${tape} 0 -388)`} />
  </g>;
};

/** Filter that turns any drawing white, for the sticker edge (define once per Space). */
export const DollDefs: React.FC = () => <defs>
  <filter id="whiteEdge"><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0" /></filter>
</defs>;

// ---------------------------------------------------------------------------------------------
// The phone and its chat (a plain chat of our own design, not any real app's UI).

export type Msg = {from: Who; text: string; at: number};
export const PW = 470, PH = 820;   // phone body size in world units

const bubbleSize = (text: string) => {
  const lines = wrap(text, 20);
  return {lines, w: Math.min(330, 40 + Math.max(...lines.map((l) => l.length)) * 15.5), h: 26 + lines.length * 34};
};

export const ChatPhone: React.FC<{t: number; thread: 'roommates' | 'sana'; msgs: Msg[]; typed?: string; dots?: boolean; status?: string; banner?: {from: Who; text: string; k: number}; headerMark?: number; mark?: {fromEnd: number; k: number}; typer?: Who}> =
  ({t, thread, msgs, typed = '', dots = false, status, banner, headerMark = 0, mark, typer}) => {
    const shown = msgs.filter((m) => t >= m.at);
    const items: {m: Msg; y: number; w: number; h: number; lines: string[]}[] = [];
    let y = PH - 120 - (dots ? 70 : 0) - (status ? 30 : 0);
    for (let i = shown.length - 1; i >= 0; i--) {
      const s = bubbleSize(shown[i].text);
      const label = thread === 'roommates' && shown[i].from !== 'DEV' ? 26 : 0;
      y -= s.h + 14 + label;
      if (y < 130) break;
      items.unshift({m: shown[i], y: y + label, ...s});
    }
    const mineLast = shown.length && shown[shown.length - 1].from === 'DEV';
    return <g>
      <rect x={10} y={14} width={PW} height={PH} rx={60} fill={S.ink} opacity={0.25} />
      <rect width={PW} height={PH} rx={60} fill={S.ink} />
      <rect x={14} y={14} width={PW - 28} height={PH - 28} rx={48} fill="#FBFAFF" />
      <clipPath id={`scr-${thread}`}><rect x={14} y={14} width={PW - 28} height={PH - 28} rx={48} /></clipPath>
      <g clipPath={`url(#scr-${thread})`}>
        {/* Header: who this chat is with. */}
        <rect x={0} y={0} width={PW} height={130} fill={thread === 'sana' ? '#FFF1E8' : '#EEF0FF'} />
        <text x={40} y={92} fontFamily={ROUND} fontWeight={700} fontSize={34} fill={S.inkSoft}>‹</text>
        {thread === 'roommates'
          ? <g>{(['BO', 'NINA'] as Who[]).map((w, i) => <circle key={w} cx={96 + i * 26} cy={80} r={20} fill={BUBBLE[w]} stroke="#fff" strokeWidth={4} />)}
            <text x={150} y={90} fontFamily={ROUND} fontWeight={800} fontSize={30} fill={S.ink}>roommates 🍳</text></g>
          : <g><circle cx={100} cy={80} r={24} fill={BUBBLE.SANA} stroke="#fff" strokeWidth={4} /><text x={100} y={89} textAnchor="middle" fontFamily={ROUND} fontWeight={800} fontSize={24} fill={S.ink}>S</text>
            <text x={136} y={90} fontFamily={ROUND} fontWeight={800} fontSize={32} fill={S.ink}>Sana</text></g>}
        {headerMark > 0 && <ellipse cx={thread === 'sana' ? 170 : 240} cy={80} rx={120} ry={46} fill="none" stroke={S.red} strokeWidth={8} strokeLinecap="round"
          strokeDasharray={560} strokeDashoffset={560 * (1 - headerMark)} transform="rotate(-4 170 80)" />}
        {items.map(({m, y: yy, w, h, lines}, i) => {
          const mine = m.from === 'DEV';
          const k = clamp((t - m.at) / 0.18);
          const x = mine ? PW - 34 - w : 34;
          return <g key={i} transform={`translate(${x + (mine ? w : 0)} ${yy + h}) scale(${0.6 + 0.4 * easeOut(k, 0, 1)}) translate(${-(mine ? w : 0)} ${-h})`} opacity={k}>
            {thread === 'roommates' && !mine && <text x={10} y={-8} fontFamily={ROUND} fontWeight={700} fontSize={20} fill={S.inkSoft}>{NAME[m.from]}</text>}
            <rect width={w} height={h} rx={24} fill={BUBBLE[m.from]} />
            {lines.map((l, j) => <text key={j} x={20} y={40 + j * 34} fontFamily={ROUND} fontWeight={600} fontSize={26} fill={S.ink}>{l}</text>)}
            {mark && mark.k > 0 && i === items.length - 1 - mark.fromEnd && <ellipse cx={w / 2} cy={h / 2} rx={w / 2 + 26} ry={h / 2 + 22} fill="none" stroke={S.red} strokeWidth={7}
              strokeLinecap="round" strokeDasharray={1400} strokeDashoffset={1400 * (1 - mark.k)} transform={`rotate(-3 ${w / 2} ${h / 2})`} />}
          </g>;
        })}
        {status && mineLast && <text x={PW - 40} y={PH - 120 - (dots ? 70 : 0) - 6} textAnchor="end" fontFamily={ROUND} fontWeight={700} fontSize={20} fill={S.inkSoft}>{status}</text>}
        {dots && <g transform={`translate(34 ${PH - 186})`}><rect width={96} height={54} rx={27} fill={BUBBLE.SANA} />
          {[0, 1, 2].map((j) => <circle key={j} cx={28 + j * 20} cy={27} r={7} fill={S.ink} opacity={0.35 + 0.65 * Math.max(0, Math.sin(t * 6 - j * 0.9))} />)}</g>}
        {/* Compose box. */}
        {(() => { const tl = typed ? wrap(typed, 22).slice(-4) : ['message']; const h = 64 + (tl.length - 1) * 32;
          return <g><rect x={30} y={PH - 36 - h} width={PW - 130} height={h} rx={32} fill={typer && typed ? BUBBLE[typer] : '#fff'} stroke="#DDE0F2" strokeWidth={3} />
            {tl.map((l, i) => <text key={i} x={56} y={PH - 36 - h + 42 + i * 32} fontFamily={ROUND} fontWeight={600} fontSize={24} fill={typed ? S.ink : '#A8ADC8'}>{l}</text>)}</g>; })()}
        <circle cx={PW - 62} cy={PH - 68} r={30} fill={typed ? S.ink : '#DDE0F2'} />
        <path d={`M ${PW - 62} ${PH - 54} L ${PW - 62} ${PH - 82} M ${PW - 74} ${PH - 70} L ${PW - 62} ${PH - 82} L ${PW - 50} ${PH - 70}`} stroke="#fff" strokeWidth={5} fill="none" strokeLinecap="round" />
        {/* A notification banner dropping in from the top. */}
        {banner && banner.k > 0 && <g transform={`translate(24 ${lerp(-120, 30, easeOut(banner.k, 0, 1))})`}>
          <rect width={PW - 48} height={96} rx={24} fill="#fff" stroke="#DDE0F2" strokeWidth={3} />
          <circle cx={46} cy={48} r={22} fill={BUBBLE[banner.from]} />
          <text x={82} y={38} fontFamily={ROUND} fontWeight={800} fontSize={22} fill={S.ink}>{NAME[banner.from]}</text>
          <text x={82} y={70} fontFamily={ROUND} fontWeight={600} fontSize={22} fill={S.inkSoft}>{banner.text.length > 26 ? banner.text.slice(0, 25) + '…' : banner.text}</text>
        </g>}
      </g>
      <rect x={PW / 2 - 60} y={26} width={120} height={28} rx={14} fill={S.ink} />
    </g>;
  };

// ---------------------------------------------------------------------------------------------
// Paper bits.

/** A note on torn paper with a strip of tape, hand-lettered. Centered on x/y. */
export const Note: React.FC<{x: number; y: number; text: string; size?: number; max?: number; rot?: number; fill?: string; k?: number}> =
  ({x, y, text, size = 54, max = 20, rot = -3, fill = S.paper, k = 1}) => {
    if (k <= 0.01) return null;
    const lines = wrap(text, max);
    const w = Math.max(...lines.map((l) => l.length)) * size * 0.5 + 80, h = lines.length * size * 1.2 + 60;
    const edge = Array.from({length: 18}, (_, i) => `${-w / 2 + (i / 17) * w} ${h / 2 + (i % 2 ? 8 : -2)}`).join(' L ');
    return <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${0.85 + 0.15 * k})`} opacity={k}>
      <path d={`M ${-w / 2} ${-h / 2} L ${w / 2} ${-h / 2} L ${edge.split(' L ').reverse().join(' L ')} Z`} fill={S.ink} opacity={0.18} transform="translate(8 10)" />
      <path d={`M ${-w / 2} ${-h / 2} L ${w / 2} ${-h / 2} L ${edge.split(' L ').reverse().join(' L ')} Z`} fill={fill} />
      <rect x={-60} y={-h / 2 - 18} width={120} height={36} fill={S.tape} opacity={0.85} transform="rotate(4)" />
      {lines.map((l, i) => <text key={i} x={0} y={-h / 2 + 30 + size * 0.95 + i * size * 1.2} textAnchor="middle" fontFamily={HAND} fontWeight={700} fontSize={size} fill={S.ink}>{l}</text>)}
    </g>;
  };

/** The cork board on the periwinkle wall, with a few pinned scraps for texture. */
export const Board: React.FC<{t: number; wide?: boolean}> = ({t, wide = false}) => <g>
  <rect x={-2400} y={-2400} width={6000} height={7000} fill={S.wall} />
  {Array.from({length: 14}, (_, i) => <rect key={i} x={-1200} y={-600 + i * 260} width={3600} height={110} fill={S.wallLo} opacity={0.35} />)}
  <rect x={-40} y={170} width={wide ? 2000 : 1160} height={1320} rx={20} fill={S.corkLo} />
  <rect x={-30} y={180} width={wide ? 1980 : 1140} height={1300} rx={16} fill={S.cork} />
  {Array.from({length: wide ? 280 : 160}, (_, i) => <circle key={i} cx={-20 + ((i * 97) % (wide ? 1960 : 1120))} cy={200 + ((i * 53) % 1260)} r={2 + (i % 3)} fill={S.corkLo} opacity={0.6} />)}
  {/* Scraps: a polaroid, a sticky note, a takeout menu. */}
  <g transform="translate(120 330) rotate(-9)"><rect x={-90} y={-100} width={180} height={210} fill="#fff" /><rect x={-76} y={-86} width={152} height={140} fill={S.mint} />
    <circle cx={-20} cy={-20} r={30} fill={S.peach} /><circle cx={30} cy={-10} r={26} fill={S.butter} /></g>
  <g transform="translate(960 1260) rotate(7)"><rect x={-90} y={-80} width={180} height={160} fill={S.butter} />
    <text x={0} y={-10} textAnchor="middle" fontFamily={HAND} fontWeight={700} fontSize={34} fill={S.ink}>rent due</text>
    <text x={0} y={34} textAnchor="middle" fontFamily={HAND} fontWeight={700} fontSize={34} fill={S.red}>friday!!</text></g>
  <g transform="translate(980 260) rotate(5)"><rect x={-80} y={-60} width={160} height={120} fill={S.peach} />
    <text x={0} y={12} textAnchor="middle" fontFamily={HAND} fontWeight={700} fontSize={30} fill={S.ink}>pizza menu</text></g>
  {[[300, 210], [780, 220], [60, 1180], [1040, 760]].map(([x, y], i) => <g key={i}><circle cx={x} cy={y} r={14} fill={[S.red, S.teal, S.butter, S.coral][i]} /><circle cx={x - 4} cy={y - 4} r={4} fill="#fff" opacity={0.6} /></g>)}
</g>;
