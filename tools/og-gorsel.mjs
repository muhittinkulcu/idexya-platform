// Paylaşım görselleri (Muhittin, 28 Eki 2026): public/kapak/idexya.png ve public/kapak/haber/<slug>.png (1200×630).
// Geliştirme ortamında elle çalıştırılır: `npm run build`, dist klasörünü yerelde sunun (ör. `npx astro preview` ya da
// `python3 -m http.server` ile), sonra `KAYNAK=http://localhost:4321 node tools/og-gorsel.mjs <playwright modülü yolu>`.
// Kapak çizimini derlenmiş sayfadan (dist) alır; yeni yazı eklendiğinde yeniden çalıştırıp PNG'leri depoya ekleyin.
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = await import(process.argv[2] || 'playwright');
const yazilar = JSON.parse(fs.readFileSync('src/data/yazilar.json', 'utf8'));
const kacis = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const sablon = (ust, baslik, svg) => `<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;width:1200px;height:630px;font-family:'IBM Plex Sans',system-ui,sans-serif}
.og{width:1200px;height:630px;box-sizing:border-box;padding:56px 56px 56px 64px;display:grid;grid-template-columns:1fr 520px;gap:48px;align-items:center;background:linear-gradient(135deg,#0A3A7A,#001B42);color:#fff}
.og-sol{display:flex;flex-direction:column;gap:22px;height:100%;justify-content:space-between}
.og-marka{font-size:24px;font-weight:700}.og-marka span{color:#F07A23}
.og-ust{align-self:flex-start;padding:6px 14px;border-radius:999px;background:rgba(240,122,35,.18);color:#FFB58A;font-size:20px;font-weight:700}
.og h1{margin:0;font-size:${baslik.length > 60 ? 44 : 52}px;line-height:1.12;letter-spacing:-.02em}
.og-alt{font-size:20px;color:#C6D2E3}
.og-sag img{width:520px;height:auto;border-radius:24px;display:block}
</style></head><body><div class="og"><div class="og-sol"><div class="og-marka">Idexya <span>|</span> Good Things</div><div style="display:flex;flex-direction:column;gap:18px"><span class="og-ust">${kacis(ust)}</span><h1>${kacis(baslik)}</h1></div><div class="og-alt">idexya.com</div></div><div class="og-sag">${svg}</div></div></body></html>`;
const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
// Kapak çizimi derlenmiş sayfadan görüntü olarak alınır (sayfanın kendi stilleriyle).
const k = await b.newPage({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 2 });
const svgAl = async (dosya) => {
  await k.goto((process.env.KAYNAK || 'http://localhost:4321') + dosya, { waitUntil: 'networkidle' });
  await k.evaluate(() => { for (const x of document.querySelectorAll('body *')) { const p = getComputedStyle(x).position; if (p === 'fixed' || p === 'sticky') x.style.display = 'none'; } });
  const e = k.locator('.kg').first();
  await e.evaluate((x) => { const c = x.querySelector('figcaption'); if (c) c.remove(); });
  return `<img src="data:image/png;base64,${(await e.screenshot()).toString('base64')}" alt="">`;
};
const yaz = async (html, cikti) => { fs.mkdirSync(path.dirname(cikti), { recursive: true }); await p.setContent(html, { waitUntil: 'networkidle' }); await p.screenshot({ path: cikti, type: 'png' }); console.log(cikti); };
await yaz(sablon('Dijital pazarlama, e-ticaret ve ölçüm', 'Büyümenin her parçası, tek ekipte', await svgAl('/tr/platformlar/')), 'public/kapak/idexya.png');
for (const y of yazilar) await yaz(sablon(y.kategori, y.baslik, await svgAl(`/tr/haber/${y.slug}/`)), `public/kapak/haber/${y.slug}.png`);
await b.close();
