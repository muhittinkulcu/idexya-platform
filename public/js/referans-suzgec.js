// Referans sayfası (src/pages/kabuk/referanslar.astro) sektör süzgeci. Satır içi betik olmasın diye ayrı dosyadır (CSP). Betik yoksa bütün kartlar görünür kalır.
// Süzgeç değişince ızgara kısa bir solma ile değişir, kartlar yeniden sırayla süzülerek gelir.
// "Hareketi azalt" tercihi açıksa geçiş ve gecikme uygulanmaz.
(function referansSuzgeci() {
  const kok = document.querySelector('[data-rf]');
  if (!kok) return;
  const izgara = kok.querySelector('[data-rf-izgara]');
  const kartlar = [...kok.querySelectorAll('.rf-kart')];
  const cipler = [...kok.querySelectorAll('[data-rf-suz]')];
  const durum = kok.querySelector('[data-rf-durum]');
  const sakin = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let zamanlayici = 0;

  const uygula = (secim) => {
    let sira = 0;
    for (const k of kartlar) {
      const gorunur = !secim || k.dataset.kategori === secim;
      k.hidden = !gorunur;
      if (!gorunur) continue;
      k.style.setProperty('--i', String(Math.min(sira++, 12)));
      // Giriş hareketini yeniden başlat
      k.style.animation = 'none';
      void k.offsetWidth;
      k.style.animation = '';
    }
    if (durum) durum.textContent = `${sira} marka gösteriliyor${secim ? ` (${secim})` : ''}.`;
  };

  for (const c of cipler) {
    c.addEventListener('click', () => {
      if (c.getAttribute('aria-pressed') === 'true') return;
      cipler.forEach((x) => x.setAttribute('aria-pressed', String(x === c)));
      const secim = c.dataset.rfSuz || '';
      clearTimeout(zamanlayici);
      if (sakin()) { uygula(secim); return; }
      izgara.classList.add('gecis');
      zamanlayici = setTimeout(() => { uygula(secim); izgara.classList.remove('gecis'); }, 200);
    });
  }
})();
