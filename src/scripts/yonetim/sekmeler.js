// Sayfa sekmeleri (ortak kabuk, Muhittin 14 Kas 2026): açılan panel sayfaları Nebim'deki gibi üst çubuğun altında sekme
// olarak durur. Liste yalnız bu tarayıcıda (localStorage 'idx-sekmeler') tutulur; en çok 8 sekme, aşılırsa en eski düşer.
// Genel bakış (/dashboard) her zaman ilk sekmedir ve kapatılamaz. Sekmeler gerçek bağlantıdır (<a href>).
export const SEKME_ANAHTAR = 'idx-sekmeler';
export const EN_COK = 8;
const ANA = { yol: '/dashboard', href: '/dashboard', ad: 'Genel bakış' };

const yolAl = (p) => (p || '/').replace(/\/+$/, '') || '/';

// Saf liste işlemleri (tarayıcısız test edilebilir)
export function temizle(liste) {
  const gorulen = new Set([ANA.yol]);
  const diger = (Array.isArray(liste) ? liste : [])
    .filter((s) => s && typeof s.yol === 'string' && typeof s.href === 'string' && typeof s.ad === 'string' && s.href.startsWith('/'))
    .filter((s) => (gorulen.has(s.yol) ? false : (gorulen.add(s.yol), true)));
  const ana = (Array.isArray(liste) ? liste : []).find((s) => s && s.yol === ANA.yol);
  return [{ ...ANA, href: ana && typeof ana.href === 'string' && ana.href.startsWith('/dashboard') ? ana.href : ANA.href }, ...diger];
}

export function ekle(liste, sekme) {
  const l = temizle(liste);
  const i = l.findIndex((s) => s.yol === sekme.yol);
  if (i >= 0) { l[i] = { ...l[i], href: sekme.href, ad: i === 0 ? ANA.ad : sekme.ad }; return l; }
  l.push(sekme);
  // En eski sekme (Genel bakıştan sonraki ilk) düşer; yeni açılan sayfa her zaman kalır.
  while (l.length > EN_COK) l.splice(1, 1);
  return l;
}

export function kapat(liste, yol) {
  const l = temizle(liste);
  const i = l.findIndex((s) => s.yol === yol);
  if (i <= 0) return { liste: l, sol: null };
  l.splice(i, 1);
  return { liste: l, sol: l[i - 1] };
}

function oku() {
  try { return temizle(JSON.parse(localStorage.getItem(SEKME_ANAHTAR) || '[]')); } catch (e) { return temizle([]); }
}
function yaz(l) { try { localStorage.setItem(SEKME_ANAHTAR, JSON.stringify(l)); } catch (e) {} }

export function sayfaSekmeleri() {
  // Dar ekranda paket çubuğundaki modül sekmeleri kayar; bu modülün sekmesi görünür kalsın
  const modul = document.querySelector('.paket-sekme[aria-current=page]');
  if (modul && modul.parentElement.scrollWidth > modul.parentElement.clientWidth) modul.parentElement.scrollLeft = modul.offsetLeft - 8;
  const kutu = document.querySelector('[data-sayfa-sekmeleri]');
  if (!kutu) return;
  const burasi = () => yolAl(location.pathname);
  const baslik = () => {
    const b = document.querySelector('[data-yol-son] [data-baslik]') || document.querySelector('h1[data-baslik]');
    return ((b && b.textContent) || document.title.split('·')[0]).replace(/\.\s*$/, '').trim() || burasi();
  };

  let liste = ekle(oku(), { yol: burasi(), href: location.pathname + location.search, ad: baslik() });
  yaz(liste);

  function ciz() {
    const etkinYol = burasi();
    kutu.replaceChildren(...liste.map((s, i) => {
      const etkin = s.yol === etkinYol;
      const d = document.createElement('div');
      d.className = 'sayfa-sekme' + (etkin ? ' etkin' : '') + (i === 0 ? ' kalici' : '');
      d.dataset.yol = s.yol;
      const a = document.createElement('a');
      a.href = s.href; a.textContent = s.ad; a.title = s.ad;
      if (etkin) a.setAttribute('aria-current', 'page');
      d.append(a);
      if (i > 0) {
        const b = document.createElement('button');
        b.type = 'button'; b.textContent = '×';
        b.setAttribute('aria-label', s.ad + ' sekmesini kapat');
        b.title = 'Kapat';
        b.addEventListener('click', () => kapatTikla(s.yol));
        d.append(b);
      }
      return d;
    }));
    const e = kutu.querySelector('.sayfa-sekme.etkin');
    if (e && kutu.scrollWidth > kutu.clientWidth) {
      const azalt = matchMedia('(prefers-reduced-motion: reduce)').matches;
      e.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: azalt ? 'auto' : 'smooth' });
    }
  }

  function kapatTikla(yol) {
    const odakIndeks = liste.findIndex((s) => s.yol === yol);
    const sonuc = kapat(oku(), yol);
    liste = sonuc.liste; yaz(liste);
    if (yol === burasi() && sonuc.sol) { location.href = sonuc.sol.href; return; }
    ciz();
    // Odak kaybolmasın: kapatılan sekmenin yerine geçen ya da soldaki sekmenin bağlantısına geçer
    const hedef = kutu.querySelectorAll('.sayfa-sekme a')[Math.min(odakIndeks, liste.length - 1)] || kutu.querySelector('.sayfa-sekme a');
    if (hedef) hedef.focus();
  }

  // Sayfa içi sekmeler adresi history.replaceState ile değiştirir; sekmenin adresi güncel kalsın
  const guncelle = () => { liste = ekle(oku(), { yol: burasi(), href: location.pathname + location.search, ad: baslik() }); yaz(liste); ciz(); };
  for (const ad of ['replaceState', 'pushState']) {
    const asil = history[ad].bind(history);
    history[ad] = (...a) => { const r = asil(...a); try { guncelle(); } catch (e) {} return r; };
  }
  // Başka pencerede açılan ya da kapatılan sekmeler burada da görünür
  addEventListener('storage', (o) => { if (o.key === SEKME_ANAHTAR) { liste = oku(); if (!liste.some((s) => s.yol === burasi())) liste = ekle(liste, { yol: burasi(), href: location.pathname + location.search, ad: baslik() }); ciz(); } });
  ciz();
}
