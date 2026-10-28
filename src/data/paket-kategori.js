// Paket kategorileri ve paketlerin ilgili hizmet/platform bağlantıları (Muhittin, 28 Eki 2026).
// Üst menü, çekmece, /tr/paketler/kategori/… ve /tr/paketler/… sayfaları bu dosyayı kullanır.
export const KATEGORILER = [
  { slug: 'reklam', ad: 'Reklam', alt: 'Google, Meta ve birleşik paketler', aciklama: 'Google ve Meta reklamlarını tek tek ya da tek bütçe planıyla birlikte yöneten paketler. Hepsinde ölçüm kurulumu, aylık rapor ve onaylı değişiklik vardır.', idler: ['google-ads', 'meta-ads', 'birlesik'] },
  { slug: 'e-ticaret', ad: 'E-ticaret', alt: 'Mağaza kurulumu, yönetim ve pazaryeri', aciklama: 'Mağazanızı kurmaktan günlük yönetime ve pazaryerlerine kadar e-ticaretin her aşaması için paketler.', idler: ['eticaret-site', 'eticaret-yonetim', 'pazaryeri'] },
  { slug: 'web-ve-seo', ad: 'Web ve SEO', alt: 'Kurumsal site ve arama görünürlüğü', aciklama: 'Hızlı ve güvenilir bir kurumsal site ile Google ve yapay zekâ aramalarında kalıcı görünürlük için paketler.', idler: ['kurumsal-site', 'seo'] },
  { slug: 'icerik', ad: 'İçerik', alt: 'Sosyal medya ve içerik üretimi', aciklama: 'Markanıza uygun, düzenli ve ölçülen sosyal medya içerikleri için paketler.', idler: ['sosyal-medya'] }
];
// Paket → ilgili hizmet sayfaları ve platform sayfaları.
export const PAKET_BAG = {
  'google-ads': { hizmetler: ['google-ads-yonetimi', 'dijital-pazarlama-yonetimi'], platformlar: ['google-ads', 'google-analytics-4', 'tag-manager'] },
  'meta-ads': { hizmetler: ['meta-business-ads-yonetimi', 'dijital-pazarlama-yonetimi'], platformlar: ['meta', 'tag-manager'] },
  birlesik: { hizmetler: ['dijital-pazarlama-yonetimi', 'google-ads-yonetimi', 'meta-business-ads-yonetimi'], platformlar: ['google-ads', 'meta', 'google-analytics-4'] },
  'eticaret-site': { hizmetler: ['e-ticaret-yonetimi', 'web-tasarim-hizmetleri', 'e-ticaret-urun-kategori-yonetimi'], platformlar: ['ikas', 'google-analytics-4'] },
  'eticaret-yonetim': { hizmetler: ['e-ticaret-yonetimi', 'e-ticaret-urun-kategori-yonetimi', 'e-ticaret-kargo-lojistik-yonetimi'], platformlar: ['ikas', 'ticimax'] },
  pazaryeri: { hizmetler: ['e-ticaret-pazaryeri-yonetimi', 'e-ticaret-pazaryeri-reklam-yonetimi', 'e-ticaret-entegrasyon-yonetimi'], platformlar: ['ticimax', 'ikas'] },
  'kurumsal-site': { hizmetler: ['web-tasarim-hizmetleri', 'site-ici-seo-on-page-seo', 'teknik-seo'], platformlar: ['search-console', 'google-analytics-4'] },
  seo: { hizmetler: ['seo-icerik-optimizasyonu', 'teknik-seo', 'yerel-seo-hizmeti', 'seo-anahtar-kelime-analizi'], platformlar: ['search-console', 'google-analytics-4'] },
  'sosyal-medya': { hizmetler: ['instagram-reels-youtube-shorts-cekimleri', 'grafik-tasarim-hizmetleri', 'urun-fotograf-video-cekimleri'], platformlar: ['meta'] }
};
export const kategoriBul = (paketId) => KATEGORILER.find((k) => k.idler.includes(paketId));
