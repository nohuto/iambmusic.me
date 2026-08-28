import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://iambmusic.me',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
});
