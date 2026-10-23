// Instagram gönderileri (Muhittin, 23 Eki 2026): sitede gösterilecek gönderileri yönetici panelden seçer.
// Instagram'a bağlanılmaz (erişim anahtarı yok, çerez onayı gerektiren gömme kodu kullanılmaz): gönderi bağlantısı,
// kısa açıklama ve panelde küçültülüp yüklenen görsel D1'de saklanır; görsel sitenin kendi adresinden sunulur.
import { json, hata, simdi, kimlik, kirp, islemYaz } from './ortak.js';

export const INSTAGRAM_HESAP = 'idexya.goodthings';
const BAGLANTI = /^https:\/\/(www\.)?instagram\.com\/(p|reel|reels|tv)\/[A-Za-z0-9_-]{4,40}\/?(\?[^\s]*)?$/;
const GORSEL = /^data:image\/(jpeg|webp|png);base64,([A-Za-z0-9+/=]+)$/;
const GORSEL_SINIR = 280 * 1024; // base64 metin olarak

export async function instagramApi(istek, env, yol) {
  const db = env.DB;
  if (istek.method !== 'GET') return hata('Yöntem desteklenmiyor', 405);
  if (yol === '') {
    const r = await db.prepare('SELECT id, baglanti, aciklama FROM instagram WHERE gorunur = 1 ORDER BY sira ASC, olusturma DESC LIMIT 8').all();
    const y = json({ ok: true, hesap: INSTAGRAM_HESAP, gonderiler: r.results });
    y.headers.set('Cache-Control', 'public, max-age=300');
    return y;
  }
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

export async function yonetimInstagramApi(db, yontem, yol, govde, kim) {
  if (yol === 'instagram' && yontem === 'GET') {
    const r = await db.prepare('SELECT id, baglanti, aciklama, gorunur, sira, olusturma, length(gorsel) AS boyut FROM instagram ORDER BY sira ASC, olusturma DESC').all();
    return json({ ok: true, hesap: INSTAGRAM_HESAP, gonderiler: r.results });
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
