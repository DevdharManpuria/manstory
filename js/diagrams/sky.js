import { view, style, seg, ease, line, circle, strokePathPartial, arcPts, TAU } from './util.js';

const GROUPS = [3, 6, 4, 8];

// Outline of the lit part of the Moon, phase index k (0 new .. 4 full .. 7 waning crescent).
function litPath(cx, cy, r, k) {
  const phi = (k / 8) * TAU;
  const waxing = k < 4;
  const kt = Math.cos(phi);
  const sx = waxing ? 1 : -1;
  const pts = [];
  const n = 36;
  for (let i = 0; i <= n; i++) {
    const s = (i / n) * Math.PI;
    pts.push([cx + sx * r * Math.sin(s), cy - r * Math.cos(s)]);
  }
  for (let i = 0; i <= n; i++) {
    const s = Math.PI - (i / n) * Math.PI;
    pts.push([cx + sx * kt * r * Math.sin(s), cy - r * Math.cos(s)]);
  }
  return pts;
}

export default function draw(ctx, { w, h, p, ink }) {
  const v = view(w, h);
  style(ctx, ink);

  // Tally bone: baseline plus notches in groups.
  const bx0 = 0.06, bx1 = 0.94, by = 0.84;
  const total = GROUPS.reduce((a, b) => a + b, 0);
  const gap = 0.04;
  const step = (bx1 - bx0 - 0.04 - gap * (GROUPS.length - 1)) / (total - 1 + 0);
  const sp = Math.min(step, 0.034);
  const baseF = ease(seg(p, 0, 0.15));
  ctx.lineWidth = 2;
  line(ctx, v.X(bx0), v.Y(by), v.X(bx1), v.Y(by), baseF);
  ctx.lineWidth = 1.25;
  let idx = 0;
  const used = total * sp + gap * (GROUPS.length - 1);
  let x = (1 - used) / 2 + sp / 2;
  for (let g = 0; g < GROUPS.length; g++) {
    for (let i = 0; i < GROUPS[g]; i++) {
      const f = ease(seg(p, 0.08 + (idx / total) * 0.34, 0.08 + (idx / total) * 0.34 + 0.06));
      const hh = 0.075 + (i % 2 ? 0 : 0.0);
      line(ctx, v.X(x), v.Y(by), v.X(x), v.Y(by - hh), f);
      x += sp;
      idx++;
    }
    x += gap;
  }

  // Moon phases along an arc.
  const acx = 0.5, acy = 0.64, arx = 0.4, ary = 0.42;
  const a0 = Math.PI + 0.5, a1 = TAU - 0.5;
  const pts = [];
  for (let i = 0; i <= 60; i++) {
    const a = a0 + ((a1 - a0) * i) / 60;
    pts.push([v.X(acx + arx * Math.cos(a)), v.Y(acy + ary * Math.sin(a))]);
  }
  ctx.save();
  ctx.setLineDash([2, 5]);
  strokePathPartial(ctx, pts, ease(seg(p, 0.38, 0.6)));
  ctx.restore();
  const r = v.L(0.058);
  for (let k = 0; k < 8; k++) {
    const a = a0 + ((a1 - a0) * k) / 7;
    const cx = v.X(acx + arx * Math.cos(a));
    const cy = v.Y(acy + ary * Math.sin(a));
    const s0 = 0.42 + k * 0.065;
    const f = ease(seg(p, s0, s0 + 0.12));
    circle(ctx, cx, cy, r, f);
    const g = ease(seg(p, s0 + 0.05, s0 + 0.14));
    if (g > 0 && k !== 0) {
      const lp = litPath(cx, cy, r, k);
      ctx.lineWidth = 2;
      strokePathPartial(ctx, lp, g);
      ctx.save();
      ctx.beginPath();
      lp.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])));
      ctx.closePath();
      ctx.clip();
      ctx.lineWidth = 1;
      ctx.beginPath();
      const nh = Math.floor((r * 4) / 3.2 * g);
      for (let j = 0; j < nh; j++) {
        const d = -r * 2 + j * 3.2;
        ctx.moveTo(cx + d, cy + r);
        ctx.lineTo(cx + d + 2 * r, cy - r);
      }
      ctx.stroke();
      ctx.restore();
      ctx.lineWidth = 1.25;
    }
  }
}
