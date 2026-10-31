// A kuralı (tablo sayfalama) ve B kuralı (kart başlığı, kapsam satırı, "i" açıklaması) için tarayıcı testi.
// Kullanım: yerel wrangler dev (YEREL_GIRIS=evet) → node tools/test-tablo-kart.mjs <ekran klasörü> [panel adresi]
import { createRequire } from 'module';
const { chromium } = createRequire(import.meta.url)('playwright');
const SS = process.argv[2] || '.', B = process.argv[3] || 'http://panel.localhost:8795';
const t = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--host-resolver-rules=MAP panel.localhost 127.0.0.1'] });
const s = await t.newPage({ viewport: { width: 1280, height: 900 } });
const h = []; s.on('pageerror', (e) => h.push('JS: ' + e.message));
const k = (ad, x) => { console.log((x ? 'GEÇTİ ' : 'KALDI ') + ad); if (!x) h.push(ad); };
const api = (yol, govde) => s.evaluate(async ([yol, govde]) => { const r = await fetch('/api/yonetim/' + yol, govde === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(govde) }); return r.status; }, [yol, govde]);
await s.goto(B + '/dashboard');
for (let i = 1; i <= 12; i++) await api('musteriler', { firma: 'Sayfalama Deneme ' + String(i).padStart(2, '0'), eposta: `s${i}@ornek.example` });

// A: CRM listesi 12 kart → varsayılan 5 satır
await s.goto(B + '/crm');
await s.click('[data-gorunum="liste"]');
await s.waitForSelector('main table tbody tr');
await s.waitForSelector('.tablo-sayfa');
const gor = () => s.$$eval('main table tbody tr', (r) => r.filter((x) => getComputedStyle(x).display !== 'none').length);
const aralik = () => s.textContent('.tablo-sayfa .ts-aralik');
k('varsayılan 5 satır', (await gor()) === 5 && (await aralik()) === '1–5 / 12');
k('seçenekler 5/10/25/50/100/200', (await s.$$eval('.tablo-sayfa select option', (o) => o.map((x) => x.value).join())) === '5,10,25,50,100,200');
await s.click('.tablo-sayfa [aria-label="Sonraki sayfa"]');
k('sonraki sayfa 6–10', (await aralik()) === '6–10 / 12' && (await gor()) === 5);
await s.selectOption('.tablo-sayfa select', '10');
k('10 satır seçilince ilk sayfa 1–10', (await aralik()) === '1–10 / 12' && (await gor()) === 10);
await s.screenshot({ path: SS + '/tablo-sayfa.png' });
await s.reload(); await s.waitForSelector('.tablo-sayfa');
k('seçim yenilemede hatırlanır', (await aralik()) === '1–10 / 12');
await s.fill('[data-ara]', 'Deneme 1'); await s.waitForTimeout(400);
const sonra = await s.$('.tablo-sayfa');
k('arama tüm veride: 3 sonuç, çubuk gizli', (await gor()) === 3 && !sonra);
await s.fill('[data-ara]', ''); await s.waitForTimeout(400);
k('arama temizlenince 1–10 / 12', (await aralik()) === '1–10 / 12');
k('yazdırırken tüm satırlar', await s.evaluate(() => { const st = [...document.styleSheets].flatMap((x) => { try { return [...x.cssRules]; } catch { return []; } }); return st.some((r) => r.media && r.media.mediaText.includes('print') && r.cssText.includes('data-sayfa-gizli')); }));

// B: dashboard kartları
await s.goto(B + '/dashboard');
await s.waitForSelector('.kart-i');
const iSay = await s.$$eval('main .kart-i', (b) => b.length);
k('dashboard: 8 kartta i simgesi', iSay === 8);
k('başlık bilgilendirici ve kapsam satırı', (await s.textContent('[data-m="huni"]')).includes('Satış hunisi: CRM aşamaları') && (await s.textContent('[data-m="huni"] .kart-alt')).includes('Tüm CRM kartları'));
const ilk = await s.$('[data-m="huni"] .kart-i');
k('i düğmesi erişilebilir adlı', ((await ilk.getAttribute('aria-label')) || '').startsWith('Açıklama: Satış hunisi'));
await ilk.click();
k('i açıklamayı açar', (await ilk.getAttribute('aria-expanded')) === 'true' && await s.isVisible('[data-m="huni"] .kart-i-metin'));
await s.screenshot({ path: SS + '/kart-i.png' });
await ilk.press('Escape');
k('Esc kapatır', (await ilk.getAttribute('aria-expanded')) === 'false' && !(await s.isVisible('[data-m="huni"] .kart-i-metin')));

// Müşteri kartı: form (data-bilgi) eskisi gibi çalışır; kapsam satırında müşteri adı
const id = await s.evaluate(async () => (await (await fetch('/api/yonetim/musteriler')).json()).musteriler[0].id);
await s.goto(B + '/customer?id=' + id);
await s.waitForSelector('form[data-bilgi] [name=firma]');
await s.waitForFunction(() => document.querySelector('form[data-bilgi] [name=firma]').value !== '');
k('müşteri: kapsam satırlarında müşteri adı', (await s.$$eval('.kart-alt [data-baslik]', (x) => x.map((e) => e.textContent))).filter((x) => x.includes('Sayfalama Deneme')).length === 3);
k('müşteri: formda i düğmesi yok', (await s.$$('form .kart-i')).length === 0);
await s.fill('form[data-bilgi] [name=sektor]', 'Deneme sektörü ' + Date.now());
await s.click('form[data-bilgi] button[type=submit]');
await s.waitForSelector('[data-bilgi-durum]:not([hidden])');
k('müşteri: bilgi formu kaydeder', (await s.textContent('[data-bilgi-durum]')).includes('Kaydedildi'));
await t.close(); console.log(h.length ? 'KALAN: ' + h.join(', ') : 'Hepsi geçti.'); process.exit(h.length ? 1 : 0);
