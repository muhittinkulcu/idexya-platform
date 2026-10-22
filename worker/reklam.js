// IDOS reklam özeti: IDOS'un BigQuery'deki yetkili görünümünden (yalnız okuma) günde bir kez son 28 gün okunur ve
// reklam_ozet tablosuna yazılır. Panel yalnız bu tabloyu okur; sayfa açılışlarında BigQuery'ye sorgu gitmez.
// Ayarlar (Cloudflare değişkenleri): IDOS_BQ_ANAHTAR (gizli: servis hesabı JSON), IDOS_BQ_GORUNUM (proje.veriseti.gorunum),
// IDOS_BQ_KONUM (varsayılan europe-west1). Anahtar ve görünüm yoksa hiçbir şey yapılmaz.
import { importPKCS8, SignJWT } from 'jose';
import { json, hata, simdi, kimlik, islemYaz } from './ortak.js';

const GUN = 28;
const UST_SINIR_BAYT = String(100 * 1024 * 1024); // Sorgu başına en fazla 100 MB işlenir; aşılırsa BigQuery sorguyu reddeder.
const GEREKLI = ['metric_date', 'platform', 'account_id', 'currency', 'spend'];
const BILINEN = new Set([...GEREKLI, 'client_id', 'brand_name', 'impressions', 'clicks']);
const GORUNUM_DESEN = /^[a-z][a-z0-9-]{4,61}[a-z0-9]\.[A-Za-z0-9_]{1,1024}\.[A-Za-z0-9_]{1,1024}$/;

export const reklamKurulu = (env) => !!(env.IDOS_BQ_ANAHTAR && env.IDOS_BQ_GORUNUM);

async function erisimJetonu(env, anahtar) {
  const tokenUrl = env.IDOS_BQ_TOKEN_URL || anahtar.token_uri || 'https://oauth2.googleapis.com/token';
  const imza = await importPKCS8(anahtar.private_key, 'RS256');
  const jwt = await new SignJWT({ scope: 'https://www.googleapis.com/auth/bigquery' })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT', kid: anahtar.private_key_id })
    .setIssuer(anahtar.client_email).setAudience(tokenUrl).setIssuedAt().setExpirationTime('10m').sign(imza);
  const r = await fetch(tokenUrl, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }) });
  const s = await r.json().catch(() => ({}));
  if (!r.ok || !s.access_token) throw new Error(`Google girişi başarısız (${r.status}${s.error ? ' ' + s.error : ''})`);
  return s.access_token;
}

// BigQuery satırını { sütun: değer } nesnesine çevirir; sayısal türler sayıya dönüşür.
function satirlar(schema, rows) {
  const alanlar = schema.fields.map((f) => ({ ad: f.name, sayi: ['INTEGER', 'INT64', 'FLOAT', 'FLOAT64', 'NUMERIC', 'BIGNUMERIC'].includes(f.type) }));
  return (rows || []).map((r) => Object.fromEntries(alanlar.map((a, i) => { const v = r.f[i].v; return [a.ad, v === null || v === undefined ? null : a.sayi ? Number(v) : String(v)]; })));
}

export async function bigqueryOku(env) {
  const anahtar = JSON.parse(env.IDOS_BQ_ANAHTAR);
  const gorunum = String(env.IDOS_BQ_GORUNUM).trim();
  if (!GORUNUM_DESEN.test(gorunum)) throw new Error('IDOS_BQ_GORUNUM biçimi proje.veriseti.gorunum olmalı');
  const proje = gorunum.split('.')[0];
  const konum = env.IDOS_BQ_KONUM || 'europe-west1';
  const api = (env.IDOS_BQ_API || 'https://bigquery.googleapis.com') + `/bigquery/v2/projects/${encodeURIComponent(proje)}`;
  const jeton = await erisimJetonu(env, anahtar);
  const baslik = { Authorization: `Bearer ${jeton}`, 'Content-Type': 'application/json' };
  const sorgu = `SELECT * FROM \`${gorunum}\` WHERE metric_date >= DATE_SUB(CURRENT_DATE('Europe/Istanbul'), INTERVAL ${GUN} DAY)`;
  let r = await fetch(`${api}/queries`, { method: 'POST', headers: baslik,
    body: JSON.stringify({ query: sorgu, useLegacySql: false, location: konum, maximumBytesBilled: UST_SINIR_BAYT, timeoutMs: 25000, maxResults: 5000 }) });
  let s = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`BigQuery sorgusu reddedildi (${r.status}): ${(s.error && s.error.message) || 'bilinmeyen hata'}`.slice(0, 400));
  const is = s.jobReference;
  let schema = s.schema, hepsi = s.jobComplete ? satirlar(schema, s.rows) : [], sayfa = s.jobComplete ? s.pageToken : undefined, tamam = !!s.jobComplete;
  for (let tur = 0; (!tamam || sayfa) && tur < 40; tur++) {
    const q = new URLSearchParams({ location: konum, timeoutMs: '25000', maxResults: '5000' }); if (sayfa) q.set('pageToken', sayfa);
    r = await fetch(`${api}/queries/${encodeURIComponent(is.jobId)}?${q}`, { headers: baslik });
    s = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(`BigQuery sonucu alınamadı (${r.status}): ${(s.error && s.error.message) || ''}`.slice(0, 400));
    if (!s.jobComplete) continue;
    tamam = true; schema = schema || s.schema; hepsi = hepsi.concat(satirlar(schema, s.rows)); sayfa = s.pageToken;
  }
  if (!tamam || sayfa) throw new Error('BigQuery sonucu zamanında tamamlanmadı');
  const eksik = GEREKLI.filter((a) => !schema.fields.some((f) => f.name === a));
  if (eksik.length) throw new Error('Görünümde eksik sütun: ' + eksik.join(', '));
  return hepsi;
}

// Aynı gün + platform + hesap + para birimi tek satıra toplanır; tanınmayan sayısal sütunlar sonuç türü sayılır.
export function ozetle(satirlar) {
  const m = new Map();
  for (const x of satirlar) {
    if (!x.metric_date || !x.platform || !x.account_id || !x.currency) continue;
    const k = [x.metric_date, x.platform, x.account_id, x.currency].join('|');
    const o = m.get(k) || { gun: x.metric_date.slice(0, 10), platform: String(x.platform).toLowerCase(), hesap: x.account_id, para: String(x.currency).toUpperCase(), musteri_id: null, marka: null, harcama: 0, gosterim: null, tiklama: null, sonuclar: {} };
    o.musteri_id = o.musteri_id || x.client_id || null; o.marka = o.marka || x.brand_name || null;
    o.harcama += Number(x.spend) || 0;
    if (x.impressions !== null && x.impressions !== undefined) o.gosterim = (o.gosterim || 0) + Number(x.impressions);
    if (x.clicks !== null && x.clicks !== undefined) o.tiklama = (o.tiklama || 0) + Number(x.clicks);
    for (const [a, v] of Object.entries(x)) if (!BILINEN.has(a) && typeof v === 'number' && isFinite(v)) o.sonuclar[a] = (o.sonuclar[a] || 0) + v;
    m.set(k, o);
  }
  return [...m.values()];
}

// Son 28 günün eski satırları silinir ve yenileri yazılır; hepsi tek işlemde (yarım kalırsa hiçbiri yazılmaz).
async function yaz(db, liste, tetikleyen, baslangic) {
  const sorgular = [db.prepare('DELETE FROM reklam_ozet WHERE gun >= ?').bind(baslangic)];
  for (let i = 0; i < liste.length; i += 400) {
    sorgular.push(db.prepare(`INSERT INTO reklam_ozet (gun, platform, hesap, para, musteri_id, marka, harcama, gosterim, tiklama, sonuclar)
      SELECT json_extract(value, '$.gun'), json_extract(value, '$.platform'), json_extract(value, '$.hesap'), json_extract(value, '$.para'),
        json_extract(value, '$.musteri_id'), json_extract(value, '$.marka'), json_extract(value, '$.harcama'), json_extract(value, '$.gosterim'),
        json_extract(value, '$.tiklama'), json(json_extract(value, '$.sonuclar')) FROM json_each(?)`).bind(JSON.stringify(liste.slice(i, i + 400))));
  }
  sorgular.push(db.prepare('INSERT INTO reklam_cekim (id, zaman, durum, satir, baslangic, mesaj, tetikleyen) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(kimlik(), simdi(), 'tamam', liste.length, baslangic, null, tetikleyen));
  await db.batch(sorgular);
}

export async function reklamCek(env, tetikleyen) {
  const db = env.DB;
  const baslangic = new Date(Date.now() + 3 * 3600000 - GUN * 86400000).toISOString().slice(0, 10);
  try {
    const liste = ozetle(await bigqueryOku(env));
    await yaz(db, liste, tetikleyen, baslangic);
    return { ok: true, satir: liste.length };
  } catch (e) {
    const mesaj = String((e && e.message) || e).slice(0, 400);
    await db.prepare('INSERT INTO reklam_cekim (id, zaman, durum, satir, baslangic, mesaj, tetikleyen) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(kimlik(), simdi(), 'hata', null, baslangic, mesaj, tetikleyen).run();
    console.error('reklam çekimi', mesaj);
    return { ok: false, hata: mesaj };
  }
}

export async function yonetimReklamApi(db, env, yontem, yol, kim) {
  if (yol === 'reklam' && yontem === 'GET') {
    const kurulu = reklamKurulu(env);
    const [son, sonTamam, gun, marka] = await db.batch([
      db.prepare('SELECT zaman, durum, satir, mesaj, tetikleyen FROM reklam_cekim ORDER BY zaman DESC LIMIT 1'),
      db.prepare("SELECT zaman, satir FROM reklam_cekim WHERE durum = 'tamam' ORDER BY zaman DESC LIMIT 1"),
      db.prepare('SELECT gun, platform, para, SUM(harcama) AS harcama, SUM(gosterim) AS gosterim, SUM(tiklama) AS tiklama, COUNT(*) AS hesap FROM reklam_ozet GROUP BY gun, platform, para ORDER BY gun'),
      db.prepare('SELECT gun, COALESCE(marka, hesap) AS marka, musteri_id, platform, para, harcama, sonuclar FROM reklam_ozet')
    ]);
    return json({ ok: true, kurulu, bugun: new Date(Date.now() + 3 * 3600000).toISOString().slice(0, 10), sonCekim: son.results[0] || null, sonBasarili: sonTamam.results[0] || null, gunluk: gun.results, satirlar: marka.results });
  }
  if (yol === 'reklam/cek' && yontem === 'POST') {
    if (!reklamKurulu(env)) return hata('IDOS bağlantı ayarları girilmemiş', 409);
    const son = await db.prepare('SELECT zaman FROM reklam_cekim ORDER BY zaman DESC LIMIT 1').first();
    if (son && Date.now() - new Date(son.zaman).getTime() < 10 * 60000) return hata('Son çekimden bu yana 10 dakika geçmedi', 429);
    const s = await reklamCek(env, kim.eposta);
    await islemYaz(db, kim.eposta, 'reklam_cek', null, s.ok ? `${s.satir} satır` : s.hata);
    return s.ok ? json({ ok: true, satir: s.satir }) : hata('Çekim başarısız: ' + s.hata, 502);
  }
  return null;
}
