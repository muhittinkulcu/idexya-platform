// Banner stüdyosu (Muhittin, 28 Eki 2026): duyuru şeritleri, görsel bannerlar, açılır pencereler ve köşe kutuları.
// Bannerlar D1'de tutulur ve siteye canlı servis edilir (/api/bannerlar); panelde yapılan değişiklik yeniden derleme
// gerektirmez. Gösterim/tıklama/kapatma sayıları günlük toplam olarak tutulur; ziyaretçiye ait hiçbir kimlik saklanmaz.
import { json, hata, simdi, kimlik, kirp, islemYaz } from './ortak.js';

export const TURLER = {
  serit: { ad: 'Duyuru şeridi', konumlar: ['ust-en', 'ust-menu-alti', 'footer-ustu', 'alt-sabit'] },
  gorsel: { ad: 'Görsel banner', konumlar: ['ana-acilis-alti', 'icerik-basi', 'icerik-sonu', 'blog-yan'] },
  popup: { ad: 'Açılır pencere', konumlar: ['popup'] },
  kose: { ad: 'Köşe kutusu', konumlar: ['kose-sag', 'kose-sol'] }
};
const DURUMLAR = ['taslak', 'yayinda', 'duraklatildi', 'arsiv'];
const EYLEMLER = ['bag', 'yeni-sekme', 'talep-analiz', 'talep-teklif', 'whatsapp', 'telefon', 'kod-kopyala', 'yok'];
const TEMALAR = ['lacivert', 'turuncu', 'acik', 'koyu', 'degrade', 'ozel'];
const RENK = /^#[0-9a-fA-F]{6}$/;
const URL_DESEN = /^(https:\/\/[^\s<>"']{1,500}|\/[^\s<>"']{0,500})$/;
const TARIH = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const SAAT = /^\d{2}:\d{2}$/;
const sec = (v, liste, varsayilan) => (liste.includes(v) ? v : varsayilan);
const sayi = (v, alt, ust, varsayilan) => { const n = Number(v); return Number.isFinite(n) ? Math.min(ust, Math.max(alt, Math.round(n))) : varsayilan; };

// Panelden gelen ayarı izinli alanlara indirger. Ham HTML hiçbir alanda kabul edilmez (sitede textContent ile yazılır).
export function ayarTemizle(tur, a = {}) {
  const t = TURLER[tur];
  const d = a.dugme || {}, ts = a.tasarim || {}, hd = a.hedef || {}, z = a.zaman || {}, tg = a.tetik || {};
  const eylem = sec(d.eylem, EYLEMLER, 'yok');
  let hedefUrl = kirp(d.hedef, 500).trim();
  if ((eylem === 'bag' || eylem === 'yeni-sekme') && !URL_DESEN.test(hedefUrl)) hedefUrl = '';
  if (eylem === 'telefon') hedefUrl = hedefUrl.replace(/[^\d+]/g, '').slice(0, 20);
  if (eylem === 'whatsapp') hedefUrl = hedefUrl.replace(/\D/g, '').slice(0, 15);
  return {
    konum: sec(a.konum, t.konumlar, t.konumlar[0]),
    mod: sec(a.mod, ['kayan', 'sabit', 'donen'], 'sabit'),
    hiz: sec(a.hiz, ['yavas', 'normal', 'hizli'], 'normal'),
    ogeler: (Array.isArray(a.ogeler) ? a.ogeler : []).slice(0, 8).map((o) => ({ metin: kirp(o && o.metin, 180).trim(), ikon: kirp(o && o.ikon, 8) })).filter((o) => o.metin),
    etiket: kirp(a.etiket, 30), baslik: kirp(a.baslik, 120), metin: kirp(a.metin, 400),
    gorsel: URL_DESEN.test(String(a.gorsel || '')) ? kirp(a.gorsel, 500) : '', gorselAlt: kirp(a.gorselAlt, 160),
    kapak: sec(a.kapak, ['', 'arama', 'sosyal', 'analitik', 'konsol', 'etiket', 'magaza', 'pazaryeri', 'yonetim', 'birlesik', 'site', 'seo', 'icerik'], ''),
    dugme: { metin: kirp(d.metin, 40), eylem, hedef: hedefUrl },
    tumuTiklanir: !!a.tumuTiklanir,
    kapatilabilir: a.kapatilabilir !== false,
    kapatmaSuresi: sec(a.kapatmaSuresi, ['oturum', '1g', '7g', '30g', 'kalici'], '7g'),
    tasarim: {
      tema: sec(ts.tema, TEMALAR, 'lacivert'),
      arka: RENK.test(ts.arka || '') ? ts.arka : '#002559', yazi: RENK.test(ts.yazi || '') ? ts.yazi : '#FFFFFF', vurgu: RENK.test(ts.vurgu || '') ? ts.vurgu : '#F07A23',
      hizala: sec(ts.hizala, ['sol', 'orta'], 'orta'), boyut: sec(ts.boyut, ['kompakt', 'normal', 'buyuk'], 'normal'),
      ikon: kirp(ts.ikon, 8), geriSayim: !!ts.geriSayim, golge: ts.golge !== false
    },
    hedef: {
      sayfalar: sec(hd.sayfalar, ['tum', 'dahil', 'haric'], 'tum'), liste: kirp(hd.liste, 800),
      cihaz: sec(hd.cihaz, ['hepsi', 'masaustu', 'mobil'], 'hepsi'), ziyaretci: sec(hd.ziyaretci, ['hepsi', 'yeni', 'geri'], 'hepsi')
    },
    zaman: {
      baslangic: TARIH.test(z.baslangic || '') ? z.baslangic : '', bitis: TARIH.test(z.bitis || '') ? z.bitis : '',
      gunler: (Array.isArray(z.gunler) ? z.gunler : []).map(Number).filter((g) => g >= 1 && g <= 7).slice(0, 7),
      saatBas: SAAT.test(z.saatBas || '') ? z.saatBas : '', saatBit: SAAT.test(z.saatBit || '') ? z.saatBit : ''
    },
    tetik: { tur: sec(tg.tur, ['gecikme', 'kaydirma', 'cikis'], 'gecikme'), deger: sayi(tg.deger, 0, 120, 5), siklik: sec(tg.siklik, ['her', 'oturum', 'gun', 'hafta', 'bir-kez'], 'oturum') }
  };
}

// İlk kurulumda site-içeriğindeki eski duyuruları stüdyoya taşır (bir kez).
async function tohumla(db) {
  const v = await db.prepare("SELECT deger FROM ayarlar WHERE anahtar = 'banner_tohum'").first();
  if (v) return;
  const z = simdi();
  const ornekler = [
    ['Üst duyuru şeridi', 'serit', 'yayinda', 10, { konum: 'ust-en', mod: 'kayan', ogeler: [{ metin: 'Ücretsiz analiz: Reklam hesaplarınızı ve sitenizi inceleyip 1 iş günü içinde dönüyoruz.' }, { metin: 'Hangi paket size uygun? Dört soruluk paket sihirbazı önersin.' }], dugme: { metin: 'Analiz isteyin', eylem: 'talep-analiz' }, kapatilabilir: true, kapatmaSuresi: '7g', tasarim: { tema: 'lacivert' } }],
    ['Ücretsiz analiz kampanyası', 'gorsel', 'yayinda', 20, { konum: 'ana-acilis-alti', etiket: 'Ücretsiz', baslik: 'Reklam hesabınızı ücretsiz inceleyelim', metin: 'Google Ads, Meta ve ölçüm altyapınızı inceleyip nereden başlamanız gerektiğini gerekçesiyle anlatalım.', kapak: 'birlesik', dugme: { metin: 'Ücretsiz analiz isteyin', eylem: 'talep-analiz' }, kapatilabilir: false, tasarim: { tema: 'acik' } }],
    ['Paket sihirbazı kampanyası', 'gorsel', 'yayinda', 30, { konum: 'ana-acilis-alti', etiket: 'Paket sihirbazı', baslik: 'Size uygun paketi dört soruda bulun', metin: 'Reklam, e-ticaret, web ve içerik paketlerinden ihtiyacınıza uygun olanı ve kademesini önerelim.', kapak: 'yonetim', dugme: { metin: 'Sihirbazı başlatın', eylem: 'bag', hedef: '/tr/paketler#sihirbaz' }, kapatilabilir: false, tasarim: { tema: 'acik' } }],
    ['Blog yan sütunu: ücretsiz analiz', 'gorsel', 'yayinda', 40, { konum: 'blog-yan', etiket: 'Ücretsiz', baslik: 'Reklam hesabınızı ücretsiz inceleyelim', metin: 'Bu yazıdaki konuların sizde nasıl durduğunu gerekçesiyle anlatalım.', kapak: 'birlesik', dugme: { metin: 'Ücretsiz analiz isteyin', eylem: 'talep-analiz' }, kapatilabilir: false, tasarim: { tema: 'acik' } }]
  ];
  await db.batch([
    ...ornekler.map(([ad, tur, durum, oncelik, a]) => db.prepare('INSERT INTO bannerlar (id, ad, tur, durum, oncelik, ayar, olusturma, guncelleme, guncelleyen) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(kimlik(), ad, tur, durum, oncelik, JSON.stringify(ayarTemizle(tur, a)), z, z, 'kurulum')),
    db.prepare("INSERT INTO ayarlar (anahtar, deger, guncelleme, guncelleyen) VALUES ('banner_tohum', ?, ?, 'kurulum') ON CONFLICT(anahtar) DO NOTHING").bind(z, z)
  ]);
}

const disa = (r) => ({ id: r.id, ad: r.ad, tur: r.tur, oncelik: r.oncelik, guncelleme: r.guncelleme, ...JSON.parse(r.ayar || '{}') });

// Site: yayındaki bannerlar. Uçta 60 sn önbelleklenir; tarih/saat/sayfa/cihaz süzgeci ziyaretçinin tarayıcısında yapılır.
export async function bannerApi(istek, env, yol, ctx) {
  const db = env.DB;
  if (yol === '' && istek.method === 'GET') {
    const onbellek = caches.default, anahtar = new Request(new URL('/api/bannerlar?v=1', istek.url).href);
    const var_ = await onbellek.match(anahtar);
    if (var_) return var_;
    await tohumla(db);
    const r = await db.prepare("SELECT id, ad, tur, oncelik, ayar, guncelleme FROM bannerlar WHERE durum = 'yayinda' ORDER BY oncelik, olusturma").all();
    const yanit = new Response(JSON.stringify({ ok: true, bannerlar: r.results.map(disa) }), { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=60' } });
    if (ctx) ctx.waitUntil(onbellek.put(anahtar, yanit.clone())); else await onbellek.put(anahtar, yanit.clone());
    return yanit;
  }
  if (yol === 'olay' && istek.method === 'POST') {
    let g; try { g = JSON.parse((await istek.text()).slice(0, 4000)); } catch { return hata('Geçersiz', 400); }
    const olaylar = (Array.isArray(g.olaylar) ? g.olaylar : []).slice(0, 20).filter((o) => o && /^[\w-]{10,64}$/.test(o.id || '') && ['gosterim', 'tiklama', 'kapatma'].includes(o.olay));
    if (!olaylar.length) return json({ ok: true });
    const gun = new Date(Date.now() + 3 * 3600000).toISOString().slice(0, 10);
    await db.batch(olaylar.map((o) => db.prepare('INSERT INTO banner_olay (gun, banner_id, olay, sayi) SELECT ?, id, ?, 1 FROM bannerlar WHERE id = ? ON CONFLICT(gun, banner_id, olay) DO UPDATE SET sayi = sayi + 1').bind(gun, o.olay, o.id)));
    return json({ ok: true });
  }
  return hata('Bulunamadı', 404);
}

async function onbellekTemizle(istek) { try { await caches.default.delete(new Request(new URL('/api/bannerlar?v=1', istek.url).href)); } catch {} }

export async function yonetimBannerApi(db, yontem, yol, govde, kim, istek) {
  if (!(yol === 'bannerlar' || yol.startsWith('bannerlar/'))) return null;
  if (yol === 'bannerlar' && yontem === 'GET') {
    await tohumla(db);
    const otuz = new Date(Date.now() + 3 * 3600000 - 30 * 86400000).toISOString().slice(0, 10);
    const [b, ist] = await db.batch([
      db.prepare("SELECT * FROM bannerlar WHERE durum != 'arsiv' ORDER BY CASE durum WHEN 'yayinda' THEN 0 WHEN 'taslak' THEN 1 ELSE 2 END, oncelik, guncelleme DESC"),
      db.prepare('SELECT banner_id, olay, SUM(sayi) AS n FROM banner_olay WHERE gun >= ? GROUP BY banner_id, olay').bind(otuz)
    ]);
    const s = {};
    for (const x of ist.results) (s[x.banner_id] ||= { gosterim: 0, tiklama: 0, kapatma: 0 })[x.olay] = x.n;
    return json({ ok: true, turler: TURLER, bannerlar: b.results.map((r) => ({ ...disa(r), durum: r.durum, olusturma: r.olusturma, guncelleyen: r.guncelleyen, istatistik: s[r.id] || { gosterim: 0, tiklama: 0, kapatma: 0 } })) });
  }
  if (yol === 'bannerlar' && yontem === 'POST') {
    const tur = TURLER[govde.tur] ? govde.tur : null;
    if (!tur) return hata('Banner türü seçin', 422);
    const ad = kirp(govde.ad, 80).trim() || TURLER[tur].ad;
    const ayar = ayarTemizle(tur, govde.ayar || {});
    const sorun = eksik(tur, ayar); if (sorun && govde.durum === 'yayinda') return hata(sorun, 422);
    const id = kimlik(), z = simdi();
    await db.prepare('INSERT INTO bannerlar (id, ad, tur, durum, oncelik, ayar, olusturma, guncelleme, guncelleyen) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(id, ad, tur, sec(govde.durum, DURUMLAR, 'taslak'), sayi(govde.oncelik, 0, 999, 50), JSON.stringify(ayar), z, z, kim.eposta).run();
    await islemYaz(db, kim.eposta, 'banner_olustur', id, `${TURLER[tur].ad}: ${ad}`);
    await onbellekTemizle(istek);
    return json({ ok: true, id });
  }
  const m = yol.match(/^bannerlar\/([\w-]{10,64})(?:\/(durum|cogalt))?$/);
  if (!m) return hata('Bulunamadı', 404);
  const r = await db.prepare('SELECT * FROM bannerlar WHERE id = ?').bind(m[1]).first();
  if (!r) return hata('Banner bulunamadı', 404);
  if (!m[2] && yontem === 'GET') return json({ ok: true, banner: { ...disa(r), durum: r.durum } });
  if (!m[2] && yontem === 'POST') {
    const ayar = ayarTemizle(r.tur, govde.ayar || {});
    const durum = sec(govde.durum, DURUMLAR, r.durum);
    const sorun = eksik(r.tur, ayar); if (sorun && durum === 'yayinda') return hata(sorun, 422);
    await db.prepare('UPDATE bannerlar SET ad = ?, durum = ?, oncelik = ?, ayar = ?, guncelleme = ?, guncelleyen = ? WHERE id = ?')
      .bind(kirp(govde.ad, 80).trim() || r.ad, durum, sayi(govde.oncelik, 0, 999, r.oncelik), JSON.stringify(ayar), simdi(), kim.eposta, r.id).run();
    await islemYaz(db, kim.eposta, 'banner_guncelle', r.id, `${r.ad} güncellendi (${durum})`);
    await onbellekTemizle(istek);
    return json({ ok: true, id: r.id });
  }
  if (m[2] === 'durum' && yontem === 'POST') {
    const durum = sec(govde.durum, DURUMLAR, null);
    if (!durum) return hata('Durum geçersiz', 422);
    if (durum === 'yayinda') { const sorun = eksik(r.tur, JSON.parse(r.ayar)); if (sorun) return hata(sorun, 422); }
    await db.prepare('UPDATE bannerlar SET durum = ?, guncelleme = ?, guncelleyen = ? WHERE id = ?').bind(durum, simdi(), kim.eposta, r.id).run();
    await islemYaz(db, kim.eposta, 'banner_durum', r.id, `${r.ad}: ${durum}`);
    await onbellekTemizle(istek);
    return json({ ok: true });
  }
  if (m[2] === 'cogalt' && yontem === 'POST') {
    const id = kimlik(), z = simdi();
    await db.prepare('INSERT INTO bannerlar (id, ad, tur, durum, oncelik, ayar, olusturma, guncelleme, guncelleyen) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(id, kirp(r.ad + ' (kopya)', 80), r.tur, 'taslak', r.oncelik, r.ayar, z, z, kim.eposta).run();
    await islemYaz(db, kim.eposta, 'banner_cogalt', id, `${r.ad} çoğaltıldı`);
    return json({ ok: true, id });
  }
  return hata('Bulunamadı', 404);
}

// Yayına almadan önce zorunlu içerik kontrolü
function eksik(tur, a) {
  if (tur === 'serit' && !a.ogeler.length) return 'Şeride en az bir duyuru metni yazın.';
  if (tur !== 'serit' && !a.baslik) return 'Başlık yazın.';
  if (['bag', 'yeni-sekme'].includes(a.dugme.eylem) && !a.dugme.hedef) return 'Düğmenin gideceği adresi yazın (https://… ya da /tr/…).';
  if (a.dugme.eylem === 'kod-kopyala' && !a.dugme.hedef) return 'Kopyalanacak kampanya kodunu yazın.';
  if (a.dugme.eylem !== 'yok' && !a.dugme.metin) return 'Düğme yazısını girin.';
  if (a.zaman.baslangic && a.zaman.bitis && a.zaman.bitis <= a.zaman.baslangic) return 'Bitiş zamanı başlangıçtan sonra olmalı.';
  return null;
}
