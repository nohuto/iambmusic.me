import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://iambmusic.me',
  integrations: [sitemap()],
  trailingSlash: 'always',
  compressHTML: true,
  build: { inlineStylesheets: 'always' },
});
