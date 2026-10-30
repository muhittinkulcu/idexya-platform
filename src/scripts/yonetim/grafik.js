// Genel bakış grafikleri. Kütüphane yok: çubuklar HTML, çizgiler satır içi SVG. Sunucudan gelen metinler textContent ile yazılır.
import { el } from './ortak.js';

// Talep kaynakları beş gruba toplanır; renk sırası sabittir (--s1…--s5), filtreyle değişmez.
export const KAYNAK_GRUP = {
  iletisim: { ad: 'İletişim formu', renk: 'var(--s1)' },
  analiz: { ad: 'Ücretsiz analiz', renk: 'var(--s2)' },
  paket: { ad: 'Paket teklifi', renk: 'var(--s3)' },
  sihirbaz: { ad: 'Paket teklifi', renk: 'var(--s3)' },
  asistan: { ad: 'Yapay zekâ asistanı', renk: 'var(--s4)' },
  form: { ad: 'Diğer formlar', renk: 'var(--s5)' }
};
const GRUPLAR = ['İletişim formu', 'Ücretsiz analiz', 'Paket teklifi', 'Yapay zekâ asistanı', 'Diğer formlar'].map((ad) => Object.values(KAYNAK_GRUP).find((g) => g.ad === ad));
const AYLAR = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
const GUN_ADI = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
const GUN_TAM = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const sayi = (n) => new Intl.NumberFormat('tr-TR').format(n);
const iki = (n) => String(n).padStart(2, '0');

// bugun (YYYY-MM-DD, İstanbul) dâhil geriye doğru n gün, eskiden yeniye
export function gunler(bugun, n) {
  const son = new Date(bugun + 'T00:00:00Z');
  return Array.from({ length: n }, (_, i) => new Date(son.getTime() - (n - 1 - i) * 86400000).toISOString().slice(0, 10));
}
const gunYaz = (g) => { const [y, a, d] = g.split('-').map(Number); return `${d} ${AYLAR[a - 1]}`; };
const gunTam = (g) => { const t = new Date(g + 'T00:00:00Z'); const [y, a, d] = g.split('-'); return `${d}.${a}.${y} ${GUN_TAM[t.getUTCDay()]}`; };

// Ölçek: 0'dan başlar, en fazla 4 aralık, tam sayı adımlar
function olcek(enBuyuk) {
  if (enBuyuk <= 0) return { ust: 4, adim: 1 };
  const kaba = enBuyuk / 4, us = Math.pow(10, Math.floor(Math.log10(kaba)));
  const adim = Math.max(1, [1, 2, 5, 10].map((k) => k * us).find((x) => x >= kaba));
  return { ust: Math.ceil(enBuyuk / adim) * adim, adim };
}

// Tek bir ipucu kutusu; [data-ip] taşıyan her öğe üzerine gelince veya odaklanınca içeriğini gösterir.
let kutu = null;
export function ipucuKur(k) {
  kutu = k;
  const goster = (hedef, x, y) => {
    kutu.textContent = hedef.dataset.ip; kutu.hidden = false;
    const w = kutu.offsetWidth, h = kutu.offsetHeight;
    kutu.style.left = Math.round(Math.min(Math.max(8, x + 14), innerWidth - w - 8)) + 'px';
    kutu.style.top = Math.round(y - h - 14 < 8 ? y + 18 : y - h - 14) + 'px';
  };
  document.addEventListener('pointermove', (o) => { const h = o.target.closest && o.target.closest('[data-ip]'); if (h) goster(h, o.clientX, o.clientY); else kutu.hidden = true; });
  document.addEventListener('focusin', (o) => { const h = o.target.closest && o.target.closest('[data-ip]'); if (h) { const r = h.getBoundingClientRect(); goster(h, r.left + r.width / 2, r.top); } else kutu.hidden = true; });
  addEventListener('scroll', () => { kutu.hidden = true; }, { passive: true });
}

// Sayı kartı: değer, önceki döneme göre değişim (ok + metin, yalnız renk değil) ve son 30 günün kıvılcım çizgisi
// notr: artış/azalış iyi ya da kötü sayılmaz (ör. reklam harcaması); ok ve yüzde renksiz yazılır.
export function kpiKart({ ad, deger, onceki, metin, oncekiMetin, aciklama, seri, href, alt, notr }) {
  const satirlar = [el('span', { style: 'font-size: 12px; color: var(--tx2)' }, ad), el('b', {}, metin ?? sayi(deger))];
  if (deger !== undefined && onceki !== undefined) {
    let d;
    if (onceki === 0 && deger === 0) d = el('span', { class: 'degisim' }, 'Önceki dönemle aynı (0)');
    else if (onceki === 0) d = el('span', { class: 'degisim' }, el('span', { class: notr ? '' : 'ok-u' }, '▲ yeni'), `önceki dönemde 0 · ${alt}`);
    else {
      const f = Math.round((deger - onceki) / onceki * 100);
      d = el('span', { class: 'degisim' }, f === 0 ? el('span', {}, '= %0') : el('span', { class: notr ? '' : f > 0 ? 'ok-u' : 'ok-a', style: notr ? 'font-weight: 700; color: var(--head)' : undefined }, (f > 0 ? '▲ %' : '▼ %') + Math.abs(f)), `${alt} (${sayi(onceki)})`);
    }
    satirlar.push(d);
  }
  if (oncekiMetin) satirlar.push(el('span', { class: 'degisim' }, oncekiMetin));
  if (aciklama) satirlar.push(el('span', { style: 'font-size: 12px; color: var(--tx2)' }, aciklama));
  if (seri) satirlar.push(kivilcim(seri));
  return el('a', { class: 'kart kpi', href }, ...satirlar);
}
function kivilcim(seri) {
  const en = Math.max(1, ...seri), w = 100, h = 30, n = seri.length;
  const nok = seri.map((v, i) => `${(i / (n - 1)) * w},${h - 2 - (v / en) * (h - 4)}`);
  const ns = 'http://www.w3.org/2000/svg';
  const s = document.createElementNS(ns, 'svg');
  s.setAttribute('viewBox', `0 0 ${w} ${h}`); s.setAttribute('preserveAspectRatio', 'none'); s.setAttribute('class', 'kivilcim');
  s.setAttribute('role', 'img'); s.setAttribute('aria-label', `Son ${n} gün: toplam ${sayi(seri.reduce((a, b) => a + b, 0))}, en yüksek gün ${sayi(Math.max(...seri))}`);
  const alan = document.createElementNS(ns, 'path');
  alan.setAttribute('d', `M0,${h} L${nok.join(' L')} L${w},${h} Z`); alan.setAttribute('fill', 'color-mix(in oklab, var(--brand) 14%, transparent)');
  const cizgi = document.createElementNS(ns, 'polyline');
  cizgi.setAttribute('points', nok.join(' ')); cizgi.setAttribute('fill', 'none'); cizgi.setAttribute('stroke', 'var(--brand)'); cizgi.setAttribute('stroke-width', '2'); cizgi.setAttribute('vector-effect', 'non-scaling-stroke'); cizgi.setAttribute('stroke-linejoin', 'round');
  s.append(alan, cizgi);
  return s;
}

// Günlük talep grafiği: kaynağa göre yığılmış çubuklar + önceki dönemin toplamı kesik çizgi (aynı eksen)
export function trendCiz(g, gunSay, gorunum, k) {
  const liste = gunler(g.bugun, gunSay * 2), simdi = liste.slice(gunSay), onceki = liste.slice(0, gunSay);
  const veri = {}; g.gunluk.forEach((r) => { const ad = (KAYNAK_GRUP[r.kaynak] || KAYNAK_GRUP.form).ad; (veri[r.gun] ||= {})[ad] = ((veri[r.gun] || {})[ad] || 0) + r.n; });
  const toplamGun = (gun) => Object.values(veri[gun] || {}).reduce((a, b) => a + b, 0);
  const grupToplam = Object.fromEntries(GRUPLAR.map((gr) => [gr.ad, simdi.reduce((s, x) => s + ((veri[x] || {})[gr.ad] || 0), 0)]));
  const donemToplam = simdi.reduce((s, x) => s + toplamGun(x), 0), oncekiToplam = onceki.reduce((s, x) => s + toplamGun(x), 0);

  k.lejant.replaceChildren(...GRUPLAR.map((gr) => el('span', {}, el('i', { style: `background: ${gr.renk}` }), `${gr.ad} `, el('b', { style: 'color: var(--head)' }, sayi(grupToplam[gr.ad])))),
    el('span', {}, el('i', { class: 'onceki' }), 'Önceki dönem (toplam)'));
  k.not.textContent = `Bu dönem ${sayi(donemToplam)} talep · önceki ${gunSay} gün ${sayi(oncekiToplam)} · spam sayılmaz · İstanbul saati`;
  k.grafik.hidden = gorunum === 'tablo'; k.tablo.hidden = gorunum !== 'tablo';

  if (gorunum === 'tablo') {
    k.tablo.replaceChildren(el('table', {},
      el('thead', {}, el('tr', {}, el('th', {}, 'Gün'), ...GRUPLAR.map((gr) => el('th', {}, gr.ad)), el('th', {}, 'Toplam'), el('th', {}, 'Önceki dönem'))),
      el('tbody', {}, ...simdi.slice().reverse().map((gun) => { const i = simdi.indexOf(gun); return el('tr', {}, el('td', {}, gunTam(gun)), ...GRUPLAR.map((gr) => el('td', {}, sayi((veri[gun] || {})[gr.ad] || 0))), el('td', {}, el('b', {}, sayi(toplamGun(gun)))), el('td', {}, sayi(toplamGun(onceki[i])))); }))));
    return;
  }

  const enBuyuk = Math.max(...simdi.map(toplamGun), ...onceki.map(toplamGun));
  const { ust, adim } = olcek(enBuyuk);
  const izgara = el('div', { class: 'cubuk-izgara', 'aria-hidden': 'true' });
  for (let v = 0; v <= ust; v += adim) izgara.append(el('div', { style: `bottom: ${(v / ust) * 100}%` }, el('span', {}, sayi(v))));
  const cubuklar = el('div', { class: 'cubuklar', role: 'list', 'aria-label': `Günlük talepler, son ${gunSay} gün` });
  simdi.forEach((gun, i) => {
    const t = toplamGun(gun), o = toplamGun(onceki[i]);
    const parca = GRUPLAR.filter((gr) => (veri[gun] || {})[gr.ad]).map((gr) => el('div', { style: `flex: ${veri[gun][gr.ad]} 1 0; min-height: 2px; background: ${gr.renk}` }));
    const ip = [gunTam(gun), ...GRUPLAR.filter((gr) => (veri[gun] || {})[gr.ad]).map((gr) => `${gr.ad}: ${sayi(veri[gun][gr.ad])}`), `Toplam: ${sayi(t)}`, `Önceki dönemin aynı günü (${gunYaz(onceki[i])}): ${sayi(o)}`].join('\n');
    cubuklar.append(el('div', { class: 'cubuk', role: 'listitem', tabindex: gunSay <= 30 ? '0' : '-1', 'data-ip': ip, 'aria-label': ip.replace(/\n/g, ', ') }, t ? el('div', { class: 'yigin', style: `height: ${(t / ust) * 100}%` }, ...parca) : null));
  });
  // Önceki dönem çizgisi: her çubuğun ortasından geçer
  const ns = 'http://www.w3.org/2000/svg';
  const s = document.createElementNS(ns, 'svg');
  s.setAttribute('class', 'onceki-cizgi'); s.setAttribute('viewBox', `0 0 ${gunSay} 100`); s.setAttribute('preserveAspectRatio', 'none'); s.setAttribute('aria-hidden', 'true');
  const pl = document.createElementNS(ns, 'polyline');
  pl.setAttribute('points', onceki.map((gun, i) => `${i + 0.5},${100 - (toplamGun(gun) / ust) * 100}`).join(' '));
  pl.setAttribute('fill', 'none'); pl.setAttribute('stroke', 'var(--tx2)'); pl.setAttribute('stroke-width', '2'); pl.setAttribute('stroke-dasharray', '4 4'); pl.setAttribute('vector-effect', 'non-scaling-stroke');
  s.append(pl);
  const parcalar = [izgara, cubuklar, s];
  if (!donemToplam && !oncekiToplam) parcalar.push(el('div', { class: 'bos-not' }, 'Bu dönemde talep yok. Siteden ilk talep geldiğinde grafik dolar.'));
  k.alan.replaceChildren(...parcalar);
  const etiketSay = Math.min(6, gunSay);
  k.x.replaceChildren(...Array.from({ length: etiketSay }, (_, j) => { const i = Math.round(j * (gunSay - 1) / (etiketSay - 1)); return el('span', { style: `left: ${((i + 0.5) / gunSay) * 100}%` }, gunYaz(simdi[i])); }));
}

// Gün × saat ısı haritası: tek renk (marka turuncusu), açıktan koyuya; 0 = iz rengi
export function isiCiz(satirlar, kutuEl, notEl) {
  const m = {}; let en = 0, top = 0, enIyi = null;
  satirlar.forEach((r) => { m[r.hg + '-' + r.saat] = r.n; top += r.n; if (r.n > en) { en = r.n; enIyi = r; } });
  const sira = [1, 2, 3, 4, 5, 6, 0];
  const hucreler = [el('span', {})];
  for (let s = 0; s < 24; s++) hucreler.push(el('span', { style: 'justify-content: center' }, s % 3 === 0 ? iki(s) : ''));
  sira.forEach((hg) => {
    hucreler.push(el('span', {}, GUN_ADI[hg]));
    for (let s = 0; s < 24; s++) {
      const n = m[hg + '-' + s] || 0;
      const ip = `${GUN_TAM[hg]} ${iki(s)}.00–${iki((s + 1) % 24)}.00\n${sayi(n)} talep`;
      hucreler.push(el('i', n ? { 'data-n': n, 'data-ip': ip, style: `background: color-mix(in oklab, var(--brand) ${Math.round(25 + (n / en) * 75)}%, rgb(var(--card)))` } : { 'data-ip': ip }));
    }
  });
  kutuEl.replaceChildren(...hucreler);
  kutuEl.setAttribute('aria-label', top ? `Son 90 günde ${sayi(top)} talep. En yoğun saat ${GUN_TAM[enIyi.hg]} ${iki(enIyi.saat)}.00 (${sayi(en)} talep).` : 'Son 90 günde talep yok.');
  notEl.textContent = top ? `En yoğun: ${GUN_TAM[enIyi.hg]} ${iki(enIyi.saat)}.00–${iki((enIyi.saat + 1) % 24)}.00 (${sayi(en)} talep). Koyu kare = daha çok talep.` : 'Son 90 günde talep yok. Talepler geldikçe yoğun saatler burada koyulaşır.';
}

// Yatay çubuklar: ad, çubuk, sayı ve pay
// birim: ipucundaki sayının adı (varsayılan "talep"; ör. ziyaretçi sayfasında "ziyaret")
export function yatayCiz(kutuEl, liste, bosMetin, birim = 'talep') {
  const top = liste.reduce((s, x) => s + x.n, 0), en = Math.max(1, ...liste.map((x) => x.n));
  if (!top) { kutuEl.replaceChildren(el('div', { class: 'bos', style: 'padding: 12px' }, bosMetin)); return; }
  kutuEl.replaceChildren(...liste.map((x) => el('div', { class: 'yatay-sat', 'data-ip': `${x.ad}\n${sayi(x.n)} ${birim} · %${Math.round(x.n / top * 100)}` },
    el('span', { class: 'ad', title: x.ad }, el('i', { style: `background: ${x.renk}` }), x.ad),
    el('div', { class: 'yatay-iz' }, el('div', { style: `width: ${(x.n / en) * 100}%; background: ${x.renk}` })),
    el('span', {}, el('b', {}, sayi(x.n)), el('span', { style: 'color: var(--tx2)' }, ` · %${Math.round(x.n / top * 100)}`)))));
}

// Genel yığılmış günlük çubuk grafiği (ör. reklam harcaması): seriler [{ ad, renk, degerler: { gun: sayi } }], bicim sayıyı yazar
export function yiginCiz(alan, xEl, liste, seriler, bicim) {
  const toplam = (gun) => seriler.reduce((s, sr) => s + (sr.degerler[gun] || 0), 0);
  const { ust, adim } = olcek(Math.max(...liste.map(toplam)));
  const izgara = el('div', { class: 'cubuk-izgara', 'aria-hidden': 'true' });
  for (let v = 0; v <= ust; v += adim) izgara.append(el('div', { style: `bottom: ${(v / ust) * 100}%` }, el('span', {}, kisa(v))));
  const cubuklar = el('div', { class: 'cubuklar', role: 'list', 'aria-label': `Günlük, son ${liste.length} gün` });
  liste.forEach((gun) => {
    const t = toplam(gun);
    const dolu = seriler.filter((sr) => sr.degerler[gun]);
    const ip = [gunTam(gun), ...dolu.map((sr) => `${sr.ad}: ${bicim(sr.degerler[gun])}`), `Toplam: ${bicim(t)}`].join('\n');
    cubuklar.append(el('div', { class: 'cubuk', role: 'listitem', tabindex: '0', 'data-ip': ip, 'aria-label': ip.replace(/\n/g, ', ') },
      t ? el('div', { class: 'yigin', style: `height: ${(t / ust) * 100}%` }, ...dolu.map((sr) => el('div', { style: `flex: ${sr.degerler[gun]} 1 0; min-height: 2px; background: ${sr.renk}` }))) : null));
  });
  alan.replaceChildren(izgara, cubuklar);
  const n = Math.min(6, liste.length);
  xEl.replaceChildren(...Array.from({ length: n }, (_, j) => { const i = Math.round(j * (liste.length - 1) / (n - 1)); return el('span', { style: `left: ${((i + 0.5) / liste.length) * 100}%` }, gunYaz(liste[i])); }));
}
// Eksen etiketi: 1.500 → 1,5 B; 12.000 → 12 B
const kisa = (v) => (v >= 1000 ? new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 }).format(v / 1000) + ' B' : sayi(v));
