// Müşteri alanı üye modülleri (Muhittin, 23 Eki 2026): "Teklif ve belgelerim" ve "Destek talepleri".
// Üye yalnız kendi CRM müşteri kaydına (uye_musteri) ait, gönderilmiş teklifleri ve yöneticinin açıkça paylaştığı belgeleri görür.
// Taslak teklifler ve paylaşılmamış belgeler hiçbir zaman üyeye dönmez. Uygulama e-posta göndermez.
import { json, hata, simdi, kimlik, kirp, islemYaz, ayniKaynak, govdeOku } from './ortak.js';
import { oturumUyesi, uyeModulleri } from './uye.js';
import { yonetimTeklifApi, TEKLIF_DURUM } from './teklif.js';
import { ekibeBildir, uyeyeBildir } from './eposta.js';

export const DESTEK_DURUM = { acik: 'Yanıt bekliyor', yanitlandi: 'Yanıtlandı', kapali: 'Kapandı' };
const MESAJ_SINIR = 4000;
const SAATLIK_MESAJ = 30, GUNLUK_TALEP = 10;
const bugun = () => new Date(Date.now() + 3 * 3600000).toISOString().slice(0, 10);
const BELGE_TUR = { sozlesme: 'Sözleşme', teklif: 'Teklif', fatura: 'Fatura', rapor: 'Rapor', diger: 'Diğer' };

// Oturum + modül yetkisi. { u, yetki, musteriId } ya da { y: hata yanıtı }
async function erisim(istek, db, modul) {
  const u = await oturumUyesi(istek, db);
  if (!u) return { y: hata('Giriş gerekli', 401) };
  if (u.durum !== 'onayli') return { y: hata('Üyeliğiniz henüz onaylanmadı', 403) };
  const m = (await uyeModulleri(db, u.id)).find((x) => x.modul === modul);
  if (!m) return { y: hata('Bu bölüm size açık değil', 403) };
  const b = await db.prepare('SELECT musteri_id FROM uye_musteri WHERE uye_id = ?').bind(u.id).first();
  return { u, yetki: m.yetki, musteriId: b ? b.musteri_id : null };
}

async function talepNo(db) {
  const r = await db.prepare("INSERT INTO destek_sayac (k, son) VALUES (1, 1) ON CONFLICT(k) DO UPDATE SET son = son + 1 RETURNING son").first();
  return 'D-' + String(r.son).padStart(5, '0');
}

// --- Üye uçları: /api/uye/belgelerim*, /api/uye/destek* ---
export async function uyeMusteriApi(istek, env, yol) {
  if (!/^(belgelerim|destek)(\/|$)/.test(yol)) return null;
  const db = env.DB, yontem = istek.method;
  if (yontem === 'POST' && !ayniKaynak(istek)) return hata('Geçersiz kaynak', 403);
  let g = {};
  if (yontem === 'POST') { const o = await govdeOku(istek); if (o.hata) return o.hata; g = o.g; }

  if (yol === 'belgelerim' || yol.startsWith('belgelerim/')) {
    const { u, yetki, musteriId, y } = await erisim(istek, db, 'belgelerim');
    if (y) return y;
    if (!musteriId) return json({ ok: true, bagli: false, teklifler: [], belgeler: [], yetki });
    if (yol === 'belgelerim' && yontem === 'GET') {
      const [t, b] = await db.batch([
        db.prepare(`SELECT id, no, baslik, durum, toplam, gecerlilik, gonderim_zamani, karar_zamani FROM teklifler
          WHERE musteri_id = ? AND durum IN ('gonderildi','kabul','red') ORDER BY COALESCE(gonderim_zamani, guncelleme) DESC LIMIT 200`).bind(musteriId),
        db.prepare(`SELECT b.id, b.ad, b.tur, b.baglanti, b.tarih, b.aciklama FROM belgeler b JOIN belge_paylasim p ON p.belge_id = b.id
          WHERE b.musteri_id = ? ORDER BY b.tarih DESC LIMIT 300`).bind(musteriId)
      ]);
      return json({ ok: true, bagli: true, yetki, bugun: bugun(), durumlar: TEKLIF_DURUM, belgeTurleri: BELGE_TUR, teklifler: t.results, belgeler: b.results });
    }
    let m = yol.match(/^belgelerim\/teklif\/([\w-]+)$/);
    if (m && yontem === 'GET') {
      const t = await db.prepare(`SELECT id, no, baslik, kalemler, kdv_orani, indirim, para, gecerlilik, notlar, durum, ara_toplam, kdv, toplam, gonderim_zamani, karar_zamani
        FROM teklifler WHERE id = ? AND musteri_id = ? AND durum IN ('gonderildi','kabul','red')`).bind(m[1], musteriId).first();
      if (!t) return hata('Teklif bulunamadı', 404);
      t.kalemler = JSON.parse(t.kalemler || '[]');
      return json({ ok: true, teklif: t, yetki, bugun: bugun(), durumlar: TEKLIF_DURUM });
    }
    m = yol.match(/^belgelerim\/teklif\/([\w-]+)\/(kabul|red)$/);
    if (m && yontem === 'POST') {
      if (yetki !== 'kullan') return hata('Bu bölümde yalnız görüntüleme yetkiniz var', 403);
      const t = await db.prepare("SELECT id, durum, gecerlilik FROM teklifler WHERE id = ? AND musteri_id = ? AND durum IN ('gonderildi','kabul','red')").bind(m[1], musteriId).first();
      if (!t) return hata('Teklif bulunamadı', 404);
      if (t.durum !== 'gonderildi') return hata('Bu teklif için karar zaten verilmiş', 409);
      if (m[2] === 'kabul' && t.gecerlilik && t.gecerlilik < bugun()) return hata('Teklifin geçerlilik süresi dolmuş; güncel teklif için bizimle iletişime geçin', 409);
      // Durum geçişi, CRM günlüğü ve aşama değişikliği yönetim tarafıyla aynı kodla yapılır.
      const y = await yonetimTeklifApi(db, 'POST', `teklifler/${t.id}/${m[2]}`, {}, { eposta: 'üye: ' + u.eposta });
      if (y.ok) {
        const d = await db.prepare('SELECT no, baslik, toplam FROM teklifler WHERE id = ?').bind(t.id).first();
        await ekibeBildir(env, `Teklif ${m[2] === 'kabul' ? 'kabul edildi' : 'reddedildi'}: ${d.no}`, [['Teklif', `${d.no} · ${d.baslik}`], ['Toplam (KDV dahil)', new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(d.toplam) + ' TL'], ['Karar veren', `${u.ad} (${u.eposta})`]],
          { metin: 'Teklifi aç', yol: `/yonetim/teklifler/?sekme=${m[2]}&id=${encodeURIComponent(t.id)}` });
      }
      return y;
    }
    return hata('Bulunamadı', 404);
  }

  if (yol === 'destek' || yol.startsWith('destek/')) {
    const { u, yetki, musteriId, y } = await erisim(istek, db, 'destek');
    if (y) return y;
    if (yol === 'destek' && yontem === 'GET') {
      const r = await db.prepare('SELECT id, no, konu, durum, olusturma, guncelleme, son_yazan FROM destek_talepleri WHERE uye_id = ? ORDER BY guncelleme DESC LIMIT 200').bind(u.id).all();
      return json({ ok: true, yetki, durumlar: DESTEK_DURUM, talepler: r.results });
    }
    if (yontem === 'POST' && yetki !== 'kullan') return hata('Bu bölümde yalnız görüntüleme yetkiniz var', 403);
    const sinirAsildi = async () => {
      const r = await db.prepare("SELECT COUNT(*) AS n FROM destek_mesajlari WHERE yazan = 'uye' AND yazan_id = ? AND zaman > ?").bind(u.id, new Date(Date.now() - 3600000).toISOString()).first();
      return r.n >= SAATLIK_MESAJ;
    };
    if (yol === 'destek' && yontem === 'POST') {
      const konu = kirp(g.konu, 160), metin = kirp(g.metin, MESAJ_SINIR);
      if (!konu) return hata('Konu gerekli', 422);
      if (!metin) return hata('Mesajınızı yazın', 422);
      const gun = await db.prepare('SELECT COUNT(*) AS n FROM destek_talepleri WHERE uye_id = ? AND olusturma > ?').bind(u.id, new Date(Date.now() - 86400000).toISOString()).first();
      if (gun.n >= GUNLUK_TALEP || (await sinirAsildi())) return hata('Kısa sürede çok fazla talep gönderildi. Biraz sonra tekrar deneyin.', 429);
      const id = kimlik(), z = simdi(), no = await talepNo(db);
      await db.batch([
        db.prepare("INSERT INTO destek_talepleri (id, no, uye_id, musteri_id, konu, durum, olusturma, guncelleme, son_yazan) VALUES (?, ?, ?, ?, ?, 'acik', ?, ?, 'uye')").bind(id, no, u.id, musteriId, konu, z, z),
        db.prepare("INSERT INTO destek_mesajlari (id, talep_id, yazan, yazan_id, ad, metin, zaman) VALUES (?, ?, 'uye', ?, ?, ?, ?)").bind(kimlik(), id, u.id, u.ad, metin, z)
      ]);
      await islemYaz(db, 'üye: ' + u.eposta, 'destek_acildi', id, `${no} · ${konu}`);
      await ekibeBildir(env, `Yeni destek talebi: ${konu}`, [['Talep', no], ['Üye', `${u.ad} (${u.eposta})`], ['Mesaj', metin.slice(0, 1500)]], { metin: 'Talebi aç', yol: `/yonetim/destek/?t=${encodeURIComponent(id)}` }, u.eposta);
      return json({ ok: true, id, no });
    }
    const m = yol.match(/^destek\/([\w-]+)(?:\/(mesaj|kapat))?$/);
    if (!m) return hata('Bulunamadı', 404);
    const talep = await db.prepare('SELECT * FROM destek_talepleri WHERE id = ? AND uye_id = ?').bind(m[1], u.id).first();
    if (!talep) return hata('Talep bulunamadı', 404);
    if (!m[2] && yontem === 'GET') {
      const r = await db.prepare('SELECT yazan, ad, metin, zaman FROM destek_mesajlari WHERE talep_id = ? ORDER BY zaman LIMIT 500').bind(talep.id).all();
      return json({ ok: true, yetki, durumlar: DESTEK_DURUM, talep: { id: talep.id, no: talep.no, konu: talep.konu, durum: talep.durum, olusturma: talep.olusturma }, mesajlar: r.results });
    }
    if (m[2] === 'mesaj' && yontem === 'POST') {
      const metin = kirp(g.metin, MESAJ_SINIR);
      if (!metin) return hata('Mesajınızı yazın', 422);
      if (await sinirAsildi()) return hata('Kısa sürede çok fazla mesaj gönderildi. Biraz sonra tekrar deneyin.', 429);
      const z = simdi();
      // Kapanmış talebe yazılırsa talep yeniden açılır.
      await db.batch([
        db.prepare("INSERT INTO destek_mesajlari (id, talep_id, yazan, yazan_id, ad, metin, zaman) VALUES (?, ?, 'uye', ?, ?, ?, ?)").bind(kimlik(), talep.id, u.id, u.ad, metin, z),
        db.prepare("UPDATE destek_talepleri SET durum = 'acik', son_yazan = 'uye', guncelleme = ? WHERE id = ?").bind(z, talep.id)
      ]);
      await ekibeBildir(env, `Destek talebine yeni mesaj: ${talep.konu}`, [['Talep', talep.no], ['Üye', `${u.ad} (${u.eposta})`], ['Mesaj', metin.slice(0, 1500)]], { metin: 'Talebi aç', yol: `/yonetim/destek/?t=${encodeURIComponent(talep.id)}` }, u.eposta);
      return json({ ok: true });
    }
    if (m[2] === 'kapat' && yontem === 'POST') {
      await db.prepare("UPDATE destek_talepleri SET durum = 'kapali', guncelleme = ? WHERE id = ?").bind(simdi(), talep.id).run();
      await islemYaz(db, 'üye: ' + u.eposta, 'destek_kapandi', talep.id, talep.no);
      return json({ ok: true });
    }
    return hata('Bulunamadı', 404);
  }
  return null;
}

// --- Yönetim uçları: /api/yonetim/destek*, /api/yonetim/belgeler/:id/paylas ---
export async function yonetimMusteriAlaniApi(db, env, yontem, yol, govde, kim) {
  let m = yol.match(/^belgeler\/([\w-]+)\/paylas$/);
  if (m && yontem === 'POST') {
    const b = await db.prepare('SELECT id, ad, musteri_id FROM belgeler WHERE id = ?').bind(m[1]).first();
    if (!b) return hata('Belge bulunamadı', 404);
    if (govde.paylas && !b.musteri_id) return hata('Paylaşmak için belgeye önce bir müşteri seçin', 422);
    if (govde.paylas) await db.prepare('INSERT INTO belge_paylasim (belge_id, paylasan, zaman) VALUES (?, ?, ?) ON CONFLICT(belge_id) DO NOTHING').bind(b.id, kim.eposta, simdi()).run();
    else await db.prepare('DELETE FROM belge_paylasim WHERE belge_id = ?').bind(b.id).run();
    await islemYaz(db, kim.eposta, govde.paylas ? 'belge_paylasildi' : 'belge_paylasim_kaldirildi', b.id, b.ad);
    return json({ ok: true });
  }
  if (yol === 'belge-paylasim' && yontem === 'GET') {
    const r = await db.prepare('SELECT belge_id FROM belge_paylasim').all();
    return json({ ok: true, paylasilan: r.results.map((x) => x.belge_id) });
  }

  if (!(yol === 'destek' || yol.startsWith('destek/'))) return null;
  if (yol === 'destek' && yontem === 'GET') {
    const r = await db.prepare(`SELECT d.id, d.no, d.konu, d.durum, d.son_yazan, d.olusturma, d.guncelleme, d.musteri_id, u.ad AS uye_ad, u.eposta AS uye_eposta, u.firma AS uye_firma,
      mu.firma AS musteri_firma, mu.ad AS musteri_ad, (SELECT COUNT(*) FROM destek_mesajlari x WHERE x.talep_id = d.id) AS mesaj_sayisi
      FROM destek_talepleri d LEFT JOIN uyeler u ON u.id = d.uye_id LEFT JOIN musteriler mu ON mu.id = d.musteri_id ORDER BY d.guncelleme DESC LIMIT 1000`).all();
    return json({ ok: true, durumlar: DESTEK_DURUM, talepler: r.results });
  }
  m = yol.match(/^destek\/([\w-]+)(?:\/(yanit|durum))?$/);
  if (!m) return hata('Bulunamadı', 404);
  const t = await db.prepare('SELECT * FROM destek_talepleri WHERE id = ?').bind(m[1]).first();
  if (!t) return hata('Talep bulunamadı', 404);
  if (!m[2] && yontem === 'GET') {
    const [ms, u] = await db.batch([
      db.prepare('SELECT yazan, ad, metin, zaman FROM destek_mesajlari WHERE talep_id = ? ORDER BY zaman LIMIT 500').bind(t.id),
      db.prepare('SELECT ad, eposta, firma FROM uyeler WHERE id = ?').bind(t.uye_id)
    ]);
    return json({ ok: true, durumlar: DESTEK_DURUM, talep: t, uye: u.results[0] || null, mesajlar: ms.results });
  }
  if (m[2] === 'yanit' && yontem === 'POST') {
    const metin = kirp(govde.metin, MESAJ_SINIR);
    if (!metin) return hata('Yanıtı yazın', 422);
    const z = simdi(), kapat = !!govde.kapat;
    await db.batch([
      db.prepare("INSERT INTO destek_mesajlari (id, talep_id, yazan, yazan_id, ad, metin, zaman) VALUES (?, ?, 'ekip', ?, 'Idexya ekibi', ?, ?)").bind(kimlik(), t.id, kim.eposta, metin, z),
      db.prepare('UPDATE destek_talepleri SET durum = ?, son_yazan = ?, guncelleme = ? WHERE id = ?').bind(kapat ? 'kapali' : 'yanitlandi', 'ekip', z, t.id)
    ]);
    await islemYaz(db, kim.eposta, 'destek_yanitlandi', t.id, t.no);
    const uye = await db.prepare('SELECT eposta FROM uyeler WHERE id = ?').bind(t.uye_id).first();
    if (uye) await uyeyeBildir(env, uye.eposta, `Destek talebinize yanıt verildi: ${t.konu}`, [['Talep', t.no], ['Durum', kapat ? 'Kapandı' : 'Yanıtlandı']], { metin: 'Yanıtı görüntüle', yol: `/uye/destek/?t=${encodeURIComponent(t.id)}` });
    return json({ ok: true });
  }
  if (m[2] === 'durum' && yontem === 'POST') {
    if (!DESTEK_DURUM[govde.durum]) return hata('Geçersiz durum', 422);
    await db.prepare('UPDATE destek_talepleri SET durum = ?, guncelleme = ? WHERE id = ?').bind(govde.durum, simdi(), t.id).run();
    await islemYaz(db, kim.eposta, 'destek_durum', t.id, `${t.no} → ${DESTEK_DURUM[govde.durum]}`);
    return json({ ok: true });
  }
  return hata('Bulunamadı', 404);
}
