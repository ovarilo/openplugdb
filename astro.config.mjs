// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// SITE_URL and BASE_PATH are provided by the deploy workflow so the same
// sources build for the GitHub Pages project URL
// (https://<owner>.github.io/openplugdb/) and, later, the custom domain
// (https://openplugdb.org/).
const site = process.env.SITE_URL ?? 'https://openplugdb.org';
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  output: 'static',
  integrations: [sitemap()],
});
