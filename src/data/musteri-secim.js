// Tek müşteri seçimi (1.3, Muhittin 18 Kas 2026; seçenek A): üç modül aynı aktif müşteriyi ortak kabuğun `idx-musteri`
// anahtarında paylaşır (değer IDOS `client_id`). Website ve CRM'de üst alanda bir müşteri seçiliyken yalnız o müşteriye
// bağlı CRM kartları (`musteriler.ana_kayit_id`) ve o müşterinin site verisi görünür; seçim kaldırılınca hepsi görünür.
// Bu dosya saf işlevlerdir (DOM yok): Worker (sorgu parametresi), panel betikleri ve testler aynı kuralı kullanır.
import { musteriKimligi } from '../idexya-kabuk/kabuk-cekirdek.js';

// Sunucu uçları seçimi `?ana=<IDOS client_id>` ile alır. Geçersiz değer yok sayılır (süzgeçsiz liste).
export const ANA_PARAM = 'ana';
export const anaParam = (url) => musteriKimligi(url && url.searchParams ? url.searchParams.get(ANA_PARAM) || '' : '');

// API yoluna seçimi ekler: ('musteriler?arsiv=1', 'c1') → 'musteriler?arsiv=1&ana=c1'. Seçim yoksa yol aynen döner.
export function suzmeYolu(yol, id) {
  const k = musteriKimligi(id);
  if (!k) return yol;
  return yol + (yol.includes('?') ? '&' : '?') + ANA_PARAM + '=' + encodeURIComponent(k);
}

// Seçicinin listesi: `ana_musteri` önbelleğinden gelen kayıtlar ({ id, ad, durum }). Varsayılan yalnız aktif müşteriler
// (pasif/arşiv kuralı, 18 Kas 2026); seçili müşteri aktif değilse yine listede kalır (IDOS'ta pasif seçilmiş olabilir).
// Arama Türkçe küçük harfle, adın içinde geçer. Sıra Türkçe alfabe.
const kucuk = (x) => String(x == null ? '' : x).toLocaleLowerCase('tr-TR');
export function seciciListesi(liste, secili = '', sorgu = '') {
  const q = kucuk(sorgu).trim();
  return (Array.isArray(liste) ? liste : [])
    .filter((m) => m && musteriKimligi(m.id) && (m.durum === 'aktif' || m.id === secili) && (!q || kucuk(m.ad).includes(q)))
    .sort((a, b) => String(a.ad || '').localeCompare(String(b.ad || ''), 'tr'));
}

// Saklanan seçim listede yoksa yok sayılır. Liste alınamadıysa (null) karar verilmez: seçim olduğu gibi kalır
// (başka modül aynı anahtarı kullanır; ağ hatası seçimi silmemeli).
export function gecerliSecim(id, liste) {
  const k = musteriKimligi(id);
  if (!k) return '';
  if (!Array.isArray(liste)) return k;
  return liste.some((m) => m && m.id === k) ? k : '';
}

// Seçimde CRM kartı süzme kuralı (istemci yedeği ve test): seçim yoksa hepsi, varsa yalnız ana kaydı eşleşen kartlar.
// Bağsız kartlar (ana_kayit_id boş) seçim varken gizlenir, silinmez.
export const kartSuz = (kartlar, id) => {
  const k = musteriKimligi(id);
  return (Array.isArray(kartlar) ? kartlar : []).filter((x) => !k || (x && x.ana_kayit_id === k));
};
