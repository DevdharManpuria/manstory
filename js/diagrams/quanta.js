import { view, style, seg, ease, line, arcPts, strokePathPartial, dot, TAU } from './util.js';

export default function draw(ctx, { w, h, p, t, ink }) {
  const v = view(w, h);
  style(ctx, ink);
  const sx = 0.06, sy = 0.5;
  const bx = 0.38, scx = 0.8;
  const slits = [0.42, 0.58];
  const sw = 0.0125;
  const lam = 0.055;
  const ph = (t / 7) % 1;

  dot(ctx, v.X(sx), v.Y(sy), 3.2 * ease(seg(p, 0, 0.08)));

  // incident circular wavefronts
  const inc = ease(seg(p, 0.05, 0.35));
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, v.X(bx), h);
  ctx.clip();
  for (let i = 0; i < 7; i++) {
    const r = (i + ph) * lam;
    if (r <= 0.001 || r > 0.36 * inc + 0.001) continue;
    strokePathPartial(ctx, arcPts(v.X(sx), v.Y(sy), v.L(r), -0.7, 0.7, 40), 1);
  }
  ctx.restore();

  // barrier with two slits
  const fb = ease(seg(p, 0.25, 0.42));
  const segs = [
    [0.08, slits[0] - sw],
    [slits[0] + sw, slits[1] - sw],
    [slits[1] + sw, 0.92],
  ];
  ctx.lineWidth = 2;
  for (const s of segs) line(ctx, v.X(bx), v.Y(s[0]), v.X(bx), v.Y(s[1]), fb);
  ctx.lineWidth = 1.25;

  // wavefronts from each slit
  const out = ease(seg(p, 0.4, 0.78));
  ctx.save();
  ctx.beginPath();
  ctx.rect(v.X(bx) + 1, v.Y(0.06), v.X(scx) - v.X(bx) - 1, v.L(0.88));
  ctx.clip();
  for (const sy2 of slits) {
    for (let i = 0; i < 12; i++) {
      const r = (i + ph) * lam;
      if (r <= 0.001 || r > 0.5 * out + 0.001) continue;
      strokePathPartial(ctx, arcPts(v.X(bx), v.Y(sy2), v.L(r), -1.4, 1.4, 56), 1);
    }
  }
  ctx.restore();

  // screen
  ctx.lineWidth = 2;
  line(ctx, v.X(scx), v.Y(0.06), v.X(scx), v.Y(0.94), ease(seg(p, 0.65, 0.8)));
  ctx.lineWidth = 1.25;

  // intensity: cos^2 fringes under a sinc^2 envelope
  const pts = [];
  const N = 220;
  for (let i = 0; i <= N; i++) {
    const y = 0.06 + (0.88 * i) / N;
    const d = y - 0.5;
    const c = Math.cos(Math.PI * d / 0.1);
    const a = Math.PI * d / 0.3;
    const sinc = Math.abs(a) < 1e-6 ? 1 : Math.sin(a) / a;
    const I = c * c * sinc * sinc;
    pts.push([v.X(scx) + v.L(0.17) * I, v.Y(y)]);
  }
  strokePathPartial(ctx, pts, ease(seg(p, 0.78, 1)));
}
