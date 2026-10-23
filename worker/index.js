// Idexya Platform sunucu tarafı: talep formu ve yönetim paneli API'si.
// Statik sayfalar Workers Static Assets'ten gelir; bu dosya yalnız /api/* ve /yonetim* için çalışır.
import { jwtVerify, createRemoteJWKSet } from 'jose';
import { uyeApi, yonetimUyeApi } from './uye.js';
import { icerikApi, icerikSayfasi, yonetimIcerikApi } from './icerik.js';
import { asistanApi, yonetimAsistanApi } from './asistan.js';
import { GUVENLIK_BASLIKLARI, json, hata, simdi, kimlik, kirp, semaKur, ozet, islemYaz } from './ortak.js';
import { yonetimReklamApi, reklamCek, reklamKurulu } from './reklam.js';
import { saklamaUygula } from './saklama.js';
import { bultenApi, yonetimBultenApi } from './bulten.js';
import { instagramApi, yonetimInstagramApi } from './instagram.js';
import { medyaApi, yonetimSistemApi } from './sistem.js';
import { yonetimYayinApi } from './yayin.js';
import { yonetimTeklifApi } from './teklif.js';
import { yonetimCrmApi } from './crm.js';
import { yonetimPortalApi } from './portal.js';
import { denetimCalistir, yonetimDenetimApi } from './denetim.js';
import { olcumAl, yonetimOlcumApi } from './olcum.js';
import { yonetimGorevApi } from './gorev.js';
import { yonetimBelgeApi } from './belge.js';
import { yonetimMuhasebeApi } from './muhasebe.js';

const ASAMA_ADI = { yeni: 'Yeni', gorusme: 'Görüşülüyor', teklif: 'Teklif gönderildi', goruldu: 'Teklif görüldü', kazanildi: 'Kazanıldı', kaybedildi: 'Kaybedildi' };
const ASAMALAR = Object.keys(ASAMA_ADI);
const ALAN_ADI = { firma: 'Firma', ad: 'Yetkili kişi', eposta: 'E-posta', telefon: 'Telefon', sektor: 'Sektör', paket: 'Paket', deger: 'Tahmini değer' };
// --- Kimlik doğrulama (Cloudflare Access) ---
// Varsayılan kapalıdır: TEAM_DOMAIN ve POLICY_AUD tanımlı değilse yönetim paneli açılmaz.
// Yerel geliştirmede yalnız localhost'ta ve YEREL_GIRIS=evet iken açılır.
let jwks = null;
async function yonetici(istek, env) {
  const url = new URL(istek.url);
  if (env.YEREL_GIRIS === 'evet' && (url.hostname === 'localhost' || url.hostname === '127.0.0.1')) return { eposta: 'yerel@gelistirme' };
  if (!env.TEAM_DOMAIN || !env.POLICY_AUD) return null;
  const jeton = istek.headers.get('cf-access-jwt-assertion');
  if (!jeton) return null;
  try {
    jwks = jwks || createRemoteJWKSet(new URL(`${env.TEAM_DOMAIN}/cdn-cgi/access/certs`));
    const { payload } = await jwtVerify(jeton, jwks, { issuer: env.TEAM_DOMAIN, audience: env.POLICY_AUD });
    const izinli = (env.YONETICILER || '').split(',').map((x) => x.trim().toLowerCase()).filter(Boolean);
    const e = String(payload.email || '').toLowerCase();
    // İzinli yönetici listesi boşsa panel kapalıdır (Access politikası geniş olsa bile).
    if (!izinli.length || !e || !izinli.includes(e)) return null;
    return { eposta: e };
  } catch (e) {
    return null;
  }
}

// --- Herkese açık: talep formu ---
async function talepAl(istek, env) {
  const tip = istek.headers.get('content-type') || '';
  if (!tip.includes('application/json')) return hata('Geçersiz istek', 415);
  const boy = Number(istek.headers.get('content-length') || 0);
  if (boy > 20000) return hata('İstek çok büyük', 413);
  let g;
  try { const ham = await istek.text(); if (ham.length > 20000) return hata('İstek çok büyük', 413); g = JSON.parse(ham); } catch (e) { return hata('Geçersiz istek', 400); }
  if (!g || typeof g !== 'object' || Array.isArray(g)) return hata('Geçersiz istek', 400);
  if (g.web_adresi_tekrar) return json({ ok: true }); // tuzak alan doluysa robot: sessizce kabul et, kaydetme
  const ad = kirp(g.ad, 120), eposta = kirp(g.eposta, 160).toLowerCase(), telefon = kirp(g.telefon, 40);
  if (!ad) return hata('Ad soyad gerekli', 422);
  if (!eposta && !telefon) return hata('E-posta veya telefon gerekli', 422);
  if (eposta && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(eposta)) return hata('E-posta adresi geçersiz', 422);
  if (g.kvkk !== true) return hata('KVKK onayı gerekli', 422);

  const ip = istek.headers.get('cf-connecting-ip') || 'yerel';
  const ipOzet = await ozet(ip + (env.IP_TUZ || 'idexya'));
  await semaKur(env.DB);
  const son = await env.DB.prepare("SELECT COUNT(*) AS n FROM talepler WHERE ip_ozet = ? AND olusturma > ?").bind(ipOzet, new Date(Date.now() - 10 * 60 * 1000).toISOString()).first();
  if (son && son.n >= 5) return hata('Çok fazla deneme. Lütfen biraz sonra tekrar deneyin.', 429);

  let dogrulama = 'yapilandirilmadi';
  if (env.TURNSTILE_SECRET) {
    const f = new FormData();
    f.append('secret', env.TURNSTILE_SECRET); f.append('response', kirp(g.turnstile, 4096)); f.append('remoteip', ip);
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: f });
    const s = await r.json().catch(() => ({}));
    if (!s.success) return hata('Robot doğrulaması başarısız. Sayfayı yenileyip tekrar deneyin.', 403);
    dogrulama = 'gecti';
  }
  const ek = {};
  ['site', 'alan', 'paket', 'sihirbaz', 'not', 'sohbet'].forEach((k) => { if (g[k]) ek[k] = typeof g[k] === 'string' ? kirp(g[k], 1000) : JSON.stringify(g[k]).slice(0, 2000); });
  const kaynak = ['iletisim', 'analiz', 'paket', 'sihirbaz', 'asistan'].includes(g.kaynak) ? g.kaynak : 'form';
  await env.DB.prepare(`INSERT INTO talepler (id, olusturma, kaynak, sayfa, ad, firma, eposta, telefon, konu, mesaj, ek, iys_izni, ip_ozet, dogrulama)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(kimlik(), simdi(), kaynak, kirp(g.sayfa, 200), ad, kirp(g.firma, 160), eposta || null, telefon || null,
    kirp(g.konu, 120), kirp(g.mesaj, 4000), JSON.stringify(ek), g.iys === true ? 1 : 0, ipOzet, dogrulama).run();
  return json({ ok: true });
}

// --- Yönetim API'si ---
async function yonetimApi(istek, env, yol, kim) {
  const db = env.DB;
  await semaKur(db);
  const yontem = istek.method;
  if (yontem !== 'GET') {
    const kaynak = istek.headers.get('origin');
    if (!kaynak || new URL(kaynak).host !== new URL(istek.url).host) return hata('Geçersiz kaynak', 403);
  }
  let govde = {};
  if (yontem === 'POST') {
    const ham = await istek.text();
    if (ham.length > 300000) return hata('İstek çok büyük', 413);
    try { govde = JSON.parse(ham || '{}'); } catch (e) { return hata('Geçersiz istek', 400); }
    if (!govde || typeof govde !== 'object' || Array.isArray(govde)) return hata('Geçersiz istek', 400);
  }

  if (yol === 'ozet' && yontem === 'GET') {
    const [t, m, a, k, u, yo] = await db.batch([
      db.prepare("SELECT durum, COUNT(*) AS n FROM talepler GROUP BY durum"),
      db.prepare("SELECT COUNT(*) AS n, SUM(CASE WHEN asama NOT IN ('kazanildi','kaybedildi') THEN COALESCE(deger,0) ELSE 0 END) AS hat FROM musteriler"),
      db.prepare("SELECT asama, COUNT(*) AS n FROM musteriler GROUP BY asama"),
      db.prepare("SELECT k.zaman, k.tur, k.baslik, k.kim, m.firma, m.ad, m.id AS musteri_id FROM kayitlar k JOIN musteriler m ON m.id = k.musteri_id ORDER BY k.zaman DESC LIMIT 12"),
      db.prepare("SELECT durum, COUNT(*) AS n FROM uyeler GROUP BY durum"),
      db.prepare("SELECT COUNT(*) AS n FROM yorumlar WHERE durum = 'bekliyor'")
    ]);
    return json({ ok: true, kim: kim.eposta, talepler: t.results, musteri: m.results[0], asamalar: a.results, sonKayitlar: k.results, uyeler: u.results, bekleyenYorum: yo.results[0].n });
  }
  if (yol === 'grafik' && yontem === 'GET') {
    // Genel bakış grafikleri; yalnız okuma. Gün ve saatler İstanbul saatine göre (UTC+3, Türkiye yaz saati uygulamıyor). Spam sayılmaz.
    const once = (gun) => new Date(Date.now() - gun * 86400000).toISOString();
    const [gun, isi, sayfa, donem, mgun, asama, bekleyen] = await db.batch([
      db.prepare("SELECT date(olusturma, '+3 hours') AS gun, kaynak, COUNT(*) AS n FROM talepler WHERE durum != 'spam' AND olusturma >= ? GROUP BY gun, kaynak").bind(once(181)),
      db.prepare("SELECT CAST(strftime('%w', olusturma, '+3 hours') AS INTEGER) AS hg, CAST(strftime('%H', olusturma, '+3 hours') AS INTEGER) AS saat, COUNT(*) AS n FROM talepler WHERE durum != 'spam' AND olusturma >= ? GROUP BY hg, saat").bind(once(90)),
      db.prepare("SELECT COALESCE(NULLIF(sayfa, ''), '(bilinmiyor)') AS sayfa, COUNT(*) AS n FROM talepler WHERE durum != 'spam' AND olusturma >= ? GROUP BY 1 ORDER BY n DESC LIMIT 8").bind(once(30)),
      db.prepare("SELECT CASE WHEN olusturma >= ? THEN 'simdi' ELSE 'once' END AS donem, durum, COUNT(*) AS n FROM talepler WHERE olusturma >= ? GROUP BY donem, durum").bind(once(30), once(60)),
      db.prepare("SELECT date(olusturma, '+3 hours') AS gun, COUNT(*) AS n FROM musteriler WHERE olusturma >= ? GROUP BY gun").bind(once(61)),
      db.prepare("SELECT asama, COUNT(*) AS n, COALESCE(SUM(deger), 0) AS deger FROM musteriler GROUP BY asama"),
      db.prepare("SELECT COUNT(*) AS n, MIN(olusturma) AS en_eski FROM talepler WHERE durum = 'yeni' AND olusturma < ?").bind(once(1))
    ]);
    return json({ ok: true, bugun: new Date(Date.now() + 3 * 3600000).toISOString().slice(0, 10), gunluk: gun.results, isi: isi.results, sayfalar: sayfa.results,
      donem: donem.results, musteriGunluk: mgun.results, asamalar: asama.results, bekleyen24: bekleyen.results[0] });
  }
  if (yol === 'talepler' && yontem === 'GET') {
    const r = await db.prepare("SELECT * FROM talepler ORDER BY olusturma DESC LIMIT 200").all();
    return json({ ok: true, talepler: r.results });
  }
  let m = yol.match(/^talepler\/([\w-]+)\/(crm|spam|geri)$/);
  if (m && yontem === 'POST') {
    const t = await db.prepare('SELECT * FROM talepler WHERE id = ?').bind(m[1]).first();
    if (!t) return hata('Talep bulunamadı', 404);
    if (m[2] === 'spam' || m[2] === 'geri') {
      await db.prepare('UPDATE talepler SET durum = ? WHERE id = ?').bind(m[2] === 'spam' ? 'spam' : 'yeni', t.id).run();
      await islemYaz(db, kim.eposta, m[2] === 'spam' ? 'talep_spam' : 'talep_geri', t.id);
      return json({ ok: true });
    }
    if (t.musteri_id) return json({ ok: true, musteri_id: t.musteri_id });
    // Aynı e-posta veya telefonla kayıtlı müşteri varsa yeni kart açılmaz, mevcut karta eklenir.
    let mus = null;
    if (t.eposta) mus = await db.prepare('SELECT id FROM musteriler WHERE eposta = ?').bind(t.eposta).first();
    if (!mus && t.telefon) mus = await db.prepare('SELECT id FROM musteriler WHERE telefon = ?').bind(t.telefon).first();
    const z = simdi();
    const ek = JSON.parse(t.ek || '{}');
    const sorgular = [];
    let mid = mus && mus.id;
    if (!mid) {
      mid = kimlik();
      sorgular.push(db.prepare(`INSERT INTO musteriler (id, olusturma, guncelleme, firma, ad, eposta, telefon, kaynak, asama, paket, sorumlu) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'yeni', ?, ?)`)
        .bind(mid, z, z, t.firma || null, t.ad, t.eposta, t.telefon, t.kaynak, ek.paket || null, kim.eposta));
      sorgular.push(db.prepare('INSERT INTO kayitlar (id, musteri_id, zaman, tur, baslik, detay, kim) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(kimlik(), mid, z, 'sistem', 'Müşteri kartı oluşturuldu', null, kim.eposta));
    }
    const detay = [t.konu, t.mesaj, ek.paket ? 'Paket: ' + ek.paket : '', ek.site ? 'Site: ' + ek.site : ''].filter(Boolean).join(' · ');
    sorgular.push(db.prepare('INSERT INTO kayitlar (id, musteri_id, zaman, tur, baslik, detay, kim) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(kimlik(), mid, t.olusturma, 'talep', 'Talep geldi · ' + t.kaynak, detay, 'Web sitesi'));
    sorgular.push(db.prepare("UPDATE talepler SET durum = 'crm', musteri_id = ? WHERE id = ?").bind(mid, t.id));
    sorgular.push(db.prepare('UPDATE musteriler SET guncelleme = ? WHERE id = ?').bind(z, mid));
    await db.batch(sorgular);
    await islemYaz(db, kim.eposta, 'talep_crm', t.id, mid);
    return json({ ok: true, musteri_id: mid, mevcut: !!mus });
  }
  if (yol === 'musteriler' && yontem === 'GET') {
    const r = await db.prepare('SELECT id, firma, ad, eposta, telefon, asama, deger, paket, kaynak, guncelleme FROM musteriler ORDER BY guncelleme DESC LIMIT 500').all();
    return json({ ok: true, musteriler: r.results });
  }
  if (yol === 'musteriler' && yontem === 'POST') {
    const ad = kirp(govde.ad, 120), firma = kirp(govde.firma, 160), eposta = kirp(govde.eposta, 160).toLowerCase(), telefon = kirp(govde.telefon, 40);
    if (!ad && !firma) return hata('Firma veya kişi adı gerekli', 422);
    if (eposta && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(eposta)) return hata('E-posta adresi geçersiz', 422);
    let var_ = null;
    if (eposta) var_ = await db.prepare('SELECT id FROM musteriler WHERE eposta = ?').bind(eposta).first();
    if (!var_ && telefon) var_ = await db.prepare('SELECT id FROM musteriler WHERE telefon = ?').bind(telefon).first();
    if (var_) return json({ ok: true, musteri_id: var_.id, mevcut: true });
    const mid = kimlik(), z = simdi();
    await db.batch([
      db.prepare(`INSERT INTO musteriler (id, olusturma, guncelleme, firma, ad, eposta, telefon, kaynak, asama, sorumlu) VALUES (?, ?, ?, ?, ?, ?, ?, 'elle', 'yeni', ?)`).bind(mid, z, z, firma || null, ad || null, eposta || null, telefon || null, kim.eposta),
      db.prepare('INSERT INTO kayitlar (id, musteri_id, zaman, tur, baslik, detay, kim) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(kimlik(), mid, z, 'sistem', 'Müşteri kartı elle oluşturuldu', null, kim.eposta)
    ]);
    await islemYaz(db, kim.eposta, 'musteri_olustur', mid);
    return json({ ok: true, musteri_id: mid, mevcut: false });
  }
  m = yol.match(/^musteriler\/([\w-]+)$/);
  if (m && yontem === 'GET') {
    const mus = await db.prepare('SELECT * FROM musteriler WHERE id = ?').bind(m[1]).first();
    if (!mus) return hata('Müşteri bulunamadı', 404);
    const k = await db.prepare('SELECT * FROM kayitlar WHERE musteri_id = ? ORDER BY zaman DESC LIMIT 300').bind(m[1]).all();
    return json({ ok: true, musteri: mus, kayitlar: k.results });
  }
  m = yol.match(/^musteriler\/([\w-]+)\/(not|asama|bilgi)$/);
  if (m && yontem === 'POST') {
    const mus = await db.prepare('SELECT * FROM musteriler WHERE id = ?').bind(m[1]).first();
    if (!mus) return hata('Müşteri bulunamadı', 404);
    const z = simdi();
    if (m[2] === 'not') {
      const tur = ['not', 'gorusme', 'eposta', 'gorev'].includes(govde.tur) ? govde.tur : 'not';
      const metin = kirp(govde.metin, 4000);
      if (!metin) return hata('Not boş olamaz', 422);
      await db.batch([
        db.prepare('INSERT INTO kayitlar (id, musteri_id, zaman, tur, baslik, detay, kim) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(kimlik(), mus.id, z, tur, { not: 'Not eklendi', gorusme: 'Görüşme notu', eposta: 'E-posta notu', gorev: 'Görev' }[tur], metin, kim.eposta),
        db.prepare('UPDATE musteriler SET guncelleme = ? WHERE id = ?').bind(z, mus.id)
      ]);
    }
    if (m[2] === 'asama') {
      if (!ASAMALAR.includes(govde.asama)) return hata('Geçersiz aşama', 422);
      await db.batch([
        db.prepare('UPDATE musteriler SET asama = ?, guncelleme = ? WHERE id = ?').bind(govde.asama, z, mus.id),
        db.prepare('INSERT INTO kayitlar (id, musteri_id, zaman, tur, baslik, detay, kim) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(kimlik(), mus.id, z, 'sistem', 'Aşama değişti', (ASAMA_ADI[mus.asama] || mus.asama) + ' → ' + ASAMA_ADI[govde.asama], kim.eposta)
      ]);
    }
    if (m[2] === 'bilgi') {
      const alanlar = { firma: 160, ad: 120, eposta: 160, telefon: 40, sektor: 80, paket: 160 };
      if (typeof govde.eposta === 'string' && govde.eposta.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(govde.eposta.trim())) return hata('E-posta adresi geçersiz', 422);
      if (typeof govde.eposta === 'string') govde.eposta = govde.eposta.trim().toLowerCase();
      // Yalnız gerçekten değişen alanlar yazılır ve günlüğe işlenir.
      const deg = Object.keys(alanlar).filter((a) => typeof govde[a] === 'string' && (kirp(govde[a], alanlar[a]) || null) !== (mus[a] || null));
      let deger = govde.deger === undefined ? undefined : govde.deger === null || govde.deger === '' ? null : Number.isFinite(Number(govde.deger)) ? Math.max(0, Math.round(Number(govde.deger))) : 'hata';
      if (deger === 'hata') return hata('Değer yalnız rakam olmalı', 422);
      if (deger !== undefined && deger === (mus.deger ?? null)) deger = undefined;
      if (!deg.length && deger === undefined) return json({ ok: true, degisen: [] });
      const set = deg.map((a) => `${a} = ?`).concat(deger !== undefined ? ['deger = ?'] : []).concat(['guncelleme = ?']).join(', ');
      const deg2 = deg.map((a) => kirp(govde[a], alanlar[a]) || null).concat(deger !== undefined ? [deger] : []).concat([z]);
      await db.batch([
        db.prepare(`UPDATE musteriler SET ${set} WHERE id = ?`).bind(...deg2, mus.id),
        db.prepare('INSERT INTO kayitlar (id, musteri_id, zaman, tur, baslik, detay, kim) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(kimlik(), mus.id, z, 'sistem', 'Bilgiler güncellendi', deg.concat(deger !== undefined ? ['deger'] : []).map((a) => ALAN_ADI[a]).join(', '), kim.eposta)
      ]);
    }
    await islemYaz(db, kim.eposta, 'musteri_' + m[2], mus.id);
    return json({ ok: true });
  }
  const uyeYaniti = (await yonetimUyeApi(db, yontem, yol, govde, kim)) || (await yonetimIcerikApi(db, yontem, yol, govde, kim)) || (await yonetimAsistanApi(db, yontem, yol)) || (await yonetimReklamApi(db, env, yontem, yol, kim)) || (await yonetimBultenApi(db, yontem, yol, govde, kim)) || (await yonetimInstagramApi(db, yontem, yol, govde, kim)) || (await yonetimSistemApi(db, env, yontem, yol, govde, kim)) || (await yonetimYayinApi(db, env, istek, yontem, yol, govde, kim)) || (await yonetimTeklifApi(db, yontem, yol, govde, kim)) || (await yonetimCrmApi(db, env, yontem, yol, govde, kim)) || (await yonetimPortalApi(db, yontem, yol, govde, kim)) || (await yonetimDenetimApi(db, env, istek, yontem, yol, kim)) || (await yonetimOlcumApi(db, yontem, yol))
    || (await yonetimGorevApi(db, yontem, yol, govde, kim)) || (await yonetimBelgeApi(db, yontem, yol, govde, kim)) || (await yonetimMuhasebeApi(db, yontem, yol, govde, kim));
  if (uyeYaniti) return uyeYaniti;
  return hata('Bulunamadı', 404);
}

export default {
  async fetch(istek, env) {
    const url = new URL(istek.url);
    const yol = url.pathname;
    try {
      if (yol === '/api/talep') {
        if (istek.method !== 'POST') return hata('Yöntem desteklenmiyor', 405);
        return await talepAl(istek, env);
      }
      if (yol === '/api/icerik' || yol.startsWith('/api/icerik/')) {
        await semaKur(env.DB);
        return await icerikApi(istek, env, yol.slice('/api/icerik'.length).replace(/^\/|\/$/g, ''));
      }
      if (yol.startsWith('/api/medya/')) { await semaKur(env.DB); return await medyaApi(istek, env, yol.slice('/api/medya/'.length).replace(/\/$/, '')); }
      if (yol === '/api/instagram' || yol.startsWith('/api/instagram/')) { await semaKur(env.DB); return await instagramApi(istek, env, yol.slice('/api/instagram'.length).replace(/^\/|\/$/g, '')); }
      if (yol === '/api/bulten' || yol.startsWith('/api/bulten/')) { await semaKur(env.DB); return await bultenApi(istek, env, yol.slice('/api/bulten'.length).replace(/^\/|\/$/g, '')); }
      if (yol === '/api/olcum') { await semaKur(env.DB); return await olcumAl(istek, env); }
      if (yol.startsWith('/api/asistan/')) { await semaKur(env.DB); return await asistanApi(istek, env, yol.slice('/api/asistan/'.length).replace(/\/$/, '')); }
      if (yol.startsWith('/kabuk/')) return hata('Bulunamadı', 404);
      if (yol.startsWith('/uye/')) return Response.redirect(new URL('/icerik/', istek.url).toString(), 302);
      const icerikEslesme = yol.match(/^\/icerik\/([a-z0-9-]{1,80})\/?$/);
      if (icerikEslesme) { await semaKur(env.DB); return await icerikSayfasi(istek, env, icerikEslesme[1]); }
      if (yol.startsWith('/api/uye/')) {
        await semaKur(env.DB);
        return await uyeApi(istek, env, yol.slice('/api/uye/'.length).replace(/\/$/, ''));
      }
      if (yol.startsWith('/api/yonetim/') || yol === '/yonetim' || yol.startsWith('/yonetim/')) {
        const kim = await yonetici(istek, env);
        if (!kim) {
          if (yol.startsWith('/api/')) return hata('Giriş gerekli', 401);
          return new Response('Bu sayfa için giriş gerekli.', { status: 401, headers: { 'Content-Type': 'text/plain; charset=utf-8', ...GUVENLIK_BASLIKLARI } });
        }
        if (yol.startsWith('/api/yonetim/')) return await yonetimApi(istek, env, yol.slice('/api/yonetim/'.length).replace(/\/$/, ''), kim);
        const yanit = await env.ASSETS.fetch(istek);
        const y = new Response(yanit.body, yanit);
        Object.entries(GUVENLIK_BASLIKLARI).forEach(([k, v]) => y.headers.set(k, v));
        y.headers.set('Content-Security-Policy', "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; script-src 'self' 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
        return y;
      }
      if (yol.startsWith('/api/')) return hata('Bulunamadı', 404);
      return env.ASSETS.fetch(istek);
    } catch (e) {
      console.error('hata', yol, e && e.message);
      return hata('Beklenmeyen bir hata oluştu', 500);
    }
  },
  // Günlük zamanlayıcı (wrangler.jsonc triggers): saklama süresi dolan kişisel veriyi siler; IDOS reklam özetini
  // çeker (IDOS ayarı yoksa bu adım atlanır); pazartesileri site denetimini çalıştırır (worker/denetim.js).
  async scheduled(olay, env, ctx) {
    await semaKur(env.DB);
    ctx.waitUntil(saklamaUygula(env.DB).catch((e) => console.error('saklama', e && e.message)));
    if (reklamKurulu(env)) ctx.waitUntil(reklamCek(env, 'Zamanlayıcı'));
    // Haftalık site denetimi: pazartesi (UTC; zamanlayıcı 07.00 UTC'de çalışır).
    if (new Date(olay.scheduledTime || Date.now()).getUTCDay() === 1) ctx.waitUntil(denetimCalistir(env, 'idexya.com', 'Zamanlayıcı').catch((e) => console.error('denetim', e && e.message)));
  }
};
