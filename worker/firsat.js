// CRM satış çekirdeği (Muhittin onayı 12.11.2026; tasarım docs/superpowers/specs/2026-11-12-crm-satis-cekirdegi-design.md):
// fırsatlar, kişiler, zengin zaman çizelgesi, sonraki adım (= fırsata ya da müşteriye bağlı açık görev) ve Bugün özeti.
// Kurallar: panel hiçbir gönderim yapmaz; tutarlar kuruş ve KDV hariçtir; aylık ve tek seferlik tutar hiçbir yanıtta toplanmaz;
// bilinmeyen tutar NULL kalır (uydurulmaz); sorumlu yalnız ekip listesinden (env.YONETICILER); günler İstanbul takvimine göre.
// musteriler.asama alanı korunur ve fırsatlardan türetilir (dashboard ve "Müşteri yap" bu alanı okur).
import { json, hata, simdi, kimlik, kirp, islemYaz, EPOSTA_DESEN } from './ortak.js';
import { gecerliTarih } from './gorev.js';

export const ASAMALAR = ['yeni', 'gorusme', 'teklif', 'goruldu', 'kazanildi', 'kaybedildi'];
export const ACIK_ASAMALAR = ASAMALAR.slice(0, 4);
export const KAYIP_NEDENLERI = ['fiyat', 'zamanlama', 'rakip', 'yanit_yok', 'ihtiyac_yok', 'diger'];
export const KISI_ROLLERI = ['karar_verici', 'pazarlama', 'muhasebe', 'teknik', 'diger'];
export const KAYNAKLAR = ['iletisim', 'analiz', 'paket', 'sihirbaz', 'asistan', 'form', 'elle', 'idos_sohbet', 'tavsiye'];
export const ADIM_TURLERI = ['ara', 'eposta', 'toplanti', 'teklif', 'diger'];
export const TASIMA_BAYRAK = 'crm_tasima_v1';

export const ASAMA_ADI = { yeni: 'Yeni', gorusme: 'Görüşülüyor', teklif: 'Teklif gönderildi', goruldu: 'Teklif görüldü', kazanildi: 'Kazanıldı', kaybedildi: 'Kaybedildi' };
export const KAYIP_ADI = { fiyat: 'Fiyat', zamanlama: 'Zamanlama', rakip: 'Rakip', yanit_yok: 'Yanıt yok', ihtiyac_yok: 'İhtiyaç yok', diger: 'Diğer' };
const KAYIT_TURU = { not: 'Not', arama: 'Arama', toplanti: 'Toplantı', yazisma: 'Yazışma' };
const SONUCLAR = ['ulasildi', 'ulasilamadi'];
const KAPALI = ['kazanildi', 'kaybedildi'];
const sayiTr = (n) => new Intl.NumberFormat('tr-TR').format(n);

// --- Tek seferlik taşıma: fırsatı olmayan her müşteriye bir fırsat, iletişim bilgisi olan karta birincil kişi. ---
// Her adım "yoksa ekle" biçimindedir; yarıda kalırsa bayrak yazılmaz ve sonraki çağrı kaldığı yerden sürer.
export async function crmTasi(db, yoneticiler) {
  if (await db.prepare('SELECT 1 AS v FROM ayarlar WHERE anahtar = ?').bind(TASIMA_BAYRAK).first()) return { firsat: 0, kisi: 0 };
  const ilk = (yoneticiler || []).map((x) => String(x || '').trim().toLowerCase()).find(Boolean) || '';
  const r = await db.prepare(`SELECT m.* FROM musteriler m WHERE NOT EXISTS (SELECT 1 FROM firsatlar f WHERE f.musteri_id = m.id)
    OR ((m.ad IS NOT NULL AND m.ad != '') OR (m.eposta IS NOT NULL AND m.eposta != '') OR (m.telefon IS NOT NULL AND m.telefon != ''))
       AND NOT EXISTS (SELECT 1 FROM kisiler k WHERE k.musteri_id = m.id) ORDER BY m.olusturma`).all();
  let firsat = 0, kisi = 0;
  const z = simdi();
  for (let i = 0; i < r.results.length; i += 40) {
    const q = [], tur = [];
    for (const m of r.results.slice(i, i + 40)) {
      const fid = kimlik();
      const asama = ASAMALAR.includes(m.asama) ? m.asama : 'yeni';
      const sorumlu = String(m.sorumlu || '').trim().toLowerCase() || ilk;
      const kapanis = asama === 'kazanildi' || asama === 'kaybedildi' ? m.guncelleme || z : null;
      q.push(db.prepare(`INSERT INTO firsatlar (id, musteri_id, ad, hizmetler, aylik_kurus, tek_seferlik_kurus, asama, sorumlu, kaynak, kapanis, olusturma, guncelleme, olusturan)
        SELECT ?, ?, ?, '[]', NULL, NULL, ?, ?, ?, ?, ?, ?, 'taşıma' WHERE NOT EXISTS (SELECT 1 FROM firsatlar WHERE musteri_id = ?)`)
        .bind(fid, m.id, String(m.paket || '').trim().slice(0, 160) || 'Genel', asama, sorumlu, m.kaynak || null, kapanis, m.olusturma || z, z, m.id));
      tur.push('f');
      // Eski "tahmini değer" alanının birimi belirsizdir: tutar olarak taşınmaz, yalnız günlüğe not düşülür.
      if (m.deger !== null && m.deger !== undefined && m.deger !== '') {
        q.push(db.prepare(`INSERT INTO kayitlar (id, musteri_id, zaman, tur, baslik, detay, kim, firsat_id)
          SELECT ?, ?, ?, 'sistem', 'Eski tahmini değer', ?, 'taşıma', ? WHERE EXISTS (SELECT 1 FROM firsatlar WHERE id = ?)`)
          .bind(kimlik(), m.id, z, `Eski tahmini değer: ${sayiTr(Number(m.deger) || 0)} (birimi belirsiz; fırsat tutarı olarak taşınmadı)`, fid, fid));
        tur.push('-');
      }
      const ad = String(m.ad || '').trim() || String(m.eposta || '').trim() || String(m.telefon || '').trim();
      if (ad) {
        q.push(db.prepare(`INSERT INTO kisiler (id, musteri_id, ad, eposta, telefon, birincil, olusturma, guncelleme)
          SELECT ?, ?, ?, ?, ?, 1, ?, ? WHERE NOT EXISTS (SELECT 1 FROM kisiler WHERE musteri_id = ?)`)
          .bind(kimlik(), m.id, ad.slice(0, 120), m.eposta || null, m.telefon || null, z, z, m.id));
        tur.push('k');
      }
    }
    const s = await db.batch(q);
    s.forEach((x, j) => { const n = (x && x.meta && x.meta.changes) || 0; if (tur[j] === 'f') firsat += n; else if (tur[j] === 'k') kisi += n; });
  }
  await db.prepare('INSERT OR IGNORE INTO ayarlar (anahtar, deger, guncelleme, guncelleyen) VALUES (?, ?, ?, ?)')
    .bind(TASIMA_BAYRAK, JSON.stringify({ firsat, kisi }), z, 'sistem').run();
  return { firsat, kisi };
}

// --- Ekip: sorumlu yalnız env.YONETICILER listesinden; oturumdaki yönetici (yerelde yerel@gelistirme) de listededir. ---
export function ekipListesi(env, kim) {
  const l = [...new Set(String((env && env.YONETICILER) || '').split(',').map((x) => x.trim().toLowerCase()).filter(Boolean))];
  if (kim && kim.eposta && !l.includes(kim.eposta)) l.push(kim.eposta);
  return l;
}
async function ekipAdlari(db, env, kim) {
  const a = await db.prepare("SELECT deger FROM ayarlar WHERE anahtar = 'ekip_adlari'").first();
  let adlar = {};
  try { const v = JSON.parse((a && a.deger) || '{}'); if (v && typeof v === 'object' && !Array.isArray(v)) adlar = v; } catch (e) { adlar = {}; }
  return ekipListesi(env, kim).map((e) => ({ eposta: e, ad: typeof adlar[e] === 'string' && adlar[e].trim() ? adlar[e].trim().slice(0, 60) : e.split('@')[0] }));
}

// Taşıma ilk CRM isteğinde bir kez çalışır (bayrak ayarlar tablosunda; bu örnekte de hatırlanır).
let tasimaTamam = false;
export async function crmHazir(db, env, kim) {
  if (tasimaTamam) return;
  await crmTasi(db, ekipListesi(env, kim));
  tasimaTamam = true;
}

// --- musteriler.asama türetme: kazanılan varsa kazanildi; yoksa açıkların en ileri aşaması; hepsi kaybedildiyse kaybedildi;
// fırsat yoksa alan değişmez (null döner). Her fırsat yazımından sonra o anki tüm fırsatlardan yeniden hesaplanır.
export async function asamaTuret(db, musteriId) {
  const l = (await db.prepare('SELECT asama FROM firsatlar WHERE musteri_id = ?').bind(musteriId).all()).results.map((x) => x.asama);
  if (!l.length) return null;
  let a;
  if (l.includes('kazanildi')) a = 'kazanildi';
  else {
    const acik = l.filter((x) => ACIK_ASAMALAR.includes(x));
    a = acik.length ? acik.reduce((e, x) => (ACIK_ASAMALAR.indexOf(x) > ACIK_ASAMALAR.indexOf(e) ? x : e)) : 'kaybedildi';
  }
  await db.prepare('UPDATE musteriler SET asama = ? WHERE id = ? AND asama != ?').bind(a, musteriId, a).run();
  return a;
}

// --- Eski ekranlarla uyum (ekranlar ayrı PR'da gelene dek): ---
// Eski aşama uçları (tek kart / toplu) müşterinin tek fırsatı varsa onu da aynı aşamaya getirir; çok fırsatlıda fırsatlara dokunmaz.
export function tekFirsatAsamaSorgusu(db, idlerJson, asama, z) {
  return db.prepare(`UPDATE firsatlar SET
      kapanis = CASE WHEN ? IN ('kazanildi', 'kaybedildi') THEN (CASE WHEN asama = ? AND kapanis IS NOT NULL THEN kapanis ELSE ? END) ELSE NULL END,
      kayip_nedeni = CASE WHEN ? = 'kaybedildi' THEN kayip_nedeni ELSE NULL END,
      kayip_notu = CASE WHEN ? = 'kaybedildi' THEN kayip_notu ELSE NULL END,
      asama = ?, guncelleme = ?
    WHERE musteri_id IN (SELECT value FROM json_each(?)) AND asama != ?
      AND (SELECT COUNT(*) FROM firsatlar f2 WHERE f2.musteri_id = firsatlar.musteri_id) = 1`).bind(asama, asama, z, asama, asama, asama, z, idlerJson, asama);
}
// Yeni müşteri kartı (talep → CRM, elle kart) açılınca bir fırsat ve iletişim bilgisi varsa birincil kişi de açılır.
export function yeniMusteriCrmSorgulari(db, o) {
  const z = o.z || simdi(), q = [];
  q.push(db.prepare(`INSERT INTO firsatlar (id, musteri_id, ad, hizmetler, asama, sorumlu, kaynak, olusturma, guncelleme, olusturan)
    VALUES (?, ?, ?, '[]', 'yeni', ?, ?, ?, ?, ?)`).bind(kimlik(), o.musteriId, String(o.paket || '').trim().slice(0, 160) || 'Genel', o.sorumlu, KAYNAKLAR.includes(o.kaynak) ? o.kaynak : null, z, z, o.sorumlu));
  const ad = String(o.ad || '').trim() || String(o.eposta || '').trim() || String(o.telefon || '').trim();
  if (ad) q.push(db.prepare('INSERT INTO kisiler (id, musteri_id, ad, eposta, telefon, birincil, olusturma, guncelleme) VALUES (?, ?, ?, ?, ?, 1, ?, ?)')
    .bind(kimlik(), o.musteriId, ad.slice(0, 120), o.eposta || null, o.telefon || null, z, z));
  return q;
}

// --- Doğrulama yardımcıları ---
const kurusOku = (x) => {
  if (x === null || x === undefined || x === '') return null;
  const n = typeof x === 'string' && /^\d{1,15}$/.test(x.trim()) ? Number(x.trim()) : x;
  return Number.isSafeInteger(n) && n >= 0 ? n : 'hata';
};
function hizmetOku(l) {
  if (!Array.isArray(l) || l.length > 30) return { h: 'Hizmet listesi geçersiz' };
  const v = [];
  for (const x of l) {
    if (!x || typeof x !== 'object' || Array.isArray(x)) return { h: 'Hizmet listesi geçersiz' };
    const ad = kirp(x.ad, 160);
    if (!ad) return { h: 'Hizmet adı gerekli' };
    if (!['aylik', 'tek_seferlik'].includes(x.tur)) return { h: 'Hizmet türü aylık ya da tek seferlik olmalı' };
    const f = kurusOku(x.fiyat_kurus);
    if (f === 'hata') return { h: 'Hizmet fiyatı geçersiz (kuruş cinsinden, sıfır ya da artı tam sayı)' };
    v.push({ hizmet_id: kirp(x.hizmet_id, 64) || null, ad, tur: x.tur, fiyat_kurus: f });
  }
  return { v };
}
// Türün tutarı: o türde kalem yoksa ya da bir kalemin fiyatı bilinmiyorsa NULL (kısmi toplam gerçek tutar gibi gösterilmez).
const turTutari = (l, tur) => { const s = l.filter((x) => x.tur === tur); return !s.length || s.some((x) => x.fiyat_kurus === null) ? null : s.reduce((a, x) => a + x.fiyat_kurus, 0); };
const hizmetDizi = (t) => { try { const v = JSON.parse(t || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; } };
export const firsatCikti = (x) => (x ? { ...x, hizmetler: hizmetDizi(x.hizmetler) } : x);

async function firsatAlanlari(g, ekip, kim, eski) {
  const y = eski ? { ...eski, hizmetler: hizmetDizi(eski.hizmetler) } : { hizmetler: [], aylik_kurus: null, tek_seferlik_kurus: null, asama: 'yeni', sorumlu: kim.eposta, kaynak: null, tahmini_kapanis: null, kayip_nedeni: null, kayip_notu: null, kapanis: null };
  if (g.ad !== undefined || !eski) { y.ad = kirp(g.ad, 160); if (!y.ad) return { h: 'Fırsat adı gerekli' }; }
  if (g.hizmetler !== undefined) {
    const { v, h } = hizmetOku(g.hizmetler);
    if (h) return { h };
    y.hizmetler = v; y.aylik_kurus = turTutari(v, 'aylik'); y.tek_seferlik_kurus = turTutari(v, 'tek_seferlik');
  }
  for (const a of ['aylik_kurus', 'tek_seferlik_kurus']) {
    if (g[a] === undefined) continue;
    const n = kurusOku(g[a]);
    if (n === 'hata') return { h: 'Tutar geçersiz (kuruş cinsinden, sıfır ya da artı tam sayı)' };
    y[a] = n;
  }
  if (g.asama !== undefined) { if (!ASAMALAR.includes(g.asama)) return { h: 'Geçersiz aşama' }; y.asama = g.asama; }
  if (g.sorumlu !== undefined) {
    const s = kirp(g.sorumlu, 160).toLowerCase();
    if (!ekip.includes(s)) return { h: 'Sorumlu ekip listesinde değil' };
    y.sorumlu = s;
  }
  if (g.kaynak !== undefined) {
    if (g.kaynak === null || g.kaynak === '') y.kaynak = null;
    else if (!KAYNAKLAR.includes(g.kaynak)) return { h: 'Geçersiz kaynak' };
    else y.kaynak = g.kaynak;
  }
  if (g.tahmini_kapanis !== undefined) {
    const t = kirp(g.tahmini_kapanis, 10);
    if (t && !gecerliTarih(t)) return { h: 'Tahmini kapanış tarihi geçersiz (GG.AA.YYYY biçiminde bir gün seçin)' };
    y.tahmini_kapanis = t || null;
  }
  if (y.asama === 'kaybedildi') {
    const yeniKayip = !eski || eski.asama !== 'kaybedildi';
    if (g.kayip_nedeni !== undefined) y.kayip_nedeni = g.kayip_nedeni;
    else if (yeniKayip) y.kayip_nedeni = null;
    if (!KAYIP_NEDENLERI.includes(y.kayip_nedeni)) return { h: y.kayip_nedeni ? 'Geçersiz kayıp nedeni' : 'Kaybedildi için kayıp nedeni seçilmeli' };
    if (g.kayip_notu !== undefined) y.kayip_notu = kirp(g.kayip_notu, 1000) || null;
    else if (yeniKayip) y.kayip_notu = null;
  } else { y.kayip_nedeni = null; y.kayip_notu = null; }
  if (KAPALI.includes(y.asama)) { if (!eski || eski.asama !== y.asama || !y.kapanis) y.kapanis = simdi(); }
  else y.kapanis = null;
  return { v: y };
}
const asamaDetay = (eski, y) => (eski ? (ASAMA_ADI[eski] || eski) + ' → ' : '') + ASAMA_ADI[y.asama]
  + (y.asama === 'kaybedildi' ? ` · Neden: ${KAYIP_ADI[y.kayip_nedeni]}${y.kayip_notu ? ' · ' + y.kayip_notu : ''}` : '');

function kisiAlanlari(g, eski) {
  const al = (a, n) => (g[a] !== undefined ? kirp(g[a], n) || null : eski ? eski[a] : null);
  const ad = g.ad !== undefined || !eski ? kirp(g.ad, 120) : eski.ad;
  if (!ad) return { h: 'Kişi adı gerekli' };
  let rol = eski ? eski.rol : null;
  if (g.rol !== undefined) { if (g.rol === null || g.rol === '') rol = null; else if (KISI_ROLLERI.includes(g.rol)) rol = g.rol; else return { h: 'Geçersiz rol' }; }
  const eposta = al('eposta', 160) ? al('eposta', 160).toLowerCase() : null;
  if (eposta && !EPOSTA_DESEN.test(eposta)) return { h: 'E-posta adresi geçersiz' };
  const birincil = g.birincil !== undefined ? (g.birincil === true || g.birincil === 1 ? 1 : 0) : eski ? eski.birincil : 0;
  return { v: { ad, unvan: al('unvan', 120), rol, eposta, telefon: al('telefon', 40), birincil } };
}
const kayitSorgu = (db, o) => db.prepare('INSERT INTO kayitlar (id, musteri_id, zaman, tur, baslik, detay, kim, firsat_id, kisi_id, sonuc, sure_dk) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
  .bind(o.id || kimlik(), o.musteri_id, o.zaman, o.tur, o.baslik, o.detay ?? null, o.kim, o.firsat_id ?? null, o.kisi_id ?? null, o.sonuc ?? null, o.sure_dk ?? null);
const benzer = (q) => '%' + q.replace(/[\\%_]/g, (c) => '\\' + c) + '%';
const sayfalama = (p, varsayilan = 100) => {
  const adet = Math.min(200, Math.max(1, parseInt(p.get('adet'), 10) || varsayilan));
  const sayfa = Math.max(1, parseInt(p.get('sayfa'), 10) || 1);
  return { adet, sayfa, atla: (sayfa - 1) * adet };
};

// Müşteri kartı yanıtına eklenir (index.js musteriler/:id).
export async function musteriCrmEk(db, musteriId) {
  const [f, k] = await db.batch([
    db.prepare('SELECT * FROM firsatlar WHERE musteri_id = ? ORDER BY CASE WHEN asama IN (\'kazanildi\', \'kaybedildi\') THEN 1 ELSE 0 END, guncelleme DESC').bind(musteriId),
    db.prepare('SELECT * FROM kisiler WHERE musteri_id = ? ORDER BY birincil DESC, ad').bind(musteriId)
  ]);
  return { firsatlar: f.results.map(firsatCikti), kisiler: k.results };
}

export async function yonetimFirsatApi(db, env, yontem, yol, govde, kim, url) {
  if (!/^(ekip|bugun|firsatlar(\/[\w-]+)?|kisiler(\/[\w-]+)?|musteriler\/[\w-]+\/(kisiler|kayitlar)|gorevler\/[\w-]+\/yapildi)$/.test(yol)) return null;
  await crmHazir(db, env, kim);
  const p = url ? url.searchParams : new URLSearchParams();
  const ekip = ekipListesi(env, kim);
  const z = simdi();

  if (yol === 'ekip' && yontem === 'GET') return json({ ok: true, ekip: await ekipAdlari(db, env, kim) });

  // --- Fırsatlar ---
  if (yol === 'firsatlar' && yontem === 'GET') {
    const k = ['m.arsiv IS NULL'], b = [];
    const sorumlu = (p.get('sorumlu') || '').trim().toLowerCase();
    if (sorumlu) { k.push('f.sorumlu = ?'); b.push(sorumlu === 'ben' ? kim.eposta : sorumlu); }
    const asama = p.get('asama');
    if (asama === 'acik') k.push("f.asama NOT IN ('kazanildi', 'kaybedildi')");
    else if (asama) { if (!ASAMALAR.includes(asama)) return hata('Geçersiz aşama', 422); k.push('f.asama = ?'); b.push(asama); }
    const kaynak = p.get('kaynak');
    if (kaynak) { k.push('f.kaynak = ?'); b.push(kaynak); }
    const hizmet = kirp(p.get('hizmet') || '', 64);
    if (hizmet) { k.push("EXISTS (SELECT 1 FROM json_each(CASE WHEN json_valid(f.hizmetler) THEN f.hizmetler ELSE '[]' END) j WHERE json_extract(j.value, '$.hizmet_id') = ?)"); b.push(hizmet); }
    const musteri = kirp(p.get('musteri_id') || '', 64);
    if (musteri) { k.push('f.musteri_id = ?'); b.push(musteri); }
    const q = kirp(p.get('q') || '', 80);
    if (q) { k.push("(f.ad LIKE ? ESCAPE '\\' OR m.firma LIKE ? ESCAPE '\\' OR m.ad LIKE ? ESCAPE '\\')"); b.push(benzer(q), benzer(q), benzer(q)); }
    const { adet, sayfa, atla } = sayfalama(p);
    const nerede = k.join(' AND ');
    const [l, n] = await db.batch([
      db.prepare(`SELECT f.*, m.firma, m.ad AS musteri_ad FROM firsatlar f JOIN musteriler m ON m.id = f.musteri_id WHERE ${nerede} ORDER BY f.guncelleme DESC LIMIT ? OFFSET ?`).bind(...b, adet, atla),
      db.prepare(`SELECT COUNT(*) AS n FROM firsatlar f JOIN musteriler m ON m.id = f.musteri_id WHERE ${nerede}`).bind(...b)
    ]);
    const ids = l.results.map((x) => x.id);
    const adim = new Map();
    if (ids.length) {
      const g = await db.prepare(`SELECT id, firsat_id, baslik, tarih, saat, tur, atanan FROM gorevler WHERE durum = 'acik' AND firsat_id IN (SELECT value FROM json_each(?))
        ORDER BY tarih, COALESCE(saat, '99:99'), olusturma`).bind(JSON.stringify(ids)).all();
      for (const x of g.results) if (!adim.has(x.firsat_id)) adim.set(x.firsat_id, x);
    }
    return json({ ok: true, firsatlar: l.results.map((x) => ({ ...firsatCikti(x), sonraki: adim.get(x.id) || null })), kayit_sayisi: n.results[0].n, sayfa, adet });
  }
  if (yol === 'firsatlar' && yontem === 'POST') {
    const musteriId = kirp(govde.musteri_id, 64);
    const mus = musteriId && (await db.prepare('SELECT id FROM musteriler WHERE id = ?').bind(musteriId).first());
    if (!mus) return hata('Müşteri bulunamadı', 404);
    const { v, h } = await firsatAlanlari(govde, ekip, kim, null);
    if (h) return hata(h, 422);
    const id = kimlik();
    await db.batch([
      db.prepare(`INSERT INTO firsatlar (id, musteri_id, ad, hizmetler, aylik_kurus, tek_seferlik_kurus, asama, sorumlu, kaynak, tahmini_kapanis, kayip_nedeni, kayip_notu, kapanis, olusturma, guncelleme, olusturan)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(id, musteriId, v.ad, JSON.stringify(v.hizmetler), v.aylik_kurus, v.tek_seferlik_kurus, v.asama, v.sorumlu, v.kaynak, v.tahmini_kapanis, v.kayip_nedeni, v.kayip_notu, v.kapanis, z, z, kim.eposta),
      kayitSorgu(db, { musteri_id: musteriId, zaman: z, tur: 'sistem', baslik: 'Fırsat açıldı', detay: `${v.ad} · ${ASAMA_ADI[v.asama]}`, kim: kim.eposta, firsat_id: id }),
      db.prepare('UPDATE musteriler SET guncelleme = ? WHERE id = ?').bind(z, musteriId)
    ]);
    await asamaTuret(db, musteriId);
    await islemYaz(db, kim.eposta, 'firsat_olusturuldu', id, v.ad);
    return json({ ok: true, id });
  }
  let m = yol.match(/^firsatlar\/([\w-]+)$/);
  if (m && yontem === 'GET') {
    const f = await db.prepare('SELECT f.*, m.firma, m.ad AS musteri_ad, m.arsiv AS musteri_arsiv FROM firsatlar f JOIN musteriler m ON m.id = f.musteri_id WHERE f.id = ?').bind(m[1]).first();
    if (!f) return hata('Fırsat bulunamadı', 404);
    const [k, g] = await db.batch([
      db.prepare('SELECT * FROM kayitlar WHERE firsat_id = ? ORDER BY zaman DESC LIMIT 300').bind(f.id),
      db.prepare("SELECT * FROM gorevler WHERE firsat_id = ? ORDER BY CASE durum WHEN 'acik' THEN 0 ELSE 1 END, tarih, COALESCE(saat, '99:99')").bind(f.id)
    ]);
    return json({ ok: true, firsat: firsatCikti(f), kayitlar: k.results, gorevler: g.results });
  }
  if (m && yontem === 'PATCH') {
    const eski = await db.prepare('SELECT * FROM firsatlar WHERE id = ?').bind(m[1]).first();
    if (!eski) return hata('Fırsat bulunamadı', 404);
    const { v, h } = await firsatAlanlari(govde, ekip, kim, eski);
    if (h) return hata(h, 422);
    const q = [
      db.prepare(`UPDATE firsatlar SET ad = ?, hizmetler = ?, aylik_kurus = ?, tek_seferlik_kurus = ?, asama = ?, sorumlu = ?, kaynak = ?, tahmini_kapanis = ?,
        kayip_nedeni = ?, kayip_notu = ?, kapanis = ?, guncelleme = ? WHERE id = ?`).bind(v.ad, JSON.stringify(v.hizmetler), v.aylik_kurus, v.tek_seferlik_kurus, v.asama, v.sorumlu, v.kaynak,
        v.tahmini_kapanis, v.kayip_nedeni, v.kayip_notu, v.kapanis, z, eski.id),
      db.prepare('UPDATE musteriler SET guncelleme = ? WHERE id = ?').bind(z, eski.musteri_id)
    ];
    if (v.asama !== eski.asama) q.push(kayitSorgu(db, { musteri_id: eski.musteri_id, zaman: z, tur: 'asama', baslik: 'Aşama değişti · ' + v.ad, detay: asamaDetay(eski.asama, v), kim: kim.eposta, firsat_id: eski.id }));
    if (v.sorumlu !== eski.sorumlu) q.push(kayitSorgu(db, { musteri_id: eski.musteri_id, zaman: z, tur: 'sistem', baslik: 'Sorumlu değişti · ' + v.ad, detay: `${eski.sorumlu || '—'} → ${v.sorumlu}`, kim: kim.eposta, firsat_id: eski.id }));
    await db.batch(q);
    const turetilen = await asamaTuret(db, eski.musteri_id);
    await islemYaz(db, kim.eposta, 'firsat_guncellendi', eski.id, v.asama !== eski.asama ? `${eski.asama} → ${v.asama}` : v.ad);
    return json({ ok: true, musteri_asama: turetilen });
  }

  // --- Kişiler ---
  if (yol === 'kisiler' && yontem === 'GET') {
    const k = ['m.arsiv IS NULL'], b = [];
    const q = kirp(p.get('q') || '', 80);
    if (q) { k.push("(k.ad LIKE ? ESCAPE '\\' OR k.eposta LIKE ? ESCAPE '\\' OR k.telefon LIKE ? ESCAPE '\\' OR m.firma LIKE ? ESCAPE '\\')"); b.push(benzer(q), benzer(q), benzer(q), benzer(q)); }
    const rol = p.get('rol');
    if (rol) { k.push('k.rol = ?'); b.push(rol); }
    const { adet, sayfa, atla } = sayfalama(p);
    const [l, n] = await db.batch([
      db.prepare(`SELECT k.*, m.firma, m.ad AS musteri_ad FROM kisiler k JOIN musteriler m ON m.id = k.musteri_id WHERE ${k.join(' AND ')} ORDER BY k.ad LIMIT ? OFFSET ?`).bind(...b, adet, atla),
      db.prepare(`SELECT COUNT(*) AS n FROM kisiler k JOIN musteriler m ON m.id = k.musteri_id WHERE ${k.join(' AND ')}`).bind(...b)
    ]);
    return json({ ok: true, kisiler: l.results, kayit_sayisi: n.results[0].n, sayfa, adet });
  }
  m = yol.match(/^musteriler\/([\w-]+)\/(kisiler|kayitlar)$/);
  if (m) {
    const mus = await db.prepare('SELECT id FROM musteriler WHERE id = ?').bind(m[1]).first();
    if (!mus) return hata('Müşteri bulunamadı', 404);
    if (m[2] === 'kisiler' && yontem === 'GET') {
      const r = await db.prepare('SELECT * FROM kisiler WHERE musteri_id = ? ORDER BY birincil DESC, ad').bind(mus.id).all();
      return json({ ok: true, kisiler: r.results });
    }
    if (m[2] === 'kisiler' && yontem === 'POST') {
      const { v, h } = kisiAlanlari(govde, null);
      if (h) return hata(h, 422);
      const id = kimlik(), q = [];
      if (v.birincil) q.push(db.prepare('UPDATE kisiler SET birincil = 0, guncelleme = ? WHERE musteri_id = ? AND birincil = 1').bind(z, mus.id));
      q.push(db.prepare('INSERT INTO kisiler (id, musteri_id, ad, unvan, rol, eposta, telefon, birincil, olusturma, guncelleme) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(id, mus.id, v.ad, v.unvan, v.rol, v.eposta, v.telefon, v.birincil, z, z));
      q.push(kayitSorgu(db, { musteri_id: mus.id, zaman: z, tur: 'sistem', baslik: 'Kişi eklendi', detay: v.ad + (v.unvan ? ' · ' + v.unvan : ''), kim: kim.eposta, kisi_id: id }));
      q.push(db.prepare('UPDATE musteriler SET guncelleme = ? WHERE id = ?').bind(z, mus.id));
      await db.batch(q);
      await islemYaz(db, kim.eposta, 'kisi_eklendi', mus.id, id);
      return json({ ok: true, id });
    }
    if (m[2] === 'kayitlar' && yontem === 'POST') {
      const tur = govde.tur;
      if (!KAYIT_TURU[tur]) return hata('Kayıt türü not, arama, toplantı ya da yazışma olmalı', 422);
      const detay = kirp(govde.metin ?? govde.detay, 4000);
      if (!detay && (tur === 'not' || tur === 'yazisma')) return hata('Metin boş olamaz', 422);
      let sonuc = null;
      if (govde.sonuc !== undefined && govde.sonuc !== null && govde.sonuc !== '') {
        if (tur !== 'arama' || !SONUCLAR.includes(govde.sonuc)) return hata('Arama sonucu ulaşıldı ya da ulaşılamadı olmalı', 422);
        sonuc = govde.sonuc;
      }
      let sure = null;
      if (govde.sure_dk !== undefined && govde.sure_dk !== null && govde.sure_dk !== '') {
        sure = Number(govde.sure_dk);
        if (!Number.isInteger(sure) || sure < 0 || sure > 1440) return hata('Süre 0 ile 1440 dakika arasında olmalı', 422);
      }
      const firsatId = kirp(govde.firsat_id, 64) || null, kisiId = kirp(govde.kisi_id, 64) || null;
      if (firsatId && !(await db.prepare('SELECT 1 AS v FROM firsatlar WHERE id = ? AND musteri_id = ?').bind(firsatId, mus.id).first())) return hata('Fırsat bu müşteriye ait değil', 422);
      if (kisiId && !(await db.prepare('SELECT 1 AS v FROM kisiler WHERE id = ? AND musteri_id = ?').bind(kisiId, mus.id).first())) return hata('Kişi bu müşteriye ait değil', 422);
      const id = kimlik();
      const baslik = kirp(govde.baslik, 160) || KAYIT_TURU[tur] + (sonuc ? (sonuc === 'ulasildi' ? ' · ulaşıldı' : ' · ulaşılamadı') : '');
      await db.batch([
        kayitSorgu(db, { id, musteri_id: mus.id, zaman: z, tur, baslik, detay: detay || null, kim: kim.eposta, firsat_id: firsatId, kisi_id: kisiId, sonuc, sure_dk: sure }),
        db.prepare('UPDATE musteriler SET guncelleme = ? WHERE id = ?').bind(z, mus.id)
      ]);
      await islemYaz(db, kim.eposta, 'kayit_eklendi', mus.id, tur);
      return json({ ok: true, id });
    }
    return null;
  }
  m = yol.match(/^kisiler\/([\w-]+)$/);
  if (m && (yontem === 'PATCH' || yontem === 'DELETE')) {
    const eski = await db.prepare('SELECT * FROM kisiler WHERE id = ?').bind(m[1]).first();
    if (!eski) return hata('Kişi bulunamadı', 404);
    if (yontem === 'DELETE') {
      // Gerçek silme: kişi satırı kalkar; zaman çizelgesindeki kayıtlar kalır, yalnız kişi bağı boşalır. Not iletişim bilgisi içermez.
      await db.batch([
        db.prepare('UPDATE kayitlar SET kisi_id = NULL WHERE kisi_id = ?').bind(eski.id),
        kayitSorgu(db, { musteri_id: eski.musteri_id, zaman: z, tur: 'sistem', baslik: 'Kişi silindi', detay: eski.ad + (eski.unvan ? ' · ' + eski.unvan : ''), kim: kim.eposta }),
        db.prepare('DELETE FROM kisiler WHERE id = ?').bind(eski.id),
        db.prepare('UPDATE musteriler SET guncelleme = ? WHERE id = ?').bind(z, eski.musteri_id)
      ]);
      await islemYaz(db, kim.eposta, 'kisi_silindi', eski.musteri_id, eski.id);
      return json({ ok: true });
    }
    const { v, h } = kisiAlanlari(govde, eski);
    if (h) return hata(h, 422);
    const q = [];
    if (v.birincil && !eski.birincil) q.push(db.prepare('UPDATE kisiler SET birincil = 0, guncelleme = ? WHERE musteri_id = ? AND birincil = 1').bind(z, eski.musteri_id));
    q.push(db.prepare('UPDATE kisiler SET ad = ?, unvan = ?, rol = ?, eposta = ?, telefon = ?, birincil = ?, guncelleme = ? WHERE id = ?').bind(v.ad, v.unvan, v.rol, v.eposta, v.telefon, v.birincil, z, eski.id));
    await db.batch(q);
    await islemYaz(db, kim.eposta, 'kisi_guncellendi', eski.musteri_id, eski.id);
    return json({ ok: true });
  }
  return null;
}
