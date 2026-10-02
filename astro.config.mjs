import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://iambmusic.me',
  trailingSlash: 'always',
  compressHTML: true,
  build: { inlineStylesheets: 'always' },
  redirects: {
    '/': { status: 301, destination: '/de/iamb/' },
    '/de/': { status: 301, destination: '/de/iamb/' },
    '/en/': { status: 301, destination: '/en/iamb/' },
  },
});
