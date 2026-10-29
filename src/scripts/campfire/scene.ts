// Campfire scene: a row of figures at night, with idle motion (flames, sparks, smoke, swaying pines).
// Left to right: the fire garden, the desk and the kiosk. The camera opens high in front of the desk, looking down on
// it. Dragging turns the camera around the desk: sideways swings it round to either side (within limits, no full
// orbit), and up and down tilts it a little lower or higher over the desk (never level with it, never overhead).
// Scroll, pinch or the zoom buttons move it in or out from the default distance.
// The laptop shows the live Saleng Labs site, the tablet the work desktop (/tablet), the phone a home screen of apps
// (/phone) and the kiosk its welcome screen (/kiosk), each an iframe pinned onto its screen in 3D; clicking one flies the camera square onto its screen so the page can be scrolled and clicked.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';
import { fireGarden, kiosk, desk, roundRect, type Tick } from './models';

const GARDEN_X = -1.75, KIOSK_X = 1.3; // the desk stands at x = 0, between them
const LOOK = new THREE.Vector3(-0.1, 0.7, -0.04); // the camera circles this point, just above the desktop
const DIST = 3.1; // ...from this far away, at the default zoom
const START = { yaw: 0, pitch: THREE.MathUtils.degToRad(23) }; // opening view: straight on, showing the garden, desk and kiosk
const BASE_FOV = 47.5;
const YAW = THREE.MathUtils.degToRad(40); // how far a sideways drag swings the camera round to either side
const PITCH = { min: THREE.MathUtils.degToRad(18), max: THREE.MathUtils.degToRad(55) }; // how low and high an up-down drag swings it
const ZOOM = { in: 0.4, out: 1.25 }; // fully zoomed in or out, the camera is this many times DIST away
const SITE_W = 1440; // the laptop's website is laid out at this width (a desktop layout), then scaled onto the screen
const TABLET_W = 1200; // ...the tablet's desktop at this width
const PHONE_W = 390; // ...and the phone's home screen at this width
const KIOSK_W = 1080; // ...and the kiosk's portrait screen at this width
const PHONE_R = 0.007; // the phone's screen has rounded corners (metres), so its page and picture do too
const SCREEN_FILL = 0.9; // focused on a screen, it fills this share of the window

export function mountCampfire(
  canvas: HTMLCanvasElement,
  siteUrl: string,
  workUrl: string,
  phoneUrl: string,
  kioskUrl: string,
  onFocus: (focused: boolean) => void,
  onLamp: (on: boolean) => void,
) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#07080a');

  const camera = new THREE.PerspectiveCamera(BASE_FOV, 1, 0.1, 100);

  // A soft studio environment gives glass, metal and glaze something to reflect (no visible background).
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.12;

  // The campfire is the only real light: everything is lit from the fire (no shadows). A faint cool ambient
  // keeps the far sides from going pure black.
  scene.add(new THREE.HemisphereLight('#7f93b0', '#1a120c', 0.18));
  const fireLight = new THREE.PointLight('#ff9142', 9, 0, 1.1);
  scene.add(fireLight);


  const place = (o: THREE.Object3D, x: number, z: number, ry = 0) => {
    o.position.set(x, 0, z);
    o.rotation.y = ry;
    scene.add(o);
    return o;
  };
  // One row, left to right: fire garden, desk, kiosk
  const garden = place(fireGarden(), GARDEN_X, -0.2);
  garden.scale.setScalar(0.7);
  fireLight.position.set(garden.position.x, 0.95, garden.position.z + 0.1); // the glow above the flames, high enough to reach the desktop
  place(desk(), 0, 0);
  place(kiosk(), KIOSK_X, -0.15);

  // Pages on the laptop and the tablet. From the scene, each screen shows a still picture of its page (mipmapped, so it
  // stays crisp when small). Flying onto a screen swaps in the live page: an iframe laid out at a desktop size and
  // pinned onto the glass in 3D, which then takes the pointer and keyboard. Leaving reloads it, so it matches the
  // picture again. The HTML layer sits behind the canvas and each glass is drawn as a see-through hole, so anything
  // standing in front of a screen (the printer, seen from the left) still covers it; once the camera has arrived, the
  // HTML layer comes to the front.
  // The HTML layer works in millimetres (K): at metre scale Chrome hit-tests a tilted page in the wrong place, so
  // clicks on the top of the tablet fell through to the scene.
  const K = 1000;
  const css = new CSS3DRenderer();
  Object.assign(css.domElement.style, { position: 'fixed', inset: '0', pointerEvents: 'none', zIndex: '0' });
  canvas.after(css.domElement);
  const cssScene = new THREE.Scene(), cssCamera = new THREE.PerspectiveCamera();
  const hole = new THREE.MeshBasicMaterial({ color: '#000000', opacity: 0, blending: THREE.NoBlending });
  const stills = new THREE.TextureLoader();
  type Screen = {
    obj: THREE.Object3D; glass: THREE.Mesh; frame: HTMLIFrameElement; holder: THREE.Object3D; still: THREE.Mesh; ready: boolean;
    used: boolean; size: THREE.Vector2; out: THREE.Vector3; up: THREE.Vector3;
  };
  // flat: the glass lies in its x-z plane facing -y (the laptop's lid); otherwise it stands in its x-y plane facing +z.
  // radius: the glass's corner radius in metres (0 for square corners). sheen: lay a pane of glass over the page (a soft
  // reflection and darker edges) so it reads as a lit screen rather than a printed picture.
  const mountScreen = (
    objName: string, glassName: string, url: string, stillUrl: string, title: string, pageW: number, flat: boolean, radius = 0, sheen = false,
  ): Screen => {
    const glass = scene.getObjectByName(glassName) as THREE.Mesh;
    glass.material = hole;
    glass.geometry.computeBoundingBox();
    const box = glass.geometry.boundingBox!.getSize(new THREE.Vector3());
    const size = new THREE.Vector2(box.x, flat ? box.z : box.y);
    const pageH = Math.round((pageW * size.y) / size.x);
    const frame = document.createElement('iframe');
    frame.src = url;
    frame.title = title;
    Object.assign(frame.style, {
      width: `${pageW}px`, height: `${pageH}px`, border: '0', background: '#07080a', pointerEvents: 'none', borderRadius: `${(radius * pageW) / size.x}px`,
    });
    frame.tabIndex = -1;
    frame.inert = true;
    frame.addEventListener('load', () => {
      const win = frame.contentWindow!;
      // Chrome doesn't scroll a page inside a 3D-transformed iframe on the wheel by itself, so scroll the nearest
      // scrollable box under the pointer here (or the page)
      win.addEventListener(
        'wheel',
        (e) => {
          if (e.ctrlKey) return;
          e.preventDefault();
          const dy = e.deltaY * (e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? win.innerHeight : 1);
          for (let el = e.target as Element | null; el && el !== win.document.documentElement; el = el.parentElement) {
            if (/auto|scroll/.test(win.getComputedStyle(el).overflowY) && el.scrollHeight > el.clientHeight) return el.scrollBy(0, dy);
          }
          win.scrollBy(0, dy);
        },
        { passive: false },
      );
      // Esc leaves the screen even while the keyboard is inside the page
      win.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') setFocus(false);
      });
    });
    // Both the page and its picture sit just in front of the glass, in the glass's own frame
    const face = (o: THREE.Object3D, gap: number) => {
      if (flat) {
        o.position.y = -box.y / 2 - gap;
        o.rotation.x = Math.PI / 2;
      } else o.position.z = box.z / 2 + gap;
    };
    const page = new CSS3DObject(frame);
    face(page, 0.0002);
    page.scale.set(size.x / pageW, size.y / pageH, 1);
    const holder = new THREE.Object3D(); // follows the glass each frame, scaled up by K
    holder.matrixAutoUpdate = false;
    holder.add(page);
    cssScene.add(holder);
    const still = new THREE.Mesh(stillShape(size, radius), new THREE.MeshBasicMaterial({ toneMapped: false }));
    face(still, 0.0001);
    still.visible = false;
    glass.add(still);
    if (sheen) {
      const pane = new THREE.Mesh(
        new THREE.PlaneGeometry(size.x, size.y),
        new THREE.MeshBasicMaterial({ map: sheenTexture(), transparent: true, depthWrite: false, toneMapped: false }),
      );
      face(pane, 0.0003);
      glass.add(pane);
      // The lit screen casts a little cool light onto the kiosk around it
      const glow = new THREE.PointLight('#eef2ea', 0.35, 1.4, 1.6);
      glow.position.set(0, 0, box.z / 2 + 0.22);
      glass.add(glow);
    }
    const s: Screen = {
      obj: scene.getObjectByName(objName)!, glass, frame, holder, still, ready: false, used: false, size,
      out: flat ? new THREE.Vector3(0, -1, 0) : new THREE.Vector3(0, 0, 1),
      up: flat ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 1, 0),
    };
    stills.load(stillUrl, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      (still.material as THREE.MeshBasicMaterial).map = tex;
      s.ready = true;
    });
    return s;
  };
  const screens = [
    mountScreen('laptop', 'laptopScreen', siteUrl, '/screens/site.webp', 'Saleng Labs website', SITE_W, true),
    mountScreen('tablet', 'tabletScreen', workUrl, '/screens/tablet.webp', 'Work', TABLET_W, false),
    mountScreen('phone', 'phoneScreen', phoneUrl, '/screens/phone.webp', 'Apps', PHONE_W, false, PHONE_R),
    mountScreen('kiosk', 'kioskScreen', kioskUrl, '/screens/kiosk.webp', 'Kiosk', KIOSK_W, false, 0, true),
  ];
  let target = screens[0]; // the screen the camera flies to, or back from

  const ticks: Tick[] = [];
  scene.traverse((o) => {
    if (o.userData.ticks) ticks.push(...o.userData.ticks);
  });
  const clock = new THREE.Clock();

  // Drag swings the camera round the desk (want.x, -1..1 of YAW) and over it (want.y, -1..1 of the pitch range); it
  // eases toward where the pointer left it. Dragging right turns the desk to the right, like spinning a turntable, and
  // dragging down tips the desk toward you, so you look down on it.
  // Zoom (0 = default view, 1 = closest) eases the same way, and so does focus (0 = the scene, 1 = the target screen).
  const want = new THREE.Vector2(START.yaw / YAW, ((START.pitch - PITCH.min) / (PITCH.max - PITCH.min)) * 2 - 1);
  const now = want.clone();
  let zoomWant = 0, zoomNow = 0, focusWant = 0, focusNow = 0; // zoom: -1 = furthest out, 0 = default, 1 = closest
  const zoomBy = (d: number) => {
    if (!focusWant) zoomWant = THREE.MathUtils.clamp(zoomWant + d, -1, 1);
  };
  const setFocus = (on: boolean, s = target) => {
    if (on === !!focusWant) return;
    if (on) target = s;
    focusWant = on ? 1 : 0;
    if (!on) {
      const { frame } = target;
      frame.style.pointerEvents = 'none';
      frame.inert = true;
      frame.tabIndex = -1;
      css.domElement.style.zIndex = '0';
    }
    canvas.style.cursor = '';
    onFocus(on);
  };

  // A click (a press that barely moves) on the laptop, tablet, phone or kiosk opens it; anywhere else while focused, it closes.
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const over = (e: PointerEvent, o: THREE.Object3D) => {
    ndc.set((e.clientX / canvas.clientWidth) * 2 - 1, -(e.clientY / canvas.clientHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    return ray.intersectObject(o, true).length > 0;
  };
  const screenAt = (e: PointerEvent) => screens.find((s) => over(e, s.obj));
  // Clicking the lamp (or the lamp button) switches it on and off
  const lamp = scene.getObjectByName('lamp')!;
  let lampOn = false;
  const toggleLamp = () => {
    lampOn = !lampOn;
    lamp.userData.setOn(lampOn);
    return lampOn;
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
      if (e.pointerType === 'mouse' && !focusWant) canvas.style.cursor = screenAt(e) || over(e, lamp) ? 'pointer' : '';
      return;
    }
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const s = 2 / Math.min(canvas.clientWidth, canvas.clientHeight); // a full-height drag spans the up-down range
    if (pinch && pointers.size === 2) {
      zoomWant = THREE.MathUtils.clamp(pinch.from + (spread() - pinch.d) * s * 0.75, -1, 1);
    } else if (drag) {
      want.set(
        THREE.MathUtils.clamp(drag.from.x - (e.clientX - drag.x) * s, -1, 1),
        THREE.MathUtils.clamp(drag.from.y + (e.clientY - drag.y) * s, -1, 1),
      );
    }
  });
  const end = (e: PointerEvent) => {
    const click = e.type === 'pointerup' && drag && pointers.size === 1 && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 6;
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch = null;
    drag = null;
    const s = click ? screenAt(e) : undefined;
    if (s) setFocus(true, s);
    else if (click && over(e, lamp)) onLamp(toggleLamp());
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
    fireLight.intensity = 9 + Math.sin(t * 11) * 0.7 + Math.sin(t * 6.3) * 0.9 + Math.sin(t * 23) * 0.35;
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
      const { glass, size } = target;
      glass.getWorldPosition(screenPos);
      glass.getWorldScale(screenScale);
      screenOut.copy(target.out).transformDirection(glass.matrixWorld);
      screenUp.copy(target.up).transformDirection(glass.matrixWorld);
      const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const d = Math.max((size.y * screenScale.x) / 2 / SCREEN_FILL / tan, (size.x * screenScale.x) / 2 / SCREEN_FILL / (tan * camera.aspect));
      focusPos.copy(screenPos).addScaledVector(screenOut, d);
      focusQuat.setFromRotationMatrix(look.lookAt(focusPos, screenPos, screenUp));
      const f = focusNow * focusNow * (3 - 2 * focusNow);
      scenePos.copy(camera.position);
      sceneQuat.copy(camera.quaternion);
      camera.position.lerpVectors(scenePos, focusPos, f);
      camera.quaternion.slerpQuaternions(sceneQuat, focusQuat, f);
    }
    // Once the camera has arrived, the page takes the pointer and keyboard.
    if (focusNow === 1 && target.frame.inert) {
      const { frame } = target;
      css.domElement.style.zIndex = '1';
      target.used = true;
      frame.inert = false;
      frame.tabIndex = 0;
      frame.style.pointerEvents = 'auto';
      frame.focus();
    }

    // Live page only on the screen being flown to; the rest show their pictures. A page that was used is reloaded once
    // the camera is back, so it matches its picture again.
    for (const s of screens) {
      const live = s === target && focusNow > 0.5;
      s.still.visible = s.ready && !live;
      s.frame.style.visibility = focusNow > 0 && s !== target ? 'hidden' : '';
      if (focusNow === 0 && s.used) {
        s.used = false;
        s.frame.contentWindow?.location.reload();
      }
    }

    renderer.render(scene, camera);
    for (const s of screens) {
      s.holder.matrix.makeScale(K, K, K).multiply(s.glass.matrixWorld);
      s.holder.matrixWorldNeedsUpdate = true;
    }
    cssCamera.copy(camera);
    cssCamera.position.multiplyScalar(K);
    cssCamera.near *= K;
    cssCamera.far *= K;
    cssCamera.updateProjectionMatrix();
    cssCamera.updateMatrixWorld();
    css.render(cssScene, cssCamera);
  });

  return { zoomBy, exitFocus: () => setFocus(false), toggleLamp };
}

/** The plane a screen's still picture is drawn on: the glass's size, with its corners rounded to match. */
function stillShape(size: THREE.Vector2, radius: number) {
  if (!radius) return new THREE.PlaneGeometry(size.x, size.y);
  const geo = new THREE.ShapeGeometry(roundRect(size.x, size.y, radius), 8);
  const pos = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / size.x + 0.5, pos.getY(i) / size.y + 0.5);
  return geo;
}

/** A pane of glass for a screen: edges a touch darker than the middle, and a faint diagonal reflection across the top. */
function sheenTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 512;
  const g = c.getContext('2d')!;
  const edge = g.createRadialGradient(128, 230, 60, 128, 256, 330);
  edge.addColorStop(0, 'rgba(0,0,0,0)');
  edge.addColorStop(1, 'rgba(0,0,0,0.22)');
  g.fillStyle = edge;
  g.fillRect(0, 0, 256, 512);
  const shine = g.createLinearGradient(0, 0, 256, 300);
  shine.addColorStop(0, 'rgba(255,255,255,0.16)');
  shine.addColorStop(0.42, 'rgba(255,255,255,0.05)');
  shine.addColorStop(0.43, 'rgba(255,255,255,0)');
  shine.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = shine;
  g.fillRect(0, 0, 256, 512);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
