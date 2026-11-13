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

console.log(h.length ? `\n${h.length} KALDI` : '\nTümü GEÇTİ');
process.exit(h.length ? 1 : 0);
