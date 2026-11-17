import * as THREE from "three";

/**
 * Fullscreen ordered-dither pass with graded object ink and separate shadows.
 * Each stage cell samples the low-res
 * scene target once, maps luminance to ink density, and compares it against a
 * screen-locked 4x4 Bayer threshold. Ink is a hard square with a thin gap;
 * everything else is fully transparent so the page background shows through.
 */
export function createPostMaterial(sceneTex: THREE.Texture, maskTex: THREE.Texture) {
  return new THREE.ShaderMaterial({
    transparent: false,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      tScene: { value: sceneTex },
      tMask: { value: maskTex },
      uCells: { value: new THREE.Vector2(198, 179) },
      uOrigin: { value: new THREE.Vector2() },
      uStage: { value: new THREE.Vector2(1, 1) },
      uGap: { value: 1 },
      uNoise: { value: 0 },
      uSeed: { value: 0 },
      uBias: { value: 0 },
      uContrast: { value: 2.2 },
      uInk: { value: new THREE.Vector3(1 / 255, 1 / 255, 0) },
      uSurfaceLight: { value: new THREE.Vector3(0.42, 0.42, 0.42) },
      uShadowInk: { value: new THREE.Vector3(0.6, 0.6, 0.6) },
      /** Shadows use cells this many times finer than the object (scene target is rendered at this scale). */
      uFine: { value: 2 },
    },
    vertexShader: /* glsl */ `
      void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D tScene;
      uniform sampler2D tMask;
      uniform vec2 uCells;
      uniform vec2 uOrigin;
      uniform vec2 uStage;
      uniform float uGap;
      uniform float uNoise;
      uniform float uSeed;
      uniform float uBias;
      uniform float uContrast;
      uniform vec3 uInk;
      uniform vec3 uSurfaceLight;
      uniform vec3 uShadowInk;
      uniform float uFine;

      float bayer2(vec2 a) { a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }
      float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
      float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }

      void main() {
        vec2 sp = gl_FragCoord.xy - uOrigin;
        if (sp.x < 0.0 || sp.y < 0.0 || sp.x >= uStage.x || sp.y >= uStage.y) { gl_FragColor = vec4(0.0); return; }
        vec2 cellPx = uStage / uCells;
        vec2 cf = sp / cellPx;
        vec2 cell = floor(cf);
        vec2 local = (cf - cell) * cellPx;
        bool inGap = local.x > cellPx.x - uGap || local.y > cellPx.y - uGap;

        vec4 s = texture2D(tScene, (cell + 0.5) / uCells);
        float speck = texture2D(tMask, (cell + 0.5) / uCells).r;
        bool isSurface = s.a > 0.995;
        float c = clamp((s.r - 0.05) * uContrast, 0.0, 1.0);

        // Ink density: lit areas keep ~12% sparse dots, mid-tones a checker,
        // darks nearly solid. The object uses the main cell grid.
        float D = 0.0;
        vec2 dcell = cell;
        if (isSurface) {
          if (inGap) { gl_FragColor = vec4(0.0); return; }
          D = mix(0.96, 0.12, c);
        } else {
          // Floor shadow: its own lighter tone on a finer grid, so it reads as detailed shading.
          vec2 fcell = floor(sp / (cellPx / uFine));
          vec4 sf = texture2D(tScene, (fcell + 0.5) / (uCells * uFine));
          D = sf.a < 0.995 ? sf.a * 0.6 : 0.0;
          dcell = fcell;
          // Ring particles never land inside the floor shadow.
          if (s.a > 0.001 || sf.a > 0.001) speck = 0.0;
        }

        // Fray noise: per-cell random threshold offsets that change every frame.
        // uBias weights it toward the lower-right.
        vec2 np = cell / uCells;
        float w = mix(1.0, 0.35 + 1.3 * smoothstep(0.25, 0.95, (np.x + 1.0 - np.y) * 0.5), uBias);
        float amp = uNoise * w;
        float has = step(0.001, D);
        D -= amp * 0.35 * (1.0 - D) * has; // lit interior goes pale
        float thr = bayer4(dcell) + 1.0 / 32.0 + (hash(dcell + uSeed) - 0.5) * 1.4 * amp;
        float ink = (has > 0.5 && D > thr) ? 1.0 : 0.0;
        vec3 surfaceTone = mix(uInk, uSurfaceLight, c * 0.72);
        vec3 color = isSurface ? surfaceTone : uShadowInk;
        if (speck > 0.5 && !inGap) { ink = 1.0; color = uInk; }
        gl_FragColor = vec4(color * ink, ink);
      }
    `,
  });
}
