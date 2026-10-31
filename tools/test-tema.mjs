// Tema seçici (Açık · Koyu · Sistem · Saate göre): varsayılan, saklama, ilk boyama, saat geçişi, eski kayıt, mobil.
// Kullanım: yerel wrangler dev (YEREL_GIRIS=evet, port 8795) → node tools/test-tema.mjs <ekran klasörü> [panel adresi]
import { createRequire } from 'module';
const { chromium } = createRequire(import.meta.url)('playwright');
const SS = process.argv[2] || '.', B = process.argv[3] || 'http://panel.localhost:8795';
const t = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--host-resolver-rules=MAP panel.localhost 127.0.0.1'] });
const h = []; const k = (ad, x) => { console.log((x ? 'GEÇTİ ' : 'KALDI ') + ad); if (!x) h.push(ad); };
const durum = (s) => s.evaluate(() => ({ tema: document.documentElement.dataset.tema, secim: document.documentElement.dataset.temaSecim, dark: document.documentElement.classList.contains('dark'), basili: [...document.querySelectorAll('[data-tema-sec][aria-pressed=true]')].map((b) => b.dataset.temaSec) }));
// 1) Varsayılan: Sistem; cihaz koyu → koyu, açık → açık. İlk boyamada doğru tema (yanıp sönme yok): DOMContentLoaded öncesi.
for (const [renk, bek] of [['dark', 'koyu'], ['light', 'acik']]) {
  const c = await t.newContext({ colorScheme: renk, viewport: { width: 1280, height: 800 } }); const s = await c.newPage();
  const erken = []; await s.addInitScript(() => { new MutationObserver(() => {}).observe(document, { childList: true }); document.addEventListener('readystatechange', () => { if (document.readyState === 'interactive') window.__ilk = document.documentElement.dataset.tema; }); });
  await s.goto(B + '/dashboard'); await s.waitForSelector('[data-tema-grup]');
  const d = await durum(s); const ilk = await s.evaluate(() => window.__ilk);
  k(`sistem varsayılan, cihaz ${renk} → ${bek}`, d.secim === 'sistem' && d.tema === bek && d.basili.join() === 'sistem');
  k(`ilk boyamada tema hazır (${renk})`, ilk === bek);
  await s.emulateMedia({ colorScheme: renk === 'dark' ? 'light' : 'dark' });
  await s.waitForTimeout(200);
  k(`sistem: cihaz ayarı değişince izler (${renk})`, (await durum(s)).tema === (bek === 'koyu' ? 'acik' : 'koyu'));
  await c.close();
}
// 2) Açık / Koyu seçimi saklanır, yenilemede kalır.
const c = await t.newContext({ colorScheme: 'light', viewport: { width: 1280, height: 800 } }); const s = await c.newPage();
await s.goto(B + '/dashboard'); await s.waitForSelector('[data-tema-grup]');
await s.click('[data-tema-sec=koyu]'); k('koyu seçildi', (await durum(s)).tema === 'koyu');
await s.screenshot({ path: SS + '/tema-koyu.png' });
await s.reload(); await s.waitForSelector('[data-tema-grup]');
let d = await durum(s); k('koyu yenilemede kalır', d.tema === 'koyu' && d.secim === 'koyu' && d.basili.join() === 'koyu');
await s.click('[data-tema-sec=acik]'); k('açık seçildi', (await durum(s)).tema === 'acik');
await s.screenshot({ path: SS + '/tema-acik.png' });
// 3) Erişilebilirlik: her düğmede Türkçe title ve aria-label.
const et = await s.$$eval('[data-tema-sec]', (b) => b.map((x) => [x.title, x.getAttribute('aria-label')]));
k('dört düğme, title ve aria-label dolu', et.length === 4 && et.every(([a, b]) => a && b));
// 4) Saate göre: saat sahte; 18.59.50'de açık, 19.00 geçişinde kendiliğinden koyu.
await s.clock.install({ time: new Date('2026-10-31T18:59:50') });
await s.reload(); await s.waitForSelector('[data-tema-grup]');
await s.click('[data-tema-sec=saat]'); d = await durum(s); k('saate göre 18.59 açık', d.tema === 'acik' && d.secim === 'saat');
await s.clock.runFor(20000); d = await durum(s); k('19.00 geçişinde kendiliğinden koyu', d.tema === 'koyu');
await s.clock.runFor(11 * 3600000 + 59 * 60000); d = await durum(s); k('06.59 hâlâ koyu', d.tema === 'koyu'); await s.clock.runFor(120000); d = await durum(s);
k('07.00 geçişinde açığa döner', d.tema === 'acik');
await s.reload(); await s.waitForSelector('[data-tema-grup]'); d = await durum(s); k('saat seçimi yenilemede kalır', d.secim === 'saat');
// 5) Eski kayıt: idx-tema=koyu olan kullanıcı koyu ile açar.
const c2 = await t.newContext({ colorScheme: 'light' }); const s2 = await c2.newPage();
await s2.addInitScript(() => { try { if (!sessionStorage.getItem('x')) { localStorage.setItem('idx-tema', 'koyu'); sessionStorage.setItem('x', '1'); } } catch {} });
await s2.goto(B + '/dashboard'); await s2.waitForSelector('[data-tema-grup]'); d = await durum(s2); k('eski koyu tercih korunur', d.tema === 'koyu' && d.secim === 'koyu');
// 6) Mobil: yatay taşma yok.
const c3 = await t.newContext({ viewport: { width: 375, height: 760 }, colorScheme: 'dark' }); const s3 = await c3.newPage();
await s3.goto(B + '/dashboard'); await s3.waitForSelector('[data-tema-grup]');
k('mobilde yatay taşma yok', await s3.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
k('mobilde grup görünür', await s3.isVisible('[data-tema-grup]'));
await s3.screenshot({ path: SS + '/tema-mobil-koyu.png' });
await t.close(); console.log(h.length ? 'KALAN: ' + h.join(', ') : 'Hepsi geçti.'); process.exit(h.length ? 1 : 0);
