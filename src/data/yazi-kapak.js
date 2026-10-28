// Blog yazılarının kapak çizimi (KapakGorsel 'd:<çizim>'); yazilar.json'da "kapak" alanı varsa o kullanılır.
const KAPAK = { 'performans-ve-hiz-odakli-reklam-optimizasyon-modeli': 'birlesik', 'donusum-degeri-odakli-e-ticaret-donusum-modeli': 'analitik', 'e-ticaret-danismanligi-ile-dogru-karari-verin': 'yonetim' };
const KATEGORI = { Reklam: 'birlesik', 'E-ticaret': 'pazaryeri', 'Ölçüm': 'analitik', SEO: 'seo' };
export const yaziKapak = (y) => y.kapak || KAPAK[y.slug] || KATEGORI[y.kategori] || 'birlesik';
export const okumaDakika = (y) => Math.max(1, Math.round(String(y.govde).split(/\s+/).filter(Boolean).length / 200));
