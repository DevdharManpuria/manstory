import { view, style, seg, ease, strokePathPartial, line, circle, dot, rng, TAU } from './util.js';

const RINGS = [0.12, 0.21, 0.3];
const PHOTONS = [(-35 * Math.PI) / 180, (145 * Math.PI) / 180];

function buildTracks() {
  const rand = rng(125);
  const tracks = [];
  const n = 14;
  for (let i = 0; i < n; i++) {
    let th = (i / n) * TAU + (rand() - 0.5) * 0.25 + 0.1;
    // keep clear of the photons
    for (const ph of PHOTONS) {
      let d = Math.atan2(Math.sin(th - ph), Math.cos(th - ph));
      if (Math.abs(d) < 0.22) th += d >= 0 ? 0.3 : -0.3;
    }
    const sgn = rand() < 0.5 ? -1 : 1;
    const rho = 0.3 + Math.pow(rand(), 1.3) * 1.2;
    const rEnd = i % 5 === 3 ? RINGS[1] : i % 7 === 5 ? RINGS[0] : RINGS[2];
    tracks.push({ th, sgn, rho, rEnd: Math.min(rEnd, 2 * rho * 0.96) });
  }
  return tracks;
}
const TRACKS = buildTracks();

function trackPts(tr, cx, cy, v, n = 40) {
  // Circle of radius rho tangent to direction th at the origin, curving to side sgn.
  const nx = -Math.sin(tr.th) * tr.sgn, ny = Math.cos(tr.th) * tr.sgn;
  const ccx = nx * tr.rho, ccy = ny * tr.rho;
  const maxPhi = 2 * Math.asin(Math.min(1, tr.rEnd / (2 * tr.rho)));
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const phi = (maxPhi * i) / n * tr.sgn;
    const c = Math.cos(phi), s = Math.sin(phi);
    const rx = -ccx, ry = -ccy;
    const x = ccx + rx * c - ry * s;
    const y = ccy + rx * s + ry * c;
    pts.push([cx + v.L(x), cy + v.L(y)]);
  }
  return pts;
}

export default function draw(ctx, { w, h, p, t, ink }) {
  const v = view(w, h);
  style(ctx, ink);
  const cx = v.X(0.5), cy = v.Y(0.5);

  RINGS.forEach((r, i) => {
    circle(ctx, cx, cy, v.L(r), ease(seg(p, i * 0.07, 0.2 + i * 0.07)));
  });

  // charged tracks
  TRACKS.forEach((tr, i) => {
    const s0 = 0.3 + (i / TRACKS.length) * 0.25;
    strokePathPartial(ctx, trackPts(tr, cx, cy, v), ease(seg(p, s0, s0 + 0.22)));
  });

  // photons
  const fp = ease(seg(p, 0.7, 0.92));
  ctx.lineWidth = 2;
  for (const a of PHOTONS) {
    const r1 = RINGS[2] + 0.012;
    line(ctx, cx, cy, cx + v.L(r1) * Math.cos(a), cy + v.L(r1) * Math.sin(a), fp);
  }
  ctx.lineWidth = 1.25;

  // calorimeter bars beyond the outer ring
  const fb = ease(seg(p, 0.88, 1));
  const heights = [0.035, 0.075, 0.12, 0.07, 0.03];
  for (const a of PHOTONS) {
    const tx = -Math.sin(a), ty = Math.cos(a);
    heights.forEach((hh, i) => {
      const off = (i - 2) * v.L(0.016);
      const r0 = v.L(RINGS[2] + 0.02);
      const x0 = cx + r0 * Math.cos(a) + tx * off;
      const y0 = cy + r0 * Math.sin(a) + ty * off;
      line(ctx, x0, y0, x0 + v.L(hh) * Math.cos(a) * fb, y0 + v.L(hh) * Math.sin(a) * fb);
    });
  }
  dot(ctx, cx, cy, 2.4 * ease(seg(p, 0.2, 0.3)));
}
