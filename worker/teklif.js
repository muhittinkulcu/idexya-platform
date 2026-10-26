// Teklifler (Muhittin, 23 Eki 2026): CRM müşterisine kalem kalem fiyat teklifi hazırlanır, yazdırılır / PDF olarak kaydedilir.
// Bu uygulama e-posta GÖNDERMEZ: "Gönderildi" yalnızca yöneticinin teklifi kendisi ilettiğini işaretlemesidir.
// Tutarlar sunucuda kuruş (tam sayı) üzerinden hesaplanır; istemcinin gönderdiği toplamlar dikkate alınmaz.
// Durum akışı: taslak → gonderildi → kabul | red. Yalnız taslak düzenlenir ve silinir.
import { json, hata, simdi, kimlik, kirp, islemYaz } from './ortak.js';

export const TEKLIF_DURUM = { taslak: 'Taslak', gonderildi: 'Gönderildi', kabul: 'Kabul edildi', red: 'Reddedildi' };
const ASAMA_ADI = { yeni: 'Yeni', gorusme: 'Görüşülüyor', teklif: 'Teklif gönderildi', goruldu: 'Teklif görüldü', kazanildi: 'Kazanıldı', kaybedildi: 'Kaybedildi' };
const EN_FAZLA_KALEM = 50;
const BIRIM_SINIR = 10000000; // TL, tek kalemin birim fiyatı
const ADET_SINIR = 10000;
const TOPLAM_SINIR_KURUS = 100000000000; // 1 milyar TL (kuruş taşmasını önler)

const SUTUNLAR = 't.id, t.no, t.musteri_id, t.baslik, t.kdv_orani, t.indirim, t.para, t.gecerlilik, t.durum, t.ara_toplam, t.kdv, t.toplam, t.olusturma, t.guncelleme, t.gonderim_zamani, t.karar_zamani, t.olusturan';
const tl = (kurus) => new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(kurus / 100) + ' TL';

// Sayı: number ya da "1250,50" / "1250.50" gibi metin. Geçersizse NaN.
function sayi(v) {
  if (typeof v === 'number') return v;
  if (typeof v === 'string' && /^\s*\d+([.,]\d+)?\s*$/.test(v)) return Number(v.trim().replace(',', '.'));
  return NaN;
}

function gecerliTarih(v) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(v + 'T00:00:00Z');
  return !isNaN(d) && d.toISOString().slice(0, 10) === v;
}

// Gövdeyi doğrular ve tutarları hesaplar. { veri } ya da { hata } döner.
function dogrula(g) {
  const baslik = kirp(g.baslik, 160);
  if (!baslik) return { hata: 'Teklif başlığı gerekli' };
  if (!Array.isArray(g.kalemler) || !g.kalemler.length) return { hata: 'En az bir kalem ekleyin' };
  if (g.kalemler.length > EN_FAZLA_KALEM) return { hata: `Bir teklifte en fazla ${EN_FAZLA_KALEM} kalem olabilir` };
  const kalemler = [];
  let araKurus = 0;
  for (let i = 0; i < g.kalemler.length; i++) {
    const k = g.kalemler[i] || {}, sira = i + 1;
    const ad = kirp(k.ad, 200), aciklama = kirp(k.aciklama, 1000);
    if (!ad) return { hata: `${sira}. kalemin adı gerekli` };
    const adet = sayi(k.adet), birim = sayi(k.birim_fiyat);
    if (!Number.isFinite(adet) || adet <= 0 || adet > ADET_SINIR) return { hata: `${sira}. kalemin adedi 0'dan büyük ve en fazla ${ADET_SINIR} olmalı` };
    if (!Number.isFinite(birim) || birim < 0 || birim > BIRIM_SINIR) return { hata: `${sira}. kalemin birim fiyatı 0 ile ${new Intl.NumberFormat('tr-TR').format(BIRIM_SINIR)} TL arasında olmalı` };
    const adetYuz = Math.round(adet * 100), birimKurus = Math.round(birim * 100);
    if (adetYuz <= 0) return { hata: `${sira}. kalemin adedi en az 0,01 olmalı` };
    const tutarKurus = Math.round((adetYuz * birimKurus) / 100);
    araKurus += tutarKurus;
    kalemler.push({ ad, aciklama, adet: adetYuz / 100, birim_fiyat: birimKurus / 100, tutar: tutarKurus / 100 });
  }
  if (araKurus > TOPLAM_SINIR_KURUS) return { hata: 'Teklif toplamı çok büyük' };
  const oran = g.kdv_orani === undefined || g.kdv_orani === '' || g.kdv_orani === null ? 20 : sayi(g.kdv_orani);
  if (!Number.isFinite(oran) || oran < 0 || oran > 100) return { hata: 'KDV oranı 0 ile 100 arasında olmalı' };
  const indirim = g.indirim === undefined || g.indirim === '' || g.indirim === null ? 0 : sayi(g.indirim);
  if (!Number.isFinite(indirim) || indirim < 0) return { hata: 'İndirim 0 ya da daha büyük bir tutar olmalı' };
  const indirimKurus = Math.round(indirim * 100);
  if (indirimKurus > araKurus) return { hata: 'İndirim ara toplamdan büyük olamaz' };
  const oranYuz = Math.round(oran * 100);
  const matrah = araKurus - indirimKurus;
  const kdvKurus = Math.round((matrah * oranYuz) / 10000);
  const gecerlilik = kirp(g.gecerlilik, 10);
  if (gecerlilik && !gecerliTarih(gecerlilik)) return { hata: 'Geçerlilik tarihi geçersiz' };
  return { veri: {
    baslik, kalemler, kdv_orani: oranYuz / 100, indirim: indirimKurus / 100, gecerlilik: gecerlilik || null, notlar: kirp(g.notlar, 4000) || null,
    ara_toplam: araKurus / 100, kdv: kdvKurus / 100, toplam: (matrah + kdvKurus) / 100
  } };
}

// IDX-2026-0001: yıl İstanbul saatine göre; sayaç yıl başına artar, silinen taslağın numarası yeniden kullanılmaz.
async function yeniNo(db) {
  const yil = new Date(Date.now() + 3 * 3600000).getUTCFullYear();
  const r = await db.prepare('INSERT INTO teklif_sayac (yil, son) VALUES (?, 1) ON CONFLICT(yil) DO UPDATE SET son = son + 1 RETURNING son').bind(yil).first();
  return `IDX-${yil}-${String(r.son).padStart(4, '0')}`;
}

const kayitEkle = (db, musteriId, z, baslik, detay, kim) =>
  db.prepare('INSERT INTO kayitlar (id, musteri_id, zaman, tur, baslik, detay, kim) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(kimlik(), musteriId, z, 'teklif', baslik, detay, kim);

async function ekle(db, v, musteriId, kim) {
  const id = kimlik(), z = simdi();
  // Numara çakışırsa (sayaç dışında elle eklenmiş kayıt) bir sonraki numara denenir.
  for (let deneme = 0; deneme < 5; deneme++) {
    const no = await yeniNo(db);
    try {
      await db.prepare(`INSERT INTO teklifler (id, no, musteri_id, baslik, kalemler, kdv_orani, indirim, para, gecerlilik, notlar, durum, ara_toplam, kdv, toplam, olusturma, guncelleme, olusturan)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'TRY', ?, ?, 'taslak', ?, ?, ?, ?, ?, ?)`)
        .bind(id, no, musteriId, v.baslik, JSON.stringify(v.kalemler), v.kdv_orani, v.indirim, v.gecerlilik, v.notlar, v.ara_toplam, v.kdv, v.toplam, z, z, kim).run();
      return { id, no };
    } catch (e) {
      if (!/UNIQUE/i.test(String(e && e.message))) throw e;
    }
  }
  throw new Error('Teklif numarası alınamadı');
}

const musteriVar = (db, id) => (id ? db.prepare('SELECT id, asama FROM musteriler WHERE id = ?').bind(id).first() : null);

export async function yonetimTeklifApi(db, yontem, yol, govde, kim) {
  if (!(yol === 'teklifler' || yol.startsWith('teklifler/'))) return null;

  // Liste: tümü, duruma göre (teklifler/durum/taslak) ya da müşteriye göre (teklifler/musteri/<id>)
  const f = yol === 'teklifler' ? [] : yol.match(/^teklifler\/(durum|musteri)\/([\w-]+)$/);
  if (f && yontem === 'GET') {
    if (f[1] === 'durum' && !TEKLIF_DURUM[f[2]]) return hata('Geçersiz durum', 422);
    const kosul = !f.length ? '' : f[1] === 'durum' ? 'WHERE t.durum = ?' : 'WHERE t.musteri_id = ?';
    const s = db.prepare(`SELECT ${SUTUNLAR}, m.firma, m.ad FROM teklifler t LEFT JOIN musteriler m ON m.id = t.musteri_id ${kosul} ORDER BY t.guncelleme DESC LIMIT 1000`);
    const r = await (f.length ? s.bind(f[2]) : s).all();
    return json({ ok: true, teklifler: r.results });
  }

  if (yol === 'teklifler' && yontem === 'POST') {
    const mus = await musteriVar(db, kirp(govde.musteri_id, 64));
    if (!mus) return hata('Müşteri seçin (CRM’de kayıtlı olmalı)', 422);
    const { veri, hata: h } = dogrula(govde);
    if (h) return hata(h, 422);
    const { id, no } = await ekle(db, veri, mus.id, kim.eposta);
    await islemYaz(db, kim.eposta, 'teklif_olustur', id, no);
    return json({ ok: true, id, no });
  }

  let m = yol.match(/^teklifler\/([\w-]+)$/);
  if (m && yontem === 'GET') {
    const t = await db.prepare(`SELECT ${SUTUNLAR}, t.kalemler, t.notlar FROM teklifler t WHERE t.id = ?`).bind(m[1]).first();
    if (!t) return hata('Teklif bulunamadı', 404);
    t.kalemler = JSON.parse(t.kalemler || '[]');
    const mus = await db.prepare('SELECT id, firma, ad, eposta, telefon, asama FROM musteriler WHERE id = ?').bind(t.musteri_id).first();
    const gelir = await db.prepare("SELECT id, durum, vade, odeme_tarihi, tutar FROM muhasebe WHERE tur = 'gelir' AND belge_no = ? LIMIT 1").bind(t.no).first();
    return json({ ok: true, teklif: t, musteri: mus || null, gelir: gelir || null });
  }

  // Güncelleme: yalnız taslak
  if (m && yontem === 'POST') {
    const t = await db.prepare('SELECT id, no, durum, musteri_id FROM teklifler WHERE id = ?').bind(m[1]).first();
    if (!t) return hata('Teklif bulunamadı', 404);
    if (t.durum !== 'taslak') return hata('Yalnız taslak teklif düzenlenebilir; gerekirse kopyalayıp yeni taslak açın', 409);
    const mus = await musteriVar(db, govde.musteri_id === undefined ? t.musteri_id : kirp(govde.musteri_id, 64));
    if (!mus) return hata('Müşteri seçin (CRM’de kayıtlı olmalı)', 422);
    const { veri, hata: h } = dogrula(govde);
    if (h) return hata(h, 422);
    const r = await db.prepare(`UPDATE teklifler SET musteri_id = ?, baslik = ?, kalemler = ?, kdv_orani = ?, indirim = ?, gecerlilik = ?, notlar = ?, ara_toplam = ?, kdv = ?, toplam = ?, guncelleme = ?
      WHERE id = ? AND durum = 'taslak'`).bind(mus.id, veri.baslik, JSON.stringify(veri.kalemler), veri.kdv_orani, veri.indirim, veri.gecerlilik, veri.notlar, veri.ara_toplam, veri.kdv, veri.toplam, simdi(), t.id).run();
    if (!r.meta || !r.meta.changes) return hata('Teklif bu arada değişti; sayfayı yenileyin', 409);
    await islemYaz(db, kim.eposta, 'teklif_guncelle', t.id, t.no);
    return json({ ok: true, id: t.id });
  }

  // Kabul edilen tekliften gelir (alacak) kaydı: muhasebede belge_no = teklif no. Aynı teklif için ikinci kayıt açılmaz.
  m = yol.match(/^teklifler\/([\w-]+)\/gelir$/);
  if (m && yontem === 'POST') {
    const t = await db.prepare('SELECT * FROM teklifler WHERE id = ?').bind(m[1]).first();
    if (!t) return hata('Teklif bulunamadı', 404);
    if (t.durum !== 'kabul') return hata('Gelir kaydı yalnız kabul edilen tekliften oluşturulur', 409);
    const var_ = await db.prepare("SELECT id FROM muhasebe WHERE tur = 'gelir' AND belge_no = ? LIMIT 1").bind(t.no).first();
    if (var_) return hata('Bu teklif için gelir kaydı zaten var', 409);
    const bugun = new Date(Date.now() + 3 * 3600000).toISOString().slice(0, 10);
    const vade = kirp(govde.vade, 10);
    if (vade && (!gecerliTarih(vade) || vade < bugun)) return hata('Vade bugün ya da sonrası geçerli bir tarih olmalı', 422);
    const tutar = Math.round(t.toplam * 100);
    if (!(tutar > 0)) return hata('Teklif toplamı sıfır; gelir kaydı oluşturulamaz', 422);
    const id = kimlik(), z = simdi();
    await db.prepare(`INSERT INTO muhasebe (id, tur, tarih, tutar, kdv_orani, aciklama, kategori, musteri_id, belge_no, durum, vade, odeme_tarihi, olusturma, ekleyen)
      VALUES (?, 'gelir', ?, ?, ?, ?, 'Hizmet geliri', ?, ?, 'bekliyor', ?, NULL, ?, ?)`)
      .bind(id, bugun, tutar, Math.round(t.kdv_orani), kirp(`${t.no} · ${t.baslik}`, 300), t.musteri_id, t.no, vade || null, z, kim.eposta).run();
    await islemYaz(db, kim.eposta, 'teklif_gelir', t.id, `${t.no} → gelir kaydı ${tl(tutar)}${vade ? ' · vade ' + vade : ''}`);
    return json({ ok: true, id });
  }

  m = yol.match(/^teklifler\/([\w-]+)\/(gonderildi|kabul|red|kopyala|sil)$/);
  if (m && yontem === 'POST') {
    const t = await db.prepare('SELECT * FROM teklifler WHERE id = ?').bind(m[1]).first();
    if (!t) return hata('Teklif bulunamadı', 404);
    const ne = m[2], z = simdi();

    if (ne === 'kopyala') {
      const mus = await musteriVar(db, t.musteri_id);
      if (!mus) return hata('Teklifin müşterisi CRM’de bulunamadı', 422);
      const bugun = new Date(Date.now() + 3 * 3600000).toISOString().slice(0, 10);
      const { veri, hata: h } = dogrula({ ...t, kalemler: JSON.parse(t.kalemler || '[]'), gecerlilik: t.gecerlilik && t.gecerlilik >= bugun ? t.gecerlilik : '' });
      if (h) return hata(h, 422);
      const { id, no } = await ekle(db, veri, mus.id, kim.eposta);
      await islemYaz(db, kim.eposta, 'teklif_kopyala', id, `${t.no} → ${no}`);
      return json({ ok: true, id, no });
    }

    if (ne === 'sil') {
      if (t.durum !== 'taslak') return hata('Yalnız taslak teklif silinebilir', 409);
      const r = await db.prepare("DELETE FROM teklifler WHERE id = ? AND durum = 'taslak'").bind(t.id).run();
      if (!r.meta || !r.meta.changes) return hata('Teklif bu arada değişti; sayfayı yenileyin', 409);
      await islemYaz(db, kim.eposta, 'teklif_sil', t.id, t.no);
      return json({ ok: true });
    }

    const GECIS = { gonderildi: 'taslak', kabul: 'gonderildi', red: 'gonderildi' };
    if (t.durum !== GECIS[ne]) return hata(`Bu teklif “${TEKLIF_DURUM[t.durum] || t.durum}” durumunda; bu işlem yapılamaz`, 409);
    const zamanAlan = ne === 'gonderildi' ? 'gonderim_zamani' : 'karar_zamani';
    const r = await db.prepare(`UPDATE teklifler SET durum = ?, ${zamanAlan} = ?, guncelleme = ? WHERE id = ? AND durum = ?`).bind(ne, z, z, t.id, GECIS[ne]).run();
    if (!r.meta || !r.meta.changes) return hata('Teklif bu arada değişti; sayfayı yenileyin', 409);

    // Müşteri günlüğü ve aşama
    const mus = await musteriVar(db, t.musteri_id);
    if (mus) {
      const detay = `${t.no} · ${t.baslik} · Toplam ${tl(Math.round(t.toplam * 100))} (KDV dahil)`;
      const baslik = { gonderildi: 'Teklif gönderildi olarak işaretlendi', kabul: 'Teklif kabul edildi', red: 'Teklif reddedildi' }[ne];
      const sorgular = [kayitEkle(db, mus.id, z, baslik, detay, kim.eposta)];
      let yeniAsama = null;
      if (ne === 'gonderildi' && (mus.asama === 'yeni' || mus.asama === 'gorusme')) yeniAsama = 'teklif';
      if (ne === 'kabul' && mus.asama !== 'kazanildi') yeniAsama = 'kazanildi';
      if (yeniAsama) {
        sorgular.push(db.prepare('UPDATE musteriler SET asama = ?, guncelleme = ? WHERE id = ?').bind(yeniAsama, z, mus.id));
        sorgular.push(db.prepare('INSERT INTO kayitlar (id, musteri_id, zaman, tur, baslik, detay, kim) VALUES (?, ?, ?, ?, ?, ?, ?)')
          .bind(kimlik(), mus.id, z, 'sistem', 'Aşama değişti', `${ASAMA_ADI[mus.asama] || mus.asama} → ${ASAMA_ADI[yeniAsama]} (teklif ${t.no})`, kim.eposta));
      } else {
        sorgular.push(db.prepare('UPDATE musteriler SET guncelleme = ? WHERE id = ?').bind(z, mus.id));
      }
      await db.batch(sorgular);
    }
    await islemYaz(db, kim.eposta, 'teklif_' + ne, t.id, t.no);
    return json({ ok: true });
  }
  return hata('Bulunamadı', 404);
}
