// Panel adres seçenekleri İngilizce (Muhittin, 30 Eki 2026): panel.idexya.com/leads?tab=new gibi. Sayfaların içi Türkçe
// adlarla çalışır; adres okunurken ve yazılırken bu tabloyla çevrilir. Worker eski Türkçe bağlantıları yeni adrese taşır.
export const AD = { sekme: 'tab', yeni: 'new', musteri: 'customer', mevcut: 'existing', dosya: 'file', t: 'ticket', sayi: 'issue' };
// Değeri çevrilen seçenekler: sekme ve dosya (öteki seçeneklerin değeri kimlik ya da 1'dir)
export const DEGER = {
  yeni: 'new', hepsi: 'all', taslak: 'draft', gonderildi: 'sent', kabul: 'accepted', red: 'rejected',
  erisim: 'access', davet: 'invites', acik: 'open', yanitlandi: 'answered', kapali: 'closed',
  hizmetler: 'services', urunler: 'products', paketler: 'packages', referanslar: 'references', yazilar: 'posts', sss: 'faq', yasal: 'legal',
  kategoriler: 'categories', onay: 'approvals', uyari: 'alerts'
};
const DEGERLI = new Set(['sekme', 'dosya']);
const ters = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [v, k]));
const AD_TR = ters(AD), DEGER_TR = ters(DEGER);

// Türkçe adlı seçenekleri İngilizce adres metnine çevirir: { sekme: 'yeni' } → '?tab=new'
export function adresMetni(o) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(o)) if (v != null && v !== '') p.set(AD[k] || k, DEGERLI.has(k) ? (DEGER[v] || v) : v);
  const s = p.toString();
  return s ? '?' + s : '';
}
// İngilizce adresten Türkçe adla değer okur: tr('sekme', '?tab=new') → 'yeni'
export function adrestenOku(ad, arama) {
  const v = new URLSearchParams(arama).get(AD[ad] || ad);
  return v != null && DEGERLI.has(ad) ? (DEGER_TR[v] || v) : v;
}
// Çapa (#urunler → #products) ve tersi
export const capaEn = (c) => DEGER[c] || c;
export const capaTr = (c) => DEGER_TR[c] || c;
// Eski (Türkçe) seçenekleri İngilizceye çevirir; değişiklik yoksa null döner
export function eskiAramayiCevir(arama) {
  const p = new URLSearchParams(arama), yeni = new URLSearchParams();
  let degisti = false;
  for (const [k, v] of p) {
    const trAd = AD[k] ? k : (AD_TR[k] || k), enAd = AD[trAd] || trAd;
    const trDeger = DEGERLI.has(trAd) ? (DEGER_TR[v] || v) : v, enDeger = DEGERLI.has(trAd) ? (DEGER[trDeger] || trDeger) : v;
    if (enAd !== k || enDeger !== v) degisti = true;
    yeni.append(enAd, enDeger);
  }
  return degisti ? '?' + yeni.toString() : null;
}
