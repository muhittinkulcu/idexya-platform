// Çatı site önizleme bayrağı. Kapalıyken yeni yol derlemeye hiç girmez: canlı çıktı bayt bayt aynı kalır (tools/cati-kanit.mjs).
// Açılma koşulları:
//   CATI_ONIZLEME=evet  elle (yerel: CATI_ONIZLEME=evet npm run build)
//   Workers Builds'te main dışındaki dal (dal önizlemesi; önizlemede D1 ve değişken yoktur, wrangler.jsonc "previews")
// CATI_ONIZLEME=kapali her durumda kapatır. main derlemesi HER DURUMDA kapalıdır; canlıya geçişte bu bayrak kaldırılır.
import { fileURLToPath } from 'node:url';
import { appendFile } from 'node:fs/promises';
import { ONIZLEME_YOLLARI } from './yollar.mjs';

export function catiAcikMi(ortam = process.env) {
  if (ortam.WORKERS_CI_BRANCH === 'main') return false;
  if (ortam.CATI_ONIZLEME === 'kapali') return false;
  if (ortam.CATI_ONIZLEME === 'evet') return true;
  const dal = ortam.WORKERS_CI_BRANCH;
  return Boolean(dal) && dal !== 'main';
}

// Yalnız bayrak açıkken astro.config.mjs'ye eklenir.
export function catiOnizleme() {
  return {
    name: 'idexya-cati-onizleme',
    hooks: {
      'astro:config:setup': ({ injectRoute }) => {
        injectRoute({ pattern: '/[cati]', entrypoint: fileURLToPath(new URL('./yol.astro', import.meta.url)), prerender: true });
      },
      // Arama motoru kapalılığı sayfadaki etikete ek olarak yanıt başlığıyla da verilir.
      'astro:build:done': async ({ dir }) => {
        const kural = ONIZLEME_YOLLARI.map((y) => `/${y}\n  X-Robots-Tag: noindex, nofollow\n/${y}/*\n  X-Robots-Tag: noindex, nofollow\n`).join('');
        await appendFile(new URL('_headers', dir), `\n# Çatı site önizlemesi (src/cati/bayrak.mjs)\n${kural}`);
      }
    }
  };
}
