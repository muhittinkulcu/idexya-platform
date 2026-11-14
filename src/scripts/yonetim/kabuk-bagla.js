// Ortak kabuğu (<idexya-kabuk>, src/idexya-kabuk) panele bağlar. Kabuğun kendisi burada değişmez; idexya-ortak'tan eşitlenir.
// Yonetim.astro bu dosyayı kabuk.js'den ÖNCE içe aktarır (ES modülleri sırayla çalışır):
//   1. Kabuk kurulmadan önce etkin sayfa adresi (?tab= ve #bölüm dahil) ayar bloğuna yazılır; ilk sekme doğru adresle açılır.
//   2. Kabuk hazır olunca: sayfa içi sekmeler adresi değiştirdikçe etkinYap, rozetler, kullanıcı ve eşitleme durumu.
// Sunucudan gelen her metin kabukta textContent ile yazılır.
import { api, genelHata, sayacGuncelle, tarih } from './ortak.js';

const AYAR = document.getElementById('idexya-kabuk-ayar');
const SARGI = document.querySelector('.yonetim');
let ayar = null;
try { ayar = JSON.parse(AYAR ? AYAR.textContent : 'null'); } catch (e) { ayar = null; }
const katman = ayar && Array.isArray(ayar.katmanlar) ? ayar.katmanlar.find((k) => k.anahtar === ayar.katman) : null;

// Menüdeki adresler ve menünün kullandığı adres seçenekleri (tab, file). Sekme ve vurgu yalnız menü adresine bağlanır:
// ?id= gibi kayıt seçimleri yeni sekme açmaz (üye, yazı, teklif seçmek "Üyeler" sekmesinde kalır).
const MENU_URL = new Set();
const MENU_PARAM = new Set();
const ALT_AD = new Map();
(katman ? katman.gruplar : []).forEach((g) => g.moduller.forEach((m) => {
  MENU_URL.add(m.url);
  m.sayfalar.forEach((s) => { MENU_URL.add(s.url); if (s.url !== m.url) ALT_AD.set(s.url, s.ad); });
}));
MENU_URL.forEach((u) => new URL(u, location.origin).searchParams.forEach((v, k) => MENU_PARAM.add(k)));

// Eski /yonetim/<sayfa>/ adresi panel adresine çevrilir (/leads).
const yolAl = () => location.pathname.replace(/^\/yonetim\/([a-z-]+)\/?$/, '/$1').replace(/(.)\/$/, '$1');
function etkinAdres() {
  const yol = yolAl(), ara = location.search, bolum = location.hash;
  const p = new URLSearchParams();
  new URLSearchParams(ara).forEach((v, k) => { if (MENU_PARAM.has(k)) p.set(k, v); });
  const mp = p.toString() ? '?' + p : '';
  for (const u of [yol + ara + bolum, yol + ara, yol + mp + bolum, yol + mp, yol]) if (MENU_URL.has(u)) return { url: u, menude: true };
  return { url: yol + ara, menude: false };
}
// Menüde olmayan sayfa (ör. müşteri kartı) sekmede sayfanın genel adıyla görünür; kayıt adı (müşteri, kişi) sekmeye konmaz.
function etkin() {
  const a = etkinAdres();
  return { modulUrl: ayar.etkin && ayar.etkin.modulUrl, sayfaUrl: a.url, ad: a.menude ? '' : (SARGI && SARGI.dataset.sayfaAdi) || '' };
}

if (ayar && katman && AYAR) {
  ayar.etkin = etkin();
  AYAR.textContent = JSON.stringify(ayar).replace(/</g, '\\u003c');
}

// Başlığın yanındaki alt sayfa adı (Talepler · Yeni). Alt sayfa modülün kendi adresiyse ya da başlıkla aynıysa yazılmaz.
function altBaslikYaz(url) {
  const alt = document.querySelector('[data-alt-baslik]'), bas = document.querySelector('h1 [data-baslik]');
  if (!alt) return;
  const ad = ALT_AD.get(url) || '';
  const goster = !!ad && (!bas || bas.textContent.trim() !== ad);
  alt.hidden = !goster;
  alt.textContent = goster ? ' · ' + ad : '';
}

let sonUrl = ayar && ayar.etkin ? ayar.etkin.sayfaUrl : null;
altBaslikYaz(sonUrl);

document.addEventListener('idexya-kabuk:hazir', (olay) => {
  const kabuk = olay.target;
  if (!ayar || !katman) return;
  // Sayfa içi sekmeler adresi history.replaceState ile değiştirir: yan menü vurgusu ve sayfa sekmesi izler.
  const guncelle = () => {
    const e = etkin();
    if (e.sayfaUrl === sonUrl) return;
    sonUrl = e.sayfaUrl;
    kabuk.etkinYap(e);
    altBaslikYaz(e.sayfaUrl);
  };
  for (const ad of ['replaceState', 'pushState']) {
    const asil = history[ad].bind(history);
    history[ad] = (...a) => { const r = asil(...a); try { guncelle(); } catch (h) { /* kabuk hatası sayfayı durdurmaz */ } return r; };
  }
  addEventListener('popstate', guncelle);
  addEventListener('hashchange', guncelle);

  // Rozetler (talep, yorum, üye, destek), oturumdaki kullanıcı ve son reklam verisi eşitlemesi.
  api('ozet').then((o) => {
    sayacGuncelle(o);
    if (o.kim) kabuk.kullaniciYap({ ad: o.kim, rol: 'Panel yöneticisi' });
    const son = o.reklam && o.reklam.son;
    kabuk.durumYap({ baglanti: true, esitleme: son && son.durum === 'tamam' ? tarih(son.zaman) : '' });
  }).catch((h) => {
    sayacGuncelle(null);
    kabuk.durumYap({ baglanti: h.durum === 401 ? null : false });
    if (h.durum === 401) genelHata('Oturumunuz kapanmış. Sayfayı yenileyip yeniden giriş yapın.');
  });
}, { once: true });

// Sayfa eylem çubuğu: Yenile, Yazdır ve "+ Yeni oluştur" menüsü (dışarı tıklama ve Esc kapatır).
const yenile = document.querySelector('[data-yenile]');
if (yenile) yenile.addEventListener('click', () => location.reload());
const yazdir = document.querySelector('[data-yazdir]');
if (yazdir) yazdir.addEventListener('click', () => print());
const yeniMenu = document.querySelector('[data-yeni-menu]');
if (yeniMenu) {
  document.addEventListener('click', (o) => { if (yeniMenu.open && !yeniMenu.contains(o.target)) yeniMenu.open = false; });
  yeniMenu.addEventListener('keydown', (o) => { if (o.key === 'Escape' && yeniMenu.open) { yeniMenu.open = false; yeniMenu.querySelector('summary').focus(); } });
  // Bazı sayfalar adres çubuğunu yeniden yazdığı için "yeni" isteği oturumda da tutulur.
  yeniMenu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => { try { if (a.search.includes('new=1')) sessionStorage.setItem('idx-yeni', a.pathname); } catch (e) { /* gizli kip */ } }));
}
// ?new=1 ile açılan sayfada o sayfanın "yeni" düğmesine basılır (Teklifler kendi akışını yürütür).
let yeniIstek = new URLSearchParams(location.search).get('new') === '1';
try { if (sessionStorage.getItem('idx-yeni') === location.pathname) yeniIstek = true; sessionStorage.removeItem('idx-yeni'); } catch (e) { /* gizli kip */ }
if (yeniIstek && !location.pathname.startsWith('/proposals')) {
  let deneme = 0;
  const bas = () => {
    const d = document.querySelector('.ik-icerik [data-yeni], .ik-icerik [data-yeni-ac]') || [...document.querySelectorAll('.sayfa button')].filter((b) => /^\+ Yeni /.test(b.textContent || '')).pop();
    if (d) { d.click(); d.scrollIntoView({ block: 'center' }); return; }
    if (++deneme < 40) setTimeout(bas, 150);
  };
  setTimeout(bas, 200);
}

// PWA: service worker yalnız panel alan adında kaydedilir (idexya.com sitesine karışmaz). Kabuk varlıklarını saklar, veriyi saklamaz.
if ('serviceWorker' in navigator && /^panel\.(idexya\.com|localhost)$/.test(location.hostname)) {
  addEventListener('load', () => { navigator.serviceWorker.register('/panel-sw.js', { scope: '/' }).catch(() => {}); });
}
