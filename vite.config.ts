// Vite+ configuration: tests (vp test), lint (vp lint) and formatting (vp fmt).
// The site itself is built by Astro, which reads astro.config.mjs, not this file.
import { defineConfig } from 'vite-plus';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
  },
  lint: {
    ignorePatterns: ['dist/**', 'dist-data/**', '.astro/**'],
  },
  fmt: {
    singleQuote: true,
    printWidth: 100,
    // Vendored EVicons files must stay byte-identical to the npm package; the extension icons'
    // metadata keeps the upstream JSON layout so that it can be proposed to EVicons unchanged.
    ignorePatterns: [
      'dist/**',
      'dist-data/**',
      '.astro/**',
      'bun.lock',
      'public/images/icons/evicons/**',
      'public/images/icons/evicons-extension/*.json',
    ],
  },
});
