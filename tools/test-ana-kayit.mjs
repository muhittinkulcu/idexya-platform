// Uçtan uca: müşteri ana kaydı (IDOS) önbelleği, eşitleme ve müşteri kartındaki salt okuma bloğu.
// Yerel `wrangler dev` (YEREL_GIRIS=evet, IDOS_ORTAK_URL sahte sunucuya) + node tools/sahte/idos-ortak.mjs üzerinde çalışır.
// Kullanım: node tools/test-ana-kayit.mjs <panel adresi> <sahte IDOS adresi> <ekran klasörü> <persist klasörü>
import { createRequire } from 'module';
import { execFileSync } from 'child_process';
const { chromium } = createRequire(import.meta.url)('playwright');
const B = process.argv[2] || 'http://panel.localhost:8795';
const IDOS = process.argv[3] || 'http://127.0.0.1:8799';
const SS = process.argv[4] || '.';
const DB = process.argv[5];
const h = [];
const kontrol = (ad, kosul) => { console.log((kosul ? 'GEÇTİ ' : 'KALDI ') + ad); if (!kosul) h.push('KALDI ' + ad); };
const sql = (q) => execFileSync('npx', ['wrangler', 'd1', 'execute', 'DB', '--local', '--persist-to', DB, '--json', '--command', q], { encoding: 'utf8' });
const t = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--host-resolver-rules=MAP panel.localhost 127.0.0.1'] });
const s = await t.newPage({ viewport: { width: 1280, height: 900 } });
s.on('pageerror', (e) => h.push('JS: ' + e.message));
const api = (yol, govde) => s.evaluate(async ([yol, govde]) => {
  const r = await fetch('/api/yonetim/' + yol, govde === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(govde) });
  return { durum: r.status, veri: await r.json() };
}, [yol, govde]);

await s.goto(B + '/dashboard');
const a = await api('musteriler', { firma: 'Deneme Kart A', eposta: 'a@ornek.example' });
const b = await api('musteriler', { firma: 'Deneme Kart B', eposta: 'b@ornek.example' });
const c = await api('musteriler', { firma: 'Deneme Kart C', eposta: 'c@ornek.example' });
kontrol('kartlar açıldı', a.durum === 200 && b.durum === 200 && c.durum === 200);
const [A, Bk, C] = [a.veri.musteri_id, b.veri.musteri_id, c.veri.musteri_id];

let d = await api('ana-kayit/durum');
kontrol('başta önbellek boş, kurulu', d.veri.kurulu === true && d.veri.onbellek === 0 && d.veri.son_esitleme === null);
let e = await api('ana-kayit/esitle', {});
kontrol('ilk eşitleme tam ve 2 kayıt', e.durum === 200 && e.veri.tam === true && e.veri.gelen === 2);
d = await api('ana-kayit/durum');
kontrol('önbellekte 2 kayıt', d.veri.onbellek === 2 && !!d.veri.son_esitleme);

let k = await api(`musteriler/${A}/ana-kayit`);
kontrol('bağsız kart: bagli=false', k.durum === 200 && k.veri.bagli === false);

sql(`UPDATE musteriler SET ana_kayit_id = 'm-1' WHERE id = '${A}'; UPDATE musteriler SET ana_kayit_id = 'm-2' WHERE id = '${Bk}'; UPDATE musteriler SET ana_kayit_id = 'm-9' WHERE id = '${C}'`);
k = await api(`musteriler/${A}/ana-kayit`);
kontrol('bağlı kart önbellekten okunur', k.veri.bagli && k.veri.kayit && k.veri.kayit.marka === 'Örnek Marka A' && k.veri.eski === false);
kontrol('javascript: bağlantısı atılır', k.veri.kayit.sosyal.google_isletme === null && k.veri.kayit.sosyal.instagram === 'https://instagram.com/ornek');
kontrol('düzenle bağlantısı https', k.veri.duzenle === 'https://idos.example/clients/m-1');

await s.goto(B + '/customer?id=' + A);
await s.waitForSelector('[data-ana-kayit]:not([hidden]) strong');
const metin = await s.textContent('[data-ana-kayit]');
kontrol('blok: marka, durum, sorumlu', metin.includes('Örnek Marka A') && metin.includes('Aktif') && metin.includes('ekip@idexya.example'));
kontrol('blok: arşiv hesap sayılmaz', metin.includes('Meta reklam hesabı: 2') && metin.includes('Google Ads hesabı: 1'));
kontrol('blok: bilinmeyen değer —', metin.includes('Search Console: —'));
kontrol('blokta düzenleme alanı yok', (await s.$$('[data-ana-kayit] input, [data-ana-kayit] select, [data-ana-kayit] textarea')).length === 0);
await s.screenshot({ path: SS + '/ana-kayit-bagli.png', fullPage: false });

await s.goto(B + '/customer?id=' + Bk);
await s.waitForSelector('[data-ana-kayit]:not([hidden]) strong');
const mB = await s.textContent('[data-ana-kayit]');
kontrol('pasif müşteri, boş alanlar —', mB.includes('Pasif') && mB.includes('Sorumlu: —') && mB.includes('Sektör: —'));

k = await api(`musteriler/${C}/ana-kayit`);
kontrol('IDOS\'ta olmayan bağ: yok=true', k.veri.yok === true);

// Artımlı eşitleme: IDOS'ta silinen müşteri önbellekten kalkar.
await fetch(IDOS + '/__sil/m-2', { method: 'POST' });
e = await api('ana-kayit/esitle', {});
kontrol('artımlı eşitleme silineni kaldırır', e.veri.tam === false && e.veri.silinen === 1);
d = await api('ana-kayit/durum');
kontrol('önbellekte 1 kayıt', d.veri.onbellek === 1);

// Birleştirme koruması: farklı ana kayda bağlı kartlar birleştirilmez.
sql(`UPDATE musteriler SET ana_kayit_id = 'm-2' WHERE id = '${Bk}'`);
const bir = await api('crm/cakisma/birlestir', { tut: A, birlestir: [Bk] });
kontrol('farklı ana kayıt birleştirilmez (409)', bir.durum === 409);

// IDOS kapalı: eski önbellek "eski" işaretiyle döner; tam eşitleme önbelleği bozmaz.
sql(`UPDATE ana_musteri SET cekim = '2000-01-01T00:00:00.000Z' WHERE musteri_id = 'm-1'`);
await fetch(IDOS + '/__kapat', { method: 'POST' });
k = await api(`musteriler/${A}/ana-kayit`);
kontrol('IDOS kapalı: önbellek eski işaretli', k.veri.kayit && k.veri.kayit.marka === 'Örnek Marka A' && k.veri.eski === true && !!k.veri.hata);
e = await api('ana-kayit/esitle', { tam: true });
kontrol('IDOS kapalı: eşitleme hata verir', e.durum === 502);
d = await api('ana-kayit/durum');
kontrol('önbellek korunur, hata kaydedilir', d.veri.onbellek === 1 && !!d.veri.son_hata);
await s.goto(B + '/customer?id=' + A);
await s.waitForSelector('[data-ana-kayit]:not([hidden]) strong');
kontrol('ekranda eski veri uyarısı', (await s.textContent('[data-ana-kayit]')).includes('ulaşılamadı'));
await s.screenshot({ path: SS + '/ana-kayit-eski.png', fullPage: false });

await t.close();
console.log(h.length ? '\n' + h.join('\n') : '\nHepsi geçti.');
process.exit(h.length ? 1 : 0);
