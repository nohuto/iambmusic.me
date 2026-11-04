import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://iambmusic.me',
  trailingSlash: 'always',
  compressHTML: true,
  build: { inlineStylesheets: 'always' },
});
