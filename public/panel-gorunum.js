// Panel teması ilk boyamadan önce (src/layouts/Yonetim.astro <head>; satır içi betik değil, CSP script-src 'self').
// Ortak kabuk (kabuk.js) sonra yüklenir ve aynı kuralı uygular (idx-gorunum: tema acik | koyu | sistem | zaman; kabuk
// README "Tema ve Ayarlar sayfası"); bu dosya yalnız koyu temada açık zeminin yanıp sönmesini önler. Eski kabuğun `oto`
// değeri `sistem` sayılır. Eski panel tema seçimi (idx-tema-secim: acik | koyu | sistem | saat) bir kez idx-gorunum kaydına
// taşınır: sistem → sistem, saat → zaman. Eski kabuğun artık okunmayan anahtarları silinir.
(function () {
  var d = document.documentElement, g = null;
  try {
    g = JSON.parse(localStorage.getItem('idx-gorunum') || 'null');
    var eski = localStorage.getItem('idx-tema-secim') || (localStorage.getItem('idx-tema') === 'koyu' ? 'koyu' : null);
    if (!g && eski) {
      g = { tema: eski === 'acik' || eski === 'koyu' ? eski : eski === 'saat' ? 'zaman' : 'sistem' };
      localStorage.setItem('idx-gorunum', JSON.stringify(g));
    }
    ['idx-tema-secim', 'idx-panel', 'idx-sekmeler', 'idx-cam'].forEach(function (k) { localStorage.removeItem(k); });
  } catch (e) { /* gizli kip */ }
  g = g && typeof g === 'object' ? g : {};
  var t = g.tema === 'acik' || g.tema === 'koyu' || g.tema === 'zaman' ? g.tema : 'sistem';
  // Zamana göre: [zamanAcik, zamanKoyu) açık (gün içindeki dakika; varsayılan 07.00–19.00; aralık gece yarısını aşabilir).
  var dk = function (x, v) { return typeof x === 'number' && x % 1 === 0 && x >= 0 && x < 1440 ? x : v; };
  var a = dk(g.zamanAcik, 420), k = dk(g.zamanKoyu, 1140);
  if (a === k) { a = 420; k = 1140; }
  var s = new Date(), m = s.getHours() * 60 + s.getMinutes();
  var sonuc = t === 'zaman' ? ((a < k ? m >= a && m < k : m >= a || m < k) ? 'acik' : 'koyu')
    : t === 'sistem' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'koyu' : 'acik') : t;
  d.setAttribute('data-tema-secim', t);
  d.setAttribute('data-tema', sonuc);
  if (g.azHareket === true) d.setAttribute('data-hareket', 'az');
  // Kişisel ölçek (idx-olcek, kabuk "Görünüm ve ölçek"): sayfa sonradan büyüyüp küçülmesin.
  try { var o = JSON.parse(localStorage.getItem('idx-olcek') || 'null'); if (o && o.o % 1 === 0 && o.o >= 85 && o.o <= 120) { d.style.zoom = o.o / 100; d.style.setProperty('--ik-olcek', o.o / 100); } } catch (e) { /* gizli kip */ }
})();
