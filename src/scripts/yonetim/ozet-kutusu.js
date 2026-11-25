// Özet kutusu: sayfanın maddeli özeti (Muhittin, 25 Kas 2026: başlığın yanında madde madde, sayılar tıklanır; IDOS'taki ÖzetKutusu ile
// aynı düzen). Yalnız sayfanın kendi gerçek verisinden kurulur; bilinmeyen sayı yazılmaz, yerine 0 konmaz.
import { el, yol } from './ortak.js';

const SIMGE = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l1.9 5.8L20 10.7l-5.8 1.9L12 18.4l-2.2-5.8L4 10.7l6.1-1.9z"/><path d="M19 3v4M17 5h4"/></svg>';

/** Karar gerektiren sayı ya da ifade: turuncu vurgu. */
export const karar = (metin, href) => (href ? el('a', { class: 'ozet-bag ozet-karar', href: yol(href) }, metin) : el('span', { class: 'ozet-karar' }, metin));
/** Özet maddesindeki sayı ya da ad: ilgili sayfaya götürür. */
export const bag = (metin, href) => el('a', { class: 'ozet-bag', href: yol(href) }, metin);

/**
 * Kutuyu `kap` içine çizer. `maddeler` (her biri metin ve düğüm dizisi) boşsa kutu gizlenir.
 * @param {HTMLElement} kap  data-ozet-kutusu taşıyan <section>
 * @param {{ etiket: string, maddeler?: (string|Node)[][], eylem?: Node|null }} o
 */
export function ozetCiz(kap, { etiket, maddeler, eylem = null }) {
  if (!kap) return;
  if (!maddeler || !maddeler.length) { kap.hidden = true; kap.replaceChildren(); return; }
  const simge = el('span', { class: 'ozet-simge', 'aria-hidden': 'true' });
  simge.innerHTML = SIMGE;
  kap.setAttribute('aria-label', etiket);
  kap.hidden = false;
  const govde = el('div', { class: 'ozet-govde' }, el('p', { class: 'ozet-etiket' }, etiket), el('ul', { class: 'ozet-maddeler' }, maddeler.map((m) => el('li', { class: m.some((x) => x instanceof Element && x.classList.contains('ozet-karar')) ? 'karar' : null }, ...m))));
  kap.replaceChildren(...[simge, govde, eylem].filter(Boolean));
}
