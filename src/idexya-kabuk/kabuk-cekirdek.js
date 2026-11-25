// Kabuğun saf işlevleri (DOM yok). Ayrıntı: README.md.

// Tek gezinme (Muhittin, talimat 4.2): sol menü 12 maddedir (20 Kas 2026: Web ve Commerce → Web Site Yönetimi + E-Ticaret); "katman" artık sol menünün bir maddesidir (modül). Sıra katmanlar.json'dadır.
export const KATMAN_ANAHTARLARI = ['genel', 'musteriler', 'gorevler', 'marketing', 'crm', 'web', 'eticaret', 'creative', 'marketplace', 'ai', 'raporlar', 'ayarlar'];
// Madde simgesi katmanlar.json'da (`simge`, SIMGE adı) verilir; yoksa ya da bilinmiyorsa bu varsayılan.
export const KATMAN_SIMGE = {
  genel: 'ev', musteriler: 'kisiler', gorevler: 'onay', marketing: 'megafon', crm: 'huni', web: 'dunya', eticaret: 'sepet', creative: 'palet',
  marketplace: 'magaza', ai: 'yildiz', raporlar: 'belge', ayarlar: 'ayar'
};
export const SEKME_SINIRI = 8;
export const ARAMA_SINIRI = 14;
export const KAYNAK_SINIRI = 8, KAYNAK_GECIKME = 150;

// Grup ve katman simgeleri; bilinmeyen ad `izgara` olur (katmanda varsayılan KATMAN_SIMGE).
export const SIMGE = {
  ev: ['M3 11l9-8 9 8', 'M5 10v10h14V10', 'M10 20v-6h4v6'],
  palet: ['M12 21a9 9 0 1 1 9-9c0 2.5-2 3.5-4 3.5h-2a2 2 0 0 0-1.5 3.3A1.5 1.5 0 0 1 12 21z', 'M7.5 11.5h.01', 'M10.5 7.5h.01', 'M15.5 8.5h.01'],
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
  ayrac: ['M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z'],
  onay: ['M9 11l3 3 8-8', 'M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9'],
  huni: ['M3 4h18l-7 8v6l-4 2v-8z'],
  sepet: ['M3 4h2l2.2 10.2a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.1L21 8H6.2', 'M9.5 20h.01', 'M17 20h.01'],
  magaza: ['M4 9l1.5-5h13L20 9', 'M4 9h16v2a3 3 0 0 1-5.3 1.9A3 3 0 0 1 12 14a3 3 0 0 1-2.7-1.1A3 3 0 0 1 4 11z', 'M5 13.5V20h14v-6.5', 'M10 20v-4h4v4'],
  ayar: ['M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1']
};

// Tema dört seçenek (Muhittin, 15 Kas 2026). Yazı tipi (Inter) ve kalınlık (Zarif: 300/350/400/500) sabittir, kabuk.css :root.
export const TEMA = { acik: 'Açık', koyu: 'Koyu', sistem: 'Sistem', zaman: 'Zaman' };
export const TEMA_SIRASI = ['acik', 'koyu', 'sistem', 'zaman'];
export const ZAMAN_VARSAYILAN = { zamanAcik: 420, zamanKoyu: 1140 }; // 07.00 açık, 19.00 koyu (gün içindeki dakika)

// Ortak aktif müşteri (1.3, Muhittin 18 Kas 2026): üç modül aynı seçimi `idx-musteri` anahtarında paylaşır (tek köken
// os.idexya.com). Değer IDOS `client_id` (düz metin); Creative markayı `idos_client_id` ile çevirir, Website/CRM kartları
// `ana_kayit_id` ile süzer. Ad değil yalnız kimlik saklanır. Geçersiz kayıt yok sayılır. Çıkış yap anahtarı siler.
// Mega menü sütunları (20 Kas 2026): modüller sırası bozulmadan en çok `en` sütuna, ağırlık (1 + sayfa sayısı) dengeli.
// 3'ten az modülde bölünmez (tek sütun).
export function sutunBol(moduller, en = 3) {
  const l = Array.isArray(moduller) ? moduller : [];
  if (l.length < 3) return [l];
  const n = Math.min(en, l.length), ağırlık = (m) => 1 + ((m && m.sayfalar) || []).length;
  const toplam = l.reduce((t, m) => t + ağırlık(m), 0), hedef = toplam / n, çıktı = [[]];
  let birikim = 0;
  l.forEach((m, i) => {
    const kalan = l.length - i, açılacak = n - çıktı.length;
    if (çıktı[çıktı.length - 1].length && açılacak > 0 && (birikim >= hedef * çıktı.length || kalan <= açılacak)) çıktı.push([]);
    çıktı[çıktı.length - 1].push(m); birikim += ağırlık(m);
  });
  return çıktı;
}

// Asistan kedisinin sürüklenmiş yeri ekranın içinde kalır (8 px pay); sayı olmayan değer sağ alta düşer.
export function kediKonum(x, y, w, h, gen, yuk, pay = 8) {
  const sınır = (v, en, enÇok) => Math.min(Math.max(Number.isFinite(v) ? v : enÇok, en), Math.max(en, enÇok));
  return { x: sınır(x, pay, gen - w - pay), y: sınır(y, pay, yuk - h - pay) };
}

export const MUSTERI_ANAHTARI = 'idx-musteri';
export const musteriKimligi = (x) => (typeof x === 'string' && /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(x) ? x : '');
export function musteriOku(depo) { try { return musteriKimligi(depo && depo.getItem(MUSTERI_ANAHTARI)); } catch (e) { return ''; } }
export function musteriYaz(depo, id) {
  const k = musteriKimligi(id);
  try { if (k) depo.setItem(MUSTERI_ANAHTARI, k); else depo.removeItem(MUSTERI_ANAHTARI); } catch (e) { /* gizli kip */ }
  return k;
}

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

// Tek adres (tek-adres-plani.md): kabuk os.idexya.com'da açılınca açılmış modüllerin eski kökeni yol önekine çevrilir
// (https://panel.idexya.com/x → /website/x). Yalnız yönlendiricide AÇIK modül yazılır.
export const OS_ALANLARI = ['os.idexya.com'];
export const OS_ONEKLERI = {
  'https://marketing.idexya.com': '/marketing', 'https://panel.idexya.com': '/website', 'https://creative.idexya.com': '/creative'
};
const BU_ALAN = typeof location !== 'undefined' ? location.host : '';
export function osAdresi(u, alan = BU_ALAN) {
  if (typeof u !== 'string' || !OS_ALANLARI.includes(alan)) return u;
  const t = u.trim();
  if (!/^https:\/\//i.test(t)) return u;
  let r;
  try { r = new URL(t); } catch (e) { return u; }
  const onek = has(OS_ONEKLERI, r.origin) ? OS_ONEKLERI[r.origin] : null;
  if (!onek || r.username || r.password) return u;
  return onek + r.pathname + r.search + r.hash;
}

export const metinListesi = (x) => (Array.isArray(x) ? x.filter((s) => typeof s === 'string') : []);

export const renkGecerli = (r) => typeof r === 'string' && /^#[0-9a-f]{6}$/i.test(r);

export const rozetSay = (n) => (Number.isFinite(n) && n > 0 ? Math.floor(n) : 0);

const metin = (x, sinir = 120) => (typeof x === 'string' ? x.trim().slice(0, sinir) : '');

export function ayarDogrula(ham, alan = BU_ALAN) {
  const hatalar = [];
  const a = ham && typeof ham === 'object' ? ham : (hatalar.push('ayar nesne değil'), {});
  const katmanlar = [], ham2 = Array.isArray(a.katmanlar) ? a.katmanlar : [];
  const O = (x) => osAdresi(x, alan);
  // Bayraklı madde (Marketplace: verisi yok) yalnız ürün `bayraklar` listesinde açtıysa çizilir; kapalıyken sessizce atılır
  // (çalışmayan ekran gösterilmez, talimat 4.2).
  const bayraklar = metinListesi(a.bayraklar);
  const acik = (k) => !(k && typeof k.bayrak === 'string' && !bayraklar.includes(k.bayrak));
  const kokenler = ham2.filter(acik).map((k) => k && koken(O(k.url))).filter(Boolean).concat(OS_ALANLARI.map((x) => 'https://' + x));
  const U = (x) => guvenliUrl(O(x), kokenler);
  ham2.forEach((k, ki) => {
    if (!k || !KATMAN_ANAHTARLARI.includes(k.anahtar)) { hatalar.push('katman ' + ki + ': bilinmeyen anahtar'); return; }
    if (!acik(k)) return;
    if (katmanlar.some((x) => x.anahtar === k.anahtar)) { hatalar.push(k.anahtar + ': iki kez'); return; }
    const url = U(k.url);
    if (!url) { hatalar.push(k.anahtar + ': geçersiz url'); return; }
    const renk = renkGecerli(k.renk) ? k.renk : '#2F55D4';
    const renkKoyu = renkGecerli(k.renkKoyu) ? k.renkKoyu : renk;
    // Ton: maddenin kendi rengi (menü karesi, mega menü başlığı, sayfa bandı); verilmezse vurgu rengi.
    const ton = renkGecerli(k.ton) ? k.ton : renk;
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
          if (su && metin(s.ad)) sayfalar.push({ ad: metin(s.ad), url: su, rozet: rozetSay(s.rozet), aciklama: metin(s.aciklama, 200) });
          else hatalar.push(k.anahtar + ': sayfa atlandı (' + metin(s && s.ad) + ')');
        });
        moduller.push({ ad: metin(m.ad), url: mu, rozet: rozetSay(m.rozet), aciklama: metin(m.aciklama, 200), sayfalar });
      });
      if (metin(g && g.baslik)) gruplar.push({ baslik: metin(g.baslik), simge: has(SIMGE, g.simge) ? g.simge : 'izgara', moduller });
    });
    const simge = has(SIMGE, k.simge) ? k.simge : KATMAN_SIMGE[k.anahtar];
    katmanlar.push({ anahtar: k.anahtar, ad: metin(k.ad) || k.anahtar, simge, url, renk, renkKoyu, ton, aciklama: metin(k.aciklama, 400), gruplar });
  });
  if (!katmanlar.length) hatalar.push('katman yok');
  let katman = a.katman;
  if (!katmanlar.some((k) => k.anahtar === katman)) { hatalar.push('geçerli katman bulunamadı'); katman = katmanlar[0] ? katmanlar[0].anahtar : 'idos'; }
  const e = a.etkin || {};
  const kul = a.kullanici || {};
  const d = a.durum || {};
  // Asistan görseli kabuğun kendi kedisidir (kedi.webp, kabuk.css); ürün görsel vermez, `gorsel` alanı yok sayılır.
  const as = a.asistan && typeof a.asistan === 'object' ? { etiket: metin(a.asistan.etiket) || 'IDOS’a sor' } : null;
  const eylemler = (Array.isArray(a.eylemler) ? a.eylemler : [])
    .map((x) => ({ ad: metin(x && x.ad), url: U(x && x.url), katman: x && x.katman }))
    .filter((x) => x.ad && x.url);
  return {
    hatalar,
    ayar: {
      katman, katmanlar, eylemler, kokenler, bayraklar,
      etkin: { modulUrl: U(e.modulUrl), sayfaUrl: U(e.sayfaUrl), ad: metin(e.ad) },
      kullanici: { ad: metin(kul.ad) || 'Kullanıcı', rol: metin(kul.rol), eposta: metin(kul.eposta, 254) },
      durum: durumCoz(d, U),
      asistan: as,
      bildirimUrl: U(a.bildirimUrl),
      cikisUrl: U(a.cikisUrl),
      ayarlarUrl: U(a.ayarlarUrl),
      // Ayarlar sayfasındaki "Modül ayarları" (ürünün kendi ayar ve yönetim sayfaları); yetki süzgeci üründe.
      ayarBaglantilari: (Array.isArray(a.ayarBaglantilari) ? a.ayarBaglantilari : [])
        .map((x) => ({ ad: metin(x && x.ad), url: U(x && x.url), aciklama: metin(x && x.aciklama, 200) }))
        .filter((x) => x.ad && x.url).slice(0, 20)
    }
  };
}

// Durum kapsülü (README "Ayar şeması"): baglanti true (Bağlı) | false (Bağlantı yok) | 'uyari' (bağlı ama sorun var: ürünün
// kısa metniyle, ör. "3 kaynak eşitlenemiyor") | null (bilinmiyor). `url` verilirse kapsül oraya bağlantıdır (IDOS: Veri sağlığı).
export function durumCoz(d, U = (x) => guvenliUrl(x)) {
  d = d && typeof d === 'object' ? d : {};
  const b = d.baglanti === true || d.baglanti === false || d.baglanti === 'uyari' ? d.baglanti : null;
  return { baglanti: b, esitleme: metin(d.esitleme, 40), metin: b === 'uyari' ? metin(d.metin, 80) || 'Eşitlemede sorun var' : '', url: U(d.url) || null };
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

// Etkin madde (sol menüde açık olan): adresin bulunduğu madde. Önce sayfa, sonra modül, sonra maddenin kendi adresi; hiçbiri
// değilse ürünün varsayılan maddesi (`ayar.katman`). Aynı adres iki maddede olmamalı (katmanlar.test.mjs denetler).
export function etkinKatman(katmanlar, etkin, varsayilan) {
  const su = etkin && etkin.sayfaUrl, mu = etkin && etkin.modulUrl;
  const bul = (f) => katmanlar.find((k) => k.gruplar.some((g) => g.moduller.some(f)));
  return (su && bul((m) => m.sayfalar.some((s) => s.url === su)))
    || bul((m) => (mu && m.url === mu) || (su && m.url === su))
    || katmanlar.find((k) => (su && k.url === su) || (mu && k.url === mu))
    || katmanlar.find((k) => k.anahtar === varsayilan) || katmanlar[0] || null;
}
// Maddenin rozeti: içindeki modül ve sayfa rozetlerinin toplamı (madde kapalıyken satırında görünür).
export function katmanRozeti(katman, rozet) {
  const u = new Set();
  katman.gruplar.forEach((g) => g.moduller.forEach((m) => { u.add(m.url); m.sayfalar.forEach((s) => u.add(s.url)); }));
  let n = 0; u.forEach((x) => { n += rozet[x] || 0; });
  return n;
}

export function aramaHavuzu(ayar) {
  const h = [];
  ayar.katmanlar.forEach((k) => k.gruplar.forEach((g) => g.moduller.forEach((m) => {
    const yol = k.ad + ' › ' + g.baslik;
    h.push({ tur: 'Sayfalar', ad: m.ad, yol, url: m.url, katman: k.anahtar, renk: k.ton, simge: k.ad.charAt(0), ksimge: k.simge });
    m.sayfalar.forEach((s) => h.push({ tur: 'Sayfalar', ad: m.ad + ' › ' + s.ad, yol, url: s.url, katman: k.anahtar, renk: k.ton, simge: k.ad.charAt(0), ksimge: k.simge }));
  })));
  const ak = ayar.katmanlar.find((x) => x.anahtar === ayar.katman);
  if (ayar.ayarlarUrl) h.push({ tur: 'Sayfalar', ad: 'Ayarlar', yol: (ak ? ak.ad + ' › ' : '') + 'Görünüm, arayüz, hesap', url: ayar.ayarlarUrl, katman: ayar.katman, renk: ak ? ak.ton : '#2F55D4', simge: 'A' });
  ayar.eylemler.forEach((e) => {
    const k = ayar.katmanlar.find((x) => x.anahtar === e.katman);
    h.push({ tur: 'Eylemler', ad: e.ad, yol: k ? k.ad : '', url: e.url, katman: e.katman, renk: '#B85C08', simge: '+' });
  });
  return h;
}

// Mega menüde grup listesinin alt satırı: sayfası olan modül "bölüm"dür, sayfasız modül tek sayfadır.
export function grupOzet(g) {
  const m = g.moduller, b = m.filter((x) => x.sayfalar.length).length, s = m.reduce((t, x) => t + (x.sayfalar.length || 1), 0);
  return (b ? m.length + ' bölüm, ' : '') + s + ' sayfa';
}

// Önizleme kartı için ürünün verdiği veri (README "Mega menü"). Metinler kısaltılır, en çok 4 sayı ve 60 noktalık eğri; geçersiz
// değer atılır, bilinmeyen değer "—". Liste en çok 5 satır; `oran` 0-1 arası çubuk, `url` güvenli adres. iyi: true (yeşil) | false (kırmızı) | yok; renk tek başına anlatmaz, değişim metni yazılır.
export function onizlemeCoz(x) {
  x = x && typeof x === 'object' ? x : {};
  const sayilar = (Array.isArray(x.sayilar) ? x.sayilar : []).map((y) => y && typeof y === 'object' ? {
    ad: metin(y.ad, 40), deger: metin(y.deger, 24) || '—', degisim: metin(y.degisim, 16), iyi: y.iyi === true || y.iyi === false ? y.iyi : null
  } : null).filter((y) => y && y.ad).slice(0, 4);
  const egri = (Array.isArray(x.egri) ? x.egri : []).filter((n) => typeof n === 'number' && Number.isFinite(n)).slice(-60);
  const l = x.liste && typeof x.liste === 'object' ? x.liste : {};
  const ogeler = (Array.isArray(l.ogeler) ? l.ogeler : []).map((y) => y && typeof y === 'object' ? {
    ad: metin(y.ad, 60), deger: metin(y.deger, 24), url: guvenliUrl(y.url) || '', iyi: y.iyi === true || y.iyi === false ? y.iyi : null,
    oran: typeof y.oran === 'number' && y.oran >= 0 ? Math.min(y.oran, 1) : null
  } : null).filter((y) => y && y.ad).slice(0, 5);
  return { uyari: metin(x.uyari, 120), sayilar, egri: egri.length > 1 ? egri : [], egriAd: metin(x.egriAd, 60), not: metin(x.not, 120),
    liste: ogeler.length ? { baslik: metin(l.baslik, 40) || 'Öne çıkanlar', ogeler } : null };
}

// Eğri: seri, w × h kutusuna ölçeklenmiş SVG yol verisi (üstte 2 px pay). Düz seri ortada yatay çizgidir.
export function egriYol(seri, w = 100, h = 40) {
  if (!seri || seri.length < 2) return '';
  const en = Math.min(...seri), ek = Math.max(...seri), a = ek - en, y = (v) => (a ? h - 2 - ((v - en) / a) * (h - 4) : h / 2);
  return seri.map((v, i) => (i ? 'L' : 'M') + +(i * w / (seri.length - 1)).toFixed(2) + ' ' + +y(v).toFixed(2)).join('');
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

// Arama kaynağı (README): ≥2 karakter, 150 ms sonra; dönen işlev iptal eder.
export function kaynakAra(kaynaklar, sorgu, kokenler, bitti) {
  const q = String(sorgu || '').trim(), ac = new AbortController(), s = ac.signal;
  if (q.length < 2 || !kaynaklar.length) return null;
  const t = setTimeout(() => kaynaklar.forEach((k) => Promise.resolve().then(() => k.ara(q, s))
    .then((r) => kaynakSonuc(r, k.ad, kokenler)).catch(() => null).then((r) => s.aborted || bitti(k, r))), KAYNAK_GECIKME);
  return () => { clearTimeout(t); ac.abort(); };
}
export const kaynakSonuc = (l, tur, kokenler) => (Array.isArray(l) ? l : []).map((x) => x && {
  tur, ad: metin(x.ad), yol: metin(x.yol), url: guvenliUrl(x.url, kokenler), simge: metin(x.simge || x.ad).charAt(0)
}).filter((x) => x && x.ad && x.url).slice(0, KAYNAK_SINIRI);
export const aramaBirlestir = (menu, kaynaklar, durum) => menu.concat(...kaynaklar.map((k) => durum.get(k.ad) || []));
export const kaynakDurumu = (kaynaklar, durum) => kaynaklar.map((k) => (durum.get(k.ad) === 0 ? k.ad + ' aranıyor…'
  : durum.get(k.ad) === null ? k.ad + ' alınamadı' : '')).filter(Boolean).join('. ');

// Sekmeler: Genel bakış ilk ve kapatılamaz; sonra sabitler, sonra ötekiler (25 Kas 2026). Taşan en eski SABİT OLMAYAN düşer;
// saklanan sekme yalnız aynı köken ve `izinli`.
export function sekmeListesi(liste, genel, izinli) {
  const temiz = [{ ad: genel.ad, url: genel.url }];
  (Array.isArray(liste) ? liste : []).forEach((s) => {
    const url = guvenliUrl(s && s.url);
    if (url && (!izinli || izinli.has(url)) && metin(s.ad) && !temiz.some((x) => x.url === url)) temiz.push(s.sabit === true ? { ad: metin(s.ad), url, sabit: true } : { ad: metin(s.ad), url });
  });
  return temiz.slice(0, 1).concat(temiz.slice(1).filter((x) => x.sabit), temiz.slice(1).filter((x) => !x.sabit));
}

export function sekmeEkle(liste, sekme, genel, sinir = SEKME_SINIRI, izinli) {
  const l = sekmeListesi(liste, genel, izinli);
  if (!sekme || !guvenliUrl(sekme.url) || l.some((x) => x.url === sekme.url)) return l;
  l.push({ ad: metin(sekme.ad) || sekme.url, url: sekme.url });
  for (let i; l.length > sinir && (i = l.findIndex((x, j) => j && !x.sabit && j < l.length - 1)) > 0;) l.splice(i, 1);
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

// Sabitle ya da çöz; liste kendi sırasına oturur.
export const sekmeSabit = (liste, url, genel, izinli) => sekmeListesi(sekmeListesi(liste, genel, izinli).map((x, i) => (i && x.url === url ? { ad: x.ad, url, sabit: !x.sabit } : x)), genel);
// `url` sekmesini `hedef` sekmesinin yerine taşır; Genel bakış ve sabit/sabit olmayan sınırı geçilmez.
export function sekmeTasi(liste, url, hedef, genel, izinli) {
  const l = sekmeListesi(liste, genel, izinli), a = l.findIndex((x) => x.url === url), b = l.findIndex((x) => x.url === hedef);
  if (a > 0 && b > 0 && !l[a].sabit === !l[b].sabit) l.splice(b, 0, l.splice(a, 1)[0]);
  return l;
}

// idx-gorunum kaydı. Eski `oto` → `sistem`; eski `kalinlik` ve `yazi` okunur, atılır (yazı tipi seçimi kalktı, 15 Kas 2026).
const dakika = (x, v) => (Number.isInteger(x) && x >= 0 && x < 1440 ? x : v);
export function gorunumCoz(ham) {
  const g = ham && typeof ham === 'object' ? ham : {};
  const tema = g.tema === 'oto' ? 'sistem' : has(TEMA, g.tema) ? g.tema : 'sistem';
  let zamanAcik = dakika(g.zamanAcik, ZAMAN_VARSAYILAN.zamanAcik), zamanKoyu = dakika(g.zamanKoyu, ZAMAN_VARSAYILAN.zamanKoyu);
  if (zamanAcik === zamanKoyu) ({ zamanAcik, zamanKoyu } = ZAMAN_VARSAYILAN);
  return { tema, zamanAcik, zamanKoyu, azHareket: g.azHareket === true };
}
export const sonrakiTema = (t) => TEMA_SIRASI[(TEMA_SIRASI.indexOf(t) + 1) % TEMA_SIRASI.length];

// Zamana göre: [zamanAcik, zamanKoyu) aralığında açık, dışında koyu (aralık gece yarısını aşabilir).
export function zamanTemasi(simdi, acik, koyu) {
  const m = simdi.getHours() * 60 + simdi.getMinutes();
  const gunduz = acik < koyu ? m >= acik && m < koyu : m >= acik || m < koyu;
  return gunduz ? 'acik' : 'koyu';
}
export function temaCoz(g, sistemKoyu, simdi = new Date()) {
  if (g.tema === 'acik' || g.tema === 'koyu') return g.tema;
  if (g.tema === 'zaman') return zamanTemasi(simdi, g.zamanAcik, g.zamanKoyu);
  return sistemKoyu ? 'koyu' : 'acik';
}
// Sonraki sınıra kalan süre (ms); en çok bir dakika (uyku, saat değişimi kaçmasın).
export function sinirBekle(simdi, acik, koyu) {
  const m = simdi.getHours() * 60 + simdi.getMinutes(), s = simdi.getSeconds() * 1000 + simdi.getMilliseconds();
  const kalan = Math.min(...[acik, koyu].map((x) => ((x - m + 1440) % 1440 || 1440) * 60000 - s));
  return Math.max(250, Math.min(60000, kalan));
}
// 420 → "07.00" (TDK saat yazımı); "07:00" (input type=time) → 420, geçersizse null.
export const saatMetni = (x) => String(Math.floor(x / 60)).padStart(2, '0') + '.' + String(x % 60).padStart(2, '0');
export function saatOku(x) {
  const m = /^(\d{1,2})[:.](\d{2})$/.exec(String(x || '').trim());
  if (!m) return null;
  const h = +m[1], d = +m[2];
  return h < 24 && d < 60 ? h * 60 + d : null;
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
  // Saat dilimli ISO metni (Z, +03:00) yerel saate çevrilir.
  if (/T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})$/i.test(s)) {
    const t = new Date(s);
    if (!Number.isNaN(t.getTime())) return String(t.getHours()).padStart(2, '0') + '.' + String(t.getMinutes()).padStart(2, '0');
  }
  const m = /T(\d{2}):(\d{2})/.exec(s) || /(?:^|\s)(\d{1,2})[:.](\d{2})$/.exec(s);
  return m ? m[1].padStart(2, '0') + '.' + m[2] : '—';
}
