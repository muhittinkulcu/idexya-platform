// Ortak kabuğu (<idexya-kabuk>, src/idexya-kabuk) panele bağlar. Kabuğun kendisi burada değişmez; idexya-ortak'tan eşitlenir.
// Bu dosya kabukla birlikte klasik betik olarak <head>'de çalışır (public/panel-kabuk.js, tools/panel-kabuk.mjs): kabuk,
// ayrıştırıcı <idexya-kabuk> öğesini kapatır kapatmaz, ilk boyamadan önce kurulur; sayfa hiçbir karede kabuksuz çizilmez.
// Bu yüzden üst düzeyde sayfa DOM'una dokunulmaz; işler kabuğun olaylarında ve DOMContentLoaded'da yapılır:
//   1. idexya-kabuk:kur (kurulumdan hemen önce): etkin sayfa adresi (?tab= ve #bölüm dahil), oturumdaki kullanıcı ve bu
//      oturumda son alınan özetten rozetler ve eşitleme durumu ayar bloğuna yazılır; kabuk ilk çiziminde son hâliyle görünür.
//   2. idexya-kabuk:hazir: sayfa içi sekmeler adresi değiştirdikçe etkinYap; taze özetle rozetler, kullanıcı ve durum.
// Sunucudan gelen her metin kabukta textContent ile yazılır.
import { api, genelHata, sayacGuncelle, rozetSayilari, saklananVeri, tarih, yol, panelYolu, TEMEL } from './ortak.js';
import { metaOku } from '../../data/temel-yol.js';

let ayar = null, katman = null, sonUrl = null;
// Menüdeki adresler ve menünün kullandığı adres seçenekleri (tab, file). Sekme ve vurgu yalnız menü adresine bağlanır:
// ?id= gibi kayıt seçimleri yeni sekme açmaz (üye, yazı, teklif seçmek "Üyeler" sekmesinde kalır).
const MENU_URL = new Set();
const MENU_PARAM = new Set();
const ALT_AD = new Map();

// Eski /yonetim/<sayfa>/ adresi panel adresine çevrilir (/leads).
const yolAl = () => location.pathname.replace(/^\/yonetim\/([a-z-]+)\/?$/, '/$1').replace(/(.)\/$/, '$1');
function etkinAdres() {
  const y = yolAl(), ara = location.search, bolum = location.hash;
  const p = new URLSearchParams();
  new URLSearchParams(ara).forEach((v, k) => { if (MENU_PARAM.has(k)) p.set(k, v); });
  const mp = p.toString() ? '?' + p : '';
  for (const u of [y + ara + bolum, y + ara, y + mp + bolum, y + mp, y]) if (MENU_URL.has(u)) return { url: u, menude: true };
  return { url: y + ara, menude: false };
}
// Menüde olmayan sayfa (ör. müşteri kartı) sekmede sayfanın genel adıyla görünür; kayıt adı (müşteri, kişi) sekmeye konmaz.
function etkin() {
  const a = etkinAdres(), sargi = document.querySelector('.yonetim');
  return { modulUrl: ayar.etkin && ayar.etkin.modulUrl, sayfaUrl: a.url, ad: a.menude ? '' : (sargi && sargi.dataset.sayfaAdi) || '' };
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

const durumOzet = (o) => { const son = o.reklam && o.reklam.son; return { baglanti: true, esitleme: son && son.durum === 'tamam' ? tarih(son.zaman) : '' }; };

document.addEventListener('idexya-kabuk:kur', () => {
  const AYAR = document.getElementById('idexya-kabuk-ayar');
  try { ayar = JSON.parse(AYAR ? AYAR.textContent : 'null'); } catch (e) { ayar = null; }
  katman = ayar && Array.isArray(ayar.katmanlar) ? ayar.katmanlar.find((k) => k.anahtar === ayar.katman) : null;
  if (!ayar || !katman || !AYAR) return;
  // Temel yol (os.idexya.com/website): bu katmanın kök göreli adresleri önekli olur. Diğer katmanların tam adresleri ve
  // çıkış adresi (/cdn-cgi/access/logout, Access'in alan kökündeki ucu) aynen kalır. Önek boşsa hiçbir şey değişmez.
  if (TEMEL) {
    katman.url = yol(katman.url);
    katman.gruplar.forEach((g) => g.moduller.forEach((m) => { m.url = yol(m.url); m.sayfalar.forEach((s) => { s.url = yol(s.url); }); }));
    (ayar.eylemler || []).forEach((e) => { if (e) e.url = yol(e.url); });
    if (ayar.bildirimUrl) ayar.bildirimUrl = yol(ayar.bildirimUrl);
    if (ayar.etkin) ['modulUrl', 'sayfaUrl'].forEach((k) => { if (ayar.etkin[k]) ayar.etkin[k] = yol(ayar.etkin[k]); });
  }
  katman.gruplar.forEach((g) => g.moduller.forEach((m) => {
    MENU_URL.add(m.url);
    m.sayfalar.forEach((s) => { MENU_URL.add(s.url); if (s.url !== m.url) ALT_AD.set(s.url, s.ad); });
  }));
  MENU_URL.forEach((u) => new URL(u, location.origin).searchParams.forEach((v, k) => MENU_PARAM.add(k)));
  ayar.etkin = etkin();
  // Oturumdaki kullanıcı (Worker'ın yazdığı meta) ve bu oturumda son alınan özet: profil, rozetler ve durum ilk çizimde doğru.
  const kim = metaOku('idexya-kullanici');
  if (kim) ayar.kullanici = { ad: kim, rol: 'Panel yöneticisi' };
  const eski = saklananVeri('ozet');
  if (eski) {
    ayar.durum = durumOzet(eski);
    const rozet = new Map(rozetSayilari(eski));
    katman.gruplar.forEach((g) => g.moduller.forEach((m) => { if (rozet.get(m.url)) m.rozet = rozet.get(m.url); }));
  }
  AYAR.textContent = JSON.stringify(ayar).replace(/</g, '\\u003c');
  sonUrl = ayar.etkin.sayfaUrl;
  altBaslikYaz(sonUrl);
}, { once: true });

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

  // Taze özet: rozetler (talep, yorum, üye, destek), oturumdaki kullanıcı ve son reklam verisi eşitlemesi.
  // Alınamazsa eski değer taze gibi bırakılmaz: rozetler kalkar, durum "bağlantı yok/bilinmiyor" olur.
  api('ozet').then((o) => {
    sayacGuncelle(o);
    if (o.kim) kabuk.kullaniciYap({ ad: o.kim, rol: 'Panel yöneticisi' });
    kabuk.durumYap(durumOzet(o));
  }).catch((h) => {
    sayacGuncelle(null);
    kabuk.durumYap({ baglanti: h.durum === 401 ? null : false, esitleme: '' });
    if (h.durum === 401) genelHata('Oturumunuz kapanmış. Sayfayı yenileyip yeniden giriş yapın.');
  });
}, { once: true });

// Sayfa eylem çubuğu: Yenile, Yazdır ve "+ Yeni oluştur" menüsü (dışarı tıklama ve Esc kapatır).
function eylemCubugu() {
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
  if (yeniIstek && !panelYolu().startsWith('/proposals')) {
    let deneme = 0;
    const bas = () => {
      const d = document.querySelector('.ik-icerik [data-yeni], .ik-icerik [data-yeni-ac]') || [...document.querySelectorAll('.sayfa button')].filter((b) => /^\+ Yeni /.test(b.textContent || '')).pop();
      if (d) { d.click(); d.scrollIntoView({ block: 'center' }); return; }
      if (++deneme < 40) setTimeout(bas, 150);
    };
    setTimeout(bas, 200);
  }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', eylemCubugu, { once: true });
else eylemCubugu();

// PWA: service worker yalnız panel alan adında kaydedilir (idexya.com sitesine karışmaz). Kabuk varlıklarını saklar, veriyi saklamaz.
if ('serviceWorker' in navigator && /^panel\.(idexya\.com|localhost)$/.test(location.hostname)) {
  addEventListener('load', () => { navigator.serviceWorker.register('/panel-sw.js', { scope: '/' }).catch(() => {}); });
}
