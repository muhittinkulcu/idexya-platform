// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://idexya.com',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  compressHTML: true
});
