// Metin sayfası motoru (belge şablonları, 12 Kas 2026). Tarayıcı ve Node testleri ortak kullanır; DOM gerektirmez.
// · Sade biçim: "# başlık", "## alt başlık", "- madde", "- [ ] / - [x] işaret kutusu", "| tablo | satırı |", "**kalın**",
//   "> not kutusu", "@imza" (ardından gelen tablo imza alanı olur), "@sayfa" (yeni sayfa), "// düzenleyici notu" (PDF'e girmez).
//   Satır başında "?{ad=deger} " koşulu: satır yalnız değişken bu değerdeyse basılır ("!=" tersi; "a,b" seçenekler; boş = değer yok).
// · {degisken} yer tutucuları biçim çözüldükten SONRA doldurulur: değişken değeri hiçbir zaman biçim (kalın, tablo) ya da HTML
//   olarak yorumlanmaz, düz metin kalır. Değerler denetim karakterlerinden arındırılır, kırpılır ve uzunluğu sınırlıdır.
//   Bilinmeyen ya da boş değişken "—" basılır.
// · Yerleşim ölçme işlevine (olc) bağlıdır: tarayıcıda canvas measureText, testte sahte ölçü. Sözcük sınırında kırılır; sözcük
//   satırdan uzunsa harf harf bölünür. Sığmayan metin bir sonraki sayfaya akar; tablo başlığı yeni sayfada tekrarlanır.
// · Çıktı çizim listesidir (yazı, çizgi, kutu, görsel); canvas'a çizen kod src/scripts/yonetim/belge-uret.js içindedir.

export const SINIR = { deger: 500, uzun: 1500, metin: 30000, satir: 40, sutun: 8 };
export const SAYFA = { en: 1654, boy: 2339, sol: 157, sag: 1497, ust: 250, alt: 2150, altParaf: 2110 };
export const RENK = { yazi: '#231f20', turuncu: '#eb7305', gri: '#6b6b6b', cizgi: '#e6dcd3', zemin: '#fdf1e6' };
export const DAMGA_METNI = 'TASLAK — avukat incelemesinden geçmemiştir';
const DEG = /\{([a-z0-9_]{1,40})\}/g;
const KOSUL = /^\s*\?\{([a-z0-9_]{1,40})(!=|=)([^}]{0,200})\}\s?/;

// Değişken değeri: yalnız düz metin, tek satır, en çok "sinir" karakter. Yön değiştiren görünmez karakterler de atılır.
export function degerTemizle(v, sinir = SINIR.deger) {
  if (v === null || v === undefined || typeof v === 'object') return '';
  return String(v).replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e\u2066-\u2069\ufeff]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, sinir);
}
// Şablon metni: denetim karakterleri atılır (satır sonu kalır), satır sonları birleştirilir.
export const sablonMetniTemizle = (m) => String(m || '').replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000b-\u001f\u007f\u202a-\u202e\u2066-\u2069]/g, '').slice(0, SINIR.metin);

const degerMetni = (v) => (Array.isArray(v) ? v.map((x) => degerTemizle(x)).filter(Boolean).join(', ') : degerTemizle(v));
export function kosulTutar(ad, isaret, beklenen, degerler) {
  const v = degerMetni((degerler || {})[ad]);
  const secenek = String(beklenen).split(',').map((x) => x.trim());
  const tut = secenek.includes(v);
  return isaret === '=' ? tut : !tut;
}
// Sayfa koşulu: "ad=deger" ya da "ad!=deger"
export function sayfaKosulu(kosul, degerler) {
  if (!kosul) return true;
  const m = /^([a-z0-9_]{1,40})(!=|=)([a-z0-9_,]{0,100})$/.exec(kosul);
  return m ? kosulTutar(m[1], m[2], m[3], degerler) : true;
}

// Metindeki değişken adları (koşullardakiler dahil), görülme sırasıyla
export function degiskenleriBul(metin) {
  const s = new Set();
  for (const satir of String(metin || '').split('\n')) {
    if (satir.trim().startsWith('//')) continue;
    let x = satir, m;
    while ((m = KOSUL.exec(x))) { s.add(m[1]); x = x.slice(m[0].length); }
    for (const d of x.matchAll(DEG)) s.add(d[1]);
  }
  return [...s];
}

// Satır içi: **kalın** ayrılır, sonra her parçadaki {değişken} düz metinle doldurulur.
export function satirIci(metin, degerler = {}) {
  const parcalar = [];
  String(metin).split('**').forEach((p, i) => {
    if (!p) return;
    const dolu = p.replace(DEG, (_, ad) => degerMetni(degerler[ad]) || '—');
    const kalin = i % 2 === 1;
    const son = parcalar[parcalar.length - 1];
    if (son && son.kalin === kalin) son.metin += dolu; else parcalar.push({ metin: dolu, kalin });
  });
  return parcalar;
}
const duz = (m) => [{ metin: degerTemizle(m) || '—', kalin: false }];
const hucreler = (t) => t.replace(/^\|/, '').replace(/\|$/, '').split('|').map((h) => h.trim());

// Kaynak metni bloklara ayırır. degerler: { ad: metin | [[hücre, ...], ...] (satırlar) }
export function metinAyristir(kaynak, degerler = {}) {
  const bloklar = [];
  let tablo = null, imza = false;
  const kapat = () => { if (tablo) { bloklar.push(tablo); tablo = null; } };
  for (const ham of sablonMetniTemizle(kaynak).split('\n')) {
    let s = ham, m, gec = true;
    while ((m = KOSUL.exec(s))) { if (!kosulTutar(m[1], m[2], m[3], degerler)) gec = false; s = s.slice(m[0].length); }
    if (!gec) continue;
    const t = s.trim();
    if (t.startsWith('//')) continue;
    if (t.startsWith('|')) {
      const h = hucreler(t);
      if (!tablo) { tablo = { tur: 'tablo', satirlar: [], baslikli: false, imza }; imza = false; }
      if (h.every((x) => /^:?-{2,}:?$/.test(x))) { if (tablo.satirlar.length === 1) tablo.baslikli = true; continue; }
      const tek = h.length === 1 && /^\{([a-z0-9_]{1,40})\}$/.exec(h[0]);
      if (tek && Array.isArray(degerler[tek[1]])) {
        const sutun = Math.max(1, ...tablo.satirlar.map((r) => r.length));
        const liste = degerler[tek[1]].filter(Array.isArray).slice(0, SINIR.satir);
        if (!liste.length) tablo.satirlar.push(Array.from({ length: sutun }, () => duz('')));
        for (const r of liste) tablo.satirlar.push(r.slice(0, SINIR.sutun).map((x) => duz(x)));
        continue;
      }
      tablo.satirlar.push(h.slice(0, SINIR.sutun).map((x) => satirIci(x, degerler)));
      continue;
    }
    kapat();
    if (!t) { if (bloklar.length && bloklar[bloklar.length - 1].tur !== 'bosluk') bloklar.push({ tur: 'bosluk' }); continue; }
    if (t === '@imza') { imza = true; continue; }
    if (t === '@sayfa') { bloklar.push({ tur: 'sayfa' }); continue; }
    if ((m = /^(#{1,2})\s+(.*)$/.exec(t))) { bloklar.push({ tur: 'baslik', seviye: m[1].length, parcalar: satirIci(m[2], degerler) }); continue; }
    if ((m = /^-\s+\[( |x)\]\s+(.*)$/i.exec(t))) { bloklar.push({ tur: 'madde', kutu: m[1] === ' ' ? 'bos' : 'dolu', parcalar: satirIci(m[2], degerler) }); continue; }
    if ((m = /^-\s+(.*)$/.exec(t))) { bloklar.push({ tur: 'madde', parcalar: satirIci(m[1], degerler) }); continue; }
    if ((m = /^>\s?(.*)$/.exec(t))) { bloklar.push({ tur: 'not', parcalar: satirIci(m[1], degerler) }); continue; }
    bloklar.push({ tur: 'paragraf', parcalar: satirIci(t, degerler) });
  }
  kapat();
  return bloklar;
}

// --- Satır kırma ---
// olc(metin, { boyut, kalin }) → piksel genişliği
export function satirla(parcalar, en, boyut, olc) {
  const satirlar = [];
  let satir = [], x = 0;
  const bitir = () => {
    // Satır sonundaki boşluk atılır (genişlik hesabına katılmaz)
    const son = satir[satir.length - 1];
    if (son && /\s$/.test(son.metin)) {
      const t = son.metin.replace(/\s+$/, ''), w = t ? olc(t, { boyut, kalin: son.kalin }) : 0;
      x -= son.en - w; son.metin = t; son.en = w;
      if (!t) satir.pop();
    }
    satirlar.push({ parcalar: satir, en: x }); satir = []; x = 0;
  };
  const ekle = (metin, kalin, w) => {
    const son = satir[satir.length - 1];
    if (son && son.kalin === kalin) { son.metin += metin; son.en += w; } else satir.push({ metin, kalin, x, en: w });
    x += w;
  };
  for (const p of parcalar) {
    const f = { boyut, kalin: p.kalin };
    for (const parca of p.metin.split(/(\s+)/)) {
      if (!parca) continue;
      if (/^\s+$/.test(parca)) { if (satir.length) ekle(' ', p.kalin, olc(' ', f)); continue; }
      let w = olc(parca, f);
      if (x + w > en && satir.length) bitir();
      if (w <= en) { ekle(parca, p.kalin, w); continue; }
      // Satırdan uzun sözcük: harf harf
      let kalan = '';
      for (const c of parca) {
        const cw = olc(kalan + c, f);
        if (x + cw > en && kalan) { ekle(kalan, p.kalin, olc(kalan, f)); bitir(); kalan = c; } else kalan += c;
      }
      if (kalan) ekle(kalan, p.kalin, olc(kalan, f));
    }
  }
  if (satir.length || !satirlar.length) bitir();
  // x konumlarını yeniden hesapla (birleşen parçalar için)
  for (const s of satirlar) { let px = 0; for (const p of s.parcalar) { p.x = px; px += p.en; } }
  return satirlar;
}

// --- Yerleşim ---
const OLCU = {
  govde: { boyut: 27, ara: 39, sonra: 12 },
  b1: { boyut: 44, ara: 58, once: 6, sonra: 16 },
  b2: { boyut: 31, ara: 42, once: 22, sonra: 8 },
  madde: { girinti: 36, sonra: 6 },
  not: { boyut: 23, ara: 33, girinti: 24, sonra: 14 },
  tablo: { boyut: 23, ara: 31, pad: 12, dikey: 10, sonra: 18 },
  bosluk: 12
};

// bloklar → sayfalar: [[işlem, ...], ...]. ayar: { paraf } (paraf satırı için alt sınır yükselir)
export function metinYerlesim(bloklar, olc, ayar = {}) {
  const sol = SAYFA.sol, en = SAYFA.sag - SAYFA.sol, alt = ayar.paraf ? SAYFA.altParaf : SAYFA.alt;
  const sayfalar = [[]];
  let y = SAYFA.ust;
  const ops = () => sayfalar[sayfalar.length - 1];
  const yeniSayfa = () => { sayfalar.push([]); y = SAYFA.ust; };
  const sigar = (h) => y + h <= alt || y === SAYFA.ust;
  const yaziSatiri = (s, x0, yy, boyut, renk, kalinHep = false) => {
    for (const p of s.parcalar) if (p.metin.trim()) ops().push({ t: 'yazi', x: x0 + p.x, y: yy, metin: p.metin, boyut, kalin: kalinHep || p.kalin, renk });
  };
  const paragraf = (parcalar, x0, gen, o, renk, kalinHep, onIslem) => {
    const satirlar = satirla(kalinHep ? parcalar.map((p) => ({ ...p, kalin: true })) : parcalar, gen, o.boyut, olc);
    satirlar.forEach((s, i) => {
      if (!sigar(o.ara)) yeniSayfa();
      if (i === 0 && onIslem) onIslem(y);
      yaziSatiri(s, x0, y, o.boyut, renk, kalinHep);
      y += o.ara;
    });
    return satirlar.length;
  };
  for (const [bi, b] of bloklar.entries()) {
    if (b.tur === 'sayfa') { if (ops().length) yeniSayfa(); continue; }
    if (b.tur === 'bosluk') { if (y > SAYFA.ust) y += OLCU.bosluk; continue; }
    if (b.tur === 'baslik') {
      const o = b.seviye === 1 ? OLCU.b1 : OLCU.b2;
      const satirSay = satirla(b.parcalar, en, o.boyut, olc).length;
      // Başlık sayfa sonunda yalnız kalmaz: başlık + sonraki bloğun iki satırı sığmalı
      const sonraki = bloklar[bi + 1];
      const pay = sonraki && sonraki.tur === 'tablo' ? OLCU.tablo.ara * 3 : OLCU.govde.ara * 2;
      if (y > SAYFA.ust) y += o.once;
      if (!(y + satirSay * o.ara + pay <= alt) && y > SAYFA.ust) yeniSayfa();
      paragraf(b.parcalar, sol, en, o, b.seviye === 1 ? RENK.turuncu : RENK.yazi, true);
      if (b.seviye === 1) { ops().push({ t: 'cizgi', x1: sol, y1: y + 2, x2: sol + 120, y2: y + 2, renk: RENK.turuncu, kalinlik: 4 }); y += 10; }
      y += o.sonra;
      continue;
    }
    if (b.tur === 'paragraf') { paragraf(b.parcalar, sol, en, OLCU.govde, RENK.yazi); y += OLCU.govde.sonra; continue; }
    if (b.tur === 'madde') {
      const o = OLCU.govde, g = OLCU.madde.girinti;
      paragraf(b.parcalar, sol + g, en - g, o, RENK.yazi, false, (yy) => {
        if (b.kutu) ops().push({ t: 'onay', x: sol + 2, y: yy + 6, boyut: 22, dolu: b.kutu === 'dolu' });
        else ops().push({ t: 'nokta', x: sol + 10, y: yy + o.boyut * 0.55, r: 5, renk: RENK.turuncu });
      });
      y += OLCU.madde.sonra;
      continue;
    }
    if (b.tur === 'not') {
      const o = OLCU.not, bas = y;
      const satirlar = satirla(b.parcalar, en - o.girinti, o.boyut, olc);
      if (!sigar(satirlar.length * o.ara + 16)) yeniSayfa();
      const y0 = y;
      satirlar.forEach((s) => { yaziSatiri(s, sol + o.girinti, y + 8, o.boyut, RENK.gri); y += o.ara; });
      ops().push({ t: 'kutu', x: sol, y: y0, w: 4, h: y - y0 + 14, dolgu: RENK.turuncu });
      y += 14 + o.sonra;
      void bas;
      continue;
    }
    if (b.tur === 'tablo') { y = tabloYerlesim(b, olc, sol, en, alt, () => y, (v) => { y = v; }, ops, yeniSayfa); continue; }
  }
  // Sondaki boş sayfa atılır
  if (sayfalar.length > 1 && !sayfalar[sayfalar.length - 1].length) sayfalar.pop();
  return sayfalar;
}

function tabloYerlesim(b, olc, sol, en, alt, yAl, yYaz, ops, yeniSayfa) {
  const o = OLCU.tablo;
  const sutun = Math.max(...b.satirlar.map((r) => r.length));
  if (!sutun) return yAl();
  const metinOf = (h) => h.map((p) => p.metin).join('');
  if (b.imza) {
    // İmza alanı: sütunlar eşit, çerçevesiz; altında imza çizgisi. Bölünmez.
    const gen = en / sutun, satirH = b.satirlar.map((r) => Math.max(...r.map((h) => satirla(h, gen - 30, OLCU.govde.boyut, olc).length)));
    const toplam = satirH.reduce((a, x) => a + x * OLCU.govde.ara, 0) + 150;
    if (!(yAl() + toplam <= alt) && yAl() > SAYFA.ust) yeniSayfa();
    let y = yAl() + 10;
    b.satirlar.forEach((r, ri) => {
      for (let c = 0; c < sutun; c++) {
        const h = r[c] || [];
        satirla(ri === 0 ? h.map((p) => ({ ...p, kalin: true })) : h, gen - 30, OLCU.govde.boyut, olc).forEach((s, si) => {
          for (const p of s.parcalar) if (p.metin.trim()) ops().push({ t: 'yazi', x: sol + c * gen + p.x, y: y + si * OLCU.govde.ara, metin: p.metin, boyut: OLCU.govde.boyut, kalin: ri === 0 || p.kalin, renk: RENK.yazi });
        });
      }
      y += satirH[ri] * OLCU.govde.ara;
    });
    y += 110;
    for (let c = 0; c < sutun; c++) ops().push({ t: 'cizgi', x1: sol + c * gen, y1: y, x2: sol + c * gen + gen - 60, y2: y, renk: RENK.yazi, kalinlik: 1.5 });
    return y + 30;
  }
  // Sütun genişlikleri: doğal genişlik (tek satırda) ve en az genişlik (en uzun sözcük)
  const dogal = Array(sutun).fill(0), enAz = Array(sutun).fill(0);
  for (const r of b.satirlar) for (let c = 0; c < sutun; c++) {
    const h = r[c] || [];
    dogal[c] = Math.max(dogal[c], olc(metinOf(h), { boyut: o.boyut, kalin: false }) + 2 * o.pad + 4);
    for (const s of metinOf(h).split(/\s+/)) enAz[c] = Math.max(enAz[c], Math.min(en / sutun, olc(s, { boyut: o.boyut, kalin: true }) + 2 * o.pad + 4));
  }
  let gen;
  const top = dogal.reduce((a, x) => a + x, 0);
  if (top <= en) gen = dogal.map((x) => x + (en - top) * (x / top));
  else {
    const tabanTop = enAz.reduce((a, x) => a + x, 0), artik = Math.max(0, en - tabanTop), fark = dogal.map((x, i) => x - enAz[i]), farkTop = fark.reduce((a, x) => a + x, 0) || 1;
    gen = enAz.map((x, i) => x + artik * (fark[i] / farkTop));
    const olcek = en / gen.reduce((a, x) => a + x, 0);
    if (olcek < 1) gen = gen.map((x) => x * olcek);
  }
  const xler = gen.reduce((a, x, i) => (a.push(i ? a[i - 1] + gen[i - 1] : sol), a), []);
  const satirBilgi = b.satirlar.map((r, ri) => {
    const kalin = b.baslikli && ri === 0;
    const hucre = Array.from({ length: sutun }, (_, c) => satirla(kalin ? (r[c] || []).map((p) => ({ ...p, kalin: true })) : (r[c] || []), gen[c] - 2 * o.pad, o.boyut, olc));
    return { hucre, h: Math.max(...hucre.map((l) => l.length)) * o.ara + 2 * o.dikey, baslik: kalin };
  });
  const ciz = (bilgi, y) => {
    if (bilgi.baslik) ops().push({ t: 'kutu', x: sol, y: y + 1, w: en, h: bilgi.h - 1, dolgu: RENK.zemin });
    bilgi.hucre.forEach((l, c) => l.forEach((s, si) => {
      for (const p of s.parcalar) if (p.metin.trim()) ops().push({ t: 'yazi', x: xler[c] + o.pad + p.x, y: y + o.dikey + si * o.ara, metin: p.metin, boyut: o.boyut, kalin: bilgi.baslik || p.kalin, renk: RENK.yazi });
    }));
    ops().push({ t: 'cizgi', x1: sol, y1: y + bilgi.h, x2: sol + en, y2: y + bilgi.h, renk: RENK.cizgi, kalinlik: 1.5 });
    return y + bilgi.h;
  };
  let y = yAl();
  const baslik = b.baslikli ? satirBilgi[0] : null;
  // Başlık ve ilk satır birlikte sığmalı
  const ilk = satirBilgi[b.baslikli ? 1 : 0];
  if (!(y + (baslik ? baslik.h : 0) + (ilk ? ilk.h : 0) <= alt) && y > SAYFA.ust) { yeniSayfa(); y = SAYFA.ust; }
  ops().push({ t: 'cizgi', x1: sol, y1: y, x2: sol + en, y2: y, renk: RENK.cizgi, kalinlik: 1.5 });
  satirBilgi.forEach((bilgi, i) => {
    if (i > 0 && !(y + bilgi.h <= alt)) {
      yeniSayfa(); y = SAYFA.ust;
      ops().push({ t: 'cizgi', x1: sol, y1: y, x2: sol + en, y2: y, renk: RENK.cizgi, kalinlik: 1.5 });
      if (baslik && !bilgi.baslik) y = ciz(baslik, y);
    }
    y = ciz(bilgi, y);
  });
  return y + o.sonra;
}

// --- Antet, alt bilgi ve taslak damgası ---
export function damga() {
  return [
    { t: 'kutu', x: 527, y: 22, w: 600, h: 40, dolgu: RENK.zemin },
    { t: 'yazi', x: 827, y: 31, metin: DAMGA_METNI, boyut: 21, kalin: true, renk: RENK.turuncu, hiza: 'orta' }
  ];
}
// { no, toplam, belgeNo, altSatir, paraf }
export function antet({ no, toplam, belgeNo, altSatir, paraf }) {
  const o = [
    { t: 'gorsel', ad: 'logo', x: SAYFA.sol, y: 92, w: 172, h: 85 },
    { t: 'cizgi', x1: SAYFA.sol, y1: 200, x2: SAYFA.sag, y2: 200, renk: RENK.turuncu, kalinlik: 3 },
    { t: 'cizgi', x1: SAYFA.sol, y1: 2210, x2: SAYFA.sag, y2: 2210, renk: RENK.cizgi, kalinlik: 1.5 },
    { t: 'yazi', x: SAYFA.sol, y: 2228, metin: degerTemizle(altSatir, 200) || '—', boyut: 20, kalin: false, renk: RENK.gri },
    { t: 'yazi', x: SAYFA.sag, y: 2228, metin: `Sayfa ${no} / ${toplam}`, boyut: 20, kalin: false, renk: RENK.gri, hiza: 'sag' }
  ];
  const bn = degerTemizle(belgeNo, 40);
  if (bn) o.push({ t: 'yazi', x: SAYFA.sag, y: 140, metin: bn, boyut: 22, kalin: false, renk: RENK.gri, hiza: 'sag' });
  if (paraf) o.push({ t: 'yazi', x: SAYFA.sol, y: 2160, metin: 'Paraf:  Ajans ____________    Müşteri ____________', boyut: 20, kalin: false, renk: RENK.gri });
  return o;
}

// Belge planına antet ve damga ekler. plan: [{ sayfa, ops? }] (ops varsa metin sayfasıdır).
// veri: { taslak, belgeNo, altSatir }. Her plan öğesine "ek" (çizim listesi) yazılır. Sayfa numarası belgedeki sıradır.
export function planSusle(plan, veri = {}) {
  const toplam = plan.length;
  plan.forEach((p, i) => {
    const ek = [];
    if (p.ops) ek.push(...antet({ no: i + 1, toplam, belgeNo: veri.belgeNo, altSatir: veri.altSatir, paraf: !!(p.sayfa && p.sayfa.metinler && p.sayfa.metinler.paraf === 'evet') }));
    if (veri.taslak) ek.push(...damga());
    p.ek = ek;
  });
  return plan;
}

// Metin sayfalarını çizim planına çevirir (kapak/sabit gibi öteki sayfalar olduğu gibi geçer; koşulu tutmayan sayfa atlanır).
export function metinPlani(sayfalar, degerler, olc) {
  const plan = [];
  sayfalar.forEach((s, i) => {
    if (!sayfaKosulu(s.kosul, degerler)) return;
    if (s.tip !== 'metin') { plan.push({ sayfa: s, no: i + 1 }); return; }
    metinYerlesim(metinAyristir(s.metin, degerler), olc, { paraf: !!(s.metinler && s.metinler.paraf === 'evet') })
      .forEach((ops, j) => plan.push({ sayfa: s, no: i + 1, devam: j > 0, ops }));
  });
  return plan;
}
