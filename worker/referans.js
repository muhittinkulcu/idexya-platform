// Gizli referans sayfası (Muhittin, 14 Kas 2026): idexya.com'da menüde, site haritasında ve aramada yer almayan,
// yalnız bağlantısı bilinince açılan referans listesi. Tekliflerde QR kod olarak verilir.
// - Adres: /r/<kod>. Kod `ayarlar` tablosunda (anahtar `referans_kodu`) durur; panelden "Yeni kod üret" ile değişir,
//   eski bağlantılar o an geçersiz olur. Kod yoksa ya da uyuşmazsa sitenin sıradan 404 sayfası döner (kodun varlığı sızmaz).
// - Sayfa derlemede /kabuk/referanslar/ olarak üretilir (src/pages/kabuk/referanslar.astro, veri src/data/referanslar.json);
//   /kabuk/* doğrudan açılamaz (worker/index.js 404 verir).
// - Teklif bağlantısı: /r/<kod>?t=<teklif anahtarı>. Anahtar `teklifler.referans_anahtari` (tahmin edilemez, 10 karakter).
//   `t` geçerliyse müşteri kartına günde en çok bir "Müşteri referansları açtı" kaydı düşer. IP, tarayıcı ya da kişi bilgisi saklanmaz.
// - QR kod sunucuda SVG olarak üretilir (qrcode-generator, MIT; hata düzeltme M, 4 modül sessiz alan). Dış servise istek gitmez.
import { qrcode } from 'qrcode-generator';
import { GUVENLIK_BASLIKLARI, json, hata, simdi, kimlik, islemYaz } from './ortak.js';

export const KOD_DESEN = /^[a-z0-9]{6,12}$/;
export const ANAHTAR_DESEN = /^[a-z0-9]{10}$/;
export const REFERANS_KOK = 'https://idexya.com';
const AYAR = 'referans_kodu';
const ABECE = 'abcdefghijklmnopqrstuvwxyz0123456789';
// Bağlantı önizleyicileri (WhatsApp, Slack…) ve tarayıcı robotları "müşteri açtı" sayılmaz.
const ROBOT = /bot|crawl|spider|headless|slurp|lighthouse|pagespeed|preview|monitor|whatsapp|facebookexternalhit|telegram|slack|discord|skype|linkedin|embedly|curl|wget/i;
// CSP, sitenin diğer sunucu sayfalarıyla (worker/icerik.js, worker/haftalik-bulten.js) aynıdır. 'unsafe-inline' bu sayfa için değil,
// ortak yerleşimin (src/layouts/Site.astro) tema/menü için satır içi betikleri ve Astro'nun küçük betikleri satır içine alması
// yüzünden gerekir; referans sayfası kendisi satır içi betik eklemez (süzgeç public/js/referans-suzgec.js). Kaldırmak ayrı iştir.
const CSP = "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'";

// Rastgele [a-z0-9] metni (ret örneklemesiyle eşit dağılımlı).
export function rastgeleKod(uzunluk = 10) {
  let s = '';
  while (s.length < uzunluk) {
    for (const b of crypto.getRandomValues(new Uint8Array(uzunluk * 2))) {
      if (b < 252 && s.length < uzunluk) s += ABECE[b % 36];
    }
  }
  return s;
}

// Sabit süreli karşılaştırma (uzunluk farkı da aynı döngüde ele alınır).
function esit(a, b) {
  const x = String(a), y = String(b);
  let fark = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) fark |= (x.charCodeAt(i) || 0) ^ (y.charCodeAt(i) || 0);
  return fark === 0;
}

export async function referansKodu(db) {
  const r = await db.prepare('SELECT deger, guncelleme FROM ayarlar WHERE anahtar = ?').bind(AYAR).first();
  return r && KOD_DESEN.test(r.deger || '') ? { kod: r.deger, guncelleme: r.guncelleme } : null;
}

export const sayfaBaglantisi = (kod) => `${REFERANS_KOK}/r/${kod}`;
export const teklifBaglantisi = (kod, anahtar) => `${sayfaBaglantisi(kod)}?t=${anahtar}`;

// QR kod SVG'si: hata düzeltme M, çevresinde 4 modül beyaz sessiz alan. Koyu modüller satır satır birleşik dikdörtgenler.
export function qrSvg(metin, { duzey = 'M', sessiz = 4 } = {}) {
  const qr = qrcode(0, duzey);
  qr.addData(metin, 'Byte');
  qr.make();
  const n = qr.getModuleCount(), boy = n + sessiz * 2;
  let yol = '';
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (!qr.isDark(y, x)) continue;
      let u = 1;
      while (x + u < n && qr.isDark(y, x + u)) u++;
      yol += `M${x + sessiz} ${y + sessiz}h${u}v1h-${u}z`;
      x += u - 1;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${boy} ${boy}" shape-rendering="crispEdges" role="img" aria-label="Referans sayfası QR kodu" data-modul="${n}" data-sessiz="${sessiz}"><rect width="${boy}" height="${boy}" fill="#FFFFFF"/><path fill="#000000" d="${yol}"/></svg>`;
}

// Teklifin referans bağlantısı ve QR'ı (teklif okunurken). Kod tanımlı değilse null.
// Anahtar ilk istendiğinde üretilir; eski tekliflere de böylece verilir. Çakışmada (tekil dizin) yeniden denenir.
export async function teklifReferansi(db, teklifId) {
  const k = await referansKodu(db);
  if (!k) return null;
  let r = await db.prepare('SELECT referans_anahtari FROM teklifler WHERE id = ?').bind(teklifId).first();
  if (!r) return null;
  for (let deneme = 0; !r.referans_anahtari && deneme < 3; deneme++) {
    try { await db.prepare('UPDATE teklifler SET referans_anahtari = ? WHERE id = ? AND referans_anahtari IS NULL').bind(rastgeleKod(10), teklifId).run(); }
    catch (e) { if (!/UNIQUE/i.test(String(e && e.message))) throw e; }
    r = await db.prepare('SELECT referans_anahtari FROM teklifler WHERE id = ?').bind(teklifId).first();
  }
  if (!r.referans_anahtari) return null;
  const baglanti = teklifBaglantisi(k.kod, r.referans_anahtari);
  const a = await db.prepare('SELECT COUNT(*) AS n, MAX(zaman) AS son FROM referans_acilis WHERE teklif_id = ?').bind(teklifId).first();
  return { baglanti, kisa: baglanti.replace(/^https:\/\//, ''), svg: qrSvg(baglanti), acilis_gun: (a && a.n) || 0, son_acilis: (a && a.son) || null };
}

// Teklif bağlantısıyla açılış: teklif başına İstanbul gününde en çok bir kayıt. Yalnız zaman tutulur.
export async function acilisKaydet(db, anahtar) {
  if (!ANAHTAR_DESEN.test(anahtar || '')) return false;
  const t = await db.prepare('SELECT id, no, baslik, musteri_id FROM teklifler WHERE referans_anahtari = ?').bind(anahtar).first();
  if (!t) return false;
  const z = simdi(), gun = new Date(Date.now() + 3 * 3600000).toISOString().slice(0, 10);
  const r = await db.prepare('INSERT OR IGNORE INTO referans_acilis (teklif_id, gun, zaman) VALUES (?, ?, ?)').bind(t.id, gun, z).run();
  if (!r.meta || !r.meta.changes) return false;
  await db.prepare('INSERT INTO kayitlar (id, musteri_id, zaman, tur, baslik, detay, kim) SELECT ?, id, ?, ?, ?, ?, ? FROM musteriler WHERE id = ?')
    .bind(kimlik(), z, 'teklif', 'Müşteri referansları açtı', `${t.no} · ${t.baslik}`, 'Referans sayfası', t.musteri_id).run();
  return true;
}

// GET /r/<kod>: kod doğruysa kabuk sayfa, değilse sitenin sıradan 404'ü (aynı yanıt, ASSETS'ten).
export async function referansSayfasi(istek, env, ctx, kod) {
  const url = new URL(istek.url);
  const yok = () => env.ASSETS.fetch(istek);
  if (istek.method !== 'GET' && istek.method !== 'HEAD') return yok();
  const k = await referansKodu(env.DB);
  if (!k || !esit(kod, k.kod)) return yok();
  const t = url.searchParams.get('t');
  if (istek.method === 'GET' && t && !ROBOT.test(istek.headers.get('user-agent') || '')) {
    const is = acilisKaydet(env.DB, t).catch((e) => console.error('referans açılış', e && e.message));
    if (ctx && ctx.waitUntil) ctx.waitUntil(is); else await is;
  }
  const kabuk = await env.ASSETS.fetch(new Request(url.origin + '/kabuk/referanslar/'));
  if (!kabuk.ok) return yok();
  // Kabuğun kanonik adresi (/kabuk/…) ve og:url çıkarılır; sayfa zaten noindex.
  const html = (await kabuk.text()).replace(/<link rel="?canonical"?[^>]*>/g, '').replace(/<meta property="?og:url"?[^>]*>/g, '');
  const h = new Headers({ 'Content-Type': 'text/html; charset=utf-8' });
  Object.entries(GUVENLIK_BASLIKLARI).forEach(([a, v]) => h.set(a, v));
  h.set('X-Robots-Tag', 'noindex, nofollow');
  h.set('Referrer-Policy', 'no-referrer');
  h.set('Cache-Control', 'private, no-store');
  h.set('Content-Security-Policy', CSP);
  return new Response(istek.method === 'HEAD' ? null : html, { status: 200, headers: h });
}

// Panel: /api/yonetim/referans-kodu (GET) ve /api/yonetim/referans-kodu/yeni (POST).
export async function yonetimReferansApi(db, yontem, yol, kim) {
  if (yol !== 'referans-kodu' && yol !== 'referans-kodu/yeni') return null;
  if (yol === 'referans-kodu' && yontem === 'GET') {
    const k = await referansKodu(db);
    return json({ ok: true, kod: k ? k.kod : null, baglanti: k ? sayfaBaglantisi(k.kod) : null, guncelleme: k ? k.guncelleme : null });
  }
  if (yol === 'referans-kodu/yeni' && yontem === 'POST') {
    const once = await referansKodu(db);
    let kod = rastgeleKod(10);
    while (once && kod === once.kod) kod = rastgeleKod(10);
    const z = simdi();
    await db.prepare('INSERT INTO ayarlar (anahtar, deger, guncelleme, guncelleyen) VALUES (?, ?, ?, ?) ON CONFLICT(anahtar) DO UPDATE SET deger = excluded.deger, guncelleme = excluded.guncelleme, guncelleyen = excluded.guncelleyen')
      .bind(AYAR, kod, z, kim.eposta).run();
    await islemYaz(db, kim.eposta, 'referans_kodu_yenilendi', null, once ? 'Eski referans bağlantıları geçersiz oldu' : 'İlk referans kodu üretildi');
    return json({ ok: true, kod, baglanti: sayfaBaglantisi(kod), guncelleme: z });
  }
  return hata('Yöntem desteklenmiyor', 405);
}
