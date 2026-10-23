// Görevler, belgeler ve muhasebe sayfalarının ortak yardımcıları. Sunucudan gelen metin yalnız el() ile (textContent) yazılır.
import { api, el } from './ortak.js';

// İstanbul'a göre bugünün tarihi (YYYY-AA-GG); tarayıcının saat diliminden bağımsız.
export const bugunIst = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
// TDK: 23.10.2026
export const gun = (t) => (t && /^\d{4}-\d{2}-\d{2}$/.test(t) ? t.split('-').reverse().join('.') : '—');
// TDK: saat 09.30
export const saatYaz = (s) => (s ? s.replace(':', '.') : '');
// 23 Ekim 2026 Cuma
export const uzunGun = (t) => new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long', timeZone: 'UTC' }).format(new Date(t + 'T00:00:00Z'));
export const ayAdi = (y, m) => new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, 1)));
export const kucuk = (s) => String(s || '').toLocaleLowerCase('tr-TR');

export const musteriAdi = (k) => k.musteri_firma || k.musteri_ad || '';
export const musteriBag = (k) => k.musteri_id && musteriAdi(k)
  ? el('a', { href: '/yonetim/musteri/?id=' + encodeURIComponent(k.musteri_id), style: 'text-decoration: none; font-weight: 600' }, musteriAdi(k)) : null;

// CRM müşterilerini bir ya da daha çok <select> kutusuna doldurur. İlk seçenek: bos (ör. "Müşteri yok").
export async function musterileriDoldur(secimler) {
  let liste = [];
  try { liste = (await api('musteriler')).musteriler; } catch (h) { /* müşteri bağlamak isteğe bağlıdır; liste gelmezse kutu boş kalır */ }
  liste.sort((a, b) => (a.firma || a.ad || '').localeCompare(b.firma || b.ad || '', 'tr'));
  for (const [s, bos] of secimler) {
    const deger = s.value;
    s.replaceChildren(el('option', { value: '' }, bos), ...liste.map((m) => el('option', { value: m.id }, [m.firma, m.firma && m.ad ? '· ' + m.ad : m.ad].filter(Boolean).join(' ') || m.eposta || 'Adsız müşteri')));
    s.value = deger;
  }
  return liste;
}

export function dosyaIndir(icerik, ad, tur) {
  const a = el('a', { href: URL.createObjectURL(new Blob([icerik], { type: tur })), download: ad });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// Sekme benzeri düğme grubu (bülten sayfasındaki görünüm)
export const secmeDugme = (secili, etiket, tik, ek = {}) => el('button', { type: 'button', class: 'dugme kucuk', 'aria-pressed': String(secili),
  style: secili ? 'background: var(--card); box-shadow: 0 1px 3px var(--shadow)' : 'border-color: transparent; background: transparent', onclick: tik, ...ek }, etiket);
