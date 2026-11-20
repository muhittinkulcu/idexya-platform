// Kişi ve rol tek kayıt (IDOS docs/kararlar/2026-11-20-kisi-rol-tek-kayit.md, 2. adım): yönetim girişinde rol IDOS'tan
// (GET /api/ortak/kisi, e-posta X-Idexya-Eposta başlığında), KISI_ROL_IDOS anahtarı arkasında. Uçtan uca: worker paketlenir,
// D1 yerine node:sqlite, Access ve IDOS yerine sahte HTTP sunucusu. Kullanım: node tools/test-kisi-rol.mjs
import { DatabaseSync } from 'node:sqlite';
import { build } from 'esbuild';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import http from 'node:http';
import { generateKeyPair, exportJWK, SignJWT } from 'jose';

// Günlüğe yazılan her şey toplanır; sonunda hiçbir e-posta geçmemeli.
const gunluk = [];
for (const ad of ['log', 'error', 'warn', 'info']) {
  const asil = console[ad].bind(console);
  console[ad] = (...a) => { gunluk.push(a.map(String).join(' ')); if (ad === 'log') asil(...a); };
}

const paket = await build({ entryPoints: [new URL('../worker/index.js', import.meta.url).pathname], bundle: true, format: 'esm', platform: 'neutral', mainFields: ['module', 'main'], write: false, logLevel: 'silent' });
const gecici = join(mkdtempSync(join(tmpdir(), 'kisi-rol-')), 'worker.mjs');
writeFileSync(gecici, paket.outputFiles[0].text);
const worker = (await import(gecici)).default;
const KR = await import('../worker/kisi-rol.js');

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
    prepare: (sql) => new Ifade(sql),
    async batch(l) {
      s.exec('BEGIN');
      try { const c = []; for (const i of l) c.push(/^\s*(SELECT|PRAGMA|WITH)\b/i.test(i.sql) ? await i.all() : await i.run()); s.exec('COMMIT'); return c; }
      catch (e) { s.exec('ROLLBACK'); throw e; }
    }
  };
}

// --- Sahte Access (anahtar kümesi) + sahte IDOS ---
const { publicKey, privateKey } = await generateKeyPair('RS256');
const jwk = { ...(await exportJWK(publicKey)), kid: 'k1', alg: 'RS256' };
const JETON = 'ortak-jeton-panel-test-0123456789abcdefghij';
const ROLLER = {
  'yon@idexya.com': { rol: 'yonetici', super_admin: true, musteri_idleri: null },
  'hy@idexya.com': { rol: 'hesap_yoneticisi', super_admin: false, musteri_idleri: ['c-1', 'c-2'] },
  'izle@idexya.com': { rol: 'izleyici', super_admin: false, musteri_idleri: null },
  'mus@ornek.com': { rol: 'musteri', super_admin: false, musteri_idleri: ['c-9'] }
};
const idos = { kip: 'acik', istekler: [] };
const sunucu = http.createServer((q, y) => {
  if (q.url === '/cdn-cgi/access/certs') { y.writeHead(200, { 'Content-Type': 'application/json' }); return y.end(JSON.stringify({ keys: [jwk] })); }
  idos.istekler.push({ url: q.url, yetki: q.headers.authorization, eposta: q.headers['x-idexya-eposta'] });
  const yaz = (d, v) => { y.writeHead(d, { 'Content-Type': 'application/json' }); y.end(JSON.stringify(v)); };
  if (q.headers.authorization !== 'Bearer ' + JETON) return yaz(401, { hata: 'jeton' });
  if (!q.url.startsWith('/api/ortak/kisi')) return yaz(404, {});
  if (idos.kip === '503') return yaz(503, { hata: 'okunamadı' });
  if (idos.kip === '404') return yaz(404, {});
  const e = String(q.headers['x-idexya-eposta'] || '');
  if (idos.kip === 'yanlis-eposta') return yaz(200, { eposta: 'baska@idexya.com', rol: 'yonetici', super_admin: true, musteri_idleri: null });
  if (idos.kip === 'bilinmeyen-rol') return yaz(200, { eposta: e, rol: 'admin', super_admin: true, musteri_idleri: null });
  const r = ROLLER[e];
  return yaz(200, { eposta: e, rol: r ? r.rol : null, super_admin: r ? r.super_admin : false, musteri_idleri: r ? r.musteri_idleri : null });
});
await new Promise((t) => sunucu.listen(0, '127.0.0.1', t));
const KOK = `http://127.0.0.1:${sunucu.address().port}`;
const TD = KOK; // Access yayıncısı = sahte sunucu (anahtar kümesi /cdn-cgi/access/certs)

const jeton = (eposta) => new SignJWT({ email: eposta }).setProtectedHeader({ alg: 'RS256', kid: 'k1' })
  .setIssuer(TD).setAudience('AUD').setIssuedAt().setExpirationTime('72h').sign(privateKey);
const DB = sahteD1();
const temelEnv = { TEAM_DOMAIN: TD, POLICY_AUD: 'AUD', YONETICILER: 'acil@idexya.com', IDOS_ORTAK_URL: KOK, IDOS_ORTAK_JETON: JETON, DB };
const ac = { ...temelEnv, KISI_ROL_IDOS: '1' };
const PANEL = 'https://panel.idexya.com';
async function iste(env, eposta, yontem = 'GET', yol = '/api/yonetim/ozet') {
  const basliklar = { 'cf-access-jwt-assertion': await jeton(eposta) };
  if (yontem !== 'GET') { basliklar.origin = PANEL; basliklar['content-type'] = 'application/json'; }
  const r = await worker.fetch(new Request(PANEL + yol, { method: yontem, headers: basliklar, body: yontem === 'GET' ? undefined : '{}' }), env, { waitUntil() {} });
  let govde = null; try { govde = await r.clone().json(); } catch {}
  return { durum: r.status, govde };
}
const gecti = (r) => r.durum !== 401 && r.durum !== 403; // kapıdan geçti (uç kendi yanıtını verdi)

// --- 1. Anahtar değeri ---
k('anahtar: tanımsız → kapalı', !KR.kisiRolAcik({}));
for (const v of ['0', 'evet', 'true', '', ' 2']) k(`anahtar: "${v}" → kapalı`, !KR.kisiRolAcik({ KISI_ROL_IDOS: v }));
k('anahtar: "1" → açık', KR.kisiRolAcik({ KISI_ROL_IDOS: '1' }));

// --- 2. Anahtar kapalı: bugünkü davranış birebir (yalnız YONETICILER; IDOS'a hiç sorulmaz) ---
for (const env of [temelEnv, { ...temelEnv, KISI_ROL_IDOS: 'evet' }, { ...temelEnv, KISI_ROL_IDOS: '0' }]) {
  const etiket = `kapalı (${env.KISI_ROL_IDOS ?? 'tanımsız'})`;
  const a = await iste(env, 'acil@idexya.com');
  k(`${etiket}: listedeki e-posta → 200`, a.durum === 200 && a.govde && a.govde.kim === 'acil@idexya.com');
  k(`${etiket}: listedeki e-posta yazabilir (POST kapıdan geçer)`, gecti(await iste(env, 'acil@idexya.com', 'POST', '/api/yonetim/yok')));
  k(`${etiket}: IDOS'ta yönetici ama listede yok → 401`, (await iste(env, 'yon@idexya.com')).durum === 401);
  k(`${etiket}: izleyici → 401`, (await iste(env, 'izle@idexya.com')).durum === 401);
}
k('kapalı: YONETICILER boş → herkes 401', (await iste({ ...temelEnv, YONETICILER: '' }, 'acil@idexya.com')).durum === 401);
k('kapalı: IDOS\'a hiç istek gitmedi', idos.istekler.length === 0);

// --- 3. Anahtar açık: rol → izin ---
const y = await iste(ac, 'yon@idexya.com');
k('açık: yonetici → 200', y.durum === 200 && y.govde.kim === 'yon@idexya.com');
k('açık: yonetici yazabilir', gecti(await iste(ac, 'yon@idexya.com', 'POST', '/api/yonetim/yok')));
const ist = idos.istekler[0];
k('istek: yol yalnız /api/ortak/kisi (e-posta adreste yok)', ist && ist.url === '/api/ortak/kisi' && !ist.url.includes('@'));
k('istek: e-posta X-Idexya-Eposta başlığında, küçük harf', ist && ist.eposta === 'yon@idexya.com');
k('istek: Authorization: Bearer <IDOS_ORTAK_JETON>', ist && ist.yetki === 'Bearer ' + JETON);
k('önbellek: 5 dk içinde ikinci istek IDOS\'a gitmez', idos.istekler.length === 1);
// Yalnız yonetici girer: hesap_yoneticisi (müşteri süzmesi yok), izleyici (salt okuma kapısı yok), musteri, null → 401.
for (const [e, ad] of [['hy@idexya.com', 'hesap_yoneticisi'], ['izle@idexya.com', 'izleyici'], ['mus@ornek.com', 'musteri'], ['yabanci@ornek.com', 'kayıt yok (rol null)']]) {
  k(`açık: ${ad} GET → 401`, (await iste(ac, e)).durum === 401);
  k(`açık: ${ad} POST → 401`, (await iste(ac, e, 'POST', '/api/yonetim/musteriler')).durum === 401);
}
k('açık: izleyici yedek indiremez → 401', (await iste(ac, 'izle@idexya.com', 'GET', '/api/yonetim/yedek/indir')).durum === 401);
k('açık: YONETICILER yedeği → 200, IDOS\'a sorulmaz', await (async () => { const n = idos.istekler.length; const r = await iste(ac, 'acil@idexya.com'); return r.durum === 200 && idos.istekler.length === n; })());
k('açık: Access jetonu yoksa → 401', (await worker.fetch(new Request(PANEL + '/api/yonetim/ozet'), ac, { waitUntil() {} })).status === 401);

KR.onbellekTemizle();
const kimY = await KR.kisiYetki(ac, 'YON@idexya.com');
k('kim: yonetici, süper bayrağı taşınır, müşteri listesi yok', kimY && kimY.rol === 'yonetici' && kimY.super_admin === true && !('musteri_idleri' in kimY));
k('birim: hesap_yoneticisi → null', (await KR.kisiYetki(ac, 'hy@idexya.com')) === null);
k('kapalı: kisiYetki listede olmayanı IDOS\'a sormaz', (await KR.kisiYetki(temelEnv, 'yon@idexya.com')) === null);
k('açık ama IDOS ayarı yok → ret', (await KR.kisiYetki({ KISI_ROL_IDOS: '1', YONETICILER: '' }, 'yon@idexya.com')) === null);

// --- 4. IDOS hatası + önbellek (kapalı başarısız) ---
const asilSimdi = Date.now;
let kayma = 0;
Date.now = () => asilSimdi() + kayma;
idos.kip = '503';
k('503: taze önbellek (yonetici) → 200', (await iste(ac, 'yon@idexya.com')).durum === 200);
kayma = 6 * 60 * 1000; // taze süre geçti, IDOS düşük → son geçerli kayıt
const n503 = idos.istekler.length;
k('503: 6 dk sonra son geçerli kayıt kullanılır → 200', (await iste(ac, 'yon@idexya.com')).durum === 200 && idos.istekler.length === n503 + 1);
k('503: önbellekte olmayan kişi → 401', (await iste(ac, 'hy2@idexya.com')).durum === 401);
k('503: YONETICILER yedeği → 200', (await iste(ac, 'acil@idexya.com')).durum === 200);
kayma = 59 * 60 * 1000;
k('503: 59 dk sonra son geçerli kayıt hâlâ kullanılır → 200', (await iste(ac, 'yon@idexya.com')).durum === 200);
kayma = 61 * 60 * 1000;
k('503: 1 saatten eski kayıt kullanılmaz → 401', (await iste(ac, 'yon@idexya.com')).durum === 401);
idos.kip = 'acik';
k('IDOS düzelince → 200', (await iste(ac, 'yon@idexya.com')).durum === 200);
// 404 ve rol: null eski kayda düşmez: önce yonetici olarak önbelleğe girer, taze süre geçer, sonra IDOS 404 / null der.
ROLLER['degisen@idexya.com'] = { rol: 'yonetici', super_admin: false, musteri_idleri: null };
k('değişen: önce yonetici → 200', (await iste(ac, 'degisen@idexya.com')).durum === 200);
kayma += 6 * 60 * 1000;
idos.kip = '404';
k('değişen: IDOS 404 → eski kayda düşmeden 401', (await iste(ac, 'degisen@idexya.com')).durum === 401);
idos.kip = 'acik';
k('değişen: IDOS düzelince yine yonetici → 200', (await iste(ac, 'degisen@idexya.com')).durum === 200);
kayma += 6 * 60 * 1000;
delete ROLLER['degisen@idexya.com'];
k('değişen: rol null → eski kayda düşmeden 401', (await iste(ac, 'degisen@idexya.com')).durum === 401);
kayma += 6 * 60 * 1000;
idos.kip = '503';
k('değişen: rol null sonrası 503 → eski yonetici kaydına dönülmez, 401', (await iste(ac, 'degisen@idexya.com')).durum === 401);
idos.kip = 'acik';
Date.now = asilSimdi;
kayma = 0;
for (const [kip, ad] of [['404', 'uç yok (404)'], ['yanlis-eposta', 'başka kişinin yanıtı'], ['bilinmeyen-rol', 'bilinmeyen rol']]) {
  idos.kip = kip;
  k(`açık: ${ad}, önbellek yok → 401`, (await iste(ac, 'yeni-' + kip + '@idexya.com')).durum === 401);
}
idos.kip = 'acik';
k('ağ hatası (IDOS kapalı), önbellek yok → 401', (await iste({ ...ac, IDOS_ORTAK_URL: 'http://127.0.0.1:1' }, 'baskasi@idexya.com')).durum === 401);
k('yanlış jeton (IDOS 401) → 401', (await iste({ ...ac, IDOS_ORTAK_JETON: 'yanlis' }, 'baska2@idexya.com')).durum === 401);

// --- 5. Günlük: e-posta yazılmaz ---
const eposta = /[^\s'"<>()]+@[^\s'"<>()]+\.[a-z]{2,}/i;
const sizan = gunluk.filter((s) => !/^(GEÇTİ|KALDI) /.test(s) && eposta.test(s));
k(`günlükte e-posta yok (${gunluk.length} satır tarandı)`, sizan.length === 0);
k('hata günlüğü yazıldı (yalnız ileti)', gunluk.some((s) => s.startsWith('kişi rolü ')));

sunucu.close();
console.log(h.length ? `KALDI: ${h.length}` : 'Hepsi geçti');
process.exit(h.length ? 1 : 0);
