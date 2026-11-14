// Panel kabuğunu (src/scripts/yonetim/kabuk-giris.js: kabuk-bagla + ortak kabuk) tek KLASİK betik olarak paketler:
// public/panel-kabuk.js. Yonetim.astro bunu <head>'de <script src> ile yükler (satır içi değil, CSP script-src 'self').
// Neden klasik: modül betikleri ayrıştırma bittikten sonra çalışır; tarayıcı ilk kareyi (ve sayfa geçişinin yeni görüntüsünü)
// ondan önce çizer ve içerik bir kare kabuksuz görünür. <head>'deki klasik betik kabuğu tanımlar; kabuk öğesi kapanır
// kapanmaz, ilk boyamadan önce kurulur.
//   node tools/panel-kabuk.mjs          paketler (astro build ve astro dev'den önce)
//   node tools/panel-kabuk.mjs --surum  derlemeden sonra dist'teki panel sayfalarında /panel-kabuk.js ve /panel-gorunum.js
//                                       adreslerine içerik özeti ekler (?v=<özet>; bir yıl önbellekte, değişince adres değişir)
import { build } from 'esbuild';
import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';

const KOK = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const CIKTI = path.join(KOK, 'public/panel-kabuk.js');

if (process.argv.includes('--surum')) {
  // <head>'deki iki klasik betik (tema ve kabuk) ayrıştırmayı bekletir: her geçişte yeniden doğrulama gidiş-dönüşü olmasın diye
  // adrese içerik özeti eklenir ve public/_headers ile bir yıl önbellekte tutulur.
  const surum = Object.fromEntries(['/panel-gorunum.js', '/panel-kabuk.js'].map((u) =>
    [u, createHash('sha256').update(fs.readFileSync(path.join(KOK, 'dist', u))).digest('hex').slice(0, 12)]));
  const klasor = path.join(KOK, 'dist/yonetim');
  let sayi = 0;
  const eksik = [];
  for (const ad of fs.readdirSync(klasor)) {
    const dosya = path.join(klasor, ad, 'index.html');
    if (!fs.existsSync(dosya)) continue;
    let html = fs.readFileSync(dosya, 'utf8');
    if (!html.includes('id="idexya-kabuk-ayar"')) continue; // kabuksuz sayfa (ör. teklif yazdırma)
    for (const [u, oz] of Object.entries(surum)) {
      const etiket = `<script src="${u}"></script>`;
      if (!html.includes(etiket)) { eksik.push(`${ad} (${u})`); continue; }
      html = html.replace(etiket, `<script src="${u}?v=${oz}"></script>`);
    }
    fs.writeFileSync(dosya, html);
    sayi++;
  }
  if (eksik.length || !sayi) { console.error('panel-kabuk: sürümlenemeyen betik: ' + (eksik.join(', ') || 'panel sayfası bulunamadı')); process.exit(1); }
  console.log(`panel kabuğu: ${sayi} sayfada ` + Object.entries(surum).map(([u, oz]) => `${u}?v=${oz}`).join(', '));
} else {
  await build({
    entryPoints: [path.join(KOK, 'src/scripts/yonetim/kabuk-giris.js')], bundle: true, format: 'iife', minify: true,
    target: ['chrome111', 'safari16.4', 'firefox115'], outfile: CIKTI, legalComments: 'none', logLevel: 'warning',
    banner: { js: '/* Idexya panel kabuğu: tools/panel-kabuk.mjs üretir, elle düzenlenmez. */' }
  });
  console.log(`panel kabuğu: public/panel-kabuk.js ${fs.statSync(CIKTI).size} bayt`);
}
