import { view, style, seg, ease, easeInOut, line, circle, lerp } from './util.js';

const NODES = [
  [0.1, 0.52], [0.26, 0.2], [0.3, 0.76], [0.4, 0.46], [0.52, 0.12],
  [0.55, 0.84], [0.66, 0.44], [0.78, 0.2], [0.9, 0.68],
];
const LINKS = [
  [0, 1], [0, 2], [0, 3], [1, 3], [1, 4], [2, 3], [2, 5], [3, 4], [3, 6],
  [3, 5], [4, 7], [4, 6], [5, 6], [5, 8], [6, 7], [6, 8], [7, 8],
];
const ROUTES = [[0, 1, 4, 7, 8], [0, 2, 5, 8]];
const NR = 0.016;

export default function draw(ctx, { w, h, p, t, ink, accent }) {
  const v = view(w, h);
  style(ctx, ink);
  const nr = v.L(NR);
  const used = new Set();
  LINKS.forEach((l, i) => {
    const f = ease(seg(p, (i / LINKS.length) * 0.42, (i / LINKS.length) * 0.42 + 0.14));
    used.add(l[0]); used.add(l[1]);
    const a = NODES[l[0]], b = NODES[l[1]];
    const ax = v.X(a[0]), ay = v.Y(a[1]), bx = v.X(b[0]), by = v.Y(b[1]);
    const d = Math.hypot(bx - ax, by - ay);
    const ux = (bx - ax) / d, uy = (by - ay) / d;
    line(ctx, ax + ux * nr, ay + uy * nr, bx - ux * nr, by - uy * nr, f);
  });
  NODES.forEach((n, i) => {
    const first = LINKS.findIndex((l) => l[0] === i || l[1] === i);
    const f = ease(seg(p, (first / LINKS.length) * 0.42, (first / LINKS.length) * 0.42 + 0.1));
    circle(ctx, v.X(n[0]), v.Y(n[1]), nr, f);
  });

  // packets, hop by hop
  const on = seg(p, 0.55, 0.75);
  if (on <= 0) return;
  const sq = 3.2;
  ROUTES.forEach((route, ri) => {
    const hops = route.length - 1;
    const per = 4 + ri * 0.8; // seconds for a full trip; slow
    const count = 3;
    for (let k = 0; k < count; k++) {
      let s = (t / (per + 3) + k / count + 0.08 + ri * 0.17) % 1;
      const u = s * hops;
      const hi = Math.min(hops - 1, Math.floor(u));
      const f = easeInOut(Math.min(1, Math.max(0, (u - hi - 0.15) / 0.7)));
      const a = NODES[route[hi]], b = NODES[route[hi + 1]];
      const x = v.X(lerp(a[0], b[0], f)), y = v.Y(lerp(a[1], b[1], f));
      const r = sq * on;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
  });
}
