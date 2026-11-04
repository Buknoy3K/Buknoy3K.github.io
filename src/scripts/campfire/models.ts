// Campfire scene figures, built from primitives and canvas textures (no imported models).
// Units are metres. Every builder returns a Group whose origin sits on the ground under the object.
// Anything that moves registers a tick in userData.ticks; the scene calls them every frame.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
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
  glass: phys('#06080a', { roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 0.35 }),
  bezel: std('#101113', { roughness: 0.35 }),
  plastic: std('#1d1f22', { roughness: 0.5 }),
  alu: std('#c3c7cc', { roughness: 0.3, metalness: 0.85 }),
  aluDark: std('#5d6168', { roughness: 0.35, metalness: 0.8 }),
  key: std('#26282c', { roughness: 0.55 }),
  trackpad: std('#cdd1d6', { roughness: 0.35, metalness: 0.6 }),
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
  coffee: phys('#2a160b', { roughness: 0.15, clearcoat: 0.35, specularIntensity: 0.3, envMapIntensity: 0.15 }),
  whitePot: phys('#ecebe6', { roughness: 0.28, clearcoat: 0.4, side: THREE.DoubleSide }),
  soil: std('#2b1f17', { roughness: 1 }),
  pebble: std('#a39c90', { roughness: 0.8 }),
  succ: phys('#7fae86', { roughness: 0.45, clearcoat: 0.3, clearcoatRoughness: 0.5 }),
  succYoung: phys('#a9c9a0', { roughness: 0.45, clearcoat: 0.3 }),
  figWhite: std('#f4f2ee', { roughness: 0.4 }),
  can: std('#7b9dc4', { roughness: 0.38, metalness: 0.35, side: THREE.DoubleSide }),
  brass: std('#b08d4f', { roughness: 0.3, metalness: 0.9 }),
  figSkin: std('#f1c8a0', { roughness: 0.55 }),
  figGi: std('#f07a1c', { roughness: 0.5 }),
  figBlue: std('#1f4fa8', { roughness: 0.5 }),
  figHair: std('#121214', { roughness: 0.45, name: 'figHair' }), // named, so Super Saiyan mode finds it after the scene copies it
  figEye: std('#121214', { roughness: 0.3, name: 'figEye' }),
  walnut: std('#ffffff', { map: T.wood('#6b4630', '#3d2617'), roughness: 0.45 }),
  logBark: std('#8f8f8f', { map: T.bark(), roughness: 0.95 }),
  logEnd: std('#ffffff', { map: T.endGrain(), roughness: 0.9 }),
  ash: std('#3b3836', { roughness: 1 }),
  // Miniature fireplace: a red brick breast with cream stone trim round a sooty firebox, an iron grate, a slate hearth
  brick: std('#ffffff', { map: T.brick(), bumpMap: T.brickBump(), bumpScale: 3, roughness: 0.9 }),
  stoneTrim: std('#e4d9c6', { roughness: 0.75 }),
  stoneShade: std('#cfc2ab', { roughness: 0.8 }),
  slate: std('#3a3c3f', { roughness: 0.55 }),
  wax: std('#f1e3bf', { roughness: 0.6 }),
  soot: std('#16110e', { roughness: 1, side: THREE.BackSide }),
  iron: std('#29241f', { roughness: 0.55, metalness: 0.6 }),
  stones: ['#5d5a55', '#6b675f', '#4f4c48', '#76716a'].map((c) => std(c, { roughness: 0.9 })),
  cardFace: std('#ffffff', { map: T.cardFace(), roughness: 0.35 }),
  cardBack: std('#0b1210', { roughness: 0.4 }),
  ember: std('#2a1208', { emissive: '#ff5a10', emissiveIntensity: 1.6, roughness: 1 }),
  ember2: std('#2a1208', { emissive: '#ff8a20', emissiveIntensity: 1.2, roughness: 1 }),
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
/** Bakes the still meshes under root into one mesh per material, so a scenery piece made of many parts costs a few
 *  draw calls instead of one per part. Leaves alone anything under skip, anything that moves or reacts (ticks, hover,
 *  click), named parts the scene looks up, instanced meshes and mirrored parts. Call it once the piece is built. */
function mergeStill(root: THREE.Object3D, skip: (o: THREE.Object3D) => boolean = () => false) {
  root.updateMatrixWorld(true);
  const toRoot = root.matrixWorld.clone().invert();
  const lively = (o: THREE.Object3D) => o.userData.ticks || o.userData.hover || o.userData.play;
  const byMat = new Map<THREE.Material, THREE.Mesh[]>();
  const walk = (o: THREE.Object3D) => {
    for (const c of o.children) {
      if (skip(c) || lively(c)) continue;
      const m = c as THREE.Mesh;
      if (m.isMesh && !(m as THREE.InstancedMesh).isInstancedMesh && !Array.isArray(m.material) && !m.name && m.children.length === 0 && m.matrixWorld.determinant() > 0) {
        const list = byMat.get(m.material) ?? [];
        list.push(m);
        byMat.set(m.material, list);
      } else walk(c);
    }
  };
  walk(root);
  const keep = ['position', 'normal', 'uv'];
  for (const [mat, meshes] of byMat) {
    if (meshes.length < 2) continue;
    const geos = meshes.map((m) => {
      let g = m.geometry.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(toRoot, m.matrixWorld));
      for (const a of Object.keys(g.attributes)) if (!keep.includes(a)) g.deleteAttribute(a);
      if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
      g.clearGroups();
      return g;
    });
    const indexed = geos.every((g) => g.index);
    const merged = mergeGeometries(indexed ? geos : geos.map((g) => (g.index ? g.toNonIndexed() : g)));
    if (!merged) continue;
    for (const m of meshes) m.removeFromParent();
    root.add(new THREE.Mesh(merged, mat));
  }
}

// ---------------------------------------------------------------- fire

const flameGeo = new THREE.LatheGeometry(
  Array.from({ length: 17 }, (_, i) => {
    const v = i / 16;
    return new THREE.Vector2(Math.sin(Math.PI * Math.pow(v, 0.55)) * (1 - v * 0.2) + 1e-4, v);
  }),
  20,
);

// ---------------------------------------------------------------- desk + things on it

export const LAPTOP_R = 0.008; // the laptop's screen corner radius (metres), which the scene rounds its page and picture to

/** Slab lying flat (in its x-z plane, h thick) centred on its origin, with corners of radius r whatever its thickness. */
function flatSlab(w: number, d: number, h: number, r: number, m: THREE.Material) {
  const mesh = slabC(w, d, h, r, m);
  mesh.geometry.rotateX(-Math.PI / 2);
  return mesh;
}

/** Laptop in the clean, rounded style of a MacBook: a thin silver base with well-rounded corners, black keys set in a
 *  tidy grid, a wide trackpad, and a lid of black glass edge to edge in a silver shell. */
function laptop() {
  const g = group('laptop');
  const W = 0.32, D = 0.22, R = 0.016, base = 0.011;
  g.add(at(flatSlab(W, D, base, R, M.alu), 0, base / 2, 0));

  // Keys: a short function row, then five rows (wider keys at the ends of each), the bottom row with the space bar
  const u = 0.0192, gap = 0.0028, kw = 14 * u, k0 = -D / 2 + 0.026;
  const rows: number[][] = [
    Array(14).fill(1),
    [...Array(13).fill(1), 1],
    [1.5, ...Array(11).fill(1), 1.5],
    [1.75, ...Array(11).fill(1), 1.25],
    [2.25, ...Array(10).fill(1), 1.75],
    [1, 1, 1, 1.25, 5.5, 1.25, 1, 1, 1],
  ];
  const keyMeshes: THREE.Mesh[] = [];
  rows.forEach((row, r) => {
    const d = r === 0 ? u * 0.55 - gap * 0.6 : u - gap;
    const z = k0 + (r === 0 ? 0 : (r - 0.22) * u);
    let x = -kw / 2;
    for (const w of row) {
      const k = rboxC(w * u - gap, 0.0025, d, 0.0012, M.key);
      k.position.set(x + (w * u) / 2, base + 0.0008, z);
      keyMeshes.push(k);
      x += w * u;
    }
  });
  g.add(group('keys', ...keyMeshes));
  mergeStill(g.getObjectByName('keys')!);

  // Wide trackpad, a touch lighter than the deck
  g.add(at(flatSlab(0.13, 0.066, 0.0008, 0.007, M.trackpad), 0, base + 0.0001, D / 2 - 0.043));

  // Lid hinged at the back edge, opened ~105 degrees; screen layers sit on its underside
  const lid = group('lid', at(flatSlab(W, D, 0.005, R, M.alu), 0, 0.0025, D / 2));
  lid.add(at(flatSlab(W - 0.003, D - 0.003, 0.001, R - 0.0015, M.bezel), 0, -0.0005, D / 2));
  const screen = at(flatSlab(W - 0.016, D - 0.022, 0.001, LAPTOP_R, M.glass), 0, -0.0011, D / 2 + 0.003);
  screen.name = 'laptopScreen'; // the scene pins the live website onto this (it faces the lid's -y)
  lid.add(screen);
  lid.position.set(0, 0.013, -D / 2);
  lid.rotation.x = -1.85;
  g.add(lid);
  const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, W - 0.08, 12), M.aluDark);
  hinge.rotation.z = Math.PI / 2;
  hinge.position.set(0, 0.011, -D / 2 + 0.006);
  g.add(hinge);
  return g;
}

export const TABLET_R = 0.011; // the tablet's screen corner radius (metres), which the scene rounds its page and picture to
/** Tablet with well-rounded corners, leaning back on a slim folding aluminium stand: a thin base plate with a lip at the front that holds the
 *  tablet's bottom edge, and a flat strut behind propping it up. */
function tablet() {
  const g = group('tablet');
  const W = 0.2, H = 0.142, lean = 0.32; // landscape, tipped back from upright
  g.add(rbox(0.11, 0.005, 0.1, 0.002, M.alu)); // base plate
  g.add(at(rbox(0.11, 0.013, 0.006, 0.002, M.alu), 0, 0, 0.047)); // front lip
  const up = new THREE.Vector3(0, Math.cos(lean), -Math.sin(lean)), back = new THREE.Vector3(0, -Math.sin(lean), -Math.cos(lean));
  const foot = new THREE.Vector3(0, 0.005, 0.04); // where the tablet's bottom edge rests, against the lip
  const slab = group('slab', slabC(W, H, 0.007, 0.018, M.plastic));
  slab.add(at(slabC(W - 0.006, H - 0.006, 0.002, 0.015, M.bezel), 0, 0, 0.0032));
  const screen = at(slabC(W - 0.012, H - 0.012, 0.002, TABLET_R, M.glass), 0, 0, 0.0045);
  screen.name = 'tabletScreen'; // the scene pins the tablet's desktop (/tablet) onto this (it faces +z; its corners match TABLET_R)
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
  const card = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.0512, 0.0012), [back, back, back, back, M.cardFace, back]);
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
      mat.opacity = 0.08 * Math.sin(Math.PI * l);
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

/** Miniature fireplace (Saleng's fire, brought indoors): a red brick chimney breast with an arched opening, framed by
 *  two cream stone pilasters with bases and capitals, a stone arch with a keystone, and a moulded walnut mantel on
 *  corbels, with a beeswax candle at each end. It stands on a stepped slate hearth. Inside, three little logs sit on an
 *  iron grate. It starts cold; userData.setOn(true) lights it: the flames rise, the coals glow, the candles catch and
 *  a warm, flickering light spills over the desk, each easing in (and dying down again when it's put out). */
function fireplace() {
  const g = group('fireplace');
  T.reseed(23);
  const W = 0.17, H = 0.15, D = 0.075, base = 0.014, a = 0.04, sill = 0.01, arch = 0.045; // a: half the opening's width
  const front = D / 2;
  // Stepped slate hearth: a wide low slab with a narrower step on it
  g.add(at(rbox(W + 0.06, 0.008, D + 0.06, 0.004, M.slate), 0, 0, 0.014));
  g.add(at(rbox(W + 0.03, base - 0.008, D + 0.035, 0.003, M.slate), 0, 0.008, 0.01));
  // Brick breast: a slab with an arch cut through it (straight sides, round top)
  const outer = roundRect(W, H, 0.004);
  const hole = new THREE.Path();
  hole.moveTo(-a, -H / 2 + sill);
  hole.lineTo(a, -H / 2 + sill);
  hole.lineTo(a, -H / 2 + sill + arch);
  hole.absarc(0, -H / 2 + sill + arch, a, 0, Math.PI, false);
  hole.lineTo(-a, -H / 2 + sill);
  outer.holes.push(hole);
  const bev = 0.0015;
  const body = new THREE.Mesh(
    new THREE.ExtrudeGeometry(outer, { depth: D - 2 * bev, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 2, curveSegments: 24 }).center(),
    M.brick,
  );
  body.position.y = base + H / 2;
  g.add(body);
  // Firebox: the same arch as a solid, drawn inside out, so through the opening you see its sooty back and sides
  const box = new THREE.Shape();
  box.moveTo(-a, 0);
  box.lineTo(a, 0);
  box.lineTo(a, arch);
  box.absarc(0, arch, a, 0, Math.PI, false);
  box.lineTo(-a, 0);
  const firebox = new THREE.Mesh(new THREE.ExtrudeGeometry(box, { depth: D - 0.004, bevelEnabled: false, curveSegments: 24 }), M.soot);
  firebox.position.set(0, base + sill, -D / 2 + 0.002);
  g.add(firebox);
  // Stone arch: wedge-shaped blocks fanned round the opening, standing a little proud of the brick, with a taller
  // keystone at the top
  const spring = base + sill + arch, blocks = 9;
  for (let i = 0; i < blocks; i++) {
    const ang = Math.PI * (i / (blocks - 1)), key = i === (blocks - 1) / 2;
    const v = rboxC(0.011, key ? 0.019 : 0.012, 0.006, 0.0012, M.stoneTrim);
    v.position.set(Math.cos(ang) * (a + 0.006), spring + Math.sin(ang) * (a + 0.006) + (key ? 0.003 : 0), front + 0.002);
    v.rotation.z = ang - Math.PI / 2;
    v.scale.x = key ? 1.15 : 1;
    g.add(v);
  }
  for (const s of [-1, 1]) g.add(at(rboxC(0.012, arch, 0.006, 0.0012, M.stoneTrim), s * (a + 0.006), base + sill + arch / 2, front + 0.002)); // jambs
  // Pilasters at the two front corners: a base, a shaft with a sunken panel, and a capital
  for (const s of [-1, 1]) {
    const x = s * (W / 2 - 0.006);
    g.add(at(rbox(0.026, 0.014, 0.016, 0.002, M.stoneTrim), x, base, front - 0.002));
    g.add(at(rbox(0.02, H - 0.03, 0.012, 0.002, M.stoneTrim), x, base + 0.014, front - 0.002));
    g.add(at(rboxC(0.011, H - 0.06, 0.002, 0.001, M.stoneShade), x, base + H / 2, front + 0.0045)); // sunken panel
    g.add(at(rbox(0.026, 0.016, 0.016, 0.002, M.stoneTrim), x, base + H - 0.016, front - 0.002));
  }
  // Mantel: a moulded walnut shelf (a thin bed moulding under a deeper top) resting on two corbels
  const shelf = base + H;
  g.add(at(rbox(W + 0.012, 0.006, D + 0.01, 0.002, M.walnut), 0, shelf, 0.004));
  g.add(at(rbox(W + 0.04, 0.011, D + 0.024, 0.0035, M.walnut), 0, shelf + 0.006, 0.008));
  // Beeswax candles in brass cups at the two ends of the shelf; their flames catch with the fire
  const top = shelf + 0.017;
  const wicks: THREE.Mesh[] = [];
  const candleFlame = glow('#ffc76a', 0.9);
  for (const [x, h] of [[-0.07, 0.03], [0.072, 0.022]]) {
    g.add(at(cyl(0.0085, 0.0095, 0.004, M.brass, 20), x, top, 0.01));
    g.add(at(cyl(0.0065, 0.0065, h, M.wax, 20), x, top + 0.004, 0.01));
    const f = new THREE.Mesh(flameGeo, candleFlame);
    f.position.set(x, top + 0.004 + h + 0.001, 0.01);
    wicks.push(f);
  }
  const candles = group('candles', ...wicks);
  g.add(candles);

  // Grate and logs on the floor of the firebox
  const floor = base + sill;
  for (const z of [-0.012, 0.012]) g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.0022, 0.0022, 0.07, 8).rotateZ(Math.PI / 2), M.iron), 0, floor + 0.006, z));
  for (const x of [-0.028, 0.028]) g.add(at(rbox(0.004, 0.006, 0.034, 0.001, M.iron), x, floor, 0));
  for (const [x, z, ry, rz] of [[0, -0.006, 0.15, 0], [-0.012, 0.008, -0.55, 0.32], [0.013, 0.008, 0.6, -0.32]]) {
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.0075, 0.0085, 0.062, 10).rotateZ(Math.PI / 2), [M.logBark, M.logEnd, M.logEnd]);
    log.position.set(x, floor + 0.015 + (rz ? 0.006 : 0), z);
    log.rotation.set(0, ry, rz);
    g.add(log);
  }
  // Coals under the logs: they glow only while it's lit
  const coalMat = std('#2a1208', { emissive: '#ff5a10', emissiveIntensity: 0, roughness: 1 });
  for (let i = 0; i < 12; i++) {
    const coal = new THREE.Mesh(new THREE.DodecahedronGeometry(0.004 + T.rand() * 0.003, 0), coalMat);
    coal.position.set((T.rand() - 0.5) * 0.06, floor + 0.009, (T.rand() - 0.5) * 0.03);
    coal.rotation.set(T.rand() * 3, T.rand() * 3, 0);
    g.add(coal);
  }

  // Flames: little layered tongues, red outside to a pale core, each flickering on its own rhythm
  const flames = group('flames');
  flames.position.y = floor + 0.012;
  const tongues: { f: THREE.Mesh; R: number; H: number; x0: number; ph: number; sp: number }[] = [];
  for (const L of [
    { color: '#ff4510', op: 0.5, R: 0.016, H: 0.07, n: 5, spread: 0.022 },
    { color: '#ff8622', op: 0.6, R: 0.012, H: 0.055, n: 4, spread: 0.016 },
    { color: '#ffc04a', op: 0.7, R: 0.008, H: 0.038, n: 3, spread: 0.01 },
    { color: '#fff1c4', op: 0.85, R: 0.005, H: 0.022, n: 2, spread: 0.004 },
  ]) {
    const m = glow(L.color, L.op);
    for (let i = 0; i < L.n; i++) {
      const f = new THREE.Mesh(flameGeo, m);
      const x0 = (T.rand() - 0.5) * 2 * L.spread;
      f.position.set(x0, 0, (T.rand() - 0.5) * 0.012);
      flames.add(f);
      tongues.push({ f, R: L.R, H: L.H * (0.8 + T.rand() * 0.4), x0, ph: T.rand() * 10, sp: 5 + T.rand() * 4 });
    }
  }
  g.add(flames);
  const light = new THREE.PointLight('#ff9142', 0, 1.6, 1.3);
  light.position.set(0, floor + 0.04, D / 2 + 0.03);
  g.add(light);

  let lit = 0, want = 0;
  onTick(g, (t) => {
    lit += (want - lit) * 0.04;
    flames.visible = lit > 0.01;
    for (const { f, R, H: h, x0, ph, sp } of tongues) {
      const s = Math.sin(t * sp + ph) * 0.18 + Math.sin(t * 13.7 + ph * 2) * 0.08;
      f.scale.set(R * lit * (1 - s * 0.4), h * lit * (1 + s), R * lit * (1 - s * 0.4));
      f.rotation.z = Math.sin(t * 3.1 + ph) * 0.09;
      f.position.x = x0 + Math.sin(t * 4 + ph) * 0.002;
    }
    const flicker = 1 + Math.sin(t * 11) * 0.08 + Math.sin(t * 6.3) * 0.1 + Math.sin(t * 23) * 0.04;
    coalMat.emissiveIntensity = lit * (1.4 + Math.sin(t * 2.3) * 0.3);
    light.intensity = lit * 2.4 * flicker;
    candles.visible = lit > 0.01;
    wicks.forEach((f, i) => {
      const s = Math.sin(t * 7 + i * 2) * 0.08 + Math.sin(t * 17 + i) * 0.04;
      f.scale.set(0.0032 * lit, 0.013 * lit * (1 + s), 0.0032 * lit);
    });
  });
  g.userData.setOn = (on: boolean) => (want = on ? 1 : 0);
  mergeStill(g, (o) => o === flames || o === candles);
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
 *  on five evenly spaced columns. Back: a figurine behind the printer, the tablet, the laptop, the phone and the miniature fireplace. Front: the printer standing
 *  on a sheet of paper, the business card, the notebook, the mug, and a small succulent with its watering can. */
export function desk() {
  const g = group('desk');
  const top = 0.75, W = 1.9, D = 0.8, TT = 0.035;

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
    [big(figurine(), 1.1), col[0] - 0.16, back - 0.08, 0.2, 'Go Super Saiyan Blue'],
    [printerSet, col[0] - 0.12, front - 0.05, 0.05, 'Print a quote'],
    [big(tablet(), 1.7), col[1] - 0.13, -0.1, 0.2, 'See my work'],
    [big(laptop(), 1.6), col[2], back + 0.01, 0, 'Browse the website'],
    [big(phone(), 1.7), col[3] + 0.05, -0.06, -0.15, 'Open my apps'],
    [big(fireplace(), 1.3), col[4] + 0.1, back - 0.02, -0.3, 'Light the fire'],
    [big(cardStand(), 1.4), col[1], front, 0, 'Take my card'],
    [big(mug(), S), col[2], front, -0.9, 'Take a sip'],
    [big(diary(), S), col[3] + 0.12, front - 0.03, -0.08, 'Read what clients say'],
    [plantSet(), col[4] + 0.03, front, 0, 'Water the plant'],
  ];
  for (const [o, x, z, ry, label] of things) {
    o.position.set(x, top, z);
    o.rotation.y = ry;
    o.userData.hover = true; // the scene lifts it a little under the mouse
    o.userData.label = label; // ...and shows this beside it
    g.add(o);
  }
  mergeStill(g); // the desk itself; the things on it are left whole, since each lifts and outlines on its own
  return g;
}
