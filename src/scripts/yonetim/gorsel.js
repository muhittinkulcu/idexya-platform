// Zengin görünüm (9. tur, Muhittin 25 Kas 2026; IDOS'taki components/Gorsel.tsx ile aynı dil): kart başlığına ve gösterge kartına
// konuya göre renkli simge, boş duruma çizim. Sayfa betikleri değişmez; kart sonradan çizilse de aynı karede eklenir
// (MutationObserver boyamadan önce çalışır). Yükleniyor ve hata metnine çizim konmaz. Simgeler süsdür (aria-hidden).
const S = {
  onay: ['M2 12l5 5L18 6', 'M22 10l-7.5 7.5L13 16'], saat: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M12 7v5l3 2'], tel: ['M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2'],
  yenile: ['M21 12a9 9 0 0 1-15.5 6.2L3 16', 'M3 12a9 9 0 0 1 15.5-6.2L21 8', 'M21 3v5h-5', 'M3 21v-5h5'], takvim: ['M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z', 'M16 2v4', 'M8 2v4', 'M3 10h18'],
  zil: ['M18 8a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8', 'M10.5 20a2 2 0 0 0 3 0'], mesaj: ['M21 12a8 8 0 0 1-11.5 7.2L4 21l1.8-5.5A8 8 0 1 1 21 12z'], para: ['M3 6h18v12H3z', 'M12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z', 'M6.5 12h.01M17.5 12h.01'],
  hedef: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M12 12h.01'], megafon: ['M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z', 'M15 9a4 4 0 0 1 0 6', 'M18 6a8 8 0 0 1 0 12'],
  ara: ['M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z', 'M21 21l-5-5'], dunya: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M3 12h18', 'M12 3a14 14 0 0 1 0 18', 'M12 3a14 14 0 0 0 0 18'],
  veri: ['M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3z', 'M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6', 'M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3'], bag: ['M9 15l6-6', 'M11 6l1-1a5 5 0 0 1 7 7l-1 1', 'M13 18l-1 1a5 5 0 0 1-7-7l1-1'],
  belge: ['M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z', 'M14 3v6h6', 'M8 13h8', 'M8 17h5'], bot: ['M5 9h14v10H5z', 'M12 9V5', 'M12 5h.01', 'M9 14h.01M15 14h.01', 'M2 13v3M22 13v3'],
  kisi: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M22 21v-2a4 4 0 0 0-3-3.9', 'M16 3.1a4 4 0 0 1 0 7.8'], is: ['M3 6l1.5 1.5L7 5', 'M3 13l1.5 1.5L7 12', 'M11 6h10', 'M11 13h10', 'M11 20h10', 'M4 20h2'],
  kalkan: ['M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z', 'M9 12l2 2 4-4'], hiz: ['M4 18a9 9 0 1 1 16 0', 'M12 14l4-5'], sepet: ['M3 4h2l2.2 10.2a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.1L21 8H6.2', 'M9.5 20h.01', 'M17 20h.01'],
  artis: ['M3 17l6-6 4 4 8-8', 'M15 7h6v6'], gorsel: ['M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z', 'M8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z', 'M21 15l-5-5L5 21'],
  huni: ['M3 4h18l-7 8v6l-4 2v-8z'], ayar: ['M4 7h10M18 7h2M4 17h2M10 17h10', 'M16 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4z', 'M8 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z'], grafik: ['M4 20V10', 'M10 20V4', 'M16 20v-7', 'M21 20H3'], gelen: ['M22 12h-6l-2 3h-4l-2-3H2', 'M5.5 5h13L22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z']
};
// Sıra önemli: ilk eşleşen konu kazanır.
const KONU = [
  [/hızlı işlem/i, 'is', 'mavi'], [/huni|aşama|fırsat/i, 'huni', 'pembe'], [/uyarı|sorun|risk|hata|alarm|geri dön/i, 'zil', 'kirmizi'], [/bekleyen|bekliyor|gecik|ayıkla/i, 'saat', 'altin'], [/onay|karar/i, 'onay', 'mavi'], [/talep|başvuru|gelen/i, 'gelen', 'mavi'],
  [/yorum|sohbet|mesaj|destek|görüşme/i, 'mesaj', 'turkuaz'], [/telefon|iletişim/i, 'tel', 'turkuaz'], [/tutar|gelir|gider|tahsil|ödeme|fatura|bakiye|harcama|değer|maliyet|kasa/i, 'para', 'yesil'],
  [/kazan|hedef|dönüşüm|müşteriye/i, 'hedef', 'yesil'], [/asistan|yapay/i, 'bot', 'turkuaz'], [/reklam|kampanya|banner|duyuru|bülten/i, 'megafon', 'mor'], [/seo|arama|sorgu|dizin|sıra/i, 'ara', 'yesil'], [/hız|performans|puan|sağlık/i, 'hiz', 'turkuaz'],
  [/görev|iş planı/i, 'is', 'mavi'], [/takvim|takip|yenileme|bugün/i, 'takvim', 'mavi'], [/yedek|eşitle|aktarım|veri|kayıt/i, 'veri', 'gri'], [/entegrasyon|bağlantı|hesap/i, 'bag', 'gri'], [/güvenlik|yetki|erişim|parola|oturum/i, 'kalkan', 'yesil'],
  [/görsel|medya|galeri|gönderi|tema|renk|logo/i, 'gorsel', 'pembe'], [/teklif|belge|şablon|sözleşme|rapor|yazı|içerik|blog|not/i, 'belge', 'mor'], [/üye|müşteri|kişi|abone|ziyaretçi|kullanıcı|ekip/i, 'kisi', 'yesil'],
  [/site|sayfa|ülke|cihaz|kaynak|alan adı/i, 'dunya', 'turkuaz'], [/ürün|paket|hizmet|sipariş/i, 'sepet', 'yesil'], [/trend|eğilim|değişim|artış/i, 'artis', 'mavi'], [/saat|süre|dönem|gün|hareket|günlük/i, 'saat', 'altin'], [/yenile|sürüm/i, 'yenile', 'mor'], [/ayar/i, 'ayar', 'gri']
];
// Türkçe küçük harf: /i bayrağı "İ" ile "i"yi eşlemez.
export function konu(metin) { const t = String(metin || '').toLocaleLowerCase('tr-TR'), e = KONU.find(([r]) => r.test(t)); return e ? { simge: e[1], renk: e[2] } : { simge: 'grafik', renk: 'mavi' }; }

const NS = 'http://www.w3.org/2000/svg';
function svg(kutu, sinif) { const s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', kutu); s.setAttribute('aria-hidden', 'true'); if (sinif) s.setAttribute('class', sinif); return s; }
const yol = (d, sinif) => { const p = document.createElementNS(NS, 'path'); p.setAttribute('d', d); if (sinif) p.setAttribute('class', sinif); return p; };
export function kare(metin, sinif = '') {
  const g = konu(metin), k = document.createElement('span');
  k.className = ('kare ' + sinif).trim(); k.setAttribute('aria-hidden', 'true'); k.dataset.renk = g.renk;
  const s = svg('0 0 24 24'); s.append(...S[g.simge].map((d) => yol(d))); k.append(s);
  return k;
}
/** Ad baş harfleri (en çok iki harf, Türkçe büyük harf); ad yoksa "—". */
export const basHarfler = (ad) => { const p = String(ad || '').trim().split(/\s+/).filter((x) => /[\p{L}\p{N}]/u.test(x)); return ((p[0] ? [...p[0]][0] : '') + (p.length > 1 ? [...p[p.length - 1]][0] : (p[0] ? [...p[0]][1] || '' : ''))).toLocaleUpperCase('tr-TR') || '—'; };

// Boş durum çizimleri (yuvarlak köşeli dikdörtgen: yol).
const dik = (x, y, w, h, r) => `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1-${r} ${r}h-${w - 2 * r}a${r} ${r} 0 0 1-${r}-${r}v-${h - 2 * r}a${r} ${r} 0 0 1 ${r}-${r}z`;
const daire = (x, y, r) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0-${2 * r} 0z`;
const CIZIM = {
  takvim: [[dik(16, 18, 92, 76, 12), 'cz1'], ['M16 40V30a12 12 0 0 1 12-12h68a12 12 0 0 1 12 12v10z', 'cz3'], ['M36 10v16M88 10v16', 'cz-cizgi'], [[0, 1, 2, 3, 4].flatMap((i) => [0, 1].map((j) => dik(26 + i * 16, 52 + j * 18, 10, 10, 3))).join(''), 'cz2'], [daire(106, 82, 17), 'cz-vurgu'], ['M106 74v16M98 82h16', 'cz-beyaz']],
  belge: [['M26 10h50l22 22v62a6 6 0 0 1-6 6H32a6 6 0 0 1-6-6z', 'cz1'], ['M76 10l22 22H76z', 'cz3'], ['M40 48h44M40 62h44M40 76h26', 'cz-ince'], [daire(102, 82, 17), 'cz-vurgu'], ['M95 82l5 5 10-11', 'cz-beyaz']],
  arama: [[dik(14, 16, 86, 72, 12), 'cz1'], ['M28 36h40M28 52h54M28 68h30', 'cz-ince'], [daire(88, 66, 20), 'cz-kutu'], ['M102 81l16 16', 'cz-cizgi']],
  kutu: [['M20 52l16-30h60l16 30v34a8 8 0 0 1-8 8H28a8 8 0 0 1-8-8z', 'cz1'], ['M20 52h26l6 14h28l6-14h26v34a8 8 0 0 1-8 8H28a8 8 0 0 1-8-8z', 'cz2'], ['M66 12v24M56 28l10 10 10-10', 'cz-cizgi']]
};
const CIZIMSIZ = /yükleniyor|yüklenemedi|alınamadı|okunamadı|hata|başarısız/i;
function bosCiz(b) {
  if (b.dataset.cizim !== undefined) return;
  const t = b.textContent.trim().toLocaleLowerCase('tr-TR');
  if (!t || CIZIMSIZ.test(t)) return;
  b.dataset.cizim = '';
  // Dar yer (elle verilen küçük iç boşluk) ve tablo satırı çizimsiz kalır.
  if (b.style.padding || b.closest('td, li, details')) return;
  const tur = /takip|takvim|görev|yenileme|bugün/i.test(t) ? 'takvim' : /eşleş|süzgeç|arama|ölçüm|denetim/i.test(t) ? 'arama' : /sözleşme|rapor|belge|teklif|not|içerik|kayıt|yazı|bülten|şablon/i.test(t) ? 'belge' : 'kutu';
  const s = svg('0 0 132 106', 'bos-cizim'); s.dataset.renk = konu(t).renk; s.append(...CIZIM[tur].map(([d, c]) => yol(d, c)));
  b.prepend(s);
}

function baslikSimge(h) {
  if (h.dataset.simge !== undefined) return;
  const ad = h.textContent.trim();
  if (!ad) return;
  h.dataset.simge = '';
  const ust = h.parentElement;
  // Başlık + kapsam satırı aynı kutudaysa simge ikisinin solunda; tek başına başlıkta satırın içinde.
  if (ust.matches('.modul-bas > div:first-child')) { ust.classList.add('bas-simgeli'); ust.prepend(kare(ad)); }
  else { h.classList.add('kart-baslik'); h.prepend(kare(ad, 'kare-kucuk')); }
}
function kpiSimge(k) {
  if (k.dataset.simge !== undefined) return;
  const ilk = k.querySelector(':scope > span');
  if (!ilk || ilk.classList.contains('kare')) return;
  k.dataset.simge = '';
  k.prepend(kare(ilk.textContent));
}

export function gorsel() {
  const ana = document.querySelector('main') || document.body, yuva = document.querySelector('[data-bant-yuva]'), ozet = ana.querySelector('.sayfa > [data-ozet-kutusu]');
  // Özet cümlesi başlık bandının içinde durur (onaylı çizim); kutu boşken gizlidir, sayfa betiği aynı öğeyi doldurur.
  if (yuva && ozet) { ozet.classList.remove('kart'); yuva.append(ozet); }
  const tara = () => {
    ana.querySelectorAll('.kart.modul h2, .modul-bas h2, .kart h2[data-kart-bilgi], .kart h3[data-kart-bilgi]').forEach(baslikSimge);
    ana.querySelectorAll('.kpi').forEach(kpiSimge);
    ana.querySelectorAll('.bos').forEach(bosCiz);
  };
  new MutationObserver(tara).observe(ana, { childList: true, subtree: true });
  tara();
}
