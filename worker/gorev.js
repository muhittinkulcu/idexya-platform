// Görevler ve takvim (Muhittin, 23 Eki 2026): ekip içi yapılacaklar. Her görevin bir günü (İstanbul takvimine göre),
// isteğe bağlı saati, önceliği ve sorumlusu (e-posta) olur; istenirse bir müşteriye bağlanır.
// Takvim görünümü ve .ics dışa aktarımı tarayıcıda bu listeden üretilir.
import { json, hata, simdi, kimlik, kirp, islemYaz, EPOSTA_DESEN } from './ortak.js';

const ONCELIK = ['dusuk', 'normal', 'yuksek'];
const TARIH = /^(\d{4})-(\d{2})-(\d{2})$/;
const SAAT = /^([01]\d|2[0-3]):[0-5]\d$/;

// Gerçek bir takvim günü mü (2026-02-30 gibi tarihler reddedilir)?
export function gecerliTarih(t) {
  const m = TARIH.exec(t || '');
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3] && +m[1] >= 2000 && +m[1] <= 2100;
}
// İstanbul'un bugünkü tarihi (Türkiye yaz saati uygulamıyor, UTC+3).
export const bugunIst = () => new Date(Date.now() + 3 * 3600000).toISOString().slice(0, 10);

async function alanlar(db, govde, kim) {
  const baslik = kirp(govde.baslik, 160), aciklama = kirp(govde.aciklama, 4000), tarih = kirp(govde.tarih, 10), saat = kirp(govde.saat, 5);
  const oncelik = govde.oncelik === undefined || govde.oncelik === '' ? 'normal' : govde.oncelik;
  const musteri = kirp(govde.musteri_id, 64);
  let atanan = kirp(govde.atanan, 160).toLowerCase();
  if (!baslik) return { h: 'Görev başlığı gerekli' };
  if (!gecerliTarih(tarih)) return { h: 'Tarih geçersiz (GG.AA.YYYY biçiminde bir gün seçin)' };
  if (saat && !SAAT.test(saat)) return { h: 'Saat geçersiz (SS.DD biçiminde, ör. 09.30)' };
  if (!ONCELIK.includes(oncelik)) return { h: 'Öncelik geçersiz' };
  if (!atanan) atanan = kim.eposta;
  else if (atanan !== kim.eposta && !EPOSTA_DESEN.test(atanan)) return { h: 'Sorumlu e-posta adresi geçersiz' };
  if (musteri && !(await db.prepare('SELECT id FROM musteriler WHERE id = ?').bind(musteri).first())) return { h: 'Seçilen müşteri bulunamadı' };
  return { v: { baslik, aciklama: aciklama || null, tarih, saat: saat || null, oncelik, atanan, musteri_id: musteri || null } };
}

export async function yonetimGorevApi(db, yontem, yol, govde, kim) {
  if (yol === 'gorevler' && yontem === 'GET') {
    const r = await db.prepare(`SELECT g.*, m.firma AS musteri_firma, m.ad AS musteri_ad FROM gorevler g LEFT JOIN musteriler m ON m.id = g.musteri_id
      ORDER BY g.tarih ASC, COALESCE(g.saat, '99:99') ASC, g.olusturma ASC LIMIT 3000`).all();
    return json({ ok: true, gorevler: r.results, bugun: bugunIst(), kim: kim.eposta });
  }
  if (yol === 'gorevler' && yontem === 'POST') {
    const { v, h } = await alanlar(db, govde, kim);
    if (h) return hata(h, 422);
    const id = kimlik();
    await db.prepare(`INSERT INTO gorevler (id, baslik, aciklama, tarih, saat, musteri_id, atanan, oncelik, durum, olusturma, olusturan)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'acik', ?, ?)`).bind(id, v.baslik, v.aciklama, v.tarih, v.saat, v.musteri_id, v.atanan, v.oncelik, simdi(), kim.eposta).run();
    await islemYaz(db, kim.eposta, 'gorev_olusturuldu', id, v.baslik);
    return json({ ok: true, id });
  }
  let m = yol.match(/^gorevler\/([\w-]+)$/);
  if (m && yontem === 'POST') {
    const k = await db.prepare('SELECT id FROM gorevler WHERE id = ?').bind(m[1]).first();
    if (!k) return hata('Görev bulunamadı', 404);
    const { v, h } = await alanlar(db, govde, kim);
    if (h) return hata(h, 422);
    await db.prepare('UPDATE gorevler SET baslik = ?, aciklama = ?, tarih = ?, saat = ?, musteri_id = ?, atanan = ?, oncelik = ? WHERE id = ?')
      .bind(v.baslik, v.aciklama, v.tarih, v.saat, v.musteri_id, v.atanan, v.oncelik, k.id).run();
    await islemYaz(db, kim.eposta, 'gorev_guncellendi', k.id, v.baslik);
    return json({ ok: true });
  }
  m = yol.match(/^gorevler\/([\w-]+)\/(tamamla|ac|sil)$/);
  if (m && yontem === 'POST') {
    const k = await db.prepare('SELECT id, baslik, durum FROM gorevler WHERE id = ?').bind(m[1]).first();
    if (!k) return hata('Görev bulunamadı', 404);
    if (m[2] === 'sil') await db.prepare('DELETE FROM gorevler WHERE id = ?').bind(k.id).run();
    else if (m[2] === 'tamamla') {
      if (k.durum === 'tamam') return hata('Görev zaten tamamlanmış', 409);
      await db.prepare("UPDATE gorevler SET durum = 'tamam', tamamlanma = ? WHERE id = ?").bind(simdi(), k.id).run();
    } else {
      if (k.durum === 'acik') return hata('Görev zaten açık', 409);
      await db.prepare("UPDATE gorevler SET durum = 'acik', tamamlanma = NULL WHERE id = ?").bind(k.id).run();
    }
    await islemYaz(db, kim.eposta, { sil: 'gorev_silindi', tamamla: 'gorev_tamamlandi', ac: 'gorev_yeniden_acildi' }[m[2]], k.id, k.baslik);
    return json({ ok: true });
  }
  return null;
}
