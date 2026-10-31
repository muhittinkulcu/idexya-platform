// Yerel test için sahte IDOS ortak müşteri API'si (SAHTE veri; gerçek müşteri yok).
// Kullanım: node tools/sahte/idos-ortak.mjs 8799 <jeton>
//   wrangler dev --var IDOS_ORTAK_URL:http://127.0.0.1:8799 --var IDOS_ORTAK_JETON:<jeton> ...
// Denetim uçları (yalnız bu sahte sunucuda): POST /__sil/<id> müşteriyi siler, POST /__kapat sunucuyu 503'e alır.
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
const yaz = (y, d, v) => { y.writeHead(d, { 'Content-Type': 'application/json' }); y.end(JSON.stringify(v)); };
http.createServer((q, y) => {
  const u = new URL(q.url, 'http://x');
  if (q.method === 'POST' && u.pathname.startsWith('/__sil/')) { const id = u.pathname.slice(7); musteriler.delete(id); silinen.set(id, new Date().toISOString()); return yaz(y, 200, { ok: true }); }
  if (q.method === 'POST' && u.pathname === '/__kapat') { kapali = true; return yaz(y, 200, { ok: true }); }
  if (kapali) return yaz(y, 503, { detail: 'kapalı' });
  if (q.headers.authorization !== 'Bearer ' + jeton) return yaz(y, 401, { detail: 'Jeton geçersiz' });
  if (u.pathname === '/api/ortak/musteriler') {
    const sonra = u.searchParams.get('degisen_sonra');
    const liste = [...musteriler.values()].filter((m) => !sonra || m.guncelleme > sonra);
    const sil = [...silinen].filter(([, t]) => sonra && t > sonra).map(([id]) => id);
    return yaz(y, 200, { musteriler: liste, silinen: sil, zaman: new Date().toISOString() });
  }
  const m = u.pathname.match(/^\/api\/ortak\/musteriler\/([\w-]+)$/);
  if (m) return musteriler.has(m[1]) ? yaz(y, 200, musteriler.get(m[1])) : yaz(y, 404, { detail: 'Müşteri bulunamadı' });
  yaz(y, 404, { detail: 'yok' });
}).listen(port, '127.0.0.1', () => console.log('sahte IDOS ortak API: ' + port));
