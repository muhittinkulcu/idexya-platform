// Müşteri hesap envanteri (Muhittin, 26 Eki 2026): her CRM müşterisinin reklam, ölçüm ve satış hesapları ile
// bu hesaplara kimin, hangi düzeyde, ne zamandan beri eriştiği. Amaç müşteri/hesap karışıklığını ve unutulan erişimleri önlemek.
// Yalnız hesap adı ve kimliği saklanır; şifre, erişim anahtarı (token) ya da API anahtarı kabul edilmez.
import { json, hata, simdi, kimlik, kirp, islemYaz } from './ortak.js';
import { gecerliTarih } from './gorev.js';

// desen: hesap kimliği biçimi (boş bırakılabilir alanlar için null). ornek: formda yer tutucu.
export const PLATFORMLAR = {
  google_ads: { ad: 'Google Ads', desen: /^\d{3}-\d{3}-\d{4}$/, ornek: '123-456-7890', grup: 'Reklam' },
  meta_bm: { ad: 'Meta işletme portföyü', desen: /^\d{6,20}$/, ornek: 'Portföy kimliği (yalnız rakam)', grup: 'Reklam' },
  meta_reklam: { ad: 'Meta reklam hesabı', desen: /^(act_)?\d{6,20}$/, ornek: 'act_1234567890', grup: 'Reklam' },
  meta_veri: { ad: 'Meta piksel / veri seti', desen: /^\d{6,20}$/, ornek: 'Veri seti kimliği', grup: 'Ölçüm' },
  tiktok: { ad: 'TikTok reklam hesabı', desen: /^\d{6,25}$/, ornek: 'Reklamveren kimliği', grup: 'Reklam' },
  ga4: { ad: 'Google Analytics 4', desen: /^(\d{6,12}|G-[A-Z0-9]{6,12})$/, ornek: 'Mülk kimliği ya da G-XXXXXXX', grup: 'Ölçüm' },
  gtm: { ad: 'Google Etiket Yöneticisi', desen: /^GTM-[A-Z0-9]{4,10}$/, ornek: 'GTM-XXXXXXX', grup: 'Ölçüm' },
  search_console: { ad: 'Search Console', desen: /^(sc-domain:[a-z0-9.-]+\.[a-z]{2,}|https:\/\/[^\s]+)$/i, ornek: 'sc-domain:ornek.com', grup: 'Ölçüm' },
  merchant: { ad: 'Merchant Center', desen: /^\d{6,15}$/, ornek: 'Merchant kimliği', grup: 'Satış' },
  isletme_profili: { ad: 'Google İşletme Profili', desen: null, ornek: 'İşletme adı veya kimliği', grup: 'Satış' },
  eticaret: { ad: 'E-ticaret altyapısı (ikas, Ticimax…)', desen: null, ornek: 'Mağaza adresi', grup: 'Satış' },
  pazaryeri: { ad: 'Pazaryeri (Trendyol, Hepsiburada…)', desen: null, ornek: 'Satıcı kimliği', grup: 'Satış' },
  diger: { ad: 'Diğer', desen: null, ornek: '', grup: 'Diğer' }
};
export const ERISIM_TURU = { yonetici: 'Yönetici', standart: 'Standart', okuma: 'Salt okuma', is_ortagi: 'İş ortağı (portföy üzerinden)', sahip: 'Sahip (ajans adına açıldı)' };
export const ERISIM_DURUM = { bekliyor: 'Erişim istendi', aktif: 'Erişim var', kaldirildi: 'Erişim kaldırıldı' };

// Şifre/anahtar gibi görünen metinler hiçbir alanda kabul edilmez (yanlışlıkla yapıştırmaya karşı).
const GIZLI_DESEN = /(EAA[A-Za-z0-9]{20,}|ya29\.[\w-]{20,}|sk-[A-Za-z0-9-]{20,}|AIza[\w-]{30,}|-----BEGIN|(^|[^\p{L}])(şifre|sifre|parola|password|token)\s*[:=])/iu;
const sadeKimlik = (p, v) => (p === 'meta_reklam' ? v.replace(/^act_/, '') : p === 'search_console' ? v.toLowerCase() : v);
const rakam = (v) => String(v || '').replace(/\D/g, '');

async function dogrula(db, g) {
  const platform = g.platform, p = PLATFORMLAR[platform];
  if (!p) return { h: 'Platform seçin' };
  const musteri = kirp(g.musteri_id, 64);
  if (!musteri || !(await db.prepare('SELECT id FROM musteriler WHERE id = ?').bind(musteri).first())) return { h: 'Müşteri seçin (CRM’de kayıtlı olmalı)' };
  const ad = kirp(g.hesap_adi, 160), kim_ = kirp(g.hesap_kimligi, 200).replace(/\s+/g, ''), sahibi = kirp(g.erisim_sahibi, 200), not = kirp(g.not, 2000);
  if (!ad && !kim_) return { h: 'Hesap adı ya da kimliği gerekli' };
  if (kim_ && p.desen && !p.desen.test(kim_)) return { h: `${p.ad} kimliği beklenen biçimde değil (ör. ${p.ornek})` };
  if ([ad, kim_, sahibi, not].some((x) => GIZLI_DESEN.test(x))) return { h: 'Şifre ya da erişim anahtarı gibi görünen bir metin var. Envantere şifre ve anahtar yazılmaz; yalnız hesap adı ve kimliği girin.' };
  if (!ERISIM_TURU[g.erisim_turu]) return { h: 'Erişim türünü seçin' };
  if (!ERISIM_DURUM[g.durum]) return { h: 'Erişim durumunu seçin' };
  const verilis = kirp(g.verilis, 10), kaldirilma = kirp(g.kaldirilma, 10);
  if (verilis && !gecerliTarih(verilis)) return { h: 'Erişim tarihi geçersiz' };
  if (kaldirilma && !gecerliTarih(kaldirilma)) return { h: 'Kaldırılma tarihi geçersiz' };
  if (g.durum === 'kaldirildi' && !kaldirilma) return { h: 'Erişim kaldırıldıysa kaldırılma tarihini girin' };
  if (verilis && kaldirilma && kaldirilma < verilis) return { h: 'Kaldırılma tarihi erişim tarihinden önce olamaz' };
  return { v: { musteri_id: musteri, platform, hesap_adi: ad || null, hesap_kimligi: kim_ ? sadeKimlik(platform, kim_) : null, erisim_turu: g.erisim_turu,
    erisim_sahibi: sahibi || null, durum: g.durum, verilis: verilis || null, kaldirilma: g.durum === 'kaldirildi' ? kaldirilma : null, not: not || null } };
}

// Aynı platform + kimlik başka bir müşteride kayıtlıysa engellenir: hesap karışıklığının en sık nedeni.
async function cakisma(db, v, haric) {
  if (!v.hesap_kimligi) return null;
  const r = await db.prepare(`SELECT e.id, m.firma, m.ad FROM hesap_envanteri e LEFT JOIN musteriler m ON m.id = e.musteri_id
    WHERE e.platform = ? AND e.hesap_kimligi = ? AND e.musteri_id != ? AND e.id != ? LIMIT 1`).bind(v.platform, v.hesap_kimligi, v.musteri_id, haric || '').first();
  return r ? `Bu ${PLATFORMLAR[v.platform].ad} kimliği zaten “${r.firma || r.ad || 'başka bir müşteri'}” kaydında. Aynı hesap iki müşteriye yazılamaz; önce doğru müşteriyi kontrol edin.` : null;
}

// Uyarılar: biten müşteride açık erişim, uzun süredir bekleyen erişim isteği, IDOS eşleşmesiyle çelişen hesap.
export async function envanterUyarilari(db) {
  const yediGunOnce = new Date(Date.now() + 3 * 3600000 - 7 * 86400000).toISOString().slice(0, 10);
  const [kayip, bekleyen, idos] = await db.batch([
    db.prepare(`SELECT e.id, e.platform, e.hesap_adi, e.hesap_kimligi, e.musteri_id, m.firma, m.ad FROM hesap_envanteri e JOIN musteriler m ON m.id = e.musteri_id
      WHERE e.durum = 'aktif' AND m.asama = 'kaybedildi'`),
    db.prepare(`SELECT e.id, e.platform, e.hesap_adi, e.hesap_kimligi, e.musteri_id, m.firma, m.ad FROM hesap_envanteri e LEFT JOIN musteriler m ON m.id = e.musteri_id
      WHERE e.durum = 'bekliyor' AND COALESCE(e.verilis, substr(e.olusturma, 1, 10)) < ?`).bind(yediGunOnce),
    db.prepare(`SELECT e.id, e.platform, e.hesap_adi, e.hesap_kimligi, e.musteri_id, m.firma, m.ad, r.musteri_id AS idos_musteri, rm.firma AS idos_firma, rm.ad AS idos_ad
      FROM hesap_envanteri e LEFT JOIN musteriler m ON m.id = e.musteri_id
      JOIN reklam_eslesme r ON replace(replace(r.hesap, '-', ''), 'act_', '') = replace(replace(e.hesap_kimligi, '-', ''), 'act_', '')
      LEFT JOIN musteriler rm ON rm.id = r.musteri_id
      WHERE e.platform IN ('google_ads', 'meta_reklam', 'tiktok') AND e.hesap_kimligi IS NOT NULL AND r.musteri_id != e.musteri_id`)
  ]);
  const ad = (x) => x.firma || x.ad || 'Adsız müşteri';
  const etiket = (x) => `${PLATFORMLAR[x.platform]?.ad || x.platform}${x.hesap_kimligi ? ' · ' + x.hesap_kimligi : x.hesap_adi ? ' · ' + x.hesap_adi : ''}`;
  return [
    ...kayip.results.map((x) => ({ tur: 'kayip', id: x.id, musteri_id: x.musteri_id, onem: 'kritik', baslik: `${ad(x)}: çalışma bitti ama erişim açık`, detay: `${etiket(x)} — erişimi kaldırıp kaydı güncelleyin.` })),
    ...bekleyen.results.map((x) => ({ tur: 'bekleyen', id: x.id, musteri_id: x.musteri_id, onem: 'normal', baslik: `${ad(x)}: erişim isteği 7 günden uzun süredir bekliyor`, detay: etiket(x) })),
    ...idos.results.map((x) => ({ tur: 'idos', id: x.id, musteri_id: x.musteri_id, onem: 'kritik', baslik: `${etiket(x)}: IDOS eşleşmesiyle çelişiyor`, detay: `Envanterde “${ad(x)}”, IDOS eşitlemede “${x.idos_firma || x.idos_ad || 'başka müşteri'}”. Hangisinin doğru olduğunu kontrol edin.` }))
  ];
}

export async function yonetimEnvanterApi(db, yontem, yol, govde, kim) {
  if (!(yol === 'envanter' || yol.startsWith('envanter/'))) return null;
  if (yol === 'envanter' && yontem === 'GET') {
    const [r, m] = await db.batch([
      db.prepare(`SELECT e.*, m.firma AS musteri_firma, m.ad AS musteri_ad, m.asama AS musteri_asama FROM hesap_envanteri e LEFT JOIN musteriler m ON m.id = e.musteri_id
        ORDER BY COALESCE(m.firma, m.ad), e.platform, e.hesap_adi LIMIT 5000`),
      db.prepare('SELECT id, firma, ad FROM musteriler ORDER BY COALESCE(firma, ad, eposta)')
    ]);
    return json({ ok: true, platformlar: Object.fromEntries(Object.entries(PLATFORMLAR).map(([k, p]) => [k, { ad: p.ad, ornek: p.ornek, grup: p.grup }])),
      erisimTurleri: ERISIM_TURU, durumlar: ERISIM_DURUM, kayitlar: r.results, musteriler: m.results, uyarilar: await envanterUyarilari(db) });
  }
  let m = yol.match(/^envanter\/musteri\/([\w-]+)$/);
  if (m && yontem === 'GET') {
    const r = await db.prepare('SELECT * FROM hesap_envanteri WHERE musteri_id = ? ORDER BY platform, hesap_adi').bind(m[1]).all();
    return json({ ok: true, platformlar: Object.fromEntries(Object.entries(PLATFORMLAR).map(([k, p]) => [k, p.ad])), erisimTurleri: ERISIM_TURU, durumlar: ERISIM_DURUM, kayitlar: r.results });
  }
  if (yol === 'envanter' && yontem === 'POST') {
    const { v, h } = await dogrula(db, govde);
    if (h) return hata(h, 422);
    const c = await cakisma(db, v); if (c) return hata(c, 409);
    const id = kimlik(), z = simdi();
    await db.prepare(`INSERT INTO hesap_envanteri (id, musteri_id, platform, hesap_adi, hesap_kimligi, erisim_turu, erisim_sahibi, durum, verilis, kaldirilma, not_, olusturma, guncelleme, ekleyen)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(id, v.musteri_id, v.platform, v.hesap_adi, v.hesap_kimligi, v.erisim_turu, v.erisim_sahibi, v.durum, v.verilis, v.kaldirilma, v.not, z, z, kim.eposta).run();
    await islemYaz(db, kim.eposta, 'envanter_eklendi', id, `${PLATFORMLAR[v.platform].ad} · ${v.hesap_kimligi || v.hesap_adi}`);
    return json({ ok: true, id });
  }
  m = yol.match(/^envanter\/([\w-]+)(?:\/(sil))?$/);
  if (m && yontem === 'POST') {
    const k = await db.prepare('SELECT * FROM hesap_envanteri WHERE id = ?').bind(m[1]).first();
    if (!k) return hata('Kayıt bulunamadı', 404);
    if (m[2] === 'sil') {
      await db.prepare('DELETE FROM hesap_envanteri WHERE id = ?').bind(k.id).run();
      await islemYaz(db, kim.eposta, 'envanter_silindi', k.id, `${PLATFORMLAR[k.platform]?.ad || k.platform} · ${k.hesap_kimligi || k.hesap_adi}`);
      return json({ ok: true });
    }
    const { v, h } = await dogrula(db, govde);
    if (h) return hata(h, 422);
    const c = await cakisma(db, v, k.id); if (c) return hata(c, 409);
    await db.prepare(`UPDATE hesap_envanteri SET musteri_id = ?, platform = ?, hesap_adi = ?, hesap_kimligi = ?, erisim_turu = ?, erisim_sahibi = ?, durum = ?, verilis = ?, kaldirilma = ?, not_ = ?, guncelleme = ? WHERE id = ?`)
      .bind(v.musteri_id, v.platform, v.hesap_adi, v.hesap_kimligi, v.erisim_turu, v.erisim_sahibi, v.durum, v.verilis, v.kaldirilma, v.not, simdi(), k.id).run();
    const deg = k.durum !== v.durum ? ` · ${ERISIM_DURUM[k.durum]} → ${ERISIM_DURUM[v.durum]}` : '';
    await islemYaz(db, kim.eposta, 'envanter_guncellendi', k.id, `${PLATFORMLAR[v.platform].ad} · ${v.hesap_kimligi || v.hesap_adi}${deg}`);
    return json({ ok: true });
  }
  return hata('Bulunamadı', 404);
}
