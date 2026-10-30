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

/** Gives o something to do when it's clicked, lasting secs: o.userData.play() starts it (unless it's already going),
 *  and run(p, t) is called every frame meanwhile with p rising from 0 to 1, ending on exactly 1 so it can settle. */
function action(o: THREE.Object3D, secs: number, run: (p: number, t: number) => void) {
  let start = -1, last = 0;
  onTick(o, (t) => {
    last = t;
    if (start < 0) return;
    const p = Math.min(1, (t - start) / secs);
    run(p, t);
    if (p === 1) start = -1;
  });
  o.userData.play = () => {
    if (start < 0) start = last;
  };
}
const ease = THREE.MathUtils.smoothstep;
/** Rises from 0 to 1 over p = 0..a, holds, and falls back to 0 over p = b..1. */
const swell = (p: number, a: number, b: number) => ease(p, 0, a) * (1 - ease(p, b, 1));

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
  pages: std('#bfb49f', { roughness: 1 }),
  diary: std('#262321', { roughness: 0.75 }),
  band: std('#0c0d0e', { roughness: 0.5 }),
  pen: std('#cfd2d6', { roughness: 0.22, metalness: 0.9 }),
  ceramic: phys('#f4f2ee', { roughness: 0.2, clearcoat: 0.7, side: THREE.DoubleSide }),
  coffee: phys('#2a160b', { roughness: 0.05, clearcoat: 1 }),
  whitePot: phys('#ecebe6', { roughness: 0.28, clearcoat: 0.4, side: THREE.DoubleSide }),
  soil: std('#2b1f17', { roughness: 1 }),
  pebble: std('#a39c90', { roughness: 0.8 }),
  succ: phys('#7fae86', { roughness: 0.45, clearcoat: 0.3, clearcoatRoughness: 0.5 }),
  succYoung: phys('#a9c9a0', { roughness: 0.45, clearcoat: 0.3 }),
  figWhite: std('#f4f2ee', { roughness: 0.4 }),
  can: std('#7b9dc4', { roughness: 0.38, metalness: 0.35, side: THREE.DoubleSide }),
  brass: std('#b08d4f', { roughness: 0.3, metalness: 0.9 }),
  greenGlass: phys('#1d6b2c', { roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.1, emissive: '#0d3a16', emissiveIntensity: 0.6, side: THREE.FrontSide }),
  shadeInside: std('#ffe7b8', { emissive: '#ffcf87', emissiveIntensity: 0.9, side: THREE.BackSide }),
  figSkin: std('#f1c8a0', { roughness: 0.55 }),
  figGi: std('#f07a1c', { roughness: 0.5 }),
  figBlue: std('#1f4fa8', { roughness: 0.5 }),
  figHair: std('#121214', { roughness: 0.45, name: 'figHair' }), // named, so Super Saiyan mode finds it after the scene copies it
  figEye: std('#121214', { roughness: 0.3, name: 'figEye' }),
  lampGlow: new THREE.MeshBasicMaterial({ color: '#ffd9a8' }),
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
/** Rounded rectangle outline, centred on its origin, for corners rounder than a thin rounded box allows. */
export function roundRect(w: number, h: number, r: number) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
/** Thin slab (in its x-y plane, d deep) centred on its origin, with corners of radius r whatever its depth. */
function slabC(w: number, h: number, d: number, r: number, m: THREE.Material) {
  const geo = new THREE.ExtrudeGeometry(roundRect(w, h, r), { depth: d, bevelEnabled: false, curveSegments: 8 });
  return new THREE.Mesh(geo.center(), m);
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

/** The campfire itself: a low tepee of logs on glowing coals over an ash bed, with flames, sparks and smoke. Clicked,
 *  it roars up for a few seconds with a shower of sparks: userData.heat (0..1) says how hard, for the scene's flames
 *  and firelight. */
function fire() {
  const g = group('fire');
  T.reseed(11);
  let heat = 0;
  g.userData.heat = 0;
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
    M.ember.emissiveIntensity = (1.4 + Math.sin(t * 2.3) * 0.35 + Math.sin(t * 5.1) * 0.15) * (1 + heat);
    M.ember2.emissiveIntensity = (1.1 + Math.sin(t * 1.7 + 1) * 0.3) * (1 + heat);
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

  // Roaring up: the heat swells and flickers, and a shower of big sparks bursts out, heaviest at first. Each spark
  // flies once, from its own moment, up and out, slowing as it rises and fading as it cools.
  const BURST = 7, B = 170;
  const burstPos = new Float32Array(B * 3), burstCol = new Float32Array(B * 3);
  const burst = Array.from({ length: B }, () => {
    const a = T.rand() * Math.PI * 2, out = 0.12 + T.rand() * 0.45;
    return { at: Math.pow(T.rand(), 2) * 4.5, life: 0.9 + T.rand() * 0.9, vx: Math.cos(a) * out, vz: Math.sin(a) * out, vy: 1 + T.rand() * 1.3, ph: T.rand() * 6 };
  });
  const burstGeo = new THREE.BufferGeometry();
  burstGeo.setAttribute('position', new THREE.BufferAttribute(burstPos, 3));
  burstGeo.setAttribute('color', new THREE.BufferAttribute(burstCol, 3));
  const burstPts = new THREE.Points(
    burstGeo,
    new THREE.PointsMaterial({ size: 0.075, map: T.soft(), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }),
  );
  burstPts.frustumCulled = false;
  g.add(burstPts);
  action(g, BURST, (p, t) => {
    heat = swell(p, 0.06, 0.55) * (0.9 + Math.sin(t * 17) * 0.06 + Math.sin(t * 7.3) * 0.04);
    g.userData.heat = heat;
    const e = p * BURST;
    burst.forEach((s, i) => {
      const a = e - s.at, l = a / s.life;
      const b = p < 1 && l > 0 && l < 1 ? 2.4 * (1 - l) : 0;
      burstPos[i * 3] = s.vx * a + Math.sin(a * 9 + s.ph) * 0.03;
      burstPos[i * 3 + 1] = 0.2 + s.vy * a - 0.35 * a * a;
      burstPos[i * 3 + 2] = s.vz * a + Math.cos(a * 8 + s.ph) * 0.03;
      burstCol[i * 3] = b;
      burstCol[i * 3 + 1] = b * 0.5;
      burstCol[i * 3 + 2] = b * 0.12;
    });
    burstGeo.attributes.position.needsUpdate = true;
    burstGeo.attributes.color.needsUpdate = true;
  });
  g.userData.hover = true; // the scene makes it flare up under the mouse
  g.userData.label = 'Stoke the fire';
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
  const glass = rboxC(W - 0.085, 0.69, 0.004, 0.012, M.glass);
  glass.name = 'kioskScreen'; // the scene pins the kiosk's welcome screen (/kiosk) onto this (it faces +z)
  front(glass, 0, H - 0.49, 0.006);

  // Payment module: tap pad, QR window, status lights
  front(rboxC(W - 0.1, 0.2, 0.01, 0.02, M.plastic), 0, 0.5, 0.002);
  front(rboxC(0.13, 0.1, 0.006, 0.016, M.aluDark), -0.085, 0.49, 0.008);
  front(rboxC(0.12, 0.1, 0.006, 0.012, M.qr), 0.09, 0.49, 0.008);
  for (let i = 0; i < 4; i++) front(rboxC(0.014, 0.004, 0.002, 0.001, M.led), -0.12 + i * 0.022, 0.415, 0.008); // below the pads, clear of the screen

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
  lid.position.set(0, 0.013, -D / 2);
  lid.rotation.x = -1.85;
  g.add(lid);
  const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, W - 0.08, 12), M.aluDark);
  hinge.rotation.z = Math.PI / 2;
  hinge.position.set(0, 0.012, -D / 2 + 0.004);
  g.add(hinge);
  return g;
}

/** Tablet leaning back on a slim folding aluminium stand: a thin base plate with a lip at the front that holds the
 *  tablet's bottom edge, and a flat strut behind propping it up. */
function tablet() {
  const g = group('tablet');
  const W = 0.2, H = 0.142, lean = 0.32; // landscape, tipped back from upright
  g.add(rbox(0.11, 0.005, 0.1, 0.002, M.alu)); // base plate
  g.add(at(rbox(0.11, 0.013, 0.006, 0.002, M.alu), 0, 0, 0.047)); // front lip
  const up = new THREE.Vector3(0, Math.cos(lean), -Math.sin(lean)), back = new THREE.Vector3(0, -Math.sin(lean), -Math.cos(lean));
  const foot = new THREE.Vector3(0, 0.005, 0.04); // where the tablet's bottom edge rests, against the lip
  const slab = group('slab', rboxC(W, H, 0.007, 0.01, M.plastic));
  slab.add(at(rboxC(W - 0.006, H - 0.006, 0.002, 0.008, M.bezel), 0, 0, 0.0032));
  const screen = at(rboxC(W - 0.012, H - 0.012, 0.002, 0.006, M.glass), 0, 0, 0.0045);
  screen.name = 'tabletScreen'; // the scene pins the tablet's desktop (/tablet) onto this (it faces +z)
  slab.add(screen);
  slab.position.copy(foot).addScaledVector(up, H / 2).addScaledVector(back, 0.0035);
  slab.rotation.x = -lean;
  g.add(slab);
  // Strut: a flat aluminium plate from the back of the base up to the middle of the tablet's back
  const top = foot.clone().addScaledVector(up, H * 0.5).addScaledVector(back, 0.009);
  const bottom = new THREE.Vector3(0, 0.005, -0.045), dir = top.clone().sub(bottom);
  const strut = rboxC(0.07, dir.length(), 0.005, 0.002, M.alu);
  strut.position.copy(bottom).addScaledVector(dir, 0.5);
  strut.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  g.add(strut);
  g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.072, 12).rotateZ(Math.PI / 2), M.aluDark), 0, 0.007, -0.045)); // hinge
  return g;
}

/** Phone standing on a small metal stand. */
function phone() {
  const g = group('phone');
  g.add(rbox(0.075, 0.01, 0.075, 0.005, M.alu));
  g.add(at(rbox(0.075, 0.012, 0.008, 0.003, M.alu), 0, 0.01, 0.025)); // front lip
  const set = group('handset', slabC(0.072, 0.15, 0.008, 0.011, M.plastic));
  set.add(at(slabC(0.07, 0.148, 0.002, 0.01, M.bezel), 0, 0, 0.0032)); // black border round the screen
  const screen = at(slabC(0.064, 0.138, 0.002, 0.007, M.glass), 0, 0, 0.0045);
  screen.name = 'phoneScreen'; // the scene pins the phone's home screen (/phone) onto this (it faces +z; its 7 mm corners match PHONE_R in scene.ts)
  set.add(screen);
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
  g.add(rbox(0.095, 0.011, 0.02, 0.004, M.walnut));
  g.add(at(rboxC(0.088, 0.0015, 0.003, 0.0006, M.bezel), 0, 0.011, 0));
  const back = M.cardBack;
  const card = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.054, 0.0012), [back, back, back, back, M.cardFace, back]);
  card.position.set(0, 0.033, 0.001);
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
  const len = 0.095, wid = 0.058, rise = 0.05, r = 0.034;
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
  // Printing: the box hums and the receipt feeds out longer, then it's torn off and back to its stub
  action(g, 1.1, (p, t) => {
    g.position.x = p < 1 ? Math.sin(t * 90) * 0.0007 : 0;
    const feed = p < 1 ? 1 + ease(p, 0, 0.9) * 0.9 : 1;
    receipt.scale.set(1, feed, feed);
  });
  return g;
}

/** Dark hardcover notebook with an elastic band and a pen on top. */
function diary() {
  const g = group('diary');
  const W = 0.15, D = 0.21;
  g.add(rbox(W, 0.003, D, 0.0015, M.diary));
  g.add(at(rbox(W - 0.01, 0.01, D - 0.01, 0.002, M.pages), 0.003, 0.003, 0));
  g.add(at(rbox(W, 0.003, D, 0.0015, M.diary), 0, 0.013, 0));
  g.add(at(rboxC(0.007, 0.016, D, 0.003, M.diary), -W / 2 + 0.003, 0.008, 0)); // spine
  g.add(at(rbox(0.007, 0.0165, D + 0.002, 0.001, M.band), W / 2 - 0.025, 0, 0)); // elastic
  const pen = group('pen');
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 0.12, 16), M.pen);
  body.rotation.z = Math.PI / 2;
  pen.add(body);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.0045, 0.014, 16), M.pen);
  tip.rotation.z = -Math.PI / 2;
  tip.position.x = 0.067;
  pen.add(tip);
  pen.add(at(rboxC(0.04, 0.002, 0.003, 0.001, M.aluDark), -0.035, 0.005, 0)); // clip
  pen.position.set(0, 0.0205, 0.01);
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

/** Round planter: straight sides and a crisp rim, with soil and a few pebbles on top. */
function planter(r: number, h: number, m: THREE.Material) {
  const g = group('planter', cyl(r, r * 0.92, h, m, 64));
  g.add(at(cyl(r - 0.004, r - 0.004, 0.003, M.soil, 48), 0, h - 0.001, 0));
  for (let i = 0; i < 6; i++) {
    const a = T.rand() * Math.PI * 2, d = T.rand() * (r - 0.015);
    g.add(at(new THREE.Mesh(new THREE.DodecahedronGeometry(0.005 + T.rand() * 0.005, 0), M.pebble), Math.cos(a) * d, h + 0.003, Math.sin(a) * d));
  }
  return g;
}

/** Watering can with a flat-sided, crisp-edged oblong body, a filler neck, a long spout with a rose, and a handle. */
function wateringCan() {
  const g = group('wateringCan');
  g.add(rbox(0.13, 0.11, 0.07, 0.006, M.can));
  g.add(at(cyl(0.02, 0.02, 0.014, M.can, 32), -0.035, 0.108, 0)); // filler neck
  g.add(tube([[0.055, 0.03, 0], [0.1, 0.075, 0], [0.135, 0.118, 0]], 0.007, M.can));
  const rose = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.008, 0.02, 16), M.can);
  rose.name = 'rose';
  rose.position.set(0.141, 0.126, 0);
  rose.rotation.z = -0.75;
  g.add(rose);
  g.add(tube([[-0.058, 0.085, 0], [-0.07, 0.15, 0], [-0.015, 0.175, 0], [0.03, 0.11, 0]], 0.0065, M.can));
  return g;
}

// A pointed leaf blade: a flattened cone lying along +z from its base (z = 0) to its tip (z = 1)
const succLeafGeo = new THREE.ConeGeometry(1, 1, 8, 1).rotateX(Math.PI / 2).translate(0, 0, 0.5);

/** Small spiky succulent (an agave-like rosette): stiff, narrow blue-green blades tapering to sharp points, standing up
 *  in the middle and fanning out round the edge, in a little round white planter. */
function succulent() {
  const g = group('succulent');
  T.reseed(41);
  const h = 0.06;
  g.add(planter(0.045, h, M.whitePot));
  const rosette = group('rosette');
  rosette.position.y = h - 0.006;
  // Blades spiral out from the centre (golden angle): short and upright inside, longer and more open outside
  const n = 40;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1), az = i * 2.4;
    const len = 0.032 + t * 0.05, wid = 0.008 + t * 0.008;
    const leaf = new THREE.Mesh(succLeafGeo, i < 7 ? M.succYoung : M.succ);
    leaf.scale.set(wid, 0.0065, len); // thick, fleshy blades
    const pivot = group('leaf', leaf);
    pivot.rotation.order = 'YXZ';
    pivot.rotation.y = az;
    pivot.rotation.x = -(1.4 - t * 0.85) + (T.rand() - 0.5) * 0.15; // inner blades stand up, outer ones open out
    pivot.position.y = 0.004 + (1 - t) * 0.008;
    rosette.add(pivot);
  }
  g.add(rosette);
  return g;
}

/** The succulent with its watering can standing beside the pot, spout toward it. Clicked, the can lifts, tips its
 *  spout over the plant and sprinkles it, then sets itself back down; the plant gives a little perk after. */
function plantSet() {
  const g = group('plantSet');
  const plant = big(succulent(), 1.1), rosette = plant.getObjectByName('rosette')!;
  const can = turn(at(big(wateringCan(), 0.6), 0.13, 0, -0.02), Math.PI + 0.3), rose = can.getObjectByName('rose')!;
  g.add(plant, can);
  // Pouring pose: tipped forward by TIP, placed so the rose hangs just over the middle of the plant
  const TIP = 0.6, home = can.position.clone();
  const pour = new THREE.Vector3(0.04, 0.165, -0.01).sub(
    rose.position.clone().applyEuler(new THREE.Euler(0, Math.PI + 0.3, -TIP)).multiplyScalar(can.scale.x),
  );
  // Drops: each leaves the rose at its own moment while the can is tipped, and arcs out over the plant as it falls
  const N = 260, POUR = [0.3, 0.72], SECS = 5.5;
  const dropPos = new Float32Array(N * 3), drops = Array.from({ length: N }, (_, i) => ({
    at: (POUR[0] + ((POUR[1] - POUR[0]) * i) / N) * SECS, vx: (Math.random() - 0.5) * 0.1, vz: (Math.random() - 0.5) * 0.1,
  }));
  const dropGeo = new THREE.BufferGeometry();
  dropGeo.setAttribute('position', new THREE.BufferAttribute(dropPos, 3));
  const water = new THREE.Points(
    dropGeo,
    new THREE.PointsMaterial({ size: 0.012, map: T.soft(), color: '#d6eeff', transparent: true, depthWrite: false }),
  );
  water.frustumCulled = false;
  water.visible = false;
  g.add(water);
  const from = new THREE.Vector3();
  action(g, SECS, (p) => {
    const there = swell(p, 0.25, 0.8), tip = swell(p, 0.32, 0.72) * ease(p, 0.2, 0.32);
    can.position.lerpVectors(home, pour, there);
    can.position.y += Math.sin(there * Math.PI) * 0.03; // a little arc on the way
    can.rotation.z = -TIP * tip;
    // The rose's place in this group, from where the can is now
    can.updateMatrix();
    from.copy(rose.position).applyMatrix4(can.matrix);
    water.visible = p < 1;
    const e = p * SECS;
    drops.forEach((d, i) => {
      const a = e - d.at, y = from.y - 0.05 * a - 1.2 * a * a;
      const live = a > 0 && y > 0.07;
      dropPos[i * 3] = live ? from.x + (d.vx - 0.22) * a : 0;
      dropPos[i * 3 + 1] = live ? y : -1;
      dropPos[i * 3 + 2] = live ? from.z + (d.vz + 0.05) * a : 0;
    });
    dropGeo.attributes.position.needsUpdate = true;
    // The plant perks up a little once it's watered
    const perk = ease(p, 0.6, 0.7) * (1 - ease(p, 0.7, 1));
    rosette.scale.set(1, 1 + perk * 0.08, 1);
  });
  return g;
}

/** Vintage banker's lamp: a stepped brass foot, a curved brass arm and a long green glass shade with a brass pull
 *  chain. It starts off; userData.setOn(true) lights the bulb and the shade and casts a soft warm wash over the desk. */
function lamp() {
  const g = group('lamp');
  g.add(lathe([[0, 0], [0.075, 0], [0.078, 0.008], [0.072, 0.016], [0.052, 0.026], [0.036, 0.04], [0.03, 0.055], [0.022, 0.06], [0.027, 0.072], [0.02, 0.09], [0.012, 0.1], [0, 0.1]], M.brass, 48));
  const shadeY = 0.27, shadeZ = 0.04;
  g.add(taper([[0, 0.095, -0.005], [0, 0.17, -0.03], [0, 0.23, -0.035], [0, shadeY - 0.01, shadeZ - 0.055]], 0.007, 0.006, M.brass, 24, 10));
  // Shade: half a cylinder lying along x, open underneath, green outside and lit warm inside, tipped a little forward
  const L = 0.2, R = 0.055;
  const shade = group('shade');
  const arc = new THREE.CylinderGeometry(R, R, L, 32, 1, true, 0, Math.PI).rotateZ(Math.PI / 2);
  shade.add(new THREE.Mesh(arc, M.greenGlass), new THREE.Mesh(arc, M.shadeInside));
  for (const s of [-1, 1]) {
    const cap = new THREE.Mesh(new THREE.CircleGeometry(R, 16, 0, Math.PI).rotateY((s * Math.PI) / 2), M.greenGlass);
    cap.position.x = (s * L) / 2;
    shade.add(cap);
  }
  shade.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, L + 0.006, 8).rotateZ(Math.PI / 2), M.brass), 0, 0, -R)); // brass rim at the back
  shade.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.014, 12, 8), M.lampGlow), 0, 0.012, 0)); // bulb
  shade.scale.set(1, 0.85, 0.85);
  shade.position.set(0, shadeY, shadeZ);
  shade.rotation.x = 0.22;
  g.add(shade);
  g.add(tube([[0.05, shadeY - 0.01, shadeZ + 0.01], [0.05, shadeY - 0.06, shadeZ + 0.012], [0.05, shadeY - 0.1, shadeZ + 0.01]], 0.0012, M.brass, 8)); // pull chain
  g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.003, 8, 6), M.brass), 0.05, shadeY - 0.1, shadeZ + 0.01));
  const light = new THREE.SpotLight('#ffd9a8', 0, 2, 1.35, 1, 1.2);
  light.position.set(0, shadeY - 0.01, shadeZ);
  light.target.position.set(0, 0, shadeZ + 0.12);
  g.add(light, light.target);
  g.userData.setOn = (on: boolean) => {
    light.intensity = on ? 0.35 : 0;
    (M.shadeInside as THREE.MeshStandardMaterial).emissiveIntensity = on ? 0.9 : 0.04;
    (M.greenGlass as THREE.MeshPhysicalMaterial).emissiveIntensity = on ? 0.6 : 0.08;
    M.lampGlow.color.set(on ? '#ffd9a8' : '#4a4036');
  };
  g.userData.setOn(false);
  return g;
}

/** Collectible figure of Son Goku on a round stand, in realistic proportions (about 6.5 heads tall, 18 cm): a
 *  muscular build in the orange gi over a blue undershirt, blue belt with its knot, wristbands and boots, a face with
 *  eyes, brows, nose and ears, and his black hair in big spikes swept up and back, with bangs over the forehead. */
function figurine() {
  const g = group('figurine');
  const limb = (pts: [number, number, number][], r0: number, r1: number, m: THREE.Material) => g.add(taper(pts, r0, r1, m, 16, 12));
  const ball = (r: number, m: THREE.Material, x: number, y: number, z: number, sx = 1, sy = 1, sz = 1) => {
    const o = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), m);
    o.position.set(x, y, z);
    o.scale.set(sx, sy, sz);
    g.add(o);
    return o;
  };
  g.add(cyl(0.042, 0.045, 0.008, M.bezel, 40));
  const b = 0.008; // top of the stand

  // Boots and baggy trousers, legs a little apart
  for (const s of [-1, 1]) {
    ball(0.011, M.figBlue, s * 0.017, b + 0.008, 0.004, 0.9, 0.8, 1.45); // boot foot
    g.add(at(cyl(0.0085, 0.0095, 0.022, M.figBlue, 16), s * 0.017, b + 0.004, 0)); // boot shaft
    limb([[s * 0.011, b + 0.084, 0], [s * 0.016, b + 0.055, 0.003], [s * 0.017, b + 0.026, 0]], 0.0125, 0.0095, M.figGi);
  }
  // Torso: gi top, flatter front to back, broad at the chest and shoulders
  const torso = lathe([[0.016, 0], [0.0175, 0.012], [0.021, 0.03], [0.023, 0.042], [0.02, 0.05], [0.009, 0.056], [0, 0.056]], M.figGi, 32);
  torso.position.y = b + 0.08;
  torso.scale.z = 0.72;
  g.add(torso);
  // Blue undershirt showing in the V of the gi, and the blue belt with its knot and two tails
  const v = new THREE.Mesh(new THREE.ConeGeometry(0.008, 0.024, 3).rotateZ(Math.PI), M.figBlue);
  v.position.set(0, b + 0.118, 0.0128);
  v.rotation.x = -0.25;
  v.scale.z = 0.3;
  g.add(v);
  const belt = new THREE.Mesh(new THREE.TorusGeometry(0.0165, 0.0035, 8, 28).rotateX(Math.PI / 2), M.figBlue);
  belt.position.y = b + 0.084;
  belt.scale.z = 0.74;
  g.add(belt);
  ball(0.0042, M.figBlue, -0.006, b + 0.084, 0.0125);
  for (const dx of [-0.01, -0.003]) g.add(at(rboxC(0.005, 0.016, 0.002, 0.001, M.figBlue), dx, b + 0.075, 0.0125));

  // Arms: blue short sleeves at the shoulders, muscular bare arms, blue wristbands, fists
  for (const s of [-1, 1]) {
    const sh: [number, number, number] = [s * 0.025, b + 0.126, 0], el: [number, number, number] = [s * 0.032, b + 0.1, 0.002], wr: [number, number, number] = [s * 0.034, b + 0.077, 0.005];
    ball(0.0095, M.figBlue, sh[0], sh[1] - 0.002, 0, 1, 0.9, 0.9);
    limb([sh, [s * 0.03, b + 0.113, 0.001], el], 0.0085, 0.0068, M.figSkin);
    limb([el, [s * 0.033, b + 0.088, 0.004], wr], 0.0072, 0.0055, M.figSkin);
    g.add(at(cyl(0.0068, 0.0068, 0.008, M.figBlue, 14), wr[0], wr[1] - 0.003, wr[2])); // wristband
    ball(0.0072, M.figSkin, wr[0], wr[1] - 0.009, wr[2], 0.9, 1, 1.05); // fist
  }

  // Neck and head
  g.add(at(cyl(0.0062, 0.007, 0.01, M.figSkin, 16), 0, b + 0.134, 0));
  const hy = b + 0.153;
  ball(0.0135, M.figSkin, 0, hy, 0.001, 0.92, 1.12, 1);
  ball(0.0075, M.figSkin, 0, hy - 0.009, 0.004, 1, 0.8, 1); // jaw
  for (const s of [-1, 1]) {
    ball(0.0035, M.figSkin, s * 0.0128, hy, -0.001, 0.5, 1, 0.8); // ear
    ball(0.0026, M.figWhite, s * 0.0052, hy + 0.0012, 0.0118, 1.3, 0.8, 0.5); // eye white
    ball(0.0013, M.figEye, s * 0.0049, hy + 0.0012, 0.0128); // pupil
    const brow = at(rboxC(0.0068, 0.0013, 0.0015, 0.0006, M.figHair), s * 0.0052, hy + 0.0052, 0.0122);
    brow.rotation.z = s * -0.3;
    g.add(brow);
  }
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.0018, 0.004, 8).rotateX(Math.PI / 2), M.figSkin);
  nose.position.set(0, hy - 0.002, 0.0138);
  g.add(nose);

  // Hair, centred on the head: a cap over the crown, big spikes swept up, back and out, and bangs over the forehead
  const hair = group('hair');
  hair.position.y = hy;
  g.add(hair);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.0146, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.5), M.figHair);
  cap.position.set(0, 0.006, 0.0003);
  cap.scale.set(0.97, 1.2, 1.03);
  hair.add(cap);
  hair.add(at(ball(0.0135, M.figHair, 0, 0, 0, 0.95, 1.05, 0.9), 0, 0.001, -0.004)); // back of the head
  const up = new THREE.Vector3(0, 1, 0), dir = new THREE.Vector3();
  // [direction x, y, z, length, base radius]
  const spikes: [number, number, number, number, number][] = [
    [0.15, 1, -0.2, 0.034, 0.0075], [-0.35, 0.95, -0.25, 0.032, 0.007], [0.55, 0.8, -0.3, 0.03, 0.007], [-0.7, 0.65, -0.3, 0.03, 0.007],
    [0.85, 0.35, -0.2, 0.026, 0.0065], [-0.9, 0.3, -0.2, 0.026, 0.0065], [0.2, 0.5, -0.9, 0.032, 0.0075], [-0.3, 0.45, -0.9, 0.03, 0.007],
    [0.6, 0.15, -0.8, 0.026, 0.0065], [-0.65, 0.1, -0.8, 0.026, 0.0065], [0, 0.1, -1, 0.024, 0.0065],
    [0.25, -0.35, 0.95, 0.012, 0.0035], [-0.15, -0.4, 0.95, 0.013, 0.0035], [0.5, -0.25, 0.85, 0.01, 0.003], [-0.5, -0.2, 0.85, 0.011, 0.003], // bangs
  ];
  for (const [x, y, z, l, r] of spikes) {
    dir.set(x, y, z).normalize();
    const spike = new THREE.Mesh(new THREE.ConeGeometry(r * 1.45, l * 1.1, 10), M.figHair);
    spike.quaternion.setFromUnitVectors(up, dir);
    const bang = z > 0.5;
    spike.position.set(0, bang ? 0.008 : 0.004, 0).addScaledVector(dir, (bang ? 0.012 : 0.01) + l / 2);
    hair.add(spike);
  }

  // Super Saiyan Blue: the hair (and brows) flare cyan and stand up taller, the eyes turn blue, and a blue aura of
  // flickering flame tongues wraps the figure, lighting the desk round it, with motes rising through it.
  const aura = group('aura');
  aura.visible = false;
  const tongues: { f: THREE.Mesh; R: number; H: number; ph: number; sp: number }[] = [];
  for (const [color, op, n, R, H, ring] of [['#1f7bff', 0.085, 9, 0.036, 0.25, 0.032], ['#8fe6ff', 0.055, 5, 0.026, 0.21, 0.02]] as const) {
    const m = glow(color, op);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, f = new THREE.Mesh(flameGeo, m);
      f.position.set(Math.cos(a) * ring, -0.004, Math.sin(a) * ring * 0.7);
      f.scale.setScalar(0);
      aura.add(f);
      tongues.push({ f, R, H: H * (0.85 + Math.random() * 0.3), ph: Math.random() * 10, sp: 6 + Math.random() * 5 });
    }
  }
  g.add(aura);
  const MOTES = 30, motePos = new Float32Array(MOTES * 3);
  const moteGeo = new THREE.BufferGeometry();
  moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3));
  const motes = new THREE.Points(
    moteGeo,
    new THREE.PointsMaterial({ size: 0.006, map: T.soft(), color: '#b8f0ff', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  motes.frustumCulled = false;
  aura.add(motes);
  const ki = new THREE.PointLight('#3aa8ff', 0, 0.9, 1.4);
  ki.position.set(0, 0.11, 0.05);
  g.add(ki);
  const black = new THREE.Color('#121214'), blue = new THREE.Color('#3fd0ff'), eyeBlue = new THREE.Color('#2a8dff');
  let hairMats: THREE.MeshStandardMaterial[] = [], eyeMats: THREE.MeshStandardMaterial[] = [];
  action(g, 7, (p, t) => {
    if (!hairMats.length) {
      // The scene gives each hoverable thing its own copies of its materials, so look them up by name here
      const found = new Set<THREE.MeshStandardMaterial>();
      g.traverse((o) => (o as THREE.Mesh).isMesh && found.add((o as THREE.Mesh).material as THREE.MeshStandardMaterial));
      hairMats = [...found].filter((m) => m.name === 'figHair');
      eyeMats = [...found].filter((m) => m.name === 'figEye');
    }
    // Powering up flickers on and off before it holds
    const lv = swell(p, 0.12, 0.85) * (p < 0.12 ? 0.55 + 0.45 * Math.sign(Math.sin(t * 40)) : 1);
    for (const m of hairMats) {
      m.color.lerpColors(black, blue, lv);
      m.emissive.copy(blue).multiplyScalar(lv * 0.5);
    }
    for (const m of eyeMats) m.color.lerpColors(black, eyeBlue, lv);
    hair.scale.set(1 + lv * 0.08, 1 + lv * 0.2, 1 + lv * 0.08);
    aura.visible = lv > 0.01;
    ki.intensity = lv * 0.3;
    for (const { f, R, H, ph, sp } of tongues) {
      const s = Math.sin(t * sp + ph) * 0.15 + Math.sin(t * 15 + ph * 2) * 0.07;
      f.scale.set(R * lv * (1 - s * 0.3), H * lv * (1 + s), R * lv * (1 - s * 0.3));
    }
    for (let i = 0; i < MOTES; i++) {
      const l = (t * 0.6 + i / MOTES) % 1, a = i * 2.4;
      motePos[i * 3] = Math.cos(a) * (0.02 + (i % 3) * 0.008);
      motePos[i * 3 + 1] = l * 0.24 * lv;
      motePos[i * 3 + 2] = Math.sin(a) * (0.016 + (i % 3) * 0.006);
    }
    moteGeo.attributes.position.needsUpdate = true;
  });
  return g;
}

/** Loose sheet of paper with a few handwritten lines. */
function paper() {
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.2).rotateX(-Math.PI / 2), M.paper);
  sheet.position.y = 0.001;
  return group('paper', sheet);
}

const big = <O extends THREE.Object3D>(o: O, s: number) => (o.scale.setScalar(s), o);
const turn = <O extends THREE.Object3D>(o: O, ry: number) => ((o.rotation.y = ry), o);

/** The desk: a wide pale birch top with softly rounded corners on four slim white metal legs. On top, two tidy rows
 *  on five evenly spaced columns. Back: a figurine behind the printer, the tablet, the laptop, the phone and the green banker's lamp. Front: the printer standing
 *  on a sheet of paper, the business card, the notebook, the mug, and a small succulent with its watering can. */
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

  // Things on the desk: [object, x, z, turn, what clicking it does], in two rows on the same five columns
  const S = 1.3, col = [-0.66, -0.37, 0, 0.37, 0.66], back = -0.17, front = 0.22;
  const pr = printer(), printerSet = group('printerSet', paper(), at(pr, 0, 0, -0.04)); // the printer stands on the paper, which sticks out in front of it
  printerSet.userData.play = pr.userData.play;
  const things: [THREE.Object3D, number, number, number, string][] = [
    [big(figurine(), 1.1), col[0] - 0.04, back - 0.08, 0.2, 'Go Super Saiyan Blue'],
    [printerSet, col[0], front - 0.05, 0.05, 'Print a quote'],
    [big(tablet(), S), col[1] - 0.07, back + 0.05, 0.2, 'See my work'],
    [big(laptop(), S), col[2], back + 0.05, 0, 'Browse the website'],
    [big(phone(), S), col[3] + 0.04, back - 0.02, -0.15, 'Open my apps'],
    [big(lamp(), 1.1), col[4], back - 0.06, -0.25, 'Switch on the lamp'],
    [big(cardStand(), 1.4), col[1], front, 0, 'Take my card'],
    [big(mug(), S), col[2], front, -0.9, 'Take a sip'],
    [big(diary(), S), col[3] - 0.02, front - 0.03, -0.08, 'Read what clients say'],
    [plantSet(), col[4] - 0.06, front, 0, 'Water the plant'],
  ];
  for (const [o, x, z, ry, label] of things) {
    o.position.set(x, top, z);
    o.rotation.y = ry;
    o.userData.hover = true; // the scene lifts it a little under the mouse
    o.userData.label = label; // ...and shows this beside it
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
