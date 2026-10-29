// Takes the still pictures the campfire scene shows on the laptop, tablet, phone and kiosk screens (public/screens/*.webp).
// Run it with the dev server up whenever the site, the tablet desktop, the phone or the kiosk changes:  npm run snap
// Uses the installed Chrome; set CHROME to its path if it lives somewhere else.
import puppeteer from 'puppeteer-core';

const base = process.env.SITE ?? 'http://localhost:4322';
const chrome = process.env.CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
// Same page sizes as scene.ts lays the iframes out at: its width, and the screen glass's shape for the height
// (laptop glass 0.31 x 0.204 m, tablet glass 0.188 x 0.13 m, phone glass 0.064 x 0.138 m, kiosk glass 0.415 x 0.69 m)
const shots = [
  { url: '/', file: 'site', width: 1440, height: Math.round((1440 * 0.204) / 0.31) },
  { url: '/tablet', file: 'tablet', width: 1200, height: Math.round((1200 * 0.13) / 0.188) },
  { url: '/phone', file: 'phone', width: 390, height: Math.round((390 * 0.138) / 0.064) },
  { url: '/kiosk', file: 'kiosk', width: 1080, height: Math.round((1080 * 0.69) / 0.415) },
];

const browser = await puppeteer.launch({ executablePath: chrome });
const page = await browser.newPage();
for (const s of shots) {
  await page.setViewport({ width: s.width, height: s.height, deviceScaleFactor: 2 });
  await page.goto(base + s.url, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.querySelector('astro-dev-toolbar')?.remove());
  await new Promise((r) => setTimeout(r, 1200)); // fonts, images and entrance animations
  await page.screenshot({ path: `public/screens/${s.file}.webp`, type: 'webp', quality: 88 });
  console.log(`public/screens/${s.file}.webp`);
}
await browser.close();
