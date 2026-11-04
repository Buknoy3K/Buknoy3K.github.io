// Surface textures for the campfire scene, drawn on canvases at load (no image files).
import * as THREE from 'three';
import { brand, founder } from '../../config/site';
import { CARD_ICONS } from '../../lib/card-icons';

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

/** Running-bond bricks for the miniature fireplace: 4 bricks across and 8 courses down in each tile, every brick a
 *  slightly different red, between pale mortar lines. One tile covers 10 cm of wall (repeat 10 per metre). */
const BRICK = { across: 4, rows: 8, mortar: 6 };
export const brick = () =>
  once('brick', () => {
    const t = make(512, 512, (g) => {
      reseed(29);
      g.fillStyle = '#cbbfae';
      g.fillRect(0, 0, 512, 512);
      const reds = ['#9c4a32', '#a8573b', '#8a3f2b', '#b5633f', '#7d3a28', '#a14d36'];
      eachBrick((x, y, w, h) => {
        g.fillStyle = reds[Math.floor(rand() * reds.length)];
        g.fillRect(x, y, w, h);
        for (let i = 0; i < 40; i++) {
          g.fillStyle = rand() < 0.5 ? 'rgba(0,0,0,0.08)' : 'rgba(255,220,190,0.07)';
          g.fillRect(x + rand() * w, y + rand() * h, 2 + rand() * 6, 2 + rand() * 4);
        }
      });
    });
    t.repeat.set(10, 10);
    return t;
  });
/** Height map for the bricks: the mortar sunk below the brick faces, which are a little uneven. */
export const brickBump = () =>
  once('brickBump', () => {
    const t = make(
      512,
      512,
      (g) => {
        reseed(31);
        g.fillStyle = '#000';
        g.fillRect(0, 0, 512, 512);
        eachBrick((x, y, w, h) => {
          const v = 200 + Math.floor(rand() * 40);
          g.fillStyle = `rgb(${v},${v},${v})`;
          g.fillRect(x, y, w, h);
        });
      },
      false,
    );
    t.repeat.set(10, 10);
    return t;
  });
function eachBrick(draw: (x: number, y: number, w: number, h: number) => void) {
  const bw = 512 / BRICK.across, bh = 512 / BRICK.rows, m = BRICK.mortar;
  for (let r = 0; r < BRICK.rows; r++) {
    const off = r % 2 ? bw / 2 : 0;
    for (let c = -1; c <= BRICK.across; c++) draw(c * bw + off + m / 2, r * bh + m / 2, bw - m, bh - m);
  }
}

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
/** The Saleng Works campfire mark's outlines (in its 512 box): a flame with a hollow core, and two crossed logs. */
const MARK = {
  flame: 'M262 76c22 58 92 104 92 190c0 58-42 98-98 98s-98-40-98-96c0-40 20-70 46-90c-2 30 10 52 32 62c-16-54 0-112 26-164zM256 230c-22 32-40 52-40 82c0 22 18 38 40 38s40-16 40-38c0-30-18-50-40-82z',
  logs: ['M146 432L366 378', 'M146 378L366 432'],
};

/** The calling card's front, as in the card overlay (Sheets.astro): the mark, name and tagline on the left, a hairline,
 *  then the founder's name, role and contact lines with green icons. Drawn again once the card's fonts have loaded. */
export const cardFace = () =>
  once('card', () => {
    const W = 1024, H = Math.round((1024 * 410) / 680), green = '#3ecf8e';
    const draw = (g: CanvasRenderingContext2D) => {
      g.fillStyle = '#0b1210';
      g.fillRect(0, 0, W, H);
      g.strokeStyle = 'rgba(62,207,142,0.25)';
      g.lineWidth = 2;
      g.beginPath();
      g.roundRect(22, 22, W - 44, H - 44, 12);
      g.stroke();
      // Left: the campfire mark, as in public/brand/saleng-works-mark.svg, over the name and tagline
      const cx = W * 0.2;
      g.save();
      g.translate(cx - 140, 52);
      g.scale(280 / 512, 280 / 512);
      g.fillStyle = g.strokeStyle = green;
      g.fill(new Path2D(MARK.flame), 'evenodd');
      g.lineWidth = 28;
      g.lineCap = 'round';
      for (const log of MARK.logs) g.stroke(new Path2D(log));
      g.restore();
      g.textAlign = 'center';
      g.letterSpacing = '4px';
      g.fillStyle = '#ece9e3';
      g.font = '600 28px "Red Hat Text", system-ui, sans-serif';
      g.fillText(brand.name.toUpperCase(), cx, 352);
      g.fillStyle = green;
      g.font = '500 20px "Red Hat Text", system-ui, sans-serif';
      g.fillText('SYSTEMS AND', cx, 395);
      g.fillText('AUTOMATION', cx, 424);
      // Hairline
      const rule = g.createLinearGradient(0, 60, 0, H - 60);
      rule.addColorStop(0, 'rgba(255,255,255,0)');
      rule.addColorStop(0.2, 'rgba(255,255,255,0.12)');
      rule.addColorStop(0.8, 'rgba(255,255,255,0.12)');
      rule.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = rule;
      g.fillRect(W * 0.4, 60, 2, H - 120);
      // Right: the founder, the role and the contact lines
      const x = W * 0.44;
      g.textAlign = 'left';
      g.letterSpacing = '0px';
      g.fillStyle = '#f1ece4';
      g.font = '400 62px "Instrument Serif", Georgia, serif';
      g.fillText(founder.name, x, 175);
      g.letterSpacing = '4px';
      g.fillStyle = '#8fa39a';
      g.font = '600 22px "Red Hat Text", system-ui, sans-serif';
      g.fillText(founder.role.split(' · ')[0].toUpperCase(), x, 222);
      g.letterSpacing = '0px';
      g.font = '500 32px "Red Hat Text", system-ui, sans-serif';
      ([[CARD_ICONS.phone, brand.phone], [CARD_ICONS.mail, brand.email], [CARD_ICONS.globe, brand.website]] as const).forEach(([d, text], i) => {
        const y = 310 + i * 62;
        g.save();
        g.translate(x, y - 25);
        g.scale(30 / 24, 30 / 24);
        g.strokeStyle = green;
        g.lineWidth = 2;
        g.lineCap = g.lineJoin = 'round';
        g.stroke(new Path2D(d));
        g.restore();
        g.fillStyle = '#ece9e3';
        g.fillText(text, x + 50, y);
      });
    };
    const t = make(W, H, draw);
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    Promise.all(['400 62px "Instrument Serif"', '600 28px "Red Hat Text"', '500 32px "Red Hat Text"'].map((f) => document.fonts.load(f))).then(() => {
      draw((t.image as HTMLCanvasElement).getContext('2d')!);
      t.needsUpdate = true;
    });
    return t;
  });
