// Çerezsiz, kişisel veri içermeyen ziyaret ve hız ölçümü (sunucu: worker/olcum.js).
// Gönderilen: sayfa yolu, yönlendiren sitenin yalnız alan adı (ya da "dogrudan"), ekran genişliğine göre cihaz sınıfı;
// sayfadan ayrılırken de LCP, INP (yaklaşık) ve CLS değerleri. Çerez, yerel depolama, kimlik ya da parmak izi kullanılmaz.
// "Do Not Track" ya da "Global Privacy Control" açıksa hiçbir şey gönderilmez.
export function olcumBaslat() {
  try {
    const n = navigator;
    if (n.doNotTrack === '1' || window.doNotTrack === '1' || n.globalPrivacyControl === true) return;
    if (!n.sendBeacon || /^\/(yonetim|api)(\/|$)/.test(location.pathname)) return;
    const w = window.innerWidth || document.documentElement.clientWidth || 0;
    const cihaz = w < 768 ? 'mobil' : w < 1100 ? 'tablet' : 'masaustu';
    const bulunamadi = document.documentElement.dataset.olcum === '404' ? 1 : undefined;
    let kaynak = 'dogrudan';
    if (document.referrer) {
      try { const h = new URL(document.referrer).hostname.replace(/^www\./, ''); kaynak = h === location.hostname.replace(/^www\./, '') ? 'ic' : h || 'dogrudan'; } catch (e) { kaynak = 'dogrudan'; }
    }
    const gonder = (veri) => { try { n.sendBeacon('/api/olcum', JSON.stringify({ p: location.pathname, c: cihaz, n: bulunamadi, ...veri })); } catch (e) { /* ölçüm sessizce atlanır */ } };
    gonder({ t: 'g', r: kaynak });

    if (typeof PerformanceObserver === 'undefined') return;
    const tur = PerformanceObserver.supportedEntryTypes || [];
    let lcp = null, cls = 0, clsVar = false, oturum = 0, oturumIlk = 0, oturumSon = 0;
    const etkilesim = new Map();
    const izle = (t, f, ek = {}) => { if (!tur.includes(t)) return; try { new PerformanceObserver((l) => l.getEntries().forEach(f)).observe({ type: t, buffered: true, ...ek }); } catch (e) { /* desteklenmiyor */ } };
    izle('largest-contentful-paint', (g) => { lcp = g.renderTime || g.loadTime || g.startTime; });
    // CLS: 1 sn aralıklı, en çok 5 sn süren kayma oturumlarının en büyüğü (Google tanımı).
    izle('layout-shift', (g) => {
      if (g.hadRecentInput) return;
      clsVar = true;
      if (oturum && g.startTime - oturumSon < 1000 && g.startTime - oturumIlk < 5000) oturum += g.value;
      else { oturum = g.value; oturumIlk = g.startTime; }
      oturumSon = g.startTime;
      if (oturum > cls) cls = oturum;
    });
    // INP yaklaşığı: her etkileşimin en uzun olay süresi; 50 etkileşimde bir en kötüsü atlanır (98. yüzdelik yaklaşımı).
    izle('event', (g) => { if (g.interactionId) etkilesim.set(g.interactionId, Math.max(etkilesim.get(g.interactionId) || 0, g.duration)); }, { durationThreshold: 40 });
    izle('first-input', (g) => { if (!etkilesim.size) etkilesim.set('ilk', g.duration); });
    let gitti = false;
    const bitir = () => {
      if (gitti) return;
      gitti = true;
      const sureler = [...etkilesim.values()].sort((a, b) => b - a);
      const inp = sureler.length ? sureler[Math.min(sureler.length - 1, Math.floor(sureler.length / 50))] : null;
      if (lcp === null && inp === null && !clsVar && !tur.includes('layout-shift')) return;
      gonder({ t: 'h', lcp: lcp === null ? null : Math.round(lcp), inp: inp === null ? null : Math.round(inp), cls: tur.includes('layout-shift') ? Math.round(cls * 10000) / 10000 : null });
    };
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') bitir(); });
    addEventListener('pagehide', bitir);
  } catch (e) { /* ölçüm hiçbir zaman sayfayı bozmaz */ }
}
