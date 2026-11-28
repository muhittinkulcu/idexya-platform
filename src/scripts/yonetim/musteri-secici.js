// Üst alandaki ortak müşteri seçicisi (1.3, Muhittin 18 Kas 2026; seçenek A). Kabuğun ürün yuvasına (`ustYuva`) konur.
// · Liste: `ana_musteri` önbelleği (GET /api/yonetim/ana-kayit/musteriler; IDOS'a istek gitmez). "Tüm müşteriler" + aktif
//   müşteriler, aranabilir. Seçili müşteri aktif değilse de listede kalır.
// · Seçim ortak `idx-musteri` anahtarına yazılır (kabuk-cekirdek.js musteriYaz); açılışta musteriOku ile okunur. Listede
//   olmayan kimlik yok sayılır ve anahtar temizlenir (liste alınamazsa dokunulmaz). Başka sekmedeki değişiklik `storage` ile gelir.
// · Sayfa süzülmüyorsa (Yonetim.astro `musteriSuzgec` yok) seçici yine görünür ama "Bu sayfa müşteriye göre süzülmez" der.
// · Müşteri adı yalnız seçicide görünür; adrese ya da sekme adına yazılmaz (kabuk README kuralı). Metinler textContent ile.
import { api } from './ortak.js';
import { MUSTERI_ANAHTARI } from '../../idexya-kabuk/kabuk-cekirdek.js';
import { seciciListesi, gecerliSecim } from '../../data/musteri-secim.js';
import { OLAY, seciliMusteri, musteriSec } from './musteri-suzgec.js';

const SUZULMEZ = 'Bu sayfa müşteriye göre süzülmez; seçim öteki sayfalara ve modüllere taşınır.';
let liste = null; // null: henüz alınmadı ya da alınamadı

function h(etiket, ozellik = {}, ...cocuk) {
  const e = document.createElement(etiket);
  for (const [k, v] of Object.entries(ozellik)) {
    if (k === 'metin') e.textContent = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) e.setAttribute(k, v === true ? '' : v);
  }
  e.append(...cocuk.flat().filter(Boolean));
  return e;
}

// Açılır ok (IDOS MusteriSecici.tsx: yalnız ad + ok, 32 px; seçici üstünde "Müşteri" etiketi yok).
function ok() {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('class', 'ms-ok'); s.setAttribute('aria-hidden', 'true');
  const p = document.createElementNS('http://www.w3.org/2000/svg', 'path'); p.setAttribute('d', 'm6 9 6 6 6-6'); s.append(p);
  return s;
}

function kur(kabuk) {
  const yuva = kabuk && kabuk.ustYuva;
  if (!yuva || yuva.querySelector('.ms')) return;
  const sargi = document.querySelector('.yonetim');
  const suzulur = !!(sargi && sargi.hasAttribute('data-musteri-suzgec'));

  const ad = h('span', { class: 'ms-ad', metin: 'Tüm müşteriler' });
  const dugme = h('button', { type: 'button', class: 'ms-dugme', 'aria-haspopup': 'listbox', 'aria-expanded': 'false', title: suzulur ? 'Müşteri seçimi' : SUZULMEZ, 'data-suzulur': suzulur ? 'evet' : 'hayir' },
    ad,
    suzulur ? null : h('span', { class: 'ms-nokta', role: 'img', 'aria-label': 'Bu sayfa müşteriye göre süzülmez' }),
    ok());
  const ara = h('input', { type: 'search', class: 'ms-ara', placeholder: 'Müşteri ara…', 'aria-label': 'Müşteri ara', autocomplete: 'off' });
  const ul = h('ul', { class: 'ms-liste', role: 'listbox', 'aria-label': 'Müşteriler' });
  const durum = h('p', { class: 'ms-durum', role: 'status', hidden: true });
  const acilir = h('div', { class: 'ms-acilir', hidden: true },
    suzulur ? null : h('p', { class: 'ms-ipucu', metin: SUZULMEZ }), ara, ul, durum);
  const kutu = h('div', { class: 'ms', 'data-musteri-secici': '' }, dugme, acilir);
  yuva.append(kutu);

  const secenekler = () => [...ul.querySelectorAll('[role=option]')];
  function adYaz() {
    const id = seciliMusteri();
    const m = id && Array.isArray(liste) ? liste.find((x) => x.id === id) : null;
    ad.textContent = !id ? 'Tüm müşteriler' : m ? m.ad : Array.isArray(liste) ? 'Seçili müşteri' : '…';
    dugme.classList.toggle('ms-secili', !!id);
    // Konum yolunun ilk parçası (IDOS gibi): müşteriye göre süzülen sayfada seçili müşteri, öteki sayfalarda "Ajans geneli".
    const konum = document.querySelector('[data-konum-musteri]');
    if (konum && suzulur) konum.textContent = ad.textContent;
  }
  function satir(id, metin, secili) {
    return h('li', {}, h('button', { type: 'button', role: 'option', class: 'ms-secenek', 'aria-selected': secili ? 'true' : 'false', 'data-id': id, metin, onclick: () => sec(id) }));
  }
  function listeCiz() {
    const id = seciliMusteri();
    if (!Array.isArray(liste)) {
      ul.replaceChildren(satir('', 'Tüm müşteriler', !id));
      durum.hidden = false;
      durum.textContent = 'Müşteri listesi alınamadı. Sayfayı yenileyip yeniden deneyin.';
      return;
    }
    const gor = seciciListesi(liste, id, ara.value);
    ul.replaceChildren(...(ara.value.trim() ? [] : [satir('', 'Tüm müşteriler', !id)]), ...gor.map((m) => satir(m.id, m.ad, m.id === id)));
    durum.hidden = !!gor.length && !!liste.length;
    durum.textContent = !liste.length ? 'Müşteri listesi boş: IDOS ana kayıt önbelleği henüz eşitlenmedi.' : gor.length ? '' : 'Aramayla eşleşen müşteri yok.';
  }
  function ac(acik) {
    acilir.hidden = !acik;
    dugme.setAttribute('aria-expanded', String(acik));
    if (acik) { ara.value = ''; listeCiz(); setTimeout(() => ara.focus(), 0); }
  }
  function sec(id) {
    if (id !== seciliMusteri()) musteriSec(id);
    ac(false);
    dugme.focus();
  }

  dugme.addEventListener('click', () => ac(acilir.hidden));
  ara.addEventListener('input', listeCiz);
  ara.addEventListener('keydown', (o) => {
    const s = secenekler();
    if (o.key === 'Enter') { o.preventDefault(); const tek = s.filter((b) => b.dataset.id); if (tek.length === 1) sec(tek[0].dataset.id); }
    else if (o.key === 'ArrowDown' && s.length) { o.preventDefault(); s[0].focus(); }
  });
  ul.addEventListener('keydown', (o) => {
    const s = secenekler(), i = s.indexOf(document.activeElement);
    if (o.key === 'ArrowDown' && i < s.length - 1) { o.preventDefault(); s[i + 1].focus(); }
    else if (o.key === 'ArrowUp') { o.preventDefault(); (i > 0 ? s[i - 1] : ara).focus(); }
  });
  kutu.addEventListener('keydown', (o) => { if (o.key === 'Escape' && !acilir.hidden) { o.stopPropagation(); ac(false); dugme.focus(); } });
  document.addEventListener('mousedown', (o) => { if (!acilir.hidden && !kutu.contains(o.target)) ac(false); });
  document.addEventListener(OLAY, () => { adYaz(); if (!acilir.hidden) listeCiz(); });
  // Başka sekmede (Marketing, Creative ya da başka Website sekmesi) seçim değişti: bu sekmedeki sayfa da izler.
  addEventListener('storage', (o) => {
    if (o.key !== MUSTERI_ANAHTARI && o.key !== null) return;
    document.dispatchEvent(new CustomEvent(OLAY, { detail: { id: seciliMusteri() } }));
  });

  adYaz();
  api('ana-kayit/musteriler').then((v) => {
    liste = Array.isArray(v.musteriler) ? v.musteriler : [];
    // Listede olmayan kimlik yok sayılır ve anahtar temizlenir. Liste boşsa (önbellek eşitlenmemiş) karar verilmez.
    const id = seciliMusteri();
    if (id && liste.length && !gecerliSecim(id, liste)) musteriSec('');
    adYaz();
    if (!acilir.hidden) listeCiz();
  }).catch(() => { liste = null; adYaz(); });
}

function baslat() {
  const kabuk = document.querySelector('idexya-kabuk');
  if (!kabuk) return;
  if (kabuk.ustYuva) kur(kabuk);
  else kabuk.addEventListener('idexya-kabuk:hazir', () => kur(kabuk), { once: true });
}
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', baslat, { once: true });
  else baslat();
}
