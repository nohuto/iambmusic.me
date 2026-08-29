import type { APIRoute } from 'astro';
import { pageIds } from '../data/types.ts';
import { absoluteUrl, routePath, routeTargets } from '../lib/routes.ts';

export const GET: APIRoute = ({ site }) => {
  const locations = routeTargets.flatMap(({ lang, profile }) =>
    pageIds.map((page) => absoluteUrl(routePath(lang, profile, page), site)),
  );

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...locations.map((location) => `  <url><loc>${location}</loc></url>`),
    '</urlset>',
    '',
  ].join('\n');

  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
