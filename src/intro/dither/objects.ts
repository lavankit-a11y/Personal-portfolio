import * as THREE from "three";
import { applyDissolve, gray, makeDissolveUniforms, type DissolveUniforms, type SharedUniforms } from "./dissolve";
import { clamp01, mulberry32, vnoise3 } from "./math";

/**
 * Procedural Saturn for the loader. World units: the stage is ~4.55 units wide
 * at the object plane, so 1 unit ≈ 22% of stage width. The floor is y = 0.
 */
export const STAGE_W = 4.55;

export type ObjectKey = "saturn" | "earth" | "moon" | "mars";

export interface Rig {
  key: ObjectKey;
  root: THREE.Group;
  /** Colour pass and shadow (depth) pass dissolve uniforms. */
  u: DissolveUniforms;
  su: DissolveUniforms;
  baseY: number;
  shadowOpacity: number;
  /** Rough visual radius (world units), used for dust density. */
  radius: number;
  /** time: seconds since the loader started. */
  animate(time: number, holdDur: number): void;
}

export interface Env {
  shared: SharedUniforms;
  /** Camera orientation, so ring inclination can be expressed relative to the view. */
  viewQuaternion: THREE.Quaternion;
}

type Kit = {
  u: DissolveUniforms;
  su: DissolveUniforms;
  depth: THREE.MeshDepthMaterial;
  lambert(v: number, opts?: { flat?: boolean; side?: THREE.Side; coverage?: { value: number }; vertexColors?: boolean }): THREE.MeshLambertMaterial;
  mesh(geo: THREE.BufferGeometry, mat: THREE.Material, parent: THREE.Object3D, opts?: { coverage?: { value: number }; double?: boolean }): THREE.Mesh;
  line(points: THREE.Vector3[], parent: THREE.Object3D): THREE.Line;
};

function kit(env: Env): Kit {
  const u = makeDissolveUniforms(env.shared);
  const su = makeDissolveUniforms(env.shared);
  const depth = applyDissolve(new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking }), su);
  const depthFor = new Map<string, THREE.MeshDepthMaterial>();
  return {
    u,
    su,
    depth,
    lambert(v, opts = {}) {
      const mu = opts.coverage ? { ...u, uCoverage: opts.coverage } : u;
      return applyDissolve(
        new THREE.MeshLambertMaterial({
          color: gray(v),
          flatShading: !!opts.flat,
          side: opts.side ?? THREE.FrontSide,
          vertexColors: !!opts.vertexColors,
        }),
        mu,
      );
    },
    mesh(geo, mat, parent, opts = {}) {
      const m = new THREE.Mesh(geo, mat);
      m.castShadow = true;
      m.receiveShadow = true;
      if (opts.coverage || opts.double) {
        const key = `${opts.double ? "d" : "s"}`;
        let d = opts.coverage ? undefined : depthFor.get(key);
        if (!d) {
          const du = opts.coverage ? { ...su, uCoverage: opts.coverage } : su;
          d = applyDissolve(new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, side: THREE.DoubleSide }), du);
          if (!opts.coverage) depthFor.set(key, d);
        }
        m.customDepthMaterial = d;
      } else {
        m.customDepthMaterial = depth;
      }
      parent.add(m);
      return m;
    },
    line(points, parent) {
      const l = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(points),
        applyDissolve(new THREE.LineBasicMaterial({ color: gray(0) }), u),
      );
      parent.add(l);
      return l;
    },
  };
}

function rig(key: ObjectKey, k: Kit, root: THREE.Group, baseY: number, shadowOpacity: number, radius: number, animate: Rig["animate"]): Rig {
  return { key, root, u: k.u, su: k.su, baseY, shadowOpacity, radius, animate };
}

/** Writes per-vertex grey albedo so surface markings show through the dither. */
function setAlbedo(geo: THREE.BufferGeometry, fn: (x: number, y: number, z: number) => number) {
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const col = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const c = clamp01(fn(pos.getX(i), pos.getY(i), pos.getZ(i)));
    col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = c;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
}

/* ---------------- Saturn ---------------- */

function ringGeo(inner: number, outer: number) {
  return new THREE.RingGeometry(inner, outer, 160, 1).rotateX(-Math.PI / 2);
}

function edgeBand(radius: number, height: number) {
  return new THREE.CylinderGeometry(radius, radius, height, 160, 1, true);
}

type RingSet = { tilt: THREE.Group; coverage: { value: number } };

/** C ring, banded B ring, Cassini division, A ring with the Encke gap, dark outer edge. */
const RINGLETS: [number, number, number][] = [
  [1.24, 1.34, 0.55],
  [1.35, 1.44, 0.96],
  [1.44, 1.49, 0.78],
  [1.49, 1.56, 0.98],
  [1.56, 1.62, 0.86],
  // Cassini division 1.62–1.71
  [1.71, 1.8, 0.6],
  [1.8, 1.87, 0.5],
  // Encke gap 1.87–1.9
  [1.9, 2.04, 0.42],
  [2.04, 2.1, 0.06],
];

function buildRings(k: Kit, parent: THREE.Object3D, R: number): RingSet {
  const tilt = new THREE.Group();
  parent.add(tilt);
  const coverage = { value: 1 };
  const side = THREE.DoubleSide;
  const opts = { coverage, double: true };
  for (const [a, b, v] of RINGLETS) k.mesh(ringGeo(a * R, b * R), k.lambert(v, { side, coverage }), tilt, opts);
  // Thin bands so the ring still reads as a line when seen edge-on.
  k.mesh(edgeBand(2.09 * R, 0.035), k.lambert(0.04, { side, coverage }), tilt, opts);
  k.mesh(edgeBand(1.45 * R, 0.03), k.lambert(0.85, { side, coverage }), tilt, opts);
  return { tilt, coverage };
}

/** Banded gas-giant sphere: latitude cloud belts, turbulent edges, darker poles. */
function planetGeo(R: number) {
  const g = new THREE.SphereGeometry(R, 120, 90);
  setAlbedo(g, (x, y, z) => {
    const ny = y / R;
    const lon = Math.atan2(z, x);
    const wobble = 0.03 * Math.sin(lon * 3 + ny * 9) + 0.02 * vnoise3(x * 6, y * 14, z * 6);
    const belts = Math.sin((ny + wobble) * 19) * 0.5 + 0.5;
    const fine = Math.sin((ny + wobble) * 47) * 0.5 + 0.5;
    const pole = THREE.MathUtils.smoothstep(Math.abs(ny), 0.72, 0.95);
    return 0.95 - 0.16 * belts * belts - 0.06 * fine - 0.22 * pole;
  });
  return g;
}


/** Ring band radii (× planet radius) where orbiting ring particles live; gaps stay empty. */
export const RING_BANDS: [number, number][] = [
  [1.24, 1.34],
  [1.35, 1.62],
  [1.71, 1.87],
  [1.9, 2.1],
];

export interface SaturnRig extends Rig {
  /** Group in the ring plane (local XZ); ring particles are placed in its space. */
  ringSpace: THREE.Group;
  /** Ring scale: radii in RING_BANDS are multiplied by this. */
  ringRadius: number;
  /** World-space planet radius, for hiding ring particles behind the planet. */
  planetRadius: number;
}

/**
 * The Saturn that follows the telescope, held in its final pose: solid banded
 * rings at ~55° inclination rolled ~25° counter-clockwise. It turns clockwise
 * continuously while loading and never changes into another object.
 */
export function createSaturn(env: Env): SaturnRig {
  const k = kit(env);
  const root = new THREE.Group();
  const R = 0.57; // 25% of stage width
  const planet = k.mesh(planetGeo(R), k.lambert(1, { vertexColors: true }), root);
  const frame = new THREE.Group();
  frame.quaternion.copy(env.viewQuaternion);
  root.add(frame);
  const ringRadius = R * 1.21; // final ring spans ~59% of stage width
  const rings = buildRings(k, frame, ringRadius);
  rings.tilt.rotation.set(THREE.MathUtils.degToRad(55), 0, THREE.MathUtils.degToRad(25));
  // Spins within the ring plane, so the ring texture and particles keep moving.
  const ringSpace = new THREE.Group();
  rings.tilt.add(ringSpace);

  const r = rig("saturn", k, root, 1.2, 0.58, 2.35 * R, (time) => {
    planet.rotation.y = -time * 0.35; // continuous clockwise rotation
    planet.rotation.z = 0.12;
    ringSpace.rotation.y = -time * 0.18;
    // Gentle float so it never sits completely still.
    root.position.y += Math.sin(time * 1.4) * 0.04;
  });
  return { ...r, ringSpace, ringRadius, planetRadius: R };
}

/* ---------------- Earth, Moon, Mars (project cards) ---------------- */

export type PlanetKind = "earth" | "moon" | "mars";

/** Multi-octave value noise on a unit direction, roughly in [-1, 1]. */
const fbm = (x: number, y: number, z: number, f: number) =>
  0.6 * vnoise3(x * f, y * f, z * f) + 0.3 * vnoise3(x * f * 2.1, y * f * 2.1, z * f * 2.1) + 0.1 * vnoise3(x * f * 4.3, y * f * 4.3, z * f * 4.3);

type Crater = { dir: THREE.Vector3; cos: number; size: number };

function craterField(seed: number, count: number, min: number, max: number): Crater[] {
  const rnd = mulberry32(seed);
  return Array.from({ length: count }, () => {
    const dir = new THREE.Vector3(rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1).normalize();
    const size = min + Math.pow(rnd(), 2.2) * (max - min);
    return { dir, cos: Math.cos(size * 1.4), size };
  });
}

/** Detailed sphere: craters displace the surface, albedo paints its markings. */
function planetSurface(kind: PlanetKind, R: number) {
  const g = new THREE.SphereGeometry(R, 200, 150);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const craters =
    kind === "moon" ? craterField(11, 72, 0.025, 0.17) : kind === "mars" ? craterField(23, 34, 0.022, 0.1) : [];
  const depth = kind === "moon" ? 0.32 : 0.18;
  const floorDark = new Float32Array(pos.count);
  const d = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    d.fromBufferAttribute(pos, i).normalize();
    let h = kind === "earth" ? 0.006 * fbm(d.x, d.y, d.z, 6) : 0.012 * fbm(d.x, d.y, d.z, 3) + 0.005 * fbm(d.x, d.y, d.z, 11);
    // Mars: a broad shield volcano (Olympus Mons) with a summit caldera.
    if (kind === "mars") {
      const v = Math.acos(Math.min(1, d.x * 0.55 + d.y * 0.35 + d.z * 0.76)) / 0.22;
      if (v < 1) h += 0.05 * (1 - v * v) - (v < 0.18 ? 0.03 * (1 - v / 0.18) : 0);
    }
    let dark = 0;
    for (const c of craters) {
      const cd = d.dot(c.dir);
      if (cd < c.cos) continue;
      const a = Math.acos(Math.min(1, cd)) / c.size; // 0 centre, 1 rim
      if (a < 1) { h -= depth * c.size * (1 - a * a); dark = Math.max(dark, 0.14 * (1 - a)); }
      else if (a < 1.35) h += 0.4 * depth * c.size * (1 - Math.abs(a - 1.15) / 0.2);
    }
    floorDark[i] = dark;
    pos.setXYZ(i, d.x * (R + h), d.y * (R + h), d.z * (R + h));
  }
  g.computeVertexNormals();

  let vi = 0;
  setAlbedo(g, (x, y, z) => {
    const l = Math.hypot(x, y, z);
    const nx = x / l, ny = y / l, nz = z / l;
    const fd = floorDark[vi++];
    if (kind === "earth") {
      // Continents vs oceans, polar ice, and bright cloud bands.
      // Ragged coastlines from an extra high-frequency octave.
      const coast = fbm(nx + 1.7, ny, nz - 0.6, 1.6) + 0.12 * fbm(nx, ny, nz, 9);
      const land = THREE.MathUtils.smoothstep(coast, 0.03, 0.09);
      const relief = 0.1 * fbm(nx, ny, nz, 7) + 0.06 * fbm(nx, ny, nz, 15);
      const desert = 0.12 * THREE.MathUtils.smoothstep(1 - Math.abs(ny * 3.3 - 0.9), 0.4, 0.9);
      const ice = THREE.MathUtils.smoothstep(Math.abs(ny), 0.82, 0.92);
      const swirl = 0.15 * Math.sin(Math.atan2(nz, nx) * 2 + ny * 6);
      const cloud = THREE.MathUtils.smoothstep(
        fbm(nx * 1.4, ny * 3.2 + swirl, nz * 1.4, 2.4) + 0.25 * fbm(nx, ny * 2, nz, 8),
        0.2,
        0.45,
      );
      const base = 0.22 + land * (0.5 + relief + desert);
      return Math.min(1, base + ice * 0.5 + cloud * 0.55);
    }
    if (kind === "mars") {
      // Dusty surface with darker regions, a long canyon and a bright polar cap.
      const regions = THREE.MathUtils.smoothstep(fbm(nx - 2, ny * 1.3, nz + 1, 1.8), 0.0, 0.3);
      const canyon = Math.abs(ny + 0.08 + 0.05 * Math.sin(Math.atan2(nz, nx) * 3)) < 0.025 && nx > -0.2 ? 0.25 : 0;
      const cap = THREE.MathUtils.smoothstep(ny, 0.84, 0.92) + 0.6 * THREE.MathUtils.smoothstep(-ny, 0.88, 0.95);
      const grain = 0.06 * fbm(nx, ny, nz, 9) + 0.04 * fbm(nx, ny, nz, 20);
      const shield = Math.acos(Math.min(1, nx * 0.55 + ny * 0.35 + nz * 0.76)) < 0.22 ? 0.08 : 0;
      return 0.8 - 0.42 * regions - canyon * 1.4 - fd * 1.5 + cap * 0.4 + grain + shield;
    }
    // Moon: darker maria, crater floors and fine speckle.
    const maria = THREE.MathUtils.smoothstep(fbm(nx * 1.1 + 3, ny * 1.1, nz * 1.1 - 2, 1.5), 0.05, 0.35);
    const speck = 0.05 * fbm(nx, ny, nz, 12) + 0.04 * fbm(nx, ny, nz, 26);
    // Bright ray streaks around one young crater.
    const rays = Math.max(0, Math.sin(Math.atan2(nz - 0.2, nx + 0.4) * 14)) * THREE.MathUtils.smoothstep(-nx * 0.4 + ny * 0.6 + nz * 0.7, 0.75, 0.95) * 0.12;
    return 0.92 - 0.45 * maria - fd * 1.8 + speck + rays;
  });
  return g;
}

/** A rotating Earth, Moon or Mars for the project cards (no rings). */
export function createPlanet(env: Env, kind: PlanetKind): Rig {
  const k = kit(env);
  const root = new THREE.Group();
  const tilt = new THREE.Group();
  tilt.rotation.z = kind === "earth" ? 0.41 : kind === "mars" ? 0.44 : 0.1; // axial tilt
  root.add(tilt);
  const R = 1.0; // 44% of the stage width
  const planet = k.mesh(planetSurface(kind, R), k.lambert(1, { vertexColors: true }), tilt);
  const spin = kind === "moon" ? 0.22 : 0.3;
  return rig(kind, k, root, 1.2, 0.5, R, (time) => {
    planet.rotation.y = -time * spin; // continuous clockwise rotation
    root.position.y += Math.sin(time * 1.2) * 0.035;
  });
}
