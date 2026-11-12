// Belge şablonları ve hizmet kataloğu (Muhittin, 11 Kas 2026): teklif gibi belgeler panelde şablondan üretilir.
// · Şablon = sayfa listesi (sürümlü). Her kayıt yeni sürüm yazar; eski sürümler silinmez (eski belgeler kendi sürümünü korur).
// · Sayfa tipleri: sabit (yalnız görsel), kapak (görsel + firma adı ve tarih), hizmetler (görsel + seçilen hizmetler),
//   kalemler (görsel + fiyat satırları), metin (antetli A4; sade biçimli metin, değişkenler doldurulur, taşan metin sonraki
//   sayfaya akar; biçim kuralları src/scripts/yonetim/sablon-metin.js). Sayfanın "kosul" alanı (ör. ton=2, ek_1b=evet)
//   sayfayı yalnız o seçimde belgeye katar.
// · Durum: hazir (kullanılır), taslak (kullanılır ama PDF'in her sayfası "TASLAK" damgası taşır; ör. avukat incelemesi
//   bekleyen sözleşme), onerilen (yalnız kart; içeriği yok). Sürüm kaydı durumu değiştirmez; taslak → hazır elle yapılır. Değişken alanların yeri sayfanın "alanlar" bilgisinde (1654 × 2339 piksel ölçeğinde).
// · Varsayılan sayfa görselleri derlemeyle gelir (/yonetim/veri/sablon/…; yalnız yönetim oturumuyla açılır).
//   Panelden değiştirilen görsel R2'de (YEDEK bağlaması) "sablon/<sablon_id>/<sürüm>/<sayfa>.jpg" anahtarıyla durur.
//   Yedek temizliği (worker/yedek.js) yalnız "yedek/" önekine dokunur.
// · PDF tarayıcıda üretilir ve teklif dosyası olarak (kaynak = sablon) worker/teklif-dosya.js ucuna yüklenir.
// · Bu modül e-posta ya da bildirim GÖNDERMEZ.
import { json, hata, simdi, kimlik, kirp, islemYaz, GUVENLIK_BASLIKLARI } from './ortak.js';
import { tutarKurus } from './teklif-dosya.js';
import { SABLON_ICERIK } from './sablon-icerik.js';

export const SABLON_TUR = { teklif: 'Fiyat teklifi', sozlesme: 'Hizmet sözleşmesi', erisim: 'Başlangıç ve erişim talebi', odeme_hatirlatma: 'Ödeme hatırlatma yazısı', teslim: 'Teslim ve iş tamamlama tutanağı', fiyat_guncelleme: 'Fiyat güncelleme bildirimi',
  // Araştırmanın önerdiği ek şablonlar: yalnız "önerilen" kart, içerik yok (12 Kas 2026)
  brief: 'İş emri ve brief formu', ek_is: 'Ek iş ve kapsam değişikliği talebi', icerik_onay: 'İçerik onay formu', hesap_devir: 'Hesap devir ve ayrılış tutanağı', gizlilik: 'Gizlilik sözleşmesi', rapor_kapagi: 'Aylık performans raporu kapağı' };
export const SAYFA_TIP = { sabit: 'Sabit görsel', kapak: 'Kapak', hizmetler: 'Hizmet listesi', kalemler: 'Fiyat tablosu', metin: 'Metin sayfası' };
export const SABLON_DURUM = { hazir: 'Hazır', taslak: 'Taslak', onerilen: 'Önerilen' };
export const METIN_SINIR = 30000;
const KOSUL_DESEN = /^[a-z0-9_]{1,40}(!=|=)[a-z0-9_,]{0,100}$/;
export const HIZMET_TUR = { aylik: 'Aylık', tek_seferlik: 'Tek seferlik' };
export const SIMGELER = ['google', 'meta', 'genel'];
export const GORSEL_ONEK = 'sablon/';
export const GORSEL_EN_BUYUK = 8 * 1024 * 1024; // 8 MB
const ZARF_PAYI = 64 * 1024;
const DEPO_YOK = 'Dosya deposu (R2) bağlı değil; sayfa görseli değiştirilemez. Cloudflare panelinde YEDEK bağlamasını kontrol edin.';
const VARSAYILAN_YOL = /^\/yonetim\/veri\/sablon\/[a-z0-9-]{1,40}\/[a-z0-9-]{1,40}\.jpg$/;

export const gorselAnahtari = (sablonId, surum, sayfa) => `${GORSEL_ONEK}${sablonId}/${surum}/${sayfa}.jpg`;

// Teklif şablonu sürüm 1: Muhittin'in Canva teklifinden temizlenmiş 7 sayfa. Ölçüler özgün PDF'ten (1654 × 2339) alındı.
const V = (n) => `/yonetim/veri/sablon/teklif/sayfa-${n}.jpg`;
export const TEKLIF_V1 = [
  { tip: 'kapak', ad: 'Kapak', gorsel: V(1), metinler: { baslik: '{FIRMA} - PROJE TEKLİFİ' },
    alanlar: { baslik: { x: 82, y: 2049, boyut: 33 }, tarih: { x: 80, y: 2218, boyut: 31 } } },
  { tip: 'sabit', ad: 'Neler yapıyoruz?', gorsel: V(2), metinler: {}, alanlar: {} },
  { tip: 'sabit', ad: 'Hizmetler (1)', gorsel: V(3), metinler: {}, alanlar: {} },
  { tip: 'sabit', ad: 'Hizmetler (2)', gorsel: V(4), metinler: {}, alanlar: {} },
  { tip: 'hizmetler', ad: 'Proje hakkında', gorsel: V(5), metinler: {},
    alanlar: { liste: { x: 85, y: 1172, boyut: 54, alt: 2150 } } },
  { tip: 'kalemler', ad: 'Fiyat teklifi', gorsel: V(6), metinler: { aylik_isaret: '**', tek_isaret: '*' },
    alanlar: { liste: { x: 83, y: 1268, boyut: 55, alt: 2050 } } },
  { tip: 'sabit', ad: 'Teşekkür ederiz', gorsel: V(7), metinler: {}, alanlar: {} }
];
// Hizmet kataloğu tohumu: Muhittin'in muhasebe ürün listesi (11 Kas 2026). Fiyat kuruş, KDV hariç; bilinmiyorsa null.
export const TOHUM_HIZMET = [
  ['google-reklam', 'Google Reklam Yönetimi', 'aylik', 2000000, 'google'],
  ['meta-reklam', 'Meta Reklam Yönetimi', 'aylik', 2000000, 'meta'],
  ['seo', 'SEO Yönetimi', 'aylik', null, 'genel'],
  ['sosyal-medya', 'Sosyal Medya İçerik Yönetimi', 'aylik', null, 'genel'],
  ['pazaryeri', 'Online Pazaryeri Yönetimi', 'aylik', null, 'genel'],
  ['kurumsal-web', 'Kurumsal Website Tasarımı', 'tek_seferlik', null, 'genel'],
  ['e-ticaret-web', 'E-Ticaret Website Tasarımı', 'tek_seferlik', null, 'genel'],
  ['web-yazilim', 'Web Sitesi Programlama ve Yazılım Bedeli', 'tek_seferlik', null, 'genel']
];

// Tohum: şablonlar yalnız eksikse eklenir (INSERT OR IGNORE). Hizmet kataloğu yalnız tablo tamamen boşken yazılır;
// panelde eklenen, düzenlenen ya da pasife alınan hizmet bir daha ezilmez ve eksik tohum geri gelmez.
let tohumHazir = false;
export async function sablonTohumla(db) {
  if (tohumHazir) return;
  const z = '2026-11-11T00:00:00.000Z';
  const s = Object.entries(SABLON_TUR).map(([tur, ad]) => db.prepare('INSERT OR IGNORE INTO belge_sablonlari (id, tur, ad, durum, aktif_surum, olusturma, guncelleme) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(tur, tur, ad, tur === 'teklif' ? 'hazir' : 'onerilen', tur === 'teklif' ? 1 : null, SABLON_ICERIK[tur] || tur === 'teklif' ? z : '2026-11-12T00:00:00.000Z', z));
  s.push(db.prepare('INSERT OR IGNORE INTO belge_sablon_surumleri (sablon_id, surum, sayfalar, olusturan, olusturma) VALUES (?, 1, ?, ?, ?)').bind('teklif', JSON.stringify(TEKLIF_V1), 'sistem', z));
  // Metin şablonları (12 Kas 2026): önerilen durumdaki ve sürümü olmayan şablona ilk sürüm yazılır; elle değiştirilmiş şablona dokunulmaz.
  for (const [id, { durum, sayfalar }] of Object.entries(SABLON_ICERIK)) {
    s.push(db.prepare("INSERT INTO belge_sablon_surumleri (sablon_id, surum, sayfalar, olusturan, olusturma) SELECT ?, 1, ?, 'sistem', ? WHERE NOT EXISTS (SELECT 1 FROM belge_sablon_surumleri WHERE sablon_id = ?)")
      .bind(id, JSON.stringify(sayfalar), '2026-11-12T00:00:00.000Z', id));
    s.push(db.prepare("UPDATE belge_sablonlari SET durum = ?, aktif_surum = 1, guncelleme = ? WHERE id = ? AND durum = 'onerilen' AND aktif_surum IS NULL").bind(durum, '2026-11-12T00:00:00.000Z', id));
  }
  const say = await db.prepare('SELECT COUNT(*) AS n FROM hizmet_katalogu').first();
  if (!say || !say.n) TOHUM_HIZMET.forEach(([id, ad, tur, fiyat, simge], i) => s.push(db.prepare('INSERT OR IGNORE INTO hizmet_katalogu (id, ad, tur, varsayilan_fiyat_kurus, simge, sira, aktif, olusturma, guncelleme) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)')
    .bind(id, ad, tur, fiyat, simge, (i + 1) * 10, z, z)));
  await db.batch(s);
  tohumHazir = true;
}

// İlk baytlar: JPEG FF D8 FF, PNG 89 50 4E 47 0D 0A 1A 0A. Uzantıya ve MIME türüne güvenilmez.
export function gorselTuru(bayt) {
  const b = bayt instanceof Uint8Array ? bayt : new Uint8Array(bayt);
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpg';
  if (b.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((x, i) => b[i] === x)) return 'png';
  return null;
}

// Görsel boyutu (genişlik × yükseklik): PNG IHDR ya da JPEG SOF bölümünden. Okunamazsa null.
export function gorselBoyutu(bayt) {
  const b = bayt instanceof Uint8Array ? bayt : new Uint8Array(bayt);
  const tur = gorselTuru(b);
  if (tur === 'png') return b.length >= 24 ? { en: (b[16] << 24 | b[17] << 16 | b[18] << 8 | b[19]) >>> 0, boy: (b[20] << 24 | b[21] << 16 | b[22] << 8 | b[23]) >>> 0 } : null;
  if (tur !== 'jpg') return null;
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) { i++; continue; }
    const m = b[i + 1];
    if (m === 0xff) { i++; continue; }
    if (m === 0xd8 || m === 0x01 || (m >= 0xd0 && m <= 0xd7)) { i += 2; continue; }
    const uz = (b[i + 2] << 8) | b[i + 3];
    if ((m >= 0xc0 && m <= 0xcf) && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { boy: (b[i + 5] << 8) | b[i + 6], en: (b[i + 7] << 8) | b[i + 8] };
    i += 2 + uz;
  }
  return null;
}

// Sayfa listesini denetler ve temizlenmiş kopyasını döner; hata varsa { hata } döner.
export function sayfalariDenetle(sayfalar, sablonId) {
  if (!Array.isArray(sayfalar) || !sayfalar.length || sayfalar.length > 20) return { hata: 'Şablonda 1 ile 20 arasında sayfa olmalı' };
  const temiz = [];
  for (const [i, s] of sayfalar.entries()) {
    const no = i + 1;
    if (!s || typeof s !== 'object' || Array.isArray(s)) return { hata: `${no}. sayfa geçersiz` };
    if (!SAYFA_TIP[s.tip]) return { hata: `${no}. sayfanın tipi geçersiz` };
    const ad = kirp(s.ad, 80);
    if (!ad) return { hata: `${no}. sayfanın adı gerekli` };
    const g = s.tip === 'metin' ? '' : String(s.gorsel || '');
    const r2 = g.match(/^sablon\/([\w-]{1,40})\/(\d{1,4})\/(\d{1,2})\.jpg$/);
    if (s.tip !== 'metin' && !VARSAYILAN_YOL.test(g) && !(r2 && r2[1] === sablonId)) return { hata: `${no}. sayfanın görseli geçersiz` };
    let metin;
    if (s.tip === 'metin') {
      if (typeof s.metin !== 'string' || s.metin.length > METIN_SINIR) return { hata: `${no}. sayfanın metni geçersiz (en çok ${METIN_SINIR} karakter)` };
      // Metin hiçbir yerde HTML olarak yorumlanmaz (canvas'a düz yazı olarak çizilir); denetim karakterleri yine de atılır.
      metin = s.metin.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000b-\u001f\u007f\u202a-\u202e\u2066-\u2069]/g, '');
    }
    const kosul = s.kosul === undefined || s.kosul === null || s.kosul === '' ? '' : String(s.kosul);
    if (kosul && !KOSUL_DESEN.test(kosul)) return { hata: `${no}. sayfanın koşulu geçersiz (ör. ton=2)` };
    const metinler = {};
    const m = s.metinler && typeof s.metinler === 'object' && !Array.isArray(s.metinler) ? s.metinler : {};
    if (Object.keys(m).length > 10) return { hata: `${no}. sayfada en çok 10 metin olabilir` };
    for (const [k, v] of Object.entries(m)) {
      if (!/^[a-z_]{1,30}$/.test(k) || typeof v !== 'string' || v.length > 300) return { hata: `${no}. sayfadaki metin geçersiz` };
      metinler[k] = v.replace(/[\u0000-\u001f\u007f]/g, ' ');
    }
    const alanlar = {};
    const a = s.alanlar && typeof s.alanlar === 'object' && !Array.isArray(s.alanlar) ? s.alanlar : {};
    if (Object.keys(a).length > 10) return { hata: `${no}. sayfada en çok 10 alan olabilir` };
    for (const [k, v] of Object.entries(a)) {
      if (!/^[a-z_]{1,30}$/.test(k) || !v || typeof v !== 'object') return { hata: `${no}. sayfadaki alan geçersiz` };
      const o = {};
      for (const [ak, sinir] of [['x', 1654], ['y', 2339], ['boyut', 300], ['alt', 2339]]) {
        if (v[ak] === undefined) continue;
        const n = Number(v[ak]);
        if (!Number.isFinite(n) || n < 0 || n > sinir) return { hata: `${no}. sayfadaki alan ölçüsü geçersiz` };
        o[ak] = Math.round(n * 10) / 10;
      }
      alanlar[k] = o;
    }
    temiz.push({ tip: s.tip, ad, gorsel: g, metinler, alanlar, ...(metin !== undefined ? { metin } : {}), ...(kosul ? { kosul } : {}) });
  }
  return { sayfalar: temiz };
}

function hizmetDenetle(g, mevcut) {
  const d = {};
  if (g.ad !== undefined || !mevcut) { d.ad = kirp(g.ad, 120); if (!d.ad) return { hata: 'Hizmet adı gerekli' }; }
  if (g.tur !== undefined || !mevcut) { d.tur = g.tur === undefined ? 'aylik' : g.tur; if (!HIZMET_TUR[d.tur]) return { hata: 'Hizmet türü geçersiz (aylık ya da tek seferlik)' }; }
  if (g.fiyat !== undefined) { const k = tutarKurus(g.fiyat); if (Number.isNaN(k)) return { hata: 'Fiyat geçersiz (ör. 20.000,00)' }; d.varsayilan_fiyat_kurus = k; }
  if (g.simge !== undefined || !mevcut) { d.simge = g.simge === undefined ? 'genel' : g.simge; if (!SIMGELER.includes(d.simge)) return { hata: 'Simge geçersiz' }; }
  if (g.sira !== undefined) { const n = Number(g.sira); if (!Number.isInteger(n) || n < 0 || n > 100000) return { hata: 'Sıra geçersiz' }; d.sira = n; }
  if (g.aktif !== undefined) { if (typeof g.aktif !== 'boolean') return { hata: 'Aktiflik geçersiz' }; d.aktif = g.aktif ? 1 : 0; }
  return { d };
}

// Çok parçalı görsel yükleme: index.js JSON gövdesi okunmadan önce (aynı kaynak denetiminden sonra) çağırır.
export async function sablonGorselYukle(istek, env, kim, sablonId) {
  const db = env.DB;
  await sablonTohumla(db);
  if (!env.YEDEK) return hata(DEPO_YOK, 409);
  const sab = await db.prepare('SELECT id, ad, durum FROM belge_sablonlari WHERE id = ?').bind(sablonId).first();
  if (!sab) return hata('Şablon bulunamadı', 404);
  if (sab.durum === 'onerilen') return hata('Bu şablonun düzenleyicisi henüz yok', 409);
  if (!(istek.headers.get('content-type') || '').toLowerCase().startsWith('multipart/form-data')) return hata('Görsel çok parçalı form olarak gönderilmeli', 415);
  if (Number(istek.headers.get('content-length') || 0) > GORSEL_EN_BUYUK + ZARF_PAYI) return hata('Görsel en fazla 8 MB olabilir', 413);
  const parcalar = []; let okunan = 0;
  try {
    const okuyucu = istek.body ? istek.body.getReader() : null;
    while (okuyucu) {
      const { done, value } = await okuyucu.read();
      if (done) break;
      okunan += value.byteLength;
      if (okunan > GORSEL_EN_BUYUK + ZARF_PAYI) { await okuyucu.cancel(); return hata('Görsel en fazla 8 MB olabilir', 413); }
      parcalar.push(value);
    }
  } catch (e) { return hata('Geçersiz istek', 400); }
  let f;
  try { f = await new Response(new Blob(parcalar), { headers: { 'content-type': istek.headers.get('content-type') } }).formData(); }
  catch (e) { return hata('Geçersiz istek', 400); }
  const dosya = f.get('dosya');
  if (!dosya || typeof dosya === 'string' || typeof dosya.arrayBuffer !== 'function') return hata('Görsel seçin', 422);
  if (!dosya.size) return hata('Dosya boş', 422);
  if (dosya.size > GORSEL_EN_BUYUK) return hata('Görsel en fazla 8 MB olabilir', 413);
  const sayfa = Number(f.get('sayfa'));
  if (!Number.isInteger(sayfa) || sayfa < 1 || sayfa > 20) return hata('Sayfa numarası geçersiz', 422);
  const bayt = new Uint8Array(await dosya.arrayBuffer());
  const tur = gorselTuru(bayt);
  if (!tur) return hata('Bu dosya JPG ya da PNG değil. Sayfa görseli JPG ya da PNG olmalı (Canva’da sayfayı “JPG” olarak indirin).', 415);
  const boy = gorselBoyutu(bayt);
  if (!boy || !boy.en || !boy.boy) return hata('Görselin boyutu okunamadı', 422);
  const oran = boy.boy / boy.en;
  if (boy.en > 4000) return hata(`Görsel en fazla 4000 piksel genişlikte olabilir; yüklenen ${boy.en} × ${boy.boy}`, 422);
  if (oran < 1.36 || oran > 1.48 || boy.en < 800) return hata(`Görsel dikey A4 olmalı (ör. 1654 × 2339 piksel); yüklenen ${boy.en} × ${boy.boy}`, 422);
  // Görsel henüz kaydedilmemiş sonraki sürüme yazılır; "Kaydet" bu anahtarla yeni sürümü oluşturur.
  const son = await db.prepare('SELECT MAX(surum) AS n FROM belge_sablon_surumleri WHERE sablon_id = ?').bind(sab.id).first();
  const surum = (son && son.n ? son.n : 0) + 1;
  const anahtar = gorselAnahtari(sab.id, surum, sayfa);
  await env.YEDEK.put(anahtar, bayt, { httpMetadata: { contentType: tur === 'png' ? 'image/png' : 'image/jpeg' }, customMetadata: { sablon_id: sab.id, yukleyen: String(kim.eposta).slice(0, 120) } });
  await islemYaz(db, kim.eposta, 'sablon_gorsel_yukle', anahtar, `${sab.ad} · ${sayfa}. sayfa · ${boy.en} × ${boy.boy} · ${Math.round(bayt.byteLength / 1024)} KB`);
  return json({ ok: true, anahtar, surum, sayfa, en: boy.en, boy: boy.boy, tur });
}

export async function yonetimBelgeSablonApi(db, env, yontem, yol, govde, kim) {
  if (!(yol === 'belge-sablonlari' || yol.startsWith('belge-sablonlari/') || yol === 'hizmet-katalogu' || yol.startsWith('hizmet-katalogu/'))) return null;
  await sablonTohumla(db);
  const z = simdi();

  // --- Hizmet kataloğu ---
  if (yol === 'hizmet-katalogu' && yontem === 'GET') {
    const r = await db.prepare('SELECT id, ad, tur, varsayilan_fiyat_kurus, simge, sira, aktif, guncelleme FROM hizmet_katalogu ORDER BY aktif DESC, sira, ad LIMIT 500').all();
    return json({ ok: true, hizmetler: r.results });
  }
  if (yol === 'hizmet-katalogu' && yontem === 'POST') {
    const { d, hata: h } = hizmetDenetle(govde, null);
    if (h) return hata(h, 422);
    const id = kimlik();
    const son = await db.prepare('SELECT MAX(sira) AS n FROM hizmet_katalogu').first();
    await db.prepare('INSERT INTO hizmet_katalogu (id, ad, tur, varsayilan_fiyat_kurus, simge, sira, aktif, olusturma, guncelleme) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)')
      .bind(id, d.ad, d.tur, d.varsayilan_fiyat_kurus ?? null, d.simge, d.sira ?? ((son && son.n) || 0) + 10, z, z).run();
    await islemYaz(db, kim.eposta, 'hizmet_ekle', id, `${d.ad} · ${HIZMET_TUR[d.tur]}`);
    return json({ ok: true, id });
  }
  let m = yol.match(/^hizmet-katalogu\/([\w-]{1,64})$/);
  if (m && yontem === 'POST') {
    const k = await db.prepare('SELECT * FROM hizmet_katalogu WHERE id = ?').bind(m[1]).first();
    if (!k) return hata('Hizmet bulunamadı', 404);
    const { d, hata: h } = hizmetDenetle(govde, k);
    if (h) return hata(h, 422);
    const alan = Object.keys(d);
    if (!alan.length) return json({ ok: true, degisen: false });
    await db.prepare(`UPDATE hizmet_katalogu SET ${alan.map((a) => a + ' = ?').join(', ')}, guncelleme = ? WHERE id = ?`).bind(...alan.map((a) => d[a]), z, k.id).run();
    await islemYaz(db, kim.eposta, 'hizmet_duzenle', k.id, `${d.ad || k.ad} · ${alan.join(', ')}`);
    return json({ ok: true, degisen: true });
  }

  // --- Şablonlar ---
  if (yol === 'belge-sablonlari' && yontem === 'GET') {
    const r = await db.prepare(`SELECT s.id, s.tur, s.ad, s.durum, s.aktif_surum, s.guncelleme, (SELECT COUNT(*) FROM belge_sablon_surumleri v WHERE v.sablon_id = s.id) AS surum_sayisi
      FROM belge_sablonlari s ORDER BY CASE s.durum WHEN 'hazir' THEN 0 WHEN 'taslak' THEN 1 ELSE 2 END, s.olusturma, s.id`).all();
    return json({ ok: true, sablonlar: r.results, depo: !!env.YEDEK });
  }
  m = yol.match(/^belge-sablonlari\/([\w-]{1,40})(?:\/surum\/(\d{1,4}))?$/);
  if (m && yontem === 'GET') {
    const s = await db.prepare('SELECT id, tur, ad, durum, aktif_surum, guncelleme FROM belge_sablonlari WHERE id = ?').bind(m[1]).first();
    if (!s) return hata('Şablon bulunamadı', 404);
    const surumler = (await db.prepare('SELECT surum, olusturan, olusturma FROM belge_sablon_surumleri WHERE sablon_id = ? ORDER BY surum DESC').bind(s.id).all()).results;
    const istenen = m[2] ? Number(m[2]) : s.aktif_surum;
    let surum = null;
    if (istenen) {
      const v = await db.prepare('SELECT surum, sayfalar, olusturan, olusturma FROM belge_sablon_surumleri WHERE sablon_id = ? AND surum = ?').bind(s.id, istenen).first();
      if (!v) return hata('Şablon sürümü bulunamadı', 404);
      surum = { ...v, sayfalar: JSON.parse(v.sayfalar) };
    }
    return json({ ok: true, sablon: s, surumler, surum, depo: !!env.YEDEK });
  }
  m = yol.match(/^belge-sablonlari\/([\w-]{1,40})\/surum$/);
  if (m && yontem === 'POST') {
    const s = await db.prepare('SELECT id, ad, durum, aktif_surum FROM belge_sablonlari WHERE id = ?').bind(m[1]).first();
    if (!s) return hata('Şablon bulunamadı', 404);
    if (s.durum === 'onerilen') return hata('Bu şablonun düzenleyicisi henüz yok', 409);
    const { sayfalar, hata: h } = sayfalariDenetle(govde.sayfalar, s.id);
    if (h) return hata(h, 422);
    const metin = JSON.stringify(sayfalar);
    if (metin.length > 200000) return hata('Şablon çok büyük', 413);
    // Yalnız bu sürümden önce yüklenmiş ve depoda bulunan görseller kabul edilir.
    for (const x of sayfalar) {
      if (!x.gorsel.startsWith(GORSEL_ONEK)) continue;
      if (!env.YEDEK) return hata(DEPO_YOK, 409);
      const o = env.YEDEK.head ? await env.YEDEK.head(x.gorsel) : await env.YEDEK.get(x.gorsel);
      if (!o) return hata(`“${x.ad}” sayfasının görseli depoda bulunamadı; görseli yeniden yükleyin`, 422);
    }
    const son = await db.prepare('SELECT MAX(surum) AS n FROM belge_sablon_surumleri WHERE sablon_id = ?').bind(s.id).first();
    const yeni = ((son && son.n) || 0) + 1;
    // Eski sürümler kalır; aynı anda iki kayıt gelirse ikincisi birincil anahtar çakışmasıyla reddedilir.
    try {
      await db.batch([
        db.prepare('INSERT INTO belge_sablon_surumleri (sablon_id, surum, sayfalar, olusturan, olusturma) VALUES (?, ?, ?, ?, ?)').bind(s.id, yeni, metin, kim.eposta, z),
        db.prepare("UPDATE belge_sablonlari SET aktif_surum = ?, durum = CASE WHEN durum = 'taslak' THEN 'taslak' ELSE 'hazir' END, guncelleme = ? WHERE id = ?").bind(yeni, z, s.id)
      ]);
    } catch (e) {
      if (/UNIQUE|PRIMARY/i.test(String(e && e.message))) return hata('Şablon bu arada kaydedildi; sayfayı yenileyin', 409);
      throw e;
    }
    await islemYaz(db, kim.eposta, 'sablon_surum_kaydet', s.id, `${s.ad} · sürüm ${yeni} · ${sayfalar.length} sayfa`);
    return json({ ok: true, surum: yeni });
  }
  // Durum: taslak ↔ hazır (ör. sözleşme avukat incelemesinden geçince). Önerilen şablonun durumu buradan değişmez.
  m = yol.match(/^belge-sablonlari\/([\w-]{1,40})\/durum$/);
  if (m && yontem === 'POST') {
    const s = await db.prepare('SELECT id, ad, durum, aktif_surum FROM belge_sablonlari WHERE id = ?').bind(m[1]).first();
    if (!s) return hata('Şablon bulunamadı', 404);
    if (s.durum === 'onerilen' || !s.aktif_surum) return hata('Bu şablonun içeriği henüz yok', 409);
    if (!['hazir', 'taslak'].includes(govde.durum)) return hata('Durum hazır ya da taslak olmalı', 422);
    if (govde.durum === s.durum) return json({ ok: true, degisen: false });
    await db.prepare('UPDATE belge_sablonlari SET durum = ?, guncelleme = ? WHERE id = ?').bind(govde.durum, z, s.id).run();
    await islemYaz(db, kim.eposta, 'sablon_durum', s.id, `${s.ad} · ${SABLON_DURUM[s.durum]} → ${SABLON_DURUM[govde.durum]}`);
    return json({ ok: true, degisen: true });
  }
  // Panelden yüklenen sayfa görseli (R2). Yalnız yönetim oturumuyla açılır.
  m = yol.match(/^belge-sablonlari\/([\w-]{1,40})\/gorsel\/(\d{1,4})\/(\d{1,2})$/);
  if (m && yontem === 'GET') {
    if (!env.YEDEK) return hata(DEPO_YOK, 409);
    const o = await env.YEDEK.get(gorselAnahtari(m[1], m[2], m[3]));
    if (!o) return hata('Görsel bulunamadı', 404);
    const tip = (o.httpMetadata && o.httpMetadata.contentType) === 'image/png' ? 'image/png' : 'image/jpeg';
    return new Response(o.body, { headers: { ...GUVENLIK_BASLIKLARI, 'Content-Type': tip, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'private, max-age=3600' } });
  }
  return hata('Bulunamadı', 404);
}
