// Everything may be crawled (the demo pages say noindex themselves); points crawlers at the sitemap once SITE_URL is set.
import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) =>
  new Response(`User-agent: *\nAllow: /\n${site ? `\nSitemap: ${new URL('/sitemap.xml', site)}\n` : ''}`, {
    headers: { 'Content-Type': 'text/plain' },
  });
