// CRM satış çekirdeği (Muhittin onayı 12.11.2026; tasarım docs/superpowers/specs/2026-11-12-crm-satis-cekirdegi-design.md):
// fırsatlar, kişiler, zengin zaman çizelgesi, sonraki adım (= fırsata ya da müşteriye bağlı açık görev) ve Bugün özeti.
// Kurallar: panel hiçbir gönderim yapmaz; tutarlar kuruş ve KDV hariçtir; aylık ve tek seferlik tutar hiçbir yanıtta toplanmaz;
// bilinmeyen tutar NULL kalır (uydurulmaz); sorumlu yalnız ekip listesinden (env.YONETICILER); günler İstanbul takvimine göre.
// musteriler.asama alanı korunur ve fırsatlardan türetilir (dashboard ve "Müşteri yap" bu alanı okur).
import { simdi, kimlik } from './ortak.js';

export const ASAMALAR = ['yeni', 'gorusme', 'teklif', 'goruldu', 'kazanildi', 'kaybedildi'];
export const ACIK_ASAMALAR = ASAMALAR.slice(0, 4);
export const KAYIP_NEDENLERI = ['fiyat', 'zamanlama', 'rakip', 'yanit_yok', 'ihtiyac_yok', 'diger'];
export const KISI_ROLLERI = ['karar_verici', 'pazarlama', 'muhasebe', 'teknik', 'diger'];
export const KAYNAKLAR = ['iletisim', 'analiz', 'paket', 'sihirbaz', 'asistan', 'form', 'elle', 'idos_sohbet', 'tavsiye'];
export const ADIM_TURLERI = ['ara', 'eposta', 'toplanti', 'teklif', 'diger'];
export const TASIMA_BAYRAK = 'crm_tasima_v1';

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
