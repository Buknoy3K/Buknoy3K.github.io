// Campfire scene: the figures, lit by the fire, with idle motion (flames, sparks, smoke, steam, plants).
// The camera sits close, near eye level, and can only be nudged a little side to side and up and down
// by dragging (no orbit). Scroll, pinch or the zoom buttons move it in toward the scene, never further out.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { bonfire, kiosk, desk, stump, smallPlant, bonsai, type Tick } from './models';

const EYE = new THREE.Vector3(0.0, 1.45, 2.35);
const LOOK = new THREE.Vector3(0.0, 0.58, -0.45);
const BASE_FOV = 47.5;
const RANGE = { x: 0.9, y: 0.35 }; // how far a drag can move the camera, in metres
const ZOOM_RANGE = { x: 1.5, y: 0.5 }; // ...and when fully zoomed in, where the view is narrower
const MAX_DOLLY = 0.45; // fully zoomed in, the camera has moved this share of the way to what it looks at

export function mountCampfire(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#07080a');

  const camera = new THREE.PerspectiveCamera(BASE_FOV, 1, 0.1, 100);
  camera.position.copy(EYE);
  camera.lookAt(LOOK);

  // A soft studio environment gives glass, metal and glaze something to reflect (no visible background).
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.32;

  // Night light: dim cool fill, a moon key, a cool rim from behind to lift edges off the black, and the fire.
  scene.add(new THREE.HemisphereLight('#9fb3cc', '#2a1d14', 0.55));
  const moon = new THREE.DirectionalLight('#dfe6ff', 1.1);
  moon.position.set(-4, 6, 3);
  moon.castShadow = true;
  moon.shadow.mapSize.set(2048, 2048);
  moon.shadow.bias = -0.0004;
  moon.shadow.radius = 4;
  Object.assign(moon.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3 });
  scene.add(moon);
  const rim = new THREE.DirectionalLight('#86a2ff', 0.9);
  rim.position.set(1, 3, -5);
  scene.add(rim);
  const fireLight = new THREE.PointLight('#ff9142', 7, 7, 1.5);
  fireLight.castShadow = true;
  fireLight.shadow.bias = -0.002;
  scene.add(fireLight);

  // No visible ground: objects float on black, with only their shadows drawn.
  const shadowCatcher = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.ShadowMaterial({ opacity: 0.45 }));
  shadowCatcher.rotation.x = -Math.PI / 2;
  shadowCatcher.receiveShadow = true;
  scene.add(shadowCatcher);

  const place = (o: THREE.Object3D, x: number, z: number, ry = 0) => {
    o.position.set(x, 0, z);
    o.rotation.y = ry;
    scene.add(o);
    return o;
  };
  // Front row left to right: kiosk, desk, log table, bonsai. Fire behind, jade plant between the desk and log table.
  const fire = place(bonfire(), 0.15, -1.3);
  fireLight.position.set(fire.position.x, 0.52, fire.position.z + 0.2);
  place(kiosk(), -1.47, -0.05);
  place(desk(), -0.62, 0.2, 0.05);
  place(stump(), 0.75, 0.15, -0.15);
  place(bonsai(), 1.34, -0.02);
  place(smallPlant(), 0.08, 0.0, -0.3);

  // Solid surfaces cast and receive shadows; flames, glows and see-through things don't.
  const ticks: Tick[] = [];
  scene.traverse((o) => {
    if (o.userData.ticks) ticks.push(...o.userData.ticks);
    if ((o as THREE.Mesh).isMesh && o !== shadowCatcher) {
      const mats = [(o as THREE.Mesh).material].flat() as THREE.Material[];
      const solid = mats.every((m) => !m.transparent && !(m as THREE.MeshBasicMaterial).isMeshBasicMaterial);
      o.castShadow = solid;
      o.receiveShadow = solid;
    }
  });
  const clock = new THREE.Clock();

  // Drag nudges the camera within a small box; it eases toward where the pointer left it.
  // Zoom (0 = default view, 1 = closest) eases the same way.
  const want = new THREE.Vector2(); // -1..1 on each axis
  const now = new THREE.Vector2();
  let zoomWant = 0, zoomNow = 0;
  const zoomBy = (d: number) => (zoomWant = THREE.MathUtils.clamp(zoomWant + d, 0, 1));
  const pointers = new Map<number, { x: number; y: number }>();
  const spread = () => {
    const [a, b] = [...pointers.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  };
  let drag: { x: number; y: number; from: THREE.Vector2 } | null = null;
  let pinch: { d: number; from: number } | null = null;
  canvas.addEventListener('pointerdown', (e) => {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    canvas.setPointerCapture(e.pointerId);
    if (pointers.size === 2) {
      drag = null;
      pinch = { d: spread(), from: zoomWant };
    } else if (pointers.size === 1) drag = { x: e.clientX, y: e.clientY, from: want.clone() };
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const s = 2 / Math.min(canvas.clientWidth, canvas.clientHeight); // a full-height drag spans the range
    if (pinch && pointers.size === 2) {
      zoomWant = THREE.MathUtils.clamp(pinch.from + (spread() - pinch.d) * s * 0.75, 0, 1);
    } else if (drag) {
      want.set(
        THREE.MathUtils.clamp(drag.from.x - (e.clientX - drag.x) * s, -1, 1),
        THREE.MathUtils.clamp(drag.from.y + (e.clientY - drag.y) * s, -1, 1),
      );
    }
  });
  const end = (e: PointerEvent) => {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch = null;
    drag = null;
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
  canvas.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      zoomBy(-e.deltaY * (e.deltaMode === 1 ? 0.04 : 0.0015));
    },
    { passive: false },
  );

  const resize = () => {
    const { clientWidth: w, clientHeight: h } = canvas;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Keep at least a 16:9 screen's width in view: narrower windows widen the lens instead of cropping the sides.
    const minHalfW = Math.tan(THREE.MathUtils.degToRad(BASE_FOV / 2)) * (16 / 9);
    camera.fov = Math.max(BASE_FOV, THREE.MathUtils.radToDeg(2 * Math.atan(minHalfW / camera.aspect)));
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(canvas);
  resize();

  const aim = new THREE.Vector3();
  renderer.setAnimationLoop(() => {
    const t = clock.getElapsedTime();
    for (const tick of ticks) tick(t);
    fireLight.intensity = 7 + Math.sin(t * 11) * 0.6 + Math.sin(t * 6.3) * 0.8 + Math.sin(t * 23) * 0.3;
    now.lerp(want, 0.08);
    zoomNow += (zoomWant - zoomNow) * 0.08;
    // Zoomed in, the view is narrower, so a drag reaches further to still get to every object.
    const rx = THREE.MathUtils.lerp(RANGE.x, ZOOM_RANGE.x, zoomNow), ry = THREE.MathUtils.lerp(RANGE.y, ZOOM_RANGE.y, zoomNow);
    // The aim follows most of the way, so a drag slides the view toward the edges rather than swinging around the middle.
    aim.set(LOOK.x + now.x * rx * 0.7, LOOK.y + now.y * ry * 0.5, LOOK.z);
    camera.position.set(EYE.x + now.x * rx, EYE.y + now.y * ry, EYE.z).lerp(aim, zoomNow * MAX_DOLLY);
    // Keep the camera level and shift the lens down instead of tilting it (like an architecture photo), so upright
    // things such as the kiosk stay upright anywhere on screen instead of leaning.
    camera.lookAt(aim.x, camera.position.y, aim.z);
    const tilt = (camera.position.y - aim.y) / (camera.position.z - aim.z);
    camera.updateProjectionMatrix();
    camera.projectionMatrix.elements[9] = -tilt / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
    renderer.render(scene, camera);
  });

  return { zoomBy };
}
