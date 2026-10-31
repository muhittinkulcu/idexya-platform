// A kuralı (Muhittin): paneldeki her tablo sayfalanır. "Satır sayısı: 5/10/25/50/100/200", varsayılan 5, seçim tablo başına
// bu tarayıcıda hatırlanır; altta "1–5 / 50" aralığı görünür.
// · Sayfalar tüm satırları üretmeye devam eder; arama, sıralama ve toplamlar (tfoot) tüm veri üzerinden hesaplanır.
//   Bu yardımcı yalnız gövdedeki (tbody) satırların görünenini sınırlar.
// · Sayfanın kendisinin gizlediği satırlar (hidden ya da display: none) sayılmaz.
// · Satır sayısı en küçük seçenekten (5) azsa sayfa çubuğu çıkmaz. data-sayfalama="yok" taşıyan tablo atlanır.
// · Tablo yeniden çizilince (yeni tbody ya da satır sayısı değişince) ilk sayfaya dönülür.
import { el } from './ortak.js';

const SECENEK = [5, 10, 25, 50, 100, 200];
const VARSAYILAN = 5;
const durum = new WeakMap();
const sayi = (n) => new Intl.NumberFormat('tr-TR').format(n);

// Tablo başına anahtar: sayfa yolu + data-tablo (varsa) ya da başlık hücrelerinin metni. Sekme/sıra değişse de aynı tablo aynı anahtarı alır.
function anahtar(t) {
  const imza = t.dataset.tablo || [...t.querySelectorAll('thead th')].map((h) => h.textContent.trim()).join('|').slice(0, 200) || 'tablo';
  let h = 0;
  for (let i = 0; i < imza.length; i++) h = (h * 31 + imza.charCodeAt(i)) | 0;
  return 'idx-satir:' + location.pathname + ':' + (h >>> 0).toString(36);
}
function boyOku(t) {
  try { const v = Number(localStorage.getItem(anahtar(t))); return SECENEK.includes(v) ? v : VARSAYILAN; } catch (e) { return VARSAYILAN; }
}
function boyYaz(t, v) { try { localStorage.setItem(anahtar(t), String(v)); } catch (e) {} }

const gorunurSatirlar = (t) => {
  const g = t.tBodies[0];
  return g ? [...g.rows].filter((r) => !r.hidden && r.style.display !== 'none') : [];
};

function cubukKur(t, d) {
  const sec = el('select', { 'aria-label': 'Satır sayısı', onchange: () => { d.boy = Number(sec.value); d.sayfa = 0; boyYaz(t, d.boy); uygula(t); } },
    SECENEK.map((n) => el('option', { value: String(n) }, String(n))));
  const aralik = el('span', { class: 'ts-aralik', 'aria-live': 'polite' });
  const geri = el('button', { type: 'button', class: 'dugme kucuk', 'aria-label': 'Önceki sayfa', onclick: () => { d.sayfa--; uygula(t); } }, '‹');
  const ileri = el('button', { type: 'button', class: 'dugme kucuk', 'aria-label': 'Sonraki sayfa', onclick: () => { d.sayfa++; uygula(t); } }, '›');
  const cubuk = el('div', { class: 'tablo-sayfa', role: 'group', 'aria-label': 'Tablo sayfaları' },
    el('label', {}, el('span', {}, 'Satır sayısı:'), sec), el('span', { class: 'ts-sag' }, aralik, geri, ileri));
  cubuk._tablo = t;
  Object.assign(d, { cubuk, sec, aralik, geri, ileri });
  // Tablo kaydırma sarmalının içindeyse çubuk sarmalın altına konur (yatay kaydırmayla kaymasın).
  const sar = t.parentElement && t.parentElement.children.length === 1 && t.parentElement !== document.body ? t.parentElement : t;
  sar.after(cubuk);
}

function uygula(t) {
  const d = durum.get(t);
  const satir = gorunurSatirlar(t);
  const tumu = t.tBodies[0] ? [...t.tBodies[0].rows] : [];
  if (satir.length <= SECENEK[0]) {
    tumu.forEach((r) => r.removeAttribute('data-sayfa-gizli'));
    if (d.cubuk) { d.cubuk.remove(); d.cubuk = null; }
    return;
  }
  if (!d.cubuk || !d.cubuk.isConnected) cubukKur(t, d);
  const sayfaSayisi = Math.ceil(satir.length / d.boy);
  d.sayfa = Math.min(Math.max(0, d.sayfa), sayfaSayisi - 1);
  const bas = d.sayfa * d.boy, son = Math.min(bas + d.boy, satir.length);
  const goster = new Set(satir.slice(bas, son));
  tumu.forEach((r) => (goster.has(r) || !satir.includes(r) ? r.removeAttribute('data-sayfa-gizli') : r.setAttribute('data-sayfa-gizli', '')));
  d.sec.value = String(d.boy);
  d.aralik.textContent = `${sayi(bas + 1)}–${sayi(son)} / ${sayi(satir.length)}`;
  d.geri.disabled = d.sayfa === 0;
  d.ileri.disabled = d.sayfa >= sayfaSayisi - 1;
}

function tara() {
  // Tablosu sayfadan kalkmış çubuklar temizlenir.
  document.querySelectorAll('.tablo-sayfa').forEach((c) => { if (!c._tablo || !c._tablo.isConnected) c.remove(); });
  document.querySelectorAll('main table').forEach((t) => {
    if (t.dataset.sayfalama === 'yok' || t.closest('[data-sayfalama="yok"]')) return;
    let d = durum.get(t);
    const govde = t.tBodies[0] || null, adet = gorunurSatirlar(t).length;
    if (!d) { d = { boy: boyOku(t), sayfa: 0 }; durum.set(t, d); }
    // Satırlar aynı gövdede yeniden çizilse de (yeni tr öğeleri) sayfalama yeniden uygulanır; sayfa yalnız veri değişince başa döner.
    if (d.govde !== govde || d.adet !== adet) d.sayfa = 0;
    d.govde = govde; d.adet = adet;
    uygula(t);
  });
}

let bekleyen = false;
export function tabloSayfalama() {
  const izle = () => { if (bekleyen) return; bekleyen = true; requestAnimationFrame(() => { bekleyen = false; tara(); }); };
  const kok = document.querySelector('main') || document.body;
  // Yalnız yapı (satır ekleme/çıkarma) ve satırların hidden/style değişimi izlenir; çubuğun kendi data-sayfa-gizli yazımı tetiklemez.
  new MutationObserver(izle).observe(kok, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'style'] });
  tara();
}
