// Campfire scene: a row of figures at night, with idle motion (flames, sparks, smoke, swaying pines).
// Left to right: the fire garden, the desk and the kiosk. The camera opens high in front of the desk, looking down on
// it. Dragging turns the camera around the desk: sideways swings it round to either side (within limits, no full
// orbit), and up and down tilts it a little lower or higher over the desk (never level with it, never overhead).
// Scroll, pinch or the zoom buttons move it in or out from the default distance.
// The laptop shows the live Saleng Works site, the tablet the work desktop (/tablet), the phone a home screen of apps
// (/phone) and the kiosk its welcome screen (/kiosk), each an iframe pinned onto its screen in 3D; clicking one flies the camera square onto its screen so the page can be scrolled and clicked.
// The other things on the desk do something when clicked (the mug, the fire, the figure, the plant), or open a card,
// a printed quote or the notebook over the scene (onOpen, given where the thing is on screen to grow from).
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { fireGarden, kiosk, desk, roundRect, type Tick } from './models';

const GARDEN_X = -1.75, KIOSK_X = 1.3; // the desk stands at x = 0, between them
const LOOK = new THREE.Vector3(-0.1, 0.9, -0.04); // the camera circles this point, above the desktop (high, so the scene sits low under the title)
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
  onOpen: (what: 'card' | 'quote' | 'notebook', from: DOMRect) => void,
  onZoom: (zoomedIn: boolean) => void,
) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, stencil: true }); // the stencil keeps outlines to the edges
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
    mountScreen('laptop', 'laptopScreen', siteUrl, '/screens/site.webp', 'Saleng Works website', SITE_W, true),
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

  // Under the mouse, a thing on the desk lifts a little, grows a touch and gets a thin, faint white outline, and the fire
  // flares up; each eases in and out.
  const LIFT = 0.018, GROW = 0.04, FLARE = 0.2;
  const hovers: { o: THREE.Object3D; y: number; s: number; now: number; line?: Outline }[] = [];
  scene.traverse((o) => {
    if (o.userData.hover) hovers.push({ o, y: o.position.y, s: o.scale.x, now: 0, line: o.name === 'fire' ? undefined : outline(o) });
  });
  const fireObj = scene.getObjectByName('fire')!, flames = scene.getObjectByName('flames')!;
  let hovered: THREE.Object3D | null = null;
  let mouse: { x: number; y: number } | null = null, mouseMoved = false; // where the idle mouse is, and whether to pick again
  let overKiosk = false;
  // Beside the mouse, a small label says what clicking the thing under it does
  const tip = document.createElement('div');
  tip.className = 'tip';
  tip.setAttribute('aria-hidden', 'true');
  document.body.append(tip);

  // Clicking the mug brings it up to you for a sip, as if you were holding it, then sets it back down
  const SIP = 3.6;
  const mugObj = scene.getObjectByName('mug')!;
  const mugHome = { pos: mugObj.position.clone(), quat: mugObj.quaternion.clone() };
  let sipAt = -1;
  const steam: THREE.Object3D[] = []; // hidden while sipping: up close its puffs show as squares
  mugObj.traverse((o) => o instanceof THREE.Sprite && steam.push(o));
  const sipPos = new THREE.Vector3(), sipQuat = new THREE.Quaternion(), parentQuat = new THREE.Quaternion(), sipTurn = new THREE.Euler();

  // Drag swings the camera round the desk (want.x, -1..1 of YAW) and over it (want.y, -1..1 of the pitch range); it
  // eases toward where the pointer left it. Dragging right turns the desk to the right, like spinning a turntable, and
  // dragging down tips the desk toward you, so you look down on it.
  // Zoom (0 = default view, 1 = closest) eases the same way, and so does focus (0 = the scene, 1 = the target screen).
  const want = new THREE.Vector2(START.yaw / YAW, ((START.pitch - PITCH.min) / (PITCH.max - PITCH.min)) * 2 - 1);
  const now = want.clone();
  let zoomWant = 0, zoomNow = 0, focusWant = 0, focusNow = 0; // zoom: -1 = furthest out, 0 = default, 1 = closest
  let zoomedIn = false;
  const zoomTo = (z: number) => {
    zoomWant = THREE.MathUtils.clamp(z, -1, 1);
    if (zoomWant > 0.05 !== zoomedIn) onZoom((zoomedIn = !zoomedIn)); // the page clears its title out of the way
  };
  const zoomBy = (d: number) => {
    if (!focusWant) zoomTo(zoomWant + d);
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
  // The hoverable thing whose surface is nearest under the mouse (smoke, sparks and hidden things don't count; anything
  // else in front blocks)
  const pick = (x: number, y: number) => {
    ndc.set((x / canvas.clientWidth) * 2 - 1, -(y / canvas.clientHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    for (const hit of ray.intersectObject(scene, true)) {
      if (hit.object instanceof THREE.Points || hit.object instanceof THREE.Sprite) continue;
      let shown = true;
      hit.object.traverseAncestors((o) => (shown &&= o.visible));
      if (!shown || !hit.object.visible) continue;
      for (let o: THREE.Object3D | null = hit.object; o; o = o.parent) if (o.userData.hover) return o;
      return null;
    }
    return null;
  };
  // Clicking the lamp (or the lamp button) switches it on and off
  const lamp = scene.getObjectByName('lamp')!;
  let lampOn = false;
  const toggleLamp = () => {
    lampOn = !lampOn;
    lamp.userData.setOn(lampOn);
    lamp.userData.label = lampOn ? 'Switch off the lamp' : 'Switch on the lamp';
    return lampOn;
  };
  // Where a thing is on screen, for an overlay to grow out of
  const box = new THREE.Box3(), corner = new THREE.Vector3();
  const rectOf = (o: THREE.Object3D) => {
    box.setFromObject(o);
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (let i = 0; i < 8; i++) {
      corner.set(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z).project(camera);
      const x = ((corner.x + 1) / 2) * canvas.clientWidth, y = ((1 - corner.y) / 2) * canvas.clientHeight;
      [x0, y0, x1, y1] = [Math.min(x0, x), Math.min(y0, y), Math.max(x1, x), Math.max(y1, y)];
    }
    return new DOMRect(x0, y0, x1 - x0, y1 - y0);
  };
  // What clicking each thing does: screens and the lamp are handled before this
  const use = (o: THREE.Object3D) => {
    if (o === mugObj) {
      if (sipAt < 0) sipAt = clock.getElapsedTime();
      return;
    }
    const open = { card: 'card', diary: 'notebook', printerSet: 'quote' } as const;
    const what = open[o.name as keyof typeof open];
    o.userData.play?.();
    if (!what) return;
    mouse = null; // the overlay covers the scene, so nothing is under the mouse any more
    if (what === 'quote') setTimeout(() => onOpen(what, rectOf(o)), 700); // once it has printed
    else onOpen(what, rectOf(o));
  };

  const pointers = new Map<number, { x: number; y: number }>();
  const spread = () => {
    const [a, b] = [...pointers.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  };
  let drag: { x: number; y: number; from: THREE.Vector2 } | null = null;
  let pinch: { d: number; from: number } | null = null;
  canvas.addEventListener('pointerdown', (e) => {
    mouse = null;
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
      if (e.pointerType === 'mouse' && !focusWant) {
        overKiosk = over(e, screens[3].obj);
        mouse = { x: e.clientX, y: e.clientY };
        mouseMoved = true;
      }
      return;
    }
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const s = 2 / Math.min(canvas.clientWidth, canvas.clientHeight); // a full-height drag spans the up-down range
    if (pinch && pointers.size === 2) {
      zoomTo(pinch.from + (spread() - pinch.d) * s * 0.75);
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
    if (!click) return;
    // The thing under the pointer, nearest first; the kiosk isn't one, so it's looked for on its own
    const o = pick(e.clientX, e.clientY);
    const s = o ? screens.find((s) => s.obj === o) : screenAt(e);
    if (s) setFocus(true, s);
    else if (o === lamp) onLamp(toggleLamp());
    else if (o) use(o);
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('pointerleave', () => (mouse = null));
  canvas.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      zoomBy(-e.deltaY * (e.deltaMode === 1 ? 0.04 : 0.0015));
      mouseMoved = true; // the view moves under the mouse
    },
    { passive: false },
  );
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setFocus(false);
  });

  const resize = () => {
    const { clientWidth: w, clientHeight: h } = canvas;
    renderer.setSize(w, h, false);
    renderer.getDrawingBufferSize(outlineRes.value);
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
    // Picked against last frame's view, at most once a frame, and only after the mouse or the zoom moved
    if (!mouse || focusWant) hovered = null;
    else if (mouseMoved) hovered = pick(mouse.x, mouse.y);
    mouseMoved = false;
    const label = mouse ? ((hovered?.userData.label as string | undefined) ?? (overKiosk ? 'Try the kiosk' : '')) : '';
    if (label) tip.textContent = label; // kept while it fades out
    tip.classList.toggle('on', !!label);
    if (mouse) tip.style.transform = `translate(${mouse.x + 16}px, ${mouse.y + 20}px)`;
    canvas.style.cursor = label ? 'pointer' : '';
    let flare = 0;
    const heat = fireObj.userData.heat as number; // roaring up after a click
    for (const h of hovers) {
      const busy = h.o === mugObj && sipAt >= 0;
      h.now += ((h.o === hovered && !busy ? 1 : 0) - h.now) * 0.12;
      h.line?.set(h.now);
      if (busy) continue;
      if (h.o === fireObj) {
        flare = h.now;
        flames.scale.set(1 + flare * FLARE * 0.4 + heat * 0.7, 1 + flare * FLARE + heat * 1.6, 1 + flare * FLARE * 0.4 + heat * 0.7);
      } else {
        h.o.position.y = h.y + h.now * LIFT;
        h.o.scale.setScalar(h.s * (1 + h.now * GROW));
      }
    }
    fireLight.intensity = 9 + flare * 1.8 + heat * 12 + Math.sin(t * 11) * 0.7 + Math.sin(t * 6.3) * 0.9 + Math.sin(t * 23) * 0.35;
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
    camera.updateMatrixWorld();

    if (sipAt >= 0) {
      // Up from the desk to just below your eyes, tipped toward you for the sip, then back down
      const e = t - sipAt, ease = THREE.MathUtils.smoothstep;
      const reach = ease(e, 0, 0.9) * (1 - ease(e, SIP - 0.9, SIP)), tilt = ease(e, 0.8, 1.5) * (1 - ease(e, 2, 2.6));
      sipPos.set(0.015, -0.135 + tilt * 0.035, -0.36 + tilt * 0.04).applyMatrix4(camera.matrixWorld);
      sipQuat.copy(camera.quaternion).multiply(new THREE.Quaternion().setFromEuler(sipTurn.set(0.15 + tilt * 0.75, -0.5, 0)));
      for (const o of steam) o.visible = e >= SIP;
      const parent = mugObj.parent!;
      parent.worldToLocal(sipPos);
      sipQuat.premultiply(parent.getWorldQuaternion(parentQuat).invert());
      mugObj.position.lerpVectors(mugHome.pos, sipPos, reach);
      mugObj.quaternion.slerpQuaternions(mugHome.quat, sipQuat, reach);
      if (e >= SIP) {
        sipAt = -1;
        mugObj.position.copy(mugHome.pos);
        mugObj.quaternion.copy(mugHome.quat);
      }
    }

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

  // The same as clicking the thing with this name: flies onto a screen, or does what the thing does
  const activate = (name: string) => {
    const s = screens.find((s) => s.obj.name === name);
    if (s) return setFocus(true, s);
    const o = scene.getObjectByName(name);
    if (o) use(o);
  };

  return { zoomBy, exitFocus: () => setFocus(false), toggleLamp, activate };
}

// Outlines: each hoverable thing gets a shell of copies of its meshes, pushed out a few pixels along their (smoothed)
// normals on screen and drawn in faint white only where the thing itself didn't mark the stencil, so just its outer edge
// shows, never lines between its own parts. Things in front still cover it.
// The line is several rings of shells, each wider and fainter than the last, so it is brightest at the edge and fades
// out softly. Each ring marks the stencil too, so the next one only adds the band outside it.
const OUTLINE = [
  { px: 1.2, opacity: 0.5 },
  { px: 2.2, opacity: 0.3 },
  { px: 3.3, opacity: 0.16 },
  { px: 4.6, opacity: 0.07 },
];
const outlineRes = { value: new THREE.Vector2(1, 1) }; // the drawing buffer's size in pixels, kept by the scene
const shells = new Map<THREE.BufferGeometry, THREE.BufferGeometry>();
type Outline = { set: (k: number) => void };

/** The geometry with its vertices welded and normals averaged across hard edges, so a pushed-out shell has no gaps. */
function shellGeometry(geo: THREE.BufferGeometry) {
  let s = shells.get(geo);
  if (!s) {
    const bare = new THREE.BufferGeometry();
    bare.setAttribute('position', geo.attributes.position);
    if (geo.index) bare.setIndex(geo.index);
    s = mergeVertices(bare, 1e-4);
    s.computeVertexNormals();
    s.computeBoundingSphere();
    const { x, y, z } = s.boundingSphere!.center, n = s.attributes.position.count;
    s.setAttribute('centre', new THREE.BufferAttribute(new Float32Array(n * 3).map((_, i) => [x, y, z][i % 3]), 3));
    shells.set(geo, s);
  }
  return s;
}

/** Outlines a hoverable thing; set(k) fades it in (1) or out (0). Its materials become its own copies, so marking the
 *  stencil only while it's outlined doesn't touch other things. Glowing ones (embers, the lamp's shade, LEDs, screen
 *  pictures) stay shared, since the scene animates them, and mark the stencil all the time. */
function outline(root: THREE.Object3D): Outline {
  const mats = OUTLINE.map(({ px }) => new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color('#ffffff') }, uOpacity: { value: 0 }, uRes: outlineRes, uWidth: { value: px * Math.min(devicePixelRatio, 2) } },
    vertexShader: `
      uniform vec2 uRes;
      uniform float uWidth;
      attribute vec3 centre;
      vec2 unit(vec2 v) { float l = length(v); return l > 1e-5 ? v / l : vec2(0.0); }
      void main() {
        vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        vec4 mid = projectionMatrix * modelViewMatrix * vec4(centre, 1.0);
        // Out along the normal on screen and away from the piece's middle: the second also outlines flat sheets
        vec2 dir = unit(unit((normalMatrix * normal).xy) + unit(clip.xy / clip.w - mid.xy / mid.w));
        clip.xy += dir * uWidth * 2.0 / uRes * clip.w;
        gl_Position = clip;
      }`,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uOpacity;
      void main() {
        gl_FragColor = vec4(uColor, uOpacity);
        #include <colorspace_fragment>
      }`,
    transparent: true,
    depthWrite: false,
    stencilWrite: true,
    stencilRef: 1,
    stencilFunc: THREE.NotEqualStencilFunc,
    stencilZPass: THREE.ReplaceStencilOp,
  }));
  const marking = (m: THREE.Material) => {
    m.stencilRef = 1;
    m.stencilZPass = THREE.ReplaceStencilOp;
    return m;
  };
  const own = new Map<THREE.Material, THREE.Material>();
  const copy = (m: THREE.Material) => {
    if (!(m instanceof THREE.MeshStandardMaterial) || m.emissiveMap || m.emissive.getHex() !== 0) {
      m.stencilWrite = true;
      return marking(m);
    }
    let c = own.get(m);
    if (!c) own.set(m, (c = marking(m.clone())));
    return c;
  };
  const meshes: THREE.Mesh[] = [];
  root.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) meshes.push(o as THREE.Mesh);
  });
  const shellsOf: THREE.Mesh[] = [];
  for (const mesh of meshes) {
    const glows = [mesh.material].flat().every((m) => m.transparent && !m.depthWrite); // flames, steam: no edge of their own
    mesh.material = Array.isArray(mesh.material) ? mesh.material.map(copy) : copy(mesh.material);
    if (glows) continue;
    mats.forEach((mat, i) => {
      const shell = new THREE.Mesh(shellGeometry(mesh.geometry), mat);
      shell.renderOrder = 10 + i; // inner rings first
      shell.raycast = () => {};
      shell.visible = false;
      mesh.add(shell);
      shellsOf.push(shell);
    });
  }
  let on = false;
  return {
    set(k) {
      mats.forEach((m, i) => (m.uniforms.uOpacity.value = k * OUTLINE[i].opacity));
      const now = k > 0.01;
      if (now === on) return;
      on = now;
      for (const s of shellsOf) s.visible = on;
      for (const m of own.values()) m.stencilWrite = on;
    },
  };
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
