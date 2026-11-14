// Tema ve yazı (ortak kabuk Görünüm paneli: Açık · Koyu · Otomatik; kalınlık; yazı tipi): varsayılan, saklama, ilk boyama,
// eski panel kaydının taşınması (public/panel-gorunum.js), mobil, tipografi.
// Kullanım: yerel wrangler dev (YEREL_GIRIS=evet, port 8795) → node tools/test-tema.mjs <ekran klasörü> [panel adresi]
// Tarayıcı: PW_CHROMIUM (yoksa /opt/pw-browsers/chromium).
import { createRequire } from 'module';
const { chromium } = createRequire(import.meta.url)('playwright');
const SS = process.argv[2] || '.', B = process.argv[3] || 'http://panel.localhost:8795';
const t = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium', args: ['--host-resolver-rules=MAP panel.localhost 127.0.0.1'] });
const h = []; const k = (ad, x) => { console.log((x ? 'GEÇTİ ' : 'KALDI ') + ad); if (!x) h.push(ad); };
const hazir = (s) => s.waitForSelector('idexya-kabuk.ik .ik-ust');
const durum = (s) => s.evaluate(() => ({ tema: document.documentElement.dataset.tema, secim: document.documentElement.dataset.temaSecim, kayit: localStorage.getItem('idx-gorunum') }));
const gorunumAc = async (s) => { await s.click('.ik-arac [aria-controls=ik-gorunum]'); await s.waitForSelector('#ik-gorunum:not([hidden])'); };
const ILK = () => document.addEventListener('readystatechange', () => { if (document.readyState === 'interactive') window.__ilk = document.documentElement.dataset.tema; });

// 1) Varsayılan: Otomatik; cihaz koyu → koyu, açık → açık. İlk boyamada doğru tema (yanıp sönme yok): DOMContentLoaded öncesi.
for (const [renk, bek] of [['dark', 'koyu'], ['light', 'acik']]) {
  const c = await t.newContext({ colorScheme: renk, viewport: { width: 1280, height: 800 } }); const s = await c.newPage();
  await s.addInitScript(ILK);
  await s.goto(B + '/dashboard'); await hazir(s);
  const d = await durum(s);
  k(`otomatik varsayılan, cihaz ${renk} → ${bek}`, d.secim === 'oto' && d.tema === bek);
  k(`ilk boyamada tema hazır (${renk})`, (await s.evaluate(() => window.__ilk)) === bek);
  await s.emulateMedia({ colorScheme: renk === 'dark' ? 'light' : 'dark' });
  await s.waitForTimeout(200);
  k(`otomatik: cihaz ayarı değişince izler (${renk})`, (await durum(s)).tema === (bek === 'koyu' ? 'acik' : 'koyu'));
  await c.close();
}
// 2) Görünüm panelinde Koyu / Açık seçimi saklanır, yenilemede kalır.
const c = await t.newContext({ colorScheme: 'light', viewport: { width: 1280, height: 800 } }); const s = await c.newPage();
await s.goto(B + '/dashboard'); await hazir(s);
await gorunumAc(s); await s.click('#ik-gorunum [data-tema=koyu]');
k('koyu seçildi', (await durum(s)).tema === 'koyu');
await s.screenshot({ path: SS + '/tema-koyu.png' });
await s.reload(); await hazir(s);
let d = await durum(s); k('koyu yenilemede kalır', d.tema === 'koyu' && d.secim === 'koyu' && JSON.parse(d.kayit).tema === 'koyu');
await gorunumAc(s);
k('Görünüm panelinde Koyu basılı', (await s.getAttribute('#ik-gorunum [data-tema=koyu]', 'aria-pressed')) === 'true');
await s.click('#ik-gorunum [data-tema=acik]'); k('açık seçildi', (await durum(s)).tema === 'acik');
await s.screenshot({ path: SS + '/tema-acik.png' });
// 3) Kalınlık seçimi sayfa içeriğinde de geçerli (üç modülde ortak seçim).
await gorunumAc(s); await s.click('#ik-gorunum [data-kalinlik=dengeli]');
k('Dengeli: içerik gövdesi 400', (await s.evaluate(() => getComputedStyle(document.querySelector('.yonetim')).fontWeight)) === '400');
await s.click('#ik-gorunum [data-kalinlik=zarif]');
k('Zarif (varsayılan): içerik gövdesi 350', (await s.evaluate(() => getComputedStyle(document.querySelector('.yonetim')).fontWeight)) === '350');
// 4) Eski kayıt bir kez taşınır: idx-tema-secim (acik|koyu|sistem|saat) ve daha eski idx-tema=koyu.
for (const [anahtar, deger, bek] of [['idx-tema-secim', 'koyu', 'koyu'], ['idx-tema-secim', 'saat', 'oto'], ['idx-tema-secim', 'sistem', 'oto'], ['idx-tema', 'koyu', 'koyu']]) {
  const c2 = await t.newContext({ colorScheme: 'light' }); const s2 = await c2.newPage();
  await s2.addInitScript(([a, v]) => { try { if (!sessionStorage.getItem('x')) { localStorage.setItem(a, v); localStorage.setItem('idx-panel', '{}'); sessionStorage.setItem('x', '1'); } } catch {} }, [anahtar, deger]);
  await s2.addInitScript(ILK);
  await s2.goto(B + '/dashboard'); await hazir(s2);
  d = await durum(s2);
  const kalan = await s2.evaluate(() => ['idx-tema-secim', 'idx-panel', 'idx-sekmeler', 'idx-cam'].filter((x) => localStorage.getItem(x) !== null));
  k(`eski ${anahtar}=${deger} → idx-gorunum ${bek}, ilk boyamada doğru, eski anahtarlar silindi`, d.secim === bek && JSON.parse(d.kayit).tema === bek && (await s2.evaluate(() => window.__ilk)) === (bek === 'oto' ? 'acik' : bek) && kalan.length === 0);
  await c2.close();
}
// 5) Mobil: yatay taşma yok, Görünüm düğmesi görünür.
const c3 = await t.newContext({ viewport: { width: 375, height: 760 }, colorScheme: 'dark' }); const s3 = await c3.newPage();
await s3.goto(B + '/dashboard'); await hazir(s3);
k('mobilde yatay taşma yok', await s3.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
k('mobilde Görünüm düğmesi görünür', await s3.isVisible('.ik-arac [aria-controls=ik-gorunum]'));
await s3.screenshot({ path: SS + '/tema-mobil-koyu.png' });
// 6) İnce ve ferah tipografi (Muhittin, 12 ve 14 Kas 2026): Inter yerel dosyadan, dış yazı tipi isteği yok; gövde kabuğun
//    kalınlığıyla (Zarif 350), satır aralığı 1,65; düğme, menü ve başlıklar en çok 500 (600 ve üstü yok). Açık ve koyu temada aynı.
for (const renk of ['light', 'dark']) {
  const c4 = await t.newContext({ colorScheme: renk, viewport: { width: 1280, height: 800 } }); const s4 = await c4.newPage();
  const dis = []; s4.on('request', (r) => { const u = new URL(r.url()); if (!['panel.localhost', '127.0.0.1', 'localhost'].includes(u.hostname)) dis.push(u.hostname); });
  await s4.goto(B + '/dashboard'); await hazir(s4); await s4.waitForLoadState('networkidle');
  const ty = await s4.evaluate(async () => {
    await document.fonts.ready;
    const yuzler = []; let google = !!document.querySelector('link[href*="fonts.googleapis.com"],link[href*="fonts.gstatic.com"]');
    for (const ss of document.styleSheets) { let kurallar = []; try { kurallar = [...ss.cssRules]; } catch { google = google || /googleapis|gstatic/.test(ss.href || ''); continue; }
      for (const r of kurallar) { if (r.constructor.name === 'CSSFontFaceRule') yuzler.push([r.style.getPropertyValue('font-family'), r.style.getPropertyValue('src')]); if (/googleapis|gstatic/.test(r.cssText)) google = true; } }
    const k = getComputedStyle(document.querySelector('.yonetim')); const ag = (q) => [...document.querySelectorAll(q)].map((e) => Number(getComputedStyle(e).fontWeight));
    return { yuzler, google, agirlik: k.fontWeight, satir: parseFloat(k.lineHeight) / parseFloat(k.fontSize), aile: k.fontFamily,
      dugme: ag('.dugme, .ik-dugme'), menu: ag('.ik-yan a, .ik-yan button, .ik-katman-ad, .ik-sekme a'), baslik: ag('.ik-sayfa-bas h1, .yonetim h2'),
      yuklu: [...document.fonts].some((f) => f.family.replace(/"/g, '') === 'Inter' && f.status === 'loaded') };
  });
  const interYerel = ty.yuzler.filter(([a, src]) => /Inter/.test(a) && /\/fonts\/inter-/.test(src));
  k(`tipografi (${renk}): @font-face Inter yerel /fonts/inter- yolundan`, interYerel.length >= 6);
  k(`tipografi (${renk}): Google Fonts ve dış istek yok`, !ty.google && dis.length === 0);
  k(`tipografi (${renk}): gövde Inter, 350 (Zarif), satır aralığı 1,65`, /^"?Inter/.test(ty.aile) && ty.agirlik === '350' && Math.abs(ty.satir - 1.65) < 0.01 && ty.yuklu);
  k(`tipografi (${renk}): düğmeler en çok 500`, ty.dugme.length > 0 && ty.dugme.every((w) => w <= 500));
  k(`tipografi (${renk}): menü öğeleri en çok 500`, ty.menu.length > 0 && ty.menu.every((w) => w <= 500));
  k(`tipografi (${renk}): başlıklar en çok 500`, ty.baslik.length > 0 && ty.baslik.every((w) => w <= 500));
  await c4.close();
}
await t.close(); console.log(h.length ? 'KALAN: ' + h.join(', ') : 'Hepsi geçti.'); process.exit(h.length ? 1 : 0);
