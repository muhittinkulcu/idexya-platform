// Veritabanı yedeği (Muhittin, 26 Eki 2026): D1'deki tablolar JSON olarak dışa aktarılır ve gzip ile sıkıştırılır.
// · YEDEK (R2) bağlıysa her gün zamanlayıcıyla yedek/<YYYY-AA-GG>.json.gz yazılır; son 30 gün saklanır.
// · R2 olmasa da panelden anlık yedek indirilebilir.
// Yedeğe girmeyenler: oturumlar, giriş denemeleri, şifre yenileme kayıtları (kısa ömürlü güvenlik verisi), IDOS'tan ve
// Instagram'dan yeniden çekilebilen tablolar ve ayarlar içindeki erişim anahtarları. Geri yükleme panelden yapılmaz (geri dönüşü zor işlem).
import { json, hata, simdi, islemYaz } from './ortak.js';

const HARIC = new Set(['oturumlar', 'giris_denemeleri', 'sifre_yenileme', 'instagram_akis', 'reklam_ozet', 'ana_musteri', 'ana_hesap_esleme', 'd1_migrations']);
const GIZLI_AYAR = new Set(['instagram_token']);
const SAKLAMA_GUN = 30;
const SAYFA = 500;
const ONEK = 'yedek/';

export const yedekKurulu = (env) => !!env.YEDEK;
const gunAdi = () => new Date(Date.now() + 3 * 3600000).toISOString().slice(0, 10);

async function tablolar(db) {
  const r = await db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY name").all();
  return r.results.map((x) => x.name).filter((t) => !HARIC.has(t) && /^[a-z_][a-z0-9_]*$/.test(t));
}

// Tüm tabloları sırayla okuyup tek JSON nesnesi üretir. Satırlar rowid sırasıyla sayfa sayfa alınır.
export async function yedekVerisi(db) {
  const veri = { surum: 1, uygulama: 'idexya-platform', zaman: simdi(), haric: [...HARIC], tablolar: {} };
  for (const t of await tablolar(db)) {
    const satirlar = [];
    for (let son = -1; ;) {
      const r = await db.prepare(`SELECT rowid AS _rowid, * FROM "${t}" WHERE rowid > ? ORDER BY rowid LIMIT ${SAYFA}`).bind(son).all();
      for (const x of r.results) { son = x._rowid; delete x._rowid; satirlar.push(x); }
      if (r.results.length < SAYFA) break;
    }
    veri.tablolar[t] = t === 'ayarlar' ? satirlar.filter((x) => !GIZLI_AYAR.has(x.anahtar)) : satirlar;
  }
  return veri;
}

const sikistir = (metin) => new Response(new Blob([metin]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer();

// R2'ye yazar ve eski yedekleri temizler. { anahtar, boyut, satir } döner.
export async function yedekAl(env, tetikleyen) {
  if (!yedekKurulu(env)) throw new Error('YEDEK (R2) bağlı değil');
  const veri = await yedekVerisi(env.DB);
  const satir = Object.values(veri.tablolar).reduce((s, x) => s + x.length, 0);
  const govde = await sikistir(JSON.stringify(veri));
  const anahtar = `${ONEK}${gunAdi()}.json.gz`;
  await env.YEDEK.put(anahtar, govde, { httpMetadata: { contentType: 'application/gzip' }, customMetadata: { satir: String(satir), tetikleyen: String(tetikleyen).slice(0, 120), zaman: veri.zaman } });
  const sinir = new Date(Date.now() - SAKLAMA_GUN * 86400000).toISOString().slice(0, 10);
  const liste = await env.YEDEK.list({ prefix: ONEK, limit: 1000 });
  const eski = liste.objects.filter((o) => o.key.slice(ONEK.length, ONEK.length + 10) < sinir).map((o) => o.key);
  if (eski.length) await env.YEDEK.delete(eski);
  await env.DB.prepare('INSERT INTO ayarlar (anahtar, deger, guncelleme, guncelleyen) VALUES (?, ?, ?, ?) ON CONFLICT(anahtar) DO UPDATE SET deger = excluded.deger, guncelleme = excluded.guncelleme, guncelleyen = excluded.guncelleyen')
    .bind('yedek_son', JSON.stringify({ anahtar, boyut: govde.byteLength, satir, zaman: veri.zaman }), simdi(), String(tetikleyen).slice(0, 120)).run();
  await islemYaz(env.DB, tetikleyen, 'yedek_alindi', anahtar, `${satir} satır · ${Math.round(govde.byteLength / 1024)} KB${eski.length ? ` · ${eski.length} eski yedek silindi` : ''}`);
  return { anahtar, boyut: govde.byteLength, satir };
}

export async function yedekDurum(env) {
  const r = await env.DB.prepare("SELECT deger FROM ayarlar WHERE anahtar = 'yedek_son'").first();
  let son = null; try { son = r ? JSON.parse(r.deger) : null; } catch (e) { son = null; }
  return { kurulu: yedekKurulu(env), son };
}

export async function yonetimYedekApi(db, env, yontem, yol, kim) {
  if (!(yol === 'yedek' || yol.startsWith('yedek/'))) return null;
  if (yol === 'yedek' && yontem === 'GET') {
    const d = await yedekDurum(env);
    let yedekler = [];
    if (d.kurulu) {
      const l = await env.YEDEK.list({ prefix: ONEK, limit: 1000, include: ['customMetadata'] });
      yedekler = l.objects.map((o) => ({ anahtar: o.key, boyut: o.size, zaman: o.customMetadata?.zaman || o.uploaded, satir: Number(o.customMetadata?.satir) || null, tetikleyen: o.customMetadata?.tetikleyen || null }))
        .sort((a, b) => (a.anahtar < b.anahtar ? 1 : -1));
    }
    const t = await tablolar(db);
    return json({ ok: true, ...d, saklamaGun: SAKLAMA_GUN, tablolar: t, haric: [...HARIC], yedekler });
  }
  if (yol === 'yedek/al' && yontem === 'POST') {
    if (!yedekKurulu(env)) return hata('YEDEK (R2) bağlı değil; yalnız “Şimdi indir” kullanılabilir', 409);
    try { return json({ ok: true, ...(await yedekAl(env, kim.eposta)) }); } catch (e) { return hata('Yedek alınamadı: ' + (e && e.message), 500); }
  }
  // Anlık yedek indirme (R2 gerekmez). Kişisel veri içerir: dosyayı güvenli bir yerde saklayın.
  if (yol === 'yedek/indir' && yontem === 'GET') {
    const veri = await yedekVerisi(db);
    const govde = await sikistir(JSON.stringify(veri));
    await islemYaz(db, kim.eposta, 'yedek_indirildi', null, `${Object.values(veri.tablolar).reduce((s, x) => s + x.length, 0)} satır · ${Math.round(govde.byteLength / 1024)} KB`);
    return new Response(govde, { headers: { 'Content-Type': 'application/gzip', 'Content-Disposition': `attachment; filename="idexya-yedek-${gunAdi()}.json.gz"`, 'Cache-Control': 'no-store' } });
  }
  const m = yol.match(/^yedek\/indir\/(\d{4}-\d{2}-\d{2})$/);
  if (m && yontem === 'GET') {
    if (!yedekKurulu(env)) return hata('YEDEK (R2) bağlı değil', 409);
    const o = await env.YEDEK.get(`${ONEK}${m[1]}.json.gz`);
    if (!o) return hata('Yedek bulunamadı', 404);
    await islemYaz(db, kim.eposta, 'yedek_indirildi', `${ONEK}${m[1]}.json.gz`, 'R2 yedeği indirildi');
    return new Response(o.body, { headers: { 'Content-Type': 'application/gzip', 'Content-Disposition': `attachment; filename="idexya-yedek-${m[1]}.json.gz"`, 'Cache-Control': 'no-store' } });
  }
  return hata('Bulunamadı', 404);
}
