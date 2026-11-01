// Toplu seçim (Muhittin, 1 Kas 2026): tabloda ilk sütunda onay kutusu, başlıkta "tümünü seç"; seçim yapılınca tablonun
// üstünde eylem çubuğu açılır: durum değiştir, etiket ekle/kaldır, CSV dışa aktar, arşivle. Silme yoktur; arşivleme onay ister.
// · Tablo (table) ya da kart listesi (doğrudan çocukları data-id taşıyan kap) ile çalışır. Satır/kart data-id taşımalıdır.
// · "Tümünü seç", sayfanın süzgeçle gizlemediği bütün kayıtları seçer (sayfalamayla görünmeyen sayfalar dâhil).
// · Seçim aynı anahtarla yeniden çizimde korunur; listede artık olmayan kayıt seçimden düşer.
// · CSV: UTF-8 BOM, noktalı virgül ayraç (Türkçe Excel), formül enjeksiyonuna karşı koruma.
import { api, el, genelHata } from './ortak.js';

const secimler = new Map(), cubuklar = new Map(), mesajlar = new Map();
const sayi = (n) => new Intl.NumberFormat('tr-TR').format(n);

export const csvHucre = (h) => `"${String(h ?? '').replace(/^([=+\-@\t\r])/, "'$1").replace(/"/g, '""')}"`;
export function csvIndir(bas, satirlar, dosya) {
  const csv = [bas, ...satirlar].map((s) => s.map(csvHucre).join(';')).join('\r\n') + '\r\n';
  const a = el('a', { href: URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })), download: dosya });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
// Tablo satırından düz metin (onay kutusu sütunu ve düğme simgeleri hariç).
// Açılır liste ya da giriş kutusu içeren hücrede yalnız seçili/yazılı değer alınır (seçeneklerin hepsi değil).
const hucreMetni = (c) => {
  const k = c.cloneNode(true);
  c.querySelectorAll('select, input:not([type=checkbox])').forEach((g, i) => {
    const deger = g.tagName === 'SELECT' ? (g.selectedOptions[0] ? g.selectedOptions[0].textContent : '') : g.value;
    k.querySelectorAll('select, input:not([type=checkbox])')[i].replaceWith(document.createTextNode(deger));
  });
  return k.textContent.replace(/[⧉✎↗]/g, '').replace(/ [↓↑]$/, '').replace(/\s+/g, ' ').trim();
};
export function tablodanCsv(tablo, secili) {
  const bas = [...tablo.tHead.rows[0].cells].filter((c) => !c.hasAttribute('data-toplu-hucre')).map(hucreMetni);
  const satirlar = [...tablo.tBodies[0].rows].filter((r) => secili.has(r.dataset.id)).map((r) => [...r.cells].filter((c) => !c.hasAttribute('data-toplu-hucre')).map(hucreMetni));
  return { bas, satirlar };
}

// Liste boşalınca ya da tablo görünümü kapanınca eski çubuk ve "tümünü seç" satırı kaldırılır.
export function topluTemizle(anahtar) {
  const eski = cubuklar.get(anahtar);
  if (eski) eski.forEach((x) => x.remove());
  cubuklar.delete(anahtar);
}

// hedef: table ya da kart kabı. s: { anahtar, ad (CSV dosya adı öneki), etiketTur, durumlar: [{deger, ad}], durumYaz(ids, deger),
//   arsivle(ids), arsivdenCikar(ids), arsivGorunum (true: arşiv listesi açık), csv(ids) → { bas, satirlar }, yenile() }
export function topluSecim(hedef, s) {
  const secili = secimler.get(s.anahtar) || new Set();
  secimler.set(s.anahtar, secili);
  const tabloMu = hedef.tagName === 'TABLE';
  const ogeler = () => (tabloMu ? [...hedef.tBodies[0].rows] : [...hedef.children]).filter((o) => o.dataset.id);
  const gorunen = () => ogeler().filter((o) => !o.hidden && o.style.display !== 'none');
  const mevcut = new Set(ogeler().map((o) => o.dataset.id));
  for (const id of [...secili]) if (!mevcut.has(id)) secili.delete(id);

  const tumKutu = el('input', { type: 'checkbox', 'aria-label': 'Tümünü seç', title: 'Tümünü seç' });
  const sayac = el('strong', { 'aria-live': 'polite' });
  const cubuk = el('div', { class: 'toplu-cubuk', role: 'region', 'aria-label': 'Toplu işlem', hidden: true });
  // Sonuç iletisi yeniden çizimden sonra yeni çubukta bir kez gösterilir.
  const durumMesaj = el('span', { class: 'toplu-mesaj', role: 'status' }, mesajlar.get(s.anahtar) || '');
  mesajlar.delete(s.anahtar);
  const eski = cubuklar.get(s.anahtar);
  if (eski) eski.forEach((x) => x.remove());

  const kutular = new Map();
  for (const o of ogeler()) {
    const k = el('input', { type: 'checkbox', 'aria-label': 'Seç: ' + (o.dataset.ad || o.dataset.id), checked: secili.has(o.dataset.id) || undefined,
      onchange: () => { if (k.checked) secili.add(o.dataset.id); else secili.delete(o.dataset.id); guncelle(); } });
    kutular.set(o.dataset.id, k);
    if (tabloMu) o.prepend(el('td', { 'data-toplu-hucre': '', class: 'toplu-hucre' }, k));
    else (o.querySelector('[data-toplu-yer]') || o).prepend(el('span', { class: 'toplu-kart-kutu' }, k));
  }
  if (tabloMu) {
    if (hedef.tHead) for (const [i, r] of [...hedef.tHead.rows].entries()) r.prepend(i === 0 ? el('th', { 'data-toplu-hucre': '', class: 'toplu-hucre', scope: 'col' }, tumKutu) : el('th', { 'data-toplu-hucre': '' }));
    if (hedef.tFoot) for (const r of hedef.tFoot.rows) r.prepend(el('td', { 'data-toplu-hucre': '' }));
  }
  tumKutu.addEventListener('change', () => {
    for (const o of gorunen()) { if (tumKutu.checked) secili.add(o.dataset.id); else secili.delete(o.dataset.id); }
    for (const [id, k] of kutular) k.checked = secili.has(id);
    guncelle();
  });

  async function calistir(dugme, is, basari) {
    const ids = [...secili];
    dugme.disabled = true; durumMesaj.textContent = '';
    try { await is(ids); secili.clear(); genelHata(''); durumMesaj.textContent = basari(ids.length); mesajlar.set(s.anahtar, durumMesaj.textContent); if (s.yenile) await s.yenile(); }
    catch (h) { durumMesaj.textContent = 'Yapılamadı: ' + h.message; }
    finally { dugme.disabled = false; }
  }

  const parcalar = [el('span', { class: 'toplu-sayi' }, sayac, ' seçili')];
  if (s.durumlar && s.durumYaz) {
    const sec = el('select', { 'aria-label': 'Yeni durum' }, el('option', { value: '' }, 'Durum değiştir…'), s.durumlar.map((d) => el('option', { value: d.deger }, d.ad)));
    const uygula = el('button', { type: 'button', class: 'dugme kucuk', onclick: () => {
      if (!sec.value) { durumMesaj.textContent = 'Önce yeni durumu seçin.'; return; }
      const ad = (s.durumlar.find((d) => d.deger === sec.value) || {}).ad;
      calistir(uygula, (ids) => s.durumYaz(ids, sec.value), (n) => `${sayi(n)} kayıt “${ad}” yapıldı.`);
    } }, 'Uygula');
    parcalar.push(el('span', { class: 'toplu-grup' }, sec, uygula));
  }
  if (s.etiketTur) {
    const giris = el('input', { type: 'text', maxlength: '40', placeholder: 'Etiket', 'aria-label': 'Etiket', list: 'toplu-etiket-' + s.anahtar });
    const oneriler = el('datalist', { id: 'toplu-etiket-' + s.anahtar }, (s.etiketler || []).map((e) => el('option', { value: e })));
    const etiket = (islem, dugme) => {
      const deger = giris.value.trim();
      if (!deger) { durumMesaj.textContent = 'Önce etiketi yazın.'; return; }
      calistir(dugme, (ids) => api('etiket/toplu', { tur: s.etiketTur, ids, etiket: deger, islem }), (n) => `${sayi(n)} kayıtta “${deger}” etiketi ${islem === 'ekle' ? 'eklendi' : 'kaldırıldı'}.`);
    };
    const ekle = el('button', { type: 'button', class: 'dugme kucuk', onclick: () => etiket('ekle', ekle) }, 'Etiket ekle');
    const kaldir = el('button', { type: 'button', class: 'dugme kucuk', onclick: () => etiket('kaldir', kaldir) }, 'Etiketi kaldır');
    parcalar.push(el('span', { class: 'toplu-grup' }, giris, oneriler, ekle, kaldir));
  }
  const csv = el('button', { type: 'button', class: 'dugme kucuk', onclick: () => {
    const ids = new Set(secili);
    const v = s.csv ? s.csv([...ids]) : tablodanCsv(hedef, ids);
    csvIndir(v.bas, v.satirlar, `${s.ad || 'kayitlar'}-secili-${new Date().toISOString().slice(0, 10)}.csv`);
    durumMesaj.textContent = `${sayi(v.satirlar.length)} satır CSV olarak indirildi.`;
  } }, 'CSV indir');
  parcalar.push(csv);
  if (s.arsivle && !s.arsivGorunum) {
    const ars = el('button', { type: 'button', class: 'dugme kucuk', onclick: () => {
      const n = secili.size;
      if (!confirm(`${sayi(n)} kayıt arşivlensin mi?\nArşivlenen kayıt silinmez; listeden kalkar ve “Arşivi göster” ile geri alınabilir.`)) return;
      calistir(ars, (ids) => s.arsivle(ids), (k) => `${sayi(k)} kayıt arşivlendi.`);
    } }, 'Arşivle');
    parcalar.push(ars);
  }
  if (s.arsivdenCikar && s.arsivGorunum) {
    const geri = el('button', { type: 'button', class: 'dugme kucuk', onclick: () => calistir(geri, (ids) => s.arsivdenCikar(ids), (k) => `${sayi(k)} kayıt arşivden çıkarıldı.`) }, 'Arşivden çıkar');
    parcalar.push(geri);
  }
  parcalar.push(el('button', { type: 'button', class: 'dugme kucuk toplu-temizle', onclick: () => { secili.clear(); durumMesaj.textContent = ''; for (const k of kutular.values()) k.checked = false; guncelle(); } }, 'Seçimi temizle'));
  // Seçim yokken yalnız son işlemin sonucu görünür; eylem düğmeleri gizlenir.
  const eylemler = el('span', { class: 'toplu-eylemler' }, ...parcalar);
  cubuk.append(eylemler, durumMesaj);
  // Çubuk tablonun (ya da kaydırma sarmalının) hemen üstüne konur.
  const yer = tabloMu && hedef.parentElement && hedef.parentElement.children.length === 1 ? hedef.parentElement : hedef;
  // Kart listesinde başlık satırı yoktur: "Tümünü seç" kutusu listenin üstüne konur.
  const tumSatir = tabloMu ? null : el('label', { class: 'toplu-tumu' }, tumKutu, el('span', {}, 'Tümünü seç'));
  if (tumSatir) yer.before(tumSatir);
  yer.before(cubuk);
  cubuklar.set(s.anahtar, [cubuk, tumSatir].filter(Boolean));

  function guncelle() {
    const g = gorunen().map((o) => o.dataset.id);
    const secGor = g.filter((id) => secili.has(id)).length;
    tumKutu.checked = g.length > 0 && secGor === g.length;
    tumKutu.indeterminate = secGor > 0 && secGor < g.length;
    sayac.textContent = sayi(secili.size);
    eylemler.hidden = secili.size === 0;
    cubuk.hidden = secili.size === 0 && !durumMesaj.textContent;
  }
  guncelle();
  return { secili, cubuk };
}
