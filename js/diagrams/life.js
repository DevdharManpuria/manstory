import { view, style, seg, ease, strokePathPartial, line, label, rng, lerp, TAU } from './util.js';

// ---- Tree of descent (generated once, deterministic, fitted to the left half) ----
function buildTree() {
  const rand = rng(1837);
  const branches = [];
  function grow(x, y, a, len, depth, parent) {
    const bend = (rand() - 0.5) * 0.4;
    const mx = x + Math.cos(a + bend * 0.5) * len * 0.5;
    const my = y + Math.sin(a + bend * 0.5) * len * 0.5;
    const ex = x + Math.cos(a + bend) * len;
    const ey = y + Math.sin(a + bend) * len;
    const pts = [];
    for (let i = 0; i <= 8; i++) {
      const s = i / 8;
      pts.push([
        (1 - s) * (1 - s) * x + 2 * (1 - s) * s * mx + s * s * ex,
        (1 - s) * (1 - s) * y + 2 * (1 - s) * s * my + s * s * ey,
      ]);
    }
    const b = { pts, depth, extinct: false, end: [ex, ey], ang: a + bend };
    branches.push(b);
    const maxDepth = 4;
    if (depth >= maxDepth) {
      b.extinct = rand() < 0.35;
      return;
    }
    if (depth >= 2 && rand() < 0.22) {
      b.extinct = true;
      return;
    }
    const kids = depth === 0 ? 2 : rand() < 0.2 ? 3 : 2;
    for (let k = 0; k < kids; k++) {
      const off = (k - (kids - 1) / 2) * (0.5 + rand() * 0.35) + (rand() - 0.5) * 0.25;
      grow(ex, ey, a + bend + off, len * (0.72 + rand() * 0.18), depth + 1, b);
    }
  }
  grow(0, 0, -Math.PI / 2, 1, 0, null);
  // fit to box
  let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
  for (const b of branches) for (const q of b.pts) {
    minX = Math.min(minX, q[0]); maxX = Math.max(maxX, q[0]);
    minY = Math.min(minY, q[1]); maxY = Math.max(maxY, q[1]);
  }
  const bw = 0.5, bh = 0.84;
  const sc = Math.min(bw / (maxX - minX), bh / (maxY - minY));
  const offx = 0.02 + (bw - (maxX - minX) * sc) / 2;
  const offy = 0.05;
  const map = (q) => [offx + (q[0] - minX) * sc, offy + (q[1] - minY) * sc];
  for (const b of branches) {
    b.pts = b.pts.map(map);
    b.end = map(b.end);
  }
  return branches;
}
const TREE = buildTree();

export default function draw(ctx, { w, h, p, t, ink }) {
  const v = view(w, h);
  style(ctx, ink);
  const g = seg(p, 0, 0.55);

  for (const b of TREE) {
    const s0 = (b.depth / 5) * 0.7;
    const f = ease(seg(g, s0, s0 + 0.32));
    if (f <= 0) continue;
    ctx.lineWidth = b.depth === 0 ? 2 : 1.25;
    strokePathPartial(ctx, b.pts.map((q) => [v.X(q[0]), v.Y(q[1])]), f);
    if (b.extinct && f > 0.98) {
      const k = b.pts.length;
      const a = Math.atan2(b.pts[k - 1][1] - b.pts[k - 2][1], b.pts[k - 1][0] - b.pts[k - 2][0]);
      const nx = -Math.sin(a), ny = Math.cos(a);
      const c = v.L(0.016);
      const ex = v.X(b.end[0]), ey = v.Y(b.end[1]);
      const fb = ease(seg(g, s0 + 0.3, s0 + 0.4));
      line(ctx, ex - nx * c, ey - ny * c, ex + nx * c, ey + ny * c, fb);
    }
  }
  ctx.lineWidth = 1.25;
  const root = TREE[0].pts[0];
  if (g > 0.05) label(ctx, '1', v.X(root[0]) - 12, v.Y(root[1]) - 2, 'center');

  // ---- Double helix ----
  const hp = seg(p, 0.45, 1);
  if (hp <= 0) return;
  const cx = 0.78, amp = 0.1, y0 = 0.08, y1 = 0.92, period = 0.21;
  const rot = ((TAU * t) / 10) * seg(p, 0.9, 1);
  const N = 320;
  const u1 = ease(hp);
  const gapA = 0.32;
  for (let s = 0; s < 2; s++) {
    const off = s * Math.PI;
    let run = [];
    let front = null;
    let prev = null;
    const flush = () => {
      if (run.length > 1) {
        ctx.lineWidth = front ? 2 : 1.25;
        ctx.beginPath();
        ctx.moveTo(run[0][0], run[0][1]);
        for (let i = 1; i < run.length; i++) ctx.lineTo(run[i][0], run[i][1]);
        ctx.stroke();
      }
      run = [];
    };
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      if (u > u1) break;
      const y = lerp(y0, y1, u);
      const phi = (TAU * (y - y0)) / period + off + rot;
      const isFront = Math.cos(phi) >= 0;
      // distance of phi from the nearest crossing (a multiple of pi)
      const dc = Math.abs(((phi % Math.PI) + Math.PI) % Math.PI - 0);
      const near = Math.min(dc, Math.PI - dc);
      const hidden = !isFront && near < gapA;
      if (hidden || isFront !== front) {
        if (run.length) {
          // keep joins continuous between front segments and back segments
          flush();
        }
        front = isFront;
        if (hidden) continue;
        if (prev) run.push(prev);
      }
      prev = [v.X(cx + amp * Math.sin(phi)), v.Y(y)];
      run.push([v.X(cx + amp * Math.sin(phi)), v.Y(y)]);
    }
    flush();
  }
  ctx.lineWidth = 1.25;
  // rungs
  const nr = 22;
  for (let i = 0; i < nr; i++) {
    const u = (i + 0.5) / nr;
    if (u > u1) break;
    const y = lerp(y0, y1, u);
    const phi = (TAU * (y - y0)) / period + rot;
    const sA = Math.sin(phi);
    if (Math.abs(sA) < 0.3) continue;
    line(ctx, v.X(cx + amp * sA), v.Y(y), v.X(cx - amp * sA), v.Y(y));
  }
}
