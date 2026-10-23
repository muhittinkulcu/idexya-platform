// Müşteri alanı (23 Eki 2026): üyeleri CRM müşterisine bağlama (uye_musteri) ve davetle üyelik (davetler).
// Davet bağlantısındaki jetonun yalnız özeti saklanır; bağlantı yöneticiye bir kez gösterilir. Uygulama e-posta göndermez:
// bağlantıyı yönetici kendisi iletir. Davetli kişi /uye-ol?davet=… sayfasından kaydolur; e-posta davetle aynıysa üyelik onaylı açılır.
import { json, hata, simdi, kirp, kimlik, ozet, islemYaz, EPOSTA_DESEN } from './ortak.js';
import { MODULLER, YETKILER } from './moduller.js';

export const DAVET_GUN = 14;
const kodla = (b) => btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const JETON_DESEN = /^[A-Za-z0-9_-]{30,80}$/;
const musteriAdi = (m) => m.firma || m.ad || m.eposta || 'Adsız müşteri';

// Kullanılabilir davet (yoksa null). Jeton biçimsizse sorgu yapılmaz.
export async function davetBul(db, jeton) {
  if (typeof jeton !== 'string' || !JETON_DESEN.test(jeton)) return null;
  const d = await db.prepare('SELECT * FROM davetler WHERE ozet = ?').bind(await ozet('davet:' + jeton)).first();
  if (!d || d.kullanildi || d.iptal || d.bitis < simdi()) return null;
  return d;
}
const davetModulleri = (d) => {
  let m = {};
  try { m = JSON.parse(d.moduller || '{}') || {}; } catch (e) { m = {}; }
  return MODULLER.filter((x) => YETKILER[m[x.k]]).map((x) => ({ modul: x.k, yetki: m[x.k] }));
};

// Kayıt sırasında davetle açılan üyeliğin ek işlemleri (worker/uye.js tek batch içinde çalıştırır).
export async function davetSorgulari(db, d, uyeId, z) {
  const q = [db.prepare('UPDATE davetler SET kullanildi = ?, uye_id = ? WHERE ozet = ?').bind(z, uyeId, d.ozet)];
  for (const m of davetModulleri(d)) q.push(db.prepare('INSERT INTO uye_moduller (uye_id, modul, yetki, verildi, veren) VALUES (?, ?, ?, ?, ?)').bind(uyeId, m.modul, m.yetki, z, 'Davet · ' + d.olusturan));
  if (d.musteri_id) {
    q.push(db.prepare('INSERT INTO uye_musteri (uye_id, musteri_id, baglayan, zaman) SELECT ?, id, ?, ? FROM musteriler WHERE id = ?').bind(uyeId, 'Davet · ' + d.olusturan, z, d.musteri_id));
    q.push(db.prepare('INSERT INTO kayitlar (id, musteri_id, zaman, tur, baslik, detay, kim) SELECT ?, id, ?, ?, ?, ?, ? FROM musteriler WHERE id = ?').bind(kimlik(), z, 'sistem', 'Davetli kişi üye oldu', d.eposta, 'Web sitesi', d.musteri_id));
  }
  return q;
}

export async function yonetimPortalApi(db, yontem, yol, govde, kim) {
  if (yol === 'portal/erisimler' && yontem === 'GET') {
    const [u, mo, mu] = await db.batch([
      db.prepare(`SELECT u.id, u.ad, u.eposta, u.firma, u.olusturma, u.son_giris, um.musteri_id, um.baglayan, um.zaman AS baglanma,
          m.firma AS m_firma, m.ad AS m_ad, m.eposta AS m_eposta,
          (SELECT o.id FROM musteriler o WHERE um.musteri_id IS NULL AND o.eposta = u.eposta LIMIT 1) AS oneri_id
        FROM uyeler u LEFT JOIN uye_musteri um ON um.uye_id = u.id LEFT JOIN musteriler m ON m.id = um.musteri_id
        WHERE u.durum = 'onayli' ORDER BY u.ad`),
      db.prepare("SELECT um.uye_id, um.modul, um.yetki FROM uye_moduller um JOIN uyeler u ON u.id = um.uye_id WHERE u.durum = 'onayli'"),
      db.prepare('SELECT id, firma, ad, eposta FROM musteriler ORDER BY COALESCE(firma, ad, eposta)')
    ]);
    const moduller = {};
    mo.results.forEach((x) => { (moduller[x.uye_id] = moduller[x.uye_id] || []).push({ modul: x.modul, yetki: x.yetki }); });
    return json({ ok: true,
      uyeler: u.results.map((x) => ({ id: x.id, ad: x.ad, eposta: x.eposta, firma: x.firma, olusturma: x.olusturma, son_giris: x.son_giris, musteri_id: x.musteri_id || null,
        musteri_ad: x.musteri_id ? musteriAdi({ firma: x.m_firma, ad: x.m_ad, eposta: x.m_eposta }) : null, baglayan: x.baglayan, baglanma: x.baglanma, oneri_id: x.oneri_id, moduller: moduller[x.id] || [] })),
      musteriler: mu.results.map((x) => ({ id: x.id, ad: musteriAdi(x), alt: x.firma && x.ad ? x.ad : x.eposta || '' })),
      katalog: MODULLER, yetkiler: YETKILER });
  }
  let m = yol.match(/^portal\/erisimler\/([\w-]+)\/(bagla|coz)$/);
  if (m && yontem === 'POST') {
    const u = await db.prepare('SELECT id, ad FROM uyeler WHERE id = ?').bind(m[1]).first();
    if (!u) return hata('Üye bulunamadı', 404);
    const z = simdi();
    if (m[2] === 'coz') {
      const b = await db.prepare('SELECT musteri_id FROM uye_musteri WHERE uye_id = ?').bind(u.id).first();
      if (!b) return hata('Bu üye bir müşteriye bağlı değil', 404);
      await db.batch([
        db.prepare('DELETE FROM uye_musteri WHERE uye_id = ?').bind(u.id),
        db.prepare('INSERT INTO kayitlar (id, musteri_id, zaman, tur, baslik, detay, kim) SELECT ?, id, ?, ?, ?, ?, ? FROM musteriler WHERE id = ?').bind(kimlik(), z, 'sistem', 'Üye bağlantısı kaldırıldı', u.ad, kim.eposta, b.musteri_id)
      ]);
      await islemYaz(db, kim.eposta, 'portal_coz', u.id, b.musteri_id);
      return json({ ok: true });
    }
    const mid = kirp(govde.musteri_id, 64);
    const mus = mid ? await db.prepare('SELECT id FROM musteriler WHERE id = ?').bind(mid).first() : null;
    if (!mus) return hata('Müşteri bulunamadı', 404);
    await db.batch([
      db.prepare('INSERT INTO uye_musteri (uye_id, musteri_id, baglayan, zaman) VALUES (?, ?, ?, ?) ON CONFLICT (uye_id) DO UPDATE SET musteri_id = excluded.musteri_id, baglayan = excluded.baglayan, zaman = excluded.zaman').bind(u.id, mus.id, kim.eposta, z),
      db.prepare('INSERT INTO kayitlar (id, musteri_id, zaman, tur, baslik, detay, kim) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(kimlik(), mus.id, z, 'sistem', 'Üye bu müşteriye bağlandı', u.ad, kim.eposta)
    ]);
    await islemYaz(db, kim.eposta, 'portal_bagla', u.id, mus.id);
    return json({ ok: true });
  }
  if (yol === 'portal/davetler' && yontem === 'GET') {
    const r = await db.prepare(`SELECT d.id, d.eposta, d.musteri_id, d.moduller, d.olusturma, d.bitis, d.olusturan, d.kullanildi, d.uye_id, d.iptal, d.iptal_eden,
        m.firma AS m_firma, m.ad AS m_ad, m.eposta AS m_eposta, u.ad AS uye_ad
      FROM davetler d LEFT JOIN musteriler m ON m.id = d.musteri_id LEFT JOIN uyeler u ON u.id = d.uye_id ORDER BY d.olusturma DESC LIMIT 500`).all();
    const z = simdi();
    return json({ ok: true, gun: DAVET_GUN, katalog: MODULLER, yetkiler: YETKILER, davetler: r.results.map((d) => ({
      id: d.id, eposta: d.eposta, musteri_id: d.musteri_id, musteri_ad: d.musteri_id && (d.m_firma || d.m_ad || d.m_eposta) ? musteriAdi({ firma: d.m_firma, ad: d.m_ad, eposta: d.m_eposta }) : null,
      moduller: davetModulleri(d), olusturma: d.olusturma, bitis: d.bitis, olusturan: d.olusturan, kullanildi: d.kullanildi, uye_id: d.uye_id, uye_ad: d.uye_ad, iptal: d.iptal, iptal_eden: d.iptal_eden,
      durum: d.kullanildi ? 'kullanildi' : d.iptal ? 'iptal' : d.bitis < z ? 'suresi_doldu' : 'bekliyor' })) });
  }
  if (yol === 'portal/davetler' && yontem === 'POST') {
    const eposta = kirp(govde.eposta, 160).toLowerCase();
    if (!EPOSTA_DESEN.test(eposta)) return hata('Geçerli bir e-posta adresi yazın', 422);
    if (await db.prepare('SELECT id FROM uyeler WHERE eposta = ?').bind(eposta).first()) return hata('Bu e-posta ile zaten bir üyelik var; Erişimler sekmesinden ya da Üyeler sayfasından yönetin', 409);
    const mid = kirp(govde.musteri_id, 64) || null;
    if (mid && !(await db.prepare('SELECT id FROM musteriler WHERE id = ?').bind(mid).first())) return hata('Müşteri bulunamadı', 404);
    const istenen = govde.moduller && typeof govde.moduller === 'object' && !Array.isArray(govde.moduller) ? govde.moduller : {};
    const moduller = {};
    for (const md of MODULLER) {
      const y = istenen[md.k] || null;
      if (y && !YETKILER[y]) return hata('Geçersiz yetki', 422);
      if (y) moduller[md.k] = y;
    }
    const jeton = kodla(crypto.getRandomValues(new Uint8Array(32)));
    const id = kimlik(), z = simdi(), bitis = new Date(Date.now() + DAVET_GUN * 86400000).toISOString();
    await db.prepare('INSERT INTO davetler (ozet, id, eposta, musteri_id, moduller, olusturma, bitis, olusturan) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(await ozet('davet:' + jeton), id, eposta, mid, JSON.stringify(moduller), z, bitis, kim.eposta).run();
    await islemYaz(db, kim.eposta, 'davet_olustur', id, `${eposta}${mid ? ' · müşteri ' + mid : ''} · ${Object.keys(moduller).join(', ') || 'bölüm yok'}`);
    return json({ ok: true, id, bitis, yol: '/uye-ol/?davet=' + jeton });
  }
  m = yol.match(/^portal\/davetler\/([\w-]+)\/iptal$/);
  if (m && yontem === 'POST') {
    const r = await db.prepare('UPDATE davetler SET iptal = ?, iptal_eden = ? WHERE id = ? AND kullanildi IS NULL AND iptal IS NULL').bind(simdi(), kim.eposta, m[1]).run();
    if (!r.meta || !r.meta.changes) return hata('Davet bulunamadı, kullanılmış ya da zaten iptal edilmiş', 404);
    await islemYaz(db, kim.eposta, 'davet_iptal', m[1]);
    return json({ ok: true });
  }
  return null;
}
