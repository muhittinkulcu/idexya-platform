// Teklif PDF yükleme (worker/teklif-dosya.js): şema, yetki, PDF imzası, boyut sınırı, aşama kuralı, açma başlıkları,
// silme ve yedek temizliğinin teklif önekine dokunmaması. Sunucu gerekmez: D1 yerine node:sqlite, R2 yerine bellek içi depo.
// Kullanım: node tools/test-teklif-dosya.mjs
import { DatabaseSync } from 'node:sqlite';
import { build } from 'esbuild';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { yedekAl } from '../worker/yedek.js';
import { tutarKurus, pdfImzasi, yeniAsama, ONEK } from '../worker/teklif-dosya.js';

// worker/index.js JSON veri dosyalarını içe aktarır; Node bunu doğrudan yükleyemediği için önce esbuild ile paketlenir.
const paket = await build({ entryPoints: [new URL('../worker/index.js', import.meta.url).pathname], bundle: true, format: 'esm', platform: 'neutral', mainFields: ['module', 'main'], write: false, logLevel: 'silent' });
const gecici = join(mkdtempSync(join(tmpdir(), 'teklif-dosya-')), 'worker.mjs');
writeFileSync(gecici, paket.outputFiles[0].text);
const worker = (await import(gecici)).default;

const h = [];
const k = (ad, x) => { console.log((x ? 'GEÇTİ ' : 'KALDI ') + ad); if (!x) h.push(ad); };

// --- Sahte D1 ---
function sahteD1() {
  const s = new DatabaseSync(':memory:');
  const temiz = (p) => p.map((v) => (v === undefined ? null : typeof v === 'boolean' ? Number(v) : v));
  const duz = (r) => (r ? { ...r } : null);
  class Ifade {
    constructor(sql, p = []) { this.sql = sql; this.p = p; }
    bind(...p) { return new Ifade(this.sql, p); }
    async first() { return duz(s.prepare(this.sql).get(...temiz(this.p))); }
    async all() { return { results: s.prepare(this.sql).all(...temiz(this.p)).map(duz) }; }
    async run() { const r = s.prepare(this.sql).run(...temiz(this.p)); return { meta: { changes: Number(r.changes) } }; }
  }
  return {
    ham: s,
    prepare: (sql) => new Ifade(sql),
    async batch(l) {
      s.exec('BEGIN');
      try {
        const c = [];
        for (const i of l) c.push(/^\s*(SELECT|PRAGMA|WITH)\b/i.test(i.sql) || /RETURNING/i.test(i.sql) ? await i.all() : await i.run());
        s.exec('COMMIT');
        return c;
      } catch (e) { s.exec('ROLLBACK'); throw e; }
    }
  };
}

// --- Sahte R2 ---
function sahteR2() {
  const m = new Map();
  return {
    m,
    async put(a, v, o = {}) { const b = v instanceof ArrayBuffer ? new Uint8Array(v) : new Uint8Array(v); m.set(a, { b, o, z: new Date() }); },
    async get(a) { const x = m.get(a); return x ? { body: new Blob([x.b]).stream(), size: x.b.byteLength } : null; },
    async delete(a) { (Array.isArray(a) ? a : [a]).forEach((x) => m.delete(x)); },
    async list({ prefix = '' } = {}) { return { objects: [...m.entries()].filter(([a]) => a.startsWith(prefix)).map(([a, x]) => ({ key: a, size: x.b.byteLength, uploaded: x.z, customMetadata: x.o.customMetadata || {} })) }; }
  };
}

const B = 'http://localhost';
const db = sahteD1(), r2 = sahteR2();
const env = { DB: db, YEDEK: r2, YEREL_GIRIS: 'evet' };
const istek = (yol, o = {}) => worker.fetch(new Request(B + '/api/yonetim/' + yol, o), o.env || env, {});
const post = (yol, govde, ek = {}) => istek(yol, { method: 'POST', headers: { origin: B, 'content-type': 'application/json', ...(ek.headers || {}) }, body: JSON.stringify(govde), env: ek.env });
const PDF = new TextEncoder().encode('%PDF-1.7\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n');
function form(alan = {}, dosya = PDF, ad = 'kasim-teklif.pdf', tip = 'application/pdf') {
  const f = new FormData();
  if (dosya) f.append('dosya', new Blob([dosya], { type: tip }), ad);
  for (const [a, v] of Object.entries({ ad: 'Kasım dijital paket teklifi', tarih: '2026-11-10', gecerlilik: '2026-11-24', tutar: '45.000,00', durum: 'gonderildi', asama: '1', ...alan })) f.append(a, v);
  return f;
}
const yukle = (f, o = {}) => istek('teklif-dosyalari', { method: 'POST', headers: { origin: o.origin || B, ...(o.headers || {}) }, body: f, env: o.env });
const asama = (id) => db.ham.prepare('SELECT asama FROM musteriler WHERE id = ?').get(id).asama;

// Şema kurulsun diye ilk istek
k('liste boşken 200', (await istek('teklif-dosyalari')).status === 200);
const sutun = db.ham.prepare('PRAGMA table_info(teklif_dosyalari)').all().map((x) => x.name);
k('şema: teklif_dosyalari sütunları', ['id', 'musteri_id', 'ad', 'tarih', 'gecerlilik', 'tutar_kurus', 'durum', 'dosya_anahtari', 'dosya_adi', 'boyut', 'olusturan', 'olusturma', 'guncelleme'].every((x) => sutun.includes(x)));
k('şema: teklifler tablosu değişmedi (panel teklifi akışı)', db.ham.prepare('PRAGMA table_info(teklifler)').all().every((x) => !['dosya_anahtari', 'kaynak'].includes(x.name)));

// Müşteriler
const z = new Date().toISOString();
const ekleM = (id, a) => db.ham.prepare("INSERT INTO musteriler (id, olusturma, guncelleme, kaynak, firma, asama) VALUES (?, ?, ?, 'elle', ?, ?)").run(id, z, z, 'Örnek ' + id, a);
ekleM('m-yeni', 'yeni'); ekleM('m-ileri', 'goruldu'); ekleM('m-kayip', 'kaybedildi');

// Yardımcılar
k('tutar: "45.000,00" → 4500000 kuruş', tutarKurus('45.000,00') === 4500000);
k('tutar: "1250,5" → 125050', tutarKurus('1250,5') === 125050);
k('tutar: boş → null (bilinmeyen)', tutarKurus('') === null);
k('tutar: "abc" geçersiz', Number.isNaN(tutarKurus('abc')));
k('imza: %PDF- kabul', pdfImzasi(PDF));
k('imza: PNG reddedilir', !pdfImzasi(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d])));
k('aşama: ileri aşama geri alınmaz (goruldu → teklif yok)', yeniAsama('goruldu', 'teklif') === null && yeniAsama('kazanildi', 'teklif') === null && yeniAsama('kaybedildi', 'teklif') === null);
k('aşama: yeni / görüşülüyor → teklif', yeniAsama('yeni', 'teklif') === 'teklif' && yeniAsama('gorusme', 'teklif') === 'teklif');

// Yetki
const yetkisiz = { DB: db, YEDEK: r2 };
k('oturumsuz liste 401', (await istek('teklif-dosyalari/musteri/m-yeni', { env: yetkisiz })).status === 401);
k('oturumsuz yükleme 401', (await yukle(form({ musteri_id: 'm-yeni' }), { env: yetkisiz })).status === 401);
k('oturumsuz dosya açma 401', (await istek('teklif-dosyalari/x/dosya', { env: yetkisiz })).status === 401);
k('başka kaynaktan yükleme 403', (await yukle(form({ musteri_id: 'm-yeni' }), { origin: 'https://kotu.example' })).status === 403);
k('kaynak başlığı olmadan yükleme 403', (await istek('teklif-dosyalari', { method: 'POST', body: form({ musteri_id: 'm-yeni' }) })).status === 403);

// Doğrulama
let r = await yukle(form({ musteri_id: 'm-yeni' }, new TextEncoder().encode('<html>PDF değil</html>'), 'sahte.pdf', 'application/pdf'));
k('uzantısı .pdf, MIME pdf ama içerik PDF değil → 415', r.status === 415 && /PDF değil/.test((await r.json()).hata));
k('reddedilen dosya depoya yazılmadı', ![...r2.m.keys()].some((a) => a.startsWith(ONEK)));
const buyuk = new Uint8Array(20 * 1024 * 1024 + 1); buyuk.set(PDF.slice(0, 8));
r = await yukle(form({ musteri_id: 'm-yeni' }, buyuk));
k('20 MB üstü → 413', r.status === 413);
r = await yukle(form({ musteri_id: 'm-yeni' }), { headers: { 'content-length': String(25 * 1024 * 1024) } });
k('content-length 25 MB → 413 (gövde okunmadan)', r.status === 413);
k('müşteri yoksa 404', (await yukle(form({ musteri_id: 'yok' }))).status === 404);
k('ad boşsa 422', (await yukle(form({ musteri_id: 'm-yeni', ad: '' }))).status === 422);
k('tarih geçersizse 422', (await yukle(form({ musteri_id: 'm-yeni', tarih: '10.11.2026' }))).status === 422);
k('tutar geçersizse 422', (await yukle(form({ musteri_id: 'm-yeni', tutar: '12abc' }))).status === 422);
k('dosya yoksa 422', (await yukle(form({ musteri_id: 'm-yeni' }, null))).status === 422);

// R2 bağlı değil
const depsuz = { DB: db, YEREL_GIRIS: 'evet' };
r = await yukle(form({ musteri_id: 'm-yeni' }), { env: depsuz });
const rj = await r.json();
k('R2 yokken yükleme 409 ve Türkçe açıklama', r.status === 409 && /R2/.test(rj.hata) && /yüklenemez/.test(rj.hata));
r = await istek('teklif-dosyalari/musteri/m-yeni', { env: depsuz });
k('R2 yokken liste çalışır (depo: false)', r.status === 200 && (await r.json()).depo === false);

// Geçerli yükleme: aşama Yeni → Teklif gönderildi, günlük ve işlem kaydı
r = await yukle(form({ musteri_id: 'm-yeni' }));
const y1 = await r.json();
k('geçerli PDF yüklendi (200)', r.status === 200 && y1.ok && y1.id);
const kay = db.ham.prepare('SELECT * FROM teklif_dosyalari WHERE id = ?').get(y1.id);
k('anahtar teklif-dosyalari/<musteri>/<id>.pdf', kay.dosya_anahtari === `teklif-dosyalari/m-yeni/${y1.id}.pdf` && r2.m.has(kay.dosya_anahtari));
k('tutar kuruş, KDV hariç', kay.tutar_kurus === 4500000 && kay.boyut === PDF.byteLength);
k('aşama Yeni → Teklif gönderildi', asama('m-yeni') === 'teklif');
const gun1 = db.ham.prepare("SELECT tur, baslik, detay FROM kayitlar WHERE musteri_id = 'm-yeni' ORDER BY rowid").all();
k('günlükte teklif ve aşama kaydı', gun1.some((x) => x.tur === 'teklif' && /dosya yüklendi/.test(x.baslik)) && gun1.some((x) => x.baslik === 'Aşama değişti' && /Yeni → Teklif gönderildi/.test(x.detay)));
k('işlem kaydı yazıldı', !!db.ham.prepare("SELECT 1 FROM islem_kaydi WHERE islem = 'teklif_dosyasi_yukle' AND hedef = ?").get(y1.id));

// İleri aşama geri alınmaz
r = await yukle(form({ musteri_id: 'm-ileri' }));
const y2 = await r.json();
k('ileri aşamadaki kart (Teklif görüldü) geri alınmadı', r.status === 200 && asama('m-ileri') === 'goruldu');
k('ileri aşamada günlüğe yine yazıldı, aşama kaydı yok', db.ham.prepare("SELECT COUNT(*) AS n FROM kayitlar WHERE musteri_id = 'm-ileri' AND tur = 'teklif'").get().n === 1 && !db.ham.prepare("SELECT 1 FROM kayitlar WHERE musteri_id = 'm-ileri' AND baslik = 'Aşama değişti'").get());
r = await yukle(form({ musteri_id: 'm-kayip', asama: '1' }));
k('Kaybedildi kartı Teklif gönderildi yapılmadı', r.status === 200 && asama('m-kayip') === 'kaybedildi');

// Kutu işaretli değilse aşama ve günlük değişmez
ekleM('m-kutusuz', 'gorusme');
r = await yukle(form({ musteri_id: 'm-kutusuz', asama: '0' }));
k('kutu işaretsiz: aşama değişmedi, günlük yok', r.status === 200 && asama('m-kutusuz') === 'gorusme' && !db.ham.prepare("SELECT 1 FROM kayitlar WHERE musteri_id = 'm-kutusuz'").get());
// Taslak olarak yüklenen teklif "gönderildi" sayılmaz
ekleM('m-taslak', 'yeni');
r = await yukle(form({ musteri_id: 'm-taslak', durum: 'taslak', asama: '1', tutar: '' }));
const yT = await r.json();
k('taslak yükleme: aşama değişmedi, tutar bilinmiyor (null)', r.status === 200 && asama('m-taslak') === 'yeni' && db.ham.prepare('SELECT tutar_kurus FROM teklif_dosyalari WHERE id = ?').get(yT.id).tutar_kurus === null);

// Liste
r = await istek('teklif-dosyalari/musteri/m-yeni');
const l = await r.json();
k('müşteriye göre liste yalnız o müşterinin dosyası', l.dosyalar.length === 1 && l.dosyalar[0].id === y1.id && !('dosya_anahtari' in l.dosyalar[0]));
k('genel liste tüm dosyalar', (await (await istek('teklif-dosyalari')).json()).dosyalar.length === 5);

// Aç: başlıklar ve içerik
r = await istek(`teklif-dosyalari/${y1.id}/dosya`);
const govde = new Uint8Array(await r.arrayBuffer());
k('aç: 200, application/pdf', r.status === 200 && r.headers.get('content-type') === 'application/pdf');
k('aç: Content-Disposition inline', /^inline;/.test(r.headers.get('content-disposition') || ''));
k('aç: X-Content-Type-Options nosniff', r.headers.get('x-content-type-options') === 'nosniff');
k('aç: önbelleğe alınmaz', /no-store/.test(r.headers.get('cache-control') || ''));
k('aç: içerik aynı', govde.byteLength === PDF.byteLength && govde.every((b, i) => b === PDF[i]));
k('aç: bilinmeyen kimlik 404', (await istek('teklif-dosyalari/yok/dosya')).status === 404);

// Durum: Kabul edildi → Kazanıldı
r = await post(`teklif-dosyalari/${y2.id}/durum`, { durum: 'kabul' });
k('durum kabul: aşama Kazanıldı', r.status === 200 && asama('m-ileri') === 'kazanildi');
k('durum kabul: günlük ve işlem kaydı', !!db.ham.prepare("SELECT 1 FROM kayitlar WHERE musteri_id = 'm-ileri' AND baslik = 'Teklif kabul edildi'").get() && !!db.ham.prepare("SELECT 1 FROM islem_kaydi WHERE islem = 'teklif_dosyasi_durum' AND hedef = ?").get(y2.id));
r = await post(`teklif-dosyalari/${y2.id}/durum`, { durum: 'gonderildi' });
k('kazanılan kart sonradan Teklif gönderildi yapılmadı', r.status === 200 && asama('m-ileri') === 'kazanildi');
k('geçersiz durum 422', (await post(`teklif-dosyalari/${y2.id}/durum`, { durum: 'uydurma' })).status === 422);
k('durum değişimi başka kaynaktan 403', (await post(`teklif-dosyalari/${y2.id}/durum`, { durum: 'red' }, { headers: { origin: 'https://kotu.example' } })).status === 403);

// Sil
r = await post(`teklif-dosyalari/${y1.id}/sil`, {});
k('gönderilmiş teklif onaysız silinmez (409)', r.status === 409 && r2.m.has(kay.dosya_anahtari));
r = await post(`teklif-dosyalari/${y1.id}/sil`, { onay: true });
k('onayla silindi; R2 nesnesi de silindi', r.status === 200 && !r2.m.has(kay.dosya_anahtari) && !db.ham.prepare('SELECT 1 FROM teklif_dosyalari WHERE id = ?').get(y1.id));
const tAnahtar = db.ham.prepare('SELECT dosya_anahtari FROM teklif_dosyalari WHERE id = ?').get(yT.id).dosya_anahtari;
r = await post(`teklif-dosyalari/${yT.id}/sil`, {});
k('taslak onaysız silinir', r.status === 200 && !r2.m.has(tAnahtar));
k('silme işlem kaydında', db.ham.prepare("SELECT COUNT(*) AS n FROM islem_kaydi WHERE islem = 'teklif_dosyasi_sil'").get().n === 2);

// Yedek temizliği yalnız yedek/ önekine dokunur
const kalan = [...r2.m.keys()].filter((a) => a.startsWith(ONEK));
await r2.put('yedek/2020-01-01.json.gz', new Uint8Array([1, 2, 3]));
await r2.put(`${ONEK}m-eski/2020-01-01.pdf`, PDF); // adı tarih gibi görünen eski bir teklif dosyası
const y = await yedekAl(env, 'test');
k('yedek alındı', r2.m.has(y.anahtar) && y.anahtar.startsWith('yedek/'));
k('30 günden eski yedek silindi', !r2.m.has('yedek/2020-01-01.json.gz'));
k('yedek temizliği teklif dosyalarına dokunmadı', kalan.every((a) => r2.m.has(a)) && r2.m.has(`${ONEK}m-eski/2020-01-01.pdf`));
r = await istek('yedek');
k('yedek listesinde teklif dosyası görünmez', (await r.json()).yedekler.every((x) => x.anahtar.startsWith('yedek/')));

console.log(h.length ? `\n${h.length} KALDI:\n` + h.join('\n') : '\nTüm kontroller geçti.');
process.exit(h.length ? 1 : 0);
