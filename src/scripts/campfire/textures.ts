// Surface textures for the campfire scene, drawn on canvases at load (no image files).
import * as THREE from 'three';

let seed = 1;
/** Seeded random, so the scene looks the same on every load. */
export const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
export const reseed = (s: number) => {
  seed = s;
};

function make(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, srgb = true) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

const cache = new Map<string, THREE.Texture>();
function once(key: string, build: () => THREE.Texture) {
  if (!cache.has(key)) cache.set(key, build());
  return cache.get(key)!;
}

/** Wavy long grain, running along the texture's width. */
export const wood = (base: string, grain: string) =>
  once(`wood${base}`, () =>
    make(1024, 512, (g) => {
      reseed(3);
      g.fillStyle = base;
      g.fillRect(0, 0, 1024, 512);
      for (let i = 0; i < 260; i++) {
        const y0 = rand() * 512, amp = 2 + rand() * 6, f = 0.004 + rand() * 0.01, ph = rand() * 6;
        g.strokeStyle = grain;
        g.globalAlpha = 0.04 + rand() * 0.18;
        g.lineWidth = 0.6 + rand() * 2.2;
        g.beginPath();
        for (let x = 0; x <= 1024; x += 16) {
          const y = y0 + Math.sin(x * f + ph) * amp;
          if (x) g.lineTo(x, y);
          else g.moveTo(x, y);
        }
        g.stroke();
      }
    }),
  );

/** The same grain turned to run vertically, for upright boards. */
export const woodV = (base: string, grain: string) =>
  once(`woodV${base}`, () => {
    const t = wood(base, grain).clone();
    t.center.set(0.5, 0.5);
    t.rotation = Math.PI / 2;
    t.needsUpdate = true;
    return t;
  });

function ringLines(g: CanvasRenderingContext2D, c: number, max: number, colors: string[]) {
  for (let r = 4; r < max; r += 3 + rand() * 5) {
    g.strokeStyle = colors[Math.floor(rand() * colors.length)];
    g.globalAlpha = 0.25 + rand() * 0.4;
    g.lineWidth = 0.8 + rand() * 1.8;
    g.beginPath();
    for (let a = 0; a <= 64; a++) {
      const th = (a / 64) * Math.PI * 2;
      const rr = r + Math.sin(th * 3 + r) * 1.5 * (r / 100);
      if (a) g.lineTo(c + Math.cos(th) * rr, c + Math.sin(th) * rr);
      else g.moveTo(c + Math.cos(th) * rr, c + Math.sin(th) * rr);
    }
    g.stroke();
  }
  g.globalAlpha = 1;
}

/** Tree rings for the log table's top: weathered wood darkening toward a reddish inner-bark band, then a rough rim
 *  in the same colours as the bark() on the sides, and a few drying cracks. */
export const rings = () =>
  once('rings', () =>
    make(512, 512, (g) => {
      reseed(5);
      const wood = g.createRadialGradient(256, 256, 0, 256, 256, 236);
      wood.addColorStop(0, '#b8915c');
      wood.addColorStop(0.75, '#ad8653');
      wood.addColorStop(1, '#8c663c');
      g.fillStyle = wood;
      g.fillRect(0, 0, 512, 512);
      ringLines(g, 256, 230, ['#93683f', '#7e5634', '#a07448']);
      // Inner bark: a thin reddish band, then the bark rim, which is uneven and streaked like the sides
      g.globalAlpha = 1;
      g.lineWidth = 6;
      g.strokeStyle = '#7c5228';
      g.beginPath();
      g.arc(256, 256, 233, 0, Math.PI * 2);
      g.stroke();
      g.fillStyle = '#5c4026';
      g.beginPath();
      g.arc(256, 256, 256, 0, Math.PI * 2);
      for (let a = 0; a <= 180; a++) {
        const th = (a / 180) * Math.PI * 2, r = 236 + Math.sin(th * 7) * 2 + Math.sin(th * 19 + 1) * 1.5;
        if (a) g.lineTo(256 + Math.cos(-th) * r, 256 + Math.sin(-th) * r);
        else g.moveTo(256 + r, 256);
      }
      g.fill('evenodd');
      for (let i = 0; i < 900; i++) {
        const th = rand() * Math.PI * 2, r0 = 236 + rand() * 20, l = 3 + rand() * 9;
        g.strokeStyle = rand() < 0.5 ? '#3a2816' : '#7a5a34';
        g.globalAlpha = 0.3 + rand() * 0.5;
        g.lineWidth = 1 + rand() * 2.5;
        g.beginPath();
        g.moveTo(256 + Math.cos(th) * r0, 256 + Math.sin(th) * r0);
        g.lineTo(256 + Math.cos(th) * (r0 + l), 256 + Math.sin(th) * (r0 + l));
        g.stroke();
      }
      g.globalAlpha = 1;
      g.strokeStyle = '#5a3a24';
      g.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        const a = rand() * Math.PI * 2, r = 80 + rand() * 90;
        g.beginPath();
        g.moveTo(256 + Math.cos(a) * 18, 256 + Math.sin(a) * 18);
        g.lineTo(256 + Math.cos(a + 0.08) * r, 256 + Math.sin(a + 0.08) * r);
        g.stroke();
      }
    }),
  );

/** Cut log end: rings with a charred rim. */
export const endGrain = () =>
  once('end', () =>
    make(256, 256, (g) => {
      reseed(7);
      g.fillStyle = '#b98c5c';
      g.fillRect(0, 0, 256, 256);
      ringLines(g, 128, 112, ['#8d6440', '#7a5434']);
      g.lineWidth = 16;
      g.strokeStyle = '#1c120c';
      g.beginPath();
      g.arc(128, 128, 120, 0, Math.PI * 2);
      g.stroke();
    }),
  );

/** Bark: dark vertical furrows. */
export const bark = () =>
  once('bark', () => {
    const t = make(512, 512, (g) => {
      reseed(9);
      g.fillStyle = '#4b3222';
      g.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 420; i++) {
        const x = rand() * 512, w = 1 + rand() * 5, y = rand() * 512, h = 30 + rand() * 200;
        g.fillStyle = rand() < 0.5 ? '#2e1e14' : '#6a4a32';
        g.globalAlpha = 0.3 + rand() * 0.5;
        g.fillRect(x, y, w, h);
        g.fillRect(x, y - 512, w, h);
      }
    });
    t.repeat.set(3, 1);
    return t;
  });

/** Fire pit ground: scorched in the middle, packed earth outward, with grit. */
export const dirt = () =>
  once('dirt', () =>
    make(512, 512, (g) => {
      reseed(13);
      const grd = g.createRadialGradient(256, 256, 20, 256, 256, 256);
      grd.addColorStop(0, '#15100d');
      grd.addColorStop(0.45, '#35271c');
      grd.addColorStop(1, '#4a3726');
      g.fillStyle = grd;
      g.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 3500; i++) {
        g.fillStyle = rand() < 0.5 ? '#22180f' : '#76604a';
        g.globalAlpha = 0.3 + rand() * 0.5;
        const s = rand() * 2.5 + 0.5;
        g.fillRect(rand() * 512, rand() * 512, s, s);
      }
    }),
  );

/** Soft round dot, for sparks and steam. */
export const soft = () =>
  once('soft', () =>
    make(128, 128, (g) => {
      const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      grd.addColorStop(0, 'rgba(255,255,255,1)');
      grd.addColorStop(0.35, 'rgba(255,255,255,0.55)');
      grd.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = grd;
      g.fillRect(0, 0, 128, 128);
    }),
  );

/** Lumpy smoke puff. */
export const puff = () =>
  once('puff', () =>
    make(256, 256, (g) => {
      reseed(17);
      for (let i = 0; i < 14; i++) {
        const a = rand() * Math.PI * 2, d = rand() * 50;
        const x = 128 + Math.cos(a) * d, y = 128 + Math.sin(a) * d, r = 40 + rand() * 50;
        const grd = g.createRadialGradient(x, y, 0, x, y, r);
        grd.addColorStop(0, 'rgba(255,255,255,0.35)');
        grd.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = grd;
        g.fillRect(0, 0, 256, 256);
      }
    }),
  );

/** Receipt paper with faint printed rows. */
export const receipt = () =>
  once('receipt', () =>
    make(128, 512, (g) => {
      reseed(19);
      g.fillStyle = '#f6f3ec';
      g.fillRect(0, 0, 128, 512);
      g.fillStyle = '#b9b4aa';
      for (let y = 40; y < 480; y += 18) {
        g.fillRect(14, y, 30 + rand() * 50, 5);
        if (rand() < 0.6) g.fillRect(94, y, 20, 5);
      }
    }),
  );

/** Business card front. */
export const cardFace = () =>
  once('card', () =>
    make(512, 320, (g) => {
      g.fillStyle = '#17191c';
      g.fillRect(0, 0, 512, 320);
      g.fillStyle = '#3ecf8e';
      g.beginPath();
      g.roundRect(40, 40, 44, 44, 10);
      g.fill();
      g.fillStyle = '#0e2a1d';
      g.font = '700 30px Inter, system-ui, sans-serif';
      g.fillText('S', 52, 73);
      g.fillStyle = '#f2f2f2';
      g.font = '600 40px Inter, system-ui, sans-serif';
      g.fillText('Saleng Labs', 40, 224);
      g.fillStyle = '#9aa0a6';
      g.font = '400 22px Inter, system-ui, sans-serif';
      g.fillText('Wayne V. Banase', 40, 262);
      g.fillStyle = '#3ecf8e';
      g.fillRect(0, 310, 512, 10);
    }),
  );

/** Speaker grille dots, on a transparent background. */
export const grille = () =>
  once('grille', () =>
    make(256, 48, (g) => {
      g.fillStyle = '#7d8187';
      for (let y = 8; y < 48; y += 10) for (let x = 8; x < 256; x += 10) g.fillRect(x, y, 4, 4);
    }),
  );

/** Small wordmark, on a transparent background. */
export const wordmark = () =>
  once('wordmark', () =>
    make(512, 96, (g) => {
      g.fillStyle = '#8b8f96';
      g.font = '600 44px Inter, system-ui, sans-serif';
      g.textAlign = 'center';
      g.fillText('Saleng Labs', 256, 62);
    }),
  );
