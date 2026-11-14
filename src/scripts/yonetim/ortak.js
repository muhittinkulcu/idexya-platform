// Yönetim paneli ortak yardımcıları. Sunucudan gelen her metin textContent ile yazılır (HTML olarak yorumlanmaz).
// Temel yol ilk yüklenir: os.idexya.com/website altında adresler tek önek değişkeninden (src/scripts/yonetim/temel-yol.js).
import { yol as onekle } from './temel-yol.js';
import { adresMetni, adrestenOku, capaTr } from '../../data/panel-parametre.js';
import { MENU } from '../../data/panel-menu.js';
import { metaOku } from '../../data/temel-yol.js';
export { adresMetni, capaTr };
export { yol, git, panelYolu, TEMEL, SITE_KOKU } from './temel-yol.js';
// Adres seçeneğini Türkçe adıyla okur (adres İngilizce: ?tab=new → prm('sekme') === 'yeni')
export const prm = (ad) => adrestenOku(ad, location.search);
export const ASAMALAR = [
  { k: 'yeni', ad: 'Yeni' }, { k: 'gorusme', ad: 'Görüşülüyor' }, { k: 'teklif', ad: 'Teklif gönderildi' },
  { k: 'goruldu', ad: 'Teklif görüldü' }, { k: 'kazanildi', ad: 'Kazanıldı' }, { k: 'kaybedildi', ad: 'Kaybedildi' }
];
export const asamaAdi = (k) => (ASAMALAR.find((a) => a.k === k) || { ad: k || '—' }).ad;
export const KAYNAK = { iletisim: 'İletişim formu', analiz: 'Ücretsiz analiz formu', paket: 'Paket teklif formu', sihirbaz: 'Paket sihirbazı', asistan: 'Yapay zekâ asistanı', form: 'Web formu' };
export const TALEP_DURUM = { yeni: 'Yeni', crm: 'CRM’e alındı', spam: 'Spam' };

export function el(etiket, ozellik = {}, ...cocuklar) {
  const e = document.createElement(etiket);
  for (const [k, v] of Object.entries(ozellik || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'style') e.style.cssText = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (k === 'href' || k === 'src' || k === 'action') e.setAttribute(k, onekle(String(v)));
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const c of cocuklar.flat()) if (c !== null && c !== undefined && c !== false) e.append(c instanceof Node ? c : String(c));
  return e;
}

const iki = (n) => String(n).padStart(2, '0');
// TDK: tarih 19.10.2026, saat 08.15
export function tarih(iso, saatli = true) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d)) return '—';
  const t = `${iki(d.getDate())}.${iki(d.getMonth() + 1)}.${d.getFullYear()}`;
  return saatli ? `${t} ${iki(d.getHours())}.${iki(d.getMinutes())}` : t;
}
export function once(iso) {
  const fark = (Date.now() - new Date(iso).getTime()) / 60000;
  if (!isFinite(fark)) return '—';
  if (fark < 1) return 'az önce';
  if (fark < 60) return `${Math.floor(fark)} dk önce`;
  if (fark < 1440) return `${Math.floor(fark / 60)} sa önce`;
  return tarih(iso, false);
}
export const para = (n) => (n === null || n === undefined || n === '' ? '—' : new Intl.NumberFormat('tr-TR').format(n) + ' TL');

// Aynı anda giden aynı okuma isteği bir kez gönderilir (kabuk rozetleri ile Genel bakış aynı özeti ister); her çağıran
// yanıtın kendi kopyasını alır. Kabuk betiği (panel-kabuk.js) ile sayfa betiği ayrı paketlerde olduğu için ortak tablo
// Symbol.for anahtarıyla paylaşılır. Yazma (POST) istekleri paylaşılmaz.
const SURUYOR = globalThis[Symbol.for('idx-okuma')] || (globalThis[Symbol.for('idx-okuma')] = new Map());
function oku(adres) {
  let p = SURUYOR.get(adres);
  if (!p) {
    p = fetch(adres, { credentials: 'same-origin' }).then(async (r) => ({ status: r.status, ok: r.ok, metin: await r.text() }));
    SURUYOR.set(adres, p);
    const sil = () => { if (SURUYOR.get(adres) === p) SURUYOR.delete(adres); };
    p.then(sil, sil);
  }
  return p;
}

export async function api(yol, govde) {
  const adres = onekle('/api/yonetim/' + yol);
  const r = govde === undefined ? await oku(adres) : await fetch(adres, {
    method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(govde)
  }).then(async (y) => ({ status: y.status, ok: y.ok, metin: await y.text() }));
  let s;
  try { s = JSON.parse(r.metin); } catch (e) { s = null; }
  if (!s || typeof s !== 'object') s = { ok: false, hata: 'Sunucudan geçersiz yanıt geldi' };
  if (!r.ok || !s.ok) {
    if (r.status === 401) veriTemizle();
    const h = new Error(s.hata || `İstek başarısız (${r.status})`);
    h.durum = r.status;
    throw h;
  }
  if (govde === undefined && SAKLA[yol]) veriSakla(yol, s);
  return s;
}

// "Eski göster, arkadan tazele": sayfa önce bu oturumda son alınan değeri çizer, sonra taze yanıtla günceller.
// KVKK: yalnız aşağıdaki iki okuma yanıtının SAYISAL ÖZETİ saklanır, alanlar tek tek seçilir (sonradan eklenen alan
// kendiliğinden girmez). Kişi, müşteri, firma adı, e-posta, telefon ve sonKayitlar SAKLANMAZ. Yer: sessionStorage
// (sekme kapanınca silinir), anahtar kullanıcıya bağlı (idx-veri:<kullanıcı özeti>:<uç>), en çok 10 dakika geçerli.
// Çıkışta (kabuk "Çıkış yap") ve 401 yanıtında silinir. Taze yanıt alınamazsa sayfa eski değeri kaldırır.
const VERI_SURE = 10 * 60 * 1000;
const say = (x) => (Number.isFinite(Number(x)) ? Number(x) : 0);
const metin = (x) => (x === null || x === undefined ? null : String(x).slice(0, 80));
const satirlar = (liste, alanlar) => (Array.isArray(liste) ? liste.slice(0, 2000) : []).map((r) => Object.fromEntries(alanlar.map(([k, t]) => [k, t === 'n' ? say(r && r[k]) : metin(r && r[k])])));
const SAKLA = {
  ozet: (s) => ({
    ok: true, talepler: satirlar(s.talepler, [['durum'], ['n', 'n']]), uyeler: satirlar(s.uyeler, [['durum'], ['n', 'n']]),
    musteri: { n: say(s.musteri && s.musteri.n), hat: say(s.musteri && s.musteri.hat) }, asamalar: satirlar(s.asamalar, [['asama'], ['n', 'n']]),
    bekleyenYorum: say(s.bekleyenYorum), bekleyenDestek: say(s.bekleyenDestek),
    reklam: { kurulu: !!(s.reklam && s.reklam.kurulu), son: s.reklam && s.reklam.son ? { zaman: metin(s.reklam.son.zaman), durum: metin(s.reklam.son.durum) } : null }
  }),
  grafik: (s) => ({
    ok: true, bugun: metin(s.bugun), gunluk: satirlar(s.gunluk, [['gun'], ['kaynak'], ['n', 'n']]), isi: satirlar(s.isi, [['hg', 'n'], ['saat', 'n'], ['n', 'n']]),
    sayfalar: satirlar(s.sayfalar, [['sayfa'], ['n', 'n']]), donem: satirlar(s.donem, [['donem'], ['durum'], ['n', 'n']]),
    musteriGunluk: satirlar(s.musteriGunluk, [['gun'], ['n', 'n']]), asamalar: satirlar(s.asamalar, [['asama'], ['n', 'n'], ['deger', 'n']]),
    bekleyen24: { n: say(s.bekleyen24 && s.bekleyen24.n), en_eski: metin(s.bekleyen24 && s.bekleyen24.en_eski) }
  })
};
// Kullanıcı: Worker her panel sayfasına <meta name="idexya-kullanici"> yazar (Access kimliği). Yoksa hiçbir şey saklanmaz.
function kullaniciOzeti() {
  const k = metaOku('idexya-kullanici');
  if (!k) return '';
  let h = 2166136261;
  for (const c of k) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(36);
}
const ONEK_VERI = 'idx-veri:';
function veriSakla(yol, s) {
  const k = kullaniciOzeti();
  if (!k) return;
  try {
    Object.keys(sessionStorage).forEach((a) => { if (a.startsWith(ONEK_VERI) && !a.startsWith(`${ONEK_VERI}${k}:`)) sessionStorage.removeItem(a); });
    sessionStorage.setItem(`${ONEK_VERI}${k}:${yol}`, JSON.stringify({ z: Date.now(), v: SAKLA[yol](s) }));
  } catch (e) { /* gizli kip ya da kota */ }
}
export function saklananVeri(yol) {
  const k = kullaniciOzeti();
  if (!k || !SAKLA[yol]) return null;
  try {
    const x = JSON.parse(sessionStorage.getItem(`${ONEK_VERI}${k}:${yol}`) || 'null');
    return x && x.v && Date.now() - x.z >= 0 && Date.now() - x.z < VERI_SURE ? x.v : null;
  } catch (e) { return null; }
}
export function veriTemizle() {
  try { Object.keys(sessionStorage).forEach((a) => { if (a.startsWith(ONEK_VERI)) sessionStorage.removeItem(a); }); } catch (e) { /* gizli kip */ }
}

export function genelHata(metin) {
  const k = document.querySelector('[data-genel-hata]');
  if (!k) return;
  k.hidden = !metin; k.textContent = metin || '';
}

// Yan menü rozetleri ortak kabuktadır (rozetYap). Hangi sayaç hangi modülde: src/data/panel-menu.js `sayac`.
// Bilinmiyorsa ya da sıfırsa rozet görünmez; yalnız bilinen ve sıfırdan büyük sayı görünür.
const ROZET_URL = MENU.flatMap((g) => g.ogeler).filter((o) => o.sayac && o.href).map((o) => [o.sayac, onekle(o.href)]);
// Özetten rozet sayıları: [[modül adresi, sayı]]. Özet yoksa hepsi 0 (rozet görünmez).
export function rozetSayilari(ozet) {
  const durum = (liste, d) => (liste ? (liste.find((t) => t.durum === d) || { n: 0 }).n : 0);
  const n = ozet ? { talep: durum(ozet.talepler, 'yeni'), uye: durum(ozet.uyeler, 'bekliyor'), yorum: ozet.bekleyenYorum || 0, destek: ozet.bekleyenDestek || 0 } : {};
  return ROZET_URL.map(([s, url]) => [url, n[s] || 0]);
}
export function sayacGuncelle(ozet) {
  const kabuk = document.querySelector('idexya-kabuk');
  if (!kabuk || typeof kabuk.rozetYap !== 'function') return;
  for (const [url, n] of rozetSayilari(ozet)) kabuk.rozetYap(url, n);
}
