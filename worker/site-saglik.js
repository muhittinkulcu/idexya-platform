// Müşteri sitesi sağlık kontrolü (Muhittin, 26 Eki 2026): müşteri sitelerinin ana sayfası her gün bir kez okunur.
// Bakılanlar: site açılıyor mu (durum kodu, süre, https), hesap envanterindeki GTM / GA4 (G-…) / Meta piksel kimlikleri sayfa
// kaynağında görünüyor mu, alan adının bitiş tarihi (RDAP, haftada bir). Yalnız herkese açık sayfa okunur; giriş yapılmaz,
// form gönderilmez. GA4 ve piksel GTM içinden yükleniyorsa kaynakta görünmez; bu durumda hata değil bilgi notu verilir.
// Cloudflare ücretsiz planında çalıştırma başına alt istek sınırı (50) olduğu için zamanlayıcıda en çok 15 site kontrol edilir (Instagram ve IDOS çekimleri de aynı çalıştırmada).
import { json, hata, simdi, kimlik, kirp, islemYaz } from './ortak.js';

const EN_COK_SITE = 15, SAKLANAN = 30, ZAMAN_ASIMI = 15000, EN_COK_BAYT = 3 * 1024 * 1024;
const AJAN = 'IdexyaSiteKontrol/1.0 (+https://idexya.com)';

// Yalnız alan adlı http(s) adresleri: IP adresi, yerel ağ ve kullanıcı adı/parola içeren adresler kabul edilmez.
export function gecerliSite(a) {
  try {
    const u = new URL(a);
    if (!['https:', 'http:'].includes(u.protocol) || u.username || u.password || u.port) return null;
    const h = u.hostname.toLowerCase();
    if (!/^([a-z0-9-]+\.)+[a-z]{2,}$/.test(h) || /(^|\.)(localhost|local|internal|lan|home|corp)$/.test(h)) return null;
    return u.protocol + '//' + h + (u.pathname || '/');
  } catch (e) { return null; }
}

// Beklenen kimlikler hesap envanterinden (aktif ya da bekleyen erişimler) gelir.
async function beklenenler(db, musteriId) {
  const r = await db.prepare("SELECT platform, hesap_kimligi FROM hesap_envanteri WHERE musteri_id = ? AND durum != 'kaldirildi' AND hesap_kimligi IS NOT NULL AND platform IN ('gtm', 'ga4', 'meta_veri')").bind(musteriId).all();
  return { gtm: r.results.filter((x) => x.platform === 'gtm').map((x) => x.hesap_kimligi), ga4: r.results.filter((x) => x.platform === 'ga4' && /^G-/.test(x.hesap_kimligi)).map((x) => x.hesap_kimligi), piksel: r.results.filter((x) => x.platform === 'meta_veri').map((x) => x.hesap_kimligi) };
}

async function alanAdiBitisi(env, host) {
  const kok = host.split('.').slice(-(/\.(com|net|org|gen|biz|web|av|bel|k12|edu|gov)\.tr$/.test(host) ? 3 : 2)).join('.');
  try {
    const r = await fetch((env.RDAP_API || 'https://rdap.org/domain/') + encodeURIComponent(kok), { headers: { accept: 'application/rdap+json', 'user-agent': AJAN }, signal: AbortSignal.timeout(ZAMAN_ASIMI) });
    if (!r.ok) return { kok, bitis: null };
    const d = await r.json();
    const e = (d.events || []).find((x) => x.eventAction === 'expiration');
    return { kok, bitis: e && e.eventDate ? e.eventDate.slice(0, 10) : null };
  } catch (e) { return { kok, bitis: null }; }
}

// SITE_SAGLIK_TEST yalnız yerel denemede kullanılır: istek sahte sunucuya <sunucu>/<alan adı><yol> olarak gider.
async function sayfaOku(env, adres) {
  const bas = Date.now();
  try {
    const hedef = env.SITE_SAGLIK_TEST ? env.SITE_SAGLIK_TEST + '/' + new URL(adres).hostname + new URL(adres).pathname : adres;
    const r = await fetch(hedef, { redirect: 'follow', headers: { 'user-agent': AJAN, accept: 'text/html' }, signal: AbortSignal.timeout(ZAMAN_ASIMI) });
    let html = '';
    if (r.body) {
      const okuyucu = r.body.getReader(), parcalar = []; let boy = 0;
      for (;;) { const { done, value } = await okuyucu.read(); if (done) break; boy += value.length; parcalar.push(value); if (boy > EN_COK_BAYT) { await okuyucu.cancel(); break; } }
      html = new TextDecoder().decode(parcalar.length === 1 ? parcalar[0] : await new Blob(parcalar).arrayBuffer());
    }
    return { durum: r.status, sure: Date.now() - bas, son_adres: env.SITE_SAGLIK_TEST ? adres : r.url || adres, html };
  } catch (e) { return { durum: 0, sure: Date.now() - bas, son_adres: adres, html: '', hata: e && e.name === 'TimeoutError' ? 'Zaman aşımı (15 sn)' : 'Bağlantı kurulamadı' }; }
}

export async function siteKontrol(env, hedef, rdap) {
  const db = env.DB, sorunlar = [], notlar = [];
  const s = await sayfaOku(env, hedef.adres);
  const html = s.html;
  if (!s.durum) sorunlar.push({ onem: 'kritik', metin: `Site açılmadı: ${s.hata}` });
  else if (s.durum >= 500) sorunlar.push({ onem: 'kritik', metin: `Sunucu hatası (${s.durum})` });
  else if (s.durum === 403 || s.durum === 429) notlar.push(`Site otomatik kontrolü engelledi (${s.durum}); güvenlik duvarı olabilir, elle kontrol edin.`);
  else if (s.durum >= 400) sorunlar.push({ onem: 'kritik', metin: `Sayfa bulunamadı ya da erişilemedi (${s.durum})` });
  if (s.durum && !s.son_adres.startsWith('https://')) sorunlar.push({ onem: 'onemli', metin: 'Site https ile açılmıyor' });
  if (s.durum && s.sure > 5000) sorunlar.push({ onem: 'onemli', metin: `Sayfa yavaş açıldı (${(s.sure / 1000).toFixed(1).replace('.', ',')} sn)` });
  const bulunan = { gtm: [...new Set(html.match(/GTM-[A-Z0-9]{4,10}/g) || [])], ga4: [...new Set(html.match(/G-[A-Z0-9]{6,12}/g) || [])],
    piksel: [...new Set([...html.matchAll(/fbq\(\s*['"]init['"]\s*,\s*['"](\d{6,20})['"]/g)].map((m) => m[1]))] };
  const b = await beklenenler(db, hedef.musteri_id);
  const kontrolEdilebilir = s.durum >= 200 && s.durum < 400;
  if (kontrolEdilebilir) {
    for (const g of b.gtm) if (!html.includes(g)) sorunlar.push({ onem: 'kritik', metin: `GTM kapsayıcısı ${g} sayfada yok; etiketler çalışmıyor olabilir` });
    const gtmVar = bulunan.gtm.length > 0;
    for (const g of b.ga4) if (!html.includes(g)) (gtmVar ? notlar.push(`GA4 ${g} sayfa kaynağında görünmedi (GTM üzerinden yükleniyor olabilir)`) : sorunlar.push({ onem: 'kritik', metin: `GA4 ${g} sayfada yok ve GTM de yüklenmiyor` }));
    for (const p of b.piksel) if (!html.includes(p)) (gtmVar ? notlar.push(`Meta pikseli ${p} sayfa kaynağında görünmedi (GTM üzerinden yükleniyor olabilir)`) : sorunlar.push({ onem: 'kritik', metin: `Meta pikseli ${p} sayfada yok ve GTM de yüklenmiyor` }));
    const yabanci = bulunan.gtm.filter((g) => b.gtm.length && !b.gtm.includes(g));
    if (yabanci.length) sorunlar.push({ onem: 'onemli', metin: `Envanterde olmayan GTM kapsayıcısı var: ${yabanci.join(', ')}` });
    if (!b.gtm.length && !b.ga4.length && !b.piksel.length) notlar.push('Hesap envanterinde bu müşteri için GTM, GA4 (G-…) ya da piksel kimliği yok; etiket kontrolü yapılmadı.');
  }
  let alan = hedef.alan_bitis ? { kok: hedef.alan_kok, bitis: hedef.alan_bitis } : null;
  if (rdap) { const a = await alanAdiBitisi(env, new URL(hedef.adres).hostname); if (a.bitis || !alan) alan = a; }
  if (alan && alan.bitis) {
    const gun = Math.floor((Date.parse(alan.bitis) - Date.now()) / 86400000);
    if (gun < 0) sorunlar.push({ onem: 'kritik', metin: `Alan adı (${alan.kok}) süresi dolmuş görünüyor` });
    else if (gun <= 30) sorunlar.push({ onem: gun <= 7 ? 'kritik' : 'onemli', metin: `Alan adının (${alan.kok}) süresi ${gun} gün içinde doluyor` });
  }
  const z = simdi(), durum = sorunlar.some((x) => x.onem === 'kritik') ? 'kritik' : sorunlar.length ? 'uyari' : 'iyi';
  await db.batch([
    db.prepare('INSERT INTO site_saglik_sonuc (id, hedef_id, zaman, durum, http, sure, son_adres, bulunan, sorunlar, notlar) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(kimlik(), hedef.id, z, durum, s.durum, s.sure, s.son_adres.slice(0, 500), JSON.stringify(bulunan), JSON.stringify(sorunlar), JSON.stringify(notlar)),
    db.prepare('UPDATE site_saglik_hedef SET son_kontrol = ?, son_durum = ?, alan_kok = ?, alan_bitis = ?, rdap_zaman = CASE WHEN ? THEN ? ELSE rdap_zaman END WHERE id = ?')
      .bind(z, durum, alan ? alan.kok : null, alan ? alan.bitis : null, rdap ? 1 : 0, z, hedef.id),
    db.prepare(`DELETE FROM site_saglik_sonuc WHERE hedef_id = ? AND id NOT IN (SELECT id FROM site_saglik_sonuc WHERE hedef_id = ? ORDER BY zaman DESC LIMIT ${SAKLANAN})`).bind(hedef.id, hedef.id)
  ]);
  return { durum, sorunlar, notlar, http: s.durum, sure: s.sure };
}

// Zamanlayıcı: en uzun süredir kontrol edilmeyen 20 site. Alan adı bitişi (RDAP) haftada bir sorgulanır.
export async function siteSaglikCron(env) {
  const r = await env.DB.prepare(`SELECT * FROM site_saglik_hedef WHERE aktif = 1 ORDER BY COALESCE(son_kontrol, '') LIMIT ${EN_COK_SITE}`).all();
  const hafta = new Date(Date.now() - 7 * 86400000).toISOString();
  for (const h of r.results) { try { await siteKontrol(env, h, !h.rdap_zaman || h.rdap_zaman < hafta); } catch (e) { console.error('site sağlık', h.adres, e && e.message); } }
  return r.results.length;
}

export async function siteSaglikUyarilari(db) {
  const r = await db.prepare(`SELECT h.id, h.adres, h.son_durum, m.firma, m.ad FROM site_saglik_hedef h LEFT JOIN musteriler m ON m.id = h.musteri_id
    WHERE h.aktif = 1 AND h.son_durum IN ('kritik', 'uyari')`).all();
  return r.results;
}

export async function yonetimSiteSaglikApi(db, env, yontem, yol, govde, kim, url) {
  if (!(yol === 'site-saglik' || yol.startsWith('site-saglik/'))) return null;
  if (yol === 'site-saglik' && yontem === 'GET') {
    const arsiv = url && url.searchParams.get('arsiv') === '1';
    const [h, s, m, n] = await db.batch([
      db.prepare(`SELECT h.*, m.firma AS musteri_firma, m.ad AS musteri_ad FROM site_saglik_hedef h LEFT JOIN musteriler m ON m.id = h.musteri_id WHERE h.arsiv IS ${arsiv ? 'NOT ' : ''}NULL ORDER BY COALESCE(m.firma, m.ad), h.adres`),
      db.prepare(`SELECT s.* FROM site_saglik_sonuc s JOIN (SELECT hedef_id, MAX(zaman) AS z FROM site_saglik_sonuc GROUP BY hedef_id) x ON x.hedef_id = s.hedef_id AND x.z = s.zaman`),
      db.prepare('SELECT id, firma, ad FROM musteriler WHERE arsiv IS NULL ORDER BY COALESCE(firma, ad, eposta)'),
      db.prepare('SELECT COUNT(*) AS n FROM site_saglik_hedef WHERE arsiv IS NOT NULL')
    ]);
    const son = new Map(s.results.map((x) => [x.hedef_id, { ...x, bulunan: JSON.parse(x.bulunan || '{}'), sorunlar: JSON.parse(x.sorunlar || '[]'), notlar: JSON.parse(x.notlar || '[]') }]));
    const hedefler = [];
    for (const x of h.results) hedefler.push({ ...x, son: son.get(x.id) || null, beklenen: await beklenenler(db, x.musteri_id) });
    return json({ ok: true, hedefler, musteriler: m.results, sinir: EN_COK_SITE, arsivde: n.results[0].n });
  }
  if (yol === 'site-saglik' && yontem === 'POST') {
    const adres = gecerliSite(kirp(govde.adres, 500));
    if (!adres) return hata('Adres https://ornek.com biçiminde bir alan adı olmalı (IP adresi ve yerel adresler kabul edilmez)', 422);
    const mid = kirp(govde.musteri_id, 64);
    if (!mid || !(await db.prepare('SELECT id FROM musteriler WHERE id = ?').bind(mid).first())) return hata('Müşteri seçin', 422);
    if (await db.prepare('SELECT id FROM site_saglik_hedef WHERE adres = ?').bind(adres).first()) return hata('Bu adres zaten listede (arşivde olabilir; "Arşivi göster" ile bakın)', 409);
    const n = await db.prepare('SELECT COUNT(*) AS n FROM site_saglik_hedef WHERE aktif = 1').first();
    if (n.n >= EN_COK_SITE) return hata(`Günlük kontrol en çok ${EN_COK_SITE} siteyle sınırlı; önce bir siteyi kaldırın ya da durdurun`, 409);
    const id = kimlik();
    await db.prepare('INSERT INTO site_saglik_hedef (id, musteri_id, adres, aktif, olusturma, ekleyen) VALUES (?, ?, ?, 1, ?, ?)').bind(id, mid, adres, simdi(), kim.eposta).run();
    await islemYaz(db, kim.eposta, 'site_saglik_eklendi', id, adres);
    return json({ ok: true, id });
  }
  // Toplu işlem (toplu seçim kuralı): durdur, başlat, arşivle, arşivden çıkar. Silme yoktur; arşivlenen site kontrol edilmez.
  if (yol === 'site-saglik/toplu' && yontem === 'POST') {
    const ids = Array.isArray(govde.ids) ? [...new Set(govde.ids.filter((x) => typeof x === 'string' && /^[\w-]{1,64}$/.test(x)))] : [];
    if (!ids.length || ids.length > 500) return hata('1 ile 500 arasında site seçin', 422);
    const liste = JSON.stringify(ids), islem = govde.islem;
    if (islem === 'baslat') {
      const n = await db.prepare('SELECT COUNT(*) AS n FROM site_saglik_hedef WHERE aktif = 1 OR id IN (SELECT value FROM json_each(?)) AND arsiv IS NULL').bind(liste).first();
      if (n.n > EN_COK_SITE) return hata(`Günlük kontrol en çok ${EN_COK_SITE} siteyle sınırlı; daha az site seçin`, 409);
    }
    const sql = { durdur: 'aktif = 0 WHERE arsiv IS NULL AND', baslat: 'aktif = 1 WHERE arsiv IS NULL AND', arsivle: 'aktif = 0, arsiv = ? WHERE arsiv IS NULL AND', arsivden_cikar: 'arsiv = NULL WHERE arsiv IS NOT NULL AND' }[islem];
    if (!sql) return hata('Geçersiz işlem', 422);
    const r = await db.prepare(`UPDATE site_saglik_hedef SET ${sql} id IN (SELECT value FROM json_each(?))`).bind(...(islem === 'arsivle' ? [simdi()] : []), liste).run();
    const n = r.meta ? r.meta.changes : null;
    await islemYaz(db, kim.eposta, 'site_saglik_toplu_' + islem, null, `${n} site`);
    return json({ ok: true, degisen: n });
  }
  const m = yol.match(/^site-saglik\/([\w-]+)\/(kontrol|durdur|baslat|arsivle)$/);
  if (m && yontem === 'POST') {
    const h = await db.prepare('SELECT * FROM site_saglik_hedef WHERE id = ?').bind(m[1]).first();
    if (!h) return hata('Site bulunamadı', 404);
    if (m[2] === 'kontrol') {
      if (h.son_kontrol && Date.parse(h.son_kontrol) > Date.now() - 60000) return hata('Bu site az önce kontrol edildi; bir dakika sonra tekrar deneyin', 429);
      return json({ ok: true, ...(await siteKontrol(env, h, !h.rdap_zaman)) });
    }
    // Silme yerine arşiv: site ve kontrol geçmişi saklanır, günlük kontrol durur.
    if (m[2] === 'arsivle') {
      await db.prepare('UPDATE site_saglik_hedef SET aktif = 0, arsiv = ? WHERE id = ?').bind(simdi(), h.id).run();
      await islemYaz(db, kim.eposta, 'site_saglik_arsivlendi', h.id, h.adres);
      return json({ ok: true });
    }
    if (h.arsiv) return hata('Site arşivde; önce arşivden çıkarın', 409);
    await db.prepare('UPDATE site_saglik_hedef SET aktif = ? WHERE id = ?').bind(m[2] === 'baslat' ? 1 : 0, h.id).run();
    return json({ ok: true });
  }
  return hata('Bulunamadı', 404);
}
