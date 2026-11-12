// Belge şablonları ve hizmet kataloğu (worker/belge-sablon.js, src/scripts/yonetim/sablon-hesap.js): şema ve tohum,
// sürüm kaydetmenin eskiyi silmemesi, sayfa görseli imza/boyut/oran denetimi, yetki, yedek temizliğinin şablon önekine
// dokunmaması, katalog ekle/düzenle/pasif, tutar (kuruş) hesabı ve tarayıcıda üretilen PDF'in yapısı.
// Sunucu gerekmez: D1 yerine node:sqlite, R2 yerine bellek içi depo. Kullanım: node tools/test-sablon.mjs
import { DatabaseSync } from 'node:sqlite';
import { build } from 'esbuild';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { gunzipSync } from 'node:zlib';
import { join } from 'node:path';
import { yedekAl } from '../worker/yedek.js';
import { gorselTuru, gorselBoyutu, sayfalariDenetle, TEKLIF_V1, TOHUM_HIZMET, GORSEL_ONEK } from '../worker/belge-sablon.js';
import { kurusOku, toplamlar, teklifTutari, tlBelge, tlTam, tarihUzun, tarihKisa, kapakBasligi, satirYerlesimi, HIZMET_DUZEN, KALEM_DUZEN, jpegBilgi, pdfOlustur } from '../src/scripts/yonetim/sablon-hesap.js';

const paket = await build({ entryPoints: [new URL('../worker/index.js', import.meta.url).pathname], bundle: true, format: 'esm', platform: 'neutral', mainFields: ['module', 'main'], write: false, logLevel: 'silent' });
const gecici = join(mkdtempSync(join(tmpdir(), 'sablon-')), 'worker.mjs');
writeFileSync(gecici, paket.outputFiles[0].text);
const worker = (await import(gecici)).default;

const h = [];
const k = (ad, x) => { console.log((x ? 'GEÇTİ ' : 'KALDI ') + ad); if (!x) h.push(ad); };

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
      try { const c = []; for (const i of l) c.push(/^\s*(SELECT|PRAGMA|WITH)\b/i.test(i.sql) ? await i.all() : await i.run()); s.exec('COMMIT'); return c; }
      catch (e) { s.exec('ROLLBACK'); throw e; }
    }
  };
}
function sahteR2() {
  const m = new Map();
  return {
    m,
    async put(a, v, o = {}) { m.set(a, { b: new Uint8Array(v instanceof ArrayBuffer ? v : v), o, z: new Date() }); },
    async get(a) { const x = m.get(a); return x ? { body: new Blob([x.b]).stream(), size: x.b.byteLength, httpMetadata: x.o.httpMetadata || {} } : null; },
    async head(a) { const x = m.get(a); return x ? { size: x.b.byteLength } : null; },
    async delete(a) { (Array.isArray(a) ? a : [a]).forEach((x) => m.delete(x)); },
    async list({ prefix = '' } = {}) { return { objects: [...m.entries()].filter(([a]) => a.startsWith(prefix)).map(([a, x]) => ({ key: a, size: x.b.byteLength, uploaded: x.z, customMetadata: x.o.customMetadata || {} })) }; }
  };
}

const B = 'http://localhost';
const db = sahteD1(), r2 = sahteR2();
const env = { DB: db, YEDEK: r2, YEREL_GIRIS: 'evet' };
const istek = (yol, o = {}) => worker.fetch(new Request(B + '/api/yonetim/' + yol, o), o.env || env, {});
const post = (yol, govde, ek = {}) => istek(yol, { method: 'POST', headers: { origin: B, 'content-type': 'application/json', ...(ek.headers || {}) }, body: JSON.stringify(govde), env: ek.env });
const jsn = async (r) => ({ d: r.status, ...(await r.json()) });

// Sahte görseller: yalnız başlık (imza + boyut) yeterli
function jpeg(en, boy, bilesen = 3) {
  return new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00,
    0xff, 0xc0, 0x00, 0x11, 0x08, boy >> 8, boy & 255, en >> 8, en & 255, bilesen, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1, 0xff, 0xd9]);
}
function png(en, boy) {
  const b = new Uint8Array(33); b.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52]);
  new DataView(b.buffer).setUint32(16, en); new DataView(b.buffer).setUint32(20, boy); return b;
}
function gform(dosya, sayfa = 3, ad = 'sayfa.jpg', tip = 'image/jpeg') {
  const f = new FormData(); if (dosya) f.append('dosya', new Blob([dosya], { type: tip }), ad); f.append('sayfa', String(sayfa)); return f;
}
const gYukle = (f, o = {}) => istek(`belge-sablonlari/${o.id || 'teklif'}/gorsel`, { method: 'POST', headers: { origin: o.origin || B, ...(o.headers || {}) }, body: f, env: o.env });

// --- Şema ve tohum ---
let r = await jsn(await istek('belge-sablonlari'));
k('şablon listesi 200', r.d === 200 && r.ok);
for (const [t, sut] of [['belge_sablonlari', ['id', 'tur', 'ad', 'durum', 'aktif_surum']], ['belge_sablon_surumleri', ['sablon_id', 'surum', 'sayfalar', 'olusturan', 'olusturma']], ['hizmet_katalogu', ['id', 'ad', 'tur', 'varsayilan_fiyat_kurus', 'simge', 'sira', 'aktif']]]) {
  const v = db.ham.prepare(`PRAGMA table_info(${t})`).all().map((x) => x.name);
  k(`şema: ${t} sütunları`, sut.every((x) => v.includes(x)));
}
k('şema: teklif_dosyalari.kaynak sütunu', db.ham.prepare('PRAGMA table_info(teklif_dosyalari)').all().some((x) => x.name === 'kaynak'));
const durumu = (id) => (r.sablonlar.find((s) => s.id === id) || {}).durum;
k('12 şablon: teklif + 4 metin şablonu hazır, sözleşme taslak, 6 önerilen yeni kart', r.sablonlar.length === 12 && durumu('teklif') === 'hazir'
  && ['erisim', 'odeme_hatirlatma', 'fiyat_guncelleme', 'teslim'].every((i) => durumu(i) === 'hazir') && durumu('sozlesme') === 'taslak'
  && ['brief', 'ek_is', 'icerik_onay', 'hesap_devir', 'gizlilik', 'rapor_kapagi'].every((i) => durumu(i) === 'onerilen') && r.sablonlar.filter((s) => s.durum === 'onerilen').length === 6);
k('hazır ve taslak şablonların sürüm 1 içeriği var', ['erisim', 'odeme_hatirlatma', 'fiyat_guncelleme', 'teslim', 'sozlesme'].every((i) => r.sablonlar.find((s) => s.id === i).aktif_surum === 1));
const kat = (await jsn(await istek('hizmet-katalogu'))).hizmetler;
const BEKLENEN = [['Google Reklam Yönetimi', 'aylik', 2000000], ['Meta Reklam Yönetimi', 'aylik', 2000000], ['SEO Yönetimi', 'aylik', null], ['Sosyal Medya İçerik Yönetimi', 'aylik', null],
  ['Online Pazaryeri Yönetimi', 'aylik', null], ['Kurumsal Website Tasarımı', 'tek_seferlik', null], ['E-Ticaret Website Tasarımı', 'tek_seferlik', null], ['Web Sitesi Programlama ve Yazılım Bedeli', 'tek_seferlik', null]];
k('tohum: 8 hizmet', kat.length === 8);
k('tohum: ad, tür ve fiyat muhasebe listesiyle aynı (sırasıyla)', BEKLENEN.every(([ad, tur, f], i) => kat[i] && kat[i].ad === ad && kat[i].tur === tur && kat[i].varsayilan_fiyat_kurus === f));
k('tohum: eski adlar yok', !kat.some((x) => /Grafik|SEO Optimizasyonu|E-Ticaret Yönetimi|^Pazaryeri Yönetimi|^Sosyal Medya Yönetimi/.test(x.ad)));
k('tohum: Google ve Meta marka simgeli, diğerleri sade', kat[0].simge === 'google' && kat[1].simge === 'meta' && kat.slice(2).every((x) => x.simge === 'genel'));
{ // Tohum yalnız tablo boşken: ayrı modül örneğiyle (önbellek bayrağı sıfır) yeniden çalıştırılır
  const yeni = sahteD1();
  for (const s of (await import('../worker/sema.js')).SEMA) yeni.ham.exec(s);
  const m1 = await import('../worker/belge-sablon.js?ilk');
  await m1.sablonTohumla(yeni);
  k('ayrı veritabanında tohum 8 hizmet', yeni.ham.prepare('SELECT COUNT(*) AS n FROM hizmet_katalogu').get().n === 8);
  yeni.ham.exec("DELETE FROM hizmet_katalogu WHERE id = 'seo'"); yeni.ham.exec("UPDATE hizmet_katalogu SET ad = 'Google Ads', aktif = 0 WHERE id = 'google-reklam'");
  const m2 = await import('../worker/belge-sablon.js?ikinci');
  await m2.sablonTohumla(yeni);
  k('tablo doluyken tohum yazılmaz (silinen geri gelmez, düzenlenen ezilmez)', yeni.ham.prepare('SELECT COUNT(*) AS n FROM hizmet_katalogu').get().n === 7
    && yeni.ham.prepare("SELECT ad, aktif FROM hizmet_katalogu WHERE id = 'google-reklam'").get().ad === 'Google Ads');
  yeni.ham.exec('DELETE FROM hizmet_katalogu');
  await (await import('../worker/belge-sablon.js?ucuncu')).sablonTohumla(yeni);
  k('tablo boşalınca tohum yeniden yazılır', yeni.ham.prepare('SELECT COUNT(*) AS n FROM hizmet_katalogu').get().n === 8);
}

// --- Sürümler ---
r = await jsn(await istek('belge-sablonlari/teklif'));
k('teklif sürüm 1: 7 sayfa', r.surum && r.surum.surum === 1 && r.surum.sayfalar.length === 7);
k('teklif sayfa tipleri: kapak, 3 sabit, hizmetler, kalemler, sabit', r.surum.sayfalar.map((s) => s.tip).join() === 'kapak,sabit,sabit,sabit,hizmetler,kalemler,sabit');
const v2 = structuredClone(r.surum.sayfalar); v2[0].metinler.baslik = '{FIRMA} - TEKLİF'; v2[5].metinler.aylik_isaret = '(aylık)';
r = await jsn(await post('belge-sablonlari/teklif/surum', { sayfalar: v2 }));
k('sürüm kaydı → sürüm 2', r.d === 200 && r.surum === 2);
let s1 = await jsn(await istek('belge-sablonlari/teklif/surum/1'));
k('sürüm 1 silinmedi ve değişmedi', s1.d === 200 && s1.surum.sayfalar[0].metinler.baslik === '{FIRMA} - PROJE TEKLİFİ');
let s = await jsn(await istek('belge-sablonlari/teklif'));
k('aktif sürüm 2, 2 sürüm listede', s.sablon.aktif_surum === 2 && s.surumler.length === 2 && s.surum.sayfalar[0].metinler.baslik === '{FIRMA} - TEKLİF');
k('sürüm kaydı işlem kaydında', db.ham.prepare("SELECT COUNT(*) AS n FROM islem_kaydi WHERE islem = 'sablon_surum_kaydet'").get().n === 1);
k('olmayan sürüm 404', (await istek('belge-sablonlari/teklif/surum/99')).status === 404);
k('olmayan şablon 404', (await istek('belge-sablonlari/yok')).status === 404);
k('önerilen şablona sürüm kaydı 409', (await post('belge-sablonlari/brief/surum', { sayfalar: v2 })).status === 409);
const kotu = (deg) => { const x = structuredClone(v2); deg(x); return post('belge-sablonlari/teklif/surum', { sayfalar: x }); };
k('dış adresli görsel reddedilir 422', (await kotu((x) => { x[1].gorsel = 'https://kotu.example/a.jpg'; })).status === 422);
k('üst klasöre çıkan görsel yolu reddedilir 422', (await kotu((x) => { x[1].gorsel = '/yonetim/veri/sablon/../../gizli.jpg'; })).status === 422);
k('başka şablonun R2 görseli reddedilir 422', (await kotu((x) => { x[1].gorsel = 'sablon/sozlesme/1/2.jpg'; })).status === 422);
k('depoda olmayan R2 görseli reddedilir 422', (await kotu((x) => { x[1].gorsel = 'sablon/teklif/3/2.jpg'; })).status === 422);
k('geçersiz sayfa tipi 422', (await kotu((x) => { x[1].tip = 'html'; })).status === 422);
k('alan ölçüsü sayfa dışı 422', (await kotu((x) => { x[0].alanlar.baslik.y = 99999; })).status === 422);
k('boş sayfa listesi 422', (await post('belge-sablonlari/teklif/surum', { sayfalar: [] })).status === 422);
k('reddedilen kayıtlar sürüm üretmedi', db.ham.prepare("SELECT COUNT(*) AS n FROM belge_sablon_surumleri WHERE sablon_id = 'teklif'").get().n === 2);
k('denetim: denetim çıktısı yalnız bilinen alanları taşır', JSON.stringify(sayfalariDenetle([{ ...TEKLIF_V1[0], fazla: '<script>' }], 'teklif').sayfalar[0]).indexOf('fazla') === -1);

// --- Sayfa görseli ---
k('imza: JPEG', gorselTuru(jpeg(1654, 2339)) === 'jpg');
k('imza: PNG', gorselTuru(png(1654, 2339)) === 'png');
k('imza: PDF ve GIF reddedilir', gorselTuru(new TextEncoder().encode('%PDF-1.4')) === null && gorselTuru(new TextEncoder().encode('GIF89a')) === null);
k('boyut: JPEG SOF ve PNG IHDR okunur', JSON.stringify(gorselBoyutu(jpeg(1654, 2339))) === JSON.stringify({ boy: 2339, en: 1654 }) && gorselBoyutu(png(1240, 1754)).en === 1240);
r = await jsn(await gYukle(gform(jpeg(1654, 2339), 2)));
k('JPEG yükleme 200, anahtar sablon/teklif/3/2.jpg', r.d === 200 && r.anahtar === 'sablon/teklif/3/2.jpg' && r2.m.has('sablon/teklif/3/2.jpg'));
k('görsel yükleme işlem kaydında', db.ham.prepare("SELECT COUNT(*) AS n FROM islem_kaydi WHERE islem = 'sablon_gorsel_yukle'").get().n === 1);
r = await jsn(await gYukle(gform(png(1240, 1754), 4, 's.png', 'image/png')));
k('PNG yükleme 200', r.d === 200 && r.tur === 'png');
r = await gYukle(gform(new TextEncoder().encode('%PDF-1.4 sahte'), 2, 'sayfa.jpg'));
k('uzantısı .jpg ama içerik PDF → 415', r.status === 415);
r = await gYukle(gform(new TextEncoder().encode('<svg onload=alert(1)>'), 2, 'a.png', 'image/png'));
k('SVG → 415', r.status === 415);
k('yatay görsel → 422', (await gYukle(gform(jpeg(2339, 1654)))).status === 422);
k('çok büyük görsel (40000 piksel) → 422', (await gYukle(gform(png(40000, 56000)))).status === 422);
k('çok küçük görsel → 422', (await gYukle(gform(jpeg(400, 566)))).status === 422);
const iriJpeg = new Uint8Array(8 * 1024 * 1024 + 1); iriJpeg.set(jpeg(1654, 2339));
k('8 MB üstü → 413', (await gYukle(gform(iriJpeg))).status === 413);
k('content-length 9 MB → 413 (gövde okunmadan)', (await gYukle(gform(jpeg(1654, 2339)), { headers: { 'content-length': String(9 * 1024 * 1024) } })).status === 413);
k('sayfa numarası geçersiz → 422', (await gYukle(gform(jpeg(1654, 2339), 0))).status === 422 && (await gYukle(gform(jpeg(1654, 2339), 21))).status === 422);
k('dosya yok → 422', (await gYukle(gform(null))).status === 422);
k('JSON gövde → 415', (await post('belge-sablonlari/teklif/gorsel', { dosya: 'x' })).status === 415);
k('önerilen şablona görsel → 409', (await gYukle(gform(jpeg(1654, 2339)), { id: 'gizlilik' })).status === 409);
k('R2 yokken görsel → 409', (await gYukle(gform(jpeg(1654, 2339)), { env: { DB: db, YEREL_GIRIS: 'evet' } })).status === 409);
k('reddedilen görseller depoya yazılmadı', [...r2.m.keys()].filter((a) => a.startsWith(GORSEL_ONEK)).length === 2);
const v3 = structuredClone(v2); v3[1].gorsel = 'sablon/teklif/3/2.jpg';
r = await jsn(await post('belge-sablonlari/teklif/surum', { sayfalar: v3 }));
k('yüklenen görselle sürüm 3 kaydı', r.d === 200 && r.surum === 3);
let g = await istek('belge-sablonlari/teklif/gorsel/3/2');
k('R2 görseli açılır: image/jpeg, nosniff, private', g.status === 200 && g.headers.get('content-type') === 'image/jpeg' && g.headers.get('x-content-type-options') === 'nosniff' && /private/.test(g.headers.get('cache-control')));
g = await istek('belge-sablonlari/teklif/gorsel/3/4');
k('PNG olarak yüklenen görsel image/png ile açılır', g.status === 200 && g.headers.get('content-type') === 'image/png');
k('olmayan görsel 404', (await istek('belge-sablonlari/teklif/gorsel/9/9')).status === 404);
s1 = await jsn(await istek('belge-sablonlari/teklif/surum/2'));
k('sürüm 2 hâlâ varsayılan görseli kullanıyor', s1.surum.sayfalar[1].gorsel === '/yonetim/veri/sablon/teklif/sayfa-2.jpg');

// --- Yetki ---
const yetkisiz = { DB: db, YEDEK: r2 };
k('oturumsuz şablon listesi 401', (await istek('belge-sablonlari', { env: yetkisiz })).status === 401);
k('oturumsuz katalog 401', (await istek('hizmet-katalogu', { env: yetkisiz })).status === 401);
k('oturumsuz görsel yükleme 401', (await gYukle(gform(jpeg(1654, 2339)), { env: yetkisiz })).status === 401);
k('oturumsuz görsel açma 401', (await istek('belge-sablonlari/teklif/gorsel/3/2', { env: yetkisiz })).status === 401);
k('oturumsuz varsayılan sayfa görseli 401', (await worker.fetch(new Request(B + '/yonetim/veri/sablon/teklif/sayfa-1.jpg'), { ...yetkisiz, ASSETS: { fetch: () => new Response('x') } }, {})).status === 401);
k('başka kaynaktan sürüm kaydı 403', (await post('belge-sablonlari/teklif/surum', { sayfalar: v2 }, { headers: { origin: 'https://kotu.example' } })).status === 403);
k('başka kaynaktan görsel yükleme 403', (await gYukle(gform(jpeg(1654, 2339)), { origin: 'https://kotu.example' })).status === 403);
k('başka kaynaktan katalog ekleme 403', (await post('hizmet-katalogu', { ad: 'X' }, { headers: { origin: 'https://kotu.example' } })).status === 403);

// --- Hizmet kataloğu ---
r = await jsn(await post('hizmet-katalogu', { ad: 'Logo Tasarımı', tur: 'tek_seferlik', fiyat: '15.000,50', simge: 'genel' }));
k('hizmet ekleme 200', r.d === 200 && r.id);
const yeniId = r.id;
let liste = (await jsn(await istek('hizmet-katalogu'))).hizmetler;
let x = liste.find((y) => y.id === yeniId);
k('eklenen hizmet: kuruş 1500050, tek seferlik, sona eklendi', x && x.varsayilan_fiyat_kurus === 1500050 && x.tur === 'tek_seferlik' && liste[liste.length - 1].id === yeniId);
k('fiyatsız hizmet eklenir (null)', (await jsn(await post('hizmet-katalogu', { ad: 'Danışmanlık' }))).ok && (await jsn(await istek('hizmet-katalogu'))).hizmetler.find((y) => y.ad === 'Danışmanlık').varsayilan_fiyat_kurus === null);
k('ad boş → 422', (await post('hizmet-katalogu', { ad: '  ' })).status === 422);
k('tür geçersiz → 422', (await post('hizmet-katalogu', { ad: 'A', tur: 'yillik' })).status === 422);
k('fiyat geçersiz → 422', (await post('hizmet-katalogu', { ad: 'A', fiyat: '12abc' })).status === 422);
k('simge geçersiz → 422', (await post('hizmet-katalogu', { ad: 'A', simge: 'javascript:' })).status === 422);
r = await jsn(await post('hizmet-katalogu/seo', { fiyat: '18.000' }));
k('düzenle: SEO fiyatı 1800000 kuruş', r.ok && db.ham.prepare("SELECT varsayilan_fiyat_kurus AS f FROM hizmet_katalogu WHERE id = 'seo'").get().f === 1800000);
r = await jsn(await post('hizmet-katalogu/seo', { fiyat: '' }));
k('düzenle: fiyat boşaltılınca null', db.ham.prepare("SELECT varsayilan_fiyat_kurus AS f FROM hizmet_katalogu WHERE id = 'seo'").get().f === null);
r = await jsn(await post('hizmet-katalogu/meta-reklam', { aktif: false }));
liste = (await jsn(await istek('hizmet-katalogu'))).hizmetler;
k('pasife alma: kayıt silinmez, listenin sonuna iner', liste.length === 10 && liste[liste.length - 1].id === 'meta-reklam' && liste[liste.length - 1].aktif === 0);
k('aktiflik yalnız true/false', (await post('hizmet-katalogu/meta-reklam', { aktif: 'evet' })).status === 422);
await post('hizmet-katalogu/meta-reklam', { aktif: true });
k('yeniden etkinleştirme', db.ham.prepare("SELECT aktif FROM hizmet_katalogu WHERE id = 'meta-reklam'").get().aktif === 1);
k('olmayan hizmet 404', (await post('hizmet-katalogu/yok', { ad: 'A' })).status === 404);
k('katalog işlemleri işlem kaydında', db.ham.prepare("SELECT COUNT(*) AS n FROM islem_kaydi WHERE islem IN ('hizmet_ekle', 'hizmet_duzenle')").get().n === 6);

// --- Teklif dosyası kaynağı (şablondan üretilen PDF mevcut uca yüklenir) ---
const z = new Date().toISOString();
db.ham.prepare("INSERT INTO musteriler (id, olusturma, guncelleme, kaynak, firma, asama) VALUES ('m1', ?, ?, 'elle', 'Örnek Reklam Ajansı', 'yeni')").run(z, z);
const kucukPdf = pdfOlustur([jpeg(1654, 2339)], { baslik: 'Örnek Reklam Ajansı proje teklifi', yazar: 'Idexya' });
const tf = (alan) => { const f = new FormData(); f.append('dosya', new Blob([kucukPdf], { type: 'application/pdf' }), 'ornek-reklam-ajansi-teklif-2026-11-10.pdf'); for (const [a, v] of Object.entries({ musteri_id: 'm1', ad: 'Örnek teklif', tarih: '2026-11-10', tutar: '40000,00', durum: 'taslak', ...alan })) f.append(a, v); return f; };
const tYukle = (f) => istek('teklif-dosyalari', { method: 'POST', headers: { origin: B }, body: f });
r = await jsn(await tYukle(tf({ kaynak: 'sablon' })));
k('şablon PDF yüklendi', r.d === 200 && r.ok);
r = await jsn(await tYukle(tf({})));
r = await jsn(await tYukle(tf({ kaynak: '<script>' })));
const dl = (await jsn(await istek('teklif-dosyalari/musteri/m1'))).dosyalar;
k('kaynak: sablon / yukleme; bilinmeyen değer yukleme sayılır', dl.filter((d) => d.kaynak === 'sablon').length === 1 && dl.filter((d) => d.kaynak === 'yukleme').length === 2);
k('şablon PDF işlem kaydı ayrı (teklif_sablondan)', db.ham.prepare("SELECT COUNT(*) AS n FROM islem_kaydi WHERE islem = 'teklif_sablondan'").get().n === 1);
k('şablon PDF tutarı 4000000 kuruş', dl.find((d) => d.kaynak === 'sablon').tutar_kurus === 4000000);

// --- Yedek temizliği şablon görsellerine dokunmaz ---
const sablonAnahtar = [...r2.m.keys()].filter((a) => a.startsWith(GORSEL_ONEK));
await r2.put('yedek/2020-01-01.json.gz', new Uint8Array([1, 2, 3]));
await r2.put('sablon/2020-01-01/1/1.jpg', jpeg(1654, 2339)); // adı tarih gibi görünen şablon görseli
const y = await yedekAl(env, 'test');
k('yedek alındı ve 30 günden eski yedek silindi', y.anahtar.startsWith('yedek/') && !r2.m.has('yedek/2020-01-01.json.gz'));
k('yedek temizliği şablon görsellerine dokunmadı', sablonAnahtar.every((a) => r2.m.has(a)) && r2.m.has('sablon/2020-01-01/1/1.jpg'));
const yedekVeri = JSON.parse(gunzipSync(r2.m.get(y.anahtar).b).toString());
k('yedekte şablon tabloları var', ['belge_sablonlari', 'belge_sablon_surumleri', 'hizmet_katalogu'].every((t) => Array.isArray(yedekVeri.tablolar[t]) && yedekVeri.tablolar[t].length));
k('yedek listesinde şablon görseli görünmez', (await jsn(await istek('yedek'))).yedekler.every((x) => x.anahtar.startsWith('yedek/')));

// --- Tutar ve metin hesapları (sablon-hesap.js) ---
k('kurusOku: "20.000" → 2000000, "20.000,50" → 2000050, "1250,5" → 125050', kurusOku('20.000') === 2000000 && kurusOku('20.000,50') === 2000050 && kurusOku('1250,5') === 125050);
k('kurusOku: boş null, "abc" NaN, sunucuyla aynı', kurusOku('') === null && Number.isNaN(kurusOku('abc')) && Number.isNaN(kurusOku('-5')));
const ornek = [{ tur: 'aylik', fiyat_kurus: 2000000 }, { tur: 'aylik', fiyat_kurus: 2000000 }, { tur: 'tek_seferlik', fiyat_kurus: 6000000 }, { tur: 'aylik', fiyat_kurus: null }];
const t = toplamlar(ornek);
k('toplamlar: aylık 4000000, tek seferlik 6000000, 1 bilinmeyen', t.aylik === 4000000 && t.tek === 6000000 && t.bilinmeyen === 1);
k('teklif tutarı = aylık toplam (KDV hariç)', teklifTutari(ornek) === 4000000);
k('yalnız tek seferlik varsa teklif tutarı = tek seferlik toplam', teklifTutari([{ tur: 'tek_seferlik', fiyat_kurus: 6000000 }]) === 6000000);
k('kuruş toplamı kayan nokta hatası yapmaz (0,10 + 0,20)', toplamlar([{ tur: 'aylik', fiyat_kurus: kurusOku('0,10') }, { tur: 'aylik', fiyat_kurus: kurusOku('0,20') }]).aylik === 30);
k('belgede "20.000 TL", panelde "20.000,00 TL", bilinmeyen "—"', tlBelge(2000000) === '20.000 TL' && tlBelge(2000050) === '20.000,50 TL' && tlTam(2000000) === '20.000,00 TL' && tlBelge(null) === '—' && tlTam(undefined) === '—');
k('tarih: "10 KASIM 2026" ve "10.11.2026"', tarihUzun('2026-11-10') === '10 KASIM 2026' && tarihKisa('2026-11-10') === '10.11.2026' && tarihUzun('x') === '—');
k('kapak: Türkçe büyük harf (i → İ)', kapakBasligi('{FIRMA} - PROJE TEKLİFİ', 'örnek reklam ajansı') === 'ÖRNEK REKLAM AJANSI - PROJE TEKLİFİ');
const l3 = satirYerlesimi(3, { ust: 1172, alt: 2150, ...HIZMET_DUZEN });
k('yerleşim: 3 hizmet tek sayfada tam aralıkla', l3.length === 1 && l3[0].adim === HIZMET_DUZEN.adim);
const l5 = satirYerlesimi(5, { ust: 1172, alt: 2150, ...HIZMET_DUZEN });
k('yerleşim: 5 hizmet tek sayfada daralmış aralıkla', l5.length === 1 && l5[0].adim < HIZMET_DUZEN.adim && l5[0].adim >= HIZMET_DUZEN.enAz);
const l6 = satirYerlesimi(6, { ust: 1172, alt: 2150, ...HIZMET_DUZEN });
k('yerleşim: 6 hizmet iki sayfaya dengeli bölünür (3 + 3)', l6.length === 2 && l6.map((p) => p.satirlar.length).join() === '3,3' && l6[1].satirlar[0] === 3);
const l12 = satirYerlesimi(12, { ust: 1268, alt: 2050, ...KALEM_DUZEN });
k('yerleşim: 12 fiyat satırı iki sayfaya bölünür, hiçbiri kaybolmaz', l12.length === 2 && l12.flatMap((p) => p.satirlar).length === 12 && l12.every((p) => p.adim >= KALEM_DUZEN.enAz));
k('yerleşim: son satır alt sınırı aşmaz', l12.every((p) => 1268 + (p.satirlar.length - 1) * p.adim + KALEM_DUZEN.yukseklik <= 2050));

// --- PDF yapısı ---
const sayfa1 = new Uint8Array(readFileSync(new URL('../public/yonetim/veri/sablon/teklif/sayfa-2.jpg', import.meta.url)));
const bilgi = jpegBilgi(sayfa1);
k('varsayılan sayfa görseli 1654 × 2339 RGB JPEG', bilgi && bilgi.en === 1654 && bilgi.boy === 2339 && bilgi.bilesen === 3);
const pdf = pdfOlustur([sayfa1, sayfa1], { baslik: 'Örnek Reklam Ajansı – teklif', yazar: 'Idexya' });
const metin = new TextDecoder('latin1').decode(pdf);
k('PDF: %PDF-1.4 ile başlar, %%EOF ile biter', metin.startsWith('%PDF-1.4') && metin.trimEnd().endsWith('%%EOF'));
k('PDF: 2 sayfa, DCTDecode, A4', /\/Count 2\b/.test(metin) && (metin.match(/\/DCTDecode/g) || []).length === 2 && /\/MediaBox \[0 0 595\.28 841\.89\]/.test(metin));
const xref = Number(/startxref\n(\d+)/.exec(metin)[1]);
k('PDF: startxref xref tablosunu gösterir', metin.slice(xref, xref + 4) === 'xref');
const ofsetler = metin.slice(xref).split('\n').slice(3).filter((s) => / 00000 n $/.test(s)).map((s) => Number(s.slice(0, 10)));
k('PDF: her nesnenin ofseti doğru', ofsetler.length === 9 && ofsetler.every((o, i) => metin.slice(o, o + String(i + 1).length + 6) === `${i + 1} 0 obj`));
k('PDF: başlık UTF-16 (Türkçe karakter)', metin.includes('/Title <FEFF00D6'));
k('PDF: JPEG baytları değişmeden gömülür', metin.includes(new TextDecoder('latin1').decode(sayfa1.slice(0, 200))));
let hataVar = false; try { pdfOlustur([png(1654, 2339)]); } catch (e) { hataVar = true; }
k('PDF: JPEG olmayan sayfa reddedilir', hataVar);
k('tohum listesi dışa açık ve 8 kayıt', TOHUM_HIZMET.length === 8);

await (await import('./sablon-metin-kontrol.mjs')).calistir({ k, istek, post, jsn, db, r2, env, B, worker, pdfOlustur, jpeg });

console.log(h.length ? `\n${h.length} KALDI:\n` + h.join('\n') : '\nTüm kontroller geçti.');
process.exit(h.length ? 1 : 0);
