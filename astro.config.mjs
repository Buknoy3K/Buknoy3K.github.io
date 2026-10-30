// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // The public address, e.g. SITE_URL=https://salengworks.com npm run build. With it set, pages get canonical links,
  // the link-preview image gets a full address and sitemap.xml is filled in.
  site: process.env.SITE_URL,
  // The campfire was at /campfire before it became the home page
  redirects: { '/campfire': '/' },
  // Photos and screenshots as webp at 75 (sharp's default is 80): about a third smaller, no visible change
  image: { service: { entrypoint: 'astro/assets/services/sharp', config: { webp: { quality: 75, effort: 6 } } } },
});
