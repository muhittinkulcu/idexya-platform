// Derlemeden sonra dist/sitemap.xml üretir: arama motorlarına açık (noindex taşımayan) her HTML sayfası, kanonik adresiyle.
// Kullanım: node tools/sitemap.mjs (npm run build bunu kendiliğinden çalıştırır).
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const KOK = 'dist';
const HARIC = /^\/(yonetim|kabuk|api|uye|hesabim|giris|sifre-yenile|404)/;
const sayfalar = [];
function gez(dizin) {
  for (const ad of readdirSync(dizin)) {
    const yol = join(dizin, ad);
    if (statSync(yol).isDirectory()) { gez(yol); continue; }
    if (!ad.endsWith('.html')) continue;
    const html = readFileSync(yol, 'utf8');
    if (/<meta name="robots" content="noindex/.test(html)) continue;
    const kanonik = (html.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
    if (!kanonik || HARIC.test(new URL(kanonik).pathname)) continue;
    sayfalar.push(kanonik);
  }
}
gez(KOK);
const benzersiz = [...new Set(sayfalar)].sort();
writeFileSync(join(KOK, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
  + benzersiz.map((u) => `  <url><loc>${u.replace(/&/g, '&amp;')}</loc></url>`).join('\n') + '\n</urlset>\n');
console.log(`sitemap.xml: ${benzersiz.length} adres`);
