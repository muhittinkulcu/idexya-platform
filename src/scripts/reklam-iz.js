// Reklam tıklama kimlikleri (gclid, gbraid, wbraid, fbclid) ve UTM bilgisi. YALNIZ pazarlama çerezlerine izin verildiyse
// tarayıcıda (localStorage "idx-reklam") 90 gün saklanır; izin yoksa ya da geri alınırsa silinir. Form gönderildiğinde
// talebe eklenir ve CRM'de "Kazanıldı" olan talepler reklam platformlarına çevrimdışı dönüşüm olarak bildirilebilir.
const ANAHTAR = 'idx-reklam', SURE = 90 * 86400000;
const ALANLAR = ['gclid', 'gbraid', 'wbraid', 'fbclid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
let bekleyen = null;

const izinVar = () => !!(window.idxOnay && window.idxOnay.pazarlama);
function sil() { try { localStorage.removeItem(ANAHTAR); } catch (e) { /* depolama kapalı */ } }
function kaydet() {
  if (!bekleyen || !izinVar()) return;
  try { localStorage.setItem(ANAHTAR, JSON.stringify(bekleyen)); } catch (e) { /* depolama kapalı */ }
  bekleyen = null;
}

// Sayfa açılışında adres satırındaki parametreler bellekte tutulur; izin gelirse (aynı sayfada) kaydedilir.
export function reklamIzBaslat() {
  const p = new URLSearchParams(location.search), v = {};
  for (const k of ALANLAR) { const d = p.get(k); if (d) v[k] = d.slice(0, 300); }
  if (Object.keys(v).length) bekleyen = { ...v, zaman: Date.now() };
  window.addEventListener('idx-onay', (o) => { if (o.detail && o.detail.pazarlama) kaydet(); else { bekleyen = null; sil(); } });
}

// Forma eklenecek bilgi: izin yoksa ya da süre dolduysa null.
export function reklamBilgisi() {
  if (!izinVar()) return null;
  kaydet();
  try {
    const v = JSON.parse(localStorage.getItem(ANAHTAR) || 'null');
    if (!v || Date.now() - v.zaman > SURE) { sil(); return null; }
    return v;
  } catch (e) { return null; }
}
