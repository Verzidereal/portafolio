import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import image from '@astrojs/image';

export default defineConfig({
  site: 'https://verzide.com', // 👈 importante para sitemap y SEO
  integrations: [
    react(),
    tailwind(),
    sitemap(),
    image(),
  ],
  vite: {
    server: { port: 4321 },
  },
});
