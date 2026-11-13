// Şablondan üretilen belgeler (12 Kas 2026): erişim talebi, ödeme hatırlatma, fiyat güncelleme, teslim tutanağı, sözleşme.
// · PDF tarayıcıda üretilir ve buraya yüklenir; müşteri kartının "Belgeler" bölümünde belge türü etiketiyle listelenir.
//   (Fiyat teklifi şablonu kendi yerinde, worker/teklif-dosya.js ucunda kalır.)
// · Dosyalar teklif dosyalarıyla aynı R2 deposunda (YEDEK bağlaması) "belge-dosyalari/<musteri_id>/<id>.pdf" anahtarıyla durur;
//   yedek temizliği yalnız "yedek/" önekine dokunur. Herkese açık adresi yoktur; yalnız yönetim oturumuyla açılır.
// · Yalnız PDF ("%PDF-" imzası), en fazla 20 MB. Bu modül e-posta ya da bildirim GÖNDERMEZ.
import { json, hata, simdi, kimlik, kirp, islemYaz, GUVENLIK_BASLIKLARI } from './ortak.js';
import { pdfImzasi, EN_BUYUK } from './teklif-dosya.js';
import { SABLON_TUR, sablonTohumla } from './belge-sablon.js';
import { vknDenetle } from '../src/scripts/yonetim/sablon-tanim.js';

export const BELGE_ONEK = 'belge-dosyalari/';
export const BELGE_NO_ONEK = { sozlesme: 'SZL', erisim: 'ERT', odeme_hatirlatma: 'OHT', teslim: 'TTN', fiyat_guncelleme: 'FGB' };
const ZARF_PAYI = 64 * 1024;
const DEPO_YOK = 'Dosya deposu (R2) bağlı değil; belge kaydedilemez ve açılamaz. Cloudflare panelinde YEDEK bağlamasını kontrol edin.';
const SUTUNLAR = 'd.id, d.musteri_id, d.sablon_id, d.sablon_surum, d.ad, d.belge_no, d.tarih, d.dosya_adi, d.boyut, d.taslak, d.olusturan, d.olusturma';
export const belgeAnahtari = (musteriId, id) => `${BELGE_ONEK}${musteriId}/${id}.pdf`;
const gecerliTarih = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(new Date(v + 'T00:00:00Z')) && new Date(v + 'T00:00:00Z').toISOString().slice(0, 10) === v;
const dosyaAdiTemiz = (ad) => kirp(String(ad || '').replace(/[\\/\u0000-\u001f\u007f"]/g, '_'), 160) || 'belge.pdf';

// Sıradaki belge numarası: ERT-2026-001 (yıl içinde şablon başına artar)
export async function siradakiNo(db, sablonId, tarih) {
  const onek = `${BELGE_NO_ONEK[sablonId] || 'BLG'}-${String(tarih || simdi()).slice(0, 4)}-`;
  const r = await db.prepare('SELECT belge_no FROM belge_dosyalari WHERE belge_no LIKE ?').bind(onek + '%').all();
  const enBuyuk = r.results.reduce((a, x) => Math.max(a, Number(String(x.belge_no).slice(onek.length)) || 0), 0);
  return onek + String(enBuyuk + 1).padStart(3, '0');
}

export async function belgeDosyasiYukle(istek, env, kim) {
  const db = env.DB;
  await sablonTohumla(db);
  if (!env.YEDEK) return hata(DEPO_YOK, 409);
  if (!(istek.headers.get('content-type') || '').toLowerCase().startsWith('multipart/form-data')) return hata('Dosya çok parçalı form olarak gönderilmeli', 415);
  if (Number(istek.headers.get('content-length') || 0) > EN_BUYUK + ZARF_PAYI) return hata('Dosya en fazla 20 MB olabilir', 413);
  const parcalar = []; let okunan = 0;
  try {
    const okuyucu = istek.body ? istek.body.getReader() : null;
    while (okuyucu) {
      const { done, value } = await okuyucu.read();
      if (done) break;
      okunan += value.byteLength;
      if (okunan > EN_BUYUK + ZARF_PAYI) { await okuyucu.cancel(); return hata('Dosya en fazla 20 MB olabilir', 413); }
      parcalar.push(value);
    }
  } catch (e) { return hata('Geçersiz istek', 400); }
  let f;
  try { f = await new Response(new Blob(parcalar), { headers: { 'content-type': istek.headers.get('content-type') } }).formData(); }
  catch (e) { return hata('Geçersiz istek', 400); }
  const dosya = f.get('dosya');
  if (!dosya || typeof dosya === 'string' || typeof dosya.arrayBuffer !== 'function') return hata('PDF dosyası gerekli', 422);
  if (!dosya.size) return hata('Dosya boş', 422);
  if (dosya.size > EN_BUYUK) return hata('Dosya en fazla 20 MB olabilir', 413);

  const musteriId = kirp(f.get('musteri_id'), 64);
  if (!/^[\w-]{1,64}$/.test(musteriId)) return hata('Müşteri seçilmedi', 422);
  const mus = await db.prepare('SELECT id FROM musteriler WHERE id = ?').bind(musteriId).first();
  if (!mus) return hata('Müşteri bulunamadı', 404);
  const sablonId = kirp(f.get('sablon_id'), 40);
  const sab = await db.prepare('SELECT id, ad, durum FROM belge_sablonlari WHERE id = ?').bind(sablonId).first();
  if (!sab || sablonId === 'teklif') return hata('Şablon geçersiz', 422);
  if (sab.durum === 'onerilen') return hata('Bu şablonun içeriği henüz yok', 409);
  const surum = Number(f.get('sablon_surum'));
  if (!Number.isInteger(surum) || surum < 1 || !(await db.prepare('SELECT 1 FROM belge_sablon_surumleri WHERE sablon_id = ? AND surum = ?').bind(sab.id, surum).first())) return hata('Şablon sürümü bulunamadı', 422);
  const ad = kirp(f.get('ad'), 200);
  if (!ad) return hata('Belge adı gerekli', 422);
  const tarih = kirp(f.get('tarih'), 10);
  if (!gecerliTarih(tarih)) return hata('Belge tarihi geçersiz', 422);
  let belgeNo = kirp(f.get('belge_no'), 40);
  if (belgeNo && !/^[\p{L}\p{N} ._/-]{1,40}$/u.test(belgeNo)) return hata('Belge numarası geçersiz', 422);
  // Veri asgarisi: müşteri vergi numarası yalnız şirket VKN'si (10 hane); TCKN (11 hane) reddedilir. Değer saklanmaz.
  const vknHata = vknDenetle(kirp(f.get('firma_vkn'), 40));
  if (vknHata) return hata(vknHata, 422);

  const bayt = new Uint8Array(await dosya.arrayBuffer());
  if (!pdfImzasi(bayt)) return hata('Dosya PDF değil', 415);
  const id = kimlik(), z = simdi(), anahtar = belgeAnahtari(mus.id, id), dosyaAdi = dosyaAdiTemiz(dosya.name);
  await env.YEDEK.put(anahtar, bayt, { httpMetadata: { contentType: 'application/pdf' }, customMetadata: { musteri_id: mus.id, sablon: sab.id, yukleyen: String(kim.eposta).slice(0, 120) } });
  const ekle = () => db.batch([
      db.prepare('INSERT INTO belge_dosyalari (id, musteri_id, sablon_id, sablon_surum, ad, belge_no, tarih, dosya_anahtari, dosya_adi, boyut, taslak, olusturan, olusturma) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(id, mus.id, sab.id, surum, ad, belgeNo || null, tarih, anahtar, dosyaAdi, bayt.byteLength, sab.durum === 'taslak' ? 1 : 0, kim.eposta, z),
      db.prepare('INSERT INTO kayitlar (id, musteri_id, zaman, tur, baslik, detay, kim) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .bind(kimlik(), mus.id, z, 'sistem', `Belge oluşturuldu: ${SABLON_TUR[sab.id] || sab.ad}`, `${ad}${belgeNo ? ' · ' + belgeNo : ''}${sab.durum === 'taslak' ? ' · TASLAK' : ''} · panel göndermedi`, kim.eposta),
      db.prepare('UPDATE musteriler SET guncelleme = ? WHERE id = ?').bind(z, mus.id)
    ]);
  try {
    try { await ekle(); }
    catch (e) {
      // Aynı numara bu arada kullanıldıysa (eşzamanlı kayıt) bir kez sıradaki numarayla denenir.
      if (!belgeNo || !/UNIQUE/i.test(String(e && e.message))) throw e;
      belgeNo = await siradakiNo(db, sab.id, tarih);
      await ekle();
    }
  } catch (e) { await env.YEDEK.delete(anahtar); throw e; }
  await islemYaz(db, kim.eposta, 'belge_sablondan', id, `${sab.ad} · ${ad} · ${Math.round(bayt.byteLength / 1024)} KB`);
  return json({ ok: true, id, belge_no: belgeNo || null });
}

export async function yonetimBelgeDosyaApi(db, env, yontem, yol, govde, kim) {
  if (!(yol === 'belge-dosyalari' || yol.startsWith('belge-dosyalari/'))) return null;
  let m = yol.match(/^belge-dosyalari\/musteri\/([\w-]{1,64})$/);
  if ((m || yol === 'belge-dosyalari') && yontem === 'GET') {
    const s = db.prepare(`SELECT ${SUTUNLAR}, m.firma, m.ad AS musteri_ad FROM belge_dosyalari d LEFT JOIN musteriler m ON m.id = d.musteri_id ${m ? 'WHERE d.musteri_id = ?' : ''} ORDER BY d.tarih DESC, d.olusturma DESC LIMIT 1000`);
    const r = await (m ? s.bind(m[1]) : s).all();
    return json({ ok: true, depo: !!env.YEDEK, belgeler: r.results.map((x) => ({ ...x, tur_adi: SABLON_TUR[x.sablon_id] || x.sablon_id })) });
  }
  m = yol.match(/^belge-dosyalari\/siradaki-no\/([\w-]{1,40})$/);
  if (m && yontem === 'GET') return json({ ok: true, belge_no: await siradakiNo(db, m[1], simdi()) });
  m = yol.match(/^belge-dosyalari\/([\w-]{1,64})\/dosya$/);
  if (m && yontem === 'GET') {
    const k = await db.prepare('SELECT id, dosya_anahtari, dosya_adi FROM belge_dosyalari WHERE id = ?').bind(m[1]).first();
    if (!k) return hata('Belge bulunamadı', 404);
    if (!env.YEDEK) return hata(DEPO_YOK, 409);
    const o = await env.YEDEK.get(k.dosya_anahtari);
    if (!o) return hata('Dosya depoda bulunamadı', 404);
    const ascii = (k.dosya_adi || 'belge.pdf').replace(/[^\x20-\x7e]/g, '_').replace(/["\\;]/g, '_');
    return new Response(o.body, { headers: { ...GUVENLIK_BASLIKLARI, 'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(k.dosya_adi || 'belge.pdf')}`,
      'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'private, no-store' } });
  }
  return hata('Bulunamadı', 404);
}
