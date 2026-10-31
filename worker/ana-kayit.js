// Müşteri ana kaydı (IDOS) önbelleği: tasarım docs/tasarim/musteri-ana-kayit.md §3, 3. adım.
// · Ana kayıt IDOS'tadır; Panel müşteri alanlarını yalnız OKUR. CRM kartı ana kayda `musteriler.ana_kayit_id` ile bağlanır.
// · `ana_musteri`: IDOS ortak API'sinden (`GET /api/ortak/musteriler`) gelen beyaz liste alanların önbelleği. Kalıcı kopya değildir.
// · Saatlik eşitleme yalnız değişenleri çeker (`degisen_sonra` = IDOS'un son yanıt zamanı); 07.00 UTC'de tam eşitleme yapılır.
// · Müşteri kartı açılınca tek müşteri isteği atılır; sonuç 10 dakika önbellekte kalır. IDOS'a ulaşılamazsa son önbellek
//   "eski" işaretiyle döner ve ekranda son eşitleme zamanı görünür.
// · Ayarlar (Cloudflare): IDOS_ORTAK_URL (değişken, https), IDOS_ORTAK_JETON (Secret; değeri hiçbir yere yazılmaz),
//   IDOS_MUSTERI_ADRESI (isteğe bağlı; "Ana kayıtta düzenle" bağlantısı, `{id}` yer tutucusuyla). Ayar yoksa eşitleme atlanır.
import { json, hata, simdi, islemYaz } from './ortak.js';

const TEK_TAZE_MS = 10 * 60 * 1000;
const ZAMAN_ASIMI_MS = 20000;
const EN_BUYUK_YANIT = 5 * 1024 * 1024;
const KIMLIK = /^[\w-]{1,100}$/;
const DURUMLAR = new Set(['aktif', 'pasif', 'ayrildi', 'arsiv']);
const SOSYAL = ['instagram', 'facebook', 'tiktok', 'linkedin', 'youtube', 'google_isletme'];
const HESAP_LISTE = ['meta_ads', 'google_ads'];
const HESAP_TEK = ['meta_isletme', 'ga4', 'search_console', 'gtm_web', 'gtm_sunucu', 'merchant'];
const HESAP_TUR = new Set(['ana', 'ek', 'arsiv']);
const A = { zaman: 'ana_kayit.son_zaman', esitleme: 'ana_kayit.son_esitleme', tam: 'ana_kayit.son_tam', hata: 'ana_kayit.son_hata' };

export const anaKayitKurulu = (env) => !!(env.IDOS_ORTAK_URL && env.IDOS_ORTAK_JETON);

function taban(env) {
  let u;
  try { u = new URL(String(env.IDOS_ORTAK_URL).trim()); } catch { throw new Error('IDOS_ORTAK_URL geçerli bir adres değil'); }
  const yerel = ['localhost', '127.0.0.1'].includes(u.hostname);
  if (u.protocol !== 'https:' && !(yerel && u.protocol === 'http:')) throw new Error('IDOS_ORTAK_URL https ile başlamalı');
  return u.origin;
}

async function idosIstek(env, yol) {
  const r = await fetch(taban(env) + yol, {
    headers: { Authorization: 'Bearer ' + String(env.IDOS_ORTAK_JETON).trim(), Accept: 'application/json' },
    signal: AbortSignal.timeout(ZAMAN_ASIMI_MS)
  });
  if (r.status === 404) return { yok: true };
  if (!r.ok) throw new Error(r.status === 401 || r.status === 403 ? 'IDOS jetonu kabul etmedi (' + r.status + ')' : 'IDOS yanıt vermedi (' + r.status + ')');
  const metin = await r.text();
  if (metin.length > EN_BUYUK_YANIT) throw new Error('IDOS yanıtı beklenenden büyük');
  try { return { veri: JSON.parse(metin) }; } catch { throw new Error('IDOS yanıtı okunamadı'); }
}

// Yalnız beklenen alanlar ve biçimler saklanır; bağlantılar yalnız http(s), renk yalnız onaltılık.
const yazi = (v, n = 300) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, n) : null);
const adres = (v) => { const s = yazi(v, 500); if (!s) return null; try { const u = new URL(s); return ['http:', 'https:'].includes(u.protocol) ? u.href : null; } catch { return null; } };
export function temizle(k) {
  if (!k || typeof k !== 'object' || !KIMLIK.test(String(k.musteri_id || ''))) return null;
  const h = k.hesaplar && typeof k.hesaplar === 'object' ? k.hesaplar : {};
  const hesaplar = {};
  for (const p of HESAP_LISTE) {
    hesaplar[p] = (Array.isArray(h[p]) ? h[p] : []).slice(0, 50)
      .map((x) => ({ hesap: yazi(x && x.hesap, 64), tur: HESAP_TUR.has(x && x.tur) ? x.tur : 'ana' })).filter((x) => x.hesap);
  }
  for (const p of HESAP_TEK) hesaplar[p] = yazi(h[p], 200);
  const s = k.sosyal && typeof k.sosyal === 'object' ? k.sosyal : {};
  return {
    musteri_id: String(k.musteri_id),
    marka: yazi(k.marka, 200),
    unvan: yazi(k.unvan),
    sektor: yazi(k.sektor, 100),
    durum: DURUMLAR.has(k.durum) ? k.durum : null,
    web_sitesi: adres(k.web_sitesi),
    sosyal: Object.fromEntries(SOSYAL.map((a) => [a, adres(s[a])])),
    logo_url: adres(k.logo_url),
    marka_rengi: /^#[0-9a-f]{3,8}$/i.test(k.marka_rengi || '') ? k.marka_rengi : null,
    guncelleme: yazi(k.guncelleme, 40),
    sorumlu: yazi(k.sorumlu, 200),
    ana_hedef: yazi(k.ana_hedef, 100),
    ana_sonuc: yazi(k.ana_sonuc, 100),
    hesaplar
  };
}

const ekle = (db, k, cekim, parti) => db.prepare(`INSERT INTO ana_musteri (musteri_id, marka, durum, veri, guncelleme, cekim, parti) VALUES (?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(musteri_id) DO UPDATE SET marka = excluded.marka, durum = excluded.durum, veri = excluded.veri, guncelleme = excluded.guncelleme, cekim = excluded.cekim${parti === null ? '' : ', parti = excluded.parti'}`)
  .bind(k.musteri_id, k.marka, k.durum, JSON.stringify(k), k.guncelleme, cekim, parti === null ? 'tek' : parti);

async function parcali(db, sorgular) {
  for (let i = 0; i < sorgular.length; i += 50) await db.batch(sorgular.slice(i, i + 50));
}

async function ayarYaz(db, ciftler, kim) {
  const z = simdi();
  await db.batch(Object.entries(ciftler).map(([a, d]) => db.prepare('INSERT INTO ayarlar (anahtar, deger, guncelleme, guncelleyen) VALUES (?, ?, ?, ?) ON CONFLICT(anahtar) DO UPDATE SET deger = excluded.deger, guncelleme = excluded.guncelleme, guncelleyen = excluded.guncelleyen').bind(a, d, z, kim)));
}

async function ayarlar(db) {
  const r = await db.prepare(`SELECT anahtar, deger FROM ayarlar WHERE anahtar IN (${Object.values(A).map(() => '?').join(',')})`).bind(...Object.values(A)).all();
  return Object.fromEntries(r.results.map((x) => [x.anahtar, x.deger]));
}

// Eşitleme. tam=true: liste baştan çekilir, listede olmayan önbellek satırları silinir. Değilse yalnız değişenler.
// Hata önbelleği bozmaz: imleç yalnız başarılı yazmadan sonra ilerler.
export async function anaKayitEsitle(env, tetikleyen, { tam = false } = {}) {
  const db = env.DB;
  const ayar = await ayarlar(db);
  const tamMi = tam || !ayar[A.zaman];
  try {
    const sorgu = tamMi ? '' : '?degisen_sonra=' + encodeURIComponent(ayar[A.zaman]);
    const { veri } = await idosIstek(env, '/api/ortak/musteriler' + sorgu);
    if (!veri || !Array.isArray(veri.musteriler) || typeof veri.zaman !== 'string') throw new Error('IDOS yanıtı beklenen biçimde değil');
    const kayitlar = veri.musteriler.map(temizle).filter(Boolean);
    const silinen = (Array.isArray(veri.silinen) ? veri.silinen : []).filter((x) => typeof x === 'string' && KIMLIK.test(x));
    const z = simdi(), parti = tamMi ? 'tam:' + z : null;
    if (tamMi && !kayitlar.length) {
      const n = await db.prepare('SELECT COUNT(*) AS n FROM ana_musteri').first();
      // Boş tam liste, dolu önbelleği silmez: IDOS tarafındaki geçici bir sorun bütün bağları "bulunamadı"ya düşürmesin.
      if (n && n.n > 0) throw new Error('IDOS boş müşteri listesi döndü; önbellek korundu');
    }
    const sorgular = kayitlar.map((k) => ekle(db, k, z, parti ?? 'artim'));
    for (const id of silinen) sorgular.push(db.prepare('DELETE FROM ana_musteri WHERE musteri_id = ?').bind(id));
    if (tamMi) sorgular.push(db.prepare('DELETE FROM ana_musteri WHERE parti IS NOT ?').bind(parti));
    await parcali(db, sorgular);
    await ayarYaz(db, { [A.zaman]: veri.zaman, [A.esitleme]: z, [A.hata]: '', ...(tamMi ? { [A.tam]: z } : {}) }, tetikleyen);
    return { ok: true, tam: tamMi, gelen: kayitlar.length, silinen: silinen.length };
  } catch (e) {
    const mesaj = (e && e.name === 'TimeoutError') ? 'IDOS zaman aşımına uğradı' : String((e && e.message) || e).slice(0, 300);
    console.error('ana kayıt eşitleme', mesaj);
    await ayarYaz(db, { [A.hata]: simdi() + ' · ' + mesaj }, tetikleyen).catch(() => {});
    return { ok: false, hata: mesaj };
  }
}

// Tek müşteri: önbellek 10 dakikadan tazeyse ondan; değilse IDOS'tan. IDOS'a ulaşılamazsa önbellek "eski" olarak döner.
export async function anaMusteriGetir(env, musteriId) {
  const db = env.DB;
  const satir = await db.prepare('SELECT veri, cekim FROM ana_musteri WHERE musteri_id = ?').bind(musteriId).first();
  const onbellek = satir ? { kayit: JSON.parse(satir.veri), cekim: satir.cekim } : null;
  if (onbellek && Date.now() - Date.parse(onbellek.cekim) < TEK_TAZE_MS) return { ...onbellek, eski: false };
  if (!anaKayitKurulu(env)) return onbellek ? { ...onbellek, eski: true, hata: 'IDOS bağlantısı kurulu değil' } : { kayit: null, eski: false, hata: 'IDOS bağlantısı kurulu değil' };
  try {
    const r = await idosIstek(env, '/api/ortak/musteriler/' + encodeURIComponent(musteriId));
    if (r.yok) {
      // Silinen ya da paylaşımdan çıkan müşteri: önbellekten de kalkar.
      await db.prepare('DELETE FROM ana_musteri WHERE musteri_id = ?').bind(musteriId).run();
      return { kayit: null, yok: true, eski: false };
    }
    const k = temizle(r.veri);
    if (!k || k.musteri_id !== musteriId) throw new Error('IDOS yanıtı beklenen biçimde değil');
    const z = simdi();
    await ekle(db, k, z, null).run();
    return { kayit: k, cekim: z, eski: false };
  } catch (e) {
    const mesaj = (e && e.name === 'TimeoutError') ? 'IDOS zaman aşımına uğradı' : String((e && e.message) || e).slice(0, 300);
    console.error('ana kayıt tek', mesaj);
    return onbellek ? { ...onbellek, eski: true, hata: mesaj } : { kayit: null, eski: false, hata: mesaj };
  }
}

function duzenleAdresi(env, musteriId) {
  const kalip = String(env.IDOS_MUSTERI_ADRESI || '').trim();
  if (!kalip.includes('{id}')) return null;
  const a = adres(kalip.replace('{id}', encodeURIComponent(musteriId)));
  return a && a.startsWith('https:') ? a : null;
}

export async function yonetimAnaKayitApi(db, env, yontem, yol, kim, govde) {
  let m = yol.match(/^musteriler\/([\w-]+)\/ana-kayit$/);
  if (m && yontem === 'GET') {
    const mus = await db.prepare('SELECT id, ana_kayit_id FROM musteriler WHERE id = ?').bind(m[1]).first();
    if (!mus) return hata('Müşteri bulunamadı', 404);
    const ayar = await ayarlar(db);
    const ortak = { kurulu: anaKayitKurulu(env), son_esitleme: ayar[A.esitleme] || null };
    if (!mus.ana_kayit_id) return json({ ok: true, bagli: false, ...ortak });
    const r = await anaMusteriGetir(env, mus.ana_kayit_id);
    return json({ ok: true, bagli: true, ana_kayit_id: mus.ana_kayit_id, ...ortak, ...r, duzenle: duzenleAdresi(env, mus.ana_kayit_id) });
  }
  if (yol === 'ana-kayit/durum' && yontem === 'GET') {
    const [ayar, n, b] = await Promise.all([ayarlar(db), db.prepare('SELECT COUNT(*) AS n FROM ana_musteri').first(), db.prepare('SELECT COUNT(*) AS n FROM musteriler WHERE ana_kayit_id IS NOT NULL').first()]);
    return json({ ok: true, kurulu: anaKayitKurulu(env), onbellek: n.n, bagli_kart: b.n, son_esitleme: ayar[A.esitleme] || null, son_tam: ayar[A.tam] || null, son_hata: ayar[A.hata] || null });
  }
  if (yol === 'ana-kayit/esitle' && yontem === 'POST') {
    if (!anaKayitKurulu(env)) return hata('IDOS bağlantısı kurulu değil (IDOS_ORTAK_URL ve IDOS_ORTAK_JETON)', 409);
    const r = await anaKayitEsitle(env, kim.eposta, { tam: govde && govde.tam === true });
    await islemYaz(db, kim.eposta, 'ana_kayit_esitle', null, r.ok ? `${r.tam ? 'tam' : 'artım'} · ${r.gelen} kayıt · ${r.silinen} silinen` : 'hata: ' + r.hata);
    return r.ok ? json(r) : hata('Eşitleme yapılamadı: ' + r.hata, 502);
  }
  return null;
}

