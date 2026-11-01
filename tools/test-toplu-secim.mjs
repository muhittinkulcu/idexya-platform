// Toplu seçim ve bağlantı kuralı: Müşteriler (CRM listesi), Siteler (kart listesi), Reklam tablosu.
// Kullanım: wrangler dev (YEREL_GIRIS=evet, IDOS_BQ_ANAHTAR ve IDOS_BQ_GORUNUM sahte değerle) →
//   node tools/test-toplu-secim.mjs <ekran klasörü> <persist klasörü> [panel adresi]
import { createRequire } from 'module';
import { execFileSync } from 'child_process';
import { readFileSync } from 'fs';
const { chromium } = createRequire(import.meta.url)('playwright');
const SS = process.argv[2] || '.', DB = process.argv[3], B = process.argv[4] || 'http://panel.localhost:8795';
const sql = (q) => JSON.parse(execFileSync('npx', ['wrangler', 'd1', 'execute', 'DB', '--local', '--persist-to', DB, '--json', '--command', q], { encoding: 'utf8' }))[0].results;
const t = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--host-resolver-rules=MAP panel.localhost 127.0.0.1'] });
const c = await t.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
const s = await c.newPage();
const h = []; s.on('pageerror', (e) => h.push('JS: ' + e.message));
const k = (ad, x) => { console.log((x ? 'GEÇTİ ' : 'KALDI ') + ad); if (!x) h.push(ad); };
const api = (yol, govde) => s.evaluate(async ([yol, govde]) => { const r = await fetch('/api/yonetim/' + yol, govde === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(govde) }); return { durum: r.status, veri: await r.json() }; }, [yol, govde]);
const bekle = (ms) => s.waitForTimeout(ms);
let onay = 0; s.on('dialog', (d) => { onay++; d.accept(); });

await s.goto(B + '/dashboard');
const ids = [];
for (let i = 1; i <= 12; i++) ids.push((await api('musteriler', { firma: (i === 1 ? '=HYPERLINK("x")' : 'Toplu Deneme ') + String(i).padStart(2, '0'), eposta: `t${i}@ornek.example` })).veri.musteri_id);
await api(`musteriler/${ids[1]}/bilgi`, { firma: 'Toplu Deneme 02', deger: '5000' });

// --- Müşteriler
await s.goto(B + '/crm');
await s.click('[data-gorunum="liste"]');
await s.waitForSelector('main table [aria-label="Tümünü seç"]');
k('CRM: başlıkta "Tümünü seç", her satırda kutu', (await s.$$('main table tbody tr td.toplu-hucre input')).length === 12);
k('CRM: seçim yokken çubuk gizli', await s.isHidden('.toplu-cubuk'));
await s.check('main table [aria-label="Tümünü seç"]');
k('CRM: tümünü seç sayfalanan satırlar dâhil 12', (await s.textContent('.toplu-cubuk .toplu-sayi')).includes('12'));
await s.uncheck('main table [aria-label="Tümünü seç"]');
const satirKutu = (id) => `main table tbody tr[data-id="${id}"] td.toplu-hucre input`;
await s.selectOption('.tablo-sayfa select', '25');
await s.check(satirKutu(ids[0])); await s.check(satirKutu(ids[1]));
k('CRM: 2 seçili, çubuk açık', (await s.textContent('.toplu-cubuk .toplu-sayi')).includes('2') && await s.isVisible('.toplu-cubuk'));
await s.screenshot({ path: SS + '/toplu-crm.png' });
// CSV: onay kutusu sütunu yok, formül korunur
const [ind] = await Promise.all([s.waitForEvent('download'), s.click('.toplu-cubuk button:has-text("CSV indir")')]);
const csv = readFileSync(await ind.path(), 'utf8');
const sat = csv.trim().split('\r\n');
k('CSV: BOM, başlık + 2 satır, ilk sütun Müşteri', csv.charCodeAt(0) === 0xfeff && sat.length === 3 && sat[0].replace(/^\ufeff/, '').startsWith('"Müşteri"'));
k('CSV: açılır listeden yalnız seçili değer', sat[1].includes('"Yeni"') && !sat[1].includes('Görüşülüyor'));
k('CSV: formül hücresi korunur', csv.includes(`"'=HYPERLINK`));
// Durum değiştir
await s.selectOption('.toplu-cubuk select', 'gorusme');
await s.click('.toplu-cubuk button:has-text("Uygula")');
await s.waitForFunction(() => (document.querySelector('.toplu-cubuk .toplu-mesaj') || {}).textContent?.includes('Görüşülüyor'));
const a2 = sql(`SELECT asama FROM musteriler WHERE id IN ('${ids[0]}','${ids[1]}')`).map((x) => x.asama);
k('CRM: toplu aşama yazıldı', a2.every((x) => x === 'gorusme'));
k('CRM: kart günlüğüne işlendi', sql(`SELECT COUNT(*) AS n FROM kayitlar WHERE musteri_id = '${ids[0]}' AND baslik = 'Aşama değişti (toplu)'`)[0].n === 1);
// Etiket
await s.check(satirKutu(ids[2])); await s.check(satirKutu(ids[3]));
await s.fill('.toplu-cubuk input[type=text]', 'Öncelikli');
await s.click('.toplu-cubuk button:has-text("Etiket ekle")');
await s.waitForFunction((id) => document.querySelector(`main table tbody tr[data-id="${id}"]`)?.textContent.includes('Öncelikli'), ids[2]);
k('CRM: etiket eklendi ve satırda görünür', sql(`SELECT COUNT(*) AS n FROM etiketler WHERE tur = 'musteri' AND etiket = 'Öncelikli'`)[0].n === 2);
await s.check(satirKutu(ids[3]));
await s.fill('.toplu-cubuk input[type=text]', 'Öncelikli');
await s.click('.toplu-cubuk button:has-text("Etiketi kaldır")');
await bekle(800);
k('CRM: etiket kaldırıldı', sql(`SELECT COUNT(*) AS n FROM etiketler WHERE tur = 'musteri' AND etiket = 'Öncelikli'`)[0].n === 1);
// Arşivle (onay ister)
await s.check(satirKutu(ids[4])); await s.check(satirKutu(ids[5]));
const once = onay;
await s.click('.toplu-cubuk button:has-text("Arşivle")');
await s.waitForFunction(() => document.querySelector('[data-arsiv]').textContent.includes('(2)'));
k('CRM: arşivleme onay sordu', onay === once + 1);
k('CRM: arşivlenen listeden kalktı, silinmedi', (await s.$$('main table tbody tr')).length === 10 && sql(`SELECT COUNT(*) AS n FROM musteriler WHERE arsiv IS NOT NULL`)[0].n === 2);
const oz = await api('ozet');
k('CRM: genel bakış sayısı arşivi saymaz', oz.veri.musteri.n === 10);
k('CRM: silme düğmesi yok', (await s.$$('.toplu-cubuk button:has-text("Sil")')).length === 0);
await s.click('[data-arsiv]');
await s.waitForFunction(() => document.querySelector('[data-arsiv]').textContent.includes('Arşivden çık'));
await s.check('main table [aria-label="Tümünü seç"]');
await s.click('.toplu-cubuk button:has-text("Arşivden çıkar")');
await bekle(800);
k('CRM: arşivden çıkarıldı', sql(`SELECT COUNT(*) AS n FROM musteriler WHERE arsiv IS NOT NULL`)[0].n === 0);
// Bağlantı kuralı
await s.click('[data-arsiv]'); await s.waitForSelector('main table tbody tr');
const deger = await s.$(`main table tbody tr[data-id="${ids[1]}"] td:nth-child(5) a`);
k('Bağlantı: değer kartına gider', deger && (await deger.getAttribute('href')).includes(ids[1]));
const yok = await s.$(`main table tbody tr[data-id="${ids[2]}"] td:nth-child(5) a`);
k('Bağlantı: değer yoksa düz "—"', !yok);
k('Bağlantı: son hareket kartına gider', !!(await s.$(`main table tbody tr[data-id="${ids[2]}"] td:nth-child(6) a[href*="${ids[2]}"]`)));

// --- Siteler (kart listesi)
for (const n of [1, 2, 3]) await api('site-saglik', { musteri_id: ids[n], adres: `https://site${n}.ornek.example/` });
await s.goto(B + '/client-sites');
await s.waitForSelector('.toplu-tumu input');
k('Siteler: kart başına kutu ve "Tümünü seç"', (await s.$$('[data-liste] .toplu-kart-kutu input')).length === 3);
k('Siteler: "Kaldır" yok, "Arşivle" var', (await s.$$('button:text-is("Kaldır")')).length === 0 && (await s.$$('[data-liste] button:has-text("Arşivle")')).length === 3);
k('Bağlantı: site kartında müşteri adı kartına gider', !!(await s.$(`[data-liste] a[href="/customer?id=${ids[1]}"]`)));
await s.check('.toplu-tumu input');
await s.selectOption('.toplu-cubuk select', 'durdur');
await s.click('.toplu-cubuk button:has-text("Uygula")');
await bekle(800);
k('Siteler: toplu durdur', sql(`SELECT COUNT(*) AS n FROM site_saglik_hedef WHERE aktif = 0`)[0].n === 3);
await s.check('.toplu-tumu input');
await s.fill('.toplu-cubuk input[type=text]', 'Bakımda');
await s.click('.toplu-cubuk button:has-text("Etiket ekle")');
await bekle(800);
k('Siteler: etiket', sql(`SELECT COUNT(*) AS n FROM etiketler WHERE tur = 'site'`)[0].n === 3);
await s.screenshot({ path: SS + '/toplu-siteler.png' });
await s.check(`[data-liste] [data-id] .toplu-kart-kutu input >> nth=0`);
const [ind2] = await Promise.all([s.waitForEvent('download'), s.click('.toplu-cubuk button:has-text("CSV indir")')]);
const csv2 = readFileSync(await ind2.path(), 'utf8').trim().split('\r\n');
k('Siteler: CSV başlık + 1 satır, etiket dâhil', csv2.length === 2 && csv2[1].includes('Bakımda'));
await s.click('.toplu-cubuk button:has-text("Arşivle")');
await bekle(800);
k('Siteler: arşivlendi, kontrol geçmişi silinmedi', sql(`SELECT COUNT(*) AS n FROM site_saglik_hedef WHERE arsiv IS NOT NULL`)[0].n === 1 && (await s.$$('[data-liste] [data-id]')).length === 2);
const bas = await api(`site-saglik/${sql(`SELECT id FROM site_saglik_hedef WHERE arsiv IS NOT NULL`)[0].id}/baslat`, {});
k('Siteler: arşivdeki site başlatılamaz (409)', bas.durum === 409);

// --- Reklam tablosu (yalnız CSV ve hesap etiketi; reklam hesabına yazmaz)
const g = (n) => new Date(Date.now() + 3 * 3600000 - n * 86400000).toISOString().slice(0, 10);
sql(`INSERT INTO reklam_ozet (gun, platform, hesap, para, harcama, gosterim, tiklama) VALUES ('${g(1)}','meta','111','TRY',100,1000,10),('${g(2)}','meta','111','TRY',50,500,5),('${g(1)}','google','2223334444','TRY',80,800,8);
  INSERT INTO reklam_cekim (id, zaman, durum, satir, baslangic, mesaj, tetikleyen) VALUES ('c1','${new Date().toISOString()}','tamam',3,'${g(28)}',NULL,'test')`);
await s.goto(B + '/dashboard');
await s.waitForSelector('.rt table [aria-label="Tümünü seç"]', { timeout: 15000 });
await s.click('.rt-sekmeler [role=tab]:has-text("Hesaplar")');
await s.waitForSelector('.rt table tbody tr[data-id="meta:111"]');
await s.check('.rt table tbody tr[data-id="meta:111"] td.toplu-hucre input');
const rtCubuk = await s.$$eval('.toplu-cubuk:not([hidden]) button', (b) => b.map((x) => x.textContent));
k('Reklam: çubukta CSV ve etiket var, durum/arşiv yok', rtCubuk.includes('CSV indir') && rtCubuk.includes('Etiket ekle') && !rtCubuk.includes('Arşivle') && !rtCubuk.includes('Uygula'));
await s.fill('.toplu-cubuk input[type=text]', 'Test hesabı');
await s.click('.toplu-cubuk button:has-text("Etiket ekle")');
await s.waitForFunction(() => document.querySelector('.rt tr[data-id="meta:111"]')?.textContent.includes('Test hesabı'));
k('Reklam: hesap etiketi eklendi ve görünür', sql(`SELECT hedef FROM etiketler WHERE tur = 'reklam_hesap'`)[0].hedef === 'meta:111');
const [ind3] = await Promise.all([s.waitForEvent('download'), s.click('.rt-arac button:has-text("CSV indir")')]);
const csv3 = readFileSync(await ind3.path(), 'utf8');
k('Reklam: genel CSV onay kutusu sütunu içermez', csv3.replace(/^\ufeff/, '').startsWith('"Müşteri / marka"'));
await s.screenshot({ path: SS + '/toplu-reklam.png' });
await t.close(); console.log(h.length ? 'KALAN: ' + h.join(', ') : 'Hepsi geçti.'); process.exit(h.length ? 1 : 0);
