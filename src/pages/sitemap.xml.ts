// The pages search engines should know about: home and each product page (not /campfire, /tablet, /phone or /kiosk,
// which are noindex). Empty until SITE_URL is set at build time (see astro.config.mjs).
import type { APIRoute } from 'astro';
import { products } from '../config/site';

export const GET: APIRoute = ({ site }) => {
  const paths = ['/', ...products.map((p) => `/products/${p.slug}`)];
  const urls = site ? paths.map((p) => `  <url><loc>${new URL(p, site)}</loc></url>`).join('\n') : '';
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`, {
    headers: { 'Content-Type': 'application/xml' },
  });
};
