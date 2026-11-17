import React from 'react';
import {clamp, lerp, smooth} from '../../lib/motion';
import {OPEN} from '../../lib/fonts';
import {textW} from '../whites/world';

export {camAt, planeT, textW, fitSize} from '../whites/world';
export type {Cam, CamKey} from '../whites/world';

// SAME BAG (season 10): an arrivals hall. Flat paper cut-out half-figures with big round heads, concrete + hi-vis +
// amber palette, a belt carousel in the mid plane, a blurred rail in the near plane, soft ink-tinted shadows between
// planes, hard offset shadows on tags and strips. Shared by every part: palette, Person, Hand, Phone, Bag, KraftTag,
// Pen, Strip, belt-flap wipe, vote cards, end card. Fonts: Jost 800 (strips, end card), Barlow Condensed 700 (board),
// Caveat 700 (tags): all bundled through src/lib/fonts.ts.

export const C = {
  concrete: '#E6E3DC', concreteDeep: '#CFCBC1', hiVis: '#C6F135', amber: '#FFB000', carbon: '#1C1C1F', sky: '#8EC9FF',
  kraft: '#D8B589', kraftDeep: '#B9915F', suitcase: '#5B6B7A', suitcaseDeep: '#475563', suitcaseLite: '#7A8C9C',
  olive: '#6C6F3E', oliveDeep: '#53562F', camel: '#C99A66', camelDeep: '#A87C4C', cream: '#F3ECDD',
  skinHim: '#EBB28C', skinHer: '#B97E58', hairHim: '#33241D', hairHer: '#4A2A1C', flush: '#F58C7A', ink: '#1F2430',
};
export const JOST = OPEN.geometric;
export const BARLOW = OPEN.condensed;
export const CAVEAT = OPEN.handwriting;

export const Defs: React.FC = () => <defs>
  <linearGradient id="wallG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F1EEE7" /><stop offset="1" stopColor="#DAD6CB" /></linearGradient>
  <radialGradient id="glowSky"><stop offset="0" stopColor="#CFE8FF" stopOpacity={0.95} /><stop offset="0.5" stopColor={C.sky} stopOpacity={0.45} /><stop offset="1" stopColor={C.sky} stopOpacity={0} /></radialGradient>
  <linearGradient id="scr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#D8EEFF" /><stop offset="1" stopColor="#6FB6F5" /></linearGradient>
  <linearGradient id="beltG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#38383D" /><stop offset="1" stopColor="#222226" /></linearGradient>
  <filter id="blurNear"><feGaussianBlur stdDeviation="14" /></filter>
  <filter id="blurSoft"><feGaussianBlur stdDeviation="6" /></filter>
  <pattern id="hazard" width="80" height="80" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><rect width="40" height="80" fill={C.amber} /><rect x="40" width="40" height="80" fill={C.carbon} /></pattern>
</defs>;

// ---------------------------------------------------------------------------------------- far plane (hall + board)
export const HallWall: React.FC = () => <g>
  <rect x={-300} y={-300} width={1680} height={2600} fill="url(#wallG)" />
  {[-100, 260, 620, 980].map((x) => <rect key={x} x={x} y={-300} width={10} height={2600} fill={C.concreteDeep} opacity={0.7} />)}
  <rect x={-300} y={170} width={1680} height={40} fill={C.carbon} opacity={0.9} />
  <rect x={-300} y={210} width={1680} height={14} fill={C.amber} />
  {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={-60 + i * 300} y={96} width={170} height={26} rx={13} fill="#fff" opacity={0.9} />)}
</g>;

const flipSquash = (p: number) => Math.max(0.04, Math.abs(Math.cos(p * Math.PI)));
/** Departure-style board. `flip` 0..1 turns the two cells from ARRIVALS / BELT 4 to BELT 4 / EMPTY. */
export const Board: React.FC<{flip: number; y?: number}> = ({flip, y = 470}) => {
  const cells = [['ARRIVALS', 'BELT 4'], ['BELT 4', 'EMPTY']];
  const f = (txt: string, s: number) => `700 ${s}px ${BARLOW}`;
  const cell = (i: number, x: number, w: number) => {
    const half = flip > 0.5 ? 1 : 0;
    const sy = flipSquash(flip);
    const txt = cells[half][i];
    const empty = half === 1 && i === 1;
    return <g transform={`translate(${x} ${y}) scale(1 ${sy})`}>
      <rect x={-w / 2} y={-44} width={w} height={88} rx={10} fill="#2A2A2F" stroke="#000" strokeWidth={3} />
      <text x={0} y={22} textAnchor="middle" fontFamily={BARLOW} fontWeight={700} fontSize={textW(txt, f(txt, 66)) > w - 30 ? 54 : 66} letterSpacing={3} fill={empty ? C.hiVis : i === 0 ? C.amber : '#fff'}>{txt}</text>
      <line x1={-w / 2} x2={w / 2} y1={0} y2={0} stroke="#000" strokeWidth={3} opacity={0.5} />
    </g>;
  };
  return <g>
    <rect x={150} y={y - 66} width={780} height={132} rx={20} fill={C.carbon} />
    <rect x={150} y={y - 66} width={780} height={12} rx={6} fill="#4A4A52" />
    {cell(0, 390, 330)}{cell(1, 700, 280)}
    <rect x={250} y={y - 110} width={10} height={44} fill={C.carbon} /><rect x={820} y={y - 110} width={10} height={44} fill={C.carbon} />
  </g>;
};

// ---------------------------------------------------------------------------------------- belts
const SLAT = 90;
/** Far belt behind the figures (mid-far plane): a band with bags riding on it. */
export const FarBelt: React.FC<{t: number; pos: number; keyBag: number | null; empty?: boolean; keyRibbon?: boolean}> = ({pos, keyBag, empty = false, keyRibbon = false}) => {
  const others = [
    {o: 0, col: C.sky, deep: '#5FA5E0', w: 210}, {o: 700, col: C.amber, deep: '#D48F00', w: 190}, {o: 1500, col: '#3A3A42', deep: '#26262C', w: 200}];
  return <g>
    <rect x={-300} y={860} width={1680} height={120} fill="url(#beltG)" />
    <rect x={-300} y={850} width={1680} height={14} fill="#5A5A62" />
    {Array.from({length: 22}, (_, i) => <rect key={i} x={((i * SLAT * 1.2 - pos * 0.8) % (22 * SLAT * 1.2)) - 200} y={870} width={8} height={100} fill="#000" opacity={0.25} />)}
    {!empty && others.map((b, i) => {
      const x = (((b.o - pos) % 2400) + 2400) % 2400 - 400;
      return <g key={i} transform={`translate(${x} 858) scale(0.8)`}><Bag x={0} y={-165} loop={false} tag={false} body={b.col} deep={b.deep} wScale={b.w / 240} /></g>;
    })}
    {!empty && keyBag !== null && <g transform={`translate(${keyBag} 858) scale(0.8)`}><Bag x={0} y={-165} loop={false} tag ribbon={keyRibbon ? 1 : 0} ribbonColor={C.amber} /></g>}
  </g>;
};

export const NearBelt: React.FC<{pos: number}> = ({pos}) => <g>
  <rect x={-300} y={1280} width={1680} height={30} fill="#55555C" />
  <rect x={-300} y={1310} width={1680} height={250} fill="url(#beltG)" />
  {Array.from({length: 16}, (_, i) => {
    const x = (((i * SLAT - pos) % (16 * SLAT)) + 16 * SLAT) % (16 * SLAT) - 150;
    return <g key={i}><rect x={x} y={1310} width={10} height={250} fill="#000" opacity={0.45} /><rect x={x + 10} y={1310} width={5} height={250} fill="#fff" opacity={0.07} /></g>;
  })}
  <rect x={-300} y={1560} width={1680} height={22} fill="#0C0C0E" />
  <rect x={-300} y={1582} width={1680} height={46} fill="url(#hazard)" />
  <rect x={-300} y={1628} width={1680} height={14} fill={C.carbon} />
</g>;

export const Floor: React.FC = () => <g>
  <rect x={-300} y={1642} width={1680} height={500} fill="#C9C5BA" />
  {[-6, -3, -1, 0, 1, 3, 6].map((k) => <line key={k} x1={540 + k * 60} y1={1650} x2={540 + k * 340} y2={2000} stroke="#B3AFA3" strokeWidth={5} />)}
  <rect x={-300} y={1700} width={1680} height={8} fill="#B3AFA3" />
  <rect x={-300} y={1642} width={1680} height={50} fill={C.carbon} opacity={0.12} />
  {/* distant trolley silhouettes in the floor shadow */}
  <rect x={120} y={1740} width={200} height={14} rx={7} fill={C.carbon} opacity={0.12} /><rect x={700} y={1760} width={260} height={14} rx={7} fill={C.carbon} opacity={0.12} />
</g>;

/** Near plane: blurred rail and a blurred bag handle in the lower corners. */
export const NearRail: React.FC<{t: number}> = ({t}) => <g filter="url(#blurNear)" opacity={0.9}>
  <rect x={-100} y={1770} width={1300} height={64} rx={30} fill={C.carbon} transform={`translate(0 ${Math.sin(t * 0.9) * 3})`} />
  <rect x={-60} y={1640} width={50} height={230} rx={25} fill="#2E2E34" />
  <rect x={1080} y={1640} width={50} height={230} rx={25} fill="#2E2E34" />
  <path d="M -120 1900 L -120 1700 Q -120 1640 -50 1640 L 130 1640 L 130 1700 L -40 1700 L -40 1900 Z" fill={C.suitcaseDeep} />
</g>;

// ---------------------------------------------------------------------------------------- bag
export const Bag: React.FC<{x: number; y: number; loop: boolean; tag: boolean; body?: string; deep?: string; wScale?: number; ribbon?: number; pocketGlow?: number; shake?: number; rot?: number; scale?: number; ribbonColor?: string; tagString?: string; pouch?: boolean; zipX?: number; zipRot?: number; jam?: number; noTab?: boolean; children?: React.ReactNode}> = ({
  x, y, loop, tag, body = C.suitcase, deep = C.suitcaseDeep, wScale = 1, pocketGlow = 0, shake = 0, rot = 0, scale = 1, ribbon = 0, ribbonColor = C.hiVis, tagString = C.carbon, pouch = false, zipX = 0, zipRot = 0, jam = 0, noTab = false, children}) => {
  const w = 240 * wScale, h = 330;
  const sx = Math.sin(shake * 60) * 5 * shake;
  return <g transform={`translate(${x + sx} ${y}) rotate(${rot}) scale(${scale})`}>
    <rect x={-w / 2 + 16} y={-h / 2 + 22} width={w} height={h} rx={34} fill={C.ink} opacity={0.14} />
    <rect x={-w / 2 + 8} y={-h / 2 + 11} width={w} height={h} rx={34} fill={C.ink} opacity={0.12} />
    {/* wheels */}
    <rect x={-w / 2 + 20} y={h / 2 - 8} width={44} height={34} rx={12} fill={C.carbon} /><rect x={w / 2 - 64} y={h / 2 - 8} width={44} height={34} rx={12} fill={C.carbon} />
    {/* handle */}
    <path d={`M -56 ${-h / 2 + 6} L -56 ${-h / 2 - 34} Q -56 ${-h / 2 - 52} -38 ${-h / 2 - 52} L 38 ${-h / 2 - 52} Q 56 ${-h / 2 - 52} 56 ${-h / 2 - 34} L 56 ${-h / 2 + 6}`} fill="none" stroke={C.carbon} strokeWidth={17} strokeLinecap="round" strokeLinejoin="round" />
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={34} fill={body} />
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={34} fill="none" stroke={deep} strokeWidth={6} />
    {[-0.3, -0.1, 0.1, 0.3].map((k) => <rect key={k} x={k * w - 7} y={-h / 2 + 30} width={14} height={h - 60} rx={7} fill={deep} opacity={0.75} />)}
    <rect x={-w / 2 + 12} y={-h / 2 + 24} width={10} height={h - 90} rx={5} fill="#fff" opacity={0.2} />
    {/* front pocket */}
    <rect x={-72} y={26} width={144} height={112} rx={20} fill={deep} stroke={C.carbon} strokeWidth={4} />
    <line x1={-56} y1={44} x2={56} y2={44} stroke={C.carbon} strokeWidth={4} strokeDasharray="8 6" />
    {noTab ? <rect x={zipX - 6} y={41} width={12} height={6} rx={3} fill={C.carbon} opacity={0.7} /> : <g transform={`translate(${zipX} 0) rotate(${zipRot} 0 44)`}><rect x={-8} y={36} width={16} height={16} rx={6} fill={C.amber} stroke={zipX ? C.carbon : 'none'} strokeWidth={3} /></g>}
    {jam > 0 && <g fill="none" stroke={C.carbon} strokeWidth={5} strokeLinecap="round">{[-1, 0, 1].map((k) => <path key={k} transform={`translate(${zipX + k * 2} 0)`} d={`M ${-6 + k * 30} 8 l 9 -26 l 9 26`} opacity={jam} />)}</g>}
    {pocketGlow > 0 && <g>
      <circle cx={0} cy={82} r={140} fill="url(#glowSky)" opacity={pocketGlow * 0.8} />
      <rect x={-72} y={26} width={144} height={112} rx={20} fill={C.sky} opacity={pocketGlow * 0.4} />
      <rect x={-33} y={30} width={66} height={104} rx={13} fill="url(#scr)" stroke="#fff" strokeWidth={4} opacity={pocketGlow} />
      <rect x={-22} y={42} width={44} height={50} rx={7} fill="#fff" opacity={pocketGlow * 0.7} />
      {shake > 0 && [-1, 1].map((sd) => [0, 1].map((j) => <path key={`${sd}${j}`} d={`M ${sd * (96 + j * 22)} ${50 - j * 6} Q ${sd * (112 + j * 22)} 82 ${sd * (96 + j * 22)} ${114 + j * 6}`} fill="none" stroke={C.sky} strokeWidth={7} strokeLinecap="round" />))}
    </g>}
    {loop && <g>
      <path d={`M 18 ${-h / 2 - 50} Q 74 ${-h / 2 - 40} 62 ${-h / 2 + 6} L 62 ${-h / 2 + 100} L 34 ${-h / 2 + 100} L 40 ${-h / 2 + 8} Q 44 ${-h / 2 - 20} 18 ${-h / 2 - 22} Z`} fill={C.hiVis} stroke={C.carbon} strokeWidth={5} strokeLinejoin="round" />
      <rect x={34} y={-h / 2 + 62} width={28} height={14} fill={C.carbon} opacity={0.35} />
    </g>}
    {ribbon > 0 && <g transform={`translate(34 ${-h / 2 - 52}) scale(${ribbon})`}>
      <path d="M 0 4 L -18 70 L -2 62 L 6 74 L 12 8 Z" fill={ribbonColor} stroke={C.carbon} strokeWidth={4} strokeLinejoin="round" />
      <path d="M 0 0 Q -44 -36 -50 2 Q -44 30 0 0 Z" fill={ribbonColor} stroke={C.carbon} strokeWidth={4} strokeLinejoin="round" />
      <path d="M 0 0 Q 44 -36 50 2 Q 44 30 0 0 Z" fill={ribbonColor} stroke={C.carbon} strokeWidth={4} strokeLinejoin="round" />
      <circle r={9} fill={ribbonColor} stroke={C.carbon} strokeWidth={4} />
    </g>}
    {tag && <g transform={`translate(-52 ${-h / 2 - 28}) rotate(14)`}>
      <path d="M 0 0 L 0 36" stroke={tagString} strokeWidth={tagString === C.carbon ? 4 : 7} /><g transform="translate(-26 34)"><rect width={52} height={74} rx={7} fill={C.kraft} stroke={C.kraftDeep} strokeWidth={4} /><circle cx={26} cy={12} r={5} fill={C.concrete} stroke={C.kraftDeep} strokeWidth={2} /></g>
    </g>}
    {pouch && <g>
      <rect x={w / 2 - 38} y={30} width={92} height={124} rx={18} fill={deep} stroke={C.carbon} strokeWidth={4} />
      <line x1={w / 2 - 22} y1={54} x2={w / 2 + 38} y2={54} stroke={C.carbon} strokeWidth={4} strokeDasharray="8 6" />
    </g>}
    {children}
  </g>;
};

// ---------------------------------------------------------------------------------------- people
export type Mouth = 'soft' | 'flat' | 'smirk' | 'o' | 'laugh' | 'smile' | 'gulp' | 'grit';
export type Pose = {look: [number, number]; brow: number; browR?: number; worry: number; mouth: Mouth; happy: boolean; sweat: number; gulp: number; tilt: number; bob: number; blink: number; sway: number; flush: number};

const Mouthy: React.FC<{m: Mouth; t: number}> = ({m, t}) => {
  const st = {fill: 'none', stroke: C.ink, strokeWidth: 8, strokeLinecap: 'round' as const};
  switch (m) {
    case 'smirk': return <path d="M -40 70 Q -6 80 22 68 Q 36 62 44 48" {...st} />;
    case 'soft': return <path d="M -34 68 Q 0 90 34 68" {...st} />;
    case 'smile': return <path d="M -48 60 Q 0 104 48 60" {...st} />;
    case 'o': return <ellipse cx={0} cy={76} rx={20} ry={26} fill={C.ink} />;
    case 'gulp': return <path d="M -32 76 Q -14 64 0 76 Q 14 88 32 76" {...st} />;
    case 'grit': { const w = Math.sin(t * 38) * 2; return <g><rect x={-44} y={58 + w * 0.2} width={88} height={34} rx={13} fill="#fff" stroke={C.ink} strokeWidth={6} /><line x1={-44} y1={75} x2={44} y2={75} stroke={C.ink} strokeWidth={4} />{[-22, 0, 22].map((x) => <line key={x} x1={x} y1={60} x2={x} y2={90} stroke={C.ink} strokeWidth={4} />)}</g>; }
    case 'laugh': return <g><path d="M -58 52 Q 0 48 58 52 Q 54 124 0 124 Q -54 124 -58 52 Z" fill={C.ink} /><ellipse cx={0} cy={108} rx={26} ry={14} fill="#F2707C" /></g>;
    default: return <path d="M -32 74 L 32 74" {...st} />;
  }
};

export const Person: React.FC<{who: 'him' | 'her'; x: number; y: number; s?: number; t: number; pose: Pose; seed: number}> = ({who, x, y, s = 1, t, pose, seed}) => {
  const him = who === 'him';
  const ph = Math.sin(t * 2.1 + seed) * pose.sway;
  const sc = 1 + ph * 0.007;
  const skin = him ? C.skinHim : C.skinHer, skinDeep = him ? '#D4966F' : '#9D6644';
  const bodyD = 'M -330 900 L -312 270 Q -290 190 -190 176 Q -100 166 -58 142 L 58 142 Q 100 166 190 176 Q 290 190 312 270 L 330 900 Z';
  const [lx, ly] = pose.look;
  const eyeY = -6, ex = 52;
  const blinkK = 1 - pose.blink;
  const brow = (side: number, raise: number) => {
    const bx = side * ex, by = -60 - raise * 22, inner = pose.worry * 14;
    return <path d={`M ${bx - 32} ${by + (side < 0 ? 0 : -inner)} Q ${bx} ${by - 12} ${bx + 32} ${by + (side < 0 ? -inner : 0)}`} fill="none" stroke={him ? C.hairHim : C.hairHer} strokeWidth={him ? 12 : 9} strokeLinecap="round" />;
  };
  const earC = him ? mix(C.skinHim, C.flush, 0.4 + pose.flush * 0.6) : skin;
  return <g transform={`translate(${x} ${y + ph * 4}) scale(${s})`}>
    <path d={bodyD} transform="translate(22 26)" fill={C.ink} opacity={0.1} /><path d={bodyD} transform="translate(10 12)" fill={C.ink} opacity={0.1} />
    <g transform={`scale(1 ${sc})`}>
      <path d={bodyD} fill={him ? C.olive : C.camel} />
      {him ? <g>
        <path d="M -46 142 L -190 176 Q -290 190 -312 270 L -312 330 Q -200 250 -46 230 Z" fill={C.oliveDeep} opacity={0.5} />
        <ellipse cx={0} cy={186} rx={160} ry={56} fill={C.oliveDeep} />
        {Array.from({length: 9}, (_, i) => <line key={i} x1={-126 + i * 31} y1={160} x2={-126 + i * 31} y2={226} stroke="#00000030" strokeWidth={4} />)}
        <line x1={0} y1={236} x2={0} y2={900} stroke={C.carbon} strokeWidth={7} opacity={0.6} />
        <rect x={-300} y={690} width={600} height={20} fill={C.oliveDeep} opacity={0.6} />
      </g> : <g>
        <path d="M -58 142 L 0 420 L 58 142 Z" fill={C.cream} />
        <path d="M -58 142 L -190 176 Q -150 330 0 420 L -46 160 Z" fill={C.camelDeep} /><path d="M 58 142 L 190 176 Q 150 330 0 420 L 46 160 Z" fill={C.camelDeep} />
        <path d="M -58 142 L 0 420" stroke={C.carbon} strokeWidth={4} opacity={0.4} /><path d="M 58 142 L 0 420" stroke={C.carbon} strokeWidth={4} opacity={0.4} />
        {[470, 560].map((yy) => <circle key={yy} cx={0} cy={yy} r={14} fill={C.camelDeep} stroke={C.carbon} strokeWidth={4} />)}
      </g>}
      <rect x={-44} y={100} width={88} height={98} fill={skinDeep} />
      <ellipse cx={0} cy={168 + pose.gulp * 18} rx={13} ry={11} fill={C.ink} opacity={0.14 + pose.gulp * 0.3} />
    </g>
    <g transform={`translate(0 ${pose.bob}) rotate(${pose.tilt} 0 120)`}>
      {/* ears */}
      <circle cx={-146} cy={14} r={30} fill={earC} /><circle cx={146} cy={14} r={30} fill={earC} />
      {!him && <path d="M -170 -20 Q -200 120 -150 190 Q 0 230 150 190 Q 200 120 170 -20 Z" fill={C.hairHer} />}
      {!him && [-150, -118, 118, 150].map((cx, i) => <circle key={i} cx={cx} cy={i % 2 ? 150 : 100} r={48} fill={C.hairHer} />)}
      <circle r={146} fill={skin} />
      <circle cx={-84} cy={46} r={24} fill={C.flush} opacity={(him ? 0.34 + pose.flush * 0.35 : 0.2)} /><circle cx={84} cy={46} r={24} fill={C.flush} opacity={(him ? 0.34 + pose.flush * 0.35 : 0.2)} />
      {him
        ? <path d="M -150 -6 Q -176 -170 -60 -168 Q -30 -200 20 -176 Q 100 -190 150 -90 Q 160 -50 148 -6 Q 130 -80 60 -92 Q 20 -62 -40 -92 Q -120 -84 -150 -6 Z" fill={C.hairHim} />
        : <g><path d="M -150 -10 Q -170 -160 0 -166 Q 170 -160 150 -10 Q 128 -88 30 -108 Q -70 -96 -150 -10 Z" fill={C.hairHer} />
          {[-110, -60, 0, 60, 110].map((cx, i) => <circle key={i} cx={cx} cy={-130 - (i % 2) * 8 + Math.abs(cx) * 0.12} r={44} fill={C.hairHer} />)}</g>}
      {[-1, 1].map((sd) => pose.happy
        ? <path key={sd} d={`M ${sd * ex - 30} ${eyeY + 10} Q ${sd * ex} ${eyeY - 32} ${sd * ex + 30} ${eyeY + 10}`} fill="none" stroke={C.ink} strokeWidth={9} strokeLinecap="round" />
        : <g key={sd}>
          <ellipse cx={sd * ex} cy={eyeY} rx={34} ry={38 * blinkK + 2} fill="#fff" stroke={C.ink} strokeWidth={4} />
          <circle cx={sd * ex + lx * 14} cy={eyeY + ly * 11} r={16 * (0.4 + 0.6 * blinkK)} fill={C.ink} />
          <circle cx={sd * ex + lx * 14 + 5} cy={eyeY + ly * 11 - 5} r={5 * blinkK} fill="#fff" />
        </g>)}
      {!him && <g fill="none" stroke={C.carbon} strokeWidth={6}><circle cx={-ex} cy={eyeY} r={46} /><circle cx={ex} cy={eyeY} r={46} /><path d="M -8 -6 Q 0 -16 8 -6" /><path d="M -98 -2 L -140 -10" /><path d="M 98 -2 L 140 -10" /></g>}
      {brow(-1, pose.brow)}{brow(1, pose.browR ?? pose.brow)}
      <path d="M -6 24 Q 10 40 -4 46" fill="none" stroke={skinDeep} strokeWidth={6} strokeLinecap="round" />
      <Mouthy m={pose.mouth} t={t} />
      {pose.sweat > 0 && [[-136, -80, 0], [138, -44, 0.4], [-120, 40, 0.7], [112, -108, 0.2]].map(([dx, dy, o], i) => {
        const k = ((t * 0.9 + o) % 1);
        const a = pose.sweat * (i < 2 ? 1 : clamp((pose.sweat - 0.4) * 2));
        return <path key={i} transform={`translate(${dx} ${dy + k * 50 * pose.sweat}) scale(${0.8 + pose.sweat * 0.5})`} d="M 0 -24 Q 18 4 0 16 Q -18 4 0 -24 Z" fill="#BFE6FF" stroke={C.ink} strokeWidth={4} opacity={a * (1 - k * 0.7)} />;
      })}
    </g>
  </g>;
};

function mix(a: string, b: string, k: number): string {
  const f = (h: string, i: number) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
  return '#' + [0, 1, 2].map((i) => Math.round(lerp(f(a, i), f(b, i), clamp(k))).toString(16).padStart(2, '0')).join('');
}

// ---------------------------------------------------------------------------------------- hands + phone
export const Hand: React.FC<{who: 'him' | 'her'; x: number; y: number; rot?: number; base: [number, number]; style?: 'fist' | 'open' | 'point'; scale?: number; opacity?: number}> = ({who, x, y, rot = 0, base, style = 'fist', scale = 1, opacity = 1}) => {
  const him = who === 'him';
  const skin = him ? C.skinHim : C.skinHer, sleeve = him ? C.olive : C.camel, cuff = him ? C.oliveDeep : C.camelDeep;
  return <g opacity={opacity}>
    <line x1={base[0]} y1={base[1]} x2={x} y2={y + 30} stroke={C.ink} strokeOpacity={0.12} strokeWidth={96 * scale} strokeLinecap="round" transform="translate(10 14)" />
    <line x1={base[0]} y1={base[1]} x2={x} y2={y + 30} stroke={sleeve} strokeWidth={92 * scale} strokeLinecap="round" />
    <line x1={x + (base[0] - x) * 0.04} y1={y + 24 + (base[1] - y) * 0.04} x2={x + (base[0] - x) * 0.14} y2={y + 24 + (base[1] - y) * 0.14} stroke={cuff} strokeWidth={98 * scale} />
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale})`}>
      {style === 'open'
        ? <g><ellipse rx={52} ry={58} fill={skin} stroke="#00000030" strokeWidth={3} />{[-34, -12, 12, 34].map((dx, i) => <rect key={i} x={dx - 9} y={-96 + Math.abs(dx) * 0.3} width={18} height={56} rx={9} fill={skin} stroke="#00000030" strokeWidth={3} />)}<ellipse cx={-52} cy={0} rx={13} ry={30} fill={skin} transform="rotate(-30 -52 0)" /></g>
        : <g><ellipse rx={50} ry={44} fill={skin} stroke="#00000030" strokeWidth={3} />
          {[-30, -10, 10, 30].map((dx) => <line key={dx} x1={dx} y1={-40} x2={dx} y2={-12} stroke="#00000033" strokeWidth={3} />)}
          {style === 'point' && <rect x={-4} y={-120} width={26} height={90} rx={13} fill={skin} stroke="#00000030" strokeWidth={3} />}
          <ellipse cx={-42} cy={-6} rx={16} ry={28} fill={skin} stroke="#00000030" strokeWidth={3} transform="rotate(-20 -42 -6)" /></g>}
    </g>
  </g>;
};

const ProfileCard: React.FC = () => <g>
  <rect x={-58} y={-88} width={116} height={176} rx={16} fill="#fff" />
  <rect x={-47} y={-77} width={94} height={110} rx={11} fill="#CFE3F7" />
  <circle cx={0} cy={-40} r={19} fill="#7C95B8" /><path d="M -37 33 Q -37 -6 0 -6 Q 37 -6 37 33 Z" fill="#7C95B8" />
  <rect x={-42} y={48} width={84} height={11} rx={5} fill="#C9D3E3" /><rect x={-42} y={67} width={52} height={11} rx={5} fill="#C9D3E3" />
</g>;

/** Generic phone: lit profile-card glow only, no app UI. p = swipe progress 0..1 of the current flick. */
export const Phone: React.FC<{who: 'him' | 'her'; x: number; y: number; rot?: number; scale?: number; lit?: number; p?: number; dir?: number; thumb?: number; arm?: boolean; base?: [number, number]; caseColor?: string}> = ({who, x, y, rot = 0, scale = 1, lit = 1, p = 0, dir = 1, thumb = 1, arm = true, base, caseColor = C.carbon}) => {
  const him = who === 'him';
  const skin = him ? C.skinHim : C.skinHer, sleeve = him ? C.olive : C.camel;
  const side = him ? 1 : -1;
  return <g>
    {arm && base && <line x1={base[0]} y1={base[1]} x2={x} y2={y + 150 * scale} stroke={sleeve} strokeWidth={116 * scale} strokeLinecap="round" />}
    <g transform={`translate(${x} ${y}) scale(${scale}) rotate(${rot})`}>
      {lit > 0.01 && <circle r={210} fill="url(#glowSky)" opacity={lit * 0.55} />}
      <rect x={-96} y={-170} width={192} height={340} rx={36} fill={C.ink} opacity={0.2} transform="translate(12 16)" />
      <rect x={-96} y={-170} width={192} height={340} rx={36} fill={caseColor} stroke={caseColor === C.carbon ? 'none' : C.carbon} strokeWidth={5} />
      <rect x={-84} y={-158} width={168} height={316} rx={28} fill={lit > 0.3 ? 'url(#scr)' : '#26303F'} />
      {lit > 0.3 && <g>
        <g transform="translate(0 6) scale(0.95)" opacity={0.7}><ProfileCard /></g>
        <g transform={`translate(${p * dir * 220} ${-p * 14}) rotate(${p * dir * 20}) translate(0 6)`} opacity={1 - smooth(p, 0.55, 1)}><ProfileCard /></g>
      </g>}
      <ellipse cx={-side * 100} cy={30} rx={22} ry={38} fill={skin} stroke="#00000033" strokeWidth={3} />
      <ellipse cx={-side * 100} cy={88} rx={22} ry={32} fill={skin} stroke="#00000033" strokeWidth={3} />
      <g transform={`translate(${side * 44 + p * dir * 24 * thumb} ${88 - p * 34 * thumb}) rotate(${side * 22})`}>
        <ellipse rx={26} ry={54} fill={skin} stroke="#00000033" strokeWidth={3} /><ellipse cx={0} cy={-28} rx={11} ry={8} fill="#fff" opacity={0.35} />
      </g>
    </g>
  </g>;
};

// ---------------------------------------------------------------------------------------- kraft tag
export type TagLine = {txt: string; p: number};
export const tagGeom = (w: number, h: number, nLines: number, lines: string[], maxSize: number) => {
  const x0 = -w / 2 + 120, avail = w - 120 - 36;
  let size = maxSize;
  const font = (s: number) => `700 ${s}px ${CAVEAT}`;
  while (size > 30 && Math.max(...lines.map((l) => textW(l, font(l.length ? size : 1)))) > avail) size -= 2;
  const lh = size * 1.0;
  const total = (nLines - 1) * lh;
  return {x0, size, ys: lines.map((_, i) => -total / 2 + i * lh + size * 0.32), widths: lines.map((l) => textW(l, font(size)))};
};

export const KraftTag: React.FC<{w: number; h: number; lines: TagLine[]; size: number; x?: number; y?: number; rot?: number; scale?: number; shadow?: number; ruled?: boolean; id: string; barcode?: boolean; string?: boolean; stringColor?: string}> = ({w, h, lines, size, x = 0, y = 0, rot = 0, scale = 1, shadow = 1, ruled = false, id, barcode = false, string = true, stringColor = C.carbon}) => {
  const g = tagGeom(w, h, lines.length, lines.map((l) => l.txt), size);
  const cut = 70;
  const d = `M ${-w / 2 + cut} ${-h / 2} L ${w / 2 - 14} ${-h / 2} Q ${w / 2} ${-h / 2} ${w / 2} ${-h / 2 + 14} L ${w / 2} ${h / 2 - 14} Q ${w / 2} ${h / 2} ${w / 2 - 14} ${h / 2} L ${-w / 2 + cut} ${h / 2} L ${-w / 2} ${h / 2 - cut} L ${-w / 2} ${-h / 2 + cut} Z`;
  return <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale})`}>
    <path d={d} transform={`translate(${24 * shadow} ${30 * shadow})`} fill={C.carbon} opacity={0.22} />
    <path d={d} transform={`translate(${12 * shadow} ${15 * shadow})`} fill={C.ink} opacity={0.14} />
    <path d={d} fill={C.kraft} stroke={C.kraftDeep} strokeWidth={8} strokeLinejoin="round" />
    <path d={d} fill="#F0D4A8" opacity={0.35} transform="scale(0.96 0.9) translate(0 -10)" />
    {[[-190, -90, 60], [120, 70, 50], [260, -110, 44], [-60, 110, 70], [50, -40, 36]].map(([fx, fy, fl], i) => <line key={i} x1={fx} y1={fy} x2={fx + fl} y2={fy + 4} stroke={C.kraftDeep} strokeWidth={3} opacity={0.35} />)}
    {ruled && [0.34, 0.68].map((k) => <line key={k} x1={g.x0 - 6} x2={w / 2 - 34} y1={-h / 2 + h * k + 20} y2={-h / 2 + h * k + 20} stroke={C.kraftDeep} strokeWidth={3} strokeDasharray="14 10" opacity={0.45} />)}
    {/* reinforced hole + string */}
    <circle cx={-w / 2 + 62} cy={0} r={34} fill="#F1DDB8" stroke={C.kraftDeep} strokeWidth={5} />
    <circle cx={-w / 2 + 62} cy={0} r={19} fill={C.concrete} stroke={C.kraftDeep} strokeWidth={4} />
    {string && stringColor === C.carbon && <path d={`M ${-w / 2 + 62} 0 Q ${-w / 2 - 70} -90 ${-w / 2 - 150} -40`} fill="none" stroke={C.carbon} strokeWidth={6} opacity={0.75} />}
    {string && stringColor !== C.carbon && <g fill="none" strokeLinecap="round"><path d={`M ${-w / 2 + 62} 0 Q ${-w / 2 - 50} -70 ${-w / 2 - 110} -30`} stroke={C.carbon} strokeWidth={17} /><path d={`M ${-w / 2 + 62} 0 Q ${-w / 2 - 50} -70 ${-w / 2 - 110} -30`} stroke={stringColor} strokeWidth={9} /></g>}
    {barcode && Array.from({length: 22}, (_, i) => <rect key={i} x={g.x0 + i * 15 + (i % 3)} y={h / 2 - 58} width={i % 4 === 0 ? 9 : 5} height={30} fill={C.carbon} opacity={0.55} />)}
    <defs>{lines.map((l, i) => <clipPath key={i} id={`${id}c${i}`}><rect x={g.x0 - 30} y={g.ys[i] - g.size} width={(g.widths[i] + 60) * clamp(l.p)} height={g.size * 1.6} /></clipPath>)}</defs>
    {lines.map((l, i) => <text key={i} x={g.x0} y={g.ys[i]} fontFamily={CAVEAT} fontWeight={700} fontSize={g.size} fill={C.ink} clipPath={`url(#${id}c${i})`} transform={`rotate(${i % 2 ? 0.6 : -0.5} ${g.x0} ${g.ys[i]})`}>{l.txt}</text>)}
  </g>;
};

/** Pen (hi-vis body) with its tip at (0,0), tilted. */
export const Pen: React.FC<{x: number; y: number; rot?: number; cap?: boolean}> = ({x, y, rot = 28, cap = false}) => <g transform={`translate(${x} ${y}) rotate(${rot})`}>
  <rect x={-14} y={-300} width={28} height={252} rx={9} fill={C.hiVis} stroke={C.carbon} strokeWidth={5} />
  <rect x={-14} y={-300} width={28} height={50} rx={9} fill={C.carbon} />
  <rect x={-14} y={-92} width={28} height={30} fill="#B9C0CC" stroke={C.carbon} strokeWidth={3} />
  <path d="M -14 -52 L 0 0 L 14 -52 Z" fill="#E8C79A" stroke={C.carbon} strokeWidth={5} strokeLinejoin="round" /><path d="M -5 -14 L 0 0 L 5 -14 Z" fill={C.carbon} />
  {cap && <rect x={20} y={-270} width={22} height={120} rx={8} fill={C.carbon} />}
</g>;

// ---------------------------------------------------------------------------------------- strips
export const Strip: React.FC<{text: string; y: number; age: number; out?: number; size?: number; maxW?: number; hot?: boolean; rot?: number}> = ({text, y, age, out = 0, size = 58, maxW = 960, hot = false, rot = 0}) => {
  const font = (s: number) => `800 ${s}px ${JOST}`;
  const inner = maxW - 80;
  const width = (ls: string[], s: number) => Math.max(...ls.map((l) => textW(l, font(s))));
  let lines = [text];
  if (width(lines, size) > inner) {
    const ws = text.split(' ');
    let best = Infinity;
    for (let i = 1; i < ws.length; i++) {
      const ls = [ws.slice(0, i).join(' '), ws.slice(i).join(' ')];
      const w = width(ls, size);
      if (w < best) { best = w; lines = ls; }
    }
  }
  let s = size;
  while (s > 24 && width(lines, s) > inner) s -= 2;
  const lh = s * 1.12, h = lines.length * lh + 44, w = Math.min(maxW, width(lines, s) + 80);
  if (y < 600) y = Math.max(y, 284 + h / 2);
  const pop = smooth(age, 0, 0.1) * (1 + 0.06 * Math.sin(clamp(age / 0.32) * Math.PI));
  return <g opacity={1 - out} transform={`translate(540 ${y - out * 14}) rotate(${rot}) scale(${pop}) translate(-540 ${-y})`}>
    <rect x={540 - w / 2 + 12} y={y - h / 2 + 14} width={w} height={h} rx={18} fill={hot ? C.carbon : C.hiVis} />
    <rect x={540 - w / 2} y={y - h / 2} width={w} height={h} rx={18} fill={hot ? C.hiVis : C.carbon} />
    {lines.map((l, i) => <text key={i} x={540} y={y - h / 2 + 22 + lh * (i + 0.78)} textAnchor="middle" fontFamily={JOST} fontWeight={800} fontSize={s} fill={hot ? C.carbon : '#F6F3EC'}>{l}</text>)}
  </g>;
};

// ---------------------------------------------------------------------------------------- belt-flap wipe
export const WIPE_DUR = 0.55;
/** Rubber flaps sweep right-to-left carrying the next shot in. Returns the clip x for the new shot and the flaps node. */
export const flapEdge = (k: number) => lerp(1130, -330, smooth(k, 0, 1));
export const FlapRim: React.FC<{k: number}> = ({k}) => {
  const cx = flapEdge(k);
  return <g>
    {Array.from({length: 7}, (_, i) => {
      const x = cx - 24 + i * 40;
      const swing = Math.sin(k * 9 + i * 0.8) * 2.5 * (1 - Math.abs(k - 0.5)) + 2;
      return <g key={i} transform={`translate(${x} 0) rotate(${swing} 19 960)`}>
        <rect x={6} y={-20} width={40} height={2000} rx={8} fill={C.ink} opacity={0.25} />
        <rect x={0} y={-30} width={38} height={2000} rx={8} fill={i % 2 ? '#2A2A30' : C.carbon} stroke="#000" strokeWidth={3} />
        <rect x={5} y={-30} width={6} height={2000} fill="#fff" opacity={0.12} />
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((j) => <rect key={j} x={0} y={1120 + j * 70} width={38} height={26} fill={C.amber} opacity={0.9} />)}
      </g>;
    })}
  </g>;
};

// ---------------------------------------------------------------------------------------- vote + end
export const VoteBg: React.FC<{t: number}> = ({t}) => <g>
  <HallWall />
  <rect x={-300} y={1260} width={1680} height={30} fill="#55555C" />
  <rect x={-300} y={1290} width={1680} height={270} fill="url(#beltG)" />
  {Array.from({length: 16}, (_, i) => <rect key={i} x={(((i * SLAT - t * 120) % (16 * SLAT)) + 16 * SLAT) % (16 * SLAT) - 150} y={1290} width={10} height={270} fill="#000" opacity={0.45} />)}
  <rect x={-300} y={1560} width={1680} height={22} fill="#0C0C0E" /><rect x={-300} y={1582} width={1680} height={46} fill="url(#hazard)" />
  <Floor />
</g>;

export const VoteCard: React.FC<{letter: string; l1: string; l2: string; y: number; age: number; rot: number; id: string}> = ({letter, l1, l2, y, age, rot, id}) => {
  const k = clamp(age / 0.35);
  const sp = age < 0 ? 0 : 1 + Math.sin(k * Math.PI * 1.5) * Math.exp(-k * 4.2) * 0.4 - Math.exp(-k * 9) * (1 - k);
  if (age < 0) return null;
  const x = 590 + (1 - Math.min(1, k * 1.4)) * 700;
  return <g>
    <KraftTag w={780} h={250} lines={[{txt: l1, p: 1}, {txt: l2, p: 1}]} size={110} x={x} y={y} rot={rot} scale={Math.max(0.01, sp)} id={id} />
    <g transform={`translate(${x - 480 * sp} ${y}) scale(${sp})`}>
      <circle r={62} fill={C.carbon} transform="translate(8 10)" /><circle r={62} fill={C.hiVis} stroke={C.carbon} strokeWidth={6} />
      <text x={0} y={30} textAnchor="middle" fontFamily={JOST} fontWeight={800} fontSize={90} fill={C.carbon}>{letter}</text>
    </g>
  </g>;
};

export const EndCard: React.FC<{a: number; t: number; part?: number; amberRibbon?: boolean; prefix?: string}> = ({a, t, part = 2, amberRibbon = false, prefix = ''}) => {
  const pop = (d: number) => { const k = clamp((a - d) / 0.3); return k <= 0 ? 0 : 1 + Math.sin(k * Math.PI * 1.5) * Math.exp(-k * 4.2) * 0.4 - Math.exp(-k * 9) * (1 - k); };
  return <g>
    <HallWall />
    <rect x={-300} y={1260} width={1680} height={30} fill="#55555C" />
    <rect x={-300} y={1290} width={1680} height={270} fill="url(#beltG)" />
    {Array.from({length: 16}, (_, i) => <rect key={i} x={(((i * SLAT - t * 60) % (16 * SLAT)) + 16 * SLAT) % (16 * SLAT) - 150} y={1290} width={10} height={270} fill="#000" opacity={0.45} />)}
    <rect x={-300} y={1560} width={1680} height={22} fill="#0C0C0E" /><rect x={-300} y={1582} width={1680} height={46} fill="url(#hazard)" />
    <Floor />
    <g transform={`translate(540 560) scale(${pop(0)})`}>
      <text x={9} y={19} textAnchor="middle" fontFamily={JOST} fontWeight={800} fontSize={176} fill={C.carbon} opacity={0.25}>same bag.</text>
      <text x={0} y={10} textAnchor="middle" fontFamily={JOST} fontWeight={800} fontSize={176} fill={C.carbon}>same bag.</text>
    </g>
    <g transform={`translate(280 880) scale(${pop(0.15)})`}><Bag x={0} y={0} loop={false} tag ribbon={amberRibbon ? 1 : 0} ribbonColor={C.amber} /></g>
    <g transform={`translate(800 880) scale(${pop(0.25)})`}><Bag x={0} y={0} loop tag={false} /></g>
    <g transform={`translate(540 1190) scale(${pop(0.4)})`}>
      <rect x={prefix ? -440 : -330} y={-62} width={prefix ? 880 : 660} height={116} rx={22} fill={C.carbon} transform="translate(10 12)" opacity={0.9} />
      <rect x={prefix ? -440 : -330} y={-62} width={prefix ? 880 : 660} height={116} rx={22} fill={C.hiVis} stroke={C.carbon} strokeWidth={6} />
      <text x={0} y={26} textAnchor="middle" fontFamily={JOST} fontWeight={800} fontSize={74} fill={C.carbon}>{prefix}part {part} · A or B</text>
    </g>
  </g>;
};

/** Handwritten label with an arrow to (tx, ty). */
export const Label: React.FC<{x: number; y: number; text: string; tx: number; ty: number; a?: number; size?: number}> = ({x, y, text, tx, ty, a = 1, size = 96}) => {
  const sx = x, sy = y + 22, cx = (sx + tx) / 2 + (tx > sx ? -30 : 30), cy = (sy + ty) / 2;
  const ang = Math.atan2(ty - cy, tx - cx);
  const hd = (r: number) => `M ${tx} ${ty} L ${tx - Math.cos(ang + r) * 34} ${ty - Math.sin(ang + r) * 34}`;
  const path = `M ${sx} ${sy} Q ${cx} ${cy} ${tx} ${ty}`;
  return <g opacity={a}>
    <path d={path} fill="none" stroke="#fff" strokeWidth={16} strokeLinecap="round" /><path d={hd(0.5)} stroke="#fff" strokeWidth={16} strokeLinecap="round" /><path d={hd(-0.5)} stroke="#fff" strokeWidth={16} strokeLinecap="round" />
    <path d={path} fill="none" stroke={C.carbon} strokeWidth={7} strokeLinecap="round" /><path d={hd(0.5)} stroke={C.carbon} strokeWidth={7} strokeLinecap="round" /><path d={hd(-0.5)} stroke={C.carbon} strokeWidth={7} strokeLinecap="round" />
    <text x={x} y={y} textAnchor="middle" fontFamily={CAVEAT} fontWeight={700} fontSize={size} fill={C.carbon} stroke="#fff" strokeWidth={16} strokeLinejoin="round" paintOrder="stroke">{text}</text>
  </g>;
};

// ---------------------------------------------------------------------------------------- flowers
/** Supermarket bunch gripped at (0,0), stems up. droop 0 = perky, 1 = limp (heads fold over and hang). `fall` = seconds since droop (petals). */
export const Flowers: React.FC<{droop: number; t?: number; fall?: number; scale?: number; rot?: number; x?: number; y?: number}> = ({droop, t = 0, fall = -1, scale = 1, rot = 0, x = 0, y = 0}) => {
  const stems = [{a: -30, L: 178}, {a: -15, L: 205}, {a: 0, L: 222}, {a: 14, L: 196}, {a: 29, L: 172}];
  const d = clamp(droop);
  const pink = ['#F06A8D', '#FF8FA3', '#F5F0E6', '#F06A8D', '#FF8FA3'];
  const dull = ['#B58A96', '#BC9AA2', '#CFC7B8', '#B58A96', '#BC9AA2'];
  const leaf = '#3E8E4E';
  const rad = (a: number) => (a * Math.PI) / 180;
  const pts = stems.map((st, i) => {
    const dir = st.a === 0 ? 1 : Math.sign(st.a);
    const sx = Math.sin(rad(st.a)), cx = Math.cos(rad(st.a));
    const sway = (1 - d) * Math.sin(t * 2.4 + i) * 4;
    const pH = [sx * st.L + sway, -cx * st.L], pC2 = [sx * st.L * 0.72, -cx * st.L * 0.8];
    const tx = sx * st.L * 0.3;
    const hH = [tx + dir * st.L * 0.5, st.L * 0.1 + i * 7], hC2 = [tx + dir * st.L * 0.22, -st.L * 0.9];
    const c1 = [sx * st.L * 0.12, -st.L * 0.5];
    const H = [lerp(pH[0], hH[0], d), lerp(pH[1], hH[1], d)], C2 = [lerp(pC2[0], hC2[0], d), lerp(pC2[1], hC2[1], d)];
    return {st, dir, c1, C2, H};
  });
  return <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale})`}>
    {pts.map((p, i) => <path key={`s${i}`} d={`M 0 0 C ${p.c1[0]} ${p.c1[1]} ${p.C2[0]} ${p.C2[1]} ${p.H[0]} ${p.H[1]}`} fill="none" stroke={C.carbon} strokeWidth={14} strokeLinecap="round" />)}
    {pts.map((p, i) => <path key={`g${i}`} d={`M 0 0 C ${p.c1[0]} ${p.c1[1]} ${p.C2[0]} ${p.C2[1]} ${p.H[0]} ${p.H[1]}`} fill="none" stroke={leaf} strokeWidth={8} strokeLinecap="round" />)}
    {pts.map((p, i) => <ellipse key={`l${i}`} cx={p.c1[0] * 0.9 + p.dir * 18} cy={p.c1[1] * 0.9} rx={22} ry={9} fill={leaf} stroke={C.carbon} strokeWidth={3} transform={`rotate(${p.dir * (30 + 70 * d)} ${p.c1[0] * 0.9} ${p.c1[1] * 0.9})`} />)}
    {pts.map((p, i) => {
      const col = d > 0.5 ? dull[i] : pink[i];
      const petals = d > 0.5 ? 5 : 7;
      const r = 32 - d * 6;
      return <g key={`h${i}`} transform={`translate(${p.H[0]} ${p.H[1]}) rotate(${d * p.dir * 150})`}>
        {Array.from({length: petals}, (_, k) => <ellipse key={k} cx={0} cy={-r * 0.8} rx={r * 0.5} ry={r * 0.72} fill={col} stroke={C.carbon} strokeWidth={4} transform={`rotate(${(k * 360) / petals + (d > 0.5 ? (k % 2) * 14 : 0)})`} />)}
        <circle r={r * 0.42} fill={d > 0.5 ? '#B89A5A' : '#FFD25A'} stroke={C.carbon} strokeWidth={4} />
      </g>;
    })}
    {fall >= 0 && fall < 1.1 && [0, 1, 2].map((i) => {
      const p = pts[(i * 2 + 1) % 5], k = clamp(fall / 1.1 - i * 0.12);
      return <g key={`f${i}`} transform={`translate(${p.H[0] + (i - 1) * 22 + Math.sin(k * 9 + i) * 16} ${p.H[1] + 40 + k * 330}) rotate(${k * 260 + i * 40})`} opacity={1 - k * 0.8}><ellipse rx={11} ry={17} fill="#D9A3AE" stroke={C.carbon} strokeWidth={3} /></g>;
    })}
    <path d="M 0 22 L -64 -70 Q 0 -50 64 -70 Z" fill="#fff" fillOpacity={0.55} stroke="#fff" strokeWidth={4} strokeLinejoin="round" />
    <path d="M -22 -2 L -34 -46 M 6 4 L 4 -52 M 28 -4 L 38 -48" stroke="#fff" strokeWidth={3} opacity={0.8} />
    <rect x={-20} y={-8} width={40} height={14} rx={7} fill="#F06A8D" stroke={C.carbon} strokeWidth={3} />
  </g>;
};
