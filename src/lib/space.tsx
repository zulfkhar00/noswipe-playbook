import React, {createContext, useContext} from 'react';
import {clamp, smooth} from './motion';

// 2.5D space: flat illustrated planes placed at real depths, seen through a perspective camera.
// A plane at depth z is drawn at scale f / (z - cam.z), so dollying the camera forward makes near
// planes grow and fly past while far planes barely move. Plane content uses world units: at
// depth z = f (with the camera at z = 0) one world unit is one screen pixel.

export const W = 1080, H = 1920;

export type Cam3 = {x: number; y: number; z: number; rot: number; f: number; focus: number; aperture: number};
export type Key3 = {t: number; x: number; y: number; z: number; rot?: number; f?: number; focus?: number; aperture?: number};

const Ctx = createContext<{cam: Cam3; id: string}>({cam: {x: 540, y: 960, z: 0, rot: 0, f: 1000, focus: 1000, aperture: 0}, id: 's'});

export const Space: React.FC<{cam: Cam3; id: string; bg?: string; children: React.ReactNode}> = ({cam, id, bg, children}) =>
  <Ctx.Provider value={{cam, id}}>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0, background: bg}}>{children}</svg>
  </Ctx.Provider>;

/** One flat layer at depth `z`. Planes nearer than the camera's near limit fade out instead of popping. */
export const Plane: React.FC<{z: number; children: React.ReactNode; noBlur?: boolean; opacity?: number}> = ({z, children, noBlur, opacity = 1}) => {
  const {cam, id} = useContext(Ctx);
  const d = z - cam.z;
  if (d < 25) return null;
  const s = cam.f / d;
  // Thin-lens circle of confusion: blur grows with distance from the focus plane, relative to depth.
  const blur = noBlur ? 0 : Math.min(14, cam.aperture * Math.abs(d - cam.focus) / d);
  const fade = smooth(d, 25, 110);
  const fid = `${id}-z${Math.round(z)}`;
  return <g opacity={opacity * fade} filter={blur > 1.2 ? `url(#${fid})` : undefined}>
    {blur > 1.2 && <defs><filter id={fid} filterUnits="userSpaceOnUse" x={-100} y={-100} width={W + 200} height={H + 200}><feGaussianBlur stdDeviation={blur.toFixed(2)} /></filter></defs>}
    <g transform={`translate(${W / 2} ${H / 2}) rotate(${cam.rot}) scale(${s}) translate(${-cam.x} ${-cam.y})`}>{children}</g>
  </g>;
};

/**
 * A soft shadow that `children` (drawn at depth z) cast onto a surface `dz` behind them. The
 * silhouette is placed at z + dz and pre-scaled so it lines up with the object from the origin,
 * then offset along the light and blurred. Because it lives on its own deeper plane, it slides
 * against the object as the camera moves, which is what sells the gap between layers.
 * `tint` is the shadow colour (0–1 RGB). Render it after the receiving surface and before the object.
 */
export const Shadow: React.FC<{z: number; dz: number; offset?: [number, number]; blur?: number; opacity?: number; tint?: [number, number, number]; children: React.ReactNode}> =
  ({z, dz, offset = [24, 36], blur = 14, opacity = 0.5, tint = [0.02, 0.01, 0.05], children}) => {
    const {cam, id} = useContext(Ctx);
    const d = z + dz - cam.z;
    if (d < 25) return null;
    const k = (z + dz) / z;
    const s = cam.f / d;
    const fid = `${id}-sh${Math.round(z)}-${Math.round(dz)}`;
    return <g filter={`url(#${fid})`} opacity={smooth(d, 25, 110)}>
      <defs><filter id={fid} filterUnits="userSpaceOnUse" x={-200} y={-200} width={W + 400} height={H + 400}>
        <feColorMatrix type="matrix" values={`0 0 0 0 ${tint[0]}  0 0 0 0 ${tint[1]}  0 0 0 0 ${tint[2]}  0 0 0 ${opacity} 0`} />
        <feGaussianBlur stdDeviation={(blur * s * k).toFixed(2)} />
      </filter></defs>
      <g transform={`translate(${W / 2} ${H / 2}) rotate(${cam.rot}) scale(${s}) translate(${-cam.x} ${-cam.y})`}>
        <g transform={`translate(${offset[0] * k} ${offset[1] * k}) translate(540 960) scale(${k}) translate(-540 -960)`}>{children}</g>
      </g>
    </g>;
  };

/**
 * Splits one drawing into parts on nearby planes (e.g. body, head, hat brim, hands) so camera
 * moves give it volume. Each part is pre-scaled so the stack lines up exactly when the camera is
 * at `refZ`, and drifts apart in proportion to how far the camera moves from there.
 */
export const Stack: React.FC<{z: number; refZ: number; anchor: [number, number]; parts: {dz: number; node: React.ReactNode}[]}> = ({z, refZ, anchor, parts}) => <>
  {[...parts].sort((a, b) => a.dz - b.dz).map((p, i) => {
    const zp = z - p.dz;
    const k = (zp - refZ) / (z - refZ);
    return <Plane key={i} z={zp} noBlur>
      <g transform={`translate(${anchor[0]} ${anchor[1]}) scale(${k}) translate(${-anchor[0]} ${-anchor[1]})`}>{p.node}</g>
    </Plane>;
  })}
</>;

const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

/** Camera keyframes with eased segments. */
export const cam3At = (keys: Key3[], t: number): Cam3 => {
  const full = (k: Key3): Cam3 => ({x: k.x, y: k.y, z: k.z, rot: k.rot ?? 0, f: k.f ?? 1000, focus: k.focus ?? 1000, aperture: k.aperture ?? 8});
  if (t <= keys[0].t) return full(keys[0]);
  for (let i = 0; i < keys.length - 1; i++) {
    const a = full(keys[i]), b = full(keys[i + 1]);
    if (t <= keys[i + 1].t) {
      const k = ease(clamp((t - keys[i].t) / (keys[i + 1].t - keys[i].t)));
      const l = (p: number, q: number) => p + (q - p) * k;
      return {x: l(a.x, b.x), y: l(a.y, b.y), z: l(a.z, b.z), rot: l(a.rot, b.rot), f: l(a.f, b.f), focus: l(a.focus, b.focus), aperture: l(a.aperture, b.aperture)};
    }
  }
  return full(keys[keys.length - 1]);
};
