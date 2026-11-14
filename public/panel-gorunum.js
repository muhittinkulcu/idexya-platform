// Panel teması ilk boyamadan önce (src/layouts/Yonetim.astro <head>; satır içi betik değil, CSP script-src 'self').
// Ortak kabuk (kabuk.js) modül olarak sonra yüklenir ve aynı kuralı uygular; bu dosya yalnız koyu temada açık zeminin
// yanıp sönmesini önler. Eski panel tema seçimi (idx-tema-secim: acik | koyu | sistem | saat) bir kez kabuğun
// idx-gorunum kaydına taşınır: sistem ve saat → oto. Eski kabuğun artık okunmayan anahtarları silinir.
(function () {
  var d = document.documentElement, g = null;
  try {
    g = JSON.parse(localStorage.getItem('idx-gorunum') || 'null');
    var eski = localStorage.getItem('idx-tema-secim') || (localStorage.getItem('idx-tema') === 'koyu' ? 'koyu' : null);
    if (!g && eski) {
      g = { tema: eski === 'acik' || eski === 'koyu' ? eski : 'oto' };
      localStorage.setItem('idx-gorunum', JSON.stringify(g));
    }
    ['idx-tema-secim', 'idx-panel', 'idx-sekmeler', 'idx-cam'].forEach(function (k) { localStorage.removeItem(k); });
  } catch (e) { /* gizli kip */ }
  var t = g && (g.tema === 'acik' || g.tema === 'koyu') ? g.tema : 'oto';
  d.setAttribute('data-tema-secim', t);
  d.setAttribute('data-tema', t === 'oto' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'koyu' : 'acik') : t);
})();
