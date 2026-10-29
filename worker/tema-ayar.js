// Tema düzenleyici (Muhittin, 29 Eki 2026): üst menü öğeleri (sıra, ad, görünürlük, açılır menü), açılır menü stili,
// üst alandaki düğmeler ve altbilgi. Ayar ayarlar.tema'da tutulur; site sayfaları /api/tema'dan okuyup tarayıcıda uygular
// (src/scripts/tema-ayar.js). Kayıt olmayan alanlarda sitenin derlenmiş varsayılanı geçerlidir.
import { json, hata, simdi, kirp, islemYaz } from './ortak.js';

const ANAHTAR_URL = '/api/tema?v=1';
const BAG = (v) => { const s = kirp(v, 300); return /^(\/[^\s]*|https:\/\/[^\s]+|mailto:[^\s]+|tel:[+\d]+)$/i.test(s) ? s : null; };

export function temaTemizle(g) {
  const t = {};
  if (g && g.menu) {
    const m = g.menu;
    t.menu = {
      stil: ['mega', 'orta', 'standart'].includes(m.stil) ? m.stil : 'mega',
      ogeler: (Array.isArray(m.ogeler) ? m.ogeler : []).slice(0, 14).map((o) => {
        const ozel = typeof o.k === 'string' && o.k.startsWith('ozel-');
        const x = { k: kirp(o.k, 40).replace(/[^a-z0-9-]/g, ''), ad: kirp(o.ad, 40), gorunur: o.gorunur !== false, acilir: o.acilir !== false };
        if (ozel) { x.href = BAG(o.href); x.yeniSekme = o.yeniSekme === true; }
        return x;
      }).filter((o) => o.k && (!o.k.startsWith('ozel-') || (o.href && o.ad)))
    };
  }
  if (g && g.ust) {
    const u = g.ust;
    t.ust = { ctaMetin: kirp(u.ctaMetin, 40), ctaEylem: ['analiz', 'teklif', 'bag'].includes(u.ctaEylem) ? u.ctaEylem : 'analiz', ctaHref: BAG(u.ctaHref),
      giris: u.giris !== false, arama: u.arama !== false, temaDugme: u.temaDugme !== false };
  }
  if (g && g.alt) {
    const a = g.alt;
    t.alt = { tanitim: kirp(a.tanitim, 300), telif: kirp(a.telif, 120), sosyal: a.sosyal !== false,
      sutunlar: (Array.isArray(a.sutunlar) ? a.sutunlar : []).slice(0, 6).map((s) => ({ baslik: kirp(s.baslik, 40),
        baglantilar: (Array.isArray(s.baglantilar) ? s.baglantilar : []).slice(0, 12).map((b) => ({ ad: kirp(b.ad, 60), href: BAG(b.href) })).filter((b) => b.ad && b.href) })).filter((s) => s.baslik) };
  }
  return t;
}

async function oku(db) {
  const r = await db.prepare("SELECT deger, guncelleme FROM ayarlar WHERE anahtar = 'tema'").first();
  if (!r) return { tema: null, surum: null };
  try { return { tema: JSON.parse(r.deger), surum: r.guncelleme }; } catch { return { tema: null, surum: null }; }
}

export async function temaApi(istek, env, ctx) {
  if (istek.method !== 'GET') return hata('Yöntem desteklenmiyor', 405);
  const onbellek = caches.default, anahtar = new Request(new URL(ANAHTAR_URL, istek.url).href);
  const var_ = await onbellek.match(anahtar);
  if (var_) return var_;
  const { tema, surum } = await oku(env.DB);
  const yanit = new Response(JSON.stringify({ ok: true, tema, surum }), { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=60' } });
  if (ctx) ctx.waitUntil(onbellek.put(anahtar, yanit.clone())); else await onbellek.put(anahtar, yanit.clone());
  return yanit;
}

export async function yonetimTemaApi(db, yontem, yol, govde, kim, istek) {
  if (yol !== 'tema') return null;
  if (yontem === 'GET') return json({ ok: true, ...(await oku(db)) });
  if (yontem === 'POST') {
    const g = govde || {};
    if (g.sifirla === true) {
      await db.prepare("DELETE FROM ayarlar WHERE anahtar = 'tema'").run();
    } else {
      const t = temaTemizle(g.tema || {});
      await db.prepare(`INSERT INTO ayarlar (anahtar, deger, guncelleme, guncelleyen) VALUES ('tema', ?, ?, ?)
        ON CONFLICT(anahtar) DO UPDATE SET deger = excluded.deger, guncelleme = excluded.guncelleme, guncelleyen = excluded.guncelleyen`).bind(JSON.stringify(t), simdi(), kim.eposta).run();
    }
    try { await caches.default.delete(new Request(new URL(ANAHTAR_URL, istek.url).href)); } catch {}
    await islemYaz(db, kim.eposta, g.sifirla ? 'tema_sifirla' : 'tema_kaydet', null, null);
    return json({ ok: true, ...(await oku(db)) });
  }
  return hata('Yöntem desteklenmiyor', 405);
}
