// Çerezsiz ziyaret ve gerçek kullanıcı hız ölçümü (src/scripts/olcum.js gönderir). Kişisel veri tutulmaz:
// IP adresi, tarayıcı bilgisi (user agent), çerez ya da kimlik saklanmaz; yalnız günlük toplam sayaç
// (gün, sayfa, yönlendiren alan adı, cihaz sınıfı) ve sayfa başına günde en çok 500 hız örneği yazılır.
// Saklama: günlük sayaçlar 2 yıl, hız örnekleri 90 gün (worker/saklama.js).
import { json, hata } from './ortak.js';

const SINIR = 2048;
const ORNEK_SINIRI = 500;
const ROBOT = /bot|crawl|spider|headless|slurp|lighthouse|pagespeed|preview|monitor/i;
const CIHAZ = ['mobil', 'tablet', 'masaustu'];
const bos = () => new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
// Gün İstanbul saatine göre (UTC+3; Türkiye yaz saati uygulamıyor).
const gunBul = (an = Date.now()) => new Date(an + 3 * 3600000).toISOString().slice(0, 10);
const sayi = (v, en) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= en ? Math.round(v * 1000) / 1000 : null);

function yolTemizle(p) {
  if (typeof p !== 'string' || !p.startsWith('/') || p.length > 200) return null;
  const yol = p.split(/[?#]/)[0];
  if (!/^\/[\w\-./%~]*$/.test(yol) || yol.includes('//')) return null;
  if (/^\/(yonetim|api|kabuk|cdn-cgi)(\/|$)/.test(yol)) return null;
  return yol;
}

export async function olcumAl(istek, env) {
  if (istek.method !== 'POST') return hata('Yöntem desteklenmiyor', 405);
  if (Number(istek.headers.get('content-length') || 0) > SINIR) return hata('İstek çok büyük', 413);
  const ham = await istek.text();
  if (ham.length > SINIR) return hata('İstek çok büyük', 413);
  // Robotlar, başka sitelerden gönderilen istekler ve tarayıcı bilgisi olmayan istekler sessizce yok sayılır.
  const ua = istek.headers.get('user-agent') || '';
  if (!ua || ROBOT.test(ua)) return bos();
  if ((istek.headers.get('sec-fetch-site') || '') === 'cross-site') return bos();
  const kaynakBaslik = istek.headers.get('origin');
  if (kaynakBaslik && kaynakBaslik !== 'null') { try { if (new URL(kaynakBaslik).host !== new URL(istek.url).host) return bos(); } catch (e) { return bos(); } }
  let g;
  try { g = JSON.parse(ham); } catch (e) { return hata('Geçersiz istek', 400); }
  if (!g || typeof g !== 'object' || Array.isArray(g)) return hata('Geçersiz istek', 400);
  const sayfa = g.n === 1 ? '/404' : yolTemizle(g.p);
  if (!sayfa) return bos();
  const cihaz = CIHAZ.includes(g.c) ? g.c : 'masaustu';
  const gun = gunBul();
  const db = env.DB;
  if (g.t === 'g') {
    let kaynak = typeof g.r === 'string' ? g.r.toLowerCase().replace(/^www\./, '') : 'dogrudan';
    if (kaynak !== 'dogrudan' && kaynak !== 'ic' && !/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(kaynak)) kaynak = 'diger';
    kaynak = kaynak.slice(0, 100);
    await db.prepare(`INSERT INTO ziyaret_gunluk (gun, sayfa, kaynak, cihaz, adet) VALUES (?, ?, ?, ?, 1)
      ON CONFLICT(gun, sayfa, kaynak, cihaz) DO UPDATE SET adet = adet + 1`).bind(gun, sayfa, kaynak, cihaz).run();
    return bos();
  }
  if (g.t === 'h') {
    const lcp = sayi(g.lcp, 120000), inp = sayi(g.inp, 60000), cls = sayi(g.cls, 50);
    if (lcp === null && inp === null && cls === null) return bos();
    // Sayfa başına günde en çok 500 örnek (tablo sınırsız büyümesin).
    await db.prepare(`INSERT INTO hiz_olcum (gun, sayfa, cihaz, lcp, inp, cls)
      SELECT ?, ?, ?, ?, ?, ? WHERE (SELECT COUNT(*) FROM hiz_olcum WHERE gun = ? AND sayfa = ?) < ?`)
      .bind(gun, sayfa, cihaz, lcp, inp, cls, gun, sayfa, ORNEK_SINIRI).run();
    return bos();
  }
  return bos();
}

// 75. yüzdelik (Google'ın Core Web Vitals değerlendirmesi gibi)
function p75(liste) {
  const d = liste.filter((x) => x !== null && x !== undefined).sort((a, b) => a - b);
  if (!d.length) return null;
  return d[Math.min(d.length - 1, Math.ceil(d.length * 0.75) - 1)];
}

export async function yonetimOlcumApi(db, yontem, yol) {
  let m = yol.match(/^ziyaret\/(7|30|90)$/);
  if (m && yontem === 'GET') {
    const n = Number(m[1]);
    const bugun = gunBul(), bas = gunBul(Date.now() - (n - 1) * 86400000), oncekiBas = gunBul(Date.now() - (2 * n - 1) * 86400000);
    const [gunluk, sayfa, kaynak, cihaz, onceki, ilk] = await db.batch([
      db.prepare('SELECT gun, cihaz, SUM(adet) AS n FROM ziyaret_gunluk WHERE gun >= ? GROUP BY gun, cihaz').bind(bas),
      db.prepare('SELECT sayfa, SUM(adet) AS n FROM ziyaret_gunluk WHERE gun >= ? GROUP BY sayfa ORDER BY n DESC LIMIT 20').bind(bas),
      db.prepare("SELECT kaynak, SUM(adet) AS n FROM ziyaret_gunluk WHERE gun >= ? GROUP BY kaynak ORDER BY n DESC LIMIT 15").bind(bas),
      db.prepare('SELECT cihaz, SUM(adet) AS n FROM ziyaret_gunluk WHERE gun >= ? GROUP BY cihaz').bind(bas),
      db.prepare('SELECT COALESCE(SUM(adet), 0) AS n FROM ziyaret_gunluk WHERE gun >= ? AND gun < ?').bind(oncekiBas, bas),
      db.prepare('SELECT MIN(gun) AS gun FROM ziyaret_gunluk')
    ]);
    return json({ ok: true, gun: n, bugun, gunluk: gunluk.results, sayfalar: sayfa.results, kaynaklar: kaynak.results, cihazlar: cihaz.results,
      onceki: onceki.results[0].n, ilkGun: ilk.results[0].gun });
  }
  m = yol.match(/^hiz\/(7|28)$/);
  if (m && yontem === 'GET') {
    const n = Number(m[1]);
    const bas = gunBul(Date.now() - (n - 1) * 86400000);
    const r = await db.prepare('SELECT sayfa, cihaz, lcp, inp, cls FROM hiz_olcum WHERE gun >= ? ORDER BY gun DESC LIMIT 50000').bind(bas).all();
    const grup = {};
    const tum = { lcp: [], inp: [], cls: [], n: 0 };
    const cihaz = {};
    for (const x of r.results) {
      const s = (grup[x.sayfa] ||= { lcp: [], inp: [], cls: [], n: 0 });
      const c = (cihaz[x.cihaz] ||= { lcp: [], inp: [], cls: [], n: 0 });
      for (const hedef of [s, tum, c]) { hedef.n++; hedef.lcp.push(x.lcp); hedef.inp.push(x.inp); hedef.cls.push(x.cls); }
    }
    const ozetle = (o) => ({ n: o.n, lcp: p75(o.lcp), inp: p75(o.inp), cls: p75(o.cls),
      nLcp: o.lcp.filter((v) => v !== null).length, nInp: o.inp.filter((v) => v !== null).length, nCls: o.cls.filter((v) => v !== null).length });
    return json({ ok: true, gun: n, genel: ozetle(tum),
      cihazlar: Object.entries(cihaz).map(([k, o]) => ({ cihaz: k, ...ozetle(o) })),
      sayfalar: Object.entries(grup).map(([sayfa, o]) => ({ sayfa, ...ozetle(o) })).sort((a, b) => b.n - a.n).slice(0, 100) });
  }
  return null;
}
