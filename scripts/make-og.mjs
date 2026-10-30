// The link-preview card (public/og.png, 1200x630): the white logo lockup centred on the site's night background.
// Run with `node scripts/make-og.mjs` after the logo changes.
import sharp from 'sharp';

const logo = await sharp('public/brand/saleng-works-logo-white.png').resize({ width: 880 }).toBuffer();
await sharp({ create: { width: 1200, height: 630, channels: 3, background: '#07080a' } })
  .composite([{ input: logo, gravity: 'centre' }])
  .png({ compressionLevel: 9, palette: true })
  .toFile('public/og.png');
console.log('public/og.png');
