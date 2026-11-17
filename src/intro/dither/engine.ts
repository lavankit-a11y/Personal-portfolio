import * as THREE from "three";
import { clamp01, easeFray, mulberry32 } from "./math";
import { RING_BANDS, createPlanet, createSaturn, type Env, type PlanetKind, type Rig, type SaturnRig } from "./objects";
import { createPostMaterial } from "./post";

/** Stage aspect (width / height). */
const STAGE_AR = 1.1;
/** Small, consistent dither cells for more detail (CSS px). */
const MIN_CELL = 2;
/** Ink follows the theme: near-black on light, off-white on dark. */
const INK_LIGHT = new THREE.Vector3(1 / 255, 1 / 255, 0);
const INK_DARK = new THREE.Vector3(238 / 255, 238 / 255, 235 / 255);
const SURFACE_LIGHT = new THREE.Vector3(0.42, 0.42, 0.42);
const SURFACE_DARK = new THREE.Vector3(0.56, 0.58, 0.59);
const SHADOW_LIGHT = new THREE.Vector3(0.62, 0.64, 0.63);
const SHADOW_DARK = new THREE.Vector3(0.28, 0.31, 0.32);
/** Softer palette for inline use (project cards): lower contrast so it doesn't pop. */
const SOFT = {
  light: { ink: new THREE.Vector3(0.32, 0.32, 0.31), surface: new THREE.Vector3(0.6, 0.6, 0.6), shadow: new THREE.Vector3(0.76, 0.77, 0.77) },
  dark: { ink: new THREE.Vector3(0.6, 0.6, 0.59), surface: new THREE.Vector3(0.38, 0.39, 0.4), shadow: new THREE.Vector3(0.22, 0.24, 0.25) },
};
const FPS = 30;
const FRAME = 1 / FPS;
/** How long the loading bar takes to fill before the homepage appears (seconds). */
export const LOAD_SECONDS = 8;
/** Saturn resolves out of noise over this long when the loader opens (seconds). */
const APPEAR_SECONDS = 0.9;

export interface DitherParams {
  /** Cell size in CSS px. 0 = auto: max(2px, stage width / 180). */
  cellPx: number;
  contrast: number;
  noiseMul: number;
  /** Key-light azimuth in degrees (upper-left by default). */
  lightAzimuth: number;
  /** Number of particles orbiting inside the rings. */
  ringParticles: number;
}

export const DEFAULT_PARAMS: DitherParams = { cellPx: 0, contrast: 1.6, noiseMul: 1, lightAzimuth: 138, ringParticles: 520 };

export interface EngineOptions {
  /** 0..1 as the loading bar fills. */
  onProgress?: (p: number) => void;
  /** Fires once when loading reaches 100%. The object keeps rotating afterwards. */
  onComplete?: () => void;
  /** Fires once the object has resolved from its opening noise. */
  onReady?: () => void;
  /** Which object to show (default Saturn, as in the loader). */
  object?: "saturn" | PlanetKind;
  /** Softer, lower-contrast colours for inline use. */
  soft?: boolean;
}

type RingParticle = { r: number; angle: number; speed: number };

/**
 * A single dithered object that rotates continuously and never changes:
 * Saturn with particle-filled rings (loader) or Earth/Moon/Mars (project cards).
 */
export class DitherEngine {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  /** Key light: upper-left-front-high, shapes the shading (hard terminator lower-right). */
  private key = new THREE.DirectionalLight(0xffffff, 0.85 * Math.PI);
  /** Shadow light: higher, weaker; casts the floor shadow close under Saturn. */
  private light = new THREE.DirectionalLight(0xffffff, 0.25 * Math.PI);
  private floor: THREE.Mesh<THREE.PlaneGeometry, THREE.ShadowMaterial>;
  private obj: Rig;
  /** Ring data when the object is Saturn; particles orbit inside these rings. */
  private ring: SaturnRig | null = null;
  private rt: THREE.WebGLRenderTarget;
  private mask!: Uint8Array;
  private maskTex!: THREE.DataTexture;
  private post: THREE.ShaderMaterial;
  private postScene = new THREE.Scene();
  private postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private shared = { uTime: { value: 0 }, uLightDir: { value: new THREE.Vector3() } };
  private rand = mulberry32(20260115);
  private params: DitherParams = { ...DEFAULT_PARAMS };
  private cols = 198;
  private rows = 179;
  private particles: RingParticle[] = [];

  private elapsed = 0;
  /** Animation speed multiplier, eased toward speedTarget (used for card hover). */
  private speed = 1;
  private speedTarget = 1;
  /** When false (e.g. scrolled off screen) no frames are rendered. */
  private active = true;
  private frameCount = 0;
  private completed = false;
  private ready = false;
  private paused = false;
  private raf = 0;
  private last = 0;
  private acc = 0;
  private tmp = new THREE.Vector3();
  private stageCss = { w: 0, h: 0 };

  constructor(private canvas: HTMLCanvasElement, private opts: EngineOptions = {}) {
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, premultipliedAlpha: true });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.BasicShadowMap; // hard edges

    // Camera ~20° above the horizon, looking slightly down; floor foreshortens ~1:3.
    this.camera = new THREE.PerspectiveCamera(28, STAGE_AR, 0.1, 60);
    const elev = THREE.MathUtils.degToRad(20);
    // Chosen so the stage spans ~4.55 world units at the object plane (sizes are % of stage width).
    const dist = 8.3;
    const target = new THREE.Vector3(0, 0.88, 0);
    this.camera.position.set(0, target.y + Math.sin(elev) * dist, Math.cos(elev) * dist);
    this.camera.lookAt(target);
    this.camera.updateMatrixWorld();

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.1 * Math.PI));
    this.light.castShadow = true;
    this.light.shadow.mapSize.set(1024, 1024);
    const sc = this.light.shadow.camera;
    sc.left = -4.5;
    sc.right = 4.5;
    sc.top = 4.5;
    sc.bottom = -4.5;
    sc.near = 0.5;
    sc.far = 25;
    this.light.shadow.bias = -0.0004;
    this.light.shadow.normalBias = 0.0;
    this.scene.add(this.light, this.light.target, this.key, this.key.target);
    this.setLight(this.params.lightAzimuth);

    // Invisible floor that only shows the shadow (rendered as alpha => its own lighter tone).
    this.floor = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 40).rotateX(-Math.PI / 2),
      new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.58 }),
    );
    this.floor.receiveShadow = true;
    this.scene.add(this.floor);

    const env: Env = { shared: this.shared, viewQuaternion: this.camera.quaternion.clone() };
    const kind = opts.object ?? "saturn";
    if (kind === "saturn") {
      this.ring = createSaturn(env);
      this.obj = this.ring;
    } else {
      this.obj = createPlanet(env, kind);
    }
    this.scene.add(this.obj.root);
    this.floor.material.opacity = this.obj.shadowOpacity;

    this.rt = new THREE.WebGLRenderTarget(this.cols * 2, this.rows * 2, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      depthBuffer: true,
    });
    this.allocMask();
    this.post = createPostMaterial(this.rt.texture, this.maskTex);
    this.postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.post));
    // Inline planets use a gentler tone curve so surface markings stay readable.
    if (opts.soft) this.params.contrast = 1.15;
    this.post.uniforms.uContrast.value = this.params.contrast;
    if (this.ring) this.seedParticles(this.params.ringParticles);
    this.resize();
  }

  /* ---------- public API ---------- */

  start() {
    this.last = performance.now();
    const loop = (now: number) => {
      this.raf = requestAnimationFrame(loop);
      this.acc += Math.min((now - this.last) / 1000, 0.25);
      this.last = now;
      if (!this.active) return;
      if (this.acc < FRAME) return; // cap at 30fps for the stepped feel
      this.acc %= FRAME;
      this.tick();
    };
    this.raf = requestAnimationFrame(loop);
  }

  resize() {
    // The canvas is the stage box; the stage is fitted inside it (normally exactly).
    const vw = Math.max(1, this.canvas.clientWidth), vh = Math.max(1, this.canvas.clientHeight);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(vw, vh, false);
    const sw = vw / vh > STAGE_AR ? vh * STAGE_AR : vw;
    const sh = sw / STAGE_AR;
    this.stageCss = { w: sw, h: sh };
    // Consistent fine cells in CSS px; the target is rendered at this resolution.
    // Inline planets (soft) use finer cells for extra surface detail.
    const minCell = this.opts.soft ? 1.6 : MIN_CELL;
    const cell = this.params.cellPx > 0 ? Math.max(minCell, this.params.cellPx) : Math.max(minCell, sw / 180);
    // Floor (not round) so the actual cell never drops below the minimum.
    const cols = Math.max(24, Math.floor(sw / cell));
    const rows = Math.max(22, Math.floor(sh / cell));
    if (cols !== this.cols || rows !== this.rows) this.setCells(cols, rows);
    const u = this.post.uniforms;
    u.uOrigin.value.set(((vw - sw) / 2) * dpr, ((vh - sh) / 2) * dpr);
    u.uStage.value.set(sw * dpr, sh * dpr);
    // Thin gap between dots only when a cell is big enough to keep a solid dot.
    const cellDevice = (sw * dpr) / this.cols;
    u.uGap.value = cellDevice >= 4 ? Math.max(1, Math.round(cellDevice * 0.18)) : 0;
  }

  setParams(p: Partial<DitherParams>) {
    const next = { ...this.params, ...p };
    const cellChanged = next.cellPx !== this.params.cellPx;
    if (next.lightAzimuth !== this.params.lightAzimuth) this.setLight(next.lightAzimuth);
    this.post.uniforms.uContrast.value = next.contrast;
    if (this.ring && next.ringParticles !== this.params.ringParticles) this.seedParticles(next.ringParticles);
    this.params = next;
    if (cellChanged) this.resize();
  }

  getParams() {
    return { ...this.params };
  }

  togglePause() {
    this.paused = !this.paused;
  }

  /** Smoothly changes rotation and orbit speed (1 = normal). */
  setSpeed(multiplier: number) {
    this.speedTarget = multiplier;
  }

  /** Stops rendering while hidden; resumes without a jump in time. */
  setActive(active: boolean) {
    this.active = active;
    this.last = performance.now();
    this.acc = 0;
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    const done = new Set<unknown>();
    const free = (o: { dispose(): void }) => {
      if (done.has(o)) return;
      done.add(o);
      o.dispose();
    };
    for (const s of [this.scene, this.postScene]) {
      s.traverse((obj) => {
        const m = obj as THREE.Mesh;
        if (m.geometry) free(m.geometry);
        const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
        mats.forEach(free);
        if (m.customDepthMaterial) free(m.customDepthMaterial);
      });
    }
    this.light.shadow.map?.dispose();
    this.rt.dispose();
    this.maskTex.dispose();
    this.renderer.dispose();
  }

  /** Debug measurement: stage size, cell size and Saturn's on-screen size as % of the stage. */
  measure() {
    const v = new THREE.Vector3();
    const r = this.obj;
    r.root.updateMatrixWorld(true);
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    r.root.traverse((o) => {
      const g = (o as THREE.Mesh).geometry as THREE.BufferGeometry | undefined;
      const pos = g?.attributes.position as THREE.BufferAttribute | undefined;
      if (!pos || !o.visible) return;
      for (let i = 0; i < pos.count; i += 2) {
        v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld).project(this.camera);
        minX = Math.min(minX, v.x); maxX = Math.max(maxX, v.x);
        minY = Math.min(minY, v.y); maxY = Math.max(maxY, v.y);
      }
    });
    this.tmp.set(0, r.root.position.y, 0).project(this.camera);
    const centerY = (1 - (this.tmp.y * 0.5 + 0.5)) * 100;
    this.tmp.set(0, 0, 0).project(this.camera);
    return {
      stage: { ...this.stageCss },
      cell: this.stageCss.w / this.cols,
      floorY: (1 - (this.tmp.y * 0.5 + 0.5)) * 100,
      objects: [{ key: r.key, width: ((maxX - minX) / 2) * 100, height: ((maxY - minY) / 2) * 100, centerY }],
    };
  }

  /* ---------- internals ---------- */

  private setLight(azimuthDeg: number) {
    const dirFrom = (elDeg: number, azDeg: number) => {
      const el = THREE.MathUtils.degToRad(elDeg), az = THREE.MathUtils.degToRad(azDeg);
      return new THREE.Vector3(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az)).normalize();
    };
    const keyDir = dirFrom(33, azimuthDeg);
    const shadowDir = dirFrom(68, azimuthDeg + 60);
    this.shared.uLightDir.value.copy(keyDir);
    this.key.position.copy(keyDir).multiplyScalar(10);
    this.light.position.copy(shadowDir).multiplyScalar(10);
  }

  private setCells(cols: number, rows: number) {
    this.cols = cols;
    this.rows = rows;
    // Rendered at 2x so the floor shadow can use cells half the size of the object's.
    this.rt.setSize(cols * 2, rows * 2);
    this.maskTex.dispose();
    this.allocMask();
    this.post.uniforms.tMask.value = this.maskTex;
    this.post.uniforms.uCells.value.set(cols, rows);
  }

  private allocMask() {
    this.mask = new Uint8Array(this.cols * this.rows);
    this.maskTex = new THREE.DataTexture(this.mask, this.cols, this.rows, THREE.RedFormat, THREE.UnsignedByteType);
    this.maskTex.minFilter = THREE.NearestFilter;
    this.maskTex.magFilter = THREE.NearestFilter;
    this.maskTex.needsUpdate = true;
  }

  /** Particles sit inside the ring bands; inner ones orbit faster (Kepler-like). */
  private seedParticles(count: number) {
    const widths = RING_BANDS.map(([a, b]) => b - a);
    const total = widths.reduce((s, w) => s + w, 0);
    this.particles = Array.from({ length: Math.max(0, Math.round(count)) }, () => {
      let pick = this.rand() * total;
      let band = RING_BANDS[0];
      for (let i = 0; i < RING_BANDS.length; i++) {
        pick -= widths[i];
        if (pick <= 0) { band = RING_BANDS[i]; break; }
      }
      const r = band[0] + this.rand() * (band[1] - band[0]);
      return { r, angle: this.rand() * Math.PI * 2, speed: 0.55 * Math.pow(1.35 / r, 1.5) };
    });
  }

  /** Draws the orbiting ring particles into the cell mask, hidden behind the planet. */
  private drawParticles() {
    const s = this.ring;
    if (!s) return;
    s.root.updateMatrixWorld(true);
    const m = s.ringSpace.matrixWorld;
    const view = this.camera.matrixWorldInverse;
    const center = this.tmp.setFromMatrixPosition(s.root.matrixWorld).applyMatrix4(view);
    const cx = center.x, cy = center.y, cz = center.z;
    const pr = s.planetRadius * s.root.scale.x;
    const p = new THREE.Vector3();
    for (const q of this.particles) {
      const r = q.r * s.ringRadius;
      p.set(Math.cos(q.angle) * r, 0, Math.sin(q.angle) * r).applyMatrix4(m);
      const pv = p.clone().applyMatrix4(view);
      if (pv.z < cz && Math.hypot(pv.x - cx, pv.y - cy) < pr) continue; // behind the planet
      p.project(this.camera);
      const x = Math.round((p.x * 0.5 + 0.5) * this.cols - 0.5);
      const y = Math.round((1 - (p.y * 0.5 + 0.5)) * this.rows - 0.5);
      if (x < 0 || y < 0 || x >= this.cols || y >= this.rows) continue;
      this.mask[(this.rows - 1 - y) * this.cols + x] = 255;
    }
  }

  private tick() {
    if (!this.paused) {
      this.speed += (this.speedTarget - this.speed) * 0.12;
      this.elapsed += FRAME * this.speed;
      this.frameCount++;
      for (const q of this.particles) q.angle -= q.speed * FRAME * this.speed; // clockwise orbit
      if (!this.completed) {
        this.opts.onProgress?.(clamp01(this.elapsed / LOAD_SECONDS));
        if (this.elapsed >= LOAD_SECONDS) {
          this.completed = true;
          this.opts.onComplete?.();
        }
      }
      if (!this.ready && this.elapsed >= APPEAR_SECONDS) {
        this.ready = true;
        this.opts.onReady?.();
      }
    }
    this.render();
  }

  private render() {
    const t = this.elapsed;
    this.shared.uTime.value = t;
    const s = this.obj;

    // Resolve out of noise when the loader opens, then stay solid.
    const appear = easeFray(clamp01(t / APPEAR_SECONDS));
    s.root.position.set(0, s.baseY, 0);
    s.root.scale.setScalar(1);
    s.u.uDissolve.value = 1 - appear;
    s.su.uDissolve.value = 1 - appear;
    s.u.uBiasMode.value = 1;
    s.su.uBiasMode.value = 1;
    s.animate(t, LOAD_SECONDS);

    const pu = this.post.uniforms;
    const dark = document.documentElement.classList.contains("dark");
    if (this.opts.soft) {
      const pal = dark ? SOFT.dark : SOFT.light;
      pu.uInk.value.copy(pal.ink);
      pu.uSurfaceLight.value.copy(pal.surface);
      pu.uShadowInk.value.copy(pal.shadow);
    } else {
      pu.uInk.value.copy(dark ? INK_DARK : INK_LIGHT);
      pu.uSurfaceLight.value.copy(dark ? SURFACE_DARK : SURFACE_LIGHT);
      pu.uShadowInk.value.copy(dark ? SHADOW_DARK : SHADOW_LIGHT);
    }
    pu.uNoise.value = (1 - appear) * 0.8 * this.params.noiseMul;
    pu.uBias.value = 0;
    pu.uSeed.value = (this.frameCount * 7.31) % 97;

    this.mask.fill(0);
    if (appear > 0.6) this.drawParticles();
    this.maskTex.needsUpdate = true;

    const r = this.renderer;
    r.setRenderTarget(this.rt);
    r.setClearColor(0x000000, 0);
    r.clear();
    r.render(this.scene, this.camera);
    r.setRenderTarget(null);
    r.clear();
    r.render(this.postScene, this.postCam);
  }
}
