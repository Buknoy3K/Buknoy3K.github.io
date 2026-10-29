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
  glass: phys('#06080a', { roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 0.35 }),
  bezel: std('#101113', { roughness: 0.35 }),
  plastic: std('#1d1f22', { roughness: 0.5 }),
  qr: phys('#0d2a22', { roughness: 0.05, clearcoat: 1 }),
  alu: std('#c3c7cc', { roughness: 0.3, metalness: 0.85 }),
  aluDark: std('#5d6168', { roughness: 0.35, metalness: 0.8 }),
  key: std('#18191c', { roughness: 0.6 }),
  green: std('#3ecf8e', { roughness: 0.4 }),
  led: new THREE.MeshBasicMaterial({ color: '#4dffa6' }),
  seam: std('#2a1c12', { roughness: 1 }),
  // Pale birch desk on white metal legs
  birch: std('#ffffff', { map: T.wood('#e2cfae', '#c4a67c'), roughness: 0.55 }),
  legs: std('#e6e6e3', { roughness: 0.35, metalness: 0.25 }),
  printer: std('#121315', { roughness: 0.68 }),
  printerLid: std('#1b1c1f', { roughness: 0.35 }),
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
  can: std('#7b9dc4', { roughness: 0.38, metalness: 0.35, side: THREE.DoubleSide }),
  lampShade: std('#e8662c', { roughness: 0.45, side: THREE.DoubleSide }),
  lampGlow: new THREE.MeshBasicMaterial({ color: '#ffd9a8' }),
  notes: ['#f3e27c', '#f4b0c8', '#a5cdf2', '#b3e3a6'].map((c) => std(c, { roughness: 0.9, side: THREE.DoubleSide })),
  walnut: std('#ffffff', { map: T.wood('#6b4630', '#3d2617'), roughness: 0.45 }),
  pineBark: std('#a39486', { map: T.bark(), roughness: 0.95 }),
  needle: std('#ffffff', { roughness: 0.7 }),
  padCore: std('#22371a', { roughness: 0.95 }),
  candle: std('#a7b97a', { roughness: 0.7 }),
  moss: std('#3a5122', { roughness: 1 }),
  mossLight: std('#55702e', { roughness: 1 }),
  logBark: std('#8f8f8f', { map: T.bark(), roughness: 0.95 }),
  logEnd: std('#ffffff', { map: T.endGrain(), roughness: 0.9 }),
  ash: std('#3b3836', { roughness: 1 }),
  gravel: std('#ffffff', { roughness: 0.9 }),
  stones: ['#5d5a55', '#6b675f', '#4f4c48', '#76716a'].map((c) => std(c, { roughness: 0.9 })),
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

// ---------------------------------------------------------------- fire

const flameGeo = new THREE.LatheGeometry(
  Array.from({ length: 17 }, (_, i) => {
    const v = i / 16;
    return new THREE.Vector2(Math.sin(Math.PI * Math.pow(v, 0.55)) * (1 - v * 0.2) + 1e-4, v);
  }),
  20,
);

/** The campfire itself: a low tepee of logs on glowing coals over an ash bed, with flames, sparks and smoke. */
function fire() {
  const g = group('fire');
  T.reseed(11);
  g.add(at(cyl(0.28, 0.32, 0.012, M.ash, 32), 0, 0, 0));

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

// ---------------------------------------------------------------- desk + things on it

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
  const screen = at(rboxC(W - 0.01, 0.002, D - 0.016, 0.003, M.glass), 0, -0.0022, D / 2 + 0.002);
  screen.name = 'laptopScreen'; // the scene pins the live website onto this (it faces the lid's -y)
  lid.add(screen);
  // Sticky notes stuck to the lid's edges, half hanging off
  for (const [x, z, rot, m] of [[-1, 0.78, 0.12, M.notes[0]], [-1, 0.5, -0.1, M.notes[1]], [1, 0.84, -0.08, M.notes[2]], [1, 0.58, 0.14, M.notes[3]]] as const) {
    const note = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.05).rotateX(Math.PI / 2), m);
    note.position.set(x * (W / 2 + 0.014), -0.0034, D * z);
    note.rotation.y = rot;
    lid.add(note);
  }
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
 *  sitting straight on a white pot (no stem showing). */
function jadePlant() {
  const g = group('jadePlant');
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
  return g;
}

/** Mushroom desk lamp: a round foot, a thin stem and a domed shade with a warm glow underneath. */
function lamp() {
  const g = group('lamp');
  g.add(lathe([[0, 0], [0.058, 0], [0.062, 0.006], [0.05, 0.014], [0, 0.016]], M.lampShade));
  g.add(at(cyl(0.006, 0.007, 0.2, M.lampShade, 16), 0, 0.014, 0));
  g.add(at(lathe([[0, 0.075], [0.03, 0.072], [0.06, 0.055], [0.08, 0.025], [0.088, 0], [0.084, -0.002], [0, -0.002]], M.lampShade, 48), 0, 0.2, 0));
  g.add(at(new THREE.Mesh(new THREE.CircleGeometry(0.07, 32).rotateX(Math.PI / 2), M.lampGlow), 0, 0.199, 0));
  const light = new THREE.PointLight('#ffb36b', 0.6, 1.2, 1.5);
  light.position.y = 0.18;
  g.add(light);
  return g;
}

/** Loose sheet of paper with a few handwritten lines. */
function paper() {
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.2).rotateX(-Math.PI / 2), M.paper);
  sheet.position.y = 0.001;
  return group('paper', sheet);
}

const big = <O extends THREE.Object3D>(o: O, s: number) => (o.scale.setScalar(s), o);

/** The desk: a wide pale birch top with softly rounded corners on four slim white metal legs. On top, two tidy rows
 *  on the same five evenly spaced columns, centred on the laptop. Back: printer, tablet, laptop (with sticky notes on
 *  its screen), phone, jade plant with its watering can. Front: a sheet of paper, the business card, the notebook,
 *  the mug and the lamp. */
export function desk() {
  const g = group('desk');
  const top = 0.75, W = 1.6, D = 0.8, TT = 0.035;

  // Top: one slab with rounded corners and eased edges
  const r = 0.04, w2 = W / 2, d2 = D / 2;
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
  const bev = 0.008;
  const topGeo = new THREE.ExtrudeGeometry(shape, { depth: TT - 2 * bev, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 4, curveSegments: 10 });
  topGeo.rotateX(-Math.PI / 2);
  // Extrude maps the shape's own coordinates to uv, so scale them to show the grain at a sensible size
  const uv = topGeo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 1.2 + 0.5, uv.getY(i) / 1.2 + 0.5);
  const slab = new THREE.Mesh(topGeo, M.birch);
  slab.position.y = top - TT + bev;
  g.add(slab);
  // Legs: slim square tubes set in from the corners, with a rail under the top joining them
  const legH = top - TT, inX = w2 - 0.09, inZ = d2 - 0.08;
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(at(rbox(0.04, legH, 0.04, 0.006, M.legs), x * inX, 0, z * inZ));
  for (const s of [-1, 1]) {
    g.add(at(rbox(inX * 2, 0.05, 0.02, 0.004, M.legs), 0, legH - 0.05, s * inZ));
    g.add(at(rbox(0.02, 0.05, inZ * 2, 0.004, M.legs), s * inX, legH - 0.05, 0));
  }

  // Things on the desk: [object, x, z, turn], in two rows on the same five columns
  const S = 1.3, col = [-0.66, -0.37, 0, 0.37, 0.66], back = -0.17, front = 0.22;
  const things: [THREE.Object3D, number, number, number][] = [
    [big(printer(), S), col[0], back, 0.1],
    [big(tablet(), S), col[1], back, 0.15],
    [big(laptop(), S), col[2], back - 0.04, 0],
    [big(phone(), S), col[3], back, -0.15],
    [big(jadePlant(), 1.15), col[4] - 0.03, back - 0.02, 0],
    [big(wateringCan(), 0.7), col[4] + 0.13, back + 0.08, 2.4],
    [paper(), col[0], front, 0.05],
    [big(cardStand(), 1.5), col[1], front, 0],
    [big(diary(), S), col[2], front + 0.01, -0.08],
    [big(mug(), S), col[3], front, -0.9],
    [big(lamp(), 1.1), col[4], front - 0.02, 0],
  ];
  for (const [o, x, z, ry] of things) {
    o.position.set(x, top, z);
    o.rotation.y = ry;
    g.add(o);
  }
  return g;
}

// ---------------------------------------------------------------- plants

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

/** Mountain pine: an informal-upright trunk with spreading surface roots and layered, voluminous foliage pads.
 *  Drawn about 0.75 m tall at size 1. */
function pineTree(size: number) {
  const tree = group('pine');
  T.reseed(29);
  tree.scale.setScalar(size);
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
  const per = Math.round(420 * size); // the needles keep about their real size, so a bigger tree needs more of them
  const nl = 0.05 / size;
  const needles = new THREE.InstancedMesh(new THREE.ConeGeometry(0.0034 / size, nl, 3).translate(0, nl / 2, 0), M.needle, pads.length * lobes.length * per);
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
  return tree;
}

const shrubLeafGeo = new THREE.SphereGeometry(1, 6, 4).scale(0.014, 0.004, 0.009);

/** Round evergreen shrub, like a clipped boxwood: a dark core thick with small leaves. Resting on y = 0. */
function shrub(r: number) {
  const g = group('shrub');
  const cy = r * 0.72;
  const core = new THREE.Mesh(new THREE.SphereGeometry(r * 0.92, 18, 12), M.padCore);
  core.scale.y = 0.8;
  core.position.y = cy;
  g.add(core);
  const n = Math.round((1500 * r * r) / 0.0225);
  const leaves = new THREE.InstancedMesh(shrubLeafGeo, M.needle, n);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3(), d = new THREE.Vector3(), c = new THREE.Color();
  const up = new THREE.Vector3(0, 1, 0), twist = new THREE.Quaternion();
  for (let i = 0; i < n; i++) {
    const a = T.rand() * Math.PI * 2, ny = -0.45 + T.rand() * 1.45, rr = Math.sqrt(Math.max(0, 1 - Math.min(1, ny) ** 2));
    d.set(Math.cos(a) * rr, Math.min(1, ny), Math.sin(a) * rr);
    const k = 0.94 + T.rand() * 0.1;
    p.set(d.x * r * k, cy + d.y * r * 0.8 * k, d.z * r * k);
    q.setFromUnitVectors(up, d.normalize()).multiply(twist.setFromAxisAngle(up, T.rand() * 6.28));
    s.setScalar(0.85 + T.rand() * 0.4);
    leaves.setMatrixAt(i, m4.compose(p, q, s));
    leaves.setColorAt(i, c.setHSL(0.25 + T.rand() * 0.06, 0.4 + T.rand() * 0.15, 0.17 + T.rand() * 0.13));
  }
  g.add(leaves);
  return g;
}

// Rock shapes: a smooth river boulder, a faceted chunk, a flat slab, a long wedge, a round lump with a dent and a
// knobbly egg. Each shape's proportions keep roughly the same volume, so rocks of one size look alike in bulk.
const ROCKS: { geo: (r: number) => THREE.BufferGeometry; s: [number, number, number]; lump: number; f: number }[] = [
  { geo: (r) => new THREE.IcosahedronGeometry(r, 2), s: [1.15, 0.8, 1.05], lump: 0.1, f: 2.2 },
  { geo: (r) => new THREE.DodecahedronGeometry(r, 0), s: [1.1, 0.85, 1.05], lump: 0.12, f: 3 },
  { geo: (r) => new THREE.IcosahedronGeometry(r, 1), s: [1.45, 0.55, 1.2], lump: 0.08, f: 2.5 },
  { geo: (r) => new THREE.OctahedronGeometry(r, 1), s: [1.5, 0.75, 0.85], lump: 0.12, f: 2 },
  { geo: (r) => new THREE.IcosahedronGeometry(r, 1), s: [1, 0.95, 1], lump: 0.22, f: 1.6 },
  { geo: (r) => new THREE.IcosahedronGeometry(r, 2), s: [1.2, 0.95, 0.85], lump: 0.2, f: 4.2 },
];

/** A lumpy rock of about radius r in one of the ROCKS shapes, lying on y = 0 at a random heading. */
function rock(r: number, kind: number, m: THREE.Material) {
  const k = ROCKS[kind % ROCKS.length];
  const geo = k.geo(r);
  // Lumps come from the vertex's direction, so the copies of a shared corner move together (no cracks).
  const sp = geo.attributes.position;
  const ph = T.rand() * 10;
  for (let i = 0; i < sp.count; i++) {
    const x = sp.getX(i) / r, y = sp.getY(i) / r, z = sp.getZ(i) / r;
    const s = 1 + Math.sin(x * k.f + ph) * Math.cos(z * k.f * 0.9 + ph) * k.lump + Math.sin(y * k.f * 1.4 + ph * 2) * k.lump * 0.45;
    sp.setXYZ(i, sp.getX(i) * s, sp.getY(i) * s, sp.getZ(i) * s);
  }
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, m);
  mesh.position.y = r * k.s[1] * 0.7;
  mesh.rotation.set((T.rand() - 0.5) * 0.4, T.rand() * 6, (T.rand() - 0.5) * 0.4);
  mesh.scale.set(...k.s);
  return mesh;
}

/** Fire garden, about 1.7 m across: a gravel bed with the campfire in the middle, ringed by big rocks with moss in
 *  their gaps and round shrubs at the edge, and a mountain pine growing at the back left. */
export function fireGarden() {
  const g = group('fireGarden');
  T.reseed(37);
  const R = 0.7; // rock ring radius

  // Gravel bed on a dark base
  g.add(at(cyl(R - 0.02, R, 0.006, M.ash, 48), 0, 0, 0));
  const pebbles = 1800;
  const gravel = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), M.gravel, pebbles);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3(), e = new THREE.Euler(), c = new THREE.Color();
  for (let i = 0; i < pebbles; i++) {
    const a = T.rand() * Math.PI * 2, d = 0.2 + Math.sqrt(T.rand()) * (R - 0.24), k = 0.007 + T.rand() * 0.011;
    p.set(Math.cos(a) * d, k * 0.45, Math.sin(a) * d);
    q.setFromEuler(e.set(T.rand() * 3, T.rand() * 3, T.rand() * 3));
    s.set(k * (1 + T.rand() * 0.4), k * 0.6, k);
    gravel.setMatrixAt(i, m4.compose(p, q, s));
    gravel.setColorAt(i, c.setHSL(0.08, 0.03 + T.rand() * 0.04, 0.2 + T.rand() * 0.2));
  }
  g.add(gravel);

  // Ring of big rocks, a few stacked on the back ones, so the ring rises behind the fire
  const n = 15;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + T.rand() * 0.12, back = Math.max(0, -Math.sin(a)); // 1 at the back, 0 at the front
    const r = 0.1 + T.rand() * 0.05 + back * 0.05;
    const st = rock(r, i * 5, M.stones[i % M.stones.length]);
    g.add(at(st, Math.cos(a) * R, 0, Math.sin(a) * R * 0.92));
    if (back > 0.5 && i % 2) g.add(at(rock(r * 0.75, i * 3 + 1, M.stones[(i + 1) % M.stones.length]), Math.cos(a) * (R + 0.04), r * 0.9, Math.sin(a) * (R + 0.04) * 0.92));
  }
  // Moss in the gaps between rocks
  for (let i = 0; i < 16; i++) {
    const a = ((i + 0.5) / 16) * Math.PI * 2, rr = R + (T.rand() - 0.4) * 0.12;
    const moss = new THREE.Mesh(new THREE.SphereGeometry(0.05 + T.rand() * 0.04, 14, 7, 0, Math.PI * 2, 0, Math.PI / 2), i % 3 ? M.moss : M.mossLight);
    moss.scale.y = 0.5;
    g.add(at(moss, Math.cos(a) * rr, 0, Math.sin(a) * rr * 0.92));
  }
  // Round shrubs at the edge
  for (const [a, r] of [[-2.2, 0.15], [-0.6, 0.17], [0.35, 0.12], [2.55, 0.13]]) g.add(at(shrub(r), Math.cos(a) * (R + 0.1), 0, Math.sin(a) * (R + 0.1) * 0.92));

  // Mountain pine at the back left, rooted among the rocks
  const tree = at(pineTree(1.9), -0.4, 0, -0.42);
  tree.rotation.y = 0.5;
  g.add(tree);

  const f = fire();
  f.scale.setScalar(0.6); // a small cooking fire, not a bonfire, for the size of the ring
  g.add(f);
  return g;
}
