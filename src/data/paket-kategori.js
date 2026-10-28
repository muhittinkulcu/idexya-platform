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

// Kademe karşılaştırma tablosu: "<önceki kademe> kapsamı" maddesi o kademenin bütün maddelerini devralır;
// "Ayda 8 gönderi", "2–3 pazaryeri", "15 sayfaya kadar" gibi miktarlı maddeler aynı satırda kademeye göre değeri gösterir.
const ETIKET = { 'sayfaya kadar': 'Sayfa sayısı (en çok)', pazaryeri: 'Pazaryeri sayısı' };
function satirAnahtar(m) {
  let r = m.match(/^Ayda (\d+) (.+)$/);
  if (r) return { anahtar: r[2], deger: 'Ayda ' + r[1] };
  r = m.match(/^(\d+(?:[–-]\d+)?(?: ve üzeri)?) (pazaryeri|sayfaya kadar)$/);
  if (r) return { anahtar: r[2], deger: r[1] };
  return { anahtar: m, deger: null };
}
export function kademeTablosu(p) {
  if (p.birlesik) return null;
  const cozulmus = [], satirlar = new Map();
  p.kademeler.forEach((k, i) => {
    const hucre = new Map(i > 0 && k.maddeler.some((m) => m === p.kademeler[i - 1].ad + ' kapsamı') ? cozulmus[i - 1] : []);
    for (const m of k.maddeler) {
      if (/ kapsamı$/.test(m)) continue;
      const { anahtar, deger } = satirAnahtar(m);
      if (!satirlar.has(anahtar)) satirlar.set(anahtar, { ad: deger ? ETIKET[anahtar] || anahtar.charAt(0).toLocaleUpperCase('tr-TR') + anahtar.slice(1) : m, miktar: !!deger });
      hucre.set(anahtar, deger || true);
    }
    cozulmus.push(hucre);
  });
  // Her kademe bir öncekini devralmıyorsa "yok" işareti yanıltıcı olur; o zaman yalnız miktarlı satırlar gösterilir.
  const tam = p.kademeler.every((k, i) => i === 0 || k.maddeler.includes(p.kademeler[i - 1].ad + ' kapsamı'));
  const liste = [...satirlar].map(([anahtar, s]) => ({ ...s, hucreler: cozulmus.map((h) => h.get(anahtar) ?? false) })).filter((s) => tam || s.miktar);
  return liste.length ? { tam, satirlar: liste } : null;
}
// Kademenin önceki kademeden devraldığı kapsam adı (yoksa null) ve yalnız kendi maddeleri.
export function kademeOzet(p, i) {
  const k = p.kademeler[i], once = i > 0 ? p.kademeler[i - 1].ad : null;
  const miras = once && k.maddeler.includes(once + ' kapsamı') ? once : null;
  return { miras, maddeler: k.maddeler.filter((m) => !/ kapsamı$/.test(m) || (p.birlesik && m !== once + ' kapsamı')) };
}
// Paket türüne göre ilgili sık sorulan sorular (src/data/sss.json sırası).
export function paketSss(sss, idler) {
  const soru = (parca) => sss.find((x) => x.soru.includes(parca));
  const reklam = idler.some((id) => ['google-ads', 'meta-ads', 'birlesik'].includes(id));
  const seo = idler.some((id) => ['seo', 'kurumsal-site'].includes(id));
  const sec = ['Ücretsiz analizde', reklam ? 'Reklam hesabı kime' : null, reklam ? 'Bütçe veya kampanya' : null, seo ? 'SEO çalışmasının' : null, seo ? 'GEO nedir' : null, 'En az ne kadar', 'Sadece tek bir hizmet', 'Sonuçları nasıl'];
  return [...new Set(sec.filter(Boolean).map(soru).filter(Boolean))].slice(0, 6);
}
