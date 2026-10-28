// Banner stüdyosu çizici (Muhittin, 28 Eki 2026). Site ve paneldeki canlı önizleme aynı kodu kullanır.
// Veri /api/bannerlar'dan gelir; son liste tarayıcıda saklanır ve sayfa açılır açılmaz ondan çizilir (titreme olmasın),
// ardından güncel liste alınıp yeniden yerleştirilir. Metinler yalnız textContent ile yazılır.
const ONBELLEK = 'idx-bn-liste';
const WA = '905078700629';
export const KAPAKLAR = ['arama', 'sosyal', 'analitik', 'konsol', 'etiket', 'magaza', 'pazaryeri', 'yonetim', 'birlesik', 'site', 'seo', 'icerik'];
export const TEMA = {
  lacivert: { arka: '#002559', yazi: '#E6ECF4', vurgu: '#F07A23' },
  turuncu: { arka: '#F07A23', yazi: '#1A1206', vurgu: '#002559' },
  acik: { arka: 'var(--card, #FFFFFF)', yazi: 'var(--head, #002559)', vurgu: '#B84406' },
  koyu: { arka: '#121926', yazi: '#F1F3F5', vurgu: '#F07A23' },
  degrade: { arka: 'linear-gradient(100deg, #002559, #6B2A10 70%, #B84406)', yazi: '#FFFFFF', vurgu: '#FFB58A' }
};
const el = (t, o = {}, ...c) => { const e = document.createElement(t); for (const [k, v] of Object.entries(o)) { if (v == null || v === false) continue; if (k === 'class') e.className = v; else if (k === 'style') e.style.cssText = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v === true ? '' : v); } c.flat().forEach((x) => x != null && x !== false && e.append(x)); return e; };
const ekle = (k, ...c) => { c.flat().forEach((x) => x != null && x !== false && k.append(x)); return k; };
const ikon = (yol, b = 18) => { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('width', b); s.setAttribute('height', b); s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor'); s.setAttribute('stroke-width', '2.2'); s.setAttribute('stroke-linecap', 'round'); s.setAttribute('aria-hidden', 'true'); s.innerHTML = yol; return s; };
const KAPAT = '<path d="M6 6l12 12M18 6L6 18"/>';

// ---- Hedefleme ----
const istanbul = () => new Date(Date.now() + 3 * 3600000);
export function zamanUygun(z, simdi = istanbul()) {
  if (!z) return true;
  const iso = simdi.toISOString().slice(0, 16);
  if (z.baslangic && iso < z.baslangic) return false;
  if (z.bitis && iso >= z.bitis) return false;
  const gun = ((simdi.getUTCDay() + 6) % 7) + 1;
  if (z.gunler && z.gunler.length && !z.gunler.includes(gun)) return false;
  if (z.saatBas && z.saatBit) { const s = iso.slice(11, 16); const ic = z.saatBas <= z.saatBit ? s >= z.saatBas && s < z.saatBit : s >= z.saatBas || s < z.saatBit; if (!ic) return false; }
  return true;
}
export function sayfaUygun(h, yol) {
  if (!h || h.sayfalar === 'tum') return true;
  const y = (yol.replace(/\/$/, '') || '/');
  const l = String(h.liste || '').split(/[\n,]/).map((x) => x.trim()).filter(Boolean);
  const eslesir = l.some((d) => (d.endsWith('*') ? y.startsWith(d.slice(0, -1).replace(/\/$/, '')) : (d.replace(/\/$/, '') || '/') === y));
  return h.sayfalar === 'dahil' ? eslesir : !eslesir;
}
const saklama = (s) => { try { return s(); } catch (e) { return null; } };
function ziyaretciTuru() {
  return saklama(() => {
    let ilk = localStorage.getItem('idx-ilk-ziyaret');
    if (!sessionStorage.getItem('idx-oturum')) { sessionStorage.setItem('idx-oturum', '1'); sessionStorage.setItem('idx-oturum-onceki', ilk ? '1' : '0'); if (!ilk) localStorage.setItem('idx-ilk-ziyaret', String(Date.now())); }
    return sessionStorage.getItem('idx-oturum-onceki') === '1' ? 'geri' : 'yeni';
  }) || 'yeni';
}
const SURE = { '1g': 864e5, '7g': 7 * 864e5, '30g': 30 * 864e5, kalici: 0 };
function kapatildi(b) {
  return saklama(() => {
    if (sessionStorage.getItem('idx-bn-k-' + b.id) === b.guncelleme) return true;
    const v = JSON.parse(localStorage.getItem('idx-bn-k-' + b.id) || 'null');
    return !!(v && v.g === b.guncelleme && (v.bit === 0 || v.bit > Date.now()));
  });
}
function kapatKaydet(b) {
  saklama(() => {
    if (b.kapatmaSuresi === 'oturum') sessionStorage.setItem('idx-bn-k-' + b.id, b.guncelleme);
    else localStorage.setItem('idx-bn-k-' + b.id, JSON.stringify({ g: b.guncelleme, bit: SURE[b.kapatmaSuresi] ? Date.now() + SURE[b.kapatmaSuresi] : 0 }));
  });
}
export function uygunMu(b, yol, onizleme) {
  if (onizleme) return true;
  if (!zamanUygun(b.zaman) || !sayfaUygun(b.hedef, yol)) return false;
  const mobil = matchMedia('(max-width: 760px)').matches;
  if (b.hedef && ((b.hedef.cihaz === 'mobil' && !mobil) || (b.hedef.cihaz === 'masaustu' && mobil))) return false;
  if (b.hedef && b.hedef.ziyaretci !== 'hepsi' && b.hedef.ziyaretci !== ziyaretciTuru()) return false;
  if (b.kapatilabilir && kapatildi(b)) return false;
  return true;
}

// ---- İstatistik (yalnız sayılar; kimlik yok) ----
let kuyruk = [], zamanlayici = null;
const gonder = () => { if (!kuyruk.length) return; const veri = JSON.stringify({ olaylar: kuyruk.splice(0, 20) }); try { if (!navigator.sendBeacon('/api/bannerlar/olay', new Blob([veri], { type: 'application/json' }))) fetch('/api/bannerlar/olay', { method: 'POST', body: veri, keepalive: true }); } catch (e) {} };
function olay(b, tur, onizleme) { if (onizleme) return; kuyruk.push({ id: b.id, olay: tur }); clearTimeout(zamanlayici); zamanlayici = setTimeout(gonder, 2500); }
addEventListener('pagehide', gonder);

// ---- Geri sayım ----
function geriSayim(b) {
  if (!b.tasarim || !b.tasarim.geriSayim || !b.zaman || !b.zaman.bitis) return null;
  const hedef = Date.parse(b.zaman.bitis + ':00+03:00');
  const kutu = el('span', { class: 'bn-sayac', 'aria-label': 'Kalan süre' });
  const yaz = () => {
    let k = Math.max(0, hedef - Date.now()); const g = Math.floor(k / 864e5); k -= g * 864e5;
    const s = Math.floor(k / 36e5); k -= s * 36e5; const d = Math.floor(k / 6e4); const sn = Math.floor((k - d * 6e4) / 1000);
    const iki = (n) => String(n).padStart(2, '0');
    kutu.replaceChildren(...[[g, 'gün'], [iki(s), 'sa'], [iki(d), 'dk'], [iki(sn), 'sn']].filter(([n, a], i) => i || n > 0).map(([n, a]) => el('span', {}, el('b', {}, String(n)), el('small', {}, a))));
  };
  yaz(); const t = setInterval(() => { if (!kutu.isConnected) return clearInterval(t); yaz(); }, 1000);
  return kutu;
}

// ---- Düğme ve tıklama davranışı ----
function dugme(b, onizleme) {
  const d = b.dugme || {};
  if (!d.metin || d.eylem === 'yok') return null;
  const tik = () => olay(b, 'tiklama', onizleme);
  if (d.eylem === 'kod-kopyala') {
    const k = el('button', { type: 'button', class: 'bn-dugme', onclick: async (o) => { o.stopPropagation(); tik(); try { await navigator.clipboard.writeText(d.hedef); } catch (e) {} const eski = k.textContent; k.textContent = 'Kopyalandı: ' + d.hedef; setTimeout(() => (k.textContent = eski), 2200); } }, d.metin);
    return k;
  }
  const ozellik = { class: 'bn-dugme', onclick: (o) => { o.stopPropagation(); tik(); if (onizleme) o.preventDefault(); } };
  if (d.eylem === 'bag') ozellik.href = d.hedef;
  if (d.eylem === 'yeni-sekme') Object.assign(ozellik, { href: d.hedef, target: '_blank', rel: 'noopener' });
  if (d.eylem === 'talep-analiz' || d.eylem === 'talep-teklif') Object.assign(ozellik, { href: '/tr/iletisim#form', 'data-hizli-talep': d.eylem === 'talep-analiz' ? 'analiz' : 'teklif' });
  if (d.eylem === 'whatsapp') Object.assign(ozellik, { href: 'https://wa.me/' + (d.hedef || WA), target: '_blank', rel: 'noopener' });
  if (d.eylem === 'telefon') ozellik.href = 'tel:' + (d.hedef || '+' + WA);
  return el('a', ozellik, d.metin);
}

function kapatDugme(b, kok, onizleme, sonra) {
  if (!b.kapatilabilir) return null;
  return el('button', { type: 'button', class: 'bn-kapat', 'aria-label': 'Kapat', onclick: (o) => { o.stopPropagation(); if (!onizleme) { kapatKaydet(b); olay(b, 'kapatma'); } kok.classList.add('bn-cikis'); setTimeout(() => { kok.remove(); sonra && sonra(); }, 220); } }, ikon(KAPAT, 16));
}

function gorsel(b) {
  const src = b.gorsel || (b.kapak ? `/kapak/cizim/${b.kapak}.webp` : '');
  return src ? el('img', { class: 'bn-resim', src, alt: b.gorsel ? b.gorselAlt || '' : '', loading: 'lazy', decoding: 'async' }) : null;
}

function temaStil(b) {
  const t = b.tasarim || {};
  const r = t.tema === 'ozel' ? { arka: t.arka, yazi: t.yazi, vurgu: t.vurgu } : TEMA[t.tema] || TEMA.lacivert;
  return `--bn-arka:${r.arka};--bn-yazi:${r.yazi};--bn-vurgu:${r.vurgu}`;
}

// Bir bannerın DOM'unu kurar.
export function bannerOlustur(b, onizleme = false) {
  const t = b.tasarim || {};
  const sinif = ['bn', 'bn-' + b.tur, 'bn-k-' + b.konum, 'bn-t-' + (t.tema || 'lacivert'), 'bn-b-' + (t.boyut || 'normal'), 'bn-h-' + (t.hizala || 'orta'), t.golge === false ? 'bn-golgesiz' : ''].filter(Boolean).join(' ');
  const kok = el('div', { class: sinif, style: temaStil(b), 'data-bn': b.id, role: b.tur === 'popup' ? 'dialog' : 'region', 'aria-label': b.baslik || 'Duyuru' });
  const d = dugme(b, onizleme), sayac = geriSayim(b);
  if (b.tur === 'serit') {
    const oge = (o) => el('span', { class: 'bn-oge' }, o.ikon || t.ikon ? el('span', { class: 'bn-ikon', 'aria-hidden': 'true' }, o.ikon || t.ikon) : null, o.metin);
    const izler = b.ogeler.map(oge);
    let pencere;
    if (b.mod === 'kayan') {
      const iz = el('div', { class: 'bn-iz' }, izler, el('span', { class: 'bn-tekrar', 'aria-hidden': 'true' }, b.ogeler.map(oge)));
      pencere = el('div', { class: 'bn-pencere bn-kayan bn-hiz-' + (b.hiz || 'normal') }, iz);
      requestAnimationFrame(() => iz.style.setProperty('--sure', Math.max(12, Math.round(iz.scrollWidth / 2 / ({ yavas: 40, normal: 65, hizli: 110 }[b.hiz] || 65))) + 's'));
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) pencere.classList.add('bn-durgun');
    } else if (b.mod === 'donen' && izler.length > 1) {
      pencere = el('div', { class: 'bn-pencere bn-donen' }, izler);
      let i = 0; izler.forEach((x, j) => (x.hidden = j !== 0));
      const tm = setInterval(() => { if (!kok.isConnected) return clearInterval(tm); if (kok.matches(':hover,:focus-within')) return; izler[i].hidden = true; i = (i + 1) % izler.length; izler[i].hidden = false; }, 4500);
    } else pencere = el('div', { class: 'bn-pencere bn-sabit' }, izler);
    ekle(kok, el('div', { class: 'bn-ic' }, pencere, sayac, d), kapatDugme(b, kok, onizleme));
  } else if (b.tur === 'gorsel') {
    ekle(kok, el('div', { class: 'bn-ic' },
      el('div', { class: 'bn-metin' }, b.etiket ? el('span', { class: 'bn-etiket' }, b.etiket) : null, el('strong', { class: 'bn-baslik' }, b.baslik), b.metin ? el('p', {}, b.metin) : null, sayac, d),
      gorsel(b)), kapatDugme(b, kok, onizleme));
  } else if (b.tur === 'kose') {
    ekle(kok, gorsel(b), el('div', { class: 'bn-metin' }, b.etiket ? el('span', { class: 'bn-etiket' }, b.etiket) : null, el('strong', { class: 'bn-baslik' }, b.baslik), b.metin ? el('p', {}, b.metin) : null, sayac, d), kapatDugme(b, kok, onizleme));
  } else if (b.tur === 'popup') {
    const kutu = el('div', { class: 'bn-pop' }, gorsel(b), el('div', { class: 'bn-metin' }, b.etiket ? el('span', { class: 'bn-etiket' }, b.etiket) : null, el('strong', { class: 'bn-baslik' }, b.baslik), b.metin ? el('p', {}, b.metin) : null, sayac, d));
    const kap = kapatDugme({ ...b, kapatilabilir: true }, kok, onizleme);
    ekle(kutu, kap);
    ekle(kok, kutu);
    if (!onizleme) kok.addEventListener('click', (o) => { if (o.target === kok) kap.click(); });
  }
  if (b.tumuTiklanir && d && d.tagName === 'A') { kok.classList.add('bn-tiklanir'); kok.addEventListener('click', (o) => { if (o.target.closest('a,button')) return; d.click(); }); }
  return kok;
}

// ---- Site: yerleştirme ----
const YUVA = { 'ust-en': 'ust-en', 'ust-menu-alti': 'ust-menu-alti', 'icerik-basi': 'icerik-basi', 'icerik-sonu': 'icerik-sonu', 'footer-ustu': 'footer-ustu', 'ana-acilis-alti': 'ana-acilis-alti', 'blog-yan': 'blog-yan' };
function siklikUygun(b) {
  const t = b.tetik || {}; const anahtar = 'idx-bn-g-' + b.id;
  return saklama(() => {
    if (t.siklik === 'her') return true;
    if (t.siklik === 'oturum') return sessionStorage.getItem(anahtar) !== b.guncelleme;
    const v = JSON.parse(localStorage.getItem(anahtar) || 'null');
    if (!v || v.g !== b.guncelleme) return true;
    if (t.siklik === 'bir-kez') return false;
    return Date.now() - v.z > (t.siklik === 'gun' ? 864e5 : 7 * 864e5);
  }) !== false;
}
const gorulduKaydet = (b) => saklama(() => { sessionStorage.setItem('idx-bn-g-' + b.id, b.guncelleme); localStorage.setItem('idx-bn-g-' + b.id, JSON.stringify({ g: b.guncelleme, z: Date.now() })); });
function tetikle(b, ac) {
  const t = b.tetik || {};
  if (t.tur === 'kaydirma') { const k = () => { const oran = (scrollY + innerHeight) / document.documentElement.scrollHeight * 100; if (oran >= (t.deger || 50)) { removeEventListener('scroll', k); ac(); } }; addEventListener('scroll', k, { passive: true }); k(); }
  else if (t.tur === 'cikis' && matchMedia('(pointer: fine)').matches) { const k = (o) => { if (o.clientY <= 0) { document.removeEventListener('mouseout', k); ac(); } }; document.addEventListener('mouseout', k); }
  else setTimeout(ac, (t.deger || 0) * 1000);
}
let kuruldu = false;
const izle = (b, kok) => {
  if (!('IntersectionObserver' in window)) return olay(b, 'gosterim');
  const io = new IntersectionObserver((g) => { if (g.some((x) => x.isIntersecting)) { olay(b, 'gosterim'); io.disconnect(); } }, { threshold: 0.4 });
  io.observe(kok);
};
function yerlestir(liste) {
  const yol = location.pathname;
  document.querySelectorAll('[data-bn]').forEach((e) => { if (!e.closest('[data-bn-onizleme]')) e.remove(); });
  document.querySelectorAll('[data-bn-yuva]').forEach((y) => (y.hidden = true));
  const uygun = liste.filter((b) => uygunMu(b, yol));
  for (const b of uygun) {
    if (YUVA[b.konum]) {
      const y = document.querySelector(`[data-bn-yuva="${b.konum}"]`);
      if (!y) continue;
      if (b.tur === 'gorsel' && b.konum === 'ana-acilis-alti') { y.hidden = false; y.append(bannerOlustur(b)); continue; }
      y.hidden = false; const k = bannerOlustur(b); y.append(k); izle(b, k);
    } else if (b.tur === 'serit' && b.konum === 'alt-sabit') { const k = bannerOlustur(b); document.body.append(k); document.body.classList.add('bn-alt-var'); izle(b, k); }
    else if ((b.tur === 'popup' || b.tur === 'kose') && !kuruldu && siklikUygun(b)) {
      tetikle(b, () => { if (document.querySelector('.bn-popup') && b.tur === 'popup') return; const k = bannerOlustur(b); document.body.append(k); gorulduKaydet(b); olay(b, 'gosterim'); requestAnimationFrame(() => k.classList.add('bn-acik')); if (b.tur === 'popup') k.querySelector('.bn-dugme, .bn-kapat')?.focus(); });
    }
  }
  kaydiriciKur();
  kuruldu = true;
}
// Ana sayfa açılış altında birden çok görsel banner: kaydırmalı gösterim
function kaydiriciKur() {
  const y = document.querySelector('[data-bn-yuva="ana-acilis-alti"]');
  if (!y) return;
  const slaytlar = [...y.querySelectorAll(':scope > .bn')];
  y.querySelector('.bn-kontrol')?.remove();
  if (!slaytlar.length) return;
  let i = 0;
  const git = (n) => { i = (n + slaytlar.length) % slaytlar.length; slaytlar.forEach((s, j) => (s.hidden = j !== i)); noktalar.forEach((d, j) => d.setAttribute('aria-current', String(j === i))); if (!slaytlar[i].dataset.goruldu) { slaytlar[i].dataset.goruldu = '1'; olay({ id: slaytlar[i].dataset.bn }, 'gosterim'); } };
  const noktalar = slaytlar.map((_, j) => el('button', { type: 'button', 'aria-label': `${j + 1}. duyuru`, onclick: () => git(j) }));
  if (slaytlar.length > 1) {
    y.append(el('div', { class: 'bn-kontrol' }, el('button', { type: 'button', 'aria-label': 'Önceki', onclick: () => git(i - 1) }, '‹'), el('span', { class: 'bn-noktalar' }, noktalar), el('button', { type: 'button', 'aria-label': 'Sonraki', onclick: () => git(i + 1) }, '›')));
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) { const t = setInterval(() => { if (!y.isConnected) return clearInterval(t); if (!y.matches(':hover,:focus-within') && document.visibilityState === 'visible') git(i + 1); }, 7000); }
  }
  git(0);
}

export async function bannerlariKur() {
  const onceki = saklama(() => JSON.parse(localStorage.getItem(ONBELLEK) || 'null'));
  if (onceki && Array.isArray(onceki)) yerlestir(onceki);
  try {
    const r = await fetch('/api/bannerlar', { headers: { Accept: 'application/json' } });
    const s = await r.json();
    if (!s.ok) return;
    const yeni = JSON.stringify(s.bannerlar);
    if (!onceki || yeni !== JSON.stringify(onceki)) { saklama(() => localStorage.setItem(ONBELLEK, yeni)); kuruldu = !!onceki && kuruldu; yerlestir(s.bannerlar); }
  } catch (e) {}
}
