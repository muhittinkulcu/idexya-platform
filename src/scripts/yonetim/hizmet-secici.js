// Hizmet kataloğundan aranabilir seçim (Muhittin, 12 Kas 2026: kaynağı belli alanlar açılır listeden seçilir).
// Teklif kalemlerinde kullanılır; CRM fırsat formu ve belge şablonu formu da aynı bileşeni kullanabilir.
// · Katalog: GET /api/yonetim/hizmet-katalogu → yalnız etkin hizmetler, sıraya göre (katalogHazirla).
// · Listenin sonunda her zaman "Katalog dışı kalem" vardır; katalog boşsa ya da yüklenemezse yalnız o kalır.
// · Erişilebilirlik (WAI-ARIA combobox + listbox): ↓/↑ açar ve gezer, Enter seçer, Esc kapatır, Home/End uçlara gider;
//   etkin seçenek aria-activedescendant ile duyurulur. Metinler textContent ile yazılır.
// · Saf yardımcılar (katalogHazirla, hizmetSuz, secimUygula, kalemSecimi, fiyatMetni) DOM'a dokunmaz; Node'da sınanır.
import { el } from './ortak.js';

export const TUR_ADI = { aylik: 'Aylık', tek_seferlik: 'Tek seferlik' };
export const DISI = Object.freeze({ disi: true, ad: 'Katalog dışı kalem' });

// TDK: 2000000 kuruş → "20.000 TL"; bilinmeyen fiyat "—"
export function fiyatMetni(kurus) {
  if (kurus === null || kurus === undefined || kurus === '' || !Number.isFinite(Number(kurus))) return '—';
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(Number(kurus) / 100) + ' TL';
}

// Sunucu yanıtından seçilebilir liste: etkin, adı olan hizmetler; sıra, sonra ad.
export function katalogHazirla(hizmetler) {
  if (!Array.isArray(hizmetler)) return [];
  return hizmetler.filter((h) => h && h.aktif && typeof h.ad === 'string' && h.ad.trim() && h.id)
    .map((h) => ({ id: String(h.id), ad: h.ad.trim(), tur: TUR_ADI[h.tur] ? h.tur : null, varsayilan_fiyat_kurus: h.varsayilan_fiyat_kurus ?? null, sira: Number(h.sira) || 0 }))
    .sort((a, b) => a.sira - b.sira || a.ad.localeCompare(b.ad, 'tr'));
}

// Türkçe harf ve büyük/küçük harf duyarsız karşılaştırma için sadeleştirme
const sade = (s) => String(s || '').toLocaleLowerCase('tr-TR').replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/\s+/g, ' ').trim();

export function hizmetSuz(katalog, sorgu) {
  const q = sade(sorgu);
  if (!q) return katalog.slice();
  return katalog.filter((h) => sade(h.ad).includes(q) || sade(TUR_ADI[h.tur]).includes(q));
}

// Seçimin kalem alanlarına etkisi. Fiyat bu teklif için değiştirilebilir; katalog değişmez.
export function secimUygula(h) {
  if (!h || h.disi) return { disi: true, hizmet_id: null, tur: null };
  const k = h.varsayilan_fiyat_kurus;
  const fiyatYok = k === null || k === undefined || !Number.isFinite(Number(k));
  return { disi: false, hizmet_id: h.id, ad: h.ad, tur: h.tur || null, birim_fiyat: fiyatYok ? '' : String(Number(k) / 100), fiyatYok };
}

// Düzenlemede kaydedilmiş kalemin başlangıç seçimi. Eski kalem (hizmet_id yok) katalog dışı olarak, adıyla açılır.
// Katalogdan sonradan çıkan / pasife alınan hizmette kayıtlı ad ve tür korunur. Yeni satır: katalog boşsa katalog dışı, değilse seçimsiz (null).
export function kalemSecimi(kalem, katalog) {
  const k = kalem || {};
  if (k.hizmet_id) {
    const h = katalog.find((x) => x.id === k.hizmet_id);
    return { disi: false, hizmet_id: k.hizmet_id, ad: k.ad || (h && h.ad) || '', tur: TUR_ADI[k.tur] ? k.tur : (h && h.tur) || null };
  }
  if (k.ad) return { disi: true, hizmet_id: null, tur: null, ad: k.ad };
  return katalog.length ? null : { disi: true, hizmet_id: null, tur: null, ad: '' };
}

let sayac = 0;

// Seçici: { kutu, sec(h), deger() }. onSec(h) katalog hizmetiyle ya da DISI ile çağrılır.
// secim: kalemSecimi() sonucu (başlangıç gösterimi için). uyari: katalog boş/yüklenemedi metni (listede gösterilir).
export function hizmetSecici({ katalog = [], secim = null, etiket = 'Hizmet / ürün', onSec = () => {}, uyari = '' } = {}) {
  const no = ++sayac, kimlikAd = `hs-${no}`, listeId = `hs-${no}-liste`;
  let gosterilen = [], etkin = -1, simdiki = secim;
  const metin = () => (simdiki ? (simdiki.disi ? DISI.ad : simdiki.ad) : '');
  const girdi = el('input', { id: kimlikAd, type: 'text', role: 'combobox', autocomplete: 'off', spellcheck: 'false', 'aria-autocomplete': 'list', 'aria-expanded': 'false', 'aria-controls': listeId, 'data-hizmet-secici': '', placeholder: 'Hizmet seçin ya da arayın…' });
  girdi.value = metin();
  const liste = el('ul', { id: listeId, role: 'listbox', 'aria-label': etiket, hidden: true,
    style: 'position: absolute; z-index: 30; left: 0; right: 0; top: 100%; margin: 4px 0 0; padding: 4px; list-style: none; max-height: 280px; overflow-y: auto; background: rgb(var(--card)); border: 1px solid rgb(var(--line)); border-radius: 12px; box-shadow: 0 8px 24px var(--shadow)' });
  const kutu = el('div', { class: 'alan', style: 'position: relative; flex: 3 1 220px; min-width: 0' }, el('label', { for: kimlikAd }, etiket), girdi, liste);

  function secenekler() {
    gosterilen = [...hizmetSuz(katalog, girdi.value === metin() ? '' : girdi.value), DISI];
    const satirlar = gosterilen.map((h, i) => el('li', { id: `${listeId}-${i}`, role: 'option', 'aria-selected': String(i === etkin), 'data-secenek': h.disi ? 'disi' : h.id,
      style: 'display: flex; justify-content: space-between; gap: 10px; padding: 8px 10px; border-radius: 8px; cursor: pointer; font-weight: 400' + (h.disi ? '; border-top: 1px solid rgb(var(--line)); margin-top: 2px' : '') + (i === etkin ? '; background: var(--card2); outline: 2px solid var(--accent, rgb(var(--line)))' : ''),
      onmousedown: (o) => o.preventDefault(), onclick: () => sec(h) },
    h.disi ? el('span', {}, DISI.ad, el('small', { style: 'display: block; color: var(--tx2)' }, 'Adı ve fiyatı elle yazın')) : el('span', {}, h.ad, h.tur ? el('small', { style: 'display: block; color: var(--tx2)' }, TUR_ADI[h.tur]) : ''),
    h.disi ? '' : el('span', { style: 'white-space: nowrap; color: var(--tx2); font-variant-numeric: tabular-nums' }, fiyatMetni(h.varsayilan_fiyat_kurus))));
    liste.replaceChildren(...(uyari ? [el('li', { role: 'presentation', style: 'padding: 6px 10px; font-size: 12px; font-weight: 400; color: var(--warn, var(--tx2))' }, uyari)] : []), ...satirlar);
    if (etkin >= 0) { girdi.setAttribute('aria-activedescendant', `${listeId}-${etkin}`); liste.querySelector(`#${CSS.escape(`${listeId}-${etkin}`)}`)?.scrollIntoView({ block: 'nearest' }); }
    else girdi.removeAttribute('aria-activedescendant');
  }
  function ac() { if (!liste.hidden) return; liste.hidden = false; girdi.setAttribute('aria-expanded', 'true'); secenekler(); }
  function kapat(geriYaz = true) {
    liste.hidden = true; etkin = -1; girdi.setAttribute('aria-expanded', 'false'); girdi.removeAttribute('aria-activedescendant');
    if (geriYaz) girdi.value = metin();
  }
  function sec(h) {
    simdiki = h.disi ? { disi: true, hizmet_id: null, tur: null } : { disi: false, hizmet_id: h.id, ad: h.ad, tur: h.tur };
    kapat(); onSec(h);
  }
  // Yazınca liste süzülür ve ilk uygun seçenek etkin olur (Enter onu seçer).
  girdi.addEventListener('input', () => { etkin = girdi.value.trim() ? 0 : -1; liste.hidden = false; girdi.setAttribute('aria-expanded', 'true'); secenekler(); });
  girdi.addEventListener('click', () => (liste.hidden ? ac() : kapat()));
  girdi.addEventListener('blur', () => kapat());
  girdi.addEventListener('keydown', (o) => {
    const acik = !liste.hidden;
    if (o.key === 'ArrowDown' || o.key === 'ArrowUp') {
      o.preventDefault();
      if (!acik) { etkin = o.key === 'ArrowDown' ? 0 : -1; ac(); if (etkin === -1) { etkin = gosterilen.length - 1; secenekler(); } return; }
      const n = gosterilen.length;
      etkin = o.key === 'ArrowDown' ? (etkin + 1) % n : (etkin <= 0 ? n - 1 : etkin - 1);
      secenekler();
    } else if ((o.key === 'Home' || o.key === 'End') && acik) {
      o.preventDefault(); etkin = o.key === 'Home' ? 0 : gosterilen.length - 1; secenekler();
    } else if (o.key === 'Enter') {
      if (acik && etkin >= 0) { o.preventDefault(); sec(gosterilen[etkin]); }
      else if (!acik) { o.preventDefault(); etkin = 0; ac(); secenekler(); }
    } else if (o.key === 'Escape') {
      if (acik) { o.preventDefault(); o.stopPropagation(); kapat(); }
    } else if (o.key === 'Tab') kapat();
  });
  return { kutu, girdi, sec, deger: () => simdiki };
}
