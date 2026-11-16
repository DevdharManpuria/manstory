import { view, style, seg, ease, strokePathPartial, dot, TAU, lerp } from './util.js';

const FX = 0.668, FY = 0.5; // the Sun, common focus
const ORBITS = [
  { a: 0.16, e: 0.1, T: 7, m0: 0.6 },
  { a: 0.28, e: 0.25, T: 11, m0: 2.4 },
  { a: 0.42, e: 0.4, T: 16, m0: 4.4 },
];

// Position relative to the focus for eccentric anomaly E (perihelion to the right).
function pos(o, E) {
  const b = o.a * Math.sqrt(1 - o.e * o.e);
  return [o.a * (Math.cos(E) - o.e), b * Math.sin(E)];
}
function solveE(M, e) {
  let E = M + e * Math.sin(M);
  for (let i = 0; i < 6; i++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  return E;
}
function orbitPts(v, o, E0, E1, n) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const q = pos(o, lerp(E0, E1, i / n));
    pts.push([v.X(FX + q[0]), v.Y(FY + q[1])]);
  }
  return pts;
}
// Eccentric anomaly for a mean anomaly M (so equal M spans are equal times, hence equal areas).
function sectorPath(ctx, v, o, M0, M1) {
  const E0 = solveE(M0, o.e), E1 = solveE(M1, o.e);
  const pts = orbitPts(v, o, E0, E1, 24);
  ctx.beginPath();
  ctx.moveTo(v.X(FX), v.Y(FY));
  for (const q of pts) ctx.lineTo(q[0], q[1]);
  ctx.closePath();
  return pts;
}

export default function draw(ctx, { w, h, p, t, ink }) {
  const v = view(w, h);
  style(ctx, ink);

  // Ellipses, inner to outer.
  ORBITS.forEach((o, i) => {
    const f = ease(seg(p, 0.05 + i * 0.12, 0.4 + i * 0.12));
    if (i === 1) ctx.lineWidth = 2;
    strokePathPartial(ctx, orbitPts(v, o, 0, TAU, 120), f);
    ctx.lineWidth = 1.25;
  });

  // Equal-area sectors on the middle orbit (equal spans of mean anomaly).
  const o = ORBITS[1];
  const dM = 0.55;
  const spans = [[-dM / 2, dM / 2], [Math.PI - dM / 2, Math.PI + dM / 2]];
  spans.forEach((s, i) => {
    const f = ease(seg(p, 0.62 + i * 0.12, 0.8 + i * 0.12));
    if (f <= 0) return;
    ctx.save();
    const pts = sectorPath(ctx, v, o, s[0], s[1]);
    ctx.stroke();
    // hatching clipped to the sector
    sectorPath(ctx, v, o, s[0], s[1]);
    ctx.clip();
    ctx.lineWidth = 1;
    const gap = 5;
    const size = v.L(0.5);
    const cx = v.X(FX), cy = v.Y(FY);
    const n = Math.floor((size * 2) / gap);
    const shown = Math.floor(n * ease(seg(p, 0.72 + i * 0.12, 0.95 + i * 0.12)));
    ctx.beginPath();
    for (let k = 0; k < shown; k++) {
      const d = -size + k * gap;
      ctx.moveTo(cx + d - size, cy - size);
      ctx.lineTo(cx + d + size, cy + size);
    }
    ctx.stroke();
    ctx.restore();
  });

  // Sun.
  dot(ctx, v.X(FX), v.Y(FY), Math.max(4, v.L(0.022)) * ease(seg(p, 0, 0.08)));

  // Planets: Kepler's equation, so they are fastest at perihelion.
  ORBITS.forEach((od, i) => {
    const on = ease(seg(p, 0.45 + i * 0.1, 0.6 + i * 0.1));
    if (on <= 0) return;
    const M = od.m0 + (TAU * t) / od.T;
    const E = solveE(M, od.e);
    const q = pos(od, E);
    dot(ctx, v.X(FX + q[0]), v.Y(FY + q[1]), 3.4 * on);
  });
}
