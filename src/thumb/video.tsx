import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, easeOut, hold, lerp, smooth, springIn} from '../lib/motion';
import {Key3, Plane, Shadow, Space, cam3At} from '../lib/space';
import {Line, chunksOf, mouthOf, speechOf, wordsOf} from '../lib/speech';
import {MotionBlurWhen, Shot, SwipeCuts, inCut} from '../lib/shots';
import {Avatar, CalIcon, Card, Check, DISPLAY, INK_TINT, K, Lines, Logo, Pill, SANS} from '../brand/brand';
import {Guy, Thumb} from '../brand/characters';
import timeline from './timeline.json';
import {Backdrop, BrandPhone, Captions, DateCard, EndCard, Grain, PROFILES, ProfileCard, SoftCta, SoftShadow, Ticker, pop} from '../brand/scenes';

// NoSwipe demand-test ad "I'm his thumb" (~32 s). The narrator is his thumb, a comedy character.
// The look is noswipe.app animated in 2.5D: brand cards on depth planes, soft ink-tinted shadows
// between planes, hard offset shadows on the UI (as on the site), slow camera.
// Ad-safe layout: nothing critical in the top 270 px or below y = 1250.

const LINES = timeline.lines as Line[];
const B = timeline.beats as Record<string, number>;
export const NOSWIPE_FPS = 60;
export const NOSWIPE_FRAMES = Math.ceil(timeline.duration * NOSWIPE_FPS);
const WORDS = wordsOf(LINES);
const mouth = mouthOf(LINES);
const speech = speechOf(LINES);
const CHUNKS = chunksOf(LINES, WORDS);


// ---------------------------------------------------------------------------------------------
// 1 · Hook: the thumb slaps its resignation letter onto the phone.

const Hook: React.FC<{t: number}> = ({t}) => {
  const cam = cam3At([{t: 0, x: 540, y: 960, z: 0, rot: 0, focus: 1000, aperture: 6}, {t: B.burnout, x: 556, y: 948, z: 90, rot: 0.6, focus: 910, aperture: 6}], t);
  // Impact: squash, overshoot into a stretch, settle.
  const squash = Math.exp(-t * 7) * Math.cos(t * 20);
  const defiant = smooth(t, B.quit - 0.15, B.quit + 0.2);
  const count = Math.round(lerp(10630, 11000, smooth(t, B.eleven - 0.2, B.eleven + 0.9)));
  const quit = pop(t, B.quit, 9);
  const letter = <Card x={330} y={560} w={430} h={400} fill={K.paper} r={24} rot={-9} shadow={false}>
    <text x={215} y={86} textAnchor="middle" fontFamily={DISPLAY} fontSize={46} fill={K.coral}>RESIGNATION</text>
    <text x={215} y={148} textAnchor="middle" fontFamily={SANS} fontWeight={600} fontSize={32} fill={K.grape}>Effective immediately.</text>
    <text x={215} y={250} textAnchor="middle" fontFamily={DISPLAY} fontSize={92} fill={K.grape}>I quit.</text>
    <text x={215} y={330} textAnchor="middle" fontFamily={SANS} fontStyle="italic" fontWeight={600} fontSize={32} fill={K.grape2}>— Thumb</text>
  </Card>;
  const thumbPose = `translate(830 1250) rotate(-30) scale(0.9)`;
  return <Space cam={cam} id="ns-hook" bg={K.paper}>
    <Backdrop t={t} />
    <Plane z={1000}>
      <BrandPhone x={330} y={470} w={420} h={650}>
        <rect x={360} y={520} width={360} height={380} rx={34} fill={K.lilac} stroke={K.grape} strokeWidth={5} />
        <Avatar x={540} y={700} r={130} skin="#F1C7A6" hair="#6B3A24" bg={K.lilac} style="long" />
        <text x={380} y={960} fontFamily={DISPLAY} fontSize={50} fill={K.grape}>Ava, 27</text>
        <circle cx={460} cy={1050} r={42} fill={K.coral} stroke={K.grape} strokeWidth={6} />
        <circle cx={620} cy={1050} r={42} fill={K.lime} stroke={K.grape} strokeWidth={6} />
      </BrandPhone>
    </Plane>
    <SoftShadow z={900} dz={100}>{letter}</SoftShadow>
    <Plane z={900}>{letter}</Plane>
    <SoftShadow z={800} dz={100} offset={[34, 30]}><g transform={thumbPose}><Thumb mood="fed-up" t={t} /></g></SoftShadow>
    <Plane z={800}>
      <g transform={thumbPose}><Thumb mood="fed-up" t={t} squash={squash} talk={mouth(t)} sweat={0.4} lean={-7 * defiant} /></g>
      {t < 0.7 && [0, 1, 2].map((i) => <path key={i} d={`M ${790 + i * 12} ${640 + i * 60} l 60 ${-20 + i * 20}`} stroke={K.grape} strokeWidth={9} strokeLinecap="round" opacity={1 - smooth(t, 0.3, 0.7)} />)}
    </Plane>
    {/* Headline on its own plane, just in front of the phone. */}
    <Plane z={960} noBlur>
      {quit <= 0 ? <g>
        <text x={540} y={355} textAnchor="middle" fontFamily={DISPLAY} fontSize={118} fill={K.grape}>{count.toLocaleString('en-US')}</text>
        <text x={540} y={425} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={44} fill={K.grape}>swipes this year</text>
      </g> : <g transform="translate(540 370) rotate(-3)">
        <rect x={-270} y={-100} width={540 * Math.min(1, quit)} height={150} rx={14} fill={K.lime} />
        {['I', ' ', 'Q', 'U', 'I', 'T', '.'].map((ch, i) => {
          const k = pop(t, B.quit + i * 0.035, 8);
          return <text key={i} x={-230 + [0, 50, 95, 205, 300, 350, 440][i]} y={30 + (1 - Math.min(1, k)) * 40} fontFamily={DISPLAY} fontSize={150} fill={K.grape} opacity={Math.min(1, k * 2)}>{ch}</text>;
        })}
      </g>}
    </Plane>
  </Space>;
};

// ---------------------------------------------------------------------------------------------
// 2 · Burnout: the swipe stack, a match that dies at "hey", and 1 AM, again.

const Burnout: React.FC<{t: number}> = ({t}) => {
  const chatAt = B.hey - 0.3;
  const phase = t < chatAt ? 'swipe' : t < B.oneam - 0.1 ? 'chat' : 'night';
  if (phase === 'swipe') {
    const cam = cam3At([{t: B.burnout, x: 540, y: 960, z: 40, rot: -0.6, focus: 960, aperture: 6}, {t: chatAt, x: 548, y: 948, z: 110, rot: 0.4, focus: 890, aperture: 6}], t);
    const match = pop(t, B.burnout + 1.5, 10);
    return <Space cam={cam} id="ns-swipe" bg={K.paper}>
      <Backdrop t={t} a={[900, 600, 360]} b={[160, 1250, 320]} />
      {[...PROFILES].reverse().map((p, ri) => {
        const i = PROFILES.length - 1 - ri;
        const go = B.burnout + 0.2 + i * 0.34;
        const k = easeIn(t, go, go + 0.32);
        const dir = i % 2 ? 1 : -1;
        const z = 1000 + i * 45;
        if (k >= 1) return null;
        const node = <g transform={`translate(${dir * 980 * k} ${-80 * k}) rotate(${dir * 24 * k} 540 1060)`}><ProfileCard p={p} /></g>;
        return <React.Fragment key={p.name}>
          {i < PROFILES.length - 1 && <SoftShadow z={z} dz={45} opacity={0.22}>{node}</SoftShadow>}
          <Plane z={z}>{node}</Plane>
        </React.Fragment>;
      })}
      {match > 0 && <Plane z={880} noBlur><g transform={`translate(540 520) scale(${match}) rotate(-4)`}>
        <Pill x={0} y={0} text="It's a match!" size={64} fill={K.lime} font="display" shadow weight={400} />
      </g></Plane>}
    </Space>;
  }
  if (phase === 'chat') {
    const cam = cam3At([{t: chatAt, x: 540, y: 960, z: 30, rot: 0.5, focus: 970, aperture: 7}, {t: B.oneam, x: 530, y: 970, z: 100, rot: -0.5, focus: 900, aperture: 7}], t);
    const bubbles = [
      {me: true, text: 'hey', at: chatAt + 0.15, y: 470, z: 1000},
      {me: false, text: 'hey', at: B.hey + 0.1, y: 610, z: 1060},
      {me: true, text: "how's your week going?", at: B.hey + 0.5, y: 750, z: 960},
    ];
    const tumble = smooth(t, B.nothing + 0.15, B.nothing + 1.3);
    return <Space cam={cam} id="ns-chat" bg={K.paper}>
      <Backdrop t={t} a={[180, 620, 340]} b={[900, 1240, 340]} />
      <Plane z={1200}><BrandPhone x={250} y={330} w={580} h={900} /></Plane>
      {bubbles.map((b, i) => {
        const k = pop(t, b.at, 9);
        if (k <= 0) return null;
        const w = 60 + b.text.length * 26;
        const x = b.me ? 790 - w : 290;
        const node = <g transform={`translate(${x + (b.me ? w : 0)} ${b.y + 50}) scale(${k}) translate(${-(b.me ? w : 0)} -50)`}>
          <rect x={10} y={12} width={w} height={100} rx={40} fill={K.grape} />
          <rect width={w} height={100} rx={40} fill={b.me ? K.coral : K.lilac} stroke={K.grape} strokeWidth={6} />
          <text x={30} y={64} fontFamily={SANS} fontWeight={700} fontSize={44} fill={K.grape}>{b.text}</text>
        </g>;
        return <React.Fragment key={i}><SoftShadow z={b.z} dz={1200 - b.z}>{node}</SoftShadow><Plane z={b.z}>{node}</Plane></React.Fragment>;
      })}
      {t >= B.nothing && <Plane z={980} noBlur>
        <text x={790} y={910} textAnchor="end" fontFamily={SANS} fontWeight={700} fontSize={34} fill={K.grape3} opacity={smooth(t, B.nothing, B.nothing + 0.2)}>Seen · 4 days ago</text>
        <g transform={`translate(${lerp(200, 900, tumble)} ${1000 - Math.abs(Math.sin(tumble * 9)) * 40}) rotate(${tumble * 700})`} opacity={hold(t, B.nothing + 0.1, B.nothing + 0.25, B.oneam - 0.4, B.oneam - 0.1)}>
          <circle r={44} fill="none" stroke="#B8915E" strokeWidth={7} />
          <path d="M -40 -10 Q 0 40 40 -12 M -30 28 Q 0 -30 34 24 M -8 -42 Q 12 0 -6 42" fill="none" stroke="#B8915E" strokeWidth={6} />
        </g>
      </Plane>}
    </Space>;
  }
  // 1 AM. Again: clock cards for night after night pile up behind it.
  const cam = cam3At([{t: B.oneam - 0.1, x: 560, y: 960, z: 20, rot: 0.6, focus: 980, aperture: 7}, {t: B.stop, x: 540, y: 940, z: 120, rot: -0.4, focus: 880, aperture: 7}], t);
  const nights = ['Mon', 'Tue', 'Wed', 'Thu'];
  const clock = (label: string, time: string) => <Card x={500} y={360} w={460} h={230} fill={K.lilac} r={40}>
    <text x={36} y={64} fontFamily={SANS} fontWeight={800} fontSize={32} fill={K.grape2}>{label}</text>
    <text x={230} y={170} textAnchor="middle" fontFamily={DISPLAY} fontSize={108} fill={K.grape}>{time}</text>
  </Card>;
  const thumbPose = 'translate(330 1270) rotate(9) scale(1.02)';
  return <Space cam={cam} id="ns-night" bg={K.paper}>
    <Backdrop t={t} a={[860, 520, 300]} b={[140, 1260, 300]} tone="#F4ECF8" />
    {nights.slice(0, 3).map((n, i) => {
      const k = pop(t, B.again + i * 0.12, 9);
      return k > 0 && <Plane key={n} z={1400 - i * 120}><g transform={`translate(${-60 + i * 25} ${-90 + i * 30}) scale(${k})`} opacity={0.75}>{clock(n, '1:12 AM')}</g></Plane>;
    })}
    <SoftShadow z={1000} dz={140}>{clock('Fri', '1:12 AM')}</SoftShadow>
    <Plane z={1000}>{clock('Fri', '1:12 AM')}</Plane>
    <SoftShadow z={860} dz={140} offset={[30, 26]}><g transform={thumbPose}><Thumb mood="tired" t={t} /></g></SoftShadow>
    <Plane z={860}><g transform={thumbPose}><Thumb mood="tired" t={t} sweat={1} talk={mouth(t)} wide={hold(t, B.oneam - 0.05, B.oneam + 0.15, B.oneam + 0.8, B.oneam + 1.2)}
      squash={0.18 * smooth(t, B.again - 0.1, B.again + 0.4)} lean={7 * smooth(t, B.again - 0.1, B.again + 0.5)} /></g></Plane>
  </Space>;
};
const easeIn = (f: number, a: number, b: number) => Math.pow(clamp((f - a) / (b - a)), 2.2);

// ---------------------------------------------------------------------------------------------
// 3 · He puts the phone down. NoSwipe.

const Stop: React.FC<{t: number}> = ({t}) => {
  const cam = cam3At([{t: B.stop, x: 540, y: 960, z: 30, rot: -0.5, focus: 970, aperture: 7}, {t: B.form, x: 540, y: 940, z: 120, rot: 0.5, focus: 880, aperture: 7}], t);
  const flip = clamp((t - B.down + 0.05) / 0.25);
  const relief = smooth(t, B.down + 0.3, B.down + 1.2);
  const logo = pop(t, B.logo, 10);
  const phone = <g transform={`translate(700 1055) scale(1 ${Math.abs(Math.cos(flip * Math.PI)) * 0.4 + 0.02})`}>
    <rect x={-150} y={-120} width={300} height={240} rx={40} fill={flip < 0.5 ? K.card : K.grape} stroke={K.grape} strokeWidth={9} />
    {flip < 0.5 && <rect x={-120} y={-90} width={240} height={180} rx={24} fill={K.lilac} />}
    {flip >= 0.5 && <circle r={36} fill={K.lime} stroke={K.grape} strokeWidth={6} />}
  </g>;
  return <Space cam={cam} id="ns-stop" bg={K.paper}>
    <Backdrop t={t} a={[160, 600, 360]} b={[960, 1100, 300]} />
    <Plane z={1000}><g transform="translate(540 850) scale(0.95)"><Guy t={t} relief={relief} lookDown={1 - relief} exhale={hold(t, B.down + 0.35, B.down + 0.55, B.down + 1.0, B.down + 1.3)} /></g></Plane>
    {/* The table edge in front of him, and the phone he turns face-down. */}
    <Plane z={860}>
      <rect x={-200} y={990} width={1500} height={600} fill="#F2D8B8" stroke={K.grape} strokeWidth={9} />
      <rect x={-200} y={990} width={1500} height={26} fill="#E4C39C" />
    </Plane>
    <SoftShadow z={840} dz={20} offset={[18, 10]} blur={12} opacity={0.35}>{phone}</SoftShadow>
    <Plane z={840}>{phone}</Plane>
    {logo > 0 && <Plane z={930} noBlur>
      <g transform={`translate(540 380) scale(${logo}) translate(-540 -380)`}>
        <rect x={190} y={300} width={700} height={160} rx={80} fill={K.grape} transform="translate(12 14)" />
        <rect x={190} y={300} width={700} height={160} rx={80} fill={K.card} stroke={K.grape} strokeWidth={8} />
        <Logo x={300} y={380} r={58} word />
      </g>
      <Pill x={700} y={510} text="we swipe, you date" size={36} rot={-5} scale={pop(t, B.logo + 0.35, 9)} />
    </Plane>}
  </Space>;
};

// ---------------------------------------------------------------------------------------------
// 4 · How it works: the site's step cards, pushed back as the next one arrives.

const StepRow: React.FC<{x: number; y: number; text: string; on: number; ripple?: number}> = ({x, y, text, on, ripple = 0}) => <g opacity={clamp(on * 2)}>
  <Check x={x} y={y - 12} r={22} on={on} ripple={ripple} />
  <text x={x + 44} y={y} fontFamily={SANS} fontWeight={700} fontSize={42} fill={K.grape}>{text}</text>
</g>;

const Steps: React.FC<{t: number}> = ({t}) => {
  const cam = cam3At([{t: B.form, x: 540, y: 960, z: 30, rot: -0.4, focus: 970, aperture: 6}, {t: B.card, x: 540, y: 950, z: 110, rot: 0.4, focus: 890, aperture: 6}], t);
  const back = easeOut(t, B.steps, B.steps + 0.45);
  const z1 = lerp(1000, 1450, back);
  const card2y = lerp(900, 0, easeOut(t, B.steps, B.steps + 0.45));
  const rows1 = ['You · 29, Brooklyn', 'Into · funny, outdoorsy', 'Apps · Tinder · Bumble · Hinge'];
  const rows2: [string, string][] = [['We build your profiles', 'built'], ['We swipe', 'swiped'], ['We chat', 'chatted'], ['We book the date', 'booked']];
  const card1 = <Card x={120} y={380} w={840} h={540} fill={K.sky}>
    <circle cx={80} cy={84} r={44} fill={K.card} stroke={K.grape} strokeWidth={6} />
    <text x={80} y={102} textAnchor="middle" fontFamily={DISPLAY} fontSize={50} fill={K.grape}>1</text>
    <text x={150} y={106} fontFamily={DISPLAY} fontSize={62} fill={K.grape}>Tell us your type</text>
    <Pill x={720} y={190} text="2 min" size={34} fill={K.lime} />
    {rows1.map((r, i) => { const at = B.form + 0.35 + i * 0.5; return <StepRow key={r} x={70} y={290 + i * 86} text={r} on={pop(t, at, 8)} ripple={clamp((t - at) / 0.45)} />; })}
  </Card>;
  const card2 = <g transform={`translate(0 ${card2y})`}><Card x={120} y={380} w={840} h={560} fill={K.lilac}>
    <circle cx={80} cy={84} r={44} fill={K.card} stroke={K.grape} strokeWidth={6} />
    <text x={80} y={102} textAnchor="middle" fontFamily={DISPLAY} fontSize={50} fill={K.grape}>2</text>
    <text x={150} y={106} fontFamily={DISPLAY} fontSize={62} fill={K.grape}>We do it all</text>
    {rows2.map(([r, k], i) => <StepRow key={r} x={70} y={230 + i * 86} text={r} on={pop(t, B[k], 8)} ripple={clamp((t - B[k]) / 0.45)} />)}
    <text x={70} y={540 - 40} fontFamily={SANS} fontWeight={600} fontSize={32} fill={K.grape2}>Not tips. We do it.</text>
  </Card></g>;
  return <Space cam={cam} id="ns-steps" bg={K.paper}>
    <Backdrop t={t} a={[920, 560, 340]} b={[150, 1200, 340]} />
    <Plane z={z1} opacity={lerp(1, 0.55, back)}>{card1}</Plane>
    {t >= B.steps && <><SoftShadow z={1000} dz={z1 - 1000}>{card2}</SoftShadow><Plane z={1000}>{card2}</Plane></>}
  </Space>;
};

// ---------------------------------------------------------------------------------------------
// 5 · The date: confirmation, then the date card exactly as on the site.

const DateShot: React.FC<{t: number}> = ({t}) => {
  const cam = cam3At([{t: B.card, x: 540, y: 960, z: 30, rot: 0.4, focus: 970, aperture: 6}, {t: B.retired, x: 540, y: 940, z: 120, rot: -0.4, focus: 880, aperture: 6}], t);
  const banner = pop(t, B.confirmed, 9);
  const slide = easeOut(t, B.maya - 0.55, B.maya - 0.1);
  const card = <g transform={`translate(0 ${(1 - slide) * 900})`}><DateCard who="maya" /></g>;
  const bannerNode = <g transform={`translate(540 370) scale(${banner}) translate(-540 -370)`}>
    <rect x={142} y={308} width={800} height={140} rx={70} fill={K.grape} transform="translate(12 14)" />
    <rect x={130} y={300} width={820} height={140} rx={70} fill={K.lime} stroke={K.grape} strokeWidth={8} />
    <circle cx={210} cy={370} r={44} fill={K.card} stroke={K.grape} strokeWidth={6} />
    <CalIcon x={210} y={372} s={46} />
    <text x={276} y={358} fontFamily={SANS} fontWeight={800} fontSize={40} fill={K.grape}>Text to you: date confirmed,</text>
    <text x={276} y={408} fontFamily={SANS} fontWeight={800} fontSize={40} fill={K.grape}>Sat 11 AM</text>
  </g>;
  return <Space cam={cam} id="ns-date" bg={K.paper}>
    <Backdrop t={t} a={[160, 760, 380]} b={[930, 1180, 330]} />
    {/* The site's hero phone, behind: the chat that booked it. */}
    <Plane z={1300}>
      <BrandPhone x={260} y={300} w={560} h={960}>
        <Avatar x={350} y={420} r={40} skin="#F1C7A6" hair="#6B3A24" bg={K.blush} style="bob" />
        <text x={410} y={412} fontFamily={SANS} fontWeight={800} fontSize={34} fill={K.grape}>Maya</text>
        <text x={410} y={448} fontFamily={SANS} fontWeight={600} fontSize={24} fill={K.grape3}>New match on Hinge</text>
        {[['Ok, real question: is your dog always that photogenic?', true, 520], ["lol he's a menace. but yes, always", false, 690], ['Then he\'s invited. Coffee and a walk Saturday?', true, 830], ["ok fine. sat at 11, here's my number", false, 1000]].map(([txt, me, y], i) =>
          <g key={i}><rect x={(me ? 380 : 300)} y={y as number} width={400} height={130} rx={30} fill={me ? K.coral : K.lilac} stroke={K.grape} strokeWidth={5} />
            <Lines x={(me ? 400 : 320)} y={(y as number) + 50} text={txt as string} max={26} size={30} weight={600} /></g>)}
      </BrandPhone>
    </Plane>
    {banner > 0 && <><SoftShadow z={1000} dz={300}>{bannerNode}</SoftShadow><Plane z={1000}>{bannerNode}</Plane></>}
    {slide > 0 && <><SoftShadow z={900} dz={400}>{card}</SoftShadow><Plane z={900}>{card}</Plane></>}
    {t >= B.shows && <Plane z={860} noBlur><Pill x={760} y={500} text="you just show up" size={38} rot={-6} shadow scale={pop(t, B.shows, 9)} /></Plane>}
  </Space>;
};

// ---------------------------------------------------------------------------------------------
// 6 · Retired: the thumb in a hammock. Then the site's closing card.

const Retired: React.FC<{t: number}> = ({t}) => {
  const cam = cam3At([{t: B.retired, x: 540, y: 960, z: 30, rot: -0.5, focus: 970, aperture: 7}, {t: B.endcard, x: 540, y: 950, z: 120, rot: 0.5, focus: 880, aperture: 7}], t);
  const sway = Math.sin(t * 2.2) * 3;
  const hammock = <g>
    <rect x={150} y={560} width={60} height={560} rx={20} fill={K.grape2} stroke={K.grape} strokeWidth={8} />
    <rect x={870} y={560} width={60} height={560} rx={20} fill={K.grape2} stroke={K.grape} strokeWidth={8} />
    <g transform={`rotate(${sway} 540 640)`}>
      <path d="M 180 640 Q 540 980 900 640 L 900 680 Q 540 1030 180 680 Z" fill={K.lime} stroke={K.grape} strokeWidth={8} strokeLinejoin="round" />
      {[0, 1, 2, 3, 4].map((i) => <path key={i} d={`M ${280 + i * 130} ${740 + Math.sin(i) * 20} Q ${300 + i * 130} 800 ${290 + i * 130} 860`} fill="none" stroke={K.grape} strokeWidth={4} opacity={0.4} />)}
      <g transform={`translate(560 ${820 + 16 * smooth(t, B.retired + 0.4, B.retired + 1.4)}) rotate(-74) scale(0.62)`}><Thumb mood="chill" t={t} shades={easeOut(t, B.retired, B.retired + 0.3)} talk={mouth(t) * 0.7} bandage={false} /></g>
    </g>
  </g>;
  return <Space cam={cam} id="ns-retired" bg={K.paper}>
    <Backdrop t={t} a={[800, 520, 300]} b={[200, 1220, 300]} />
    <Plane z={1150}><ellipse cx={540} cy={1180} rx={620} ry={90} fill={K.blush} /></Plane>
    <SoftShadow z={1000} dz={150} offset={[40, 60]} blur={30}>{hammock}</SoftShadow>
    <Plane z={1000}>{hammock}</Plane>
    <Plane z={900}><g transform={`translate(800 560) rotate(${8 + sway})`}>
      <path d="M -40 -60 L 40 -60 L 26 40 L -26 40 Z" fill={K.coral} stroke={K.grape} strokeWidth={7} />
      <path d="M 0 -60 L 30 -150" stroke={K.grape} strokeWidth={6} />
      <path d="M -10 -150 Q 30 -210 80 -150 Z" fill={K.sky} stroke={K.grape} strokeWidth={6} />
    </g></Plane>
  </Space>;
};

// ---------------------------------------------------------------------------------------------
// Captions: Figtree in ink, the spoken word on the site's lime marker. Kept above y = 1250.

const SHOTS: Shot[] = [
  {from: 0, render: (t) => <Hook t={t} />},
  {from: B.burnout, render: (t) => <Burnout t={t} />},
  {from: B.stop, render: (t) => <Stop t={t} />},
  {from: B.form, render: (t) => <Steps t={t} />},
  {from: B.card, render: (t) => <DateShot t={t} />},
  {from: B.retired, render: (t) => <Retired t={t} />},
  {from: B.endcard, render: (t) => <EndCard t={t} start={B.endcard} end={B.end} />},
];

/** Moments with fast motion, where motion blur is worth its render cost. */
const FAST: [number, number][] = [
  [0, 0.35], [B.burnout + 0.15, B.hey - 0.3], [B.steps - 0.05, B.steps + 0.5], [B.confirmed - 0.05, B.confirmed + 0.3], [B.maya - 0.6, B.maya - 0.05],
];
const isFast = (t: number) => inCut(t, SHOTS) || FAST.some(([a, b]) => t >= a && t < b);

/** Everything that moves, read from the (possibly sub-frame) current frame so motion blur works. */
const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  return <AbsoluteFill style={{background: K.paper}}>
    <SwipeCuts t={t} shots={SHOTS} edge={K.grape} />
  </AbsoluteFill>;
};

export const NoSwipeThumb: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const musicVol = (f: number) => lerp(0.55, 0.26, speech(f / fps));
  return <AbsoluteFill style={{background: K.paper}}>
    <Audio src={staticFile('audio/thumb-music.wav')} volume={musicVol} />
    <Audio src={staticFile('audio/thumb-sfx.wav')} volume={0.6} />
    {LINES.map((l, i) => <Sequence key={i} from={Math.round(l.start * fps)}><Audio src={staticFile(l.file)} /></Sequence>)}
    <MotionBlurWhen fast={isFast(t)}><Scene /></MotionBlurWhen>
    {t < B.endcard && <Ticker t={t} />}
    <Grain />
    <SoftCta t={t} from={B.minutes} to={B.card} />
    <Captions t={t} chunks={CHUNKS} hideFrom={B.endcard} />
  </AbsoluteFill>;
};
