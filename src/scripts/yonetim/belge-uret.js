// Şablondan belge üretimi (tarayıcıda): sayfa görseli + değişken metinler canvas'a çizilir, sayfalar JPEG olarak PDF'e konur.
// Sabit sayfaların JPEG'i olduğu gibi gömülür (yeniden sıkıştırılmaz). Yazı tipleri: Comfortaa ve Abel (OFL, /fonts/).
import { SAYFA_EN, SAYFA_BOY, tarihUzun, kapakBasligi, tlBelge, satirYerlesimi, HIZMET_DUZEN, KALEM_DUZEN, jpegBilgi, pdfOlustur } from './sablon-hesap.js';

const YAZI = '#231f20', TURUNCU = '#eb7305';
const ORTAK = '/yonetim/veri/sablon/ortak/';

// Şablondaki görsel: varsayılan yol (derlemeyle gelir) ya da R2 anahtarı (sablon/<id>/<sürüm>/<sayfa>.jpg)
export function gorselAdresi(g) {
  const m = /^sablon\/([\w-]+)\/(\d+)\/(\d+)\.jpg$/.exec(String(g || ''));
  return m ? `/api/yonetim/belge-sablonlari/${m[1]}/gorsel/${m[2]}/${m[3]}` : String(g || '');
}

let fontSoz = null;
export function fontlarHazir() {
  if (!fontSoz) {
    const f = [new FontFace('IdxComfortaa', 'url(/fonts/comfortaa.ttf)', { weight: '300 700' }), new FontFace('IdxAbel', 'url(/fonts/abel.ttf)')];
    fontSoz = Promise.all(f.map((x) => x.load())).then((l) => { l.forEach((x) => document.fonts.add(x)); });
  }
  return fontSoz;
}

const gorselOnbellek = new Map();
export function gorselYukle(adres) {
  if (!gorselOnbellek.has(adres)) {
    gorselOnbellek.set(adres, new Promise((tamam, red) => {
      const i = new Image();
      i.onload = () => tamam(i);
      i.onerror = () => { gorselOnbellek.delete(adres); red(new Error('Sayfa görseli açılamadı: ' + adres)); };
      i.src = adres;
    }));
  }
  return gorselOnbellek.get(adres);
}

// Belgenin sayfa planı: hizmet ve kalem listesi sığmazsa aynı sayfa (aynı arka planla) tekrarlanır.
// veri: { firma, tarih: 'YYYY-AA-GG', kalemler: [{ ad, tur: 'aylik'|'tek_seferlik', fiyat_kurus, simge }] }
export function sayfaPlani(sayfalar, veri) {
  const plan = [];
  sayfalar.forEach((s, i) => {
    if (s.tip === 'hizmetler' || s.tip === 'kalemler') {
      const a = (s.alanlar && s.alanlar.liste) || {};
      const duzen = s.tip === 'hizmetler' ? HIZMET_DUZEN : KALEM_DUZEN;
      const ust = a.y ?? (s.tip === 'hizmetler' ? 1172 : 1268), alt = a.alt ?? (s.tip === 'hizmetler' ? 2150 : 2050);
      satirYerlesimi(veri.kalemler.length, { ust, alt, ...duzen }).forEach((p, j) => plan.push({ sayfa: s, no: i + 1, devam: j > 0, satirlar: p.satirlar, adim: p.adim }));
    } else plan.push({ sayfa: s, no: i + 1 });
  });
  return plan;
}

// Metni en çok "en" piksel genişliğe sığacak kadar küçültür.
function sigdir(ctx, metin, boyut, en, aile, kalinlik = 400, enAz = 0.55) {
  let b = boyut;
  ctx.font = `${kalinlik} ${b}px ${aile}`;
  while (ctx.measureText(metin).width > en && b > boyut * enAz) { b -= 1; ctx.font = `${kalinlik} ${b}px ${aile}`; }
  return b;
}

function yuvarlakDortgen(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

async function simgeCiz(ctx, simge, x, y) {
  if (simge === 'google' || simge === 'meta') { ctx.drawImage(await gorselYukle(ORTAK + simge + '.png'), x, y, 150, 150); return; }
  // Sade turuncu simge: yuvarlak kare içinde beyaz halka ve nokta
  ctx.fillStyle = TURUNCU; yuvarlakDortgen(ctx, x + 1, y + 1, 148, 148, 30); ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 12; ctx.beginPath(); ctx.arc(x + 75, y + 75, 36, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x + 75, y + 75, 12, 0, Math.PI * 2); ctx.fill();
}

// Tek sayfayı 1654 × 2339 canvas'a çizer.
export async function sayfaCiz(canvas, p, veri) {
  canvas.width = SAYFA_EN; canvas.height = SAYFA_BOY;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, SAYFA_EN, SAYFA_BOY);
  ctx.drawImage(await gorselYukle(gorselAdresi(p.sayfa.gorsel)), 0, 0, SAYFA_EN, SAYFA_BOY);
  const s = p.sayfa, a = s.alanlar || {}, m = s.metinler || {};
  if (s.tip === 'sabit') return;
  await fontlarHazir();
  ctx.textBaseline = 'alphabetic'; ctx.fillStyle = YAZI;
  if (s.tip === 'kapak') {
    const b = a.baslik || { x: 82, y: 2049, boyut: 33 }, t = a.tarih || { x: 80, y: 2218, boyut: 31 };
    const baslik = kapakBasligi(m.baslik, veri.firma);
    sigdir(ctx, baslik, b.boyut, 1000 - b.x, 'IdxComfortaa');
    ctx.fillText(baslik, b.x, b.y);
    ctx.font = `400 ${t.boyut}px IdxComfortaa`;
    ctx.fillText(tarihUzun(veri.tarih), t.x, t.y);
    return;
  }
  const onay = await gorselYukle(ORTAK + 'onay.png');
  const l = a.liste || {};
  if (s.tip === 'hizmetler') {
    const ust = l.y ?? 1172, boyut = l.boyut ?? 54;
    for (const [j, i] of p.satirlar.entries()) {
      const k = veri.kalemler[i], y = ust + j * p.adim;
      ctx.drawImage(onay, 81, y + 40, 110, 76);
      ctx.fillStyle = YAZI; sigdir(ctx, k.ad, boyut, 1400 - 213, 'IdxComfortaa');
      ctx.fillText(k.ad, 213, y + 93);
      await simgeCiz(ctx, k.simge, 1427, y);
    }
    return;
  }
  // kalemler: ✓ + "Hizmet adı **" + sağda turuncu kutuda fiyat
  const ust = l.y ?? 1268, boyut = l.boyut ?? 55;
  for (const [j, i] of p.satirlar.entries()) {
    const k = veri.kalemler[i], y = ust + j * p.adim;
    ctx.drawImage(onay, 79, y + 3, 110, 76);
    const metin = `${k.ad} ${k.tur === 'tek_seferlik' ? (m.tek_isaret ?? '*') : (m.aylik_isaret ?? '**')}`.trim();
    ctx.fillStyle = YAZI; sigdir(ctx, metin, boyut, 1170 - 211, 'IdxComfortaa');
    ctx.fillText(metin, 211, y + 54);
    ctx.fillStyle = TURUNCU; yuvarlakDortgen(ctx, 1200, y, 368, 81, 6); ctx.fill();
    const fiyat = tlBelge(k.fiyat_kurus);
    ctx.fillStyle = '#fff'; ctx.letterSpacing = '2.5px';
    sigdir(ctx, fiyat, 54, 368 - 50, 'IdxAbel', 400, 0.5);
    ctx.fillText(fiyat, 1230, y + 52);
    ctx.letterSpacing = '0px';
  }
}

const jpegAl = (canvas) => new Promise((tamam, red) => canvas.toBlob((b) => (b ? b.arrayBuffer().then((x) => tamam(new Uint8Array(x)), red) : red(new Error('Sayfa görsele çevrilemedi'))), 'image/jpeg', 0.9));

// PDF üretir: { pdf: Uint8Array, sayfaSayisi }. ilerleme(i, n) isteğe bağlı.
export async function belgePdf(sayfalar, veri, { baslik = '', yazar = 'Idexya', ilerleme } = {}) {
  await fontlarHazir();
  const plan = sayfaPlani(sayfalar, veri), jpgler = [];
  const canvas = document.createElement('canvas');
  for (const [i, p] of plan.entries()) {
    if (ilerleme) ilerleme(i + 1, plan.length);
    if (p.sayfa.tip === 'sabit') {
      // Sabit sayfa: JPEG baytları doğrudan (RGB ya da gri değilse yeniden çizilir)
      const r = await fetch(gorselAdresi(p.sayfa.gorsel), { credentials: 'same-origin' });
      if (!r.ok) throw new Error(`${p.no}. sayfanın görseli alınamadı`);
      const b = new Uint8Array(await r.arrayBuffer()), bilgi = jpegBilgi(b);
      if (bilgi && [1, 3].includes(bilgi.bilesen)) { jpgler.push(b); continue; }
    }
    await sayfaCiz(canvas, p, veri);
    jpgler.push(await jpegAl(canvas));
  }
  return { pdf: pdfOlustur(jpgler, { baslik, yazar }), sayfaSayisi: plan.length };
}
