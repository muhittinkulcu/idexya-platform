// Panelden düzenlenen site içerik dosyalarının şeması. Aynı tanım hem paneldeki düzenleyiciyi kurar hem de
// sunucuda (worker/yayin.js) GitHub'a yazmadan önce veriyi doğrular. Şemada olmayan alan kaydedilmez.
// Türler: metin, uzun (çok satırlı), mantik, slug, yol (/… iç adres), url (https://… veya /…), gorsel (medya adresi),
// metinListe, liste (oge şemasıyla), nesne (alanlar).

const m = (etiket, sinir = 200, ek = {}) => ({ tur: 'metin', etiket, sinir, ...ek });
const u = (etiket, sinir = 2000, ek = {}) => ({ tur: 'uzun', etiket, sinir, ...ek });
const ml = (etiket, oge = 'madde', sinir = 400, enCok = 40) => ({ tur: 'metinListe', etiket, oge, sinir, enCok });

const SSS_OGE = { tur: 'nesne', baslikAlan: 'soru', alanlar: { soru: m('Soru', 200, { zorunlu: true }), cevap: u('Cevap', 1500, { zorunlu: true }) } };

export const DOSYALAR = {
  hizmetler: {
    ad: 'Hizmetler', yol: 'src/data/hizmetler.json',
    aciklama: 'Hizmet alanları ve her hizmetin sayfa içeriği. Bağlantı adı (slug) sayfa adresidir; yayındaki bir hizmetin adresini değiştirmeyin, eski adres kırılır.',
    sema: { tur: 'liste', etiket: 'Hizmet alanları', oge: 'alan', enCok: 12, ogeSema: { tur: 'nesne', baslikAlan: 'ad', alanlar: {
      id: { tur: 'slug', etiket: 'Alan kimliği (adres parçası)', zorunlu: true },
      ad: m('Alan adı', 80, { zorunlu: true }),
      baslik: m('Vitrin başlığı', 80),
      aciklama: u('Kısa açıklama', 300),
      neden: u('Neden önemli?', 1500),
      dikkat: ml('Neye dikkat ediyoruz?', 'madde', 200, 6),
      hizmetler: { tur: 'liste', etiket: 'Hizmetler', oge: 'hizmet', enCok: 20, ogeSema: { tur: 'nesne', baslikAlan: 'ad', alanlar: {
        ad: m('Hizmet adı', 80, { zorunlu: true }),
        slug: { tur: 'slug', etiket: 'Bağlantı adı (/tr/hizmet/…)', zorunlu: true },
        ozet: m('Kısa özet', 160, { zorunlu: true }),
        giris: u('Sayfa girişi', 400),
        neden: u('Neden önemli?', 1500),
        yapilanlar: { tur: 'liste', etiket: 'Neler yapıyoruz?', oge: 'madde', enCok: 9, ogeSema: { tur: 'nesne', baslikAlan: 'baslik', alanlar: { baslik: m('Başlık', 80, { zorunlu: true }), metin: u('Açıklama', 400, { zorunlu: true }) } } },
        olcum: ml('Neyi ölçüyoruz?', 'ölçüt', 120, 8),
        kimler: ml('Kimler için uygun?', 'madde', 200, 6),
        sss: { tur: 'liste', etiket: 'Sık sorulan sorular', oge: 'soru', enCok: 10, ogeSema: SSS_OGE }
      } } }
    } } }
  },
  urunler: {
    ad: 'Ürünler ve kategoriler', yol: 'src/data/urunler.json',
    aciklama: 'Ürün kataloğu. Yayında en az bir ürün olduğunda üst menüye “Ürünler” kendiliğinden eklenir. Görselleri Medya kütüphanesinden ekleyin.',
    sema: { tur: 'nesne', alanlar: {
      kategoriler: { tur: 'liste', etiket: 'Kategoriler', oge: 'kategori', enCok: 50, ogeSema: { tur: 'nesne', baslikAlan: 'ad', alanlar: {
        id: { tur: 'slug', etiket: 'Kategori kimliği', zorunlu: true }, ad: m('Kategori adı', 80, { zorunlu: true }), aciklama: u('Açıklama', 600)
      } } },
      urunler: { tur: 'liste', etiket: 'Ürünler', oge: 'ürün', enCok: 300, ogeSema: { tur: 'nesne', baslikAlan: 'ad', alanlar: {
        ad: m('Ürün adı', 120, { zorunlu: true }),
        slug: { tur: 'slug', etiket: 'Bağlantı adı (/tr/urunler/…)', zorunlu: true },
        kategori: { tur: 'secim', etiket: 'Kategori', kaynak: 'kategoriler' },
        ozet: m('Kısa özet', 200),
        fiyat: m('Fiyat bilgisi (ör. “Teklif alın”, “₺1.250 + KDV”)', 60),
        gorsel: { tur: 'gorsel', etiket: 'Görsel' },
        ozellikler: ml('Özellikler', 'özellik', 160, 20),
        aciklama: u('Açıklama (paragrafları boş satırla ayırın)', 6000),
        aktif: { tur: 'mantik', etiket: 'Yayında', varsayilan: true }
      } } }
    } }
  },
  paketler: {
    ad: 'Paketler', yol: 'src/data/paketler.json',
    aciklama: 'Paketler sayfası ve paket sihirbazı bu veriyi kullanır. Sihirbaz bazı paket kimliklerine bağlıdır; kimlikleri değiştirmeyin.',
    zorunluKimlikler: ['google-ads', 'meta-ads', 'birlesik', 'eticaret-site', 'pazaryeri', 'sosyal-medya'],
    sema: { tur: 'liste', etiket: 'Paket grupları', oge: 'paket', enCok: 20, ogeSema: { tur: 'nesne', baslikAlan: 'ad', alanlar: {
      id: { tur: 'slug', etiket: 'Kimlik', zorunlu: true },
      tur: { tur: 'slug', etiket: 'Süzgeç türü (reklam, birlesik, web, eticaret, seo, sosyal…)', zorunlu: true },
      turEtiket: m('Üst etiket', 60),
      ad: m('Paket adı', 100, { zorunlu: true }),
      ozet: u('Özet', 400),
      ucretNotu: m('Ücret notu', 100),
      birlesik: { tur: 'mantik', etiket: 'Birleşik paket' },
      kademeler: { tur: 'liste', etiket: 'Kademeler', oge: 'kademe', enCok: 6, ogeSema: { tur: 'nesne', baslikAlan: 'ad', alanlar: {
        ad: m('Kademe adı', 60, { zorunlu: true }), rozet: m('Rozet (ör. Önerilen)', 40), kimIcin: m('Kimin için', 160), maddeler: ml('Kapsam', 'madde', 160, 15)
      } } }
    } } }
  },
  referanslar: {
    ad: 'Referanslar', yol: 'src/data/referanslar.json',
    aciklama: 'Ana sayfadaki “Birlikte büyüdüğümüz markalar” bölümü. Liste boşsa bölüm görünmez. Yalnız izin aldığınız markaları ekleyin.',
    sema: { tur: 'liste', etiket: 'Markalar', oge: 'marka', enCok: 60, ogeSema: { tur: 'nesne', baslikAlan: 'ad', alanlar: { ad: m('Marka adı', 80, { zorunlu: true }), logo: { tur: 'gorsel', etiket: 'Logo (isteğe bağlı)' } } } }
  },
  sss: {
    ad: 'Sık sorulan sorular', yol: 'src/data/sss.json',
    aciklama: 'Ana sayfadaki sık sorulan sorular. Hizmet sayfalarındaki sorular Hizmetler içinden düzenlenir.',
    sema: { tur: 'liste', etiket: 'Sorular', oge: 'soru', enCok: 20, ogeSema: SSS_OGE }
  },
  'site-menu': {
    ad: 'Menüler', yol: 'src/data/site-menu.json',
    aciklama: 'Üst menü, alt bilgi bağlantıları ve sosyal hesaplar.',
    sema: { tur: 'nesne', alanlar: {
      ust: { tur: 'liste', etiket: 'Üst menü', oge: 'bağlantı', enCok: 10, ogeSema: { tur: 'nesne', baslikAlan: 'ad', alanlar: {
        k: { tur: 'slug', etiket: 'Kimlik', zorunlu: true }, ad: m('Ad', 40, { zorunlu: true }), href: { tur: 'yol', etiket: 'Adres', zorunlu: true },
        ust: { tur: 'mantik', etiket: 'Üst çubukta da göster' }, alt: m('Açılır menüdeki alt yazı', 80)
      } } },
      alt: { tur: 'liste', etiket: 'Alt bilgi sütunları', oge: 'sütun', enCok: 5, ogeSema: { tur: 'nesne', baslikAlan: 'baslik', alanlar: {
        baslik: m('Sütun başlığı', 40, { zorunlu: true }),
        baglantilar: { tur: 'liste', etiket: 'Bağlantılar', oge: 'bağlantı', enCok: 10, ogeSema: { tur: 'nesne', baslikAlan: 'ad', alanlar: { ad: m('Ad', 60, { zorunlu: true }), href: { tur: 'url', etiket: 'Adres', zorunlu: true } } } }
      } } },
      sosyal: { tur: 'liste', etiket: 'Sosyal hesaplar', oge: 'hesap', enCok: 8, ogeSema: { tur: 'nesne', baslikAlan: 'ad', alanlar: { ad: m('Ad (Instagram, Facebook, X, LinkedIn, YouTube, TikTok)', 30, { zorunlu: true }), href: { tur: 'url', etiket: 'Adres', zorunlu: true } } } },
      tanitim: u('Alt bilgi tanıtım cümlesi', 200)
    } }
  },
  yasal: {
    ad: 'Yasal sayfalar', yol: 'src/data/yasal.json',
    aciklama: 'KVKK aydınlatma metni, çerez politikası ve gizlilik politikası. Değişiklikten önce hukuki doğruluğunu kontrol edin.',
    sema: { tur: 'nesne', alanlar: {
      guncelleme: m('Son güncelleme tarihi (ör. 23 Ekim 2026)', 40, { zorunlu: true }),
      ...Object.fromEntries([['kvkk', 'KVKK aydınlatma metni'], ['cerez', 'Çerez politikası'], ['gizlilik', 'Gizlilik politikası']].map(([k, ad]) => [k, { tur: 'nesne', etiket: ad, alanlar: {
        ad: m('Sayfa adı', 80, { zorunlu: true }),
        bolumler: { tur: 'liste', etiket: 'Bölümler', oge: 'bölüm', enCok: 30, ogeSema: { tur: 'nesne', baslikAlan: 'baslik', alanlar: { baslik: m('Bölüm başlığı', 120, { zorunlu: true }), metin: ml('Paragraflar', 'paragraf', 3000, 20) } } }
      } }])),
      cerezler: { tur: 'liste', etiket: 'Çerez tablosu', oge: 'çerez', enCok: 40, ogeSema: { tur: 'nesne', baslikAlan: 'ad', alanlar: { ad: m('Çerez adı', 60, { zorunlu: true }), saglayici: m('Sağlayıcı', 60), tur: m('Tür', 30), amac: m('Amaç', 160), sure: m('Süre', 30) } } }
    } }
  }
};

// Sunucu ve panel ortak doğrulayıcısı. Geçerliyse temizlenmiş veriyi, değilse hata listesini döndürür.
export function dogrula(sema, deger, kok = deger, yol = '') {
  const hatalar = [];
  const ad = (s) => s.etiket || yol || 'Değer';
  const temiz = (s, v, y) => {
    const h = (mesaj) => { hatalar.push(`${y || 'Kök'}: ${mesaj}`); return undefined; };
    if (s.tur === 'nesne') {
      if (!v || typeof v !== 'object' || Array.isArray(v)) return h('nesne bekleniyor');
      const c = {};
      for (const [k, alt] of Object.entries(s.alanlar)) {
        const r = temiz(alt, v[k], y ? `${y} › ${alt.etiket || k}` : (alt.etiket || k));
        if (alt.tur === 'mantik' && r === false && !(k in v) && !alt.varsayilan) continue;
        if (r !== undefined && r !== '' && !(Array.isArray(r) && !r.length && !alt.zorunlu && !(k in v))) c[k] = r;
      }
      return c;
    }
    if (s.tur === 'liste' || s.tur === 'metinListe') {
      if (v === undefined || v === null) return [];
      if (!Array.isArray(v)) return h('liste bekleniyor');
      if (v.length > (s.enCok || 100)) return h(`en fazla ${s.enCok} öğe olabilir`);
      return v.map((x, i) => { const yy = `${y ? y + ' › ' : ''}${i + 1}. ${s.oge || 'öğe'}`; return s.tur === 'metinListe' ? temiz({ tur: 'uzun', sinir: s.sinir, zorunlu: true }, x, yy) : temiz(s.ogeSema, x, yy); }).filter((x) => x !== undefined);
    }
    if (s.tur === 'mantik') return v === undefined ? (s.varsayilan ?? false) : !!v;
    if (v === undefined || v === null || v === '') return s.zorunlu ? h('boş bırakılamaz') : '';
    if (typeof v !== 'string') return h('metin bekleniyor');
    const t = s.tur === 'uzun' ? v.replace(/\r\n/g, '\n').trim() : v.replace(/\s+/g, ' ').trim();
    if (!t && s.zorunlu) return h('boş bırakılamaz');
    if (t.length > (s.sinir || 300)) return h(`en fazla ${s.sinir || 300} karakter`);
    if (s.tur === 'slug' && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(t)) return h('yalnız küçük harf (Türkçe karaktersiz), rakam ve tire');
    if (s.tur === 'yol' && !/^\/[^\s<>"']*$/.test(t)) return h('/ ile başlayan site içi adres olmalı');
    if ((s.tur === 'url' || s.tur === 'gorsel') && !/^(https:\/\/[^\s<>"']+|\/[^\s<>"']*)$/.test(t)) return h('https:// ile ya da / ile başlayan adres olmalı');
    if (s.tur === 'secim' && s.kaynak) { const l = (kok && kok[s.kaynak]) || []; if (t && !l.some((x) => x.id === t)) return h('listede olmayan bir seçim'); }
    return t;
  };
  const sonuc = temiz(sema, deger, yol);
  return hatalar.length ? { hatalar } : { veri: sonuc };
}

// Dosyaya özel ek kurallar: benzersiz kimlikler, sihirbazın kullandığı paketler.
export function ekDenetim(ad, veri) {
  const h = [];
  const tekil = (liste, alan, etiket) => { const g = new Set(); for (const x of liste || []) { if (g.has(x[alan])) h.push(`${etiket}: “${x[alan]}” birden fazla kez kullanılmış`); g.add(x[alan]); } };
  if (ad === 'hizmetler') { tekil(veri, 'id', 'Alan kimliği'); tekil(veri.flatMap((g) => g.hizmetler || []), 'slug', 'Hizmet bağlantı adı'); }
  if (ad === 'urunler') { tekil(veri.kategoriler, 'id', 'Kategori kimliği'); tekil(veri.urunler, 'slug', 'Ürün bağlantı adı'); }
  if (ad === 'paketler') { tekil(veri, 'id', 'Paket kimliği'); for (const k of DOSYALAR.paketler.zorunluKimlikler) if (!veri.some((p) => p.id === k)) h.push(`Paket sihirbazı “${k}” kimlikli paketi kullanıyor; silinemez`); }
  if (ad === 'site-menu') tekil(veri.ust, 'k', 'Menü kimliği');
  return h;
}
