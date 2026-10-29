// Genel bakış · Reklam performansı: IDOS'tan günde bir kez çekilen özet (/api/yonetim/reklam). Rakam yoksa rakam gösterilmez.
// Toplamlar yalnız TRY hesaplarından yapılır; başka para birimindeki hesaplar ayrı belirtilir, kura çevrilmez.
import { api, el, tarih, once, genelHata } from './ortak.js';
import { kpiKart, yiginCiz, gunler } from './grafik.js';
import { reklamTablosu } from './reklam-tablo.js';

const SONUC_ADI = { messaging_conversations: 'Mesaj görüşmesi', purchases: 'Satın alma', conversions: 'Google dönüşümü', leads: 'Potansiyel müşteri', calls: 'Arama' };
const PLATFORM = { meta: { ad: 'Meta', renk: 'var(--s2)' }, google: { ad: 'Google Ads', renk: 'var(--s3)' } };
const sayi = (n, k = 0) => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: k }).format(n);
const tl = (n) => sayi(Math.round(n)) + ' TL';
const sonucAdi = (k) => SONUC_ADI[k] || k.replace(/_/g, ' ');

export function reklamBolumu(kok) {
  const $ = (s) => kok.querySelector(s);
  const durum = $('[data-reklam-durum]'), govde = $('[data-reklam-govde]'), not = $('[data-reklam-not]'), cek = $('[data-reklam-cek]');
  const cip = (sinif, metin) => { durum.className = 'cip ' + sinif; durum.textContent = metin; };
  const bekleyen = (baslik, metin) => govde.replaceChildren(el('div', { class: 'bekleyen-kutu' }, el('b', { style: 'color: var(--head)' }, baslik), el('span', { style: 'max-width: 560px' }, metin)));

  async function yukle() {
    let r;
    try { r = await api('reklam'); } catch (h) { cip('spam', 'Alınamadı'); bekleyen('Reklam verisi şu an alınamadı', h.message); return; }
    cek.hidden = !r.kurulu;
    if (!r.kurulu) {
      cip('gorusme', 'IDOS bağlantısı bekleniyor');
      bekleyen('Harcama ve sonuçlar IDOS’tan gelecek', 'Meta ve Google Ads verisi IDOS’un BigQuery özetinden yalnız okunarak, günde bir kez alınacak. Bağlantı ayarları henüz girilmedi; şu an hiçbir rakam gösterilmiyor.');
      not.textContent = ''; return;
    }
    const son = r.sonCekim, basarili = r.sonBasarili;
    const hataVar = son && son.durum === 'hata';
    if (!basarili) {
      cip(hataVar ? 'spam' : 'gorusme', hataVar ? 'Çekim başarısız' : 'İlk çekim bekleniyor');
      bekleyen(hataVar ? 'Son çekim başarısız oldu' : 'Bağlantı kuruldu, ilk çekim bekleniyor', hataVar ? son.mesaj : 'Veri her gün İstanbul saatiyle 10.00’da çekilir. Hemen görmek için “Şimdi çek”.');
      not.textContent = ''; return;
    }
    cip(hataVar ? 'spam' : 'crm', hataVar ? 'Son çekim başarısız · eski veri' : 'Güncel');
    ciz(r, hataVar ? son : null);
    not.textContent = `Kaynak: IDOS BigQuery (yalnız okuma) · son başarılı çekim ${tarih(basarili.zaman)} (${once(basarili.zaman)}) · ${sayi(basarili.satir)} satır · grafik son 28 gün, bugün hariç · ilişkilendirme ayarı IDOS’ta tutulmadığı için bilinmiyor`;
  }

  function ciz(r, sonHata) {
    const dun = gunler(r.bugun, 2)[0];
    const g28 = gunler(dun, 28), g14 = gunler(dun, 14), simdi7 = g14.slice(7), once7 = g14.slice(0, 7);
    const tr = r.gunluk.filter((x) => x.para === 'TRY');
    const digerPara = [...new Set(r.gunluk.filter((x) => x.para !== 'TRY').map((x) => x.para))];
    const topla = (liste, alan, gunListe, platform) => liste.filter((x) => gunListe.includes(x.gun) && (!platform || x.platform === platform)).reduce((s, x) => s + (x[alan] || 0), 0);
    // Sonuç türleri: satır satır JSON; 7 günlük toplamlar
    const sonuc = (gunListe) => { const t = {}; r.satirlar.filter((x) => x.para === 'TRY' && gunListe.includes(x.gun) && x.sonuclar).forEach((x) => { for (const [k, v] of Object.entries(JSON.parse(x.sonuclar))) t[k] = (t[k] || 0) + v; }); return t; };
    const s7 = sonuc(simdi7), so7 = sonuc(once7);
    // Sonuç başına maliyet gösterilmez: görünümde kampanya amacı yok; hesabın tüm harcamasını tek bir sonuç türüne bölmek yanıltır.
    const turler = Object.keys(s7).sort((a, b) => s7[b] - s7[a]).slice(0, 3);
    const harcamaGun = Object.fromEntries(g28.map((gun) => [gun, topla(tr, 'harcama', [gun])]));
    const kartlar = [
      kpiKart({ ad: 'Harcama · 7 gün (TRY)', deger: Math.round(topla(tr, 'harcama', simdi7)), onceki: Math.round(topla(tr, 'harcama', once7)), metin: tl(topla(tr, 'harcama', simdi7)), seri: g28.map((gun) => harcamaGun[gun]), alt: 'önceki 7 güne göre', notr: true }),
      kpiKart({ ad: 'Gösterim · 7 gün', deger: topla(tr, 'gosterim', simdi7), onceki: topla(tr, 'gosterim', once7), alt: 'önceki 7 güne göre', notr: true }),
      kpiKart({ ad: 'Tıklama · 7 gün', deger: topla(tr, 'tiklama', simdi7), onceki: topla(tr, 'tiklama', once7), alt: 'önceki 7 güne göre', notr: true }),
      ...turler.map((k) => kpiKart({ ad: sonucAdi(k) + ' · 7 gün', deger: Math.round(s7[k]), onceki: Math.round(so7[k] || 0), metin: sayi(s7[k], 1), alt: 'önceki 7 güne göre', notr: true }))
    ];
    const uyari = [];
    if (sonHata) uyari.push(el('div', { class: 'uyari hata' }, el('b', {}, 'Son çekim başarısız: '), sonHata.mesaj, ' Aşağıdaki rakamlar önceki başarılı çekime ait.'));
    if (digerPara.length) uyari.push(el('div', { class: 'uyari bilgi' }, `${digerPara.join(', ')} para birimindeki hesaplar toplamlara katılmadı (kura çevrilmez); ayrıntı tablosunda kendi para birimiyle görünür.`));

    // Platforma göre günlük harcama
    const seriler = Object.entries(PLATFORM).map(([k, p]) => ({ ad: p.ad, renk: p.renk, degerler: Object.fromEntries(g28.map((gun) => [gun, topla(tr, 'harcama', [gun], k)])) }));
    const alan = el('div', { class: 'cubuk-alan', style: 'height: 180px' }), x = el('div', { class: 'x-eksen' });
    const lejant = el('div', { class: 'lejant' }, ...seriler.map((sr) => el('span', {}, el('i', { style: `background: ${sr.renk}` }), `${sr.ad} `, el('b', { style: 'color: var(--head)' }, tl(Object.values(sr.degerler).reduce((a, b) => a + b, 0))))), el('span', { style: 'color: var(--tx2)' }, '28 gün · TRY'));

    govde.replaceChildren(...uyari, el('div', { class: 'kpi-sira' }, ...kartlar), lejant, el('div', {}, alan, x), el('h3', { style: 'margin: 6px 0 0; font-size: 15px; color: var(--head); font-weight: 700' }, 'Hesap ayrıntıları'), reklamTablosu(r, yukle));
    yiginCiz(alan, x, g28, seriler, tl);
  }

  cek.addEventListener('click', async () => {
    cek.disabled = true; cek.textContent = 'Çekiliyor…';
    genelHata('');
    try { const s = await api('reklam/cek', {}); cek.textContent = `${sayi(s.satir)} satır alındı`; }
    catch (h) { cek.textContent = 'Şimdi çek'; genelHata(h.message); }
    finally { cek.disabled = false; setTimeout(() => { cek.textContent = 'Şimdi çek'; }, 4000); yukle(); }
  });
  yukle();
}
