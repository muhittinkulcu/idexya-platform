// Belge şablonu yardımcıları (tarayıcı ve Node testleri ortak kullanır; DOM gerektirmez).
// · Tutarlar kuruş (tam sayı), KDV hariç. Bilinmeyen tutar "—".
// · PDF: her sayfa A4 boyutunda tek bir JPEG görselden oluşur. Ek kitaplık kullanılmaz; JPEG baytları PDF'e
//   olduğu gibi (DCTDecode) gömülür. Böylece sabit sayfalar yeniden sıkıştırılmaz.

export const SAYFA_EN = 1654, SAYFA_BOY = 2339; // şablon ölçeği (A4, 200 dpi)
const AYLAR = ['OCAK', 'ŞUBAT', 'MART', 'NİSAN', 'MAYIS', 'HAZİRAN', 'TEMMUZ', 'AĞUSTOS', 'EYLÜL', 'EKİM', 'KASIM', 'ARALIK'];

// '2026-11-10' → '10 KASIM 2026' (kapak). Geçersizse '—'.
export function tarihUzun(gun) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(gun || ''));
  if (!m || +m[2] < 1 || +m[2] > 12) return '—';
  return `${+m[3]} ${AYLAR[+m[2] - 1]} ${m[1]}`;
}
// '2026-11-10' → '10.11.2026' (TDK)
export function tarihKisa(gun) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(gun || ''));
  return m ? `${m[3]}.${m[2]}.${m[1]}` : '—';
}
export const buyukHarf = (s) => String(s || '').toLocaleUpperCase('tr');

// Kapak başlığı: kalıptaki {FIRMA} firma adının büyük harfli hâliyle değişir.
export const kapakBasligi = (kalip, firma) => buyukHarf(String(kalip || '{FIRMA} - PROJE TEKLİFİ').replaceAll('{FIRMA}', String(firma || '').trim() || 'FİRMA'));

const binlik = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
// 2000000 → '20.000 TL' (belgede; kuruş varsa '20.000,50 TL'). null → '—'
export function tlBelge(kurus) {
  if (kurus === null || kurus === undefined || !Number.isFinite(Number(kurus))) return '—';
  const k = Math.round(Number(kurus)), tl = Math.floor(k / 100), kr = k % 100;
  return `${binlik(tl)}${kr ? ',' + String(kr).padStart(2, '0') : ''} TL`;
}
// 2000000 → '20.000,00 TL' (panelde)
export function tlTam(kurus) {
  if (kurus === null || kurus === undefined || !Number.isFinite(Number(kurus))) return '—';
  const k = Math.round(Number(kurus));
  return `${binlik(Math.floor(k / 100))},${String(k % 100).padStart(2, '0')} TL`;
}
// '20.000' · '20.000,50' · '20000' · '20000.5' → kuruş; boşsa null; geçersizse NaN (sunucudaki tutarKurus ile aynı kural)
export function kurusOku(v) {
  const s = typeof v === 'string' ? v.trim().replace(/\s|TL/gi, '') : v === undefined || v === null ? '' : String(v);
  if (!s) return null;
  let n;
  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(s) || /^\d+(,\d{1,2})?$/.test(s)) n = Number(s.replace(/\./g, '').replace(',', '.'));
  else if (/^\d+(\.\d{1,2})?$/.test(s)) n = Number(s);
  else return NaN;
  const k = Math.round(n * 100);
  return Number.isFinite(k) && k >= 0 && k <= 100000000000 ? k : NaN;
}

// Seçili kalemlerin toplamı. Fiyatı bilinmeyen kalem toplama katılmaz, sayısı ayrıca döner.
export function toplamlar(kalemler) {
  const t = { aylik: 0, tek: 0, bilinmeyen: 0 };
  for (const k of kalemler || []) {
    if (k.fiyat_kurus === null || k.fiyat_kurus === undefined || !Number.isFinite(k.fiyat_kurus)) { t.bilinmeyen++; continue; }
    if (k.tur === 'tek_seferlik') t.tek += k.fiyat_kurus; else t.aylik += k.fiyat_kurus;
  }
  return t;
}
// Teklif tutarı (müşteri kartına yazılan): aylık toplam, KDV hariç. Aylık kalem yoksa tek seferlik toplam.
export function teklifTutari(kalemler) {
  const t = toplamlar(kalemler), aylikVar = (kalemler || []).some((k) => k.tur !== 'tek_seferlik');
  return aylikVar ? t.aylik : t.tek;
}

// Satır yerleşimi: n satır; ilk satır ust'te, en çok alt'a kadar. Satır aralığı önce tam (adim), sığmazsa en aza (enAz) kadar daralır;
// yine sığmazsa satırlar parçalara (sayfalara) bölünür. Döner: [{ satirlar: [indeks...], adim }]
export function satirYerlesimi(n, { ust, alt, yukseklik, adim, enAz }) {
  const alan = alt - ust - yukseklik;
  const sigan = (a) => Math.floor(alan / a) + 1;
  const enCok = Math.max(1, sigan(enAz));
  // Sığmayan liste sayfalara dengeli bölünür (6 satır, sayfa başına en çok 5 → 3 + 3; 5 + 1 değil).
  const parcaSay = Math.max(1, Math.ceil(n / enCok)), taban = Math.floor(n / parcaSay), artan = n % parcaSay;
  const parcalar = [];
  for (let p = 0, i = 0; i < n; p++) {
    const say = taban + (p < artan ? 1 : 0);
    const a = say <= sigan(adim) ? adim : Math.max(enAz, Math.floor(alan / (say - 1)));
    parcalar.push({ satirlar: Array.from({ length: say }, (_, j) => i + j), adim: a });
    i += say;
  }
  return parcalar.length ? parcalar : [{ satirlar: [], adim }];
}
export const HIZMET_DUZEN = { yukseklik: 149, adim: 247, enAz: 170 };
export const KALEM_DUZEN = { yukseklik: 81, adim: 178, enAz: 118 };

// --- JPEG ve PDF ---
// JPEG başlığından genişlik, yükseklik ve renk bileşeni sayısı. JPEG değilse null.
export function jpegBilgi(b) {
  if (!(b && b.length > 4 && b[0] === 0xff && b[1] === 0xd8)) return null;
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) { i++; continue; }
    const m = b[i + 1];
    if (m === 0xff) { i++; continue; }
    if (m === 0xd8 || m === 0x01 || (m >= 0xd0 && m <= 0xd7)) { i += 2; continue; }
    const uz = (b[i + 2] << 8) | b[i + 3];
    if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { boy: (b[i + 5] << 8) | b[i + 6], en: (b[i + 7] << 8) | b[i + 8], bilesen: b[i + 9] };
    i += 2 + uz;
  }
  return null;
}

const A4 = [595.28, 841.89]; // punto
const enc = (s) => new TextEncoder().encode(s);
// PDF metin dizesi: UTF-16BE (BOM ile) onaltılık; Türkçe karakterler için.
function pdfMetin(s) {
  let h = 'FEFF';
  for (const c of String(s)) { const k = c.codePointAt(0); if (k > 0xffff) continue; h += k.toString(16).padStart(4, '0').toUpperCase(); }
  return `<${h}>`;
}

// sayfalar: [Uint8Array (RGB ya da gri JPEG)] → PDF baytları (Uint8Array). Her görsel A4 sayfayı tam kaplar.
export function pdfOlustur(sayfalar, { baslik = '', yazar = '' } = {}) {
  if (!sayfalar.length) throw new Error('Sayfa yok');
  const parca = [], ofset = [];
  let boy = 0;
  const yaz = (x) => { const b = typeof x === 'string' ? enc(x) : x; parca.push(b); boy += b.byteLength; };
  const nesne = (no, govde) => { ofset[no] = boy; yaz(`${no} 0 obj\n`); (Array.isArray(govde) ? govde : [govde]).forEach(yaz); yaz('\nendobj\n'); };
  // Başlık ve ikili dosya işareti satırı (%âãÏÓ: ASCII dışı baytlar, dosyanın ikili olduğunu bildirir)
  yaz(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a, 0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]));
  const n = sayfalar.length;
  // 1 katalog, 2 sayfalar, 3 bilgi; her sayfa için 3 nesne: sayfa, içerik, görsel
  const sayfaNo = (i) => 4 + i * 3;
  nesne(1, '<< /Type /Catalog /Pages 2 0 R >>');
  nesne(2, `<< /Type /Pages /Count ${n} /Kids [${sayfalar.map((_, i) => `${sayfaNo(i)} 0 R`).join(' ')}] >>`);
  nesne(3, `<< /Title ${pdfMetin(baslik)} /Author ${pdfMetin(yazar)} /Producer (Idexya Panel) >>`);
  sayfalar.forEach((jpg, i) => {
    const b = jpegBilgi(jpg);
    if (!b || ![1, 3].includes(b.bilesen)) throw new Error(`${i + 1}. sayfa görseli RGB JPEG değil`);
    const s = sayfaNo(i), icerik = `q ${A4[0]} 0 0 ${A4[1]} 0 0 cm /Im0 Do Q`;
    nesne(s, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${A4[0]} ${A4[1]}] /Resources << /XObject << /Im0 ${s + 2} 0 R >> >> /Contents ${s + 1} 0 R >>`);
    nesne(s + 1, [`<< /Length ${icerik.length} >>\nstream\n`, icerik, '\nendstream']);
    nesne(s + 2, [`<< /Type /XObject /Subtype /Image /Width ${b.en} /Height ${b.boy} /ColorSpace /${b.bilesen === 1 ? 'DeviceGray' : 'DeviceRGB'} /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpg.byteLength} >>\nstream\n`, jpg, '\nendstream']);
  });
  const toplam = 4 + n * 3, xref = boy;
  let x = `xref\n0 ${toplam}\n0000000000 65535 f \n`;
  for (let i = 1; i < toplam; i++) x += `${String(ofset[i]).padStart(10, '0')} 00000 n \n`;
  yaz(x + `trailer\n<< /Size ${toplam} /Root 1 0 R /Info 3 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  const son = new Uint8Array(boy);
  let o = 0; for (const p of parca) { son.set(p, o); o += p.byteLength; }
  return son;
}
