// Üyelik: kayıt, giriş, oturum ve yönetim paneli üye işlemleri.
// Üye oturumu yönetim paneline hiçbir zaman erişim vermez; panel yalnız Cloudflare Access ile açılır.
import { json, hata, simdi, kimlik, kirp, ozet, islemYaz, EPOSTA_DESEN, ayniKaynak, govdeOku, ipAl, robotDogrula } from './ortak.js';
import { MODULLER, YETKILER, UYE_DURUM } from './moduller.js';
import { davetBul, davetSorgulari } from './portal.js';

const OTURUM_CEREZ = '__Host-idx_oturum';
const OTURUM_GUN = 30;
const TUR = 'pbkdf2-sha256-100000';
const kodla = (b) => btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const rastgele = (n) => kodla(crypto.getRandomValues(new Uint8Array(n)));
async function tamOzet(metin) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(metin));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
}
async function sifreOzet(sifre, tuz) {
  const anahtar = await crypto.subtle.importKey('raw', new TextEncoder().encode(sifre), 'PBKDF2', false, ['deriveBits']);
  const bit = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: new TextEncoder().encode(tuz), iterations: 100000 }, anahtar, 256);
  return kodla(bit);
}
function esit(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let f = 0; for (let i = 0; i < a.length; i++) f |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return f === 0;
}
function sifreKontrol(s) {
  if (typeof s !== 'string' || s.length < 10) return 'Şifre en az 10 karakter olmalı.';
  if (s.length > 200) return 'Şifre çok uzun.';
  if (!/[A-Za-zÇĞİÖŞÜçğıöşü]/.test(s) || !/\d/.test(s)) return 'Şifrede en az bir harf ve bir rakam olmalı.';
  return null;
}
function cerezOku(istek, ad) {
  const c = istek.headers.get('cookie') || '';
  for (const p of c.split(';')) { const [k, ...v] = p.trim().split('='); if (k === ad) return v.join('='); }
  return null;
}
function oturumCerezleri(jeton) {
  const yas = jeton ? OTURUM_GUN * 86400 : 0;
  return [
    `${OTURUM_CEREZ}=${jeton || ''}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${yas}`,
    `idx_uye=${jeton ? '1' : ''}; Path=/; Secure; SameSite=Lax; Max-Age=${yas}`
  ];
}
function cerezliJson(veri, cerezler, durum = 200) {
  const y = json(veri, durum);
  cerezler.forEach((c) => y.headers.append('Set-Cookie', c));
  return y;
}

// Geçerli oturumun üyesini döndürür (yoksa null). Askıya alınan / reddedilen üyenin oturumu geçersizdir.
export async function oturumUyesi(istek, db) {
  const jeton = cerezOku(istek, OTURUM_CEREZ);
  if (!jeton || jeton.length < 30) return null;
  const o = await tamOzet(jeton);
  const r = await db.prepare(`SELECT o.ozet, o.bitis, o.son_kullanim, u.* FROM oturumlar o JOIN uyeler u ON u.id = o.uye_id WHERE o.ozet = ?`).bind(o).first();
  if (!r || r.bitis < simdi() || !['onayli', 'bekliyor'].includes(r.durum)) return null;
  if (Date.parse(r.son_kullanim) < Date.now() - 3600 * 1000) await db.prepare('UPDATE oturumlar SET son_kullanim = ? WHERE ozet = ?').bind(simdi(), o).run();
  return r;
}

export async function uyeModulleri(db, uyeId) {
  const r = await db.prepare('SELECT modul, yetki FROM uye_moduller WHERE uye_id = ?').bind(uyeId).all();
  return r.results;
}

// --- Herkese açık üye uçları: /api/uye/* ---
export async function uyeApi(istek, env, yol) {
  const db = env.DB;
  const ip = ipAl(istek);
  const ipOzet = await ozet(ip + (env.IP_TUZ || 'idexya'));
  if (istek.method === 'POST' && !ayniKaynak(istek)) return hata('Geçersiz kaynak', 403);

  if (yol === 'ben' && istek.method === 'GET') {
    const u = await oturumUyesi(istek, db);
    if (!u) return cerezliJson({ ok: true, uye: null }, cerezOku(istek, 'idx_uye') ? oturumCerezleri(null) : []);
    const atanan = Object.fromEntries((await uyeModulleri(db, u.id)).map((m) => [m.modul, m.yetki]));
    const moduller = u.durum === 'onayli' ? MODULLER.filter((m) => atanan[m.k]).map((m) => ({ k: m.k, ad: m.ad, aciklama: m.aciklama, hazir: m.hazir, yetki: atanan[m.k], yetkiAd: YETKILER[atanan[m.k]] })) : [];
    return json({ ok: true, uye: { ad: u.ad, eposta: u.eposta, firma: u.firma, durum: u.durum, durumAd: UYE_DURUM[u.durum], olusturma: u.olusturma }, moduller });
  }
  if (istek.method !== 'POST') return hata('Bulunamadı', 404);
  const { g, hata: h } = await govdeOku(istek);
  if (h) return h;

  // Davet bağlantısı kontrolü (üye ol sayfası e-postayı doldurmak için çağırır). Jetonu bilen kişiye yalnız davetin e-postası döner.
  if (yol === 'davet') {
    const d = await davetBul(db, g.davet);
    return json({ ok: true, gecerli: !!d, eposta: d ? d.eposta : null });
  }

  if (yol === 'kayit') {
    if (g.web_adresi_tekrar) return json({ ok: true });
    const ad = kirp(g.ad, 120), eposta = kirp(g.eposta, 160).toLowerCase();
    if (!ad) return hata('Ad soyad gerekli.', 422);
    if (!EPOSTA_DESEN.test(eposta)) return hata('Geçerli bir e-posta adresi yazın.', 422);
    const sk = sifreKontrol(g.sifre); if (sk) return hata(sk, 422);
    if (g.kvkk !== true) return hata('KVKK aydınlatma metnini onaylayın.', 422);
    const son = await db.prepare("SELECT COUNT(*) AS n FROM islem_kaydi WHERE islem = 'uye_kayit' AND detay = ? AND zaman > ?").bind(ipOzet, new Date(Date.now() - 3600 * 1000).toISOString()).first();
    if (son.n >= 5) return hata('Çok fazla deneme. Lütfen bir saat sonra tekrar deneyin.', 429);
    const robot = await robotDogrula(env, g.turnstile, ip);
    if (robot === 'kaldi') return hata('Robot doğrulaması başarısız. Sayfayı yenileyip tekrar deneyin.', 403);
    const var_ = await db.prepare('SELECT id FROM uyeler WHERE eposta = ?').bind(eposta).first();
    // Davetle kayıt: jeton geçerli, kullanılmamış, süresi dolmamışsa ve e-posta davetle aynıysa üyelik onaylı açılır,
    // davetteki bölümler verilir ve üye müşteriye bağlanır. Davet jetonu yoksa aşağıdaki olağan akış aynen çalışır.
    if (g.davet !== undefined && g.davet !== null && g.davet !== '') {
      const d = await davetBul(db, g.davet);
      if (!d) { await islemYaz(db, 'Web sitesi', 'uye_kayit', null, ipOzet); return hata('Davet bağlantısı geçersiz, süresi dolmuş ya da daha önce kullanılmış. Yeni davet isteyin ya da davetsiz üyelik talebi gönderin.', 410); }
      if (d.eposta.toLowerCase() !== eposta) return hata('Bu davet başka bir e-posta adresi için oluşturuldu. Davetin gönderildiği adresi yazın.', 422);
      if (var_) return hata('Bu e-posta adresiyle zaten bir üyelik var. Giriş yapın; davet kullanılmadı.', 409);
      const z = simdi(), id = kimlik(), tuz = rastgele(16);
      const sifre = await sifreOzet(g.sifre, tuz);
      // Önce davet tek seferlik olarak ayrılır (aynı anda iki kayıt aynı daveti kullanamasın).
      const ayir = await db.prepare('UPDATE davetler SET kullanildi = ? WHERE ozet = ? AND kullanildi IS NULL AND iptal IS NULL AND bitis > ?').bind(z, d.ozet, z).run();
      if (!ayir.meta || !ayir.meta.changes) return hata('Davet bağlantısı geçersiz, süresi dolmuş ya da daha önce kullanılmış.', 410);
      try {
        await db.batch([
          db.prepare(`INSERT INTO uyeler (id, olusturma, guncelleme, ad, eposta, telefon, firma, neden, sifre_ozet, sifre_tuz, sifre_tur, durum, karar_zamani, karar_veren, kvkk_zamani, iys_izni)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'onayli', ?, ?, ?, ?)`).bind(id, z, z, ad, eposta, kirp(g.telefon, 40) || null, kirp(g.firma, 160) || null, kirp(g.neden, 1000) || null,
            sifre, tuz, TUR, z, 'Davet · ' + d.olusturan, z, g.iys === true ? 1 : 0),
          ...(await davetSorgulari(db, d, id, z))
        ]);
      } catch (e) {
        await db.prepare('UPDATE davetler SET kullanildi = NULL WHERE ozet = ? AND uye_id IS NULL').bind(d.ozet).run();
        throw e;
      }
      await islemYaz(db, 'Web sitesi', 'uye_kayit', id, ipOzet);
      await islemYaz(db, 'Web sitesi', 'davet_kullanildi', id, d.id);
      return json({ ok: true, onayli: true });
    }
    // Aynı e-posta zaten kayıtlıysa da aynı yanıt verilir: hangi adreslerin üye olduğu dışarıdan öğrenilemez.
    if (!var_) {
      const tuz = rastgele(16), z = simdi(), id = kimlik();
      await db.prepare(`INSERT INTO uyeler (id, olusturma, guncelleme, ad, eposta, telefon, firma, neden, sifre_ozet, sifre_tuz, sifre_tur, durum, kvkk_zamani, iys_izni)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'bekliyor', ?, ?)`).bind(id, z, z, ad, eposta, kirp(g.telefon, 40) || null, kirp(g.firma, 160) || null, kirp(g.neden, 1000) || null,
        await sifreOzet(g.sifre, tuz), tuz, TUR, z, g.iys === true ? 1 : 0).run();
      await islemYaz(db, 'Web sitesi', 'uye_kayit', id, ipOzet);
    } else {
      // Kayıtlı adreste de aynı süre harcanır: yanıt süresinden üyelik anlaşılmasın.
      await sifreOzet(g.sifre, rastgele(16));
      await islemYaz(db, 'Web sitesi', 'uye_kayit', null, ipOzet);
    }
    return json({ ok: true });
  }

  if (yol === 'giris') {
    const eposta = kirp(g.eposta, 160).toLowerCase();
    const sinir = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    // Kilit e-posta + IP başına (8) ve IP başına (30): başkası bir üyeyi her yerden kilitleyemez.
    // Adrese tüm IP'lerden gelen hata sayısı 50'yi geçerse yine durur (dağıtık deneme).
    const [e, i, t] = await db.batch([
      db.prepare('SELECT COUNT(*) AS n FROM giris_denemeleri WHERE eposta = ? AND ip_ozet = ? AND basarili = 0 AND zaman > ?').bind(eposta, ipOzet, sinir),
      db.prepare('SELECT COUNT(*) AS n FROM giris_denemeleri WHERE ip_ozet = ? AND basarili = 0 AND zaman > ?').bind(ipOzet, sinir),
      db.prepare('SELECT COUNT(*) AS n FROM giris_denemeleri WHERE eposta = ? AND basarili = 0 AND zaman > ?').bind(eposta, sinir)
    ]);
    if (e.results[0].n >= 8 || i.results[0].n >= 30 || t.results[0].n >= 50) return hata('Çok fazla hatalı deneme. 15 dakika sonra tekrar deneyin.', 429);
    const robot = await robotDogrula(env, g.turnstile, ip);
    if (robot === 'kaldi') return hata('Robot doğrulaması başarısız. Sayfayı yenileyip tekrar deneyin.', 403);
    const u = EPOSTA_DESEN.test(eposta) ? await db.prepare('SELECT * FROM uyeler WHERE eposta = ?').bind(eposta).first() : null;
    // Üye yoksa da şifre hesaplanır: yanıt süresinden adresin kayıtlı olup olmadığı anlaşılmasın.
    const hesap = await sifreOzet(String(g.sifre || ''), u ? u.sifre_tuz : 'yok-' + eposta);
    const dogru = !!u && esit(hesap, u.sifre_ozet);
    await db.prepare('INSERT INTO giris_denemeleri (id, zaman, eposta, ip_ozet, basarili) VALUES (?, ?, ?, ?, ?)').bind(kimlik(), simdi(), eposta, ipOzet, dogru ? 1 : 0).run();
    if (!dogru) return hata('E-posta veya şifre hatalı.', 401);
    if (!['onayli', 'bekliyor'].includes(u.durum)) return hata('Üyeliğiniz şu anda aktif değil. Bilgi için info@idexya.com adresine yazın.', 403);
    const jeton = rastgele(32), z = simdi();
    await db.batch([
      db.prepare('INSERT INTO oturumlar (ozet, uye_id, olusturma, bitis, son_kullanim) VALUES (?, ?, ?, ?, ?)').bind(await tamOzet(jeton), u.id, z, new Date(Date.now() + OTURUM_GUN * 86400 * 1000).toISOString(), z),
      db.prepare('UPDATE uyeler SET son_giris = ? WHERE id = ?').bind(z, u.id),
      db.prepare('DELETE FROM oturumlar WHERE bitis < ?').bind(z)
    ]);
    return cerezliJson({ ok: true, durum: u.durum }, oturumCerezleri(jeton));
  }

  if (yol === 'cikis') {
    const jeton = cerezOku(istek, OTURUM_CEREZ);
    if (jeton) await db.prepare('DELETE FROM oturumlar WHERE ozet = ?').bind(await tamOzet(jeton)).run();
    return cerezliJson({ ok: true }, oturumCerezleri(null));
  }

  if (yol === 'sifre-yenile') {
    const jeton = kirp(g.jeton, 200);
    const sk = sifreKontrol(g.sifre); if (sk) return hata(sk, 422);
    const o = jeton ? await tamOzet(jeton) : '';
    const r = o ? await db.prepare('SELECT * FROM sifre_yenileme WHERE ozet = ?').bind(o).first() : null;
    if (!r || r.kullanildi || r.bitis < simdi()) return hata('Bu bağlantı geçersiz veya süresi dolmuş. Yeni bağlantı isteyin.', 410);
    const tuz = rastgele(16), z = simdi();
    await db.batch([
      db.prepare('UPDATE uyeler SET sifre_ozet = ?, sifre_tuz = ?, sifre_tur = ?, guncelleme = ? WHERE id = ?').bind(await sifreOzet(g.sifre, tuz), tuz, TUR, z, r.uye_id),
      db.prepare('UPDATE sifre_yenileme SET kullanildi = ? WHERE ozet = ?').bind(z, o),
      db.prepare('DELETE FROM oturumlar WHERE uye_id = ?').bind(r.uye_id)
    ]);
    await islemYaz(db, 'Üye', 'uye_sifre_yenilendi', r.uye_id);
    return json({ ok: true });
  }

  if (yol === 'sifre-degistir') {
    const u = await oturumUyesi(istek, db);
    if (!u) return hata('Giriş yapın.', 401);
    const sinir = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const hatali = await db.prepare("SELECT COUNT(*) AS n FROM giris_denemeleri WHERE eposta = ? AND basarili = 0 AND zaman > ?").bind('sifre:' + u.eposta, sinir).first();
    if (hatali.n >= 5) return hata('Çok fazla hatalı deneme. 15 dakika sonra tekrar deneyin.', 429);
    if (!esit(await sifreOzet(String(g.eski || ''), u.sifre_tuz), u.sifre_ozet)) {
      await db.prepare('INSERT INTO giris_denemeleri (id, zaman, eposta, ip_ozet, basarili) VALUES (?, ?, ?, ?, 0)').bind(kimlik(), simdi(), 'sifre:' + u.eposta, ipOzet).run();
      return hata('Mevcut şifre hatalı.', 403);
    }
    const sk = sifreKontrol(g.yeni); if (sk) return hata(sk, 422);
    const tuz = rastgele(16), jeton = cerezOku(istek, OTURUM_CEREZ);
    await db.batch([
      db.prepare('UPDATE uyeler SET sifre_ozet = ?, sifre_tuz = ?, sifre_tur = ?, guncelleme = ? WHERE id = ?').bind(await sifreOzet(g.yeni, tuz), tuz, TUR, simdi(), u.id),
      db.prepare('DELETE FROM oturumlar WHERE uye_id = ? AND ozet != ?').bind(u.id, await tamOzet(jeton))
    ]);
    await islemYaz(db, u.eposta, 'uye_sifre_degisti', u.id);
    return json({ ok: true });
  }
  return hata('Bulunamadı', 404);
}

// --- Yönetim paneli üye uçları: /api/yonetim/uyeler*, /gruplar*, /moduller ---
export async function yonetimUyeApi(db, yontem, yol, govde, kim) {
  if (yol === 'moduller' && yontem === 'GET') return json({ ok: true, moduller: MODULLER, yetkiler: YETKILER, durumlar: UYE_DURUM });
  if (yol === 'gruplar' && yontem === 'GET') {
    const r = await db.prepare('SELECT g.*, (SELECT COUNT(*) FROM uye_gruplar ug WHERE ug.grup_id = g.id) AS uye_sayisi FROM gruplar g ORDER BY g.ad').all();
    return json({ ok: true, gruplar: r.results });
  }
  if (yol === 'gruplar' && yontem === 'POST') {
    const ad = kirp(govde.ad, 80);
    if (!ad) return hata('Grup adı gerekli', 422);
    if (await db.prepare('SELECT id FROM gruplar WHERE ad = ?').bind(ad).first()) return hata('Bu adla bir grup zaten var', 409);
    const id = kimlik();
    await db.prepare('INSERT INTO gruplar (id, ad, aciklama, olusturma) VALUES (?, ?, ?, ?)').bind(id, ad, kirp(govde.aciklama, 300) || null, simdi()).run();
    await islemYaz(db, kim.eposta, 'grup_olustur', id, ad);
    return json({ ok: true, id });
  }
  let m = yol.match(/^gruplar\/([\w-]+)\/sil$/);
  if (m && yontem === 'POST') {
    const gr = await db.prepare('SELECT * FROM gruplar WHERE id = ?').bind(m[1]).first();
    if (!gr) return hata('Grup bulunamadı', 404);
    await db.batch([db.prepare('DELETE FROM uye_gruplar WHERE grup_id = ?').bind(gr.id), db.prepare('DELETE FROM gruplar WHERE id = ?').bind(gr.id)]);
    await islemYaz(db, kim.eposta, 'grup_sil', gr.id, gr.ad);
    return json({ ok: true });
  }
  if (yol === 'uyeler' && yontem === 'GET') {
    const r = await db.prepare(`SELECT u.id, u.ad, u.eposta, u.firma, u.durum, u.olusturma, u.son_giris,
      (SELECT COUNT(*) FROM uye_moduller um WHERE um.uye_id = u.id) AS modul_sayisi FROM uyeler u ORDER BY u.olusturma DESC LIMIT 1000`).all();
    return json({ ok: true, uyeler: r.results });
  }
  m = yol.match(/^uyeler\/([\w-]+)$/);
  if (m && yontem === 'GET') {
    const u = await db.prepare('SELECT id, ad, eposta, telefon, firma, neden, durum, olusturma, guncelleme, karar_zamani, karar_veren, yonetici_notu, kvkk_zamani, iys_izni, son_giris FROM uyeler WHERE id = ?').bind(m[1]).first();
    if (!u) return hata('Üye bulunamadı', 404);
    const [mo, gr, kay, ot] = await db.batch([
      db.prepare('SELECT * FROM uye_moduller WHERE uye_id = ?').bind(u.id),
      db.prepare('SELECT grup_id FROM uye_gruplar WHERE uye_id = ?').bind(u.id),
      db.prepare("SELECT zaman, kim, islem, detay FROM islem_kaydi WHERE hedef = ? ORDER BY zaman DESC LIMIT 200").bind(u.id),
      db.prepare('SELECT COUNT(*) AS n FROM oturumlar WHERE uye_id = ? AND bitis > ?').bind(u.id, simdi())
    ]);
    return json({ ok: true, uye: u, moduller: mo.results, gruplar: gr.results.map((x) => x.grup_id), kayitlar: kay.results, acikOturum: ot.results[0].n });
  }
  m = yol.match(/^uyeler\/([\w-]+)\/(durum|moduller|gruplar|sifre-baglantisi|oturumlari-kapat)$/);
  if (!m || yontem !== 'POST') return null;
  const u = await db.prepare('SELECT id, durum, eposta FROM uyeler WHERE id = ?').bind(m[1]).first();
  if (!u) return hata('Üye bulunamadı', 404);
  const z = simdi();
  if (m[2] === 'durum') {
    if (!UYE_DURUM[govde.durum]) return hata('Geçersiz durum', 422);
    const q = [db.prepare('UPDATE uyeler SET durum = ?, karar_zamani = ?, karar_veren = ?, yonetici_notu = COALESCE(?, yonetici_notu), guncelleme = ? WHERE id = ?').bind(govde.durum, z, kim.eposta, kirp(govde.not, 1000) || null, z, u.id)];
    if (['reddedildi', 'askida'].includes(govde.durum)) q.push(db.prepare('DELETE FROM oturumlar WHERE uye_id = ?').bind(u.id));
    await db.batch(q);
    await islemYaz(db, kim.eposta, 'uye_durum', u.id, `${UYE_DURUM[u.durum]} → ${UYE_DURUM[govde.durum]}`);
    return json({ ok: true });
  }
  if (m[2] === 'moduller') {
    const istenen = govde.moduller && typeof govde.moduller === 'object' ? govde.moduller : {};
    const mevcut = Object.fromEntries((await uyeModulleri(db, u.id)).map((x) => [x.modul, x.yetki]));
    const q = [], deg = [];
    for (const md of MODULLER) {
      const y = istenen[md.k] || null;
      if (y && !YETKILER[y]) return hata('Geçersiz yetki', 422);
      if ((mevcut[md.k] || null) === y) continue;
      if (y) q.push(db.prepare('INSERT INTO uye_moduller (uye_id, modul, yetki, verildi, veren) VALUES (?, ?, ?, ?, ?) ON CONFLICT (uye_id, modul) DO UPDATE SET yetki = excluded.yetki, verildi = excluded.verildi, veren = excluded.veren').bind(u.id, md.k, y, z, kim.eposta));
      else q.push(db.prepare('DELETE FROM uye_moduller WHERE uye_id = ? AND modul = ?').bind(u.id, md.k));
      deg.push(`${md.ad}: ${mevcut[md.k] ? YETKILER[mevcut[md.k]] : 'kapalı'} → ${y ? YETKILER[y] : 'kapalı'}`);
    }
    if (q.length) { await db.batch(q); await islemYaz(db, kim.eposta, 'uye_modul', u.id, deg.join(' · ')); }
    return json({ ok: true, degisen: deg });
  }
  if (m[2] === 'gruplar') {
    const ids = Array.isArray(govde.gruplar) ? govde.gruplar.filter((x) => typeof x === 'string').slice(0, 100) : [];
    const gecerli = ids.length ? (await db.prepare(`SELECT id, ad FROM gruplar WHERE id IN (${ids.map(() => '?').join(',')})`).bind(...ids).all()).results : [];
    await db.batch([db.prepare('DELETE FROM uye_gruplar WHERE uye_id = ?').bind(u.id), ...gecerli.map((gx) => db.prepare('INSERT INTO uye_gruplar (uye_id, grup_id) VALUES (?, ?)').bind(u.id, gx.id))]);
    await islemYaz(db, kim.eposta, 'uye_grup', u.id, gecerli.map((x) => x.ad).join(', ') || 'grup yok');
    return json({ ok: true });
  }
  if (m[2] === 'sifre-baglantisi') {
    const jeton = rastgele(32);
    await db.prepare('INSERT INTO sifre_yenileme (ozet, uye_id, olusturma, bitis, olusturan) VALUES (?, ?, ?, ?, ?)').bind(await tamOzet(jeton), u.id, z, new Date(Date.now() + 86400 * 1000).toISOString(), kim.eposta).run();
    await islemYaz(db, kim.eposta, 'uye_sifre_baglantisi', u.id, '24 saat geçerli');
    // Jeton adresin # bölümünde: sunucu kayıtlarına ve yönlendiren başlığına düşmez.
    return json({ ok: true, yol: '/sifre-yenile#' + jeton });
  }
  if (m[2] === 'oturumlari-kapat') {
    await db.prepare('DELETE FROM oturumlar WHERE uye_id = ?').bind(u.id).run();
    await islemYaz(db, kim.eposta, 'uye_oturum_kapat', u.id);
    return json({ ok: true });
  }
  return null;
}
