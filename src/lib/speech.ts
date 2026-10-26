import {hold} from './motion';

// Narration timing for captions and lip-sync. Lines come from the audio script's timeline.json;
// words/mouth are exact when the take came with ElevenLabs character timestamps.

export type Word = {text: string; start: number; end: number};
/** A narration line. `words`/`mouth` exist when the take came with ElevenLabs character timestamps. */
export type Line = {file: string; start: number; duration: number; text: string; words?: Word[]; mouth?: [number, number][]};

/** Word timings: exact from alignment when available, otherwise estimated from word length. */
export const wordsOf = (lines: Line[]): Word[][] => lines.map((l) => l.words ?? estimateWords(l));

/** Lip-sync: mouth openness 0–1 at time t, interpolated between alignment keyframes. */
export const mouthOf = (lines: Line[]) => (t: number) => {
  const l = lines.find((x) => x.mouth && t >= x.start - 0.05 && t <= x.start + x.duration + 0.1);
  if (!l?.mouth) return 0;
  const m = l.mouth;
  const i = m.findIndex((k) => k[0] > t);
  if (i <= 0) return 0;
  const [t0, a] = m[i - 1], [t1, b] = m[i];
  const k = Math.max(0, Math.min(1, (t - t0) / Math.max(0.001, t1 - t0)));
  return a + (b - a) * (k * k * (3 - 2 * k));
};

const estimateWords = (l: Line): Word[] => {
  const parts = l.text.replace(/"/g, '').replace(/\.\.\./g, '…').split(' ').filter((w) => w !== '…');
  const weight = (w: string) => w.replace(/[^\p{L}\p{N}']/gu, '').length + 2.5 + (/[.,?!…]$/.test(w) ? 4 : 0);
  const total = parts.reduce((a, w) => a + weight(w), 0);
  const span = Math.max(0.2, l.duration - 0.2);
  let acc = 0;
  return parts.map((w) => {
    const start = l.start + 0.08 + (acc / total) * span;
    acc += weight(w);
    return {text: w, start, end: l.start + 0.08 + (acc / total) * span};
  });
};

export const speechOf = (lines: Line[]) => (t: number) =>
  Math.max(0, ...lines.map((l) => hold(t, l.start - 0.12, l.start, l.start + l.duration, l.start + l.duration + 0.2)));

export type Chunk = {words: Word[]; start: number; end: number};
export const chunksOf = (lines: Line[], words: Word[][]): Chunk[] => words.flatMap((ws, li) => {
  const out: Chunk[] = [];
  let cur: Word[] = [];
  ws.forEach((w, i) => {
    cur.push(w);
    if (cur.length >= 3 || /[.,?!…:]$/.test(w.text) || i === ws.length - 1) { out.push({words: cur, start: cur[0].start, end: 0}); cur = []; }
  });
  out.forEach((c, i) => { c.end = i + 1 < out.length ? out[i + 1].start : lines[li].start + lines[li].duration + 0.12; });
  return out;
});


/** Greedy word wrap by character count. */
export const wrap = (text: string, max: number) => {
  const out: string[] = [];
  let line = '';
  for (const w of text.split(' ')) {
    const test = line ? `${line} ${w}` : w;
    if (test.length > max && line) { out.push(line); line = w; } else line = test;
  }
  if (line) out.push(line);
  return out;
};
