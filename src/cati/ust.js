// Üst menü: açılır paneller, telefonda menü düğmesi, Esc ve dışarı tıklama.
const paneller = () => document.querySelectorAll('.acilir.acik');
const dugmeler = () => document.querySelectorAll('[data-ac]');
function kapat() {
  paneller().forEach((p) => p.classList.remove('acik'));
  dugmeler().forEach((d) => d.setAttribute('aria-expanded', 'false'));
}
function burgerKapat() {
  const n = document.getElementById('anaNav'), b = document.querySelector('[data-burger]');
  if (n) n.classList.remove('acik');
  if (b) { b.setAttribute('aria-expanded', 'false'); b.setAttribute('aria-label', 'Menüyü aç'); }
}
document.addEventListener('click', (o) => {
  const d = o.target.closest('[data-ac]');
  if (d) {
    const p = document.getElementById(d.dataset.ac), acikti = p.classList.contains('acik');
    kapat();
    if (!acikti) { p.classList.add('acik'); d.setAttribute('aria-expanded', 'true'); }
    return;
  }
  const b = o.target.closest('[data-burger]');
  if (b) {
    const on = document.getElementById('anaNav').classList.toggle('acik');
    b.setAttribute('aria-expanded', String(on));
    b.setAttribute('aria-label', on ? 'Menüyü kapat' : 'Menüyü aç');
    return;
  }
  if (!o.target.closest('.nav')) { kapat(); burgerKapat(); }
});
document.addEventListener('keydown', (o) => {
  if (o.key !== 'Escape') return;
  const acik = document.querySelector('[data-ac][aria-expanded="true"]');
  kapat(); burgerKapat();
  if (acik) acik.focus();
});
