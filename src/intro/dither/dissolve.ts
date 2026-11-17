import * as THREE from "three";

/**
 * Dissolve shader chunk, injected into built-in materials (Lambert, Basic for
 * lines, Depth for the shadow pass) via onBeforeCompile.
 *  - vertices displace along their normals with 3D noise while dissolving
 *  - fragments are discarded by a noise threshold, biased so outgoing objects
 *    fray from the lit side / bottom first and incoming ones resolve rim-first
 *  - uCoverage discards a screen-locked fraction of cells (translucent halftone)
 */
export type DissolveUniforms = {
  uDissolve: { value: number };
  uBiasMode: { value: number }; // 0 = fray (lit/bottom first), 1 = resolve (rim first)
  uDisplace: { value: number };
  uCoverage: { value: number };
  uTime: { value: number };
  uLightDir: { value: THREE.Vector3 };
};

export type SharedUniforms = Pick<DissolveUniforms, "uTime" | "uLightDir">;

export function makeDissolveUniforms(shared: SharedUniforms): DissolveUniforms {
  return {
    uDissolve: { value: 0 },
    uBiasMode: { value: 0 },
    uDisplace: { value: 0.22 },
    uCoverage: { value: 1 },
    uTime: shared.uTime,
    uLightDir: shared.uLightDir,
  };
}

// Ashima 3D simplex noise, prefixed to avoid clashes with three's chunks.
const NOISE = /* glsl */ `
vec3 d_mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 d_mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 d_permute(vec4 x) { return d_mod289(((x * 34.0) + 1.0) * x); }
vec4 d_taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float dsnoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = d_mod289(i);
  vec4 p = d_permute(d_permute(d_permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = d_taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`;

const VERT_HEAD = /* glsl */ `
uniform float uDissolve;
uniform float uDisplace;
uniform float uTime;
uniform vec3 uLightDir;
varying vec3 vDLocal;
varying float vDLit;
varying float vDDown;
varying float vDRim;
${NOISE}
`;

const VERT_BODY = /* glsl */ `
vec3 transformed = vec3(position);
float dN = dsnoise(position * 2.6 + vec3(uTime * 0.6));
transformed += normal * dN * uDisplace * uDissolve;
vec3 dWN = normalize(mat3(modelMatrix) * normal + vec3(1e-5));
vDLit = dot(dWN, uLightDir) * 0.5 + 0.5;
vDDown = -dWN.y * 0.5 + 0.5;
vec3 dVN = normalize(normalMatrix * normal + vec3(1e-5));
vDRim = 1.0 - abs(dVN.z);
vDLocal = position;
`;

const FRAG_HEAD = /* glsl */ `
uniform float uDissolve;
uniform float uBiasMode;
uniform float uCoverage;
varying vec3 vDLocal;
varying float vDLit;
varying float vDDown;
varying float vDRim;
float dHash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
${NOISE}
`;

const FRAG_BODY = /* glsl */ `
{
  float dn = dsnoise(vDLocal * 3.2) * 0.5 + 0.5;
  float bOut = 1.0 - max(vDLit, vDDown * 0.9);
  float bias = mix(bOut, vDRim, uBiasMode);
  // Remap to the full 0..1 range so the dissolve progresses evenly with uDissolve.
  float dv = smoothstep(0.12, 0.78, 0.55 * dn + 0.45 * bias) * 0.98;
  if (dv < uDissolve) discard;
  if (uCoverage < 0.999 && dHash(floor(gl_FragCoord.xy)) > uCoverage) discard;
}
`;

export function applyDissolve<M extends THREE.Material>(material: M, u: DissolveUniforms): M {
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, u);
    shader.vertexShader = VERT_HEAD + shader.vertexShader.replace("#include <begin_vertex>", VERT_BODY);
    shader.fragmentShader = FRAG_HEAD + shader.fragmentShader.replace("void main() {", "void main() {\n" + FRAG_BODY);
  };
  material.customProgramCacheKey = () => "dither-dissolve";
  return material;
}

/** Linear grey (no sRGB conversion), so the render target stores true luminance. */
export const gray = (v: number) => new THREE.Color().setRGB(v, v, v, THREE.LinearSRGBColorSpace);
