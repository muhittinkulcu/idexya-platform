// Haftalık Bülten kreatif stüdyosu: bir sayının maddelerinden Instagram karusel (1080×1350), hikâye (1080×1920)
// ve LinkedIn PDF karusel üretir. Görseller tarayıcıda çizilir (html-to-image); yazı tipi /fonts altından gömülür.
import { toPng, toJpeg } from 'html-to-image';
import { el, genelHata } from './ortak.js';

const BOYUT = { karusel: [1080, 1350], hikaye: [1080, 1920], linkedin: [1080, 1350] };
const ETKI_SIRA = { yuksek: 0, orta: 1, dusuk: 2 };
const ETKI = { yuksek: 'Yüksek etki', orta: 'Orta etki', dusuk: 'Düşük etki' };
const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const LOGO = '<svg viewBox="0 0 1000 1000" width="64" height="64" aria-hidden="true"><path fill="#F07A23" fill-rule="evenodd" d="M805.5 941.0C789.5 939.6 773.1 936.9 764.5 934.3C756.7 931.9 756.3 931.6 746.0 921.1C720.9 895.7 667.2 833.4 568.0 714.7C530.9 670.3 500.2 634.0 499.9 634.0C497.9 634.0 368.7 785.5 284.0 887.0L239.0 941.0L164.7 941.0C123.9 941.0 85.5 940.5 79.4 940.0C63.6 938.6 56.3 936.2 51.0 930.4C40.2 918.6 33.5 891.3 39.1 882.0C43.7 874.4 70.2 843.0 241.0 642.0C332.3 534.6 409.4 443.6 475.3 365.5C505.5 329.8 577.5 245.7 635.2 178.8L740.3 57.0L784.4 57.0C881.2 57.1 907.3 59.5 922.5 69.4C931.9 75.6 943.7 87.6 947.1 94.5L950.2 100.9L947.5 105.6C938.4 121.1 872.8 202.1 816.0 268.0C775.4 315.1 659.1 452.8 640.6 475.8C631.9 486.6 630.8 488.3 631.7 490.3C632.8 492.5 666.2 532.8 697.4 569.5C734.7 613.3 800.8 690.6 817.0 709.5C880.9 783.6 951.0 872.7 961.4 892.7C963.7 897.3 963.4 900.9 960.0 907.6C955.9 915.9 943.1 930.3 937.5 933.0C932.5 935.4 919.2 938.3 905.0 940.1C893.5 941.5 819.7 942.2 805.5 941.0ZM208.3 288.3C124.9 190.0 109.8 171.6 92.2 146.6C59.9 100.5 56.7 78.3 80.8 67.3C88.5 63.7 102.8 61.1 119.7 60.2C137.8 59.1 266.0 59.9 266.0 61.1C266.0 63.5 318.9 126.0 381.0 197.0C446.5 271.9 463.4 293.0 471.3 309.8C474.0 315.5 474.5 317.6 474.5 324.0C474.5 330.7 474.1 332.4 470.6 339.4C465.6 349.8 459.5 356.3 452.2 359.0C439.2 363.9 432.8 364.3 350.5 364.7L273.5 365.0L208.3 288.3Z"></path></svg>';

const gunYaz = (g) => { const [y, a, d] = g.split('-').map(Number); return `${d} ${AYLAR[a - 1]} ${y}`; };
function aralik(bas, bit) {
  const [y1, a1, d1] = bas.split('-').map(Number), [y2, a2, d2] = bit.split('-').map(Number);
  return y1 === y2 && a1 === a2 ? `${d1}–${d2} ${AYLAR[a2 - 1]} ${y2}` : `${d1} ${AYLAR[a1 - 1]} – ${d2} ${AYLAR[a2 - 1]} ${y2}`;
}
// Metni cümle sonunda, yoksa kelime sınırında kısaltır
function kisalt(t, n) {
  t = String(t || '').trim();
  if (t.length <= n) return t;
  const parca = t.slice(0, n), nokta = Math.max(parca.lastIndexOf('. '), parca.lastIndexOf('; '));
  if (nokta > n * 0.55) return parca.slice(0, nokta).replace(/[;:,]$/, '') + '.';
  return parca.slice(0, parca.lastIndexOf(' ')).replace(/[,;:]$/, '') + '…';
}
const alanAdi = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } };
const kaynakAl = (m) => { try { return JSON.parse(m.kaynaklar || '[]'); } catch { return []; } };
const h = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// --- Yazı tipi gömme (bir kez) ---
let fontCss = null;
async function fontlar() {
  if (fontCss) return fontCss;
  const LATIN = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
  const EXT = 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF';
  const b64 = async (u) => { const buf = new Uint8Array(await (await fetch(u)).arrayBuffer()); let s = ''; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000)); return btoa(s); };
  const parcalar = [];
  for (const w of [400, 600, 700]) for (const [ad, aralik_] of [['latin', LATIN], ['latin-ext', EXT]]) {
    parcalar.push(`@font-face{font-family:'Kreatif Plex';font-style:normal;font-weight:${w};font-display:block;src:url(data:font/woff2;base64,${await b64(`/fonts/ibm-plex-sans-${ad}-${w}-normal.woff2`)}) format('woff2');unicode-range:${aralik_}}`);
  }
  fontCss = parcalar.join('\n');
  const st = document.createElement('style'); st.textContent = fontCss; document.head.append(st);
  await document.fonts.load("700 40px 'Kreatif Plex'"); await document.fonts.load("400 40px 'Kreatif Plex'"); await document.fonts.load("600 40px 'Kreatif Plex'");
  return fontCss;
}

// --- Slayt şablonları ---
const ust = (sayi, sag) => `<div class="kr-ust"><span class="kr-logo">${LOGO}<b>Idexya</b></span><span class="kr-ust-sag">${h(sag || `Haftalık Bülten #${sayi.no}`)}</span></div>`;
const cip = (k) => `<span class="kr-cip" style="--r:${h(k.renk)}"><i>${h(k.ad.slice(0, 1))}</i>${h(k.ad)}</span>`;

function kapak(sayi, maddeler, konuAl, tur, tum) {
  const konular = [...new Set(tum.map((m) => m.konu))].map(konuAl);
  const one = tur === 'hikaye' ? maddeler.slice(0, 3) : [];
  return `<div class="kr kr-${tur} kr-kapak">${ust(sayi)}
<div class="kr-govde"><small class="kr-tarih">${h(aralik(sayi.hafta_bas, sayi.hafta_bit))}</small>
<h1>Bu hafta AI ve dijital pazarlamada neler oldu?</h1>
<p class="kr-alt">${tum.length} gelişme · ${konular.length} konu · kaynaklı, Türkçe özet</p>
<div class="kr-cipler">${konular.map(cip).join('')}</div>
${one.length ? `<ol class="kr-liste">${one.map((m) => `<li>${cip(konuAl(m.konu))}<b>${h(kisalt(m.baslik, 90))}</b></li>`).join('')}</ol>` : ''}</div>
<div class="kr-alt-satir"><span>${tur === 'hikaye' ? 'Ayrıntılar için dokunun' : 'Kaydırın'}</span><span class="kr-ok">→</span></div></div>`;
}
function madde(sayi, m, k, i, toplam, tur) {
  const kaynak = kaynakAl(m)[0];
  const n = tur === 'hikaye' ? [420, 380] : [300, 270];
  return `<div class="kr kr-${tur} kr-madde">${ust(sayi, `${i} / ${toplam}`)}
<div class="kr-govde"><div class="kr-meta">${cip(k)}<span>${m.tarih ? h(gunYaz(m.tarih)) : ''}</span><span class="kr-etki kr-etki-${h(m.etki)}">${h(ETKI[m.etki] || '')}</span></div>
<h2>${h(kisalt(m.baslik, 110))}</h2>
<div class="kr-blok"><b>Ne oldu?</b><p>${h(kisalt(m.ne_oldu, n[0]))}</p></div>
${m.ne_anlama ? `<div class="kr-blok kr-anlam"><b>Ne anlama geliyor?</b><p>${h(kisalt(m.ne_anlama, n[1]))}</p></div>` : ''}</div>
<div class="kr-alt-satir"><span>Kaynak: ${h(kaynak ? alanAdi(kaynak.url) : '—')}</span><span>idexya.com/tr/bulten</span></div></div>`;
}
function kapanis(sayi, tur) {
  return `<div class="kr kr-${tur} kr-kapanis">${ust(sayi)}
<div class="kr-govde"><small class="kr-tarih">Bütün gelişmeler ve kaynak bağlantıları</small>
<h1>Haftalık Bülten #${sayi.no}</h1>
<p class="kr-url">idexya.com/tr/bulten/${h(sayi.slug)}</p>
<div class="kr-kutu"><b>Her pazartesi e-postanızda</b><p>AI ve dijital pazarlamada geçen hafta neler değişti, işiniz için ne anlama geliyor? Kısa, kaynaklı, Türkçe.</p></div></div>
<div class="kr-alt-satir"><span>${tur === 'hikaye' ? 'Bağlantı çıkartmasına dokunun' : tur === 'linkedin' ? 'Bağlantı ilk yorumda' : 'Bağlantı profilde'}</span><span>idexya.com</span></div></div>`;
}

const STIL = `
.kr{position:relative;box-sizing:border-box;display:flex;flex-direction:column;overflow:hidden;font-family:'Kreatif Plex',sans-serif;color:#FFFFFF;background:#002559;padding:80px 84px 72px}
.kr::before{content:"";position:absolute;inset:0;background:radial-gradient(900px 620px at 92% -6%,rgba(240,122,35,.42),transparent 62%),radial-gradient(700px 520px at -10% 108%,rgba(42,120,214,.30),transparent 60%),linear-gradient(rgba(255,255,255,.055) 1px,transparent 1px) 0 0/72px 72px,linear-gradient(90deg,rgba(255,255,255,.055) 1px,transparent 1px) 0 0/72px 72px}
.kr>*{position:relative}
.kr-karusel,.kr-linkedin{width:1080px;height:1350px}.kr-hikaye{width:1080px;height:1920px;padding:150px 84px 160px}
.kr-ust{display:flex;align-items:center;justify-content:space-between}
.kr-logo{display:flex;align-items:center;gap:16px}.kr-logo b{font-size:40px;font-weight:700;letter-spacing:-.01em}
.kr-ust-sag{padding:12px 22px;border-radius:999px;border:2px solid rgba(255,255,255,.22);font-size:26px;font-weight:600;color:#DCE5F1}
.kr-govde{flex:1;display:flex;flex-direction:column;justify-content:center;gap:28px;min-height:0}
.kr-tarih{font-size:32px;font-weight:700;color:#FFB58A}
.kr h1,.kr h2,.kr b,.kr p,.kr span,.kr small{font-family:'Kreatif Plex',sans-serif}
.kr h1,.kr h2{color:#FFFFFF}
.kr h1{margin:0;font-size:96px;line-height:1.02;letter-spacing:-.035em;font-weight:700}
.kr-hikaye h1{font-size:104px}
.kr-alt{margin:0;font-size:34px;color:#C6D2E3}
.kr-cipler{display:flex;flex-wrap:wrap;gap:12px}
.kr-cip{display:inline-flex;align-items:center;gap:12px;padding:8px 22px 8px 8px;border-radius:999px;background:rgba(255,255,255,.1);border:2px solid rgba(255,255,255,.16);font-size:26px;font-weight:600;white-space:nowrap}
.kr-cip i{width:38px;height:38px;border-radius:50%;background:var(--r);display:inline-flex;align-items:center;justify-content:center;font-style:normal;font-size:20px;font-weight:700;color:#fff}
.kr-liste{list-style:none;margin:20px 0 0;padding:0;display:flex;flex-direction:column;gap:18px}
.kr-liste li{display:flex;flex-direction:column;align-items:flex-start;gap:14px;padding:28px;border-radius:28px;background:rgba(255,255,255,.08);border:2px solid rgba(255,255,255,.14)}.kr-liste b{font-size:36px;line-height:1.25}
.kr-alt-satir{display:flex;justify-content:space-between;align-items:center;font-size:26px;color:#9FB2CC;font-weight:600}
.kr-ok{width:84px;height:84px;border-radius:50%;background:#F07A23;color:#1A1206;display:flex;align-items:center;justify-content:center;font-size:44px;font-weight:700}
.kr-meta{display:flex;flex-wrap:wrap;align-items:center;gap:16px;font-size:26px;color:#C6D2E3;font-weight:600}
.kr-etki{margin-left:auto;padding:8px 18px;border-radius:999px;font-size:22px;font-weight:700;background:rgba(255,255,255,.12)}.kr-etki-yuksek{background:#F07A23;color:#1A1206}
.kr h2{margin:0;font-size:60px;line-height:1.1;letter-spacing:-.025em;font-weight:700}
.kr-hikaye h2{font-size:70px}
.kr-blok{display:flex;flex-direction:column;gap:10px}.kr-blok b{font-size:26px;color:#FFB58A}.kr-blok p{margin:0;font-size:31px;line-height:1.45;color:#DCE5F1}
.kr-hikaye .kr-blok p{font-size:36px}
.kr-anlam{padding:30px 34px;border-radius:28px;background:#FDE9DB;color:#002559}.kr-anlam b{color:#A9420A}.kr-anlam p{color:#002559!important}
.kr-url{margin:0;font-size:46px;font-weight:700;color:#FFB58A;word-break:break-all}
.kr-kutu{padding:34px;border-radius:28px;background:rgba(255,255,255,.08);border:2px solid rgba(255,255,255,.16)}.kr-kutu b{font-size:36px}.kr-kutu p{margin:10px 0 0;font-size:30px;line-height:1.45;color:#C6D2E3}
.ks .segment-kucuk{display:inline-flex;gap:2px;padding:3px;border-radius:10px;background:var(--track,var(--card2))}.ks .segment-kucuk button{height:32px;padding:0 12px;border:0;border-radius:8px;background:transparent;color:var(--tx2);font:inherit;font-size:13px;font-weight:600;cursor:pointer}.ks .segment-kucuk button[aria-pressed=true]{background:var(--card);color:var(--head);box-shadow:0 1px 3px var(--shadow)}
.ks{display:flex;flex-direction:column;gap:16px}
.ks-arac{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
.ks-izgara{display:flex;flex-wrap:wrap;gap:14px}
.ks-slayt{display:flex;flex-direction:column;gap:6px}
.ks-onizleme{position:relative;overflow:hidden;border-radius:14px;box-shadow:0 10px 30px -18px var(--shadow);background:#002559}
.ks-onizleme>.kr{position:absolute;left:0;top:0;transform-origin:0 0}
.ks-secim{display:flex;flex-direction:column;gap:6px;max-height:340px;overflow:auto;padding:4px}
.ks-secim label{display:flex;gap:8px;align-items:flex-start;font-size:13px;font-weight:500}
.ks-metin{width:100%;min-height:180px;padding:10px 12px;border:1px solid var(--line);border-radius:12px;background:var(--bg);color:var(--tx);font:inherit;font-size:13px;box-sizing:border-box}
`;

function slaytlar(sayi, secili, konuAl, tur, tum) {
  const l = [kapak(sayi, secili, konuAl, tur, tum), ...secili.map((m, i) => madde(sayi, m, konuAl(m.konu), i + 1, secili.length, tur)), kapanis(sayi, tur)];
  return l;
}

// --- ZIP (sıkıştırmasız) ve PDF yazıcıları ---
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = (b) => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
function zip(dosyalar) {
  const enc = new TextEncoder(), parcalar = [], merkez = []; let ofs = 0;
  for (const { ad, veri } of dosyalar) {
    const a = enc.encode(ad), c = crc32(veri), yerel = new DataView(new ArrayBuffer(30));
    yerel.setUint32(0, 0x04034b50, true); yerel.setUint16(4, 20, true); yerel.setUint16(6, 0x0800, true); yerel.setUint32(14, c, true); yerel.setUint32(18, veri.length, true); yerel.setUint32(22, veri.length, true); yerel.setUint16(26, a.length, true);
    parcalar.push(new Uint8Array(yerel.buffer), a, veri);
    const m = new DataView(new ArrayBuffer(46));
    m.setUint32(0, 0x02014b50, true); m.setUint16(4, 20, true); m.setUint16(6, 20, true); m.setUint16(8, 0x0800, true); m.setUint32(16, c, true); m.setUint32(20, veri.length, true); m.setUint32(24, veri.length, true); m.setUint16(28, a.length, true); m.setUint32(42, ofs, true);
    merkez.push(new Uint8Array(m.buffer), a);
    ofs += 30 + a.length + veri.length;
  }
  const mBoy = merkez.reduce((s, x) => s + x.length, 0), son = new DataView(new ArrayBuffer(22));
  son.setUint32(0, 0x06054b50, true); son.setUint16(8, dosyalar.length, true); son.setUint16(10, dosyalar.length, true); son.setUint32(12, mBoy, true); son.setUint32(16, ofs, true);
  return new Blob([...parcalar, ...merkez, new Uint8Array(son.buffer)], { type: 'application/zip' });
}
function pdf(jpegler, w, hgt) {
  const enc = new TextEncoder(), parca = [], ofs = []; let boy = 0;
  const yaz = (x) => { const b = typeof x === 'string' ? enc.encode(x) : x; parca.push(b); boy += b.length; };
  const pw = w * 0.75, ph = hgt * 0.75, n = jpegler.length;
  yaz('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
  const nesne = (no, govde) => { ofs[no] = boy; yaz(`${no} 0 obj\n`); govde(); yaz('\nendobj\n'); };
  nesne(1, () => yaz('<< /Type /Catalog /Pages 2 0 R >>'));
  nesne(2, () => yaz(`<< /Type /Pages /Count ${n} /Kids [${jpegler.map((_, i) => `${3 + i * 3} 0 R`).join(' ')}] >>`));
  jpegler.forEach((j, i) => {
    const s = 3 + i * 3, icerik = `q ${pw} 0 0 ${ph} 0 0 cm /Im0 Do Q`;
    nesne(s, () => yaz(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw} ${ph}] /Resources << /XObject << /Im0 ${s + 1} 0 R >> >> /Contents ${s + 2} 0 R >>`));
    nesne(s + 1, () => { yaz(`<< /Type /XObject /Subtype /Image /Width ${w} /Height ${hgt} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${j.length} >>\nstream\n`); yaz(j); yaz('\nendstream'); });
    nesne(s + 2, () => yaz(`<< /Length ${icerik.length} >>\nstream\n${icerik}\nendstream`));
  });
  const xref = boy, toplam = 3 + n * 3;
  yaz(`xref\n0 ${toplam}\n0000000000 65535 f \n${ofs.slice(1, toplam).map((o) => String(o).padStart(10, '0') + ' 00000 n \n').join('')}trailer\n<< /Size ${toplam} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
  return new Blob(parca, { type: 'application/pdf' });
}
const veriUrlBayt = (u) => { const b = atob(u.split(',')[1]); const a = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a; };
const indir = (blob, ad) => { const a = el('a', { href: URL.createObjectURL(blob), download: ad }); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); };

// Paylaşım metinleri
function aciklama(sayi, secili, konuAl, tur) {
  const adres = `https://idexya.com/tr/bulten/${sayi.slug}/`;
  const satir = secili.map((m) => `• ${konuAl(m.konu).ad}: ${m.baslik}`).join('\n');
  const etiket = [...new Set(['#yapayzeka', '#dijitalpazarlama', ...secili.map((m) => '#' + konuAl(m.konu).ad.toLocaleLowerCase('tr-TR').replace(/[^a-z0-9çğıöşü]/g, ''))])].slice(0, 12).join(' ');
  if (tur === 'linkedin') return `Haftalık Bülten #${sayi.no} | ${aralik(sayi.hafta_bas, sayi.hafta_bit)}\n\nAI ve dijital pazarlamada geçen hafta öne çıkanlar ve işletmeler için ne anlama geldikleri:\n\n${satir}\n\nHer maddenin kaynak bağlantısı ve ayrıntısı bültende: ${adres}\n\n${etiket}`;
  return `Haftalık Bülten #${sayi.no} 🗞 ${aralik(sayi.hafta_bas, sayi.hafta_bit)}\n\nBu hafta AI ve dijital pazarlamada neler oldu? Kaydırın, kısa özetler ve işiniz için anlamı kartlarda.\n\n${satir}\n\nKaynak bağlantılarıyla bütün gelişmeler: profildeki bağlantıda ya da idexya.com/tr/bulten\n\n${etiket}`;
}

export function kreatifStudyosu({ sayi, maddeler, konuAl, kapat }) {
  if (!document.getElementById('kr-stil')) { const st = document.createElement('style'); st.id = 'kr-stil'; st.textContent = STIL; document.head.append(st); }
  const onayli = maddeler.filter((m) => m.durum === 'onayli');
  const kaynak = onayli.length ? onayli : maddeler.filter((m) => m.durum !== 'cikarildi');
  const sirali = [...kaynak].sort((a, b) => (ETKI_SIRA[a.etki] ?? 1) - (ETKI_SIRA[b.etki] ?? 1) || (a.sira || 0) - (b.sira || 0));
  const secim = new Set(sirali.slice(0, 7).map((m) => m.id));
  let tur = 'karusel';
  const kok = el('div', { class: 'ks' });
  const izgara = el('div', { class: 'ks-izgara' });
  const metin = el('textarea', { class: 'ks-metin', readonly: true, 'aria-label': 'Paylaşım metni' });
  const durum = el('span', { style: 'font-size:13px;color:var(--tx2)' });
  const turDugme = el('div', { class: 'segment-kucuk', role: 'group', 'aria-label': 'Biçim' });
  const secili = () => sirali.filter((m) => secim.has(m.id));

  function ciz() {
    const [w, hgt] = BOYUT[tur], olcek = 240 / w;
    turDugme.replaceChildren(...[['karusel', 'Instagram karusel'], ['hikaye', 'Hikâye'], ['linkedin', 'LinkedIn PDF']].map(([k, a]) => el('button', { type: 'button', 'aria-pressed': String(k === tur), onclick: () => { tur = k; ciz(); } }, a)));
    const s = slaytlar(sayi, secili(), konuAl, tur, sirali);
    izgara.replaceChildren(...s.map((html, i) => {
      const kutu = el('div', { class: 'ks-onizleme', style: `width:${w * olcek}px;height:${hgt * olcek}px` });
      kutu.innerHTML = html; kutu.firstElementChild.style.transform = `scale(${olcek})`;
      return el('div', { class: 'ks-slayt' }, kutu, el('div', { style: 'display:flex;justify-content:space-between;align-items:center;font-size:12px;color:var(--tx2)' }, `${i + 1}. görsel`,
        tur === 'linkedin' ? null : el('button', { type: 'button', class: 'dugme kucuk', onclick: async (o) => { const d = o.currentTarget; d.disabled = true; try { const u = await png(kutu.firstElementChild); indir(new Blob([veriUrlBayt(u)], { type: 'image/png' }), `bulten-${sayi.slug}-${tur}-${String(i + 1).padStart(2, '0')}.png`); } catch (h_) { genelHata('Görsel üretilemedi: ' + h_.message); } d.disabled = false; } }, 'PNG')));
    }));
    metin.value = aciklama(sayi, secili(), konuAl, tur);
    durum.textContent = `${s.length} görsel · ${w}×${hgt}${onayli.length ? '' : ' · Uyarı: onaylı madde yok, taslaklar kullanılıyor'}`;
  }
  async function png(dugum, jpeg = false) {
    const css = await fontlar();
    const [w, hgt] = BOYUT[tur];
    const f = jpeg ? toJpeg : toPng;
    return f(dugum, { width: w, height: hgt, pixelRatio: 1, quality: 0.92, fontEmbedCSS: css, cacheBust: false, style: { transform: 'none', left: '0', top: '0' } });
  }
  async function hepsi() {
    const dugumler = [...izgara.querySelectorAll('.ks-onizleme > .kr')];
    const sonuc = [];
    for (let i = 0; i < dugumler.length; i++) { durum.textContent = `Hazırlanıyor ${i + 1}/${dugumler.length}…`; sonuc.push(await png(dugumler[i], tur === 'linkedin')); }
    return sonuc;
  }
  const tumu = el('button', { type: 'button', class: 'dugme birincil', onclick: async (o) => {
    const d = o.currentTarget; d.disabled = true;
    try {
      const l = await hepsi();
      if (tur === 'linkedin') indir(pdf(l.map(veriUrlBayt), ...BOYUT.linkedin), `bulten-${sayi.slug}-linkedin.pdf`);
      else indir(zip(l.map((u, i) => ({ ad: `bulten-${sayi.slug}-${tur}-${String(i + 1).padStart(2, '0')}.png`, veri: veriUrlBayt(u) }))), `bulten-${sayi.slug}-${tur}.zip`);
      genelHata('');
    } catch (h_) { genelHata('Kreatifler üretilemedi: ' + h_.message); }
    d.disabled = false; ciz();
  } }, 'Tümünü indir');
  const secimKutu = el('div', { class: 'ks-secim' }, ...sirali.map((m) => el('label', {}, el('input', { type: 'checkbox', checked: secim.has(m.id), onchange: (e) => { e.target.checked ? secim.add(m.id) : secim.delete(m.id); if (secim.size > 18) { secim.delete(m.id); e.target.checked = false; alert('Instagram karusel en çok 20 görsel alır: kapak ve kapanışla birlikte en çok 18 madde seçilebilir.'); } ciz(); } }), el('span', {}, el('b', {}, konuAl(m.konu).ad + ': '), m.baslik))));
  kok.append(
    el('div', { class: 'ks-arac' }, el('button', { type: 'button', class: 'dugme kucuk', onclick: kapat }, '← Sayıya dön'), el('b', { style: 'color:var(--acc)' }, `Kreatifler · Sayı #${sayi.no}`), turDugme, el('span', { style: 'flex:1' }), durum, tumu),
    el('div', { style: 'display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:16px;align-items:start' },
      el('div', { class: 'kart', style: 'padding:16px' }, izgara),
      el('div', { style: 'display:flex;flex-direction:column;gap:12px' },
        el('div', { class: 'kart', style: 'padding:14px;display:flex;flex-direction:column;gap:8px' }, el('b', { style: 'color:var(--head)' }, 'Kartlardaki maddeler'), el('span', { style: 'font-size:12px;color:var(--tx2)' }, 'Etkisi yüksek olanlar önde. Kaydırılan karuselde 6–8 madde okunurluk için iyi bir sınır; kapak ve kapanış görseli kendiliğinden eklenir.'), secimKutu),
        el('div', { class: 'kart', style: 'padding:14px;display:flex;flex-direction:column;gap:8px' }, el('b', { style: 'color:var(--head)' }, 'Paylaşım metni'), metin,
          el('button', { type: 'button', class: 'dugme kucuk', onclick: async (o) => { const d = o.currentTarget; try { await navigator.clipboard.writeText(metin.value); d.textContent = 'Kopyalandı'; } catch { metin.select(); } } }, 'Metni kopyala')))));
  fontlar().then(ciz).catch(() => ciz());
  ciz();
  return kok;
}
