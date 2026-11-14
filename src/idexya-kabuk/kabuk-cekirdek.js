// Kabuğun saf işlevleri (DOM yok). Kaynak idexya-ortak; projede elle düzenlenmez. Ayrıntı: README.md.

export const KATMAN_ANAHTARLARI = ['idos', 'marketing', 'website', 'creative'];
export const SEKME_SINIRI = 8;
export const ARAMA_SINIRI = 14;

// Grup simgeleri; bilinmeyen ad `izgara` olur.
export const SIMGE = {
  izgara: ['M4 4h6v7H4z', 'M14 4h6v4h-6z', 'M14 12h6v8h-6z', 'M4 15h6v5H4z'],
  megafon: ['M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z', 'M15 9a4 4 0 0 1 0 6', 'M18 6a8 8 0 0 1 0 12'],
  grafik: ['M4 20V10', 'M10 20V4', 'M16 20v-7', 'M21 20H3'],
  yildiz: ['M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z', 'M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z'],
  belge: ['M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z', 'M14 3v6h6', 'M8 13h8', 'M8 17h5'],
  gelen: ['M22 12h-6l-2 3h-4l-2-3H2', 'M5.5 5h13L22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z'],
  kisiler: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M22 21v-2a4 4 0 0 0-3-3.9', 'M16 3.1a4 4 0 0 1 0 7.8'],
  dunya: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M3 12h18', 'M12 3a14 14 0 0 1 0 18', 'M12 3a14 14 0 0 0 0 18'],
  esitle: ['M21 12a9 9 0 0 1-15.5 6.2L3 16', 'M3 12a9 9 0 0 1 15.5-6.2L21 8', 'M21 3v5h-5', 'M3 21v-5h5'],
  takvim: ['M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z', 'M16 2v4', 'M8 2v4', 'M3 10h18'],
  gorsel: ['M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z', 'M8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z', 'M21 15l-5-5L5 21'],
  ayrac: ['M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z']
};

// Kalınlık: 600 ve üstü yok; varsayılan Zarif.
export const KALINLIK = {
  ince: { ad: 'İnce', ince: 250, govde: 300, orta: 350, vurgu: 450, aciklama: 'Gövde 300, başlık 350' },
  zarif: { ad: 'Zarif', ince: 300, govde: 350, orta: 400, vurgu: 500, aciklama: 'Gövde 350, başlık 400 (önerilen)' },
  dengeli: { ad: 'Dengeli', ince: 350, govde: 400, orta: 450, vurgu: 550, aciklama: 'Gövde 400, başlık 450' }
};

export const YAZI_TIPI = {
  inter: ['Inter', 'Dengeli, ekranda en okunaklı'], manrope: ['Manrope', 'Yuvarlak hatlı, modern'],
  jakarta: ['Plus Jakarta Sans', 'Geniş, ferah'], dmsans: ['DM Sans', 'Sade, geometrik'],
  figtree: ['Figtree', 'Sıcak, yumuşak'], outfit: ['Outfit', 'Geometrik, zarif'],
  albert: ['Albert Sans', 'İskandinav, sakin'], onest: ['Onest', 'Net, kurumsal']
};

export const TEMA = { acik: 'Açık', koyu: 'Koyu', oto: 'Otomatik' };

export const aile = (k) => "'" + YAZI_TIPI[Object.hasOwn(YAZI_TIPI, k) ? k : 'inter'][0] + "', 'Inter', system-ui, sans-serif";

export const kucuk = (x) => String(x == null ? '' : x).toLocaleLowerCase('tr-TR');

const TABAN = typeof location !== 'undefined' && /^https?:$/.test(location.protocol) ? location.origin : 'http://yerel.invalid';
export const has = (o, k) => typeof k === 'string' && Object.hasOwn(o, k);

// Adres yalnız http(s): aynı kökende (göreli) ya da `kokenler` listesindeki kökende (true: her köken).
// Ters bölü, boşluk, denetim karakteri, javascript:, data: ve // ile başlayan atılır.
export function guvenliUrl(u, kokenler = []) {
  if (typeof u !== 'string') return null;
  const t = u.trim();
  if (!t || t.startsWith('//') || /[\u0000-\u001F\u007F\s\\]/.test(t)) return null;
  let r;
  try { r = new URL(t, TABAN + '/'); } catch (e) { return null; }
  if (r.protocol !== 'http:' && r.protocol !== 'https:') return null;
  return r.origin === TABAN || kokenler === true || kokenler.includes(r.origin) ? t : null;
}
const koken = (u) => (guvenliUrl(u, true) ? new URL(u.trim(), TABAN + '/').origin : null);

export const metinListesi = (x) => (Array.isArray(x) ? x.filter((s) => typeof s === 'string') : []);

export const renkGecerli = (r) => typeof r === 'string' && /^#[0-9a-f]{6}$/i.test(r);

export const rozetSay = (n) => (Number.isFinite(n) && n > 0 ? Math.floor(n) : 0);

const metin = (x, sinir = 120) => (typeof x === 'string' ? x.trim().slice(0, sinir) : '');

export function ayarDogrula(ham) {
  const hatalar = [];
  const a = ham && typeof ham === 'object' ? ham : (hatalar.push('ayar nesne değil'), {});
  const katmanlar = [], ham2 = Array.isArray(a.katmanlar) ? a.katmanlar : [];
  const kokenler = ham2.map((k) => k && koken(k.url)).filter(Boolean);
  const U = (x) => guvenliUrl(x, kokenler);
  ham2.forEach((k, ki) => {
    if (!k || !KATMAN_ANAHTARLARI.includes(k.anahtar)) { hatalar.push('katman ' + ki + ': bilinmeyen anahtar'); return; }
    const url = U(k.url);
    if (!url) { hatalar.push(k.anahtar + ': geçersiz url'); return; }
    const renk = renkGecerli(k.renk) ? k.renk : '#2F55D4';
    const renkKoyu = renkGecerli(k.renkKoyu) ? k.renkKoyu : renk;
    if (!renkGecerli(k.renk)) hatalar.push(k.anahtar + ': renk geçersiz');
    const gruplar = [];
    (Array.isArray(k.gruplar) ? k.gruplar : []).forEach((g) => {
      const moduller = [];
      (Array.isArray(g && g.moduller) ? g.moduller : []).forEach((m) => {
        const mu = U(m && m.url);
        if (!mu || !metin(m.ad)) { hatalar.push(k.anahtar + ': modül atlandı (' + metin(m && m.ad) + ')'); return; }
        const sayfalar = [];
        (Array.isArray(m.sayfalar) ? m.sayfalar : []).forEach((s) => {
          const su = U(s && s.url);
          if (su && metin(s.ad)) sayfalar.push({ ad: metin(s.ad), url: su, rozet: rozetSay(s.rozet) });
          else hatalar.push(k.anahtar + ': sayfa atlandı (' + metin(s && s.ad) + ')');
        });
        moduller.push({ ad: metin(m.ad), url: mu, rozet: rozetSay(m.rozet), sayfalar });
      });
      if (metin(g && g.baslik)) gruplar.push({ baslik: metin(g.baslik), simge: has(SIMGE, g.simge) ? g.simge : 'izgara', moduller });
    });
    katmanlar.push({ anahtar: k.anahtar, ad: metin(k.ad) || k.anahtar, url, renk, renkKoyu, aciklama: metin(k.aciklama, 400), gruplar });
  });
  if (!katmanlar.length) hatalar.push('katman yok');
  let katman = a.katman;
  if (!katmanlar.some((k) => k.anahtar === katman)) { hatalar.push('geçerli katman bulunamadı'); katman = katmanlar[0] ? katmanlar[0].anahtar : 'idos'; }
  const e = a.etkin || {};
  const kul = a.kullanici || {};
  const d = a.durum || {};
  const as = a.asistan && guvenliUrl(a.asistan.gorsel) ? { gorsel: guvenliUrl(a.asistan.gorsel), etiket: metin(a.asistan.etiket) || 'IDOS’a sor' } : null;
  const eylemler = (Array.isArray(a.eylemler) ? a.eylemler : [])
    .map((x) => ({ ad: metin(x && x.ad), url: U(x && x.url), katman: x && x.katman }))
    .filter((x) => x.ad && x.url);
  return {
    hatalar,
    ayar: {
      katman, katmanlar, eylemler, kokenler,
      etkin: { modulUrl: U(e.modulUrl), sayfaUrl: U(e.sayfaUrl), ad: metin(e.ad) },
      kullanici: { ad: metin(kul.ad) || 'Kullanıcı', rol: metin(kul.rol) },
      durum: { baglanti: d.baglanti === true ? true : d.baglanti === false ? false : null, esitleme: metin(d.esitleme, 40) },
      asistan: as,
      bildirimUrl: U(a.bildirimUrl),
      cikisUrl: U(a.cikisUrl)
    }
  };
}

export function etkinBul(katman, etkin) {
  const r = { grup: -1, modul: null, sayfa: null, ad: '' };
  if (!katman) return r;
  const su = etkin && etkin.sayfaUrl, mu = etkin && etkin.modulUrl;
  katman.gruplar.forEach((g, gi) => g.moduller.forEach((m) => {
    if (r.sayfa) return;
    const s = su ? m.sayfalar.find((x) => x.url === su) : null;
    if (s) { r.grup = gi; r.modul = m; r.sayfa = s; return; }
    if (!r.modul && ((mu && m.url === mu) || (su && m.url === su))) { r.grup = gi; r.modul = m; }
  }));
  r.ad = (etkin && etkin.ad) || (r.sayfa ? r.modul.ad + ' › ' + r.sayfa.ad : r.modul ? r.modul.ad : '');
  return r;
}

export function aramaHavuzu(ayar) {
  const h = [];
  ayar.katmanlar.forEach((k) => k.gruplar.forEach((g) => g.moduller.forEach((m) => {
    const yol = k.ad + ' › ' + g.baslik;
    h.push({ tur: 'Sayfalar', ad: m.ad, yol, url: m.url, katman: k.anahtar, renk: k.renkKoyu, simge: k.ad.charAt(0) });
    m.sayfalar.forEach((s) => h.push({ tur: 'Sayfalar', ad: m.ad + ' › ' + s.ad, yol, url: s.url, katman: k.anahtar, renk: k.renkKoyu, simge: k.ad.charAt(0) }));
  })));
  ayar.eylemler.forEach((e) => {
    const k = ayar.katmanlar.find((x) => x.anahtar === e.katman);
    h.push({ tur: 'Eylemler', ad: e.ad, yol: k ? k.ad : '', url: e.url, katman: e.katman, renk: '#FFA35C', simge: '+' });
  });
  return h;
}

// Boş sorgu: sık sayfalar + eylemler. Dolu: her sözcük ad ve yolda (Türkçe küçük harf).
export function aramaSuz(havuz, sorgu, sikUrller = [], sinir = ARAMA_SINIRI) {
  const q = kucuk(sorgu).trim();
  if (!q) {
    const sik = [];
    sikUrller.forEach((u) => { const x = havuz.find((y) => y.url === u && y.tur === 'Sayfalar'); if (x && !sik.includes(x)) sik.push(x); });
    return sik.slice(0, 8).concat(havuz.filter((x) => x.tur === 'Eylemler')).slice(0, sinir);
  }
  const parca = q.split(/\s+/);
  const bulunan = havuz.filter((x) => { const t = kucuk(x.ad + ' ' + x.yol); return parca.every((p) => t.includes(p)); });
  bulunan.sort((a, b) => (kucuk(b.ad).startsWith(parca[0]) ? 1 : 0) - (kucuk(a.ad).startsWith(parca[0]) ? 1 : 0));
  return bulunan.slice(0, sinir);
}

// Sekmeler: ilk Genel bakış (kapatılamaz), en çok `sinir`, taşarsa en eski düşer.
// Saklanan sekme yalnız aynı kökende ve (verilmişse) `izinli` adreslerden biriyse kabul edilir.
export function sekmeListesi(liste, genel, izinli) {
  const temiz = [{ ad: genel.ad, url: genel.url }];
  (Array.isArray(liste) ? liste : []).forEach((s) => {
    const url = guvenliUrl(s && s.url);
    if (url && (!izinli || izinli.has(url)) && metin(s.ad) && !temiz.some((x) => x.url === url)) temiz.push({ ad: metin(s.ad), url });
  });
  return temiz;
}

export function sekmeEkle(liste, sekme, genel, sinir = SEKME_SINIRI, izinli) {
  const l = sekmeListesi(liste, genel, izinli);
  if (!sekme || !guvenliUrl(sekme.url) || l.some((x) => x.url === sekme.url)) return l;
  l.push({ ad: metin(sekme.ad) || sekme.url, url: sekme.url });
  while (l.length > sinir) l.splice(1, 1);
  return l;
}

export function sekmeKapat(liste, url, genel, etkinUrl, izinli) {
  const l = sekmeListesi(liste, genel, izinli);
  const i = l.findIndex((x) => x.url === url);
  if (i <= 0) return { liste: l, git: null };
  l.splice(i, 1);
  const git = url === etkinUrl ? (l[i] || l[i - 1]).url : null;
  return { liste: l, git };
}

export function gorunumCoz(ham) {
  const g = ham && typeof ham === 'object' ? ham : {};
  return {
    tema: has(TEMA, g.tema) ? g.tema : 'oto',
    kalinlik: has(KALINLIK, g.kalinlik) ? g.kalinlik : 'zarif',
    yazi: has(YAZI_TIPI, g.yazi) ? g.yazi : 'inter'
  };
}

// Metindeki ilk sayıyı oranla çarpar: "49.586 TL", 0,5 → "24.793 TL".
export function sayiBicim(m, oran) {
  return String(m).replace(/\d[\d.]*/, (s) => {
    const n = parseInt(s.replace(/\./g, ''), 10);
    return Math.round(n * Math.max(0, Math.min(1, oran))).toLocaleString('tr-TR');
  });
}

export function saatKisa(x) {
  const s = String(x || '').trim();
  // Saat dilimi taşıyan ISO metni (Z ya da +03:00) yerel saate çevrilir: API'ler UTC yazar ("…T08:05:00Z" Türkiye'de 11.05).
  if (/T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})$/i.test(s)) {
    const t = new Date(s);
    if (!Number.isNaN(t.getTime())) return String(t.getHours()).padStart(2, '0') + '.' + String(t.getMinutes()).padStart(2, '0');
  }
  const m = /T(\d{2}):(\d{2})/.exec(s) || /(?:^|\s)(\d{1,2})[:.](\d{2})$/.exec(s);
  return m ? m[1].padStart(2, '0') + '.' + m[2] : '—';
}
