// Sayfa tarafı: ortak aktif müşteri seçimi (1.3; kural src/data/musteri-secim.js). Seçim ortak kabuğun `idx-musteri`
// anahtarındadır (IDOS client_id, ad değil). Üst alandaki seçici (musteri-secici.js) değiştirince ya da başka sekmede
// değişince `document` üzerinde OLAY yayılır; süzülen sayfa veriyi yeniden ister. Seçici panel kabuğu paketinde, sayfa
// betikleri ayrı pakettedir: ortak durum modül değişkeninde değil, depoda ve olayda tutulur.
import { musteriOku, musteriYaz } from '../../idexya-kabuk/kabuk-cekirdek.js';
import { suzmeYolu } from '../../data/musteri-secim.js';

export const OLAY = 'idexya-musteri:degisti';

export function seciliMusteri() {
  try { return musteriOku(localStorage); } catch (e) { return ''; }
}

// Seçimi yazar (boş: kaldırır) ve bu sekmedeki dinleyicilere haber verir. Başka sekmeler `storage` olayıyla öğrenir.
export function musteriSec(id) {
  let k = '';
  try { k = musteriYaz(localStorage, id); } catch (e) { k = ''; }
  document.dispatchEvent(new CustomEvent(OLAY, { detail: { id: k } }));
  return k;
}

export function musteriDegisince(f) {
  document.addEventListener(OLAY, (o) => f((o.detail && o.detail.id) || ''));
}

// API yoluna geçerli seçimi ekler (`?ana=`); süzme sunucuda yapılır.
export const suzulmusYol = (yol) => suzmeYolu(yol, seciliMusteri());

// Seçimden dolayı boş kalan liste: açıklama + seçimi kaldırma yolu. Müşteri adı yazılmaz (ad yalnız seçicide görünür).
export function secimBosDurumu(metin) {
  const kutu = document.createElement('div');
  kutu.className = 'kart bos';
  kutu.setAttribute('data-secim-bos', '');
  kutu.style.cssText = 'display: flex; flex-direction: column; align-items: flex-start; gap: 10px';
  const p = document.createElement('span');
  p.textContent = metin + ' Üst alandaki müşteri seçimi bu sayfayı daraltıyor.';
  const d = document.createElement('button');
  d.type = 'button';
  d.className = 'dugme kucuk';
  d.textContent = 'Tüm müşterileri göster';
  d.addEventListener('click', () => musteriSec(''));
  kutu.append(p, d);
  return kutu;
}
