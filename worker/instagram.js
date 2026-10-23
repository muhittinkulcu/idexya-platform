// Instagram gönderileri (Muhittin, 23 Eki 2026): sitede gösterilecek gönderileri yönetici panelden seçer.
// Instagram'a bağlanılmaz (erişim anahtarı yok, çerez onayı gerektiren gömme kodu kullanılmaz): gönderi bağlantısı,
// kısa açıklama ve panelde küçültülüp yüklenen görsel D1'de saklanır; görsel sitenin kendi adresinden sunulur.
import { json, hata, simdi, kimlik, kirp, islemYaz } from './ortak.js';

export const INSTAGRAM_HESAP = 'idexya.goodthings';
const BAGLANTI = /^https:\/\/(www\.)?instagram\.com\/(p|reel|reels|tv)\/[A-Za-z0-9_-]{4,40}\/?(\?[^\s]*)?$/;
const GORSEL = /^data:image\/(jpeg|webp|png);base64,([A-Za-z0-9+/=]+)$/;
const GORSEL_SINIR = 280 * 1024; // base64 metin olarak

export async function instagramApi(istek, env, yol, ctx) {
  const db = env.DB;
  if (istek.method !== 'GET') return hata('Yöntem desteklenmiyor', 405);
  if (yol === '') {
    if (ctx) await akisTazele(env, ctx);
    const akis = await akisListe(db);
    if (akis.length) {
      const y = json({ ok: true, hesap: INSTAGRAM_HESAP, kaynak: 'otomatik', gonderiler: akis.map((g) => ({ id: g.id, baglanti: g.permalink, aciklama: g.aciklama, video: g.tur === 'VIDEO', gorsel: `/api/instagram/akis/${encodeURIComponent(g.id)}/gorsel` })) });
      y.headers.set('Cache-Control', 'public, max-age=300');
      return y;
    }
    const r = await db.prepare('SELECT id, baglanti, aciklama FROM instagram WHERE gorunur = 1 ORDER BY sira ASC, olusturma DESC LIMIT 8').all();
    const y = json({ ok: true, hesap: INSTAGRAM_HESAP, kaynak: 'elle', gonderiler: r.results.map((g) => ({ ...g, video: /\/(reel|reels|tv)\//.test(g.baglanti), gorsel: `/api/instagram/${encodeURIComponent(g.id)}/gorsel` })) });
    y.headers.set('Cache-Control', 'public, max-age=300');
    return y;
  }
  const a = yol.match(/^akis\/([\w-]+)\/gorsel$/);
  if (a) return (await akisGorsel(db, a[1])) || hata('Bulunamadı', 404);
  const m = yol.match(/^([\w-]+)\/gorsel$/);
  if (m) {
    const k = await db.prepare('SELECT gorsel FROM instagram WHERE id = ? AND gorunur = 1').bind(m[1]).first();
    const g = k && GORSEL.exec(k.gorsel);
    if (!g) return hata('Bulunamadı', 404);
    const ham = Uint8Array.from(atob(g[2]), (c) => c.charCodeAt(0));
    return new Response(ham, { headers: { 'Content-Type': 'image/' + g[1], 'Cache-Control': 'public, max-age=86400', 'X-Content-Type-Options': 'nosniff' } });
  }
  return hata('Bulunamadı', 404);
}

export async function yonetimInstagramApi(db, env, yontem, yol, govde, kim) {
  if (yol === 'instagram' && yontem === 'GET') {
    const r = await db.prepare('SELECT id, baglanti, aciklama, gorunur, sira, olusturma, length(gorsel) AS boyut FROM instagram ORDER BY sira ASC, olusturma DESC').all();
    return json({ ok: true, hesap: INSTAGRAM_HESAP, gonderiler: r.results, akis: await akisDurum(env), akisGonderiler: await akisListe(db) });
  }
  if (yol === 'instagram/akis-cek' && yontem === 'POST') {
    if (!akisKurulu(env)) return hata('Otomatik akış kapalı: Cloudflare’de INSTAGRAM_TOKEN gizli değeri tanımlı değil', 409);
    const son = await db.prepare("SELECT guncelleme FROM ayarlar WHERE anahtar = 'instagram_son_cekim'").first();
    if (son && Date.now() - new Date(son.guncelleme).getTime() < 60000) return hata('Az önce çekildi; bir dakika sonra tekrar deneyin', 429);
    const s = await akisCek(env, kim.eposta);
    return s.ok ? json({ ok: true, adet: s.adet }) : hata('Çekilemedi: ' + s.hata, 502);
  }
  if (yol === 'instagram' && yontem === 'POST') {
    const baglanti = kirp(govde.baglanti, 300), aciklama = kirp(govde.aciklama, 200), gorsel = typeof govde.gorsel === 'string' ? govde.gorsel : '';
    if (!BAGLANTI.test(baglanti)) return hata('Gönderi bağlantısı instagram.com/p/… ya da instagram.com/reel/… biçiminde olmalı', 422);
    if (!GORSEL.test(gorsel)) return hata('Görsel gerekli (JPEG, WebP veya PNG)', 422);
    if (gorsel.length > GORSEL_SINIR) return hata('Görsel çok büyük; daha küçük bir görsel seçin', 413);
    const say = await db.prepare('SELECT COUNT(*) AS n, COALESCE(MIN(sira), 0) AS en FROM instagram').first();
    if (say.n >= 40) return hata('En fazla 40 gönderi eklenebilir; eskilerden birini silin', 422);
    const id = kimlik();
    await db.prepare('INSERT INTO instagram (id, baglanti, aciklama, gorsel, sira, gorunur, olusturma, ekleyen) VALUES (?, ?, ?, ?, ?, 1, ?, ?)')
      .bind(id, baglanti, aciklama || null, gorsel, say.en - 1, simdi(), kim.eposta).run();
    await islemYaz(db, kim.eposta, 'instagram_eklendi', id, baglanti);
    return json({ ok: true, id });
  }
  const m = yol.match(/^instagram\/([\w-]+)\/(gizle|goster|sil|yukari|asagi)$/);
  if (m && yontem === 'POST') {
    const k = await db.prepare('SELECT id, sira FROM instagram WHERE id = ?').bind(m[1]).first();
    if (!k) return hata('Gönderi bulunamadı', 404);
    if (m[2] === 'sil') await db.prepare('DELETE FROM instagram WHERE id = ?').bind(k.id).run();
    else if (m[2] === 'gizle' || m[2] === 'goster') await db.prepare('UPDATE instagram SET gorunur = ? WHERE id = ?').bind(m[2] === 'goster' ? 1 : 0, k.id).run();
    else {
      // Komşu gönderiyle sıra değiştir
      const komsu = await db.prepare(m[2] === 'yukari' ? 'SELECT id, sira FROM instagram WHERE sira < ? ORDER BY sira DESC LIMIT 1' : 'SELECT id, sira FROM instagram WHERE sira > ? ORDER BY sira ASC LIMIT 1').bind(k.sira).first();
      if (komsu) await db.batch([db.prepare('UPDATE instagram SET sira = ? WHERE id = ?').bind(komsu.sira, k.id), db.prepare('UPDATE instagram SET sira = ? WHERE id = ?').bind(k.sira, komsu.id)]);
    }
    await islemYaz(db, kim.eposta, 'instagram_' + m[2], k.id);
    return json({ ok: true });
  }
  return null;
}

// --- Otomatik akış (Muhittin, 24 Eki 2026: "Instagram'dan alınan bir feed gibi") ---
// Instagram API (Instagram ile giriş) üzerinden hesabın son gönderileri çekilir; görseller D1'e kopyalanır ve sitenin
// kendi adresinden sunulur (Instagram'ın görsel adresleri bir süre sonra geçersiz olur, ziyaretçi Instagram'a bağlanmaz).
// Gerekli gizli değer: INSTAGRAM_TOKEN (Instagram profesyonel hesabının uzun ömürlü erişim anahtarı, 60 gün geçerli).
// Anahtar 30 günde bir kendiliğinden yenilenir; yenisi D1'deki ayarlar tablosunda tutulur (panel API'si bu anahtarı döndürmez).
// Akış en fazla 3 saatte bir, siteye gelen ilk istekte arka planda yenilenir; panelden elle de çekilebilir.
const AKIS_ADET = 12, AKIS_ARALIK = 3 * 3600000, YENILEME = 30 * 86400000, GORSEL_EN = 900 * 1024;
const igApi = (env) => env.INSTAGRAM_API || 'https://graph.instagram.com';
const ayarOku = async (db, k) => { const r = await db.prepare('SELECT deger, guncelleme FROM ayarlar WHERE anahtar = ?').bind(k).first(); return r || null; };
const ayarYaz = (db, k, v) => db.prepare('INSERT INTO ayarlar (anahtar, deger, guncelleme, guncelleyen) VALUES (?, ?, ?, ?) ON CONFLICT(anahtar) DO UPDATE SET deger = excluded.deger, guncelleme = excluded.guncelleme').bind(k, v, simdi(), 'Instagram akışı');
export const akisKurulu = (env) => !!env.INSTAGRAM_TOKEN;

async function anahtar(env) {
  const db = env.DB, kayitli = await ayarOku(db, 'instagram_token');
  let token = kayitli && kayitli.deger ? kayitli.deger : env.INSTAGRAM_TOKEN;
  const yas = kayitli ? Date.now() - new Date(kayitli.guncelleme).getTime() : Infinity;
  if (yas > YENILEME) {
    // Uzun ömürlü anahtarı yenile (en az 24 saatlik ve süresi dolmamış olmalı); olmazsa eldekiyle devam
    try {
      const r = await fetch(`${igApi(env)}/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(token)}`);
      const j = await r.json();
      if (r.ok && j.access_token) { token = j.access_token; await ayarYaz(db, 'instagram_token', token).run(); }
    } catch (e) { /* yenilenemedi; mevcut anahtar denenir */ }
  }
  return token;
}

export async function akisCek(env, tetikleyen = 'Site') {
  const db = env.DB;
  if (!akisKurulu(env)) return { ok: false, hata: 'INSTAGRAM_TOKEN tanımlı değil' };
  try {
    const token = await anahtar(env);
    const alanlar = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp';
    const r = await fetch(`${igApi(env)}/me/media?fields=${alanlar}&limit=${AKIS_ADET}&access_token=${encodeURIComponent(token)}`);
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error((j.error && j.error.message) || `Instagram yanıtı ${r.status}`);
    const kullanici = await fetch(`${igApi(env)}/me?fields=username&access_token=${encodeURIComponent(token)}`).then((x) => x.json()).catch(() => ({}));
    const satirlar = [];
    for (const [sira, g] of (j.data || []).slice(0, AKIS_ADET).entries()) {
      const url = g.media_type === 'VIDEO' ? g.thumbnail_url : g.media_url;
      if (!url || !/^https:\/\/[^/]+\/(?!.*\s)/.test(g.permalink || '')) continue;
      const gr = await fetch(url);
      const tur = (gr.headers.get('content-type') || '').split(';')[0];
      if (!gr.ok || !/^image\/(jpeg|png|webp)$/.test(tur)) continue;
      const b = new Uint8Array(await gr.arrayBuffer());
      if (b.length > GORSEL_EN) continue;
      let s = ''; for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000));
      satirlar.push([String(g.id).slice(0, 40), String(g.permalink).slice(0, 300), String(g.caption || '').replace(/\s+/g, ' ').trim().slice(0, 300), g.media_type || 'IMAGE', g.timestamp || null, tur, btoa(s), sira]);
    }
    if (!satirlar.length && (j.data || []).length) throw new Error('Gönderiler alındı ama görselleri indirilemedi');
    const z = simdi();
    await db.batch([
      db.prepare('DELETE FROM instagram_akis'),
      ...satirlar.map((x) => db.prepare('INSERT INTO instagram_akis (id, permalink, aciklama, tur, zaman, gorsel_tur, gorsel, sira, cekim) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(...x, z)),
      ayarYaz(db, 'instagram_son_cekim', z), ayarYaz(db, 'instagram_son_hata', ''), ayarYaz(db, 'instagram_kullanici', kullanici.username || '')
    ]);
    if (tetikleyen !== 'Site') await islemYaz(db, tetikleyen, 'instagram_akis_cekildi', null, `${satirlar.length} gönderi`);
    return { ok: true, adet: satirlar.length };
  } catch (e) {
    await db.batch([ayarYaz(db, 'instagram_son_cekim', simdi()), ayarYaz(db, 'instagram_son_hata', String(e.message || e).slice(0, 300))]);
    return { ok: false, hata: String(e.message || e) };
  }
}

// Sitedeki istek: akış eskiyse arka planda yenile (yanıtı bekletmez)
export async function akisTazele(env, ctx) {
  if (!akisKurulu(env)) return;
  const son = await ayarOku(env.DB, 'instagram_son_cekim');
  if (!son || Date.now() - new Date(son.deger).getTime() > AKIS_ARALIK) ctx.waitUntil(akisCek(env));
}

export async function akisListe(db) {
  const r = await db.prepare('SELECT id, permalink, aciklama, tur FROM instagram_akis ORDER BY sira ASC LIMIT ?').bind(AKIS_ADET).all();
  return r.results;
}

export async function akisGorsel(db, id) {
  const k = await db.prepare('SELECT gorsel, gorsel_tur FROM instagram_akis WHERE id = ?').bind(id).first();
  if (!k) return null;
  return new Response(Uint8Array.from(atob(k.gorsel), (c) => c.charCodeAt(0)), { headers: { 'Content-Type': k.gorsel_tur, 'Cache-Control': 'public, max-age=86400', 'X-Content-Type-Options': 'nosniff' } });
}

export async function akisDurum(env) {
  const db = env.DB;
  const [son, hataK, kul] = await Promise.all(['instagram_son_cekim', 'instagram_son_hata', 'instagram_kullanici'].map((k) => ayarOku(db, k)));
  const adet = await db.prepare('SELECT COUNT(*) AS n FROM instagram_akis').first();
  return { kurulu: akisKurulu(env), sonCekim: son && son.deger, hata: hataK && hataK.deger, kullanici: kul && kul.deger, adet: adet.n };
}
