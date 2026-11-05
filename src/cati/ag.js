// Teknoloji yönündeki hareketli ağ. Sekme gizliyken ya da tuval görünüm dışındayken durur; telefonda seyrektir.
// Hareket azaltma tercihinde hareket.js bu dosyayı hiç yüklemez.
export function agBaslat(c) {
  const x = c.getContext && c.getContext('2d');
  if (!x) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  let W = 0, Y = 0, P = [], gorunur = true, raf = 0, son = 0;
  const durum = () => { c.dataset.calisiyor = raf ? 'evet' : 'hayir'; };
  function kur() {
    const r = c.getBoundingClientRect();
    W = r.width; Y = r.height;
    c.width = W * dpr; c.height = Y * dpr;
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    const tel = W < 700;
    const n = Math.round(Math.min(tel ? 22 : 78, (W * Y) / (tel ? 16000 : 15000)));
    P = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * Y, a: (Math.random() - 0.5) * 0.28, b: (Math.random() - 0.5) * 0.28 }));
    c.dataset.parca = String(n);
  }
  function ciz() {
    x.clearRect(0, 0, W, Y);
    const d = W < 700 ? 95 : 135, d2 = d * d;
    for (let i = 0; i < P.length; i++) {
      const p = P[i];
      for (let j = i + 1; j < P.length; j++) {
        const q = P[j], dx = p.x - q.x, dy = p.y - q.y, m = dx * dx + dy * dy;
        if (m < d2) {
          x.strokeStyle = `rgba(245,70,40,${(0.8 * (1 - m / d2)).toFixed(3)})`;
          x.lineWidth = 1; x.beginPath(); x.moveTo(p.x, p.y); x.lineTo(q.x, q.y); x.stroke();
        }
      }
      x.fillStyle = i % 3 ? 'rgba(240,122,35,.85)' : 'rgba(245,52,46,.9)';
      x.beginPath(); x.arc(p.x, p.y, 1.6, 0, 6.3); x.fill();
    }
  }
  function adim(t) {
    raf = 0;
    if (!gorunur || document.hidden) { durum(); return; }
    if (t - son >= 33) {
      son = t;
      P.forEach((p) => { p.x += p.a; p.y += p.b; if (p.x < 0 || p.x > W) p.a *= -1; if (p.y < 0 || p.y > Y) p.b *= -1; });
      ciz();
    }
    raf = requestAnimationFrame(adim);
  }
  function bas() { if (!raf && gorunur && !document.hidden) raf = requestAnimationFrame(adim); durum(); }
  kur(); ciz(); bas();
  if ('IntersectionObserver' in window) new IntersectionObserver((e) => { gorunur = e[0].isIntersecting; bas(); }).observe(c);
  document.addEventListener('visibilitychange', bas);
  let bt = 0;
  addEventListener('resize', () => { clearTimeout(bt); bt = setTimeout(() => { kur(); ciz(); }, 180); }, { passive: true });
}
