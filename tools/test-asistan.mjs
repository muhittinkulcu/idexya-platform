// Asistan uçtan uca: yapay zekâ kapalıyken yedek akış ve (sahte API ile) soru-yanıt, onay kartı, talebin panele düşmesi.
// Kullanım: node tools/test-asistan.mjs <kapali-adres> <acik-adres>
import { createRequire } from 'module';
const { chromium } = createRequire(import.meta.url)('playwright');
const [KAPALI, ACIK] = process.argv.slice(2);
const t = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const h = []; const kontrol = (ad, k) => { console.log((k ? 'GEÇTİ ' : 'KALDI ') + ad); if (!k) h.push(ad); };
const sayfa = async (B, g = 1280) => { const c = await t.newContext({ viewport: { width: g, height: 860 } }); await c.addInitScript(() => { try { localStorage.setItem('idx-cerez', JSON.stringify({ zorunlu: true, zaman: Date.now() })); } catch (e) {} }); const s = await c.newPage(); s.on('pageerror', (e) => h.push('JS ' + e.message)); await s.goto(B + '/'); const r = await s.$('[data-cerez="red"]'); if (r && await r.isVisible()) await r.click(); return s; };
if (KAPALI) {
  const s = await sayfa(KAPALI);
  await s.click('.as-dugme'); await s.waitForSelector('.as-panel:not([hidden])');
  await s.fill('.as-form textarea', 'Merhaba'); await s.keyboard.press('Enter');
  await s.waitForSelector('.as-liste >> text=otomatik yanıtlayamıyorum');
  kontrol('anahtar yokken yedek yanıt ve WhatsApp', !!(await s.$('.as-liste a[href^="https://wa.me"]')));
}
if (ACIK) {
  const s = await sayfa(ACIK);
  await s.click('.as-dugme');
  await s.click('.as-cip >> text=Hangi paket bana uygun?');
  await s.waitForSelector('.as-asistan >> text=Size uygun seçenekler');
  kontrol('yanıt madde listesiyle', (await s.$$('.as-asistan li')).length >= 2);
  kontrol('yanıttaki HTML çalışmaz', !(await s.evaluate(() => window.__xss)));
  kontrol('site içi bağlantı tıklanır', !!(await s.$('.as-asistan a[href="/tr/paketler"]')));
  await s.screenshot({ path: process.env.SS + '/as-yanit.png' });
  await s.fill('.as-form textarea', 'Google Ads için teklif istiyorum, adım Sohbet Deneme, sohbet@ornek.com'); await s.keyboard.press('Enter');
  await s.waitForSelector('.as-kart');
  kontrol('onay kartı dolu geldi', (await s.inputValue('.as-kart [name=eposta]')) === 'sohbet@ornek.com');
  await s.click('.as-kart-gonder');
  kontrol('KVKK onaysız gönderilmez', (await s.textContent('.as-kart [data-form-durum]')).includes('KVKK'));
  await s.check('.as-kart [name=kvkk]'); await s.click('.as-kart-gonder');
  await s.waitForSelector('.as-asistan >> text=talebiniz ekibimize ulaştı');
  await s.screenshot({ path: process.env.SS + '/as-kart.png' });
  const talepler = await s.evaluate(async () => (await (await fetch('/api/yonetim/talepler')).json()).talepler);
  kontrol('talep panele asistan kaynağıyla düştü', talepler.some((x) => x.kaynak === 'asistan' && x.eposta === 'sohbet@ornek.com'));
  const so = await s.evaluate(async () => (await (await fetch('/api/yonetim/asistan')).json()));
  kontrol('sohbet kaydı panelde', so.sohbetler.length >= 1 && so.sohbetler[0].mesaj >= 4);
  await s.reload(); await s.waitForSelector('.as-panel:not([hidden])');
  kontrol('sayfa yenilenince sohbet sürer', (await s.textContent('.as-liste')).includes('talebiniz ekibimize ulaştı'));
  const m = await sayfa(ACIK, 390);
  await m.click('.as-dugme'); await m.waitForTimeout(300);
  kontrol('390px tam ekran ve taşma yok', (await m.evaluate(() => document.querySelector('.as-panel').getBoundingClientRect().width)) === 390 && (await m.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0);
  await m.screenshot({ path: process.env.SS + '/as-390.png' });
}
console.log(h.length ? 'SORUNLAR:\n' + h.join('\n') : 'Tüm kontroller geçti, JS hatası yok.');
await t.close(); process.exit(h.length ? 1 : 0);
