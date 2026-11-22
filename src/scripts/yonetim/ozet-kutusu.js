// Özet kutusu: sayfanın tek cümlelik özeti (imzalı görünüm 3. adım; IDOS'taki ÖzetKutusu ile aynı düzen).
// Cümle yalnız sayfanın kendi gerçek verisinden kurulur; bilinmeyen sayı cümleye girmez, yerine 0 yazılmaz.
import { el } from './ortak.js';

const SIMGE = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l1.9 5.8L20 10.7l-5.8 1.9L12 18.4l-2.2-5.8L4 10.7l6.1-1.9z"/><path d="M19 3v4M17 5h4"/></svg>';

/** Karar gerektiren sayı ya da ifade: turuncu vurgu. */
export const karar = (metin) => el('span', { class: 'ozet-karar' }, metin);

/**
 * Kutuyu `kap` içine çizer. `parcalar` boşsa kutu gizlenir.
 * @param {HTMLElement} kap  data-ozet-kutusu taşıyan <section>
 * @param {{ etiket: string, parcalar: (string|Node)[], eylem?: Node|null }} o
 */
export function ozetCiz(kap, { etiket, parcalar, eylem = null }) {
  if (!kap) return;
  if (!parcalar || !parcalar.length) { kap.hidden = true; kap.replaceChildren(); return; }
  const simge = el('span', { class: 'ozet-simge', 'aria-hidden': 'true' });
  simge.innerHTML = SIMGE;
  kap.setAttribute('aria-label', etiket);
  kap.hidden = false;
  const govde = el('div', { class: 'ozet-govde' }, el('p', { class: 'ozet-etiket' }, etiket), el('p', { class: 'ozet-cumle' }, ...parcalar));
  kap.replaceChildren(...[simge, govde, eylem].filter(Boolean));
}
