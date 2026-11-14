// Tarayıcıda temel yol (önek). Önek tek yerden okunur: Worker os alanında her panel sayfasına
// <meta name="idexya-temel-yol" content="/website"> ekler (worker/temel-yol.js). Meta yoksa önek boştur ve hiçbir şey
// değişmez (panel.idexya.com). Kural src/data/temel-yol.js'de; burada yalnız tarayıcıya bağlanır.
import { onekGecerli, yolEkle, yolCikar } from '../../data/temel-yol.js';

function oku() {
  try {
    const m = document.querySelector('meta[name="idexya-temel-yol"]');
    const v = m ? String(m.getAttribute('content') || '').trim() : '';
    return onekGecerli(v) ? v : '';
  } catch (e) { return ''; }
}
export const TEMEL = oku();

// Kök göreli adrese önek: yol('/api/yonetim/ozet') → '/website/api/yonetim/ozet' (önek boşsa aynen).
export const yol = (u) => yolEkle(u, TEMEL);
// Adres çubuğundaki yolun panel karşılığı: '/website/leads' → '/leads' (önek boşsa aynen).
export const panelYolu = (p = location.pathname) => (TEMEL ? (yolCikar(p, TEMEL) ?? p) : p);
// location.href = '/customer?id=…' yerine
export const git = (u) => location.assign(yol(u));

// Sayfa betiklerinin sonradan kurduğu bağlantı ve görseller (el(), .href = '/…', şablon metinleri) için güvenlik ağı:
// öneksiz kök göreli href/src/action önekli yazılır; tıklamadan hemen önce de denetlenir. Önek boşsa kurulmaz.
const OZ = ['href', 'src', 'action', 'formaction', 'poster'];
function duzelt(e) {
  if (!e || e.nodeType !== 1) return;
  for (const a of OZ) {
    const v = e.getAttribute(a);
    if (v !== null) { const y = yol(v); if (y !== v) e.setAttribute(a, y); }
  }
}
function agacDuzelt(kok) {
  if (!kok || kok.nodeType !== 1) return;
  duzelt(kok);
  kok.querySelectorAll('[href],[src],[action],[formaction],[poster]').forEach(duzelt);
}
if (TEMEL && typeof MutationObserver !== 'undefined') {
  new MutationObserver((kayitlar) => {
    for (const k of kayitlar) {
      if (k.type === 'attributes') duzelt(k.target);
      else k.addedNodes.forEach(agacDuzelt);
    }
  }).observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: OZ });
  agacDuzelt(document.documentElement);
  for (const olay of ['pointerdown', 'click', 'auxclick', 'submit']) {
    document.addEventListener(olay, (o) => { const e = o.target && o.target.closest ? o.target.closest('a[href],area[href],form[action]') : null; if (e) duzelt(e); }, true);
  }
}
