// Muhasebe (Muhittin, 23 Eki 2026): basit gelir-gider defteri. Resmî muhasebe kaydı DEĞİLDİR; ay sonunda CSV olarak
// mali müşavire verilir. Tutarlar kuruş cinsinden tam sayı olarak saklanır (kayan nokta yuvarlama hatası olmasın)
// ve KDV dâhil toplamdır; KDV payı kdv_orani ile hesaplanır.
import { json, hata, simdi, kimlik, kirp, islemYaz } from './ortak.js';
import { gecerliTarih, bugunIst } from './gorev.js';

const TUR = ['gelir', 'gider'];
const DURUM = ['bekliyor', 'odendi'];
const AY = /^(\d{4})-(0[1-9]|1[0-2])$/;
const EN_COK = 100000000000; // 1 milyar TL (kuruş)

// "1.234,56", "1234,5", "1234.56", 1234.56 → kuruş (tam sayı). Geçersizse null.
export function kurusa(deger) {
  let s = typeof deger === 'number' ? (Number.isFinite(deger) ? deger.toFixed(2) : '') : typeof deger === 'string' ? deger : '';
  s = s.replace(/\s|TL|₺/gi, '');
  if (!s) return null;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
  const m = /^(\d{1,12})(?:\.(\d{1,2}))?$/.exec(s);
  if (!m) return null;
  const k = Number(m[1]) * 100 + Number((m[2] || '').padEnd(2, '0'));
  return k > 0 && k <= EN_COK ? k : null;
}
const kdvPay = (tutar, oran) => Math.round((tutar * oran) / (100 + oran));

async function alanlar(db, govde) {
  const tur = govde.tur, tarih = kirp(govde.tarih, 10), tutar = kurusa(govde.tutar);
  const oranHam = govde.kdv_orani === undefined || govde.kdv_orani === '' ? 0 : typeof govde.kdv_orani === 'number' || typeof govde.kdv_orani === 'string' ? Number(govde.kdv_orani) : NaN;
  const aciklama = kirp(govde.aciklama, 300), kategori = kirp(govde.kategori, 60), belgeNo = kirp(govde.belge_no, 60), musteri = kirp(govde.musteri_id, 64);
  const durum = govde.durum === undefined || govde.durum === '' ? 'bekliyor' : govde.durum;
  const vade = kirp(govde.vade, 10), odeme = kirp(govde.odeme_tarihi, 10);
  if (!TUR.includes(tur)) return { h: 'Tür gelir ya da gider olmalı' };
  if (!gecerliTarih(tarih)) return { h: 'İşlem tarihi geçersiz' };
  if (tutar === null) return { h: 'Tutar geçersiz (sıfırdan büyük, en fazla iki ondalık; ör. 1.250,00)' };
  if (!Number.isInteger(oranHam) || oranHam < 0 || oranHam > 100) return { h: 'KDV oranı 0 ile 100 arasında tam sayı olmalı' };
  if (!aciklama) return { h: 'Açıklama gerekli' };
  if (!DURUM.includes(durum)) return { h: 'Durum geçersiz' };
  if (vade && !gecerliTarih(vade)) return { h: 'Vade tarihi geçersiz' };
  if (odeme && !gecerliTarih(odeme)) return { h: 'Ödeme tarihi geçersiz' };
  if (musteri && !(await db.prepare('SELECT id FROM musteriler WHERE id = ?').bind(musteri).first())) return { h: 'Seçilen müşteri bulunamadı' };
  return { v: { tur, tarih, tutar, kdv_orani: oranHam, aciklama, kategori: kategori || null, belge_no: belgeNo || null, musteri_id: musteri || null,
    durum, vade: vade || null, odeme_tarihi: durum === 'odendi' ? odeme || bugunIst() : null } };
}

export async function yonetimMuhasebeApi(db, yontem, yol, govde, kim) {
  let m = yol.match(/^muhasebe\/ay\/(\d{4}-\d{2})$/);
  if (m && yontem === 'GET') {
    if (!AY.test(m[1])) return hata('Ay geçersiz', 422);
    const bugun = bugunIst();
    const [kayit, geciken, kat] = await db.batch([
      db.prepare(`SELECT k.*, mu.firma AS musteri_firma, mu.ad AS musteri_ad FROM muhasebe k LEFT JOIN musteriler mu ON mu.id = k.musteri_id
        WHERE substr(k.tarih, 1, 7) = ? ORDER BY k.tarih DESC, k.olusturma DESC LIMIT 5000`).bind(m[1]),
      db.prepare(`SELECT k.*, mu.firma AS musteri_firma, mu.ad AS musteri_ad FROM muhasebe k LEFT JOIN musteriler mu ON mu.id = k.musteri_id
        WHERE k.durum = 'bekliyor' AND k.vade IS NOT NULL AND k.vade < ? ORDER BY k.vade ASC LIMIT 500`).bind(bugun),
      db.prepare("SELECT DISTINCT kategori FROM muhasebe WHERE kategori IS NOT NULL AND kategori != '' ORDER BY kategori LIMIT 200")
    ]);
    const k = kayit.results, top = (f) => k.filter(f).reduce((s, x) => s + x.tutar, 0);
    const gelir = top((x) => x.tur === 'gelir'), gider = top((x) => x.tur === 'gider');
    const g = geciken.results;
    const ozet = {
      gelir, gider, net: gelir - gider,
      tahsilEdilmemis: top((x) => x.tur === 'gelir' && x.durum === 'bekliyor'), tahsilEdilmemisAdet: k.filter((x) => x.tur === 'gelir' && x.durum === 'bekliyor').length,
      odenmemisGider: top((x) => x.tur === 'gider' && x.durum === 'bekliyor'),
      hesaplananKdv: k.filter((x) => x.tur === 'gelir').reduce((s, x) => s + kdvPay(x.tutar, x.kdv_orani), 0),
      indirilecekKdv: k.filter((x) => x.tur === 'gider').reduce((s, x) => s + kdvPay(x.tutar, x.kdv_orani), 0),
      vadesiGecmisAlacak: g.filter((x) => x.tur === 'gelir').reduce((s, x) => s + x.tutar, 0), vadesiGecmisAlacakAdet: g.filter((x) => x.tur === 'gelir').length,
      vadesiGecmisBorc: g.filter((x) => x.tur === 'gider').reduce((s, x) => s + x.tutar, 0), vadesiGecmisBorcAdet: g.filter((x) => x.tur === 'gider').length
    };
    return json({ ok: true, ay: m[1], bugun, ozet, kayitlar: k, gecikenler: g, kategoriler: kat.results.map((x) => x.kategori) });
  }
  if (yol === 'muhasebe' && yontem === 'POST') {
    const { v, h } = await alanlar(db, govde);
    if (h) return hata(h, 422);
    const id = kimlik();
    await db.prepare(`INSERT INTO muhasebe (id, tur, tarih, tutar, kdv_orani, aciklama, kategori, musteri_id, belge_no, durum, vade, odeme_tarihi, olusturma, ekleyen)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(id, v.tur, v.tarih, v.tutar, v.kdv_orani, v.aciklama, v.kategori, v.musteri_id, v.belge_no, v.durum, v.vade, v.odeme_tarihi, simdi(), kim.eposta).run();
    await islemYaz(db, kim.eposta, 'muhasebe_eklendi', id, `${v.tur} ${v.tutar} kuruş`);
    return json({ ok: true, id });
  }
  m = yol.match(/^muhasebe\/([\w-]+)$/);
  if (m && yontem === 'POST') {
    const k = await db.prepare('SELECT id FROM muhasebe WHERE id = ?').bind(m[1]).first();
    if (!k) return hata('Kayıt bulunamadı', 404);
    const { v, h } = await alanlar(db, govde);
    if (h) return hata(h, 422);
    await db.prepare('UPDATE muhasebe SET tur = ?, tarih = ?, tutar = ?, kdv_orani = ?, aciklama = ?, kategori = ?, musteri_id = ?, belge_no = ?, durum = ?, vade = ?, odeme_tarihi = ? WHERE id = ?')
      .bind(v.tur, v.tarih, v.tutar, v.kdv_orani, v.aciklama, v.kategori, v.musteri_id, v.belge_no, v.durum, v.vade, v.odeme_tarihi, k.id).run();
    await islemYaz(db, kim.eposta, 'muhasebe_guncellendi', k.id, `${v.tur} ${v.tutar} kuruş`);
    return json({ ok: true });
  }
  m = yol.match(/^muhasebe\/([\w-]+)\/(odendi|bekliyor|sil)$/);
  if (m && yontem === 'POST') {
    const k = await db.prepare('SELECT id, durum, tur, tutar FROM muhasebe WHERE id = ?').bind(m[1]).first();
    if (!k) return hata('Kayıt bulunamadı', 404);
    if (m[2] === 'sil') await db.prepare('DELETE FROM muhasebe WHERE id = ?').bind(k.id).run();
    else if (m[2] === 'odendi') {
      if (k.durum === 'odendi') return hata('Kayıt zaten ödendi olarak işaretli', 409);
      const odeme = kirp(govde.odeme_tarihi, 10) || bugunIst();
      if (!gecerliTarih(odeme)) return hata('Ödeme tarihi geçersiz', 422);
      await db.prepare("UPDATE muhasebe SET durum = 'odendi', odeme_tarihi = ? WHERE id = ?").bind(odeme, k.id).run();
    } else {
      if (k.durum === 'bekliyor') return hata('Kayıt zaten bekliyor', 409);
      await db.prepare("UPDATE muhasebe SET durum = 'bekliyor', odeme_tarihi = NULL WHERE id = ?").bind(k.id).run();
    }
    await islemYaz(db, kim.eposta, 'muhasebe_' + m[2], k.id, `${k.tur} ${k.tutar} kuruş`);
    return json({ ok: true });
  }
  return null;
}
