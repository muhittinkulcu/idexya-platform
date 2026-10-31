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
const A = { zaman: 'ana_kayit.son_zaman', esitleme: 'ana_kayit.son_esitleme', tam: 'ana_kayit.son_tam', hata: 'ana_kayit.son_hata', belirsiz: 'ana_kayit.belirsiz_hesap' };
// IDOS platform adı → Panel reklam_ozet platform adı. Hesap kimliği IDOS'la aynı biçime getirilir (Meta: act_ öneksiz, Google: tiresiz).
const PLATFORM = { meta_ads: 'meta', google_ads: 'google' };
export const hesapNormal = (platform, h) => { const v = String(h || '').trim(); return platform === 'meta' ? v.replace(/^act_/i, '') : v.replace(/[-\s]/g, ''); };

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

function eslesmeTemizle(x) {
  const platform = PLATFORM[x && x.platform];
  const hesap = platform ? hesapNormal(platform, yazi(x.hesap, 64)) : '';
  if (!platform || !/^[\w.-]{1,64}$/.test(hesap) || !KIMLIK.test(String(x.musteri_id || ''))) return null;
  return { platform, hesap, musteri_id: String(x.musteri_id), tur: HESAP_TUR.has(x.tur) ? x.tur : 'ana' };
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
    // Reklam hesabı → ana kayıt (4. adım): liste her seferinde bütün olarak gelir ve tek işlemde değiştirilir.
    const es = await idosIstek(env, '/api/ortak/hesap-esleme');
    if (!es.veri || !Array.isArray(es.veri.eslesme)) throw new Error('IDOS hesap eşleme yanıtı beklenen biçimde değil');
    const eslesme = [...new Map(es.veri.eslesme.map(eslesmeTemizle).filter(Boolean).map((x) => [x.platform + '|' + x.hesap, x])).values()];
    if (!eslesme.length) {
      const n = await db.prepare('SELECT COUNT(*) AS n FROM ana_hesap_esleme').first();
      if (n && n.n > 0) throw new Error('IDOS boş hesap eşleme listesi döndü; önbellek korundu');
    }
    const sorgular = kayitlar.map((k) => ekle(db, k, z, parti ?? 'artim'));
    for (const id of silinen) sorgular.push(db.prepare('DELETE FROM ana_musteri WHERE musteri_id = ?').bind(id));
    if (tamMi) sorgular.push(db.prepare('DELETE FROM ana_musteri WHERE parti IS NOT ?').bind(parti));
    await parcali(db, sorgular);
    const esSorgu = [db.prepare('DELETE FROM ana_hesap_esleme')];
    for (let i = 0; i < eslesme.length; i += 400) {
      esSorgu.push(db.prepare(`INSERT INTO ana_hesap_esleme (platform, hesap, musteri_id, tur, cekim)
        SELECT json_extract(value, '$.platform'), json_extract(value, '$.hesap'), json_extract(value, '$.musteri_id'), json_extract(value, '$.tur'), ? FROM json_each(?)`).bind(z, JSON.stringify(eslesme.slice(i, i + 400))));
    }
    await db.batch(esSorgu);
    await ayarYaz(db, { [A.zaman]: veri.zaman, [A.esitleme]: z, [A.hata]: '', [A.belirsiz]: String(Number(es.veri.belirsiz_hesap_sayisi) || 0), ...(tamMi ? { [A.tam]: z } : {}) }, tetikleyen);
    const aday = await adaylariKontrolEt(env, tetikleyen).catch((e) => { console.error('aday kontrol', e && e.message); return null; });
    return { ok: true, tam: tamMi, gelen: kayitlar.length, silinen: silinen.length, hesap: eslesme.length, aday };
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

// --- "Müşteri yap" (4. adım): kazanılan fırsat IDOS onay kuyruğuna aday olarak gider; kaydı yalnız Muhittin onaylar.
// Kişi bilgisi yalnız kullanıcı "kişinin izni var" derse gönderilir (KVKK, en az veri). Onaylanınca kart ana kayda bağlanır.
const TELEFON = /^[0-9 +()-]{6,40}$/;
const EPOSTA = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ADAY_TAZE_MS = 2 * 60 * 1000;

export function adayGovdesi(m, kisiIzin, webSitesi) {
  const marka = yazi(m.firma, 200) || yazi(m.ad, 200);
  if (!marka) return null;
  const g = { kaynak_kimlik: m.id, marka };
  if (yazi(m.sektor, 100)) g.sektor = yazi(m.sektor, 100);
  if (EPOSTA.test(m.sorumlu || '') && String(m.sorumlu).length <= 200) g.sorumlu = m.sorumlu;
  if (webSitesi) g.web_sitesi = webSitesi;
  if (kisiIzin) {
    g.kisi_izin = true;
    if (yazi(m.ad, 120) && m.firma) g.kisi_ad = yazi(m.ad, 120);
    if (EPOSTA.test(m.eposta || '') && String(m.eposta).length <= 200) g.kisi_eposta = m.eposta;
    if (TELEFON.test(m.telefon || '')) g.kisi_telefon = m.telefon;
  }
  return g;
}

const ADAY_DURUM = new Set(['bekliyor', 'onaylandi', 'reddedildi']);
// IDOS'tan gelen aday durumunu yazar; onaylandıysa kartı ana kayda bağlar (kart başka bir kayda bağlıysa dokunmaz).
async function adayDurumYaz(db, musteriId, v, kim) {
  if (!v || !ADAY_DURUM.has(v.durum)) throw new Error('IDOS aday yanıtı beklenen biçimde değil');
  const z = simdi(), anaId = v.durum === 'onaylandi' && KIMLIK.test(String(v.musteri_id || '')) ? String(v.musteri_id) : null;
  const once = await db.prepare('SELECT durum FROM ana_kayit_aday WHERE musteri_id = ?').bind(musteriId).first();
  const q = [db.prepare('UPDATE ana_kayit_aday SET durum = ?, ana_kayit_id = ?, red_gerekcesi = ?, son_kontrol = ? WHERE musteri_id = ?')
    .bind(v.durum, anaId, v.durum === 'reddedildi' ? yazi(v.red_gerekcesi, 300) : null, z, musteriId)];
  if (once && once.durum !== v.durum) {
    if (anaId) {
      q.push(db.prepare('UPDATE musteriler SET ana_kayit_id = ?, guncelleme = ? WHERE id = ? AND ana_kayit_id IS NULL').bind(anaId, z, musteriId));
      q.push(db.prepare('INSERT INTO kayitlar (id, musteri_id, zaman, tur, baslik, detay, kim) SELECT ?, id, ?, ?, ?, ?, ? FROM musteriler WHERE id = ?').bind(crypto.randomUUID(), z, 'sistem', 'Ana kayda alındı', 'IDOS ana kayıt: ' + anaId, kim, musteriId));
    } else if (v.durum === 'reddedildi') {
      q.push(db.prepare('INSERT INTO kayitlar (id, musteri_id, zaman, tur, baslik, detay, kim) SELECT ?, id, ?, ?, ?, ?, ? FROM musteriler WHERE id = ?').bind(crypto.randomUUID(), z, 'sistem', 'Ana kayda alınmadı', yazi(v.red_gerekcesi, 300) || 'Gerekçe yazılmadı', kim, musteriId));
    }
  }
  await db.batch(q);
}

async function adayKontrol(env, satir, kim) {
  const r = await idosIstek(env, '/api/ortak/musteri-adayi/' + encodeURIComponent(satir.aday_id));
  if (r.yok) throw new Error('Aday IDOS\'ta bulunamadı');
  await adayDurumYaz(env.DB, satir.musteri_id, r.veri, kim);
}

// Saatlik eşitlemede bekleyen adaylar (en çok 50) yoklanır.
export async function adaylariKontrolEt(env, kim) {
  const r = await env.DB.prepare("SELECT musteri_id, aday_id FROM ana_kayit_aday WHERE durum = 'bekliyor' ORDER BY COALESCE(son_kontrol, gonderim) LIMIT 50").all();
  let hata = 0;
  for (const s of r.results) { try { await adayKontrol(env, s, kim); } catch (e) { hata++; console.error('aday', e && e.message); } }
  return { yoklanan: r.results.length, hata };
}

async function musteriYap(db, env, musteriId, govde, kim) {
  if (!anaKayitKurulu(env)) return hata('IDOS bağlantısı kurulu değil (IDOS_ORTAK_URL ve IDOS_ORTAK_JETON)', 409);
  const m = await db.prepare('SELECT id, firma, ad, eposta, telefon, sektor, sorumlu, asama, ana_kayit_id FROM musteriler WHERE id = ?').bind(musteriId).first();
  if (!m) return hata('Müşteri bulunamadı', 404);
  if (m.ana_kayit_id) return hata('Bu kart zaten ana kayda bağlı', 409);
  if (m.asama !== 'kazanildi') return hata('"Müşteri yap" yalnız kazanılan fırsatta kullanılabilir', 409);
  const var_ = await db.prepare('SELECT durum FROM ana_kayit_aday WHERE musteri_id = ?').bind(musteriId).first();
  if (var_ && var_.durum === 'bekliyor') return hata('Bu kart için onay bekleyen bir istek zaten var', 409);
  const site = await db.prepare('SELECT adres FROM site_saglik_hedef WHERE musteri_id = ? AND aktif = 1 ORDER BY olusturma LIMIT 1').bind(musteriId).first();
  const g = adayGovdesi(m, govde && govde.kisi_izin === true, site ? adres(site.adres) : null);
  if (!g) return hata('Kartta firma ya da ad yok; önce kart bilgilerini doldurun', 422);
  let r;
  try {
    r = await fetch(taban(env) + '/api/ortak/musteri-adayi', {
      method: 'POST', body: JSON.stringify(g), signal: AbortSignal.timeout(ZAMAN_ASIMI_MS),
      headers: { Authorization: 'Bearer ' + String(env.IDOS_ORTAK_JETON).trim(), 'Content-Type': 'application/json', Accept: 'application/json' }
    });
  } catch (e) { return hata('IDOS\'a ulaşılamadı; istek gönderilmedi. Biraz sonra yeniden deneyin.', 502); }
  if (r.status === 429) return hata('IDOS onay kuyruğu dolu; önce bekleyen istekler karara bağlanmalı', 429);
  if (r.status === 422) return hata('IDOS kart bilgilerini kabul etmedi (biçim hatası); firma, sektör ve iletişim alanlarını kontrol edin', 422);
  if (!r.ok) return hata('IDOS isteği kabul etmedi (' + r.status + '); istek gönderilmedi', 502);
  let v;
  try { v = JSON.parse((await r.text()).slice(0, 100000)); } catch { return hata('IDOS yanıtı okunamadı', 502); }
  if (!v || typeof v.aday_id !== 'string' || !KIMLIK.test(v.aday_id)) return hata('IDOS yanıtı beklenen biçimde değil', 502);
  const z = simdi();
  await db.batch([
    db.prepare(`INSERT INTO ana_kayit_aday (musteri_id, aday_id, durum, gonderim, gonderen, kisi_gonderildi) VALUES (?, ?, 'bekliyor', ?, ?, ?)
      ON CONFLICT(musteri_id) DO UPDATE SET aday_id = excluded.aday_id, durum = 'bekliyor', ana_kayit_id = NULL, red_gerekcesi = NULL, son_kontrol = NULL, gonderim = excluded.gonderim, gonderen = excluded.gonderen, kisi_gonderildi = excluded.kisi_gonderildi`)
      .bind(musteriId, v.aday_id, z, kim.eposta, g.kisi_izin ? 1 : 0),
    db.prepare('INSERT INTO kayitlar (id, musteri_id, zaman, tur, baslik, detay, kim) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(crypto.randomUUID(), musteriId, z, 'sistem', 'Ana kayda onaya gönderildi',
      g.kisi_izin ? 'İletişim kişisi izinle gönderildi.' : 'İletişim kişisi gönderilmedi.', kim.eposta)
  ]);
  // Aynı kart daha önce gönderildiyse IDOS var olan adayın durumunu döner (ör. zaten onaylanmış).
  if (v.durum && v.durum !== 'bekliyor') await adayDurumYaz(db, musteriId, v, kim.eposta);
  await islemYaz(db, kim.eposta, 'musteri_yap', musteriId, `aday ${v.aday_id}${g.kisi_izin ? ' · kişi izinli' : ''}`);
  return json({ ok: true, aday_id: v.aday_id, durum: v.durum || 'bekliyor' });
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
    let mus = await db.prepare('SELECT id, ana_kayit_id, asama FROM musteriler WHERE id = ?').bind(m[1]).first();
    if (!mus) return hata('Müşteri bulunamadı', 404);
    let aday = await db.prepare('SELECT aday_id, durum, red_gerekcesi, gonderim, gonderen, son_kontrol FROM ana_kayit_aday WHERE musteri_id = ?').bind(m[1]).first();
    // Bekleyen aday kart açılınca da yoklanır (en çok 2 dakikada bir).
    if (aday && aday.durum === 'bekliyor' && anaKayitKurulu(env) && Date.now() - Date.parse(aday.son_kontrol || aday.gonderim) > ADAY_TAZE_MS) {
      try {
        await adayKontrol(env, { musteri_id: m[1], aday_id: aday.aday_id }, kim.eposta);
        mus = await db.prepare('SELECT id, ana_kayit_id, asama FROM musteriler WHERE id = ?').bind(m[1]).first();
        aday = await db.prepare('SELECT aday_id, durum, red_gerekcesi, gonderim, gonderen, son_kontrol FROM ana_kayit_aday WHERE musteri_id = ?').bind(m[1]).first();
      } catch (e) { console.error('aday', e && e.message); }
    }
    const ayar = await ayarlar(db);
    const ortak = { kurulu: anaKayitKurulu(env), son_esitleme: ayar[A.esitleme] || null, asama: mus.asama, aday: aday || null };
    if (!mus.ana_kayit_id) return json({ ok: true, bagli: false, ...ortak });
    const r = await anaMusteriGetir(env, mus.ana_kayit_id);
    return json({ ok: true, bagli: true, ana_kayit_id: mus.ana_kayit_id, ...ortak, ...r, duzenle: duzenleAdresi(env, mus.ana_kayit_id) });
  }
  m = yol.match(/^musteriler\/([\w-]+)\/musteri-yap$/);
  if (m && yontem === 'POST') return musteriYap(db, env, m[1], govde, kim);
  if (yol === 'ana-kayit/durum' && yontem === 'GET') {
    const [ayar, n, b] = await Promise.all([ayarlar(db), db.prepare('SELECT COUNT(*) AS n FROM ana_musteri').first(), db.prepare('SELECT COUNT(*) AS n FROM musteriler WHERE ana_kayit_id IS NOT NULL').first()]);
    const [hs, ab] = await Promise.all([db.prepare('SELECT COUNT(*) AS n FROM ana_hesap_esleme').first(), db.prepare("SELECT COUNT(*) AS n FROM ana_kayit_aday WHERE durum = 'bekliyor'").first()]);
    return json({ ok: true, kurulu: anaKayitKurulu(env), onbellek: n.n, bagli_kart: b.n, hesap_esleme: hs.n, belirsiz_hesap: ayar[A.belirsiz] === undefined ? null : Number(ayar[A.belirsiz]), bekleyen_aday: ab.n, son_esitleme: ayar[A.esitleme] || null, son_tam: ayar[A.tam] || null, son_hata: ayar[A.hata] || null });
  }
  if (yol === 'ana-kayit/esitle' && yontem === 'POST') {
    if (!anaKayitKurulu(env)) return hata('IDOS bağlantısı kurulu değil (IDOS_ORTAK_URL ve IDOS_ORTAK_JETON)', 409);
    const r = await anaKayitEsitle(env, kim.eposta, { tam: govde && govde.tam === true });
    await islemYaz(db, kim.eposta, 'ana_kayit_esitle', null, r.ok ? `${r.tam ? 'tam' : 'artım'} · ${r.gelen} kayıt · ${r.silinen} silinen · ${r.hesap} hesap` : 'hata: ' + r.hata);
    return r.ok ? json(r) : hata('Eşitleme yapılamadı: ' + r.hata, 502);
  }
  return null;
}

