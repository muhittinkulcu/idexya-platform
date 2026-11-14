// Referans sayfası (worker/referans.js), sabit adres https://idexya.com/referans: rota, başlıklar, boş listede 404, teklif bağlantısı ve
// günde bir açılış kaydı, 12 ay saklama, QR SVG'nin çözülebilirliği, `t`'nin sayfa yolu kayıtlarına girmemesi ve referans şeması.
// Sunucu gerekmez: D1 yerine node:sqlite, ASSETS yerine sahte. Worker iki kez paketlenir: boş referans listesiyle ve örnek listeyle.
// Kullanım: node tools/test-referans.mjs
import { DatabaseSync } from 'node:sqlite';
import { build } from 'esbuild';
import { mkdtempSync, writeFileSync, readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import jsQR from 'jsqr';
import { DOSYALAR, dogrula } from '../src/data/icerik-sema.js';
import { saklamaUygula } from '../worker/saklama.js';

// Worker'ı paketler; `liste` verilirse src/data/referanslar.json yerine o liste kullanılır (depodaki dosya boş kalır).
async function workerYukle(liste, giris = '../worker/index.js') {
  const eklenti = { name: 'referans-listesi', setup(b) {
    b.onLoad({ filter: /src[\\/]data[\\/]referanslar\.json$/ }, () => (liste ? { contents: JSON.stringify(liste), loader: 'json' } : undefined));
  } };
  const paket = await build({ entryPoints: [new URL(giris, import.meta.url).pathname], bundle: true, format: 'esm', platform: 'neutral', mainFields: ['module', 'main'], write: false, logLevel: 'silent', plugins: [eklenti] });
  const gecici = join(mkdtempSync(join(tmpdir(), 'referans-')), 'worker.mjs');
  writeFileSync(gecici, paket.outputFiles[0].text);
  const modul = await import(gecici);
  return giris.endsWith('index.js') ? modul.default : modul;
}
const ORNEK_LISTE = [{ ad: 'Örnek Marka A', kategori: 'E-ticaret' }, { ad: 'Örnek Marka B', kategori: 'Sağlık' }];
const bosWorker = await workerYukle(JSON.parse(readFileSync(new URL('../src/data/referanslar.json', import.meta.url), 'utf8')).length ? [] : null);
const worker = await workerYukle(ORNEK_LISTE);
// worker/referans.js JSON içe aktardığı için Node'da doğrudan değil, paketlenerek yüklenir.
const { qrSvg, rastgeleAnahtar, ANAHTAR_DESEN, REFERANS_ADRESI } = await workerYukle(ORNEK_LISTE, '../worker/referans.js');

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
      try { const c = []; for (const i of l) c.push(/^\s*(SELECT|PRAGMA|WITH)\b/i.test(i.sql) || /RETURNING/i.test(i.sql) ? await i.all() : await i.run()); s.exec('COMMIT'); return c; }
      catch (e) { s.exec('ROLLBACK'); throw e; }
    }
  };
}

// Sahte ASSETS: kabuk sayfası ve sitenin sıradan 404'ü (gerçek yapılandırmada not_found_handling: 404-page).
const KABUK = '<!doctype html><html><head><meta name="robots" content="noindex, nofollow"><link rel="canonical" href="https://idexya.com/kabuk/referanslar/"><meta property="og:url" content="https://idexya.com/kabuk/referanslar/"></head><body><section class="rf">Referanslar</section></body></html>';
const SAYFA_404 = '<!doctype html><html><body>Sayfa bulunamadı</body></html>';
const ASSETS = { async fetch(r) { const u = new URL(r.url || r); return u.pathname === '/kabuk/referanslar/' ? new Response(KABUK, { headers: { 'content-type': 'text/html' } }) : new Response(SAYFA_404, { status: 404, headers: { 'content-type': 'text/html' } }); } };

const B = 'http://localhost';
const db = sahteD1();
const env = { DB: db, ASSETS, YEREL_GIRIS: 'evet' };
const bekleyen = [];
const ctx = { waitUntil: (p) => bekleyen.push(p) };
const bitir = async () => { await Promise.all(bekleyen.splice(0)); };
const site = async (yol, o = {}) => { const r = await worker.fetch(new Request(B + yol, o), o.env || env, ctx); await bitir(); return r; };
const api = (yol, o = {}) => worker.fetch(new Request(B + '/api/yonetim/' + yol, o), o.env || env, ctx);
const post = (yol, govde, ek = {}) => api(yol, { method: 'POST', headers: { origin: B, 'content-type': 'application/json', ...(ek.headers || {}) }, body: JSON.stringify(govde), env: ek.env });
const jsn = async (r) => ({ s: r.status, ...(await r.json()) });

// --- Anahtar ve QR yardımcıları ---
const kodlar = Array.from({ length: 200 }, () => rastgeleAnahtar(10));
k('rastgele anahtar: 10 karakter, yalnız [a-z0-9]', kodlar.every((x) => ANAHTAR_DESEN.test(x)));
k('rastgele anahtar: 200 üretimde tekrar yok', new Set(kodlar).size === 200);

// QR: SVG'yi modül matrisine çevirip piksele dökeriz, jsQR (Apache-2.0, yalnız test bağımlılığı) ile geri okuruz.
function svgMatris(svg) {
  const boy = Number(/viewBox="0 0 (\d+) \1"/.exec(svg)[1]);
  const m = Array.from({ length: boy }, () => new Array(boy).fill(false));
  const d = /<path fill="#000000" d="([^"]+)"/.exec(svg)[1];
  for (const [, x, y, u] of d.matchAll(/M(\d+) (\d+)h(\d+)v1h-\3z/g)) for (let i = 0; i < Number(u); i++) m[Number(y)][Number(x) + i] = true;
  return { boy, m };
}
function coz(svg, olcek = 6) {
  const { boy, m } = svgMatris(svg);
  const w = boy * olcek, px = new Uint8ClampedArray(w * w * 4);
  for (let y = 0; y < w; y++) for (let x = 0; x < w; x++) { const v = m[Math.floor(y / olcek)][Math.floor(x / olcek)] ? 0 : 255, i = (y * w + x) * 4; px[i] = px[i + 1] = px[i + 2] = v; px[i + 3] = 255; }
  return jsQR(px, w, w);
}
const ORNEK = 'https://idexya.com/referans?t=k7m2p9x4q1';
const svg = qrSvg(ORNEK);
const { boy, m } = svgMatris(svg);
const modul = Number(/data-modul="(\d+)"/.exec(svg)[1]);
k('QR: SVG, beyaz zemin ve crispEdges', svg.startsWith('<svg') && /<rect width="\d+" height="\d+" fill="#FFFFFF"\/>/.test(svg) && /shape-rendering="crispEdges"/.test(svg));
k(`QR: 40 karakterlik bağlantı sürüm 3 (29 modül) + 2×4 sessiz alan = 37`, modul === 29 && boy === 37);
const sessizTemiz = m.every((satir, y) => satir.every((v, x) => !v || (x >= 4 && x < boy - 4 && y >= 4 && y < boy - 4)));
k('QR: 4 modül sessiz alanda hiç koyu modül yok', sessizTemiz);
k('QR: bulucu desenleri sessiz alandan hemen sonra başlıyor (sol üst 7×7 çerçeve)', [0, 1, 2, 3, 4, 5, 6].every((i) => m[4][4 + i] && m[4 + i][4] && m[10][4 + i] && m[4 + i][10]));
const okunan = coz(svg);
k('QR: jsQR ile çözülüyor ve metin aynı', !!okunan && okunan.data === ORNEK);
const okunanKucuk = coz(svg, 3);
k('QR: modül başına 3 pikselde de çözülüyor', !!okunanKucuk && okunanKucuk.data === ORNEK);
// Hata düzeltme düzeyi M: biçim bilgisindeki iki bit (ISO 18004: M = 00). jsQR çözümünden bağımsız denetim.
const bicimBit = [0, 1].map((i) => m[4 + 8][4 + i]); // (8,0) ve (8,1) — maskeli; bu yüzden XOR maskesi 101010000010010 uygulanır
const MASKE = [1, 0];
k('QR: hata düzeltme düzeyi M (biçim bitleri 00)', bicimBit.map((b, i) => (b ? 1 : 0) ^ MASKE[i]).join('') === '00');


const z = new Date().toISOString();

// --- Rota: liste boşken 404, doluyken 200 ---
let r = await bosWorker.fetch(new Request(B + '/referans'), env, ctx); await bitir();
k('liste boşken /referans sıradan 404 (boş sayfa paylaşılmaz)', r.status === 404 && (await r.text()) === SAYFA_404);
r = await site('/referans');
const govdeHtml = await r.text();
k('liste doluyken /referans 200', r.status === 200 && govdeHtml.includes('Referanslar'));
k('başlık: X-Robots-Tag noindex, nofollow', r.headers.get('x-robots-tag') === 'noindex, nofollow');
k('başlık: Referrer-Policy no-referrer', r.headers.get('referrer-policy') === 'no-referrer');
k('başlık: önbelleğe alınmaz', /no-store/.test(r.headers.get('cache-control') || ''));
k('başlık: CSP var, çerçevelenmez', /frame-ancestors 'none'/.test(r.headers.get('content-security-policy') || ''));
k('sayfa: robots meta noindex', /<meta name="robots" content="noindex, nofollow">/.test(govdeHtml));
k('sayfa: /kabuk/ kanonik ve og:url çıkarıldı', !/canonical|og:url|\/kabuk\//.test(govdeHtml));
k('sondaki eğik çizgiyle de açılır', (await site('/referans/')).status === 200);
k('HEAD 200, gövdesiz', (await site('/referans', { method: 'HEAD' })).status === 200);
for (const [ad, yol] of [['eski /r/<kod>', '/r/abcdef1234'], ['/r/', '/r/'], ['/referanslar (yönlendirme yok)', '/referanslar'], ['/referans/x', '/referans/x'], ['kabuk doğrudan', '/kabuk/referanslar/']]) {
  r = await site(yol);
  k(`${ad} → 404`, r.status === 404 && r.status !== 301 && r.status !== 302);
}
k('POST /referans sayfa vermez', (await site('/referans', { method: 'POST' })).status === 404);
k('panel kod uçları kaldırıldı', (await api('referans-kodu')).status === 404 && (await post('referans-kodu/yeni', {})).status === 404);

// --- Teklif bağlantısı ve açılış kaydı ---
db.ham.prepare("INSERT INTO musteriler (id, olusturma, guncelleme, kaynak, firma, asama) VALUES ('m1', ?, ?, 'elle', 'Örnek Müşteri', 'teklif')").run(z, z);
let v = await jsn(await post('teklifler', { musteri_id: 'm1', baslik: 'Dijital paket', kdv_orani: 20, kalemler: [{ ad: 'Google Ads yönetimi', adet: 1, birim_fiyat: 1000, tur: 'aylik' }] }));
const tid = v.id;
k('teklif oluştu', v.s === 200 && !!tid);
k('şema: teklifler.referans_anahtari sütunu var', db.ham.prepare('PRAGMA table_info(teklifler)').all().some((x) => x.name === 'referans_anahtari'));
v = await jsn(await bosWorker.fetch(new Request(B + '/api/yonetim/teklifler/' + tid), env, ctx));
k('liste boşken teklifte QR yok (referans null)', v.s === 200 && v.referans === null);
v = await jsn(await api('teklifler/' + tid));
const anahtar = db.ham.prepare('SELECT referans_anahtari FROM teklifler WHERE id = ?').get(tid).referans_anahtari;
k('teklif okununca anahtar üretildi (10 karakter)', ANAHTAR_DESEN.test(anahtar || ''));
k('teklif bağlantısı https://idexya.com/referans?t=<anahtar>', REFERANS_ADRESI === 'https://idexya.com/referans' && v.referans && v.referans.baglanti === `https://idexya.com/referans?t=${anahtar}` && v.referans.kisa === `idexya.com/referans?t=${anahtar}` && /^<svg/.test(v.referans.svg));
k('teklif QR\'ı yeni adrese çözülüyor', coz(v.referans.svg)?.data === `https://idexya.com/referans?t=${anahtar}`);
v = await jsn(await api('teklifler/' + tid));
k('ikinci okumada anahtar değişmedi', db.ham.prepare('SELECT referans_anahtari FROM teklifler WHERE id = ?').get(tid).referans_anahtari === anahtar && v.referans.acilis_gun === 0);

const acilisSayisi = () => db.ham.prepare("SELECT COUNT(*) AS n FROM kayitlar WHERE musteri_id = 'm1' AND baslik = 'Müşteri referansları açtı'").get().n;
r = await site(`/referans?t=${anahtar}`, { headers: { 'user-agent': 'Mozilla/5.0 (iPhone)' } });
k('geçerli t ile 200', r.status === 200);
k('açılış: müşteri kartına "Müşteri referansları açtı" yazıldı', acilisSayisi() === 1);
const kayit = db.ham.prepare("SELECT * FROM kayitlar WHERE baslik = 'Müşteri referansları açtı'").get();
k('açılış kaydında yalnız teklif bilgisi (IP/tarayıcı yok)', kayit.kim === 'Referans sayfası' && /^IDX-\d{4}-\d{4} · Dijital paket$/.test(kayit.detay));
k('referans_acilis yalnız teklif_id, gun, zaman tutuyor', db.ham.prepare('PRAGMA table_info(referans_acilis)').all().map((x) => x.name).sort().join(',') === 'gun,teklif_id,zaman');
await site(`/referans?t=${anahtar}`);
await site(`/referans/?t=${anahtar}`);
k('aynı gün ikinci ve üçüncü açılış yeni kayıt açmaz', acilisSayisi() === 1 && db.ham.prepare('SELECT COUNT(*) AS n FROM referans_acilis').get().n === 1);
db.ham.prepare("UPDATE referans_acilis SET gun = '2000-01-01'").run();
await site(`/referans?t=${anahtar}`);
k('ertesi gün yeni kayıt açılır', acilisSayisi() === 2);
v = await jsn(await api('teklifler/' + tid));
k('teklif yanıtında açılış günü sayısı', v.referans.acilis_gun === 2 && !!v.referans.son_acilis);
const once = acilisSayisi();
for (const t of ['yanlis12345', 'ABCDEFGHIJ', '', 'x', anahtar + 'a', "a' OR 1=1"]) {
  r = await site(`/referans?t=${encodeURIComponent(t)}`);
  k(`geçersiz t (${JSON.stringify(t)}) sayfayı bozmaz`, r.status === 200);
}
k('geçersiz t kayıt düşmez', acilisSayisi() === once);
db.ham.prepare('DELETE FROM referans_acilis').run();
await site(`/referans?t=${anahtar}`, { headers: { 'user-agent': 'WhatsApp/2.23.20.0 A' } });
await site(`/referans?t=${anahtar}`, { headers: { 'user-agent': 'facebookexternalhit/1.1' } });
k('bağlantı önizleyicisi (WhatsApp, Facebook) açılış sayılmaz', acilisSayisi() === once);
r = await bosWorker.fetch(new Request(`${B}/referans?t=${anahtar}`, { headers: { 'user-agent': 'Mozilla/5.0' } }), env, ctx); await bitir();
k('liste boşken geçerli t: 404 ve kayıt yok', r.status === 404 && acilisSayisi() === once);

// --- t sayfa yolu kayıtlarına girmez: istemci location.pathname gönderir, sunucu sorgu dizgesini atar ---
const istemci = ['../src/scripts/form.js', '../src/scripts/asistan.js', '../src/scripts/olcum.js'].map((p) => readFileSync(new URL(p, import.meta.url), 'utf8'));
k('form, asistan ve ölçüm betikleri sayfa yolu olarak yalnız location.pathname gönderiyor', istemci.every((s) => /location\.pathname/.test(s) && !/sayfa:\s*location\.(href|search)|p:\s*location\.(href|search)/.test(s)));
await worker.fetch(new Request(B + '/api/olcum', { method: 'POST', headers: { 'content-type': 'application/json', 'user-agent': 'Mozilla/5.0' }, body: JSON.stringify({ t: 'g', p: `/referans?t=${anahtar}`, c: 'mobil', r: 'dogrudan' }) }), env, ctx);
await bitir();
const sayfalar = db.ham.prepare('SELECT sayfa FROM ziyaret_gunluk').all().map((x) => x.sayfa);
k('ziyaret sayacı /referans yazar, t yazmaz', sayfalar.includes('/referans') && !sayfalar.some((x) => x.includes(anahtar)));
const kamu = (yol, govde) => worker.fetch(new Request(B + yol, { method: 'POST', headers: { origin: B, 'content-type': 'application/json', 'cf-connecting-ip': '203.0.113.9' }, body: JSON.stringify(govde) }), env, ctx);
r = await kamu('/api/talep', { ad: 'Deneme Kişi', eposta: 'deneme@ornek.example', kvkk: true, kaynak: 'analiz', sayfa: '/referans', mesaj: 'Merhaba' });
await bitir();
k('referans sayfasından talep: sayfa /referans, anahtar yok', r.status === 200 && db.ham.prepare("SELECT sayfa FROM talepler WHERE ad = 'Deneme Kişi'").get().sayfa === '/referans');
const tumDb = JSON.stringify(['talepler', 'asistan_mesajlari', 'asistan_onay', 'bulten', 'ziyaret_gunluk', 'islem_kaydi'].map((t) => db.ham.prepare(`SELECT * FROM ${t}`).all()));
k('sayfa yolu tutan tablolarda teklif anahtarı geçmiyor', !tumDb.includes(anahtar));
k('kod düzeni kalktı: ayarlar tablosuna referans_kodu yazılmadı', !db.ham.prepare("SELECT 1 FROM ayarlar WHERE anahtar = 'referans_kodu'").get());

// --- Taslak silinince açılışları da silinir ---
db.ham.prepare("INSERT INTO referans_acilis (teklif_id, gun, zaman) VALUES (?, '2001-01-01', ?)").run(tid, z);
k('taslak teklif silindi', (await post(`teklifler/${tid}/sil`, {})).status === 200);
k('silinen teklifin açılış satırları da silindi', db.ham.prepare('SELECT COUNT(*) AS n FROM referans_acilis WHERE teklif_id = ?').get(tid).n === 0);

// --- Saklama: referans_acilis 12 ay ---
db.ham.prepare('DELETE FROM referans_acilis').run();
const gunOnce = (g) => new Date(Date.now() - g * 86400000).toISOString();
db.ham.prepare("INSERT INTO referans_acilis (teklif_id, gun, zaman) VALUES ('eski', '2025-01-01', ?), ('yeni', '2026-01-01', ?)").run(gunOnce(366), gunOnce(300));
const sk = await saklamaUygula(db);
const kalan = db.ham.prepare('SELECT teklif_id FROM referans_acilis').all().map((x) => x.teklif_id);
k('saklama: 12 aydan eski açılış silindi, yenisi kaldı', kalan.length === 1 && kalan[0] === 'yeni');
k('saklama: özet satırında referans açılışları', sk.some((x) => /Referans sayfası açılışları/.test(x.ad) && x.silinen === 1));

// --- Şema ---
const sema = DOSYALAR.referanslar.sema;
let d = dogrula(sema, [{ ad: 'Örnek Marka A', kategori: 'E-ticaret', hizmet: 'Google Ads', aciklama: 'Kısa açıklama', site: 'https://ornek.example', logo: '/api/medya/abc12345' }]);
k('şema: tam öğe geçerli', !!d.veri && d.veri[0].kategori === 'E-ticaret' && d.veri[0].site === 'https://ornek.example');
d = dogrula(sema, [{ ad: 'Örnek Marka A', logo: '' }]);
k('şema: kategori zorunlu', !!d.hatalar && d.hatalar.some((x) => /Kategori: boş bırakılamaz/.test(x)));
d = dogrula(sema, [{ ad: 'A', kategori: 'Sağlık', aciklama: 'x'.repeat(241) }]);
k('şema: açıklama en çok 240 karakter', !!d.hatalar && d.hatalar.some((x) => /en fazla 240/.test(x)));
d = dogrula(sema, [{ ad: 'A', kategori: 'Sağlık', aciklama: 'x'.repeat(240) }]);
k('şema: 240 karakter kabul', !!d.veri);
for (const s of ['http://ornek.example', '/tr/iletisim', 'javascript:alert(1)', 'https://a b.com']) {
  d = dogrula(sema, [{ ad: 'A', kategori: 'Sağlık', site: s }]);
  k(`şema: site "${s}" reddedilir`, !!d.hatalar);
}
d = dogrula(sema, [{ ad: 'A', kategori: 'Kendi kategorim' }]);
k('şema: liste dışı kategori serbest metin olarak kabul', !!d.veri && d.veri[0].kategori === 'Kendi kategorim');
k('şema: kategori için öneri listesi tanımlı', Array.isArray(sema.ogeSema.alanlar.kategori.oneriler) && ['E-ticaret', 'Sağlık', 'Eğitim', 'Hizmet', 'Üretim', 'Turizm'].every((x) => sema.ogeSema.alanlar.kategori.oneriler.includes(x)));
d = dogrula(sema, [{ ad: 'Eski kayıt', kategori: 'Hizmet', logo: '/api/medya/abc12345' }]);
k('şema: yalnız ad + logo + kategori de geçerli (eski düzen)', !!d.veri && !('site' in d.veri[0]));


// --- Bağlantı sitede yok: menü, alt bilgi, arama dizini, site haritası, sayfalar ---
const arama = readFileSync(new URL('../src/pages/arama.json.js', import.meta.url), 'utf8');
const menu = readFileSync(new URL('../src/data/site-menu.json', import.meta.url), 'utf8');
const BAG = /["'(]\/referans(\/|\?|["')#])|idexya\.com\/referans/;
k('arama dizininde /referans yok', !BAG.test(arama));
k('site menüsü ve alt bilgide /referans yok', !BAG.test(menu));
// Kamuya açık kaynaklarda /referans bağlantısı yok (panel, kabuk, sunucu ve testler hariç)
const tara = (d, l = []) => { for (const a of readdirSync(d)) { const y = join(d, a); if (statSync(y).isDirectory()) tara(y, l); else if (/\.(astro|js|ts|json|mjs|html)$/.test(a)) l.push(y); } return l; };
const kok = new URL('..', import.meta.url).pathname;
const kamuKaynak = tara(join(kok, 'src')).concat(tara(join(kok, 'public'))).filter((y) => !/src\/pages\/yonetim\/|src\/pages\/kabuk\/|src\/data\/icerik-sema\.js|src\/scripts\/yonetim\//.test(y));
const bagliDosya = kamuKaynak.filter((y) => BAG.test(readFileSync(y, 'utf8')));
k('sitenin kamu sayfalarında /referans bağlantısı yok', bagliDosya.length === 0);
if (bagliDosya.length) console.log('  bağlantı bulunan:', bagliDosya);
const dist = join(kok, 'dist');
if (existsSync(join(dist, 'sitemap.xml'))) {
  k('derlenmiş site haritasında /referans ve /kabuk/ yok', !/\/referans|\/kabuk\//.test(readFileSync(join(dist, 'sitemap.xml'), 'utf8')));
  k('derlenmiş arama dizininde /referans yok', !/\/referans/.test(readFileSync(join(dist, 'arama.json'), 'utf8')));
  const htmller = tara(dist).filter((y) => y.endsWith('.html') && !/dist\/(yonetim|kabuk)\//.test(y));
  k('derlenmiş kamu sayfalarında /referans bağlantısı yok', htmller.every((y) => !/href="(https:\/\/idexya\.com)?\/referans/.test(readFileSync(y, 'utf8'))));
} else console.log('ATLANDI derlenmiş site denetimi (önce npm run build)');
const kabukKaynak = readFileSync(new URL('../src/pages/kabuk/referanslar.astro', import.meta.url), 'utf8');
k('kabuk: aramaya kapalı (noindex)', /<Site [^>]*aramayaKapali/.test(kabukKaynak));
k('kabuk: site bağlantıları rel="noopener nofollow"', /rel="noopener nofollow"/.test(kabukKaynak));
k('referans sayfası satır içi betik eklemedi (yalnız dış dosya; Site.astro düzeninin betikleri ayrı)', !/<script(?![^>]*\bsrc=)[^>]*>/.test(kabukKaynak.replace(/<!--[\s\S]*?-->/g, '')));
k('kabuk: hareketi azalt tercihi destekleniyor', /prefers-reduced-motion:reduce/.test(kabukKaynak));
const panel = readFileSync(new URL('../src/pages/yonetim/site-content.astro', import.meta.url), 'utf8');
k('panel: sabit bağlantı, "Bağlantıyı kopyala" ve not; kod üretme yok', panel.includes('https://idexya.com/referans') && panel.includes('Bağlantıyı kopyala') && panel.includes('Bu sayfa sitede bağlantı olarak görünmez; adresi bilen açabilir.') && !/referans-kodu|Yeni kod üret/.test(panel));

console.log(h.length ? `\n${h.length} KALDI:\n` + h.join('\n') : '\nTüm kontroller geçti.');
process.exit(h.length ? 1 : 0);
