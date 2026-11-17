// Particle formations. Every shape fills exactly N points, so particle i of one shape
// flies to particle i of the next. Each point is [x, y, z, size, r, g, b, alpha].
// Units: the camera sits 10 units back; most shapes fit inside a radius of about 2.4.

const TAU = Math.PI * 2;

export function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// OKLCH -> gamma-encoded sRGB, clamped.
export function oklch(L, C, h) {
  const hr = (h * Math.PI) / 180;
  const a = C * Math.cos(hr);
  const b = C * Math.sin(hr);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const enc = (x) => {
    x = Math.max(0, Math.min(1, x));
    return x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
  };
  return [
    enc(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    enc(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    enc(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}

// ---------- small sampling helpers ----------
const gauss = (rng) => {
  let u = 0;
  while (u === 0) u = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * rng());
};
function onSphere(rng) {
  const u = rng() * 2 - 1;
  const t = rng() * TAU;
  const s = Math.sqrt(1 - u * u);
  return [s * Math.cos(t), u, s * Math.sin(t)];
}
const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const jit = (rng, p, j) => [p[0] + gauss(rng) * j, p[1] + gauss(rng) * j, p[2] + gauss(rng) * j];
const dist3 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

// Pick a point uniformly by length along a set of polylines.
function polylineSampler(lines) {
  const segs = [];
  let total = 0;
  for (const line of lines) {
    for (let i = 0; i < line.pts.length - 1; i++) {
      const len = dist3(line.pts[i], line.pts[i + 1]);
      total += len;
      segs.push({ a: line.pts[i], b: line.pts[i + 1], acc: total, line, t0: i / (line.pts.length - 1), t1: (i + 1) / (line.pts.length - 1) });
    }
  }
  return (rng) => {
    const r = rng() * total;
    let lo = 0;
    let hi = segs.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (segs[mid].acc < r) lo = mid + 1;
      else hi = mid;
    }
    const s = segs[lo];
    const f = rng();
    return { p: lerp3(s.a, s.b, f), line: s.line, t: s.t0 + (s.t1 - s.t0) * f };
  };
}

// Spectrum colour at u in 0..1 (red end to the blue edge), following the chapter hues.
function spectrumColor(u, hues) {
  const n = hues.length;
  const x = Math.max(0, Math.min(0.9999, u)) * (n - 1);
  const i = Math.floor(x);
  const f = x - i;
  const h = hues[i] + (hues[Math.min(n - 1, i + 1)] - hues[i]) * f;
  const L = 0.62 + 0.2 * Math.sin(Math.min(1, u * 1.6) * Math.PI * 0.5) - (u > 0.75 ? (u - 0.75) * 0.5 : 0);
  return oklch(L, 0.19, h);
}
const nearLine = (u, lines, scale = 1) => {
  for (const [x, w] of lines) if (Math.abs(u - x) < (0.0016 + w * 0.0011) * scale) return true;
  return false;
};

// ---------- assembler ----------
function assemble(N, seed, parts, sortKey) {
  const rng = mulberry32(seed);
  const pts = [];
  const total = parts.reduce((s, p) => s + p.w, 0);
  let left = N;
  parts.forEach((part, k) => {
    const count = k === parts.length - 1 ? left : Math.round((part.w / total) * N);
    left -= count;
    for (let i = 0; i < count; i++) pts.push(part.f(rng, i, count));
  });
  // Order by a spatial key so neighbouring particles travel together during a morph.
  const key = sortKey || ((p) => p[0] * 0.8 + p[1] * 0.45);
  const keyed = pts.map((p) => [key(p) + (rng() - 0.5) * 0.35, p]);
  keyed.sort((a, b) => a[0] - b[0]);
  const pos = new Float32Array(N * 4);
  const col = new Float32Array(N * 4);
  keyed.forEach(([, p], i) => {
    pos[i * 4] = p[0];
    pos[i * 4 + 1] = p[1];
    pos[i * 4 + 2] = p[2];
    pos[i * 4 + 3] = p[3];
    col[i * 4] = p[4];
    col[i * 4 + 1] = p[5];
    col[i * 4 + 2] = p[6];
    col[i * 4 + 3] = p[7];
  });
  return { pos, col };
}
const P = (p, size, c, a) => [p[0], p[1], p[2], size, c[0], c[1], c[2], a];

// Faint background stars, shared by several shapes.
const starPart = (w, R = 5.5, a = 0.12) => ({
  w,
  f: (rng) => {
    const p = [(rng() - 0.5) * R * 2, (rng() - 0.5) * R * 1.3, (rng() - 0.5) * 3];
    return P(p, 0.4 + rng() * 0.6, oklch(0.92, 0.03, 240), a * rng());
  },
});

// ---------- formations ----------
const SHAPES = {
  // Hero: the Sun, a granulated photosphere with a streamered corona.
  sun(N, ctx) {
    const streamers = Array.from({ length: 14 }, (_, i) => {
      const r = mulberry32(900 + i);
      return onSphere(r);
    });
    return assemble(N, 11, [
      {
        w: 0.6,
        f: (rng) => {
          const n = onSphere(rng);
          const cell = Math.sin(n[0] * 13) * Math.sin(n[1] * 11) * Math.sin(n[2] * 12);
          const r = 1.5 + cell * 0.025;
          const hot = 0.5 + 0.5 * cell;
          const c = oklch(0.86 + hot * 0.1, 0.09 + (1 - hot) * 0.08, 70 - (1 - hot) * 25);
          return P([n[0] * r, n[1] * r, n[2] * r], 0.9 + rng() * 0.9, c, 0.45 + hot * 0.35);
        },
      },
      {
        w: 0.08,
        f: (rng) => {
          const n = onSphere(rng);
          const r = 1.45 * Math.cbrt(rng());
          return P([n[0] * r, n[1] * r, n[2] * r], 1.2, oklch(0.97, 0.05, 85), 0.25);
        },
      },
      {
        w: 0.32,
        f: (rng) => {
          const d = rng() < 0.55 ? streamers[Math.floor(rng() * streamers.length)] : onSphere(rng);
          const n = jit(rng, d, 0.18);
          const len = Math.hypot(...n);
          const rr = 1.55 + Math.pow(rng(), 2.6) * 1.9;
          const fade = 1 - (rr - 1.55) / 1.9;
          return P(n.map((v) => (v / len) * rr), 0.5 + rng() * 0.6, oklch(0.78, 0.16, 48 - fade * 10), 0.08 + fade * 0.3);
        },
      },
    ]);
  },

  // Intro: Fraunhofer's chart, a band of colour broken by dark lines.
  spectrum(N, ctx) {
    const { lines, hues } = ctx;
    return assemble(N, 12, [
      {
        w: 0.9,
        f: (rng) => {
          let u;
          do u = rng();
          while (nearLine(u, lines, 1.3));
          const y = (rng() - 0.5) * 1.15;
          const edge = 1 - Math.pow(Math.abs(y) / 0.575, 6);
          return P([(u - 0.5) * 6.4, y, (rng() - 0.5) * 0.14], 0.7 + rng() * 0.7, spectrumColor(u, hues), 0.42 * edge + 0.04);
        },
      },
      {
        w: 0.1,
        f: (rng) => {
          const u = rng();
          const y = (rng() < 0.5 ? -1 : 1) * (0.62 + Math.pow(rng(), 2) * 0.9);
          return P([(u - 0.5) * 6.6, y, (rng() - 0.5) * 0.6], 0.5, spectrumColor(u, hues), 0.06 + rng() * 0.08);
        },
      },
    ]);
  },

  // Counting the sky: the Moon through a month, over the notches of the Ishango bone.
  moons(N) {
    const groups = [11, 13, 17, 19];
    const notches = [];
    let x = 0;
    groups.forEach((g, gi) => {
      for (let i = 0; i < g; i++) {
        notches.push({ x, h: 0.22 + ((i * 7 + gi * 3) % 5) * 0.035 });
        x += 0.046;
      }
      x += 0.16;
    });
    const width = x;
    return assemble(N, 13, [
      {
        w: 0.74,
        f: (rng) => {
          const k = Math.floor(rng() * 7);
          const cx = (k - 3) * 0.74;
          const cy = 0.55 - 0.085 * (k - 3) ** 2;
          const phi = Math.PI + (k * Math.PI) / 3;
          const L = [Math.sin(phi), 0, Math.cos(phi)];
          const n = onSphere(rng);
          if (n[2] < 0) n[2] = -n[2];
          const lit = n[0] * L[0] + n[2] * L[2];
          const r = 0.34;
          const on = lit > 0;
          const c = on ? oklch(0.93, 0.05, 70) : oklch(0.6, 0.12, 28);
          return P([cx + n[0] * r, cy + n[1] * r, n[2] * r], on ? 0.8 + rng() * 0.6 : 0.6, c, on ? 0.38 + lit * 0.32 : 0.05);
        },
      },
      {
        w: 0.18,
        f: (rng) => {
          const nt = notches[Math.floor(rng() * notches.length)];
          const p = [nt.x - width / 2 + (rng() - 0.5) * 0.012, -1.25 + (rng() - 0.5) * nt.h, (rng() - 0.5) * 0.03];
          return P(p, 0.6 + rng() * 0.5, oklch(0.84, 0.12, 38), 0.5);
        },
      },
      {
        w: 0.03,
        f: (rng) => {
          const t = rng();
          return P([(t - 0.5) * width * 1.02, -1.55 + (rng() - 0.5) * 0.01, 0], 0.5, oklch(0.7, 0.14, 28), 0.25);
        },
      },
      starPart(0.05),
    ]);
  },

  // Causes without gods: a Platonic solid inside the great circle Eratosthenes measured.
  solid(N) {
    const phi = (1 + Math.sqrt(5)) / 2;
    const raw = [];
    for (const a of [-1, 1]) for (const b of [-1, 1]) {
      raw.push([0, a, b * phi], [a, b * phi, 0], [b * phi, 0, a]);
    }
    const R = 1.45;
    const verts = raw.map((v) => {
      const l = Math.hypot(...v);
      return v.map((c) => (c / l) * R);
    });
    const edges = [];
    for (let i = 0; i < 12; i++) for (let j = i + 1; j < 12; j++) {
      if (Math.abs(dist3(raw[i], raw[j]) - 2) < 0.01) edges.push({ pts: [verts[i], verts[j]] });
    }
    const edgeAt = polylineSampler(edges);
    const tiltRing = 0.41;
    return assemble(N, 14, [
      { w: 0.46, f: (rng) => P(jit(rng, edgeAt(rng).p, 0.008), 0.6 + rng() * 0.6, oklch(0.88, 0.11, 48), 0.5) },
      {
        w: 0.08,
        f: (rng) => {
          const v = verts[Math.floor(rng() * 12)];
          return P(jit(rng, v, 0.035), 0.9 + rng() * 0.7, oklch(0.96, 0.05, 70), 0.6);
        },
      },
      {
        w: 0.26,
        f: (rng) => {
          const t = rng() * TAU;
          const r = 2.25 + gauss(rng) * 0.012;
          const p = [Math.cos(t) * r, Math.sin(t) * r * Math.sin(tiltRing) * 0.0, Math.sin(t) * r];
          // tilt the ring about x so it reads as an orbit around the solid
          const y = p[2] * Math.sin(tiltRing);
          const z = p[2] * Math.cos(tiltRing);
          return P([p[0], y, z], 0.6 + rng() * 0.4, oklch(0.78, 0.17, 32), 0.45);
        },
      },
      {
        w: 0.06,
        f: (rng) => {
          // two radii 7.2 degrees apart: Syene and Alexandria
          const a = rng() < 0.5 ? 0 : (7.2 * Math.PI) / 180;
          const t = rng();
          const r = 2.25 * t;
          const p = [Math.cos(a) * r, 0, Math.sin(a) * r];
          return P([p[0], p[2] * Math.sin(tiltRing), p[2] * Math.cos(tiltRing)], 0.6, oklch(0.94, 0.07, 60), 0.4);
        },
      },
      {
        w: 0.14,
        f: (rng) => {
          const n = onSphere(rng);
          const r = R * Math.cbrt(rng()) * 0.95;
          return P([n[0] * r, n[1] * r, n[2] * r], 0.4, oklch(0.75, 0.15, 35), 0.06);
        },
      },
    ]);
  },

  // Numbers and experiments: Ibn al-Haytham's optics, rays through a lens to a focus.
  lens(N) {
    const F = [2.05, 0, 0];
    const rays = [];
    for (const [rad, count] of [[0.95, 12], [0.55, 8], [0.0, 1]]) {
      for (let i = 0; i < count; i++) {
        const t = (i / count) * TAU + rad;
        const y = Math.cos(t) * rad;
        const z = Math.sin(t) * rad;
        const a = [-3.1, y, z];
        const b = [0, y, z];
        const dir = [F[0] - b[0], F[1] - b[1], F[2] - b[2]];
        const c = [b[0] + dir[0] * 1.45, b[1] + dir[1] * 1.45, b[2] + dir[2] * 1.45];
        rays.push({ pts: [a, b], kind: 0 }, { pts: [b, c], kind: 1 });
      }
    }
    const rayAt = polylineSampler(rays);
    const LR = 1.25;
    return assemble(N, 15, [
      {
        w: 0.3,
        f: (rng) => {
          const t = rng() * TAU;
          const rho = LR * Math.sqrt(rng());
          const side = rng() < 0.5 ? -1 : 1;
          const x = side * 0.3 * (1 - (rho / LR) ** 2);
          return P([x, Math.cos(t) * rho, Math.sin(t) * rho], 0.6 + rng() * 0.5, oklch(0.92, 0.07, 85), 0.18 + (rho / LR) * 0.25);
        },
      },
      {
        w: 0.06,
        f: (rng) => {
          const t = rng() * TAU;
          return P(jit(rng, [0, Math.cos(t) * LR, Math.sin(t) * LR], 0.01), 0.7, oklch(0.95, 0.06, 80), 0.55);
        },
      },
      {
        w: 0.5,
        f: (rng) => {
          const s = rayAt(rng);
          const c = s.line.kind === 0 ? oklch(0.93, 0.05, 80) : oklch(0.82, 0.16, 58);
          const fade = s.line.kind === 1 ? 1 - Math.max(0, s.t - 0.69) * 2.2 : 0.55 + s.t * 0.45;
          return P(jit(rng, s.p, 0.006), 0.55 + rng() * 0.45, c, 0.42 * fade);
        },
      },
      { w: 0.05, f: (rng) => P(jit(rng, F, 0.06), 1 + rng(), oklch(0.97, 0.08, 75), 0.5) },
      {
        w: 0.03,
        f: (rng) => P([(rng() - 0.5) * 6.4, 0, 0], 0.5, oklch(0.8, 0.12, 58), 0.15),
      },
      starPart(0.06, 5, 0.1),
    ]);
  },

  // The Earth moves: a Sun-centred system of ellipses, with Jupiter's four moons.
  orbits(N) {
    const orbits = [
      { a: 0.55, e: 0.2, th: 1.2 },
      { a: 0.88, e: 0.01, th: 4.0 },
      { a: 1.22, e: 0.02, th: 2.4 },
      { a: 1.62, e: 0.09, th: 5.4 },
      { a: 2.18, e: 0.05, th: 0.5 },
      { a: 2.62, e: 0.06, th: 3.3 },
    ];
    const at = (o, E) => {
      const b = o.a * Math.sqrt(1 - o.e * o.e);
      return [o.a * (Math.cos(E) - o.e), 0, b * Math.sin(E)];
    };
    const weights = orbits.map((o) => o.a);
    const wsum = weights.reduce((a, b) => a + b, 0);
    const pickOrbit = (rng) => {
      let r = rng() * wsum;
      for (let i = 0; i < orbits.length; i++) {
        r -= weights[i];
        if (r <= 0) return orbits[i];
      }
      return orbits[orbits.length - 1];
    };
    return assemble(N, 16, [
      {
        w: 0.13,
        f: (rng) => {
          const n = onSphere(rng);
          const r = 0.3 * Math.pow(rng(), 0.6);
          return P([n[0] * r, n[1] * r, n[2] * r], 0.9 + rng() * 0.8, oklch(0.96, 0.1, 90), 0.4);
        },
      },
      {
        w: 0.6,
        f: (rng) => {
          const o = pickOrbit(rng);
          const p = at(o, rng() * TAU);
          return P(jit(rng, p, 0.006), 0.55 + rng() * 0.4, oklch(0.88, 0.13, 96), 0.32);
        },
      },
      {
        w: 0.17,
        f: (rng) => {
          const k = Math.floor(rng() * orbits.length);
          const o = orbits[k];
          const c = at(o, o.th);
          const r = [0.04, 0.055, 0.06, 0.05, 0.13, 0.11][k];
          if (k === 4 && rng() < 0.35) {
            // Galileo's four moons, strung out along a line as he saw them
            const m = Math.floor(rng() * 4);
            const off = [-0.32, -0.2, 0.22, 0.4][m];
            return P(jit(rng, [c[0] + off, c[1], c[2] + off * 0.2], 0.012), 0.8, oklch(0.97, 0.04, 90), 0.6);
          }
          const n = onSphere(rng);
          return P([c[0] + n[0] * r, c[1] + n[1] * r, c[2] + n[2] * r], 0.8 + rng() * 0.5, oklch(0.94, 0.09, 80 + k * 6), 0.55);
        },
      },
      starPart(0.1, 5.5, 0.14),
    ], (p) => Math.atan2(p[2], p[0]));
  },

  // Matter and current: Faraday's lines of force around a bar magnet.
  field(N) {
    const lines = [];
    const phis = 12;
    for (let i = 0; i < phis; i++) {
      const ph = (i / phis) * TAU;
      for (const L of [0.75, 1.2, 1.75, 2.45]) {
        const pts = [];
        const th0 = Math.asin(Math.sqrt(0.2 / L));
        for (let s = 0; s <= 48; s++) {
          const th = th0 + ((Math.PI - 2 * th0) * s) / 48;
          const r = L * Math.sin(th) ** 2;
          pts.push([r * Math.sin(th) * Math.cos(ph), r * Math.cos(th), r * Math.sin(th) * Math.sin(ph)]);
        }
        lines.push({ pts, L });
      }
    }
    const lineAt = polylineSampler(lines);
    return assemble(N, 17, [
      {
        w: 0.72,
        f: (rng) => {
          const s = lineAt(rng);
          const k = (s.line.L - 0.75) / 1.7;
          const c = oklch(0.9 - k * 0.12, 0.17, 125 + (s.p[1] < 0 ? 20 : 0));
          return P(jit(rng, s.p, 0.006), 0.6 + rng() * 0.5, c, 0.6 - k * 0.22);
        },
      },
      {
        w: 0.07,
        f: (rng) => {
          // the magnet: a bar, north end warm and south end cool
          const face = Math.floor(rng() * 3);
          let p = [(rng() - 0.5) * 0.3, (rng() - 0.5) * 1.3, (rng() - 0.5) * 0.3];
          p[face === 1 ? 0 : 2] = (rng() < 0.5 ? -1 : 1) * 0.15;
          if (face === 0) p[1] = (rng() < 0.5 ? -1 : 1) * 0.65;
          const north = p[1] > 0;
          return P(p, 0.7 + rng() * 0.4, north ? oklch(0.78, 0.17, 30) : oklch(0.82, 0.12, 220), 0.32);
        },
      },
      {
        w: 0.12,
        f: (rng) => {
          // iron filings: short dashes scattered through the field
          const n = onSphere(rng);
          const r = 0.4 + rng() * 2.4;
          return P([n[0] * r, n[1] * r * 0.9, n[2] * r], 0.45, oklch(0.85, 0.12, 125), 0.08);
        },
      },
    ]);
  },

  // The record of life: the double helix.
  helix(N) {
    const H = 2.45;
    const R = 0.82;
    const twist = 2.3;
    const off = 2.25;
    const strand = (y, s) => {
      const a = y * twist + s * off;
      return [Math.cos(a) * R, y, Math.sin(a) * R];
    };
    const pairs = [oklch(0.84, 0.17, 150), oklch(0.86, 0.15, 100), oklch(0.8, 0.12, 195), oklch(0.85, 0.13, 70)];
    return assemble(N, 18, [
      {
        w: 0.52,
        f: (rng) => {
          const s = rng() < 0.5 ? 0 : 1;
          const y = (rng() * 2 - 1) * H;
          const p = jit(rng, strand(y, s), 0.035);
          return P(p, 0.7 + rng() * 0.6, s ? oklch(0.9, 0.12, 165) : oklch(0.88, 0.15, 140), 0.45);
        },
      },
      {
        w: 0.36,
        f: (rng) => {
          const k = Math.floor(rng() * 34);
          const y = -H + 0.1 + (k * (2 * H - 0.2)) / 33;
          const a = strand(y, 0);
          const b = strand(y, 1);
          const t = rng();
          const half = t < 0.5 ? 0 : 1;
          const base = (k * 7 + 3) % 4;
          const c = pairs[half ? 3 - base : base];
          return P(jit(rng, lerp3(a, b, t), 0.008), 0.55 + rng() * 0.4, c, 0.32);
        },
      },
      {
        w: 0.12,
        f: (rng) => {
          const y = (rng() * 2 - 1) * (H + 0.4);
          const r = 1.1 + rng() * 1.3;
          const a = rng() * TAU;
          return P([Math.cos(a) * r, y, Math.sin(a) * r], 0.45 + rng() * 0.4, oklch(0.85, 0.12, 150), 0.08 + rng() * 0.08);
        },
      },
    ], (p) => p[1]);
  },

  // Relativity and quanta: spacetime curved by a mass, with starlight bent past it.
  spacetime(N) {
    const S = 2.7;
    const well = (r) => -1.35 / (1 + (r / 0.62) ** 2) + 0.35;
    const lines = [];
    for (let i = 0; i <= 22; i++) {
      const c = -S + (2 * S * i) / 22;
      const a = [];
      const b = [];
      for (let s = 0; s <= 80; s++) {
        const t = -S + (2 * S * s) / 80;
        a.push([c, well(Math.hypot(c, t)), t]);
        b.push([t, well(Math.hypot(t, c)), c]);
      }
      lines.push({ pts: a }, { pts: b });
    }
    const gridAt = polylineSampler(lines);
    const light = [];
    for (let s = 0; s <= 80; s++) {
      const x = -S + (2 * S * s) / 80;
      const z = 0.95 - 0.42 * Math.exp(-x * x * 0.9);
      light.push([x, well(Math.hypot(x, z)) + 0.06, z]);
    }
    const lightAt = polylineSampler([{ pts: light }]);
    const mass = [0, well(0) + 0.42, 0];
    return assemble(N, 19, [
      {
        w: 0.66,
        f: (rng) => {
          const s = gridAt(rng);
          const r = Math.hypot(s.p[0], s.p[2]);
          return P(jit(rng, s.p, 0.004), 0.55 + rng() * 0.45, oklch(0.86, 0.11, 200), 0.6 * (1 - r / 4.2));
        },
      },
      {
        w: 0.14,
        f: (rng) => {
          const n = onSphere(rng);
          const r = 0.4 * Math.pow(rng(), 0.35);
          return P([mass[0] + n[0] * r, mass[1] + n[1] * r, mass[2] + n[2] * r], 0.9 + rng() * 0.6, oklch(0.95, 0.06, 210), 0.38);
        },
      },
      {
        w: 0.08,
        f: (rng) => P(jit(rng, lightAt(rng).p, 0.008), 0.7, oklch(0.9, 0.12, 75), 0.55),
      },
      {
        w: 0.06,
        f: (rng) => {
          const t = rng() * TAU;
          const r = 1.25;
          return P(jit(rng, [Math.cos(t) * r, well(r) + 0.12, Math.sin(t) * r], 0.01), 0.6, oklch(0.92, 0.08, 190), 0.4);
        },
      },
      starPart(0.06, 5.5, 0.12),
    ]);
  },

  // Machines that compute: a die, its pins and the traces that carry its bits.
  chip(N) {
    const rng0 = mulberry32(2024);
    const D = 0.72;
    const traces = [];
    const vias = [];
    for (let side = 0; side < 4; side++) {
      for (let i = 0; i < 9; i++) {
        const u = -D + 0.08 + (i * (2 * D - 0.16)) / 8;
        // local frame: out = direction away from the die, along = along its edge
        const out = [[1, 0], [0, 1], [-1, 0], [0, -1]][side];
        const along = [-out[1], out[0]];
        const at = (o, a) => [out[0] * o + along[0] * a, 0, out[1] * o + along[1] * a];
        const o1 = D + 0.18;
        const o2 = o1 + 0.25 + rng0() * 0.9;
        const bend = (rng0() < 0.5 ? -1 : 1) * (0.2 + rng0() * 0.5) * (Math.abs(u) > 0.3 ? Math.sign(u) || 1 : 1);
        const o3 = Math.min(2.6, o2 + Math.abs(bend));
        const o4 = Math.min(2.75, o3 + 0.2 + rng0() * 0.5);
        const pts = [at(D, u), at(o1, u), at(o2, u), at(o3, u + bend), at(o4, u + bend)];
        traces.push({ pts });
        vias.push(pts[pts.length - 1]);
      }
    }
    const traceAt = polylineSampler(traces);
    const bits = Array.from({ length: 144 }, () => rng0() < 0.42);
    return assemble(N, 20, [
      {
        w: 0.26,
        f: (rng) => {
          const ci = Math.floor(rng() * 12);
          const cj = Math.floor(rng() * 12);
          const cell = 2 * D / 12;
          const x = -D + (ci + 0.15 + rng() * 0.7) * cell;
          const z = -D + (cj + 0.15 + rng() * 0.7) * cell;
          const on = bits[ci * 12 + cj];
          return P([x, 0.06 + rng() * 0.02, z], 0.55 + rng() * 0.4, on ? oklch(0.96, 0.06, 210) : oklch(0.7, 0.15, 255), on ? 0.5 : 0.14);
        },
      },
      {
        w: 0.05,
        f: (rng) => {
          const t = rng() * 4;
          const s = Math.floor(t);
          const f = (t - s) * 2 - 1;
          const p = [[D, 0, f * D], [f * D, 0, D], [-D, 0, f * D], [f * D, 0, -D]][s];
          return P(jit(rng, [p[0], 0.08, p[2]], 0.004), 0.6, oklch(0.92, 0.08, 230), 0.55);
        },
      },
      {
        w: 0.48,
        f: (rng) => P(jit(rng, traceAt(rng).p, 0.005), 0.5 + rng() * 0.4, oklch(0.78, 0.15, 255), 0.4),
      },
      {
        w: 0.08,
        f: (rng) => {
          const v = vias[Math.floor(rng() * vias.length)];
          const t = rng() * TAU;
          return P([v[0] + Math.cos(t) * 0.05, 0, v[2] + Math.sin(t) * 0.05], 0.6, oklch(0.95, 0.06, 220), 0.55);
        },
      },
      {
        w: 0.13,
        f: (rng) => {
          const i = Math.floor(rng() * 27);
          const j = Math.floor(rng() * 27);
          return P([-2.6 + i * 0.2, -0.02, -2.6 + j * 0.2], 0.45, oklch(0.7, 0.12, 250), 0.1);
        },
      },
    ]);
  },

  // Leaving the ground: a ringed planet and its moons.
  planet(N) {
    return assemble(N, 21, [
      {
        w: 0.4,
        f: (rng) => {
          const n = onSphere(rng);
          const band = 0.5 + 0.5 * Math.sin(n[1] * 11 + Math.sin(n[1] * 3) * 2);
          const r = 1.02;
          return P([n[0] * r, n[1] * r, n[2] * r], 0.7 + rng() * 0.5, oklch(0.78 + band * 0.12, 0.09, 245 - band * 25), 0.22 + band * 0.18);
        },
      },
      {
        w: 0.42,
        f: (rng) => {
          let r;
          do r = 1.38 + rng() * 1.05;
          while ((r > 1.86 && r < 1.94) || (r > 2.28 && r < 2.31));
          const dens = 0.55 + 0.45 * Math.sin(r * 31) ** 2;
          const t = rng() * TAU;
          return P([Math.cos(t) * r, gauss(rng) * 0.008, Math.sin(t) * r], 0.5 + rng() * 0.4, oklch(0.9, 0.05, 240 - (r - 1.4) * 40), 0.3 * dens);
        },
      },
      {
        w: 0.04,
        f: (rng) => {
          const n = onSphere(rng);
          return P([2.95 + n[0] * 0.12, 0.55 + n[1] * 0.12, -0.5 + n[2] * 0.12], 0.7, oklch(0.94, 0.03, 250), 0.5);
        },
      },
      {
        w: 0.05,
        f: (rng) => {
          // a second, small moon on an inclined orbit
          const t = rng() * TAU;
          return P(jit(rng, [Math.cos(t) * 3.1, Math.sin(t) * 0.5, Math.sin(t) * 1.4], 0.01), 0.45, oklch(0.9, 0.04, 240), 0.12);
        },
      },
      starPart(0.09, 5.5, 0.18),
    ], (p) => Math.atan2(p[2], p[0]));
  },

  // Reading the code: a layered neural network, the shape of AlexNet's descendants.
  network(N) {
    const rng0 = mulberry32(77);
    const sizes = [5, 6, 6, 4, 2];
    const layers = sizes.map((s, li) => {
      const x = -2.2 + li * 1.1;
      const nodes = [];
      const sp = 0.36;
      for (let i = 0; i < s; i++) for (let j = 0; j < s; j++) {
        nodes.push([x, (i - (s - 1) / 2) * sp, (j - (s - 1) / 2) * sp]);
      }
      return nodes;
    });
    const edges = [];
    for (let li = 0; li < layers.length - 1; li++) {
      const A = layers[li];
      const B = layers[li + 1];
      const count = 150;
      for (let k = 0; k < count; k++) {
        edges.push({ pts: [A[Math.floor(rng0() * A.length)], B[Math.floor(rng0() * B.length)]], li });
      }
    }
    const edgeAt = polylineSampler(edges);
    const all = layers.flat();
    return assemble(N, 22, [
      {
        w: 0.3,
        f: (rng) => {
          const v = all[Math.floor(rng() * all.length)];
          return P(jit(rng, v, 0.028), 0.8 + rng() * 0.6, oklch(0.95, 0.06, 250), 0.5);
        },
      },
      {
        w: 0.58,
        f: (rng) => {
          const s = edgeAt(rng);
          const k = (s.line.li + s.t) / 4;
          return P(jit(rng, s.p, 0.004), 0.5 + rng() * 0.35, oklch(0.8, 0.15, 272 - k * 70), 0.34);
        },
      },
      {
        w: 0.06,
        f: (rng) => {
          const e = edges[Math.floor(rng() * 40) * 13 % edges.length];
          const t = 0.3 + ((Math.floor(rng() * 3) * 0.23) % 0.7);
          return P(jit(rng, lerp3(e.pts[0], e.pts[1], t), 0.02), 1 + rng() * 0.5, oklch(0.95, 0.1, 200), 0.6);
        },
      },
      starPart(0.06, 5.5, 0.12),
    ]);
  },

  // Past the visible: a spiral galaxy inside a halo nobody can see.
  galaxy(N) {
    return assemble(N, 23, [
      {
        w: 0.16,
        f: (rng) => {
          const r = Math.abs(gauss(rng)) * 0.32;
          const n = onSphere(rng);
          return P([n[0] * r, n[1] * r * 0.6, n[2] * r], 0.6 + rng() * 0.8, oklch(0.94, 0.07, 75), 0.32);
        },
      },
      {
        w: 0.66,
        f: (rng) => {
          const arm = Math.floor(rng() * 2);
          const th = Math.pow(rng(), 0.8) * 3.2 * Math.PI;
          const r = 0.25 * Math.exp(0.235 * th);
          const a = th + arm * Math.PI;
          const spread = 0.035 + r * 0.045;
          const x = Math.cos(a) * r + gauss(rng) * spread;
          const z = Math.sin(a) * r + gauss(rng) * spread;
          const k = Math.min(1, r / 2.8);
          const pink = rng() < 0.04;
          const c = pink ? oklch(0.78, 0.14, 15) : oklch(0.9 - k * 0.12, 0.05 + k * 0.09, 75 + k * 175);
          return P([x, gauss(rng) * 0.05 * (1 - k * 0.5), z], 0.5 + rng() * 0.6, c, 0.5 * (1 - k * 0.45));
        },
      },
      {
        w: 0.18,
        f: (rng) => {
          const n = onSphere(rng);
          const r = 1 + rng() * 2.4;
          return P([n[0] * r, n[1] * r, n[2] * r], 0.4, oklch(0.8, 0.08, 265), 0.04);
        },
      },
    ], (p) => Math.hypot(p[0], p[2]));
  },

  // Close: the whole spectrum bent into a ring, its dark lines as spokes.
  ring(N, ctx) {
    const { lines, hues } = ctx;
    return assemble(N, 24, [
      {
        w: 0.86,
        f: (rng) => {
          let u;
          do u = rng();
          while (nearLine(u, lines, 0.95));
          const a = Math.PI / 2 - u * TAU * 0.94 - 0.18;
          const r = 1.72 + (rng() - 0.5) * 0.5;
          const edge = 1 - Math.pow(Math.abs(r - 1.72) / 0.25, 6);
          return P([Math.cos(a) * r, Math.sin(a) * r, (rng() - 0.5) * 0.08], 0.65 + rng() * 0.6, spectrumColor(u, hues), 0.42 * edge + 0.03);
        },
      },
      {
        w: 0.14,
        f: (rng) => {
          const t = rng() * TAU;
          const r = 2.05 + Math.pow(rng(), 2) * 1.4;
          return P([Math.cos(t) * r, Math.sin(t) * r, (rng() - 0.5) * 0.4], 0.45, oklch(0.9, 0.03, 80), 0.05);
        },
      },
    ], (p) => Math.atan2(p[1], p[0]));
  },

  // Loading state: dust that the Sun condenses out of.
  dust(N) {
    return assemble(N, 25, [
      {
        w: 1,
        f: (rng) => {
          const n = onSphere(rng);
          const r = 3 + rng() * 6;
          return P([n[0] * r, n[1] * r, n[2] * r], 0.4 + rng() * 0.4, oklch(0.85, 0.06, 60), 0.05 * rng());
        },
      },
    ]);
  },
};

export function buildShape(name, N, ctx) {
  const fn = SHAPES[name];
  if (!fn) throw new Error(`unknown shape ${name}`);
  return fn(N, ctx);
}
