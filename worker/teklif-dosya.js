// Teklif dosyaları (Muhittin, 11 Kas 2026): Canva'da hazırlanmış teklif PDF'leri müşteri kartına yüklenir.
// · Dosyalar yedekle aynı R2 deposunda (YEDEK bağlaması), "teklif-dosyalari/<musteri_id>/<id>.pdf" anahtarıyla durur.
//   Yedek temizliği (worker/yedek.js) yalnız "yedek/" önekini listeleyip sildiği için bu dosyalara dokunmaz.
// · Dosyanın herkese açık adresi yoktur; yalnız yönetim oturumuyla /api/yonetim/teklif-dosyalari/<id>/dosya üzerinden açılır.
// · Yalnız PDF kabul edilir: içerik "%PDF-" imzasıyla başlamalıdır (uzantıya ve MIME türüne güvenilmez); en fazla 20 MB.
// · Bu modül e-posta ya da bildirim GÖNDERMEZ. "Gönderildi" yalnız yöneticinin teklifi kendisi ilettiğini işaretlemesidir.
// · Aşama kuralı: "Teklif gönderildi" yalnız Yeni / Görüşülüyor aşamasındaki karta uygulanır (ileri aşama geri alınmaz);
//   "Kabul edildi" durumunda aşama "Kazanıldı" olur.
import { json, hata, simdi, kimlik, kirp, islemYaz, GUVENLIK_BASLIKLARI } from './ortak.js';
import { TEKLIF_DURUM } from './teklif.js';

export const ONEK = 'teklif-dosyalari/';
export const EN_BUYUK = 20 * 1024 * 1024; // 20 MB
const ZARF_PAYI = 64 * 1024; // çok parçalı gövdedeki alan ve sınır metinleri için pay
const TUTAR_SINIR_KURUS = 100000000000; // 1 milyar TL
const ASAMA_ADI = { yeni: 'Yeni', gorusme: 'Görüşülüyor', teklif: 'Teklif gönderildi', goruldu: 'Teklif görüldü', kazanildi: 'Kazanıldı', kaybedildi: 'Kaybedildi' };
const DEPO_YOK = 'Dosya deposu (R2) bağlı değil; teklif dosyası yüklenemez ve açılamaz. Cloudflare panelinde YEDEK bağlamasını kontrol edin.';

export const depoKurulu = (env) => !!(env && env.YEDEK);
export const dosyaAnahtari = (musteriId, id) => `${ONEK}${musteriId}/${id}.pdf`;

const SUTUNLAR = 'd.id, d.musteri_id, d.ad, d.tarih, d.gecerlilik, d.tutar_kurus, d.durum, d.dosya_adi, d.boyut, d.olusturan, d.olusturma, d.guncelleme, d.karar_zamani';

function gecerliTarih(v) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(v + 'T00:00:00Z');
  return !isNaN(d) && d.toISOString().slice(0, 10) === v;
}

// "45.000,00" · "45000" · "45000.5" → kuruş. Boşsa null; geçersizse NaN.
export function tutarKurus(v) {
  const s = typeof v === 'string' ? v.trim().replace(/\s|TL/gi, '') : v === undefined || v === null ? '' : String(v);
  if (!s) return null;
  let n;
  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(s) || /^\d+(,\d{1,2})?$/.test(s)) n = Number(s.replace(/\./g, '').replace(',', '.'));
  else if (/^\d+(\.\d{1,2})?$/.test(s)) n = Number(s);
  else return NaN;
  const k = Math.round(n * 100);
  return Number.isFinite(k) && k >= 0 && k <= TUTAR_SINIR_KURUS ? k : NaN;
}

// İlk 5 bayt "%PDF-" olmalı.
export function pdfImzasi(bayt) {
  const b = bayt instanceof Uint8Array ? bayt : new Uint8Array(bayt);
  return b.length >= 5 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46 && b[4] === 0x2d;
}

// Dosya adı yalnız gösterim içindir; yol karakterleri ve denetim karakterleri atılır.
const dosyaAdiTemiz = (ad) => kirp(String(ad || '').replace(/[\\/\u0000-\u001f\u007f"]/g, '_'), 160) || 'teklif.pdf';

const kayitSorgu = (db, musteriId, z, tur, baslik, detay, kim) =>
  db.prepare('INSERT INTO kayitlar (id, musteri_id, zaman, tur, baslik, detay, kim) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(kimlik(), musteriId, z, tur, baslik, detay, kim);

// Aşama değişikliği: geri alınmaz. Yeni aşamayı (ya da null) döner.
export function yeniAsama(mevcut, hedef) {
  if (hedef === 'teklif') return mevcut === 'yeni' || mevcut === 'gorusme' ? 'teklif' : null;
  if (hedef === 'kazanildi') return mevcut !== 'kazanildi' ? 'kazanildi' : null;
  return null;
}

const tlYaz = (k) => (k === null || k === undefined ? '—' : new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(k / 100) + ' TL');

// Günlük kaydı ve gerekiyorsa aşama değişikliği sorgularını hazırlar.
function gunlukSorgulari(db, mus, z, kim, baslik, detay, hedefAsama) {
  const s = [kayitSorgu(db, mus.id, z, 'teklif', baslik, detay, kim)];
  const ya = hedefAsama ? yeniAsama(mus.asama, hedefAsama) : null;
  if (ya) {
    s.push(db.prepare('UPDATE musteriler SET asama = ?, guncelleme = ? WHERE id = ?').bind(ya, z, mus.id));
    s.push(kayitSorgu(db, mus.id, z, 'sistem', 'Aşama değişti', `${ASAMA_ADI[mus.asama] || mus.asama} → ${ASAMA_ADI[ya]} (teklif dosyası)`, kim));
  } else {
    s.push(db.prepare('UPDATE musteriler SET guncelleme = ? WHERE id = ?').bind(z, mus.id));
  }
  return s;
}

// Çok parçalı yükleme. index.js bu ucu JSON gövdesi okunmadan önce (aynı kaynak denetiminden sonra) çağırır.
export async function teklifDosyasiYukle(istek, env, kim) {
  const db = env.DB;
  if (!depoKurulu(env)) return hata(DEPO_YOK, 409);
  if (!(istek.headers.get('content-type') || '').toLowerCase().startsWith('multipart/form-data')) return hata('Dosya çok parçalı form olarak gönderilmeli', 415);
  const boy = Number(istek.headers.get('content-length') || 0);
  if (boy > EN_BUYUK + ZARF_PAYI) return hata('Dosya en fazla 20 MB olabilir', 413);
  // Gövde sayılarak okunur: Content-Length gelmese (ör. HTTP/2) ya da yanlış olsa da sınır aşılınca okuma kesilir
  // (güvenlik incelemesi, 11 Kas 2026).
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
  if (!dosya || typeof dosya === 'string' || typeof dosya.arrayBuffer !== 'function') return hata('PDF dosyası seçin', 422);
  if (dosya.size > EN_BUYUK) return hata('Dosya en fazla 20 MB olabilir', 413);
  if (!dosya.size) return hata('Dosya boş', 422);

  const musteriId = kirp(f.get('musteri_id'), 64);
  if (!/^[\w-]{1,64}$/.test(musteriId)) return hata('Müşteri seçilmedi', 422);
  const mus = await db.prepare('SELECT id, asama FROM musteriler WHERE id = ?').bind(musteriId).first();
  if (!mus) return hata('Müşteri bulunamadı', 404);
  const ad = kirp(f.get('ad'), 200);
  if (!ad) return hata('Teklif adı gerekli', 422);
  const tarih = kirp(f.get('tarih'), 10);
  if (!gecerliTarih(tarih)) return hata('Teklif tarihi geçersiz', 422);
  const gecerlilik = kirp(f.get('gecerlilik'), 10);
  if (gecerlilik && !gecerliTarih(gecerlilik)) return hata('Geçerlilik tarihi geçersiz', 422);
  if (gecerlilik && gecerlilik < tarih) return hata('Geçerlilik tarihi teklif tarihinden önce olamaz', 422);
  const tutar = tutarKurus(f.get('tutar'));
  if (Number.isNaN(tutar)) return hata('Tutar geçersiz (ör. 45.000,00)', 422);
  const durum = kirp(f.get('durum'), 20) || 'gonderildi';
  if (!TEKLIF_DURUM[durum]) return hata('Durum geçersiz', 422);
  const asamaIste = durum !== 'taslak' && ['1', 'evet', 'true', 'on'].includes(kirp(f.get('asama'), 10));

  const bayt = new Uint8Array(await dosya.arrayBuffer());
  if (bayt.byteLength > EN_BUYUK) return hata('Dosya en fazla 20 MB olabilir', 413);
  if (!pdfImzasi(bayt)) return hata('Bu dosya PDF değil. Yalnız PDF yüklenebilir (Canva’da “PDF Standart” olarak indirin).', 415);

  const id = kimlik(), z = simdi(), anahtar = dosyaAnahtari(mus.id, id), dosyaAdi = dosyaAdiTemiz(dosya.name);
  await env.YEDEK.put(anahtar, bayt, { httpMetadata: { contentType: 'application/pdf' }, customMetadata: { musteri_id: mus.id, yukleyen: String(kim.eposta).slice(0, 120) } });
  try {
    const sorgular = [db.prepare(`INSERT INTO teklif_dosyalari (id, musteri_id, ad, tarih, gecerlilik, tutar_kurus, durum, dosya_anahtari, dosya_adi, boyut, olusturan, olusturma, guncelleme, karar_zamani)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(id, mus.id, ad, tarih, gecerlilik || null, tutar, durum, anahtar, dosyaAdi, bayt.byteLength, kim.eposta, z, z, durum === 'kabul' || durum === 'red' ? z : null)];
    // Günlük: kutu işaretliyse ya da teklif kabul edilmiş olarak yüklendiyse yazılır.
    const hedef = durum === 'kabul' ? 'kazanildi' : asamaIste ? 'teklif' : null;
    if (asamaIste || durum === 'kabul') {
      const baslik = durum === 'kabul' ? 'Teklif kabul edildi (dosya yüklendi)' : 'Teklif gönderildi (dosya yüklendi)';
      sorgular.push(...gunlukSorgulari(db, mus, z, kim.eposta, baslik, `${ad} · ${TEKLIF_DURUM[durum]} · Tutar ${tlYaz(tutar)} (KDV hariç) · ${dosyaAdi}`, hedef));
    }
    await db.batch(sorgular);
  } catch (e) {
    await env.YEDEK.delete(anahtar).catch(() => {});
    throw e;
  }
  await islemYaz(db, kim.eposta, 'teklif_dosyasi_yukle', id, `${ad} · ${dosyaAdi} · ${Math.round(bayt.byteLength / 1024)} KB`);
  return json({ ok: true, id });
}

export async function yonetimTeklifDosyaApi(db, env, yontem, yol, govde, kim) {
  if (!(yol === 'teklif-dosyalari' || yol.startsWith('teklif-dosyalari/'))) return null;

  // Liste: tümü ya da müşteriye göre
  const f = yol === 'teklif-dosyalari' ? [] : yol.match(/^teklif-dosyalari\/musteri\/([\w-]{1,64})$/);
  if (f && yontem === 'GET') {
    const s = db.prepare(`SELECT ${SUTUNLAR}, m.firma, m.ad AS musteri_ad FROM teklif_dosyalari d LEFT JOIN musteriler m ON m.id = d.musteri_id
      ${f.length ? 'WHERE d.musteri_id = ?' : ''} ORDER BY d.tarih DESC, d.olusturma DESC LIMIT 1000`);
    const r = await (f.length ? s.bind(f[1]) : s).all();
    return json({ ok: true, depo: depoKurulu(env), dosyalar: r.results });
  }

  // Aç / indir: oturum gerekir (index.js), dosya R2'den akıtılır. Tarayıcıda açılır (inline).
  let m = yol.match(/^teklif-dosyalari\/([\w-]{1,64})\/dosya$/);
  if (m && yontem === 'GET') {
    const k = await db.prepare('SELECT id, ad, dosya_anahtari, dosya_adi FROM teklif_dosyalari WHERE id = ?').bind(m[1]).first();
    if (!k) return hata('Teklif dosyası bulunamadı', 404);
    if (!depoKurulu(env)) return hata(DEPO_YOK, 409);
    const o = await env.YEDEK.get(k.dosya_anahtari);
    if (!o) return hata('Dosya depoda bulunamadı', 404);
    const ascii = (k.dosya_adi || 'teklif.pdf').replace(/[^\x20-\x7e]/g, '_').replace(/["\\;]/g, '_');
    return new Response(o.body, { headers: {
      ...GUVENLIK_BASLIKLARI,
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(k.dosya_adi || 'teklif.pdf')}`,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, no-store'
    } });
  }

  m = yol.match(/^teklif-dosyalari\/([\w-]{1,64})\/(durum|sil)$/);
  if (m && yontem === 'POST') {
    const k = await db.prepare('SELECT * FROM teklif_dosyalari WHERE id = ?').bind(m[1]).first();
    if (!k) return hata('Teklif dosyası bulunamadı', 404);
    const z = simdi();

    if (m[2] === 'sil') {
      // Taslak doğrudan silinir; gönderilmiş / sonuçlanmış teklif yalnız yöneticinin açık onayıyla (onay: true) silinir.
      if (k.durum !== 'taslak' && govde.onay !== true) return hata('Gönderilmiş ya da sonuçlanmış teklif yalnız açık onayla silinir', 409);
      if (depoKurulu(env)) await env.YEDEK.delete(k.dosya_anahtari);
      else if (k.dosya_anahtari) return hata(DEPO_YOK, 409);
      await db.prepare('DELETE FROM teklif_dosyalari WHERE id = ?').bind(k.id).run();
      await islemYaz(db, kim.eposta, 'teklif_dosyasi_sil', k.id, `${k.ad} · ${TEKLIF_DURUM[k.durum] || k.durum}`);
      return json({ ok: true });
    }

    const durum = kirp(govde.durum, 20);
    if (!TEKLIF_DURUM[durum]) return hata('Durum geçersiz', 422);
    if (durum === k.durum) return json({ ok: true, degisen: false });
    const r = await db.prepare('UPDATE teklif_dosyalari SET durum = ?, guncelleme = ?, karar_zamani = ? WHERE id = ? AND durum = ?')
      .bind(durum, z, durum === 'kabul' || durum === 'red' ? z : null, k.id, k.durum).run();
    if (!r.meta || !r.meta.changes) return hata('Teklif bu arada değişti; sayfayı yenileyin', 409);
    const mus = await db.prepare('SELECT id, asama FROM musteriler WHERE id = ?').bind(k.musteri_id).first();
    if (mus) {
      const baslik = { taslak: 'Teklif taslağa alındı', gonderildi: 'Teklif gönderildi olarak işaretlendi', kabul: 'Teklif kabul edildi', red: 'Teklif reddedildi' }[durum];
      const hedef = durum === 'kabul' ? 'kazanildi' : durum === 'gonderildi' ? 'teklif' : null;
      await db.batch(gunlukSorgulari(db, mus, z, kim.eposta, baslik, `${k.ad} · Tutar ${tlYaz(k.tutar_kurus)} (KDV hariç) · Canva PDF`, hedef));
    }
    await islemYaz(db, kim.eposta, 'teklif_dosyasi_durum', k.id, `${k.ad}: ${TEKLIF_DURUM[k.durum] || k.durum} → ${TEKLIF_DURUM[durum]}`);
    return json({ ok: true, degisen: true });
  }
  return hata('Bulunamadı', 404);
}
