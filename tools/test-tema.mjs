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
// 7) İnce ve ferah tipografi (Muhittin, 12 Kas 2026): Inter yerel dosyadan, dış yazı tipi isteği yok; gövde 300 ve satır aralığı 1,65;
//    düğme ve menü öğeleri en çok 500 (logo yazısı `.logo b` hariç). Açık ve koyu temada aynı.
for (const renk of ['light', 'dark']) {
  const c4 = await t.newContext({ colorScheme: renk, viewport: { width: 1280, height: 800 } }); const s4 = await c4.newPage();
  const dis = []; s4.on('request', (r) => { const u = new URL(r.url()); if (!['panel.localhost', '127.0.0.1', 'localhost'].includes(u.hostname)) dis.push(u.hostname); });
  await s4.goto(B + '/dashboard'); await s4.waitForSelector('[data-tema-grup]'); await s4.waitForLoadState('networkidle');
  const ty = await s4.evaluate(async () => {
    await document.fonts.ready;
    const yuzler = []; let google = !!document.querySelector('link[href*="fonts.googleapis.com"],link[href*="fonts.gstatic.com"]');
    for (const ss of document.styleSheets) { let kurallar = []; try { kurallar = [...ss.cssRules]; } catch { google = google || /googleapis|gstatic/.test(ss.href || ''); continue; }
      for (const r of kurallar) { if (r.constructor.name === 'CSSFontFaceRule') yuzler.push([r.style.getPropertyValue('font-family'), r.style.getPropertyValue('src')]); if (/googleapis|gstatic/.test(r.cssText)) google = true; } }
    const k = getComputedStyle(document.querySelector('.kabuk')); const ag = (q) => [...document.querySelectorAll(q)].map((e) => Number(getComputedStyle(e).fontWeight));
    return { yuzler, google, agirlik: k.fontWeight, satir: parseFloat(k.lineHeight) / parseFloat(k.fontSize), aile: k.fontFamily,
      dugme: ag('.dugme'), menu: ag('.mo, .alt a, .alt span, .mg>.grup-ad, .rozet, .ucan-bas'), baslik: ag('.sayfa h1, .sayfa-yolu [aria-current=page]'),
      yuklu: document.fonts.check('300 14px Inter') && [...document.fonts].some((f) => f.family.replace(/"/g, '') === 'Inter' && f.status === 'loaded') };
  });
  const interYerel = ty.yuzler.filter(([a, src]) => /Inter/.test(a) && /\/fonts\/inter-/.test(src));
  k(`tipografi (${renk}): @font-face Inter yerel /fonts/inter- yolundan`, interYerel.length >= 6);
  k(`tipografi (${renk}): Google Fonts ve dış istek yok`, !ty.google && dis.length === 0);
  k(`tipografi (${renk}): gövde Inter, 300, satır aralığı 1,65`, /^"?Inter/.test(ty.aile) && ty.agirlik === '300' && Math.abs(ty.satir - 1.65) < 0.01 && ty.yuklu);
  k(`tipografi (${renk}): düğmeler en çok 500`, ty.dugme.length > 0 && ty.dugme.every((w) => w <= 500));
  k(`tipografi (${renk}): menü öğeleri en çok 500`, ty.menu.length > 0 && ty.menu.every((w) => w <= 500));
  k(`tipografi (${renk}): başlıklar 500`, ty.baslik.length > 0 && ty.baslik.every((w) => w === 500));
  await c4.close();
}
await t.close(); console.log(h.length ? 'KALAN: ' + h.join(', ') : 'Hepsi geçti.'); process.exit(h.length ? 1 : 0);
