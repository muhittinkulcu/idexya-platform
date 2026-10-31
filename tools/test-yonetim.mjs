// Uçtan uca: site formu → Talepler → CRM'e al → müşteri kartı (not, aşama, bilgi). Yerel `wrangler dev` (YEREL_GIRIS=evet) üzerinde çalışır.
import { createRequire } from 'module';
const { chromium } = createRequire(import.meta.url)('playwright');
const B = process.argv[2] || 'http://127.0.0.1:8787';
const SS = process.argv[3] || '.';
const t = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const s = await t.newPage({ viewport: { width: 1440, height: 900 } });
const h = []; s.on('pageerror', (e) => h.push('JS: ' + e.message)); s.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('ERR_TUNNEL')) h.push('konsol: ' + m.text()); });
const kontrol = (ad, kosul) => { console.log((kosul ? 'GEÇTİ ' : 'KALDI ') + ad); if (!kosul) h.push('KALDI ' + ad); };

for (const [yol, ad, ek] of [['/tr/iletisim', 'İletişim Deneme', {}], ['/', 'Analiz Deneme', { site: 'https://ornek.com' }], ['/tr/paketler', 'Paket Deneme', {}]]) {
  await s.goto(B + yol);
  const c = await s.$('[data-cerez="red"]'); if (c && await c.isVisible()) await c.click();
  // Sayfada gizli talep formları da var (çekmece menüsü, hızlı talep penceresi): görünür olan işaretlenir.
  await s.$$eval('form[data-talep]', (fs) => { const g = fs.find((x) => x.getClientRects().length && x.querySelector('button[type=submit]').getBoundingClientRect().width > 0); if (g) g.dataset.testForm = '1'; });
  const f = 'form[data-test-form]';
  await s.click(f + ' button[type=submit]');
  kontrol(yol + ' boş form uyarı verir', (await s.textContent(f + ' [data-form-durum]')).includes('adınızı'));
  await s.fill(f + ' [name=ad]', ad);
  await s.fill(f + ' [name=eposta]', ad.split(' ')[0].toLowerCase() + '@ornek.com');
  await s.fill(f + ' [name=telefon]', '0555 111 22 33');
  if (ek.site) await s.fill(f + ' [name=site]', ek.site);
  await s.check(f + ' [name=kvkk]');
  await s.click(f + ' button[type=submit]');
  await s.waitForFunction((f) => document.querySelector(f + ' [data-form-durum]').textContent.includes('Teşekkürler'), f, { timeout: 5000 }).catch(() => {});
  kontrol(yol + ' form gönderildi', (await s.textContent(f + ' [data-form-durum]')).includes('Teşekkürler'));
}

await s.goto(B + '/yonetim/');
await s.waitForSelector('[data-kpi] .kart');
kontrol('genel bakış: 3 yeni talep', (await s.textContent('[data-kpi]')).includes('3'));
kontrol('menü rozeti 3', (await s.textContent('[data-sayac="talep"]')) === '3');
await s.screenshot({ path: SS + '/y-genel.png', fullPage: true });

await s.goto(B + '/yonetim/talepler/');
await s.waitForSelector('[data-ayrinti] strong');
await s.screenshot({ path: SS + '/y-talepler.png', fullPage: true });
await s.click('[data-ayrinti] >> text="CRM’e al"');
await s.waitForSelector('text=Müşteri kartı oluşturuldu');
kontrol('talep CRM’e alındı', true);
await s.click('[data-sekmeler] button:first-child');
await s.click('[data-ayrinti] >> text="Spam olarak ayır"');
await s.waitForTimeout(400);
kontrol('spam sekmesinde 1', (await s.textContent('[data-sekmeler]')).includes('Spam 1'));

await s.goto(B + '/yonetim/crm/');
await s.waitForSelector('[data-alan] article');
await s.screenshot({ path: SS + '/y-crm.png', fullPage: true });
await s.click('[data-alan] article a');
await s.waitForSelector('[data-gunluk] li strong');
kontrol('müşteri kartı günlüğünde talep var', (await s.textContent('[data-gunluk]')).includes('Talep geldi'));
await s.click('[data-tur] >> text=Görüşme');
await s.fill('[data-not] textarea', 'Telefonla görüşüldü, teklif istiyor.');
await s.click('text=Günlüğe ekle');
await s.waitForSelector('text=Telefonla görüşüldü, teklif istiyor.');
kontrol('not eklendi', true);
await s.click('[aria-label=Aşama] >> text=Teklif gönderildi');
await s.waitForSelector('text=Yeni → Teklif gönderildi');
kontrol('aşama değişti ve günlüğe işlendi', true);
await s.fill('[data-bilgi] [name=deger]', '18000');
await s.click('text=Bilgileri kaydet');
await s.waitForSelector('text=Kaydedildi ve günlüğe işlendi.');
kontrol('bilgi kaydedildi', !!(await s.waitForSelector('[data-ust] >> text=18.000 TL', { timeout: 5000 }).catch(() => null)));
kontrol('günlükte Türkçe alan adı', (await s.textContent('[data-gunluk]')).includes('Tahmini değer') && (await s.textContent('[data-gunluk]')).includes('Yeni → Teklif gönderildi'));
await s.screenshot({ path: SS + '/y-musteri.png', fullPage: true });

// XSS: mesajdaki HTML yazı olarak görünmeli, çalışmamalı
await s.evaluate(async () => { await fetch('/api/talep', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ad: '<img src=x onerror=window.__xss=1>', eposta: 'x@ornek.com', kvkk: true }) }); });
await s.goto(B + '/yonetim/talepler/');
await s.waitForSelector('[data-ayrinti] strong');
kontrol('HTML enjeksiyonu çalışmadı', !(await s.evaluate(() => window.__xss)));

for (const [g, ad] of [[390, 'mobil'], [768, 'tablet']]) {
  await s.setViewportSize({ width: g, height: 900 });
  for (const y of ['/yonetim/', '/yonetim/talepler/', '/yonetim/crm/']) {
    await s.goto(B + y); await s.waitForTimeout(500);
    const tas = await s.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    kontrol(`${ad} ${y} yatay taşma yok (${tas})`, tas <= 0);
  }
}
await s.setViewportSize({ width: 390, height: 900 }); await s.goto(B + '/yonetim/crm/'); await s.waitForTimeout(500);
await s.screenshot({ path: SS + '/y-crm-390.png', fullPage: true });
console.log(h.length ? 'SORUNLAR:\n' + h.join('\n') : 'Tüm kontroller geçti, JS hatası yok.');
await t.close();
process.exit(h.length ? 1 : 0);
