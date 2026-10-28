// Duyuru/kampanya seçimi (Muhittin, 28 Eki 2026). Tarih süzgeci derlemede ve ziyaretçinin tarayıcısında tekrar uygulanır
// (site statik olduğu için bitiş tarihi geçen kampanya, yeniden yayın beklemeden tarayıcıda gizlenir).
import duyurular from './duyurular.json';
export const DUYURU = duyurular;
const bugun = () => new Date(Date.now() + 3 * 3600000).toISOString().slice(0, 10);
export const tarihteMi = (x, g = bugun()) => (!x.bitis || x.bitis >= g);
// Sayfa eşleşmesi: "sayfalar" boşsa her sayfa; "/tr/hizmet/*" önek, diğerleri tam adres (sondaki / önemsiz).
export function sayfadaMi(k, yol) {
  const l = String(k.sayfalar || '').split(',').map((x) => x.trim()).filter(Boolean);
  if (!l.length) return true;
  const y = yol.replace(/\/$/, '') || '/';
  return l.some((d) => (d.endsWith('*') ? y.startsWith(d.slice(0, -1).replace(/\/$/, '')) : (d.replace(/\/$/, '') || '/') === y));
}
export const kampanyalar = (konum, yol) => DUYURU.kampanyalar.filter((k) => k.aktif && k[konum] && tarihteMi(k) && (!yol || sayfadaMi(k, yol)));
