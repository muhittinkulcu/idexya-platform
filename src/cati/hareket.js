// Ortak hareketler. Hareket azaltma tercihinde hiçbiri çalışmaz; kök öğedeki .hareket sınıfı bunu belirler (src/layouts/Cati.astro).
const kok = document.documentElement;
const hareketVar = kok.classList.contains('hareket');

// Kaydırınca beliren bölümler. Yalnız ilk görünümün altındakiler bekletilir: görünür alan titremez, betik çalışmazsa içerik açık kalır.
function belirme() {
  const ogeler = document.querySelectorAll('[data-rv]');
  if (!hareketVar || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((l) => l.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.remove('rv-bekle'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -6% 0px' });
  ogeler.forEach((e) => { if (e.getBoundingClientRect().top > innerHeight) { e.classList.add('rv-bekle'); io.observe(e); } });
}

// Teknoloji yönünde okuma çizgisi; süreç listesinde ilerleme rayı.
function kaydirma() {
  const ilerleme = document.getElementById('ilerleme');
  const raylar = [...document.querySelectorAll('.surec')];
  if (!hareketVar) { raylar.forEach((r) => r.style.setProperty('--ilerleme', 1)); return; }
  if (!ilerleme && !raylar.length) return;
  let bekliyor = false;
  const ciz = () => {
    bekliyor = false;
    if (ilerleme) { const m = kok.scrollHeight - innerHeight; ilerleme.style.transform = `scaleX(${m > 0 ? Math.min(1, scrollY / m) : 0})`; }
    raylar.forEach((s) => { const r = s.getBoundingClientRect(); s.style.setProperty('--ilerleme', Math.max(0, Math.min(1, (innerHeight * 0.7 - r.top) / Math.max(1, r.height))).toFixed(3)); });
  };
  addEventListener('scroll', () => { if (!bekliyor) { bekliyor = true; requestAnimationFrame(ciz); } }, { passive: true });
  ciz();
}

// Görünüm dışındaki sürekli CSS hareketi durur (şerit, altıgenler, eş yükselti).
function surekliDurdur() {
  if (!hareketVar || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((l) => l.forEach((e) => e.target.classList.toggle('durgun', !e.isIntersecting)));
  document.querySelectorAll('[data-surekli]').forEach((e) => io.observe(e));
}

// Gece Hattı kahramanı: imleç ışığı.
function imlecIsigi() {
  if (!hareketVar || !matchMedia('(hover: hover)').matches) return;
  document.querySelectorAll('[data-imlec]').forEach((b) => {
    let x = 0, y = 0, bekliyor = false;
    b.addEventListener('pointermove', (o) => {
      x = o.clientX; y = o.clientY;
      if (bekliyor) return;
      bekliyor = true;
      requestAnimationFrame(() => { bekliyor = false; const r = b.getBoundingClientRect(); b.style.setProperty('--mx', `${x - r.left}px`); b.style.setProperty('--my', `${y - r.top}px`); });
    }, { passive: true });
  });
}

belirme();
kaydirma();
surekliDurdur();
imlecIsigi();
