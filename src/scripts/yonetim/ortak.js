// Yönetim paneli ortak yardımcıları. Sunucudan gelen her metin textContent ile yazılır (HTML olarak yorumlanmaz).
// Temel yol ilk yüklenir: os.idexya.com/website altında adresler tek önek değişkeninden (src/scripts/yonetim/temel-yol.js).
import { yol as onekle } from './temel-yol.js';
import { adresMetni, adrestenOku, capaTr } from '../../data/panel-parametre.js';
import { MENU } from '../../data/panel-menu.js';
export { adresMetni, capaTr };
export { yol, git, panelYolu, TEMEL } from './temel-yol.js';
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

export async function api(yol, govde) {
  const r = await fetch(onekle('/api/yonetim/' + yol), govde === undefined ? { credentials: 'same-origin' } : {
    method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(govde)
  });
  const s = await r.json().catch(() => ({ ok: false, hata: 'Sunucudan geçersiz yanıt geldi' }));
  if (!r.ok || !s.ok) {
    const h = new Error(s.hata || `İstek başarısız (${r.status})`);
    h.durum = r.status;
    throw h;
  }
  return s;
}

export function genelHata(metin) {
  const k = document.querySelector('[data-genel-hata]');
  if (!k) return;
  k.hidden = !metin; k.textContent = metin || '';
}

// Yan menü rozetleri ortak kabuktadır (rozetYap). Hangi sayaç hangi modülde: src/data/panel-menu.js `sayac`.
// Bilinmiyorsa ya da sıfırsa rozet görünmez; yalnız bilinen ve sıfırdan büyük sayı görünür.
const ROZET_URL = MENU.flatMap((g) => g.ogeler).filter((o) => o.sayac && o.href).map((o) => [o.sayac, onekle(o.href)]);
export function sayacGuncelle(ozet) {
  const kabuk = document.querySelector('idexya-kabuk');
  if (!kabuk || typeof kabuk.rozetYap !== 'function') return;
  const say = (liste, d) => (liste ? (liste.find((t) => t.durum === d) || { n: 0 }).n : 0);
  const n = ozet ? { talep: say(ozet.talepler, 'yeni'), uye: say(ozet.uyeler, 'bekliyor'), yorum: ozet.bekleyenYorum || 0, destek: ozet.bekleyenDestek || 0 } : {};
  for (const [s, url] of ROZET_URL) kabuk.rozetYap(url, n[s] || 0);
}
