// Easing helpers. All motion is a pure function of the frame, so every frame renders the same.

export const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (f: number, a: number, b: number) => {
  const x = clamp((f - a) / (b - a));
  return x * x * (3 - 2 * x);
};
export const easeOut = (f: number, a: number, b: number) => 1 - Math.pow(1 - clamp((f - a) / (b - a)), 3);
/** Up and back down: 0 → 1 between a..b, holds, 1 → 0 between c..d. */
export const hold = (f: number, a: number, b: number, c: number, d: number) => smooth(f, a, b) * (1 - smooth(f, c, d));
export const pulse = (f: number, center: number, width: number) => Math.max(0, 1 - Math.abs(f - center) / width);
/** Overshooting pop for things that land: 0 → ~1.12 → 1. */
export const springIn = (f: number, a: number, dur = 12) => {
  const x = clamp((f - a) / dur);
  if (x <= 0) return 0;
  return 1 + Math.sin(x * Math.PI * 1.5) * Math.exp(-x * 4.2) * 0.45 - Math.exp(-x * 9) * (1 - x);
};
