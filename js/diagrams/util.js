// Shared helpers for the line drawings.
export const TAU = Math.PI * 2;
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const ease = (t) => 1 - Math.pow(1 - clamp(t), 3); // easeOutCubic
export const easeInOut = (t) => {
  t = clamp(t);
  return t * t * (3 - 2 * t);
};
// Map the sub-range a..b of p to 0..1.
export const seg = (p, a, b) => clamp((p - a) / (b - a));

// Square drawing box with about 8% margin, centred in the canvas.
export function view(w, h) {
  const s = Math.min(w, h) * 0.84;
  const ox = (w - s) / 2;
  const oy = (h - s) / 2;
  return { s, X: (x) => ox + x * s, Y: (y) => oy + y * s, L: (l) => l * s };
}

export function style(ctx, ink, lw = 1.25) {
  ctx.strokeStyle = ink;
  ctx.fillStyle = ink;
  ctx.lineWidth = lw;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.setLineDash([]);
}

// Stroke the first fraction f (0..1, by length) of a polyline [[x,y],...].
export function strokePathPartial(ctx, pts, f = 1) {
  f = clamp(f);
  if (f <= 0 || pts.length < 2) return;
  let total = 0;
  const lens = [];
  for (let i = 1; i < pts.length; i++) {
    const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    lens.push(l);
    total += l;
  }
  let remain = total * f;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) {
    const l = lens[i - 1];
    if (remain >= l) {
      ctx.lineTo(pts[i][0], pts[i][1]);
      remain -= l;
    } else {
      const k = l > 0 ? remain / l : 0;
      ctx.lineTo(lerp(pts[i - 1][0], pts[i][0], k), lerp(pts[i - 1][1], pts[i][1], k));
      break;
    }
  }
  ctx.stroke();
}

export function line(ctx, x0, y0, x1, y1, f = 1) {
  f = clamp(f);
  if (f <= 0) return;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(lerp(x0, x1, f), lerp(y0, y1, f));
  ctx.stroke();
}

// Points of a circular arc, angles in radians (canvas convention).
export function arcPts(cx, cy, r, a0, a1, n = 48) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = lerp(a0, a1, i / n);
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return pts;
}

export function dot(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
}

export function circle(ctx, x, y, r, f = 1) {
  f = clamp(f);
  if (f <= 0) return;
  ctx.beginPath();
  ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + TAU * f);
  ctx.stroke();
}

// Open arrowhead (two short strokes) at (x,y) pointing along angle a.
export function arrowHead(ctx, x, y, a, size = 7, spread = 0.45) {
  ctx.beginPath();
  ctx.moveTo(x - size * Math.cos(a - spread), y - size * Math.sin(a - spread));
  ctx.lineTo(x, y);
  ctx.lineTo(x - size * Math.cos(a + spread), y - size * Math.sin(a + spread));
  ctx.stroke();
}

export function label(ctx, str, x, y, align = 'center') {
  ctx.save();
  ctx.font = '500 13px Archivo, Arial, sans-serif';
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
  ctx.restore();
}

// Deterministic pseudo-random generator.
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
