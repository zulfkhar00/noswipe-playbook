import React from 'react';
import {AbsoluteFill} from 'remotion';
import {clamp, easeOut, hold, smooth, springIn} from '../lib/motion';
import {Plane, Shadow, Space, cam3At} from '../lib/space';
import {Chunk} from '../lib/speech';
import {Avatar, CalIcon, Card, Check, DISPLAY, INK_TINT, K, Lines, Logo, Pill, SANS} from './brand';

// Pieces every NoSwipe video shares: backdrop, phone, profile and date cards, end card, captions,
// soft CTA, ticker band and paper grain. All match noswipe.app.

export const pop = (t: number, at: number, dur = 10) => (t < at ? 0 : springIn((t - at) * 30, 0, dur));

/** Cream paper with the site's big soft lime and lilac circles on far planes. */
export const Backdrop: React.FC<{t: number; a?: [number, number, number]; b?: [number, number, number]; tone?: string}> =
  ({t, a = [170, 760, 380], b = [930, 1180, 330], tone = K.paper}) => {
    const far = (x: number, y: number, z: number): [number, number] => [540 + (x - 540) * z / 1000, 960 + (y - 960) * z / 1000];
    const [ax, ay] = far(a[0] + Math.sin(t * 0.4) * 20, a[1], 2400), [bx, by] = far(b[0], b[1] + Math.cos(t * 0.35) * 20, 1800);
    return <>
      <Plane z={3000} noBlur><rect x={-2500} y={-3500} width={6100} height={9000} fill={tone} /></Plane>
      <Plane z={2400}><circle cx={ax} cy={ay} r={a[2] * 2.4 * (1 + 0.03 * Math.sin(t * 0.9))} fill={K.lime} /></Plane>
      <Plane z={1800}><circle cx={bx} cy={by} r={b[2] * 1.8 * (1 + 0.03 * Math.cos(t * 0.8))} fill={K.lilac} /></Plane>
    </>;
  };

export const SoftShadow: React.FC<{z: number; dz: number; children: React.ReactNode; blur?: number; opacity?: number; offset?: [number, number]}> =
  ({z, dz, children, blur = 26, opacity = 0.32, offset = [26, 34]}) =>
    <Shadow z={z} dz={dz} offset={offset} blur={blur} opacity={opacity} tint={INK_TINT}>{children}</Shadow>;

/** A phone in the site's style: white body, grape outline, hard shadow, rounded screen. */
export const BrandPhone: React.FC<{x: number; y: number; w: number; h: number; children?: React.ReactNode; dark?: boolean}> = ({x, y, w, h, children, dark}) => <g>
  <rect x={x + 16} y={y + 20} width={w} height={h} rx={72} fill={K.grape} />
  <rect x={x} y={y} width={w} height={h} rx={72} fill={dark ? K.grape : K.card} stroke={K.grape} strokeWidth={9} />
  {!dark && <rect x={x + 22} y={y + 22} width={w - 44} height={h - 44} rx={54} fill="#FBF9FF" stroke={K.grape} strokeWidth={4} />}
  {!dark && <rect x={x + w / 2 - 70} y={y + 34} width={140} height={34} rx={17} fill={K.grape} />}
  {dark && <Logo x={x + w / 2} y={y + h / 2} r={54} />}
  {children}
</g>;

export const PROFILES = [
  {name: 'Ava, 27', skin: '#F1C7A6', hair: '#6B3A24', bg: K.lilac, style: 'long' as const, chips: ['Coffee', 'Concerts']},
  {name: 'Noor, 25', skin: '#C98F6A', hair: '#1E1414', bg: K.sky, style: 'bun' as const, chips: ['Pilates', 'Sushi']},
  {name: 'Kate, 29', skin: '#F6D2B8', hair: '#D9A441', bg: K.blush, style: 'bob' as const, chips: ['Hiking', 'Dogs']},
  {name: 'Mia, 26', skin: '#E0B08E', hair: '#3A2416', bg: K.lime, style: 'long' as const, chips: ['Books', 'Wine']},
  {name: 'Zoe, 28', skin: '#8D5A43', hair: '#140E10', bg: K.lilac, style: 'bun' as const, chips: ['Running', 'Tacos']},
  {name: 'Lia, 24', skin: '#F1C7A6', hair: '#2A1A14', bg: K.sky, style: 'bob' as const, chips: ['Art', 'Brunch']},
];

export const ProfileCard: React.FC<{p: typeof PROFILES[number]}> = ({p}) => <Card x={280} y={390} w={520} h={610} r={44}>
  <rect x={26} y={26} width={468} height={405} rx={30} fill={p.bg} stroke={K.grape} strokeWidth={5} />
  <Avatar x={260} y={228} r={145} skin={p.skin} hair={p.hair} bg={p.bg} style={p.style} />
  <text x={36} y={500} fontFamily={DISPLAY} fontSize={54} fill={K.grape}>{p.name}</text>
  {p.chips.map((c, i) => <Pill key={c} x={110 + i * 190} y={560} text={c} size={28} />)}
</Card>;

/** The site's three example dates, exactly as on noswipe.app. */
export const DATES = {
  maya: {name: 'Maya', app: 'Hinge', skin: '#F1C7A6', hair: '#6B3A24', bg: K.blush, style: 'bob' as const,
    summary: 'Opened on her dog photo. Talked hiking and the best tacos in town. She suggested Saturday.',
    chips: [['Hiking', 100], ['Her dog Biscuit', 318], ['Tacos', 534]] as [string, number][], when: 'Sat · 11:00 AM', where: 'Coffee + walk, the park'},
  jess: {name: 'Jess', app: 'Bumble', skin: '#F6D2B8', hair: '#D9A441', bg: K.blush, style: 'long' as const,
    summary: 'She messaged first about your travel photo. Swapped travel stories, she\'s a big live-music person.',
    chips: [['Travel', 92], ['Live music', 268], ['Natural wine', 470]] as [string, number][], when: 'Thu · 8:00 PM', where: 'Wine bar, after work'},
  priya: {name: 'Priya', app: 'Tinder', skin: '#C98F6A', hair: '#1E1414', bg: K.blush, style: 'long' as const,
    summary: 'Bonded over being terrible at Mario Kart. Competitive streak, wants a rematch in person.',
    chips: [['Games', 92], ['Climbing', 252], ['Spicy food', 432]] as [string, number][], when: 'Sun · 4:00 PM', where: 'Climbing gym, then dinner'},
};
export type DateKey = keyof typeof DATES;

/** The site's date card. Top-left at (110, y). */
export const DateCard: React.FC<{who: DateKey; y?: number}> = ({who, y = 490}) => {
  const d = DATES[who];
  return <Card x={110} y={y} w={860} h={540}>
  <Avatar x={86} y={84} r={52} skin={d.skin} hair={d.hair} bg={d.bg} style={d.style} />
  <text x={160} y={78} fontFamily={SANS} fontWeight={800} fontSize={46} fill={K.grape}>{d.name}</text>
  <text x={160} y={118} fontFamily={SANS} fontWeight={600} fontSize={30} fill={K.grape3}>Matched on {d.app}</text>
  <Lines x={40} y={186} text={d.summary} max={46} size={30} lh={1.25} />
  {d.chips.map(([c, x]) => <Pill key={c} x={x} y={316} text={c} size={28} />)}
  <g transform="translate(40 364)">
    <rect width={780} height={104} rx={26} fill={K.lime} stroke={K.grape} strokeWidth={6} />
    <CalIcon x={52} y={52} s={44} />
    <text x={100} y={50} fontFamily={DISPLAY} fontSize={44} fill={K.grape}>{d.when}</text>
    <text x={100} y={88} fontFamily={SANS} fontWeight={700} fontSize={28} fill={K.grape}>{d.where}</text>
  </g>
  <Check x={58} y={506} r={18} />
  <text x={90} y={516} fontFamily={SANS} fontWeight={800} fontSize={30} fill={K.grape}>Her number, sent to you</text>
</Card>;
};

/** The site's closing card: "Stop swiping. Just show up." + noswipe.app, with a button press. */
export const EndCard: React.FC<{t: number; start: number; end: number}> = ({t, start, end}) => {
  const lt = t - start;
  const cam = cam3At([{t: start, x: 540, y: 960, z: 0, rot: 0, focus: 1000, aperture: 4}, {t: end, x: 540, y: 950, z: 70, rot: 0, focus: 930, aperture: 4}], t);
  return <Space cam={cam} id="ns-end" bg={K.coral}>
    <Plane z={3000} noBlur><rect x={-2500} y={-3500} width={6100} height={9000} fill={K.coral} /></Plane>
    <Plane z={1100}><Logo x={540} y={410} r={74 * pop(t, start, 9)} /></Plane>
    <Plane z={1000} noBlur>
      <g opacity={smooth(lt, 0.05, 0.25)} transform={`translate(0 ${(1 - easeOut(lt, 0.05, 0.4)) * 40})`}>
        <text x={540} y={640} textAnchor="middle" fontFamily={DISPLAY} fontSize={112} fill={K.grape}>Stop swiping.</text>
        <text x={540} y={770} textAnchor="middle" fontFamily={DISPLAY} fontSize={112} fill={K.grape}>Just show up.</text>
      </g>
    </Plane>
    <Plane z={940} noBlur>
      <Pill x={540} y={950} text="noswipe.app" size={60} fill={K.lime} font="display" shadow weight={400} scale={pop(t, start + 0.35, 9) * (1 - 0.07 * hold(t, end - 0.9, end - 0.8, end - 0.7, end - 0.55))} />
      {t > end - 0.85 && <circle cx={640} cy={960} r={30 + 140 * clamp((t - end + 0.85) / 0.5)} fill="none" stroke={K.grape} strokeWidth={6} opacity={1 - clamp((t - end + 0.85) / 0.5)} />}
    </Plane>
  </Space>;
};


/** Captions: Figtree in ink, the spoken word on the site's lime marker. Kept above y = 1250. */
export const Captions: React.FC<{t: number; chunks: Chunk[]; hideFrom?: number}> = ({t, chunks, hideFrom = Infinity}) => {
  const c = chunks.find((x) => t >= x.start - 0.03 && t < x.end);
  if (!c || t >= hideFrom) return null;
  const k = easeOut(t, c.start - 0.03, c.start + 0.1);
  return <div style={{position: 'absolute', left: 60, right: 60, top: 1150, textAlign: 'center', opacity: k, transform: `translateY(${(1 - k) * 10}px)`}}>
    {c.words.map((w, i) => {
      const on = t >= w.start && t < w.end + 0.05;
      return <span key={i} style={{display: 'inline-block', margin: '0 6px', padding: '0 12px', borderRadius: 12, background: on ? K.lime : 'transparent', fontFamily: SANS, fontWeight: 800, fontSize: 62,
        lineHeight: 1.25, color: K.grape, WebkitTextStroke: on ? '0px' : `10px ${K.paper}`, paintOrder: 'stroke fill'}}>{w.text.replace(/["…]/g, '')}</span>;
    })}
  </div>;
};

/** Soft CTA while the product is on screen. */
export const SoftCta: React.FC<{t: number; from: number; to: number}> = ({t, from, to}) => {
  const k = hold(t, from, from + 0.3, to - 0.3, to);
  if (k <= 0) return null;
  return <div style={{position: 'absolute', top: 280, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: k, transform: `scale(${0.9 + 0.1 * k})`}}>
    <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 40, color: K.grape, background: K.card, border: `5px solid ${K.grape}`, borderRadius: 999, padding: '10px 34px',
      boxShadow: `6px 8px 0 ${K.grape}`}}>noswipe.app</div>
  </div>;
};

/** The site's lime ticker, scrolling in the decorative bottom band (outside the ad-safe area). */
export const Ticker: React.FC<{t: number}> = ({t}) => {
  const items = ['Tinder', 'Bumble', 'Hinge', 'We swipe', 'You date'];
  const unit = 1180;
  const off = -((t * 110) % unit);
  return <div style={{position: 'absolute', left: 0, right: 0, top: 1500, height: 96, background: K.lime, borderTop: `6px solid ${K.grape}`, borderBottom: `6px solid ${K.grape}`,
    overflow: 'hidden', transform: 'rotate(-2deg) scale(1.06)'}}>
    <div style={{position: 'absolute', left: off, top: 12, whiteSpace: 'nowrap', fontFamily: DISPLAY, fontSize: 52, color: K.grape}}>
      {Array.from({length: 4}, (_, r) => items.map((x, i) => <span key={`${r}-${i}`} style={{marginRight: 34}}>{x} <span style={{color: K.coral}}>●</span></span>))}
    </div>
  </div>;
};

/** Very light paper grain, fixed (no flicker), so flat fills don't look digital. */
export const Grain: React.FC = () => <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, mixBlendMode: 'multiply', opacity: 0.06, pointerEvents: 'none'}}>
  <filter id="nsgrain"><feTurbulence type="fractalNoise" baseFrequency={0.8} numOctaves={2} seed={7} /><feColorMatrix type="saturate" values="0" /></filter>
  <rect width="100%" height="100%" filter="url(#nsgrain)" />
</svg>;

