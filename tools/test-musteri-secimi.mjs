// Tek müşteri seçimi (1.3, seçenek A): üst alanda müşteri seçiliyken yalnız o müşteriye bağlı CRM kartları ve o müşterinin
// site verisi görünür; seçim kaldırılınca hepsi. Saf kural (src/data/musteri-secim.js), sunucu süzmesi (?ana=) ve seçici
// listesi ucu (ana-kayit/musteriler). Sunucu gerekmez: D1 yerine node:sqlite.
// Kullanım: node tools/test-musteri-secimi.mjs
import { DatabaseSync } from 'node:sqlite';
import { build } from 'esbuild';
import { mkdtempSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { anaParam, suzmeYolu, seciciListesi, gecerliSecim, kartSuz, ANA_PARAM } from '../src/data/musteri-secim.js';
import { MUSTERI_ANAHTARI, musteriOku, musteriYaz } from '../src/idexya-kabuk/kabuk-cekirdek.js';

const h = [];
const k = (ad, x) => { console.log((x ? 'GEÇTİ ' : 'KALDI ') + ad); if (!x) h.push(ad); };
const kok = new URL('..', import.meta.url).pathname;

// --- 1. Saf kural ---
const U = (q) => new URL('http://localhost/api/yonetim/musteriler' + q);
k('anaParam: geçerli kimlik', anaParam(U('?ana=c-101')) === 'c-101');
k('anaParam: yoksa boş', anaParam(U('')) === '');
k('anaParam: geçersiz kimlik yok sayılır (yol, boşluk, tırnak)', ['../x', 'a b', "x'--", '', '-bas'].every((v) => anaParam(U('?ana=' + encodeURIComponent(v))) === ''));
k('anaParam: 64 karakterden uzun yok sayılır', anaParam(U('?ana=' + 'a'.repeat(65))) === '');
k('suzmeYolu: seçim yoksa yol aynı', suzmeYolu('musteriler', '') === 'musteriler');
k('suzmeYolu: soru işaretsiz yola ekler', suzmeYolu('musteriler', 'c1') === 'musteriler?ana=c1');
k('suzmeYolu: var olan sorguya ekler', suzmeYolu('musteriler?arsiv=1', 'c1') === 'musteriler?arsiv=1&ana=c1');
k('suzmeYolu: geçersiz kimlik eklenmez', suzmeYolu('site-saglik', '../x') === 'site-saglik');
k('ANA_PARAM adı', ANA_PARAM === 'ana');

const LISTE = [
  { id: 'c2', ad: 'Zeytin Evi', durum: 'aktif' },
  { id: 'c1', ad: 'Işık Mobilya', durum: 'aktif' },
  { id: 'c3', ad: 'Çınar Yapı', durum: 'pasif' },
  { id: 'c4', ad: 'İnci Kozmetik', durum: 'arsiv' },
  { id: '../kotu', ad: 'Kötü kimlik', durum: 'aktif' }
];
k('seciciListesi: varsayılan yalnız aktif, Türkçe sıralı, geçersiz kimlik atılır',
  JSON.stringify(seciciListesi(LISTE).map((x) => x.id)) === JSON.stringify(['c1', 'c2']));
k('seciciListesi: seçili pasif müşteri listede kalır', seciciListesi(LISTE, 'c3').some((x) => x.id === 'c3'));
k('seciciListesi: arama Türkçe küçük harfle (ışık)', JSON.stringify(seciciListesi(LISTE, '', 'IŞIK').map((x) => x.id)) === '["c1"]');
k('seciciListesi: arama boşlukla', seciciListesi(LISTE, '', '  zeytin ').length === 1);
k('seciciListesi: dizi değilse boş', seciciListesi(null).length === 0);
k('gecerliSecim: listedeki kimlik', gecerliSecim('c3', LISTE) === 'c3');
k('gecerliSecim: bilinmeyen kimlik yok sayılır', gecerliSecim('c99', LISTE) === '');
k('gecerliSecim: geçersiz biçim yok sayılır', gecerliSecim('../x', LISTE) === '');
k('gecerliSecim: liste alınamadıysa seçime dokunulmaz', gecerliSecim('c99', null) === 'c99');
const KARTLAR = [{ id: 'k1', ana_kayit_id: 'c1' }, { id: 'k2', ana_kayit_id: null }, { id: 'k3', ana_kayit_id: 'c2' }, { id: 'k4', ana_kayit_id: 'c1' }];
k('kartSuz: seçim yoksa hepsi', kartSuz(KARTLAR, '').length === 4);
k('kartSuz: seçimde yalnız bağlı kartlar, bağsız gizli', JSON.stringify(kartSuz(KARTLAR, 'c1').map((x) => x.id)) === '["k1","k4"]');
k('kartSuz: bilinmeyen müşteri boş', kartSuz(KARTLAR, 'c99').length === 0);

// Ortak anahtar (kabuk çekirdeği) ile aynı biçim: seçim yazılır, temizlenir; geçersiz değer yazılmaz.
const depo = { v: {}, getItem(a) { return a in this.v ? this.v[a] : null; }, setItem(a, b) { this.v[a] = String(b); }, removeItem(a) { delete this.v[a]; } };
musteriYaz(depo, 'c1');
k('ortak anahtar: idx-musteri yazıldı', MUSTERI_ANAHTARI === 'idx-musteri' && depo.v['idx-musteri'] === 'c1' && musteriOku(depo) === 'c1');
musteriYaz(depo, '');
k('ortak anahtar: boş seçim anahtarı siler', !('idx-musteri' in depo.v));
depo.v['idx-musteri'] = '<b>x</b>';
k('ortak anahtar: bozuk değer okunmaz', musteriOku(depo) === '');

// --- 2. Sunucu: ?ana= süzmesi ve seçici listesi ---
const paket = await build({ entryPoints: [join(kok, 'worker/index.js')], bundle: true, format: 'esm', platform: 'neutral', mainFields: ['module', 'main'], write: false, logLevel: 'silent' });
const gecici = join(mkdtempSync(join(tmpdir(), 'musteri-secimi-')), 'worker.mjs');
writeFileSync(gecici, paket.outputFiles[0].text);
const worker = (await import(gecici)).default;

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
const db = sahteD1();
const env = { DB: db, YEREL_GIRIS: 'evet' };
const istek = async (yol) => { const r = await worker.fetch(new Request('http://localhost/api/yonetim/' + yol), env, {}); return { d: r.status, ...(await r.json()) }; };

const ilk = await istek('musteriler');
k('şema kuruldu, boş liste', ilk.d === 200 && ilk.musteriler.length === 0);
const z = '2026-11-19T08:00:00Z';
const ekle = (id, ana, arsiv = null) => db.ham.prepare(`INSERT INTO musteriler (id, olusturma, guncelleme, firma, kaynak, asama, ana_kayit_id, arsiv) VALUES (?, ?, ?, ?, 'elle', 'yeni', ?, ?)`).run(id, z, z, 'Firma ' + id, ana, arsiv);
ekle('k1', 'c1'); ekle('k2', null); ekle('k3', 'c2'); ekle('k4', 'c1', z); ekle('k5', null, z);

let v = await istek('musteriler');
k('seçim yok: bütün etkin kartlar', v.musteriler.length === 3 && v.arsivde === 2 && v.ana === null);
k('liste ana_kayit_id alanını taşır', v.musteriler.every((x) => 'ana_kayit_id' in x));
v = await istek('musteriler?ana=c1');
k('seçim c1: yalnız c1 kartı, bağsız kart gizli', JSON.stringify(v.musteriler.map((x) => x.id)) === '["k1"]' && v.ana === 'c1');
k('seçim c1: arşiv sayısı da süzülür', v.arsivde === 1);
v = await istek('musteriler?arsiv=1&ana=c1');
k('seçim c1 + arşiv: yalnız c1 arşiv kartı', JSON.stringify(v.musteriler.map((x) => x.id)) === '["k4"]');
v = await istek('musteriler?ana=c99');
k('bilinmeyen müşteri: boş liste (boş durum gösterilir), hata yok', v.d === 200 && v.musteriler.length === 0 && v.arsivde === 0);
v = await istek('musteriler?ana=' + encodeURIComponent("x' OR 1=1 --"));
k('geçersiz kimlik yok sayılır: süzgeçsiz liste', v.musteriler.length === 3 && v.ana === null);
k('kartlar silinmedi', db.ham.prepare('SELECT COUNT(*) AS n FROM musteriler').get().n === 5);

// Site verisi: site_saglik_hedef.musteri_id → musteriler.ana_kayit_id
const site = (id, mid, adres, arsiv = null) => db.ham.prepare('INSERT INTO site_saglik_hedef (id, musteri_id, adres, aktif, olusturma, ekleyen, arsiv) VALUES (?, ?, ?, 1, ?, ?, ?)').run(id, mid, adres, z, 'test', arsiv);
site('s1', 'k1', 'https://c1.example.com/'); site('s2', 'k2', 'https://bagsiz.example.com/'); site('s3', 'k3', 'https://c2.example.com/'); site('s4', 'k4', 'https://c1-eski.example.com/', z);
v = await istek('site-saglik');
k('siteler: seçim yok, hepsi', v.d === 200 && v.hedefler.length === 3 && v.arsivde === 1);
v = await istek('site-saglik?ana=c1');
k('siteler: seçim c1, yalnız c1 sitesi', JSON.stringify(v.hedefler.map((x) => x.id)) === '["s1"]' && v.arsivde === 1);
k('siteler: ekleme formundaki kartlar da c1', JSON.stringify(v.musteriler.map((x) => x.id)) === '["k1"]');
v = await istek('site-saglik?arsiv=1&ana=c1');
k('siteler: seçim c1 + arşiv', JSON.stringify(v.hedefler.map((x) => x.id)) === '["s4"]');
v = await istek('site-saglik?ana=c99');
k('siteler: bilinmeyen müşteri boş', v.hedefler.length === 0 && v.arsivde === 0);

// Genel bakış özeti (IDOS karşılama kartı da okur): ?ana= ile CRM sayıları süzülür, bağsız alanlar ajans geneli kalır.
db.ham.exec("UPDATE musteriler SET deger = 1000, asama = 'teklif' WHERE id = 'k1'");
db.ham.exec("UPDATE musteriler SET deger = 500 WHERE id = 'k2'");
db.ham.exec("UPDATE musteriler SET deger = 300, asama = 'kazanildi' WHERE id = 'k3'");
const talep = (id, durum, mid) => db.ham.prepare("INSERT INTO talepler (id, olusturma, kaynak, dogrulama, durum, musteri_id) VALUES (?, ?, 'form', 'tamam', ?, ?)").run(id, z, durum, mid);
talep('t1', 'yeni', null); talep('t2', 'yeni', null); talep('t3', 'crm', 'k1');
const kayit = (id, mid) => db.ham.prepare("INSERT INTO kayitlar (id, musteri_id, zaman, tur, baslik, kim) VALUES (?, ?, ?, 'not', 'Not', 'test')").run(id, mid, z);
kayit('r1', 'k1'); kayit('r2', 'k2'); kayit('r3', 'k3');
const destek = (id, mid, durum = 'acik') => db.ham.prepare("INSERT INTO destek_talepleri (id, no, uye_id, musteri_id, konu, durum, olusturma, guncelleme, son_yazan) VALUES (?, ?, 'u1', ?, 'Konu', ?, ?, ?, 'uye')").run(id, 'D-' + id, mid, durum, z, z);
destek('d1', 'k1'); destek('d2', null); destek('d3', 'k3'); destek('d4', 'k1', 'kapali');
const ALANLAR = ['talepler', 'musteri', 'asamalar', 'sonKayitlar', 'uyeler', 'bekleyenYorum', 'bekleyenDestek', 'reklam'];
const yeniTalep = (o) => (o.talepler.find((x) => x.durum === 'yeni') || {}).n;
v = await istek('ozet');
k('özet: seçim yok, ajans geneli (3 kart, hat 1500, 3 açık destek)', v.d === 200 && v.musteri.n === 3 && v.musteri.hat === 1500 && v.bekleyenDestek === 3 && v.sonKayitlar.length === 3);
k('özet: seçim yok, eski alan adları duruyor', ALANLAR.every((a) => a in v) && v.ok === true);
k('özet: seçim yok, suzgec boş', v.suzgec.ana === null && v.suzgec.suzulen.length === 0 && JSON.stringify(v.suzgec.suzulmeyen) === JSON.stringify(ALANLAR));
const genelTalep = yeniTalep(v);
v = await istek('ozet?ana=c1');
k('özet c1: yalnız c1 kartı (arşivli k4 hariç), hat 1000', v.musteri.n === 1 && v.musteri.hat === 1000);
k('özet c1: aşamalar yalnız c1', JSON.stringify(v.asamalar) === JSON.stringify([{ asama: 'teklif', n: 1 }]));
k('özet c1: son kayıtlar yalnız c1 kartından', JSON.stringify(v.sonKayitlar.map((x) => x.musteri_id)) === '["k1"]');
k('özet c1: açık destek yalnız c1 kartına bağlı olan', v.bekleyenDestek === 1);
k('özet c1: site talepleri süzülmez (ajans geneli)', yeniTalep(v) === genelTalep && genelTalep === 2);
k('özet c1: suzgec alanı', v.suzgec.ana === 'c1' && JSON.stringify(v.suzgec.suzulen) === '["musteri","asamalar","sonKayitlar","bekleyenDestek"]'
  && JSON.stringify(v.suzgec.suzulmeyen) === '["talepler","uyeler","bekleyenYorum","reklam"]');
k('özet c1: eski alan adları duruyor', ALANLAR.every((a) => a in v));
v = await istek('ozet?ana=c2');
k('özet c2: kazanılan kart hatta sayılmaz', v.musteri.n === 1 && v.musteri.hat === 0 && v.bekleyenDestek === 1);
v = await istek('ozet?ana=c99');
k('özet bilinmeyen müşteri: sıfır kart, değer yok (null), hata yok', v.d === 200 && v.musteri.n === 0 && v.musteri.hat === null && v.asamalar.length === 0 && v.sonKayitlar.length === 0 && v.bekleyenDestek === 0);
for (const kotu of ["x' OR 1=1 --", '../c1', '', 'a'.repeat(65)]) {
  v = await istek('ozet?ana=' + encodeURIComponent(kotu));
  k(`özet geçersiz kimlik (${kotu.slice(0, 12) || 'boş'}): süzgeçsiz`, v.d === 200 && v.musteri.n === 3 && v.suzgec.ana === null);
}

// Seçici listesi: ana_musteri önbelleğinden, IDOS'a istek gitmez (env'de IDOS ayarı yok).
const am = (id, marka, durum, veri) => db.ham.prepare('INSERT INTO ana_musteri (musteri_id, marka, durum, veri, guncelleme, cekim, parti) VALUES (?, ?, ?, ?, ?, ?, ?)').run(id, marka, durum, JSON.stringify(veri), z, z, 'p1');
am('c1', 'Işık Mobilya', 'aktif', { musteri_id: 'c1', marka: 'Işık Mobilya', unvan: 'Işık Mobilya A.Ş.' });
am('c2', null, 'aktif', { musteri_id: 'c2', unvan: 'Zeytin Evi Ltd.' });
am('c3', 'Çınar Yapı', 'pasif', { musteri_id: 'c3' });
v = await istek('ana-kayit/musteriler');
k('seçici listesi: 3 müşteri, kurulu değil bilgisi', v.d === 200 && v.musteriler.length === 3 && v.kurulu === false);
k('seçici listesi: ad markadan, yoksa unvandan', v.musteriler.find((x) => x.id === 'c2').ad === 'Zeytin Evi Ltd.' && v.musteriler.find((x) => x.id === 'c1').ad === 'Işık Mobilya');
k('seçici listesi: yalnız kimlik, ad, durum (en az veri)', v.musteriler.every((x) => JSON.stringify(Object.keys(x).sort()) === '["ad","durum","id"]'));
k('seçici listesi + kural: varsayılan aktifler', seciciListesi(v.musteriler).map((x) => x.id).join() === 'c1,c2');

// --- 3. Sayfa düzeni: süzülen sayfalar işaretli, ötekiler "süzülmez" der; ad adrese/sekmeye yazılmaz ---
const oku = (y) => readFileSync(join(kok, y), 'utf8');
k('CRM sayfası süzülür', /<Yonetim[^>]*\bmusteriSuzgec\b/.test(oku('src/pages/yonetim/crm.astro')));
k('Müşteri siteleri sayfası süzülür', /<Yonetim[^>]*\bmusteriSuzgec\b/.test(oku('src/pages/yonetim/client-sites.astro')));
for (const s of ['performance', 'visitors', 'seo', 'site-content', 'theme', 'members', 'dashboard']) {
  k(`${s} süzülmez işaretli değil`, !/\bmusteriSuzgec\b/.test(oku(`src/pages/yonetim/${s}.astro`)));
}
const secici = oku('src/scripts/yonetim/musteri-secici.js');
k('seçici: süzülmez ipucu metni', secici.includes('Bu sayfa müşteriye göre süzülmez'));
k('seçici: adres ya da sekme adı yazılmaz', !/document\.title|history\.(push|replace)State|location\.(href|search|hash)\s*=/.test(secici));
k('seçici: storage olayını dinler', /addEventListener\('storage'/.test(secici));
k('seçici: listede olmayan kimlik temizlenir', /gecerliSecim\(id, liste\)/.test(secici) && /musteriSec\(''\)/.test(secici));
k('seçici: kabuk paketinde', /musteri-secici\.js/.test(oku('src/scripts/yonetim/kabuk-giris.js')));
// Derleme varsa: çıktıda yalnız süzülen sayfalarda işaret.
if (existsSync(join(kok, 'dist/yonetim/crm/index.html'))) {
  k('derleme: crm işaretli', /data-musteri-suzgec="evet"/.test(oku('dist/yonetim/crm/index.html')));
  k('derleme: visitors işaretsiz', !/data-musteri-suzgec/.test(oku('dist/yonetim/visitors/index.html')));
} else console.log('ATLANDI derleme denetimi (dist yok; önce npm run build)');

console.log(h.length ? `\n${h.length} denetim KALDI` : '\nTüm denetimler geçti');
process.exit(h.length ? 1 : 0);
