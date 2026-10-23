// Aylık bülten ilgi listesi (Muhittin, 23 Eki 2026). Şimdilik yalnızca e-posta ve açık ticari ileti onayı toplanır;
// gönderim servisi ve İYS kaydı hazır olunca bülten gönderilir. Onay kaydı (zaman, metin sürümü, sayfa) saklanır.
// Ayrılan kişinin kaydı onayın geri alınmasından 3 yıl sonra silinir (worker/saklama.js).
import { json, hata, simdi, kimlik, kirp, ozet, islemYaz, EPOSTA_DESEN, ayniKaynak, govdeOku, ipAl, robotDogrula, GUVENLIK_BASLIKLARI } from './ortak.js';

// Onay metni değişirse sürüm artırılır; hangi kişinin hangi metne onay verdiği böylece bilinir.
export const ONAY_SURUM = '2026-10-23';

const sayfa = (baslik, govde) => new Response(`<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>${baslik} | Idexya</title>
<style>body{margin:0;font-family:system-ui,sans-serif;background:#FBF8F4;color:#2A2622;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:24px;box-sizing:border-box}main{max-width:460px;background:#fff;border:1px solid #E9DED2;border-radius:20px;padding:32px}h1{margin:0 0 12px;color:#002559;font-size:24px}p{line-height:1.6}button{min-height:48px;padding:0 22px;border:0;border-radius:12px;background:#B84406;color:#fff;font:inherit;font-weight:700;cursor:pointer}a{color:#B84406;font-weight:600}</style></head><body><main>${govde}</main></body></html>`,
  { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', ...GUVENLIK_BASLIKLARI } });

export async function bultenApi(istek, env, yol) {
  const db = env.DB;
  if (yol === '' && istek.method === 'POST') {
    if (!ayniKaynak(istek)) return hata('Geçersiz istek', 403);
    const { g, hata: h } = await govdeOku(istek, 5000);
    if (h) return h;
    if (g.web_adresi_tekrar) return json({ ok: true });
    const eposta = kirp(g.eposta, 160).toLowerCase();
    if (!EPOSTA_DESEN.test(eposta)) return hata('E-posta adresi geçersiz', 422);
    if (g.onay !== true) return hata('Bülten için ticari ileti onayı gerekli', 422);
    const ip = ipAl(istek), ipOzet = await ozet(ip + (env.IP_TUZ || 'idexya'));
    const son = await db.prepare('SELECT COUNT(*) AS n FROM bulten WHERE ip_ozet = ? AND onay_zamani > ?').bind(ipOzet, new Date(Date.now() - 10 * 60000).toISOString()).first();
    if (son && son.n >= 5) return hata('Çok fazla deneme. Lütfen biraz sonra tekrar deneyin.', 429);
    const dogrulama = await robotDogrula(env, g.turnstile, ip);
    if (dogrulama === 'kaldi') return hata('Robot doğrulaması başarısız. Sayfayı yenileyip tekrar deneyin.', 403);
    const z = simdi(), sayfaYol = kirp(g.sayfa, 200);
    // Kayıtlı adres için aynı yanıt döner (listede kimin olduğu dışarıdan anlaşılmasın). Ayrılmış kişi yeniden onay verirse kayıt yeni onayla güncellenir.
    await db.prepare(`INSERT INTO bulten (id, eposta, durum, onay_zamani, onay_surum, sayfa, ip_ozet, dogrulama, ayrilma_anahtari)
      VALUES (?, ?, 'aktif', ?, ?, ?, ?, ?, ?)
      ON CONFLICT(eposta) DO UPDATE SET durum = 'aktif', onay_zamani = excluded.onay_zamani, onay_surum = excluded.onay_surum, sayfa = excluded.sayfa,
        ip_ozet = excluded.ip_ozet, dogrulama = excluded.dogrulama, ayrilma_zamani = NULL WHERE bulten.durum = 'ayrildi'`)
      .bind(kimlik(), eposta, z, ONAY_SURUM, sayfaYol, ipOzet, dogrulama, kimlik() + kimlik().slice(0, 8)).run();
    return json({ ok: true });
  }
  // Abonelikten çıkma: bağlantı e-postalara eklenecek. GET yalnızca onay düğmesini gösterir (bağlantı önizleyicileri yanlışlıkla çıkarmasın), POST çıkarır.
  if (yol === 'ayril') {
    const url = new URL(istek.url);
    const anahtar = kirp(url.searchParams.get('k'), 100);
    const kayit = anahtar ? await db.prepare('SELECT id, eposta, durum FROM bulten WHERE ayrilma_anahtari = ?').bind(anahtar).first() : null;
    if (!kayit) return sayfa('Bağlantı geçersiz', '<h1>Bağlantı geçersiz</h1><p>Bu bağlantı geçersiz ya da süresi dolmuş. Listeden çıkmak için <a href="mailto:info@idexya.com">info@idexya.com</a> adresine yazabilirsiniz.</p>');
    if (istek.method === 'POST') {
      if (kayit.durum === 'aktif') {
        await db.prepare("UPDATE bulten SET durum = 'ayrildi', ayrilma_zamani = ? WHERE id = ?").bind(simdi(), kayit.id).run();
        await islemYaz(db, 'Ziyaretçi', 'bulten_ayrildi', kayit.id);
      }
      return sayfa('Listeden çıktınız', '<h1>Listeden çıktınız</h1><p>Bültenimiz artık size gönderilmeyecek. Fikrinizi değiştirirseniz sitemizden yeniden abone olabilirsiniz.</p><p><a href="/">Ana sayfaya dön</a></p>');
    }
    if (kayit.durum === 'ayrildi') return sayfa('Listeden çıktınız', '<h1>Zaten listede değilsiniz</h1><p>Bu adres bülten listemizden daha önce çıkarıldı.</p><p><a href="/">Ana sayfaya dön</a></p>');
    return sayfa('Bültenden çık', `<h1>Bültenden çıkmak istiyor musunuz?</h1><p>Idexya bülteni artık gönderilmesin.</p><form method="post"><button type="submit">Listeden çık</button></form>`);
  }
  return hata('Bulunamadı', 404);
}

export async function yonetimBultenApi(db, yontem, yol, govde, kim) {
  if (yol === 'bulten' && yontem === 'GET') {
    const r = await db.prepare('SELECT id, eposta, durum, onay_zamani, onay_surum, sayfa, ayrilma_zamani FROM bulten ORDER BY onay_zamani DESC LIMIT 2000').all();
    return json({ ok: true, kayitlar: r.results, surum: ONAY_SURUM });
  }
  const m = yol.match(/^bulten\/([\w-]+)\/cikar$/);
  if (m && yontem === 'POST') {
    const r = await db.prepare("UPDATE bulten SET durum = 'ayrildi', ayrilma_zamani = ? WHERE id = ? AND durum = 'aktif'").bind(simdi(), m[1]).run();
    if (!r.meta || !r.meta.changes) return hata('Kayıt bulunamadı ya da zaten listede değil', 404);
    await islemYaz(db, kim.eposta, 'bulten_cikarildi', m[1]);
    return json({ ok: true });
  }
  return null;
}
