// Belgeler (Muhittin, 23 Eki 2026): sözleşme, teklif, fatura ve raporların kaydı. Panelde dosya deposu yok;
// dosya bulunduğu yerde (ör. Google Drive) kalır, burada yalnız adı, türü, tarihi ve https bağlantısı saklanır.
import { json, hata, simdi, kimlik, kirp, islemYaz } from './ortak.js';
import { gecerliTarih } from './gorev.js';

const TUR = ['sozlesme', 'teklif', 'fatura', 'rapor', 'diger'];

// Yalnız https bağlantısı; kullanıcı adı/parola içeren ya da alan adı olmayan adresler kabul edilmez.
export function gecerliBaglanti(b) {
  if (!b || b.length > 1000 || /\s/.test(b)) return false;
  try {
    const u = new URL(b);
    return u.protocol === 'https:' && !u.username && !u.password && /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(u.hostname);
  } catch (e) { return false; }
}

async function alanlar(db, govde) {
  const ad = kirp(govde.ad, 200), tur = govde.tur, baglanti = kirp(govde.baglanti, 1000), tarih = kirp(govde.tarih, 10);
  const aciklama = kirp(govde.aciklama, 2000), musteri = kirp(govde.musteri_id, 64);
  if (!ad) return { h: 'Belge adı gerekli' };
  if (!TUR.includes(tur)) return { h: 'Belge türü geçersiz' };
  if (!gecerliBaglanti(baglanti)) return { h: 'Bağlantı https:// ile başlayan geçerli bir adres olmalı (ör. Google Drive paylaşım bağlantısı)' };
  if (!gecerliTarih(tarih)) return { h: 'Belge tarihi geçersiz' };
  if (musteri && !(await db.prepare('SELECT id FROM musteriler WHERE id = ?').bind(musteri).first())) return { h: 'Seçilen müşteri bulunamadı' };
  return { v: { ad, tur, baglanti, tarih, aciklama: aciklama || null, musteri_id: musteri || null } };
}

export async function yonetimBelgeApi(db, yontem, yol, govde, kim) {
  if (yol === 'belgeler' && yontem === 'GET') {
    const r = await db.prepare(`SELECT b.*, m.firma AS musteri_firma, m.ad AS musteri_ad FROM belgeler b LEFT JOIN musteriler m ON m.id = b.musteri_id
      ORDER BY b.tarih DESC, b.olusturma DESC LIMIT 3000`).all();
    return json({ ok: true, belgeler: r.results });
  }
  if (yol === 'belgeler' && yontem === 'POST') {
    const { v, h } = await alanlar(db, govde);
    if (h) return hata(h, 422);
    const id = kimlik();
    await db.prepare('INSERT INTO belgeler (id, ad, tur, musteri_id, baglanti, tarih, aciklama, olusturma, ekleyen) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(id, v.ad, v.tur, v.musteri_id, v.baglanti, v.tarih, v.aciklama, simdi(), kim.eposta).run();
    await islemYaz(db, kim.eposta, 'belge_eklendi', id, v.ad);
    return json({ ok: true, id });
  }
  let m = yol.match(/^belgeler\/([\w-]+)$/);
  if (m && yontem === 'POST') {
    const k = await db.prepare('SELECT id FROM belgeler WHERE id = ?').bind(m[1]).first();
    if (!k) return hata('Belge bulunamadı', 404);
    const { v, h } = await alanlar(db, govde);
    if (h) return hata(h, 422);
    await db.prepare('UPDATE belgeler SET ad = ?, tur = ?, musteri_id = ?, baglanti = ?, tarih = ?, aciklama = ? WHERE id = ?')
      .bind(v.ad, v.tur, v.musteri_id, v.baglanti, v.tarih, v.aciklama, k.id).run();
    await islemYaz(db, kim.eposta, 'belge_guncellendi', k.id, v.ad);
    return json({ ok: true });
  }
  m = yol.match(/^belgeler\/([\w-]+)\/sil$/);
  if (m && yontem === 'POST') {
    const k = await db.prepare('SELECT id, ad FROM belgeler WHERE id = ?').bind(m[1]).first();
    if (!k) return hata('Belge bulunamadı', 404);
    await db.prepare('DELETE FROM belgeler WHERE id = ?').bind(k.id).run();
    await islemYaz(db, kim.eposta, 'belge_silindi', k.id, k.ad);
    return json({ ok: true });
  }
  return null;
}
