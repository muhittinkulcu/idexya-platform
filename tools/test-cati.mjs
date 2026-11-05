// Çatı site önizleme denetimi. Yerel worker açıkken çalışır:
//   CATI_ONIZLEME=evet npm run build && npx wrangler dev --port 8795 --local --persist-to <geçici klasör>
//   node tools/test-cati.mjs http://127.0.0.1:8795 <ekran klasörü>
// Playwright depoda bağımlılık değildir: PW_KOK ile kurulu olduğu klasör verilir.
import { createRequire } from 'node:module';
import { existsSync, mkdirSync } from 'node:fs';
import { ONIZLEME_YOLLARI } from '../src/cati/yollar.mjs';
const { chromium } = createRequire(process.env.PW_KOK ? `${process.env.PW_KOK}/` : import.meta.url)('playwright');
const B = process.argv[2] || 'http://127.0.0.1:8795', SS = process.argv[3] || '';
if (SS) mkdirSync(SS, { recursive: true });
const hedef = existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {};
const t = await chromium.launch(hedef);
const kalan = []; let gecen = 0;
const k = (ad, x, ek = '') => { if (x) gecen++; else { kalan.push(ad); console.log(`KALDI ${ad} ${ek}`); } };
const GENISLIK = [390, 1440, 2560];
// Yazılmayacaklar: uydurma deneyim süresi ("10+ yıl" dışında), 2018, proje ve marka sayısı, kapalı Referanslar, taslak izi.
const YASAK = [/\b(?!10\+)\d+\+/, /\b2018\b/, /\b\d+ *(yıl|yıllık)\b/i, /\b\d+ *(proje|marka|müşteri)\b/i, /Referanslar/, /Örnek içerik/, /Taslakta/, /gerçek veri gelince/, /₺/, /\d\s*TL\b/];
// Bir sonraki aşamada açılacak adresler (bayraklı önizlemede henüz yok).
const SONRA = JSON.parse(process.env.CATI_SONRA || '[]');
const yollar = ONIZLEME_YOLLARI.map((y) => `/${y}/`);
const baglantilar = new Set();
for (const yol of yollar) {
  const r = await fetch(B + yol, { redirect: 'manual' });
  k(`${yol} 200`, r.status === 200, String(r.status));
  k(`${yol} X-Robots-Tag noindex`, /noindex/.test(r.headers.get('x-robots-tag') || ''), r.headers.get('x-robots-tag') || 'yok');
  for (const gen of GENISLIK) {
    const c = await t.newContext({ viewport: { width: gen, height: gen === 390 ? 844 : 900 } }); const s = await c.newPage();
    const hata = [];
    s.on('pageerror', (e) => hata.push(e.message));
    s.on('console', (m) => { if (m.type() === 'error') hata.push(m.text()); });
    s.on('response', (y) => { if (y.status() >= 400 && y.url().startsWith(B)) hata.push(`${y.status()} ${y.url()}`); });
    await s.goto(B + yol, { waitUntil: 'load' });
    await s.evaluate(() => document.fonts.ready);
    await s.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 500) { scrollTo({ top: y, behavior: 'instant' }); await new Promise((c) => setTimeout(c, 25)); } scrollTo({ top: 0, behavior: 'instant' }); });
    await s.waitForTimeout(900);
    const d = await s.evaluate(() => ({
      tasma: document.documentElement.scrollWidth - innerWidth,
      robots: document.querySelector('meta[name=robots]')?.content,
      h1: document.querySelectorAll('h1').length,
      yon: document.documentElement.dataset.yon,
      metin: document.body.innerText,
      linkler: [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')),
      girisler: [...document.querySelectorAll('#m-gir a')].map((a) => a.textContent),
      bekleyen: document.querySelectorAll('.rv-bekle').length,
      yazi: getComputedStyle(document.querySelector('h1')).fontFamily
    }));
    const et = `${gen}px ${yol}`;
    k(`${et} konsol ve ağ hatası yok`, hata.length === 0, hata.slice(0, 3).join(' | '));
    k(`${et} yatay taşma yok`, d.tasma <= 0, String(d.tasma));
    k(`${et} noindex etiketi`, /noindex/.test(d.robots || ''));
    k(`${et} tek h1`, d.h1 === 1, String(d.h1));
    k(`${et} kaydırınca içerik açıldı`, d.bekleyen === 0, String(d.bekleyen));
    k(`${et} Giriş menüsü: Üye girişi ve Creative, IDOS yok`, d.girisler.length === 2 && !d.girisler.some((x) => /IDOS/.test(x)) && d.girisler.some((x) => /Üye girişi/.test(x)) && d.girisler.some((x) => /Creative/.test(x)));
    k(`${et} Referanslar bağlantısı yok`, !d.linkler.some((h) => /referans/i.test(h)));
    k(`${et} yazı tipi yöne uygun`, d.yon === 't' ? /Archivo/.test(d.yazi) : /Unbounded/.test(d.yazi), d.yazi);
    for (const y of YASAK) k(`${et} yasak metin yok ${y}`, !y.test(d.metin), (d.metin.match(y) || [''])[0]);
    d.linkler.forEach((h) => { if (h.startsWith('/')) baglantilar.add(h.split('#')[0].split('?')[0]); });
    if (SS && (gen !== 2560 || yol === yollar[0])) await s.screenshot({ path: `${SS}/${yol.replace(/\//g, '') || 'ana'}-${gen}.png`, fullPage: true });
    await c.close();
  }
  // Hareket azaltma: sürekli hareket ve bekleyen öğe yok.
  const c = await t.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } }); const s = await c.newPage();
  await s.goto(B + yol, { waitUntil: 'load' });
  const az = await s.evaluate(() => ({
    hareket: document.documentElement.classList.contains('hareket'),
    calisan: document.getAnimations().filter((a) => a.playState === 'running').length,
    bekleyen: document.querySelectorAll('.rv-bekle').length
  }));
  k(`${yol} hareket azaltmada .hareket yok`, !az.hareket);
  k(`${yol} hareket azaltmada çalışan animasyon yok`, az.calisan === 0, String(az.calisan));
  k(`${yol} hareket azaltmada gizli öğe yok`, az.bekleyen === 0);
  await c.close();
}
// Menü: masaüstü açılır panel ve Esc; telefonda menü düğmesi.
{
  const c = await t.newContext({ viewport: { width: 1440, height: 900 } }); const s = await c.newPage();
  await s.goto(B + yollar[0]);
  await s.click('[data-ac="m-hiz"]');
  k('hizmetler paneli açılır', await s.isVisible('#m-hiz a[href="/hizmetler/"]'));
  k('panelde dokuz hizmet', (await s.$$eval('#m-hiz .mega > div a', (a) => a.length)) === 9);
  await s.keyboard.press('Escape');
  k('Esc paneli kapatır', !(await s.isVisible('#m-hiz a[href="/hizmetler/"]')));
  await s.click('[data-ac="m-gir"]');
  k('giriş paneli açılır', await s.isVisible('#m-gir a[href="/giris/"]'));
  await c.close();
  const c2 = await t.newContext({ viewport: { width: 390, height: 844 } }); const s2 = await c2.newPage();
  await s2.goto(B + yollar[0]);
  k('telefonda menü kapalı başlar', !(await s2.isVisible('#anaNav')));
  await s2.click('[data-burger]');
  k('menü düğmesi açar', await s2.isVisible('#anaNav'));
  await s2.click('[data-ac="m-hiz"]');
  k('telefonda hizmetler açılır', await s2.isVisible('#m-hiz a[href="/hizmetler/"]'));
  k('açık menü taşma yapmaz', await s2.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await c2.close();
}
// Kırık iç bağlantı.
for (const h of baglantilar) {
  if (SONRA.includes(h)) continue;
  const r = await fetch(B + h);
  k(`bağlantı ${h}`, r.status === 200, String(r.status));
}
// Site haritasına girmemeli.
const harita = await (await fetch(`${B}/sitemap.xml`)).text();
for (const yol of yollar) k(`${yol} site haritasında yok`, !harita.includes(`idexya.com${yol}`));
// Ek denetimler (hizmet sayfaları).
const EK = new URL('./test-cati-hizmet.mjs', import.meta.url);
if (existsSync(EK)) await (await import(EK.href)).default({ t, B, SS, k });
await t.close();
console.log(`GEÇTİ ${gecen} · KALDI ${kalan.length}`);
process.exit(kalan.length ? 1 : 0);
