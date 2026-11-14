// Gizli referans sayfası (worker/referans.js): rota ve kod doğrulaması, başlıklar, teklif bağlantısı ve günde bir açılış kaydı,
// panel kod uçları, QR SVG'nin çözülebilirliği ve referans şeması. Sunucu gerekmez: D1 yerine node:sqlite, ASSETS yerine sahte.
// Kullanım: node tools/test-referans.mjs
import { DatabaseSync } from 'node:sqlite';
import { build } from 'esbuild';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import jsQR from 'jsqr';
import { qrSvg, rastgeleKod, KOD_DESEN, ANAHTAR_DESEN } from '../worker/referans.js';
import { DOSYALAR, dogrula } from '../src/data/icerik-sema.js';

const paket = await build({ entryPoints: [new URL('../worker/index.js', import.meta.url).pathname], bundle: true, format: 'esm', platform: 'neutral', mainFields: ['module', 'main'], write: false, logLevel: 'silent' });
const gecici = join(mkdtempSync(join(tmpdir(), 'referans-')), 'worker.mjs');
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

// --- Kod ve QR yardımcıları ---
const kodlar = Array.from({ length: 200 }, () => rastgeleKod(10));
k('rastgele kod: 10 karakter, yalnız [a-z0-9]', kodlar.every((x) => ANAHTAR_DESEN.test(x) && KOD_DESEN.test(x)));
k('rastgele kod: 200 üretimde tekrar yok', new Set(kodlar).size === 200);

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
const ORNEK = 'https://idexya.com/r/abcde12345?t=k7m2p9x4q1';
const svg = qrSvg(ORNEK);
const { boy, m } = svgMatris(svg);
const modul = Number(/data-modul="(\d+)"/.exec(svg)[1]);
k('QR: SVG, beyaz zemin ve crispEdges', svg.startsWith('<svg') && /<rect width="\d+" height="\d+" fill="#FFFFFF"\/>/.test(svg) && /shape-rendering="crispEdges"/.test(svg));
k(`QR: 44 karakterlik bağlantı sürüm 4 (33 modül) + 2×4 sessiz alan = 41`, modul === 33 && boy === 41);
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

// --- Rota: kod yokken her şey 404 ---
let r = await site('/r/abcdef1234');
k('kod tanımlı değilken /r/<kod> sıradan 404', r.status === 404 && (await r.text()) === SAYFA_404);

// --- Panel: kod üret ---
k('oturumsuz kod okuma 401', (await api('referans-kodu', { env: { DB: db, ASSETS } })).status === 401);
k('oturumsuz kod üretme 401', (await post('referans-kodu/yeni', {}, { env: { DB: db, ASSETS } })).status === 401);
k('başka kaynaktan kod üretme 403', (await post('referans-kodu/yeni', {}, { headers: { origin: 'https://kotu.example' } })).status === 403);
let v = await jsn(await api('referans-kodu'));
k('kod yokken GET: kod null', v.s === 200 && v.kod === null && v.baglanti === null);
v = await jsn(await post('referans-kodu/yeni', {}));
const kod1 = v.kod;
k('kod üretildi: 10 karakter, bağlantı https://idexya.com/r/<kod>', v.s === 200 && KOD_DESEN.test(kod1) && v.baglanti === `https://idexya.com/r/${kod1}`);
k('kod ayarlar tablosunda', db.ham.prepare("SELECT deger FROM ayarlar WHERE anahtar = 'referans_kodu'").get().deger === kod1);
k('kod üretimi işlem kaydında', !!db.ham.prepare("SELECT 1 FROM islem_kaydi WHERE islem = 'referans_kodu_yenilendi'").get());
k('genel Ayarlar ucunda referans kodu görünmez', !JSON.stringify(await (await api('ayarlar')).json()).includes(kod1));

// --- Rota: doğru ve yanlış kod ---
r = await site('/r/' + kod1);
const govdeHtml = await r.text();
k('doğru kod 200', r.status === 200 && govdeHtml.includes('Referanslar'));
k('başlık: X-Robots-Tag noindex, nofollow', r.headers.get('x-robots-tag') === 'noindex, nofollow');
k('başlık: Referrer-Policy no-referrer', r.headers.get('referrer-policy') === 'no-referrer');
k('başlık: önbelleğe alınmaz', /no-store/.test(r.headers.get('cache-control') || ''));
k('başlık: CSP var, çerçevelenmez', /frame-ancestors 'none'/.test(r.headers.get('content-security-policy') || ''));
k('sayfa: robots meta noindex', /<meta name="robots" content="noindex, nofollow">/.test(govdeHtml));
k('sayfa: /kabuk/ kanonik ve og:url çıkarıldı', !/canonical|og:url|\/kabuk\//.test(govdeHtml));
k('sondaki eğik çizgiyle de açılır', (await site('/r/' + kod1 + '/')).status === 200);
const yanlis = kod1.slice(0, -1) + (kod1.endsWith('a') ? 'b' : 'a');
for (const [ad, yol] of [['yanlış kod', '/r/' + yanlis], ['kısa kod (5)', '/r/abcde'], ['uzun kod (13)', '/r/abcdefghijklm'], ['büyük harf', '/r/' + kod1.toUpperCase()], ['ek yol', '/r/' + kod1 + '/x'], ['kök', '/r/'], ['özel karakter', '/r/abc%27def1']]) {
  r = await site(yol);
  k(`${ad} → sıradan 404 (aynı gövde)`, r.status === 404 && (await r.text()) === SAYFA_404);
}
k('POST /r/<kod> sayfa vermez', (await site('/r/' + kod1, { method: 'POST' })).status === 404);
k('kabuk doğrudan açılmaz', (await site('/kabuk/referanslar/')).status === 404);

// --- Teklif bağlantısı ve açılış kaydı ---
const z = new Date().toISOString();
db.ham.prepare("INSERT INTO musteriler (id, olusturma, guncelleme, kaynak, firma, asama) VALUES ('m1', ?, ?, 'elle', 'Örnek Marka A', 'teklif')").run(z, z);
v = await jsn(await post('teklifler', { musteri_id: 'm1', baslik: 'Dijital paket', kdv_orani: 20, kalemler: [{ ad: 'Google Ads yönetimi', adet: 1, birim_fiyat: 1000, tur: 'aylik' }] }));
const tid = v.id;
k('teklif oluştu', v.s === 200 && !!tid);
k('şema: teklifler.referans_anahtari sütunu var', db.ham.prepare('PRAGMA table_info(teklifler)').all().some((x) => x.name === 'referans_anahtari'));
v = await jsn(await api('teklifler/' + tid));
const anahtar = db.ham.prepare('SELECT referans_anahtari FROM teklifler WHERE id = ?').get(tid).referans_anahtari;
k('teklif okununca anahtar üretildi (10 karakter)', ANAHTAR_DESEN.test(anahtar || ''));
k('teklif yanıtında bağlantı ve QR', v.referans && v.referans.baglanti === `https://idexya.com/r/${kod1}?t=${anahtar}` && v.referans.kisa === `idexya.com/r/${kod1}?t=${anahtar}` && /^<svg/.test(v.referans.svg));
k('teklif QR\'ı bağlantıya çözülüyor', coz(v.referans.svg)?.data === v.referans.baglanti);
v = await jsn(await api('teklifler/' + tid));
k('ikinci okumada anahtar değişmedi', db.ham.prepare('SELECT referans_anahtari FROM teklifler WHERE id = ?').get(tid).referans_anahtari === anahtar && v.referans.acilis_gun === 0);

const acilisSayisi = () => db.ham.prepare("SELECT COUNT(*) AS n FROM kayitlar WHERE musteri_id = 'm1' AND baslik = 'Müşteri referansları açtı'").get().n;
r = await site(`/r/${kod1}?t=${anahtar}`, { headers: { 'user-agent': 'Mozilla/5.0 (iPhone)' } });
k('geçerli t ile 200', r.status === 200);
k('açılış: müşteri kartına "Müşteri referansları açtı" yazıldı', acilisSayisi() === 1);
const kayit = db.ham.prepare("SELECT * FROM kayitlar WHERE baslik = 'Müşteri referansları açtı'").get();
k('açılış kaydında yalnız teklif bilgisi (IP/tarayıcı yok)', kayit.kim === 'Referans sayfası' && /^IDX-\d{4}-\d{4} · Dijital paket$/.test(kayit.detay));
const acilisSutun = db.ham.prepare('PRAGMA table_info(referans_acilis)').all().map((x) => x.name).sort().join(',');
k('referans_acilis yalnız teklif_id, gun, zaman tutuyor', acilisSutun === 'gun,teklif_id,zaman');
await site(`/r/${kod1}?t=${anahtar}`);
await site(`/r/${kod1}/?t=${anahtar}`);
k('aynı gün ikinci ve üçüncü açılış yeni kayıt açmaz', acilisSayisi() === 1 && db.ham.prepare('SELECT COUNT(*) AS n FROM referans_acilis').get().n === 1);
db.ham.prepare("UPDATE referans_acilis SET gun = '2000-01-01'").run();
await site(`/r/${kod1}?t=${anahtar}`);
k('ertesi gün yeni kayıt açılır', acilisSayisi() === 2);
v = await jsn(await api('teklifler/' + tid));
k('teklif yanıtında açılış günü sayısı', v.referans.acilis_gun === 2 && !!v.referans.son_acilis);
const once = acilisSayisi();
for (const t of ['yanlis12345', 'ABCDEFGHIJ', '', 'x', anahtar + 'a', "a' OR 1=1"]) {
  r = await site(`/r/${kod1}?t=${encodeURIComponent(t)}`);
  k(`geçersiz t (${JSON.stringify(t)}) sayfayı bozmaz`, r.status === 200);
}
k('geçersiz t kayıt düşmez', acilisSayisi() === once);
db.ham.prepare('DELETE FROM referans_acilis').run();
await site(`/r/${kod1}?t=${anahtar}`, { headers: { 'user-agent': 'WhatsApp/2.23.20.0 A' } });
await site(`/r/${kod1}?t=${anahtar}`, { headers: { 'user-agent': 'facebookexternalhit/1.1' } });
k('bağlantı önizleyicisi (WhatsApp, Facebook) açılış sayılmaz', acilisSayisi() === once);
r = await site(`/r/${yanlis}?t=${anahtar}`);
k('yanlış kod + geçerli t: 404 ve kayıt yok', r.status === 404 && acilisSayisi() === once);

// --- Yeni kod: eski bağlantı geçersiz ---
v = await jsn(await post('referans-kodu/yeni', {}));
const kod2 = v.kod;
k('yeni kod farklı', v.s === 200 && kod2 !== kod1);
k('eski kod artık 404', (await site('/r/' + kod1)).status === 404);
k('yeni kod 200', (await site('/r/' + kod2)).status === 200);
v = await jsn(await api('teklifler/' + tid));
k('teklif bağlantısı yeni kodla, anahtar aynı', v.referans.baglanti === `https://idexya.com/r/${kod2}?t=${anahtar}`);

// --- Taslak silinince açılışları da silinir ---
db.ham.prepare("INSERT INTO referans_acilis (teklif_id, gun, zaman) VALUES (?, '2001-01-01', ?)").run(tid, z);
k('taslak teklif silindi', (await post(`teklifler/${tid}/sil`, {})).status === 200);
k('silinen teklifin açılış satırları da silindi', db.ham.prepare('SELECT COUNT(*) AS n FROM referans_acilis WHERE teklif_id = ?').get(tid).n === 0);

// --- Panel alanında ölçüm: kod ziyaret istatistiğine yazılmaz ---
await worker.fetch(new Request(B + '/api/olcum', { method: 'POST', headers: { 'content-type': 'application/json', 'user-agent': 'Mozilla/5.0' }, body: JSON.stringify({ t: 'g', p: '/r/' + kod2, c: 'mobil', r: 'dogrudan' }) }), env, ctx);
await bitir();
const sayfalar = db.ham.prepare('SELECT sayfa FROM ziyaret_gunluk').all().map((x) => x.sayfa);
k('ziyaret istatistiğinde kod yok', !sayfalar.some((x) => x.includes(kod2)));

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

// --- Kaynak denetimi: bağlantı sızmıyor ---
const arama = readFileSync(new URL('../src/pages/arama.json.js', import.meta.url), 'utf8');
const menu = readFileSync(new URL('../src/data/site-menu.json', import.meta.url), 'utf8');
const harita = readFileSync(new URL('../tools/sitemap.mjs', import.meta.url), 'utf8');
k('arama dizininde /r/ ya da kabuk yok', !/['"]\/r\/|kabuk/.test(arama));
k('site menüsünde /r/ yok', !/"\/r\//.test(menu));
k('site haritası /kabuk/ sayfalarını dışlıyor', /kabuk/.test(harita));
const kabukKaynak = readFileSync(new URL('../src/pages/kabuk/referanslar.astro', import.meta.url), 'utf8');
k('kabuk: aramaya kapalı (noindex)', /<Site [^>]*aramayaKapali/.test(kabukKaynak));
k('kabuk: site bağlantıları rel="noopener nofollow"', /rel="noopener nofollow"/.test(kabukKaynak));
k('kabuk: satır içi betik yok (yalnız dış dosya)', !/<script(?![^>]*\bsrc=)[^>]*>/.test(kabukKaynak.replace(/<!--[\s\S]*?-->/g, '')));
k('kabuk: hareketi azalt tercihi destekleniyor', /prefers-reduced-motion:reduce/.test(kabukKaynak));

console.log(h.length ? `\n${h.length} KALDI:\n` + h.join('\n') : '\nTüm kontroller geçti.');
process.exit(h.length ? 1 : 0);
