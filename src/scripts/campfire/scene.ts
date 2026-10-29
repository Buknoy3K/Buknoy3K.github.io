// Campfire scene: a row of figures at night, with idle motion (flames, sparks, smoke, swaying pines).
// Left to right: the fire garden, the desk and the kiosk. The camera opens high in front of the desk, looking down on
// it. Dragging turns the camera around the desk: sideways swings it round to either side (within limits, no full
// orbit), and up and down tilts it a little lower or higher over the desk (never level with it, never overhead).
// Scroll, pinch or the zoom buttons move it in or out from the default distance.
// The laptop shows the live Saleng Labs site (an iframe pinned onto its screen in 3D); clicking the laptop flies the
// camera square onto the screen so the site can be scrolled and clicked.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';
import { fireGarden, kiosk, desk, type Tick } from './models';

const GARDEN_X = -1.75, KIOSK_X = 1.3; // the desk stands at x = 0, between them
const LOOK = new THREE.Vector3(0.0, 0.86, -0.04); // the camera circles this point, a little above the desktop
const DIST = 2.2; // ...from this far away, at the default zoom
const START = { yaw: THREE.MathUtils.degToRad(-14), pitch: THREE.MathUtils.degToRad(31) }; // opening view: a little from the desk's left
const BASE_FOV = 47.5;
const YAW = THREE.MathUtils.degToRad(40); // how far a sideways drag swings the camera round to either side
const PITCH = { min: THREE.MathUtils.degToRad(24), max: THREE.MathUtils.degToRad(55) }; // how low and high an up-down drag swings it
const ZOOM = { in: 0.5, out: 1.3 }; // fully zoomed in or out, the camera is this many times DIST away
const SITE_W = 1440; // the laptop's website is laid out at this width (a desktop layout), then scaled onto the screen
const SCREEN_FILL = 0.9; // focused on the laptop, its screen fills this share of the window

export function mountCampfire(canvas: HTMLCanvasElement, siteUrl: string, onFocus: (focused: boolean) => void) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#07080a');

  const camera = new THREE.PerspectiveCamera(BASE_FOV, 1, 0.1, 100);

  // A soft studio environment gives glass, metal and glaze something to reflect (no visible background).
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.32;

  // Night light: dim cool fill, a moon key, a cool rim from behind to lift edges off the black, and the fire.
  scene.add(new THREE.HemisphereLight('#9fb3cc', '#2a1d14', 0.55));
  const moon = new THREE.DirectionalLight('#dfe6ff', 1.1);
  // Aimed at the middle of the row, with a shadow box wide enough for all of it
  moon.position.set(KIOSK_X / 2 - 4, 6, 3);
  moon.target.position.set(KIOSK_X / 2, 0, 0);
  scene.add(moon.target);
  moon.castShadow = true;
  moon.shadow.mapSize.set(2048, 2048);
  moon.shadow.bias = -0.0004;
  moon.shadow.radius = 4;
  Object.assign(moon.shadow.camera, { left: -3.5, right: 3.5, top: 3.5, bottom: -3.5 });
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
  // One row, left to right: fire garden, desk, kiosk
  const garden = place(fireGarden(), GARDEN_X, -0.2);
  garden.scale.setScalar(0.7);
  fireLight.position.set(garden.position.x, 0.3, garden.position.z + 0.1);
  place(desk(), 0, 0);
  place(kiosk(), KIOSK_X, -0.15);

  // Live website on the laptop: an HTML layer over the canvas, drawn with the same camera. Nothing stands in front of
  // the laptop screen from any camera position, so it needs no occlusion by the 3D scene.
  const laptop = scene.getObjectByName('laptop')!;
  const screen = scene.getObjectByName('laptopScreen') as THREE.Mesh;
  screen.geometry.computeBoundingBox();
  const glass = screen.geometry.boundingBox!.getSize(new THREE.Vector3()); // x = width, z = height, in lid space
  const siteH = Math.round((SITE_W * glass.z) / glass.x);
  const frame = document.createElement('iframe');
  frame.src = siteUrl;
  frame.title = 'Saleng Labs website';
  Object.assign(frame.style, { width: `${SITE_W}px`, height: `${siteH}px`, border: '0', background: '#07080a', pointerEvents: 'none' });
  frame.tabIndex = -1;
  frame.inert = true;
  frame.addEventListener('load', () => {
    const win = frame.contentWindow!;
    // Chrome doesn't scroll a page inside a 3D-transformed iframe on the wheel by itself, so scroll it here
    win.addEventListener(
      'wheel',
      (e) => {
        if (e.ctrlKey) return;
        e.preventDefault();
        win.scrollBy(0, e.deltaY * (e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? win.innerHeight : 1));
      },
      { passive: false },
    );
    // Esc leaves the laptop even while the keyboard is inside the site
    win.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setFocus(false);
    });
  });
  const site = new CSS3DObject(frame);
  site.position.y = -0.0012; // just in front of the glass, which faces -y
  site.rotation.x = Math.PI / 2;
  site.scale.set(glass.x / SITE_W, glass.z / siteH, 1);
  screen.add(site);
  const css = new CSS3DRenderer();
  Object.assign(css.domElement.style, { position: 'fixed', inset: '0', pointerEvents: 'none' });
  canvas.after(css.domElement);

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

  // Drag swings the camera round the desk (want.x, -1..1 of YAW) and over it (want.y, -1..1 of the pitch range); it
  // eases toward where the pointer left it. Dragging right turns the desk to the right, like spinning a turntable.
  // Zoom (0 = default view, 1 = closest) eases the same way, and so does focus (0 = the scene, 1 = the laptop screen).
  const want = new THREE.Vector2(START.yaw / YAW, ((START.pitch - PITCH.min) / (PITCH.max - PITCH.min)) * 2 - 1);
  const now = want.clone();
  let zoomWant = 0, zoomNow = 0, focusWant = 0, focusNow = 0; // zoom: -1 = furthest out, 0 = default, 1 = closest
  const zoomBy = (d: number) => {
    if (!focusWant) zoomWant = THREE.MathUtils.clamp(zoomWant + d, -1, 1);
  };
  const setFocus = (on: boolean) => {
    if (on === !!focusWant) return;
    focusWant = on ? 1 : 0;
    if (!on) {
      frame.style.pointerEvents = 'none';
      frame.inert = true;
      frame.tabIndex = -1;
    }
    canvas.style.cursor = '';
    onFocus(on);
  };

  // A click (a press that barely moves) on the laptop opens it; anywhere else while focused, it closes.
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const overLaptop = (e: PointerEvent) => {
    ndc.set((e.clientX / canvas.clientWidth) * 2 - 1, -(e.clientY / canvas.clientHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    return ray.intersectObject(laptop, true).length > 0;
  };

  const pointers = new Map<number, { x: number; y: number }>();
  const spread = () => {
    const [a, b] = [...pointers.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  };
  let drag: { x: number; y: number; from: THREE.Vector2 } | null = null;
  let pinch: { d: number; from: number } | null = null;
  canvas.addEventListener('pointerdown', (e) => {
    if (focusWant) return setFocus(false);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    canvas.setPointerCapture(e.pointerId);
    if (pointers.size === 2) {
      drag = null;
      pinch = { d: spread(), from: zoomWant };
    } else if (pointers.size === 1) drag = { x: e.clientX, y: e.clientY, from: want.clone() };
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!pointers.has(e.pointerId)) {
      if (e.pointerType === 'mouse' && !focusWant) canvas.style.cursor = overLaptop(e) ? 'pointer' : '';
      return;
    }
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const s = 2 / Math.min(canvas.clientWidth, canvas.clientHeight); // a full-height drag spans the up-down range
    if (pinch && pointers.size === 2) {
      zoomWant = THREE.MathUtils.clamp(pinch.from + (spread() - pinch.d) * s * 0.75, -1, 1);
    } else if (drag) {
      want.set(
        THREE.MathUtils.clamp(drag.from.x - (e.clientX - drag.x) * s, -1, 1),
        THREE.MathUtils.clamp(drag.from.y - (e.clientY - drag.y) * s, -1, 1),
      );
    }
  });
  const end = (e: PointerEvent) => {
    const click = e.type === 'pointerup' && drag && pointers.size === 1 && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 6;
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch = null;
    drag = null;
    if (click && overLaptop(e)) setFocus(true);
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
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setFocus(false);
  });

  const resize = () => {
    const { clientWidth: w, clientHeight: h } = canvas;
    renderer.setSize(w, h, false);
    css.setSize(w, h);
    camera.aspect = w / h;
    // Keep at least a 16:9 screen's width in view: narrower windows widen the lens instead of cropping the sides.
    const minHalfW = Math.tan(THREE.MathUtils.degToRad(BASE_FOV / 2)) * (16 / 9);
    camera.fov = Math.max(BASE_FOV, THREE.MathUtils.radToDeg(2 * Math.atan(minHalfW / camera.aspect)));
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(canvas);
  resize();

  const aim = new THREE.Vector3();
  const scenePos = new THREE.Vector3(), sceneQuat = new THREE.Quaternion();
  const screenPos = new THREE.Vector3(), screenOut = new THREE.Vector3(), screenUp = new THREE.Vector3(), screenScale = new THREE.Vector3();
  const focusPos = new THREE.Vector3(), focusQuat = new THREE.Quaternion(), look = new THREE.Matrix4();
  renderer.setAnimationLoop(() => {
    const t = clock.getElapsedTime();
    for (const tick of ticks) tick(t);
    fireLight.intensity = 7 + Math.sin(t * 11) * 0.6 + Math.sin(t * 6.3) * 0.8 + Math.sin(t * 23) * 0.3;
    now.lerp(want, 0.08);
    zoomNow += (zoomWant - zoomNow) * 0.08;
    focusNow += (focusWant - focusNow) * 0.07;
    if (Math.abs(focusWant - focusNow) < 0.001) focusNow = focusWant;
    // The camera sits on a sphere around the middle of the desk: turned round by now.x, and raised or lowered from the
    // lowest angle (now.y = -1) to the highest (now.y = 1).
    aim.copy(LOOK);
    const yaw = now.x * YAW;
    const pitch = THREE.MathUtils.lerp(PITCH.min, PITCH.max, (now.y + 1) / 2);
    const dist = DIST * (zoomNow < 0 ? THREE.MathUtils.lerp(1, ZOOM.out, -zoomNow) : THREE.MathUtils.lerp(1, ZOOM.in, zoomNow));
    camera.position.set(
      aim.x + Math.cos(pitch) * Math.sin(yaw) * dist,
      aim.y + Math.sin(pitch) * dist,
      aim.z + Math.cos(pitch) * Math.cos(yaw) * dist,
    );
    camera.lookAt(aim);

    if (focusNow > 0) {
      // Focused pose: straight out from the middle of the screen, far enough that it fills SCREEN_FILL of the window.
      // The flight blends position and turn together, easing in and out.
      screen.getWorldPosition(screenPos);
      screen.getWorldScale(screenScale);
      screenOut.set(0, -1, 0).transformDirection(screen.matrixWorld);
      screenUp.set(0, 0, 1).transformDirection(screen.matrixWorld);
      const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const d = Math.max((glass.z * screenScale.z) / 2 / SCREEN_FILL / tan, (glass.x * screenScale.x) / 2 / SCREEN_FILL / (tan * camera.aspect));
      focusPos.copy(screenPos).addScaledVector(screenOut, d);
      focusQuat.setFromRotationMatrix(look.lookAt(focusPos, screenPos, screenUp));
      const f = focusNow * focusNow * (3 - 2 * focusNow);
      scenePos.copy(camera.position);
      sceneQuat.copy(camera.quaternion);
      camera.position.lerpVectors(scenePos, focusPos, f);
      camera.quaternion.slerpQuaternions(sceneQuat, focusQuat, f);
    }
    // Once the camera has arrived, the site takes the pointer and keyboard.
    if (focusNow === 1 && frame.inert) {
      frame.inert = false;
      frame.tabIndex = 0;
      frame.style.pointerEvents = 'auto';
      frame.focus();
    }

    renderer.render(scene, camera);
    css.render(scene, camera);
  });

  return { zoomBy, exitFocus: () => setFocus(false) };
}
