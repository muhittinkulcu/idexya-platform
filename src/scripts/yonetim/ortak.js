// Yönetim paneli ortak yardımcıları. Sunucudan gelen her metin textContent ile yazılır (HTML olarak yorumlanmaz).
import { adresMetni, adrestenOku, capaTr } from '../../data/panel-parametre.js';
export { adresMetni, capaTr };
// Adres seçeneğini Türkçe adıyla okur (adres İngilizce: ?tab=new → prm('sekme') === 'yeni')
export const prm = (ad) => adrestenOku(ad, location.search);
export const ASAMALAR = [
  { k: 'yeni', ad: 'Yeni' }, { k: 'gorusme', ad: 'Görüşülüyor' }, { k: 'teklif', ad: 'Teklif gönderildi' },
  { k: 'goruldu', ad: 'Teklif görüldü' }, { k: 'kazanildi', ad: 'Kazanıldı' }, { k: 'kaybedildi', ad: 'Kaybedildi' }
];
export const asamaAdi = (k) => (ASAMALAR.find((a) => a.k === k) || { ad: k || '—' }).ad;
export const KAYNAK = { iletisim: 'İletişim formu', analiz: 'Ücretsiz analiz formu', paket: 'Paket teklif formu', sihirbaz: 'Paket sihirbazı', asistan: 'Yapay zekâ asistanı', form: 'Web formu' };
export const TALEP_DURUM = { yeni: 'Yeni', crm: 'CRM’e alındı', spam: 'Spam' };

export function el(etiket, ozellik = {}, ...cocuklar) {
  const e = document.createElement(etiket);
  for (const [k, v] of Object.entries(ozellik || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'style') e.style.cssText = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const c of cocuklar.flat()) if (c !== null && c !== undefined && c !== false) e.append(c instanceof Node ? c : String(c));
  return e;
}

const iki = (n) => String(n).padStart(2, '0');
// TDK: tarih 19.10.2026, saat 08.15
export function tarih(iso, saatli = true) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d)) return '—';
  const t = `${iki(d.getDate())}.${iki(d.getMonth() + 1)}.${d.getFullYear()}`;
  return saatli ? `${t} ${iki(d.getHours())}.${iki(d.getMinutes())}` : t;
}
export function once(iso) {
  const fark = (Date.now() - new Date(iso).getTime()) / 60000;
  if (!isFinite(fark)) return '—';
  if (fark < 1) return 'az önce';
  if (fark < 60) return `${Math.floor(fark)} dk önce`;
  if (fark < 1440) return `${Math.floor(fark / 60)} sa önce`;
  return tarih(iso, false);
}
export const para = (n) => (n === null || n === undefined || n === '' ? '—' : new Intl.NumberFormat('tr-TR').format(n) + ' TL');

export async function api(yol, govde) {
  const r = await fetch('/api/yonetim/' + yol, govde === undefined ? { credentials: 'same-origin' } : {
    method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(govde)
  });
  const s = await r.json().catch(() => ({ ok: false, hata: 'Sunucudan geçersiz yanıt geldi' }));
  if (!r.ok || !s.ok) {
    const h = new Error(s.hata || `İstek başarısız (${r.status})`);
    h.durum = r.status;
    throw h;
  }
  return s;
}

export function genelHata(metin) {
  const k = document.querySelector('[data-genel-hata]');
  if (!k) return;
  k.hidden = !metin; k.textContent = metin || '';
}

export function sayacGuncelle(ozet) {
  // Bilinmiyorsa veya sıfırsa gizli; yalnız bilinen ve sıfırdan büyük sayı görünür.
  const yaz = (ad, n) => { const r = document.querySelector(`[data-sayac="${ad}"]`); if (!r) return; r.hidden = !(n > 0); r.textContent = n > 0 ? String(n) : ''; };
  const say = (liste, d) => (liste ? (liste.find((t) => t.durum === d) || { n: 0 }).n : null);
  yaz('talep', ozet ? say(ozet.talepler, 'yeni') : null);
  yaz('uye', ozet ? say(ozet.uyeler, 'bekliyor') : null);
  yaz('yorum', ozet && ozet.bekleyenYorum !== undefined ? ozet.bekleyenYorum : null);
  yaz('destek', ozet && ozet.bekleyenDestek !== undefined ? ozet.bekleyenDestek : null);
}

const TERCIH_ANAHTAR = 'idx-panel';
const VARSAYILAN = { ustAcik: true, ustSabit: true, ustBoy: 'normal', u: { tarih: true, arama: true, hizli: true }, yanMod: 'genis', yanSabit: true, idosKart: true, acik: {}, favori: [], gizli: [] };
function tercihOku() {
  try { const s = JSON.parse(localStorage.getItem(TERCIH_ANAHTAR) || '{}'); return { ...VARSAYILAN, ...s, u: { ...VARSAYILAN.u, ...(s.u || {}) } }; }
  catch (e) { return JSON.parse(JSON.stringify(VARSAYILAN)); }
}
function tercihYaz(t) { try { localStorage.setItem(TERCIH_ANAHTAR, JSON.stringify(t)); } catch (e) {} }
const kucuk = (s) => String(s || '').toLocaleLowerCase('tr');

export function kabuk() {
  const $ = (s, k = document) => k.querySelector(s);
  const $$ = (s, k = document) => [...k.querySelectorAll(s)];
  const yan = $('#yan'), ust = $('#ust'), ustAc = $('[data-ust-ac]');
  let t = tercihOku();

  // Tarih (TDK: 20 Ekim 2026, Salı)
  const tr = $('[data-tarih]');
  if (tr) tr.textContent = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' }).format(new Date()) + ' ·';

  // Aktif alt sayfayı işaretle ve sayfa yoluna alt sekmeyi ekle. Sekmeler adresi history.replaceState ile değiştirir;
  // bu yüzden adres değişince ikisi yeniden hesaplanır.
  const yolKutu = $('[data-yol]');
  function konumGuncelle() {
    const burasi = location.pathname + location.search, hashli = burasi + location.hash;
    let secili = null;
    $$('[data-alt-link]').forEach((a) => {
      const h = a.getAttribute('href'), es = h === hashli || h === burasi;
      if (es && !secili) { secili = a; a.setAttribute('aria-current', 'page'); } else a.removeAttribute('aria-current');
    });
    if (!yolKutu) return;
    $$('[data-yol-alt]', yolKutu).forEach((e) => e.remove());
    const son = $('[data-yol-son]', yolKutu), baslik = $('[data-baslik]', son), modulHref = yolKutu.dataset.modulHref;
    const modulLi = $('[data-yol-modul]', yolKutu);
    if (modulLi) modulLi.remove();
    // Alt sekme yalnız bu sayfanın modülüne aitse ve modül adı başlıkla aynıysa eklenir (ör. Satış › Talepler › Yeni)
    if (secili && modulHref && secili.getAttribute('href') !== modulHref && secili.pathname === location.pathname && baslik.textContent.trim() === yolKutu.dataset.modulAd) {
      son.hidden = true;
      son.before(el('li', { 'data-yol-modul': '' }, el('a', { href: modulHref, class: 'yol-modul' }, yolKutu.dataset.modulAd)));
      son.after(el('li', { 'data-yol-alt': '' }, el('span', { class: 'yol-alt', 'aria-current': 'page' }, secili.dataset.ad || secili.textContent.trim())));
    } else son.hidden = false;
  }
  konumGuncelle();
  for (const ad of ['replaceState', 'pushState']) {
    const asil = history[ad].bind(history);
    history[ad] = (...a) => { const r = asil(...a); try { konumGuncelle(); } catch (e) {} return r; };
  }
  addEventListener('popstate', konumGuncelle); addEventListener('hashchange', konumGuncelle);

  function uygula() {
    yan.classList.toggle('dar', t.yanMod === 'dar');
    yan.classList.toggle('gizli', t.yanMod === 'gizli');
    yan.classList.toggle('sabit', !!t.yanSabit);
    $('[data-yan-ac]').hidden = t.yanMod !== 'gizli';
    const ys = $('[data-yan-sabitle]');
    if (ys) { ys.setAttribute('aria-pressed', String(!!t.yanSabit)); ys.title = t.yanSabit ? 'Menü sabit · çözmek için tıkla' : 'Menüyü sabitle'; }
    ucanKapat();
    ust.hidden = !t.ustAcik; ustAc.hidden = !!t.ustAcik;
    ust.classList.toggle('sabit', !!t.ustSabit);
    ust.classList.toggle('ince', t.ustBoy === 'ince');
    $('[data-ust-serit]').hidden = t.ustBoy !== 'genis';
    const us = $('[data-ust-sabitle]'); if (us) us.setAttribute('aria-pressed', String(!!t.ustSabit));
    $$('[data-u]').forEach((e) => { e.hidden = t.u[e.dataset.u] === false; });
    const ik = $('[data-idos-kart]'); if (ik) ik.hidden = !t.idosKart || t.yanMod !== 'genis';
    // Menüde gizlenen modüller
    $$('[data-modul]').forEach((m) => { m.hidden = !m.dataset.sabit && t.gizli.includes(m.dataset.modul); });
    // Açık modüller (aktif sayfanın modülü her zaman açık gelir)
    $$('[data-ac]').forEach((b) => {
      const aktif = b.getAttribute('aria-current') === 'page';
      const acik = b.dataset.ac in t.acik ? !!t.acik[b.dataset.ac] : aktif;
      b.setAttribute('aria-expanded', String(acik));
      const alt = $(`[data-alt="${b.dataset.ac}"]`); if (alt) alt.hidden = !acik;
    });
    // Sık kullanılanlar
    const fav = $('[data-favoriler]');
    fav.replaceChildren(...t.favori.map((k) => $(`[data-modul="${k}"]`)).filter(Boolean).map((m) => el(m.dataset.href ? 'a' : 'span', { class: 'mo' + (m.dataset.href ? '' : ' yakinda'), href: m.dataset.href || undefined }, el('span', { style: 'color: var(--brand)' }, '★'), el('span', { class: 'etiket' }, m.dataset.ad))));
    $('[data-favori-blok]').hidden = !t.favori.length;
    // Çekmece kontrolleri
    $$('[data-t]').forEach((c) => { c.checked = !!t[c.dataset.t]; });
    $$('[data-u-t]').forEach((c) => { c.checked = t.u[c.dataset.uT] !== false; });
    $$('[data-segment]').forEach((g) => $$('button', g).forEach((b) => b.setAttribute('aria-pressed', String(t[g.dataset.segment] === b.dataset.v))));
  }
  const kaydet = () => { tercihYaz(t); uygula(); };

  // Dar menü: modülün üzerine gelince (veya klavyeyle odaklanınca) adı ve alt sayfaları yanda açılır.
  // Fare menüden listeye geçerken kapanmasın diye kapanış kısa bir gecikmeyle yapılır.
  let ucanZaman;
  function ucanKapat() { clearTimeout(ucanZaman); if (ucan) ucan.hidden = true; }
  const ucanPlanla = () => { clearTimeout(ucanZaman); ucanZaman = setTimeout(ucanKapat, 180); };
  function ucanAc(m) {
    if (!ucan || !yan.classList.contains('dar') || matchMedia('(max-width: 860px)').matches) return;
    clearTimeout(ucanZaman);
    const altlar = $$('[data-alt] [data-ad]', m);
    const sayac = $('[data-sayac]', m);
    const yakinda = !m.dataset.href && !$$('[data-alt-link]', m).length;
    const ek = [sayac && !sayac.hidden ? el('span', { class: 'rozet' }, sayac.textContent) : null, yakinda ? el('small', {}, 'Yakında') : null];
    ucan.replaceChildren(
      m.dataset.href ? el('a', { class: 'ucan-bas', href: m.dataset.href }, el('span', {}, m.dataset.ad), ...ek) : el('span', { class: 'ucan-bas' }, el('span', {}, m.dataset.ad), ...ek),
      ...(altlar.length ? [el('div', { class: 'ucan-cizgi' })] : []),
      ...altlar.map((a) => a.tagName === 'A'
        ? el('a', { class: 'alt-ln', href: a.getAttribute('href'), 'aria-current': a.getAttribute('aria-current') || undefined }, a.dataset.ad)
        : el('span', { class: 'alt-ln' }, a.dataset.ad, el('small', {}, 'Yakında'))));
    ucan.hidden = false;
    const r = m.getBoundingClientRect();
    ucan.style.left = Math.round(yan.getBoundingClientRect().right + 8) + 'px';
    ucan.style.top = Math.round(Math.max(8, Math.min(r.top, innerHeight - ucan.offsetHeight - 8))) + 'px';
  }
  const ucan = $('[data-ucan]');
  if (ucan) {
    // Liste açıkken fare sağa (listeye doğru) gidiyorsa, yoldaki başka modüle hemen geçme: çapraz giderken liste değişmesin.
    let onceki = { x: 0, y: 0 }, son = { x: 0, y: 0 }, gecis;
    yan.addEventListener('mousemove', (o) => { onceki = son; son = { x: o.clientX, y: o.clientY }; });
    $$('[data-modul]').forEach((m) => {
      m.addEventListener('mouseenter', () => {
        clearTimeout(gecis);
        if (!ucan.hidden && son.x > onceki.x) { clearTimeout(ucanZaman); gecis = setTimeout(() => { if (m.matches(':hover')) ucanAc(m); }, 260); }
        else ucanAc(m);
      });
      m.addEventListener('mouseleave', ucanPlanla);
      m.addEventListener('focusin', () => ucanAc(m));
    });
    ucan.addEventListener('mouseenter', () => { clearTimeout(ucanZaman); clearTimeout(gecis); });
    ucan.addEventListener('mouseleave', ucanPlanla);
    document.addEventListener('focusin', (o) => { if (!ucan.contains(o.target) && !o.target.closest('[data-modul]')) ucanKapat(); });
    document.addEventListener('keydown', (o) => { if (o.key === 'Escape') ucanKapat(); });
    addEventListener('resize', ucanKapat);
    addEventListener('scroll', ucanKapat, { passive: true });
    const govde = $('#yan-govde'); if (govde) govde.addEventListener('scroll', ucanKapat, { passive: true });
  }

  // Menü: başlık yalnız kendi alt menüsünü açar/kapatır (sayfa değiştirmez, diğerlerine dokunmaz). Sayfalara alt bağlantılardan gidilir.
  // Dar menüde alt liste görünmediği için başlık doğrudan sayfaya gider.
  $$('[data-ac]').forEach((b) => b.addEventListener('click', () => {
    if (t.yanMod === 'dar' && b.dataset.git) { location.href = b.dataset.git; return; }
    t.acik[b.dataset.ac] = b.getAttribute('aria-expanded') !== 'true';
    kaydet();
  }));
  // Tümünü aç / kapat: açık olan varsa hepsini kapatır, yoksa hepsini açar
  const tumu = $('[data-tumu]');
  const tumuCiz = () => { if (!tumu) return; const hepsi = $$('[data-ac]').every((b) => b.getAttribute('aria-expanded') === 'true'); tumu.setAttribute('aria-pressed', String(hepsi)); tumu.setAttribute('aria-label', hepsi ? 'Tüm alt menüleri kapat' : 'Tüm alt menüleri aç'); };
  if (tumu) tumu.addEventListener('click', () => {
    const ac = tumu.getAttribute('aria-pressed') !== 'true';
    $$('[data-ac]').forEach((b) => { t.acik[b.dataset.ac] = ac; });
    kaydet(); tumuCiz();
  });
  $$('[data-ac]').forEach((b) => b.addEventListener('click', () => setTimeout(tumuCiz)));
  tumuCiz();
  // Menü araması
  const menuAra = $('[data-menu-ara]');
  if (menuAra) menuAra.addEventListener('input', () => {
    const q = kucuk(menuAra.value.trim());
    $$('[data-grup]').forEach((g) => {
      let gorunen = 0;
      $$('[data-modul]', g).forEach((m) => {
        if (!m.dataset.sabit && t.gizli.includes(m.dataset.modul)) { m.hidden = true; return; }
        const altlar = $$('[data-alt] [data-ad]', m);
        const adUyar = kucuk(m.dataset.ad).includes(q);
        const altUyar = altlar.filter((a) => kucuk(a.dataset.ad).includes(q));
        const gor = !q || adUyar || altUyar.length > 0;
        m.hidden = !gor; if (gor) gorunen++;
        const alt = $('[data-alt]', m);
        if (alt && q) { alt.hidden = !(adUyar || altUyar.length); altlar.forEach((a) => { a.hidden = !(adUyar || kucuk(a.dataset.ad).includes(q)); }); }
        if (alt && !q) { altlar.forEach((a) => { a.hidden = false; }); }
      });
      g.hidden = !gorunen;
    });
    if (!q) uygula();
  });

  // Panel araması (üst çubuk): modül ve alt sayfalara gider
  const pa = $('[data-panel-ara]'), sonuc = $('[data-ara-sonuc]');
  const hedefler = () => $$('[data-modul]').flatMap((m) => {
    const liste = [];
    if (m.dataset.href) liste.push({ ad: m.dataset.ad, alt: '', href: m.dataset.href });
    $$('[data-alt-link]', m).forEach((a) => liste.push({ ad: a.dataset.ad, alt: m.dataset.ad, href: a.getAttribute('href') }));
    return liste;
  });
  let secim = 0;
  const araCiz = () => {
    const q = kucuk(pa.value.trim());
    if (!q) { sonuc.hidden = true; return; }
    const bul = hedefler().filter((h) => kucuk(h.ad + ' ' + h.alt).includes(q)).slice(0, 8);
    secim = Math.min(secim, Math.max(0, bul.length - 1));
    sonuc.replaceChildren(...(bul.length ? bul.map((h, i) => el('a', { href: h.href, role: 'option', class: i === secim ? 'secili' : '' }, el('span', {}, h.ad), el('span', { style: 'color: var(--tx2); font-size: 12px' }, h.alt))) : [el('div', { class: 'bos', style: 'padding: 12px' }, 'Eşleşen modül yok')]));
    sonuc.hidden = false;
  };
  if (pa) {
    pa.addEventListener('input', () => { secim = 0; araCiz(); });
    pa.addEventListener('keydown', (o) => {
      const linkler = $$('a', sonuc);
      if (o.key === 'ArrowDown') { secim = Math.min(secim + 1, linkler.length - 1); araCiz(); o.preventDefault(); }
      if (o.key === 'ArrowUp') { secim = Math.max(secim - 1, 0); araCiz(); o.preventDefault(); }
      if (o.key === 'Enter' && linkler[secim]) location.href = linkler[secim].getAttribute('href');
      if (o.key === 'Escape') { pa.value = ''; sonuc.hidden = true; }
    });
    pa.addEventListener('blur', () => setTimeout(() => { sonuc.hidden = true; }, 150));
    document.addEventListener('keydown', (o) => { if ((o.metaKey || o.ctrlKey) && o.key.toLowerCase() === 'k') { o.preventDefault(); if (!t.ustAcik) { t.ustAcik = true; kaydet(); } pa.focus(); } });
  }

  // Üst ve yan menü düğmeleri
  $('[data-ust-kapat]').addEventListener('click', () => { t.ustAcik = false; kaydet(); });
  ustAc.addEventListener('click', () => { t.ustAcik = true; kaydet(); });
  const us = $('[data-ust-sabitle]'); if (us) us.addEventListener('click', () => { t.ustSabit = !t.ustSabit; kaydet(); });
  $('[data-yan-daralt]').addEventListener('click', () => { t.yanMod = t.yanMod === 'genis' ? 'dar' : 'genis'; kaydet(); });
  $('[data-yan-ac]').addEventListener('click', () => { t.yanMod = 'genis'; kaydet(); });
  const ysb = $('[data-yan-sabitle]'); if (ysb) ysb.addEventListener('click', () => { t.yanSabit = !t.yanSabit; kaydet(); });
  const mac = $('[data-menu-ac]');
  if (mac) mac.addEventListener('click', () => { const a = yan.classList.toggle('acik-menu'); mac.setAttribute('aria-expanded', String(a)); });

  // Özelleştir çekmecesi
  const cek = $('[data-cekmece]'), perde = $('[data-perde]'), cekAc = $('[data-ozellestir]');
  const cekmece = (ac) => { cek.hidden = !ac; perde.hidden = !ac; if (ac) { modulAyarCiz(); const k = $('[data-cekmece-kapat]', cek); if (k) k.focus(); } else if (cekAc) cekAc.focus(); };
  if (cekAc) cekAc.addEventListener('click', () => cekmece(true));
  $$('[data-cekmece-kapat]').forEach((b) => b.addEventListener('click', () => cekmece(false)));
  perde.addEventListener('click', () => cekmece(false));
  document.addEventListener('keydown', (o) => { if (o.key === 'Escape' && !cek.hidden) cekmece(false); });
  $$('[data-t]').forEach((c) => c.addEventListener('change', () => { t[c.dataset.t] = c.checked; kaydet(); }));
  $$('[data-u-t]').forEach((c) => c.addEventListener('change', () => { t.u[c.dataset.uT] = c.checked; kaydet(); }));
  $$('[data-segment]').forEach((g) => $$('button', g).forEach((b) => b.addEventListener('click', () => { t[g.dataset.segment] = b.dataset.v; kaydet(); })));
  $('[data-sifirla]').addEventListener('click', () => { t = JSON.parse(JSON.stringify(VARSAYILAN)); kaydet(); modulAyarCiz(); });
  function modulAyarCiz() {
    const kutu = $('[data-modul-ayar]');
    kutu.replaceChildren(...$$('[data-modul]').filter((m) => !m.dataset.sabit).map((m) => {
      const k = m.dataset.modul, fav = t.favori.includes(k);
      return el('div', { style: 'display: flex; align-items: center; gap: 10px' },
        el('button', { type: 'button', class: 'yildiz', 'aria-pressed': String(fav), 'aria-label': m.dataset.ad + ' sık kullanılanlarda', onclick: () => { t.favori = fav ? t.favori.filter((x) => x !== k) : [...t.favori, k]; kaydet(); modulAyarCiz(); } }, '★'),
        el('label', { class: 'sat', style: 'flex: 1' }, el('span', {}, m.dataset.ad), el('input', { type: 'checkbox', checked: !t.gizli.includes(k), onchange: (o) => { t.gizli = o.currentTarget.checked ? t.gizli.filter((x) => x !== k) : [...t.gizli, k]; kaydet(); } })));
    }));
  }

  // Tema: Açık · Koyu · Sistem (cihaz ayarını izler, varsayılan) · Saate göre (07.00–19.00 açık, dışında koyu; cihaz saati).
  // Seçim bu tarayıcıda idx-tema-secim anahtarında tutulur; ilk boyama Yonetim.astro'daki satır içi betikle yapılır.
  const TEMA_SECIMLER = ['acik', 'koyu', 'sistem', 'saat'];
  const sistemKoyu = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  let temaSaati = null;
  const temaSecimi = () => { const s = document.documentElement.dataset.temaSecim; return TEMA_SECIMLER.includes(s) ? s : 'sistem'; };
  function temaUygula(secim) {
    const saat = new Date().getHours();
    const koyu = secim === 'koyu' || (secim === 'sistem' && !!(sistemKoyu && sistemKoyu.matches)) || (secim === 'saat' && (saat < 7 || saat >= 19));
    const h = document.documentElement, tema = koyu ? 'koyu' : 'acik';
    h.dataset.temaSecim = secim;
    if (h.dataset.tema !== tema) {
      h.dataset.tema = tema;
      h.classList.toggle('dark', koyu);
      const kabuk = document.getElementById('kabuk'); if (kabuk) kabuk.className = 'kabuk ' + tema;
    }
    document.querySelectorAll('[data-tema-sec]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.temaSec === secim)));
    // Saate göre: sayfa açıkken bir sonraki 07.00 ya da 19.00 geçişinde kendiliğinden değişir.
    clearTimeout(temaSaati); temaSaati = null;
    if (secim === 'saat') {
      const n = new Date(), sonraki = new Date(n);
      sonraki.setHours(saat < 7 ? 7 : saat < 19 ? 19 : 31, 0, 5, 0);
      temaSaati = setTimeout(() => temaUygula(temaSecimi()), Math.max(1000, sonraki - n));
    }
  }
  document.querySelectorAll('[data-tema-sec]').forEach((b) => b.addEventListener('click', () => {
    const secim = b.dataset.temaSec;
    try { localStorage.setItem('idx-tema-secim', secim); } catch (e) {}
    temaUygula(secim);
  }));
  if (sistemKoyu && sistemKoyu.addEventListener) sistemKoyu.addEventListener('change', () => { if (temaSecimi() === 'sistem') temaUygula('sistem'); });
  // Uyku ya da arka plan sekmesinde zamanlayıcı gecikebilir: sekmeye dönünce yeniden hesaplanır.
  document.addEventListener('visibilitychange', () => { if (!document.hidden) temaUygula(temaSecimi()); });
  // Başka sekmede seçim değişirse bu sekme de izler.
  window.addEventListener('storage', (o) => { if (o.key === 'idx-tema-secim' && TEMA_SECIMLER.includes(o.newValue)) temaUygula(o.newValue); });
  temaUygula(temaSecimi());

  // Görünüm: Cam (varsayılan) ya da Düz. Yalnız bu tarayıcıda görünüm tercihi olarak tutulur (idx-cam = duz → kapalı).
  const camSecim = $('[data-cam-secim]');
  const camIsaretle = () => $$('button', camSecim).forEach((b) => b.setAttribute('aria-pressed', String((b.dataset.v === 'cam') === document.documentElement.classList.contains('cam'))));
  if (camSecim) {
    camIsaretle();
    $$('button', camSecim).forEach((b) => b.addEventListener('click', () => {
      const cam = b.dataset.v === 'cam';
      document.documentElement.classList.toggle('cam', cam);
      try { if (cam) localStorage.removeItem('idx-cam'); else localStorage.setItem('idx-cam', 'duz'); } catch (e) {}
      camIsaretle();
    }));
  }

  uygula();

  // Hesap menüsü: avatar tıklanınca açılır; dışarı tıklama ve Esc kapatır. Çıkış yalnız menüdeki "Çıkış yap" ile yapılır.
  const profil = $('[data-profil]');
  if (profil) {
    const dugme = $('[data-kim-avatar]', profil), menu = $('.profil-menu', profil);
    const kapat = (odak) => { menu.hidden = true; dugme.setAttribute('aria-expanded', 'false'); if (odak) dugme.focus(); };
    dugme.addEventListener('click', (o) => { o.stopPropagation(); const ac = menu.hidden; menu.hidden = !ac; dugme.setAttribute('aria-expanded', String(ac)); if (ac) $('a', menu).focus(); });
    document.addEventListener('click', (o) => { if (!menu.hidden && !profil.contains(o.target)) kapat(false); });
    profil.addEventListener('keydown', (o) => { if (o.key === 'Escape' && !menu.hidden) kapat(true); });
  }

  api('ozet').then((o) => {
    sayacGuncelle(o);
    const say = (liste, d) => (liste.find((x) => x.durum === d) || { n: 0 }).n;
    const yaz = (k, v) => { const e = $(`[data-s="${k}"]`); if (e) e.textContent = String(v); };
    yaz('talep', say(o.talepler, 'yeni')); yaz('musteri', o.musteri.n || 0); yaz('uye', say(o.uyeler, 'bekliyor')); yaz('yorum', o.bekleyenYorum || 0);
    const k = $('[data-kim]'); if (k && o.kim) k.textContent = o.kim;
    const av = $('[data-kim-avatar]'); if (av && o.kim) av.title = o.kim;
    const ke = $('[data-kim-eposta]'); if (ke && o.kim) ke.textContent = o.kim;
    // Yan menüdeki IDOS kartı: reklam verisi bağlantısının gerçek durumu (worker/reklam.js günlük çekim)
    const idosDurum = $('[data-idos-durum]'), idosDetay = $('[data-idos-detay]'), r = o.reklam;
    if (idosDurum && idosDetay && r) {
      if (!r.kurulu) { idosDurum.textContent = 'Bağlı değil'; idosDetay.textContent = 'Reklam verisi için Entegrasyonlar’daki IDOS ayarları gerekli.'; }
      else if (!r.son) { idosDurum.textContent = 'Bağlı'; idosDetay.textContent = 'Henüz veri çekilmedi. Çekim her sabah kendiliğinden yapılır.'; }
      else { idosDurum.textContent = r.son.durum === 'tamam' ? '● Bağlı' : '● Son çekim başarısız'; idosDurum.style.color = r.son.durum === 'tamam' ? '#4CC38A' : '#FF8A7E'; idosDetay.textContent = 'Son reklam verisi çekimi: ' + tarih(r.son.zaman); }
    }
  }).catch((h) => {
    sayacGuncelle(null);
    if (h.durum === 401) genelHata('Oturumunuz kapanmış. Sayfayı yenileyip yeniden giriş yapın.');
  });
}
