import { view, style, seg, ease, line, arrowHead, dot, lerp } from './util.js';

export default function draw(ctx, { w, h, p, t, ink }) {
  const v = view(w, h);
  style(ctx, ink);
  const oy = 0.5; // pinhole height
  const ox = 0.1, wx = 0.55, sx = 0.88;
  const topY = 0.3, baseY = 0.66;
  const k = (sx - wx) / (wx - ox);
  const iTipY = oy + (oy - topY) * k;
  const iBaseY = oy - (baseY - oy) * k;

  // optical axis
  ctx.save();
  ctx.setLineDash([2, 6]);
  line(ctx, v.X(0.04), v.Y(oy), v.X(0.96), v.Y(oy), ease(seg(p, 0, 0.2)));
  ctx.restore();

  // upright object (arrow)
  const f0 = ease(seg(p, 0, 0.25));
  ctx.lineWidth = 2;
  line(ctx, v.X(ox), v.Y(baseY), v.X(ox), v.Y(topY), f0);
  if (f0 > 0.85) {
    const a = ease(seg(f0, 0.85, 1));
    ctx.beginPath();
    ctx.moveTo(v.X(ox) - 7 * a, v.Y(topY) + 11 * a);
    ctx.lineTo(v.X(ox), v.Y(topY));
    ctx.lineTo(v.X(ox) + 7 * a, v.Y(topY) + 11 * a);
    ctx.stroke();
  }
  ctx.lineWidth = 1.25;

  // wall with pinhole
  const fw = ease(seg(p, 0.2, 0.42));
  const gap = 0.012;
  line(ctx, v.X(wx), v.Y(0.08), v.X(wx), v.Y(oy - gap), fw);
  line(ctx, v.X(wx), v.Y(0.92), v.X(wx), v.Y(oy + gap), fw);
  // small tick marks showing wall thickness
  line(ctx, v.X(wx + 0.012), v.Y(0.08), v.X(wx + 0.012), v.Y(oy - gap), fw);
  line(ctx, v.X(wx + 0.012), v.Y(0.92), v.X(wx + 0.012), v.Y(oy + gap), fw);

  // screen
  line(ctx, v.X(sx), v.Y(0.2), v.X(sx), v.Y(0.8), ease(seg(p, 0.35, 0.5)));

  // rays through the pinhole
  const fr1 = ease(seg(p, 0.45, 0.72));
  const fr2 = ease(seg(p, 0.55, 0.82));
  line(ctx, v.X(ox), v.Y(topY), v.X(sx), v.Y(iTipY), fr1);
  line(ctx, v.X(ox), v.Y(baseY), v.X(sx), v.Y(iBaseY), fr2);

  // inverted image on the screen
  const fi = ease(seg(p, 0.76, 1));
  ctx.lineWidth = 2;
  const ix = v.X(sx);
  line(ctx, ix, v.Y(iBaseY), ix, v.Y(iTipY), fi);
  if (fi > 0.85) {
    const a = ease(seg(fi, 0.85, 1));
    ctx.beginPath();
    ctx.moveTo(ix - 7 * a, v.Y(iTipY) - 11 * a);
    ctx.lineTo(ix, v.Y(iTipY));
    ctx.lineTo(ix + 7 * a, v.Y(iTipY) - 11 * a);
    ctx.stroke();
  }
  ctx.lineWidth = 1.25;

  // idle: light travelling along the rays
  const on = seg(p, 0.9, 1);
  if (on > 0) {
    const f = (t / 7) % 1;
    const r = 2.6 * on;
    dot(ctx, lerp(v.X(ox), v.X(sx), f), lerp(v.Y(topY), v.Y(iTipY), f), r);
    const g = (f + 0.5) % 1;
    dot(ctx, lerp(v.X(ox), v.X(sx), g), lerp(v.Y(baseY), v.Y(iBaseY), g), r);
  }
}
