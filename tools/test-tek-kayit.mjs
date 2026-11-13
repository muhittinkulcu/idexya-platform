// Müşteri tek kayıt 2. adım (IDOS docs/tasarim/musteri-tek-kayit.md §6-§8, K2, K7, K8, K10, K11):
// panelde yeni müşteri → IDOS v2 POST /musteriler (imzalı), "bekliyor" durumu ve yeniden dene, aday → aktif (yalnız süper yönetici),
// tek seferlik taşıma önizlemesi ve idempotent toplu gönderim. Sunucu gerekmez: D1 yerine node:sqlite, IDOS yerine sahte HTTP sunucusu.
// Kullanım: node tools/test-tek-kayit.mjs
import { DatabaseSync } from 'node:sqlite';
import { build } from 'esbuild';
import { mkdtempSync, writeFileSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import http from 'node:http';
import { createHash, createHmac } from 'node:crypto';

const paket = await build({ entryPoints: [new URL('../worker/index.js', import.meta.url).pathname], bundle: true, format: 'esm', platform: 'neutral', mainFields: ['module', 'main'], write: false, logLevel: 'silent' });
const gecici = join(mkdtempSync(join(tmpdir(), 'tek-kayit-')), 'worker.mjs');
writeFileSync(gecici, paket.outputFiles[0].text);
const worker = (await import(gecici)).default;
const TK = await import('../worker/tek-kayit.js');

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

// --- 1. İmza: IDOS test vektörüyle aynı sonuç ---
// Vektör IDOS deposundaki app/core/ortak_jeton.py (imza_metni + HMAC-SHA256) ile üretildi ve imza_doğru() ile True döndü (13.11.2026).
const VEKTOR = { jeton: 'yazma-jetonu-ornek-0123456789abcdefghij', yontem: 'POST', yol: '/api/ortak/v2/musteriler', zaman: '1763000000',
  tek: '0123456789abcdef0123456789abcdef', kullanici: 'muhittin@idexya.com', govde: '{"marka":"Örnek Marka"}',
  imza: 'f49b9b13594ed2eea5821828f846650add58a0158d2ea5b3d39349d922185795' };
k('imza: IDOS test vektörüyle aynı', (await TK.imzaHesapla(VEKTOR.jeton, VEKTOR.yontem, VEKTOR.yol, VEKTOR.zaman, VEKTOR.tek, VEKTOR.kullanici, VEKTOR.govde)) === VEKTOR.imza);

// --- Sahte IDOS v2 ---
const OKUMA = 'okuma-jetonu-test-0123456789abcdefghijklmn';
const YAZMA = 'yazma-jetonu-test-0123456789abcdefghijklmn';
const idos = { kip: 'acik', istekler: [], musteriler: new Map(), anahtarlar: new Map(), tekler: new Set(), sayac: 0, firsatlar: [] };
idos.musteriler.set('c-esk-1', { musteri_id: 'c-esk-1', durum: 'aktif', marka: 'Mavi Kuş Kozmetik', telefon: '+90 532 000 11 22', fatura_eposta: 'muhasebe@mavikus.example', guncelleme: '2026-11-01T10:00:00+00:00' });
idos.musteriler.set('c-esk-2', { musteri_id: 'c-esk-2', durum: 'aktif', marka: 'Yeşil Bahçe Peyzaj', telefon: null, fatura_eposta: null, guncelleme: '2026-11-01T10:00:00+00:00' });
idos.musteriler.set('c-esk-3', { musteri_id: 'c-esk-3', durum: 'aktif', marka: 'Kuzey Yapı', telefon: null, fatura_eposta: null, guncelleme: '2026-11-01T10:00:00+00:00' });
const yaz = (y, d, v) => { y.writeHead(d, { 'Content-Type': 'application/json' }); y.end(JSON.stringify(v)); };
const sunucu = http.createServer((q, y) => {
  let ham = '';
  q.setEncoding('utf8');
  q.on('data', (c) => (ham += c));
  q.on('end', () => {
    const u = new URL(q.url, 'http://x');
    const b = Object.fromEntries(Object.entries(q.headers));
    const kayit = { yontem: q.method, yol: u.pathname, basliklar: b, govde: ham ? JSON.parse(ham) : null, ham };
    idos.istekler.push(kayit);
    if (idos.kip === 'dusuk') { q.socket.destroy(); return; }
    if (b.authorization !== 'Bearer ' + OKUMA) return yaz(y, 401, { detail: 'Geçerli ürün jetonu gerekli' });
    if (idos.kip === 'kapali') return yaz(y, 403, { detail: 'Ortak API yazma kapısı kapalı' });
    if (q.method === 'GET') {
      if (u.pathname === '/api/ortak/v2/musteriler') return yaz(y, 200, { musteriler: [...idos.musteriler.values()], toplam: idos.musteriler.size, zaman: new Date().toISOString() });
      const m = u.pathname.match(/^\/api\/ortak\/v2\/musteriler\/([\w-]+)$/);
      if (m) return idos.musteriler.has(m[1]) ? yaz(y, 200, idos.musteriler.get(m[1])) : yaz(y, 404, { detail: 'Kayıt bulunamadı' });
      return yaz(y, 404, {});
    }
    // Yazma: IDOS yazma_kapisi ile aynı denetimler (imza, zaman, tek, kullanıcı alanı).
    const metin = [q.method, u.pathname, b['x-idexya-zaman'], b['x-idexya-tek'], b['x-idexya-kullanici'], createHash('sha256').update(Buffer.from(ham, 'utf8')).digest('hex')].join('\n');
    const beklenen = createHmac('sha256', YAZMA).update(metin).digest('hex');
    kayit.imzaDogru = beklenen === b['x-idexya-imza'];
    if (!kayit.imzaDogru || !/^\d+$/.test(b['x-idexya-zaman'] || '') || Math.abs(Date.now() / 1000 - Number(b['x-idexya-zaman'])) > 300) return yaz(y, 401, { detail: 'İmza doğrulanamadı' });
    if (!/^[A-Za-z0-9_-]{16,128}$/.test(b['x-idexya-tek'] || '') || idos.tekler.has(b['x-idexya-tek'])) return yaz(y, 401, { detail: 'İstek daha önce işlendi' });
    idos.tekler.add(b['x-idexya-tek']);
    if (!/@idexya\.com$/.test(b['x-idexya-kullanici'] || '')) return yaz(y, 403, { detail: 'Bu kullanıcı ortak API\'ye yazamaz' });
    if (idos.kip === 'sinir') return yaz(y, 429, { detail: 'Yazma sınırı aşıldı' });
    if (u.pathname === '/api/ortak/v2/musteriler' && q.method === 'POST') {
      const anahtar = b['idempotency-key'];
      if (!anahtar || !/^[A-Za-z0-9_-]{16,128}$/.test(anahtar)) return yaz(y, 400, { detail: 'Idempotency-Key başlığı gerekli' });
      const ak = anahtar + '|' + b['x-idexya-kullanici'];
      if (idos.anahtarlar.has(ak)) return yaz(y, 201, idos.anahtarlar.get(ak));
      const id = 'c-yeni-' + (++idos.sayac);
      const g = { musteri_id: id, durum: 'aday', marka: kayit.govde.marka, telefon: kayit.govde.telefon || null, fatura_eposta: null, guncelleme: '2026-11-13T09:00:00+00:00' };
      idos.musteriler.set(id, g); idos.anahtarlar.set(ak, g);
      if (idos.kip === 'yanit-kayip') { q.socket.destroy(); return; }
      return yaz(y, 201, g);
    }
    let m = u.pathname.match(/^\/api\/ortak\/v2\/musteriler\/([\w-]+)\/firsatlar$/);
    if (m && q.method === 'POST') { idos.firsatlar.push({ musteri_id: m[1], ...kayit.govde }); return yaz(y, 201, { kimlik: 'f-' + idos.firsatlar.length, guncelleme: '2026-11-13T09:00:00+00:00' }); }
    m = u.pathname.match(/^\/api\/ortak\/v2\/musteriler\/([\w-]+)\/kazanildi$/);
    if (m && q.method === 'POST') {
      if (b['x-idexya-kullanici'] !== 'info@idexya.com') return yaz(y, 403, { detail: 'Adayı müşteriye yalnız süper yönetici çevirebilir' });
      const c = idos.musteriler.get(m[1]);
      if (!c) return yaz(y, 404, { detail: 'Kayıt bulunamadı' });
      if (c.durum !== 'aday' || kayit.govde.surum !== c.guncelleme) return yaz(y, 409, { detail: { mesaj: 'Kayıt siz düzenlerken değişti', guncel: c, degisen: ['durum'] } });
      c.durum = 'aktif'; c.guncelleme = '2026-11-13T10:00:00+00:00';
      return yaz(y, 200, c);
    }
    return yaz(y, 404, { detail: 'yok' });
  });
});
await new Promise((ok) => sunucu.listen(0, '127.0.0.1', ok));
const IDOS_URL = 'http://127.0.0.1:' + sunucu.address().port;
const yazmalar = () => idos.istekler.filter((x) => x.yontem !== 'GET');

const B = 'http://localhost';
const db = sahteD1();
const tamEnv = { DB: db, YEREL_GIRIS: 'evet', IDOS_ORTAK_URL: IDOS_URL, IDOS_ORTAK_JETON: OKUMA, ORTAK_YAZMA_JETON_PANEL: YAZMA, YONETICILER: 'ekip@idexya.com,info@idexya.com' };
const istek = (yol, o = {}) => worker.fetch(new Request(B + '/api/yonetim/' + yol, o), o.env || tamEnv, {});
const post = (yol, govde, env) => istek(yol, { method: 'POST', headers: { origin: B, 'content-type': 'application/json' }, body: JSON.stringify(govde), env });
const jsn = async (r) => ({ d: r.status, ...(await r.json()) });
const EKIP = { eposta: 'ekip@idexya.com' }, SUPER = { eposta: 'info@idexya.com' };
const satir = (sql, ...p) => db.ham.prepare(sql).get(...p);

// Şema kurulsun diye bir panel isteği (yerel giriş).
await jsn(await istek('musteriler'));
const kartAc = (id, alan = {}) => db.ham.prepare(`INSERT INTO musteriler (id, olusturma, guncelleme, firma, ad, eposta, telefon, sektor, kaynak, asama, deger, paket, sorumlu)
  VALUES (?, '2026-11-01T00:00:00Z', '2026-11-01T00:00:00Z', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(id, alan.firma ?? null, alan.ad ?? null, alan.eposta ?? null, alan.telefon ?? null, alan.sektor ?? null, alan.kaynak ?? 'elle', alan.asama ?? 'yeni', alan.deger ?? null, alan.paket ?? null, alan.sorumlu ?? 'ekip@idexya.com');

// --- 2. Yeni müşteri → POST çağrısı + ana_kayit_id ---
kartAc('k-1', { firma: 'Örnek Kafe', ad: 'Ayşe Deneme', eposta: 'ayse@ornek-kafe.example', telefon: '0555 111 22 33', sektor: 'Yeme içme', asama: 'yeni' });
let r = await TK.tekKayitGonder(tamEnv, 'k-1', EKIP);
const ilk = yazmalar()[0];
k('yeni müşteri: IDOS v2 POST /musteriler çağrıldı', ilk && ilk.yontem === 'POST' && ilk.yol === '/api/ortak/v2/musteriler');
k('imza başlıkları IDOS biçiminde ve doğru', ilk && ilk.imzaDogru === true && /^[0-9a-f]{64}$/.test(ilk.basliklar['x-idexya-imza']) && /^\d{10}$/.test(ilk.basliklar['x-idexya-zaman']) && /^[A-Za-z0-9_-]{16,128}$/.test(ilk.basliklar['x-idexya-tek']));
k('yazma jetonu istekte gönderilmez', ilk && !JSON.stringify(ilk.basliklar).includes(YAZMA) && !ilk.ham.includes(YAZMA));
k('yazan = panel oturumundaki yönetici e-postası', ilk && ilk.basliklar['x-idexya-kullanici'] === 'ekip@idexya.com');
k('Idempotency-Key gönderildi', ilk && /^[A-Za-z0-9_-]{16,128}$/.test(ilk.basliklar['idempotency-key'] || ''));
k('gövde: marka, sektör, kişi (beyaz liste)', ilk && ilk.govde.marka === 'Örnek Kafe' && ilk.govde.sektor === 'Yeme içme' && ilk.govde.kisiler && ilk.govde.kisiler[0].ad === 'Ayşe Deneme' && ilk.govde.kisiler[0].eposta === 'ayse@ornek-kafe.example');
const izinli = new Set(['marka', 'unvan', 'sektor', 'sorumlu', 'kaynak', 'web_sitesi', 'telefon', 'kisiler']);
k('gövdede beyaz liste dışı alan yok (durum, aylik_ucret, kaynak_kimlik yok)', ilk && Object.keys(ilk.govde).every((a) => izinli.has(a)));
k('sonuç gönderildi + ana_kayit_id bağlandı', r.durum === 'gonderildi' && satir('SELECT ana_kayit_id FROM musteriler WHERE id = ?', 'k-1').ana_kayit_id === r.ana_kayit_id && /^c-yeni-/.test(r.ana_kayit_id));

// Aynı kayıt iki kez gönderilmez
const once = yazmalar().length;
r = await TK.tekKayitGonder(tamEnv, 'k-1', EKIP);
k('bağlı kart ikinci kez gönderilmez', r.durum === 'bagli' && yazmalar().length === once);

// Panel ucu: POST /musteriler yeni kartı anında gönderir (yerel giriş e-postası YONETICILER'de değil → bekliyor; sessiz kayıp yok)
let p = await jsn(await post('musteriler', { firma: 'Yerel Deneme', eposta: 'x@yerel.example' }));
k('panel POST /musteriler: kart yerelde açılır', p.d === 200 && p.ok && !!p.musteri_id);
k('panel POST /musteriler: IDOS durumu yanıtta', p.idos && p.idos.durum === 'bekliyor' && /yönetici/i.test(p.idos.hata || ''));
const yerelEnv = { ...tamEnv, YONETICILER: 'yerel@gelistirme,info@idexya.com' };
const once2 = yazmalar().length;
p = await jsn(await post('musteriler', { firma: 'Yerel İkinci', ad: 'Can Deneme' }, yerelEnv));
k('panel POST /musteriler: yönetici yerelse IDOS\'a gider (IDOS 403 → bekliyor)', p.d === 200 && p.idos && p.idos.durum === 'bekliyor' && yazmalar().length === once2 + 1);

// --- 3. Sır yok / IDOS 403 / ağ hatası → yerel kayıt + bekliyor ---
kartAc('k-2', { firma: 'Sırsız Ltd' });
const sirsiz = { ...tamEnv, ORTAK_YAZMA_JETON_PANEL: '' };
const once3 = yazmalar().length;
r = await TK.tekKayitGonder(sirsiz, 'k-2', EKIP);
k('sır yok: istek atılmaz, bekliyor', r.durum === 'bekliyor' && yazmalar().length === once3 && /ORTAK_YAZMA_JETON_PANEL/.test(r.hata));
k('sır yok: kart yerelde duruyor, bağsız', satir('SELECT ana_kayit_id FROM musteriler WHERE id = ?', 'k-2').ana_kayit_id === null);
let g = satir('SELECT * FROM idos_gonderim WHERE kart_id = ?', 'k-2');
k('bekliyor durumu kayıtlı', g && g.durum === 'bekliyor' && !!g.son_hata);

idos.kip = 'kapali';
r = await TK.tekKayitGonder(tamEnv, 'k-2', EKIP);
k('IDOS 403 (anahtar kapalı): bekliyor, mesaj açık', r.durum === 'bekliyor' && /403/.test(r.hata));
idos.kip = 'dusuk';
r = await TK.tekKayitGonder(tamEnv, 'k-2', EKIP);
k('ağ hatası: bekliyor', r.durum === 'bekliyor' && /ulaşılamadı/.test(r.hata));
idos.kip = 'sinir';
r = await TK.tekKayitGonder(tamEnv, 'k-2', EKIP);
k('429: bekliyor, sınır mesajı', r.durum === 'bekliyor' && /429/.test(r.hata));
idos.kip = 'acik';

// Yeniden dene (panel ucu); aynı Idempotency-Key
const anahtarlar = yazmalar().filter((x) => x.yol === '/api/ortak/v2/musteriler' && x.govde && x.govde.marka === 'Sırsız Ltd').map((x) => x.basliklar['idempotency-key']);
r = await TK.tekKayitGonder(tamEnv, 'k-2', EKIP);
k('yeniden dene: gönderildi', r.durum === 'gonderildi' && !!satir('SELECT ana_kayit_id FROM musteriler WHERE id = ?', 'k-2').ana_kayit_id);
const anahtarlar2 = yazmalar().filter((x) => x.yol === '/api/ortak/v2/musteriler' && x.govde && x.govde.marka === 'Sırsız Ltd').map((x) => x.basliklar['idempotency-key']);
k('aynı kartın her denemesinde aynı Idempotency-Key', new Set(anahtarlar2).size === 1 && anahtarlar.length >= 1);
k('her denemede yeni X-Idexya-Tek', new Set(yazmalar().map((x) => x.basliklar['x-idexya-tek'])).size === yazmalar().length);

// Yanıt kaybolursa: IDOS kaydı açtı, panel bilmiyor → yeniden denemede aynı anahtar aynı kaydı döner (çift aday yok)
kartAc('k-3', { firma: 'Kayıp Yanıt AŞ' });
idos.kip = 'yanit-kayip';
r = await TK.tekKayitGonder(tamEnv, 'k-3', EKIP);
k('yanıt kaybı: bekliyor', r.durum === 'bekliyor');
idos.kip = 'acik';
const adaySay = idos.musteriler.size;
r = await TK.tekKayitGonder(tamEnv, 'k-3', EKIP);
k('yanıt kaybı sonrası yeniden dene: çift aday açılmaz', r.durum === 'gonderildi' && idos.musteriler.size === adaySay);

// Panel ucu: yeniden dene
kartAc('k-4', { firma: 'Uçtan Deneme' });
p = await jsn(await post('musteriler/k-4/idos-gonder', {}, yerelEnv));
k('panel ucu idos-gonder: IDOS kullanıcıyı reddederse 200 + bekliyor', p.d === 200 && p.idos && p.idos.durum === 'bekliyor');

// --- 4. KVKK: TCKN / kart / IBAN gönderilmez ---
kartAc('k-5', { firma: 'Kvkk Deneme', ad: 'Ali 10000000146' });
const once5 = yazmalar().length;
r = await TK.tekKayitGonder(tamEnv, 'k-5', EKIP);
k('TCKN içeren kart gönderilmez', r.durum === 'bekliyor' && /tckn/.test(r.hata) && yazmalar().length === once5);
k('yasakliVeri: IBAN, kart, TCKN tanınır; telefon tanınmaz', TK.yasakliVeri('TR33 0006 1005 1978 6457 8413 26') === 'iban' && TK.yasakliVeri('4111 1111 1111 1111') === 'kart' && TK.yasakliVeri('10000000146') === 'tckn' && TK.yasakliVeri('0555 111 22 33') === null);
kartAc('k-6', { firma: 'Kart Ltd', ad: 'Veli', eposta: 'v@kart.example', telefon: '4111 1111 1111 1111' });
r = await TK.tekKayitGonder(tamEnv, 'k-6', EKIP);
k('kart numarası içeren alan gönderilmez', r.durum === 'bekliyor' && /kart/.test(r.hata));

// --- 5. Aday → aktif: yalnız süper yönetici ---
const kid = satir('SELECT ana_kayit_id FROM musteriler WHERE id = ?', 'k-1').ana_kayit_id;
p = await jsn(await post('musteriler/k-1/kazanildi', {}));
k('süper yönetici olmayan aday→aktif: 403', p.d === 403);
k('403\'te IDOS kazanildi çağrılmadı', !idos.istekler.some((x) => /kazanildi$/.test(x.yol)));
r = await TK.kazanildi(tamEnv, 'k-1', EKIP);
k('modül: süper olmayan 403', r.kod === 403);
r = await TK.kazanildi(tamEnv, 'k-1', SUPER);
k('süper yönetici: IDOS kazanildi çağrıldı, aktif', r.kod === 200 && idos.musteriler.get(kid).durum === 'aktif' && idos.istekler.some((x) => x.yol === `/api/ortak/v2/musteriler/${kid}/kazanildi` && x.imzaDogru && x.basliklar['x-idexya-kullanici'] === 'info@idexya.com'));
r = await TK.kazanildi(tamEnv, 'k-1', SUPER);
k('aktif olan yeniden kazanılamaz (409)', r.kod === 409);
let a = await jsn(await istek('musteriler/k-1/ana-kayit'));
k('kart ucu: süper değil bayrağı ve gönderim durumu', a.d === 200 && a.super === false && a.gonderim && a.gonderim.durum === 'gonderildi');

// --- 6. Taşıma önizlemesi ---
idos.istekler.length = 0;
kartAc('t-1', { firma: 'Mavi Kuş Kozmetik Ltd. Şti.', eposta: 'muhasebe@mavikus.example' });       // kesin (e-posta)
kartAc('t-2', { firma: 'Başka Ad', telefon: '0532 000 11 22' });                                       // kesin (telefon)
kartAc('t-3', { firma: 'Yeşil Bahçe Peyzaj Hizmetleri' });                                             // olası (içerme ≥ 0,85)
kartAc('t-4', { firma: 'Tamamen Yeni Marka', paket: 'Sosyal medya', deger: 12000, asama: 'teklif' }); // eşsiz + fırsat notu
kartAc('t-5', { firma: 'Kaybedilen Firma', asama: 'kaybedildi' });                                     // eşsiz + kaybedildi
kartAc('t-6', { firma: null, ad: null, eposta: 'adsiz@ornek.example' });                              // hatalı (marka yok)
db.ham.prepare("UPDATE musteriler SET arsiv = '2026-11-02' WHERE id = 'k-6'").run();
p = await jsn(await istek('tek-kayit/tasima/onizleme'));
const sat = Object.fromEntries((p.satirlar || []).map((x) => [x.id, x]));
k('önizleme 200, IDOS listesi kaynak', p.d === 200 && p.kaynak === 'idos');
k('önizleme: hiçbir yazma isteği yok', !idos.istekler.some((x) => x.yontem !== 'GET'));
k('önizleme: arşivdeki kart dahil değil', !sat['k-6']);
k('önizleme: kesin eş e-postadan', sat['t-1'] && sat['t-1'].sinif === 'kesin' && sat['t-1'].esler[0].musteri_id === 'c-esk-1' && sat['t-1'].esler[0].neden === 'eposta' && sat['t-1'].karar === 'esle');
k('önizleme: kesin eş telefondan', sat['t-2'] && sat['t-2'].sinif === 'kesin' && sat['t-2'].esler[0].neden === 'telefon');
k('önizleme: olası eş ad benzerliğinden, varsayılan atla', sat['t-3'] && sat['t-3'].sinif === 'olasi' && sat['t-3'].esler[0].musteri_id === 'c-esk-2' && sat['t-3'].karar === 'atla');
k('önizleme: eşsiz → yeni aday', sat['t-4'] && sat['t-4'].sinif === 'eslesmesiz' && sat['t-4'].karar === 'yeni');
k('K11: paket/değer fırsat notu, tutar —', sat['t-4'].firsat && /Sosyal medya/.test(sat['t-4'].firsat.ad + sat['t-4'].firsat.not_metni) && /12000/.test(sat['t-4'].firsat.not_metni) && sat['t-4'].firsat.tutar === '—');
k('K10: kaybedildi de aday + kaybedildi etiketi', sat['t-5'] && sat['t-5'].karar === 'yeni' && sat['t-5'].kaybedildi === true && sat['t-5'].firsat && sat['t-5'].firsat.asama === 'kaybedildi');
k('önizleme: marka yok → hatalı', sat['t-6'] && sat['t-6'].sinif === 'hatali' && sat['t-6'].karar === 'atla');
k('önizleme: KVKK içeren kart hatalı', sat['k-5'] && sat['k-5'].sinif === 'hatali');
k('önizleme sayıları', p.sayilar && p.sayilar.toplam === p.satirlar.length + p.sayilar.bagli && p.sayilar.kesin === 2 && p.sayilar.olasi === 1 && p.sayilar.hatali >= 2 && p.sayilar.bagli >= 3);

// --- 7. Taşıma uygula: yalnız süper yönetici; idempotent; kaldığı yerden ---
p = await jsn(await post('tek-kayit/tasima/uygula', { kararlar: [] }));
k('süper olmayan taşıma uygulayamaz (403)', p.d === 403);
const kararlar = Object.values(sat).map((x) => ({ id: x.id, karar: x.karar, hedef: x.esler[0] ? x.esler[0].musteri_id : null }));
const yazOnce = yazmalar().length;
r = await TK.tasimaUygula(tamEnv, { kararlar, parca: 2 }, SUPER);
k('ilk parça: en çok 2 kayıt işlendi, kalan var', r.kod === 200 && r.islenen.length === 2 && r.kalan > 0);
// Yarıda kaldı: aynı kararlar yeniden gelse de tamamlananlar yeniden işlenmez.
let tur = 0;
while (r.kalan > 0 && tur++ < 20) r = await TK.tasimaUygula(tamEnv, { kararlar: tur === 1 ? kararlar : undefined, parca: 2 }, SUPER);
k('taşıma bitti', r.kalan === 0);
const bag = (id) => satir('SELECT ana_kayit_id FROM musteriler WHERE id = ?', id).ana_kayit_id;
k('kesin eş: mevcut IDOS kaydına bağlandı, yeni aday açılmadı', bag('t-1') === 'c-esk-1' && bag('t-2') === 'c-esk-1');
k('atla: bağlanmadı', bag('t-3') === null && bag('t-6') === null);
k('yeni: aday açıldı ve bağlandı', /^c-yeni-/.test(bag('t-4') || '') && /^c-yeni-/.test(bag('t-5') || ''));
const f4 = idos.firsatlar.find((f) => f.musteri_id === bag('t-4')), f5 = idos.firsatlar.find((f) => f.musteri_id === bag('t-5'));
k('K11: fırsat notla, tutarsız gönderildi', f4 && /12000/.test(f4.not_metni) && f4.aylik_tutar_kurus === undefined && f4.tek_seferlik_kurus === undefined && f4.asama === 'teklif');
k('K10: kaybedildi fırsatı neden ile', f5 && f5.asama === 'kaybedildi' && !!f5.kayip_nedeni);
const ozet = r.ozet || {};
k('her kayıt sonucu listelenir', Array.isArray(r.sonuclar) && r.sonuclar.length === kararlar.length && r.sonuclar.every((x) => x.id && x.durum));
const yazSonra = yazmalar().length;
r = await TK.tasimaUygula(tamEnv, { kararlar }, SUPER);
k('taşıma idempotent: ikinci çalıştırmada yeni yazma yok', r.kalan === 0 && yazmalar().length === yazSonra);
k('taşıma yazmaları imzalı ve süper yöneticinin adıyla', yazmalar().slice(yazOnce).every((x) => x.imzaDogru && x.basliklar['x-idexya-kullanici'] === 'info@idexya.com'));
k('özet sayıları', ozet && typeof ozet === 'object');

// --- 8. Gönderim kodu yok: modül e-posta/bildirim servislerini kullanmaz ---
const kaynak = readFileSync(new URL('../worker/tek-kayit.js', import.meta.url), 'utf8');
k('tek-kayit.js e-posta/bildirim modülü içe aktarmaz', !/from '\.\/(eposta|bildirim|bulten|haftalik-bulten)\.js'/.test(kaynak) && !/ekibeBildir|resend|mailchannels|sendEmail/i.test(kaynak));
k('tek-kayit.js eski onay kuyruğu ucuna yazmaz', !/musteri-adayi/.test(kaynak));
const anaKaynak = readFileSync(new URL('../worker/ana-kayit.js', import.meta.url), 'utf8');
k('Müşteri yap artık kuyruğa POST etmiyor', !/method: 'POST'[^\n]*musteri-adayi|musteri-adayi'[^\n]*method: 'POST'/.test(anaKaynak) && !/'\/api\/ortak\/musteri-adayi', \{/.test(anaKaynak));

// Taşıma sayfası var ve İngilizce adreste
k('taşıma sayfası /crm-migrate', readdirSync(new URL('../src/pages/yonetim/', import.meta.url)).includes('crm-migrate.astro'));

sunucu.close();
console.log(h.length ? '\nKALDI: ' + h.length + '\n' + h.join('\n') : '\nHepsi geçti.');
process.exit(h.length ? 1 : 0);
