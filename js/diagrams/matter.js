import { view, style, seg, ease, strokePathPartial, line, arrowHead, label, TAU } from './util.js';

export default function draw(ctx, { w, h, p, t, ink }) {
  const v = view(w, h);
  style(ctx, ink);
  const x0 = 0.2, x1 = 0.92, y0 = 0.56;
  const AE = 0.24; // electric amplitude (vertical plane)
  const AB = 0.24; // magnetic amplitude (horizontal plane, true length)
  const d = [-0.24, 0.26]; // oblique projection of the depth direction, per unit length
  const lam = 0.37;
  const ph = (TAU * t) / 8;
  const wave = (x) => Math.sin((TAU * (x - x0)) / lam - ph);

  // travel axis
  const fa = ease(seg(p, 0, 0.2));
  line(ctx, v.X(0.1), v.Y(y0), v.X(0.95), v.Y(y0), fa);
  if (seg(p, 0.85, 1) > 0) {
    const a = ease(seg(p, 0.85, 1));
    arrowHead(ctx, v.X(0.95), v.Y(y0), 0, 10 * a);
  }
  // E and B axes at the origin
  const fe = ease(seg(p, 0.05, 0.25));
  line(ctx, v.X(x0), v.Y(y0), v.X(x0), v.Y(y0 - AE - 0.06), fe);
  line(ctx, v.X(x0), v.Y(y0), v.X(x0 + d[0] * (AB + 0.06)), v.Y(y0 + d[1] * (AB + 0.06)), fe);
  if (fe > 0.9) {
    label(ctx, 'E', v.X(x0) + 10, v.Y(y0 - AE - 0.06) - 2, 'left');
    label(ctx, 'B', v.X(x0 + d[0] * (AB + 0.06)) - 10, v.Y(y0 + d[1] * (AB + 0.06)) + 4, 'right');
  }

  // curves
  const N = 160;
  const ePts = [], bPts = [];
  for (let i = 0; i <= N; i++) {
    const x = x0 + ((x1 - x0) * i) / N;
    const s = wave(x);
    ePts.push([v.X(x), v.Y(y0 - AE * s)]);
    bPts.push([v.X(x + d[0] * AB * s), v.Y(y0 + d[1] * AB * s)]);
  }
  ctx.lineWidth = 2;
  strokePathPartial(ctx, ePts, ease(seg(p, 0.15, 0.5)));
  ctx.lineWidth = 1.25;
  strokePathPartial(ctx, bPts, ease(seg(p, 0.35, 0.7)));

  // field arrows from the axis to each curve
  const nA = 10;
  for (let i = 0; i < nA; i++) {
    const x = x0 + 0.04 + (i * (x1 - x0 - 0.06)) / (nA - 1);
    const f = ease(seg(p, 0.5 + (i / nA) * 0.3, 0.6 + (i / nA) * 0.3));
    if (f <= 0) continue;
    const s = wave(x);
    // E: vertical
    const ex = v.X(x), ey0 = v.Y(y0), ey1 = v.Y(y0 - AE * s);
    if (Math.abs(ey1 - ey0) > 6) {
      line(ctx, ex, ey0, ex, ey0 + (ey1 - ey0) * f);
      if (f > 0.9) arrowHead(ctx, ex, ey1, ey1 < ey0 ? -Math.PI / 2 : Math.PI / 2, 5);
    }
    // B: along the depth direction
    const bx1 = v.X(x + d[0] * AB * s), by1 = v.Y(y0 + d[1] * AB * s);
    const dx = bx1 - ex, dy = by1 - ey0;
    if (Math.hypot(dx, dy) > 6) {
      line(ctx, ex, ey0, ex + dx * f, ey0 + dy * f);
      if (f > 0.9) arrowHead(ctx, bx1, by1, Math.atan2(dy, dx), 5);
    }
  }
}
