// Etiketler (toplu seçim kuralı, Muhittin 1 Kas 2026): tablolarda seçilen kayıtlara serbest metin etiket eklenir ya da kaldırılır.
// tur: musteri (CRM kartı) · site (müşteri sitesi) · reklam_hesap (platform:hesap). Etiket kaydı silinebilir; kaydın kendisi silinmez.
import { json, hata, simdi, islemYaz } from './ortak.js';

export const ETIKET_TURLERI = { musteri: 'musteriler', site: 'site_saglik_hedef', reklam_hesap: null };
const KIMLIK = /^[\w:.-]{1,120}$/;
const EN_COK = 500;
export const etiketTemizle = (v) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim().slice(0, 40) : '');

export async function yonetimEtiketApi(db, yontem, yol, govde, kim, url) {
  if (yol === 'etiketler' && yontem === 'GET') {
    const tur = url.searchParams.get('tur');
    if (!(tur in ETIKET_TURLERI)) return hata('Geçersiz tür', 422);
    const r = await db.prepare('SELECT hedef, etiket FROM etiketler WHERE tur = ? ORDER BY etiket').bind(tur).all();
    const harita = {};
    for (const x of r.results) (harita[x.hedef] = harita[x.hedef] || []).push(x.etiket);
    return json({ ok: true, etiketler: harita, tumu: [...new Set(r.results.map((x) => x.etiket))].sort((a, b) => a.localeCompare(b, 'tr')) });
  }
  if (yol === 'etiket/toplu' && yontem === 'POST') {
    const tur = govde.tur;
    if (!(tur in ETIKET_TURLERI)) return hata('Geçersiz tür', 422);
    const ids = Array.isArray(govde.ids) ? [...new Set(govde.ids.filter((x) => typeof x === 'string' && KIMLIK.test(x)))] : [];
    if (!ids.length || ids.length > EN_COK) return hata(`1 ile ${EN_COK} arasında kayıt seçin`, 422);
    const etiket = etiketTemizle(govde.etiket);
    if (!etiket) return hata('Etiket 1–40 karakter olmalı', 422);
    const ekle = govde.islem === 'ekle';
    if (!ekle && govde.islem !== 'kaldir') return hata('İşlem ekle ya da kaldır olmalı', 422);
    // Var olmayan kayda etiket yazılmaz (reklam hesapları dışarıdan geldiği için biçimle sınırlanır).
    let hedefler = ids;
    const tablo = ETIKET_TURLERI[tur];
    if (tablo && ekle) {
      const r = await db.prepare(`SELECT id FROM ${tablo} WHERE id IN (SELECT value FROM json_each(?))`).bind(JSON.stringify(ids)).all();
      hedefler = r.results.map((x) => x.id);
    }
    if (tur === 'reklam_hesap') hedefler = ids.filter((x) => /^(meta|google):[\w.-]{1,64}$/.test(x));
    if (!hedefler.length) return hata('Seçilen kayıtlar bulunamadı', 404);
    const z = simdi();
    const q = ekle
      ? db.prepare(`INSERT OR IGNORE INTO etiketler (tur, hedef, etiket, zaman, kim) SELECT ?, value, ?, ?, ? FROM json_each(?)`).bind(tur, etiket, z, kim.eposta, JSON.stringify(hedefler))
      : db.prepare(`DELETE FROM etiketler WHERE tur = ? AND etiket = ? AND hedef IN (SELECT value FROM json_each(?))`).bind(tur, etiket, JSON.stringify(hedefler));
    const r = await q.run();
    await islemYaz(db, kim.eposta, ekle ? 'etiket_ekle' : 'etiket_kaldir', tur, `${etiket} · ${hedefler.length} kayıt`);
    return json({ ok: true, etkilenen: r.meta ? r.meta.changes : null, hedef: hedefler.length });
  }
  return null;
}
