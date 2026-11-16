import { view, style, seg, ease, line, arcPts, strokePathPartial, label, dot } from './util.js';

// Eratosthenes. Rays arrive from the lower right; Syene lies where they are radial.
// The 7.2 degree angle is drawn exaggerated (26 degrees) so the shadow can be seen.
export default function draw(ctx, { w, h, p, ink }) {
  const v = view(w, h);
  style(ctx, ink);
  const R = 0.6, cx = 0.06, cy = 0.44;
  const half = (13 * Math.PI) / 180;
  const sg = half; // Syene's radial direction (canvas angle, y down)
  const al = -half; // Alexandria's
  const sun = [Math.cos(sg), Math.sin(sg)]; // direction towards the Sun
  const nrm = [-sun[1], sun[0]];
  const P = (x, y) => [v.X(x), v.Y(y)];
  const C = P(cx, cy);
  const rr = v.L(R);
  const polar = (a, r) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const S = polar(sg, R);
  const A = polar(al, R);
  const L = 0.17;
  const T = polar(al, R + L);
  const rel = (q) => [q[0] - cx, q[1] - cy];
  const dotp = (a, b) => a[0] * b[0] + a[1] * b[1];

  // surface arc
  strokePathPartial(ctx, arcPts(C[0], C[1], rr, -0.66, 0.66, 80), ease(seg(p, 0, 0.2)));

  // radii
  const fr = ease(seg(p, 0.15, 0.38));
  line(ctx, C[0], C[1], v.X(S[0]), v.Y(S[1]), fr);
  line(ctx, C[0], C[1], v.X(A[0]), v.Y(A[1]), fr);
  dot(ctx, C[0], C[1], 2.2 * fr);

  // parallel rays: offset o along the normal, from far out to the surface
  const far = 0.86;
  const ray = (o, tauEnd, f, tauStart = far) => {
    const s0 = [cx + o * nrm[0] + tauStart * sun[0], cy + o * nrm[1] + tauStart * sun[1]];
    const s1 = [cx + o * nrm[0] + tauEnd * sun[0], cy + o * nrm[1] + tauEnd * sun[1]];
    line(ctx, v.X(s0[0]), v.Y(s0[1]), v.X(s1[0]), v.Y(s1[1]), f);
  };
  const fray = ease(seg(p, 0.3, 0.58));
  for (const o of [-0.16, 0.17, 0.3]) ray(o, Math.sqrt(R * R - o * o), fray);
  // Syene: straight down the well
  const wd = 0.08;
  ray(0, R - wd, fray);
  const fw = ease(seg(p, 0.5, 0.62));
  const wq = 0.012;
  const wp = (tau, o) => [v.X(cx + o * nrm[0] + tau * sun[0]), v.Y(cy + o * nrm[1] + tau * sun[1])];
  const w0a = wp(R, wq), w0b = wp(R, -wq), w1a = wp(R - wd, wq), w1b = wp(R - wd, -wq);
  line(ctx, w0a[0], w0a[1], w1a[0], w1a[1], fw);
  line(ctx, w0b[0], w0b[1], w1b[0], w1b[1], fw);
  line(ctx, w1a[0], w1a[1], w1b[0], w1b[1], fw);

  // Alexandria: ray over the stick tip, down to the ground
  const oT = dotp(rel(T), nrm);
  const tauG = Math.sqrt(R * R - oT * oT);
  const G = [cx + oT * nrm[0] + tauG * sun[0], cy + oT * nrm[1] + tauG * sun[1]];
  const aG = Math.atan2(G[1] - cy, G[0] - cx);
  ray(oT, tauG, ease(seg(p, 0.45, 0.72)));
  ctx.lineWidth = 2;
  line(ctx, v.X(A[0]), v.Y(A[1]), v.X(T[0]), v.Y(T[1]), ease(seg(p, 0.55, 0.68)));
  strokePathPartial(ctx, arcPts(C[0], C[1], rr, al, aG, 12), ease(seg(p, 0.68, 0.8)));
  ctx.lineWidth = 1.25;

  // the equal angles
  const fa = ease(seg(p, 0.78, 0.92));
  strokePathPartial(ctx, arcPts(C[0], C[1], v.L(0.2), al, sg, 16), fa);
  const Tc = [v.X(T[0]), v.Y(T[1])];
  strokePathPartial(ctx, arcPts(Tc[0], Tc[1], v.L(0.075), Math.PI - half, Math.PI + half, 12), fa);

  const fl = ease(seg(p, 0.9, 1));
  if (fl > 0) {
    ctx.save();
    ctx.globalAlpha = fl;
    label(ctx, '7.2°', C[0] + v.L(0.3), C[1]);
    label(ctx, '7.2°', Tc[0] + v.L(0.14) * Math.cos(3.75), Tc[1] + v.L(0.14) * Math.sin(3.75));
    ctx.restore();
  }
}
