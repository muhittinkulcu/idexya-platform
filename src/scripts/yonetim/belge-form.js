// "Müşteriye belge oluştur" değişken formu (metin şablonları). Alanlar sablon-tanim.js tanımlarından kurulur; türüne uygun
// girdi kullanılır (tarih seçici, TL alanı, açılır liste, işaret kutusu, küçük tablo). Metinler textContent ile yazılır.
import { el } from './ortak.js';
import { kurusOku } from './sablon-hesap.js';
import { TANIMLAR, MUSTERI_ALANLARI, degerleriHazirla, varsayilan } from './sablon-tanim.js';
import { sayfaKosulu, degiskenleriBul, SINIR } from './sablon-metin.js';

const GIRDI = 'min-height: 38px; padding: 6px 10px; border: 1px solid rgb(var(--line)); border-radius: 10px; background: var(--bg); color: var(--tx); font: inherit; box-sizing: border-box; width: 100%';
const insanAdi = (k) => { const s = k.replace(/_/g, ' '); return s.charAt(0).toLocaleUpperCase('tr') + s.slice(1); };

// kutu: form alanlarının konacağı öğe. b: { tarih, belgeNo, musteri, ajans }. sayfalar: şablon sürümünün sayfaları.
// Döner: { ham, degerler(), uyari(), bosAlanlar(), yenile(b) }
export function belgeFormu(kutu, { tur, sayfalar, b, katalog = [], degisti = () => {} }) {
  const t = TANIMLAR[tur] || { alanlar: [] };
  const ham = {};
  for (const a of MUSTERI_ALANLARI) ham[a.k] = String((b.musteri || {})[a.kaynak] ?? '');
  for (const a of t.alanlar) ham[a.k] = varsayilan(a, b);
  // Şablon metninde olup tanımı olmayan değişkenler serbest metin alanı olur
  const bilinen = new Set(Object.keys(degerleriHazirla(tur, ham, b)));
  const ek = [...new Set(sayfalar.flatMap((s) => degiskenleriBul(s.metin || '')))].filter((k) => !bilinen.has(k)).map((k) => ({ k, ad: insanAdi(k), tur: 'metin' }));
  for (const a of ek) ham[a.k] = '';
  const satirlar = new Map(); // alan → { tbody, ciz }
  const dl = el('datalist', { id: 'belge-katalog' }, ...katalog.map((h) => el('option', { value: h.ad })));

  const degerler = () => { const d = degerleriHazirla(tur, ham, b); for (const a of ek) d[a.k] = ham[a.k]; return d; };
  const gorunur = (a, d) => !a.gorunur || sayfaKosulu(a.gorunur, d);

  function girdi(a, deger, yaz, etiket) {
    const ortak = { style: GIRDI, 'aria-label': etiket || a.ad };
    if (a.tur === 'tarih') return el('input', { ...ortak, type: 'date', value: deger || '', oninput: (o) => yaz(o.target.value) });
    if (a.tur === 'sayi') return el('input', { ...ortak, type: 'number', min: 0, max: 99999, inputmode: 'numeric', value: deger ?? '', oninput: (o) => yaz(o.target.value) });
    if (a.tur === 'tutar') {
      const g = el('input', { ...ortak, inputmode: 'decimal', placeholder: 'Ör. 18.000', value: deger ?? '', 'aria-invalid': String(Number.isNaN(kurusOku(deger))),
        oninput: (o) => { o.target.setAttribute('aria-invalid', String(Number.isNaN(kurusOku(o.target.value)))); yaz(o.target.value); } });
      return g;
    }
    if (a.tur === 'secim') return el('select', { ...ortak, onchange: (o) => yaz(o.target.value) }, ...a.secenekler.map((s) => el('option', { value: s.v, selected: s.v === deger }, s.ad)));
    if (a.tur === 'katalog') return el('input', { ...ortak, list: 'belge-katalog', maxlength: 200, value: deger || '', placeholder: 'Katalogdan seçin', oninput: (o) => yaz(o.target.value) });
    if (a.tur === 'uzun') return el('textarea', { ...ortak, rows: 3, maxlength: SINIR.uzun, style: GIRDI + '; resize: vertical', oninput: (o) => yaz(o.target.value) }, deger || '');
    return el('input', { ...ortak, type: 'text', maxlength: SINIR.deger, value: deger || '', autocomplete: 'off', oninput: (o) => yaz(o.target.value) });
  }

  function satirTablo(a) {
    const govde = el('tbody');
    const hesapF = (t.satirHesap || {})[a.k];
    const ciz = () => {
      govde.replaceChildren(...ham[a.k].map((r, i) => el('tr', {},
        ...a.sutunlar.map((s) => el('td', { style: 'padding: 4px' }, s.tur === 'hesap'
          ? el('span', { 'data-hesap': '', style: 'font-size: 13px; color: var(--tx2); white-space: nowrap' }, (hesapF && hesapF(r, ham)) || '—')
          : girdi(s, r[s.k], (v) => { r[s.k] = v; guncelle(); }, `${i + 1}. satır: ${s.ad}`))),
        el('td', { style: 'padding: 4px; width: 1%' }, el('button', { type: 'button', class: 'dugme kucuk', 'aria-label': `${i + 1}. satırı kaldır`, onclick: () => { ham[a.k].splice(i, 1); ciz(); guncelle(); } }, 'Kaldır')))));
    };
    satirlar.set(a.k, { ciz, govde, hesapF, a });
    ciz();
    return el('div', { style: 'display: flex; flex-direction: column; gap: 6px' },
      el('div', { style: 'overflow-x: auto' }, el('table', { class: 'sb-tablo', 'data-sayfalama': 'yok', style: 'min-width: 560px' },
        el('thead', {}, el('tr', {}, ...a.sutunlar.map((s) => el('th', { scope: 'col' }, s.ad)), el('th', { scope: 'col' }, el('span', { class: 'sb-gizli' }, 'İşlem')))), govde)),
      el('div', {}, el('button', { type: 'button', class: 'dugme kucuk', onclick: () => { if (ham[a.k].length >= SINIR.satir) return; ham[a.k].push({}); ciz(); guncelle(); } }, '+ Satır ekle')));
  }

  const alanlar = []; // { a, kap }
  const bolum = (baslik, liste) => el('fieldset', { style: 'border: 0; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(min(240px, 100%), 1fr)); gap: 12px; align-items: end' },
    el('legend', { style: 'font-size: 14px; font-weight: 500; color: var(--head); padding: 0 0 8px' }, baslik),
    ...liste.map((a) => {
      let ic;
      if (a.tur === 'coklu') {
        ic = el('div', { role: 'group', 'aria-label': a.ad, style: 'display: flex; flex-wrap: wrap; gap: 6px 16px' }, ...a.secenekler.map((s) => el('label', { style: 'display: inline-flex; gap: 6px; align-items: center; font-size: 14px; font-weight: 400' },
          el('input', { type: 'checkbox', checked: ham[a.k].includes(s.v), onchange: (o) => { ham[a.k] = o.target.checked ? [...new Set([...ham[a.k], s.v])] : ham[a.k].filter((x) => x !== s.v); guncelle(); } }), s.ad)));
      } else if (a.tur === 'satirlar') ic = satirTablo(a);
      else ic = girdi(a, ham[a.k], (v) => { ham[a.k] = v; guncelle(); });
      const genis = ['coklu', 'satirlar', 'uzun'].includes(a.tur);
      const kap = el('div', { class: 'alan', style: genis ? 'grid-column: 1 / -1' : '' }, el('span', { style: 'font-size: 13px; color: var(--tx2)' }, a.ad), ic);
      alanlar.push({ a, kap });
      return kap;
    }));

  const uyariKutu = el('p', { class: 'uyari', role: 'status', hidden: true, style: 'margin: 0' });
  kutu.replaceChildren(dl,
    bolum('Müşteri bilgileri (CRM kartından; bu belge için değiştirilebilir)', MUSTERI_ALANLARI),
    t.alanlar.length ? bolum('Belge bilgileri', t.alanlar) : '',
    ek.length ? bolum('Şablondaki öteki alanlar', ek) : '',
    uyariKutu);

  function guncelle() {
    const d = degerler();
    for (const { a, kap } of alanlar) kap.hidden = !gorunur(a, d);
    for (const { govde, hesapF, a } of satirlar.values()) if (hesapF) govde.querySelectorAll('[data-hesap]').forEach((x, i) => { x.textContent = hesapF(ham[a.k][i] || {}, ham) || '—'; });
    const u = t.uyari ? t.uyari(d, ham, b) : '';
    uyariKutu.textContent = u; uyariKutu.hidden = !u;
    degisti();
  }
  guncelle();

  return {
    ham, degerler,
    // Görünür ama boş alanlar (PDF'te "—" basılır)
    bosAlanlar() {
      const d = degerler();
      return [...MUSTERI_ALANLARI, ...t.alanlar, ...ek].filter((a) => gorunur(a, d) && a.tur !== 'coklu' && (a.tur === 'satirlar' ? !d[a.k].length : !String(d[a.k] ?? '').trim())).map((a) => a.ad);
    },
    hatalar() {
      const l = [];
      for (const a of t.alanlar) {
        if (a.tur === 'tutar' && Number.isNaN(kurusOku(ham[a.k]))) l.push(a.ad);
        if (a.tur === 'satirlar') for (const s of a.sutunlar) if (s.tur === 'tutar' && ham[a.k].some((r) => Number.isNaN(kurusOku(r[s.k])))) l.push(`${a.ad}: ${s.ad}`);
      }
      return l;
    },
    yenile(yb) { Object.assign(b, yb); guncelle(); }
  };
}
