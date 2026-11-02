import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // GitHub Pages user site; if Polina buys a domain later, change it here and in public/robots.txt
  site: 'https://polinakuban.github.io',
  integrations: [sitemap()],
});
