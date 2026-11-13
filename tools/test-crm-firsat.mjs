// CRM satış çekirdeği (worker/firsat.js): şema, tek seferlik taşıma, fırsat/kişi/zaman çizelgesi uçları, aşama türetme,
// Bugün ve "Yapıldı" uçları. Tasarım: docs/superpowers/specs/2026-11-12-crm-satis-cekirdegi-design.md
// Sunucu gerekmez: D1 yerine node:sqlite (test-sablon.mjs kalıbı). Kullanım: node tools/test-crm-firsat.mjs
import { DatabaseSync } from 'node:sqlite';
import { build } from 'esbuild';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const paket = await build({ entryPoints: [new URL('../worker/index.js', import.meta.url).pathname], bundle: true, format: 'esm', platform: 'neutral', mainFields: ['module', 'main'], write: false, logLevel: 'silent' });
const gecici = join(mkdtempSync(join(tmpdir(), 'crm-firsat-')), 'worker.mjs');
writeFileSync(gecici, paket.outputFiles[0].text);
const worker = (await import(gecici)).default;
const F = await import('../worker/firsat.js');
const { SEMA, EK_SUTUNLAR, EK_DIZINLER } = await import('../worker/sema.js');

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
// Şemayı doğrudan kur (worker'ın semaKur önbelleğinden bağımsız ayrı veritabanları için)
function semaliD1() {
  const d = sahteD1();
  for (const x of SEMA) d.ham.exec(x);
  for (const [t, c, tur] of EK_SUTUNLAR) { if (!d.ham.prepare(`PRAGMA table_info(${t})`).all().some((x) => x.name === c)) d.ham.exec(`ALTER TABLE ${t} ADD COLUMN ${c} ${tur}`); }
  for (const x of EK_DIZINLER) d.ham.exec(x);
  return d;
}
const tek = (d, sql, ...p) => d.ham.prepare(sql).get(...p);
const hepsi = (d, sql, ...p) => d.ham.prepare(sql).all(...p);
const say = (d, t, kosul = '1=1', ...p) => tek(d, `SELECT COUNT(*) AS n FROM ${t} WHERE ${kosul}`, ...p).n;
const musteriEkle = (d, o) => d.ham.prepare(`INSERT INTO musteriler (id, olusturma, guncelleme, firma, ad, eposta, telefon, kaynak, asama, deger, paket, sorumlu, arsiv)
  VALUES (?, '2026-10-01T09:00:00.000Z', '2026-10-02T09:00:00.000Z', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(o.id, o.firma ?? null, o.ad ?? null, o.eposta ?? null, o.telefon ?? null, o.kaynak ?? null, o.asama ?? 'yeni', o.deger ?? null, o.paket ?? null, o.sorumlu ?? null, o.arsiv ?? null);

// ===================== Task 2: şema ve taşıma =====================
{
  const d = semaliD1();
  const sut = (t) => hepsi(d, `PRAGMA table_info(${t})`).map((x) => x.name);
  k('şema: firsatlar sütunları', ['id', 'musteri_id', 'ad', 'hizmetler', 'aylik_kurus', 'tek_seferlik_kurus', 'asama', 'sorumlu', 'kaynak', 'tahmini_kapanis', 'kayip_nedeni', 'kayip_notu', 'kapanis', 'olusturma', 'guncelleme', 'olusturan'].every((x) => sut('firsatlar').includes(x)));
  k('şema: kisiler sütunları', ['id', 'musteri_id', 'ad', 'unvan', 'rol', 'eposta', 'telefon', 'birincil', 'olusturma', 'guncelleme'].every((x) => sut('kisiler').includes(x)));
  k('şema: kişide TCKN / doğum tarihi / adres yok', !sut('kisiler').some((x) => /tckn|kimlik_no|dogum|adres/i.test(x)));
  k('şema: gorevler.firsat_id ve tur', ['firsat_id', 'tur'].every((x) => sut('gorevler').includes(x)));
  k('şema: kayitlar.firsat_id, kisi_id, sonuc, sure_dk', ['firsat_id', 'kisi_id', 'sonuc', 'sure_dk'].every((x) => sut('kayitlar').includes(x)));
  const dz = hepsi(d, "SELECT name, tbl_name FROM sqlite_master WHERE type = 'index'").map((x) => x.tbl_name + ':' + x.name);
  k('şema: fırsat dizinleri (müşteri, aşama, sorumlu)', ['firsatlar'].every((t) => dz.filter((x) => x.startsWith(t + ':')).length >= 3));
  k('şema: kişi ve görev-fırsat dizinleri', dz.some((x) => x.startsWith('kisiler:')) && dz.some((x) => /^gorevler:.*firsat/.test(x)));

  musteriEkle(d, { id: 'm1', firma: 'Kazanan AŞ', ad: 'Ayşe Kaya', eposta: 'ayse@ornek.com', telefon: '05551112233', asama: 'kazanildi', deger: 40000, paket: 'Google + Meta', sorumlu: 'ali@idexya.com', kaynak: 'iletisim' });
  musteriEkle(d, { id: 'm2', firma: 'Teklifli Ltd', asama: 'teklif', sorumlu: '' });
  musteriEkle(d, { id: 'm3', firma: 'Eski Kart', asama: 'eski_bir_deger' });
  const s1 = await F.crmTasi(d, ['muhittin@idexya.com', 'ali@idexya.com']);
  k('taşıma: 3 fırsat, 1 kişi', s1.firsat === 3 && s1.kisi === 1 && say(d, 'firsatlar') === 3 && say(d, 'kisiler') === 1);
  const f = (m) => tek(d, 'SELECT * FROM firsatlar WHERE musteri_id = ?', m);
  k('taşıma: aşamalar kazanildi / teklif / yeni (eski değer → yeni)', f('m1').asama === 'kazanildi' && f('m2').asama === 'teklif' && f('m3').asama === 'yeni');
  k('taşıma: aylık ve tek seferlik tutar hepsi boş (uydurulmaz)', hepsi(d, 'SELECT aylik_kurus, tek_seferlik_kurus FROM firsatlar').every((x) => x.aylik_kurus === null && x.tek_seferlik_kurus === null));
  k('taşıma: fırsat adı paket ya da "Genel"', f('m1').ad === 'Google + Meta' && f('m2').ad === 'Genel');
  k('taşıma: sorumlu kartın sorumlusu, boşsa ilk yönetici', f('m1').sorumlu === 'ali@idexya.com' && f('m2').sorumlu === 'muhittin@idexya.com' && f('m3').sorumlu === 'muhittin@idexya.com');
  k('taşıma: kazanılan fırsatın kapanış zamanı dolu, açığınki boş', !!f('m1').kapanis && f('m2').kapanis === null);
  k('taşıma: kaynak taşındı', f('m1').kaynak === 'iletisim');
  const kisi = tek(d, 'SELECT * FROM kisiler WHERE musteri_id = ?', 'm1');
  k('taşıma: birincil kişi kartın ad/e-posta/telefonundan', kisi && kisi.ad === 'Ayşe Kaya' && kisi.eposta === 'ayse@ornek.com' && kisi.telefon === '05551112233' && kisi.birincil === 1);
  const eski = tek(d, "SELECT * FROM kayitlar WHERE musteri_id = 'm1' AND tur = 'sistem'");
  k('taşıma: eski tahmini değer günlüğe not olarak düşüldü', eski && /Eski tahmini değer/i.test(eski.baslik + ' ' + (eski.detay || '')) && /40\.?000/.test(eski.detay || '') && eski.firsat_id === f('m1').id);
  k('taşıma: değeri olmayan kartlara not yazılmadı', say(d, 'kayitlar', "musteri_id IN ('m2','m3')") === 0);
  k('taşıma: bayrak ayarlar tablosunda', !!tek(d, "SELECT 1 AS v FROM ayarlar WHERE anahtar = 'crm_tasima_v1'"));
  k('taşıma: musteriler.asama değişmedi (dashboard okumaya devam eder)', tek(d, "SELECT asama FROM musteriler WHERE id='m3'").asama === 'eski_bir_deger');
  const s2 = await F.crmTasi(d, ['muhittin@idexya.com']);
  k('taşıma ikinci çağrı: hiçbir şey yapmaz', s2.firsat === 0 && s2.kisi === 0 && say(d, 'firsatlar') === 3 && say(d, 'kisiler') === 1 && say(d, 'kayitlar') === 1);
  // Yarıda kalma: bayrak yoksa kaldığı yerden devam eder, var olanı çoğaltmaz
  d.ham.exec("DELETE FROM ayarlar WHERE anahtar = 'crm_tasima_v1'");
  musteriEkle(d, { id: 'm4', ad: 'Yalnız Kişi', telefon: '05320000000' });
  const s3 = await F.crmTasi(d, ['muhittin@idexya.com']);
  k('taşıma yeniden: yalnız eksik kart eklenir', s3.firsat === 1 && s3.kisi === 1 && say(d, 'firsatlar') === 4 && say(d, 'kisiler') === 2);
}

// ===================== Task 3: fırsat, kişi ve zaman çizelgesi uçları =====================
const B = 'http://localhost';
const db = sahteD1();
const env = { DB: db, YEREL_GIRIS: 'evet', YONETICILER: 'muhittin@idexya.com, Ali@idexya.com' };
const ben = 'yerel@gelistirme';
const istek = (yol, o = {}) => worker.fetch(new Request(B + '/api/yonetim/' + yol, o), o.env || env, {});
const gonder = (yontem, yol, govde, ek = {}) => istek(yol, { method: yontem, headers: { ...(ek.origin === null ? {} : { origin: ek.origin || B }), 'content-type': 'application/json' }, body: govde === undefined ? undefined : JSON.stringify(govde), env: ek.env });
const post = (yol, g, ek) => gonder('POST', yol, g, ek), patch = (yol, g, ek) => gonder('PATCH', yol, g, ek), sil = (yol, ek) => gonder('DELETE', yol, undefined, ek);
const jsn = async (r) => ({ d: r.status, ...(await r.json()) });
const toplamAlaniVar = (o) => JSON.stringify(o).match(/"(toplam[a-z_]*|tutar_toplam|genel_toplam)"\s*:/);

let r = await jsn(await istek('ozet')); // şemayı kurar
musteriEkle(db, { id: 'eski1', firma: 'Eski Müşteri', ad: 'Can Er', eposta: 'can@eski.com', asama: 'gorusme', deger: 5000, sorumlu: 'ali@idexya.com' });
r = await jsn(await istek('firsatlar'));
k('ilk fırsat isteğinde taşıma kendiliğinden çalışır', r.d === 200 && r.firsatlar.some((x) => x.musteri_id === 'eski1' && x.asama === 'gorusme') && say(db, 'kisiler', "musteri_id='eski1'") === 1);

// Ekip
r = await jsn(await istek('ekip'));
k('ekip: YONETICILER e-postaları (küçük harf) + oturumdaki kişi, ad e-posta başı', r.d === 200 && ['muhittin@idexya.com', 'ali@idexya.com', ben].every((e) => r.ekip.some((x) => x.eposta === e)) && r.ekip.find((x) => x.eposta === 'ali@idexya.com').ad === 'ali');
db.ham.prepare("INSERT INTO ayarlar (anahtar, deger, guncelleme, guncelleyen) VALUES ('ekip_adlari', ?, 'x', 'x')").run(JSON.stringify({ 'ali@idexya.com': 'Ali Y.' }));
r = await jsn(await istek('ekip'));
k('ekip: ayarlar.ekip_adlari görünen adı', r.ekip.find((x) => x.eposta === 'ali@idexya.com').ad === 'Ali Y.');

// Fırsat oluştur
r = await jsn(await post('musteriler', { firma: 'Yeni Firma AŞ', ad: 'Deniz Ak', eposta: 'deniz@yeni.com' }));
const M = r.musteri_id;
k('yeni müşteri kartında fırsat ve birincil kişi kendiliğinden açılır', say(db, 'firsatlar', 'musteri_id = ?', M) === 1 && say(db, 'kisiler', 'musteri_id = ? AND birincil = 1', M) === 1);
r = await jsn(await post('firsatlar', { musteri_id: M, ad: 'Google + Meta reklam yönetimi', sorumlu: 'ali@idexya.com', kaynak: 'tavsiye', tahmini_kapanis: '2026-12-15',
  hizmetler: [{ hizmet_id: 'google-reklam', ad: 'Google Reklam Yönetimi', tur: 'aylik', fiyat_kurus: 2000000 }, { hizmet_id: 'meta-reklam', ad: 'Meta Reklam Yönetimi', tur: 'aylik', fiyat_kurus: 2000000 }] }));
const F1 = r.id;
let f1 = tek(db, 'SELECT * FROM firsatlar WHERE id = ?', F1);
k('fırsat oluştur: 200, aylık 40.000 TL (4000000 kuruş), tek seferlik boş', r.d === 200 && f1.aylik_kurus === 4000000 && f1.tek_seferlik_kurus === null && f1.asama === 'yeni' && f1.sorumlu === 'ali@idexya.com');
k('fırsat oluştur: işlem kaydında', say(db, 'islem_kaydi', "islem = 'firsat_olusturuldu' AND hedef = ?", F1) === 1);
r = await jsn(await post('firsatlar', { musteri_id: M, ad: 'Site', hizmetler: [{ ad: 'Kurumsal site', tur: 'tek_seferlik', fiyat_kurus: 6000000 }, { ad: 'SEO', tur: 'aylik', fiyat_kurus: null }] }));
const F2 = r.id;
let f2 = tek(db, 'SELECT * FROM firsatlar WHERE id = ?', F2);
k('fiyatı bilinmeyen aylık kalem → aylık tutar boş (uydurulmaz), tek seferlik 60.000 TL ayrı', f2.aylik_kurus === null && f2.tek_seferlik_kurus === 6000000 && f2.sorumlu === ben);
r = await jsn(await post('firsatlar', { musteri_id: M, ad: 'X', sorumlu: 'yabanci@baska.com' }));
k('sorumlu ekip listesinde değil → 422', r.d === 422);
r = await jsn(await post('firsatlar', { musteri_id: 'yok', ad: 'X' }));
k('olmayan müşteri → 404', r.d === 404);
r = await jsn(await post('firsatlar', { musteri_id: M, ad: '' }));
k('adsız fırsat → 422', r.d === 422);
r = await jsn(await post('firsatlar', { musteri_id: M, ad: 'X', hizmetler: [{ ad: 'A', tur: 'yillik', fiyat_kurus: 1 }] }));
k('geçersiz hizmet türü → 422', r.d === 422);
r = await jsn(await post('firsatlar', { musteri_id: M, ad: 'X', hizmetler: [{ ad: 'A', tur: 'aylik', fiyat_kurus: -5 }] }));
k('eksi tutar → 422', r.d === 422);
r = await jsn(await post('firsatlar', { musteri_id: M, ad: 'X', asama: 'kaybedildi' }));
k('kaybedildi olarak oluştururken neden yok → 422', r.d === 422);

// Liste ve okuma
r = await jsn(await istek('firsatlar?sorumlu=ali@idexya.com'));
k('liste süzgeci: sorumlu', r.d === 200 && r.firsatlar.length >= 1 && r.firsatlar.every((x) => x.sorumlu === 'ali@idexya.com'));
r = await jsn(await istek('firsatlar?hizmet=google-reklam'));
k('liste süzgeci: hizmet', r.firsatlar.length === 1 && r.firsatlar[0].id === F1 && Array.isArray(r.firsatlar[0].hizmetler));
r = await jsn(await istek('firsatlar?q=' + encodeURIComponent('yeni firma')));
k('liste süzgeci: arama (firma adı)', r.firsatlar.length === 3 && r.firsatlar.every((x) => x.musteri_id === M));
r = await jsn(await istek('firsatlar?kaynak=tavsiye&asama=yeni'));
k('liste süzgeci: kaynak + aşama', r.firsatlar.length === 1 && r.firsatlar[0].id === F1);
k('liste yanıtında aylık + tek seferlik toplam alanı yok', !toplamAlaniVar(r));
r = await jsn(await istek('firsatlar/' + F1));
k('fırsat oku: müşteri adı, hizmetler dizi', r.d === 200 && r.firsat.firma === 'Yeni Firma AŞ' && r.firsat.hizmetler.length === 2 && Array.isArray(r.kayitlar) && Array.isArray(r.gorevler));
k('fırsat oku: toplam alanı yok', !toplamAlaniVar(r));

// Aşama değişimi ve türetme
r = await jsn(await patch('firsatlar/' + F1, { asama: 'kaybedildi' }));
k('kaybedildi nedensiz → 422', r.d === 422 && tek(db, 'SELECT asama FROM firsatlar WHERE id = ?', F1).asama === 'yeni');
r = await jsn(await patch('firsatlar/' + F1, { asama: 'kaybedildi', kayip_nedeni: 'uydurma' }));
k('geçersiz kayıp nedeni → 422', r.d === 422);
r = await jsn(await patch('firsatlar/' + F1, { asama: 'teklif' }));
k('aşama teklif → 200, aşama kaydı zaman çizelgesinde', r.d === 200 && say(db, 'kayitlar', "firsat_id = ? AND tur = 'asama'", F1) === 1);
r = await jsn(await patch('firsatlar/' + F2, { asama: 'gorusme' }));
k('türetme: {teklif, gorusme, yeni} → musteriler.asama = teklif', tek(db, 'SELECT asama FROM musteriler WHERE id = ?', M).asama === 'teklif');
r = await jsn(await patch('firsatlar/' + F1, { asama: 'kaybedildi', kayip_nedeni: 'fiyat', kayip_notu: 'Bütçe yetmedi' }));
f1 = tek(db, 'SELECT * FROM firsatlar WHERE id = ?', F1);
k('kaybedildi nedenle → 200, kapanış dolu, neden kaydedildi', r.d === 200 && f1.asama === 'kaybedildi' && f1.kayip_nedeni === 'fiyat' && !!f1.kapanis);
k('kayıp nedeni aşama kaydının ayrıntısında', /Fiyat/.test(tek(db, "SELECT detay FROM kayitlar WHERE firsat_id = ? AND tur = 'asama' ORDER BY zaman DESC, rowid DESC LIMIT 1", F1).detay || ''));
const F3 = tek(db, "SELECT id FROM firsatlar WHERE musteri_id = ? AND id NOT IN (?, ?)", M, F1, F2).id;
await patch('firsatlar/' + F3, { asama: 'kaybedildi', kayip_nedeni: 'zamanlama' });
await patch('firsatlar/' + F2, { asama: 'kaybedildi', kayip_nedeni: 'rakip' });
k('türetme: tüm fırsatlar kaybedildi → kaybedildi', tek(db, 'SELECT asama FROM musteriler WHERE id = ?', M).asama === 'kaybedildi');
await patch('firsatlar/' + F2, { asama: 'kazanildi' });
f2 = tek(db, 'SELECT * FROM firsatlar WHERE id = ?', F2);
k('türetme: {kazanildi, kaybedildi} → kazanildi', tek(db, 'SELECT asama FROM musteriler WHERE id = ?', M).asama === 'kazanildi');
k('kaybedildiden çıkınca kayıp nedeni temizlenir', f2.kayip_nedeni === null && !!f2.kapanis);
k('asamaTuret dışa açık: aynı sonucu verir', (await F.asamaTuret(db, M)) === 'kazanildi');
// Eşzamanlı değişiklik: iki yönetici sırayla yazınca son durum fırsatlardan yeniden hesaplanır (eski değerde kalmaz)
db.ham.prepare("UPDATE musteriler SET asama = 'yeni' WHERE id = ?").run(M);
// (sahte D1 iç içe işlem açamadığı için iki yazım sırayla; araya eski değer yazılır)
await patch('firsatlar/' + F3, { asama: 'gorusme' }); db.ham.prepare("UPDATE musteriler SET asama = 'yeni' WHERE id = ?").run(M); await patch('firsatlar/' + F1, { asama: 'teklif' });
k('eşzamanlı aşama değişikliği sonrası türetme güncel', tek(db, 'SELECT asama FROM musteriler WHERE id = ?', M).asama === 'kazanildi');
r = await jsn(await patch('firsatlar/' + F1, { sorumlu: 'yabanci@baska.com' }));
k('PATCH: sorumlu listede değil → 422', r.d === 422);
r = await jsn(await patch('firsatlar/' + F1, { ad: 'Yeni ad', tek_seferlik_kurus: 150000 }));
f1 = tek(db, 'SELECT * FROM firsatlar WHERE id = ?', F1);
k('PATCH kısmi: ad ve tek seferlik değişti, aylık korunur', r.d === 200 && f1.ad === 'Yeni ad' && f1.tek_seferlik_kurus === 150000 && f1.aylik_kurus === 4000000);
r = await jsn(await patch('firsatlar/yok', { ad: 'x' }));
k('olmayan fırsat → 404', r.d === 404);

// "Müşteri yap" kazanılan fırsatla çalışmaya devam eder
{
  const eskiFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ aday_id: 'aday-1', durum: 'bekliyor' }), { status: 200, headers: { 'content-type': 'application/json' } });
  const envIdos = { ...env, IDOS_ORTAK_URL: 'https://idos.ornek.test', IDOS_ORTAK_JETON: 'test-jetonu' };
  r = await jsn(await post(`musteriler/${M}/musteri-yap`, {}, { env: envIdos }));
  globalThis.fetch = eskiFetch;
  k('"Müşteri yap": kazanılan fırsatı olan müşteride 409 yok', r.d === 200 && r.ok);
}

// Kişiler
r = await jsn(await post(`musteriler/${M}/kisiler`, { ad: 'Elif Su', unvan: 'Pazarlama müdürü', rol: 'pazarlama', eposta: 'elif@yeni.com', telefon: '0532 000 00 00', birincil: true, tckn: '12345678901', dogum_tarihi: '1990-01-01' }));
const K1 = r.id;
k('kişi ekle → 200, birincil', r.d === 200 && tek(db, 'SELECT birincil FROM kisiler WHERE id = ?', K1).birincil === 1);
k('ikinci birincil → öncekinin birincil işareti kalkar', say(db, 'kisiler', 'musteri_id = ? AND birincil = 1', M) === 1);
k('kişide TCKN / doğum tarihi saklanmaz', !JSON.stringify(hepsi(db, 'SELECT * FROM kisiler')).includes('12345678901'));
r = await jsn(await post(`musteriler/${M}/kisiler`, { ad: 'X', rol: 'patron' }));
k('geçersiz rol → 422', r.d === 422);
r = await jsn(await post(`musteriler/${M}/kisiler`, { ad: 'X', eposta: 'gecersiz' }));
k('geçersiz e-posta → 422', r.d === 422);
r = await jsn(await istek(`musteriler/${M}/kisiler`));
k('kişi listesi: birincil önce', r.d === 200 && r.kisiler.length === 2 && r.kisiler[0].id === K1);
r = await jsn(await patch('kisiler/' + K1, { unvan: 'Genel müdür', rol: 'karar_verici' }));
k('kişi güncelle', r.d === 200 && tek(db, 'SELECT unvan, rol FROM kisiler WHERE id = ?', K1).rol === 'karar_verici');
r = await jsn(await istek('kisiler?q=elif'));
k('tüm kişiler listesi + arama, firma adıyla', r.d === 200 && r.kisiler.length === 1 && r.kisiler[0].firma === 'Yeni Firma AŞ' && typeof r.kayit_sayisi === 'number');

// Zaman çizelgesi kaydı
r = await jsn(await post(`musteriler/${M}/kayitlar`, { tur: 'arama', sonuc: 'ulasildi', sure_dk: 8, metin: 'Teklifi konuştuk', kisi_id: K1, firsat_id: F1 }));
const KY = r.id;
let ky = tek(db, 'SELECT * FROM kayitlar WHERE id = ?', KY);
k('arama kaydı: tür, sonuç, süre, kişi ve fırsat bağı', r.d === 200 && ky.tur === 'arama' && ky.sonuc === 'ulasildi' && ky.sure_dk === 8 && ky.kisi_id === K1 && ky.firsat_id === F1);
r = await jsn(await post(`musteriler/${M}/kayitlar`, { tur: 'arama', sonuc: 'belki' }));
k('geçersiz arama sonucu → 422', r.d === 422);
r = await jsn(await post(`musteriler/${M}/kayitlar`, { tur: 'sistem', metin: 'x' }));
k('elle "sistem" kaydı yazılamaz → 422', r.d === 422);
r = await jsn(await post(`musteriler/${M}/kayitlar`, { tur: 'not', metin: 'x', firsat_id: 'baskasinin' }));
k('başka müşterinin/olmayan fırsatı → 422', r.d === 422);
r = await jsn(await post(`musteriler/${M}/kayitlar`, { tur: 'not', metin: '' }));
k('boş not → 422', r.d === 422);

// Kişi silme: zaman çizelgesindeki eski kayıt bozulmaz
r = await jsn(await sil('kisiler/' + K1));
ky = tek(db, 'SELECT * FROM kayitlar WHERE id = ?', KY);
k('kişi silindi, bağlı kayıt kaldı ve kisi_id boşaldı, metin duruyor', r.d === 200 && say(db, 'kisiler', 'id = ?', K1) === 0 && ky && ky.kisi_id === null && ky.detay === 'Teklifi konuştuk');
k('kişi silme günlüğe not olarak yazıldı (iletişim bilgisi olmadan)', (() => { const x = tek(db, "SELECT * FROM kayitlar WHERE musteri_id = ? AND baslik LIKE 'Kişi silindi%'", M); return x && /Elif Su/.test(x.detay) && !/elif@yeni\.com|0532/.test(x.detay); })());
r = await jsn(await sil('kisiler/' + K1));
k('silinmiş kişi → 404', r.d === 404);

// Müşteri kartı yanıtı
r = await jsn(await istek('musteriler/' + M));
k('müşteri kartı yanıtında fırsatlar ve kişiler var, eski alanlar korunuyor', r.d === 200 && r.musteri.id === M && Array.isArray(r.kayitlar) && r.firsatlar.length === 3 && r.kisiler.length === 1);

// Eski ekranlarla uyum: eski aşama ucu tek fırsatlı müşteride fırsatı da günceller
r = await jsn(await post('musteriler', { firma: 'Tek Fırsatlı' }));
const MT = r.musteri_id;
r = await jsn(await post(`musteriler/${MT}/asama`, { asama: 'teklif' }));
k('eski aşama ucu çalışır ve tek fırsatı eşitler', r.d === 200 && tek(db, 'SELECT asama FROM musteriler WHERE id = ?', MT).asama === 'teklif' && tek(db, 'SELECT asama FROM firsatlar WHERE musteri_id = ?', MT).asama === 'teklif');
r = await jsn(await post('musteriler/toplu', { ids: [MT], islem: 'asama', asama: 'kazanildi' }));
k('eski toplu aşama ucu tek fırsatı eşitler', r.d === 200 && tek(db, 'SELECT asama, kapanis FROM firsatlar WHERE musteri_id = ?', MT).asama === 'kazanildi' && !!tek(db, 'SELECT kapanis FROM firsatlar WHERE musteri_id = ?', MT).kapanis);
const oncekiM = tek(db, 'SELECT asama FROM firsatlar WHERE id = ?', F1).asama;
await post(`musteriler/${M}/asama`, { asama: 'yeni' });
k('eski aşama ucu çok fırsatlı müşteride fırsatlara dokunmaz', tek(db, 'SELECT asama FROM firsatlar WHERE id = ?', F1).asama === oncekiM);
// Talep → CRM'e al akışı fırsat açar
db.ham.prepare("INSERT INTO talepler (id, olusturma, kaynak, ad, firma, eposta, dogrulama) VALUES ('t1', '2026-11-12T08:00:00.000Z', 'iletisim', 'Talep Kişi', 'Talep Firma', 'talep@firma.com', 'gecti')").run();
r = await jsn(await post('talepler/t1/crm', {}));
k('talep → CRM: müşteri, fırsat (kaynak iletisim) ve birincil kişi', r.d === 200 && tek(db, 'SELECT kaynak FROM firsatlar WHERE musteri_id = ?', r.musteri_id).kaynak === 'iletisim' && say(db, 'kisiler', 'musteri_id = ? AND birincil = 1', r.musteri_id) === 1);

// Yetki ve kaynak denetimi
r = await jsn(await istek('firsatlar', { env: { DB: db } }));
k('oturumsuz → 401', r.d === 401);
r = await jsn(await post('firsatlar', { musteri_id: M, ad: 'X' }, { origin: null }));
k('Origin olmadan POST → 403', r.d === 403);
r = await jsn(await patch('firsatlar/' + F1, { ad: 'X' }, { origin: 'https://kotu.example' }));
k('başka kaynaktan PATCH → 403', r.d === 403);
r = await jsn(await sil('kisiler/x', { origin: null }));
k('Origin olmadan DELETE → 403', r.d === 403);

// Gönderim kodu yok
const kaynak = readFileSync(new URL('../worker/firsat.js', import.meta.url), 'utf8');
k('firsat.js gönderim/bildirim çağrısı içermez', !/ekibeBildir|epostaGonder|fetch\(|resend|sendEmail|whatsapp|sms/i.test(kaynak));

// ===================== Task 4: Bugün ve sonraki adım =====================
{
  const d4 = semaliD1();
  const env4 = { DB: d4, YEREL_GIRIS: 'evet', YONETICILER: 'muhittin@idexya.com,ali@idexya.com' };
  const al = async (yol) => jsn(await istek(yol, { env: env4 }));
  const yaz = async (yol, g) => jsn(await post(yol, g, { env: env4 }));
  const gerçekNow = Date.now;
  Date.now = () => Date.UTC(2026, 10, 12, 22, 30); // UTC 12.11.2026 22.30 = TR 13.11.2026 01.30 (cuma)
  try {
    musteriEkle(d4, { id: 'A', firma: 'Aktif AŞ' }); musteriEkle(d4, { id: 'Bx', firma: 'Arşivli', arsiv: '2026-11-01T00:00:00Z' }); musteriEkle(d4, { id: 'C', firma: 'Cadde' });
    const fEkle = (id, mus, asama, o = {}) => d4.ham.prepare(`INSERT INTO firsatlar (id, musteri_id, ad, hizmetler, aylik_kurus, tek_seferlik_kurus, asama, sorumlu, kayip_nedeni, kapanis, olusturma, guncelleme, olusturan)
      VALUES (?, ?, ?, '[]', ?, ?, ?, ?, ?, ?, '2026-10-01T00:00:00Z', '2026-10-01T00:00:00Z', 'x')`).run(id, mus, 'F ' + id, o.aylik ?? null, o.tek ?? null, asama, o.sorumlu || ben, o.neden ?? null, o.kapanis ?? null);
    fEkle('FA', 'A', 'gorusme'); fEkle('FB', 'Bx', 'yeni'); fEkle('FC', 'C', 'teklif', { sorumlu: 'ali@idexya.com', aylik: 100000 });
    fEkle('FK', 'A', 'kazanildi', { aylik: 4000000, kapanis: '2026-11-05T10:00:00Z' });
    fEkle('FL1', 'A', 'kaybedildi', { neden: 'fiyat', kapanis: '2026-10-31T22:30:00Z' }); // TR 01.11.2026: kasımda sayılır
    fEkle('FL2', 'C', 'kaybedildi', { neden: 'fiyat', kapanis: '2026-11-02T10:00:00Z', sorumlu: 'ali@idexya.com' });
    fEkle('FL3', 'C', 'kaybedildi', { neden: 'rakip', kapanis: '2026-11-03T10:00:00Z' });
    fEkle('FL4', 'C', 'kaybedildi', { neden: 'rakip', kapanis: '2026-10-31T20:00:00Z' }); // TR 31.10.2026 23.00: ekimde, sayılmaz
    const gEkle = (id, tarih, o = {}) => d4.ham.prepare(`INSERT INTO gorevler (id, baslik, tarih, saat, musteri_id, firsat_id, tur, atanan, oncelik, durum, olusturma, olusturan)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'normal', 'acik', '2026-11-01T00:00:00Z', 'x')`).run(id, 'Görev ' + id, tarih, o.saat ?? null, o.musteri ?? null, o.firsat ?? null, o.tur ?? null, o.atanan || ben);
    gEkle('g1', '2026-11-10', { musteri: 'A', firsat: 'FA', tur: 'ara' });
    gEkle('g2', '2026-11-05', { musteri: 'A' });
    gEkle('g3', '2026-11-13', { musteri: 'A', saat: '14:00' });
    gEkle('g4', '2026-11-14', { musteri: 'A', atanan: 'ali@idexya.com' });
    // Müşterinin tek açık fırsatı varsa müşteriye bağlı (eski) görev o fırsatın adımı sayılır
    musteriEkle(d4, { id: 'D', firma: 'Dörtyol' }); fEkle('FD', 'D', 'yeni'); gEkle('gD', '2026-11-25', { musteri: 'D' });
    gEkle('g5', '2026-11-20', { musteri: 'A' });
    gEkle('g6', '2026-11-12', {}); // müşterisiz iç görev: sonraki adım sayılmaz
    gEkle('gB', '2026-11-13', { musteri: 'Bx', firsat: 'FB' });
    d4.ham.exec("INSERT INTO talepler (id, olusturma, kaynak, ad, firma, eposta, dogrulama, durum) VALUES ('ty', '2026-11-12T20:00:00Z', 'iletisim', 'Yeni Talep', 'Firma', 'a@b.co', 'gecti', 'yeni'), ('ts', '2026-11-12T20:00:00Z', 'form', 'Spam', NULL, NULL, 'gecti', 'spam')");

    let b = await al('bugun?kim=hepsi');
    const idler = (l) => (l || []).map((x) => x.id).join(',');
    k('Bugün: TR günü (UTC 22.30 → ertesi gün)', b.d === 200 && b.tarih === '2026-11-13');
    k('Bugün: gecikmiş en eski önce, müşterisiz iç görev yok', idler(b.gecikmis) === 'g2,g1');
    k('Bugün: gecikme gün sayısı', b.gecikmis[0].gecikme_gun === 8 && b.gecikmis[1].gecikme_gun === 3);
    k('Bugün: bugün listesi (arşivli müşterinin görevi yok)', idler(b.bugun) === 'g3');
    k('Bugün: bu hafta (pazara kadar)', idler(b.hafta) === 'g4');
    k('Bugün: adımı olmayan açık fırsat (arşivli yok, adımlı yok)', idler(b.adimsiz) === 'FC');
    k('Bugün: adım satırında firma adı', b.gecikmis[0].firma === 'Aktif AŞ');
    k('Bugün: yalnız yeni talepler', idler(b.talepler) === 'ty');
    k('Bu ay: kazanılan 1, aylık 40.000 TL, tek seferlik boş', b.ay.kazanilan.n === 1 && b.ay.kazanilan.aylik_kurus === 4000000 && b.ay.kazanilan.tek_seferlik_kurus === null);
    k('Bu ay: kaybedilen 3 (TR ay sınırı), en sık neden fiyat', b.ay.kaybedilen.n === 3 && b.ay.kaybedilen.en_sik_neden === 'fiyat');
    k('Bu ay: kazanma oranı 1/4', b.ay.kazanma_orani === 0.25);
    k('Bu ay: açık fırsat sayısı ve aylık ayrı (bilinmeyen sayısıyla)', b.ay.acik.n === 3 && b.ay.acik.aylik_kurus === 100000 && b.ay.acik.tek_seferlik_kurus === null && b.ay.acik.aylik_bilinmeyen === 2);
    k('Bugün yanıtında toplam (aylık + tek) alanı yok', !toplamAlaniVar(b));
    b = await al('bugun?kim=ben');
    k('kim=ben: yalnız bana atananlar', idler(b.hafta) === '' && idler(b.gecikmis) === 'g2,g1' && idler(b.adimsiz) === '' && b.ay.kazanilan.n === 1 && b.ay.kaybedilen.n === 2);
    b = await al('bugun');
    k('kim verilmezse ben', idler(b.hafta) === '' && idler(b.bugun) === 'g3');
    b = await al('bugun?kim=ali@idexya.com');
    k('kim=<eposta>: o kişinin adımları ve fırsatları', idler(b.hafta) === 'g4' && idler(b.gecikmis) === '' && idler(b.adimsiz) === 'FC');
    b = await al('bugun?kim=yabanci@baska.com');
    k('kim ekip dışında → 422', b.d === 422);
    {
      const bos = semaliD1();
      const r0 = await jsn(await istek('bugun', { env: { ...env4, DB: bos } }));
      k('hiç kapanış yoksa kazanma oranı boş (null), 0 değil', r0.d === 200 && r0.ay.kazanma_orani === null && r0.ay.kazanilan.aylik_kurus === null);
    }

    // Yapıldı
    let y = await yaz('gorevler/g1/yapildi', { sonuc: 'ulasildi', not: 'Konuştuk', sonraki: { tur: 'toplanti', tarih: '2026-11-18', saat: '14:00', atanan: 'ali@idexya.com' } });
    const g1 = tek(d4, "SELECT * FROM gorevler WHERE id = 'g1'");
    const kay = tek(d4, 'SELECT * FROM kayitlar WHERE id = ?', y.kayit_id || '');
    const yeni = tek(d4, 'SELECT * FROM gorevler WHERE id = ?', y.yeni_gorev_id || '');
    k('Yapıldı: görev tamam', y.d === 200 && g1.durum === 'tamam' && !!g1.tamamlanma);
    k('Yapıldı: zaman çizelgesine arama kaydı (sonuç, not, fırsat)', kay && kay.tur === 'arama' && kay.sonuc === 'ulasildi' && kay.detay === 'Konuştuk' && kay.firsat_id === 'FA' && kay.musteri_id === 'A');
    k('Yapıldı: sonraki adım yeni görev (fırsat, müşteri, tür, sorumlu)', yeni && yeni.firsat_id === 'FA' && yeni.musteri_id === 'A' && yeni.tur === 'toplanti' && yeni.atanan === 'ali@idexya.com' && yeni.tarih === '2026-11-18' && yeni.durum === 'acik');
    y = await yaz('gorevler/g1/yapildi', {});
    k('Yapıldı ikinci kez → 409', y.d === 409);
    y = await yaz('gorevler/g3/yapildi', { sonraki: { tur: 'ara', tarih: '2026-11-18', atanan: 'yabanci@baska.com' } });
    k('sonraki adım sorumlusu ekip dışında → 422, görev açık kalır', y.d === 422 && tek(d4, "SELECT durum FROM gorevler WHERE id = 'g3'").durum === 'acik');
    y = await yaz('gorevler/g3/yapildi', { sonraki: { tur: 'ara', tarih: '2026-02-30' } });
    k('sonraki adım tarihi geçersiz → 422', y.d === 422);
    y = await yaz('gorevler/g3/yapildi', { sonraki: { tur: 'faks', tarih: '2026-11-18' } });
    k('sonraki adım türü geçersiz → 422', y.d === 422);
    y = await yaz('gorevler/g3/yapildi', { sonuc: 'ulasildi' });
    k('Yapıldı adımsız: öneri döner, yeni görev açılmaz', y.d === 200 && y.yeni_gorev_id === null && y.oneri && ADIM_TURU_OK(y.oneri.tur) && /^\d{4}-\d{2}-\d{2}$/.test(y.oneri.tarih) && y.oneri.tarih > '2026-11-13');
    y = await yaz('gorevler/yok/yapildi', {});
    k('olmayan görev → 404', y.d === 404);
    y = await jsn(await post('gorevler/g5/yapildi', {}, { env: env4, origin: null }));
    k('Yapıldı Origin olmadan → 403', y.d === 403);

    // gorev.js: firsat_id ve tur alanları
    let gr = await yaz('gorevler', { baslik: 'Teklif hazırla', tarih: '2026-11-16', firsat_id: 'FC', tur: 'teklif' });
    let gx = tek(d4, 'SELECT * FROM gorevler WHERE id = ?', gr.id || '');
    k('görev oluştur: fırsat bağı, müşteri fırsattan, tür', gr.d === 200 && gx.firsat_id === 'FC' && gx.musteri_id === 'C' && gx.tur === 'teklif');
    gr = await yaz('gorevler/' + gx.id, { baslik: 'Teklif hazırla (güncel)', tarih: '2026-11-17' });
    gx = tek(d4, 'SELECT * FROM gorevler WHERE id = ?', gx.id);
    k('eski ekrandan görev güncellemesi fırsat bağını ve türü korur', gr.d === 200 && gx.firsat_id === 'FC' && gx.tur === 'teklif' && gx.tarih === '2026-11-17');
    gr = await yaz('gorevler', { baslik: 'X', tarih: '2026-11-16', firsat_id: 'FC', musteri_id: 'A' });
    k('görev: fırsat başka müşterinin → 422', gr.d === 422);
    gr = await yaz('gorevler', { baslik: 'X', tarih: '2026-11-16', tur: 'faks' });
    k('görev: geçersiz tür → 422', gr.d === 422);
    gr = await yaz('gorevler', { baslik: 'Eski ekran görevi', tarih: '2026-11-16' });
    k('eski ekran görev oluşturma (fırsatsız) çalışır', gr.d === 200);
    b = await al('bugun?kim=hepsi');
    k('fırsata adım eklenince adımsız listeden çıkar', !idler(b.adimsiz).includes('FC'));
  } finally { Date.now = gerçekNow; }
}
function ADIM_TURU_OK(t) { return ['ara', 'eposta', 'toplanti', 'teklif', 'diger'].includes(t); }

console.log(h.length ? `\n${h.length} KALDI` : '\nTümü GEÇTİ');
process.exit(h.length ? 1 : 0);
