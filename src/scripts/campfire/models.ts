// Campfire scene figures, built from primitives and canvas textures (no imported models).
// Units are metres. Every builder returns a Group whose origin sits on the ground under the object.
// Anything that moves registers a tick in userData.ticks; the scene calls them every frame.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import * as T from './textures';

export type Tick = (t: number) => void;
const onTick = (o: THREE.Object3D, fn: Tick) => {
  (o.userData.ticks ??= []).push(fn);
};

const std = (color: string, extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0, ...extra });
const phys = (color: string, extra: THREE.MeshPhysicalMaterialParameters = {}) =>
  new THREE.MeshPhysicalMaterial({ color, roughness: 0.4, metalness: 0, ...extra });
const glow = (color: string, opacity: number) =>
  new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false });

const M = {
  shell: phys('#efefeb', { roughness: 0.3, clearcoat: 0.5, clearcoatRoughness: 0.25 }),
  shellBack: std('#c9cac6', { roughness: 0.45 }),
  glass: phys('#06080a', { roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.04 }),
  bezel: std('#101113', { roughness: 0.35 }),
  plastic: std('#1d1f22', { roughness: 0.5 }),
  qr: phys('#0d2a22', { roughness: 0.05, clearcoat: 1 }),
  printer: std('#121315', { roughness: 0.68 }),
  printerLid: std('#1b1c1f', { roughness: 0.35 }),
  alu: std('#c3c7cc', { roughness: 0.3, metalness: 0.85 }),
  aluDark: std('#5d6168', { roughness: 0.35, metalness: 0.8 }),
  key: std('#18191c', { roughness: 0.6 }),
  green: std('#3ecf8e', { roughness: 0.4 }),
  led: new THREE.MeshBasicMaterial({ color: '#4dffa6' }),
  // Weathered, reclaimed-looking boards for the outdoor desk
  plank: std('#ffffff', { map: T.wood('#9a7650', '#5a3f27'), roughness: 0.82 }),
  boardsV: [T.woodV('#8a6a48', '#523a24'), T.woodV('#957351', '#5c4129'), T.woodV('#7f6143', '#4a3421')].map((map) => std('#ffffff', { map, roughness: 0.85 })),
  boardsH: [T.wood('#8a6a48', '#523a24'), T.wood('#957351', '#5c4129')].map((map) => std('#ffffff', { map, roughness: 0.85 })),
  seam: std('#2a1c12', { roughness: 1 }),
  iron: std('#26221f', { roughness: 0.55, metalness: 0.7, side: THREE.DoubleSide }),
  walnut: std('#ffffff', { map: T.wood('#6b4630', '#3d2617'), roughness: 0.45 }),
  deskInner: std('#2e2117', { roughness: 0.95 }),
  pineBark: std('#a39486', { map: T.bark(), roughness: 0.95 }),
  needle: std('#ffffff', { roughness: 0.7 }),
  padCore: std('#22371a', { roughness: 0.95 }),
  candle: std('#a7b97a', { roughness: 0.7 }),
  moss: std('#3a5122', { roughness: 1 }),
  mossLight: std('#55702e', { roughness: 1 }),
  bonsaiPot: std('#5e4636', { roughness: 0.82 }),
  slabTop: std('#ffffff', { map: T.rings(), roughness: 0.7 }),
  bark: std('#ffffff', { map: T.bark(), roughness: 0.95, side: THREE.DoubleSide }),
  logBark: std('#8f8f8f', { map: T.bark(), roughness: 0.95 }),
  logEnd: std('#ffffff', { map: T.endGrain(), roughness: 0.9 }),
  dirt: std('#ffffff', { map: T.dirt(), roughness: 1 }),
  ash: std('#3b3836', { roughness: 1 }),
  stones: ['#7b776f', '#8b867d', '#67635c', '#958f84'].map((c) => std(c, { roughness: 0.9 })),
  paper: std('#ffffff', { map: T.receipt(), side: THREE.DoubleSide, roughness: 0.85 }),
  pages: std('#eee7d8', { roughness: 0.95 }),
  diary: std('#262321', { roughness: 0.75 }),
  band: std('#0c0d0e', { roughness: 0.5 }),
  pen: std('#cfd2d6', { roughness: 0.22, metalness: 0.9 }),
  ceramic: phys('#f4f2ee', { roughness: 0.2, clearcoat: 0.7, side: THREE.DoubleSide }),
  coffee: phys('#2a160b', { roughness: 0.05, clearcoat: 1 }),
  whitePot: phys('#ecebe6', { roughness: 0.28, clearcoat: 0.4, side: THREE.DoubleSide }),
  soil: std('#2b1f17', { roughness: 1 }),
  pebble: std('#a39c90', { roughness: 0.8 }),
  jade: phys('#46783a', { roughness: 0.35, clearcoat: 0.45, clearcoatRoughness: 0.3 }),
  jadeYoung: phys('#7aa653', { roughness: 0.4, clearcoat: 0.3 }),
  can: std('#79a79d', { roughness: 0.38, metalness: 0.4, side: THREE.DoubleSide }),
  cardFace: std('#ffffff', { map: T.cardFace(), roughness: 0.35 }),
  cardBack: std('#17191c', { roughness: 0.4 }),
  ember: std('#2a1208', { emissive: '#ff5a10', emissiveIntensity: 1.6, roughness: 1 }),
  ember2: std('#2a1208', { emissive: '#ff8a20', emissiveIntensity: 1.2, roughness: 1 }),
  label: new THREE.MeshBasicMaterial({ map: T.wordmark(), transparent: true }),
  grille: new THREE.MeshBasicMaterial({ map: T.grille(), transparent: true }),
};

// ---------------------------------------------------------------- helpers

const clampR = (r: number, w: number, h: number, d: number) => Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4);

/** Rounded box centred on its origin. */
function rboxC(w: number, h: number, d: number, r: number, m: THREE.Material) {
  return new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, clampR(r, w, h, d)), m);
}
/** Rounded box resting on y = 0. */
function rbox(w: number, h: number, d: number, r: number, m: THREE.Material) {
  const mesh = rboxC(w, h, d, r, m);
  mesh.position.y = h / 2;
  return mesh;
}
function cyl(rTop: number, rBot: number, h: number, m: THREE.Material | THREE.Material[], seg = 24) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, seg), m);
  mesh.position.y = h / 2;
  return mesh;
}
/** Turned shape from a [radius, height] profile listed bottom to top. */
function lathe(profile: [number, number][], m: THREE.Material, seg = 40) {
  return new THREE.Mesh(new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), seg), m);
}
function tube(points: [number, number, number][], r: number, m: THREE.Material, seg = 24) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  return new THREE.Mesh(new THREE.TubeGeometry(curve, seg, r, 8, false), m);
}
/** Tube that thins from r0 to r1 along its length, with slight knobbly swelling (trunks, branches, roots). */
function taper(points: [number, number, number][], r0: number, r1: number, m: THREE.Material, seg = 24, radial = 10) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  const geo = new THREE.TubeGeometry(curve, seg, 1, radial, false);
  const p = geo.attributes.position, c = new THREE.Vector3();
  for (let i = 0; i <= seg; i++) {
    const v = i / seg;
    curve.getPointAt(v, c);
    const r = (r1 + (r0 - r1) * Math.pow(1 - v, 1.4)) * (1 + Math.sin(v * 23) * 0.06);
    for (let j = 0; j <= radial; j++) {
      const k = i * (radial + 1) + j;
      p.setXYZ(k, c.x + (p.getX(k) - c.x) * r, c.y + (p.getY(k) - c.y) * r, c.z + (p.getZ(k) - c.z) * r);
    }
  }
  return new THREE.Mesh(geo, m);
}
function at<T extends THREE.Object3D>(o: T, x: number, y: number, z: number) {
  o.position.set(x, o.position.y + y, z);
  return o;
}
function group(name: string, ...children: THREE.Object3D[]) {
  const g = new THREE.Group();
  g.name = name;
  if (children.length) g.add(...children);
  return g;
}
/** Flat sticker (label, grille) facing +z. */
function decal(w: number, h: number, m: THREE.Material) {
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
}

// ---------------------------------------------------------------- bonfire

const flameGeo = new THREE.LatheGeometry(
  Array.from({ length: 17 }, (_, i) => {
    const v = i / 16;
    return new THREE.Vector2(Math.sin(Math.PI * Math.pow(v, 0.55)) * (1 - v * 0.2) + 1e-4, v);
  }),
  20,
);

export function bonfire() {
  const g = group('bonfire');
  T.reseed(11);

  // Ground patch with a ragged edge
  const patchGeo = new THREE.CircleGeometry(0.85, 64);
  const pp = patchGeo.attributes.position;
  for (let i = 1; i < pp.count; i++) {
    const a = Math.atan2(pp.getY(i), pp.getX(i));
    const k = 1 + Math.sin(a * 5 + 1) * 0.05 + Math.sin(a * 13) * 0.025;
    pp.setXY(i, pp.getX(i) * k, pp.getY(i) * k);
  }
  const patch = new THREE.Mesh(patchGeo, M.dirt);
  patch.rotation.x = -Math.PI / 2;
  patch.position.y = 0.004;
  g.add(patch);
  g.add(at(cyl(0.28, 0.34, 0.025, M.ash, 32), 0, 0, 0));

  // Stone ring: all about the same size, but each a clearly different shape (rounded boulder, faceted chunk,
  // flat slab, long wedge...), in mixed greys. Each shape's proportions keep roughly the same volume.
  const n = 14;
  const kinds: { geo: (r: number) => THREE.BufferGeometry; s: [number, number, number]; lump: number; f: number }[] = [
    { geo: (r) => new THREE.IcosahedronGeometry(r, 2), s: [1.15, 0.8, 1.05], lump: 0.1, f: 2.2 }, // smooth river boulder
    { geo: (r) => new THREE.DodecahedronGeometry(r, 0), s: [1.1, 0.85, 1.05], lump: 0.12, f: 3 }, // faceted chunk
    { geo: (r) => new THREE.IcosahedronGeometry(r, 1), s: [1.45, 0.55, 1.2], lump: 0.08, f: 2.5 }, // flat slab
    { geo: (r) => new THREE.OctahedronGeometry(r, 1), s: [1.5, 0.75, 0.85], lump: 0.12, f: 2 }, // long wedge
    { geo: (r) => new THREE.IcosahedronGeometry(r, 1), s: [1, 0.95, 1], lump: 0.22, f: 1.6 }, // round lump with a dent
    { geo: (r) => new THREE.IcosahedronGeometry(r, 2), s: [1.2, 0.95, 0.85], lump: 0.2, f: 4.2 }, // knobbly egg
  ];
  for (let i = 0; i < n; i++) {
    const kind = kinds[(i * 5) % kinds.length];
    const r = 0.085 + (T.rand() - 0.5) * 0.01;
    const geo = kind.geo(r);
    // Lumps come from the vertex's direction, so the copies of a shared corner move together (no cracks).
    const sp = geo.attributes.position;
    const ph = T.rand() * 10;
    for (let k = 0; k < sp.count; k++) {
      const x = sp.getX(k) / r, y = sp.getY(k) / r, z = sp.getZ(k) / r;
      const s = 1 + Math.sin(x * kind.f + ph) * Math.cos(z * kind.f * 0.9 + ph) * kind.lump + Math.sin(y * kind.f * 1.4 + ph * 2) * kind.lump * 0.45;
      sp.setXYZ(k, sp.getX(k) * s, sp.getY(k) * s, sp.getZ(k) * s);
    }
    geo.computeVertexNormals();
    const stone = new THREE.Mesh(geo, M.stones[i % M.stones.length]);
    const a = (i / n) * Math.PI * 2 + T.rand() * 0.1;
    stone.position.set(Math.cos(a) * 0.58, r * kind.s[1] * 0.7, Math.sin(a) * 0.54);
    stone.rotation.set((T.rand() - 0.5) * 0.4, T.rand() * 6, (T.rand() - 0.5) * 0.4); // lying flat, any heading
    stone.scale.set(...kind.s);
    g.add(stone);
  }

  // Logs leaning into a low, wide tepee, with cut ends
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + 0.3;
    const l = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.042, 0.42, 12), [M.logBark, M.logEnd, M.logEnd]);
    l.position.set(Math.cos(a) * 0.19, 0.11, Math.sin(a) * 0.19);
    l.lookAt(0, 0.4, 0);
    l.rotateX(Math.PI / 2);
    g.add(l);
  }
  // Glowing coal bed
  for (let i = 0; i < 30; i++) {
    const a = T.rand() * Math.PI * 2, d = T.rand() * 0.23;
    const coal = new THREE.Mesh(new THREE.DodecahedronGeometry(0.018 + T.rand() * 0.02, 0), i % 2 ? M.ember : M.ember2);
    coal.position.set(Math.cos(a) * d, 0.03, Math.sin(a) * d);
    coal.rotation.set(T.rand() * 3, T.rand() * 3, 0);
    g.add(coal);
  }
  onTick(g, (t) => {
    M.ember.emissiveIntensity = 1.4 + Math.sin(t * 2.3) * 0.35 + Math.sin(t * 5.1) * 0.15;
    M.ember2.emissiveIntensity = 1.1 + Math.sin(t * 1.7 + 1) * 0.3;
  });

  // Flames: a low, wide fire of layered tongues, outer red to white core, each flickering on its own rhythm
  const flames = group('flames');
  const layers = [
    { color: '#ff4510', op: 0.45, R: 0.21, H: 0.6, n: 7, spread: 0.12 },
    { color: '#ff8622', op: 0.55, R: 0.17, H: 0.48, n: 6, spread: 0.1 },
    { color: '#ffc04a', op: 0.65, R: 0.115, H: 0.35, n: 4, spread: 0.07 },
    { color: '#fff1c4', op: 0.85, R: 0.07, H: 0.21, n: 2, spread: 0.03 },
  ];
  for (const L of layers) {
    const m = glow(L.color, L.op);
    for (let i = 0; i < L.n; i++) {
      const f = new THREE.Mesh(flameGeo, m);
      const a = T.rand() * Math.PI * 2, d = T.rand() * L.spread;
      const x0 = Math.cos(a) * d, z0 = Math.sin(a) * d, ph = T.rand() * 10, hk = 0.8 + T.rand() * 0.4, sp = 5 + T.rand() * 4;
      f.position.set(x0, 0.05, z0);
      flames.add(f);
      onTick(f, (t) => {
        const s = Math.sin(t * sp + ph) * 0.18 + Math.sin(t * 13.7 + ph * 2) * 0.08;
        f.scale.set(L.R * (1 - s * 0.4), L.H * hk * (1 + s), L.R * (1 - s * 0.4));
        f.rotation.z = Math.sin(t * 3.1 + ph) * 0.09;
        f.rotation.x = Math.sin(t * 2.6 + ph) * 0.07;
        f.position.x = x0 + Math.sin(t * 4 + ph) * 0.01;
      });
    }
  }
  g.add(flames);

  // Sparks drifting up and fading
  const N = 40;
  const sparkPos = new Float32Array(N * 3), sparkCol = new Float32Array(N * 3);
  const sparks = Array.from({ length: N }, () => ({ x: (T.rand() - 0.5) * 0.26, z: (T.rand() - 0.5) * 0.24, speed: 0.25 + T.rand() * 0.35, off: T.rand(), ph: T.rand() * 6 }));
  const sparkGeo = new THREE.BufferGeometry();
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
  sparkGeo.setAttribute('color', new THREE.BufferAttribute(sparkCol, 3));
  const sparkPts = new THREE.Points(
    sparkGeo,
    new THREE.PointsMaterial({ size: 0.022, map: T.soft(), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  sparkPts.frustumCulled = false;
  onTick(sparkPts, (t) => {
    sparks.forEach((s, i) => {
      const l = (t * s.speed + s.off) % 1;
      sparkPos[i * 3] = s.x + Math.sin(t * 2 + s.ph) * 0.06 * l + l * 0.12;
      sparkPos[i * 3 + 1] = 0.18 + l * 1.4;
      sparkPos[i * 3 + 2] = s.z + Math.cos(t * 1.7 + s.ph) * 0.06 * l;
      const b = (1 - l) * (1 - l);
      sparkCol[i * 3] = b;
      sparkCol[i * 3 + 1] = b * 0.6;
      sparkCol[i * 3 + 2] = b * 0.25;
    });
    sparkGeo.attributes.position.needsUpdate = true;
    sparkGeo.attributes.color.needsUpdate = true;
  });
  g.add(sparkPts);

  // Smoke: soft puffs rising, growing and fading, drifting a little with the breeze
  const smoke = group('smoke');
  for (let i = 0; i < 9; i++) {
    const mat = new THREE.SpriteMaterial({ map: T.puff(), color: '#77726d', transparent: true, depthWrite: false, opacity: 0 });
    const s = new THREE.Sprite(mat);
    smoke.add(s);
    onTick(s, (t) => {
      const l = (t / 8 + i / 9) % 1;
      s.position.set(Math.sin(l * 3 + i) * 0.08 + l * 0.35, 0.5 + l * 2.1, -0.05);
      s.scale.setScalar(0.3 + l * 1.1);
      mat.opacity = 0.5 * Math.sin(Math.PI * l);
      mat.rotation = i + t * 0.1 * (i % 2 ? 1 : -1);
    });
  }
  g.add(smoke);
  return g;
}

// ---------------------------------------------------------------- kiosk

/** Slim one-piece totem, ~1.5 m tall, no pole: white front shell, grey back, metal plinth. */
export function kiosk() {
  const g = group('kiosk');
  const W = 0.5, H = 1.38, D = 0.14, B = 0.06, F = D / 2;
  g.add(rbox(W + 0.08, 0.045, D + 0.12, 0.02, M.aluDark)); // plinth
  g.add(at(rbox(W + 0.03, 0.015, D + 0.07, 0.006, M.alu), 0, 0.045, 0)); // plinth trim
  g.add(at(rbox(W, H, D, 0.05, M.shell), 0, B, 0)); // body
  g.add(at(rbox(W - 0.06, H - 0.12, 0.012, 0.01, M.shellBack), 0, B + 0.06, -F)); // back panel

  const front = (o: THREE.Object3D, x: number, y: number, z = 0) => g.add(at(o, x, B + y, F + z));
  front(rboxC(W - 0.1, 0.012, 0.004, 0.004, M.green), 0, H - 0.05); // green strip
  const cam = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.004, 16), M.bezel);
  cam.rotation.x = Math.PI / 2;
  front(cam, 0, H - 0.085);
  front(rboxC(W - 0.05, 0.74, 0.008, 0.022, M.bezel), 0, H - 0.49, 0.002); // screen bezel
  front(rboxC(W - 0.085, 0.69, 0.004, 0.012, M.glass), 0, H - 0.49, 0.006); // screen glass (blank)

  // Payment module: tap pad, QR window, status lights
  front(rboxC(W - 0.1, 0.2, 0.01, 0.02, M.plastic), 0, 0.5, 0.002);
  front(rboxC(0.13, 0.1, 0.006, 0.016, M.aluDark), -0.085, 0.49, 0.008);
  front(rboxC(0.12, 0.1, 0.006, 0.012, M.qr), 0.09, 0.49, 0.008);
  for (let i = 0; i < 4; i++) front(rboxC(0.014, 0.004, 0.002, 0.001, M.led), -0.12 + i * 0.022, 0.575, 0.008);

  // Ticket slot with a metal trim, speaker grille, wordmark
  front(rboxC(W - 0.16, 0.034, 0.006, 0.008, M.alu), 0, 0.32, 0.001);
  front(rboxC(W - 0.2, 0.01, 0.006, 0.003, M.bezel), 0, 0.32, 0.004);
  front(decal(0.26, 0.05, M.grille), 0, 0.21, 0.001);
  front(decal(0.16, 0.03, M.label), 0, 0.11, 0.001);
  return g;
}

// ---------------------------------------------------------------- table + devices

function laptop() {
  const g = group('laptop');
  const W = 0.32, D = 0.22;
  g.add(rbox(W, 0.012, D, 0.006, M.alu));

  const cols = 14, rows = 5, pitch = 0.0192;
  const keys = new THREE.InstancedMesh(new RoundedBoxGeometry(0.0165, 0.004, 0.0155, 2, 0.002), M.key, cols * rows);
  const m4 = new THREE.Matrix4();
  let n = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) keys.setMatrixAt(n++, m4.makeTranslation(-W / 2 + 0.035 + c * pitch, 0.0135, -D / 2 + 0.03 + r * pitch));
  }
  g.add(keys);
  g.add(at(rboxC(0.1, 0.004, 0.0155, 0.002, M.key), 0, 0.0135, -D / 2 + 0.03 + rows * pitch)); // space bar
  g.add(at(rboxC(0.11, 0.002, 0.062, 0.006, M.aluDark), 0, 0.0125, 0.07)); // trackpad

  // Lid hinged at the back edge, opened ~105 degrees; screen layers sit on its underside
  const lid = group('lid', at(rbox(W, 0.006, D, 0.005, M.alu), 0, 0, D / 2));
  lid.add(at(rboxC(W - 0.006, 0.002, D - 0.006, 0.004, M.bezel), 0, -0.001, D / 2));
  lid.add(at(rboxC(W - 0.01, 0.002, D - 0.016, 0.003, M.glass), 0, -0.0022, D / 2 + 0.002));
  lid.position.set(0, 0.013, -D / 2);
  lid.rotation.x = -1.85;
  g.add(lid);
  const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, W - 0.08, 12), M.aluDark);
  hinge.rotation.z = Math.PI / 2;
  hinge.position.set(0, 0.012, -D / 2 + 0.004);
  g.add(hinge);
  return g;
}

/** Tablet on a round-based swivel stand. */
function tablet() {
  const g = group('tablet');
  g.add(cyl(0.06, 0.062, 0.008, M.alu, 40));
  // Neck: from the base up to the back of the puck, so it stops behind the tablet instead of poking through it
  const top = new THREE.Vector3(0, 0.13, -0.03).addScaledVector(new THREE.Vector3(0, Math.sin(0.38), Math.cos(0.38)), -0.011);
  const bottom = new THREE.Vector3(0, 0.008, 0), dir = top.clone().sub(bottom);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.011, dir.length(), 16), M.alu);
  neck.position.copy(bottom).addScaledVector(dir, 0.5);
  neck.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  g.add(neck);
  const slab = group('slab', rboxC(0.25, 0.175, 0.008, 0.012, M.plastic));
  slab.add(at(rboxC(0.244, 0.169, 0.002, 0.01, M.bezel), 0, 0, 0.0035));
  slab.add(at(rboxC(0.24, 0.165, 0.002, 0.008, M.glass), 0, 0, 0.005));
  const puck = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.008, 24), M.aluDark);
  puck.rotation.x = Math.PI / 2;
  puck.position.z = -0.007;
  slab.add(puck);
  slab.position.set(0, 0.13, -0.03);
  slab.rotation.x = -0.38;
  g.add(slab);
  return g;
}

/** Phone standing on a small metal stand. */
function phone() {
  const g = group('phone');
  g.add(rbox(0.075, 0.01, 0.075, 0.005, M.alu));
  g.add(at(rbox(0.075, 0.012, 0.008, 0.003, M.alu), 0, 0.01, 0.025)); // front lip
  const set = group('handset', rboxC(0.072, 0.15, 0.008, 0.009, M.plastic));
  set.add(at(rboxC(0.068, 0.146, 0.002, 0.008, M.glass), 0, 0, 0.0045));
  set.add(at(rboxC(0.024, 0.032, 0.004, 0.006, M.aluDark), -0.017, 0.05, -0.005)); // camera bump
  set.add(at(rboxC(0.05, 0.09, 0.006, 0.003, M.alu), 0, -0.02, -0.009)); // stand back plate
  set.position.set(0, 0.088, 0.012);
  set.rotation.x = -0.28;
  g.add(set);
  return g;
}

/** Business card standing in a walnut block. */
function cardStand() {
  const g = group('card');
  g.add(rbox(0.1, 0.024, 0.034, 0.006, M.walnut));
  g.add(at(rboxC(0.09, 0.002, 0.004, 0.0008, M.bezel), 0, 0.024, 0));
  const back = M.cardBack;
  const card = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.054, 0.0012), [back, back, back, back, M.cardFace, back]);
  card.position.set(0, 0.045, 0.001);
  card.rotation.x = -0.1;
  g.add(card);
  return g;
}

/** Upright panel of n boards side by side along x, facing +z, with hairline gaps between them. */
function boards(w: number, h: number, t: number, n: number) {
  const g = group('boards');
  const bw = w / n;
  for (let i = 0; i < n; i++) g.add(at(rbox(bw - 0.003, h, t, 0.006, M.boardsV[i % M.boardsV.length]), -w / 2 + bw * (i + 0.5), 0, 0));
  return g;
}

/** Board drawer front with a black iron cup pull, facing +z. */
function drawer(w: number, h: number, i: number) {
  const g = group('drawer', rboxC(w, h, 0.015, 0.006, M.boardsH[i % M.boardsH.length]));
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.075, 16, 1, true, 0, Math.PI), M.iron);
  cup.rotation.z = Math.PI / 2;
  cup.position.set(0, h / 2 - 0.045, 0.0075);
  g.add(cup);
  g.add(at(rboxC(0.09, 0.026, 0.003, 0.004, M.iron), 0, h / 2 - 0.04, 0.009)); // backplate
  return g;
}

/** Scale an object up uniformly (the desk things are drawn at real size, then enlarged to read from the camera). */
const big = <O extends THREE.Object3D>(o: O, s: number) => (o.scale.setScalar(s), o);

/** Rustic outdoor-lab desk: a plank top with softly rounded corners (no sharp corners pointing at anyone, per feng shui),
 *  board sides and back, and one stack of drawers on the left; the right side is open for your knees.
 *  On top, evenly spaced left to right and alternating back and front: laptop, business card, tablet, phone. */
export function desk() {
  const g = group('desk');
  const top = 0.55, LW = 0.9, LD = 0.64, TT = 0.028, PT = 0.015, toe = 0.05; // thin boards, so it reads light, not bulky
  const body = top - TT, CW = LW - 0.05, CD = LD - 0.07, zB = -0.015, zF = zB + CD / 2; // carcass sits inside the top's overhang

  // Top: one slab with rounded corners and eased edges, scored into four planks
  const r = 0.07, w2 = LW / 2, d2 = LD / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-w2 + r, -d2);
  shape.lineTo(w2 - r, -d2);
  shape.quadraticCurveTo(w2, -d2, w2, -d2 + r);
  shape.lineTo(w2, d2 - r);
  shape.quadraticCurveTo(w2, d2, w2 - r, d2);
  shape.lineTo(-w2 + r, d2);
  shape.quadraticCurveTo(-w2, d2, -w2, d2 - r);
  shape.lineTo(-w2, -d2 + r);
  shape.quadraticCurveTo(-w2, -d2, -w2 + r, -d2);
  const bev = 0.005;
  const topGeo = new THREE.ExtrudeGeometry(shape, { depth: TT - 2 * bev, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 3, curveSegments: 10 });
  topGeo.rotateX(-Math.PI / 2);
  const slab = new THREE.Mesh(topGeo, M.plank);
  slab.position.y = body + bev;
  g.add(slab);
  for (const z of [-LD / 4, 0, LD / 4]) g.add(at(rboxC(LW - 0.004, 0.002, 0.004, 0.001, M.seam), 0, top + 0.0005, z));

  // Board sides and back
  for (const s of [-1, 1]) {
    const side = at(boards(CD, body, PT, 4), s * (CW / 2 - PT / 2), 0, zB);
    side.rotation.y = Math.PI / 2;
    g.add(side);
  }
  g.add(at(boards(CW - 2 * PT, body, PT * 0.7, 6), 0, 0, zB - CD / 2 + PT * 0.35));

  // Left drawer stack: divider, three drawers, a recessed kick board
  const PW = 0.3, open = PW - 1.5 * PT, H = body - toe, gap = 0.007, dh = (H - 4 * gap) / 3;
  const divider = at(boards(CD, body, PT, 4), -(CW / 2 - PW), 0, zB);
  divider.rotation.y = Math.PI / 2;
  g.add(divider);
  const cx = -(CW / 2 - PW / 2 - PT / 4);
  g.add(at(rbox(open, H, CD - 0.03, 0.002, M.deskInner), cx, toe, zB - 0.01)); // drawer boxes, seen through the gaps
  g.add(at(rbox(open, toe, 0.015, 0.002, M.deskInner), cx, 0, zF - 0.03));
  for (let i = 0; i < 3; i++) g.add(at(drawer(open - gap, dh, i), cx, toe + gap + dh / 2 + i * (dh + gap), zF + 0.003));
  // Front rail under the top over the open side, and a low stretcher between the sides at the back
  const kx0 = -(CW / 2 - PW) + PT / 2, kx1 = CW / 2 - PT, KW = kx1 - kx0;
  g.add(at(rbox(KW, 0.06, 0.015, 0.005, M.boardsH[1]), (kx0 + kx1) / 2, body - 0.06, zF - 0.008));
  g.add(at(rbox(KW, 0.05, 0.015, 0.005, M.boardsH[0]), (kx0 + kx1) / 2, 0.06, zB - CD / 2 + 0.05));

  const S = 1.25;
  g.add(at(big(laptop(), S), -0.225, top, -0.1));
  const c = at(big(cardStand(), 1.6), -0.02, top, 0.2);
  c.rotation.y = 0.08;
  g.add(c);
  const t = at(big(tablet(), S), 0.19, top, -0.12);
  t.rotation.y = -0.15;
  g.add(t);
  const p = at(big(phone(), S), 0.37, top, 0.17);
  p.rotation.y = -0.25;
  g.add(p);
  return g;
}

// ---------------------------------------------------------------- log table + desk things

/** Receipt printer: a plain black box with a clamshell lid seam on top, a front panel with the feed button and
 *  status light, and a receipt coming out of the slot at the front of the lid. */
function printer() {
  const g = group('printer');
  const W = 0.12, D = 0.15, h1 = 0.095;
  g.add(rbox(W, h1, D, 0.005, M.printer));
  g.add(at(rboxC(W + 0.001, 0.0025, 0.0025, 0.001, M.seam), 0, h1 - 0.024, -D / 2 + 0.0008)); // lid seam: back...
  for (const sx of [-1, 1]) g.add(at(rboxC(0.0025, 0.0025, D * 0.62, 0.001, M.seam), sx * (W / 2 - 0.0008), h1 - 0.024, -D * 0.19)); // ...and sides
  const slotZ = D / 2 - D * 0.24;
  g.add(at(rboxC(W - 0.02, 0.003, 0.006, 0.001, M.seam), 0, h1, slotZ)); // paper exit across the top
  g.add(at(rboxC(W - 0.024, 0.036, 0.003, 0.002, M.printerLid), 0, h1 * 0.42, D / 2)); // front panel
  g.add(at(rboxC(0.018, 0.008, 0.004, 0.0015, M.plastic), W / 2 - 0.03, h1 * 0.42, D / 2 + 0.002)); // feed button
  g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.0028, 10, 8), M.led), -W / 2 + 0.025, h1 * 0.42, D / 2 + 0.002));

  // Receipt: rises from the slot, then curls forward
  const len = 0.16, wid = 0.058, rise = 0.065, r = 0.036;
  const geo = new THREE.PlaneGeometry(wid, len, 1, 32);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const s = p.getY(i) + len / 2;
    let y = s, z = 0;
    if (s > rise) {
      const a = (s - rise) / r;
      y = rise + r * Math.sin(a);
      z = r * (1 - Math.cos(a));
    }
    p.setXYZ(i, p.getX(i), y, z);
  }
  geo.computeVertexNormals();
  const receipt = new THREE.Mesh(geo, M.paper);
  receipt.name = 'receipt';
  receipt.position.set(0, h1, slotZ);
  g.add(receipt);
  return g;
}

/** Dark hardcover notebook with an elastic band and a pen on top. */
function diary() {
  const g = group('diary');
  const W = 0.15, D = 0.21;
  g.add(rbox(W, 0.004, D, 0.002, M.diary));
  g.add(at(rbox(W - 0.01, 0.02, D - 0.01, 0.002, M.pages), 0.003, 0.004, 0));
  g.add(at(rbox(W, 0.004, D, 0.002, M.diary), 0, 0.024, 0));
  g.add(at(rboxC(0.008, 0.028, D, 0.003, M.diary), -W / 2 + 0.003, 0.014, 0)); // spine
  g.add(at(rbox(0.007, 0.0285, D + 0.002, 0.001, M.band), W / 2 - 0.025, 0, 0)); // elastic
  const pen = group('pen');
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 0.12, 16), M.pen);
  body.rotation.z = Math.PI / 2;
  pen.add(body);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.0045, 0.014, 16), M.pen);
  tip.rotation.z = -Math.PI / 2;
  tip.position.x = 0.067;
  pen.add(tip);
  pen.add(at(rboxC(0.04, 0.002, 0.003, 0.001, M.aluDark), -0.035, 0.005, 0)); // clip
  pen.position.set(0, 0.033, 0.01);
  pen.rotation.y = 0.65;
  g.add(pen);
  return g;
}

/** Glazed mug of coffee with rising steam. */
function mug() {
  const g = group('mug');
  g.add(lathe([[0, 0], [0.034, 0], [0.038, 0.004], [0.04, 0.012], [0.041, 0.092], [0.0395, 0.096], [0.036, 0.094], [0.035, 0.012], [0, 0.012]], M.ceramic));
  g.add(at(cyl(0.0355, 0.0355, 0.002, M.coffee, 32), 0, 0.074, 0));
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.0065, 12, 28, Math.PI * 1.25), M.ceramic);
  handle.rotation.z = -Math.PI * 0.625;
  handle.position.set(0.04, 0.05, 0);
  g.add(handle);
  for (let i = 0; i < 3; i++) {
    const mat = new THREE.SpriteMaterial({ map: T.soft(), color: '#ffffff', transparent: true, depthWrite: false, opacity: 0 });
    const s = new THREE.Sprite(mat);
    g.add(s);
    onTick(s, (t) => {
      const l = (t * 0.22 + i / 3) % 1;
      s.position.set(Math.sin(t * 1.3 + i * 2) * 0.012, 0.1 + l * 0.2, 0);
      s.scale.setScalar(0.03 + l * 0.08);
      mat.opacity = 0.16 * Math.sin(Math.PI * l);
    });
  }
  return g;
}

/** Log table: a thick sawn slab resting on a short trunk, both a little out of round, with furrowed bark, a couple of
 *  knots, and buttress roots: ridges of the trunk itself that spread out and slope down to meet the ground. Holds the printer, diary and mug in a row. */
export function stump() {
  const g = group('stump');
  T.reseed(31);
  const h = 0.48, slabT = 0.08, R = 0.34, sb = h - slabT, radial = 96;
  const roots = Array.from({ length: 5 }, (_, i) => [(i / 5) * Math.PI * 2 + 0.4 + (T.rand() - 0.5) * 0.5, 0.09 + T.rand() * 0.06]);
  const angGap = (a: number, b: number) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
  const wobble = (a: number, k: number) => 1 + Math.sin(a * 3 + k) * 0.03 + Math.sin(a * 5 + 2 * k) * 0.018 + Math.sin(a * 11 + k) * 0.008;
  const furrow = (a: number, y: number) => Math.pow(0.5 + 0.5 * Math.sin(a * 26 + Math.sin(y * 9 + a * 2) * 1.3), 3) * 0.006;
  /** Bark wall between two heights, its radius given for each angle and height. */
  const wall = (y0: number, y1: number, rows: number, radius: (a: number, y: number) => number) => {
    const geo = new THREE.CylinderGeometry(1, 1, y1 - y0, radial, rows, true).translate(0, (y0 + y1) / 2, 0);
    const p = geo.attributes.position, uv = geo.attributes.uv;
    for (let k = 0; k < p.count; k++) {
      const a = Math.atan2(p.getZ(k), p.getX(k)), y = p.getY(k), r = radius(a, y);
      p.setXYZ(k, Math.cos(a) * r, y, Math.sin(a) * r);
      uv.setY(k, y * 2); // same bark scale on the slab and the trunk, however tall each wall is
    }
    geo.computeVertexNormals();
    return new THREE.Mesh(geo, M.bark);
  };
  /** Flat sawn face at height y, cut to an outline, facing up or down. */
  const face = (y: number, radius: (a: number) => number, m: THREE.Material, up: boolean) => {
    const geo = new THREE.CircleGeometry(1, radial);
    const p = geo.attributes.position, uv = geo.attributes.uv;
    for (let k = 1; k < p.count; k++) {
      // Turning the disc face-up maps its angle a to -a in the world (face-down keeps it), so look the outline up there
      const a = Math.atan2(p.getY(k), p.getX(k)), r = radius(up ? -a : a);
      p.setXY(k, Math.cos(a) * r, Math.sin(a) * r);
      uv.setXY(k, 0.5 + Math.cos(a) * 0.495, 0.5 + Math.sin(a) * 0.495);
    }
    geo.rotateX(up ? -Math.PI / 2 : Math.PI / 2);
    return at(new THREE.Mesh(geo, m), 0, y, 0);
  };

  // Slab: its bark edge narrows a little toward the bottom, like the old round
  const slabR = (a: number) => R * wobble(a, 0);
  g.add(wall(sb, h, 6, (a, y) => slabR(a) * (1 - 0.035 * (1 - (y - sb) / slabT)) - furrow(a, y)));
  g.add(face(h, (a) => slabR(a) - 0.0015, M.slabTop, true));
  g.add(face(sb, (a) => slabR(a) * 0.965 - 0.003, M.bark, false));

  // Trunk: waisted in the middle, widening at the foot. Each root is a ridge of the trunk that starts ~20 cm up and
  // reaches further out, and spreads wider, the lower it gets, so its top slopes smoothly down to the ground.
  const trunkR = (a: number, y: number) => {
    const u = Math.max(0, 1 - y / 0.2);
    const reach = roots.reduce((s, [ra, L]) => s + L * u * u * Math.exp(-(angGap(a, ra) ** 2) / (0.015 + 0.05 * u)), 0);
    const base = 0.15 + 0.06 * Math.exp(-y / 0.07) + 0.012 * Math.max(0, (y - 0.3) / (sb - 0.3));
    return base * wobble(a, 1.7) + reach - furrow(a, y);
  };
  g.add(wall(0, sb + 0.01, 48, trunkR));
  // Knots: old branch stubs, half sunk into the bark
  for (const [a, y, kr] of [[-0.9, 0.27, 0.024], [2.3, 0.23, 0.02]]) {
    const rr = trunkR(a, y) - 0.004;
    const knot = new THREE.Mesh(new THREE.SphereGeometry(kr, 16, 10), M.logBark);
    knot.position.set(Math.cos(a) * rr, y, Math.sin(a) * rr);
    knot.scale.set(1, 1.35, 1);
    g.add(knot);
    const scar = new THREE.Mesh(new THREE.CircleGeometry(kr * 0.55, 16), M.logEnd);
    scar.position.set(Math.cos(a) * (rr + kr * 0.98), y, Math.sin(a) * (rr + kr * 0.98));
    scar.lookAt(Math.cos(a) * 2, y, Math.sin(a) * 2);
    g.add(scar);
  }
  const S = 1.2;
  const pr = at(big(printer(), S), -0.2, h, -0.02);
  pr.rotation.y = 0.08;
  g.add(pr);
  const d = at(big(diary(), S), 0.025, h, 0);
  d.rotation.y = -0.06;
  g.add(d);
  const m = at(big(mug(), S), 0.215, h, -0.01);
  m.rotation.y = -0.8; // handle toward the camera, away from the diary
  g.add(m);
  return g;
}

// ---------------------------------------------------------------- plants

function pot(rTop: number, rBot: number, h: number, m: THREE.Material) {
  const lip = 0.012;
  const g = group('pot', lathe([[0, 0.002], [rBot - 0.006, 0], [rBot, 0.006], [rTop - 0.004, h - 0.03], [rTop + lip, h - 0.028], [rTop + lip, h], [rTop - 0.006, h], [rTop - 0.01, h - 0.03], [0, h - 0.03]], m, 48));
  g.add(at(cyl(rTop - 0.008, rTop - 0.008, 0.004, M.soil, 32), 0, h - 0.032, 0));
  for (let i = 0; i < 7; i++) {
    const a = T.rand() * Math.PI * 2, d = T.rand() * (rTop - 0.03);
    g.add(at(new THREE.Mesh(new THREE.DodecahedronGeometry(0.006 + T.rand() * 0.006, 0), M.pebble), Math.cos(a) * d, h - 0.026, Math.sin(a) * d));
  }
  return g;
}

function wateringCan() {
  const g = group('wateringCan');
  g.add(lathe([[0, 0], [0.058, 0], [0.062, 0.006], [0.064, 0.1], [0.058, 0.118], [0.035, 0.128], [0.034, 0.136], [0.03, 0.136], [0.03, 0.128], [0, 0.128]], M.can));
  g.add(tube([[0.05, 0.03, 0], [0.095, 0.075, 0], [0.125, 0.115, 0]], 0.008, M.can));
  const rose = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.009, 0.022, 16), M.can);
  rose.position.set(0.131, 0.123, 0);
  rose.rotation.z = -0.75;
  g.add(rose);
  g.add(tube([[-0.05, 0.1, 0], [-0.065, 0.16, 0], [-0.01, 0.19, 0], [0.035, 0.14, 0]], 0.007, M.can));
  return g;
}

const jadeLeafGeo = new THREE.SphereGeometry(1, 16, 10);

/** Jade plant ("money plant" in feng shui): a rounded mound of plump, glossy, coin-shaped leaves in crossing pairs,
 *  sitting straight on a white pot (no stem showing), with a watering can. */
export function smallPlant() {
  const g = group('smallPlant');
  T.reseed(23);
  const h = 0.15;
  const plant = group('plant', pot(0.1, 0.075, h, M.whitePot));
  const leaves = group('leaves');
  const base = h - 0.03;
  // No visible stem: leaf clusters spread evenly over a low dome (a golden-angle spiral) that sits right on the pot,
  // its lowest ring spilling just over the rim, so the plant reads as one soft round mound
  const tips: [number, number, number][] = Array.from({ length: 19 }, (_, i) => {
    const az = i * 2.4, tilt = 0.1 + (i / 18) * 1.4;
    return [Math.sin(tilt) * Math.cos(az) * 0.105, base + 0.012 + Math.cos(tilt) * 0.085, Math.sin(tilt) * Math.sin(az) * 0.105];
  });
  const v = new THREE.Vector3();
  tips.forEach((tip, b) => {
    const [x, , z] = tip;
    const mid: [number, number, number] = [x * 0.6, base, z * 0.6]; // the cluster leans in toward the soil at the centre
    // Three crossing pairs of leaves down from the tip: the youngest small and pale, the older ones plump and spreading
    const out = Math.atan2(x, z);
    for (let k = 0; k < 3; k++) {
      v.set(...tip).lerp(new THREE.Vector3(...mid), k * 0.28);
      const size = [0.75, 1.15, 1.4][k] * (0.9 + T.rand() * 0.2);
      for (const side of [-1, 1]) {
        const leaf = new THREE.Mesh(jadeLeafGeo, k === 0 ? M.jadeYoung : M.jade);
        leaf.scale.set(0.017 * size, 0.0075 * size, 0.024 * size);
        leaf.position.z = 0.022 * size;
        const pivot = group('leaf', leaf);
        pivot.position.copy(v);
        pivot.rotation.order = 'YXZ';
        pivot.rotation.y = out + (k % 2 ? Math.PI / 2 : 0) + (side > 0 ? 0 : Math.PI) + (T.rand() - 0.5) * 0.3;
        pivot.rotation.x = -(0.95 - k * 0.3) + (T.rand() - 0.5) * 0.2;
        pivot.rotation.z = (T.rand() - 0.5) * 0.4;
        leaves.add(pivot);
      }
    }
    if (b % 3 === 0) leaves.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.008, 10, 8), M.jadeYoung), ...tip)); // bud
  });
  onTick(leaves, (t) => {
    leaves.rotation.z = Math.sin(t * 0.9) * 0.02;
    leaves.rotation.x = Math.sin(t * 0.7 + 1) * 0.015;
  });
  plant.add(leaves);
  g.add(plant);
  const can = at(big(wateringCan(), 0.72), 0.19, 0, 0.06);
  can.rotation.y = 2.5;
  g.add(can);
  return g;
}

/** Mountain pine foliage pad centred at (x, y, z): a dark core under a dome of needle tufts (written into the shared
 *  instanced `needles` from index `from`), with pale new-growth candles on top. */
function needlePad(x: number, y: number, z: number, rx: number, ry: number, rz: number, needles: THREE.InstancedMesh, from: number, count: number) {
  const g = group('pad');
  g.position.set(x, y, z);
  const core = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 10), M.padCore);
  core.scale.set(rx * 0.9, ry * 0.85, rz * 0.9);
  g.add(core);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3(), d = new THREE.Vector3(), c = new THREE.Color();
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < count; i++) {
    // Mostly over the top and sides of the pad, needles pointing out and up
    const a = T.rand() * Math.PI * 2, ny = Math.min(1, -0.35 + T.rand() * 1.35), rr = Math.sqrt(1 - ny * ny);
    const nx = Math.cos(a) * rr, nz = Math.sin(a) * rr;
    d.set(nx + (T.rand() - 0.5) * 0.6, ny + 0.7, nz + (T.rand() - 0.5) * 0.6).normalize();
    q.setFromUnitVectors(up, d);
    p.set(x + nx * rx * 0.88, y + ny * ry * 0.85, z + nz * rz * 0.88);
    s.setScalar(0.75 + T.rand() * 0.5);
    needles.setMatrixAt(from + i, m4.compose(p, q, s));
    needles.setColorAt(from + i, c.setHSL(0.27 + T.rand() * 0.05, 0.38 + T.rand() * 0.15, 0.17 + T.rand() * 0.12));
  }
  for (let i = 0; i < 5; i++) {
    const a = T.rand() * Math.PI * 2, rr = 0.3 + T.rand() * 0.55;
    const cd = new THREE.Mesh(new THREE.CylinderGeometry(0.0025, 0.004, 0.026, 6), M.candle);
    cd.position.set(Math.cos(a) * rr * rx, ry * 0.8 + 0.01, Math.sin(a) * rr * rz);
    cd.rotation.set((T.rand() - 0.5) * 0.4, 0, (T.rand() - 0.5) * 0.4);
    g.add(cd);
  }
  return g;
}

/** Mountain pine bonsai: an informal-upright trunk with layered foliage pads, in a shallow clay pot on a walnut stand. */
export function bonsai() {
  const g = group('bonsai');
  T.reseed(29);
  // Stand
  const SH = 0.34, SW = 0.56, SD = 0.4;
  g.add(at(rbox(SW, 0.035, SD, 0.008, M.walnut), 0, SH - 0.035, 0));
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(at(rbox(0.04, SH - 0.035, 0.04, 0.006, M.walnut), x * (SW / 2 - 0.04), 0, z * (SD / 2 - 0.04)));
  for (const s of [-1, 1]) {
    g.add(at(rbox(SW - 0.1, 0.04, 0.02, 0.004, M.walnut), 0, SH - 0.075, s * (SD / 2 - 0.04)));
    g.add(at(rbox(0.02, 0.04, SD - 0.1, 0.004, M.walnut), s * (SW / 2 - 0.04), SH - 0.075, 0));
  }
  // Shallow rectangular clay pot on little feet, its rim standing proud of the soil
  const PW = 0.46, PD = 0.31, feet = 0.014, bodyH = 0.075, rimH = 0.018;
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(at(rbox(0.05, feet, 0.04, 0.005, M.bonsaiPot), x * (PW / 2 - 0.05), SH, z * (PD / 2 - 0.04)));
  const pb = SH + feet;
  g.add(at(rbox(PW, bodyH, PD, 0.014, M.bonsaiPot), 0, pb, 0));
  for (const s of [-1, 1]) {
    g.add(at(rbox(PW + 0.01, rimH, 0.02, 0.005, M.bonsaiPot), 0, pb + bodyH - 0.004, s * (PD / 2 - 0.005)));
    g.add(at(rbox(0.02, rimH, PD + 0.01, 0.005, M.bonsaiPot), s * (PW / 2 - 0.005), pb + bodyH - 0.004, 0));
  }
  const soilY = pb + bodyH + 0.004;
  g.add(at(rbox(PW - 0.03, 0.004, PD - 0.03, 0.002, M.moss), 0, soilY - 0.004, 0));
  for (let i = 0; i < 40; i++) {
    const moss = new THREE.Mesh(new THREE.SphereGeometry(0.012 + T.rand() * 0.018, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2), i % 3 ? M.moss : M.mossLight);
    moss.scale.y = 0.45;
    moss.position.set((T.rand() - 0.5) * (PW - 0.07), soilY - 0.002, (T.rand() - 0.5) * (PD - 0.07));
    g.add(moss);
  }
  for (let i = 0; i < 5; i++) {
    g.add(at(new THREE.Mesh(new THREE.DodecahedronGeometry(0.01 + T.rand() * 0.008, 0), M.pebble), (T.rand() - 0.5) * 0.35, soilY, (T.rand() - 0.5) * 0.22));
  }

  // Tree, rooted in the soil: trunk, spreading surface roots, branches out to the pads
  const tree = group('tree');
  tree.position.y = soilY;
  tree.scale.setScalar(1.15);
  const trunkPts: [number, number, number][] = [[-0.04, -0.01, 0], [-0.01, 0.1, 0.02], [-0.08, 0.22, 0], [-0.03, 0.34, -0.03], [0.05, 0.45, 0], [0.03, 0.56, 0.02], [0, 0.66, 0.02]];
  tree.add(taper(trunkPts, 0.05, 0.012, M.pineBark, 40, 12));
  const trunk = new THREE.CatmullRomCurve3(trunkPts.map((p) => new THREE.Vector3(...p)));
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.3, l = 0.07 + T.rand() * 0.05;
    tree.add(taper([[-0.04, 0.03, 0], [-0.04 + Math.cos(a) * l * 0.5, 0.008, Math.sin(a) * l * 0.5], [-0.04 + Math.cos(a) * l, -0.004, Math.sin(a) * l]], 0.022, 0.005, M.pineBark, 10, 8));
  }
  // [x, y, z, rx, ry, rz, where along the trunk its branch leaves]
  const pads = [
    [-0.23, 0.22, 0.06, 0.12, 0.05, 0.1, 0.24],
    [0.21, 0.32, 0.02, 0.11, 0.05, 0.1, 0.42],
    [-0.03, 0.34, -0.17, 0.11, 0.05, 0.09, 0.46],
    [0.07, 0.42, 0.16, 0.1, 0.045, 0.08, 0.56],
    [-0.17, 0.47, -0.04, 0.1, 0.05, 0.09, 0.64],
    [0.15, 0.55, -0.05, 0.095, 0.045, 0.08, 0.76],
    [0.0, 0.67, 0.02, 0.09, 0.06, 0.08, 1],
  ];
  // Each pad is a full cloud: a deep main lobe with two smaller ones tucked under its sides, all thick with needles
  const lobes = [[0, 0, 0, 1.15, 1.7, 1.15], [-0.55, -0.35, 0.3, 0.7, 1.2, 0.7], [0.5, -0.3, -0.35, 0.7, 1.2, 0.7]];
  const per = 420;
  const needles = new THREE.InstancedMesh(new THREE.ConeGeometry(0.0026, 0.038, 3).translate(0, 0.019, 0), M.needle, pads.length * lobes.length * per);
  const canopy = group('canopy', needles);
  pads.forEach(([x, y, z, rx, ry, rz, tt], i) => {
    if (tt < 1) {
      // Branch: out from the trunk, dipping a little, then rising into the pad
      const s = trunk.getPointAt(tt);
      const mid: [number, number, number] = [s.x + (x - s.x) * 0.55, Math.min(s.y, y) - 0.025, s.z + (z - s.z) * 0.55];
      tree.add(taper([[s.x, s.y, s.z], mid, [x * 0.92, y - ry * 0.4, z * 0.92]], 0.017, 0.005, M.pineBark, 16, 8));
    }
    lobes.forEach(([ox, oy, oz, sx, sy, sz], j) =>
      canopy.add(needlePad(x + ox * rx, y + oy * ry, z + oz * rz, rx * sx, ry * sy, rz * sz, needles, (i * lobes.length + j) * per, per)),
    );
  });
  onTick(canopy, (t) => {
    canopy.rotation.z = Math.sin(t * 0.6) * 0.006;
    canopy.rotation.x = Math.sin(t * 0.45 + 1) * 0.005;
  });
  tree.add(canopy);
  g.add(tree);
  return g;
}
