// @ts-check
import { defineConfig } from 'astro/config';
import { catiAcikMi, catiOnizleme } from './src/cati/bayrak.mjs';

export default defineConfig({
  site: 'https://idexya.com',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  compressHTML: true,
  // Çatı site önizlemesi: bayrak kapalıyken (canlı derleme) hiçbir şey eklenmez.
  integrations: catiAcikMi() ? [catiOnizleme()] : []
});
