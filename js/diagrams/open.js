import { view, style, seg, ease, line, label } from './util.js';

// [x, strong, letter]
const LINES = [
  [0.11, 0, ''], [0.17, 0, ''], [0.24, 1, 'C'], [0.31, 0, ''], [0.4, 1, 'D'], [0.46, 0, ''],
  [0.53, 0, ''], [0.62, 1, 'F'], [0.69, 0, ''], [0.76, 0, ''], [0.84, 1, 'H'], [0.9, 0, ''],
];

export default function draw(ctx, { w, h, p, ink }) {
  const v = view(w, h);
  style(ctx, ink);
  const x0 = 0.04, x1 = 0.96, top = 0.42, bot = 0.62;

  // strip
  const f = ease(seg(p, 0, 0.22));
  ctx.lineWidth = 2;
  ctx.beginPath();
  const a = v.X(x0), b = v.X(x1), ty = v.Y(top), by = v.Y(bot);
  if (f > 0) {
    ctx.moveTo(a, ty);
    ctx.lineTo(a + (b - a) * f, ty);
    ctx.moveTo(a, by);
    ctx.lineTo(a + (b - a) * f, by);
    ctx.stroke();
    line(ctx, a, ty, a, by, ease(seg(p, 0, 0.08)));
    line(ctx, b, ty, b, by, ease(seg(p, 0.2, 0.28)));
  }
  ctx.lineWidth = 1.25;

  // wavelength axis with ticks
  const ay = v.Y(0.71);
  const fa = ease(seg(p, 0.05, 0.3));
  line(ctx, a, ay, b, ay, fa);
  const nt = 23;
  for (let i = 0; i <= nt; i++) {
    const x = x0 + ((x1 - x0) * i) / nt;
    if ((i / nt) > fa) break;
    const long = i % 5 === 0;
    line(ctx, v.X(x), ay, v.X(x), ay + v.L(long ? 0.035 : 0.02));
  }

  // absorption lines, left to right
  LINES.forEach(([x, strong, letter], i) => {
    const s0 = 0.28 + (i / LINES.length) * 0.62;
    const fl = ease(seg(p, s0, s0 + 0.1));
    if (fl <= 0) return;
    const X = v.X(x);
    ctx.lineWidth = strong ? 2 : 1.25;
    line(ctx, X, by, X, by + (ty - by) * fl);
    ctx.lineWidth = 1.25;
    const reach = letter ? 0.32 : 0.35 + ((i * 7) % 4) * 0.012;
    const fd = ease(seg(fl, 0.5, 1));
    line(ctx, X, ty, X, ty + (v.Y(reach) - ty) * fd);
    if (letter && fd > 0.99) label(ctx, letter, X, v.Y(reach) - 12);
  });
}
