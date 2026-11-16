import { view, style, seg, ease, strokePathPartial, circle, arcPts, dot, lerp, TAU } from './util.js';

const EX = 0.2, EY = 0.5, MX = 0.78, MY = 0.5;
const CTRL = [
  [0.2, 0.415], [0.32, 0.345], [0.45, 0.33], [0.55, 0.38], [0.65, 0.5], [0.7, 0.6],
  [0.78, 0.635], [0.88, 0.6], [0.91, 0.5], [0.88, 0.4], [0.78, 0.365], [0.7, 0.4],
  [0.65, 0.5], [0.55, 0.62], [0.45, 0.67], [0.32, 0.655], [0.2, 0.585],
];

function catmull(pts, per) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < per; k++) {
      const s = k / per, s2 = s * s, s3 = s2 * s;
      out.push([
        0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * s + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * s2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * s3),
        0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * s + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * s2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * s3),
      ]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
const PATH = catmull(CTRL, 14);
const LENS = [0];
for (let i = 1; i < PATH.length; i++) LENS.push(LENS[i - 1] + Math.hypot(PATH[i][0] - PATH[i - 1][0], PATH[i][1] - PATH[i - 1][1]));
const TOTAL = LENS[LENS.length - 1];
function at(f) {
  const d = Math.min(1, Math.max(0, f)) * TOTAL;
  let i = 1;
  while (i < LENS.length - 1 && LENS[i] < d) i++;
  const k = (d - LENS[i - 1]) / (LENS[i] - LENS[i - 1] || 1);
  return [lerp(PATH[i - 1][0], PATH[i][0], k), lerp(PATH[i - 1][1], PATH[i][1], k)];
}

export default function draw(ctx, { w, h, p, t, ink }) {
  const v = view(w, h);
  style(ctx, ink);
  const mp = (q) => [v.X(q[0]), v.Y(q[1])];

  // Earth and parking orbit
  dot(ctx, v.X(EX), v.Y(EY), v.L(0.04) * ease(seg(p, 0, 0.1)));
  circle(ctx, v.X(EX), v.Y(EY), v.L(0.085), ease(seg(p, 0.05, 0.22)));

  // Moon's orbit (dashed arc about Earth) and the Moon
  ctx.save();
  ctx.setLineDash([2, 6]);
  const R = MX - EX;
  strokePathPartial(ctx, arcPts(v.X(EX), v.Y(EY), v.L(R), -0.42, 0.42, 40), ease(seg(p, 0.15, 0.35)));
  ctx.restore();
  circle(ctx, v.X(MX), v.Y(MY), v.L(0.035), ease(seg(p, 0.2, 0.38)));

  // free-return path
  const f = ease(seg(p, 0.3, 0.95));
  ctx.lineWidth = 2;
  strokePathPartial(ctx, PATH.map(mp), f);
  ctx.lineWidth = 1.25;

  if (f > 0 && f < 1) {
    const q = at(f);
    dot(ctx, v.X(q[0]), v.Y(q[1]), 3.6);
  } else if (f >= 1) {
    const r = 3.6 * seg(p, 0.96, 1);
    const q = at((t / 12) % 1);
    dot(ctx, v.X(q[0]), v.Y(q[1]), r);
  }
}
