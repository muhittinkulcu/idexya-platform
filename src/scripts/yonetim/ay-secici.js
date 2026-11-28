// Dönem (ay) seçici (IDOS TarihSecici.tsx görünümü, 28 Kas 2026): üst çubuğun sağ yuvasında (ustYuvaSag) takvim simgeli tek
// düğme; açılınca yıl ve 12 ay ızgarası, "Önceki ay · Bu ay · Sonraki ay". Sayfanın kendi betiği değişmez: seçim aynı
// [data-ay] (type=month) alanına yazılır ve 'change' olayı gönderilir; [data-ay-geri], [data-ay-ileri], [data-ay-bugun]
// düğmeleri ve [data-ay-ad] etiketi sayfanın betiğine bağlı kalır. Yuvaya taşıma Yonetim.astro'dadır ([data-ust-sag]).
const AYLAR = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

export function aySecici(kok) {
  if (!kok || kok.dataset.kuruldu !== undefined) return;
  kok.dataset.kuruldu = '';
  const dugme = kok.querySelector('[data-ay-ac]'), acilir = kok.querySelector('.ay-acilir'), alan = kok.querySelector('[data-ay]');
  const izgara = kok.querySelector('[data-ay-izgara]'), yilYaz = kok.querySelector('[data-yil]');
  let yil = null;
  const secili = () => (/^\d{4}-\d{2}$/.test(alan.value) ? alan.value : '');
  function ciz() {
    const s = secili();
    if (yil === null) yil = Number((s || new Date().toISOString()).slice(0, 4));
    yilYaz.textContent = String(yil);
    izgara.replaceChildren(...AYLAR.map((ad, i) => {
      const deger = `${yil}-${String(i + 1).padStart(2, '0')}`;
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = ad; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', String(deger === s));
      b.addEventListener('click', () => { alan.value = deger; alan.dispatchEvent(new Event('change', { bubbles: true })); ac(false); dugme.focus(); });
      return b;
    }));
  }
  function ac(acik) {
    acilir.hidden = !acik;
    dugme.setAttribute('aria-expanded', String(acik));
    if (acik) { yil = null; ciz(); }
  }
  dugme.addEventListener('click', () => ac(acilir.hidden));
  kok.querySelector('[data-yil-geri]').addEventListener('click', () => { yil -= 1; ciz(); });
  kok.querySelector('[data-yil-ileri]').addEventListener('click', () => { yil += 1; ciz(); });
  // Önceki / sonraki ay ve "Bu ay" sayfanın betiğiyle çalışır; ızgara yeni seçimi gösterir.
  ['[data-ay-geri]', '[data-ay-ileri]', '[data-ay-bugun]'].forEach((q) => kok.querySelector(q)?.addEventListener('click', () => setTimeout(() => { yil = null; ciz(); }, 0)));
  kok.addEventListener('keydown', (o) => { if (o.key === 'Escape' && !acilir.hidden) { o.stopPropagation(); ac(false); dugme.focus(); } });
  document.addEventListener('mousedown', (o) => { if (!acilir.hidden && !kok.contains(o.target)) ac(false); });
}
