// Paket öneri sihirbazı: tasarımdaki mantıkla aynı sonuç (paket-mantik.js).
import olustur from './paket-mantik.js';

const kacis = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function sihirbazBaslat() {
  const kok = document.getElementById('sihirbaz');
  if (!kok) return;
  const Component = olustur(class { constructor(p) { this.props = p || {}; this.state = {}; } setState(y) { Object.assign(this.state, y); ciz(); } });
  const c = new Component({});
  const seciliAd = document.getElementById('secili-paket');

  function ciz() {
    const v = c.renderVals();
    let h = `<div style="display: flex; justify-content: space-between; align-items: center; gap: 12px"><span style="font-size: 13px; font-weight: 600; letter-spacing: 0.06em; color: var(--acc)">PAKET ÖNERİ SİHİRBAZI</span><span style="font-size: 14px; color: var(--tx2)" aria-live="polite">${kacis(v.ilerlemeYazi)}</span></div>
<div style="height: 6px; border-radius: 6px; background: var(--card2)"><div style="height: 6px; border-radius: 6px; background: var(--brand); width: ${v.ilerlemeYuzde}"></div></div>`;
    if (v.soruGoster) {
      h += `<div style="display: flex; flex-direction: column; gap: 16px"><h2 style="margin: 0; font-size: 26px; line-height: 1.25; color: var(--head)">${kacis(v.soru.baslik)}</h2><div role="group" aria-label="${kacis(v.soru.baslik)}" style="display: flex; flex-direction: column; gap: 10px">`;
      v.soru.secenekler.forEach((s, i) => {
        h += `<button type="button" data-secenek="${i}" aria-pressed="${s.secili}" style="${s.stil}"><span style="display: flex; flex-direction: column; gap: 2px; text-align: left"><span style="font-weight: 600">${kacis(s.ad)}</span><span style="font-size: 14px; color: var(--tx2); font-weight: 400">${kacis(s.aciklama)}</span></span><span aria-hidden="true" style="color: var(--acc); font-size: 20px">→</span></button>`;
      });
      h += '</div>';
      if (v.geriVar) h += '<button type="button" data-eylem="geri" style="align-self: flex-start; min-height: 44px; padding: 0 4px; border: 0; background: transparent; color: var(--tx2); font: inherit; font-size: 15px; cursor: pointer">← Geri</button>';
      h += '</div>';
    }
    if (v.sonucGoster) {
      h += `<div style="display: flex; flex-direction: column; gap: 16px"><span style="font-size: 14px; color: var(--tx2)">Size önerimiz</span><div style="padding: 22px; border-radius: 18px; border: 2px solid var(--brand); display: flex; flex-direction: column; gap: 10px"><span style="font-size: 26px; font-weight: 700; line-height: 1.2; color: var(--head)">${kacis(v.oneri.ad)}</span><span style="color: var(--tx2)">${kacis(v.oneri.neden)}</span><ul style="margin: 0; padding-left: 18px; display: flex; flex-direction: column; gap: 6px; font-size: 15px">${v.oneri.maddeler.map((m) => `<li>${kacis(m)}</li>`).join('')}</ul></div>
<div style="display: flex; flex-wrap: wrap; gap: 10px"><a href="#teklif" data-eylem="oneri" style="min-height: 50px; display: flex; align-items: center; padding: 0 22px; border-radius: 12px; background: var(--fill); color: #FFFFFF; text-decoration: none; font-weight: 600">Bu paketle teklif iste</a><a href="#${kacis(v.oneri.hedef)}" style="min-height: 50px; display: flex; align-items: center; padding: 0 18px; border-radius: 12px; border: 1px solid var(--line); color: var(--head); text-decoration: none; font-weight: 600">Paketi incele</a><button type="button" data-eylem="bastan" style="min-height: 50px; padding: 0 14px; border: 0; background: transparent; color: var(--tx2); font: inherit; cursor: pointer">Baştan başla</button></div></div>`;
    }
    kok.innerHTML = h;
    kok._v = v;
  }

  kok.addEventListener('click', (e) => {
    const v = kok._v;
    const s = e.target.closest('[data-secenek]');
    if (s) { v.soru.secenekler[Number(s.dataset.secenek)].sec(); kok.querySelector('h2, [aria-live]')?.focus?.(); return; }
    const b = e.target.closest('[data-eylem]');
    if (!b) return;
    if (b.dataset.eylem === 'geri') v.geri();
    if (b.dataset.eylem === 'bastan') v.bastan();
    if (b.dataset.eylem === 'oneri' && seciliAd) seciliAd.textContent = v.oneri.ad;
  });
  document.querySelectorAll('[data-paket]').forEach((a) => a.addEventListener('click', () => { if (seciliAd) seciliAd.textContent = a.dataset.paket; }));
  ciz();
}
