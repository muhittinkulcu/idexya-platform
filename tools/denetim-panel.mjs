// Kullanıma hazırlık denetimi: Website Yönetim'in her sayfasını açar; JS hatası, başarısız API isteği, yer tutucu metin,
// menüde kırık bağlantı ve yatay taşmayı raporlar, her sayfanın ekran görüntüsünü alır. Yalnız okur, düğmelere basmaz.
// Kullanım: yerel wrangler dev (YEREL_GIRIS=evet) → node tools/denetim-panel.mjs <ekran klasörü> [panel adresi]
import { createRequire } from 'module';
import { writeFileSync } from 'fs';
import { SAYFALAR } from '../worker/panel-yollar.js';
const { chromium } = createRequire(import.meta.url)('playwright');
const SS = process.argv[2] || '.', B = process.argv[3] || 'http://panel.localhost:8795';
const t = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium', args: ['--host-resolver-rules=MAP panel.localhost 127.0.0.1'] });
const s = await t.newPage({ viewport: { width: 1366, height: 900 } });
const YER_TUTUCU = /yakında|hazırlanıyor|yapım aşamasında|lorem|todo|henüz hazır değil|coming soon/i;
const rapor = [];
let olay = [];
s.on('pageerror', (e) => olay.push('JS: ' + e.message.slice(0, 160)));
s.on('console', (m) => { if (m.type() === 'error' && !/ERR_TUNNEL|favicon|net::ERR_FAILED.*fonts/.test(m.text())) olay.push('konsol: ' + m.text().slice(0, 160)); });
s.on('response', (r) => { const u = new URL(r.url()); if (u.pathname.startsWith('/api/') && r.status() >= 400) olay.push(`API ${r.status()} ${u.pathname}${u.search}`); });
const atla = new Set(['proposal-print']);
for (const ad of [...SAYFALAR].sort()) {
  if (atla.has(ad)) continue;
  olay = [];
  let durum = 0;
  try { const r = await s.goto(B + '/' + ad, { waitUntil: 'networkidle', timeout: 20000 }); durum = r ? r.status() : 0; } catch (e) { olay.push('açılış: ' + e.message.slice(0, 80)); }
  await s.waitForTimeout(400);
  const b = await s.evaluate((desen) => {
    const main = document.querySelector('main');
    const metin = main ? main.innerText : '';
    const re = new RegExp(desen, 'i');
    const yer = metin.split('\n').filter((l) => re.test(l)).slice(0, 3);
    const hata = [...document.querySelectorAll('[data-genel-hata], .uyari.hata')].filter((x) => !x.hidden && x.textContent.trim()).map((x) => x.textContent.trim().slice(0, 140));
    return { baslik: (document.querySelector('h1') || {}).textContent || '', yer, hata, tasma: document.documentElement.scrollWidth > innerWidth + 1,
      dugme: main ? main.querySelectorAll('button, a.dugme').length : 0, uzunluk: metin.length };
  }, YER_TUTUCU.source);
  await s.screenshot({ path: `${SS}/sayfa-${ad}.png` });
  rapor.push({ ad, durum, ...b, olay: [...new Set(olay)] });
  console.log(`${olay.length || b.hata.length || durum !== 200 ? 'SORUN' : 'tamam'}  /${ad}  ${durum}  "${b.baslik.trim()}"  düğme:${b.dugme}${b.yer.length ? '  YER TUTUCU: ' + b.yer.join(' | ').slice(0, 120) : ''}${b.hata.length ? '  HATA KUTUSU: ' + b.hata.join(' | ') : ''}${olay.length ? '\n      ' + [...new Set(olay)].join('\n      ') : ''}`);
}
// Menü bağlantıları: kenar menüsündeki her iç bağlantı bilinen bir sayfaya gitmeli.
await s.goto(B + '/dashboard', { waitUntil: 'networkidle' });
const menu = await s.$$eval('nav a[href^="/"], aside a[href^="/"]', (a) => [...new Set(a.map((x) => x.getAttribute('href')))]);
const kirik = menu.filter((h) => !SAYFALAR.has(h.replace(/^\//, '').replace(/[?#].*$/, '')) && !/^\/(tr|en)?\/?$/.test(h));
console.log(`\nMenü: ${menu.length} bağlantı; bilinmeyen hedef: ${kirik.length ? kirik.join(', ') : 'yok'}`);
writeFileSync(`${SS}/denetim.json`, JSON.stringify({ rapor, menu, kirik }, null, 1));
await t.close();
