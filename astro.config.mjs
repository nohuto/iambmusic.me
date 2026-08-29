import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://iambmusic.me',
  output: 'static',
  trailingSlash: 'always',
  compressHTML: true,
  build: { format: 'directory' },
  redirects: {
    '/': { status: 301, destination: '/de/iamb/' },
    '/de/': { status: 301, destination: '/de/iamb/' },
    '/en/': { status: 301, destination: '/en/iamb/' },
  },
});
