// B kuralı (Muhittin): kart başlığı bilgilendiricidir (ne + kapsam), altında kapsam ve dönem yazar, yanında "i" simgesi
// bir cümlelik açıklamayı açar. Kullanım: <h2 data-kart-bilgi="Bir cümlelik açıklama.">Başlık: kapsam</h2>
// "i" düğmesi başlığın hemen yanına, açıklama kartın başlık satırının altına eklenir; klavyeyle açılır, Esc kapatır.
import { el } from './ortak.js';

let sayac = 0;
function kur(h) {
  if (h.dataset.kartBilgiKurulu) return;
  h.dataset.kartBilgiKurulu = '1';
  const id = 'kart-bilgi-' + ++sayac;
  const metin = el('p', { class: 'kart-i-metin', id, role: 'note', hidden: true }, h.dataset.kartBilgi);
  const dugme = el('button', {
    type: 'button', class: 'kart-i', 'aria-expanded': 'false', 'aria-controls': id, title: h.dataset.kartBilgi,
    'aria-label': 'Açıklama: ' + h.textContent.trim(),
    onclick: () => { const acik = metin.hidden; metin.hidden = !acik; dugme.setAttribute('aria-expanded', String(acik)); }
  }, 'i');
  dugme.addEventListener('keydown', (o) => { if (o.key === 'Escape' && !metin.hidden) { metin.hidden = true; dugme.setAttribute('aria-expanded', 'false'); } });
  h.classList.add('kart-baslik');
  h.append(dugme);
  // Açıklama, başlığın bulunduğu satırın (ör. .modul-bas) altına gelir; başlık doğrudan kartın içindeyse başlığın altına.
  const satir = h.closest('.modul-bas, [data-kart-bas]') || h;
  const alt = satir === h && h.nextElementSibling && h.nextElementSibling.matches('.kart-alt') ? h.nextElementSibling : satir;
  alt.after(metin);
}

export function kartBilgi() {
  const tara = () => document.querySelectorAll('main :is(h2, h3)[data-kart-bilgi]').forEach(kur);
  new MutationObserver(tara).observe(document.querySelector('main') || document.body, { childList: true, subtree: true });
  tara();
}
