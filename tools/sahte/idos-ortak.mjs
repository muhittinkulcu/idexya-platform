// Yerel test için sahte IDOS ortak müşteri API'si (SAHTE veri; gerçek müşteri yok).
// Kullanım: node tools/sahte/idos-ortak.mjs 8799 <jeton>
//   wrangler dev --var IDOS_ORTAK_URL:http://127.0.0.1:8799 --var IDOS_ORTAK_JETON:<jeton> ...
// Denetim uçları (yalnız bu sahte sunucuda): POST /__sil/<id> müşteriyi siler, POST /__kapat sunucuyu 503'e alır,
// POST /__karar/<aday_id>?durum=onaylandi|reddedildi[&gerekce=..] adaya karar verir (yeni müşteri m-<n> açılır),
// GET /__aday/<aday_id> gelen gövdeyi döner (testte gönderilen alanları denetlemek için).
import http from 'http';
const port = Number(process.argv[2] || 8799);
const jeton = process.argv[3] || '';
let kapali = false;
const z = (d) => new Date(Date.now() - d * 60000).toISOString();
const musteriler = new Map([
  ['m-1', { musteri_id: 'm-1', marka: 'Örnek Marka A', unvan: 'Örnek Ticaret Ltd. Şti.', sektor: 'E-ticaret', durum: 'aktif', web_sitesi: 'https://ornek-a.example',
    sosyal: { instagram: 'https://instagram.com/ornek', facebook: null, tiktok: null, linkedin: null, youtube: null, google_isletme: 'javascript:alert(1)' },
    logo_url: null, marka_rengi: '#1E9E5A', guncelleme: z(30), sorumlu: 'ekip@idexya.example', ana_hedef: 'satis', ana_sonuc: 'Satış',
    hesaplar: { meta_ads: [{ hesap: 'act_1', tur: 'ana' }, { hesap: 'act_2', tur: 'ek' }, { hesap: 'act_0', tur: 'arsiv' }], google_ads: [{ hesap: '111-111-1111', tur: 'ana' }],
      meta_isletme: null, ga4: '123456', search_console: null, gtm_web: 'GTM-ABC', gtm_sunucu: null, merchant: null } }],
  ['m-2', { musteri_id: 'm-2', marka: 'Örnek Marka B', unvan: null, sektor: null, durum: 'pasif', web_sitesi: null, sosyal: {}, logo_url: null, marka_rengi: null,
    guncelleme: z(10), sorumlu: null, ana_hedef: null, ana_sonuc: null, hesaplar: { meta_ads: [], google_ads: [] } }]
]);
const silinen = new Map();
const adaylar = new Map();
let sayac = 10;
const eslesme = [{ platform: 'meta_ads', hesap: '101', musteri_id: 'm-1', tur: 'ana' }, { platform: 'google_ads', hesap: '1112223333', musteri_id: 'm-1', tur: 'ana' },
  { platform: 'meta_ads', hesap: 'act_bozuk!', musteri_id: 'm-1', tur: 'ana' }, { platform: 'tiktok', hesap: '9', musteri_id: 'm-1', tur: 'ana' }];
const govdeOku = (q) => new Promise((ok) => { let b = ''; q.on('data', (c) => (b += c)); q.on('end', () => { try { ok(JSON.parse(b || '{}')); } catch { ok(null); } }); });
const gorunum = (a) => ({ aday_id: a.aday_id, kaynak_kimlik: a.govde.kaynak_kimlik, durum: a.durum, musteri_id: a.musteri_id, red_gerekcesi: a.red_gerekcesi, karar_zamani: null, olusturma: a.olusturma });
const ALANLAR = new Set(['kaynak_kimlik', 'marka', 'unvan', 'sektor', 'web_sitesi', 'sorumlu', 'aciklama', 'kisi_ad', 'kisi_rol', 'kisi_eposta', 'kisi_telefon', 'kisi_izin']);
const yaz = (y, d, v) => { y.writeHead(d, { 'Content-Type': 'application/json' }); y.end(JSON.stringify(v)); };
http.createServer((q, y) => {
  const u = new URL(q.url, 'http://x');
  if (q.method === 'POST' && u.pathname.startsWith('/__sil/')) { const id = u.pathname.slice(7); musteriler.delete(id); silinen.set(id, new Date().toISOString()); return yaz(y, 200, { ok: true }); }
  if (q.method === 'POST' && u.pathname === '/__kapat') { kapali = true; return yaz(y, 200, { ok: true }); }
  let k = u.pathname.match(/^\/__karar\/([\w-]+)$/);
  if (q.method === 'POST' && k) {
    const a = adaylar.get(k[1]); if (!a) return yaz(y, 404, {});
    a.durum = u.searchParams.get('durum'); a.red_gerekcesi = u.searchParams.get('gerekce');
    if (a.durum === 'onaylandi') { a.musteri_id = 'm-' + ++sayac; musteriler.set(a.musteri_id, { musteri_id: a.musteri_id, marka: a.govde.marka, durum: 'aktif', sosyal: {}, hesaplar: { meta_ads: [], google_ads: [] }, guncelleme: new Date().toISOString() }); }
    return yaz(y, 200, gorunum(a));
  }
  k = u.pathname.match(/^\/__aday\/([\w-]+)$/);
  if (k) return adaylar.has(k[1]) ? yaz(y, 200, adaylar.get(k[1]).govde) : yaz(y, 404, {});
  if (kapali) return yaz(y, 503, { detail: 'kapalı' });
  if (q.headers.authorization !== 'Bearer ' + jeton) return yaz(y, 401, { detail: 'Jeton geçersiz' });
  if (u.pathname === '/api/ortak/musteriler') {
    const sonra = u.searchParams.get('degisen_sonra');
    const liste = [...musteriler.values()].filter((m) => !sonra || m.guncelleme > sonra);
    const sil = [...silinen].filter(([, t]) => sonra && t > sonra).map(([id]) => id);
    return yaz(y, 200, { musteriler: liste, silinen: sil, zaman: new Date().toISOString() });
  }
  if (u.pathname === '/api/ortak/hesap-esleme') return yaz(y, 200, { eslesme, belirsiz_hesap_sayisi: 1, zaman: new Date().toISOString() });
  if (u.pathname === '/api/ortak/musteri-adayi' && q.method === 'POST') {
    return govdeOku(q).then((g) => {
      if (!g || !g.kaynak_kimlik || !g.marka || Object.keys(g).some((a) => !ALANLAR.has(a))) return yaz(y, 422, { detail: 'gövde' });
      const var_ = [...adaylar.values()].find((a) => a.govde.kaynak_kimlik === g.kaynak_kimlik && a.durum !== 'reddedildi');
      if (var_) return yaz(y, 202, gorunum(var_));
      const a = { aday_id: 'aday-' + ++sayac, govde: g, durum: 'bekliyor', musteri_id: null, red_gerekcesi: null, olusturma: new Date().toISOString() };
      adaylar.set(a.aday_id, a); yaz(y, 202, gorunum(a));
    });
  }
  const ad = u.pathname.match(/^\/api\/ortak\/musteri-adayi\/([\w-]+)$/);
  if (ad) return adaylar.has(ad[1]) ? yaz(y, 200, gorunum(adaylar.get(ad[1]))) : yaz(y, 404, { detail: 'Aday bulunamadı' });
  const m = u.pathname.match(/^\/api\/ortak\/musteriler\/([\w-]+)$/);
  if (m) return musteriler.has(m[1]) ? yaz(y, 200, musteriler.get(m[1])) : yaz(y, 404, { detail: 'Müşteri bulunamadı' });
  yaz(y, 404, { detail: 'yok' });
}).listen(port, '127.0.0.1', () => console.log('sahte IDOS ortak API: ' + port));
