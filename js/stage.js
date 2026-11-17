// The stage: one WebGL2 particle field drawn behind the whole page.
// All formations are baked into two float textures (position+size, colour+alpha), one
// block of rows per formation. The vertex shader reads formation A and formation B for
// its particle and blends them, so a morph costs nothing on the CPU.
import { buildShape } from './shapes.js';

const FOV = (35 * Math.PI) / 180;
const CAM_Z = 10;
const TAN = Math.tan(FOV / 2);

// How each formation sits and moves. spin: rad/s about y; sway: gentle rock for flat
// shapes; tilt: lean towards the viewer about x; size: largest radius, used to fit.
export const SHAPE_PARAMS = {
  dust:      { spin: 0.02, sway: 0,    tilt: 0,    size: 3.0, scale: 1 },
  sun:       { spin: 0.07, sway: 0,    tilt: 0.3,  size: 2.2, scale: 1.0 },
  spectrum:  { spin: 0,    sway: 0.10, tilt: 0.1,  size: 3.3, scale: 0.95 },
  moons:     { spin: 0,    sway: 0.22, tilt: 0.05, size: 2.9, scale: 0.95 },
  solid:     { spin: 0.2,  sway: 0,    tilt: 0.32, size: 2.55, scale: 1.0 },
  lens:      { spin: 0,    sway: 0.38, tilt: 0.08, size: 3.1, scale: 0.85 },
  orbits:    { spin: 0.09, sway: 0,    tilt: 0.55, size: 2.9, scale: 1.0 },
  field:     { spin: 0.18, sway: 0,    tilt: 0.18, size: 2.8, scale: 1.0 },
  helix:     { spin: 0.42, sway: 0,    tilt: 0.0,  size: 2.5, scale: 0.95 },
  spacetime: { spin: 0.08, sway: 0,    tilt: 0.52, size: 2.8, scale: 0.95 },
  chip:      { spin: 0.08, sway: 0,    tilt: 0.92, size: 2.8, scale: 0.95 },
  planet:    { spin: 0.1,  sway: 0,    tilt: 0.3,  size: 2.6, scale: 1.0 },
  network:   { spin: 0.16, sway: 0,    tilt: 0.22, size: 2.6, scale: 0.95 },
  galaxy:    { spin: 0.05, sway: 0,    tilt: 0.82,  size: 2.9, scale: 1.1 },
  ring:      { spin: 0,    sway: 0.18, tilt: 0,    size: 2.0, scale: 1.3 },
};

const VS = `#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;
uniform sampler2D uPos;
uniform sampler2D uCol;
uniform int uW;
uniform int uRows;
uniform int uA;
uniform int uB;
uniform float uT;
uniform float uTime;
uniform float uMotion;
uniform mat4 uProj;
uniform mat4 uMA;
uniform mat4 uMB;
uniform vec2 uMouse;
uniform float uAspect;
uniform float uSizeK;
uniform float uFade;
out vec4 vCol;

uniform vec3 uCA;
uniform vec3 uCB;

float hash(float n) { return fract(sin(n) * 43758.5453123); }

mat3 rotAxis(vec3 a, float ang) {
  float c = cos(ang);
  float s = sin(ang);
  float ic = 1.0 - c;
  return mat3(
    c + a.x * a.x * ic, a.y * a.x * ic + a.z * s, a.z * a.x * ic - a.y * s,
    a.x * a.y * ic - a.z * s, c + a.y * a.y * ic, a.z * a.y * ic + a.x * s,
    a.x * a.z * ic + a.y * s, a.y * a.z * ic - a.x * s, c + a.z * a.z * ic
  );
}

vec3 swirl(vec3 p, float t) {
  return vec3(
    sin(p.y * 1.7 + t) + sin(p.z * 2.3 - t * 0.7),
    sin(p.z * 1.9 + t * 0.8) + sin(p.x * 2.1 + t * 0.5),
    sin(p.x * 1.5 - t * 0.6) + sin(p.y * 2.7 + t * 0.9)
  );
}

void main() {
  int id = gl_VertexID;
  ivec2 c = ivec2(id % uW, id / uW);
  vec4 pa = texelFetch(uPos, c + ivec2(0, uA * uRows), 0);
  vec4 pb = texelFetch(uPos, c + ivec2(0, uB * uRows), 0);
  vec4 ca = texelFetch(uCol, c + ivec2(0, uA * uRows), 0);
  vec4 cb = texelFetch(uCol, c + ivec2(0, uB * uRows), 0);

  float fid = float(id);
  float r1 = hash(fid * 0.1371 + 1.3);
  float r2 = hash(fid * 0.7313 + 7.1);

  vec3 wa = (uMA * vec4(pa.xyz, 1.0)).xyz;
  vec3 wb = (uMB * vec4(pb.xyz, 1.0)).xyz;

  // The formation travels as one body from centre A to centre B. Each particle is
  // carried relative to that moving centre, so the shape stays coherent in flight.
  vec3 travel = uCB - uCA;
  float tl = length(travel);
  vec3 dirN = tl > 0.3 ? travel / tl : vec3(0.0, 1.0, 0.0);
  vec3 ra = wa - uCA;
  vec3 rb = wb - uCB;

  // Particles on the leading edge leave first, so the shape peels away in a sweep
  // and the new one assembles from the side it is heading towards.
  float lead = clamp(dot(ra, dirN) / 2.4, -1.0, 1.0);
  float delay = (0.5 - 0.5 * lead) * 0.24 + r1 * 0.07;
  float t = clamp((uT - delay) / 0.69, 0.0, 1.0);
  float e = t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
  float k = sin(3.14159265 * e);

  // progress of the whole body, shared by every particle
  float G = uT * uT * uT * (uT * (uT * 6.0 - 15.0) + 10.0);
  float K = sin(3.14159265 * G);

  vec3 rel = mix(ra, rb, e);
  // In flight the particles gather onto a shell of light, a small sun, and then
  // bloom out of it into the next shape.
  float shellR = 0.86 + 0.1 * r2;
  vec3 shell = normalize(rel + vec3(1e-4, 2e-4, 3e-4)) * shellR;
  rel = mix(rel, shell, smoothstep(0.15, 0.95, k) * 0.96 * uMotion);
  // the body turns once as a rigid whole, rolling the way it travels
  float roll = travel.x < -0.01 ? -1.0 : 1.0;
  vec3 axis = normalize(vec3(0.18, 1.0, 0.12));
  rel = rotAxis(axis, 6.2831853 * G * roll * uMotion) * rel;

  vec3 centre = mix(uCA, uCB, e);
  // arc towards the viewer on the way across
  centre.z += k * (0.6 + 0.22 * tl) * uMotion;
  centre.y += k * 0.08 * tl * uMotion;
  vec3 p = centre + rel;

  // a little organic drift, strongest mid-flight
  p += swirl(rel * 0.9 + r2 * 6.0, uTime * 0.6) * k * (0.02 + r2 * 0.06) * uMotion;

  // idle shimmer
  p += 0.012 * uMotion * vec3(sin(uTime * 1.3 + fid), cos(uTime * 1.1 + fid * 1.7), sin(uTime * 0.9 + fid * 2.3));

  vec4 clip = uProj * vec4(p - vec3(0.0, 0.0, ${CAM_Z.toFixed(1)}), 1.0);

  // the pointer parts the field
  vec2 ndc = clip.xy / clip.w;
  vec2 d = ndc - uMouse;
  d.x *= uAspect;
  float dist = length(d);
  float push = smoothstep(0.32, 0.0, dist) * 0.075;
  if (dist > 1e-4) ndc += (d / dist) * push * vec2(1.0 / uAspect, 1.0);
  clip.xy = ndc * clip.w;
  gl_Position = clip;

  float size = mix(pa.w, pb.w, e) * (1.0 - 0.2 * k);
  gl_PointSize = clamp(size * uSizeK / clip.w, 1.0, 64.0);

  // colour crosses over a little ahead of position, and flying particles run hot
  vec4 col = mix(ca, cb, smoothstep(0.15, 0.75, e));
  float tw = 0.82 + 0.18 * sin(uTime * (1.5 + r1 * 2.0) + fid * 3.1) * uMotion;
  vCol = vec4(col.rgb * (1.0 + k * 0.75), col.a * tw * uFade * (1.0 + k * 0.35));
}`;

const FS = `#version 300 es
precision highp float;
in vec4 vCol;
out vec4 o;
void main() {
  vec2 q = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(q, q);
  if (r2 > 1.0) discard;
  float a = exp(-r2 * 3.6) - 0.027;
  o = vec4(vCol.rgb * vCol.a * a, 1.0);
}`;

const BG_VS = `#version 300 es
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const BG_FS = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform vec3 uBase;
uniform vec3 uGlow;
uniform vec2 uGlowPos;
uniform float uGlowR;
uniform float uTime;
out vec4 o;
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / uRes.y;
  vec2 p = uv * 2.0 - 1.0;
  p.x *= aspect;
  vec2 g = uGlowPos;
  g.x *= aspect;
  float d = length(p - g);
  vec3 col = uBase;
  col += uGlow * 0.55 * exp(-d * d / (uGlowR * uGlowR));
  col += uGlow * 0.12 * exp(-d * d / (uGlowR * uGlowR * 6.0));
  vec2 v = uv - 0.5;
  col *= 1.0 - dot(v, v) * 0.9;
  col += (hash(gl_FragCoord.xy + fract(uTime)) - 0.5) / 255.0;
  o = vec4(col, 1.0);
}`;

function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
  return s;
}
function program(gl, vs, fs) {
  const p = gl.createProgram();
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  const u = {};
  const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) {
    const info = gl.getActiveUniform(p, i);
    u[info.name] = gl.getUniformLocation(p, info.name);
  }
  return { p, u };
}

// ---------- tiny column-major mat4 ----------
function perspective(aspect) {
  const f = 1 / TAN;
  const near = 0.1;
  const far = 60;
  const nf = 1 / (near - far);
  return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
}
function mul(a, b) {
  const o = new Float32Array(16);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    }
  }
  return o;
}
const rotX = (a) => {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]);
};
const rotY = (a) => {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]);
};
const trs = (x, y, z, s) => new Float32Array([s, 0, 0, 0, 0, s, 0, 0, 0, 0, s, 0, x, y, z, 1]);

export function createStage(canvas, { shapes, ctx, colors, reducedMotion }) {
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: false });
  if (!gl) return null;

  const small = Math.min(window.innerWidth, window.innerHeight) < 700 || matchMedia('(pointer: coarse)').matches;
  const W = 128;
  const ROWS = small ? 72 : 128;
  const N = W * ROWS;
  const names = [...shapes, 'dust'];
  const DUST = names.length - 1;
  const H = ROWS * names.length;
  if (H > gl.getParameter(gl.MAX_TEXTURE_SIZE)) return null;

  const pts = program(gl, VS, FS);
  const bg = program(gl, BG_VS, BG_FS);
  const vao = gl.createVertexArray();

  function makeTex() {
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA32F, W, H);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }
  const posTex = makeTex();
  const colTex = makeTex();
  const ready = new Array(names.length).fill(false);

  function upload(i) {
    const { pos, col } = buildShape(names[i], N, ctx);
    gl.bindTexture(gl.TEXTURE_2D, posTex);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, i * ROWS, W, ROWS, gl.RGBA, gl.FLOAT, pos);
    gl.bindTexture(gl.TEXTURE_2D, colTex);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, i * ROWS, W, ROWS, gl.RGBA, gl.FLOAT, col);
    ready[i] = true;
  }
  // The first formation and the dust it condenses from are needed now; the rest are
  // baked one per frame so the first paint is not held up.
  upload(DUST);
  upload(0);
  const queue = names.map((_, i) => i).filter((i) => !ready[i]);

  let width = 0;
  let height = 0;
  let aspect = 1;
  let proj = perspective(1);
  let sizeK = 1;
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, small ? 1.75 : 2);
    width = Math.round(canvas.clientWidth * dpr);
    height = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    aspect = width / Math.max(1, height);
    proj = perspective(aspect);
    sizeK = (height / 2 / TAN) * (small ? 0.026 : 0.021);
  }
  resize();

  // Where a formation sits on screen for a given layout side.
  function placement(i, side) {
    const name = names[i];
    const sp = SHAPE_PARAMS[name] || SHAPE_PARAMS.dust;
    const halfH = CAM_Z * TAN;
    const halfW = halfH * aspect;
    const narrow = aspect < 0.85;
    let x = 0;
    let y = 0;
    let fit;
    if (narrow) {
      fit = Math.min(1, (halfW * 0.92) / (sp.size * sp.scale));
      y = side === 'center' ? 0 : halfH * 0.43;
      if (name === 'spectrum') y = -halfH * 0.42;
      if (name === 'sun') y = halfH * 0.04;
      if (name === 'ring') y = halfH * 0.3;
      if (name === 'moons') y = halfH * 0.52;
    } else if (side === 'center') {
      fit = Math.min(1, (halfW * 0.92) / sp.size, (halfH * 0.95) / sp.size);
      if (name === 'spectrum') {
        fit = Math.min(1, (halfW * 0.9) / sp.size);
        y = -halfH * 0.42;
      }
    } else {
      fit = Math.min(1, (halfW * 0.42) / sp.size, (halfH * 0.86) / sp.size);
      x = (side === 'left' ? 1 : -1) * halfW * 0.46;
    }
    return { x, y, s: sp.scale * fit, sp };
  }

  let mouse = [9, 9];
  let mouseS = [9, 9];
  let par = [0, 0];

  function model(i, side, time, motion) {
    const { x, y, s, sp } = placement(i, side);
    const ang = (sp.spin * time + sp.sway * Math.sin(time * 0.35)) * motion;
    const m = mul(trs(x, y, 0, s), mul(rotX(par[1] * 0.18), mul(rotY(par[0] * 0.3), mul(rotX(sp.tilt), rotY(ang)))));
    return { m, x, y, s };
  }

  const motion = reducedMotion ? 0 : 1;
  let introStart = -1;
  const INTRO = reducedMotion ? 1 : 2600;

  function lerpRGB(a, b, t) {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  }

  // value: continuous scene position (2.4 = 40% of the way from scene 2 to scene 3)
  function render(value, sides, nowMs) {
    if (queue.length) upload(queue.shift());
    if (introStart < 0) introStart = nowMs;
    const time = motion ? nowMs / 1000 : 0;

    for (let k = 0; k < 2; k++) {
      mouseS[k] += (mouse[k] - mouseS[k]) * 0.08;
      const target = Math.abs(mouse[k]) > 2 ? 0 : mouse[k];
      par[k] += (target - par[k]) * 0.03;
    }

    const last = shapes.length - 1;
    const v = Math.max(0, Math.min(last, value));
    let a = Math.floor(v);
    let b = Math.min(last, a + 1);
    let t = v - a;
    // until a formation is baked, hold the previous one
    if (!ready[b]) b = a;
    if (!ready[a]) a = DUST;

    let ma = model(a, sides[a], time, motion);
    let mb = model(b, sides[b], time, motion);
    const intro = Math.min(1, (nowMs - introStart) / INTRO);
    if (intro < 1) {
      const target = t < 0.5 ? a : b;
      const mt = target === a ? ma : mb;
      a = DUST;
      b = target;
      ma = model(DUST, 'center', time, motion);
      mb = mt;
      t = 1 - Math.pow(1 - intro, 3);
    }

    gl.viewport(0, 0, width, height);
    gl.disable(gl.BLEND);

    // background: near-black tinted to the scene, with a glow behind the formation
    const ca = colors[Math.floor(v)] || colors[0];
    const cb = colors[Math.min(last, Math.floor(v) + 1)] || ca;
    const f = v - Math.floor(v);
    const glowX = (ma.x + (mb.x - ma.x) * f) / (CAM_Z * TAN * aspect);
    const glowY = (ma.y + (mb.y - ma.y) * f) / (CAM_Z * TAN);
    gl.useProgram(bg.p);
    gl.uniform2f(bg.u.uRes, width, height);
    gl.uniform3fv(bg.u.uBase, lerpRGB(ca.base, cb.base, f));
    gl.uniform3fv(bg.u.uGlow, lerpRGB(ca.glow, cb.glow, f));
    gl.uniform2f(bg.u.uGlowPos, glowX, glowY);
    gl.uniform1f(bg.u.uGlowR, 0.55 + (ma.s + (mb.s - ma.s) * f) * 0.35);
    gl.uniform1f(bg.u.uTime, time);
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.useProgram(pts.p);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, posTex);
    gl.uniform1i(pts.u.uPos, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, colTex);
    gl.uniform1i(pts.u.uCol, 1);
    gl.uniform1i(pts.u.uW, W);
    gl.uniform1i(pts.u.uRows, ROWS);
    gl.uniform1i(pts.u.uA, a);
    gl.uniform1i(pts.u.uB, b);
    gl.uniform1f(pts.u.uT, t);
    gl.uniform1f(pts.u.uTime, time);
    gl.uniform1f(pts.u.uMotion, motion);
    gl.uniformMatrix4fv(pts.u.uProj, false, proj);
    gl.uniformMatrix4fv(pts.u.uMA, false, ma.m);
    gl.uniformMatrix4fv(pts.u.uMB, false, mb.m);
    gl.uniform3f(pts.u.uCA, ma.x, ma.y, 0);
    gl.uniform3f(pts.u.uCB, mb.x, mb.y, 0);
    gl.uniform2f(pts.u.uMouse, mouseS[0], mouseS[1]);
    gl.uniform1f(pts.u.uAspect, aspect);
    gl.uniform1f(pts.u.uSizeK, sizeK);
    gl.uniform1f(pts.u.uFade, small ? 1.35 : 1);
    gl.drawArrays(gl.POINTS, 0, N);
  }

  return {
    render,
    resize,
    setMouse(x, y) {
      mouse = [x, y];
    },
    clearMouse() {
      mouse = [9, 9];
    },
    count: N,
  };
}
